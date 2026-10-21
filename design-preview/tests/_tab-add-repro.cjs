const {chromium}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:992}});
 await p.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await p.waitForTimeout(700);
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(420);}
 await p.waitForTimeout(500);
 console.log('before',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');return {cw:l.clientWidth,w:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),n:document.querySelectorAll('.workspace-tab').length,tw:[...document.querySelectorAll('.workspace-tab')].map(e=>e.offsetWidth),sz:[...document.querySelectorAll('.workspace-tab')].map(e=>e.getBoundingClientRect().width),ox:getComputedStyle(l).overflowX}}));
 await p.evaluate(()=>{window.__samples=[];const l=document.querySelector('.workspace-tab-list');const start=performance.now();const tick=()=>{window.__samples.push({t:performance.now()-start,cw:l.clientWidth,w:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),n:document.querySelectorAll('.workspace-tab').length,tw:[...document.querySelectorAll('.workspace-tab')].map(e=>e.getBoundingClientRect().width),last:l.lastElementChild?.getBoundingClientRect().width,add:document.querySelector('.target-add-tab').getBoundingClientRect().x});if(performance.now()-start<700)requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 await p.getByRole('button',{name:'Add tab'}).click();
 await p.waitForTimeout(850);
 const s=await p.evaluate(()=>window.__samples); let prev=null; let shown=0;
 for(const x of s){const sig=JSON.stringify({cw:Math.round(x.cw),w:x.w,n:x.n,tw:x.tw.map(v=>Math.round(v)),last:Math.round(x.last),add:Math.round(x.add)});if(sig!==prev){console.log(x.t.toFixed(0),sig);prev=sig;shown++}}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})

