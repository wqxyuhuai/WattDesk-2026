const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch({...launchOptions,headless:true});
 const p=await b.newPage({viewport:{width:1497,height:1252},userAgent:undefined});
 await p.addInitScript(()=>{
  const orig=CSSStyleDeclaration.prototype.getPropertyValue;
  CSSStyleDeclaration.prototype.getPropertyValue=function(name){const v=orig.call(this,name);if(name==='--workspace-tab-width'){if(!window.__prop)window.__prop=[];if(window.__prop.length<200)window.__prop.push({t:performance.now(),v,stack:new Error().stack.split('\n').slice(1,4).join(' | ')});}return v;};
 });
 await p.goto(previewURL.split('?')[0]);
 await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 for(let i=0;i<6;i++){const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(420);}
 await p.waitForTimeout(400);
 await p.evaluate(()=>window.__prop=[]);
 await p.evaluate(()=>window.__s=[]);
 const btn=p.getByRole('button',{name:'Add tab'});const box=await btn.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.up();
 await p.waitForTimeout(500);
 console.log(JSON.stringify(await p.evaluate(()=>window.__prop),null,1));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
