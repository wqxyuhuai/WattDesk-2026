export const PLANT_SECTIONS=Object.freeze({
 faults:{label:"Fault & warning",description:"Detailed fault history will be added in a later preview pass."},
 logs:{label:"System log",description:"The full system log will be added in a later preview pass."},
 tickets:{label:"Service tickets",description:"The plant service-ticket list will be added in a later preview pass."}
});

const PLANT_TAB_SECTIONS=new Set(["devices"]);

export function isPlantSection(value){
 return Object.prototype.hasOwnProperty.call(PLANT_SECTIONS,value)||PLANT_TAB_SECTIONS.has(value);
}

export function isPlantTab(value){
 return value==="site";
}
