const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 await page.mouse.move(100,600); await page.waitForTimeout(900);
 console.log(await page.evaluate(()=>{
  const el=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='I14578:6106;14420:2221;14420:2195');
  return {html:el.outerHTML, text:el.textContent, childCount:el.children.length, children:[...el.children].map(c=>({tag:c.tagName,cls:c.className,style:c.getAttribute('style'),color:getComputedStyle(c).color}))};
 }));
 await page.locator('[data-node-id="14578:6106"]').hover(); await page.waitForTimeout(300);
 console.log(await page.evaluate(()=>{
  const el=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='I14578:6106;14420:2221;14420:2195');
  return {labelColor:getComputedStyle(el).color,spanColor:el.querySelector('span')&&getComputedStyle(el.querySelector('span')).color, btn:getComputedStyle(el.parentElement.parentElement).color};
 }));
 await browser.close();
})();
