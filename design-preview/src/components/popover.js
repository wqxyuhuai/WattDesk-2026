import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";

export function createPopoverController({overlays,toastElement,motion,glass}){
 let toastHideTimer;
 let toastEnterAnimation;
 let toastExitAnimation;
 let toastToken=0;
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
 function hideToast(token){
  if(token!==toastToken)return;
  toastEnterAnimation?.cancel();
  toastEnterAnimation=null;
  if(reducedMotion()){
   toastElement.hidden=true;
   return;
  }
  const animation=toastElement.animate(
   [{opacity:1,translate:"0 0"},{opacity:0,translate:"0 -4px"}],
   {duration:motionDuration("--wd-motion-panel-exit"),easing:motionEasing("--wd-ease-hover-out"),fill:"forwards"}
  );
  toastExitAnimation=animation;
  animation.finished.then(()=>{
   if(token!==toastToken)return;
   toastElement.hidden=true;
   animation.cancel();
   toastExitAnimation=null;
  }).catch(()=>{
   if(token===toastToken)toastExitAnimation=null;
  });
 }
 function toast(message){
  const el=toastElement;prepareStaticSurface(el,24);
  // The material is a child; replacing textContent would delete it. Keep the
  // message in its own node so repeated toasts reuse the mounted surface.
  let text=el.querySelector(":scope>.wd-toast-text");
  if(!text){text=document.createElement("span");text.className="wd-toast-text";el.append(text);}
  const token=++toastToken;
  const wasHidden=el.hidden;
  const currentOpacity=wasHidden?0:Number.parseFloat(getComputedStyle(el).opacity)||0;
  const currentTranslate=wasHidden?"0 -4px":getComputedStyle(el).translate||"0 0";
  clearTimeout(toastHideTimer);
  toastEnterAnimation?.cancel();
  toastExitAnimation?.cancel();
  toastEnterAnimation=null;
  toastExitAnimation=null;
  text.textContent=message;
  el.hidden=false;
  if(!reducedMotion()&&currentOpacity<1){
   const animation=el.animate(
    [{opacity:currentOpacity,translate:currentTranslate},{opacity:1,translate:"0 0"}],
    {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel")}
   );
   toastEnterAnimation=animation;
   animation.finished.catch(()=>{}).finally(()=>{
    if(toastEnterAnimation===animation)toastEnterAnimation=null;
   });
  }
  toastHideTimer=setTimeout(()=>hideToast(token),2400);
 }
 function close(immediate=false){
  for(const panel of [...overlays.children]){
   openPanels.delete(panel);
   if(panel.contains(document.activeElement))panel._anchor?.focus({preventScroll:true});
   panel._anchor?.setAttribute("aria-expanded","false");motion.closePanel(panel,immediate);
  }
  if(!openPanels.size&&repositionFrame){cancelAnimationFrame(repositionFrame);repositionFrame=0;}
 }
 // A glass trigger scales around its physical centre. Use its layout box for
 // placement so moving the pointer into the panel cannot shift the open panel
 // when the trigger returns from its 1.07 hover scale to 1.
 function layoutRect(element){
  const visual=element.getBoundingClientRect();
  const width=element.offsetWidth||visual.width,height=element.offsetHeight||visual.height;
  const left=visual.left+(visual.width-width)/2;
  const top=visual.top+(visual.height-height)/2;
  return {left,top,right:left+width,bottom:top+height,width,height};
 }
 // The viewport-fixed layer must be re-measured, not cached: a nested scroll
 // container changes the anchor's viewport rect while its own event does not
 // bubble. The same placement contract is used on open and on every update.
 function placePanel(panel){
  const anchor=panel._anchor;
  if(!anchor?.isConnected||!panel.isConnected)return false;
  // A page may align a panel to a sibling action (for example, making the
  // filter menu share the visibility menu's right edge) while retaining the
  // actual trigger as the accessible anchor.
  const alignAnchor=panel._alignAnchor?.isConnected?panel._alignAnchor:anchor;
  const rect=layoutRect(alignAnchor);
  const visibilityRect=layoutRect(anchor);
  // Use laid-out size, not the current visual rect: the open/close animation
  // scales the host and must not make the flip point drift by a few pixels.
  const width=panel.offsetWidth,height=panel.offsetHeight;
  const gap=8,edge=12;
  let left=panel._align==="end"?rect.right-width:rect.left;
  let top=rect.bottom+gap+height>innerHeight-edge&&rect.top-height-gap>edge?rect.top-height-gap:rect.bottom+gap;
  if(panel._placement==="side"){
   // Secondary menus attach to the row they describe. Prefer the side with
   // more space so a filter panel at the right edge opens left, as in the
   // reference, while the same component still works on the left half.
   const ownerElement=anchor.closest(".popover");
   const owner=ownerElement?layoutRect(ownerElement):rect;
   const ahead=owner.left+owner.width/2>innerWidth/2;
   // Side panels overlap the primary surface's inner padding without covering
   // the category icons, so the two layers read as one attached flyout.
   const sideOverlap=12;
   left=ahead?owner.left-width+sideOverlap:owner.right-sideOverlap;
   const sideTopOffset=typeof panel._sideTopOffset==="function"?panel._sideTopOffset():panel._sideTopOffset||0;
   top=rect.top-sideTopOffset;
  }
  const alignRight=typeof panel._alignRight==="function"?panel._alignRight():panel._alignRight;
  if(panel._placement!=="side"&&Number.isFinite(alignRight))left=alignRight-width;
  if(!panel._pinPosition||!panel._hasPosition){
   panel.style.left=Math.max(edge,Math.min(left,innerWidth-width-edge))+"px";
   panel.style.top=Math.max(edge,Math.min(top,innerHeight-height-edge))+"px";
   panel._hasPosition=true;
  }
  // Scrolling the trigger out of view ends the popover's context. Require most
  // of the trigger to remain visible: a few clipped pixels are not a usable
  // anchor, and following them would clamp an orphaned panel to the viewport
  // edge. Dismiss once it is mostly outside; keep following while usable.
  const visibleWidth=Math.min(visibilityRect.right,innerWidth)-Math.max(visibilityRect.left,0);
  const visibleHeight=Math.min(visibilityRect.bottom,innerHeight)-Math.max(visibilityRect.top,0);
  const visibleArea=Math.max(0,visibleWidth)*Math.max(0,visibleHeight);
  return visibilityRect.width>0&&visibilityRect.height>0&&
   visibleArea>=visibilityRect.width*visibilityRect.height*.5&&
   visibilityRect.bottom>0&&visibilityRect.top<innerHeight;
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
 function registerPanel(panel,anchor,{width,label,align="start",alignAnchor=null,alignRight=null,radius=18,placement="vertical",keepOpen=false,pinPosition=false,sideTopOffset=0,id="home-active-popover"}={}){
  if(!keepOpen)close(true);
  ensureSurface(panel,{radius});
  const previousClose=panel._onClose;
  panel._onClose=()=>{openPanels.delete(panel);try{previousClose?.();}finally{releaseSurface(panel);panel._anchor?.setAttribute("aria-expanded","false");}};
  if(width)panel.style.width=width+"px";
  panel._anchor=anchor;panel._align=align;panel._alignAnchor=alignAnchor;panel._alignRight=alignRight;panel._placement=placement;panel._pinPosition=pinPosition;panel._sideTopOffset=sideTopOffset;openPanels.add(panel);
  anchor.setAttribute("aria-expanded","true");anchor.setAttribute("aria-controls",id);panel.id=id;
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
 const pointer=e=>{
  // A trigger owns its open/closed decision on click. Let that click handler
  // close its own panel instead of dismissing on pointerdown and immediately
  // reopening it when the click arrives.
  const belongsToOpenAnchor=[...openPanels].some(panel=>panel._anchor===e.target||panel._anchor?.contains(e.target));
  if(overlays.children.length&&!belongsToOpenAnchor&&!e.target.closest(".popover,.wd-date-picker,.wd-history-popover,.wd-search-panel,.wd-search-fullscreen"))close();
 };
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
  destroy(){close(true);cancelAnimationFrame(repositionFrame);repositionFrame=0;clearTimeout(toastHideTimer);toastEnterAnimation?.cancel();toastExitAnimation?.cancel();openPanels.clear();
   document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key);
   document.removeEventListener("scroll",onViewportChange,scrollOptions);removeEventListener("resize",onViewportChange);
  visualViewport?.removeEventListener("resize",onViewportChange);visualViewport?.removeEventListener("scroll",onViewportChange)}};
}
