const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992},deviceScaleFactor:1,recordVideo:{dir:'output/video',size:{width:540,height:520}}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(600);
 await page.getByRole('button',{name:'Apply'}).click();
 await page.waitForTimeout(700);
 await page.close();
 const v=page.video(); await v.saveAs('output/exit.webm');
 await browser.close();
})();
