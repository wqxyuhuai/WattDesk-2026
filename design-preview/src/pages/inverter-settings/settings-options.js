// Preview option catalogs. Production labels/enums should ultimately come from
// backend point metadata while preserving the stored numeric values.
export const CAPABILITY_OPTIONS=Object.freeze(["Rated","Overload","Underload"]);
export const DI_PORT_OPTIONS=Object.freeze(["Off","DRM","RCR"]);
export const NETWORK_INTERFACE_OPTIONS=Object.freeze(["LAN","Wi-Fi","4G"]);
export const EXPORT_FORMAT_OPTIONS=Object.freeze(["PDF","XLSX"]);
export const LIMIT_BASIS_OPTIONS=Object.freeze(["Total","Per phase"]);
export const MPPT_SOURCE_OPTIONS=Object.freeze(["Solar","Wind","None"]);
export const POWER_CHANGE_OPTIONS=Object.freeze(["Step","Ramp"]);
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
