const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:2});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(360);
 const box=await p.locator('.wd-date-picker').boundingBox();
 await p.getByRole('button',{name:'Cancel'}).click();
 let prev=0;
 for(const ms of [40,90,150,230]){await p.waitForTimeout(ms-prev);prev=ms;
  await p.screenshot({path:`${out}/exit-${ms}.png`,clip:{x:box.x-70,y:box.y-70,width:box.width+140,height:box.height+140}});}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
