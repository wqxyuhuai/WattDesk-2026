const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{const b=await chromium.launch({...launchOptions,headless:true});const p=await b.newPage({viewport:{width:1497,height:1252}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('[aria-label="Select statistics period"]').click();await p.waitForTimeout(350);
 console.log(JSON.stringify(await p.evaluate(()=>({presets:[...document.querySelectorAll('.wd-date-picker [role="button"],.wd-date-quick button')].map(e=>e.textContent.trim()),fields:[...document.querySelectorAll('.wd-date-field')].map(e=>e.textContent.trim()),segments:document.querySelectorAll('.wd-date-segment').length,apply:[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Apply')})),null,2));
 await b.close();})().catch(e=>{console.error(e);process.exit(1)});
