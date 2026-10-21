const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(450);
 await page.evaluate(()=>{
  window.__log=[]; const p=document.querySelector('.wd-date-picker');
  const fill=p.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
  const mat=p.querySelector(':scope>.wd-glass-material');
  const grab=tag=>{const cs=getComputedStyle(fill),ms=getComputedStyle(mat),ps=getComputedStyle(p);
   window.__log.push({tag,fillBg:cs.backgroundColor,backdrop:cs.backdropFilter,fillOpacity:cs.opacity,matOpacity:ms.opacity,panelTransform:ps.transform,panelOpacity:ps.opacity,isolation:ps.isolation,z:ps.zIndex,anim:p.getAnimations().map(a=>a.effect.getKeyframes().map(k=>k.transform||k.opacity))});};
  grab('before');
  window.__t=setInterval(()=>grab('during'),40);
  setTimeout(()=>clearInterval(window.__t),300);
 });
 await page.getByRole('button',{name:'Apply'}).click();
 await page.waitForTimeout(400);
 const log=await page.evaluate(()=>window.__log);
 console.log(JSON.stringify(log.slice(0,8),null,1));
 await browser.close();
})();
