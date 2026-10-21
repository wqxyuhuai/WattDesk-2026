const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
const out='C:/Users/Administrator/.codex/visualizations/2026/10/20/01a156eb-3a12-7b40-a2b5-f5a5c27b9b6d';
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 for(const theme of ['dark','light']){
  for(const at of [20,60,100,140,175]){
   const p=await b.newPage({viewport:{width:1421,height:1252},deviceScaleFactor:1});
   await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
   if(theme==='light')await p.evaluate(()=>document.documentElement.dataset.theme='light');
   await p.getByRole('button',{name:'Select statistics period'}).click();await p.waitForTimeout(400);
   await p.getByRole('button',{name:'Custom range',exact:true}).click();await p.waitForTimeout(340);
   const box=await p.locator('.wd-date-picker').boundingBox();
   const clip={x:box.x-50,y:box.y-50,width:box.width+100,height:box.height+100};
   await p.getByRole('button',{name:'Cancel'}).click();
   const info=await p.evaluate((t)=>{
    const panel=document.querySelector('.wd-date-picker');
    if(!panel)return null;
    const anims=panel.getAnimations();
    for(const a of anims){a.pause();a.currentTime=t;}
    return {count:anims.length,keys:anims.map(a=>a.effect.getKeyframes().map(k=>({o:k.offset,op:k.opacity,tr:k.transform}))),op:getComputedStyle(panel).opacity};
   },at);
   await p.screenshot({path:`${out}/x3-${theme}-${at}.png`,clip});
   if(at===0)console.log(theme,JSON.stringify(info));
   await p.close();
  }
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)})
