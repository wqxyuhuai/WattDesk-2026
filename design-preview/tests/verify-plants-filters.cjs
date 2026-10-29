const { chromium, launchOptions, previewURL } = require('./runtime.cjs');
const assert = require('node:assert/strict');

const origin = new URL(previewURL).origin;
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));

(async () => {
  const browser = await chromium.launch({ ...launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${origin}/plants?glass=figma`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'dark'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');

  const filterTrigger = page.locator('.plants-toolbar-actions .plants-icon-button').first();
  const columnTrigger = page.locator('.plants-toolbar-actions .plants-icon-button').nth(1);
  await filterTrigger.click();
  await page.waitForTimeout(340);
  await settle(page);
  assert.equal(await page.locator('.plants-filter-category').count(), 4, 'only the requested four filter groups remain');
  assert.deepEqual(
    await page.locator('.plants-filter-category-label').allTextContents(),
    ['Company', 'Device', 'Connection', 'Running status']
  );
  assert.equal(await page.locator('.plants-filter-flyout').count(), 0, 'the collapsed panel has no secondary surface');
  assert.equal(await page.locator('.plants-filter-shell').count(), 0, 'the secondary menu must not be an internal pane');
  assert.ok((await page.locator('.plants-filter-panel').boundingBox()).height < 300, 'the collapsed panel hugs its content');
  const primaryBox = await page.locator('.plants-filter-panel').boundingBox();
  const filterPanelRight = primaryBox.x + primaryBox.width;
  const primaryPadding = await page.locator('.plants-filter-primary').evaluate(menu => {
    const panel = menu.parentElement.getBoundingClientRect();
    const heading = menu.querySelector('.wd-menu-heading').getBoundingClientRect();
    return {top: heading.top - panel.top, left: heading.left - panel.left};
  });
  assert.ok(Math.abs(primaryPadding.top - 20) < 1 && Math.abs(primaryPadding.left - 20) < 1, 'the primary title uses the standard 20px inset');

  const companyCategory = page.locator('.plants-filter-category[data-category="company"]');
  const companyRow = id => page.locator(`.plants-filter-company-row[data-option="${id}"]`);
  const assertFirstOptionAlignment = async categoryId => {
    const positions = await page.evaluate(id => {
      const row = document.querySelector(`.plants-filter-category[data-category="${id}"]`).getBoundingClientRect();
      const first = document.querySelector('#plants-filter-options .plants-filter-condition, #plants-filter-options .plants-filter-company-row').getBoundingClientRect();
      return {rowTop: row.top, optionTop: first.top};
    }, categoryId);
    assert.ok(
      Math.abs(positions.optionTop - positions.rowTop) < 1.5,
      `${categoryId} flyout aligns its first option with the category row`
    );
  };
  const arrowBefore = await companyCategory.locator('.plants-filter-category-chevron').boundingBox();
  const mainBeforeHover = await page.locator('.plants-filter-panel').boundingBox();
  await companyCategory.hover();
  await page.waitForTimeout(430);
  await settle(page);
  const mainBox = await page.locator('.plants-filter-panel').boundingBox();
  const flyoutBox = await page.locator('.plants-filter-flyout').boundingBox();
  assert.equal(Math.round(mainBox.width), 260);
  assert.equal(Math.round(flyoutBox.width), 260, 'primary and secondary filter surfaces share one width');
  assert.ok(Math.abs(mainBox.x - mainBeforeHover.x) < 0.5 && Math.abs(mainBox.y - mainBeforeHover.y) < 0.5, 'opening a secondary menu must not move the primary panel');
  assert.ok(
    flyoutBox.x + flyoutBox.width > mainBox.x && flyoutBox.x + flyoutBox.width <= mainBox.x + 16,
    `the secondary surface must overlap the primary inner edge: ${JSON.stringify({mainBox,flyoutBox})}`
  );
  assert.equal(await page.locator('.plants-filter-company-row').count(), 15, 'company hierarchy includes the expanded sample dataset');
  await assertFirstOptionAlignment('company');
  assert.equal(await page.locator('.plants-filter-search-field').count(), 1);
  assert.equal(await page.locator('.plants-filter-search-field').evaluate(field => field.classList.contains('wd-glass')), true);
  assert.equal(await page.locator('.plants-filter-company-row .plants-filter-option-glyph').count(), 0, 'company options have no leading icon');
  assert.equal(await page.locator('.plants-filter-condition-count').count(), 0, 'option counts are removed');
  assert.equal(
    await page.locator('.plants-filter-options').evaluate(list => list.scrollWidth <= list.clientWidth + 1),
    true,
    'the company tree must wrap instead of scrolling horizontally'
  );
  const companyScroll = await page.locator('.plants-filter-options').evaluate(list => ({
    overflowY: getComputedStyle(list).overflowY,
    scrollbarWidth: getComputedStyle(list).scrollbarWidth,
    scrollable: list.scrollHeight > list.clientHeight,
    hostRight: list.closest('.plants-filter-flyout').getBoundingClientRect().right,
    listRight: list.getBoundingClientRect().right
  }));
  assert.equal(companyScroll.overflowY, 'auto');
  assert.equal(companyScroll.scrollbarWidth, 'thin');
  assert.equal(companyScroll.scrollable, true, 'the expanded company tree has a bounded scroll area');
  assert.ok(Math.abs(companyScroll.hostRight - companyScroll.listRight - 4) < 1, 'the company scrollbar sits near the card edge');
  const toggleBox = await companyRow('wattsonic').locator('.plants-filter-company-toggle').boundingBox();
  assert.ok(Math.abs(toggleBox.width - toggleBox.height) < 0.5 && toggleBox.width <= 24, 'the disclosure hit target stays square and compact');
  const secondaryPadding = await page.locator('.plants-filter-flyout-content').evaluate(content => {
    const style = getComputedStyle(content);
    const titleStyle = getComputedStyle(content.querySelector('.plants-filter-secondary-title'));
    return {top: parseFloat(style.paddingTop), left: parseFloat(style.paddingLeft), titleMargin: parseFloat(titleStyle.marginTop)};
  });
  assert.ok(
    secondaryPadding.top === 20 && secondaryPadding.left === 20 && secondaryPadding.titleMargin === 0,
    `secondary panels use the shared 20px inset: ${JSON.stringify(secondaryPadding)}`
  );
  const companyRows = await page.locator('.plants-filter-company-row').evaluateAll(rows => rows.map(row => {
    const box = row.getBoundingClientRect();
    const input = row.querySelector('.plants-filter-checkbox').getBoundingClientRect();
    const label = row.querySelector('.plants-filter-condition-label');
    const labelBox = label.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(label).fontSize);
    return {height: box.height, checkboxCenter: input.top + input.height / 2, firstLineCenter: labelBox.top + fontSize / 2};
  }));
  assert.ok(companyRows.every(row => row.height <= 64), 'company rows stay compact while allowing a wrapped second line');
  assert.ok(companyRows.every(row => Math.abs(row.checkboxCenter - row.firstLineCenter) < 2), 'checkbox aligns with the first company-name line');
  assert.equal(
    await page.locator('.plants-filter-company-row .plants-filter-condition-label').first().evaluate(label => getComputedStyle(label).fontSize),
    '13px',
    'company names use the smaller Footnote series'
  );

  const search = page.locator('.plants-filter-search-field input');
  await search.fill('Winkler');
  assert.equal(await page.locator('.plants-filter-company-row').count(), 1, 'company search must narrow matching nodes');
  const searchClear = await page.locator('.plants-filter-search-field').evaluate(field => {
    const center = element => {
      const box = element.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    const clear = field.querySelector('.wd-input-clear');
    const style = getComputedStyle(clear);
    return {
      fieldCenter: center(field),
      clearCenter: center(clear),
      width: clear.getBoundingClientRect().width,
      height: clear.getBoundingClientRect().height,
      padding: style.padding
    };
  });
  assert.ok(Math.abs(searchClear.clearCenter - searchClear.fieldCenter) < .5, 'the shared clear control stays vertically centred inside nested popovers');
  assert.ok(Math.abs(searchClear.width - 18) < .5 && Math.abs(searchClear.height - 18) < .5);
  assert.equal(searchClear.padding, '0px', 'generic popover button spacing must not reach the shared clear control');
  await search.fill('');

  await companyRow('wattsonic').locator('.plants-filter-checkbox').click();
  assert.equal(await page.locator('#home-active-popover').count(), 1, 'checkbox selection must keep both panels open');
  assert.equal(await page.locator('#plants-filter-options').count(), 1);
  assert.equal(await page.locator('.plants-chip').count(), 1, 'selecting a top-level company produces one summary chip');
  assert.equal((await page.locator('.plants-chip').innerText()).replace(/\s*×\s*$/, '').trim(), 'Wattsonic Energy Technology');
  assert.equal(await page.locator('.plants-row').count(), 26, 'the root company includes every child company');
  const arrowAfter = await companyCategory.locator('.plants-filter-category-chevron').boundingBox();
  assert.ok(Math.abs(arrowAfter.x - arrowBefore.x) < 0.5, 'the category arrow must not move when its count appears');

  await companyRow('bischoff').locator('.plants-filter-checkbox').click();
  assert.equal(await page.locator('.plants-row').count(), 22, 'a child checkbox must apply immediately');
  assert.equal(
    await companyRow('wattsonic').locator('.plants-filter-checkbox').evaluate(input => input.indeterminate),
    true,
    'a parent with some children selected must be indeterminate'
  );
  const checkboxCheck=await page.locator('.plants-filter-checkbox:checked').first().evaluate(input=>{
    const style=getComputedStyle(input,'::after');
    return {color:style.backgroundColor,inset:[style.insetTop,style.insetRight,style.insetBottom,style.insetLeft]};
  });
  assert.match(checkboxCheck.color,/255, 255, 255/,'the check mark must be white');

  await companyRow('bischoff').locator('.plants-filter-condition-choice').click();
  await page.waitForTimeout(260);
  assert.equal(await page.locator('#home-active-popover').count(), 0, 'clicking a condition name must apply and close');
  assert.equal(await page.locator('.plants-row').count(), 26);
  await page.locator('.plants-clear').click();
  assert.equal(await page.locator('.plants-chips').isVisible(), false);

  await filterTrigger.click();
  await page.locator('.plants-filter-category[data-category="device"]').hover();
  await page.waitForTimeout(430);
  const deviceFlyoutWidth = await page.locator('.plants-filter-flyout').evaluate(panel => panel.offsetWidth);
  assert.equal(deviceFlyoutWidth, 208, 'Device uses the compact option-panel width');
  await assertFirstOptionAlignment('device');
  assert.equal(await page.locator('.plants-filter-condition .plants-filter-option-glyph').count(), 0, 'Device options have no leading icons');
  assert.equal(
    await page.locator('.plants-filter-condition-label').evaluateAll(labels =>
      labels.every(label => getComputedStyle(label).whiteSpace === 'nowrap' && label.scrollWidth <= label.clientWidth + 1)
    ),
    true,
    'Device options stay on one line inside the narrower panel'
  );
  const heaterRow = page.locator('.plants-filter-condition[data-option="heater"]');
  await heaterRow.locator('.plants-filter-condition-choice').hover();
  await page.waitForTimeout(280);
  const hoverLayers = await heaterRow.evaluate(row => ({
    row: getComputedStyle(row).backgroundColor,
    choice: getComputedStyle(row.querySelector('.plants-filter-condition-choice')).backgroundColor
  }));
  assert.equal(hoverLayers.row, 'rgba(0, 0, 0, 0)', 'the checkbox row must not paint a second hover surface');
  assert.notEqual(hoverLayers.choice, 'rgba(0, 0, 0, 0)', 'only the condition text surface receives the hover');
  const hoverBackgroundDuration = await heaterRow.locator('.plants-filter-condition-choice').evaluate(choice => {
    const style = getComputedStyle(choice);
    const durations = style.transitionDuration.split(',').map(value => value.trim());
    return durations[0];
  });
  assert.equal(parseFloat(hoverBackgroundDuration), .24, 'condition hover backgrounds fade in with the shared enter timing');
  await page.mouse.move(0, 0);
  const leaveBackgroundDuration = await heaterRow.locator('.plants-filter-condition-choice').evaluate(choice => {
    const style = getComputedStyle(choice);
    const durations = style.transitionDuration.split(',').map(value => value.trim());
    return durations[0];
  });
  assert.equal(parseFloat(leaveBackgroundDuration), .36, 'condition hover backgrounds fade out with the shared exit timing');
  for (const id of ['bms', 'heater', 'inverter']) {
    await page.locator(`.plants-filter-condition[data-option="${id}"] .plants-filter-checkbox`).click();
    await page.waitForTimeout(60);
  }

  await page.locator('.plants-filter-category[data-category="connection"]').hover();
  await page.waitForTimeout(430);
  const connectionFlyoutWidth = await page.locator('.plants-filter-flyout').evaluate(panel => panel.offsetWidth);
  assert.equal(connectionFlyoutWidth, 208, 'Connection matches the compact option-panel width');
  await assertFirstOptionAlignment('connection');
  assert.equal(await page.locator('.plants-filter-condition').count(), 4);
  assert.equal(
    await page.locator('.plants-filter-condition-label').evaluateAll(labels =>
      labels.every(label => getComputedStyle(label).whiteSpace === 'nowrap' && label.scrollWidth <= label.clientWidth + 1)
    ),
    true,
    'Connection options stay on one line inside the narrower panel'
  );
  assert.deepEqual(
    await page.locator('.plants-filter-condition-label').allTextContents(),
    ['Online', 'Partially online', 'Offline', 'Unbound']
  );
  const connectionChoice = await page.locator('.plants-filter-condition[data-option="online"]').evaluate(row => {
    const glyph = row.querySelector('.plants-filter-option-glyph').getBoundingClientRect();
    const label = row.querySelector('.plants-filter-condition-label').getBoundingClientRect();
    return {
      glyphCenter: glyph.top + glyph.height / 2,
      textCenter: label.top + label.height / 2,
      glyphSize: glyph.width,
      gap: parseFloat(getComputedStyle(row.querySelector('.plants-filter-condition-choice')).columnGap)
    };
  });
  assert.ok(connectionChoice.glyphSize >= 17);
  assert.ok(Math.abs(connectionChoice.glyphCenter - connectionChoice.textCenter) < 2, 'status icons stay on the same line as their labels');
  assert.equal(connectionChoice.gap, 4, 'filter icon-to-label spacing stays tight');
  for (const id of ['online', 'partial', 'offline', 'unbound']) {
   await page.locator(`.plants-filter-condition[data-option="${id}"] .plants-filter-checkbox`).click();
   await page.waitForTimeout(50);
  }

  const connectedTitle = await page.locator('.plants-filter-secondary-title').textContent();
  await page.locator('.plants-filter-category[data-category="status"]').hover();
  await page.locator('.plants-filter-options').hover({position: {x: 180, y: 40}});
  await page.waitForTimeout(140);
  assert.equal(await page.locator('.plants-filter-secondary-title').textContent(), connectedTitle, 'crossing another row during diagonal travel must not switch submenus immediately');

  await page.locator('.plants-filter-category[data-category="status"]').hover();
  await page.waitForTimeout(430);
  const statusFlyoutWidth = await page.locator('.plants-filter-flyout').evaluate(panel => panel.offsetWidth);
  assert.equal(statusFlyoutWidth, 208, 'Running status matches the compact option-panel width');
  await assertFirstOptionAlignment('status');
  assert.equal(await page.locator('.plants-filter-condition').count(), 3);
  assert.equal(
    await page.locator('.plants-filter-condition-label').evaluateAll(labels =>
      labels.every(label => getComputedStyle(label).whiteSpace === 'nowrap' && label.scrollWidth <= label.clientWidth + 1)
    ),
    true,
    'Running-status options stay on one line inside the narrower panel'
  );
  const statusRows = await page.locator('.plants-filter-condition').evaluateAll(rows => rows.map(row => ({
    text: row.querySelector('.plants-filter-condition-label').textContent,
    glyph: Boolean(row.querySelector('.plants-filter-option-glyph')),
    color: getComputedStyle(row.querySelector('.plants-filter-option-glyph')).color,
    size: row.querySelector('.plants-filter-option-glyph').getBoundingClientRect().width,
    gap: parseFloat(getComputedStyle(row.querySelector('.plants-filter-condition-choice')).columnGap)
  })));
  assert.deepEqual(statusRows.map(row => row.text), ['Attention', 'Unbound device', 'Normal']);
  assert.ok(statusRows.every(row => row.glyph), 'every running-status option must have its state icon');
  assert.ok(statusRows.every(row => row.size >= 17), 'status icons must be enlarged and aligned with the text');
  assert.ok(statusRows.every(row => row.gap === 4), 'running-status icons keep the shared tight gap');
  assert.match(statusRows[0].color, /255, 66, 69/, 'Attention keeps the semantic red glyph');
  assert.match(statusRows[2].color, /48, 209, 88/, 'Normal keeps the semantic green glyph');
  const attentionMask = await (await fetch(`${origin}/home-assets/masks/asset-64.svg`)).text();
  const maskOpacities = [...attentionMask.matchAll(/(?:fill|stroke)-opacity="([^"]+)"/g)].map(match => match[1]);
  assert.ok(maskOpacities.every(value => Number(value) === 1), 'Attention uses a fully opaque mask, not the original 30% export');
  await page.locator('.plants-filter-condition[data-option="attention"] .plants-filter-checkbox').click();
  await page.locator('.plants-filter-condition[data-option="unbound"] .plants-filter-checkbox').click();
  await page.locator('.plants-filter-condition[data-option="normal"] .plants-filter-checkbox').click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#plants-filter-options').count(), 1, 'the secondary panel stays open after checkbox selection');
  assert.equal(await page.locator('.plants-chip').count(), 10);
  const filterDot = await filterTrigger.evaluate(button => {
    const style = getComputedStyle(button, '::after');
    return {width: style.width, height: style.height, background: style.backgroundColor};
  });
  assert.deepEqual({width: filterDot.width, height: filterDot.height}, {width: '7px', height: '7px'});
  assert.match(filterDot.background, /0, 145, 255/);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(240);

  const addFilter = page.locator('.plants-filter-add');
  await addFilter.click();
  await page.waitForTimeout(340);
  const addAnchor = await addFilter.boundingBox();
  const addPanel = await page.locator('.plants-filter-panel').boundingBox();
  assert.ok(Math.abs(addPanel.x - addAnchor.x) < 1, 'the chip add button opens the filter panel from its left edge');
  assert.ok(addPanel.y >= addAnchor.y + addAnchor.height + 7, 'the chip add button opens the filter panel below itself');
  assert.equal(await page.locator('.plants-filter-category').count(), 4, 'the add button reuses the same filter content');
  await page.locator('.plants-filter-category[data-category="company"]').hover();
  await page.waitForTimeout(430);
  await companyRow('wattsonic').locator('.plants-filter-checkbox').click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#home-active-popover').count(), 1, 'the add-filter trigger remains anchored while chips update');
  assert.equal(await page.locator('#plants-filter-options').count(), 1);
  const addPanelAfterSelection = await page.locator('.plants-filter-panel').boundingBox();
  assert.ok(
    Math.abs(addPanelAfterSelection.x - addPanel.x) < .5 && Math.abs(addPanelAfterSelection.y - addPanel.y) < .5,
    'adding a filter keeps the add-anchored panel in its original viewport position'
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(240);
  await page.setViewportSize({ width: 760, height: 900 });
  await page.waitForTimeout(120);
  const chipRows = await page.locator('.plants-chip').evaluateAll(chips => new Set(chips.map(chip => Math.round(chip.getBoundingClientRect().y))).size);
  assert.ok(chipRows > 1, 'the applied-filter strip must support multiple chip rows');
  const chipsBox = await page.locator('.plants-chips').boundingBox();
  const clearBox = await page.locator('.plants-clear').boundingBox();
  const chipColors = await page.locator('.plants-chips').evaluate(box => ({
    strip: getComputedStyle(box).backgroundColor,
    chip: getComputedStyle(box.querySelector('.plants-chip')).backgroundColor
  }));
  assert.equal(chipColors.strip, 'rgb(58, 58, 60)', 'the strip uses the shared elevated tertiary surface');
  assert.equal(chipColors.chip, 'rgba(120, 120, 128, 0.32)', 'chips use the shared secondary fill');
  assert.ok(Math.abs((clearBox.y + clearBox.height / 2) - (chipsBox.y + chipsBox.height / 2)) < 1);
  assert.ok(clearBox.x + clearBox.width <= chipsBox.x + chipsBox.width - 7, 'Clear stays anchored at the right edge');
  assert.equal(await page.locator('.plants-clear').count(), 1);
  await page.screenshot({ path: 'tests/output/plants-filter-chips-multiline.png' });

  await page.locator('.plants-clear').click();
  assert.equal(await page.locator('.plants-chips').isVisible(), false);
  assert.equal(await page.locator('.plants-row').count(), 26);
  await page.setViewportSize({ width: 1440, height: 900 });

  // The filter and visibility menus share the same right edge.
  await columnTrigger.click();
  await page.waitForTimeout(340);
  await settle(page);
  const columnBox = await page.locator('#home-active-popover').boundingBox();
  assert.ok(Math.abs(columnBox.x + columnBox.width - filterPanelRight) < 1, 'filter and visibility menus are right-aligned');
  assert.equal(await page.locator('.plants-column-row').count(), 7);
  assert.equal(await page.getByText('Plant type', { exact: true }).count(), 0, 'the Plant type visibility option is removed');
  const columnHeadingInset = await page.locator('.wd-menu').evaluate(menu => {
    const panel = menu.parentElement.getBoundingClientRect();
    const heading = menu.querySelector('.wd-menu-heading').getBoundingClientRect();
    return heading.top - panel.top;
  });
  assert.ok(Math.abs(columnHeadingInset - 20) < 1, 'the columns title uses the standard 20px top inset');
  assert.equal(await page.locator('.wd-menu-check').count(), 0, 'visibility must not use the legacy check slot');
  assert.equal(await page.locator('.plants-column-row').first().locator(':scope > .plants-column-eye').count(), 1);
  assert.match(
    await page.locator('.plants-column-row').first().locator('.plants-column-eye').getAttribute('style'),
    /eye\.svg/
  );
  await page.locator('.plants-column-row').first().click();
  assert.match(
    await page.locator('.plants-column-row').first().locator('.plants-column-eye').getAttribute('style'),
    /eye-closed\.svg/
  );
  const columnDot = await columnTrigger.evaluate(button => {
    const style = getComputedStyle(button, '::after');
    return {width: style.width, height: style.height, background: style.backgroundColor};
  });
  assert.deepEqual({width: columnDot.width, height: columnDot.height}, {width: '7px', height: '7px'});
  assert.match(columnDot.background, /0, 145, 255/);
  assert.equal(await page.locator('#home-active-popover').count(), 1, 'changing visibility must keep the panel open');
  await columnTrigger.click();
  await page.waitForTimeout(240);
  assert.equal(await page.locator('#home-active-popover').count(), 0, 'the visibility trigger must toggle its own panel closed');

  // Refresh is a complete list reset: filters, visibility and sorting all
  // return to defaults in one render.
  await filterTrigger.click();
  await page.locator('.plants-filter-category[data-category="device"]').hover();
  await page.waitForTimeout(430);
  await page.locator('.plants-filter-condition[data-option="heater"] .plants-filter-checkbox').click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(240);
  await page.locator('.plants-th[data-sort="power"] .plants-sort').click();
  assert.equal(await filterTrigger.getAttribute('data-dot'), 'true');
  assert.equal(await columnTrigger.getAttribute('data-dot'), 'true');
  const refreshTrigger = page.getByRole('button', {name: 'Refresh plants'});
  await refreshTrigger.click();
  await page.waitForFunction(() => document.querySelectorAll('.plants-row').length === 26);
  assert.equal(await page.locator('.plants-chips').isVisible(), false, 'refresh clears all filters');
  assert.equal(await filterTrigger.getAttribute('data-dot'), 'false');
  assert.equal(await columnTrigger.getAttribute('data-dot'), 'false');
  assert.equal(await page.locator('.plants-th.plants-col-name').count(), 1, 'refresh restores the default visible columns');
  assert.equal(await page.locator('.plants-th.plants-col-company').count(), 0);
  assert.equal(await page.locator('.plants-th[data-sort="updated"]').getAttribute('aria-sort'), 'descending', 'refresh restores the default Last update sort');
  assert.equal(await page.locator('.plants-row').first().getAttribute('data-id'), 'p25');

  // Returning from plant detail must recreate Attention with the opaque red
  // mask instead of the exported 30% white art.
  assert.equal(
    await page.locator('.plants-row .plants-health').first().evaluate(status => getComputedStyle(status).columnGap),
    '4px',
    'table Status keeps a tight icon-to-label gap'
  );
  const tabsBeforeDetail = await page.locator('.workspace-tab').count();
  await page.locator('.plants-row[data-id="p11"]').click();
  await page.waitForTimeout(260);
  assert.equal(await page.locator('.workspace-tab').count(), tabsBeforeDetail + 1, 'a plant row opens in a new tab');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(), 'Andreas Becker');
  await page.locator('.plants-detail-back').click();
  await page.waitForFunction(count => document.querySelectorAll('.workspace-tab').length === count, tabsBeforeDetail);
  assert.equal(await page.locator('.workspace-tab').count(), tabsBeforeDetail, 'Back to Plants closes the detail tab');
  assert.equal((await page.locator('.workspace-tab.selected .workspace-tab-label').textContent()).trim(), 'Plants');
  const returnedStatus = await page.locator('.plants-row[data-id="p11"] .plants-health-glyph').evaluate(glyph => ({
    color: getComputedStyle(glyph).color,
    mask: glyph.style.getPropertyValue('--icon-mask')
  }));
  assert.match(returnedStatus.color, /255, 66, 69/, 'Attention stays red after returning from detail');
  assert.match(returnedStatus.mask, /masks\/asset-64\.svg/, 'Attention uses the opaque mask asset');

  await filterTrigger.click();
  await page.locator('.plants-filter-category[data-category="device"]').focus();
  assert.equal(await page.locator('.plants-filter-flyout').isVisible(), true, 'keyboard focus must reveal the secondary surface');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(240);
  assert.equal(await filterTrigger.getAttribute('aria-expanded'), 'false');

  await page.evaluate(() => localStorage.setItem('wattdesk-home-theme', 'light'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await filterTrigger.click();
  await page.locator('.plants-filter-category[data-category="status"]').hover();
  await page.waitForTimeout(430);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.locator('.plants-filter-condition').count(), 3);
  await page.screenshot({ path: 'tests/output/plants-filter-light-verify.png' });

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, categories: 4, companyRows: 15, splitSurface: true, errors }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
