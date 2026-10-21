const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:992},deviceScaleFactor:2});
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(const theme of ['dark','light']){
  if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
  if(theme==='dark'){await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);}
  const m=await p.evaluate(()=>{
   const label=document.querySelector('.wd-date-month-text'),wd=document.querySelector('.wd-date-weekday');
   const grid=document.querySelector('.wd-date-grid'),panel=document.querySelector('.wd-date-picker');
   const range=document.createRange();range.selectNodeContents(wd);
   const glyph=range.getBoundingClientRect();
   const lr=label.getBoundingClientRect();
   const g=grid.getBoundingClientRect(),pr=panel.getBoundingClientRect();
   const cs=getComputedStyle(label);
   return {labelLeft:+lr.left.toFixed(2),glyphLeft:+glyph.left.toFixed(2),glyphRight:+glyph.right.toFixed(2),
    gridLeft:+g.left.toFixed(2),panelLeft:+pr.left.toFixed(2),font:cs.fontSize,weight:cs.fontWeight,
    panelH:+pr.height.toFixed(2),contentH:+document.querySelector('.wd-date-picker-content').getBoundingClientRect().height.toFixed(2)};
  });
  console.log(theme,JSON.stringify(m));
 }
 // error state layout while shown
 await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('13');
 await p.getByRole('button',{name:'Apply',exact:true}).click();await p.waitForTimeout(260);
 console.log('error',JSON.stringify(await p.evaluate(()=>{
  const box=e=>{const b=e.getBoundingClientRect();return {l:+b.left.toFixed(1),t:+b.top.toFixed(1),r:+b.right.toFixed(1),b:+b.bottom.toFixed(1),h:+b.height.toFixed(1)}};
  return {panel:box(document.querySelector('.wd-date-picker')),inputs:box(document.querySelector('.wd-date-inputs')),
   error:box(document.querySelector('.wd-date-error')),footer:box(document.querySelector('.wd-date-footer')),
   apply:box(document.querySelector('.wd-date-action--apply'))};
 })));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
