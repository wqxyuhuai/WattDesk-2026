import {createTextElement} from "../foundations/dom.js";
import {
  dateFromAgeMinutes,
  formatAbsoluteTime,
  formatClockTime,
  formatTimestamp
} from "../foundations/time.js";

// One semantic <time> node for every visible product timestamp. Callers can
// pass either a real Date/string or age in minutes; ordering should continue to
// use the original numeric value rather than this formatted label.
export function createTimeLabel(value,{
  ageMinutes=false,
  className="",
  typeStyle,
  clock=false,
  now=Date.now()
}={}){
  const date=ageMinutes?dateFromAgeMinutes(value,{now}):value instanceof Date?value:new Date(value);
  const label=clock?formatClockTime(date):formatTimestamp(date,{now});
  const node=createTextElement("time",className,label,typeStyle);
  node.dateTime=date.toISOString();
  node.title=formatAbsoluteTime(date);
  return node;
}
