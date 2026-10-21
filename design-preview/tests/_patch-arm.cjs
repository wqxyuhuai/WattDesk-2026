const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
const anchor=`const sceneTheme=installSceneTheme(root,elements,themeSource);
`;
if(!s.includes(anchor))throw new Error('anchor missing');
const insertion=`// The assembled shell paints before measurements that depend on fonts. Only
// regions whose own content waits are marked; the sidebar and tabs never are.
let skeletons=null;
${anchor}armSkeletons();
function armSkeletons(){
 if(skeletons)return;
 const raw=getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay");
 const delay=Number.parseFloat(raw)||140;
 skeletons=mountSkeletons({root,delay});
 document.documentElement.dataset.shellReady="true";
}
`;
s=s.replace(anchor,insertion);
fs.writeFileSync(f,s);
console.log('ok');
