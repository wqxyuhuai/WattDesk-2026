const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await p.waitForTimeout(500);
 console.log('initial frames before add, DOM widths');
 await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');const ts=[...l.querySelectorAll('.workspace-tab')];console.log({slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),w:ts.map(e=>getComputedStyle(e).width),rect:ts.map(e=>e.getBoundingClientRect().width),glass:ts.map(e=>e.querySelector('.wd-glass-material')?.getBoundingClientRect().width)});});
 const addOnce=async()=>{const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);};
 for(let i=0;i<12;i++){await addOnce();const s=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),ov:l.classList.contains('is-overflowing'),rects:[...l.querySelectorAll('.workspace-tab')].map(e=>+e.getBoundingClientRect().width.toFixed(2))}});console.log(i+2,s);if(s.ov)break;}
 await p.waitForTimeout(500);
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list');const st=performance.now();const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:performance.now()-st,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),rect:ts.map(e=>{const r=e.getBoundingClientRect();return [+r.x.toFixed(1),+r.width.toFixed(2)]}),mat:ts.map(e=>{const m=e.querySelector('.wd-glass-material');if(!m)return null;const r=m.getBoundingClientRect();return [+r.x.toFixed(1),+r.width.toFixed(2)]}),cls:ts.map(e=>e.className.includes('is-entering'))});if(performance.now()-st<450)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(600);
 const s=await p.evaluate(()=>window.__s);console.log(JSON.stringify(s));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
