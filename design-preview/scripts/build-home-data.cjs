// Keep the complete Figma extraction for provenance; ship only retained Home nodes.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),source=path.join(root,'design/figma');
 const {selectHomeScene}=await import(pathToFileURL(path.join(root,'src/pages/home/scene.js')));
 const original=JSON.parse(fs.readFileSync(path.join(source,'scene-source.json')));
 const assets=JSON.parse(fs.readFileSync(path.join(source,'asset-source-map.json')));
 const scene=selectHomeScene(original),ids=new Set(scene.map(n=>n.id));
 const map=Object.fromEntries(Object.entries(assets).filter(([id])=>ids.has(id)));
 // The current Statistics master uses the original semantic export, not the retired icon.
 map['I14613:1210;14612:7803']='statistics.svg';
 const out=path.join(root,'src/pages/home/data');
 fs.writeFileSync(path.join(out,'scene.json'),JSON.stringify(scene)+'\n');
 fs.writeFileSync(path.join(out,'asset-map.json'),JSON.stringify(map)+'\n');
 console.log(`Home data: ${original.length} source nodes → ${scene.length} retained nodes; ${Object.keys(map).length} SVG bindings.`);
})().catch(e=>{console.error(e);process.exit(1)});
