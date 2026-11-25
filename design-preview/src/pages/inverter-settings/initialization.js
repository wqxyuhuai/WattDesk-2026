import {createTextElement as text} from "../../foundations/dom.js";
import {createStandardButton} from "../../components/controls.js";
import {createMaskedIcon,assetURL,opaqueMaskURL,SETTINGS_ICON_FILES,SETTINGS_REFERENCE_IMAGE_URLS} from "../../components/icons.js";
import {createModalDialog} from "../../components/modal-dialog.js";
import {createConfirmDialog} from "../../components/confirm-dialog.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {createSearchField} from "../../components/search-surface.js";
import {createSegmentedControl} from "../../components/segmented-control.js";
import {createSelectControl} from "../../components/select-control.js";
import {createToggleSwitch} from "../../components/toggle-switch.js";
import {menuList,menuRow,mountMenu} from "../../components/menu-popover.js";
import {menuEndAlign} from "../../components/popover.js";
import {prepareControlStates} from "../../components/control-states.js";
import {createTimeRangeControl} from "../../components/time-range-control.js";
import {makeNavRow} from "../../components/navigation.js";
import {createSettingsModeMotion} from "../../components/settings-mode-motion.js";
import {createHoverPanelBinder} from "../../components/hover-panel.js";
import {createMpptGroupEditor,MPPT_PARALLEL_HINT} from "../../components/mppt-group-editor.js";
import {animateSettingsPageTransition} from "../../components/settings-page-transition.js";
import {animateContentHeight,reducedMotion} from "../../foundations/motion.js";
import {createSettingsModel,ECONOMIC_MODES,timeToMinutes,MODES} from "./settings-model.js";
import {
 EXPORT_PERMISSION_OPTIONS,
 IMPORT_PERMISSION_OPTIONS,
 MPPT_SOURCE_OPTIONS,
 TOU_PERIOD_MODES
} from "./settings-options.js";
import {batteryConfigurationFields,batteryValidationError} from "./battery-editor.js";
import {filterGridProfiles,gridProfileEntries} from "./grid-profile-editor.js";
import {
 requiresBatteryExportConfirmation,
 scheduleSegments,
 sortSchedulePeriods,
 validateSchedulePeriods,
 validateScheduleRange
} from "./schedule-editor.js";

const SETUP_VARIANTS=Object.freeze({
 "20kw":Object.freeze({
  id:"20kw",
  label:"20 kW series",
  shortLabel:"20 kW",
  model:"MATIC-20KW-50A",
  serialPrefix:"1M20K",
  ratedPower:20,
  batteryPathCount:1,
  supportsBatteryParallel:false,
  mpptInventoryPoints:[1,2,3,4,5],
  mpptParallel:true,
  batteryImage:SETTINGS_REFERENCE_IMAGE_URLS.battery20kw,
  pvImage:SETTINGS_REFERENCE_IMAGE_URLS.pv20kw
 }),
 "50kw":Object.freeze({
  id:"50kw",
  label:"50 kW series",
  shortLabel:"50 kW",
  model:"MATIC-50KW-50A",
  serialPrefix:"1M50K",
  ratedPower:50,
  batteryPathCount:2,
  supportsBatteryParallel:true,
  mpptInventoryPoints:[1,2,3,4,5],
  mpptParallel:true,
  batteryImage:SETTINGS_REFERENCE_IMAGE_URLS.battery50kw,
  pvImage:SETTINGS_REFERENCE_IMAGE_URLS.pv50kw
 })
});

const MPPT_SOURCE_SELECT_OPTIONS=MPPT_SOURCE_OPTIONS.map((label,value)=>({value,label}));
const MODE_ICON_FILES=Object.freeze({
 mode:SETTINGS_ICON_FILES.generalMode,
 cap:SETTINGS_ICON_FILES.peakLoadShiftingMode,
 tariff:SETTINGS_ICON_FILES.economicMode,
 batt:SETTINGS_ICON_FILES.upsMode,
 clock:SETTINGS_ICON_FILES.timeOfUseMode,
 offgrid:SETTINGS_ICON_FILES.offGridMode
});
const SETUP_STEP_ICONS=Object.freeze({
 grid:SETTINGS_ICON_FILES.gridProtection,
 battery:SETTINGS_ICON_FILES.batteryManagement,
 mppt:SETTINGS_ICON_FILES.mpptStrings,
 limits:SETTINGS_ICON_FILES.feedInImportLimits,
 mode:SETTINGS_ICON_FILES.runningMode,
 schedule:SETTINGS_ICON_FILES.economicSchedule
});
const CHECK_CIRCLE_PATH="M13 22.75C18.3848 22.75 22.75 18.3848 22.75 13C22.75 7.61522 18.3848 3.25 13 3.25C7.61522 3.25 3.25 7.61522 3.25 13C3.25 18.3848 7.61522 22.75 13 22.75ZM17.7535 10.0071C18.1071 10.3468 18.1156 10.9059 17.7725 11.256L13.4806 15.6347C13.4727 15.6428 13.4647 15.6509 13.4568 15.659C13.2239 15.8967 13.0103 16.1146 12.8181 16.2791C12.6137 16.454 12.3593 16.6355 12.0296 16.724C11.5736 16.8463 11.0883 16.8017 10.6628 16.5983C10.3551 16.4513 10.1388 16.2265 9.97054 16.0174C9.81221 15.8206 9.64281 15.5675 9.4581 15.2915C9.45181 15.2821 9.44549 15.2726 9.43916 15.2632L8.1246 13.2991C7.85245 12.8924 7.96483 12.3444 8.37559 12.075C8.78636 11.8056 9.33997 11.9169 9.61211 12.3235L10.9267 14.2876C11.1367 14.6013 11.2627 14.7882 11.3661 14.9167C11.388 14.9438 11.4058 14.9644 11.4198 14.9798C11.4411 15.0031 11.4683 15.0216 11.4998 15.0245C11.5311 15.0274 11.5612 15.0142 11.5864 14.9953C11.6031 14.9827 11.6245 14.9657 11.6511 14.9429C11.7767 14.8354 11.9353 14.6748 12.2 14.4047L16.4919 10.026C16.835 9.67592 17.3998 9.66748 17.7535 10.0071Z";

function setupNavCheckIcon(){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.classList.add("isw-setup-nav-check");
 svg.setAttribute("viewBox","3.25 3.25 19.5 19.5");
 svg.setAttribute("shape-rendering","geometricPrecision");
 svg.setAttribute("aria-hidden","true");
 const path=document.createElementNS("http://www.w3.org/2000/svg","path");
 path.setAttribute("d",CHECK_CIRCLE_PATH);
 path.setAttribute("fill","currentColor");
 path.setAttribute("fill-rule","evenodd");
 svg.append(path);
 return svg;
}

function errorText(message){
 return text("p","isw-setup-error",message,"Footnote/Regular");
}

function detailRow(label,hint,control,{className=""}={}){
 const row=text("div",`isw-row isw-setup-row${className?` ${className}`:""}`);
 const copy=text("div","isw-row-copy isw-setup-row-copy");
 copy.append(text("div","isw-row-label isw-setup-row-label",label,"14/14 medium"));
 if(hint)copy.append(text("div","isw-row-hint isw-setup-row-hint",hint,"Footnote/Regular"));
 row.append(copy,control);
 return row;
}

function card(children,{className=""}={}){
 const node=text("section",`isw-panel isw-setup-card${className?` ${className}`:""}`);
 node.append(...children.filter(Boolean));
 return node;
}

function groupTitle(label){
 return text("h3","isw-group-title",label,"Footnote/Emphasized");
}

function variantDevice(baseDevice,variant){
 const serial=String(baseDevice?.serial||`${variant.serialPrefix}25B0000`);
 const nextSerial=serial.startsWith("1M20K")||serial.startsWith("1M50K")
  ?`${variant.serialPrefix}${serial.slice(5)}`
  :serial;
 return {
  ...(baseDevice||{}),
  name:`iHybrid ${variant.shortLabel}`,
  model:variant.model,
  serial:nextSerial,
  ratedPowerKw:variant.ratedPower,
  phaseCount:3,
  supportsPerPhaseLimit:true,
  batteryPathCount:variant.batteryPathCount,
  supportsBatteryParallel:variant.supportsBatteryParallel,
  batteryMasterBattery:variant.batteryPathCount===2?"bank1":null,
  mpptInventoryPoints:[...variant.mpptInventoryPoints],
  mpptGroupPoints:variant.id==="50kw"?[1,1,3,4]:[1,2,3,4],
  status:"online",
  running:"Stopped"
 };
}

function numericField({label,value,unit,onInput,min=0,max=1000,step=1,compact=false}){
 const host=text("span",`${compact?"isw-mini-number":"isw-number"} wd-edit-field`);
 const input=text("input","");
 input.type="text";
 input.inputMode="decimal";
 input.value=Number(value).toFixed(0);
 input.min=String(min);
 input.max=String(max);
 input.step=String(step);
 input.setAttribute("aria-label",`${label}${unit?`, ${unit}`:""}`);
 input.addEventListener("input",()=>{
  host.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  onInput(input.value);
 });
 host.append(input);
 if(unit)host.append(text("span","isw-number-unit",unit));
 return host;
}

function profileList({state,profileEntries,onSelect,filter=""}){
 const matches=filterGridProfiles(profileEntries,filter);
 const list=text("section","isw-profile-list isw-setup-profile-list");
 list.dataset.setupProfileList="";
 for(const entry of matches){
  const option={value:entry.key,label:entry.label,description:entry.description};
  const button=text("button","isw-profile-row isw-setup-profile wd-control-state");
  button.type="button";
  button.dataset.setupGridProfile=option.value;
  button.classList.toggle("is-selected",state.gridCode===option.value);
  button.setAttribute("aria-pressed",String(state.gridCode===option.value));
  const mark=text("i","isw-radio-mark isw-setup-radio");
  const copy=text("span","isw-profile-copy isw-setup-profile-copy");
  copy.append(
   text("span","isw-profile-name isw-setup-profile-label",option.label,"14/14 medium"),
   text("span","isw-profile-full isw-setup-profile-description",option.description,"Footnote/Regular")
  );
  button.append(mark,copy);
  button.addEventListener("click",()=>onSelect(option.value));
  list.append(button);
 }
 if(!matches.length)list.append(text("p","isw-setup-empty","No grid profile matches this search.","Footnote/Regular"));
 return list;
}

function batteryCard({title,data,numberInput,glass,registerPanel,close,toggle,addDisposer}){
 const fields=Object.fromEntries(batteryConfigurationFields({key:title,label:title,data}).map(field=>[field.id,field]));
 const body=[];
 body.push(detailRow(fields.brand.label,fields.brand.hint,(()=>{
  const slot=text("span","isw-setup-select");
  const control=createSelectControl({
   label:`${title} battery brand`,
   value:fields.brand.value,
   options:fields.brand.options,
   variant:"adaptive",
   onChange:value=>{data.brand=value;},
   className:"isw-setup-battery-brand",
   registerPanel,
   close,
   toggle
  });
  addDisposer(()=>control.destroy());
  slot.append(control.element);
  return slot;
 })()));
  let protocolControl=null;
  const bmsSwitch=createToggleSwitch({
   label:`${title} BMS communication`,
   checked:fields.enabled.value,
   glass,
   onChange:value=>{
    data.enabled=value?1:0;
    if(protocolControl){
     protocolControl.element.disabled=!value;
     protocolControl.element.setAttribute("aria-disabled",String(!value));
    }
   }
  });
  addDisposer(()=>bmsSwitch.destroy());
  body.push(detailRow(fields.enabled.label,fields.enabled.hint,bmsSwitch.element,{className:"isw-setup-row--switch"}));
 body.push(detailRow(
  fields.protocol.label,
  fields.protocol.hint,
  (()=>{
   const slot=text("span","isw-setup-select");
   const control=createSelectControl({
    label:`${title} battery protocol`,
    value:fields.protocol.value,
    options:fields.protocol.options,
    variant:"adaptive",
    onChange:value=>{data.protocol=value;},
    className:"isw-setup-battery-protocol",
    registerPanel,
    close,
    toggle
   });
   protocolControl=control;
   if(!data.enabled){
    control.element.disabled=true;
    control.element.setAttribute("aria-disabled","true");
   }
   addDisposer(()=>control.destroy());
   slot.append(control.element);
   return slot;
  })()
 ));
 body.push(detailRow(fields.chargeMax.label,fields.chargeMax.hint,numberInput({
  label:`${title} maximum charge current`,
  value:fields.chargeMax.value,
  unit:fields.chargeMax.unit,
  onInput:value=>{data.chargeMax=value;}
 })));
 body.push(detailRow(fields.dischargeMax.label,fields.dischargeMax.hint,numberInput({
  label:`${title} maximum discharge current`,
  value:fields.dischargeMax.value,
  unit:fields.dischargeMax.unit,
  onInput:value=>{data.dischargeMax=value;}
 })));
 return card(body,{className:"isw-setup-battery-card"});
}

function setupFigure({src,alt,caption}){
 const figure=text("figure","isw-panel isw-setup-figure");
 const img=text("img","isw-setup-figure-image");
 img.src=src;
 img.alt=alt;
 img.loading="eager";
 img.decoding="async";
 figure.append(img,text("figcaption","isw-setup-figure-caption",caption,"Footnote/Regular"));
 return figure;
}

function applicationIcon(name){
 return createMaskedIcon(assetURL(MODE_ICON_FILES[name]),"isw-icon isw-setup-mode-icon");
}

export function openInitializationWizard({
 plant,
 device,
 variant:variantId,
 glass,
 toast,
 registerPanel,
 toggle,
 close,
 onClose
}={}){
 const variant=SETUP_VARIANTS[variantId];
 if(!variant){
  toast?.("Initialization preview is unavailable.");
  onClose?.();
  return null;
 }
 const setupDevice=variantDevice(device,variant);
 const model=createSettingsModel({
  ratedPower:variant.ratedPower,
  phaseCount:3,
  supportsPerPhaseLimit:true,
  batteryPathCount:variant.batteryPathCount,
  supportsBatteryParallel:variant.supportsBatteryParallel,
  batteryMasterBattery:setupDevice.batteryMasterBattery,
  mpptInventoryPoints:variant.mpptInventoryPoints,
  mpptGroupPoints:setupDevice.mpptGroupPoints,
  supportsDynamicPricing:false,
  deviceOnline:true
 });
 const state=model.S;
 state.runMode=0;
 state.battery.parallel=0;
 state.mppt.parallel=0;
 state.mppt.pv=Array.from({length:model.capabilities.mpptCount},()=>0);
 state.limits.feedOn=1;
 state.limits.feed=Math.round(variant.ratedPower*.7);
 state.limits.impOn=0;
 state.limits.imp=Math.min(variant.ratedPower,63);
 state.gridCode="de_vde4105";
 model.loadProfile(state.gridCode);
 state.eco=[
  {id:"setup-eco-1",from:"00:00",to:"05:00",mode:"charge_pv_grid",powerPct:100},
  {id:"setup-eco-2",from:"17:00",to:"21:00",mode:"discharge",powerPct:90}
 ];
 state.tou.manual=[
  {id:"setup-tou-1",from:"00:00",to:"06:00",mode:0,power:100,pvForbidden:0},
  {id:"setup-tou-2",from:"18:00",to:"22:00",mode:4,power:80,pvForbidden:0}
 ];

 const root=text("div","inverter-settings-window isw-main-window isw-setup-window");
 root.dataset.setupVariant=variant.id;
 const header=text("header","isw-setup-header");
 const titleIcon=text("span","isw-setup-title-icon");
 titleIcon.append(createMaskedIcon(assetURL(SETTINGS_ICON_FILES.settings||"settings.svg"),"isw-setup-title-glyph"));
 const closeSetupButton=createStandardButton({
  label:"Close initialization",
  iconOnly:true,
  className:"isw-setup-close",
  icon:createMaskedIcon(assetURL("tab-close.svg"),"plants-device-action-icon")
 });
 header.append(titleIcon,text("h1","isw-setup-title","Parameter Setup Wizard","Subheadline/Emphasized"),closeSetupButton);

 const body=text("div","isw-shell isw-setup-shell");
 const rail=text("nav","isw-nav isw-setup-rail");
 rail.setAttribute("aria-label","Initialization steps");
 const railScroll=text("div","isw-nav-scroll");
 const railContent=text("div","isw-nav-content");
 railScroll.append(railContent);
 rail.append(railScroll);

 const main=text("section","isw-body wd-main-panel");
 const contentPane=text("div","isw-content-pane");
 const pageScroll=text("div","isw-scroll");
 pageScroll.tabIndex=0;
 const pageHost=text("div","isw-page isw-page--instant isw-setup-page");
 pageScroll.append(pageHost);
 const titleLayer=text("div","isw-title-layer");
 const pageTitle=text("h2","isw-page-title");
 const pageTitleLabel=text("span","isw-title-label","Grid code");
 pageTitle.append(pageTitleLabel);
 pageTitle.tabIndex=-1;
 titleLayer.append(pageTitle);
 const titleRule=text("div","isw-title-rule");
 const footer=text("footer","isw-actions");
 contentPane.append(pageScroll,titleLayer,titleRule,footer);
 main.append(contentPane);
 body.append(rail,main);
 root.append(header,body);

 let closing=false;
 const closeWizard=()=>{
  if(closing)return;
  closing=true;
  if(document.documentElement.dataset.standaloneSettings==="true")window.location.assign("/settings");
  else modal.close();
 };
 const modal=createModalDialog({
  glass,
  title:"Parameter Setup Wizard",
  className:"inverter-settings-dialog isw-setup-dialog",
  showHeader:false,
  showClose:false,
  closeOnBackdrop:false,
  closeOnEscape:false,
  panelMaterial:true,
  content:root,
  onClose:()=>{
   for(const dispose of pageDisposers.splice(0))dispose();
   scrollFeedback?.destroy();
   navFeedback?.destroy();
   onClose?.();
  }
 });
 modal.dialog.classList.add("isw-setup-dialog");
 modal.registerSurface(closeSetupButton,18);
 closeSetupButton.addEventListener("click",closeWizard);

 const pageDisposers=[];
 const bindHoverPanel=createHoverPanelBinder({
  registerPanel,
  closePanels:close,
  addDisposer:dispose=>pageDisposers.push(dispose)
 });
 const completed=new Set();
 let currentId="grid";
 let maxReached=0;
 let complete=false;
 let detailError="";
 let scheduleErrorPeriodId=null;
 let gridSearch="";
 let lastRenderedStep=null;

 const steps=()=>{
  const fixed=[
   {id:"grid",label:"Grid code",title:"Grid code",description:"Select the certified grid profile that this inverter will follow."},
   {id:"battery",label:"Battery",title:"Battery",description:`Configure the ${variant.batteryPathCount===1?"battery input":"two battery inputs"} and operating reserve.`},
   {id:"mppt",label:"MPPT input",title:"MPPT input",description:`Assign the ${model.capabilities.mpptCount} available PV inputs for this hardware.`},
   {id:"limits",label:"Power limits",title:"Import & export limits",description:"Set the maximum power measured at the grid-tied point."},
   {id:"mode",label:"Running mode",title:"Running mode",description:"Choose how the inverter should operate after initialization."}
  ];
  const scheduleMode=state.runMode===2||state.runMode===4;
  if(scheduleMode)fixed.push({
   id:"schedule",
   label:state.runMode===2?"Economic schedule":"ToU schedule",
   title:state.runMode===2?"Economic schedule":"ToU schedule",
   description:"Set at least one operating period before completing setup."
  });
  return fixed;
 };

 const currentIndex=()=>Math.max(0,steps().findIndex(step=>step.id===currentId));
 const schedule=()=>state.runMode===2?state.eco:state.tou.manual;
 const scheduleModes=()=>state.runMode===2
  ?ECONOMIC_MODES.map(item=>({value:item.id,label:item.label}))
  :TOU_PERIOD_MODES.map(item=>({value:item.value,label:item.label}));

 const scrollFeedback=createScrollFeedback({
  host:contentPane,
  viewport:pageScroll,
  content:pageHost,
  elastic:true,
  preserveBottomOnShrink:true,
  topInset:12,
  bottomInset:()=>footer.offsetHeight+12,
  visibility:"hover"
 });
 scrollFeedback.element.style.setProperty("--wd-scroll-feedback-right","4px");
 const modeMotion=createSettingsModeMotion({
  scope:pageHost,
  onSettled:()=>scrollFeedback.sync()
 });
 const navFeedback=createScrollFeedback({
  host:rail,
  viewport:railScroll,
  content:railContent,
  elastic:true,
  topInset:12,
  bottomInset:12,
  visibility:"hover"
 });
 navFeedback.element.style.setProperty("--wd-scroll-feedback-right","2px");
 const syncNavTopFade=()=>railScroll.classList.toggle("is-top-faded",railScroll.scrollTop>1);
 railScroll.addEventListener("scroll",syncNavTopFade,{passive:true});
 const syncTitleState=()=>{
  titleRule.style.top=`${titleLayer.offsetTop+titleLayer.offsetHeight}px`;
  const faded=pageScroll.scrollTop>2;
  titleLayer.classList.toggle("is-content-scrolled",faded);
  titleRule.classList.toggle("is-title-rule--visible",faded);
 };
 pageScroll.addEventListener("scroll",syncTitleState,{passive:true});

 const growthAnimations=new WeakMap();
 const growingElements=new Set();
 let activePageTransition=null;
 let pageTransitionGeneration=0;
 const clearGrowth=(element)=>{
  const state=growthAnimations.get(element);
  if(state?.animation)state.animation.cancel();
  growthAnimations.delete(element);
  growingElements.delete(element);
  element.style.removeProperty("height");
  element.style.removeProperty("overflow");
 };
 const animateGrowth=(element,mutate,after=()=>{})=>{
  if(!element){
   mutate();
   after();
   return;
  }
  const from=element.getBoundingClientRect().height;
  mutate();
  const to=element.getBoundingClientRect().height;
  clearGrowth(element);
  const state={animation:null};
  growthAnimations.set(element,state);
  growingElements.add(element);
  element.style.overflow="hidden";
  const animation=animateContentHeight(element,to,{from});
  state.animation=animation;
  const finish=()=>{
   if(growthAnimations.get(element)!==state)return;
   growthAnimations.delete(element);
   growingElements.delete(element);
   element.style.removeProperty("height");
   element.style.removeProperty("overflow");
   requestAnimationFrame(()=>scrollFeedback.sync());
   after();
  };
  if(animation)animation.finished.catch(()=>{}).finally(finish);
  else finish();
 };
 const finishPageTransition=()=>{
  pageTransitionGeneration+=1;
  if(activePageTransition)activePageTransition.finish();
  activePageTransition=null;
  pageHost.classList.remove("isw-page--incoming");
 };

 function clearPage(){
  finishPageTransition();
  for(const element of growingElements)clearGrowth(element);
  modeMotion.clear();
  for(const dispose of pageDisposers.splice(0))dispose();
  pageHost.replaceChildren();
 }

 function syncRail(){
  railContent.replaceChildren();
  const activeSteps=steps();
  for(const [index,step] of activeSteps.entries()){
   const trailing=text("span","isw-nav-item-trailing");
   if(completed.has(step.id)){
    trailing.append(setupNavCheckIcon());
   }
   const button=makeNavRow(
    step.label,
    step.id,
    SETUP_STEP_ICONS[step.id],
    "",
    "mono",
    {labelClassName:"isw-nav-item-label",trailing:trailing.childElementCount?trailing:null}
   );
   button.classList.add("isw-nav-item","isw-setup-step");
   button.dataset.setupStep=step.id;
   const unavailable=index>maxReached&&step.id!==currentId;
   button.setAttribute("aria-disabled",String(unavailable));
   button.classList.toggle("is-disabled",unavailable);
   button.classList.toggle("is-selected",step.id===currentId);
   button.setAttribute("aria-current",step.id===currentId?"step":"false");
   button.addEventListener("click",()=>{
    if(button.getAttribute("aria-disabled")==="true")return;
    if(step.id===currentId)return;
    currentId=step.id;
    detailError="";
    render();
   });
   railContent.append(button);
  }
 }

 function setError(message){
  detailError=message;
 }

 function showScheduleFieldError(row,message){
  if(!row)return;
  let errors=row.querySelector(":scope > .isw-field-errors");
  if(!errors){
   errors=text("div","isw-field-errors");
   errors.setAttribute("role","alert");
   row.append(errors);
  }
  let item=errors.querySelector(".isw-field-error-message");
  if(!item){
   item=text("div","isw-field-error-message");
   errors.append(item);
  }
  item.textContent=message;
 }

 function clearScheduleFieldError(row){
  row?.querySelector(":scope > .isw-field-errors")?.remove();
 }

 function showScheduleEmptyError(message){
  const target=pageHost.querySelector(".isw-schedule-empty-note");
  if(!target)return false;
  target.hidden=false;
  target.textContent=message;
  return true;
 }

 function validateCurrent(){
  detailError="";
  if(currentId==="grid"&&!gridProfileEntries(model).some(entry=>entry.selectable&&entry.key===state.gridCode)){
   setError("Select a certified grid profile.");
   return false;
  }
  if(currentId==="battery"){
   const banks=state.battery.parallel||variant.batteryPathCount===1
    ?[state.battery.common]
    :[state.battery.bank1,state.battery.bank2];
   const batteryError=batteryValidationError(banks);
   if(batteryError){
    setError(batteryError);
    return false;
   }
   const soc=state.battery.soc;
   if(Number(soc.gridMin)>=Number(soc.gridMax)){setError("Grid-tied SOC start must be lower than the end value.");return false;}
   if(Number(soc.offMin)>=Number(soc.offMax)){setError("Off-grid SOC start must be lower than the end value.");return false;}
  }
  if(currentId==="mppt"&&state.mppt.parallel&&model.capabilities.mpptCount>2&&model.mpptGroups().length===0){
   setError("At least one MPPT Group must be created.");
   return false;
  }
  if(currentId==="limits"){
   const finiteBetween=(value,min,max)=>Number.isFinite(Number(value))&&Number(value)>=min&&Number(value)<=max;
   if(state.limits.feedOn&&!finiteBetween(state.limits.feed,0,variant.ratedPower)){
    setError(`Export limit must be between 0 and ${variant.ratedPower} kW.`);
    return false;
   }
   if(state.limits.impOn&&!finiteBetween(state.limits.imp,0,variant.ratedPower)){
    setError(`Import limit must be between 0 and ${variant.ratedPower} kW.`);
    return false;
   }
   if(state.limits.impOn&&!IMPORT_PERMISSION_OPTIONS.some(option=>Number(option.value)===Number(state.limits.importPermission))){
    setError("Select an import permission.");
    return false;
   }
   if(state.limits.feedOn&&!EXPORT_PERMISSION_OPTIONS.some(option=>option.value===state.limits.exportPermission)){
    setError("Select an export permission.");
    return false;
   }
  }
  if(currentId==="schedule"){
   const rows=schedule();
   const result=validateSchedulePeriods(rows,{
    validatePeriod:period=>{
     const power=Number(period.powerPct??period.power);
     return Number.isFinite(power)&&power>=0&&power<=100?"":"Power limit must be between 0 and 100%.";
    }
   });
   scheduleErrorPeriodId=result.periodId;
   if(!result.valid){
    setError(result.message);
    return false;
   }
  }
  return true;
 }

 function selectableModeCard(index,mode){
  const button=text("button",`isw-mode-card wd-control-state${state.runMode===index?" is-selected":""}`);
  button.type="button";
  button.dataset.setupMode=String(index);
  button.dataset.setupModeValue=String(mode.wireValue);
  button.setAttribute("aria-pressed",String(state.runMode===index));
  button.append(applicationIcon(mode.icon));
  const copy=text("span","isw-mode-copy");
  const flow=text("span","isw-mode-flow");
  mode.flow.forEach((item,flowIndex)=>{
   if(flowIndex)flow.append(text("span","isw-flow-arrow","→"));
   flow.append(text("b","",item));
  });
  copy.append(
   text("span","isw-mode-name",mode.label,"14/14 medium"),
   text("span","isw-mode-summary",mode.summary,"Footnote/Regular"),
   flow,
   text("span","isw-mode-description",mode.description,"Footnote/Regular")
  );
  button.append(copy,text("span","isw-radio-mark"));
  button.addEventListener("click",()=>{
   state.runMode=index;
   const activeSteps=steps();
   if(!activeSteps.some(step=>step.id===currentId))currentId="mode";
   modeMotion.animate(index,pageHost);
   maxReached=Math.max(maxReached,currentIndex());
   syncRail();
   renderActions();
  });
  return button;
 }

 function renderGrid(){
  const profileEntries=gridProfileEntries(model).filter(entry=>entry.selectable);
  const listHost=text("div","isw-setup-profile-scroll");
  listHost.append(profileList({state,profileEntries,filter:gridSearch,onSelect:value=>{
   state.gridCode=value;
   model.loadProfile(value);
   render();
  }}));
  const search=createSearchField({
   glass,
   placeholder:"Search country, standard or profile",
   label:"Search grid profiles",
   className:"isw-setup-search-field",
   size:"compact",
   scalable:true
  });
  search.input.value=gridSearch;
  search.input.addEventListener("input",()=>{
   gridSearch=search.input.value;
   const previous=listHost.querySelector("[data-setup-profile-list]");
    const next=profileList({state,profileEntries,filter:gridSearch,onSelect:value=>{
    state.gridCode=value;
    model.loadProfile(value);
    render();
   }});
   previous?.replaceWith(next);
   scrollFeedback.sync();
  });
  pageDisposers.push(()=>glass.removeSurface(search.field));
  pageHost.append(
   search.field,
   listHost
  );
 }

 function renderBattery(){
  const battery=state.battery;
  const paths=variant.batteryPathCount===2;
  const batteryCardOptions={
   numberInput:numericField,
   glass,
   registerPanel,
   close,
   toggle,
   addDisposer:dispose=>pageDisposers.push(dispose)
  };
  const commonPanel=batteryCard({title:"Battery",data:battery.common,...batteryCardOptions});
  const bankOneTitle=groupTitle("Battery #1");
  const bankOnePanel=batteryCard({title:"Battery #1",data:battery.bank1,...batteryCardOptions});
  const bankTwoTitle=groupTitle("Battery #2");
  const bankTwoPanel=batteryCard({title:"Battery #2",data:battery.bank2,...batteryCardOptions});
  let parallelPanel=null;
  let parallelSwitch=null;
  const syncBatteryBranches=()=>{
   const parallel=Boolean(battery.parallel);
   commonPanel.hidden=paths&&!parallel;
   bankOneTitle.hidden=!paths||parallel;
   bankOnePanel.hidden=!paths||parallel;
   bankTwoTitle.hidden=!paths||parallel;
   bankTwoPanel.hidden=!paths||parallel;
  };
  if(paths){
   parallelPanel=card([
    detailRow("Parallel Battery Operation","Operate both connected batteries as one bank",(()=>{
     const slot=text("span","isw-setup-conditional");
     parallelSwitch=createToggleSwitch({
      label:"Parallel battery operation",
      checked:Boolean(battery.parallel),
      glass,
      onChange:value=>{
       animateGrowth(pageHost,()=>{
        battery.parallel=value?1:0;
        syncBatteryBranches();
       });
      }
     });
     pageDisposers.push(()=>parallelSwitch.destroy());
     slot.append(parallelSwitch.element);
     return slot;
    })())
   ]);
  }
  syncBatteryBranches();
  const socRows=[
   detailRow("Grid-tied SOC","Operating reserve while the grid is available",(()=>{
    const host=text("span","isw-soc-range-values");
    host.append(
     numericField({compact:true,label:"Grid-tied SOC minimum",value:battery.soc.gridMin,unit:"%",max:100,onInput:value=>{battery.soc.gridMin=value;}}),
     text("span","isw-setup-range-separator","–","Footnote/Medium"),
     numericField({compact:true,label:"Grid-tied SOC maximum",value:battery.soc.gridMax,unit:"%",max:100,onInput:value=>{battery.soc.gridMax=value;}})
    );
    return host;
   })()),
   detailRow("Off-grid SOC","Operating reserve during a grid outage",(()=>{
    const host=text("span","isw-soc-range-values");
    host.append(
     numericField({compact:true,label:"Off-grid SOC minimum",value:battery.soc.offMin,unit:"%",max:100,onInput:value=>{battery.soc.offMin=value;}}),
     text("span","isw-setup-range-separator","–","Footnote/Medium"),
     numericField({compact:true,label:"Off-grid SOC maximum",value:battery.soc.offMax,unit:"%",max:100,onInput:value=>{battery.soc.offMax=value;}})
    );
    return host;
   })())
  ];
  pageHost.append(
   groupTitle("Battery configuration"),
   ...(parallelPanel?[parallelPanel]:[]),
   commonPanel,
   bankOneTitle,
   bankOnePanel,
   bankTwoTitle,
   bankTwoPanel,
   groupTitle("State of charge"),
   card(socRows),
   setupFigure({
    src:variant.batteryImage,
    alt:`Battery port wiring diagram for the ${variant.label}`,
    caption:`Battery port wiring · ${variant.label}`
   })
  );
 }

 function renderMppt(){
  const count=model.capabilities.mpptCount;
  const rows=[];
  for(let index=0;index<count;index+=1){
   const slot=text("span","isw-setup-segmented");
   const control=createSegmentedControl({
    label:`MPPT #${index+1} input`,
    value:state.mppt.pv[index]??0,
    items:MPPT_SOURCE_SELECT_OPTIONS.map(item=>({id:item.value,label:item.label})),
    glass,
    onChange:value=>{state.mppt.pv[index]=Number(value);}
   });
   slot.append(control.element);
   pageDisposers.push(()=>control.destroy());
   rows.push(detailRow(`MPPT #${index+1}`,"",slot));
  }
  const groupHost=text("div","isw-setup-mppt-groups");
  groupHost.hidden=!state.mppt.parallel;
  let groupDisposers=[];
  const disposeGroups=()=>{
   for(const dispose of groupDisposers.splice(0))dispose();
   groupHost.replaceChildren();
  };
  const focusGroup=target=>{
   if(!target)return;
   requestAnimationFrame(()=>{
    if(target.type==="mpptGroup"){
     groupHost.querySelector(`[data-isw-mppt-group="${CSS.escape(target.value)}"] [data-isw-mppt-more]`)?.focus({preventScroll:true});
    }else if(target.type==="mpptAdd"){
     groupHost.querySelector("[data-isw-mppt-add]")?.focus({preventScroll:true});
    }else if(target.type==="mpptGroupDraft"){
     groupHost.querySelector('[data-isw-mppt-group-select="draft"]')?.focus({preventScroll:true});
    }
   });
  };
  const mountGroups=({autoOpen=false,focus=null}={})=>{
   disposeGroups();
   if(!state.mppt.parallel)return;
   const editor=createMpptGroupEditor({
    model,
    glass,
    registerPanel,
    closePanels:close,
    togglePanel:toggle,
    addDisposer:dispose=>groupDisposers.push(dispose),
    autoOpen,
    onChange:({focus:nextFocus})=>{
     detailError="";
     mountGroups({focus:nextFocus});
    }
   });
   groupDisposers.push(editor.destroy);
   groupHost.append(editor.element);
   focusGroup(focus);
  };
  pageDisposers.push(disposeGroups);
  mountGroups({autoOpen:Boolean(state.mppt.parallel&&state.mpptPickerOpen)});
  let trackerPanel=null;
  let mpptSwitch=null;
  if(variant.mpptParallel&&count>2){
   mpptSwitch=createToggleSwitch({
    label:"Parallel MPPT operation",
    checked:Boolean(state.mppt.parallel),
    glass,
    onChange:value=>{
     const enabled=Boolean(value);
     const shouldOpenPicker=enabled&&count>2&&!model.mpptGroups().length;
     animateGrowth(trackerPanel,()=>{
      state.mppt.parallel=enabled?1:0;
      state.mpptPickerOpen=shouldOpenPicker;
      groupHost.hidden=!enabled;
      if(enabled)mountGroups({autoOpen:false});
      else disposeGroups();
     },()=>{
      if(!enabled||!shouldOpenPicker||!modal.layer.isConnected)return;
      groupHost.querySelector('[data-isw-mppt-group-select="draft"]')?.click();
     });
    }
   });
   pageDisposers.push(()=>mpptSwitch.destroy());
  }
  trackerPanel=variant.mpptParallel&&count>2
   ?card([
    detailRow("Parallel MPPT Operation",MPPT_PARALLEL_HINT,mpptSwitch.element),
    groupHost
   ],{className:"isw-mppt-panel isw-setup-mppt-panel"})
   :null;
  pageHost.append(
   groupTitle("MPPT Input"),
   card(rows),
   ...(trackerPanel?[groupTitle("Tracker"),trackerPanel]:[]),
   setupFigure({
    src:variant.pvImage,
    alt:`MPPT input wiring diagram for the ${variant.label}`,
    caption:`MPPT input wiring · ${variant.label}`
   })
  );
 }

 function renderLimits(){
  let importField=null;
  let importPermission=null;
  let exportField=null;
  let exportPermission=null;
  let basis=null;
  const importSwitch=createToggleSwitch({
   label:"Import limit",
   checked:Boolean(state.limits.impOn),
   glass,
   onChange:value=>{
    animateGrowth(importField?.closest(".isw-setup-card"),()=>{
     state.limits.impOn=value?1:0;
     importField.hidden=!value;
     importPermission.hidden=!value;
    });
   }
  });
  pageDisposers.push(()=>importSwitch.destroy());
  const exportSwitch=createToggleSwitch({
   label:"Export limit",
   checked:Boolean(state.limits.feedOn),
   glass,
   onChange:value=>{
    animateGrowth(exportField?.closest(".isw-setup-card"),()=>{
     state.limits.feedOn=value?1:0;
     exportField.hidden=!value;
     exportPermission.hidden=!value;
     if(basis)basis.hidden=!value;
    });
   }
  });
  pageDisposers.push(()=>exportSwitch.destroy());
  importField=detailRow("Import value","Maximum power drawn from the grid",numericField({
   label:"Import limit",
   value:state.limits.imp,
   unit:"kW",
   max:variant.ratedPower,
   onInput:value=>{state.limits.imp=value;}
  }),{className:"isw-setup-conditional"});
  importPermission=detailRow("Import Permissions","Allow the battery to charge from the grid",(()=>{
   const control=createSelectControl({
    label:"Import Permissions",
    value:Number(state.limits.importPermission)===0?0:1,
    options:IMPORT_PERMISSION_OPTIONS,
    variant:"adaptive",
    onChange:value=>{state.limits.importPermission=Number(value)===0?0:1;},
    registerPanel,
    close,
    toggle
   });
   control.element.dataset.setupLimitPermission="import";
   pageDisposers.push(()=>control.destroy());
   return control.element;
  })(),{className:"isw-setup-conditional"});
  exportField=detailRow("Export value","Maximum power exported to the grid",numericField({
   label:"Export limit",
   value:state.limits.feed,
   unit:"kW",
   max:variant.ratedPower,
   onInput:value=>{state.limits.feed=value;}
  }),{className:"isw-setup-conditional"});
  exportPermission=detailRow("Export Permissions","Choose whether battery energy may be exported",(()=>{
   const control=createSelectControl({
    label:"Export Permissions",
    value:state.limits.exportPermission||"solar_battery",
    options:EXPORT_PERMISSION_OPTIONS,
    variant:"adaptive",
    onChange:value=>{
     const previous=state.limits.exportPermission||"solar_battery";
     const next=String(value);
     const requiresWarning=requiresBatteryExportConfirmation({
      previous,
      next,
      runMode:state.runMode,
      economicPeriods:state.eco
     });
     if(!requiresWarning){
      state.limits.exportPermission=next;
      return;
     }
     createConfirmDialog({
      glass,
      title:"Disable battery export?",
      description:"Economic Mode currently contains a Discharge period. Battery energy will no longer be exported to the grid after this change.",
      confirmLabel:"Continue",
      cancelLabel:"Cancel",
      icon:createMaskedIcon(assetURL("light/imgBoldEssentionalUiDanger.svg"),"plants-device-action-icon"),
      danger:false,
      onConfirm:()=>{state.limits.exportPermission=next;},
      onCancel:()=>control.setValue(previous,{notify:false})
     });
    },
    registerPanel,
    close,
    toggle
   });
   control.element.dataset.setupLimitPermission="export";
   pageDisposers.push(()=>control.destroy());
   return control.element;
  })(),{className:"isw-setup-conditional"});
  basis=detailRow("Limit basis","Apply the export limit to the total output or to each phase",(()=>{
   const control=createSegmentedControl({
    label:"Export limit basis",
    value:Number(state.limits.basis)===1?"Per phase":"Total",
    items:[{id:"Total",label:"Total"},{id:"Per phase",label:"Per phase"}],
    glass,
    onChange:value=>{state.limits.basis=value==="Per phase"?1:0;}
   });
   pageDisposers.push(()=>control.destroy());
   return control.element;
  })(),{className:"isw-setup-conditional"});
  importField.hidden=!state.limits.impOn;
  importPermission.hidden=!state.limits.impOn;
  exportField.hidden=!state.limits.feedOn;
  exportPermission.hidden=!state.limits.feedOn;
  basis.hidden=!state.limits.feedOn;
  pageHost.append(
   groupTitle("Import","Limit the power drawn from the public grid when required by the site."),
   card([detailRow("Import limit","Enable a grid-tied import ceiling",importSwitch.element,{className:"isw-setup-row--switch"}),importField,importPermission]),
   groupTitle("Export","Set the maximum grid feed-in power for the site."),
   card([detailRow("Export limit","Enable a grid-tied export ceiling",exportSwitch.element,{className:"isw-setup-row--switch"}),exportField,exportPermission,basis])
  );
 }

 function renderMode(){
  const modeGrid=text("div","isw-mode-list");
  MODES.forEach((mode,index)=>modeGrid.append(selectableModeCard(index,mode)));
  let lightSwitch=null;
  lightSwitch=createToggleSwitch({
   label:"Indicator lighting",
   checked:Boolean(state.features.light),
   glass,
   onChange:value=>{state.features.light=value?1:0;}
  });
  pageDisposers.push(()=>lightSwitch.destroy());
  pageHost.append(
   modeGrid,
   groupTitle("Device behavior"),
   card([detailRow("Indicator lighting","Keep the inverter status lights enabled after setup",lightSwitch.element,{className:"isw-setup-row--switch"})])
  );
 }

 function renderSchedule(){
  const isTou=state.runMode===4;
  const periods=schedule();
  const sortPeriods=()=>sortSchedulePeriods(periods);
  const validateRange=(period,from,to)=>{
   return validateScheduleRange(period,from,to,periods).message;
  };
  const openDeleteConfirm=(period,trigger)=>{
   let confirmed=false;
   createConfirmDialog({
    glass,
    title:"Delete this time range?",
    description:`${period.from} – ${period.to} will be removed from the schedule.`,
    confirmLabel:"Delete",
    cancelLabel:"Cancel",
    icon:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"plants-device-action-icon"),
    danger:true,
    onConfirm:()=>{confirmed=true;},
    onClose:()=>{
     if(!confirmed){
      if(trigger.isConnected)trigger.focus({preventScroll:true});
      return;
     }
     const index=periods.findIndex(item=>item.id===period.id);
     if(index>=0)periods.splice(index,1);
     detailError="";
     scheduleErrorPeriodId=null;
     render();
    }
   });
  };
  const overview=text("section",`isw-gantt isw-eco-overview${isTou?" isw-tou-overview":""}`);
  const track=text("div","isw-gantt-track isw-eco-track");
  for(const segmentData of scheduleSegments(periods)){
   const {period,left,width}=segmentData;
   const segment=text("button","isw-eco-segment isw-control-state");
   segment.type="button";
   segment.style.left=`${left}%`;
   segment.style.width=`${width}%`;
   if(isTou){
    const mode=TOU_PERIOD_MODES.find(item=>item.value===Number(period.mode))||TOU_PERIOD_MODES[0];
    segment.classList.add(`isw-tou-mode-${mode.className}`);
   }else{
    segment.classList.add(`isw-eco-segment--${period.mode==="discharge"?"discharge":"charge"}`);
   }
   segment.setAttribute("aria-label",`${period.from} to ${period.to}`);
   track.append(segment);
  }
  const axis=text("div","isw-eco-axis");
  axis.append(text("span","","00:00"),text("i",""),text("span","","12:00"),text("i",""),text("span","","24:00"));
  const legend=text("div","isw-eco-legend");
  if(isTou){
   const usedModes=new Set(periods.map(period=>Number(period.mode)));
   for(const mode of TOU_PERIOD_MODES.filter(item=>usedModes.has(item.value))){
    const item=text("span","");
    const dot=text("i",`isw-eco-legend-dot isw-tou-mode-${mode.className}`);
    item.append(dot,mode.label);
    legend.append(item);
   }
  }else{
   for(const [label,className] of [["Charge","charge"],["Discharge","discharge"],["General Mode","general"]]){
    const item=text("span","");
    item.append(text("i",`isw-eco-legend-dot isw-eco-legend-dot--${className}`),label);
    legend.append(item);
   }
  }
  overview.append(track,axis,legend);

  const table=text("section",`isw-table ${isTou?"isw-tou-table":"isw-eco-table"}`);
  const head=text("div",isTou?"isw-tou-table-head":"isw-eco-table-head");
  const powerHead=text("span",isTou?"isw-tou-head-with-info":"isw-eco-power-head");
  const info=text("button",isTou?"isw-tou-info wd-control-state":"isw-eco-info wd-control-state");
  info.type="button";
  info.setAttribute("aria-label","Power limit information");
  info.append(createMaskedIcon(assetURL("plants/detail/info2.svg"),"isw-icon isw-ico-info"));
  bindHoverPanel(info,"Power limit is a percentage of the inverter's rated output.","Power limit information",248,{align:"center"});
  powerHead.append(isTou?"Battery power limit":"Power limit",info);
  if(isTou){
   head.append(
    text("span","","Time range"),
    text("span","","Mode"),
    powerHead,
    text("span","","PV forbidden"),
    text("span","","")
   );
  }else{
   head.append(
    text("span","","Time range"),
    text("span","","Mode"),
    powerHead,
    text("span","","")
   );
  }
  table.append(head);
  const rowList=text("div",isTou?"isw-tou-rows":"isw-eco-rows");
  const rows=schedule();
  rows.forEach((period,index)=>{
   const row=text("div",isTou?"isw-tou-row":"isw-eco-row");
   row.dataset.setupScheduleRow=period.id;
   const touMode=isTou
    ?TOU_PERIOD_MODES.find(item=>item.value===Number(period.mode))||TOU_PERIOD_MODES[0]
    :null;
   const rangeHost=text("div","isw-eco-time-range");
   const rangeField=text("div","isw-eco-field isw-eco-time-range-field wd-edit-field");
   const input=document.createElement("input");
   input.className="isw-eco-time-range-input";
   input.value=`${period.from} – ${period.to}`;
   input.dataset.setupScheduleValue=input.value;
   input.dataset.setupScheduleTime=period.id;
   input.setAttribute("aria-label",`Schedule period ${index+1} time range`);
   const trigger=text("button","isw-eco-time-range-trigger wd-control-state");
   trigger.type="button";
   trigger.setAttribute("aria-label",`Open schedule period ${index+1} time picker`);
   trigger.append(createMaskedIcon(opaqueMaskURL("asset-14.svg"),"isw-eco-chevron"));
   rangeField.append(input,trigger);
   if(isTou)row.append(rangeField);
   else rangeHost.append(rangeField);
   const timeControl=createTimeRangeControl({
    field:rangeField,
    input,
    trigger,
    getValue:()=>period,
    stepMinutes:60,
    validate:parsed=>{
     return validateRange(period,parsed.from,parsed.to);
    },
    onCommit:parsed=>{
     period.from=parsed.from;
     period.to=parsed.to;
     detailError="";
     scheduleErrorPeriodId=null;
     sortPeriods();
     render();
    },
    onError:message=>{
     rangeField.classList.add("is-invalid");
     input.setAttribute("aria-invalid","true");
     showScheduleFieldError(row,message);
    },
    onClearError:()=>{
     rangeField.classList.remove("is-invalid");
     input.removeAttribute("aria-invalid");
     clearScheduleFieldError(row);
    },
    registerPanel,
    close,
    toggle,
    addDisposer:dispose=>pageDisposers.push(dispose)
   });
   pageDisposers.push(()=>timeControl?.destroy?.());
   const modeHost=text("span",isTou?"isw-tou-mode-slot":"isw-select-slot isw-eco-mode-slot");
   const modeSelect=createSelectControl({
    label:`Schedule period ${index+1} mode`,
    value:period.mode,
    options:scheduleModes(),
    variant:"adaptive",
    onChange:value=>{
     period.mode=value;
     detailError="";
     scheduleErrorPeriodId=null;
     render();
    },
    className:"isw-setup-schedule-select",
    registerPanel,
    close,
    toggle
   });
   modeHost.append(modeSelect.element);
   pageDisposers.push(()=>modeSelect.destroy());
   const power=text("div",isTou?"isw-tou-power-value":"isw-eco-power");
   if(!isTou||touMode.batteryPower){
    const powerField=text("label","isw-eco-field isw-eco-percent-field wd-edit-field");
    const powerInput=document.createElement("input");
    powerInput.type="number";
    powerInput.min="0";
    powerInput.max="100";
    powerInput.step="1";
    powerInput.value=period.powerPct??period.power??100;
    powerInput.setAttribute("aria-label",`Schedule period ${index+1} power percentage`);
    powerInput.addEventListener("input",()=>{
     if(state.runMode===2)period.powerPct=powerInput.value;
     else period.power=powerInput.value;
    });
    powerField.append(powerInput,text("span","","%"));
    const kw=text("span",isTou?"isw-tou-kw":"isw-eco-kw");
    const kwValue=Number(period.powerPct??period.power??100)*variant.ratedPower/100;
    const kwLabel=text("span","isw-eco-kw-value",`${kwValue.toFixed(1)} kW`);
    kw.append(kwLabel);
    powerInput.addEventListener("input",()=>{
     const next=Number(powerInput.value);
     if(Number.isFinite(next))kwLabel.textContent=`${(next*variant.ratedPower/100).toFixed(1)} kW`;
    });
    power.append(powerField,kw);
   }
   if(isTou){
    const pv=text("div","isw-tou-pv-value");
    if(touMode.pvForbidden){
     const pvSwitch=createToggleSwitch({
      label:`Schedule period ${index+1} PV forbidden`,
      checked:Number(period.pvForbidden)===1,
      glass,
      onChange:value=>{period.pvForbidden=value?1:0;}
     });
     pageDisposers.push(()=>pvSwitch.destroy());
     pv.append(pvSwitch.element);
    }
    row.append(modeHost,power,pv);
   }else{
    row.append(rangeHost,modeHost,power);
   }
   const more=createStandardButton({
    label:`Actions for ${period.from} – ${period.to}`,
    iconOnly:true,
    className:isTou?"isw-tou-more":"isw-eco-more",
    icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),isTou?"isw-tou-more-icon":"isw-eco-more-icon")
   });
   modal.registerSurface(more,18);
   more.addEventListener("click",()=>{
    if(!registerPanel)return;
    toggle?.(more,()=>{
     const panel=text("div","popover popover--menu isw-eco-popover");
     const list=menuList();
     const row=menuRow("Delete",{
      iconNode:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"isw-eco-trash-icon"),
      showCheck:false,
      onSelect:()=>{
       close?.(true);
       openDeleteConfirm(period,more);
      }
     });
     row.classList.add("isw-eco-delete-row","is-danger");
     list.append(row);
     mountMenu(panel,{label:`Actions for ${period.from} – ${period.to}`,children:[list]});
     return registerPanel(panel,more,{
      label:`Actions for ${period.from} – ${period.to}`,
      radius:30,
      width:180,
      align:"end",
      alignRight:menuEndAlign(more,30)
     });
    });
   });
   row.append(more);
   rowList.append(row);
  });
  table.append(rowList);
  const emptyNote=text("div","isw-schedule-empty-note","");
  emptyNote.setAttribute("role","alert");
  emptyNote.hidden=true;
  table.append(emptyNote);
  const add=createStandardButton({
   label:"Add time range",
   iconOnly:true,
   className:isTou?"isw-tou-add":"isw-eco-add",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),isTou?"isw-tou-add-icon":"isw-eco-add-icon")
  });
  modal.registerSurface(add,18);
  add.addEventListener("click",()=>{
   if(rows.length>=24)return;
   detailError="";
   scheduleErrorPeriodId=null;
   if(state.runMode===2){
    state.eco.push({id:`setup-eco-${Date.now()}`,from:"00:00",to:"01:00",mode:"charge_pv",powerPct:100});
   }else{
    state.tou.manual.push({id:`setup-tou-${Date.now()}`,from:"00:00",to:"01:00",mode:0,power:100,pvForbidden:0});
   }
   render();
  });
  add.disabled=rows.length>=24;
  const addRow=text("div",isTou?"isw-tou-add-row":"isw-eco-add-row");
  addRow.append(add);
  table.append(addRow);
  pageHost.append(
   groupTitle("24h Overview"),
   overview,
   groupTitle("Schedule periods"),
   table
  );
 }

 function renderActions(){
  footer.replaceChildren();
  const activeSteps=steps();
  const step=activeSteps[currentIndex()];
  const isLast=currentIndex()===activeSteps.length-1;
  const back=createStandardButton({label:"Back",variant:"neutral"});
  back.disabled=currentIndex()===0||complete;
  back.addEventListener("click",()=>{
   if(currentIndex()<=0)return;
   currentId=steps()[currentIndex()-1].id;
   detailError="";
   render();
  });
  modal.registerSurface(back,18);
  const primary=createStandardButton({
   label:isLast?"Apply":"Next",
   variant:"primary"
  });
  if(isLast)primary.setAttribute("aria-label","Apply and start system");
  primary.disabled=complete;
  primary.dataset.setupPrimaryAction=isLast?"apply":"next";
  primary.addEventListener("click",async()=>{
   if(currentId==="schedule"){
    const pending=[...pageHost.querySelectorAll(".isw-eco-time-range-input")]
     .filter(input=>input.value!==input.dataset.setupScheduleValue);
    for(const input of pending){
     if(!input.isConnected)continue;
     input.focus({preventScroll:true});
     input.blur();
     await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(!modal.layer.isConnected)return;
    if(pageHost.querySelector(".isw-eco-time-range-field.is-invalid"))return;
   }
   if(!validateCurrent()){
    renderError();
    return;
   }
   if(isLast){
    applySetup(primary);
    return;
   }
   completed.add(step.id);
   maxReached=Math.max(maxReached,currentIndex()+1);
   currentId=steps()[Math.min(steps().length-1,currentIndex()+1)].id;
   detailError="";
   render();
  });
  modal.registerSurface(primary,18);
  footer.append(back,primary);
  requestAnimationFrame(()=>scrollFeedback.sync());
 }

 function renderError(){
  const existing=pageHost.querySelector(".isw-setup-error-banner");
  existing?.remove();
  if(!detailError)return;
  if(currentId==="schedule"){
   if(scheduleErrorPeriodId==="__empty__"){
    if(showScheduleEmptyError(detailError)){
     pageHost.querySelector(".isw-eco-add,.isw-tou-add")?.scrollIntoView({block:"nearest"});
     pageHost.querySelector(".isw-eco-add,.isw-tou-add")?.focus({preventScroll:true});
     return;
    }
   }
   const row=pageHost.querySelector(`[data-setup-schedule-row="${CSS.escape(String(scheduleErrorPeriodId||""))}"]`)
    ||pageHost.querySelector(".isw-eco-row,.isw-tou-row");
   if(row){
    row.querySelector(".isw-eco-time-range-field")?.classList.add("is-invalid");
    row.querySelector(".isw-eco-time-range-input")?.setAttribute("aria-invalid","true");
    showScheduleFieldError(row,detailError);
    row.scrollIntoView({block:"nearest"});
    row.querySelector("input")?.focus({preventScroll:true});
    return;
   }
  }
  if(currentId==="mppt"&&pageHost.querySelector(".isw-mppt-group-error")){
   const draft=pageHost.querySelector('[data-isw-mppt-group-select="draft"]');
   pageHost.querySelector(".isw-mppt-group-error")?.scrollIntoView({block:"nearest"});
   draft?.focus({preventScroll:true});
   return;
  }
  const banner=text("div","isw-setup-error-banner");
  banner.setAttribute("role","alert");
  banner.append(createMaskedIcon(opaqueMaskURL("light/imgBoldEssentionalUiDanger.svg"),"isw-setup-error-icon"),errorText(detailError));
  pageHost.prepend(banner);
  pageScroll.scrollTop=0;
  const firstInvalid=pageHost.querySelector(".is-invalid input");
  firstInvalid?.focus({preventScroll:false});
 }

 function renderComplete(){
  complete=true;
  clearPage();
  root.dataset.setupComplete="true";
  rail.hidden=true;
  titleLayer.hidden=true;
  titleRule.classList.remove("is-title-rule--visible");
  pageScroll.classList.add("isw-scroll--complete");
  pageHost.classList.add("isw-setup-complete-page");
  footer.replaceChildren();
  const success=text("div","isw-setup-success");
  const mark=text("span","isw-setup-success-mark");
  mark.append(createMaskedIcon(assetURL(SETTINGS_ICON_FILES.selectedCheck),"isw-setup-success-icon"));
  success.append(
   mark,
   text("h2","isw-setup-success-title","Initialization Complete","Title3/Emphasized"),
   text("p","isw-setup-success-copy","Your inverter has been successfully configured and started.","Subheadline/Regular")
  );
  pageHost.append(success);
  let seconds=3;
  const close=createStandardButton({label:`Close (${seconds}s)`});
  modal.registerSurface(close,18);
  close.addEventListener("click",closeWizard);
  footer.append(close);
  const timer=setInterval(()=>{
   seconds-=1;
   if(seconds<=0){
    clearInterval(timer);
    closeWizard();
    return;
   }
   const label=close.querySelector(".wd-control-label");
   if(label)label.textContent=`Close (${seconds}s)`;
   close.setAttribute("aria-label",`Close initialization in ${seconds} seconds`);
  },1000);
  pageDisposers.push(()=>clearInterval(timer));
  const positionSuccess=()=>{
   if(!modal.layer.isConnected)return;
   scrollFeedback.sync();
   requestAnimationFrame(()=>scrollFeedback.sync());
  };
  positionSuccess();
  close.focus({preventScroll:true});
  setTimeout(positionSuccess,0);
 }

 function applySetup(button){
  const stepsNow=steps();
  for(const step of stepsNow){
   completed.add(step.id);
  }
  detailError="";
  const label=button.querySelector(".wd-control-label");
  if(label)label.textContent="Applying...";
  button.disabled=true;
  const timer=setTimeout(()=>{
   if(!modal.layer.isConnected)return;
   toast?.("Initialization simulated in this local preview");
   renderComplete();
  },760);
  pageDisposers.push(()=>clearTimeout(timer));
  syncRail();
 }

 function render(){
  if(complete)return;
  const activeSteps=steps();
  const index=Math.max(0,activeSteps.findIndex(step=>step.id===currentId));
  const step=activeSteps[index];
  const previousStep=lastRenderedStep;
  const resetScroll=step.id!==previousStep;
  const animateStep=resetScroll&&previousStep!==null&&!reducedMotion();
  let outgoingSnapshot=null;
  let outgoingTitle=null;
  let outgoingTitleLeft=null;
  let outgoingLeft=0;
  let outgoingTop=0;
  let outgoingWidth=0;
  if(animateStep){
   finishPageTransition();
   outgoingSnapshot=pageHost.cloneNode(true);
   outgoingTitle=pageTitleLabel.cloneNode(true);
   outgoingTitleLeft=pageTitleLabel.getBoundingClientRect().left;
   outgoingLeft=pageHost.offsetLeft;
   outgoingTop=pageHost.offsetTop;
   outgoingWidth=pageHost.offsetWidth;
  }
  lastRenderedStep=step.id;
  clearPage();
  if(resetScroll)pageScroll.scrollTop=0;
  pageTitleLabel.textContent=step.title;
  if(currentId==="grid")renderGrid();
  else if(currentId==="battery")renderBattery();
  else if(currentId==="mppt")renderMppt();
  else if(currentId==="limits")renderLimits();
  else if(currentId==="mode")renderMode();
  else if(currentId==="schedule")renderSchedule();
  if(detailError){
   if(currentId==="schedule"){
    if(scheduleErrorPeriodId==="__empty__"&&showScheduleEmptyError(detailError)){
     // The empty-plan error lives inside the schedule table.
    }else{
    const row=pageHost.querySelector(`[data-setup-schedule-row="${CSS.escape(String(scheduleErrorPeriodId||""))}"]`)
     ||pageHost.querySelector(".isw-eco-row,.isw-tou-row");
    if(row){
     row.querySelector(".isw-eco-time-range-field")?.classList.add("is-invalid");
     row.querySelector(".isw-eco-time-range-input")?.setAttribute("aria-invalid","true");
     showScheduleFieldError(row,detailError);
    }
    }
   }else if(currentId==="mppt"&&pageHost.querySelector(".isw-mppt-group-error")){
    // The MPPT editor owns its required-group error.
   }else{
    const banner=text("div","isw-setup-error-banner");
    banner.setAttribute("role","alert");
    banner.append(createMaskedIcon(opaqueMaskURL("light/imgBoldEssentionalUiDanger.svg"),"isw-setup-error-icon"),errorText(detailError));
    pageHost.prepend(banner);
   }
  }
  renderActions();
  syncRail();
  if(outgoingSnapshot){
   outgoingSnapshot.classList.remove("isw-page--incoming");
   outgoingSnapshot.classList.add("isw-page--leaving");
   outgoingSnapshot.setAttribute("inert","");
   outgoingSnapshot.setAttribute("aria-hidden","true");
   outgoingSnapshot.style.inset="auto";
   outgoingSnapshot.style.left=`${outgoingLeft}px`;
   outgoingSnapshot.style.top=`${outgoingTop}px`;
   outgoingSnapshot.style.width=`${outgoingWidth}px`;
   outgoingSnapshot.style.height="auto";
   outgoingSnapshot.style.margin="0";
   outgoingSnapshot.style.removeProperty("overflow");
   pageScroll.append(outgoingSnapshot);
   pageHost.classList.add("isw-page--incoming");
   const transition=animateSettingsPageTransition({
    page:pageHost,
    outgoingPage:outgoingSnapshot,
    titleLayer,
    incomingTitle:pageTitleLabel,
    outgoingTitle,
    titleLeft:outgoingTitleLeft
   });
   if(transition){
    const generation=++pageTransitionGeneration;
    activePageTransition=transition;
    Promise.all(transition.animations.map(animation=>animation.finished.catch(()=>{}))).then(()=>{
     if(pageTransitionGeneration!==generation||activePageTransition!==transition)return;
     transition.finish();
     activePageTransition=null;
     pageHost.classList.remove("isw-page--incoming");
     scrollFeedback.sync();
    });
   }
  }
  requestAnimationFrame(()=>{
   if(resetScroll)pageScroll.scrollTop=0;
   prepareControlStates(pageHost);
   scrollFeedback.sync();
   navFeedback.sync();
   syncTitleState();
  });
 }

 render();
 prepareControlStates(root);
 requestAnimationFrame(()=>pageTitle.focus({preventScroll:true}));
 return {
  root,
  modal,
  destroy(){
   pageScroll.scrollTop=0;
   finishPageTransition();
   for(const dispose of pageDisposers.splice(0))dispose();
   modeMotion.destroy();
   scrollFeedback.destroy();
   navFeedback.destroy();
   modal.close({immediate:true,restoreFocus:false});
  }
 };
}
