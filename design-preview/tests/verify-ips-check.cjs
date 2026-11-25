const {chromium,launchOptions,previewURL} = require("./runtime.cjs");
const assert = require("node:assert/strict");
const path = require("node:path");

const origin = new URL(previewURL).origin;
const devicesURL = `${origin}/plants/p25/devices?device=inverter&glass=figma`;

(async () => {
 const browser = await chromium.launch({...launchOptions,headless:true});
 const page = await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 await page.emulateMedia({reducedMotion:"no-preference"});
 const errors = [];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{
  if(message.type()==="error")errors.push(`${message.text()} @ ${message.location().url||"unknown"}`);
 });
 const ready = async () => {
  await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 };
 const waitForPageTitle = async title => {
  await page.waitForFunction(expected=>{
   const heading=document.querySelector(".isw-page-title");
   return (heading?.querySelector(".isw-title-label")?.textContent||heading?.textContent||"").trim()===expected;
  },title);
  await page.waitForFunction(()=>!document.querySelector(".isw-page--leaving")&&!document.querySelector(".isw-title-label--ghost"));
 };
 try {
  await page.goto(devicesURL,{waitUntil:"domcontentloaded"});
  await ready();
  await page.getByRole("button",{name:"Open iHybrid settings"}).click();
  await page.locator('.isw-nav-item').filter({hasText:"Grid & Protection"}).click();
  await page.waitForFunction(()=>document.querySelector(".isw-gate-card"));
  const checkCode=(await page.locator(".isw-code-plate").textContent()).match(/\d{4}/)?.[0];
  assert.ok(checkCode,"the local device exposes a four-digit preview Check code");
  for(let index=0;index<checkCode.length;index+=1){
   await page.locator(`[data-isw-code-index="${index}"]`).fill(checkCode[index]);
  }
  await waitForPageTitle("Grid Code");

  const previewProfile=page.locator('[data-isw-profile="it_cei021"]');
  assert.equal(await previewProfile.count(),1,"the local preview exposes IT CEI 0-21 without a certified parameter set");
  assert.match(await previewProfile.textContent(),/Preview only/);
  await previewProfile.click();
  await waitForPageTitle("Grid Code");

  const ipsEntry=page.locator('[data-isw-sub="ips"]');
  assert.equal(await ipsEntry.count(),1,"the selected Italian draft exposes the IPS Check entry");
  assert.deepEqual(
   await page.locator("[data-isw-sub]").allTextContents(),
   ["Grid Code","Protection Limits","Grid Connection","Reactive Power","P(U) Characteristics","Frequency-Watt (F-P)","LVRT","HVRT","IPS Check"],
   "the Italian preview keeps every Grid secondary page and places IPS Check last"
  );
  assert.equal(await ipsEntry.getAttribute("aria-disabled"),"true","the IPS entry remains disabled until the grid code is saved");
  assert.match(await ipsEntry.textContent(),/IPS Check/);
  await ipsEntry.hover();
  await page.waitForFunction(()=>document.querySelector(".isw-hover-popover")?.textContent.includes("Save the grid code"));
  assert.match(await page.locator(".isw-hover-popover").textContent(),/Save the grid code to enable the IPS Check\./);
  await ipsEntry.click({force:true});
  assert.equal(await page.locator(".isw-page-title").textContent(),"Grid Code","the disabled IPS entry cannot open its page");

  await page.getByRole("button",{name:"Save"}).click();
  await page.waitForFunction(()=>document.querySelector('[data-isw-sub="ips"]')?.getAttribute("aria-disabled")!=="true");
  assert.equal(await ipsEntry.getAttribute("aria-disabled"),null,"saving the Italian grid code enables IPS Check");
  assert.equal(await ipsEntry.evaluate(node=>node.classList.contains("is-ips-danger")),true,"required IPS is emphasized before the check passes");

  const gridPageContracts=[
   ["prot","Protection Limits",'[data-isw-number="g.ov1"]'],
   ["conn","Grid Connection",'[data-isw-number="g.rcDelay"]'],
   ["reac","Reactive Power","[data-isw-reac-mode-trigger]"],
   ["pu","P(U) Characteristics",'[data-isw-seg="g.puOn"]'],
   ["fp","Frequency-Watt (F-P)",'[data-isw-switch="g.ofpOn"]'],
   ["lvrt","Low Voltage Ride-Through (LVRT)",'[data-isw-number="g.lv1"]'],
   ["hvrt","High Voltage Ride-Through (HVRT)",'[data-isw-number="g.hv1"]']
  ];
  for(const [sub,title,control] of gridPageContracts){
   await page.locator(`[data-isw-sub="${sub}"]`).click();
   await waitForPageTitle(title);
   assert.equal(await page.getByText(/No certified parameter set ships/).count(),0,`${title} does not fall back to the empty-profile message`);
   assert.equal(await page.locator(control).count(),1,`${title} exposes its editable preview content`);
  }

  await ipsEntry.click();
  await waitForPageTitle("IPS Check");
  assert.equal(await page.locator(".isw-ips-record-entry").count(),0,"the standalone Last self-check helper row is removed");
  assert.equal(await page.getByText("Last self-check",{exact:true}).count(),0);
  assert.equal(await page.getByText("Click to view the last self-check record.",{exact:true}).count(),0);
  assert.equal(await page.locator(".isw-page-title .isw-ips-record-action").count(),1,"the IPS Check Record action lives in the page title row");
  assert.equal(await page.locator("[data-isw-ips-item]").count(),8,"all eight IPS protection items render");
  assert.match(await page.locator(".isw-ips-operation-card").innerText(),/Ready for IPS Check/);
  assert.match(await page.locator(".isw-ips-operation-card").innerText(),/Connected/);
  assert.match(await page.locator(".isw-ips-operation-card").innerText(),/Start IPS Check/);
  const operationMarkInk=await page.locator(".isw-ips-operation-card .isw-ips-operation-mark").evaluate(node=>({
   color:getComputedStyle(node).color,
   secondary:getComputedStyle(node.closest(".isw-ips-operation-card").querySelector(".isw-ips-operation-title p")).color
  }));
  assert.equal(operationMarkInk.color,operationMarkInk.secondary,"the operation-card IPS mark uses neutral secondary ink");
  assert.match(await page.locator("[data-isw-ips-item='overV1']").innerText(),/Trip Limit Set \(V\)[\s\S]*253[\s\S]*Trip Limit Time Set \(s\)[\s\S]*3[\s\S]*Vac \(V\)[\s\S]*230\.1[\s\S]*603000/);
  const gridColumns=await page.locator(".isw-ips-grid").evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(" ").length);
  assert.equal(gridColumns,2,"protection cards use the designed two-column grid on desktop");
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-overview.png")});
  await page.getByTitle("Switch to light mode").evaluate(node=>node.click());
  await page.waitForFunction(()=>document.documentElement.dataset.theme==="light");
  await page.waitForTimeout(760);
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-overview-light.png")});
  await page.getByTitle("Switch to dark mode").evaluate(node=>node.click());
  await page.waitForFunction(()=>document.documentElement.dataset.theme==="dark");
  await page.waitForTimeout(760);
  await page.setViewportSize({width:420,height:900});
  await page.waitForTimeout(120);
  const narrowLayout=await page.evaluate(()=>({
    columns:getComputedStyle(document.querySelector(".isw-ips-grid")).gridTemplateColumns.split(" ").length,
    overflow:document.querySelector(".isw-scroll").scrollWidth>document.querySelector(".isw-scroll").clientWidth+1
  }));
  assert.equal(narrowLayout.columns,1,"IPS protection cards collapse to one column on a narrow viewport");
  assert.equal(narrowLayout.overflow,false,"IPS Check does not create horizontal page scrolling");
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-narrow.png")});
  await page.setViewportSize({width:1545,height:1252});
  await page.waitForTimeout(120);

  await page.getByRole("button",{name:"IPS Check Record"}).click();
  const recordDialog=page.locator(".isw-ips-record-dialog");
  await recordDialog.waitFor();
  await page.waitForTimeout(620);
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-record.png")});
  const recordScrollStart=await page.evaluate(()=>{
   const modal=document.querySelector(".isw-ips-record-dialog");
   const viewport=modal.querySelector(".isw-ips-record-scroll");
   const track=modal.querySelector(".wd-scroll-feedback");
   const cards=[...modal.querySelectorAll("[data-isw-ips-item]")];
   const rect=node=>{
    const box=node.getBoundingClientRect();
    return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:box.height};
   };
   return {
    modal:rect(modal),
    viewport:rect(viewport),
    track:rect(track),
    lastCardBottom:rect(cards.at(-1)).bottom,
    contentPaddingBottom:Number.parseFloat(getComputedStyle(modal.querySelector(".isw-ips-record-content")).paddingBottom),
    nativeScrollbar:viewport.offsetWidth-viewport.clientWidth
   };
  });
  assert.ok(recordScrollStart.modal.bottom-recordScrollStart.viewport.bottom<=1,"the record viewport fills the dialog instead of leaving a fixed bottom band");
  assert.ok(recordScrollStart.track.top>=recordScrollStart.viewport.top-1&&recordScrollStart.track.bottom<=recordScrollStart.viewport.bottom-20,"the scroll rail keeps its inset without crossing the modal edge");
  assert.ok(recordScrollStart.lastCardBottom>recordScrollStart.viewport.bottom,"the record content remains vertically scrollable");
  assert.ok(recordScrollStart.contentPaddingBottom>=20,"the record content keeps a tail gap below the final card row");
  assert.equal(recordScrollStart.nativeScrollbar,0,"the record modal hides the native scrollbar");
  await recordDialog.locator(".isw-ips-record-scroll").evaluate(node=>{
   node.scrollTop=node.scrollHeight;
  });
  await page.waitForTimeout(80);
  const recordScrollEnd=await page.evaluate(()=>{
   const modal=document.querySelector(".isw-ips-record-dialog");
   const viewport=modal.querySelector(".isw-ips-record-scroll");
   const track=modal.querySelector(".wd-scroll-feedback");
   const thumb=modal.querySelector(".wd-scroll-feedback__thumb");
   const cards=[...modal.querySelectorAll("[data-isw-ips-item]")];
   const rect=node=>{
    const box=node.getBoundingClientRect();
    return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:box.height};
   };
   const visibleBottom=rect(viewport).bottom;
   return {
    scrollTop:viewport.scrollTop,
    modalBottom:rect(modal).bottom,
    viewportBottom:visibleBottom,
    trackBottom:rect(track).bottom,
    thumbBottom:rect(thumb).bottom,
    finalCardBottoms:cards.slice(-2).map(card=>rect(card).bottom)
   };
  });
  assert.ok(recordScrollEnd.scrollTop>0,"the record modal scrolls to its final content");
  const recordFinalCardBottom=Math.max(...recordScrollEnd.finalCardBottoms);
  const recordViewportTail=recordScrollEnd.viewportBottom-recordFinalCardBottom;
  const recordModalTail=recordScrollEnd.modalBottom-recordFinalCardBottom;
  assert.ok(recordViewportTail>=20&&recordViewportTail<=24,"the final card row remains fully visible above the viewport edge");
  assert.ok(recordModalTail>=20&&recordModalTail<=24,"the final card row aligns to the modal's shared bottom inset");
  assert.ok(recordScrollEnd.thumbBottom<=recordScrollEnd.trackBottom+1,"the scroll thumb stays inside its rail at the bottom position");
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-record-bottom.png")});
  assert.equal(await recordDialog.locator(".isw-ips-record-overview").count(),1,"the record modal starts with the shared settings-card summary");
  assert.equal(await recordDialog.locator(".isw-ips-record-scroll").count(),1,"the record modal uses a dedicated scroll viewport");
  assert.equal(await recordDialog.locator(".isw-ips-record-content > .isw-group-title").textContent(),"Protection checks");
  const recordMarkInk=await recordDialog.locator(".isw-ips-record-overview .isw-ips-operation-mark").evaluate(node=>({
   color:getComputedStyle(node).color,
   secondary:getComputedStyle(node.closest(".isw-ips-record-overview").querySelector(".isw-ips-record-meta")).color
  }));
  assert.equal(recordMarkInk.color,recordMarkInk.secondary,"the record-summary IPS mark uses neutral secondary ink");
  const recordCardContract=await page.evaluate(()=>{
   const outerPage=document.querySelector(".isw-page:not(.isw-page--leaving)");
   const modal=document.querySelector(".isw-ips-record-dialog");
   const read=card=>({
    background:getComputedStyle(card).backgroundColor,
    radius:getComputedStyle(card).borderRadius,
    shadow:getComputedStyle(card).boxShadow,
    padding:[getComputedStyle(card).paddingTop,getComputedStyle(card).paddingRight,getComputedStyle(card).paddingBottom,getComputedStyle(card).paddingLeft]
   });
   return {
    outer:read(outerPage.querySelector('[data-isw-ips-item="overF1"]')),
    modal:read(modal.querySelector('[data-isw-ips-item="overF1"]')),
    outerGap:getComputedStyle(outerPage.querySelector(".isw-ips-grid")).columnGap,
    modalGap:getComputedStyle(modal.querySelector(".isw-ips-record-grid")).columnGap,
    summaryRadius:getComputedStyle(modal.querySelector(".isw-ips-record-overview")).borderRadius
   };
  });
  assert.deepEqual(recordCardContract.modal,recordCardContract.outer,"record cards reuse the exact outer settings-card surface");
  assert.equal(recordCardContract.modalGap,recordCardContract.outerGap,"record cards reuse the outer 10px grid gap");
  assert.equal(recordCardContract.summaryRadius,recordCardContract.outer.radius,"the record summary reuses the settings-card radius");
  assert.equal(await recordDialog.locator("[data-isw-ips-item]").count(),8,"the history modal keeps all eight results");
  assert.match(await recordDialog.innerText(),/Record time/);
  assert.match(await recordDialog.innerText(),/6 passed[\s\S]*2 failed/);
  await recordDialog.getByRole("button",{name:"Close"}).click();
  await recordDialog.waitFor({state:"detached"});

  await page.setViewportSize({width:420,height:900});
  await page.waitForTimeout(120);
  await page.getByRole("button",{name:"IPS Check Record"}).click();
  await recordDialog.waitFor();
  await page.waitForTimeout(620);
  await recordDialog.locator(".isw-ips-record-scroll").evaluate(node=>{
   node.scrollTop=node.scrollHeight;
  });
  await page.waitForTimeout(80);
  const narrowRecordScroll=await page.evaluate(()=>{
   const modal=document.querySelector(".isw-ips-record-dialog");
   const viewport=modal.querySelector(".isw-ips-record-scroll");
   const track=modal.querySelector(".wd-scroll-feedback");
   const cards=[...modal.querySelectorAll("[data-isw-ips-item]")];
   const box=node=>node.getBoundingClientRect();
   return {
    modal:box(modal),
    viewport:box(viewport),
    track:box(track),
    lastCardBottom:box(cards.at(-1)).bottom,
    horizontalOverflow:viewport.scrollWidth>viewport.clientWidth+1
   };
  });
  assert.ok(Math.abs(narrowRecordScroll.modal.bottom-narrowRecordScroll.viewport.bottom)<=1,"the narrow record viewport fills the dialog without a fixed bottom band");
  assert.ok(narrowRecordScroll.track.top>=narrowRecordScroll.viewport.top-1&&narrowRecordScroll.track.bottom<=narrowRecordScroll.viewport.bottom-20,"the narrow record rail keeps its inset inside the scroll viewport");
  assert.ok(narrowRecordScroll.lastCardBottom<=narrowRecordScroll.viewport.bottom-20,"the narrow record exposes the complete final card above the modal edge");
  assert.ok(narrowRecordScroll.modal.bottom-narrowRecordScroll.lastCardBottom<=24,"the narrow record keeps one shared bottom inset");
  assert.equal(narrowRecordScroll.horizontalOverflow,false,"the narrow record modal does not scroll horizontally");
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-record-narrow-bottom.png")});
  await recordDialog.getByRole("button",{name:"Close"}).click();
  await recordDialog.waitFor({state:"detached"});
  await page.setViewportSize({width:1545,height:1252});
  await page.waitForTimeout(120);

  await page.getByRole("button",{name:"Start IPS Check"}).click();
  await page.waitForFunction(()=>document.querySelector(".isw-ips-operation-card")?.textContent.includes("IPS Check in progress"));
  assert.match(await page.locator(".isw-ips-operation-card").innerText(),/Checking\.\.\./);
  assert.equal(await page.locator('[data-isw-action="ipsStart"]').isDisabled(),true);
  assert.equal(await page.locator("[data-isw-ips-item][data-status='checking']").count(),8);
  await page.waitForFunction(()=>document.querySelector(".isw-ips-operation-card")?.dataset.iswIpsOverall==="passed",{timeout:4000});
  assert.match(await page.locator(".isw-ips-operation-card").innerText(),/IPS Check passed/);
  assert.equal(await page.locator("[data-isw-ips-item][data-status='passed']").count(),8);
  assert.equal(await page.locator('[data-isw-action="ipsStart"]').textContent(),"Run Check Again");
  await page.screenshot({path:path.join(__dirname,"output","verify-ips-check-passed.png")});

  const modelStates=await page.evaluate(async()=>{
   const {createSettingsModel}=await import("/src/pages/inverter-settings/settings-model.js");
   const preview=createSettingsModel({ipsPreview:true});
   preview.loadProfile("it_cei021");
   const german=createSettingsModel({ipsPreview:true});
   const notRequired=createSettingsModel({ipsSelfCheckRequired:0});
   notRequired.loadProfile("it_cei021");
   const offline=createSettingsModel({deviceOnline:false});
   offline.loadProfile("it_cei021");
   const failed=createSettingsModel();
   failed.loadProfile("it_cei021");
   failed.startIpsCheck();
   failed.completeIpsCheck({failIds:["underV1"]});
   const interrupted=createSettingsModel();
   interrupted.loadProfile("it_cei021");
   interrupted.startIpsCheck();
   interrupted.interruptIpsCheck();
   return {
    previewSubs:preview.gridSubs().map(([id])=>id),
    germanHasIps:german.gridSubs().some(([id])=>id==="ips"),
    requiredTone:preview.ipsEntryTone(),
    optionalTone:notRequired.ipsEntryTone(),
    offline:offline.ipsOverallStatus(),
    failed:failed.ipsOverallStatus(),
    interrupted:interrupted.ipsOverallStatus(),
    recordedStatuses:Object.values(failed.S.ips.lastRecord.items).map(item=>item.status)
   };
  });
  assert.deepEqual(modelStates.previewSubs,["code","prot","conn","reac","pu","fp","lvrt","hvrt","ips"]);
  assert.equal(modelStates.germanHasIps,false,"non-Italy profiles hide IPS Check");
  assert.equal(modelStates.requiredTone,"danger");
  assert.equal(modelStates.optionalTone,"idle");
  assert.equal(modelStates.offline,"offline","device offline overrides every item status");
  assert.equal(modelStates.failed,"failed");
  assert.equal(modelStates.interrupted,"interrupted");
  assert.equal(modelStates.recordedStatuses.filter(status=>status==="failed").length,1);

  await page.getByRole("button",{name:"Close inverter settings"}).click();
  await page.waitForFunction(()=>!document.querySelector(".inverter-settings-window"));
  await page.getByRole("button",{name:"Open iHybrid settings"}).click();
  await page.waitForFunction(()=>document.querySelector("#toast")?.textContent.includes("must pass IPS Check"));
  assert.match(await page.locator("#toast").innerText(),/The inverter must pass IPS Check before connecting to the grid\./);
  assert.deepEqual(errors,[],"IPS Check renders without console or page errors");
 } finally {
  await browser.close();
 }
})().catch(error=>{
 console.error(error);
 process.exitCode=1;
});
