// Workspace tabs and in-tab routing. Each tab keeps its own route, home
// snapshot and back/forward history; the sidebar switches content inside the
// active tab instead of opening a new one. The active tab's route is mirrored
// into the browser URL so refresh, copy-link and browser Back stay meaningful.
import {createEmptyState} from "../../components/empty-state.js";
import {createPageHeader} from "../../components/page-header.js";
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
const WORKSPACE_STORAGE_KEY="wattdesk.workspace.v1";
const WORKSPACE_STORAGE_VERSION=1;

export function createWorkspace({
 get,glass,toast,close,homeColumn,input,period,homeSnapshot,targetChrome,
 workspacePanel,searchClose,recentVisits,resolvePlantName,resolveServiceTicketTitle,layoutHome
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
const emptyBody=document.createElement("div");
emptyBody.className="workspace-empty-body";
emptyBody.setAttribute("role","status");
emptyBody.setAttribute("aria-live","polite");
const emptyHeader=createPageHeader({
 breadcrumb:[{label:"Page not found"}],
 className:"workspace-empty-header"
});
const emptyState=createEmptyState();
emptyBody.append(emptyState.element);
emptyWorkspace.append(emptyHeader.element,emptyBody);
homeWorkspace.append(emptyWorkspace);
const defaultSnapshot=homeSnapshot();
let nextHome=1;
let homeLayoutFrame=0;
const workspaceTabs=targetChrome.workspaceTabs;
// Navigation history is local to each tab. It records location descriptors
// (route + params), so /plants and /plants/p02 are separate entries.
const routeHistory=new Map();
const newTabOrigins=new Map();
const sidebarMemory=new Map();
let skipNextRenderOnSelect=false;
let persistTimer=0;

function normalizeStoredParams(params){
 if(!params||typeof params!=="object"||Array.isArray(params))return {};
 return Object.fromEntries(Object.entries(params)
  .filter(([,value])=>["string","number","boolean"].includes(typeof value))
  .map(([key,value])=>[key,value]));
}

function restoredSnapshot(snapshot,location){
 const saved=snapshot&&typeof snapshot==="object"?snapshot:{};
 const savedHome=saved.home&&typeof saved.home==="object"?saved.home:{};
 return {
  route:location.route,
  params:{...location.params},
  home:{
   ...defaultSnapshot,
   ...savedHome,
   range:{...defaultSnapshot.range,...(savedHome.range||{})}
  },
  view:saved.view??null
 };
}

function restoredTabState(value,seenIds){
 if(!value||typeof value!=="object")return null;
 const route=value.route;
 if(!routeCatalog[route])return null;
 const params=normalizeStoredParams(value.params);
 // Local "New ticket" drafts and session-created ticket IDs intentionally do
 // not survive a reload. The current URL can still recreate a blank new-ticket
 // route when it is the active location.
 if(route==="service"&&params.newTicket)return null;
 if(route==="plants"&&params.plantId&&!resolvePlantName?.(params.plantId))return null;
 if(route==="service"&&params.ticketId&&!resolveServiceTicketTitle?.(params.ticketId))return null;
 const id=String(value.id||"");
 if(!/^(?:home|route)-\d+$/.test(id)||seenIds.has(id))return null;
 seenIds.add(id);
 const location={route,params};
 const definition=routeCatalog[route];
 return {
  id,
  title:titleForLocation(location),
  kind:route==="home"?"home":"route",
  route,
  params,
  iconFile:definition?.icon??null,
  snapshot:restoredSnapshot(value.snapshot,location)
 };
}

function loadStoredWorkspace(){
 try{
  const stored=JSON.parse(sessionStorage.getItem(WORKSPACE_STORAGE_KEY)||"null");
  if(!stored||stored.version!==WORKSPACE_STORAGE_VERSION||!Array.isArray(stored.tabs))return null;
  const seenIds=new Set();
  const tabs=stored.tabs.map(value=>restoredTabState(value,seenIds)).filter(Boolean);
  if(!tabs.length)return null;
  if(Number.isInteger(stored.counters?.nextHome))nextHome=Math.max(nextHome,stored.counters.nextHome);
  if(Number.isInteger(stored.counters?.nextRouteTab))nextRouteTab=Math.max(nextRouteTab,stored.counters.nextRouteTab);
  return {
   tabs,
   activeId:tabs.some(tab=>tab.id===stored.activeId)?stored.activeId:null
  };
 }
 catch{
  return null;
 }
}

function syncNextTabIds(tabs){
 for(const tab of tabs){
  const match=tab.id.match(/^(home|route)-(\d+)$/);
  if(!match)continue;
  const value=Number(match[2])||0;
  if(match[1]==="home")nextHome=Math.max(nextHome,value);
  else nextRouteTab=Math.max(nextRouteTab,value+1);
 }
}

function initialTabState(location,id){
 const definition=routeCatalog[location.route];
 return {
  id,
  title:definition?titleForLocation(location):"Page not found",
  kind:location.route==="home"?"home":"route",
  route:location.route,
  params:{...location.params},
  iconFile:definition?.icon??null,
  snapshot:{
   route:location.route,
   params:{...location.params},
   home:{...defaultSnapshot,range:{...defaultSnapshot.range}},
   view:null
  }
 };
}

function persistWorkspaceNow(){
 if(booting)return;
 clearTimeout(persistTimer);
 persistTimer=0;
 workspaceTabs.captureCurrent();
 const tabs=workspaceTabs.tabs.flatMap(tab=>{
  const state=tab._state;
  if(!state?.route||!routeCatalog[state.route])return [];
  if(state.route==="service"&&state.params?.newTicket)return [];
  return [{
   id:state.id,
   title:state.title,
   kind:state.kind,
   route:state.route,
   params:{...(state.params||{})},
   iconFile:state.iconFile??null,
   snapshot:state.snapshot??null
  }];
 });
 if(!tabs.length)return;
 const activeId=tabs.some(tab=>tab.id===workspaceTabs.activeId)
  ?workspaceTabs.activeId
  :tabs[0].id;
 try{
  sessionStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify({
   version:WORKSPACE_STORAGE_VERSION,
   activeId,
   counters:{nextHome,nextRouteTab},
   tabs
  }));
 }
 catch{
  // Storage can be unavailable or full; the current in-memory workspace remains usable.
 }
}

function schedulePersistWorkspace(){
 if(booting)return;
 clearTimeout(persistTimer);
 persistTimer=setTimeout(persistWorkspaceNow,120);
}

function sidebarSection(route){
 if(route==="plants"||route==="service")return route;
 return route;
}
function snapshotRoute(route){
 if(!route)return null;
 if(route==="home")return homeSnapshot();
 return routeViews.get(route)?.snapshot?.()??null;
}
function restoreRoute(route,snapshot={}){
 if(!route)return;
 if(route==="home"){
  homeColumn.scrollTop=snapshot.scrollTop??0;
  input.value=snapshot.query??"";
  if(snapshot.range?.start&&snapshot.range?.end)period.setRange(snapshot.range);
  else period.setPeriod(snapshot.period??"Last 7 days");
  return;
 }
 routeViews.get(route)?.restore?.(snapshot);
}
function sidebarEntries(tab=workspaceTabs.active()){
 if(!tab)return null;
 let entries=sidebarMemory.get(tab._state.id);
 if(!entries){
  entries=new Map();
  sidebarMemory.set(tab._state.id,entries);
 }
 return entries;
}
function rememberSidebarLocation(tab=workspaceTabs.active(),route=activeRoute,params=activeParams){
 if(!tab||!routeCatalog[route])return;
 const entries=sidebarEntries(tab);
 entries?.set(sidebarSection(route),{
  location:{route,params:{...params}},
  view:snapshotRoute(route)
 });
}

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
 const resourceName=activeRoute==="plants"&&activeParams.plantId
  ?resolvePlantName?.(activeParams.plantId)||""
  :activeRoute==="service"&&activeParams.ticketId
   ?resolveServiceTicketTitle?.(activeParams.ticketId)||""
   :"";
 document.title=documentTitle(activeRoute,activeParams,resourceName);
}
function titleForLocation(location){
 const definition=routeCatalog[location.route];
 if(location.route==="plants"&&location.params?.plantId){
  return resolvePlantName?.(location.params.plantId)||"Plant not found";
 }
 if(location.route==="service"&&location.params?.newTicket)return "New ticket";
 if(location.route==="service"&&location.params?.ticketId){
  return resolveServiceTicketTitle?.(location.params.ticketId)||"Ticket not found";
 }
 return definition?.title||"Page";
}
function syncUrl(mode="push"){
 if(applyingLocation)return;
 const path=pathForRoute(activeRoute,activeParams);
 if(!path)return;
 const next=new URL(path,location.origin);
 const currentParams=new URLSearchParams(location.search);
 for(const [key,value] of currentParams){
  if(key==="connection"||key==="status"||next.searchParams.has(key))continue;
  next.searchParams.append(key,value);
 }
 const url=next.pathname+next.search+location.hash;
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
  snapshot:{route:location.route,params:{...location.params},home,view:snapshotRoute(location.route)}
 });
}

function scheduleHomeLayout(){
 cancelAnimationFrame(homeLayoutFrame);
 homeLayoutFrame=requestAnimationFrame(()=>{
  if(activeRoute!=="home"||homeColumn.hidden)return;
  layoutHome?.();
 });
}

function renderLocation(location,{restoreView=undefined}={}){
 const route=location.route;
 const params=location.params||{};
 const isHome=route==="home";
 const definition=routeCatalog[route];
 const view=route?routeViews.get(route):null;
 const previous=activeRoute;
 const changed=!sameLocation({route:previous,params:activeParams},location);
 activeRoute=route;
 activeParams=params;
 if(changed&&definition)recentVisits.record(route,params);

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
  const emptyTitle=emptyHeader.breadcrumb.querySelector(".wd-page-breadcrumb-current");
  if(emptyTitle)emptyTitle.textContent=definition?.title||"Page not found";
  emptyState.update({
   iconFile:definition?.icon??null,
   label:definition?"Coming soon":"Page not found"
  });
  emptyBody.setAttribute("aria-label",
   definition?`${definition.title} coming soon`:"Page not found");
  if(changed&&definition)emptyState.play();
 }
 if(!isHome&&view)view.show?.(params);
 if(restoreView!==undefined&&!isHome)restoreRoute(route,restoreView);
 if(isHome&&restoreView!==undefined)restoreRoute("home",restoreView);
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
 urlMode="push",recordHistory=true,updateTab=true,updateUrl=true,restoreView=undefined
}={}){
 const tab=workspaceTabs.active();
 if(!tab)return null;
 if(!sameLocation({route:activeRoute,params:activeParams},location))rememberSidebarLocation(tab);
 renderLocation(location,{restoreView});
 if(updateTab)updateTabLocation(tab,location);
 if(recordHistory)addHistoryEntry(tab,location);
 if(updateUrl)syncUrl(urlMode);
 updatePageTitle();
 syncHistoryControls();
 requestAnimationFrame(()=>workspaceTabs.layout());
 return tab;
}

function openRoute(route,{record=true,params={},historyMode="push",viewState=undefined}={}){
 const definition=routeCatalog[route],tab=workspaceTabs.active();
 if(!definition||!tab)return null;
 // Re-selecting the current sidebar row still dismisses an open filter, menu
 // or search surface; only the route transition itself is a no-op.
 close(true);
 searchClose(true);
 if(sameLocation({route:activeRoute,params:activeParams},{route,params}))return tab;
 workspaceTabs.captureCurrent();
 return commitLocation({route,params},{urlMode:record?historyMode:"replace",recordHistory:record,restoreView:viewState});
}

function openSidebarRoute(route){
 const tab=workspaceTabs.active();
 if(!tab||!routeCatalog[route])return null;
 const alreadyInSection=activeRoute&&sidebarSection(activeRoute)===sidebarSection(route);
 if(alreadyInSection){
  const canonical={route,params:{}};
  if(!sameLocation({route:activeRoute,params:activeParams},canonical))return openRoute(route);
  return tab;
 }
 const remembered=sidebarEntries(tab)?.get(sidebarSection(route));
 if(!remembered)return openRoute(route);
 return openRoute(remembered.location.route,{
  params:remembered.location.params,
  viewState:remembered.view
 });
}

// Page-local controls use this to keep a supported route preset mirrored in
// the address bar without forcing a route transition or closing their surface.
function replaceActiveParams(params={}){
 if(!routeCatalog[activeRoute])return;
 const next={...params};
 if(sameParams(activeParams,next))return;
 activeParams=next;
 const tab=workspaceTabs.active();
 if(tab)updateTabLocation(tab,{route:activeRoute,params:next});
 syncUrl("replace");
 updatePageTitle();
}

function openRouteInNewTab(route,{params={}}={}){
 const definition=routeCatalog[route];
 if(!definition)return null;
 close(true);
 searchClose(true);
 recentVisits.record(route);
 const source=workspaceTabs.active();
 rememberSidebarLocation(source);
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

function returnToServiceList(){
 const current=workspaceTabs.active();
 if(!current)return null;
 const originId=newTabOrigins.get(current._state.id);
 const source=originId?workspaceTabs.tabs.find(tab=>tab._state.id===originId):null;
 const isList=tab=>tab&&tab._state.route==="service"&&!tab._state.params?.ticketId&&!tab._state.params?.newTicket;
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
 return openRoute("service");
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
 home:homeSnapshot(),
 view:snapshotRoute(activeRoute)
});
workspaceTabs.restoreState=snapshot=>{
 const location={route:snapshot?.route||"home",params:snapshot?.params||{}};
 renderLocation(location,{restoreView:snapshot?.view});
 skipNextRenderOnSelect=true;
 syncHistoryControls();
};
workspaceTabs.onStateChange=schedulePersistWorkspace;
document.addEventListener("scroll",schedulePersistWorkspace,{capture:true,passive:true});
addEventListener("pagehide",persistWorkspaceNow);
addEventListener("beforeunload",persistWorkspaceNow);
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="hidden")persistWorkspaceNow();
});

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
 sidebarMemory.delete(tab._state.id);
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
 if(skipNextRenderOnSelect)skipNextRenderOnSelect=false;
 else renderLocation(next);
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
 const location=routeFromPath(locationPathname(),window.location.search);
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
const initialLocation=routeFromPath(locationPathname(),window.location.search);
const storedWorkspace=loadStoredWorkspace();
const restoredStates=storedWorkspace?.tabs??[];
syncNextTabIds(restoredStates);
let restoredActiveId=storedWorkspace?.activeId??null;
if(initialLocation.route){
 const matchingTab=restoredStates.find(tab=>
  sameLocation({route:tab.route,params:tab.params},initialLocation)&&
  (tab.id===storedWorkspace?.activeId||!restoredActiveId)
 )||restoredStates.find(tab=>sameLocation({route:tab.route,params:tab.params},initialLocation));
 if(matchingTab){
  restoredActiveId=matchingTab.id;
 }else{
  const id=restoredStates.length
   ?initialLocation.route==="home"?`home-${++nextHome}`:`route-${nextRouteTab++}`
   :"home-1";
  restoredStates.push(initialTabState(initialLocation,id));
  restoredActiveId=id;
 }
}else{
 const id=restoredStates.length?`route-${nextRouteTab++}`:"home-1";
 restoredStates.push(initialTabState({route:null,params:{},notFound:true},id));
 restoredActiveId=id;
}
syncNextTabIds(restoredStates);
workspaceTabs.hydrate(restoredStates,restoredActiveId);
for(const tab of workspaceTabs.tabs){
 ensureHistory(tab,{route:tab._state.route||null,params:tab._state.params||{}});
}
const initialActiveTab=workspaceTabs.active();
const initialActiveLocation={
 route:initialActiveTab?._state.route||null,
 params:initialActiveTab?._state.params||{}
};
if(initialActiveLocation.route){
 activeRoute=initialActiveLocation.route;
 activeParams=initialActiveLocation.params;
 const restoreView=initialActiveLocation.route==="home"
  ?initialActiveTab?._state.snapshot?.view??initialActiveTab?._state.snapshot?.home
  :initialActiveTab?._state.snapshot?.view;
 renderLocation(initialActiveLocation,{restoreView});
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
schedulePersistWorkspace();

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
  if(routeCatalog[route])openSidebarRoute(route);
 });
}

return {
 openRoute,
 replaceActiveParams,
 openRouteInNewTab,
 returnToPlantsList,
 returnToServiceList,
 goHistory,
 addHomeTab,
 registerRouteView,
 showRoute(route,params={}){
  renderLocation({route,params});
  updatePageTitle();
 }
};
}

function locationPathname(){
 return window.location.pathname;
}
