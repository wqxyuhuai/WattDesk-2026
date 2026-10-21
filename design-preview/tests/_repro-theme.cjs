const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1590,height:1252},deviceScaleFactor:2});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const snap=async()=>page.evaluate(()=>{
  const b=document.querySelector('.target-theme');
  const out=[];
  for(const el of b.querySelectorAll('*')){const cs=getComputedStyle(el);out.push({cls:el.className?.baseVal??el.className,tag:el.tagName,color:cs.color,bg:cs.backgroundColor,mask:cs.webkitMaskImage?.slice(0,60),opacity:cs.opacity,filter:cs.filter,display:cs.display});}
  // sample icon pixel
  return {theme:document.documentElement.dataset.theme,btnColor:getComputedStyle(b).color,children:out};
 });
 console.log('initial',JSON.stringify(await snap()));
 const shot=async(name,clip)=>{await page.screenshot({path:`tests/output/${name}.png`,clip})};
 await shot('theme-repro-before',{x:1410,y:10,width:170,height:60});
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForTimeout(900);
 console.log('after',JSON.stringify(await snap()));
 await shot('theme-repro-after',{x:1410,y:10,width:170,height:60});
 // read pixel colors from screenshots via sharp? fallback: use canvas in page screenshot not possible. Use PNG raw decode.
 await browser.close();
})();
