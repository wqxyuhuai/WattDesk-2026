const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const vp of [{width:1920,height:1080},{width:1180,height:900},{width:760,height:900}]){
  const p=await b.newPage({viewport:vp,deviceScaleFactor:1});
  await p.goto(previewURL); await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  const out=await p.evaluate(()=>{
   const R=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1),right:+b.right.toFixed(1),bottom:+b.bottom.toFixed(1)}};
   const q=id=>document.querySelector(`[data-node-id="${id}"]`);
   const ids=['14445:3629','14612:8479','14612:8480','14578:6145','14578:7006','14612:8452','14445:3351','14445:3354','14612:7837','14537:3942','14537:4510','14557:831','14612:7602','14561:855','14561:856','14570:1074','14570:1140','14537:4416','14578:6003','14578:6106','14612:8453'];
   const nodes=Object.fromEntries(ids.map(id=>[id,{name:q(id)?.dataset.name,box:R(q(id)),left:q(id)?.style.left,top:q(id)?.style.top,width:q(id)?.style.width,height:q(id)?.style.height,transform:getComputedStyle(q(id)||document.body).transform}]));
   const nav=[...document.querySelectorAll('.target-nav')].slice(0,4).map(R);
   const shortcuts=[...document.querySelectorAll('.shortcut-columns>.node')].map(R);
   const status=[...document.querySelectorAll('[data-node-id="14537:3942"]>.node')].map(R);
   return {vp:[innerWidth,innerHeight],scrollW:document.documentElement.scrollWidth,nodes,nav,shortcuts,status};
  });
  console.log('===',vp.width);console.log(JSON.stringify(out,null,1));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

