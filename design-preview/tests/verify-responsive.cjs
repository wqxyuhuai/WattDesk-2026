const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const widths=[1920,1693,1545,1366,1180,1024,900,760,640,560,480,420];
 const report=[];
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(previewURL);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.waitForTimeout(420);
  const m=await page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
   const g=id=>document.querySelector(`[data-node-id="${id}"]`);
   const rows=els=>{const ys=els.map(e=>Math.round(e.getBoundingClientRect().y));return ys.filter((y,i)=>ys.indexOf(y)===i).map(y=>ys.filter(v=>v===y).length)};
   const status=['14537:4416','14537:3925','14537:3891','14537:3908'].map(id=>g(id));
   const business=['14570:1140','14570:1174','14570:1208','14570:1237'].map(id=>g(id));
   const energy=['14570:1074','14570:1111'].map(id=>g(id));
   const chartCards=[...energy,...business];
   const shortcuts=[...g('14612:7837').children];
   const header=g('14561:836');
   const refresh=g('14612:8453');
   const period=g('14557:831');
   const periodRow=header.querySelector('[data-name="Frame 45"]');
   const panel=g('14578:6145');
   const canvas=document.querySelector('.home-content-canvas');
   const arrows=['14537:4416','14537:3925'].map(id=>({card:box(g(id)),glyph:box(g(`I${id};14536:3833;14445:4526`)),hit:box(g(`I${id};14536:3833`)),surface:box(g(`I${id};14536:3811`))}));
   const menus=[...document.querySelectorAll('.chart-menu')].map(e=>({menu:box(e),card:box(e.closest('.stat-chart-card'))}));
   const charts=chartCards.map(card=>box([...card.children].find(e=>e.dataset.name==='Bucket chart')));
   const headings=chartCards.map(card=>box([...card.children].find(e=>e.dataset.name==='Frame 42')));
   return {
    vw:innerWidth,scrollW:document.documentElement.scrollWidth,bodyScrollW:document.body.scrollWidth,
    panel:box(panel),canvas:box(canvas),welcome:box(g('14445:3351')),search:box(g('14445:3354')),
    status,statusRows:rows(status),business,businessRows:rows(business),chartCards:chartCards.map(box),energyRows:rows(energy),
    shortcuts:shortcuts.map(box),shortcutRows:rows(shortcuts),shortcutsBox:box(g('14612:7837')),
    header:box(header),periodRow:box(periodRow),period:box(period),refresh:box(refresh),
    searchText:box(g("I14445:3354;14420:2221;14420:2195")),searchShortcut:box(g("I14445:3354;14420:2221;14420:2196")),
    arrows,menus,charts,headings,
    nav:box(document.querySelector('.target-nav')),footer:{account:box(document.querySelector('.target-account')),notify:box(document.querySelector('.target-notifications'))},
    sidebar:box(g('14445:3629')),tabs:box(document.querySelector('.target-header-actions')),
    chrome:{search:box(document.querySelector('.target-quick-search')),size:box(document.querySelector('.target-forward')),history:box(document.querySelector('.target-history')),back:box(document.querySelector('.target-back')),forward:box(document.querySelector('.target-forward'))},
    staticCanvas:getComputedStyle(canvas).transform,staticColumn:getComputedStyle(g('14578:7006')).transform,
    periodArea:box(g('14612:7602'))
   };
  });
  const cols=m.shortcutRows[0];
  const cardCols=m.statusRows[0],chartCols=m.businessRows[0];
  const wanted=m.canvas.w>=860?4:m.canvas.w>=520?2:1;
  assert.equal(cardCols,wanted,`${width}: status cards should use ${wanted} columns, got ${cardCols}`);
  assert.equal(m.energyRows[0],m.canvas.w>=520?2:1,`${width}: energy cards should use 2/1 columns, got ${m.energyRows[0]}`);
  assert.equal(m.energyRows.length,m.canvas.w>=520?1:2,`${width}: energy card rows`);
  assert.equal(chartCols,wanted,`${width}: business cards should use ${wanted} columns, got ${chartCols}`);
  assert.equal(cols,m.canvas.w>=680?3:m.canvas.w>=440?2:1,`${width}: shortcuts should use the 3/2/1 rhythm`);
  assert.equal(m.scrollW,m.vw,`${width}: horizontal document overflow`);
  assert.equal(m.bodyScrollW,m.vw,`${width}: horizontal body overflow`);
  assert.ok(Math.abs((m.canvas.x+m.canvas.w/2)-(m.panel.x+m.panel.w/2))<1,`${width}: content not centered in panel`);
  assert.equal(m.staticCanvas,'none',`${width}: canvas must not scale`);
  assert.equal(m.staticColumn,'none',`${width}: column must not scale`);
  for(const {card,glyph,hit,surface} of m.arrows){
   for(const b of [glyph,hit,surface])assert.ok(b.right<=card.right+.01&&b.x>=card.x-.01,`${width}: arrow/surface outside card`);
   assert.ok(hit.bottom<=card.bottom+.01,`${width}: arrow below card`);
  }
  for(const {menu,card} of m.menus)assert.ok(menu.right<=card.right+.01&&menu.x>=card.x-.01,`${width}: chart menu outside card`);
  for(const b of m.chartCards)assert.ok(b.right<=m.canvas.right+.06,`${width}: chart card outside content ${JSON.stringify(b)} / ${JSON.stringify(m.canvas)}`);
  for(const b of m.charts)assert.ok(b.right<=m.canvas.right+.06,`${width}: chart outside content`);
  for(const b of m.headings)assert.ok(b.right<=m.canvas.right+.06,`${width}: heading outside content`);
  for(const b of m.shortcuts)assert.ok(b.right<=m.canvas.right+.06,`${width}: shortcut column outside content`);
  assert.ok(Math.abs(m.refresh.right-m.period.right)<1,`${width}: refresh should align with period area`);
  assert.ok(m.searchText.right<=m.searchShortcut.x-.01,`${width}: search placeholder overlaps shortcut`);
  assert.ok(m.periodRow.x>=m.header.x-.01&&m.periodRow.right<=m.header.right+.01,`${width}: period row outside header`);
  if(width>760){
   assert.ok(Math.abs(m.chrome.forward.right-m.chrome.search.right)<.01,`${width}: history controls should align with the quick-search right edge`);
   for(const [name,b] of Object.entries({history:m.chrome.history,back:m.chrome.back,forward:m.chrome.forward}))assert.ok(Math.abs(b.w-36)<.01,`${width}: ${name} button should stay 36px, got ${b.w}`);
   assert.ok(Math.abs((m.chrome.back.x-m.chrome.history.right)-8)<.01,`${width}: history and back should stay 8px apart`);
   assert.ok(Math.abs((m.chrome.forward.x-m.chrome.back.right)-8)<.01,`${width}: back and forward should stay 8px apart`);
  }
  if(width<=760){
   assert.equal(Math.round(m.sidebar.w),76,`${width}: narrow sidebar should become a 76px rail`);
   assert.ok(m.footer.account.right<=m.footer.notify.x+.01,`${width}: account and notifications overlap`);
  }
  assert.equal(errors.length,0,`${width}: runtime errors ${errors.join(' | ')}`);
  report.push({width,contentWidth:Math.round(m.canvas.w),cards:cardCols,shortcuts:cols,refresh:m.refresh.right,period:m.period.right});
  // Hover moves only the arrow glyph by 2px; the card's glass lift grows around its centre. Neither may cross the card edge.
  const statusCard=page.locator('[data-node-id="14537:3925"]');
  await statusCard.scrollIntoViewIfNeeded();await statusCard.hover();await page.waitForTimeout(360);
  const hovered=await statusCard.evaluate(card=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}};
   const id=card.dataset.nodeId,glyph=document.querySelector(`[data-node-id="I${id};14536:3833;14445:4526"]`);
   return {card:box(card),glyph:box(glyph),translate:getComputedStyle(glyph).translate};
  });
  assert.ok(hovered.glyph.right<=hovered.card.right+.01&&hovered.glyph.x>=hovered.card.x-.01,`${width}: hovered arrow outside card`);
  assert.ok(hovered.glyph.bottom<=hovered.card.bottom+.01,`${width}: hovered arrow below card`);
  assert.notEqual(hovered.translate,'none',`${width}: hover arrow translation should stay enabled`);
  await page.mouse.move(0,0);

  await page.close();
 }
 console.log(JSON.stringify(report,null,2));
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});





