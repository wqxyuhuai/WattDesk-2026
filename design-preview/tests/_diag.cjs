const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(450);
 const probe=async()=>page.evaluate(()=>{
  const p=document.querySelector('.wd-date-picker');
  const b=el=>{const r=el.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)}};
  const wrap=p.querySelector('.wd-date-calendar-wrap'), cal=p.querySelector('.wd-date-calendar'), nav=p.querySelector('.wd-date-nav-button');
  return {panel:b(p),wrap:b(wrap),cal:b(cal),nav:b(nav),navScale:getComputedStyle(nav).getPropertyValue('--wd-glass-scale-x'),wrapOverflow:getComputedStyle(wrap).overflow,
   navMaterial:!!nav.querySelector(':scope>.wd-glass-material'), applyMat:!!p.querySelector('.wd-date-action--apply>.wd-glass-material'),
   applyBg:getComputedStyle(p.querySelector('.wd-date-action--apply')).backgroundImage,
   applyRadius:getComputedStyle(p.querySelector('.wd-date-action--apply')).borderRadius};
 });
 console.log('default',JSON.stringify(await probe(),null,1));
 await page.locator('.wd-date-nav-button').last().hover(); await page.waitForTimeout(420);
 console.log('hoverNav',JSON.stringify(await probe(),null,1));
 await page.locator('.wd-date-nav-button').last().screenshot({path:'output/nav-hover-clip.png'});
 const wrapClip=await page.locator('.wd-date-calendar-wrap').screenshot({path:'output/wrap-clip.png'});
 await page.locator('.wd-date-action--apply').hover(); await page.waitForTimeout(400);
 await page.locator('.wd-date-picker').screenshot({path:'output/apply-hover.png'});
 await browser.close();
})();
