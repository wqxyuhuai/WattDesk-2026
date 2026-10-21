const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 const errs=[];p.on('pageerror',e=>errs.push({msg:e.message,stack:e.stack}));p.on('console',m=>{if(m.type()==='error')errs.push({console:m.text(),loc:m.location()})});p.on('requestfailed',r=>errs.push({failed:r.url(),err:r.failure()}));
 await p.goto(previewURL.split('?')[0]);
 await p.waitForTimeout(3500);
 console.log(JSON.stringify({ready:await p.evaluate(()=>document.documentElement.dataset.ready),errs},null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
