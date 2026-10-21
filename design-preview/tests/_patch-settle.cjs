const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`await skeletons.allSettled();
document.documentElement.dataset.ready="true";`,`skeletons.settle();
await skeletons.allSettled();
document.documentElement.dataset.ready="true";`);
fs.writeFileSync(f,s);
console.log('ok');
