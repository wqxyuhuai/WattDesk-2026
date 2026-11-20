import {createTextElement as text} from "../foundations/dom.js";
import {modalOverlayEnterDuration,modalOverlayExitDuration,reducedMotion} from "../foundations/motion.js";
import {createStandardButton} from "./controls.js";

const activeDialogs=[];

export function closeActiveDialog({immediate=true,restoreFocus=false}={}){
 for(const modal of [...activeDialogs].reverse()){
  modal.close({immediate,restoreFocus:false});
 }
}

export function createModalDialog({
 glass,
 title,
 description="",
 className="",
 titleIcon=null,
 showHeader=true,
 showClose=true,
 closeIcon=null,
 closeOnBackdrop=true,
 closeOnEscape=true,
 panelMaterial=true,
 content,
 restoreFocus=true,
 onClose=null
}){
 const parentDialog=activeDialogs.at(-1);
 if(parentDialog?.dialog)parentDialog.dialog.inert=true;
 const previousFocus=document.activeElement;
 const layer=text("div","plants-device-modal wd-modal-fullscreen");
 const backdrop=text("div","wd-modal-backdrop");
 backdrop.setAttribute("aria-hidden","true");
 const dialog=text("section",[
  "plants-device-dialog",
  "wd-modal-panel",
  panelMaterial?"wd-glass--surface wd-glass-popup":"",
  className
 ].filter(Boolean).join(" "));
 const frame=text("div","plants-device-dialog-frame wd-modal-panel-frame");
 dialog._wdFade=frame;
 dialog.setAttribute("role","dialog");
 dialog.setAttribute("aria-modal","true");
 dialog.setAttribute("aria-label",title);
 const headingId=`modal-dialog-${Math.random().toString(36).slice(2)}`;
 dialog.setAttribute("aria-labelledby",headingId);
 const titleNode=text("h2","plants-device-dialog-title",title,"Subheadline/Emphasized");
 titleNode.id=headingId;
 let closeButton=null;
 if(showHeader){
  const head=text("header","plants-device-dialog-head");
  const titleRow=text("div","plants-device-dialog-title-row");
  const headingCopy=text("div","plants-device-dialog-heading");
  headingCopy.append(titleNode);
  if(description)headingCopy.append(text("p","plants-device-dialog-description",description,"Footnote/Regular"));
  if(titleIcon)titleRow.append(titleIcon);
  titleRow.append(headingCopy);
  if(showClose){
   closeButton=createStandardButton({
    label:"Close",
    iconOnly:true,
    className:"plants-device-dialog-close",
    icon:closeIcon
   });
  }
  head.append(titleRow,...(closeButton?[closeButton]:[]));
  frame.append(head,content);
 }else{
  dialog.removeAttribute("aria-labelledby");
  frame.append(content);
 }
 dialog.append(frame);
 layer.append(backdrop,dialog);
 document.body.append(layer);
 if(panelMaterial)glass?.addSurface({host:dialog,radius:30});
 if(closeButton)glass?.addSurface({host:closeButton,radius:18});

 let closed=false;
 let closing=false;
 const surfaceHosts=[...(panelMaterial?[dialog]:[]),...(closeButton?[closeButton]:[])];
 function registerSurface(host,radius=18,options={}){
  if(!host)return;
  glass?.addSurface({host,radius,...options});
  surfaceHosts.push(host);
 }
 function release(){
  if(closed)return;
  closed=true;
  const index=activeDialogs.findIndex(item=>item.layer===layer);
  if(index>=0)activeDialogs.splice(index,1);
  if(parentDialog?.dialog?.isConnected)parentDialog.dialog.inert=false;
  try{onClose?.();}catch{}
  for(const host of surfaceHosts)glass?.removeSurface(host);
  layer.remove();
  if(restoreFocus&&previousFocus instanceof HTMLElement&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
 }
 function close({immediate=false,restoreFocus:shouldRestore=restoreFocus}={}){
  if(closed||(closing&&!immediate))return;
  closing=true;
  layer.inert=true;
  if(immediate||reducedMotion()){
   if(!shouldRestore)restoreFocus=false;
   release();
   return;
  }
  if(!shouldRestore)restoreFocus=false;
  layer.removeAttribute("data-entering");
  layer.dataset.closing="true";
  setTimeout(release,modalOverlayExitDuration());
 }
 closeButton?.addEventListener("click",()=>close());
 layer.addEventListener("pointerdown",event=>{
  if((event.target===layer||event.target===backdrop)&&closeOnBackdrop)close();
 });
 layer.addEventListener("keydown",event=>{
  if(event.key==="Escape"){
   if(!closeOnEscape)return;
   if(document.querySelector("#overlays .popover"))return;
   event.preventDefault();
   event.stopPropagation();
   close();
   return;
  }
  if(event.key!=="Tab")return;
  const focusable=[...dialog.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex='0']")]
   .filter(element=>element.getClientRects().length);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){
   event.preventDefault();
   last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
   event.preventDefault();
   first.focus();
  }
 });
 if(!reducedMotion()){
  layer.dataset.entering="";
  setTimeout(()=>{
   if(layer.isConnected&&!layer.dataset.closing)layer.dataset.entered="";
  },modalOverlayEnterDuration());
 }
 const firstTarget=dialog.querySelector("[autofocus],input:not(:disabled),button:not(.plants-device-dialog-close)");
 requestAnimationFrame(()=>firstTarget?.focus({preventScroll:true}));
 const controller={layer,dialog,close,registerSurface};
 activeDialogs.push(controller);
 return controller;
}
