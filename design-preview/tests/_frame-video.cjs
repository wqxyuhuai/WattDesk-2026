const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const addOnce=async()=>{const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);};
 for(let i=0;i<12;i++){await addOnce();const s=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,ov:l.classList.contains('is-overflowing')}});if(s.ov)break;}
 await p.waitForTimeout(500);
 const cdp=await p.context().newCDPSession(p);
 const frames=[];
 cdp.on('Page.screencastFrame',async ev=>{frames.push({t:Date.now(),data:ev.data});await cdp.send('Page.screencastFrameAck',{sessionId:ev.sessionId});});
 await cdp.send('Page.startScreencast',{format:'png',everyNthFrame:1,maxWidth:2560,maxHeight:200});
 const t0=Date.now();
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(600);
 await cdp.send('Page.stopScreencast');
 fs.mkdirSync('tests/output/tabframes',{recursive:true});
 for(let i=0;i<frames.length;i++)fs.writeFileSync(`tests/output/tabframes/f${String(i).padStart(2,'0')}.png`,Buffer.from(frames[i].data,'base64'));
 console.log('frames',frames.length,frames.map(f=>f.t-t0));
 const probe=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {n:l.querySelectorAll('.workspace-tab').length,slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),rights:[...l.querySelectorAll('.workspace-tab')].map(e=>{const r=e.getBoundingClientRect();return +r.right.toFixed(1)}),add:+document.querySelector('.target-add-tab').getBoundingClientRect().right.toFixed(1)}});
 console.log(probe);
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
