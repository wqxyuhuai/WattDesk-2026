const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`const root=document.querySelector("#home");
const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});`,`const root=document.querySelector("#home");
const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});`);
// Move shell/skeleton setup directly after renderHomeScene and before any measured work
s=s.replace(`const sceneTheme=installSceneTheme(root,elements,themeSource);
const targetChrome=createAppShell`,`const sceneTheme=installSceneTheme(root,elements,themeSource);
// Show the assembled shell before measured work. Content regions that derive
// their state from fonts/icons declare themselves as waiting only here.
let skeletons=null,skeletonDelay=0;
function armSkeletons(){
 if(skeletons)return;
 skeletonDelay=Number(getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay").replace("ms",""))||140;
 skeletons=mountSkeletons({root,delay:skeletonDelay});
 document.documentElement.dataset.shellReady="true";
}
armSkeletons();
const targetChrome=createAppShell`);
// Remove old skeleton mount block
s=s.replace(`const skeletonDelay=Number(getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay").replace("ms",""))||140;
const skeletons=mountSkeletons({root,delay:skeletonDelay});
document.documentElement.dataset.shellReady="true";
resize();`,`resize();`);
s=s.replace(`await Promise.all([document.fonts.ready,prepareControlStates(root)]);`,`await Promise.all([document.fonts.ready,prepareControlStates(root)]);`);
s=s.replace(`skeletons.settle();
await skeletons.allSettled();`,`skeletons.settle();
await skeletons.allSettled();`);
fs.writeFileSync(f,s);
console.log('ok');
