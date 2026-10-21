const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
  const b=await chromium.launch({...launchOptions,headless:true});
  for(const theme of ['dark','light']){
    const p=await b.newPage({viewport:{width:1116,height:992},deviceScaleFactor:2});
    await p.goto(previewURL);
    await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
    await p.getByRole('button',{name:'Select statistics period'}).click();
    await p.waitForTimeout(450);
    await p.getByRole('button',{name:'Custom range',exact:true}).click();
    await p.waitForTimeout(350);
    await p.mouse.move(0,0);await p.waitForTimeout(300);
    await p.locator('.wd-date-picker').screenshot({path:`C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d/final-${theme}.png`});
    // nav not clipped while enlarged
    const nav=p.getByRole('button',{name:'Next month'});
    await nav.hover();await p.waitForTimeout(400);
    const clip=await p.evaluate(()=>{
      const btn=document.querySelector('[aria-label="Next month"]').getBoundingClientRect();
      const panel=document.querySelector('.wd-date-picker').getBoundingClientRect();
      return {btn:{l:btn.left,r:btn.right},panel:{l:panel.left,r:panel.right}};
    });
    console.log(theme,'nav inside panel:',clip.btn.l>clip.panel.l&&clip.btn.r<clip.panel.r);
    // month switch: buttons/weekdays stay put
    const before=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y)]};
      return {prev:r(document.querySelector('[aria-label="Previous month"]')),next:r(document.querySelector('[aria-label="Next month"]')),wd:r(document.querySelector('.wd-date-days'))}});
    await nav.click();await p.waitForTimeout(600);
    const after=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y)]};
      return {prev:r(document.querySelector('[aria-label="Previous month"]')),next:r(document.querySelector('[aria-label="Next month"]')),wd:r(document.querySelector('.wd-date-days'))}});
    console.log(theme,'stationary:',JSON.stringify(before)===JSON.stringify(after),JSON.stringify(after));
    await p.close();
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
