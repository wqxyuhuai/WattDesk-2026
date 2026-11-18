import {createTextElement as text} from "../../foundations/dom.js";
import {applyTypeStyle} from "../../foundations/typography.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createStandardButton} from "../../components/controls.js";
import {createAvatar} from "../../components/avatar.js";
import {menuList,mountMenu,menuRow} from "../../components/menu-popover.js";
import {createToggleSwitch} from "../../components/toggle-switch.js";
import {createMapboxStaticMap} from "../../components/mapbox-static-map.js";
import {motionDuration} from "../../foundations/motion.js";
import {PLANTS} from "./data.js";
import {siteContextFor} from "./detail.js";
import {AREA_OPTIONS,COUNTRY_OPTIONS,CURRENCY_OPTIONS,TIMEZONE_OPTIONS} from "./site-details.js";
const DEMO_ADDRESS_BY_LOCATION=Object.freeze({
 "Kassel, Germany":"Untere Königsstraße 52, 34117 Kassel, Gebäude Nord, Eingang B, 2. Obergeschoss, Raum 2.14",
 "Berlin, Germany":"Friedrichstraße 120, 10117 Berlin",
 "Hamburg, Germany":"Mönckebergstraße 11, 20095 Hamburg",
 "Ulm, Germany":"Münsterplatz 5, 89073 Ulm",
 "Åmål, Sweden":"Kungsgatan 8, 662 30 Åmål"
});

function cloneDetails(value){
 return {
  ...value,
  owners:Array.isArray(value.owners)?value.owners.map(owner=>({...owner})):[],
  visitors:Array.isArray(value.visitors)?value.visitors.map(visitor=>({...visitor})):[]
 };
}

function unique(values){
 return [...new Set(values.filter(Boolean))];
}

async function copyText(value){
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(value);
   return true;
  }
 }catch{
  // Fall through to the selection-based fallback for restricted contexts.
 }
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

function createMetric(label,value,detail="",iconFile=""){
 const metric=createInfoGroup(iconFile,"site-v2-metric");
 metric.content.append(
  text("span","site-v2-metric-label",label,"Caption1/Regular"),
  text("strong","site-v2-metric-value",value,"Subheadline/Emphasized")
 );
 if(detail)metric.content.append(text("span","site-v2-metric-detail",detail,"Caption1/Regular"));
 return metric.group;
}

function createInfoRow(label,value,{mono=false,href="",strong=false,readOnly=false}={}){
 const row=text("div","site-v2-info-row");
 row.append(text("span","site-v2-info-label",label,"14/14 medium"));
 const content=href&&value
  ?Object.assign(document.createElement("a"),{className:"site-v2-info-value site-v2-info-link",href,textContent:value})
  :text("span","site-v2-info-value",value||"Not set","Footnote/Regular");
 content.classList.toggle("is-mono",mono);
 content.classList.toggle("is-strong",strong);
 content.classList.toggle("is-readonly",readOnly);
 if(!href)content.classList.toggle("is-empty",!value);
 row.append(content);
 return row;
}

function createControlRow(label,control){
 const row=text("div","site-v2-info-row site-v2-info-row--control");
 row.append(text("span","site-v2-info-label",label,"14/14 medium"),control);
 return row;
}

function createInstallerLabel(label){
 return text("span","site-v2-installer-label",label,"Caption1/Regular");
}

function createInfoGroup(iconFile,className=""){
 const group=text("div",`site-v2-info-group ${className}`.trim());
 const content=text("div","site-v2-info-group-content");
 if(iconFile){
  const icon=createMaskedIcon(opaqueMaskURL(iconFile),"site-v2-info-group-icon");
  icon.dataset.iconSource=iconFile.replace(/\.svg$/,"");
  group.append(icon);
 }
 group.append(content);
 return {group,content};
}

function createSelectControl({label,value,options,onChange,className="",registerPanel,close,toggle}){
 const field=text("button",`site-details-input site-details-select-trigger wd-control-state wd-edit-field site-v2-select ${className}`.trim());
 field.type="button";
 field.setAttribute("aria-label",label);
 field.setAttribute("aria-haspopup","listbox");
 const valueNode=text("span","site-details-select-value",value);
 valueNode.setAttribute("aria-hidden","true");
 const chevron=createMaskedIcon(opaqueMaskURL("asset-14.svg"),"site-details-select-chevron");
 field.append(valueNode,chevron);

 function update(next){
  value=next;
  valueNode.textContent=next;
  field.dataset.value=next;
  onChange(next);
 }
 field.dataset.value=value;
 field.addEventListener("click",()=>{
  if(!registerPanel)return;
  toggle?.(field,()=>{
   const panel=document.createElement("div");
   panel.className="popover popover--menu site-details-select-popover";
   const list=menuList();
   list.setAttribute("role","listbox");
   for(const option of unique([value,...options])){
    const row=menuRow(option,{checked:option===value});
    row.setAttribute("role","option");
    row.setAttribute("aria-selected",String(option===value));
    row.dataset.value=option;
    row.addEventListener("click",()=>{
     update(option);
     close?.(true);
     requestAnimationFrame(()=>field.focus({preventScroll:true}));
    });
    list.append(row);
   }
   mountMenu(panel,{label:`Choose ${label}`,children:[list]});
   return registerPanel(panel,field,{
    label:`Choose ${label}`,
    radius:24,
    width:Math.max(200,Math.min(320,field.offsetWidth||220)),
    align:"end"
   });
  });
 });
 return field;
}

function createPanel(title,body,{className="",iconFile="",iconNode=null,action=null}={}){
 const panel=text("section","site-v2-panel");
 if(className)panel.classList.add(...className.split(/\s+/).filter(Boolean));
 const head=text("header","site-v2-panel-head");
 if(iconNode)head.append(iconNode);
 else if(iconFile)head.append(createMaskedIcon(opaqueMaskURL(iconFile),"site-v2-panel-icon"));
 head.append(text("h2","site-v2-panel-title",title,"Subheadline/Emphasized"));
 if(action){
  action.classList.add("site-v2-panel-action");
  head.append(action);
 }
 panel.append(head,body);
 return panel;
}

function pictureGlyph(){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 18 18");
 svg.setAttribute("aria-hidden","true");
 svg.classList.add("site-v2-picture-glyph");
 svg.dataset.iconStyle="solid";
 const frame=document.createElementNS("http://www.w3.org/2000/svg","path");
 frame.setAttribute("d","M4 1.5h10A2.5 2.5 0 0 1 16.5 4v10a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 14V4A2.5 2.5 0 0 1 4 1.5ZM11.8 4.9a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7ZM3.6 13.5 7.2 9.9l2.2 2.2 1.6-1.6 3.4 3H3.6Z");
 frame.setAttribute("fill","currentColor");
 frame.setAttribute("fill-rule","evenodd");
 frame.setAttribute("clip-rule","evenodd");
 svg.append(frame);
 return svg;
}

function menuActionGlyph(kind){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 16 16");
 svg.setAttribute("aria-hidden","true");
 svg.classList.add("site-v2-account-menu-glyph");
 svg.dataset.iconStyle="solid";
 const paths=kind==="access"
  ?[
   {d:"M8 1.75A3.75 3.75 0 0 0 4.25 5.5V7.25h1.65V5.5a2.1 2.1 0 1 1 4.2 0V7.25h1.65V5.5A3.75 3.75 0 0 0 8 1.75Z"},
   {d:"M3.25 7h9.5v6.75h-9.5V7Zm4.75 1.55a1.2 1.2 0 0 0-.6 2.24v1.21h1.2v-1.21A1.2 1.2 0 0 0 8 8.55Z",fillRule:"evenodd"}
  ]
  :[
   {d:"M10.75 2.15 13.85 5.25 6.55 12.55l-3.65.55.55-3.65 7.3-7.3Z"},
   {d:"M2.5 13.45h11v1.2h-11z"}
  ];
 for(const item of paths){
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("d",item.d);
  path.setAttribute("fill","currentColor");
  if(item.fillRule){
   path.setAttribute("fill-rule",item.fillRule);
   path.setAttribute("clip-rule",item.fillRule);
  }
  svg.append(path);
 }
 return svg;
}

function initialsFor(name){
 return String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"?";
}

function contactRecords(draft){
 const owner=draft.owners[0];
 const records=[
  {
   name:draft.contactPerson||"Installer contact",
   email:draft.contactEmail||"",
   phone:draft.contactPhone||""
  }
 ];
 if(owner?.name&&owner.name!==records[0].name){
  records.push({name:owner.name,email:owner.email||"",phone:owner.phone||""});
 }
 return records.filter((record,index)=>records.findIndex(candidate=>candidate.name===record.name)===index);
}

function createMapLocation(context,locationControl){
 return createMapboxStaticMap({
  location:context.location,
  latitude:context.latitude,
  longitude:context.longitude,
  zoom:13,
  showLocation:false,
  locationControl
 });
}

function createMapLocationButton(onActivate){
 const button=createStandardButton({
  label:"Plant location",
  iconOnly:true,
  className:"site-v2-map-pin"
 });
 const visual=text("span","site-v2-map-location-visual");
 visual.append(
  text("span","site-v2-map-ripple site-v2-map-ripple--one"),
  text("span","site-v2-map-ripple site-v2-map-ripple--two"),
  text("span","site-v2-map-pin-core")
 );
 button.append(visual);
 button.addEventListener("click",onActivate);
 return button;
}

export function createPlantSiteDetailsV2({
 plant,
 details,
 glass,
 registerPanel,
 close,
 toggle,
 toast,
 onSave
}={}){
 const context=siteContextFor(plant);
 const root=text("div","plant-site-details-v2 wd-page-content");
 const buttonSurfaces=[];
 const toggleControls=[];
 let savedDetails=cloneDetails(details);
 let draft=cloneDetails(savedDetails);
 let editing=false;
 let dirty=false;

 function releaseButtonSurfaces(){
  while(buttonSurfaces.length)glass?.removeSurface(buttonSurfaces.pop());
 }

 function releaseToggleControls(){
  while(toggleControls.length)toggleControls.pop().destroy();
 }

 function mountButton(button){
  glass?.addSurface({host:button,radius:18});
  buttonSurfaces.push(button);
 }

 function selectControl(options){
  return createSelectControl(options);
 }

 const mapLocationButton=createMapLocationButton(()=>toast?.("Location actions are not connected in this preview."));
 const map=createMapLocation(context,mapLocationButton);

 function markDirty(){
  dirty=true;
 }

 function startEditing(){
  editing=true;
  dirty=false;
  draft=cloneDetails(savedDetails);
  render();
 }

 function cancelEditing(){
  editing=false;
  dirty=false;
  draft=cloneDetails(savedDetails);
  render();
 }

 function saveEditing(){
  if(dirty){
   savedDetails=cloneDetails(draft);
   onSave?.(cloneDetails(savedDetails));
   toast?.("Site details saved in this local preview.");
  }
  editing=false;
  dirty=false;
  render();
 }

 function openAccountOptions(anchor,owner){
  if(!registerPanel){
   toast?.("Account actions are not connected in this preview.");
   return;
  }
  toggle?.(anchor,()=>{
   const panel=document.createElement("div");
   panel.className="popover popover--menu site-v2-account-menu";
   const list=menuList();
   const edit=menuRow("Edit account",{iconNode:menuActionGlyph("edit"),showCheck:false});
   edit.addEventListener("click",()=>{
    close?.(true);
    toast?.("Account editing is not connected in this preview.");
   });
   const access=menuRow("Manage access",{iconNode:menuActionGlyph("access"),showCheck:false});
   access.addEventListener("click",()=>{
    close?.(true);
    toast?.("Account access is not connected in this preview.");
   });
   list.append(edit,access);
   mountMenu(panel,{label:`Actions for ${owner?.name||"account"}`,children:[list]});
   return registerPanel(panel,anchor,{
    label:`Actions for ${owner?.name||"account"}`,
    radius:24,
    width:200,
    align:"end"
   });
  });
 }

 function createMapInfo(){
  const copy=text("div","site-v2-map-copy");
  const countryValue=draft.country||"Germany";
  let addressValue=draft.address||context.location||"Location not set";
  if(addressValue===context.location){
   addressValue=DEMO_ADDRESS_BY_LOCATION[context.location]||addressValue;
  }else if(countryValue&&addressValue.endsWith(countryValue)){
   addressValue=addressValue.slice(0,-countryValue.length).replace(/[,，\s]+$/,"");
  }
  if(editing){
   copy.classList.add("is-editing");
   const countryField=text("label","site-v2-map-field");
   countryField.append(text("span","site-v2-map-field-label","Country","Footnote/Regular"));
   const country=selectControl({
    label:"Country",
    value:countryValue,
    options:COUNTRY_OPTIONS,
    registerPanel,
    close,
    toggle,
    className:"site-v2-map-select",
    onChange:value=>{
     draft.country=value;
     markDirty();
    }
   });
   const addressField=text("label","site-v2-map-field");
   addressField.append(text("span","site-v2-map-field-label","Address","Footnote/Regular"));
   const address=document.createElement("input");
   address.className="site-v2-map-input wd-edit-field";
   address.type="text";
   address.value=addressValue;
   address.setAttribute("aria-label","Address");
   address.addEventListener("input",()=>{
    draft.address=address.value;
    markDirty();
   });
   countryField.append(country);
   addressField.append(address);
   copy.append(countryField,addressField);
  }else{
   const addressRow=text("div","site-v2-map-address-row");
   const addressCopy=text("div","site-v2-map-address-copy");
   const addressButton=text("button","site-v2-map-address wd-control-state",addressValue,"Footnote/Emphasized");
   addressButton.type="button";
   addressButton.setAttribute("aria-label",`Full address: ${addressValue}`);
   addressButton.setAttribute("aria-haspopup","dialog");
   let panel=null;
   let closeTimer=0;
   const cancelClose=()=>{
    clearTimeout(closeTimer);
    closeTimer=0;
   };
   const closeTip=()=>{
    cancelClose();
    if(panel?.isConnected)close?.();
    panel=null;
    addressButton.removeAttribute("aria-describedby");
   };
   const scheduleClose=()=>{
    cancelClose();
    closeTimer=setTimeout(closeTip,motionDuration("--wd-motion-panel-exit"));
   };
   const openTip=()=>{
    cancelClose();
    if(panel?.isConnected||!registerPanel)return;
    const tip=text("div","popover site-v2-address-popover");
    const panelAddress=text("button","site-v2-address-popover-address",addressValue,"Footnote/Emphasized");
    panelAddress.type="button";
    panelAddress.setAttribute("aria-label",`Copy address: ${addressValue}`);
    panelAddress.dataset.copyValue=addressValue;
    panelAddress.addEventListener("click",async()=>{
     const copied=await copyText(addressValue);
     closeTip();
     toast?.(copied?"Address copied":"Could not copy address");
    });
    tip.append(
     panelAddress
    );
    tip.addEventListener("pointerenter",cancelClose);
    tip.addEventListener("pointerleave",scheduleClose);
    tip.addEventListener("focusin",cancelClose);
    tip.addEventListener("focusout",event=>{
     if(!tip.contains(event.relatedTarget))scheduleClose();
    });
    panel=registerPanel(tip,addressButton,{
     label:"Full address",
     radius:18,
     width:340,
     align:"start"
    });
    const previousClose=panel._onClose;
    panel._onClose=()=>{
     try{previousClose?.();}
     finally{
      addressButton.removeAttribute("aria-describedby");
      if(panel===tip)panel=null;
     }
    };
    addressButton.setAttribute("aria-describedby",panel.id);
   };
   addressButton.addEventListener("pointerenter",openTip);
   addressButton.addEventListener("pointerleave",scheduleClose);
   addressButton.addEventListener("focus",openTip);
   addressButton.addEventListener("blur",event=>{
    if(panel?.contains(event.relatedTarget))cancelClose();
    else scheduleClose();
   });
   addressRow.append(
    createMaskedIcon(assetURL("plants/detail/location-solid.svg"),"site-v2-map-address-icon"),
    addressCopy
   );
   addressCopy.append(
    text("span","site-v2-map-country",countryValue,"Footnote/Regular"),
    addressButton
   );
   copy.append(addressRow);
  }
  return copy;
 }

 function createContactMethod(value,label){
  const button=text("button","site-v2-installer-method-copy",value||"Not set","Footnote/Regular");
  button.type="button";
  button.dataset.copyValue=value||"";
  button.setAttribute("aria-label",`Copy ${label}: ${value||"Not set"}`);
  button.addEventListener("click",async()=>{
   const copied=await copyText(value||"");
   toast?.(copied?`${label} copied`:`Could not copy ${label.toLowerCase()}`);
  });
  return button;
 }

 function createContactSeparator(){
  return text("span","site-v2-installer-method-separator");
 }

 function ownerRow(owner,{onOptions,mountControl=newButton=>mountButton(newButton)}={}){
  const row=text("div","site-v2-owner");
  row.append(createAvatar(owner.initials||initialsFor(owner.name),{size:40,className:"site-v2-owner-avatar"}));
  const copy=text("div","site-v2-owner-copy");
  copy.append(text("strong","site-v2-owner-name",owner.name,"Subheadline/Emphasized"));
  const meta=text("div","site-v2-owner-meta");
  meta.append(
   createContactMethod(owner.email,"Email"),
   createContactSeparator(),
   createContactMethod(owner.phone,"Phone number")
  );
  copy.append(meta);
  row.append(copy);
  const options=createStandardButton({
   label:`Actions for ${owner.name}`,
   iconOnly:true,
   className:"site-v2-owner-options",
   icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"site-v2-owner-options-icon")
  });
  options.addEventListener("click",()=>onOptions?.(options,owner));
  mountControl(options);
  row.append(options);
  return row;
 }

 function createHero(){
  const hero=text("section","site-v2-hero");
  const intro=text("div","site-v2-hero-copy");
  const actions=text("div","site-v2-hero-actions");
  if(editing){
   const cancel=createStandardButton({label:"Cancel",className:"site-v2-cancel"});
   const save=createStandardButton({label:"Save changes",variant:"primary",className:"site-v2-save"});
   cancel.addEventListener("click",cancelEditing);
   save.addEventListener("click",saveEditing);
   mountButton(cancel);
   mountButton(save);
   actions.append(cancel,save);
  }else{
   const edit=createStandardButton({label:"Edit",className:"site-v2-edit"});
   edit.addEventListener("click",startEditing);
   mountButton(edit);
   actions.append(edit);
  }
  const metrics=text("div","site-v2-metrics");
  const [commissionDate="Not set",commissionTime=""]=String(draft.createdAt||"").split(/\s+/,2);
  const commissioned=[commissionDate,commissionTime].filter(Boolean).join(" ");
  metrics.append(
   createMetric("Plant type",draft.plantType,"","organisation.svg"),
   createMetric("PV capacity",draft.pvCapacity?`${draft.pvCapacity} kWp`:"Not set","","solar-panel.svg"),
   createMetric("Commissioned",commissioned,"","imgBoldTimeCalendar.svg"),
   createMetric("Battery storage",draft.batteryCapacity?`${draft.batteryCapacity} kWh`:"Not installed","","battery-storage.svg")
  );
  const titleRegion=text("div","site-v2-title-region");
  if(editing){
   const titleEditor=text("div","site-v2-title-editor wd-edit-field");
   const titleInput=document.createElement("textarea");
   titleInput.className="site-details-page-title-input site-v2-hero-title-input";
   titleInput.rows=1;
   titleInput.wrap="soft";
   titleInput.value=draft.plantName||plant.name||"?";
   titleInput.placeholder="Plant name";
   titleInput.setAttribute("aria-label","Plant name");
   applyTypeStyle(titleInput,"Title2/Emphasized");
   const resizeTitle=()=>{
    titleInput.style.height="auto";
    titleInput.style.height=`${Math.max(44,titleInput.scrollHeight)}px`;
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
    resizeTitle();
   });
   titleEditor.append(titleInput);
   titleRegion.append(titleEditor);
   requestAnimationFrame(resizeTitle);
  }else{
   titleRegion.append(text("h2","site-v2-title",draft.plantName||plant.name||"?","Title2/Emphasized"));
  }
  intro.append(titleRegion,metrics);
  hero.append(map.element,actions,intro);
  return hero;
 }

 function createEnergyPanel(){
  const body=text("div","site-v2-panel-body");
  if(editing){
   const priceField=text("span","site-v2-energy-field");
   const price=document.createElement("input");
   price.className="site-v2-energy-input wd-edit-field";
   price.type="number";
   price.inputMode="decimal";
   price.min="0";
   price.step="0.01";
   price.value=draft.gridPrice;
   price.setAttribute("aria-label","Grid price");
   const priceUnit=text("span","site-v2-energy-unit",draft.currency);
   price.addEventListener("input",()=>{
    draft.gridPrice=price.value;
    markDirty();
   });
   priceField.append(price,priceUnit);
   const currency=selectControl({
    label:"Currency",
    value:draft.currency,
    options:CURRENCY_OPTIONS,
    registerPanel,
    close,
    toggle,
    className:"site-v2-energy-select",
    onChange:value=>{
     draft.currency=value;
     priceUnit.textContent=value;
     markDirty();
    }
   });
   const area=selectControl({
    label:"Price area",
    value:draft.area,
    options:AREA_OPTIONS,
    registerPanel,
    close,
    toggle,
    className:"site-v2-energy-select",
    onChange:value=>{
     draft.area=value;
     markDirty();
    }
   });
   const timezone=selectControl({
    label:"Timezone",
    value:draft.timezone,
    options:TIMEZONE_OPTIONS,
    registerPanel,
    close,
    toggle,
    className:"site-v2-energy-select",
    onChange:value=>{
     draft.timezone=value;
     markDirty();
    }
   });
   body.append(
    createControlRow("Timezone",timezone),
    createControlRow("Price area",area),
    createControlRow("Currency",currency),
    createControlRow("Grid price",priceField)
   );
  }else{
   body.append(
    createInfoRow("Timezone",draft.timezone),
    createInfoRow("Price area",draft.area),
    createInfoRow("Currency",draft.currency),
    createInfoRow("Grid price",`${draft.gridPrice} ${draft.currency}`)
   );
  }
  return createPanel("Energy & tariff",body,{
   className:"site-v2-panel--energy",
   iconFile:"imgBoldTimeCalendar.svg"
  });
 }

 function createInstallerPanel(){
  const body=text("div","site-v2-panel-body site-v2-installer-body");
  const contacts=contactRecords(draft);
  const contactNames=contacts.map(contact=>contact.name);
  const companyOptions=unique(PLANTS.map(item=>item.installer));
  const company=createInfoGroup("organisation.svg","site-v2-installer-company-row");
  company.content.append(createInstallerLabel("Installer company"));
  company.content.append(
   editing
    ?selectControl({
     label:"Installer company",
     value:draft.installerCompany,
     options:companyOptions,
     registerPanel,
     close,
     toggle,
     className:"site-v2-installer-select",
     onChange:value=>{
      draft.installerCompany=value;
      markDirty();
     }
    })
    :text("strong","site-v2-installer-company",draft.installerCompany,"Footnote/Emphasized")
  );

  const contact=createInfoGroup("user.svg","site-v2-installer-contact-row");
  contact.content.classList.add("site-v2-installer-contact-copy");
  contact.content.append(createInstallerLabel("Contact"));
  if(editing){
   contact.content.append(
    selectControl({
     label:"Contact",
     value:draft.contactPerson,
     options:contactNames,
     registerPanel,
     close,
     toggle,
     className:"site-v2-installer-select",
     onChange:value=>{
      const contact=contacts.find(item=>item.name===value);
      draft.contactPerson=value;
      draft.contactEmail=contact?.email||"";
      draft.contactPhone=contact?.phone||"";
      markDirty();
      render();
     }
    })
   );
  }else{
   contact.content.append(text("strong","site-v2-installer-contact-name",draft.contactPerson,"Footnote/Emphasized"));
  }

  const methods=text("div","site-v2-installer-methods");
  methods.append(
   createContactMethod(draft.contactEmail,"Email"),
   createContactSeparator(),
   createContactMethod(draft.contactPhone,"Phone number")
  );
  contact.content.append(methods);
  body.append(company.group,contact.group);

  const alarmRow=text("div","site-v2-installer-alarm");
  const alarmLabel=text("span","site-v2-installer-alarm-label");
  alarmLabel.append(text("span","site-v2-installer-label","Alarm email","Footnote/Regular"));
  const info=text("button","site-v2-alarm-info wd-control-state");
  info.type="button";
  info.setAttribute("aria-label","About alarm emails");
  info.setAttribute("aria-haspopup","dialog");
  const infoGlyph=createMaskedIcon(assetURL("plants/detail/info2.svg"),"site-v2-alarm-info-glyph");
  infoGlyph.dataset.iconSource="info2";
  info.append(infoGlyph);
  let infoPanel=null;
  let infoCloseTimer=0;
  const cancelInfoClose=()=>{
   clearTimeout(infoCloseTimer);
   infoCloseTimer=0;
  };
  const closeInfo=()=>{
   cancelInfoClose();
   if(infoPanel?.isConnected)close?.();
   infoPanel=null;
   info.removeAttribute("aria-describedby");
  };
  const scheduleInfoClose=()=>{
   cancelInfoClose();
   infoCloseTimer=setTimeout(closeInfo,motionDuration("--wd-motion-panel-exit"));
  };
  const openInfo=()=>{
   cancelInfoClose();
   if(infoPanel?.isConnected||!registerPanel)return;
   const panel=text("div","popover site-v2-alarm-info-popover");
   const copy=text(
    "p",
    "site-v2-alarm-info-copy",
    "Alarm emails will be sent to the installer contact email when selected critical device alarms occur.",
    "Footnote/Regular"
   );
   panel.append(copy);
   panel.addEventListener("pointerenter",cancelInfoClose);
   panel.addEventListener("pointerleave",scheduleInfoClose);
   panel.addEventListener("focusin",cancelInfoClose);
   panel.addEventListener("focusout",event=>{
    if(!panel.contains(event.relatedTarget))scheduleInfoClose();
   });
   infoPanel=registerPanel(panel,info,{
    label:"Alarm email information",
    radius:14,
    width:360,
    align:"start"
   });
   const previousClose=infoPanel._onClose;
   infoPanel._onClose=()=>{
    try{previousClose?.();}
    finally{
     info.removeAttribute("aria-describedby");
     if(infoPanel===panel)infoPanel=null;
    }
   };
   info.setAttribute("aria-describedby",infoPanel.id);
  };
  info.addEventListener("pointerenter",openInfo);
  info.addEventListener("pointerleave",scheduleInfoClose);
  info.addEventListener("focus",openInfo);
  info.addEventListener("blur",event=>{
   if(infoPanel?.contains(event.relatedTarget))cancelInfoClose();
   else scheduleInfoClose();
  });
  alarmLabel.append(info);
  alarmRow.append(alarmLabel);
  const alarmSwitch=createToggleSwitch({
   label:"Alarm email",
   checked:Boolean(draft.alarmEmailNotification),
   disabled:!editing,
   className:"site-v2-alarm-switch",
   glass,
   onChange:value=>{
    draft.alarmEmailNotification=value;
    markDirty();
   }
  });
  toggleControls.push(alarmSwitch);
  alarmRow.append(alarmSwitch.element);
  body.append(alarmRow);
  return createPanel("Installer & support",body,{
   className:"site-v2-panel--installer",
   iconFile:"organisation.svg"
  });
 }

 function createPeoplePanel(){
  const body=text("div","site-v2-panel-body site-v2-account-list");
  const owner=draft.owners[0];
  const accounts=[
   owner,
   {
    id:"demo-installer-contact",
    name:draft.contactPerson||"Maria Hoffmann",
    initials:initialsFor(draft.contactPerson||"Maria Hoffmann"),
    email:draft.contactEmail||"service@installer.example",
    phone:draft.contactPhone||"+49 561 555 0125"
   },
   {
    id:"demo-site-manager",
    name:"Jonas Weber",
    initials:"JW",
    email:"jonas.weber@example.com",
    phone:"+49 561 555 0188"
   }
  ].filter(Boolean).filter((account,index,list)=>list.findIndex(item=>item.name===account.name)===index);
  body.append(
   ...accounts.slice(0,3).map(account=>ownerRow(account,{onOptions:openAccountOptions}))
  );
  const addAccount=createStandardButton({
   label:"Add account",
   iconOnly:true,
   className:"site-v2-add-account",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"site-v2-picture-icon")
  });
  addAccount.addEventListener("click",()=>toast?.("Adding an account is not connected in this preview."));
  mountButton(addAccount);
  return createPanel("Owner information",body,{
   className:"site-v2-panel--people",
   iconFile:"user.svg",
   action:addAccount
  });
 }

 function createPicturePanel(){
  const mediaBody=text("div","site-v2-media");
  const pictureRow=text("div","site-v2-picture-row");
  if(draft.picture){
   const image=document.createElement("img");
   image.src=draft.picture;
   image.alt="Plant";
   image.className="site-v2-picture-image";
   pictureRow.append(image);
   pictureRow.classList.add("has-image");
  }else{
   pictureRow.append(text("span","site-v2-picture-empty","No plant picture"));
  }
  mediaBody.append(pictureRow);
  const pictureAction=createStandardButton({
   label:draft.picture?"Replace picture":"Add picture",
   iconOnly:true,
   className:"site-v2-add-picture",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"site-v2-picture-icon")
  });
  pictureAction.addEventListener("click",()=>toast?.("Plant picture upload is not connected in this preview."));
  mountButton(pictureAction);
  return createPanel("Plant picture",mediaBody,{
   className:`site-v2-panel--media ${draft.picture?"has-picture":"is-empty-picture"}`,
   iconNode:pictureGlyph(),
   action:pictureAction
  });
 }

 function createVisitorPanel(){
  const body=text("div","site-v2-panel-body site-v2-visitor-body");
  if(draft.visitors.length){
   const list=text("div","site-v2-visitor-list");
   for(const visitor of draft.visitors){
    list.append(text("span","site-v2-visitor-name",visitor.name||visitor.email||"Visitor","Footnote/Regular"));
   }
   body.append(list);
  }else{
   body.append(text("p","site-v2-visitor-empty","No visitors have access to this plant.","Footnote/Regular"));
  }
  const addVisitor=createStandardButton({
   label:"Add visitor",
   iconOnly:true,
   className:"site-v2-add-visitor",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"site-v2-picture-icon")
  });
  addVisitor.addEventListener("click",()=>toast?.("Adding a visitor is not connected in this preview."));
  mountButton(addVisitor);
  return createPanel("Visitor access",body,{
   className:"site-v2-panel--visitors",
   iconFile:"teams.svg",
   action:addVisitor
  });
 }

 function render(){
  close?.();
  releaseToggleControls();
  releaseButtonSurfaces();
  mountButton(mapLocationButton);
  root.classList.toggle("is-editing",editing);
  const lower=text("div","site-v2-grid");
  lower.append(
   createEnergyPanel(),
   createInstallerPanel(),
   createPeoplePanel(),
   createPicturePanel(),
   createVisitorPanel()
  );
  const hero=createHero();
  hero.append(createMapInfo());
  root.replaceChildren(hero,lower);
 }

 render();
 return {
  element:root,
  hasUnsavedChanges:()=>editing&&dirty,
  destroy(){
   releaseToggleControls();
   releaseButtonSurfaces();
   map.destroy();
  }
 };
}
