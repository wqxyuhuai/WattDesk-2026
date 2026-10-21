const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();await page.mouse.move(0,0);await page.waitForTimeout(320);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1100,height:900});await page.waitForTimeout(320);
 for(let i=0;i<8;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90)}
 await page.waitForTimeout(360);
 const panel=page.locator('[data-node-id="14578:6106"]');
 console.log(JSON.stringify(await page.evaluate(()=>({
  count:document.querySelectorAll('.workspace-tab').length,
  tabs:[...document.querySelectorAll('.workspace-tab')].map(t=>({id:t.id,x:Math.round(t.getBoundingClientRect().x),w:Math.round(t.getBoundingClientRect().width)})),
  rects:(()=>{const r=document.querySelector('.workspace-tab-list').getBoundingClientRect();return [r.x,r.right,r.width]})()
 })),null,2));
 await browser.close();
})();
