const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 for(let i=0;i<3;i++){
  await page.goto(previewURL,{waitUntil:'commit'});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true',null,{timeout:20000});
  const m=await page.evaluate(()=>{
   const nav=performance.getEntriesByType('navigation')[0]||{};
   const paints=performance.getEntriesByType('paint').map(p=>[p.name,Math.round(p.startTime)]);
   const ready=performance.now();
   const res=performance.getEntriesByType('resource')
     .map(r=>[r.name.split('/').pop(),Math.round(r.startTime),Math.round(r.duration)])
     .filter(r=>r[2]>30).sort((a,b)=>b[2]-a[2]).slice(0,6);
   return {ready:Math.round(ready),dcl:Math.round(nav.domContentLoadedEventEnd||0),paints,slow:res};
  });
  console.log(JSON.stringify(m));
 }
 await browser.close();
})();

