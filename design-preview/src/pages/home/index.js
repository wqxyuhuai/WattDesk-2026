// Home orchestration: local preview state only, no backend or route simulation.
import {createGlassMaterial} from "../../components/glass-material.js";
import {prepareControlStates} from "../../components/control-states.js";
import {createHomeMotion,reducedMotion,motionDuration,motionEasing} from "../../foundations/motion.js";
import {createThemeController} from "../../foundations/theme-controller.js";
import {installSceneTheme} from "./scene-theme.js";
import {createAppShell} from "../../layouts/app-shell.js";
import {iconAsset,assetURL,isNeutralIconFile} from "../../components/icons.js";
import {enhanceControl} from "../../components/controls.js";
import {prepareCard} from "../../components/cards.js";
import {createPopoverController} from "../../components/popover.js";
import {createHistoryPopover} from "../../components/history-popover.js";
import {menuHeading,menuList,menuRow,menuNote,mountMenu} from "../../components/menu-popover.js";
import {renderHomeScene} from "./scene.js";
import {createHomeLayout} from "./layout.js";
import {createPeriodControl} from "./period.js";
import {createRecentVisits} from "./recent-visits.js";
import {createHomeSearch} from "./search.js";
import {createWorkspace} from "./workspace.js";
import {createPlantsPage} from "../plants/index.js";
import {plantById} from "../plants/data.js";
import {mountSkeletons} from "../../components/skeleton.js";
import "../../foundations/geometry.js";
const load=url=>fetch(url).then(r=>{if(!r.ok)throw Error("Page resource unavailable: "+url);return r.json()});
const [sourceScene,assets,typeSource,themeSource]=await Promise.all([
 load(new URL("./data/scene.json",import.meta.url)),load(new URL("./data/asset-map.json",import.meta.url)),
 load(new URL("./data/type-runtime.json",import.meta.url)),
 load(new URL("./data/theme-map.json",import.meta.url))
]);
const root=document.querySelector("#home");
const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});
const get=id=>elements.get(id);
// The shell and real card surfaces can paint immediately. Theme mapping only
// swaps inline paints, so it must not hold the whole page off-screen.
const sceneTheme=installSceneTheme(root,elements,themeSource);
const targetChrome=createAppShell({sidebar:get("14445:3629"),header:get("14612:8479"),workspacePanelId:"home-workspace-panel"});
const workspacePanel=get("14578:6145");workspacePanel.id="home-workspace-panel";workspacePanel.setAttribute("role","tabpanel");
prepareCard(workspacePanel,"panel");
const glass=createGlassMaterial({surfaces:[
 ...[targetChrome.history,targetChrome.back,targetChrome.forward,targetChrome.search,targetChrome.notifications].map(host=>({host,radius:18})),
 {host:targetChrome.header.querySelector(".target-header-actions"),radius:18,chrome:true},
 {host:get("14445:3354"),radius:23},
 ...["14537:4416","14537:3925"].map(id=>({host:get(id),radius:30})),
 // Connected devices and Self-consumption are display-only summaries. They
 // keep the material and hover optics, but must not look clickable.
 ...["14537:3891","14537:3908"].map(id=>({host:get(id),radius:30,interactive:false})),
 ...["14578:6106","14612:8453"].map(id=>({host:get(id),radius:18}))
]});
// The inline search host is an editable field, not a push button. Opt out of
// the shared glass lift so clicking it cannot grow over the results panel.
get("14445:3354").classList.add("wd-glass--no-scale");
// Keep the measured 1000px canvas while giving outer shadows room to render.
// The scroll container owns the gutters; only the content canvas owns geometry.
const homeColumn=get("14578:7006"),homeCanvas=document.createElement("div");homeCanvas.className="home-content-canvas";
homeCanvas.append(...homeColumn.children);homeColumn.append(homeCanvas);
homeCanvas.style.width="1000px";homeCanvas.style.margin="0";
const workspaceStats=get("I14613:1210;14612:7804"),workspaceStatsIcon=get("I14613:1210;14612:7803");
if(workspaceStats?.firstElementChild)workspaceStats.firstElementChild.textContent="Statistics (coming soon)";
if(workspaceStats){workspaceStats.style.width="220px";workspaceStats.setAttribute("aria-label","Statistics (coming soon)");}
if(workspaceStatsIcon){workspaceStatsIcon.replaceChildren(iconAsset("statistics.svg","color"));}
get("14445:3629").setAttribute("role","navigation");
get("14578:7006").setAttribute("aria-label","Home content");
get("14578:7006").tabIndex=0;
const chartCards=["14570:1074","14570:1111","14570:1140","14570:1174","14570:1208","14570:1237"].map(get);
for(const card of chartCards){card.setAttribute("role","region");card.setAttribute("aria-label",records.get(card.dataset.nodeId).name);prepareCard(card,"chart");card.dataset.skeleton="chart";}
const contentBottom=Math.max(...chartCards.map(card=>{
 let top=0,node=card;
 while(node&&node!==homeCanvas){top+=node.offsetTop;node=node.offsetParent;}
 return top+card.offsetHeight;
}));
homeCanvas.style.setProperty("--home-content-end",`${contentBottom}px`);
get("14612:7837").classList.add("shortcut-columns");

for(const n of scene){
 const el=get(n.id);
 if(/ \/ (Area|Line)$/.test(n.name))el.classList.add("chart-mark");
 if(/^Daily count/.test(n.name))el.classList.add("chart-mark","chart-bar");
 if(/^Hover \//.test(n.name))el.classList.add("chart-observation");
 // The data label is a floating surface too. Its Figma fill/outline/shadow are
 // inline extraction values, so the shared material must own the plate; the
 // label itself is read-only and never lifts on hover.
 if(n.name==="Hover / Energy generated"){
  el.classList.add("wd-glass--surface","wd-glass-popup");
  glass.addSurface({host:el,radius:12,interactive:false});
 }
}
const layoutIds={welcome:"14445:3351",search:"14445:3354",shortcuts:"14612:7837",statusRow:"14537:3942",period:"14557:831",energyRow:"14561:855",businessRow:"14561:856"};
const layoutNode=Object.fromEntries(Object.entries(layoutIds).map(([key,id])=>[key,get(id)]));
const statusCards=["14537:4416","14537:3925","14537:3891","14537:3908"].map(get);
const energyCards=["14570:1074","14570:1111"].map(get);
const businessCards=["14570:1140","14570:1174","14570:1208","14570:1237"].map(get);
const periodHeader=get("14561:836"),periodArea=get("14612:7602");
const layoutCtx={get,layoutNode,homeColumn,homeCanvas,workspacePanel,statusCards,energyCards,businessCards,periodHeader,periodArea};
const layout=createHomeLayout(layoutCtx);
const motion=createHomeMotion({duration:motionDuration,easing:motionEasing,reducedMotion});
const {toast,close,popover,registerPanel,reposition}=createPopoverController({overlays:document.querySelector("#overlays"),toastElement:document.querySelector("#toast"),motion,glass});
// The workspace controller is created after the page modules; route calls made
// by cards and menus resolve through this late-bound wrapper.
let workspace;
function openRoute(route,options){return workspace?.openRoute(route,options);}
function openRouteInNewTab(route,options){return workspace?.openRouteInNewTab(route,options);}
function returnToPlantsList(){return workspace?.returnToPlantsList();}
// Menus, tooltips and toasts inherit the same reviewed surface as dialogs;
// the shell is created before the page material, so bind it once here.
targetChrome.workspaceTabs.setGlass(glass);
// The history panel shares the date chooser's glass surface, radius and row
// anatomy. It is closed through the same controller as every other panel.
const resolvePlantName=id=>{
 const plant=plantById(id);
 return plant?.name||(plant?"?":"");
};
const historyPopover=createHistoryPopover({glass,registerPanel,close,onSelect:(route,options)=>openRoute(route,options)});
function openHistory(){
 if(overlays.firstElementChild)close(true);
 return historyPopover.open(targetChrome.history,recentVisits.list.map(recentVisits.describe));
}
function action(id,label,handler){const el=get(id);if(el)enhanceControl(el,{label,onActivate:handler})}
// Both summary cards navigate to Plants. Filtering will be connected with the
// real Plants route; this preview only changes the current tab's surface.
for(const [id,label] of [
 ["14537:4416","View sites online"],
 ["14537:3925","View sites needing attention"]
]){
 const card=get(id);prepareCard(card,"status");if(id==="14537:4416"||id==="14537:3925")card.dataset.skeleton="status";
 get(`I${id};14536:3833`).classList.add("status-card-arrow-disc");
 get(`I${id};14536:3833;14445:4526`).classList.add("status-card-arrow");
 action(id,label,()=>openRoute("plants"));
}
// All three shortcut columns share the same stationary underline interaction.
// Workspace rows open their own routes; Following sites are an interim jump
// into Plants until a station detail route exists.
for(const [id,route] of [
 ["14613:1162","plants"],
 ["14613:1190","service"],
 ["14613:1210","statistics"],
 ["14613:1250","plants"],
 ["14613:1270","plants"],
 ["14613:1290","plants"],
 ["14613:1310","plants"],
 ["14613:1330","plants"]
]){
 const el=get(id);const label=el.textContent.trim();
 action(id,label,()=>openRoute(route));el.classList.add("shortcut-link");
}
get("14613:1210").classList.add("shortcut-link-last");
// The summary labels share one visual treatment but keep distinct targets:
// Following opens Plants; Recently visited opens the history archive.
for(const [id,onActivate] of [
 ["I14612:8380;14612:7806;14420:2076;14420:2071",()=>openRoute("plants")],
 ["I14612:8402;14612:7806;14420:2076;14420:2071",openHistory]
]){
 const el=get(id);
 if(!el)continue;
 el.classList.add("shortcut-link","shortcut-view-all");
 enhanceControl(el,{label:"View all",onActivate});
}
const search=createHomeSearch({
 get,glass,motion,overlays:document.querySelector("#overlays"),toast,close,homeColumn,targetChrome,
 navigate:(route,options)=>openRoute(route,options)
});
const period=createPeriodControl({get,action,glass,registerPanel,close,toast});
layoutCtx.period=period;
for(const n of scene.filter(n=>/Menu Dots/.test(n.name))){
 action(n.id,"Chart options",()=>{
  const panel=popover(get(n.id),'<h2>Chart options</h2><button data-export>Download preview CSV</button>',220);
  panel.querySelector("[data-export]").onclick=()=>{
   const csv="Period,Energy generated (MWh),Energy consumed (MWh)\nLast 7 days,76.7,52.4\n";
   const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"})),a=document.createElement("a");a.href=url;a.download="wattdesk-home-preview.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);close()
  }
 });
 // Keep the glyph centre, expand its circular hit target to 30px.
 const trigger=get(n.id);trigger.classList.add("chart-menu");trigger.style.setProperty("--icon-mask",`url("${assetURL(assets[n.id])}")`);
 // The exported heading is only 18px tall; the 30px control must paint outside it.
 trigger.parentElement.classList.add("chart-card-heading");
 Object.assign(trigger.style,{pointerEvents:"auto",left:(n.x-6)+"px",top:(n.y-6)+"px",width:"30px",height:"30px"});
}
// Shared chrome interactions. The controls stay on the Home surface for now;
// their feedback is deliberately local because this first page has no routes.
const initialTheme=document.documentElement.dataset.theme==="light"?"light":"dark";
let themeController;
function updateThemeButton(mode){
 targetChrome.theme.setAttribute("aria-pressed",mode==="light"?"true":"false");
 targetChrome.theme.title=mode==="light"?"Switch to dark mode":"Switch to light mode";
}
updateThemeButton(initialTheme);
targetChrome.theme.addEventListener("click",()=>themeController?.toggle());
targetChrome.history.addEventListener("click",()=>openHistory());
const homeSnapshot=()=>({scrollTop:homeColumn.scrollTop,query:search.input.value,period:period.label(),range:period.rangeSnapshot()});
const recentVisits=createRecentVisits({get,onOpen:openRoute,resolvePlantName});
workspace=createWorkspace({
 get,glass,toast,close,homeColumn,input:search.input,period,homeSnapshot,targetChrome,
 workspacePanel,searchClose:search.closeAll,recentVisits,
 resolvePlantName,
 layoutHome:()=>layout.resize()
});
// The Plants list is a real surface inside the same workspace panel; the shell
// reveals it for the plants route instead of the shared "Coming soon" fallback.
// Mounting is guarded so a failure inside the new page cannot take the Home
// surface down with it; the error stays visible in the console.
try{
 const plantsPage=createPlantsPage({
   glass,registerPanel,close,reposition,toast,
  onOpenPlant:plant=>openRouteInNewTab("plants",{params:{plantId:plant.id}}),
  onBackToList:returnToPlantsList
 });
 workspace.registerRouteView("plants",plantsPage);
}catch(error){
 console.error("Plants view failed to mount",error);
}
// Shell menus share the history panel's interior anatomy. Placeholder locales
// are visual-only: nothing here changes the page language or persists a choice.
function openMenu(anchor,label,children){
 const panel=document.createElement("div");
 panel.className="popover popover--menu";
 mountMenu(panel,{label,children:[menuHeading(label),...children]});
 return registerPanel(panel,anchor,{label,radius:30});
}
targetChrome.language.addEventListener("click",()=>{
 const list=menuList();
 [["English",true],["简体中文",false],["Deutsch",false],["Čeština",false]].forEach(([name,checked])=>{
  const row=menuRow(name,{checked});
  row.addEventListener("click",()=>{
   for(const item of list.children)item.setAttribute("aria-checked",String(item===row));
   close();
  });
  list.append(row);
 });
 openMenu(targetChrome.language,"Language",[list]);
});
targetChrome.settings.addEventListener("click",()=>{
 const panel=openMenu(targetChrome.settings,"Appearance",[menuList()]);
 const list=panel.querySelector(".wd-menu-list");
 const row=menuRow("Light / dark mode");
 row.addEventListener("click",()=>{close();themeController?.toggle();});
 list.append(row);
});
targetChrome.support.addEventListener("click",()=>openMenu(targetChrome.support,"WattDesk",[menuNote("Home visual preview")]));
// Keep the single annotated observation from Figma visible for visual review.
// Live chart sampling will be connected when the real time-series API exists.
// The shell and Home surface are assembled. Measure once, arm only the marked
// content regions, then reveal the shell; the static sidebar and header never
// wait for fonts or derived card state.
layout.resize();
let skeletons=null;
function armSkeletons(){
 if(skeletons)return;
 const raw=getComputedStyle(document.documentElement).getPropertyValue("--wd-motion-skeleton-delay");
 const delay=Number.parseFloat(raw)||140;
 skeletons=mountSkeletons({root,delay});
}
armSkeletons();
document.documentElement.dataset.shellReady="true";
await prepareControlStates(root);
// Light assets decode in the background; a switch waits for the same real
// decode instead of extending first paint.
sceneTheme.decode();
themeController=createThemeController({initialTheme,apply(mode){sceneTheme.apply(mode);updateThemeButton(mode);}});
skeletons.settle();
document.documentElement.dataset.ready="true";
document.fonts.ready.then(()=>{document.documentElement.dataset.fontsReady="true"});
await skeletons.allSettled();
motion.observeCharts(chartCards,homeColumn);
