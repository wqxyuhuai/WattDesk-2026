import {createTextElement as text} from "../../foundations/dom.js";
import {createStandardButton} from "../../components/controls.js";
import {createConfirmDialog} from "../../components/confirm-dialog.js";
import {createIcon,createMaskedIcon,assetURL,opaqueMaskURL,SETTINGS_ICON_FILES} from "../../components/icons.js";
import {createModalDialog} from "../../components/modal-dialog.js";
import {menuEndAlign} from "../../components/popover.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {createSegmentedControl} from "../../components/segmented-control.js";
import {createSelectControl} from "../../components/select-control.js";
import {createTimeLabel} from "../../components/time-label.js";
import {createToggleSwitch} from "../../components/toggle-switch.js";
import {bindDisclosure} from "../../components/disclosure.js";
import {menuList,menuRow,mountMenu} from "../../components/menu-popover.js";
import {makeNavRow} from "../../components/navigation.js";
import {animateContentHeight,motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";
import {createSettingsModel,ECONOMIC_MODES,isEconomicDraft,modeIndexFromLabel,MODES,minutesToTime,timeToMinutes} from "./settings-model.js";
import {GRID_PAGES,NAV_GROUPS,PAGES,formatSigned} from "./settings-content.js";
import {
 CAPABILITY_OPTIONS,
 DI_PORT_OPTIONS,
 EXPORT_FORMAT_OPTIONS,
 MPPT_SCAN_INTERVAL_OPTIONS,
 MPPT_SOURCE_OPTIONS,
 NETWORK_INTERFACE_OPTIONS,
 POWER_CHANGE_OPTIONS,
 P_U_MODE_OPTIONS,
 REACTIVE_LIMIT_OPTIONS,
 REACTIVE_MODE_OPTIONS,
 RIDE_THROUGH_PRIORITY_OPTIONS
} from "./settings-options.js";
import {settingRange,settingRangeMessage} from "./settings-validation.js";

const settingIconURL=key=>assetURL(SETTINGS_ICON_FILES[key]);
const ICONS=Object.freeze({
 mode:settingIconURL("generalMode"),
 clock:settingIconURL("timeOfUseMode"),
 batt:settingIconURL("upsMode"),
 tariff:settingIconURL("economicMode"),
 offgrid:settingIconURL("offGridMode"),
 cap:settingIconURL("peakLoadShiftingMode"),
 info:assetURL("plants/detail/info2.svg"),
 chevron:opaqueMaskURL("asset-14.svg"),
 plus:assetURL("plants/plus.svg"),
 lock:assetURL("inverter-settings/lock.svg")
});
const NAV_ICON_FILES=Object.freeze({
 mode:SETTINGS_ICON_FILES.runningMode,
 clock:SETTINGS_ICON_FILES.economicSchedule,
 batt:SETTINGS_ICON_FILES.batteryManagement,
 dispatch:SETTINGS_ICON_FILES.activePowerDispatch,
 limit:SETTINGS_ICON_FILES.feedInImportLimits,
 cap:SETTINGS_ICON_FILES.outputCapability,
 di:SETTINGS_ICON_FILES.diPort,
 grid:SETTINGS_ICON_FILES.gridProtection,
 net:SETTINGS_ICON_FILES.networking,
 feat:SETTINGS_ICON_FILES.deviceFeatures,
 mppt:SETTINGS_ICON_FILES.mpptStrings,
 ct:SETTINGS_ICON_FILES.ctDetection,
 ops:SETTINGS_ICON_FILES.operationControl,
 exp:SETTINGS_ICON_FILES.parameterExport,
 log:SETTINGS_ICON_FILES.operationLog
});

function icon(name){
 const node=document.createElement("i");
 node.className="isw-icon";
 node.dataset.iswIcon=name;
 node.setAttribute("aria-hidden","true");
 return node;
}

function clone(value){
 return value===null||value===undefined?value:JSON.parse(JSON.stringify(value));
}

async function copyText(value){
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(value);
   return true;
  }
 }catch{}
 const field=document.createElement("textarea");
 field.value=value;
 field.setAttribute("readonly","");
 field.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
 document.body.append(field);
 field.select();
 const copied=document.execCommand("copy");
 field.remove();
 return copied;
}

const TRANSIENT_SETTINGS=new Set(["page","gridSub","gridOpen","unlocked","navExpanded","log","ct","ops"]);
const MAIN_PAGE_SETTING_PATHS=Object.freeze({
 mode:[["runMode"]],
 eco:[["eco"]],
 batt:[["soc"],["battChgMax"],["battDisMax"],["pvAvail"]],
 dispatch:[["dispatch"]],
 limits:[["limits"]],
 cap:[["capability"]],
 di:[["di"]],
 net:[["net"]],
 feat:[["features"]],
 mppt:[["mppt"]],
 export:[["exp"]]
});
const GRID_SUBPAGE_SETTING_RULES=Object.freeze({
 prot:/^(?:(?:ov|uv|of|uf)\d|ov10|rocof|islandOn)/,
 conn:/^(?:(?:rc|su)[VF]|rcDelay|suDelay|ramp)/,
 reac:/^(?:reac|qu|cp|upf|lock|P_Q)/,
 pu:/^pu/,
 fp:/^(?:ofp|ufp)/,
 lvrt:/^lv/,
 hvrt:/^hv/
});
const GRID_SUBPAGE_EXTRA_PATHS=Object.freeze({
 reac:[["reacQSet"],["reacPFSet"]]
});
const CURRENT_OPERATOR=Object.freeze({
 name:"Lena Tong",
 email:"lena.tong@wattdesk.example"
});
const validationGrowthVersions=new WeakMap();

function settingsSnapshot(state){
 return Object.fromEntries(Object.entries(clone(state)).filter(([key])=>!TRANSIENT_SETTINGS.has(key)));
}

function settingsFingerprint(state){
 return JSON.stringify(settingsSnapshot(state));
}

function pageSettingPaths(state,snapshots){
 if(state.page!=="grid")return MAIN_PAGE_SETTING_PATHS[state.page]||[];
 if(state.gridSub==="code")return [["gridCode"],["g"],["gref"]];
 const rule=GRID_SUBPAGE_SETTING_RULES[state.gridSub];
 if(!rule)return [];
 const keys=new Set();
 for(const snapshot of snapshots){
  for(const key of Object.keys(snapshot.g||{})){
   if(rule.test(key))keys.add(key);
  }
 }
 return [
  ...[...keys].sort().map(key=>["g",key]),
  ...(GRID_SUBPAGE_EXTRA_PATHS[state.gridSub]||[])
 ];
}

function readPath(snapshot,path){
 let node=snapshot;
 for(const key of path){
  if(node===null||typeof node!=="object"||!Object.hasOwn(node,key))return {exists:false,value:null};
  node=node[key];
 }
 return {exists:true,value:node};
}

function writePath(target,path,value){
 let node=target;
 for(let index=0;index<path.length-1;index+=1){
  const key=path[index];
  if(node[key]===null||typeof node[key]!=="object")node[key]={};
  node=node[key];
 }
 node[path[path.length-1]]=clone(value);
}

function deletePath(target,path){
 let node=target;
 for(let index=0;index<path.length-1;index+=1){
  const key=path[index];
  if(node[key]===null||typeof node[key]!=="object")return;
  node=node[key];
 }
 delete node[path[path.length-1]];
}

function copyPath(target,source,path){
 const entry=readPath(source,path);
 if(entry.exists)writePath(target,path,entry.value);
 else deletePath(target,path);
}

function scopedFingerprint(snapshot,paths){
 return JSON.stringify(paths.map(path=>({path,...readPath(snapshot,path)})));
}

function hydrateIcons(root){
 for(const slot of root.querySelectorAll("[data-isw-icon]")){
  const file=ICONS[slot.dataset.iswIcon];
  if(!file)continue;
  const classes=new Set(String(slot.className||"").split(/\s+/).filter(Boolean));
  classes.add("isw-icon");
  const replacement=createMaskedIcon(file,[...classes].join(" "));
  replacement.dataset.iswIcon=slot.dataset.iswIcon;
  slot.replaceWith(replacement);
  // The active replacement is no longer a slot and must not be hydrated twice.
  delete replacement.dataset.iswIcon;
 }
}

 function decorateNumberInputs(page){
  for(const input of page.querySelectorAll("input[data-isw-number]")){
   const wrapper=input.closest(".isw-number,.isw-mini-number");
   const unit=wrapper?.querySelector(".isw-number-unit")?.textContent.trim()||"";
   const range=settingRange(input.dataset.iswNumber||"",unit);
   input.min=String(range.min);
   input.max=String(range.max);
   input.dataset.iswRangeMin=String(range.min);
   input.dataset.iswRangeMax=String(range.max);
   input.dataset.iswRangeUnit=range.unit;
   input.dataset.iswBaseDescribedby=input.getAttribute("aria-describedby")||"";
   if(input.hasAttribute("aria-label")||input.hasAttribute("aria-labelledby"))continue;
   const row=input.closest(".isw-row");
   const tableRow=input.closest(".isw-table-row");
   const parts=[];
   if(row){
    const label=row.querySelector(".isw-row-label")?.textContent.trim();
    if(label)parts.push(label);
    const hint=row.querySelector(".isw-row-hint");
    if(hint){
     if(!hint.id)hint.id=`isw-field-hint-${String(input.dataset.iswNumber||"value").replace(/[^a-z0-9_-]+/gi,"-")}`;
     input.setAttribute("aria-describedby",hint.id);
    }
   }else if(tableRow){
    const label=tableRow.querySelector(":scope > .isw-table-symbol")?.textContent.trim();
    if(label)parts.push(label);
    const table=tableRow.closest(".isw-table");
    const head=table?.querySelector(".isw-table-head");
    const cell=[...tableRow.children].find(node=>node.contains(input));
    const column=cell&&head?[...tableRow.children].indexOf(cell):-1;
    const columnLabel=column>=0?head?.children[column]?.textContent.trim():"";
    if(columnLabel)parts.push(columnLabel);
   }
   if(unit)parts.push(unit);
   input.setAttribute("aria-label",parts.join(", ")||`Setting ${input.dataset.iswNumber||""}`.trim());
  }
 }

 function validationCard(input){
  return input.closest(".isw-panel,.isw-table,.isw-eco-table");
 }

 function animateValidationCard(card,previousHeight){
  if(!card||!Number.isFinite(previousHeight))return;
  const nextHeight=card.getBoundingClientRect().height;
  if(Math.abs(nextHeight-previousHeight)<.5)return;
  const version=(validationGrowthVersions.get(card)||0)+1;
  validationGrowthVersions.set(card,version);
  const finish=()=>{
   if(validationGrowthVersions.get(card)!==version)return;
   validationGrowthVersions.delete(card);
   card.style.removeProperty("height");
   card.style.removeProperty("overflow");
  };
  card.style.overflow="hidden";
  const animation=animateContentHeight(card,nextHeight,{from:previousHeight});
  if(!animation){finish();return;}
  animation.finished.then(finish).catch(finish);
 }

 function fieldIdentity(input){
  return String(input.dataset.iswNumber||input.dataset.iswEcoPower||input.dataset.iswEcoTimeInput||input.value||"field").replace(/[^a-z0-9_-]+/gi,"-");
 }

 function syncFieldDescription(input,errorId=null){
  const ids=new Set(String(input.dataset.iswBaseDescribedby||"").split(/\s+/).filter(Boolean));
  if(errorId)ids.add(errorId);
  if(ids.size)input.setAttribute("aria-describedby",[...ids].join(" "));
  else input.removeAttribute("aria-describedby");
  if(errorId)input.setAttribute("aria-errormessage",errorId);
  else input.removeAttribute("aria-errormessage");
 }

 function syncInlineErrorAlignment(row,errors,input){
  if(!row.matches(".isw-table-row,.isw-eco-row")){
   errors.style.removeProperty("--isw-error-right");
   return;
  }
  const anchor=input.closest(".isw-number,.isw-mini-number,.isw-eco-percent-field,.isw-eco-time-range-field");
  if(!anchor){
   errors.style.removeProperty("--isw-error-right");
   return;
  }
  const rowRect=row.getBoundingClientRect();
  const anchorRect=anchor.getBoundingClientRect();
  errors.style.setProperty("--isw-error-right",`${Math.max(0,rowRect.right-anchorRect.right)}px`);
 }

 function showInlineFieldError(input,message){
  const row=input.closest(".isw-row,.isw-table-row,.isw-eco-row");
  if(!row)return;
  const card=validationCard(input);
  const previousHeight=card?.getBoundingClientRect().height;
  const id=`isw-field-error-${fieldIdentity(input)}`;
  let errors=row.querySelector(":scope > .isw-field-errors");
  if(!errors){
   errors=text("div","isw-field-errors");
   errors.setAttribute("role","alert");
   row.append(errors);
  }
  let item=errors.querySelector(`[data-error-for="${CSS.escape(fieldIdentity(input))}"]`);
  if(!item){
   item=text("div","isw-field-error-message");
   item.id=id;
   item.dataset.errorFor=fieldIdentity(input);
   errors.append(item);
  }
  if(item.textContent!==message)item.textContent=message;
  const wrapper=input.closest(".isw-number,.isw-mini-number,.isw-eco-percent-field,.isw-eco-time-range-field");
  wrapper?.classList.add("is-invalid");
  input.classList.add("is-error");
  input.setAttribute("aria-invalid","true");
  syncFieldDescription(input,id);
  syncInlineErrorAlignment(row,errors,input);
  animateValidationCard(card,previousHeight);
 }

 function clearInlineFieldError(input){
  const row=input.closest(".isw-row,.isw-table-row,.isw-eco-row");
  const card=validationCard(input);
  const previousHeight=card?.getBoundingClientRect().height;
  const errors=row?.querySelector(":scope > .isw-field-errors");
  errors?.querySelector(`[data-error-for="${CSS.escape(fieldIdentity(input))}"]`)?.remove();
  if(errors&&!errors.children.length)errors.remove();
  input.closest(".isw-number,.isw-mini-number,.isw-eco-percent-field,.isw-eco-time-range-field")?.classList.remove("is-invalid");
  input.classList.remove("is-error");
  input.removeAttribute("aria-invalid");
  syncFieldDescription(input);
  animateValidationCard(card,previousHeight);
 }

 function validateNumberField(input,{showEmpty=false,allowEmpty=true,range=null}={}){
  const raw=input.value.trim();
  const resolvedRange=range||settingRange(input.dataset.iswNumber||"",input.dataset.iswRangeUnit||"");
  if(!raw){
   if(showEmpty)showInlineFieldError(input,settingRangeMessage(resolvedRange));
   else if(allowEmpty)clearInlineFieldError(input);
   return {valid:false,empty:true,range:resolvedRange};
  }
  const value=Number(raw);
  if(!Number.isFinite(value)){
   showInlineFieldError(input,settingRangeMessage(resolvedRange));
   return {valid:false,value,range:resolvedRange};
  }
  if(value<resolvedRange.min||value>resolvedRange.max){
   showInlineFieldError(input,settingRangeMessage(resolvedRange));
   return {valid:false,value,range:resolvedRange};
  }
  clearInlineFieldError(input);
  return {valid:true,value,range:resolvedRange};
 }

function renderNav(model){
 const fragment=document.createDocumentFragment();
 NAV_GROUPS.forEach((group,index)=>{
  const section=text("section","isw-nav-section");
  const expanded=model.S.navExpanded[group.label]??true;
  const heading=text("button","isw-nav-group-button target-section-heading wd-control-state");
  heading.type="button";
  heading.dataset.iswGroup=group.label;
  heading.setAttribute("aria-expanded",String(expanded));
  const content=text("div","isw-nav-group-content");
  content.id=`isw-nav-group-${index}`;
  heading.setAttribute("aria-controls",content.id);
  heading.append(text("span","isw-nav-group-label",group.label,"Caption1/Emphasized"));
  const disclosure=createIcon("disclosure");
  disclosure.classList.add("target-disclosure","wd-disclosure-icon");
  heading.append(disclosure);
  content.hidden=!expanded;
  content.inert=!expanded;
  for(const item of group.items){
   const trailing=text("span","isw-nav-item-trailing");
   if(item.gridParent&&!model.S.unlocked)trailing.append(icon("lock"));
   if(item.gridParent){
    const chevron=createMaskedIcon(opaqueMaskURL("asset-14.svg"),"isw-nav-chevron wd-disclosure-glyph");
    trailing.append(chevron);
   }else{
    const value=item.value(model);
    if(value)trailing.append(text("span",`isw-nav-value${value==="Off"?" is-off":""}`,value));
   }
   const button=makeNavRow(
    item.label,
    item.id,
    NAV_ICON_FILES[item.icon],
    "",
    "mono",
    {labelClassName:"isw-nav-item-label",trailing:trailing.childElementCount?trailing:null}
   );
   button.classList.add("isw-nav-item");
   button.dataset.iswGo=item.id;
   const selected=item.gridParent?model.S.page==="grid":model.S.page===item.id;
   button.classList.toggle("is-selected",selected);
   button.classList.toggle("active",selected);
   if(selected)button.setAttribute("aria-current","page");
   if(item.gridParent){
    button.classList.toggle("is-open",model.S.gridOpen);
    button.setAttribute("aria-expanded",String(model.S.gridOpen));
   }
   content.append(button);
  }
  section.append(heading,content);
  fragment.append(section);
 });
 return fragment;
}

function renderSubnav(model){
 const fragment=document.createDocumentFragment();
 for(const [id,label] of model.gridSubs()){
  const button=text("button","isw-subnav-item wd-control-state");
  button.type="button";
  button.dataset.iswSub=id;
  button.classList.toggle("is-selected",model.S.gridSub===id);
  if(model.S.gridSub===id)button.setAttribute("aria-current","page");
  button.append(text("span","isw-control-label",label,"Footnote/Medium"));
  fragment.append(button);
 }
 return fragment;
}

function renderOverview(model,overview){
 const effective=model.effective();
 const hard=effective.src==="Export limit"||effective.src==="Import limit";
 const tone=!effective.src?"success":hard?"warning":"signal";
 const limit=!effective.src
  ?"Setpoint reached"
  :effective.src==="Battery power capability"
   ?`Limited by ${effective.sp<0?"battery charging":"battery discharge and PV"}`
   :`Limited by ${effective.src.toLowerCase()}`;
 const metrics=[
   ["Mode",MODES[model.S.runMode].compactLabel],
  ["Control",model.S.dispatch.on?"EMS dispatch":"Local strategy"],
  ["Setpoint",model.S.dispatch.on?`${effective.sp.toFixed(1)}<em>kW</em>`:"—"],
   ["Export limit",model.S.limits.feedOn?`${model.S.limits.feed.toFixed(1)}<em>kW</em>`:"Off"],
  ["PV curtailed",`${effective.curtail.toFixed(1)}<em>kW</em>`],
  ["Battery","50.3<em>%</em>"]
 ];
 overview.innerHTML=`<div class="isw-overview-main">
   <div class="isw-overview-kicker">Grid-tied point now</div>
   <div class="isw-overview-result">
    <div class="isw-overview-reading"><b>${effective.out.toFixed(1)}</b><em>kW</em></div>
    <div class="isw-status isw-overview-limit isw-status--${tone}"><i></i><span>${limit}</span></div>
   </div>
  </div>
  <div class="isw-overview-grid">${metrics.map(([label,value])=>`<div class="isw-overview-metric"><span>${label}</span><div>${value}</div></div>`).join("")}</div>`;
}

function renderDeviceHeader(model,device,container){
 const status=device?.status==="offline"?"Offline":"Grid connected";
 container.innerHTML=`<div class="isw-device-model">${device?.model||"WattMatic 25K-3P"}</div>
  <div class="isw-device-serial">SN ${device?.serial||"1M25K2570015"}</div>
  <div class="isw-device-meta">
   <span class="isw-device-profile">${model.prof().label}${model.prof().country!=="EU"?` · ${model.prof().country}`:""}</span>
   <span>FW ${device?.firmware||"2.0.20"}</span>
   <span class="isw-status isw-connection-status isw-status--${device?.status==="offline"?"idle":"success"}"><i></i>${status}</span>
  </div>`;
}

function createWindow({device,model,onCancel,onSave,glass,toast,registerPanel,togglePanel,closePanels}){
 const root=text("section","inverter-settings-window");
 root.setAttribute("aria-label","Inverter Settings");
 const statusWindow=text("section","isw-status-window wd-glass--surface wd-glass-popup");
 statusWindow.setAttribute("aria-label","Device status");
 const mainShell=text("div","isw-main-shell");
 const mainWindow=text("section","isw-main-window wd-glass--surface wd-glass-popup");
 const close=createStandardButton({
  label:"Close inverter settings",
  iconOnly:true,
  className:"isw-close-button",
  icon:createMaskedIcon(assetURL("tab-close.svg"),"plants-device-action-icon")
 });

 const deviceHead=text("header","isw-device-head");
 const overview=text("section","isw-overview");
 overview.setAttribute("aria-label","Inverter status");
 const header=text("header","isw-window-header");
 const titleIcon=text("span","isw-window-title-icon");
 titleIcon.append(createMaskedIcon(assetURL("settings.svg"),"isw-icon"));
 const title=text("h2","isw-window-title",`${device?.name||"Inverter"} settings`,"Subheadline/Emphasized");
 header.append(titleIcon,title);

 const shell=text("div","isw-shell");
 const nav=text("nav","isw-nav");
 nav.setAttribute("aria-label","Inverter settings sections");
 const navScroll=text("div","isw-nav-scroll");
 const navContent=text("div","isw-nav-content");
 navScroll.append(navContent);
 nav.append(navScroll);

 const sub=text("aside","isw-sub");
 sub.setAttribute("aria-label","Grid and protection sections");
 const subList=text("div","isw-sub-list");
 sub.append(subList);

 const body=text("section","isw-body wd-main-panel");
 const contentPane=text("div","isw-content-pane");
 const scroll=text("div","isw-scroll");
 scroll.tabIndex=0;
 const content=text("div","isw-page-host");
 scroll.append(content);
 const titleLayer=text("div","isw-title-layer");
 titleLayer.hidden=true;
 const titleRule=text("div","isw-title-rule");
 const actions=text("footer","isw-actions");
 actions.hidden=true;
 actions.inert=true;
 actions.setAttribute("aria-hidden","true");
 const cancel=createStandardButton({label:"Cancel"});
 const save=createStandardButton({label:"Save",variant:"primary"});
 actions.append(cancel,save);
 contentPane.append(scroll,titleLayer,titleRule,actions);
 body.append(sub,contentPane);
 shell.append(nav,body);

 const gate=text("div","isw-gate");
 gate.hidden=true;
 contentPane.append(gate);
 const notify=message=>toast?.(message);

 statusWindow.append(deviceHead,overview);
 mainWindow.append(header,shell,close);
 mainShell.append(mainWindow);
 root.append(statusWindow,mainShell);
 renderDeviceHeader(model,device,deviceHead);
 renderOverview(model,overview);

 const controlDisposers=[];
 const switchControls=new Map();
 const segmentedControls=new Map();
 const surfaceGrowthVersions=new WeakMap();
 const navDisposers=[];
 const shellEvents=new AbortController();
 let modeAnimations=[];
 const timerIds=new Set();
 let destroyed=false;
 let closeNavigationAfterExit=false;
 let savedSettings=settingsSnapshot(model.S);
 let savedFingerprint=JSON.stringify(savedSettings);
 let actionsVisible=false;
 let actionsAnimation=null;
 let actionsTransition=0;
 let pageChangeConfirm=null;
 let animateNextSurfaceGrowth=false;
 let viewSwitchGeneration=0;
 let viewSwitchAnimations=[];
 let statusEntranceFrame=0;
 let gateTransitionAnimation=null;
 let gateTransitionGeneration=0;
 const pageScrollMemory=new Map();
 const pageMemoryKey=()=>model.S.page==="grid"?`grid:${model.S.gridSub}`:model.S.page;

 const modal=createModalDialog({
  glass,
  title:"Inverter Settings",
  className:"inverter-settings-dialog",
  showHeader:false,
  showClose:false,
  closeOnBackdrop:false,
  closeOnEscape:false,
  panelMaterial:false,
  content:root,
  onClose:()=>{
   destroyed=true;
   viewSwitchGeneration+=1;
   gateTransitionGeneration+=1;
   cancelAnimationFrame(statusEntranceFrame);
   statusWindow.classList.remove("isw-status-window--entering");
   for(const animation of viewSwitchAnimations)animation.cancel();
   viewSwitchAnimations=[];
   gateTransitionAnimation?.cancel();
   gateTransitionAnimation=null;
   for(const id of timerIds)clearTimeout(id);
   timerIds.clear();
   shellEvents.abort();
   for(const dispose of navDisposers)dispose();
   navDisposers.length=0;
   for(const dispose of controlDisposers)dispose();
   destroyHydratedSwitches();
   destroyHydratedSegmentedControls();
   if(closeNavigationAfterExit){
    closeNavigationAfterExit=false;
    onCancel?.();
   }
  }
 });
 const stackRadius=Number.parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue("--wd-radius-large")
 )||30;
 modal.registerSurface(statusWindow,stackRadius,{interactive:false});
 statusWindow.style.borderRadius="var(--wd-radius-large) var(--wd-radius-large) 0 0";
 modal.registerSurface(mainWindow,stackRadius,{interactive:false});
 mainWindow.style.borderRadius="var(--wd-radius-large)";
 modal.registerSurface(cancel,18);
 modal.registerSurface(save,18);
 modal.registerSurface(close,18);

 const scrollTrackInset=Number.parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue("--wd-space-3")
 )||12;
 const scrollFeedback=createScrollFeedback({
  host:contentPane,
  viewport:scroll,
  content,
  elastic:true,
  preserveBottomOnShrink:true,
  topInset:scrollTrackInset,
  bottomInset:()=>actions.hidden?scrollTrackInset:actions.offsetHeight+scrollTrackInset,
  visibility:"hover"
 });
 scrollFeedback.element.style.setProperty("--wd-scroll-feedback-right","4px");
 const navFeedback=createScrollFeedback({
  host:nav,
  viewport:navScroll,
  content:navContent,
  elastic:true,
  topInset:scrollTrackInset,
  bottomInset:scrollTrackInset,
  visibility:"hover"
 });
 navFeedback.element.style.setProperty("--wd-scroll-feedback-right","2px");
 const syncNavTopFade=()=>navScroll.classList.toggle("is-top-faded",navScroll.scrollTop>1);
 navScroll.addEventListener("scroll",syncNavTopFade,{passive:true,signal:shellEvents.signal});
 syncNavTopFade();
 let titleRuleTransition=0;
 const syncScrollState=()=>{
  const title=titleLayer.querySelector(".isw-page-title");
  const firstContent=content.querySelector(".isw-page")?.firstElementChild;
  const overlaps=title&&firstContent
   ?firstContent.getBoundingClientRect().top<title.getBoundingClientRect().bottom-.5
   :scroll.scrollTop>2;
  if(title){
   titleRule.style.top=`${titleLayer.getBoundingClientRect().bottom-body.getBoundingClientRect().top}px`;
   titleRule.hidden=false;
  }else{
   titleRule.hidden=true;
  }
  const currentOverlap=scroll.classList.contains("is-content-scrolled");
  if(overlaps===currentOverlap&&overlaps===titleLayer.classList.contains("is-content-scrolled"))return;
  titleLayer.classList.toggle("is-content-scrolled",overlaps);
  const transition=++titleRuleTransition;
  scroll.classList.remove("is-title-clearing");
  titleRule.classList.remove("is-title-rule--clearing");
  if(overlaps){
   scroll.classList.add("is-content-scrolled");
   titleRule.classList.add("is-title-rule--visible");
   return;
  }
  scroll.classList.remove("is-content-scrolled");
  if(reducedMotion())return;
  titleRule.classList.remove("is-title-rule--visible");
  titleRule.classList.add("is-title-rule--clearing");
  scroll.classList.add("is-title-clearing");
  schedule(()=>{
   if(transition!==titleRuleTransition)return;
   scroll.classList.remove("is-title-clearing");
   titleRule.classList.remove("is-title-rule--clearing");
  },motionDuration("--wd-motion-panel-exit"));
 };
 scroll.addEventListener("scroll",syncScrollState,{passive:true});
 syncScrollState();

 function syncActionSurface(){
  const scrollTop=scroll.scrollTop;
  scroll.classList.toggle("isw-scroll--actionless",actions.hidden);
  if(Math.abs(scroll.scrollTop-scrollTop)>1)scroll.scrollTop=scrollTop;
  scrollFeedback.sync();
  requestAnimationFrame(()=>{
   if(Math.abs(scroll.scrollTop-scrollTop)>1)scroll.scrollTop=scrollTop;
   scrollFeedback.sync();
  });
 }

 function setActionsVisible(visible,{immediate=false}={}){
  const unchanged=visible===actionsVisible;
  actionsVisible=visible;
  actions.inert=!visible;
  actions.setAttribute("aria-hidden",String(!visible));
  actions.classList.toggle("is-visible",visible);
  if(unchanged){
   syncActionSurface();
   return;
  }
  const transition=++actionsTransition;
  actionsAnimation?.cancel();
  actionsAnimation=null;
  if(visible){
   actions.hidden=false;
   if(!immediate&&!reducedMotion()){
    actionsAnimation=actions.animate(
     [{opacity:0},{opacity:1}],
     {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel"),fill:"both"}
    );
   }
   syncActionSurface();
   return;
  }
  if(immediate||reducedMotion()){
   actions.hidden=true;
   syncActionSurface();
   return;
  }
  const animation=actions.animate(
   [{opacity:1},{opacity:0}],
   {duration:motionDuration("--wd-motion-panel-exit"),easing:motionEasing("--wd-ease-hover-out"),fill:"forwards"}
  );
  actionsAnimation=animation;
  animation.finished.then(()=>{
   if(transition!==actionsTransition)return;
   actions.hidden=true;
   actionsAnimation=null;
   syncActionSurface();
  }).catch(()=>{});
 }

 function syncActions(){
  setActionsVisible(hasCurrentPageChanges());
 }

 let pendingFocus=null;

 function schedule(fn,delay){
  const id=setTimeout(()=>{
   timerIds.delete(id);
   if(!destroyed)fn();
  },delay);
  timerIds.add(id);
  return id;
 }

 function destroyHydratedControls(){
  while(controlDisposers.length)controlDisposers.pop()();
 }

 function destroyHydratedSwitches(){
  for(const control of switchControls.values())control.destroy();
  switchControls.clear();
 }

 function destroyHydratedSegmentedControls(){
  for(const control of segmentedControls.values())control.destroy();
  segmentedControls.clear();
 }

 function tagSurfaceKeys(page){
  const pageKey=model.S.page==="grid"?`grid:${model.S.gridSub}`:model.S.page;
  const seen=new Map();
  for(const surface of page.querySelectorAll(".isw-panel,.isw-table,.isw-effective-chain,.isw-soc-panel,.isw-gantt,.isw-plot,.isw-profile-list")){
   const heading=surface.previousElementSibling?.classList.contains("isw-group-title")
    ?surface.previousElementSibling.textContent.trim()
    :"";
   const first=surface.querySelector(".isw-row-label,.isw-table-symbol,.isw-profile-name")?.textContent?.trim()||"";
   const base=`${pageKey}|${heading}|${first}`;
   const index=seen.get(base)||0;
   seen.set(base,index+1);
   surface.dataset.iswSurfaceKey=`${base}|${index}`;
  }
 }

function clearViewSwitch({preserveActive=false}={}){
  viewSwitchGeneration+=1;
 const activePage=content.querySelector(".isw-page:not(.isw-page--leaving)");
 const activeTitle=titleLayer.querySelector(".isw-title-label");
 const activeOpacity=preserveActive&&activePage
  ?Number.parseFloat(getComputedStyle(activePage).opacity)
  :null;
 const activeTitleOpacity=preserveActive&&activeTitle
  ?Number.parseFloat(getComputedStyle(activeTitle).opacity)
  :null;
  for(const animation of viewSwitchAnimations)animation.cancel();
  viewSwitchAnimations=[];
 body.querySelectorAll(".isw-page.isw-page--leaving").forEach(page=>page.remove());
 body.querySelectorAll(".isw-sub.isw-sub--view-leaving").forEach(snapshot=>snapshot.remove());
 titleLayer.querySelectorAll(".isw-title-label--ghost").forEach(label=>label.remove());
 if(preserveActive&&activePage){
  activePage.style.opacity=String(Number.isFinite(activeOpacity)?activeOpacity:1);
  activePage.style.willChange="opacity";
 }else{
  activePage?.style.removeProperty("opacity");
  activePage?.style.removeProperty("will-change");
 }
 if(preserveActive&&activeTitle){
  activeTitle.style.opacity=String(Number.isFinite(activeTitleOpacity)?activeTitleOpacity:1);
  activeTitle.style.willChange="opacity";
 }else{
  activeTitle?.style.removeProperty("opacity");
  activeTitle?.style.removeProperty("will-change");
 }
 sub.style.removeProperty("opacity");
 sub.style.removeProperty("will-change");
 }

function crossfadeView(page,outgoingPage,outgoingTitle,layoutSnapshot,subTransition){
  const generation=++viewSwitchGeneration;
  const outgoingOpacity=Number.parseFloat(getComputedStyle(outgoingPage).opacity);
 const outgoingTitleOpacity=Number.parseFloat(outgoingTitle?.style.opacity);
 const incomingTitle=titleLayer.querySelector(".isw-title-label");
  const oldOptions={
   duration:motionDuration("--wd-motion-view-switch-out"),
  easing:motionEasing("--wd-ease-view-switch-out"),
  fill:"both"
  };
  const newOptions={
   duration:motionDuration("--wd-motion-view-switch-in"),
   delay:motionDuration("--wd-motion-view-switch-delay"),
  easing:motionEasing("--wd-ease-view-switch"),
  fill:"both"
  };
  outgoingPage.style.willChange="opacity";
  page.style.willChange="opacity";
  const animations=[
   outgoingPage.animate([{opacity:Number.isFinite(outgoingOpacity)?outgoingOpacity:1},{opacity:0}],oldOptions),
   page.animate([{opacity:0},{opacity:1}],newOptions)
  ];
  if(outgoingTitle){
  outgoingTitle.classList.remove("isw-title-label--entering");
  outgoingTitle.classList.add("isw-title-label--ghost");
   outgoingTitle.setAttribute("aria-hidden","true");
  titleLayer.querySelector(".isw-page-title")?.append(outgoingTitle);
  if(Number.isFinite(layoutSnapshot?.titleLeft)){
   const incomingLeft=incomingTitle?.getBoundingClientRect().left;
   if(Number.isFinite(incomingLeft))outgoingTitle.style.translate=`${layoutSnapshot.titleLeft-incomingLeft}px 0`;
  }
   outgoingTitle.style.opacity=String(Number.isFinite(outgoingTitleOpacity)?outgoingTitleOpacity:1);
   outgoingTitle.style.willChange="opacity";
  if(incomingTitle){
   incomingTitle.style.opacity="0";
   incomingTitle.style.willChange="opacity";
  }
  animations.push(outgoingTitle.animate([{opacity:outgoingTitleOpacity},{opacity:0}],oldOptions));
  if(incomingTitle)animations.push(incomingTitle.animate([{opacity:0},{opacity:1}],newOptions));
  }
 if(subTransition?.entering){
  sub.style.opacity="0";
  sub.style.willChange="opacity";
  animations.push(sub.animate([{opacity:0},{opacity:1}],newOptions));
 }
 if(subTransition?.leaving&&subTransition.snapshot){
  const snapshot=subTransition.snapshot;
  const bodyRect=body.getBoundingClientRect();
  snapshot.classList.add("isw-sub--view-leaving");
  snapshot.setAttribute("inert","");
  snapshot.setAttribute("aria-hidden","true");
  snapshot.style.inset="auto";
  snapshot.style.left=`${subTransition.rect.left-bodyRect.left}px`;
  snapshot.style.top=`${subTransition.rect.top-bodyRect.top}px`;
  snapshot.style.width=`${subTransition.rect.width}px`;
  snapshot.style.height=`${subTransition.rect.height}px`;
  snapshot.style.margin="0";
  snapshot.style.opacity="1";
  snapshot.style.willChange="opacity";
  body.append(snapshot);
  animations.push(snapshot.animate([{opacity:1},{opacity:0}],oldOptions));
  subTransition.element=snapshot;
 }
  viewSwitchAnimations=animations;
  Promise.all(animations.map(animation=>animation.finished.catch(()=>{}))).then(()=>{
   if(generation!==viewSwitchGeneration||destroyed)return;
   outgoingPage.remove();
   outgoingTitle?.remove();
   for(const animation of animations)animation.cancel();
   viewSwitchAnimations=[];
   page.style.removeProperty("opacity");
   page.style.removeProperty("will-change");
  page.classList.remove("isw-page--incoming");
  incomingTitle?.style.removeProperty("opacity");
  incomingTitle?.style.removeProperty("will-change");
  sub.style.removeProperty("opacity");
  sub.style.removeProperty("will-change");
  subTransition?.element?.remove();
  });
 }

 function animateSurfaceGrowth(page,previousHeights){
  if(!previousHeights?.size||reducedMotion())return;
  for(const surface of page.querySelectorAll("[data-isw-surface-key]")){
   const previous=previousHeights.get(surface.dataset.iswSurfaceKey);
   if(!Number.isFinite(previous))continue;
   const next=surface.getBoundingClientRect().height;
   if(Math.abs(next-previous)<.5)continue;
   const version=(surfaceGrowthVersions.get(surface)||0)+1;
   surfaceGrowthVersions.set(surface,version);
   const finish=()=>{
    if(surfaceGrowthVersions.get(surface)!==version)return;
    surfaceGrowthVersions.delete(surface);
    surface.style.removeProperty("height");
    surface.style.removeProperty("overflow");
   };
   surface.style.overflow="hidden";
   const animation=animateContentHeight(surface,next,{from:previous});
   if(!animation){
    finish();
    continue;
   }
   animation.finished.then(finish).catch(finish);
  }
 }

 function bindHoverPanel(anchor,message,label,width=null,{align="start",onActivate=null}={}){
  if(!registerPanel)return ()=>{};
  let panel=null,closeTimer=0,disposed=false;
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
  controlDisposers.push(()=>{
   disposed=true;
   close();
   anchor.removeAttribute("aria-describedby");
  });
  return close;
 }

 function hydrateTimeLabels(page){
  for(const slot of page.querySelectorAll("[data-isw-time-minutes],[data-isw-log-minutes]")){
   const minutes=Number(slot.dataset.iswTimeMinutes??slot.dataset.iswLogMinutes);
   slot.replaceWith(createTimeLabel(Number.isFinite(minutes)?minutes:0,{
    ageMinutes:true,
    className:slot.hasAttribute("data-isw-log-minutes")?"isw-log-time":"isw-time-label"
   }));
  }
  for(const operator of page.querySelectorAll("[data-isw-log-operator]")){
   bindHoverPanel(
    operator,
    operator.dataset.iswEmail,
    `Account email for ${operator.dataset.iswName}`,
    null,
    {
     align:"center",
     onActivate:async()=>{
      const copied=await copyText(operator.dataset.iswEmail||"");
      notify(copied?"Email copied":"Could not copy email");
     }
    }
   );
  }
 }

 function hydratePage(page){
  hydrateIcons(page);
  decorateNumberInputs(page);
 for(const slot of page.querySelectorAll("[data-isw-standard-button]")){
  const action=slot.dataset.iswAction;
  const label=slot.dataset.iswButtonLabel||slot.textContent;
  const requestedVariant=slot.dataset.iswButtonVariant;
  const variant=["primary","danger","warning"].includes(requestedVariant)?requestedVariant:"neutral";
  const button=createStandardButton({label,variant});
  button.dataset.iswAction=action;
  button.dataset.iswButtonLabel=label;
  button.dataset.iswStandardButton="";
  button.disabled=slot.disabled;
  if(glass){
   glass.addSurface({host:button,radius:18});
   controlDisposers.push(()=>glass.removeSurface(button));
  }
  slot.replaceWith(button);
 }
  const usedSwitchPaths=new Set();
  const usedSegmentedPaths=new Set();
  for(const slot of page.querySelectorAll("[data-isw-switch]")){
   const path=slot.dataset.iswSwitch;
   usedSwitchPaths.add(path);
   const preserved=switchControls.get(path);
   if(preserved){
    preserved.setValue(Boolean(model.get(path)),{notify:false});
    preserved.element.dataset.iswSwitch=path;
    slot.replaceWith(preserved.element);
    continue;
   }
   const row=slot.closest(".isw-row");
   const label=row?.querySelector(".isw-row-label")?.textContent?.trim()||path;
   const toggle=createToggleSwitch({
    label,
    checked:Boolean(model.get(path)),
    glass,
    onChange:value=>{
     model.set(path,value?1:0);
     pendingFocus={type:"switch",value:path};
     animateNextSurfaceGrowth=true;
     refresh();
    }
   });
   toggle.element.dataset.iswSwitch=path;
   slot.replaceWith(toggle.element);
   switchControls.set(path,toggle);
  }
  for(const [path,control] of switchControls){
   if(usedSwitchPaths.has(path))continue;
   control.destroy();
   switchControls.delete(path);
  }
  for(const slot of page.querySelectorAll("[data-isw-seg]")){
   const path=slot.dataset.iswSeg;
   usedSegmentedPaths.add(path);
   const preserved=segmentedControls.get(path);
   if(preserved){
    preserved.setValue(String(Number(slot.dataset.iswValue)),{animate:false,notify:false});
    preserved.element.dataset.iswSeg=path;
    slot.replaceWith(preserved.element);
    continue;
   }
   const options=JSON.parse(decodeURIComponent(slot.dataset.iswOptions));
   const current=Number(slot.dataset.iswValue);
   const row=slot.closest(".isw-row");
   const label=row?.querySelector(".isw-row-label")?.textContent?.trim()||path;
   const control=createSegmentedControl({
    items:options.map((item,index)=>({id:String(index),label:item})),
    value:String(current),
    label,
    glass,
    onChange:value=>{
     const index=Number(value);
     if(path==="dispatch.unit"){
      const currentKW=model.spKW();
      model.S.dispatch.unit=index;
      model.S.dispatch.sp=index?currentKW:currentKW/model.PN*100;
     }else{
      model.set(path,index);
     }
     pendingFocus={type:"segment",path,value:String(index)};
     refresh();
    }
   });
   control.element.dataset.iswSeg=path;
   slot.replaceWith(control.element);
   segmentedControls.set(path,control);
  }
  for(const [path,control] of segmentedControls){
   if(usedSegmentedPaths.has(path))continue;
   control.destroy();
   segmentedControls.delete(path);
  }
  for(const input of page.querySelectorAll("[data-isw-number]")){
   input.addEventListener("input",()=>{
    const raw=input.value.trim();
    if(!raw||!Number.isFinite(Number(raw)))return;
    validateNumberField(input);
   });
   input.addEventListener("blur",()=>validateNumberField(input,{showEmpty:true,allowEmpty:false}));
   input.addEventListener("change",()=>{
    const validation=validateNumberField(input,{showEmpty:true,allowEmpty:false});
    if(!validation.valid)return;
    model.set(input.dataset.iswNumber,validation.value);
    refresh();
   });
   input.addEventListener("keydown",event=>{
    if(event.key==="Enter"){
     event.preventDefault();
     input.blur();
     return;
    }
    if(event.key!=="ArrowUp"&&event.key!=="ArrowDown")return;
    event.preventDefault();
    const value=Number.parseFloat(input.value);
    if(!Number.isFinite(value))return;
    const step=Math.abs(Number.parseFloat(input.dataset.iswStepSize||".1"));
    const decimals=Number(input.dataset.iswDecimals||1);
    const next=value+(event.key==="ArrowUp"?step*(event.shiftKey?10:1):-step*(event.shiftKey?10:1));
    const formatted=Number(next.toFixed(decimals));
    input.value=formatted.toFixed(decimals);
    const validation=validateNumberField(input);
    if(!validation.valid)return;
    model.set(input.dataset.iswNumber,formatted);
    pendingFocus={type:"number",value:input.dataset.iswNumber};
    refresh();
   });
  }
  for(const button of page.querySelectorAll("[data-isw-mode]")){
   button.addEventListener("click",()=>{
    const index=Number(button.dataset.iswMode);
    if(index===model.S.runMode)return;
    model.S.runMode=index;
    syncNavigationValues();
    animateModeSelection(index,page);
    renderOverview(model,overview);
    syncActions();
   });
  }
  for(const button of page.querySelectorAll("[data-isw-profile]")){
   button.addEventListener("click",()=>{
    const next=button.dataset.iswProfile;
    if(!next||next===model.S.gridCode)return;
    const previous=model.prof().label;
    if(!model.loadProfile(next))return;
    model.S.log.unshift({
     minutesAgo:0,
     operator:CURRENT_OPERATOR,
     changes:[
      {parameter:"Grid code",from:previous,to:model.prof().label},
      {parameter:"Protection limits",from:"Previous certified set",to:`${model.prof().label} certified set`},
      {parameter:"Reconnection window",from:"Previous profile",to:"New profile default"}
     ]
    });
    if(!model.gridSubs().some(([id])=>id===model.S.gridSub))model.S.gridSub="code";
    pendingFocus={type:"profile",value:next};
    refresh({header:true});
    renderSub();
   });
  }
  for(const slot of page.querySelectorAll("[data-isw-reac-mode-select]")){
   const control=createSelectControl({
    label:"Control mode",
    value:Number(slot.dataset.iswReacModeSelect),
    options:REACTIVE_MODE_OPTIONS,
    variant:"adaptive",
    className:"isw-reac-mode-trigger",
    menuClassName:"isw-reac-mode-popover",
    registerPanel,
    close:closePanels,
    toggle:togglePanel,
    radius:30,
    menuWidth:220,
    align:"end",
    chooseLabel:"Choose reactive power control mode",
    onChange:next=>{
     if(model.S.g.reacMode===next)return;
     model.S.g.reacMode=next;
     pendingFocus={type:"reacMode"};
     refresh();
    }
   });
   control.element.dataset.iswReacModeTrigger="";
   slot.replaceWith(control.element);
  }
  for(const slot of page.querySelectorAll("[data-isw-ride-priority-select]")){
   const key=slot.dataset.iswRidePriorityKey;
   const control=createSelectControl({
    label:"Behaviour during ride-through",
    value:Number(slot.dataset.iswRidePrioritySelect),
    options:RIDE_THROUGH_PRIORITY_OPTIONS,
    variant:"adaptive",
    className:"isw-ride-priority-trigger",
    menuClassName:"isw-ride-priority-popover",
    registerPanel,
    close:closePanels,
    toggle:togglePanel,
    radius:30,
    menuWidth:220,
    align:"end",
    chooseLabel:"Choose ride-through behaviour",
    onChange:next=>{
     if(model.S.g[key]===next)return;
     model.S.g[key]=next;
     pendingFocus={type:"ridePriority",value:key};
     refresh();
    }
   });
   control.element.dataset.iswRidePriorityTrigger=key;
   slot.replaceWith(control.element);
  }
  for(const button of page.querySelectorAll("[data-isw-action]")){
   button.addEventListener("click",()=>runAction(button.dataset.iswAction,button));
  }
  for(const button of page.querySelectorAll("[data-isw-copy-value]")){
   button.addEventListener("click",async()=>{
    const label=button.dataset.iswCopyLabel||"Value";
    const copied=await copyText(button.dataset.iswCopyValue||"");
    notify(copied?`${label} copied`:`Could not copy ${label.toLowerCase()}`);
   });
  }
  for(const slot of page.querySelectorAll("[data-isw-interval-select]")){
   const control=createSelectControl({
    label:"Scan interval",
    value:Number(slot.dataset.iswIntervalSelect),
    options:MPPT_SCAN_INTERVAL_OPTIONS.map(option=>({
     value:option.minutes,
     label:option.label
    })),
    variant:"adaptive",
    className:"isw-interval-trigger",
    menuClassName:"isw-interval-popover",
    registerPanel,
    close:closePanels,
    toggle:togglePanel,
    radius:30,
    menuWidth:200,
    align:"end",
    chooseLabel:"Choose scan interval",
    onChange:next=>{
     if(model.S.mppt.interval===next)return;
     model.S.mppt.interval=next;
     pendingFocus={type:"interval"};
     refresh();
    }
   });
   control.element.dataset.iswIntervalTrigger="";
   slot.replaceWith(control.element);
  }
  hydrateTimeLabels(page);
  hydrateEconomy(page);
 }

function hydrateEconomy(page){
 const overview=page.querySelector(".isw-eco-overview");
 if(!overview)return;
 let ecoSequence=0;
 const periodFor=id=>model.S.eco.find(period=>period.id===id);
 const fieldError=(input,message)=>{
  showInlineFieldError(input,message);
 };
 const collides=(candidate,id)=>{
  const from=timeToMinutes(candidate.from),to=timeToMinutes(candidate.to);
  return model.S.eco.some(period=>{
   if(period.id===id)return false;
   const otherFrom=timeToMinutes(period.from),otherTo=timeToMinutes(period.to);
   return from<otherTo&&otherFrom<to;
  });
 };
 const sortPeriods=()=>model.S.eco.sort((a,b)=>{
  const draftDifference=Number(isEconomicDraft(a))-Number(isEconomicDraft(b));
  return draftDifference||timeToMinutes(a.from)-timeToMinutes(b.from);
 });
 for(const segment of page.querySelectorAll("[data-isw-eco-segment]")){
  const period=periodFor(segment.dataset.iswEcoSegment);
  if(!period)continue;
  segment.title=`${period.from} – ${period.to}`;
   bindHoverPanel(segment,`${period.from} – ${period.to}`,"Time range");
 }

 const info=page.querySelector("[data-isw-eco-info]");
 if(info)bindHoverPanel(info,"Power limit is a percentage of the inverter's rated output.","Power limit information",248);

 const openDeleteConfirm=(period,trigger)=>{
  let confirmed=false;
  createConfirmDialog({
   glass,
   title:"Delete this time range?",
   description:`${period.from} – ${period.to} will be removed from the Economic Schedule.`,
   confirmLabel:"Delete",
   cancelLabel:"Cancel",
   icon:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"plants-device-action-icon"),
   confirmClassName:"plants-device-danger-button",
   onConfirm:()=>{
    confirmed=true;
   },
   onClose:()=>{
    if(confirmed){
     model.S.eco=model.S.eco.filter(item=>item.id!==period.id);
     pendingFocus={type:"ecoAdd"};
     refresh();
     notify("Time range deleted in this local preview");
    }else if(trigger.isConnected){
     trigger.focus({preventScroll:true});
    }
   }
  });
 };

 const addSlot=page.querySelector("[data-isw-eco-add]");
 if(addSlot){
  const add=createStandardButton({
   label:"Add time range",
   iconOnly:true,
   className:"isw-eco-add",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"isw-eco-add-icon")
  });
  add.dataset.iswEcoAdd="";
  if(glass){
   glass.addSurface({host:add,radius:18});
   controlDisposers.push(()=>glass.removeSurface(add));
  }
  add.addEventListener("click",()=>{
   const id=`eco-${Date.now().toString(36)}-${++ecoSequence}`;
   model.S.eco.push({id,from:"00:00",to:"00:00",mode:"",powerPct:null});
   sortPeriods();
   pendingFocus={type:"ecoTime",id,field:"from"};
   refresh();
  });
  addSlot.replaceWith(add);
 }

 const validateRange=(period,from,to)=>{
  const candidate={...period,from,to};
  const fromMinutes=timeToMinutes(from),toMinutes=timeToMinutes(to);
  if(toMinutes<=fromMinutes)return "End time must be later than start time.";
  if(collides(candidate,period.id))return "Time ranges cannot overlap.";
  return "";
 };
 const formatTimeDigits=value=>{
  const digits=String(value||"").replace(/\D/g,"").slice(0,8).padEnd(8,"_");
  return `${digits.slice(0,2)}:${digits.slice(2,4)} – ${digits.slice(4,6)}:${digits.slice(6,8)}`;
 };
 const parseTimeDigits=value=>{
  const digits=String(value||"").replace(/\D/g,"");
  if(digits.length!==8)return null;
  const from=`${digits.slice(0,2)}:${digits.slice(2,4)}`;
  const to=`${digits.slice(4,6)}:${digits.slice(6,8)}`;
  if(timeToMinutes(from)===null||timeToMinutes(to)===null)return null;
  return {from,to};
 };
 const digitCountBefore=(value,index)=>String(value||"").slice(0,index).replace(/\D/g,"").length;
 const caretForDigitIndex=(value,digitIndex)=>{
  if(digitIndex<=0)return 0;
  let seen=0;
  for(let index=0;index<value.length;index+=1){
   if(/\d/.test(value[index]))seen+=1;
   if(seen===digitIndex)return index+1;
  }
  return value.length;
 };
 for(const field of page.querySelectorAll(".isw-eco-time-range-field")){
  const input=field.querySelector("[data-isw-eco-time-input]");
  const period=periodFor(input?.dataset.iswEcoTimeInput);
  if(!period)continue;
  const canonical=()=>`${period.from} – ${period.to}`;
  const clearError=()=>{
   clearInlineFieldError(input);
  };
  const showError=message=>{
   showInlineFieldError(input,message);
  };
  const reset=()=>{
   input.value=canonical();
   clearError();
  };
  const commit=()=>{
   if(input.value.replace(/\D/g,"").length!==8){
    showError("Enter eight digits for the start and end time.");
    return;
   }
   const parsed=parseTimeDigits(input.value);
   if(!parsed){
    showError("Enter valid times between 00:00 and 23:59.");
    return;
   }
   const error=validateRange(period,parsed.from,parsed.to);
   if(error){
    showError(error);
    return;
   }
   if(parsed.from===period.from&&parsed.to===period.to){
    input.value=canonical();
    clearError();
    return;
   }
   period.from=parsed.from;
   period.to=parsed.to;
   sortPeriods();
   pendingFocus={type:"ecoTime",id:period.id};
   syncActions();
   refresh();
  };
  input.addEventListener("input",()=>{
   const digitIndex=digitCountBefore(input.value,input.selectionStart??input.value.length);
   const digitLength=input.value.replace(/\D/g,"").slice(0,8).length;
   input.value=formatTimeDigits(input.value);
   clearError();
   const caret=caretForDigitIndex(input.value,Math.min(digitIndex,digitLength));
   input.setSelectionRange(caret,caret);
  });
  input.addEventListener("blur",()=>{
   setTimeout(()=>{
    const active=document.activeElement;
    if(field.contains(active)||active?.closest(".isw-eco-time-picker-popover"))return;
    commit();
   },0);
   });
  input.addEventListener("keydown",event=>{
   const selectionStart=input.selectionStart??input.value.length;
   const selectionEnd=input.selectionEnd??selectionStart;
   if((event.key==="Backspace"||event.key==="Delete")&&selectionStart===selectionEnd){
    event.preventDefault();
    const digits=input.value.replace(/\D/g,"").slice(0,8);
    const digitIndex=digitCountBefore(input.value,selectionStart);
    const removeIndex=event.key==="Backspace"?digitIndex-1:digitIndex;
    if(removeIndex<0||removeIndex>=digits.length)return;
    const nextDigits=digits.slice(0,removeIndex)+digits.slice(removeIndex+1);
    input.value=formatTimeDigits(nextDigits);
    clearError();
    const caret=caretForDigitIndex(input.value,removeIndex);
    input.setSelectionRange(caret,caret);
    return;
   }
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
    event.preventDefault();
    const digitIndex=digitCountBefore(input.value,selectionStart);
    const nextIndex=event.key==="ArrowLeft"
     ?Math.max(0,digitIndex-1)
     :Math.min(8,digitIndex+1);
    const caret=caretForDigitIndex(input.value,nextIndex);
    input.setSelectionRange(caret,caret);
    return;
   }
   if(event.key==="Enter"){
    event.preventDefault();
    input.blur();
   }else if(event.key==="Escape"){
    event.preventDefault();
    reset();
    const caret=input.value.length;
    input.setSelectionRange(caret,caret);
   }
  });
 }
 for(const trigger of page.querySelectorAll("[data-isw-eco-time-trigger]")){
  trigger.addEventListener("click",()=>{
   const period=periodFor(trigger.dataset.iswEcoTimeTrigger);
   if(!period||!registerPanel)return;
   const field=trigger.closest(".isw-eco-time-range-field");
   const input=field?.querySelector("[data-isw-eco-time-input]");
   togglePanel?.(trigger,()=>{
    const originalFrom=period.from,originalTo=period.to;
    const [fromHour,fromMinute]=originalFrom.split(":").map(Number);
    const [toHour,toMinute]=originalTo.split(":").map(Number);
    const draft={fromHour,fromMinute,toHour,toMinute};
    const updatePreview=()=>{
     if(input){
      const from=minutesToTime(draft.fromHour*60+draft.fromMinute);
      const to=minutesToTime(draft.toHour*60+draft.toMinute);
      input.value=`${from} – ${to}`;
      const error=validateRange(period,from,to);
      if(error)showInlineFieldError(input,error);
      else clearInlineFieldError(input);
     }
    };
    const panel=text("div","popover popover--menu isw-eco-time-picker-popover");
    const picker=text("div","isw-eco-time-picker");
    const buildGroup=(title,fromKey,toKey)=>{
     const group=text("div","isw-eco-time-wheel-group");
     group.setAttribute("aria-label",title);
     const buildWheel=(label,values,key)=>{
      const shell=text("div","isw-eco-time-wheel-shell");
      const highlight=text("span","isw-eco-time-wheel-highlight");
      highlight.setAttribute("aria-hidden","true");
      const wheel=text("div","isw-eco-time-wheel");
      wheel.setAttribute("role","listbox");
      wheel.setAttribute("aria-label",label);
      const list=text("div","isw-eco-time-wheel-list");
      const buttons=[];
      const centerButton=(button,{smooth=false}={})=>{
       if(!button)return;
       const top=Math.max(0,button.offsetTop-(wheel.clientHeight-button.offsetHeight)/2);
       wheel.scrollTo({top,behavior:smooth&&!reducedMotion()?"smooth":"auto"});
      };
      const selectButton=button=>{
       if(!button)return;
       draft[key]=Number(button.dataset.iswEcoTimeValue);
       for(const item of buttons){
        const isSelected=item===button;
        item.classList.toggle("is-selected",isSelected);
        item.setAttribute("aria-selected",String(isSelected));
       }
       updatePreview();
      };
      const centerCycleButton=value=>buttons.find(item=>
       Number(item.dataset.iswEcoTimeCycle)===2&&
       Number(item.dataset.iswEcoTimeValue)===Number(value)
      );
      for(let cycle=0;cycle<5;cycle+=1){
       for(const value of values){
        const button=text("button","isw-eco-time-value");
        button.type="button";
        button.textContent=String(value).padStart(2,"0");
        button.dataset.iswEcoTimeValue=String(value);
        button.dataset.iswEcoTimePart=key;
        button.dataset.iswEcoTimeCycle=String(cycle);
        button.setAttribute("role","option");
        button.setAttribute("aria-selected","false");
        button.addEventListener("click",()=>{
         const middle=centerCycleButton(value)||button;
         selectButton(middle);
         centerButton(middle,{smooth:true});
        });
        buttons.push(button);
        list.append(button);
       }
      }
      wheel.append(list);
      const initial=centerCycleButton(draft[key]);
      selectButton(initial);
      let scrollTimer=0;
      wheel.addEventListener("scroll",()=>{
       clearTimeout(scrollTimer);
       scrollTimer=setTimeout(()=>{
        const box=wheel.getBoundingClientRect();
        const middle=box.top+box.height/2;
        const closest=buttons.reduce((best,button)=>{
         const rect=button.getBoundingClientRect();
         const distance=Math.abs(rect.top+rect.height/2-middle);
         return !best||distance<best.distance?{button,distance}:best;
        },null);
        if(closest){
         const cycle=Number(closest.button.dataset.iswEcoTimeCycle);
         const recentered=cycle===0||cycle===4
          ?centerCycleButton(closest.button.dataset.iswEcoTimeValue)
          :closest.button;
         selectButton(recentered);
         if(recentered!==closest.button)centerButton(recentered);
        }
       },90);
      },{passive:true});
      requestAnimationFrame(()=>{
       centerButton(centerCycleButton(draft[key]));
      });
      controlDisposers.push(()=>clearTimeout(scrollTimer));
      shell.append(highlight,wheel);
      return shell;
     };
     group.append(
      buildWheel(`${title} hour`,Array.from({length:24},(_,index)=>index),fromKey),
      buildWheel(`${title} minute`,Array.from({length:60},(_,index)=>index),toKey)
     );
     return group;
    };
    const separator=text("span","isw-eco-time-separator","–");
    separator.setAttribute("aria-hidden","true");
    picker.append(
     buildGroup("Start time","fromHour","fromMinute"),
     separator,
     buildGroup("End time","toHour","toMinute")
    );
    panel.append(picker);
    panel._wdFade=picker;
    const mounted=registerPanel(panel,trigger,{
     label:"Choose start and end time",
     radius:30,
     align:"start",
     alignAnchor:field
    });
    const previousClose=mounted._onClose;
    mounted._onClose=()=>{
     previousClose?.();
     if(destroyed)return;
     const from=minutesToTime(draft.fromHour*60+draft.fromMinute);
     const to=minutesToTime(draft.toHour*60+draft.toMinute);
     if(from===originalFrom&&to===originalTo)return;
     const error=validateRange(period,from,to);
     if(error){
      if(input)showInlineFieldError(input,error);
      return;
     }
     period.from=from;
     period.to=to;
     sortPeriods();
     pendingFocus={type:"ecoTime",id:period.id};
     syncActions();
     requestAnimationFrame(()=>{
      if(!document.querySelector("#overlays .popover"))refresh();
     });
    };
    return mounted;
   });
  });
 }

 for(const input of page.querySelectorAll("[data-isw-eco-power]")){
  const range=settingRange("eco.power","%");
  input.addEventListener("keydown",event=>{
   if(event.key==="Enter"){
    event.preventDefault();
    input.blur();
   }
  });
  input.addEventListener("input",()=>{
   if(!input.value.trim()){
    clearInlineFieldError(input);
    return;
   }
   validateNumberField(input,{range});
  });
  input.addEventListener("change",()=>{
   const period=periodFor(input.dataset.iswEcoPower);
   if(!period)return;
   if(input.value.trim()===""){
    clearInlineFieldError(input);
    period.powerPct=null;
    pendingFocus={type:"ecoPower",id:period.id};
    refresh();
    return;
   }
   const validation=validateNumberField(input,{showEmpty:true,allowEmpty:false,range});
   if(!validation.valid)return;
   const value=validation.value;
   period.powerPct=Math.round(value);
   pendingFocus={type:"ecoPower",id:period.id};
   refresh();
  });
 }

 for(const slot of page.querySelectorAll("[data-isw-eco-mode-select]")){
  const period=periodFor(slot.dataset.iswEcoModeSelect);
  if(!period)continue;
  const control=createSelectControl({
   label:"Period mode",
   value:period.mode,
   options:ECONOMIC_MODES.map(option=>({value:option.id,label:option.label})),
   variant:"adaptive",
   className:"isw-eco-mode-trigger",
   placeholder:"--",
   placeholderClassName:"wd-select-placeholder",
   menuClassName:"isw-eco-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   radius:30,
   menuWidth:280,
   align:"end",
   chooseLabel:"Choose mode",
   onChange:next=>{
    if(period.mode===next)return;
    period.mode=next;
    pendingFocus={type:"ecoMode",id:period.id};
    refresh();
   }
  });
  control.element.dataset.iswEcoModeTrigger=period.id;
  slot.replaceWith(control.element);
 }

 for(const slot of page.querySelectorAll("[data-isw-eco-more-slot]")){
  const period=periodFor(slot.dataset.iswEcoMoreSlot);
  if(!period)continue;
  const button=createStandardButton({
   label:`Actions for ${period.from} – ${period.to}`,
   iconOnly:true,
   className:"isw-eco-more",
   icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"isw-eco-more-icon")
  });
  button.dataset.iswEcoMore=period.id;
  if(glass){
   glass.addSurface({host:button,radius:18});
   controlDisposers.push(()=>glass.removeSurface(button));
  }
  slot.replaceWith(button);
  button.addEventListener("click",()=>{
   if(!period||!registerPanel)return;
   togglePanel?.(button,()=>{
    const panel=text("div","popover popover--menu isw-eco-popover");
    const list=menuList();
    const row=menuRow("Delete",{
     iconNode:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"isw-eco-trash-icon"),
     showCheck:false,
     onSelect:()=>{
      closePanels?.(true);
      openDeleteConfirm(period,button);
     }
    });
    row.classList.add("isw-eco-delete-row");
    list.append(row);
    mountMenu(panel,{label:`Actions for ${period.from} – ${period.to}`,children:[list]});
    return registerPanel(panel,button,{
     label:`Actions for ${period.from} – ${period.to}`,
     radius:30,
     width:180,
     align:"end",
     alignRight:menuEndAlign(button,30)
    });
   });
  });
 }
}

 function runAction(action,button){
  if(action==="reload"){
   const count=model.devCount();
   model.loadProfile(model.S.gridCode);
   if(count)model.S.log.unshift({
    minutesAgo:0,
    operator:CURRENT_OPERATOR,
    changes:[
     {parameter:"Grid profile",from:`${count} changed value${count===1?"":"s"}`,to:"Certified default"},
     {parameter:"Protection and reconnection values",from:"Local overrides",to:"Profile defaults"},
     {parameter:"Reactive power curves",from:"Local overrides",to:"Profile defaults"}
    ]
   });
   refresh();
   return;
  }
  if(action==="ctRun"){
   model.S.ct.running=1;
   refresh();
   schedule(()=>{
    model.S.ct.running=0;
    model.S.ct.l3="ok";
    model.S.ct.lastMinutesAgo=0;
    refresh();
   },1400);
   return;
  }
  if(action==="power"){
   model.S.ops.running=model.S.ops.running?0:1;
   refresh();
   return;
  }
  if(action==="clear"){
   model.S.ops.faults=0;
   refresh();
   return;
  }
  if(action==="restart"||action==="factory"||action==="export"){
   const setLabel=label=>{
    const text=button.querySelector(".wd-control-label");
    if(text)text.textContent=label;
    else button.textContent=label;
    button.setAttribute("aria-label",label);
   };
   const original=button.querySelector(".wd-control-label")?.textContent||button.getAttribute("aria-label")||button.textContent;
   setLabel(action==="export"?"Preparing...":"Sent");
   schedule(()=>{
    if(button.isConnected)setLabel(original);
   },1200);
  }
 }

 function restoreFocus(){
  if(!pendingFocus)return;
  const focus=pendingFocus;
  pendingFocus=null;
  let target=null;
  if(focus.type==="switch")target=content.querySelector(`[data-isw-switch="${CSS.escape(focus.value)}"]`);
  if(focus.type==="segment")target=content.querySelector(`[data-isw-seg="${CSS.escape(focus.path)}"] [data-value="${CSS.escape(focus.value)}"]`);
  if(focus.type==="number")target=content.querySelector(`[data-isw-number="${CSS.escape(focus.value)}"]`);
  if(focus.type==="mode")target=content.querySelector(`[data-isw-mode="${CSS.escape(focus.value)}"]`);
  if(focus.type==="profile")target=content.querySelector(`[data-isw-profile="${CSS.escape(focus.value)}"]`);
  if(focus.type==="ecoTime")target=content.querySelector(`[data-isw-eco-time-trigger="${CSS.escape(focus.id)}"]`);
  if(focus.type==="ecoPower")target=content.querySelector(`[data-isw-eco-power="${CSS.escape(focus.id)}"]`);
  if(focus.type==="ecoMode")target=content.querySelector(`[data-isw-eco-mode-trigger="${CSS.escape(focus.id)}"]`);
  if(focus.type==="ecoAdd")target=content.querySelector("[data-isw-eco-add]");
  if(focus.type==="interval")target=content.querySelector("[data-isw-interval-trigger]");
  if(focus.type==="reacMode")target=content.querySelector("[data-isw-reac-mode-trigger]");
  if(focus.type==="ridePriority")target=content.querySelector(`[data-isw-ride-priority-trigger="${CSS.escape(focus.value)}"]`);
  target?.focus({preventScroll:true});
 }

 function clearModeAnimations(){
  const animations=modeAnimations;
  modeAnimations=[]; // detach before cancel so cleanup cannot be skipped
  for(const card of content.querySelectorAll(".isw-mode-card.is-mode-animating")){
   card.classList.remove("is-mode-animating");
   const description=card.querySelector(".isw-mode-description");
   if(description){
    description.style.removeProperty("display");
    description.style.removeProperty("opacity");
    description.style.removeProperty("transform");
   }
  }
  for(const animation of animations){
   try{animation.cancel();}catch{}
  }
  for(const card of content.querySelectorAll(".isw-mode-card.is-mode-animating")){
   card.classList.remove("isw-mode-animating");
   const description=card.querySelector(".isw-mode-description");
   if(description){
    description.style.removeProperty("display");
    description.style.removeProperty("opacity");
    description.style.removeProperty("transform");
   }
  }
 }

 function animateModeSelection(index,page){
  const cards=[...page.querySelectorAll(".isw-mode-card")];
  const before=cards.map(card=>card.getBoundingClientRect().height);
  const beforeDescriptions=cards.map(card=>{
   const description=card.querySelector(".isw-mode-description");
   if(!description)return 0;
   const style=getComputedStyle(description);
   const opacity=Number.parseFloat(style.opacity);
   return style.display==="none"||!Number.isFinite(opacity)?0:Math.max(0,Math.min(1,opacity));
  });
  clearModeAnimations();
  cards.forEach((card,cardIndex)=>{
   const selected=cardIndex===index;
   card.classList.toggle("is-selected",selected);
   card.setAttribute("aria-pressed",String(selected));
  });
  const after=cards.map(card=>card.getBoundingClientRect().height);
  if(reducedMotion()){
   clearModeAnimations();
   return;
  }
  const timing={
   duration:motionDuration("--wd-motion-panel"),
   easing:motionEasing("--wd-ease-panel")
  };
  const animations=[];
  cards.forEach((card,cardIndex)=>{
   const selected=cardIndex===index;
   const heightChanged=Math.abs(after[cardIndex]-before[cardIndex])>=.5;
   const description=card.querySelector(".isw-mode-description");
   const targetDescriptionOpacity=selected?1:0;
   const currentDescriptionOpacity=beforeDescriptions[cardIndex]??targetDescriptionOpacity;
   const descriptionChanged=description&&Math.abs(targetDescriptionOpacity-currentDescriptionOpacity)>.01;
   if(!heightChanged&&!descriptionChanged)return;
   card.classList.add("is-mode-animating");
   if(heightChanged){
    animations.push(card.animate(
     [{height:`${before[cardIndex]}px`},{height:`${after[cardIndex]}px`}],
     {...timing,fill:"both"}
    ));
   }
   if(descriptionChanged){
    description.style.display="block";
    animations.push(description.animate(
     [{opacity:currentDescriptionOpacity},{opacity:targetDescriptionOpacity}],
     {...timing,fill:"both"}
    ));
   }
  });
  modeAnimations=animations;
  schedule(()=>{
   if(modeAnimations!==animations)return;
   clearModeAnimations();
   scrollFeedback.sync();
   requestAnimationFrame(()=>scrollFeedback.sync());
  },timing.duration+40);
 }

function renderPage({animate=true,preserveScroll=true,crossfade=false,layoutSnapshot=null,subTransition=null,targetScrollTop=null}={}){
  if(!preserveScroll){
   scrollFeedback.cancelBottomShrink?.();
  }
  const previousScrollTop=scroll.scrollTop;
  const previousSurfaceHeights=animateNextSurfaceGrowth
   ?new Map([...content.querySelectorAll("[data-isw-surface-key]")].map(surface=>[surface.dataset.iswSurfaceKey,surface.getBoundingClientRect().height]))
   :null;
  animateNextSurfaceGrowth=false;
 const crossfadeViews=crossfade&&animate&&!reducedMotion();
 clearViewSwitch({preserveActive:crossfadeViews});
 const outgoingPage=crossfadeViews
   ?content.querySelector(".isw-page:not(.isw-page--leaving)")
   :null;
 const outgoingRect=outgoingPage
  ?(layoutSnapshot?.pageRect||outgoingPage.getBoundingClientRect())
  :null;
 let outgoingSnapshot=null;
 if(outgoingPage){
  outgoingSnapshot=outgoingPage;
  outgoingSnapshot.classList.add("isw-page--leaving");
  outgoingSnapshot.setAttribute("inert","");
  outgoingSnapshot.setAttribute("aria-hidden","true");
  outgoingSnapshot.style.inset="auto";
  const bodyRect=body.getBoundingClientRect();
  outgoingSnapshot.style.left=`${outgoingRect.left-bodyRect.left}px`;
  outgoingSnapshot.style.top=`${outgoingRect.top-bodyRect.top}px`;
  outgoingSnapshot.style.width=`${outgoingRect.width}px`;
  outgoingSnapshot.style.margin="0";
  outgoingSnapshot.style.opacity=String(Number.parseFloat(getComputedStyle(outgoingPage).opacity)||1);
  outgoingSnapshot.style.willChange="opacity";
  body.append(outgoingSnapshot);
 }
 const outgoingTitle=outgoingPage?titleLayer.querySelector(".isw-title-label")?.cloneNode(true):null;
  clearModeAnimations();
  destroyHydratedControls();
  closePanels?.(true);
  const page=text("div","isw-page");
  page.dataset.page=model.S.page;
  if(model.S.page==="grid")page.dataset.gridSub=model.S.gridSub;
  if(!animate||outgoingPage)page.classList.add("isw-page--instant");
  if(outgoingPage){
   page.style.opacity="0";
   page.style.willChange="opacity";
  page.classList.add("isw-page--incoming");
  }
  const renderer=PAGES[model.S.page];
  page.innerHTML=renderer?renderer(model):"";
  tagSurfaceKeys(page);
 const renderedTitle=page.querySelector(".isw-page-title");
 if(renderedTitle){
  renderedTitle.dataset.page=model.S.page;
  const titleLabel=text("span","isw-title-label",renderedTitle.textContent);
  renderedTitle.replaceChildren(titleLabel);
  renderedTitle.remove();
  titleLayer.replaceChildren(renderedTitle);
  titleLayer.dataset.page=model.S.page;
  titleLayer.hidden=false;
 }else{
  titleLayer.replaceChildren();
  delete titleLayer.dataset.page;
  titleLayer.hidden=true;
 }
 titleLayer.querySelectorAll(".isw-title-label--entering").forEach(label=>label.classList.remove("isw-title-label--entering"));
 if(animate&&!outgoingPage&&!reducedMotion()&&!titleLayer.hidden){
  const titleLabel=titleLayer.querySelector(".isw-title-label");
  if(titleLabel){
   void titleLayer.offsetWidth;
   titleLabel.classList.add("isw-title-label--entering");
  }
 }
 content.replaceChildren(page);
 const resetToTop=!preserveScroll&&!Number.isFinite(targetScrollTop);
 if(Number.isFinite(targetScrollTop))scroll.scrollTop=Math.max(0,targetScrollTop);
 else if(resetToTop)scroll.scrollTop=0;
  hydratePage(page);
 if(resetToTop)scroll.scrollTop=0;
  animateSurfaceGrowth(page,previousSurfaceHeights);
 if(outgoingSnapshot)crossfadeView(page,outgoingSnapshot,outgoingTitle,layoutSnapshot,subTransition);
 else if(!sub.hidden){
  sub.style.removeProperty("opacity");
  sub.style.removeProperty("will-change");
 }
  if(preserveScroll)scroll.scrollTop=previousScrollTop;
  const readonlyPage=model.S.page==="log"||model.S.page==="export";
  scroll.classList.toggle("isw-scroll--readonly",readonlyPage);
  syncActions();
  syncScrollState();
  scrollFeedback.sync();
  requestAnimationFrame(()=>{
   if(Number.isFinite(targetScrollTop)&&!destroyed)scroll.scrollTop=Math.max(0,targetScrollTop);
  if(resetToTop&&!destroyed)scroll.scrollTop=0;
   scrollFeedback.sync();
  });
  restoreFocus();
 if(resetToTop)scroll.scrollTop=0;
 }

 function renderSub(){
  const visible=model.S.gridOpen&&model.S.unlocked;
  sub.hidden=!visible;
  shell.classList.toggle("is-sub-open",visible);
  body.classList.toggle("is-sub-open",visible);
  if(visible)subList.replaceChildren(renderSubnav(model));
  scrollFeedback.sync();
 }

 function renderNavigation(){
  const previousNavScroll=navScroll.scrollTop;
  while(navDisposers.length)navDisposers.pop()();
  navContent.replaceChildren(renderNav(model));
  hydrateIcons(navContent);
  for(const heading of navContent.querySelectorAll("[data-isw-group]")){
   const content=heading.nextElementSibling;
   const group=heading.dataset.iswGroup;
   if(!content)continue;
   navDisposers.push(bindDisclosure(heading,content));
   const syncGroupState=()=>{
    model.S.navExpanded[group]=heading.getAttribute("aria-expanded")==="true";
    schedule(()=>navFeedback.sync(),0);
    schedule(()=>navFeedback.sync(),420);
   };
   heading.addEventListener("click",syncGroupState);
   navDisposers.push(()=>heading.removeEventListener("click",syncGroupState));
  }
  navContent.querySelectorAll("[data-isw-go]").forEach(button=>{
   button.addEventListener("click",()=>go(button.dataset.iswGo));
  });
  navScroll.scrollTop=previousNavScroll;
  syncNavTopFade();
  renderSub();
  navFeedback.sync();
  requestAnimationFrame(()=>{
   if(!destroyed)navScroll.scrollTop=previousNavScroll;
   if(!destroyed)syncNavTopFade();
  });
 }

 function syncNavigationValues(){
  for(const group of NAV_GROUPS){
   for(const item of group.items){
    const row=navContent.querySelector(`[data-isw-go="${CSS.escape(item.id)}"]`);
    if(!row)continue;
    const next=item.value(model);
    const current=row.querySelector(".isw-nav-value");
    if(!next)continue;
    if(current){
     current.textContent=next;
     current.classList.toggle("is-off",next==="Off");
    }
   }
  }
 }

 function syncNavigationSelection(){
  for(const button of navContent.querySelectorAll("[data-isw-go]")){
   const id=button.dataset.iswGo;
   const selected=id==="grid"?model.S.page==="grid":model.S.page===id;
   button.classList.toggle("is-selected",selected);
   button.classList.toggle("active",selected);
   if(selected)button.setAttribute("aria-current","page");
   else button.removeAttribute("aria-current");
   if(id==="grid"){
    button.classList.toggle("is-open",model.S.gridOpen);
    button.setAttribute("aria-expanded",String(model.S.gridOpen));
   }
  }
 }

 function currentPageLabel(){
  if(model.S.page==="grid"){
   return model.gridSubs().find(([id])=>id===model.S.gridSub)?.[1]||"Grid & Protection";
  }
  for(const group of NAV_GROUPS){
   const item=group.items.find(entry=>entry.id===model.S.page);
   if(item)return item.label;
  }
  return "this page";
 }

 function requestPageNavigation(next){
  if(!hasCurrentPageChanges()){
   next();
   return;
  }
  if(pageChangeConfirm)return;
  let switched=false;
  pageChangeConfirm=createConfirmDialog({
   glass,
   title:"Unsaved changes",
   description:`You have unsaved changes on ${currentPageLabel()}. Discard them before switching pages.`,
   confirmLabel:"Discard Changes",
   cancelLabel:"Keep Editing",
   icon:createMaskedIcon(assetURL("asset-32.svg"),"plants-device-action-icon"),
   danger:true,
   confirmClassName:"plants-device-danger-button",
   onConfirm:()=>{
    if(switched)return;
    switched=true;
    restoreCurrentPageSettings();
    next();
   },
   onClose:()=>{
    pageChangeConfirm=null;
   }
  });
 }

 function go(id){
  if(id!=="grid"&&id===model.S.page)return;
  pageScrollMemory.set(pageMemoryKey(),scroll.scrollTop);
 const currentPage=content.querySelector(".isw-page:not(.isw-page--leaving)");
 const currentTitle=titleLayer.querySelector(".isw-title-label");
 const subWasVisible=!sub.hidden;
 const subRect=subWasVisible?sub.getBoundingClientRect():null;
 const subSnapshot=subWasVisible?sub.cloneNode(true):null;
 const layoutSnapshot=currentPage?{
  pageRect:currentPage.getBoundingClientRect(),
  titleLeft:currentTitle?.getBoundingClientRect().left
 }:null;
  if(hasCurrentPageChanges()){
   requestPageNavigation(()=>go(id));
   return;
  }
  if(id==="grid"){
   const opening=!(model.S.page==="grid"&&model.S.gridOpen);
   model.S.gridOpen=opening;
   model.S.page="grid";
  }else{
   model.S.page=id;
   model.S.gridOpen=false;
  }
  syncNavigationSelection();
  renderSub();
 const subIsVisible=!sub.hidden;
 const subTransition=subWasVisible!==subIsVisible?{
  entering:!subWasVisible&&subIsVisible,
  leaving:subWasVisible&&!subIsVisible,
  rect:subRect,
  snapshot:subSnapshot
 }:null;
 const targetScrollTop=pageScrollMemory.get(pageMemoryKey())??0;
 renderPage({preserveScroll:false,crossfade:true,layoutSnapshot,subTransition,targetScrollTop});
  renderOverview(model,overview);
  syncGate({animate:true});
 }

 function refresh({header=false}={}){
  const scrollTop=scroll.scrollTop;
  if(header)renderDeviceHeader(model,device,deviceHead);
  syncNavigationValues();
  renderPage({animate:false});
  scroll.scrollTop=scrollTop;
  renderOverview(model,overview);
  syncGate();
  requestAnimationFrame(()=>{
   if(scroll.isConnected)scroll.scrollTop=scrollTop;
  });
 }

function setGateVisibility(shouldShow,{animate=false,preserveCardRect=null}={}){
 const gateCard=gate.querySelector(".isw-gate-card");
 const clearCardOffset=()=>{
  gateCard?.style.removeProperty("--isw-gate-card-exit-x");
  gateCard?.style.removeProperty("--isw-gate-card-exit-y");
 };
  if(!shouldShow&&gate.hidden){
   clearCardOffset();
   gateTransitionGeneration+=1;
   gateTransitionAnimation?.cancel();
   gateTransitionAnimation=null;
   return;
  }
  const version=++gateTransitionGeneration;
  const currentOpacity=gate.hidden?0:Number.parseFloat(getComputedStyle(gate).opacity);
  if(shouldShow&&!gate.hidden&&currentOpacity>=.999)return;
  gateTransitionAnimation?.cancel();
  gateTransitionAnimation=null;
  if(!shouldShow&&preserveCardRect&&gateCard){
   const current=gateCard.getBoundingClientRect();
   const x=(preserveCardRect.left+preserveCardRect.width/2)-(current.left+current.width/2);
   const y=(preserveCardRect.top+preserveCardRect.height/2)-(current.top+current.height/2);
   gateCard.style.setProperty("--isw-gate-card-exit-x",`${x.toFixed(2)}px`);
   gateCard.style.setProperty("--isw-gate-card-exit-y",`${y.toFixed(2)}px`);
  }else{
   clearCardOffset();
  }
  if(!animate||reducedMotion()){
   gate.hidden=!shouldShow;
   gate.inert=!shouldShow;
   gate.toggleAttribute("aria-hidden",!shouldShow);
   gate.style.removeProperty("opacity");
   gate.style.removeProperty("will-change");
   clearCardOffset();
   return;
  }
  if(shouldShow&&!(Number.isFinite(currentOpacity)&&currentOpacity<1))gate.style.opacity="0";
  else gate.style.opacity=String(Number.isFinite(currentOpacity)?currentOpacity:shouldShow?0:1);
  gate.hidden=false;
  gate.inert=!shouldShow;
  gate.toggleAttribute("aria-hidden",!shouldShow);
  if(shouldShow){
   const inputs=[...gate.querySelectorAll(".isw-code input")];
   (inputs.find(input=>!input.value)||inputs[0])?.focus({preventScroll:true});
  }
  gate.style.willChange="opacity";
  const animation=gate.animate(
   [{opacity:Number.isFinite(currentOpacity)?currentOpacity:shouldShow?0:1},{opacity:shouldShow?1:0}],
   shouldShow
    ?{duration:motionDuration("--wd-motion-view-switch-in"),delay:motionDuration("--wd-motion-view-switch-delay"),easing:motionEasing("--wd-ease-view-switch"),fill:"both"}
    :{duration:motionDuration("--wd-motion-view-switch-out"),easing:motionEasing("--wd-ease-view-switch-out"),fill:"both"}
  );
  gateTransitionAnimation=animation;
  animation.finished.then(()=>{
   if(version!==gateTransitionGeneration||destroyed)return;
   gateTransitionAnimation=null;
   gate.hidden=!shouldShow;
   gate.inert=!shouldShow;
   gate.toggleAttribute("aria-hidden",!shouldShow);
   gate.style.removeProperty("opacity");
   gate.style.removeProperty("will-change");
   clearCardOffset();
  }).catch(()=>{});
 }

function syncGate({animate=false,preserveCardRect=null}={}){
  const shouldShow=model.S.page==="grid"&&!model.S.unlocked;
  if(shouldShow&&!gate.childElementCount)renderGate();
  setGateVisibility(shouldShow,{animate,preserveCardRect});
}

 function renderGate(){
  const checkCode=String(device?.checkCode||"").padStart(4,"0").slice(-4);
  gate.innerHTML=`<section class="isw-gate-card wd-glass--surface" role="dialog" aria-modal="true" aria-labelledby="isw-gate-title">
   <span class="isw-gate-icon"><i data-isw-icon="lock"></i></span>
   <h2 id="isw-gate-title">Grid &amp; Protection</h2>
   <p>These settings change how the inverter behaves on the public grid, including when it disconnects and when it reconnects. Values outside the certified profile can leave the site non-compliant.<br>
   Enter the <b>Check code</b> printed on this unit's label. This is the same four-digit code shown on Devices.</p>
   <div class="isw-code" id="isw-code">${Array.from({length:4},(_,index)=>`<input maxlength="1" inputmode="numeric" data-isw-code-index="${index}" aria-label="Check code digit ${index+1}">`).join("")}</div>
   <p class="isw-code-plate">Prototype Check code: ${checkCode}</p>
   <button class="isw-gate-continue" type="button">Continue</button>
  </section>`;
  hydrateIcons(gate);
  modal.registerSurface(gate.querySelector(".isw-gate-card"),30,{interactive:false});
  const continueButton=createStandardButton({label:"Continue",variant:"primary",className:"isw-gate-continue"});
  gate.querySelector(".isw-gate-continue").replaceWith(continueButton);
  modal.registerSurface(continueButton,18);
  const inputs=[...gate.querySelectorAll(".isw-code input")];
  inputs.forEach((input,index)=>{
   input.addEventListener("input",()=>{
    input.value=input.value.replace(/\D/g,"");
    if(input.value&&index<inputs.length-1)inputs[index+1].focus();
    if(inputs.every(item=>item.value))tryUnlock(inputs);
   });
   input.addEventListener("keydown",event=>{
    if(event.key==="Backspace"&&!input.value&&index>0)inputs[index-1].focus();
   });
  });
  continueButton.addEventListener("click",()=>tryUnlock(inputs));
  gate.addEventListener("keydown",event=>{
   if(event.key!=="Tab")return;
   const focusable=[...gate.querySelectorAll("input,button")].filter(node=>!node.disabled&&node.getClientRects().length);
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  inputs[0].focus();
 }

 function tryUnlock(inputs){
  const value=inputs.map(input=>input.value).join("");
  const checkCode=String(device?.checkCode||"").padStart(4,"0").slice(-4);
  if(value===checkCode){
   const cardRect=gate.querySelector(".isw-gate-card")?.getBoundingClientRect()||null;
   model.S.unlocked=true;
   renderNavigation();
   renderPage();
   syncGate({animate:true,preserveCardRect:cardRect});
   return;
  }
  const code=gate.querySelector("#isw-code");
  code.classList.add("is-error");
  schedule(()=>{
   code.classList.remove("is-error");
   inputs.forEach(input=>input.value="");
   inputs[0]?.focus();
  },420);
 }

 function hasUnsavedChanges(){
  return settingsFingerprint(model.S)!==savedFingerprint;
 }

 function hasCurrentPageChanges(){
  const current=settingsSnapshot(model.S);
  const paths=pageSettingPaths(model.S,[current,savedSettings]);
  return scopedFingerprint(current,paths)!==scopedFingerprint(savedSettings,paths);
 }

 function restoreCurrentPageSettings(){
  const current=settingsSnapshot(model.S);
  const paths=pageSettingPaths(model.S,[current,savedSettings]);
  for(const path of paths)copyPath(model.S,savedSettings,path);
  if(model.S.page==="grid"&&!model.gridSubs().some(([id])=>id===model.S.gridSub))model.S.gridSub="code";
 }

 function currentPageCommittedSettings(){
  const next=clone(savedSettings);
  const current=settingsSnapshot(model.S);
  const paths=pageSettingPaths(model.S,[current,savedSettings]);
  for(const path of paths)copyPath(next,current,path);
  return next;
 }

 function sameLogValue(left,right){
  return JSON.stringify(left)===JSON.stringify(right);
 }

 function flattenChangedValues(before,after,prefix=[],target=[]){
  if(sameLogValue(before,after))return target;
  const collectionValue=value=>value&&typeof value==="object";
  if(collectionValue(before)||collectionValue(after)){
   const keys=Array.isArray(before)||Array.isArray(after)
    ?Array.from({length:Math.max(before?.length||0,after?.length||0)},(_,index)=>String(index))
    :[...new Set([...Object.keys(before||{}),...Object.keys(after||{})])];
   for(const key of keys)flattenChangedValues(before?.[key],after?.[key],[...prefix,key],target);
   return target;
  }
  target.push({path:prefix.join("."),before,after});
  return target;
 }

 function logFieldNode(path){
  const page=content.querySelector(".isw-page:not(.isw-page--leaving)");
  if(!page)return null;
  const escaped=CSS.escape(path);
  if(path==="mppt.interval")return page.querySelector("[data-isw-interval-trigger]");
  if(path==="g.reacMode")return page.querySelector("[data-isw-reac-mode-trigger]");
  if(path.endsWith(".reacQSet")||path==="reacQSet")return page.querySelector('[data-isw-number="reacQSet"]');
  return page.querySelector(
   `[data-isw-number="${escaped}"],[data-isw-switch="${escaped}"],[data-isw-seg="${escaped}"]`
  );
 }

 function logFieldLabel(path,node){
  if(path==="runMode")return "Running mode";
  const row=node?.closest(".isw-row");
  const rowLabel=row?.querySelector(".isw-row-label")?.textContent?.trim();
  if(rowLabel)return rowLabel;
  const tableRow=node?.closest(".isw-table-row");
  if(tableRow&&node?.matches?.("input[data-isw-number]")){
   return node.getAttribute("aria-label")?.trim()||path;
  }
  const controlLabel=node?.getAttribute?.("aria-label")?.split(":")[0]?.trim();
  if(controlLabel)return controlLabel;
  return path
   .replace(/([a-z])([A-Z])/g,"$1 $2")
   .replace(/[._]/g," ")
   .replace(/\b\w/g,letter=>letter.toUpperCase());
 }

 function logFieldValue(path,value,node){
  if(value===undefined)return "—";
  if(path==="runMode")return MODES[Number(value)]?.label||String(value);
  if(path==="dispatch.unit")return Number(value)?"kW":"%Pn";
  if(path==="capability")return CAPABILITY_OPTIONS[Number(value)]??String(value);
  if(path==="di")return DI_PORT_OPTIONS[Number(value)]??String(value);
  if(path==="net.iface")return NETWORK_INTERFACE_OPTIONS[Number(value)]??String(value);
  if(path==="exp.fmt")return EXPORT_FORMAT_OPTIONS[Number(value)]??String(value);
  if(path==="mppt.interval")return Number(value)===60?"1 h":`${value} mins`;
  if(/^mppt\.pv\.\d+$/.test(path))return MPPT_SOURCE_OPTIONS[Number(value)]??String(value);
  if(path.endsWith("reacMode"))return REACTIVE_MODE_OPTIONS.find(option=>Number(option.value)===Number(value))?.label||String(value);
  if(path.endsWith("rampMode"))return POWER_CHANGE_OPTIONS[Number(value)]??String(value);
  if(path.endsWith("puOn"))return P_U_MODE_OPTIONS[Number(value)]??String(value);
  if(path.endsWith("ofpRef"))return F_P_REFERENCE_OPTIONS[Number(value)]??String(value);
  if(path.endsWith("lvrtPm")||path.endsWith("hvrtPm"))return RIDE_THROUGH_PRIORITY_OPTIONS.find(option=>Number(option.value)===Number(value))?.label||String(value);
  if(path.endsWith("quLimit"))return REACTIVE_LIMIT_OPTIONS[Number(value)]??String(value);
  if(node?.matches?.("[data-isw-switch]"))return Number(value)?"On":"Off";
  if(node?.matches?.("input[data-isw-number]")){
   const decimals=Number(node.dataset.iswDecimals??1);
   const unit=node.closest(".isw-number,.isw-mini-number")?.querySelector(".isw-number-unit")?.textContent?.trim()||"";
   return `${Number(value).toFixed(decimals)}${unit?` ${unit}`:""}`;
  }
  if(typeof value==="boolean")return value?"On":"Off";
  return String(value);
 }

 function economicScheduleLogChanges(before=[],after=[]){
  const byId=new Map(before.map(period=>[period.id,period]));
  const afterById=new Map(after.map(period=>[period.id,period]));
  const format=period=>period
   ?`${period.from}–${period.to} · ${ECONOMIC_MODES.find(mode=>mode.id===period.mode)?.label||period.mode||"--"} · ${period.powerPct==null?"--":`${period.powerPct}%`}`
   :"Removed";
  const changes=[];
  for(const period of after){
   const previous=byId.get(period.id);
   if(!previous){
    changes.push({parameter:`Economic schedule · ${period.from}–${period.to}`,from:"Not configured",to:format(period)});
   }else if(!sameLogValue(previous,period)){
    changes.push({parameter:`Economic schedule · ${period.from}–${period.to}`,from:format(previous),to:format(period)});
   }
  }
  for(const period of before){
   if(!afterById.has(period.id))changes.push({parameter:`Economic schedule · ${period.from}–${period.to}`,from:format(period),to:"Removed"});
  }
  return changes;
 }

 function savedChangeLog(){
  if(model.S.page==="grid"&&model.S.gridSub==="code")return [];
  const current=settingsSnapshot(model.S);
  const paths=pageSettingPaths(model.S,[current,savedSettings]);
  const changes=[];
  for(const path of paths){
   const before=readPath(savedSettings,path);
   const after=readPath(current,path);
   if(!before.exists||!after.exists||sameLogValue(before.value,after.value))continue;
   if(path.length===1&&path[0]==="eco"){
    changes.push(...economicScheduleLogChanges(before.value,after.value));
    continue;
   }
   for(const leaf of flattenChangedValues(before.value,after.value,path)){
    const node=logFieldNode(leaf.path);
    changes.push({
     parameter:logFieldLabel(leaf.path,node),
     from:logFieldValue(leaf.path,leaf.before,node),
     to:logFieldValue(leaf.path,leaf.after,node)
    });
   }
  }
  return changes;
 }

 function closeWindow({force=false}={}){
  closePanels?.(true);
  if(!force&&hasUnsavedChanges()){
   createConfirmDialog({
    glass,
    title:"Unsaved changes",
    description:"You have unsaved changes. Exit directly will not save these changes.",
    confirmLabel:"Discard Changes",
    cancelLabel:"Keep Editing",
    icon:createMaskedIcon(assetURL("asset-32.svg"),"plants-device-action-icon"),
    danger:false,
    confirmClassName:"plants-device-danger-button",
    onConfirm:()=>closeWindow({force:true})
   });
   return;
  }
  closeNavigationAfterExit=true;
  modal.close({restoreFocus:true});
 }

 function revertChanges(){
  const currentPage=content.querySelector(".isw-page");
  const pageId=model.S.page;
  const previousProfile=model.S.gridCode;
  const previousScrollTop=scroll.scrollTop;
  restoreCurrentPageSettings();
  pendingFocus=null;
  renderDeviceHeader(model,device,deviceHead);
  syncNavigationValues();
  if(previousProfile!==model.S.gridCode)renderSub();
  renderOverview(model,overview);
  syncGate();
  if(pageId==="mode"&&currentPage){
   animateModeSelection(model.S.runMode,currentPage);
   scroll.scrollTop=previousScrollTop;
   syncActions();
   syncScrollState();
  }else{
   renderPage({animate:false,preserveScroll:true});
  }
  notify("Changes reverted in this local preview");
  requestAnimationFrame(()=>scroll.focus({preventScroll:true}));
 }

 subList.addEventListener("click",event=>{
  const item=event.target.closest("[data-isw-sub]");
  if(!item||!model.S.unlocked)return;
  if(item.dataset.iswSub===model.S.gridSub)return;
  requestPageNavigation(()=>{
   pageScrollMemory.set(pageMemoryKey(),scroll.scrollTop);
   model.S.gridSub=item.dataset.iswSub;
   renderSub();
   renderPage({crossfade:true,targetScrollTop:pageScrollMemory.get(pageMemoryKey())??0});
  });
 });
 cancel.addEventListener("click",revertChanges);
 close.addEventListener("click",closeWindow);
 save.addEventListener("click",()=>{
  try{
   const invalidField=content.querySelector(".isw-number.is-invalid input,.isw-mini-number.is-invalid input,.isw-eco-percent-field.is-invalid input,.isw-eco-time-range-field.is-invalid input");
   if(invalidField){
    invalidField.focus({preventScroll:true});
    return;
   }
   const draft=model.S.page==="eco"?model.S.eco.find(isEconomicDraft):null;
   if(draft){
    notify("Complete or delete the empty time range before saving.");
    content.querySelector(`[data-isw-eco-row="${CSS.escape(draft.id)}"] [data-isw-eco-time-trigger]`)?.focus();
    return;
   }
   const committed=currentPageCommittedSettings();
   const committedState=clone(model.S);
   const current=settingsSnapshot(model.S);
   for(const path of pageSettingPaths(model.S,[current,committed]))copyPath(committedState,committed,path);
   const changes=savedChangeLog();
   if(changes.length)model.S.log.unshift({
    minutesAgo:0,
    operator:CURRENT_OPERATOR,
    changes
   });
   if(device)device.inverterSettings=clone(committedState);
   if(device&&model.S.page==="mode"){
    const mode=MODES[committedState.runMode].label;
    device.mode=/ Mode$/i.test(mode)?mode:`${mode} mode`;
   }
   onSave?.(clone(committedState));
   savedSettings=committed;
   savedFingerprint=JSON.stringify(savedSettings);
   syncActions();
   notify("Inverter settings saved in this local preview");
   const original=save.querySelector(".wd-control-label")?.textContent||"Save";
   const label=save.querySelector(".wd-control-label");
   if(label)label.textContent="Saved";
   schedule(()=>{
    if(label)label.textContent=original;
   },1100);
  }catch(error){
   console.error(error);
   notify("Could not save inverter settings");
  }
 });
 modal.layer.addEventListener("keydown",event=>{
  if(event.key!=="Escape")return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(!gate.hidden){
   setGateVisibility(false,{animate:true});
  }
 },true);

 renderNavigation();
 renderPage();
 renderOverview(model,overview);
 syncGate();
 if(!reducedMotion()){
  const startStatusEntrance=()=>{
   if(destroyed||!statusWindow.isConnected)return;
   if(document.documentElement.dataset.ready!=="true"){
    statusEntranceFrame=requestAnimationFrame(startStatusEntrance);
    return;
   }
   statusEntranceFrame=requestAnimationFrame(()=>{
    statusEntranceFrame=requestAnimationFrame(()=>{
     if(destroyed||!statusWindow.isConnected)return;
     const clear=event=>{
      if(event.target!==statusWindow||event.animationName!=="isw-status-window-float-in")return;
      statusWindow.classList.remove("isw-status-window--entering");
      statusWindow.removeEventListener("animationend",clear);
     };
     statusWindow.addEventListener("animationend",clear);
     statusWindow.classList.add("isw-status-window--entering");
    });
   });
  };
  statusEntranceFrame=requestAnimationFrame(startStatusEntrance);
 }

 return {
  root,
  modal,
  destroy(){
   destroyed=true;
    cancelAnimationFrame(statusEntranceFrame);
    statusWindow.classList.remove("isw-status-window--entering");
   viewSwitchGeneration+=1;
   gateTransitionGeneration+=1;
   for(const animation of viewSwitchAnimations)animation.cancel();
   viewSwitchAnimations=[];
   gateTransitionAnimation?.cancel();
   gateTransitionAnimation=null;
   for(const id of timerIds)clearTimeout(id);
   timerIds.clear();
   shellEvents.abort();
   for(const dispose of navDisposers)dispose();
   navDisposers.length=0;
   destroyHydratedControls();
   destroyHydratedSwitches();
   destroyHydratedSegmentedControls();
   scrollFeedback.destroy();
   navFeedback.destroy();
   modal.close({immediate:true,restoreFocus:false});
  },
  hasUnsavedSettings(){
   return hasUnsavedChanges();
  }
 };
}

export function openInverterSettings({
 plant,
 device,
 glass,
 onClose,
 onSave,
 toast,
 registerPanel,
 togglePanel,
 closePanels
}){
 if(!device||device.type!=="inverter"){
  toast?.("Inverter settings are available only for an inverter.");
  onClose?.();
  return null;
 }
 const detectedRunMode=modeIndexFromLabel(device.mode);
 const model=createSettingsModel({
  ratedPower:device.ratedPowerKw,
  runMode:detectedRunMode>=0?detectedRunMode:0
 });
 if(device.inverterSettings){
  Object.assign(model.S,clone(device.inverterSettings));
  model.normalizeEco();
 }
 return createWindow({
  device,
  model,
  glass,
  toast,
  onCancel:onClose,
  onSave:state=>onSave?.(state),
  registerPanel,
  togglePanel,
  closePanels
 });
}

