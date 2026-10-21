const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const sourceRoot=path.resolve(__dirname,'..');

function files(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(/^(node_modules|output|fixtures|design)$/.test(entry.name))return [];
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?files(file):[file];
  });
}

function motionTokens(){
  const css=fs.readFileSync(path.join(sourceRoot,'src/foundations/tokens.css'),'utf8');
  const block=css.match(/:root\{([\s\S]*?)\n\}/)?.[1]||'';
  return Object.fromEntries([...block.matchAll(/--wd-motion-[\w-]+:[^;]+/g)].map(match=>{
    const [name,value]=match[0].split(':');
    return [name,value.replace(/[;\s]+$/g,'')];
  }));
}

(async()=>{
  const tokens=motionTokens();
  assert.equal(tokens['--wd-motion-hover'],'260ms');
  assert.equal(tokens['--wd-motion-disclosure'],'380ms');
  assert.equal(tokens['--wd-motion-panel'],'320ms');
  assert.equal(tokens['--wd-motion-panel-exit'],'200ms');
  assert.equal(tokens['--wd-motion-chart'],'740ms');
  assert.equal(tokens['--wd-motion-refresh'],'640ms');
  assert.equal(tokens['--wd-motion-theme'],'620ms');

  // Every page that uses the shared entry inherits the contract. New page
  // templates must route through it instead of linking motion pieces directly.
  const shared=fs.readFileSync(path.join(sourceRoot,'src/shared.css'),'utf8');
  assert.match(shared,/@import url\("\.\/foundations\/motion\.css"\)/);
  const template=fs.readFileSync(path.join(sourceRoot,'templates/page.html'),'utf8');
  assert.match(template,/<link rel="stylesheet" href="\/src\/shared\.css">/);

  // Component and page styles only declare state. Timing lives in the shared
  // contract, except the deliberate theme-transition fallback. A local
  // transition shorthand is rejected too, so future components cannot fork
  // the rhythm by copying a declaration from an older page.
  for(const file of files(path.join(sourceRoot,'src'))){
    if(!file.endsWith('.css')||file.endsWith('motion.css')||file.endsWith('theme-transition.css'))continue;
    const css=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(css,/transition\s*:[^;]*\d+(?:\.\d+)?m?s/,
      `${path.relative(sourceRoot,file)} hard-codes a transition duration`);
    assert.doesNotMatch(css,/transition\s*:\s*all\b/,
      `${path.relative(sourceRoot,file)} uses transition: all`);
    assert.doesNotMatch(css,/transition\s*:(?!\s*none\b)[^;]+/,
      `${path.relative(sourceRoot,file)} declares a local transition`);
    assert.doesNotMatch(css,/transition-(?:property|duration|timing-function|delay)\s*:/,
      `${path.relative(sourceRoot,file)} declares local transition timing`);
  }
  for(const file of files(path.join(sourceRoot,'src'))){
    if(!file.endsWith('.js'))continue;
    const js=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(js,/duration\s*:\s*\d+(?:\.\d+)?\b/,
      `${path.relative(sourceRoot,file)} hard-codes a WAAPI duration`);
    assert.doesNotMatch(js,/easing\s*:\s*['"`]cubic-bezier/,
      `${path.relative(sourceRoot,file)} hard-codes a WAAPI easing`);
  }

  const browser=await chromium.launch({...launchOptions,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1920,height:1080}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
    await page.goto(previewURL);
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));

    const inherited=await page.evaluate(()=>{
      const read=element=>{
        const style=getComputedStyle(element);
        return {
          property:style.transitionProperty,
          duration:style.transitionDuration,
          easing:style.transitionTimingFunction
        };
      };
      const control=document.querySelector('.target-nav');
      const label=control.querySelector('.wd-control-label');
      const glass=document.querySelector('.wd-glass-state');
      return {control:read(control),label:read(label),glass:read(glass)};
    });
    for(const [name,value] of Object.entries(inherited)){
      assert.match(value.property,/color/,`${name} must inherit the shared colour transition`);
      assert.equal(value.duration,'0.26s',`${name} must inherit --wd-motion-hover`);
      assert.equal(value.easing,'cubic-bezier(0.2, 0, 0.2, 1)',`${name} must inherit --wd-ease-hover`);
    }

    // Future semantic controls need no class or page-level patch: the shared
    // defaults cover native elements and common ARIA roles from first paint.
    const generic=await page.evaluate(()=>{
      const host=document.createElement('div');
      host.style.cssText='position:fixed;left:-9999px;top:0';
      const button=document.createElement('button');button.textContent='Probe';
      const tab=document.createElement('div');tab.setAttribute('role','tab');tab.tabIndex=0;tab.textContent='Probe';
      const link=document.createElement('a');link.href='#';link.textContent='Probe';
      const input=document.createElement('input');
      host.append(button,tab,link,input);document.body.append(host);
      const read=element=>{
        const style=getComputedStyle(element);
        return {property:style.transitionProperty,duration:style.transitionDuration,easing:style.transitionTimingFunction};
      };
      const result={button:read(button),tab:read(tab),link:read(link),input:read(input)};
      host.remove();
      return result;
    });
    for(const name of ['button','tab','link','input']){
      assert.match(generic[name].property,/color/,`generic ${name} must inherit the shared colour transition`);
      assert.equal(generic[name].duration,'0.26s',`generic ${name} must inherit --wd-motion-hover`);
      assert.equal(generic[name].easing,'cubic-bezier(0.2, 0, 0.2, 1)',`generic ${name} must inherit --wd-ease-hover`);
    }
    const disclosure=await page.evaluate(()=>{
      const heading=document.querySelector('[aria-controls]');
      const host=heading.querySelector('.wd-disclosure-icon');
      const glyph=host.querySelector('img');
      const read=element=>{
        const style=getComputedStyle(element);
        return {property:style.transitionProperty,duration:style.transitionDuration,easing:style.transitionTimingFunction,transform:style.transform};
      };
      return {host:read(host),glyph:read(glyph)};
    });
    assert.equal(disclosure.host.duration,'0s','Disclosure host must not animate its layout box');
    assert.equal(disclosure.host.property,'all');
    assert.equal(disclosure.host.transform,'none');
    assert.equal(disclosure.glyph.property,'transform');
    assert.equal(disclosure.glyph.duration,'0.38s');
    assert.equal(disclosure.glyph.easing,'cubic-bezier(0.4, 0, 0.2, 1)');

    const tab=await page.evaluate(()=>{
      const style=getComputedStyle(document.querySelector('.workspace-tab'));
      return {property:style.transitionProperty,duration:style.transitionDuration,easing:style.transitionTimingFunction};
    });
    assert.equal(tab.property,'color, background-color, flex-basis, width, padding-left, padding-right, transform');
    assert.equal(tab.duration,'0.26s, 0.26s, 0.22s, 0.22s, 0.22s, 0.22s, 0.42s');
    assert.match(tab.easing,/cubic-bezier\(0\.4, 0, 0\.2, 1\)/);

    const arrow=await page.evaluate(()=>{
      const style=getComputedStyle(document.querySelector('.status-card-arrow'));
      return {property:style.transitionProperty,duration:style.transitionDuration};
    });
    assert.equal(arrow.property,'translate');
    assert.equal(arrow.duration,'0.26s');

    const card=page.locator('.status-card').first();
    const box=await card.boundingBox();
    await card.hover();
    await page.waitForTimeout(320);
    const cardHover=await card.evaluate(el=>{const style=getComputedStyle(el),matrix=new DOMMatrix(style.transform==='none'?'':style.transform),rect=el.getBoundingClientRect();return {scale:matrix.a,offset:[el.offsetWidth,el.offsetHeight],centre:[rect.x+rect.width/2,rect.y+rect.height/2]}});
    assert.ok(cardHover.scale>1,'Clickable glass card must grow on hover');
    assert.deepEqual(cardHover.offset,[Math.round(box.width),Math.round(box.height)],'Hover must keep the layout box');
    assert.ok(Math.abs(cardHover.centre[0]-(box.x+box.width/2))<.6&&Math.abs(cardHover.centre[1]-(box.y+box.height/2))<.6,'Hover must grow from the card centre');
    await page.mouse.move(0,0);
    await page.waitForTimeout(320);

    // Display-only summaries keep the material and pointer optics, but must
    // not advertise an action they do not have.
    for(const id of ['14537:3891','14537:3908']){
      const summary=page.locator(`[data-node-id="${id}"]`);
      const summaryBox=await summary.boundingBox();
      await summary.hover();
      await page.waitForTimeout(320);
      const hovered=await summary.evaluate(el=>({transform:getComputedStyle(el).transform,offset:[el.offsetWidth,el.offsetHeight]}));
      assert.equal(hovered.transform,'none',`Display-only card ${id} must not grow on hover`);
      assert.deepEqual(hovered.offset,[Math.round(summaryBox.width),Math.round(summaryBox.height)],'Hover must keep the layout box');
      await page.mouse.down();
      await page.waitForTimeout(180);
      assert.equal(await summary.evaluate(el=>getComputedStyle(el).transform),'none',`Display-only card ${id} must not grow on press`);
      await page.mouse.up();
      await page.mouse.move(0,0);
      await page.waitForTimeout(320);
    }

    await page.emulateMedia({reducedMotion:'reduce'});
    const reduced=await page.evaluate(()=>{
      const control=getComputedStyle(document.querySelector('.target-nav'));
      const glyph=getComputedStyle(document.querySelector('.wd-disclosure-icon>img'));
      const arrow=getComputedStyle(document.querySelector('.status-card-arrow'));
      return {control:control.transitionDuration,glyph:glyph.transitionDuration,arrow:arrow.transitionDuration};
    });
    assert.equal(reduced.control,'0.001s');
    assert.equal(reduced.glyph,'0.001s');
    assert.equal(reduced.arrow,'0.001s');

    await page.emulateMedia({reducedMotion:null});
    await page.evaluate(()=>document.documentElement.dataset.theme='light');
    const light=await page.evaluate(()=>{
      const control=document.querySelector('.target-nav');
      const style=getComputedStyle(control);
      return {duration:style.transitionDuration,easing:style.transitionTimingFunction};
    });
    assert.equal(light.duration,'0.26s','Light theme keeps the same shared rhythm');
    assert.equal(light.easing,'cubic-bezier(0.2, 0, 0.2, 1)');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({tokens,inherited,generic,disclosure,tab,arrow,reducedMotion:true,lightTheme:true,errors},null,2));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
