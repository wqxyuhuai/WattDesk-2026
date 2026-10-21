const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');return {anims:el.getAnimations().map(a=>({state:a.playState,time:a.currentTime,eff:a.effect.getKeyframes().length})),closing:el.dataset.closing||null}}));
 await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');[...el.querySelectorAll('button')].find(b=>b.textContent.trim()==='Cancel').click();});
 console.log('after click',await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');return el?{anims:el.getAnimations().map(a=>({state:a.playState,time:a.currentTime,eff:a.effect.getKeyframes().length})),closing:el.dataset.closing||null}:null}));
 await p.waitForTimeout(120);
 console.log('120',await p.evaluate(()=>{const el=document.querySelector('.wd-date-picker');return el?{anims:el.getAnimations().map(a=>({state:a.playState,time:a.currentTime})),content:getComputedStyle(el.querySelector('.wd-date-picker-content')).opacity}:null}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
