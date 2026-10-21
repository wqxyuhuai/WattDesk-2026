const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(300);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-40,y:box.y-40,width:box.width+80,height:box.height+80};
 await p.evaluate(()=>{
  const el=document.querySelector('.wd-date-picker');
  el.querySelector('.wd-date-picker-content').style.visibility='hidden';
  el.querySelector(':scope>.wd-glass-material>.wd-glass-optics').style.visibility='hidden';
 });
 await p.waitForTimeout(200);
 await p.screenshot({path:`${out}/inner2-nooptics.png`,clip});
 await p.evaluate(()=>{const f=document.querySelector('.wd-date-picker>:scope>.wd-glass-material'); });
 // fill only, no blur
 await p.evaluate(()=>{const f=document.querySelector('.wd-date-picker>.wd-glass-material>.wd-glass-fill');f.style.backdropFilter='none';});
 await p.waitForTimeout(200);
 await p.screenshot({path:`${out}/inner2-noblur.png`,clip});
 await b.close();console.log('done');
})().catch(e=>{console.error(e);process.exit(1)})
