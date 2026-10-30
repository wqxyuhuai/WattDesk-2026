const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(/^(node_modules|output|fixtures|dist)$/.test(e.name)?[]:files(path.join(dir,e.name))):[path.join(dir,e.name)])}
const source=files(root).filter(f=>/\.(js|cjs)$/.test(f));
for(const file of source){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr);process.exit(1)}}
const runtime=files(path.join(root,'src')).filter(f=>/\.(js|css)$/.test(f));
const failures=[];
for(const file of runtime){
 const value=fs.readFileSync(file,'utf8'),relative=path.relative(root,file);
 if(/\.(js)$/.test(file)&&/(?:^|\n)\s*(?:async\s+)?function\s+text\s*\(/.test(value))failures.push(`${relative}: use foundations/dom.js instead of a local text() factory`);
 if(/\.(js)$/.test(file)&&/(?:^|\n)\s*(?:async\s+)?function\s+(?:relativeTime|absoluteTime|timeAgo)\s*\(/.test(value))failures.push(`${relative}: use foundations/time.js instead of local time formatting`);
 if(/\.wd-date-action(?!s)/.test(value))failures.push(`${relative}: obsolete .wd-date-action compatibility class`);
 const sharedMotion=path.dirname(relative)===path.join('src','foundations');
 if(/\.(css)$/.test(file)&&!sharedMotion&&/\btransition(?:-duration|-delay)?\s*:/.test(value))failures.push(`${relative}: local transition belongs in foundations/motion.css`);
}
for(const required of ['../AGENTS.md','../DESIGN-SYSTEM.md','../docs/PROJECT-MAP.md','../docs/PROJECT-STATUS.md']){
 const file=path.resolve(root,required);
 if(!fs.existsSync(file))failures.push(`missing required project document: ${file}`);
}
const markdown=files(root).filter(f=>/\.md$/.test(f)).concat([
 path.resolve(root,'..','README.md'),
 path.resolve(root,'..','AGENTS.md'),
 path.resolve(root,'..','DESIGN-SYSTEM.md'),
 ...fs.readdirSync(path.resolve(root,'..','docs')).filter(name=>name.endsWith('.md')).map(name=>path.resolve(root,'..','docs',name))
]);
for(const file of markdown){
 const value=fs.readFileSync(file,'utf8');
 for(const match of value.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  let href=match[1].trim();
  if(!href||/^(?:https?:|mailto:|#|codex:)/.test(href))continue;
  href=href.replace(/\s+"[^"]*"$/,'').split('#')[0];
  if(!href)continue;
  const target=path.resolve(path.dirname(file),decodeURI(href));
  if(!fs.existsSync(target))failures.push(`${path.relative(root,file)}: broken local Markdown link ${match[1]}`);
 }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Syntax valid: ${source.length} JavaScript files.`);
console.log(`Standards valid: ${runtime.length} runtime JS/CSS files; required project documents present.`);
