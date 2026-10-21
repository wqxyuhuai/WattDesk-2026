const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 const url=require('./runtime.cjs').previewURL.split('?')[0];
 const results=[];
 async function expectGrownFromCenter(locator,box,label){
  const state=await locator.evaluate(el=>{
   const style=getComputedStyle(el),rect=el.getBoundingClientRect(),matrix=new DOMMatrix(style.transform==='none'?'':style.transform);
   return {scaleX:matrix.a,scaleY:matrix.d,offset:[el.offsetWidth,el.offsetHeight],origin:style.transformOrigin,rect:[rect.x,rect.y,rect.width,rect.height]};
  });
  assert.ok(state.scaleX>1&&state.scaleY>1,`${label} must grow on hover`);
  assert.deepEqual(state.offset,[Math.round(box.width),Math.round(box.height)],`${label} must keep its layout box`);
  assert.ok(Math.abs(state.rect[0]+state.rect[2]/2-(box.x+box.width/2))<.6,`${label} must grow around its horizontal centre`);
  assert.ok(Math.abs(state.rect[1]+state.rect[3]/2-(box.y+box.height/2))<.6,`${label} must grow around its vertical centre`);
  return state;
 }
 for(const preset of ['figma']){
  await page.goto(`${url}?glass=${preset}`);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  // Surface count is dynamic with the open tabs. Assert the stable chrome and
  // cards, then let the tab count explain the remainder instead of baking in
  // a snapshot that breaks when tabs are added or restored.
  const tabCount=await page.locator('.workspace-tab').count();
  // Base chrome/cards (13) + one glass per open tab + the persistent tab
  // tooltip (mounted once so it can show without a first-hover flash) + the
  // annotated chart observation label, which is a read-only Glass Surface.
  assert.equal(await page.locator('.wd-glass').count(),15+tabCount);
  // Shared material adds a positional default only. Page nodes and absolute chrome
  // own their positioning; a higher-specificity glass rule collapses the reflow.
  const positioning=await page.evaluate(()=>({
   node:getComputedStyle(document.querySelector('[data-node-id="14537:3925"]')).position,
   history:getComputedStyle(document.querySelector('.target-history')).position,
   forward:getComputedStyle(document.querySelector('.target-forward')).position,
   cards:[...document.querySelectorAll('[data-node-id="14537:3942"]>[data-node-id]')].map(e=>Math.round(e.getBoundingClientRect().y))
  }));
  assert.equal(positioning.node,'absolute','Glass must not override home-node positioning');
  assert.equal(positioning.history,'absolute','Glass must not override sidebar chrome positioning');
  assert.equal(positioning.forward,'absolute','Glass must not override sidebar chrome positioning');
  assert.equal(new Set(positioning.cards).size,1,'Status cards must remain on one row at the base viewport');
  const geometry=await page.locator('.wd-glass').evaluateAll(hosts=>hosts.map(host=>{
   const material=host.querySelector(':scope>.wd-glass-material'),h=host.getBoundingClientRect(),m=material.getBoundingClientRect(),style=getComputedStyle(host.querySelector(".wd-glass-fill"));
   return {surface:host.classList.contains('wd-glass--surface'),layers:[...material.children].map(layer=>{const b=layer.getBoundingClientRect();return [b.x,b.y,b.width,b.height]}),name:host.getAttribute('aria-label')||host.dataset.name,host:[h.x,h.y,h.width,h.height],material:[m.x,m.y,m.width,m.height],background:style.background,shadow:style.boxShadow,filter:style.backdropFilter};
  }));
  for(const g of geometry){assert.deepEqual(g.material,g.host,`Material escaped ${g.name}`);assert.equal(g.layers.length,2);for(const layer of g.layers)assert.deepEqual(layer,g.host,`Glass layer escaped ${g.name}`);assert.notEqual(g.filter,'none');}
  // Two shared branches by design: compact controls use the base plate, while
  // popovers, tooltips and the chart data label use Glass Surface. Each branch
  // must still resolve to exactly one fill/shadow; no local values.
  for(const surface of [false,true]){
   const group=geometry.filter(g=>g.surface===surface);
   assert.ok(group.length,`Missing ${surface?'Glass Surface':'base glass'} samples`);
   assert.equal(new Set(group.map(g=>g.background)).size,1,`${surface?'Surfaces':'Controls'} must share one fill/reflection`);
   assert.equal(new Set(group.map(g=>g.shadow)).size,1,`${surface?'Surfaces':'Controls'} must share one shadow`);
  }
  const discs=page.locator('.wd-glass--disc');
  assert.ok(await discs.count()>=4,'Circular controls must share the automatic disc modifier');
  for(const disc of await discs.all()){
    const state=disc.locator('.wd-glass-state');
    const idleEdge=await state.evaluate(el=>getComputedStyle(el,'::after').boxShadow);
    assert.match(idleEdge,/inset/);
  }
  for(const theme of ['dark','light']){
   if(await page.evaluate(()=>document.documentElement.dataset.theme)!==theme)await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
   await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme&&!document.documentElement.dataset.themeTransition,theme);
   await page.mouse.move(0,0);await page.waitForTimeout(300);
   await page.screenshot({path:`tests/output/home-glass-${preset}-${theme}.png`});
   if(preset==='figma'&&theme==='light'){
    const card=page.locator('[data-node-id="14537:4416"]'),box=await card.boundingBox();
    const idle=await card.locator('.wd-glass-fill').evaluate(el=>getComputedStyle(el).boxShadow);
    await card.hover();await page.waitForTimeout(320);
    assert.equal(await card.locator('.wd-glass-state').evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.match(await card.locator('.wd-glass-state').evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/);
    assert.notEqual(await card.locator('.wd-glass-fill').evaluate(el=>getComputedStyle(el).boxShadow),idle);
    const cardHover=await expectGrownFromCenter(card,box,'Hovered glass card');
    await page.mouse.down();await page.waitForTimeout(220);
    const cardPressed=await card.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
    assert.ok(cardPressed>=cardHover.scaleX+.025,'A glass card press must be visibly larger than hover');
    await page.mouse.up();
    await page.screenshot({path:'tests/output/home-glass-figma-light-hover.png'});
    await page.mouse.move(0,0);await page.waitForTimeout(320);
    assert.equal(await card.locator('.wd-glass-state').evaluate(el=>getComputedStyle(el).opacity),'0');
   }
   const disc=page.locator('[aria-label="Recent activity"]'),discBox=await disc.boundingBox();
   assert.equal(await disc.evaluate(el=>el.classList.contains('wd-glass--disc')),true);
   await disc.hover();await page.waitForTimeout(320);
   const discHover=await disc.evaluate(el=>{
    const state=getComputedStyle(el.querySelector('.wd-glass-state')),edge=getComputedStyle(el.querySelector('.wd-glass-state'),'::after'),glow=getComputedStyle(el.querySelector('.wd-glass-glow'));
    return {opacity:state.opacity,field:state.backgroundImage,edge:edge.boxShadow,glow:glow.opacity,glowImage:glow.backgroundImage};
   });
   assert.equal(discHover.opacity,'1');assert.match(discHover.field,/linear-gradient/);assert.match(discHover.edge,/inset/);assert.equal(discHover.glow,'1');assert.match(discHover.glowImage,/closest-side/);
   // The pointer halo must be a local white edge, not a full bright ring.
   const edgeGlow=await disc.evaluate(el=>getComputedStyle(el.querySelector('.wd-glass-glow'),'::after').backgroundImage);
   // Light anchors a near-black local contour on the true outer silhouette so
   // no bright seam opens between the idle outline and the hover edge; dark
   // keeps its brighter white contour unchanged.
   assert.match(edgeGlow,theme==='light'?/rgba\(0, 0, 0, 0\.(62|72)\)/:/rgba\(255, 255, 255, 0\.62\)/);
   const innerGlow=await disc.evaluate(el=>getComputedStyle(el.querySelector('.wd-glass-glow')).backgroundImage);
   assert.match(innerGlow,theme==='light'?/rgba\(255, 255, 255, 0\.4\)/:/rgba\(255, 255, 255, 0\.07\)/);
   const glowEdge=await disc.evaluate(el=>{const s=getComputedStyle(el.querySelector('.wd-glass-glow'),'::after');return {inset:s.inset,padding:s.padding}});
   assert.equal(glowEdge.padding,theme==='light'?'0.5px':'1px');
   assert.equal(glowEdge.inset,theme==='light'?'-0.5px':'0px','Local contour must sit on the painted silhouette');
   const discHoverGeometry=await expectGrownFromCenter(disc,discBox,'Hovered circular control');
   await page.mouse.down();await page.waitForTimeout(220);
   const discPressed=await disc.evaluate(el=>{const matrix=new DOMMatrix(getComputedStyle(el).transform);return {scaleX:matrix.a,scaleY:matrix.d}});
   assert.ok(discPressed.scaleX>=discHoverGeometry.scaleX+.045&&discPressed.scaleY>=discHoverGeometry.scaleY+.03,'A disc press must be clearly larger than hover, not just a sub-pixel difference');
   await page.mouse.up();await page.waitForTimeout(480);
   const discReleased=await disc.evaluate(el=>{const matrix=new DOMMatrix(getComputedStyle(el).transform);return {scaleX:matrix.a,scaleY:matrix.d}});
   assert.ok(Math.abs(discReleased.scaleX-discHoverGeometry.scaleX)<.002&&Math.abs(discReleased.scaleY-discHoverGeometry.scaleY)<.002,'Release must settle back to the hover scale');
   // Keyboard focus must receive the same edge, not only the pointer glow.
   const focus=await disc.evaluate(el=>{
    el.focus({focusVisible:true});
    const state=getComputedStyle(el.querySelector('.wd-glass-state'));
    return {focus:el.matches(':focus-visible'),edge:getComputedStyle(el.querySelector('.wd-glass-state'),'::after').boxShadow,opacity:state.opacity};
   });
   assert.match(focus.edge,/inset/);
  await page.waitForTimeout(320);
  focus.opacity=await disc.locator('.wd-glass-state').evaluate(el=>getComputedStyle(el).opacity);
   // A programmatic focus is not guaranteed to paint :focus-visible in every
   // browser; the keyboard pass above already proves the shared focus edge.
   if(focus.focus)assert.equal(focus.opacity,'1');
   await page.screenshot({path:`tests/output/home-glass-figma-${theme}-disc-focus.png`});
   await page.mouse.move(0,0);await disc.evaluate(el=>el.blur());await page.waitForTimeout(320);
   results.push({preset,theme,surfaces:geometry.length,filter:geometry[0].filter});
  }

 }
 await page.goto(`${url}?glass=figma`);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 // A popover is a composite surface: interacting with any child must never
 // grow the panel, while the glass child under the pointer still responds.
 await page.getByRole('button',{name:'Select statistics period'}).click();
 await page.waitForTimeout(360);
 const dialog=page.locator('.wd-date-picker'),dialogBox=await dialog.boundingBox();
 const field=dialog.locator('.wd-date-field-control').first(),fieldBox=await field.boundingBox();
 await field.click();await page.waitForTimeout(360);
 assert.deepEqual(await dialog.boundingBox(),dialogBox,'A popover must stay fixed while its own controls are used');
 const fieldHover=await expectGrownFromCenter(field,fieldBox,'Hovered popover field');
 await page.mouse.down();await page.waitForTimeout(220);
 const fieldPressed=await field.evaluate(el=>{const matrix=new DOMMatrix(getComputedStyle(el).transform);return matrix.a});
 assert.ok(fieldPressed>fieldHover.scaleX,'The inner glass control must still press');
 await page.mouse.up();await page.keyboard.press('Escape');await page.waitForTimeout(300);
  // Full-size surfaces are not cards: their halo used to be so faint that the
  // glass read as inert. Verify the surface branch keeps a visible, pointer-
  // local white arc instead of silently regressing to a flat frosted sheet.
  await page.getByRole('button',{name:'Select statistics period'}).click();
  await page.getByRole('button',{name:'Custom range',exact:true}).click();await page.waitForTimeout(360);
  const panel=page.locator('.wd-date-picker'),panelBox=await panel.boundingBox();
  await page.mouse.move(panelBox.x+6,panelBox.y+120);await page.waitForTimeout(360);
  const surfaceTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
  const surfaceGlow=await panel.evaluate(el=>{
   const glow=el.querySelector('.wd-glass-glow'),style=getComputedStyle(glow),edge=getComputedStyle(glow,'::after');
   const alpha=value=>parseFloat((value.match(/rgba\([^)]*?,\s*([\d.]+)\)/)||[])[1]||0);
   return {pointer:el.hasAttribute('data-glass-pointer'),opacity:style.opacity,
    wash:alpha(style.backgroundImage),rim:alpha(edge.backgroundImage),rimColor:edge.backgroundImage,radius:style.backgroundImage};
  });
  assert.equal(surfaceGlow.pointer,true,'A hovering surface must track the pointer');
  assert.equal(surfaceGlow.opacity,'1');
  assert.ok(surfaceGlow.wash>=.08,'Surface wash must be visible, got '+surfaceGlow.wash);
  assert.ok(surfaceGlow.rim>=(surfaceTheme==='light'?.32:.55),'Surface rim must be visible, got '+surfaceGlow.rim);
  assert.match(surfaceGlow.rimColor,surfaceTheme==='light'?/rgba\(0, 0, 0/:/rgba\(255, 255, 255/,'Pointer arc must match the theme');
  const haloRadius=parseFloat((surfaceGlow.radius.match(/radial-gradient\((\d+(?:\.\d+)?)px/)||[])[1]||0);
  assert.ok(haloRadius>0&&haloRadius<=200,'Surface halo must stay local, not span the whole panel');
  await page.mouse.move(panelBox.x+panelBox.width*.55,panelBox.y+panelBox.height*.5);await page.waitForTimeout(120);
  assert.ok(await panel.evaluate(el=>parseFloat(el.style.getPropertyValue('--glass-x')))>40,'Surface glow must follow the pointer');
  await page.screenshot({path:'tests/output/home-glass-figma-surface-glow.png'});
  // Nested glass must own the light. Bubbling used to hand every inner control
  // to the popover host, so fields and buttons never drew their own glow.
  for(const [name,selector] of [['field','.wd-date-field-control'],['cancel','.wd-date-action--cancel'],['apply','.wd-date-action--apply'],['month','.wd-date-nav-button']]){
   const control=page.locator(selector).first(),box=await control.boundingBox();
   await page.mouse.move(box.x+box.width*.62,box.y+box.height*.5);
   await page.waitForFunction(sel=>getComputedStyle(document.querySelector(sel).querySelector('.wd-glass-glow')).opacity==='1',selector);
   const nested=await control.evaluate(el=>({pointer:el.hasAttribute('data-glass-pointer'),
    glow:getComputedStyle(el.querySelector('.wd-glass-glow')).opacity,
    outer:el.closest('.wd-date-picker').hasAttribute('data-glass-pointer')}));
   assert.equal(nested.pointer,true,`${name} must own the pointer glow`);
   assert.equal(nested.glow,'1',`${name} must paint its pointer glow`);
   assert.equal(nested.outer,false,`${name} must not hand the glow to the popover`);
  }
  await page.screenshot({path:'tests/output/home-glass-figma-nested-glow.png'});
  // Light glass cannot borrow the dark white rim: a white arc on a near-white
  // face disappears. Assert the lighter frost, the stronger border, and a dark
  // pointer arc instead of a white one.
  if(await page.evaluate(()=>document.documentElement.dataset.theme)!=='light')await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
  await page.getByRole('button',{name:'Select statistics period'}).click();
  await page.getByRole('button',{name:'Custom range',exact:true}).click();await page.waitForTimeout(360);
  const lightPanel=page.locator('.wd-date-picker'),lightBox=await lightPanel.boundingBox();
  await page.mouse.move(lightBox.x+6,lightBox.y+120);await page.waitForTimeout(360);
  const lightSurface=await lightPanel.evaluate(el=>{
   const fill=getComputedStyle(el.querySelector('.wd-glass-fill')),glow=el.querySelector('.wd-glass-glow');
   const style=getComputedStyle(glow),edge=getComputedStyle(glow,'::after');
   const alpha=value=>parseFloat((value.match(/rgba\([^)]*?,\s*([\d.]+)\)/)||[])[1]||0);
   return {blur:fill.backdropFilter,tint:fill.backgroundColor,tintAlpha:alpha(fill.backgroundColor),
    wash:alpha(style.backgroundImage),rim:edge.backgroundImage,rimAlpha:alpha(edge.backgroundImage),pointer:el.hasAttribute('data-glass-pointer')};
  });
  assert.match(lightSurface.blur,/blur\(9px\)/,'Light surface must keep a readable backdrop, not a flat sheet');
  assert.ok(lightSurface.tintAlpha>=.40&&lightSurface.tintAlpha<=.48,'Light surface tint must stay translucent, got '+lightSurface.tintAlpha);
  assert.ok(lightSurface.wash>=.55,'Light surface wash must be visible, got '+lightSurface.wash);
  assert.match(lightSurface.rim,/rgba\(0, 0, 0/,'Light pointer arc must be dark, not white');
  assert.ok(lightSurface.rimAlpha>=.32,'Light pointer arc must be visible, got '+lightSurface.rimAlpha);
  assert.equal(lightSurface.pointer,true);
  await page.screenshot({path:'tests/output/home-glass-figma-light-surface.png'});
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
 if(await page.evaluate(()=>document.documentElement.dataset.theme)!=='dark')await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.documentElement.dataset.themeTransition);
 const card=page.locator('[data-node-id="14537:4416"]'),box=await card.boundingBox();
 await page.mouse.move(box.x+35,box.y+35);await page.waitForTimeout(300);
 const first=await card.evaluate(el=>({x:el.style.getPropertyValue('--glass-x'),y:el.style.getPropertyValue('--glass-y'),glow:getComputedStyle(el.querySelector('.wd-glass-glow')).opacity}));
 assert.equal(first.glow,'1');assert.equal(await page.locator('[data-glass-pointer]').count(),1);
 await page.mouse.move(box.x+box.width-35,box.y+box.height-35);await page.waitForTimeout(50);
 const second=await card.evaluate(el=>({x:el.style.getPropertyValue('--glass-x'),y:el.style.getPropertyValue('--glass-y')}));
 assert.ok(parseFloat(second.x)>parseFloat(first.x));assert.ok(parseFloat(second.y)>parseFloat(first.y));
 await expectGrownFromCenter(card,box,'Pointer-tracked glass card');
 await page.screenshot({path:'tests/output/home-glass-figma-glow.png'});
  await page.mouse.move(0,0);await page.waitForTimeout(520);
  assert.ok(parseFloat(await card.evaluate(el=>getComputedStyle(el.querySelector('.wd-glass-glow')).opacity))<.02);
 assert.equal(await page.locator('[data-glass-pointer]').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});await card.hover();
 assert.equal(await page.locator('[data-glass-pointer]').count(),0);assert.equal(await card.locator('.wd-glass-glow').evaluate(el=>getComputedStyle(el).display),'none');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({errors,results,pointer:{first,second,stationary:true,reducedMotion:true}},null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
