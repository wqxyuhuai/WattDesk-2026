const fs=require('fs');const s=JSON.parse(fs.readFileSync('src/pages/home/data/scene.json','utf8')).filter(n=>!n.asset);const by=new Map(s.map(n=>[n.id,n]));
const root='14578:7006';
function walk(id,d=0){const n=by.get(id);if(!n)return;if(n.x!==undefined)console.log(' '.repeat(d*2)+`${id}  ${n.t.padEnd(9)} ${String(Math.round(n.w)).padStart(4)}x${String(Math.round(n.h)).padEnd(4)}  @${Math.round(n.x)},${Math.round(n.y)}  ${n.name}`);for(const c of s.filter(x=>x.p===id))walk(c.id,d+1)}
walk(root);
