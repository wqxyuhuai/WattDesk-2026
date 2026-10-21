const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-30,y:box.y-30,width:box.width+60,height:box.height+60};
 for(const [name,mask] of [['mask','on'],['nofilter','off']]){
  await p.evaluate(({mask})=>{
   const panel=document.querySelector('.wd-date-picker');
   panel.getAnimations().forEach(a=>a.cancel());
   panel.style.opacity='1';
   if(mask==='off'){panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill').style.backdropFilter='none';}
   panel.style.setProperty('-webkit-mask-image','linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45))');
   panel.style.setProperty('mask-image','linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45))');
  },{mask});
  await p.waitForTimeout(120);
  await p.screenshot({path:`${out}/mask-${name}.png`,clip});
 }
 // also plain opacity reference
 await p.evaluate(()=>{const panel=document.querySelector('.wd-date-picker');panel.style.maskImage='';panel.style.webkitMaskImage='';panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill').style.backdropFilter='';panel.style.opacity='0.45';});
 await p.waitForTimeout(120);
 await p.screenshot({path:`${out}/mask-opacity.png`,clip});
 console.log('ok');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
