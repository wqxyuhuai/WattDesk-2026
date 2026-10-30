const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const RELATIVE_TIME_WINDOW = 7 * DAY;

function asDate(value){
  const date=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(Number.isNaN(date.getTime()))throw new Error(`Invalid timestamp: ${String(value)}`);
  return date;
}

function plural(value,unit){
  return `${value} ${unit}${value===1?"":"s"} ago`;
}

export function formatAbsoluteTime(value){
  const date=asDate(value);
  const pad=part=>String(part).padStart(2,"0");
  return `${date.getFullYear()}/${pad(date.getMonth()+1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateFromAgeMinutes(minutes,{now=Date.now()}={}){
  const value=Number(minutes);
  return new Date(Number(now)-(Number.isFinite(value)?Math.max(0,value):0)*MINUTE);
}

export function formatTimestamp(value,{
  now=Date.now(),
  absoluteAfter=RELATIVE_TIME_WINDOW
}={}){
  const date=asDate(value);
  const elapsed=Math.max(0,Number(now)-date.getTime());
  if(elapsed<10*SECOND)return "Just now";
  if(elapsed<MINUTE)return plural(Math.floor(elapsed/SECOND),"second");
  if(elapsed<HOUR)return plural(Math.floor(elapsed/MINUTE),"minute");
  if(elapsed<DAY)return plural(Math.floor(elapsed/HOUR),"hour");
  if(elapsed<absoluteAfter)return plural(Math.floor(elapsed/DAY),"day");
  return formatAbsoluteTime(date);
}

export function formatAgeMinutes(minutes,{now=Date.now(),absoluteAfter=RELATIVE_TIME_WINDOW}={}){
  return formatTimestamp(dateFromAgeMinutes(minutes,{now}),{now,absoluteAfter});
}
