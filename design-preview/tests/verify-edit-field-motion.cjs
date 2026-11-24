const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');

const origin=new URL(previewURL).origin;
const probeURL=`${origin}/templates/page.html`;

async function mountProbe(page){
  await page.goto(probeURL,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    await document.fonts.ready;
    document.documentElement.dataset.theme='dark';
    const root=document.querySelector('#page');
    root.style.cssText='display:flex;flex-direction:column;gap:24px;align-items:flex-start;padding:40px';

    const field=document.createElement('span');
    field.id='audit-edit-field';
    field.className='wd-edit-field';
    field.style.cssText='display:inline-flex;align-items:center;width:220px;height:36px;padding:0 12px';
    const input=document.createElement('input');
    input.id='audit-edit-input';
    input.type='text';
    input.placeholder='Shared field';
    input.style.cssText='width:100%;border:0;outline:0;background:transparent;color:inherit';
    field.append(input);

    const direct=document.createElement('input');
    direct.id='audit-direct-field';
    direct.className='wd-edit-field';
    direct.placeholder='Direct field';
    direct.style.cssText='width:220px;height:36px;padding:0 12px';

    const trigger=document.createElement('button');
    trigger.id='audit-select-field';
    trigger.className='wd-select-trigger wd-select--adaptive wd-edit-field';
    trigger.type='button';
    trigger.textContent='Adaptive field';
    const chevron=document.createElement('span');
    chevron.className='wd-select-chevron';
    trigger.append(chevron);

    root.append(field,direct,trigger);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}

async function readField(page,selector){
  return page.locator(selector).evaluate(node=>{
    const style=getComputedStyle(node);
    return {
      color:style.color,
      background:style.backgroundColor,
      outlineColor:style.outlineColor,
      outlineStyle:style.outlineStyle,
      outlineWidth:style.outlineWidth,
      opacity:style.opacity,
      property:style.transitionProperty,
      duration:style.transitionDuration,
      easing:style.transitionTimingFunction,
      placeholderColor:node.matches('input')?getComputedStyle(node,'::placeholder').color:null
    };
  });
}

async function sampleColors(page,selector,waitMs){
  await page.waitForTimeout(waitMs);
  return readField(page,selector);
}

function changed(left,right){
  return left.background!==right.background||left.outlineColor!==right.outlineColor;
}

(async()=>{
  const browser=await chromium.launch({...launchOptions,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:900,height:600}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{
      if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
    });
    await mountProbe(page);

    const fields=await page.locator('.wd-edit-field').evaluateAll(nodes=>nodes.map(node=>{
      const style=getComputedStyle(node);
      return {
        id:node.id,
        property:style.transitionProperty,
        duration:style.transitionDuration,
        easing:style.transitionTimingFunction,
        outlineStyle:style.outlineStyle,
        outlineWidth:style.outlineWidth
      };
    }));
    assert.equal(fields.length,3,'the audit mounts wrapper, native and select edit-field variants');
    for(const field of fields){
      assert.match(field.property,/background-color/ ,`${field.id} animates its fill through the shared contract`);
      assert.match(field.property,/border-color/,`${field.id} animates its outline colour`);
      assert.match(field.property,/box-shadow/,`${field.id} animates its surface depth`);
      assert.match(field.property,/outline-color/,`${field.id} animates the focus and invalid outline`);
      assert.equal(field.duration,'0.38s',`${field.id} uses the shared disclosure duration`);
      assert.equal(field.easing,'cubic-bezier(0.4, 0, 0.2, 1)',`${field.id} uses the shared disclosure easing`);
      assert.equal(field.outlineStyle,'solid',`${field.id} reserves a stable outline for colour interpolation`);
      assert.equal(field.outlineWidth,'1px',`${field.id} keeps the focus outline from changing layout`);
    }
    assert.match((await readField(page,'#audit-direct-field')).placeholderColor,/rgba?\(|color\(/,'direct fields expose the shared placeholder colour');

    const field=page.locator('#audit-edit-field');
    const input=page.locator('#audit-edit-input');
    const rest=await readField(page,'#audit-edit-field');
    const box=await field.boundingBox();
    assert.ok(box,'the edit-field probe is visible');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    const hoverMid=await sampleColors(page,'#audit-edit-field',110);
    const hoverEnd=await sampleColors(page,'#audit-edit-field',390);
    assert.notEqual(hoverEnd.background,rest.background,'hover reaches a distinct field fill');
    assert.notEqual(hoverMid.background,rest.background,'hover leaves the resting fill after the first animation frame');
    assert.notEqual(hoverMid.background,hoverEnd.background,'hover exposes an intermediate fill instead of snapping to its endpoint');

    await page.mouse.move(0,0);
    const leaveMid=await sampleColors(page,'#audit-edit-field',110);
    const leaveEnd=await sampleColors(page,'#audit-edit-field',390);
    assert.notEqual(leaveMid.background,hoverEnd.background,'leaving the field starts from the hovered fill');
    assert.equal(leaveEnd.background,rest.background,'the field returns to its resting fill');

    await input.focus();
    const focusMid=await sampleColors(page,'#audit-edit-field',110);
    const focusEnd=await sampleColors(page,'#audit-edit-field',390);
    assert.notEqual(focusEnd.background,rest.background,'focus reaches the shared focus fill');
    assert.notEqual(focusMid.background,rest.background,'focus fill interpolates through an intermediate frame');
    assert.notEqual(focusMid.background,focusEnd.background,'focus fill does not snap to its endpoint');
    assert.notEqual(focusEnd.outlineColor,'rgba(0, 0, 0, 0)','focus exposes the shared neutral outline');
    assert.notEqual(focusMid.outlineColor,'rgba(0, 0, 0, 0)','focus outline leaves the transparent resting colour');
    assert.notEqual(focusMid.outlineColor,focusEnd.outlineColor,'focus outline interpolates instead of snapping');
    assert.equal(focusEnd.outlineStyle,'solid','focus keeps the shared outline style');
    assert.equal(focusEnd.outlineWidth,'1px','focus keeps the restrained shared outline width');

    await input.evaluate(node=>node.blur());
    const trigger=page.locator('#audit-select-field');
    const chevron=trigger.locator('.wd-select-chevron');
    const chevronRest=Number(await chevron.evaluate(node=>getComputedStyle(node).opacity));
    await trigger.hover();
    await page.waitForTimeout(110);
    const chevronMid=Number(await chevron.evaluate(node=>getComputedStyle(node).opacity));
    await page.waitForTimeout(390);
    const chevronEnd=Number(await chevron.evaluate(node=>getComputedStyle(node).opacity));
    assert.ok(chevronMid>chevronRest&&chevronMid<chevronEnd,'select chevrons interpolate with the edit-field motion instead of snapping');

    await page.emulateMedia({reducedMotion:'reduce'});
    await mountProbe(page);
    const reduced=await readField(page,'#audit-edit-field');
    assert.ok(Number.parseFloat(reduced.duration)<=.001,'reduced motion collapses edit-field transitions to the shared instant fallback');
    assert.equal(errors.length,0,errors.join('\n'));
  } finally {
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
