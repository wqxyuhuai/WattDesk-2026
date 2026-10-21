const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(const n of [1,2,3,4]){
  await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(500);
  console.log(n+1,await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),cw:l.clientWidth,sw:l.scrollWidth}}));
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
