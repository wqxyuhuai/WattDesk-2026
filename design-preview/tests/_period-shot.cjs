const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
 await page.mouse.move(100,600);await page.waitForTimeout(900);
 await page.screenshot({path:'tests/output/tmp-period-light.png'});
 const clip=await page.locator('[data-node-id="14578:6106"]').boundingBox();
 await page.screenshot({path:'tests/output/tmp-period-chip.png',clip:{x:clip.x-8,y:clip.y-8,width:clip.width+16,height:clip.height+16}});
 await browser.close();
})();
