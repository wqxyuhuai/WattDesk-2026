const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252}});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(320);
 await p.evaluate(()=>document.querySelector('.wd-date-picker').dataset.closing='true');
 await p.screenshot({path:'C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d/closing-static.png'});
 const info=await p.evaluate(()=>{
  const panel=document.querySelector('.wd-date-picker');
  panel.dataset.closing='true';
  const fill=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
  const cs=getComputedStyle(fill);
  const layers=[...panel.querySelectorAll('*')].map(el=>{const s=getComputedStyle(el);return {cls:el.className&&String(el.className).slice(0,40),z:s.zIndex,bg:s.backgroundColor,bf:s.backdropFilter,pos:s.position};})
   .filter(x=>x.bf!=='none'||/rgba?\(/.test(x.bg));
  const mat=panel.querySelector(':scope>.wd-glass-material'),ms=getComputedStyle(mat);
  return {host:getComputedStyle(panel).backgroundColor,bg:cs.backgroundColor,bf:cs.backdropFilter,attr:panel.hasAttribute('data-closing'),mat:ms.zIndex,matOpacity:ms.opacity,layers:layers.slice(0,4)};
 });
 console.log(JSON.stringify(info));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
