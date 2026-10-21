const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const vp of [{width:1920,height:1080},{width:1545,height:1252},{width:1366,height:900},{width:1180,height:900},{width:1024,height:900},{width:900,height:900},{width:760,height:900}]){
  const p=await b.newPage({viewport:vp,deviceScaleFactor:1});
  await p.goto(previewURL);
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  const m=await p.evaluate(()=>{
   const r=e=>{const b=e.getBoundingClientRect();return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)}};
   const sidebar=document.querySelector('[data-node-id="14445:3629"]'), header=document.querySelector('[data-node-id="14612:8479"]'), panel=document.querySelector('[data-node-id="14578:6145"]'), col=document.querySelector('[data-node-id="14578:7006"]');
   const nav=[...document.querySelectorAll('.target-nav')].slice(0,4).map(r);
   const cards=[...document.querySelectorAll('.shortcut-columns>.node')].map(e=>({w:+e.getBoundingClientRect().width.toFixed(1),fs:getComputedStyle(e).fontSize}));
   return {vw:innerWidth,scrollW:document.documentElement.scrollWidth,bodyW:document.body.getBoundingClientRect().width,sidebar:r(sidebar),header:r(header),panel:r(panel),col:r(col),colTransform:getComputedStyle(col).transform,sidebarTransform:getComputedStyle(sidebar).transform,headerTransform:getComputedStyle(header).transform,fonts:{nav:getComputedStyle(document.querySelector('.target-nav')).fontSize,heading:getComputedStyle(document.querySelector('.chart-card-heading')||document.querySelector('.node.text')).fontSize},shortcutCards:cards,nav:nav[0]};
  });
  console.log(JSON.stringify(m));
  await p.screenshot({path:`tests/output/responsive-before-${vp.width}.png`,fullPage:false});
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
