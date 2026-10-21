const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
 await page.mouse.move(100,600);await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{
  const icon=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2194"]');
  const shell=icon.querySelector('.shared-icon-highlight');
  return {iconHTML:icon.outerHTML.slice(0,1800),styles:{shell:shell&&shell.getAttribute('style'),iconColor:getComputedStyle(icon).color,shellBg:shell&&getComputedStyle(shell).backgroundColor,shellOpacity:shell&&getComputedStyle(shell).opacity}};
 }));
 await browser.close();
})();
