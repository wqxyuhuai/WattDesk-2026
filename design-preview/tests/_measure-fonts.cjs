const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 for(let i=0;i<3;i++){
  const page=await browser.newPage({viewport:{width:1545,height:1252}});
  await page.addInitScript(()=>{
   window.__t={start:performance.now()};
   addEventListener('DOMContentLoaded',()=>{window.__t.dcl=performance.now();});
   document.fonts.ready.then(()=>{window.__t.fonts=performance.now();});
  });
  await page.goto(previewURL,{waitUntil:'commit'});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:20000});
  const r=await page.evaluate(()=>({...window.__t,ready:performance.now()}));
  console.log(JSON.stringify({start:Math.round(r.start),dcl:r.dcl&&Math.round(r.dcl),fonts:r.fonts&&Math.round(r.fonts),ready:Math.round(r.ready)}));
  await page.close();
 }
 await browser.close();
})();
