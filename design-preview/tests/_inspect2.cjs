const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1590,height:1252},deviceScaleFactor:3});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.move(100,600);await page.waitForTimeout(900);
 const btn=page.locator('[data-node-id="14578:6106"]');
 console.log(await btn.evaluate(el=>el.outerHTML.slice(0,2500)));
 const a=page.locator('.target-avatar');await a.screenshot({path:'tests/output/avatar-light-zoom.png'});
 await page.locator('.target-account').hover();await page.waitForTimeout(350);await a.screenshot({path:'tests/output/avatar-light-hover.png'});
 await page.locator('[data-node-id="14578:6106"]').screenshot({path:'tests/output/period-light.png'});
 const heading=page.locator('.node.text').filter({hasText:'Your energy, at a glance.'});
 console.log('heading html',await heading.evaluate(el=>el.outerHTML.slice(0,1200)));
 await browser.close();
})();
