const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1100,height:900});await page.waitForTimeout(320);
 for(let i=0;i<8;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90)}
 await page.waitForTimeout(400);
 console.log('before',JSON.stringify(await page.evaluate(()=>({
  count:document.querySelectorAll('.workspace-tab').length,
  listRect:(()=>{const r=document.querySelector('.workspace-tab-list').getBoundingClientRect();return [r.x,r.right,r.width]})(),
  scroll:[document.querySelector('.workspace-tab-list').scrollLeft,document.querySelector('.workspace-tab-list').scrollWidth,document.querySelector('.workspace-tab-list').clientWidth],
  tabs:[...document.querySelectorAll('.workspace-tab')].map(t=>({id:t.id,x:Math.round(t.getBoundingClientRect().x),w:Math.round(t.getBoundingClientRect().width)})),
  closes:[...document.querySelectorAll('.workspace-tab-close')].map(c=>({x:Math.round(c.getBoundingClientRect().x),y:Math.round(c.getBoundingClientRect().y)}))
 }))));
 const tab=page.locator('.workspace-tab').nth(2);await tab.hover();await page.waitForTimeout(300);
 const box=await tab.locator('.workspace-tab-close').boundingBox();
 console.log('clickBox',box);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.locator('.workspace-tab').nth(2).locator('.workspace-tab-close').click();
 await page.waitForTimeout(300);
 console.log('after',JSON.stringify(await page.evaluate(({x,y})=>{
   const hit=document.elementFromPoint(x,y); const t=hit&&hit.closest('.workspace-tab');
   return {hit:hit&&hit.className,tab:t&&t.id,closes:[...document.querySelectorAll('.workspace-tab')].map(t=>{const r=t.querySelector('.workspace-tab-close').getBoundingClientRect();return {id:t.id,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width)}}),scroll:[document.querySelector('.workspace-tab-list').scrollLeft,document.querySelector('.workspace-tab-list').scrollWidth,document.querySelector('.workspace-tab-list').clientWidth],list:(()=>{const r=document.querySelector('.workspace-tab-list').getBoundingClientRect();return [r.x,r.right,r.width]})()};
 },{x:box.x+box.width/2,y:box.y+box.height/2}),null,2));
 await browser.close();
})();
