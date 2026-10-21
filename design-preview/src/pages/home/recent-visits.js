// Recently visited routes. The product keeps this in the cloud; until that
// service exists the preview stores a durable local archive and always keeps
// the current Home entry that the design shows.
import {enhanceControl} from "../../components/controls.js";
import {ROUTE_CATALOG} from "./routes.js";

const MAX_RECENT_VISITS=8;
const RECENT_VISITS_STORAGE_KEY="wattdesk.recent-visits.v1";
const RECENT_VISIT_ROWS=["14613:1350","14613:1371","14613:1392","14613:1413","14613:1434"];

function loadRecentVisits(){
 try{
  const stored=JSON.parse(localStorage.getItem(RECENT_VISITS_STORAGE_KEY)||"[]");
  if(Array.isArray(stored)){
   const routes=stored.map(entry=>typeof entry==="string"?entry:entry?.route)
    .filter(route=>ROUTE_CATALOG[route])
    .filter((route,index,list)=>index===0||list[index-1]!==route);
   if(routes.length)return routes.slice(0,MAX_RECENT_VISITS).map(route=>({route}));
  }
 }catch{}
 return [{route:"home"}];
}

function displayTitle(route){
 return route==="statistics"?"Statistics (coming soon)":ROUTE_CATALOG[route]?.title||"Home";
}

export function createRecentVisits({get,onOpen}){
 const list=loadRecentVisits();

 function render(){
  for(const [index,id] of RECENT_VISIT_ROWS.entries()){
   const row=get(id),entry=list[index],label=get(`I${id};14612:7804`);
   row.hidden=!entry;
   if(!entry)continue;
   const title=displayTitle(entry.route);
   if(label){
    label.textContent=title;
    label.setAttribute("aria-label",title);
    label.title=title;
   }
   row.dataset.route=entry.route;
   row.dataset.recentVisit="true";
   row.setAttribute("aria-label",title);
   // The clock icon belongs to the Home summary, so it stays neutral for every
   // row. Page-specific icons appear only inside the history popover.
   row.classList.add("shortcut-link");
   if(!row.dataset.enhanced){
    row.dataset.enhanced="true";
    enhanceControl(row,{label:title,onActivate:()=>onOpen(row.dataset.route)});
   }
   if(index===Math.min(RECENT_VISIT_ROWS.length,list.length)-1)row.classList.add("shortcut-link-last");
   else row.classList.remove("shortcut-link-last");
  }
 }

 function record(route){
  if(!ROUTE_CATALOG[route]||list[0]?.route===route)return;
  list.unshift({route});
  list.splice(MAX_RECENT_VISITS);
  try{localStorage.setItem(RECENT_VISITS_STORAGE_KEY,JSON.stringify(list.map(entry=>entry.route)))}catch{}
  render();
 }

 render();
 return {list,record,render};
}
