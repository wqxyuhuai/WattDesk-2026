import {createTextElement as text} from "../../foundations/dom.js";
import {fullscreenOverlayEnterDuration,fullscreenOverlayExitDuration,reducedMotion} from "../../foundations/motion.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createStandardButton} from "../../components/controls.js";
import {menuList,menuRow,mountMenu} from "../../components/menu-popover.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {createDeviceIdentity} from "./device-identity.js";

const DEVICE_ORDER=Object.freeze(["inverter","bms","heater"]);
const DEVICE_LIBRARY=Object.freeze({
 inverter:{
  name:"iHybrid",
  category:"Inverter",
  product:"WattMatic system",
  image:assetURL("plants/devices/ihybrid.png"),
  model:"MATIC-20KW-50A",
  prefix:"1M20K25B"
 },
 bms:{
  name:"iStorage-G3",
  category:"Battery",
  product:"Battery storage",
  image:assetURL("plants/devices/istorage.png"),
  model:"iStorage-G3",
  prefix:"R11STG3"
 },
 heater:{
  name:"iHeater",
  category:"Heater",
  product:"WattMate heater",
  image:assetURL("plants/devices/iheater.png"),
  model:"WM-9.0KW-3P",
  prefix:"WMT"
 }
});

const DEVICE_STORE=new Map();

function hash(value){
 return [...String(value)].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,7);
}

function padded(value,length){
 return String(value).padStart(length,"0").slice(-length);
}

function plantTail(plant){
 return padded(String(plant.sn||"").replace(/\D/g,""),8).slice(-5);
}

function serialFor(plant,type,index){
 const meta=DEVICE_LIBRARY[type];
 const seed=hash(`${plant.id}:${type}:${index}:serial`);
 return `${meta.prefix}${plantTail(plant).slice(-3)}${padded(seed%10000,4)}`;
}

function checkCodeFor(plant,type,index){
 return String(1000+(hash(`${plant.id}:${type}:${index}:check`)%9000));
}

function firmwareFor(plant,type,index){
 const seed=hash(`${plant.id}:${type}:${index}:firmware`);
 if(type==="inverter")return `V1009.1009.${padded(900+seed%100,4)}`;
 if(type==="bms")return `V470.${padded(100+seed%90,3)}`;
 return `V20.${padded(8+seed%16,2)}`;
}

function initialStatus(plant,type,index){
 if(plant.status==="offline"||plant.status==="unbound")return "offline";
 if(plant.status==="partially_offline"&&type==="heater")return "offline";
 if(plant.status==="attention"&&type==="heater")return "attention";
 if(index>0&&plant.status==="partially_offline")return "offline";
 return "online";
}

function defaultSettings(type){
 if(type==="inverter"){
  return {
   runningMode:"tou",
   minimumSoc:"12",
   backupReserve:"20",
   chargeWindow:"22:00–05:00",
   gridCode:"VDE-AR-N 4105",
   maxGridPower:"30",
   exportLimit:"70",
   shadowScan:true,
   fastRestart:true,
   remoteControl:false,
   acOutput:"Backup + grid",
   deviceLocation:"Utility room"
  };
 }
 if(type==="bms"){
  return {
   batteryStrategy:"self",
   minimumSoc:"10",
   backupReserve:"24",
   chargeLimit:"80",
   dischargeLimit:"100",
   balancing:"Automatic",
   cloudControl:true
  };
 }
 return {
  operatingMode:"comfort",
  targetTemperature:"46",
  heatingWindow:"05:30–22:30",
  nightSetback:"39",
  manualOverride:false,
  cloudControl:true
 };
}

function clusterRows(plant,type,index,capacity){
 if(type!=="bms")return [];
 const count=2+(hash(`${plant.id}:${index}:clusters`)%3);
 const perCluster=capacity/count;
 return Array.from({length:count},(_,clusterIndex)=>{
  const seed=hash(`${plant.id}:${index}:cluster:${clusterIndex}`);
  return {
   id:`cluster-${clusterIndex+1}`,
   label:`Cluster #${clusterIndex+1}`,
   capacity:`${perCluster.toFixed(1)} kWh`,
   soc:`${Math.max(18,Math.min(96,46+seed%44))}%`,
   stateOfHealth:`${Math.max(88,Math.min(100,92+seed%9))}%`,
   temperature:`${24+(seed%9)}°C`,
   expanded:false,
   subMaster:{
    id:padded(clusterIndex+1,2),
    model:"SM-R800V-G3",
    firmware:firmwareFor(plant,type,index),
    hardware:"VHW1.5",
    serial:`WSESM38RRD${plantTail(plant)}${padded(clusterIndex+1+seed%90,2)}`
   },
   batteries:Array.from({length:6},(_,batteryIndex)=>({
    id:padded(batteryIndex+1,2),
    firmware:firmwareFor(plant,type,index),
    hardware:"VHW1.2",
    serial:`WSE2138RRD${plantTail(plant)}${padded(clusterIndex*10+batteryIndex+1,4)}`
   }))
  };
 });
}

function createDevice(plant,type,index=0,overrides={}){
 const meta=DEVICE_LIBRARY[type];
 const seed=hash(`${plant.id}:${type}:${index}`);
 const capacity=type==="bms"?Math.round((42+(seed%37)+.12)*100)/100:null;
 const device={
  key:`${plant.id}:${type}:${index}:${Date.now().toString(36)}:${seed}`,
  type,
  name:meta.name,
  status:initialStatus(plant,type,index),
  model:meta.model,
  serial:serialFor(plant,type,index),
  hardware:"V1",
  boot:"V4.4.1001",
  firmware:firmwareFor(plant,type,index),
  checkCode:checkCodeFor(plant,type,index),
  mode:type==="inverter"?"ToU mode":type==="bms"?"Self-consumption":"Automatic",
  running:type==="inverter"?"Running":type==="bms"?"Balanced":"Heating",
  capacity:capacity?`${capacity.toFixed(2)} kWh`:null,
  clusters:clusterRows(plant,type,index,capacity||0),
  settings:defaultSettings(type),
  ...overrides
 };
 return device;
}

function storeFor(plant){
 let store=DEVICE_STORE.get(plant.id);
 if(!store){
  const ids=DEVICE_ORDER.filter(type=>plant.devices?.includes(type));
  store={devices:(ids.length?ids:DEVICE_ORDER.slice(0,1)).map((type,index)=>createDevice(plant,type,index))};
  DEVICE_STORE.set(plant.id,store);
 }
 return store;
}

// The Overview rail still groups by device type. Reusing this resolver keeps
// names/types aligned after local device-page edits without inventing storage.
export function plantDeviceIds(plant){
 if(!plant?.id)return [];
 const store=DEVICE_STORE.get(plant.id);
 const ids=store?store.devices.map(device=>device.type):plant.devices;
 return DEVICE_ORDER.filter(type=>ids?.includes(type));
}

function deviceStatus(device){
 if(device.status==="offline")return {label:"Offline",tone:"red"};
 if(device.status==="attention")return {label:"Attention",tone:"orange"};
 return {label:"Online",tone:"green"};
}

function actionIcon(file){
 return createMaskedIcon(file,"plants-device-action-icon");
}

function deviceMenuIcon(file,role){
 const icon=createMaskedIcon(assetURL(`plants/devices/actions/${file}`),`target-icon-art target-icon-art--mono plants-device-menu-icon is-${role}`);
 icon.dataset.deviceMenuIcon=role;
 return icon;
}

function createActionButton({label,iconFile,className="",onClick}){
 const button=createStandardButton({
  label,
  iconOnly:true,
  className:`plants-device-icon-action ${className}`.trim(),
  icon:actionIcon(iconFile)
 });
 button.addEventListener("click",onClick);
 return button;
}

function field({label,value="",type="text",required=false,disabled=false,placeholder="",unit="",min,max,step}){
 const wrapper=text("label","plants-device-field");
 const labelNode=text("span","plants-device-field-label",label,"Caption1/Emphasized");
 if(required)labelNode.append(text("span","plants-device-required"," *"));
 const control=text("input","plants-device-input");
 control.type=type;
 control.value=value;
 control.required=required;
 control.disabled=disabled;
 control.placeholder=placeholder;
 if(unit)control.dataset.unit=unit;
 if(min!==undefined)control.min=String(min);
 if(max!==undefined)control.max=String(max);
 if(step!==undefined)control.step=String(step);
 const controlRow=text("span","plants-device-field-control");
 controlRow.classList.add("wd-edit-field");
 controlRow.append(control);
 if(unit)controlRow.append(text("span","plants-device-field-unit",unit,"Footnote/Regular"));
 wrapper.append(labelNode,controlRow);
 return {wrapper,input:control,label:labelNode};
}

function createFeedbackRow(label,value,{valueNode=null}={}){
 const row=text("div","plants-device-feedback-row");
 const valueElement=text("strong","plants-device-feedback-value");
 if(valueNode)valueElement.append(valueNode);
 else valueElement.textContent=value;
 row.append(
  text("span","plants-device-feedback-label",label,"Footnote/Regular"),
  valueElement
 );
 return row;
}

function dialogTitleIcon(file,{danger=false}={}){
 const host=text("span",`plants-device-dialog-title-icon${danger?" is-danger":""}`);
 host.append(createMaskedIcon(file,"plants-device-dialog-title-glyph"));
 return host;
}

function createDialog({
 title,description="",className="",titleIcon=null,showHeader=true,showClose=true,content,restoreFocus=true,onClose=null
}){
 if(activeDialog){
  const previous=activeDialog;
  activeDialog=null;
  previous.close({immediate:true,restoreFocus:false});
 }
 const previousFocus=document.activeElement;
 const layer=text("div","plants-device-modal wd-search-fullscreen");
 const backdrop=text("div","wd-search-backdrop");
 backdrop.setAttribute("aria-hidden","true");
 const dialog=text("section",`plants-device-dialog wd-search-panel wd-search-panel--fullscreen wd-glass--surface wd-glass-popup ${className}`.trim());
 const frame=text("div","plants-device-dialog-frame wd-search-panel-frame");
 dialog._wdFade=frame;
 dialog.setAttribute("role","dialog");
 dialog.setAttribute("aria-modal","true");
 dialog.setAttribute("aria-label",title);
 const headingId=`plants-device-dialog-${Math.random().toString(36).slice(2)}`;
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
    icon:actionIcon(assetURL("tab-close.svg"))
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
 glass.addSurface({host:dialog,radius:30});
 if(closeButton)glass.addSurface({host:closeButton,radius:18});

 let closed=false;
 let closing=false;
 const surfaceHosts=[dialog,...(closeButton?[closeButton]:[])];
 function registerSurface(host,radius=18){
  if(!host)return;
  glass.addSurface({host,radius});
  surfaceHosts.push(host);
 }
 function release(){
  if(closed)return;
  closed=true;
  try{onClose?.();}catch{}
  for(const host of surfaceHosts)glass.removeSurface(host);
  layer.remove();
  if(activeDialog?.layer===layer)activeDialog=null;
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
  setTimeout(release,fullscreenOverlayExitDuration());
 }
 closeButton?.addEventListener("click",()=>close());
 layer.addEventListener("pointerdown",event=>{
   if(event.target===layer||event.target===backdrop)close();
 });
 layer.addEventListener("keydown",event=>{
  if(event.key==="Escape"){
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
  setTimeout(()=>layer.removeAttribute("data-entering"),fullscreenOverlayEnterDuration());
 }
 const firstTarget=dialog.querySelector("[autofocus],input:not(:disabled),button:not(.plants-device-dialog-close)");
 requestAnimationFrame(()=>firstTarget?.focus({preventScroll:true}));
 const controller={layer,dialog,close,registerSurface};
 activeDialog=controller;
 return controller;
}

let glass=null;
let activeDialog=null;

function openAddDialog(plant,onChange){
 const form=text("form","plants-device-dialog-form");
 const body=text("div","plants-device-dialog-body");
 const copy=text("p","plants-device-form-note","Link a device by its serial number. In this local preview, the serial prefix selects a sample device type; no external device is contacted.","Footnote/Regular");
 const serial=field({label:"Device SN",required:true,placeholder:"Enter device serial number",min:4});
 const name=field({label:"Device name",required:true,placeholder:"e.g. iHybrid",min:2});
 const error=text("p","plants-device-form-error");
 error.hidden=true;
 error.setAttribute("role","alert");
 const fields=text("div","plants-device-form-grid");
 fields.append(serial.wrapper,name.wrapper);
 body.append(copy,fields,error);
 const actions=text("div","plants-device-dialog-actions");
 const cancel=createStandardButton({label:"Cancel"});
 const submit=createStandardButton({label:"Add device",variant:"primary"});
 submit.type="submit";
 submit.disabled=true;
 actions.append(cancel,submit);
 form.append(body,actions);

 function sync(){
  const ready=serial.input.value.trim().length>=4&&name.input.value.trim().length>=2;
  submit.disabled=!ready;
  error.hidden=true;
 }
 serial.input.addEventListener("input",sync);
 name.input.addEventListener("input",sync);
 const modal=createDialog({
  title:"Add device",
  className:"plants-device-dialog--form",
  titleIcon:dialogTitleIcon(assetURL("plants/plus.svg")),
  content:form
 });
 modal.registerSurface(cancel,18);
 modal.registerSurface(submit,18);
 cancel.addEventListener("click",()=>modal.close());
 form.addEventListener("submit",event=>{
  event.preventDefault();
  const sn=serial.input.value.trim();
  const deviceName=name.input.value.trim();
  const store=storeFor(plant);
  if(store.devices.some(device=>device.serial.toLowerCase()===sn.toLowerCase())){
   error.textContent="This serial number is already linked to the plant.";
   error.hidden=false;
   serial.input.focus();
   return;
  }
  const upper=sn.toUpperCase();
  const type=upper.startsWith("WMT")?"heater":/^R11|STORAGE|BAT/.test(upper)?"bms":"inverter";
  const created=createDevice(plant,type,store.devices.length,{
   name:deviceName,
   serial:sn,
   checkCode:String(1000+(hash(sn)%9000)),
   status:"online"
  });
  store.devices.push(created);
  modal.close();
  onChange?.("add",created);
 });
 requestAnimationFrame(()=>serial.input.focus({preventScroll:true}));
}

function openRenameDialog(device,onChange){
 const form=text("form","plants-device-dialog-form");
 const body=text("div","plants-device-dialog-body");
 const name=field({label:"Device name",value:device.name,required:true,placeholder:"Enter a device name"});
 body.append(name.wrapper);
 const actions=text("div","plants-device-dialog-actions");
 const cancel=createStandardButton({label:"Cancel"});
 const save=createStandardButton({label:"Save name",variant:"primary"});
 save.type="submit";
 save.disabled=true;
 const modal=createDialog({
  title:"Rename device",
  titleIcon:dialogTitleIcon(assetURL("plants/devices/actions/rename.svg")),
  content:form
 });
 actions.append(cancel,save);
 form.append(body,actions);
 modal.registerSurface(cancel,18);
 modal.registerSurface(save,18);
 cancel.addEventListener("click",()=>modal.close());
 function syncSave(){
  const next=name.input.value.trim();
  save.disabled=!next||next===device.name;
 }
 name.input.addEventListener("input",syncSave);
 form.addEventListener("submit",event=>{
  event.preventDefault();
  if(save.disabled)return;
  const next=name.input.value.trim();
  device.name=next;
  modal.close();
  onChange?.("rename",device);
 });
}

function openReplaceDialog(device,onChange){
 const form=text("form","plants-device-dialog-form");
 const body=text("div","plants-device-dialog-body");
 const note=text("p","plants-device-form-note","Replace the linked unit while retaining its position in this plant. The change remains local to this preview.","Footnote/Regular");
 const old=text("section","plants-device-replace-old");
 old.append(
  text("h3","plants-device-section-label","Current device","Footnote/Emphasized"),
  createFeedbackRow("Serial number",device.serial),
  createFeedbackRow("Check code",device.checkCode)
 );
 const newFields=text("div","plants-device-form-grid");
 const serial=field({label:"New device SN",required:true,placeholder:"Enter replacement SN"});
 const check=field({label:"Check code",required:true,placeholder:"4-digit code",min:4,max:4});
 const name=field({label:"Device name",value:device.name});
 const remarks=field({label:"Remarks",required:true,placeholder:"Reason for replacement"});
 newFields.append(serial.wrapper,check.wrapper,name.wrapper,remarks.wrapper);
 const columns=text("div","plants-device-replace-columns");
 const currentColumn=text("div","plants-device-replace-column");
 const replacementColumn=text("div","plants-device-replace-column");
 currentColumn.append(note,old);
 replacementColumn.append(newFields);
 columns.append(currentColumn,replacementColumn);
 body.append(columns);
 const actions=text("div","plants-device-dialog-actions");
 const cancel=createStandardButton({label:"Cancel"});
 const submit=createStandardButton({label:"Replace device",variant:"primary"});
 submit.type="submit";
 submit.disabled=true;
 actions.append(cancel,submit);
 form.append(body,actions);
 const sync=()=>{submit.disabled=!serial.input.value.trim()||!check.input.value.trim()||!remarks.input.value.trim();};
 serial.input.addEventListener("input",sync);
 check.input.addEventListener("input",sync);
 remarks.input.addEventListener("input",sync);
 const modal=createDialog({
  title:"Replace device",
  className:"plants-device-dialog--wide",
  titleIcon:dialogTitleIcon(assetURL("plants/devices/actions/replace.svg")),
  content:form
 });
 modal.registerSurface(cancel,18);
 modal.registerSurface(submit,18);
 cancel.addEventListener("click",()=>modal.close());
 form.addEventListener("submit",event=>{
  event.preventDefault();
  if(submit.disabled)return;
  device.serial=serial.input.value.trim();
  device.checkCode=check.input.value.trim();
  device.name=name.input.value.trim()||device.name;
  modal.close();
  onChange?.("replace",device);
 });
}

function openUnbindDialog(device,onUnbind){
 const content=text("div","plants-device-dialog-form");
 const body=text("div","plants-device-confirm-dialog");
 const mark=text("span","plants-device-confirm-mark");
 mark.append(actionIcon(assetURL("plants/devices/actions/delete.svg")));
 const intro=text("div","plants-device-confirm-intro");
 intro.append(
  mark,
  text("h2","plants-device-confirm-title",`Unbind ${device.name}?`,"Subheadline/Emphasized"),
  text("p","plants-device-confirm-description",`Device ${device.serial} will be removed from this plant. This does not erase device history.`,"Footnote/Regular")
 );
 const actions=text("div","plants-device-confirm-actions");
 const cancel=createStandardButton({label:"Cancel"});
 const unbind=createStandardButton({label:"Unbind device",className:"plants-device-danger-button"});
 actions.append(cancel,unbind);
 body.append(intro,actions);
 content.append(body);
 const modal=createDialog({
  title:"Unbind device",
  className:"plants-device-dialog--confirm",
  showHeader:false,
  showClose:false,
  content
 });
 modal.registerSurface(cancel,18);
 modal.registerSurface(unbind,18);
 cancel.addEventListener("click",()=>modal.close());
 unbind.addEventListener("click",()=>{
  modal.close();
  onUnbind(device);
 });
}

const INVERTER_MODES=Object.freeze([
 {id:"general",label:"General mode",description:"Solar supplies the home first, then charges the battery and exports surplus energy."},
 {id:"peak",label:"Peak load shifting",description:"Caps grid import and shifts flexible consumption away from peak periods."},
 {id:"economic",label:"Economic mode",description:"Uses configured price windows to charge and discharge the battery."},
 {id:"ups",label:"UPS mode",description:"Reserves battery capacity for backup loads when the grid is unavailable."},
 {id:"tou",label:"ToU mode",description:"Applies time-of-use schedules to optimize import, storage and export."},
 {id:"offgrid",label:"Off-grid mode",description:"Prioritizes solar and battery for backup loads without relying on the grid."}
]);

function settingsSchema(device){
 if(device.type==="inverter"){
  return [
   {id:"running",label:"Running mode",type:"mode",options:INVERTER_MODES},
   {id:"battery",label:"Battery management",fields:[
    {key:"minimumSoc",label:"Minimum SOC",type:"number",unit:"%",min:5,max:100},
    {key:"backupReserve",label:"Backup reserve",type:"number",unit:"%",min:0,max:100},
    {key:"chargeWindow",label:"Default charge window",type:"text"}
   ]},
   {id:"professional",label:"Professional settings",fields:[
    {key:"gridCode",label:"Grid code",type:"text"},
    {key:"maxGridPower",label:"Max. grid power",type:"number",unit:"kW",min:1,max:80},
    {key:"exportLimit",label:"Export limit",type:"number",unit:"%",min:0,max:100}
   ]},
   {id:"safety",label:"Safety-locked parameters",type:"locked",rows:[
    ["Grid protection","Locked by grid code"],
    ["Battery protection","Automatic"],
    ["Anti-islanding","Enabled"],
    ["Firmware integrity","Verified"]
   ]},
   {id:"network",label:"Networking",type:"readonly",rows:[
    ["Connection","Wi-Fi"],
    ["Signal","Strong"],
    ["IP address","192.168.10.42"],
    ["Cloud status","Connected"]
   ]},
   {id:"shadow",label:"Shadow scan",fields:[
    {key:"shadowScan",label:"Automatic shadow scan",type:"switch"},
    {key:"fastRestart",label:"Fast restart after grid recovery",type:"switch"}
   ]},
   {id:"operation",label:"Operation control",fields:[
    {key:"acOutput",label:"AC output",type:"text"},
    {key:"remoteControl",label:"Allow remote control",type:"switch"}
   ]},
   {id:"other",label:"Other settings",fields:[
    {key:"deviceLocation",label:"Device location",type:"text"}
   ]}
  ];
 }
 if(device.type==="bms"){
  return [
   {id:"battery",label:"Battery strategy",type:"mode",options:[
    {id:"self",label:"Self-consumption",description:"Prioritize locally generated energy and preserve the configured reserve."},
    {id:"backup",label:"Backup first",description:"Keep more capacity available for outages and critical loads."},
    {id:"manual",label:"Manual control",description:"Use fixed charge and discharge limits for commissioning work."}
   ]},
   {id:"limits",label:"Charge limits",fields:[
    {key:"minimumSoc",label:"Minimum SOC",type:"number",unit:"%",min:5,max:100},
    {key:"backupReserve",label:"Backup reserve",type:"number",unit:"%",min:0,max:100},
    {key:"chargeLimit",label:"Charge power limit",type:"number",unit:"%",min:10,max:100},
    {key:"dischargeLimit",label:"Discharge power limit",type:"number",unit:"%",min:10,max:100}
   ]},
   {id:"clusters",label:"Cluster management",type:"readonly",rows:device.clusters.map(cluster=>[
    cluster.label,
    `${cluster.soc} SOC · ${cluster.stateOfHealth} SOH`
   ])},
   {id:"network",label:"Networking",type:"readonly",rows:[
    ["Connection","CAN"],
    ["Cloud status","Connected"],
    ["Balancing",device.settings.balancing]
   ]},
   {id:"safety",label:"Safety",type:"locked",rows:[
    ["Cell protection","Enabled"],
    ["Over-temperature protection","Enabled"],
    ["Battery breaker","Closed"]
   ]}
  ];
 }
 return [
  {id:"heating",label:"Operating mode",type:"mode",options:[
   {id:"comfort",label:"Comfort",description:"Maintain the primary heating target throughout occupied hours."},
   {id:"eco",label:"Eco",description:"Reduce output near the night setpoint while prioritizing efficiency."},
   {id:"manual",label:"Manual",description:"Keep a fixed target until the mode is changed locally."}
  ]},
  {id:"setpoint",label:"Temperature",fields:[
   {key:"targetTemperature",label:"Heating target",type:"number",unit:"°C",min:20,max:70},
   {key:"nightSetback",label:"Night setback",type:"number",unit:"°C",min:15,max:55},
   {key:"heatingWindow",label:"Active heating window",type:"text"}
  ]},
  {id:"controls",label:"Operation control",fields:[
   {key:"manualOverride",label:"Allow manual override",type:"switch"},
   {key:"cloudControl",label:"Allow cloud control",type:"switch"}
  ]},
  {id:"network",label:"Networking",type:"readonly",rows:[
   ["Connection",device.status==="offline"?"Disconnected":"Wi-Fi"],
   ["Cloud status",device.status==="offline"?"Offline":"Connected"],
   ["Firmware channel","Stable"]
  ]},
  {id:"safety",label:"Safety",type:"locked",rows:[
   ["Dry-run protection","Enabled"],
   ["Over-temperature protection","Enabled"],
   ["Heating element lock","Verified"]
  ]}
 ];
}

function openSettingsDialog(device,onSave){
 const form=text("form","plants-device-dialog-form plants-device-settings-form");
 const shell=text("div","plants-device-settings");
 const nav=text("nav","plants-device-settings-nav");
 nav.setAttribute("aria-label","Device settings sections");
 const main=text("section","plants-device-settings-main");
 const mainHead=text("header","plants-device-settings-main-head");
 const mainTitle=text("h3","plants-device-settings-main-title");
 const mainDescription=text("p","plants-device-settings-main-description");
 mainHead.append(mainTitle,mainDescription);
 const viewport=text("div","plants-device-settings-viewport");
 const content=text("div","plants-device-settings-content");
 viewport.append(content);
 main.append(mainHead,viewport);
 const actions=text("footer","plants-device-dialog-actions");
 const reset=createStandardButton({label:"Cancel"});
 const save=createStandardButton({label:"Save changes",variant:"primary"});
 save.type="submit";
 save.disabled=true;
 actions.append(reset,save);
 shell.append(nav,main);
 form.append(shell,actions);

 const schema=settingsSchema(device);
 const draft={...device.settings};
 const initialSettings=JSON.stringify(device.settings);
 let activeId=schema[0].id;
 let dirty=false;
 const feedback=createScrollFeedback({
  host:viewport,
  viewport,
  content,
  elastic:false,
  bottomInset:0
 });

 function setDirty(){
  dirty=JSON.stringify(draft)!==initialSettings;
  save.disabled=!dirty;
 }

 function renderCategory(category){
  mainTitle.textContent=category.label;
  mainDescription.textContent=category.type==="mode"
   ?"Choose how this device prioritizes energy."
   :category.type==="locked"
    ?"These values are protected and cannot be changed from this page."
    :category.type==="readonly"
     ?"Connection details reported by the device."
     :"Changes are kept in this browser session until the page is refreshed.";
  const children=[];
  if(category.type==="mode"){
   const group=text("fieldset","plants-device-mode-list");
   group.append(text("legend","plants-device-visually-hidden","Mode"));
   const currentKey=device.type==="inverter"?"runningMode":device.type==="bms"?"batteryStrategy":"operatingMode";
   for(const option of category.options){
    const card=text("label","plants-device-mode-card");
    const radio=text("input","plants-device-mode-input");
    radio.type="radio";
    radio.name=`mode-${device.type}`;
    radio.value=option.id;
    radio.checked=(draft[currentKey]||category.options[0].id)===option.id;
    const glyph=text("span","plants-device-mode-glyph");
    const copy=text("span","plants-device-mode-copy");
    copy.append(
     text("strong","plants-device-mode-label",option.label,"Footnote/Medium"),
     text("span","plants-device-mode-description",option.description,"Caption1/Regular")
    );
    card.append(radio,glyph,copy);
    radio.addEventListener("change",()=>{
     if(!radio.checked)return;
     draft[currentKey]=option.id;
     setDirty();
    });
    group.append(card);
   }
   children.push(group);
  }else if(category.type==="locked"||category.type==="readonly"){
   const rows=text("div","plants-device-settings-readonly");
   for(const [label,value] of category.rows)rows.append(createFeedbackRow(label,value));
   if(category.type==="locked"){
    const note=text("p","plants-device-locked-note","Safety and grid-protection values remain read-only in this preview.");
    note.prepend(actionIcon(assetURL("settings.svg")));
    rows.append(note);
   }
   children.push(rows);
  }else{
   const grid=text("div","plants-device-settings-fields");
   for(const definition of category.fields){
    if(definition.type==="switch"){
     const row=text("label","plants-device-switch-row");
     const copy=text("span","plants-device-switch-copy");
     copy.append(text("span","plants-device-switch-label",definition.label,"Footnote/Medium"));
     const toggle=text("span","plants-device-switch-control");
     const input=text("input","plants-device-switch-input");
     input.type="checkbox";
     input.checked=Boolean(draft[definition.key]);
     toggle.append(input,text("span","plants-device-switch-track"),text("span","plants-device-switch-thumb"));
     row.append(copy,toggle);
     input.addEventListener("change",()=>{
      draft[definition.key]=input.checked;
      setDirty();
     });
     grid.append(row);
    }else{
     const control=field({
      label:definition.label,
      value:draft[definition.key]??"",
      type:definition.type,
      unit:definition.unit,
      min:definition.min,
      max:definition.max,
      step:definition.step
     });
     control.input.addEventListener("input",()=>{
      draft[definition.key]=control.input.value;
      setDirty();
     });
     grid.append(control.wrapper);
    }
   }
   children.push(grid);
  }
  content.replaceChildren(...children);
  feedback.sync();
  requestAnimationFrame(()=>feedback.sync());
  for(const button of nav.querySelectorAll("button")){
   const active=button.dataset.section===category.id;
   button.classList.toggle("is-active",active);
   button.setAttribute("aria-current",active?"true":"false");
  }
 }

 for(const category of schema){
  const button=text("button","plants-device-settings-tab wd-control-state wd-press-scale");
  button.type="button";
  button.dataset.section=category.id;
  button.append(text("span","wd-control-label",category.label,"Footnote/Medium"));
  button.addEventListener("click",()=>{
   activeId=category.id;
   renderCategory(category);
  });
  nav.append(button);
 }
 const modal=createDialog({
  title:`${device.name} settings`,
  className:"plants-device-dialog--settings plants-device-dialog--wide",
  titleIcon:dialogTitleIcon(assetURL("settings.svg")),
  content:form,
  onClose:()=>feedback.destroy()
 });
 modal.registerSurface(reset,18);
 modal.registerSurface(save,18);
 const initial=schema.find(category=>category.id===activeId)||schema[0];
 renderCategory(initial);
 reset.addEventListener("click",()=>modal.close());
 form.addEventListener("submit",event=>{
  event.preventDefault();
  if(!dirty)return;
  device.settings={...draft};
  modal.close();
  onSave?.(device);
 });
 return modal;
}

async function copyText(value){
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(value);
   return true;
  }
 }catch{
  // Fall back to a temporary text field when clipboard permission is unavailable.
 }
 const field=document.createElement("textarea");
 field.value=value;
 field.setAttribute("readonly","");
 field.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
 document.body.append(field);
 field.select();
 let copied=false;
 try{
  copied=document.execCommand("copy");
 }catch{
  copied=false;
 }
 field.remove();
 return copied;
}

function createSerialCopyButton(value,{toast}={}){
 const button=text("button","plants-device-serial-copy",value||"—");
 button.type="button";
 button.disabled=!value;
 if(value){
  button.title=`Copy SN ${value}`;
  button.setAttribute("aria-label",`Copy serial number ${value}`);
 }
 button.addEventListener("click",async event=>{
  event.preventDefault();
  event.stopPropagation();
  if(!value)return;
  const copied=await copyText(value);
  toast?.(copied?"Serial number copied":"Could not copy serial number");
 });
 return button;
}

function createClusterDisclosure(cluster,{toast}={}){
 const group=text("div","plants-device-cluster wd-hover-reveal-host");
 const hoverSurface=text("span","plants-device-cluster-hover wd-hover-reveal");
 hoverSurface.setAttribute("aria-hidden","true");
 const button=text("button","plants-device-cluster-toggle wd-control-state");
 button.type="button";
 button.setAttribute("aria-expanded",String(cluster.expanded));
 const label=text("span","plants-device-cluster-label",cluster.label,"Footnote/Medium");
 const chevron=actionIcon(opaqueMaskURL("asset-14.svg"));
 chevron.classList.add("plants-device-cluster-chevron");
 button.append(label,chevron);
 const detail=text("div","plants-device-cluster-detail");
 detail.id=`plants-device-${cluster.id}-detail`;
 button.setAttribute("aria-controls",detail.id);
 detail.hidden=!cluster.expanded;
 const subMaster=text("section","plants-device-cluster-section");
 subMaster.append(text("h4","plants-device-cluster-section-title","Sub-master BMS","Caption1/Emphasized"));
 const subMasterFields=text("div","plants-device-cluster-submaster");
 for(const [label,value] of [
  ["ID",cluster.subMaster.id],
  ["Model",cluster.subMaster.model],
  ["Hardware version",cluster.subMaster.hardware],
  ["Firmware version",cluster.subMaster.firmware],
  ["SN",cluster.subMaster.serial]
 ]){
  subMasterFields.append(createFeedbackRow(
   label,
   value,
   label==="SN"?{valueNode:createSerialCopyButton(value,{toast})}:{}
  ));
 }
 subMaster.append(subMasterFields);

 const batteries=text("section","plants-device-cluster-section");
 batteries.append(text("h4","plants-device-cluster-section-title","Batteries","Caption1/Emphasized"));
 const table=text("table","plants-device-battery-table");
 const caption=text("caption","plants-device-visually-hidden",`${cluster.label} batteries`,"Caption2/Regular");
 const colgroup=document.createElement("colgroup");
 for(const className of ["is-id","is-hardware","is-firmware","is-sn"]){
  const col=document.createElement("col");
  col.className=className;
  colgroup.append(col);
 }
 const head=text("thead");
 const headRow=text("tr");
 for(const label of ["ID","Hardware version","Firmware version","SN"]){
  headRow.append(text("th","plants-device-battery-heading",label,"Caption2/Regular"));
 }
 head.append(headRow);
 const body=text("tbody");
 for(const battery of cluster.batteries){
  const row=text("tr","plants-device-battery-row");
  for(const [label,value] of [
   ["ID",battery.id],
   ["Hardware version",battery.hardware],
   ["Firmware version",battery.firmware],
   ["SN",battery.serial]
  ]){
   const cell=text("td","plants-device-battery-cell",undefined,"Caption1/Regular");
   cell.dataset.label=label;
   if(label==="SN")cell.append(createSerialCopyButton(value,{toast}));
   else cell.textContent=value;
   row.append(cell);
  }
  body.append(row);
 }
 table.append(caption,colgroup,head,body);
 batteries.append(table);
 detail.append(subMaster,batteries);
 group.addEventListener("click",event=>{
  if(event.target.closest?.(".plants-device-serial-copy"))return;
  cluster.expanded=!cluster.expanded;
  button.setAttribute("aria-expanded",String(cluster.expanded));
  detail.hidden=!cluster.expanded;
 });
 group.append(hoverSurface,button,detail);
 return group;
}

function createDeviceFields(device){
 if(device.type==="bms"){
  return [
   ["Firmware version",device.firmware],
   ["Installation capacity",device.capacity]
  ];
 }
 if(device.type==="heater"){
  return [
   ["Model",device.model],
   ["Hardware version",device.hardware],
   ["Firmware version",device.firmware],
   ["SN",device.serial],
   ["Check code",device.checkCode]
  ];
 }
 return [
  ["Model",device.model],
  ["Hardware version",device.hardware],
  ["Firmware version",device.firmware],
  ["Boot version",device.boot],
  ["SN",device.serial],
  ["Check code",device.checkCode]
 ];
}

function createDeviceCard(device,{registerSurface,openMenu,toast,onChange}){
 const meta=DEVICE_LIBRARY[device.type];
 const card=text("article","plants-device-card");
 card.dataset.deviceId=device.key;
 card.dataset.deviceType=device.type;
 const media=text("div","plants-device-media");
 const image=document.createElement("img");
 image.src=meta.image;
 image.alt="";
 image.draggable=false;
 media.append(image);

 const main=text("div","plants-device-main");
 const head=text("header","plants-device-head");
 const status=deviceStatus(device);
 const metaItems=device.type==="inverter"
  ?[meta.category,device.mode,device.running]
  :[meta.category,meta.product];
 const identity=createDeviceIdentity({
  name:device.name,
  status,
  metaItems
 }).element;
 const actions=text("div","plants-device-actions");
 const actionsHost=text("div","plants-device-actions-buttons");
 const firmwareButton=createActionButton({
  label:`Check firmware for ${device.name}`,
  iconFile:assetURL("plants/devices/actions/device-upgrade.svg"),
  onClick:()=>toast("Firmware update check is not connected in this local preview.")
 });
 const settingsButton=device.type==="bms"?null:createActionButton({
  label:`Open ${device.name} settings`,
  iconFile:assetURL("settings.svg"),
  onClick:()=>openSettingsDialog(device,changed=>{
   if(changed.type==="inverter"){
    const mode=INVERTER_MODES.find(option=>option.id===changed.settings.runningMode);
    if(mode)changed.mode=mode.label;
   }
   onChange?.();
   toast(`Saved settings for ${changed.name}`);
  })
 });
 const moreButton=createActionButton({
  label:`More actions for ${device.name}`,
  iconFile:opaqueMaskURL("asset-70.svg"),
  onClick:()=>openMenu(moreButton,device)
 });
 firmwareButton.classList.add("plants-device-firmware");
 const actionButtons=[firmwareButton,...(settingsButton?[settingsButton]:[]),moreButton];
 actionsHost.append(...actionButtons);
 actions.append(actionsHost);
 head.append(identity,actions);

 const fields=text("div","plants-device-fields");
 for(const [label,value] of createDeviceFields(device)){
  const item=text("div","plants-device-field-item");
  const valueElement=text("strong","plants-device-field-value",undefined,"Footnote/Medium");
  if(label==="SN")valueElement.append(createSerialCopyButton(value,{toast}));
  else valueElement.textContent=value||"—";
  item.append(
   text("span","plants-device-field-name",label,"Caption1/Regular"),
   valueElement
  );
  fields.append(item);
 }
 main.append(head,fields);
 if(device.type==="bms"&&device.clusters.length){
  const clusters=text("div","plants-device-clusters");
  for(const cluster of device.clusters)clusters.append(createClusterDisclosure(cluster,{toast}));
  main.append(clusters);
 }
 card.append(media,main);
 for(const button of actionButtons)registerSurface(button,18);
 return card;
}

export function createPlantDevices({plant,glass:material,registerPanel,close,toast,onDeviceCountChange}){
 glass=material;
 const root=text("section","plants-devices");
 const host=text("div","plants-devices-host");
 root.setAttribute("aria-label",`Devices for ${plant.name||"plant"}`);
 const toolbar=text("header","plants-devices-toolbar");
 const add=createStandardButton({
  label:"Add device",
  icon:actionIcon(assetURL("plants/plus.svg")),
  className:"plants-devices-add"
 });
 toolbar.append(add);
 const list=text("div","plants-devices-list");
 function syncDeviceLayout(){
  const hostBox=host.getBoundingClientRect();
  for(const card of list.querySelectorAll(".plants-device-card")){
   const fields=card.querySelector(".plants-device-fields");
   const cardBox=card.getBoundingClientRect();
   const columnWidth=parseFloat(getComputedStyle(fields).gridTemplateColumns);
   if(Number.isFinite(columnWidth))card.style.setProperty("--plants-fields-column",`${columnWidth}px`);
   card.style.setProperty("--plants-card-divider-left",`${cardBox.left-hostBox.left}px`);
   card.style.setProperty("--plants-card-divider-right",`${hostBox.right-cardBox.right}px`);
  }
 }
 const deviceLayoutObserver=new ResizeObserver(syncDeviceLayout);
 deviceLayoutObserver.observe(list);
 deviceLayoutObserver.observe(host);
 const empty=text("div","plants-devices-empty");
 empty.hidden=true;
 empty.append(
  text("h2","plants-devices-empty-title","No devices linked","Subheadline/Emphasized"),
  text("p","plants-devices-empty-copy","Add a device by serial number to start monitoring this plant.","Footnote/Regular")
 );
 root.append(toolbar,list,empty);
 host.append(root);

 glass.addSurface({host:add,radius:18});
 const cardSurfaces=new Set();
 function clearCardSurfaces(){
  for(const host of cardSurfaces)glass.removeSurface(host);
  cardSurfaces.clear();
 }
 function registerCardSurface(node,radius){
  glass.addSurface({host:node,radius});
  cardSurfaces.add(node);
 }
 function openMenu(anchor,device){
  const panel=document.createElement("div");
  panel.className="popover popover--menu plants-device-actions-menu";
  const listNode=menuList();
  const rows=[
   menuRow("Run system test",{iconNode:deviceMenuIcon("system-tests.svg","system-tests"),showCheck:false,onSelect:()=>{
    close(true);
    toast("System tests require the device service connection and are not run in this preview.");
   }}),
   menuRow("Replace device",{iconNode:deviceMenuIcon("replace.svg","replace"),showCheck:false,onSelect:()=>{
    close(true);
    openReplaceDialog(device,()=>{
     render();
     toast(`Replacement details saved for ${device.name}`);
    });
   }}),
   menuRow("Rename",{iconNode:deviceMenuIcon("rename.svg","rename"),showCheck:false,onSelect:()=>{
    close(true);
    openRenameDialog(device,()=>{
     render();
     toast(`Renamed device to ${device.name}`);
    });
   }}),
   menuRow("Unbind device",{iconNode:deviceMenuIcon("delete.svg","unbind"),showCheck:false,onSelect:()=>{
    close(true);
    openUnbindDialog(device,removed=>{
     const store=storeFor(plant);
     store.devices=store.devices.filter(item=>item!==removed);
     render();
     toast(`${removed.name} unbound from ${plant.name||"this plant"}`);
    });
   }})
  ];
  rows[rows.length-1].classList.add("is-danger");
  listNode.append(...rows);
  mountMenu(panel,{label:`Actions for ${device.name}`,children:[listNode]});
  registerPanel(panel,anchor,{label:`Actions for ${device.name}`,align:"end",radius:30,width:216});
 }
 function render(){
  clearCardSurfaces();
  const devices=storeFor(plant).devices;
  empty.hidden=devices.length!==0;
  list.hidden=devices.length===0;
  list.replaceChildren(...devices.map(device=>createDeviceCard(device,{
   registerSurface:registerCardSurface,
   openMenu,
   toast,
   onChange:render
  })));
  syncDeviceLayout();
  onDeviceCountChange?.(devices.length);
 }
 add.addEventListener("click",()=>openAddDialog(plant,()=>{
  render();
  toast(`Device added to ${plant.name||"this plant"}`);
 }));
 render();
 return {
  element:host,
  render,
  destroy(){
   close?.(true);
   if(activeDialog){
    const modal=activeDialog;
    activeDialog=null;
    modal.close({immediate:true,restoreFocus:false});
   }
   clearCardSurfaces();
   deviceLayoutObserver.disconnect();
   glass.removeSurface(add);
  }
 };
}
