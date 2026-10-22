// Recently visited history panel. Source: Figma history (14803:7563).
// The material, radius and row anatomy are shared with the shell navigation;
// only the list contents are page-owned.
import {classifyCornerProfile} from "../foundations/geometry.js";
import {menuHeading,menuList,menuRow,mountMenu} from "./menu-popover.js";

const MAX_ITEMS=8;

export function createHistoryPopover({glass,registerPanel,close,onSelect}){
 function open(anchor,entries){
  const panel=document.createElement("div");
  panel.className="wd-history-popover wd-glass--surface wd-glass-popup";
  const list=menuList();
  for(const entry of entries.slice(0,MAX_ITEMS)){
   const row=menuRow(entry.title,{iconFile:entry.iconFile||"asset-5.svg",iconTone:entry.tone||"color"});
   row.classList.add("wd-history-row");
   row.dataset.route=entry.route;
   row.addEventListener("click",()=>{onSelect?.(entry.route);close();});
   list.append(row);
  }
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
