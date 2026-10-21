const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const variant of ['none','scaleOnly','opacityOnly','both']){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-40,y:box.y-40,width:box.width+80,height:box.height+80};
  const info=await p.evaluate((v)=>{
   const panel=document.querySelector('.wd-date-picker');
   panel.getAnimations().forEach(a=>a.cancel());
   const frames=v==='none'?[{transform:'scale(1)'},{transform:'scale(1)'}]
    :v==='scaleOnly'?[{transform:'scale(1)'},{transform:'scale(.96)'}]
    :v==='opacityOnly'?[{opacity:1},{opacity:.45}]
    :[{opacity:1,transform:'scale(1)'},{opacity:.45,transform:'scale(.96)'}];
   const a=panel.animate(frames,{duration:200,fill:'forwards'});a.pause();a.currentTime=200;
   return {op:getComputedStyle(panel).opacity,filter:getComputedStyle(panel.querySelector('.wd-glass-fill')).backdropFilter};
  },variant);
  await p.screenshot({path:`${out}/blur-${variant}.png`,clip});
  console.log(variant,JSON.stringify(info));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
