import {applyTypeStyle} from "../foundations/typography.js";
import {assetURL,isNeutralIconFile,opaqueMaskURL} from "./icons.js";
import {motionDuration,motionEasing} from "../foundations/motion.js";

// Shared fallback for routes that have no real surface yet. It remains a
// sibling of page content, so future content can replace it without a layout
// fork. Icons keep their source artwork; neutral exports use an opaque mask.
export function createEmptyState({iconFile=null,label="Coming soon",className=""}={}){
 const element=document.createElement("div");
 element.className=`wd-empty-state ${className}`.trim();
 const icon=document.createElement("span");
 icon.className="wd-empty-state-icon";
 const copy=document.createElement("p");
 copy.className="wd-empty-state-label";
 applyTypeStyle(copy,"Footnote/Regular");
 element.append(icon,copy);

 function update({iconFile:file=iconFile,label:text=label}={}){
  iconFile=file;label=text;
  icon.replaceChildren();
  icon.hidden=!iconFile;
  if(iconFile){
   const neutral=isNeutralIconFile(iconFile);
   icon.classList.toggle("is-neutral-icon",neutral);
   icon.style.setProperty("--icon-mask",`url("${neutral?opaqueMaskURL(iconFile):assetURL(iconFile)}")`);
   const image=document.createElement("img");
   image.src=assetURL(iconFile);image.alt="";image.draggable=false;
   icon.append(image);
  }
  copy.textContent=label;
  return element;
 }

 function play(){
  element.getAnimations().forEach(animation=>animation.cancel());
  if(!element.isConnected)return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  element.animate(
   [{opacity:0,translate:"0 4px"},{opacity:1,translate:"0 0"}],
   {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel")}
  ).finished.catch(()=>{});
 }

 update({iconFile,label});
 return {element,update,play};
}
