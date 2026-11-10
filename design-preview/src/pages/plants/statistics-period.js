import {createTextElement as text} from "../../foundations/dom.js";
import {opaqueMaskURL} from "../../components/icons.js";
import {createSegmentedControl} from "../../components/segmented-control.js";
import {createStandardButton} from "../../components/controls.js";

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS=["M","T","W","T","F","S","S"];
const TODAY=new Date(2026,10,9);

const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const startOfMonth=date=>new Date(date.getFullYear(),date.getMonth(),1);
const shiftMonth=(date,delta)=>new Date(date.getFullYear(),date.getMonth()+delta,1);

function iconMask(file){
 const icon=text("span","plant-statistics-period-icon");
 icon.style.setProperty("--period-icon",`url("${opaqueMaskURL(file)}")`);
 icon.setAttribute("aria-hidden","true");
 return icon;
}

export function statisticsPeriodLabel(state){
 if(state.mode==="day")return sameDay(state.date,TODAY)?"Today":`${MONTHS_SHORT[state.date.getMonth()]} ${state.date.getDate()}`;
 if(state.mode==="month")return `${MONTHS[state.date.getMonth()]} ${state.date.getFullYear()}`;
 if(state.mode==="year")return String(state.date.getFullYear());
 return "Total";
}

export function createStatisticsPeriodControl({glass,registerPanel,close,state,onChange}){
 const control=text("div","plant-statistics-period-control");
 const previous=text("button","plant-statistics-period-nav wd-control-state");
 previous.type="button";
 previous.setAttribute("aria-label","Previous statistics period");
 previous.append(iconMask("date-arrow-left.svg"));
 const trigger=text("button","plant-statistics-period-trigger wd-control-state");
 trigger.type="button";
 trigger.setAttribute("aria-haspopup","dialog");
 trigger.setAttribute("aria-expanded","false");
 const label=text("span","plant-statistics-period-label","","Footnote/Medium");
 trigger.append(label,iconMask("imgBoldTimeCalendar.svg"));
 const next=text("button","plant-statistics-period-nav wd-control-state");
 next.type="button";
 next.setAttribute("aria-label","Next statistics period");
 next.append(iconMask("date-arrow-right.svg"));
 control.append(previous,trigger,next);

 const update=()=>{
  label.textContent=statisticsPeriodLabel(state);
  previous.disabled=state.mode==="total";
  next.disabled=state.mode==="total";
  previous.setAttribute("aria-label",
   state.mode==="day"?"Previous day":state.mode==="month"?"Previous month":state.mode==="year"?"Previous year":"Previous statistics period");
  next.setAttribute("aria-label",
   state.mode==="day"?"Next day":state.mode==="month"?"Next month":state.mode==="year"?"Next year":"Next statistics period");
 };

 function commit(nextState,{dismiss=false}={}){
  state.mode=nextState.mode;
  state.date=new Date(nextState.date.getFullYear(),nextState.date.getMonth(),nextState.date.getDate());
  update();
  onChange?.({mode:state.mode,date:new Date(state.date)});
  if(dismiss)close?.();
 }

 function shift(direction){
 if(state.mode==="total")return;
 const nextDate=new Date(state.date);
 if(state.mode==="day")nextDate.setDate(nextDate.getDate()+direction);
 else if(state.mode==="month")nextDate.setMonth(nextDate.getMonth()+direction);
 else nextDate.setFullYear(nextDate.getFullYear()+direction);
 commit({mode:state.mode,date:nextDate});
 }

 function openPicker(){
  const panel=text("div","plant-statistics-period-picker wd-glass--surface wd-glass-popup");
  const initialMode=state.mode==="total"?"day":state.mode;
  const modeControl=createSegmentedControl({
   items:[
    {id:"day",label:"Day"},
    {id:"month",label:"Month"},
    {id:"year",label:"Year"},
    {id:"total",label:"Total"}
   ],
   value:initialMode,
   label:"Statistics period mode",
   className:"plant-statistics-period-tabs",
   glass,
   onChange:mode=>{
    if(mode==="total"){
     commit({mode,date:state.date},{dismiss:true});
     return;
    }
    renderPicker(mode,pickerDate);
   }
  });
  const view=text("div","plant-statistics-period-view");
  panel.append(modeControl.element,view);
  const panelSurfaces=[];
  let pickerDate=new Date(state.date);

  function navButton(file,labelText,direction){
   const button=createStandardButton({
    label:labelText,
    className:"plant-statistics-period-panel-nav",
    icon:iconMask(file),
    iconOnly:true
   });
   if(glass){
    glass.addSurface({host:button,radius:18});
    panelSurfaces.push(button);
   }
   button.addEventListener("click",()=>shiftPicker(direction));
   return button;
  }

  function shiftPicker(direction){
   if(currentMode==="day")pickerDate=shiftMonth(pickerDate,direction);
   else if(currentMode==="month")pickerDate=new Date(pickerDate.getFullYear()+direction,pickerDate.getMonth(),1);
   else pickerDate=new Date(pickerDate.getFullYear()+direction*9,pickerDate.getMonth(),1);
   renderPicker(currentMode,pickerDate);
  }

  function renderDay(){
   const head=text("div","plant-statistics-period-calendar-head");
   head.append(navButton("date-arrow-left.svg","Previous month",-1),text("strong","plant-statistics-period-range-label",`${MONTHS[pickerDate.getMonth()]} ${pickerDate.getFullYear()}`,"Footnote/Emphasized"),navButton("date-arrow-right.svg","Next month",1));
   const weekdays=text("div","plant-statistics-period-weekdays");
   for(const day of WEEKDAYS)weekdays.append(text("span","plant-statistics-period-weekday",day,"Caption2/Regular"));
   const grid=text("div","plant-statistics-period-days");
   const first=new Date(pickerDate.getFullYear(),pickerDate.getMonth(),1);
   const offset=(first.getDay()+6)%7;
   const daysInMonth=new Date(pickerDate.getFullYear(),pickerDate.getMonth()+1,0).getDate();
   for(let index=0;index<offset;index++)grid.append(text("span","plant-statistics-period-day is-empty"));
   for(let day=1;day<=daysInMonth;day++){
    const date=new Date(pickerDate.getFullYear(),pickerDate.getMonth(),day);
    const button=text("button","plant-statistics-period-day",String(day),"Caption1/Regular");
    button.type="button";
    button.setAttribute("aria-label",`${MONTHS[date.getMonth()]} ${day}, ${date.getFullYear()}`);
    button.setAttribute("aria-pressed",String(sameDay(date,state.date)));
    button.addEventListener("click",()=>commit({mode:"day",date},{dismiss:true}));
    grid.append(button);
   }
   view.replaceChildren(head,weekdays,grid);
  }

  function renderMonth(){
   const head=text("div","plant-statistics-period-calendar-head");
   head.append(navButton("date-arrow-left.svg","Previous year",-1),text("strong","plant-statistics-period-range-label",String(pickerDate.getFullYear()),"Footnote/Emphasized"),navButton("date-arrow-right.svg","Next year",1));
   const grid=text("div","plant-statistics-period-months");
   MONTHS_SHORT.forEach((month,index)=>{
    const button=text("button","plant-statistics-period-choice",month,"Caption1/Regular");
    button.type="button";
    button.setAttribute("aria-pressed",String(state.mode==="month"&&pickerDate.getFullYear()===state.date.getFullYear()&&index===state.date.getMonth()));
    button.addEventListener("click",()=>commit({mode:"month",date:new Date(pickerDate.getFullYear(),index,1)},{dismiss:true}));
    grid.append(button);
   });
   view.replaceChildren(head,grid);
  }

  function renderYear(){
   const firstYear=Math.floor(pickerDate.getFullYear()/9)*9;
   const head=text("div","plant-statistics-period-calendar-head");
   head.append(navButton("date-arrow-left.svg","Previous years",-1),text("strong","plant-statistics-period-range-label",`${firstYear}–${firstYear+8}`,"Footnote/Emphasized"),navButton("date-arrow-right.svg","Next years",1));
   const grid=text("div","plant-statistics-period-years");
   for(let index=0;index<9;index++){
    const year=firstYear+index;
    const button=text("button","plant-statistics-period-choice",String(year),"Caption1/Regular");
    button.type="button";
    button.setAttribute("aria-pressed",String(state.mode==="year"&&state.date.getFullYear()===year));
    button.addEventListener("click",()=>commit({mode:"year",date:new Date(year,state.date.getMonth(),1)},{dismiss:true}));
    grid.append(button);
   }
   view.replaceChildren(head,grid);
  }

  let currentMode=initialMode;
  function renderPicker(mode,date){
   currentMode=mode;
   pickerDate=new Date(date.getFullYear(),date.getMonth(),1);
   if(mode==="month")renderMonth();
   else if(mode==="year")renderYear();
   else renderDay();
  }

  renderPicker(currentMode,pickerDate);
  panel._onClose=()=>{
   modeControl.destroy();
   if(glass)while(panelSurfaces.length)glass.removeSurface(panelSurfaces.pop());
  };
  registerPanel(panel,trigger,{label:"Statistics period",align:"end",radius:24});
  queueMicrotask(()=>{
   view.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});
  });
  return {panel,close:()=>close?.()};
 }

 previous.addEventListener("click",()=>shift(-1));
 next.addEventListener("click",()=>shift(1));
 trigger.addEventListener("click",openPicker);
 update();
 return {
  element:control,
  controls:[{host:control,radius:18}],
  update
 };
}
