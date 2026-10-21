const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 console.log(JSON.stringify(await page.evaluate(()=>{
  const c=document.querySelector('[data-node-id="14578:6106"]');
  const row=c.parentElement;
  return {ctrl:{left:c.style.left,w:c.style.width},row:{left:row.style.left,w:row.style.width},rowParent:{left:row.parentElement.style.left,w:row.parentElement.style.width,id:row.parentElement.dataset.nodeId},label:document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]').style.width};
 })));
 await browser.close();
})();
