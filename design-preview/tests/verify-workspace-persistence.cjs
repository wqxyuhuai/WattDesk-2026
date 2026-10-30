const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

const origin=new URL(previewURL).origin;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
  const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.ready==="true");
  const selectedTab=()=>page.locator('.workspace-tab.selected').getAttribute('data-tab-id');
  const tabLabels=()=>page.locator('.workspace-tab-label').allTextContents();
  const activeTab=id=>page.locator(`.workspace-tab[data-tab-id="${id}"]`);

  await page.goto(`${origin}/home`,{waitUntil:'domcontentloaded'});
  await ready();
  assert.deepEqual(await tabLabels(),['Home']);
  assert.equal(await selectedTab(),'home-1');

  await page.getByRole('button',{name:'Add tab'}).click();
  await sleep(360);
  assert.equal(await selectedTab(),'home-2');
  await page.locator('.target-nav[data-route="plants"]').click();
  await sleep(360);

  const plantsViewport=page.locator('.plants-table-scroll');
  let savedListScroll=await plantsViewport.evaluate(element=>{
   element.scrollTop=240;
   return element.scrollTop;
  });
  assert.ok(savedListScroll>0);
  const visiblePlantId=await page.evaluate(()=>{
   const viewport=document.querySelector('.plants-table-scroll').getBoundingClientRect();
   return [...document.querySelectorAll('.plants-row')].find(row=>{
    const box=row.getBoundingClientRect();
    return box.top>=viewport.top&&box.bottom<=viewport.bottom;
   })?.dataset.id;
  });
  assert.ok(visiblePlantId);
  await page.locator(`.plants-row[data-id="${visiblePlantId}"]`).click();
  await sleep(360);
  savedListScroll=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('wattdesk.workspace.v1'))
   .tabs.find(tab=>tab.id==='home-2')?.snapshot?.view?.listScrollTop??0);
  const plantDetailPath=new URL(page.url()).pathname;
  const plantDetailTab=await selectedTab();
  const plantDetailLabel=(await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim();

  await page.getByRole('button',{name:'Add tab'}).click();
  await sleep(360);
  const serviceListTab=await selectedTab();
  await page.locator('.target-nav[data-route="service"]').click();
  await sleep(360);
  await page.locator('.service-card').first().click();
  await sleep(360);
  const serviceDetailPath=new URL(page.url()).pathname;
  const serviceDetailTab=await selectedTab();
  const serviceDetailLabel=(await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim();
  const savedServiceScroll=await page.locator('.service-detail-viewport').evaluate(element=>{
   const target=Math.min(140,Math.max(0,element.scrollHeight-element.clientHeight));
   element.scrollTop=target;
   return element.scrollTop;
  });
  assert.ok(savedServiceScroll>0);

  await page.getByRole('button',{name:'Add tab'}).click();
  await sleep(360);
  const statisticsTab=await selectedTab();
  await page.locator('.target-nav[data-route="statistics"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/statistics');

  const expectedTabs=[
   {id:'home-1',label:'Home'},
   {id:'home-2',label:'Plants'},
   {id:plantDetailTab,label:plantDetailLabel},
   {id:serviceListTab,label:'Service ticket'},
   {id:serviceDetailTab,label:serviceDetailLabel},
   {id:statisticsTab,label:'Statistics'}
  ];
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(tab=>({
   id:tab.dataset.tabId,
   label:tab.querySelector('.workspace-tab-label').textContent.trim()
  }))),expectedTabs);

  await page.reload({waitUntil:'domcontentloaded'});
  await ready();
  await sleep(500);
  assert.equal(new URL(page.url()).pathname,'/statistics');
  assert.equal(await selectedTab(),statisticsTab);
  assert.deepEqual(await page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(tab=>({
   id:tab.dataset.tabId,
   label:tab.querySelector('.workspace-tab-label').textContent.trim()
  }))),expectedTabs,'refresh restores all tabs in order');
  const stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('wattdesk.workspace.v1')));
  assert.equal(stored.version,1);
  assert.equal(stored.activeId,statisticsTab);
  assert.equal(stored.tabs.length,6);
  assert.deepEqual(stored.counters,{nextHome:4,nextRouteTab:3});
  await page.screenshot({path:'tests/output/workspace-tabs-session-restored.png'});

  await activeTab('home-2').click();
  await sleep(420);
  assert.equal(new URL(page.url()).pathname,'/plants');
  const restoredListScroll=await page.locator('.plants-table-scroll').evaluate(element=>element.scrollTop);
  const restoredPlantsSnapshot=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('wattdesk.workspace.v1')).tabs.find(tab=>tab.id==='home-2')?.snapshot);
  assert.ok(
    Math.abs(restoredListScroll-savedListScroll)<=8,
    `Plants scroll must survive refresh: ${JSON.stringify({savedListScroll,restoredListScroll,restoredPlantsSnapshot})}`
  );

  await activeTab(plantDetailTab).click();
  await sleep(420);
  assert.equal(new URL(page.url()).pathname,plantDetailPath);

  await activeTab(serviceDetailTab).click();
  await sleep(500);
  assert.equal(new URL(page.url()).pathname,serviceDetailPath);
  assert.ok(Math.abs(await page.locator('.service-detail-viewport').evaluate(element=>element.scrollTop)-savedServiceScroll)<3);

  await page.goto(`${origin}/home`,{waitUntil:'domcontentloaded'});
  await ready();
  await sleep(500);
  assert.equal(new URL(page.url()).pathname,'/home');
  assert.equal(await selectedTab(),'home-1','the current URL wins over the previously active tab');
  assert.equal(await page.locator('.workspace-tab').count(),6,'URL reconciliation must preserve the saved tab set');
  await page.getByRole('button',{name:'Add tab'}).click();
  await sleep(360);
  assert.equal(await selectedTab(),'home-5','restored ID counters must not repeat or skip');
  assert.equal(await page.locator('.workspace-tab').count(),7);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({
   ok:true,
   finalTabs:await page.locator('.workspace-tab').count(),
   active:await selectedTab(),
   savedListScroll,
   savedServiceScroll,
   errors
  },null,2));
 }finally{
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exit(1)});
