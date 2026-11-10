import {createTextElement as text} from "../foundations/dom.js";
import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";
import {applyTypeStyle} from "../foundations/typography.js";

export function createSegmentedControl({
 items,
 value,
 label="View",
 className="",
 glass,
 radius=18,
 onChange
}){
 if(!Array.isArray(items)||!items.length)throw new Error("Segmented control requires at least one item");
 const control=text("div",["wd-segmented-control",className].filter(Boolean).join(" "));
 control.setAttribute("role","tablist");
 control.setAttribute("aria-label",label);
 const indicator=text("span","wd-segmented-control-indicator");
 indicator.setAttribute("aria-hidden","true");
 control.append(indicator);
 const buttons=new Map();
 let activeId=items.some(item=>item.id===value)?value:items[0].id;
 let indicatorMotion=null;
 let indicatorState=null;

 function targetFor(button){
  return {x:button.offsetLeft,width:button.offsetWidth};
 }

 function positionIndicator({animate=false}={}){
  const button=buttons.get(activeId);
  if(!button)return;
  const target=targetFor(button);
  indicatorMotion?.cancel();
  indicatorMotion=null;
  if(!animate||reducedMotion()||!indicatorState){
   indicator.style.transform=`translateX(${target.x}px)`;
   indicator.style.width=`${target.width}px`;
   indicatorState=target;
   return;
  }
  const trackRect=control.getBoundingClientRect();
  const indicatorRect=indicator.getBoundingClientRect();
  const from={x:indicatorRect.left-trackRect.left,width:indicatorRect.width};
  indicatorState=target;
  const animation=indicator.animate(
   [
    {transform:`translateX(${from.x}px)`,width:`${from.width}px`},
    {transform:`translateX(${target.x}px)`,width:`${target.width}px`}
   ],
   {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel"),fill:"both"}
  );
  indicatorMotion=animation;
  animation.finished.then(()=>{
   if(indicatorMotion!==animation)return;
   indicator.style.transform=`translateX(${target.x}px)`;
   indicator.style.width=`${target.width}px`;
   animation.cancel();
   indicatorMotion=null;
  }).catch(()=>{});
 }

 function setValue(id,{animate=true,notify=true}={}){
  if(!buttons.has(id))return;
  activeId=id;
  for(const [buttonId,button] of buttons){
   const selected=buttonId===id;
   button.classList.toggle("is-selected",selected);
   button.setAttribute("aria-selected",String(selected));
   button.tabIndex=selected?0:-1;
  }
  positionIndicator({animate});
  if(notify)onChange?.(id);
 }

 for(const item of items){
  const button=text("button","wd-segmented-control-option wd-control-state wd-press-scale");
  button.type="button";
  button.dataset.value=item.id;
  button.setAttribute("role","tab");
  button.disabled=Boolean(item.disabled);
  const optionLabel=text("span","wd-control-label",item.label,"Footnote/Medium");
  applyTypeStyle(optionLabel,"Footnote/Medium");
  button.append(optionLabel);
  button.addEventListener("click",()=>{
   if(item.disabled||item.id===activeId)return;
   setValue(item.id);
  });
  buttons.set(item.id,button);
  control.append(button);
 }

 control.addEventListener("keydown",event=>{
  if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  const enabled=items.filter(item=>!item.disabled).map(item=>item.id);
  const current=enabled.indexOf(activeId);
  if(current<0)return;
  const next=event.key==="Home"?0:event.key==="End"?enabled.length-1:
   (current+(event.key==="ArrowRight"?1:-1)+enabled.length)%enabled.length;
  setValue(enabled[next]);
  buttons.get(enabled[next])?.focus();
 });

 const resizeObserver=new ResizeObserver(()=>positionIndicator({animate:false}));
 resizeObserver.observe(control);
 for(const button of buttons.values())resizeObserver.observe(button);
 requestAnimationFrame(()=>setValue(activeId,{animate:false,notify:false}));
 if(glass)glass.addSurface({host:control,radius});

 return {
  element:control,
  get value(){return activeId;},
  setValue,
  destroy(){
   indicatorMotion?.cancel();
   indicatorMotion=null;
   resizeObserver.disconnect();
   if(glass)glass.removeSurface(control);
  }
 };
}
