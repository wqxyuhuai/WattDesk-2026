import {createTextElement as text} from "../foundations/dom.js";
import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";

export function createToggleSwitch({
 label,
 checked=false,
 disabled=false,
 className="",
 glass=null,
 onChange=null
}){
 const button=text("button",["wd-switch","wd-control-state",className].filter(Boolean).join(" "));
 button.type="button";
 button.setAttribute("role","switch");
 button.setAttribute("aria-label",label);
 const thumb=text("span","wd-switch-thumb");
 thumb.setAttribute("aria-hidden","true");
 button.append(thumb);
 let value=Boolean(checked);
 let destroyed=false;
 let thumbAnimation=null;
 let trackAnimation=null;

 function sync(){
  button.setAttribute("aria-checked",String(value));
  button.classList.toggle("is-on",value);
 }

 function setValue(next,{notify=true}={}){
  if(destroyed)return;
 const nextValue=Boolean(next);
 const changed=value!==nextValue;
 if(!changed){
  if(notify)onChange?.(value);
  return;
 }
 const fill=button.querySelector(".wd-glass-fill");
 const fromFill=fill?getComputedStyle(fill).backgroundColor:null;
 trackAnimation?.cancel();
 trackAnimation=null;
 fill?.style.removeProperty("background-color");
 value=nextValue;
  sync();
 if(fill&&fromFill&&!reducedMotion()){
  const toFill=getComputedStyle(fill).backgroundColor;
  const animation=fill.animate(
   [{backgroundColor:fromFill},{backgroundColor:toFill}],
   {duration:motionDuration("--wd-motion-switch-track"),easing:motionEasing("--wd-ease-switch-track"),fill:"both"}
  );
  trackAnimation=animation;
  animation.finished.then(()=>{
   if(trackAnimation!==animation)return;
   fill.style.backgroundColor=toFill;
   animation.cancel();
   trackAnimation=null;
  }).catch(()=>{});
 }
  if(notify)onChange?.(value);
 }

 function animateThumb(next){
  if(destroyed||reducedMotion())return;
  const style=getComputedStyle(thumb);
  const current=new DOMMatrixReadOnly(style.transform==="none"?"":style.transform).m41;
  const inset=Number.parseFloat(style.left)||0;
  const travel=button.clientWidth-thumb.offsetWidth-inset*2;
  const target=next?Math.max(0,travel):0;
  const direction=target>=current?1:-1;
  thumbAnimation?.cancel();
  thumbAnimation=thumb.animate([
   {transform:`translate3d(${current}px,0,0) scale(1)`,offset:0},
   {transform:`translate3d(${target+direction*1.4}px,0,0) scale(1.05,.95)`,offset:.48},
   {transform:`translate3d(${target-direction*.55}px,0,0) scale(.992,1.008)`,offset:.70},
   {transform:`translate3d(${target+direction*.18}px,0,0) scale(1.002,.998)`,offset:.86},
   {transform:`translate3d(${target}px,0,0) scale(1)`,offset:1}
  ],{
   duration:motionDuration("--wd-motion-switch-thumb"),
   easing:motionEasing("--wd-ease-switch-thumb")
  });
  thumbAnimation.addEventListener("finish",()=>{if(thumbAnimation?.playState==="finished")thumbAnimation=null;},{once:true});
 }

 button.disabled=Boolean(disabled);
 button.addEventListener("click",()=>{
  if(button.disabled)return;
  const next=!value;
  animateThumb(next);
  setValue(next);
 });
 sync();
 glass?.addSurface({host:button,radius:13});

 return {
  element:button,
  get checked(){return value;},
  setValue,
  destroy(){
   if(destroyed)return;
   destroyed=true;
   thumbAnimation?.cancel();
   thumbAnimation=null;
  trackAnimation?.cancel();
  trackAnimation=null;
   glass?.removeSurface(button);
  }
 };
}
