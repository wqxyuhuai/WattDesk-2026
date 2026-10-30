const { chromium } = require('./runtime.cjs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ ...require('./runtime.cjs').launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  const previewURL = require('./runtime.cjs').previewURL.split('?')[0];
  await page.goto(previewURL);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => localStorage.removeItem('wattdesk.recent-visits.v1'));
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');

  const rows = [
    ['14613:1162', 'plants', 'Plants'],
    ['14613:1190', 'service', 'Service ticket'],
    ['14613:1210', 'statistics', 'Statistics'],
    ['14613:1250', 'plants', 'Plants', 'Summit Energy Hub'],
    ['14613:1270', 'plants', 'Plants', 'Eastshore Power Plant'],
    ['14613:1290', 'plants', 'Plants', 'Green Valley Wind Farm'],
    ['14613:1310', 'plants', 'Plants', 'Sunrise Solar Station'],
    ['14613:1330', 'plants', 'Plants', 'Sunrise Solar Station']
  ];

  for (const [index, [id, route, title, station]] of rows.entries()) {
    const row = page.locator(`[data-node-id="${id}"]`);
    assert.equal(await row.getAttribute('role'), 'button', `${id} must be a operable shortcut row`);
    assert.equal(await row.getAttribute('tabindex'), '0', `${id} must be keyboard reachable`);
    assert.equal((await row.getAttribute('aria-label')).trim(), station || (await row.textContent()).trim());
    if (station) assert.equal(await row.getAttribute('aria-describedby'), null, `${id} must not invent a station detail target`);
    if (index === 0) {
      await row.focus();
      await page.keyboard.press('Enter');
    } else {
      await row.click();
    }
    await page.waitForTimeout(360);
    assert.equal(await page.locator('.workspace-tab').count(), 1, `${id} must not create a tab`);
    assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(), title);
    assert.equal(await page.locator(`.target-nav[data-route="${route}"]`).getAttribute('aria-current'), 'page');
    assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(), false, `${id} must leave Home visible=false`);
    if (route === 'plants') {
      assert.equal(await page.locator('.plants-view').isVisible(), true, `${id} must show the real Plants surface`);
    } else if (route === 'service') {
      assert.equal(await page.locator('.service-view').isVisible(), true, `${id} must show the real Service ticket surface`);
      assert.ok(await page.locator('.service-card').count() > 0, `${id} must land on ticket cards`);
    } else {
      assert.equal(await page.locator('.wd-empty-state').isVisible(), true, `${id} must show the shared route surface`);
      assert.equal((await page.locator('.wd-empty-state-label').textContent()).trim(), 'Coming soon');
    }
    assert.equal(new URL(page.url()).pathname, `/${route}`, `${id} must update the browser URL`);
    await page.locator('.target-nav[data-route="home"]').click();
    await page.waitForTimeout(320);
    assert.equal(new URL(page.url()).pathname, '/home', `${id} must return to /home`);
  }

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ rows: rows.length, errors }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
