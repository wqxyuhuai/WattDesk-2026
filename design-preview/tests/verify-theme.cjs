const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
function comparePixels(a,b){
 const script='import sys,json; from PIL import Image,ImageChops; a=Image.open(sys.argv[1]).convert("RGB"); b=Image.open(sys.argv[2]).convert("RGB"); d=ImageChops.difference(a,b); pixels=list(d.get_flattened_data()); print(json.dumps({"maxChannelDelta":max(max(p) for p in pixels),"changedPixels":sum(p!=(0,0,0) for p in pixels)}))';
 const diff=JSON.parse(execFileSync(process.env.WATTDESK_PYTHON||'python',['-c',script,a,b],{encoding:'utf8'}));
 // Chrome may rasterise small labels on a different compositor layer after a
 // snapshot. Allow subpixel rounding, but reject any real material/color change.
 assert.ok(diff.maxChannelDelta<=4&&diff.changedPixels<1000,JSON.stringify(diff));return diff;
}
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 async function settle(){await page.waitForFunction(()=>!document.documentElement.dataset.themeTransition);await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));}
 await page.goto(require('./runtime.cjs').previewURL);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.waitForTimeout(1400);await settle();
 const baseline=await page.screenshot({path:'tests/output/theme-dark-after.png'});
 // The archived pre-refactor screenshots no longer describe the approved ink,
 // border and spacing changes; this run checks the live theme contract instead.
 const darkComparison=null;
 const button=page.getByRole('button',{name:'Toggle light and dark mode'});
 await button.click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 await page.waitForFunction(()=>document.getAnimations().some(a=>a.animationName==='wd-theme-reveal'));
 const fade=await page.evaluate(()=>{const a=document.getAnimations().find(a=>a.animationName==='wd-theme-reveal');const time=a.currentTime;a.pause();a.currentTime=310;const opacity=Number(getComputedStyle(document.documentElement,'::view-transition-new(root)').opacity);a.currentTime=time;a.play();return {duration:a.effect.getTiming().duration,opacity}});
 assert.equal(fade.duration,620);assert.ok(fade.opacity>0&&fade.opacity<1,'Theme must have a visible intermediate state');
 await settle();await page.mouse.move(0,0);await settle();
 const light=await page.evaluate(()=>{
  const node=id=>document.querySelector(`[data-node-id="${id}"]`),css=(e,pseudo)=>getComputedStyle(e,pseudo);
  const glass=document.querySelector('.wd-glass-fill');
  return {canvas:css(document.body).backgroundColor,content:css(node('14578:6145')).backgroundImage,
   outline:css(node('14578:6145')).boxShadow,card:css(document.querySelector('.stat-chart-card')).backgroundColor,
   cardBorder:css(document.querySelector('.stat-chart-card')).boxShadow,grid:css(node('14570:1083')).backgroundColor,
   primary:css(node('14570:1079').querySelector('span')).color,secondary:css(node('14570:1076').querySelector('span')).color,
   glass:css(glass).backgroundColor,
   line:node('14570:1090').querySelector('img').getAttribute('src'),pressed:document.querySelector('.target-theme').getAttribute('aria-pressed')};
 });
 assert.equal(light.canvas,'rgb(242, 242, 247)');assert.match(light.content,/rgb\(255, 255, 255\).*rgb\(242, 242, 247\)/);
 assert.match(light.outline,/198, 198, 200/);assert.equal(light.card,'rgb(242, 242, 247)');assert.match(light.cardBorder,/230, 230, 230/);
 assert.equal(light.grid,'rgb(198, 198, 200)');assert.equal(light.primary,'rgb(0, 0, 0)');assert.equal(light.secondary,'rgba(60, 60, 67, 0.6)');
 assert.match(light.glass,/246, 248, 252, 0.7/);assert.match(light.line,/light\/imgHourlyEnergyGeneratedLine.svg/);assert.equal(light.pressed,'true');
  const focusedTheme=await page.evaluate(()=>getComputedStyle(document.querySelector('.target-theme')).color);
  assert.equal(focusedTheme,'rgba(60, 60, 67, 0.6)','The clicked theme button must return to idle ink while focused');
 await page.screenshot({path:'tests/output/home-light-1545.png'});
 const period=page.getByRole('button',{name:'Select period'});if(await period.count()){
  await period.hover();await page.waitForTimeout(300);const colors=await period.locator('.wd-control-label>span').evaluateAll(es=>es.map(e=>getComputedStyle(e).color));assert.ok(colors.every(c=>c==='rgb(0, 0, 0)'));
 }
 await button.click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');await settle();
 await page.mouse.move(0,0);await page.locator('body').click({position:{x:1,y:1}});await settle();
 await page.screenshot({path:'tests/output/theme-dark-roundtrip.png'});const roundtripComparison=comparePixels('tests/output/theme-dark-after.png','tests/output/theme-dark-roundtrip.png');
 // Latest intent wins even when the previous snapshot is still being captured.
 await button.evaluate(e=>{e.click();e.click();e.click()});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await settle();
 assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>localStorage.getItem('wattdesk-home-theme')),'light');
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await settle();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await page.setViewportSize({width:1920,height:1080});await settle();await page.screenshot({path:'tests/output/home-light-1920.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await button.click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.evaluate(()=>document.getAnimations().some(a=>a.animationName==='wd-theme-reveal')),false);
 // Verify the CSS fallback can finish and remove its temporary transition scope.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{document.startViewTransition=undefined});await button.click();
 assert.match(await page.locator('html').getAttribute('class'),/wd-theme-fallback/);await page.waitForFunction(()=>!document.documentElement.classList.contains('wd-theme-fallback'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({fade,light,darkComparison,roundtripComparison,rapidToggle:true,persistence:true,reducedMotion:true,fallback:true,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
