const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{const b=await chromium.launch({...launchOptions,headless:true});const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');await p.locator('img').evaluateAll(xs=>Promise.all(xs.map(i=>i.decode())));console.log(await p.evaluate(()=>{
 const card=document.querySelector('[data-node-id="14570:1074"]');
 function dump(e,d=0){const c=getComputedStyle(e);console.log(' '.repeat(d*2)+`${e.dataset.nodeId||''} ${e.dataset.name||''} ${e.tagName} pos=${c.position} w=${c.width} h=${c.height} left=${c.left} top=${c.top} overflow=${c.overflow}`);for(const ch of e.children)dump(ch,d+1)}
 return 'ok';
}));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
