const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

const origin=new URL(previewURL).origin;
const png=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zf9sAAAAASUVORK5CYII=',
  'base64'
);

(async()=>{
  const browser=await chromium.launch({...launchOptions,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
    page.on('dialog',dialog=>dialog.accept());

    const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();

    // Header and card workspace reuse the shared page header while remaining
    // visibly distinct from the Plants table.
    const header=page.locator('.service-header');
    assert.equal(await header.evaluate(element=>element.classList.contains('wd-page-header')),true);
    assert.equal(await page.locator('.wd-page-title').count(),0);
    assert.equal((await page.locator('.service-header .wd-page-breadcrumb-current').textContent()).trim(),'Service ticket');
    assert.equal(await page.locator('.service-card').count(),8);
    assert.equal(await page.locator('.service-card[data-status="ongoing"]').count(),5);
    assert.equal(await page.locator('.service-card[data-status="closed"]').count(),3);
    assert.equal(await page.locator('.service-card-plant,.service-card-extra,.service-card-replies').count(),0);
    const initialTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
    if(initialTheme!=="light"){
      await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
      await page.waitForTimeout(700);
    }
    const boardViewport=page.locator('.service-board-viewport');
    const boardBox=await boardViewport.boundingBox();
    await boardViewport.evaluate(element=>{element.scrollTop=0});
    await page.mouse.move(boardBox.x+8,boardBox.y+8);
    await page.mouse.wheel(0,-720);
    await page.waitForTimeout(250);
    const boardPullSurfaces=await page.locator('.service-board > .wd-scroll-feedback__pull').evaluateAll(surfaces=>surfaces.map(surface=>({
      background:getComputedStyle(surface).backgroundColor,
      height:Number.parseFloat(surface.style.height)||0,
      opacity:Number.parseFloat(getComputedStyle(surface).opacity)
    })));
    assert.equal(boardPullSurfaces.length,2);
    assert.ok(boardPullSurfaces.every(surface=>surface.background==='rgba(0, 0, 0, 0)'),'Service list pull surfaces must inherit the shared transparent default');
    assert.ok(
      boardPullSurfaces[0].height>4&&boardPullSurfaces[0].opacity>0,
      `the Service list top pull must remain active: ${JSON.stringify(boardPullSurfaces)}`
    );
    await page.screenshot({path:'tests/output/service-list-top-pull-transparent-light.png'});
    await page.waitForTimeout(900);
    const lightPixelCard=page.locator('.service-card').first();
    await lightPixelCard.hover({position:{x:180,y:80}});
    await page.waitForTimeout(100);
    const lightNumberSheen=await lightPixelCard.locator('.service-card-number').evaluate(number=>({
      background:getComputedStyle(number,'::after').backgroundImage,
      opacity:Number.parseFloat(getComputedStyle(number,'::after').opacity)
    }));
    assert.match(lightNumberSheen.background,/255, 255, 255/,'the light hover sweep must be white');
    assert.ok(lightNumberSheen.opacity>0,'the light hover sweep must be visibly active');
    const lightCardBox=await lightPixelCard.boundingBox();
    await page.screenshot({
      path:'tests/output/service-card-sheen-white-light.png',
      clip:{x:lightCardBox.x-12,y:lightCardBox.y-12,width:lightCardBox.width+24,height:lightCardBox.height+24}
    });
    await page.waitForTimeout(550);
    const lightPixelHover=await lightPixelCard.evaluate(card=>{
      const canvas=card.querySelector('.service-pixel-canvas');
      const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      let count=0,totalR=0,totalG=0,totalB=0;
      let bottomCount=0,bottomAlpha=0,bottomMaxAlpha=0;
      let inkCount=0,inkR=0,inkG=0,inkB=0;
      for(let index=0;index<data.length;index+=4){
        const alpha=data[index+3];
        if(alpha===0)continue;
        count+=1;
        totalR+=data[index];
        totalG+=data[index+1];
        totalB+=data[index+2];
        if(alpha>=32){
          inkCount+=1;
          inkR+=data[index];
          inkG+=data[index+1];
          inkB+=data[index+2];
        }
        const pixel=index/4;
        if(Math.floor(pixel/canvas.width)>=canvas.height/2){
          bottomCount+=1;
          bottomAlpha+=alpha;
          bottomMaxAlpha=Math.max(bottomMaxAlpha,alpha);
        }
      }
      const glare=getComputedStyle(card.querySelector('.service-card-glare'));
      return {
        count,
        average:[totalR/Math.max(1,count),totalG/Math.max(1,count),totalB/Math.max(1,count)],
        ink:{count:inkCount,average:[inkR/Math.max(1,inkCount),inkG/Math.max(1,inkCount),inkB/Math.max(1,inkCount)]},
        bottom:{count:bottomCount,averageAlpha:bottomAlpha/Math.max(1,bottomCount),maxAlpha:bottomMaxAlpha},
        glareBackground:glare.backgroundImage,
        glareBlend:glare.mixBlendMode
      };
    });
    assert.ok(lightPixelHover.count>0,'the light Service card must paint hover pixels');
    assert.ok(lightPixelHover.ink.count>100,'the light hover pixel field must have a measurable dark ink layer');
    assert.ok(lightPixelHover.ink.average.every(channel=>channel<140),`light hover pixels must use the shared dark ink: ${JSON.stringify(lightPixelHover.ink)}`);
    assert.ok(lightPixelHover.bottom.maxAlpha>=60,`the light card bottom must retain visible dark pixels: ${JSON.stringify(lightPixelHover.bottom)}`);
    assert.ok(lightPixelHover.bottom.averageAlpha>=4,`the light card bottom pixel field must not fade away: ${JSON.stringify(lightPixelHover.bottom)}`);
    assert.match(lightPixelHover.glareBackground,/255, 255, 255/);
    assert.equal(lightPixelHover.glareBlend,'screen');
    await page.screenshot({path:'tests/output/service-card-hover-white-light.png'});
    await page.mouse.move(20,600);
    await page.waitForTimeout(900);
    if(initialTheme!=="light"){
      await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
      await page.waitForTimeout(700);
    }
    const pageAction=page.locator('.service-new-ticket');
    const idlePageAction=await pageAction.evaluate(element=>{
      const box=element.getBoundingClientRect();
      const icon=element.querySelector('.service-icon');
      const label=element.querySelector('.wd-control-label');
      const style=getComputedStyle(element);
      return {
        shared:element.classList.contains('wd-page-action')&&element.classList.contains('wd-control-state'),
        glass:element.classList.contains('wd-glass'),
        material:Boolean(element.querySelector(':scope>.wd-glass-material')),
        height:box.height,
        background:style.backgroundColor,
        color:style.color,
        boxShadow:style.boxShadow,
        icon:[icon.getBoundingClientRect().width,icon.getBoundingClientRect().height],
        label:[getComputedStyle(label).fontSize,getComputedStyle(label).fontWeight]
      };
    });
    assert.equal(idlePageAction.shared,true,'the page header action uses the shared light variant');
    assert.equal(idlePageAction.glass,false,'the page header action does not mount glass');
    assert.equal(idlePageAction.material,false);
    assert.equal(idlePageAction.height,28);
    assert.equal(idlePageAction.background,'rgba(0, 0, 0, 0)');
    assert.equal(idlePageAction.boxShadow,'none');
    assert.deepEqual(idlePageAction.icon,[14,14]);
    assert.deepEqual(idlePageAction.label,['13px','510']);
    await pageAction.hover();
    await page.waitForTimeout(320);
    const hoverPageAction=await pageAction.evaluate(element=>({
      background:getComputedStyle(element).backgroundColor,
      color:getComputedStyle(element).color
    }));
    assert.equal(hoverPageAction.background,'rgba(118, 118, 128, 0.24)');
    const pageHeaderTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
    assert.equal(hoverPageAction.color,pageHeaderTheme==='light'?'rgb(0, 0, 0)':'rgb(255, 255, 255)');
    await page.mouse.move(20,600);
    await page.waitForTimeout(360);
    assert.deepEqual(
      await page.locator('.service-toolbar').evaluate(element=>[...element.children].slice(0,3).map(child=>child.className)),
      ['wd-control-state wd-button wd-button--pill wd-button--neutral service-status-filter wd-glass','service-toolbar-divider','service-scope']
    );
    assert.equal(await page.locator('.service-scope-button[data-scope="all"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('.service-scope-button').count(),3);
    assert.deepEqual(
      await page.locator('.service-scope-button').evaluateAll(buttons=>buttons.map(button=>Math.round(button.getBoundingClientRect().height))),
      [36,36,36]
    );
    assert.equal(Math.round(await page.locator('.service-status-filter').evaluate(button=>button.getBoundingClientRect().height)),36);
    const scopeSelectedBackground=await page.locator('.service-scope-button[data-scope="all"]').evaluate(button=>getComputedStyle(button).backgroundColor);
    const scopeDefaultBackground=await page.locator('.service-scope-button[data-scope="mentioned"]').evaluate(button=>getComputedStyle(button).backgroundColor);
    const quaternaryFill=await page.evaluate(()=>{
      const probe=document.createElement('span');
      probe.style.background='var(--wd-fill-quaternary)';
      document.body.append(probe);
      const color=getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    assert.equal(scopeDefaultBackground,quaternaryFill,'unselected scopes use the lighter quaternary fill');
    assert.notEqual(scopeSelectedBackground,scopeDefaultBackground);
    assert.notEqual(
      await page.locator('.service-scope-button[data-scope="all"]').evaluate(button=>getComputedStyle(button).boxShadow),
      'none',
      'the selected scope must retain its inner outline when it is not hovered'
    );
    const scoopButton=page.locator('.service-scope-button[data-scope="all"]');
    assert.equal(await scoopButton.evaluate(button=>getComputedStyle(button).transform),'none');
    await scoopButton.hover();
    await page.waitForTimeout(340);
    const scopeHoverScale=await scoopButton.evaluate(button=>new DOMMatrixReadOnly(getComputedStyle(button).transform).a);
    assert.ok(scopeHoverScale>1.02);
    await page.mouse.down();
    await page.waitForTimeout(120);
    const scopePressScale=await scoopButton.evaluate(button=>new DOMMatrixReadOnly(getComputedStyle(button).transform).a);
    assert.ok(scopePressScale>scopeHoverScale);
    await page.mouse.up();
    await page.mouse.move(20,600);
    await page.waitForTimeout(460);
    assert.equal(await scoopButton.evaluate(button=>getComputedStyle(button).transform),'none');
    assert.equal(
      await page.locator('.service-card-grid').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length),
      3
    );
    const serviceHeader=await page.locator('.service-header').evaluate(header=>{
      const title=header.querySelector('.wd-page-breadcrumb-current').getBoundingClientRect();
      const action=header.querySelector('.wd-page-actions > button').getBoundingClientRect();
      const box=header.getBoundingClientRect();
      return {top:box.top,left:title.left,right:action.right,height:box.height,titleCenter:title.top+title.height/2,actionCenter:action.top+action.height/2,titleSize:getComputedStyle(header.querySelector('.wd-page-breadcrumb-current')).fontSize,buttonHeight:action.height};
    });
    await page.goto(`${origin}/plants`,{waitUntil:'domcontentloaded'});
    await ready();
    const plantsHeader=await page.locator('.plants-header').evaluate(header=>{
      const title=header.querySelector('.wd-page-breadcrumb-current').getBoundingClientRect();
      const action=header.querySelector('.wd-page-actions > button').getBoundingClientRect();
      const box=header.getBoundingClientRect();
      return {top:box.top,left:title.left,right:action.right,height:box.height,titleCenter:title.top+title.height/2,actionCenter:action.top+action.height/2,titleSize:getComputedStyle(header.querySelector('.wd-page-breadcrumb-current')).fontSize,buttonHeight:action.height};
    });
    assert.deepEqual(serviceHeader,plantsHeader);
    assert.equal(serviceHeader.height,40);
    assert.ok(Math.abs(serviceHeader.titleCenter-serviceHeader.actionCenter)<1);
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();
    const cardHeights=await page.locator('.service-card').evaluateAll(cards=>
      cards.map(card=>Math.round(card.getBoundingClientRect().height))
    );
    assert.ok(Math.max(...cardHeights)-Math.min(...cardHeights)<=2,'published cards must keep a uniform height');
    const firstCard=page.locator('.service-card').first();
    const cardChrome=await firstCard.evaluate(card=>{
      const avatar=card.querySelector('.wd-avatar');
      const author=card.querySelector('.service-card-author-name');
      const time=card.querySelector('.service-card-time');
      const divider=card.querySelector('.service-card-divider');
      const summary=card.querySelector('.service-card-summary');
      const footer=card.querySelector('.service-card-footer');
      const number=card.querySelector('.service-card-number');
      const status=card.querySelector('.service-status');
      const canvas=card.querySelector('.service-pixel-canvas');
      const box=card.getBoundingClientRect(),dividerBox=divider.getBoundingClientRect();
      const middle=element=>element.getBoundingClientRect().top+element.getBoundingClientRect().height/2;
      return {
        avatarFont:getComputedStyle(avatar.querySelector('.wd-avatar-label')).fontSize,
        avatarLineHeight:getComputedStyle(avatar.querySelector('.wd-avatar-label')).lineHeight,
        avatarWeight:getComputedStyle(avatar).fontWeight,
        authorGap:getComputedStyle(card.querySelector('.service-card-author')).gap,
        avatarCenter:middle(avatar),
        authorCenter:middle(author),
        timeCenter:middle(time),
        dividerLeft:Math.round(dividerBox.left),
        dividerRight:Math.round(dividerBox.right),
        dividerColor:getComputedStyle(divider).backgroundColor,
        cardLeft:Math.round(box.left),
        cardRight:Math.round(box.right),
        cardShadow:getComputedStyle(card).boxShadow,
        cardBorder:getComputedStyle(card).borderTopWidth,
        numberBackground:getComputedStyle(number).backgroundColor,
        numberFont:getComputedStyle(number).fontFamily,
        numberSheen:getComputedStyle(number,'::after').animationName,
        titleMarginTop:getComputedStyle(card.querySelector('.service-card-title')).marginTop,
        summaryDividerGap:Math.round(divider.getBoundingClientRect().top-summary.getBoundingClientRect().bottom),
        dividerFooterGap:Math.round(footer.getBoundingClientRect().top-divider.getBoundingClientRect().bottom),
        footerBottomGap:Math.round(box.bottom-footer.getBoundingClientRect().bottom),
        canvasOpacity:getComputedStyle(canvas).opacity,
        pixelActive:card.hasAttribute('data-pixel-active'),
        statusRightGap:Math.round(box.right-status.getBoundingClientRect().right)
      };
    });
    assert.equal(cardChrome.avatarFont,'9px');
    assert.equal(cardChrome.avatarLineHeight,'10px');
    assert.equal(cardChrome.avatarWeight,'400');
    assert.equal(cardChrome.authorGap,'6px');
    assert.ok(Math.abs(cardChrome.avatarCenter-cardChrome.authorCenter)<1.5);
    assert.ok(Math.abs(cardChrome.avatarCenter-cardChrome.timeCenter)<1.5);
    assert.equal(cardChrome.dividerLeft,cardChrome.cardLeft);
    assert.equal(cardChrome.dividerRight,cardChrome.cardRight);
    assert.match(cardChrome.dividerColor,/255, 255, 255|0\.17/);
    assert.equal(cardChrome.cardShadow,'none');
    assert.equal(cardChrome.cardBorder,'0px');
    assert.notEqual(cardChrome.numberBackground,'rgba(0, 0, 0, 0)');
    assert.match(cardChrome.numberFont,/mono|Consolas/i);
    assert.equal(cardChrome.numberSheen,'none');
    assert.equal(cardChrome.titleMarginTop,'18px');
    assert.equal(cardChrome.summaryDividerGap,17);
    assert.equal(cardChrome.dividerFooterGap,10);
    assert.equal(cardChrome.footerBottomGap,16);
    assert.equal(cardChrome.canvasOpacity,'0');
    assert.equal(cardChrome.pixelActive,false);
    assert.ok(cardChrome.statusRightGap<=20);
    const cardBackgroundBefore=await firstCard.evaluate(card=>getComputedStyle(card).backgroundColor);
    await firstCard.hover({position:{x:260,y:110}});
    await page.waitForTimeout(650);
    const cardHover=await firstCard.evaluate(card=>({
      background:getComputedStyle(card).backgroundColor,
      boxShadow:getComputedStyle(card).boxShadow,
      canvasOpacity:getComputedStyle(card.querySelector('.service-pixel-canvas')).opacity,
      pixelActive:card.getAttribute('data-pixel-active'),
      glareOpacity:Number.parseFloat(getComputedStyle(card.querySelector('.service-card-glare')).opacity),
      scale:Number.parseFloat(card.style.getPropertyValue('--service-card-scale')),
      tiltX:Number.parseFloat(card.style.getPropertyValue('--service-card-tilt-x')),
      tiltY:Number.parseFloat(card.style.getPropertyValue('--service-card-tilt-y')),
      sheenName:getComputedStyle(card.querySelector('.service-card-number'),'::after').animationName,
      sheenIterations:getComputedStyle(card.querySelector('.service-card-number'),'::after').animationIterationCount,
      sheenRuns:card.querySelector('.service-card-number').getAnimations({subtree:true}).length
    }));
    assert.equal(cardHover.background,cardBackgroundBefore);
    assert.equal(cardHover.boxShadow,'none');
    assert.equal(cardHover.canvasOpacity,'1');
    assert.equal(cardHover.pixelActive,'true');
    assert.ok(cardHover.glareOpacity>.15);
    assert.ok(cardHover.scale>1.02);
    assert.ok(Math.abs(cardHover.tiltX)+Math.abs(cardHover.tiltY)>1);
    assert.equal(cardHover.sheenName,'service-number-sheen');
    assert.equal(cardHover.sheenIterations,'1');
    assert.equal(cardHover.sheenRuns,1);
    const hoverClip=await page.evaluate(()=>{
      const card=document.querySelector('.service-card').getBoundingClientRect();
      const viewport=document.querySelector('.service-board-viewport').getBoundingClientRect();
      return {leftInset:card.left-viewport.left,topInset:card.top-viewport.top};
    });
    assert.ok(hoverClip.leftInset>4,'hover scale and shadow must not clip at the left edge');
    assert.ok(hoverClip.topInset>4,'hover scale and shadow must not clip at the top edge');
    await page.mouse.move(20,600);
    await page.waitForTimeout(900);
    assert.equal(await firstCard.evaluate(card=>card.hasAttribute('data-pixel-active')),false);
    assert.equal(await firstCard.locator('.service-pixel-canvas').evaluate(canvas=>getComputedStyle(canvas).opacity),'0');
    const cardRest=await firstCard.evaluate(card=>({
      scale:Number.parseFloat(card.style.getPropertyValue('--service-card-scale')),
      tiltX:Number.parseFloat(card.style.getPropertyValue('--service-card-tilt-x')),
      tiltY:Number.parseFloat(card.style.getPropertyValue('--service-card-tilt-y')),
      glareOpacity:Number.parseFloat(getComputedStyle(card.querySelector('.service-card-glare')).opacity),
      boxShadow:getComputedStyle(card).boxShadow,
      sheenName:getComputedStyle(card.querySelector('.service-card-number'),'::after').animationName
    }));
    assert.ok(Math.abs(cardRest.scale-1)<.001);
    assert.ok(Math.abs(cardRest.tiltX)+Math.abs(cardRest.tiltY)<.1);
    assert.ok(cardRest.glareOpacity<.01);
    assert.equal(cardRest.boxShadow,'none');
    assert.equal(cardRest.sheenName,'none');

    // Dragging adds physical resistance without triggering the card's click
    // navigation. A normal click remains the route-opening action.
    const secondBox=await page.locator('.service-card').nth(1).boundingBox();
    await page.mouse.move(secondBox.x+secondBox.width/2,secondBox.y+secondBox.height/2);
    await page.mouse.down();
    await page.mouse.move(secondBox.x+secondBox.width/2+44,secondBox.y+secondBox.height/2+18,{steps:6});
    await page.mouse.up();
    await page.waitForTimeout(180);
    assert.equal(new URL(page.url()).pathname,'/service');
    await page.mouse.move(20,600);
    await page.setViewportSize({width:1545,height:700});
    await page.waitForTimeout(180);
    const rightAlignment=await page.evaluate(()=>{
      const right=selector=>document.querySelector(selector).getBoundingClientRect().right;
      return {
        grid:right('.service-card-grid'),
        action:right('.service-new-ticket'),
        track:right('.service-board > .wd-scroll-feedback'),
        workspace:right('#home-workspace-panel')
      };
    });
    assert.ok(Math.abs(rightAlignment.grid-rightAlignment.action)<1);
    assert.ok(Math.abs(rightAlignment.track-(rightAlignment.workspace-10))<1);
    await page.setViewportSize({width:1545,height:1252});
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();

    // Scope pills are mutually exclusive; status is an independent AND filter.
    await page.locator('.service-scope-button[data-scope="created"]').click();
    assert.equal(await page.locator('.service-card').count(),3);
    assert.equal(await page.locator('.service-scope-button[data-scope="created"]').getAttribute('aria-selected'),'true');
    await page.locator('.service-scope-button[data-scope="mentioned"]').click();
    assert.equal(await page.locator('.service-card').count(),2);
    await page.locator('.service-scope-button[data-scope="all"]').click();
    await page.locator('.service-status-filter').click();
    assert.deepEqual(await page.locator('.service-status-menu .wd-menu-row').allTextContents(),['All status','Ongoing','Closed']);
    await page.locator('.service-status-menu .wd-menu-row[data-status="closed"]').click();
    assert.equal(await page.locator('.service-card').count(),3);
    assert.equal((await page.locator('.service-status-filter').innerText()).trim(),'Closed');
    await page.locator('.service-status-filter').click();
    await page.locator('.service-status-menu .wd-menu-row[data-status="all"]').click();

    // New ticket opens a dedicated editor tab and reuses the detail editor.
    const listTabs=await page.locator('.workspace-tab').count();
    await page.locator('.service-new-ticket').click();
    await page.waitForTimeout(180);
    assert.equal(new URL(page.url()).pathname,'/service/new');
    assert.equal(await page.title(),'WattDesk · New ticket');
    assert.equal(await page.locator('.workspace-tab').count(),listTabs+1);
    assert.equal(await page.locator('.service-detail').isVisible(),true);
    assert.equal(await page.locator('.service-ticket-edit--new').count(),1);
    assert.equal(await page.locator('.service-card--draft').count(),0);
    assert.equal(await page.locator('.service-detail-title-input').evaluate(input=>document.activeElement===input),true);
    const newTicketLayout=await page.evaluate(()=>{
      const rect=selector=>{
        const box=document.querySelector(selector).getBoundingClientRect();
        return {top:box.top,right:box.right,bottom:box.bottom,left:box.left};
      };
      const main=rect('.service-new-ticket-main');
      const body=rect('.service-ticket-body-input');
      const actions=rect('.service-inline-editor-actions');
      const properties=rect('.service-properties');
      const title=rect('.service-detail-title-input');
      return {
        columns:getComputedStyle(document.querySelector('.service-detail-content')).gridTemplateColumns.split(' ').length,
        main,
        body,
        actions,
        properties,
        title,
        propertiesText:document.querySelector('.service-properties').innerText,
        plantInMain:Boolean(document.querySelector('.service-new-ticket-main .service-property-plant-trigger'))
      };
    });
    assert.equal(newTicketLayout.columns,2,'New ticket keeps the detail two-column layout');
    assert.ok(newTicketLayout.properties.left>newTicketLayout.main.right,'Properties sits in the right rail');
    assert.ok(Math.abs(newTicketLayout.actions.right-newTicketLayout.body.right)<1,'Publish actions align with the body column');
    assert.ok(newTicketLayout.actions.top>newTicketLayout.body.bottom,'Publish actions sit below the body');
    assert.ok(Math.abs(newTicketLayout.properties.top-newTicketLayout.title.top)<1,'Properties aligns with the title');
    assert.match(newTicketLayout.propertiesText,/Status\s+Ongoing/);
    assert.match(newTicketLayout.propertiesText,/Plant\s+Select a plant/);
    assert.match(newTicketLayout.propertiesText,/Author\s+CW\s+Carl Wang/);
    assert.match(newTicketLayout.propertiesText,/Created\s+Just now/);
    assert.match(newTicketLayout.propertiesText,/Last activity\s+Just now/);
    assert.match(newTicketLayout.propertiesText,/Replies\s+0/);
    assert.equal(newTicketLayout.plantInMain,false,'Plant selection belongs in Properties');
    const normalizedTicketTitle='Inverter reports intermittent BMS communication timeout during morning restart window and requires investigation plus follow-up diagnostics second line';
    await page.locator('.service-detail-title-input').fill(
      'Inverter reports intermittent BMS communication timeout during morning restart window and requires investigation plus follow-up diagnostics\nsecond line'
    );
    await page.waitForTimeout(320);
    const wrappedTitleEditor=await page.locator('.service-detail-title-input').evaluate(input=>({
      value:input.value,
      height:input.getBoundingClientRect().height,
      scrollHeight:input.scrollHeight,
      clientHeight:input.clientHeight,
      maxWidth:getComputedStyle(input).maxWidth,
      whiteSpace:getComputedStyle(input).whiteSpace,
      overflowWrap:getComputedStyle(input).overflowWrap,
      overflowY:getComputedStyle(input).overflowY
    }));
    assert.equal(wrappedTitleEditor.value,normalizedTicketTitle,'pasted title line breaks normalize to spaces');
    assert.ok(wrappedTitleEditor.height>25,'long ticket titles wrap and grow instead of clipping');
    assert.ok(Math.abs(wrappedTitleEditor.scrollHeight-wrappedTitleEditor.clientHeight)<=1,'wrapped title never scrolls internally');
    assert.equal(wrappedTitleEditor.maxWidth,'760px');
    assert.equal(wrappedTitleEditor.whiteSpace,'pre-wrap');
    assert.equal(wrappedTitleEditor.overflowWrap,'anywhere');
    assert.equal(wrappedTitleEditor.overflowY,'hidden');
    await page.locator('.service-property-plant-trigger').click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('.service-plant-picker').count(),1);
    assert.equal(await page.locator('.service-plant-picker .plants-filter-flyout-content').count(),1);
    assert.equal(await page.locator('.service-plant-picker .plants-filter-search-field').count(),1);
    assert.equal(await page.locator('.service-plant-picker .service-plant-option').count(),46);
    assert.equal(await page.locator('.service-plant-picker .service-plant-selection:checked').count(),0);
    await page.locator('.service-plant-picker .wd-search-input').fill('EKD Showroom');
    assert.equal(await page.locator('.service-plant-picker .service-plant-option').count(),1);
    await page.locator('.service-plant-picker .service-plant-option[data-option="p01"] .plants-filter-condition-choice').click();
    await page.waitForTimeout(220);
    assert.equal((await page.locator('.service-property-plant-trigger').innerText()).trim(),'EKD Showroom');
    assert.equal(await page.locator('.service-plant-picker').count(),0);
    await page.locator('.service-ticket-body-input').fill('Need help with this local preview. @');
    assert.ok(await page.locator('.service-mention-menu .wd-menu-row').count()>=1);
    await page.locator('.service-mention-menu .wd-menu-row').first().click();
    assert.match(await page.locator('.service-ticket-body-input').inputValue(),/@/);
    await page.locator('.service-ticket-edit input[type=file]').setInputFiles({
      name:'service-photo.png',mimeType:'image/png',buffer:png
    });
    assert.equal(await page.locator('.service-ticket-edit .service-attachment').count(),1);
    await page.locator('.service-ticket-edit').getByRole('button',{name:'Publish ticket'}).click();
    await page.waitForTimeout(420);
    assert.match(new URL(page.url()).pathname,/^\/service\/st-local-/);
    assert.equal(await page.title(),`WattDesk · ${normalizedTicketTitle}`);
    const wrappedDisplayTitle=await page.locator('.service-detail-title').evaluate(title=>({
      text:title.textContent,
      height:title.getBoundingClientRect().height,
      scrollWidth:title.scrollWidth,
      clientWidth:title.clientWidth,
      whiteSpace:getComputedStyle(title).whiteSpace,
      overflowWrap:getComputedStyle(title).overflowWrap
    }));
    assert.equal(wrappedDisplayTitle.text,normalizedTicketTitle,'published title uses the same normalized text');
    assert.ok(wrappedDisplayTitle.height>25,'display title wraps to multiple lines');
    assert.ok(wrappedDisplayTitle.scrollWidth<=wrappedDisplayTitle.clientWidth,'display title never overflows horizontally');
    assert.equal(wrappedDisplayTitle.whiteSpace,'normal');
    assert.equal(wrappedDisplayTitle.overflowWrap,'anywhere');
    assert.equal(await page.locator('.service-ticket-paper .service-attachment').count(),1);
    assert.equal(await page.locator('.workspace-tab').count(),listTabs+1,'Publishing reuses the new-ticket tab');
    await page.locator('.service-reply-editor--standalone .service-reply-input').fill('Badge color probe');
    await page.getByRole('button',{name:'Send reply'}).click();
    await page.waitForTimeout(260);
    const readBadgeStyles=()=>page.evaluate(()=>{
      const contrast=(foreground,background)=>{
        const rgb=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
        const luminance=([r,g,b])=>{
          const channel=value=>{
            const normalized=value/255;
            return normalized<=.03928?normalized/12.92:((normalized+.055)/1.055)**2.4;
          };
          return .2126*channel(r)+.7152*channel(g)+.0722*channel(b);
        };
        const foregroundLuminance=luminance(rgb(foreground));
        const backgroundLuminance=luminance(rgb(background));
        return (Math.max(foregroundLuminance,backgroundLuminance)+.05)/
          (Math.min(foregroundLuminance,backgroundLuminance)+.05);
      };
      const style=selector=>{
        const css=getComputedStyle(document.querySelector(selector));
        return {color:css.color,background:css.backgroundColor};
      };
      const poster=style('.service-user-badge--poster');
      return {
        theme:document.documentElement.dataset.theme,
        poster:{...poster,contrast:contrast(poster.color,poster.background)},
        you:style('.service-user-badge--you')
      };
    });
    const badgeThemeBefore=await readBadgeStyles();
    assert.equal(badgeThemeBefore.poster.color,'rgb(255, 255, 255)');
    assert.equal(badgeThemeBefore.you.color,'rgb(255, 255, 255)');
    assert.ok(badgeThemeBefore.poster.contrast>=4.5,'POSTER text must meet contrast in dark mode');
    assert.match(badgeThemeBefore.you.background,/rgba?\(0, (145|136), 255/);
    await page.screenshot({path:'tests/output/service-poster-badge-dark.png'});
    await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
    await page.waitForTimeout(700);
    const badgeThemeAfter=await readBadgeStyles();
    assert.notEqual(badgeThemeAfter.theme,badgeThemeBefore.theme);
    assert.equal(badgeThemeAfter.poster.color,'rgb(255, 255, 255)','POSTER keeps white text in both themes');
    assert.equal(badgeThemeAfter.you.color,'rgb(255, 255, 255)','YOU keeps white text in both themes');
    assert.ok(badgeThemeAfter.poster.contrast>=4.5,'POSTER text must meet contrast in light mode');
    assert.match(badgeThemeAfter.you.background,/rgba?\(0, (145|136), 255/);
    await page.screenshot({path:'tests/output/service-poster-badge-light.png'});
    await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
    await page.waitForTimeout(700);
    await page.locator('.wd-page-breadcrumb-link').click();
    await page.waitForFunction(count=>document.querySelectorAll('.workspace-tab').length===count,listTabs);
    assert.equal(new URL(page.url()).pathname,'/service');
    assert.equal(await page.locator('.service-card').count(),9);
    await page.locator('.service-new-ticket').click();
    await page.waitForTimeout(180);
    assert.equal(new URL(page.url()).pathname,'/service/new');
    await page.locator('.service-inline-editor-actions').getByRole('button',{name:'Cancel'}).click();
    await page.waitForFunction(count=>document.querySelectorAll('.workspace-tab').length===count,listTabs);
    assert.equal(new URL(page.url()).pathname,'/service');
    assert.equal(await page.locator('.service-card').count(),9);

    // The discussion starts oldest-first, can reverse, and replies stay inline.
    await page.goto(`${origin}/service/st-25638663`,{waitUntil:'domcontentloaded'});
    await ready();
    assert.equal(await page.title(),'WattDesk · MPPT charge reduces to zero for no reason');
    assert.equal(await page.locator('.service-detail-number,.service-ticket-meta').count(),0);
    assert.deepEqual(
      await page.locator('.service-detail-header .wd-page-breadcrumb-list > li').allTextContents(),
      ['Service ticket','','NO.25638663']
    );
    const detailHeader=await page.locator('.service-detail-header').evaluate(header=>({
      height:header.getBoundingClientRect().height,
      breadcrumbSize:getComputedStyle(header.querySelector('.wd-page-breadcrumb-link')).fontSize,
      breadcrumbWeight:getComputedStyle(header.querySelector('.wd-page-breadcrumb-link')).fontWeight,
      currentSize:getComputedStyle(header.querySelector('.wd-page-breadcrumb-current')).fontSize,
      separatorIcon:Boolean(header.querySelector('.wd-page-breadcrumb-separator .target-icon-art'))
    }));
    assert.deepEqual(detailHeader,{height:40,breadcrumbSize:'14px',breadcrumbWeight:'510',currentSize:'14px',separatorIcon:true});
    const breadcrumbGaps=await page.locator('.service-detail-header').evaluate(header=>{
      const link=header.querySelector('.wd-page-breadcrumb-link');
      const current=header.querySelector('.wd-page-breadcrumb-current');
      const separator=header.querySelector('.wd-page-breadcrumb-separator');
      const textBounds=element=>{
        const range=document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      };
      const arrow=header.querySelector('.wd-page-breadcrumb-separator .target-icon-art');
      const separatorBounds=separator.getBoundingClientRect();
      return {
        left:separatorBounds.left-textBounds(link).right,
        right:textBounds(current).left-separatorBounds.right,
        linkColor:getComputedStyle(link).color,
        arrowColor:getComputedStyle(arrow).color,
        arrowSource:arrow.style.getPropertyValue('--icon-source')
      };
    });
    assert.ok(Math.abs(breadcrumbGaps.left-breadcrumbGaps.right)<.5,'breadcrumb separator spacing must be symmetric');
    assert.equal(breadcrumbGaps.arrowColor,breadcrumbGaps.linkColor);
    assert.match(breadcrumbGaps.arrowSource,/masks\/asset-14\.svg/);
    await page.locator('.wd-page-breadcrumb-link').hover();
    await page.waitForTimeout(280);
    const breadcrumbHover=await page.locator('.wd-page-breadcrumb-link').evaluate(element=>({
      background:getComputedStyle(element).backgroundColor,
      decoration:getComputedStyle(element).textDecorationLine,
      radius:getComputedStyle(element).borderRadius
    }));
    assert.notEqual(breadcrumbHover.background,'rgba(0, 0, 0, 0)');
    assert.equal(breadcrumbHover.decoration,'none');
    assert.equal(breadcrumbHover.radius,'999px');
    await page.mouse.move(700,1100);
    const propertyAlignment=await page.evaluate(()=>{
      const title=document.querySelector('.service-detail-title').getBoundingClientRect();
      const paper=document.querySelector('.service-ticket-paper').getBoundingClientRect();
      const properties=document.querySelector('.service-properties').getBoundingClientRect();
      return {titleTop:title.top,paperTop:paper.top,propertiesTop:properties.top,paperBackground:getComputedStyle(document.querySelector('.service-ticket-paper')).backgroundColor,paperPadding:getComputedStyle(document.querySelector('.service-ticket-paper')).paddingTop};
    });
    assert.ok(Math.abs(propertyAlignment.titleTop-propertyAlignment.propertiesTop)<1);
    assert.equal(propertyAlignment.paperBackground,'rgba(0, 0, 0, 0)');
    assert.equal(propertyAlignment.paperPadding,'0px');
    const propertiesNumber=await page.evaluate(()=>{
      const pill=document.querySelector('.service-properties-number');
      const row=pill.closest('.service-property-row');
      const label=row.querySelector('.service-property-label');
      const title=document.querySelector('.service-properties-title');
      const style=getComputedStyle(pill);
      const pillBox=pill.getBoundingClientRect(),labelBox=label.getBoundingClientRect();
      const propertyRows=[...document.querySelectorAll('.service-properties>.service-property-row,.service-properties>.service-meta-item')];
      return {
        text:pill.textContent,
        shared:pill.classList.contains('service-card-number'),
        label:label.textContent,
        firstProperty:propertyRows[0]===row,
        height:pillBox.height,
        fontSize:style.fontSize,
        background:style.backgroundColor,
        labelAbove:title.getBoundingClientRect().bottom<=labelBox.top,
        pillBelow:pillBox.top>=labelBox.bottom
      };
    });
    assert.match(propertiesNumber.text,/^NO\.\d+$/);
    assert.equal(propertiesNumber.shared,true);
    assert.equal(propertiesNumber.label,'Ticket ID');
    assert.equal(propertiesNumber.firstProperty,true);
    assert.equal(propertiesNumber.height,20);
    assert.equal(propertiesNumber.fontSize,'11px');
    assert.notEqual(propertiesNumber.background,'rgba(0, 0, 0, 0)');
    assert.equal(propertiesNumber.labelAbove,true);
    assert.equal(propertiesNumber.pillBelow,true);
    const detailTopSpacing=await page.locator('.service-detail-content').evaluate(element=>getComputedStyle(element).paddingTop);
    assert.equal(detailTopSpacing,'72px');
    const propertyChrome=await page.evaluate(()=>({
      propertiesBackground:getComputedStyle(document.querySelector('.service-properties')).backgroundColor,
      threadBackground:getComputedStyle(document.querySelector('.service-thread-card')).backgroundColor,
      propertiesShadow:getComputedStyle(document.querySelector('.service-properties')).boxShadow,
      threadShadow:getComputedStyle(document.querySelector('.service-thread-card')).boxShadow,
      propertiesShared:document.querySelector('.service-properties').classList.contains('wd-discussion-card'),
      threadsShared:[...document.querySelectorAll('.service-thread-card')].every(card=>card.classList.contains('wd-discussion-card')),
      threadGeometry:[...document.querySelectorAll('.service-thread-card')].every(card=>card.dataset.cornerProfile==='continuous'&&getComputedStyle(card).cornerShape==='superellipse(1.2)'),
      propertiesTop:document.querySelector('.service-properties').getBoundingClientRect().top
    }));
    assert.equal(propertyChrome.propertiesBackground,propertyChrome.threadBackground);
    assert.equal(propertyChrome.propertiesShadow,propertyChrome.threadShadow);
    assert.equal(propertyChrome.propertiesShared,true);
    assert.equal(propertyChrome.threadsShared,true);
    assert.equal(propertyChrome.threadGeometry,true);
    await page.locator('.service-detail-viewport').evaluate(element=>{element.scrollTop=element.scrollHeight;});
    await page.waitForTimeout(180);
    const propertiesTopAfterScroll=await page.locator('.service-properties').evaluate(element=>element.getBoundingClientRect().top);
    assert.ok(Math.abs(propertiesTopAfterScroll-propertyChrome.propertiesTop)<1,'Properties stays fixed while the discussion scrolls');
    await page.locator('.service-detail-viewport').evaluate(element=>{element.scrollTop=0;});
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.service-properties .service-meta-author .wd-avatar').count(),1);
    assert.deepEqual(
      await page.locator('.service-properties .service-meta-author .wd-avatar').evaluate(element=>({
        width:getComputedStyle(element).width,
        height:getComputedStyle(element).height,
        fontSize:getComputedStyle(element.querySelector('.wd-avatar-label')).fontSize,
        lineHeight:getComputedStyle(element.querySelector('.wd-avatar-label')).lineHeight,
        labelTransform:getComputedStyle(element.querySelector('.wd-avatar-label')).transform
      })),
      {width:'22px',height:'22px',fontSize:'9px',lineHeight:'10px',labelTransform:'matrix(1, 0, 0, 1, 0, 0.5)'}
    );
    assert.equal(await page.locator('.service-thread-card').count(),3);
    assert.equal(await page.locator('.service-thread-card .service-comment--nested').count(),1);
    assert.equal(await page.locator('.service-thread-card .service-thread-reply-prompt').count(),3);
    const threadOrder=await page.locator('.service-thread').evaluate(element=>[...element.children].map(child=>child.className));
    assert.deepEqual(threadOrder,[
      'service-reply-editor service-reply-editor--standalone wd-control-state wd-discussion-card',
      'service-thread-header',
      'service-thread-list'
    ]);
    assert.equal(await page.locator('.service-thread').evaluate(element=>getComputedStyle(element).borderTopWidth),'1px');
    assert.equal(await page.locator('.service-thread').evaluate(element=>getComputedStyle(element).marginTop),'84px');
    assert.equal(await page.locator('.service-reply-editor--standalone').first().evaluate(element=>getComputedStyle(element).marginTop),'40px');
    assert.equal(await page.locator('.service-thread-header').evaluate(element=>getComputedStyle(element).borderBottomWidth),'0px');
    assert.equal(await page.locator('.service-sort-button .service-sort-icon').count(),1);
    assert.notEqual(await page.locator('.service-sort-button .service-sort-icon').evaluate(element=>getComputedStyle(element).transform),'none');
    const threadHeaderAlignment=await page.locator('.service-thread-header').evaluate(header=>{
      const title=header.querySelector('.service-thread-title').getBoundingClientRect();
      const sort=header.querySelector('.service-sort-button');
      const button=sort.getBoundingClientRect();
      const label=sort.querySelector('.wd-control-label').getBoundingClientRect();
      const arrow=sort.querySelector('.service-sort-icon').getBoundingClientRect();
      return {
        titleBottom:title.bottom,
        sortLabelBottom:label.bottom,
        buttonCenter:button.top+button.height/2,
        labelCenter:label.top+label.height/2,
        arrowCenter:arrow.top+arrow.height/2,
        labelArrowGap:arrow.left-label.right
      };
    });
    assert.ok(Math.abs(threadHeaderAlignment.titleBottom-threadHeaderAlignment.sortLabelBottom)<.5);
    assert.ok(Math.abs(threadHeaderAlignment.buttonCenter-threadHeaderAlignment.labelCenter)<.5,'Sort background must be vertically centred on its label');
    assert.ok(Math.abs(threadHeaderAlignment.arrowCenter-threadHeaderAlignment.labelCenter)<.5,'Sort arrow must be vertically centred with its label');
    assert.equal(threadHeaderAlignment.labelArrowGap,6);
    assert.equal(await page.locator('.service-reply-editor').first().evaluate(element=>element.getBoundingClientRect().top<element.nextElementSibling.getBoundingClientRect().top),true);
    const editorField=await page.locator('.service-reply-input').first().evaluate(element=>{
      const style=getComputedStyle(element);
      return {top:style.borderTopWidth,left:style.borderLeftWidth,right:style.borderRightWidth,bottom:style.borderBottomWidth};
    });
    assert.deepEqual(editorField,{top:'0px',left:'0px',right:'0px',bottom:'0px'});
    const ticketParagraphs=await page.locator('.service-ticket-paper .service-body-text').evaluate(element=>{
      const paragraphs=[...element.querySelectorAll(':scope>.service-text-paragraph')];
      return {
        count:paragraphs.length,
        gap:paragraphs[1].getBoundingClientRect().top-paragraphs[0].getBoundingClientRect().bottom,
        lineHeight:getComputedStyle(paragraphs[0]).lineHeight
      };
    });
    assert.deepEqual(ticketParagraphs,{count:2,gap:6,lineHeight:'20px'});
    const standaloneEditor=page.locator('.service-reply-editor--standalone').first();
    assert.equal(await standaloneEditor.evaluate(element=>element.classList.contains('wd-discussion-card')),true);
    assert.equal(await standaloneEditor.locator('.wd-avatar').count(),0);
    const emptyComposer=await standaloneEditor.evaluate(element=>{
      const actions=[...element.querySelectorAll('.service-reply-action')];
      const input=getComputedStyle(element.querySelector('.service-reply-input'));
      const comment=getComputedStyle(document.querySelector('.service-comment-body'));
      return {
        height:element.getBoundingClientRect().height,
        boxShadow:getComputedStyle(element).boxShadow,
        geometry:{
          radius:getComputedStyle(element).borderRadius,
          cornerShape:getComputedStyle(element).cornerShape,
          profile:element.dataset.cornerProfile
        },
        font:{family:input.fontFamily,size:input.fontSize,weight:input.fontWeight},
        commentFont:{family:comment.fontFamily,size:comment.fontSize,weight:comment.fontWeight},
        actions:actions.map(action=>{
          const style=getComputedStyle(action);
          return {width:style.width,height:style.height,classes:[...action.classList]};
        }),
        attachmentMask:decodeURIComponent(element.querySelector('.service-attachment-trigger .service-icon')?.style.getPropertyValue('--icon-mask')||'')
      };
    });
    assert.ok(emptyComposer.height<=100,'The standalone reply composer stays compact');
    assert.match(emptyComposer.boxShadow,/1px inset/);
    assert.match(emptyComposer.boxShadow,/0px 0px 1px 0\.5px/);
    assert.match(emptyComposer.boxShadow,/0px 0px 9px -2px/);
    assert.notEqual(emptyComposer.boxShadow,'none');
    assert.deepEqual(emptyComposer.geometry,{radius:'18px',cornerShape:'superellipse(1.2)',profile:'continuous'});
    assert.deepEqual(emptyComposer.font,emptyComposer.commentFont);
    await standaloneEditor.hover();
    await page.waitForTimeout(260);
    const placeholderHover=await standaloneEditor.locator('.service-reply-input').evaluate(element=>({
      color:getComputedStyle(element,'::before').color,
      duration:getComputedStyle(element,'::before').transitionDuration,
      content:getComputedStyle(element,'::before').content
    }));
    assert.equal(
      placeholderHover.color,
      await page.locator('.service-properties .service-meta-value').first().evaluate(element=>getComputedStyle(element).color)
    );
    assert.equal(placeholderHover.duration,'0.24s');
    assert.match(placeholderHover.content,/Leave a comment/);
    await standaloneEditor.locator('.service-reply-input').click();
    await page.keyboard.type('First paragraph.');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second paragraph.');
    const replyParagraphStyle=await standaloneEditor.locator('.service-reply-input').evaluate(element=>{
      const blocks=[...element.querySelectorAll(':scope>div')];
      const style=getComputedStyle(element);
      return {
        count:blocks.length,
        gap:blocks[1].getBoundingClientRect().top-blocks[0].getBoundingClientRect().bottom,
        family:style.fontFamily,
        size:style.fontSize,
        lineHeight:style.lineHeight
      };
    });
    assert.equal(replyParagraphStyle.count,2);
    assert.equal(replyParagraphStyle.gap,6);
    assert.match(replyParagraphStyle.family,/SF Pro/);
    assert.equal(replyParagraphStyle.size,'15px');
    assert.equal(replyParagraphStyle.lineHeight,'20px');
    await standaloneEditor.locator('.service-reply-input').fill('');
    const composerInput=standaloneEditor.locator('.service-reply-input');
    await composerInput.click();
    await composerInput.evaluate(element=>{
      const clipboard=new DataTransfer();
      clipboard.setData('text/plain','Pasted plain one\n\nPasted plain two');
      clipboard.setData('text/html','<strong style="color:red;font-size:30px">Pasted plain one</strong><p>Pasted plain two</p>');
      element.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard}));
    });
    await page.waitForTimeout(60);
    const pastedReply=await composerInput.evaluate(element=>{
      const blocks=[...element.querySelectorAll(':scope>div')];
      return {
        value:element.value,
        blocks:blocks.length,
        gap:blocks[1].getBoundingClientRect().top-blocks[0].getBoundingClientRect().bottom,
        formatted:Boolean(element.querySelector('strong,span,[style]')),
        fontSize:getComputedStyle(element).fontSize
      };
    });
    assert.deepEqual(pastedReply,{
      value:'Pasted plain one\n\nPasted plain two',
      blocks:2,
      gap:6,
      formatted:false,
      fontSize:'15px'
    });
    await composerInput.fill('');
    await composerInput.fill(Array.from({length:28},(_,index)=>`Scrollable composer line ${index+1}`).join('\n'));
    await page.waitForTimeout(320);
    const composerScroll=await composerInput.evaluate(element=>{
      const host=element.closest('.service-reply-input-host');
      const track=host.querySelector(':scope>.wd-scroll-feedback');
      return {
        clientHeight:element.clientHeight,
        scrollHeight:element.scrollHeight,
        nativeScrollbar:getComputedStyle(element).scrollbarWidth,
        trackHidden:track.hidden,
        trackClasses:track.className,
        thumbColor:getComputedStyle(track.querySelector('.wd-scroll-feedback__thumb')).backgroundColor,
        pageThumbColor:getComputedStyle(document.querySelector('.service-detail>.wd-scroll-feedback .wd-scroll-feedback__thumb')).backgroundColor
      };
    });
    assert.equal(composerScroll.clientHeight,180);
    assert.ok(composerScroll.scrollHeight>composerScroll.clientHeight);
    assert.equal(composerScroll.nativeScrollbar,'none');
    assert.equal(composerScroll.trackHidden,false);
    assert.match(composerScroll.trackClasses,/wd-scroll-feedback/);
    assert.equal(composerScroll.thumbColor,composerScroll.pageThumbColor,'composer rail uses the shared page rail color');
    await composerInput.hover();
    const detailScrollBefore=await page.locator('.service-detail-viewport').evaluate(element=>element.scrollTop);
    await page.mouse.wheel(0,120);
    await page.waitForTimeout(80);
    const scrollDown=await composerInput.evaluate(element=>element.scrollTop);
    const detailScrollDuring=await page.locator('.service-detail-viewport').evaluate(element=>element.scrollTop);
    await page.mouse.wheel(0,-60);
    await page.waitForTimeout(80);
    const scrollUp=await composerInput.evaluate(element=>element.scrollTop);
    assert.ok(scrollDown>0,'wheel down scrolls composer text');
    assert.ok(scrollUp<scrollDown,'wheel up scrolls composer text back');
    assert.equal(detailScrollDuring,detailScrollBefore,'composer scrolling does not move the outer page');
    await composerInput.fill('');
    await page.waitForTimeout(320);
    assert.deepEqual(emptyComposer.actions.map(action=>[action.width,action.height]),[['36px','36px'],['36px','36px']]);
    assert.equal(emptyComposer.actions[0].classes.includes('wd-glass'),true);
    assert.equal(emptyComposer.actions[1].classes.includes('wd-glass'),true);
    const sendAlignment=await standaloneEditor.locator('.service-reply-send').evaluate(button=>{
      const buttonBox=button.getBoundingClientRect();
      const icon=button.querySelector('.service-send-icon').getBoundingClientRect();
      return {
        x:Math.abs(buttonBox.left+buttonBox.width/2-(icon.left+icon.width/2)),
        y:Math.abs(buttonBox.top+buttonBox.height/2-(icon.top+icon.height/2)),
        width:icon.width,
        height:icon.height,
        transform:getComputedStyle(button.querySelector('.service-send-icon')).transform,
        mask:decodeURIComponent(button.querySelector('.service-send-icon').style.getPropertyValue('--icon-mask'))
      };
    });
    assert.ok(sendAlignment.x<.5);
    assert.ok(sendAlignment.y<.25);
    assert.equal(sendAlignment.width,16);
    assert.equal(sendAlignment.height,16);
    assert.equal(sendAlignment.transform,'none');
    assert.match(sendAlignment.mask,/M8 13V3M4\.5 6\.5L8 3L11\.5 6\.5/);
    assert.match(emptyComposer.attachmentMask,/M21\.44 11\.05/);
    assert.equal(await standaloneEditor.getByRole('button',{name:'Send reply'}).isDisabled(),true);
    const promptAlignment=await page.evaluate(()=>{
      const prompt=document.querySelector('.service-thread-reply-prompt');
      const avatar=prompt.querySelector('.wd-avatar').getBoundingClientRect();
      const label=prompt.querySelector('.service-thread-reply-prompt-label').getBoundingClientRect();
      const labelStyle=getComputedStyle(prompt.querySelector('.service-thread-reply-prompt-label'));
      const root=prompt.closest('.service-thread-card').querySelector('.service-comment');
      const head=root.querySelector('.service-comment-head').getBoundingClientRect();
      const body=root.querySelector('.service-comment-body').getBoundingClientRect();
      const bodyStyle=getComputedStyle(root.querySelector('.service-comment-body'));
      const card=prompt.closest('.service-thread-card').getBoundingClientRect();
      const replies=prompt.closest('.service-thread-card').querySelector('.service-thread-replies');
      const nested=replies.querySelector('.service-comment--nested');
      return {
        promptHeight:prompt.getBoundingClientRect().height,
        avatarWidth:avatar.width,
        avatarLeft:avatar.left,
        avatarCenterY:avatar.top+avatar.height/2,
        bodyAvatarLeft:document.querySelector('.service-comment .wd-avatar').getBoundingClientRect().left,
        labelLeft:label.left,
        labelCenterY:label.top+parseFloat(labelStyle.lineHeight)/2,
        aboveAvatar:avatar.top-prompt.getBoundingClientRect().top,
        belowAvatar:card.bottom-avatar.bottom,
        bodyGap:body.top-head.bottom,
        repliesGap:replies.getBoundingClientRect().top-body.bottom,
        nestedPaddingTop:getComputedStyle(nested).paddingTop,
        nestedPaddingBottom:getComputedStyle(nested).paddingBottom,
        bodyLeft:body.left,
        promptBackground:getComputedStyle(prompt).backgroundColor,
        font:{family:labelStyle.fontFamily,size:labelStyle.fontSize,weight:labelStyle.fontWeight},
        bodyFont:{family:bodyStyle.fontFamily,size:bodyStyle.fontSize,weight:bodyStyle.fontWeight}
      };
    });
    assert.equal(promptAlignment.avatarWidth,28);
    assert.equal(promptAlignment.promptHeight,49);
    assert.equal(promptAlignment.aboveAvatar,11);
    assert.equal(promptAlignment.belowAvatar,10);
    assert.equal(promptAlignment.bodyGap,0);
    assert.equal(promptAlignment.repliesGap,12);
    assert.equal(promptAlignment.nestedPaddingTop,'10px');
    assert.equal(promptAlignment.nestedPaddingBottom,'0px');
    assert.ok(Math.abs(promptAlignment.avatarLeft-promptAlignment.bodyAvatarLeft)<.5);
    assert.ok(Math.abs(promptAlignment.labelLeft-promptAlignment.bodyLeft)<.5);
    assert.deepEqual(promptAlignment.font,promptAlignment.bodyFont);
    assert.equal(promptAlignment.promptBackground,'rgba(0, 0, 0, 0)');
    await standaloneEditor.locator('.service-reply-input').fill('Draft retained while editing a thread.');
    await page.locator('.service-thread-reply-prompt').first().click();
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.service-reply-editor--standalone').count(),1);
    assert.equal(await page.locator('.service-reply-editor--inline').count(),1);
    assert.equal((await page.locator('.service-reply-editor--standalone .service-reply-input').innerText()).trim(),'Draft retained while editing a thread.');
    const inlineComposer=await page.locator('.service-reply-editor--inline').evaluate(element=>{
      const input=element.querySelector('.service-reply-input');
      const inputRect=input.getBoundingClientRect();
      const inputStyle=getComputedStyle(input);
      const bar=element.querySelector('.service-reply-editor-bar');
      const avatar=element.querySelector('.wd-avatar').getBoundingClientRect();
      const card=element.closest('.service-thread-card').getBoundingClientRect();
      const row=element.getBoundingClientRect();
      const barRect=bar.getBoundingClientRect();
      return {
        height:row.height,
        inputCenterY:inputRect.top+parseFloat(inputStyle.paddingTop)+parseFloat(inputStyle.lineHeight)/2,
        avatarCenterY:avatar.top+avatar.height/2,
        actionOpacity:getComputedStyle(bar).opacity,
        aboveAvatar:avatar.top-row.top,
        belowAvatar:card.bottom-avatar.bottom,
        barTop:barRect.top,
        barBottom:barRect.bottom,
        barCenter:barRect.top+barRect.height/2,
        rowCenter:row.top+row.height/2
      };
    });
    assert.ok(Math.abs(inlineComposer.height-promptAlignment.promptHeight)<=1,'Inline editor keeps the collapsed reply height');
    assert.equal(inlineComposer.height,49);
    assert.equal(inlineComposer.aboveAvatar,11);
    assert.equal(inlineComposer.belowAvatar,10);
    const inlineTextOffset=inlineComposer.avatarCenterY-inlineComposer.inputCenterY;
    assert.ok(inlineTextOffset>=.5&&inlineTextOffset<=1.5,'Inline text sits one optical pixel above the avatar center');
    assert.ok(Math.abs(promptAlignment.labelCenterY-promptAlignment.avatarCenterY)<=.5,'Collapsed reply text centers with the avatar');
    assert.equal(inlineComposer.actionOpacity,'1');
    assert.ok(Math.abs(inlineComposer.barCenter-inlineComposer.rowCenter)<=.5,'Inline actions are vertically centered');
    const inlineReplyEditor=page.locator('.service-reply-editor--inline').first();
    const inlineReplyInput=inlineReplyEditor.locator('.service-reply-input');
    await inlineReplyInput.blur();
    await page.mouse.move(0,0);
    await page.waitForTimeout(360);
    const inlineIdle=await inlineReplyEditor.evaluate(row=>{
      const avatar=row.querySelector('.service-avatar');
      const input=row.querySelector('.service-reply-input');
      return {
        placeholder:getComputedStyle(input,'::before').color,
        avatarFill:getComputedStyle(avatar).backgroundColor,
        avatarColor:getComputedStyle(avatar).color,
        avatarOutline:getComputedStyle(avatar).boxShadow
      };
    });
    await inlineReplyEditor.hover();
    await page.waitForTimeout(260);
    const inlineHover=await inlineReplyEditor.evaluate(row=>{
      const avatar=row.querySelector('.service-avatar');
      const input=row.querySelector('.service-reply-input');
      return {
        placeholder:getComputedStyle(input,'::before').color,
        avatarFill:getComputedStyle(avatar).backgroundColor,
        avatarColor:getComputedStyle(avatar).color,
        avatarOutline:getComputedStyle(avatar).boxShadow
      };
    });
    assert.notEqual(inlineHover.placeholder,inlineIdle.placeholder,'Inline reply hover lights only the placeholder text');
    assert.deepEqual(
      [inlineHover.avatarFill,inlineHover.avatarColor,inlineHover.avatarOutline],
      [inlineIdle.avatarFill,inlineIdle.avatarColor,inlineIdle.avatarOutline],
      'Inline reply hover must not restyle the avatar'
    );
    await page.locator('.service-reply-editor--inline .service-reply-input').fill(Array.from({length:8},(_,index)=>`Inline growth line ${index+1}`).join('\n'));
    await page.waitForTimeout(40);
    const inlineGrowth=await page.locator('.service-reply-editor--inline .service-reply-input').evaluate(element=>element.getAnimations().map(animation=>({
      duration:animation.effect.getTiming().duration,
      frames:animation.effect.getKeyframes().map(frame=>frame.height)
    })).find(animation=>animation.duration===280));
    assert.ok(inlineGrowth,'Inline reply growth uses the shared 280ms layout-height animation');
    assert.notEqual(inlineGrowth.frames[0],inlineGrowth.frames[1]);
    await page.waitForTimeout(320);
    const inlineScroll=await page.locator('.service-reply-editor--inline .service-reply-input').evaluate(element=>{
      const host=element.closest('.service-reply-input-host');
      const track=host.querySelector(':scope>.wd-scroll-feedback');
      return {
        trackHidden:track.hidden,
        nativeScrollbar:getComputedStyle(element).scrollbarWidth,
        overflow:element.scrollHeight>element.clientHeight
      };
    });
    assert.equal(inlineScroll.trackHidden,false);
    assert.equal(inlineScroll.nativeScrollbar,'none');
    assert.equal(inlineScroll.overflow,true);
    const composerSeparation=await page.evaluate(()=>{
      const composer=document.querySelector('.service-reply-editor--standalone').getBoundingClientRect();
      const list=document.querySelector('.service-thread-list').getBoundingClientRect();
      return {composerBottom:composer.bottom,listTop:list.top};
    });
    assert.ok(composerSeparation.listTop-composerSeparation.composerBottom>=15,'Standalone composer does not overlap the thread list');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(80);
    const detailSpacing=await page.evaluate(()=>{
      const status=document.querySelector('.service-property-row--status');
      const rule=getComputedStyle(document.querySelector('.service-thread-replies')).borderTopColor.match(/[\d.]+/g).map(Number);
      return {statusHeight:status.getBoundingClientRect().height,statusBorder:getComputedStyle(status).borderBottomWidth,rule};
    });
    assert.ok(detailSpacing.statusHeight<=40,'Status row has no extra bottom gap');
    assert.equal(detailSpacing.statusBorder,'0px');
    assert.ok(detailSpacing.rule.length===4&&detailSpacing.rule[3]<=.11,'Thread rules stay subtle');
    assert.deepEqual(
      await page.locator('.service-user-badge').first().evaluate(element=>({
        size:getComputedStyle(element).fontSize,
        weight:getComputedStyle(element).fontWeight,
        lineHeight:getComputedStyle(element).lineHeight,
        height:getComputedStyle(element).height
      })),
      {size:'10px',weight:'400',lineHeight:'12px',height:'15px'}
    );
    assert.deepEqual(
      await page.locator('.service-comment .service-avatar').first().evaluate(element=>({
        width:getComputedStyle(element).getPropertyValue('--wd-avatar-outline-width').trim(),
        shadow:getComputedStyle(element).getPropertyValue('--wd-avatar-shadow').trim(),
        label:element.querySelector('.wd-avatar-label')?.textContent,
        labelTransform:element.querySelector('.wd-avatar-label')?getComputedStyle(element.querySelector('.wd-avatar-label')).transform:''
      })),
      {width:'.5px',shadow:'none',label:'KD',labelTransform:'matrix(1, 0, 0, 1, 0, 0.5)'}
    );
    assert.deepEqual(
      await page.locator('.service-ticket-paper .service-body-text').evaluate(element=>({
        size:getComputedStyle(element).fontSize,
        weight:getComputedStyle(element).fontWeight
      })),
      {size:'15px',weight:'400'}
    );
    assert.equal(await page.locator('.service-attachment-size').count(),0);
    let times=await page.locator('.service-comment-time').allTextContents();
    assert.match(times[0],/23 hours ago/);
    assert.match(times.at(-1),/25 minutes ago/);
    await page.locator('.service-sort-button').click();
    times=await page.locator('.service-comment-time').allTextContents();
    assert.match(times[0],/25 minutes ago/);
    const replyEditor=page.locator('.service-reply-editor');
    const replyInput=replyEditor.locator('.service-reply-input');
    const sendReply=replyEditor.getByRole('button',{name:'Send reply'});
    await replyInput.fill('Line one\nLine two\nLine three\nLine four');
    await page.waitForTimeout(40);
    const composerGrowth=await replyInput.evaluate(element=>element.getAnimations().map(animation=>({
      duration:animation.effect.getTiming().duration,
      frames:animation.effect.getKeyframes().map(frame=>frame.height)
    })).find(animation=>animation.duration===280));
    assert.ok(composerGrowth,'Standalone reply growth uses the shared 280ms layout-height animation');
    assert.notEqual(composerGrowth.frames[0],composerGrowth.frames[1]);
    assert.ok(await replyInput.evaluate(element=>element.getBoundingClientRect().height>32&&element.getBoundingClientRect().height<=180),'Multiline composer grows vertically within its cap');
    await replyInput.fill('A new local reply.');
    await page.waitForTimeout(40);
    assert.equal(await sendReply.isDisabled(),false);
    assert.equal(await sendReply.evaluate(element=>element.classList.contains('wd-button--primary')),true);
    await sendReply.click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.service-comment').count(),5);

    const ownReply=page.locator('#c-663-3');
    assert.equal(await page.locator('.service-comment').first().getByRole('button',{name:'Reply',exact:true}).count(),0);
    assert.equal(await page.locator('#c-663-1 .service-comment-actions').count(),0);
    const ownActions=ownReply.locator('.service-comment-actions');
    assert.deepEqual(
      await ownActions.evaluate(element=>({
        reveal:element.classList.contains('wd-hover-reveal'),
        host:element.closest('.service-comment').classList.contains('wd-hover-reveal-host'),
        property:getComputedStyle(element).transitionProperty,
        duration:getComputedStyle(element).transitionDuration,
        easing:getComputedStyle(element).transitionTimingFunction
      })),
      {
        reveal:true,
        host:true,
        property:'opacity',
        duration:'0.36s',
        easing:'cubic-bezier(0.3, 0, 0.2, 1)'
      }
    );
    await ownReply.hover();
    const ownActionsEntering=await ownActions.evaluate(element=>({
      duration:getComputedStyle(element).transitionDuration,
      easing:getComputedStyle(element).transitionTimingFunction
    }));
    assert.deepEqual(ownActionsEntering,{
      duration:'0.24s',
      easing:'cubic-bezier(0.16, 1, 0.3, 1)'
    });
    await page.waitForTimeout(120);
    const enteringOpacity=Number(await ownActions.evaluate(element=>getComputedStyle(element).opacity));
    assert.ok(enteringOpacity>0&&enteringOpacity<1,'Reply actions must fade in instead of appearing instantly');
    await page.waitForTimeout(260);
    assert.equal(await ownActions.evaluate(element=>getComputedStyle(element).opacity),'1');
    await page.mouse.move(900,1150);
    assert.equal(
      await ownActions.evaluate(element=>getComputedStyle(element).transitionDuration),
      '0.36s',
      'Reply actions must return to the shared exit duration after pointer leave'
    );
    await page.waitForTimeout(120);
    const leavingOpacity=Number(await ownActions.evaluate(element=>getComputedStyle(element).opacity));
    assert.ok(leavingOpacity>0&&leavingOpacity<1,'Reply actions must fade out instead of disappearing instantly');
    await page.waitForTimeout(380);
    assert.equal(await ownActions.evaluate(element=>getComputedStyle(element).opacity),'0');
    await ownReply.hover();
    await page.waitForTimeout(260);
    await ownReply.getByRole('button',{name:'Reply actions'}).click();
    assert.equal(await page.locator('.service-comment-menu').getByRole('menuitem',{name:'Edit'}).count(),1);
    assert.equal(await page.locator('.service-comment-menu').getByRole('menuitem',{name:'Delete'}).count(),1);
    assert.deepEqual(
      await page.locator('.service-comment-menu .wd-menu').evaluate(element=>({
        noHeading:element.classList.contains('wd-menu--no-heading'),
        paddingTop:getComputedStyle(element).paddingTop,
        paddingBottom:getComputedStyle(element).paddingBottom
      })),
      {noHeading:true,paddingTop:'10px',paddingBottom:'10px'}
    );
    const geometryBeforeEdit=await ownReply.evaluate(element=>{
      const card=element.closest('.service-thread-card');
      const head=element.querySelector('.service-comment-head');
      const body=element.querySelector('.service-comment-body');
      return {
        cardTop:card.getBoundingClientRect().top,
        cardHeight:card.getBoundingClientRect().height,
        headTop:head.getBoundingClientRect().top,
        headHeight:head.getBoundingClientRect().height,
        bodyTop:body.getBoundingClientRect().top,
        bodyGap:body.getBoundingClientRect().top-head.getBoundingClientRect().bottom
      };
    });
    await page.locator('.service-comment-menu').getByRole('menuitem',{name:'Edit'}).click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#c-663-3 .service-comment-head').count(),1);
    assert.equal(await page.locator('#c-663-3 .service-comment-name').textContent(),'Carl Wang');
    assert.equal(await page.locator('#c-663-3 .service-comment-edit').count(),1);
    const geometryDuringEdit=await page.locator('#c-663-3').evaluate(element=>{
      const card=element.closest('.service-thread-card');
      const head=element.querySelector('.service-comment-head');
      const editor=element.querySelector('.service-comment-edit');
      return {
        cardTop:card.getBoundingClientRect().top,
        cardHeight:card.getBoundingClientRect().height,
        headTop:head.getBoundingClientRect().top,
        headHeight:head.getBoundingClientRect().height,
        editorTop:editor.getBoundingClientRect().top,
        editorGap:editor.getBoundingClientRect().top-head.getBoundingClientRect().bottom,
        promptCount:card.querySelectorAll('.service-thread-reply-prompt').length
      };
    });
    assert.equal(geometryDuringEdit.promptCount,1);
    assert.ok(Math.abs(geometryDuringEdit.cardTop-geometryBeforeEdit.cardTop)<.5,'Editing must not move the reply card');
    assert.ok(Math.abs(geometryDuringEdit.cardHeight-geometryBeforeEdit.cardHeight)<.5,'Editing must not resize the reply card');
    assert.ok(Math.abs(geometryDuringEdit.headTop-geometryBeforeEdit.headTop)<.5,'Editing must not move the author row');
    assert.ok(Math.abs(geometryDuringEdit.headHeight-geometryBeforeEdit.headHeight)<.5,'Editing must not collapse the author row');
    assert.ok(Math.abs(geometryDuringEdit.editorTop-geometryBeforeEdit.bodyTop)<.5,'Editing must keep the body at the displayed text position');
    assert.equal(geometryBeforeEdit.bodyGap,0);
    assert.equal(geometryDuringEdit.editorGap,0);
    const editActions=page.locator('#c-663-3 .service-editor-actions');
    assert.deepEqual(
      await editActions.evaluate(element=>[...element.children].map(child=>
        child.classList.contains('service-attachment-trigger')?'attachment':
        child.classList.contains('service-reply-cancel')?'cancel':
        child.classList.contains('service-reply-send')?'send':'other'
      )),
      ['attachment','cancel','send']
    );
    const cancelAlignment=await editActions.evaluate(element=>{
      const [attachment,cancel,send]=[...element.children].map(child=>child.getBoundingClientRect());
      const cancelIcon=element.querySelector('.service-reply-cancel .service-icon').getBoundingClientRect();
      const sendIcon=element.querySelector('.service-reply-send .service-send-icon').getBoundingClientRect();
      return {
        ordered:attachment.right<cancel.left&&cancel.right<send.left,
        centreDelta:Math.max(
          Math.abs((attachment.top+attachment.height/2)-(cancel.top+cancel.height/2)),
          Math.abs((send.top+send.height/2)-(cancel.top+cancel.height/2))
        ),
        cancelIcon:{width:cancelIcon.width,height:cancelIcon.height},
        sendIcon:{width:sendIcon.width,height:sendIcon.height}
      };
    });
    assert.equal(cancelAlignment.ordered,true,'Cancel must sit between attachment and send');
    assert.ok(cancelAlignment.centreDelta<.5,'Reply edit actions must share one vertical centre');
    assert.deepEqual(cancelAlignment.cancelIcon,{width:10,height:10});
    assert.deepEqual(cancelAlignment.sendIcon,{width:16,height:16});
    const originalReplyBody=(await page.locator('#c-663-3 .service-comment-body').count())
      ? await page.locator('#c-663-3 .service-comment-body').textContent()
      : 'I will inspect the MPPT thresholds and check the site history tomorrow morning.';
    await editActions.getByRole('button',{name:'Cancel'}).click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#c-663-3 .service-comment-edit').count(),0);
    assert.equal((await page.locator('#c-663-3 .service-comment-body').textContent()).trim(),originalReplyBody.trim());
    await page.locator('#c-663-3').hover();
    await page.waitForTimeout(260);
    await page.locator('#c-663-3').getByRole('button',{name:'Reply actions'}).click();
    await page.locator('.service-comment-menu').getByRole('menuitem',{name:'Edit'}).click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#c-663-3 .service-comment-edit').count(),1);
    assert.equal(await page.locator('.service-reply-editor--standalone').count(),1);
    assert.equal(await page.locator('.service-detail .wd-button--primary').count(),1);
    await page.locator('#c-663-3 .service-reply-input').fill('Edited local reply.');
    await page.getByRole('button',{name:'Save reply'}).click();
    await page.waitForFunction(()=>{
      const body=document.querySelector('#c-663-3 .service-comment-body');
      return !body||body.textContent.trim()==='Edited local reply.';
    });
    assert.equal((await page.locator('#c-663-3 .service-comment-body').textContent()).trim(),'Edited local reply.');
    await page.locator('#c-663-3').hover();
    await page.waitForTimeout(260);
    await page.locator('#c-663-3').getByRole('button',{name:'Reply actions'}).click();
    await page.locator('.service-comment-menu').getByRole('menuitem',{name:'Delete'}).click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#c-663-3').count(),0);

    await page.getByRole('button',{name:'Mark as closed'}).click();
    assert.equal(await page.locator('.service-closed-note').count(),1);
    assert.equal(await page.locator('.service-reply-editor').count(),0);

    // Editing the ticket reuses the final title/body locations, then returns to
    // the read state without leaving the route.
    await page.goto(`${origin}/service/st-25638642`,{waitUntil:'domcontentloaded'});
    await ready();
    const moreAlignment=await page.evaluate(()=>{
      const button=document.querySelector('.service-more-button');
      const more=button.getBoundingClientRect();
      const icon=button.querySelector('.service-more-icon').getBoundingClientRect();
      const row=document.querySelector('.service-detail-title-row').getBoundingClientRect();
      return {
        moreRight:more.right,
        rowRight:row.right,
        headerActionCount:document.querySelectorAll('.service-detail-header .wd-page-actions > *').length,
        buttonWidth:more.width,
        buttonHeight:more.height,
        buttonCenterY:more.top+more.height/2,
        iconCenterY:icon.top+icon.height/2,
        label:button.getAttribute('aria-label')
      };
    });
    assert.ok(Math.abs(moreAlignment.moreRight-moreAlignment.rowRight)<1,'More aligns with the title row right edge');
    assert.equal(moreAlignment.headerActionCount,0);
    assert.equal(moreAlignment.buttonWidth,36);
    assert.equal(moreAlignment.buttonHeight,36);
    assert.ok(Math.abs(moreAlignment.buttonCenterY-moreAlignment.iconCenterY)<.5);
    assert.equal(moreAlignment.label,'Ticket actions');
    const displayTypography=await page.evaluate(()=>{
      const style=element=>{
        const css=getComputedStyle(element);
        return {fontFamily:css.fontFamily,fontSize:css.fontSize,fontWeight:css.fontWeight,lineHeight:css.lineHeight,color:css.color};
      };
      return {
        title:style(document.querySelector('.service-detail-title')),
        body:style(document.querySelector('.service-ticket-paper .service-body-text')),
        titleTop:document.querySelector('.service-detail-title').getBoundingClientRect().top,
        bodyTop:document.querySelector('.service-ticket-paper .service-body-text').getBoundingClientRect().top,
        bodyBottom:document.querySelector('.service-ticket-paper .service-body-text').getBoundingClientRect().bottom,
        attachmentTop:document.querySelector('.service-ticket-paper .service-attachment')?.getBoundingClientRect().top,
        threadTop:document.querySelector('.service-thread').getBoundingClientRect().top
      };
    });
    await page.locator('.service-more-button').click();
    const ticketMenu=page.locator('.service-more-menu .wd-menu');
    assert.equal(await ticketMenu.getByRole('heading').count(),0,'Ticket actions menu must not render a visible heading');
    assert.deepEqual(
      await ticketMenu.evaluate(element=>({
        noHeading:element.classList.contains('wd-menu--no-heading'),
        ariaLabel:element.getAttribute('aria-label'),
        paddingTop:getComputedStyle(element).paddingTop,
        paddingBottom:getComputedStyle(element).paddingBottom
      })),
      {noHeading:true,ariaLabel:'Ticket actions',paddingTop:'10px',paddingBottom:'10px'}
    );
    await page.locator('.service-more-menu').getByRole('menuitem',{name:'Edit ticket'}).click();
    await page.waitForFunction(()=>document.activeElement?.classList.contains('service-detail-title-input'));
    const titleFocus=await page.locator('.service-detail-title-input').evaluate(input=>({
      start:input.selectionStart,
      end:input.selectionEnd,
      length:input.value.length
    }));
    assert.equal(titleFocus.start,titleFocus.length,'editing focuses the caret after the title');
    assert.equal(titleFocus.end,titleFocus.length);
    const entryMotion=await page.locator('.service-ticket-edit .service-inline-editor-actions').evaluate(actions=>
      [...actions.children].map(button=>button.getAnimations()
        .filter(animation=>animation.effect.getKeyframes().some(frame=>frame.opacity!==undefined))
        .map(animation=>({
          delay:animation.effect.getTiming().delay,
          transforms:animation.effect.getKeyframes().map(frame=>frame.transform).filter(Boolean)
        }))
      )
    );
    assert.deepEqual(entryMotion.map(animations=>animations[0]?.delay),[0,35,70]);
    assert.equal(entryMotion.flat().every(animation=>animation.transforms.length===0),true,'editor action fades must stay in place');
    await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
    const editorGeometry=await page.evaluate(()=>({
      titleTop:document.querySelector('.service-detail-title-input').getBoundingClientRect().top,
      titleHeight:document.querySelector('.service-detail-title-input').getBoundingClientRect().height,
      titleMarginBottom:getComputedStyle(document.querySelector('.service-detail-title-input')).marginBottom,
      bodyTop:document.querySelector('.service-ticket-body-input').getBoundingClientRect().top,
      attachmentTop:document.querySelector('.service-ticket-edit .service-attachment')?.getBoundingClientRect().top,
      threadTop:document.querySelector('.service-thread').getBoundingClientRect().top
    }));
    assert.ok(Math.abs(editorGeometry.titleTop-displayTypography.titleTop)<1,'entering edit mode must not move the title row');
    assert.equal(editorGeometry.titleHeight,25,'editing title uses the display line box height');
    assert.equal(editorGeometry.titleMarginBottom,'11px',"the title's original row height is preserved below its line box");
    assert.ok(Math.abs(editorGeometry.bodyTop-displayTypography.bodyTop)<1,'entering edit mode must not move the body');
    assert.ok(Math.abs(editorGeometry.attachmentTop-displayTypography.attachmentTop)<1,'entering edit mode must not move attachments');
    assert.ok(editorGeometry.threadTop>displayTypography.threadTop+20,'lower content settles below the expanded editor');
    assert.equal(await page.locator('.service-detail-title-input').count(),1);
    assert.equal(await page.locator('.service-ticket-body-input').count(),1);
    assert.equal(await page.locator('.service-detail .wd-button--primary').count(),1);
    assert.equal(await page.locator('.service-ticket-edit .service-editor-toolbar').count(),0);
    assert.equal(await page.locator('.service-ticket-edit .service-editor-note').count(),0);
    assert.equal(await page.locator('.service-ticket-edit .service-text-button').count(),0);
    assert.equal((await page.locator('.service-ticket-edit .service-attachment-trigger').textContent()).trim(),'');
    assert.equal(await page.locator('.service-ticket-edit .service-attachment-trigger').getAttribute('aria-label'),'Add image or file');
    const replyPromptCount=await page.locator('.service-thread-reply-prompt').count();
    assert.ok(replyPromptCount>0,'thread reply prompts remain available while editing the ticket');
    await page.locator('.service-thread-reply-prompt').first().click();
    await page.waitForTimeout(160);
    assert.equal(await page.locator('.service-ticket-edit').count(),1,'ticket editor and reply composer must coexist');
    assert.equal(await page.locator('.service-reply-editor--inline').count(),1);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(160);
    assert.equal(await page.locator('.service-reply-editor--inline').count(),0);
    assert.equal(await page.locator('.service-ticket-edit').count(),1,'closing a reply composer must keep the ticket editor open');
    const editorTypography=await page.evaluate(()=>{
      const style=element=>{
        const css=getComputedStyle(element);
        return {fontFamily:css.fontFamily,fontSize:css.fontSize,fontWeight:css.fontWeight,lineHeight:css.lineHeight,color:css.color};
      };
      return {
        title:style(document.querySelector('.service-detail-title-input')),
        body:style(document.querySelector('.service-ticket-body-input'))
      };
    });
    assert.deepEqual(editorTypography,{title:displayTypography.title,body:displayTypography.body},'ticket editing keeps the display typography');
    const bodyEditor=page.locator('.service-ticket-body-input');
    const bodyBeforeResize=await bodyEditor.evaluate(element=>({
      height:element.getBoundingClientRect().height,
      resize:getComputedStyle(element).resize,
      overflow:getComputedStyle(element).overflowY,
      border:getComputedStyle(element).borderBottomWidth,
      outline:getComputedStyle(element).outlineStyle
    }));
    assert.equal(bodyBeforeResize.resize,'none');
    assert.equal(bodyBeforeResize.overflow,'hidden');
    assert.equal(bodyBeforeResize.border,'0px');
    assert.equal(bodyBeforeResize.outline,'none');
    assert.equal(await page.locator('.service-detail-title-input').evaluate(element=>getComputedStyle(element).outlineStyle),'none');
    await bodyEditor.fill(Array.from({length:10},(_,index)=>`Editable detail line ${index+1}`).join('\n'));
    await page.waitForTimeout(320);
    const bodyAfterResize=await bodyEditor.evaluate(element=>({
      height:element.getBoundingClientRect().height,
      scrollHeight:element.scrollHeight,
      clientHeight:element.clientHeight
    }));
    assert.ok(bodyAfterResize.height>bodyBeforeResize.height+100,'the ticket body grows with its content');
    assert.ok(Math.abs(bodyAfterResize.scrollHeight-bodyAfterResize.clientHeight)<=1,'the auto-growing ticket body does not scroll internally');
    await page.locator('.service-detail-title-input').fill('Updated in place');
    await page.getByRole('button',{name:'Save changes'}).click();
    assert.equal((await page.locator('.service-detail-title').textContent()).trim(),'Updated in place');
    const savedAttachmentGeometry=await page.evaluate(()=>({
      bodyTop:document.querySelector('.service-ticket-paper .service-body-text').getBoundingClientRect().top,
      bodyBottom:document.querySelector('.service-ticket-paper .service-body-text').getBoundingClientRect().bottom,
      attachmentTop:document.querySelector('.service-ticket-paper .service-attachment').getBoundingClientRect().top
    }));
    assert.ok(
      Math.abs(
        (savedAttachmentGeometry.attachmentTop-savedAttachmentGeometry.bodyBottom)-
        (displayTypography.attachmentTop-displayTypography.bodyBottom)
      )<1,
      'saving must retain the display-state spacing above attachments'
    );
    assert.equal(new URL(page.url()).pathname,'/service/st-25638642');

    await page.goto(`${origin}/service/not-a-ticket`,{waitUntil:'domcontentloaded'});
    await ready();
    assert.equal(await page.title(),'WattDesk · Ticket not found');
    assert.equal((await page.locator('.service-detail-missing-title').textContent()).trim(),'Ticket not found');

    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();
    await page.locator('.service-card[data-ticket-id="st-25638663"]').click();
    await page.waitForTimeout(320);
    await page.locator('.target-nav[data-route="home"]').click();
    await page.waitForTimeout(320);
    const serviceRecentTitle='Service ticket / MPPT charge reduces to zero for no reason';
    const serviceRecent=page.locator(`[data-recent-visit="true"][aria-label="${serviceRecentTitle}"]`);
    assert.equal(await serviceRecent.count(),1);
    const recentPathParts=await serviceRecent.locator('.wd-history-path-part').evaluateAll(parts=>parts.map(part=>part.textContent.trim()));
    assert.equal(recentPathParts[0],'Service ticket','the Home summary keeps the immediate parent before shortening the leaf');
    assert.equal(recentPathParts[1],'/');
    assert.match(recentPathParts[2],/…/,'the terminal page name keeps both its head and tail');
    const recentSeparatorPadding=await serviceRecent.locator('.wd-history-path-part--separator').evaluate(separator=>({
      left:getComputedStyle(separator).paddingLeft,
      right:getComputedStyle(separator).paddingRight
    }));
    assert.deepEqual(recentSeparatorPadding,{left:'4px',right:'4px'},'the slash keeps a visible space on both sides');
    const homePathUse=await serviceRecent.locator('.recent-visit-path').evaluate(element=>{
      const path=element.querySelector('.wd-history-path');
      return {
        available:element.getBoundingClientRect().width,
        used:[...path.children].reduce((sum,part)=>sum+part.getBoundingClientRect().width,0),
        overflow:path.scrollWidth>path.clientWidth+1
      };
    });
    assert.equal(homePathUse.overflow,false,'the Home recent path must not overflow');
    assert.ok(homePathUse.used>=homePathUse.available-18,`the Home recent path must use its available width: ${JSON.stringify(homePathUse)}`);

    await page.locator('.target-history').click();
    await page.waitForTimeout(320);
    const recentHistory=page.locator(`.wd-history-row[aria-label="${serviceRecentTitle}"]`).first();
    assert.ok(await recentHistory.count());
    const historyPathParts=await recentHistory.locator('.wd-history-path-part').evaluateAll(parts=>parts.map(part=>part.textContent.trim()));
    assert.equal(historyPathParts[0],'Service ticket','the history popover keeps the immediate parent');
    assert.match(historyPathParts.at(-1),/…/,'the history popover uses the same middle ellipsis for the terminal name');
    const historySeparatorPadding=await recentHistory.locator('.wd-history-path-part--separator').evaluate(separator=>({
      left:getComputedStyle(separator).paddingLeft,
      right:getComputedStyle(separator).paddingRight
    }));
    assert.deepEqual(historySeparatorPadding,{left:'4px',right:'4px'},'the history popover slash keeps spaces on both sides');
    const popoverPathUse=await recentHistory.locator('.wd-history-path').evaluate(element=>({
      available:element.parentElement.getBoundingClientRect().width,
      used:[...element.children].reduce((sum,part)=>sum+part.getBoundingClientRect().width,0),
      overflow:element.scrollWidth>element.clientWidth+1
    }));
    assert.equal(popoverPathUse.overflow,false,'the history popover path must not overflow');
    assert.ok(popoverPathUse.used>=popoverPathUse.available-18,`the history popover path must use its available width: ${JSON.stringify(popoverPathUse)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);

    await page.evaluate(()=>localStorage.removeItem('wattdesk-home-theme'));
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();
    await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
    await page.waitForTimeout(700);
    await page.screenshot({path:'tests/output/service-ticket-light.png'});
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(320);
    const lightDiscussionSurfaces=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('.service-thread-card')];
      const cardStyles=cards.map(card=>getComputedStyle(card));
      const composer=document.querySelector('.service-reply-editor--standalone');
      const properties=document.querySelector('.service-properties');
      return {
        theme:document.documentElement.dataset.theme,
        cardBackgrounds:cardStyles.map(style=>style.backgroundColor),
        replyShadows:cardStyles.map(style=>style.boxShadow),
        replyRadius:cardStyles.every(style=>style.borderRadius==='18px'),
        replyGeometry:cards.every(card=>card.dataset.cornerProfile==='continuous'&&getComputedStyle(card).cornerShape==='superellipse(1.2)'),
        composerBackground:getComputedStyle(composer).backgroundColor,
        composerShadow:getComputedStyle(composer).boxShadow,
        propertiesBackground:getComputedStyle(properties).backgroundColor,
        propertiesShadow:getComputedStyle(properties).boxShadow
      };
    });
    assert.equal(lightDiscussionSurfaces.theme,'light');
    assert.ok(lightDiscussionSurfaces.replyShadows.length>0);
    assert.ok(lightDiscussionSurfaces.replyShadows.every(shadow=>shadow==='none'),'light reply cards hide the inset border and bottom shadow');
    assert.ok(lightDiscussionSurfaces.cardBackgrounds.every(color=>color==='rgb(255, 255, 255)'),'light reply cards use the white shared surface');
    assert.equal(lightDiscussionSurfaces.composerBackground,'rgb(255, 255, 255)');
    assert.equal(lightDiscussionSurfaces.composerShadow,'none','the light top reply composer also hides its inset border and shadow');
    assert.equal(lightDiscussionSurfaces.propertiesBackground,'rgb(255, 255, 255)');
    assert.equal(lightDiscussionSurfaces.propertiesShadow,'none','light Properties uses the same flat white surface');
    assert.equal(lightDiscussionSurfaces.replyRadius,true);
    assert.equal(lightDiscussionSurfaces.replyGeometry,true);
    const lightTextContrast=await page.evaluate(()=>{
      const selectors=[
        '.service-ticket-paper .service-body-text',
        '.service-properties .service-property-label',
        '.service-properties .service-meta-label',
        '.service-comment-time',
        '.service-reply-context',
        '.service-status-toggle'
      ];
      const channel=value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
      return selectors.map(selector=>{
        const color=getComputedStyle(document.querySelector(selector)).color;
        const values=color.match(/[\d.]+/g).map(Number).slice(0,3);
        const rgb=color.startsWith('color(srgb')?values:values.map(value=>value/255);
        const luminance=.2126*channel(rgb[0])+.7152*channel(rgb[1])+.0722*channel(rgb[2]);
        return {selector,color,contrast:(1.05)/(luminance+.05)};
      });
    });
    assert.ok(lightTextContrast.every(item=>item.contrast>=4.5),`Service Ticket light labels must stay readable: ${JSON.stringify(lightTextContrast)}`);
    const lightReplyPrompt=page.locator('.service-thread-reply-prompt').first();
    const idlePromptColor=await lightReplyPrompt.evaluate(element=>getComputedStyle(element).color);
    await lightReplyPrompt.hover();
    await page.waitForTimeout(280);
    const hoverPromptColor=await lightReplyPrompt.evaluate(element=>getComputedStyle(element).color);
    assert.equal(idlePromptColor,'color(srgb 0.55 0.55 0.55)');
    assert.equal(hoverPromptColor,'rgb(0, 0, 0)');
    await page.mouse.move(20,1100);
    await page.waitForTimeout(380);
    await page.screenshot({path:'tests/output/service-ticket-detail-light.png'});

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();
    const reducedCard=page.locator('.service-card').first();
    await reducedCard.hover({position:{x:260,y:80}});
    await page.waitForTimeout(180);
    assert.deepEqual(
      await reducedCard.evaluate(card=>({
        scale:card.style.getPropertyValue('--service-card-scale'),
        tiltX:card.style.getPropertyValue('--service-card-tilt-x'),
        tiltY:card.style.getPropertyValue('--service-card-tilt-y'),
        active:card.hasAttribute('data-flip-interaction'),
        glare:getComputedStyle(card.querySelector('.service-card-glare')).opacity
      })),
      {scale:'1.0000',tiltX:'0.000deg',tiltY:'0.000deg',active:false,glare:'0'}
    );

    await page.setViewportSize({width:420,height:900});
    await page.goto(`${origin}/service`,{waitUntil:'domcontentloaded'});
    await ready();
    const compactLayout=await page.evaluate(()=>({
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth,
      columns:getComputedStyle(document.querySelector('.service-card-grid')).gridTemplateColumns.split(' ').length,
      scopeWidth:document.querySelector('.service-scope').getBoundingClientRect().width,
      toolbarWidth:document.querySelector('.service-toolbar').getBoundingClientRect().width
    }));
    assert.equal(compactLayout.documentWidth,compactLayout.viewportWidth);
    assert.equal(compactLayout.columns,1);
    assert.ok(compactLayout.scopeWidth<=compactLayout.toolbarWidth);
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(320);
    const detailColumns=await page.locator('.service-detail-content').evaluate(element=>
      getComputedStyle(element).gridTemplateColumns.split(' ').length
    );
    assert.equal(detailColumns,1);

    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({ok:true,cardHeights,errors},null,2));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
