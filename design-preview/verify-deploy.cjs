const { chromium, launchOptions } = require('./tests/runtime.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const responses = [];
  page.on('response', response => { responses.push(`${response.status()} ${response.url()}`); if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => errors.push(`FAILED ${request.url()}`));
  const url = process.argv[2] || 'http://127.0.0.1:4188/';
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 20000 });
  await page.waitForTimeout(600);
  const result = await page.evaluate(() => ({
    title: document.title,
    theme: document.documentElement.dataset.theme,
    nodes: document.querySelectorAll('.node').length,
    workspace: !!document.querySelector('#home-workspace-panel'),
    fontLoaded: document.fonts.check('16px "SF Pro"'),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    robots: document.querySelector('meta[name="robots"]')?.content || null
  }));
  await page.screenshot({ path: 'tests/output/deploy-check.png', fullPage: false });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'tests/output/deploy-check-light.png', fullPage: false });
  console.log(JSON.stringify({ result, errors, responses }, null, 2));
  await browser.close();
})();
