const fs=require('fs');const s=JSON.parse(fs.readFileSync('src/pages/home/data/scene.json','utf8'));const by=new Map(s.map(n=>[n.id,n]));
const ids=['14537:4416','14537:3925','14537:3891','14537:3908','14570:1074','14570:1111','14570:1140','14570:1174','14570:1208','14570:1237','14612:7837','14578:7006'];
for(const id of ids){let n=by.get(id);console.log('\n===',id,n?.name);let chain=[];while(n){chain.push(`${n.id} ${n.name} ${n.w}x${n.h} @${n.x},${n.y}${n.scroll?' scroll':''}`);n=by.get(n.p)}console.log(chain.join('\n  <- '));}
for(const id of ['14537:4416','14570:1074']){const n=by.get(id);console.log('\nCHILDREN',id);for(const c of s.filter(x=>x.p===id))console.log(' ',c.id,c.name,c.t,c.w+'x'+c.h,'@'+c.x+','+c.y)}
