const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 console.log(await page.evaluate(()=>{
  const c=document.querySelector('[data-node-id="14578:6106"]');
  const chain=[];let el=c;for(let i=0;i<5&&el;i++,el=el.parentElement){const r=el.getBoundingClientRect();chain.push({id:el.dataset?.nodeId,cls:el.className,style:el.getAttribute('style'),rect:[r.x,r.right,r.y,r.width]})}
  const refresh=document.querySelector('[data-node-id="14612:8453"]');
  const rr=refresh.getBoundingClientRect();return {chain,refresh:{style:refresh.getAttribute('style'),rect:[rr.x,rr.right,rr.y,rr.width]}};
 }));
 await browser.close();
})();
