const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(let i=0;i<5;i++){const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(400);}
 await p.waitForTimeout(500);
 await p.evaluate(()=>{window.__s=[];const l=document.querySelector('.workspace-tab-list');const st=performance.now();const tick=()=>{window.__s.push({t:performance.now()-st,last:l.lastElementChild?.getBoundingClientRect().width,add:document.querySelector('.target-add-tab').getBoundingClientRect().x,w:getComputedStyle(l).getPropertyValue('--workspace-tab-width')});if(performance.now()-st<600)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(750);
 const s=await p.evaluate(()=>window.__s);let prev=null;for(const x of s){const sig=`${Math.round(x.last)}|${Math.round(x.add)}|${x.w}`;if(sig!==prev){console.log(x.t.toFixed(0),sig);prev=sig;}}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
