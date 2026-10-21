const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const w of [1920,1545,1440,1116]){
  const p=await b.newPage({viewport:{width:w,height:900}});
  await p.goto(previewURL.split('?')[0]);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Add tab'}).click();
  const r=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.lastElementChild;const kf=t.getAnimations().find(a=>a.effect.getKeyframes().some(k=>k.flexBasis))?.effect.getKeyframes()||[];return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),target:kf.at(-1)?.width,now:getComputedStyle(t).width,css:getComputedStyle(t).transitionProperty,cls:t.className}});
  console.log(w,r);await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
