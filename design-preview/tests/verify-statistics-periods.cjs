const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

const origin=new URL(previewURL).origin;
const settle=page=>page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))));

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1499,height:1252}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{
  if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
 });

 await page.goto(`${origin}/plants/p25?device=inverter&glass=figma`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await settle(page);

 const statistics=page.locator('.plant-overview-day-statistics');
 assert.equal(await statistics.getAttribute('data-period-mode'),'day','Statistics opens on Day');
 assert.deepEqual(
  await page.locator('.plant-overview-statistics-view').evaluateAll(views=>views.map(view=>({
   mode:view.dataset.periodView,
   hidden:view.hidden
  }))),
  [
   {mode:'day',hidden:false},
   {mode:'month',hidden:true},
   {mode:'year',hidden:true},
   {mode:'total',hidden:true}
  ],
  'all four views are mounted while only Day is visible'
 );
 assert.equal(await page.locator('.plant-statistics-period-control.wd-glass').count(),1,'the period control uses shared glass');
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'Today');
 assert.equal(await page.locator('.plant-statistics-layout-control').count(),0,'Day does not mount the month/year layout toggle');

 await page.locator('.plant-statistics-period-nav').first().click();
 await settle(page);
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'Nov 8','previous navigation moves back one day');
 await page.locator('.plant-statistics-period-nav').last().click();
 await settle(page);
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'Today','next navigation returns to the current day');

 await page.locator('.plant-statistics-period-trigger').click();
 assert.equal(await page.locator('.plant-statistics-period-picker').isVisible(),true,'the picker opens from the period trigger');
 assert.equal(await page.locator('.plant-statistics-period-panel-nav.wd-glass').count(),2,'the picker arrows use shared glass buttons');
 assert.deepEqual(
  await page.locator('.plant-statistics-period-picker').getByRole('tab').allTextContents(),
  ['Day','Month','Year','Total'],
  'the picker exposes all four period modes'
 );
 assert.equal(
  await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Day'}).getAttribute('aria-selected'),
  'true',
  'the picker starts on the current granularity'
 );
 await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Month'}).click();
 assert.equal(await statistics.getAttribute('data-period-mode'),'day','changing granularity does not commit a period');
 assert.equal((await page.locator('.plant-statistics-period-range-label').textContent()).trim(),'2026');
 await page.getByRole('button',{name:'Nov',exact:true}).click();
 await page.waitForTimeout(50);
 const historyEntrance=await page.evaluate(()=>{
  const groups=[...document.querySelectorAll('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-group')];
  return groups.map(group=>{
   const mark=group.querySelector('.plant-overview-chart-mark');
   const animation=mark?.getAnimations()[0];
   return {
    delay:animation?.effect?.getTiming().delay??null,
    duration:animation?.effect?.getTiming().duration??null,
    clip:animation?.effect?.getKeyframes()[0]?.clipPath??""
   };
  });
 });
 assert.equal(historyEntrance.every(item=>item.clip.includes('100%')),true,'history marks reveal from left to right');
  assert.equal(historyEntrance.every(item=>item.duration===900),true,'chart entrance uses the slower shared chart duration');
 assert.ok(Math.max(...historyEntrance.map(item=>item.delay))<=110,'all four history charts start within the same short entrance window');
 assert.ok(Math.max(...historyEntrance.map(item=>item.delay))-Math.min(...historyEntrance.map(item=>item.delay))<=90,'small multiples keep only a slight start-time offset');
 await settle(page);
 assert.equal(await statistics.getAttribute('data-period-mode'),'month');
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'November 2026');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"]').isVisible(),true);
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-group').count(),
  4,
  'Month renders four daily histories'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-line').evaluateAll(lines=>lines.every(line=>line.getAttribute('d').includes(' C'))),
  true,
  'daily history lines use a smooth bezier path'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-chart-readout.wd-glass--surface.wd-glass--static').count(),
  4,
  'the active month charts mount shared static glass readouts'
 );
 assert.equal(await page.locator('.plant-statistics-layout-control').isVisible(),true,'Month exposes the Separate / Combined switch');
 assert.deepEqual(
  await page.locator('.plant-statistics-layout-control').getByRole('tab').allTextContents(),
  ['Separate','Combined']
 );
 const controlGeometry=await page.evaluate(()=>{
  const layout=document.querySelector('.plant-statistics-layout-control').getBoundingClientRect();
  const period=document.querySelector('.plant-statistics-period-control').getBoundingClientRect();
  return {layoutRight:layout.right,periodLeft:period.left};
 });
 assert.ok(controlGeometry.layoutRight<=controlGeometry.periodLeft,'the layout switch sits to the left of the time control');
 await page.locator('.plant-statistics-layout-control').getByRole('tab',{name:'Combined'}).click();
 await settle(page);
 assert.equal(await statistics.getAttribute('data-statistics-layout'),'combined');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"]').getAttribute('data-layout'),'combined');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-grid').isVisible(),false,'Combined hides the four separate histories');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined').isVisible(),true);
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-combined-line').count(),4);
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-legend-item').count(),4);
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-legend-label').first().evaluate(label=>getComputedStyle(label).fontSize),
  '12px',
  'combined legend labels use the standard caption size'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined svg').getAttribute('preserveAspectRatio'),
  'none',
  'the combined plot stretches across the complete content width'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-combined-line').evaluateAll(lines=>lines.every(line=>line.getAttribute('d').includes(' C'))),
  true,
  'combined histories use smooth bezier paths'
 );
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-combined-axis-label').count(),3,'axis labels stay in an unstretched HTML overlay');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-combined-axis-label').first().evaluate(label=>getComputedStyle(label).fontSize),
  '12px',
  'combined date labels use the standard caption size'
 );
 await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined .plant-overview-stat-hit').first().hover({force:true});
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined .plant-overview-chart-readout-value').count(),4,'Combined hover reads all four series together');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined .plant-overview-chart-readout-copy').evaluate(copy=>getComputedStyle(copy).gridTemplateColumns.split(' ').length),
  2,
  'the four combined readings use a compact two-column tooltip'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined').evaluate(figure=>{
   const tooltip=figure.querySelector('.plant-overview-chart-readout').getBoundingClientRect();
   const canvas=figure.querySelector('.plant-overview-history-canvas').getBoundingClientRect();
   return tooltip.bottom<=canvas.top+1;
  }),
  true,
  'the combined tooltip sits above the plotted area'
 );
 await page.locator('.plant-overview-statistics-view[data-period-view="month"] .is-history-combined .plant-overview-stat-hit').first().blur();
 await page.locator('.plant-statistics-layout-control').getByRole('tab',{name:'Separate'}).click();
 await settle(page);
 await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-stat-hit').first().hover({force:true});
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-chart-readout').first().evaluate(node=>getComputedStyle(node).visibility),
  'visible',
  'month values are available on hover'
 );
 assert.deepEqual(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-chart-readout').first().evaluate(node=>({
   label:getComputedStyle(node.querySelector('.plant-overview-chart-readout-label')).fontSize,
   value:getComputedStyle(node.querySelector('.plant-overview-chart-readout-value')).fontSize
  })),
  {label:'12px',value:'13px'},
  'history tooltips use the standard readable type scale'
 );

 await page.locator('.plant-statistics-period-nav').first().click();
 await settle(page);
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'October 2026');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"]').getAttribute('data-range'),
  'October 2026',
  'previous navigation updates the visible month data'
 );

 await page.locator('.plant-statistics-period-trigger').click();
 await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Year'}).click();
 await page.getByRole('button',{name:'2026',exact:true}).click();
 await settle(page);
 assert.equal(await statistics.getAttribute('data-period-mode'),'year');
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'2026');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="year"] .plant-overview-history-grid g.plant-overview-chart-mark').count(),
  48,
  'Year renders twelve monthly aggregates in each of four histories'
 );
 assert.equal(await page.locator('.plant-statistics-layout-control').isVisible(),true,'Year shares the same layout switch');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="year"] .plant-overview-history-axis-label').first().evaluate(label=>getComputedStyle(label).fontSize),
  '12px',
  'year axis labels use the standard caption size'
 );
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="year"] .plant-overview-history-peak').count(),
  0,
  'year bars do not add persistent peak values outside hover'
 );
 await page.locator('.plant-statistics-layout-control').getByRole('tab',{name:'Combined'}).click();
 await settle(page);
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="year"] .plant-overview-combined-line').count(),4);
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="year"] .is-history-combined').getAttribute('data-point-count'),'365','Year Combined uses a daily series for the full year');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="year"] .is-history-combined .plant-overview-stat-hit').count(),365,'every day keeps its own hover and focus target');

 await page.locator('.plant-statistics-period-trigger').click();
 await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Total'}).click();
 await settle(page);
 assert.equal(await statistics.getAttribute('data-period-mode'),'total');
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'Total');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="total"]').isVisible(),true);
 assert.equal(await page.locator('.plant-overview-total-metric').count(),8,'Total exposes eight cumulative metrics');
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="total"] .plant-overview-chart-savings-row').count(),4);
 assert.equal(await page.locator('.plant-overview-statistics-view[data-period-view="total"] .plant-overview-chart-wedge:not(.is-hover)').count(),3);
 assert.equal(await page.locator('.plant-statistics-period-nav').evaluateAll(nodes=>nodes.every(node=>node.disabled)),true,'Total disables adjacent navigation');
 assert.equal(await page.locator('.plant-statistics-layout-control').isVisible(),false,'Total hides the month/year layout switch');

 await page.locator('.plant-statistics-period-trigger').click();
 await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Day'}).click();
 await page.getByRole('button',{name:'October 8, 2026',exact:true}).click();
 await settle(page);
 assert.equal(await statistics.getAttribute('data-period-mode'),'day');
 assert.equal((await page.locator('.plant-statistics-period-label').textContent()).trim(),'Oct 8');
 assert.equal(await page.locator('.plant-overview-day-view').isVisible(),true);
 assert.equal(await page.locator('.plant-statistics-layout-control').isVisible(),false,'Day hides the month/year layout switch');

 await page.locator('.plant-statistics-period-trigger').click();
 await page.keyboard.press('Escape');
 await page.waitForTimeout(260);
 assert.equal(await page.locator('.plant-statistics-period-picker').count(),0,'Escape dismisses the picker');

 await page.locator('.plant-statistics-period-trigger').click();
 await page.locator('.plant-overview-stats-title').click();
 await page.waitForTimeout(260);
 assert.equal(await page.locator('.plant-statistics-period-picker').count(),0,'outside press dismisses the picker');

 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('.plant-statistics-period-trigger').click();
 await page.locator('.plant-statistics-period-picker').getByRole('tab',{name:'Month'}).click();
 await page.getByRole('button',{name:'Nov',exact:true}).click();
 assert.equal(await statistics.getAttribute('data-period-mode'),'month');
 assert.equal(await page.locator('.plant-overview-day-statistics').evaluate(section=>section.getAnimations({subtree:true}).length),0,'reduced motion removes view entrance animations');
 await page.locator('.plant-statistics-layout-control').getByRole('tab',{name:'Separate'}).click();
 await settle(page);

 await page.setViewportSize({width:900,height:1000});
 await settle(page);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0,'the statistics views do not create horizontal overflow');
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-grid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),
  2,
  'compact desktop uses a two-column chart layout'
 );

 await page.setViewportSize({width:520,height:1000});
 await settle(page);
 assert.equal(
  await page.locator('.plant-overview-statistics-view[data-period-view="month"] .plant-overview-history-grid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),
  1,
  'mobile stacks monthly histories into one column'
 );
 assert.deepEqual(errors,[],'the statistics period flow raises no page or asset errors');

 await page.screenshot({path:'tests/output/statistics-period-mobile.png',fullPage:true});
 console.log(JSON.stringify({ok:true,views:['day','month','year','total'],errors},null,2));
 await browser.close();
})().catch(error=>{
 console.error(error);
 process.exit(1);
});
