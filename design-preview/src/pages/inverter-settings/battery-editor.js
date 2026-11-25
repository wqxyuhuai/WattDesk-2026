import {
 BATTERY_BRAND_OPTIONS,
 BATTERY_PROTOCOL_OPTIONS
} from "./settings-options.js";

export function batteryEntries(model){
 const battery=model.S.battery;
 const parallel=model.capabilities.batteryPathCount===2
  &&model.capabilities.supportsBatteryParallel
  &&battery.parallel;
 if(parallel||model.capabilities.batteryPathCount===1){
  return [{key:"common",label:"Battery",data:battery.common}];
 }
 return [
  {key:"bank1",label:"Battery #1",data:battery.bank1},
  {key:"bank2",label:"Battery #2",data:battery.bank2}
 ];
}

export function batteryConfigurationFields(entry){
 const path=`battery.${entry.key}`;
 return [
  Object.freeze({
   id:"brand",
   label:"Battery Brand",
   hint:"Battery model paired with this input",
   path:`${path}.brand`,
   kind:"select",
   value:entry.data.brand||BATTERY_BRAND_OPTIONS[0],
   options:BATTERY_BRAND_OPTIONS.map(value=>({value,label:value}))
  }),
  Object.freeze({
   id:"enabled",
   label:"BMS Communication",
   hint:"Enable BMS communication for this battery input",
   path:`${path}.enabled`,
   kind:"switch",
   value:Number(entry.data.enabled)!==0
  }),
  Object.freeze({
   id:"protocol",
   label:"Battery Protocol",
   hint:entry.data.enabled?"Communication protocol used by this battery input":"BMS communication is disabled for this input",
   path:`${path}.protocol`,
   kind:"select",
   value:entry.data.protocol||BATTERY_PROTOCOL_OPTIONS[0],
   options:BATTERY_PROTOCOL_OPTIONS.map(value=>({
    value,
    label:value,
    disabled:!entry.data.enabled
   }))
  }),
  Object.freeze({
   id:"chargeMax",
   label:"Max. Charge Current",
   hint:"Upper charging current accepted by this battery input",
   path:`${path}.chargeMax`,
   kind:"number",
   value:entry.data.chargeMax,
   unit:"A"
  }),
  Object.freeze({
   id:"dischargeMax",
   label:"Max. Discharge Current",
   hint:"Upper discharge current supplied by this battery input",
   path:`${path}.dischargeMax`,
   kind:"number",
   value:entry.data.dischargeMax,
   unit:"A"
  })
 ];
}

export function batteryValidationError(banks){
 for(const bank of banks){
  for(const field of ["chargeMax","dischargeMax"]){
   const value=Number(bank[field]);
   if(!Number.isFinite(value)||value<0||value>1000){
    return field==="chargeMax"
     ?"Enter a valid maximum charge current between 0 and 1000 A."
     :"Enter a valid maximum discharge current between 0 and 1000 A.";
   }
  }
  if(bank.enabled&&!bank.protocol)return "Select a battery protocol for every enabled battery input.";
 }
 return "";
}
