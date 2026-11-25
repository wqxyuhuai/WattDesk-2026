const {chromium,launchOptions,previewURL}=require("./runtime.cjs");
const assert=require("node:assert/strict");
const path=require("node:path");
const {pathToFileURL}=require("node:url");

const origin=new URL(previewURL).origin;

async function openVariant(page,variant){
 await page.goto(`${origin}/setup/${variant}`,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await page.locator(".isw-setup-window").waitFor();
 assert.equal(new URL(page.url()).pathname,`/setup/${variant}`);
 assert.equal(await page.locator(".isw-setup-window").getAttribute("data-setup-variant"),variant);
 assert.equal(await page.locator(".isw-setup-step").count(),5,"the fixed setup has five settings steps and no review page");
 assert.equal(await page.locator(".isw-setup-title").textContent(),"Parameter Setup Wizard");
 assert.equal(await page.locator(".isw-setup-series").count(),0,"the removed series summary is not rendered");
 assert.equal(await page.locator(".isw-setup-kicker").count(),0);
 assert.equal(await page.locator(".isw-setup-description").count(),0);
 assert.equal(await page.locator(".isw-setup-progress").count(),0);
 assert.equal(await page.locator(".isw-setup-header").evaluate(node=>getComputedStyle(node).borderBottomWidth),"0px");
 assert.equal(await page.locator(".isw-setup-close").count(),1,"the setup close button stays available");
 const closeGeometry=await page.locator(".isw-setup-dialog").evaluate(dialog=>{
  const close=dialog.querySelector(".isw-setup-close").getBoundingClientRect();
  const box=dialog.getBoundingClientRect();
  return {rightGap:box.right-close.right,topGap:close.top-box.top};
 });
 assert.ok(closeGeometry.rightGap<40&&closeGeometry.topGap<30,"the close button stays in the top-right corner");
 assert.equal(await page.locator(".isw-nav.isw-setup-rail").count(),1,"setup steps reuse the settings sidebar");
 assert.equal(await page.locator(".isw-nav.isw-setup-rail .isw-nav-item").count(),5);
 assert.equal(await page.locator(".isw-nav.isw-setup-rail .isw-nav-value").count(),0,"step rows do not show numeric trailing values");
 assert.equal(await page.locator(".isw-nav.isw-setup-rail .isw-setup-step").nth(1).evaluate(node=>getComputedStyle(node).opacity),"1","future steps stay readable");
 assert.equal(await page.locator(".isw-nav.isw-setup-rail .isw-setup-step").nth(1).getAttribute("aria-disabled"),"true","future steps remain non-interactive");
 assert.equal(await page.locator(".isw-body.wd-main-panel").count(),1,"the right pane uses the settings content surface");
 assert.equal(await page.locator(".isw-title-layer > .isw-page-title").count(),1);
 assert.equal((await page.locator(".isw-setup-page").evaluate(node=>getComputedStyle(node).getPropertyValue("--isw-title-gap").trim())),"9px","the setup title-to-content gap is reduced to half the settings gap");
 assert.equal(await page.locator(".isw-actions").count(),1);
 assert.ok(parseFloat(await page.locator(".isw-content-pane").evaluate(node=>getComputedStyle(node).borderBottomLeftRadius))>0,"the content pane bottom corners stay rounded");
 assert.ok(parseFloat(await page.locator(".isw-actions").evaluate(node=>getComputedStyle(node).borderBottomLeftRadius))>0,"the action bar also carries the rounded bottom corners");
 assert.equal(await page.locator(".isw-setup-dialog .plants-device-dialog-frame").evaluate(node=>getComputedStyle(node).overflow),"hidden","the dialog frame owns the rounded corner clip");
 assert.equal(await page.locator(".isw-setup-window .wd-search-field .wd-search-input").count(),1,"grid search uses the shared search field");
 assert.equal(await page.locator(".isw-setup-page-intro").count(),0,"the grid page no longer repeats introductory copy");
 assert.equal(await page.locator(".isw-setup-group").count(),0,"the grid page no longer adds a second heading");
 assert.match(await page.locator(".isw-setup-profile.is-selected .isw-setup-radio").evaluate(node=>getComputedStyle(node).maskImage),/check-circle\.svg/);
 await page.locator(".isw-setup-profile").nth(0).click();
 await page.waitForTimeout(120);
 assert.equal(await page.locator("[data-setup-profile-list]").count(),1,"selecting a grid profile replaces the list instead of appending a duplicate");
 assert.equal(await page.locator(".isw-setup-search-field").count(),1,"selecting a grid profile keeps one shared search field");
 assert.equal(await page.locator(".isw-setup-profile.is-selected").count(),1,"one grid profile remains selected");
 const search=page.locator(".isw-setup-search-field");
 const searchIdleColor=await search.locator(".wd-search-field-icon").evaluate(node=>getComputedStyle(node).color);
 const searchWidth=await search.evaluate(node=>node.getBoundingClientRect().width);
 await search.hover();
 await page.waitForTimeout(420);
 assert.ok(await search.evaluate((node,idle)=>getComputedStyle(node.querySelector(".wd-search-field-icon")).color!==idle,searchIdleColor),"the search icon darkens on hover");
 assert.ok(await search.evaluate((node,width)=>node.getBoundingClientRect().width>width+0.2,searchWidth),"the shared search field scales on hover");
 await page.mouse.move(5,5);
 const navHeight=await page.locator(".isw-nav.isw-setup-rail .isw-nav-item").first().evaluate(node=>node.getBoundingClientRect().height);
 assert.ok(navHeight>=35&&navHeight<40,"setup navigation stays in the compact settings-row height range");
 const navLayout=await page.locator(".isw-nav.isw-setup-rail").evaluate(nav=>{
  const rows=[...nav.querySelectorAll(".isw-nav-item")].map(node=>node.getBoundingClientRect());
  const future=nav.querySelectorAll(".isw-nav-item")[2];
  const probe=document.createElement("span");
  probe.style.color="var(--wd-label-primary)";
  document.body.append(probe);
  const primary=getComputedStyle(probe).color;
  probe.style.color="var(--wd-label-secondary)";
  const secondary=getComputedStyle(probe).color;
  probe.style.color="var(--wd-label-quaternary)";
  const quaternary=getComputedStyle(probe).color;
  probe.remove();
  return {
   width:nav.getBoundingClientRect().width,
   gap:rows[1].top-rows[0].bottom,
   futureColor:getComputedStyle(future).color,
    futureIconColor:getComputedStyle(future.querySelector(".target-icon-art")).color,
    futureLabelColor:getComputedStyle(future.querySelector(".isw-nav-item-label")).color,
   primary,
    secondary,
    quaternary
  };
 });
 assert.ok(navLayout.width>=270&&navLayout.width<=278,`the setup rail trims a small amount of right gutter ${JSON.stringify(navLayout)}`);
 assert.ok(navLayout.gap>=3.5&&navLayout.gap<=4.5,`setup navigation rows keep the requested spacing ${JSON.stringify(navLayout)}`);
 assert.notEqual(navLayout.futureColor,navLayout.secondary,"future steps use a stronger ink than the secondary label token");
  assert.equal(navLayout.futureIconColor,navLayout.futureLabelColor,"future-step icons use the same readable ink as their labels");
  assert.notEqual(navLayout.futureIconColor,navLayout.quaternary,"future-step icons do not inherit the disabled quaternary token");
 const navGeometry=await page.evaluate(()=>({
  rowRight:document.querySelector(".isw-setup-rail .isw-nav-item").getBoundingClientRect().right,
  paneLeft:document.querySelector(".isw-setup-window .isw-body").getBoundingClientRect().left
 }));
 assert.ok(navGeometry.rowRight<=navGeometry.paneLeft,"setup navigation keeps the settings rail gutter");
 const actionGeometry=await page.locator(".isw-actions").evaluate(node=>{
  const buttons=[...node.querySelectorAll(".wd-button")];
  const back=buttons.find(button=>button.textContent.includes("Back"));
  const next=buttons.find(button=>button.textContent.includes("Next"));
  return {
   backWidth:back.getBoundingClientRect().width,
   nextWidth:next.getBoundingClientRect().width,
   gap:next.getBoundingClientRect().left-back.getBoundingClientRect().right
  };
 });
 assert.ok(actionGeometry.backWidth>90,`Back action width ${JSON.stringify(actionGeometry)}`);
 assert.ok(Math.abs(actionGeometry.backWidth-actionGeometry.nextWidth)<=1,`Actions share the settings width ${JSON.stringify(actionGeometry)}`);
 assert.ok(Math.abs(actionGeometry.gap-8)<=1,`Action gap ${JSON.stringify(actionGeometry)}`);
}

async function next(page,title,{settle=true}={}){
 await page.getByRole("button",{name:"Next",exact:true}).click();
 if(title)await page.waitForFunction(expected=>document.querySelector(".isw-page-title > .isw-title-label:not(.isw-title-label--ghost)")?.textContent===expected,title);
 if(settle)await page.waitForTimeout(340);
}

(async()=>{
 const [{MODES},{requiresBatteryExportConfirmation}]=await Promise.all([
  import(pathToFileURL(path.join(__dirname,"..","src","pages","inverter-settings","settings-model.js")).href),
  import(pathToFileURL(path.join(__dirname,"..","src","pages","inverter-settings","schedule-editor.js")).href)
 ]);
 assert.deepEqual(MODES.map(mode=>mode.wireValue),[0,1,2,3,4,6],"current visible modes keep explicit wire values around Forecast Mode");
 assert.equal(
  requiresBatteryExportConfirmation({previous:"solar_battery",next:"solar_only",runMode:2,economicPeriods:[{mode:"discharge"}]}),
  true,
  "Economic Discharge confirms battery-export removal"
 );
 assert.equal(
  requiresBatteryExportConfirmation({previous:"solar_battery",next:"solar_only",runMode:2,economicPeriods:[{mode:"charge_pv"}]}),
  false,
  "Economic plans without Discharge keep the export-permission change silent"
 );
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 await page.emulateMedia({reducedMotion:"no-preference"});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{
  if(message.type()==="error")errors.push(`${message.text()} @ ${message.location().url||"unknown"}`);
 });
 try{
  await openVariant(page,"20kw");
  assert.equal(await page.locator(".isw-page-title").textContent(),"Grid code");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-grid.png")});
  const scrollBox=await page.locator(".isw-scroll").boundingBox();
  await page.mouse.move(scrollBox.x+scrollBox.width/2,scrollBox.y+scrollBox.height/2);
  await page.mouse.wheel(0,600);
  await page.waitForFunction(()=>document.querySelector(".isw-title-layer")?.classList.contains("is-content-scrolled"));
  const titleBlur=await page.locator(".isw-title-layer").evaluate(layer=>{
   const title=layer.querySelector(".isw-page-title");
   const frame=document.querySelector(".isw-setup-dialog .plants-device-dialog-frame");
   return {
    scrolled:layer.classList.contains("is-content-scrolled"),
    filter:getComputedStyle(title).backdropFilter,
    clipPath:getComputedStyle(frame).clipPath
   };
  });
  assert.equal(titleBlur.scrolled,true);
  assert.notEqual(titleBlur.filter,"none","the fixed page title gains the settings blur after scrolling");
  assert.equal(titleBlur.clipPath,"none","the dialog does not clip away backdrop blur");
  assert.notEqual(await page.locator(".isw-actions").evaluate(node=>getComputedStyle(node).backdropFilter),"none","the settings action bar keeps its live background blur");
  assert.equal(await page.locator(".isw-title-rule").evaluate(node=>node.classList.contains("is-title-rule--visible")),true,"the settings title divider appears after scrolling");
  const dialogBoxBefore=await page.locator(".isw-setup-dialog").boundingBox();
  await next(page,"Battery",{settle:false});
  assert.equal(await page.locator(".isw-page--leaving").count(),1,"step changes reuse the settings crossfade snapshot");
  assert.ok(
   await page.locator(".isw-setup-page.isw-page--incoming").evaluate(node=>node.getAnimations().some(animation=>(animation.effect?.getTiming().duration||0)>0)),
   "the incoming setup page uses the shared page-switch opacity motion"
  );
  assert.equal(await page.locator(".isw-scroll").evaluate(node=>node.scrollTop),0,"a new setup step starts at the top");
  assert.equal(await page.locator(".isw-title-layer").evaluate(node=>node.classList.contains("is-content-scrolled")),false,"the new step clears the previous scrolled title state");
  await page.waitForTimeout(340);
  assert.equal(await page.locator(".isw-page--leaving").count(),0,"the outgoing page snapshot is removed after the shared transition");
  const dialogBoxAfter=await page.locator(".isw-setup-dialog").boundingBox();
  for(const key of ["x","y","width","height"]){
   assert.ok(Math.abs(dialogBoxAfter[key]-dialogBoxBefore[key])<1,`the dialog ${key} must not jump when changing steps`);
  }
  const navCheck=page.locator('[data-setup-step="grid"] .isw-setup-nav-check');
  assert.equal(await navCheck.count(),1,"completed setup steps expose the shared check-circle glyph");
  assert.equal(await navCheck.evaluate(node=>node.tagName.toLowerCase()),"svg","the navigation check stays vector-rendered instead of using a CSS mask");
  assert.equal(await navCheck.evaluate(node=>node.querySelector("path")?.getAttribute("fill")),"currentColor","the navigation check inherits the step ink");
  assert.deepEqual(await navCheck.evaluate(node=>{const box=node.getBoundingClientRect();return [box.width,box.height];}),[16,16]);
  assert.equal(await page.locator(".isw-setup-battery-card:visible").count(),1,"the 20 kW setup has one battery input");
  assert.equal(await page.locator(".isw-setup-battery-card:visible .isw-row-label").filter({hasText:"Battery Protocol"}).count(),1,"the battery input exposes its communication protocol");
  const setupBatteryWidths=await page.evaluate(()=>{
   const card=[...document.querySelectorAll(".isw-setup-battery-card")].find(node=>node.getClientRects().length);
   return {
    brand:card.querySelector(".isw-setup-battery-brand").getBoundingClientRect().width,
    protocol:card.querySelector(".isw-setup-battery-protocol").getBoundingClientRect().width
   };
  });
  assert.ok(Math.abs(setupBatteryWidths.brand-setupBatteryWidths.protocol)<=1,`initialization Battery Protocol matches Battery Brand width ${JSON.stringify(setupBatteryWidths)}`);
  assert.equal(await page.getByRole("switch",{name:"Battery BMS communication"}).getAttribute("aria-checked"),"true","the battery input exposes BMS communication enablement");
  await page.getByRole("switch",{name:"Battery BMS communication"}).click();
  await page.waitForTimeout(40);
  assert.equal(await page.locator(".isw-setup-battery-protocol:visible").isDisabled(),true,"disabling BMS communication locks Battery Protocol");
  await page.getByRole("switch",{name:"Battery BMS communication"}).click();
  await page.waitForTimeout(40);
  assert.equal(await page.locator(".isw-setup-battery-protocol:visible").isDisabled(),false,"re-enabling BMS communication unlocks Battery Protocol");
  assert.equal(await page.locator(".isw-setup-card .isw-setup-card").count(),0,"battery settings are not nested inside a second card");
  assert.ok(await page.locator(".isw-group-title").count()>0,"battery group titles use the shared settings title");
  assert.equal(await page.locator(".isw-setup-page-intro").count(),0,"battery removes the extra page explanation");
  assert.match(await page.locator(".isw-setup-figure-image").getAttribute("src"),/battery-20kw-lcd\.png$/);
  assert.equal(await page.locator(".isw-setup-figure-caption").evaluate(node=>getComputedStyle(node).backgroundColor),"rgba(0, 0, 0, 0)");
  assert.equal(await page.locator(".isw-setup-figure-caption").evaluate(node=>getComputedStyle(node).borderTopWidth),"0px");
  const figureCard=await page.locator(".isw-setup-figure").evaluate(node=>{
   const card=node.closest(".isw-setup-page").querySelector(".isw-setup-card");
   const figureStyle=getComputedStyle(node);
   const cardStyle=getComputedStyle(card);
   const figure=node.getBoundingClientRect();
   const peer=card.getBoundingClientRect();
   return {
    left:figure.left,
    width:figure.width,
    peerLeft:peer.left,
    peerWidth:peer.width,
    background:figureStyle.backgroundColor,
    peerBackground:cardStyle.backgroundColor,
    shadow:figureStyle.boxShadow,
    peerShadow:cardStyle.boxShadow
   };
  });
  assert.ok(Math.abs(figureCard.left-figureCard.peerLeft)<1,`the wiring card aligns to the settings content column ${JSON.stringify(figureCard)}`);
  assert.ok(Math.abs(figureCard.width-figureCard.peerWidth)<1,`the wiring card uses the same full content width ${JSON.stringify(figureCard)}`);
  assert.equal(figureCard.background,figureCard.peerBackground,"the wiring card reuses the same surface as the setting cards");
  assert.equal(figureCard.shadow,figureCard.peerShadow,"the wiring card reuses the shared card shadow");
  const figureCornerAlpha=await page.locator(".isw-setup-figure-image").evaluate(async image=>{
   await image.decode();
   const canvas=document.createElement("canvas");
   canvas.width=image.naturalWidth;
   canvas.height=image.naturalHeight;
   const context=canvas.getContext("2d");
   context.drawImage(image,0,0);
   return context.getImageData(0,0,1,1).data[3];
  });
  assert.equal(figureCornerAlpha,0,"wiring illustrations expose a transparent background");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-battery.png")});
  await next(page,"MPPT input");
  assert.equal(await page.locator(".isw-setup-segmented .wd-segmented-control").count(),4,"the 20 kW setup has four MPPT inputs");
  assert.equal(await page.getByRole("switch",{name:"Parallel MPPT operation"}).count(),1,"the 20 kW setup exposes MPPT parallel configuration");
  const separatorMatch=await page.evaluate(()=>{
   const ruleStyle=getComputedStyle(document.querySelector(".isw-title-rule"));
   const row=document.querySelector(".isw-row + .isw-row");
   const rowStyle=row?getComputedStyle(row,"::after"):null;
   return {
    ruleWidth:ruleStyle.borderTopWidth,
    ruleColor:ruleStyle.borderTopColor,
    rowWidth:rowStyle?.borderTopWidth,
    rowColor:rowStyle?.borderTopColor
   };
  });
  assert.equal(separatorMatch.ruleWidth,"1px","the fixed title rule uses the shared one-pixel border geometry");
  assert.equal(separatorMatch.ruleWidth,separatorMatch.rowWidth,"the title rule matches the row-separator width");
  assert.equal(separatorMatch.ruleColor,separatorMatch.rowColor,"the title rule matches the row-separator colour");
  assert.equal(await page.locator(".isw-setup-segmented .wd-segmented-control-option[aria-selected='true']").first().textContent(),"Solar");
  const segmentedGeometry=await page.locator(".isw-setup-segmented").first().evaluate(node=>{
   const row=node.closest(".isw-setup-row").getBoundingClientRect();
   const control=node.querySelector(".wd-segmented-control").getBoundingClientRect();
   return {width:control.width,rightGap:row.right-control.right};
  });
  assert.ok(segmentedGeometry.width<260,`MPPT input selection stays content-sized ${JSON.stringify(segmentedGeometry)}`);
  assert.ok(segmentedGeometry.rightGap<30,`MPPT input selection stays aligned to the shared row edge ${JSON.stringify(segmentedGeometry)}`);
  const trackerPanel=page.locator(".isw-setup-mppt-panel");
  const trackerHeightBefore=await trackerPanel.evaluate(node=>node.getBoundingClientRect().height);
  await page.getByRole("switch",{name:"Parallel MPPT operation"}).click();
  await page.waitForTimeout(30);
  const trackerGrowth=await trackerPanel.evaluate(node=>({
   height:node.getBoundingClientRect().height,
   animations:node.getAnimations().map(animation=>animation.effect?.getTiming().duration||0)
  }));
  assert.ok(trackerGrowth.animations.some(duration=>duration>0),"the MPPT switch uses the shared content-growth animation");
  assert.ok(trackerGrowth.height>trackerHeightBefore+0.5,`the Tracker card grows instead of snapping open ${JSON.stringify({trackerHeightBefore,...trackerGrowth})}`);
  await page.waitForFunction(()=>document.querySelector(".isw-setup-mppt-groups")?.hidden===false);
  const groupPicker=page.locator(".isw-mppt-picker-popover");
  await groupPicker.waitFor();
  assert.equal(await groupPicker.locator(".isw-mppt-picker-option").count(),4,"the setup wizard uses the shared two-MPPT picker");
  assert.equal(await groupPicker.getByRole("button",{name:"Save"}).isDisabled(),true,"the group Save action waits for two MPPTs");
  await groupPicker.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.waitForFunction(()=>document.querySelector(".isw-mppt-group-error"));
  await page.getByRole("button",{name:"Next",exact:true}).click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator(".isw-page-title > .isw-title-label:not(.isw-title-label--ghost)").textContent(),"MPPT input","an ungrouped parallel configuration cannot advance");
  assert.equal(await page.locator(".isw-setup-error-banner").count(),0,"the MPPT editor owns the required-group error");
  assert.equal(await page.locator(".isw-mppt-group-error").textContent(),"At least one MPPT Group must be created");
  await page.locator('[data-isw-mppt-group-select="draft"]').click();
  await page.locator(".isw-mppt-picker-popover").waitFor();
  await groupPicker.locator('[data-isw-mppt-picker-index="0"]').click();
  await groupPicker.locator('[data-isw-mppt-picker-index="1"]').click();
  await groupPicker.getByRole("button",{name:"Save"}).click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-mppt-group-select").length===1);
  assert.deepEqual(await page.locator(".isw-mppt-group-select > .wd-select-value").allTextContents(),["MPPT #1 & #2"]);
  await page.locator("[data-isw-mppt-add]").click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-mppt-group-select").length===2);
  assert.deepEqual(
   await page.locator(".isw-mppt-group-select > .wd-select-value").allTextContents(),
   ["MPPT #1 & #2","MPPT #3 & #4"],
   "the remaining pair is completed through the same shared group editor"
  );
  assert.equal(await page.locator(".isw-setup-mppt-panel").count(),1,"Tracker owns one grouped settings card");
  assert.equal(await page.locator(".isw-setup-mppt-panel .wd-switch").count(),1,"the Tracker card contains the parallel switch");
  assert.equal(await page.locator(".isw-setup-mppt-panel .isw-mppt-group-row").count(),2,"the Tracker card contains all group rows");
  const switchAlignment=await page.locator(".isw-setup-mppt-panel").evaluate(panel=>{
   const row=panel.querySelector(".isw-setup-row");
   const title=row.querySelector(".isw-setup-row-label").getBoundingClientRect();
   const toggle=row.querySelector(".wd-switch").getBoundingClientRect();
   return {delta:Math.abs((title.top+title.height/2)-(toggle.top+toggle.height/2))};
  });
  assert.ok(switchAlignment.delta<2,`the parallel switch stays aligned to the row title ${JSON.stringify(switchAlignment)}`);
  await page.waitForTimeout(420);
  assert.match(await page.locator(".isw-setup-figure-image").getAttribute("src"),/pv-20kw-lcd\.png$/);
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-mppt.png")});
  await next(page,"Import & export limits");
  assert.equal(await page.locator('[data-setup-limit-permission="export"]').count(),1,"Export permissions are available when export limit is enabled");
  assert.equal(await page.locator('[data-setup-limit-permission="import"]').isVisible(),false,"Import permissions stay hidden until import limit is enabled");
  await page.getByRole("switch",{name:"Import limit"}).click();
  await page.waitForTimeout(30);
  const importGrowth=await page.locator(".isw-setup-card").first().evaluate(node=>({
   animations:node.getAnimations().map(animation=>animation.effect?.getTiming().duration||0)
  }));
  assert.ok(importGrowth.animations.some(duration=>duration>0),"conditional power-limit rows use the shared content-growth animation");
  await page.waitForTimeout(340);
  assert.equal(await page.locator('[data-setup-limit-permission="import"]').isVisible(),true,"Import permissions appear with the import limit");
  await next(page,"Running mode");
  const compactHeight=await page.locator('[data-setup-mode="2"]').evaluate(node=>node.getBoundingClientRect().height);
  await page.locator('[data-setup-mode="2"]').click();
  await page.waitForTimeout(40);
  const modeMotion=await page.locator('[data-setup-mode="2"]').evaluate(node=>({
   animations:node.getAnimations().map(animation=>animation.effect?.getTiming().duration||0),
   height:node.getBoundingClientRect().height
  }));
  assert.ok(modeMotion.animations.some(duration=>duration>0),"Running mode keeps the shared card-growth animation");
  assert.ok(modeMotion.height>compactHeight+0.5,`the selected mode card grows from its compact state ${JSON.stringify({compactHeight,...modeMotion})}`);
  await page.waitForTimeout(360);
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-mode.png")});
  assert.equal(await page.locator(".isw-setup-step").count(),6,"Economic mode adds a schedule step without a review page");
  await next(page,"Economic schedule");
  assert.equal(await page.locator(".isw-eco-row .isw-eco-time-range-input").first().inputValue(),"00:00 – 05:00");
  assert.equal(await page.locator(".isw-eco-table").count(),1,"the schedule reuses the settings Economic table");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-schedule.png")});
  await page.locator('[data-setup-step="limits"]').click();
  await page.waitForFunction(()=>document.querySelector(".isw-page-title > .isw-title-label:not(.isw-title-label--ghost)")?.textContent==="Import & export limits");
  await page.waitForTimeout(340);
  await page.locator('[data-setup-limit-permission="export"]').click();
  await page.getByRole("option",{name:"Solar Only",exact:true}).click();
  const exportWarning=page.getByText("Disable battery export?",{exact:true});
  await exportWarning.waitFor();
  assert.match(await page.locator('.plants-device-modal:has-text("Disable battery export?")').innerText(),/Economic Mode currently contains a Discharge period/i);
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.locator('.plants-device-modal:has-text("Disable battery export?")').waitFor({state:"detached"});
  assert.equal(await page.locator('[data-setup-limit-permission="export"] .wd-select-value').textContent(),"Solar and Battery","canceling keeps the previous export permission");
  await page.locator('[data-setup-limit-permission="export"]').click();
  await page.getByRole("option",{name:"Solar Only",exact:true}).click();
  await exportWarning.waitFor();
  await page.keyboard.press("Escape");
  await page.locator('.plants-device-modal:has-text("Disable battery export?")').waitFor({state:"detached"});
  assert.equal(await page.locator('[data-setup-limit-permission="export"] .wd-select-value').textContent(),"Solar and Battery","dismissing the export warning restores the previous permission");
  await page.locator('[data-setup-limit-permission="export"]').click();
  await page.getByRole("option",{name:"Solar Only",exact:true}).click();
  await exportWarning.waitFor();
  await page.locator('.plants-device-modal:has-text("Disable battery export?") .wd-modal-backdrop').click({position:{x:8,y:8}});
  await page.locator('.plants-device-modal:has-text("Disable battery export?")').waitFor({state:"detached"});
  assert.equal(await page.locator('[data-setup-limit-permission="export"] .wd-select-value').textContent(),"Solar and Battery","clicking outside the export warning restores the previous permission");
  await page.locator('[data-setup-limit-permission="export"]').click();
  await page.getByRole("option",{name:"Solar Only",exact:true}).click();
  await exportWarning.waitFor();
  await page.getByRole("button",{name:"Continue",exact:true}).click();
  await page.locator('.plants-device-modal:has-text("Disable battery export?")').waitFor({state:"detached"});
  assert.equal(await page.locator('[data-setup-limit-permission="export"] .wd-select-value').textContent(),"Solar Only","continuing commits the export permission");
  await page.locator('[data-setup-step="schedule"]').click();
  await page.waitForFunction(()=>document.querySelector(".isw-page-title > .isw-title-label:not(.isw-title-label--ghost)")?.textContent==="Economic schedule");
  await page.waitForTimeout(340);
  assert.equal(await page.getByRole("button",{name:"Apply and start system"}).count(),1,"the final settings step owns the Apply action");
  const ecoFirstRange=page.locator(".isw-eco-row").first().locator(".isw-eco-time-range-input");
  await ecoFirstRange.fill("00002000");
  await ecoFirstRange.blur();
  await page.getByRole("button",{name:"Apply and start system"}).click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator(".isw-eco-row").first().locator(".isw-field-errors").textContent(),"Time ranges cannot overlap.");
  const ecoErrorGeometry=await page.locator(".isw-eco-row").first().evaluate(row=>{
   const field=row.querySelector(".isw-eco-time-range-field").getBoundingClientRect();
   const error=row.querySelector(".isw-field-errors").getBoundingClientRect();
   return {leftDelta:Math.abs(error.left-field.left),verticalGap:error.top-field.bottom};
  });
  assert.ok(ecoErrorGeometry.leftDelta<=11,`the Economic error aligns to its time field ${JSON.stringify(ecoErrorGeometry)}`);
  assert.ok(ecoErrorGeometry.verticalGap<=4,`the Economic error sits directly below its field ${JSON.stringify(ecoErrorGeometry)}`);
  await ecoFirstRange.fill("00000500");
  await ecoFirstRange.blur();
  await page.waitForFunction(()=>!document.querySelector(".isw-eco-row .isw-field-errors"));
  await page.getByRole("button",{name:"Apply and start system"}).click();
  await page.waitForFunction(()=>document.querySelector(".isw-setup-window")?.dataset.setupComplete==="true");
  assert.equal(await page.locator(".isw-setup-success-title").textContent(),"Initialization Complete");
  assert.equal(await page.locator('[data-setup-step="review"]').count(),0,"the wizard no longer contains a review step");
  assert.equal(await page.locator(".isw-setup-rail").isVisible(),false,"the completed state hides the setup rail");
  assert.equal(await page.locator(".isw-title-layer").isVisible(),false,"the completed state no longer shows the content title");
  assert.equal(await page.locator(".isw-actions .wd-button").textContent(),"Close (3s)");
  assert.equal(await page.locator(".isw-setup-title").isVisible(),false,"the completed state hides the wizard header title");
  const completeButton=await page.locator(".isw-actions .wd-button").evaluate(node=>({
   classes:node.className,
   width:node.getBoundingClientRect().width,
   background:getComputedStyle(node).backgroundColor
  }));
  assert.match(completeButton.classes,/wd-button--neutral/,"the completion action uses the default shared neutral button");
  assert.ok(completeButton.width>=99&&completeButton.width<=101,`the completion action keeps the shared button width ${JSON.stringify(completeButton)}`);
  const completeSurface=await page.evaluate(()=>({
   bodyBackground:getComputedStyle(document.querySelector(".isw-setup-window .isw-body")).backgroundColor,
   bodyShadow:getComputedStyle(document.querySelector(".isw-setup-window .isw-body")).boxShadow,
   markBackground:getComputedStyle(document.querySelector(".isw-setup-success-mark")).backgroundColor,
   markShadow:getComputedStyle(document.querySelector(".isw-setup-success-mark")).boxShadow,
   markSize:getComputedStyle(document.querySelector(".isw-setup-success-mark")).width,
   markMask:getComputedStyle(document.querySelector(".isw-setup-success-icon")).maskImage,
   bodyOutline:getComputedStyle(document.querySelector(".isw-setup-window .isw-body"),"::after").display,
   contentTransform:getComputedStyle(document.querySelector(".isw-setup-success")).translate,
   titleSize:getComputedStyle(document.querySelector(".isw-setup-success-title")).fontSize,
   copySize:getComputedStyle(document.querySelector(".isw-setup-success-copy")).fontSize,
   actionBorder:getComputedStyle(document.querySelector(".isw-actions")).borderTopWidth,
   actionBlur:getComputedStyle(document.querySelector(".isw-actions")).backdropFilter,
   actionTranslate:getComputedStyle(document.querySelector(".isw-actions .wd-button")).translate,
   glassLayers:document.querySelectorAll(".isw-actions .wd-button .wd-glass-material").length
  }));
  assert.equal(completeSurface.bodyBackground,"rgba(0, 0, 0, 0)","the completion state removes the white content rectangle");
  assert.equal(completeSurface.bodyShadow,"none");
  assert.equal(completeSurface.markBackground,"rgba(0, 0, 0, 0)","the completion icon has no circular background");
  assert.equal(completeSurface.markShadow,"none","the completion icon has no reflection or shadow");
  assert.equal(completeSurface.markSize,"52px");
  assert.match(completeSurface.markMask,/check-circle\.svg/,"the success glyph is the black circular check icon");
  assert.equal(completeSurface.bodyOutline,"none","the completed content has no dark-mode inner outline");
  assert.notEqual(completeSurface.contentTransform,"none","the completion content is nudged upward");
  assert.equal(completeSurface.titleSize,"20px");
  assert.equal(completeSurface.copySize,"15px");
  assert.equal(completeSurface.actionBorder,"0px","the completed action bar has no top divider");
  assert.equal(completeSurface.actionBlur,"none","the completed action bar has no separate blur band");
  assert.notEqual(completeSurface.actionTranslate,"none","the completed action is nudged upward");
  assert.ok(completeSurface.glassLayers>0,"the completion action uses the shared Glass Surface");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-20kw-complete.png")});
  await page.locator(".isw-setup-window").waitFor({state:"detached",timeout:5000});
  assert.equal(new URL(page.url()).pathname,"/settings","the completion countdown closes the wizard through the shared settings return route");

  await openVariant(page,"50kw");
  await next(page,"Battery");
  assert.equal(await page.locator(".isw-setup-battery-card:visible").count(),2,"the 50 kW setup has two battery inputs");
  assert.match(await page.locator(".isw-setup-figure-image").getAttribute("src"),/battery-50kw-no-screen\.png$/);
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-50kw-battery.png")});
  const batteryPageBefore=await page.locator(".isw-setup-page").evaluate(node=>node.getBoundingClientRect().height);
  await page.getByRole("switch",{name:"Parallel battery operation"}).click();
  await page.waitForTimeout(30);
  const batteryGrowth=await page.locator(".isw-setup-page").evaluate(node=>({
   height:node.getBoundingClientRect().height,
   animations:node.getAnimations().map(animation=>animation.effect?.getTiming().duration||0)
  }));
  assert.ok(batteryGrowth.animations.some(duration=>duration>0),"Battery topology changes use the shared content-growth animation");
  assert.ok(Math.abs(batteryGrowth.height-batteryPageBefore)>0.5,"Battery parallel mode reflows the page through the shared grow motion");
  await page.waitForTimeout(340);
  assert.equal(await page.locator(".isw-setup-battery-card:visible").count(),1,"parallel battery mode displays one shared configuration");
  await next(page,"MPPT input");
  assert.equal(await page.locator(".isw-setup-segmented .wd-segmented-control").count(),4,"the 50 kW setup has four MPPT inputs");
  assert.equal(await page.getByRole("switch",{name:"Parallel MPPT operation"}).count(),1,"the 50 kW setup exposes MPPT parallel configuration");
  await page.getByRole("switch",{name:"Parallel MPPT operation"}).click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-mppt-group-select").length===1);
  assert.deepEqual(await page.locator(".isw-mppt-group-select > .wd-select-value").allTextContents(),["MPPT #1 & #2"]);
  await page.locator("[data-isw-mppt-add]").click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-mppt-group-select").length===2);
  assert.deepEqual(
   await page.locator(".isw-mppt-group-select > .wd-select-value").allTextContents(),
   ["MPPT #1 & #2","MPPT #3 & #4"],
   "the 50 kW fixture uses the same shared grouping controls"
  );
  assert.match(await page.locator(".isw-setup-figure-image").getAttribute("src"),/pv-50kw-no-screen\.png$/);
  await page.locator(".isw-setup-figure-image").last().waitFor();
  await page.waitForFunction(()=>document.querySelector(".isw-setup-figure-image")?.complete===true);
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-50kw-mppt.png")});
  await next(page,"Import & export limits");
  await next(page,"Running mode");
  await page.locator('[data-setup-mode="4"]').click();
  await next(page,"ToU schedule");
  assert.equal(await page.locator(".isw-tou-table").count(),1,"ToU setup reuses the settings ToU table");
  assert.equal(await page.locator(".isw-tou-row").count(),2,"the starter ToU plan stays editable");
  assert.equal(await page.locator(".isw-tou-overview").count(),1,"ToU setup restores the shared 24h Overview");
  assert.equal(await page.locator(".isw-tou-info").count(),1,"ToU setup restores the shared power-limit information control");
  assert.equal(await page.locator(".isw-tou-add").count(),1,"ToU setup restores the circular add action");
  assert.deepEqual(
   await page.locator(".isw-eco-legend > span").allTextContents(),
   ["General Mode","Battery Discharge"],
   "the overview legend only lists modes used by the current plan"
  );
  assert.equal(await page.locator(".isw-tou-row").first().locator(".isw-tou-power-value input").count(),0,"General Mode keeps the shared empty battery-power column");
  assert.equal(await page.locator(".isw-tou-row").nth(1).locator(".isw-tou-power-value input").count(),1,"Battery Discharge keeps the shared power-limit input");
  await page.locator(".isw-tou-row").nth(1).locator(".wd-select-trigger").click();
  await page.getByRole("option",{name:"Battery Charge",exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-tou-row .isw-tou-pv-value .wd-switch").length===1);
  assert.equal(await page.locator(".isw-tou-row .isw-tou-pv-value .wd-switch").count(),1,"PV forbidden appears for Battery Charge");
  const pvHeaderSwitchLeft=await page.locator(".isw-tou-table-head").evaluate(head=>{
   const header=head.children[3].getBoundingClientRect();
   const toggle=document.querySelector('.isw-tou-row:nth-child(2) .isw-tou-pv-value .wd-switch').getBoundingClientRect();
   return {header:header.left,toggle:toggle.left};
  });
  assert.ok(Math.abs(pvHeaderSwitchLeft.header-pvHeaderSwitchLeft.toggle)<1,`the PV switch aligns to its column title ${JSON.stringify(pvHeaderSwitchLeft)}`);
  await page.locator(".isw-tou-add").click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-tou-row").length===3);
  const addedRange=page.locator(".isw-tou-row").last().locator(".isw-eco-time-range-input");
  await addedRange.fill("07000800");
  await addedRange.blur();
  await page.waitForFunction(()=>[...document.querySelectorAll(".isw-tou-row .isw-eco-time-range-input")].map(input=>input.value).join("|")==="00:00 – 06:00|07:00 – 08:00|18:00 – 22:00");
  assert.deepEqual(
   await page.locator(".isw-tou-row .isw-eco-time-range-input").evaluateAll(inputs=>inputs.map(input=>input.value)),
   ["00:00 – 06:00","07:00 – 08:00","18:00 – 22:00"],
   "committing a time range automatically reorders the plan by start time"
  );
  await page.locator(".isw-tou-row").last().locator(".isw-tou-more").click();
  const deleteRow=page.locator(".isw-eco-popover .isw-eco-delete-row");
  await deleteRow.waitFor();
  assert.equal(await deleteRow.evaluate(node=>node.classList.contains("is-danger")),true,"the shared row menu uses the danger delete treatment");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-50kw-tou.png")});
  await deleteRow.click();
  await page.getByRole("button",{name:"Delete",exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll(".isw-tou-row").length===2);
  assert.deepEqual(
   await page.locator(".isw-tou-row .isw-eco-time-range-input").evaluateAll(inputs=>inputs.map(input=>input.value)),
   ["00:00 – 06:00","07:00 – 08:00"],
   "confirming Delete removes only the selected schedule row"
  );
  const firstRange=page.locator(".isw-tou-row").first().locator(".isw-eco-time-range-input");
  await firstRange.fill("05002000");
  await firstRange.blur();
  await page.getByRole("button",{name:"Apply and start system"}).click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator(".isw-page-title").textContent(),"ToU schedule","invalid schedule drafts cannot leave the step");
  assert.equal(await page.locator(".isw-setup-error-banner").count(),0,"schedule errors stay inside the form instead of the page header");
  assert.equal(await page.locator(".isw-tou-row").first().locator(".isw-field-errors").textContent(),"Time ranges cannot overlap.");
  const errorGeometry=await page.locator(".isw-tou-row").first().evaluate(row=>{
   const field=row.querySelector(".isw-eco-time-range-field").getBoundingClientRect();
   const error=row.querySelector(".isw-field-errors").getBoundingClientRect();
   return {leftDelta:Math.abs(error.left-field.left),verticalGap:error.top-field.bottom};
  });
  assert.ok(errorGeometry.leftDelta<=11,`the error aligns to its corresponding time field ${JSON.stringify(errorGeometry)}`);
  assert.ok(errorGeometry.verticalGap<=4,`the error sits directly below the corresponding field ${JSON.stringify(errorGeometry)}`);
  await firstRange.fill("00000600");
  await firstRange.blur();
  await page.waitForFunction(()=>!document.querySelector(".isw-field-errors"));
  const themeBefore=await page.evaluate(()=>document.documentElement.dataset.theme);
  await page.locator(".isw-standalone-theme-control button").click();
  await page.waitForFunction(expected=>document.documentElement.dataset.theme!==expected,themeBefore);
  await page.waitForTimeout(760);
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-50kw-mppt-light.png")});
  for(let remaining=2;remaining>0;remaining-=1){
   await page.locator(".isw-tou-row").first().locator(".isw-tou-more").click();
   await page.locator(".isw-eco-popover .isw-eco-delete-row").click();
   await page.getByRole("button",{name:"Delete",exact:true}).click();
   await page.waitForTimeout(360);
  }
  await page.getByRole("button",{name:"Apply and start system"}).click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator(".isw-page-title").textContent(),"ToU schedule","an empty ToU plan cannot apply");
  assert.equal(await page.locator(".isw-setup-error-banner").count(),0,"the empty-plan error stays inside the schedule table");
  assert.equal(await page.locator(".isw-tou-table .isw-schedule-empty-note").textContent(),"Add at least one schedule period.");
  await page.setViewportSize({width:430,height:900});
  await page.waitForTimeout(120);
  const overflow=await page.locator(".isw-setup-window").evaluate(node=>node.scrollWidth>node.clientWidth+1);
  assert.equal(overflow,false,"the setup preview has no horizontal page overflow on a narrow viewport");
  await page.screenshot({path:path.join(__dirname,"output","verify-initialization-50kw-narrow.png")});
  await page.locator(".isw-tou-add").click();
  const closeRange=page.locator(".isw-tou-row .isw-eco-time-range-input").last();
  await closeRange.fill("00000100");
  await closeRange.blur();
  await page.getByRole("button",{name:"Apply and start system"}).click();
  await page.waitForFunction(()=>document.querySelector(".isw-setup-window")?.dataset.setupComplete==="true");
  await page.locator(".isw-actions .wd-button").click();
  await page.locator(".isw-setup-window").waitFor({state:"detached",timeout:2000});
  assert.equal(new URL(page.url()).pathname,"/settings","the completion Close button exits immediately without waiting for the countdown");
  assert.deepEqual(errors,[],"initialization routes render without console or page errors");
 }finally{
  await browser.close();
 }
})().catch(error=>{
 console.error(error);
 process.exitCode=1;
});
