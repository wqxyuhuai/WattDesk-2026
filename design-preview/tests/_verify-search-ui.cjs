const {chromium,launchOptions,previewURL}=require('./runtime.cjs');
(async()=>{
 const b=await chromium.launch(launchOptions);const p=await b.newPage({viewport:{width:1545,height:1252}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(previewURL);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const sidebar=await p.evaluate(()=>{const s=document.querySelector('.target-shortcut');return {html:s.outerHTML,rect:s.getBoundingClientRect().toJSON(),caps:[...s.querySelectorAll('kbd')].map(k=>({text:k.textContent,rect:k.getBoundingClientRect().toJSON(),font:getComputedStyle(k).fontSize,color:getComputedStyle(k).color,bg:getComputedStyle(k).backgroundColor}))}});
 await p.locator('input[aria-label="Search sites, devices and people"]').click();await p.waitForTimeout(700);
 const inline=await p.evaluate(()=>{const panel=document.querySelector('.wd-search-panel');const a=document.querySelector('[data-node-id="14445:3354"]').getBoundingClientRect();return {gap:panel.getBoundingClientRect().top-a.bottom,width:panel.getBoundingClientRect().width,empty:panel.querySelector('.wd-search-empty')?.textContent,quickMeta:panel.querySelectorAll('.wd-search-quick-link .wd-search-result-meta').length,hint:panel.querySelector('.wd-search-hint')?.innerText,hintStyle:panel.querySelector('.wd-search-hint')?{font:getComputedStyle(panel.querySelector('.wd-search-hint')).fontSize,color:getComputedStyle(panel.querySelector('.wd-search-hint')).color}:null,panel:panel.getBoundingClientRect().toJSON()}});
 await p.screenshot({path:'tests/output/search-inline-current.png'});
 await p.locator('input[aria-label="Search sites, devices and people"]').fill('555');await p.waitForTimeout(500);
 const inlineEmpty=await p.evaluate(()=>({text:document.querySelector('.wd-search-empty')?.textContent,font:getComputedStyle(document.querySelector('.wd-search-empty')).fontSize,hint:document.querySelector('.wd-search-hint')?.innerText,hintCaps:[...document.querySelectorAll('.wd-search-hint kbd')].map(k=>k.textContent)}));
 await p.screenshot({path:'tests/output/search-inline-empty.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(600);
 await p.keyboard.press('Control+k');await p.waitForTimeout(700);
 const full=await p.evaluate(()=>{const root=document.querySelector('.wd-search-fullscreen'),field=document.querySelector('.wd-search-field'),panel=document.querySelector('.wd-search-panel--fullscreen');const fr=field.getBoundingClientRect(),pr=panel.getBoundingClientRect();return {field:{rect:fr.toJSON(),radius:getComputedStyle(field).borderRadius,height:getComputedStyle(field).height},panel:{rect:pr.toJSON(),radius:getComputedStyle(panel).borderRadius},gap:pr.top-fr.bottom,shortcut:[...field.querySelectorAll('kbd')].map(k=>({text:k.textContent,rect:k.getBoundingClientRect().toJSON(),bg:getComputedStyle(k).backgroundColor,color:getComputedStyle(k).color})),backdrop:getComputedStyle(document.querySelector('.wd-search-backdrop')).backdropFilter,hint:document.querySelector('.wd-search-hint')?.innerText,quickMeta:document.querySelectorAll('.wd-search-quick-link .wd-search-result-meta').length}});
 await p.screenshot({path:'tests/output/search-fullscreen-current.png'});
 console.log(JSON.stringify({sidebar,inline,inlineEmpty,full,errors},null,2));await b.close();
})()
