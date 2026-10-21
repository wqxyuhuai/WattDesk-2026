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
import {createEmptyState} from "../../components/empty-state.js";
import {createSearchInput} from "../../components/search.js";
import {createInputClear,syncInputClear} from "../../components/input-clear.js";
import {createPopoverController} from "../../components/popover.js";
import {createHistoryPopover} from "../../components/history-popover.js";
import {createSearchModel,createInlineSearchPanel,createFullscreenSearch,createShortcutKeycaps} from "../../components/search-surface.js";
import {renderHomeScene} from "./scene.js";
import {ROUTE_CATALOG as routeCatalog,buildSearchIndex,displayTitle} from "./routes.js";
import {createHomeLayout} from "./layout.js";
import {createPeriodControl} from "./period.js";
import {createRecentVisits} from "./recent-visits.js";
import {mountSkeletons} from "../../components/skeleton.js";
const load=url=>fetch(url).then(r=>{if(!r.ok)throw Error("Page resource unavailable: "+url);return r.json()});
const [sourceScene,assets,typeSource,themeSource]=await Promise.all([
 load(new URL("./data/scene.json",import.meta.url)),load(new URL("./data/asset-map.json",import.meta.url)),
 load(new URL("../../../design/figma/figma-type-source.json",import.meta.url)),
 load(new URL("./data/theme-map.json",import.meta.url))
]);
const root=document.querySelector("#home");
const {elements,records,scene}=renderHomeScene({root,scene:sourceScene,assets,typeSource});
const get=id=>elements.get(id);
// The shell and real card surfaces can paint immediately. Theme mapping only
// swaps inline paints, so it must not hold the whole page off-screen.
const sceneTheme=installSceneTheme(root,elements,themeSource);
const targetChrome=createAppShell({sidebar:get("14445:3629"),header:get("14612:8479")});
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
const {toast,close,popover,registerPanel}=createPopoverController({overlays:document.querySelector("#overlays"),toastElement:document.querySelector("#toast"),motion,glass});
// Menus, tooltips and toasts inherit the same reviewed surface as dialogs;
// the shell is created before the page material, so bind it once here.
targetChrome.workspaceTabs.setGlass(glass);
// The history panel shares the date chooser's glass surface, radius and row
// anatomy. It is closed through the same controller as every other panel.
const historyPopover=createHistoryPopover({glass,registerPanel,close,onSelect:route=>openRoute(route)});
function openHistory(){
 if(overlays.firstElementChild)close(true);
 return historyPopover.open(targetChrome.history,recentVisits.list.map(entry=>({...entry,title:displayTitle(entry.route),iconFile:routeCatalog[entry.route]?.icon??null})));
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
for(const id of ["14613:1162","14613:1190","14613:1210","14613:1250","14613:1270","14613:1290","14613:1310","14613:1330"]){
 const el=get(id);const label=el.textContent.trim();
 action(id,label,()=>toast(`${label} · Coming soon`));el.classList.add("shortcut-link");
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
let inlineShortcutRow=null;
const searchNode=get("I14445:3354;14420:2221;14420:2195");
searchNode.replaceChildren();const input=createSearchInput({label:"Search sites, devices and people",placeholder:"Search sites, devices, people, or anything…"});
// The clear button is shared with fullscreen search and other inputs. Keep it
// inside the existing text row so it never changes the field's 46px height.
const inlineClear=createInputClear({label:"Clear search",onClear:()=>{input.value="";syncInlineClear("");if(inlineSearch)inlineSearch.content.setQuery("");else openInlineSearch();syncInlineSearchActive();input.focus({preventScroll:true});}});
searchNode.append(input);
const sceneShortcut=get("I14445:3354;14420:2221;14420:2197");
if(sceneShortcut){
 sceneShortcut.classList.add("scene-search-shortcut");
 // The exported mac glyphs cannot express Ctrl/Cmd across platforms. Replace
 // the whole group with the same keycaps used by the sidebar and search panel,
 // so colour, background, type style and spacing have one owner.
 sceneShortcut.replaceChildren(createShortcutKeycaps());
 // The exported group was sized for the single mac cap. The shared component
 // measures 54px on Windows; keep its right edge on the field's 20px inset.
 const shortcutRow=sceneShortcut.parentElement;
 if(shortcutRow){
  const fieldRow=shortcutRow.parentElement;
  if(fieldRow){
   fieldRow.append(shortcutRow);
   // The exported right-content box is 35px wide, sized for a single glyph.
   // The shared Windows key pair is wider, so pin its right edge to the
   // field's 20px inset and let the host grow leftwards. Keep `left:auto`
   // explicit: the scene adapter otherwise leaves the export's left:945px.
   shortcutRow.style.left="auto";
   shortcutRow.style.right="20px";
   // The inner exported group is absolutely positioned too. Widen the outer
   // row explicitly and let the group fill it, otherwise both boxes collapse
   // to the export's 35px and the keycaps spill past the field.
   shortcutRow.style.width="max-content";
   // Absolute children do not contribute to `max-content`; make the exported
   // group participate in the row's intrinsic width so the shared keycaps
   // (rather than the old 35px glyph) define the box.
   sceneShortcut.style.position="relative";
   sceneShortcut.style.width="max-content";
  }
  // The input row also owns the text field; keep the shortcut inside its right
  // inset instead of the former 51px export column.
  const textNode=fieldRow?.querySelector(':scope > .node[data-name="search field"]');
  if(textNode)textNode.style.width="calc(100% - 118px)";
  inlineShortcutRow=shortcutRow;
  if(fieldRow){
   inlineClear.classList.add("scene-search-clear");
   fieldRow.append(inlineClear);
  }
 }
}
const searchAnchor=get("14445:3354");
function syncInlineClear(value){
 const visible=syncInputClear(inlineClear,value);
 if(inlineShortcutRow)inlineShortcutRow.style.visibility=visible?"hidden":"";
 return visible;
}
let searchModel=null;
let inlineSearch=null;
let fullscreenSearch=null;
let searchRestoreFocus=null;
function openSearchResult(item,query){
 ensureSearchModel().remember(query??item.title);
 if(item.route&&routeCatalog[item.route]){
  close(true);
  closeInlineSearch(true);
  closeFullscreenSearch(true);
  openRoute(item.route);
  return;
 }
 toast(`${item.title} · Coming soon`);
}
function ensureSearchModel(){
 // Build the shared index only when the user opens search, after assembly.
 searchModel??=createSearchModel({items:buildSearchIndex()});
 return searchModel;
}
function closeInlineSearch(immediate=false){
 const panel=inlineSearch?.panel;
 inlineSearch=null;
 input.setAttribute("aria-expanded","false");
 input.removeAttribute("aria-controls");
 input.removeAttribute("aria-activedescendant");
 if(panel){if(immediate)motion.closePanel(panel,true);else motion.closePanel(panel);}
}
function openInlineSearch(){
 if(fullscreenSearch)return;
 // The panel can be closed by scrolling, selection or a closing animation.
 // Re-focusing an input with a stale "open" flag must still recreate it.
 if(inlineSearch?.panel?.isConnected){input.focus();return;}
 inlineSearch=null;
 input.setAttribute("aria-expanded","true");
 const created=createInlineSearchPanel({
  anchor:searchAnchor,model:ensureSearchModel(),items:buildSearchIndex(),glass,
  onOpen:(item,query)=>{openSearchResult(item,query);if(!item.history)closeInlineSearch();},
  onHistory:applyInlineHistory,
  onRequestClose:()=>closeInlineSearch()
 });
 inlineSearch=created;
 overlays.append(created.panel);
 // The panel is owned by the field's focus state. A stale scroll-close must
 // not leave an "expanded" field with no visible results.
 input.setAttribute("aria-expanded","true");
 input.setAttribute("aria-controls",created.content.listbox.id);
 motion.openPanel(created.panel,searchAnchor);
 created.content.setQuery(input.value);
 positionInlineSearch();
}
function applyInlineHistory(query){
 input.value=query;
 syncInlineValue();
 input.focus({preventScroll:true});
}
function applyFullscreenHistory(query){
 if(!fullscreenSearch)return;
 fullscreenSearch.input.value=query;
 fullscreenSearch.update(query);
 fullscreenSearch.input.focus({preventScroll:true});
}
function positionInlineSearch(){inlineSearch?.position();}
function syncInlineSearchActive(){
 if(!inlineSearch)return;
 const id=inlineSearch.content.activeId;
 if(id)input.setAttribute("aria-activedescendant",id);
 else input.removeAttribute("aria-activedescendant");
}
input.setAttribute("autocomplete","off");
input.setAttribute("spellcheck","false");
input.setAttribute("role","combobox");
input.setAttribute("aria-autocomplete","list");
input.setAttribute("aria-expanded","false");
input.addEventListener("focus",()=>openInlineSearch());
// IME composition can update the visible preedit before a regular `input`
// event. Keep the result surface attached for the whole composition.
input.addEventListener("compositionstart",()=>openInlineSearch());
input.addEventListener("compositionupdate",()=>{if(!inlineSearch)openInlineSearch();});
input.addEventListener("blur",event=>{
 const next=event.relatedTarget;
 if(next&&(searchNode.contains(next)||inlineSearch?.panel?.contains(next)))return;
 // Focus leaves the search surface. Closing here keeps aria-expanded honest;
 // clicking the field or typing reopens from the same value.
 closeInlineSearch();
});
input.addEventListener("click",()=>openInlineSearch());
input.addEventListener("input",()=>{
 syncInlineClear(input.value);
 if(!inlineSearch)openInlineSearch();
 inlineSearch?.content.setQuery(input.value);
 syncInlineSearchActive();
});
// Programmatic fills (history, clear during a pending animation) must update
// both the value and the clear affordance in one place.
const syncInlineValue=()=>{syncInlineClear(input.value);inlineSearch?.content.setQuery(input.value);syncInlineSearchActive();};
input.addEventListener("keydown",event=>{
 if(event.key==="ArrowDown"||event.key==="ArrowUp"){
  event.preventDefault();
  if(!inlineSearch)openInlineSearch();
  inlineSearch?.content.move(event.key==="ArrowDown"?1:-1);
  syncInlineSearchActive();
 }else if(event.key==="Enter"){
  if(inlineSearch?.content.activate())event.preventDefault();
 }else if(event.key==="Escape"){
  if(!inlineSearch)return;
  event.preventDefault();
  event.stopPropagation();
  closeInlineSearch();
  input.focus();
 }
});
addEventListener("resize",()=>positionInlineSearch());
homeColumn.addEventListener("scroll",()=>{if(inlineSearch)closeInlineSearch(true);},{passive:true});
function openFullscreenSearch(){
 if(fullscreenSearch)return;
 close(true);
 closeInlineSearch(true);
 const previousFocus=document.activeElement;
 const scrollTop=homeColumn.scrollTop;
 homeColumn.inert=true;
 const previousOverflow=homeColumn.style.overflow;
 homeColumn.style.overflow="hidden";
 searchRestoreFocus=previousFocus instanceof HTMLElement?previousFocus:null;
 const created=createFullscreenSearch({
  model:ensureSearchModel(),items:buildSearchIndex(),glass,
  onHistory:applyFullscreenHistory,
  onOpen:(item,query)=>{
   openSearchResult(item,query);
   if(!item.history)closeFullscreenSearch();
  },
  onRequestClose:()=>closeFullscreenSearch()
 });
 fullscreenSearch=created;
 overlays.append(created.root);
 if(!reducedMotion()){
  created.root.dataset.entering="";
  setTimeout(()=>created.root?.removeAttribute("data-entering"),motionDuration("--wd-motion-panel")+40);
 }
 created.input.value=input.value;
 created.update(input.value);
 created.input.focus({preventScroll:true});
 homeColumn.scrollTop=scrollTop;
 created.root._restoreScroll=scrollTop;
 created.root._restoreOverflow=previousOverflow;
}
function closeFullscreenSearch(immediate=false){
 const entry=fullscreenSearch;
 if(!entry)return;
 fullscreenSearch=null;
 const restore=entry.root._restoreScroll;
 const restoreOverflow=entry.root._restoreOverflow;
 const finish=()=>{
  entry.root._onClose?.();
  entry.root.remove();
  homeColumn.inert=false;
  homeColumn.style.overflow=restoreOverflow??"";
  homeColumn.scrollTop=restore??homeColumn.scrollTop;
  searchRestoreFocus?.focus({preventScroll:true});
  searchRestoreFocus=null;
 };
 if(immediate||reducedMotion()){finish();return;}
 entry.root.dataset.closing="true";
 const animation=entry.root.animate([{opacity:1},{opacity:1}],{duration:motionDuration("--wd-motion-panel-exit"),fill:"forwards"});
 animation.finished.catch(()=>{}).finally(finish);
}
targetChrome.search.addEventListener("click",()=>openFullscreenSearch());
document.addEventListener("keydown",event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
  event.preventDefault();
  if(fullscreenSearch)closeFullscreenSearch();else openFullscreenSearch();
 }
});
document.addEventListener("pointerdown",event=>{
 if(!inlineSearch)return;
 if(inlineSearch.panel.contains(event.target)||searchAnchor.contains(event.target))return;
 closeInlineSearch();
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
const homeSnapshot=()=>({scrollTop:homeColumn.scrollTop,query:input.value,period:period.label(),range:period.rangeSnapshot()});
const routeRows=[...targetChrome.sidebar.querySelectorAll(".target-nav[data-route]")];
let activeRoute="home";
const recentVisits=createRecentVisits({get,onOpen:route=>openRoute(route)});
const homeWorkspace=get("14578:6145");
const emptyWorkspace=document.createElement("div");emptyWorkspace.className="workspace-empty";emptyWorkspace.hidden=true;emptyWorkspace.setAttribute("role","status");emptyWorkspace.setAttribute("aria-live","polite");
const emptyState=createEmptyState();
emptyWorkspace.append(emptyState.element);
homeWorkspace.append(emptyWorkspace);
const defaultSnapshot=homeSnapshot();
let nextHome=1;
const workspaceTabs=targetChrome.workspaceTabs;
// Navigation history is local to each tab. It records route changes only;
// Home search, period and scroll remain in the tab snapshot.
const routeHistory=new Map();
function ensureHistory(tab,route=tab?._state?.route||"home"){
 if(!tab)return null;
 const id=tab._state.id;
 let state=routeHistory.get(id);
 if(!state){
  state={routes:[route],index:0};
  routeHistory.set(id,state);
 }
 return state;
}
function historyFor(tab=workspaceTabs.active()){
 if(!tab)return null;
 return ensureHistory(tab);
}
function syncHistoryControls(){
 const state=historyFor();
 targetChrome.back.disabled=!state||state.index<=0;
 targetChrome.forward.disabled=!state||state.index>=state.routes.length-1;
}
workspaceTabs.captureState=()=>({route:activeRoute,home:homeSnapshot()});
workspaceTabs.restoreState=snapshot=>{
 showRoute(snapshot?.route||"home");
 const home=snapshot?.home||snapshot;
 if(!home)return;
 homeColumn.scrollTop=home.scrollTop??0;
 input.value=home.query??"";
 if(home.range?.start&&home.range?.end)period.setRange(home.range);
 else period.setPeriod(home.period??"Last 7 days");
 syncHistoryControls();
};
function showRoute(route){
 const isHome=route==="home",definition=routeCatalog[route],routeChanged=activeRoute!==route;
 activeRoute=route;
 homeColumn.hidden=!isHome;
 emptyWorkspace.hidden=isHome;
 if(!isHome){
  emptyState.update({iconFile:definition?.icon??null,label:"Coming soon"});
  emptyWorkspace.setAttribute("aria-label",`${definition?.title||"Workspace"} coming soon`);
  if(routeChanged)emptyState.play();
 }
 homeWorkspace.setAttribute("aria-label",`${definition?.title||"Workspace"} workspace`);
 for(const row of routeRows){const selected=row.dataset.route===route;row.classList.toggle("active",selected);row.setAttribute("aria-current",selected?"page":"false");}
}
function openRoute(route,{record=true}={}){
 const definition=routeCatalog[route],tab=workspaceTabs.active();
 if(!definition||!tab)return null;
 recentVisits.record(route);
 workspaceTabs.captureCurrent();
 // A tab always keeps its Home surface alive; route only selects what is shown.
 const home=tab._state.snapshot?.home||defaultSnapshot;
 workspaceTabs.update(tab,{route,title:definition.title,kind:route==="home"?"home":"route",iconFile:definition.icon,snapshot:{route,home}});
 showRoute(route);
 workspacePanel.setAttribute("aria-label",`${definition.title} workspace`);
 workspaceTabs.layout();
 if(record){
  const state=historyFor(tab);
  if(state.routes[state.index]!==route){
   state.routes=state.routes.slice(0,state.index+1);
   state.routes.push(route);
   state.index=state.routes.length-1;
  }
 }
 syncHistoryControls();
 return tab;
}
function goHistory(delta){
 const state=historyFor(),tab=workspaceTabs.active();
 if(!state||!tab)return;
 const next=state.index+delta;
 if(next<0||next>=state.routes.length)return;
 const route=state.routes[next],definition=routeCatalog[route];
 if(!definition)return;
 state.index=next;
 openRoute(route,{record:false});
}
targetChrome.back.addEventListener("click",()=>goHistory(-1));
targetChrome.forward.addEventListener("click",()=>goHistory(1));
function addHomeTab(){
 // Identical tabs share one readable title; their identity stays in the tab id.
 const id=`home-${++nextHome}`;
 const tab=workspaceTabs.add({id,title:"Home",kind:"home",route:"home",snapshot:{route:"home",home:{...defaultSnapshot,range:{...defaultSnapshot.range}}}});
 ensureHistory(tab,"home");
 syncHistoryControls();
 return tab;
}
workspaceTabs.mountTab=tab=>glass.addSurface({host:tab,radius:18});
workspaceTabs.onUnmount=tab=>{routeHistory.delete(tab._state.id);glass.removeSurface(tab);syncHistoryControls();};
workspaceTabs.onSelect=(state,tab)=>{
 close(true);closeInlineSearch(true);closeFullscreenSearch(true);
 const route=state.route||"home";
 // add() activates the new tab before this handler runs. Only a real route
 // change feeds recent visits, so the initial Home is not recorded twice.
 const changed=activeRoute!==route;
 showRoute(route);
 if(changed)recentVisits.record(route);
 workspacePanel.setAttribute("aria-label",`${state.title} workspace`);
 workspacePanel.setAttribute("aria-labelledby",tab.id);
 tab.setAttribute("aria-controls",workspacePanel.id);
 syncHistoryControls();
 requestAnimationFrame(()=>workspaceTabs.layout());
};

workspaceTabs.add({id:"home-1",title:"Home",kind:"home",route:"home",snapshot:{route:"home",home:defaultSnapshot}});
workspaceTabs.activate(workspaceTabs.tabs[0]);
showRoute("home");
targetChrome.onEmpty=()=>{
 addHomeTab();
};
targetChrome.add.addEventListener("click",()=>{
 addHomeTab();
 toast("New Home tab");
});
targetChrome.language.addEventListener("click",()=>popover(targetChrome.language,'<h2>Language</h2><button>English ✓</button><button>简体中文</button>',200));
targetChrome.settings.addEventListener("click",()=>{
 const panel=popover(targetChrome.settings,'<h2>Appearance</h2><button data-appearance>Toggle light and dark mode</button>',240);
 panel.querySelector("[data-appearance]").onclick=()=>{close();themeController?.toggle();};
});
targetChrome.support.addEventListener("click",()=>popover(targetChrome.support,"<h2>WattDesk</h2><div class='no-results'>Home visual preview</div>",220));
for(const row of routeRows){
 row.addEventListener("click",()=>{const route=row.dataset.route;if(routeCatalog[route])openRoute(route);});
}
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
