// Preview-only fallback ranges. Production must resolve label/unit/min/max/
// step/enum metadata from the backend point definition instead of this table.
const exactRanges=Object.freeze({
 "eco.power":Object.freeze({min:0,max:100,unit:"%"}),
 "dispatch.timeout":Object.freeze({min:0,max:3600,unit:"s"}),
 "features.wdt":Object.freeze({min:1,max:3600,unit:"s"}),
 "limits.feed":Object.freeze({min:0,max:1000,unit:"kW"}),
 "limits.imp":Object.freeze({min:0,max:1000,unit:"kW"}),
 "soc.chgStop":Object.freeze({min:0,max:100,unit:"%"}),
 "soc.gridFloor":Object.freeze({min:0,max:100,unit:"%"}),
 "soc.offFloor":Object.freeze({min:0,max:100,unit:"%"}),
 "net.port":Object.freeze({min:1,max:65535,unit:""}),
 "net.unit":Object.freeze({min:1,max:247,unit:""}),
 "reacQSet":Object.freeze({min:-100,max:100,unit:"%Sn"}),
 "reacPFSet":Object.freeze({min:-1,max:1,unit:""}),
 "g.quEnterP":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.quExitP":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.quMinPF":Object.freeze({min:.1,max:1,unit:""}),
 "g.reacTau":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.lockIn":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.lockOut":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.rcDelay":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.suDelay":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.rampFault":Object.freeze({min:0,max:200,unit:"%Pn/min"}),
 "g.rampStart":Object.freeze({min:0,max:200,unit:"%Pn/min"}),
 "g.rampNorm":Object.freeze({min:0,max:200,unit:"%Pn/min"}),
 "g.ov10":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.ov10t":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.rocof":Object.freeze({min:0,max:20,unit:"Hz/s"}),
 "g.rocoft":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.ofpStart":Object.freeze({min:40,max:70,unit:"Hz"}),
 "g.ofpEnd":Object.freeze({min:40,max:70,unit:"Hz"}),
 "g.ofpDroop":Object.freeze({min:0,max:100,unit:"%Pn/Hz"}),
 "g.ofpDelay":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.ofpExitF":Object.freeze({min:40,max:70,unit:"Hz"}),
 "g.ofpExitT":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.ofpRecover":Object.freeze({min:0,max:200,unit:"%Pn/min"}),
 "g.ufpStart":Object.freeze({min:40,max:70,unit:"Hz"}),
 "g.ufpEnd":Object.freeze({min:40,max:70,unit:"Hz"}),
 "g.ufpDroop":Object.freeze({min:0,max:100,unit:"%Pn/Hz"}),
 "g.ufpDelay":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.ufpExitT":Object.freeze({min:0,max:3600,unit:"s"}),
 "g.ufpRecover":Object.freeze({min:0,max:200,unit:"%Pn/min"}),
 "g.puV1":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.puV2":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.puUV1":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.puUV2":Object.freeze({min:0,max:1000,unit:"V"}),
 "g.puP1":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.puP2":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.puUP1":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.puUP2":Object.freeze({min:0,max:100,unit:"%Pn"}),
 "g.puTau":Object.freeze({min:0,max:3600,unit:"s"})
});

const voltageStage=/^g\.(?:ov|uv|lv|hv)\d+$/;
const frequencyStage=/^g\.(?:of|uf)\d+$/;
const stageTime=/^g\.(?:ov|uv|of|uf|lv|hv)\d+t$/;
const curveVoltage=/^g\.(?:quV|upfV)\d+$/;
const curveReactive=/^g\.(?:quQ|P_Q_Discharge_Q)\d+$/;
const curveActive=/^g\.(?:cpP|P_Q_Discharge_P)\d+$/;
const curvePowerFactor=/^g\.(?:cpF|upfF)\d+$/;

export function settingRange(path,unit=""){
 const exact=exactRanges[path];
 if(exact)return {...exact,unit:exact.unit||unit||""};
 if(stageTime.test(path))return {min:0,max:3600,unit:"s"};
 if(voltageStage.test(path)||curveVoltage.test(path))return {min:0,max:1000,unit:"V"};
 if(frequencyStage.test(path))return {min:40,max:70,unit:"Hz"};
 if(curveReactive.test(path))return {min:-100,max:100,unit:"%Sn"};
 if(curveActive.test(path))return {min:0,max:100,unit:"%Pn"};
 if(curvePowerFactor.test(path))return {min:-1,max:1,unit:""};
 if(path==="dispatch.sp")return unit==="kW"?{min:-1000,max:1000,unit:"kW"}:{min:-100,max:100,unit:"%Pn"};
 if(path==="g.rcVmax"||path==="g.rcVmin"||path==="g.suVmax"||path==="g.suVmin")return {min:0,max:1000,unit:"V"};
 if(path==="g.rcFmax"||path==="g.rcFmin"||path==="g.suFmax"||path==="g.suFmin")return {min:40,max:70,unit:"Hz"};
 if(unit==="s")return {min:0,max:3600,unit};
 if(unit==="V")return {min:0,max:1000,unit};
 if(unit==="Hz")return {min:40,max:70,unit};
 if(unit==="Hz/s")return {min:0,max:20,unit};
 if(unit==="%Pn/min")return {min:0,max:200,unit};
 if(unit==="%Pn/Hz")return {min:0,max:100,unit};
 if(unit==="%Sn")return {min:-100,max:100,unit};
 if(unit==="%Pn"||unit==="%")return {min:0,max:100,unit};
 if(unit==="kW")return {min:-1000,max:1000,unit};
 return {min:-999999,max:999999,unit:unit||""};
}

export function settingRangeMessage(range){
 const value=number=>Number.isInteger(number)?String(number):String(Number(number.toFixed(2))).replace(/^0\./,".");
 const unit=range.unit==="%"?"%":range.unit?` ${range.unit}`:"";
 return `Enter a value from ${value(range.min)} to ${value(range.max)}${unit}.`;
}
