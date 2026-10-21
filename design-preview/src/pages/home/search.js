// Home search: inline results, fullscreen search, local index and recent
// searches. All state stays on this page; navigation is supplied by the caller.
import {createSearchInput} from "../../components/search.js";
import {createInputClear,syncInputClear} from "../../components/input-clear.js";
import {createSearchModel,createInlineSearchPanel,createFullscreenSearch,createShortcutKeycaps} from "../../components/search-surface.js";
import {reducedMotion,motionDuration} from "../../foundations/motion.js";
import {ROUTE_CATALOG as routeCatalog,buildSearchIndex} from "./routes.js";

export function createHomeSearch({get,glass,motion,overlays,toast,close,homeColumn,targetChrome,navigate}){
let inlineShortcutRow=null;
const searchNode=get("I14445:3354;14420:2221;14420:2195");
searchNode.replaceChildren();const input=createSearchInput({label:"Search sites, devices and people",placeholder:"Search sites, devices, people, or anything…"});
// The clear button is shared with fullscreen search and other inputs. Keep it
// inside the existing text row so it never changes the field's 46px height.
const inlineClear=createInputClear({label:"Clear search",onClear:()=>{input.value="";syncInlineClear("");if(inlineSearch)inlineSearch.content.setQuery("");else openInlineSearch();syncInlineSearchActive();input.focus({preventScroll:true});}});
searchNode.append(input);
const sceneShortcut=get("I14445:3354;14420:2221;14420:2197");
if(sceneShortcut){
 sceneShortcut.classList.add("scene-search-shortcut");
 // The exported mac glyphs cannot express Ctrl/Cmd across platforms. Replace
 // the whole group with the same keycaps used by the sidebar and search panel,
 // so colour, background, type style and spacing have one owner.
 sceneShortcut.replaceChildren(createShortcutKeycaps());
 // The exported group was sized for the single mac cap. The shared component
 // measures 54px on Windows; keep its right edge on the field's 20px inset.
 const shortcutRow=sceneShortcut.parentElement;
 if(shortcutRow){
  const fieldRow=shortcutRow.parentElement;
  if(fieldRow){
   fieldRow.append(shortcutRow);
   // The exported right-content box is 35px wide, sized for a single glyph.
   // The shared Windows key pair is wider, so pin its right edge to the
   // field's 20px inset and let the host grow leftwards. Keep `left:auto`
   // explicit: the scene adapter otherwise leaves the export's left:945px.
   shortcutRow.style.left="auto";
   shortcutRow.style.right="20px";
   // The inner exported group is absolutely positioned too. Widen the outer
   // row explicitly and let the group fill it, otherwise both boxes collapse
   // to the export's 35px and the keycaps spill past the field.
   shortcutRow.style.width="max-content";
   // Absolute children do not contribute to `max-content`; make the exported
   // group participate in the row's intrinsic width so the shared keycaps
   // (rather than the old 35px glyph) define the box.
   sceneShortcut.style.position="relative";
   sceneShortcut.style.width="max-content";
  }
  // The input row also owns the text field; keep the shortcut inside its right
  // inset instead of the former 51px export column.
  const textNode=fieldRow?.querySelector(':scope > .node[data-name="search field"]');
  if(textNode)textNode.style.width="calc(100% - 118px)";
  inlineShortcutRow=shortcutRow;
  if(fieldRow){
   inlineClear.classList.add("scene-search-clear");
   fieldRow.append(inlineClear);
  }
 }
}
const searchAnchor=get("14445:3354");
function syncInlineClear(value){
 const visible=syncInputClear(inlineClear,value);
 if(inlineShortcutRow)inlineShortcutRow.style.visibility=visible?"hidden":"";
 return visible;
}
let searchModel=null;
let inlineSearch=null;
let fullscreenSearch=null;
let searchRestoreFocus=null;
function openSearchResult(item,query){
 ensureSearchModel().remember(query??item.title);
 if(item.route&&routeCatalog[item.route]){
  close(true);
  closeInlineSearch(true);
  closeFullscreenSearch(true);
  navigate(item.route);
  return;
 }
 toast(`${item.title} · Coming soon`);
}
function ensureSearchModel(){
 // Build the shared index only when the user opens search, after assembly.
 searchModel??=createSearchModel({items:buildSearchIndex()});
 return searchModel;
}
function closeInlineSearch(immediate=false){
 const panel=inlineSearch?.panel;
 inlineSearch=null;
 input.setAttribute("aria-expanded","false");
 input.removeAttribute("aria-controls");
 input.removeAttribute("aria-activedescendant");
 if(panel){if(immediate)motion.closePanel(panel,true);else motion.closePanel(panel);}
}
function openInlineSearch(){
 if(fullscreenSearch)return;
 // The panel can be closed by scrolling, selection or a closing animation.
 // Re-focusing an input with a stale "open" flag must still recreate it.
 if(inlineSearch?.panel?.isConnected){input.focus();return;}
 inlineSearch=null;
 input.setAttribute("aria-expanded","true");
 const created=createInlineSearchPanel({
  anchor:searchAnchor,model:ensureSearchModel(),items:buildSearchIndex(),glass,
  onOpen:(item,query)=>{openSearchResult(item,query);if(!item.history)closeInlineSearch();},
  onHistory:applyInlineHistory,
  onRequestClose:()=>closeInlineSearch()
 });
 inlineSearch=created;
 overlays.append(created.panel);
 // The panel is owned by the field's focus state. A stale scroll-close must
 // not leave an "expanded" field with no visible results.
 input.setAttribute("aria-expanded","true");
 input.setAttribute("aria-controls",created.content.listbox.id);
 motion.openPanel(created.panel,searchAnchor);
 created.content.setQuery(input.value);
 positionInlineSearch();
}
function applyInlineHistory(query){
 input.value=query;
 syncInlineValue();
 input.focus({preventScroll:true});
}
function applyFullscreenHistory(query){
 if(!fullscreenSearch)return;
 fullscreenSearch.input.value=query;
 fullscreenSearch.update(query);
 fullscreenSearch.input.focus({preventScroll:true});
}
function positionInlineSearch(){inlineSearch?.position();}
function syncInlineSearchActive(){
 if(!inlineSearch)return;
 const id=inlineSearch.content.activeId;
 if(id)input.setAttribute("aria-activedescendant",id);
 else input.removeAttribute("aria-activedescendant");
}
input.setAttribute("autocomplete","off");
input.setAttribute("spellcheck","false");
input.setAttribute("role","combobox");
input.setAttribute("aria-autocomplete","list");
input.setAttribute("aria-expanded","false");
input.addEventListener("focus",()=>openInlineSearch());
// IME composition can update the visible preedit before a regular `input`
// event. Keep the result surface attached for the whole composition.
input.addEventListener("compositionstart",()=>openInlineSearch());
input.addEventListener("compositionupdate",()=>{if(!inlineSearch)openInlineSearch();});
input.addEventListener("blur",event=>{
 const next=event.relatedTarget;
 if(next&&(searchNode.contains(next)||inlineSearch?.panel?.contains(next)))return;
 // Focus leaves the search surface. Closing here keeps aria-expanded honest;
 // clicking the field or typing reopens from the same value.
 closeInlineSearch();
});
input.addEventListener("click",()=>openInlineSearch());
input.addEventListener("input",()=>{
 syncInlineClear(input.value);
 if(!inlineSearch)openInlineSearch();
 inlineSearch?.content.setQuery(input.value);
 syncInlineSearchActive();
});
// Programmatic fills (history, clear during a pending animation) must update
// both the value and the clear affordance in one place.
const syncInlineValue=()=>{syncInlineClear(input.value);inlineSearch?.content.setQuery(input.value);syncInlineSearchActive();};
input.addEventListener("keydown",event=>{
 if(event.key==="ArrowDown"||event.key==="ArrowUp"){
  event.preventDefault();
  if(!inlineSearch)openInlineSearch();
  inlineSearch?.content.move(event.key==="ArrowDown"?1:-1);
  syncInlineSearchActive();
 }else if(event.key==="Enter"){
  if(inlineSearch?.content.activate())event.preventDefault();
 }else if(event.key==="Escape"){
  if(!inlineSearch)return;
  event.preventDefault();
  event.stopPropagation();
  closeInlineSearch();
  input.focus();
 }
});
addEventListener("resize",()=>positionInlineSearch());
homeColumn.addEventListener("scroll",()=>{if(inlineSearch)closeInlineSearch(true);},{passive:true});
function openFullscreenSearch(){
 if(fullscreenSearch)return;
 close(true);
 closeInlineSearch(true);
 const previousFocus=document.activeElement;
 const scrollTop=homeColumn.scrollTop;
 homeColumn.inert=true;
 const previousOverflow=homeColumn.style.overflow;
 homeColumn.style.overflow="hidden";
 searchRestoreFocus=previousFocus instanceof HTMLElement?previousFocus:null;
 const created=createFullscreenSearch({
  model:ensureSearchModel(),items:buildSearchIndex(),glass,
  onHistory:applyFullscreenHistory,
  onOpen:(item,query)=>{
   openSearchResult(item,query);
   if(!item.history)closeFullscreenSearch();
  },
  onRequestClose:()=>closeFullscreenSearch()
 });
 fullscreenSearch=created;
 overlays.append(created.root);
 if(!reducedMotion()){
  created.root.dataset.entering="";
  setTimeout(()=>created.root?.removeAttribute("data-entering"),motionDuration("--wd-motion-panel")+40);
 }
 created.input.value=input.value;
 created.update(input.value);
 created.input.focus({preventScroll:true});
 homeColumn.scrollTop=scrollTop;
 created.root._restoreScroll=scrollTop;
 created.root._restoreOverflow=previousOverflow;
}
function closeFullscreenSearch(immediate=false){
 const entry=fullscreenSearch;
 if(!entry)return;
 fullscreenSearch=null;
 const restore=entry.root._restoreScroll;
 const restoreOverflow=entry.root._restoreOverflow;
 const finish=()=>{
  entry.root._onClose?.();
  entry.root.remove();
  homeColumn.inert=false;
  homeColumn.style.overflow=restoreOverflow??"";
  homeColumn.scrollTop=restore??homeColumn.scrollTop;
  searchRestoreFocus?.focus({preventScroll:true});
  searchRestoreFocus=null;
 };
 if(immediate||reducedMotion()){finish();return;}
 entry.root.dataset.closing="true";
 const animation=entry.root.animate([{opacity:1},{opacity:1}],{duration:motionDuration("--wd-motion-panel-exit"),fill:"forwards"});
 animation.finished.catch(()=>{}).finally(finish);
}
targetChrome.search.addEventListener("click",()=>openFullscreenSearch());
document.addEventListener("keydown",event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
  event.preventDefault();
  if(fullscreenSearch)closeFullscreenSearch();else openFullscreenSearch();
 }
});
document.addEventListener("pointerdown",event=>{
 if(!inlineSearch)return;
 if(inlineSearch.panel.contains(event.target)||searchAnchor.contains(event.target))return;
 closeInlineSearch();
});
 return {
  input,
  closeAll(immediate=false){closeInlineSearch(immediate);closeFullscreenSearch(immediate);}
 };
}
