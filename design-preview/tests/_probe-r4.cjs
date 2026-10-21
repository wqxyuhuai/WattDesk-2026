const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:992},deviceScaleFactor:2});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
 await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
 const state=()=>p.evaluate(()=>{const c=document.querySelector('.wd-date-field-control'),e=document.querySelector('.wd-date-error');return {invalid:c.classList.contains('wd-date-invalid'),msg:e.hidden?null:e.textContent,ring:getComputedStyle(c,'::after').boxShadow.slice(0,60)}});
 const y=p.getByLabel('Start date, month',{exact:true});
 await y.click();await p.keyboard.press('Control+a');await p.keyboard.type('x');
 await p.waitForTimeout(200);
 console.log('after single letter',JSON.stringify(await state()));
 await p.mouse.move(0,0);await p.waitForTimeout(200);
 await p.locator('.wd-date-picker').screenshot({path:`${out}/r4-letter.png`});
 // blur by clicking panel title
 await p.locator('.wd-date-month').click();await p.waitForTimeout(200);
 console.log('after blur',JSON.stringify(await state()));
 // press apply while letters warning
 await p.getByRole('button',{name:'Apply',exact:true}).click();await p.waitForTimeout(200);
 console.log('after apply',JSON.stringify(await state()));
 await p.locator('.wd-date-picker').screenshot({path:`${out}/r4-letter-apply.png`});
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
