const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 const box=await p.locator('.wd-date-picker').boundingBox();
 const clip={x:box.x-40,y:box.y-40,width:box.width+80,height:box.height+80};
 await p.evaluate(()=>{window.__c=[...document.querySelectorAll('.wd-date-picker button')].find(b=>b.textContent.trim()==='Cancel');window.__c.click();});
 for(const t of [0,50,100,150,190]){
  await p.waitForTimeout(50);
  const st=await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');if(!el)return null;const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');const c=el.querySelector('.wd-date-picker-content');return {host:getComputedStyle(el).opacity,content:getComputedStyle(c).opacity,fillBg:getComputedStyle(f).backgroundColor,bf:getComputedStyle(f).backdropFilter,shadow:getComputedStyle(f).boxShadow.slice(0,40)}});
  console.log(t,st);
  if(st)await p.screenshot({path:`${out}/c2-${t}.png`,clip});
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
