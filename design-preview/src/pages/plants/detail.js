import {createTextElement as text} from "../../foundations/dom.js";
import {motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";
import {applyTypeStyle} from "../../foundations/typography.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createStandardButton} from "../../components/controls.js";
import {createDatePicker,describeRange,presetRange} from "../../components/date-picker.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {createSegmentedControl} from "../../components/segmented-control.js";
import {createTimeLabel} from "../../components/time-label.js";
import {formatClockTime} from "../../foundations/time.js";
import {SERVICE_TICKETS} from "../service-ticket/data.js";
import {PLANT_SECTIONS} from "./sections.js";
import {
 createCurrentStateChart,
 createCombinedHistoryChart,
 createEnergyChart,
 createHistoryChart,
 createSavingsChart,
 createSelfPoweredChart
} from "./statistics-charts.js";
import {createStatisticsPeriodControl,statisticsPeriodLabel} from "./statistics-period.js";
import {plantDeviceIds} from "./devices.js";

const DEVICE_ORDER=Object.freeze(["inverter","bms","heater"]);
const DEVICE_META=Object.freeze({
 inverter:{name:"iHybrid",kind:"Inverter",model:"Hybrid inverter",icon:"asset-40.svg"},
 bms:{name:"iStorage-G3",kind:"Battery",model:"Storage system",icon:"asset-45.svg"},
 heater:{name:"iHeater",kind:"Heater",model:"Heating regulator",icon:"asset-49.svg"}
});

const STATUS_VIEW=Object.freeze({
 normal:{label:"Normal",tone:"green",connection:"Online"},
 attention:{label:"Attention",tone:"orange",connection:"Online"},
 offline:{label:"Offline",tone:"red",connection:"Offline"},
 partially_offline:{label:"Partially offline",tone:"orange",connection:"Partially online"},
 unbound:{label:"Unbound",tone:"neutral",connection:"Unbound"}
});

const SITE_PREVIEW=Object.freeze({
 p01:{
  communications:"Partially offline",
  weather:"2°C · Partly cloudy",
  location:"Åmål, Sweden",
  localTime:"08:15",
  faults:[
   {title:"Battery-1 connection fault",meta:"iHybrid · ended Oct 2",tone:"red",code:"4300"},
   {title:"BMS CAN communication",meta:"iHybrid · warning",tone:"orange",code:"8093"}
  ],
  logs:[
   {age:2,device:"iStorage",event:"battery online"},
   {age:15,device:"iHybrid",event:"inverter online"}
  ]
 }
});

const WEATHER_SAMPLES=Object.freeze([
 "2°C · Partly cloudy",
 "7°C · Light rain",
 "11°C · Overcast",
 "18°C · Clear"
]);

const LOCATION_SAMPLES=Object.freeze([
 "Kassel, Germany",
 "Berlin, Germany",
 "Hamburg, Germany",
 "Ulm, Germany"
]);

const DEVICE_CHART={
 inverter:[
  {id:"solar",label:"Solar",tone:"yellow"},
  {id:"home",label:"Home",tone:"blue"},
  {id:"grid",label:"Grid",tone:"green"}
 ],
 bms:[
  {id:"charge",label:"Charge",tone:"purple"},
  {id:"soc",label:"SOC",tone:"green"},
  {id:"temperature",label:"Temperature",tone:"orange"}
 ],
 heater:[
  {id:"heating",label:"Heating",tone:"orange"},
  {id:"target",label:"Target",tone:"red"},
  {id:"return",label:"Return",tone:"blue"}
 ]
};

function hash(value){
 return [...String(value)].reduce((total,char)=>((total*31)+char.charCodeAt(0))>>>0,7);
}

function round(value,digits=1){
 const factor=10**digits;
 return Math.round(value*factor)/factor;
}

function signedPower(value){
 if(Math.abs(value)<0.005)return "0.0";
 return `${value<0?"−":"+"}${Math.abs(value).toFixed(1)}`;
}

function statusFor(plant){
 return STATUS_VIEW[plant.status]||STATUS_VIEW.attention;
}

function communicationsFor(plant){
 const preview=SITE_PREVIEW[plant.id];
 const connection=statusFor(plant).connection;
 if(preview?.communications)return preview.communications;
 if(connection==="Online")return "Online";
 return connection;
}

export function siteContextFor(plant){
 const seed=hash(plant.id);
 const preview=SITE_PREVIEW[plant.id];
 return {
  communications:communicationsFor(plant),
  weather:preview?.weather??WEATHER_SAMPLES[seed%WEATHER_SAMPLES.length],
  location:preview?.location??LOCATION_SAMPLES[seed%LOCATION_SAMPLES.length],
  localTime:preview?.localTime??formatClockTime(new Date(),{seconds:false})
 };
}

export function devicesFor(plant){
 const resolved=plantDeviceIds(plant);
 const ids=DEVICE_ORDER.filter(id=>(resolved.length?resolved:plant.devices)?.includes(id));
 return ids.length?ids:DEVICE_ORDER.slice(0,1);
}

function overviewData(plant,deviceId){
 const seed=hash(`${plant.id}:${deviceId}`);
 const online=plant.status!=="offline"&&plant.status!=="unbound";
 const nominal=Math.abs(Number(plant.powerKw)||2.4);
 const solar=online?round(Math.max(0.2,nominal*(.48+(seed%17)/100)),1):0;
 const batteryRate=online?round(((seed%23)-8)/10,1):0;
 const home=online?round(Math.max(.3,nominal*(.62+(seed%13)/100)),1):0;
 const grid=online?round(home-solar-batteryRate,1):0;
 const soc=Math.max(8,Math.min(96,34+(seed%53)));
 const temperature=Math.max(18,Math.min(72,28+(seed%31)));
 const solarToday=online?round(1.2+((seed%82)/10),1):0;
 const homeToday=online?round(8.4+((seed%141)/10),1):0;
 const gridToday=online?round(3.1+((seed%93)/10),1):0;
 const importedToday=online?round(gridToday*.68,1):0;
 const exportedToday=online?round(gridToday*.16,1):0;
 const chargedToday=online?round(homeToday*.24,1):0;
 const dischargedToday=online?round(homeToday*.43,1):0;
 const savings=round(gridToday*1.2+2.4,2);
 const selfPowered=online?Math.max(28,Math.min(94,58+(seed%31))):0;
 const targetTemp=46+(seed%14);
 return {
  solar,
  batteryRate,
  home,
  grid,
  soc,
  temperature,
  solarToday,
  homeToday,
  gridToday,
  importedToday,
  exportedToday,
  chargedToday,
  dischargedToday,
  savings,
  selfPowered,
  targetTemp
 };
}

function addType(element,style){
 applyTypeStyle(element,style);
 return element;
}

function statusIcon(tone){
 const file=tone==="green"?"tickle.svg":"asset-64.svg";
 const icon=createMaskedIcon(opaqueMaskURL(file),`plants-icon plants-icon--16 plant-overview-status-icon is-${tone}`);
 return icon;
}

function contextIcon(file,tone){
 return createMaskedIcon(
  assetURL(`plants/detail/${file}`),
  `plant-overview-context-icon is-${tone}`
 );
}

function faultRowsFor(plant){
 const preview=SITE_PREVIEW[plant.id];
 if(preview?.faults)return preview.faults;
 if(plant.status==="normal")return [{title:"No active faults",meta:"All monitored systems are normal",tone:"green",code:""}];
 return [
  {title:plant.status==="offline"?"Inverter communication lost":"Battery connection fault",meta:`${DEVICE_META[devicesFor(plant)[0]].name} · current`,tone:"red",code:"4300"},
  {title:"Communication warning",meta:"Signal interrupted intermittently",tone:"orange",code:"1855"}
 ];
}

function logRowsFor(plant){
 const preview=SITE_PREVIEW[plant.id];
 if(preview?.logs)return preview.logs;
 return devicesFor(plant).slice(0,2).map((deviceId,index)=>({
  age:index?15:2,
  device:DEVICE_META[deviceId].name,
  event:index?"realtime stream restored":"status normal"
 }));
}

function createOpsCard(sectionId,className,onOpenSection){
 const label=PLANT_SECTIONS[sectionId].label;
 const card=text("section",`plant-overview-ops-section ${className} wd-discussion-card`);
 if(onOpenSection){
  card.classList.add("is-clickable","wd-press-scale");
  card.tabIndex=0;
  card.setAttribute("role","link");
  card.setAttribute("aria-label",`Open ${label}`);
  card.addEventListener("click",event=>{
   if(event.target.closest("button,a"))return;
   onOpenSection(sectionId);
  });
  card.addEventListener("keydown",event=>{
   if(event.target!==card||!["Enter"," "].includes(event.key))return;
   event.preventDefault();
   onOpenSection(sectionId);
  });
 }
 return card;
}

function createOpsRail(plant,onOpenTicket,onOpenNewTicket,onOpenSection){
 const state=statusFor(plant);
 const rail=text("aside","plant-overview-operations");
 rail.setAttribute("aria-label","System health and service");

 const faults=createOpsCard("faults","plant-overview-faults",onOpenSection);
 const faultsHead=text("div","plant-overview-ops-head");
 faultsHead.append(text("span","plant-overview-ops-label",PLANT_SECTIONS.faults.label,"Footnote/Medium"));
 const faultBody=text("div","plant-overview-ops-body plant-overview-fault-body");
 const faultRows=faultRowsFor(plant);
 const activeFaultCount=faultRows.filter(item=>item.code).length;
 faults.classList.toggle("is-empty",activeFaultCount===0);
 if(activeFaultCount)faultsHead.append(text("span","plant-overview-ops-count",`${activeFaultCount} alerts`,"Caption1/Regular"));

 for(const item of faultRows){
  const row=text("div","plant-overview-fault-row");
  row.style.setProperty("--plant-overview-tone",`var(--wd-figma-accents-${item.tone})`);
  row.append(statusIcon(item.tone));
  const copy=text("div","plant-overview-fault-copy");
  copy.append(text("div","plant-overview-row-title",item.title,"Footnote/Medium"));
  copy.append(text("div","plant-overview-row-meta",item.meta,"Caption1/Regular"));
  row.append(copy);
  if(item.code)row.append(text("span","plant-overview-code",item.code,"Caption1/Regular"));
  faultBody.append(row);
 }
 faults.append(faultsHead,faultBody);

 const log=createOpsCard("logs","plant-overview-log-section",onOpenSection);
 const logHead=text("div","plant-overview-ops-head");
 logHead.append(text("span","plant-overview-ops-label",PLANT_SECTIONS.logs.label,"Footnote/Medium"));
 const live=text("span","plant-overview-log-live","LIVE","Caption1/Emphasized");
 logHead.append(live);
 log.append(logHead);
 const logRows=logRowsFor(plant).slice();
 const placeholderLogs=[
  {age:18,device:"iHybrid",event:"telemetry packet received"},
  {age:24,device:"iStorage-G3",event:"heartbeat acknowledged"},
  {age:31,device:"iHeater",event:"clock synchronized"}
 ];
 let placeholderIndex=0;
 while(logRows.length<5)logRows.push(placeholderLogs[placeholderIndex++%placeholderLogs.length]);
 const logBody=text("div","plant-overview-ops-body plant-overview-log-body");
 const logViewport=text("div","plant-overview-log-viewport");
 const logContent=text("div","plant-overview-log-content");
 logRows.forEach((item,index)=>{
  const row=text("div","plant-overview-log-row");
  row.append(createTimeLabel(item.age,{ageMinutes:true,clock:true,className:"plant-overview-log-time",typeStyle:"Caption1/Regular"}));
  row.append(text("span","plant-overview-log-device",item.device,"Caption1/Regular"));
  row.append(text("span","plant-overview-log-message",item.event,"Caption1/Regular"));
  row.style.setProperty("--plant-overview-delay",`${index*20}ms`);
  logContent.append(row);
 });
 logViewport.append(logContent);
 logBody.append(logViewport);
 log.append(logHead,logBody);
 const logScroll=createScrollFeedback({
  host:logBody,
  viewport:logViewport,
  elastic:false,
  bottomInset:2
 });

 const tickets=createOpsCard("tickets","plant-overview-ticket-section",onOpenSection);
 const ticketHead=text("div","plant-overview-ops-head");
 ticketHead.append(text("span","plant-overview-ops-label",PLANT_SECTIONS.tickets.label,"Footnote/Medium"));
 const related=SERVICE_TICKETS.filter(ticket=>ticket.plantId===plant.id).slice(0,2);
 const ticketMeta=text("span","plant-overview-ops-actions");
 if(related.length)ticketMeta.append(text("span","plant-overview-ops-count",`${related.length} linked`,"Caption1/Regular"));
 let newTicket=null;
 if(onOpenNewTicket){
  newTicket=createStandardButton({
   label:"New ticket",
   variant:"neutral",
   className:"plant-overview-ticket-add",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"plants-icon plants-icon--16"),
   iconOnly:true
  });
  newTicket.addEventListener("click",event=>{
   event.stopPropagation();
   onOpenNewTicket();
  });
  ticketMeta.append(newTicket);
 }
 ticketHead.append(ticketMeta);
 const ticketBody=text("div","plant-overview-ops-body plant-overview-ticket-body");
 if(related.length){
  related.forEach(ticket=>{
   const row=text("button","plant-overview-ticket wd-control-state");
   row.type="button";
   row.setAttribute("aria-label",`Open ${ticket.number}: ${ticket.title}`);
   row.append(text("span","plant-overview-ticket-number",ticket.number,"Caption1/Regular"));
   row.append(text("span","plant-overview-ticket-title",ticket.title,"Footnote/Medium"));
   row.append(text("span",`plant-overview-ticket-state is-${ticket.status}`,ticket.status==="ongoing"?"ONGOING":"CLOSED","Caption1/Emphasized"));
   row.addEventListener("click",event=>{
    event.stopPropagation();
    onOpenTicket?.(ticket);
   });
   ticketBody.append(row);
  });
 }else{
  ticketBody.append(text("p","plant-overview-empty-copy","No service tickets for this plant.","Footnote/Regular"));
 }
 tickets.append(ticketHead,ticketBody);

 rail.append(faults,log,tickets);
 return {
  element:rail,
  controls:newTicket?[{host:newTicket,radius:18}]:[],
  cleanups:[()=>logScroll.destroy()]
 };
}

function pathFor(values,width=900,height=132){
 const min=Math.min(...values);
 const max=Math.max(...values);
 const span=Math.max(.1,max-min);
 const verticalPadding=8;
 const points=values.map((value,index)=>{
  const x=values.length===1?0:(index/(values.length-1))*width;
  const y=verticalPadding+(1-(value-min)/span)*(height-verticalPadding*2);
  return {x,y};
 });
 if(points.length<2)return "";
 let path=`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
 for(let index=0;index<points.length-1;index+=1){
  const previous=points[index-1]||points[index];
  const current=points[index];
  const next=points[index+1];
  const following=points[index+2]||next;
  const control1={x:current.x+(next.x-previous.x)/6,y:current.y+(next.y-previous.y)/6};
  const control2={x:next.x-(following.x-current.x)/6,y:next.y-(following.y-current.y)/6};
  path+=` C${control1.x.toFixed(1)} ${control1.y.toFixed(1)} ${control2.x.toFixed(1)} ${control2.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
 }
 return path;
}

function seriesFor(deviceId,metric){
 const seed=hash(`${deviceId}:${metric}`);
 const base=[.54,.58,.55,.66,.73,.71,.82,.76,.68,.84,.91,.87,.78,.74,.8,.86,.82,.9];
 const values=base.map((value,index)=>{
  const jitter=((seed>>(index%16))&7)/100;
  return metric==="energy"?value*4.2+jitter:value*3.6+jitter;
 });
 return values;
}

function createPeriodButton({glass,registerPanel,close,toast}){
 const button=text("button","plant-overview-period-button wd-control-state");
 button.type="button";
 button.setAttribute("aria-label","Select statistics period");
 button.setAttribute("aria-haspopup","dialog");
 const icon=createMaskedIcon(assetURL("asset-68.svg"),"plant-overview-period-icon");
 const label=text("span","plant-overview-date-label","Today","14/14 medium");
 button.append(icon,label);
 const now=new Date(2026,9,10,14,32);
 let activeRange=presetRange("Today",now);
 button.addEventListener("click",()=>{
  createDatePicker({
   trigger:button,
   glass,
   registerPanel,
   close,
   range:activeRange,
   onApply(range){
    activeRange=range;
    label.textContent=describeRange(range);
    toast?.("Period selected · Preview data");
   }
  });
 });
 return {element:button,range:()=>activeRange};
}

function createTrend(deviceId,{glass,registerPanel,close,toast}={}){
 const section=text("section","plant-overview-trend");
 section.setAttribute("aria-label","Energy trend");
 const head=text("div","plant-overview-section-head");
 const title=text("h2","plant-overview-section-title","Energy trend","Subheadline/Emphasized");
 const switchControl=createSegmentedControl({
  items:[
   {id:"all",label:"All"},
   {id:"default",label:"Default"},
   {id:"battery",label:"Battery"},
   {id:"frequency",label:"Frequency"}
  ],
  value:"all",
  label:"Energy trend mode",
  glass,
  onChange:id=>{
   const metric=id==="all"?"power":id==="default"?"energy":null;
   if(metric)applyMetric(metric);
  }
 });
 const controls=text("div","plant-overview-chart-actions");
 const period=createPeriodButton({glass,registerPanel,close,toast});
 controls.append(switchControl.element,period.element);
 head.append(title,controls);
 const chart=text("div","plant-overview-chart is-line-hidden");
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 900 132");
 svg.setAttribute("preserveAspectRatio","none");
 svg.setAttribute("role","img");
 svg.setAttribute("aria-label","Daily energy trend");
 const titleNode=document.createElementNS("http://www.w3.org/2000/svg","title");
 titleNode.textContent="Daily energy trend for the selected device";
 svg.append(titleNode);
 const grid=document.createElementNS("http://www.w3.org/2000/svg","path");
 grid.setAttribute("class","plant-overview-chart-grid");
 grid.setAttribute("d","M0 18H900M0 66H900M0 114H900");
 svg.append(grid);
 const lines=DEVICE_CHART[deviceId]||DEVICE_CHART.inverter;
 const lineNodes=lines.map((item,index)=>{
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("class",`plant-overview-chart-line is-${item.tone}${index===0?" is-primary":" is-secondary"}`);
  path.dataset.series=item.id;
  const values=seriesFor(deviceId+item.id,"power").map(value=>value*(1-index*.035));
  path.setAttribute("d",pathFor(values));
  svg.append(path);
  return path;
 });
 chart.append(svg);
 section.append(head,chart);
 function applyMetric(metric){
  lineNodes.forEach((line,index)=>{
   const item=lines[index];
   const values=seriesFor(deviceId+item.id,metric).map(value=>value*(1-index*.035));
   line.setAttribute("d",pathFor(values));
  });
 }
 function updateMetric(metric){
  switchControl.setValue(metric==="energy"?"default":"all",{notify:false});
  applyMetric(metric);
 }
 return {
  element:section,
  updateMetric,
  controls:[
   {host:period.element,radius:18}
  ],
  destroy:switchControl.destroy
 };
}

function createDeviceRail(plant,devices,activeId,onSelect){
 if(devices.length<=1)return null;
 const rail=text("aside","plant-overview-device-rail");
 rail.setAttribute("aria-label","Plant devices");
 rail.append(text("div","plant-overview-rail-label","Devices","Caption2/Emphasized"));
 for(const deviceId of devices){
  const meta=DEVICE_META[deviceId];
  const tone=statusFor(plant).tone;
  const button=text("button","plant-overview-device wd-control-state");
  button.type="button";
  button.dataset.device=deviceId;
  button.setAttribute("aria-pressed",String(deviceId===activeId));
  button.setAttribute("aria-label",`${meta.name}, ${meta.kind}, ${statusFor(plant).label}`);
  button.title=`${meta.name} · ${meta.kind}`;
  const dot=text("span",`plant-overview-device-dot is-${tone}`);
  dot.setAttribute("aria-hidden","true");
  const copy=text("span","plant-overview-device-copy");
  copy.append(
   text("span","plant-overview-device-name wd-control-label",meta.name,"Footnote/Medium"),
   text("span","plant-overview-device-state",meta.kind,"Caption2/Regular")
  );
  button.append(dot,copy);
  button.addEventListener("click",()=>onSelect(deviceId));
  rail.append(button);
 }
 return rail;
}

function createFlow(){
 const section=text("section","plant-overview-flow");
 section.setAttribute("aria-label","Live energy flow");
 section.append(text("div","plant-overview-flow-stage"));
 return {element:section};
}

const STATISTICS_TODAY=new Date(2026,10,9);
const MONTH_NAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function sameStatisticsDay(a,b){
 return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}

function statisticsDayData(base,date){
 if(sameStatisticsDay(date,STATISTICS_TODAY))return base;
 const key=`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
 const seed=hash(key);
 const homeScale=.78+(seed%39)/100;
 const solarScale=.58+((seed>>>4)%73)/100;
 const storageScale=.2+((seed>>>9)%25)/100;
 const homeToday=round(base.homeToday*homeScale,1);
 const solarToday=round(base.solarToday*solarScale,1);
 const dischargedToday=round(homeToday*storageScale,1);
 const chargedToday=round(Math.max(.1,solarToday*(.2+((seed>>>13)%18)/100)),1);
 const importedToday=round(Math.max(.1,homeToday-dischargedToday*.58-solarToday*.22),1);
 const exportedToday=round(Math.max(0,solarToday-chargedToday*.62)*.3,1);
 return {
  ...base,
  solarToday,
  homeToday,
  gridToday:round(importedToday+exportedToday,1),
  importedToday,
  exportedToday,
  chargedToday,
  dischargedToday,
  savings:round(base.savings*homeScale*.94,2),
  selfPowered:Math.max(24,Math.min(96,Math.round(base.selfPowered*.78+homeScale*22)))
 };
}

function historyPoints(base,period,kind,{dailyYear=false}={}){
 const points=[];
 if(kind==="month"){
  const year=period.date.getFullYear(),month=period.date.getMonth();
  const days=new Date(year,month+1,0).getDate();
  for(let day=1;day<=days;day+=1){
   const date=new Date(year,month,day);
   const sample=statisticsDayData(base,date);
   points.push({
    label:day===1?`${MONTH_SHORT[month]} 1`:day===days?`${MONTH_SHORT[month]} ${days}`:`${day}`,
    fullLabel:`${MONTH_NAMES[month]} ${day}, ${year}`,
    value:sample,
    weekend:date.getDay()===0||date.getDay()===6
   });
  }
  return points;
 }
 if(dailyYear){
  const year=period.date.getFullYear();
  const dayCount=(new Date(year+1,0,1)-new Date(year,0,1))/86400000;
  for(let offset=0;offset<dayCount;offset+=1){
   const date=new Date(year,0,offset+1);
   const sample=statisticsDayData(base,date);
   points.push({
    label:offset===0?"Jan 1":offset===dayCount-1?"Dec 31":`${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`,
    fullLabel:`${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${year}`,
    value:sample,
    weekend:date.getDay()===0||date.getDay()===6
   });
  }
  return points;
 }
 for(let month=0;month<12;month+=1){
  let home=0,solar=0,storage=0,imported=0,exported=0;
  const days=new Date(period.date.getFullYear(),month+1,0).getDate();
  for(let day=1;day<=days;day+=1){
   const sample=statisticsDayData(base,new Date(period.date.getFullYear(),month,day));
   home+=sample.homeToday;
   solar+=sample.solarToday;
   storage+=sample.dischargedToday;
   imported+=sample.importedToday;
   exported+=sample.exportedToday;
  }
  points.push({
   label:MONTH_SHORT[month],
   fullLabel:`${MONTH_NAMES[month]} ${period.date.getFullYear()}`,
   value:{homeToday:round(home,1),solarToday:round(solar,1),dischargedToday:round(storage,1),importedToday:round(imported,1),exportedToday:round(exported,1)},
   weekend:false
  });
 }
 return points;
}

function historySnapshot(base,period,kind,{dailyYear=false}={}){
 const points=historyPoints(base,period,kind,{dailyYear});
 const rangeLabel=kind==="month"
  ? `${MONTH_NAMES[period.date.getMonth()]} ${period.date.getFullYear()}`
  : String(period.date.getFullYear());
 return {
  rangeLabel,
  series:[
   {
    id:"home",
    title:"Home use",
    points:points.map(point=>({
     ...point,
     value:point.value.homeToday,
     detail:`${point.value.homeToday.toFixed(1)} kWh`
    }))
   },
   {
    id:"solar",
    title:"Solar energy",
    points:points.map(point=>({
     ...point,
     value:point.value.solarToday,
     detail:`${point.value.solarToday.toFixed(1)} kWh`
    }))
   },
   {
    id:"storage",
    title:"From iStorage",
    points:points.map(point=>({
     ...point,
     value:point.value.dischargedToday,
     detail:`${point.value.dischargedToday.toFixed(1)} kWh`
    }))
   },
   {
    id:"grid",
    title:"Grid exchange",
    signed:true,
    points:points.map(point=>({
     ...point,
     value:round(point.value.importedToday-point.value.exportedToday,1),
     detail:`${point.value.importedToday.toFixed(1)} kWh from grid\n${point.value.exportedToday.toFixed(1)} kWh to grid`
    }))
   }
  ]
 };
}

function createDayStatisticsView(data){
 const view=text("div","plant-overview-statistics-view plant-overview-day-view");
 view.dataset.periodView="day";
 const grid=text("div","plant-overview-day-grid");
 const energy=text("div","plant-overview-day-group plant-overview-day-energy");
 energy.append(text("h3","plant-overview-day-title","Energy","14/14 medium"),createEnergyChart(data));
 const savings=text("div","plant-overview-day-group plant-overview-day-savings");
 const savingsHead=text("div","plant-overview-day-title-row");
 savingsHead.append(
  text("h3","plant-overview-day-title","Savings","14/14 medium"),
  text("strong","plant-overview-day-total",`total: kr ${data.savings.toFixed(2)}`,"14/14 medium")
 );
 savings.append(savingsHead,createSavingsChart(data));
 const self=text("div","plant-overview-day-group plant-overview-day-self");
 self.append(text("h3","plant-overview-day-title","Self-powered","14/14 medium"),createSelfPoweredChart(data));
 const current=text("div","plant-overview-day-group plant-overview-current");
 current.append(text("h3","plant-overview-day-title","Current state","14/14 medium"),createCurrentStateChart(data));
 grid.append(energy,savings,self,current);
 view.append(grid);
 return {element:view,replaceData(nextData){view.replaceChildren(createDayStatisticsView(nextData).element.firstElementChild)}};
}

function createHistoryStatisticsView(base,kind){
 const view=text("div",`plant-overview-statistics-view plant-overview-history-view is-${kind}`);
 view.dataset.periodView=kind;
 const grid=text("div","plant-overview-history-grid");
 const chartBySeries={};
 for(const id of ["home","solar","storage","grid"]){
  const group=text("div",`plant-overview-history-group is-${id}`);
  const title=text("h3","plant-overview-day-title",id==="home"?"Home use":id==="solar"?"Solar energy":id==="storage"?"From iStorage":"Grid exchange","14/14 medium");
  const chart=createHistoryChart(kind,title.textContent);
  chartBySeries[id]=chart;
  group.append(title,chart.element);
  grid.append(group);
 }
 const combined=createCombinedHistoryChart(kind);
 combined.element.hidden=true;
 view.append(grid,combined.element);
 const update=period=>{
  const snapshot=historySnapshot(base,period,kind);
  for(const series of snapshot.series)chartBySeries[series.id].update({...snapshot,...series});
  combined.update(kind==="year"?historySnapshot(base,period,kind,{dailyYear:true}):snapshot);
  view.dataset.range=snapshot.rangeLabel;
 };
 const setLayout=layout=>{
  const combinedLayout=layout==="combined";
  view.dataset.layout=layout;
  grid.hidden=combinedLayout;
  combined.element.hidden=!combinedLayout;
 };
 return {element:view,update,setLayout};
}

function createTotalStatisticsView(base){
 const view=text("div","plant-overview-statistics-view plant-overview-total-view");
 view.dataset.periodView="total";
 const cumulative={
  ...base,
  solarToday:round(base.solarToday*365,1),
  homeToday:round(base.homeToday*365,1),
  gridToday:round(base.gridToday*365,1),
  importedToday:round(base.importedToday*365,1),
  exportedToday:round(base.exportedToday*365,1),
  chargedToday:round(base.chargedToday*365,1),
  dischargedToday:round(base.dischargedToday*365,1),
  savings:round(base.savings*365,2)
 };
 const metrics=text("section","plant-overview-total-metrics");
 metrics.setAttribute("aria-label","Total energy summary");
 const metricItems=[
  ["From grid",cumulative.importedToday,"kWh"],
  ["To grid",cumulative.exportedToday,"kWh"],
  ["From iStorage",cumulative.dischargedToday,"kWh"],
  ["To iStorage",cumulative.chargedToday,"kWh"],
  ["Solar energy",cumulative.solarToday,"kWh"],
  ["Home use",cumulative.homeToday,"kWh"],
  ["Self-powered",base.selfPowered,"%"],
  ["Savings",cumulative.savings,"kr"]
 ];
 const metricGrid=text("div","plant-overview-total-metric-grid");
 for(const [label,value,unit] of metricItems){
  const item=text("div","plant-overview-total-metric");
  const display=unit==="kWh"
   ?value>=1000?`${(value/1000).toFixed(1)} MWh`:`${value.toFixed(1)} kWh`
   :unit==="%"
    ?`${value.toFixed(0)}%`
    :`kr ${value.toFixed(2)}`;
  item.append(
   text("span","plant-overview-total-label",label,"Caption2/Regular"),
   text("strong","plant-overview-total-value",display,"Subheadline/Emphasized")
  );
  metricGrid.append(item);
 }
 metrics.append(metricGrid);

 const savingsSection=text("section","plant-overview-total-section is-savings");
 savingsSection.append(
  text("h3","plant-overview-day-title","Savings","14/14 medium"),
  createSavingsChart(cumulative,{showValues:true})
 );
 const selfSection=text("section","plant-overview-total-section is-self");
 selfSection.append(
  text("h3","plant-overview-day-title","Self-powered","14/14 medium"),
  createSelfPoweredChart(cumulative,{idPrefix:"plant-total-self"})
 );
 view.append(metrics,savingsSection,selfSection);
 return {element:view};
}

function animateChartMarks(chart,{groupIndex=0}={}){
 const marks=[...chart.querySelectorAll(".plant-overview-chart-mark")];
 return marks.map((mark,index)=>{
  mark.getAnimations().forEach(animation=>animation.cancel());
  return mark.animate(
   [
    {clipPath:"inset(-3px 100% -3px -3px)"},
    {clipPath:"inset(-3px -3px -3px -3px)"}
   ],
   {
    duration:motionDuration("--wd-motion-chart"),
    delay:groupIndex*motionDuration("--wd-motion-stagger")*.8+index*3,
    easing:motionEasing("--wd-ease-chart"),
    fill:"backwards"
   }
  );
 });
}

function animateChartSet(charts){
 return charts.flatMap((chart,groupIndex)=>animateChartMarks(chart,{groupIndex}));
}

function createInverterStatistics(data,{glass,registerPanel,close}={}){
 const section=text("section","plant-overview-stats plant-overview-day-statistics");
 const head=text("div","plant-overview-stats-head");
 const title=text("h2","plant-overview-stats-title","Statistics","Subheadline/Emphasized");
 const actions=text("div","plant-overview-stats-actions");
 let layoutControl=null;
 let historyLayout="separate";
 const periodState={mode:"day",date:new Date(STATISTICS_TODAY)};
 const dayView=createDayStatisticsView(data);
 const monthView=createHistoryStatisticsView(data,"month");
 const yearView=createHistoryStatisticsView(data,"year");
 const totalView=createTotalStatisticsView(data);
 const views=text("div","plant-overview-statistics-views");
 views.append(dayView.element,monthView.element,yearView.element,totalView.element);

 const localSurfaces=[];
 let mounted=false;
 let viewAnimation=null;
 let chartAnimations=[];
 let initial=true;

 function removeLocalSurfaces(){
  if(!glass)return;
  while(localSurfaces.length)glass.removeSurface(localSurfaces.pop());
 }

 function syncReadoutSurfaces(){
  if(!mounted||!glass)return;
  removeLocalSurfaces();
  glass.addSurface({host:period.element,radius:18});
  localSurfaces.push(period.element);
  const activeView=views.querySelector(".plant-overview-statistics-view:not([hidden])");
  for(const host of activeView?.querySelectorAll(".plant-overview-chart-readout")||[]){
   if(host.closest("[hidden]"))continue;
   glass.addSurface({host,radius:12,interactive:false});
   localSurfaces.push(host);
  }
 }

 function animateActiveView(){
  const activeView=views.querySelector(".plant-overview-statistics-view:not([hidden])");
  if(!activeView||reducedMotion())return;
  viewAnimation?.cancel();
  chartAnimations.forEach(animation=>animation.cancel());
  viewAnimation=activeView.animate(
   [{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"translateY(0)"}],
   {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel")}
  );
  const charts=[...activeView.querySelectorAll(".plant-overview-stat-chart")]
   .filter(chart=>!chart.closest("[hidden]"));
  chartAnimations=animateChartSet(charts);
 }

 function applyHistoryLayout({animate=true}={}){
  monthView.setLayout(historyLayout);
  yearView.setLayout(historyLayout);
  section.dataset.statisticsLayout=historyLayout;
  syncReadoutSurfaces();
  if(animate&&!initial)requestAnimationFrame(animateActiveView);
 }

 function ensureLayoutControl(){
  if(layoutControl)return;
  layoutControl=createSegmentedControl({
   items:[
    {id:"separate",label:"Separate"},
    {id:"combined",label:"Combined"}
   ],
   value:historyLayout,
   label:"Statistics chart layout",
   className:"plant-statistics-layout-control",
   glass,
   onChange:layout=>{
    historyLayout=layout;
    applyHistoryLayout();
   }
  });
  actions.prepend(layoutControl.element);
 }

 function applyPeriod(period,{animate=true}={}){
  periodState.mode=period.mode;
  periodState.date=new Date(period.date.getFullYear(),period.date.getMonth(),period.date.getDate());
  if(period.mode==="day")dayView.replaceData(statisticsDayData(data,periodState.date));
  else if(period.mode==="month")monthView.update(periodState);
  else if(period.mode==="year")yearView.update(periodState);
  section.dataset.periodMode=period.mode;
  const isHistory=period.mode==="month"||period.mode==="year";
  if(isHistory)ensureLayoutControl();
  if(layoutControl)layoutControl.element.hidden=!isHistory;
  applyHistoryLayout({animate:false});
  const label=statisticsPeriodLabel(periodState);
  section.setAttribute("aria-label",`Inverter statistics, ${label.toLowerCase()==="total"?"all time":label}`);
  for(const view of views.children)view.hidden=view.dataset.periodView!==period.mode;
  syncReadoutSurfaces();
  if(animate&&!initial)requestAnimationFrame(animateActiveView);
  initial=false;
 }

 const period=createStatisticsPeriodControl({
  glass,
  registerPanel,
  close,
  state:periodState,
  onChange:nextPeriod=>applyPeriod(nextPeriod)
 });
 actions.append(period.element);
 head.append(title,actions);
 monthView.update({mode:"month",date:new Date(periodState.date)});
 yearView.update({mode:"year",date:new Date(periodState.date)});
 section.append(head,views);
 applyPeriod({mode:"day",date:new Date(periodState.date)},{animate:false});

 return {
  element:section,
  controls:[],
  mountSurfaces(){
   mounted=true;
   syncReadoutSurfaces();
  },
  destroy(){
   layoutControl?.destroy();
   removeLocalSurfaces();
  }
 };
}

function createStats(plant,deviceId,data){
 const stats=text("div","plant-overview-stats plant-overview-device-stats");
 const items=deviceId==="bms"
  ? [
    ["State of charge",`${data.soc}%`],
    ["Battery power",`${signedPower(data.batteryRate)} kW`],
    ["Cell temperature",`${data.temperature}°C`],
    ["Self-powered",`${data.selfPowered}%`],
    ["Savings",`kr ${data.savings.toFixed(2)}`]
   ]
  : deviceId==="heater"
   ? [
     ["Heating power",`${Math.max(0,data.home-data.solar).toFixed(1)} kW`],
     ["Target",`${data.targetTemp}°C`],
     ["Runtime",`${5+(hash(plant.id)%5)}h ${18+(hash(deviceId)%39)}m`],
     ["Energy used",`${data.homeToday.toFixed(1)} kWh`],
     ["Savings",`kr ${data.savings.toFixed(2)}`]
    ]
   : [
     ["Solar today",`${data.solarToday.toFixed(1)} kWh`],
     ["Home use",`${data.homeToday.toFixed(1)} kWh`],
     ["Self-powered",`${data.selfPowered}%`],
     ["Grid balance",`${data.gridToday.toFixed(1)} kWh`],
     ["Savings",`kr ${data.savings.toFixed(2)}`]
    ];
 for(const [label,value] of items){
  const item=text("div","plant-overview-stat");
  item.append(text("span","plant-overview-stat-label",label,"Caption1/Emphasized"));
  item.append(text("strong","plant-overview-stat-value",value,"Title3/Emphasized"));
  stats.append(item);
 }
 return stats;
}

function createContext(plant){
 const state=statusFor(plant);
 const context=siteContextFor(plant);
 const strip=text("div","plant-overview-context");
 strip.setAttribute("aria-label","Plant context");
 const operational=text("div","plant-overview-context-group is-operational");
 operational.setAttribute("aria-label","System status");
 const environment=text("div","plant-overview-context-group is-environment");
 environment.setAttribute("aria-label","Site environment");
 const add=(file,tone,label,value)=>{
  const item=text("div","plant-overview-context-item");
  item.setAttribute("aria-label",`${label}: ${value}`);
  item.title=`${label}: ${value}`;
  item.append(contextIcon(file,tone),text("span","plant-overview-context-value",value,"Footnote/Medium"));
  (label==="Running status"||label==="Communications"?operational:environment).append(item);
 };
 add("status-check.svg",state.tone,"Running status",`Plant ${state.label.toLowerCase()}`);
 add(
  "signal.svg",
  context.communications==="Online"?"green":context.communications==="Unbound"?"neutral":"orange",
  "Communications",
  `Comms ${context.communications.toLowerCase()}`
 );
 add("cloud-sun.svg","neutral","Weather",context.weather);
 add("location.svg","neutral","Location",`${context.location} · ${context.localTime}`);
 strip.append(operational,environment);
 return strip;
}

export function createPlantOverview({
 plant,
 requestedDevice,
 onDeviceChange,
 onOpenTicket,
 onOpenNewTicket,
 onOpenSection,
 glass,
 registerPanel,
 close,
 toast
}){
 const devices=devicesFor(plant);
 let activeId=devices.includes(requestedDevice)?requestedDevice:devices[0];
 const root=text("div","plant-overview");
 root.dataset.activeDevice=activeId;
 const mountedSurfaces=[];
 const mountedCleanups=[];

 function clearGlassSurfaces(){
  while(mountedCleanups.length)mountedCleanups.pop()();
  while(mountedSurfaces.length)glass?.removeSurface(mountedSurfaces.pop());
 }

 function mountGlassSurfaces(surfaces){
  if(!glass)return;
  for(const {host,radius=14,chrome=false,interactive=true} of surfaces){
   glass.addSurface({host,radius,chrome,interactive});
   mountedSurfaces.push(host);
  }
 }

 function render(){
  clearGlassSurfaces();
  const data=overviewData(plant,activeId);
  const rail=createDeviceRail(plant,devices,activeId,selectDevice);
  const flow=createFlow();
  const trend=createTrend(activeId,{glass,registerPanel,close,toast});
  const ops=createOpsRail(plant,onOpenTicket,onOpenNewTicket,section=>onOpenSection?.(section,activeId));
  const context=createContext(plant);
  const isInverter=activeId==="inverter";
  const stats=isInverter
   ?createInverterStatistics(data,{glass,registerPanel,close})
   :{element:createStats(plant,activeId,data),controls:[]};
  const canvas=text("div","plant-overview-canvas");
  canvas.classList.toggle("is-single-device",devices.length<=1);
  canvas.classList.toggle("has-daily-statistics",isInverter);
  if(rail)canvas.append(rail);
  canvas.append(context,flow.element,ops.element,trend.element,stats.element);
  root.replaceChildren(canvas);
  mountGlassSurfaces([
   ...trend.controls,
   ...stats.controls,
   ...ops.controls
  ]);
  stats.mountSurfaces?.();
  if(isInverter)stats.element.classList.add("is-statistics-optimized");
  mountedCleanups.push(trend.destroy);
  if(stats.destroy)mountedCleanups.push(stats.destroy);
  for(const cleanup of ops.cleanups)mountedCleanups.push(cleanup);
  prepareAnimation();
 }

 function selectDevice(deviceId){
  if(deviceId===activeId)return;
  activeId=deviceId;
  root.dataset.activeDevice=deviceId;
  onDeviceChange?.(deviceId);
  render();
 }

 function prepareAnimation(){
  if(reducedMotion())return;
  const stage=root.querySelector(".plant-overview-flow-stage");
  if(stage){
   stage.animate(
    [{opacity:.35,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],
    {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel")}
   );
  }
  const charts=[...root.querySelectorAll(".plant-overview-stat-chart")]
   .filter(chart=>!chart.closest("[hidden]"));
  if(!charts.length)return;
  const animations=new WeakMap();
  const chartOrder=new Map(charts.map((chart,index)=>[chart,index]));
  const controller=new AbortController();
  const reveal=chart=>{
   animations.get(chart)?.forEach(animation=>animation.cancel());
   const running=animateChartMarks(chart,{groupIndex:chartOrder.get(chart)||0});
   running.forEach(animation=>{
    animation.finished.catch(()=>{});
   });
   animations.set(chart,running);
  };
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    observer.unobserve(entry.target);
    reveal(entry.target);
   }
  },{root:root.closest(".plants-detail-viewport"),threshold:.18});
  for(const chart of charts){
   observer.observe(chart);
   chart.addEventListener("click",()=>reveal(chart),{signal:controller.signal});
  }
  mountedCleanups.push(()=>{
   observer.disconnect();
   controller.abort();
  });
 }

 render();
 return {element:root,destroy:clearGlassSurfaces};
}

export function createPlantSectionPlaceholder(sectionId){
 const meta=PLANT_SECTIONS[sectionId];
 const section=text("section","plant-overview-subpage");
 section.setAttribute("aria-label",meta.label);
 section.append(
  text("p","plant-overview-subpage-kicker","Plant detail","Caption2/Emphasized"),
  text("h2","plant-overview-subpage-title",meta.label,"Title2/Emphasized"),
  text("p","plant-overview-subpage-copy",meta.description,"Footnote/Regular")
 );
 return section;
}

export function createPlantDetailTabs({current="overview",onSelect=null}={}){
 const nav=text("nav","plants-detail-tabs");
 nav.setAttribute("aria-label","Plant sections");
 const list=text("div","plants-detail-tab-list wd-scope-control");
 const definitions=[
  {id:"overview",label:"Overview"},
  {id:"devices",label:"Devices"},
  {id:"site",label:"Site details"}
 ];
 for(const definition of definitions){
  const selected=definition.id===current;
  const button=text("button","plants-detail-tab wd-scope-button wd-press-scale");
  button.type="button";
  button.disabled=Boolean(definition.disabled);
  if(!definition.disabled)button.classList.add("wd-control-state");
  button.classList.toggle("is-selected",selected);
  button.dataset.current=String(selected);
  button.dataset.section=definition.id;
  button.dataset.disabled=String(Boolean(definition.disabled));
  if(selected)button.setAttribute("aria-current","page");
  button.append(text("span","wd-control-label",definition.label,"Footnote/Medium"));
  if(!definition.disabled&&!selected)button.addEventListener("click",()=>onSelect?.(definition.id));
  list.append(button);
 }
 nav.append(list);
 return nav;
}
