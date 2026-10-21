const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(300);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-30,y:box.y-30,width:box.width+60,height:box.height+60};
 const modes={fill50:{f:.5,c:.5,t:''},fill50scale:{f:.5,c:.5,t:'scale(.97)'},content50:{f:1,c:.5,t:''}};
 for(const [name,m] of Object.entries(modes)){
  await p.evaluate((m)=>{
   const el=document.querySelector('.wd-date-picker');const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   const c=el.querySelector('.wd-date-picker-content');
   el.removeAttribute('data-closing');el.style.opacity='';
   f.style.opacity=String(m.f);c.style.opacity=String(m.c);el.style.transform=m.t;el.style.transformOrigin='50% 40%';
  },m);
  await p.waitForTimeout(250);
  await p.screenshot({path:`${out}/fade-${name}.png`,clip});
  const st=await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');return {bf:getComputedStyle(f).backdropFilter,op:getComputedStyle(el).opacity}});
  console.log(name,st);
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
