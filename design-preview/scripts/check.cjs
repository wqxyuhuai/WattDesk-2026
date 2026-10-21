const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(/^(node_modules|output|fixtures|dist)$/.test(e.name)?[]:files(path.join(dir,e.name))):[path.join(dir,e.name)])}
const source=files(root).filter(f=>/\.(js|cjs)$/.test(f));
for(const file of source){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr);process.exit(1)}}
console.log(`Syntax valid: ${source.length} JavaScript files.`);
