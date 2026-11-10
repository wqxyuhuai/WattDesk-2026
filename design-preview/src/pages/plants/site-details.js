import {createTextElement as text} from "../../foundations/dom.js";
import {applyTypeStyle} from "../../foundations/typography.js";
import {animateContentHeight} from "../../foundations/motion.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createStandardButton} from "../../components/controls.js";
import {createAvatar} from "../../components/avatar.js";
import {menuList,mountMenu,menuRow} from "../../components/menu-popover.js";
import {createToggleSwitch} from "../../components/toggle-switch.js";
import {CURRENT_USER} from "../service-ticket/data.js";
import {PLANT_TYPES,companyLabel,typeLabel} from "./data.js";
import {devicesFor,siteContextFor} from "./detail.js";

const TIMEZONE_BY_COUNTRY=Object.freeze({
 Germany:{timezone:"Europe/Berlin",area:"DE-LU",currency:"EUR",phone:+49},
 Sweden:{timezone:"Europe/Stockholm",area:"SE3",currency:"SEK",phone:+46},
 Netherlands:{timezone:"Europe/Amsterdam",area:"NL",currency:"EUR",phone:+31},
 Austria:{timezone:"Europe/Vienna",area:"AT",currency:"EUR",phone:+43}
});

const COUNTRY_OPTIONS=Object.freeze(Object.keys(TIMEZONE_BY_COUNTRY));
const TIMEZONE_OPTIONS=Object.freeze(["Europe/Berlin","Europe/Stockholm","Europe/Amsterdam","Europe/Vienna"]);
const AREA_OPTIONS=Object.freeze(["DE-LU","SE1","SE2","SE3","SE4","NL","AT"]);
const CURRENCY_OPTIONS=Object.freeze(["EUR","SEK"]);
const TYPE_OPTIONS=Object.freeze(PLANT_TYPES.map(type=>type.label));

function hash(value){
 return [...String(value)].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,7);
}

function round(value,digits=2){
 const factor=10**digits;
 return Math.round(value*factor)/factor;
}

function siteCountry(location){
 const index=String(location||"").lastIndexOf(",");
 return index>=0?location.slice(index+1).trim():"Germany";
}

function createdDate(plant){
 const seed=hash(plant.id);
 const year=2024+(seed%3);
 const month=1+(seed%12);
 const day=1+(seed%27);
 const hour=8+(seed%10);
 const minute=seed%60;
 const pad=value=>String(value).padStart(2,"0");
 return `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

export function defaultSiteDetails(plant){
 const context=siteContextFor(plant);
 const country=siteCountry(context.location);
 const locale=TIMEZONE_BY_COUNTRY[country]??TIMEZONE_BY_COUNTRY.Germany;
 const seed=hash(plant.id);
 const power=Math.abs(Number(plant.powerKw)||6.4);
 const battery=devicesFor(plant).includes("bms")?round(18+(seed%48)+((seed%17)/100),2):null;
 return {
  plantId:plant.id,
  plantName:plant.name||"?",
  plantType:typeLabel(plant.type),
  pvCapacity:String(round(Math.max(3.2,power*1.34),2)),
  batteryCapacity:battery===null?"":String(battery),
  createdAt:createdDate(plant),
  timezone:locale.timezone,
  country,
  area:locale.area,
  address:context.location,
  currency:locale.currency,
  gridPrice:locale.currency==="SEK"?"1.20":"0.32",
  owners:[{
   id:CURRENT_USER.id,
   name:CURRENT_USER.name,
   initials:CURRENT_USER.initials,
   email:"carl.wang@example.com",
   phone:`${locale.phone===46?"+46":"+49"} 70 555 0142`
  }],
  installerCompany:plant.installer||companyLabel(plant.companyId),
  contactPerson:"Maria Hoffmann",
  contactEmail:"service@installer.example",
  contactPhone:`${locale.phone===46?"+46":"+49"} 561 555 0125`,
  alarmEmailNotification:true,
  alarmEmailRecipient:"carl.wang@example.com",
  picture:null,
  visitors:[]
 };
}

function cloneDetails(value){
 return {
  ...value,
  owners:Array.isArray(value.owners)?value.owners.map(owner=>({...owner})):[],
  visitors:Array.isArray(value.visitors)?value.visitors.map(visitor=>({...visitor})):[]
 };
}

function section(title,content,{className="",id="",action=null}={}){
 const root=text("section",`site-details-section ${className}`.trim());
 if(id)root.id=id;
 const head=text("header","site-details-section-head");
 const heading=text("h2","site-details-section-title",title,"Subheadline/Emphasized");
 if(id)heading.id=`${id}-title`;
 root.setAttribute("aria-labelledby",heading.id||undefined);
 head.append(heading);
 if(action)head.append(action);
 const card=text("div","site-details-section-card wd-discussion-card");
 card.append(content);
 root.append(head,card);
 return {root,head,card};
}

function valueNode(value,{mono=false,multiline=false}={}){
 const node=text("span","site-details-value");
 node.classList.toggle("is-mono",mono);
 node.classList.toggle("is-multiline",multiline);
 node.textContent=value===""||value===null||value===undefined?"Not set":String(value);
 if(value===""||value===null||value===undefined)node.classList.add("is-empty");
 return node;
}

function viewRow(label,value,options={}){
 const row=text("div","site-details-row");
 row.append(text("span","site-details-label",label,"14/14 medium"),value instanceof Node?value:valueNode(value,options));
 return row;
}

function selectField({
 id,
 label,
 key,
 draft,
 dirty,
 options,
 registerPanel,
 close
}){
 const field=text("button","site-details-input site-details-select-trigger wd-control-state wd-edit-field");
 field.type="button";
 field.id=id;
 field.name=key;
 field.setAttribute("aria-label",label);
 field.setAttribute("aria-haspopup","listbox");
 const value=text("span","site-details-select-value",draft[key]??options[0]);
 value.setAttribute("aria-hidden","true");
 const chevron=createMaskedIcon(opaqueMaskURL("asset-14.svg"),"site-details-select-chevron");
 field.append(value,chevron);

 function update(next){
  draft[key]=next;
  field.dataset.value=next;
  value.textContent=next;
  dirty();
 }
 field.dataset.value=draft[key]??options[0];
 field.addEventListener("click",()=>{
  if(!registerPanel)return;
  if(field.getAttribute("aria-expanded")==="true"){
   close?.(true);
   return;
  }
  const panel=document.createElement("div");
  panel.className="popover popover--menu site-details-select-popover";
  const list=menuList();
  list.setAttribute("role","listbox");
  for(const option of options){
   const row=menuRow(option,{checked:option===draft[key]});
   row.setAttribute("role","option");
   row.setAttribute("aria-selected",String(option===draft[key]));
   row.dataset.value=option;
   row.addEventListener("click",()=>{
    update(option);
    close?.(true);
    requestAnimationFrame(()=>field.focus({preventScroll:true}));
   });
   list.append(row);
  }
  mountMenu(panel,{label:`Choose ${label}`,children:[list]});
  registerPanel(panel,field,{
   label:`Choose ${label}`,
   radius:24,
   width:Math.max(200,Math.min(280,field.offsetWidth||220)),
   align:"end",
   id:`site-details-select-${key}`
  });
 });
 return field;
}

function fieldRow({
 label,
 key,
 draft,
 dirty,
 type="text",
 options=null,
 unit="",
 readOnly=false,
 inputMode="",
 placeholder="",
 registerPanel=null,
 close=null
}){
 const row=text("div","site-details-row site-details-row--field");
 row.dataset.field=key;
 const labelNode=text("label","site-details-label",label,"14/14 medium");
 const id=`site-details-${key}`;
 labelNode.htmlFor=id;
 const control=text("span","site-details-field-stack");
 const line=text("span","site-details-field-line");
 let input;
 if(options){
  input=selectField({id,label,key,draft,dirty,options,registerPanel,close});
 }else{
  input=document.createElement("input");
  input.className="site-details-input wd-edit-field";
  input.type=type;
  input.value=draft[key]??"";
  if(inputMode)input.inputMode=inputMode;
  if(placeholder)input.placeholder=placeholder;
  input.addEventListener("input",()=>{
   draft[key]=input.value;
   dirty();
  });
 }
 input.id=id;
 input.name=key;
 input.disabled=readOnly;
 input.setAttribute("aria-label",label);
 if(unit)input.setAttribute("aria-describedby",`${id}-unit`);
 line.append(input);
 if(unit)line.append(text("span","site-details-unit",unit));
 control.append(line);
 const error=text("span","site-details-field-error");
 error.hidden=true;
 control.append(error);
 row.append(labelNode,control);
 return row;
}

function createBasicSection(draft,editing,dirty,{registerPanel,close}){
 const body=text("div","site-details-rows");
 body.append(
  editing
   ?fieldRow({label:"Plant type",key:"plantType",draft,dirty,options:TYPE_OPTIONS,registerPanel,close})
   :viewRow("Plant type",draft.plantType),
  editing
   ?fieldRow({label:"PV capacity",key:"pvCapacity",draft,dirty,type:"number",unit:"kWp",inputMode:"decimal"})
   :viewRow("PV capacity",`${draft.pvCapacity} kWp`,{mono:true}),
  editing
   ?fieldRow({label:"Battery installation capacity",key:"batteryCapacity",draft,dirty,type:"number",unit:"kWh",inputMode:"decimal"})
   :viewRow("Battery installation capacity",draft.batteryCapacity?`${draft.batteryCapacity} kWh`:"Not installed",{mono:true}),
  viewRow("Creation time",draft.createdAt,{mono:true}),
  editing
   ?fieldRow({label:"Timezone",key:"timezone",draft,dirty,options:TIMEZONE_OPTIONS,registerPanel,close})
   :viewRow("Timezone",`Local · ${draft.timezone}`,{mono:true}),
  editing
   ?fieldRow({label:"Country",key:"country",draft,dirty,options:COUNTRY_OPTIONS,registerPanel,close})
   :viewRow("Country",draft.country),
  editing
   ?fieldRow({label:"Price area",key:"area",draft,dirty,options:AREA_OPTIONS,registerPanel,close})
   :viewRow("Price area",draft.area,{mono:true}),
  editing
   ?fieldRow({label:"Address",key:"address",draft,dirty,placeholder:"Street, postcode, city, country"})
   :viewRow("Address",draft.address,{multiline:true})
 );
 return section("Basic information",body,{id:"site-basic-information"}).root;
}

function createPriceSection(draft,editing,dirty,{registerPanel,close}){
 const body=text("div","site-details-rows");
 body.append(
  editing
   ?fieldRow({label:"Currency",key:"currency",draft,dirty,options:CURRENCY_OPTIONS,registerPanel,close})
   :viewRow("Currency",draft.currency,{mono:true}),
  editing
   ?fieldRow({label:"Grid price/kWh",key:"gridPrice",draft,dirty,type:"number",unit:draft.currency,inputMode:"decimal"})
   :viewRow("Grid price/kWh",`${draft.gridPrice} ${draft.currency}`,{mono:true})
 );
 return section("Electricity price",body,{id:"site-electricity-price"}).root;
}

function ownerContact(owner){
 const copy=text("span","site-details-owner-copy");
 copy.append(text("span","site-details-owner-name",owner.name,"Subheadline/Regular"));
 const meta=text("span","site-details-owner-meta");
 const email=text("span","site-details-owner-meta-item",owner.email,"Footnote/Regular");
 const phone=text("span","site-details-owner-meta-item",owner.phone,"Footnote/Regular");
 meta.append(email,phone);
 copy.append(meta);
 return copy;
}

function createOwnerSection({
 draft,
 onOwnerMenu,
 onNewOwner,
 mountButton
}){
 const body=text("div","site-details-owner-body");
 const list=text("div","site-details-owner-list");
 if(draft.owners.length){
  for(const owner of draft.owners){
   const row=text("div","site-details-owner-row");
   const avatar=createAvatar(owner.initials||"?",{size:36,className:"site-details-owner-avatar"});
   const trigger=createStandardButton({
    label:`Actions for ${owner.name}`,
    iconOnly:true,
    className:"site-details-owner-menu-trigger",
    icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"site-details-menu-icon")
   });
   trigger.addEventListener("click",()=>onOwnerMenu(trigger,owner));
   mountButton(trigger);
   row.append(avatar,ownerContact(owner),trigger);
   list.append(row);
  }
 }else{
  list.append(text("p","site-details-inline-empty","No owner assigned.","Footnote/Regular"));
 }
 body.append(list);
 const newOwner=createStandardButton({
  label:"New owner",
  className:"site-details-new-owner",
  icon:createMaskedIcon(assetURL("plants/plus.svg"),"site-details-plus-icon")
 });
 newOwner.addEventListener("click",onNewOwner);
 mountButton(newOwner);
 return section("Owner information",body,{id:"site-owner-information",action:newOwner}).root;
}

function createInstallerSection({
 draft,
 editing,
 dirty,
 glass,
 mountToggle
}){
 const body=text("div","site-details-rows");
 body.append(
  editing
   ?fieldRow({label:"Installer company",key:"installerCompany",draft,dirty})
   :viewRow("Installer company",draft.installerCompany),
  editing
   ?fieldRow({label:"Contact person",key:"contactPerson",draft,dirty})
   :viewRow("Contact person",draft.contactPerson),
  editing
   ?fieldRow({label:"Contact email",key:"contactEmail",draft,dirty,type:"email",inputMode:"email"})
   :viewRow("Contact email",draft.contactEmail,{mono:true,multiline:true}),
  editing
   ?fieldRow({label:"Contact phone",key:"contactPhone",draft,dirty,type:"tel",inputMode:"tel"})
   :viewRow("Contact phone",draft.contactPhone,{mono:true})
 );
 const alarmRow=text("div","site-details-row site-details-row--switch");
 alarmRow.dataset.field="alarmEmailNotification";
 alarmRow.append(text("span","site-details-label","Alarm email notification","14/14 medium"));
 const alarmHost=text("span","site-details-field-stack site-details-alarm-control");
 const alarmSwitch=createToggleSwitch({
  label:"Alarm email notification",
  checked:draft.alarmEmailNotification,
  disabled:!editing,
  className:"site-details-alarm-switch",
  glass,
  onChange:value=>{
   draft.alarmEmailNotification=value;
   dirty();
  }
 });
 mountToggle(alarmSwitch);
 alarmHost.append(alarmSwitch.element);
 alarmRow.append(alarmHost);
 body.append(alarmRow);
 body.append(editing
  ?fieldRow({label:"Alarm email recipient",key:"alarmEmailRecipient",draft,dirty,type:"email",inputMode:"email"})
  :viewRow("Alarm email recipient",draft.alarmEmailRecipient,{multiline:true}));
 return section("Installer contact",body,{id:"site-installer-contact"}).root;
}

function createPictureSection({draft,mountButton,onAddPicture}){
 const body=text("div","site-details-picture");
 if(draft.picture){
  const image=document.createElement("img");
  image.className="site-details-picture-image";
  image.src=draft.picture;
  image.alt="Plant picture";
  body.append(image);
 }else{
  body.append(text("span","site-details-picture-empty","No plant picture","Footnote/Regular"));
 }
 const action=createStandardButton({
  label:draft.picture?"Replace picture":"Add picture",
  className:"site-details-picture-action",
  icon:createMaskedIcon(assetURL("plants/plus.svg"),"site-details-plus-icon")
 });
 action.addEventListener("click",onAddPicture);
 mountButton(action);
 body.append(action);
 return section("Plant picture",body,{id:"site-plant-picture"}).root;
}

function createVisitorSection(draft){
 const body=text("div","site-details-visitor");
 if(draft.visitors.length){
  const list=text("div","site-details-visitor-list");
  for(const visitor of draft.visitors){
   list.append(text("span","site-details-visitor-name",visitor.name||visitor.email||"Visitor","Footnote/Medium"));
  }
  body.append(list);
 }else{
  body.append(
   text("p","site-details-visitor-empty","No visitors","Footnote/Medium"),
   text("p","site-details-visitor-note","Visitor invitations are not connected in this preview.","Caption1/Regular")
  );
 }
 return section("Visitor management",body,{id:"site-visitor-management"}).root;
}

function normalize(value){
 return String(value??"").trim();
}

function validEmail(value){
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(value));
}

function validate(details){
 const errors={};
 const required=[
  ["plantName","Enter a plant name."],
  ["plantType","Select a plant type."],
  ["pvCapacity","Enter the PV capacity."],
  ["timezone","Select a timezone."],
  ["country","Select a country."],
  ["area","Select a price area."],
  ["address","Enter a site address."],
  ["currency","Select a currency."],
  ["gridPrice","Enter a grid price."],
  ["installerCompany","Enter the installer company."],
  ["contactPerson","Enter a contact person."],
  ["contactEmail","Enter a contact email."],
  ["contactPhone","Enter a contact phone number."]
 ];
 for(const [key,message] of required){
  if(!normalize(details[key]))errors[key]=message;
 }
 const pv=Number(details.pvCapacity);
 if(details.pvCapacity!==""&&(!Number.isFinite(pv)||pv<0))errors.pvCapacity="Use a positive PV capacity.";
 if(details.batteryCapacity!==""){
  const battery=Number(details.batteryCapacity);
  if(!Number.isFinite(battery)||battery<0)errors.batteryCapacity="Use a positive battery capacity.";
 }
 const price=Number(details.gridPrice);
 if(details.gridPrice!==""&&(!Number.isFinite(price)||price<0))errors.gridPrice="Use a positive grid price.";
 if(details.contactEmail&&!validEmail(details.contactEmail))errors.contactEmail="Enter a valid email address.";
 if(details.alarmEmailNotification){
  if(!normalize(details.alarmEmailRecipient))errors.alarmEmailRecipient="Add an alarm email recipient.";
  else if(!validEmail(details.alarmEmailRecipient))errors.alarmEmailRecipient="Enter a valid recipient email.";
 }
 return errors;
}

export function createPlantSiteDetails({
 plant,
 details=defaultSiteDetails(plant),
 glass,
 registerPanel,
 close,
 toast,
 onSave
}){
 let savedDetails=cloneDetails(details);
 let draft=cloneDetails(savedDetails);
 let editing=false;
 let dirty=false;
 let errorSummary=null;
 const buttonSurfaces=[];
 const toggleControls=[];
 const root=text("div","plant-site-details wd-page-content");

 function releaseButtonSurfaces(){
  while(buttonSurfaces.length){
   const host=buttonSurfaces.pop();
   glass?.removeSurface(host);
  }
 }

 function releaseToggleControls(){
  while(toggleControls.length)toggleControls.pop().destroy();
 }

 function mountButton(button){
  glass?.addSurface({host:button,radius:18});
  buttonSurfaces.push(button);
 }

 function mountToggle(control){
  toggleControls.push(control);
 }

 function markDirty(){
  dirty=true;
  clearErrors();
 }

 function clearErrors(){
  errorSummary?.setAttribute("hidden","");
  const titleInput=root.querySelector(".site-details-page-title-input");
  titleInput?.removeAttribute("aria-invalid");
  const titleError=root.querySelector(".site-details-page-title-error");
  if(titleError){
   titleError.hidden=true;
   titleError.textContent="";
  }
  for(const row of root.querySelectorAll(".site-details-row[data-field]")){
   row.classList.remove("has-error");
   row.querySelector(".site-details-input")?.removeAttribute("aria-invalid");
   const error=row.querySelector(".site-details-field-error");
   if(error){
    error.hidden=true;
    error.textContent="";
   }
  }
 }

 function showErrors(errors){
  clearErrors();
  const entries=Object.entries(errors);
  if(!entries.length)return false;
  for(const [key,message] of entries){
   if(key==="plantName"){
    const titleInput=root.querySelector(".site-details-page-title-input");
    const titleError=root.querySelector(".site-details-page-title-error");
    titleInput?.classList.add("has-error");
    titleInput?.setAttribute("aria-invalid","true");
    if(titleError){
     titleError.hidden=false;
     titleError.textContent=message;
    }
    continue;
   }
   const row=root.querySelector(`.site-details-row[data-field="${key}"]`);
   if(!row)continue;
   row.classList.add("has-error");
   row.querySelector(".site-details-input")?.setAttribute("aria-invalid","true");
   const error=row.querySelector(".site-details-field-error");
   if(error){
    error.hidden=false;
    error.textContent=message;
   }
  }
  if(errorSummary){
   errorSummary.hidden=false;
   errorSummary.textContent="Check the highlighted fields before saving.";
  }
  const first=root.querySelector("[aria-invalid='true']");
  first?.focus({preventScroll:true});
  return true;
 }

 function createPageIntro(){
  const intro=text("div","site-details-page-intro");
  const copy=text("div","site-details-page-copy");
  if(editing){
   const titleInput=document.createElement("textarea");
   titleInput.className="site-details-page-title-input";
   titleInput.id="site-details-plantName";
   titleInput.name="plantName";
   titleInput.rows=1;
   titleInput.wrap="soft";
   titleInput.value=draft.plantName;
   titleInput.placeholder="Plant name";
   titleInput.setAttribute("aria-label","Plant name");
   applyTypeStyle(titleInput,"Title3/Emphasized");
   const resizeTitle=(animate=false)=>{
    const previous=titleInput.getBoundingClientRect().height;
    titleInput.style.height="auto";
    animateContentHeight(titleInput,Math.max(44,titleInput.scrollHeight),{from:previous,animate});
   };
   titleInput.addEventListener("keydown",event=>{
    if(event.key==="Enter")event.preventDefault();
   });
   titleInput.addEventListener("input",()=>{
    const normalized=titleInput.value.replace(/\s*\r?\n\s*/g," ");
    if(normalized!==titleInput.value){
     titleInput.value=normalized;
     titleInput.setSelectionRange(normalized.length,normalized.length);
    }
    draft.plantName=titleInput.value;
    markDirty();
    resizeTitle(true);
   });
   const titleError=text("span","site-details-page-title-error");
   titleError.hidden=true;
   copy.append(titleInput,titleError);
   requestAnimationFrame(()=>resizeTitle(false));
  }else{
   copy.append(text("h2","site-details-page-title",draft.plantName||"Plant name","Title3/Emphasized"));
  }
  const actions=text("div","site-details-page-actions");
  if(editing){
   const cancel=createStandardButton({
    label:"Cancel",
    className:"site-details-cancel",
    icon:createMaskedIcon(assetURL("tab-close.svg"),"site-details-close-icon")
   });
   const save=document.createElement("button");
   save.type="button";
   save.className="wd-button wd-button--pill wd-button--primary site-details-save";
   save.textContent="Save changes";
   cancel.addEventListener("click",()=>cancelEditing());
   save.addEventListener("click",()=>saveEdits());
   mountButton(cancel);
   mountButton(save);
   actions.append(cancel,save);
  }else{
   const edit=createStandardButton({
    label:"Edit",
    className:"site-details-edit"
   });
   edit.addEventListener("click",()=>startEditing());
   mountButton(edit);
   actions.append(edit);
  }
  intro.append(copy,actions);
  return intro;
 }

 function startEditing(){
  editing=true;
  dirty=false;
  draft=cloneDetails(savedDetails);
  render();
 }

 function cancelEditing(){
  if(dirty&&!confirm("Discard the unsaved site details changes?"))return;
  editing=false;
  dirty=false;
  draft=cloneDetails(savedDetails);
  render();
 }

 function saveEdits(){
  if(!dirty){
   editing=false;
   render();
   return;
  }
  const errors=validate(draft);
  if(showErrors(errors))return;
  savedDetails=cloneDetails(draft);
  onSave?.(cloneDetails(savedDetails));
  editing=false;
  dirty=false;
  toast?.("Site details saved in this local preview");
  render();
 }

 function openOwnerMenu(anchor,owner){
  if(!registerPanel){
   toast?.("Owner actions are not connected in this preview");
   return;
  }
  const panel=document.createElement("div");
  panel.className="popover popover--menu site-details-owner-menu";
  const list=menuList();
  const editOwner=menuRow("Edit owner");
  editOwner.addEventListener("click",()=>{
   close?.(true);
   toast?.("Owner editing is not connected in this preview");
  });
  const manageAccess=menuRow("Manage access");
  manageAccess.addEventListener("click",()=>{
   close?.(true);
   toast?.("Owner access is not connected in this preview");
  });
  list.append(editOwner,manageAccess);
  mountMenu(panel,{label:"Owner actions",children:[list]});
  registerPanel(panel,anchor,{label:"Owner actions",radius:24,width:200,align:"end"});
 }

 function render(){
  releaseButtonSurfaces();
  releaseToggleControls();
  root.replaceChildren();
  const columns=text("div","site-details-grid");
  const primary=text("div","site-details-column site-details-column--primary");
  const secondary=text("div","site-details-column site-details-column--secondary");
  const selectOptions={registerPanel,close};
  primary.append(
   createBasicSection(draft,editing,markDirty,selectOptions),
   createPriceSection(draft,editing,markDirty,selectOptions),
   createOwnerSection({
    draft,
    onOwnerMenu:openOwnerMenu,
    onNewOwner:()=>toast?.("New owner is not connected in this preview"),
    mountButton
   })
  );
  secondary.append(
   createInstallerSection({draft,editing,dirty:markDirty,glass,mountToggle}),
   createPictureSection({
    draft,
    mountButton,
    onAddPicture:()=>toast?.("Plant picture upload is not connected in this preview")
   }),
   createVisitorSection(draft)
  );

  if(editing){
   const danger=text("section","site-details-danger");
   const dangerCopy=text("div","site-details-danger-copy");
   dangerCopy.append(
    text("h2","site-details-danger-title","Danger zone","Footnote/Emphasized"),
    text("p","site-details-danger-note","Deleting a plant requires a connected account and cannot be undone.","Footnote/Regular")
   );
   danger.append(dangerCopy);
   const deleteButton=document.createElement("button");
   deleteButton.type="button";
   deleteButton.className="wd-button wd-button--pill wd-button--primary site-details-delete";
   deleteButton.textContent="Delete plant";
   deleteButton.addEventListener("click",()=>{
    if(!confirm("Delete this plant from the local preview? This action is not connected to a backend."))return;
    toast?.("Plant deletion is not connected in this preview");
   });
   mountButton(deleteButton);
   danger.append(deleteButton);
   primary.append(danger);
  }

  columns.append(primary,secondary);
  errorSummary=text("p","site-details-error-summary");
  errorSummary.setAttribute("role","alert");
  errorSummary.hidden=true;
  root.append(createPageIntro(),columns,errorSummary);
 }

 render();
 return {
  element:root,
  setEditing:value=>{
   if(value)startEditing();
   else cancelEditing();
  },
  hasUnsavedChanges:()=>editing&&dirty,
  destroy(){
   releaseToggleControls();
   releaseButtonSurfaces();
  }
 };
}
