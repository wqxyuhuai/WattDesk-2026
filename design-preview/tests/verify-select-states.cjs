const {chromium,launchOptions,previewURL}=require("./runtime.cjs");
const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs");

const origin=new URL(previewURL).origin;
const settingsURL=`${origin}/plants/p25/devices/inverter-settings?device=inverter&glass=figma`;

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 await page.emulateMedia({reducedMotion:"no-preference"});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{
  if(message.type()==="error")errors.push(`${message.text()} @ ${message.location().url||"unknown"}`);
 });
 const waitForTitle=async title=>{
  await page.waitForFunction(expected=>document.querySelector(".isw-page-title")?.textContent===expected,title);
  await page.waitForFunction(()=>!document.querySelector(".isw-page--leaving"));
 };
 const read=selector=>page.locator(selector).first().evaluate(node=>{
  const style=getComputedStyle(node);
  return {
   background:style.backgroundColor,
   border:style.borderColor,
   shadow:style.boxShadow,
   color:style.color,
   expanded:node.getAttribute("aria-expanded"),
   hover:node.matches(":hover"),
   focus:node.matches(":focus"),
   focusVisible:node.matches(":focus-visible"),
   active:node.matches(":active"),
   adaptiveFill:style.getPropertyValue("--select-adaptive-fill").trim(),
   editFill:style.getPropertyValue("--wd-edit-field-fill").trim(),
   adaptiveHoverFill:style.getPropertyValue("--select-adaptive-hover-fill").trim(),
   transitionProperty:style.transitionProperty,
   transitionDuration:style.transitionDuration,
   transitionTimingFunction:style.transitionTimingFunction
  };
 });
 const alphaOf=value=>{
  const slash=value.match(/\/\s*([\d.]+)\)/);
  if(slash)return Number(slash[1]);
  const rgba=value.match(/rgba?\([^)]*,\s*([\d.]+)\)/);
  return rgba?Number(rgba[1]):null;
 };
 const sameAlpha=(left,right,label)=>{
  const a=alphaOf(left),b=alphaOf(right);
  assert.ok(Number.isFinite(a)&&Number.isFinite(b),`${label} exposes a measurable alpha`);
  assert.ok(Math.abs(a-b)<=.005,`${label} matches the shared edit-field alpha (${a} vs ${b})`);
 };
 const sampleSelect=async(label,selector,referenceSelector,theme)=>{
  const target=page.locator(selector).first();
  const reference=page.locator(referenceSelector).first();
  await page.evaluate(()=>document.activeElement?.blur());
  await page.mouse.move(0,0);
  await page.waitForTimeout(430);
  const rest=await read(selector);
  await target.hover();
  await page.waitForTimeout(430);
  const hover=await read(selector);
  await reference.hover();
  await page.waitForTimeout(430);
  const referenceHover=await read(referenceSelector);
  await reference.locator("input").focus();
  await page.waitForTimeout(430);
  const referenceFocus=await read(referenceSelector);
  await page.mouse.move(0,0);
  await page.waitForTimeout(430);
  const box=await target.boundingBox();
  assert.ok(box,`${label} exposes a measurable trigger`);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.waitForTimeout(430);
  const pressed=await read(selector);
  await page.mouse.up();
  await page.waitForTimeout(80);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  await page.waitForFunction(selector=>document.querySelector(selector)?.getAttribute("aria-expanded")==="false",selector);
  await page.mouse.move(0,0);
  await page.waitForTimeout(430);
  assert.notEqual(hover.background,rest.background,`${label} changes fill on hover ${JSON.stringify({rest,hover})}`);
  if(theme==="dark"){
   sameAlpha(hover.background,referenceHover.background,`${label} hover fill ${JSON.stringify(hover)}`);
   sameAlpha(hover.border,referenceHover.border,`${label} hover border`);
   sameAlpha(hover.shadow,referenceHover.shadow,`${label} hover shadow`);
   assert.notEqual(pressed.background,hover.background,`${label} has a distinct pressed fill`);
   sameAlpha(pressed.background,referenceFocus.background,`${label} pressed fill`);
   sameAlpha(pressed.border,referenceFocus.border,`${label} pressed border`);
   sameAlpha(pressed.shadow,referenceFocus.shadow,`${label} pressed shadow`);
   assert.match(pressed.shadow,/(?:rgba?\(0,\s*0,\s*0|color\(srgb\s+0\s+0\s+0)/,`${label} keeps its shadow neutral black`);
  }else{
   const quaternary=await page.evaluate(()=>{
    const probe=document.createElement("span");
    probe.style.cssText="position:fixed;left:-9999px;top:0;background-color:var(--wd-fill-quaternary)";
    document.body.append(probe);
    const color=getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
   });
   assert.equal(hover.background,quaternary,`${label} keeps the original light Fills/Quaternary hover`);
   assert.equal(hover.border,rest.border,`${label} keeps the original light idle border`);
   assert.notEqual(hover.shadow,rest.shadow,`${label} keeps the original light hover shadow lift`);
   assert.equal(pressed.background,hover.background,`${label} keeps the original light pressed fill`);
   assert.equal(pressed.border,hover.border,`${label} keeps the original light pressed border`);
   assert.equal(pressed.shadow,hover.shadow,`${label} keeps the original light pressed shadow`);
  }
  assert.match(pressed.transitionProperty,/background-color/);
  assert.equal(pressed.transitionDuration,"0.38s");
  assert.match(pressed.transitionTimingFunction,/cubic-bezier/);
  return {rest,hover,pressed};
 };
 try{
  for(const asset of [
   path.join(__dirname,"..","home-assets","icons","selection","check-circle.svg"),
   path.join(__dirname,"..","home-assets","icons","settings","check-circle.svg")
  ]){
   const source=fs.readFileSync(asset,"utf8");
   assert.doesNotMatch(source,/<mask\b/,"circular checks use one composited path instead of a nested SVG mask");
   assert.match(source,/fill-rule="evenodd"/,"circular checks cut the tick out through a single even-odd path");
   assert.match(source,/shape-rendering="geometricPrecision"/,"circular checks request precise curve rendering");
  }
  await page.goto(settingsURL,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
  await page.evaluate(()=>{document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";});

  await page.locator('[data-isw-go="eco"]').click();
  await waitForTitle("Economic Schedule");
  await sampleSelect("Economic period mode",".isw-eco-mode-trigger",".isw-eco-percent-field","dark");
  await page.locator(".isw-eco-mode-trigger").first().hover();
  await page.waitForTimeout(430);
  await page.screenshot({path:path.join(__dirname,"output","verify-select-states-eco-dark.png")});

  await page.locator('[data-isw-go="touManual"]').click();
  await waitForTitle("ToU Mode");
  await sampleSelect("ToU period mode",".isw-tou-mode-select",".isw-mini-number","dark");
  await page.locator(".isw-tou-mode-select").first().hover();
  await page.waitForTimeout(430);
  await page.screenshot({path:path.join(__dirname,"output","verify-select-states-tou-dark.png")});

  await page.evaluate(()=>{document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";});
  await page.waitForTimeout(700);
  await sampleSelect("ToU period mode · light",".isw-tou-mode-select",".isw-mini-number","light");
  await page.locator(".isw-tou-mode-select").first().click();
  const optionCheck=await page.locator('.wd-select-option[aria-selected="true"] .wd-select-check').first().evaluate(node=>{
   const style=getComputedStyle(node);
   return {
    width:style.width,
    height:style.height,
    radius:style.borderRadius,
    border:style.borderTopWidth,
    mask:style.maskImage
   };
  });
  assert.deepEqual(
   {width:optionCheck.width,height:optionCheck.height,radius:optionCheck.radius,border:optionCheck.border},
   {width:"18px",height:"18px",radius:"0px",border:"0px"},
   "selected Select options use one clean 18px circular drawing without a second border clip"
  );
  assert.match(optionCheck.mask,/check-circle\.svg/);
  await page.screenshot({path:path.join(__dirname,"output","verify-check-mark-option.png")});
  await page.keyboard.press("Escape");
  await page.locator('[data-isw-go="mode"]').click();
  await waitForTitle("Running Mode");
  const modeCheck=await page.locator(".isw-mode-card.is-selected .isw-radio-mark").evaluate(node=>{
   const style=getComputedStyle(node);
   return {
    width:style.width,
    height:style.height,
    radius:style.borderRadius,
    shadow:style.boxShadow,
    border:style.borderTopWidth,
    mask:style.maskImage
   };
  });
  assert.deepEqual(
   {width:modeCheck.width,height:modeCheck.height,radius:modeCheck.radius,shadow:modeCheck.shadow,border:modeCheck.border},
   {width:"18px",height:"18px",radius:"0px",shadow:"none",border:"0px"},
   "selected running-mode checks remove the circular clip and inner ring before masking"
  );
  assert.match(modeCheck.mask,/check-circle\.svg/);
  await page.screenshot({path:path.join(__dirname,"output","verify-check-mark-mode.png")});
  assert.deepEqual(errors,[],"select interaction states render without browser errors");
 }finally{
  await browser.close();
 }
})().catch(error=>{
 console.error(error);
 process.exitCode=1;
});
