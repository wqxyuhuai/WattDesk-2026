const fs=require('fs');const s=JSON.parse(fs.readFileSync('src/pages/home/data/scene.json','utf8'));const by=new Map(s.map(n=>[n.id,n]));
function tree(id,d=0,max=2){const n=by.get(id);if(!n)return;console.log(' '.repeat(d*2)+`${n.id} ${n.t} ${n.name} ${n.w}x${n.h} @${n.x},${n.y} left/right?`);if(d<max)for(const c of s.filter(x=>x.p===id))tree(c.id,d+1,max)}
for(const id of ['14537:3942','14561:855','14561:856'])tree(id,0,3);
