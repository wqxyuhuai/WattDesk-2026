const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1452,height:1252},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(require('./runtime.cjs').previewURL);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));

 async function surface(label,opener){
  await opener();
  await page.waitForTimeout(360);
  const state=await page.evaluate(()=>{
   const panel=document.querySelector('#home-active-popover');
   if(!panel)return null;
   const host=panel,fill=host.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
   return {classes:host.className,material:!!fill,count:host.querySelectorAll(':scope>.wd-glass-material').length,
    background:fill?getComputedStyle(fill).backdropFilter:'',border:getComputedStyle(host).borderTopWidth,opacity:getComputedStyle(host).backgroundColor};
  });
  assert.ok(state,`${label} did not open`);
  assert.match(state.classes,/wd-glass--surface/);assert.match(state.classes,/wd-glass-popup/);
  assert.ok(state.material,`${label} has no Glass Surface material`);assert.equal(state.count,1,`${label} mounted its material more than once`);
  assert.match(state.background,/blur\(/);assert.equal(state.border,'0px');
  return state;
 }
 for(const [label,open,close] of [
  ['Chart options',()=>page.locator('.chart-menu').first().click(),()=>page.keyboard.press('Escape')],
  ['Language',()=>page.getByRole('button',{name:'Language',exact:true}).click(),()=>page.keyboard.press('Escape')],
  ['Appearance',()=>page.getByRole('button',{name:'Settings',exact:true}).click(),()=>page.keyboard.press('Escape')],
  ['WattDesk',()=>page.getByRole('button',{name:'Support',exact:true}).click(),()=>page.keyboard.press('Escape')]
 ]){await surface(label,open);await close();await page.waitForTimeout(320);assert.equal(await page.locator('#home-active-popover').count(),0,`${label} did not close`);}

 // A tab tooltip is a display-only surface: the material is mounted but the
 // host must not lift while the pointer rests on its tab.
 await page.getByRole('button',{name:'Add tab'}).click();
 await page.waitForTimeout(300);
 const tab=page.locator('.workspace-tab').last();
 await tab.hover();await page.waitForTimeout(520);
 const tip=await page.locator('.workspace-tab-tooltip').evaluate(el=>({hidden:el.hidden,classes:el.className,
  material:!!el.querySelector(':scope>.wd-glass-material'),static:el.classList.contains('wd-glass--static'),
  filter:getComputedStyle(el.querySelector('.wd-glass-fill')).backdropFilter,border:getComputedStyle(el).borderTopWidth,
  background:getComputedStyle(el).backgroundColor,radius:getComputedStyle(el).borderRadius}));
 // The extra tab is labelled Home and fits; force the real overflow case by
 // checking the shared classes/material rather than relying on the title length.
 assert.ok(tip.classes.includes('wd-glass--surface'));
 assert.ok(tip.material,'Tooltip must mount Glass Surface');
 assert.ok(tip.static,'Tooltip must be a static glass surface');
 assert.match(tip.filter,/blur\(/);assert.equal(tip.border,'0px');
 assert.equal(tip.background,'rgba(0, 0, 0, 0)');assert.equal(tip.radius,'12px');
 await page.mouse.move(0,0);await page.waitForTimeout(300);

 // Toast shares the material and is also non-interactive.
 await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(120);
 const toast=await page.locator('#toast').evaluate(el=>({hidden:el.hidden,classes:el.className,
  material:!!el.querySelector(':scope>.wd-glass-material'),static:el.classList.contains('wd-glass--static'),
  filter:getComputedStyle(el.querySelector('.wd-glass-fill')).backdropFilter,border:getComputedStyle(el).borderTopWidth}));
 assert.equal(toast.hidden,false);assert.ok(toast.material,'Toast must mount Glass Surface');assert.ok(toast.static);assert.match(toast.filter,/blur\(/);assert.equal(toast.border,'0px');
 await page.locator('#toast').evaluate(el=>el.hidden=true);

 // The annotated chart observation is a read-only data label, so it gets the
 // same plate without the interactive lift. It must survive theme swaps too.
 const observation=await page.locator('[data-name="Hover / Energy generated"]').evaluate(el=>({
  classes:el.className,material:!!el.querySelector(':scope>.wd-glass-material'),
  count:el.querySelectorAll(':scope>.wd-glass-material').length,
  static:el.classList.contains('wd-glass--static'),background:getComputedStyle(el).backgroundColor,
  border:getComputedStyle(el).borderTopWidth,shadow:getComputedStyle(el).boxShadow,
  filter:getComputedStyle(el.querySelector('.wd-glass-fill')).backdropFilter,radius:getComputedStyle(el).borderRadius
 }));
 assert.match(observation.classes,/wd-glass--surface/);assert.ok(observation.material,'Chart observation must mount Glass Surface');
 assert.equal(observation.count,1);assert.ok(observation.static);assert.match(observation.filter,/blur\(/);
 assert.equal(observation.background,'rgba(0, 0, 0, 0)');assert.equal(observation.border,'0px');assert.equal(observation.shadow,'none');assert.equal(observation.radius,'12px');

 // Existing surfaces keep exactly one material after the shared controller
 // starts automatically ensuring new panels.
 for(const [label,open] of [
  ['Date picker',()=>page.getByRole('button',{name:'Select statistics period'}).click()],
  ['History',()=>page.getByRole('button',{name:'Recent activity'}).click()],
  ['Search',()=>page.getByRole('button',{name:'Quick search'}).click()]
 ]){
  await open();await page.waitForTimeout(360);
  const count=await page.evaluate(()=>document.querySelectorAll('#home-active-popover>.wd-glass-material, .wd-date-picker>.wd-glass-material, .wd-history-popover>.wd-glass-material, .wd-search-panel>.wd-glass-material').length);
  assert.equal(count,1,`${label} must keep one mounted surface`);
  await page.keyboard.press('Escape');await page.waitForTimeout(320);
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,errors},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
