const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(300);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-60,y:box.y-40,width:box.width+120,height:box.height+80};
 const cases={
  base:null,
  op50:()=>{const el=document.querySelector('.wd-date-picker');el.style.opacity='.5'},
  mask50:()=>{const el=document.querySelector('.wd-date-picker');el.style.maskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))';el.style.webkitMaskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))'},
  matmask50:()=>{const el=document.querySelector('.wd-date-picker');const m=el.querySelector(':scope>.wd-glass-material');m.style.maskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))';m.style.webkitMaskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))'},
  fillmask50:()=>{const el=document.querySelector('.wd-date-picker');const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');f.style.maskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))';f.style.webkitMaskImage='linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5))'},
 };
 for(const [name,fn] of Object.entries(cases)){
  await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');el.style.cssText='';el.querySelectorAll('[style]').forEach(n=>{if(n!==el&&!n.classList.contains('wd-date-segment'))n.removeAttribute('style')});});
  if(fn)await p.evaluate(fn);
  await p.waitForTimeout(220);
  const st=await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');return {bf:getComputedStyle(f).backdropFilter,op:getComputedStyle(el).opacity,mask:getComputedStyle(el).maskImage}});
  await p.screenshot({path:`${out}/m2-${name}.png`,clip});
  console.log(name,JSON.stringify(st));
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
