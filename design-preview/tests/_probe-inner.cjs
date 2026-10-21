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
 const variants={};
 for(const [name,js] of Object.entries({
  innerHidden:`document.querySelectorAll('.wd-date-picker .wd-glass').forEach(n=>{if(!n.classList.contains('wd-date-picker'))n.style.visibility='hidden'})`,
  contentHidden:`document.querySelector('.wd-date-picker-content').style.visibility='hidden'`,
  allHidden:`document.querySelectorAll('.wd-date-picker .wd-glass').forEach(n=>{n.style.visibility='hidden'});document.querySelector('.wd-date-picker-content').style.visibility='hidden'`,
  fillHalf:`document.querySelector('.wd-date-picker>.wd-glass-material>.wd-glass-fill').style.opacity='.5'`,
  contentsHalf:`document.querySelector('.wd-date-picker-content').style.opacity='.5'`,
 })){
  await p.evaluate(js);
  await p.waitForTimeout(150);
  await p.screenshot({path:`${out}/inner-${name}.png`,clip});
 }
 await b.close();console.log('done');
})().catch(e=>{console.error(e);process.exit(1)})
