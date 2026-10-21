export function button(label, className="wd-button", content=""){
 const b=document.createElement("button");b.type="button";b.className=`wd-control-state ${className}`;b.setAttribute("aria-label",label);b.title=label;b.innerHTML=content;return b;
}

// Upgrade imported design markup with the same keyboard and disabled contract.
export function enhanceControl(el,{label,onActivate}){
 el.classList.add("clickable","wd-control-state");el.setAttribute("role","button");el.setAttribute("aria-label",label);el.tabIndex=0;
 const activate=e=>{if(el.matches(':disabled,[aria-disabled="true"]')){e.preventDefault();return;}onActivate(e)};
 const keydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(e)}};
 el.addEventListener("click",activate);el.addEventListener("keydown",keydown);
 return ()=>{el.removeEventListener("click",activate);el.removeEventListener("keydown",keydown)};
}
