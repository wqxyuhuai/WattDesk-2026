const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(400);}
 await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return [...l.querySelectorAll('.workspace-tab')].map(t=>({id:t.dataset.tabId,offset:t.offsetWidth,rect:t.getBoundingClientRect().width,css:getComputedStyle(t).width,fb:getComputedStyle(t).flexBasis,min:getComputedStyle(t).minWidth,anim:t.getAnimations().map(a=>a.playState)}))}));
 await p.getByRole('button',{name:'Add tab'}).click();
 console.log('NOW',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.lastElementChild;return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),width:getComputedStyle(t).width,fba:getComputedStyle(t).flexBasis,offset:t.offsetWidth,rect:t.getBoundingClientRect().width,anim:t.getAnimations().map(a=>({state:a.playState,keyframes:a.effect.getKeyframes()}))}}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
