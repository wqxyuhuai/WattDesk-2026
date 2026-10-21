// Figma extraction adapter. New pages use semantic layouts, never this scene format.
import {createSceneTypography} from "../../foundations/typography.js";
import {preserveCornerProfile} from "../../foundations/geometry.js";
export function selectHomeScene(scene){
 const excluded=new Set(),mounts=new Set(["14445:3629","14612:8479"]);
 return scene.filter(n=>{
  if(excluded.has(n.p)||mounts.has(n.p)||n.id==="14613:1230"||n.id==="14561:1103"||/^(Fill \+ Shadow|Glass Effect)$/.test(n.name)){excluded.add(n.id);return false;}
  return true;
 });
}
export function renderHomeScene({root,scene,assets,typeSource}){
 const visibleScene=selectHomeScene(scene),elements=new Map(),records=new Map(scene.map(n=>[n.id,n]));
 const bindSceneType=createSceneTypography(typeSource);
const monoAssetFiles=new Set(["asset-35.svg","asset-40.svg","asset-41.svg","asset-42.svg","asset-43.svg","asset-44.svg","asset-45.svg","asset-46.svg","asset-47.svg","asset-48.svg","asset-49.svg","asset-50.svg","asset-51.svg","asset-52.svg","asset-53.svg","asset-54.svg","asset-55.svg","asset-56.svg","asset-57.svg","asset-58.svg","asset-59.svg","asset-60.svg","asset-61.svg","asset-62.svg","asset-63.svg","asset-64.svg","asset-65.svg","asset-66.svg","asset-67.svg","asset-68.svg","asset-69.svg","asset-70.svg","asset-73.svg","asset-74.svg","asset-77.svg","asset-78.svg","asset-79.svg","asset-82.svg"]);
// Variable-bound alpha from the extraction was multiplied twice. Restore
// the source tokens only; explicit alpha (e.g. glass .17) stays untouched.
function alpha(p){const a=p.opacity??1;for(const v of [.49,.09,.1024,.0289])if(Math.abs(a-v)<.00001)return Math.sqrt(a);return a}
function rgba(c,a=1,n,role="fill"){
 const rgb=[c.r,c.g,c.b].map(v=>Math.round(v*255)),hex=rgb.map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase();
 if(role==="text"&&hex==="FFFFFF")return `rgb(var(--wd-label-primary-rgb))`;
 if(role==="text"&&hex==="EBEBF5"){
  const opacity=(c.a??1)*a;
  if(opacity>.5&&opacity<.95)return "rgba(var(--wd-label-secondary-rgb),var(--wd-label-secondary-opacity))";
  if(opacity>.2&&opacity<=.5)return "rgba(var(--wd-label-tertiary-rgb),var(--wd-label-tertiary-opacity))";
  if(opacity>.05&&opacity<=.2)return "rgba(var(--wd-label-quaternary-rgb),var(--wd-label-quaternary-opacity))";
  return `rgb(var(--wd-label-primary-rgb))`;
 }
 if(role==="fill"){
  if(hex==="1C1C1E")return n?.p?"var(--wd-surface-primary)":"var(--wd-canvas)";
  if(hex==="2C2C2E")return "var(--wd-surface-secondary)";
  if(hex==="38383A")return "var(--wd-separator)";
  if(hex==="FFFFFF")return "var(--wd-surface-primary)";
 }
 return `rgba(${rgb.join(",")},${(c.a??1)*a})`;
}
function paint(p,n,role="fill"){
 if(p.type==="SOLID")return rgba(p.color,alpha(p),n,role);
 if(p.type==="GRADIENT_LINEAR"){
  const [[a,b,tx],[c,d,ty]]=p.gradientTransform,det=a*d-b*c;
  const start={x:(-d*tx-b*(.5-ty))/det*n.w,y:(c*tx+a*(.5-ty))/det*n.h};
  const delta={x:d/det*n.w,y:-c/det*n.h},len=Math.hypot(delta.x,delta.y);
  const ux=delta.x/len,uy=delta.y/len,full=Math.abs(ux*n.w)+Math.abs(uy*n.h);
  const base=((start.x-n.w/2)*ux+(start.y-n.h/2)*uy+full/2)/full*100;
  const angle=Math.atan2(ux,-uy)*180/Math.PI;
  return `linear-gradient(${angle}deg,${p.gradientStops.map(s=>rgba(s.color,p.opacity??1,n,role)+" "+(base+s.position*len/full*100)+"%").join(",")})`;
 }return "none";
}
function typeStyle(el,n){
 const s=el.style;
 const weights={400:"--wd-weight-regular",510:"--wd-weight-medium",590:"--wd-weight-semibold",700:"--wd-weight-bold"};
 const bound=bindSceneType(el,n);
 if(!bound){
  const v=n.fn?.variationSettings||{};
  s.fontSize=n.fs+"px";s.lineHeight=n.lh?.unit==="PIXELS"?n.lh.value+"px":n.fs*1.2+"px";
  s.letterSpacing=(n.ls?.unit==="PIXELS"?n.ls.value:0)+"px";
  s.fontWeight=v.wght??(/Bold/.test(n.fn?.style)?700:/Semibold/.test(n.fn?.style)?590:/Medium/.test(n.fn?.style)?510:400);
  s.fontVariationSettings=`"wdth" ${v.wdth??100}, "opsz" ${Math.max(17,Math.min(28,n.fs))}`;s.fontOpticalSizing="none";
 }
 const segmentWeights=new Set((n.segments||[]).map(seg=>seg.font?.variationSettings?.wght).filter(value=>value!==undefined));
 s.textAlign=n.align?.toLowerCase()||"left";
 if(n.trunc==="ENDING")el.classList.add("truncate");
 for(const seg of n.segments||[{text:n.text,fills:n.f}]){
  const span=document.createElement("span");span.textContent=seg.text;
  if(seg.fills?.[0])span.style.color=paint(seg.fills[0],n,"text");
  if(seg.font?.variationSettings?.wght&&(!bound||segmentWeights.size>1)){const weight=seg.font.variationSettings.wght;span.style.fontWeight=weights[weight]?`var(${weights[weight]},${weight})`:weight}
  el.append(span);
 }
}
for(const n of visibleScene){
 const el=n.p?document.createElement("div"):root;el.dataset.nodeId=n.id;el.dataset.name=n.name;
 if(n.p){el.classList.add("node");Object.assign(el.style,{left:n.x+"px",top:n.y+"px",width:n.w+"px",height:n.h+"px"});elements.get(n.p).append(el);}
 elements.set(n.id,el);
 if(n.o!==undefined&&!n.asset)el.style.opacity=n.o;
 if(n.r)el.style.transform=`rotate(${-n.r}deg)`;
 if(n.cr)el.style.borderRadius=n.cr+"px";
 if(n.cr||n.t==="ELLIPSE")preserveCornerProfile(el,{radius:n.cr||0,width:n.w,height:n.h,ellipse:n.t==="ELLIPSE"});
 if(n.clip)el.style.overflow="hidden";
 if(n.asset){
  el.classList.add("asset");if(monoAssetFiles.has(assets[n.id]))el.classList.add("asset-mono");
  const img=document.createElement("img");img.src="./home-assets/"+assets[n.id];img.alt="";img.draggable=false;
  const b=n.ab||{x:0,y:0,w:n.w,h:n.h};
  Object.assign(img.style,{left:b.x+"px",top:b.y+"px",width:b.w+"px",height:b.h+"px"});el.append(img);continue;
 }
 if(n.t==="TEXT"){el.classList.add("text");typeStyle(el,n);continue;}
 if(n.f?.length)el.style.background=n.f.map(p=>paint(p,n,"fill")).reverse().join(",");
 const shadows=[];
 if(n.s?.some(p=>p.visible!==false)){const color=paint(n.s.find(p=>p.visible!==false),n,"stroke"),weight=n.sw??1;
  if(n.sides&&new Set(n.sides).size>1){["Top","Right","Bottom","Left"].forEach((side,i)=>{if(n.sides[i])el.style["border"+side]=n.sides[i]+"px solid "+color;});}
  else shadows.push(`inset 0 0 0 ${weight}px ${color}`);
 }
 for(const e of n.e||[])if(e.visible&&e.type==="DROP_SHADOW"&&e.blendMode==="NORMAL")shadows.push(`${e.offset.x}px ${e.offset.y}px ${e.radius}px ${e.spread}px ${rgba(e.color,1,n,"shadow")}`);
 if(shadows.length)el.style.boxShadow=shadows.join(",");
 if(n.scroll==="VERTICAL")el.classList.add("scroll-viewport");
}

 return {elements,records,scene:visibleScene};
}
