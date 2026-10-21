const {chromium}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({...require('./runtime.cjs').launchOptions,headless:true});
 const page=await browser.newPage({viewport:{width:1497,height:1252}});
 await page.goto('http://127.0.0.1:4173/home.html?glass=figma');
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 const read=()=>page.evaluate(()=>{
  const byId=id=>document.querySelector(`[data-node-id="${id}"]`);
  const rect=el=>{const r=el.getBoundingClientRect();return {x:+r.x.toFixed(2),right:+r.right.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2)}};
  const ids=['14578:6106','I14578:6106;14420:2221;14420:2195','14612:8453','14537:4416','14537:3925','14570:1074','14570:1111','14570:1140','14570:1174'];
  return Object.fromEntries(ids.map(id=>[id,byId(id)?rect(byId(id)):null]));
 });
 console.log('initial',JSON.stringify(await read(),null,2));
 const sel=page.getByRole('button',{name:'Select statistics period'});
 for(const label of ['Last 24 hours','Last 7 days','Last 30 days','This month']){
  await sel.click();await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(200);
  console.log(label,JSON.stringify(await read()));
 }
 await browser.close();
})();
