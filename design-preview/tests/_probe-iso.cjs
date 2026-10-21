const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const v of ['wrap','backdropIsolated']){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-40,y:box.y-40,width:box.width+80,height:box.height+80};
  await p.evaluate((v)=>{
   const panel=document.querySelector('.wd-date-picker');
   panel.getAnimations().forEach(a=>a.cancel());
   panel.removeAttribute('data-closing');
   if(v==='wrap'){
    const wrap=document.createElement('div');
    wrap.style.cssText='position:fixed;inset:0;pointer-events:none';
    panel.parentNode.insertBefore(wrap,panel);wrap.append(panel);
    wrap.animate([{opacity:1},{opacity:.6}],{duration:200,fill:'forwards'}).pause();
    wrap.getAnimations()[0].currentTime=200;
   }else{
    const fill=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
    fill.style.backdropFilter='blur(22px)';
    const a=fill.animate([{opacity:1},{opacity:.6}],{duration:200,fill:'forwards'});a.pause();a.currentTime=200;
   }
  },v);
  await p.screenshot({path:`${out}/iso-${v}.png`,clip});
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
