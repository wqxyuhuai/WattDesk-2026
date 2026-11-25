import {createTextElement as text} from "../foundations/dom.js";

/**
 * Shared hover/focus information panel used by Inverter settings. The caller
 * owns panel registration and cleanup; this helper owns the open/leave intent
 * delay and optional copy activation.
 */
export function createHoverPanelBinder({registerPanel,closePanels,addDisposer=()=>{}}={}){
 return function bindHoverPanel(anchor,message,label,width=null,{align="start",onActivate=null}={}){
  if(!registerPanel)return ()=>{};
  let panel=null;
  let closeTimer=0;
  let disposed=false;
  const close=()=>{
   clearTimeout(closeTimer);
   closeTimer=0;
   const active=panel;
   panel=null;
   if(active?.isConnected){
    active._onClose?.();
    active.remove();
   }
  };
  const scheduleClose=()=>{
   clearTimeout(closeTimer);
   closeTimer=setTimeout(close,120);
  };
  const cancelClose=()=>{
   clearTimeout(closeTimer);
   closeTimer=0;
  };
  const open=()=>{
   if(disposed)return;
   cancelClose();
   closePanels?.(true);
   panel=text("div","popover isw-hover-popover",onActivate?undefined:message,"Footnote/Medium");
   if(onActivate){
    const body=text("button","isw-hover-copy",message,"Footnote/Medium");
    body.type="button";
    body.setAttribute("aria-label",`Copy ${message}`);
    body.addEventListener("click",()=>void onActivate());
    panel.append(body);
   }
   panel.style.width=width?`${width}px`:"max-content";
   panel.style.maxWidth="min(280px,calc(100vw - 24px))";
   panel.addEventListener("pointerenter",cancelClose);
   panel.addEventListener("pointerleave",scheduleClose);
   panel.addEventListener("focusin",cancelClose);
   panel.addEventListener("focusout",event=>{
    if(!panel?.contains(event.relatedTarget))scheduleClose();
   });
   panel=registerPanel(panel,anchor,{label,width,align,radius:18});
   anchor.setAttribute("aria-describedby",panel.id);
  };
  anchor.addEventListener("pointerenter",open);
  anchor.addEventListener("pointerleave",scheduleClose);
  anchor.addEventListener("focus",open);
  anchor.addEventListener("blur",scheduleClose);
  addDisposer(()=>{
   disposed=true;
   close();
   anchor.removeAttribute("aria-describedby");
  });
  return close;
 };
}
