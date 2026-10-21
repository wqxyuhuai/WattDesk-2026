const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
 await page.mouse.move(100,600);await page.waitForTimeout(700);
 const read=()=>page.evaluate(()=>{
  const label=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');
  const icon=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2194"]');
  const iconImg=icon.querySelector('img');const state=icon.querySelector('.shared-icon-highlight');
  return {text:getComputedStyle(label).color,textTransition:getComputedStyle(label).transitionProperty,iconImgFilter:getComputedStyle(iconImg).filter,iconImgOpacity:getComputedStyle(iconImg).opacity,stateOpacity:state&&getComputedStyle(state).opacity,
   arrow:[...document.querySelectorAll('.status-card .status-card-arrow img')].map(im=>({filter:getComputedStyle(im).filter,opacity:getComputedStyle(im).opacity,src:im.getAttribute('src')}))};
 });
 console.log('idle',JSON.stringify(await read(),null,2));
 await page.locator('[data-node-id="14578:6106"]').hover();await page.waitForTimeout(320);
 console.log('hover',JSON.stringify(await read(),null,2));
 await browser.close();
})();
