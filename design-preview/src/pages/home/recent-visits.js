// Recently visited locations. The archive is shared by every workspace tab;
// only the back/forward stacks remain tab-local. The product keeps this data
// in the cloud eventually; this preview persists it locally until that API
// exists.
import {enhanceControl} from "../../components/controls.js";
import {historyPathText,renderHistoryPath} from "../../components/history-path.js";
import {ROUTE_CATALOG,displayTitle} from "./routes.js";

const MAX_RECENT_VISITS=8;
const RECENT_VISITS_STORAGE_KEY="wattdesk.recent-visits.v1";
const RECENT_VISIT_ROWS=["14613:1350","14613:1371","14613:1392","14613:1413","14613:1434"];

function normalizeParams(params){
 const source=params&&typeof params==="object"?params:{};
 return Object.fromEntries(Object.entries(source)
  .filter(([,value])=>["string","number","boolean"].includes(typeof value))
  .map(([key,value])=>[key,String(value)]));
}

function locationKey(entry){
 const params=Object.entries(entry.params||{}).sort(([left],[right])=>left.localeCompare(right));
 return JSON.stringify([entry.route,params]);
}

function toEntry(value){
 const route=typeof value==="string"?value:value?.route;
 if(!ROUTE_CATALOG[route])return null;
 return {route,params:normalizeParams(typeof value==="object"?value?.params:{})};
}

function loadRecentVisits(){
 try{
  const stored=JSON.parse(localStorage.getItem(RECENT_VISITS_STORAGE_KEY)||"[]");
  if(Array.isArray(stored)){
   const entries=[];
   let previousKey="";
   for(const value of stored){
    const entry=toEntry(value);
    if(!entry)continue;
    const key=locationKey(entry);
    if(key===previousKey)continue;
    previousKey=key;
    entries.push(entry);
    if(entries.length===MAX_RECENT_VISITS)break;
   }
   if(entries.length)return entries;
  }
 }catch{}
 return [{route:"home",params:{}}];
}

function pathParts(entry,resolvePlantName){
 if(entry.route==="plants"&&entry.params?.plantId){
  return [
   {text:ROUTE_CATALOG.plants.title,tone:"ancestor"},
   {text:resolvePlantName?.(entry.params.plantId)||"Plant not found",tone:"current"}
  ];
 }
 return [{text:displayTitle(entry.route),tone:"current"}];
}

export function createRecentVisits({get,onOpen,resolvePlantName}){
 let list=loadRecentVisits();

 function describe(entry){
  const params={...entry.params};
  const parts=pathParts(entry,resolvePlantName);
  return {
   ...entry,
   params,
   parts,
   title:historyPathText(parts),
   iconFile:ROUTE_CATALOG[entry.route]?.icon??null
  };
 }

 function render(){
  for(const [index,id] of RECENT_VISIT_ROWS.entries()){
   const row=get(id),entry=list[index],label=get(`I${id};14612:7804`);
   row.hidden=!entry;
   if(!entry)continue;
   const description=describe(entry);
   row._recentVisitEntry=entry;
   row.dataset.route=entry.route;
   row.dataset.recentVisit="true";
   if(entry.params?.plantId)row.dataset.plantId=entry.params.plantId;
   else delete row.dataset.plantId;
   row.classList.add("shortcut-link","recent-visit-row");
   row.setAttribute("aria-label",description.title);
   if(label){
    label.parentElement?.classList.add("recent-visit-copy");
    label.parentElement?.parentElement?.classList.add("recent-visit-content");
    label.classList.add("recent-visit-path");
    renderHistoryPath(label,description.parts);
    label.setAttribute("aria-label",description.title);
    label.title=description.title;
   }
   // The clock icon belongs to the Home summary, so it stays neutral for every
   // row. Page-specific icons appear only inside the history popover.
   if(!row.dataset.enhanced){
    row.dataset.enhanced="true";
    enhanceControl(row,{
     label:description.title,
     onActivate:()=>onOpen(row._recentVisitEntry.route,{params:row._recentVisitEntry.params})
    });
   }
   row.classList.toggle("shortcut-link-last",index===Math.min(RECENT_VISIT_ROWS.length,list.length)-1);
  }
 }

 function record(route,params={}){
  const entry=toEntry({route,params});
  if(!entry)return;
  const key=locationKey(entry);
  if(list[0]&&locationKey(list[0])===key)return;
  list.unshift(entry);
  list=list.slice(0,MAX_RECENT_VISITS);
  try{localStorage.setItem(RECENT_VISITS_STORAGE_KEY,JSON.stringify(list))}catch{}
  render();
 }

 render();
 return {
  get list(){return list.map(entry=>({...entry,params:{...entry.params}}));},
  record,
  render,
  describe
 };
}
