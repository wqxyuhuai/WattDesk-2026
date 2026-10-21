const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1116,height:900}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'Add tab'}).click();await p.waitForTimeout(400);}
 await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>{
  const l=document.querySelector('.workspace-tab-list'); const t=document.createElement('div');
  return {listSlot:getComputedStyle(l).getPropertyValue('--workspace-tab-width')};
 }));
 await p.getByRole('button',{name:'Add tab'}).click();
 console.log(await p.evaluate(()=>{const t=document.querySelector('.workspace-tab-list').lastElementChild;return t.getAnimations().map(a=>({anim:a.animationName||a.id,keys:a.effect.getKeyframes().map(k=>({width:k.width,flexBasis:k.flexBasis,offset:k.offset}))}))}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
