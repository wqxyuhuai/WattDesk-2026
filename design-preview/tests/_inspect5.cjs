const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.click(100,700);await page.waitForTimeout(900);
 console.log(JSON.stringify(await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='14578:6106');
  const walk=(el,depth=0)=>{const cs=getComputedStyle(el);return {d:depth,tag:el.tagName,id:el.dataset?.nodeId||'',cls:typeof el.className==='string'?el.className:'',inline:el.getAttribute('style')?.slice(0,180),color:cs.color,opacity:cs.opacity,fontSize:cs.fontSize,weight:cs.fontWeight,hover:el.matches(':hover'),children:depth<3?[...el.children].map(c=>walk(c,depth+1)):[]}};
  return walk(btn);
 }),null,1));
 await browser.close();
})();
