const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 await page.mouse.move(100,600); await page.waitForTimeout(900);
 const info=await page.evaluate(()=>{
  const byId=id=>[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId===id);
  const btn=byId('14578:6106'),label=byId('I14578:6106;14420:2221;14420:2195'),icon=byId('I14578:6106;14420:2221;14420:2194');
  const img=icon?.querySelector('img');
  const span=label?.querySelector('span');
  return {theme:document.documentElement.dataset.theme,
   btnHTML:btn?.outerHTML.slice(0,2500),
   btnColor:btn&&getComputedStyle(btn).color,labelColor:label&&getComputedStyle(label).color,
   spanColor:span&&getComputedStyle(span).color,spanStyle:span?.getAttribute('style'),
   iconColor:icon&&getComputedStyle(icon).color,iconImgFilter:img&&getComputedStyle(img).filter,iconImgSrc:img&&img.getAttribute('src'),
   arrowImgs:[...document.querySelectorAll('.status-card .status-card-arrow img')].map(im=>({src:im.getAttribute('src'),filter:getComputedStyle(im).filter,opacity:getComputedStyle(im).opacity,cls:im.className}))};
 });
 console.log(JSON.stringify(info,null,2));
 await page.locator('[data-node-id="14578:6106"]').hover(); await page.waitForTimeout(400);
 console.log('hover',JSON.stringify(await page.evaluate(()=>{const byId=id=>[...document.querySelectorAll('[data-node-id]')].find(e=>e.dataset.nodeId===id);const l=byId('I14578:6106;14420:2221;14420:2195'),s=l.querySelector('span'),i=byId('I14578:6106;14420:2221;14420:2194');return {btn:getComputedStyle(byId('14578:6106')).color,label:getComputedStyle(l).color,span:getComputedStyle(s).color,icon:getComputedStyle(i).color}},null,2)));
 await browser.close();
})();
