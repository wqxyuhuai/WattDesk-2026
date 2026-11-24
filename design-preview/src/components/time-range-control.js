import {createTextElement as text} from "../foundations/dom.js";
import {reducedMotion} from "../foundations/motion.js";

function parseClock(value){
 const match=/^(\d{2}):(\d{2})$/.exec(String(value||"").trim());
 if(!match)return null;
 const hours=Number(match[1]),minutes=Number(match[2]);
 if(hours===24&&minutes===0)return 1440;
 if(hours>23||minutes>59)return null;
 return hours*60+minutes;
}

function clockFromMinutes(value){
 const safe=Math.max(0,Math.min(1440,Math.round(value)));
 if(safe===1440)return "24:00";
 return `${String(Math.floor(safe/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`;
}

function formatDigits(value){
 const digits=String(value||"").replace(/\D/g,"").slice(0,8).padEnd(8,"_");
 return `${digits.slice(0,2)}:${digits.slice(2,4)} – ${digits.slice(4,6)}:${digits.slice(6,8)}`;
}

function parseDigits(value){
 const digits=String(value||"").replace(/\D/g,"");
 if(digits.length!==8)return null;
 const from=`${digits.slice(0,2)}:${digits.slice(2,4)}`;
 const to=`${digits.slice(4,6)}:${digits.slice(6,8)}`;
 if(parseClock(from)===null||parseClock(to)===null)return null;
 return {from,to};
}

function digitCountBefore(value,index){
 return String(value||"").slice(0,index).replace(/\D/g,"").length;
}

function caretForDigitIndex(value,digitIndex){
 if(digitIndex<=0)return 0;
 let seen=0;
 for(let index=0;index<value.length;index+=1){
  if(/\d/.test(value[index]))seen+=1;
  if(seen===digitIndex)return index+1;
 }
 return value.length;
}

/**
 * Shared Economic-style time range editor. The input keeps the eight-digit mask;
 * the trigger opens the same wheel popover used by Economic Schedule. Callers
 * provide interval filtering and business validation.
 */
export function createTimeRangeControl({
 field,
 input,
 trigger,
 getValue,
 stepMinutes=1,
 validate=()=>"",
 onCommit=()=>{},
 onError=()=>{},
 onClearError=()=>{},
 registerPanel,
 close,
 toggle,
 addDisposer
}){
 const controller=new AbortController();
 const step=[15,30,60].includes(Number(stepMinutes))?Number(stepMinutes):1;
 const minuteValues=Array.from({length:Math.ceil(60/step)},(_,index)=>index*step);
 const signal={signal:controller.signal};
 const canonical=()=>{
  const value=getValue();
  return `${value.from} – ${value.to}`;
 };
 const parseValue=()=>parseDigits(input.value);
 const commit=()=>{
  if(input.value.replace(/\D/g,"").length!==8){
   onError("Enter eight digits for the start and end time.");
   return;
  }
  const parsed=parseValue();
  if(!parsed){
   onError("Enter valid times between 00:00 and 24:00.");
   return;
  }
  const error=validate(parsed);
  if(error){
   onError(error);
   return;
  }
  const current=getValue();
  if(parsed.from===current.from&&parsed.to===current.to){
   input.value=canonical();
   onClearError();
   return;
  }
  onClearError();
  onCommit(parsed);
 };

 input.addEventListener("input",()=>{
  const digitIndex=digitCountBefore(input.value,input.selectionStart??input.value.length);
  const digitLength=input.value.replace(/\D/g,"").slice(0,8).length;
  input.value=formatDigits(input.value);
  onClearError();
  const caret=caretForDigitIndex(input.value,Math.min(digitIndex,digitLength));
  input.setSelectionRange(caret,caret);
 },signal);
 input.addEventListener("blur",()=>{
  setTimeout(()=>{
   const active=document.activeElement;
   if(field.contains(active)||active?.closest(".isw-eco-time-picker-popover"))return;
   commit();
  },0);
 },signal);
 input.addEventListener("keydown",event=>{
  const selectionStart=input.selectionStart??input.value.length;
  const selectionEnd=input.selectionEnd??selectionStart;
  if((event.key==="Backspace"||event.key==="Delete")&&selectionStart===selectionEnd){
   event.preventDefault();
   event.stopImmediatePropagation();
   const digits=input.value.replace(/\D/g,"").slice(0,8);
   const digitIndex=digitCountBefore(input.value,selectionStart);
   const removeIndex=event.key==="Backspace"?digitIndex-1:digitIndex;
   if(removeIndex<0||removeIndex>=digits.length)return;
   input.value=formatDigits(digits.slice(0,removeIndex)+digits.slice(removeIndex+1));
   onClearError();
   const caret=caretForDigitIndex(input.value,removeIndex);
   input.setSelectionRange(caret,caret);
   return;
  }
  if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
   event.preventDefault();
   const digitIndex=digitCountBefore(input.value,selectionStart);
   const nextIndex=event.key==="ArrowLeft"
    ?Math.max(0,digitIndex-1)
    :Math.min(8,digitIndex+1);
   const caret=caretForDigitIndex(input.value,nextIndex);
   input.setSelectionRange(caret,caret);
   return;
  }
  if(event.key==="Enter"){
   event.preventDefault();
   input.blur();
  }else if(event.key==="Escape"){
   event.preventDefault();
   input.value=canonical();
   onClearError();
   input.setSelectionRange(input.value.length,input.value.length);
  }
 },signal);

 const openPicker=()=>{
  if(!registerPanel||!trigger)return;
  toggle?.(trigger,()=>{
   const current=getValue();
   const fromMinutes=parseClock(current.from)??0;
   const toMinutes=parseClock(current.to)??0;
   const draft={
    fromHour:Math.min(23,Math.floor(fromMinutes/60)),
    fromMinute:fromMinutes%60,
    toHour:Math.min(24,Math.floor(toMinutes/60)),
    toMinute:toMinutes%60
   };
   const updatePreview=()=>{
    const from=clockFromMinutes(draft.fromHour*60+draft.fromMinute);
    const to=clockFromMinutes(draft.toHour*60+draft.toMinute);
    input.value=`${from} – ${to}`;
    const error=validate({from,to});
    if(error)onError(error);
    else onClearError();
   };
   const panel=text("div","popover popover--menu isw-eco-time-picker-popover");
   const picker=text("div","isw-eco-time-picker");
   const buildWheel=(label,values,key,isEndHour=false)=>{
    const shell=text("div","isw-eco-time-wheel-shell");
    const highlight=text("span","isw-eco-time-wheel-highlight");
    highlight.setAttribute("aria-hidden","true");
    const wheel=text("div","isw-eco-time-wheel");
    wheel.setAttribute("role","listbox");
    wheel.setAttribute("aria-label",label);
    const list=text("div","isw-eco-time-wheel-list");
    if(values.length===1){
     shell.classList.add("is-fixed");
     wheel.classList.add("is-fixed");
     draft[key]=Number(values[0]);
     const fixed=text("span","isw-eco-time-value is-selected is-static",String(values[0]).padStart(2,"0"));
     fixed.dataset.iswEcoTimeValue=String(values[0]);
     fixed.dataset.iswEcoTimePart=key;
     fixed.setAttribute("role","option");
     fixed.setAttribute("aria-selected","true");
     wheel.addEventListener("wheel",event=>{
      event.preventDefault();
      event.stopPropagation();
     },{passive:false,signal:signal.signal});
     list.append(fixed);
     wheel.append(list);
     updatePreview();
     shell.append(highlight,wheel);
     return shell;
    }
    const buttons=[];
    const finiteValues=values.length>1&&values.length<=4;
    const cycleCount=finiteValues?1:5;
    const centerCycle=finiteValues?0:2;
    let programmaticScroll=false;
    let programmaticScrollTimer=0;
    shell.classList.toggle("is-sparse",finiteValues);
    wheel.classList.toggle("is-sparse",finiteValues);
    const centerButton=(button,{smooth=false}={})=>{
     if(!button)return;
     const top=Math.max(0,button.offsetTop-(wheel.clientHeight-button.offsetHeight)/2);
     wheel.scrollTo({top,behavior:smooth&&!reducedMotion()?"smooth":"auto"});
    };
    const selectButton=button=>{
     if(!button)return;
     draft[key]=Number(button.dataset.iswEcoTimeValue);
     if(isEndHour&&String(draft[key]).padStart(2,"0")==="24")draft.toMinute=0;
     for(const item of buttons){
      const selected=item===button;
      item.classList.toggle("is-selected",selected);
      item.setAttribute("aria-selected",String(selected));
     }
     updatePreview();
    };
    const centerCycleButton=value=>buttons.find(item=>
     Number(item.dataset.iswEcoTimeCycle)===centerCycle&&
     Number(item.dataset.iswEcoTimeValue)===Number(value)
    );
    for(let cycle=0;cycle<cycleCount;cycle+=1){
     for(const value of values){
      const button=text("button","isw-eco-time-value");
      button.type="button";
      button.textContent=String(value).padStart(2,"0");
      button.dataset.iswEcoTimeValue=String(value);
      button.dataset.iswEcoTimePart=key;
      button.dataset.iswEcoTimeCycle=String(cycle);
      button.setAttribute("role","option");
      button.setAttribute("aria-selected","false");
      button.addEventListener("click",()=>{
       const middle=centerCycleButton(value)||button;
       selectButton(middle);
       programmaticScroll=true;
       centerButton(middle,{smooth:true});
       clearTimeout(programmaticScrollTimer);
       programmaticScrollTimer=setTimeout(()=>{
        programmaticScroll=false;
       },480);
      },signal);
      buttons.push(button);
      list.append(button);
     }
    }
    wheel.append(list);
    const initial=centerCycleButton(draft[key])||buttons[0];
    selectButton(initial);
    let scrollTimer=0;
    let scrollFrame=0;
    const closestButton=()=>{
     const box=wheel.getBoundingClientRect();
     const middle=box.top+box.height/2;
     return buttons.reduce((best,button)=>{
      const rect=button.getBoundingClientRect();
      const distance=Math.abs(rect.top+rect.height/2-middle);
      return !best||distance<best.distance?{button,distance}:best;
     },null);
    };
    const syncSelection=()=>{
     if(programmaticScroll||scrollFrame)return;
     scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      const closest=closestButton();
      if(closest)selectButton(closest.button);
     });
    };
    const recenterLoop=()=>{
     if(programmaticScroll)return;
     const closest=closestButton();
     if(!closest)return;
     const cycle=Number(closest.button.dataset.iswEcoTimeCycle);
     const recentered=cycle===0||cycle===cycleCount-1
      ?centerCycleButton(closest.button.dataset.iswEcoTimeValue)
      :closest.button;
     if(!recentered)return;
     selectButton(recentered);
     if(recentered!==closest.button)centerButton(recentered);
    };
    wheel.addEventListener("scroll",()=>{
     syncSelection();
     if(finiteValues)return;
     clearTimeout(scrollTimer);
     scrollTimer=setTimeout(recenterLoop,90);
    },{passive:true,signal:signal.signal});
    requestAnimationFrame(()=>centerButton(centerCycleButton(draft[key])));
    addDisposer?.(()=>{
     clearTimeout(scrollTimer);
     clearTimeout(programmaticScrollTimer);
     cancelAnimationFrame(scrollFrame);
    });
    shell.append(highlight,wheel);
    return shell;
   };
   const buildGroup=(title,fromPrefix,toPrefix)=>{
    const group=text("div","isw-eco-time-wheel-group");
    group.setAttribute("aria-label",title);
    group.append(
     buildWheel(
      `${title} hour`,
      fromPrefix==="from"
       ?Array.from({length:24},(_,index)=>index)
       :Array.from({length:25},(_,index)=>index),
      `${fromPrefix}Hour`,
      false
     ),
     buildWheel(`${title} minute`,minuteValues,`${toPrefix}Minute`)
    );
    return group;
   };
   const separator=text("span","isw-eco-time-separator","–");
   separator.setAttribute("aria-hidden","true");
   picker.append(
    buildGroup("Start time","from","from"),
    separator,
    buildGroup("End time","to","to")
   );
   panel.append(picker);
   panel._wdFade=picker;
   const mounted=registerPanel(panel,trigger,{
    label:"Choose start and end time",
    radius:30,
    align:"start",
    alignAnchor:field
   });
   const previousClose=mounted._onClose;
   mounted._onClose=()=>{
    previousClose?.();
    const from=clockFromMinutes(draft.fromHour*60+draft.fromMinute);
    const to=clockFromMinutes(draft.toHour*60+draft.toMinute);
    if(from===current.from&&to===current.to)return;
    const error=validate({from,to});
    if(error){
     onError(error);
     return;
    }
    onClearError();
    onCommit({from,to});
   };
   return mounted;
  });
 };
 trigger?.addEventListener("click",openPicker,signal);
 return {
  commit,
  destroy(){
   controller.abort();
  }
 };
}
