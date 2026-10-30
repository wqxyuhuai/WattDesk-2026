// Single source of truth for the routes the shell can show. Adding a page
// means one entry here plus a page module under ../<route>/.
//
// `path` is the canonical browser URL. The workspace keeps its tab history in
// memory, but the address bar and reloads always resolve through this table so
// `/plants` or `/plants/p02` cannot silently fall back to Home.
export const ROUTE_CATALOG={
 home:{title:"Home",icon:null,path:"/home"},
 plants:{title:"Plants",icon:"asset-6.svg",path:"/plants"},
 service:{title:"Service ticket",icon:"asset-7.svg",path:"/service"},
 statistics:{title:"Statistics",icon:"statistics.svg",path:"/statistics"},
 cell:{title:"Cell balance",icon:"cell-balance.svg",path:"/cell-balance"},
 module:{title:"Module balance",icon:"module-balance.svg",path:"/module-balance"},
 track:{title:"Device track",icon:"device-track.svg",path:"/device-track"},
 org:{title:"Wattsonic Technology",icon:"organisation.svg",path:"/organisation"},
 "your-teams":{title:"Your teams",icon:"teams.svg",path:"/teams"},
 "end-users":{title:"End users",icon:"user.svg",path:"/users"}
};
export const SEARCH_QUICK_LINKS=["home","plants","service","track"];
const PATH_TO_ROUTE=new Map(Object.entries(ROUTE_CATALOG).map(([route,definition])=>[definition.path,route]));
const PLANT_DETAIL_PATH=/^\/plants\/([^/]+)$/;
const SERVICE_DETAIL_PATH=/^\/service\/([^/]+)$/;
const PLANT_FILTER_VALUES=Object.freeze({
 connection:new Set(["online"]),
 status:new Set(["attention"])
});

function normalizePath(pathname){
 const value=String(pathname||"/");
 const withLeadingSlash=value.startsWith("/")?value:`/${value}`;
 return withLeadingSlash.length>1?withLeadingSlash.replace(/\/+$/,""):withLeadingSlash;
}

// Translate a location into the shell's route + params. Unknown URLs stay
// explicit (`route:null`) instead of being rewritten to Home, so a bad deep
// link is visibly a not-found state and a refresh cannot hide it.
function plantFiltersFromSearch(search){
 const values=new URLSearchParams(search||"");
 const params={};
 for(const [key,allowed] of Object.entries(PLANT_FILTER_VALUES)){
  const value=values.get(key);
  if(allowed.has(value))params[key]=value;
 }
 return params;
}

export function routeFromPath(pathname,search=""){
 const path=normalizePath(pathname);
 if(path==="/"||path==="/home"||path==="/home.html"||path==="/index.html"){
  return {route:"home",params:{}};
 }
 if(path==="/plants")return {route:"plants",params:plantFiltersFromSearch(search)};
 const detail=path.match(PLANT_DETAIL_PATH);
 if(detail){
  let plantId;
  try{plantId=decodeURIComponent(detail[1]);}catch{/* malformed escape */ }
  if(plantId&&!plantId.includes("/"))return {route:"plants",params:{plantId}};
  return {route:null,params:{},notFound:true};
 }
 if(path==="/service")return {route:"service",params:{}};
 if(path==="/service/new")return {route:"service",params:{newTicket:true}};
 const serviceDetail=path.match(SERVICE_DETAIL_PATH);
 if(serviceDetail){
  let ticketId;
  try{ticketId=decodeURIComponent(serviceDetail[1]);}catch{/* malformed escape */ }
  if(ticketId&&!ticketId.includes("/"))return {route:"service",params:{ticketId}};
  return {route:null,params:{},notFound:true};
 }
 const route=PATH_TO_ROUTE.get(path);
 if(route)return {route,params:{}};
 return {route:null,params:{},notFound:true};
}

// The detail URL is part of the route contract, not page-local state.
export function pathForRoute(route,params={}){
 if(route==="plants"&&params?.plantId)return `/plants/${encodeURIComponent(String(params.plantId))}`;
 if(route==="service"&&params?.newTicket)return "/service/new";
 if(route==="service"&&params?.ticketId)return `/service/${encodeURIComponent(String(params.ticketId))}`;
 if(route==="plants"){
  const search=new URLSearchParams();
  for(const [key,allowed] of Object.entries(PLANT_FILTER_VALUES)){
   if(allowed.has(params?.[key]))search.set(key,params[key]);
  }
  const query=search.toString();
  return query?`/plants?${query}`:"/plants";
 }
 return ROUTE_CATALOG[route]?.path??null;
}

export function displayTitle(route){
 return route==="statistics"?"Statistics (coming soon)":ROUTE_CATALOG[route]?.title||"Home";
}

export function documentTitle(route,params={},resourceName=""){
 if(!route)return "WattDesk · Page not found";
 if(route==="plants"&&params?.plantId)return `WattDesk · ${resourceName||"Plant not found"}`;
 if(route==="service"&&params?.newTicket)return "WattDesk · New ticket";
 if(route==="service"&&params?.ticketId)return `WattDesk · ${resourceName||"Ticket not found"}`;
 return `WattDesk · ${displayTitle(route).replace(" (coming soon)","")}`;
}

// Search stays local until a real index endpoint exists. Pages come from the
// route catalog; sites and people are the design's static examples.
export function buildSearchIndex(){
 return [
  ...Object.entries(ROUTE_CATALOG).filter(([route])=>route!=="statistics").map(([route,definition],index)=>({
   id:`page-${route}`,title:definition.title,group:"Pages",route,iconFile:definition.icon,order:index,
   quickLink:SEARCH_QUICK_LINKS.includes(route)
  })),
  ...["Summit Energy Hub","Eastshore Power Plant","Green Valley Wind Farm","Sunrise Solar Station"].map((title,index)=>({
   id:`site-${index}`,title,group:"Sites",order:index,iconFile:"statistics.svg",comingSoon:true
  })),
  {id:"device-cell",title:"Cell balance",group:"Devices",route:"cell",iconFile:"cell-balance.svg",order:0,quickLink:true},
  {id:"device-module",title:"Module balance",group:"Devices",route:"module",iconFile:"module-balance.svg",order:1},
  {id:"device-track",title:"Device track",group:"Devices",route:"track",iconFile:"device-track.svg",order:2},
  {id:"tool-service",title:"Service ticket",group:"Tools",route:"service",iconFile:"asset-7.svg",order:0},
  {id:"tool-statistics",title:"Statistics",group:"Tools",route:"statistics",iconFile:"statistics.svg",order:1},
  {id:"person-carl",title:"Carl Wang",group:"People",order:0,iconFile:"user.svg",comingSoon:true},
  {id:"org-wattsonic",title:"Wattsonic Technology",group:"People",route:"org",iconFile:"organisation.svg",order:1}
 ];
}
