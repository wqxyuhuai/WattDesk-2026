// Preview option catalogs. Production labels/enums should ultimately come from
// backend point metadata while preserving the stored numeric values.
export const CAPABILITY_OPTIONS=Object.freeze(["Rated","Overload","Underload"]);
export const DISPATCH_MODE_OPTIONS=Object.freeze(["%Pn","kW"]);
export const DRM_SET_VALUES=Object.freeze({
 0:"Off",
 1:"DRM",
 2:"RCR"
});
export const DI_PORT_OPTIONS=Object.freeze(Object.values(DRM_SET_VALUES));
export const NETWORK_INTERFACE_OPTIONS=Object.freeze(["LAN","Wi-Fi","4G"]);
export const EXPORT_FORMAT_OPTIONS=Object.freeze(["PDF","XLSX"]);
export const BATTERY_BRAND_OPTIONS=Object.freeze(["Wattsonic"]);
export const BATTERY_PROTOCOL_OPTIONS=Object.freeze(["Wattsonic"]);
export const LIMIT_BASIS_OPTIONS=Object.freeze(["Total","Per phase"]);
export const IMPORT_PERMISSION_OPTIONS=Object.freeze([
 Object.freeze({value:1,label:"Charge From Grid Allowed"}),
 Object.freeze({value:0,label:"Forbidden Grid Charge"})
]);
export const EXPORT_PERMISSION_OPTIONS=Object.freeze([
 Object.freeze({value:"solar_battery",label:"Solar and Battery"}),
 Object.freeze({value:"solar_only",label:"Solar Only"}),
 Object.freeze({value:"non_export",label:"Permanent Non Export"})
]);
export const MPPT_SOURCE_OPTIONS=Object.freeze(["Solar","Wind","None"]);
export const CT_CURRENT_MODE_OPTIONS=Object.freeze(["Meter Current","CT Current"]);
export const POWER_CHANGE_OPTIONS=Object.freeze(["Step","Ramp"]);
export const IPS_CHECK_ITEMS=Object.freeze([
 Object.freeze({
  id:"overF1",
  code:"81>.S1",
  description:"Level 1 Overfrequency",
  statusPoint:"OverF1Status",
  rangePoint:"OverF1_Range",
  timePoint:"OverF1_Time",
  measuredPoint:"Grid_Frequency",
  quantity:"frequency",
  level:1,
  range:50.2,
  time:0.1,
  measured:null,
  protectionMs:null
 }),
 Object.freeze({
  id:"underF1",
  code:"81<.S1",
  description:"Level 1 Underfrequency",
  statusPoint:"UnderF1Status",
  rangePoint:"UnderF1_Range",
  timePoint:"UnderF1_Time",
  measuredPoint:"Grid_Frequency",
  quantity:"frequency",
  level:1,
  range:49.8,
  time:0.1,
  measured:null,
  protectionMs:null
 }),
 Object.freeze({
  id:"overV1",
  code:"59.S1",
  description:"Level 1 Overvoltage",
  statusPoint:"OverV1Status",
  rangePoint:"OverV1_Range",
  alternateRangePoint:"OverV_10min_Value",
  timePoint:"OverV1_Time",
  alternateTimePoint:"60000+OverV_10min_Time",
  measuredPoint:"Grid_Voltage_A",
  quantity:"voltage",
  level:1,
  range:253,
  time:3,
  measured:230.1,
  protectionMs:603000
 }),
 Object.freeze({
  id:"underV1",
  code:"27.S1",
  description:"Level 1 Undervoltage",
  statusPoint:"UnderV1Status",
  rangePoint:"UnderV1_Range",
  timePoint:"UnderV1_Time",
  measuredPoint:"Grid_Voltage_A",
  quantity:"voltage",
  level:1,
  range:195.5,
  time:1.5,
  measured:230.3,
  protectionMs:1500
 }),
 Object.freeze({
  id:"overF2",
  code:"81>.S2",
  description:"Level 2 Overfrequency",
  statusPoint:"OverF2Status",
  rangePoint:"OverF2_Range",
  timePoint:"OverF2_Time",
  measuredPoint:"Grid_Frequency",
  quantity:"frequency",
  level:2,
  range:51.5,
  time:0.1,
  measured:null,
  protectionMs:null
 }),
 Object.freeze({
  id:"underF2",
  code:"81<.S2",
  description:"Level 2 Underfrequency",
  statusPoint:"UnderF2Status",
  rangePoint:"UnderF2_Range",
  timePoint:"UnderF2_Time",
  measuredPoint:"Grid_Frequency",
  quantity:"frequency",
  level:2,
  range:47.5,
  time:0.1,
  measured:null,
  protectionMs:null
 }),
 Object.freeze({
  id:"overV2",
  code:"59.S2",
  description:"Level 2 Overvoltage",
  statusPoint:"OverV2Status",
  rangePoint:"OverV2_Range",
  timePoint:"OverV2_Time",
  measuredPoint:"Grid_Voltage_A",
  quantity:"voltage",
  level:2,
  range:264.5,
  time:0.2,
  measured:230.1,
  protectionMs:200
 }),
 Object.freeze({
  id:"underV2",
  code:"27.S2",
  description:"Level 2 Undervoltage",
  statusPoint:"UnderV2Status",
  rangePoint:"UnderV2_Range",
  timePoint:"UnderV2_Time",
  measuredPoint:"Grid_Voltage_A",
  quantity:"voltage",
  level:2,
  range:34.5,
  time:0.2,
  measured:230.2,
  protectionMs:200
 })
]);
export const IPS_CHECK_POINTS=Object.freeze({
 certificationStandard:"Certification_Standard",
 selfCheckRequired:"IPS_Selfcheck_Require",
 startCheck:"Italy_SelfTest_Enable",
 startCheckLegacyAlias:"ltaly_SelfTest_Enable",
 overall:"derived-from-item-status"
});
export const F_P_REFERENCE_OPTIONS=Object.freeze([
 "Rated power",
 "Power at the time of the event"
]);
export const REACTIVE_LIMIT_OPTIONS=Object.freeze([
 "None",
 "Power lock-in / lock-out",
 "Minimum cos φ",
 "Both"
]);
export const P_U_MODE_OPTIONS=Object.freeze([
 "Off",
 "Overvoltage only",
 "Undervoltage only",
 "Both"
]);
export const MPPT_SCAN_INTERVAL_OPTIONS=Object.freeze([
 Object.freeze({minutes:5,label:"5 mins"}),
 Object.freeze({minutes:15,label:"15 mins"}),
 Object.freeze({minutes:30,label:"30 mins"}),
 Object.freeze({minutes:60,label:"1 h"})
]);
export const REACTIVE_MODE_OPTIONS=Object.freeze([
 "Off",
 "Fixed Q",
 "Fixed cos φ",
 "Q(U)",
 "cos φ(P)",
 "Q(P)",
 "cos φ(U)"
].map((label,value)=>Object.freeze({value,label})));
export const RIDE_THROUGH_PRIORITY_OPTIONS=Object.freeze([
 "Zero current",
 "Reactive priority",
 "Active priority"
].map((label,value)=>Object.freeze({value,label})));

export const SETTINGS_POINT_CONTRACTS=Object.freeze({
 dispatchEnable:Object.freeze({point:"ActivePower_Dispatch_Enable",access:"rw",path:"dispatch.on",dataType:"boolean"}),
 dispatchMode:Object.freeze({
  point:"ActivePower_Dispatch_Mode",
  access:"rw",
  path:"dispatch.unit",
  values:DISPATCH_MODE_OPTIONS
 }),
 dispatchSetpoint:Object.freeze({point:"ActivePower_Dispatch_Setpoint",access:"rw",path:"dispatch.sp",unit:"kW-or-%Pn"}),
 dispatchTimeout:Object.freeze({point:"ActivePower_Dispatch_Timeout",access:"rw",path:"dispatch.timeout",unit:"s"}),
 outputCapabilityMode:Object.freeze({
  point:"Output_Capability_Mode",
  access:"rw",
  path:"capability",
  options:CAPABILITY_OPTIONS,
  availability:"pending-firmware"
 }),
 diPort:Object.freeze({
  point:"DRM_SET",
  access:"rw",
  path:"di",
  values:DRM_SET_VALUES
 }),
 effectiveLimit:Object.freeze({point:"ActivePower_Effective_Limit",access:"ro",path:"telemetry.effective.limit",unit:"kW"}),
 effectiveLimitSource:Object.freeze({point:"ActivePower_Limit_Source",access:"ro",path:"telemetry.effective.source",values:"backend-meta"}),
 effectivePvCurtailed:Object.freeze({point:"ActivePower_PV_Curtailed",access:"ro",path:"telemetry.effective.pvCurtailed",unit:"kW"})
});

export const TOU_PERIOD_MODES=Object.freeze([
 Object.freeze({value:0,label:"General Mode",className:"general",batteryPower:false,pvForbidden:false}),
 Object.freeze({value:1,label:"Grid Injection",className:"grid-injection",batteryPower:false,pvForbidden:false}),
 Object.freeze({value:2,label:"PV Charging",className:"pv-charging",batteryPower:true,pvForbidden:false}),
 Object.freeze({value:3,label:"Battery Charge",className:"battery-charge",batteryPower:true,pvForbidden:true}),
 Object.freeze({value:4,label:"Battery Discharge",className:"battery-discharge",batteryPower:true,pvForbidden:false}),
 Object.freeze({value:5,label:"Peak Shifting",className:"peak-shifting",batteryPower:false,pvForbidden:false})
]);

export const TOU_CONTROL_MODES=Object.freeze([
 Object.freeze({value:0,label:"Manual Mode",description:"Users manually set operation modes and time schedules.",menuDescription:"Set modes and time ranges manually."}),
 Object.freeze({value:1,label:"Duration Control",description:"Charge and discharge are scheduled based on the duration of high and low price periods.",menuDescription:"Schedule by high and low price duration."}),
 Object.freeze({value:2,label:"Percentage Control",description:"Charging and discharging are triggered when prices reach preset percentage levels of the daily price range.",menuDescription:"Trigger by daily price-range percentages."}),
 Object.freeze({value:3,label:"Fixed Price Control",description:"Charge or discharge is triggered when electricity prices cross fixed price thresholds.",menuDescription:"Trigger at fixed price thresholds."}),
 Object.freeze({value:4,label:"Intelligent Mode",description:"Predicts consumption habits and intelligently provides optimized energy plans.",menuDescription:"Cloud-optimized from usage habits."})
]);

export const TOU_INTERVAL_OPTIONS=Object.freeze([
 Object.freeze({minutes:15,label:"15 mins"}),
 Object.freeze({minutes:30,label:"30 mins"}),
 Object.freeze({minutes:60,label:"1 h"})
]);

export const TOU_COUNTRY_OPTIONS=Object.freeze(["Germany","Sweden","Netherlands","Austria"]);
export const TOU_AREA_OPTIONS=Object.freeze(["DE-LU","SE1","SE2","SE3","SE4","NL","AT"]);
export const TOU_TIMEZONE_OPTIONS=Object.freeze([
 "Europe/Berlin",
 "Europe/Stockholm",
 "Europe/Amsterdam",
 "Europe/Vienna"
]);
export const TOU_CURRENCY_OPTIONS=Object.freeze(["EUR","SEK"]);
