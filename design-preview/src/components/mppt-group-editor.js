import {createTextElement as text} from "../foundations/dom.js";
import {createMaskedIcon,assetURL,opaqueMaskURL} from "./icons.js";
import {createStandardButton} from "./controls.js";
import {createSelectControl} from "./select-control.js";
import {menuList,menuRow,mountMenu} from "./menu-popover.js";
import {menuEndAlign} from "./popover.js";

export const MPPT_PARALLEL_HINT="Shares input current across MPPT channels for more energy from parallel PV strings.";

export function mpptGroupLabel(members,activeIndices=null){
 const ordinals=(members||[]).map(index=>{
  const ordinal=activeIndices?activeIndices.indexOf(Number(index)):Number(index);
  return ordinal+1;
 });
 if(!ordinals.length)return "";
 return `MPPT #${ordinals[0]}${ordinals.slice(1).map(value=>` & #${value}`).join("")}`;
}

/**
 * Shared MPPT parallel-group editor used by Inverter settings and the setup
 * wizard. The model owns the group points; this component owns the picker,
 * assignment guards, danger menu and focus/close behavior.
 */
export function createMpptGroupEditor({
 model,
 glass,
 registerPanel,
 closePanels,
 togglePanel,
 addDisposer=()=>{},
 onChange=()=>{},
 autoOpen=false
}={}){
 const host=text("div","isw-mppt-groups");
 host.dataset.iswMpptGroupEditor="";
 let draftSelect=null;
 let disposed=false;

 const surfaceButton=(button,disposeList)=>{
  if(!glass?.addSurface)return;
  glass.addSurface({host:button,radius:18});
  disposeList.push(()=>glass.removeSurface(button));
 };

 const buildGroupPicker=(anchor,groupId=null)=>{
  if(!anchor||!registerPanel)return null;
  const groups=model.mpptGroups();
  const editing=groupId!==null;
  const currentGroup=editing?groups.find(group=>group.id===groupId):null;
  const activeIndices=model.mpptIndices();
  const claimed=new Set(groups
   .filter(group=>group.id!==groupId)
   .flatMap(group=>group.members));
  const selected=new Set(currentGroup?.members||[]);
  const panel=text("div","popover popover--menu wd-select-popover isw-mppt-picker-popover");
  const picker=text("div","wd-menu wd-menu--no-heading isw-mppt-picker");
  const options=text("div","wd-menu-list isw-mppt-picker-options");
  options.setAttribute("role","listbox");
  options.setAttribute("aria-label","Select two MPPTs for this group");
  options.setAttribute("aria-multiselectable","true");
  const rows=[];
  for(const index of activeIndices){
   const displayIndex=activeIndices.indexOf(index)+1;
   const row=menuRow(`MPPT #${displayIndex}`,{showCheck:false});
   row.classList.add("isw-mppt-picker-option");
   row.dataset.iswMpptPickerIndex=String(index);
   row.setAttribute("role","option");
   row.setAttribute("aria-selected",String(selected.has(index)));
   const unavailable=claimed.has(index);
   row.setAttribute("aria-disabled",String(unavailable));
   row.disabled=unavailable;
   row.classList.toggle("is-disabled",unavailable);
   row.classList.toggle("is-selected",selected.has(index));
   const mark=text("span","isw-radio-mark");
   mark.setAttribute("aria-hidden","true");
   row.append(mark);
   rows.push(row);
   options.append(row);
  }
  const actions=text("div","isw-mppt-picker-actions");
  const cancel=createStandardButton({label:"Cancel"});
  const save=createStandardButton({label:"Save",variant:"primary"});
  actions.append(cancel,save);
  picker.append(options,actions);
  panel.append(picker);
  panel._wdFade=picker;
  const syncSelection=()=>{
   save.disabled=selected.size!==2;
   for(const row of rows){
    const index=Number(row.dataset.iswMpptPickerIndex);
    const active=selected.has(index);
    row.classList.toggle("is-selected",active);
    row.setAttribute("aria-selected",String(active));
   }
  };
  for(const row of rows){
   if(row.disabled)continue;
   row.addEventListener("click",()=>{
    const index=Number(row.dataset.iswMpptPickerIndex);
    if(selected.has(index)){
     selected.delete(index);
    }else{
     if(selected.size>=2)selected.delete(selected.values().next().value);
     selected.add(index);
    }
    syncSelection();
   });
  }
  syncSelection();
  const buttonDisposers=[];
  surfaceButton(cancel,buttonDisposers);
  surfaceButton(save,buttonDisposers);
  const mounted=registerPanel(panel,anchor,{
   label:"Select MPPT group",
   radius:30,
   width:220,
   align:"end",
   alignRight:menuEndAlign(anchor,30)
  });
  const previousClose=mounted._onClose;
  mounted._onClose=()=>{
   model.S.mpptPickerOpen=false;
   previousClose?.();
   setTimeout(()=>{
    for(const dispose of buttonDisposers.splice(0))dispose();
    if(!disposed&&!model.mpptGroups().length)onChange({reason:"picker-close"});
   },0);
  };
  cancel.addEventListener("click",()=>closePanels?.(true));
  save.addEventListener("click",()=>{
   if(selected.size!==2)return;
   const members=[...selected].sort((left,right)=>left-right);
   const changed=editing?model.replaceMpptGroup(groupId,members):model.addMpptGroup(members);
   if(!changed)return;
   closePanels?.(true);
   onChange({
    reason:"group-change",
    focus:{
     type:"mpptGroup",
     value:String(activeIndices.indexOf(members[0])+1)
    }
   });
  });
  requestAnimationFrame(()=>{
   const first=rows.find(row=>row.classList.contains("is-selected"))||rows.find(row=>!row.disabled);
   first?.focus({preventScroll:true});
  });
  return mounted;
 };

 const groups=model.mpptGroups();
 const activeIndices=model.mpptIndices();
 const groupedMembers=groups.reduce((total,group)=>total+group.members.length,0);
 const canAddGroup=model.S.mppt.parallel&&model.capabilities.mpptCount>2&&groups.length>0&&model.capabilities.mpptCount-groupedMembers>=2;

 if(!groups.length&&!model.S.mpptPickerOpen){
  const error=text("div","isw-mppt-group-error","At least one MPPT Group must be created","Footnote/Regular");
  error.setAttribute("role","alert");
  host.append(error);
 }

 for(const [index,group] of groups.entries()){
  const row=text("div","isw-row isw-mppt-group-row");
  row.dataset.iswMpptGroup=String(group.id);
  const copy=text("div","isw-row-copy");
  copy.append(text("div","isw-row-label",`MPPT Group ${index+1}`,"14/14 medium"));
  const controls=text("div","isw-mppt-group-control");
  const selectSlot=text("span","isw-mppt-group-select-slot");
  selectSlot.dataset.iswMpptGroupSelect=String(group.id);
  const moreSlot=text("span","isw-mppt-more-slot");
  moreSlot.dataset.iswMpptMore=String(group.id);
  controls.append(selectSlot,moreSlot);
  row.append(copy,controls);
  host.append(row);
 }

 if(!groups.length){
  const row=text("div","isw-row isw-mppt-group-row is-placeholder");
  row.dataset.iswMpptGroup="draft";
  const copy=text("div","isw-row-copy");
  copy.append(text("div","isw-row-label","MPPT Group 1","14/14 medium"));
  const controls=text("div","isw-mppt-group-control");
  const selectSlot=text("span","isw-mppt-group-select-slot");
  selectSlot.dataset.iswMpptGroupSelect="draft";
  const moreSlot=text("span","isw-mppt-more-slot");
  moreSlot.dataset.iswMpptMore="draft";
  controls.append(selectSlot,moreSlot);
  row.append(copy,controls);
  host.append(row);
 }

 if(canAddGroup){
  const row=text("div","isw-mppt-add-row");
  const slot=text("span","");
  slot.dataset.iswMpptAdd="";
  row.append(slot);
  host.append(row);
 }

 for(const slot of host.querySelectorAll("[data-isw-mppt-add]")){
  const button=createStandardButton({
   label:"Add MPPT group",
   iconOnly:true,
   className:"isw-mppt-add",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"isw-mppt-add-icon")
  });
  button.dataset.iswMpptAdd="";
  const disposers=[];
  surfaceButton(button,disposers);
  addDisposer(()=>disposers.splice(0).forEach(dispose=>dispose()));
  button.addEventListener("click",()=>{
   const claimed=new Set(model.mpptGroups().flatMap(group=>group.members));
   const remaining=model.mpptIndices().filter(index=>!claimed.has(index));
   if(remaining.length!==2)return;
   if(!model.addMpptGroup(remaining))return;
   onChange({
    reason:"group-add",
    focus:{
     type:"mpptGroup",
     value:String(model.mpptIndices().indexOf(remaining[0])+1)
    }
   });
  });
  slot.replaceWith(button);
 }

 for(const slot of host.querySelectorAll("[data-isw-mppt-group-select]")){
  const rawId=slot.dataset.iswMpptGroupSelect;
  const groupId=rawId==="draft"?null:Number(rawId);
  const group=groupId===null?null:groups.find(item=>item.id===groupId);
  if(groupId!==null&&!group)continue;
  const groupIndex=groupId===null?0:groups.findIndex(item=>item.id===groupId);
  const value=group?mpptGroupLabel(group.members,activeIndices):"";
  const control=createSelectControl({
   label:`MPPT Group ${groupIndex+1}`,
   value,
   options:value?[{value,label:value}]:[],
   variant:"adaptive",
   className:"isw-mppt-group-select",
   placeholder:"Select MPPT",
   placeholderClassName:"wd-select-placeholder",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   panelBuilder:({field})=>buildGroupPicker(field,groupId),
   ariaLabel:currentLabel=>`MPPT Group ${groupIndex+1}: ${currentLabel||"Select MPPT"}`
  });
  control.element.dataset.iswMpptGroupSelect=rawId;
  slot.replaceWith(control.element);
  addDisposer(()=>control.destroy());
  if(rawId==="draft")draftSelect=control.element;
 }

 for(const slot of host.querySelectorAll("[data-isw-mppt-more]")){
  if(slot.dataset.iswMpptMore==="draft"){
   const disabled=createStandardButton({
    label:"Actions for MPPT Group 1",
    iconOnly:true,
    className:"isw-mppt-more",
    icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"isw-mppt-more-icon")
   });
   disabled.disabled=true;
   disabled.dataset.iswMpptMore="draft";
   const disposers=[];
   surfaceButton(disabled,disposers);
   addDisposer(()=>disposers.splice(0).forEach(dispose=>dispose()));
   slot.replaceWith(disabled);
   continue;
  }
  const groupId=Number(slot.dataset.iswMpptMore);
  const group=groups.find(item=>item.id===groupId);
  if(!group)continue;
  const groupIndex=groups.findIndex(item=>item.id===groupId);
  const button=createStandardButton({
   label:`Actions for MPPT Group ${groupIndex+1}`,
   iconOnly:true,
   className:"isw-mppt-more",
   icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"isw-mppt-more-icon")
  });
  button.dataset.iswMpptMore=String(group.id);
  const disposers=[];
  surfaceButton(button,disposers);
  addDisposer(()=>disposers.splice(0).forEach(dispose=>dispose()));
  slot.replaceWith(button);
  button.addEventListener("click",()=>{
   if(!registerPanel)return;
   togglePanel?.(button,()=>{
    const panel=text("div","popover popover--menu isw-mppt-group-popover");
    const list=menuList();
    const row=menuRow("Delete group",{
     iconNode:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"isw-mppt-delete-icon"),
     showCheck:false,
     onSelect:()=>{
      closePanels?.(true);
      model.removeMpptGroup(group.id);
      onChange({
       reason:"group-remove",
       focus:model.mpptGroups().length?{type:"mpptAdd"}:{type:"mpptGroupDraft"}
      });
     }
    });
    row.classList.add("is-danger");
    list.append(row);
    mountMenu(panel,{label:`Actions for MPPT Group ${groupIndex+1}`,children:[list]});
    return registerPanel(panel,button,{
     label:`Actions for MPPT Group ${groupIndex+1}`,
     radius:30,
     width:180,
     align:"end",
     alignRight:menuEndAlign(button,30)
    });
   });
  });
 }

 if(autoOpen){
  requestAnimationFrame(()=>draftSelect?.click());
 }

 return {
  element:host,
  destroy(){
   disposed=true;
  }
 };
}
