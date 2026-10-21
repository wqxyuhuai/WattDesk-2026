const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const addOnce=async()=>{const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);};
 for(let i=0;i<12;i++){await addOnce();const s=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),ov:l.classList.contains('is-overflowing'),container:document.querySelector('.workspace-tabs').clientWidth,list:l.clientWidth}});console.log(i+1,s);if(s.ov)break;}
 await p.waitForTimeout(400);
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list'),a=document.querySelector('.target-add-tab');const st=performance.now();let k=0;const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:+(performance.now()-st).toFixed(1),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),ov:l.classList.contains('is-overflowing')});if(k++<18)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 await addOnce();await p.waitForTimeout(400);
 console.log(JSON.stringify(await p.evaluate(()=>window.__s)));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
