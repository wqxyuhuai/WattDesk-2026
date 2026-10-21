const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const [name,mode] of Object.entries({backdrop:'backdrop',solidwhite:'solidwhite',semiwhite:'semiwhite'})){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-60,y:box.y-40,width:box.width+120,height:box.height+80};
  await p.evaluate((mode)=>{
   const el=document.querySelector('.wd-date-picker');
   const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   f.style.backdropFilter='none';f.style.webkitBackdropFilter='none';
   if(mode==='solidwhite')f.style.backgroundColor='rgba(255,255,255,.12)';
   if(mode==='semiwhite')f.style.backgroundColor='rgba(36,36,38,.9)';
  },mode);
  await p.waitForTimeout(200);
  await p.screenshot({path:`${out}/comp-${name}.png`,clip});
  await p.close();
 }
 await b.close();
 console.log('done');
})().catch(e=>{console.error(e);process.exit(1)})
