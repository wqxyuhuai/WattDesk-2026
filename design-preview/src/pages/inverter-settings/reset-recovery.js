import {createTextElement as text} from "../../foundations/dom.js";
import {animateContentHeight,reducedMotion} from "../../foundations/motion.js";
import {createStandardButton} from "../../components/controls.js";
import {createConfirmDialog} from "../../components/confirm-dialog.js";
import {assetURL,createMaskedIcon,opaqueMaskURL,SETTINGS_ICON_FILES} from "../../components/icons.js";
import {createModalDialog} from "../../components/modal-dialog.js";

const RESET_ACTIONS=Object.freeze({
 operation:{
  id:"operation",
  point:"Reset_operation",
  label:"Operation Settings Recovery",
  summary:"Operational settings, RTC and display password",
  title:"This action restores operational settings to their default values.",
  confirmTitle:"Are you sure to reset all operation settings?",
  reset:[
   "All operational settings",
   "Time and timezone settings (RTC)",
   "Display password"
  ],
  unaffected:[
   "Network settings",
   "Safety-locked parameters and grid protection settings",
   "Energy statistics and operational data",
   "Fault logs, event records, and diagnostic data"
  ]
 },
 grid:{
  id:"grid",
  point:"Reset_gridparameters",
  label:"Safety-Locked Parameters Recovery",
  summary:"Grid protection, safety locks and initialization flags",
  title:"This action restores safety-locked parameters and system initialization settings.",
  confirmTitle:"Are you sure to reset all safety-locked parameters?",
  reset:[
   "Safety-locked parameters",
   "Grid code and grid protection parameters",
   "System initialization flags (Parameter Setup Wizard)"
  ],
  unaffected:[
   "Operational settings",
   "Network settings",
   "Energy statistics and operational data",
   "Fault logs, event records, and diagnostic data"
  ]
 },
 network:{
  id:"network",
  point:"Reset_network",
  label:"Network Recovery",
  summary:"Hotspot credentials, IP configuration and cloud connectivity",
  title:"This action clears all network configurations. The inverter will be offline and must be connected to the network again to restore cloud access.",
  confirmTitle:"Are you sure to reset all network settings?",
  reset:[
   "Wi-Fi hotspot name (SSID) and password",
   "IP configuration and related network settings"
  ],
  unaffected:[
   "Operational settings",
   "Safety-locked parameters and grid protection settings",
   "Energy statistics and operational data",
   "Fault logs, event records, and diagnostic data"
  ]
 },
 all:{
  id:"all",
  point:"Reset_allcustomersettings",
  label:"Clear all settings & reset setup",
  summary:"Restore every customer setting and return the inverter to initial setup",
  title:"This action will reset all settings and clear all data on this device. The system will return to its initial setup state.",
  confirmTitle:"Are you sure to reset all data?",
  reset:[
   "Setting parameters",
   "Time and timezone settings (RTC)",
   "Display password",
   "Network settings",
   "Safety-locked parameters"
  ],
  unaffected:[]
 }
});

function chevron(){
 return createMaskedIcon(opaqueMaskURL("asset-14.svg"),"isw-reset-chevron");
}

function warningIcon(){
 return createMaskedIcon(opaqueMaskURL("light/imgBoldEssentionalUiDanger.svg"),"isw-reset-warning-glyph");
}

function resetTitleIcon(){
 const host=text("span","plants-device-dialog-title-icon isw-reset-title-icon");
 host.append(createMaskedIcon(assetURL(SETTINGS_ICON_FILES.resetRecovery),"plants-device-dialog-title-glyph"));
 return host;
}

export function openResetRecovery({glass,notify,onComplete}={}){
 const root=text("div","isw-reset-recovery");
 let modal=null;
 let stage="landing";
 let transitionVersion=0;
 let completionTimer=0;
 let disposed=false;

 const addButton=(host,{label,variant="neutral",action})=>{
  const button=createStandardButton({label,variant});
  button.dataset.iswResetAction=action;
  if(modal)modal.registerSurface(button,18);
  host.append(button);
  return button;
 };

 const renderChoice=(host,action)=>{
  const button=text("button","isw-reset-choice wd-control-state");
  button.type="button";
  button.dataset.iswResetAction=action.id;
  if(action.id==="all")button.classList.add("is-danger");
  const copy=text("span","isw-reset-choice-copy");
  copy.append(
   text("span","isw-reset-choice-title",action.label,"Footnote/Emphasized"),
   text("span","isw-reset-choice-summary",action.summary,"Footnote/Regular")
  );
  button.append(copy,chevron());
  button.addEventListener("click",()=>{
   if(action.point)renderDetail(action,stage==="categories"?"categories":"landing");
   else renderCategories();
  });
  host.append(button);
 };

 const transitionTo=(render,focusSelector)=>{
  const previousHeight=root.getBoundingClientRect().height;
  const version=++transitionVersion;
  root.style.overflow="hidden";
  root.replaceChildren();
  render();
  const nextHeight=root.scrollHeight;
  const animation=animateContentHeight(root,nextHeight,{from:previousHeight});
  const finish=()=>{
   if(version!==transitionVersion||disposed)return;
   root.style.removeProperty("height");
   root.style.removeProperty("overflow");
  };
  if(animation)animation.finished.then(finish).catch(finish);
  else finish();
  requestAnimationFrame(()=>root.querySelector(focusSelector)?.focus({preventScroll:true}));
 };

 function resetIntro(){
  const intro=text("div","isw-reset-intro");
  const info=text("span","isw-reset-info-mark");
  info.append(createMaskedIcon(assetURL("plants/detail/info2.svg"),"isw-reset-info-glyph"));
  const copy=text("div","isw-reset-intro-copy");
  copy.append(
   text("h3","isw-reset-intro-title","Reset operations may affect system behavior or erase stored data.","Subheadline/Emphasized"),
   text("p","isw-reset-intro-text","Review each recovery description before proceeding. Some actions also disconnect the inverter from its current network.","Footnote/Regular")
  );
  intro.append(info,copy);
  return intro;
 }

 function renderLanding(){
  stage="landing";
  root.dataset.resetStage=stage;
  const body=text("div","isw-reset-body");
  const choices=text("div","isw-reset-choices");
  renderChoice(choices,{
   id:"categories",
   label:"Reset by category",
   summary:"Choose one recovery scope: operation, safety or network"
  });
  renderChoice(choices,RESET_ACTIONS.all);
  body.append(resetIntro(),choices);
  root.append(body);
 }

 function renderCategories(){
  transitionTo(()=>{
   stage="categories";
   root.dataset.resetStage=stage;
   const body=text("div","isw-reset-body");
   const list=text("div","isw-reset-choices");
   renderChoice(list,RESET_ACTIONS.operation);
   renderChoice(list,RESET_ACTIONS.grid);
   renderChoice(list,RESET_ACTIONS.network);
   const actions=text("footer","isw-reset-actions");
   const cancel=addButton(actions,{label:"Cancel",action:"categories-cancel"});
   cancel.addEventListener("click",()=>transitionTo(renderLanding,'[data-isw-reset-action="categories"]'));
   body.append(resetIntro(),list,actions);
   root.append(body);
  },'[data-isw-reset-action="operation"]');
 }

 function renderDetail(action,parentStage){
  transitionTo(()=>{
   stage="detail";
   root.dataset.resetStage=stage;
   root.dataset.resetType=action.id;
   root.dataset.resetPoint=action.point;
   const body=text("div","isw-reset-body");
   const warning=text("div","isw-reset-warning");
   const mark=text("span","isw-reset-warning-mark");
   mark.append(warningIcon());
   const warningCopy=text("div","isw-reset-warning-copy");
   warningCopy.append(text("h3","isw-reset-warning-title",action.title,"Subheadline/Emphasized"));
   warning.append(mark,warningCopy);
   const resetBlock=text("section","isw-reset-list-block");
   resetBlock.append(text("h4","isw-reset-list-title","This will reset:","Footnote/Emphasized"));
   const resetList=text("ul","isw-reset-list","","Footnote/Regular");
   for(const item of action.reset)resetList.append(text("li","",item));
   resetBlock.append(resetList);
   let unaffectedBlock=null;
   if(action.unaffected.length){
    unaffectedBlock=text("section","isw-reset-list-block");
    unaffectedBlock.append(text("h4","isw-reset-list-title","This will NOT affect:","Footnote/Emphasized"));
    const unaffectedList=text("ul","isw-reset-list","","Footnote/Regular");
    for(const item of action.unaffected)unaffectedList.append(text("li","",item));
    unaffectedBlock.append(unaffectedList);
   }
   const actions=text("footer","isw-reset-actions");
   const cancel=addButton(actions,{label:"Cancel",action:"detail-cancel"});
   const continueButton=addButton(actions,{label:"Continue",variant:"danger-solid",action:"detail-continue"});
   cancel.addEventListener("click",()=>{
    if(parentStage==="categories")renderCategories();
    else transitionTo(renderLanding,'[data-isw-reset-action="all"]');
   });
   continueButton.addEventListener("click",()=>confirmReset(action));
   body.append(warning,resetBlock,...(unaffectedBlock?[unaffectedBlock]:[]),actions);
   root.append(body);
  },"[data-isw-reset-action='detail-continue']");
 }

 function confirmReset(action){
  const dialog=createConfirmDialog({
   glass,
   title:action.confirmTitle,
   description:"This cannot be undone.",
   confirmLabel:"Reset",
   confirmVariant:"danger-solid",
   cancelLabel:"Cancel",
   icon:createMaskedIcon(opaqueMaskURL("light/imgBoldEssentionalUiDanger.svg"),"plants-device-action-icon"),
   danger:true,
   onConfirm:()=>executeReset(action)
  });
  dialog.dialog.classList.add("isw-reset-confirm");
  return dialog;
 }

 function executeReset(action){
  transitionTo(()=>{
   stage="submitting";
   root.dataset.resetStage=stage;
   root.dataset.resetType=action.id;
   const body=text("div","isw-reset-body isw-reset-body--progress");
   const progress=text("div","isw-reset-progress");
   const mark=text("span","isw-reset-progress-mark");
   mark.append(warningIcon());
   progress.append(
    mark,
    text("h3","isw-reset-progress-title",`Resetting ${action.label.replace(/ Recovery$/,"").toLowerCase()}...`,"Subheadline/Emphasized"),
    text("p","isw-reset-progress-copy","Keep this window open while the command is processed.","Footnote/Regular")
   );
   body.append(progress);
   root.append(body);
   const closeButton=modal?.dialog.querySelector(".plants-device-dialog-close");
   if(closeButton)closeButton.disabled=true;
  },'.isw-reset-progress-title');
  clearTimeout(completionTimer);
  completionTimer=setTimeout(()=>{
   if(disposed)return;
   modal?.close();
   notify?.(`${action.label} simulated in this local preview`);
   onComplete?.(action.id);
  },1100);
 }

 renderLanding();
 modal=createModalDialog({
  glass,
  title:"Reset & Recovery",
  className:"isw-reset-recovery-dialog",
  titleIcon:resetTitleIcon(),
  closeIcon:createMaskedIcon(assetURL("tab-close.svg"),"plants-device-action-icon"),
  closeOnBackdrop:false,
  content:root,
  onClose:()=>{
   disposed=true;
   clearTimeout(completionTimer);
  }
 });
 return modal;
}
