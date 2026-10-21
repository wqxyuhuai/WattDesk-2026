const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(let i=0;i<3;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(320);}
 await p.waitForTimeout(360);
 const r=await p.evaluate(async()=>{
  const l=document.querySelector('.workspace-tab-list');const before=parseFloat(getComputedStyle(l).getPropertyValue('--workspace-tab-width'));
  const btn=document.querySelector('.target-add-tab');btn.click();const tab=l.lastElementChild;
  const tr=tab.getAnimations().map(a=>({type:a.constructor.name,keys:a.effect.getKeyframes().map(k=>({o:k.offset,w:k.width,fb:k.flexBasis}))}));
  const samples=[];const st=performance.now();
  await new Promise(res=>{const f=()=>{samples.push(parseFloat(getComputedStyle(tab).width));if(performance.now()-st<300)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
  return {before,slot:parseFloat(getComputedStyle(l).getPropertyValue('--workspace-tab-width')),tr,max:Math.max(...samples),samples:samples.map(v=>+v.toFixed(1))};
 });
 console.log(JSON.stringify(r,null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
