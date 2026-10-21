const {chromium}=require('./runtime.cjs');
const fs=require('node:fs');
(async()=>{
 const out=process.argv[2]||'tests/output/refactor-before';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1545,height:1252}});
 const reports=[];
 for(const theme of ['dark','light'])for(const [width,height] of [[1545,1252],[1920,1080]]){
  await page.setViewportSize({width,height});await page.goto(require('./runtime.cjs').previewURL);
  await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Toggle light and dark mode'}).click();
  await page.waitForFunction(()=>!document.documentElement.dataset.themeTransition);
  await page.evaluate(()=>document.fonts.ready);await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
  await page.mouse.move(0,0);await page.waitForTimeout(1600);
  await page.screenshot({path:`${out}/${theme}-${width}.png`});
  reports.push(await page.evaluate(({theme,width})=>({theme,width,nodes:document.querySelectorAll('*').length,scene:document.querySelectorAll('[data-node-id]').length,dom:[...document.querySelectorAll('[data-node-id]')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.dataset.nodeId,rect:[r.x,r.y,r.width,r.height],radius:s.borderRadius,font:[s.fontSize,s.fontWeight,s.lineHeight,s.letterSpacing]}})}),{theme,width}));
 }
 fs.writeFileSync(`${out}/audit.json`,JSON.stringify(reports,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
