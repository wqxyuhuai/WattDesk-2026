const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`armSkeletons();
function armSkeletons(){
 if(skeletons)return;
 const raw=getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay");
 const delay=Number.parseFloat(raw)||140;
 skeletons=mountSkeletons({root,delay});
 document.documentElement.dataset.shellReady="true";
}
let skeletons=null;
`,`let skeletons=null;
function armSkeletons(){
 if(skeletons)return;
 const raw=getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay");
 skeletons=mountSkeletons({root,delay:Number.parseFloat(raw)||140});
}
`);
// Show shell as soon as its structure/theme is assembled; skeleton follows after marking.
s=s.replace(`resize();
await Promise.all([document.fonts.ready,prepareControlStates(root)]);`,`resize();
armSkeletons();
document.documentElement.dataset.shellReady="true";
await Promise.all([document.fonts.ready,prepareControlStates(root)]);`);
fs.writeFileSync(f,s);
console.log('ok');
