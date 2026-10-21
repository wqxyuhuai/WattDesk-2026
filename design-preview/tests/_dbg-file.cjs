const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,encoding='utf8');console.log('len',s.length,'arm',s.includes('armSkeletons'),'mount',s.includes('mountSkeletons'));
console.log(s.slice(s.indexOf('installSceneTheme')-80,s.indexOf('installSceneTheme')+200));
