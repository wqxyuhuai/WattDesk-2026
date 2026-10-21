const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1180,height:900}});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');await p.locator('img').evaluateAll(xs=>Promise.all(xs.map(i=>i.decode())));
 console.log(await p.evaluate(()=>{
  const c=document.querySelector('[data-node-id="14578:7006"]');const cs=getComputedStyle(c);const r=c.getBoundingClientRect();
  return {transform:cs.transform,cssWidth:cs.width,offsetWidth:c.offsetWidth,rect:r.toJSON(),left:cs.left};
 }));
 const candidates=[{name:'noSidebarScale',css:`[data-node-id="14445:3629"]{transform:none!important} [data-node-id="14612:8479"]{transform:none!important}`},{name:'noColumnScale',css:`[data-node-id="14578:7006"]{transform:translateX(-50%)!important;width:100%!important;left:0!important}`},{name:'both',css:`[data-node-id="14445:3629"],[data-node-id="14612:8479"]{transform:none!important}[data-node-id="14578:7006"]{transform:translateX(-50%)!important;width:100%!important;left:0!important}`}];
 for(const c of candidates){await p.addStyleTag({content:c.css});await p.waitForTimeout(250);const m=await p.evaluate(()=>{const q=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:+r.x.toFixed(0),w:+r.width.toFixed(0),h:+r.height.toFixed(0)}};return {sidebar:q('.target-sidebar'),header:q('.target-header'),col:q('[data-node-id="14578:7006"]'),title:q('[data-node-id="14445:3352"]'),cards:q('.shortcut-columns'),overflow:document.documentElement.scrollWidth}});console.log(c.name,JSON.stringify(m));await p.screenshot({path:`tests/output/responsive-proto-${c.name}.png`});}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
