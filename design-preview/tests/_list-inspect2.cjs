const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252}});
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(let i=0;i<6;i++){const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);}
 await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{const l=document.querySelector('.workspace-tab-list');const r=l.getBoundingClientRect();return {list:[r.x,r.width],children:[...l.children].map(c=>{const b=c.getBoundingClientRect();return {t:c.tagName,c:c.className,rect:[+b.x.toFixed(1),+b.width.toFixed(1)],offset:[c.offsetLeft,c.offsetWidth]}})}}));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
