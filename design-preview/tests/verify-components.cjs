const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(new URL('/templates/page.html',previewURL).href);
  const initial=await page.evaluate(async()=>{
   const [{button,enhanceControl,createStandardButton},{createIcon,createMaskedIcon},{createAvatar},{createCard},{createSearchInput},{createGlassMaterial},{prepareControlStates},{applyTypeStyle},{createScrollFeedback},{createTimeLabel}]=await Promise.all([
    import('/src/components/controls.js'),import('/src/components/icons.js'),import('/src/components/avatar.js'),import('/src/components/cards.js'),
    import('/src/components/search.js'),import('/src/components/glass-material.js'),import('/src/components/control-states.js'),import('/src/foundations/typography.js'),
    import('/src/components/scroll-feedback.js'),import('/src/components/time-label.js')
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
   const scrollViewport=document.createElement('div');scrollViewport.style.cssText='height:100px;overflow:auto;scrollbar-width:none';
   const scrollContent=document.createElement('div');scrollContent.style.cssText='height:400px';
   scrollViewport.append(scrollContent);scrollHost.append(scrollViewport);
   root.append(control,primary,primaryDisc,standard,standardDisc,timeLabel,card,avatar,compactAvatar,smallAvatar,field,equivalent,scrollHost);
   window.componentMaterial=createGlassMaterial({surfaces:[{host:control,radius:18},{host:primary,radius:18},{host:primaryDisc,radius:18},{host:standard,radius:18},{host:standardDisc,radius:18}]});
   window.scrollFeedback=createScrollFeedback({host:scrollHost,viewport:scrollViewport,content:scrollContent,bottomInset:10});
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   let duplicateRejected=false;try{createGlassMaterial({surfaces:[{host:control,radius:18}]})}catch{duplicateRejected=true}
   await prepareControlStates(root);await document.fonts.ready;
   const cs=getComputedStyle(control),as=getComputedStyle(avatar);
   const hostRect=scrollHost.getBoundingClientRect();
   const track=scrollHost.querySelector('.wd-scroll-feedback').getBoundingClientRect();
   const thumb=scrollHost.querySelector('.wd-scroll-feedback__thumb').getBoundingClientRect();
   const avatarLabel=avatar.querySelector('.wd-avatar-label');
   const profile=node=>{const label=node.querySelector('.wd-avatar-label'),style=getComputedStyle(label);return {size:node.dataset.avatarSize,font:style.fontSize,lineHeight:style.lineHeight,transform:style.transform}};
   return {duplicateRejected,weight:cs.fontWeight,size:cs.fontSize,round:cs.cornerShape,avatar:[as.width,as.height,as.cornerShape],avatarLabel:{text:avatarLabel?.textContent,transform:avatarLabel?getComputedStyle(avatarLabel).transform:''},avatarProfiles:{regular:profile(avatar),compact:profile(compactAvatar),small:profile(smallAvatar)},standard:{label:standard.querySelector('.wd-control-label')?.textContent,disc:standardDisc.classList.contains('wd-button--disc'),icon:standardDisc.querySelector('.reusable-mask-icon')?.getAttribute('aria-hidden')},time:{tag:timeLabel.tagName,text:timeLabel.textContent,dateTimeValid:/^\d{4}-\d{2}-\d{2}T/.test(timeLabel.dateTime),title:timeLabel.title,type:getComputedStyle(timeLabel).fontSize},cardGlass:card.classList.contains('wd-glass'),cardRadius:getComputedStyle(card).borderRadius,scroll:[track.top-hostRect.top,hostRect.bottom-track.bottom,thumb.height]};
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
  assert.equal(initial.cardGlass,false);assert.equal(initial.cardRadius,'30px');
  assert.equal(initial.scroll[0],0);assert.equal(initial.scroll[1],10);assert.ok(initial.scroll[2]>=24);
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
  const equivalent=page.getByRole('button',{name:'Equivalent button'});
  await equivalent.evaluate(e=>e.click());await equivalent.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>componentActivations),0);
  await equivalent.evaluate(e=>e.setAttribute('aria-disabled','false'));await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>componentActivations),1);
  await page.getByRole('textbox',{name:'Reusable search'}).fill('WattDesk');assert.equal(await page.getByRole('textbox',{name:'Reusable search'}).inputValue(),'WattDesk');
  await page.evaluate(()=>{componentMaterial.destroy();scrollFeedback.destroy()});assert.equal(await page.locator('.wd-glass-material').count(),0);assert.equal(await page.locator('.wd-scroll-feedback').count(),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({standaloneComponents:true,sharedType:true,sharedGlass:true,sharedScrollFeedback:true,themeHover:true,stationary:true,disabledKeyboard:true,dispose:true,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
