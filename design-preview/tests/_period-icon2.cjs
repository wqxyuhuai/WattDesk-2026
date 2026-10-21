const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
 await page.mouse.move(100,600);await page.waitForTimeout(1200);
 console.log(await page.evaluate(()=>{
  const icon=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2194"]');
  const shell=icon.querySelector('.shared-icon-highlight');
  const img=icon.querySelector('img');
  const ctrl=document.querySelector('[data-node-id="14578:6106"]');
  return {iconColor:getComputedStyle(icon).color,svgColor:getComputedStyle(img).color,svgFilter:getComputedStyle(img).filter,shellBg:getComputedStyle(shell).backgroundColor,shellOpacity:getComputedStyle(shell).opacity,ctrlColor:getComputedStyle(ctrl).color,
   imgProps:{fill:getComputedStyle(img).fill,stroke:getComputedStyle(img).stroke,opacity:getComputedStyle(img).opacity},
   ancestry:(()=>{const out=[];for(let e=icon;e&&out.length<8;e=e.parentElement)out.push({tag:e.tagName,cls:e.className,color:getComputedStyle(e).color});return out})()};
 }));
 await browser.close();
})();
