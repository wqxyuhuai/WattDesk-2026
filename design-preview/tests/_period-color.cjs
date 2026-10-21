const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 await page.waitForTimeout(700);
 const out=await page.evaluate(()=>{
  const el=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');
  const root=document.querySelector('[data-node-id="14578:6106"]');
  const cs=e=>{const s=getComputedStyle(e);return {color:s.color,fontWeight:s.fontWeight,fontSize:s.fontSize,fontVariationSettings:s.fontVariationSettings}};
  return {label:cs(el),root:cs(root),html:root.outerHTML.slice(0,900)};
 });
 console.log(JSON.stringify(out,null,2));
 await browser.close();
})();
