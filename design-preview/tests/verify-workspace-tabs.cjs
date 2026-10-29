const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({...launchOptions,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
  await page.goto(previewURL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');

  const labels=()=>page.locator('.workspace-tab-label').allTextContents();
  const ids=()=>page.locator('.workspace-tab').evaluateAll(tabs=>tabs.map(tab=>tab.dataset.tabId));
  const cssValue=token=>page.evaluate(token=>{
   const probe=document.createElement('span');
   probe.style.color=`var(${token})`;
   document.body.append(probe);
   const color=getComputedStyle(probe).color;
   probe.remove();
   return color;
  },token);

  await page.locator('.target-nav[data-route="plants"]').click();
  await page.waitForTimeout(340);
  await page.locator('.plants-row[data-id="p02"]').click();
  await page.waitForTimeout(340);
  await page.getByRole('button',{name:'Add tab'}).click();
  await page.waitForTimeout(340);
  await page.locator('.target-nav[data-route="service"]').click();
  await page.waitForTimeout(340);
  await page.getByRole('button',{name:'Add tab'}).click();
  await page.waitForTimeout(340);
  await page.locator('.target-nav[data-route="statistics"]').click();
  await page.waitForTimeout(340);
  assert.deepEqual(await labels(),['Plants','Silvio Bräuer','Service ticket','Statistics']);
  assert.deepEqual(await ids(),['home-1','route-1','home-2','home-3']);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),'home-3');

  const historyLabels=await page.locator('.wd-history-row').evaluateAll(rows=>rows.map(row=>row.getAttribute('aria-label')));
  assert.equal(historyLabels.length,0,'history is closed until its trigger is used');
  assert.deepEqual(
    await page.locator('[data-recent-visit="true"]').evaluateAll(rows=>rows.map(row=>row.getAttribute('aria-label'))),
    ['Statistics (coming soon)','Home','Service ticket','Home','Plants / Silvio Bräuer'],
    'all tabs must contribute to one shared recent-visit archive'
  );
  const homeDetailCrumb=page.locator('[data-recent-visit="true"]',{hasText:'Silvio Bräuer'});
  assert.deepEqual(
    await homeDetailCrumb.locator('.wd-history-path-part').evaluateAll(parts=>parts.map(part=>part.textContent.trim())),
    ['Plants','/','Silvio Bräuer'],
    'the Home summary must render the complete location hierarchy'
  );
  assert.equal(
    await homeDetailCrumb.locator('.recent-visit-path').evaluate(element=>element.scrollWidth<=element.clientWidth+1),
    true,
    'the complete Home history breadcrumb must remain visible'
  );
  await page.locator('.target-history').click();
  await page.waitForTimeout(340);
  assert.deepEqual(
    await page.locator('.wd-history-row').evaluateAll(rows=>rows.map(row=>row.getAttribute('aria-label'))),
    ['Statistics (coming soon)','Home','Service ticket','Home','Plants / Silvio Bräuer','Plants','Home'],
    'the sidebar history popover must use the same shared archive'
  );
  const detailCrumb=page.locator('.wd-history-row',{hasText:'Silvio Bräuer'});
  const crumbColors=await detailCrumb.locator('.wd-history-path-part').evaluateAll(parts=>parts.map(part=>({text:part.textContent,color:getComputedStyle(part).color})));
  assert.equal(crumbColors[0].text,'Plants');
  assert.equal(crumbColors[1].text.trim(),'/');
  assert.equal(crumbColors[2].text,'Silvio Bräuer');
  assert.equal(crumbColors[0].color,await cssValue('--wd-label-secondary'));
  assert.equal(crumbColors[1].color,await cssValue('--wd-label-secondary'));
  assert.equal(crumbColors[2].color,await cssValue('--wd-label-primary'));
  assert.equal(Math.round(await detailCrumb.evaluate(row=>row.getBoundingClientRect().width)),360);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(340);

  const first=await page.locator('.workspace-tab').first().boundingBox();
  const last=await page.locator('.workspace-tab').last().boundingBox();
  await page.mouse.move(first.x+first.width/2,first.y+first.height/2);
  await page.mouse.down();
  await page.mouse.move(last.x+last.width*.72,last.y+last.height/2,{steps:12});
  await page.mouse.up();
  await page.waitForTimeout(340);

  assert.deepEqual(await labels(),['Silvio Bräuer','Service ticket','Statistics','Plants']);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),'home-3','dragging an inactive tab must not activate it');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.tabId),'home-3','focus must stay on the active tab when an inactive tab is dragged');
  assert.equal(new URL(page.url()).pathname,'/statistics','dragging must preserve the active tab URL');
  assert.equal(await page.locator('.workspace-tab.is-dragging').count(),0);
  assert.equal(await page.locator('.workspace-tab').count(),4);
  assert.equal(await page.locator('.workspace-tab').first().getAttribute('aria-keyshortcuts'),'Control+Shift+ArrowLeft Control+Shift+ArrowRight');

  const movedFirst=await page.locator('.workspace-tab').first().boundingBox();
  const movedLast=await page.locator('.workspace-tab').last().boundingBox();
  await page.mouse.move(movedLast.x+movedLast.width/2,movedLast.y+movedLast.height/2);
  await page.mouse.down();
  await page.mouse.move(movedFirst.x+movedFirst.width*.18,movedFirst.y+movedFirst.height/2,{steps:12});
  await page.mouse.up();
  await page.waitForTimeout(340);
  assert.deepEqual(await labels(),['Plants','Silvio Bräuer','Service ticket','Statistics']);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),'home-3');

  const active=page.locator('.workspace-tab.selected');
  await active.focus();
  await page.keyboard.press('Control+Shift+ArrowLeft');
  await page.waitForTimeout(260);
  assert.deepEqual(await labels(),['Plants','Silvio Bräuer','Statistics','Service ticket']);
  assert.equal(await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),'home-3');
  assert.equal(new URL(page.url()).pathname,'/statistics');

  await page.screenshot({path:'tests/output/workspace-tabs-reorder-dark.png'});
  await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
  await page.waitForTimeout(700);
  await page.screenshot({path:'tests/output/workspace-tabs-reorder-light.png'});

  await page.locator('.target-history').click();
  await page.waitForTimeout(320);
  await page.locator('.wd-history-row',{hasText:'Silvio Bräuer'}).click();
  await page.waitForTimeout(360);
  assert.equal(new URL(page.url()).pathname,'/plants/p02','selecting a hierarchical history row must restore its params');
  assert.equal((await page.locator('.plants-detail-title').textContent()).trim(),'Silvio Bräuer');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(),'Silvio Bräuer');
  assert.equal(await page.locator('.workspace-tab').count(),4,'selecting an existing plant detail should activate its existing tab');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,order:await labels(),active:await page.locator('.workspace-tab.selected').getAttribute('data-tab-id'),errors},null,2));
 }finally{
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exit(1)});
