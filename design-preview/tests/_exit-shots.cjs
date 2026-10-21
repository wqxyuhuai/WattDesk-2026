const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(450);
 const clip={x:540,y:120,width:540,height:520};
 await page.screenshot({path:'output/exit-before.png',clip});
 // manually start closing then capture at several offsets with CDP-free screenshot timing
 for(const wait of [30,90,180,400]){
   await page.evaluate(()=>{document.querySelector('.wd-date-picker')?.querySelector('.wd-date-action--apply')?.click();});
   await page.waitForTimeout(wait);
   await page.screenshot({path:`output/exit-${wait}.png`,clip});
   if(wait<400){await page.getByRole('button',{name:'Select statistics period'}).click();await page.waitForTimeout(450);}
 }
 await browser.close();
})();
