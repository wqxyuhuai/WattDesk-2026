const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const addOnce=async()=>{const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);};
 for(let i=0;i<13;i++){await addOnce();const s=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing')}});if(s.ov)break;}
 await p.waitForTimeout(600);
 const before=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),tabRects:[...l.querySelectorAll('.workspace-tab')].map(e=>{const r=e.getBoundingClientRect();const m=e.querySelector('.wd-glass-material').getBoundingClientRect();return {tab:[+r.x.toFixed(1),+r.width.toFixed(2)],mat:[+m.x.toFixed(1),+m.width.toFixed(2)]}})}});
 console.log('BEFORE',JSON.stringify(before));
 const res=await p.evaluate(async()=>{
  const l=document.querySelector('.workspace-tab-list');
  const orig=l.style.setProperty.bind(l.style);
  const changes=[];
  l.style.setProperty=(name,val,prio)=>{if(name==='--workspace-tab-width')changes.push({t:performance.now(),val});return orig(name,val,prio)};
  const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='childList'&&m.addedNodes.length){changes.push({t:performance.now(),type:'childadded',cls:[...m.addedNodes].map(n=>n.className)});}}});mo.observe(l,{childList:true,subtree:false});
  document.querySelector('.target-add-tab').click();
  await new Promise(r=>setTimeout(r,600));
  mo.disconnect();
  return {changes};
 });
 console.log(JSON.stringify(res));
 const after=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.querySelectorAll('.workspace-tab');return {n:t.length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),last:t[t.length-1]?.className,lastRect:t[t.length-1]&&[...t[t.length-1].getBoundingClientRect()].slice(0,4).map(v=>+v.toFixed(1))}});
 console.log('AFTER',JSON.stringify(after));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
