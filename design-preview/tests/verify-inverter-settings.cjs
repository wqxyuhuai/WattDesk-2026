const {chromium,launchOptions,previewURL} = require("./runtime.cjs");
const assert = require("node:assert/strict");

const origin = new URL(previewURL).origin;
const devicesURL = `${origin}/plants/p25/devices?device=inverter&glass=figma`;
const settingsURL = `${origin}/plants/p25/devices/inverter-settings?device=inverter&glass=figma`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({...launchOptions,headless:true});
  const page = await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
  await page.context().grantPermissions(["clipboard-read","clipboard-write"],{origin});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,"clipboard",{
      configurable:true,
      value:{writeText:async value=>{window.__inverterCopiedValue=value;}}
    });
  });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if(message.type()==="error")errors.push(`${message.text()} @ ${message.location().url||"unknown"}`);
  });
  const ready = async () => {
    await page.waitForFunction(() => document.documentElement.dataset.ready==="true");
  };
  const waitForViewSettled = () => page.waitForFunction(()=>!document.querySelector(".isw-page--leaving")&&!document.querySelector(".isw-title-label--ghost"));
  const waitForPage = async id => {
    await page.waitForFunction(expected=>document.querySelector(".isw-page:not(.isw-page--leaving)")?.dataset.page===expected,id);
    await waitForViewSettled();
  };
  const waitForPageTitle = async title => {
    await page.waitForFunction(expected=>document.querySelector(".isw-page-title")?.textContent===expected,title);
    await waitForViewSettled();
  };
  const assertTypographyContract = async label => {
    const audit=await page.evaluate(()=>{
      const root=document.querySelector(".inverter-settings-window");
      const bodyFamily=getComputedStyle(document.body).fontFamily;
      const sizeValues=new Set(),weightValues=new Set(),violations=[];
      const roots=[root,...document.querySelectorAll("#overlays .popover,#overlays .plants-device-dialog--confirm,#toast")].filter(Boolean);
      const nodes=roots.flatMap(scope=>[...scope.querySelectorAll("*")]).filter(node=>{
        const visible=node.getClientRects().length>0;
        const ownsText=[...node.childNodes].some(child=>child.nodeType===Node.TEXT_NODE&&child.textContent.trim());
        return visible&&(ownsText||node.matches("input,textarea,select,time"));
      });
      for(const node of nodes){
        const style=getComputedStyle(node),weight=Number(style.fontWeight);
        sizeValues.add(style.fontSize);weightValues.add(weight);
        const entry={tag:node.tagName,className:node.className,text:node.textContent.trim().slice(0,48)};
        if(style.fontFamily!==bodyFamily)violations.push({...entry,kind:"family",value:style.fontFamily});
        if(!["9px","9.5px","11px","12px","13px","14px","15px","16px","18px","19px"].includes(style.fontSize))violations.push({...entry,kind:"size",value:style.fontSize});
        if(![400,510,590].includes(weight))violations.push({...entry,kind:"weight",value:style.fontWeight});
      }
      return {family:bodyFamily,sizes:[...sizeValues],weights:[...weightValues].sort((a,b)=>a-b),violations};
    });
    assert.deepEqual(audit.violations,[],`${label} keeps every visible text control inside the settings typography contract`);
    return audit;
  };
  const assertCardSpacingContract = async label => {
    const audit=await page.evaluate(()=>{
      const pageNode=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const cards=[...pageNode.querySelectorAll(":scope > .isw-panel,:scope > .isw-table,:scope > .isw-effective-chain,:scope > .isw-soc-panel,:scope > .isw-gantt,:scope > .isw-plot,:scope > .isw-profile-list,:scope > .isw-mode-list")];
      const note=pageNode.querySelector(":scope > .isw-note");
      const notePrevious=note?.previousElementSibling;
      return {
        gap:getComputedStyle(pageNode).getPropertyValue("--isw-card-gap").trim(),
        noteGap:getComputedStyle(pageNode).getPropertyValue("--isw-note-gap").trim(),
        noteActualGap:note&&notePrevious?note.getBoundingClientRect().top-notePrevious.getBoundingClientRect().bottom:null,
        margins:[...new Set(cards.map(card=>getComputedStyle(card).marginBottom))],
        count:cards.length
      };
    });
    assert.equal(audit.gap,"30px",`${label} exposes the shared 30px card-gap token`);
    assert.equal(audit.noteGap,"10px",`${label} exposes the shared 10px note-gap token`);
    if(audit.count)assert.deepEqual(audit.margins,["30px"],`${label} cards use the shared vertical gap`);
    if(audit.noteActualGap!==null)assert.ok(Math.abs(audit.noteActualGap-10)<=1,`${label} info notes use the shared note gap`);
  };
  const readEcoRanges = () => page.locator("[data-isw-eco-time-input]").evaluateAll(inputs=>inputs.map(input=>input.value));
  try {
    await page.goto(devicesURL,{waitUntil:"domcontentloaded"});
    await ready();
    assert.equal(await page.locator(".plants-device-fields").first().getByText("Check code").count(),1);
    assert.equal(
      await page.locator(".plants-device-field-value").filter({hasText:/^••••$/}).count() >= 1,
      true,
      "the four-digit device Check code is not exposed on Devices"
    );
    await page.getByRole("button",{name:"Open iHybrid settings"}).click();
    await page.waitForFunction(()=>{
      const status=document.querySelector(".isw-status-window");
      return status?.getAnimations().some(animation=>animation.animationName==="isw-status-window-float-in");
    });
    const statusEntrance=await page.locator(".isw-status-window").evaluate(node=>{
      const animation=node.getAnimations().find(item=>item.animationName==="isw-status-window-float-in");
      const timing=animation?.effect?.getTiming();
      const frames=animation?.effect?.getKeyframes()||[];
      return {
        target:animation?.effect?.target===node,
        duration:Number(timing?.duration),
        currentTime:Number(animation?.currentTime),
        easing:frames[0]?.easing,
        from:frames[0]?.transform,
        to:frames.at(-1)?.transform
      };
    });
    assert.equal(statusEntrance.target,true,"the upper status float animation targets only the status window");
    assert.equal(statusEntrance.duration,520,"the upper status window enters with the shared modal content duration");
    assert.ok(
      statusEntrance.currentTime>=0&&statusEntrance.currentTime<statusEntrance.duration,
      "the upper status float starts after the initial settings frame instead of completing before it is visible"
    );
    assert.equal(statusEntrance.easing,"cubic-bezier(0.18, 1.12, 0.3, 1)","the upper status float uses the shared lively spring curve");
    assert.match(statusEntrance.from,/translate3d\(0px, 20px, 0px\)/,"the upper status window begins below its resting position");
    assert.match(statusEntrance.to,/translate3d\(0px, 0px, 0px\)/,"the upper status window settles at its resting position");
    await page.waitForFunction(()=>!document.querySelector(".isw-status-window")?.classList.contains("isw-status-window--entering"));
    await page.waitForTimeout(40);
    const rangeContract=await page.evaluate(async()=>{
      const {settingRange}=await import("/src/pages/inverter-settings/settings-validation.js");
      return {
        timeout:settingRange("dispatch.timeout"),
        curvePF:settingRange("g.cpF1"),
        fixedPF:settingRange("reacPFSet")
      };
    });
    assert.equal(rangeContract.timeout.min,0,"Command timeout accepts zero for no timeout");
    assert.equal(rangeContract.curvePF.min,-1,"curve power factor accepts under-excited negative values");
    assert.equal(rangeContract.fixedPF.min,-1,"fixed power factor accepts under-excited negative values");
    const limitBasisStates=await page.evaluate(async()=>{
      const {createSettingsModel}=await import("/src/pages/inverter-settings/settings-model.js");
      const {limitBasisViewState}=await import("/src/pages/inverter-settings/settings-content.js");
      const supported=createSettingsModel({phaseCount:3,supportsPerPhaseLimit:true});
      supported.S.limits.basis=1;
      const unsupported=createSettingsModel({phaseCount:3,supportsPerPhaseLimit:false});
      unsupported.S.limits.basis=1;
      unsupported.normalizeLimitBasis();
      const single=createSettingsModel({phaseCount:1,supportsPerPhaseLimit:true});
      return {
        supported:limitBasisViewState(supported),
        unsupported:limitBasisViewState(unsupported),
        unsupportedBasis:unsupported.S.limits.basis,
        single:limitBasisViewState(single)
      };
    });
    assert.equal(limitBasisStates.supported.show,true,"three-phase devices expose limit basis");
    assert.equal(limitBasisStates.supported.options[1].disabled,false,"supported firmware enables per-phase basis");
    assert.equal(limitBasisStates.supported.showNote,true,"per-phase selection shows the operational note");
    assert.equal(limitBasisStates.unsupported.options[1].disabled,true,"unsupported firmware disables per-phase basis");
    assert.match(limitBasisStates.unsupported.hint,/not supported by the current firmware/);
    assert.equal(limitBasisStates.unsupportedBasis,0,"unsupported firmware normalizes the saved basis to total");
    assert.equal(limitBasisStates.single.show,false,"single-phase devices hide limit basis");
    assert.match(page.url(),/\/plants\/p25\/devices\/inverter-settings\?device=inverter&serial=/);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true);
    assert.equal(await page.title(),"WattDesk · Inverter settings · Wärmeverbund Nord");
    assert.equal(await page.locator('[data-isw-go="mode"] .isw-nav-value').textContent(),"ToU");
    assert.equal(
      await page.locator(".isw-overview-metric").filter({hasText:"Mode"}).locator("div").textContent(),
      "ToU",
      "the settings status follows the device's current ToU mode"
    );
    const windowBox=await page.locator(".inverter-settings-dialog").boundingBox();
    const statusWindow=page.locator(".isw-status-window");
    const mainWindow=page.locator(".isw-main-window");
    const statusBox=await statusWindow.boundingBox();
    const mainWindowBox=await mainWindow.boundingBox();
    assert.match(await statusWindow.getAttribute("class"),/\bwd-glass--surface\b/);
    assert.match(await mainWindow.getAttribute("class"),/\bwd-glass--surface\b/);
    assert.equal(await page.locator(".isw-overview-reading b").textContent(),"-6.0");
    assert.equal(
      await page.locator(".isw-overview-limit").textContent(),
      "Limited by battery charging",
      "the status window explains why the effective power differs from the requested setpoint"
    );
    const overviewLayout=await page.evaluate(()=>{
      const grid=document.querySelector(".isw-overview-grid");
      const columns=getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
      const metrics=[...grid.querySelectorAll(".isw-overview-metric")].map(node=>node.getBoundingClientRect().top);
      const status=document.querySelector(".isw-status-window").getBoundingClientRect();
      const main=document.querySelector(".isw-overview-main").getBoundingClientRect();
      const gridBox=grid.getBoundingClientRect();
      return {
        columns,
        rows:new Set(metrics).size,
        metricCount:metrics.length,
        statusHeight:status.height,
        mainShare:main.width/status.width,
        gridShare:gridBox.width/status.width
      };
    });
    assert.deepEqual(
      {columns:overviewLayout.columns,rows:overviewLayout.rows,metricCount:overviewLayout.metricCount},
      {columns:6,rows:1,metricCount:6},
      "desktop status metrics use one right-aligned row"
    );
    assert.ok(overviewLayout.mainShare>=0.4,"the result area owns more of the upper window width");
    assert.ok(overviewLayout.gridShare<0.62,"the supporting metrics keep a narrower right column");
    assert.ok(overviewLayout.statusHeight<=122,"the upper status window stays compact");
    const overviewCraft=await page.evaluate(()=>{
      const limit=document.querySelector(".isw-overview-limit");
      const dot=limit.querySelector("i").getBoundingClientRect();
      const copy=limit.querySelector("span").getBoundingClientRect();
      const kicker=document.querySelector(".isw-overview-kicker").getBoundingClientRect();
      const reading=document.querySelector(".isw-overview-reading").getBoundingClientRect();
      const overview=document.querySelector(".isw-overview").getBoundingClientRect();
      const headStyle=getComputedStyle(document.querySelector(".isw-device-head"));
      const mainStyle=getComputedStyle(document.querySelector(".isw-overview-main"));
      const gridStyle=getComputedStyle(document.querySelector(".isw-overview-grid"));
      const resultStyle=getComputedStyle(document.querySelector(".isw-overview-result"));
      const connectionDot=getComputedStyle(document.querySelector(".isw-connection-status > i"));
      const metricLabels=[...document.querySelectorAll(".isw-overview-metric > span")];
      const metricValues=[...document.querySelectorAll(".isw-overview-metric > div")];
      const dividers=[...document.querySelectorAll(".isw-overview-main,.isw-overview-metric")]
        .flatMap(node=>{
          const style=getComputedStyle(node);
          return [style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth];
        });
      const sizes=[
        ".isw-device-model",".isw-device-serial",".isw-device-meta",".isw-overview-kicker",
        ".isw-overview-reading b",".isw-overview-reading em",".isw-overview-limit",
        ".isw-overview-metric > span",".isw-overview-metric > div",".isw-overview-metric em"
      ].map(selector=>getComputedStyle(document.querySelector(selector)).fontSize);
      return {
        dotCenter:dot.top+dot.height/2,
        copyCenter:copy.top+copy.height/2,
        contentCenter:(kicker.top+reading.bottom)/2,
        overviewCenter:(overview.top+overview.bottom)/2,
        labelTopDelta:metricLabels[0].getBoundingClientRect().top-kicker.top,
        valueTopDelta:metricValues[0].getBoundingClientRect().top-reading.top,
        labelRowAligned:new Set(metricLabels.map(node=>node.getBoundingClientRect().top)).size===1,
        valueRowAligned:new Set(metricValues.map(node=>node.getBoundingClientRect().top)).size===1,
        radius:Number.parseFloat(getComputedStyle(document.querySelector(".isw-status-window")).borderTopLeftRadius),
        headPadding:[headStyle.paddingTop,headStyle.paddingBottom,headStyle.paddingLeft,headStyle.paddingRight],
        mainPadding:[mainStyle.paddingTop,mainStyle.paddingBottom,mainStyle.paddingLeft,mainStyle.paddingRight],
        gridPadding:[gridStyle.paddingTop,gridStyle.paddingBottom,gridStyle.paddingLeft,gridStyle.paddingRight],
        resultAlign:resultStyle.alignItems,
        resultGap:resultStyle.columnGap,
        limitTranslate:getComputedStyle(limit).translate,
        topInk:getComputedStyle(document.querySelector(".isw-status-window")).color,
        pulseName:connectionDot.animationName,
        pulseDuration:connectionDot.animationDuration,
        pulseIteration:connectionDot.animationIterationCount,
        dividers,
        sizes
      };
    });
    assert.ok(Math.abs(overviewCraft.dotCenter-overviewCraft.copyCenter)<=.5,"the limit dot and label share one vertical centre");
    assert.equal(overviewCraft.resultAlign,"baseline","the limit message shares the power reading baseline");
    assert.equal(overviewCraft.resultGap,"8px","the power and limit message use the reviewed 8px gap");
    assert.equal(overviewCraft.limitTranslate,"0px -0.75px","the blue limit message gets the reviewed optical upward correction");
    assert.ok(Math.abs(overviewCraft.contentCenter-overviewCraft.overviewCenter)<=1.5,"the result content is vertically centred");
    assert.ok(Math.abs(overviewCraft.labelTopDelta)<=.5,"the result label and metric labels share one row");
    assert.ok(Math.abs(overviewCraft.valueTopDelta)<=.5,"the result value and metric values share one row");
    assert.equal(overviewCraft.labelRowAligned,true,"all metric labels share one baseline row");
    assert.equal(overviewCraft.valueRowAligned,true,"all metric values share one baseline row");
    assert.deepEqual(overviewCraft.headPadding,["10px","10px","30px","30px"],"the identity row uses equal compact vertical padding");
    assert.deepEqual(overviewCraft.mainPadding,["7px","6px","30px","30px"],"the result keeps the corner-sized gutter and a compact bottom inset");
    assert.deepEqual(overviewCraft.gridPadding,["7px","6px","30px","30px"],"the metric row keeps the corner-sized gutter and a compact bottom inset");
    assert.equal(overviewCraft.radius,30,"the content gutter matches the status window corner radius");
    assert.equal(overviewCraft.pulseName,"isw-connection-pulse","the connected dot pulses");
    assert.equal(overviewCraft.pulseDuration,"1.8s");
    assert.equal(overviewCraft.pulseIteration,"infinite");
    assert.equal(
      ["rgb(0, 0, 0)","rgb(255, 255, 255)"].includes(overviewCraft.topInk),
      false,
      "the status window does not use pure black or pure white text"
    );
    assert.match(overviewCraft.topInk,/\/ 0\.7\)$/,"the status window uses the softened top-level ink");
    assert.ok(overviewCraft.dividers.every(width=>width==="0px"),"the upper status metrics have no internal dividers");
    assert.deepEqual([...new Set(overviewCraft.sizes)].sort(),["12px","14px","18px"],"the upper status window keeps one compact type scale");
    const bodyBox=await page.locator(".isw-body").boundingBox();
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"Save/Cancel stay hidden before a real edit");
    assert.equal(
      await page.locator(".isw-scroll").evaluate(node=>node.classList.contains("isw-scroll--actionless")),
      true,
      "the clean page reclaims the action-bar bottom inset"
    );
    const numberField=page.locator('[data-isw-number="dispatch.sp"]').locator("xpath=..");
    const numberCraft=await numberField.evaluate(field=>{
      const input=field.querySelector("input");
      const unit=field.querySelector(".isw-number-unit");
      const inputStyle=getComputedStyle(input);
      const unitStyle=getComputedStyle(unit);
      const shadowColorProbe=document.createElement("span");
      shadowColorProbe.style.backgroundColor="var(--isw-number-shadow-color)";
      field.append(shadowColorProbe);
      const shadowColor=getComputedStyle(shadowColorProbe).backgroundColor;
      shadowColorProbe.remove();
      return {
        borderWidth:getComputedStyle(field).borderTopWidth,
        borderColor:getComputedStyle(field).borderTopColor,
        radius:getComputedStyle(field).borderRadius,
        shadow:getComputedStyle(field).boxShadow,
        inputFont:[inputStyle.fontFamily,inputStyle.fontSize,inputStyle.fontWeight,inputStyle.lineHeight],
        unitFont:[unitStyle.fontFamily,unitStyle.fontSize,unitStyle.fontWeight,unitStyle.lineHeight],
        inputColor:inputStyle.color,
        unitColor:unitStyle.color,
        unitBorder:unitStyle.borderLeftWidth,
        unitWidth:unit.getBoundingClientRect().width,
        unitRightGap:field.getBoundingClientRect().right-unit.getBoundingClientRect().right,
        valueUnitGap:getComputedStyle(field).gap,
        stepSize:input.dataset.iswStepSize,
        stepperCount:field.querySelectorAll(".isw-stepper,[data-isw-step]").length,
        shadowColor,
        transitionDuration:getComputedStyle(field).transitionDuration,
        transitionTiming:getComputedStyle(field).transitionTimingFunction
      };
    });
    assert.equal(numberCraft.borderWidth,"1px","number fields use a crisp base outline");
    assert.notEqual(numberCraft.borderColor,"rgba(0, 0, 0, 0)","number field outline stays visible at rest");
    assert.notEqual(numberCraft.shadowColor,numberCraft.borderColor,"number field shadow starts slightly darker than its outline");
    assert.equal(numberCraft.radius,"18px","number fields use the shared pill radius");
    assert.notEqual(numberCraft.shadow,"none","number fields keep a faint contact shadow");
    assert.deepEqual(numberCraft.unitFont,numberCraft.inputFont,"number and unit share one type family, size, weight and line height");
    assert.notEqual(numberCraft.unitColor,numberCraft.inputColor,"the unit differs from the value only by semantic colour");
    assert.equal(numberCraft.unitBorder,"0px","number fields have no divider between value and unit");
    assert.ok(numberCraft.unitWidth>0,"number units size to their content");
    assert.ok(numberCraft.unitRightGap>=10,"number units keep a stable right-side safe inset");
    assert.equal(numberCraft.valueUnitGap,"6px","value and unit keep one fixed gap");
    assert.equal(numberCraft.stepSize,"0.5","number fields retain their keyboard step size");
    assert.equal(numberCraft.stepperCount,0,"number fields hide the up/down adjustment buttons");
    assert.equal(numberCraft.transitionDuration,"0.38s","number field state transitions use the extended shared rhythm");
    assert.match(numberCraft.transitionTiming,/cubic-bezier\(0\.4, 0, 0\.2, 1\)/,"number field transitions use the shared disclosure easing");
    const numberGeometry=await page.evaluate(()=>{
      const segmented=document.querySelector('[data-isw-seg="dispatch.unit"]');
      const number=document.querySelector("[data-isw-number=\"dispatch.sp\"]").closest(".isw-number");
      const a=segmented.getBoundingClientRect();
      const b=number.getBoundingClientRect();
      return {segWidth:a.width,segHeight:a.height,segRight:a.right,numberWidth:b.width,numberHeight:b.height,numberRight:b.right};
    });
    assert.ok(Math.abs(numberGeometry.numberWidth-numberGeometry.segWidth)<=1,"number fields match the segmented control width");
    assert.ok(Math.abs(numberGeometry.numberHeight-numberGeometry.segHeight)<=1,"number fields match the segmented control height");
    assert.ok(Math.abs(numberGeometry.numberRight-numberGeometry.segRight)<=1,"number fields align to the segmented control's right edge");
    const numberRest=await numberField.evaluate(field=>({
      background:getComputedStyle(field).backgroundColor,
      borderColor:getComputedStyle(field).borderTopColor,
      shadow:getComputedStyle(field).boxShadow
    }));
    await numberField.hover();
    await page.waitForTimeout(420);
    const numberHover=await numberField.evaluate(field=>({
      background:getComputedStyle(field).backgroundColor,
      borderColor:getComputedStyle(field).borderTopColor,
      shadow:getComputedStyle(field).boxShadow
    }));
    assert.notEqual(numberHover.background,numberRest.background,"number fields deepen their fill on hover");
    assert.notEqual(numberHover.borderColor,numberRest.borderColor,"number field outlines strengthen on hover");
    assert.notEqual(numberHover.shadow,numberRest.shadow,"number fields strengthen their contact shadow on hover");
    assert.match(numberRest.shadow,/rgba\(0, 0, 0/,"the dark resting shadow stays black");
    assert.match(numberHover.shadow,/rgba\(0, 0, 0/,"the dark hover shadow stays black instead of becoming a white glow");
    assert.match(numberRest.shadow,/0px 1px 1px 0px/,"the resting contact shadow uses a short downward offset with 1px blur");
    const hoverShadowOffset=Number(numberHover.shadow.match(/0px ([\d.]+)px 1px 0px/)?.[1]);
    assert.ok(Math.abs(hoverShadowOffset-2)<=.1,"the hover contact shadow moves slightly farther while keeping 1px blur");
    await page.locator('[data-isw-number="dispatch.sp"]').click();
    await page.waitForTimeout(420);
    const numberFocus=await numberField.evaluate(field=>({
      background:getComputedStyle(field).backgroundColor,
      borderColor:getComputedStyle(field).borderTopColor,
      outlineWidth:getComputedStyle(field).outlineWidth,
      outlineColor:getComputedStyle(field).outlineColor,
      shadow:getComputedStyle(field).boxShadow
    }));
    assert.notEqual(numberFocus.background,numberHover.background,"number fields deepen their fill again on focus");
    assert.notEqual(numberFocus.borderColor,numberHover.borderColor,"number fields strengthen their outline again on focus");
    assert.equal(numberFocus.outlineWidth,"1px","focused number fields keep one crisp outer ring");
    assert.notEqual(numberFocus.outlineColor,numberRest.borderColor,"the focused number outline is stronger than the resting outline");
    assert.notEqual(numberFocus.shadow,numberHover.shadow,"focused number fields strengthen their contact shadow again");
    assert.match(numberFocus.shadow,/rgba\(0, 0, 0/,"the dark focus shadow also stays black");
    const setpointInput=page.locator('[data-isw-number="dispatch.sp"]');
    await setpointInput.fill("-9");
    await setpointInput.press("Enter");
    await page.waitForTimeout(40);
    const actionFadeIn=await page.locator(".isw-actions").evaluate(node=>{
      const animation=node.getAnimations().find(item=>item.effect?.target===node);
      return {
        hidden:node.hidden,
        inert:node.inert,
        opacity:Number.parseFloat(getComputedStyle(node).opacity),
        duration:animation?.effect.getTiming().duration
      };
    });
    assert.equal(actionFadeIn.hidden,false);
    assert.equal(actionFadeIn.inert,false);
    assert.ok(actionFadeIn.opacity>=0&&actionFadeIn.opacity<1,"the action bar begins with a fade");
    assert.equal(actionFadeIn.duration,320);
    await page.waitForTimeout(340);
    const actionBox=await page.locator(".isw-actions").boundingBox();
    const closeBox=await page.locator(".isw-close-button").boundingBox();
    const bodySurface=await page.locator(".isw-body").evaluate(node=>{
      const style=getComputedStyle(node);
      return {
        className:node.className,
        backgroundImage:style.backgroundImage,
        boxShadow:style.boxShadow,
        radius:style.borderRadius
      };
    });
    assert.match(bodySurface.className,/\bwd-main-panel\b/,"the settings content uses the shared workspace panel surface");
    assert.match(bodySurface.backgroundImage,/linear-gradient/,"the settings panel inherits the shared dark workspace paint");
    assert.match(bodySurface.boxShadow,/inset/,"the settings panel inherits the shared dark workspace lift");
    assert.match(bodySurface.boxShadow,/rgba\(0, 0, 0, 0?\.35\)/,"the dark settings panel softens its outer lift");
    assert.equal(bodySurface.radius,"18px","the settings panel uses the shared medium radius");
    const livePaneInsets=await page.evaluate(()=>{
      const main=document.querySelector(".isw-main-window").getBoundingClientRect();
      const body=document.querySelector(".isw-body").getBoundingClientRect();
      return {right:main.right-body.right,bottom:main.bottom-body.bottom};
    });
    assert.ok(
      Math.abs(livePaneInsets.right-12)<=1,
      "the settings panel keeps a 12px inset from the right edge"
    );
    assert.ok(
      Math.abs(livePaneInsets.bottom-12)<=1,
      "the settings panel keeps a 12px inset from the bottom edge"
    );
    const stackRadii=await page.evaluate(() => {
      const status=getComputedStyle(document.querySelector(".isw-status-window"));
      const main=getComputedStyle(document.querySelector(".isw-main-window"));
      return {
        statusTopLeft:status.borderTopLeftRadius,
        statusTopRight:status.borderTopRightRadius,
        statusBottomLeft:status.borderBottomLeftRadius,
        statusBottomRight:status.borderBottomRightRadius,
        mainTopLeft:main.borderTopLeftRadius,
        mainBottomRight:main.borderBottomRightRadius
      };
    });
    assert.ok(statusBox.width<mainWindowBox.width,"device status uses a narrower upper window");
    assert.ok(
      Math.abs((statusBox.y+statusBox.height)-mainWindowBox.y)<=1,
      "the lower window is attached to the upper window without overlap or a gap"
    );
    assert.deepEqual(stackRadii,{
      statusTopLeft:"30px",statusTopRight:"30px",statusBottomLeft:"0px",statusBottomRight:"0px",
      mainTopLeft:"30px",mainBottomRight:"30px"
    },"only the upper window's top corners are rounded");
    const stackSeam=await page.locator(".isw-main-shell").evaluate(node=>{
      const root=document.documentElement;
      const settingsWindow=document.querySelector(".inverter-settings-window");
      const read=()=>({
        shadow:getComputedStyle(node).boxShadow,
        tint:getComputedStyle(settingsWindow).getPropertyValue("--isw-stack-seam-shadow").trim()
      });
      const status=document.querySelector(".isw-status-window").getBoundingClientRect();
      const main=node.getBoundingClientRect();
      const dark=read();
      root.dataset.theme="light";
      const light=read();
      root.dataset.theme="dark";
      return {dark,light,overlap:status.bottom-main.top};
    });
    assert.match(stackSeam.dark.shadow,/rgba?\([^)]*0\.06\)?\s*0(?:px)?\s*-1px/);
    assert.match(stackSeam.dark.shadow,/0(?:px)?\s*-10px\s*28px\s*-10px/,"the existing lower-shell shadow supplies the upward gradient");
    assert.match(stackSeam.dark.tint,/^rgba\(0, 0, 0, (?:0\.34|\.34)\)$/,"dark mode keeps the stack shadow black");
    assert.match(stackSeam.light.tint,/^rgba\(0, 0, 0, (?:0\.22|\.22)\)$/,"light mode keeps the stack shadow black");
    assert.match(stackSeam.dark.shadow,/rgba\(0, 0, 0/,"dark mode never casts a white stack shadow");
    assert.match(stackSeam.light.shadow,/rgba\(0, 0, 0/,"light mode also renders the stack shadow in black");
    assert.ok(stackSeam.overlap>=0,"the lower window physically overlaps the status window");
    assert.ok(actionBox.y>windowBox.y+windowBox.height/2,"Save/Cancel stay in the lower half of the settings window");
    assert.ok(Math.abs(actionBox.x-bodyBox.x)<=1,"the action surface starts with the right content pane");
    assert.ok(Math.abs(actionBox.width-bodyBox.width)<=1,"the action surface matches the right content-pane width");
    assert.equal(await page.locator(".isw-actions").evaluate(node=>getComputedStyle(node).justifyContent),"center");
    const actionButtonWidths=await page.locator(".isw-actions > .wd-button").evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
    assert.equal(actionButtonWidths.length,2,"the action surface keeps exactly Cancel and Save");
    assert.ok(Math.abs(actionButtonWidths[0]-actionButtonWidths[1])<=.5,"Cancel and Save use the same width");
    assert.ok(actionButtonWidths.every(width=>width>=100),"Cancel and Save use the wider shared action width");
    const actionMaterial=await page.locator(".isw-actions").evaluate(node=>({
      className:node.className,
      background:getComputedStyle(node).backgroundColor,
      backdrop:getComputedStyle(node).backdropFilter,
      borderTopWidth:getComputedStyle(node).borderTopWidth,
      borderTopColor:getComputedStyle(node).borderTopColor,
      topLeft:getComputedStyle(node).borderTopLeftRadius,
      topRight:getComputedStyle(node).borderTopRightRadius
    }));
    assert.doesNotMatch(actionMaterial.className,/\bwd-glass--surface\b/);
    assert.equal(actionMaterial.background,"rgba(0, 0, 0, 0)");
    assert.notEqual(actionMaterial.backdrop,"none");
    assert.equal(actionMaterial.borderTopWidth,"1px","the action bar has a subtle top rule");
    assert.notEqual(actionMaterial.borderTopColor,"rgba(0, 0, 0, 0)");
    assert.equal(actionMaterial.topLeft,"0px");
    assert.equal(actionMaterial.topRight,"0px");
    await setpointInput.fill("-10");
    await setpointInput.press("Enter");
    await page.waitForTimeout(80);
    assert.ok(
      Number.parseFloat(await page.locator(".isw-actions").evaluate(node=>getComputedStyle(node).opacity))<1,
      "the action bar fades out when values return to the saved baseline"
    );
    await page.waitForTimeout(220);
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"the action bar hides again at the saved baseline");
    await setpointInput.fill("-8");
    await setpointInput.press("Enter");
    await page.waitForTimeout(340);
    await page.getByRole("button",{name:"Cancel"}).click();
    await page.waitForTimeout(340);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"Cancel keeps the settings window open");
    assert.equal(await page.locator('[data-isw-number="dispatch.sp"]').inputValue(),"-10.0","Cancel restores the saved baseline");
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"Cancel hides the action bar after restoring");
    assert.match(await page.locator(".wd-toast-text").textContent(),/Changes reverted/);
    const settingsLayer=page.locator(".inverter-settings-dialog").locator("xpath=..");
    await settingsLayer.locator(".wd-modal-backdrop").click({force:true,position:{x:14,y:14}});
    await page.waitForTimeout(80);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"clicking the inert backdrop does not close inverter settings");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(80);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"Escape does not close inverter settings");
    await setpointInput.fill("-8");
    await setpointInput.press("Enter");
    await page.waitForTimeout(100);
    await page.locator(".isw-close-button").click();
    await page.locator(".plants-device-dialog--confirm").waitFor();
    await page.waitForTimeout(560);
    await page.screenshot({path:"tests/output/inverter-settings-unsaved.png"});
    assert.equal(await page.locator(".plants-device-confirm-title").textContent(),"Unsaved changes");
    assert.equal(
      await page.locator(".plants-device-confirm-description").textContent(),
      "You have unsaved changes. Exit directly will not save these changes."
    );
    assert.equal(await page.getByRole("button",{name:"Keep Editing"}).count(),1);
    assert.equal(await page.getByRole("button",{name:"Discard Changes"}).count(),1);
    await page.getByRole("button",{name:"Keep Editing"}).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"Keep Editing returns to the settings page");
    assert.equal(await page.locator(".plants-device-dialog--confirm").count(),0);
    await page.getByRole("button",{name:"Cancel"}).click();
    await page.waitForTimeout(340);
    assert.equal(await page.locator(".isw-nav-foot").count(),0,"the duplicated footer shortcuts are removed");
    assert.equal(await page.locator(".isw-nav").evaluate(node=>getComputedStyle(node).borderRightWidth),"0px","the navigation has no divider against the content pane");
    assert.ok(
      Math.abs(await page.locator(".isw-nav").evaluate(node=>node.getBoundingClientRect().bottom)-mainWindowBox.y-mainWindowBox.height)<=1,
      "the left navigation extends to the bottom of the settings window"
    );
    assert.ok(closeBox.x+closeBox.width>mainWindowBox.x+mainWindowBox.width-30,"the lower settings window has a top-right close control");
    assert.ok(closeBox.y>=mainWindowBox.y&&closeBox.y<mainWindowBox.y+50,"the close control belongs to the lower window");
    const closeTopInset=closeBox.y-mainWindowBox.y;
    const closeRightInset=mainWindowBox.x+mainWindowBox.width-closeBox.x-closeBox.width;
    assert.ok(Math.abs(closeTopInset-closeRightInset)<=1,"the close control has equal top and right insets");
    assert.ok(Math.abs(closeTopInset-20)<=1,"the close control uses the shared 20px inset");
    await page.mouse.move(0,0);
    await page.waitForTimeout(420);
    const idleTracks=await page.locator(".wd-scroll-feedback").evaluateAll(nodes=>nodes
      .filter(node=>node.getBoundingClientRect().width>0)
      .map(node=>getComputedStyle(node).opacity));
    assert.deepEqual(idleTracks,["0","0"],"settings scroll rails are hidden while the pointer is elsewhere");
    const visibleTracks=await page.locator(".wd-scroll-feedback").evaluateAll(nodes=>nodes
      .filter(node=>node.getBoundingClientRect().width>0)
      .map(node=>({parent:node.parentElement.className,right:getComputedStyle(node).right})));
    assert.equal(visibleTracks.length,2,"left and right use the shared scroll feedback");
    assert.ok(visibleTracks.some(track=>track.parent.includes("isw-nav")&&track.right==="2px"));
    assert.ok(visibleTracks.some(track=>track.parent.includes("isw-content-pane")&&track.right==="4px"));
    assert.equal(await page.locator(".isw-nav>.wd-scroll-feedback__pull").count(),2,"navigation exposes both shared elastic edge surfaces");
    assert.equal(await page.locator(".isw-content-pane>.wd-scroll-feedback__pull").count(),2,"content exposes both shared elastic edge surfaces");
    const topPullChrome=await page.evaluate(()=>{
      const scroll=document.querySelector(".isw-scroll");
      scroll.scrollTop=0;
      const title=document.querySelector(".isw-title-layer").getBoundingClientRect();
      const titleText=document.querySelector(".isw-page-title").getBoundingClientRect();
      const rule=document.querySelector(".isw-title-rule").getBoundingClientRect();
      return {layer:[title.x,title.y,title.width,title.height],text:[titleText.x,titleText.y,titleText.width,titleText.height],rule:[rule.x,rule.y,rule.width,rule.height]};
    });
    await page.locator(".isw-scroll").evaluate(node=>node.dispatchEvent(new WheelEvent("wheel",{deltaY:-320,bubbles:true,cancelable:true})));
    await page.waitForTimeout(80);
    const contentPull=await page.locator(".isw-page-host").evaluate(node=>({
      pulling:node.classList.contains("is-pulling"),
      transform:getComputedStyle(node).transform
    }));
    assert.equal(contentPull.pulling,true,"content scrolling uses the shared edge pull");
    assert.notEqual(contentPull.transform,"none","content scrolling applies elastic displacement");
    const topPullChromeAfter=await page.evaluate(()=>{
      const title=document.querySelector(".isw-title-layer").getBoundingClientRect();
      const titleText=document.querySelector(".isw-page-title").getBoundingClientRect();
      const rule=document.querySelector(".isw-title-rule").getBoundingClientRect();
      return {layer:[title.x,title.y,title.width,title.height],text:[titleText.x,titleText.y,titleText.width,titleText.height],rule:[rule.x,rule.y,rule.width,rule.height]};
    });
    assert.deepEqual(topPullChromeAfter,topPullChrome,"top overscroll never moves the fixed title layer or its rule");
    await page.waitForTimeout(960);
    await page.evaluate(()=>{
      const scroll=document.querySelector(".isw-scroll");
      scroll.scrollTop=scroll.scrollHeight-scroll.clientHeight;
    });
    await page.waitForTimeout(80);
    const bottomPullBefore=await page.evaluate(()=>{
      const title=document.querySelector(".isw-title-layer").getBoundingClientRect();
      const titleText=document.querySelector(".isw-page-title").getBoundingClientRect();
      return {
        layer:[title.x,title.y,title.width,title.height],
        text:[titleText.x,titleText.y,titleText.width,titleText.height],
        backdrop:getComputedStyle(document.querySelector(".isw-page-title")).backdropFilter
      };
    });
    await page.locator(".isw-scroll").evaluate(node=>node.dispatchEvent(new WheelEvent("wheel",{deltaY:320,bubbles:true,cancelable:true})));
    await page.waitForTimeout(80);
    const bottomPullAfter=await page.evaluate(()=>{
      const title=document.querySelector(".isw-title-layer").getBoundingClientRect();
      const titleText=document.querySelector(".isw-page-title").getBoundingClientRect();
      return {
        layer:[title.x,title.y,title.width,title.height],
        text:[titleText.x,titleText.y,titleText.width,titleText.height],
        backdrop:getComputedStyle(document.querySelector(".isw-page-title")).backdropFilter
      };
    });
    assert.deepEqual(bottomPullAfter,bottomPullBefore,"bottom overscroll keeps the title and active blur fixed");
    assert.notEqual(bottomPullAfter.backdrop,"none","the fixed title keeps its blur while content moves underneath");
    assert.equal(await page.locator(".isw-page-host").evaluate(node=>node.classList.contains("is-pulling")),true,"bottom content still receives the shared elastic displacement");
    await page.waitForTimeout(960);
    await page.locator(".isw-nav-scroll").evaluate(node=>{
      node.scrollTop=0;
      node.dispatchEvent(new WheelEvent("wheel",{deltaY:-320,bubbles:true,cancelable:true}));
    });
    await page.waitForTimeout(80);
    const navPull=await page.locator(".isw-nav-content").evaluate(node=>({
      pulling:node.classList.contains("is-pulling"),
      transform:getComputedStyle(node).transform
    }));
    assert.equal(navPull.pulling,true,"navigation scrolling uses the shared edge pull");
    assert.notEqual(navPull.transform,"none","navigation scrolling applies elastic displacement");
    await page.waitForTimeout(960);
    const reversedScroll=await page.evaluate(async()=>{
      const viewport=document.querySelector(".isw-scroll");
      const content=document.querySelector(".isw-page-host");
      const track=document.querySelector(".isw-content-pane>.wd-scroll-feedback");
      const thumb=track.querySelector(".wd-scroll-feedback__thumb");
      viewport.scrollTop=0;
      viewport.dispatchEvent(new WheelEvent("wheel",{deltaY:-240,bubbles:true,cancelable:true}));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const reverseEvent=new WheelEvent("wheel",{deltaY:180,bubbles:true,cancelable:true});
      viewport.dispatchEvent(reverseEvent);
      viewport.scrollTop=72;
      viewport.dispatchEvent(new Event("scroll"));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const trackBox=track.getBoundingClientRect();
      const thumbBox=thumb.getBoundingClientRect();
      const maxScroll=Math.max(1,viewport.scrollHeight-viewport.clientHeight);
      const maxTop=Math.max(0,trackBox.height-thumbBox.height);
      const expectedTop=viewport.scrollTop/maxScroll*maxTop;
      return {
        prevented:reverseEvent.defaultPrevented,
        pulling:content.classList.contains("is-pulling"),
        thumbDelta:Math.abs((thumbBox.top-trackBox.top)-expectedTop),
        scrollTop:viewport.scrollTop
      };
    });
    assert.equal(reversedScroll.prevented,false,"reversing direction immediately releases the wheel to native scrolling");
    assert.equal(reversedScroll.pulling,false,"reversing direction clears the stale elastic pull");
    assert.equal(reversedScroll.scrollTop,72);
    assert.ok(reversedScroll.thumbDelta<=1,"the scrollbar follows the new scroll position during rebound instead of pausing");
    const contentTrackScroll=await page.evaluate(()=>{
      const viewport=document.querySelector(".isw-scroll");
      viewport.scrollTop=10;
      const before=viewport.scrollTop;
      const track=document.querySelector(".isw-content-pane>.wd-scroll-feedback");
      const event=new WheelEvent("wheel",{deltaY:3,deltaMode:1,bubbles:true,cancelable:true});
      track.dispatchEvent(event);
      return {before,after:viewport.scrollTop,prevented:event.defaultPrevented};
    });
    assert.ok(contentTrackScroll.after>contentTrackScroll.before,"wheel over the content rail scrolls the content viewport");
    assert.ok(contentTrackScroll.after-contentTrackScroll.before>=45,"line-mode rail wheel input is normalized to the same travel speed");
    assert.equal(contentTrackScroll.prevented,true,"rail wheel scrolling stays inside the settings viewport");
    const navTrackScroll=await page.evaluate(()=>{
      const viewport=document.querySelector(".isw-nav-scroll");
      viewport.scrollTop=10;
      const before=viewport.scrollTop;
      const track=document.querySelector(".isw-nav>.wd-scroll-feedback");
      const event=new WheelEvent("wheel",{deltaY:20,bubbles:true,cancelable:true});
      track.dispatchEvent(event);
      return {before,after:viewport.scrollTop,prevented:event.defaultPrevented};
    });
    assert.ok(navTrackScroll.after>navTrackScroll.before,"wheel over the navigation rail scrolls the navigation viewport");
    assert.equal(navTrackScroll.prevented,true,"rail wheel scrolling stays inside the settings viewport");
    const trackGeometry=await page.evaluate(()=>{
      const inspect=(hostSelector,trackSelector)=>{
        const host=document.querySelector(hostSelector).getBoundingClientRect();
        const track=document.querySelector(trackSelector).getBoundingClientRect();
        return {
          topInset:track.top-host.top,
          bottomInset:host.bottom-track.bottom
        };
      };
      const nav=inspect(".isw-nav",".isw-nav>.wd-scroll-feedback");
      const body=inspect(".isw-content-pane",".isw-content-pane>.wd-scroll-feedback");
      const navTrack=document.querySelector(".isw-nav>.wd-scroll-feedback").getBoundingClientRect();
      const navTrailing=[...document.querySelectorAll(".isw-nav-item-trailing")].map(node=>node.getBoundingClientRect().right);
      const bodyTrack=document.querySelector(".isw-content-pane>.wd-scroll-feedback").getBoundingClientRect();
      const bodyContent=document.querySelector(".isw-page").getBoundingClientRect();
      return {
        nav,
        body,
        navContentGap:navTrack.left-Math.max(...navTrailing),
        bodyContentGap:bodyTrack.left-bodyContent.right
      };
    });
    assert.ok(Math.abs(trackGeometry.nav.topInset-12)<=1,"the navigation track keeps a 12px top inset");
    assert.ok(Math.abs(trackGeometry.nav.bottomInset-12)<=1,"the navigation track keeps a 12px bottom inset");
    assert.ok(trackGeometry.body.topInset>=11,"the content track keeps a safe top inset");
    assert.ok(trackGeometry.body.bottomInset>=11,"the content track keeps a safe bottom inset above the actions");
    assert.ok(trackGeometry.navContentGap>=2,"the navigation track does not overlap row trailing content");
    assert.ok(trackGeometry.bodyContentGap>=8,"the content track keeps clear of the page content");
    const navTopMaskAtRest=await page.locator(".isw-nav-scroll").evaluate(node=>{
      node.scrollTop=0;
      node.dispatchEvent(new Event("scroll"));
      const style=getComputedStyle(node);
      return {
        mask:style.maskImage,
        webkitMask:style.webkitMaskImage,
        fade:style.getPropertyValue("--isw-nav-top-fade").trim(),
        faded:node.classList.contains("is-top-faded")
      };
    });
    assert.equal(navTopMaskAtRest.fade,"24px","the navigation exposes one shared top fade distance");
    assert.equal(navTopMaskAtRest.faded,false,"the top fade stays off at the start of the navigation");
    assert.equal(navTopMaskAtRest.mask,"none","the resting navigation has no visible gradient edge");
    assert.equal(navTopMaskAtRest.webkitMask,"none","the resting navigation stays clean in WebKit");
    const navTopMaskScrolled=await page.locator(".isw-nav-scroll").evaluate(async node=>{
      node.scrollTop=96;
      node.dispatchEvent(new Event("scroll"));
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const style=getComputedStyle(node);
      return {
        mask:style.maskImage,
        webkitMask:style.webkitMaskImage,
        faded:node.classList.contains("is-top-faded")
      };
    });
    assert.equal(navTopMaskScrolled.faded,true,"scrolling enables the top fade");
    assert.notEqual(navTopMaskScrolled.mask,"none","the scrolled navigation fades softly into the top edge");
    assert.notEqual(navTopMaskScrolled.webkitMask,"none","the scrolled navigation also fades in WebKit");
    assert.match(navTopMaskScrolled.mask,/24px/,"the navigation top fade uses the shared 24px distance");
    assert.match(navTopMaskScrolled.mask,/rgba\(0, 0, 0, 0\.58\) 14px/,"the navigation fade uses a smooth multi-stop curve");
    await page.locator(".isw-nav-scroll").hover();
    await page.waitForTimeout(260);
    assert.equal(
      await page.locator(".isw-nav > .wd-scroll-feedback").evaluate(node=>getComputedStyle(node).opacity),
      "1",
      "hovering the navigation reveals its shared scroll rail"
    );

    const powerGroup=page.locator('[data-isw-group="Power control"]');
    const powerGroupContent=page.locator(`#${await powerGroup.getAttribute("aria-controls")}`);
    assert.equal(await page.locator(".isw-nav").evaluate(node=>getComputedStyle(node).backgroundColor),"rgba(0, 0, 0, 0)");
    assert.ok(Math.abs(await page.locator(".isw-nav").evaluate(node=>node.getBoundingClientRect().width)-288)<=1,"the navigation uses the reviewed 288px width");
    assert.equal(await powerGroup.evaluate(node=>getComputedStyle(node).gap),"4px");
    const groupDisclosure=await powerGroup.evaluate(node=>{
      const label=node.querySelector(".isw-nav-group-label").getBoundingClientRect();
      const disclosure=node.querySelector(".target-disclosure").getBoundingClientRect();
      return {labelGap:disclosure.left-label.right};
    });
    assert.ok(Math.abs(groupDisclosure.labelGap-4)<=1,"group disclosure arrows follow the label with the shared 4px gap");
    const gridTrailing=await page.locator('[data-isw-go="grid"]').evaluate(node=>{
      const row=node.getBoundingClientRect();
      const trailing=node.querySelector(".isw-nav-item-trailing").getBoundingClientRect();
      const icon=node.querySelector(".target-nav-icon").getBoundingClientRect();
      const label=node.querySelector(".isw-nav-item-label").getBoundingClientRect();
      return {
        iconLabelGap:label.left-icon.right,
        labelTrailingGap:trailing.left-label.right,
        trailingRight:row.right-14-trailing.right
      };
    });
    assert.ok(Math.abs(gridTrailing.iconLabelGap-8)<=1,"shared sidebar row keeps the 8px icon-label gap");
    assert.ok(gridTrailing.labelTrailingGap>=4,"navigation labels keep clear of trailing content");
    assert.ok(Math.abs(gridTrailing.trailingRight)<=1,"row values and trailing icons align to the right");
    const rowType=await page.locator('[data-isw-go="mode"]').evaluate(node=>{
      const label=getComputedStyle(node.querySelector(".isw-nav-item-label"));
      const value=getComputedStyle(node.querySelector(".isw-nav-value"));
      return {labelSize:label.fontSize,valueSize:value.fontSize,labelWeight:Number(label.fontWeight),valueWeight:Number(value.fontWeight)};
    });
    assert.equal(rowType.labelSize,"13px","navigation labels use Footnote medium");
    assert.equal(rowType.labelWeight,510,"navigation labels keep the medium weight");
    assert.equal(rowType.valueSize,"12px","row values use the reviewed 12px size");
    assert.ok(rowType.valueWeight<rowType.labelWeight,"row values use a lighter weight than the label");
    const trailingIcons=await page.locator('[data-isw-go="grid"]').evaluate(node=>{
      const lock=node.querySelector(".isw-nav-item-trailing > .isw-icon");
      const arrow=node.querySelector(".isw-nav-chevron");
      const lockStyle=getComputedStyle(lock);
      const arrowStyle=getComputedStyle(arrow);
      return {
        lockWidth:lock.getBoundingClientRect().width,
        arrowWidth:arrow.getBoundingClientRect().width,
        lockHeight:lock.getBoundingClientRect().height,
        arrowHeight:arrow.getBoundingClientRect().height,
        lockColor:lockStyle.color,
        arrowColor:arrowStyle.color
      };
    });
    assert.ok(Math.abs(trailingIcons.lockWidth-trailingIcons.arrowWidth)<=1,"the lock matches the subpage arrow width");
    assert.ok(Math.abs(trailingIcons.lockHeight-trailingIcons.arrowHeight)<=1,"the lock matches the subpage arrow height");
    assert.equal(trailingIcons.lockColor,trailingIcons.arrowColor,"the lock and subpage arrow share the same trailing color");
    await powerGroup.click();
    await page.waitForTimeout(650);
    assert.equal(await powerGroup.getAttribute("aria-expanded"),"false");
    assert.equal(await powerGroupContent.isHidden(),true);
    await powerGroup.click();
    await page.waitForTimeout(650);
    assert.equal(await powerGroup.getAttribute("aria-expanded"),"true");

    assert.deepEqual(
      await page.locator(".isw-nav-group-label").allTextContents(),
      ["Operating strategy","Power control","Grid compliance","System","Maintenance"]
    );
    assert.deepEqual(
      await page.locator(".isw-nav-item-label").allTextContents(),
      [
        "Running Mode","Economic Schedule","Battery",
        "Active Power Dispatch","Import & Export Limits","Output Capability","DI Port",
        "Grid & Protection",
        "Networking","Device Features","MPPT & Strings","CT Detection",
        "Operation Control","Parameter Export","Operation Log"
      ]
    );
    const nestedSurfaces=await page.evaluate(()=>{
      const body=getComputedStyle(document.querySelector(".isw-body"));
      const host=document.querySelector(".isw-page");
      const classes=["isw-panel","isw-table","isw-effective-chain","isw-soc-panel","isw-gantt","isw-plot","isw-profile-list","isw-mode-card"];
      return {
        bodyBackgroundImage:body.backgroundImage,
        surfaces:classes.map(className=>{
          const probe=document.createElement("div");
          probe.className=className;
          host.append(probe);
          const style=getComputedStyle(probe);
          const value={
            background:style.backgroundColor,
            backgroundImage:style.backgroundImage,
            boxShadow:style.boxShadow
          };
          probe.remove();
          return value;
        })
      };
    });
    const referenceSurface=nestedSurfaces.surfaces[0];
    assert.ok(nestedSurfaces.surfaces.every(surface=>surface.background===referenceSurface.background),"all settings boxes share one background colour");
    assert.ok(nestedSurfaces.surfaces.every(surface=>surface.backgroundImage===referenceSurface.backgroundImage),"all settings boxes share one material");
    assert.ok(nestedSurfaces.surfaces.every(surface=>surface.boxShadow===referenceSurface.boxShadow),"all settings boxes share one shadow");
    assert.match(referenceSurface.boxShadow,/inset/,"dark settings boxes keep their shared inner outline");
    assert.match(referenceSurface.boxShadow,/0px 0px 4px/,"dark settings boxes keep the shared outer shadow geometry");
    assert.match(referenceSurface.boxShadow,/rgba\(0, 0, 0, 0?\.35\)/,"dark settings boxes soften the shared outer shadow");
    assert.notEqual(nestedSurfaces.bodyBackgroundImage,referenceSurface.backgroundImage,"the content pane is slightly deeper than its cards");
    const navIcons=await page.locator(".isw-nav-item").evaluateAll(rows=>rows.map(row=>{
      const art=row.querySelector(".target-icon-art");
      return {
        route:row.dataset.iswGo,
        mask:art?.style.getPropertyValue("--icon-mask")||"",
        color:art?getComputedStyle(art).color:"",
        rowColor:getComputedStyle(row).color,
        selected:row.classList.contains("is-selected")
      };
    }));
    assert.equal(navIcons.length,15,"all navigation entries render a settings icon");
    assert.ok(navIcons.every(icon=>icon.mask.includes("/home-assets/icons/settings/")),"navigation uses the shared settings icon library");
    assert.equal(new Set(navIcons.map(icon=>icon.mask)).size,15,"each navigation entry has its own symbol");
    const selectedNavIcon=navIcons.find(icon=>icon.selected);
    const idleNavIcon=navIcons.find(icon=>!icon.selected);
    assert.ok(selectedNavIcon&&idleNavIcon,"the navigation includes selected and idle icon states");
    assert.notEqual(selectedNavIcon.color,idleNavIcon.color,"selected navigation icons use the highlighted ink");
    assert.equal(selectedNavIcon.color,selectedNavIcon.rowColor,"selected navigation icons inherit the selected row colour");

    const dispatchNavHandle=await page.locator('[data-isw-go="dispatch"]').elementHandle();
    const outgoingPageHandle=await page.locator(".isw-page").elementHandle();
    const viewSwitch=await page.evaluate(({outgoingPage,oldNav})=>{
      const outgoingLeft=outgoingPage.getBoundingClientRect().left;
      const outgoingTop=outgoingPage.getBoundingClientRect().top;
      document.querySelector('[data-isw-go="mode"]').click();
      const next=document.querySelector('[data-isw-go="mode"]');
      const oldFill=getComputedStyle(oldNav,"::before");
      const pages=[...document.querySelectorAll(".isw-page")];
      const page=pages.find(item=>item!==outgoingPage);
      const outgoingSnapshot=document.querySelector(".isw-page.isw-page--leaving");
      const title=document.querySelector(".isw-title-label:not(.isw-title-label--ghost)");
      const titleLayer=document.querySelector(".isw-title-layer");
      const readAnimations=node=>node.getAnimations().map(animation=>({duration:animation.effect?.getTiming().duration,delay:animation.effect?.getTiming().delay,easing:animation.effect?.getTiming().easing}));
      return {
        outgoingConnected:Boolean(outgoingSnapshot?.isConnected),
        outgoingAnimations:outgoingSnapshot?readAnimations(outgoingSnapshot):[],
        outgoingLeftDelta:outgoingSnapshot?Math.abs(outgoingSnapshot.getBoundingClientRect().left-outgoingLeft):Infinity,
        outgoingTopDelta:outgoingSnapshot?Math.abs(outgoingSnapshot.getBoundingClientRect().top-outgoingTop):Infinity,
        newPageAnimations:readAnimations(page),
        titleAnimations:readAnimations(title),
        titleLayerAnimations:readAnimations(titleLayer),
        titleGhosts:document.querySelectorAll(".isw-title-label--ghost").length,
        navConnected:oldNav.isConnected,
        oldSelected:oldNav.classList.contains("is-selected"),
        nextSelected:next.classList.contains("is-selected"),
        fillDuration:oldFill.transitionDuration,
        fillEasing:oldFill.transitionTimingFunction,
        pageTransform:getComputedStyle(page).transform
      };
    },{outgoingPage:outgoingPageHandle,oldNav:dispatchNavHandle});
    assert.equal(viewSwitch.outgoingConnected,true,"the outgoing page stays mounted for the overlapping fade");
    assert.ok(viewSwitch.outgoingLeftDelta<=1,"the outgoing page keeps its pre-layout X position when the secondary rail opens");
    assert.ok(viewSwitch.outgoingTopDelta<=1,"the outgoing page keeps its pre-layout Y position");
    assert.equal(viewSwitch.outgoingAnimations.some(item=>item.duration===260&&item.easing==="cubic-bezier(0.4, 0, 0.2, 1)"),true,"the outgoing page shares the smooth crossfade curve");
    assert.equal(viewSwitch.newPageAnimations.some(item=>item.duration===260&&item.delay===0&&item.easing==="cubic-bezier(0.4, 0, 0.2, 1)"),true,"the incoming page starts immediately and completes at 260ms");
    assert.equal(viewSwitch.titleAnimations.some(item=>item.duration===260&&item.delay===0),true,"the incoming title uses the same crossfade timing as the page body");
    assert.equal(viewSwitch.titleLayerAnimations.length,0,"the fixed title layer itself never animates opacity, preserving its blur and stacking context");
    assert.equal(viewSwitch.titleGhosts,1,"the old title stays visible only as a fading ghost");
    assert.equal(viewSwitch.navConnected,true,"page navigation keeps the sidebar DOM stable");
    assert.deepEqual({old:viewSwitch.oldSelected,next:viewSwitch.nextSelected},{old:false,next:true});
    assert.deepEqual({duration:viewSwitch.fillDuration,easing:viewSwitch.fillEasing},{duration:"0.26s",easing:"cubic-bezier(0.4, 0, 0.2, 1)"},"the selected navigation surface shares the smooth crossfade");
    assert.equal(viewSwitch.pageTransform,"none","the page crossfade never moves or scales the content");
    const outgoingFade=await page.evaluate(async()=>{
      const outgoingPage=document.querySelector(".isw-page.isw-page--leaving");
      const incomingPage=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const outgoingAnimation=outgoingPage.getAnimations()
        .find(animation=>animation.effect?.getTiming().duration===260);
      const incomingAnimation=incomingPage.getAnimations()
        .find(animation=>animation.effect?.getTiming().duration===260);
      const outgoingTitle=document.querySelector(".isw-title-label--ghost");
      const outgoingTitleAnimation=outgoingTitle?.getAnimations()
        .find(animation=>animation.effect?.getTiming().duration===260);
      outgoingAnimation.pause();
      incomingAnimation.pause();
      outgoingTitleAnimation?.pause();
      outgoingAnimation.currentTime=130;
      incomingAnimation.currentTime=130;
      if(outgoingTitleAnimation)outgoingTitleAnimation.currentTime=130;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const outgoingMid=Number.parseFloat(getComputedStyle(outgoingPage).opacity);
      const incomingMid=Number.parseFloat(getComputedStyle(incomingPage).opacity);
      const incomingLabelRect=document.querySelector(".isw-title-label:not(.isw-title-label--ghost)").getBoundingClientRect();
      const outgoingLabelRect=outgoingTitle.getBoundingClientRect();
      outgoingAnimation.currentTime=259;
      incomingAnimation.currentTime=259;
      if(outgoingTitleAnimation)outgoingTitleAnimation.currentTime=259;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const snapshot={
        outgoingConnected:outgoingPage.isConnected,
        outgoingOpacity:Number.parseFloat(getComputedStyle(outgoingPage).opacity),
        titleOpacity:outgoingTitle?Number.parseFloat(getComputedStyle(outgoingTitle).opacity):null,
        outgoingMid,
        incomingMid,
        titleLabelLeftDelta:Math.abs(incomingLabelRect.left-outgoingLabelRect.left),
        titleLabelTopDelta:Math.abs(incomingLabelRect.top-outgoingLabelRect.top)
      };
      outgoingAnimation.play();
      incomingAnimation.play();
      outgoingTitleAnimation?.play();
      return snapshot;
    });
    assert.ok(outgoingFade.outgoingMid>0&&outgoingFade.outgoingMid<1,"the outgoing page remains perceptibly fading during the handoff");
    assert.ok(outgoingFade.incomingMid>0&&outgoingFade.incomingMid<1,"the incoming page fades in during the same window");
    assert.ok(Math.abs(outgoingFade.outgoingMid+outgoingFade.incomingMid-1)<=.02,"the two page opacities stay complementary so the center never falls into a blank gap");
    assert.ok(outgoingFade.titleLabelLeftDelta<=1,"the outgoing title label shares the incoming title X origin");
    assert.ok(outgoingFade.titleLabelTopDelta<=1,"the outgoing title label shares the incoming title baseline");
    assert.equal(outgoingFade.outgoingConnected,true,"the outgoing page remains mounted through the fade");
    assert.ok(outgoingFade.outgoingOpacity<=.001,"the outgoing page reaches zero only at the end of the handoff");
    assert.ok(outgoingFade.titleOpacity<=.001,"the outgoing title ghost holds its fade instead of flashing back");
    await waitForPage("mode");
    const rapidSwitch=await page.evaluate(async()=>{
      document.querySelector('[data-isw-go="eco"]').click();
      const incomingPage=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const incomingAnimation=incomingPage.getAnimations()
        .find(animation=>animation.effect?.getTiming().duration===260);
      incomingAnimation.pause();
      incomingAnimation.currentTime=160;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const beforeOpacity=Number.parseFloat(getComputedStyle(incomingPage).opacity);
      document.querySelector('[data-isw-go="batt"]').click();
      const outgoingSnapshot=document.querySelector(".isw-page.isw-page--leaving");
      const afterOpacity=Number.parseFloat(getComputedStyle(outgoingSnapshot).opacity);
      return {beforeOpacity,afterOpacity,outgoingConnected:outgoingSnapshot.isConnected};
    });
    assert.equal(rapidSwitch.outgoingConnected,true,"a rapid second choice keeps the partially faded page mounted for a continuous reversal");
    assert.ok(rapidSwitch.beforeOpacity>0&&rapidSwitch.beforeOpacity<1,"the rapid-switch probe reaches a true intermediate opacity");
    assert.ok(Math.abs(rapidSwitch.afterOpacity-rapidSwitch.beforeOpacity)<=.03,"a rapid second choice fades from the current opacity instead of snapping back to fully visible");
    await waitForPage("batt");
    await page.locator('[data-isw-go="mode"]').click();
    await waitForPage("mode");
    const scrolledNavigation=await page.evaluate(()=>{
      const scroll=document.querySelector(".isw-scroll");
      scroll.scrollTop=Math.min(140,scroll.scrollHeight-scroll.clientHeight);
      const outgoingPage=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const previousScrollTop=scroll.scrollTop;
      const outgoingTopBefore=outgoingPage.getBoundingClientRect().top;
      const outgoingLeftBefore=outgoingPage.getBoundingClientRect().left;
      document.querySelector('[data-isw-go="dispatch"]').click();
      const incomingPage=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const outgoingSnapshot=document.querySelector(".isw-page.isw-page--leaving");
      return {
        previousScrollTop,
        outgoingTopBefore,
        outgoingLeftBefore,
        scrollTopAfter:scroll.scrollTop,
        outgoingTopAfter:outgoingSnapshot.getBoundingClientRect().top,
        outgoingLeftAfter:outgoingSnapshot.getBoundingClientRect().left,
        incomingTop:incomingPage.getBoundingClientRect().top,
        incomingScrollTop:scroll.scrollTop
      };
    });
    assert.ok(scrolledNavigation.previousScrollTop>0,"the navigation probe starts from a scrolled page");
    assert.ok(scrolledNavigation.scrollTopAfter<scrolledNavigation.previousScrollTop,"page navigation never carries the outgoing page scroll offset into the new page");
    assert.equal(scrolledNavigation.incomingScrollTop,scrolledNavigation.scrollTopAfter,"the incoming page applies its remembered scroll position on the first frame");
    assert.ok(Math.abs(scrolledNavigation.outgoingTopAfter-scrolledNavigation.outgoingTopBefore)<=1,"pinning the outgoing page prevents a visible scroll jump during the handoff");
    assert.ok(Math.abs(scrolledNavigation.outgoingLeftAfter-scrolledNavigation.outgoingLeftBefore)<=1,"the outgoing page keeps its horizontal position during the handoff");
    await waitForPage("dispatch");

    const pageChecks = [
      ["mode","Running Mode"],
      ["eco","Economic Schedule"],
      ["batt","Battery"],
      ["dispatch","Active Power Dispatch"],
      ["limits","Import & Export Limits"],
      ["cap","Output Capability"],
      ["di","DI Port"],
      ["net","Networking"],
      ["feat","Device Features"],
      ["mppt","MPPT & Strings"],
      ["ct","CT Detection"],
      ["ops","Operation Control"],
      ["export","Parameter Export"],
      ["log","Operation Log"]
    ];
    const commandButtonChecks={};
    for(const [id,title] of pageChecks){
      await page.locator(`[data-isw-go="${id}"]`).click();
      await waitForPageTitle(title);
      await assertTypographyContract(id);
      await assertCardSpacingContract(id);
      assert.equal(
        await page.locator('.isw-page:not(.isw-page--leaving)').evaluate(root=>[...root.querySelectorAll("input")].filter(input=>!input.getAttribute("aria-label")&&!input.getAttribute("aria-labelledby")&&input.labels.length===0).length),
        0,
        `${title} gives every input an accessible name`
      );
      assert.equal(
        await page.locator('.isw-page:not(.isw-page--leaving)').evaluate(root=>[...root.querySelectorAll("input[data-isw-number]")].filter(input=>!Number.isFinite(Number(input.min))||!Number.isFinite(Number(input.max))).length),
        0,
        `${title} gives every numeric input a finite prototype range`
      );
      if(id==="mode"){
        assert.deepEqual(
          await page.locator('.isw-page[data-page="mode"] .isw-mode-name').allTextContents(),
          ["General Mode","Peak Load Shifting Mode","Economic Mode","UPS Mode","ToU mode","Off-Grid Mode"],
          "Running Mode option labels follow live WattDesk"
        );
      }
      if(id==="limits"){
        assert.equal(await page.locator('.isw-page[data-page="limits"] .isw-row-label').first().textContent(),"Export limit");
      }
      if(id==="mppt"){
        assert.deepEqual(
          await page.locator('.isw-page[data-page="mppt"] .isw-row-label').allTextContents(),
          ["MPPT #1","MPPT #2","MPPT #3","MPPT #4","Parallel MPPT Operation","Shadow scan","Scan interval","Last scan"]
        );
      }
      if(id==="feat"){
        const featureWidths=await page.evaluate(()=>{
          const pageNode=document.querySelector(".isw-page:not(.isw-page--leaving)");
          const pageWidth=pageNode.getBoundingClientRect().width;
          const cardWidths=[...pageNode.querySelectorAll(".isw-panel")].map(node=>node.getBoundingClientRect().width);
          return {pageWidth,cardWidths};
        });
        assert.ok(featureWidths.cardWidths.every(width=>Math.abs(width-featureWidths.pageWidth)<=1),"Device Features cards use the same full content width as other settings pages");
      }
      if(id==="ct"||id==="ops"||id==="export"){
        commandButtonChecks[id]=await page.locator(`.isw-page[data-page="${id}"] [data-isw-standard-button]`).evaluateAll(buttons=>buttons.map(button=>{
          const row=button.closest(".isw-row");
          const buttonRect=button.getBoundingClientRect();
          const rowRect=row.getBoundingClientRect();
          return {
            label:button.getAttribute("aria-label"),
            primary:button.classList.contains("wd-button--primary"),
            neutral:button.classList.contains("wd-button--neutral"),
            danger:button.classList.contains("wd-button--danger"),
            warning:button.classList.contains("wd-button--warning"),
            pill:button.classList.contains("wd-button--pill"),
            glass:button.classList.contains("wd-glass")&&Boolean(button.querySelector(":scope > .wd-glass-material")),
            disabled:button.disabled,
            width:buttonRect.width,
            height:buttonRect.height,
            rightDelta:Math.abs(rowRect.right-buttonRect.right),
            inlineButton:button.classList.contains("isw-inline-button")
          };
        }));
      }
      if(id==="export"){
        assert.match(
          await page.locator('.isw-page[data-page="export"] .isw-row-hint').filter({hasText:/Serial/}).textContent(),
          /2026\/11\/17/,
          "Parameter Export uses the shared year/month/day date format"
        );
        const exportButton=page.locator('.isw-page[data-page="export"] [data-isw-action="export"]');
        await exportButton.click();
        await page.waitForTimeout(40);
        assert.equal(await exportButton.getAttribute("aria-label"),"Preparing...","Parameter Export exposes its busy label");
        assert.equal(await exportButton.locator(":scope > .wd-glass-material").count(),1,"Parameter Export keeps its shared glass surface while busy");
        await page.locator('.isw-page[data-page="export"]').getByRole("button",{name:"Export",exact:true}).waitFor({timeout:2500});
      }
      if(id==="log"){
        const logCraft=await page.evaluate(()=>{
          const table=document.querySelector(".isw-log-table");
          const header=table.querySelector(".isw-log-table-head");
          const rows=[...table.querySelectorAll(".isw-log-row")];
          const first=rows[0];
          const size=node=>getComputedStyle(node).fontSize;
          const headerStyle=getComputedStyle(header);
          const changeLines=[...table.querySelectorAll(".isw-log-change-line")];
          return {
            rowCount:rows.length,
            header:{size:headerStyle.fontSize,weight:Number(headerStyle.fontWeight),height:header.getBoundingClientRect().height},
            times:rows.map(row=>row.querySelector(".isw-log-time")),
            timeTags:rows.every(row=>row.querySelector(".isw-log-time")?.tagName==="TIME"),
            timeDates:rows.every(row=>/^\d{4}-\d{2}-\d{2}T/.test(row.querySelector(".isw-log-time")?.dateTime||"")),
            timeTitles:rows.every(row=>/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(row.querySelector(".isw-log-time")?.title||"")),
            timeTexts:rows.map(row=>row.querySelector(".isw-log-time")?.textContent||""),
            operatorTexts:rows.map(row=>row.querySelector(".isw-log-operator")?.textContent||""),
            operatorEmails:rows.map(row=>row.querySelector(".isw-log-operator")?.dataset.iswEmail||""),
            rowSizes:[
              size(first.querySelector(".isw-log-time")),
              size(first.querySelector(".isw-log-operator")),
              size(first.querySelector(".isw-log-parameter")),
              size(first.querySelector(".isw-log-change-line b")),
              size(first.querySelector(".isw-log-arrow"))
            ],
            groups:rows.map(row=>row.querySelectorAll(".isw-log-change-line").length),
            changeLineCount:changeLines.length,
            linesWrap:changeLines.every(line=>line.scrollWidth<=line.clientWidth+1),
            changeWidth:first.children[1].getBoundingClientRect().width,
            headerChangeLeft:header.children[1].getBoundingClientRect().left,
            rowChangeLeft:first.children[1].getBoundingClientRect().left,
            rowHeights:rows.map(row=>row.getBoundingClientRect().height)
          };
        });
        assert.equal(logCraft.timeTags,true,"Operation Log timestamps are semantic time nodes");
        assert.equal(logCraft.timeDates,true,"Operation Log timestamps keep ISO datetime values");
        assert.equal(logCraft.timeTitles,true,"Operation Log timestamps expose the full local time in title");
        assert.ok(logCraft.timeTexts.some(text=>text==="Just now"||/\d+ (second|minute|hour|day)s? ago/.test(text)),"recent Operation Log times use the shared relative formatter");
        assert.ok(logCraft.timeTexts.some(text=>/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(text)),"older Operation Log times switch to the shared absolute formatter after seven days");
        assert.ok(logCraft.operatorTexts.every(text=>text&&!text.includes("@")),"the operator column shows account names rather than emails");
        assert.ok(logCraft.operatorEmails.every(email=>/^[^@]+@[^@]+$/.test(email)),"each operator row retains its account email for the hover panel");
        assert.deepEqual(logCraft.header,{size:"12px",weight:400,height:32},"Operation Log reuses the quiet 12px Economic Schedule table header");
        assert.ok(new Set(logCraft.rowSizes).size===1&&logCraft.rowSizes[0]==="12px","all Operation Log row text uses one 12px type size");
        assert.ok(logCraft.groups.some(count=>count>1),"Operation Log demonstrates multi-parameter submissions");
        assert.ok(logCraft.groups.reduce((sum,count)=>sum+count,0)>logCraft.rowCount,"multi-parameter records render as multiple change lines");
        assert.equal(logCraft.linesWrap,true,"long Operation Log change lines wrap without horizontal overflow");
        assert.ok(logCraft.changeWidth>=320,"the Change column receives the extra width from the fixed side columns");
        assert.ok(Math.abs(logCraft.headerChangeLeft-logCraft.rowChangeLeft)<=1,"the Change column heading follows the widened body column");
        assert.ok(Math.max(...logCraft.rowHeights)>44,"multi-line log records grow beyond the single-line minimum");
        const operator=page.locator(".isw-log-operator").first();
        assert.ok(await operator.evaluate(node=>node.getBoundingClientRect().height>=28),"Operation Log account controls expose a larger pointer target");
        await operator.hover();
        const emailPanel=page.locator(".isw-hover-popover");
        await emailPanel.waitFor();
        await assertTypographyContract("log:email-popover");
        assert.equal(await emailPanel.textContent(),logCraft.operatorEmails[0],"hovering an operator opens the shared glass panel with the account email");
        await page.waitForTimeout(260);
        const operatorBox=await operator.boundingBox();
        const emailPanelBox=await emailPanel.boundingBox();
        const emailPanelShadow=await emailPanel.evaluate(node=>{
          const material=node.querySelector(":scope > .wd-glass-material");
          return {
            burn:getComputedStyle(material).getPropertyValue("--wd-glass-optical-burn").trim(),
            before:getComputedStyle(material.querySelector(".wd-glass-optics"),"::before").boxShadow
          };
        });
        assert.ok(emailPanelBox.width<270,"the account email popover hugs its content instead of using a fixed width");
        assert.ok(Math.abs((operatorBox.x+operatorBox.width/2)-(emailPanelBox.x+emailPanelBox.width/2))<=1,"the account email popover is centred on the hovered operator");
        assert.equal(emailPanelShadow.burn,"transparent","the email popover removes the shared internal burn shadow");
        assert.ok(!emailPanelShadow.before.includes("0.216"),"the email popover has no visible grey inner bottom shadow");
        await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async value=>{window.__copiedOperatorEmail=value;}}}));
        const emailCopy=emailPanel.locator(".isw-hover-copy");
        await emailCopy.hover();
        const emailCopyHover=await emailCopy.evaluate(node=>{
          const style=getComputedStyle(node);
          return {decoration:style.textDecorationLine,background:style.backgroundColor,borderRadius:style.borderRadius,boxShadow:style.boxShadow};
        });
        assert.equal(emailCopyHover.decoration,"underline","hovering the email marks it as clickable");
        assert.equal(emailCopyHover.background,"rgba(0, 0, 0, 0)","the email hover does not paint an inner grey button surface");
        assert.equal(emailCopyHover.borderRadius,"0px","the email hover does not create a rounded inner rectangle");
        assert.equal(emailCopyHover.boxShadow,"none","the email hover does not add an inner shadow");
        await emailCopy.click();
        await page.waitForTimeout(180);
        assert.equal(await page.evaluate(()=>window.__copiedOperatorEmail),logCraft.operatorEmails[0],"clicking the email copies the account address");
        assert.match(await page.locator("#toast").textContent(),/Email copied/,"copying an account email shows the shared toast");
        await page.mouse.move(0,0);
        await page.waitForTimeout(180);
      }
    }
    for(const [id,buttons] of Object.entries(commandButtonChecks)){
      assert.ok(buttons.length>0,`${id} exposes shared command buttons`);
      assert.ok(buttons.every(button=>button.pill&&button.glass),"inverter command buttons use the shared glass pill anatomy");
      assert.ok(buttons.every(button=>button.primary||button.neutral||button.danger||button.warning),"inverter command buttons use a shared semantic variant");
      assert.ok(buttons.every(button=>!button.inlineButton),"inverter command buttons do not revive the obsolete page-local button class");
      assert.ok(buttons.every(button=>Math.abs(button.height-36)<=1),"inverter command buttons keep the shared 36px height");
      assert.ok(buttons.every(button=>button.rightDelta<=1),"inverter command buttons stay aligned to the row's trailing edge");
    }
    const operationButtons=commandButtonChecks.ops;
    const operationDangerLabels=operationButtons.filter(button=>button.danger).map(button=>button.label).sort();
    const operationWarningLabels=operationButtons.filter(button=>button.warning).map(button=>button.label).sort();
    assert.deepEqual(operationDangerLabels,["Reset all settings"],"Operation Control reserves danger for destructive reset");
    assert.deepEqual(operationWarningLabels,["Power off","Restart"],"Power off and restart use the warning semantic");
    assert.equal(operationButtons.find(button=>button.label==="Clear faults").neutral,true,"Clear faults remains a neutral action");
    assert.ok(operationButtons.every(button=>Math.abs(button.width-144)<=1),"Operation Control command buttons share one 144px width");
    await page.locator('[data-isw-go="ops"]').click();
    await waitForPage("ops");
    const specialButtonIdle=await page.evaluate(()=>{
      const color=name=>{
        const probe=document.createElement("span");
        probe.style.color=`var(${name})`;
        document.body.append(probe);
        const value=getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      const read=selector=>{
        const button=document.querySelector(selector);
        const fill=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"));
        return {
          label:getComputedStyle(button.querySelector(".wd-control-label")).color,
          outlineWidth:fill.getPropertyValue("--wd-glass-outline-width").trim(),
          drop:fill.getPropertyValue("--wd-glass-drop").trim(),
          dropBlur:fill.getPropertyValue("--wd-glass-drop-blur").trim()
        };
      };
      return {
        warning:read('.isw-page[data-page="ops"] [data-isw-action="restart"]'),
        danger:read('.isw-page[data-page="ops"] [data-isw-action="factory"]'),
        orange:color("--wd-accent-orange"),
        red:color("--wd-accent-red")
      };
    });
    assert.equal(specialButtonIdle.warning.label,specialButtonIdle.orange,"warning buttons use the orange warning ink at rest");
    assert.equal(specialButtonIdle.danger.label,specialButtonIdle.red,"danger buttons use the red danger ink at rest");
    assert.deepEqual(
      [specialButtonIdle.warning.outlineWidth,specialButtonIdle.warning.dropBlur],
      [".5px","2px"],
      "special-colour buttons keep the lighter idle outline and shadow"
    );
    assert.match(specialButtonIdle.warning.drop,/0\.07|\.07/,"special-colour buttons keep the lighter idle shadow");
    const restartAction=page.locator('.isw-page[data-page="ops"] [data-isw-action="restart"]');
    await restartAction.hover();
    await page.waitForTimeout(400);
    const warningHoverDark=await restartAction.evaluate(button=>{
      const fill=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"));
      const overlay=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"),"::after");
      const probe=document.createElement("span");
      probe.style.backgroundColor="color-mix(in srgb,var(--wd-accent-orange) 58%,var(--wd-accent-red) 42%)";
      document.body.append(probe);
      const expectedFill=getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        label:getComputedStyle(button.querySelector(".wd-control-label")).color,
        fill:overlay.backgroundColor,
        expectedFill,
        opacity:overlay.opacity,
        transitionProperty:overlay.transitionProperty,
        transitionDuration:overlay.transitionDuration,
        baseTint:fill.backgroundColor
      };
    });
    assert.equal(warningHoverDark.label,"rgb(255, 255, 255)","warning hover uses white ink in dark mode");
    assert.equal(warningHoverDark.fill,warningHoverDark.expectedFill,"warning hover uses a stronger corresponding fill");
    assert.equal(warningHoverDark.opacity,"1");
    assert.match(warningHoverDark.transitionProperty,/opacity/,"special-colour hover fades through an opacity layer");
    assert.notEqual(warningHoverDark.transitionDuration,"0s","special-colour hover has an explicit transition");
    assert.notEqual(warningHoverDark.fill,warningHoverDark.baseTint,"the hover colour is painted by the fading overlay");
    const factoryAction=page.locator('.isw-page[data-page="ops"] [data-isw-action="factory"]');
    await factoryAction.hover();
    await page.waitForTimeout(400);
    const dangerHover=await factoryAction.evaluate(button=>{
      const fill=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"));
      const overlay=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"),"::after");
      const probe=document.createElement("span");
      probe.style.backgroundColor="var(--wd-accent-red)";
      document.body.append(probe);
      const expectedFill=getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {label:getComputedStyle(button.querySelector(".wd-control-label")).color,fill:overlay.backgroundColor,expectedFill,opacity:overlay.opacity};
    });
    assert.equal(dangerHover.label,"rgb(255, 255, 255)","danger hover uses white ink in dark mode");
    assert.equal(dangerHover.fill,dangerHover.expectedFill,"danger hover uses a stronger corresponding fill");
    assert.equal(dangerHover.opacity,"1");
    await page.evaluate(()=>document.documentElement.dataset.theme="light");
    await restartAction.hover();
    await page.waitForTimeout(400);
    assert.equal(
      await restartAction.locator(".wd-control-label").evaluate(node=>getComputedStyle(node).color),
      "rgb(255, 255, 255)",
      "warning hover keeps white ink in light mode"
    );
    await page.mouse.move(0,0);
    await page.waitForTimeout(80);
    const warningExitOpacity=await restartAction.evaluate(button=>Number.parseFloat(getComputedStyle(
      button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"),
      "::after"
    ).opacity));
    assert.ok(warningExitOpacity>0&&warningExitOpacity<1,"warning hover fades out instead of switching abruptly");
    await page.waitForTimeout(360);
    assert.equal(
      await restartAction.evaluate(button=>getComputedStyle(
        button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"),
        "::after"
      ).opacity),
      "0",
      "the warning fill completes its exit fade"
    );
    await page.evaluate(()=>document.documentElement.dataset.theme="dark");
    await page.locator('[data-isw-go="ct"]').click();
    await waitForPageTitle("CT Detection");
    const initialCtWarning=page.locator('.isw-page[data-page="ct"] .isw-status--warning');
    assert.equal(await initialCtWarning.count(),1,"CT starts with the reversed-phase warning");
    const ctWarningColor=await initialCtWarning.evaluate(node=>{
      const probe=document.createElement("span");
      probe.style.color="var(--wd-accent-orange)";
      document.body.append(probe);
      const expected=getComputedStyle(probe).color;
      probe.remove();
      return {actual:getComputedStyle(node).color,expected};
    });
    assert.equal(ctWarningColor.actual,ctWarningColor.expected,"the Reversed status keeps its warning color");
    const runCheck=page.locator('.isw-page[data-page="ct"]').getByRole("button",{name:"Run check",exact:true});
    assert.equal(await runCheck.evaluate(button=>button.matches(".wd-button--primary.wd-glass")),true,"CT Run check uses the shared primary glass button");
    await runCheck.click();
    const checking=page.locator('.isw-page[data-page="ct"]').getByRole("button",{name:"Checking...",exact:true});
    await checking.waitFor();
    assert.equal(await checking.isDisabled(),true,"CT Run check disables its shared button while checking");
    assert.equal(await checking.evaluate(button=>button.matches(".wd-button--primary.wd-glass")),true,"the CT busy state keeps the shared primary glass material");
    await page.locator('.isw-page[data-page="ct"]').getByRole("button",{name:"Run check",exact:true}).waitFor({timeout:2500});
    await page.locator('[data-isw-go="net"]').click();
    await waitForPage("net");
    const networkingCraft=await page.evaluate(()=>{
      const table=document.querySelector('.isw-page[data-page="net"] > .isw-table');
      const rows=[...table.querySelectorAll(".isw-table-row")];
      const labels=rows.map(row=>row.querySelector(".isw-table-symbol"));
      const values=rows.map(row=>row.querySelector(".isw-copy-value,.isw-readonly-value"));
      const rowTitle=document.querySelector('.isw-page[data-page="net"] .isw-panel .isw-row-label');
      const referenceStyle=getComputedStyle(rowTitle);
      const tokenColor=name=>{
        const probe=document.createElement("span");
        probe.style.color=`var(${name})`;
        document.body.append(probe);
        const color=getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const format=node=>{
        const style=getComputedStyle(node);
        return {family:style.fontFamily,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,spacing:style.letterSpacing,color:style.color};
      };
      return {
        reference:format(rowTitle),
        labels:labels.map(format),
        values:values.map(format),
        secondaryColor:tokenColor("--wd-label-secondary"),
        primaryColor:tokenColor("--wd-label-primary"),
        rowHeights:rows.map(row=>row.getBoundingClientRect().height),
        copyCount:table.querySelectorAll(".isw-copy-value").length,
        copyValues:[...table.querySelectorAll(".isw-copy-value")].map(node=>node.dataset.iswCopyValue)
      };
    });
    const typographySignature=({family,size,weight,spacing})=>({family,size,weight,spacing});
    const networkingReference=typographySignature(networkingCraft.reference);
    assert.ok(networkingCraft.labels.every(style=>JSON.stringify(typographySignature(style))===JSON.stringify(networkingReference)),"network labels reuse the card-title typography");
    assert.ok(networkingCraft.values.every(style=>JSON.stringify(typographySignature(style))===JSON.stringify(networkingReference)),"network values reuse the card-title typography");
    assert.ok(networkingCraft.labels.every(style=>style.color===networkingCraft.secondaryColor),"network labels use the secondary label color");
    assert.ok(networkingCraft.values.every(style=>style.color===networkingCraft.primaryColor),"network copy values use the primary label color");
    assert.ok(networkingCraft.rowHeights.every(height=>Math.abs(height-46)<=1),"network rows use a slightly more open 46px rhythm");
    assert.equal(networkingCraft.copyCount,4);
    assert.deepEqual(networkingCraft.copyValues,["192.168.178.97","255.255.255.0","192.168.178.1","B4:3A:28:11:9C:04"]);
    const copyValue=page.locator('.isw-copy-value[data-isw-copy-value="192.168.178.97"]');
    const copyRest=await copyValue.evaluate(node=>({
      decoration:getComputedStyle(node).textDecorationLine,
      height:node.getBoundingClientRect().height
    }));
    assert.equal(copyRest.decoration,"none");
    assert.ok(copyRest.height>=28,"network copy controls expose a larger pointer target");
    await copyValue.hover();
    await page.waitForTimeout(80);
    assert.equal(await copyValue.evaluate(node=>getComputedStyle(node).textDecorationLine),"underline","network values underline only on hover");
    await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{}}}));
    await copyValue.click();
    await page.waitForTimeout(200);
    assert.match(await page.locator("#toast").textContent(),/IP address copied/,"copying a network value shows the shared success toast");

    await page.locator('[data-isw-go="mppt"]').click();
    await waitForPage("mppt");
    assert.equal(
      await page.locator('[data-isw-number="mppt.interval"]').count(),
      0,
      "the scan interval is a choice control instead of an editable number"
    );
    const intervalTrigger=page.locator("[data-isw-interval-trigger]");
    assert.equal(
      await intervalTrigger.evaluate(node=>node.matches("button.wd-select-trigger.wd-edit-field.wd-select--adaptive")),
      true,
      "the scan interval trigger uses the shared adaptive select variant"
    );
    const intervalTriggerCraft=await intervalTrigger.evaluate(node=>{
      const style=getComputedStyle(node);
      const arrow=getComputedStyle(node.querySelector(".wd-select-chevron"));
      return {
        width:node.getBoundingClientRect().width,
        clientWidth:node.clientWidth,
        scrollWidth:node.scrollWidth,
        paddingLeft:style.paddingLeft,
        paddingRight:style.paddingRight,
        gap:style.gap,
        arrowWidth:arrow.width,
        arrowHeight:arrow.height
      };
    });
    assert.ok(intervalTriggerCraft.width<150,"the scan interval trigger uses the content-sized shared select geometry");
    assert.ok(intervalTriggerCraft.scrollWidth<=intervalTriggerCraft.clientWidth,"the shared select trigger keeps its complete value visible");
    assert.deepEqual(
      [intervalTriggerCraft.paddingLeft,intervalTriggerCraft.paddingRight,intervalTriggerCraft.gap],
      ["12px","12px","6px"],
      "the scan interval trigger inherits the shared select spacing"
    );
    assert.deepEqual([intervalTriggerCraft.arrowWidth,intervalTriggerCraft.arrowHeight],["14px","14px"],"the select arrow keeps the shared 14px box");
    assert.equal(await intervalTrigger.locator(".wd-select-value").textContent(),"30 mins");
    assert.equal(await intervalTrigger.getAttribute("aria-label"),"Scan interval: 30 mins");
    assert.equal(await intervalTrigger.getAttribute("aria-expanded"),"false");
    await intervalTrigger.click();
    const intervalPopover=page.locator(".isw-interval-popover");
    await intervalPopover.waitFor();
    const intervalTriggerBox=await intervalTrigger.boundingBox();
    const intervalPopoverBox=await intervalPopover.boundingBox();
    assert.ok(
      Math.abs((intervalPopoverBox.x+intervalPopoverBox.width)-(intervalTriggerBox.x+intervalTriggerBox.width)-30)<=1,
      "the select popover right edge shifts beyond the trigger by the shared 30px radius"
    );
    assert.equal(
      await intervalPopover.evaluate(node=>node.classList.contains("wd-select-popover")&&Boolean(node.querySelector(".wd-menu"))),
      true,
      "the scan interval popup reuses the shared select menu anatomy"
    );
    const intervalOptions=intervalPopover.locator('[role="option"]');
    assert.deepEqual(
      await intervalPopover.locator(".wd-menu-label").allTextContents(),
      ["5 mins","15 mins","30 mins","1 h"],
      "the scan interval popup offers the final time choices"
    );
    assert.deepEqual(
      await intervalOptions.evaluateAll(nodes=>nodes.map(node=>({
        minutes:Number(node.dataset.value),
        selected:node.getAttribute("aria-selected")
      }))),
      [
        {minutes:5,selected:"false"},
        {minutes:15,selected:"false"},
        {minutes:30,selected:"true"},
        {minutes:60,selected:"false"}
      ],
      "the current scan interval is the only selected radio"
    );
    const intervalChoiceCraft=await intervalPopover.evaluate(menu=>{
      const checks=[...menu.querySelectorAll(".wd-select-check")];
      const selected=menu.querySelector('.wd-select-option[aria-selected="true"] .wd-select-check');
      return {
        sizes:checks.map(check=>{
          const box=check.getBoundingClientRect();
          return [box.width,box.height];
        }),
        idleBorder:getComputedStyle(checks[0]).borderStyle,
        selectedMask:getComputedStyle(selected).maskImage
      };
    });
    assert.ok(intervalChoiceCraft.sizes.every(([width,height])=>Math.abs(width-18)<=1&&Math.abs(height-18)<=1));
    assert.equal(intervalChoiceCraft.idleBorder,"solid","unselected interval choices show the shared hollow radio");
    assert.match(intervalChoiceCraft.selectedMask,/check-circle\.svg/,"the selected interval uses the solid check-circle mark");
    await page.locator('.isw-interval-popover [data-value="5"]').click();
    await page.waitForTimeout(420);
    assert.equal(await page.locator("[data-isw-interval-trigger] .wd-select-value").textContent(),"5 mins");
    assert.equal(await page.locator(".isw-actions").isVisible(),true,"changing the scan interval marks settings dirty");
    await page.locator("[data-isw-interval-trigger]").click();
    await page.locator('.isw-interval-popover [data-value="30"]').click();
    await page.waitForTimeout(420);
    assert.equal(await page.locator("[data-isw-interval-trigger] .wd-select-value").textContent(),"30 mins");
    const readonlyDataCraft=await page.evaluate(()=>{
      const row=[...document.querySelectorAll(".isw-row--readonly-data")].find(node=>node.querySelector(".isw-row-label")?.textContent==="Last scan");
      const label=row?.querySelector(".isw-row-label");
      const value=row?.querySelector(".isw-readonly-value");
      const tokenColor=name=>{
        const probe=document.createElement("span");
        probe.style.color=`var(${name})`;
        document.body.append(probe);
        const color=getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const format=node=>{
        const style=getComputedStyle(node);
        return {family:style.fontFamily,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,spacing:style.letterSpacing,color:style.color};
      };
      return {
        label:format(label),
        value:format(value),
        secondaryColor:tokenColor("--wd-label-secondary"),
        primaryColor:tokenColor("--wd-label-primary")
      };
    });
    const readonlySignature=({family,size,weight,lineHeight,spacing})=>({family,size,weight,lineHeight,spacing});
    assert.deepEqual(
      readonlySignature(readonlyDataCraft.label),
      readonlySignature(readonlyDataCraft.value),
      "read-only data labels and values share the title typography"
    );
    assert.equal(readonlyDataCraft.label.color,readonlyDataCraft.secondaryColor,"read-only data labels use secondary text");
    assert.equal(readonlyDataCraft.value.color,readonlyDataCraft.primaryColor,"read-only data values use primary text");
    const lastScanTime=page.locator(".isw-row--readonly-data time.isw-time-label");
    assert.equal(await lastScanTime.textContent(),"18 minutes ago","Last scan uses the shared relative-time formatter");
    assert.equal(await lastScanTime.evaluate(node=>node.tagName),"TIME","Last scan is a semantic time element");
    assert.ok(!Number.isNaN(Date.parse(await lastScanTime.getAttribute("datetime"))),"Last scan exposes a machine-readable datetime");
    assert.match(await lastScanTime.getAttribute("title"),/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,"Last scan keeps the full absolute time in its title");

    await page.locator('[data-isw-go="ct"]').click();
    await waitForPage("ct");
    const ctReadonlyCraft=await page.evaluate(()=>{
      const table=document.querySelector('.isw-page[data-page="ct"] > .isw-table--readonly-data');
      const rows=[...table.querySelectorAll(".isw-table-row")];
      const tokenColor=name=>{
        const probe=document.createElement("span");
        probe.style.color=`var(${name})`;
        document.body.append(probe);
        const color=getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const format=node=>{
        const style=getComputedStyle(node);
        return {family:style.fontFamily,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,spacing:style.letterSpacing,color:style.color};
      };
      const warningProbe=document.createElement("span");
      warningProbe.className="isw-status isw-status--warning";
      rows[2].append(warningProbe);
      const resolvedWarningColor=getComputedStyle(warningProbe).color;
      warningProbe.remove();
      return {
        labels:rows.map(row=>format(row.firstElementChild)),
        values:rows.map(row=>format(row.lastElementChild)),
        correct:format(rows[0].lastElementChild),
        rowHeights:rows.map(row=>row.getBoundingClientRect().height),
        secondaryColor:tokenColor("--wd-label-secondary"),
        primaryColor:tokenColor("--wd-label-primary"),
        successColor:tokenColor("--wd-accent-green"),
        warningColor:tokenColor("--wd-accent-orange"),
        resolvedWarningColor
      };
    });
    const ctSignature=({family,size,weight,lineHeight,spacing})=>({family,size,weight,lineHeight,spacing});
    assert.ok(ctReadonlyCraft.labels.every(style=>JSON.stringify(ctSignature(style))===JSON.stringify(ctSignature(ctReadonlyCraft.values[0]))),"CT labels share the result typography");
    assert.ok(ctReadonlyCraft.values.every(style=>JSON.stringify(ctSignature(style))===JSON.stringify(ctSignature(ctReadonlyCraft.values[0]))),"CT statuses and timestamp share the result typography");
    assert.ok(ctReadonlyCraft.labels.every(style=>style.color===ctReadonlyCraft.secondaryColor),"CT labels use secondary text");
    assert.ok(ctReadonlyCraft.rowHeights.every(height=>Math.abs(height-50)<=1),"CT result rows use the shared 50px settings rhythm");
    assert.equal(ctReadonlyCraft.values[3].color,ctReadonlyCraft.primaryColor,"the CT timestamp uses primary text");
    assert.equal(ctReadonlyCraft.correct.color,ctReadonlyCraft.successColor,"the Correct status uses the shared success colour");
    assert.equal(ctReadonlyCraft.resolvedWarningColor,ctReadonlyCraft.warningColor,"the warning status keeps its semantic colour");
    const lastCheckTime=page.locator('.isw-page[data-page="ct"] time.isw-time-label');
    assert.equal(await lastCheckTime.textContent(),"Just now","a fresh CT check uses the shared Just now label");
    assert.equal(await lastCheckTime.evaluate(node=>node.tagName),"TIME","CT Last check is a semantic time element");
    assert.ok(!Number.isNaN(Date.parse(await lastCheckTime.getAttribute("datetime"))),"CT Last check exposes a machine-readable datetime");
    assert.match(await lastCheckTime.getAttribute("title"),/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,"CT Last check keeps the full absolute time in its title");

    await page.locator('[data-isw-go="batt"]').click();
    await waitForPage("batt");
    const typeScale=await page.evaluate(()=>{
      const read=selector=>{
        const style=getComputedStyle(document.querySelector(selector));
        return {color:style.color,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,transform:style.textTransform,spacing:style.letterSpacing};
      };
      const probe=document.createElement("span");
      probe.style.cssText="color:var(--wd-label-primary)";
      document.querySelector(".isw-page").append(probe);
      const primary=getComputedStyle(probe).color;
      probe.style.color="var(--wd-label-secondary)";
      const secondary=getComputedStyle(probe).color;
      probe.remove();
      return {
        primary,
        secondary,
        group:read(".isw-group-title"),
        label:read(".isw-row-label"),
        hint:read(".isw-row-hint"),
        value:read(".isw-number input")
      };
    });
    assert.deepEqual({size:typeScale.group.size,weight:typeScale.group.weight},{size:"12px",weight:590},"group titles use Caption1 emphasized");
    assert.equal(typeScale.group.color,typeScale.primary,"group titles use primary ink");
    assert.deepEqual({size:typeScale.label.size,weight:typeScale.label.weight},{size:"14px",weight:510},"row labels use 14/14 medium");
    assert.equal(typeScale.label.color,typeScale.primary,"row labels use primary ink");
    assert.deepEqual({size:typeScale.hint.size,weight:typeScale.hint.weight},{size:"12px",weight:400},"row hints use Caption1 regular");
    assert.equal(typeScale.hint.color,typeScale.secondary,"row hints use secondary ink");
    assert.deepEqual({size:typeScale.value.size,weight:typeScale.value.weight},{size:"13px",weight:510},"editable numeric values use the unified 13px field typography");
    const rowHintWidth=await page.evaluate(()=>{
      const row=[...document.querySelectorAll(".isw-row")].find(node=>node.querySelector(".isw-row-hint")&&node.querySelector(".isw-number"));
      const copy=row.querySelector(".isw-row-copy");
      const hint=row.querySelector(".isw-row-hint");
      const control=row.lastElementChild;
      const gap=Number.parseFloat(getComputedStyle(row).gap);
      return {
        copyWidth:copy.getBoundingClientRect().width,
        hintWidth:hint.getBoundingClientRect().width,
        available:row.getBoundingClientRect().width-control.getBoundingClientRect().width-gap
      };
    });
    assert.ok(rowHintWidth.hintWidth>330,"row hints can use more than the previous fixed 330px width");
    assert.ok(Math.abs(rowHintWidth.hintWidth-rowHintWidth.available)<=1,"row hints fill the remaining space before the control");
    await page.locator('[data-isw-go="limits"]').click();
    await waitForPage("limits");
    const feedPanel=page.locator(".isw-panel").first();
    const feedToggle=page.locator('[data-isw-switch="limits.feedOn"]');
    const feedToggleHandle=await feedToggle.elementHandle();
    assert.equal(await feedPanel.locator(".isw-row").count(),3);
    const limitBasis=page.locator('[data-isw-seg="limits.basis"]');
    assert.equal(await limitBasis.count(),1,"the export panel exposes limit basis");
    assert.equal(await limitBasis.locator('[data-value="0"]').getAttribute("aria-selected"),"true","Total is the default basis");
    await limitBasis.locator('[data-value="1"]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.isw-page[data-page="limits"] > .isw-note').count(),2,"per-phase mode adds its note");
    assert.match(await page.locator('.isw-page[data-page="limits"] > .isw-note').first().innerText(),/per-phase closed-loop control/i,"the note preserves the firmware requirement");
    assert.match(await page.locator('.isw-page[data-page="limits"] > .isw-note').first().innerText(),/increase PV curtailment/i,"the note preserves the curtailment warning");
    assert.equal(await page.locator(".isw-actions").isVisible(),true,"changing limit basis dirties the current page");
    await limitBasis.locator('[data-value="0"]').click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('.isw-page[data-page="limits"] > .isw-note').count(),1,"Total removes the per-phase note");
    assert.equal(await page.locator(".isw-actions").isVisible(),false,"returning to Total restores the saved baseline");
    await feedToggle.click();
    await page.waitForTimeout(40);
    assert.equal(await page.locator(".isw-panel").first().locator(".isw-row").count(),1,"the conditional row is removed immediately");
    assert.equal(await page.evaluate(node=>node.isConnected,feedToggleHandle),true,"the feed-in switch remains the same DOM node during growth");
    await page.waitForFunction(()=>document.querySelector(".isw-panel")?.getAnimations()
      .some(animation=>animation.effect?.getTiming().duration===280),null,{polling:10,timeout:500});
    const collapseMotion=await page.locator(".isw-panel").first().evaluate(node=>{
      const animation=node.getAnimations()[0];
      return {
        overflow:getComputedStyle(node).overflow,
        duration:animation?.effect?.getTiming().duration,
        easing:animation?.effect?.getTiming().easing
      };
    });
    assert.equal(collapseMotion.overflow,"hidden");
    assert.equal(collapseMotion.duration,280,"the card collapses with the shared content-growth duration");
    assert.equal(collapseMotion.easing,"cubic-bezier(0.22, 0.8, 0.25, 1)");
    await page.waitForTimeout(320);
    assert.equal(await page.locator(".isw-panel").first().evaluate(node=>node.style.height===""&&node.style.overflow===""),true,"the collapsed card releases its temporary fixed height and clipping");
    await page.locator('[data-isw-switch="limits.feedOn"]').click();
    assert.equal(await page.locator(".isw-panel").first().locator(".isw-row").count(),3,"the conditional rows return immediately");
    await page.waitForFunction(
      ()=>document.querySelector(".isw-panel")?.getAnimations().some(animation=>animation.effect?.getTiming().duration===280),
      null,
      {polling:10,timeout:2000}
    );
    await page.waitForTimeout(320);
    const supportingCopy=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll(".isw-panel")];
      const firstCard=cards[0].getBoundingClientRect();
      const lastCard=cards.at(-1).getBoundingClientRect();
      const foot=document.querySelector(".isw-chain-foot").getBoundingClientRect();
      const note=document.querySelector(".isw-note");
      const noteBox=note.getBoundingClientRect();
      const noteText=note.querySelector("div");
      const noteStyle=getComputedStyle(noteText);
      const emphasis=[...note.querySelectorAll("b")].map(node=>{
        const style=getComputedStyle(node);
        return {color:style.color,fontSize:style.fontSize};
      });
      return {
        footLeft:foot.left-firstCard.left,
        footRight:firstCard.right-foot.right,
        noteLeft:noteBox.left-lastCard.left,
        noteRight:lastCard.right-noteBox.right,
        noteColor:noteStyle.color,
        noteFontSize:noteStyle.fontSize,
        emphasis
      };
    });
    assert.ok(Math.abs(supportingCopy.footLeft-24)<=1&&Math.abs(supportingCopy.footRight-24)<=1,"supporting copy aligns to the card content-safe width");
    assert.ok(Math.abs(supportingCopy.noteLeft-24)<=1&&Math.abs(supportingCopy.noteRight-24)<=1,"info notes stay inside the card content-safe width");
    assert.equal(supportingCopy.emphasis.length,2,"the limits note renders both emphasized terms");
    assert.ok(supportingCopy.emphasis.every(item=>item.fontSize===supportingCopy.noteFontSize),"emphasized terms keep the sentence font size");
    assert.ok(supportingCopy.emphasis.every(item=>item.color!==supportingCopy.noteColor),"emphasized terms use stronger ink than the note copy");
    assert.ok(supportingCopy.emphasis.every(item=>!['rgb(0, 0, 0)','rgb(255, 255, 255)'].includes(item.color)),"emphasized terms avoid pure black and pure white");
    await page.locator('[data-isw-go="eco"]').click();
    await waitForPageTitle("Economic Schedule");
    await page.locator(".isw-eco-overview").waitFor();
    const ecoCardTitles=await page.locator('.isw-page[data-page="eco"] > .isw-group-title').allTextContents();
    assert.deepEqual(ecoCardTitles,["24h Overview","Schedule periods"],"Economic Schedule lifts both card titles into the shared group-heading layer");
    assert.equal(await page.locator(".isw-eco-overview .isw-eco-overview-title").count(),0,"the overview card does not keep a private title inside its surface");
    assert.ok(Math.abs((await page.locator(".isw-page:not(.isw-page--leaving)").boundingBox()).width-640)<=1,"the schedule reuses the standard settings content column");
    const ecoFieldStyle=await page.evaluate(()=>{
      const read=selector=>{
        const node=document.querySelector(selector);
        const style=getComputedStyle(node);
        return {
          className:node.className,
          height:style.height,
          borderRadius:style.borderRadius,
          fontSize:style.fontSize,
          fontWeight:Number(style.fontWeight)
        };
      };
      const overview=getComputedStyle(document.querySelector(".isw-eco-overview"));
      const table=getComputedStyle(document.querySelector(".isw-eco-table"));
      const kW=document.querySelector(".isw-eco-kw");
      const powerInput=document.querySelector("[data-isw-eco-power]");
      const info=document.querySelector(".isw-eco-info");
      const more=document.querySelector(".isw-eco-more");
      const moreIcon=more.querySelector(".isw-eco-more-icon");
      const timeArrow=document.querySelector(".isw-eco-time-range-trigger");
      return {
        overviewPaddingLeft:overview.paddingLeft,
        overviewPaddingRight:overview.paddingRight,
        overviewPaddingTop:overview.paddingTop,
        overviewPaddingBottom:overview.paddingBottom,
        tablePaddingLeft:table.paddingLeft,
        tablePaddingRight:table.paddingRight,
        trackHeight:getComputedStyle(document.querySelector(".isw-eco-track")).height,
        axisLines:[...document.querySelectorAll(".isw-eco-axis i")].map(node=>getComputedStyle(node).backgroundColor),
        time:read(".isw-eco-time-range-field"),
        mode:read(".isw-eco-mode-trigger"),
        power:read(".isw-eco-percent-field"),
        kWColor:getComputedStyle(kW).color,
        kWWeight:Number(getComputedStyle(kW).fontWeight),
        kWWhiteSpace:getComputedStyle(kW).whiteSpace,
        powerAppearance:getComputedStyle(powerInput).appearance,
        timeArrowBox:[timeArrow.getBoundingClientRect().width,timeArrow.getBoundingClientRect().height],
        timeArrowExpanded:timeArrow.getAttribute("aria-expanded"),
        infoBox:[info.getBoundingClientRect().width,info.getBoundingClientRect().height],
        moreClassName:more.className,
        moreGlass:Boolean(more.querySelector(":scope > .wd-glass-material")),
        moreBox:[more.getBoundingClientRect().width,more.getBoundingClientRect().height],
        moreIconBox:[moreIcon.getBoundingClientRect().width,moreIcon.getBoundingClientRect().height],
        powerWidth:document.querySelector(".isw-eco-percent-field").getBoundingClientRect().width,
        powerInputScrollWidth:powerInput.scrollWidth,
        powerInputClientWidth:powerInput.clientWidth
      };
    });
    assert.deepEqual(
      [ecoFieldStyle.overviewPaddingLeft,ecoFieldStyle.overviewPaddingRight,ecoFieldStyle.tablePaddingLeft,ecoFieldStyle.tablePaddingRight],
      ["24px","24px","24px","24px"],
      "economic schedule cards use the corner-sized horizontal inset"
    );
    assert.deepEqual(
      [ecoFieldStyle.overviewPaddingTop,ecoFieldStyle.overviewPaddingBottom],
      ["28px","18px"],
      "the overview card uses the reviewed asymmetric vertical inset"
    );
    assert.equal(ecoFieldStyle.trackHeight,"6px","the overview timeline uses the refined 6px track");
    assert.equal(ecoFieldStyle.axisLines.every(color=>color==="rgba(0, 0, 0, 0)"),true,"the timeline has no axis rules");
    for(const field of [ecoFieldStyle.time,ecoFieldStyle.mode,ecoFieldStyle.power]){
      assert.match(field.className,/\bwd-edit-field\b/);
      assert.equal(field.height,"36px");
      assert.equal(field.borderRadius,"18px");
      assert.equal(field.fontSize,"13px");
      assert.equal(field.fontWeight,510);
    }
    assert.match(ecoFieldStyle.mode.className,/\bwd-select-trigger\b/,"the economic mode uses the shared select trigger");
    assert.match(ecoFieldStyle.mode.className,/\bwd-select--adaptive\b/,"the economic mode uses the shared adaptive variant");
    assert.equal(ecoFieldStyle.kWWeight,510,"calculated kW uses readable settings typography");
    assert.equal(ecoFieldStyle.kWWhiteSpace,"nowrap","calculated kW never breaks into a separate unit line");
    assert.equal(ecoFieldStyle.powerAppearance,"textfield","percentage fields hide native number steppers");
    assert.deepEqual(ecoFieldStyle.timeArrowBox,[32,36],"the time field exposes an enlarged trailing dropdown target");
    assert.ok(ecoFieldStyle.timeArrowExpanded===null||ecoFieldStyle.timeArrowExpanded==="false","the dropdown target owns its expanded state");
    assert.deepEqual(ecoFieldStyle.infoBox,[28,28],"the power-limit information control has an enlarged hit target");
    assert.match(ecoFieldStyle.moreClassName,/\bwd-button--disc\b/);
    assert.match(ecoFieldStyle.moreClassName,/\bwd-glass\b/);
    assert.equal(ecoFieldStyle.moreGlass,true,"the row action uses shared Glass Surface material");
    assert.deepEqual(ecoFieldStyle.moreBox,[36,36],"the row action matches the shared 36px icon button");
    assert.deepEqual(ecoFieldStyle.moreIconBox,[18,18],"the three-dot glyph keeps a legible optical size");
    assert.ok(ecoFieldStyle.powerWidth<=72,"the percentage field contracts around a three-digit value and unit");
    assert.ok(ecoFieldStyle.powerInputScrollWidth<=ecoFieldStyle.powerInputClientWidth,"a 100% value remains fully visible inside the compact field");
    const ecoSpacing=await page.evaluate(()=>{
      const overview=document.querySelector(".isw-eco-overview").getBoundingClientRect();
      const table=document.querySelector(".isw-eco-table").getBoundingClientRect();
      const note=document.querySelector(".isw-note").getBoundingClientRect();
      const time=document.querySelector(".isw-eco-time-range-field").getBoundingClientRect();
      const timeRange=document.querySelector(".isw-eco-time-range").getBoundingClientRect();
      const timeArrow=document.querySelector(".isw-eco-time-range-trigger").getBoundingClientRect();
      const mode=document.querySelector(".isw-eco-mode-trigger").getBoundingClientRect();
      const more=document.querySelector(".isw-eco-more").getBoundingClientRect();
      const add=document.querySelector(".isw-eco-add").getBoundingClientRect();
      const head=document.querySelector(".isw-eco-table-head");
      const headText=getComputedStyle(head.querySelector("span"));
      const titles=[...document.querySelectorAll('.isw-page[data-page="eco"] > .isw-group-title')].map(node=>node.getBoundingClientRect());
      return {
        firstTitleGap:overview.top-titles[0].bottom,
        betweenCardTitleGap:titles[1].top-overview.bottom,
        titleToTableGap:table.top-titles[1].bottom,
        noteGap:note.top-table.bottom,
        timeWidth:time.width,
        modeWidth:mode.width,
        modeClientWidth:document.querySelector(".isw-eco-mode-trigger").clientWidth,
        modeScrollWidth:document.querySelector(".isw-eco-mode-trigger").scrollWidth,
        timeLeftDelta:Math.abs(time.left-timeRange.left),
        timeRightDelta:Math.abs(time.right-timeRange.right),
        timeArrowRightGap:timeRange.right-timeArrow.right,
        optionAlignDelta:Math.abs(add.right-more.right),
        headHeight:head.getBoundingClientRect().height,
        headFontSize:headText.fontSize,
        headFontWeight:Number(headText.fontWeight)
      };
    });
    assert.ok(Math.abs(ecoSpacing.firstTitleGap-7)<=1&&Math.abs(ecoSpacing.titleToTableGap-7)<=1,"both card headings sit in the shared gap above their card");
    assert.ok(Math.abs(ecoSpacing.betweenCardTitleGap-30)<=1,"the second card heading keeps the shared 30px section gap");
    assert.ok(Math.abs(ecoSpacing.noteGap-10)<=1,"the supporting note uses the shared note gap");
    assert.ok(ecoSpacing.timeWidth>=150,"the editable time field keeps enough room for its value and arrow");
    assert.ok(ecoSpacing.timeLeftDelta<=1&&ecoSpacing.timeRightDelta<=1,"the time field fills and starts on the column's left edge");
    assert.ok(ecoSpacing.timeArrowRightGap<=10,"the dropdown arrow sits at the far right of the time field");
    assert.ok(ecoSpacing.modeWidth>ecoSpacing.timeWidth,"mode receives more width than the time field");
    assert.ok(ecoSpacing.modeClientWidth<=220,"the mode trigger sizes to its current label instead of filling the whole column");
    assert.ok(ecoSpacing.modeScrollWidth<=ecoSpacing.modeClientWidth,"the mode label remains fully visible inside its adaptive trigger");
    assert.ok(ecoSpacing.optionAlignDelta<=1,"Add time range shares the option button's right edge");
    assert.equal(ecoSpacing.headHeight,32,"the table heading uses a compact vertical rhythm");
    assert.equal(ecoSpacing.headFontSize,"12px");
    assert.equal(ecoSpacing.headFontWeight,400,"table headings share the Charge legend typography");
    assert.equal(await page.locator("[data-isw-eco-row]").count(),2);
    assert.deepEqual(
      await readEcoRanges(),
      ["00:00 – 06:00","17:00 – 21:00"],
      "the initial intervals are ordered by start time"
    );
    assert.deepEqual(
      await page.locator(".isw-eco-mode-trigger").evaluateAll(nodes=>nodes.map(node=>node.textContent.trim())),
      ["Charge by PV and Grid","Discharge"]
    );
    assert.deepEqual(await page.locator(".isw-eco-kw").allTextContents(),["20.0 kW","18.0 kW"],"power values are percent times rated power");
    assert.deepEqual(
      await page.locator(".isw-eco-legend").innerText(),
      "Charge\nDischarge\nGeneral Mode"
    );
    assert.doesNotMatch(await page.locator(".isw-note").innerText(),/20\.0 kW/,"supporting copy remains model-agnostic");
    assert.equal(await page.locator(".isw-eco-add").count(),1);
    assert.equal(await page.locator(".isw-eco-add .isw-eco-add-icon").count(),1);

    await page.locator("[data-isw-eco-segment]").first().hover();
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".isw-hover-popover").textContent(),"00:00 – 06:00");
    assert.ok((await page.locator(".isw-hover-popover").boundingBox()).width<130,"the range tooltip hugs its text");
    assert.equal(await page.locator(".isw-eco-segment--charge").count(),1);
    assert.equal(await page.locator(".isw-eco-segment--discharge").count(),1);

    await page.locator(".isw-eco-info").hover();
    await page.waitForTimeout(100);
    const powerInfo=await page.locator(".isw-hover-popover").last().evaluate(node=>{
      const style=getComputedStyle(node);
      return {text:node.textContent,fontSize:style.fontSize,fontWeight:Number(style.fontWeight),fontFamily:style.fontFamily,paddingLeft:style.paddingLeft,paddingRight:style.paddingRight};
    });
    assert.equal(powerInfo.text,"Power limit is a percentage of the inverter's rated output.");
    assert.equal(powerInfo.fontSize,"13px");
    assert.equal(powerInfo.fontWeight,510,"the information copy uses readable medium-weight typography");
    assert.match(powerInfo.fontFamily,/SF Pro/);
    assert.deepEqual([powerInfo.paddingLeft,powerInfo.paddingRight],["16px","16px"],"information popovers use the shared horizontal inset");
    assert.doesNotMatch(powerInfo.text,/20\.0 kW/,"the generic explanation does not hard-code one inverter model");

    const firstTimeInput=page.locator("[data-isw-eco-time-input]").first();
    await firstTimeInput.click();
    assert.equal(await page.evaluate(()=>document.activeElement?.matches("[data-isw-eco-time-input]")),true,"clicking a time value enters direct editing");
    assert.equal(await page.locator(".isw-eco-time-picker-popover").count(),0,"direct editing does not open the picker");
    await page.waitForTimeout(80);
    const editableTimeInput=page.locator("[data-isw-eco-time-input]").first();
    await editableTimeInput.fill("0010");
    assert.equal(await editableTimeInput.inputValue(),"00:10 – __:__","fixed colon and dash separators remain visible while typing");
    await editableTimeInput.pressSequentially("0550",{delay:10});
    assert.equal(await editableTimeInput.inputValue(),"00:10 – 05:50","eight typed digits are masked with fixed colons and dash");
    await editableTimeInput.press("Enter");
    await page.waitForTimeout(260);
    assert.deepEqual(await readEcoRanges(),["00:10 – 05:50","17:00 – 21:00"],"one-row digit entry is normalized and committed");
    const invalidTimeInput=page.locator("[data-isw-eco-time-input]").first();
    await invalidTimeInput.fill("12345678");
    await invalidTimeInput.press("Enter");
    await page.waitForTimeout(260);
    assert.equal(await invalidTimeInput.inputValue(),"12:34 – 56:78","invalid masked input is preserved instead of being reset");
    assert.equal(await invalidTimeInput.getAttribute("aria-invalid"),"true");
    assert.equal(await invalidTimeInput.evaluate(node=>node.classList.contains("is-error")),true);
    assert.match(
      await invalidTimeInput.locator("xpath=ancestor::div[contains(@class,'isw-eco-row')]").locator(":scope > .isw-field-errors").textContent(),
      /Enter valid times between 00:00 and 23:59/,
      "invalid time ranges show a persistent inline error"
    );
    await invalidTimeInput.fill("00000600");
    assert.equal(await invalidTimeInput.getAttribute("aria-invalid"),null,"editing again clears the persistent invalid state");
    assert.equal(await invalidTimeInput.locator("xpath=ancestor::div[contains(@class,'isw-eco-row')]").locator(":scope > .isw-field-errors").count(),0,"correcting a time range removes its inline error");
    await invalidTimeInput.press("Enter");
    await page.waitForTimeout(260);
    assert.deepEqual(await readEcoRanges(),["00:00 – 06:00","17:00 – 21:00"]);

    const middleTimeInput=page.locator("[data-isw-eco-time-input]").nth(1);
    await middleTimeInput.focus();
    await middleTimeInput.evaluate(node=>node.setSelectionRange(3,4));
    await page.keyboard.type("9");
    assert.equal(await middleTimeInput.inputValue(),"17:90 – 21:00","replacing a middle digit does not force editing back to the end");
    await middleTimeInput.evaluate(node=>node.setSelectionRange(3,4));
    await page.keyboard.type("0");
    assert.equal(await middleTimeInput.inputValue(),"17:00 – 21:00");
    await middleTimeInput.evaluate(node=>node.setSelectionRange(4,4));
    await page.keyboard.press("Backspace");
    assert.equal(await middleTimeInput.inputValue(),"17:02 – 10:0_","backspace removes the digit before the caret instead of always trimming the tail");
    await middleTimeInput.fill("17002100");
    await middleTimeInput.press("Enter");
    await page.waitForTimeout(260);
    assert.deepEqual(await readEcoRanges(),["00:00 – 06:00","17:00 – 21:00"]);

    await page.locator("[data-isw-eco-time-trigger]").first().click();
    await page.locator(".isw-eco-time-picker-popover .isw-eco-time-wheel").first().waitFor();
    await page.waitForTimeout(260);
    assert.equal(await page.locator(".isw-eco-time-picker-popover .isw-eco-time-wheel").count(),4);
    assert.equal(await page.locator(".isw-eco-time-value.is-selected").count(),4);
    const pickerLayout=await page.evaluate(()=>{
      const popover=document.querySelector(".isw-eco-time-picker-popover");
      const picker=document.querySelector(".isw-eco-time-picker");
      const wheels=[...document.querySelectorAll(".isw-eco-time-wheel")];
      const firstWheel=wheels[0];
      const selected=firstWheel.querySelector(".isw-eco-time-value.is-selected");
      const popoverBox=popover.getBoundingClientRect();
      const pickerBox=picker.getBoundingClientRect();
      const highlight=document.querySelector(".isw-eco-time-wheel-highlight");
      return {
        width:popover.offsetWidth,
        padding:getComputedStyle(popover).padding,
        leftGap:pickerBox.left-popoverBox.left,
        rightGap:popoverBox.right-pickerBox.right,
        neighbors:[selected.previousElementSibling?.textContent,selected.previousElementSibling?.previousElementSibling?.textContent],
        scrollbarWidth:getComputedStyle(firstWheel).scrollbarWidth,
        columns:getComputedStyle(document.querySelector(".isw-eco-time-picker")).gridTemplateColumns,
        separator:document.querySelector(".isw-eco-time-separator").textContent,
        highlightBackground:getComputedStyle(highlight).backgroundColor,
        selectedBackground:getComputedStyle(selected).backgroundColor
      };
    });
    assert.ok(pickerLayout.width>=200&&pickerLayout.width<=220,"the picker includes its content-safe padding");
    assert.equal(pickerLayout.padding,"12px");
    assert.ok(Math.abs(pickerLayout.leftGap-pickerLayout.rightGap)<=1,"the picker keeps symmetric left and right internal padding");
    assert.deepEqual(pickerLayout.neighbors,["23","22"],"00 is preceded by the end of the previous circular day");
    assert.equal(pickerLayout.scrollbarWidth,"none","the picker does not show a progress rail");
    assert.equal(pickerLayout.columns.split(" ").length,3);
    assert.equal(pickerLayout.separator,"–","the start and end wheel groups share the displayed time separator");
    assert.notEqual(pickerLayout.highlightBackground,"rgba(0, 0, 0, 0)","the centre band keeps a persistent neutral fill");
    assert.equal(pickerLayout.selectedBackground,"rgba(0, 0, 0, 0)","the fixed band replaces the scrolling value background");

    const fixedBand=await page.evaluate(()=>{
      const wheel=document.querySelector(".isw-eco-time-wheel");
      const highlight=wheel.parentElement.querySelector(".isw-eco-time-wheel-highlight");
      const before=highlight.getBoundingClientRect().toJSON();
      wheel.scrollTop+=60;
      wheel.dispatchEvent(new Event("scroll"));
      return {before,after:highlight.getBoundingClientRect().toJSON()};
    });
    assert.ok(
      Math.abs(fixedBand.before.top-fixedBand.after.top)<=.5&&
      Math.abs(fixedBand.before.height-fixedBand.after.height)<=.5,
      "the centre band remains fixed while wheel values scroll"
    );
    await page.waitForTimeout(120);

    await page.locator('[data-isw-eco-time-part="fromHour"][data-isw-eco-time-value="5"][data-isw-eco-time-cycle="2"]').evaluate(node=>node.click());
    await page.waitForTimeout(850);
    const clickedWheel=await page.locator(".isw-eco-time-wheel").first().evaluate(wheel=>{
      const selected=wheel.querySelector(".isw-eco-time-value.is-selected");
      const wheelBox=wheel.getBoundingClientRect(),selectedBox=selected.getBoundingClientRect();
      return {
        value:selected.textContent,
        cycle:selected.dataset.iswEcoTimeCycle,
        centerDelta:Math.abs((selectedBox.top+selectedBox.bottom)/2-(wheelBox.top+wheelBox.bottom)/2)
      };
    });
    assert.equal(clickedWheel.value,"05");
    assert.equal(clickedWheel.cycle,"2","a clicked value is selected in the reusable centre cycle");
    assert.ok(clickedWheel.centerDelta<=1.5,"a clicked value snaps to the wheel centre");
    const wheelCentering=await page.locator(".isw-eco-time-wheel").evaluateAll(wheels=>wheels.map(wheel=>{
      const selected=wheel.querySelector(".isw-eco-time-value.is-selected");
      const wheelBox=wheel.getBoundingClientRect(),selectedBox=selected.getBoundingClientRect();
      return Math.abs((selectedBox.top+selectedBox.bottom)/2-(wheelBox.top+wheelBox.bottom)/2);
    }));
    assert.ok(wheelCentering.every(delta=>delta<=1.5),"selected time values stay on the wheel centreline");
    await page.locator('[data-isw-eco-time-part="fromHour"][data-isw-eco-time-value="0"][data-isw-eco-time-cycle="2"]').click();
    await page.waitForTimeout(850);
    await page.locator(".isw-eco-time-wheel").first().evaluate(wheel=>{
      wheel.scrollTop=0;
      wheel.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(250);
    const recentered=await page.locator(".isw-eco-time-wheel").first().evaluate(wheel=>{
      const selected=wheel.querySelector(".isw-eco-time-value.is-selected");
      const wheelBox=wheel.getBoundingClientRect(),selectedBox=selected.getBoundingClientRect();
      return {
        cycle:selected.dataset.iswEcoTimeCycle,
        centerDelta:Math.abs((selectedBox.top+selectedBox.bottom)/2-(wheelBox.top+wheelBox.bottom)/2)
      };
    });
    assert.equal(recentered.cycle,"2","edge scrolling is mirrored back to the centre cycle for continuous looping");
    assert.ok(recentered.centerDelta<=1.5);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(45);
    const exitSync=await page.evaluate(()=>{
      const panel=document.querySelector(".isw-eco-time-picker-popover");
      const content=panel?._wdFade;
      const fill=panel?.querySelector(":scope > .wd-glass-material > .wd-glass-fill");
      const contentAnimation=content?.getAnimations()[0];
      const fillAnimation=fill?.getAnimations()[0];
      return {
        connected:Boolean(panel?.isConnected),
        contentUsesPicker:content?.classList.contains("isw-eco-time-picker"),
        contentTime:contentAnimation?.currentTime,
        fillTime:fillAnimation?.currentTime,
        contentDuration:contentAnimation?.effect?.getTiming().duration,
        fillDuration:fillAnimation?.effect?.getTiming().duration,
        contentOpacity:Number(getComputedStyle(content).opacity),
        fillOpacity:Number(getComputedStyle(fill).opacity)
      };
    });
    assert.equal(exitSync.connected,true);
    assert.equal(exitSync.contentUsesPicker,true,"the wheel content opts into the shared surface exit");
    assert.equal(exitSync.contentDuration,exitSync.fillDuration,"content and glass share one exit duration");
    assert.ok(Math.abs(Number(exitSync.contentTime)-Number(exitSync.fillTime))<=20,"content and glass exit on the same timeline");
    assert.ok(Math.abs(exitSync.contentOpacity-exitSync.fillOpacity)<=.05,"content and glass reach matching opacity during exit");
    await page.waitForTimeout(260);

    await page.locator(".isw-eco-mode-trigger").first().click();
    await page.waitForTimeout(100);
    const modeMenuBox=await page.locator(".isw-eco-popover").boundingBox();
    const modeTriggerBox=await page.locator(".isw-eco-mode-trigger").first().boundingBox();
    assert.ok(Math.abs(modeMenuBox.width-280)<=1,"the mode menu uses the shared select popover width");
    assert.ok(
      Math.abs((modeMenuBox.x+modeMenuBox.width)-(modeTriggerBox.x+modeTriggerBox.width)-30)<=1,
      "the economic mode popover shares the select right-edge offset"
    );
    assert.equal(await page.locator(".isw-eco-popover").evaluate(node=>getComputedStyle(node).borderRadius),"30px");
    assert.equal(
      await page.locator(".isw-eco-popover").evaluate(node=>node.classList.contains("wd-select-popover")&&Boolean(node.querySelector(".wd-menu"))),
      true,
      "the mode menu reuses the shared select popover anatomy"
    );
    assert.deepEqual(
      await page.locator(".isw-eco-popover .wd-menu-row").allTextContents(),
      ["Charge by PV Only","Charge by PV and Grid","Discharge"]
    );
    await page.locator('.isw-eco-popover [data-value="discharge"]').click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator(".isw-eco-mode-trigger").first().innerText(),"Discharge");
    assert.equal(await page.locator(".isw-eco-segment--discharge").count(),2);
    assert.equal(await page.locator(".isw-actions").isVisible(),true);
    await page.locator(".isw-eco-mode-trigger").first().hover();
    await page.waitForTimeout(80);
    const modeArrow=await page.locator(".isw-eco-mode-trigger").first().evaluate(node=>{
      const arrow=getComputedStyle(node.querySelector(".wd-select-chevron"));
      return {arrow:arrow.color,text:getComputedStyle(node).color};
    });
    assert.equal(modeArrow.arrow,modeArrow.text,"the mode chevron follows the hover/focus text colour");
    await page.locator("[data-isw-eco-time-trigger]").first().hover();
    await page.waitForTimeout(80);
    const timeArrow=await page.locator("[data-isw-eco-time-trigger]").first().evaluate(node=>{
      const arrow=getComputedStyle(node.querySelector(".isw-eco-chevron"));
      return {arrow:arrow.color,text:getComputedStyle(node).color};
    });
    assert.equal(timeArrow.arrow,timeArrow.text,"the time picker chevron follows the hover/focus text colour");

    const firstPower=page.locator("[data-isw-eco-power]").first();
    const economicHeightsBefore=await page.evaluate(()=>{
      const input=document.querySelector("[data-isw-eco-power]");
      return {
        row:input.closest(".isw-eco-row").getBoundingClientRect().height,
        card:input.closest(".isw-eco-table").getBoundingClientRect().height
      };
    });
    await firstPower.fill("120");
    await page.waitForTimeout(24);
    assert.equal(await firstPower.inputValue(),"120","an out-of-range power percentage stays in the draft");
    assert.equal(await firstPower.getAttribute("aria-invalid"),"true");
    assert.match(
      await firstPower.locator("xpath=ancestor::div[contains(@class,'isw-eco-row')]").locator(":scope > .isw-field-errors").textContent(),
      /0 to 100%/,
      "the economic power range error stays beside its row"
    );
    assert.equal(
      await firstPower.evaluate(input=>input.closest(".isw-eco-table").getAnimations().some(animation=>animation.effect?.getTiming().duration===280)),
      true,
      "an economic power error grows the schedule card with the shared 280ms rhythm"
    );
    await page.waitForTimeout(320);
    const economicHeightsAfter=await page.evaluate(()=>{
      const input=document.querySelector("[data-isw-eco-power]");
      return {
        row:input.closest(".isw-eco-row").getBoundingClientRect().height,
        card:input.closest(".isw-eco-table").getBoundingClientRect().height
      };
    });
    assert.ok(economicHeightsAfter.row>economicHeightsBefore.row+12,"an economic error adds real row height instead of consuming existing whitespace");
    assert.ok(economicHeightsAfter.card>economicHeightsBefore.card+12,"an economic error grows the schedule card height");
    const invalidPowerAppearance=await firstPower.evaluate(input=>{
      const wrapper=input.closest(".isw-eco-percent-field");
      const error=input.closest(".isw-eco-row").querySelector(":scope > .isw-field-errors");
      const item=error.querySelector(".isw-field-error-message");
      const tokenProbe=document.createElement("span");
      tokenProbe.style.color="var(--wd-accent-red)";
      document.body.append(tokenProbe);
      const errorColor=getComputedStyle(tokenProbe).color;
      tokenProbe.remove();
      const fillProbe=document.createElement("span");
      fillProbe.style.cssText="display:block;width:1px;height:1px;background:var(--isw-number-error-fill-hover)";
      wrapper.append(fillProbe);
      const errorFill=getComputedStyle(fillProbe).backgroundColor;
      fillProbe.remove();
      const wrapperRect=wrapper.getBoundingClientRect();
      const itemRect=item.getBoundingClientRect();
      return {
        borderColor:getComputedStyle(wrapper).borderTopColor,
        backgroundColor:getComputedStyle(wrapper).backgroundColor,
        errorColor,
        errorFill,
        topGap:itemRect.top-wrapperRect.bottom,
        rightDelta:Math.abs(itemRect.right-wrapperRect.right)
      };
    });
    assert.equal(invalidPowerAppearance.borderColor,invalidPowerAppearance.errorColor,"invalid economic power fields use a red border");
    assert.equal(invalidPowerAppearance.backgroundColor,invalidPowerAppearance.errorFill,"invalid economic power fields use a faint red fill");
    assert.ok(invalidPowerAppearance.topGap>=0&&invalidPowerAppearance.topGap<=4,"economic power errors sit directly below the field");
    assert.ok(invalidPowerAppearance.rightDelta<=1,"economic power errors align to the input's right edge");
    await firstPower.fill("75");
    assert.equal(await firstPower.getAttribute("aria-invalid"),null,"correcting the power percentage clears its inline error");
    assert.equal(
      await firstPower.locator("xpath=ancestor::div[contains(@class,'isw-eco-row')]").locator(":scope > .isw-field-errors").count(),
      0,
      "the economic power error disappears after correction"
    );
    await firstPower.press("Enter");
    await page.waitForTimeout(260);
    assert.equal(await page.locator(".isw-eco-kw").first().textContent(),"15.0 kW","percentage changes recompute rated kW");

    const secondTime=page.locator("[data-isw-eco-time-trigger]").nth(1);
    const secondTimeInput=page.locator("[data-isw-eco-time-input]").nth(1);
    await secondTime.click();
    await page.locator('[data-isw-eco-time-part="fromHour"][data-isw-eco-time-value="5"][data-isw-eco-time-cycle="2"]').click();
    await page.waitForTimeout(24);
    const overlapDraft=await secondTimeInput.evaluate(input=>{
      const row=input.closest(".isw-eco-row");
      const card=input.closest(".isw-eco-table");
      return {
        value:input.value,
        ariaInvalid:input.getAttribute("aria-invalid"),
        fieldError:input.classList.contains("is-error"),
        errorText:row.querySelector(":scope > .isw-field-errors")?.textContent.trim(),
        cardAnimation:card.getAnimations().some(animation=>animation.effect?.getTiming().duration===280)
      };
    });
    assert.equal(overlapDraft.value,"05:00 – 21:00","an overlapping time draft is preserved");
    assert.equal(overlapDraft.ariaInvalid,"true");
    assert.equal(overlapDraft.fieldError,true);
    assert.match(overlapDraft.errorText,/cannot overlap/i,"overlap errors stay beside the time range");
    assert.equal(overlapDraft.cardAnimation,true,"an inline time error grows the schedule card with the shared 280ms rhythm");
    await page.waitForTimeout(220);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(320);
    assert.equal(await secondTimeInput.inputValue(),"05:00 – 21:00","closing the picker keeps the overlapping draft");

    await secondTimeInput.fill("17001600");
    await secondTimeInput.press("Enter");
    await page.waitForTimeout(24);
    assert.equal(await secondTimeInput.inputValue(),"17:00 – 16:00","an end time before the start stays in the draft");
    assert.equal(await secondTimeInput.getAttribute("aria-invalid"),"true");
    assert.match(
      await secondTimeInput.locator("xpath=ancestor::div[contains(@class,'isw-eco-row')]").locator(":scope > .isw-field-errors").textContent(),
      /later than start time/i,
      "an end-before-start error stays beside the time range"
    );
    await page.waitForTimeout(320);
    await secondTimeInput.fill("12001300");
    await page.waitForTimeout(24);
    const correctedRangeDraft=await secondTimeInput.evaluate(input=>{
      const row=input.closest(".isw-eco-row");
      const card=input.closest(".isw-eco-table");
      return {
        ariaInvalid:input.getAttribute("aria-invalid"),
        fieldError:input.classList.contains("is-error"),
        errorCount:row.querySelectorAll(":scope > .isw-field-errors").length,
        cardAnimation:card.getAnimations().some(animation=>animation.effect?.getTiming().duration===280)
      };
    });
    assert.equal(correctedRangeDraft.ariaInvalid,null,"correcting the time clears aria-invalid");
    assert.equal(correctedRangeDraft.fieldError,false,"correcting the time restores the normal field color");
    assert.equal(correctedRangeDraft.errorCount,0,"correcting the time removes the inline error");
    assert.equal(correctedRangeDraft.cardAnimation,true,"removing an inline error collapses the card with the shared 280ms rhythm");
    await page.waitForTimeout(320);
    await secondTimeInput.press("Enter");
    await page.waitForTimeout(260);
    assert.deepEqual(await readEcoRanges(),["00:00 – 06:00","12:00 – 13:00"],"the corrected range is committed");

    await page.locator(".isw-eco-add").click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator("[data-isw-eco-row]").count(),3);
    assert.deepEqual(
      await readEcoRanges(),
      ["00:00 – 06:00","12:00 – 13:00","00:00 – 00:00"],
      "a newly added empty range stays after all completed ranges"
    );
    assert.equal(await page.locator(".isw-eco-mode-trigger").nth(2).innerText(),"--");
    assert.equal(await page.locator("[data-isw-eco-power]").nth(2).inputValue(),"");
    assert.equal(await page.locator(".isw-eco-percent-field").nth(2).locator("span").textContent(),"%","empty drafts keep the percentage unit");
    assert.equal(await page.locator(".isw-eco-kw").nth(2).textContent(),"-- kW","empty drafts keep the kW unit");
    const emptyPlaceholderCraft=await page.evaluate(()=>{
      const emptyMode=document.querySelectorAll(".isw-eco-mode-trigger")[2].querySelector("span");
      const normalMode=document.querySelector(".isw-eco-mode-trigger > span");
      const percent=document.querySelectorAll(".isw-eco-percent-field")[2];
      const percentInput=percent.querySelector("input");
      const emptyKW=document.querySelectorAll(".isw-eco-kw")[2];
      const emptyKWValue=emptyKW.querySelector(".isw-eco-placeholder");
      const normalKW=document.querySelector(".isw-eco-kw");
      return {
        modeClass:emptyMode.className,
        modePlaceholder:getComputedStyle(emptyMode).color,
        modeNormal:getComputedStyle(normalMode).color,
        percentPlaceholder:getComputedStyle(percentInput,"::placeholder").color,
        percentUnit:getComputedStyle(percent.querySelector("span")).color,
        normalPercentUnit:getComputedStyle(document.querySelector(".isw-eco-percent-field > span")).color,
        kwValueClass:emptyKWValue.className,
        kwPlaceholder:getComputedStyle(emptyKWValue).color,
        kwContainer:getComputedStyle(emptyKW).color,
        kwNormal:getComputedStyle(normalKW).color
      };
    });
    assert.match(emptyPlaceholderCraft.modeClass,/\bwd-select-placeholder\b/);
    assert.notEqual(emptyPlaceholderCraft.modePlaceholder,emptyPlaceholderCraft.modeNormal);
    assert.notEqual(emptyPlaceholderCraft.percentPlaceholder,emptyPlaceholderCraft.percentUnit,"only the empty percent value uses lighter ink");
    assert.equal(emptyPlaceholderCraft.percentUnit,emptyPlaceholderCraft.normalPercentUnit,"the percent unit keeps its normal ink");
    assert.match(emptyPlaceholderCraft.kwValueClass,/\bisw-eco-placeholder\b/);
    assert.notEqual(emptyPlaceholderCraft.kwPlaceholder,emptyPlaceholderCraft.kwNormal);
    assert.equal(emptyPlaceholderCraft.kwContainer,emptyPlaceholderCraft.kwNormal,"the kW unit keeps its normal ink");
    await page.getByRole("button",{name:"Save"}).click();
    await page.waitForTimeout(100);
    assert.match(await page.locator(".wd-toast-text").textContent(),/Complete or delete the empty time range/);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true);

    const newMore=page.locator(".isw-eco-more").nth(2);
    await newMore.click();
    const ecoMenuPosition=await page.evaluate(()=>{
      const anchor=document.querySelectorAll(".isw-eco-more")[2];
      const panel=document.querySelector(".isw-eco-popover");
      const anchorRect=anchor.getBoundingClientRect();
      const layoutWidth=anchor.offsetWidth||anchorRect.width;
      const layoutRight=anchorRect.left+(anchorRect.width+layoutWidth)/2;
      return {
        actualRight:panel.getBoundingClientRect().right,
        expectedRight:layoutRight+30
      };
    });
    assert.ok(Math.abs(ecoMenuPosition.actualRight-ecoMenuPosition.expectedRight)<=1,"the row action menu uses the shared right-offset placement");
    const deleteRow=page.locator(".isw-eco-delete-row");
    await deleteRow.hover();
    await page.waitForTimeout(100);
    const deleteCraft=await deleteRow.evaluate(node=>{
      const icon=node.querySelector(".target-nav-icon");
      const glyph=node.querySelector(".isw-eco-trash-icon");
      const label=node.querySelector(".wd-menu-label");
      return {
        rowColor:getComputedStyle(node).color,
        iconColor:getComputedStyle(icon).color,
        labelColor:getComputedStyle(label).color,
        background:getComputedStyle(node).backgroundColor,
        iconSize:[icon.getBoundingClientRect().width,icon.getBoundingClientRect().height],
        glyphSize:[glyph.getBoundingClientRect().width,glyph.getBoundingClientRect().height]
      };
    });
    assert.equal(deleteCraft.iconColor,deleteCraft.rowColor,"destructive icon follows the red row state");
    assert.equal(deleteCraft.labelColor,deleteCraft.rowColor,"destructive label follows the red row state");
    assert.notEqual(deleteCraft.background,"rgba(0, 0, 0, 0)","the destructive row receives its tinted hover surface");
    assert.ok(deleteCraft.iconSize.every(size=>Math.abs(size-22)<=.1),"the destructive icon follows the shared 22px menu rhythm");
    assert.ok(deleteCraft.glyphSize.every(size=>Math.abs(size-22)<=.1),"the destructive glyph is enlarged to match the shared menu rhythm");
    await deleteRow.click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator(".plants-device-dialog--confirm").isVisible(),true);
    assert.equal(await page.locator(".plants-device-confirm-title").textContent(),"Delete this time range?");
    await page.locator(".plants-device-dialog--confirm").getByRole("button",{name:"Cancel"}).click();
    await page.waitForTimeout(460);
    assert.equal(await page.locator("[data-isw-eco-row]").count(),3,"cancelling deletion keeps the range");
    await page.locator(".isw-eco-more").nth(2).click();
    await page.locator(".isw-eco-delete-row").click();
    await page.waitForTimeout(120);
    await page.locator(".plants-device-dialog--confirm").getByRole("button",{name:"Delete"}).click();
    await page.waitForTimeout(480);
    assert.equal(await page.locator("[data-isw-eco-row]").count(),2,"confirming deletion removes the range");
    assert.equal(await page.locator(".isw-actions").isVisible(),true);
    await page.locator('[data-isw-go="log"]').click();
    const pageChangeConfirm=page.locator(".plants-device-dialog--confirm");
    await pageChangeConfirm.waitFor();
    assert.equal(await pageChangeConfirm.locator(".plants-device-confirm-title").textContent(),"Unsaved changes");
    assert.match(
      await pageChangeConfirm.locator(".plants-device-confirm-description").textContent(),
      /Economic Schedule[\s\S]*Discard them before switching pages/,
      "the page-change prompt names the dirty settings page"
    );
    assert.equal(
      await pageChangeConfirm.evaluate(node=>node.classList.contains("plants-device-dialog--confirm")&&node.classList.contains("wd-modal-panel")&&Boolean(node.querySelector(".plants-device-confirm-actions .wd-button--pill"))),
      true,
      "the page-change warning reuses the shared confirm dialog and standard buttons"
    );
    await pageChangeConfirm.getByRole("button",{name:"Keep Editing"}).click();
    await page.waitForFunction(()=>!document.querySelector(".plants-device-dialog--confirm"));
    await waitForPage("eco");
    assert.equal(await page.locator(".isw-actions").isVisible(),true,"Keep Editing keeps the dirty page and its Save/Cancel actions");
    await page.locator('[data-isw-go="log"]').click();
    await pageChangeConfirm.waitFor();
    await pageChangeConfirm.getByRole("button",{name:"Discard Changes"}).click();
    const discardSwitch=await page.evaluate(()=>({
      confirm:Boolean(document.querySelector(".plants-device-dialog--confirm")),
      outgoing:Boolean(document.querySelector(".isw-page.isw-page--leaving")),
      incoming:document.querySelector(".isw-page:not(.isw-page--leaving)")?.dataset.page
    }));
    assert.equal(discardSwitch.confirm,true,"the confirm layer remains mounted for its own exit animation");
    assert.equal(discardSwitch.outgoing,true,"Discard Changes starts the page transition immediately");
    assert.equal(discardSwitch.incoming,"log","the target page enters without waiting for the confirm layer to finish exiting");
    await page.waitForFunction(()=>!document.querySelector(".plants-device-dialog--confirm"));
    await waitForPage("log");
    await page.waitForTimeout(380);
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"discarding the page draft clears the old page's Save/Cancel actions");
    await page.locator('[data-isw-go="dispatch"]').click();
    await waitForPage("dispatch");
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"a discarded page draft does not leak into the next page");

    await page.locator('[data-isw-go="mode"]').click();
    await waitForPage("mode");
    await page.waitForFunction(()=>document.querySelectorAll(".isw-mode-card").length===6);
    const modeIcons=await page.locator(".isw-mode-card").evaluateAll(cards=>cards.map(card=>{
      const icon=card.querySelector(":scope > .isw-icon");
      return {
        mask:icon?.style.getPropertyValue("--icon-mask")||"",
        color:icon?getComputedStyle(icon).color:"",
        cardColor:getComputedStyle(card).color,
        selected:card.classList.contains("is-selected")
      };
    }));
    assert.equal(modeIcons.length,6,"all six running modes render their supplied icon");
    assert.ok(modeIcons.every(icon=>icon.mask.includes("/home-assets/icons/settings/")),"running modes use the shared settings icon library");
    assert.equal(new Set(modeIcons.map(icon=>icon.mask)).size,6,"running modes use six distinct symbol shapes");
    const selectedModeIcon=modeIcons.find(icon=>icon.selected);
    assert.equal(selectedModeIcon.color,selectedModeIcon.cardColor,"selected mode icons use primary ink");
    assert.notEqual(selectedModeIcon.color,modeIcons.find(icon=>!icon.selected).color,"selected mode icons distinguish from idle icons");
    const modePresentation=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll(".isw-mode-card")];
      const selected=cards.find(card=>card.classList.contains("is-selected"));
      const idle=cards.find(card=>!card.classList.contains("is-selected"));
      const summary=getComputedStyle(selected.querySelector(".isw-mode-summary"));
      const flow=getComputedStyle(selected.querySelector(".isw-mode-flow"));
      const descriptionNode=selected.querySelector(".isw-mode-description");
      const description=getComputedStyle(descriptionNode);
      const divider=getComputedStyle(descriptionNode,"::before");
      const selectedMark=getComputedStyle(selected.querySelector(".isw-radio-mark"));
      const idleMark=idle.querySelector(".isw-radio-mark").getBoundingClientRect();
      const selectedMarkBox=selected.querySelector(".isw-radio-mark").getBoundingClientRect();
      const selectedStyle=getComputedStyle(selected);
      const idleStyle=getComputedStyle(idle);
      const secondaryProbe=document.createElement("span");
      secondaryProbe.style.color="var(--wd-label-secondary)";
      document.querySelector(".isw-page").append(secondaryProbe);
      const secondary=getComputedStyle(secondaryProbe).color;
      secondaryProbe.remove();
      const selectedFillProbe=document.createElement("span");
      selectedFillProbe.style.backgroundColor="var(--isw-mode-selected-fill)";
      document.querySelector(".isw-page").append(selectedFillProbe);
      const selectedFill=getComputedStyle(selectedFillProbe).backgroundColor;
      selectedFillProbe.remove();
      return {
        borderWidth:selectedStyle.borderTopWidth,
        primary:selectedStyle.color,
        selectedBackground:selectedStyle.backgroundColor,
        idleBackground:idleStyle.backgroundColor,
        selectedFill,
        idleIconColor:getComputedStyle(idle.querySelector(":scope > .isw-icon")).color,
        secondary,
        markBackground:selectedMark.backgroundColor,
        markMask:selectedMark.maskImage||selectedMark.webkitMaskImage,
        idleMarkSize:[idleMark.width,idleMark.height],
        idleMarkShadow:getComputedStyle(idle.querySelector(".isw-radio-mark")).boxShadow,
        idleMarkMask:getComputedStyle(idle.querySelector(".isw-radio-mark")).maskImage||getComputedStyle(idle.querySelector(".isw-radio-mark")).webkitMaskImage,
        selectedMarkSize:[selectedMarkBox.width,selectedMarkBox.height],
        borderColor:selectedStyle.borderTopColor,
        copyGap:getComputedStyle(selected.querySelector(".isw-mode-copy")).gap,
        paddingTop:selectedStyle.paddingTop,
        paddingBottom:selectedStyle.paddingBottom,
        flowMarginTop:flow.marginTop,
        descriptionMarginTop:description.marginTop,
        descriptionPaddingTop:description.paddingTop,
        dividerContent:divider.content,
        type:[summary,flow,description].map(style=>({color:style.color,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,letterSpacing:style.letterSpacing})),
        arrows:[...selected.querySelectorAll(".isw-flow-arrow")].map(node=>node.textContent)
      };
    });
    assert.equal(modePresentation.borderWidth,"1px","selected mode cards use a thin divider border");
    assert.notEqual(modePresentation.borderColor,"rgba(0, 0, 0, 0)","selected mode border uses visible neutral ink");
    assert.equal(modePresentation.selectedBackground,modePresentation.selectedFill,"selected mode cards use the shared selected fill");
    assert.notEqual(modePresentation.selectedBackground,modePresentation.idleBackground,"selected mode fill is distinguishable from idle cards");
    assert.equal(modePresentation.idleIconColor,modePresentation.secondary,"idle mode icons use stronger secondary ink");
    assert.equal(modePresentation.markBackground,modePresentation.primary,"selected check uses primary ink");
    assert.match(modePresentation.markMask,/check-circle\.svg/,"selected check uses the shared supplied asset");
    assert.equal(modePresentation.idleMarkMask,"none","idle mode choices use the outlined radio state");
    assert.deepEqual(modePresentation.selectedMarkSize,modePresentation.idleMarkSize,"selected check and idle radio use the same visual box");
    assert.deepEqual({top:modePresentation.paddingTop,bottom:modePresentation.paddingBottom},{top:"20px",bottom:"20px"},"mode cards use compact vertical padding");
    assert.equal(modePresentation.copyGap,"3px","mode title, summary, flow and description use one 3px rhythm");
    assert.deepEqual({flow:modePresentation.flowMarginTop,description:modePresentation.descriptionMarginTop,padding:modePresentation.descriptionPaddingTop},{flow:"0px",description:"0px",padding:"0px"},"the description keeps the shared 3px flex rhythm without extra padding");
    assert.equal(modePresentation.dividerContent,"none","the selected description has no divider");
    const supportingType=item=>({color:item.color,size:item.size,weight:item.weight,lineHeight:item.lineHeight,letterSpacing:item.letterSpacing});
    assert.ok(modePresentation.type.every(item=>JSON.stringify(supportingType(item))===JSON.stringify(supportingType(modePresentation.type[0]))),"mode summary, flow and description share one type style");
    assert.ok(modePresentation.type.every(item=>item.color===modePresentation.secondary),"mode supporting copy uses secondary ink");
    assert.ok(modePresentation.type.every(item=>item.weight===400),"mode supporting copy uses regular weight");
    assert.ok(modePresentation.arrows.length>0&&modePresentation.arrows.every(text=>text==="→"),"mode flow uses text arrows");

    const hoverMode=page.locator('[data-isw-mode="1"]');
    const hoverBefore=await hoverMode.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      markShadow:getComputedStyle(node.querySelector(".isw-radio-mark")).boxShadow,
      markMask:getComputedStyle(node.querySelector(".isw-radio-mark")).maskImage
    }));
    await hoverMode.hover();
    await page.waitForTimeout(280);
    const hoverAfter=await hoverMode.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      markShadow:getComputedStyle(node.querySelector(".isw-radio-mark")).boxShadow,
      markMask:getComputedStyle(node.querySelector(".isw-radio-mark")).maskImage,
      selected:node.classList.contains("is-selected")
    }));
    assert.notEqual(hoverAfter.background,hoverBefore.background,"idle mode cards change fill on hover");
    assert.notEqual(hoverAfter.borderColor,hoverBefore.borderColor,"hover adds a lighter neutral mode-card border");
    assert.equal(hoverAfter.markShadow,hoverBefore.markShadow,"hover does not alter the idle radio outline");
    assert.equal(hoverAfter.markMask,hoverBefore.markMask,"hover does not reveal the selected check");
    assert.equal(hoverAfter.selected,false,"hover does not select the mode");

    const modeHeightsBefore=await page.locator(".isw-mode-card").evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().height));
    await page.locator('[data-isw-mode="2"]').click();
    const modeAnimationStart=await page.evaluate(()=>({
      animating:document.querySelectorAll(".isw-mode-card.is-mode-animating").length,
      animations:[...document.querySelectorAll(".isw-mode-card.is-mode-animating")].flatMap(card=>card.getAnimations()
        .filter(animation=>animation.effect.getKeyframes().some(frame=>Object.hasOwn(frame,"height")))
        .map(animation=>({duration:animation.effect.getTiming().duration,easing:animation.effect.getTiming().easing})))
    }));
    assert.ok(modeAnimationStart.animating>=2,"mode selection animates both collapsing and expanding cards");
    assert.ok(
      modeAnimationStart.animations.every(animation=>animation.duration===320&&animation.easing==="cubic-bezier(0.22, 0.8, 0.25, 1)"),
      "mode cards use one balanced panel timeline for both expansion and collapse"
    );
    await page.waitForTimeout(90);
    const modeHeightsDuring=await page.locator(".isw-mode-card").evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().height));
    assert.ok(modeHeightsDuring[4]<modeHeightsBefore[4],"the previous ToU mode collapses during the transition");
    assert.ok(modeHeightsDuring[2]>modeHeightsBefore[2],"the new mode expands during the transition");
    const interruptedMode=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll(".isw-mode-card")];
      const before=cards.map(card=>card.getBoundingClientRect().height);
      document.querySelector('[data-isw-mode="1"]').click();
      const immediate=cards.map(card=>card.getBoundingClientRect().height);
      return {before,immediate};
    });
    assert.ok(
      interruptedMode.before.every((height,index)=>Math.abs(height-interruptedMode.immediate[index])<=2),
      "switching modes mid-animation continues from the currently rendered card heights"
    );
    await page.waitForFunction(()=>document.querySelectorAll(".isw-mode-card.is-mode-animating").length===0);
    assert.equal(await page.locator(".isw-mode-card.is-mode-animating").count(),0,"mode card animation cleans up after settling");
    const peakValue=await page.locator('[data-isw-go="mode"] .isw-nav-value').evaluate(node=>({
      text:node.textContent,
      width:node.getBoundingClientRect().width,
      scrollWidth:node.scrollWidth
    }));
    assert.equal(peakValue.text,"Peak Load Shifting","the navigation exposes the full selected mode");
    assert.ok(peakValue.scrollWidth<=peakValue.width+1,"the complete Peak Load Shifting label is visible in the value column");
    await page.getByRole("button",{name:"Cancel"}).click();
    const modeRollback=await page.evaluate(()=>({
      animating:document.querySelectorAll(".isw-mode-card.is-mode-animating").length,
      animations:[...document.querySelectorAll(".isw-mode-card.is-mode-animating")].flatMap(card=>card.getAnimations()
        .filter(animation=>animation.effect.getKeyframes().some(frame=>Object.hasOwn(frame,"height")))
        .map(animation=>({duration:animation.effect.getTiming().duration,easing:animation.effect.getTiming().easing}))),
      selected:document.querySelector(".isw-mode-card.is-selected")?.dataset.iswMode
    }));
    assert.ok(modeRollback.animating>=2,"Cancel animates mode cards back to the saved mode");
    assert.ok(modeRollback.animations.every(animation=>animation.duration===320&&animation.easing==="cubic-bezier(0.22, 0.8, 0.25, 1)"));
    assert.equal(modeRollback.selected,"4");
    await page.waitForFunction(()=>document.querySelectorAll(".isw-mode-card.is-mode-animating").length===0);
    await page.waitForTimeout(420);
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"mode rollback clears the dirty action bar");
    assert.equal(await page.locator('[data-isw-go="mode"] .isw-nav-value').textContent(),"ToU");
    await page.locator(".isw-scroll").evaluate(node=>{node.scrollTop=0;});
    await page.waitForTimeout(280);
    const titleBeforeScroll=await page.locator(".isw-title-rule").evaluate(node=>{
      const title=node.closest(".isw-body").querySelector(".isw-page-title");
      const body=node.closest(".isw-body").getBoundingClientRect();
      const titleBox=title.getBoundingClientRect();
      const border=getComputedStyle(node);
      return {
        backdrop:getComputedStyle(title).backdropFilter,
        borderOpacity:border.opacity,
        borderAnimation:border.animationName,
        borderDuration:border.animationDuration,
        borderWidth:border.width,
        bodyWidth:body.width,
        topDelta:Math.abs(node.getBoundingClientRect().top-titleBox.bottom),
        scrolled:node.closest(".isw-body").querySelector(".isw-scroll").classList.contains("is-content-scrolled")
      };
    });
    assert.equal(titleBeforeScroll.backdrop,"none");
    assert.equal(titleBeforeScroll.borderOpacity,"0");
    assert.equal(titleBeforeScroll.borderAnimation,"none");
    assert.equal(titleBeforeScroll.borderDuration,"0s");
    assert.ok(Math.abs(Number.parseFloat(titleBeforeScroll.borderWidth)-titleBeforeScroll.bodyWidth)<=1,"the title rule spans the full content pane");
    assert.ok(titleBeforeScroll.topDelta<=1,"the title rule sits on the title bottom edge");
    assert.equal(titleBeforeScroll.scrolled,false,"the title rule stays hidden before content overlaps");
    const scrollOverlapAt=await page.evaluate(()=>{
      const title=document.querySelector(".isw-page-title").getBoundingClientRect();
      const content=document.querySelector(".isw-page").firstElementChild.getBoundingClientRect();
      return Math.max(1,content.top-title.bottom);
    });
    await page.locator(".isw-scroll").evaluate((node,value)=>{node.scrollTop=Math.max(1,value-2);},scrollOverlapAt);
    await page.waitForTimeout(50);
    assert.equal(
      await page.locator(".isw-scroll").evaluate(node=>node.classList.contains("is-content-scrolled")),
      false,
      "the title rule does not appear before the content actually reaches it"
    );
    await page.locator(".isw-scroll").evaluate(node=>{node.scrollTop=240;});
    await page.waitForTimeout(360);
    const stickyTitle=await page.locator(".isw-page-title").evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      boxShadow:getComputedStyle(node).boxShadow,
      backdrop:getComputedStyle(node).backdropFilter
    }));
    assert.equal(stickyTitle.background,"rgba(0, 0, 0, 0)");
    assert.equal(stickyTitle.boxShadow,"none");
    assert.notEqual(stickyTitle.backdrop,"none");
    assert.ok(
      await page.locator(".isw-title-rule").evaluate(node=>Number.parseFloat(getComputedStyle(node).opacity)>=.995),
      "the title rule fades in when content passes beneath it"
    );
    await page.locator(".isw-scroll").evaluate(node=>{node.scrollTop=0;});
    await page.waitForFunction(()=>document.querySelector(".isw-title-rule")?.classList.contains("is-title-rule--clearing"),null,{timeout:500});
    const titleRuleExit=await page.locator(".isw-title-rule").evaluate(node=>{
      const border=getComputedStyle(node);
      return {
        clearing:node.classList.contains("is-title-rule--clearing"),
        animation:border.animationName,
        duration:border.animationDuration
      };
    });
    assert.equal(titleRuleExit.clearing,true);
    assert.equal(titleRuleExit.animation,"isw-title-rule-out");
    assert.equal(titleRuleExit.duration,"0.2s");
    await page.waitForTimeout(360);
    assert.equal(
      await page.locator(".isw-title-rule").evaluate(node=>getComputedStyle(node).opacity),
      "0",
      "the title rule fades out after the content clears it"
    );
    await page.locator('[data-isw-go="dispatch"]').click();
    await page.waitForTimeout(420);
    const dispatchLayout=await page.evaluate(()=>{
      const page=document.querySelector(".isw-page");
      const title=document.querySelector(".isw-page-title");
      const range=document.createRange();
      range.selectNodeContents(title);
      const firstCard=page.querySelector(".isw-panel").getBoundingClientRect();
      const titleText=range.getBoundingClientRect();
      const chain=page.querySelector(".isw-effective-chain");
      const chainStyle=getComputedStyle(chain);
      const rows=[...chain.querySelectorAll(".isw-chain-row")];
      const first=rows[0].getBoundingClientRect();
      const second=rows[1].getBoundingClientRect();
      const rowBoxes=rows.map(row=>row.getBoundingClientRect());
      const firstKey=rows[0].querySelector(".isw-chain-key").getBoundingClientRect();
      const firstTrack=rows[0].querySelector(".isw-chain-track").getBoundingClientRect();
      const secondKey=rows[1].querySelector(".isw-chain-key").getBoundingClientRect();
      const previousKey=rows.at(-2).querySelector(".isw-chain-key").getBoundingClientRect();
      const hardKey=rows.at(-1).querySelector(".isw-chain-key").getBoundingClientRect();
      const dividerStyle=getComputedStyle(rows.at(-1),"::before");
      const dividerY=rowBoxes.at(-1).top+Number.parseFloat(dividerStyle.top);
      const rowDivider=page.querySelector(".isw-panel .isw-row + .isw-row");
      const rowDividerStyle=getComputedStyle(rowDivider,"::after");
      const commandLabel=[...page.querySelectorAll(".isw-row-label")].find(node=>node.textContent.trim()==="Command timeout");
      const commandStyle=getComputedStyle(commandLabel);
      const typeStyles=rows.flatMap(row=>[row.querySelector(".isw-chain-key"),row.querySelector(".isw-chain-value")].map(node=>{
        const style=getComputedStyle(node);
        return {family:style.fontFamily,size:style.fontSize,weight:Number(style.fontWeight),lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,color:style.color};
      }));
      const keyFit=rows.map(row=>{
        const key=row.querySelector(".isw-chain-key");
        return {text:key.textContent,clientWidth:key.clientWidth,scrollWidth:key.scrollWidth};
      });
      return {
        titleOffset:titleText.left-firstCard.left,
        chainPaddingTop:chainStyle.paddingTop,
        chainPaddingBottom:chainStyle.paddingBottom,
        chainPaddingLeft:chainStyle.paddingLeft,
        rowPitch:second.top-first.top,
        rowHeight:first.height,
        rowPitches:rowBoxes.slice(1).map((box,index)=>box.top-rowBoxes[index].top),
        rowHeights:rowBoxes.map(box=>box.height),
        normalTextGap:secondKey.top-firstKey.bottom,
        dividerGapAbove:dividerY-previousKey.bottom,
        dividerGapBelow:hardKey.top-dividerY,
        dividerHeight:dividerStyle.height,
        dividerBorderWidth:dividerStyle.borderTopWidth,
        dividerRight:dividerStyle.right,
        rowDividerHeight:rowDividerStyle.height,
        rowDividerBorderWidth:rowDividerStyle.borderTopWidth,
        rowDividerRight:rowDividerStyle.right,
        chainGap:firstTrack.left-firstKey.right,
        typeStyles,
        keyFit,
        commandType:{family:commandStyle.fontFamily,size:commandStyle.fontSize,weight:Number(commandStyle.fontWeight),lineHeight:commandStyle.lineHeight,letterSpacing:commandStyle.letterSpacing,color:commandStyle.color},
        separatorCount:chain.querySelectorAll(".isw-chain-separator").length
      };
    });
    assert.ok(Math.abs(dispatchLayout.titleOffset-24)<=1,`page title text uses the shared 24px content inset (${dispatchLayout.titleOffset}px)`);
    assert.deepEqual(
      {top:dispatchLayout.chainPaddingTop,bottom:dispatchLayout.chainPaddingBottom,left:dispatchLayout.chainPaddingLeft},
      {top:"12px",bottom:"12px",left:"24px"},
      "effective chain uses compact vertical padding and the shared horizontal gutter"
    );
    assert.ok(Math.abs(dispatchLayout.rowHeight-36)<=1,"effective chain rows use the adjusted 36px rhythm");
    assert.ok(dispatchLayout.rowHeights.every(height=>Math.abs(height-36)<=1),"all effective chain rows share one height");
    assert.ok(dispatchLayout.rowPitches.slice(0,3).every(pitch=>Math.abs(pitch-36)<=1),"the first four effective chain rows keep one vertical rhythm");
    assert.ok(Math.abs(dispatchLayout.rowPitches.at(-1)-52)<=1,"the divider row keeps the reviewed extra gap after the larger row rhythm");
    assert.ok(Math.abs(dispatchLayout.chainGap-14)<=1,"effective chain columns gain spacing for the larger type");
    assert.ok(dispatchLayout.keyFit.every(item=>item.scrollWidth<=item.clientWidth),"the wider label column keeps every effective-chain label untruncated");
    assert.equal(dispatchLayout.separatorCount,0,"the final row owns the separator without adding an extra layout row");
    assert.equal(dispatchLayout.dividerHeight,"0px");
    assert.equal(dispatchLayout.dividerBorderWidth,"1px");
    assert.equal(dispatchLayout.dividerRight,"-24px");
    assert.equal(dispatchLayout.rowDividerHeight,"0px");
    assert.equal(dispatchLayout.rowDividerBorderWidth,"1px");
    assert.equal(dispatchLayout.rowDividerRight,"-24px");
    assert.ok(Math.abs(dispatchLayout.dividerGapAbove-dispatchLayout.normalTextGap)<=1,"divider keeps the same text gap above it");
    assert.ok(Math.abs(dispatchLayout.dividerGapBelow-dispatchLayout.normalTextGap)<=1,"divider keeps the same text gap below it");
    assert.ok(dispatchLayout.typeStyles.every(style=>JSON.stringify(style)===JSON.stringify(dispatchLayout.typeStyles[0])),"all effective chain labels and values share one text style");
    assert.deepEqual(dispatchLayout.typeStyles[0],dispatchLayout.commandType,"effective chain typography matches the Command timeout row exactly");
    assert.deepEqual({size:dispatchLayout.typeStyles[0].size,weight:dispatchLayout.typeStyles[0].weight,lineHeight:dispatchLayout.typeStyles[0].lineHeight},{size:"14px",weight:510,lineHeight:"18px"},"effective chain text uses the shared 14/14 medium style");

    const dispatchToggle=page.locator('[data-isw-switch="dispatch.on"]');
    const dispatchToggleHandle=await dispatchToggle.elementHandle();
    assert.equal(await dispatchToggle.getAttribute("aria-checked"),"true");
    await dispatchToggle.click();
    await page.waitForTimeout(40);
    assert.equal(await page.locator('[data-isw-switch="dispatch.on"]').getAttribute("aria-checked"),"false");
    assert.equal(await page.evaluate(node=>node.isConnected,dispatchToggleHandle),true,"the toggle remains the same DOM node while dependencies refresh");
    assert.equal(await page.locator(".isw-effective-chain").count(),0,"dependent settings disappear immediately instead of waiting for the switch animation");
    await page.locator('[data-isw-switch="dispatch.on"]').click();
    await page.waitForTimeout(40);
    assert.equal(await page.locator(".isw-effective-chain").count(),1,"dependent settings return immediately when the switch turns back on");
    await page.waitForTimeout(320);

    await page.setViewportSize({width:1545,height:900});
    await page.waitForTimeout(120);
    await page.locator(".isw-scroll").evaluate(node=>{
      const max=Math.max(0,node.scrollHeight-node.clientHeight);
      node.scrollTop=Math.min(40,Math.max(0,max-16));
    });
    await page.locator(".isw-nav-scroll").evaluate(node=>{node.dataset.stabilityProbe="kept";});
    await page.waitForTimeout(40);
    const pageTopBeforeUpdate=await page.locator(".isw-page:not(.isw-page--leaving)").evaluate(node=>node.getBoundingClientRect().top);
    const scrollTopBeforeUpdate=await page.locator(".isw-scroll").evaluate(node=>node.scrollTop);
    const unitControl=page.locator('[data-isw-seg="dispatch.unit"]');
    const unitControlHandle=await unitControl.elementHandle();
    await unitControl.locator('[data-value="0"]').evaluate(node=>node.click());
    const localUpdate=await page.evaluate(({pageTopBeforeUpdate,scrollTopBeforeUpdate})=>{
      const scroll=document.querySelector(".isw-scroll");
      const page=document.querySelector(".isw-page");
      return {
        scrollTop:scroll.scrollTop,
        scrollTopBeforeUpdate,
        pageTop:page.getBoundingClientRect().top,
        pageTopBeforeUpdate,
        animations:page.getAnimations().length,
        opacity:getComputedStyle(page).opacity,
        navPreserved:document.querySelector(".isw-nav-scroll").dataset.stabilityProbe,
        activeValue:document.activeElement?.dataset.value
      };
    },{pageTopBeforeUpdate,scrollTopBeforeUpdate});
    assert.ok(scrollTopBeforeUpdate>=24,"the scroll stability probe reaches a meaningful non-bottom offset");
    assert.ok(
      Math.abs(localUpdate.scrollTop-localUpdate.scrollTopBeforeUpdate)<=1,
      `a local setting change preserves the content scroll position (${localUpdate.scrollTopBeforeUpdate} -> ${localUpdate.scrollTop})`
    );
    assert.ok(Math.abs(localUpdate.pageTop-localUpdate.pageTopBeforeUpdate)<=1,"a local setting change does not shift the page");
    assert.equal(localUpdate.animations,0,"a local setting change does not replay the page entrance animation");
    assert.equal(localUpdate.opacity,"1","the content stays fully opaque during a local update");
    assert.equal(localUpdate.navPreserved,"kept","a local setting change does not rebuild the navigation");
    assert.equal(localUpdate.activeValue,"0","focus returns to the selected segment without scrolling");
    const unitMotion=await page.evaluate(node=>{
      const indicator=node.querySelector(".wd-segmented-control-indicator");
      return {
        connected:node.isConnected,
        animations:indicator.getAnimations().map(animation=>({
          duration:animation.effect?.getTiming().duration,
          easing:animation.effect?.getTiming().easing
        }))
      };
    },unitControlHandle);
    assert.equal(unitMotion.connected,true,"the segmented control keeps the same DOM node across its local content refresh");
    assert.deepEqual(unitMotion.animations.map(item=>item.duration),[600],"the segmented indicator slides with the shared switch rhythm");
    assert.ok(unitMotion.animations.every(item=>item.easing==="cubic-bezier(0.34, 0.16, 0.18, 1)"),"the segmented indicator uses the shared soft spring curve");
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-isw-number="dispatch.sp"]').inputValue(),"-50.0");
    await page.locator('[data-isw-seg="dispatch.unit"] [data-value="1"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-isw-number="dispatch.sp"]').inputValue(),"-10.0");
    const rapidUnit=await page.evaluate(async()=>{
      const control=document.querySelector('[data-isw-seg="dispatch.unit"]');
      const indicator=control.querySelector(".wd-segmented-control-indicator");
      const option=value=>control.querySelector(`[data-value="${value}"]`);
      const readLeft=()=>indicator.getBoundingClientRect().left;
      option("0").click();
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const animation=indicator.getAnimations().find(item=>item.effect?.getTiming().duration===600);
      animation.pause();
      animation.currentTime=250;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const before=readLeft();
      option("1").click();
      const after=readLeft();
      indicator.getAnimations()[0]?.play();
      return {before,after,connected:control.isConnected,selected:option("1").getAttribute("aria-selected")};
    });
    assert.equal(rapidUnit.connected,true,"rapid unit changes keep the segmented control mounted");
    assert.equal(rapidUnit.selected,"true");
    assert.ok(Math.abs(rapidUnit.after-rapidUnit.before)<=1,"rapid unit changes continue from the current capsule position instead of jumping");

    await page.locator('[data-isw-go="feat"]').click();
    const watchdogToggle=page.locator('[data-isw-switch="features.watchdog"]');
    const watchdogHandle=await watchdogToggle.elementHandle();
    assert.equal(await watchdogToggle.getAttribute("aria-checked"),"true");
    await watchdogToggle.click();
    await page.waitForTimeout(40);
    assert.equal(await page.locator('[data-isw-number="features.wdt"]').count(),0,"dependent fields disappear immediately on another settings page");
    assert.equal(await page.evaluate(node=>node.isConnected,watchdogHandle),true,"the second settings page also preserves its switch node");
    await page.locator('[data-isw-switch="features.watchdog"]').click();
    await page.waitForTimeout(40);
    assert.equal(await page.locator('[data-isw-number="features.wdt"]').count(),1,"dependent fields return immediately on the second settings page");
    await page.locator('[data-isw-go="dispatch"]').click();

    await page.setViewportSize({width:1545,height:1252});
    await page.waitForTimeout(120);

    const timeout=page.locator('[data-isw-number="dispatch.timeout"]');
    await timeout.fill("420");
    await timeout.press("Enter");
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-isw-number="dispatch.timeout"]').inputValue(),"420");

    await page.locator('[data-isw-go="grid"]').click();
    const dispatchChangeConfirm=page.locator(".plants-device-dialog--confirm");
    await dispatchChangeConfirm.waitFor();
    assert.match(await dispatchChangeConfirm.locator(".plants-device-confirm-description").textContent(),/Active Power Dispatch/);
    await dispatchChangeConfirm.getByRole("button",{name:"Keep Editing"}).click();
    await page.waitForFunction(()=>!document.querySelector(".plants-device-dialog--confirm"));
    assert.equal(await page.locator('.isw-page:not(.isw-page--leaving)').getAttribute("data-page"),"dispatch","Keep Editing stays on the current page after a navigation warning");
    await page.locator(".isw-actions .wd-button--primary").click();
    await page.waitForTimeout(420);
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"saving commits only the current settings page");
    await page.locator('[data-isw-go="grid"]').click();
    const gateEnterMotion=await page.evaluate(()=>{
      const gate=document.querySelector(".isw-gate");
      const page=document.querySelector(".isw-page--incoming");
      const opacityAnimation=node=>node?.getAnimations().find(animation=>animation.effect?.getKeyframes().some(frame=>Object.hasOwn(frame,"opacity")));
      const gateAnimation=opacityAnimation(gate);
      const pageAnimation=opacityAnimation(page);
      return {
        hidden:gate.hidden,
        opacity:Number.parseFloat(getComputedStyle(gate).opacity),
        gate:gateAnimation?{duration:gateAnimation.effect.getTiming().duration,easing:gateAnimation.effect.getTiming().easing}:null,
        page:pageAnimation?{duration:pageAnimation.effect.getTiming().duration,easing:pageAnimation.effect.getTiming().easing}:null
      };
    });
    assert.equal(gateEnterMotion.hidden,false,"the lock gate joins the incoming view immediately");
    assert.ok(gateEnterMotion.opacity<.35,"the lock gate begins transparent instead of popping in");
    assert.ok(gateEnterMotion.gate&&gateEnterMotion.page,"the lock gate and incoming page both animate through opacity");
    assert.deepEqual(gateEnterMotion.gate,gateEnterMotion.page,"the lock gate entering uses the shared page-switch duration and easing");
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".isw-gate").isVisible(),true);
    await page.locator('[data-isw-go="mode"]').click();
    const gateExitMotion=await page.evaluate(()=>{
      const gate=document.querySelector(".isw-gate");
      const page=document.querySelector(".isw-page--leaving");
      const opacityAnimation=node=>node?.getAnimations().find(animation=>animation.effect?.getKeyframes().some(frame=>Object.hasOwn(frame,"opacity")));
      const gateAnimation=opacityAnimation(gate);
      const pageAnimation=opacityAnimation(page);
      return {
        hidden:gate.hidden,
        inert:gate.inert,
        gate:gateAnimation?{duration:gateAnimation.effect.getTiming().duration,easing:gateAnimation.effect.getTiming().easing}:null,
        page:pageAnimation?{duration:pageAnimation.effect.getTiming().duration,easing:pageAnimation.effect.getTiming().easing}:null
      };
    });
    assert.equal(gateExitMotion.hidden,false,"the lock gate stays mounted for its exit fade");
    assert.equal(gateExitMotion.inert,true,"the exiting lock gate stops receiving pointer input");
    assert.ok(gateExitMotion.gate&&gateExitMotion.page,"the lock gate and outgoing page both animate through opacity");
    assert.deepEqual(gateExitMotion.gate,gateExitMotion.page,"the lock gate exit uses the shared page-switch duration and easing");
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".isw-gate").isHidden(),true,"the lock gate hides only after its exit fade completes");
    await page.locator('[data-isw-go="grid"]').click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".isw-gate").isVisible(),true);
    assert.equal(
      await page.locator('[data-isw-go="grid"] .isw-nav-chevron').evaluate(node=>getComputedStyle(node).transform),
      "none",
      "Grid & Protection keeps its trailing arrow pointing right after entering the page"
    );
    const lockedGrid=await page.evaluate(()=>{
      const box=selector=>{
        const rect=document.querySelector(selector).getBoundingClientRect();
        return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,center:rect.left+rect.width/2};
      };
      const sub=document.querySelector(".isw-sub");
      return {
        body:box(".isw-body"),
        subHidden:sub.hidden,
        subDisplay:getComputedStyle(sub).display,
        content:box(".isw-content-pane"),
        gate:box(".isw-gate")
      };
    });
    assert.equal(lockedGrid.subHidden,true,"the Grid sub-navigation stays hidden before the Check code is accepted");
    assert.equal(lockedGrid.subDisplay,"none");
    assert.ok(Math.abs(lockedGrid.gate.left-lockedGrid.body.left)<=1&&Math.abs(lockedGrid.gate.right-lockedGrid.body.right)<=1,"the locked gate owns the full right content surface");
    await page.waitForTimeout(320);
    const gateChrome=await page.evaluate(()=>{
      const lock=document.querySelector(".isw-gate-icon .isw-icon");
      const button=document.querySelector(".isw-gate-continue");
      const copy=document.querySelector(".isw-gate-card > p");
      const strong=copy.querySelector("b");
      const plate=document.querySelector(".isw-code-plate");
      const probe=document.createElement("span");
      document.querySelector(".isw-gate-card").append(probe);
      probe.style.color="var(--wd-label-secondary)";
      const secondary=getComputedStyle(probe).color;
      probe.style.color="var(--wd-label-primary)";
      const primary=getComputedStyle(probe).color;
      probe.style.color="";
      probe.style.backgroundColor="var(--wd-blue)";
      const blue=getComputedStyle(probe).backgroundColor;
      probe.remove();
      const codeInput=document.querySelector(".isw-code input");
      const idleCodeInput=document.querySelectorAll(".isw-code input")[1];
      const card=button.closest(".isw-gate-card");
      const cardFill=getComputedStyle(card.querySelector(":scope>.wd-glass-material>.wd-glass-fill"));
      const mainFill=getComputedStyle(document.querySelector(".isw-main-window>.wd-glass-material>.wd-glass-fill"));
      const codeProbe=document.createElement("span");
      document.querySelector(".isw-code").append(codeProbe);
      codeProbe.style.backgroundColor="var(--isw-code-selected-fill)";
      codeProbe.style.boxShadow="inset 0 0 0 1px var(--isw-code-selected-border)";
      const codeExpectedFill=getComputedStyle(codeProbe).backgroundColor;
      const codeExpectedBorder=getComputedStyle(codeProbe).boxShadow;
      codeProbe.remove();
      const codeFocusStyle=getComputedStyle(codeInput);
      const sampleAlpha=node=>{
        const context=document.createElement("canvas").getContext("2d");
        context.clearRect(0,0,1,1);
        context.fillStyle=getComputedStyle(node).backgroundColor;
        context.fillRect(0,0,1,1);
        return context.getImageData(0,0,1,1).data[3]/255;
      };
      const buttonFill=getComputedStyle(button.querySelector(":scope>.wd-glass-material>.wd-glass-fill"));
      return {
        lockCount:document.querySelectorAll(".isw-gate-icon .isw-icon").length,
        lockMask:getComputedStyle(lock).maskImage,
        lockSize:[getComputedStyle(lock).width,getComputedStyle(lock).height],
        buttonClass:button.className,
        buttonMaterial:!!button.querySelector(":scope>.wd-glass-material"),
        buttonWidth:button.getBoundingClientRect().width,
        buttonHeight:button.getBoundingClientRect().height,
        buttonTextColor:getComputedStyle(button).color,
        buttonRadius:getComputedStyle(button).borderRadius,
        buttonFill:buttonFill.backgroundColor,
        blue,
        codeFocusFill:codeFocusStyle.backgroundColor,
        codeIdleFill:getComputedStyle(idleCodeInput).backgroundColor,
        codeExpectedFill,
        codeFocusBorder:codeFocusStyle.boxShadow,
        codeExpectedBorder,
        codeFocusOutline:codeFocusStyle.outlineStyle,
        codeFocusAlpha:sampleAlpha(codeInput),
        codeIdleAlpha:sampleAlpha(idleCodeInput),
        cardClass:card.className,
        cardMaterial:Boolean(card.querySelector(":scope>.wd-glass-material")),
        cardWidth:card.getBoundingClientRect().width,
        cardRadius:getComputedStyle(card).borderRadius,
        cardShadow:getComputedStyle(card).boxShadow,
        cardBackground:getComputedStyle(card).backgroundColor,
        cardFillBackground:cardFill.backgroundColor,
        cardFillShadow:cardFill.boxShadow,
        cardFillBackdrop:cardFill.backdropFilter,
        mainFillBackground:mainFill.backgroundColor,
        mainFillShadow:mainFill.boxShadow,
        mainFillBackdrop:mainFill.backdropFilter,
        codeRadius:getComputedStyle(codeInput).borderRadius,
        copyColor:getComputedStyle(copy).color,
        strongColor:getComputedStyle(strong).color,
        secondary,
        primary,
        plateText:plate.textContent.trim(),
        plateLines:Math.round(plate.getBoundingClientRect().height/Number.parseFloat(getComputedStyle(plate).lineHeight)),
        footCount:document.querySelectorAll(".isw-gate-foot").length
      };
    });
    assert.equal(gateChrome.lockCount,1,"the safety-code card shows one lock icon");
    assert.notEqual(gateChrome.lockMask,"none","the lock icon resolves to an actual masked asset");
    assert.deepEqual(gateChrome.lockSize,["19px","19px"],"the lock stays a small 19px glyph");
    assert.match(gateChrome.buttonClass,/\bwd-button--primary\b/);
    assert.match(gateChrome.buttonClass,/\bwd-glass\b/);
    assert.equal(gateChrome.buttonMaterial,true,"Continue uses the shared glass button material");
    assert.equal(gateChrome.buttonFill,gateChrome.blue,"Continue uses the shared blue primary material");
    assert.equal(gateChrome.buttonTextColor,"rgb(255, 255, 255)","the primary Continue label stays white");
    assert.match(gateChrome.buttonRadius,/^18px$/,"Continue aligns with the card's inner radius");
    assert.match(gateChrome.cardClass,/\bwd-glass\b/);
    assert.match(gateChrome.cardClass,/\bwd-glass--surface\b/);
    assert.equal(gateChrome.cardMaterial,true,"the gate card mounts the shared Glass Surface material");
    assert.equal(gateChrome.cardRadius,"30px","the gate card uses the larger shared surface radius");
    assert.equal(gateChrome.cardShadow,"none","the gate card does not keep a private local shadow");
    assert.equal(gateChrome.cardBackground,"rgba(0, 0, 0, 0)","the gate material replaces the local solid fill");
    assert.equal(gateChrome.cardFillBackground,gateChrome.mainFillBackground,"the gate card shares the settings window glass tint");
    assert.equal(gateChrome.cardFillShadow,gateChrome.mainFillShadow,"the gate card shares the settings window glass depth");
    assert.equal(gateChrome.cardFillBackdrop,gateChrome.mainFillBackdrop,"the gate card shares the settings window glass blur");
    assert.equal(gateChrome.codeRadius,"12px","the safety-code fields follow the larger card radius");
    assert.equal(gateChrome.codeFocusFill,gateChrome.codeExpectedFill,"the focused safety-code digit uses the shared selected fill");
    assert.notEqual(gateChrome.codeFocusFill,gateChrome.codeIdleFill,"the focused digit has a darker selected surface than idle digits");
    assert.ok(gateChrome.codeFocusAlpha-gateChrome.codeIdleAlpha>=.06,"the focused selected fill is visibly stronger than the idle fill");
    assert.equal(gateChrome.codeFocusBorder,gateChrome.codeExpectedBorder,"the focused digit uses the Running Mode neutral selected border");
    assert.equal(gateChrome.codeFocusOutline,"none","the default blue focus outline is removed");
    assert.ok(gateChrome.buttonWidth>gateChrome.cardWidth-60,"the shared Continue button fills the card action row");
    assert.equal(gateChrome.buttonHeight,38,"the shared primary variant keeps the existing 38px gate button height");
    assert.equal(gateChrome.copyColor,gateChrome.secondary,"gate instructions use secondary ink for readable contrast");
    assert.equal(gateChrome.strongColor,gateChrome.primary,"emphasized safety-code wording uses primary ink");
    assert.equal(gateChrome.plateText,"Prototype Check code: 6405","the device Check code is condensed into one line");
    assert.equal(gateChrome.plateLines,1);
    assert.equal(gateChrome.footCount,0,"the obsolete validity/log footnote is removed");
    await assertTypographyContract("grid:security-gate");
    const codeInputs=page.locator(".isw-code input");
    assert.equal(await codeInputs.count(),4,"the gate uses the device's four-digit Check code");
    for(let index=0;index<4;index+=1)await codeInputs.nth(index).fill("1111"[index]);
    await page.waitForTimeout(520);
    assert.equal(await page.locator(".isw-gate").isVisible(),true,"an invalid code keeps the grid gate closed");
    const gateCardBeforeUnlock=await page.locator(".isw-gate-card").boundingBox();
    for(let index=0;index<4;index+=1)await codeInputs.nth(index).fill("6405"[index]);
    const unlockGateMotion=await page.evaluate(()=>{
      const gate=document.querySelector(".isw-gate");
      const card=document.querySelector(".isw-gate-card");
      const cardRect=card.getBoundingClientRect();
      const animation=gate.getAnimations().find(item=>item.effect?.getKeyframes().some(frame=>Object.hasOwn(frame,"opacity")));
      const rootStyle=getComputedStyle(document.documentElement);
      return {
        hidden:gate.hidden,
        cardCenterX:cardRect.left+cardRect.width/2,
        cardCenterY:cardRect.top+cardRect.height/2,
        cardOffsetX:card.style.getPropertyValue("--isw-gate-card-exit-x").trim(),
        cardOffsetY:card.style.getPropertyValue("--isw-gate-card-exit-y").trim(),
        duration:animation?.effect.getTiming().duration,
        easing:animation?.effect.getTiming().easing,
        sharedDuration:Number.parseFloat(rootStyle.getPropertyValue("--wd-motion-view-switch-out")),
        sharedEasing:rootStyle.getPropertyValue("--wd-ease-view-switch-out").trim()
      };
    });
    assert.equal(unlockGateMotion.hidden,false,"a successful unlock fades the gate instead of hiding it abruptly");
    assert.ok(
      Math.abs(unlockGateMotion.cardCenterX-(gateCardBeforeUnlock.x+gateCardBeforeUnlock.width/2))<=1 &&
      Math.abs(unlockGateMotion.cardCenterY-(gateCardBeforeUnlock.y+gateCardBeforeUnlock.height/2))<=1,
      "the gate card keeps its screen position while the secondary rail opens"
    );
    assert.notEqual(unlockGateMotion.cardOffsetX,"","the gate card applies a layout-compensation offset during unlock");
    assert.notEqual(unlockGateMotion.cardOffsetY,"","the gate card compensates both layout axes during unlock");
    assert.equal(unlockGateMotion.duration,unlockGateMotion.sharedDuration,"the unlocking gate uses the shared page transition duration");
    const normalizeEasing=value=>value.replace(/\s+/g,"").replace(/0\./g,".");
    assert.equal(normalizeEasing(unlockGateMotion.easing),normalizeEasing(unlockGateMotion.sharedEasing),"the unlocking gate uses the shared page transition curve");
    await page.waitForTimeout(320);
    assert.equal(await page.locator(".isw-gate").isVisible(),false);
    assert.equal(
      await page.locator(".isw-gate-card").evaluate(node=>node.style.getPropertyValue("--isw-gate-card-exit-x")+node.style.getPropertyValue("--isw-gate-card-exit-y")),
      "",
      "the gate card clears its temporary offset after the exit animation"
    );
    const unlockedGrid=await page.evaluate(()=>{
      const box=selector=>{
        const rect=document.querySelector(selector).getBoundingClientRect();
        return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height,center:rect.left+rect.width/2};
      };
      const sub=document.querySelector(".isw-sub");
      return {
        body:box(".isw-body"),
        sub:box(".isw-sub"),
        subBorder:getComputedStyle(sub).borderRightWidth,
        content:box(".isw-content-pane"),
        subList:getComputedStyle(document.querySelector(".isw-sub-list")).padding
      };
    });
    assert.ok(unlockedGrid.sub.left>=unlockedGrid.body.left-1,"the Grid sub-navigation appears inside the right content surface after unlock");
    assert.ok(Math.abs(unlockedGrid.sub.right-unlockedGrid.content.left)<=1,"the unlocked sub-navigation shares the content pane edge");
    assert.ok(Math.abs(unlockedGrid.sub.width-208)<=1,"the Grid secondary rail stays wide enough to keep labels on one line");
    assert.equal(unlockedGrid.subList,"18px 18px 10px","the Grid secondary rail matches its 18px top inset on both sides");
    assert.equal(unlockedGrid.subBorder,"1px","the unlocked sub-navigation uses one continuous vertical divider");
    assert.ok(Math.abs(unlockedGrid.sub.height-unlockedGrid.body.height)<=1,"the unlocked divider spans the full content surface height");
    assert.equal(
      await page.locator('[data-isw-sub="code"]').getAttribute("aria-current"),
      "page",
      "Grid & Protection opens on Grid Code after unlock"
    );
    await waitForPageTitle("Grid Code");
    await page.screenshot({path:"tests/output/inverter-grid-code-final.png"});
    await page.locator('[data-isw-go="dispatch"]').click();
    await waitForPage("dispatch");
    const gridEntry=await page.evaluate(()=>{
      const rect=node=>{
        const box=node.getBoundingClientRect();
        return {left:box.left,right:box.right,top:box.top,width:box.width};
      };
      const outgoing=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const outgoingTitle=document.querySelector(".isw-title-label:not(.isw-title-label--ghost)");
      const before={page:rect(outgoing),title:rect(outgoingTitle)};
      document.querySelector('[data-isw-go="grid"]').click();
      const snapshot=document.querySelector(".isw-page.isw-page--leaving");
      const ghost=document.querySelector(".isw-title-label--ghost");
      const incoming=document.querySelector(".isw-page:not(.isw-page--leaving)");
      const sub=document.querySelector(".isw-sub");
      return {
        before,
        outgoing:rect(snapshot),
        titleGhost:rect(ghost),
        incoming:rect(incoming),
        subOpacity:Number.parseFloat(getComputedStyle(sub).opacity),
        subAnimation:sub.getAnimations().map(animation=>({
          duration:animation.effect?.getTiming().duration,
          delay:animation.effect?.getTiming().delay,
          easing:animation.effect?.getTiming().easing
        })),
        subOpen:document.querySelector(".isw-body").classList.contains("is-sub-open")
      };
    });
    assert.equal(gridEntry.subOpen,true,"Grid navigation applies the secondary-rail layout immediately");
    assert.ok(Math.abs(gridEntry.outgoing.left-gridEntry.before.page.left)<=1,"opening the Grid secondary rail does not move the outgoing page");
    assert.ok(Math.abs(gridEntry.outgoing.width-gridEntry.before.page.width)<=1,"the outgoing page keeps its pre-rail width");
    assert.ok(Math.abs(gridEntry.titleGhost.left-gridEntry.before.title.left)<=1,"the outgoing title stays at its pre-rail X position");
    assert.ok(gridEntry.incoming.left>gridEntry.before.page.left,"the incoming Grid page uses the narrower target layout");
    assert.equal(gridEntry.subOpacity,0,"the Grid secondary rail starts transparent with the incoming page");
    assert.equal(gridEntry.subAnimation.some(item=>item.duration===260&&item.delay===0&&item.easing==="cubic-bezier(0.4, 0, 0.2, 1)"),true,"the Grid secondary rail shares the page crossfade timing");
    await waitForPageTitle("Grid Code");
    await page.waitForTimeout(300);
    const gridLeave=await page.evaluate(()=>{
      const rect=node=>{
        const box=node.getBoundingClientRect();
        return {left:box.left,top:box.top,width:box.width,height:box.height};
      };
      const sub=document.querySelector(".isw-sub");
      const before=rect(sub);
      document.querySelector('[data-isw-go="dispatch"]').click();
      const snapshot=document.querySelector(".isw-sub.isw-sub--view-leaving");
      return {
        before,
        after:rect(snapshot),
        opacity:Number.parseFloat(getComputedStyle(snapshot).opacity),
        animations:snapshot.getAnimations().map(animation=>({
          duration:animation.effect?.getTiming().duration,
          delay:animation.effect?.getTiming().delay,
          easing:animation.effect?.getTiming().easing
        }))
      };
    });
    assert.ok(Math.abs(gridLeave.after.left-gridLeave.before.left)<=1&&Math.abs(gridLeave.after.top-gridLeave.before.top)<=1,"leaving Grid keeps the rail snapshot fixed in place");
    assert.ok(Math.abs(gridLeave.after.width-gridLeave.before.width)<=1&&Math.abs(gridLeave.after.height-gridLeave.before.height)<=1,"leaving Grid preserves the rail snapshot geometry");
    assert.equal(gridLeave.opacity,1,"the leaving rail starts fully visible");
    assert.equal(gridLeave.animations.some(item=>item.duration===260&&item.delay===0&&item.easing==="cubic-bezier(0.4, 0, 0.2, 1)"),true,"the leaving Grid rail shares the page crossfade timing");
    await waitForPage("dispatch");
    await page.locator('[data-isw-go="grid"]').click();
    await waitForPageTitle("Grid Code");
    const secondaryLabelFits=await page.locator('[data-isw-sub="fp"]').evaluate(node=>{
      const label=node.querySelector(".isw-control-label");
      const range=document.createRange();
      range.selectNodeContents(label);
      return range.getClientRects().length;
    });
    assert.equal(secondaryLabelFits,1,"Frequency-Watt (F-P) remains a single line in the compact secondary rail");
    assert.equal(
      await page.locator('[data-isw-sub="code"]').evaluate(node=>getComputedStyle(node).paddingLeft),
      "12px",
      "Grid secondary navigation keeps a slightly larger horizontal inset"
    );
    const profileHoverTarget=page.locator('[data-isw-profile="en50549_1"]');
    const profileHoverBefore=await profileHoverTarget.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      row:node.getBoundingClientRect().toJSON(),
      card:node.closest(".isw-profile-list").getBoundingClientRect().toJSON(),
      paddingLeft:getComputedStyle(node).paddingLeft,
      paddingRight:getComputedStyle(node).paddingRight
    }));
    await profileHoverTarget.hover();
    await page.waitForTimeout(280);
    const profileHoverAfter=await profileHoverTarget.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      row:node.getBoundingClientRect().toJSON(),
      card:node.closest(".isw-profile-list").getBoundingClientRect().toJSON(),
      paddingLeft:getComputedStyle(node).paddingLeft,
      paddingRight:getComputedStyle(node).paddingRight,
      markSize:[node.querySelector(".isw-radio-mark").getBoundingClientRect().width,node.querySelector(".isw-radio-mark").getBoundingClientRect().height],
      markMask:getComputedStyle(node.querySelector(".isw-radio-mark")).maskImage,
      markShadow:getComputedStyle(node.querySelector(".isw-radio-mark")).boxShadow
    }));
    assert.notEqual(profileHoverAfter.background,profileHoverBefore.background,"profile rows expose a hover surface");
    assert.ok(Math.abs(profileHoverAfter.row.left-profileHoverAfter.card.left)<=1&&Math.abs(profileHoverAfter.row.right-profileHoverAfter.card.right)<=1,"profile hover reaches both card edges");
    assert.deepEqual({left:profileHoverAfter.paddingLeft,right:profileHoverAfter.paddingRight},{left:"24px",right:"24px"},"expanded profile hover keeps the card content line");
    const selectedProfileMark=await page.locator(".isw-profile-row.is-selected .isw-radio-mark").evaluate(node=>({
      size:[node.getBoundingClientRect().width,node.getBoundingClientRect().height],
      background:getComputedStyle(node).backgroundColor,
      mask:getComputedStyle(node).maskImage
    }));
    assert.deepEqual(selectedProfileMark.size,modePresentation.selectedMarkSize,"selected Grid profiles reuse the Running Mode check size");
    assert.equal(selectedProfileMark.background,modePresentation.markBackground,"selected Grid profiles reuse the Running Mode check ink");
    assert.equal(selectedProfileMark.mask,modePresentation.markMask,"selected Grid profiles reuse the supplied check-circle asset");
    assert.deepEqual(profileHoverAfter.markSize,modePresentation.idleMarkSize,"idle Grid profiles reuse the Running Mode radio size");
    assert.equal(profileHoverAfter.markMask,modePresentation.idleMarkMask,"idle Grid profiles reuse the Running Mode outlined radio");
    assert.equal(profileHoverAfter.markShadow,modePresentation.idleMarkShadow,"idle Grid profiles reuse the Running Mode radio border");
    await page.mouse.move(0,0);
    await page.waitForTimeout(380);

    assert.deepEqual(
      await page.locator(".isw-subnav-item").allTextContents(),
      ["Grid Code","Protection Limits","Grid Connection","Reactive Power","Frequency-Watt (F-P)","LVRT","HVRT"]
    );
    const gridSubTitles=new Map([
      ["code","Grid Code"],["prot","Protection Limits"],["conn","Grid Connection"],
      ["reac","Reactive Power"],["pu","P(U) Characteristics"],["fp","Frequency-Watt (F-P)"],
      ["lvrt","Low Voltage Ride-Through (LVRT)"],["hvrt","High Voltage Ride-Through (HVRT)"]
    ]);
    const visibleGridSubIds=await page.locator("[data-isw-sub]").evaluateAll(rows=>rows.map(row=>row.dataset.iswSub));
    for(const id of visibleGridSubIds){
      const title=gridSubTitles.get(id);
      assert.ok(title,`the visible grid subpage ${id} has an expected title`);
      await page.locator(`[data-isw-sub="${id}"]`).click();
      await waitForPageTitle(title);
      await assertTypographyContract(`grid:${id}`);
      await assertCardSpacingContract(`grid:${id}`);
      assert.equal(
        await page.locator('.isw-page:not(.isw-page--leaving)').evaluate(root=>[...root.querySelectorAll("input")].filter(input=>!input.getAttribute("aria-label")&&!input.getAttribute("aria-labelledby")&&input.labels.length===0).length),
        0,
        `${title} gives every input an accessible name`
      );
      if(id==="prot"){
        await page.waitForTimeout(80);
        await page.screenshot({path:"tests/output/inverter-grid-protection-limits-final.png"});
        const islandSwitch=page.locator('[data-isw-switch="g.islandOn"]');
        if(await islandSwitch.getAttribute("aria-checked")==="false"){
          await islandSwitch.click();
          await page.waitForTimeout(650);
        }
        await islandSwitch.click();
        await page.waitForTimeout(650);
        const bottomScroll=page.locator(".isw-scroll");
        await bottomScroll.evaluate(node=>{node.scrollTop=node.scrollHeight-node.clientHeight;});
        await page.waitForTimeout(100);
        const bottomShrink=await page.evaluate(()=>new Promise(resolve=>{
          const scroll=document.querySelector(".isw-scroll");
          const toggle=document.querySelector('[data-isw-switch="g.islandOn"]');
          const startTop=scroll.scrollTop;
          const startMax=scroll.scrollHeight-scroll.clientHeight;
          const samples=[];
          const started=performance.now();
          toggle.click();
          const tick=()=>{
            samples.push({
              top:scroll.scrollTop,
              max:scroll.scrollHeight-scroll.clientHeight,
              spacer:document.querySelector(".wd-scroll-shrink-spacer")?.getBoundingClientRect().height||0
            });
            if(performance.now()-started<900)requestAnimationFrame(tick);
            else resolve({startTop,startMax,samples});
          };
          requestAnimationFrame(tick);
        }));
        const finalSample=bottomShrink.samples.at(-1);
        const scrollJumps=bottomShrink.samples.slice(1).map((sample,index)=>Math.abs(sample.top-bottomShrink.samples[index].top));
        const intermediateTops=new Set(bottomShrink.samples.map(sample=>Math.round(sample.top))).size;
        assert.ok(finalSample.max<bottomShrink.startMax-50,"collapsing content at the bottom reduces the final scroll range");
        assert.ok(bottomShrink.samples.some(sample=>sample.spacer>0),"bottom collapse uses a temporary scroll buffer");
        assert.ok(scrollJumps.every(jump=>jump<=28),`bottom collapse follows the new range without a hard jump (${Math.max(...scrollJumps)}px max)`);
        assert.ok(intermediateTops>=5,"bottom collapse moves through intermediate scroll positions");
        assert.ok(Math.abs(finalSample.top-finalSample.max)<=1,"the viewport settles at the new bottom");
        assert.equal(await islandSwitch.getAttribute("aria-checked"),"true","the collapse probe returns to the saved switch state");
      }
      if(id==="prot"){
        const protectionTable=await page.evaluate(()=>{
          const pageNode=document.querySelector(".isw-page:not(.isw-page--leaving)");
          const header=pageNode.querySelector(":scope > .isw-table > .isw-table-head");
          const row=pageNode.querySelector(":scope > .isw-table > .isw-table-row");
          const cells=[...row.children];
          const headerCells=[...header.children];
          const input=row.querySelector(".isw-mini-number");
          const ecoProbe=document.createElement("div");
          ecoProbe.className="isw-eco-table-head";
          pageNode.append(ecoProbe);
          const headerStyle=getComputedStyle(header);
          const ecoStyle=getComputedStyle(ecoProbe);
          const ecoType=[ecoStyle.fontSize,ecoStyle.fontWeight,ecoStyle.lineHeight];
          const ecoGap=ecoStyle.gap;
          ecoProbe.remove();
          const rowBox=row.getBoundingClientRect();
          const inputBox=input.getBoundingClientRect();
          const switchRow=[...pageNode.querySelectorAll(".isw-row")].find(node=>node.querySelector(".wd-switch"));
          const generalRow=[...pageNode.querySelectorAll(".isw-row")].find(node=>node!==switchRow);
          const controlledRows=[switchRow,generalRow].filter(Boolean);
          const deviationMarkers=controlledRows.map(node=>{
            const hadDeviation=node.classList.contains("isw-row--deviated");
            node.classList.add("isw-row--deviated");
            const display=getComputedStyle(node,"::before").display;
            if(!hadDeviation)node.classList.remove("isw-row--deviated");
            return display;
          });
          return {
            headerClass:header.className,
            headerType:[headerStyle.fontSize,headerStyle.fontWeight,headerStyle.lineHeight],
            ecoType,
            headerGap:headerStyle.gap,
            ecoGap,
            headerCells:headerCells.map(node=>node.getBoundingClientRect().left),
            rowCells:cells.map(node=>node.getBoundingClientRect().left),
            rowPadding:[getComputedStyle(row).paddingTop,getComputedStyle(row).paddingBottom],
            inputInset:[inputBox.top-rowBox.top,rowBox.bottom-inputBox.bottom],
            inputWidth:inputBox.width,
            inputLabels:[...row.querySelectorAll("input[data-isw-number]")].map(input=>input.getAttribute("aria-label")),
            settingInputCenter:inputBox.left+inputBox.width/2,
            settingHeaderCenter:headerCells[2].getBoundingClientRect().left+headerCells[2].getBoundingClientRect().width/2,
            headerAlign:[getComputedStyle(headerCells[2]).textAlign,getComputedStyle(headerCells[3]).textAlign],
            symbolAlign:getComputedStyle(cells[1]).textAlign,
            symbolTranslate:getComputedStyle(cells[1]).translate,
            deviationMarkers,
            columns:getComputedStyle(row).gridTemplateColumns
          };
        });
        assert.match(protectionTable.headerClass,/\bisw-eco-table-head\b/,"Protection Limits reuses the Economic Schedule table heading class");
        assert.deepEqual(protectionTable.headerType,protectionTable.ecoType,"Protection Limits heading uses the Economic Schedule type style");
        assert.equal(protectionTable.headerGap,protectionTable.ecoGap,"Protection Limits heading uses the Economic Schedule spacing");
        assert.ok(Math.abs(protectionTable.headerCells[0]-protectionTable.rowCells[0])<=5,"Protection Limits Function heading aligns with the row label");
        assert.deepEqual(protectionTable.rowPadding,["6px","6px"],"Protection rows add breathing room above and below the fields");
        assert.ok(protectionTable.inputInset.every(inset=>inset>=5.5),"Protection inputs do not touch the row edges");
        assert.ok(Math.abs(protectionTable.inputWidth-112)<=1,"Protection number fields are narrowed from the full grid column");
        assert.ok(protectionTable.inputLabels.length===2&&protectionTable.inputLabels[0]?.includes(", Setting,")&&protectionTable.inputLabels[1]?.includes(", Trip time,"),"Protection table inputs expose row and column context");
        assert.deepEqual(protectionTable.headerAlign,["center","center"],"Protection value headings are centered over their fields");
        assert.ok(Math.abs(protectionTable.settingHeaderCenter-protectionTable.settingInputCenter)<=1,`Protection Setting heading shares the field centre line (header ${protectionTable.settingHeaderCenter}, field ${protectionTable.settingInputCenter})`);
        assert.equal(protectionTable.symbolAlign,"center","Protection stage symbols are centered in their column");
        assert.equal(protectionTable.symbolTranslate,"-6px","Protection stage symbols shift slightly left as a group");
        assert.ok(protectionTable.deviationMarkers.length>=2&&protectionTable.deviationMarkers.every(display=>display==="none"),"all controlled deviation rows suppress the orange start stripe");
        assert.match(protectionTable.columns,/^140px /,"the centered stage-symbol field begins slightly farther left");
      }
      if(id==="fp"){
        const firstNoteGap=await page.evaluate(()=>{
          const title=document.querySelector(".isw-title-layer .isw-page-title");
          const page=document.querySelector(".isw-page:not(.isw-page--leaving)");
          const note=page.querySelector(":scope > .isw-note:first-child");
          return {
            gap:note.getBoundingClientRect().top-title.getBoundingClientRect().bottom,
            marginTop:getComputedStyle(note).marginTop
          };
        });
        assert.equal(firstNoteGap.marginTop,"0px","a leading Grid note clears the negative card-note offset");
        assert.ok(Math.abs(firstNoteGap.gap-18)<=1,"Frequency-Watt matches the first-content gap used by other Grid pages");
        const frequencySwitches={
          ofp:page.locator('[data-isw-switch="g.ofpOn"]'),
          ufp:page.locator('[data-isw-switch="g.ufpOn"]')
        };
        const frequencySwitchState={
          ofp:await frequencySwitches.ofp.getAttribute("aria-checked"),
          ufp:await frequencySwitches.ufp.getAttribute("aria-checked")
        };
        for(const switchControl of Object.values(frequencySwitches)){
          if(await switchControl.getAttribute("aria-checked")==="false"){
            await switchControl.click();
            await page.waitForTimeout(420);
          }
        }
        const frequencyFields=page.locator('.isw-page[data-page="grid"][data-grid-sub="fp"] > .isw-panel > .isw-row > .isw-mini-number');
        const frequencyFieldBoxes=await frequencyFields.evaluateAll(fields=>fields.map(field=>({
          width:field.getBoundingClientRect().width,
          height:field.getBoundingClientRect().height,
          right:field.getBoundingClientRect().right,
          rowRight:field.closest(".isw-row").getBoundingClientRect().right,
          justifyContent:getComputedStyle(field).justifyContent,
          textAlign:getComputedStyle(field.querySelector("input")).textAlign
        })));
        assert.ok(frequencyFieldBoxes.length>=8,"Frequency-Watt exposes the numeric rows for both protection sections");
        assert.ok(frequencyFieldBoxes.every(field=>Math.abs(field.width-128)<=1&&Math.abs(field.height-36)<=1),"Frequency-Watt numeric inputs use the standard field size");
        assert.ok(frequencyFieldBoxes.every(field=>Math.abs(field.rowRight-field.right)<=1),"Frequency-Watt numeric inputs align to the card content edge");
        assert.ok(frequencyFieldBoxes.every(field=>field.justifyContent==="flex-end"&&field.textAlign==="right"),"Frequency-Watt numeric values and units align to the field's right edge");
        const recoveryField=page.locator('[data-isw-number="g.ofpRecover"]');
        const recoveryCard=recoveryField.locator("xpath=ancestor::section[contains(@class,'isw-panel')]");
        const originalRecovery=await recoveryField.inputValue();
        const recoveryHeightBefore=await recoveryCard.evaluate(node=>node.getBoundingClientRect().height);
        await recoveryField.fill("1000");
        await recoveryField.press("Tab");
        await page.waitForTimeout(24);
        const invalidNumber=await recoveryField.evaluate(input=>{
          const wrapper=input.closest(".isw-mini-number");
          const error=input.closest(".isw-row").querySelector(":scope > .isw-field-errors");
          const card=input.closest(".isw-panel");
          return {
            value:input.value,
            invalid:input.getAttribute("aria-invalid"),
            wrapperInvalid:wrapper.classList.contains("is-invalid"),
            errorText:error?.textContent.trim(),
            animation:card.getAnimations().some(animation=>animation.effect?.getTiming().duration===280)
          };
        });
        assert.equal(invalidNumber.value,"1000","invalid numeric drafts keep the entered value");
        assert.equal(invalidNumber.invalid,"true");
        assert.equal(invalidNumber.wrapperInvalid,true);
        assert.match(invalidNumber.errorText,/0 to 200 %Pn\/min/,"invalid numeric fields show an inline range message");
        assert.equal(invalidNumber.animation,true,"inline validation grows the card with the shared 280ms height rhythm");
        await page.waitForTimeout(420);
        const invalidAppearance=await recoveryField.evaluate(input=>{
          const wrapper=input.closest(".isw-mini-number");
          const error=input.closest(".isw-row").querySelector(":scope > .isw-field-errors");
          const item=error.querySelector(".isw-field-error-message");
          const tokenProbe=document.createElement("span");
          tokenProbe.style.color="var(--wd-accent-red)";
          document.body.append(tokenProbe);
          const errorColor=getComputedStyle(tokenProbe).color;
          tokenProbe.remove();
          const fillProbe=document.createElement("span");
          fillProbe.style.cssText="display:block;width:1px;height:1px;background:var(--isw-number-error-fill)";
          wrapper.append(fillProbe);
          const errorFill=getComputedStyle(fillProbe).backgroundColor;
          fillProbe.remove();
          const wrapperRect=wrapper.getBoundingClientRect();
          const itemRect=item.getBoundingClientRect();
          return {
            inputColor:getComputedStyle(input).color,
            borderColor:getComputedStyle(wrapper).borderTopColor,
            backgroundColor:getComputedStyle(wrapper).backgroundColor,
            errorColor,
            errorFill,
            topGap:itemRect.top-wrapperRect.bottom,
            rightDelta:Math.abs(itemRect.right-wrapperRect.right)
          };
        });
        assert.equal(invalidAppearance.inputColor,invalidAppearance.errorColor,"invalid numeric text settles on the shared danger token");
        assert.equal(invalidAppearance.borderColor,invalidAppearance.errorColor,"invalid numeric fields use a red border");
        assert.equal(invalidAppearance.backgroundColor,invalidAppearance.errorFill,"invalid numeric fields use the shared faint red fill");
        assert.ok(invalidAppearance.topGap>=0&&invalidAppearance.topGap<=4,"inline numeric errors sit directly below the field");
        assert.ok(invalidAppearance.rightDelta<=1,"inline numeric errors align to the field's right edge");
        const recoveryHeightAfter=await recoveryCard.evaluate(node=>node.getBoundingClientRect().height);
        assert.ok(recoveryHeightAfter>recoveryHeightBefore+8,"inline validation increases the card height");
        await recoveryField.fill(originalRecovery);
        await page.waitForTimeout(40);
        assert.equal(await recoveryField.getAttribute("aria-invalid"),null,"a corrected value clears the inline error");
        assert.equal(await recoveryField.locator("xpath=ancestor::div[contains(@class,'isw-row')]").locator(":scope > .isw-field-errors").count(),0,"the inline error row disappears after correction");
        await recoveryField.press("Tab");
        await page.waitForTimeout(80);
        for(const [key,switchControl] of Object.entries(frequencySwitches)){
          if(frequencySwitchState[key]==="false"){
            await switchControl.click();
            await page.waitForTimeout(420);
          }
        }
      }
      if(id==="conn"){
        await page.waitForTimeout(80);
        await page.screenshot({path:"tests/output/inverter-grid-connection-final.png"});
        const connectionTables=await page.evaluate(()=>{
          const pageNode=document.querySelector(".isw-page:not(.isw-page--leaving)");
          const tables=[...pageNode.querySelectorAll(":scope > .isw-table")];
          const reference=getComputedStyle(pageNode.querySelector(".isw-panel .isw-row-label"));
          const referenceType={
            family:reference.fontFamily,size:reference.fontSize,weight:Number(reference.fontWeight),
            lineHeight:reference.lineHeight,letterSpacing:reference.letterSpacing,color:reference.color
          };
          const type=node=>{
            const style=getComputedStyle(node);
            return {
              family:style.fontFamily,size:style.fontSize,weight:Number(style.fontWeight),
              lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,color:style.color
            };
          };
          const segmentedRow=[...pageNode.querySelectorAll(".isw-row")].find(node=>node.querySelector(".wd-segmented-control"));
          const hadDeviation=segmentedRow?.classList.contains("isw-row--deviated")||false;
          segmentedRow?.classList.add("isw-row--deviated");
          const segmentedDeviation=segmentedRow?getComputedStyle(segmentedRow,"::before").display:null;
          if(segmentedRow&&!hadDeviation)segmentedRow.classList.remove("isw-row--deviated");
          return {
            tableCount:tables.length,
            labels:tables.flatMap(table=>[...table.querySelectorAll(".isw-table-symbol")].map(type)),
            rowMetrics:tables.flatMap(table=>[...table.querySelectorAll(".isw-table-row")].map(row=>({
              height:row.getBoundingClientRect().height,
              padding:[getComputedStyle(row).paddingTop,getComputedStyle(row).paddingBottom]
            }))),
            fields:tables.flatMap(table=>[...table.querySelectorAll(".isw-number")].map(input=>{
              const box=input.getBoundingClientRect();
              const tableBox=table.getBoundingClientRect();
              return {
                width:box.width,
                height:box.height,
                rightInset:tableBox.right-parseFloat(getComputedStyle(table).paddingRight)-box.right
              };
            })),
            segmentedDeviation,
            referenceType
          };
        });
        assert.equal(connectionTables.tableCount,2,"Grid Connection contains both window cards");
        assert.ok(connectionTables.labels.every(label=>JSON.stringify(label)===JSON.stringify(connectionTables.referenceType)),"window labels reuse the normal card-title typography and primary ink");
        assert.ok(connectionTables.rowMetrics.every(row=>row.height>=47&&JSON.stringify(row.padding)===JSON.stringify(["6px","6px"])),"both window cards use the open settings-row rhythm");
        assert.ok(connectionTables.fields.every(field=>Math.abs(field.width-128)<=1&&Math.abs(field.height-36)<=1),"window fields use the standard 128 by 36 control size");
        assert.ok(connectionTables.fields.every(field=>Math.abs(field.rightInset)<=1),"window fields align to the card's right content edge");
        assert.equal(connectionTables.segmentedDeviation,"none","segmented-control changes also suppress the orange start stripe");
        const rampControl=page.locator('[data-isw-seg="g.rampMode"]');
        if(await rampControl.locator(".is-selected").getAttribute("data-value")!=="1"){
          await rampControl.locator('[data-value="1"]').click();
          await page.waitForTimeout(650);
        }
        const powerChangeScroll=page.locator(".isw-scroll");
        await powerChangeScroll.evaluate(node=>{
          const max=Math.max(0,node.scrollHeight-node.clientHeight);
          node.scrollTop=Math.min(120,Math.max(0,max-80));
        });
        await page.waitForTimeout(80);
        const stepGrowth=await page.evaluate(()=>new Promise(resolve=>{
          const scroll=document.querySelector(".isw-scroll");
          const step=document.querySelector('[data-isw-seg="g.rampMode"] [data-value="0"]');
          const startTop=scroll.scrollTop;
          const samples=[];
          const started=performance.now();
          step.click();
          const tick=()=>{
            samples.push({
              top:scroll.scrollTop,
              spacer:document.querySelector(".wd-scroll-shrink-spacer")?.getBoundingClientRect().height||0
            });
            if(performance.now()-started<500)requestAnimationFrame(tick);
            else resolve({startTop,samples});
          };
          requestAnimationFrame(tick);
        }));
        assert.ok(stepGrowth.samples.every(sample=>Math.abs(sample.top-stepGrowth.startTop)<=1),"growing the page at Step does not move the viewport upward");
        assert.ok(stepGrowth.samples.every(sample=>sample.spacer===0),"content growth never creates a bottom-shrink buffer");
        await rampControl.locator('[data-value="1"]').click();
        await page.waitForTimeout(650);
        assert.equal(await rampControl.locator(".is-selected").getAttribute("data-value"),"1","the Step growth probe restores Ramp");
      }
      if(id==="reac"){
        const trigger=page.locator("[data-isw-reac-mode-trigger]");
        const originalMode=await trigger.getAttribute("data-value");
        if(originalMode!=="3"){
          await trigger.click();
          await page.locator('.isw-reac-mode-popover .wd-select-option[data-value="3"]').click();
          await waitForPageTitle("Reactive Power");
        }
        const pointTables=page.locator(".isw-point-table");
        assert.ok(await pointTables.count()>=1,"the active reactive characteristic renders its point table");
        const pointTableLayout=await pointTables.first().evaluate(table=>{
          const header=table.querySelector(".isw-table-head");
          const row=table.querySelector(".isw-table-row");
          const fields=[...row.querySelectorAll(".isw-mini-number")];
          const headerCells=[...header.querySelectorAll(":scope > span")];
          const headerStyle=getComputedStyle(header);
          const labelStyle=getComputedStyle(row.querySelector(".isw-table-symbol"));
          const rowStyle=getComputedStyle(row);
          const pageNode=table.closest(".isw-page");
          const colorProbe=document.createElement("span");
          colorProbe.style.color="var(--wd-label-primary)";
          table.append(colorProbe);
          const primaryColor=getComputedStyle(colorProbe).color;
          colorProbe.remove();
          const fieldBoxes=fields.map(field=>field.getBoundingClientRect());
          const headerBoxes=headerCells.slice(1).map(cell=>cell.getBoundingClientRect());
          return {
            className:table.className,
            width:table.getBoundingClientRect().width,
            header:{size:headerStyle.fontSize,weight:Number(headerStyle.fontWeight),height:header.getBoundingClientRect().height},
            label:{size:labelStyle.fontSize,weight:Number(labelStyle.fontWeight),lineHeight:labelStyle.lineHeight,color:labelStyle.color},
            primaryColor,
            row:{minHeight:rowStyle.minHeight,padding:[rowStyle.paddingTop,rowStyle.paddingBottom],height:row.getBoundingClientRect().height},
            emptyPanels:[...pageNode.children].filter(node=>node.matches(".isw-panel")&&!node.textContent.trim()).length,
            fields:fieldBoxes.map((box,index)=>({width:box.width,height:box.height,fontSize:getComputedStyle(fields[index].querySelector("input")).fontSize})),
            headerFieldCenters:fieldBoxes.map((box,index)=>[box.left+box.width/2,headerBoxes[index].left+headerBoxes[index].width/2])
          };
        });
        assert.match(pointTableLayout.className,/\bisw-point-table\b/,"reactive characteristic tables use the shared point-table variant");
        assert.ok(Math.abs(pointTableLayout.width-560)<=1,"point tables use the standard Grid content width");
        assert.deepEqual(pointTableLayout.header,{size:"12px",weight:400,height:32},"point tables reuse the quiet Economic Schedule header");
        assert.deepEqual({size:pointTableLayout.label.size,weight:pointTableLayout.label.weight,lineHeight:pointTableLayout.label.lineHeight},{size:"13px",weight:400,lineHeight:"18px"},"point labels use the unified 13px / 18px caption typography");
        assert.equal(pointTableLayout.label.color,pointTableLayout.primaryColor,"point labels use primary ink");
        assert.ok(pointTableLayout.row.height>=47&&JSON.stringify(pointTableLayout.row.padding)===JSON.stringify(["6px","6px"]),"point rows use the open settings-table rhythm");
        assert.equal(pointTableLayout.emptyPanels,0,"empty reactive condition groups do not leave a blank card in the page");
        assert.ok(pointTableLayout.fields.every(field=>Math.abs(field.width-112)<=1&&Math.abs(field.height-36)<=1&&field.fontSize==="13px"),"point fields use the standard compact numeric size and 13px field typography");
        assert.ok(pointTableLayout.headerFieldCenters.every(([field,heading])=>Math.abs(field-heading)<=1),"point headings centre over their numeric fields");
        const pointInput=pointTables.first().locator("input[data-isw-number]").first();
        const originalPointValue=await pointInput.inputValue();
        const pointHeightsBefore=await pointInput.evaluate(input=>{
          const row=input.closest(".isw-table-row");
          const card=input.closest(".isw-table");
          return {row:row.getBoundingClientRect().height,card:card.getBoundingClientRect().height};
        });
        await pointInput.fill("999999");
        await page.waitForTimeout(24);
        assert.equal(await pointInput.getAttribute("aria-invalid"),"true","a point-table range error stays inline");
        assert.equal(
          await pointInput.evaluate(input=>input.closest(".isw-table").getAnimations().some(animation=>animation.effect?.getTiming().duration===280)),
          true,
          "a point-table error grows the table card with the shared 280ms rhythm"
        );
        await page.waitForTimeout(320);
        const pointHeightsAfter=await pointInput.evaluate(input=>{
          const row=input.closest(".isw-table-row");
          const card=input.closest(".isw-table");
          return {row:row.getBoundingClientRect().height,card:card.getBoundingClientRect().height};
        });
        assert.ok(pointHeightsAfter.row>pointHeightsBefore.row+12,"a point-table error adds real row height");
        assert.ok(pointHeightsAfter.card>pointHeightsBefore.card+12,"a point-table error grows the table card");
        await pointInput.fill(originalPointValue);
        await pointInput.press("Tab");
        await page.waitForTimeout(320);
        if(originalMode!=="3"){
          await trigger.click();
          await page.locator(`.isw-reac-mode-popover .wd-select-option[data-value="${originalMode}"]`).click();
          await waitForPageTitle("Reactive Power");
        }
        const nextMode=originalMode==="2"?"1":"2";
        assert.match(await trigger.getAttribute("aria-label"),/^Control mode: /);
        assert.equal(await trigger.getAttribute("aria-expanded"),"false");
        const triggerChrome=await trigger.evaluate(node=>{
          const style=getComputedStyle(node);
          const value=node.querySelector(".wd-select-value");
          return {
            className:node.className,
            width:node.getBoundingClientRect().width,
            height:node.getBoundingClientRect().height,
            radius:style.borderRadius,
            fontSize:style.fontSize,
            hasPopup:node.getAttribute("aria-haspopup"),
            valueFits:value.scrollWidth<=value.clientWidth+1
          };
        });
        assert.match(triggerChrome.className,/\bwd-select-trigger\b/,"Reactive Power uses the shared select trigger");
        assert.match(triggerChrome.className,/\bwd-select--adaptive\b/);
        assert.ok(triggerChrome.width>=60&&Math.abs(triggerChrome.height-36)<=1,"Reactive Power control mode uses the annotated adaptive select geometry");
        assert.equal(triggerChrome.radius,"18px","Reactive Power reuses the annotated trigger radius");
        assert.equal(triggerChrome.fontSize,"13px","Reactive Power uses the unified 13px field typography");
        assert.equal(triggerChrome.hasPopup,"listbox");
        assert.equal(triggerChrome.valueFits,true,"the selected reactive mode stays readable without ellipsis");
        await trigger.click();
        const reactivePopover=page.locator(".isw-reac-mode-popover");
        await reactivePopover.waitFor({state:"visible"});
        await assertTypographyContract("grid:reac-menu");
        assert.equal(await reactivePopover.evaluate(node=>node.classList.contains("wd-select-popover")&&Boolean(node.querySelector(".wd-menu"))),true,"Reactive Power uses the shared select popover");
        assert.deepEqual(
          await reactivePopover.locator(".wd-select-option").allTextContents(),
          ["Off","Fixed Q","Fixed cos φ","Q(U)","cos φ(P)","Q(P)","cos φ(U)"],
          "the shared menu contains all seven reactive control modes"
        );
        assert.equal(await reactivePopover.locator('.wd-select-option[aria-selected="true"]').count(),1,"the popover exposes one selected mode");
        assert.match(
          await reactivePopover.locator('.wd-select-option[aria-selected="true"] .wd-select-check').evaluate(node=>getComputedStyle(node).maskImage),
          /check-circle\.svg/,
          "the selected reactive mode uses the shared check style"
        );
        const reactiveCheckSize=await reactivePopover.locator('.wd-select-option[aria-selected="true"] .wd-select-check').evaluate(node=>{
            const box=node.getBoundingClientRect();
            return [box.width,box.height];
          });
        assert.ok(reactiveCheckSize.every(size=>Math.abs(size-18)<=.25),"shared select radio marks use the 18px state size");
        await reactivePopover.locator(`.wd-select-option[data-value="${nextMode}"]`).click();
        await waitForPageTitle("Reactive Power");
        await page.waitForTimeout(80);
        assert.equal(await page.locator("[data-isw-reac-mode-trigger]").getAttribute("data-value"),nextMode,"choosing a reactive mode updates the setting immediately");
        assert.match(await page.locator("[data-isw-reac-mode-trigger]").getAttribute("aria-label"),/^Control mode: /);
        assert.equal(await page.evaluate(()=>document.activeElement?.matches("[data-isw-reac-mode-trigger]")),true,"the shared select returns focus to its trigger");
        assert.equal(
          await page.locator("[data-isw-reac-mode-trigger] .wd-select-value").evaluate(node=>node.scrollWidth<=node.clientWidth+1),
          true,
          "the longest reactive mode label remains complete in the trigger"
        );
        const reactiveFields=await page.locator('.isw-page[data-grid-sub="reac"] .isw-number').evaluateAll(nodes=>nodes.map(node=>{
          const box=node.getBoundingClientRect();
          return {width:box.width,height:box.height};
        }));
        assert.ok(reactiveFields.length>=1,"the selected reactive mode exposes its standard numeric fields");
        assert.ok(reactiveFields.every(field=>Math.abs(field.width-128)<=1&&Math.abs(field.height-36)<=1),"Reactive Power fields use the unified default size");
        await page.screenshot({path:"tests/output/inverter-reactive-power-final.png"});
        await page.locator("[data-isw-reac-mode-trigger]").click();
        await page.locator(`.isw-reac-mode-popover .wd-select-option[data-value="${originalMode}"]`).click();
        await waitForPageTitle("Reactive Power");
        assert.equal(await page.locator("[data-isw-reac-mode-trigger]").getAttribute("data-value"),originalMode,"the regression probe restores the original reactive mode");
      }
      if(id==="lvrt"||id==="hvrt"){
        const trigger=page.locator("[data-isw-ride-priority-trigger]");
        const priorityKey=await trigger.getAttribute("data-isw-ride-priority-trigger");
        const originalValue=await trigger.getAttribute("data-value");
        const nextValue=String((Number(originalValue)+1)%3);
        assert.match(await trigger.getAttribute("aria-label"),/^Behaviour during ride-through: /);
        assert.equal(await trigger.getAttribute("aria-expanded"),"false");
        assert.equal(
          await page.locator(`[data-isw-seg="g.${priorityKey}"]`).count(),
          0,
          `${title} no longer uses a segmented control for ride-through behaviour`
        );
        const chrome=await trigger.evaluate(node=>{
          const style=getComputedStyle(node);
          const value=node.querySelector(".wd-select-value");
          return {
            className:node.className,
            width:node.getBoundingClientRect().width,
            height:node.getBoundingClientRect().height,
            radius:style.borderRadius,
            fontSize:style.fontSize,
            valueFits:value.scrollWidth<=value.clientWidth+1,
            popup:node.getAttribute("aria-haspopup")
          };
        });
        assert.match(chrome.className,/\bwd-select-trigger\b/,`${title} uses the shared select trigger`);
        assert.match(chrome.className,/\bwd-select--adaptive\b/);
        assert.ok(chrome.width>=60&&Math.abs(chrome.height-36)<=1,`${title} uses the annotated adaptive select geometry`);
        assert.equal(chrome.radius,"18px",`${title} reuses the annotated trigger radius`);
        assert.equal(chrome.fontSize,"13px",`${title} uses the unified 13px field typography`);
        assert.equal(chrome.valueFits,true,`${title} never truncates the current behaviour`);
        assert.equal(chrome.popup,"listbox");
        await trigger.click();
        const popover=page.locator(".isw-ride-priority-popover");
        await popover.waitFor({state:"visible"});
        assert.equal(await popover.evaluate(node=>node.classList.contains("wd-select-popover")&&Boolean(node.querySelector(".wd-menu"))),true,`${title} uses the shared Glass listbox`);
        assert.deepEqual(
          await popover.locator(".wd-select-option").allTextContents(),
          ["Zero current","Reactive priority","Active priority"],
          `${title} exposes all three ride-through behaviours`
        );
        const selectedCheck=popover.locator('.wd-select-option[aria-selected="true"] .wd-select-check');
        const selectedCheckSize=await selectedCheck.evaluate(node=>{
            const box=node.getBoundingClientRect();
            return [box.width,box.height];
          });
        assert.ok(selectedCheckSize.every(size=>Math.abs(size-18)<=.25),`${title} uses the shared 18px selected radio mark`);
        await popover.locator(`.wd-select-option[data-value="${nextValue}"]`).click();
        await waitForPageTitle(title);
        await page.waitForTimeout(80);
        assert.equal(await page.locator("[data-isw-ride-priority-trigger]").getAttribute("data-value"),nextValue,`${title} applies the selected behaviour`);
        assert.equal(await page.evaluate(()=>document.activeElement?.matches("[data-isw-ride-priority-trigger]")),true,`${title} returns focus to the shared trigger`);
        await page.screenshot({path:`tests/output/inverter-${id}-ride-through-final.png`});
        await page.locator("[data-isw-ride-priority-trigger]").click();
        await page.locator(`.isw-ride-priority-popover .wd-select-option[data-value="${originalValue}"]`).click();
        await waitForPageTitle(title);
        assert.equal(await page.locator("[data-isw-ride-priority-trigger]").getAttribute("data-value"),originalValue,`${title} restores its original behaviour`);
      }
      const gridColumn=await page.evaluate(()=>{
        const surface=document.querySelector('.isw-page:not(.isw-page--leaving) > :is(.isw-panel,.isw-table,.isw-profile-list,.isw-plot)');
        const card=surface.getBoundingClientRect();
        const page=document.querySelector(".isw-page:not(.isw-page--leaving)").getBoundingClientRect();
        const pane=document.querySelector(".isw-content-pane").getBoundingClientRect();
        const titleLayer=document.querySelector(".isw-title-layer").getBoundingClientRect();
        const titleLabel=document.querySelector(".isw-page-title .isw-title-label").getBoundingClientRect();
        return {
          cardWidth:card.width,
          cardLeft:card.left,
          cardCenter:card.left+card.width/2,
          pageCenter:page.left+page.width/2,
          paneCenter:pane.left+pane.width/2,
          titleLeft:titleLayer.left,
          titleWidth:titleLayer.width,
          cardLine:card.left+parseFloat(getComputedStyle(surface).paddingLeft),
          titleLabelLeft:titleLabel.left
        };
      });
      assert.ok(Math.abs(gridColumn.cardWidth-560)<=1,`${title} uses the shared 560px Grid card width`);
      assert.ok(Math.abs(gridColumn.titleWidth-gridColumn.cardWidth)<=1,`${title} title region matches the card width`);
      assert.ok(Math.abs(gridColumn.titleLeft-gridColumn.cardLeft)<=1,`${title} title region aligns with the card left edge`);
      assert.ok(Math.abs(gridColumn.cardCenter-gridColumn.pageCenter)<=1,`${title} cards stay centered in the settings page column`);
      assert.ok(Math.abs(gridColumn.cardCenter-gridColumn.paneCenter)<=1,`${title} cards stay centered in the content pane`);
      assert.ok(Math.abs(gridColumn.titleLabelLeft-gridColumn.cardLine)<=1,`${title} title text aligns with the card content line`);
    }

    await page.locator('[data-isw-sub="prot"]').click();
    await waitForPageTitle("Protection Limits");
    const protectionScrollTop=await page.locator(".isw-scroll").evaluate(node=>{
      node.scrollTop=Math.min(140,node.scrollHeight-node.clientHeight);
      return node.scrollTop;
    });
    await page.locator('[data-isw-go="dispatch"]').click();
    await waitForPage("dispatch");
    const dispatchScrollTop=await page.locator(".isw-scroll").evaluate(node=>{
      node.scrollTop=Math.min(96,node.scrollHeight-node.clientHeight);
      return node.scrollTop;
    });
    await page.locator('[data-isw-go="grid"]').click();
    await waitForPageTitle("Protection Limits");
    await page.waitForTimeout(320);
    assert.equal(
      await page.locator('[data-isw-sub="prot"]').getAttribute("aria-current"),
      "page",
      "reopening Grid & Protection restores the last secondary page"
    );
    const restoredProtectionScroll=await page.locator(".isw-scroll").evaluate(node=>node.scrollTop);
    assert.ok(Math.abs(restoredProtectionScroll-protectionScrollTop)<=1,"reopening Grid restores the last secondary-page scroll position");
    await page.locator('[data-isw-go="dispatch"]').click();
    await waitForPage("dispatch");
    await page.waitForTimeout(320);
    const restoredDispatchScroll=await page.locator(".isw-scroll").evaluate(node=>node.scrollTop);
    assert.ok(Math.abs(restoredDispatchScroll-dispatchScrollTop)<=1,"switching back to a main settings page restores its own scroll position");
    await page.locator('[data-isw-go="grid"]').click();
    await waitForPageTitle("Protection Limits");
    await page.locator('[data-isw-sub="code"]').click();
    await waitForPageTitle("Grid Code");
    const selectableProfiles=await page.locator("[data-isw-profile]").evaluateAll(rows=>rows.map(row=>row.dataset.iswProfile));
    assert.equal(selectableProfiles.length,11,"all 11 profiles with parameter sets are selectable");
    for(const profile of selectableProfiles){
      await page.locator('[data-isw-sub="code"]').click();
      await waitForPageTitle("Grid Code");
      await page.locator(`[data-isw-profile="${profile}"]`).click();
      await page.waitForTimeout(45);
      await page.locator(".isw-actions .wd-button--primary").click();
      await page.waitForTimeout(420);
      const subpages=await page.locator("[data-isw-sub]").evaluateAll(rows=>rows.map(row=>row.dataset.iswSub));
      for(const subpage of subpages){
        await page.locator(`[data-isw-sub="${subpage}"]`).click();
        await waitForPageTitle(gridSubTitles.get(subpage));
      }
    }
    await page.locator('[data-isw-sub="code"]').click();
    await page.locator('[data-isw-profile="en50549_1"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".isw-device-profile").textContent(),"EN 50549-1");
    assert.deepEqual(
      await page.locator(".isw-subnav-item").allTextContents(),
      ["Grid Code","Protection Limits","Grid Connection","Reactive Power","P(U) Characteristics","Frequency-Watt (F-P)","LVRT","HVRT"]
    );
    assert.equal(await page.locator(".isw-profile-row.is-disabled").count(),7,"roadmap profiles cannot be selected");
    await page.locator(".isw-actions .wd-button--primary").click();
    await page.waitForTimeout(420);

    await page.locator('[data-isw-sub="prot"]').click();
    const ov1=page.locator('[data-isw-number="g.ov1"]');
    await ov1.fill("277");
    await ov1.press("Enter");
    await page.waitForTimeout(120);
    assert.equal(await page.locator(".isw-row--deviated").count(),1);
    await page.locator('[data-isw-sub="code"]').click();
    const gridPageChangeConfirm=page.locator(".plants-device-dialog--confirm");
    await gridPageChangeConfirm.waitFor();
    assert.match(await gridPageChangeConfirm.locator(".plants-device-confirm-description").textContent(),/Protection Limits/);
    await gridPageChangeConfirm.getByRole("button",{name:"Keep Editing"}).click();
    await page.waitForFunction(()=>!document.querySelector(".plants-device-dialog--confirm"));
    assert.equal(await page.locator('[data-isw-sub="prot"]').getAttribute("aria-current"),"page","Keep Editing stays on the dirty Grid secondary page");
    await page.locator(".isw-actions .wd-button--primary").click();
    await page.waitForTimeout(420);
    await page.locator('[data-isw-go="log"]').click();
    await waitForPage("log");
    const savedProtectionLog=await page.locator(".isw-log-row").first().evaluate(row=>({
      operator:row.querySelector(".isw-log-operator")?.textContent||"",
      changes:[...row.querySelectorAll(".isw-log-change-line")].map(line=>line.textContent.replace(/\s+/g," ").trim())
    }));
    assert.equal(savedProtectionLog.operator,"Lena Tong","the local preview attributes a saved change to the active preview operator");
    assert.ok(
      savedProtectionLog.changes.some(change=>/Overvoltage stage 1.*276\.0 V.*277\.0 V/.test(change)),
      "a normal settings Save appends its changed field values to the operation log"
    );
    await page.locator('[data-isw-go="grid"]').click();
    await waitForPageTitle("Protection Limits");
    await page.locator('[data-isw-sub="conn"]').click();
    await waitForPageTitle("Grid Connection");
    assert.equal(await page.locator(".plants-device-dialog--confirm").count(),0,"saving Protection Limits does not dirty another Grid secondary page");
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"a saved Grid secondary page leaves the action bar clear on its sibling");
    await page.locator('[data-isw-sub="prot"]').click();
    await waitForPageTitle("Protection Limits");
    await page.locator('[data-isw-sub="code"]').click();
    await waitForPageTitle("Grid Code");
    assert.match(await page.locator(".isw-panel").first().innerText(),/Values changed from the profile[\s\S]*1/);
    await page.getByRole("button",{name:/Reload EN 50549-1/}).click();
    await page.waitForTimeout(100);
    assert.match(await page.locator(".isw-panel").first().innerText(),/Values changed from the profile[\s\S]*None/);
    await page.locator(".isw-actions .wd-button--primary").click();
    await page.waitForFunction(()=>document.querySelector(".isw-actions .wd-button--primary .wd-control-label")?.textContent==="Saved");
    assert.equal(await page.locator(".isw-actions .wd-button--primary .wd-control-label").textContent(),"Saved");
    assert.match(await page.locator(".wd-toast-text").textContent(),/Inverter settings saved/);
    const toastCenter=await page.locator("#toast").evaluate(node=>{
      const box=node.getBoundingClientRect();
      const content=document.querySelector(".isw-body").getBoundingClientRect();
      return {center:box.left+box.width/2,content:content.left+content.width/2,viewport:innerWidth/2,scope:node.dataset.toastScope};
    });
    assert.equal(toastCenter.scope,undefined,"the page-level settings toast does not opt into a local content scope");
    assert.ok(Math.abs(toastCenter.center-toastCenter.viewport)<=1,"the settings toast is centered in the viewport");
    assert.ok(Math.abs(toastCenter.center-toastCenter.content)>20,"the page-level toast is not offset into the right content pane");
    await page.waitForTimeout(240);
    assert.equal(await page.locator(".isw-actions").isHidden(),true,"saving clears the current page dirty state and closes the action bar");
    await page.locator('[data-isw-go="dispatch"]').click();
    await waitForPage("dispatch");
    await page.locator(".isw-close-button").click();
    await page.waitForTimeout(80);
    assert.equal(
      await page.locator(".inverter-settings-dialog").evaluate(node=>node.parentElement.dataset.closing),
      "true",
      "the settings window starts the shared modal exit before navigation changes"
    );
    assert.equal(await page.locator(".inverter-settings-window").count(),1,"the exiting settings window remains mounted during the animation");
    await page.waitForTimeout(620);
    assert.match(page.url(),/\/plants\/p25\/devices\?device=inverter/);
    assert.equal(await page.locator(".inverter-settings-window").count(),0);

    await page.goto(settingsURL,{waitUntil:"domcontentloaded"});
    await ready();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"direct settings URL opens the window");
    await page.reload({waitUntil:"domcontentloaded"});
    await ready();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"settings URL survives refresh");
    await page.goBack();
    await page.waitForTimeout(500);
    assert.match(page.url(),/\/plants\/p25\/devices\?device=inverter/);

    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto(settingsURL,{waitUntil:"domcontentloaded"});
    await ready();
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),true);
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true);
    assert.equal(
      await page.locator(".isw-status-window").evaluate(node=>node.classList.contains("isw-status-window--entering")),
      false,
      "reduced motion does not arm the upper status float"
    );
    assert.equal(
      await page.locator(".isw-status-window").evaluate(node=>getComputedStyle(node).animationName),
      "none",
      "the upper status float is disabled when reduced motion is requested"
    );
    assert.equal(
      await page.locator(".isw-connection-status > i").evaluate(node=>getComputedStyle(node).animationName),
      "none",
      "the connected status stops pulsing when reduced motion is requested"
    );
    assert.equal(errors.length,0,errors.join("\n"));

    await page.setViewportSize({width:760,height:900});
    await page.waitForTimeout(220);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth),
      true,
      "the narrow settings window does not create whole-page horizontal scroll"
    );
    await page.screenshot({path:"tests/output/inverter-settings-narrow.png"});
    await page.setViewportSize({width:1545,height:1252});
    await page.waitForTimeout(150);
    await page.screenshot({path:"tests/output/inverter-settings.png"});
    await page.locator(".isw-close-button").click();
    await page.waitForTimeout(520);
    if(await page.evaluate(() => document.documentElement.dataset.theme)!=="light"){
      await page.getByRole("button",{name:"Toggle light and dark mode"}).click();
      await page.waitForTimeout(700);
    }
    await page.getByRole("button",{name:"Open iHybrid settings"}).click();
    await page.waitForTimeout(650);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme),"light");
    assert.equal(await page.locator(".isw-page-title").textContent(),"Active Power Dispatch");
    const lightDispatchInput=page.locator('[data-isw-number="dispatch.sp"]');
    const originalLightDispatch=await lightDispatchInput.inputValue();
    await lightDispatchInput.fill("5000");
    await page.waitForTimeout(24);
    const lightFocusedInvalid=await lightDispatchInput.evaluate(input=>{
      const wrapper=input.closest(".isw-number");
      const tokenProbe=document.createElement("span");
      tokenProbe.style.color="var(--wd-accent-red)";
      document.body.append(tokenProbe);
      const errorColor=getComputedStyle(tokenProbe).color;
      tokenProbe.remove();
      const fillProbe=document.createElement("span");
      fillProbe.style.cssText="display:block;width:1px;height:1px;background:var(--isw-number-error-fill-hover)";
      wrapper.append(fillProbe);
      const errorFill=getComputedStyle(fillProbe).backgroundColor;
      fillProbe.remove();
      return {
        focused:wrapper.matches(":focus-within"),
        borderColor:getComputedStyle(wrapper).borderTopColor,
        backgroundColor:getComputedStyle(wrapper).backgroundColor,
        errorColor,
        errorFill
      };
    });
    assert.equal(lightFocusedInvalid.focused,true,"the light-theme invalid field remains focused while typing");
    assert.equal(lightFocusedInvalid.borderColor,lightFocusedInvalid.errorColor,"focused invalid fields keep the red border in light mode");
    assert.equal(lightFocusedInvalid.backgroundColor,lightFocusedInvalid.errorFill,"focused invalid fields keep the faint red fill in light mode");
    await lightDispatchInput.fill(originalLightDispatch);
    await lightDispatchInput.press("Tab");
    await page.waitForTimeout(320);
    const lightBodySurface=await page.locator(".isw-body").evaluate(node=>{
      const style=getComputedStyle(node);
      return {
        backgroundColor:style.backgroundColor,
        backgroundImage:style.backgroundImage,
        boxShadow:style.boxShadow
      };
    });
    assert.equal(lightBodySurface.backgroundColor,"rgb(247, 247, 247)","the settings panel uses the shared light workspace surface");
    assert.match(lightBodySurface.backgroundImage,/linear-gradient\(rgba\(0, 0, 0, 0\.02(?:4|5)\)/,"the light content pane adds the reviewed depth tint");
    assert.doesNotMatch(lightBodySurface.boxShadow,/inset/,"the light settings panel uses the shared shadow-only lift");
    const stackedMaterials=await page.evaluate(()=>{
      const read=selector=>{
        const fill=getComputedStyle(document.querySelector(`${selector} > .wd-glass-material > .wd-glass-fill`));
        const optics=getComputedStyle(document.querySelector(`${selector} > .wd-glass-material > .wd-glass-optics`));
        return {
          background:fill.backgroundColor,
          backdrop:fill.backdropFilter,
          tint:fill.getPropertyValue("--wd-glass-tint").trim(),
          optics:optics.backgroundImage
        };
      };
      return {
        status:read(".isw-status-window"),
        main:read(".isw-main-window")
      };
    });
    assert.deepEqual(
      stackedMaterials.status,
      stackedMaterials.main,
      "the light status window reuses the lower window's shared Glass Surface material without a local fill override"
    );
    assert.equal(
      await page.locator('[data-isw-number="dispatch.sp"]').locator("xpath=..").evaluate(node=>getComputedStyle(node).backgroundColor),
      "rgba(0, 0, 0, 0)",
      "light number fields stay transparent so the card surface shows through"
    );
    const lightNumberField=page.locator('[data-isw-number="dispatch.sp"]').locator("xpath=..");
    const lightNumberBefore=await lightNumberField.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      shadow:getComputedStyle(node).boxShadow
    }));
    assert.match(lightNumberBefore.shadow,/rgba\(0, 0, 0, 0\.08\)/,"light resting shadows stay subtle");
    await lightNumberField.hover();
    await page.waitForTimeout(420);
    const lightNumberAfter=await lightNumberField.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      shadow:getComputedStyle(node).boxShadow,
      hoverFill:getComputedStyle(node).getPropertyValue("--isw-number-hover-fill").trim(),
      hoverBorder:getComputedStyle(node).getPropertyValue("--isw-number-border-hover").trim()
    }));
    assert.notEqual(lightNumberAfter.background,lightNumberBefore.background,"light number fields deepen their surface on hover");
    assert.notEqual(lightNumberAfter.borderColor,lightNumberBefore.borderColor,"light number fields strengthen their outline on hover");
    assert.match(lightNumberAfter.hoverFill,/6%/,"light hover uses the lighter 6% fill");
    assert.match(lightNumberAfter.hoverBorder,/16%/,"light hover keeps a restrained 16% outline");
    assert.match(lightNumberAfter.shadow,/rgba\(0, 0, 0, 0\.14\)/,"light hover shadows remain soft rather than black");
    await page.locator('[data-isw-number="dispatch.sp"]').click();
    await page.waitForTimeout(420);
    const lightNumberFocus=await lightNumberField.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      outlineWidth:getComputedStyle(node).outlineWidth,
      outlineColor:getComputedStyle(node).outlineColor,
      shadow:getComputedStyle(node).boxShadow,
      focusFill:getComputedStyle(node).getPropertyValue("--isw-number-focus-fill").trim(),
      focusBorder:getComputedStyle(node).getPropertyValue("--isw-number-border-focus").trim(),
      focusOutline:getComputedStyle(node).getPropertyValue("--isw-number-focus-outline").trim()
    }));
    assert.notEqual(lightNumberFocus.background,lightNumberAfter.background,"light number fields deepen their surface again on focus");
    assert.notEqual(lightNumberFocus.borderColor,lightNumberAfter.borderColor,"light number fields strengthen their outline again on focus");
    assert.equal(lightNumberFocus.outlineWidth,"1px","light number fields keep one crisp focus ring");
    assert.notEqual(lightNumberFocus.outlineColor,lightNumberBefore.borderColor,"the light number focus ring is stronger than the resting outline");
    assert.match(lightNumberFocus.focusFill,/12%/,"light focus uses the softer 12% fill");
    assert.match(lightNumberFocus.focusBorder,/32%/,"light focus uses a restrained 32% outline");
    assert.match(lightNumberFocus.focusOutline,/12%/,"light focus keeps a light 12% outer ring");
    assert.match(lightNumberFocus.shadow,/rgba\(0, 0, 0, 0\.16\)/,"light focus keeps the shadow controlled");
    await page.locator('[data-isw-number="dispatch.sp"]').evaluate(input=>input.blur());
    await page.mouse.move(0,0);
    await page.waitForTimeout(420);
    const lightNestedSurfaces=await page.evaluate(()=>{
      const body=getComputedStyle(document.querySelector(".isw-body"));
      const host=document.querySelector(".isw-page");
      const classes=["isw-panel","isw-table","isw-effective-chain","isw-soc-panel","isw-gantt","isw-plot","isw-profile-list","isw-mode-card"];
      return {
        bodyBackgroundImage:body.backgroundImage,
        surfaces:classes.map(className=>{
          const probe=document.createElement("div");
          probe.className=className;
          host.append(probe);
          const style=getComputedStyle(probe);
          const value={
            background:style.backgroundColor,
            backgroundImage:style.backgroundImage,
            boxShadow:style.boxShadow
          };
          probe.remove();
          return value;
        })
      };
    });
    const lightReference=lightNestedSurfaces.surfaces[0];
    assert.ok(lightNestedSurfaces.surfaces.every(surface=>surface.background===lightReference.background&&surface.backgroundImage===lightReference.backgroundImage&&surface.boxShadow===lightReference.boxShadow),"light nested boxes reuse one shared material and shadow");
    assert.match(lightReference.boxShadow,/0px 2px 3px/,"light settings boxes keep the shared light shadow");
    assert.notEqual(lightNestedSurfaces.bodyBackgroundImage,lightReference.backgroundImage,"the light content pane is slightly deeper than its cards");
    await page.screenshot({path:"tests/output/inverter-settings-light.png"});
    await page.locator('[data-isw-go="mode"]').click();
    await page.waitForTimeout(100);
    const lightSelectedMode=await page.evaluate(()=>{
      const selected=document.querySelector(".isw-mode-card.is-selected");
      const style=getComputedStyle(selected);
      const fillProbe=document.createElement("span");
      fillProbe.style.backgroundColor="var(--isw-mode-selected-fill)";
      document.querySelector(".isw-page").append(fillProbe);
      const selectedFill=getComputedStyle(fillProbe).backgroundColor;
      fillProbe.remove();
      const primaryProbe=document.createElement("span");
      primaryProbe.style.color="var(--wd-label-primary)";
      document.querySelector(".isw-page").append(primaryProbe);
      const primary=getComputedStyle(primaryProbe).color;
      primaryProbe.remove();
      return {
        borderWidth:style.borderTopWidth,
        borderColor:style.borderTopColor,
        background:style.backgroundColor,
        selectedFill,
        textColor:style.color,
        primary,
        iconColor:getComputedStyle(selected.querySelector(":scope > .isw-icon")).color,
        checkBackground:getComputedStyle(selected.querySelector(".isw-radio-mark")).backgroundColor
      };
    });
    assert.equal(lightSelectedMode.borderWidth,"1px","light selected mode cards use the neutral divider border");
    assert.equal(lightSelectedMode.background,lightSelectedMode.selectedFill,"light selected mode cards use the shared selected fill");
    assert.equal(lightSelectedMode.textColor,lightSelectedMode.primary,"selected mode copy stays on primary ink in light mode");
    assert.equal(lightSelectedMode.iconColor,lightSelectedMode.primary,"the light selected mode icon uses primary ink");
    assert.equal(lightSelectedMode.checkBackground,lightSelectedMode.primary,"the light selected check uses primary ink");
    const lightHoverMode=page.locator('[data-isw-mode="2"]');
    const lightHoverBefore=await lightHoverMode.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      markMask:getComputedStyle(node.querySelector(".isw-radio-mark")).maskImage
    }));
    await lightHoverMode.hover();
    await page.waitForTimeout(280);
    const lightHoverAfter=await lightHoverMode.evaluate(node=>({
      background:getComputedStyle(node).backgroundColor,
      borderColor:getComputedStyle(node).borderTopColor,
      markMask:getComputedStyle(node.querySelector(".isw-radio-mark")).maskImage
    }));
    assert.notEqual(lightHoverAfter.background,lightHoverBefore.background,"light idle mode cards change fill on hover");
    assert.notEqual(lightHoverAfter.borderColor,lightHoverBefore.borderColor,"light hover adds a lighter neutral border");
    assert.equal(lightHoverAfter.markMask,lightHoverBefore.markMask,"light hover does not change the idle marker");
    await page.locator('[data-isw-mode="1"]').click();
    await page.waitForTimeout(420);
    await page.locator(".isw-close-button").click();
    await page.locator(".plants-device-dialog--confirm").waitFor();
    await page.waitForTimeout(560);
    await page.screenshot({path:"tests/output/inverter-settings-light-unsaved.png"});
    await page.getByRole("button",{name:"Discard Changes"}).click();
    await page.waitForTimeout(620);
    assert.match(page.url(),/\/plants\/p25\/devices\?device=inverter/);
    assert.equal(await page.locator(".inverter-settings-window").count(),0,"Discard Changes exits after unsaved confirmation");
    const standaloneURL=`${origin}/settings`;
    await page.evaluate(()=>{
      localStorage.setItem("wattdesk-home-theme","dark");
      sessionStorage.removeItem("wattdesk-standalone-theme");
    });
    await page.goto(standaloneURL,{waitUntil:"domcontentloaded"});
    await ready();
    await page.locator(".inverter-settings-window").waitFor();
    assert.equal(await page.locator(".inverter-settings-window").isVisible(),true,"standalone preview opens the shared settings page");
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.standaloneSettings),"true","standalone mode is reflected on the document");
    assert.equal(await page.locator("#home").evaluate(node=>getComputedStyle(node).visibility),"hidden","standalone mode hides the WattDesk shell");
    assert.equal(await page.locator(".target-sidebar").isVisible(),false,"standalone mode exposes no sidebar navigation");
    assert.equal(await page.locator(".isw-close-button").isVisible(),false,"standalone mode exposes no route back to other pages");
    assert.equal(new URL(page.url()).pathname,"/settings","the compact standalone URL remains canonical");
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),"light","standalone mode defaults to light");
    const standaloneTheme=page.getByRole("button",{name:"Switch to dark mode"});
    assert.equal(await standaloneTheme.isVisible(),true,"standalone mode exposes a bottom theme toggle");
    await standaloneTheme.click();
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),"dark","the standalone toggle switches to dark");
    assert.equal(await page.evaluate(()=>sessionStorage.getItem("wattdesk-standalone-theme")),"dark","standalone theme preference is scoped to the tab session");
    assert.equal(await page.getByText("Light mode",{exact:true}).count(),1,"the standalone toggle labels the next action");
    await page.getByRole("button",{name:"Switch to light mode"}).click();
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),"light","the standalone toggle returns to light");
    await page.screenshot({path:"tests/output/inverter-settings-standalone.png"});
    await page.locator('[data-isw-go="limits"]').click();
    await waitForPage("limits");
    await page.locator('[data-isw-seg="limits.basis"] [data-value="1"]').click();
    await page.waitForTimeout(700);
    await page.locator(".isw-actions .wd-button--primary").click();
    await page.waitForTimeout(500);
    await page.locator('[data-isw-go="log"]').click();
    await waitForPage("log");
    assert.match(
      await page.locator(".isw-log-row").first().innerText(),
      /Limit basis[\s\S]*Total[\s\S]*Per phase/,
      "saving limit basis records readable before/after values in the operation log"
    );
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

