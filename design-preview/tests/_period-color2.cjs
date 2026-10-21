const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.waitForTimeout(800);
 const read=label=>page.evaluate(label=>{
  const el=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');
  const ctrl=document.querySelector('[data-node-id="14578:6106"]');
  return {label,color:getComputedStyle(el).color,hover:ctrl.matches(':hover'),focusVisible:ctrl.matches(':focus-visible'),hasFocusVisible:ctrl.matches(':has(:focus-visible)'),active:document.activeElement?.getAttribute('aria-label'),theme:document.querySelector('.target-theme').matches(':hover')};
 },label);
 console.log(await read('initial'));
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>!document.documentElement.dataset.themeTransition);
 await page.waitForTimeout(800);
 console.log(await read('after theme'));
 await page.mouse.move(100,600); await page.waitForTimeout(400);
 console.log(await read('mouse away'));
 await browser.close();
})();
