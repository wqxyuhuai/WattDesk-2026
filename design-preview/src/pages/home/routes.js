// Single source of truth for the routes the shell can show. Adding a page
// means one entry here plus a page module under ../<route>/.
export const ROUTE_CATALOG={
 home:{title:"Home",icon:null},
 plants:{title:"Plants",icon:"asset-6.svg"},
 service:{title:"Service ticket",icon:"asset-7.svg"},
 statistics:{title:"Statistics",icon:"statistics.svg"},
 cell:{title:"Cell balance",icon:"cell-balance.svg"},
 module:{title:"Module balance",icon:"module-balance.svg"},
 track:{title:"Device track",icon:"device-track.svg"},
 org:{title:"Wattsonic Technology",icon:"organisation.svg"},
 "your-teams":{title:"Your teams",icon:"teams.svg"},
 "end-users":{title:"End users",icon:"user.svg"}
};
export const SEARCH_QUICK_LINKS=["home","plants","service","track"];
export function displayTitle(route){
 return route==="statistics"?"Statistics (coming soon)":ROUTE_CATALOG[route]?.title||"Home";
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
