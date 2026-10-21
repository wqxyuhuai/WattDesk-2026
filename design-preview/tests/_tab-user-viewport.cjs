const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<6;i++){
   const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();
   await p.mouse.move(box.x+box.width/2,box.y+box.height/2);
   await p.mouse.down();await p.mouse.up();
   await p.waitForTimeout(500);
   console.log('after',i+1,await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),ov:l.classList.contains('is-overflowing'),widths:[...l.querySelectorAll('.workspace-tab')].map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2))}}));
 }
 await p.waitForTimeout(500);
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list');const st=performance.now();const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:performance.now()-st,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),add:document.querySelector('.target-add-tab').getBoundingClientRect().x});if(performance.now()-st<900)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(1000);
 const s=await p.evaluate(()=>window.__s);let prev=null;for(const x of s){const sig=JSON.stringify({slot:x.slot,n:x.n,tw:x.tw.map(v=>+v.toFixed(1)),add:+x.add.toFixed(1)});if(sig!==prev){console.log(x.t.toFixed(0),sig);prev=sig;}}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
