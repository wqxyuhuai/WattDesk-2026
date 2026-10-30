// Shared interiors for every text menu on the shell. The panel geometry and
// Glass Surface stay with the popover host; this module only builds the
// heading/list anatomy defined in popover.css.
import {applyTypeStyle} from "../foundations/typography.js";
import {iconAsset} from "./icons.js";

export function menuHeading(text){
 const heading=document.createElement("h2");
 heading.className="wd-menu-heading";
 heading.textContent=text;
 applyTypeStyle(heading,"Footnote/Emphasized");
 return heading;
}

export function menuList(){
 const list=document.createElement("div");
 list.className="wd-menu-list";
 return list;
}

// `iconNode` lets a caller hand in an icon that already exists elsewhere in the
// shell (the history panel clones the sidebar glyph). Keep the tone verbatim in
// that path: do not re-derive mono/colour from the filename, or neutral exports
// silently lose their shared hover mask.
export function menuRow(label,{iconFile,iconTone="mono",iconNode,checked=false,onSelect}={}){
 const row=document.createElement("button");
 row.type="button";
 row.className="wd-menu-row";
 row.setAttribute("aria-label",label);
 applyTypeStyle(row,"14/14 medium");
 if(checked)row.setAttribute("aria-checked","true");
 row.setAttribute("role",checked?"menuitemradio":"menuitem");
 if(iconFile||iconNode)row.append(menuIcon(iconFile,iconTone,iconNode));
 const text=document.createElement("span");
 text.className="wd-menu-label";
 text.textContent=label;
 row.append(text);
 const check=document.createElement("span");
 check.className="wd-menu-check";
 check.setAttribute("aria-hidden","true");
 row.append(check);
 if(onSelect)row.addEventListener("click",()=>onSelect(row));
 return row;
}

export function menuNote(text){
 const note=document.createElement("p");
 note.className="wd-menu-note";
 note.textContent=text;
 applyTypeStyle(note,"14/14 medium");
 return note;
}

function menuIcon(file,tone,node){
 const icon=document.createElement("span");
 icon.className="target-nav-icon";
 icon.append(node??iconAsset(file,tone));
 return icon;
}

export function mountMenu(panel,{label,children}){
 const content=document.createElement("div");
 content.className="wd-menu";
 content.setAttribute("role","menu");
 content.setAttribute("aria-label",label);
 content.append(...children);
  if(!content.querySelector(".wd-menu-heading"))content.classList.add("wd-menu--no-heading");
 panel.append(content);
 panel._wdFade=content;
 return content;
}
