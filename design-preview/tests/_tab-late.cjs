const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<20;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(70);}
 await p.waitForTimeout(800);
 await p.mouse.move(0,0);await p.waitForTimeout(250);
 console.log('BEFORE',await p.evaluate(()=>{const list=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(list).getPropertyValue('--workspace-tab-width'),n:list.querySelectorAll('.workspace-tab').length,scroll:[list.scrollLeft,list.scrollWidth,list.clientWidth],add:document.querySelector('.target-add-tab').getBoundingClientRect().x}}));
 await p.getByRole('button',{name:'Add tab'}).click();
 console.log('IMMEDIATE',await p.evaluate(async()=>{const list=document.querySelector('.workspace-tab-list'),tab=list.lastElementChild;const slot=parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'));const first=parseFloat(getComputedStyle(tab).width);await new Promise(requestAnimationFrame);const second=parseFloat(getComputedStyle(tab).width);return {slot,first,second,anim:tab.getAnimations().length}}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
