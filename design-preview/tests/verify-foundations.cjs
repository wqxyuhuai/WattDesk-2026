const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(require('./runtime.cjs').previewURL);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1100);
 const geometry=await page.locator('.wd-glass,.target-nav,.target-avatar,.target-header-action,.stat-chart-card,[data-node-id="14578:6145"]').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return {radius:s.borderRadius,rect:[b.x,b.y,b.width,b.height]}}));
 // Responsive reflow deliberately changes card/sidebar widths and positions.
 // Keep the archived geometry for provenance, but assert the invariant that
 // matters here: every audited surface retains its original radius.
 const before=JSON.parse(fs.readFileSync('tests/fixtures/foundations-before.json','utf8')).geometry;
 assert.equal(geometry.length,before.length,'The audited surface set changed');
 assert.deepEqual(geometry.map(({radius})=>radius),before.map(({radius})=>radius),'Existing component radii must remain unchanged');
 const source=require('../design/figma/figma-type-source.json');
 const typeAudit=await page.evaluate(source=>{
  const styles=new Map(source.styles.map(row=>[row[0],row]));
  return source.rows.flatMap(([id,styleId])=>{
   const e=document.querySelector(`[data-node-id="${id}"]`);if(!e?.isConnected||e.closest('.target-sidebar,.target-header')||!e.getBoundingClientRect().height)return [];
   const expected=styles.get(styleId),s=getComputedStyle(e),span=e.querySelector('span');
   return [{id,name:expected[1],weight:+s.fontWeight,size:parseFloat(s.fontSize),expectedWeight:expected[2],expectedSize:expected[3],childWeight:span?+getComputedStyle(span).fontWeight:null}];
  });
 },source);
 for(const row of typeAudit){
  // The page headline is an explicit semibold override of the bound Figma style.
  const expectedWeight=row.id==='14445:3352'?590:row.expectedWeight;
  assert.equal(row.weight,expectedWeight,row.id);assert.equal(row.size,row.expectedSize,row.id);
  if(row.childWeight!==null)assert.equal(row.childWeight,expectedWeight,row.id+' span');
 }
 for(const selector of ['.target-nav','.target-quick-search','.target-tab','.target-avatar','[data-node-id="I14578:6106;14420:2221;14420:2195"]']){
  const styles=await page.locator(selector).evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return [s.fontSize,s.fontWeight,s.letterSpacing]}));
  for(const s of styles)assert.deepEqual(s,['14px','510','-0.14px']);
 }
 assert.equal(await page.locator('[data-node-id="14613:1210"]').evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');
 for(const s of await page.locator('.shortcut-link:not(.shortcut-link-last)').evaluateAll(es=>es.filter(e=>e.style.borderBottomStyle==='solid').map(e=>getComputedStyle(e).borderBottomWidth)))assert.equal(s,'1px');
 for(const selector of ['.target-icon-button','.target-tab','.target-nav','.target-quick-search','.target-header-actions','[data-node-id="14445:3354"]','[data-node-id="14578:6106"]']){
  for(const shape of await page.locator(selector).evaluateAll(es=>es.map(e=>getComputedStyle(e).cornerShape)))assert.match(shape,/^(round|superellipse\(1\))$/,selector+' must preserve Figma circle/capsule');
 }
 for(const [selector,radius] of [['.stat-chart-card','30px'],['.wd-main-panel','10px'],['.wd-glass[data-corner-profile="continuous"]:not(.wd-glass--surface)','30px'],['.wd-glass--surface[data-corner-profile="continuous"]','12px']]){
  for(const value of await page.locator(selector).evaluateAll(es=>es.map(e=>({shape:getComputedStyle(e).cornerShape,radius:getComputedStyle(e).borderRadius})))){
   assert.equal(value.shape,'superellipse(1.05)',selector+' must have a continuous curve, not ordinary round or full squircle');assert.equal(value.radius,radius);
  }
 }
 for(const match of await page.locator('.wd-glass').evaluateAll(es=>es.map(host=>[...host.querySelectorAll('.wd-glass-material,.wd-glass-fill,.wd-glass-optics,.wd-glass-rim,.wd-glass-state,.wd-glass-glow')].every(layer=>getComputedStyle(layer).cornerShape===getComputedStyle(host).cornerShape))))assert.equal(match,true,'All glass layers must follow host silhouette');
 assert.match(await page.locator('.target-avatar').evaluate(e=>getComputedStyle(e).cornerShape),/^(round|superellipse\(1\))$/);
 // Check the rendered hit contour, not just the CSS radius. The previous
 // full squircle passed the radius check while visually shrinking corners.
 const contour=await page.evaluate(()=>{
  const probe=document.createElement('div');
  probe.style.cssText='position:fixed;left:0;top:0;width:180px;height:140px;border-radius:30px;background:black;z-index:10000';
  document.body.append(probe);
  const diagonal=shape=>{
   probe.style.cornerShape=shape;let low=0,high=30;
   for(let step=0;step<18;step++){const mid=(low+high)/2;if(document.elementFromPoint(mid,mid)===probe)high=mid;else low=mid;}
   return (low+high)/2;
  };
  const shared=getComputedStyle(probe).cornerShape;
  const continuous=diagonal(shared),round=diagonal('round'),fullSquircle=diagonal('squircle');
  probe.remove();return {shared,continuous,round,fullSquircle};
 });
 assert.equal(contour.shared,'superellipse(1.05)');
 assert.ok(Math.abs(contour.continuous-contour.round)<.5,'30px corner must retain the original visible radius');
 assert.ok(Math.abs(contour.continuous-contour.round)>.03,'Continuous curve must actually render, not silently fall back to round');
 assert.ok(Math.abs(contour.fullSquircle-contour.round)>3,'Probe must detect the previously reported silhouette regression');
 const coverage=await page.evaluate(()=>{
  const rows=[];
  for(const el of document.querySelectorAll('*')){
   const s=getComputedStyle(el);
   if(!s.borderRadius||s.borderRadius==='0px'||s.borderRadius==='0%')continue;
   const rect=el.getBoundingClientRect();if(!rect.width||!rect.height)continue;
   rows.push({radius:s.borderRadius,shape:s.cornerShape,profile:el.dataset.cornerProfile||'',size:[rect.width,rect.height]});
  }
  return rows;
 });
 for(const row of coverage){
  assert.match(row.shape,/^(?:superellipse\(1\.05\)|superellipse\(1\))$/,`Unexpected corner shape: ${row.shape} @ ${row.radius}`);
  assert.ok(!/^(?:\d+(?:\.\d+)?%)+$/.test(row.radius)||row.radius==='50%',`Unexpected percentage radius in the page: ${row.radius}`);
 }
 const roundCoverage=coverage.filter(row=>row.shape==='superellipse(1)');
 assert.ok(roundCoverage.length>0,'The page must retain its circular/capsule surfaces');
 for(const row of roundCoverage){
  const [w,h]=row.size;
  const values=row.radius.split(' ').map(v=>v==='0px'?0:parseFloat(v));
  assert.ok(values.every(v=>Number.isFinite(v)),`Only px radii may be classified as round: ${row.radius}`);
  assert.ok(values.some(v=>v>=Math.min(w,h)/2-.01),`Round profile on a non-saturated corner: ${row.radius} @ ${w}x${h}`);
 }
 await page.evaluate(()=>{
  const node=document.createElement('div');
  node.id='geometry-dynamic-probe';
  node.style.cssText='position:fixed;left:-9999px;top:0;width:120px;height:80px;border-radius:18px;background:#000';
  document.body.append(node);
 });
 await page.waitForTimeout(30);
 const firstDynamic=await page.evaluate(()=>{const node=document.getElementById('geometry-dynamic-probe');return {profile:node.dataset.cornerProfile||'',shape:getComputedStyle(node).cornerShape,radius:getComputedStyle(node).borderRadius};});
 assert.equal(firstDynamic.profile,'continuous');assert.equal(firstDynamic.shape,'superellipse(1.05)');assert.equal(firstDynamic.radius,'18px');
 await page.evaluate(()=>{document.getElementById('geometry-dynamic-probe').style.height='36px';});
 await page.waitForTimeout(30);
 const capsuleDynamic=await page.evaluate(()=>{const node=document.getElementById('geometry-dynamic-probe');return {profile:node.dataset.cornerProfile||'',shape:getComputedStyle(node).cornerShape,radius:getComputedStyle(node).borderRadius};});
 assert.equal(capsuleDynamic.profile,'round');assert.equal(capsuleDynamic.shape,'superellipse(1)');assert.equal(capsuleDynamic.radius,'18px');
 await page.evaluate(()=>document.getElementById('geometry-dynamic-probe')?.remove());
 const screenshots=[];
 for(const theme of ['dark','light']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
  await page.waitForFunction(()=>!document.documentElement.dataset.themeTransition);
  await page.mouse.move(0,0);await page.waitForTimeout(320);
  const avatarShadow=await page.locator('.target-avatar').evaluate(e=>getComputedStyle(e).boxShadow);
  assert.match(avatarShadow,/(?:^|,\s*)rgba\([^)]+\) 0px 0px 0px 1px inset/);
  assert.ok(!/\) 0px [1-9]\d*px \d/.test(avatarShadow),'Avatar shadow must not be offset downwards');
  if(theme==='light'){
   assert.match(avatarShadow,/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/,'Light avatar must not cast an outer shadow');
   assert.match(await page.locator('.wd-main-panel').evaluate(e=>getComputedStyle(e).boxShadow),/rgba\(0, 0, 0, 0.07\)/);
  }
  for(const viewport of [{width:1545,height:1252},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(800);
   const path=`tests/output/foundations-${theme}-${viewport.width}.png`;await page.screenshot({path});screenshots.push(path);
  }
  await page.setViewportSize({width:1545,height:1252});
 }
 await page.getByRole('button',{name:'View sites online'}).hover();await page.waitForTimeout(340);
 await page.screenshot({path:'tests/output/foundations-light-hover.png'});
 // Simulate the progressive-enhancement branch being absent: no replacement
 // masks, radius mutations, or geometry JS may be required for normal corners.
 await page.route('**/geometry.css',route=>route.fulfill({contentType:'text/css',body:':root{--wd-divider-width:1px}'}));
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 assert.match(await page.locator('.wd-glass').first().evaluate(e=>getComputedStyle(e).cornerShape),/^(round|superellipse\(1\))$/);
 assert.equal(await page.locator('.wd-glass').first().evaluate(e=>getComputedStyle(e).borderRadius),'18px');
 await page.screenshot({path:'tests/output/foundations-fallback.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({auditedSceneText:typeAudit.length,geometryPreserved:geometry.length,chromeMedium:'14px / 510',nativeCorners:true,contour,coverage:{continuous:coverage.length-roundCoverage.length,round:roundCoverage.length},dynamic:firstDynamic,fallback:true,screenshots,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
