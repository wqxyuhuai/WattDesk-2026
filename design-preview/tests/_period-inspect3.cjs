const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 await page.mouse.move(100,600); await page.waitForTimeout(900);
 console.log(JSON.stringify(await page.evaluate(()=>{
  const label=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]');
  const ctrl=document.querySelector('[data-node-id="14578:6106"]');
  const walk=(el,out=[])=>{for(const n of el.children){out.push({cls:n.className,id:n.dataset?.nodeId,color:getComputedStyle(n).color,fg:getComputedStyle(n).fill});walk(n,out)}return out};
  return {labelColor:getComputedStyle(label).color, labelText:label.textContent, labelStyle:label.getAttribute('style'), ctrlClass:ctrl.className, ctrlLabelClass:label.className, ctrlColor:getComputedStyle(ctrl).color, body:document.body.className, children:walk(ctrl).slice(0,8)};
 }),null,2));
 await browser.close();
})();
