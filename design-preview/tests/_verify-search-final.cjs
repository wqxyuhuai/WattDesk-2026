const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch(launchOptions);const c=await b.newContext({viewport:{width:1545,height:1252}});const p=await c.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const shortcut=await p.evaluate(()=>{const host=document.querySelector('[data-node-id="I14445:3354;14420:2221;14420:2197"]');const right=host.parentElement;const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return {host:box(host),right:box(right),caps:[...host.firstElementChild.children].map(c=>({text:c.textContent,box:box(c),overflow:c.scrollWidth>c.clientWidth}))}});
 await p.locator('input[aria-label="Search sites, devices and people"]').click();await p.waitForTimeout(700);
 const inline=await p.evaluate(()=>{const a=document.querySelector('[data-node-id="14445:3354"]').getBoundingClientRect(),q=document.querySelector('.wd-search-panel').getBoundingClientRect();return {gap:q.top-a.bottom,width:q.width,panelLeft:q.left,anchorLeft:a.left,radius:getComputedStyle(document.querySelector('.wd-search-panel')).borderRadius,glass:!!document.querySelector('.wd-search-panel>.wd-glass-material')}});
 await p.screenshot({path:'tests/output/search-inline-final.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(500);
 await p.keyboard.press('Control+k');await p.waitForTimeout(700);
 const full=await p.evaluate(()=>{const bk=document.querySelector('.wd-search-backdrop');const panel=document.querySelector('.wd-search-panel--fullscreen');return {filter:getComputedStyle(bk).backdropFilter,focus:document.activeElement?.getAttribute('aria-label'),panel:{...panel.getBoundingClientRect().toJSON()},inert:document.querySelector('[data-node-id="14578:7006"]').inert}});
 await p.screenshot({path:'tests/output/search-fullscreen-final.png'});
 await p.mouse.click(40,800);await p.waitForTimeout(700);
 const blankClose=await p.locator('.wd-search-fullscreen').count();
 await p.keyboard.press('Control+k');await p.waitForTimeout(600);await p.keyboard.press('Escape');await p.waitForTimeout(700);
 const escClose=await p.locator('.wd-search-fullscreen').count();
 console.log(JSON.stringify({shortcut,inline,full,blankClose,escClose,errors},null,2));await b.close();
})()
