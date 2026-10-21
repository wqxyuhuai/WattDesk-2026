const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1590,height:1252},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const read=async(label)=>console.log(label, await page.evaluate(()=>{
   const b=document.querySelector('.target-theme'),icon=b.querySelector('.theme-sun');
   const chain=[];for(let el=b;el;el=el.parentElement){chain.push({cls:typeof el.className==='string'?el.className.slice(0,50):'',hover:el.matches(':hover'),focus:el.matches(':focus'),fv:el.matches(':focus-visible'),fw:el.matches(':focus-within')});}
   return {theme:document.documentElement.dataset.theme,btnColor:getComputedStyle(b).color,iconBg:getComputedStyle(icon).backgroundColor,beforeOpacity:getComputedStyle(b,'::before').opacity,active:document.activeElement?.className||document.activeElement?.tagName,chain:chain.slice(0,4)};
 }));
 const button=page.getByRole('button',{name:'Toggle light and dark mode'});
 await read('start');
 await button.click();
 await page.waitForTimeout(800);
 await read('after click (mouse still on button)');
 await page.mouse.move(100,600);
 await page.waitForTimeout(500);
 await read('after mouse away');
 await page.mouse.click(100,600);
 await page.waitForTimeout(500);
 await read('after click body');
 await page.mouse.move(1472,50);
 await page.waitForTimeout(500);
 await read('hover again');
 await browser.close();
})();
