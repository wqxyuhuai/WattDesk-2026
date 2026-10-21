const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<12;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(500);}
 await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),cw:l.clientWidth,sw:l.scrollWidth,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width')}});
 console.log('BEFORE',r);
 await p.getByRole('button',{name:'Add tab'}).click();
 console.log('AFTER',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.lastElementChild;return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),tabWidth:getComputedStyle(t).width,anim:t.getAnimations().map(a=>a.effect.getKeyframes().map(k=>({w:k.width,fb:k.flexBasis}))),add:document.querySelector('.target-add-tab').getBoundingClientRect().x}}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
