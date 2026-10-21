const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.waitForTimeout(1100);
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();await page.waitForTimeout(700);
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});await page.waitForTimeout(320);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Device tool',exact:true}).click();
 await page.getByRole('button',{name:'Device tool',exact:true}).click();
 await page.getByRole('button',{name:'Refresh statistics'}).click();await page.waitForTimeout(800);
 await page.setViewportSize({width:1100,height:900});await page.waitForTimeout(320);
 for(let i=0;i<8;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90)}
 await page.waitForTimeout(360);
 console.log('errors',errors);
 const tab=page.locator('.workspace-tab').nth(2);await tab.hover();await page.waitForTimeout(280);
 const box=await tab.locator('.workspace-tab-close').boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await tab.locator('.workspace-tab-close').click();await page.waitForTimeout(240);
 console.log(await page.evaluate(({x,y})=>{const hit=document.elementFromPoint(x,y);const t=hit&&hit.closest('.workspace-tab');if(!t)return {hit:hit&&hit.className};const r=t.querySelector('.workspace-tab-close').getBoundingClientRect();return {ptr:{x,y},hit:hit.className,tab:t.id,rect:{x:r.x,y:r.y,w:r.width,h:r.height},contains:x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};},{x:box.x+box.width/2,y:box.y+box.height/2}));
 await browser.close();
})();
