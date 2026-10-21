export function createPopoverController({overlays,toastElement,motion}){
let toastTimer;
function toast(message){const el=toastElement;el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2400)}
function close(immediate=false){
 for(const panel of [...overlays.children]){
  if(panel.contains(document.activeElement))panel._anchor?.focus({preventScroll:true});
  panel._anchor?.setAttribute("aria-expanded","false");motion.closePanel(panel,immediate);
 }
}
function registerPanel(panel,anchor,{width,label,align="start"}={}){
 close(true);
 const previousClose=panel._onClose;
 panel._onClose=()=>{try{previousClose?.();}finally{panel._anchor?.setAttribute("aria-expanded","false");}};
 if(width)panel.style.width=width+"px";
 panel._anchor=anchor;anchor.setAttribute("aria-expanded","true");anchor.setAttribute("aria-controls","home-active-popover");panel.id="home-active-popover";
 panel.setAttribute("role","dialog");panel.setAttribute("aria-label",label||panel.querySelector("h2")?.textContent||"Options");
 panel.style.visibility="hidden";overlays.append(panel);
 const rect=anchor.getBoundingClientRect(),size=panel.getBoundingClientRect();
 const gap=8,edge=12,left=align==="end"?rect.right-size.width:rect.left;
 const top=rect.bottom+gap+size.height>innerHeight-edge&&rect.top-size.height-gap>edge?rect.top-size.height-gap:rect.bottom+gap;
 Object.assign(panel.style,{left:Math.max(edge,Math.min(left,innerWidth-size.width-edge))+"px",top:Math.max(edge,Math.min(top,innerHeight-size.height-edge))+"px",visibility:""});
 motion.openPanel(panel,anchor);return panel;
}
function popover(anchor,content,width=288){
 const panel=document.createElement("div");panel.className="popover";panel.innerHTML=content;
 return registerPanel(panel,anchor,{width,label:panel.querySelector("h2")?.textContent});
}

 // Any pointer press outside an open panel dismisses it, including sidebar
 // rows and other shell controls. Those controls keep their own action; the
 // dismiss is not a nested state that should survive a route change.
 const pointer=e=>{if(overlays.children.length&&!e.target.closest(".popover,.wd-date-picker,.wd-history-popover,.wd-search-panel,.wd-search-fullscreen"))close()};
 const key=e=>{if(e.key==="Escape")close()};
 document.addEventListener("pointerdown",pointer);document.addEventListener("keydown",key);
 return {toast,close,popover,registerPanel,destroy(){close(true);clearTimeout(toastTimer);document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key)}};
}
