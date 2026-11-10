import {createTextElement as text} from "../foundations/dom.js";

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

 function sync(){
  button.setAttribute("aria-checked",String(value));
  button.classList.toggle("is-on",value);
 }

 function setValue(next,{notify=true}={}){
  if(destroyed)return;
  value=Boolean(next);
  sync();
  if(notify)onChange?.(value);
 }

 button.disabled=Boolean(disabled);
 button.addEventListener("click",()=>{
  if(button.disabled)return;
  setValue(!value);
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
   glass?.removeSurface(button);
  }
 };
}
