const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:992}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(420);}
 await p.mouse.move(300,50);
 await p.waitForTimeout(400);
 const before=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:l.querySelectorAll('.workspace-tab').length,frozen:[...l.querySelectorAll('.workspace-tab')].map(t=>t.style.width||'')}});
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list'),a=document.querySelector('.target-add-tab');const st=performance.now();let k=0;const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:+(performance.now()-st).toFixed(1),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),inline:ts.map(e=>e.style.width||''),add:+a.getBoundingClientRect().x.toFixed(1),frozen:[...l.childNodes].filter(x=>x.classList?.contains('workspace-tab-freeze-spacer')).length});if(k++<18)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(400);
 console.log({before,after:await p.evaluate(()=>window.__s)});
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
