const { chromium, launchOptions, previewURL } = require('./runtime.cjs');
const assert = require('node:assert/strict');

const origin = new URL(previewURL).origin;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ ...launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  const ready = async () => {
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  };
  const pathname = () => new URL(page.url()).pathname;

  // The root and the legacy file entry canonicalise to /home without a page
  // reload loop.
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/home', 'root must canonicalise to /home');
  assert.equal(await page.title(), 'WattDesk · Home');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(), true);

  await page.goto(`${origin}/home.html?glass=figma`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/home', 'legacy home.html must canonicalise to /home');
  assert.equal(new URL(page.url()).search, '?glass=figma', 'canonicalisation must preserve query state');

  // Sidebar navigation writes /plants; refresh keeps the list.
  await page.locator('.target-nav[data-route="plants"]').click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/plants');
  assert.equal(await page.title(), 'WattDesk · Plants');
  assert.equal(await page.locator('.plants-view').isVisible(), true);
  assert.equal(await page.locator('.plants-table').isVisible(), true);
  assert.equal(await page.locator('.workspace-tab.selected .workspace-tab-label').textContent(), 'Plants');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/plants', 'refresh on /plants must stay on Plants');
  assert.equal(await page.locator('.plants-table').isVisible(), true);

  // The preview now carries enough rows to make the scroll indicator useful,
  // and its hover treatment follows the shared enter/leave motion contract.
  assert.equal(await page.locator('.plants-row').count(), 46);
  const scrollUi = await page.evaluate(() => {
    const scroll = document.querySelector('.plants-table-scroll');
    const track = document.querySelector('.plants-scroll-indicator');
    const thumb = document.querySelector('.plants-scroll-indicator-thumb');
    return {
      scroll: scroll.getBoundingClientRect().toJSON(),
      track: track.getBoundingClientRect().toJSON(),
      thumb: thumb.getBoundingClientRect().toJSON(),
      width: getComputedStyle(thumb).width
    };
  });
  assert.equal(Math.round(scrollUi.track.width), 10);
  assert.equal(scrollUi.track.top, scrollUi.scroll.top);
  assert.equal(scrollUi.track.bottom, scrollUi.scroll.bottom);
  assert.ok(scrollUi.thumb.height < scrollUi.track.height * .7, 'the longer sample list must shorten the scrollbar thumb');
  assert.equal(scrollUi.width, '6px');
  await page.locator('.plants-scroll-indicator').hover();
  await page.waitForTimeout(30);
  const scrollHover = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('.plants-scroll-indicator-thumb'));
    return { duration: style.transitionDuration, easing: style.transitionTimingFunction };
  });
  assert.equal(scrollHover.duration, '0.24s');
  assert.equal(scrollHover.easing, 'cubic-bezier(0.16, 1, 0.3, 1)');
  await page.waitForTimeout(240);
  assert.ok(
    await page.locator('.plants-scroll-indicator-thumb').evaluate(element => Number.parseFloat(getComputedStyle(element).width)) >= 7.9
  );
  await page.mouse.move(700, 700);
  await page.waitForTimeout(30);
  assert.equal(
    await page.locator('.plants-scroll-indicator-thumb').evaluate(element => getComputedStyle(element).transitionDuration),
    '0.36s'
  );

  const thumbBox = await page.locator('.plants-scroll-indicator-thumb').boundingBox();
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2 + 100, { steps: 5 });
  await page.mouse.up();
  assert.ok(await page.locator('.plants-table-scroll').evaluate(element => element.scrollTop) > 0, 'the custom scrollbar thumb must be draggable');

  const pullWheel = (times, deltaY = -180) => page.locator('.plants-table-scroll').evaluate((element, options) => {
    element.scrollTop = options.deltaY < 0 ? 0 : element.scrollHeight;
    for (let index = 0; index < options.count; index += 1) {
      element.dispatchEvent(new WheelEvent('wheel', { deltaY: options.deltaY, bubbles: true, cancelable: true }));
    }
  }, { count: times, deltaY });
  await pullWheel(1);
  await page.waitForTimeout(80);
  assert.ok(
    await page.locator('.plants-table-pull-region--start').evaluate(element => Number.parseFloat(getComputedStyle(element).height)) <= 1,
    'the first overscroll gesture must feel sticky before revealing the gap'
  );
  await pullWheel(4);
  await page.waitForTimeout(120);
  const pulled = await page.evaluate(() => {
    const surface = document.querySelector('.plants-table-pull-region--start');
    return {
      height: Number.parseFloat(getComputedStyle(surface).height),
      background: getComputedStyle(surface).backgroundColor
    };
  });
  assert.ok(pulled.height > 0, 'pulling past the top must reveal the elastic surface');
  assert.ok(pulled.height <= 16, 'the elastic pull range must stay restrained');
  assert.notEqual(pulled.background, 'rgb(255, 255, 255)', 'the elastic region must use the page surface, not white');
  await page.waitForTimeout(140);
  assert.deepEqual(
    await page.locator('.plants-table').evaluate(element => {
      const timing = element.getAnimations()[0]?.effect?.getTiming();
      return timing ? { duration: timing.duration, easing: timing.easing } : null;
    }),
    { duration: 640, easing: 'cubic-bezier(0.18, 1.12, 0.3, 1)' }
  );
  await page.waitForTimeout(720);
  assert.equal(
    await page.locator('.plants-table-pull-region--start').evaluate(element => getComputedStyle(element).height),
    '0px',
    'the elastic surface must settle back after release'
  );

  await pullWheel(1, 180);
  await page.waitForTimeout(80);
  assert.ok(
    await page.locator('.plants-table-pull-region--end').evaluate(element => Number.parseFloat(getComputedStyle(element).height)) <= 1,
    'the bottom edge must have the same sticky entry'
  );
  await pullWheel(4, 180);
  await page.waitForTimeout(120);
  const pulledEnd = await page.evaluate(() => {
    const surface = document.querySelector('.plants-table-pull-region--end');
    const table = document.querySelector('.plants-table');
    return {
      height: Number.parseFloat(getComputedStyle(surface).height),
      background: getComputedStyle(surface).backgroundColor,
      offsetY: new DOMMatrix(getComputedStyle(table).transform).m42
    };
  });
  assert.ok(pulledEnd.height > 0 && pulledEnd.height <= 16, 'the bottom blank area must stay restrained');
  assert.equal(pulledEnd.background, pulled.background, 'top and bottom overscroll must share the same surface');
  assert.ok(pulledEnd.offsetY < 0, 'bottom overscroll must pull the table upward');
  const bottomScrollbar = await page.evaluate(() => {
    const scroll = document.querySelector('.plants-table-scroll').getBoundingClientRect();
    const track = document.querySelector('.plants-scroll-indicator').getBoundingClientRect();
    const thumb = document.querySelector('.plants-scroll-indicator-thumb').getBoundingClientRect();
    return { scrollTop: scroll.top, scrollBottom: scroll.bottom, trackTop: track.top, trackBottom: track.bottom, thumbBottom: thumb.bottom };
  });
  assert.equal(bottomScrollbar.trackTop, bottomScrollbar.scrollTop);
  assert.equal(bottomScrollbar.trackBottom, bottomScrollbar.scrollBottom);
  assert.equal(bottomScrollbar.thumbBottom, bottomScrollbar.trackBottom);
  await page.waitForTimeout(880);

  // Each tab keeps its own location; the URL follows the active tab.
  await page.locator('.target-add-tab').click();
  await page.waitForTimeout(420);
  assert.equal(await page.locator('.workspace-tab').count(), 2);
  assert.equal(pathname(), '/home', 'a new Home tab must publish /home');
  await page.locator('.workspace-tab').first().click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/plants', 'switching back to the Plants tab must restore /plants');
  assert.equal(await page.locator('.plants-table').isVisible(), true);
  await page.locator('.workspace-tab').nth(1).click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/home');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(), true);

  // In-app Back/Forward now writes the same canonical URL as direct
  // navigation instead of leaving the address bar behind.
  await page.locator('.target-nav[data-route="plants"]').click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/plants');
  await page.locator('.target-back').click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/home');
  await page.locator('.target-forward').click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/plants');

  // A named plant owns /plants/:id. The detail surface is a labelled preview
  // placeholder, but the URL, title and refresh behaviour are real.
  await page.locator('.plants-row[data-id="p02"]').click();
  await page.waitForTimeout(420);
  assert.equal(pathname(), '/plants/p02');
  assert.equal(await page.title(), 'WattDesk · Silvio Bräuer');
  assert.equal(await page.locator('.plants-detail').isVisible(), true);
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Silvio Bräuer');
  assert.equal(await page.locator('.target-nav[data-route="plants"]').getAttribute('aria-current'), 'page');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(), 'Plants');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/plants/p02', 'refresh on a plant detail must stay on that plant');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Silvio Bräuer');

  // Browser history follows the same locations.
  await page.goBack();
  await sleep(420);
  assert.equal(pathname(), '/plants');
  assert.equal(await page.locator('.plants-table').isVisible(), true);
  await page.goForward();
  await sleep(420);
  assert.equal(pathname(), '/plants/p02');
  assert.equal(await page.locator('.plants-detail').isVisible(), true);

  // Real routes without a page surface still persist their URL and Coming soon
  // state instead of falling back to Home.
  await page.goto(`${origin}/service`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/service');
  assert.equal(await page.title(), 'WattDesk · Service ticket');
  assert.equal(await page.locator('.wd-empty-state').isVisible(), true);
  assert.equal((await page.locator('.wd-empty-state-label').textContent()).trim(), 'Coming soon');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/service', 'refresh on a coming-soon route must keep that route');

  for (const [path, title] of [
    ['/statistics', 'Statistics'],
    ['/cell-balance', 'Cell balance'],
    ['/module-balance', 'Module balance'],
    ['/device-track', 'Device track'],
    ['/organisation', 'Wattsonic Technology'],
    ['/teams', 'Your teams'],
    ['/users', 'End users']
  ]) {
    await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
    await ready();
    assert.equal(pathname(), path);
    assert.equal(await page.title(), `WattDesk · ${title}`);
    assert.equal(await page.locator('.wd-empty-state').isVisible(), true);
    assert.equal((await page.locator('.wd-empty-state-label').textContent()).trim(), 'Coming soon');
  }

  // Direct deep links and unknown plant IDs are explicit, not Home fallbacks.
  await page.goto(`${origin}/plants/p03`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/plants/p03');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Lipovec');
  await page.goto(`${origin}/plants/not-a-plant`, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(pathname(), '/plants/not-a-plant');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Plant not found');
  assert.equal(await page.title(), 'WattDesk · Plant not found');

  // Bookmarking pins a plant to the top of the list. The pinned group keeps the
  // active column sort, the choice survives a reload, and removing the bookmark
  // returns the row to its normal position.
  await page.goto(`${origin}/plants`, { waitUntil: 'domcontentloaded' });
  await ready();
  await page.evaluate(() => localStorage.removeItem('wattdesk.plants.bookmarks.v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  const firstUnpinnedId = await page.locator('.plants-row').first().getAttribute('data-id');
  assert.notEqual(firstUnpinnedId, 'p24');
  const bookmark = page.locator('.plants-row[data-id="p24"] .plants-bookmark');
  await bookmark.focus();
  await page.keyboard.press('Enter');
  // Wait for the FLIP reorder to settle without tying the assertion to one
  // machine's frame timing.
  await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
  assert.equal(await page.locator('.plants-row').first().getAttribute('data-id'), 'p24');
  assert.equal(await page.locator('.plants-row[data-id="p24"] .plants-bookmark').getAttribute('aria-pressed'), 'true');
  assert.equal(
    await page.evaluate(() => document.activeElement?.closest('.plants-row')?.dataset.id),
    'p24',
    'keyboard focus must follow the pinned row'
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(await page.locator('.plants-row').first().getAttribute('data-id'), 'p24', 'a saved bookmark must stay pinned after reload');
  await page.locator('.plants-row[data-id="p24"] .plants-bookmark').click();
  await page.waitForTimeout(420);
  assert.equal(await page.locator('.plants-row').first().getAttribute('data-id'), firstUnpinnedId);
  assert.equal(await page.locator('.plants-row[data-id="p24"] .plants-bookmark').getAttribute('aria-pressed'), 'false');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(await page.locator('.plants-row').first().getAttribute('data-id'), firstUnpinnedId, 'removing a bookmark must restore the normal order');
  await page.evaluate(() => localStorage.removeItem('wattdesk.plants.bookmarks.v1'));

  // A direct load on Plants measures Home while it is hidden. Returning to
  // Home must reflow the absolute scene before paint so shortcuts, status
  // cards and statistics cannot keep the zero-height coordinates from boot.
  await page.goto(`${origin}/plants`, { waitUntil: 'domcontentloaded' });
  await ready();
  await page.locator('.target-nav[data-route="home"]').click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const homeFlow = await page.evaluate(() => {
    const rect = selector => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    };
    return {
      shortcuts: rect('[data-node-id="14612:7837"]'),
      status: rect('[data-node-id="14537:3942"]'),
      period: rect('[data-node-id="14557:831"]')
    };
  });
  assert.ok(homeFlow.status.top >= homeFlow.shortcuts.bottom + 39, 'status cards must not overlap shortcuts after route entry');
  assert.ok(homeFlow.period.top >= homeFlow.status.bottom + 39, 'statistics must not overlap status cards after route entry');

  // Wide panels give the metric columns progressively more breathing room
  // while the table keeps its 24px content inset. The scrollbar viewport itself
  // reaches the panel edge instead of stopping inside the content gutter.
  const plantsMetrics = () => page.evaluate(() => {
    const rect = element => {
      const box = element.getBoundingClientRect();
      return { right: box.right, width: box.width };
    };
    const view = document.querySelector('.plants-view');
    const scroll = document.querySelector('.plants-table-scroll');
    const table = document.querySelector('.plants-table');
    return {
      view: rect(view),
      scroll: rect(scroll),
      table: rect(table),
      overflow: scroll.scrollWidth - scroll.clientWidth,
      marginRight: getComputedStyle(scroll).marginRight,
      paddingRight: Number.parseFloat(getComputedStyle(scroll).paddingRight) || 0,
      scrollbarWidth: scroll.offsetWidth - scroll.clientWidth,
      overflowX: getComputedStyle(scroll).overflowX,
      overflowY: getComputedStyle(scroll).overflowY,
      columns: [...table.querySelectorAll('col')].map(column => Math.round(column.getBoundingClientRect().width))
    };
  });

  await page.setViewportSize({ width: 1545, height: 1080 });
  await page.goto(`${origin}/plants`, { waitUntil: 'domcontentloaded' });
  await ready();
  const compactMetrics = await plantsMetrics();
  assert.equal(compactMetrics.marginRight, '-14px');
  assert.equal(Math.round(compactMetrics.scroll.right), Math.round(compactMetrics.view.right - 10));
  assert.ok(
    Math.abs(
      compactMetrics.table.right -
      (compactMetrics.scroll.right - compactMetrics.paddingRight - compactMetrics.scrollbarWidth)
    ) < 1,
    'compact and wide layouts must keep the same table-content edge'
  );
  assert.equal(compactMetrics.overflow, 0);
  assert.equal(compactMetrics.overflowX, 'auto');
  assert.equal(compactMetrics.overflowY, 'scroll');

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${origin}/plants`, { waitUntil: 'domcontentloaded' });
  await ready();
  const wideMetrics = await plantsMetrics();
  assert.equal(Math.round(wideMetrics.scroll.right), Math.round(wideMetrics.view.right - 10));
  assert.ok(
    Math.abs(
      wideMetrics.table.right -
      (wideMetrics.scroll.right - wideMetrics.paddingRight - wideMetrics.scrollbarWidth)
    ) < 1,
    'the table content edge must remain independent of the outer scrollbar gap'
  );
  assert.equal(wideMetrics.marginRight, '-14px');
  assert.equal(wideMetrics.overflow, 0);
  assert.equal(wideMetrics.overflowX, 'auto');
  assert.equal(wideMetrics.overflowY, 'scroll');
  assert.ok(wideMetrics.columns[2] < 520, 'the plant name must not absorb nearly all wide-screen surplus');
  for (const index of [3, 4, 5, 6, 7, 8]) {
    assert.ok(
      wideMetrics.columns[index] > compactMetrics.columns[index],
      `wide-screen column ${index} should receive additional breathing room`
    );
  }

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, errors }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
