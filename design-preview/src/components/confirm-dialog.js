import {createTextElement as text} from "../foundations/dom.js";
import {createStandardButton} from "./controls.js";
import {createModalDialog} from "./modal-dialog.js";

export function createConfirmDialog({
 glass,
 title,
 description,
 confirmLabel="Confirm",
 confirmVariant="neutral",
 cancelLabel="Cancel",
 showCancel=true,
 icon=null,
 danger=true,
 confirmClassName="",
 onConfirm,
 onCancel,
 onClose,
 restoreFocus=true
}){
 const content=text("div","plants-device-dialog-form");
 const body=text("div","plants-device-confirm-dialog");
 const intro=text("div","plants-device-confirm-intro");
 if(icon){
  const mark=text("span",`plants-device-confirm-mark${danger?" is-danger":""}`);
  mark.append(icon);
  intro.append(mark);
 }
 intro.append(
  text("h2","plants-device-confirm-title",title,"Subheadline/Emphasized"),
  text("p","plants-device-confirm-description",description,"Footnote/Regular")
 );
 const actions=text("div","plants-device-confirm-actions");
 actions.classList.toggle("is-single-action",!showCancel);
 const cancel=showCancel?createStandardButton({label:cancelLabel}):null;
 const resolvedConfirmVariant=confirmVariant==="neutral"&&danger?"danger-solid":confirmVariant;
 const confirm=createStandardButton({label:confirmLabel,variant:resolvedConfirmVariant,className:confirmClassName});
 if(cancel)actions.append(cancel);
 actions.append(confirm);
 body.append(intro,actions);
 content.append(body);
 const modal=createModalDialog({
  glass,
  title,
  className:"plants-device-dialog--confirm",
  showHeader:false,
  showClose:false,
  content,
  restoreFocus,
  onClose
 });
 if(cancel)modal.registerSurface(cancel,18);
 modal.registerSurface(confirm,18);
 cancel?.addEventListener("click",()=>{
  modal.close();
  onCancel?.();
 });
 confirm.addEventListener("click",()=>{
  modal.close();
  onConfirm?.();
 });
 return modal;
}
