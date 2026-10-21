const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 console.log(await page.evaluate(()=>{
  const btns=[...document.querySelectorAll('[role="button"],button')].filter(e=>e.getAttribute('aria-label')?.includes('period'));
  return btns.map(e=>({tag:e.tagName,cls:e.className,label:e.getAttribute('aria-label'),text:e.textContent.trim()}));
 }));
 await browser.close();
})();
