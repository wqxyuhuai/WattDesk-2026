const fs=require('fs');
const f='design-preview/src/pages/home/index.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`import {createSceneTheme} from "./scene-theme.js";`,`import {installSceneTheme} from "./scene-theme.js";`);
s=s.replace(`import {renderHomeScene} from "./scene.js";`,`import {renderHomeScene} from "./scene.js";
import {mountSkeletons} from "../../components/skeleton.js";`);
// Load theme source with the other JSON, so no second waterfall.
s=s.replace(`const [sourceScene,assets,typeSource]=await Promise.all([
 load(new URL("./data/scene.json",import.meta.url)),load(new URL("./data/asset-map.json",import.meta.url)),
 load(new URL("../../../design/figma/figma-type-source.json",import.meta.url))
]);`,`const [sourceScene,assets,typeSource,themeSource]=await Promise.all([
 load(new URL("./data/scene.json",import.meta.url)),load(new URL("./data/asset-map.json",import.meta.url)),
 load(new URL("../../../design/figma/figma-type-source.json",import.meta.url)),
 load(new URL("./data/theme-map.json",import.meta.url))
]);`);
s=s.replace(`const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});
const get=id=>elements.get(id);`,`const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});
const get=id=>elements.get(id);
// The shell and the real card surfaces can paint immediately. Theme mapping
// changes inline paints only; it must not hold the whole page off-screen.
const sceneTheme=installSceneTheme(root,elements,themeSource);`);
// Mark skeleton hosts after card prep
s=s.replace(`for(const card of chartCards){card.setAttribute("role","region");card.setAttribute("aria-label",records.get(card.dataset.nodeId).name);prepareCard(card,"chart");}`,`for(const card of chartCards){card.setAttribute("role","region");card.setAttribute("aria-label",records.get(card.dataset.nodeId).name);prepareCard(card,"chart");card.dataset.skeleton="chart";}`);
s=s.replace(` const card=get(id);prepareCard(card,"status");`,` const card=get(id);prepareCard(card,"status");card.dataset.skeleton="status";`);
s=s.replace(`get("14612:7837").classList.add("shortcut-columns");`,`get("14612:7837").classList.add("shortcut-columns");
// Only the three column bodies wait; the group heading and the page grid do not.
for(const column of get("14612:7837").children)column.dataset.skeleton="links";`);
// expose shell as early as the synchronous assembly is complete
s=s.replace(`workspaceTabs.add({id:"home-1",title:"Home",kind:"home",route:"home",snapshot:{route:"home",home:defaultSnapshot}});`,`workspaceTabs.add({id:"home-1",title:"Home",kind:"home",route:"home",snapshot:{route:"home",home:defaultSnapshot}});`);
// Replace final block
s=s.replace(`// Keep the single annotated observation from Figma visible for visual review.
// Live chart sampling will be connected when the real time-series API exists.
await Promise.all([document.fonts.ready,prepareControlStates(root)]);
resize();
const sceneTheme=await createSceneTheme(root,elements);
themeController=createThemeController({initialTheme,apply(mode){sceneTheme.apply(mode);updateThemeButton(mode);}});
document.documentElement.dataset.ready="true";

motion.observeCharts(chartCards,homeColumn);`,`// Keep the single annotated observation from Figma visible for visual review.
// Live chart sampling will be connected when the real time-series API exists.
// The visible shell and the Home surface are already assembled; mark that now
// so only the marked content regions wait for their derived state.
resize();
const skeletons=mountSkeletons({root,delay:Number(getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay").replace("ms",""))||140});
document.documentElement.dataset.shellReady="true";
await Promise.all([document.fonts.ready,prepareControlStates(root)]);
// Light assets decode in the background; a theme switch waits for the same
// real decode instead of extending first paint.
sceneTheme.decode();
themeController=createThemeController({initialTheme,apply(mode){sceneTheme.apply(mode);updateThemeButton(mode);}});
const settled=skeletons.settle();
await settled;
document.documentElement.dataset.ready="true";
motion.observeCharts(chartCards,homeColumn);`);
fs.writeFileSync(f,s);
console.log('ok');
