const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<6;i++){const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);}
 await p.waitForTimeout(500);
 console.log('BEFORE',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing')}}));
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list');const st=performance.now();const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:+(performance.now()-st).toFixed(1),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,w:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),anims:ts.map(e=>e.getAnimations().map(a=>a.transitionProperty||'waapi').join(',')),mat:ts.map(e=>{const m=e.querySelector('.wd-glass-material');return m?+m.getBoundingClientRect().width.toFixed(2):null})});if(performance.now()-st<500)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(600);
 const s=await p.evaluate(()=>window.__s);
 for(const x of s)console.log(x.t, x.n, x.slot, x.w.map(v=>v.toFixed(1)).join('|'), 'a:',x.anims.map(a=>a||'-').join('|'), 'm:',x.mat.map(v=>v==null?'-':v.toFixed(1)).join('|'));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
