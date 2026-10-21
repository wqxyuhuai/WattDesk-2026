const { chromium, launchOptions } = require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1116,height:992}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
 await page.waitForTimeout(300);
 await page.getByRole('button',{name:'Select statistics period'}).click();await page.waitForTimeout(500);
 await page.screenshot({path:'output/light-check.png',clip:{x:520,y:120,width:560,height:540}});
 console.log(await page.evaluate(()=>document.documentElement.dataset.theme));
 await browser.close();
})();
