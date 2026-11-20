const {chromium, launchOptions, previewURL} = require('./runtime.cjs');
const assert = require('node:assert/strict');

const origin = new URL(previewURL).origin;
const settle = page => page.evaluate(() => Promise.all(
  document.getAnimations()
    .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))
));

async function ready(page, url, {settleAnimations=true}={}) {
  await page.goto(url, {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  if(settleAnimations)await settle(page);
}

(async () => {
  const browser = await chromium.launch({...launchOptions, headless:true});
  const page = await browser.newPage({viewport:{width:1545,height:1252}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${origin}/plants/p25/devices?glass=figma`, {waitUntil:'domcontentloaded'});
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'dark'));
  await ready(page, `${origin}/plants/p25/devices?glass=figma`, {settleAnimations:false});

  await page.waitForTimeout(40);
  const connectionMotion=await page.locator('.plants-device-connection-glyph').evaluateAll(icons => icons.map(icon => ({
    state:icon.dataset.connectionMotion,
    timings:[...icon.querySelectorAll('path')].map(path => path.getAnimations().map(animation => ({
      duration:animation.effect.getTiming().duration,
      delay:animation.effect.getTiming().delay,
      infinite:animation.effect.getTiming().iterations===Infinity
    })))
  })));
  assert.deepEqual(connectionMotion.map(item => item.state), ['online','offline','online']);
  assert.deepEqual(connectionMotion[0].timings.map(item => item[0]?.delay), [0,180,360,540], 'online signal bars grow from left to right');
  assert.deepEqual(connectionMotion[1].timings.slice(0,4).map(item => item[0]?.delay), [0,180,360,540], 'offline signal bars preserve the same staggered cadence');
  assert.deepEqual(connectionMotion[1].timings[4][0], {duration:3200,delay:760,infinite:true}, 'offline alert rotates after the muted signal bars');
  assert.ok(connectionMotion.every(icon => icon.timings.flat().every(animation => animation.duration===3200&&animation.infinite)), 'connection icon motion loops continuously at an unhurried cadence');
  await settle(page);
  const reducedMotionPage=await browser.newPage({viewport:{width:1545,height:1252}});
  await reducedMotionPage.emulateMedia({reducedMotion:'reduce'});
  await reducedMotionPage.goto(`${origin}/plants/p25/devices?glass=figma`,{waitUntil:'domcontentloaded'});
  await reducedMotionPage.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await reducedMotionPage.waitForTimeout(40);
  assert.equal(
    await reducedMotionPage.locator('.plants-device-connection-glyph path').evaluateAll(paths => paths.reduce((total,path)=>total+path.getAnimations().length,0)),
    0,
    'connection signal motion is disabled when reduced motion is requested'
  );
  await reducedMotionPage.close();

  assert.equal(new URL(page.url()).pathname, '/plants/p25/devices', 'Devices tab has a refreshable URL');
  assert.equal(await page.locator('.plants-devices').count(), 1, 'the real Devices page replaces the disabled placeholder');
  assert.equal(await page.locator('.plants-devices-preview-note').count(), 0, 'the local preview note is removed from the page');
  assert.equal(await page.locator('.plants-devices-summary').count(), 0, 'the device count summary is removed from the toolbar');
  assert.equal(await page.locator('.plants-device-card').count(), 3, 'all three device types render as separate cards');
  assert.deepEqual(await page.locator('.plants-device-name').allTextContents(), ['iHybrid','iStorage-G3','iHeater']);
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(0).locator('.plants-device-field-name').allTextContents(),
    ['Model','Hardware version','Firmware version','Boot version','SN','Check code'],
    'Inverter fields follow the requested order'
  );
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(1).locator('.plants-device-cluster').first().locator('.plants-device-cluster-submaster .plants-device-feedback-label').allTextContents(),
    ['ID','Model','Hardware version','Firmware version','SN'],
    'Sub-master fields follow the requested order'
  );
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(1).locator('.plants-device-cluster').first().locator('.plants-device-battery-heading').allTextContents(),
    ['ID','Hardware version','Firmware version','SN'],
    'Battery columns follow the requested order'
  );
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(2).locator('.plants-device-field-name').allTextContents(),
    ['Model','Hardware version','Firmware version','SN','Check code'],
    'Heater fields follow the requested order'
  );
  assert.deepEqual(
    await page.locator('.plants-device-identity').first().evaluate(identity => Array.from(identity.children).map(child => child.className)),
    ['plants-device-title-line','plants-device-meta-line'],
    'device identity is grouped into exactly two information lines'
  );
  assert.equal(await page.locator('.plants-device-identity').first().evaluate(identity => getComputedStyle(identity).rowGap), '10px', 'the two identity lines retain a clear gap');
  assert.equal(
    await page.locator('.plants-device-meta-line').first().evaluate(meta => meta.firstElementChild?.classList.contains('plants-device-status')),
    true,
    'online status is the first item in the second line'
  );
  assert.equal(await page.locator('.plants-device-status-dot').count(), 0, 'device status no longer uses the bespoke dot');
  assert.equal(await page.locator('.plants-device-status-icon').count(), 0, 'device status does not reuse the separate health-check icon');
  assert.equal(await page.locator('.plants-device-connection-glyph').count(), 3, 'every device status uses the Plants-list connection glyph');
  const deviceStatusGlyphs=await page.locator('.plants-device-status').evaluateAll(statuses => statuses.map(status => {
   const icon=status.querySelector('.plants-device-connection-glyph');
   return {
    label:status.querySelector('.plants-device-status-label').textContent,
    tag:icon.tagName.toLowerCase(),
    width:icon.getAttribute('width'),
    height:icon.getAttribute('height'),
    gap:getComputedStyle(status).gap,
    translateY:getComputedStyle(icon).transform,
    paths:icon.querySelectorAll('path').length,
    mutedOpacity:icon.querySelectorAll('path[fill-opacity="0.55"]').length,
    alertPaths:icon.querySelectorAll('path[fill="#FF4245"]').length
   };
  }));
  assert.deepEqual(deviceStatusGlyphs, [
   {label:'Online',tag:'svg',width:'16',height:'16',gap:'4px',translateY:'matrix(1, 0, 0, 1, 0, -1)',paths:4,mutedOpacity:0,alertPaths:0},
   {label:'Offline',tag:'svg',width:'16',height:'16',gap:'4px',translateY:'matrix(1, 0, 0, 1, 0, -1)',paths:5,mutedOpacity:4,alertPaths:1},
   {label:'Online',tag:'svg',width:'16',height:'16',gap:'4px',translateY:'matrix(1, 0, 0, 1, 0, -1)',paths:4,mutedOpacity:0,alertPaths:0}
  ], 'device status uses compact, optically aligned online and offline connection signals');
  assert.deepEqual(
    await page.locator('.plants-detail-tab').evaluateAll(tabs => tabs.map(tab => ({
      label:tab.textContent.trim(),
      current:tab.getAttribute('aria-current'),
      disabled:tab.disabled
    }))),
    [
      {label:'Overview',current:null,disabled:false},
      {label:'Devices',current:'page',disabled:false},
      {label:'Site details',current:null,disabled:false}
    ],
    'Devices is active while the sole Site details tab remains available'
  );
  assert.equal(await page.locator('.plants-device-card.wd-discussion-card').count(), 0, 'device cards do not reuse the bordered discussion surface');
  assert.equal(
    await page.locator('.plants-device-card').evaluateAll(cards => cards.every(card => {
      const style=getComputedStyle(card);
      return style.borderTopWidth==='0px'&&style.borderRightWidth==='0px'&&style.borderBottomWidth==='0px'&&style.borderLeftWidth==='0px'&&style.boxShadow==='none';
    })),
    true,
    'every device card is flat, without outline or shadow'
  );
  assert.equal(await page.locator('.plants-device-media img').count(), 3);
  assert.ok(await page.locator('.plants-device-media img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'product images load locally');
  assert.equal(
    await page.locator('.plants-device-card').nth(1).locator('.plants-device-media img').evaluate(image => ({
      file:new URL(image.src).pathname.split('/').pop(),
      width:image.naturalWidth,
      height:image.naturalHeight
    })).then(value => `${value.file}/${value.width}x${value.height}`),
    'istorage-r13.png/600x600',
    'Battery uses the supplied transparent R13 product archive image'
  );
  const cardGeometry = await page.locator('.plants-device-card').first().evaluate(card => {
    const media = card.querySelector('.plants-device-media').getBoundingClientRect();
    const main = card.querySelector('.plants-device-main').getBoundingClientRect();
    return {
      width:card.getBoundingClientRect().width,
      columns:getComputedStyle(card).gridTemplateColumns,
      mediaWidth:media.width,
      gap:main.left-media.right
    };
  });
  assert.ok(cardGeometry.width > 900, 'device rows keep a readable wide content column');
  assert.ok(cardGeometry.width <= 1147, 'device rows stay within the compact left-aligned content width');
  const contentLayout=await page.locator('.plants-devices').evaluate(root => {
    const host=root.closest('.plants-devices-host');
    const rootBox=root.getBoundingClientRect();
    const hostBox=host.getBoundingClientRect();
    return {
      width:rootBox.width,
      leftGap:rootBox.left-hostBox.left,
      rightGap:hostBox.right-rootBox.right
    };
  });
  assert.ok(Math.abs(contentLayout.width-1130)<=1, 'the devices content stays in a controlled compact column');
  assert.ok(Math.abs(contentLayout.leftGap-contentLayout.rightGap)<=1, 'the compact devices column is centered in the workspace');
  assert.ok(cardGeometry.mediaWidth >= 118, 'the product image uses a wider left-hand row thumbnail');
  assert.equal(
    await page.locator('.plants-device-media img').first().evaluate(image => getComputedStyle(image).objectFit),
    'contain',
    'product imagery remains uncropped inside the wider media frame'
  );
  assert.ok(cardGeometry.gap >= 14, 'product image and device content retain clear separation');
  assert.equal(
    await page.locator('.plants-device-card').evaluateAll(cards => cards.every(card => getComputedStyle(card).backgroundColor === 'rgba(0, 0, 0, 0)')),
    true,
    'device rows remain flat at rest'
  );
  await page.getByRole('button', {name:'More actions for iStorage-G3'}).hover();
  assert.equal(
    await page.locator('.plants-device-card').nth(1).evaluate(card => getComputedStyle(card).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'action hover does not paint a background across the whole device group'
  );
  await page.mouse.move(0, 0);
  assert.equal(await page.locator('.plants-devices-add.wd-glass').count(), 1, 'the page-level Add action keeps the shared glass material');
  assert.equal(
    await page.locator('.plants-devices-toolbar').evaluate(toolbar => {
      const toolbarBox=toolbar.getBoundingClientRect();
      const addBox=toolbar.querySelector('.plants-devices-add').getBoundingClientRect();
      return Math.abs(toolbarBox.right-addBox.right)<=1;
    }),
    true,
    'Add device remains aligned to the right edge of the compact toolbar'
  );
  assert.equal(await page.locator('.plants-device-icon-action.wd-glass').count(), 8, 'important row actions keep the previous glass material');
  assert.equal(await page.getByRole('button', {name:'Open iStorage-G3 settings'}).count(), 0, 'Battery does not expose a settings action');
  assert.equal(await page.locator('.plants-device-card').nth(1).locator('.plants-device-icon-action').count(), 2, 'Battery keeps only upgrade and more actions');
  assert.match(
    await page.locator('.plants-device-firmware .plants-device-action-icon').first().evaluate(icon => icon.style.getPropertyValue('--icon-mask')),
    /M13\.6478/,
    'the upgrade action uses the Figma update icon'
  );
  assert.equal(
    await page.locator('.plants-device-card').nth(1).evaluate(card => {
      const separator=getComputedStyle(card,'::before');
      return separator.content!=='none'&&separator.height==='1px'&&separator.backgroundImage.includes('linear-gradient');
    }),
    true,
    'adjacent devices use a low-contrast rule with softened ends'
  );
  const deviceDividerBounds=await page.locator('.plants-device-card').nth(1).evaluate(card => {
    const host=card.closest('.plants-devices-host');
    const cardBox=card.getBoundingClientRect();
    const hostBox=host.getBoundingClientRect();
    const separator=getComputedStyle(card,'::before');
    return {
      leftGap:Math.abs(cardBox.left+parseFloat(separator.left)-hostBox.left),
      rightGap:Math.abs(cardBox.right-parseFloat(separator.right)-hostBox.right)
    };
  });
  assert.ok(deviceDividerBounds.leftGap<=1&&deviceDividerBounds.rightGap<=1, 'device separators run to both workspace edges');
  assert.equal(
    await page.locator('.plants-device-icon-action').first().evaluate(button => {
      const box=button.getBoundingClientRect();
      return Math.round(box.width)===36&&Math.round(box.height)===36;
    }),
    true,
    'important row actions use the 36px shared glass geometry'
  );
  assert.deepEqual(
    await page.locator('.plants-device-actions-buttons').first().evaluate(group => {
      const buttons=[...group.querySelectorAll('.plants-device-icon-action')].map(button => button.getBoundingClientRect());
      return buttons.slice(1).map((button,index)=>Math.round(button.left-buttons[index].right));
    }),
    [8,8],
    'device action buttons use the shared 8px control-group spacing'
  );
  const alignment = await page.locator('.plants-device-card').nth(1).evaluate(card => {
    const left = selector => card.querySelector(selector).getBoundingClientRect().left;
    return {
      contentLeft:left('.plants-device-main'),
      titleLeft:left('.plants-device-name'),
      fieldLeft:left('.plants-device-field-item'),
      clusterLeft:left('.plants-device-cluster-label')
    };
  });
  for(const key of ['titleLeft','fieldLeft','clusterLeft']){
    assert.ok(Math.abs(alignment[key]-alignment.contentLeft)<=1, `${key} aligns with the device content column`);
  }
  const sharedFieldColumns = await page.locator('.plants-device-card').evaluateAll(cards => {
    const inverter=cards.find(card=>card.dataset.deviceType==='inverter');
    const battery=cards.find(card=>card.dataset.deviceType==='bms');
    const heater=cards.find(card=>card.dataset.deviceType==='heater');
    const itemLeft=(card,index)=>card.querySelectorAll('.plants-device-field-item')[index]?.getBoundingClientRect().left;
    return [itemLeft(inverter,0),itemLeft(inverter,1),itemLeft(battery,0),itemLeft(battery,1),itemLeft(heater,0),itemLeft(heater,1)];
  });
  assert.ok(Math.abs(sharedFieldColumns[0]-sharedFieldColumns[2])<=1, 'Battery and Inverter first fields share a column');
  assert.ok(Math.abs(sharedFieldColumns[1]-sharedFieldColumns[3])<=1, 'Installation capacity aligns with Hardware version above');
  assert.ok(Math.abs(sharedFieldColumns[0]-sharedFieldColumns[4])<=1, 'Heater uses the same first field column');
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(1).evaluate(card => ({
      name:[getComputedStyle(card.querySelector('.plants-device-name')).fontSize,getComputedStyle(card.querySelector('.plants-device-name')).fontWeight],
      meta:getComputedStyle(card.querySelector('.plants-device-meta-line')).fontSize,
      field:getComputedStyle(card.querySelector('.plants-device-field-name')).fontSize,
      cluster:getComputedStyle(card.querySelector('.plants-device-cluster-label')).fontSize,
      battery:getComputedStyle(card.querySelector('.plants-device-battery-cell')).fontSize
    })),
    {name:['16px','590'],meta:'13px',field:'12px',cluster:'14px',battery:'13px'},
    'device typography uses one compact type scale'
  );
  assert.equal(
    await page.locator('.plants-device-field-value').first().getAttribute('data-type-style'),
    'Footnote/Medium',
    'technical values retain the established Footnote/Medium type binding'
  );
  const topLevelSerialCopies=page.locator('.plants-device-field-value .plants-device-serial-copy');
  assert.equal(await topLevelSerialCopies.count(), 2, 'Inverter and Heater expose their device SN as copy targets');
  await topLevelSerialCopies.first().hover();
  assert.match(await topLevelSerialCopies.first().evaluate(button => getComputedStyle(button).textDecorationLine), /underline/, 'device SN shows an underline on hover');
  await topLevelSerialCopies.last().hover();
  assert.match(await topLevelSerialCopies.last().evaluate(button => getComputedStyle(button).textDecorationLine), /underline/, 'every device SN uses the same hover interaction');
  const batteryBodyFont=await page.locator('.plants-device-card').nth(1).evaluate(card => ({
    cell:getComputedStyle(card.querySelector('.plants-device-battery-cell')).fontFamily,
    identity:getComputedStyle(card.querySelector('.plants-device-name')).fontFamily
  }));
  assert.equal(batteryBodyFont.cell, batteryBodyFont.identity, 'battery records use the standard interface font');

  const firstClusterGroup = page.locator('.plants-device-cluster').first();
  const firstCluster = firstClusterGroup.locator('.plants-device-cluster-toggle');
  assert.equal(await firstCluster.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), false);
  assert.deepEqual(
    await page.locator('.plants-device-cluster-summary').allTextContents(),
    ['6 modules','6 modules','6 modules','6 modules'],
    'every collapsed cluster exposes its battery module count'
  );
  assert.equal(
    await firstClusterGroup.locator('.plants-device-cluster-summary').evaluate(summary=>{
      const chevron=summary.parentElement.querySelector('.plants-device-cluster-chevron');
      return summary.nextElementSibling===chevron;
    }),
    true,
    'the module count sits immediately before the disclosure chevron'
  );
  assert.equal(
    await firstClusterGroup.locator('.plants-device-cluster-summary').evaluate(summary=>getComputedStyle(summary).color),
    await page.evaluate(()=>{
      const probe=document.createElement('span');
      probe.style.color='var(--wd-label-tertiary)';
      document.body.append(probe);
      const color=getComputedStyle(probe).color;
      probe.remove();
      return color;
    }),
    'the module count uses the quiet tertiary label tone'
  );
  const chevronDefaultColor=await firstClusterGroup.locator('.plants-device-cluster-chevron').evaluate(node => getComputedStyle(node).backgroundColor);
  await firstCluster.click();
  assert.equal(await firstCluster.getAttribute('aria-expanded'), 'true');
  const clusterOpenMotion=await page.locator('.plants-device-cluster-detail').first().evaluate(detail => ({
    animations:detail.getAnimations().map(animation=>animation.effect.getTiming().duration),
    clipping:detail.classList.contains('is-disclosing'),
    targetHeight:parseFloat(detail.getAnimations()[0]?.effect.getKeyframes().at(-1)?.height||'0')
  }));
  assert.ok(clusterOpenMotion.animations.includes(380), 'cluster expansion uses the shared disclosure duration');
  assert.equal(clusterOpenMotion.clipping, true, 'cluster content is clipped only while its height animates');
  assert.ok(clusterOpenMotion.targetHeight>0, 'cluster content has a real animated target height instead of snapping open');
  await settle(page);
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), true);
  assert.equal(
    await page.locator('.plants-device-cluster-detail').first().evaluate(detail => detail.classList.contains('is-disclosing')),
    false,
    'cluster clipping is removed after the expansion settles'
  );
  const expandedClusterAlignment=await page.locator('.plants-device-card').nth(1).evaluate(card => ({
    label:card.querySelector('.plants-device-cluster-label').getBoundingClientRect().left,
    detail:card.querySelector('.plants-device-cluster-detail .plants-device-cluster-section').getBoundingClientRect().left
  }));
  assert.ok(Math.abs(expandedClusterAlignment.detail-expandedClusterAlignment.label)<=1, 'expanded cluster content shares the cluster label left edge');
  const clusterHoverGeometry = await page.locator('.plants-device-card').nth(1).evaluate(card => {
    const main=card.querySelector('.plants-device-main').getBoundingClientRect();
    const toggle=card.querySelector('.plants-device-cluster-toggle').getBoundingClientRect();
    const chevron=card.querySelector('.plants-device-cluster-chevron').getBoundingClientRect();
    return {
      leftOverhang:main.left-toggle.left,
      rightOverhang:toggle.right-main.right,
      toggleHeight:toggle.height,
      chevronWidth:chevron.width
    };
  });
  assert.ok(clusterHoverGeometry.leftOverhang>=9.5&&clusterHoverGeometry.leftOverhang<=10.5, 'cluster hover surface has a restrained left overhang');
  assert.ok(clusterHoverGeometry.rightOverhang>=9.5&&clusterHoverGeometry.rightOverhang<=10.5, 'cluster hover surface has a restrained right overhang');
  assert.ok(clusterHoverGeometry.toggleHeight>=39.5, 'cluster rows use a taller hit area');
  assert.ok(clusterHoverGeometry.chevronWidth>=17.5, 'cluster expand arrow is visibly larger');
  assert.equal(
    await firstCluster.evaluate(button => getComputedStyle(button).borderRadius),
    '12px',
    'cluster hover surface keeps rounded outer corners'
  );
  await firstClusterGroup.hover();
  await page.waitForTimeout(260);
  const clusterSurface = await firstClusterGroup.evaluate(cluster => {
    const hoverSurface=cluster.querySelector('.plants-device-cluster-hover');
    const surface=getComputedStyle(hoverSurface);
    return {
      opacity:Number(surface.opacity),
      radius:surface.borderRadius,
      chevronColor:getComputedStyle(cluster.querySelector('.plants-device-cluster-chevron')).backgroundColor,
      labelColor:getComputedStyle(cluster.querySelector('.plants-device-cluster-label')).color
    };
  });
  assert.equal(clusterSurface.opacity, 1, 'the whole expanded cluster exposes one hover surface');
  assert.equal(clusterSurface.radius, '12px', 'the whole-cluster hover surface keeps its rounded corners');
  assert.notEqual(chevronDefaultColor, clusterSurface.chevronColor, 'the cluster chevron gets brighter on hover');
  assert.equal(clusterSurface.chevronColor, clusterSurface.labelColor, 'the hovered chevron reaches the primary label color');
  await page.mouse.move(0, 0);
  const clusterTopAlignment = await page.locator('.plants-device-cluster-detail').first().evaluate(detail => {
    const detailBox=detail.getBoundingClientRect();
    const titleBox=detail.querySelector('.plants-device-cluster-section-title').getBoundingClientRect();
    return {
      detailTop:detailBox.top,
      titleTop:titleBox.top,
      paddingTop:getComputedStyle(detail).paddingTop,
      sectionGap:getComputedStyle(detail).rowGap
    };
  });
  assert.equal(clusterTopAlignment.paddingTop, '8px', 'cluster detail has a clear top breathing space');
  assert.ok(Math.abs((clusterTopAlignment.titleTop-clusterTopAlignment.detailTop)-8)<=1, 'left-side cluster text starts after the top breathing space');
  assert.equal(clusterTopAlignment.sectionGap, '18px', 'Sub-master and Batteries sections have a larger separator space');
  assert.ok(
    await page.locator('.plants-device-card').nth(1).evaluate(card => {
      const fields=card.querySelector('.plants-device-fields').getBoundingClientRect();
      const cluster=card.querySelector('.plants-device-cluster').getBoundingClientRect();
      const gap=cluster.top-fields.bottom;
      return gap>=15&&gap<=17;
    }),
    'the technical field row keeps a tighter vertical rhythm before the first cluster'
  );
  assert.equal(
    await page.locator('.plants-device-cluster').evaluateAll(clusters => clusters.every(cluster => {
      const style=getComputedStyle(cluster);
      return style.borderTopWidth==='1px'&&style.borderTopStyle==='solid';
    })),
    true,
    'cluster rows expose low-contrast separators above and between groups'
  );
  assert.equal(await page.locator('.plants-device-cluster-detail').first().locator('.plants-device-feedback-row').count(), 5, 'expanded clusters match the reference sub-master field set');
  assert.equal(await page.locator('.plants-device-cluster-detail').first().locator('.plants-device-battery-row').count(), 6, 'expanded clusters list six battery modules');
  const clusterTextScale = await page.locator('.plants-device-cluster-detail').first().evaluate(detail => ({
    section:getComputedStyle(detail.querySelector('.plants-device-cluster-section-title')).fontSize,
    model:getComputedStyle(detail.querySelector('.plants-device-feedback-value')).fontSize,
    subMasterId:getComputedStyle(detail.querySelector('.plants-device-feedback-label')).fontSize,
    batteryId:getComputedStyle(detail.querySelector('.plants-device-battery-heading')).fontSize
  }));
  assert.ok(Number.parseFloat(clusterTextScale.section)>Number.parseFloat(clusterTextScale.model), 'Sub-master and Batteries headings are larger than their values');
  assert.equal(clusterTextScale.subMasterId, '13px');
  assert.equal(clusterTextScale.batteryId, clusterTextScale.subMasterId, 'Battery headers match the Sub-master ID header size');
  const sharedGridAlignment=await page.locator('.plants-device-card').nth(1).evaluate(card => {
    const fieldGrid=card.querySelector('.plants-device-fields');
    const fieldGridBox=fieldGrid.getBoundingClientRect();
    const fieldColumn=parseFloat(getComputedStyle(fieldGrid).gridTemplateColumns);
    const fieldStarts=Array.from({length:5},(_,index)=>fieldGridBox.left+(index*(fieldColumn+20)));
    const subMaster=[...card.querySelectorAll('.plants-device-cluster:not([hidden]) .plants-device-cluster-submaster .plants-device-feedback-row')]
      .filter(node => node.getBoundingClientRect().width>0)
      .map(node => node.getBoundingClientRect().left);
    const batteryHeaders=[...card.querySelectorAll('.plants-device-cluster:not([hidden]) .plants-device-battery-table th')]
      .filter(node => node.getBoundingClientRect().width>0)
      .map(node => node.getBoundingClientRect().left);
    return {
      subMaster:subMaster.map((left,index)=>left-fieldStarts[index]),
      batteries:batteryHeaders.map((left,index)=>left-fieldStarts[index])
    };
  });
  assert.ok(sharedGridAlignment.subMaster.every(delta => Math.abs(delta)<=1), `Sub-master fields continue the device six-column grid: ${JSON.stringify(sharedGridAlignment.subMaster)}`);
  assert.ok(sharedGridAlignment.batteries.every(delta => Math.abs(delta)<=1), `Battery fields continue the device six-column grid: ${JSON.stringify(sharedGridAlignment.batteries)}`);
  assert.deepEqual(
    await page.locator('.plants-device-card').nth(1).evaluate(card => {
      const model=card.querySelectorAll('.plants-device-cluster-submaster .plants-device-feedback-value')[1];
      const firmwareHeader=card.querySelectorAll('.plants-device-battery-table th')[1];
      return {
        modelWhiteSpace:getComputedStyle(model).whiteSpace,
        modelFits:model.scrollWidth<=model.clientWidth,
        headerFits:firmwareHeader.scrollWidth<=firmwareHeader.clientWidth
      };
    }),
    {modelWhiteSpace:'nowrap',modelFits:true,headerFits:true},
    'the compressed aligned columns keep their model and firmware label on one line'
  );
  const batterySpacing = await page.locator('.plants-device-cluster-detail').first().locator('.plants-device-battery-row').evaluateAll(rows => rows.map(row => getComputedStyle(row.querySelector('td')).paddingTop));
  assert.equal(batterySpacing[0], '12px', 'the first battery row gets a little extra space below the table header');
  assert.ok(batterySpacing.slice(1).every(padding => padding === '7px'), 'subsequent battery rows keep the normal compact rhythm');
  const batteryColumnAlignment = await page.locator('.plants-device-cluster-detail').first().evaluate(detail => {
    const subMaster=[...detail.querySelectorAll('.plants-device-cluster-submaster .plants-device-feedback-row')]
      .map(row => row.getBoundingClientRect().left);
    const batteryHeaders=[...detail.querySelectorAll('.plants-device-battery-table th')]
      .map(cell => cell.getBoundingClientRect().left);
    return batteryHeaders.map((left,index)=>left-subMaster[index]);
  });
  assert.ok(batteryColumnAlignment.every(delta => Math.abs(delta)<=2), `battery columns align to the first four Sub-master columns: ${JSON.stringify(batteryColumnAlignment)}`);
  await page.locator('.plants-device-battery-row').first().hover();
  assert.equal(
    await page.locator('.plants-device-battery-row').first().evaluate(row => getComputedStyle(row).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'battery rows do not highlight on hover'
  );
  await page.evaluate(() => {
    window.__copiedSerial=null;
    Object.defineProperty(navigator,'clipboard',{
      configurable:true,
      value:{writeText:async value=>{window.__copiedSerial=value;}}
    });
  });
  const inverterSerial=topLevelSerialCopies.first();
  const inverterSerialValue=await inverterSerial.textContent();
  await inverterSerial.click();
  await page.waitForFunction(() => window.__copiedSerial !== null);
  assert.equal(await page.evaluate(() => window.__copiedSerial), inverterSerialValue, 'clicking a device-level SN copies its serial number');
  await page.evaluate(() => {window.__copiedSerial=null;});
  const serialCopy=firstClusterGroup.locator('.plants-device-serial-copy').first();
  const serialValue=await serialCopy.textContent();
  assert.equal(await serialCopy.evaluate(button => getComputedStyle(button).whiteSpace), 'nowrap', 'desktop SN values stay on one line');
  await serialCopy.hover();
  assert.match(
    await serialCopy.evaluate(button => getComputedStyle(button).textDecorationLine),
    /underline/,
    'SN copy targets expose an underline on hover'
  );
  await serialCopy.click();
  await page.waitForFunction(() => window.__copiedSerial !== null);
  assert.equal(await page.evaluate(() => window.__copiedSerial), serialValue, 'clicking SN copies the serial number');
  assert.equal(await firstCluster.getAttribute('aria-expanded'), 'true', 'copying SN does not collapse the cluster');
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), true, 'cluster content stays open after copying SN');
  await page.mouse.move(0, 0);
  await page.locator('.plants-device-card').nth(1).evaluate(card => {
    window.__clusterLayoutStyleMutations=0;
    window.__clusterLayoutMutationObserver?.disconnect();
    window.__clusterLayoutMutationObserver=new MutationObserver(records => {
      window.__clusterLayoutStyleMutations+=records.length;
    });
    window.__clusterLayoutMutationObserver.observe(card,{attributes:true,attributeFilter:['style']});
  });
  await firstClusterGroup.locator('.plants-device-cluster-section-title').first().click();
  assert.equal(await firstCluster.getAttribute('aria-expanded'), 'false');
  assert.ok(
    await page.locator('.plants-device-cluster-detail').first().evaluate(detail => detail.getAnimations().some(animation => animation.effect.getTiming().duration===380)),
    'clicking anywhere in the expanded cluster animates its collapse'
  );
  assert.deepEqual(
    await page.locator('.plants-device-cluster-detail').first().evaluate(detail => {
      const keyframes=detail.getAnimations()[0].effect.getKeyframes();
      const last=keyframes.at(-1);
      return [last.paddingTop,last.paddingBottom];
    }),
    ['0px','0px'],
    'collapse removes the detail padding so its height can reach zero continuously'
  );
  await settle(page);
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), false);
  assert.equal(
    await page.evaluate(() => {
      window.__clusterLayoutMutationObserver?.disconnect();
      return window.__clusterLayoutStyleMutations;
    }),
    0,
    'height-only disclosure motion does not rewrite card alignment styles every frame'
  );
  await page.emulateMedia({reducedMotion:'reduce'});
  await firstCluster.click();
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), true);
  assert.equal(
    await page.locator('.plants-device-cluster-detail').first().evaluate(detail => detail.getAnimations().length),
    0,
    'reduced motion opens the cluster immediately'
  );
  await firstCluster.click();
  assert.equal(await page.locator('.plants-device-cluster-detail').first().isVisible(), false);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await firstCluster.click();
  await settle(page);
  await firstCluster.click();
  await settle(page);
  await page.mouse.move(0,0);
  await page.waitForTimeout(400);
  assert.equal(
    await firstClusterGroup.locator('.plants-device-cluster-hover').evaluate(surface => Number(getComputedStyle(surface).opacity)),
    0,
    'pointer focus left by closing a cluster does not keep the hover surface visible'
  );

  await page.locator('.plants-device-card').first().getByRole('button', {name:'Open iHybrid settings'}).click();
  await page.waitForTimeout(420);
  assert.match(page.url(), /\/plants\/p25\/devices\/inverter-settings\?device=inverter&serial=/, 'inverter settings open as a shareable route');
  assert.equal(await page.locator('.inverter-settings-window').isVisible(), true, 'the dedicated inverter settings window is visible');
  await page.locator('.isw-close-button').click();
  await page.waitForTimeout(650);
  assert.match(page.url(), /\/plants\/p25\/devices\?device=inverter/, 'Close X plays the shared exit before returning to Devices');

  await page.getByRole('button', {name:'Open iHeater settings'}).click();
  assert.equal(await page.getByRole('button', {name:'Save changes'}).isDisabled(), true, 'Heater uses the same clean-state save logic');
  await page.getByRole('radio', {name:/Eco/}).click();
  assert.equal(await page.getByRole('button', {name:'Save changes'}).isEnabled(), true, 'Heater uses the same dirty-state save logic');
  await page.getByRole('button', {name:'Cancel'}).click();

  const hybridMore=page.getByRole('button', {name:'More actions for iHybrid'});
  await hybridMore.click();
  await page.waitForTimeout(320);
  assert.equal(await page.locator('.plants-device-actions-menu').count(),1,'device actions open from the more trigger');
  await hybridMore.click();
  await page.waitForTimeout(260);
  assert.equal(await page.locator('.plants-device-actions-menu').count(),0,'device actions close from the same more trigger');
  assert.equal(await hybridMore.getAttribute('aria-expanded'),'false','the device more trigger exposes its closed state');
  await hybridMore.click();
  await page.waitForTimeout(320);
  const actionMenuRows=page.locator('.plants-device-actions-menu .wd-menu-row');
  await page.mouse.move(0,0);
  await page.waitForTimeout(320);
  const actionMenuGeometry=await page.locator('.plants-device-actions-menu').evaluate(panel => {
    const panelBox=panel.getBoundingClientRect();
    const anchor=document.querySelector('.plants-device-actions button[aria-expanded="true"]').getBoundingClientRect();
    return {
      radius:getComputedStyle(panel).borderRadius,
      anchorGap:Math.abs(panelBox.right-anchor.right)
    };
  });
  assert.equal(actionMenuGeometry.radius, '30px', 'device actions use the standard menu corner radius');
  assert.ok(actionMenuGeometry.anchorGap<=1, 'device actions align their right edge to the trigger instead of the viewport');
  assert.deepEqual(await actionMenuRows.locator('.wd-menu-label').allTextContents(), ['Run system test','Replace device','Rename','Unbind device']);
  assert.equal(await actionMenuRows.locator('.target-nav-icon').count(), 4, 'every device menu action carries a Figma icon');
  assert.deepEqual(
    await actionMenuRows.evaluateAll(rows => rows.map(row => row.querySelector('.target-nav-icon .target-icon-art')?.style.getPropertyValue('--icon-mask').match(/actions\/([^\"]+)/)?.[1])),
    ['system-tests.svg','replace.svg','rename.svg','delete.svg'],
    'device menu icons use their matching Figma exports'
  );
  assert.ok(
    await actionMenuRows.evaluateAll(rows => rows.every(row => {
      const rowBox=row.getBoundingClientRect();
      const iconBox=row.querySelector('.target-nav-icon').getBoundingClientRect();
      return Math.abs((iconBox.left-rowBox.left)-14)<=1;
    })),
    'device menu icons align before the labels'
  );
  assert.deepEqual(
    await actionMenuRows.evaluateAll(rows => rows.map(row => getComputedStyle(row.querySelector('.plants-device-menu-icon')).maskSize)),
    ['108% 108%','105% 105%','78% 78%','112% 112%'],
    'device menu icons use their calibrated visual sizes'
  );
  const dangerRow=page.getByRole('menuitem', {name:'Unbind device'});
  await dangerRow.hover();
  await page.waitForTimeout(300);
  const dangerHover=await dangerRow.evaluate(row => {
    const label=row.querySelector('.wd-menu-label');
    const icon=row.querySelector('.target-nav-icon');
    const canvas=document.createElement('canvas');
    canvas.width=1;
    canvas.height=1;
    const context=canvas.getContext('2d');
    context.clearRect(0,0,1,1);
    context.fillStyle=getComputedStyle(row).backgroundColor;
    context.fillRect(0,0,1,1);
    return {
      background:[...context.getImageData(0,0,1,1).data],
      backgroundCss:getComputedStyle(row).backgroundColor,
      rowColor:getComputedStyle(row).color,
      labelColor:getComputedStyle(label).color,
      iconColor:getComputedStyle(icon).color
    };
  });
  assert.equal(dangerHover.iconColor, dangerHover.labelColor, 'danger icon matches the red label on hover');
  assert.ok(dangerHover.background[0]>dangerHover.background[1]+80&&dangerHover.background[0]>dangerHover.background[2]+80, 'danger hover uses a red-tinted surface');
  assert.ok(dangerHover.background[3]>=27&&dangerHover.background[3]<=31, 'danger hover tint stays pale at roughly 11%');
  await page.mouse.move(0,0);
  await actionMenuRows.nth(2).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  assert.equal(await dangerRow.evaluate(row => row.matches(':focus-visible')), true, 'keyboard focus reaches the danger row');
  const dangerFocus=await dangerRow.evaluate(row => ({
    background:getComputedStyle(row).backgroundColor,
    labelColor:getComputedStyle(row.querySelector('.wd-menu-label')).color,
    iconColor:getComputedStyle(row.querySelector('.target-nav-icon')).color
  }));
  assert.equal(dangerFocus.background, dangerHover.backgroundCss, 'danger focus-visible shares the hover surface');
  assert.equal(dangerFocus.iconColor, dangerFocus.labelColor, 'danger focus-visible keeps icon and label red');
  await actionMenuRows.nth(2).hover();
  await page.waitForTimeout(300);
  const safeHoverBackground=await actionMenuRows.nth(2).evaluate(row => {
    const canvas=document.createElement('canvas');
    canvas.width=1;
    canvas.height=1;
    const context=canvas.getContext('2d');
    context.fillStyle=getComputedStyle(row).backgroundColor;
    context.fillRect(0,0,1,1);
    return [...context.getImageData(0,0,1,1).data];
  });
  assert.ok(safeHoverBackground[0]<safeHoverBackground[1]+12&&safeHoverBackground[0]<safeHoverBackground[2]+20, 'ordinary menu rows keep a neutral hover background');
  await page.getByRole('menuitem', {name:'Rename'}).click();
  assert.equal(
    await page.locator('.plants-device-dialog').evaluate(dialog => dialog.offsetWidth),
    640,
    'Rename remains in the narrow dialog width'
  );
  assert.equal(await page.locator('.plants-device-dialog-title-icon').count(), 1, 'Rename exposes a title icon');
  assert.equal(await page.locator('.plants-device-dialog-description').count(), 0, 'Rename has no explanatory subtitle');
  const renameInput=page.getByLabel('Device name', {exact:false});
  const renameSave=page.getByRole('button', {name:'Save name'});
  assert.equal(await renameSave.isDisabled(), true, 'Rename starts with Save name disabled');
  await renameInput.evaluate(input => input.blur());
  const editFieldDefault=await renameInput.evaluate(input => {
    const shell=input.closest('.wd-edit-field');
    return {
      border:getComputedStyle(shell).borderWidth,
      fill:getComputedStyle(shell).backgroundColor,
      outline:getComputedStyle(shell).outlineStyle
    };
  });
  assert.equal(editFieldDefault.border, '0px');
  assert.match(editFieldDefault.fill, /0\.08\)/);
  assert.equal(editFieldDefault.outline, 'none');
  await renameInput.hover();
  assert.notEqual(await renameInput.evaluate(input => getComputedStyle(input.closest('.wd-edit-field')).backgroundColor), editFieldDefault.fill, 'editable fields brighten on hover');
  await renameInput.focus();
  const editFocus=await renameInput.evaluate(input => {
    const shell=input.closest('.wd-edit-field');
    return {
      inputOutline:getComputedStyle(input).outlineStyle,
      shellOutline:getComputedStyle(shell).outlineColor,
      blue:getComputedStyle(document.documentElement).getPropertyValue('--wd-blue').trim()
    };
  });
  assert.equal(editFocus.inputOutline, 'none', 'focused input has no native blue outline');
  assert.notEqual(editFocus.shellOutline, editFocus.blue, 'editable field shell uses a neutral focus outline');
  await renameInput.fill('North inverter');
  assert.equal(await renameSave.isEnabled(), true, 'Rename enables Save name after a real change');
  await renameInput.fill('iHybrid');
  assert.equal(await renameSave.isDisabled(), true, 'Rename disables Save name when the original name is restored');
  await renameInput.fill('North inverter');
  await renameSave.click();
  assert.equal(await page.locator('.plants-device-name').first().textContent(), 'North inverter', 'rename updates the card in place');

  await page.getByRole('button', {name:'More actions for North inverter'}).click();
  await page.getByRole('menuitem', {name:'Replace device'}).click();
  await settle(page);
  assert.equal(await page.locator('.plants-device-dialog-title-icon').count(), 1, 'Replace exposes a title icon');
  assert.equal(await page.locator('.plants-device-dialog-description').count(), 0, 'Replace has no explanatory subtitle');
  assert.equal(
    await page.locator('.plants-device-dialog--replace').evaluate(dialog => {
      const box=dialog.getBoundingClientRect();
      return {
        width:dialog.offsetWidth,
        centerOffset:(innerHeight/2)-(box.top+box.height/2),
        columns:getComputedStyle(dialog.querySelector('.plants-device-replace-columns')).gridTemplateColumns.split(' ').length
      };
    }).then(result => `${result.width}/${result.columns}/${Math.round(result.centerOffset)}`),
    '640/1/80',
    'Replace uses the narrow single-flow dialog with the standard narrow modal offset'
  );
  await page.locator('.plants-device-dialog-actions').getByRole('button', {name:'Cancel'}).click();
  await page.waitForFunction(() => !document.querySelector('.plants-device-modal'));

  await page.getByRole('button', {name:'Add device'}).click();
  assert.equal(await page.getByRole('heading', {name:'Add device'}).count(), 1);
  const dialogMaterial=await page.locator('.plants-device-dialog').evaluate(dialog => {
    const modal=dialog.closest('.plants-device-modal');
    const backdrop=modal.querySelector(':scope>.wd-modal-backdrop');
    const frame=dialog.querySelector('.wd-modal-panel-frame');
    const animations=[...dialog.getAnimations({subtree:true}),...backdrop.getAnimations()];
    return {
      width:dialog.offsetWidth,
      radius:getComputedStyle(dialog).borderRadius,
      glass:dialog.classList.contains('wd-glass'),
      chrome:dialog.classList.contains('wd-glass-chrome'),
      static:dialog.classList.contains('wd-glass--static'),
      modalClass:modal.classList.contains('wd-modal-fullscreen'),
      panelClass:dialog.classList.contains('wd-modal-panel'),
      frameClass:frame.classList.contains('wd-modal-panel-frame'),
      searchClass:modal.classList.contains('wd-search-fullscreen'),
      searchPanelClass:dialog.classList.contains('wd-search-panel'),
      entering:modal.hasAttribute('data-entering'),
      animationNames:animations.map(animation=>animation.animationName).filter(Boolean),
      backdropDuration:backdrop.getAnimations().find(animation=>animation.animationName==='wd-modal-backdrop-in')?.effect.getTiming().duration,
      backdropKeyframes:backdrop.getAnimations().find(animation=>animation.animationName==='wd-modal-backdrop-in')?.effect.getKeyframes()
        .map(keyframe=>({offset:keyframe.offset,easing:keyframe.easing})),
      panelKeyframes:dialog.getAnimations().find(animation=>animation.animationName==='wd-modal-panel-in')?.effect.getKeyframes(),
      panelDepths:dialog.getAnimations().find(animation=>animation.animationName==='wd-modal-panel-in')?.effect.getKeyframes()
        .map(keyframe=>new DOMMatrixReadOnly(keyframe.transform||'none').m43),
      frameKeyframes:frame.getAnimations().find(animation=>animation.animationName==='wd-modal-panel-frame-in')?.effect.getKeyframes(),
      frameBlurValues:frame.getAnimations().find(animation=>animation.animationName==='wd-modal-panel-frame-in')?.effect.getKeyframes()
        .map(keyframe=>parseFloat(keyframe.filter.match(/blur\(([\d.]+)px\)/)?.[1]||'0')),
      frameDuration:frame.getAnimations().find(animation=>animation.animationName==='wd-modal-panel-frame-in')?.effect.getTiming().duration,
      titleIcons:dialog.querySelectorAll('.plants-device-dialog-title-icon').length,
      descriptions:dialog.querySelectorAll('.plants-device-dialog-description').length
    };
  });
  assert.equal(dialogMaterial.width, 640, 'Add device uses the narrow dialog width');
  assert.equal(dialogMaterial.titleIcons, 1, 'Add device exposes a title icon');
  assert.equal(dialogMaterial.descriptions, 0, 'Add device has no explanatory subtitle');
  assert.equal(dialogMaterial.radius, '30px', 'device dialogs use the standard floating-surface radius');
  assert.equal(dialogMaterial.glass, true, 'device dialogs use the shared Glass Surface');
  assert.equal(dialogMaterial.chrome, false, 'device dialogs use the standard Home glass branch');
  assert.equal(dialogMaterial.static, false, 'device dialogs use the interactive Home glass branch');
  assert.equal(dialogMaterial.modalClass, true, 'device dialogs use the shared modal overlay class');
  assert.equal(dialogMaterial.panelClass, true, 'device dialogs use the shared modal panel class');
  assert.equal(dialogMaterial.frameClass, true, 'device dialogs use the shared modal content frame');
  assert.equal(dialogMaterial.searchClass, false, 'device dialogs no longer reuse the Home search overlay');
  assert.equal(dialogMaterial.searchPanelClass, false, 'device dialogs no longer reuse the Home search panel');
  assert.equal(dialogMaterial.entering, true, 'device dialogs enter with the dedicated modal animation');
  assert.ok(dialogMaterial.animationNames.includes('wd-modal-backdrop-in'), 'modal backdrop frost enters on its own layer');
  assert.equal(dialogMaterial.backdropDuration, 520, 'modal backdrop blur stays synchronized with the window for its full entrance');
  assert.deepEqual(
    dialogMaterial.backdropKeyframes,
    [
      {offset:0,easing:'cubic-bezier(0.32, 0.08, 0.2, 1)'},
      {offset:1,easing:'cubic-bezier(0.32, 0.08, 0.2, 1)'}
    ],
    'modal backdrop uses one continuous eased blur segment instead of subdivided keyframes'
  );
  assert.ok(dialogMaterial.animationNames.includes('wd-modal-panel-in'), 'modal panel approaches on the Z axis');
  assert.ok(dialogMaterial.animationNames.includes('wd-modal-panel-frame-in'), 'modal content resolves from blur to sharp');
  assert.match(dialogMaterial.panelKeyframes?.[0]?.transform||'', /translate3d.*64px/, 'modal panel starts slightly closer than its settled plane');
  assert.ok(dialogMaterial.panelDepths?.every(depth => depth>=0), 'modal panel only recedes toward the settled plane during entry');
  assert.equal(dialogMaterial.panelDepths?.at(-1), 0, 'modal panel settles at the screen plane without overshoot');
  assert.equal(dialogMaterial.frameKeyframes?.[0]?.filter, 'blur(16px)', 'modal content starts visibly blurred at the larger entry size');
  assert.equal(dialogMaterial.frameKeyframes?.[0]?.opacity, '0.22', 'the distant modal remains softly visible instead of appearing from nothing');
  assert.equal(dialogMaterial.frameKeyframes?.at(-1)?.filter, 'blur(0px)', 'modal content resolves fully sharp');
  assert.ok(
    dialogMaterial.frameBlurValues?.every((value,index,values) => index===0||value<=values[index-1]),
    'modal content blur decreases monotonically without a late snap'
  );
  assert.equal(dialogMaterial.frameDuration, 520, 'modal content resolves blur within the unified entrance duration');
  await settle(page);
  await page.waitForFunction(() => document.querySelector('.plants-device-modal')?.hasAttribute('data-entered'));
  assert.deepEqual(
    await page.locator('.plants-device-modal').evaluate(modal => {
      const backdrop=modal.querySelector(':scope>.wd-modal-backdrop');
      const probe=document.createElement('span');
      probe.style.backgroundColor='var(--wd-search-veil)';
      document.body.append(probe);
      const expectedVeil=getComputedStyle(probe).backgroundColor;
      probe.remove();
      const sample=color=>{
        const canvas=document.createElement('canvas');
        canvas.width=1;
        canvas.height=1;
        const context=canvas.getContext('2d');
        context.clearRect(0,0,1,1);
        context.fillStyle=color;
        context.fillRect(0,0,1,1);
        return [...context.getImageData(0,0,1,1).data];
      };
      return {
        veil:sample(getComputedStyle(backdrop).backgroundColor),
        expectedVeil:sample(expectedVeil),
        blur:getComputedStyle(backdrop).backdropFilter,
        willChange:getComputedStyle(backdrop).willChange,
        entering:modal.hasAttribute('data-entering'),
        entered:modal.hasAttribute('data-entered')
      };
    }),
    {veil:[0,0,0,74],expectedVeil:[0,0,0,74],blur:'blur(28px) saturate(1.05)',willChange:'backdrop-filter, background-color',entering:true,entered:true},
    'settled modal backdrop keeps its Home search veil, frost and compositor layer'
  );
  assert.ok(
    await page.locator('.plants-device-dialog').evaluate(dialog => {
      const box=dialog.getBoundingClientRect();
      return Math.abs((innerHeight/2)-(box.top+box.height/2)-80)<=1;
    }),
    'narrow dialogs use the stronger center-up placement rule'
  );
  await page.locator('.plants-device-dialog-actions').getByRole('button', {name:'Cancel'}).click();
  await page.waitForFunction(() => document.querySelector('.plants-device-modal')?.dataset.closing === 'true');
  const modalExitMotion=await page.locator('.plants-device-modal').evaluate(modal => Object.fromEntries(
    modal.getAnimations({subtree:true})
      .filter(animation=>animation.animationName?.startsWith('wd-modal-'))
      .map(animation=>[animation.animationName,animation.effect.getTiming()])
  ));
  assert.equal(modalExitMotion['wd-modal-backdrop-out']?.duration,420,'modal backdrop exits with the unified duration');
  assert.equal(modalExitMotion['wd-modal-backdrop-out']?.delay,0,'modal backdrop starts with the window instead of trailing it');
  assert.equal(modalExitMotion['wd-modal-panel-out']?.duration,420,'modal window exits over the same duration as its backdrop');
  assert.equal(modalExitMotion['wd-modal-panel-out']?.delay,0,'modal window starts its exit immediately');
  assert.equal(modalExitMotion['wd-modal-panel-frame-out']?.duration,420,'modal content shares the unified exit timeline');
  await page.waitForFunction(() => !document.querySelector('.plants-device-modal'));
  await page.getByRole('button', {name:'Add device'}).click();
  await page.getByLabel('Device SN', {exact:false}).fill('WMT-PREVIEW-99');
  await page.getByLabel('Device name', {exact:false}).fill('Workshop heater');
  await page.locator('.plants-device-dialog-actions').getByRole('button', {name:'Add device'}).click();
  assert.equal(await page.locator('.plants-device-card').count(), 4, 'Add Device appends a local preview device');
  assert.equal(await page.getByText('Workshop heater', {exact:true}).count(), 1);

  await page.getByRole('button', {name:'More actions for Workshop heater'}).click();
  await page.getByRole('menuitem', {name:'Unbind device'}).click();
  await settle(page);
  const confirmDialog=await page.locator('.plants-device-dialog--confirm').evaluate(dialog => {
    const box=dialog.getBoundingClientRect();
    const mark=dialog.querySelector('.plants-device-confirm-mark').getBoundingClientRect();
    const glyph=dialog.querySelector('.plants-device-confirm-mark .plants-device-action-icon').getBoundingClientRect();
    return {
      width:dialog.offsetWidth,
      centerOffset:Math.abs((innerHeight/2)-(box.top+box.height/2)-80),
      closeCount:dialog.querySelectorAll('.plants-device-dialog-close').length,
      headerCount:dialog.querySelectorAll('.plants-device-dialog-head').length,
      markWidth:mark.width,
      glyphWidth:glyph.width,
      buttonCount:dialog.querySelectorAll('.plants-device-confirm-actions .wd-button').length
    };
  });
  assert.equal(confirmDialog.width, 480, 'confirmation dialog uses the compact width');
  assert.ok(confirmDialog.centerOffset<=1, 'confirmation dialog follows the narrow center-up placement rule');
  assert.equal(confirmDialog.closeCount, 0, 'confirmation dialog omits the top close button');
  assert.equal(confirmDialog.headerCount, 0, 'confirmation dialog uses its centered custom header');
  assert.equal(confirmDialog.markWidth, 64, 'confirmation icon uses the large 64px plate');
  assert.equal(confirmDialog.glyphWidth, 28, 'confirmation icon glyph is enlarged inside the plate');
  assert.equal(confirmDialog.buttonCount, 2, 'confirmation dialog keeps exactly two actions');
  assert.match(await page.locator('.plants-device-confirm-description').textContent(), /WMT-PREVIEW-99/);
  await page.getByRole('button', {name:'Unbind device'}).click();
  assert.equal(await page.locator('.plants-device-card').count(), 3, 'unbinding removes only the chosen device');
  assert.equal(await page.getByText('Workshop heater', {exact:true}).count(), 0);

  await page.getByRole('button', {name:'Overview'}).click();
  assert.equal(new URL(page.url()).pathname, '/plants/p25');
  assert.equal(await page.locator('.plant-overview').count(), 1);
  await page.getByRole('button', {name:'Devices'}).click();
  assert.equal(new URL(page.url()).pathname, '/plants/p25/devices');

  await page.setViewportSize({width:420,height:900});
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'light'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  const mobile = await page.evaluate(() => ({
    innerWidth,
    bodyWidth:document.body.scrollWidth,
    cardCount:document.querySelectorAll('.plants-device-card').length,
    columns:getComputedStyle(document.querySelector('.plants-device-card')).gridTemplateColumns
  }));
  assert.equal(mobile.cardCount, 3);
  assert.ok(mobile.bodyWidth <= mobile.innerWidth + 1, 'Devices page has no page-level horizontal scroll at 420px');
  assert.equal(mobile.columns.split(' ').length, 1, 'mobile device cards collapse to one column');
  await page.screenshot({path:'tests/output/plants-devices-420-light.png', fullPage:true});

  await page.setViewportSize({width:1545,height:1252});
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'light'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  assert.equal(
    await page.locator('.plants-device-field-name').first().evaluate(node => getComputedStyle(node).color),
    await page.locator('.plants-device-meta-line').first().evaluate(node => getComputedStyle(node).color),
    'light-theme technical labels use the readable secondary label color'
  );
  await page.getByRole('button',{name:'More actions for iHybrid'}).click();
  await page.getByRole('menuitem',{name:'Rename'}).click();
  await settle(page);
  const lightField=page.getByLabel('Device name',{exact:false});
  await lightField.evaluate(input => input.blur());
  const lightFieldDefault=await lightField.evaluate(input => {
    const shell=input.closest('.wd-edit-field');
    return getComputedStyle(shell).backgroundColor;
  });
  assert.equal(lightFieldDefault,'rgba(116, 116, 116, 0.08)','light editable fields use the Site details grey surface');
  await lightField.hover();
  await page.waitForTimeout(300);
  assert.equal(
    await lightField.evaluate(input => getComputedStyle(input.closest('.wd-edit-field')).backgroundColor),
    'rgba(118, 118, 118, 0.12)',
    'light editable fields brighten to a neutral grey on hover'
  );
  await lightField.focus();
  await page.waitForTimeout(300);
  assert.equal(
    await lightField.evaluate(input => getComputedStyle(input.closest('.wd-edit-field')).backgroundColor),
    'rgba(118, 118, 118, 0.12)',
    'light editable field focus stays grey instead of turning white'
  );
  await page.locator('.plants-device-dialog-actions').getByRole('button',{name:'Cancel'}).click();
  await page.waitForFunction(() => !document.querySelector('.plants-device-modal'));
  await page.screenshot({path:'tests/output/plants-devices-light.png'});

  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'dark'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await settle(page);
  await page.screenshot({path:'tests/output/plants-devices-dark.png'});
  assert.deepEqual(errors, [], 'Devices page has no runtime or asset errors');

  await browser.close();
  console.log('Plant Devices page: passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
