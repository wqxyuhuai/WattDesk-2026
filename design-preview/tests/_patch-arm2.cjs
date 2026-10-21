const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
const anchor='const sceneTheme=installSceneTheme(root,elements,themeSource);';
if(!s.includes(anchor)){console.log(JSON.stringify(s.slice(s.indexOf('installSceneTheme'),s.indexOf('installSceneTheme')+160)));process.exit(1)}
const insertion=anchor+'\narmSkeletons();\nfunction armSkeletons(){\n if(skeletons)return;\n const raw=getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay");\n const delay=Number.parseFloat(raw)||140;\n skeletons=mountSkeletons({root,delay});\n document.documentElement.dataset.shellReady="true";\n}\nlet skeletons=null;';
s=s.replace(anchor,insertion);
fs.writeFileSync(f,s);
console.log('ok');
