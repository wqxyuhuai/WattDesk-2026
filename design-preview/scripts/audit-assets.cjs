// Reachability starts at runtime bindings and component imports; source archives are not runtime.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),assetDir=path.join(root,'home-assets');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
const all=walk(assetDir).map(f=>path.relative(assetDir,f).replaceAll('\\','/'));
const assetNames=new Set(all);
function assetPath(reference,sourceFile){
 const clean=reference.split(/[?#]/,1)[0];
 const homeAsset=clean.indexOf('home-assets/');
 if(homeAsset>=0)return clean.slice(homeAsset+12);
 if(clean.startsWith('./')||clean.startsWith('../')){
  const absolute=path.resolve(path.dirname(sourceFile),clean);
  if(absolute.startsWith(assetDir+path.sep))return path.relative(assetDir,absolute).replaceAll('\\','/');
 }
 if(assetNames.has(clean))return clean;
 const basename=path.posix.basename(clean);
 const matches=all.filter(file=>path.posix.basename(file)===basename);
 return matches.length?matches[0]:clean;
}
const used=new Set([
 'sf-pro.woff2',
 ...Object.values(load('src/pages/home/data/asset-map.json')),
 ...load('src/pages/home/data/theme-map.json').assets.map(a=>a.file),
 ...all.filter(file=>file.startsWith('masks/'))
]);
for(const file of walk(path.join(root,'src')).filter(f=>/\.(js|css)$/.test(f))){
 const text=fs.readFileSync(file,'utf8');
 for(const match of text.matchAll(/opaqueMaskURL\(\s*["'`]([^"'`\s(){}]*\.svg)["'`]/g)){
  const name=match[1];if(!name.includes('${'))used.add(`masks/${assetPath(name,file)}`);
 }
 for(const match of text.matchAll(/assetURL\(\s*["'`]([^"'`\s(){}]*\.svg)["'`]/g)){
  const name=match[1];if(!name.includes('${'))used.add(assetPath(name,file));
 }
 const genericText=text
  .replace(/opaqueMaskURL\(\s*["'`]([^"'`\s(){}]*\.svg)["'`]/g,'')
  .replace(/assetURL\(\s*["'`]([^"'`\s(){}]*\.svg)["'`]/g,'');
 for(const match of genericText.matchAll(/["'`]([^"'`\s(){}]*\.svg)["'`]/g)){
  const name=match[1];if(!name.includes('${'))used.add(assetPath(name,file));
 }
}
const missing=[...used].filter(f=>!assetNames.has(f));
assert.deepEqual(missing,[],'Missing local runtime assets');
const unused=all.filter(f=>!used.has(f));
const report={runtimeAssets:used.size,totalAssets:all.length,unused,missing};
if(process.argv.includes('--prune')){
 for(const file of unused){const absolute=path.resolve(assetDir,file);assert.ok(absolute.startsWith(assetDir+path.sep));fs.unlinkSync(absolute)}
 const manifest=load('design/consolidation-manifest.json');manifest.removedAssets=unused;
 fs.writeFileSync(path.join(root,'design/consolidation-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({...report,pruned:true},null,2));
}else{
 console.log(JSON.stringify(report,null,2));if(unused.length)process.exitCode=1;
}
