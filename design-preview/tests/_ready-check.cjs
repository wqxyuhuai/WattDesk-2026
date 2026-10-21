const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:2560,height:1227},deviceScaleFactor:1.5});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 await p.goto(previewURL.split('?')[0]);
 try{await p.waitForFunction(()=>document.documentElement.dataset.ready==='true',{timeout:8000})}catch(e){console.log('timeout')}
 console.log(await p.evaluate(()=>({ready:document.documentElement.dataset.ready,tabs:document.querySelectorAll('.workspace-tab').length,title:document.title,body:document.body.innerText.slice(0,120)})));
 console.log(errs);
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
