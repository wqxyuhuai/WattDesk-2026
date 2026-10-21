// Recently visited history panel. Source: Figma history (14803:7563).
// The material, radius and row anatomy are shared with the shell navigation;
// only the list contents are page-owned.
import {applyTypeStyle} from "../foundations/typography.js";
import {classifyCornerProfile} from "../foundations/geometry.js";
import {iconAsset,isNeutralIconFile} from "./icons.js";

const MAX_ITEMS=8;

function rowIcon(file,tone){
 const icon=document.createElement("span");
 icon.className="target-nav-icon";
 icon.append(iconAsset(file||"asset-5.svg",file?(isNeutralIconFile(file)?"mono":tone||"color"):"mono"));
 return icon;
}

export function createHistoryPopover({glass,registerPanel,close,onSelect}){
 function open(anchor,entries){
  const panel=document.createElement("div");
  panel.className="wd-history-popover wd-glass--surface wd-glass-popup";
  const content=document.createElement("div");
  content.className="wd-history-content";
  const heading=document.createElement("h2");
  heading.className="wd-history-heading";
  heading.textContent="Recently visited";
  applyTypeStyle(heading,"Footnote/Emphasized");
  const list=document.createElement("div");
  list.className="wd-history-list";
  for(const entry of entries.slice(0,MAX_ITEMS)){
   const row=document.createElement("button");
   row.type="button";
   row.className="target-nav wd-history-row";
   row.dataset.route=entry.route;
   row.setAttribute("aria-label",entry.title);
   applyTypeStyle(row,"14/14 medium");
   row.append(rowIcon(entry.iconFile,entry.tone));
   const label=document.createElement("span");
   label.className="wd-history-label";
   label.textContent=entry.title;
   row.append(label);
   row.addEventListener("click",()=>{onSelect?.(entry.route);close();});
   list.append(row);
  }
  content.append(heading,list);
  panel.append(content);
  panel._wdFade=content;
  glass.addSurface({host:panel,radius:30});
  classifyCornerProfile(panel);
  const previousClose=panel._onClose;
  panel._onClose=()=>{try{previousClose?.();}finally{glass.removeSurface(panel);}};
  registerPanel(panel,anchor,{label:"Recently visited",align:"start"});
  return panel;
 }
 return {open,maxItems:MAX_ITEMS};
}
