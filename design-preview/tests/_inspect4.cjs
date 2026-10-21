const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.click(100,700);await page.waitForTimeout(900);
 console.log(await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='14578:6106');
  return {theme:document.documentElement.dataset.theme,btnHTML:btn.outerHTML.slice(0,3000),btnColor:getComputedStyle(btn).color};
 }));
 const button=page.locator('[data-node-id="14578:6106"]');
 await button.hover();await page.waitForTimeout(400);
 console.log('hover color',await button.evaluate(el=>getComputedStyle(el).color));
 await browser.close();
})();
