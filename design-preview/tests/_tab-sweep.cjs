const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const w of [1500,1472,1440,1400,1333,1280,1180,1116,1024]){
  const p=await b.newPage({viewport:{width:w,height:900}});
  await p.goto(previewURL.split('?')[0]);
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(300);}
  await p.waitForTimeout(400);
  const before=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),ov:l.classList.contains('is-overflowing'),n:l.querySelectorAll('.workspace-tab').length}});
  await p.getByRole('button',{name:'Add tab'}).click();
  const after=await p.evaluate(async()=>{const l=document.querySelector('.workspace-tab-list'),t=l.lastElementChild;const slot=parseFloat(getComputedStyle(l).getPropertyValue('--workspace-tab-width'));const first=parseFloat(getComputedStyle(t).width);await new Promise(requestAnimationFrame);return {slot,first,second:parseFloat(getComputedStyle(t).width),ov:l.classList.contains('is-overflowing')}});
  console.log(w,JSON.stringify({before,after}));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
