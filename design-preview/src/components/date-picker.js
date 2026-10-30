// Semantic date chooser for the Home preview. It owns draft range state only;
// data queries remain a preview concern. Source: Figma 14750:5606.
import {reducedMotion,motionDuration,motionEasing} from "../foundations/motion.js";
import {applyTypeStyle} from "../foundations/typography.js";
import {opaqueMaskURL} from "./icons.js";

const PRESETS=["Today","Yesterday","Last 24 hours","Last 7 days","Last 30 days","This month","Custom range"];
const WEEKDAYS=["M","T","W","T","F","S","S"];
const NOW={year:2026,month:9,day:10,hour:14,minute:32};
const fmt=(date,time="00:00")=>`${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,"0")}/${String(date.getDate()).padStart(2,"0")} ${time}`;
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const startOfDay=date=>new Date(date.getFullYear(),date.getMonth(),date.getDate());
const pad2=value=>String(value).padStart(2,"0");
const timeOfDay=date=>`${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
const hasExplicitTime=value=>/\d{1,2}:\d{2}/.test(String(value??""));
export function parseDateInput(value){
  const text=String(value??"").trim();
  if(!text)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(text)){
   const [year,month,day]=text.split("-").map(Number),date=new Date(year,month-1,day);
   return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
  }
  const dateParts=text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if(dateParts){
   const [,yearText,monthText,dayText,hourText="00",minuteText="00"]=dateParts;
   const year=Number(yearText),month=Number(monthText),day=Number(dayText),hour=Number(hourText),minute=Number(minuteText);
   if(hour>23||minute>59)return null;
   const date=new Date(year,month-1,day,hour,minute);
   return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
  }
  const parsed=new Date(text);
  return Number.isNaN(parsed.getTime())?null:parsed;
}
export function formatDateInput(date,key){
 if(!date)return "";
 // A calendar day chosen as an endpoint keeps the day's full extent. Showing
 // midnight on the end date reads as "up to 00:00" and silently drops the day.
 const time=key==="end"&&date.getHours()===23&&date.getMinutes()===59?"23:59":timeOfDay(date);
 return fmt(date,time);
}
function parseDateField(value,key){
 const date=parseDateInput(value);
 if(!date||hasExplicitTime(value))return date;
 // A plain day in an endpoint means that whole day. The end input must not
 // silently become midnight and exclude the date the user just typed.
 return key==="end"?new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59):startOfDay(date);
}
function rangeIntent(start,end,previousPreset){
 if(previousPreset&&previousPreset!=="Custom range")return previousPreset;
 return matchesPreset(start,end,start)||"Custom range";
}
export function presetRange(label,now){return buildPreset(label,startOfDay(now),now)}
export function describeRange(range){
 if(range?.preset)return range.preset;
 return "Custom range";
}
function buildPreset(label,now,nowExact=now){
 const day=24*60*60*1000;
 switch(label){
  case "Today":return {start:new Date(now),end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59),preset:label};
  case "Yesterday":return {start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-1),end:new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,23,59,59),preset:label};
  case "Last 24 hours":return {start:new Date(nowExact.getTime()-day),end:new Date(nowExact),preset:label};
  case "Last 7 days":return {start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-6),end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59),preset:label};
  case "Last 30 days":return {start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-29),end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59),preset:label};
  case "This month":return {start:new Date(now.getFullYear(),now.getMonth(),1),end:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59),preset:label};
  default:return null;
 }
}
function sameMonth(date,other){return date&&other&&date.getFullYear()===other.getFullYear()&&date.getMonth()===other.getMonth()}
function sameDay(date,other){return date&&other&&date.getFullYear()===other.getFullYear()&&date.getMonth()===other.getMonth()&&date.getDate()===other.getDate()}
function matchesPreset(start,end,now){for(const label of PRESETS.slice(0,-1)){const range=buildPreset(label,startOfDay(now),now);if(range&&Math.floor(range.start.getTime()/60000)===Math.floor(start.getTime()/60000)&&Math.floor(range.end.getTime()/60000)===Math.floor(end.getTime()/60000))return label}return null}
function button(label,className=""){const el=document.createElement("button");el.type="button";el.className=className;el.textContent=label;return el}

export function createDatePicker(options){
 const {trigger,glass,registerPanel,close,now=NOW,onApply,range:initialRange}=options;
 const panel=document.createElement("div");panel.className="wd-date-picker wd-glass--surface wd-glass-popup";
 // The material is a sibling of the content, never a fading ancestor: keeping
 // the tint opaque until removal avoids an unblurred frame during open/close.
 const content=document.createElement("div");content.className="wd-date-picker-content";panel._wdFade=content;
 const main=document.createElement("div");main.className="wd-date-picker-main";
 const quick=document.createElement("div");quick.className="wd-date-quick";quick.setAttribute("role","group");quick.setAttribute("aria-label","Quick ranges");
 const divider=document.createElement("span");divider.className="wd-date-divider";divider.setAttribute("aria-hidden","true");
 const calendarWrap=document.createElement("div");calendarWrap.className="wd-date-calendar-wrap";
 const calendar=document.createElement("div");calendar.className="wd-date-calendar";
 const head=document.createElement("div");head.className="wd-date-calendar-head";
 const monthLabel=document.createElement("div");monthLabel.className="wd-date-month";monthLabel.setAttribute("aria-live","polite");
 // The month heading uses the authored 14/14 medium style, matching the source
 // rather than a font size guessed from the rendered panel.
 applyTypeStyle(monthLabel,"14/14 medium");
 const monthText=document.createElement("span");monthText.className="wd-date-month-text";monthLabel.append(monthText);
 const nav=document.createElement("div");nav.className="wd-date-nav";
 const days=document.createElement("div");days.className="wd-date-days";
 const dayNames=document.createElement("div");dayNames.className="wd-date-grid";
 const datesViewport=document.createElement("div");datesViewport.className="wd-date-dates-viewport";
 const grid=document.createElement("div");grid.className="wd-date-dates";grid.setAttribute("role","group");grid.setAttribute("aria-label","Calendar dates");
 const inputs=document.createElement("div");inputs.className="wd-date-inputs";
 const ruleOne=document.createElement("div");ruleOne.className="wd-date-rule";ruleOne.setAttribute("aria-hidden","true");
 const ruleTwo=document.createElement("div");ruleTwo.className="wd-date-rule";ruleTwo.setAttribute("aria-hidden","true");
 const footer=document.createElement("div");footer.className="wd-date-footer";
 const actions=document.createElement("div");actions.className="wd-date-actions";
 // The reason lives with the fields it describes: under the two controls and
 // above the divider that closes the section, never beside the actions.
 const message=document.createElement("div");message.className="wd-date-message";
 const status=document.createElement("p");status.className="wd-date-error";status.id="wd-date-error";status.setAttribute("role","alert");status.hidden=true;
 message.append(status);

 const nowDate=new Date(now.year,now.month,now.day,now.hour,now.minute);
 const defaultRange=initialRange?{start:new Date(initialRange.start),end:new Date(initialRange.end),preset:initialRange.preset||"Custom range"}:buildPreset("Last 7 days",startOfDay(nowDate),nowDate);
 let draft={...defaultRange},visibleMonth=new Date(draft.start.getFullYear(),draft.start.getMonth(),1),monthMotion=null,rangeAnchor=false,pendingFocus=null;
 const presetButtons=new Map(),dateButtons=new Map();
 let startField,endField,cancel,apply,monthPrevious,monthNext;

 function arrowIcon(file){const icon=document.createElement("span");icon.className="wd-date-icon";icon.style.setProperty("--date-icon",`url("${opaqueMaskURL(file)}")`);icon.setAttribute("aria-hidden","true");return icon}
 function glassHost(host,radius){host.classList.add("wd-glass");glass.addSurface({host,radius});return host}
 function makeNav(file,label){
  const el=button("","wd-date-nav-button");el.append(arrowIcon(file));el.setAttribute("aria-label",label);glassHost(el,18);return el;
 }
 monthPrevious=makeNav("date-arrow-left.svg","Previous month");monthNext=makeNav("date-arrow-right.svg","Next month");
 nav.append(monthPrevious,monthNext);head.append(monthLabel,nav);
 for(const label of WEEKDAYS){const cell=document.createElement("div");cell.className="wd-date-weekday";cell.textContent=label;dayNames.append(cell);}
 // Align the month heading with the first weekday glyph. The cell is 30px wide
 // but "M" is centred inside it, so its own left inset is measured instead of
 // assuming half the cell. The binding survives font loading and resize.
 const alignMonth=()=>{
  const cell=dayNames.firstElementChild;
  if(!cell)return;
  const range=document.createRange();range.selectNodeContents(cell);
  const glyph=range.getBoundingClientRect(),cellBox=cell.getBoundingClientRect();
  if(!glyph.width)return;
  monthLabel.style.marginLeft=`${Math.max(0,glyph.left-cellBox.left)}px`;
 };
 alignMonth();
 document.fonts?.ready.then(()=>{alignMonth();window.requestAnimationFrame(alignMonth);});
 datesViewport.append(grid);days.append(dayNames,datesViewport);calendar.append(head,days);calendarWrap.append(calendar);main.append(quick,divider,calendarWrap);

 // Fixed-format date/time entry. Separators are painted by the control, never
 // typed; each segment accepts only its own digits and advances on completion.
 const SEGMENTS=[{name:"year",length:4},{name:"month",length:2},{name:"day",length:2},{name:"hour",length:2},{name:"minute",length:2}];
 function digitsOf(date,key){
  const time=key==="end"&&date.getHours()===23&&date.getMinutes()===59?"2359":timeOfDay(date).replace(":","");
  return [String(date.getFullYear()).padStart(4,"0"),pad2(date.getMonth()+1),pad2(date.getDate()),time.slice(0,2),time.slice(2,4)];
 }
 function fieldValue(field){return field.segments.map(segment=>segment.input.value).join("");}
 function fieldText(field){
  const [year,month,day,hour,minute]=field.segments.map(segment=>segment.input.value);
  return `${year}/${month}/${day} ${hour}:${minute}`;
 }
 function setSegmentValue(segment,value){segment.input.value=value.slice(0,segment.length);segment.input.size=Math.max(1,Math.min(segment.input.value.length||segment.length,segment.length));}
 function makeField(label,key){
  const field=document.createElement("div");field.className="wd-date-field";
  const caption=document.createElement("span");caption.className="wd-date-field-label";caption.textContent=label;
  const control=document.createElement("span");control.className="wd-date-field-control";glassHost(control,18);
  control.append(arrowIcon("imgBoldTimeCalendar.svg"));
  const group=document.createElement("span");group.className="wd-date-field-input";
  const segments=[];
  let fieldState;
  const flagInvalid=message=>{if(fieldState)showInvalid(message,[fieldState]);};
  SEGMENTS.forEach((definition,index)=>{
   if(index>0){const separator=document.createElement("span");separator.className="wd-date-separator";separator.textContent=index===3?" ":(index===4?":":"/");separator.setAttribute("aria-hidden","true");group.append(separator);}
   const input=document.createElement("input");input.className="wd-date-segment";input.type="text";input.autocomplete="off";input.inputMode="numeric";
   input.style.setProperty("--wd-date-segment-chars",definition.length);
   input.setAttribute("aria-label",`${label}, ${definition.name}`);input.setAttribute("aria-describedby",status.id);input.setAttribute("aria-invalid","false");
   input.spellcheck=false;input.maxLength=definition.length;input.size=definition.length;
   const segment={...definition,key,input};
   // Focusing a segment is not a correction: clearing there would erase the
   // error that Apply or the same click just raised, so the invalid ring never
   // stayed visible. A typed digit is a correction and drops it immediately.
   input.addEventListener("focus",()=>input.select());
   input.addEventListener("beforeinput",event=>{
    if(event.inputType!=="insertText"||!event.data)return;
    if(!/^\d+$/.test(event.data)){event.preventDefault();flagInvalid("Use digits only: YYYY/MM/DD HH:mm.");}
   });
   input.addEventListener("input",()=>{
    if(/^\d*$/.test(input.value))clearInvalid();
    const digits=input.value.replace(/\D/g,"").slice(0,definition.length);
    if(input.value!==digits){input.value=digits;flagInvalid("Use digits only: YYYY/MM/DD HH:mm.");}
    input.size=Math.max(1,Math.min(digits.length||definition.length,definition.length));
    if(digits.length===definition.length){const next=segments[index+1]?.input;if(next){next.focus();next.select();}}
    if(fieldValue({segments}).length===14)commitInputs(key);
   });
   input.addEventListener("keydown",event=>{
    if(event.key==="Enter"){event.preventDefault();commitInputs(key);input.blur();}
    if(event.key==="Backspace"&&!input.value&&index>0){event.preventDefault();const previous=segments[index-1].input;previous.focus();previous.select();}
   });
   input.addEventListener("paste",event=>{
    event.preventDefault();
    const digits=(event.clipboardData?.getData("text")||"").replace(/\D/g,"").slice(0,14);
    if(!digits){flagInvalid("Use digits only: YYYY/MM/DD HH:mm.");return;}
    let offset=0;
    for(const item of segments){setSegmentValue(item,digits.slice(offset,offset+item.length));offset+=item.length;}
    commitInputs(key);
   });
   input.addEventListener("change",()=>{commitInputs(key);});
   segments.push(segment);group.append(input);
  });
  control.append(group);field.append(caption,control);
  fieldState={field,control,segments,input:segments[0].input};
  return fieldState;
 }
 startField=makeField("Start date","start");endField=makeField("End date","end");
 inputs.append(startField.field,endField.field);
 // Both actions use the shared standard button pair; material remains owned
 // by the date picker's glass instance.
 cancel=button("Cancel","wd-button wd-button--pill wd-button--neutral");glassHost(cancel,18);
 apply=button("Apply","wd-button wd-button--pill wd-button--primary");glassHost(apply,18);
 actions.append(cancel,apply);footer.append(actions);content.append(main,ruleOne,inputs,message,ruleTwo,footer);panel.append(content);glassHost(panel,30);

 for(const label of PRESETS){
  const el=button(label,"wd-date-preset");el.dataset.preset=label;el.setAttribute("aria-pressed","false");
  el.addEventListener("click",()=>selectPreset(label,true));presetButtons.set(label,el);quick.append(el);
 }
 function selectPreset(label,animate=true){
  if(label==="Custom range"){
   draft={...draft,preset:"Custom range"};rangeAnchor=false;
   for(const [name,button] of presetButtons)button.setAttribute("aria-pressed",String(name===label));
   syncDraft();startField.input.focus();startField.input.select();return;
  }
  const next=buildPreset(label,startOfDay(nowDate),nowDate);if(!next)return;
  rangeAnchor=false;const prior=visibleMonth;draft={...next};syncDraft();
  if(animate&&!sameMonth(prior,draft.start))enterMonth(draft.start,draft.start>prior?1:-1);
 }
 function syncDraft(){
  for(const [field,key] of [[startField,"start"],[endField,"end"]]){
   const values=digitsOf(draft[key],key);
   field.segments.forEach((segment,index)=>setSegmentValue(segment,values[index]));
  }
  for(const [name,button] of presetButtons)button.setAttribute("aria-pressed",String(name===draft.preset));
  clearInvalid();
  renderCalendar();
 }
 function clearInvalid(){
  for(const field of [startField,endField]){
   field.control.classList.remove("wd-date-invalid");
   for(const segment of field.segments)segment.input.setAttribute("aria-invalid","false");
  }
  collapseMessage();
 }
 function showInvalid(reason,fields){
  const alreadyReported=!status.hidden&&status.textContent===reason&&fields.every(field=>field.control.classList.contains("wd-date-invalid"));
  for(const field of fields){
   field.control.classList.add("wd-date-invalid");
   for(const segment of field.segments)segment.input.setAttribute("aria-invalid","true");
  }
  // The last digit and Apply can raise the same error in one gesture. Replaying
  // the entrance cancelled the running animation and snapped the card to its
  // final height, so an unchanged error keeps the motion already in flight.
  if(alreadyReported)return;
  const wasVisible=!status.hidden&&message.getBoundingClientRect().height>.5;
  const changed=status.textContent!==reason;
  const messageBefore=message.getBoundingClientRect().height;
  const panelBefore=panel.getBoundingClientRect().height;
  messageMotion?.cancel();messageMotion=null;panelMotion?.cancel();panelMotion=null;
  status.textContent=reason;status.hidden=false;
  // Measure the destination before animating: showing the row first and then
  // reading the panel makes the start and target heights identical, which is
  // why the card used to jump instead of growing.
  message.style.height="auto";
  const messageTarget=status.getBoundingClientRect().height;
  const panelTarget=panel.getBoundingClientRect().height;
  message.style.height=`${messageBefore}px`;
  growMessage({replace:wasVisible&&changed,from:messageBefore,target:messageTarget,panelFrom:panelBefore,panelTarget});
  // The footer follows the growing row; the panel height itself is measured
  // from real layout, so no fixed min-height can pin it to the short state.
 }
 // The card grows by exactly the message row instead of jumping: the row
 // animates its own height while the copy fades, so the fields above never
 // shift and the panel below stays attached.
 let messageMotion=null,panelMotion=null;
 function messageSize(){return status.offsetHeight}
 // The card grows downward, which is the honest direction for a row that sits
 // above the divider. Only when that growth would cross the viewport edge does
 // the panel move: the needed lift is folded into the same animation, so the
 // bottom edge stays put instead of snapping once the row has finished.
 // The panel grows from the edge opposite the trigger. Above the trigger it
 // grows upwards and its bottom edge stays 8px clear of it; below the trigger it
 // grows downwards. The same animation carries that translation, so the card
 // never snaps once the new row has finished expanding.
 function liftForGrowth(panelFrom,growth){
  if(growth<=0)return 0;
  const rect=panel.getBoundingClientRect(),edge=12;
  const anchor=trigger?.getBoundingClientRect?.();
  let shift=Math.max(0,rect.bottom+growth-(innerHeight-edge));
  if(anchor&&rect.bottom<=anchor.top+.5)shift=Math.max(shift,rect.bottom+growth-(anchor.top-8));
  if(anchor&&rect.top>=anchor.bottom-.5)shift=0;
  return Math.min(growth,Math.max(0,shift));
 }
 function animatePanel(panelFrom,panelTo,shift,duration,easing){
  const top=parseFloat(panel.style.top);
  const frames=Number.isFinite(top)&&Math.abs(shift)>.5?[{height:`${panelFrom}px`,top:`${top}px`},{height:`${panelTo}px`,top:`${top-shift}px`}]:[{height:`${panelFrom}px`},{height:`${panelTo}px`}];
  return panel.animate(frames,{duration,easing,fill:"forwards"});
 }
 function growMessage({replace=false,from=0,target=0,panelFrom=0,panelTarget=0}){
  if(reducedMotion()){message.style.height=`${target}px`;message.style.opacity="1";fitPanel();return;}
  const duration=motionDuration("--wd-motion-panel"),easing=motionEasing("--wd-ease-panel");
  const frames=from>0?[{height:`${from}px`,opacity:replace?.35:1},{height:`${target}px`,opacity:1}]:[{height:"0px",opacity:0},{height:`${target}px`,opacity:1}];
  const animation=message.animate(frames,{duration:from>0?duration*.5:duration,easing,fill:"forwards"});
  messageMotion=animation;
  const growth=target-from,shift=liftForGrowth(panelFrom,growth);
  if(shift>.5){const resting=parseFloat(panel.style.top);if(Number.isFinite(resting))panel._wdRestingTop=resting;}
  if(Math.abs(growth)>.5)panelMotion=animatePanel(panelFrom,panelTarget,shift,duration,easing);
  animation.finished.then(()=>{if(messageMotion!==animation)return;message.style.height=`${target}px`;message.style.opacity="1";animation.cancel();messageMotion=null;panelMotion?.cancel();panelMotion=null;panel.style.height="";if(shift>.5){const top=parseFloat(panel.style.top);if(Number.isFinite(top))panel.style.top=`${top-shift}px`;}fitPanel();}).catch(()=>{});
 }
 function collapseMessage(){
  const from=message.getBoundingClientRect().height;
  const before=panel.getBoundingClientRect().height;
  messageMotion?.cancel();messageMotion=null;panelMotion?.cancel();panelMotion=null;
  const finish=()=>{message.style.height="0px";message.style.opacity="0";status.hidden=true;status.textContent="";};
  if(!from){finish();fitPanel();return;}
  if(reducedMotion()){finish();fitPanel();return;}
  const duration=motionDuration("--wd-motion-panel-exit"),easing=motionEasing("--wd-ease-hover-out");
  const animation=message.animate([{height:`${from}px`,opacity:1},{height:"0px",opacity:0}],{duration,easing,fill:"forwards"});
  messageMotion=animation;
  // Mirroring the growth: the panel shrinks by the row and, when it had been
  // lifted to keep the trigger clear, returns to its anchor over the same time.
  const top=parseFloat(panel.style.top),anchor=trigger?.getBoundingClientRect?.();
  // Restore the exact top the panel occupied before the growth lifted it. The
  // value is captured at lift time; deriving it from the live rect drifts while
  // the height animation is still settling.
  const resting=Number.isFinite(panel._wdRestingTop)?panel._wdRestingTop:top;
  const targetTop=anchor&&Number.isFinite(top)&&panel.getBoundingClientRect().bottom<=anchor.top+1?resting:top;
  const frames=Number.isFinite(top)&&Math.abs(targetTop-top)>.5?[{height:`${before}px`,top:`${top}px`},{height:`${Math.max(0,before-from)}px`,top:`${targetTop}px`}]:[{height:`${before}px`},{height:`${Math.max(0,before-from)}px`}];
  panelMotion=panel.animate(frames,{duration,easing,fill:"forwards"});
  animation.finished.then(()=>{if(messageMotion!==animation)return;finish();animation.cancel();messageMotion=null;panelMotion?.cancel();panelMotion=null;panel.style.height="";if(Number.isFinite(top)&&Math.abs(targetTop-top)>.5)panel.style.top=`${targetTop}px`;delete panel._wdRestingTop;fitPanel();}).catch(()=>{});
 }
 // The message owns a row of its own, so the panel grows instead of squeezing
 // the actions. Growth must not push the panel off-screen or, when it opened
 // above the trigger, swallow the trigger itself.
 function fitPanel(){
  if(!panel.isConnected)return;
  const edge=12,rect=panel.getBoundingClientRect(),top=parseFloat(panel.style.top);
  if(!Number.isFinite(top))return;
  let next=top,overflow=rect.bottom-(innerHeight-edge);
  if(overflow>0)next=top-overflow;
  // A panel that sits above the trigger keeps its 8px gap as it grows; the
  // growth animation already moved the bottom edge, so this is a guard against
  // rounding rather than the source of the motion.
  const anchor=trigger?.getBoundingClientRect?.();
  if(anchor&&rect.bottom>anchor.top&&rect.top<anchor.top)next=anchor.top-8-rect.height;
  next=Math.max(edge,next);
  if(Math.abs(next-top)>.5)panel.style.top=`${next}px`;
 }
 function isComplete(field){return field.segments.every(segment=>segment.input.value.length===segment.length)}
 function commitInputs(changed){
  if(!isComplete(startField)||!isComplete(endField)){
   const incomplete=[...[isComplete(startField)?null:startField,isComplete(endField)?null:endField].filter(Boolean)];
   showInvalid("Enter a complete date and time as YYYY/MM/DD HH:mm.",incomplete);
   incomplete[0]?.segments.find(segment=>segment.input.value.length<segment.length)?.input.focus();
   return false;
  }
  const start=parseDateField(fieldText(startField),"start"),end=parseDateField(fieldText(endField),"end");
  if(!start||!end){
   const invalid=[...[!start?startField:null,!end?endField:null].filter(Boolean)];
   showInvalid("Enter a real date and time as YYYY/MM/DD HH:mm.",invalid);
   (invalid[0]||startField).segments[0].input.focus();return false;
  }
  if(end<start){
   showInvalid("End date must be on or after the start date.",[startField,endField]);
   endField.segments[0].input.focus();return false;
  }
  rangeAnchor=false;draft={start,end,preset:matchesPreset(start,end,nowDate)||"Custom range"};
  if(changed==="start"&&start&&!sameMonth(visibleMonth,start))enterMonth(start,start<visibleMonth?-1:1);
  syncDraft();return true;
 }
 function dayStart(date){return new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0)}
 function dayEnd(date){return new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59)}
 function chooseDay(date){
  clearInvalid();
  if(!rangeAnchor){
   draft={start:dayStart(date),end:dayEnd(date),preset:"Custom range"};rangeAnchor=true;
  }else{
   const selected=dayStart(date),start=draft.start<selected?draft.start:selected,end=draft.start<selected?dayEnd(selected):dayEnd(draft.start);
   draft={start,end,preset:rangeIntent(start,end,draft.preset)};rangeAnchor=false;
  }
  syncDraft();if(!sameMonth(visibleMonth,date))enterMonth(date,date<visibleMonth?-1:1);
 }
 function dayPressed(date){return sameDay(date,draft.start)||sameDay(date,draft.end)}
 function dayInRange(date){
  const day=startOfDay(date),from=startOfDay(draft.start),to=startOfDay(draft.end);
  return day>from&&day<to;
 }
 function renderCalendar(){
  monthText.textContent=new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(visibleMonth);
  const first=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1);
  const mondayOffset=(first.getDay()+6)%7;
  const start=new Date(first.getFullYear(),first.getMonth(),1-mondayOffset);
  const daysInMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,0).getDate();
  const cells=Math.max(35,Math.ceil((mondayOffset+daysInMonth)/7)*7);
  panel.classList.toggle("is-six-weeks",cells===42);
  const fragment=document.createDocumentFragment();dateButtons.clear();
  for(let index=0;index<cells;index++){
   const date=new Date(start.getFullYear(),start.getMonth(),start.getDate()+index);
   const el=button(String(date.getDate()),"wd-date-day");el.dataset.date=iso(date);
   const pressed=dayPressed(date);el.setAttribute("aria-pressed",String(pressed));
   if(pressed)el.classList.add("is-selected");
   if(dayInRange(date))el.classList.add("is-in-range");
   if(!sameMonth(date,visibleMonth))el.classList.add("is-outside");
   const label=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(date);
   el.setAttribute("aria-label",sameDay(date,nowDate)?`${label}, today`:label);
   if(sameDay(date,nowDate))el.setAttribute("aria-current","date");
   el.tabIndex=-1;
   el.addEventListener("click",()=>chooseDay(date));dateButtons.set(iso(date),el);fragment.append(el);
  }
  const monthPrefix=`${visibleMonth.getFullYear()}-${pad2(visibleMonth.getMonth()+1)}`,monthDays=[...dateButtons.entries()].filter(([key])=>key.startsWith(monthPrefix));
  const preferred=monthDays.find(([key])=>key===iso(draft.start)||key===iso(draft.end))||monthDays.find(([,el])=>el.getAttribute("aria-pressed")==="true")||monthDays[0];
  if(preferred)preferred[1].tabIndex=0;
  grid.replaceChildren(fragment);
  if(pendingFocus){const target=dateButtons.get(iso(pendingFocus));pendingFocus=null;if(target)target.focus({preventScroll:true});}
 }
 prevMonthButtonState();
 function prevMonthButtonState(){
  const current=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1);
  monthPrevious.disabled=current<=new Date(2020,0,1);
  monthNext.disabled=current>=new Date(2040,11,1);
 }
 function shiftMonth(delta){
  const next=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+delta,1);
  if(next<new Date(2020,0,1)||next>new Date(2040,11,1))return;
  enterMonth(next,delta);
 }
 // The frame, nav discs and weekday row stay stationary. Both date grids slide
 // as one continuous track while only the month text cross-fades, so the
 // selected range never disappears into an empty frame between months.
 function enterMonth(date,direction=1){
  const next=new Date(date.getFullYear(),date.getMonth(),1);
  if(visibleMonth.getFullYear()===next.getFullYear()&&visibleMonth.getMonth()===next.getMonth())return;
  monthMotion?.cancel();monthMotion=null;
  if(reducedMotion()){visibleMonth=next;renderCalendar();prevMonthButtonState();return;}
  const duration=motionDuration("--wd-motion-panel"),easing=motionEasing("--wd-ease-panel");
  const oldLabel=monthText.textContent,outgoingLabel=document.createElement("span");
  outgoingLabel.className="wd-date-month-outgoing";outgoingLabel.textContent=oldLabel;outgoingLabel.setAttribute("aria-hidden","true");
  monthLabel.append(outgoingLabel);
  const oldGrid=grid.cloneNode(true);oldGrid.classList.add("wd-date-dates--leaving");oldGrid.setAttribute("aria-hidden","true");oldGrid.style.pointerEvents="none";
  for(const day of oldGrid.querySelectorAll("button,[tabindex]"))day.tabIndex=-1;
  visibleMonth=next;renderCalendar();prevMonthButtonState();
  datesViewport.append(oldGrid);
  const distance=grid.clientWidth||datesViewport.clientWidth;
  const easeOut=grid.animate([{transform:`translateX(${distance*direction}px)`},{transform:"translateX(0)"}],{duration,easing});
  const oldOut=oldGrid.animate([{transform:"translateX(0)"},{transform:`translateX(${-distance*direction}px)`}],{duration,easing});
  const labelIn=monthText.animate([{opacity:0},{opacity:1}],{duration:duration*.62,delay:duration*.12,easing,fill:"backwards"});
  const labelOut=outgoingLabel.animate([{opacity:1},{opacity:0}],{duration:duration*.42,easing,fill:"forwards"});
  const clean=()=>{oldGrid.remove();outgoingLabel.remove();easeOut.cancel();oldOut.cancel();};
  monthMotion={cancel(){labelIn.cancel();labelOut.cancel();clean();monthMotion=null;}};
  Promise.all([easeOut.finished,oldOut.finished]).then(clean).catch(clean).finally(()=>{if(monthMotion)monthMotion=null;});
 }
 monthPrevious.addEventListener("click",()=>shiftMonth(-1));monthNext.addEventListener("click",()=>shiftMonth(1));
 apply.addEventListener("click",()=>{
  if(!commitInputs())return;
  onApply?.({...draft});close();
 });
 cancel.addEventListener("click",()=>close());
 panel.addEventListener("keydown",event=>{
  const day=event.target.closest?.(".wd-date-day");
  if(!day)return;
  const step=event.key==="ArrowLeft"?-1:event.key==="ArrowRight"?1:event.key==="ArrowUp"?-7:event.key==="ArrowDown"?7:0;
  if(!step)return;event.preventDefault();
  const current=parseDateInput(day.dataset.date);if(!current)return;
  const next=new Date(current.getFullYear(),current.getMonth(),current.getDate()+step);
  if(!sameMonth(next,visibleMonth)){pendingFocus=next;enterMonth(next,next<current?-1:1);return;}
  const target=dateButtons.get(iso(next));
  if(target){for(const item of dateButtons.values())item.tabIndex=-1;target.tabIndex=0;target.focus();}
 });

 panel._onClose=()=>{
  monthMotion?.cancel();monthMotion=null;
  glass.removeSurface(panel);
  for(const host of panel.querySelectorAll(".wd-glass"))glass.removeSurface(host);
 };
 syncDraft();
 registerPanel(panel,trigger,{label:"Select statistics period",align:"end"});
 // A dialog that keeps focus on its trigger makes Tab walk through the page
 // behind it. Enter on the selected day so pointer and keyboard share one start.
 const openFocus=()=>{const target=dateButtons.get(iso(draft.start))||[...dateButtons.values()].find(el=>el.tabIndex===0);target?.focus({preventScroll:true});};
 queueMicrotask(openFocus);
 return {panel,close:()=>close(),getRange:()=>({...draft})};
}
