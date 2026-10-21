const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.click(100,700);await page.waitForTimeout(900);
 console.log(await page.evaluate(()=>{
  const label=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');
  const span=label.querySelector('span');
  const icon=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2194"]');
  return {theme:document.documentElement.dataset.theme,spanInline:span?.getAttribute('style'),spanColor:span&&getComputedStyle(span).color,labelInline:label.getAttribute('style'),labelColor:getComputedStyle(label).color,iconColor:getComputedStyle(icon).color,map:window.__?null:null};
 }));
 console.log('theme map entry',require('../src/pages/home/data/theme-map.json').styles.filter(x=>JSON.stringify(x).includes('14578:6106')));
 await page.locator('[data-node-id="14578:6106"]').hover();await page.waitForTimeout(400);
 console.log('hover',await page.evaluate(()=>{const label=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');return {label:getComputedStyle(label).color,span:getComputedStyle(label.querySelector('span')).color,button:getComputedStyle(document.querySelector('[data-node-id="14578:6106"]')).color}}));
 await browser.close();
})();
