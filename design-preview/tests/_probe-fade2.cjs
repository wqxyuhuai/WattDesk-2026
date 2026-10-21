const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const [name,body] of Object.entries({
  content0_panel60:`el.querySelector('.wd-date-picker-content').style.opacity='0';el.style.opacity='.6';`,
  content0_panel30:`el.querySelector('.wd-date-picker-content').style.opacity='0';el.style.opacity='.3';`,
  content20_panel60:`el.querySelector('.wd-date-picker-content').style.opacity='.2';el.style.opacity='.6';`,
  content0_fill40:`el.querySelector('.wd-date-picker-content').style.opacity='0';el.querySelector(':scope>.wd-glass-material>.wd-glass-fill').style.opacity='.4';`,
 })){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(300);
  const box=await p.locator('.wd-date-picker').boundingBox();
  const clip={x:box.x-60,y:box.y-40,width:box.width+120,height:box.height+80};
  await p.evaluate(`(()=>{const el=document.querySelector('.wd-date-picker');${body}})()`);
  await p.waitForTimeout(200);
  await p.screenshot({path:`${out}/f2-${name}.png`,clip});
  console.log(name,'ok');
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
