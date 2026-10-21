const fs=require('fs');const s=JSON.parse(fs.readFileSync('src/pages/home/data/scene.json','utf8'));const by=new Map(s.map(n=>[n.id,n]));
for(const id of ['14578:7006','14537:4510','14557:831','14612:7602']){const n=by.get(id);console.log(id,n.name,n.x,n.y,n.w,n.h);for(const c of s.filter(x=>x.p===id))console.log('  ',c.id,c.name,c.x,c.y,c.w,c.h)}
