const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const at of [40,100,160]){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-40,y:box.y-40,width:box.width+80,height:box.height+80};
  const r=await p.evaluate((t)=>{
   const panel=document.querySelector('.wd-date-picker');
   panel.getAnimations().forEach(a=>a.cancel());
   panel.removeAttribute('data-closing');
   const a=panel.animate([{clipPath:'inset(0% 0% 0% 0% round 30px)',opacity:1,offset:0},{clipPath:'inset(38% 34% 40% 34% round 30px)',opacity:1,offset:.82},{clipPath:'inset(46% 42% 48% 42% round 30px)',opacity:0,offset:1}],{duration:200,fill:'forwards'});
   a.pause();a.currentTime=t;
   const f=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   return {bf:getComputedStyle(f).backdropFilter,op:getComputedStyle(panel).opacity};
  },at);
  await p.screenshot({path:`${out}/iris-${at}.png`,clip});
  console.log(at,JSON.stringify(r));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
