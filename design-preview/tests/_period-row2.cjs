const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 console.log(JSON.stringify(await page.evaluate(()=>{
  const ids=['14578:6003','14612:8453','14561:836','14570:1074','14570:1111'];
  return Object.fromEntries(ids.map(id=>{const e=document.querySelector(`[data-node-id="${id}"]`);const r=e.getBoundingClientRect();return [id,{style:e.getAttribute('style'),rect:[r.x,r.right,r.y,r.width]}]}));
 }),null,2));
 await browser.close();
})();
