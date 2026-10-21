const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(/const \[sourceScene,assets,typeSource\]=await Promise\.all\(\[[\s\S]*?\]\);/,
`const [sourceScene,assets,typeSource,themeSource]=await Promise.all([
 load(new URL("./data/scene.json",import.meta.url)),load(new URL("./data/asset-map.json",import.meta.url)),
 load(new URL("../../../design/figma/figma-type-source.json",import.meta.url)),
 load(new URL("./data/theme-map.json",import.meta.url))
]);`);
s=s.replace(`const get=id=>elements.get(id);`,`const get=id=>elements.get(id);
// The shell and real card surfaces can paint immediately. Theme mapping only
// swaps inline paints, so it must not hold the whole page off-screen.
const sceneTheme=installSceneTheme(root,elements,themeSource);`);
s=s.replace(/\/\/ Keep the single annotated observation[\s\S]*$/,
`// Keep the single annotated observation from Figma visible for visual review.
// Live chart sampling will be connected when the real time-series API exists.
// The shell and Home surface are already assembled; mark that now so only the
// marked content regions wait for their derived state.
resize();
const skeletonDelay=Number(getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay").replace("ms",""))||140;
const skeletons=mountSkeletons({root,delay:skeletonDelay});
document.documentElement.dataset.shellReady="true";
await Promise.all([document.fonts.ready,prepareControlStates(root)]);
// Light assets decode in the background; a switch waits for the same real
// decode instead of extending first paint.
sceneTheme.decode();
themeController=createThemeController({initialTheme,apply(mode){sceneTheme.apply(mode);updateThemeButton(mode);}});
await skeletons.allSettled();
document.documentElement.dataset.ready="true";
motion.observeCharts(chartCards,homeColumn);
`);
fs.writeFileSync(f,s);
console.log('ok');
