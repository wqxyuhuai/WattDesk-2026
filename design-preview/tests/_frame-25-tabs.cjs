const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const add=async()=>{const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(500)};
 for(let i=0;i<9;i++)await add();
 await p.waitForTimeout(500);
 console.log('before',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),ov:l.classList.contains('is-overflowing')}}));
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list');const st=performance.now();let k=0;const tick=()=>{const ts=[...l.querySelectorAll('.workspace-tab')];window.__s.push({t:+(performance.now()-st).toFixed(1),slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:ts.length,tw:ts.map(e=>+parseFloat(getComputedStyle(e).width).toFixed(2)),fb:ts.map(e=>+parseFloat(getComputedStyle(e).flexBasis).toFixed(2)),pad:ts.map(e=>getComputedStyle(e).paddingLeft)});if(k++<12)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 await add();
 console.log(JSON.stringify(await p.evaluate(()=>window.__s)));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
