import {timeToMinutes} from "./settings-model.js";

export const SCHEDULE_MAX_PERIODS=24;
export const SCHEDULE_MIN_DURATION=5;

export function sortSchedulePeriods(periods,{draftLast=()=>false}={}){
 return periods.sort((left,right)=>{
  const draft=Number(Boolean(draftLast(left)))-Number(Boolean(draftLast(right)));
  if(draft)return draft;
  const leftStart=timeToMinutes(left.from);
  const rightStart=timeToMinutes(right.from);
  return (leftStart??Number.MAX_SAFE_INTEGER)-(rightStart??Number.MAX_SAFE_INTEGER);
 });
}

export function validateScheduleRange(period,from,to,periods,{minDuration=SCHEDULE_MIN_DURATION,stepMinutes=null}={}){
 const start=timeToMinutes(from);
 const end=timeToMinutes(to);
 if(start===null||end===null||end<=start){
  return {valid:false,message:"End time must be later than start time."};
 }
 if(end-start<minDuration){
  return {valid:false,message:`Each schedule period must be at least ${minDuration} minutes long.`};
 }
 if(stepMinutes&&(start%stepMinutes!==0||end%stepMinutes!==0)){
  return {valid:false,message:`Times must align to the selected ${stepMinutes}-minute interval.`};
 }
 const overlap=periods.some(other=>{
  if(other===period)return false;
  const otherStart=timeToMinutes(other.from);
  const otherEnd=timeToMinutes(other.to);
  return otherStart!==null&&otherEnd!==null&&start<otherEnd&&otherStart<end;
 });
 return overlap
  ?{valid:false,message:"Time ranges cannot overlap."}
  :{valid:true,message:""};
}

export function validateSchedulePeriods(periods,{
 minDuration=SCHEDULE_MIN_DURATION,
 maxPeriods=SCHEDULE_MAX_PERIODS,
 validatePeriod=null
}={}){
 if(!Array.isArray(periods)||!periods.length){
  return {valid:false,periodId:"__empty__",message:"Add at least one schedule period."};
 }
 if(periods.length>maxPeriods){
  return {valid:false,periodId:null,message:`Add no more than ${maxPeriods} schedule periods.`};
 }
 const ranges=[];
 for(const period of periods){
  const start=timeToMinutes(period.from);
  const end=timeToMinutes(period.to);
  if(start===null||end===null||end<=start){
   return {valid:false,periodId:period.id,message:"Every schedule period needs a valid time range."};
  }
  if(end-start<minDuration){
   return {valid:false,periodId:period.id,message:`Each schedule period must be at least ${minDuration} minutes long.`};
  }
  if(validatePeriod){
   const message=validatePeriod(period);
   if(message)return {valid:false,periodId:period.id,message};
  }
  ranges.push({id:period.id,start,end});
 }
 ranges.sort((left,right)=>left.start-right.start);
 for(let index=1;index<ranges.length;index+=1){
  if(ranges[index].start<ranges[index-1].end){
   return {valid:false,periodId:ranges[index].id,message:"Schedule periods cannot overlap."};
  }
 }
 return {valid:true,periodId:null,message:""};
}

export function scheduleSegments(periods,{modeFor}={}){
 return periods.flatMap(period=>{
  const start=timeToMinutes(period.from);
  const end=timeToMinutes(period.to);
  if(start===null||end===null||end<=start)return [];
  return [{
   period,
   start,
   end,
   left:start/1440*100,
   width:(end-start)/1440*100,
   mode:modeFor?modeFor(period):null
  }];
 });
}

export function requiresBatteryExportConfirmation({
 previous,
 next,
 runMode,
 economicPeriods=[]
}){
 return Number(runMode)===2
  &&String(previous)==="solar_battery"
  &&String(next)!=="solar_battery"
  &&Array.isArray(economicPeriods)
  &&economicPeriods.some(period=>period.mode==="discharge");
}
