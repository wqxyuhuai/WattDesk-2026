const fs=require('fs');
const f='design-preview/src/shared.css';
let s=fs.readFileSync(f,'utf8');
s=s.replace('@import url("./components/cards.css");','@import url("./components/cards.css");\n@import url("./components/skeleton.css");');
fs.writeFileSync(f,s);

const h='design-preview/src/pages/home/home.css';
let c=fs.readFileSync(h,'utf8');
c=c.replace(':root:not([data-ready="true"]) #home{visibility:hidden}',':root:not([data-shell-ready="true"]) #home{visibility:hidden}');
fs.writeFileSync(h,c);
console.log('ok');
