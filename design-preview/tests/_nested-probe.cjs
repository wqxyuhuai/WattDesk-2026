const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{const b=await chromium.launch({...launchOptions,headless:true});const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');await p.locator('img').evaluateAll(xs=>Promise.all(xs.map(i=>i.decode())));console.log(JSON.stringify(await p.evaluate(()=>{
 const card=document.querySelector('[data-node-id="14537:4416"]');
 let out=[];let n=card;
 for(let i=0;i<5&&n;i++,n=n.firstElementChild){const c=getComputedStyle(n);out.push({node:n.dataset.nodeId,name:n.dataset.name,tag:n.tagName,position:c.position,width:c.width,height:c.height,left:c.left,top:c.top,display:c.display,grid:c.gridTemplateColumns,gap:c.gap,padding:c.padding})}
 return out;
}),null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
