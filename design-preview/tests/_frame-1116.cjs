const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 console.log('initial',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),c=document.querySelector('.workspace-tabs'),a=document.querySelector('.target-add-tab');const s=getComputedStyle(l),cs=getComputedStyle(c);return {container:c.clientWidth,add:a.offsetWidth,list:l.clientWidth,gap:s.gap,cgap:cs.gap,slot:s.getPropertyValue('--workspace-tab-width'),n:l.children.length}}));
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(450);}
 await p.waitForTimeout(500);
 console.log('before',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing'),widths:[...l.querySelectorAll('.workspace-tab')].map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2))}}));
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list'),a=document.querySelector('.target-add-tab');const st=performance.now();let k=0;const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:+ (performance.now()-st).toFixed(1),k:k++,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),add:+a.getBoundingClientRect().x.toFixed(1),ov:l.classList.contains('is-overflowing')});if(k<20)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(400);
 console.log(JSON.stringify(await p.evaluate(()=>window.__s),null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
