const {chromium,launchOptions,previewURL}=require("./runtime.cjs");
const assert=require("node:assert/strict");

const origin=new URL(previewURL).origin;
const route=`${origin}/plants/p25/site-v2?device=inverter&glass=figma`;
const demoAddress="Untere Königsstraße 52, 34117 Kassel, Gebäude Nord, Eingang B, 2. Obergeschoss, Raum 2.14";
const pixel=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl3sAAAAASUVORK5CYII=","base64");
const settle=page=>page.evaluate(()=>Promise.all(
 document.getAnimations()
  .filter(animation=>animation.effect?.getTiming().iterations!==Infinity)
  .map(animation=>animation.finished.catch(()=>{}))
));

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,"clipboard",{
   configurable:true,
   value:{writeText:async value=>{window.__copiedAddress=value;}}
  });
 });
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("response",response=>{
  if(response.status()>=400&&!response.url().includes("api.mapbox.com"))errors.push(`${response.status()} ${response.url()}`);
 });
 await page.goto(route,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await settle(page);

 assert.equal(new URL(page.url()).pathname,"/plants/p25/site-v2");
 assert.equal(await page.locator(".plant-site-details-v2").count(),1,"Site details 2 mounts as its own page");
 assert.equal(await page.locator(".plant-site-details").count(),0,"the comparison page does not replace the original Site details");
 assert.deepEqual(
  await page.locator(".plants-detail-tab").evaluateAll(tabs=>tabs.map(tab=>({label:tab.textContent.trim(),current:tab.getAttribute("aria-current")}))),
  [
   {label:"Overview",current:null},
   {label:"Devices",current:null},
   {label:"Site details",current:"page"}
  ],
  "the sole Site details tab exposes this page"
 );

 assert.equal((await page.locator(".site-v2-title").textContent()).trim(),"Wärmeverbund Nord");
 const viewTitleLeft=await page.locator(".site-v2-title").evaluate(title=>title.getBoundingClientRect().left);
 const viewTitleTop=await page.locator(".site-v2-title").evaluate(title=>title.getBoundingClientRect().top);
 assert.equal(await page.locator(".site-v2-type-chip,.site-v2-status").count(),0,"the hero removes the extra type and status pills");
 assert.equal(await page.locator(".site-v2-subtitle").count(),0,"the hero keeps the plant name but removes the repeated company and SN subtitle");
 assert.equal(await page.locator(".site-v2-hero .site-v2-address").count(),0,"the street/location address lives in the map rather than the hero copy");
 assert.deepEqual(await page.locator(".site-v2-metric-label").allTextContents(),["Plant type","PV capacity","Commissioned","Battery storage"]);
 assert.deepEqual(
  await page.locator(".site-v2-metric-value").allTextContents(),
  ["Hybrid system","28.68 kWp","2024/01/10 10:12","30.08 kWh"],
  "the hero presents the four core plant facts"
 );
 const metricAlignment=await page.locator(".site-v2-metric").evaluateAll(metrics=>metrics.map(metric=>({
  top:metric.getBoundingClientRect().top,
  left:metric.getBoundingClientRect().left,
  label:metric.querySelector(".site-v2-metric-label").getBoundingClientRect().top,
  value:metric.querySelector(".site-v2-metric-value").getBoundingClientRect().top
 })));
 assert.equal(await page.locator(".site-v2-metrics").evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(" ").length),2,"metrics use a 2 by 2 grid");
 assert.equal(await page.locator(".site-v2-metrics").evaluate(grid=>getComputedStyle(grid).columnGap),"40px","the metrics keep a balanced center gap");
 const rowOneMetrics=metricAlignment.slice(0,2);
 const rowTwoMetrics=metricAlignment.slice(2,4);
 assert.ok(Math.abs(rowOneMetrics[0].top-rowOneMetrics[1].top)<1&&Math.abs(rowTwoMetrics[0].top-rowTwoMetrics[1].top)<1,"metric cards align in two equal rows");
 assert.ok(rowTwoMetrics[0].top>rowOneMetrics[0].top,"metrics form two distinct rows");
 assert.ok(Math.max(...rowOneMetrics.map(item=>item.label))-Math.min(...rowOneMetrics.map(item=>item.label))<1,"first-row labels share one baseline");
 assert.ok(Math.max(...rowTwoMetrics.map(item=>item.label))-Math.min(...rowTwoMetrics.map(item=>item.label))<1,"second-row labels share one baseline");
 assert.ok(Math.max(...rowOneMetrics.map(item=>item.value))-Math.min(...rowOneMetrics.map(item=>item.value))<1,"first-row values share one baseline");
 assert.ok(Math.max(...rowTwoMetrics.map(item=>item.value))-Math.min(...rowTwoMetrics.map(item=>item.value))<1,"second-row values share one baseline");
 assert.equal(await page.locator(".site-v2-metric-value").evaluateAll(values=>values.every(value=>value.scrollWidth<=value.clientWidth)),true,"metric values stay on one complete line");
 assert.equal(
  await page.locator(".site-v2-metric-value").evaluateAll(values=>values.every(value=>getComputedStyle(value).fontWeight==="510")),
  true,
  "metric values use the medium weight instead of a heavy display weight"
 );
 const metricMaterial=await page.locator(".site-v2-metric").evaluateAll(metrics=>metrics.map(metric=>({
  background:getComputedStyle(metric).backgroundColor,
  border:getComputedStyle(metric).borderTopWidth,
  icon:metric.querySelectorAll(":scope>.site-v2-info-group-icon").length,
  iconMask:metric.querySelector(":scope>.site-v2-info-group-icon")?getComputedStyle(metric.querySelector(":scope>.site-v2-info-group-icon")).maskImage:"none",
   iconSource:metric.querySelector(":scope>.site-v2-info-group-icon")?.dataset.iconSource,
  labelColor:getComputedStyle(metric.querySelector(".site-v2-metric-label")).color,
   iconColor:getComputedStyle(metric.querySelector(":scope>.site-v2-info-group-icon")).backgroundColor,
   iconOpacity:getComputedStyle(metric.querySelector(":scope>.site-v2-info-group-icon")).opacity
 })));
 assert.equal(metricMaterial.every(metric=>metric.background==="rgba(0, 0, 0, 0)"),true,"metric cards have no fill");
 assert.equal(metricMaterial.every(metric=>metric.border==="0px"),true,"metric cards have no outer outline");
 assert.equal(metricMaterial.every(metric=>metric.icon===1&&metric.iconMask!=="none"),true,"each metric starts with one local icon");
 assert.deepEqual(metricMaterial.map(metric=>metric.iconSource),["organisation","solar-panel","imgBoldTimeCalendar","battery-storage"],"PV and battery use their own semantic icons");
 assert.equal(metricMaterial.every(metric=>metric.labelColor===metric.iconColor),true,"metric labels and icons share one secondary color");
 assert.equal(metricMaterial.every(metric=>metric.iconOpacity==="0.78"),true,"dense metric icons use the calibrated optical weight of their adjacent labels");
 assert.equal(
  await page.locator(".site-v2-metric").evaluateAll(metrics=>metrics.every(metric=>{
   const icon=metric.querySelector(":scope>.site-v2-info-group-icon").getBoundingClientRect();
   const content=metric.querySelector(":scope>.site-v2-info-group-content").getBoundingClientRect();
   return Math.abs((icon.top+icon.height/2)-(content.top+content.height/2))<1;
  })),
  true,
  "metric icons are vertically centered against their complete information groups"
 );
 assert.equal(await page.locator(".site-v2-metric").evaluateAll(metrics=>metrics.every(metric=>metric.getBoundingClientRect().height<64)),true,"metric cards keep the reduced compact height");
 await page.screenshot({path:"tests/output/site-details-v2-icon-tone.png"});
 const dividerSystem=await page.evaluate(()=>{
  const nodes=[
   document.querySelector(".site-v2-panel--energy .site-v2-info-row:nth-child(2)"),
   document.querySelector(".site-v2-owner:nth-child(2)"),
   document.querySelector(".site-v2-installer-alarm")
  ].filter(Boolean);
  return{
   widths:[...new Set(nodes.map(node=>getComputedStyle(node).borderTopWidth))],
   colors:[...new Set(nodes.map(node=>getComputedStyle(node).borderTopColor))],
   privateEnergyToken:getComputedStyle(document.querySelector(".plant-site-details-v2")).getPropertyValue("--site-v2-energy-divider").trim()
  };
 });
 assert.deepEqual(dividerSystem.widths,["1px"],"all page dividers and card outlines use the global 1px width");
 assert.equal(dividerSystem.colors.length,1,"all page dividers and card outlines use the same global separator color");
 assert.equal(dividerSystem.privateEnergyToken,"","Energy no longer defines a private divider token");

 const heroLayout=await page.evaluate(()=>{
  const hero=document.querySelector(".site-v2-hero").getBoundingClientRect();
  const copy=document.querySelector(".site-v2-hero-copy").getBoundingClientRect();
  const map=document.querySelector(".site-v2-map").getBoundingClientRect();
  const address=document.querySelector(".site-v2-map-address-row").getBoundingClientRect();
  return {
   display:getComputedStyle(document.querySelector(".site-v2-hero")).display,
   heroWidth:hero.width,
   heroHeight:hero.height,
   titleRegionHeight:document.querySelector(".site-v2-title-region").getBoundingClientRect().height,
   mapCoversHero:
    Math.abs(hero.top-map.top)<=1.5&&
    Math.abs(hero.left-map.left)<=1.5&&
    Math.abs(hero.right-map.right)<=1.5&&
    Math.abs(hero.bottom-map.bottom)<=1.5,
   mapHeight:map.height,
   mapWidth:map.width,
   copyWidth:copy.width,
   addressRightGap:hero.right-address.right,
   addressBottomGap:hero.bottom-address.bottom,
   heroBottom:hero.bottom,
   metricsBottom:document.querySelector(".site-v2-metrics").getBoundingClientRect().bottom,
   copyZ:Number(getComputedStyle(document.querySelector(".site-v2-hero-copy")).zIndex),
   addressZ:Number(getComputedStyle(document.querySelector(".site-v2-map-copy")).zIndex)
  };
 });
 assert.equal(heroLayout.display,"block","the hero becomes one shared visual surface");
 assert.ok(heroLayout.heroWidth>900);
 assert.ok(heroLayout.heroHeight>=225,"the hero has a taller profile-card presence");
 assert.ok(heroLayout.titleRegionHeight>=70,"the title receives generous vertical breathing room");
 assert.equal(heroLayout.mapCoversHero,true,"the location map fills the complete hero card");
 assert.ok(heroLayout.mapHeight>=230,"the location preview has a useful visual height");
 assert.ok(Math.abs(heroLayout.mapWidth-(heroLayout.heroWidth-2))<1,"the map spans the hero content width inside its 1px border");
 assert.ok(heroLayout.copyWidth<heroLayout.heroWidth*.7,"hero copy keeps a focused reading column over the map");
 assert.ok(Math.abs(heroLayout.addressRightGap-24)<1.5,"the address keeps a 24px right inset");
 assert.ok(Math.abs(heroLayout.addressBottomGap-28)<1.5,"the address block is lifted 28px above the hero bottom");
 assert.ok(heroLayout.copyZ>0&&heroLayout.addressZ>0,"hero copy and interactive address stay above the map image");
 await page.screenshot({path:"tests/output/site-details-v2-hero-map.png"});

 const editPlacement=await page.evaluate(()=>{
  const hero=document.querySelector(".site-v2-hero").getBoundingClientRect();
  const edit=document.querySelector(".site-v2-edit").getBoundingClientRect();
  return{
   rightGap:hero.right-edit.right,
   topGap:edit.top-hero.top,
   mapSide:edit.left>hero.left+hero.width/2
  };
 });
 assert.ok(editPlacement.rightGap<30&&editPlacement.topGap<30&&editPlacement.mapSide,"Edit is anchored at the hero's map-side top-right corner");

 const map=page.locator(".site-v2-map");
 assert.ok(["preview","loading","ready"].includes(await map.getAttribute("data-map-state")),"the map starts in an explicit preview, loading or ready state");
 assert.equal(await page.locator(".site-v2-map-fallback").count(),0,"the map has no visible placeholder artwork while loading");
 assert.equal(await page.locator(".site-v2-map-bank").count(),2,"the map keeps one fade bank per theme");
 assert.ok(await page.locator(".site-v2-map-bank.is-active").count()<=1,"at most one theme bank is exposed to the page");
 assert.equal(await page.locator(".site-v2-map-image--sharp").count(),2,"each theme bank has one sharp base image");
 assert.equal(await page.locator(".site-v2-map-image--blurred").count(),2,"each theme bank has one blurred image");
 assert.equal(await page.locator(".site-v2-map-blur-layer").count(),2,"each theme bank has one progressive blur mask");
 assert.equal(await page.locator(".site-v2-map-image-blurred,.site-v2-map-focus").count(),0,"the map does not restore the retired separate-map layers");
 assert.equal(await page.locator(".site-v2-map-pin").count(),1,"the location control remains available");
 assert.equal(await page.locator(".site-v2-map-address").count(),1,"the address interaction remains available");
 assert.equal(await page.locator(".site-v2-map-head").count(),0,"the map omits the floating Site location and Preview badges");
 assert.equal(await page.locator(".site-v2-map-coordinates,.site-v2-map-attribution").count(),0,"the map omits coordinates and placeholder attribution copy");
 assert.equal((await page.locator(".site-v2-map-address").textContent()).trim(),demoAddress);
 assert.equal((await page.locator(".site-v2-map-country").textContent()).trim(),"Germany","the address restores its country line");
 assert.deepEqual(await page.locator(".site-v2-map-address-copy > *").allTextContents(),["Germany",demoAddress],"country appears above the complete specific address");
 const addressPresentation=await page.evaluate(()=>{
  const row=document.querySelector(".site-v2-map-address-row").getBoundingClientRect();
  const icon=document.querySelector(".site-v2-map-address-icon");
  const iconStyle=getComputedStyle(icon);
  const iconBox=icon.getBoundingClientRect();
  const address=document.querySelector(".site-v2-map-address").getBoundingClientRect();
  const copy=document.querySelector(".site-v2-map-address-copy").getBoundingClientRect();
  return{
   iconLeftOfCopy:iconBox.right<copy.left,
   iconCenterOffset:Math.abs((iconBox.top+iconBox.height/2)-(row.top+row.height/2)),
   iconWidth:iconBox.width,
   iconColor:iconStyle.color,
   iconBackground:iconStyle.backgroundColor,
   iconShadow:iconStyle.boxShadow,
   iconFilter:iconStyle.filter,
   iconMask:iconStyle.maskImage,
   rowWidth:row.width,
   addressWhiteSpace:getComputedStyle(document.querySelector(".site-v2-map-address")).whiteSpace,
   addressTruncated:document.querySelector(".site-v2-map-address").scrollWidth>document.querySelector(".site-v2-map-address").clientWidth
  };
 });
 assert.equal(addressPresentation.iconLeftOfCopy,true,"the address icon sits to the left of the address");
 assert.ok(addressPresentation.iconCenterOffset<1,"the address icon is vertically centered against the address");
 assert.equal(addressPresentation.iconWidth,20,"the filled address icon is larger than the previous 16px outline");
 assert.notEqual(addressPresentation.iconColor,"rgb(255, 255, 255)","the address icon is softly muted instead of pure white");
 assert.notEqual(addressPresentation.iconBackground,"rgba(0, 0, 0, 0)");
 assert.equal(addressPresentation.iconShadow,"none","the address icon has no shadow");
 assert.equal(addressPresentation.iconFilter,"none","the address icon has no filter shadow");
 assert.match(addressPresentation.iconMask,/url\(/i,"the address icon uses the shared location artwork");
 assert.equal(addressPresentation.addressWhiteSpace,"normal");
 assert.equal(addressPresentation.addressTruncated,false,"the complete address wraps instead of truncating");
 const addressButton=page.locator(".site-v2-map-address");
 await addressButton.hover();
 await page.waitForFunction(()=>document.querySelector(".site-v2-address-popover")?.getBoundingClientRect().height>0);
 assert.equal(await page.locator(".site-v2-address-popover.wd-glass .wd-glass-material").count(),1,"the full-address panel uses the shared glass material");
 assert.equal((await page.locator(".site-v2-address-popover-address").textContent()).trim(),demoAddress);
 assert.equal(await page.locator(".site-v2-address-popover-country,.site-v2-address-popover-hint").count(),0,"the popover contains only the full address");
 const addressPopoverLayout=await page.locator(".site-v2-address-popover").evaluate(panel=>{
  const address=panel.querySelector(".site-v2-address-popover-address");
  const panelStyle=getComputedStyle(panel);
  const addressStyle=getComputedStyle(address);
  return{
   paddingLeft:panelStyle.paddingLeft,
   paddingRight:panelStyle.paddingRight,
   addressPaddingLeft:addressStyle.paddingLeft,
   addressPaddingRight:addressStyle.paddingRight,
   addressLeft:address.getBoundingClientRect().left,
   panelLeft:panel.getBoundingClientRect().left
  };
 });
 assert.equal(addressPopoverLayout.paddingLeft,"16px");
 assert.equal(addressPopoverLayout.paddingRight,"16px","the address popover uses equal 16px horizontal insets");
 assert.equal(addressPopoverLayout.addressPaddingLeft,"0px");
 assert.equal(addressPopoverLayout.addressPaddingRight,"0px");
 assert.ok(Math.abs(addressPopoverLayout.addressLeft-addressPopoverLayout.panelLeft-16)<1,"address content begins exactly on the popover's inner content line");
 const addressBox=await addressButton.boundingBox();
 const popoverBox=await page.locator(".site-v2-address-popover").boundingBox();
 await page.mouse.move(addressBox.x+addressBox.width/2,addressBox.y+addressBox.height/2);
 await page.mouse.move(popoverBox.x+popoverBox.width/2,popoverBox.y+popoverBox.height/2,{steps:4});
 await page.waitForTimeout(260);
 assert.equal(await page.locator(".site-v2-address-popover").isVisible(),true,"the glass address popover remains open while the pointer is inside it");
 const popoverHover=await page.locator(".site-v2-address-popover-address").evaluate(address=>({
  background:getComputedStyle(address).backgroundColor,
  decoration:getComputedStyle(address).textDecorationLine
 }));
 assert.equal(popoverHover.background,"rgba(0, 0, 0, 0)","the address uses no hover highlight fill");
 assert.equal(popoverHover.decoration,"underline","the address uses a text underline on hover");
 await page.screenshot({path:"tests/output/site-details-v2-address-popover.png"});
 await page.locator(".site-v2-address-popover-address").click();
 assert.equal(await page.evaluate(()=>window.__copiedAddress),demoAddress,"clicking the full address copies its complete value");
 await page.waitForFunction(()=>document.querySelector("#toast")?.textContent.includes("Address copied"));
 await page.keyboard.press("Escape");
 const pinStyle=await page.locator(".site-v2-map-pin").evaluate(pin=>{
  const style=getComputedStyle(pin);
  const core=pin.querySelector(".site-v2-map-pin-core");
  const ripples=[...pin.querySelectorAll(".site-v2-map-ripple")];
  return{
   background:style.backgroundColor,
   border:style.borderTopWidth,
   shadow:style.boxShadow,
   filter:style.filter,
   tagName:pin.tagName,
   glassMounted:pin.classList.contains("wd-glass"),
   glassMaterials:pin.querySelectorAll(":scope>.wd-glass-material").length,
   glassRadius:style.borderRadius,
   glassDisc:pin.classList.contains("wd-glass--disc"),
   glassBlur:getComputedStyle(pin.querySelector(".wd-glass-fill")).backdropFilter,
   glassTint:getComputedStyle(pin.querySelector(".wd-glass-fill")).backgroundColor,
   hostIsolation:style.isolation,
   coreWidth:getComputedStyle(core).width,
   coreRadius:getComputedStyle(core).borderRadius,
   coreBackground:getComputedStyle(core).backgroundImage,
   coreShadow:getComputedStyle(core).boxShadow,
   glintWidth:getComputedStyle(core,"::after").width,
   glintRadius:getComputedStyle(core,"::after").borderRadius,
   auraAnimation:getComputedStyle(pin,"::before").animationName,
   coreAnimation:getComputedStyle(core).animationName,
   coreIterations:getComputedStyle(core).animationIterationCount,
   rippleCount:ripples.length,
   rippleAnimation:ripples.map(ripple=>getComputedStyle(ripple).animationName),
   rippleIterations:ripples.map(ripple=>getComputedStyle(ripple).animationIterationCount),
   rippleDelays:ripples.map(ripple=>getComputedStyle(ripple).animationDelay),
   rippleBorders:ripples.map(ripple=>getComputedStyle(ripple).borderTopWidth)
  };
 });
 assert.equal(pinStyle.background,"rgba(0, 0, 0, 0)","the map locator has no circular backplate");
 assert.equal(pinStyle.border,"0px");
 assert.equal(pinStyle.shadow,"none");
 assert.equal(pinStyle.filter,"none","the animated locator has no shadow filter");
 assert.equal(pinStyle.tagName,"BUTTON","the locator is a real shared button rather than a hand-built material");
 assert.equal(pinStyle.glassMounted,true);
 assert.equal(pinStyle.glassMaterials,1,"the locator mounts exactly one shared glass material");
 assert.equal(pinStyle.glassRadius,"18px");
 assert.equal(pinStyle.glassDisc,true,"the 36px shared glass button is resolved as a circular disc");
 assert.match(pinStyle.glassBlur,/blur\(14px\)/i,"the shared glass layer supplies a visibly frosted backdrop on the map");
 assert.equal(pinStyle.glassTint,"rgba(153, 153, 153, 0.24)","the dark locator adds enough tint to read as glass over the map");
 assert.equal(pinStyle.hostIsolation,"auto","the locator does not create a backdrop root that cancels the glass blur");
 assert.equal(pinStyle.coreWidth,"6px");
 assert.equal(pinStyle.coreRadius,"50%");
 assert.match(pinStyle.coreBackground,/radial-gradient/i,"the locator core adds a restrained luminous center");
 assert.notEqual(pinStyle.coreShadow,"none","the glass point carries a restrained cyan-blue glow");
 assert.equal(pinStyle.glintWidth,"2px","the glass point keeps a small neutral luminous center instead of a large colored orb");
 assert.equal(pinStyle.glintRadius,"50%");
 assert.equal(pinStyle.coreAnimation,"site-v2-map-core-breathe");
 assert.equal(pinStyle.auraAnimation,"site-v2-map-pin-aura");
 assert.equal(pinStyle.coreIterations,"infinite");
 assert.equal(pinStyle.rippleCount,2,"the locator renders two stagger-timed ripple rings");
 assert.equal(pinStyle.rippleAnimation.every(name=>name==="site-v2-map-ripple-pulse"),true);
 assert.equal(pinStyle.rippleIterations.every(value=>value==="infinite"),true,"the locator pulse loops continuously");
 assert.ok(pinStyle.rippleDelays.includes("1.3s"),"the second ripple starts halfway through the cycle");
 assert.equal(pinStyle.rippleBorders.every(width=>width==="1px"),true,"the expanded ripple range keeps the refined 1px stroke");
 const pinPosition=await page.evaluate(()=>{
  const map=document.querySelector(".site-v2-map").getBoundingClientRect();
  const pin=document.querySelector(".site-v2-map-pin").getBoundingClientRect();
  return{
   fromLeft:(pin.left+pin.width/2-map.left)/map.width,
   fromTop:(pin.top+pin.height/2-map.top)/map.height
  };
 });
 assert.ok(pinPosition.fromLeft>0.74&&pinPosition.fromLeft<0.76&&pinPosition.fromTop>0.38&&pinPosition.fromTop<0.40,"the glowing locator sits at the clear map focal centre and the requested lower vertical position");
 await page.locator(".site-v2-map-pin").screenshot({path:"tests/output/site-details-v2-locator-dark.png"});
 const darkPinBox=await page.locator(".site-v2-map-pin").boundingBox();
 await page.screenshot({path:"tests/output/site-details-v2-locator-dark-context.png",clip:{x:darkPinBox.x-52,y:darkPinBox.y-52,width:darkPinBox.width+104,height:darkPinBox.height+104}});

 assert.deepEqual(
  await page.locator(".site-v2-panel-title").allTextContents(),
  ["Energy & tariff","Installer & support","Owner information","Plant picture","Visitor access"]
 );
 const panelLayout=await page.locator(".site-v2-panel").evaluateAll(panels=>Object.fromEntries(panels.map(panel=>{
  const box=panel.getBoundingClientRect();
  return [panel.querySelector(".site-v2-panel-title").textContent,{left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height}];
 })));
 const panelWidths=["Energy & tariff","Installer & support","Owner information","Plant picture"].map(label=>panelLayout[label].width);
 assert.ok(Math.max(...panelWidths)-Math.min(...panelWidths)<1,"all four panels share the same desktop column width");
 assert.ok(Math.abs(panelLayout["Energy & tariff"].height-panelLayout["Installer & support"].height)<1,"Energy & tariff and Installer & support keep the same row height");
 assert.ok(panelLayout["Energy & tariff"].height<260,"the Energy & tariff card stays compact");
 assert.ok(panelLayout["Owner information"].height>panelLayout["Plant picture"].height,"the empty Plant picture card stays shorter than the three-account Owner card");
 assert.ok(Math.abs(panelLayout["Plant picture"].height-panelLayout["Visitor access"].height)<1,"the empty Plant picture card matches the compact Visitor access card height");
 assert.ok(panelLayout["Energy & tariff"].top<panelLayout["Owner information"].top,"Energy and Installer form the first row");
 assert.ok(panelLayout["Installer & support"].top<panelLayout["Plant picture"].top,"People and Picture form the second row");
 assert.ok(panelLayout["Visitor access"].top>=panelLayout["Owner information"].bottom-1,"Visitor access sits below the Owner card");
 assert.ok(Math.abs(panelLayout["Visitor access"].left-panelLayout["Owner information"].left)<1,"Visitor access stays in the left column beneath Owner");
 assert.ok(Math.abs(panelLayout["Visitor access"].width-panelLayout["Owner information"].width)<1,"Visitor access uses the same narrow column width as Owner");
 assert.ok(panelLayout["Visitor access"].height<150,"Visitor access has no large empty footer");
 const panelChrome=await page.locator(".site-v2-panel").evaluateAll(panels=>panels.map(panel=>{
  const header=panel.querySelector(":scope > .site-v2-panel-head");
  const action=header?.querySelector(".site-v2-panel-action");
  return{
   headerFirst:panel.firstElementChild===header,
   background:getComputedStyle(panel).backgroundColor,
   gap:getComputedStyle(panel).rowGap,
   actionInside:action?header.contains(action):true
  };
 }));
 assert.equal(panelChrome.every(item=>item.headerFirst),true,"titles are restored inside their cards");
 assert.equal(panelChrome.every(item=>item.background!=="rgba(0, 0, 0, 0)"),true,"all information cards keep a visible surface");
 assert.equal(panelChrome.every(item=>item.gap==="16px"),true,"all cards use the same title-to-body spacing");
 assert.equal(panelChrome.every(item=>item.actionInside),true,"plus actions stay in the restored in-card header");
 assert.equal(await page.locator(".site-v2-panel-surface").count(),0,"the external header wrapper is removed");
 assert.equal(await page.locator(".site-v2-panel-body > .site-v2-info-row:first-child").evaluateAll(rows=>rows.every(row=>getComputedStyle(row).borderTopWidth==="0px")),true,"the first row does not draw a divider under the title");
 assert.equal(await page.locator(".plant-site-details-v2").evaluate(page=>getComputedStyle(page).getPropertyValue("--site-v2-panel-inline").trim()),"20px");
 assert.equal(await page.locator(".site-v2-panel:not(.site-v2-panel--energy)").first().evaluate(panel=>getComputedStyle(panel).paddingLeft),"20px","regular card content uses the unified 20px inline inset");
 const energyReferenceStyle=await page.locator(".site-v2-panel--energy").evaluate(panel=>{
  const style=getComputedStyle(panel);
  const rows=[...panel.querySelectorAll(".site-v2-info-row")];
  return{
   radius:style.borderTopLeftRadius,
   background:style.backgroundColor,
   outline:style.outlineStyle,
   padding:style.padding,
   rowHeights:rows.map(row=>row.getBoundingClientRect().height),
   rowPadding:rows.map(row=>getComputedStyle(row).padding),
   labelWeights:rows.map(row=>getComputedStyle(row.querySelector(".site-v2-info-label")).fontWeight),
   valueWeights:rows.map(row=>getComputedStyle(row.querySelector(".site-v2-info-value")).fontWeight),
   valueFamilies:rows.map(row=>getComputedStyle(row.querySelector(".site-v2-info-value")).fontFamily)
  };
 });
 assert.equal(energyReferenceStyle.radius,"16px","Energy & tariff keeps its card radius");
 assert.notEqual(energyReferenceStyle.background,"rgba(0, 0, 0, 0)","Energy & tariff keeps its card surface");
 assert.equal(energyReferenceStyle.padding,"16px 0px","Energy & tariff keeps the shared card top and bottom padding");
 assert.equal(energyReferenceStyle.rowHeights.every(height=>height===44),true,"Energy & tariff keeps the reference rhythm with shorter 44px rows");
 assert.equal(energyReferenceStyle.outline,"none","Energy & tariff has no external outline");
 assert.equal(energyReferenceStyle.rowPadding.every(padding=>padding==="0px 20px"),true,"Energy rows retain the shared card inset");
 assert.equal(energyReferenceStyle.labelWeights.every(weight=>weight==="510"),true,"Energy & tariff labels use the reference medium weight");
 assert.equal(energyReferenceStyle.valueWeights.every(weight=>weight==="400"),true,"Energy & tariff values stay regular weight");
 assert.equal(energyReferenceStyle.valueFamilies.every(family=>!family.includes("mono")&&!family.includes("Consolas")),true,"Energy & tariff values use the standard interface font");
 assert.equal(await page.locator(".site-v2-info-group").count(),6,"four Hero metrics, company and contact reuse the same semantic information-group container");
 const viewEnergyTextLayout=await page.locator(".site-v2-panel--energy").evaluate(panel=>({
  height:panel.getBoundingClientRect().height,
  titleTop:panel.querySelector(".site-v2-panel-title").getBoundingClientRect().top,
  labels:[...panel.querySelectorAll(".site-v2-info-label")].map(label=>label.textContent.trim()),
  labelTops:[...panel.querySelectorAll(".site-v2-info-label")].map(label=>label.getBoundingClientRect().top)
 }));
 assert.deepEqual(viewEnergyTextLayout.labels,["Timezone","Price area","Currency","Grid price"],"Energy & tariff follows the requested row order");

 const heroMapLayout=await page.evaluate(()=>{
  const hero=document.querySelector(".site-v2-hero").getBoundingClientRect();
  const map=document.querySelector(".site-v2-map");
  const mapBox=map.getBoundingClientRect();
  return {
   topInset:mapBox.top-hero.top,
   rightInset:hero.right-mapBox.right,
   bottomInset:hero.bottom-mapBox.bottom,
   leftInset:mapBox.left-hero.left,
   borderWidth:getComputedStyle(map).borderTopWidth,
   borderRadius:getComputedStyle(map).borderTopLeftRadius,
   heroClipPath:getComputedStyle(document.querySelector(".site-v2-hero")).clipPath,
   heroBefore:getComputedStyle(document.querySelector(".site-v2-hero"),"::before").content,
   sharpFilter:getComputedStyle(document.querySelector(".site-v2-map-image--sharp")).filter,
   blurFilter:getComputedStyle(document.querySelector(".site-v2-map-image--blurred")).filter,
   blurMask:getComputedStyle(document.querySelector(".site-v2-map-blur-layer")).maskImage,
   blurInset:getComputedStyle(document.querySelector(".site-v2-map-blur-layer")).top,
   mapOpacity:getComputedStyle(document.querySelector(".site-v2-map-image--blurred")).opacity,
   addressBackground:getComputedStyle(document.querySelector(".site-v2-map-copy")).backgroundColor,
   addressMask:getComputedStyle(document.querySelector(".site-v2-map-copy"),"::before").backgroundImage,
   heroBorder:getComputedStyle(document.querySelector(".site-v2-hero")).borderTopWidth,
   heroShadow:getComputedStyle(document.querySelector(".site-v2-hero")).boxShadow,
   heroBackground:getComputedStyle(document.querySelector(".site-v2-hero")).backgroundImage,
   heroSurface:getComputedStyle(document.querySelector(".site-v2-hero")).backgroundColor,
   heroBorderColor:getComputedStyle(document.querySelector(".site-v2-hero")).borderTopColor,
   panelSurface:getComputedStyle(document.querySelector(".site-v2-panel--installer")).backgroundColor,
   panelSurfaces:[...document.querySelectorAll(".site-v2-panel")].map(panel=>getComputedStyle(panel).backgroundColor),
   heroAfter:getComputedStyle(document.querySelector(".site-v2-hero"),"::after").content,
   panelBorders:[...document.querySelectorAll(".site-v2-panel")].map(panel=>getComputedStyle(panel).borderTopWidth),
   panelShadows:[...document.querySelectorAll(".site-v2-panel")].map(panel=>getComputedStyle(panel).boxShadow),
   energyOutline:[getComputedStyle(document.querySelector(".site-v2-panel--energy")).outlineStyle,getComputedStyle(document.querySelector(".site-v2-panel--energy")).outlineWidth]
  };
 });
 assert.ok(heroMapLayout.topInset<=1.5&&heroMapLayout.rightInset<=1.5&&heroMapLayout.bottomInset<=1.5&&heroMapLayout.leftInset<=1.5,"the map fills all four hero edges");
 assert.equal(heroMapLayout.borderWidth,"0px","the map has no outline");
 assert.equal(heroMapLayout.borderRadius,"26px","the map inherits the hero radius so no square inner corners show");
 assert.equal(heroMapLayout.heroClipPath,"none","the hero does not clip away its own rounded border");
 assert.equal(heroMapLayout.heroBefore,"none","the Hero adds no map veil or mask while the map design is paused");
 assert.equal(heroMapLayout.sharpFilter,"none","the focal region keeps a completely sharp map image underneath");
 assert.equal(heroMapLayout.blurFilter,"blur(10px)","the outer region reaches a fixed 10px Gaussian blur");
 assert.match(heroMapLayout.blurMask,/linear-gradient\(28deg.*42%.*78%/i,"the blur grows through the widened annotated red-to-green band");
 assert.equal(heroMapLayout.blurInset,"-10px","the blurred layer overscans enough to avoid a soft transparent edge");
 assert.equal(heroMapLayout.mapOpacity,"1","the blurred map layer remains fully opaque where its mask is visible");
 assert.equal(heroMapLayout.addressBackground,"rgba(0, 0, 0, 0)","the address has no local card fill");
 assert.equal(heroMapLayout.addressMask,"none","the address no longer adds a bottom gradient mask");
 assert.equal(heroMapLayout.heroBorder,"1px","the hero card keeps a shallow boundary against the page");
 const heroBorderTokenColor=await page.evaluate(()=>{
  const probe=document.createElement("span");
  probe.style.color="var(--wd-separator-nonopaque)";
  document.body.append(probe);
  const color=getComputedStyle(probe).color;
  probe.remove();
  return color;
 });
 assert.equal(heroMapLayout.heroBorderColor,heroBorderTokenColor,"the hero border uses the shared separator token");
 assert.equal(heroMapLayout.heroShadow,"none","the hero does not rely on a shadow");
 assert.equal(heroMapLayout.heroBackground,"none","the hero uses a clean solid surface without a pale radial wash");
 assert.equal(heroMapLayout.heroSurface,heroMapLayout.panelSurface,"the hero uses the same card surface color as the cards below");
 assert.equal(await page.locator(".site-v2-panel--energy").evaluate(panel=>getComputedStyle(panel).backgroundColor),heroMapLayout.heroSurface,"Energy & tariff uses the shared card surface");
 assert.equal(new Set(heroMapLayout.panelSurfaces).size,1,"all information cards share one surface color");
 assert.equal(heroMapLayout.heroSurface,"rgb(28, 28, 30)","the dark card surface matches the Service Ticket card background");
 assert.equal(await page.evaluate(()=>{
  const surface=getComputedStyle(document.querySelector(".site-v2-hero")).backgroundColor;
  const page=getComputedStyle(document.querySelector(".plants-detail-inner")).backgroundColor;
  return surface!==page&&surface!=="rgba(0, 0, 0, 0)";
 }),true,"the shared card surface remains visibly distinct from the page background");
 assert.equal(heroMapLayout.heroAfter,"none","the white decorative hero overlay is removed");
 assert.deepEqual(heroMapLayout.panelBorders,["0px","0px","0px","0px","0px"],"every information card is borderless");
 assert.deepEqual(heroMapLayout.panelShadows,["none","none","none","none","none"],"cards below the hero have no shadow");
 assert.deepEqual(heroMapLayout.energyOutline,["none","0px"],"Energy & tariff has no outer outline");
 const panelTextSizes=await page.locator(".site-v2-info-label,.site-v2-info-value,.site-v2-owner-name,.site-v2-owner-meta,.site-v2-installer-label,.site-v2-installer-company,.site-v2-installer-contact-name,.site-v2-picture-empty,.site-v2-visitor-empty").evaluateAll(nodes=>[...new Set(nodes.map(node=>getComputedStyle(node).fontSize))].sort());
 assert.deepEqual(panelTextSizes,["12px","13px","14px"],"Installer and Owner contacts use the compact contact scale");
 const installerLayout=await page.locator(".site-v2-panel--installer").evaluate(panel=>{
  const company=panel.querySelector(".site-v2-installer-company-row");
  const contact=panel.querySelector(".site-v2-installer-contact-row");
  const methods=panel.querySelector(".site-v2-installer-methods");
  const companyValue=panel.querySelector(".site-v2-installer-company");
  const contactValue=panel.querySelector(".site-v2-installer-contact-name");
  const companyLabel=company.querySelector(".site-v2-installer-label");
  const contactLabel=contact.querySelector(".site-v2-installer-label");
  const methodText=[...methods.querySelectorAll(".site-v2-installer-method-copy")];
  const alarm=panel.querySelector(".site-v2-installer-alarm");
  const alarmBox=alarm.getBoundingClientRect();
  const panelRect=panel.getBoundingClientRect();
  const panelBox=panel.getBoundingClientRect();
  return{
   backgrounds:[company,contact,methods].map(node=>getComputedStyle(node).backgroundColor),
   radii:[company,contact,methods].map(node=>getComputedStyle(node).borderRadius),
   shadows:[company,contact,methods].map(node=>getComputedStyle(node).boxShadow),
   companyWidth:company.getBoundingClientRect().width,
   contactWidth:contact.getBoundingClientRect().width,
   contentWidth:panelBox.width-parseFloat(getComputedStyle(panel).paddingLeft)-parseFloat(getComputedStyle(panel).paddingRight),
   companyColumns:getComputedStyle(company).gridTemplateColumns,
   contactColumns:getComputedStyle(contact).gridTemplateColumns,
   companyType:`${getComputedStyle(companyValue).fontSize}/${getComputedStyle(companyValue).fontWeight}`,
   contactType:`${getComputedStyle(contactValue).fontSize}/${getComputedStyle(contactValue).fontWeight}`,
   groupIcons:[company.querySelectorAll(":scope>.site-v2-info-group-icon").length,contact.querySelectorAll(":scope>.site-v2-info-group-icon").length],
   groupMasks:[getComputedStyle(company.querySelector(":scope>.site-v2-info-group-icon")).maskImage,getComputedStyle(contact.querySelector(":scope>.site-v2-info-group-icon")).maskImage],
   labelColors:[getComputedStyle(companyLabel).color,getComputedStyle(contactLabel).color],
   gridPriceLabelColor:getComputedStyle(document.querySelector(".site-v2-panel--energy .site-v2-info-label")).color,
   iconColors:[getComputedStyle(company.querySelector(":scope>.site-v2-info-group-icon")).backgroundColor,getComputedStyle(contact.querySelector(":scope>.site-v2-info-group-icon")).backgroundColor],
   iconOpacities:[getComputedStyle(company.querySelector(":scope>.site-v2-info-group-icon")).opacity,getComputedStyle(contact.querySelector(":scope>.site-v2-info-group-icon")).opacity],
   iconCenterOffsets:[company,contact].map(group=>{
    const icon=group.querySelector(":scope>.site-v2-info-group-icon").getBoundingClientRect();
    const content=group.querySelector(":scope>.site-v2-info-group-content").getBoundingClientRect();
    return Math.abs((icon.top+icon.height/2)-(content.top+content.height/2));
   }),
   labelIcons:[companyLabel.querySelectorAll(".site-v2-installer-group-icon").length,contactLabel.querySelectorAll(".site-v2-installer-group-icon").length],
   avatarCount:panel.querySelectorAll(".site-v2-installer-avatar").length,
   methodCount:methods.querySelectorAll(".site-v2-installer-method-copy").length,
   methodSeparators:methods.querySelectorAll(".site-v2-installer-method-separator").length,
   methodButtons:[...methods.querySelectorAll(".site-v2-installer-method-copy")].map(button=>({tag:button.tagName,type:button.type,href:button.getAttribute("href")})),
   methodLabels:methods.querySelectorAll(".site-v2-installer-method-label").length,
   methodFormats:[...new Set(methodText.map(node=>`${getComputedStyle(node).fontSize}/${getComputedStyle(node).fontWeight}/${getComputedStyle(node).lineHeight}/${getComputedStyle(node).color}`))],
   alarmDivider:getComputedStyle(alarm).borderTopWidth,
   alarmFullBleed:Math.abs(alarmBox.left-panelRect.left)<1&&Math.abs(alarmBox.right-panelRect.right)<1
  };
 });
 assert.equal(installerLayout.backgrounds.every(background=>background==="rgba(0, 0, 0, 0)"),true,"Installer information groups do not add individual rectangular fills");
 assert.equal(installerLayout.radii.every(radius=>radius==="0px"),true,"Installer information groups keep square, continuous surfaces");
 assert.equal(installerLayout.shadows.every(shadow=>shadow==="none"),true,"Installer information groups do not add elevation");
 assert.ok(Math.abs(installerLayout.companyWidth-installerLayout.contentWidth)<1,"Installer company occupies the full content width");
 assert.ok(Math.abs(installerLayout.contactWidth-installerLayout.contentWidth)<1,"Contact summary occupies the full content width");
 assert.equal(installerLayout.companyColumns,installerLayout.contactColumns,"Installer company and Contact use the same label/value columns");
 assert.equal(installerLayout.companyType,"14px/510","Installer company uses the compact medium text style");
 assert.equal(installerLayout.contactType,"14px/510","Contact name uses the same compact medium text style");
 assert.deepEqual(installerLayout.groupIcons,[1,1],"Installer company and Contact groups each start with one matching icon");
 assert.equal(installerLayout.groupMasks.every(mask=>mask!=="none"),true,"Installer group icons use local icon masks");
 assert.deepEqual(installerLayout.labelIcons,[0,0],"Icons sit before each information group rather than before its label");
 assert.deepEqual(installerLayout.labelColors,[installerLayout.gridPriceLabelColor,installerLayout.gridPriceLabelColor],"Installer group labels use the same secondary color as Grid price");
 assert.deepEqual(installerLayout.iconColors,[installerLayout.gridPriceLabelColor,installerLayout.gridPriceLabelColor],"Installer group icons use the Grid price label color");
 assert.deepEqual(installerLayout.iconOpacities,["0.78","0.78"],"Installer icons visually match the nearby secondary labels");
 assert.equal(installerLayout.iconCenterOffsets.every(offset=>offset<1),true,"Installer group icons are centered against their full label/value groups");
 assert.equal(installerLayout.avatarCount,0,"Contact does not use an avatar");
 assert.equal(installerLayout.methodCount,2,"Email and Phone are rendered as two direct copy fields");
 assert.equal(installerLayout.methodSeparators,1,"Email and Phone are concatenated with one separator");
 assert.equal(installerLayout.methodButtons.every(button=>button.tag==="BUTTON"&&button.type==="button"&&button.href===null),true,"Contact values are copy buttons rather than navigation links");
 assert.equal(installerLayout.methodLabels,0,"Email and Phone do not repeat title labels");
 assert.equal(installerLayout.methodFormats.length,1,"Email and Phone fields share one typographic format");
 assert.match(installerLayout.methodFormats[0],/^13px\/400\/18px\//,"Email and Phone use 13px / 400 / 18px");
 assert.notEqual(installerLayout.methodFormats[0].split("/").at(-1),"rgb(255, 255, 255)","Contact method text is secondary rather than pure white");
 assert.equal(installerLayout.alarmDivider,"1px","Only the Alarm email setting keeps a separating rule");
 assert.equal(installerLayout.alarmFullBleed,true,"The Alarm email divider spans the full card width");
 const ownerDividers=await page.locator(".site-v2-panel--people").evaluate(panel=>{
  const panelBox=panel.getBoundingClientRect();
  return [...panel.querySelectorAll(".site-v2-owner")].slice(1).map(row=>{
   const box=row.getBoundingClientRect();
   return{
    left:Math.abs(box.left-panelBox.left),
    right:Math.abs(box.right-panelBox.right),
    contentLeft:row.querySelector(".site-v2-owner-avatar").getBoundingClientRect().left-(panelBox.left+20)
   };
  });
 });
 assert.equal(ownerDividers.every(item=>item.left<1&&item.right<1),true,"Owner row dividers span the full card width");
 assert.equal(ownerDividers.every(item=>Math.abs(item.contentLeft)<1),true,"Owner row content keeps its original 20px card inset");
 const alarmInfo=page.locator('.site-v2-alarm-info[aria-label="About alarm emails"]');
 assert.equal(await alarmInfo.count(),1,"Alarm email exposes an information button");
 assert.equal(await alarmInfo.evaluate(button=>`${button.offsetWidth}x${button.offsetHeight}`),"14x14","Alarm info control stays compact and circular");
 assert.equal(await alarmInfo.evaluate(button=>getComputedStyle(button).cursor),"pointer","Alarm info uses a normal pointer instead of the help cursor");
 assert.equal(await alarmInfo.evaluate(button=>getComputedStyle(button).borderTopWidth),"0px","Alarm info has no outline");
 const alarmInfoGlyph=await alarmInfo.evaluate(button=>{
  const glyph=button.querySelector(".site-v2-alarm-info-glyph");
  return{
   color:getComputedStyle(glyph).color,
   background:getComputedStyle(glyph).backgroundColor,
   mask:getComputedStyle(glyph).maskImage,
   iconSource:glyph.dataset.iconSource,
   labelColor:getComputedStyle(button.closest(".site-v2-installer-alarm").querySelector(".site-v2-installer-label")).color,
   buttonBackground:getComputedStyle(button).backgroundColor
  };
 });
 assert.equal(alarmInfoGlyph.buttonBackground,"rgba(0, 0, 0, 0)","the info control adds no separate backplate");
 assert.equal(alarmInfoGlyph.background,alarmInfoGlyph.labelColor,"the icon mask uses the same secondary ink as the label");
 assert.equal(alarmInfoGlyph.color,alarmInfoGlyph.labelColor,"the info button inherits the exact same color as its label");
 assert.match(alarmInfoGlyph.mask,/url\(/i,"the user-provided info2.svg is used as a local mask");
 assert.equal(alarmInfoGlyph.iconSource,"info2");
 await alarmInfo.hover();
 await page.waitForTimeout(420);
 const alarmInfoHover=await alarmInfo.evaluate(button=>({
  background:getComputedStyle(button).backgroundColor,
  glyphBackground:getComputedStyle(button.querySelector(".site-v2-alarm-info-glyph")).backgroundColor,
  primaryColor:getComputedStyle(document.querySelector(".site-v2-panel-title")).color
 }));
 assert.equal(alarmInfoHover.background,"rgba(0, 0, 0, 0)","hover adds no backplate");
 assert.equal(alarmInfoHover.glyphBackground,alarmInfoHover.primaryColor,"hover promotes the icon mask to the primary theme ink");
 await alarmInfo.hover();
 await page.waitForFunction(()=>document.querySelector(".site-v2-alarm-info-popover")?.getBoundingClientRect().height>0);
 assert.equal(
  (await page.locator(".site-v2-alarm-info-copy").textContent()).trim(),
  "Alarm emails will be sent to the installer contact email when selected critical device alarms occur.",
  "Alarm info shows the reference explanation"
 );
 assert.equal(await page.locator(".site-v2-alarm-info-popover.wd-glass--surface").count(),1,"Alarm info uses the shared Glass Surface");
 assert.equal(await alarmInfo.getAttribute("aria-describedby"),await page.locator(".site-v2-alarm-info-popover").getAttribute("id"),"Alarm info links its tooltip for assistive technology");
 await page.screenshot({path:"tests/output/site-details-v2-alarm-info.png"});
 await page.mouse.move(0,0);
 await page.waitForFunction(()=>!document.querySelector(".site-v2-alarm-info-popover"));
 assert.equal(await page.locator('.site-v2-installer-methods a[href^="mailto:"],.site-v2-installer-methods a[href^="tel:"]').count(),0,"contact values do not navigate away from the page");
 await page.locator('.site-v2-panel--installer .site-v2-installer-method-copy[aria-label^="Copy Email:"]').click();
 await page.waitForFunction(()=>document.querySelector("#toast")?.textContent.includes("Email copied"));
 assert.equal(await page.locator('.site-v2-add-picture.wd-glass[aria-label="Add picture"]').count(),1,"the picture action is a compact glass icon button in the card header");
 assert.equal(await page.locator(".site-v2-panel--media .site-v2-picture-row .wd-button").count(),0,"Plant picture keeps its body free of oversized action buttons");
 assert.equal(await page.locator(".site-v2-panel--media .site-v2-picture-glyph").count(),1,"Plant picture uses the same panel title icon rhythm");
 assert.equal(await page.locator(".site-v2-media-placeholder").count(),0,"Plant picture uses the compact previous-page treatment instead of the heavy placeholder");
 assert.equal(await page.locator('.site-v2-add-account[aria-label="Add account"]').count(),1,"Owner information exposes an add-account action");
 assert.equal(await page.locator(".site-v2-panel--people .site-v2-owner").count(),3,"Owner information shows three populated account rows");
 assert.equal(await page.locator('.site-v2-owner-options[aria-label="Actions for Carl Wang"]').count(),1,"the active account exposes its options action");
 assert.equal(await page.locator('.site-v2-owner-options[aria-label="Actions for Maria Hoffmann"]').count(),1,"the second demo account is fully populated");
 assert.equal(await page.locator('.site-v2-owner-options[aria-label="Actions for Jonas Weber"]').count(),1,"the third demo account is fully populated");
 assert.equal(await page.locator(".site-v2-panel--people .site-v2-owner-options-icon").count(),3,"every account uses the same three-dot options icon");
 await page.mouse.move(0,0);
 await page.waitForTimeout(360);
 const ownerContactLayout=await page.evaluate(()=>{
  const installerMethods=[...document.querySelectorAll(".site-v2-installer-methods .site-v2-installer-method-copy")];
  const ownerButtons=[...document.querySelectorAll(".site-v2-owner-meta .site-v2-installer-method-copy")];
  const format=node=>{
   const style=getComputedStyle(node);
   return`${style.fontSize}/${style.fontWeight}/${style.lineHeight}/${style.color}/${style.cursor}`;
  };
  return{
   installerFormats:[...new Set(installerMethods.map(format))],
   ownerFormats:[...new Set(ownerButtons.map(format))],
   ownerButtonCount:ownerButtons.length,
   ownerLinkCount:document.querySelectorAll(".site-v2-owner-meta a").length,
   separatorCount:document.querySelectorAll(".site-v2-owner-meta .site-v2-installer-method-separator").length,
   buttonTypes:ownerButtons.every(button=>button.tagName==="BUTTON"&&button.type==="button"),
   copyValues:ownerButtons.every(button=>Boolean(button.dataset.copyValue))
  };
 });
 assert.equal(ownerContactLayout.installerFormats.length,1,"Installer contact fields share one exact format");
 assert.deepEqual(ownerContactLayout.ownerFormats,ownerContactLayout.installerFormats,"Owner contacts match Installer typography, color and pointer feedback");
 assert.equal(ownerContactLayout.ownerButtonCount,6,"each Owner row exposes copyable email and phone values");
 assert.equal(ownerContactLayout.ownerLinkCount,0,"Owner contact values no longer navigate via mail or telephone links");
 assert.equal(ownerContactLayout.separatorCount,3,"each Owner row places one divider between email and phone");
 assert.equal(ownerContactLayout.buttonTypes&&ownerContactLayout.copyValues,true,"Owner contact values are copy buttons with explicit values");
 await page.screenshot({path:"tests/output/site-details-v2-owner-contacts.png"});
 await page.locator('.site-v2-owner-meta .site-v2-installer-method-copy[aria-label^="Copy Phone number:"]').first().click();
 await page.waitForFunction(()=>document.querySelector("#toast")?.textContent.includes("Phone number copied"));
 assert.equal(await page.locator(".site-v2-panel--visitors .site-v2-visitor-empty").count(),1,"visitor state is isolated in its own card");
 assert.equal(await page.locator(".site-v2-panel--people .site-v2-panel--visitors").count(),0);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector(".site-v2-visitor-empty")).color===getComputedStyle(document.querySelector(".site-v2-picture-empty")).color),true,"empty Visitor and Plant picture copy use the same muted color");
 const pictureGlyph=await page.locator(".site-v2-panel--media .site-v2-picture-glyph").evaluate(glyph=>({
  stroke:getComputedStyle(glyph).stroke,
  fill:getComputedStyle(glyph).fill,
  iconStyle:glyph.dataset.iconStyle,
  pathCount:glyph.querySelectorAll("path").length,
  fillRule:glyph.querySelector("path")?.getAttribute("fill-rule")
 }));
 assert.equal(pictureGlyph.stroke,"none","Plant picture uses a filled title icon");
 assert.notEqual(pictureGlyph.fill,"none","Plant picture title icon paints a solid face");
 assert.equal(pictureGlyph.iconStyle,"solid","Plant picture title icon is explicitly marked as solid");
 assert.equal(pictureGlyph.pathCount,1,"Plant picture uses one continuous solid silhouette with negative details");
 assert.equal(pictureGlyph.fillRule,"evenodd","Plant picture cuts its picture details as negative space");
 assert.equal(await page.locator(".site-v2-panel--media.is-empty-picture .site-v2-picture-row").evaluate(row=>getComputedStyle(row).minHeight),"20px","empty Plant picture no longer reserves a tall placeholder");
 await page.locator('.site-v2-owner-options[aria-label="Actions for Carl Wang"]').click();
 await page.waitForFunction(()=>document.querySelector(".site-v2-account-menu")?.getBoundingClientRect().height>0);
 assert.equal(await page.locator(".site-v2-account-menu .wd-menu-row").count(),2,"the account options action opens its edit/access menu");
 const accountMenuIcons=await page.locator(".site-v2-account-menu .wd-menu-row").evaluateAll(rows=>rows.map(row=>{
  const icon=row.querySelector(".target-nav-icon .site-v2-account-menu-glyph");
  const label=row.querySelector(".wd-menu-label");
  return{
   present:Boolean(icon),
   position:icon&&label?icon.getBoundingClientRect().right<label.getBoundingClientRect().left:false,
   labelFullyVisible:label?label.scrollWidth<=label.clientWidth:false,
   geometry:icon?`${Math.round(icon.getBoundingClientRect().width)}x${Math.round(icon.getBoundingClientRect().height)}`:"",
   iconStyle:icon?.dataset.iconStyle||"",
   fill:icon?getComputedStyle(icon).fill:"",
   color:icon?getComputedStyle(icon).color:"",
   stroke:icon?getComputedStyle(icon).stroke:"",
   pathCount:icon?icon.querySelectorAll("path").length:0
  };
 }));
 assert.equal(accountMenuIcons.every(item=>item.present),true,"both account actions have semantic icons");
 assert.equal(accountMenuIcons.every(item=>item.position),true,"account action icons sit before their labels");
 assert.equal(accountMenuIcons.every(item=>item.labelFullyVisible),true,"account action icons do not squeeze the labels");
 assert.equal(accountMenuIcons.every(item=>item.geometry==="16x16"),true,"account action icons use a consistent 16px glyph box");
 assert.equal(accountMenuIcons.every(item=>item.iconStyle==="solid"),true,"account action icons are explicitly solid");
 assert.equal(accountMenuIcons.every(item=>item.stroke==="none"),true,"account action icons contain no outline strokes");
 assert.equal(accountMenuIcons.every(item=>item.fill===item.color),true,"account action icons fill with the inherited menu ink");
 assert.equal(accountMenuIcons.every(item=>item.pathCount>=2),true,"account action icons use filled silhouettes with continuous negative details");
 await page.waitForTimeout(420);
 await page.screenshot({path:"tests/output/site-details-v2-account-menu.png"});
 await page.keyboard.press("Escape");
 await page.waitForFunction(()=>!document.querySelector(".site-v2-account-menu"));
 assert.equal(await page.locator(".site-v2-alarm-switch").isDisabled(),true,"Alarm email is read-only outside edit mode");
 await page.locator(".site-v2-edit").click();
 assert.equal(await page.locator(".site-v2-hero-title-input.site-details-page-title-input").count(),1,"the plant title uses the shared title editor");
 assert.equal(await page.locator(".site-v2-hero-title-input").inputValue(),"Wärmeverbund Nord");
 const titleEditorGeometry=await page.evaluate(()=>{
  const region=document.querySelector(".site-v2-title-region").getBoundingClientRect();
  const input=document.querySelector(".site-v2-hero-title-input");
  const editor=input.closest(".site-v2-title-editor");
  const inputBox=input.getBoundingClientRect();
  const editorBox=editor.getBoundingClientRect();
  const style=getComputedStyle(input);
  const editorStyle=getComputedStyle(editor);
  return{
   width:inputBox.width,
   regionWidth:region.width,
   left:inputBox.left,
   regionLeft:region.left,
   contentLeft:inputBox.left+parseFloat(style.paddingLeft),
   contentTop:inputBox.top+parseFloat(style.paddingTop),
   inputHeight:inputBox.height,
   editorLeft:editorBox.left,
   editorWidth:editorBox.width,
   editorHeight:editorBox.height,
   paddingLeft:style.paddingLeft,
   paddingRight:style.paddingRight,
   editorGlass:editor.classList.contains("wd-glass"),
   editorMaterials:editor.querySelectorAll(":scope>.wd-glass-material").length,
   editorBlur:editorStyle.backdropFilter,
   editorBackground:editorStyle.backgroundColor,
   editorShadow:editorStyle.boxShadow,
   inputBackground:style.backgroundColor
  };
 });
 assert.ok(Math.abs(titleEditorGeometry.width-titleEditorGeometry.editorWidth)<1,"the transparent textarea fills its glass backing");
 assert.ok(Math.abs(titleEditorGeometry.contentLeft-viewTitleLeft)<1,"title text stays at the same X coordinate in edit mode");
 assert.ok(Math.abs(titleEditorGeometry.contentTop-viewTitleTop)<1,"title text stays on the same baseline in edit mode");
 assert.ok(Math.abs(titleEditorGeometry.contentLeft-titleEditorGeometry.regionLeft)<1,"title text remains aligned to the view title's left edge");
 assert.ok(Math.abs(titleEditorGeometry.editorLeft-(titleEditorGeometry.regionLeft-14))<1,"the glass backing extends left to preserve the text position");
 assert.ok(Math.abs(titleEditorGeometry.editorWidth-(titleEditorGeometry.regionWidth+28))<1,"the glass backing adds matching side padding");
 assert.ok(Math.abs(titleEditorGeometry.editorHeight-titleEditorGeometry.inputHeight)<1,"the title editor adds no extra grey strip below the textarea");
 assert.ok(parseFloat(titleEditorGeometry.paddingLeft)>=14&&parseFloat(titleEditorGeometry.paddingRight)>=14,"title text keeps clear of both editor edges");
 assert.equal(titleEditorGeometry.editorGlass,false,"the title editor does not use the full glass material");
 assert.equal(titleEditorGeometry.editorMaterials,0,"the title editor has no glass highlight or rim layer");
 assert.match(titleEditorGeometry.editorBlur,/blur\(14px\)/i,"the title editor background uses Gaussian blur");
 assert.notEqual(titleEditorGeometry.editorBackground,"rgba(0, 0, 0, 0)","the title editor carries the shallow grey field fill");
 assert.equal(titleEditorGeometry.editorShadow,"none","the title editor has no glow or shadow");
 assert.equal(titleEditorGeometry.inputBackground,"rgba(0, 0, 0, 0)","the textarea itself stays transparent above the glass");
 await page.locator(".site-v2-hero-title-input").fill("Wärmeverbund Nord — Erweiterung West with a deliberately longer plant title");
 assert.equal(await page.locator(".site-v2-hero-title-input").inputValue(),"Wärmeverbund Nord — Erweiterung West with a deliberately longer plant title");
 assert.ok(await page.locator(".site-v2-hero-title-input").evaluate(input=>input.getBoundingClientRect().height>44),"long plant titles wrap and grow instead of clipping");
 await page.screenshot({path:"tests/output/site-details-v2-edit.png"});
 await page.locator(".site-v2-hero-title-input").fill("Wärmeverbund Nord");
 assert.equal(await page.locator(".site-v2-map-copy.is-editing").count(),1,"the map location enters edit mode");
 assert.equal(await page.locator(".site-v2-map-select.wd-edit-field").count(),1,"Country is editable through the shared edit field style");
 assert.equal(await page.locator(".site-v2-map-input.wd-edit-field").count(),1,"Address is editable through the shared edit field style");
 assert.equal(await page.locator(".site-v2-map-pin").isVisible(),false,"the location pin is hidden while editing");
 assert.equal((await page.locator(".site-v2-map-select").textContent()).trim(),"Germany");
 assert.equal(await page.locator(".site-v2-map-input").inputValue(),demoAddress);
 assert.equal(await page.locator(".site-v2-panel--installer .site-v2-select").count(),2,"Installer and Contact become selectable in edit mode");
 assert.equal(await page.locator(".site-v2-panel--energy .site-v2-energy-input").count(),1,"Grid price becomes editable");
 assert.equal(await page.locator(".site-v2-panel--energy .site-v2-energy-select").count(),3,"Currency, Price area and Timezone become editable");
 assert.equal(await page.locator(".site-v2-panel--energy .site-v2-energy-select.wd-edit-field").count(),3,"Energy selectors use the shared edit-field style");
 assert.equal(await page.locator(".site-details-select-trigger").count(),6,"map, installer and energy selects use one shared trigger style");
 const selectMaterials=await page.locator(".site-details-select-trigger").evaluateAll(nodes=>nodes.map(node=>({
  glass:node.classList.contains("wd-glass"),
  materials:node.querySelectorAll(":scope>.wd-glass-material").length,
  blur:getComputedStyle(node).backdropFilter,
  background:getComputedStyle(node).backgroundColor,
  shadow:getComputedStyle(node).boxShadow
 })));
 assert.equal(selectMaterials.every(item=>!item.glass&&item.materials===0),true,"select triggers avoid the full glass highlight material");
 assert.equal(selectMaterials.every(item=>/blur\(14px\)/i.test(item.blur)),true,"select triggers share the Gaussian-blurred grey field");
 assert.equal(selectMaterials.every(item=>item.background!=="rgba(0, 0, 0, 0)"),true,"select triggers retain a shallow grey fill");
 assert.equal(selectMaterials.every(item=>item.shadow==="none"),true,"select triggers add no glow or shadow");
 const installerSelectGeometry=await page.locator(".site-v2-panel--installer").evaluate(panel=>{
  const companySelect=panel.querySelector(".site-v2-installer-company-row .site-v2-installer-select");
  const companyContent=companySelect.closest(".site-v2-info-group-content").getBoundingClientRect();
  const contactSelect=panel.querySelector(".site-v2-installer-contact-copy .site-v2-installer-select");
  const contactContent=contactSelect.closest(".site-v2-info-group-content").getBoundingClientRect();
  return{
   companyEditLeft:Math.abs(companySelect.getBoundingClientRect().left-companyContent.left),
   contactEditLeft:Math.abs(contactSelect.getBoundingClientRect().left-contactContent.left),
   companyAdaptive:companySelect.getBoundingClientRect().width<companyContent.width-1,
   contactAdaptive:contactSelect.getBoundingClientRect().width<contactContent.width-1,
   companyJustify:getComputedStyle(companySelect).justifyContent,
   contactJustify:getComputedStyle(contactSelect).justifyContent
  };
 });
 assert.ok(installerSelectGeometry.companyEditLeft<1&&installerSelectGeometry.contactEditLeft<1,"Company and Contact selects start at the left edge of their text groups");
 assert.equal(installerSelectGeometry.companyAdaptive&&installerSelectGeometry.contactAdaptive,true,"Installer selects use content-adaptive widths instead of filling the card");
 assert.equal(installerSelectGeometry.companyJustify==="flex-start"&&installerSelectGeometry.contactJustify==="flex-start",true,"Installer select labels remain left-aligned in edit mode");
 assert.equal(await page.locator(".site-v2-panel--energy .site-v2-info-row").evaluateAll(rows=>rows.every(row=>row.getBoundingClientRect().height===44)),true,"Energy rows keep the shorter height in edit mode");
 const editEnergyTextLayout=await page.locator(".site-v2-panel--energy").evaluate(panel=>({
  height:panel.getBoundingClientRect().height,
  titleTop:panel.querySelector(".site-v2-panel-title").getBoundingClientRect().top,
  labels:[...panel.querySelectorAll(".site-v2-info-label")].map(label=>label.textContent.trim()),
  labelTops:[...panel.querySelectorAll(".site-v2-info-label")].map(label=>label.getBoundingClientRect().top)
 }));
 assert.ok(Math.abs(editEnergyTextLayout.height-viewEnergyTextLayout.height)<1,"Energy & tariff keeps one card height across read-only and edit modes");
 assert.ok(Math.abs(editEnergyTextLayout.titleTop-viewEnergyTextLayout.titleTop)<1,"the fixed Energy title does not move in edit mode");
 assert.deepEqual(editEnergyTextLayout.labels,viewEnergyTextLayout.labels,"Energy & tariff keeps the same row order in edit mode");
 assert.equal(editEnergyTextLayout.labelTops.every((top,index)=>Math.abs(top-viewEnergyTextLayout.labelTops[index])<1),true,"the fixed Energy row labels do not move in edit mode");
 assert.equal(await page.locator(".site-v2-installer-method-copy").count(),8,"Installer and Owner email/phone values remain copyable in edit mode");
 assert.equal(await page.locator(".site-v2-alarm-switch").isDisabled(),false,"Alarm email can be toggled in edit mode");
 await page.locator(".site-v2-energy-input").fill("0.41");
 assert.equal(await page.locator(".site-v2-energy-input").inputValue(),"0.41","the grid price accepts decimal input");
 await page.locator('.site-v2-energy-select[aria-label="Currency"]').click();
 assert.equal(await page.locator(".site-details-select-popover").isVisible(),true,"Currency opens the shared Glass select popover");
 await page.locator('.site-details-select-popover [data-value="SEK"]').click();
 assert.equal((await page.locator('.site-v2-energy-select[aria-label="Currency"]').textContent()).trim(),"SEK");
 assert.equal((await page.locator(".site-v2-energy-unit").textContent()).trim(),"SEK","the grid-price unit follows the selected currency");
 await page.locator(".site-v2-map-select").click();
 assert.equal(await page.locator(".site-details-select-popover").isVisible(),true,"Country opens the shared Glass select popover");
 await page.locator('.site-details-select-popover [data-value="Austria"]').click();
 await page.locator(".site-v2-map-input").fill("Langer Stationsweg 128, 1010 Wien");
 assert.equal((await page.locator(".site-v2-map-select").textContent()).trim(),"Austria");
 assert.equal(await page.locator(".site-v2-map-input").inputValue(),"Langer Stationsweg 128, 1010 Wien");
 await page.locator(".site-v2-installer-body .site-v2-select").nth(1).click();
 assert.equal(await page.locator(".site-details-select-popover").isVisible(),true,"Contact opens the same shared Glass select popover");
 await page.locator('.site-details-select-popover [data-value="Carl Wang"]').click();
 await page.waitForFunction(()=>[...document.querySelectorAll(".site-v2-installer-method-copy")].some(item=>item.textContent.includes("carl.wang@example.com")));
 const alarmBefore=await page.locator(".site-v2-alarm-switch").getAttribute("aria-checked");
 await page.locator(".site-v2-alarm-switch").click();
 assert.notEqual(await page.locator(".site-v2-alarm-switch").getAttribute("aria-checked"),alarmBefore,"the edit-mode Alarm email switch updates its state");
 await page.locator(".site-v2-cancel").click();
 await page.screenshot({path:"tests/output/site-details-v2-dark.png"});
 await page.locator(".site-v2-edit").click();
 await page.locator(".site-v2-energy-input").fill("0.41");
 await page.locator(".site-v2-save").click();
 assert.deepEqual(
  await page.locator(".site-v2-panel--energy .site-v2-info-label").allTextContents(),
  ["Timezone","Price area","Currency","Grid price"],
  "saved Energy & tariff keeps the requested row order"
 );
 assert.equal((await page.locator(".site-v2-panel--energy .site-v2-info-row").filter({hasText:"Grid price"}).locator(".site-v2-info-value").textContent()).trim(),"0.41 EUR","saved Energy & tariff values return to the read-only view");

 const mapRequests=[];
 const tokenPage=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 await tokenPage.route("https://api.mapbox.com/**",async request=>{
  mapRequests.push(request.request().url());
  await request.fulfill({status:200,contentType:"image/png",body:pixel});
 });
 await tokenPage.goto(`${route}&mapboxToken=pk.test-public-token`,{waitUntil:"domcontentloaded"});
 await tokenPage.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await tokenPage.waitForFunction(()=>document.querySelector(".site-v2-map")?.dataset.mapState==="ready");
 await tokenPage.waitForFunction(()=>document.querySelector(".site-v2-map-bank.is-active")?.dataset.mapTheme==="dark");
 assert.equal(new URL(tokenPage.url()).searchParams.has("mapboxToken"),false,"local token bootstrap is removed from the address bar after use");
 assert.equal(await tokenPage.locator('.site-v2-map-bank[data-map-theme="dark"] .site-v2-map-image--sharp').isVisible(),true,"a configured public token loads the sharp dark Mapbox base image");
 assert.equal(await tokenPage.locator('.site-v2-map-bank[data-map-theme="dark"] .site-v2-map-image--blurred').isVisible(),true,"the same Mapbox response feeds the dark progressive blur layer");
 const initialFade=await tokenPage.locator('.site-v2-map-bank[data-map-theme="dark"]').evaluate(bank=>({
  transitionProperty:getComputedStyle(bank).transitionProperty,
  transitionDuration:getComputedStyle(bank).transitionDuration,
  transitionTimingFunction:getComputedStyle(bank).transitionTimingFunction
 }));
 assert.equal(initialFade.transitionProperty,"opacity","the initial map uses an opacity fade");
 assert.equal(initialFade.transitionDuration,"0.62s","the initial map fade matches the shared theme duration");
 assert.equal(initialFade.transitionTimingFunction,"cubic-bezier(0.4, 0, 0.2, 1)","the initial map fade matches the shared theme easing");
 assert.equal(await tokenPage.locator(".site-v2-map").getAttribute("data-map-reveal"),"animated","the first map entrance in a document fades in");
 await tokenPage.getByRole("button",{name:"Overview",exact:true}).click();
 await tokenPage.waitForFunction(()=>!document.querySelector(".site-v2-map"));
 await tokenPage.getByRole("button",{name:"Site details",exact:true}).click();
 await tokenPage.waitForFunction(()=>document.querySelector(".site-v2-map")?.dataset.mapState==="ready"&&document.querySelector(".site-v2-map-bank.is-active"));
 assert.equal(await tokenPage.locator(".site-v2-map").getAttribute("data-map-reveal"),"immediate","returning to the page in the same document does not replay the map entrance");
 await tokenPage.reload({waitUntil:"domcontentloaded"});
 await tokenPage.waitForFunction(()=>document.documentElement.dataset.ready==="true");
 await tokenPage.waitForFunction(()=>document.querySelector(".site-v2-map")?.dataset.mapState==="ready"&&document.querySelector(".site-v2-map-bank.is-active"));
 assert.equal(await tokenPage.locator(".site-v2-map").getAttribute("data-map-reveal"),"animated","a full page refresh plays the map entrance again");
 const darkMapRequest=[...mapRequests].reverse().find(url=>url.includes("/dark-v11/")&&url.includes("pk.test-public-token"));
 assert.match(darkMapRequest,/styles\/v1\/mapbox\/dark-v11\/static\/\[9\.387003,51\.289094,9\.510599,51\.336306\]\/720x440@2x/,"the dark map uses the final bracketed bbox at zoom 13");
 assert.match(darkMapRequest,/access_token=pk\.test-public-token/);
 assert.equal(new URL(darkMapRequest).searchParams.get("setfilter"),'["boolean",false]',"the map hides the street-label layer");
 assert.equal(new URL(darkMapRequest).searchParams.get("layer_id"),"road-label-simple","the street-label filter targets the shared road label layer");
 await tokenPage.waitForFunction(()=>document.querySelector('.site-v2-map-bank[data-map-theme="light"]')?.dataset.mapReady==="true");
 await tokenPage.locator(".target-theme").click();
 await tokenPage.waitForFunction(()=>document.querySelector(".site-v2-map")?.dataset.mapState==="ready"&&document.documentElement.dataset.theme==="light"&&document.querySelector('.site-v2-map-bank[data-map-theme="light"]')?.classList.contains("is-active"));
 const lightMapRequest=[...mapRequests].reverse().find(url=>url.includes("/light-v11/"));
 assert.match(lightMapRequest,/styles\/v1\/mapbox\/light-v11\/static\/\[9\.387003,51\.289094,9\.510599,51\.336306\]\/720x440@2x/,"theme switching uses the preloaded light map with the same zoom-13 focal bounds");
 const themeCrossfade=await tokenPage.locator(".site-v2-map-bank").evaluateAll(banks=>banks.map(bank=>({
  theme:bank.dataset.mapTheme,
  active:bank.classList.contains("is-active"),
  property:getComputedStyle(bank).transitionProperty,
  duration:getComputedStyle(bank).transitionDuration,
  easing:getComputedStyle(bank).transitionTimingFunction
 })));
 assert.deepEqual(themeCrossfade.map(bank=>bank.theme),["dark","light"]);
 assert.deepEqual(themeCrossfade.map(bank=>bank.active),[false,true],"the light bank crossfades in while the dark bank fades out");
 assert.equal(themeCrossfade.every(bank=>bank.property==="opacity"),true,"theme switching fades both map banks through opacity");
 assert.equal(themeCrossfade.every(bank=>bank.duration==="0.62s"),true,"theme switching uses the shared theme duration");
 assert.equal(themeCrossfade.every(bank=>bank.easing==="cubic-bezier(0.4, 0, 0.2, 1)"),true,"theme switching uses the shared theme easing");
 const lightMapCopy=await tokenPage.evaluate(()=>({
  addressColor:getComputedStyle(document.querySelector(".site-v2-map-address")).color,
  titleColor:getComputedStyle(document.querySelector(".site-v2-title")).color
 }));
 assert.equal(lightMapCopy.addressColor,lightMapCopy.titleColor,"light-theme map copy uses primary dark text");
 assert.notEqual(await tokenPage.locator(".site-v2-map-address-icon").evaluate(icon=>getComputedStyle(icon).color),"rgb(255, 255, 255)","light-theme address icon stays muted");
 const lightMapImage=await tokenPage.locator('.site-v2-map-bank[data-map-theme="light"] .site-v2-map-image--blurred').evaluate(image=>({
  filter:getComputedStyle(image).filter,
  opacity:getComputedStyle(image).opacity
 }));
 assert.equal(lightMapImage.filter,"blur(10px)","the light map keeps the same 10px outer blur");
 assert.equal(Number(lightMapImage.opacity),1,"the light map blur layer remains fully opaque where visible");
 const lightSwitchSurface=await tokenPage.locator(".site-v2-alarm-switch>.wd-glass-material").evaluate(material=>({
  reflection:getComputedStyle(material).getPropertyValue("--wd-glass-reflection-field").trim(),
  rimTop:getComputedStyle(material).getPropertyValue("--wd-glass-rim-top").trim(),
  rimBottom:getComputedStyle(material).getPropertyValue("--wd-glass-rim-bottom").trim(),
  innerTop:getComputedStyle(material).getPropertyValue("--wd-glass-inner-top").trim(),
  innerBottom:getComputedStyle(material).getPropertyValue("--wd-glass-inner-bottom").trim()
 }));
 assert.match(lightSwitchSurface.reflection,/rgba\(255,\s*255,\s*255,\s*\.18\)/i,"the switch uses a subdued light-theme top reflection");
 assert.match(lightSwitchSurface.reflection,/rgba\(255,\s*255,\s*255,\s*\.08\)/i,"the switch removes the strong white bottom shelf");
 assert.equal(lightSwitchSurface.rimTop,"rgba(255,255,255,.48)");
 assert.equal(lightSwitchSurface.rimBottom,"rgba(255,255,255,.24)");
 assert.equal(lightSwitchSurface.innerTop,"rgba(255,255,255,.16)");
 assert.equal(lightSwitchSurface.innerBottom,"rgba(255,255,255,.08)");
 const lightSwitchTint=await tokenPage.locator(".site-v2-alarm-switch>.wd-glass-material").evaluate(material=>({
  tint:getComputedStyle(material).getPropertyValue("--wd-glass-tint").trim(),
  hoverTint:getComputedStyle(material).getPropertyValue("--wd-glass-hover-tint").trim()
 }));
 assert.doesNotMatch(lightSwitchTint.tint,/rgba\(0,\s*0,\s*0/i,"light-theme ON track does not mix blue with black");
 assert.match(lightSwitchTint.tint,/rgba\(0,\s*136,\s*255,[^)]+\) 92%/,"light-theme ON track uses a clean high-chroma blue");
 assert.match(lightSwitchTint.hoverTint,/rgba\(0,\s*136,\s*255,[^)]+\) 96%/,"light-theme hover keeps the same clean blue family");
 await tokenPage.locator(".site-v2-alarm-switch").scrollIntoViewIfNeeded();
 await tokenPage.locator(".site-v2-alarm-switch").screenshot({path:"tests/output/site-details-v2-light-switch.png"});
 const lightLocator=await tokenPage.locator(".site-v2-map-pin").evaluate(pin=>{
  const core=pin.querySelector(".site-v2-map-pin-core");
  const coreStyle=getComputedStyle(core);
  const materialStyle=getComputedStyle(pin.querySelector(":scope>.wd-glass-material"));
  const fillStyle=getComputedStyle(pin.querySelector(".wd-glass-fill"));
  const glintStyle=getComputedStyle(core,"::after");
  const auraStyle=getComputedStyle(pin,"::before");
  return{
   color:getComputedStyle(pin).color,
   coreWidth:coreStyle.width,
   coreBackground:coreStyle.backgroundImage,
   coreBackgroundColor:coreStyle.backgroundColor,
   coreShadow:coreStyle.boxShadow,
   coreAnimation:coreStyle.animationName,
   auraDisplay:auraStyle.display,
   glintDisplay:glintStyle.display,
   glintWidth:glintStyle.width,
   glintBackground:glintStyle.backgroundColor,
   glintShadow:glintStyle.boxShadow,
   materialDisplay:materialStyle.display,
   rippleDisplays:[...pin.querySelectorAll(".site-v2-map-ripple")].map(ripple=>getComputedStyle(ripple).display),
   glassBlur:fillStyle.backdropFilter,
   glassTint:fillStyle.backgroundColor
  };
 });
 assert.equal(lightLocator.coreWidth,"8px","the light-theme locator core gets a slightly larger optical footprint");
 assert.notEqual(lightLocator.color,"rgb(255, 255, 255)","light-theme pulse rings use a darker blue-grey");
 assert.equal(lightLocator.coreBackground,"none","the light-theme dot has no gradient");
 assert.equal(lightLocator.coreBackgroundColor,"rgb(0, 136, 255)","the light-theme dot uses one solid accent blue");
 assert.equal(lightLocator.coreShadow,"none","the light-theme dot has no ring or glow");
 assert.equal(lightLocator.coreAnimation,"none","the light-theme dot does not breathe or pulse");
 assert.equal(lightLocator.auraDisplay,"none","the light-theme breathing aura cannot wash the blue core into a white center");
 assert.equal(lightLocator.glintDisplay,"none","the light-theme blue core hides the separate white center dot");
 assert.equal(lightLocator.materialDisplay,"none","the light-theme locator hides its glass disc entirely");
 assert.deepEqual(lightLocator.rippleDisplays,["none","none"],"the light-theme locator hides both pulse rings");
 await tokenPage.locator(".site-v2-map-pin").hover({position:{x:18,y:18}});
 assert.equal(
  await tokenPage.locator(".site-v2-map-pin .wd-glass-glow").evaluate(glow=>getComputedStyle(glow).display),
  "none",
  "hovering the light-theme locator cannot paint a white pointer highlight over the blue core"
 );
 await tokenPage.locator(".site-v2-map-pin").screenshot({path:"tests/output/site-details-v2-locator-light-hover.png"});
 await tokenPage.locator(".site-v2-map-pin").screenshot({path:"tests/output/site-details-v2-locator-light.png"});
 const lightPinBox=await tokenPage.locator(".site-v2-map-pin").boundingBox();
 await tokenPage.screenshot({path:"tests/output/site-details-v2-locator-light-context.png",clip:{x:lightPinBox.x-52,y:lightPinBox.y-52,width:lightPinBox.width+104,height:lightPinBox.height+104}});
 await tokenPage.screenshot({path:"tests/output/site-details-v2-light-mapbox.png"});
 await tokenPage.close();

 await page.setViewportSize({width:900,height:1100});
 await settle(page);
 const mediumHeroMap=await page.locator(".site-v2-hero").evaluate(hero=>{
  const heroBox=hero.getBoundingClientRect();
  const map=hero.querySelector(".site-v2-map").getBoundingClientRect();
  return{
   display:getComputedStyle(hero).display,
   coverage:Math.abs(hero.clientWidth-map.width)<=1.5&&Math.abs(hero.clientHeight-map.height)<=1.5
  };
 });
 assert.equal(mediumHeroMap.display,"block","the medium breakpoint keeps the integrated hero surface");
 assert.equal(mediumHeroMap.coverage,true,"the map still fills the hero at the medium breakpoint");
 await page.setViewportSize({width:420,height:900});
 await settle(page);
 assert.ok(
  await page.locator(".site-v2-hero").evaluate(hero=>hero.getBoundingClientRect().height>=500),
  "the mobile hero keeps its full content height instead of shrinking inside the page flex column"
 );
 assert.equal(
  await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),
  0,
  "the mobile comparison page has no horizontal page overflow"
 );
 const tabOverflow=await page.locator(".plants-detail-tab-list").evaluate(list=>({
  scrollable:list.scrollWidth>list.clientWidth,
  overflowX:getComputedStyle(list).overflowX,
  selectedVisible:(()=>{
   const selected=list.querySelector(".plants-detail-tab[aria-current='page']");
   const box=selected?.getBoundingClientRect(),listBox=list.getBoundingClientRect();
   return Boolean(box&&box.left>=listBox.left-1&&box.right<=listBox.right+1);
  })()
 }));
 assert.equal(tabOverflow.overflowX,"auto","the narrow tab strip permits horizontal scrolling");
 assert.ok(tabOverflow.scrollable||tabOverflow.selectedVisible,"the selected page tab remains reachable at 420px");
 if(tabOverflow.scrollable){
  assert.equal(
   await page.locator(".plants-detail-tab-list").evaluate(list=>{
    list.scrollLeft=list.scrollWidth;
    return list.scrollLeft>0;
   }),
   true,
   "the narrow tab strip can reach Site details"
  );
 }
 assert.equal(await page.locator(".site-v2-panel").evaluateAll(panels=>new Set(panels.map(panel=>Math.round(panel.getBoundingClientRect().left))).size),1);
 await page.emulateMedia({reducedMotion:"reduce"});
 assert.equal(await page.locator(".site-v2-map-bank").first().evaluate(bank=>getComputedStyle(bank).transitionDuration),"0.001s","reduced motion collapses the map bank fade");
 assert.deepEqual(
  await page.locator(".site-v2-map-pin-core,.site-v2-map-ripple").evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).animationName)),
  ["none","none","none"],
  "reduced motion keeps only the static locator"
 );
 assert.equal(await page.locator(".site-v2-map-pin").evaluate(pin=>getComputedStyle(pin,"::before").animationName),"none");
 await page.screenshot({path:"tests/output/site-details-v2-mobile-dark.png"});

 assert.deepEqual(errors,[]);
 await browser.close();
 console.log(JSON.stringify({ok:true,errors},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
