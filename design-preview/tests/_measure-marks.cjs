const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 for(let i=0;i<3;i++){
  const page=await browser.newPage({viewport:{width:1545,height:1252}});
  await page.addInitScript(()=>{
   window.__t={start:performance.now(),marks:{}};
   const mark=(k)=>{if(window.__t.marks[k]===undefined)window.__t.marks[k]=Math.round(performance.now());};
   new MutationObserver(()=>{
    if(document.querySelector('#home-workspace-panel'))mark('panel');
    if(document.querySelector('.home-content-canvas'))mark('canvas');
    if(document.querySelector('.status-card'))mark('statusCard');
    if(document.querySelector('.chart-card-heading'))mark('chartMenu');
    if(document.documentElement.dataset.ready==='true')mark('ready');
   }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ready']});
  });
  await page.goto(previewURL,{waitUntil:'commit'});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:20000});
  const r=await page.evaluate(()=>window.__t.marks);
  console.log(JSON.stringify(r));
  await page.close();
 }
 await browser.close();
})();
