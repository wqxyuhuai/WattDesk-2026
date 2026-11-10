const { chromium, launchOptions, previewURL } = require('./runtime.cjs');
const assert = require('node:assert/strict');

const origin = new URL(previewURL).origin;
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));

(async () => {
  const browser = await chromium.launch({ ...launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${origin}/plants/p02`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'dark'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);

  assert.equal(await page.locator('.plant-overview').count(), 1, 'the plant overview mounts');
  assert.equal(await page.locator('.plant-overview .wd-glass:not(.wd-glass--static)').count(), 4, 'interactive controls keep their shared glass surfaces');
  assert.equal(await page.locator('.plant-overview-chart-readout.wd-glass--surface.wd-glass--static').count(), 3, 'each chart readout reuses the static Glass Surface branch');
  assert.equal(await page.locator('.plant-overview .wd-glass-material').count(), 7, 'shared glass material is mounted once per interactive control and readout');
  assert.equal(await page.locator('.plant-overview-stats.wd-glass,.plant-overview-context.wd-glass,.plant-overview-operations.wd-glass').count(), 0, 'static information surfaces do not use glass');
  assert.equal(await page.locator('.plant-overview-trend .wd-segmented-control.wd-glass').count(), 1, 'trend options share one glass track');
  assert.equal(await page.locator('.plant-overview-trend-switch').count(), 0, 'the page does not add a bespoke segmented-control class');
  assert.equal(await page.locator('.plant-overview-period-button.wd-glass').count(), 1, 'the Energy trend keeps the Home date control');
  assert.equal(await page.locator('.plant-statistics-period-control.wd-glass').count(), 1, 'Statistics uses its own multi-period glass control');
  assert.equal(await page.locator('.plant-overview-ticket-add.wd-glass').count(), 1, 'the New ticket action uses shared glass');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Silvio Bräuer');
  assert.deepEqual(await page.locator('.plants-detail-tab').allTextContents(), ['Overview', 'Devices', 'Site details']);
  assert.equal(await page.locator('.plants-detail-tab-list').evaluate(list => getComputedStyle(list).gap), '4px');
  assert.equal(await page.locator('.plants-detail-tab').first().getAttribute('aria-current'), 'page');
  assert.equal(await page.locator('.plants-detail-tab').nth(1).isDisabled(), false);
  assert.equal(await page.locator('.plants-detail-tab').nth(2).isDisabled(), false);
  const tabGeometry = await page.locator('.plants-detail-tab').first().evaluate(tab => ({
    height: tab.getBoundingClientRect().height,
    radius: getComputedStyle(tab).borderRadius
  }));
  assert.equal(tabGeometry.height, 36);
  assert.ok(Number.parseFloat(tabGeometry.radius) >= 34, 'section tabs use the pill radius');
  const tabLabelStyle = await page.locator('.plants-detail-tab .wd-control-label').first().evaluate(label => ({
    fontSize: getComputedStyle(label).fontSize,
    fontWeight: getComputedStyle(label).fontWeight
  }));
  assert.deepEqual(tabLabelStyle, {fontSize:'13px', fontWeight:'510'}, 'page tabs reuse the Service scope label style');
  const tabStates = await page.locator('.plants-detail-tab').evaluateAll(tabs => tabs.map(tab => ({
    background: getComputedStyle(tab).backgroundColor,
    border: getComputedStyle(tab).borderTopWidth,
    shadow: getComputedStyle(tab).boxShadow
  })));
  assert.ok(tabStates.every(tab => tab.border === '0px'), 'scope buttons do not draw a border');
  assert.ok(tabStates.every(tab => tab.background !== 'rgba(0, 0, 0, 0)'), 'all scope buttons use solid fill states');
  assert.notEqual(tabStates[0].shadow, 'none', 'the selected scope button uses the shared inset emphasis');
  assert.ok(tabStates.slice(1).every(tab => tab.shadow === 'none'), 'unselected tabs have no outline');
  const inactiveTab = page.locator('.plants-detail-tab').nth(2);
  const inactiveIdle = await inactiveTab.evaluate(tab => ({
    background: getComputedStyle(tab).backgroundColor,
    color: getComputedStyle(tab).color,
    labelColor: getComputedStyle(tab.querySelector('.wd-control-label')).color
  }));
  await inactiveTab.hover();
  await page.waitForTimeout(80);
  const inactiveHover = await inactiveTab.evaluate(tab => ({
    background: getComputedStyle(tab).backgroundColor,
    color: getComputedStyle(tab).color,
    labelColor: getComputedStyle(tab.querySelector('.wd-control-label')).color,
    scale: getComputedStyle(tab).transform === 'none' ? 1 : new DOMMatrixReadOnly(getComputedStyle(tab).transform).a
  }));
  assert.equal(inactiveIdle.labelColor, inactiveIdle.color, 'tab label inherits the same scope color');
  assert.notDeepEqual(inactiveHover, inactiveIdle, 'unselected scope tabs provide the shared hover feedback');
  assert.ok(inactiveHover.scale > 1.03, 'scope tabs visibly enlarge on hover');
  await page.mouse.move(0, 0);
  const tabHostPadding = await page.locator('.plants-detail-tabs-host').evaluate(host => ({
    top: getComputedStyle(host).paddingTop,
    bottom: getComputedStyle(host).paddingBottom
  }));
  assert.deepEqual(tabHostPadding, {top:'16px', bottom:'14px'}, 'scope tab row reuses the Service toolbar vertical rhythm');
  assert.equal(await page.locator('.plants-detail-tabs-host').evaluate(host => getComputedStyle(host).borderBottomWidth), '0px');
  assert.equal(await page.getByText('Current device', { exact: true }).count(), 0);
  assert.equal(await page.getByText('Whole plant', { exact: true }).count(), 0);
  const overviewLayout = await page.evaluate(() => {
    const viewport = document.querySelector('.plants-detail-viewport').getBoundingClientRect();
    const overview = document.querySelector('.plant-overview').getBoundingClientRect();
    const stats = document.querySelector('.plant-overview-stats').getBoundingClientRect();
    const trend = document.querySelector('.plant-overview-trend').getBoundingClientRect();
    return {
      viewportHeight: viewport.height,
      overviewHeight: overview.height,
      statsLeft: stats.left,
      statsRight: stats.right,
      trendLeft: trend.left,
      trendRight: trend.right,
      viewportLeft: viewport.left,
      viewportRight: viewport.right
    };
  });
  assert.ok(Math.abs(overviewLayout.overviewHeight - overviewLayout.viewportHeight) < 48, 'the overview fills the available vertical canvas');
  assert.ok(Math.abs(overviewLayout.statsLeft - overviewLayout.viewportLeft) < 34, 'the summary starts at the page content edge');
  assert.ok(Math.abs(overviewLayout.statsRight - overviewLayout.viewportRight) < 34, 'the summary reaches the opposite page edge');
  assert.ok(Math.abs(overviewLayout.trendLeft - overviewLayout.viewportLeft) < 34, 'the chart starts at the page content edge');
  assert.ok(Math.abs(overviewLayout.trendRight - overviewLayout.viewportRight) < 34, 'the chart reaches the opposite page edge');
  const structuralBorders = await page.evaluate(() => {
    const frame = selector => {
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      return {
        borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        background: style.backgroundColor,
        radius: style.borderRadius
      };
    };
    return {
      flow: getComputedStyle(document.querySelector('.plant-overview-flow')).borderTopWidth,
      operations: getComputedStyle(document.querySelector('.plant-overview-operations')).borderLeftWidth,
      statistics: frame('.plant-overview-day-statistics'),
      trend: frame('.plant-overview-trend')
    };
  });
  assert.deepEqual({flow: structuralBorders.flow, operations: structuralBorders.operations}, {flow:'0px', operations:'0px'}, 'the main canvas and operations rail keep their existing structure');
  const statisticsFrame = {borders:['2px','0px','0px','0px'], padding:['20px','0px','6px','0px'], background:'rgba(0, 0, 0, 0)', radius:'0px'};
  const trendFrame = {borders:['2px','0px','0px','0px'], padding:['20px','0px','0px','0px'], background:'rgba(0, 0, 0, 0)', radius:'0px'};
  assert.deepEqual(structuralBorders.statistics, statisticsFrame, 'statistics uses a stronger top separator with balanced vertical padding');
  assert.deepEqual(structuralBorders.trend, trendFrame, 'energy trend uses the same separator while removing bottom slack');

  const favorite = page.locator('.plants-detail-favorite');
  const favoriteGeometry = await page.evaluate(() => {
    const title = document.querySelector('.plants-detail-heading .wd-page-breadcrumb-current').getBoundingClientRect();
    const button = document.querySelector('.plants-detail-favorite').getBoundingClientRect();
    const glyph = document.querySelector('.plants-detail-favorite .plants-bookmark-glyph').getBoundingClientRect();
    return {
      gap: button.left - title.right,
      titleCenter: title.top + title.height / 2,
      glyphCenter: glyph.top + glyph.height / 2,
      pressScale: document.querySelector('.plants-detail-favorite-glyph-frame').classList.contains('wd-press-scale')
    };
  });
  assert.ok(favoriteGeometry.gap >= 0 && favoriteGeometry.gap <= 5, 'favorite follows the title with compact spacing');
  assert.ok(Math.abs(favoriteGeometry.titleCenter - favoriteGeometry.glyphCenter) <= 1, 'favorite glyph is vertically aligned with the title');
  assert.equal(favoriteGeometry.pressScale, true, 'favorite uses the shared non-glass press feedback');
  assert.equal(await favorite.getAttribute('aria-pressed'), 'false');
  const favoriteBox = await favorite.boundingBox();
  await page.mouse.move(favoriteBox.x + favoriteBox.width / 2, favoriteBox.y + favoriteBox.height / 2);
  await page.waitForTimeout(140);
  const favoriteHover = await favorite.evaluate(element => {
    const glyph = element.querySelector('.plants-detail-favorite-glyph-frame');
    const transform = getComputedStyle(glyph).transform;
    const rect = glyph.getBoundingClientRect();
    const button = element.getBoundingClientRect();
    return {
      scale: transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a,
      centerX: rect.left + rect.width / 2,
      buttonCenterX: button.left + button.width / 2
    };
  });
  assert.ok(favoriteHover.scale > 1.2, 'favorite icon uses a visible hover enlargement');
  assert.ok(Math.abs(favoriteHover.centerX - favoriteHover.buttonCenterX) < 1, 'favorite icon retains the button center while enlarging');
  await page.mouse.down();
  await page.waitForTimeout(140);
  const favoritePressScale = await favorite.evaluate(element => {
    const transform = getComputedStyle(element.querySelector('.plants-detail-favorite-glyph-frame')).transform;
    return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
  });
  await page.mouse.up();
  assert.ok(favoritePressScale > 1.3, 'favorite icon uses the shared press enlargement');
  assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('wattdesk.plants.bookmarks.v1') || '[]').includes('p02')));

  const rail = page.locator('.plant-overview-device-rail');
  assert.equal(await rail.count(), 1, 'multiple devices expose the selector');
  assert.equal(await rail.locator('.plant-overview-device').count(), 2);
  assert.equal(await rail.locator('.plant-overview-device').first().getAttribute('aria-pressed'), 'true');

  assert.equal(await page.locator('.plant-overview-context').count(), 1, 'site context uses the horizontal strip');
  const p02Context = await page.locator('.plant-overview-context-item').allTextContents();
  assert.equal(p02Context.length, 4, 'site context keeps status, communications, weather and location');
  assert.equal(p02Context[0], 'Plant normal');
  assert.equal(p02Context[1], 'Comms online');
  assert.match(p02Context[2], /^-?\d+°C · /);
  assert.match(p02Context[3], /, Germany · \d{2}:\d{2}$/);
  assert.deepEqual(
    await page.locator('.plant-overview-context-group').evaluateAll(groups => groups.map(group => ({
      label:group.getAttribute('aria-label'),
      items:group.querySelectorAll('.plant-overview-context-item').length
    }))),
    [
      {label:'System status',items:2},
      {label:'Site environment',items:2}
    ],
    'site context separates operational status from environmental context'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-context').evaluate(context => ({
      background:getComputedStyle(context).backgroundColor,
      radius:getComputedStyle(context).borderRadius
    })),
    {background:'rgba(0, 0, 0, 0)', radius:'0px'},
    'site context keeps its information but has no panel background'
  );
  assert.equal(await page.locator('.plant-overview-operations > section').count(), 3, 'operations rail has three distinct sections');
  const operationCardGaps = await page.locator('.plant-overview-operations > section').evaluateAll(cards => cards.slice(1).map((card,index) => {
    const previous = cards[index].getBoundingClientRect();
    const current = card.getBoundingClientRect();
    return current.top - previous.bottom;
  }));
  assert.ok(operationCardGaps.every(gap => gap >= 6), 'Fault & Warning, System Log and Service Tickets remain separate cards');
  const contextOperationsGeometry = await page.evaluate(() => {
    const context = document.querySelector('.plant-overview-context').getBoundingClientRect();
    const operations = document.querySelector('.plant-overview-operations').getBoundingClientRect();
    const flow = document.querySelector('.plant-overview-flow').getBoundingClientRect();
    return {
      contextTop: context.top,
      contextRight: context.right,
      operationsTop: operations.top,
      operationsLeft: operations.left,
      operationsBottom: operations.bottom,
      flowBottom: flow.bottom
    };
  });
  assert.ok(Math.abs(contextOperationsGeometry.operationsTop - contextOperationsGeometry.contextTop) < 1, 'operations rail starts level with the page status strip');
  assert.ok(contextOperationsGeometry.contextRight <= contextOperationsGeometry.operationsLeft + 1, 'status strip stops before the operations column');
  assert.ok(Math.abs(contextOperationsGeometry.operationsBottom - contextOperationsGeometry.flowBottom) < 2, 'operations rail aligns with the energy-flow row');
  assert.deepEqual(
    await page.locator('.plant-overview-ops-label').allTextContents(),
    ['Fault & warning', 'System log', 'Service tickets']
  );
  assert.equal(await page.locator('.plant-overview-operations').getByText('Clear', {exact:true}).count(), 0, 'the fault card no longer exposes a Clear action');
  const opsCards = page.locator('.plant-overview-ops-section');
  assert.equal(await opsCards.count(), 3);
  assert.equal(await opsCards.evaluateAll(cards => cards.every(card => card.classList.contains('wd-discussion-card'))), true, 'operations cards reuse the shared discussion-card material');
  assert.deepEqual(
    await opsCards.evaluateAll(cards => cards.map(card => card.querySelectorAll(':scope > .plant-overview-ops-body').length)),
    [1,1,1],
    'all operations cards share one body region below the title row'
  );
  const opsHeights = await opsCards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().height));
  assert.ok(Math.max(...opsHeights) - Math.min(...opsHeights) < 1, 'the three operations cards divide the rail height equally');
  const addTicket = page.locator('.plant-overview-ticket-add');
  assert.deepEqual(
    await addTicket.evaluate(button => {
      const box = button.getBoundingClientRect();
      const card = button.closest('.plant-overview-ops-section').getBoundingClientRect();
      const title = button.closest('.plant-overview-ops-head').querySelector('.plant-overview-ops-label').getBoundingClientRect();
      return {
        width:box.width,
        height:box.height,
        topInset:box.top-card.top,
        rightInset:card.right-box.right,
        titleCenterDelta:(box.top+box.height/2)-(title.top+title.height/2),
        inHeader:button.closest('.plant-overview-ops-head')?.classList.contains('plant-overview-ops-head'),
        glass:button.classList.contains('wd-glass'),
        radius:getComputedStyle(button).borderRadius
      };
    }),
    {width:36, height:36, topInset:6, rightInset:6, titleCenterDelta:3, inHeader:true, glass:true, radius:'50%'},
    'the ticket add action is a 36px circular glass control in the card header'
  );
  assert.deepEqual(
    await opsCards.evaluateAll(cards => cards.map(card => {
      const cardBox = card.getBoundingClientRect();
      const title = card.querySelector('.plant-overview-ops-label').getBoundingClientRect();
      return {top:title.top-cardBox.top, left:title.left-cardBox.left, radius:getComputedStyle(card).borderRadius};
    })),
    Array.from({length:3}, () => ({top:12, left:16, radius:'24px'})),
    'all card titles use the same top and left inset with the larger card radius'
  );
  const firstOpsGap = await page.evaluate(() => {
    const card = document.querySelector('.plant-overview-faults');
    const title = card.querySelector('.plant-overview-ops-label').getBoundingClientRect();
    const content = card.querySelector('.plant-overview-fault-row').getBoundingClientRect();
    return content.top-title.bottom;
  });
  assert.ok(firstOpsGap >= 12, 'the gap between the card title and content remains stable after the optical lift');
  assert.deepEqual(
    await page.evaluate(() => {
      const read = selector => getComputedStyle(document.querySelector(selector));
      return {
        label:read('.plant-overview-ops-label').fontSize,
        labelWeight:read('.plant-overview-ops-label').fontWeight,
        title:read('.plant-overview-row-title').fontSize,
        meta:read('.plant-overview-row-meta').fontSize,
        log:read('.plant-overview-log-time').fontSize
      };
    }),
    {label:'13px', labelWeight:'510', title:'13px', meta:'12px', log:'12px'},
    'operations card typography uses the larger readable scale'
  );
  assert.equal(await page.locator('.plant-overview-terminal').count(), 0, 'the system log has no nested terminal rectangle');
  assert.equal(await page.locator('.plant-overview-log-section .plant-overview-log-row').count() > 0, true, 'log rows sit inside the shared discussion-card surface');
  assert.equal(await page.locator('.plant-overview-log-row').count(), 5, 'the system log includes enough placeholder rows to inspect wrapping');
  const logRowStyle = await page.locator('.plant-overview-log-row').first().evaluate(row => ({
    display:getComputedStyle(row).display,
    columns:getComputedStyle(row).gridTemplateColumns
  }));
  assert.deepEqual(logRowStyle, {display:'block', columns:'none'}, 'log entries flow inline without fixed column widths');
  assert.deepEqual(
    await page.locator('.plant-overview-log-message').first().evaluate(message => {
      const style = getComputedStyle(message);
      return {whiteSpace:style.whiteSpace, overflowWrap:style.overflowWrap, textOverflow:style.textOverflow, fontFamily:style.fontFamily};
    }),
    {whiteSpace:'normal', overflowWrap:'anywhere', textOverflow:'clip', fontFamily:'ui-monospace, SFMono-Regular, Consolas, monospace'},
    'log messages use code typography and wrap without an ellipsis'
  );
  const logColors = await page.locator('.plant-overview-log-row').first().evaluate(row => ({
    time:getComputedStyle(row.querySelector('.plant-overview-log-time')).color,
    device:getComputedStyle(row.querySelector('.plant-overview-log-device')).color,
    message:getComputedStyle(row.querySelector('.plant-overview-log-message')).color
  }));
  assert.equal(new Set(Object.values(logColors)).size, 3, 'log timestamps, devices and messages keep distinct colors');
  const logScroll = await page.evaluate(() => {
    const viewport = document.querySelector('.plant-overview-log-viewport');
    return {overflow:viewport.scrollHeight-viewport.clientHeight, track:document.querySelectorAll('.plant-overview-log-body > .wd-scroll-feedback').length};
  });
  assert.ok(logScroll.overflow > 0 && logScroll.track === 1, 'extra log placeholders use the shared internal scroll rail');
  const emptyFaultLayout = await page.evaluate(() => {
    const card = document.querySelector('.plant-overview-faults');
    const head = card.querySelector('.plant-overview-ops-head').getBoundingClientRect();
    const row = card.querySelector('.plant-overview-fault-row').getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {rowCenter:row.top+row.height/2, bodyCenter:(head.bottom+cardBox.bottom-12)/2, offset:getComputedStyle(card.querySelector('.plant-overview-fault-row')).transform};
  });
  assert.ok(Math.abs(emptyFaultLayout.rowCenter-emptyFaultLayout.bodyCenter) < 1, 'the no-fault group stays centered with a slight upward optical offset');
  assert.equal(emptyFaultLayout.offset, 'matrix(1, 0, 0, 1, 0, -6)');
  const logTimes = await page.locator('.plant-overview-log-time').allTextContents();
  assert.ok(logTimes.every(value => /^\d{2}:\d{2}:\d{2}$/.test(value)), 'system log uses precise clock timestamps');
  assert.equal(await page.locator('.plant-overview-ticket').first().isVisible(), true, 'linked ticket is visible outside a menu');
  await opsCards.first().hover();
  await page.waitForTimeout(320);
  assert.ok(
    await opsCards.first().evaluate(card => {
      const transform = getComputedStyle(card).transform;
      return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
    }) > 1.01,
    'operations cards visibly enlarge on hover'
  );
  const tabsBeforeSection = await page.locator('.workspace-tab').count();
  const overviewPlantCrumbLeft = await page.locator('.plants-detail .wd-page-breadcrumb-item').nth(1).evaluate(item => item.getBoundingClientRect().left);
  await opsCards.first().click();
  await page.waitForTimeout(240);
  assert.match(page.url(), /\/plants\/p02\/faults\?device=inverter$/);
  assert.equal(await page.locator('.workspace-tab').count(), tabsBeforeSection, 'plant child pages open inside the current tab');
  assert.deepEqual(
    await page.locator('.plants-detail .wd-page-breadcrumb-item').evaluateAll(items => items.map(item => item.textContent.trim())),
    ['Plants', 'Silvio Bräuer', 'Fault & warning'],
    'child pages add one breadcrumb level'
  );
  assert.equal((await page.locator('.plant-overview-subpage-title').textContent()).trim(), 'Fault & warning');
  assert.equal(await page.locator('.plants-detail-tabs-host').isVisible(), false, 'child pages hide the Overview/Devices/Site details tabs');
  const childPlaceholderLayout = await page.evaluate(() => {
    const inner = document.querySelector('.plants-detail-inner').getBoundingClientRect();
    const placeholder = document.querySelector('.plant-overview-subpage').getBoundingClientRect();
    return {
      xDelta:(placeholder.left+placeholder.width/2)-(inner.left+inner.width/2),
      yDelta:(placeholder.top+placeholder.height/2)-(inner.top+inner.height/2)
    };
  });
  assert.ok(Math.abs(childPlaceholderLayout.xDelta) < 1 && Math.abs(childPlaceholderLayout.yDelta) < 1, 'child-page placeholder is centered in the full content viewport');
  assert.equal(
    await page.locator('.plants-detail .wd-page-breadcrumb-item').nth(1).evaluate(item => item.getBoundingClientRect().left),
    overviewPlantCrumbLeft,
    'the plant name keeps the same starting position on child pages'
  );
  assert.equal(await page.locator('.plants-detail-favorite').count(), 1, 'the plant favorite remains available on child pages');
  assert.equal(
    await page.evaluate(() => {
      const link = document.querySelectorAll('.plants-detail .wd-page-breadcrumb-link')[1];
      const favorite = document.querySelector('.plants-detail-favorite');
      const linkBox = link.getBoundingClientRect();
      const paddingRight = Number.parseFloat(getComputedStyle(link).paddingRight);
      return Math.abs(favorite.getBoundingClientRect().left-(linkBox.right-paddingRight)) < .5;
    }),
    true,
    'the child-page favorite keeps the same compact spacing after the plant name'
  );
  const childPlantLink = page.locator('.plants-detail .wd-page-breadcrumb-link').nth(1);
  await childPlantLink.hover();
  await page.waitForTimeout(260);
  assert.deepEqual(
    await childPlantLink.evaluate(link => {
      const style = getComputedStyle(link);
      return {paddingLeft:style.paddingLeft, paddingRight:style.paddingRight};
    }),
    {paddingLeft:'8px', paddingRight:'8px'},
    'the clickable parent keeps symmetric hover-cap spacing like Plants'
  );
  assert.equal(
    await childPlantLink.evaluate(link => {
      const separator = link.closest('.wd-page-breadcrumb-item').previousElementSibling.getBoundingClientRect();
      return link.getBoundingClientRect().left >= separator.right - .5;
    }),
    true,
    'the parent breadcrumb hover surface does not overlap the left separator'
  );
  await page.locator('.plants-detail .wd-page-breadcrumb-link').nth(1).click();
  await page.waitForTimeout(240);
  assert.match(page.url(), /\/plants\/p02\?device=inverter$/);
  assert.equal(await page.locator('.plant-overview').isVisible(), true);
  for(const [card,slug,label] of [
    [opsCards.nth(1), 'logs', 'System log'],
    [page.locator('.plant-overview-ticket-section .plant-overview-ops-label'), 'tickets', 'Service tickets']
  ]){
    await card.click();
    await page.waitForTimeout(240);
    assert.match(page.url(), new RegExp(`/plants/p02/${slug}\\?device=inverter$`));
    assert.equal((await page.locator('.plant-overview-subpage-title').textContent()).trim(), label);
    await page.locator('.plants-detail .wd-page-breadcrumb-link').nth(1).click();
    await page.waitForTimeout(240);
    assert.match(page.url(), /\/plants\/p02\?device=inverter$/);
  }
  assert.equal(await page.locator('.plant-overview-flow-stage').evaluate(stage => stage.children.length), 0, 'the energy flow interior stays empty until its next design pass');
  assert.equal(await page.locator('.plant-overview-flow .plant-overview-section-title').count(), 0, 'the empty energy flow block has no title');
  assert.equal(await page.locator('.plant-overview-flow-live').count(), 0, 'the empty energy flow block has no header strip');
  const emptyFlowSurface = await page.evaluate(() => {
    const canvas=document.querySelector('.plant-overview-canvas');
    const flow=document.querySelector('.plant-overview-flow');
    const style=getComputedStyle(flow);
    return {
      canvasGradient:getComputedStyle(canvas,'::before').backgroundImage,
      flowGradient:getComputedStyle(flow,'::before').backgroundImage,
      background:style.backgroundColor,
      backgroundImage:style.backgroundImage,
      borders:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth],
      radius:style.borderRadius,
      shadow:style.boxShadow
    };
  });
  assert.equal(emptyFlowSurface.canvasGradient, 'none', 'the empty main canvas has no background gradient');
  assert.equal(emptyFlowSurface.flowGradient, 'none', 'the empty energy-flow stage has no background gradient');
  assert.equal(emptyFlowSurface.background, 'rgba(0, 0, 0, 0)', 'the empty energy-flow stage is transparent');
  assert.equal(emptyFlowSurface.backgroundImage, 'none', 'the empty energy-flow stage has no surface image');
  assert.deepEqual(emptyFlowSurface.borders, ['0px','0px','0px','0px'], 'the empty energy-flow stage has no frame');
  assert.equal(emptyFlowSurface.radius, '0px', 'the empty energy-flow stage has no rounded frame');
  assert.equal(emptyFlowSurface.shadow, 'none', 'the empty energy-flow stage has no shadow');
  const flowStageGeometry = await page.evaluate(() => {
    const flow = document.querySelector('.plant-overview-flow').getBoundingClientRect();
    const stage = document.querySelector('.plant-overview-flow-stage').getBoundingClientRect();
    return {top:stage.top-flow.top, height:stage.height, flowHeight:flow.height};
  });
  assert.ok(Math.abs(flowStageGeometry.top) < 1 && Math.abs(flowStageGeometry.height-flowStageGeometry.flowHeight) < 1, 'the empty energy-flow stage fills the complete flow area');
  assert.equal(await page.locator('.plant-overview-chart-legend, .plant-overview-chart-scale, .plant-overview-chart-time').count(), 0, 'chart legend and axis labels stay removed');
  const chartVisibility = await page.evaluate(() => {
    const chart = document.querySelector('.plant-overview-chart').getBoundingClientRect();
    const grid = document.querySelector('.plant-overview-chart-grid').getBoundingClientRect();
    const gridStroke = getComputedStyle(document.querySelector('.plant-overview-chart-grid')).strokeWidth;
    const lineDisplays=[...document.querySelectorAll('.plant-overview-chart-line')]
      .map(line => getComputedStyle(line).display);
    return {
      gridTop:grid.top-chart.top,
      gridBottom:chart.bottom-grid.bottom,
      gridStroke,
      lineDisplays
    };
  });
  assert.ok(chartVisibility.gridTop >= 6 && chartVisibility.gridBottom <= 30, 'the trend grid uses the chart height without bottom slack');
  assert.equal(chartVisibility.gridStroke, '0.6px', 'the chart baseline stays finer than the module separator');
  assert.deepEqual(chartVisibility.lineDisplays, ['none','none','none'], 'all trend data lines are hidden while the chart grid remains');
  assert.equal(await page.locator('.plant-overview-trend').evaluate(trend => getComputedStyle(trend).borderTopWidth), '2px', 'module separators are bolder than chart grid lines');
  const statisticsMaterial=await page.locator('.plant-overview-day-statistics').evaluate(section => {
    const chart=section.querySelector('.plant-overview-stat-chart');
    const self=section.querySelector('.plant-overview-day-view .is-self-powered');
    const sectionStyle=getComputedStyle(section);
    const glow=getComputedStyle(self,'::after');
    const baseGrain=section.querySelector('.plant-overview-chart-wedge-base-grain');
    return {
      optimized:section.classList.contains('is-statistics-optimized'),
      background:sectionStyle.backgroundImage,
      shadow:sectionStyle.boxShadow,
      chartOverlay:getComputedStyle(chart,'::before').content,
      baseGrainFilter:baseGrain?.getAttribute('filter')||'',
      glow:glow.backgroundImage,
      readoutZ:getComputedStyle(section.querySelector('.plant-overview-chart-readout')).zIndex
    };
  });
  assert.equal(statisticsMaterial.optimized, true, 'the current statistics module receives the chart-only material pass');
  assert.equal(statisticsMaterial.background, 'none', 'the statistics module keeps the page background without a new panel fill');
  assert.equal(statisticsMaterial.shadow, 'none', 'the statistics module does not become a raised card');
  assert.equal(statisticsMaterial.chartOverlay, 'none', 'chart material does not create a rectangular overlay around the module');
  assert.match(statisticsMaterial.baseGrainFilter, /plant-self-base-grain-filter/, 'self-powered sector bases receive procedural grain clipped to their shape');
  assert.match(statisticsMaterial.glow, /radial-gradient/, 'self-powered receives a restrained local ambient glow');
  assert.match(statisticsMaterial.glow, /255, 255, 255/, 'the self-powered ambient glow stays strictly neutral');
  assert.equal(statisticsMaterial.readoutZ, '3', 'the unchanged glass readout stays above the chart material overlay');
  const initialChartPath = await page.locator('.plant-overview-chart-line').first().getAttribute('d');
  assert.equal(await page.locator('.plant-overview-day-statistics').isVisible(), true, 'inverter opens on the daily statistics view');
  const moduleOrder=await page.evaluate(() => {
    const trend=document.querySelector('.plant-overview-trend').getBoundingClientRect();
    const statistics=document.querySelector('.plant-overview-day-statistics').getBoundingClientRect();
    return {trendTop:trend.top,trendBottom:trend.bottom,statisticsTop:statistics.top};
  });
  assert.ok(
    moduleOrder.trendBottom<=moduleOrder.statisticsTop+1,
    'energy trend appears above statistics at the responsive desktop layout'
  );
  assert.deepEqual(await page.locator('.plant-overview-date-label').allTextContents(), ['Today'], 'the trend keeps its Home date label');
  assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(), 'Today', 'statistics opens on the current day');
  assert.equal(await page.locator('.plant-statistics-period-control').evaluate(control => control.getBoundingClientRect().height), 36, 'the statistics period control matches the 36px control rhythm');
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .plant-overview-day-title').allTextContents(),
    ['Energy', 'Savings', 'Self-powered', 'Current state']
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .plant-overview-stat-chart').evaluateAll(charts => charts.map(chart => ({
      energy:chart.classList.contains('is-energy'),
      savings:chart.classList.contains('is-savings'),
      selfPowered:chart.classList.contains('is-self-powered'),
      current:chart.classList.contains('is-current')
    }))),
    [
      {energy:true,savings:false,selfPowered:false,current:false},
      {energy:false,savings:true,selfPowered:false,current:false},
      {energy:false,savings:false,selfPowered:true,current:false},
      {energy:false,savings:false,selfPowered:false,current:true}
    ],
    'statistics locks one distinct Lupi template per information group'
  );
  assert.equal(await page.locator('.plant-overview-day-view .plant-overview-chart-readout').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).visibility === 'hidden')), true, 'chart values stay hidden until hover or focus');
  assert.equal(await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-mark').count(), 4, 'F6 renders grid, storage, solar and site groups');
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-label').allTextContents(),
    ['Grid','Storage','Solar','Site'],
    'energy separates solar supply and site demand into their own sentence-case groups'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-mark').evaluateAll(groups =>
      groups.map(group => group.querySelectorAll('.plant-overview-chart-energy-value').length)
    ),
    [2,2,1,1],
    'grid and storage keep paired columns while solar and site each keep one directional column'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-mark').evaluateAll(groups =>
      groups.flatMap(group => {
        const exactValues=[...group.querySelector('.plant-overview-stat-hit')
          .getAttribute('aria-label').matchAll(/(\d+\.\d+) kWh/g)]
          .map(match => Number(match[1]));
        return [...group.querySelectorAll('.plant-overview-chart-energy-value')]
          .map((label,index) => Number(label.textContent)===Math.floor(exactValues[index]));
      }).every(Boolean)
    ),
    true,
    'paired energy columns truncate fractional kWh above both series'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-dot').evaluateAll(dots => {
      const find=kind => dots.find(dot => dot.classList.contains(kind));
      return {
        supply:find('is-supply') ? getComputedStyle(find('is-supply')).fill : '',
        demand:find('is-demand') ? getComputedStyle(find('is-demand')).fill : ''
      };
    }),
    {supply:'rgb(240, 239, 235)',demand:'rgb(255, 146, 48)'},
    'energy keeps white supply dots and orange demand dots'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-label').first().evaluate(label =>
      [getComputedStyle(label).fontSize,getComputedStyle(label).fontWeight]
    ),
    ['12px','600'],
    'energy category labels match the adjacent small-text scale'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-value').first().evaluate(label => getComputedStyle(label).fontSize),
    '12px',
    'truncated energy values use the same readable small-text scale'
  );
  const energyLegendRadii=await page.locator('.plant-overview-day-view .is-energy svg > .plant-overview-chart-energy-dot').evaluateAll(dots =>
    dots.map(dot => Number(dot.getAttribute('r')))
  );
  const energyTopRadius=await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-dot.is-top').first().evaluate(dot =>
    Number(dot.getAttribute('r'))
  );
  assert.ok(
    energyLegendRadii.every(radius => Math.abs(radius-energyLegendRadii[0])<.001)
      && Math.abs(energyLegendRadii[0]-energyTopRadius)<.001
      && energyTopRadius>=3.1,
    'both energy legend markers match the enlarged radius of the tallest data dot'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-legend').first().evaluate(label => ({
      size:getComputedStyle(label).fontSize,
      weight:getComputedStyle(label).fontWeight,
      baseline:label.getAttribute('dominant-baseline')
    })),
    {size:'12px',weight:'600',baseline:'middle'},
    'energy legend labels are larger and vertically centred with their markers'
  );
  assert.ok(
    await page.locator('.plant-overview-day-view .is-energy svg').evaluate(svg => {
      const markers=[...svg.children].filter(node => node.matches('.plant-overview-chart-energy-dot'));
      return [...svg.querySelectorAll('.plant-overview-chart-energy-legend')].every((label,index) => {
        const marker=markers[index].getBoundingClientRect();
        const text=label.getBoundingClientRect();
        return Math.abs(marker.top+marker.height/2-(text.top+text.height/2))<1;
      });
    }),
    true,
    'energy legend text shares the marker centre line within one pixel'
  );
  assert.ok(
    await page.locator('.plant-overview-day-view .is-energy svg').evaluate(svg => {
      const markers=[...svg.children].filter(node => node.matches('.plant-overview-chart-energy-dot'));
      const labels=[...svg.querySelectorAll('.plant-overview-chart-energy-legend')];
      return markers[1].getBoundingClientRect().left-labels[0].getBoundingClientRect().right>=6;
    }),
    'the two energy legend groups keep a deliberate horizontal gap'
  );
  assert.match(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-dot.is-top').first().evaluate(dot => getComputedStyle(dot).filter),
    /drop-shadow.*drop-shadow/,
    'the energy top marker receives a two-stage outer glow'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-mark').evaluateAll(groups => groups.every(group => {
      const columns=new Map();
      for(const dot of group.querySelectorAll('.plant-overview-chart-energy-dot')){
        const x=dot.getAttribute('cx');
        const items=columns.get(x)||[];
        items.push({y:Number(dot.getAttribute('cy')),r:Number(dot.getAttribute('r'))});
        columns.set(x,items);
      }
      return [...columns.values()].every(items => {
        items.sort((a,b)=>a.y-b.y);
        return items.slice(1).every((dot,index) => dot.y-items[index].y>=dot.r+items[index].r);
      });
    })),
    true,
    'energy dots keep a measurable gap in every paired column'
  );
  assert.ok(
    await page.locator('.plant-overview-day-view .is-energy').evaluate(figure => {
      const figureBox=figure.getBoundingClientRect();
      const legend=figure.querySelector('.plant-overview-chart-energy-legend').getBoundingClientRect();
      return legend.top-figureBox.top<=4;
    }),
    'energy content begins at the top of the available chart strip without letterboxed whitespace'
  );
  assert.ok(
    await page.locator('.plant-overview-day-view .is-energy').evaluate(figure => {
      const title=figure.closest('.plant-overview-day-group').querySelector('.plant-overview-day-title').getBoundingClientRect();
      const legend=figure.querySelector('.plant-overview-chart-energy-legend').getBoundingClientRect();
      const firstGroup=figure.querySelector('.plant-overview-chart-mark');
      const firstDotLeft=Math.min(...[...firstGroup.querySelectorAll('.plant-overview-chart-energy-dot')]
        .map(dot => dot.getBoundingClientRect().left));
      const firstGroupInset=firstDotLeft-title.left;
      return Math.abs(legend.left-title.left)<=9
        && firstGroupInset>=7
        && firstGroupInset<=9;
    }),
    'the energy legend aligns with the module title and the first category keeps an eight-pixel inset'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-axis').count(), 0, 'energy no longer draws a baseline beneath its categories');
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-mark').count(), 4, 'L3 renders four horizontal savings rows');
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-barcode').count(), 0, 'the vertical barcode field is removed from savings');
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-track').count(), 4, 'every savings lollipop has its own light baseline');
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-dot').count(), 4, 'L3 marks every savings value with a lollipop dot');
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-dot.is-max').count(), 1, 'only the longest savings lollipop uses a solid endpoint');
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-dot').evaluateAll(dots =>
      dots.every(dot =>
        dot.tagName.toLowerCase()==='svg'
        && getComputedStyle(dot).width === '16px'
        && getComputedStyle(dot).height === '16px'
      )
    ),
    true,
    'all savings endpoints use the enlarged dot size'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-current .plant-overview-chart-mark').count(), 4, 'current state renders four status rows');
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)').count(), 3, 'self-powered renders one radial sector per source');
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge-base').count(), 3, 'every self-powered data wedge sits on a pale full-length sector base');
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge-base').first().evaluate(wedge => {
      const style=getComputedStyle(wedge);
      return style.stroke.includes('plant-self-base-stroke-gradient')
        && Number.parseFloat(style.strokeWidth)>0
        && style.filter!=='none'
        && wedge.getAttribute('d').includes('Q');
    }),
    true,
    'the pale sector bases are rounded with the shared faint glow edge'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)').first().evaluate(wedge => {
      const style=getComputedStyle(wedge);
      return style.stroke.includes('plant-self-wedge-stroke-gradient')
        && Number.parseFloat(style.strokeWidth)>0
        && style.filter!=='none'
        && wedge.getAttribute('d').includes('Q');
    }),
    true,
    'self-powered petals use rounded path corners with the shared faint glow edge'
  );
  const sectorStrokeGradients=await page.locator('.plant-overview-day-view .is-self-powered').evaluate(figure => ({
    coordinates:[...figure.querySelectorAll('#plant-self-base-stroke-gradient,#plant-self-wedge-stroke-gradient')]
      .map(gradient => ({
        units:gradient.getAttribute('gradientUnits'),
        x1:gradient.getAttribute('x1'),
        y1:gradient.getAttribute('y1'),
        x2:gradient.getAttribute('x2'),
        y2:gradient.getAttribute('y2')
      })),
    fills:[...figure.querySelectorAll('.plant-overview-chart-wedge-stroke-stop')]
      .filter(stop => stop.classList.contains('is-wedge-bright')||stop.classList.contains('is-wedge-dim'))
      .map(stop => getComputedStyle(stop).stopColor),
    bases:[...figure.querySelectorAll('.plant-overview-chart-wedge-stroke-stop')]
      .filter(stop => stop.classList.contains('is-base-bright')||stop.classList.contains('is-base-dim'))
      .map(stop => getComputedStyle(stop).stopColor)
  }));
  assert.notEqual(sectorStrokeGradients.fills[0], sectorStrokeGradients.fills[1], 'highlighted ring stroke fades from bright to dim');
  assert.notEqual(sectorStrokeGradients.bases[0], sectorStrokeGradients.bases[1], 'base ring stroke uses the same bright-to-dim direction');
  assert.deepEqual(
    sectorStrokeGradients.coordinates,
    [
      {units:'userSpaceOnUse',x1:'79',y1:'2',x2:'191',y2:'114'},
      {units:'userSpaceOnUse',x1:'79',y1:'2',x2:'191',y2:'114'}
    ],
    'both ring stroke gradients share one continuous chart-space coordinate system'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)').evaluateAll(wedges =>
      wedges.every(wedge => {
        const share=Number(wedge.dataset.share);
        const radius=Number(wedge.dataset.radius);
        const expected=14+(56-14)*(share/100);
        return Math.abs(radius-expected)<.01 && radius<56;
      })
    ),
    true,
    'data petals use the absolute percentage of the full radial track instead of normalising the largest value to full'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge-base.plant-overview-stat-hit').count(),
    3,
    'each complete base sector is the pointer and focus target'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-value').count(), 3, 'each self-powered wedge carries its percentage');
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-name').count(), 3, 'each self-powered wedge carries its source name');
  assert.deepEqual(
    (await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-name').allTextContents()).sort(),
    ['Battery','Grid','Solar'],
    'self-powered wedge labels stay sentence case'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-value').first().evaluate(label => ({
      size:getComputedStyle(label).fontSize,
      weight:getComputedStyle(label).fontWeight
    })),
    {size:'14px',weight:'600'},
    'self-powered percentage labels use the module heading scale'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-name').first().evaluate(label => ({
      size:getComputedStyle(label).fontSize,
      weight:getComputedStyle(label).fontWeight
    })),
    {size:'11px',weight:'600'},
    'self-powered source names stay readable below the percentage labels'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-value').first().evaluate(label => getComputedStyle(label).fill),
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-name').first().evaluate(label => getComputedStyle(label).fill),
    'self-powered external labels share the quieter secondary ink'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-label.is-outside').count(), 3, 'all self-powered labels use external callouts');
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-callout-line').count(), 3, 'each external label has its own leader line');
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-callout-line').evaluateAll(lines =>
      lines.every(line => {
        const points=line.getAttribute('points').trim().split(/\s+/).map(point => point.split(',').map(Number));
        const diagonalRise=Math.abs(points[1][1]-points[0][1]);
        const horizontalRun=Math.abs(points[2][0]-points[1][0]);
        return points.length===3
          && Math.abs(points[1][1]-points[2][1])<.01
          && diagonalRise>=3
          && horizontalRun>=12;
      })
    ),
    true,
    'each callout uses a visible diagonal segment followed by a horizontal segment toward its text'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-center-value').count(), 0, 'the radial composition keeps its centre free of text');
  assert.equal(
    new Set(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)').evaluateAll(wedges => wedges.map(wedge => getComputedStyle(wedge).fill))).size,
    3,
    'self-powered wedges use a separated three-step grey ladder'
  );
  const darkSectorBase=await page.locator('.plant-overview-day-view .is-self-powered').evaluate(figure => ({
    fill:getComputedStyle(figure.querySelector('.plant-overview-chart-wedge-base')).fill,
    stops:[...figure.querySelectorAll('.plant-overview-chart-wedge-base-stop')].map(stop => getComputedStyle(stop).stopColor)
  }));
  assert.match(darkSectorBase.fill, /plant-self-base-gradient/, 'the dark sector base uses the shared radial material gradient');
  assert.notEqual(darkSectorBase.stops[0], darkSectorBase.stops[1], 'the dark sector base carries visible inner-to-outer material falloff');
  assert.equal(await page.locator('.plant-overview-stat-hit').evaluateAll(hits => hits.every(hit => hit.getAttribute('role') === 'img' && hit.getAttribute('aria-label'))), true, 'every chart hotspot exposes an accessible label');
  const statisticsTrackWidths = await page.locator('.plant-overview-day-grid').evaluate(grid =>
    getComputedStyle(grid).gridTemplateColumns.split(' ').map(Number.parseFloat)
  );
  const statisticsGroups = await page.locator('.plant-overview-day-group').evaluateAll(groups => groups.map(group => {
    const groupBox = group.getBoundingClientRect();
    const title = group.querySelector('.plant-overview-day-title');
    const titleBox = title.getBoundingClientRect();
    const body = group.children[group.children.length - 1].getBoundingClientRect();
    const firstRow = group.querySelector('.plant-overview-stat-chart').getBoundingClientRect();
    const style = getComputedStyle(title);
    return {
      x:groupBox.x,
      y:groupBox.y,
      width:groupBox.width,
      height:groupBox.height,
      titleY:titleBox.y,
      bodyY:body.y,
      firstRowY:firstRow.y,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight
    };
  }));
  const spread = values => Math.max(...values) - Math.min(...values);
  const groupingSpread = values => Math.max(...[...new Set(values.map(value => Math.round(value)))]
    .map(key => spread(values.filter(value => Math.round(value) === key))));
  assert.ok(spread(statisticsTrackWidths) < 1, 'responsive statistics tracks use equal column widths');
  const compactSelfAlignment=await page.locator('.plant-overview-day-self').evaluate(group => {
    const title=group.querySelector('.plant-overview-day-title').getBoundingClientRect();
    const contentBoxes=[...group.querySelectorAll(
      '.plant-overview-chart-wedge-base,.plant-overview-chart-source-label,.plant-overview-chart-callout-line'
    )].map(node => node.getBoundingClientRect());
    return {
      titleLeft:title.left,
      contentLeft:Math.min(...contentBoxes.map(box => box.left))
    };
  });
  assert.ok(
    Math.abs(compactSelfAlignment.titleLeft-compactSelfAlignment.contentLeft)<3,
    'the compact self-powered title aligns with its visible content in the two-column layout'
  );
  assert.ok(spread(statisticsGroups.map(group => group.height)) < 1, 'all statistics groups use equal heights');
  assert.ok(groupingSpread(statisticsGroups.map(group => group.titleY)) < 1, 'statistics titles align inside each responsive row');
  assert.ok(groupingSpread(statisticsGroups.map(group => group.bodyY)) < 1, 'statistics bodies share a baseline inside each responsive row');
  assert.ok(groupingSpread(statisticsGroups.map(group => group.firstRowY)) < 1, 'each statistics group starts its first property row on the same line');
  assert.deepEqual(
    statisticsGroups.map(group => [group.fontSize, group.fontWeight]),
    Array.from({length:4}, () => ['14px', '510']),
    'statistics group titles use one readable shared heading size'
  );
  const statisticsStructure = await page.evaluate(() => {
    const section=document.querySelector('.plant-overview-day-statistics');
    const head=document.querySelector('.plant-overview-stats-head');
    const grid=document.querySelector('.plant-overview-day-grid');
    const sectionTitle=document.querySelector('.plant-overview-stats-title');
    const secondaryInk=document.querySelector('.plant-overview-context-value');
    const groups=[...document.querySelectorAll('.plant-overview-day-group')];
    const charts=[...document.querySelectorAll('.plant-overview-day-view .plant-overview-stat-chart')];
    return {
      topToHeading:head.getBoundingClientRect().top-section.getBoundingClientRect().top,
      headingToContent:grid.getBoundingClientRect().top-head.getBoundingClientRect().bottom,
      groupTitleColors:[...document.querySelectorAll('.plant-overview-day-view .plant-overview-day-title')].map(title => getComputedStyle(title).color),
      secondaryInkColor:getComputedStyle(secondaryInk).color,
      sectionTitleColor:getComputedStyle(sectionTitle).color,
      groupsFlush:(() => {
        const gridBottom=grid.getBoundingClientRect().bottom;
        return groups.slice(-2).every(group => Math.abs(group.getBoundingClientRect().bottom-gridBottom)<1);
      })(),
      chartsFlush:groups.every(group => {
        const groupBottom=group.getBoundingClientRect().bottom;
        const chart=group.querySelector('.plant-overview-stat-chart').getBoundingClientRect();
        return Math.abs(chart.bottom-groupBottom)<1;
      }),
      chartsShareTop:new Set(charts.slice(0,2).map(chart => Math.round(chart.getBoundingClientRect().top))).size===1
    };
  });
  assert.ok(statisticsStructure.topToHeading>=20, 'statistics keeps deliberate clear space below its top separator');
  assert.ok(statisticsStructure.headingToContent >= 20, 'the Statistics heading and content strip have a deliberate vertical gap');
  assert.equal(
    statisticsStructure.groupTitleColors.every(color => color === statisticsStructure.secondaryInkColor),
    true,
    'statistics group headings use the shared secondary text level'
  );
  assert.notEqual(statisticsStructure.groupTitleColors[0], statisticsStructure.sectionTitleColor, 'statistics group headings stay one level softer than the module title');
  assert.equal(statisticsStructure.groupsFlush, true, 'responsive statistics groups fill the complete content strip');
  assert.equal(statisticsStructure.chartsFlush, true, 'each chart reaches the bottom edge of its statistics group without extra layout whitespace');
  assert.equal(statisticsStructure.chartsShareTop, true, 'the first responsive statistics row shares one chart-area top edge');
  await page.setViewportSize({width:1499,height:1252});
  await settle(page);
  await page.waitForFunction(() =>
    (() => {
      const tracks=getComputedStyle(document.querySelector('.plant-overview-day-grid')).gridTemplateColumns.split(' ').map(Number.parseFloat);
      return tracks.length===7&&tracks[1]>40;
    })()
  );
  const wideStatisticsLayout=await page.locator('.plant-overview-day-grid').evaluate(grid => {
    const groups=[...grid.querySelectorAll('.plant-overview-day-group')]
      .map(group => group.getBoundingClientRect());
    const tracks=getComputedStyle(grid).gridTemplateColumns.split(' ').map(Number.parseFloat);
    return {
      contentTracks:[tracks[0],tracks[2],tracks[4],tracks[6]],
      gapTracks:[tracks[1],tracks[3],tracks[5]],
      widths:groups.map(group => group.width),
      visibleGaps:groups.slice(1).map((group,index) => group.left-groups[index].right)
    };
  });
  assert.ok(
    Math.abs(wideStatisticsLayout.contentTracks[0]-wideStatisticsLayout.contentTracks[2])<1
      &&Math.abs(wideStatisticsLayout.contentTracks[1]-wideStatisticsLayout.contentTracks[3])<1,
    'energy and self-powered share one content width while savings and current state share another'
  );
  assert.ok(
    wideStatisticsLayout.contentTracks[0] < wideStatisticsLayout.contentTracks[1]-8,
    'the paired narrow statistics content stays visibly narrower than the wide content'
  );
  assert.ok(
    Math.max(...wideStatisticsLayout.gapTracks)-Math.min(...wideStatisticsLayout.gapTracks)<1
      &&Math.min(...wideStatisticsLayout.gapTracks)>=32,
    'three equal elastic gutters separate the statistics modules'
  );
  assert.ok(
    Math.abs(wideStatisticsLayout.widths[0]-wideStatisticsLayout.widths[2])<1,
    'energy and self-powered share the same visible content width'
  );
  assert.ok(
    Math.max(...wideStatisticsLayout.visibleGaps)-Math.min(...wideStatisticsLayout.visibleGaps)<1,
    'the three visible gaps between statistics modules remain equal'
  );
  const selfPoweredContentLayout=await page.locator('.plant-overview-day-self').evaluate(group => {
    const grid=group.closest('.plant-overview-day-grid');
    const trackWidths=getComputedStyle(grid).gridTemplateColumns.split(' ').map(Number.parseFloat);
    const groupBox=group.getBoundingClientRect();
    const title=group.querySelector('.plant-overview-day-title').getBoundingClientRect();
    const contentBoxes=[...group.querySelectorAll(
      '.plant-overview-chart-wedge-base,.plant-overview-chart-source-label,.plant-overview-chart-callout-line'
    )].map(node => node.getBoundingClientRect());
    const contentLeft=Math.min(...contentBoxes.map(box => box.left));
    const contentRight=Math.max(...contentBoxes.map(box => box.right));
    return {
      trackWidth:trackWidths[4],
      groupWidth:groupBox.width,
      titleLeft:title.left,
      contentLeft,
      contentRight,
      groupRight:groupBox.right
    };
  });
  assert.ok(
    Math.abs(selfPoweredContentLayout.groupWidth-selfPoweredContentLayout.trackWidth)<1,
    'self-powered content fills its dedicated narrow grid track without leftover side space'
  );
  assert.ok(
    Math.abs(selfPoweredContentLayout.titleLeft-selfPoweredContentLayout.contentLeft)<2,
    'self-powered title aligns with the left edge of its visible chart content'
  );
  assert.ok(
    selfPoweredContentLayout.contentRight<=selfPoweredContentLayout.groupRight+1,
    'self-powered visible chart content stays inside the narrowed group box'
  );
  const wideEnergyHit=page.locator('.plant-overview-day-view .is-energy .plant-overview-stat-hit').first();
  await wideEnergyHit.focus();
  await settle(page);
  const wideEnergyClearance=await page.locator('.plant-overview-day-view .is-energy').evaluate(figure => {
    const readout=figure.querySelector('.plant-overview-chart-readout').getBoundingClientRect();
    const group=figure.querySelector('.plant-overview-chart-mark');
    const topValueTop=Math.min(...[...group.querySelectorAll('.plant-overview-chart-energy-value')]
      .map(label => label.getBoundingClientRect().top));
    return {
      valueGap:topValueTop-readout.bottom,
      groupCenterCovered:group.getBoundingClientRect().left+group.getBoundingClientRect().width/2>=readout.left
        &&group.getBoundingClientRect().left+group.getBoundingClientRect().width/2<=readout.right
    };
  });
  assert.ok(wideEnergyClearance.valueGap>=5, 'the wide-screen energy tooltip stays above the truncated top value');
  assert.equal(wideEnergyClearance.groupCenterCovered, true, 'the wide-screen energy tooltip returns to the selected column group');
  await wideEnergyHit.blur();
  await page.setViewportSize({width:1920,height:1080});
  await settle(page);
  await page.waitForFunction(() =>
    (() => {
      const tracks=getComputedStyle(document.querySelector('.plant-overview-day-grid')).gridTemplateColumns.split(' ').map(Number.parseFloat);
      return tracks.length===7&&tracks[1]>100;
    })()
  );
  const ultraWideStatisticsLayout=await page.locator('.plant-overview-day-grid').evaluate(grid => {
    const groups=[...grid.querySelectorAll('.plant-overview-day-group')]
      .map(group => group.getBoundingClientRect());
    const tracks=getComputedStyle(grid).gridTemplateColumns.split(' ').map(Number.parseFloat);
    return {
      contentTracks:[tracks[0],tracks[2],tracks[4],tracks[6]],
      gapTracks:[tracks[1],tracks[3],tracks[5]],
      visibleGaps:groups.slice(1).map((group,index) => group.left-groups[index].right)
    };
  });
  assert.ok(
    Math.min(...ultraWideStatisticsLayout.gapTracks)>Math.max(...wideStatisticsLayout.gapTracks),
    'statistics gutters expand on ultra-wide screens'
  );
  assert.deepEqual(
    ultraWideStatisticsLayout.contentTracks.map((width,index) => width>wideStatisticsLayout.contentTracks[index]),
    [true,true,true,true],
    'every statistics group grows wider when the viewport expands'
  );
  assert.ok(
    Math.max(...ultraWideStatisticsLayout.visibleGaps)-Math.min(...ultraWideStatisticsLayout.visibleGaps)<1,
    'ultra-wide statistics modules keep all three visible gaps equal'
  );
  await page.setViewportSize({width:1440,height:900});
  await settle(page);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const firstEnergyHit = page.locator('.plant-overview-day-view .is-energy .plant-overview-stat-hit').first();
  await firstEnergyHit.focus();
  const energyReadoutLines=await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-readout .plant-overview-chart-readout-value').allTextContents();
  assert.equal(energyReadoutLines.length, 2, 'paired energy values render as two lines');
  assert.match(energyReadoutLines[0], /^\d+\.\d kWh supply$/);
  assert.match(energyReadoutLines[1], /^\d+\.\d kWh demand$/);
  const energyReadoutLayout=await page.locator('.plant-overview-day-view .is-energy').evaluate(figure => {
    const readout=figure.querySelector('.plant-overview-chart-readout');
    const group=figure.querySelector('.plant-overview-chart-mark');
    const readoutBox=readout.getBoundingClientRect();
    const groupBox=group.getBoundingClientRect();
    const figureBox=figure.getBoundingClientRect();
    const topDotTop=Math.min(...[...group.querySelectorAll('.plant-overview-chart-energy-dot.is-top')]
      .map(dot => dot.getBoundingClientRect().top));
    const topValueTop=Math.min(...[...group.querySelectorAll('.plant-overview-chart-energy-value')]
      .map(label => label.getBoundingClientRect().top));
    return {
      leftOverflow:Math.max(0,figureBox.left-readoutBox.left),
      rightOverflow:Math.max(0,readoutBox.right-figureBox.right),
      gapAboveColumn:topDotTop-readoutBox.bottom,
      gapAboveTopValue:topValueTop-readoutBox.bottom,
      groupCenterCovered:groupBox.left+groupBox.width/2>=readoutBox.left
        &&groupBox.left+groupBox.width/2<=readoutBox.right
    };
  });
  assert.ok(energyReadoutLayout.leftOverflow<1&&energyReadoutLayout.rightOverflow<1, 'the energy tooltip stays fully inside its module');
  assert.ok(energyReadoutLayout.gapAboveColumn>=5.5, 'the energy tooltip stays above the selected column');
  assert.ok(energyReadoutLayout.gapAboveTopValue>=5.5, 'the energy tooltip stays clear of the truncated top value');
  assert.equal(energyReadoutLayout.groupCenterCovered, true, 'the energy tooltip stays over its selected column group');
  assert.equal(
    await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-readout-label').evaluate(label => getComputedStyle(label).fontSize),
    '12px',
    'the energy tooltip category uses the standard caption size'
  );
  assert.match(await page.locator('.plant-overview-day-view .is-energy .plant-overview-stat-hit').nth(2).getAttribute('aria-label'), /^Solar: \d+\.\d kWh supply$/, 'solar exposes supply only');
  assert.match(await page.locator('.plant-overview-day-view .is-energy .plant-overview-stat-hit').nth(3).getAttribute('aria-label'), /^Site: \d+\.\d kWh demand$/, 'site exposes demand only');
  assert.equal(await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-readout').evaluate(node => getComputedStyle(node).visibility), 'visible', 'focused chart readout becomes visible');
  await firstEnergyHit.blur();
  const firstSavingsHit = page.locator('.plant-overview-day-view .is-savings .plant-overview-stat-hit').first();
  await firstSavingsHit.focus();
  const savingsReadout = page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-readout');
  assert.match(await savingsReadout.textContent(), /^kr \d+\.\d{2}$/, 'savings reveals only the amount and unit on focus');
  assert.equal(
    await page.evaluate(() => {
      const rows=[...document.querySelectorAll('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row')];
      return getComputedStyle(rows[0]).borderTopColor===getComputedStyle(rows[1]).borderTopColor;
    }),
    true,
    'savings hover does not brighten the row outline'
  );
  const savingsReadoutMaterial = await savingsReadout.evaluate(readout => {
    const material=readout.querySelector(':scope>.wd-glass-material');
    const fill=material?.querySelector('.wd-glass-fill');
    const firstLine=readout.closest('.plant-overview-stat-chart').querySelector('.plant-overview-chart-lollipop-track').getBoundingClientRect();
    const title=readout.closest('.plant-overview-day-group').querySelector('.plant-overview-day-title').getBoundingClientRect();
    const total=readout.closest('.plant-overview-day-group').querySelector('.plant-overview-day-total').getBoundingClientRect();
    const box=readout.getBoundingClientRect();
    const overlap=(a,b) => Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))
      * Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return {
      surface:readout.classList.contains('wd-glass--surface'),
      staticSurface:readout.classList.contains('wd-glass--static'),
      material:Boolean(material),
      backdrop:fill ? getComputedStyle(fill).backdropFilter : 'none',
      background:getComputedStyle(readout).backgroundColor,
      lineGap:box.top>=firstLine.bottom ? box.top-firstLine.bottom : firstLine.top-box.bottom,
      lineCenterDelta:(box.left+box.right)/2-firstLine.left,
      titleOverlap:overlap(box,title),
      totalOverlap:overlap(box,total)
    };
  });
  assert.equal(savingsReadoutMaterial.surface, true, 'savings hover readout uses the shared Glass Surface class');
  assert.equal(savingsReadoutMaterial.staticSurface, true, 'chart tooltips do not inherit interactive glass lift');
  assert.equal(savingsReadoutMaterial.material, true, 'savings hover readout mounts the shared glass material');
  assert.match(savingsReadoutMaterial.backdrop, /blur\(/, 'savings hover readout carries the shared glass blur');
  assert.equal(savingsReadoutMaterial.background, 'rgba(0, 0, 0, 0)', 'savings hover readout has no local opaque fill');
  assert.ok(savingsReadoutMaterial.lineGap >= 5.5, 'savings hover readout keeps the final six-pixel clearance above the plotted lines');
  assert.ok(Math.abs(savingsReadoutMaterial.lineCenterDelta) < 1, 'savings hover readout centres over the plotted line start');
  assert.equal(savingsReadoutMaterial.titleOverlap, 0, 'savings hover readout does not cover the group title');
  assert.equal(savingsReadoutMaterial.totalOverlap, 0, 'savings hover readout does not cover the total value');
  await firstSavingsHit.blur();
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row').count(),
    4,
    'the Figma savings component renders four pill-shaped row containers'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row').evaluateAll(rows =>
      rows.every(row => getComputedStyle(row).borderRadius === '999px')
    ),
    true,
    'savings row containers use a full pill radius'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row').first().evaluate(row => {
      const style=getComputedStyle(row);
      return style.borderTopWidth==='2px'
        && style.borderTopStyle==='solid'
        && style.borderTopColor!=='rgba(0, 0, 0, 0)'
        && style.borderTopColor!=='transparent';
    }),
    true,
    'savings row outlines are visibly thicker than a hairline'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-label.is-row-label').allTextContents(),
    ['iStorage > home','iStorage > Grid','Solar > home','Solar > grid'],
    'savings labels match the updated Figma copy'
  );
  const savingsLabels = await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-label.is-row-label').evaluateAll(labels => labels.map(label => {
      const style=getComputedStyle(label);
      const row=label.closest('.plant-overview-chart-savings-row');
      const track=label.parentElement.querySelector('.plant-overview-chart-lollipop-track');
      const labelBox=label.getBoundingClientRect();
      const rowBox=row.getBoundingClientRect();
      const trackBox=track.getBoundingClientRect();
      return {
        fontSize:style.fontSize,
        fontWeight:style.fontWeight,
        letterSpacing:parseFloat(style.letterSpacing)||0,
        insideRow:labelBox.left>rowBox.left&&labelBox.right<rowBox.right,
        rowCenter:rowBox.top+rowBox.height/2,
        trackCenter:trackBox.top+trackBox.height/2,
        centerDelta:(labelBox.top+labelBox.height/2)
          -trackBox.top-trackBox.height/2
      };
    }));
  assert.ok(
    savingsLabels.every(label =>
      label.fontSize === '12px' &&
      label.fontWeight === '400' &&
      label.letterSpacing === 0 &&
      label.insideRow &&
      Math.abs(label.centerDelta) <= 1
    ),
    `savings labels stay inside their row pills and share the track centre line: ${JSON.stringify(savingsLabels)}`
  );
  assert.ok(
    await page.evaluate(() => {
      const rows=[...document.querySelectorAll('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row')]
        .map(row => row.getBoundingClientRect());
      const labels=[...document.querySelectorAll('.plant-overview-day-view .is-savings .plant-overview-chart-label.is-row-label')]
        .map(label => label.getBoundingClientRect());
      return labels.every((label,index) => label.left-rows[index].left>=6);
    }),
    'savings labels keep a consistent inset from the row outline'
  );
  const savingsTotalEdge = await page.evaluate(() => {
      const total=document.querySelector('.plant-overview-day-savings .plant-overview-day-total').getBoundingClientRect();
      const row=document.querySelector('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row').getBoundingClientRect();
      return {totalRight:total.right,rowRight:row.right,delta:total.right-row.right};
    });
  assert.ok(
    Math.abs(savingsTotalEdge.delta)<1,
    `the savings total aligns with the row container right edge: ${JSON.stringify(savingsTotalEdge)}`
  );
  assert.match(
    (await page.locator('.plant-overview-day-savings .plant-overview-day-total').textContent()).trim(),
    /^total: kr \d+\.\d{2}$/,
    'the savings total uses the updated Figma label'
  );
  assert.equal(
    await page.locator('.plant-overview-day-savings').evaluate(group => {
      const title=getComputedStyle(group.querySelector('.plant-overview-day-title')).color;
      const total=getComputedStyle(group.querySelector('.plant-overview-day-total')).color;
      return title===total;
    }),
    true,
    'Savings title and total share the same secondary text level'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-start').count(), 4, 'each savings row has a start knob');
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-start circle').first().evaluate(circle =>
      getComputedStyle(circle).fill
    ),
    'rgb(166, 166, 166)',
    'the dark-theme start knob stays one clear step brighter than the track'
  );
  const savingsTrackStyle=await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-track').first().evaluate(track => ({
      height:getComputedStyle(track).height,
      radius:getComputedStyle(track).borderRadius,
      minWidth:getComputedStyle(track).minWidth,
      background:getComputedStyle(track).backgroundImage
    }));
  assert.deepEqual(
    {
      height:savingsTrackStyle.height,
      radius:savingsTrackStyle.radius,
      minWidth:savingsTrackStyle.minWidth
    },
    {height:'16px',radius:'999px 0px 0px 999px',minWidth:'24px'},
    'savings tracks use the heavier Figma bar weight'
  );
  assert.match(
    savingsTrackStyle.background,
    /data:image\/svg\+xml.*linear-gradient/,
    'savings tracks combine frosted grain with a visible gradient'
  );
  assert.ok(
    await page.evaluate(() => {
      const lane=[...document.querySelectorAll('.plant-overview-day-view .is-savings .plant-overview-chart-savings-lane')].at(-1);
      const track=lane.querySelector('.plant-overview-chart-lollipop-track');
      const trackBox=track.getBoundingClientRect();
      const start=track.querySelector('.plant-overview-chart-lollipop-start').getBoundingClientRect();
      const dot=track.querySelector('.plant-overview-chart-lollipop-dot').getBoundingClientRect();
      return dot.left-start.right>=3 && trackBox.width>=24;
    }),
    'the shortest lollipop keeps a non-collapsed minimum span with the endpoints close together'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-savings-lane').first().evaluate(lane => {
      const track=lane.querySelector('.plant-overview-chart-lollipop-track');
      const start=lane.querySelector('.plant-overview-chart-lollipop-start');
      const end=lane.querySelector('.plant-overview-chart-lollipop-dot');
      const trackStyle=getComputedStyle(track);
      const startStyle=getComputedStyle(start);
      const endStyle=getComputedStyle(end);
      const trackBox=track.getBoundingClientRect();
      const startBox=start.getBoundingClientRect();
      const endBox=end.getBoundingClientRect();
      const trackCenter=trackBox.top+trackBox.height/2;
      return trackStyle.height==='16px'
        && startStyle.width==='12px'
        && startStyle.height==='12px'
        && endStyle.width==='16px'
        && endStyle.height==='16px'
        && startBox.left>trackBox.left
        && startBox.right<trackBox.left+trackBox.height
        && startBox.top>trackBox.top
        && startBox.bottom<trackBox.bottom
        && Math.abs(startBox.top+startBox.height/2-trackCenter)<1
        && Math.abs(endBox.top+endBox.height/2-trackCenter)<1;
    }),
    true,
    'the left marker sits inside the bar while the right endpoint matches the bar height'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-lollipop-dot').nth(1).evaluate(dot => {
      const probe=document.createElement('span');
      probe.style.background='var(--chart-savings-hole)';
      dot.closest('.plant-overview-stat-chart').append(probe);
      const expected=getComputedStyle(probe).backgroundColor;
      probe.remove();
      const circle=dot.querySelector('circle');
      const style=getComputedStyle(circle);
      const track=getComputedStyle(dot.parentElement);
      return style.fill===expected
        && style.fill===track.backgroundColor
        && style.stroke!=='none'
        && style.strokeWidth==='2px'
        && getComputedStyle(dot).boxShadow==='none';
    }),
    true,
    'hollow savings endpoints use a vector inner ring without shadows and the configured fill'
  );
  assert.equal(
    await page.evaluate(() => {
      const rows=[...document.querySelectorAll('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row')];
      return rows.every(row => [...row.querySelectorAll('.plant-overview-chart-lollipop-dot')]
        .every(dot => getComputedStyle(dot).boxShadow==='none'));
    }),
    true,
    'every savings endpoint keeps shadows and projections disabled'
  );
  assert.ok(
    await page.evaluate(() => {
      const row=document.querySelector('.plant-overview-day-view .is-savings .plant-overview-chart-savings-row');
      const track=row.querySelector('.plant-overview-chart-lollipop-track');
      const dot=row.querySelector('.plant-overview-chart-lollipop-dot.is-max');
      const rowBox=row.getBoundingClientRect();
      const trackBox=track.getBoundingClientRect();
      const dotBox=dot.getBoundingClientRect();
      const verticalGap=(trackBox.top-rowBox.top+rowBox.bottom-trackBox.bottom)/2;
      const horizontalGap=rowBox.right-dotBox.right;
      return Math.abs(horizontalGap-verticalGap)<=1;
    }),
    'the maximum endpoint keeps the same clearance from the right edge as the track does vertically'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-savings .plant-overview-chart-mark').evaluateAll(groups => groups.every(group => {
      const track=group.querySelector('.plant-overview-chart-lollipop-track');
      const width=parseFloat(track.style.getPropertyValue('--plant-savings-width'));
      return Math.abs(width/100-Number(group.dataset.ratio))<.001;
    })),
    true,
    'savings track lengths remain proportional to their actual kr values'
  );
  const firstSelfHit = page.locator('.plant-overview-day-view .is-self-powered .plant-overview-stat-hit').first();
  await firstSelfHit.focus();
  assert.match(await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-readout').textContent(), /^\d+\.\d kWh$/, 'self-powered reveals only the energy value and unit on focus');
  assert.equal(
    await firstSelfHit.evaluate(hit => hit.closest('.plant-overview-chart-mark').classList.contains('is-source-active')),
    true,
    'focus activates only the hit source band'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-mark.is-source-active .plant-overview-chart-wedge.is-hover').evaluateAll(wedges =>
      wedges.every(wedge => wedge.getAnimations().some(animation => {
        const timing=animation.effect?.getComputedTiming();
        return timing?.duration===240 && animation.effect?.getTiming().easing.includes('cubic-bezier');
      }))
    ),
    true,
    'source tick emphasis eases in with the shared hover motion'
  );
  await page.waitForTimeout(260);
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-mark.is-source-active .plant-overview-chart-wedge.is-hover').evaluateAll(wedges =>
      wedges.length===1 && wedges.every(wedge => getComputedStyle(wedge).opacity === '1')
    ),
    true,
    'the active source reveals its slightly enlarged wedge'
  );
  const selfReadout = page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-readout');
  assert.match(await selfReadout.textContent(), /^\d+\.\d kWh$/, 'self-powered tooltip contains only the energy value and unit');
  assert.equal(
    await selfReadout.evaluate(readout => {
      const material=readout.querySelector(':scope>.wd-glass-material');
      return readout.classList.contains('wd-glass--surface')
        && readout.classList.contains('wd-glass--static')
        && Boolean(material);
    }),
    true,
    'the self-powered hover tooltip reuses the shared static Glass Surface'
  );
  const selfTooltipClearance = await page.evaluate(() => {
    const readout=document.querySelector('.plant-overview-day-view .is-self-powered .plant-overview-chart-readout').getBoundingClientRect();
    const wedges=[...document.querySelectorAll('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)')]
      .map(wedge => wedge.getBoundingClientRect());
    const labels=[...document.querySelectorAll('.plant-overview-day-view .is-self-powered .plant-overview-chart-source-label')]
      .map(label => label.getBoundingClientRect());
    const overlap=(a,b) => Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))
      *Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return wedges.every(wedge => overlap(readout,wedge)===0)
      && labels.every(label => overlap(readout,label)===0);
  });
  assert.equal(selfTooltipClearance, true, 'the self-powered tooltip stays clear of every radial wedge and external label');
  await firstSelfHit.blur();
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-mark.is-source-active').count(),
    0,
    'blur clears the active source band'
  );
  const selfSectorPoint = await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-stat-hit').first().evaluate(hit => {
    const svg=hit.ownerSVGElement;
    const angle=(-30)*Math.PI/180;
    const point=svg.createSVGPoint();
    point.x=135+Math.cos(angle)*50;
    point.y=58+Math.sin(angle)*50;
    const screen=point.matrixTransform(svg.getScreenCTM());
    return {x:screen.x,y:screen.y};
  });
  await page.mouse.move(selfSectorPoint.x,selfSectorPoint.y);
  await page.waitForTimeout(80);
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-mark.is-source-active').count(),
    1,
    'pointer hover activates the matching source band'
  );
  const pointerTooltip = await selfReadout.boundingBox();
  assert.ok(
    Math.abs(pointerTooltip.x+pointerTooltip.width/2-selfSectorPoint.x)<4
      && pointerTooltip.y+pointerTooltip.height<=selfSectorPoint.y-6,
    'the self-powered tooltip sits above and follows the pointer'
  );
  const firstTooltipPosition = await selfReadout.evaluate(readout => ({
    left:readout.style.getPropertyValue("--plant-self-tooltip-left"),
    top:readout.style.getPropertyValue("--plant-self-tooltip-top")
  }));
  await page.mouse.move(selfSectorPoint.x+12,selfSectorPoint.y+6);
  await page.waitForTimeout(80);
  const secondTooltipPosition = await selfReadout.evaluate(readout => ({
    left:readout.style.getPropertyValue("--plant-self-tooltip-left"),
    top:readout.style.getPropertyValue("--plant-self-tooltip-top")
  }));
  assert.notDeepEqual(secondTooltipPosition, firstTooltipPosition, 'pointer movement updates the tooltip position');
  await page.mouse.move(0,0);
  assert.equal(
    await page.locator('.plant-overview-day-view .is-self-powered .plant-overview-chart-mark.is-source-active').count(),
    0,
    'pointer leave clears the active source band'
  );
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-current .plant-current-state-name').allTextContents(),
    ['Battery','Grid','Home','Solar'],
    'current state keeps four directly readable row labels'
  );
  const currentStateLabels = await page.locator('.plant-overview-day-view .is-current .plant-overview-chart-state').allTextContents();
  assert.equal(currentStateLabels.length, 4, 'current state renders four operating labels');
  assert.ok(
    currentStateLabels.every(label => /^(Charging|Discharging|Standby|Importing|Exporting|Using|Generating)$/.test(label)),
    'current state labels stay sentence-case readable text'
  );
  assert.equal(await page.locator('.plant-overview-day-view .is-current .plant-overview-chart-value').count(), 4, 'current state keeps one visible power value per operating row');
  assert.equal(await page.locator('.plant-overview-day-view .is-current .plant-overview-stat-hit').count(), 0, 'current state no longer depends on chart hotspots or hover values');
  assert.equal(await page.locator('.plant-overview-day-view .is-current svg').count(), 0, 'current state uses a readable status-list treatment instead of a chart');
  assert.deepEqual(
    await page.locator('.plant-overview-day-view .is-current .plant-current-state-pill').first().evaluate(pill => {
      const style=getComputedStyle(pill);
      return [style.fontSize,style.fontWeight];
    }),
    ['12px','400'],
    'current-state pills keep readable shared label scale'
  );
  const currentPillStyles = await page.locator('.plant-overview-day-view .is-current .plant-current-state-pill').evaluateAll(pills => pills.map(pill => ({
      background:getComputedStyle(pill).backgroundColor,
      color:getComputedStyle(pill).color
    })));
  assert.equal(
    currentPillStyles.every(pill => pill.background !== 'rgba(0, 0, 0, 0)' && new Set([pill.background]).size === 1),
    true,
    'current state keeps four filled status pills'
  );
  assert.equal(new Set(currentPillStyles.map(pill => pill.background)).size, 4, 'each current-state source keeps a distinct pill tone');
  assert.equal(currentPillStyles.every(pill => pill.color === 'rgb(255, 255, 255)'), true, 'current-state pill text remains white');
  const currentPillMaterials=await page.locator('.plant-overview-day-view .is-current .plant-current-state-pill').evaluateAll(pills => pills.map(pill => ({
    backgroundImage:getComputedStyle(pill).backgroundImage,
    shadow:getComputedStyle(pill).boxShadow,
    border:getComputedStyle(pill).borderTopWidth
  })));
  assert.equal(
    currentPillMaterials.every(pill =>
      /data:image\/svg\+xml.*linear-gradient\(90deg/.test(pill.backgroundImage)
      &&pill.shadow==='none'
      &&pill.border==='0px'
    ),
    true,
    'current-state pills carry frosted grain and a broad left-to-right sheen without outlines or shadows'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-current .plant-current-state-pill').evaluateAll(pills => {
      const channels=value => {
        const numbers=value.match(/[\d.]+/g)?.slice(0,3).map(Number)||[0,0,0];
        return value.startsWith('color(srgb')?numbers:numbers.map(number => number/255);
      };
      const luminance=value => {
        const [red,green,blue]=channels(value).map(channel =>
          channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4
        );
        return .2126*red+.7152*green+.0722*blue;
      };
      return pills.every(pill => {
        const style=getComputedStyle(pill);
        const foreground=luminance(style.color);
        const background=luminance(style.backgroundColor);
        return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)>=4.5;
      });
    }),
    true,
    'current-state pill text keeps at least 4.5:1 contrast across all four monochrome tones'
  );
  assert.equal(
    await page.locator('.plant-overview-day-view .is-current .plant-current-state-list').evaluate(list => getComputedStyle(list).paddingTop),
    '8px',
    'current-state rows keep optical top breathing room aligned with the adjacent statistics'
  );
  assert.equal(
    await page.evaluate(() => {
      const strokes=[...document.querySelectorAll('.plant-overview-chart-rung')];
      const savingsTracks=[...document.querySelectorAll('.plant-overview-chart-lollipop-track')];
      return strokes.every(mark => parseFloat(getComputedStyle(mark).strokeWidth) >= 1.8)
        && savingsTracks.every(track => parseFloat(getComputedStyle(track).height) >= 4);
    }),
    true,
    'statistics marks remain visually substantial instead of hairline strokes'
  );
  assert.ok(
    await page.locator('.plant-overview-day-view .plant-overview-stat-chart').evaluateAll(charts => charts.every(chart => {
      const strokes=[...chart.querySelectorAll('line,path,rect')]
        .map(node => getComputedStyle(node).stroke)
        .filter(value => value && value !== 'none');
      return strokes.every(stroke => {
        const channels=stroke.match(/\d+(?:\.\d+)?/g);
        if(!channels)return true;
        const rgb=channels.slice(0,3).map(Number);
        return rgb.length<3||Math.max(...rgb)-Math.min(...rgb)<=8;
      });
    })),
    true,
    'Mono statistics charts contain no chromatic stroke'
  );
  assert.deepEqual(
    await page.locator('.wd-segmented-control-option').allTextContents(),
    ['All', 'Default', 'Battery', 'Frequency']
  );
  assert.equal(
    await page.locator('.plant-overview-trend .wd-segmented-control').evaluate(track => getComputedStyle(track).columnGap),
    '0px',
    'segmented options have no inter-item gap'
  );
  const optionWidthsFitLabels = await page.locator('.wd-segmented-control-option').evaluateAll(options => options.map(option => {
    const label = option.querySelector('.wd-control-label').getBoundingClientRect();
    const style = getComputedStyle(option);
    return {
      width: option.getBoundingClientRect().width,
      expected: label.width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    };
  }).every(option => Math.abs(option.width - option.expected) < 1.5));
  assert.equal(optionWidthsFitLabels, true, 'each segment sizes to its label plus consistent horizontal padding');
  assert.equal(
    await page.locator('.plant-overview-trend .wd-segmented-control').evaluate(track => track.offsetHeight),
    36,
    'the trend switch container remains exactly 36px high'
  );
  assert.equal(
    await page.locator('.plant-overview-trend .wd-segmented-control').evaluate(track => getComputedStyle(track).paddingInlineStart),
    '4px',
    'the track keeps a 4px outer inset without adding space between options'
  );
  assert.equal(await page.locator('.wd-segmented-control-option.is-selected').getAttribute('data-value'), 'all');
  const indicatorAt = async () => page.evaluate(() => {
    const selected = document.querySelector('.wd-segmented-control-option.is-selected').getBoundingClientRect();
    const indicator = document.querySelector('.wd-segmented-control-indicator').getBoundingClientRect();
    return {selectedLeft:selected.left,selectedWidth:selected.width,indicatorLeft:indicator.left,indicatorWidth:indicator.width};
  });
  const powerIndicator = await indicatorAt();
  assert.ok(Math.abs(powerIndicator.indicatorLeft-powerIndicator.selectedLeft)<1.5, 'the selected indicator fills the active option without an internal horizontal gap');
  assert.ok(Math.abs(powerIndicator.indicatorWidth-powerIndicator.selectedWidth)<1.5, 'the selected indicator spans the full active option width');
  const indicatorVerticalInset = await page.evaluate(() => {
    const track = document.querySelector('.plant-overview-trend .wd-segmented-control').getBoundingClientRect();
    const indicator = document.querySelector('.wd-segmented-control-indicator').getBoundingClientRect();
    return {top:indicator.top-track.top, bottom:track.bottom-indicator.bottom};
  });
  assert.ok(Math.abs(indicatorVerticalInset.top-4)<1, 'selected indicator keeps a 4px top inset');
  assert.ok(Math.abs(indicatorVerticalInset.bottom-4)<1, 'selected indicator keeps a 4px bottom inset');
  assert.equal(
    await page.locator('.wd-segmented-control-option').first().evaluate(option => getComputedStyle(option).paddingLeft),
    '18px',
    'trend option labels use the final compact horizontal padding'
  );
  assert.equal(await page.locator('.wd-segmented-control-indicator').evaluate(element => getComputedStyle(element).boxShadow), 'none', 'the selected indicator has no outline');
  const energyOption = page.locator('.wd-segmented-control-option[data-value="default"]');
  const energyOptionIdle = await energyOption.evaluate(option => ({
    background: getComputedStyle(option).backgroundColor,
    color: getComputedStyle(option).color
  }));
  await energyOption.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  await energyOption.hover();
  await page.waitForTimeout(260);
  const switchHover = await page.evaluate(() => {
    const track = document.querySelector('.plant-overview-trend .wd-segmented-control');
    const option = document.querySelector('.wd-segmented-control-option[data-value="default"]');
    const transform = getComputedStyle(track).transform;
    const optionTransform = getComputedStyle(option).transform;
    return {
      trackScale: transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a,
      optionScale: optionTransform === 'none' ? 1 : new DOMMatrixReadOnly(optionTransform).a,
      optionBackground: getComputedStyle(option).backgroundColor,
      optionColor: getComputedStyle(option).color,
      pointerLight: track.hasAttribute('data-glass-pointer')
    };
  });
  assert.ok(switchHover.trackScale > 1.01, 'the whole glass switch enlarges on hover');
  assert.ok(switchHover.optionScale > 1.03, 'the hovered option enlarges');
  assert.equal(switchHover.optionBackground, energyOptionIdle.background, 'hover does not add a second rounded background layer');
  assert.notEqual(switchHover.optionColor, energyOptionIdle.color, 'hover communicates through text contrast');
  assert.equal(switchHover.pointerLight, true, 'the glass switch receives the shared pointer light');
  await energyOption.click();
  const indicatorAnimation = await page.locator('.wd-segmented-control-indicator').evaluate(indicator =>
    indicator.getAnimations().some(animation => {
      const timing = animation.effect?.getComputedTiming();
      return timing?.duration === 320;
    })
  );
  assert.equal(indicatorAnimation, true, 'the selected capsule animates instead of jumping');
  await settle(page);
  assert.equal(await page.locator('.wd-segmented-control-option.is-selected').getAttribute('data-value'), 'default');
  const energyIndicator = await indicatorAt();
  assert.ok(energyIndicator.indicatorLeft > powerIndicator.indicatorLeft, 'the selected capsule slides to the next option');
  assert.notEqual(await page.locator('.plant-overview-chart-line').first().getAttribute('d'), initialChartPath, 'the chart still changes data when a mode is selected');
  await page.locator('.wd-segmented-control-option[data-value="battery"]').click();
  await settle(page);
  assert.equal(await page.locator('.wd-segmented-control-option.is-selected').getAttribute('data-value'), 'battery', 'placeholder options demonstrate the same slide behavior');
  const selectedSlot = page.locator('.wd-segmented-control-option[data-value="battery"]');
  await selectedSlot.hover();
  await page.waitForTimeout(260);
  assert.deepEqual(
    await selectedSlot.evaluate(option => ({
      background: getComputedStyle(option).backgroundColor,
      shadow: getComputedStyle(option).boxShadow
    })),
    {background:'rgba(0, 0, 0, 0)', shadow:'none'},
    'the selected option never draws a second rounded background or outline on hover'
  );
  await page.mouse.move(0, 0);
  await page.locator('.plant-overview-period-button').last().click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.wd-date-picker').isVisible(), true, 'the period trigger reuses the Home date picker');
  await page.locator('.wd-date-preset[data-preset="Last 7 days"]').click();
  await page.locator('.wd-date-actions .wd-button--primary').click();
  await page.waitForTimeout(220);
  assert.equal((await page.locator('.plant-overview-date-label').last().textContent()).trim(), 'Last 7 days');
  await page.goto(`${origin}/plants/p01?device=inverter`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  assert.deepEqual(
    await page.locator('.plant-overview-context-item').allTextContents(),
    ['Plant normal', 'Comms partially offline', '2°C · Partly cloudy', 'Åmål, Sweden · 08:15']
  );
  assert.equal((await page.locator('.plant-overview-ops-count').first().textContent()).trim(), '2 alerts');
  assert.deepEqual(await page.locator('.plant-overview-code').allTextContents(), ['4300', '8093']);
  assert.deepEqual(
    (await page.locator('.plant-overview-log-message').allTextContents()).slice(0,2),
    ['battery online', 'inverter online']
  );
  await page.goto(`${origin}/plants/p25?device=inverter`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  assert.equal(await page.locator('.plant-overview-ticket-section .plant-overview-ops-count').count(), 0, 'an empty ticket card omits the None count');
  const emptyTicketLayout = await page.evaluate(() => {
    const card = document.querySelector('.plant-overview-ticket-section');
    const copy = card.querySelector('.plant-overview-empty-copy').getBoundingClientRect();
    const head = card.querySelector('.plant-overview-ops-head').getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      horizontal:Math.abs((copy.left+copy.width/2)-(cardBox.left+cardBox.width/2)),
      copyCenter:copy.top+copy.height/2,
      bodyCenter:(head.bottom+cardBox.bottom-12)/2
    };
  });
  assert.ok(emptyTicketLayout.horizontal < 1 && Math.abs(emptyTicketLayout.copyCenter-emptyTicketLayout.bodyCenter) < 1, 'the empty ticket state centers with a slight upward optical offset');

  await page.goto(`${origin}/plants/p02?device=inverter`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  await page.locator('.plant-overview-device[data-device="bms"]').click();
  await settle(page);
  assert.match(page.url(), /\/plants\/p02\?device=bms$/);
  assert.equal(await page.locator('.plant-overview-device[data-device="bms"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.plant-overview-day-statistics').count(), 0, 'device-specific summary replaces the inverter day board');
  assert.equal(await page.locator('.plant-overview-device-stats').count(), 1, 'device-specific metrics use the compact summary layout');
  const deviceStatsHeight = await page.locator('.plant-overview-device-stats').evaluate(element => element.getBoundingClientRect().height);
  assert.ok(deviceStatsHeight >= 132 && deviceStatsHeight <= 140, 'the device summary removes the empty space left by the daily statistics board');
  assert.equal((await page.locator('.plant-overview-stat-label').first().textContent()).trim(), 'State of charge');
  assert.equal(await page.locator('.plant-overview-chart-line').count(), 3, 'each device keeps its chart series without a text legend');
  await page.locator('.plant-overview-faults').click();
  await page.waitForTimeout(240);
  assert.match(page.url(), /\/plants\/p02\/faults\?device=bms$/);
  await page.locator('.plants-detail .wd-page-breadcrumb-link').nth(1).click();
  await page.waitForTimeout(240);
  assert.match(page.url(), /\/plants\/p02\?device=bms$/, 'returning from a child page preserves the active device');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  assert.match(page.url(), /\/plants\/p02\?device=bms$/);
  assert.equal(await page.locator('.plant-overview-device[data-device="bms"]').getAttribute('aria-pressed'), 'true');

  await page.goto(`${origin}/plants/p17`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  assert.equal(await page.locator('.plant-overview-device-rail').count(), 0, 'single-device plants hide the selector');
  assert.equal(await page.locator('.plant-overview-canvas.is-single-device').count(), 1);

  await page.goto(`${origin}/plants/missing`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(), 'Plant not found');
  assert.equal(await page.locator('.plant-overview-missing').isVisible(), true);

  await page.goto(`${origin}/plants/p02?device=bms`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.setViewportSize({ width: 1227, height: 1270 });
  await settle(page);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    0,
    'the reference desktop size has no horizontal page overflow'
  );
  await page.screenshot({ path: 'tests/output/plant-overview-reference-size.png' });
  await page.setViewportSize({ width: 420, height: 900 });
  await settle(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `plant overview must not create horizontal page overflow (received ${overflow}px)`);
  const trendOverflow = await page.locator('.plant-overview-trend').evaluate(element => element.scrollWidth - element.clientWidth);
  assert.ok(trendOverflow <= 1, `the outlined trend card must contain its controls on mobile (received ${trendOverflow}px)`);
  assert.equal(await page.locator('.plant-overview-operations').isVisible(), true, 'operations remain available on narrow screens');
  const mobileLayout = await page.evaluate(() => {
    const operations = document.querySelector('.plant-overview-operations').getBoundingClientRect();
    const statistics = document.querySelector('.plant-overview-stats').getBoundingClientRect();
    const trend = document.querySelector('.plant-overview-trend').getBoundingClientRect();
    const flow = document.querySelector('.plant-overview-flow').getBoundingClientRect();
    const devices = document.querySelector('.plant-overview-device-rail').getBoundingClientRect();
    return {
      devicesBottom: devices.bottom,
      flowTop: flow.top,
      operationsBottom: operations.bottom,
      trendTop: trend.top,
      trendBottom: trend.bottom,
      statisticsTop: statistics.top
    };
  });
  assert.ok(mobileLayout.devicesBottom <= mobileLayout.flowTop, 'the device rail occupies its own row on mobile');
  assert.ok(mobileLayout.operationsBottom <= mobileLayout.trendTop, 'operations content ends before energy trend on mobile');
  assert.ok(mobileLayout.trendBottom <= mobileLayout.statisticsTop, 'energy trend appears above statistics on mobile');
  const mobileOpsHeights = await page.locator('.plant-overview-ops-section').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().height));
  assert.ok(Math.max(...mobileOpsHeights) - Math.min(...mobileOpsHeights) < 1, 'operations cards remain equal height on mobile');

  await page.screenshot({ path: 'tests/output/plant-overview-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'light'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.deepEqual(
    await page.locator('.plant-overview-ops-section').evaluateAll(cards => cards.map(card => ({
      material:card.classList.contains('wd-discussion-card'),
      background:getComputedStyle(card).backgroundColor,
      shadow:getComputedStyle(card).boxShadow
    }))),
    Array.from({length:3},() => ({material:true,background:'rgb(255, 255, 255)',shadow:'none'})),
    'light operations cards reuse the shared white discussion surface without a shadow'
  );
  await page.screenshot({ path: 'tests/output/plant-overview-light.png' });
  await page.goto(`${origin}/plants/p25?device=inverter`, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  const lightSelfColors=await page.evaluate(() => ({
    wedges:[...document.querySelectorAll('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge:not(.is-hover)')]
      .map(wedge => getComputedStyle(wedge).fill),
    startStops:[...document.querySelectorAll('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge-stop')]
      .filter(stop => stop.classList.contains('is-battery-start')||stop.classList.contains('is-solar-start')||stop.classList.contains('is-grid-start'))
      .map(stop => getComputedStyle(stop).stopColor),
    base:getComputedStyle(document.querySelector('.plant-overview-day-view .is-self-powered .plant-overview-chart-wedge-base')).fill
  }));
  assert.deepEqual(
    lightSelfColors.wedges,
    ['url("#plant-self-battery-gradient")','url("#plant-self-solar-gradient")','url("#plant-self-grid-gradient")'],
    'light self-powered wedges use distinct material gradients'
  );
  assert.equal(new Set(lightSelfColors.startStops).size, 3, 'light self-powered gradient stops retain three separated grey levels');
  assert.match(lightSelfColors.base, /plant-self-base-gradient/, 'the light sector base keeps the quiet radial material gradient');
  const lightEnergyTop=await page.locator('.plant-overview-day-view .is-energy .plant-overview-chart-energy-dot.is-top.is-supply').first().evaluate(dot => ({
    fill:getComputedStyle(dot).fill,
    filter:getComputedStyle(dot).filter
  }));
  assert.equal(lightEnergyTop.fill, 'rgb(115, 114, 109)', 'light energy supply dots soften from black to neutral grey');
  assert.match(lightEnergyTop.filter, /rgba\(28, 28, 26, 0\.16\)/, 'light energy supply glow stays restrained and neutral');
  await page.screenshot({ path: 'tests/output/plant-overview-light-inverter.png' });
  assert.deepEqual(errors, []);

  await browser.close();
  console.log(JSON.stringify({ ok: true, errors }, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
