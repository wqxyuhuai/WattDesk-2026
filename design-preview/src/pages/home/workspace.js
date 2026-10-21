// Workspace tabs and in-tab routing. Each tab keeps its own route, home
// snapshot and back/forward history; the sidebar switches content inside the
// active tab instead of opening a new one.
import {createEmptyState} from "../../components/empty-state.js";
import {ROUTE_CATALOG as routeCatalog} from "./routes.js";

export function createWorkspace({get,glass,toast,close,homeColumn,input,period,homeSnapshot,targetChrome,workspacePanel,searchClose,recentVisits}){
const routeRows=[...targetChrome.sidebar.querySelectorAll(".target-nav[data-route]")];
let activeRoute="home";
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
 close(true);searchClose(true);
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
 // Sidebar rows switch content inside the active tab, never open a new tab.
 for(const row of routeRows){row.addEventListener("click",()=>{const route=row.dataset.route;if(routeCatalog[route])openRoute(route);});}
 return {openRoute,goHistory,addHomeTab,showRoute};
}
