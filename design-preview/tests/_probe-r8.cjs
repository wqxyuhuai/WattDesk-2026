const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252}});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
 await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('13');
 const r=await p.evaluate(async()=>{
  const panel=document.querySelector('.wd-date-picker'),msg=document.querySelector('.wd-date-message');
  const snap=t=>({t:+t.toFixed(0),msgH:+msg.getBoundingClientRect().height.toFixed(1),panelH:+panel.getBoundingClientRect().height.toFixed(1),
   top:+panel.getBoundingClientRect().top.toFixed(1),bottom:+panel.getBoundingClientRect().bottom.toFixed(1),ani:msg.getAnimations().length});
  document.querySelector('.wd-date-action--apply').click();
  const out=[snap(0)];
  const st=performance.now();
  for(let i=0;i<8;i++){await new Promise(r=>requestAnimationFrame(r));out.push(snap(performance.now()-st));}
  return out;
 });
 console.log(JSON.stringify(r,null,0));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
