const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(450);
 const info=await page.evaluate(()=>{const p=document.querySelector('.wd-date-picker');const m=p.querySelector(':scope>.wd-glass-material');const cs=getComputedStyle(m);return {matTransform:cs.transform,matFilter:cs.filter,matOpacity:cs.opacity,stack:[...p.children].map(c=>({cls:c.className,z:getComputedStyle(c).zIndex,pos:getComputedStyle(c).position}))}});
 console.log(JSON.stringify(info,null,1));
 await browser.close();
})();
