export function createPopoverController({overlays,toastElement,motion,glass}){
 let toastTimer;
 let repositionFrame=0;
 // Only panels registered here follow their anchor. Search and other
 // full-surface overlays manage their own placement.
 const openPanels=new Set();
 // Every floating surface shares the reviewed Glass Surface branch. A panel
 // that already mounted its own material (date picker, history, search) is left
 // alone, so opening it cannot stack a second backdrop or ResizeObserver.
 function ensureSurface(panel,{radius=18,interactive=false}={}){
  if(!glass||!panel)return null;
  if(panel.classList.contains("wd-glass")||panel.querySelector(":scope>.wd-glass-material"))return null;
  panel.classList.add("wd-glass--surface","wd-glass-popup");
  glass.addSurface({host:panel,radius,interactive});
  return panel;
 }
 function releaseSurface(panel){
  if(!glass||!panel)return;
  if(!panel.classList.contains("wd-glass"))return;
  glass.removeSurface(panel);
 }
 // Tooltips and toasts are display-only: they keep the material and the pointer
 // optics, but must not inherit a click/lift affordance from the shared host.
 function prepareStaticSurface(el,radius){
  if(!el)return;
  el.classList.add("wd-glass--surface","wd-glass-popup");
  ensureSurface(el,{radius});
 }
 function toast(message){
  const el=toastElement;prepareStaticSurface(el,24);
  // The material is a child; replacing textContent would delete it. Keep the
  // message in its own node so repeated toasts reuse the mounted surface.
  let text=el.querySelector(":scope>.wd-toast-text");
  if(!text){text=document.createElement("span");text.className="wd-toast-text";el.append(text);}
  text.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2400)
 }
 function close(immediate=false){
  for(const panel of [...overlays.children]){
   openPanels.delete(panel);
   if(panel.contains(document.activeElement))panel._anchor?.focus({preventScroll:true});
   panel._anchor?.setAttribute("aria-expanded","false");motion.closePanel(panel,immediate);
  }
  if(!openPanels.size&&repositionFrame){cancelAnimationFrame(repositionFrame);repositionFrame=0;}
 }
 // The viewport-fixed layer must be re-measured, not cached: a nested scroll
 // container changes the anchor's viewport rect while its own event does not
 // bubble. The same placement contract is used on open and on every update.
 function placePanel(panel){
  const anchor=panel._anchor;
  if(!anchor?.isConnected||!panel.isConnected)return false;
  const rect=anchor.getBoundingClientRect();
  // Use laid-out size, not the current visual rect: the open/close animation
  // scales the host and must not make the flip point drift by a few pixels.
  const width=panel.offsetWidth,height=panel.offsetHeight;
  const gap=8,edge=12,left=panel._align==="end"?rect.right-width:rect.left;
  const top=rect.bottom+gap+height>innerHeight-edge&&rect.top-height-gap>edge?rect.top-height-gap:rect.bottom+gap;
  panel.style.left=Math.max(edge,Math.min(left,innerWidth-width-edge))+"px";
  panel.style.top=Math.max(edge,Math.min(top,innerHeight-height-edge))+"px";
  // Scrolling the trigger out of view ends the popover's context. Require most
  // of the trigger to remain visible: a few clipped pixels are not a usable
  // anchor, and following them would clamp an orphaned panel to the viewport
  // edge. Dismiss once it is mostly outside; keep following while usable.
  const visibleWidth=Math.min(rect.right,innerWidth)-Math.max(rect.left,0);
  const visibleHeight=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0);
  const visibleArea=Math.max(0,visibleWidth)*Math.max(0,visibleHeight);
  return rect.width>0&&rect.height>0&&visibleArea>=rect.width*rect.height*.5&&rect.bottom>0&&rect.top<innerHeight;
 }
 function reposition(){
  if(repositionFrame||!openPanels.size)return;
  repositionFrame=requestAnimationFrame(()=>{
   repositionFrame=0;
   for(const panel of [...openPanels]){
    if(!panel.isConnected||!placePanel(panel)){
     openPanels.delete(panel);
     panel._anchor?.setAttribute("aria-expanded","false");
     if(panel.isConnected)motion.closePanel(panel);
    }
   }
  });
 }
 function registerPanel(panel,anchor,{width,label,align="start",radius=18}={}){
  close(true);
  ensureSurface(panel,{radius});
  const previousClose=panel._onClose;
  panel._onClose=()=>{openPanels.delete(panel);try{previousClose?.();}finally{releaseSurface(panel);panel._anchor?.setAttribute("aria-expanded","false");}};
  if(width)panel.style.width=width+"px";
  panel._anchor=anchor;panel._align=align;openPanels.add(panel);anchor.setAttribute("aria-expanded","true");anchor.setAttribute("aria-controls","home-active-popover");panel.id="home-active-popover";
  panel.setAttribute("role","dialog");panel.setAttribute("aria-label",label||panel.querySelector("h2")?.textContent||"Options");
  panel.style.visibility="hidden";overlays.append(panel);
  placePanel(panel);
  panel.style.visibility="";
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
 const onViewportChange=()=>reposition();
 const scrollOptions={capture:true,passive:true};
 document.addEventListener("pointerdown",pointer);document.addEventListener("keydown",key);
 // Scroll events from nested work areas do not bubble; capture is required so
 // every open menu, date chooser and history panel tracks its own trigger.
 document.addEventListener("scroll",onViewportChange,scrollOptions);
 addEventListener("resize",onViewportChange);
 visualViewport?.addEventListener("resize",onViewportChange);
 visualViewport?.addEventListener("scroll",onViewportChange);
 return {toast,close,popover,registerPanel,prepareStaticSurface,reposition,
  destroy(){close(true);cancelAnimationFrame(repositionFrame);repositionFrame=0;clearTimeout(toastTimer);openPanels.clear();
   document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key);
   document.removeEventListener("scroll",onViewportChange,scrollOptions);removeEventListener("resize",onViewportChange);
  visualViewport?.removeEventListener("resize",onViewportChange);visualViewport?.removeEventListener("scroll",onViewportChange)}};
}
