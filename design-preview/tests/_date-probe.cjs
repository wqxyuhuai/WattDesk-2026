const { chromium } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(500);
 const result=await page.evaluate(()=>{
  const p=document.querySelector('.wd-date-picker');
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
  return {panel:box(p),surface:Boolean(p?.querySelector(':scope>.wd-glass-material')),days:p?.querySelectorAll('.wd-date-day').length,
   cal:box(p?.querySelector('.wd-date-calendar')),daysBox:box(p?.querySelector('.wd-date-days')),grid:box(p?.querySelector('.wd-date-dates')),
   weekdays:box(p?.querySelector('.wd-date-grid')),selected:p?.querySelector('.wd-date-day[aria-pressed="true"]')?.textContent,
   input:p?.querySelector('.wd-date-field input')?.value,fonts:document.fonts.status};
 });
 console.log(JSON.stringify({result,errors},null,2));
 await page.screenshot({path:'output/date-new-1545-dark.png'});
 await page.locator('.wd-date-picker').screenshot({path:'output/date-new-panel-dark.png'});
 await browser.close();
})()
