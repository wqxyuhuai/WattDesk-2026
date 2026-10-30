import {createTextElement} from "../foundations/dom.js";
import {
  dateFromAgeMinutes,
  formatAbsoluteTime,
  formatTimestamp
} from "../foundations/time.js";

// One semantic <time> node for every visible product timestamp. Callers can
// pass either a real Date/string or age in minutes; ordering should continue to
// use the original numeric value rather than this formatted label.
export function createTimeLabel(value,{
  ageMinutes=false,
  className="",
  typeStyle,
  now=Date.now()
}={}){
  const date=ageMinutes?dateFromAgeMinutes(value,{now}):value instanceof Date?value:new Date(value);
  const node=createTextElement("time",className,formatTimestamp(date,{now}),typeStyle);
  node.dateTime=date.toISOString();
  node.title=formatAbsoluteTime(date);
  return node;
}
