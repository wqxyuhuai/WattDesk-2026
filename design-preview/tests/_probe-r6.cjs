const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
const shot=async(p,theme,name)=>{await p.mouse.move(0,0);await p.waitForTimeout(240);await p.locator('.wd-date-picker').screenshot({path:`${out}/${name}-${theme}.png`});};
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const theme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:2});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
  // narrow hover-check on prev/next stays inside the panel
  await p.locator('[aria-label="Next month"]').hover();await p.waitForTimeout(320);
  console.log(theme,'nav insets',JSON.stringify(await p.evaluate(()=>{
   const b=document.querySelector('[aria-label="Next month"]').getBoundingClientRect(),panel=document.querySelector('.wd-date-picker').getBoundingClientRect();
   return {rightGap:+(panel.right-b.right).toFixed(1),leftGap:+(b.left-panel.left).toFixed(1),topGap:+(b.top-panel.top).toFixed(1)};
  })));
  const base=await p.evaluate(()=>{
   const label=document.querySelector('.wd-date-month-text'),wd=document.querySelector('.wd-date-weekday');
   const range=document.createRange();range.selectNodeContents(wd);const glyph=range.getBoundingClientRect(),lr=label.getBoundingClientRect();
   const cs=getComputedStyle(label),panel=document.querySelector('.wd-date-picker').getBoundingClientRect();
   return {labelLeft:+lr.left.toFixed(2),glyphLeft:+glyph.left.toFixed(2),font:cs.fontSize,weight:cs.fontWeight,panelH:+panel.height.toFixed(1),top:+panel.top.toFixed(1)};
  });
  console.log(theme,'title',JSON.stringify(base));
  await shot(p,theme,'r6-idle');
  await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('13');
  await p.getByRole('button',{name:'Apply',exact:true}).click();await p.waitForTimeout(300);
  const err=await p.evaluate(()=>{
   const box=e=>{const b=e.getBoundingClientRect();return {l:+b.left.toFixed(1),t:+b.top.toFixed(1),r:+b.right.toFixed(1),b:+b.bottom.toFixed(1),h:+b.height.toFixed(1)}};
   const e=document.querySelector('.wd-date-error'),panel=document.querySelector('.wd-date-picker');
   return {panel:box(panel),error:box(e),lines:Math.round(e.getBoundingClientRect().height/16),actions:box(document.querySelector('.wd-date-actions')),
    viewport:innerHeight,overflow:panel.getBoundingClientRect().bottom>innerHeight};
  });
  console.log(theme,'error',JSON.stringify(err));
  await shot(p,theme,'r6-error');
  // restore + close
  await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('10');
  await p.waitForTimeout(250);
  console.log(theme,'after fix panelH',await p.evaluate(()=>+document.querySelector('.wd-date-picker').getBoundingClientRect().height.toFixed(1)));
  // sample the exit: panel, material and content alpha per frame
  const frames=[];
  await p.getByRole('button',{name:'Cancel'}).click();
  for(let i=0;i<10;i++){
   frames.push(await p.evaluate(()=>{
    const panel=document.querySelector('.wd-date-picker');
    if(!panel)return null;
    const fill=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
    return {p:+Number(getComputedStyle(panel).opacity).toFixed(2),f:fill?+Number(getComputedStyle(fill).opacity).toFixed(2):null,
     c:+Number(getComputedStyle(panel.querySelector('.wd-date-picker-content')).opacity).toFixed(2)};
   }));
   await p.waitForTimeout(55);
  }
  console.log(theme,'exit frames',JSON.stringify(frames));
  console.log(theme,'pageerrors',errors.length,errors.slice(0,2));
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
