const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const theme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(360);
  const geom=()=>p.evaluate(()=>{const box=e=>{const b=e.getBoundingClientRect();return {t:+b.top.toFixed(1),b:+b.bottom.toFixed(1),h:+b.height.toFixed(1)}};
   return {panel:box(document.querySelector('.wd-date-picker')),inputs:box(document.querySelector('.wd-date-inputs')),
    msg:box(document.querySelector('.wd-date-message')),rule:box(document.querySelectorAll('.wd-date-rule')[1]),
    footer:box(document.querySelector('.wd-date-footer')),err:box(document.querySelector('.wd-date-error'))};});
  console.log(theme,'idle',JSON.stringify(await geom()));
  await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('13');
  await p.getByRole('button',{name:'Apply',exact:true}).click();
  // sample the anchor while the row grows: bottom must stay pinned
  const track=await p.evaluate(async()=>{const panel=document.querySelector('.wd-date-picker');const samples=[];
   for(let i=0;i<10;i++){const b=panel.getBoundingClientRect();samples.push([+b.top.toFixed(1),+b.bottom.toFixed(1)]);await new Promise(r=>requestAnimationFrame(r));}
   return samples;});
  console.log(theme,'anchor',JSON.stringify(track));
  // capture growth midway by pausing the message animation
  const mid=await p.evaluate(()=>{const m=document.querySelector('.wd-date-message');const a=m.getAnimations()[0];if(!a)return null;a.pause();a.currentTime=90;return {h:+m.getBoundingClientRect().height.toFixed(1)}});
  console.log(theme,'mid growth',JSON.stringify(mid));
  await p.waitForTimeout(500);
  console.log(theme,'error',JSON.stringify(await geom()));
  await p.mouse.move(0,0);await p.waitForTimeout(240);
  await p.locator('.wd-date-picker').screenshot({path:`${out}/r7-error-${theme}.png`});
  console.log(theme,'errors',errs.slice(0,2));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
