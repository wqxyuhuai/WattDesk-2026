const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{
  const el=document.querySelector('.wd-date-picker');
  const f=el.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
  const cs=getComputedStyle(el);
  return {bg:cs.backgroundColor,bf:cs.backdropFilter,im:cs.backgroundImage,sh:cs.boxShadow,filter:cs.filter,mix:cs.mixBlendMode};
 }));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
