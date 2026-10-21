const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.click(100,700);await page.waitForTimeout(900);
 console.log(await page.evaluate(()=>{
  const label=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='I14578:6106;14420:2221;14420:2195');
  const icon=[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId==='I14578:6106;14420:2221;14420:2194');
  const span=label.querySelector('span');
  return {labelOuter:label.outerHTML,labelColor:getComputedStyle(label).color,spanStyle:span?.getAttribute('style'),spanColor:span?getComputedStyle(span).color:null,iconColor:getComputedStyle(icon).color,iconImgOpacity:getComputedStyle(icon.querySelector('img')).opacity,iconImgSrc:icon.querySelector('img').getAttribute('src')};
 }));
 await browser.close();
})();
