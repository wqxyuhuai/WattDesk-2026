const fs=require('fs');const p='src/layouts/app-shell.css';let s=fs.readFileSync(p,'utf8');
s=s.replace(/@media\(max-width:1100px\)\{:root\{--wd-shell-sidebar-width:224px;--wd-shell-main-offset:254px\}/,'@media(max-width:1100px){:root:root{--wd-shell-sidebar-width:224px;--wd-shell-main-offset:254px}');
s=s.replace(/@media\(max-width:760px\)\{:root\{--wd-shell-sidebar-width:76px;--wd-shell-main-offset:106px\}/,'@media(max-width:760px){:root:root{--wd-shell-sidebar-width:76px;--wd-shell-main-offset:106px}');
s=s.replace('.target-sidebar-nav{width:var(--wd-shell-sidebar-width)}','.target-sidebar-nav{width:var(--wd-shell-sidebar-width)!important}');
s=s.replace('.target-nav,.target-section-heading{width:var(--wd-shell-sidebar-width)}','.target-nav,.target-section-heading{width:var(--wd-shell-sidebar-width)!important}');
s=s.replace('.target-quick-search{width:var(--wd-shell-sidebar-width)}','.target-quick-search{width:var(--wd-shell-sidebar-width)!important}');
fs.writeFileSync(p,s);console.log('specificity patched');
