const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({...launchOptions,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1545,height:1252}});
    const errors=[];
    page.on('pageerror',(error)=>errors.push(error.message));
    page.on('response',(response)=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
    await page.goto(previewURL,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await page.waitForTimeout(500);

    const sidebarCaps=await page.evaluate(()=>[...document.querySelectorAll('.target-shortcut kbd')].map((cap)=>({
      text:cap.textContent,
      font:getComputedStyle(cap).fontFamily,
      size:getComputedStyle(cap).fontSize,
      weight:getComputedStyle(cap).fontWeight,
      color:getComputedStyle(cap).color,
      background:getComputedStyle(cap).backgroundColor,
    })));
    assert.equal(sidebarCaps.length,2,'The sidebar shortcut must contain two keycaps');
    const signature=(cap)=>JSON.stringify([cap.font,cap.size,cap.weight,cap.color,cap.background]);
    assert.equal(signature(sidebarCaps[0]),signature(sidebarCaps[1]),'Both keycaps must share one style');
    assert.match(sidebarCaps[0].font,/SF Pro/,'Keycaps must use SF Pro');
    assert.equal(sidebarCaps[0].size,'13px','Keycaps must use Footnote/Regular');
    assert.equal(sidebarCaps[0].weight,'400','Keycaps must use Footnote/Regular');

    const inlineHost=page.locator('[data-node-id="14445:3354"]');
    const inlineBox=await inlineHost.boundingBox();
    const inline=await page.evaluate(()=>{
      const group=document.querySelector('[data-node-id="I14445:3354;14420:2221;14420:2197"]');
      return {
        caps:[...group.querySelectorAll('kbd')].map((cap)=>({
          text:cap.textContent,
          font:getComputedStyle(cap).fontFamily,
          size:getComputedStyle(cap).fontSize,
          weight:getComputedStyle(cap).fontWeight,
          color:getComputedStyle(cap).color,
          background:getComputedStyle(cap).backgroundColor,
        })),
        boxes:[...group.querySelectorAll('kbd')].map((cap)=>cap.getBoundingClientRect().toJSON()),
        field:document.querySelector('[data-node-id="14445:3354"]').getBoundingClientRect().toJSON(),
      };
    });
    assert.deepEqual(inline.caps.map(signature),sidebarCaps.map(signature),'Sidebar and inline keycaps must share the component style');
    assert.equal(Math.round(inline.boxes[1].left-inline.boxes[0].right),4,'Inline keycaps must keep a 4px gap');
    assert.ok(Math.abs(inline.field.right-20-inline.boxes[1].right)<1,'Inline keycaps must end 20px inside the field');

    const inlineCenter={x:inlineBox.x+24,y:inlineBox.y+inlineBox.height/2};
    await page.mouse.move(inlineCenter.x,inlineCenter.y);
    await page.mouse.down();
    await page.waitForTimeout(180);
    const inlinePressed=await inlineHost.evaluate((node)=>({transform:getComputedStyle(node).transform,box:node.getBoundingClientRect().toJSON()}));
    await page.mouse.up();
    assert.equal(inlinePressed.transform,'matrix(1, 0, 0, 1, 0, 0)','Clicking the inline field must not scale it');
    assert.equal(inlinePressed.box.width,inlineBox.width);assert.equal(inlinePressed.box.height,inlineBox.height);

    await page.locator('input[aria-label="Search sites, devices and people"]').click();
    await page.waitForTimeout(600);
    const panel=await page.evaluate(()=>{
      const field=document.querySelector('[data-node-id="14445:3354"]').getBoundingClientRect();
      const popup=document.querySelector('.wd-search-panel').getBoundingClientRect();
      return {
        gap:popup.top-field.bottom,
        width:popup.width,
        hints:[...document.querySelectorAll('.wd-search-hint-item')].map((node)=>node.textContent),
        hintFont:getComputedStyle(document.querySelector('.wd-search-hint')).fontFamily,
        navKeys:document.querySelectorAll('.wd-search-hint-item:first-child kbd').length,
        quickMeta:document.querySelectorAll('.wd-search-quick-link .wd-search-result-meta').length,
        hintTags:[...document.querySelectorAll('.wd-search-hint-item')].map((node)=>node.tagName),
      };
    });
    assert.ok(panel.gap>=8,'Inline results must remain a separate surface');
    assert.equal(panel.width,inlineBox.width,'Inline results must match the field width');
    assert.deepEqual(panel.hints,['↑ ↓Navigate','EnterOpen','EscClose']);
    assert.deepEqual(panel.hintTags,['BUTTON','BUTTON','BUTTON'],'Search hints must be real controls');
    assert.match(panel.hintFont,/SF Pro/);
    assert.equal(panel.navKeys,1,'Arrow navigation uses one combined keycap');
    assert.equal(panel.quickMeta,0,'Quick links must not repeat a second Pages line');

    const resultInput=page.locator('input[aria-label="Search sites, devices and people"]');
    await resultInput.fill('p');
    await page.waitForTimeout(180);
    const resultStart=await page.evaluate(()=>{
      const rows=[...document.querySelectorAll('.wd-search-panel [role="option"]')];
      const active=rows.find((row)=>row.getAttribute('aria-selected')==='true');
      const title=active?.querySelector('.wd-search-result-title');
      const meta=active?.querySelector('.wd-search-result-meta');
      const box=(node)=>node?.getBoundingClientRect().toJSON();
      return {
        rowCount:rows.length,
        activeIndex:rows.indexOf(active),
        row:box(active),title:box(title),meta:box(meta),
        titleColor:title&&getComputedStyle(title).color,
        metaColor:meta&&getComputedStyle(meta).color,
        metaText:meta?.textContent,
      };
    });
    assert.ok(resultStart.rowCount>1,'The query must expose several results for navigation');
    assert.equal(resultStart.activeIndex,0,'A queried result list must start on the first row');
    assert.equal(resultStart.row.height,40,'Result rows must keep their 40px height');
    assert.equal(Math.round(resultStart.title.top-resultStart.row.top),10,'Single-line title must stay vertically centred');
    assert.equal(Math.round(resultStart.meta.top-resultStart.row.top),12,'The group label must sit on the title line');
    assert.equal(Math.round(resultStart.meta.left-resultStart.title.right),4,'The group label must follow a single word space');
    assert.match(resultStart.metaText,/^- /,'The group label must read as a property of the title');
    assert.match(resultStart.titleColor,/255, 255, 255/,'The title must use the primary label colour');
    assert.notEqual(resultStart.metaColor,resultStart.titleColor,'The group label must use a secondary colour');

    await page.locator('.wd-search-hint-item[data-action="navigate"]').click();
    await page.waitForTimeout(150);
    const afterNavigate=await page.evaluate(()=>({
      index:[...document.querySelectorAll('.wd-search-panel [role="option"]')].findIndex((row)=>row.getAttribute('aria-selected')==='true'),
      focus:document.activeElement?.getAttribute('aria-label'),
    }));
    assert.equal(afterNavigate.index,1,'Navigate must move the active result');
    assert.equal(afterNavigate.focus,'Search sites, devices and people','Pointer commands must leave typing focus in the field');

    await page.locator('.wd-search-hint-item[data-action="open"]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.wd-search-panel').count(),0,'Open must dismiss the inline surface');
    assert.equal(await page.locator('.workspace-tab').count(),1,'Opening a result must not create a new tab');

    const inlinePlaceholder=await page.locator('input[aria-label="Search sites, devices and people"]').getAttribute('placeholder');
    assert.ok(inlinePlaceholder,'The inline field must declare its default copy');
    await page.locator('input[aria-label="Search sites, devices and people"]').fill('555');
    await page.waitForTimeout(400);
    const empty=await page.evaluate(()=>{
      const node=document.querySelector('.wd-search-empty');
      return {text:node?.textContent,size:getComputedStyle(node).fontSize,weight:getComputedStyle(node).fontWeight};
    });
    assert.match(empty.text,/No results for "555"/);
    assert.equal(empty.size,'13px','Empty state must use Footnote/Regular');
    assert.equal(empty.weight,'400','Empty state must use Footnote/Regular');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+k');
    // Measure the resting capsule, not a mid-entrance frame: the shared
    // entrance overshoots slightly before settling at 816x46.
    await page.waitForFunction(()=>!document.querySelector('.wd-search-fullscreen')?.hasAttribute('data-entering'));
    await page.waitForTimeout(60);
    const full=await page.evaluate(()=>{
      const field=document.querySelector('.wd-search-field');
      const box=field.getBoundingClientRect();
      const popup=document.querySelector('.wd-search-panel--fullscreen').getBoundingClientRect();
      const fill=field.querySelector('.wd-glass-fill');
      const clear=field.querySelector('.wd-input-clear');
      const inlineField=document.querySelector('[data-node-id="14445:3354"]');
      const inlineFill=inlineField.querySelector('.wd-glass-fill');
      const glyph=field.querySelector('.wd-search-field-icon .target-icon-art');
      return {
        field:{width:box.width,height:box.height,radius:getComputedStyle(field).borderRadius,top:box.top,bottom:box.bottom},
        panelTop:popup.top,
        shortcut:field.querySelector('kbd')?.textContent||null,
        value:field.querySelector('.wd-search-input').value,
        placeholder:field.querySelector('.wd-search-input').placeholder,
        clearVisible:!clear.hidden,
        backdrop:getComputedStyle(document.querySelector('.wd-search-backdrop')).backdropFilter,
        glass:{
          background:getComputedStyle(fill).backgroundColor,
          backdrop:getComputedStyle(fill).backdropFilter,
          inlineBackground:getComputedStyle(inlineFill).backgroundColor,
          inlineBackdrop:getComputedStyle(inlineFill).backdropFilter,
        },
        iconMask:glyph.style.getPropertyValue('--icon-mask'),
      };
    });
    assert.deepEqual({width:full.field.width,height:full.field.height,radius:full.field.radius},{width:816,height:46,radius:'23px'});
    assert.ok(full.panelTop>=full.field.bottom+8,'The fullscreen panel must start below the fixed capsule');
    assert.equal(full.shortcut,null,'Fullscreen search must not repeat Ctrl K');
    assert.equal(full.placeholder,inlinePlaceholder,'Both search fields must share one default placeholder');
    assert.equal(full.value,'555','Opening fullscreen must carry over the inline query');
    assert.equal(full.clearVisible,true,'A carried-over query must expose the clear button');
    assert.match(full.backdrop,/blur\(28px\)/);
    assert.equal(full.glass.background,full.glass.inlineBackground,'Both fields must share one glass fill');
    assert.equal(full.glass.backdrop,full.glass.inlineBackdrop,'Both fields must share one backdrop filter');
    assert.match(full.iconMask,/masks\/asset-35\.svg/,'Fullscreen must use the Home magnifier with an opaque mask');
    assert.match(full.glass.background,/153, 153, 153/,'The field must keep the shared glass tint');

    // Light mode needs its own veil. The shared activity tint turns the whole
    // page into a grey sheet behind the search, so keep the page recognizable
    // and give the result sheet a softer contact/depth shadow than cards.
    await page.evaluate(()=>{localStorage.setItem('wattdesk-home-theme','light')});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true'&&document.documentElement.dataset.theme==='light');
    await page.waitForTimeout(700);
    await page.keyboard.press('Control+k');
    await page.waitForFunction(()=>{const root=document.querySelector('.wd-search-fullscreen');return root&&!root.hasAttribute('data-entering')});
    await page.waitForTimeout(120);
    const lightSearch=await page.evaluate(()=>{
      const veil=getComputedStyle(document.querySelector('.wd-search-backdrop'));
      const panel=document.querySelector('.wd-search-panel--fullscreen');
      const fill=getComputedStyle(panel.querySelector('.wd-glass-fill'));
      return {tint:veil.backgroundColor,blur:veil.backdropFilter,shadow:fill.boxShadow};
    });
    assert.equal(lightSearch.tint,'rgba(0, 0, 0, 0.1)','The light veil must let the page show through');
    assert.match(lightSearch.blur,/blur\(16px\)/,'The light veil must use the lighter search frost');
    assert.match(lightSearch.shadow,/rgba\(0, 0, 0, 0\.055\) 0px 16px 34px/,'The search sheet must not use the dense card drop');
    assert.match(lightSearch.shadow,/rgba\(0, 0, 0, 0\.02\) 0px 2px 4px -1px/,'The search sheet must keep only a faint contact shadow');
    assert.match(lightSearch.shadow,/rgba\(0, 0, 0, 0\.08\) 0px 0px 0px 0\.6px/,'The light search rim must not draw a black outline');
    assert.match(lightSearch.shadow,/rgba\(0, 0, 0, 0\.1\) 1\.25px 0px 0px -0\.75px/,'The light search side rim must stay faint');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    await page.evaluate(()=>{localStorage.setItem('wattdesk-home-theme','dark')});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true'&&document.documentElement.dataset.theme==='dark');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+k');
    await page.waitForFunction(()=>{const root=document.querySelector('.wd-search-fullscreen');return root&&!root.hasAttribute('data-entering')});
    await page.waitForTimeout(120);

    const fullField=page.locator('.wd-search-field');
    const fullBox=await fullField.boundingBox();
    await page.mouse.move(fullBox.x+24,fullBox.y+fullBox.height/2);
    await page.mouse.down();
    await page.waitForTimeout(180);
    const pressed=await fullField.evaluate((node)=>({transform:getComputedStyle(node).transform,box:node.getBoundingClientRect().toJSON()}));
    await page.mouse.up();
    assert.equal(pressed.transform,'matrix(1, 0, 0, 1, 0, 0)','Clicking the fullscreen field must not scale it');
    assert.equal(pressed.box.width,816);assert.equal(pressed.box.height,46);

    const fullInput=page.locator('.wd-search-input');
    await fullInput.fill('555');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.wd-search-empty').count(),1,'Typing a missing query must show the empty state');
    await page.locator('.wd-search-field .wd-input-clear').click();
    await page.waitForTimeout(300);
    const cleared=await page.evaluate(()=>({
      value:document.querySelector('.wd-search-input').value,
      clearHidden:document.querySelector('.wd-search-field .wd-input-clear').hidden,
      quick:document.querySelectorAll('.wd-search-panel--fullscreen .wd-search-quick-link').length,
      empty:document.querySelectorAll('.wd-search-empty').length,
      expanded:document.querySelector('.wd-search-input').getAttribute('aria-expanded'),
    }));
    assert.deepEqual(cleared,{value:'',clearHidden:true,quick:5,empty:0,expanded:'true'});

    const fullResultInput=page.locator('.wd-search-fullscreen .wd-search-input');
    await fullResultInput.fill('p');
    await page.waitForTimeout(300);
    const fullResultStart=await page.evaluate(()=>[...document.querySelectorAll('.wd-search-fullscreen [role="option"]')].findIndex((row)=>row.getAttribute('aria-selected')==='true'));
    assert.equal(fullResultStart,0,'Fullscreen results must start on the first row');
    await page.locator('.wd-search-fullscreen .wd-search-hint-item[data-action="navigate"]').click();
    await page.waitForTimeout(150);
    assert.equal(
      await page.evaluate(()=>[...document.querySelectorAll('.wd-search-fullscreen [role="option"]')].findIndex((row)=>row.getAttribute('aria-selected')==='true')),
      1,
      'Fullscreen Navigate must advance the active result',
    );
    await page.locator('.wd-search-fullscreen .wd-search-hint-item[data-action="close"]').click();
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.wd-search-fullscreen').count(),0,'Close must dismiss fullscreen search');

    // The exit is one staggered timeline: results leave first, the field next,
    // and the veil last on a longer tail. Compare the running animations
    // instead of one wall-clock sample; the curve drops quickly, so a single
    // frame is ambiguous.
    await page.locator('input[aria-label="Search sites, devices and people"]').click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    const exitOrder=await page.evaluate(()=>{
      const delay=selector=>{
        const node=document.querySelector(selector);
        if(!node)return null;
        const animation=node.getAnimations().find(item=>item.animationName?.includes('-out'));
        return animation?animation.effect.getTiming().delay:null;
      };
      const timing=selector=>{
        const node=document.querySelector(selector);
        if(!node)return null;
        const animation=node.getAnimations().find(item=>item.animationName?.includes('-out'));
        if(!animation)return null;
        const value=animation.effect.getTiming();
        return {delay:value.delay,duration:value.duration};
      };
      return {
        panel:timing('.wd-search-panel--fullscreen'),
        field:timing('.wd-search-field'),
        backdrop:timing('.wd-search-backdrop'),
      };
    });
    assert.equal(exitOrder.panel.delay,0,'Results must start the exit');
    assert.equal(exitOrder.panel.duration,180,'The result sheet must leave on the short exit rhythm');
    assert.equal(exitOrder.field.delay,40,'The field follows on the shorter exit stagger');
    assert.equal(exitOrder.field.duration,180,'The field must share the result sheet exit duration');
    assert.equal(exitOrder.backdrop.delay,70,'The veil waits until both glass surfaces are leaving');
    assert.equal(exitOrder.backdrop.duration,490,'The veil must clear on a softened, readable tail');

    assert.ok(exitOrder.backdrop.duration>exitOrder.panel.duration,'The veil must outlive the result sheet');
    assert.ok(exitOrder.backdrop.duration>exitOrder.field.duration,'The veil must outlive the field');

    // Sample the actual exit, not just the declared timing. The veil must
    // never animate the host's opacity: a backdrop-filter stops sampling as
    // soon as its layer drops below full opacity, which is what used to make
    // the blur vanish on the first frame. Blur and tint share one layer and
    // recede together after the glass surfaces have left.
    await page.waitForTimeout(300);
    const veilMid=await page.evaluate(()=>{
      const veil=document.querySelector('.wd-search-backdrop');
      const root=document.querySelector('.wd-search-fullscreen');
      if(!veil)return {filter:null,blur:null};
      const filter=getComputedStyle(veil).backdropFilter;
      const tint=getComputedStyle(veil).backgroundColor;
      const alpha=(tint.match(/\/\s*([\d.]+)\s*\)$/)||tint.match(/,\s*([\d.]+)\)$/))?.[1];
      return {
        filter,
        blur:(filter.match(/blur\(([\d.]+)px\)/)||[])[1]||null,
        opacity:getComputedStyle(veil).opacity,
        tint,
        tintAlpha:Number(alpha),
        rootAnimations:root?root.getAnimations().length:null,
      };
    });
    assert.ok(Number(veilMid.blur)>0,'The veil must still be frosted once the glass surfaces have left');
    assert.equal(veilMid.opacity,'1','The veil element must stay opaque so its backdrop-filter keeps compositing');
    assert.equal(veilMid.rootAnimations,0,'The dialog root must never animate: that breaks backdrop sampling');
    assert.match(veilMid.tint,/rgba?\(|oklab\(/,'The veil must keep a tint while its blur is still resolving');

    await page.waitForTimeout(120);
    const veilTail=await page.evaluate(()=>{
      const veil=document.querySelector('.wd-search-backdrop');
      if(!veil)return null;
      const style=getComputedStyle(veil);
      const tint=style.backgroundColor;
      const alpha=(tint.match(/\/\s*([\d.]+)\s*\)$/)||tint.match(/,\s*([\d.]+)\)$/))?.[1];
      return {
        blur:Number((style.backdropFilter.match(/blur\(([\d.]+)px\)/)||[])[1]),
        tintAlpha:Number(alpha),
      };
    });
    assert.ok(veilTail,'The veil must outlive the glass surfaces long enough to refocus the page');
    assert.ok(veilTail.blur<Number(veilMid.blur),'The frost must be easing down, not snapping at unmount');
    assert.ok(veilTail.tintAlpha<veilMid.tintAlpha,'The tint must thin with the blur so the page never snaps sharp');
    assert.ok(veilTail.blur>0,'The frost must still be visible in the late tail, not cut early');

    // The entrance was already accepted. Shortening the exit must not leak into
    // the shared stagger and make the result sheet snap in behind the field.
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.wd-search-fullscreen').count(),0,'The veil must unmount after its tail');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(30);
    const enterTiming=await page.evaluate(()=>{
      const node=document.querySelector('.wd-search-panel--fullscreen');
      const animation=node?.getAnimations().find(item=>item.animationName==='wd-search-panel-in');
      if(!animation)return null;
      const value=animation.effect.getTiming();
      return {delay:value.delay,duration:value.duration};
    });
    assert.deepEqual(enterTiming,{delay:90,duration:980},'The accepted entrance rhythm must stay unchanged');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    await page.mouse.click(40,800);
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.wd-search-fullscreen').count(),0,'The page remains interactive after Close');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.wd-search-fullscreen').count(),0,'Escape must close fullscreen search');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({keycaps:'shared',inline:'fixed 46px capsule',fullscreen:'shared 816x46 field',sharedGlass:true,stableOnPress:true,errors},null,2));
  }finally{
    await browser.close();
  }
})().catch((error)=>{console.error(error);process.exit(1)});
