const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.setViewportSize({width:1920,height:1080});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<12;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(500);}
 await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),cw:l.clientWidth,sw:l.scrollWidth,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width')}});
 console.log('BEFORE',r);
 await p.getByRole('button',{name:'Add tab'}).click();
 await p.waitForTimeout(20);
 const a=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.lastElementChild;return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),cw:l.clientWidth,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),tabWidth:getComputedStyle(t).width,rect:t.getBoundingClientRect().width,add:document.querySelector('.target-add-tab').getBoundingClientRect().x,anims:t.getAnimations().map(a=>a.effect.getKeyframes())}}); console.log(JSON.stringify(a,null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
