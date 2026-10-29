// Workspace tabs and in-tab routing. Each tab keeps its own route, home
// snapshot and back/forward history; the sidebar switches content inside the
// active tab instead of opening a new one. The active tab's route is mirrored
// into the browser URL so refresh, copy-link and browser Back stay meaningful.
import {createEmptyState} from "../../components/empty-state.js";
import {
 ROUTE_CATALOG as routeCatalog,
 documentTitle,
 pathForRoute,
 routeFromPath
} from "./routes.js";

const sameParams=(left={},right={})=>{
 const keys=new Set([...Object.keys(left),...Object.keys(right)]);
 for(const key of keys)if(left[key]!==right[key])return false;
 return true;
};
const sameLocation=(left,right)=>
 Boolean(left&&right&&left.route===right.route&&sameParams(left.params||{},right.params||{}));

export function createWorkspace({
 get,glass,toast,close,homeColumn,input,period,homeSnapshot,targetChrome,
 workspacePanel,searchClose,recentVisits,resolvePlantName,layoutHome
}){
const routeRows=[...targetChrome.sidebar.querySelectorAll(".target-nav[data-route]")];
let activeRoute="home";
let activeParams={};
let booting=true;
let applyingLocation=false;
let nextRouteTab=1;
const homeWorkspace=get("14578:6145");
// Real page surfaces register themselves here; a route without a registered
// view keeps the shared "Coming soon" fallback.
const routeViews=new Map();
const emptyWorkspace=document.createElement("div");
emptyWorkspace.className="workspace-empty";
emptyWorkspace.hidden=true;
emptyWorkspace.setAttribute("role","status");
emptyWorkspace.setAttribute("aria-live","polite");
const emptyState=createEmptyState();
emptyWorkspace.append(emptyState.element);
homeWorkspace.append(emptyWorkspace);
const defaultSnapshot=homeSnapshot();
let nextHome=1;
let homeLayoutFrame=0;
const workspaceTabs=targetChrome.workspaceTabs;
// Navigation history is local to each tab. It records location descriptors
// (route + params), so /plants and /plants/p02 are separate entries.
const routeHistory=new Map();
const newTabOrigins=new Map();

function ensureHistory(tab,location={route:tab?._state?.route||"home",params:tab?._state?.params||{}}){
 if(!tab)return null;
 const id=tab._state.id;
 let state=routeHistory.get(id);
 if(!state){
  state={entries:[location],index:0};
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
 targetChrome.forward.disabled=!state||state.index>=state.entries.length-1;
}
function addHistoryEntry(tab,location){
 if(!tab)return;
 const state=ensureHistory(tab,location);
 if(sameLocation(state.entries[state.index],location))return;
 state.entries=state.entries.slice(0,state.index+1);
 state.entries.push(location);
 state.index=state.entries.length-1;
 syncHistoryControls();
}
function syncHistoryIndex(location){
 const state=historyFor();
 if(!state)return;
 const index=state.entries.findIndex(entry=>sameLocation(entry,location));
 if(index>=0)state.index=index;
 else{
  state.entries=[location];
  state.index=0;
 }
 syncHistoryControls();
}
function updatePageTitle(){
 const plantName=activeRoute==="plants"&&activeParams.plantId
  ?resolvePlantName?.(activeParams.plantId)||""
  :"";
 document.title=documentTitle(activeRoute,activeParams,plantName);
}
function titleForLocation(location){
 const definition=routeCatalog[location.route];
 if(location.route==="plants"&&location.params?.plantId){
  return resolvePlantName?.(location.params.plantId)||"Plant not found";
 }
 return definition?.title||"Page";
}
function syncUrl(mode="push"){
 if(applyingLocation)return;
 const path=pathForRoute(activeRoute,activeParams);
 if(!path)return;
 const url=path+location.search+location.hash;
 const current=location.pathname+location.search+location.hash;
 const state={
  wattdesk:true,
  tabId:workspaceTabs.active()?._state.id,
  route:activeRoute,
  params:{...activeParams}
 };
 if(url===current){
  history.replaceState(state,"",url);
  return;
 }
 const method=mode==="replace"?"replaceState":"pushState";
 history[method](state,"",url);
}
function updateTabLocation(tab,location){
 const definition=routeCatalog[location.route];
 if(!definition)return;
 const home=tab._state.snapshot?.home||defaultSnapshot;
 workspaceTabs.update(tab,{
  route:location.route,
  params:{...location.params},
  title:titleForLocation(location),
  kind:location.route==="home"?"home":"route",
  iconFile:definition.icon,
  snapshot:{route:location.route,params:{...location.params},home}
 });
}

function scheduleHomeLayout(){
 cancelAnimationFrame(homeLayoutFrame);
 homeLayoutFrame=requestAnimationFrame(()=>{
  if(activeRoute!=="home"||homeColumn.hidden)return;
  layoutHome?.();
 });
}

function renderLocation(location){
 const route=location.route;
 const params=location.params||{};
 const isHome=route==="home";
 const definition=routeCatalog[route];
 const view=route?routeViews.get(route):null;
 const previous=activeRoute;
 const changed=!sameLocation({route:previous,params:activeParams},location);
 activeRoute=route;
 activeParams=params;

 homeColumn.hidden=!isHome;
 if(previous!==route){
  const previousView=routeViews.get(previous);
  if(previousView&&previousView!==view)previousView.hide?.();
 }
 for(const entry of routeViews.values())entry.element.hidden=entry!==view||isHome;
 emptyWorkspace.hidden=isHome||!!view;
 workspacePanel.setAttribute("aria-label",
  definition?`${definition.title} workspace`:"Page not found workspace");
 if(!isHome&&!view){
  emptyState.update({
   iconFile:definition?.icon??null,
   label:definition?"Coming soon":"Page not found"
  });
  emptyWorkspace.setAttribute("aria-label",
   definition?`${definition.title} coming soon`:"Page not found");
  if(changed&&definition)emptyState.play();
 }
 if(!isHome&&view)view.show?.(params);
 // Home can be mounted and measured while hidden (for example a direct load
 // on /plants). Its absolute scene must be reflowed after it becomes visible,
 // before the next paint, or stale zero-height measurements make sections overlap.
 if(isHome)scheduleHomeLayout();
 homeWorkspace.setAttribute("aria-label",
  definition?`${definition.title} workspace`:"Page not found workspace");
 for(const row of routeRows){
  const selected=row.dataset.route===route;
  row.classList.toggle("active",selected);
  row.setAttribute("aria-current",selected?"page":"false");
 }
}

function commitLocation(location,{
 urlMode="push",recordHistory=true,updateTab=true,updateUrl=true
}={}){
 const tab=workspaceTabs.active();
 if(!tab)return null;
 renderLocation(location);
 if(updateTab)updateTabLocation(tab,location);
 if(recordHistory)addHistoryEntry(tab,location);
 if(updateUrl)syncUrl(urlMode);
 updatePageTitle();
 syncHistoryControls();
 requestAnimationFrame(()=>workspaceTabs.layout());
 return tab;
}

function openRoute(route,{record=true,params={},historyMode="push"}={}){
 const definition=routeCatalog[route],tab=workspaceTabs.active();
 if(!definition||!tab)return null;
 // Re-selecting the current sidebar row still dismisses an open filter, menu
 // or search surface; only the route transition itself is a no-op.
 close(true);
 searchClose(true);
 if(sameLocation({route:activeRoute,params:activeParams},{route,params}))return tab;
 recentVisits.record(route);
 workspaceTabs.captureCurrent();
 return commitLocation({route,params},{urlMode:record?historyMode:"replace",recordHistory:record});
}

function openRouteInNewTab(route,{params={}}={}){
 const definition=routeCatalog[route];
 if(!definition)return null;
 close(true);
 searchClose(true);
 recentVisits.record(route);
 const source=workspaceTabs.active();
 workspaceTabs.captureCurrent();
 const location={route,params:{...params}};
 const id=`route-${nextRouteTab++}`;
 const tab=workspaceTabs.add({
  id,
  title:titleForLocation(location),
  kind:route==="home"?"home":"route",
  route,
  params:{...params},
  iconFile:definition.icon,
  snapshot:{route,params:{...params},home:{...defaultSnapshot,range:{...defaultSnapshot.range}}}
 });
 if(source)newTabOrigins.set(tab._state.id,source._state.id);
 ensureHistory(tab,location);
 syncHistoryControls();
 return tab;
}

function returnToPlantsList(){
 const current=workspaceTabs.active();
 if(!current)return null;
 const originId=newTabOrigins.get(current._state.id);
 const source=originId?workspaceTabs.tabs.find(tab=>tab._state.id===originId):null;
 const isList=tab=>tab&&tab._state.route==="plants"&&!tab._state.params?.plantId;
 const target=isList(source)
  ?source
  :workspaceTabs.tabs.find(tab=>tab!==current&&isList(tab));
 if(target&&workspaceTabs.tabs.length>1){
  close(true);
  searchClose(true);
  workspaceTabs.activate(target);
  workspaceTabs.remove(current);
  return target;
 }
 return openRoute("plants");
}

function goHistory(delta){
 const state=historyFor(),tab=workspaceTabs.active();
 if(!state||!tab)return;
 const next=state.index+delta;
 if(next<0||next>=state.entries.length)return;
 const location=state.entries[next];
 if(!routeCatalog[location.route])return;
 state.index=next;
 close(true);
 searchClose(true);
 commitLocation(location,{urlMode:"replace",recordHistory:false});
}

// Sidebar rows and in-page controls both go through openRoute; the shell only
// decides which surface the active location reveals.
targetChrome.back.addEventListener("click",()=>goHistory(-1));
targetChrome.forward.addEventListener("click",()=>goHistory(1));

workspaceTabs.captureState=()=>({
 route:activeRoute,
 params:{...activeParams},
 home:homeSnapshot()
});
workspaceTabs.restoreState=snapshot=>{
 const location={route:snapshot?.route||"home",params:snapshot?.params||{}};
 activeRoute=location.route;
 activeParams=location.params;
 renderLocation(location);
 const home=snapshot?.home||snapshot;
 if(!home)return;
 homeColumn.scrollTop=home.scrollTop??0;
 input.value=home.query??"";
 if(home.range?.start&&home.range?.end)period.setRange(home.range);
 else period.setPeriod(home.period??"Last 7 days");
 syncHistoryControls();
};

function addHomeTab(){
 // Identical tabs share one readable title; their identity stays in the tab id.
 const id=`home-${++nextHome}`;
 const tab=workspaceTabs.add({
  id,
  title:"Home",
  kind:"home",
  route:"home",
  params:{},
  snapshot:{route:"home",params:{},home:{...defaultSnapshot,range:{...defaultSnapshot.range}}}
 });
 ensureHistory(tab,{route:"home",params:{}});
 syncHistoryControls();
 return tab;
}

workspaceTabs.mountTab=tab=>glass.addSurface({host:tab,radius:18});
workspaceTabs.onUnmount=tab=>{
 routeHistory.delete(tab._state.id);
 newTabOrigins.delete(tab._state.id);
 for(const [tabId,originId] of newTabOrigins){
  if(originId===tab._state.id)newTabOrigins.delete(tabId);
 }
 glass.removeSurface(tab);
 syncHistoryControls();
};
workspaceTabs.onSelect=(state,tab)=>{
 close(true);
 searchClose(true);
 const next={route:state.route||"home",params:state.params||{}};
 const changed=!sameLocation({route:activeRoute,params:activeParams},next);
 activeRoute=next.route;
 activeParams=next.params;
 renderLocation(next);
 if(changed)recentVisits.record(next.route);
 updatePageTitle();
 workspacePanel.setAttribute("aria-label",`${routeCatalog[next.route]?.title||"Page"} workspace`);
 workspacePanel.setAttribute("aria-labelledby",tab.id);
 tab.setAttribute("aria-controls",workspacePanel.id);
 syncHistoryControls();
 if(!booting&&!applyingLocation)syncUrl("push");
 requestAnimationFrame(()=>workspaceTabs.layout());
};

// A page module mounts one element and owns its own show/hide lifecycle; the
// shell only decides which surface the active route reveals.
function registerRouteView(route,view){
 if(!view?.element)return()=>{};
 routeViews.set(route,view);
 homeWorkspace.append(view.element);
 const active=activeRoute===route;
 view.element.hidden=!active;
 if(active){
  emptyWorkspace.hidden=true;
  view.show?.(activeParams);
 }
 return ()=>{routeViews.delete(route);view.element.remove();};
}

// Browser Back/Forward update the active tab in place. The tab-local history
// is reconciled by matching the restored URL, so the sidebar controls and the
// browser buttons do not drift apart after a deep-link refresh.
window.addEventListener("popstate",event=>{
 applyingLocation=true;
 const location=routeFromPath(locationPathname());
 const tab=workspaceTabs.active();
 const stateTab=event.state?.tabId
  ?workspaceTabs.tabs.find(item=>item._state.id===event.state.tabId)
  :null;
 if(stateTab&&stateTab!==tab)workspaceTabs.activate(stateTab,{restore:false});
 commitLocation(location,{updateUrl:false,recordHistory:false,updateTab:Boolean(location.route)});
 syncHistoryIndex(location);
 applyingLocation=false;
});

// Boot from the URL instead of always creating a Home surface. The server
// serves the same shell for `/plants` and `/plants/:id`; this is the only
// place that turns those paths into visible routes.
const initialLocation=routeFromPath(locationPathname());
const initialDefinition=routeCatalog[initialLocation.route];
workspaceTabs.add({
 id:"home-1",
 title:initialDefinition?titleForLocation(initialLocation):"Home",
 kind:initialLocation.route==="home"?"home":"route",
 route:initialLocation.route,
 params:initialLocation.params,
 iconFile:initialDefinition?.icon??null,
 snapshot:{
  route:initialLocation.route,
  params:initialLocation.params,
  home:defaultSnapshot
 }
});
ensureHistory(workspaceTabs.tabs[0],initialLocation);
workspaceTabs.activate(workspaceTabs.tabs[0]);
if(initialLocation.route){
 activeRoute=initialLocation.route;
 activeParams=initialLocation.params;
 renderLocation(initialLocation);
 updatePageTitle();
 syncUrl("replace");
}else{
 activeRoute=null;
 activeParams={};
 renderLocation(initialLocation);
 updatePageTitle();
}
booting=false;
syncHistoryControls();

targetChrome.onEmpty=()=>{
 addHomeTab();
};
targetChrome.add.addEventListener("click",()=>{
 addHomeTab();
 toast("New Home tab");
});
// Sidebar rows switch content inside the active tab, never open a new tab.
for(const row of routeRows){
 row.addEventListener("click",()=>{
  const route=row.dataset.route;
  if(routeCatalog[route])openRoute(route);
 });
}

return {
 openRoute,
 openRouteInNewTab,
 returnToPlantsList,
 goHistory,
 addHomeTab,
 registerRouteView,
 showRoute(route,params={}){
  activeRoute=route;
  activeParams=params;
  renderLocation({route,params});
  updatePageTitle();
 }
};
}

function locationPathname(){
 return window.location.pathname;
}
