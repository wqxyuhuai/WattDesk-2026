const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-20,y:box.y-20,width:box.width+40,height:box.height+40};
 const cases={
  host:'0',
  hostTZ:'translateZ(0)',
  fillOnly:'filltransparent',
  noShadow:'noshadow'
 };
 for(const [name,mode] of Object.entries(cases)){
  await p.evaluate((mode)=>{const el=document.querySelector('.wd-date-picker');const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   el.style.opacity='';el.style.transform='';f.style.opacity='';
   if(mode==='0'){el.style.opacity='0.6';}
   if(mode==='translateZ(0)'){el.style.opacity='0.6';el.style.transform='translateZ(0)';}
   if(mode==='filltransparent'){el.style.opacity='';f.style.opacity='0.5';}
   if(mode==='noshadow'){el.style.opacity='0.6';f.style.boxShadow='none';}
  },mode);
  await p.waitForTimeout(200);
  await p.screenshot({path:`${out}/bf-${name}.png`,clip});
 }
 console.log('done');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
