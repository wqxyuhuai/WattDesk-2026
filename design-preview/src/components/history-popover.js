// Recently visited history panel. Source: Figma history (14803:7563).
// The material, radius and row anatomy are shared with the shell navigation;
// only the list contents are page-owned.
//
// Icon rule (do not regress): every row clones the sidebar's own
// `.target-nav[data-route] .target-icon-art`. Plants must stay amber, Service
// ticket blue, and neutral exports the same grey as the sidebar. Never add a
// file-to-tone map or a `route === "home"` colour special case here; that is
// what previously flattened the whole list to one grey. After the clone the
// popover still runs `prepareIconMasks()` because it is built after first
// paint and needs the same opaque mask the sidebar got on load.
import {classifyCornerProfile} from "../foundations/geometry.js";
import {prepareIconMasks} from "./control-states.js";
import {menuHeading,menuList,menuRow,mountMenu} from "./menu-popover.js";

const MAX_ITEMS=8;

// History rows reuse the sidebar's own glyph for the route, so Plants stays
// amber, cell balance stays neutral and Home keeps its mono mask without a
// second icon table drifting from the navigation.
function sidebarRouteIcon(route){
 const icon=document.querySelector(`.target-sidebar .target-nav[data-route="${route}"] .target-icon-art`);
 return icon?.cloneNode(true)??null;
}

export function createHistoryPopover({glass,registerPanel,close,onSelect}){
 async function open(anchor,entries){
  const panel=document.createElement("div");
  panel.className="wd-history-popover wd-glass--surface wd-glass-popup";
  const list=menuList();
  for(const entry of entries.slice(0,MAX_ITEMS)){
   const row=menuRow(entry.title,{iconFile:entry.iconFile||"asset-5.svg",iconTone:"color",iconNode:sidebarRouteIcon(entry.route)});
   row.classList.add("wd-history-row");
   row.dataset.route=entry.route;
   row.addEventListener("click",()=>{onSelect?.(entry.route);close();});
   list.append(row);
  }
  // The sidebar's route icons get their opaque inline masks on first paint.
  // A popover is created later, so normalise its copies before mounting to keep
  // the exact same glyph and hover ink instead of the raw export's baked alpha.
  await prepareIconMasks(list);
  mountMenu(panel,{label:"Recently visited",children:[menuHeading("Recently visited"),list]});
  glass.addSurface({host:panel,radius:30});
  classifyCornerProfile(panel);
  const previousClose=panel._onClose;
  panel._onClose=()=>{try{previousClose?.();}finally{glass.removeSurface(panel);}};
  registerPanel(panel,anchor,{label:"Recently visited",align:"start"});
  return panel;
 }
 return {open,maxItems:MAX_ITEMS};
}
