const { chromium } = require('./runtime.cjs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ ...require('./runtime.cjs').launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(require('./runtime.cjs').previewURL.split('?')[0]);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  assert.equal(await page.locator('.target-sidebar').getByText('WORK SPACE', {exact:true}).count(), 0);
  assert.equal(await page.locator('.target-brand img').getAttribute('src'), './home-assets/logo.svg');
  assert.equal(await page.locator('.target-nav[data-route="org"] img').getAttribute('src'), './home-assets/organisation.svg');
  assert.equal(await page.locator('.target-nav[data-route="statistics"] img').getAttribute('src'), './home-assets/statistics.svg');
  assert.equal(await page.locator('[data-node-id="I14613:1210;14612:7803"] img').getAttribute('src'), './home-assets/statistics.svg');
  assert.equal(await page.locator('.target-account-copy img').getAttribute('src'), './home-assets/account-arrows.svg');
  // The account name is primary ink in both themes; the disclosure arrows
  // start secondary and follow the name to primary on hover/focus.
  for(const theme of ['dark','light']){
    if(await page.evaluate(()=>document.documentElement.dataset.theme)!==theme)await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
    await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme&&!document.documentElement.dataset.themeTransition,theme);
    // The view-transition completes before the shared 260ms colour transition
    // on the arrow; wait for the theme ink to settle before comparing.
    await page.waitForTimeout(320);
    const name=await page.locator('.target-account-copy strong').evaluate(el=>getComputedStyle(el).color);
    const primary=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--wd-label-primary').trim());
    const probe=await page.evaluate(value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;},primary);
    assert.equal(name,probe);
    const secondary=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--wd-label-secondary').trim());
    const secondaryProbe=await page.evaluate(value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;},secondary);
    const arrow=page.locator('.target-account-arrow');
    const arrowColors=await page.evaluate(()=>{
      const normalize=value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;};
      const arrow=document.querySelector('.target-account-arrow');
      return {idle:normalize(getComputedStyle(arrow).color),secondary:normalize(getComputedStyle(document.documentElement).getPropertyValue('--wd-label-secondary').trim())};
    });
    assert.equal(arrowColors.idle,arrowColors.secondary);
    await page.locator('.target-account').hover();await page.waitForTimeout(300);
    const hoverColor=await page.locator('.target-account-arrow').evaluate(el=>getComputedStyle(el).color);
    const normalizedHover=await page.evaluate(value=>{const el=document.createElement('span');el.style.color=value;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;},hoverColor);
    assert.equal(normalizedHover,probe);
    await page.mouse.move(0,0);await page.waitForTimeout(300);
  }
  if(await page.evaluate(()=>document.documentElement.dataset.theme)!=='dark')await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.documentElement.dataset.themeTransition);
  assert.match(await page.locator('.theme-sun').getAttribute('style'), /sun.svg/);
  const sidebarGeometry = await page.evaluate(() => Object.fromEntries(['.target-quick-search','.target-primary-nav','.target-device','.target-teams'].map(s => {const r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,height:r.height}]})));
  assert.deepEqual(sidebarGeometry, {'.target-quick-search':{x:20,y:76,height:36},'.target-primary-nav':{x:20,y:132,height:147},'.target-device':{x:20,y:299,height:139},'.target-teams':{x:20,y:458,height:28}});
  const teamsHeading=page.getByRole("button",{name:"Teams",exact:true});
  const teamsContent=page.locator("#"+await teamsHeading.getAttribute("aria-controls"));
  assert.equal(await teamsHeading.getAttribute("aria-expanded"),"false");
  assert.equal(await teamsContent.isVisible(),false);
  assert.equal(await teamsContent.evaluate(e=>e.inert),true);
  await teamsHeading.click();assert.equal(await teamsHeading.getAttribute("aria-expanded"),"true");
  await teamsContent.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
  assert.equal(await teamsContent.isVisible(),true);
  assert.equal(await teamsContent.evaluate(e=>e.inert),false);
  for(const name of ['Device tool','Teams']){
    const heading=page.getByRole('button',{name,exact:true});
    const arrow=heading.locator('.wd-disclosure-icon');
    const glyph=arrow.locator('img');
    const originalArrow=await glyph.getAttribute('src');
    const controlled=page.locator('#'+await heading.getAttribute('aria-controls'));
    await heading.click();assert.equal(await heading.getAttribute('aria-expanded'),'false');
    const rotation=await glyph.evaluate(e=>{
      const a=e.getAnimations().find(a=>a.transitionProperty==='transform');if(!a)return null;
      const time=a.currentTime;a.pause();a.currentTime=a.effect.getTiming().duration/2;
      const matrix=new DOMMatrix(getComputedStyle(e).transform),angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
      a.currentTime=time;a.play();return {angle,duration:a.effect.getTiming().duration};
    });assert.ok(rotation.angle<0&&rotation.angle>-90);assert.equal(rotation.duration,380);
    assert.equal(await controlled.evaluate(e=>e.inert),true);
    const collapseMotion=await controlled.evaluate(async e=>{
      const a=e.getAnimations()[0];if(!a)return null;
      a.pause();a.currentTime=a.effect.getTiming().duration/2;
      const height=e.getBoundingClientRect().height;a.play();await a.finished;return height;
    });
    assert.ok(collapseMotion>0&&collapseMotion<108);assert.equal(await controlled.isVisible(),false);
    assert.equal(await glyph.getAttribute('src'),originalArrow);
    await glyph.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
    assert.equal(await glyph.evaluate(e=>Math.round(Math.atan2(new DOMMatrix(getComputedStyle(e).transform).b,new DOMMatrix(getComputedStyle(e).transform).a)*180/Math.PI)),-90);
    await heading.press('Enter');assert.equal(await heading.getAttribute('aria-expanded'),'true');
    await controlled.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
    assert.equal(await controlled.isVisible(),true);
    // Reversing an unfinished collapse must return to a complete, focusable list.
    await heading.click();await heading.click();
    await controlled.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
    assert.equal(await controlled.evaluate(e=>e.inert),false);assert.equal(await controlled.isVisible(),true);
  }
  await page.waitForTimeout(320);
  const hoverChecks=[];
  for(const el of await page.locator('.target-sidebar button,.target-header button:not(.workspace-tab-close),.shortcut-link').all()){
    // Real disabled controls must stay inert; they are not hover surfaces.
    if(await el.isDisabled())continue;
    await page.mouse.move(0,0);const before=await el.boundingBox();await el.hover();await page.waitForTimeout(300);const after=await el.boundingBox();
    const label=await el.getAttribute('aria-label');
    const glass=await el.evaluate(e=>{const style=getComputedStyle(e),matrix=new DOMMatrix(style.transform==='none'?'':style.transform);return {host:e.classList.contains('wd-glass'),scale:matrix.a,offset:[e.offsetWidth,e.offsetHeight]}});
    if(glass.host){assert.ok(glass.scale>1,`Glass control ${label} must grow on hover`);assert.deepEqual(glass.offset,[Math.round(before.width),Math.round(before.height)],`Hover changed the layout box for ${label}`);assert.ok(Math.abs(after.x+after.width/2-(before.x+before.width/2))<.6&&Math.abs(after.y+after.height/2-(before.y+before.height/2))<.6,`Hover moved the centre of ${label}`);}
    else assert.deepEqual(after,before,`Hover moved ${label}`);
    hoverChecks.push(label);
    if(await el.evaluate(e=>e.classList.contains('shortcut-link'))){
      const underline=await el.evaluate(e=>getComputedStyle(e.querySelector('.text')||e).textDecorationLine);assert.match(underline,/underline/);
    }
  }
  await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
  // Recently visited: the Home summary keeps its clock icon on every row, and
  // the archive survives reloads. Only the popover carries route icons.
  const recentLabels=async()=>page.locator('[data-recent-visit="true"]').evaluateAll(rows=>rows.map(row=>row.getAttribute('aria-label')));
  await page.evaluate(()=>localStorage.removeItem('wattdesk.recent-visits.v1'));
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  assert.deepEqual(await recentLabels(),['Home'],'Initial recent visits must contain one Home entry');
  const recentIcons=await page.locator('[data-recent-visit="true"] .target-icon-art').evaluateAll(icons=>icons.map(icon=>icon.style.getPropertyValue('--icon-mask')));
  assert.ok(recentIcons.every(mask=>mask.includes('asset-52.svg')),'Home summary rows keep the neutral clock icon');
  const viewAlls=['[data-node-id="I14612:8380;14612:7806;14420:2076;14420:2071"]','[data-node-id="I14612:8402;14612:7806;14420:2076;14420:2071"]'];
  const viewAllStyles=[];
  for(const selector of viewAlls){
   const control=page.locator(selector);
   assert.ok(await control.evaluate(el=>el.classList.contains('shortcut-link')),'Both View all controls use the shared link class');
   assert.equal(await control.getAttribute('role'),'button','Both View all controls are operable buttons');
   await control.hover();await page.waitForTimeout(280);
   viewAllStyles.push(await control.evaluate(el=>({line:getComputedStyle(el).textDecorationLine,color:getComputedStyle(el).textDecorationColor})));
   await page.mouse.move(0,0);await page.waitForTimeout(240);
  }
  assert.deepEqual(viewAllStyles[0],viewAllStyles[1],'Following and Recently visited View all controls share one hover treatment');
  // Following opens Plants; Recently visited opens the archive anchored to the
  // sidebar history button. Neither control creates a tab.
  await page.evaluate(()=>localStorage.removeItem('wattdesk.recent-visits.v1'));
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.locator(viewAlls[0]).click();await page.waitForTimeout(360);
  assert.equal(await page.locator('.workspace-tab').count(),1,'Following View all must not create a tab');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),false);
  assert.equal(await page.locator('.wd-history-popover').count(),0,'Following View all goes to Plants, not history');
  await page.locator('.target-sidebar .target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  await page.locator(viewAlls[1]).click();await page.waitForTimeout(360);
  const opened=await page.evaluate(()=>{
   const panel=document.querySelector('.wd-history-popover'),anchor=document.querySelector('.target-history');
   return panel&&anchor?{panel:panel.getBoundingClientRect().toJSON(),anchor:anchor.getBoundingClientRect().toJSON()}:null;
  });
  assert.ok(opened,'Recently visited View all opens the history popover');
  assert.ok(Math.abs(opened.panel.x-opened.anchor.x)<1&&opened.panel.y>=opened.anchor.bottom,'History popover anchors to the sidebar history button');
  assert.equal(await page.locator('.workspace-tab').count(),1,'Recently visited View all must not create a tab');
  await page.keyboard.press('Escape');await page.waitForTimeout(320);
  await page.locator('.target-sidebar .target-nav[data-route="plants"]').click();await page.waitForTimeout(280);
  await page.locator('.target-sidebar .target-nav[data-route="home"]').click();await page.waitForTimeout(280);
  const expectedHistory=['Home','Plants','Home','Plants','Home'];
  assert.deepEqual(await recentLabels(),expectedHistory);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  assert.deepEqual(await recentLabels(),expectedHistory,'Recent visits must survive a reload');
  await page.locator('.target-history').click();await page.waitForTimeout(360);
  assert.deepEqual(await page.locator('.wd-history-row').evaluateAll(rows=>rows.map(row=>row.getAttribute('aria-label'))),expectedHistory);
  const historyMaterial=await page.locator('.wd-history-popover').evaluate(panel=>({radius:getComputedStyle(panel).borderRadius,width:panel.getBoundingClientRect().width,material:!!panel.querySelector('.wd-glass-material'),profile:panel.dataset.cornerProfile}));
  assert.ok(Math.abs(historyMaterial.width-280)<1,'History popover width '+historyMaterial.width);assert.equal(historyMaterial.radius,'30px');assert.ok(historyMaterial.material);assert.equal(historyMaterial.profile,'continuous');
  await page.locator('.wd-history-row',{hasText:'Plants'}).first().click();await page.waitForTimeout(360);
  assert.equal(await page.locator('.wd-history-popover').count(),0,'Selecting a history row closes the popover');
  assert.equal(await page.locator('.workspace-tab').count(),1,'Selecting a history row keeps the current tab');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),false);
  await page.locator('.target-sidebar .target-nav[data-route="home"]').click();await page.waitForTimeout(280);
  await page.locator('.target-history').click();await page.waitForTimeout(360);
  const historyBox=await page.locator('.wd-history-popover').boundingBox();
  await page.mouse.click(historyBox.x+historyBox.width/2,historyBox.y+20);await page.waitForTimeout(60);
  assert.equal(await page.locator('.wd-history-popover').count(),1,'A pointer press inside the history panel must not dismiss it');
  await page.locator('.wd-history-row').first().click();await page.waitForTimeout(360);
  assert.equal(await page.locator('.wd-history-popover').count(),0);
  await page.evaluate(()=>localStorage.removeItem('wattdesk.recent-visits.v1'));
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  const iconAlignment=await page.evaluate(()=>['.target-back','.target-forward','.target-add-tab'].map(selector=>{
    const b=document.querySelector(selector).getBoundingClientRect(),i=document.querySelector(selector+' .target-icon-art').getBoundingClientRect();
    return {selector,dx:(i.x+i.width/2)-(b.x+b.width/2),dy:(i.y+i.height/2)-(b.y+b.height/2)};
  }));
  iconAlignment.forEach(({dx,dy})=>{assert.ok(Math.abs(dx)<.01);assert.ok(Math.abs(dy)<.01)});
  let tabIds=await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(t=>t.dataset.tabId));
  assert.deepEqual(tabIds,['home-1']);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('aria-selected'),'true');
  const tabWidth=await page.locator('.workspace-tab.selected').evaluate(el=>({width:el.getBoundingClientRect().width,cap:getComputedStyle(el).getPropertyValue('--workspace-tab-width').trim()}));
  assert.ok(tabWidth.width>0&&tabWidth.width<=180,'Tab width '+tabWidth.width+' exceeds 180px');
  assert.equal(tabWidth.cap,'180px');
  // Back and forward follow each tab route history and are truly disabled at
  // either end. They must not change tabs or claim a route that was truncated.
  const backControl=page.getByRole('button',{name:'Go back'});
  const forwardControl=page.getByRole('button',{name:'Go forward'});
  assert.equal(await backControl.isDisabled(),true);
  assert.equal(await forwardControl.isDisabled(),true);
  await backControl.focus();await page.keyboard.press('Enter');await page.waitForTimeout(120);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Home');
  await page.locator('.target-nav[data-route="plants"]').click();await page.waitForTimeout(320);
  assert.equal(await backControl.isDisabled(),false);
  assert.equal(await forwardControl.isDisabled(),true);
  await backControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Home');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),true);
  assert.equal(await backControl.isDisabled(),true);
  assert.equal(await forwardControl.isDisabled(),false);
  await forwardControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
  assert.equal(await forwardControl.isDisabled(),true);
  // Starting a new route from the middle of history drops the forward branch.
  await page.locator('.target-nav[data-route="service"]').click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Service ticket');
  assert.equal(await forwardControl.isDisabled(),true);
  assert.equal(await backControl.isDisabled(),false);
  await backControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
  assert.equal(await forwardControl.isDisabled(),false);
  await backControl.click();await page.waitForTimeout(320);
  await page.locator('.target-nav[data-route="service"]').click();await page.waitForTimeout(320);
  const inactiveNav=await page.locator('.target-nav[data-route="plants"]').evaluate(el=>({text:getComputedStyle(el).color,icon:getComputedStyle(el.querySelector('.target-icon-art')).color}));
  assert.equal(inactiveNav.text,inactiveNav.icon);
  // Sidebar navigation must update the active tab in place, never open a tab.
  await page.locator('.target-nav[data-route="service"]').click();await page.waitForTimeout(320);
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(t=>t.dataset.tabId)),tabIds);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),'home-1');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Service ticket');
  assert.equal(await page.locator('.target-nav[data-route="service"]').getAttribute('aria-current'),'page');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),false);
  // Empty routes share the 64px icon + 18px medium Coming soon fallback.
  const empty=page.locator('.wd-empty-state');
  assert.equal(await empty.isVisible(),true);
  assert.equal((await empty.locator('.wd-empty-state-label').textContent()).trim(),'Coming soon');
  assert.equal(await empty.locator('.wd-empty-state-icon img').getAttribute('src'),'http://127.0.0.1:4173/home-assets/asset-7.svg');
  const emptyGeometry=await empty.evaluate(el=>{
    const panel=document.querySelector('#home-workspace-panel').getBoundingClientRect(),box=el.getBoundingClientRect();
    const icon=el.querySelector('.wd-empty-state-icon').getBoundingClientRect(),label=el.querySelector('.wd-empty-state-label').getBoundingClientRect();
    return {dx:(box.x+box.width/2)-(panel.x+panel.width/2),dy:(box.y+box.height/2)-(panel.y+panel.height/2),iconAbove:icon.bottom<=label.top,iconWidth:icon.width,iconHeight:icon.height,labelSize:parseFloat(getComputedStyle(el.querySelector('.wd-empty-state-label')).fontSize),labelWeight:getComputedStyle(el.querySelector('.wd-empty-state-label')).fontWeight,width:box.width};
  });
  assert.ok(Math.abs(emptyGeometry.dx)<1&&Math.abs(emptyGeometry.dy+119)<1,'Empty state must stay horizontally centred and rise to the annotated position');
  assert.equal(emptyGeometry.iconAbove,true);assert.equal(emptyGeometry.iconWidth,64);assert.equal(emptyGeometry.iconHeight,64);assert.equal(emptyGeometry.labelSize,18);assert.equal(emptyGeometry.labelWeight,'510');assert.ok(emptyGeometry.width<260);
  // Neutral route icons must switch to the primary ink mask, not show grey export art.
  for(const [route,tone] of [['track','neutral'],['cell','neutral'],['module','neutral'],['plants','color']]){
    await page.locator('.target-nav[data-route="'+route+'"]').click();await page.waitForTimeout(320);
    const iconState=await page.locator('.workspace-tab.selected .workspace-tab-icon').evaluate(el=>({
      neutral:el.classList.contains('is-neutral-icon'),
      colorOpacity:getComputedStyle(el.querySelector('.workspace-tab-icon-color')).opacity,
      monoOpacity:getComputedStyle(el.querySelector('.workspace-tab-icon-mono')).opacity,
      monoColor:getComputedStyle(el.querySelector('.workspace-tab-icon-mono')).color,
      monoMask:getComputedStyle(el.querySelector('.workspace-tab-icon-mono')).maskImage
    }));
    if(tone==='neutral'){assert.equal(iconState.colorOpacity,'0');assert.equal(iconState.monoOpacity,'1');assert.equal(iconState.monoColor,'rgb(255, 255, 255)');assert.match(iconState.monoMask,/\/home-assets\/masks\//),'Neutral tab icon must use an opaque mask copy';}
    else{assert.equal(iconState.colorOpacity,'1');assert.equal(iconState.monoOpacity,'0');}
  }
  await page.locator('.target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  // Summary cards navigate to Plants instead of opening a detail popover.
  for(const id of ['14537:4416','14537:3925']){
    await page.locator('[data-node-id="'+id+'"]').click();await page.waitForTimeout(320);
    assert.equal(await page.locator('#home-active-popover').count(),0);
    assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
    assert.equal(await page.locator('.target-nav[data-route="plants"]').getAttribute('aria-current'),'page');
    await page.locator('.target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  }
  await page.locator('.target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),true);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Home');
  // Switching tabs restores each tab's own route and Home state.
  await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(360);
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(t=>t.dataset.tabId)),['home-1','home-2']);
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(t=>t.querySelector('.workspace-tab-label').textContent)),['Home','Home']);
  // Home tabs keep independent search, period and scroll state.
  let homeOne=page.locator('.workspace-tab[data-tab-id="home-1"]');
  const homeTwo=page.locator('.workspace-tab[data-tab-id="home-2"]');
  const homeSearch=page.getByLabel('Search sites, devices and people');
  await homeOne.click();await page.waitForTimeout(360);
  await page.locator('.target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  await page.locator('[data-node-id="14578:7006"]').evaluate(el=>el.scrollTop=420);
  await homeSearch.fill('Summit');
  await page.waitForTimeout(120);
  await homeTwo.click();await page.waitForTimeout(360);
  assert.deepEqual(await page.evaluate(()=>({scrollTop:document.querySelector('[data-node-id="14578:7006"]').scrollTop,query:document.querySelector('input[aria-label="Search sites, devices and people"]').value})),{scrollTop:0,query:''});
  // Each tab owns its navigation history. The fresh tab starts with both
  // directions disabled; returning to the first tab restores its history.
  assert.equal(await backControl.isDisabled(),true);
  assert.equal(await forwardControl.isDisabled(),true);
  await page.locator('.target-nav[data-route="track"]').click();await page.waitForTimeout(320);
  assert.equal(await backControl.isDisabled(),false);
  await homeOne.click();await page.waitForTimeout(360);
  // The first tab already visited several routes before the second tab was
  // created. It keeps that history; the new tab must not inherit it.
  assert.equal(await backControl.isDisabled(),false);
  assert.equal(await forwardControl.isDisabled(),true);
  await backControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
  assert.equal(await forwardControl.isDisabled(),false);
  await forwardControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Home');
  assert.equal(await forwardControl.isDisabled(),true);
  await homeTwo.click();await page.waitForTimeout(360);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Device track');
  assert.equal(await forwardControl.isDisabled(),true);
  assert.equal(await backControl.isDisabled(),false);
  await backControl.click();await page.waitForTimeout(320);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Home');
  await homeSearch.fill('Eastshore');
  await homeOne.click();await page.waitForTimeout(360);
  const firstHome=await page.evaluate(()=>({scrollTop:document.querySelector('[data-node-id="14578:7006"]').scrollTop,query:document.querySelector('input[aria-label="Search sites, devices and people"]').value}));
  assert.equal(firstHome.query,'Summit');assert.ok(firstHome.scrollTop>150);
  await homeSearch.fill('');
  // Closing must not stall at the readable minimum and then snap when removed.
  await homeTwo.hover();await page.waitForTimeout(260);
  const closeMotion=await page.evaluate(async()=>{
   const add=document.querySelector('.target-add-tab');
   const x0=add.getBoundingClientRect().x;
   document.querySelector('.workspace-tab[data-tab-id="home-2"] .workspace-tab-close').click();
   const samples=[];
   await new Promise(resolve=>{
    const start=performance.now();
    const frame=()=>{
     samples.push(add.getBoundingClientRect().x);
     if(performance.now()-start<340)requestAnimationFrame(frame);else resolve();
    };
    requestAnimationFrame(frame);
   });
   return {x0,x1:add.getBoundingClientRect().x,samples};
  });
  assert.ok(closeMotion.x1<closeMotion.x0-100,'Closing should collapse the tab slot');
  // Closing a tab also releases its route history. The remaining tab keeps
  // its own controls, so a stale history from the removed tab cannot leak in.
  assert.equal(await forwardControl.isDisabled(),true);
  assert.equal(await backControl.isDisabled(),false);
  const closeJumps=closeMotion.samples.slice(1).map((x,i)=>Math.abs(x-closeMotion.samples[i]));
  assert.ok(Math.max(...closeJumps)<32,'Closing should move the Add button continuously');
  assert.equal(await page.locator('.workspace-tab[data-tab-id="home-2"]').count(),0);
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(t=>t.dataset.tabId)),['home-1']);
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),true);
  // Closing the last tab restores a usable Home tab.
  await page.locator('.workspace-tab[data-tab-id="home-1"]').hover();await page.waitForTimeout(260);
  await page.locator('.workspace-tab[data-tab-id="home-1"] .workspace-tab-close').click();await page.waitForTimeout(420);
  const restoredTab=page.locator('.workspace-tab').first();
  assert.equal(await page.locator('.workspace-tab').count(),1);
  assert.equal((await restoredTab.locator('.workspace-tab-label').textContent()).trim(),'Home');
  assert.equal(await page.locator('[data-node-id="14578:7006"]').isVisible(),true);
  // Add must resolve the new slot from the count that now includes the Add
  // button. Previously the entrance read the in-flight average and briefly
  // showed the wider pre-Add width before snapping back.
  await page.setViewportSize({width:1116,height:900});await page.waitForTimeout(320);
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(320);}
  await page.waitForTimeout(360);
  const compressedLane=await page.locator('.workspace-tab-list').evaluate(list=>({width:parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'))}));
  assert.ok(compressedLane.width>58&&compressedLane.width<180,`Regression lane width ${compressedLane.width}px should expose a changing average`);
  const siblingFrames=await page.evaluate(async()=>{
    const list=document.querySelector('.workspace-tab-list');
    const siblings=[...list.querySelectorAll('.workspace-tab')];
    const before=siblings.map(tab=>parseFloat(getComputedStyle(tab).width));
    const previous=parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'));
    const samples=[];
    document.querySelector('.target-add-tab').click();
    const start=performance.now();
    await new Promise(resolve=>{
      const sample=()=>{
        // getBoundingClientRect() includes the pressed glass transform. The
        // layout slot itself must remain fixed at the new average.
        samples.push(siblings.map(tab=>parseFloat(getComputedStyle(tab).width)));
        if(performance.now()-start<220)requestAnimationFrame(sample);else resolve();
      };
      requestAnimationFrame(sample);
    });
    const slot=parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'));
    return {before,previous,slot,samples};
  });
  // Existing tabs must adopt the new slot directly from the first sampled
  // frame. Allowing the previous slot here would miss the one-frame flash
  // caused by inserting a tab before the new average has been resolved.
  assert.ok(siblingFrames.before.every(width=>Math.abs(width-siblingFrames.before[0])<.2));
  assert.ok(siblingFrames.slot<siblingFrames.previous-.5,'Regression test needs a narrower post-Add slot');
  assert.ok(siblingFrames.samples.length>1);
  assert.ok(siblingFrames.samples.every(frame=>frame.every(width=>Math.abs(width-siblingFrames.slot)<.8)),'Existing tabs painted at a pre-Add width before adopting the new slot');
  const observedEntrance=await page.evaluate(async()=>{
    const list=document.querySelector('.workspace-tab-list');
    const before=parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'));
    const samples=[];
    const start=performance.now();
    document.querySelector('.target-add-tab').click();
    const tab=list.lastElementChild;
    await new Promise(resolve=>{
      const sample=()=>{
        samples.push(parseFloat(getComputedStyle(tab).width));
        if(performance.now()-start<240)requestAnimationFrame(sample);else resolve();
      };
      requestAnimationFrame(sample);
    });
    return {before,slot:parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width')),max:Math.max(...samples)};
  });
  const addAnimation=await page.locator('.workspace-tab').last().evaluate(el=>el.getAnimations().length);
  assert.ok(addAnimation>0,'New tab should animate its layout slot');
  const newTabEntrance=await page.evaluate(async()=>{
    const list=document.querySelector('.workspace-tab-list'),tab=list.lastElementChild;
    const slot=parseFloat(getComputedStyle(list).getPropertyValue('--workspace-tab-width'));
    const keyframes=tab.getAnimations().find(a=>a.effect.getKeyframes().some(k=>k.flexBasis))?.effect.getKeyframes()||[];
    let max=0;
    const start=performance.now();
    await new Promise(resolve=>{
      const sample=()=>{
        max=Math.max(max,parseFloat(getComputedStyle(tab).width));
        if(performance.now()-start<180)requestAnimationFrame(sample);else resolve();
      };
      requestAnimationFrame(sample);
    });
    return {slot,max,target:parseFloat(keyframes.at(-1)?.width)};
  });
  assert.ok(Number.isFinite(newTabEntrance.max),'New tab should have a resolved entrance width');
  assert.ok(observedEntrance.before>observedEntrance.slot,'Compressed Add should reduce the shared slot');
  assert.ok(observedEntrance.max<=observedEntrance.slot+.6,`New tab entered at ${observedEntrance.max}px, above the final ${observedEntrance.slot}px slot`);
  assert.ok(Math.abs(newTabEntrance.target-newTabEntrance.slot)<.6,`New tab target ${newTabEntrance.target}px differs from final slot ${newTabEntrance.slot}px`);
  assert.ok(newTabEntrance.max<=newTabEntrance.target+.6,`New tab grew to ${newTabEntrance.max}px above its target ${newTabEntrance.target}px`);
  await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(360);
  // Overflow tabs still keep a complete shadow viewport and a reachable Add button.
  for(let i=0;i<24;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(70);}
  await page.waitForTimeout(600);
  const overflow=await page.evaluate(()=>{
   const list=document.querySelector('.workspace-tab-list'),add=document.querySelector('.target-add-tab');
   const tabs=[...document.querySelectorAll('.workspace-tab')];
   return {count:tabs.length,listOverflowX:getComputedStyle(list).overflowX,tabsOverflow:getComputedStyle(tabs[0]).overflow,
    labels:tabs.map(t=>[t.querySelector('.workspace-tab-label').textContent,t.querySelector('.workspace-tab-label').scrollWidth>t.querySelector('.workspace-tab-label').clientWidth]),
    addRight:add.getBoundingClientRect().right,listRight:list.getBoundingClientRect().right};
  });
  assert.ok(overflow.count>=20);assert.ok(['auto','scroll'].includes(overflow.listOverflowX));assert.ok(overflow.count>=20);
  assert.ok(overflow.labels.length>=6);assert.ok(overflow.addRight>overflow.listRight);

  await page.locator('#toast').evaluate(el=>el.hidden=true);
  // The expanded circular target must remain visible and clickable beyond the heading.
  assert.equal(await page.locator('.chart-menu').count(),6);
  for(const menu of await page.locator('.chart-menu').all()){
    await menu.scrollIntoViewIfNeeded();await menu.hover();await page.waitForTimeout(300);
    const circle=await menu.evaluate(el=>{
      const r=el.getBoundingClientRect(),points=[[0,-12],[12,0],[0,12],[-12,0]];
      return {size:[r.width,r.height],opacity:getComputedStyle(el,'::before').opacity,
        hits:points.map(([x,y])=>el.contains(document.elementFromPoint(r.x+r.width/2+x,r.y+r.height/2+y)))};
    });
    assert.deepEqual(circle.size,[30,30]);assert.equal(circle.opacity,'1');assert.ok(circle.hits.every(Boolean),'Clipped chart menu circle');
  }
  await page.locator('[data-node-id="14578:7006"]').evaluate(el=>el.scrollTop=0);
  await page.mouse.move(0,0);await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/output/home-implementation-1920.png' });
  const base = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    font: document.fonts.check('13px "SF Pro"'),
    imageCount: document.querySelectorAll('img').length,
    failedImages: [...document.querySelectorAll('img')].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
    scrollHeight: document.querySelector('[data-node-id="14578:7006"]').scrollHeight,
    scrollViewport: document.querySelector('[data-node-id="14578:7006"]').clientHeight
  }));
  const themeButton = page.getByRole('button', { name: 'Toggle light and dark mode' });
  await themeButton.click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.dataset.themeTransition);
  const lightTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    canvas: getComputedStyle(document.body).backgroundColor,
    glass: getComputedStyle(document.querySelector('.wd-glass-fill')).backgroundColor,
    sunVisible: getComputedStyle(document.querySelector('.theme-sun')).display !== 'none',
    pressed: document.querySelector('.target-theme').getAttribute('aria-pressed')
  }));
  await page.waitForTimeout(320);
  await page.screenshot({ path: 'tests/output/home-implementation-light.png' });
  await themeButton.click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.documentElement.dataset.themeTransition);
  const darkTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    canvas: getComputedStyle(document.body).backgroundColor,
    moonVisible: getComputedStyle(document.querySelector('.theme-moon')).display !== 'none',
    pressed: document.querySelector('.target-theme').getAttribute('aria-pressed')
  }));
  // Add/close must animate layout, not snap the trailing Add button.
  await page.mouse.move(0,0);await page.waitForTimeout(200);
  const addBefore=await page.locator('.target-add-tab').evaluate(el=>el.getBoundingClientRect().x);
  await page.getByRole('button',{name:'Add tab'}).click();
  await page.waitForTimeout(360);
  await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(320);
  const addAfter=await page.locator('.target-add-tab').evaluate(el=>el.getBoundingClientRect().x);
  // At the viewport used by the later overflow phase the strip may already be
  // at its scroll limit, so only require a stable, finite position here.
  assert.ok(Number.isFinite(addAfter)&&Number.isFinite(addBefore));
  const closeChip=page.locator('.workspace-tab.selected');
  await closeChip.hover();await page.waitForTimeout(280);
  const closeFade=await closeChip.locator('.workspace-tab-close').evaluate(el=>getComputedStyle(el).transitionProperty);
  assert.match(closeFade,/background-color/);assert.match(closeFade,/color/);
  // Route changes crossfade the label and icon instead of swapping instantly.
  await page.locator('.target-nav[data-route="plants"]').click();
  const routeTransition=await page.locator('.workspace-tab.selected').evaluate(el=>[...el.querySelectorAll('.workspace-tab-label,.workspace-tab-icon,.workspace-tab-icon-layer')].flatMap(n=>n.getAnimations()).map(a=>a.playState));
  assert.ok(routeTransition.length>0,'Route change should crossfade label and icon');
  await page.waitForTimeout(300);
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Plants');
  await page.locator('.target-nav[data-route="home"]').click();await page.waitForTimeout(320);
  await page.locator('.target-add-tab').evaluate(el=>el.click());
  const plantsNav = page.locator('.target-nav[data-route="plants"]');
  await page.waitForTimeout(700);
  const idleNavBackground = await plantsNav.evaluate(el => getComputedStyle(el).backgroundColor);
  await plantsNav.hover();
  const hoverFade=await plantsNav.evaluate(el=>el.getAnimations().filter(a=>a.transitionProperty==='background-color').map(a=>({property:a.transitionProperty,duration:a.effect.getTiming().duration})));
  assert.equal(hoverFade[0]?.duration,260);
  await page.waitForTimeout(320);
  const hoverNavBackground = await plantsNav.evaluate(el => getComputedStyle(el).backgroundColor);
  await page.mouse.move(0, 0);
  const leaveFade=await plantsNav.evaluate(el=>el.getAnimations().filter(a=>a.transitionProperty==='background-color').map(a=>a.effect.getTiming().duration));
  assert.equal(leaveFade[0],260);
  await page.waitForTimeout(320);
  const shadowGutters=await page.evaluate(()=>{
    const viewport=document.querySelector('[data-node-id="14578:7006"]').getBoundingClientRect();
    return ['14445:3354','14537:3942'].map(id=>{
      const rect=document.querySelector(`[data-node-id="${id}"]`).getBoundingClientRect();
      return {id,left:rect.left-viewport.left,right:viewport.right-rect.right};
    });
  });shadowGutters.forEach(g=>{assert.ok(g.left>=48&&g.right>=48)});
  await page.locator('[data-node-id="14578:7006"]').evaluate(el => el.scrollTop = el.scrollHeight);
  const bottomSpace=await page.evaluate(()=>{
    const viewport=document.querySelector('[data-node-id="14578:7006"]').getBoundingClientRect();
    const lastCard=document.querySelector('[data-node-id="14570:1237"]').getBoundingClientRect();
    return viewport.bottom-lastCard.bottom;
  });assert.ok(bottomSpace>=31&&bottomSpace<=33,`Bottom space ${bottomSpace}`);
  await page.screenshot({ path: 'tests/output/home-implementation-scrolled.png' });
  const refresh=page.getByRole('button',{name:'Refresh statistics'});
  await refresh.click();assert.equal(await refresh.getAttribute('aria-busy'),'true');
  const refreshMotion=await refresh.evaluate(async el=>{
    const image=el.querySelector('.asset>img'),rotations=()=>image.getAnimations().filter(a=>a.effect.getKeyframes().some(k=>k.transform)),a=rotations()[0];a.pause();a.currentTime=a.effect.getTiming().duration/2;
    const result={keyframes:a.effect.getKeyframes().map(k=>k.transform),transform:getComputedStyle(image).transform,count:rotations().length};
    el.click();result.countAfterRepeat=rotations().length;a.play();await a.finished;return result;
  });
  assert.deepEqual(refreshMotion.keyframes,['rotate(0deg)','rotate(360deg)']);assert.equal(refreshMotion.countAfterRepeat,1);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Refresh statistics"]').getAttribute('aria-busy')==='false');
  await page.getByRole('button', { name: 'Select statistics period' }).click();
  await page.getByRole('button', { name: 'Last 30 days', exact: true }).click();
  // Apply is the panel's one solid accent (Figma 14736:5234): a saturated
  // blue pill, not a frosted face that washes towards white.
  const applySurface=await page.getByRole('button', { name: 'Apply', exact: true }).evaluate(el=>{
    const fill=el.querySelector('.wd-glass-fill'),material=el.querySelector('.wd-glass-material'),style=getComputedStyle(fill);
    const channels=style.backgroundColor.match(/[\d.]+/g).map(Number);
    return {rgb:channels.slice(0,3),blur:style.backdropFilter,material:material.className,rim:getComputedStyle(el.querySelector('.wd-glass-rim')).backgroundImage};
  });
  assert.ok(applySurface.rgb[2]>=245,`Apply keeps the saturated accent blue, got ${applySurface.rgb}`);
  assert.ok(applySurface.rgb[0]<=6&&applySurface.rgb[1]>=130&&applySurface.rgb[1]<=150,`Apply has no white wash, got ${applySurface.rgb}`);
  assert.match(applySurface.material,/wd-glass-material/,'Apply still mounts the shared material');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(360);
  const pickedPeriod = await page.locator('[data-node-id="I14578:6106;14420:2221;14420:2195"]').textContent();
  assert.equal(pickedPeriod,'Last 30 days');
  // The refresh control stays on the card's right edge while the capsule grows left.
  // Apply dismisses the chooser; move away so measured boxes are not inflated by hover scaling.
  await page.mouse.move(0,0);await page.waitForTimeout(360);
  const periodLayout=await page.evaluate(()=>{
    const label=document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]'),chip=document.querySelector('[data-node-id="14578:6106"]'),refresh=document.querySelector('[data-node-id="14612:8453"]'),card=document.querySelector('[data-node-id="14570:1111"]');
    // The control row is flush with the period header's right edge. Comparing
    // against the header keeps this assertion about the capsule while card
    // columns remain free to respond to the container width.
    const header=document.querySelector('[data-node-id="14561:836"]');
    const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
    return {chip:box(chip),label:{...box(label),scrollWidth:label.scrollWidth,clientWidth:label.clientWidth},refresh:box(refresh),card:box(card),header:box(header)};
  });
  assert.ok(periodLayout.label.scrollWidth<=periodLayout.label.clientWidth,'Period label must not be clipped');
  assert.ok(Math.abs(periodLayout.refresh.right-periodLayout.header.right)<1,'Refresh must align with the period header right edge');
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Select statistics period' }).click();
  await page.getByRole('button', { name: 'Custom range', exact: true }).click();
  // The error state owns the whole control, and keeps it: focusing a segment
  // or pressing Apply must not clear the ring that was just raised.
  const segment=part=>page.getByLabel(`Start date, ${part}`, {exact:true});
  const fieldState=()=>page.evaluate(()=>{
    const control=document.querySelector('.wd-date-field-control'),error=document.querySelector('.wd-date-error');
    return {invalid:control.classList.contains('wd-date-invalid'),ring:getComputedStyle(control,'::after').boxShadow,
      color:getComputedStyle(control).color,message:error.hidden?null:error.textContent};
  });
  assert.deepEqual(await page.locator('.wd-date-field-control').first().locator('.wd-date-separator').allTextContents(),['/','/',' ',':'],'Separators are painted in fixed positions');
  const typeSegment=async (part,value)=>{const input=segment(part);await input.click();await input.fill(value);await input.blur();};
  await typeSegment('month','13');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(240);
  const impossible=await fieldState();
  assert.equal(impossible.invalid,true,'An impossible date marks the whole field');
  assert.match(impossible.ring,/rgb\(255, 66, 69\)/,'The invalid field paints a 1px red ring');
  assert.match(impossible.color,/rgb\(255, 66, 69\)/,'Segments, separators and the icon turn red');
  assert.match(impossible.message,/real date/);
  assert.equal(await page.locator('.wd-date-picker').count(),1,'Apply must not close on an invalid range');
  // The error row belongs under the fields and above the closing divider, and
  // the card must grow into it rather than snapping to the taller layout.
  const errorLayout=await page.evaluate(()=>{
    const panel=document.querySelector('.wd-date-picker'),row=document.querySelector('.wd-date-message'),
      inputs=document.querySelector('.wd-date-inputs'),rules=document.querySelectorAll('.wd-date-rule');
    const box=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
    return {panel:box(panel),row:box(row),inputs:box(inputs),ruleTwo:{top:rules[1].getBoundingClientRect().top},
      rowOpacity:Number(getComputedStyle(row).opacity)};
  });
  assert.ok(errorLayout.row.top>=errorLayout.inputs.bottom-.5,'The error starts below the fields');
  assert.ok(errorLayout.row.bottom<=errorLayout.ruleTwo.top+.5,'The error ends above the closing divider');
  assert.ok(Math.abs(errorLayout.panel.height-460)<2,`The error state is 460px tall, got ${errorLayout.panel.height}`);
  assert.ok(Math.abs(errorLayout.row.height-30)<2,`The error row measures 30px, got ${errorLayout.row.height}`);
  assert.equal(errorLayout.rowOpacity,1,'The error copy is fully faded in once settled');
  const settledPanelHeight=errorLayout.panel.height;
  const monthBox=await page.evaluate(()=>{
    const text=document.querySelector('.wd-date-month-text'),cell=document.querySelector('.wd-date-weekday');
    const t=text.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(cell);
    const glyph=range.getBoundingClientRect(),style=getComputedStyle(text);
    return {left:t.left,glyphLeft:glyph.left,fontSize:style.fontSize,fontWeight:Number(style.fontWeight)};
  });
  assert.ok(Math.abs(monthBox.left-monthBox.glyphLeft)<1,'The month heading aligns with the weekday glyph');
  assert.equal(monthBox.fontSize,'14px','The month heading uses 14px');
  assert.equal(monthBox.fontWeight,510,'The month heading uses medium (510)');
  // A real correction retracts the row instead of collapsing it in one frame.
  // Correct the whole date, not just the month: 2026/10/13 is a valid month but
  // an impossible day, so the error would legitimately stay.
  await typeSegment('month','10');
  await typeSegment('day','01');
  const retracting=await page.evaluate(()=>{
    const panel=document.querySelector('.wd-date-picker'),row=document.querySelector('.wd-date-message');
    return {panelHeight:panel.getBoundingClientRect().height,rowHeight:row.getBoundingClientRect().height,animations:row.getAnimations().length};
  });
  assert.ok(retracting.animations>0||retracting.rowHeight===0,'The retract either animates or is already complete');
  await page.waitForTimeout(360);
  const retracted=await page.evaluate(()=>{
    const panel=document.querySelector('.wd-date-picker'),row=document.querySelector('.wd-date-message');
    return {panelHeight:panel.getBoundingClientRect().height,rowHeight:row.getBoundingClientRect().height,hidden:document.querySelector('#wd-date-error').hidden};
  });
  assert.ok(Math.abs(retracted.panelHeight-433)<2,`The card returns to 433px, got ${retracted.panelHeight}`);
  assert.equal(retracted.rowHeight,0);
  assert.equal(retracted.hidden,true);
  // Re-raise it to confirm the settled state still matches the measured growth.
  await typeSegment('day','13');
  await page.waitForTimeout(360);
  const reRaised=(await page.locator('.wd-date-picker').boundingBox()).height;
  assert.ok(Math.abs(reRaised-settledPanelHeight)<2,'A repeated error settles at the same height');
  await typeSegment('day','01');
  const fillField=async (label,values)=>{
   for(const [part,value] of Object.entries(values))await page.getByLabel(`${label}, ${part}`, {exact:true}).fill(value);
  };
  await fillField('Start date',{year:'2026',month:'10',day:'01',hour:'00',minute:'00'});
  await fillField('End date',{year:'2026',month:'10',day:'09',hour:'23',minute:'59'});
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  const custom = await page.evaluate(()=>({
    period:document.querySelector('[data-node-id="I14578:6106;14420:2221;14420:2195"]').textContent,
    metadataPresent:Boolean(document.querySelector('[data-node-id="14561:1103"],[data-node-id="14561:1104"]'))
  }));
  // Dismissing must fade the copy and the glass plate together. Fading the
  // copy first left an empty, still-blurred shell for the last frames.
  await page.getByRole('button', { name: 'Select statistics period' }).click();
  await page.getByRole('button', { name: 'Custom range', exact:true }).click();
  await page.waitForTimeout(360);
  await page.mouse.click(12, 900);
  await page.waitForTimeout(90);
  const exiting=await page.evaluate(()=>{
    const panel=document.querySelector('.wd-date-picker');
    if(!panel)return null;
    const copy=panel.querySelector('.wd-date-picker-content');
    const fill=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
    const optics=panel.querySelector(':scope>.wd-glass-material>.wd-glass-optics');
    const opacity=el=>el?Number(getComputedStyle(el).opacity):null;
    return {copy:opacity(copy),fill:opacity(fill),optics:opacity(optics),host:Number(getComputedStyle(panel).opacity)};
  });
  if(exiting){
    assert.ok(exiting.copy>0,'The copy is still visible while the plate is visible');
    const detail=JSON.stringify(exiting);
    assert.ok(Math.abs(exiting.copy-exiting.fill)<.06,'Copy and plate fade together: '+detail);
    assert.ok(Math.abs(exiting.copy-exiting.optics)<.06,'Copy and optics fade together: '+detail);
    assert.equal(exiting.host,1,'The host stays opaque so blur is never dropped mid-exit');
  }
  await page.waitForTimeout(260);
  assert.equal(await page.locator('.wd-date-picker').count(),0,'The chooser is removed after its exit');
  assert.equal(custom.period,'Custom range');
  assert.equal(custom.metadataPresent,false,'Removed period metadata must not remain in the DOM');
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search sites, devices and people').fill('Summit');
  const searchResults = await page.locator('.wd-search-result').allTextContents();
  assert.ok(searchResults.some(text=>text.includes('Summit Energy')),'Search must surface Summit Energy');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByLabel('Search sites, devices and people').fill('');
  await page.locator('[data-node-id="14578:7006"]').evaluate(el => el.scrollTop = 0);
  await page.screenshot({ path: 'tests/output/home-implementation-1440.png' });
  await page.setViewportSize({width:1545,height:1252});
  await page.reload();await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});
  await page.screenshot({path:'tests/output/home-annotations-fixed-1545.png'});
  await themeButton.click();await page.mouse.move(0,0);await page.waitForTimeout(320);
  await page.screenshot({path:'tests/output/home-annotations-fixed-1545-light.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Device tool',exact:true}).click();
  assert.equal(await page.locator('#device-items').isVisible(),false);
  await page.getByRole('button',{name:'Device tool',exact:true}).click();
  await refresh.click();assert.equal(await refresh.getAttribute('aria-busy'),'false');
  assert.equal(await refresh.locator('.asset>img').evaluate(el=>el.getAnimations().length),0);
  await page.setViewportSize({width:1100,height:900});await page.waitForTimeout(320);
  for(let i=0;i<8;i++){await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90);}
  for(let i=0;i<24;i++){
    if(await page.locator('.workspace-tab-list').evaluate(el=>el.classList.contains('is-overflowing'))) break;
    await page.getByRole('button',{name:'Add tab'}).click();await page.waitForTimeout(90);
  }
  await page.waitForTimeout(360);
  const overflowStrip=await page.evaluate(()=>({listOverflow:getComputedStyle(document.querySelector('.workspace-tab-list')).overflowX,count:document.querySelectorAll('.workspace-tab').length,overflowing:document.querySelector('.workspace-tab-list').classList.contains('is-overflowing')}));
  assert.ok(overflowStrip.count>5);assert.equal(overflowStrip.overflowing,true);assert.ok(['auto','scroll'].includes(overflowStrip.listOverflow));
  const overflowAddBefore = await page.locator('.target-add-tab').evaluate(el => el.getBoundingClientRect().x);
  const widthBeforeClose=await page.locator('.workspace-tab-list').evaluate(el=>getComputedStyle(el).getPropertyValue('--workspace-tab-width'));
  const overflowTab=page.locator('.workspace-tab').nth(2);
  await overflowTab.hover();await page.waitForTimeout(280);
  const closeBox = await overflowTab.locator('.workspace-tab-close').boundingBox();
  const pointer = { x: closeBox.x + closeBox.width / 2, y: closeBox.y + closeBox.height / 2 };
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.click(pointer.x, pointer.y);
  await page.waitForTimeout(240);
  const overflowAddAfter = await page.locator('.target-add-tab').evaluate(el => el.getBoundingClientRect().x);
  assert.ok(Math.abs(overflowAddAfter - overflowAddBefore) <= 1, `Add tab jumped ${overflowAddBefore} -> ${overflowAddAfter} after close`);
  const widthWhileInside=await page.locator('.workspace-tab-list').evaluate(el=>getComputedStyle(el).getPropertyValue('--workspace-tab-width'));
  assert.equal(widthWhileInside,widthBeforeClose);
  const nextTarget = await page.evaluate(({x, y}) => {
    const hit = document.elementFromPoint(x, y);
    const tab = hit?.closest('.workspace-tab');
    if (!tab) return null;
    const rect = tab.querySelector('.workspace-tab-close').getBoundingClientRect();
    return { id: tab.id, contains: x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom };
  }, pointer);
  assert.ok(nextTarget?.contains, `Next close target did not land under the pointer: ${JSON.stringify(nextTarget)}`);
  await page.mouse.click(pointer.x, pointer.y);
  await page.waitForTimeout(240);
  assert.equal(await page.locator('.workspace-tab').count(), overflowStrip.count - 2);
  await page.mouse.move(0,500);await page.waitForTimeout(320);
  const widthAfterLeave=await page.locator('.workspace-tab-list').evaluate(el=>getComputedStyle(el).getPropertyValue('--workspace-tab-width'));
  assert.notEqual(widthAfterLeave,widthBeforeClose);
  await page.setViewportSize({width:1545,height:1252});await page.waitForTimeout(320);
  console.log(JSON.stringify({ errors, ...base, sidebarGeometry, iconAlignment, shadowGutters, hoverFade, leaveFade, bottomSpace, refreshMotion, stationaryHoverControls:hoverChecks.length, lightTheme, darkTheme, idleNavBackground, hoverNavBackground, period:pickedPeriod, custom, searchResults }, null, 2));
  await browser.close();
  if(errors.length || base.failedImages.length || base.theme !== 'dark' || lightTheme.theme !== 'light' || lightTheme.sunVisible !== true || lightTheme.pressed !== 'true' || darkTheme.theme !== 'dark' || darkTheme.moonVisible !== true || darkTheme.pressed !== 'false' || idleNavBackground === hoverNavBackground)process.exitCode = 1;
})();
