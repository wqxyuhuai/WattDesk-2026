const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const theme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(360);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-60,y:box.y-60,width:box.width+120,height:box.height+120};
  await p.getByRole('button',{name:'Cancel'}).click();
  let prev=0;
  for(const ms of [30,60,100,140,180]){await p.waitForTimeout(ms-prev);prev=ms;
   await p.screenshot({path:`${out}/x2-${theme}-${ms}.png`,clip});}
  await p.waitForTimeout(200);
  console.log(theme,'removed',await p.locator('.wd-date-picker').count());
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
