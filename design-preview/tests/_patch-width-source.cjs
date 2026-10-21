const fs=require('fs');
const p='src/pages/home/index.js';let s=fs.readFileSync(p,'utf8');
s=s.replace('const available=Math.max(320,column.clientWidth-gutter*2);','const available=Math.max(320,panel.clientWidth-gutter*2);');
fs.writeFileSync(p,s);
const q='src/layouts/app-shell.css';let c=fs.readFileSync(q,'utf8');
c=c.replace('.target-sidebar-nav{width:var(--wd-shell-sidebar-width)!important}','.target-sidebar,.target-sidebar-nav{width:var(--wd-shell-sidebar-width)!important}');
fs.writeFileSync(q,c);
console.log('panel width and sidebar width patched');
