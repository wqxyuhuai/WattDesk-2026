const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const [name,mode] of Object.entries({keep:1,remove:.6,remove2:.4})){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-60,y:box.y-40,width:box.width+120,height:box.height+80};
  await p.evaluate((mode)=>{
   const el=document.querySelector('.wd-date-picker');
   el.querySelector('.wd-date-picker-content').style.opacity='0';
   const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   f.style.backdropFilter='blur(22px) saturate(1.16)';
   f.style.backgroundColor=`rgba(28,28,30,${mode*0.44})`;
   if(mode===1){f.style.backgroundColor='rgba(28,28,30,0.44)';}
  },mode);
  await p.waitForTimeout(120);
  await p.screenshot({path:`${out}/f3-${name}.png`,clip});
  await p.close();
 }
 await b.close();console.log('done');
})().catch(e=>{console.error(e);process.exit(1)})
