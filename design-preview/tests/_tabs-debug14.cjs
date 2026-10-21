const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto(require('./runtime.cjs').previewURL.split('?')[0]);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
 await page.waitForTimeout(1200);
 const themeButton=page.getByRole('button',{name:'Toggle light and dark mode'});
 await themeButton.click();await page.waitForTimeout(900);
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
 console.log('theme',await page.evaluate(()=>document.documentElement.dataset.theme),errors);
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.waitForTimeout(1200);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
 await themeButton.click();await page.mouse.move(0,0);await page.waitForTimeout(320);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Refresh statistics'}).click();await page.waitForTimeout(900);
 await page.setViewportSize({width:1100,height:900});await page.waitForTimeout(500);
 for(let i=0;i<8;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90)}
 await page.waitForTimeout(700);
 console.log('layout',await page.evaluate(()=>({list:[...(()=>{const r=document.querySelector('.workspace-tab-list').getBoundingClientRect();return [r.x,r.right,r.width]})(),document.querySelector('.workspace-tab-list').scrollLeft,document.querySelector('.workspace-tab-list').scrollWidth],tabs:[...document.querySelectorAll('.workspace-tab')].map(t=>[t.id,Math.round(t.getBoundingClientRect().x),Math.round(t.getBoundingClientRect().width)])})));
 await browser.close();
})();
