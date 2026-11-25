import {GRID_PROFILES} from "./grid-profiles.js";
import {IPS_CHECK_ITEMS,TOU_CONTROL_MODES,TOU_INTERVAL_OPTIONS,TOU_PERIOD_MODES} from "./settings-options.js";

export const MODE_WIRE_VALUES=Object.freeze([0,1,2,3,4,6]);

export const MODES=Object.freeze([
 ["General Mode","mode","Self-consumption first. The right default for most sites.",["PV","Load","Battery","Grid"],
  "When PV exceeds the load, the surplus charges the battery and anything left over is exported. When PV falls short, the battery covers the gap, and the grid makes up the rest."],
 ["Peak Load Shifting Mode","cap","Caps what the site draws from the grid. Set Pmax first.",["PV","Load","Battery","Grid ≤ Pmax"],
  "The battery discharges to hold grid import below Pmax, keeping the site inside its connection limit or demand-charge band. PV serves the load first, then the battery, then the grid."],
 ["Economic Mode","tariff","Charge off-peak, discharge on-peak. Set the periods in Economic Schedule.",["Grid off-peak","Battery","Load on-peak"],
  "For a site on a peak and valley tariff. Each period of the schedule carries an action and a power value, so the battery charges from the grid when energy is cheap and discharges when it is dear."],
 ["UPS Mode","batt","Holds the battery full for outages. No discharge while on-grid.",["PV + Grid","Battery full","Hold"],
  "PV and grid charge the battery to full, and the grid carries the load while charging. The battery is held in reserve and discharges only when the grid fails."],
 ["ToU mode","clock","A different rule in each period. For complex tariffs.",["Period","Rule","Battery"],
  "Each period of the day gets its own sub-mode, so the battery can charge, hold or discharge to follow the local price curve. Use this when a single off-peak and on-peak pair cannot describe the tariff."],
 ["Off-Grid Mode","offgrid","No grid connection. Backup loads only.",["PV","Backup load","Battery"],
  "PV serves the backup loads first and charges the battery with any surplus. When PV falls short, the battery supplies the backup loads alongside the PV."]
].map(([label,icon,summary,flow,description],index)=>Object.freeze({
 label,
 compactLabel:label.replace(/ Mode$/i,""),
 wireValue:MODE_WIRE_VALUES[index],
 icon,
 summary,
 flow,
 description
})));

export function modeIndexFromLabel(value){
 const normalized=String(value||"").trim().toLowerCase();
 return MODES.findIndex(mode=>
  [mode.label,mode.compactLabel,`${mode.compactLabel} mode`]
   .some(candidate=>candidate.toLowerCase()===normalized)
 );
}

export const ECONOMIC_MODES=Object.freeze([
 ["charge_pv","Charge by PV Only"],
 ["charge_pv_grid","Charge by PV and Grid"],
 ["discharge","Discharge"]
].map(([id,label])=>Object.freeze({id,label})));

export function timeToMinutes(value){
 const match=/^(\d{2})[:.](\d{2})$/.exec(String(value||"").trim());
 if(!match)return null;
 const hours=Number(match[1]),minutes=Number(match[2]);
 if(hours===24&&minutes===0)return 1440;
 if(hours>23||minutes>59)return null;
 return hours*60+minutes;
}

export function minutesToTime(value){
 const total=Math.max(0,Math.min(1439,Math.round(value)));
 return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

export function isEconomicDraft(period){
 const from=timeToMinutes(period?.from),to=timeToMinutes(period?.to);
 return !period?.mode||period.powerPct===null||period.powerPct===undefined||from===null||to===null||from>=to;
}

function normalizeEconomicPeriods(periods,ratedPower){
 let nextId=1;
 const seenIds=new Set();
 return (Array.isArray(periods)?periods:[])
  .map(period=>{
   const legacyAction=period.act==="Charge"?"charge_pv_grid":period.act==="Discharge"?"discharge":"";
   if(period.act==="Self-use")return null;
   const mode=ECONOMIC_MODES.some(item=>item.id===period.mode)?period.mode:legacyAction||"charge_pv";
   const from=timeToMinutes(period.from),rawTo=timeToMinutes(period.to);
   if(from===null||rawTo===null||from>=rawTo)return null;
   const to=Math.min(1439,rawTo);
   const powerPct=Number.isFinite(Number(period.powerPct))
    ?Math.max(0,Math.min(100,Number(period.powerPct)))
    :Math.max(0,Math.min(100,Math.round(Number(period.kw||0)/ratedPower*100)));
   let id=period.id;
   if(!id||seenIds.has(id)){
    do{id=`eco-${nextId++}`;}while(seenIds.has(id));
   }
   seenIds.add(id);
   return {
    id,
    from:minutesToTime(from),
    to:minutesToTime(to),
    mode,
    powerPct:Math.round(powerPct)
   };
  })
  .filter(Boolean)
  .sort((a,b)=>timeToMinutes(a.from)-timeToMinutes(b.from));
}

export function isTouDraft(period){
 const from=timeToMinutes(period?.from),to=timeToMinutes(period?.to);
 return (
  !Number.isInteger(Number(period?.mode))||
  !TOU_PERIOD_MODES.some(mode=>mode.value===Number(period?.mode))||
  from===null||to===null||from>=to
 );
}

function normalizeTouPeriods(periods,interval=60){
 const safeInterval=TOU_INTERVAL_OPTIONS.some(option=>option.minutes===Number(interval))
  ?Number(interval)
  :60;
 const seen=new Set();
 let nextId=1;
 const normalized=(Array.isArray(periods)?periods:[])
  .slice(0,24)
  .map(period=>{
   let from=timeToMinutes(period?.from);
   let to=timeToMinutes(period?.to);
   if(from!==null)from=Math.max(0,Math.min(1440,Math.round(from/safeInterval)*safeInterval));
   if(to!==null)to=Math.max(0,Math.min(1440,Math.round(to/safeInterval)*safeInterval));
   const mode=TOU_PERIOD_MODES.some(item=>item.value===Number(period?.mode))
    ?Number(period.mode)
    :0;
   const power=Math.max(0,Math.min(100,Math.round(Number(period?.power??period?.batteryPowerLimit??100))));
   let id=period?.id;
   if(!id||seen.has(id)){
    do{id=`tou-${nextId++}`;}while(seen.has(id));
   }
   seen.add(id);
   return {
    id,
    from:from===null?String(period?.from||"00:00"):minutesToTime(from===1440?1439:from),
    to:to===null?String(period?.to||"00:00"):minutesToTime(to===1440?1439:to),
    ...(to===1440?{to:"24:00"}:{}),
    mode,
    power,
    pvForbidden:Number(period?.pvForbidden)===1?1:0
   };
  })
  .sort((left,right)=>{
   const draftDifference=Number(isTouDraft(left))-Number(isTouDraft(right));
   return draftDifference||(timeToMinutes(left.from)??0)-(timeToMinutes(right.from)??0);
  });
 return normalized;
}

function touConfig(site={}){
 const currency=String(site.currency||"SEK");
 return {
  controlMode:0,
  durationHighHours:3,
  durationLowHours:3,
  percentageHighRange:30,
  percentageLowRange:30,
  fixedHighPrice:0.32,
  fixedLowPrice:0.12,
  high:{mode:4,power:100,pvForbidden:0},
  normal:{mode:0,power:100,pvForbidden:0},
  low:{mode:3,power:100,pvForbidden:0},
  handlingFee:0,
  distributionFee:0,
  taxRate:0,
  autoExportLimit:0,
  country:String(site.country||"Sweden"),
  area:String(site.area||"SE1"),
  timezone:String(site.timezone||"Europe/Stockholm"),
  currency
 };
}

function initialTouPlan(){
 return [
  {id:"tou-manual-1",from:"00:00",to:"05:00",mode:0,power:100,pvForbidden:0},
  {id:"tou-manual-2",from:"05:00",to:"08:00",mode:1,power:100,pvForbidden:0},
  {id:"tou-manual-3",from:"08:00",to:"14:00",mode:2,power:100,pvForbidden:0},
  {id:"tou-manual-4",from:"14:00",to:"17:00",mode:3,power:100,pvForbidden:1},
  {id:"tou-manual-5",from:"17:00",to:"21:00",mode:4,power:100,pvForbidden:0},
  {id:"tou-manual-6",from:"21:00",to:"24:00",mode:5,power:100,pvForbidden:0}
 ];
}

const clone=value=>value===null||value===undefined?value:JSON.parse(JSON.stringify(value));

function batterySocRange(){
 return {
  gridMin:10,
  gridMax:80,
  offMin:20,
  offMax:90
 };
}

function batteryConfig(){
 return {
  brand:"Wattsonic",
  protocol:"Wattsonic",
  enabled:1,
  chargeMax:100,
  dischargeMax:100,
  warm:1
 };
}

function ipsItemState(item,overrides={}){
 const finite=value=>value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));
 return {
  status:["not_checked","checking","passed","failed","interrupted"].includes(overrides.status)
   ?overrides.status
   :"not_checked",
  range:finite(overrides.range)?Number(overrides.range):item.range,
  time:finite(overrides.time)?Number(overrides.time):item.time,
  measured:finite(overrides.measured)?Number(overrides.measured):item.measured,
  protectionMs:finite(overrides.protectionMs)?Number(overrides.protectionMs):item.protectionMs
 };
}

function initialIpsState(){
 const items=Object.fromEntries(IPS_CHECK_ITEMS.map(item=>[item.id,ipsItemState(item)]));
 const historyItems=Object.fromEntries(IPS_CHECK_ITEMS.map(item=>{
  const status=["underV1","overF2"].includes(item.id)?"failed":"passed";
  return [item.id,ipsItemState(item,{
   status,
   measured:item.quantity==="frequency"?50.01:item.measured,
   protectionMs:100
  })];
 }));
 return {
  required:1,
  testEnable:0,
  gridConnected:1,
  items,
  lastRecord:{
   completedAt:new Date(2026,8,28,15,36).getTime(),
   items:clone(historyItems)
  }
 };
}

function normalizeMpptInventoryPoints(points){
 const defaults=[1,2,3,4,5];
 const source=Array.isArray(points)?points:[];
 return Array.from({length:5},(_,index)=>{
  const value=Number(source[index]);
  return Number.isInteger(value)&&value>=1&&value<=5?value:defaults[index];
 });
}

function normalizeMpptGroupPoints(points,count){
 const source=Array.isArray(points)?points:[];
 const next=Array.from({length:4},(_,index)=>{
  const value=Number(source[index]);
  return Number.isInteger(value)&&value>=1&&value<=4?value:index+1;
 });
 const groups=new Map();
 for(let index=0;index<count;index+=1){
  const candidate=next[index];
  const members=groups.get(candidate)||[];
  if(members.length>=2)next[index]=null;
  else groups.set(candidate,[...members,index]);
 }
 const used=new Set(next.slice(0,count).filter(value=>value!==null));
 for(let index=0;index<count;index+=1){
  if(next[index]!==null)continue;
  let candidate=1;
  while(used.has(candidate))candidate+=1;
  next[index]=candidate;
  used.add(candidate);
 }
 return next;
}

function initialState(){
 return {
  page:"dispatch",gridSub:"code",gridOpen:false,unlocked:false,
  mpptPickerOpen:false,
  navExpanded:{},
  runMode:0,
  dispatch:{on:1,unit:1,sp:-10,timeout:300},
  limits:{
   feedOn:1,feed:10,impOn:0,imp:15,basis:0,
   importPermission:1,
   exportPermission:"solar_battery"
  },
  capability:0,di:2,
  telemetry:{
   effective:{available:1,limit:-6.0,source:"Battery charging",sourceTone:"signal",pvCurtailed:4.8}
  },
  battery:{
   parallel:1,
   soc:batterySocRange(),
   common:batteryConfig(),
   bank1:batteryConfig(),
   bank2:batteryConfig()
  },
  battChgMax:6.0,battDisMax:20.0,pvAvail:4.8,
  features:{watchdog:1,wdt:300,offgrid:1,backupOutput:1,unbalanced:0,light:1,buzzer:0},
  ips:initialIpsState(),
  eco:[
   {id:"eco-1",from:"00:00",to:"06:00",mode:"charge_pv_grid",powerPct:100},
   {id:"eco-2",from:"17:00",to:"21:00",mode:"discharge",powerPct:90}
  ],
  touDay:"today",
  touView:"main",
  tou:{
   interval:60,
   manual:initialTouPlan(),
   dynamic:{
    today:initialTouPlan(),
    tomorrow:[{id:"tou-tomorrow-1",from:"00:00",to:"24:00",mode:0,power:100,pvForbidden:0}]
   },
   config:touConfig()
  },
  net:{iface:0,dhcp:1,wifiOn:1,wifiSsid:"iHybrid-020",wifiPassword:"iHybrid020",modbus:1,port:502,unit:1},
  mppt:{
   pv:[0,0,0,2],
   parallel:0,
   inventoryPoints:[1,2,3,4,5],
   groupPoints:[1,2,3,4],
   scanMode:0,
   scan:1,
   interval:30,
   individual:[],
   lastScanMinutesAgo:18
  },
  ctCurrentMode:0,
  ct:{running:0,l1:"ok",l2:"ok",l3:"rev",lastMinutesAgo:33},
  ops:{running:1,faults:0},
  exp:{fmt:0,oper:1,grid:1,log:0},
  log:[
   {
    minutesAgo:0,
    operator:{name:"EMS Gateway",email:"ems.gateway@wattdesk.example"},
    changes:[
     {parameter:"Setpoint",from:"0.0 kW",to:"-10.0 kW"},
     {parameter:"Command timeout",from:"300 s",to:"420 s"}
    ]
   },
   {
    minutesAgo:3,
    operator:{name:"Lena Tong",email:"lena.tong@wattdesk.example"},
    changes:[
     {parameter:"Export limit",from:"Off",to:"10.0 kW"},
     {parameter:"Import limit",from:"15.0 kW",to:"12.0 kW"},
     {parameter:"Minimum battery reserve",from:"10.0 %",to:"15.0 %"}
    ]
   },
   {
    minutesAgo:17,
    operator:{name:"Mara Klein",email:"mara.klein@wattdesk.example"},
    changes:[
     {parameter:"Grid code",from:"VDE4105",to:"EN50549-1"},
     {parameter:"Protection limits",from:"VDE4105 certified set",to:"EN50549-1 certified set"},
     {parameter:"Reconnection window",from:"180 s",to:"120 s"}
    ]
   },
   {
    minutesAgo:46,
    operator:{name:"Noah Fischer",email:"noah.fischer@wattdesk.example"},
    changes:[
      {parameter:"Running mode",from:"Economic Mode",to:"General Mode"}
    ]
   },
   {
    minutesAgo:190,
    operator:{name:"Yuki Tanaka",email:"yuki.tanaka@wattdesk.example"},
    changes:[
     {parameter:"Battery Grid-tied SOC upper limit",from:"75 %",to:"80 %"},
     {parameter:"Battery Off-grid SOC lower limit",from:"15 %",to:"20 %"}
    ]
   },
   {
    minutesAgo:590,
    operator:{name:"Lena Tong",email:"lena.tong@wattdesk.example"},
    changes:[
     {parameter:"Economic schedule · 00:00–06:00",from:"Charge by PV and Grid · 100 %",to:"Charge by PV and Grid · 80 %"},
     {parameter:"Economic schedule · 17:00–21:00",from:"Discharge · 90 %",to:"Discharge · 95 %"},
     {parameter:"Unassigned periods",from:"General Mode",to:"General Mode with PV priority"}
    ]
   },
   {
    minutesAgo:1440,
    operator:{name:"System scheduler",email:"scheduler@wattdesk.example"},
    changes:[
      {parameter:"MPPT #1 input",from:"Solar",to:"None"},
      {parameter:"MPPT #2 input",from:"Solar",to:"Solar"},
      {parameter:"MPPT #3 input",from:"None",to:"Wind"},
     {parameter:"Shadow scan interval",from:"15 mins",to:"30 mins"}
    ]
   },
   {
    minutesAgo:4380,
    operator:{name:"Mara Klein",email:"mara.klein@wattdesk.example"},
    changes:[
     {parameter:"Firmware parameter set",from:"V1009.1009.0982",to:"V1009.1009.1016"}
    ]
   },
   {
    minutesAgo:11520,
    operator:{name:"Lena Tong",email:"lena.tong@wattdesk.example"},
    changes:[
      {parameter:"Import limit",from:"20.0 kW",to:"15.0 kW"}
    ]
   }
  ],
  gridCode:"de_vde4105",g:{},gref:{},
  reacQSet:0,reacPFSet:1
 };
}

export function createSettingsModel({
 ratedPower=50,
 runMode=0,
 phaseCount=1,
 supportsPerPhaseLimit=false,
 batteryPathCount=1,
 supportsBatteryParallel=false,
 batteryMasterBattery=null,
 mpptInventoryPoints=[1,2,3,4,5],
 mpptGroupPoints=[1,2,3,4],
 siteDetails=null,
  supportsDynamicPricing=true,
  ipsPreview=false,
  ipsSelfCheckRequired=1,
  deviceOnline=true
}={}){
 const S=initialState();
 const PN=Number.isFinite(Number(ratedPower))&&Number(ratedPower)>0?Number(ratedPower):50;
 const normalizedMpptInventoryPoints=normalizeMpptInventoryPoints(mpptInventoryPoints);
 const mpptCount=normalizedMpptInventoryPoints.filter(value=>value!==5).length;
 const capabilities=Object.freeze({
  phaseCount:Number(phaseCount)===3?3:1,
  supportsPerPhaseLimit:Boolean(supportsPerPhaseLimit),
  batteryPathCount:Number(batteryPathCount)===2?2:1,
  supportsBatteryParallel:Boolean(supportsBatteryParallel),
  batteryMasterBattery:["bank1","bank2"].includes(batteryMasterBattery)?batteryMasterBattery:null,
  mpptCount,
  mpptInventoryPointCount:5,
  mpptGroupPointCount:4,
  supportsDynamicPricing:Boolean(supportsDynamicPricing),
  ipsPreview:Boolean(ipsPreview),
  ipsSelfCheckRequired:Number(ipsSelfCheckRequired)!==0,
  deviceOnline:Boolean(deviceOnline)
 });
 S.tou.config=touConfig(siteDetails||{});
 S.mppt.inventoryPoints=[...normalizedMpptInventoryPoints];
 S.mppt.groupPoints=normalizeMpptGroupPoints(mpptGroupPoints,mpptCount);
 S.runMode=Number.isInteger(Number(runMode))&&MODES[Number(runMode)]?Number(runMode):0;
 const has=key=>Object.prototype.hasOwnProperty.call(S.g,key);
 const hasAll=(...keys)=>keys.every(has);
 const dev=key=>has(key)&&S.g[key]!==S.gref[key];
 const prof=()=>GRID_PROFILES[S.gridCode];
 const tfmt=key=>{
  const baseline=S.gref[key];
  const sub=baseline!==undefined&&Math.abs(baseline)<1;
  return sub?{dec:2,step:.01}:{dec:1,step:.1};
 };
 const loadProfile=code=>{
  const profile=GRID_PROFILES[code];
  if(!profile)return false;
  S.gridCode=code;
  S.g=profile.p?clone(profile.p):{};
  S.gref=profile.p?clone(profile.p):{};
  return true;
 };
 const normalizeEco=()=>{
  S.eco=normalizeEconomicPeriods(S.eco,PN);
 };
 const normalizeLimitBasis=()=>{
  const basis=Number(S.limits.basis);
  S.limits.basis=capabilities.phaseCount===3&&capabilities.supportsPerPhaseLimit&&basis===1?1:0;
  S.limits.importPermission=Number(S.limits.importPermission)===0?0:1;
  S.limits.exportPermission=["solar_battery","solar_only","non_export"].includes(S.limits.exportPermission)
   ?S.limits.exportPermission
   :"solar_battery";
 };
 const normalizeBattery=()=>{
  const battery=S.battery&&typeof S.battery==="object"?S.battery:{};
  const legacySoc=battery.common&&typeof battery.common==="object"?battery.common:{};
  const socSource=battery.soc&&typeof battery.soc==="object"?battery.soc:legacySoc;
  const normalized={
   parallel:1,
   soc:batterySocRange(),
   common:batteryConfig(),
   bank1:batteryConfig(),
   bank2:batteryConfig()
  };
  for(const field of ["gridMin","gridMax","offMin","offMax"]){
   const value=Number(socSource[field]);
   if(Number.isFinite(value))normalized.soc[field]=Math.max(0,Math.min(100,Math.round(value)));
  }
  normalized.soc.gridMin=Math.min(normalized.soc.gridMin,normalized.soc.gridMax);
  normalized.soc.offMin=Math.min(normalized.soc.offMin,normalized.soc.offMax);
  for(const key of ["common","bank1","bank2"]){
   const source=battery[key]&&typeof battery[key]==="object"?battery[key]:{};
   const bank={...batteryConfig()};
   bank.protocol=typeof source.protocol==="string"&&source.protocol?source.protocol:"Wattsonic";
   bank.enabled=Number(source.enabled)===0?0:1;
   for(const field of ["chargeMax","dischargeMax"]){
    const value=Number(source[field]);
    if(Number.isFinite(value))bank[field]=Math.max(0,Math.min(1000,Math.round(value)));
   }
   if(typeof source.brand==="string"&&source.brand)bank.brand=source.brand;
   bank.warm=Number(source.warm)===0?0:1;
   normalized[key]=bank;
  }
  normalized.parallel=capabilities.batteryPathCount===2&&capabilities.supportsBatteryParallel&&Number(battery.parallel)!==0?1:0;
  S.battery=normalized;
 };
 const normalizeMppt=()=>{
  const count=capabilities.mpptCount;
  const source=S.mppt&&typeof S.mppt==="object"?S.mppt:{};
  const pvSource=Array.isArray(source.pv)?source.pv:[];
  const inventorySource=Array.isArray(source.inventoryPoints)?source.inventoryPoints:normalizedMpptInventoryPoints;
  const groupSource=Array.isArray(source.groupPoints)
   ?source.groupPoints
   :Array.isArray(source.groupAssignments)
    ?source.groupAssignments
    :mpptGroupPoints;
  S.mppt={
   ...source,
   pv:Array.from({length:count},(_,index)=>{
    const value=Number(pvSource[index]);
    return [0,1,2].includes(value)?value:0;
   }),
   parallel:count>1&&Number(source.parallel)!==0?1:0,
   inventoryPoints:normalizeMpptInventoryPoints(inventorySource),
   groupPoints:normalizeMpptGroupPoints(groupSource,count),
   scanMode:Number(source.scanMode)===1?1:0,
   individual:Array.from({length:count},(_,index)=>{
    const item=Array.isArray(source.individual)?source.individual[index]:null;
    const interval=Number(item?.interval);
    return {
     scan:Number(item?.scan)===0?0:1,
     interval:[5,15,30,60].includes(interval)?interval:30
    };
   })
  };
  delete S.mppt.groupAssignments;
  if(count===2&&S.mppt.parallel){
   S.mppt.groupPoints=normalizeMpptGroupPoints([1,1,...S.mppt.groupPoints.slice(2)],count);
  }
 };
 const normalizeTou=()=>{
  const tou=S.tou&&typeof S.tou==="object"?S.tou:{};
  const interval=Number(tou.interval);
  const nextInterval=TOU_INTERVAL_OPTIONS.some(option=>option.minutes===interval)?interval:60;
  const defaults=touConfig(siteDetails||{});
  const sourceConfig=tou.config&&typeof tou.config==="object"?tou.config:{};
  const controlMode=TOU_CONTROL_MODES.some(mode=>mode.value===Number(sourceConfig.controlMode))
   ?Number(sourceConfig.controlMode)
   :0;
  const group=(source,fallback)=>{
   const item=source&&typeof source==="object"?source:{};
   const mode=TOU_PERIOD_MODES.some(entry=>entry.value===Number(item.mode))
    ?Number(item.mode)
    :fallback.mode;
   return {
    mode,
    power:Math.max(0,Math.min(100,Math.round(Number(item.power??fallback.power)))),
    pvForbidden:Number(item.pvForbidden)===1?1:0
   };
  };
  const number=(value,fallback,min,max,digits=0)=>{
   const candidate=Number(value);
   const safe=Number.isFinite(candidate)?candidate:fallback;
   const clamped=Math.max(min,Math.min(max,safe));
   const factor=10**digits;
   return Math.round(clamped*factor)/factor;
  };
  const config={
   ...defaults,
   ...sourceConfig,
   controlMode,
   durationHighHours:number(sourceConfig.durationHighHours,defaults.durationHighHours,0,24),
   durationLowHours:number(sourceConfig.durationLowHours,defaults.durationLowHours,0,24),
   percentageHighRange:number(sourceConfig.percentageHighRange,defaults.percentageHighRange,0,100,1),
   percentageLowRange:number(sourceConfig.percentageLowRange,defaults.percentageLowRange,0,100,1),
   fixedHighPrice:number(sourceConfig.fixedHighPrice,defaults.fixedHighPrice,-100,100,1),
   fixedLowPrice:number(sourceConfig.fixedLowPrice,defaults.fixedLowPrice,-100,100,1),
   handlingFee:number(sourceConfig.handlingFee,defaults.handlingFee,0,100,2),
   distributionFee:number(sourceConfig.distributionFee,defaults.distributionFee,0,100,2),
   taxRate:number(sourceConfig.taxRate,defaults.taxRate,0,100,1),
   autoExportLimit:Number(sourceConfig.autoExportLimit)===1?1:0,
   country:String(sourceConfig.country||defaults.country),
   area:String(sourceConfig.area||defaults.area),
   timezone:String(sourceConfig.timezone||defaults.timezone),
   currency:String(sourceConfig.currency||defaults.currency),
   high:group(sourceConfig.high,defaults.high),
   normal:group(sourceConfig.normal,defaults.normal),
   low:group(sourceConfig.low,defaults.low)
  };
  if(config.durationHighHours+config.durationLowHours>24){
   config.durationLowHours=Math.max(0,24-config.durationHighHours);
  }
  if(config.percentageHighRange+config.percentageLowRange>100){
   config.percentageLowRange=Math.max(0,100-config.percentageHighRange);
  }
  S.tou={
   interval:nextInterval,
   manual:normalizeTouPeriods(Array.isArray(tou.manual)?tou.manual:initialTouPlan(),nextInterval),
   dynamic:{
    today:normalizeTouPeriods(Array.isArray(tou.dynamic?.today)?tou.dynamic.today:initialTouPlan(),nextInterval),
    tomorrow:normalizeTouPeriods(
     Array.isArray(tou.dynamic?.tomorrow)
      ?tou.dynamic.tomorrow
      :[{id:"tou-tomorrow-1",from:"00:00",to:"24:00",mode:0,power:100,pvForbidden:0}],
     nextInterval
    )
   },
   config
  };
 };
 const normalizeIps=()=>{
  const source=S.ips&&typeof S.ips==="object"?S.ips:{};
  const sourceItems=source.items&&typeof source.items==="object"?source.items:{};
  const items=Object.fromEntries(IPS_CHECK_ITEMS.map(item=>[
   item.id,
   ipsItemState(item,sourceItems[item.id])
  ]));
  const sourceRecord=source.lastRecord&&typeof source.lastRecord==="object"?source.lastRecord:null;
  const recordItems=sourceRecord?.items&&typeof sourceRecord.items==="object"
   ?Object.fromEntries(IPS_CHECK_ITEMS.map(item=>[
     item.id,
     ipsItemState(item,sourceRecord.items[item.id])
    ]))
   :null;
  S.ips={
   required:capabilities.ipsSelfCheckRequired?1:0,
   testEnable:Number(source.testEnable)===1?1:0,
   gridConnected:Number(source.gridConnected)===0?0:1,
   items,
   lastRecord:sourceRecord&&Number.isFinite(Number(sourceRecord.completedAt))&&recordItems
    ?{completedAt:Number(sourceRecord.completedAt),items:recordItems}
    :initialIpsState().lastRecord
  };
 };
 const touDay=()=>S.touDay==="tomorrow"?"tomorrow":"today";
 const touPlan=()=>S.tou.dynamic[touDay()];
 const touPricePoint=(index,day=touDay())=>{
  const offset=day==="tomorrow"?0.035:0;
  const x=index/96;
  const hour=index/4;
  const peakTariff=(hour>=6&&hour<13)||(hour>=15&&hour<22);
  const buy=peakTariff?0.34:0.12;
  const sellSlot=Math.floor(index/2);
  const sellX=sellSlot/48;
  const morning=0.03*Math.exp(-((sellX-.2)**2)/.004);
  const midday=0.065*Math.exp(-((sellX-.47)**2)/.012);
  const evening=0.095*Math.exp(-((sellX-.74)**2)/.018);
  const texture=0.007*Math.sin(sellSlot*.33)+0.004*Math.sin(sellSlot*.11+1.2);
  const sell=Math.round(Math.max(0.015,0.065+texture+morning+midday+evening+offset)*200)/200;
  return {
   buy:Math.round((buy+offset)*1000)/1000,
   sell:Math.round(sell*1000)/1000
  };
 };
 const touPrices=(day=touDay())=>Array.from({length:96},(_,index)=>touPricePoint(index,day));
 const touThresholds=(day=touDay())=>{
  if(day==="tomorrow")return {high:null,low:null};
  const prices=touPrices(day).map(point=>point.buy);
  const min=Math.min(...prices),max=Math.max(...prices);
  const config=S.tou.config;
  if(config.controlMode===3)return {
   high:config.fixedHighPrice,
   low:config.fixedLowPrice
  };
  if(config.controlMode===2)return {
   high:Math.round((max-(max-min)*config.percentageHighRange/100)*100)/100,
   low:Math.round((min+(max-min)*config.percentageLowRange/100)*100)/100
  };
  return {high:null,low:null};
 };
 const modeAtMinute=(plan,minute)=>{
  const fallback=TOU_PERIOD_MODES[0];
  const item=(plan||[]).find(period=>{
   const from=timeToMinutes(period.from),to=timeToMinutes(period.to);
   return from!==null&&to!==null&&minute>=from&&minute<to;
  });
  return TOU_PERIOD_MODES.find(mode=>mode.value===Number(item?.mode))||fallback;
 };
 const touModeAt=(minute,day=touDay())=>modeAtMinute(S.tou.dynamic[day],minute);
 const touSegmentsForPalette=(day=touDay())=>[...new Set(S.tou.dynamic[day].map(period=>
  TOU_PERIOD_MODES.find(mode=>mode.value===Number(period.mode))?.label
 ).filter(Boolean))];
 const compactTouSegments=(classifications)=>{
  const groups=["low","normal","high"];
  const result=[];
  for(let hour=0;hour<24;hour+=1){
   const group=classifications[hour]||"normal";
   if(group!=="low"&&!groups.includes(group))continue;
   const last=result[result.length-1];
   if(last&&last.group===group&&last.toHour===hour){
    last.toHour=hour+1;
   }else{
    result.push({group,fromHour:hour,toHour:hour+1});
   }
  }
  return result;
 };
 const regenerateTouDynamic=()=>{
  if(!capabilities.supportsDynamicPricing)return;
  const config=S.tou.config;
  if(config.controlMode===0)return;
  const dayPrices=touPrices("today");
  const hourly=Array.from({length:24},(_,hour)=>{
   const points=dayPrices.slice(hour*4,hour*4+4);
   return points.reduce((total,item)=>total+item.buy,0)/points.length;
  });
  const sorted=[...hourly].map((price,hour)=>({price,hour})).sort((left,right)=>
   left.price-right.price||left.hour-right.hour
  );
  let classifications=Array(24).fill("normal");
  if(config.controlMode===1){
   const lowCount=Math.max(0,Math.min(24,config.durationLowHours));
   const highCount=Math.max(0,Math.min(24-lowCount,config.durationHighHours));
   sorted.slice(0,lowCount).forEach(({hour})=>{classifications[hour]="low";});
   sorted.slice(-highCount).forEach(({hour})=>{classifications[hour]="high";});
  }else if(config.controlMode===2||config.controlMode===3){
   const thresholds=touThresholds("today");
   classifications=hourly.map(price=>{
    if(thresholds.high!==null&&price>=thresholds.high)return "high";
    if(thresholds.low!==null&&price<=thresholds.low)return "low";
    return "normal";
   });
  }else if(config.controlMode===4){
   const median=sorted[Math.floor(sorted.length/2)]?.price??0;
   const lower=sorted[Math.floor(sorted.length/3)]?.price??median;
   const upper=sorted[Math.floor(sorted.length*2/3)]?.price??median;
   classifications=hourly.map(price=>price>=upper?"high":price<=lower?"low":"normal");
  }
  const target=compactTouSegments(classifications).map((segment,index)=>{
   const settings=config[segment.group]||config.normal;
   return {
    id:`tou-dynamic-${index+1}`,
    from:`${String(segment.fromHour).padStart(2,"0")}:00`,
    to:segment.toHour===24?"24:00":`${String(segment.toHour).padStart(2,"0")}:00`,
    mode:settings.mode,
    power:settings.power,
    pvForbidden:settings.pvForbidden
   };
  });
  S.tou.dynamic.today=normalizeTouPeriods(target.slice(0,24),S.tou.interval);
  S.tou.dynamic.tomorrow=[{id:"tou-tomorrow-1",from:"00:00",to:"24:00",mode:0,power:100,pvForbidden:0}];
 };
 const get=path=>path.split(".").reduce((value,key)=>value?.[/^\d+$/.test(key)?Number(key):key],S);
 const set=(path,value)=>{
  const parts=path.split(".");
  const last=parts.pop();
  const target=parts.reduce((node,key)=>node[/^\d+$/.test(key)?Number(key):key],S);
  if(target)target[/^\d+$/.test(last)?Number(last):last]=value;
 };
 const devCount=()=>Object.keys(S.gref).filter(dev).length;
 const devHere=keys=>keys.filter(dev).length;
 const unit=()=>S.dispatch.unit?"kW":"%Pn";
 const spKW=()=>S.dispatch.unit?S.dispatch.sp:S.dispatch.sp*PN/100;
 const effective=()=>{
  // Effective limit, source and curtailed PV are RO device telemetry. Writable
  // strategy fields must never be used to infer or fabricate these values.
  const sp=spKW();
  const feed=S.limits.feedOn?S.limits.feed:PN;
  const telemetry=S.telemetry.effective;
  const limit=Number(telemetry.limit);
  const curtailed=Number(telemetry.pvCurtailed);
  const available=Boolean(telemetry.available)&&Number.isFinite(limit)&&Number.isFinite(curtailed);
  const reportedTone=String(telemetry.sourceTone||"idle");
  const sourceTone=["success","warning","signal","idle"].includes(reportedTone)?reportedTone:"idle";
  return {
   sp,
   feed,
   out:available?limit:null,
   src:available?String(telemetry.source||""):"",
   sourceTone:available?sourceTone:"idle",
   curtail:available?curtailed:null,
   available
  };
 };
 const gridSubs=()=>{
  const list=[["code","Grid Code",""]];
  if(!prof().p){
   if(S.gridCode==="it_cei021"){
    list.push(
     ["prot","Protection Limits",""],
     ["conn","Grid Connection",""],
     ["reac","Reactive Power",""],
     ["pu","P(U) Characteristics",""],
     ["fp","Frequency-Watt (F-P)",""],
     ["lvrt","LVRT",""],
     ["hvrt","HVRT",""],
     ["ips","IPS Check",""]
    );
   }
   return list;
  }
  list.push(["prot","Protection Limits",""],["conn","Grid Connection",""]);
  list.push(["reac","Reactive Power",""]);
  if(hasAll("puV1","puV2"))list.push(["pu","P(U) Characteristics",""]);
  if(has("ofpStart")||has("ufpStart"))list.push(["fp","Frequency-Watt (F-P)",""]);
  if(has("lv1")||has("lvrtOn")||has("lvZero")||has("lvrtPm"))list.push(["lvrt","LVRT",""]);
  if(has("hv1")||has("hvrtOn")||has("hvZero")||has("hvrtPm"))list.push(["hvrt","HVRT",""]);
  if(S.gridCode==="it_cei021")list.push(["ips","IPS Check",""]);
  return list;
 };
 const KEY_PAGE=[
  [/^(ov|uv|of|uf)\d|^ov10|^rocof|^islandOn/,"Protection Limits"],
  [/^(rc|su)[VF]|^rcDelay|^suDelay|^ramp/,"Grid Connection"],
  [/^(reac|qu|cp|upf|lock|P_Q)/,"Reactive Power"],
  [/^pu/,"P(U)"],
  [/^(ofp|ufp)/,"Frequency-Watt"],
  [/^lv/,"LVRT"],
  [/^hv/,"HVRT"]
 ];
 const devList=()=>Object.keys(S.gref).filter(dev).map(key=>{
  const page=KEY_PAGE.find(([pattern])=>pattern.test(key));
  return {label:`${key}  ${S.gref[key]} → ${S.g[key]}`,page:page?page[1]:"—"};
 });
 const mpptGroups=()=>{
  const grouped=new Map();
  S.mppt.groupPoints.slice(0,capabilities.mpptCount).forEach((id,index)=>{
   if(!grouped.has(id))grouped.set(id,[]);
   grouped.get(id).push(index);
  });
  return [...grouped.entries()]
   .filter(([,members])=>members.length===2)
   .map(([id,members])=>({id,members:[...members].sort((left,right)=>left-right)}))
   .sort((left,right)=>left.members[0]-right.members[0]);
 };
 const mpptIndices=()=>Array.from({length:capabilities.mpptCount},(_,index)=>index);
 const ipsItemViews=()=>IPS_CHECK_ITEMS.map(item=>({
  ...item,
  ...S.ips.items[item.id],
  status:S.ips.items[item.id]?.status||"not_checked"
 }));
 const ipsOverallStatus=()=>{
  if(!capabilities.deviceOnline)return "offline";
  const statuses=ipsItemViews().map(item=>item.status);
  if(statuses.includes("checking"))return "checking";
  if(statuses.includes("failed"))return "failed";
  if(statuses.every(status=>status==="passed"))return "passed";
  if(statuses.every(status=>status==="not_checked"))return "idle";
  return "interrupted";
 };
 const ipsRequired=()=>S.gridCode==="it_cei021"&&Boolean(S.ips.required);
 const ipsEntryTone=()=>{
  const overall=ipsOverallStatus();
  if(overall==="offline")return "idle";
  if(overall==="failed")return "danger";
  if(overall==="checking")return "warning";
  if(overall==="passed")return "success";
  if(ipsRequired())return "danger";
  return "idle";
 };
 const startIpsCheck=()=>{
  const overall=ipsOverallStatus();
  if(overall==="offline"||overall==="checking"||S.gridCode!=="it_cei021")return false;
  S.ips.testEnable=1;
  for(const item of IPS_CHECK_ITEMS){
   S.ips.items[item.id]={
    ...S.ips.items[item.id],
    status:"checking",
    measured:null,
    protectionMs:null
   };
  }
  return true;
 };
 const completeIpsCheck=({failIds=[]}={})=>{
  const failed=new Set(failIds);
  for(const item of IPS_CHECK_ITEMS){
   const current=S.ips.items[item.id];
   const passed=!failed.has(item.id)&&!failed.has(Number(item.level));
   S.ips.items[item.id]={
    ...current,
    status:passed?"passed":"failed",
    measured:passed
     ?(item.quantity==="frequency"?50.01:(current.measured??item.measured??null))
     :(current.measured??item.measured??null),
    protectionMs:passed?100:(current.protectionMs??item.protectionMs??null)
   };
  }
  S.ips.testEnable=0;
  S.ips.lastRecord={
   completedAt:Date.now(),
   items:clone(S.ips.items)
  };
  return ipsOverallStatus();
 };
 const interruptIpsCheck=()=>{
  let changed=false;
  for(const item of IPS_CHECK_ITEMS){
   if(S.ips.items[item.id]?.status!=="checking")continue;
   S.ips.items[item.id]={...S.ips.items[item.id],status:"interrupted"};
   changed=true;
  }
  if(changed)S.ips.testEnable=0;
  return changed;
 };
 const applyMpptGroups=groups=>{
  const activeIndices=mpptIndices();
  const assignments=[...S.mppt.groupPoints];
  activeIndices.forEach((index,ordinal)=>{
   assignments[index]=ordinal+1;
  });
  const claimed=new Set();
  for(const group of Array.isArray(groups)?groups:[]){
   const members=[...new Set((group||[]).map(Number))]
    .filter(index=>Number.isInteger(index)&&activeIndices.includes(index))
    .sort((left,right)=>left-right);
   if(members.length!==2||members.some(index=>claimed.has(index)))continue;
   const id=activeIndices.indexOf(members[0])+1;
   assignments[members[0]]=id;
   assignments[members[1]]=id;
   members.forEach(index=>claimed.add(index));
  }
  S.mppt.groupPoints=normalizeMpptGroupPoints(assignments,capabilities.mpptCount);
 };
 const addMpptGroup=members=>{
  const activeIndices=mpptIndices();
  const next=[...new Set((members||[]).map(Number))]
   .filter(index=>Number.isInteger(index)&&activeIndices.includes(index))
   .sort((left,right)=>left-right);
  if(next.length!==2)return false;
  const current=mpptGroups().map(group=>group.members);
  const claimed=new Set(current.flat());
  if(next.some(index=>claimed.has(index)))return false;
  applyMpptGroups([...current,next]);
  return true;
 };
 const removeMpptGroup=id=>{
  applyMpptGroups(mpptGroups().filter(group=>group.id!==id).map(group=>group.members));
 };
 const replaceMpptGroup=(id,members)=>{
  const next=[...new Set((members||[]).map(Number))]
   .filter(index=>Number.isInteger(index)&&mpptIndices().includes(index))
   .sort((left,right)=>left-right);
  if(next.length!==2)return false;
  const claimed=new Set(mpptGroups().filter(group=>group.id!==id).flatMap(group=>group.members));
  if(next.some(index=>claimed.has(index)))return false;
  const otherGroups=mpptGroups()
   .filter(group=>group.id!==id)
   .map(group=>group.members);
  applyMpptGroups([...otherGroups,next]);
  return true;
 };
 loadProfile(S.gridCode);
 normalizeEco();
 normalizeLimitBasis();
 normalizeBattery();
 normalizeMppt();
 normalizeTou();
 normalizeIps();
 regenerateTouDynamic();
 return {
  PN,GRID_PROFILES,S,capabilities,has,hasAll,dev,prof,tfmt,loadProfile,get,set,devCount,devHere,
  unit,spKW,effective,gridSubs,devList,normalizeEco,normalizeLimitBasis,normalizeBattery,
  normalizeMppt,mpptGroups,mpptIndices,applyMpptGroups,addMpptGroup,removeMpptGroup,replaceMpptGroup,
  normalizeIps,ipsItemViews,ipsOverallStatus,ipsRequired,ipsEntryTone,startIpsCheck,completeIpsCheck,interruptIpsCheck,
  normalizeTou,touDay,touPlan,touPrices,touThresholds,touModeAt,touSegmentsForPalette,
  regenerateTouDynamic
 };
}

