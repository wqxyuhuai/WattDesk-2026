const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252}});
 await p.goto(previewURL.split('?')[0]);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(let i=0;i<6;i++){const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);}
 await p.waitForTimeout(400);
 console.log('pre',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.querySelectorAll('.workspace-tab');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),tabs:[...t].map(e=>({w:getComputedStyle(e).width,fb:getComputedStyle(e).flexBasis,mn:getComputedStyle(e).minWidth,style:e.style.cssText}))}}));
 await p.evaluate(()=>document.querySelector('.target-add-tab').click());
 console.log('post-sync',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.querySelectorAll('.workspace-tab');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),cls:l.className,tabs:[...t].map(e=>({w:getComputedStyle(e).width,fb:getComputedStyle(e).flexBasis,mn:getComputedStyle(e).minWidth,style:e.style.cssText}))}}));
 await p.waitForTimeout(80);
 console.log('post-80',await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list'),t=l.querySelectorAll('.workspace-tab');return {slot:getComputedStyle(l).getPropertyValue('--workspace-tab-width'),cls:l.className,tabs:[...t].map(e=>({w:getComputedStyle(e).width,fb:getComputedStyle(e).flexBasis,mn:getComputedStyle(e).minWidth,style:e.style.cssText}))}}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
