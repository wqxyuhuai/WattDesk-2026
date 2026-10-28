// Plants list and `/plants/:id` preview surface.
// Everything here is client-side: sample rows from ./data.js, filters, sorting,
// column visibility and bookmarks stay in this module (bookmarks persist in
// localStorage). There is no backend or permission model, and the detail
// surface is explicitly a placeholder rather than invented device controls.
import {applyTypeStyle} from "../../foundations/typography.js";
import {assetURL,opaqueMaskURL} from "../../components/icons.js";
import {menuHeading,menuList,menuRow,mountMenu} from "../../components/menu-popover.js";
import {prepareControlStates,prepareIconMasks} from "../../components/control-states.js";
import {createSearchField} from "../../components/search-surface.js";
import {motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";
import {
 COMPANIES,CONNECTION_META,DEVICES,HEALTH_META,PLANT_TYPES,PLANTS,STATUS_META,UNASSIGNED_TOOLTIP,
 companyLabel,deviceLabel,distributorLabel,plantById,typeLabel
} from "./data.js";

const BOOKMARK_KEY="wattdesk.plants.bookmarks.v1";
const DEFAULT_DIR={name:"asc",power:"desc",status:"asc",firmware:"desc",updated:"desc"};

// Column order is the single source for the header, the colgroup and the
// "Columns" menu. The bookmark is its own leading control column: it owns the
// left edge of both the table and its header, so the title "Plants" starts on
// that same line. Connection is a compact icon immediately before the name,
// because the two are read together as one identity block.
const DEFAULT_HIDDEN=["company","type"];
const COLUMNS=[
 {id:"bookmark",label:"Bookmark",control:true,width:"32px",fixed:true,locked:true},
 // Connection has no visible header label and no text in the row.
 {id:"connection",label:"Connection",width:"28px",fixed:true,iconOnly:true,locked:true},
 // Minimum widths preserve every label and the full SN. The value columns stay
 // close to their content so each group reads as one unit; the name carries
 // most of the elastic width because it is the only truncating field, and the
 // right-hand columns still receive a share so the row keeps moving when the
 // panel grows instead of parking the spare width on the left.
 {id:"name",label:"Plant name",sortable:true,width:"176px",grow:1,wideGrow:.7,locked:true},
 {id:"device",label:"Device",sortable:false,width:"112px",grow:.035,wideGrow:.1},
 // The header label and its sort caret decide the minimum, not the value, so
 // "Power" never truncates to "Po…" in the narrow layout.
 {id:"power",label:"Power",sortable:true,width:"60px",grow:.015,wideGrow:.04},
 {id:"status",label:"Status",sortable:true,width:"132px",grow:.045,wideGrow:.16},
 {id:"sn",label:"SN",sortable:false,width:"196px",grow:.045,wideGrow:.2,mono:true},
 // The visible header is shortened to "Firmware" so the column can stay as
 // narrow as its versions; the Columns menu keeps the full "Software version"
 // name, and the header button carries it as its accessible label.
 {id:"firmware",label:"Software version",headerLabel:"Firmware",sortable:true,width:"84px",wideGrow:.08,mono:true},
 // The time column keeps only the width its header and time strings need, so
 // the group sits against the table's right edge instead of expanding into a
 // wide empty strip. The reclaimed width stays with the middle columns.
 {id:"updated",label:"Last update",sortable:true,width:"112px",wideGrow:.12},
 {id:"company",label:"Company",sortable:false,width:"176px",fixed:true},
 {id:"type",label:"Plant type",sortable:false,width:"124px",fixed:true}
];

const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:"base"});

function readBookmarks(){
 try{
  const raw=JSON.parse(localStorage.getItem(BOOKMARK_KEY)||"[]");
  return new Set(Array.isArray(raw)?raw.filter(id=>typeof id==="string"):[]);
 }catch{
  return new Set();
 }
}

function writeBookmarks(set){
 try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify([...set]));}catch{/* session only */}
}

function maskedIcon(url,className="plants-icon"){
 const icon=document.createElement("span");
 icon.className=`plants-icon ${className}`.trim();
 icon.setAttribute("aria-hidden","true");
 icon.style.setProperty("--icon-mask",`url("${url}")`);
 return icon;
}

function text(tag,className,content,typeStyle){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(content!==undefined)node.textContent=content;
 if(typeStyle)applyTypeStyle(node,typeStyle);
 return node;
}

function versionParts(value){
 return String(value||"").replace(/^v/i,"").split(/[^0-9]+/).filter(Boolean).map(Number);
}

function compareVersion(a,b){
 const left=versionParts(a),right=versionParts(b);
 for(let index=0;index<Math.max(left.length,right.length);index+=1){
  const delta=(left[index]||0)-(right[index]||0);
  if(delta)return delta;
 }
 return 0;
}

function formatPower(plant){
 if(plant.powerKw===null||plant.powerKw===undefined)return "--";
 const magnitude=Math.abs(plant.powerKw).toFixed(1);
 if(!plant.powerSigned)return magnitude;
 if(plant.powerKw>0)return `+${magnitude}`;
 if(plant.powerKw<0)return `−${magnitude}`;
 return magnitude;
}

function absoluteTime(minutes){
 const date=new Date(Date.now()-minutes*60000);
 const pad=value=>String(value).padStart(2,"0");
 return `${date.getFullYear()}/${pad(date.getMonth()+1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Older rows switch to a compact date so the column never truncates; the full
// timestamp stays available through the cell title.
function compactTime(minutes){
 const date=new Date(Date.now()-minutes*60000);
 const pad=value=>String(value).padStart(2,"0");
 return `${pad(date.getMonth()+1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function relativeTime(minutes){
 if(minutes<1)return "Just now";
 if(minutes<60)return `${minutes} min ago`;
 if(minutes<1440){
  const hours=Math.round(minutes/60);
  return `${hours} hour${hours===1?"":"s"} ago`;
 }
 return compactTime(minutes);
}

// Connection icons come from the supplied 24px exports. They mix neutral ink
// with a semantic red, so they are inlined instead of used as a monochrome CSS
// mask: "ink" and "muted" bars follow the theme's primary label colour (white
// in dark, black in light), while "alert" keeps the artwork's native red.
const ICON_NS="http://www.w3.org/2000/svg";
const CONNECTION_PATHS=Object.freeze({
 online:[
  ["ink","M1.5 12.24C1.5 11.6021 2.01301 11.085 2.64583 11.085H3.79167C4.42449 11.085 4.9375 11.6021 4.9375 12.24V19.17C4.9375 19.8079 4.42449 20.325 3.79167 20.325H2.64583C2.01301 20.325 1.5 19.8079 1.5 19.17V12.24Z"],
  ["ink","M7.22917 9.93C7.22917 9.29211 7.74217 8.775 8.375 8.775H9.52083C10.1537 8.775 10.6667 9.29211 10.6667 9.93V19.17C10.6667 19.8079 10.1537 20.325 9.52083 20.325H8.375C7.74217 20.325 7.22917 19.8079 7.22917 19.17V9.93Z"],
  ["ink","M12.9583 7.62C12.9583 6.98211 13.4713 6.465 14.1042 6.465H15.25C15.8828 6.465 16.3958 6.98211 16.3958 7.62V19.17C16.3958 19.8079 15.8828 20.325 15.25 20.325H14.1042C13.4713 20.325 12.9583 19.8079 12.9583 19.17V7.62Z"],
  ["ink","M18.6875 4.155C18.6875 3.51711 19.2005 3 19.8333 3H20.9792C21.612 3 22.125 3.51711 22.125 4.155V19.17C22.125 19.8079 21.612 20.325 20.9792 20.325H19.8333C19.2005 20.325 18.6875 19.8079 18.6875 19.17V4.155Z"]
 ],
 partial:[
  ["ink","M19.8333 3C19.2005 3 18.6875 3.51711 18.6875 4.155V19.17C18.6875 19.8079 19.2005 20.325 19.8333 20.325H20.9792C21.612 20.325 22.125 19.8079 22.125 19.17V4.155C22.125 3.51711 21.612 3 20.9792 3H19.8333Z"],
  ["ink","M12.9583 7.62C12.9583 6.98211 13.4713 6.465 14.1042 6.465H15.25C15.8828 6.465 16.3958 6.98211 16.3958 7.62V19.17C16.3958 19.8079 15.8828 20.325 15.25 20.325H14.1042C13.4713 20.325 12.9583 19.8079 12.9583 19.17V7.62Z"],
  ["muted","M2.64583 15.705C2.01301 15.705 1.5 16.2221 1.5 16.86V19.17C1.5 19.8079 2.01301 20.325 2.64583 20.325H3.79167C4.42449 20.325 4.9375 19.8079 4.9375 19.17V16.86C4.9375 16.2221 4.42449 15.705 3.79167 15.705H2.64583Z"],
  ["muted","M8.375 15.705C7.74217 15.705 7.22917 16.2221 7.22917 16.86V19.17C7.22917 19.8079 7.74217 20.325 8.375 20.325H9.52083C10.1537 20.325 10.6667 19.8079 10.6667 19.17V16.86C10.6667 16.2221 10.1537 15.705 9.52083 15.705H8.375Z"],
  ["alert","M8.90437 12.7736C9.24485 12.4304 9.24485 11.874 8.90437 11.5308L7.28401 9.89745L8.90437 8.26413C9.24485 7.92093 9.24485 7.3645 8.90437 7.0213C8.5639 6.6781 8.01188 6.6781 7.6714 7.0213L6.05105 8.65462L4.43069 7.0213C4.09021 6.6781 3.53819 6.6781 3.19772 7.0213C2.85724 7.3645 2.85725 7.92093 3.19772 8.26413L4.81808 9.89745L3.19772 11.5308C2.85724 11.874 2.85724 12.4304 3.19772 12.7736C3.53819 13.1168 4.09021 13.1168 4.43069 12.7736L6.05105 11.1403L7.67141 12.7736C8.01188 13.1168 8.5639 13.1168 8.90437 12.7736Z"]
 ],
 offline:[
  ["muted","M19.8333 3C19.2005 3 18.6875 3.51711 18.6875 4.155V19.17C18.6875 19.8079 19.2005 20.325 19.8333 20.325H20.9792C21.612 20.325 22.125 19.8079 22.125 19.17V4.155C22.125 3.51711 21.612 3 20.9792 3H19.8333Z"],
  ["muted","M12.9583 7.62C12.9583 6.98211 13.4713 6.465 14.1042 6.465H15.25C15.8828 6.465 16.3958 6.98211 16.3958 7.62V19.17C16.3958 19.8079 15.8828 20.325 15.25 20.325H14.1042C13.4713 20.325 12.9583 19.8079 12.9583 19.17V7.62Z"],
  ["muted","M2.64583 15.705C2.01301 15.705 1.5 16.2221 1.5 16.86V19.17C1.5 19.8079 2.01301 20.325 2.64583 20.325H3.79167C4.42449 20.325 4.9375 19.8079 4.9375 19.17V16.86C4.9375 16.2221 4.42449 15.705 3.79167 15.705H2.64583Z"],
  ["muted","M8.375 15.705C7.74217 15.705 7.22917 16.2221 7.22917 16.86V19.17C7.22917 19.8079 7.74217 20.325 8.375 20.325H9.52083C10.1537 20.325 10.6667 19.8079 10.6667 19.17V16.86C10.6667 16.2221 10.1537 15.705 9.52083 15.705H8.375Z"],
  ["alert","M8.90437 12.7736C9.24485 12.4304 9.24485 11.874 8.90437 11.5308L7.28401 9.89745L8.90437 8.26413C9.24485 7.92093 9.24485 7.3645 8.90437 7.0213C8.5639 6.6781 8.01188 6.6781 7.6714 7.0213L6.05105 8.65462L4.43069 7.0213C4.09021 6.6781 3.53819 6.6781 3.19772 7.0213C2.85724 7.3645 2.85725 7.92093 3.19772 8.26413L4.81808 9.89745L3.19772 11.5308C2.85724 11.874 2.85724 12.4304 3.19772 12.7736C3.53819 13.1168 4.09021 13.1168 4.43069 12.7736L6.05105 11.1403L7.67141 12.7736C8.01188 13.1168 8.5639 13.1168 8.90437 12.7736Z"]
 ],
 unbound:[
  ["alert","M12 1.5C17.799 1.5 22.5 6.20101 22.5 12C22.5 17.799 17.799 22.5 12 22.5C6.20101 22.5 1.5 17.799 1.5 12C1.5 6.20101 6.20101 1.5 12 1.5ZM6.51562 10.7998C5.81664 10.7998 5.25 11.3373 5.25 12C5.25 12.6627 5.81664 13.2002 6.51562 13.2002H17.4844C18.1834 13.2002 18.75 12.6627 18.75 12C18.75 11.3373 18.1834 10.7998 17.4844 10.7998H6.51562Z"]
 ]
});
const BOOKMARK_PATH="M21 11.0975V16.0909C21 19.1875 21 20.7358 20.2659 21.4123C19.9158 21.735 19.4739 21.9377 19.0031 21.9915C18.016 22.1045 16.8633 21.0849 14.5578 19.0458C13.5388 18.1445 13.0292 17.6938 12.4397 17.5751C12.1494 17.5166 11.8506 17.5166 11.5603 17.5751C10.9708 17.6938 10.4612 18.1445 9.44216 19.0458C7.13673 21.0849 5.98402 22.1045 4.99692 21.9915C4.52615 21.9377 4.08421 21.735 3.73411 21.4123C3 20.7358 3 19.1875 3 16.0909V11.0975C3 6.80891 3 4.6646 4.31802 3.3323C5.63604 2 7.75736 2 12 2C16.2426 2 18.364 2 19.682 3.3323C21 4.6646 21 6.80891 21 11.0975ZM8.25 6C8.25 5.58579 8.58579 5.25 9 5.25H15C15.4142 5.25 15.75 5.58579 15.75 6C15.75 6.41421 15.4142 6.75 15 6.75H9C8.58579 6.75 8.25 6.41421 8.25 6Z";

function svgIcon(className,size){
 const svg=document.createElementNS(ICON_NS,"svg");
 svg.setAttribute("viewBox","0 0 24 24");
 svg.setAttribute("width",String(size));
 svg.setAttribute("height",String(size));
 svg.setAttribute("fill","none");
 svg.setAttribute("aria-hidden","true");
 svg.setAttribute("focusable","false");
 for(const token of className.split(/\s+/).filter(Boolean))svg.classList.add(token);
 return svg;
}

// `alertFill` lets the same supplied artwork run in a semantic colour instead
// of the export's own red; the Status column reuses the unbound signal glyph
// in its neutral ink.
function connectionGlyph(connection,{size=18,className="plants-connection-glyph",alertFill="#FF4245"}={}){
 const svg=svgIcon(className,size);
 for(const [tone,d] of CONNECTION_PATHS[connection]){
  const path=document.createElementNS(ICON_NS,"path");
  path.setAttribute("d",d);
  path.setAttribute("fill",tone==="alert"?alertFill:"currentColor");
  if(tone==="muted")path.setAttribute("fill-opacity","0.3");
  svg.append(path);
 }
 return svg;
}

function bookmarkGlyph(){
 const svg=svgIcon("plants-bookmark-glyph",18);
 const path=document.createElementNS(ICON_NS,"path");
 path.setAttribute("d",BOOKMARK_PATH);
 path.setAttribute("fill","currentColor");
 path.setAttribute("fill-rule","evenodd");
 path.setAttribute("clip-rule","evenodd");
 svg.append(path);
 return svg;
}

function connectionOf(plant){
 return STATUS_META[plant.status]?.connection??"offline";
}

function healthOf(plant){
 if(plant.status==="unbound")return "unbound";
 if(plant.status==="normal")return "normal";
 return "attention";
}

export function createPlantsPage({glass,registerPanel,close,toast,onOpenPlant,onBackToList}){
 const element=document.createElement("section");
 element.className="plants-view";
 element.id="plants-view";
 element.hidden=true;
 element.setAttribute("aria-label","Plants");

 const state={
  query:"",
  companies:new Set(),
  types:new Set(),
  devices:new Set(),
  statuses:new Set(),
  sort:{key:"updated",dir:DEFAULT_DIR.updated},
  hidden:new Set(DEFAULT_HIDDEN),
  bookmarks:readBookmarks()
 };

 // ── Shell: header, toolbar, chips, table, empty ──────────────────────────
 const inner=text("div","plants-inner");

 const header=text("header","plants-header");
 const heading=text("div","plants-heading");
 const title=text("h1","plants-title","Plants","Subheadline/Emphasized");
 heading.append(title);
 const actions=text("div","plants-actions");
 // Standard neutral glass pill: the same 36px geometry, material and states as
 // the Home statistics period selector. Only the plus glyph is page-specific.
 const newButton=text("button","wd-button wd-button--pill wd-button--neutral plants-new");
 newButton.type="button";
 newButton.append(
  maskedIcon(assetURL("plants/plus.svg"),"plants-icon plants-icon--16"),
  text("span","plants-new-label","New plant")
 );
 newButton.addEventListener("click",()=>{
  toast("Plant creation is a preview in this build — no plant was created");
 });
 actions.append(newButton);
 header.append(heading,actions);

 const toolbar=text("div","plants-toolbar");
 // Shared search field: glyph, clear control and glass material all come from
 // `createSearchField`. Its compact size is the same 36px control as the
 // sidebar Quick search; only the width stays page-specific.
 const {field:searchShell,input}=createSearchField({
  glass,
  placeholder:"Search plants, installers or SN",
  label:"Search plants, installers or SN",
  className:"plants-search",
  // Match the sidebar Quick search rather than the 46px Home capsule.
  size:"compact",
  // Unlike the anchored Home/fullscreen search surfaces, this field narrows
  // the table below it instead of opening a result sheet, so it can use the
  // shared glass hover/press depth like the rest of the toolbar.
  scalable:true
 });
 input.setAttribute("role","searchbox");
 input.removeAttribute("aria-autocomplete");
 input.addEventListener("input",()=>{
  state.query=input.value;
  render();
 });

 // Filters, column display and refresh use the shared 36px circular glass
 // button. Only the activity dot stays page-specific.
 const filterTrigger=text("button","wd-button wd-button--pill wd-button--disc wd-button--neutral plants-icon-button");
 filterTrigger.type="button";
 filterTrigger.setAttribute("aria-label","Filters");
 filterTrigger.title="Filters";
 filterTrigger.dataset.dot="false";
 filterTrigger.append(maskedIcon(assetURL("plants/filter.svg"),"plants-icon plants-icon--16"));

 const columnTrigger=text("button","wd-button wd-button--pill wd-button--disc wd-button--neutral plants-icon-button");
 columnTrigger.type="button";
 columnTrigger.setAttribute("aria-label","Columns");
 columnTrigger.title="Columns";
 columnTrigger.dataset.dot="false";
 columnTrigger.append(maskedIcon(assetURL("plants/columns.svg"),"plants-icon plants-icon--16"));

 const toolbarSpacer=text("div","plants-toolbar-spacer");
 const refresh=text("button","wd-button wd-button--pill wd-button--disc wd-button--neutral plants-icon-button");
 refresh.type="button";
 refresh.setAttribute("aria-label","Refresh plants");
 refresh.title="Refresh plants";
 const refreshIcon=maskedIcon(assetURL("light/imgLinearArrowsRefresh.svg"),"plants-icon plants-icon--16");
 refresh.append(refreshIcon);

 const toolbarActions=text("div","plants-toolbar-actions");
 toolbarActions.append(filterTrigger,columnTrigger,refresh);
 toolbar.append(searchShell,toolbarSpacer,toolbarActions);

 const chips=text("div","plants-chips");
 chips.hidden=true;
 chips.setAttribute("role","group");
 chips.setAttribute("aria-label","Active filters");

 const scroll=text("div","plants-table-scroll");
 const table=text("table","plants-table");
 const caption=text("caption","plants-caption","Plants with connection and running status, power, firmware and last update.");
 const colgroup=document.createElement("colgroup");
 const thead=document.createElement("thead");
 const tbody=document.createElement("tbody");
 tbody.id="plants-rows";
 table.append(caption,colgroup,thead,tbody);
 scroll.append(table);

 const empty=text("div","plants-empty");
 empty.hidden=true;
 const emptyTitle=text("p","plants-empty-title",undefined,"Subheadline/Emphasized");
 const emptyBody=text("p","plants-empty-body",undefined,"Footnote/Regular");
 const emptyAction=text("button","wd-button wd-button--pill wd-button--neutral plants-empty-action","Clear filters");
 emptyAction.type="button";
 emptyAction.addEventListener("click",()=>{
  input.value="";
  state.query="";
  clearFilters();
 });
 empty.append(emptyTitle,emptyBody,emptyAction);

 // `/plants/:id` is a real location, but the detail surface is not designed
 // yet. Keep the route and refresh behaviour real, and label this surface
 // plainly as a preview placeholder instead of inventing device controls.
 const detail=text("section","plants-detail");
 detail.hidden=true;
 detail.setAttribute("aria-labelledby","plants-detail-title");
 const detailInner=text("div","plants-detail-inner");
 const backButton=text("button","wd-button wd-button--pill wd-button--neutral plants-detail-back","Back to Plants");
 backButton.type="button";
 backButton.addEventListener("click",()=>{
  if(onBackToList)onBackToList();
  else show();
 });
 const detailKicker=text("p","plants-detail-kicker","Plant","Caption1/Emphasized");
 const detailTitle=text("h1","plants-detail-title");
 detailTitle.id="plants-detail-title";
 const detailMeta=text("p","plants-detail-meta",undefined,"Footnote/Regular");
 const detailNote=text("p","plants-detail-note",undefined,"Footnote/Regular");
 detailInner.append(backButton,detailKicker,detailTitle,detailMeta,detailNote);
 detail.append(detailInner);

 inner.append(header,toolbar,chips,scroll,empty);
 element.append(inner,detail);

 glass.addSurface({host:emptyAction,radius:18});
 glass.addSurface({host:backButton,radius:18});
 glass.addSurface({host:newButton,radius:18});
 for(const button of [filterTrigger,columnTrigger,refresh])glass.addSurface({host:button,radius:18});

 // ── State helpers ────────────────────────────────────────────────────────
 const activeFilterCount=()=>state.companies.size+state.types.size+state.devices.size+state.statuses.size;

 function matchesQuery(plant,query){
  if(!query)return true;
  const haystack=[
   plant.name||"",
   companyLabel(plant.companyId),
   distributorLabel(plant.companyId),
   plant.installer||"",
   plant.sn||""
  ].join(" ").toLocaleLowerCase();
  return haystack.includes(query);
 }

  function sortValue(plant,key){
  switch(key){
   case "power":return plant.powerKw;
    case "status":return HEALTH_META[healthOf(plant)].severity;
   case "firmware":return plant.firmware||"";
   // Minutes ago inverted, so "descending" always means newest first.
   case "updated":return -(plant.updatedMinutes??1e9);
   default:return plant.name||"";
  }
 }

function compareRows(left,right){
 const {key,dir}=state.sort;
 const sign=dir==="asc"?1:-1;
 if(key==="power"){
  const a=left.powerKw,b=right.powerKw;
  if(a===null&&b===null)return collator.compare(left.name||"",right.name||"");
  if(a===null)return 1;
  if(b===null)return -1;
  return (a-b)*sign;
 }
 if(key==="firmware")return compareVersion(left.firmware,right.firmware)*sign;
 if(key==="status"){
  const delta=HEALTH_META[healthOf(left)].severity-HEALTH_META[healthOf(right)].severity;
  if(delta)return delta*sign;
  return collator.compare(left.name||"",right.name||"");
 }
 if(key==="name")return collator.compare(left.name||"?",right.name||"?")*sign;
 const a=sortValue(left,key),b=sortValue(right,key);
 if(a===b)return collator.compare(left.name||"",right.name||"");
 return (a<b?-1:1)*sign;
}

function visibleRows(){
  const query=state.query.trim().toLocaleLowerCase();
  const rows=PLANTS.filter(plant=>
   matchesQuery(plant,query)&&
   (!state.companies.size||state.companies.has(plant.companyId))&&
   (!state.types.size||state.types.has(plant.type))&&
   (!state.devices.size||state.devices.has(plant.device))&&
   (!state.statuses.size||state.statuses.has(plant.status))
  );
  // Bookmarked plants form a leading group so Following stays at the top of
  // the list. The chosen column sort still decides the order inside both the
  // pinned and the unpinned group, and unbookmarking returns a row to its
  // normal position immediately.
  return rows.slice().sort((left,right)=>{
   const pinned=Number(state.bookmarks.has(right.id))-Number(state.bookmarks.has(left.id));
   return pinned||compareRows(left,right);
  });
 }

 function toggleSort(key){
  if(state.sort.key===key)state.sort.dir=state.sort.dir==="asc"?"desc":"asc";
  else state.sort={key,dir:DEFAULT_DIR[key]||"asc"};
  updateSortState();
  render();
 }

 function updateSortState(){
  for(const th of thead.querySelectorAll("th[data-sort]")){
   const active=th.dataset.sort===state.sort.key;
   th.setAttribute("aria-sort",active?(state.sort.dir==="asc"?"ascending":"descending"):"none");
   const button=th.querySelector(".plants-sort");
   if(button)button.dataset.dir=active?state.sort.dir:"";
  }
 }

 function clearFilters(){
  state.companies.clear();
  state.types.clear();
  state.devices.clear();
  state.statuses.clear();
  render();
 }

  function renderColgroup(){
   colgroup.replaceChildren();
   // The leading bookmark/connection slots are locked and never grow. Every
   // other column declares a minimum and a share of the spare width, so the
   // grid stays aligned at its minimum and breathes with a wider panel.
   const visible=COLUMNS.filter(column=>!state.hidden.has(column.id));
   const baseWidth=column=>Number.parseInt(column.width,10);
   const minimum=visible.reduce((sum,column)=>sum+baseWidth(column),0);
   // At the wide breakpoint the table reserves its existing 24px content
   // inset while the scrollbar itself moves to the panel edge. Exclude that
   // trailing padding from the measured table width so the columns still end
   // on the same content line as the toolbar controls.
   const scrollStyle=getComputedStyle(scroll);
   const scrollPadding=(Number.parseFloat(scrollStyle.paddingLeft)||0)+(Number.parseFloat(scrollStyle.paddingRight)||0);
   const available=Math.max(scroll.clientWidth-scrollPadding,minimum);
   // Once the panel has enough room, keep the generous name column from
   // swallowing almost all spare width. The right-hand metrics then retain
   // readable, progressively larger gutters instead of bunching at the edge.
   const wideMix=Math.max(0,Math.min(1,(available-1100)/400));
   const growthOf=column=>{
    const compact=column.grow||0;
    const wide=column.wideGrow??compact;
    return compact+(wide-compact)*wideMix;
   };
   const growTotal=visible.reduce((sum,column)=>sum+growthOf(column),0);
   const widths=visible.map(column=>baseWidth(column));
   if(growTotal){
    const spare=available-minimum;
    let allocated=0;
    const lastGrow=visible.reduce((last,column,index)=>growthOf(column)?index:last,-1);
    visible.forEach((column,index)=>{
     const growth=growthOf(column);
     if(!growth)return;
     const width=index===lastGrow?spare-allocated:Math.round(spare*growth/growTotal);
     allocated+=width;
     widths[index]+=width;
    });
   }
   visible.forEach((column,index)=>{
    const col=document.createElement("col");
    if(column.id==="bookmark")col.className="plants-col-bookmark";
    col.style.width=`${widths[index]}px`;
    colgroup.append(col);
   });
   table.style.minWidth=`${minimum}px`;
   columnTrigger.dataset.dot=state.hidden.size===DEFAULT_HIDDEN.length&&DEFAULT_HIDDEN.every(id=>state.hidden.has(id))?"false":"true";
  }

  function renderHeader(){
   const row=document.createElement("tr");
   for(const column of COLUMNS){
    if(state.hidden.has(column.id))continue;
    const th=document.createElement("th");
    th.scope="col";
    th.className="plants-th";
    // Every visible column carries its id class so page CSS can set the cell
    // and header inset from one place instead of positional selectors.
    th.classList.add(`plants-col-${column.id}`);
    if(column.id==="connection")th.classList.add("plants-th--connection");
    if(column.control){
     // The bookmark is the row's leading action, not a titled data field. Keep
     // the header cell empty so it aligns with the title instead of printing a
     // truncated label.
     th.setAttribute("aria-label",column.label);
    }else if(column.sortable){
     th.dataset.sort=column.id;
     const button=text("button","plants-sort wd-control-state");
     button.type="button";
     const label=text("span","plants-sort-label wd-control-label",column.headerLabel||column.label,"Caption1/Regular");
     if(column.headerLabel)button.setAttribute("aria-label",`Sort by ${column.label}`);
     const caret=maskedIcon(opaqueMaskURL("disclosure.svg"),"plants-icon plants-icon--10 plants-sort-caret");
     button.append(label,caret);
     button.addEventListener("click",()=>toggleSort(column.id));
     th.append(button);
    }else{
     th.append(text("span","plants-th-label",column.headerLabel||column.label,"Caption1/Regular"));
    }
    row.append(th);
   }
   thead.replaceChildren(row);
   updateSortState();
  }

 // ── Cells ────────────────────────────────────────────────────────────────
 function cell(className){
  const td=document.createElement("td");
  td.className="plants-cell"+(className?" "+className:"");
  return td;
 }

  function healthCell(plant){
   const meta=HEALTH_META[healthOf(plant)];
   const td=cell("plants-cell--status");
   const wrap=text("span",`plants-health plants-health--${meta.tone}`,undefined,"Footnote/Regular");
   if(meta.tone==="neutral"){
    // Unbound reuses the connection column's supplied signal glyph, tinted with
    // the Status cell's own ink, so both places describe the same condition.
    wrap.append(connectionGlyph("unbound",{
     size:14,
     className:`plants-health-glyph plants-health-glyph--${meta.tone}`,
     alertFill:"currentColor"
    }));
   }else{
    wrap.append(maskedIcon(assetURL(meta.icon),"plants-health-glyph plants-health-glyph--"+meta.tone+" plants-icon--14"));
   }
   wrap.append(document.createTextNode(meta.label));
   td.append(wrap);
   return td;
  }

  function connectionCell(plant){
   const connection=connectionOf(plant);
   const meta=CONNECTION_META[connection];
   const td=cell("plants-cell--connection plants-cell--icon");
   const icon=connectionGlyph(connection);
   icon.classList.add(`plants-connection-glyph--${connection}`);
   icon.title=meta.label;
   icon.setAttribute("role","img");
   icon.setAttribute("aria-label",meta.label);
   icon.removeAttribute("aria-hidden");
   td.append(icon);
   return td;
  }

  function powerCell(plant){
  const td=cell("plants-cell--power");
  const value=text("span","plants-power",formatPower(plant),"Footnote/Regular");
  if(plant.powerKw===null||plant.powerKw===undefined)value.classList.add("plants-power--empty");
  td.append(value);
  return td;
 }

 function updatedCell(plant){
  const td=cell();
  const value=text("span","plants-updated",relativeTime(plant.updatedMinutes),"Footnote/Regular");
  value.title=absoluteTime(plant.updatedMinutes);
  td.append(value);
  return td;
 }

 function plainCell(content,typeStyle="Footnote/Regular",className=""){
  const td=cell(className);
  td.append(text("span","plants-text",content,typeStyle));
  return td;
 }

 function monoCell(content){
  const td=cell("plants-cell--mono");
  const value=text("span","plants-mono",content||"--","Footnote/Regular");
  if(content)value.title=content;
  td.append(value);
  return td;
 }

  function bookmarkCell(plant){
   const td=cell("plants-bookmark-cell plants-col-bookmark");
  const button=text("button","plants-bookmark wd-control-state");
  button.type="button";
  const following=state.bookmarks.has(plant.id);
  button.setAttribute("aria-pressed",String(following));
  button.setAttribute("aria-label",`Bookmark ${plant.name||"unassigned device"}`);
  button.append(bookmarkGlyph());
  button.addEventListener("click",event=>{
    event.stopPropagation();
    toggleBookmark(plant,button);
  });
  td.append(button);
  return td;
 }

 function toggleBookmark(plant,button){
  const following=!state.bookmarks.has(plant.id);
  if(following)state.bookmarks.add(plant.id);
  else state.bookmarks.delete(plant.id);
  writeBookmarks(state.bookmarks);
  // Keep keyboard focus on the same plant's bookmark after the row is
  // re-rendered in its new group, so pinning does not drop focus to the page.
  const keepFocus=document.activeElement===button;
  const positions=new Map();
  for(const row of tbody.querySelectorAll(".plants-row")){
   positions.set(row.dataset.id,row.getBoundingClientRect().top);
  }
  render();
  if(keepFocus){
   tbody.querySelector(`.plants-row[data-id="${CSS.escape(plant.id)}"] .plants-bookmark`)
    ?.focus({preventScroll:true});
  }
  if(!reducedMotion())animateRowReorder(positions);
  const label=plant.name||"this device";
  toast(following?`Following ${label}`:`Removed ${label} from Following`);
 }

 // FLIP reorder: rows that changed place glide from their previous offset to
 // the new one. Only rows whose position actually changed are animated; the
 // scroll position is left where the user put it.
 function animateRowReorder(positions){
  const duration=motionDuration("--wd-motion-panel");
  const easing=motionEasing("--wd-ease-panel");
  for(const row of tbody.querySelectorAll(".plants-row")){
   const previous=positions.get(row.dataset.id);
   if(previous===undefined)continue;
   const delta=previous-row.getBoundingClientRect().top;
   if(Math.abs(delta)<0.5)continue;
   row.animate(
    [{transform:`translateY(${delta}px)`},{transform:"translateY(0)"}],
    {duration,easing}
   );
  }
 }

 // An auto-created plant has no name yet, so the cell shows "?" and explains
 // itself on hover or keyboard focus through the shared anchored glass tooltip.
 function unknownCell(plant){
   const td=cell("plants-col-name");
  const button=text("button","plants-unknown wd-control-state","?","Footnote/Emphasized");
  button.type="button";
  button.setAttribute("aria-label","Unassigned device");
  let panel=null;
  const openTip=()=>{
   const tip=text("div","popover plants-tooltip");
   tip.append(text("p","plants-tooltip-text",UNASSIGNED_TOOLTIP,"Footnote/Regular"));
   panel=registerPanel(tip,button,{label:"Unassigned device",radius:12,width:248});
   panel.setAttribute("role","tooltip");
   button.setAttribute("aria-describedby",panel.id);
  };
  const closeTip=()=>{
   if(panel?.isConnected)close();
   panel=null;
   button.removeAttribute("aria-describedby");
  };
  button.addEventListener("pointerenter",openTip);
  button.addEventListener("pointerleave",closeTip);
  button.addEventListener("focus",openTip);
  button.addEventListener("blur",closeTip);
  button.addEventListener("click",event=>{
   event.stopPropagation();
   openTip();
  });
  td.append(button);
  return td;
 }

 function nameCell(plant){
  if(!plant.name)return unknownCell(plant);
  const td=cell("plants-col-name");
   const value=text("span","plants-name",plant.name,"Subheadline/Regular");
  value.title=plant.name;
  td.append(value);
  return td;
 }

  function plantCell(column,plant){
   switch(column.id){
    case "bookmark":return bookmarkCell(plant);
    case "name":return nameCell(plant);
    case "connection":return connectionCell(plant);
    case "company":return plainCell(companyLabel(plant.companyId));
    case "sn":return monoCell(plant.sn);
    case "type":return plainCell(typeLabel(plant.type));
    case "device":return plainCell(deviceLabel(plant.device));
    case "power":return powerCell(plant);
    case "status":return healthCell(plant);
    case "firmware":return monoCell(plant.firmware);
    case "updated":return updatedCell(plant);
    default:return cell();
   }
  }

 function createRow(plant,index){
  const row=document.createElement("tr");
  row.className="plants-row";
  row.dataset.id=plant.id;
  row.tabIndex=index===0?0:-1;
   for(const column of COLUMNS){
    if(state.hidden.has(column.id))continue;
    const td=plantCell(column,plant);
    td.classList.add(`plants-col-${column.id}`);
    row.append(td);
   }
  row.addEventListener("click",()=>activatePlant(plant));
  row.addEventListener("keydown",event=>{
   // The bookmark and the unassigned-device tooltip inside the row own their
   // own keyboard activation; Enter there must not also open the plant.
   if(event.key!=="Enter"||event.target!==row)return;
   event.preventDefault();
   activatePlant(plant);
  });
  return row;
 }

 function activatePlant(plant){
  if(!plant.name){
   toast("This device is not linked to a plant yet");
   return;
  }
  if(onOpenPlant){
   onOpenPlant(plant);
   return;
  }
  toast(`${plant.name} — the plant detail page is not part of this build`);
 }

 function renderDetail(plantId){
  const plant=plantById(plantId);
  if(!plant){
   detailTitle.textContent="Plant not found";
   detailMeta.textContent="";
   detailNote.textContent="This plant ID is not in the preview data. Return to Plants to choose an existing plant.";
   return;
  }
  const unassigned=!plant.name;
  detailTitle.textContent=plant.name||"Unassigned device";
  detailMeta.textContent=[companyLabel(plant.companyId),plant.sn].filter(Boolean).join(" · ");
  detailNote.textContent=unassigned
   ?"This device is not linked to a plant yet. The URL will resolve to the plant after setup."
   :"Plant detail is a preview placeholder in this build. Device data and controls are not connected yet.";
 }

 // ── Chips, triggers, empty state ─────────────────────────────────────────
 function renderChips(){
  chips.replaceChildren();
  const items=[];
  for(const id of state.companies)items.push({set:state.companies,id,label:companyLabel(id)});
  for(const id of state.types)items.push({set:state.types,id,label:typeLabel(id)});
  for(const id of state.devices)items.push({set:state.devices,id,label:deviceLabel(id)});
  for(const id of state.statuses)items.push({set:state.statuses,id,label:STATUS_META[id]?.label??id});
  for(const item of items){
   const chip=text("span","plants-chip");
   chip.append(text("span","plants-chip-label",item.label,"Footnote/Regular"));
   const remove=text("button","plants-chip-remove wd-control-state");
   remove.type="button";
   remove.setAttribute("aria-label",`Remove filter ${item.label}`);
   remove.append(maskedIcon(assetURL("tab-close.svg"),"plants-icon plants-icon--8"));
   remove.addEventListener("click",()=>{
    item.set.delete(item.id);
    render();
   });
   chip.append(remove);
   chips.append(chip);
  }
  if(items.length){
   const clear=text("button","plants-clear wd-control-state");
   clear.type="button";
   clear.append(text("span","plants-clear-label wd-control-label","Clear all","Footnote/Regular"));
   clear.addEventListener("click",clearFilters);
   chips.append(clear);
  }
  chips.hidden=items.length===0;
 }

 function updateFilterTrigger(){
  const total=activeFilterCount();
  filterTrigger.dataset.active=total?"true":"false";
  filterTrigger.dataset.dot=total?"true":"false";
  filterTrigger.setAttribute("aria-label",total?`Filters, ${total} active`:"Filters");
 }

 function renderEmpty(){
  const searching=activeFilterCount()>0||state.query.trim()!=="";
  emptyTitle.textContent=searching?"No plants match your search":"No plants yet";
  emptyBody.textContent=searching
   ?"Try another name, installer or SN, or clear the active filters."
   :"Plants appear here once a device on the site is linked to a plant.";
  emptyAction.hidden=!searching;
 }

 // ── Panels ───────────────────────────────────────────────────────────────
 function optionRow(label,checked,onToggle){
  const row=menuRow(label,{checked});
  row.setAttribute("role","menuitemcheckbox");
  row.setAttribute("aria-checked",String(checked));
  row.addEventListener("click",()=>{
   const next=row.getAttribute("aria-checked")!=="true";
   row.setAttribute("aria-checked",String(next));
   onToggle(next);
  });
  return row;
 }

 function group(title,rows){
  const block=text("div","plants-filter-group");
  block.append(menuHeading(title));
  const list=menuList();
  list.append(...rows);
  block.append(list);
  return block;
 }

 function countBy(field,value){
  return PLANTS.filter(plant=>plant[field]===value).length;
 }

 function filterPanel(anchor){
  const panel=document.createElement("div");
  panel.className="popover popover--menu plants-panel plants-filter-panel";
  const menu=mountMenu(panel,{label:"Filters",children:[
   menuHeading("Filters"),
   group("Company",COMPANIES.map(company=>optionRow(
    `${company.label} (${countBy("companyId",company.id)})`,
    state.companies.has(company.id),
    next=>{next?state.companies.add(company.id):state.companies.delete(company.id);render();}
   ))),
   group("Plant type",PLANT_TYPES.map(type=>optionRow(
    `${type.label} (${countBy("type",type.id)})`,
    state.types.has(type.id),
    next=>{next?state.types.add(type.id):state.types.delete(type.id);render();}
   ))),
   group("Device",DEVICES.map(device=>optionRow(
    `${device.label} (${countBy("device",device.id)})`,
    state.devices.has(device.id),
    next=>{next?state.devices.add(device.id):state.devices.delete(device.id);render();}
   ))),
   group("Status",Object.entries(STATUS_META).sort((a,b)=>a[1].severity-b[1].severity).map(([id,meta])=>optionRow(
    `${meta.label} (${countBy("status",id)})`,
    state.statuses.has(id),
    next=>{next?state.statuses.add(id):state.statuses.delete(id);render();}
   ))),
   (()=>{
    const footer=menuList();
    const row=menuRow("Clear all filters");
    row.setAttribute("role","menuitem");
    row.addEventListener("click",()=>{
     if(!activeFilterCount())return;
     clearFilters();
     close();
    });
    footer.append(row);
    return footer;
   })()
  ]});
  menu.classList.add("plants-filter-menu");
  registerPanel(panel,anchor,{label:"Filters",radius:30,width:300,align:"start"});
 }

 function columnPanel(anchor){
  const panel=document.createElement("div");
  panel.className="popover popover--menu plants-panel";
  const list=menuList();
 for(const column of COLUMNS){
  if(column.locked)continue;
   const row=menuRow(column.label,{checked:!state.hidden.has(column.id)});
   row.setAttribute("role","menuitemcheckbox");
   row.setAttribute("aria-checked",String(!state.hidden.has(column.id)));
   row.addEventListener("click",()=>{
    const visible=row.getAttribute("aria-checked")==="true";
    if(visible)state.hidden.add(column.id);
    else state.hidden.delete(column.id);
    row.setAttribute("aria-checked",String(!visible));
    renderColgroup();
    renderHeader();
    render();
   });
   list.append(row);
  }
  mountMenu(panel,{label:"Columns",children:[menuHeading("Columns"),list]});
  registerPanel(panel,anchor,{label:"Columns",radius:30,width:220,align:"start"});
 }

 filterTrigger.addEventListener("click",()=>filterPanel(filterTrigger));
 columnTrigger.addEventListener("click",()=>columnPanel(columnTrigger));

 // ── Refresh ──────────────────────────────────────────────────────────────
 let refreshing=false;
 refresh.addEventListener("click",()=>{
  if(refreshing)return;
  refreshing=true;
  const done=()=>{
   refreshing=false;
   toast("Plants refreshed — sample data only");
  };
  if(reducedMotion()){
   done();
   return;
  }
  const animation=refreshIcon.animate(
   [{transform:"rotate(0deg)"},{transform:"rotate(360deg)"}],
   {duration:motionDuration("--wd-motion-refresh"),easing:motionEasing("--wd-ease-chart")}
  );
  animation.finished.then(done).catch(()=>{refreshing=false;});
 });

 // ── Row keyboard navigation (roving tabindex) ────────────────────────────
 tbody.addEventListener("keydown",event=>{
  const row=event.target.closest(".plants-row");
  if(!row)return;
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
  const rows=[...tbody.querySelectorAll(".plants-row")];
  const index=rows.indexOf(row);
  if(index<0)return;
  event.preventDefault();
  let next=index;
  if(event.key==="ArrowDown")next=Math.min(rows.length-1,index+1);
  if(event.key==="ArrowUp")next=Math.max(0,index-1);
  if(event.key==="Home")next=0;
  if(event.key==="End")next=rows.length-1;
  const target=rows[next];
  if(!target||target===row)return;
  row.tabIndex=-1;
  target.tabIndex=0;
  target.focus();
 });

 // ── Render ───────────────────────────────────────────────────────────────
 function render(){
  const rows=visibleRows();
  tbody.replaceChildren(...rows.map((plant,index)=>createRow(plant,index)));
  scroll.hidden=rows.length===0;
  empty.hidden=rows.length!==0;
  if(!rows.length)renderEmpty();
  updateFilterTrigger();
  renderChips();
 }

 function show(params={}){
  element.hidden=false;
  close(true);
  const plantId=params?.plantId;
  if(plantId){
   inner.hidden=true;
   detail.hidden=false;
   renderDetail(plantId);
   return;
  }
  detail.hidden=true;
  inner.hidden=false;
  render();
 }

 renderColgroup();
 // The panel is resizable, so the colgroup re-measures when the scroll box
 // changes width instead of holding the width from the first paint.
 let lastColumnWidth=0;
 const columnResize=new ResizeObserver(entries=>{
  const width=Math.round(entries[0]?.contentRect.width||0);
  if(!width||width===lastColumnWidth)return;
  lastColumnWidth=width;
  renderColgroup();
 });
 columnResize.observe(scroll);
 renderHeader();
 render();
 prepareIconMasks(element);
 prepareControlStates(element);

 return {
  element,
  show,
  hide(){
   close(true);
   element.hidden=true;
  }
 };
}
