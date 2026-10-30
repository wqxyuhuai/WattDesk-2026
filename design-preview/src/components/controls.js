import {createTextElement} from "../foundations/dom.js";

export function button(label, className="wd-button", content=""){
 const b=document.createElement("button");b.type="button";b.className=`wd-control-state ${className}`;b.setAttribute("aria-label",label);b.title=label;b.innerHTML=content;return b;
}

// Standard button anatomy shared by panels and pages. Material registration
// stays with the caller because the page owns the glass instance lifecycle.
export function createStandardButton({
 label,
 variant="neutral",
 className="",
 icon=null,
 iconOnly=false,
 typeStyle="Footnote/Medium"
}){
 const classes=[
  "wd-button",
  "wd-button--pill",
  `wd-button--${variant}`,
  iconOnly?"wd-button--disc":"",
  className
 ].filter(Boolean).join(" ");
 const node=button(label,classes);
 if(icon)node.append(icon);
 if(!iconOnly)node.append(createTextElement("span","wd-control-label",label,typeStyle));
 return node;
}

// Upgrade imported design markup with the same keyboard and disabled contract.
export function enhanceControl(el,{label,onActivate}){
 el.classList.add("clickable","wd-control-state");el.setAttribute("role","button");el.setAttribute("aria-label",label);el.tabIndex=0;
 const activate=e=>{if(el.matches(':disabled,[aria-disabled="true"]')){e.preventDefault();return;}onActivate(e)};
 const keydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(e)}};
 el.addEventListener("click",activate);el.addEventListener("keydown",keydown);
 return ()=>{el.removeEventListener("click",activate);el.removeEventListener("keydown",keydown)};
}
