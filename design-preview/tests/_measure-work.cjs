const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 await page.goto(previewURL);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 // Measure the gap between scene insertion and ready by timing a reload with a
 // long task observer injected before module execution.
 const timing=await page.evaluate(async()=>{
  const t0=performance.now();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {now:Math.round(performance.now()-t0)};
 });
 console.log(JSON.stringify(timing));
 // Probe: how long does one extra theme-map pass take?
 const probe=await page.evaluate(async()=>{
  const start=performance.now();
  const r=await fetch('./src/pages/home/data/theme-map.json');await r.json();
  return Math.round(performance.now()-start);
 });
 console.log('theme-map refetch ms',probe);
 await browser.close();
})();
