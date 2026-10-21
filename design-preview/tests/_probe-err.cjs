const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage();
 p.on('pageerror',e=>console.log('PAGEERROR',e.message));
 p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,300))});
 await p.goto(previewURL);
 await p.waitForTimeout(4000);
 console.log('ready',await p.evaluate(()=>document.documentElement.dataset.ready));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
