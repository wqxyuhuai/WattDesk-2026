const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-30,y:box.y-30,width:box.width+60,height:box.height+60};
 console.log(box);
 // add one frame capture using CDP screencast is heavy; instead pause animation at times
 await p.evaluate(()=>{
  const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Cancel');
  window.__btn=btn;
 });
 for(const t of [0,40,80,120,160,200]){
  if(t===0){await p.evaluate(()=>window.__btn.click());}
  else {await p.waitForTimeout(t===40?40:40);}
  await p.screenshot({path:`${out}/close-${t}.png`,clip});
  const s=await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');if(!el)return null;const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');const cs=getComputedStyle(el);return {op:cs.opacity,bf:f?getComputedStyle(f).backdropFilter:null,bg:f?getComputedStyle(f).backgroundColor:null,closing:el.dataset.closing||null}});
  console.log(t,s);
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
