// Statistics period: capsule width follows the label, refresh spins once, and
// the date picker only commits on Apply.
import {createDatePicker,describeRange,presetRange} from "../../components/date-picker.js";
import {reducedMotion,motionDuration,motionEasing} from "../../foundations/motion.js";

export function createPeriodControl({get,action,glass,registerPanel,close,toast}){
 const periodLabel=get("I14578:6106;14420:2221;14420:2195");
 // The capsule grows with its content instead of clipping a changed period.
 // The refresh button stays on the card's right edge; the capsule grows left.
 const periodControl=get("14578:6106"),periodInner=get("I14578:6106;14420:2221"),periodContent=get("I14578:6106;14420:2221;14420:2193");
 const periodRow=periodControl.parentElement,refreshControl=get("14612:8453");
 const periodMinWidth=parseFloat(periodControl.style.width)||123;
 const periodRefreshGap=(parseFloat(refreshControl.style.left)||133)-periodMinWidth;
 let periodRowRight=(parseFloat(periodRow.style.left)||0)+(parseFloat(periodRow.style.width)||169);
 // The Home preview uses the reviewed 10 Oct snapshot so presets stay stable.
 let activeRange=presetRange("Last 7 days",new Date(2026,9,10,14,32));
 function fitPeriodControl(){
  periodLabel.style.width="max-content";
  const textWidth=Math.ceil(periodLabel.offsetWidth);
  const width=Math.max(periodMinWidth,54+textWidth);
  periodLabel.style.width=textWidth+"px";
  periodControl.style.width=periodInner.style.width=width+"px";
  periodContent.style.width=(width-28)+"px";
  refreshControl.style.left=(width+periodRefreshGap)+"px";
  periodRow.style.left=(periodRowRight-width-periodRefreshGap-36)+"px";periodRow.style.width=(width+periodRefreshGap+36)+"px";
 }
 function setPeriod(text){periodLabel.textContent=text;fitPeriodControl();}
 function setRowRight(value){periodRowRight=value;}
 function getRange(){return activeRange;}
 function setRange(range){
  activeRange={preset:range?.preset||"Custom range",start:new Date(range.start),end:new Date(range.end)};
  setPeriod(describeRange(activeRange));
 }
 function rangeSnapshot(){
  return {preset:activeRange.preset,start:activeRange.start.toISOString(),end:activeRange.end.toISOString()};
 }
 setPeriod(describeRange(activeRange));
 action("14578:6106","Select statistics period",()=>{
  createDatePicker({
   trigger:periodControl,glass,registerPanel,close,range:activeRange,
   onApply(range){
    activeRange=range;setPeriod(describeRange(range));
    toast("Period selected · Preview data");
   }
  });
 });
 action("14612:8453","Refresh statistics",async()=>{
  if(refreshControl.getAttribute("aria-busy")==="true")return;
  refreshControl.setAttribute("aria-busy","true");refreshControl.setAttribute("aria-disabled","true");
  const icon=refreshControl.querySelector(".asset>img");
  try{
   if(icon&&!reducedMotion()){
    const keyframes=[{transform:"rotate(0deg)"},{transform:"rotate(360deg)"}],options={duration:motionDuration("--wd-motion-refresh"),easing:motionEasing("--wd-ease-hover-out")};
    icon.parentElement.querySelector(".shared-icon-highlight")?.animate(keyframes,options);
    await icon.animate(keyframes,options).finished;
   }
   toast("Statistics refreshed · Preview data");
  }finally{refreshControl.setAttribute("aria-busy","false");refreshControl.setAttribute("aria-disabled","false");}
 });
 return {
  control:periodControl,
  fit:fitPeriodControl,
  setPeriod,
  setRowRight,
  getRange,
  setRange,
  rangeSnapshot,
  label:()=>periodLabel.textContent
 };
}
