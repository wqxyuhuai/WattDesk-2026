const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(new URL('/templates/page.html',previewURL).href);
  const initial=await page.evaluate(async()=>{
   const [{button,enhanceControl,createStandardButton},{createIcon,createMaskedIcon},{createAvatar},{createCard},{createSearchInput},{createGlassMaterial},{prepareControlStates},{applyTypeStyle},{createScrollFeedback},{createTimeLabel},{createSegmentedControl},{createToggleSwitch},{createSelectControl},{createPopoverController}]=await Promise.all([
    import('/src/components/controls.js'),import('/src/components/icons.js'),import('/src/components/avatar.js'),import('/src/components/cards.js'),
    import('/src/components/search.js'),import('/src/components/glass-material.js'),import('/src/components/control-states.js'),import('/src/foundations/typography.js'),
    import('/src/components/scroll-feedback.js'),import('/src/components/time-label.js'),import('/src/components/segmented-control.js'),
    import('/src/components/toggle-switch.js'),import('/src/components/select-control.js'),import('/src/components/popover.js')
   ]);
   const root=document.querySelector('#page');root.style.cssText='display:flex;align-items:flex-start;gap:24px;padding:40px';
   document.documentElement.dataset.theme='dark';
   const control=button('Reusable control');control.id='reusable-control';control.style.width='190px';
   const text=document.createElement('span');text.textContent='Reusable control';control.append(createIcon('search'),text);applyTypeStyle(control,'14/14 medium');
   const primary=button('Publish ticket','wd-button wd-button--pill wd-button--primary');primary.id='reusable-primary';
   const primaryLabel=document.createElement('span');primaryLabel.className='wd-control-label';primaryLabel.textContent='Publish ticket';primary.append(primaryLabel);applyTypeStyle(primaryLabel,'Footnote/Medium');
   const primaryDisc=button('Send reply','wd-button wd-button--pill wd-button--primary wd-button--disc');primaryDisc.id='reusable-primary-disc';
   const primaryDiscIcon=createIcon('forward');primaryDiscIcon.classList.add('wd-control-icon');primaryDisc.append(primaryDiscIcon);
   const standard=createStandardButton({label:'Standard action',className:'reusable-standard'});standard.id='reusable-standard';
   const standardDisc=createStandardButton({label:'Standard icon action',iconOnly:true,className:'reusable-standard-disc',icon:createMaskedIcon('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>','reusable-mask-icon')});standardDisc.id='reusable-standard-disc';
   const timeLabel=createTimeLabel(new Date(2026,9,30,14,25),{now:new Date(2026,9,30,14,30).getTime(),className:'reusable-time',typeStyle:'Footnote/Regular'});
   const card=createCard({variant:'chart',radius:30});card.id='reusable-card';card.style.cssText+=';width:180px;height:140px;background:var(--wd-bg-secondary)';
   const avatar=createAvatar('CW');avatar.id='reusable-avatar';
   const compactAvatar=createAvatar('KD',{size:24});compactAvatar.id='reusable-avatar-compact';compactAvatar.style.cssText='position:absolute;left:-9999px;top:0';
   const smallAvatar=createAvatar('MH',{size:28});smallAvatar.id='reusable-avatar-small';smallAvatar.style.cssText='position:absolute;left:-9999px;top:0';
   const field=document.createElement('div');field.style.cssText='position:relative;width:200px;height:36px';
   const input=createSearchInput({label:'Reusable search',placeholder:'Search'});field.append(input);
   const equivalent=document.createElement('div');equivalent.id='equivalent';equivalent.textContent='Equivalent button';equivalent.style.width='120px';
   window.componentActivations=0;enhanceControl(equivalent,{label:'Equivalent button',onActivate(){window.componentActivations++}});equivalent.setAttribute('aria-disabled','true');
   const scrollHost=document.createElement('div');scrollHost.id='scroll-feedback-fixture';scrollHost.style.cssText='width:180px;height:130px';
   const scrollViewport=document.createElement('div');scrollViewport.id='scroll-feedback-viewport';scrollViewport.style.cssText='height:100px;overflow:auto;scrollbar-width:none';
   const scrollContent=document.createElement('div');scrollContent.id='scroll-feedback-content';scrollContent.style.cssText='height:400px';
   scrollViewport.append(scrollContent);scrollHost.append(scrollViewport);
   root.append(control,primary,primaryDisc,standard,standardDisc,timeLabel,card,avatar,compactAvatar,smallAvatar,field,equivalent,scrollHost);
   window.componentMaterial=createGlassMaterial({surfaces:[{host:control,radius:18},{host:primary,radius:18},{host:primaryDisc,radius:18},{host:standard,radius:18},{host:standardDisc,radius:18}]});
   window.segmentedControl=createSegmentedControl({
    items:[{id:'first',label:'First'},{id:'second',label:'Second'},{id:'third',label:'Third'}],
    value:'first',label:'Reusable segmented view',glass:window.componentMaterial
   });
   window.segmentedControl.element.id='reusable-segmented';
   const segmentedHost=document.createElement('div');segmentedHost.id='segmented-fixture';segmentedHost.style.cssText='position:fixed;left:40px;bottom:40px';document.body.append(segmentedHost);segmentedHost.append(window.segmentedControl.element);
   window.reusableToggle=createToggleSwitch({label:'Reusable switch',checked:false,glass:window.componentMaterial});
   window.reusableToggle.element.id='reusable-toggle';
   window.reusableToggle.element.style.marginLeft='12px';
   root.append(window.reusableToggle.element);
   const selectOverlays=document.createElement('div');selectOverlays.id='reusable-select-overlays';selectOverlays.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:200';
   const selectToast=document.createElement('div');selectToast.id='reusable-select-toast';selectToast.hidden=true;
   document.body.append(selectOverlays,selectToast);
   const selectPopover=createPopoverController({overlays:selectOverlays,toastElement:selectToast,motion:{openPanel(){},closePanel(panel){panel.remove()}},glass:null});
   const selectChanges=[];
   const reusableSelect=createSelectControl({
    label:'Reusable select',value:'beta',
    options:[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'},{value:'gamma',label:'Gamma'},{value:'disabled',label:'Disabled',disabled:true}],
    variant:'compact',className:'reusable-select-trigger',menuClassName:'reusable-select-popover',chooseLabel:'Choose reusable value',
    registerPanel:selectPopover.registerPanel,close:selectPopover.close,toggle:selectPopover.toggle,
    onChange:value=>selectChanges.push(value)
   });
   reusableSelect.element.id='reusable-select';
   const adaptiveSelect=createSelectControl({
    label:'Adaptive select',value:'long',options:[{value:'short',label:'Short'},{value:'long',label:'A longer adaptive value'}],
    variant:'adaptive',className:'reusable-adaptive-select',menuClassName:'reusable-adaptive-popover',chooseLabel:'Choose adaptive value',
    registerPanel:selectPopover.registerPanel,close:selectPopover.close,toggle:selectPopover.toggle
   });
   adaptiveSelect.element.id='reusable-adaptive-select';
   const selectHost=document.createElement('div');selectHost.id='reusable-select-host';selectHost.style.cssText='position:fixed;left:760px;top:48px';
   const adaptiveSelectHost=document.createElement('div');adaptiveSelectHost.id='reusable-adaptive-select-host';adaptiveSelectHost.style.cssText='position:fixed;left:-9999px;top:0';
   document.body.append(selectHost,adaptiveSelectHost);selectHost.append(reusableSelect.element);adaptiveSelectHost.append(adaptiveSelect.element);
   window.__selectFixture={control:reusableSelect,adaptive:adaptiveSelect,controller:selectPopover,changes:selectChanges};
   window.scrollFeedback=createScrollFeedback({host:scrollHost,viewport:scrollViewport,content:scrollContent,bottomInset:10,preserveBottomOnShrink:true});
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   let duplicateRejected=false;try{createGlassMaterial({surfaces:[{host:control,radius:18}]})}catch{duplicateRejected=true}
   await prepareControlStates(root);await document.fonts.ready;
   const cs=getComputedStyle(control),as=getComputedStyle(avatar);
   const hostRect=scrollHost.getBoundingClientRect();
   const track=scrollHost.querySelector('.wd-scroll-feedback').getBoundingClientRect();
   const thumb=scrollHost.querySelector('.wd-scroll-feedback__thumb').getBoundingClientRect();
   const avatarLabel=avatar.querySelector('.wd-avatar-label');
   const profile=node=>{const label=node.querySelector('.wd-avatar-label'),style=getComputedStyle(label);return {size:node.dataset.avatarSize,font:style.fontSize,lineHeight:style.lineHeight,transform:style.transform}};
   const segmentedIndicatorNode=window.segmentedControl.element.querySelector('.wd-segmented-control-indicator');
   const segmentedRect=window.segmentedControl.element.getBoundingClientRect(),segmentedIndicator=segmentedIndicatorNode.getBoundingClientRect(),segmentedSelected=window.segmentedControl.element.querySelector('.is-selected'),segmentedSelectedRect=segmentedSelected.getBoundingClientRect(),segmentedLabelRect=segmentedSelected.querySelector('.wd-control-label').getBoundingClientRect();
   const toggleThumb=window.reusableToggle.element.querySelector('.wd-switch-thumb');
   const toggleFill=window.reusableToggle.element.querySelector('.wd-glass-fill');
   const toggleThumbStyle=getComputedStyle(toggleThumb),toggleFillStyle=getComputedStyle(toggleFill);
   const adaptiveStyle=getComputedStyle(adaptiveSelect.element);
   return {duplicateRejected,weight:cs.fontWeight,size:cs.fontSize,round:cs.cornerShape,avatar:[as.width,as.height,as.cornerShape],avatarLabel:{text:avatarLabel?.textContent,transform:avatarLabel?getComputedStyle(avatarLabel).transform:''},avatarProfiles:{regular:profile(avatar),compact:profile(compactAvatar),small:profile(smallAvatar)},standard:{label:standard.querySelector('.wd-control-label')?.textContent,disc:standardDisc.classList.contains('wd-button--disc'),icon:standardDisc.querySelector('.reusable-mask-icon')?.getAttribute('aria-hidden')},time:{tag:timeLabel.tagName,text:timeLabel.textContent,dateTimeValid:/^\d{4}-\d{2}-\d{2}T/.test(timeLabel.dateTime),title:timeLabel.title,type:getComputedStyle(timeLabel).fontSize},cardGlass:card.classList.contains('wd-glass'),cardRadius:getComputedStyle(card).borderRadius,select:{variant:reusableSelect.element.classList.contains('wd-select--compact'),value:reusableSelect.getValue(),ariaLabel:reusableSelect.element.getAttribute('aria-label'),expanded:reusableSelect.element.getAttribute('aria-expanded'),options:reusableSelect.getOptions().map(option=>option.value)},adaptiveSelect:{variant:adaptiveSelect.element.classList.contains('wd-select--adaptive'),height:adaptiveStyle.height,radius:adaptiveStyle.borderRadius,padding:adaptiveStyle.padding,gap:adaptiveStyle.gap,ariaLabel:adaptiveSelect.element.getAttribute('aria-label'),expanded:adaptiveSelect.element.getAttribute('aria-expanded')},toggle:{checked:window.reusableToggle.element.getAttribute('aria-checked'),thumbProperty:toggleThumbStyle.transitionProperty,thumbDuration:toggleThumbStyle.transitionDuration,thumbEasing:toggleThumbStyle.transitionTimingFunction,fillProperty:toggleFillStyle.transitionProperty,fillDuration:toggleFillStyle.transitionDuration,fillEasing:toggleFillStyle.transitionTimingFunction,background:toggleFillStyle.backgroundColor,transform:toggleThumbStyle.transform},scroll:[track.top-hostRect.top,hostRect.bottom-track.bottom,thumb.height],segmented:{height:segmentedRect.height,maxWidth:getComputedStyle(window.segmentedControl.element).maxWidth,top:segmentedIndicator.top-segmentedRect.top,bottom:segmentedRect.bottom-segmentedIndicator.bottom,labelOffset:(segmentedLabelRect.top+segmentedLabelRect.height/2)-(segmentedSelectedRect.top+segmentedSelectedRect.height/2),labelTransform:getComputedStyle(segmentedSelected.querySelector('.wd-control-label')).transform,indicatorBackground:getComputedStyle(segmentedIndicatorNode).backgroundColor}};
  });
  assert.equal(initial.duplicateRejected,true);assert.equal(initial.weight,'510');assert.equal(initial.size,'14px');assert.match(initial.round,/^(round|superellipse\(1\))$/);
  assert.deepEqual(initial.avatar.slice(0,2),['36px','36px']);assert.match(initial.avatar[2],/^(round|superellipse\(1\))$/);
  assert.deepEqual(initial.avatarLabel,{text:'CW',transform:'matrix(1, 0, 0, 1, 0, 0.5)'});
  assert.deepEqual(initial.avatarProfiles,{
    regular:{size:'regular',font:'14px',lineHeight:'normal',transform:'matrix(1, 0, 0, 1, 0, 0.5)'},
    compact:{size:'compact',font:'9px',lineHeight:'10px',transform:'matrix(1, 0, 0, 1, 0, 0.5)'},
    small:{size:'small',font:'11px',lineHeight:'13px',transform:'matrix(1, 0, 0, 1, 0, 0.5)'}
  });
  assert.deepEqual(initial.standard,{label:'Standard action',disc:true,icon:'true'});
  assert.deepEqual(initial.time,{tag:'TIME',text:'5 minutes ago',dateTimeValid:true,title:'2026/10/30 14:25',type:'13px'});
  assert.deepEqual(initial.select,{variant:true,value:'beta',ariaLabel:'Reusable select: Beta',expanded:'false',options:['alpha','beta','gamma','disabled']});
  assert.deepEqual(
    {variant:initial.adaptiveSelect.variant,height:initial.adaptiveSelect.height,radius:initial.adaptiveSelect.radius,gap:initial.adaptiveSelect.gap},
    {variant:true,height:'36px',radius:'18px',gap:'6px'}
  );
  assert.equal(initial.adaptiveSelect.ariaLabel,'Adaptive select: A longer adaptive value');
  assert.equal(initial.adaptiveSelect.expanded,'false');
  assert.match(initial.adaptiveSelect.padding,/12px/);
  assert.equal(initial.cardGlass,false);assert.equal(initial.cardRadius,'30px');
  assert.deepEqual(
    {checked:initial.toggle.checked,thumbProperty:initial.toggle.thumbProperty,fillProperty:initial.toggle.fillProperty,fillDuration:initial.toggle.fillDuration,fillEasing:initial.toggle.fillEasing,transform:initial.toggle.transform},
    {checked:'false',thumbProperty:'none',fillProperty:'box-shadow',fillDuration:'0.6s',fillEasing:'cubic-bezier(0.34, 0.16, 0.18, 1)',transform:'matrix(1, 0, 0, 1, 0, 0)'},
    'the shared switch reserves thumb and track-colour motion for WAAPI and keeps the outline on the thumb rhythm'
  );
  assert.equal(initial.scroll[0],0);assert.equal(initial.scroll[1],10);assert.ok(initial.scroll[2]>=24);
  const scrollInput=await page.evaluate(async()=>{
   const viewport=document.querySelector('#scroll-feedback-fixture>div');
   const track=document.querySelector('#scroll-feedback-fixture .wd-scroll-feedback');
   const thumb=track.querySelector('.wd-scroll-feedback__thumb');
   viewport.scrollTop=0;
   viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:-120,bubbles:true,cancelable:true}));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const reverse=new WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true});
   viewport.dispatchEvent(reverse);
   viewport.scrollTop=30;
   viewport.dispatchEvent(new Event('scroll'));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const trackBox=track.getBoundingClientRect(),thumbBox=thumb.getBoundingClientRect();
   const maxScroll=viewport.scrollHeight-viewport.clientHeight;
   const maxTop=trackBox.height-thumbBox.height;
   const expectedTop=viewport.scrollTop/maxScroll*maxTop;
   viewport.scrollTop=10;
   const lineEvent=new WheelEvent('wheel',{deltaY:3,deltaMode:1,bubbles:true,cancelable:true});
   track.dispatchEvent(lineEvent);
   return {
    reversePrevented:reverse.defaultPrevented,
    pulling:document.querySelector('.wd-scroll-feedback-content').classList.contains('is-pulling'),
    thumbDelta:Math.abs((thumbBox.top-trackBox.top)-expectedTop),
    lineTravel:viewport.scrollTop-10,
    linePrevented:lineEvent.defaultPrevented
   };
  });
  assert.equal(scrollInput.reversePrevented,false,'reversing scroll direction releases the shared edge pull');
  assert.equal(scrollInput.pulling,false,'reversing scroll direction clears the elastic displacement');
  assert.ok(scrollInput.thumbDelta<=1,'the shared scrollbar tracks the new position immediately after reversal');
  assert.ok(scrollInput.lineTravel>=45,'line-mode wheel deltas use a full line-height travel distance');
  assert.equal(scrollInput.linePrevented,true,'wheel scrolling over the shared rail stays inside its viewport');
  assert.equal(initial.segmented.height,36);
  assert.equal(initial.segmented.maxWidth,'100%');
  assert.ok(Math.abs(initial.segmented.top-4)<1&&Math.abs(initial.segmented.bottom-4)<1);
  assert.ok(Math.abs(initial.segmented.labelOffset)<0.1,'segmented labels use the geometric centre instead of an upward optical offset');
  assert.equal(initial.segmented.labelTransform,'matrix(1, 0, 0, 1, 0, 0)');
  assert.equal(initial.segmented.indicatorBackground,'rgba(120, 120, 128, 0.56)','the dark selected capsule uses the strengthened neutral fill');
  const sharedShrinkGuard=await page.evaluate(async()=>{
   const viewport=document.querySelector('#scroll-feedback-viewport');
   const content=document.querySelector('#scroll-feedback-content');
   viewport.scrollTop=viewport.scrollHeight-viewport.clientHeight;
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const startTop=viewport.scrollTop;
   const samples=[];
   const started=performance.now();
   content.style.height='300px';
   await new Promise(resolve=>{
    const tick=()=>{
     samples.push({
      top:viewport.scrollTop,
      spacer:document.querySelector('.wd-scroll-shrink-spacer')?.getBoundingClientRect().height||0
     });
     if(performance.now()-started<700)requestAnimationFrame(tick);
     else resolve();
    };
    requestAnimationFrame(tick);
   });
   const shrinkFinal=viewport.scrollTop;
   const jumps=samples.slice(1).map((sample,index)=>Math.abs(sample.top-samples[index].top));
   const growthStart=viewport.scrollTop;
   content.style.height='400px';
   await new Promise(resolve=>setTimeout(resolve,80));
   const growth={top:viewport.scrollTop,spacer:document.querySelector('.wd-scroll-shrink-spacer')?.getBoundingClientRect().height||0};
   viewport.scrollTop=0;
   content.style.height='400px';
   return {
    startTop,
    shrinkFinal,
    maxJump:Math.max(0,...jumps),
    intermediate:new Set(samples.map(sample=>Math.round(sample.top))).size,
    spacerFrames:samples.filter(sample=>sample.spacer>0).length,
    growthStart,
    growth
   };
  });
  assert.ok(sharedShrinkGuard.shrinkFinal<sharedShrinkGuard.startTop-50,'the shared guard follows a shorter final scroll range');
  assert.ok(sharedShrinkGuard.maxJump<=28,'the shared guard avoids a single-frame scroll jump');
  assert.ok(sharedShrinkGuard.intermediate>=3,'the shared guard exposes intermediate scroll positions');
  assert.ok(sharedShrinkGuard.spacerFrames>0,'the shared guard uses its temporary bottom spacer');
  assert.equal(sharedShrinkGuard.growth.top,sharedShrinkGuard.growthStart,'content growth keeps the current scroll position');
  assert.equal(sharedShrinkGuard.growth.spacer,0,'content growth never creates a shrink spacer');
  const segmentedThemeFills=await page.evaluate(()=>{
   const indicator=document.querySelector('#reusable-segmented .wd-segmented-control-indicator');
   const read=()=>getComputedStyle(indicator).backgroundColor;
   document.documentElement.dataset.theme='light';
   const light=read();
   document.documentElement.dataset.theme='dark';
   return {dark:read(),light};
  });
  assert.deepEqual(segmentedThemeFills,{dark:'rgba(120, 120, 128, 0.56)',light:'rgba(120, 120, 120, 0.2)'},'the segmented capsule strengthens only in dark mode');
  const reusableSelect=page.locator('#reusable-select');
  await reusableSelect.focus();
  await page.keyboard.press('ArrowDown');
  const selectPopover=page.locator('.reusable-select-popover');
  await selectPopover.waitFor({state:'visible'});
  assert.equal(await reusableSelect.getAttribute('aria-expanded'),'true');
  await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Beta','opening with ArrowDown focuses the selected option');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Gamma','ArrowDown moves to the next enabled option');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Alpha','Home focuses the first enabled option');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Gamma','End skips the disabled option and focuses the last enabled option');
  await page.keyboard.type('g');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Gamma','typeahead jumps to the matching enabled option');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.activeElement?.id==='reusable-select');
  assert.equal(await reusableSelect.getAttribute('data-value'),'gamma','Enter selects the focused option');
  assert.equal(await reusableSelect.getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'reusable-select','selection returns focus to the trigger');
  const dynamicSelect=await page.evaluate(()=>{
   const fixture=window.__selectFixture;
   fixture.control.setOptions([
    {value:'delta',label:'Delta'},
    {value:'epsilon',label:'Epsilon'},
    {value:'blocked',label:'Blocked',disabled:true}
   ],{value:'delta',notify:true});
   fixture.control.updateOption('delta',{label:'Delta updated'});
   fixture.control.updateOption('delta',{value:'epsilon-new',label:'Epsilon updated'},{notify:true});
   return {
    value:fixture.control.getValue(),
    label:fixture.control.element.textContent.trim(),
    options:fixture.control.getOptions(),
    changes:fixture.changes
   };
  });
  assert.deepEqual(dynamicSelect,{
   value:'epsilon-new',
   label:'Epsilon updated',
   options:[
    {value:'epsilon-new',label:'Epsilon updated',disabled:false},
    {value:'epsilon',label:'Epsilon',disabled:false},
    {value:'blocked',label:'Blocked',disabled:true}
   ],
   changes:['gamma','delta','epsilon-new']
  });
  const control=page.locator('#reusable-control'),before=await control.boundingBox();
  const primary=page.locator('#reusable-primary');
  const primaryDisc=page.locator('#reusable-primary-disc');
  for(const theme of ['dark','light']){
   await page.mouse.move(0,0);
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.waitForTimeout(620);await control.hover();await page.waitForTimeout(320);
   const state=await control.evaluate(e=>({color:getComputedStyle(e.querySelector('.wd-control-label')).color,icon:getComputedStyle(e.querySelector('.target-icon-art')).color,glass:getComputedStyle(e.querySelector('.wd-glass-state')).opacity}));
   assert.equal(state.color,theme==='dark'?'rgb(255, 255, 255)':'rgb(0, 0, 0)');assert.equal(state.icon,state.color);assert.equal(state.glass,'1');
   const hovered=await control.evaluate(el=>{const style=getComputedStyle(el),matrix=new DOMMatrix(style.transform==='none'?'':style.transform);return {scale:matrix.a,offset:[el.offsetWidth,el.offsetHeight]}});
   assert.ok(hovered.scale>1,'Interactive glass must grow on hover');
   assert.deepEqual(hovered.offset,[Math.round(before.width),Math.round(before.height)],'Hover must not change the layout box');
   await primary.hover();
   await page.waitForTimeout(320);
   const primaryState=await primary.evaluate(e=>({
     host:getComputedStyle(e).color,
     label:getComputedStyle(e.querySelector('.wd-control-label')).color
   }));
   assert.equal(primaryState.host,'rgb(255, 255, 255)',`Primary host ink stays white in ${theme}`);
   assert.equal(primaryState.label,'rgb(255, 255, 255)',`Primary label ink stays white in ${theme}`);
   await primaryDisc.hover();
   await page.waitForTimeout(320);
   const primaryIcon=await primaryDisc.locator('.wd-control-icon').evaluate(e=>({
     scale:new DOMMatrixReadOnly(getComputedStyle(e).transform).a,
     offset:e.offsetWidth
   }));
   assert.ok(primaryIcon.scale>1.05,'Primary icon scales with the shared disc hover');
   assert.equal(primaryIcon.offset,18,'Icon hover must not change its layout box');
   await page.screenshot({path:`tests/output/components-${theme}.png`});
  }
  const reusableToggle=page.getByRole('switch',{name:'Reusable switch'});
  const toggleOff=await reusableToggle.evaluate(node=>({
    background:getComputedStyle(node.querySelector('.wd-glass-fill')).backgroundColor,
    transform:getComputedStyle(node.querySelector('.wd-switch-thumb')).transform,
    box:[node.offsetWidth,node.offsetHeight]
  }));
  await reusableToggle.click();
  await page.waitForTimeout(130);
  const toggleMidOn=await reusableToggle.evaluate(node=>({
    checked:node.getAttribute('aria-checked'),
    background:getComputedStyle(node.querySelector('.wd-glass-fill')).backgroundColor,
    translate:new DOMMatrixReadOnly(getComputedStyle(node.querySelector('.wd-switch-thumb')).transform).m41,
    trackAnimation:node.querySelector('.wd-glass-fill').getAnimations()
      .find(animation=>animation.effect.getKeyframes().some(frame=>Object.hasOwn(frame,'backgroundColor')))
      ? (()=>{
        const animation=node.querySelector('.wd-glass-fill').getAnimations()
          .find(item=>item.effect.getKeyframes().some(frame=>Object.hasOwn(frame,'backgroundColor')));
        return {duration:animation.effect.getTiming().duration,easing:animation.effect.getTiming().easing};
      })()
      : null,
    animation:node.querySelector('.wd-switch-thumb').getAnimations()[0] ? {
      duration:node.querySelector('.wd-switch-thumb').getAnimations()[0].effect.getTiming().duration,
      easing:node.querySelector('.wd-switch-thumb').getAnimations()[0].effect.getTiming().easing
    } : null,
    box:[node.offsetWidth,node.offsetHeight]
  }));
  assert.equal(toggleMidOn.checked,'true','the shared switch updates its semantic state immediately');
  assert.ok(toggleMidOn.translate>0&&toggleMidOn.translate<18,'the thumb is visibly travelling through the track');
  assert.notEqual(toggleMidOn.background,toggleOff.background,'the glass track colour is already interpolating');
  assert.deepEqual(toggleMidOn.box,toggleOff.box,'the animated switch keeps its layout box');
  assert.deepEqual(toggleMidOn.animation,{duration:600,easing:'cubic-bezier(0.34, 0.16, 0.18, 1)'},'the longer switch flight uses the dedicated soft spring rhythm');
  assert.deepEqual(toggleMidOn.trackAnimation,{duration:480,easing:'cubic-bezier(0.4, 0, 0.2, 1)'},'the track colour uses its dedicated easing');
  await page.waitForFunction(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.wd-switch-thumb')).transform).m41===18);
  const toggleOn=await reusableToggle.evaluate(node=>({
    background:getComputedStyle(node.querySelector('.wd-glass-fill')).backgroundColor,
    translate:new DOMMatrixReadOnly(getComputedStyle(node.querySelector('.wd-switch-thumb')).transform).m41
  }));
  assert.equal(toggleOn.translate,18,'the thumb settles on the ON position');
  assert.notEqual(toggleOn.background,toggleOff.background,'ON resolves to the blue glass track');
  assert.notEqual(toggleMidOn.background,toggleOn.background,'the track does not jump directly to its destination colour');
  await reusableToggle.click();
  await page.waitForFunction(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.wd-switch-thumb')).transform).m41<17.5);
  const reversingFrom=await reusableToggle.evaluate(node=>new DOMMatrixReadOnly(getComputedStyle(node.querySelector('.wd-switch-thumb')).transform).m41);
  await reusableToggle.click();
  await page.waitForFunction(from=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.wd-switch-thumb')).transform).m41>from+.5,reversingFrom);
  assert.equal(await reusableToggle.getAttribute('aria-checked'),'true','the repeated toggle updates its final semantic state immediately');
  await page.waitForFunction(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.wd-switch-thumb')).transform).m41===18);
  assert.equal(await reusableToggle.evaluate(node=>new DOMMatrixReadOnly(getComputedStyle(node.querySelector('.wd-switch-thumb')).transform).m41),18,'a repeated toggle reverses from the current rendered position');
  const equivalent=page.getByRole('button',{name:'Equivalent button'});
  await equivalent.evaluate(e=>e.click());await equivalent.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>componentActivations),0);
  await equivalent.evaluate(e=>e.setAttribute('aria-disabled','false'));await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>componentActivations),1);
  await page.getByRole('textbox',{name:'Reusable search'}).fill('WattDesk');assert.equal(await page.getByRole('textbox',{name:'Reusable search'}).inputValue(),'WattDesk');
  const segmented=page.getByRole('tablist',{name:'Reusable segmented view'});
  await segmented.getByRole('tab',{name:'Second'}).click();
  const segmentedAnimation=await page.locator('#reusable-segmented .wd-segmented-control-indicator').evaluate(indicator=>indicator.getAnimations().some(animation=>
    animation.effect?.getComputedTiming()?.duration===600&&animation.effect?.getComputedTiming()?.easing==='cubic-bezier(0.34, 0.16, 0.18, 1)'
  ));
  assert.equal(segmentedAnimation,true);
  await page.waitForTimeout(360);
  assert.equal(await segmented.getByRole('tab',{name:'Second'}).getAttribute('aria-selected'),'true');
  await segmented.getByRole('tab',{name:'Second'}).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await segmented.getByRole('tab',{name:'Third'}).getAttribute('aria-selected'),'true');
  await page.waitForTimeout(50);
  await segmented.getByRole('tab',{name:'First'}).click();
  await page.waitForTimeout(360);
  assert.equal(await segmented.getByRole('tab',{name:'First'}).getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#reusable-segmented .wd-segmented-control-indicator').evaluate(indicator=>getComputedStyle(indicator).width !== '0px'),true);
  await page.waitForTimeout(700);
  const rapidSegment=await page.evaluate(async()=>{
    const control=document.querySelector('#reusable-segmented');
    const indicator=control.querySelector('.wd-segmented-control-indicator');
    const option=value=>control.querySelector(`[data-value="${value}"]`);
    const readLeft=()=>indicator.getBoundingClientRect().left;
    option('second').click();
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const animation=indicator.getAnimations().find(item=>item.effect?.getTiming().duration===600);
    animation.pause();
    animation.currentTime=250;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const before=readLeft();
    option('third').click();
    const after=readLeft();
    indicator.getAnimations()[0]?.play();
    return {before,after,selected:option('third').getAttribute('aria-selected')};
  });
  assert.ok(Math.abs(rapidSegment.after-rapidSegment.before)<=3,`a repeated segmented choice starts from the current rendered capsule position (${rapidSegment.before} -> ${rapidSegment.after})`);
  assert.equal(rapidSegment.selected,'true');
  await page.emulateMedia({reducedMotion:'reduce'});
  const reducedToggle=await page.evaluate(()=>({
    thumb:getComputedStyle(document.querySelector('.wd-switch-thumb')).transitionDuration,
    fill:getComputedStyle(document.querySelector('.wd-switch>.wd-glass-material>.wd-glass-fill')).transitionDuration
  }));
  assert.ok(Number.parseFloat(reducedToggle.thumb)<=.001,'reduced motion removes the toggle thumb travel');
  assert.ok(reducedToggle.fill.split(', ').every(value=>value==='0.001s'),'reduced motion removes the toggle track interpolation');
  await reusableToggle.click();
  assert.equal(await page.locator('.wd-switch-thumb').evaluate(node=>node.getAnimations().length),0,'reduced motion skips the WAAPI thumb flight');
  await page.emulateMedia({reducedMotion:null});
  await page.evaluate(()=>{
   const fixture=window.__selectFixture;
   fixture.control.destroy();
   fixture.controller.destroy();
   document.querySelector('#reusable-select-host')?.remove();
   document.querySelector('#reusable-select-overlays')?.remove();
   document.querySelector('#reusable-select-toast')?.remove();
   reusableToggle.destroy();segmentedControl.destroy();componentMaterial.destroy();scrollFeedback.destroy();
  });assert.equal(await page.locator('.wd-glass-material').count(),0);assert.equal(await page.locator('.wd-scroll-feedback').count(),0);assert.equal(await page.locator('.wd-select-popover').count(),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({standaloneComponents:true,sharedType:true,sharedGlass:true,sharedScrollFeedback:true,themeHover:true,stationary:true,disabledKeyboard:true,dispose:true,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
