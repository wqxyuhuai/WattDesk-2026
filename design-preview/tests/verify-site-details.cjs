const {chromium,launchOptions,previewURL}=require("./runtime.cjs");
const assert=require("node:assert/strict");

const origin=new URL(previewURL).origin;
const settle=page=>page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
const pathname=page=>new URL(page.url()).pathname;

async function openSite(page,query="?device=inverter"){
 await page.goto(`${origin}/plants/p25/site${query}`,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await settle(page);
 const currentSection=page.locator('.plants-detail-tab').last();
 await currentSection.hover();
 await page.waitForTimeout(320);
 const tabHoverBounds=await page.evaluate(()=>{
  const list=document.querySelector(".plants-detail-tab-list").getBoundingClientRect();
  const tab=[...document.querySelectorAll('.plants-detail-tab')].at(-1).getBoundingClientRect();
  const style=getComputedStyle(document.querySelector(".plants-detail-tab-list"));
  return{
   top:tab.top-list.top,
   bottom:list.bottom-tab.bottom,
   paddingTop:style.paddingTop,
   paddingBottom:style.paddingBottom
  };
 });
 assert.ok(tabHoverBounds.top>=3&&tabHoverBounds.bottom>=3,"hover scaling and focus outlines stay inside the tab scroller");
 assert.deepEqual([tabHoverBounds.paddingTop,tabHoverBounds.paddingBottom],["8px","8px"],"tab scroller reserves vertical room for control growth");
 await currentSection.screenshot({path:"tests/output/plant-detail-tab-hover.png"});
 await page.mouse.move(0,0);
}

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1677,height:1252}});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("response",response=>{
  if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
 });

 await openSite(page);
 await page.evaluate(()=>localStorage.setItem("wattdesk-home-theme","dark"));
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await settle(page);

 assert.equal(pathname(page),"/plants/p25/site");
 assert.match(page.url(),/device=inverter/);
 assert.equal(await page.locator(".plant-site-details").count(),1,"the Site details view mounts");
 assert.equal(await page.getByText("Local preview · Changes stay in this browser tab and are not synced.",{exact:true}).count(),0,"the page footer preview note is removed");
 const wideColumn=await page.evaluate(()=>{
  const content=document.querySelector(".plant-site-details").getBoundingClientRect();
  const viewport=document.querySelector(".plants-detail-viewport").getBoundingClientRect();
  return {
   width:Math.round(content.width),
   leftGap:Math.round(content.left-viewport.left),
   rightGap:Math.round(viewport.right-content.right)
  };
 });
 assert.equal(wideColumn.width,1000,"wide Site details content fills the shared 1000px column");
 assert.ok(Math.abs(wideColumn.leftGap-wideColumn.rightGap)<=1,"the shared content column is centered in the workspace");
 assert.equal(await page.locator(".plants-detail-tab[aria-current='page']").count(),0,"the hidden legacy Site details route has no public tab selection");
 assert.equal(await page.locator(".plants-detail-tab").nth(1).isDisabled(),false);
 assert.equal(await page.locator(".plants-detail-tab").nth(2).isDisabled(),false);
 assert.deepEqual(
  await page.locator(".site-details-section-title").allTextContents(),
  ["Basic information","Electricity price","Installer contact","Owner information","Visitor management","Plant picture"]
 );
 assert.deepEqual(
  await page.locator(".site-details-column").evaluateAll(columns=>columns.map(column=>[...column.querySelectorAll(".site-details-section-title")].map(title=>title.textContent))),
  [
   ["Basic information","Electricity price","Installer contact"],
   ["Owner information","Visitor management","Plant picture"]
  ],
  "installer details live on the left while owner, visitor and picture details share the right column"
 );
 assert.equal(await page.locator(".site-details-section-title").first().evaluate(title=>getComputedStyle(title).fontSize),"15px","module headings use the larger settings title scale");
 assert.equal(await page.locator(".site-details-section-card.wd-discussion-card").count(),6,"every information group reuses the shared card surface");
 assert.equal(await page.locator(".site-details-section-card.wd-glass").count(),0,"static information cards do not use glass");
 assert.equal(await page.locator(".site-details-grid").evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(" ").length),2,"desktop uses the two-column information layout");
 assert.equal(
  await page.locator(".site-details-grid").evaluate(grid=>{
   const [first,second]=getComputedStyle(grid).gridTemplateColumns.split(" ").map(Number.parseFloat);
   return Math.abs(first-second)<1;
  }),
  true,
  "the two desktop columns are equal width"
 );
 assert.deepEqual(
  await page.locator(".site-details-section-card").first().evaluate(card=>{
   const style=getComputedStyle(card);
   return {border:style.borderTopWidth,shadow:style.boxShadow};
  }),
  {border:"0px",shadow:"none"},
  "module cards have no outline or elevation"
 );
 assert.deepEqual(
  await page.locator(".site-details-value").evaluateAll(values=>[...new Set(values.map(value=>getComputedStyle(value).fontSize))]),
  ["14px"],
  "all regular values use the same type size"
 );
 assert.equal(await page.locator(".site-details-value.is-mono").count()>0,true,"technical values retain tabular number treatment within the shared type scale");
 assert.match(await page.locator("#site-owner-information").innerText(),/Carl Wang/);
 assert.equal(await page.getByText("Plant ID",{exact:true}).count(),0,"the internal Plant ID row is removed");
 assert.equal(
  await page.locator("#site-owner-information").evaluate(section=>{
   const title=section.querySelector(".site-details-section-title").getBoundingClientRect();
   const action=section.querySelector(".site-details-new-owner").getBoundingClientRect();
   const card=section.querySelector(".site-details-section-card").getBoundingClientRect();
   return Math.abs((title.top+title.height/2)-(action.top+action.height/2))<1&&action.bottom<=card.top;
  }),
  true,
  "New owner sits in the Owner information section header"
 );
 assert.match(await page.locator("#site-installer-contact").innerText(),/Alarm email notification/);
 assert.match(await page.locator("#site-visitor-management").innerText(),/No visitors/);
 assert.ok(
  await page.locator("#site-visitor-management .site-details-visitor").evaluate(empty=>empty.getBoundingClientRect().height<=92),
  "the empty visitor card is compact instead of reserving a large blank panel"
 );
 assert.equal(
  await page.locator(".site-details-visitor-note").isVisible(),
  true,
  "the local development preview explains that visitor invitations are not connected"
 );

 assert.equal(await page.locator(".site-details-page-title").innerText(),"Wärmeverbund Nord","the page heading is the plant name");
 assert.equal(await page.getByText("Manage plant profile, pricing, ownership and service contacts.",{exact:true}).count(),0,"the page description copy is removed");
 assert.equal(await page.locator("#site-basic-information").getByText("Plant name",{exact:true}).count(),0,"the duplicate Plant name row is removed from Basic information");
 assert.equal(await page.locator(".site-details-page-actions .site-details-edit.wd-glass").count(),1,"Edit lives inside the page and uses glass");
 const readStableGeometry=()=>page.evaluate(()=>({
  cards:[...document.querySelectorAll(".site-details-section-card")].map(card=>{
   const rect=card.getBoundingClientRect();
   return {top:Number(rect.top.toFixed(2)),left:Number(rect.left.toFixed(2)),width:Number(rect.width.toFixed(2))};
  }),
  rows:[...document.querySelectorAll("#site-basic-information .site-details-row")].map(row=>{
   const value=row.lastElementChild.getBoundingClientRect();
   const rect=row.getBoundingClientRect();
   return {
    height:Number(rect.height.toFixed(2)),
    right:Number(value.right.toFixed(2)),
    controlLeft:Number(value.left.toFixed(2)),
    controlWidth:Number(value.width.toFixed(2))
   };
  })
 }));
 const viewGeometry=await readStableGeometry();
 await page.getByRole("button",{name:"Edit",exact:true}).click();
 await settle(page);
 const editGeometry=await readStableGeometry();
 assert.deepEqual(editGeometry.cards,viewGeometry.cards,"entering edit mode must not move or resize any module card");
 assert.deepEqual(editGeometry.rows.map(row=>({right:row.right,controlLeft:row.controlLeft,controlWidth:row.controlWidth})),viewGeometry.rows.map(row=>({right:row.right,controlLeft:row.controlLeft,controlWidth:row.controlWidth})),"view and edit values retain the same right-side geometry");
 assert.equal(new Set(editGeometry.rows.map(row=>row.height)).size,1,"edit rows keep one stable height");
 assert.equal(editGeometry.rows[0].height,viewGeometry.rows[0].height,"edit rows do not grow relative to view rows");
 const titleEditor=page.locator("#site-details-plantName");
 assert.equal(await titleEditor.evaluate(input=>getComputedStyle(input).fontSize),"20px","the inline plant title keeps the title type scale");
 const initialTitleBox=await titleEditor.boundingBox();
 assert.ok(initialTitleBox.height>=44,"the title editor starts with a taller editing area");
 assert.ok(initialTitleBox.width>600,"the horizontal title editing area expands across the title column");
 await titleEditor.fill("Wärmeverbund Nord — a very long plant name that must wrap onto additional lines instead of clipping horizontally");
 await settle(page);
 const wrappedTitleBox=await titleEditor.boundingBox();
 assert.ok(wrappedTitleBox.height>initialTitleBox.height,"long plant names grow the title editor downward");
 await titleEditor.fill("Wärmeverbund Nord");
 assert.equal(await page.locator(".plants-detail-viewport").evaluate(viewport=>getComputedStyle(viewport).scrollbarWidth),"none","the detail viewport hides the native scrollbar");
 const needsSharedScroll=await page.locator(".plants-detail-viewport").evaluate(viewport=>viewport.scrollHeight>viewport.clientHeight+1);
 if(needsSharedScroll){
  await page.waitForFunction(()=>{
   const track=document.querySelector(".plants-detail > .wd-scroll-feedback");
   return Boolean(track&&!track.hidden);
  });
  assert.equal(await page.locator(".plants-detail > .wd-scroll-feedback").isVisible(),true,"overflowing edit content uses the shared scroll feedback");
 }else{
  assert.equal(await page.locator(".plants-detail > .wd-scroll-feedback").isVisible(),false,"the shared scroll rail stays hidden when the page fits");
 }
 const nameFocusStyle=await page.locator("#site-details-address").evaluate(input=>{
  const idle=getComputedStyle(input);
  const idleBackground=idle.backgroundColor;
  input.focus();
  const focused=getComputedStyle(input);
  return {
   idleBackground,
   focusedBackground:focused.backgroundColor,
   outlineColor:focused.outlineColor,
   outlineWidth:focused.outlineWidth,
   fontSize:focused.fontSize
  };
 });
 assert.equal(nameFocusStyle.fontSize,"14px","edit fields keep the same type size as view values");
 assert.notEqual(nameFocusStyle.focusedBackground,nameFocusStyle.idleBackground,"focused fields use a brighter neutral fill");
 assert.equal(nameFocusStyle.outlineWidth,"1px","focused fields use a restrained neutral outline");
 assert.notEqual(nameFocusStyle.outlineColor,"rgb(10, 132, 255)","focused fields do not use the blue accent outline");
 assert.equal(await page.getByRole("button",{name:"Cancel",exact:true}).count(),1);
 assert.equal(await page.getByRole("button",{name:"Save changes",exact:true}).isEnabled(),true,"Save changes keeps the same active anatomy as date Apply");
 assert.equal(await page.locator(".site-details-save.wd-button--primary.wd-glass").count(),1,"Save changes uses the shared blue glass primary button");
 assert.equal(await page.locator(".site-details-save .target-icon-art,.site-details-save [class*='icon']").count(),0,"Save changes matches the text-only date Apply button anatomy");
 assert.equal(await page.locator(".site-details-save").evaluate(button=>button.classList.contains("wd-control-state")),false,"Save changes uses the exact date Apply button class path");
 const sharedSelectMaterials=await page.locator(".site-details-select-trigger").evaluateAll(nodes=>nodes.map(node=>({
  glass:node.classList.contains("wd-glass"),
  materials:node.querySelectorAll(":scope>.wd-glass-material").length,
  blur:getComputedStyle(node).backdropFilter,
  background:getComputedStyle(node).backgroundColor,
  shadow:getComputedStyle(node).boxShadow
 })));
 assert.equal(sharedSelectMaterials.length,5,"all Site details select fields share the same blurred surface");
 assert.equal(sharedSelectMaterials.every(item=>!item.glass&&item.materials===0),true,"select fields avoid the full glass highlight material");
 assert.equal(sharedSelectMaterials.every(item=>/blur\(14px\)/i.test(item.blur)),true,"select fields use the shared Gaussian-blurred grey surface");
 assert.equal(sharedSelectMaterials.every(item=>item.background!=="rgba(0, 0, 0, 0)"),true,"select fields retain a shallow grey fill");
 assert.equal(sharedSelectMaterials.every(item=>item.shadow==="none"),true,"select fields add no glow or shadow");
 assert.equal(await page.locator(".site-details-danger").count(),1,"Delete plant only appears in edit mode");
 assert.notEqual(await page.locator(".site-details-danger").evaluate(section=>getComputedStyle(section).backgroundColor),"rgba(0, 0, 0, 0)","the danger zone carries a pale red surface");
 assert.equal(
  await page.locator(".site-details-danger").evaluate((danger,gridSelector)=>{
   const grid=danger.closest(gridSelector);
   const dangerBox=danger.getBoundingClientRect(),gridBox=grid.getBoundingClientRect();
   return Math.abs(dangerBox.left-gridBox.left)<=1&&Math.abs(dangerBox.width-gridBox.width)<=1;
  },".site-details-grid"),
  true,
  "Danger zone spans the full content grid beneath both columns"
 );
 assert.equal(await page.locator(".site-details-row--wide").count(),4,"long address and contact fields use the wide value column");
 assert.ok(
  await page.locator("#site-details-installerCompany").evaluate(input=>input.getBoundingClientRect().width>=260),
  "the installer company field is wide enough to show the full company name"
 );
 assert.deepEqual(
  await page.locator(".site-details-delete").evaluate(button=>({
   primary:button.classList.contains("wd-button--primary"),
   pill:button.classList.contains("wd-button--pill"),
   controlState:button.classList.contains("wd-control-state"),
   color:getComputedStyle(button).color
  })),
  {primary:true,pill:true,controlState:false,color:"rgb(255, 255, 255)"},
  "Delete plant reuses the Save changes button path with fixed white text"
 );
 assert.notEqual(
  await page.locator(".site-details-delete .wd-glass-fill").evaluate(surface=>getComputedStyle(surface).backgroundColor),
  "rgba(0, 0, 0, 0)",
  "Delete plant receives its own faint red glass fill"
 );
 const deleteButton=page.locator(".site-details-delete");
 await page.mouse.move(0,0);
 const deleteIdleFill=await deleteButton.locator(".wd-glass-fill").evaluate(surface=>getComputedStyle(surface).backgroundColor);
 await deleteButton.hover();
 await page.waitForTimeout(120);
 const deleteHoverFill=await deleteButton.locator(".wd-glass-fill").evaluate(surface=>getComputedStyle(surface).backgroundColor);
 assert.notEqual(deleteHoverFill,deleteIdleFill,"Delete plant changes brightness on hover");
 assert.doesNotMatch(deleteHoverFill,/0,\s*145,\s*255|0 0\.569 1/,"Delete plant hover remains in the red family");
 await deleteButton.click();
 await settle(page);
 assert.equal(await page.locator(".plants-device-dialog--confirm").count(),1,"Delete plant opens the shared centered confirmation dialog");
 assert.equal(
  await page.locator(".plants-device-dialog--confirm").evaluate(dialog=>dialog.offsetWidth),
  480,
  "Delete plant uses the shared compact confirmation width"
 );
 assert.match(await page.locator(".plants-device-confirm-title").textContent(),/^Delete .+\?$/,"Delete confirmation names the plant");
 assert.match(await page.locator(".plants-device-confirm-description").textContent(),/cannot be undone/i,"Delete confirmation explains the consequence");
 assert.equal(await page.locator(".plants-device-confirm-mark .plants-device-action-icon").count(),1,"Delete confirmation uses the shared danger icon plate");
 assert.equal(await page.locator(".plants-device-confirm-actions .wd-button").count(),2,"Delete confirmation exposes exactly two actions");
 await page.locator(".plants-device-confirm-actions").getByRole("button",{name:"Cancel"}).click();
 await page.waitForFunction(()=>!document.querySelector(".plants-device-modal"));
 await deleteButton.click();
 await settle(page);
 await page.locator(".plants-device-confirm-actions").getByRole("button",{name:"Delete plant"}).click();
 await page.waitForFunction(()=>!document.querySelector(".plants-device-modal"));
 assert.match(await page.locator("#toast").textContent(),/not connected/i,"Delete confirmation keeps the local preview boundary");
 assert.equal(await page.locator("#site-details-pvCapacity").evaluate(input=>getComputedStyle(input).appearance),"textfield","number inputs hide native steppers");
 assert.deepEqual(
  await page.locator(".site-details-input,.site-details-unit,.site-details-select-value").evaluateAll(nodes=>[...new Set(nodes.map(node=>getComputedStyle(node).fontSize))]),
  ["14px"],
  "edit fields, units and select values keep the same type size as view values"
 );
 assert.match(
  await page.locator(".site-details-select-chevron").first().evaluate(icon=>getComputedStyle(icon).getPropertyValue("--icon-mask")),
  /asset-14\.svg/,
  "select arrows reuse the shared forward arrow asset"
 );
 assert.deepEqual(
  await page.locator(".site-details-select-chevron").first().evaluate(icon=>[getComputedStyle(icon).width,getComputedStyle(icon).height]),
  ["14px","14px"],
  "shared select arrows use the enlarged 14px glyph box"
 );
 assert.equal(await page.locator("select").count(),0,"site selects do not use native option popups");
 const plantTypeTrigger=page.getByRole("button",{name:"Plant type",exact:true});
 await plantTypeTrigger.click();
 assert.equal(await page.locator(".site-details-select-popover.wd-glass--surface").count(),1,"select options reuse the shared Glass Surface");
 await plantTypeTrigger.click();
 await page.waitForTimeout(260);
 assert.equal(await page.locator(".site-details-select-popover").count(),0,"the select closes from the same trigger");
 assert.equal(await plantTypeTrigger.getAttribute("aria-expanded"),"false","the select trigger exposes its closed state");
 await plantTypeTrigger.click();
 await page.waitForTimeout(300);
 assert.deepEqual(await page.locator('.site-details-select-popover [role="option"]').allTextContents(),["Heating system","Battery system","Hybrid system"]);
 await page.locator('.site-details-select-popover [role="option"][data-value="Battery system"]').click();
 assert.equal(await page.getByRole("button",{name:"Plant type",exact:true}).getAttribute("data-value"),"Battery system");
 await page.getByRole("button",{name:"Plant type",exact:true}).click();
 await page.locator('.site-details-select-popover [role="option"][data-value="Hybrid system"]').click();
 const ownerMenuTrigger=page.locator(".site-details-owner-menu-trigger").first();
 await ownerMenuTrigger.click();
 await page.waitForTimeout(300);
 assert.equal(await page.locator(".site-details-owner-menu").count(),1,"owner actions open from the owner trigger");
 await ownerMenuTrigger.click();
 await page.waitForTimeout(260);
 assert.equal(await page.locator(".site-details-owner-menu").count(),0,"owner actions close from the same trigger");
 assert.equal(await ownerMenuTrigger.getAttribute("aria-expanded"),"false","the owner trigger exposes its closed state");
 await ownerMenuTrigger.click();
 await page.waitForTimeout(300);
 assert.equal(await page.locator(".site-details-owner-menu").count(),1,"owner actions open again after toggling closed");
 await page.keyboard.press("Escape");
 await page.waitForTimeout(260);
 const alarmSwitch=page.getByRole("switch",{name:"Alarm email notification"});
 assert.equal(await alarmSwitch.count(),1,"Alarm notification uses a real switch");
 assert.equal(await page.locator(".site-details-alarm-switch.wd-glass").count(),1,"the alarm switch uses the shared glass material");
 assert.equal(await alarmSwitch.getAttribute("aria-checked"),"true");
 await alarmSwitch.click();
 assert.equal(await alarmSwitch.getAttribute("aria-checked"),"false","the switch exposes its off state");
 await page.waitForTimeout(520);
 assert.match(
  await alarmSwitch.evaluate(control=>getComputedStyle(control.querySelector(".wd-glass-fill")).backgroundColor),
  /rgba\(120, 120, 128/,
  "the off state keeps the visible neutral fill from the shared glass button material"
 );
 await alarmSwitch.click();
 assert.equal(await alarmSwitch.getAttribute("aria-checked"),"true","the switch returns to its on state");

 const plantName=page.locator("#site-details-plantName");
 await plantName.fill("Wärmeverbund Nord Updated");
 await page.getByRole("button",{name:"Save changes",exact:true}).click();
 await settle(page);
 assert.equal(await page.getByRole("button",{name:"Edit",exact:true}).count(),1);
 assert.equal(await page.locator(".site-details-page-title").innerText(),"Wärmeverbund Nord Updated");
 assert.equal(await page.locator(".site-details-danger").count(),0,"Danger zone is removed outside edit mode");

 await page.locator('.plants-detail-tab[data-section="overview"]').click();
 await settle(page);
 assert.equal(pathname(page),"/plants/p25");
 await page.goBack({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await settle(page);
 assert.equal(pathname(page),"/plants/p25/site");
 assert.equal(await page.locator(".site-details-page-title").innerText(),"Wärmeverbund Nord Updated","saved local values survive an in-session tab switch");

 await page.getByRole("button",{name:"Edit",exact:true}).click();
 await page.locator("#site-details-contactEmail").fill("not-an-email");
 await page.getByRole("button",{name:"Save changes",exact:true}).click();
 await settle(page);
 assert.equal(await page.locator(".site-details-error-summary").isVisible(),true);
 assert.equal(await page.locator("#site-details-contactEmail").getAttribute("aria-invalid"),"true");
 assert.equal(pathname(page),"/plants/p25/site","validation failure stays in edit mode");

 await page.locator("#site-details-contactEmail").fill("service@installer.example");
 await page.locator("#site-details-plantName").fill("Unsaved draft");
 await page.locator('.plants-detail-tab[data-section="site-v2"]').click();
 await settle(page);
 assert.equal(pathname(page),"/plants/p25/site","unsaved changes block tab navigation");
 assert.equal(await page.getByText("Save or cancel the Site details changes before leaving",{exact:true}).count(),1);

 await page.getByRole("button",{name:"Cancel",exact:true}).click();
 await settle(page);
 assert.equal(await page.locator(".plants-device-dialog--confirm").count(),1,"discard confirmation uses the shared dialog");
 await page.locator(".plants-device-confirm-actions").getByRole("button",{name:"Discard changes"}).click();
 await settle(page);
 assert.equal(await page.getByRole("button",{name:"Edit",exact:true}).count(),1);
 assert.equal(await page.locator(".site-details-page-title").innerText(),"Wärmeverbund Nord Updated");

 await page.setViewportSize({width:1180,height:1252});
 await settle(page);
 assert.equal(
  await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),
  0,
  "the single-column breakpoint has no page-level horizontal overflow"
 );
 await page.screenshot({path:"tests/output/site-details-1180-dark.png"});

 await page.setViewportSize({width:420,height:900});
 await settle(page);
 assert.equal(
  await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),
  0,
  "the mobile layout has no page-level horizontal overflow"
 );
 await page.screenshot({path:"tests/output/site-details-mobile-dark.png"});

 await page.setViewportSize({width:1677,height:1252});
 await page.evaluate(()=>localStorage.setItem("wattdesk-home-theme","light"));
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await settle(page);
 assert.equal(await page.locator("html").getAttribute("data-theme"),"light");
 assert.deepEqual(
  await page.locator(".site-details-section-card").evaluateAll(cards=>cards.map(card=>{
   const style=getComputedStyle(card);
   return {background:style.backgroundColor,shadow:style.boxShadow};
  })),
  Array.from({length:6},()=>({background:"rgb(255, 255, 255)",shadow:"none"})),
  "light Site details cards reuse the shared white flat surface"
 );
 await page.screenshot({path:"tests/output/site-details-light.png"});
 assert.deepEqual(errors,[]);

 await browser.close();
 console.log(JSON.stringify({ok:true,errors},null,2));
})().catch(error=>{
 console.error(error);
 process.exitCode=1;
});
