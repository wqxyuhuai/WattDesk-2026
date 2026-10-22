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

 // Tooltips follow their tab too. Force the label-overflow path with a long
 // title, then scroll the strip itself. Keep the painted label capped exactly
 // like build()/updateTitle(): setting `_state` and the label separately would
 // let the test assert on a title the component can never actually render.
 await page.locator('.workspace-tab').first().evaluate(tab=>{
  const title='Module balance long route title';
  tab._state={...tab._state,title};
  const label=tab.querySelector('.workspace-tab-label');
  label.textContent=[...title].slice(0,28).join('');
 });
 await page.waitForTimeout(80);
 await page.locator('.workspace-tab').first().hover();await page.waitForTimeout(520);
 const tipBefore=await page.locator('.workspace-tab-tooltip').evaluate(el=>({hidden:el.hidden,left:el.getBoundingClientRect().left,text:el.textContent}));
 assert.equal(tipBefore.hidden,false,'Overflow tooltip must be visible');
 assert.equal(tipBefore.text,'Module balance long route ti');
 const strip=page.locator('.workspace-tab-list');
 const moved=await strip.evaluate(el=>{
  if(el.scrollWidth<=el.clientWidth)return 0;
  const start=el.scrollLeft;el.scrollLeft=Math.max(0,start-24);return el.scrollLeft-start;
 });
 if(moved!==0){
  await page.waitForTimeout(160);
  const tipAfter=await page.locator('.workspace-tab-tooltip').evaluate(el=>({hidden:el.hidden,left:el.getBoundingClientRect().left}));
  assert.equal(tipAfter.hidden,false,'Tooltip must survive a tab-strip scroll');
  assert.ok(Math.abs(tipAfter.left-tipBefore.left)>4,'Tooltip must follow its tab after horizontal scroll');
 }
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
 // Floating panels belong to their trigger, not the viewport. Scroll the real
 // work area and require the panel's viewport box to move by the same amount.
 // Open before scrolling: Playwright's click() would otherwise scroll the
 // trigger back into view and invalidate the measurement.
 for(const [label,open] of [
  ['Date picker',()=>page.getByRole('button',{name:'Select statistics period'}).click()],
  ['Chart options',()=>page.locator('.chart-menu').first().click()]
 ]){
  const scroller=page.locator('[data-node-id="14578:7006"]');
  await scroller.evaluate(el=>el.scrollTop=0);
  await page.waitForTimeout(80);
  await open();await page.waitForTimeout(360);
  const before=await page.evaluate(()=>{
   const panel=document.querySelector('#home-active-popover'),anchor=panel?._anchor;
   return {panel:panel.getBoundingClientRect().toJSON(),anchor:anchor?.getBoundingClientRect().toJSON()};
  });
  assert.ok(before.panel&&before.anchor,`${label} is not anchored`);
  // The browser may already have scrolled the trigger to the end of its work
  // area while opening it. Move through whichever direction still has room so
  // this checks anchor tracking rather than the page's resting scroll offset.
  const moved=await scroller.evaluate(el=>{
   const start=el.scrollTop,max=el.scrollHeight-el.clientHeight;
   const delta=max-start>=60?120:start>=60?-120:0;
   el.scrollTop=Math.max(0,Math.min(max,start+delta));
   return el.scrollTop-start;
  });
  await page.waitForTimeout(160);
  const after=await page.evaluate(()=>{
   const panel=document.querySelector('#home-active-popover'),anchor=panel?._anchor;
   return {panel:panel?.getBoundingClientRect().toJSON(),anchor:anchor?.getBoundingClientRect().toJSON()};
  });
  assert.ok(Math.abs(moved)>20,`${label} scroll container has no room to move`);
  assert.ok(after.panel,`${label} closed before leaving the viewport`);
  const anchorShift=before.anchor.top-after.anchor.top;
  assert.ok(Math.abs(anchorShift-moved)<2,`${label} anchor moved ${anchorShift}px instead of ${moved}px`);
  // A tall panel may legitimately flip from above to below as the trigger
  // moves up; what matters is that it is re-measured against the live anchor,
  // not frozen at its first coordinates.
  const gap=8,above=Math.abs(after.panel.bottom-(after.anchor.top-gap)),below=Math.abs(after.panel.top-(after.anchor.bottom+gap));
  assert.ok(Math.min(above,below)<2,`${label} is not adjacent to its scrolled anchor`);
  const endAligned=Math.abs(after.panel.right-after.anchor.right),startAligned=Math.abs(after.panel.left-after.anchor.left);
  assert.ok(Math.min(endAligned,startAligned)<2,`${label} lost its anchor edge alignment`);
  assert.ok(Math.abs(before.panel.top-after.panel.top)>20,`${label} panel stayed at its cached position`);
  await page.keyboard.press('Escape');await page.waitForTimeout(320);
  await scroller.evaluate(el=>el.scrollTop=0);
 }
 // Once an in-surface anchor leaves the viewport, its panel dismisses instead
 // of staying clamped against the viewport edge. Widen the work area first so
 // the chart trigger can actually be scrolled past the top; the shell menus
 // remain fixed to the header and are intentionally not part of this case.
 const scroller=page.locator('[data-node-id="14578:7006"]');
 await scroller.evaluate(el=>{el.scrollTop=0;el.style.height='420px'});
 await page.locator('.chart-menu').first().click();await page.waitForTimeout(360);
 assert.equal(await page.locator('#home-active-popover').count(),1);
 await scroller.evaluate(el=>el.scrollTop=el.scrollHeight);
 await page.waitForFunction(()=>!document.querySelector('#home-active-popover'),null,{timeout:2000});
 assert.equal(await page.locator('#home-active-popover').count(),0,'A popover whose anchor left the viewport must close');
 await scroller.evaluate(el=>{el.style.height='';el.scrollTop=0});await page.waitForTimeout(120);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,errors},null,2));
 await browser.close();
 })().catch(error=>{console.error(error);process.exitCode=1});
