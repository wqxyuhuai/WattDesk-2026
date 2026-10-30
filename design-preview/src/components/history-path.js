export function historyPathText(parts){
 return parts.map(part=>part.text).join(" / ");
}

const fitRecords=new WeakMap();
const MIN_VISIBLE_LEAF=12;

function middleEllipsis(text,limit){
 const value=String(text||"");
 if(value.length<=limit)return value;
 const available=Math.max(1,limit-1);
 const headLength=Math.ceil(available*.56);
 const tailLength=available-headLength;
 return `${value.slice(0,headLength).trimEnd()}…${value.slice(-tailLength).trimStart()}`;
}

function candidateParts(parts,keepCount){
 const start=Math.max(0,parts.length-keepCount);
 const candidate=parts.slice(start).map(part=>({...part}));
 if(start)candidate.unshift({text:"…",tone:"ancestor"});
 return candidate;
}

function textWidth(container,value){
 const computed=getComputedStyle(container);
 const probe=document.createElement("span");
 probe.textContent=value;
 Object.assign(probe.style,{
  position:"absolute",
  visibility:"hidden",
  pointerEvents:"none",
  whiteSpace:"nowrap",
  width:"max-content",
  fontFamily:computed.fontFamily,
  fontSize:computed.fontSize,
  fontStyle:computed.fontStyle,
  fontWeight:computed.fontWeight,
  fontStretch:computed.fontStretch,
  fontVariant:computed.fontVariant,
  fontFeatureSettings:computed.fontFeatureSettings,
  fontVariationSettings:computed.fontVariationSettings,
  letterSpacing:computed.letterSpacing,
  wordSpacing:computed.wordSpacing
 });
 container.append(probe);
 const width=probe.getBoundingClientRect().width;
 probe.remove();
 return width;
}

function replacePathParts(path,parts){
 path.replaceChildren();
 parts.forEach((part,index)=>{
  if(index){
   const separator=document.createElement("span");
   separator.className="wd-history-path-part wd-history-path-part--separator";
   separator.textContent="/";
   separator.setAttribute("aria-hidden","true");
   path.append(separator);
  }
  const segment=document.createElement("span");
  segment.className=`wd-history-path-part wd-history-path-part--${part.tone||"current"}`;
  segment.textContent=part.text;
  path.append(segment);
 });
}

function fitParts(container,parts,available){
 const measure=candidate=>{
  const text=candidate.map(part=>part.text).join("/");
  const separators=Math.max(0,candidate.length-1);
  return textWidth(container,text)+separators*8;
 };
 const minimumLeaf=Math.min(MIN_VISIBLE_LEAF,parts.at(-1).text.length);

 // Preserve the immediate parent before aggressively shortening the leaf.
 // If a level can keep at least a readable leaf title, use that candidate.
 // Older ancestors are only discarded when the remaining leaf would otherwise
 // become too short to identify the destination.
 let best=null;
 for(let keepCount=parts.length;keepCount>=1;keepCount--){
  const base=candidateParts(parts,keepCount);
  const leaf=base[base.length-1];
  const fullWidth=measure(base);
  if(fullWidth<=available)return base;
  if(leaf.text.length<=1)continue;
  let low=1;
  let high=leaf.text.length-1;
  let bestForBase=null;
  while(low<=high){
   const limit=Math.ceil((low+high)/2);
   const candidate=base.map(part=>({...part}));
   candidate[candidate.length-1].text=middleEllipsis(leaf.text,limit);
   const width=measure(candidate);
   if(width<=available){
    bestForBase={parts:candidate,leafLimit:limit,width};
    low=limit+1;
   }else{
    high=limit-1;
   }
  }
  if(!bestForBase)continue;
  if(bestForBase.leafLimit>=minimumLeaf)return bestForBase.parts;
  if(!best||bestForBase.leafLimit>best.leafLimit||
    (bestForBase.leafLimit===best.leafLimit&&candidateParts(parts,keepCount).length>best.parts.length)){
   best=bestForBase;
  }
 }
 return best?.parts||[{text:"…",tone:"current"}];
}

export function fitHistoryPath(container,parts){
 const path=container.querySelector(":scope>.wd-history-path");
 if(!path||!parts?.length||!container.isConnected)return false;
 const available=container.getBoundingClientRect().width-.5;
 if(available<=0)return false;
 replacePathParts(path,fitParts(container,parts,available));
 return true;
}

export function disposeHistoryPath(container){
 const record=fitRecords.get(container);
 if(!record)return;
 record.observer.disconnect();
 if(record.frame)cancelAnimationFrame(record.frame);
 fitRecords.delete(container);
}

export function renderHistoryPath(container,parts){
 disposeHistoryPath(container);
 const path=document.createElement("span");
 path.className="wd-history-path";
 path.style.visibility="hidden";
 replacePathParts(path,parts);
 container.replaceChildren(path);
 const record={parts:parts.map(part=>({...part})),observer:null,frame:0};
 const apply=()=>{
  record.frame=0;
  if(fitRecords.get(container)!==record)return;
  if(!container.isConnected||fitHistoryPath(container,record.parts))path.style.visibility="";
 };
 record.observer=new ResizeObserver(()=>{
  if(record.frame)cancelAnimationFrame(record.frame);
  record.frame=requestAnimationFrame(apply);
 });
 record.observer.observe(container);
 fitRecords.set(container,record);
 apply();
 if(!container.isConnected)record.frame=requestAnimationFrame(apply);
 document.fonts?.ready.then(apply);
 return path;
}
