const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 const reqs=[];
 page.on('requestfinished',async r=>{
   const t=r.timing();
   reqs.push({u:r.url().split('/').pop(),start:Math.round(t.startTime),end:Math.round(t.responseEnd)});
 });
 await page.goto(previewURL,{waitUntil:'load'});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const total=reqs.length;
 const svg=reqs.filter(r=>r.u.endsWith('.svg'));
 const lastSvg=Math.max(...svg.map(r=>r.end));
 const lastAny=Math.max(...reqs.map(r=>r.end));
 console.log(JSON.stringify({total,svg:svg.length,lastSvg,lastAny,slowest:reqs.sort((a,b)=>b.end-a.end).slice(0,8)},null,1));
 await browser.close();
})();
