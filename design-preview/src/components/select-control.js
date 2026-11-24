import {createMaskedIcon,opaqueMaskURL} from "./icons.js";
import {menuList,menuRow,mountMenu} from "./menu-popover.js";
import {menuEndAlign} from "./popover.js";

const SELECT_VARIANTS=new Set(["default","form","compact","table","adaptive"]);

function normalizeOption(option){
 if(option&&typeof option==="object"){
  return {
   value:option.value,
   label:option.label??String(option.value),
   description:String(option.description??""),
   disabled:Boolean(option.disabled)
  };
 }
 return {value:option,label:String(option),description:"",disabled:false};
}

export function createSelectControl({
 label,
 value,
 options=[],
 onChange=()=>{},
 className="",
 valueClassName="",
 placeholder="",
 placeholderClassName="",
 menuClassName="",
 optionClassName="",
 variant="default",
 registerPanel,
 close,
 toggle,
 radius=30,
 align="end",
 alignOffset=radius,
 menuWidth,
 chooseLabel=`Choose ${label}`,
 panelBuilder=null,
 ariaLabel,
 id="",
 name="",
 panelId=""
}={}){
 const controller=new AbortController();
 let normalized=options.map(normalizeOption);
 if(value!==undefined&&value!==null&&value!==""&&!normalized.some(option=>Object.is(option.value,value)))normalized.unshift(normalizeOption(value));

 const field=document.createElement("button");
 field.type="button";
 const safeVariant=SELECT_VARIANTS.has(variant)?variant:"default";
 field.className=["wd-select-trigger",`wd-select--${safeVariant}`,"wd-control-state","wd-edit-field",className].filter(Boolean).join(" ");
 field.setAttribute("aria-haspopup","listbox");
 field.setAttribute("aria-expanded","false");
 if(id)field.id=id;
 if(name)field.name=name;

 const valueNode=document.createElement("span");
 valueNode.className=["wd-select-value",valueClassName].filter(Boolean).join(" ");
 valueNode.setAttribute("aria-hidden","true");
 const chevron=createMaskedIcon(opaqueMaskURL("asset-14.svg"),"wd-select-chevron");
 field.append(valueNode,chevron);

 let selectedValue=value;
 let activePanel=null;
 let activeRows=[];
 let typeahead="";
 let typeaheadTimer=0;

 const findOption=next=>normalized.find(option=>Object.is(option.value,next));
 const sync=()=>{
  const current=findOption(selectedValue);
  const isPlaceholder=!current||current.label==="";
  const currentLabel=isPlaceholder?(placeholder||current?.label||String(selectedValue??"")):current.label;
  valueNode.textContent=currentLabel;
  if(placeholderClassName)valueNode.classList.toggle(placeholderClassName,isPlaceholder);
  field.dataset.value=String(selectedValue??"");
  const accessibleName=typeof ariaLabel==="function"
   ?ariaLabel(currentLabel)
   :ariaLabel??`${label?`${label}: `:""}${currentLabel}`;
  field.setAttribute("aria-label",accessibleName);
 };
 sync();

 const setValue=(next,{notify=false}={})=>{
  if(Object.is(selectedValue,next))return;
  selectedValue=next;
  sync();
  if(notify)onChange(next);
 };

 const clearTypeahead=()=>{
  clearTimeout(typeaheadTimer);
  typeaheadTimer=0;
  typeahead="";
 };

 const enabledRows=()=>activeRows.filter(row=>!row.disabled&&row.getAttribute("aria-disabled")!=="true");
 const focusOption=row=>row?.focus({preventScroll:true});

 const closeActivePanel=()=>{
  const panel=activePanel;
  activePanel=null;
  activeRows=[];
  clearTypeahead();
  if(!panel)return;
  if(close){
   close(true);
   return;
  }
  panel._onClose?.();
  panel.remove();
 };

 const moveFocus=step=>{
  const rows=enabledRows();
  if(!rows.length)return;
  const current=rows.indexOf(document.activeElement);
  const next=current<0?(step>0?0:rows.length-1):(current+step+rows.length)%rows.length;
  focusOption(rows[next]);
 };

 const focusInitial=preferred=>{
  const rows=enabledRows();
  if(!rows.length)return;
  if(preferred==="first"){
   focusOption(rows[0]);
   return;
  }
  if(preferred==="last"){
   focusOption(rows[rows.length-1]);
   return;
  }
  const selected=rows.find(row=>row.getAttribute("aria-selected")==="true");
  focusOption(selected||(preferred==="selected-last"?rows[rows.length-1]:rows[0]));
 };

 const openPanel=preferred=>{
  if(!registerPanel)return;
  const start=()=>{
   if(panelBuilder){
    const mounted=panelBuilder({field,selectedValue});
    if(!mounted)return;
    activePanel=mounted;
    activeRows=[];
    const previousClose=mounted._onClose;
    mounted._onClose=()=>{
     if(activePanel===mounted){
      activePanel=null;
      activeRows=[];
      clearTypeahead();
     }
     previousClose?.();
    };
    return mounted;
   }
   const panel=document.createElement("div");
   panel.className=["popover","popover--menu","wd-select-popover",menuClassName].filter(Boolean).join(" ");
   const list=menuList();
   list.setAttribute("role","listbox");
   list.setAttribute("aria-label",chooseLabel);
   list.setAttribute("aria-orientation","vertical");
   const rows=[];
   for(const option of normalized){
    const row=menuRow(option.label,{checked:false,showCheck:false,description:option.description});
    row.classList.add("wd-select-option");
    if(option.description)row.classList.add("has-description");
    if(optionClassName)row.classList.add(optionClassName);
    row.setAttribute("role","option");
    row.setAttribute("aria-selected",String(Object.is(option.value,selectedValue)));
    row.setAttribute("aria-disabled",String(option.disabled));
    row.dataset.value=String(option.value);
    row.tabIndex=-1;
    row.disabled=option.disabled;
    const check=document.createElement("span");
    check.className="wd-select-check";
    check.setAttribute("aria-hidden","true");
    row.append(check);
    row.addEventListener("click",()=>{
     if(option.disabled)return;
     const changed=!Object.is(selectedValue,option.value);
     setValue(option.value);
     close?.(true);
     requestAnimationFrame(()=>{
      if(field.isConnected)field.focus({preventScroll:true});
     });
     if(changed)onChange(option.value);
    });
    list.append(row);
    rows.push(row);
   }
   list.addEventListener("keydown",event=>{
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){
     event.preventDefault();
     moveFocus(event.key==="ArrowDown"?1:-1);
     return;
    }
    if(event.key==="Home"||event.key==="End"){
     event.preventDefault();
     const options=enabledRows();
     focusOption(event.key==="Home"?options[0]:options[options.length-1]);
     return;
    }
    if(event.key==="Escape"||event.key==="Tab"){
     event.preventDefault();
     event.stopPropagation();
     closeActivePanel();
     field.focus({preventScroll:true});
     return;
    }
    if(event.key.length===1&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&/\S/.test(event.key)){
     event.preventDefault();
     clearTimeout(typeaheadTimer);
     typeahead+=event.key.toLocaleLowerCase();
     typeaheadTimer=setTimeout(clearTypeahead,600);
     const options=enabledRows();
     if(!options.length)return;
     const current=options.indexOf(document.activeElement);
     for(let offset=1;offset<=options.length;offset+=1){
      const row=options[(Math.max(0,current)+offset)%options.length];
      if(row.textContent.trim().toLocaleLowerCase().startsWith(typeahead)){
       focusOption(row);
       break;
      }
     }
    }
   });
   mountMenu(panel,{label:chooseLabel,children:[list]});
   const width=typeof menuWidth==="function"?menuWidth(field):menuWidth;
   const panelOptions={label:chooseLabel,radius,align};
   if(width!==undefined)panelOptions.width=width;
   if(panelId)panelOptions.id=panelId;
   if(align==="end"&&Number.isFinite(alignOffset)){
    panelOptions.alignRight=menuEndAlign(field,alignOffset);
   }
   const mounted=registerPanel(panel,field,panelOptions);
   activePanel=mounted;
   activeRows=rows;
   const previousClose=mounted._onClose;
   mounted._onClose=()=>{
    if(activePanel===mounted){
     activePanel=null;
     activeRows=[];
     clearTypeahead();
    }
    previousClose?.();
   };
   requestAnimationFrame(()=>{
    if(activePanel===mounted)focusInitial(preferred);
   });
   return mounted;
  };
  if(toggle)toggle(field,start);
  else start();
 };

 field.addEventListener("click",()=>openPanel("selected-first"),{signal:controller.signal});
 field.addEventListener("keydown",event=>{
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
  event.preventDefault();
  const preferred=event.key==="ArrowUp"?"selected-last":event.key==="End"?"last":event.key==="Home"?"first":"selected-first";
  openPanel(preferred);
 },{signal:controller.signal});

 const setOptions=(nextOptions,{value:nextValue=selectedValue,notify=false}={})=>{
  closeActivePanel();
  const previous=selectedValue;
  normalized=(Array.isArray(nextOptions)?nextOptions:[]).map(normalizeOption);
  selectedValue=nextValue;
  sync();
  if(notify&&!Object.is(previous,nextValue))onChange(nextValue);
 };

 const updateOption=(currentValue,patch,{notify=false}={})=>{
  const index=normalized.findIndex(option=>Object.is(option.value,currentValue));
  if(index<0||!patch||typeof patch!=="object")return false;
  closeActivePanel();
  const previousOption=normalized[index];
  const nextOption=normalizeOption({...previousOption,...patch});
  normalized[index]=nextOption;
  const wasSelected=Object.is(selectedValue,currentValue);
  if(wasSelected)selectedValue=nextOption.value;
  sync();
  if(notify&&wasSelected&&!Object.is(currentValue,nextOption.value))onChange(nextOption.value);
  return true;
 };

 return {
  element:field,
  valueElement:valueNode,
  getValue:()=>selectedValue,
  getOptions:()=>normalized.map(({description,...option})=>description?{...option,description}:option),
  setValue:next=>setValue(next),
  setOptions,
  updateOption,
  destroy:()=>{
   closeActivePanel();
   clearTypeahead();
   controller.abort();
  }
 };
}
