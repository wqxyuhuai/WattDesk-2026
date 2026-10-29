const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(new URL('/templates/page.html',previewURL).href);
  const initial=await page.evaluate(async()=>{
   const [{button,enhanceControl},{createIcon},{createAvatar},{createCard},{createSearchInput},{createGlassMaterial},{prepareControlStates},{applyTypeStyle},{createScrollFeedback}]=await Promise.all([
    import('/src/components/controls.js'),import('/src/components/icons.js'),import('/src/components/avatar.js'),import('/src/components/cards.js'),
    import('/src/components/search.js'),import('/src/components/glass-material.js'),import('/src/components/control-states.js'),import('/src/foundations/typography.js'),
    import('/src/components/scroll-feedback.js')
   ]);
   const root=document.querySelector('#page');root.style.cssText='display:flex;align-items:flex-start;gap:24px;padding:40px';
   document.documentElement.dataset.theme='dark';
   const control=button('Reusable control');control.id='reusable-control';control.style.width='190px';
   const text=document.createElement('span');text.textContent='Reusable control';control.append(createIcon('search'),text);applyTypeStyle(control,'14/14 medium');
   const card=createCard({variant:'chart',radius:30});card.id='reusable-card';card.style.cssText+=';width:180px;height:140px;background:var(--wd-bg-secondary)';
   const avatar=createAvatar('CW');avatar.id='reusable-avatar';
   const field=document.createElement('div');field.style.cssText='position:relative;width:200px;height:36px';
   const input=createSearchInput({label:'Reusable search',placeholder:'Search'});field.append(input);
   const equivalent=document.createElement('div');equivalent.id='equivalent';equivalent.textContent='Equivalent button';equivalent.style.width='120px';
   window.componentActivations=0;enhanceControl(equivalent,{label:'Equivalent button',onActivate(){window.componentActivations++}});equivalent.setAttribute('aria-disabled','true');
   const scrollHost=document.createElement('div');scrollHost.id='scroll-feedback-fixture';scrollHost.style.cssText='width:180px;height:130px';
   const scrollViewport=document.createElement('div');scrollViewport.style.cssText='height:100px;overflow:auto;scrollbar-width:none';
   const scrollContent=document.createElement('div');scrollContent.style.cssText='height:400px';
   scrollViewport.append(scrollContent);scrollHost.append(scrollViewport);
   root.append(control,card,avatar,field,equivalent,scrollHost);
   window.componentMaterial=createGlassMaterial({surfaces:[{host:control,radius:18}]});
   window.scrollFeedback=createScrollFeedback({host:scrollHost,viewport:scrollViewport,content:scrollContent,bottomInset:10});
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   let duplicateRejected=false;try{createGlassMaterial({surfaces:[{host:control,radius:18}]})}catch{duplicateRejected=true}
   await prepareControlStates(root);await document.fonts.ready;
   const cs=getComputedStyle(control),as=getComputedStyle(avatar);
   const hostRect=scrollHost.getBoundingClientRect();
   const track=scrollHost.querySelector('.wd-scroll-feedback').getBoundingClientRect();
   const thumb=scrollHost.querySelector('.wd-scroll-feedback__thumb').getBoundingClientRect();
   return {duplicateRejected,weight:cs.fontWeight,size:cs.fontSize,round:cs.cornerShape,avatar:[as.width,as.height,as.cornerShape],cardGlass:card.classList.contains('wd-glass'),cardRadius:getComputedStyle(card).borderRadius,scroll:[track.top-hostRect.top,hostRect.bottom-track.bottom,thumb.height]};
  });
  assert.equal(initial.duplicateRejected,true);assert.equal(initial.weight,'510');assert.equal(initial.size,'14px');assert.match(initial.round,/^(round|superellipse\(1\))$/);
  assert.deepEqual(initial.avatar.slice(0,2),['36px','36px']);assert.match(initial.avatar[2],/^(round|superellipse\(1\))$/);assert.equal(initial.cardGlass,false);assert.equal(initial.cardRadius,'30px');
  assert.equal(initial.scroll[0],0);assert.equal(initial.scroll[1],10);assert.ok(initial.scroll[2]>=24);
  const control=page.locator('#reusable-control'),before=await control.boundingBox();
  for(const theme of ['dark','light']){
   await page.mouse.move(0,0);
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.waitForTimeout(620);await control.hover();await page.waitForTimeout(320);
   const state=await control.evaluate(e=>({color:getComputedStyle(e.querySelector('.wd-control-label')).color,icon:getComputedStyle(e.querySelector('.target-icon-art')).color,glass:getComputedStyle(e.querySelector('.wd-glass-state')).opacity}));
   assert.equal(state.color,theme==='dark'?'rgb(255, 255, 255)':'rgb(0, 0, 0)');assert.equal(state.icon,state.color);assert.equal(state.glass,'1');
   const hovered=await control.evaluate(el=>{const style=getComputedStyle(el),matrix=new DOMMatrix(style.transform==='none'?'':style.transform);return {scale:matrix.a,offset:[el.offsetWidth,el.offsetHeight]}});
   assert.ok(hovered.scale>1,'Interactive glass must grow on hover');
   assert.deepEqual(hovered.offset,[Math.round(before.width),Math.round(before.height)],'Hover must not change the layout box');
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
