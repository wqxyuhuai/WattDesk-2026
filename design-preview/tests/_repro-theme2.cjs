const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1590,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const read=async(label)=>console.log(label, await page.evaluate(()=>{
   const b=document.querySelector('.target-theme');const icon=b.querySelector('.theme-sun');
   const cs=getComputedStyle(icon);
   return {theme:document.documentElement.dataset.theme, pressed:b.getAttribute('aria-pressed'), btnColor:getComputedStyle(b).color, iconColor:cs.color, iconBg:cs.backgroundColor, hover:b.matches(':hover'), focus:b.matches(':focus'), focusVisible:b.matches(':focus-visible'), sunDisplay:cs.display};
 }));
 await read('initial(dark, no hover)');
 await page.mouse.move(100,600);
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.move(100,600);
 await page.waitForTimeout(1000);
 await read('after click -> light, mouse away');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.mouse.move(100,600);
 await page.waitForTimeout(1000);
 await read('after click -> dark, mouse away');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).hover();
 await page.waitForTimeout(400);
 await read('dark hover');
 await browser.close();
})();
