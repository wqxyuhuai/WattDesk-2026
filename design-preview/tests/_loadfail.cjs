const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 const errs=[];
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push({type:m.type(),text:m.text()})});
 p.on('pageerror',e=>errs.push({type:'pageerror',text:String(e),stack:e.stack}));
 p.on('response',r=>{if(r.status()>=400)errs.push({type:'http'+r.status(),text:r.url()})});
 await p.goto(previewURL.split('?')[0]+'?cachebust='+Date.now());
 await p.waitForTimeout(5000);
 console.log('state',await p.evaluate(()=>({ready:document.documentElement.dataset.ready,shell:document.documentElement.dataset.shellReady,theme:document.documentElement.dataset.theme,main:document.querySelector('main#home')?.children.length})));
 console.log(errs);
 await p.screenshot({path:'tests/output/tabframes/loadfail.png'});
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
