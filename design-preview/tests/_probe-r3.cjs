const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const theme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1116,height:992},deviceScaleFactor:2});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
  await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(420);
  await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
  await p.mouse.move(0,0);await p.waitForTimeout(260);
  const apply=await p.getByRole('button',{name:'Apply',exact:true}).evaluate(el=>{
    const fill=el.querySelector('.wd-glass-fill'),cs=getComputedStyle(fill),opt=getComputedStyle(el.querySelector('.wd-glass-optics'));
    return {bg:cs.backgroundColor,blur:cs.backdropFilter,opticsBg:opt.backgroundImage.slice(0,160),box:el.getBoundingClientRect().width};
  });
  console.log(theme,'apply',JSON.stringify(apply));
  // invalid whole-box state via typing letters
  const y=p.getByLabel('Start date, year',{exact:true});
  await y.click();await p.keyboard.press('Control+a');await p.keyboard.type('20x6');await p.waitForTimeout(180);
  const letterState=await p.evaluate((theme)=>{
    const c=document.querySelector('.wd-date-field-control'),err=document.querySelector('.wd-date-error');
    const cs=getComputedStyle(c),after=getComputedStyle(c,'::after');
    return {invalid:c.classList.contains('wd-date-invalid'),color:cs.color,shadow:after.boxShadow,msg:err.hidden?null:err.textContent,
      seg:getComputedStyle(c.querySelector('.wd-date-segment')).color,sep:getComputedStyle(c.querySelector('.wd-date-separator')).color,
      icon:getComputedStyle(c.querySelector('.wd-date-icon')).backgroundColor};
  },theme);
  console.log(theme,'letters',JSON.stringify(letterState));
  await p.keyboard.press('Control+a');await p.keyboard.type('2026');await p.waitForTimeout(150);
  console.log(theme,'after fix valid?',await p.evaluate(()=>document.querySelector('.wd-date-field-control').classList.contains('wd-date-invalid')));
  // full field screenshot with ring
  await p.getByLabel('Start date, month',{exact:true}).click();await p.keyboard.press('Control+a');await p.keyboard.type('13');await p.getByRole('button',{name:'Apply',exact:true}).click();await p.waitForTimeout(240);
  await p.mouse.move(0,0);await p.waitForTimeout(200);
  await p.locator('.wd-date-picker').screenshot({path:`${out}/r3-invalid-${theme}.png`});
  console.log(theme,'errors',errors.length);
  await p.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
