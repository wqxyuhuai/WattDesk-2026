const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<6;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(450);}
 await p.waitForTimeout(500);
 const info=await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width').trim(),n:l.querySelectorAll('.workspace-tab').length}});
 console.log(info);
 const frames=[];
 const start=Date.now();
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await p.mouse.down();await p.mouse.up();
 for(let i=0;i<10;i++){
  const shot=await p.screenshot({clip:{x:0,y:0,width:1497,height:70}});
  frames.push({t:Date.now()-start,b64:shot.toString('base64')});
 }
 require('fs').writeFileSync('tests/output/_frames.json',JSON.stringify(frames));
 console.log(frames.map(f=>f.t));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
