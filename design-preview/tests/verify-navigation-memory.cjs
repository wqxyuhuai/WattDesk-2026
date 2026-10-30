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
  const ready=()=>page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  const selectedTab=()=>page.locator('.workspace-tab.selected').getAttribute('data-tab-id');

  await page.goto(`${origin}/home`,{waitUntil:'domcontentloaded'});
  await ready();
  const sourceTabId=await selectedTab();
  const homeScroll=page.locator('[data-node-id="14578:7006"]');
  await homeScroll.evaluate(element=>{element.scrollTop=180;});
  await sleep(40);
  const savedHomeScroll=await homeScroll.evaluate(element=>element.scrollTop);
  await page.locator('.target-nav[data-route="plants"]').click();
  await sleep(360);

  const listScroll=page.locator('.plants-table-scroll');
  await listScroll.evaluate(element=>{element.scrollTop=180;});
  await sleep(40);
  const savedListScroll=await listScroll.evaluate(element=>element.scrollTop);
  const visiblePlantId=await page.evaluate(()=>{
   const viewport=document.querySelector('.plants-table-scroll').getBoundingClientRect();
   return [...document.querySelectorAll('.plants-row')].find(row=>{
    const box=row.getBoundingClientRect();
    return box.top>=viewport.top&&box.bottom<=viewport.bottom;
   })?.dataset.id;
  });
  assert.ok(visiblePlantId,'a plant row must be visible before opening its detail');
  await page.locator(`.plants-row[data-id="${visiblePlantId}"]`).click();
  await sleep(360);
  const detailPath=new URL(page.url()).pathname;
  const detailTabId=await selectedTab();
  assert.notEqual(detailTabId,sourceTabId,'opening a plant detail creates its own workspace tab');

  await page.locator('.target-nav[data-route="home"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/home');
  assert.ok(Math.abs(await homeScroll.evaluate(element=>element.scrollTop)-savedHomeScroll)<=8,'Home scroll must survive the sidebar round trip');
  await page.locator('.target-nav[data-route="plants"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,detailPath,'Plants sidebar must restore the tab’s last plant detail');
  assert.equal(await selectedTab(),detailTabId);
  assert.equal(await page.locator('.plants-detail').isVisible(),true);
  await page.locator('.target-nav[data-route="plants"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/plants','a second Plants click must return to its canonical list');
  assert.equal(await page.locator('.plants-table').isVisible(),true);

  await page.locator(`.workspace-tab[data-tab-id="${sourceTabId}"]`).click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/plants');
  assert.ok(Math.abs(await listScroll.evaluate(element=>element.scrollTop)-savedListScroll)<=8,'switching tabs must restore the Plants list scroll');
  await page.locator('.target-nav[data-route="home"]').click();
  await sleep(360);
  await page.locator('.target-nav[data-route="plants"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/plants');
  assert.ok(Math.abs(await listScroll.evaluate(element=>element.scrollTop)-savedListScroll)<=8,'the same tab must restore its Plants list scroll after sidebar navigation');

  await page.locator('.target-nav[data-route="service"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/service');
  await page.locator('.service-card').first().click();
  await sleep(360);
  const servicePath=new URL(page.url()).pathname;
  const serviceTabId=await selectedTab();
  const detailViewport=page.locator('.service-detail-viewport');
  const savedServiceScroll=await detailViewport.evaluate(element=>{
   const target=Math.min(140,Math.max(0,element.scrollHeight-element.clientHeight));
   element.scrollTop=target;
   return element.scrollTop;
  });
  assert.ok(savedServiceScroll>0,'the service detail must be tall enough to verify scroll restoration');
  await page.locator('.target-nav[data-route="home"]').click();
  await sleep(360);
  await page.locator('.target-nav[data-route="service"]').click();
  await sleep(500);
  assert.equal(new URL(page.url()).pathname,servicePath,'Service sidebar must restore the tab’s last ticket detail');
  assert.equal(await selectedTab(),serviceTabId);
  assert.ok(Math.abs(await detailViewport.evaluate(element=>element.scrollTop)-savedServiceScroll)<2,'Service ticket detail scroll must survive sidebar navigation');
  await page.locator('.target-nav[data-route="service"]').click();
  await sleep(360);
  assert.equal(new URL(page.url()).pathname,'/service','a second Service click must return to its canonical list');
  assert.equal(await page.locator('.service-board').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,savedHomeScroll,savedListScroll,savedServiceScroll,detailPath,servicePath,errors},null,2));
 }finally{
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exit(1)});
