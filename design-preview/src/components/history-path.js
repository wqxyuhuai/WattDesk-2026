export function historyPathText(parts){
 return parts.map(part=>part.text).join(" / ");
}

export function renderHistoryPath(container,parts){
 const path=document.createElement("span");
 path.className="wd-history-path";
 parts.forEach((part,index)=>{
  if(index){
   const separator=document.createElement("span");
   separator.className="wd-history-path-part wd-history-path-part--separator";
   separator.textContent=" / ";
   separator.setAttribute("aria-hidden","true");
   path.append(separator);
  }
  const segment=document.createElement("span");
  segment.className=`wd-history-path-part wd-history-path-part--${part.tone||"current"}`;
  segment.textContent=part.text;
  path.append(segment);
 });
 container.replaceChildren(path);
 return path;
}
