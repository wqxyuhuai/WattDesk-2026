import {GRID_PROFILES} from "./grid-profiles.js";

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
].map(([label,icon,summary,flow,description])=>Object.freeze({label,compactLabel:label.replace(/ Mode$/i,""),icon,summary,flow,description})));

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

const clone=value=>value===null||value===undefined?value:JSON.parse(JSON.stringify(value));

function initialState(){
 return {
  page:"dispatch",gridSub:"code",gridOpen:false,unlocked:false,
  navExpanded:{},
  runMode:0,
  dispatch:{on:1,unit:1,sp:-10,timeout:300},
  limits:{feedOn:1,feed:10,impOn:0,imp:15,basis:0},
  capability:0,di:2,
  soc:{chgStop:100,gridFloor:20,offFloor:10},
  battChgMax:6.0,battDisMax:20.0,pvAvail:4.8,
  features:{watchdog:1,wdt:300,offgrid:1,unbalanced:0,heating:1,light:1,buzzer:0},
  eco:[
   {id:"eco-1",from:"00:00",to:"06:00",mode:"charge_pv_grid",powerPct:100},
   {id:"eco-2",from:"17:00",to:"21:00",mode:"discharge",powerPct:90}
  ],
  net:{iface:0,dhcp:1,modbus:1,port:502,unit:1},
  mppt:{pv:[0,0,0,2],parallel:0,scan:1,interval:30,lastScanMinutesAgo:18},
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
     {parameter:"Charge cut-off SOC",from:"95.0 %",to:"100.0 %"},
     {parameter:"Off-grid discharge floor",from:"10.0 %",to:"15.0 %"}
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
 supportsPerPhaseLimit=false
}={}){
 const S=initialState();
 const PN=Number.isFinite(Number(ratedPower))&&Number(ratedPower)>0?Number(ratedPower):50;
 const capabilities=Object.freeze({
  phaseCount:Number(phaseCount)===3?3:1,
  supportsPerPhaseLimit:Boolean(supportsPerPhaseLimit)
 });
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
  const sp=spKW();
  const feed=S.limits.feedOn?S.limits.feed:PN;
  let out=sp,src="";
  if(sp>0){
   if(sp>feed){out=feed;src="Export limit";}
   if(out>S.battDisMax+S.pvAvail){out=S.battDisMax+S.pvAvail;src="Battery power capability";}
  }else if(sp<0){
   if(Math.abs(sp)>S.battChgMax){out=-S.battChgMax;src="Battery power capability";}
   if(S.limits.impOn&&Math.abs(out)>S.limits.imp){out=-S.limits.imp;src="Import limit";}
  }
  return {sp,out,src,feed,curtail:sp<0?S.pvAvail:0};
 };
 const gridSubs=()=>{
  const list=[["code","Grid Code",""]];
  if(!prof().p)return list;
  list.push(["prot","Protection Limits",""],["conn","Grid Connection",""]);
  list.push(["reac","Reactive Power",""]);
  if(hasAll("puV1","puV2"))list.push(["pu","P(U) Characteristics",""]);
  if(has("ofpStart")||has("ufpStart"))list.push(["fp","Frequency-Watt (F-P)",""]);
  if(has("lv1")||has("lvrtOn")||has("lvZero")||has("lvrtPm"))list.push(["lvrt","LVRT",""]);
  if(has("hv1")||has("hvrtOn")||has("hvZero")||has("hvrtPm"))list.push(["hvrt","HVRT",""]);
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
 loadProfile(S.gridCode);
 normalizeEco();
 normalizeLimitBasis();
 return {
  PN,GRID_PROFILES,S,capabilities,has,hasAll,dev,prof,tfmt,loadProfile,get,set,devCount,devHere,
  unit,spKW,effective,gridSubs,devList,normalizeEco,normalizeLimitBasis
 };
}

