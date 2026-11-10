import {createTextElement as text} from "../../foundations/dom.js";
import {motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";

const SVG_NS="http://www.w3.org/2000/svg";

function svgNode(name,attributes={},parent){
 const node=document.createElementNS(SVG_NS,name);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
 if(parent)parent.append(node);
 return node;
}

function svgText(parent,attributes,value){
 const node=svgNode("text",attributes,parent);
 node.textContent=value;
 return node;
}

function animateSourceTicks(group,active){
 if(!group||reducedMotion())return;
 const lines=[...group.querySelectorAll(".plant-overview-chart-wedge.is-hover")];
 const duration=motionDuration(active?"--wd-motion-hover":"--wd-motion-hover-out");
 const easing=motionEasing(active?"--wd-ease-hover":"--wd-ease-hover-out");
 for(const line of lines){
  line.getAnimations().forEach(animation=>animation.cancel());
  const frames=active
   ?[{opacity:0},{opacity:1}]
   :[{opacity:1},{opacity:0}];
  line.animate(frames,{duration,easing,fill:"none"});
 }
}

function createFigure(kind,label){
 const figure=text("figure",`plant-overview-stat-chart is-${kind}`);
 figure.setAttribute("aria-label",label);
 const output=text("output","plant-overview-chart-readout");
 output.classList.add("wd-glass--surface","wd-glass-popup");
 const copy=text("span","plant-overview-chart-readout-copy");
 output.append(copy);
 output.setAttribute("aria-live","polite");
 output.setAttribute("aria-atomic","true");
 return {figure,output,copy};
}

function bindHit(hit,{figure,output,copy},title,value){
 hit.classList.add("plant-overview-stat-hit");
 hit.setAttribute("tabindex","0");
 hit.setAttribute("role","img");
 const ariaValue=String(value).replace(/\n/g," · ");
 hit.setAttribute("aria-label",`${title}: ${ariaValue}`);
  if(hit instanceof SVGElement){
   const titleNode=svgNode("title",{},hit);
   titleNode.textContent=`${title}: ${ariaValue}`;
  }
 const positionSelfReadout=(clientX,clientY)=>{
  const box=figure.getBoundingClientRect();
  const readoutWidth=output.offsetWidth||56;
  const halfWidth=readoutWidth/2;
  const x=Math.max(halfWidth,Math.min(box.width-halfWidth,clientX-box.left));
  const y=Math.max(0,Math.min(box.height,clientY-box.top));
  output.style.setProperty("--plant-self-tooltip-left",`${x}px`);
  output.style.setProperty("--plant-self-tooltip-top",`${y}px`);
 };
 const positionSelfFromHit=()=>{
  const box=hit.getBoundingClientRect();
  positionSelfReadout(box.left+box.width/2,box.top+box.height*.38);
 };
 const show=(event)=>{
  figure.classList.add("is-active");
  hit.classList.add("is-active");
   copy.classList.toggle("is-combined",figure.classList.contains("is-history-combined"));
  const sourceGroup=hit.closest(".plant-overview-chart-mark");
  for(const active of figure.querySelectorAll(".plant-overview-chart-mark.is-source-active"))active.classList.remove("is-source-active");
  sourceGroup?.classList.add("is-source-active");
  animateSourceTicks(sourceGroup,true);
  const anchor=hit.querySelector(".plant-overview-chart-lollipop-track")||hit.parentElement.querySelector(
   figure.classList.contains("is-savings")
    ?".plant-overview-chart-lollipop-track"
    :figure.classList.contains("is-energy")
     ?".plant-overview-chart-energy-dot.is-demand.is-top"
     :figure.classList.contains("is-history")
      ?".plant-overview-history-rung-track,.plant-overview-history-dot,.plant-overview-combined-dot"
      :".plant-overview-chart-dial-tick"
  )||hit;
  if(anchor&&!figure.classList.contains("is-self-powered")){
   const anchorBox=anchor.getBoundingClientRect(),figureBox=figure.getBoundingClientRect();
   const topValues=figure.classList.contains("is-energy")
    ?[...hit.parentElement.querySelectorAll(".plant-overview-chart-energy-value")]
    :[];
   const anchorTop=topValues.length
    ?Math.min(...topValues.map(valueLabel => valueLabel.getBoundingClientRect().top))-figureBox.top
    :anchorBox.top-figureBox.top;
   const groupBox=sourceGroup?.getBoundingClientRect();
   const anchorLeft=figure.classList.contains("is-energy")&&groupBox
    ?groupBox.left+groupBox.width/2-figureBox.left
    :figure.classList.contains("is-history")
      ?anchorBox.left+anchorBox.width/2-figureBox.left
      :anchorBox.left-figureBox.left;
   output.style.setProperty("--plant-chart-readout-top",`${Math.max(0,anchorTop)}px`);
   output.style.setProperty("--plant-chart-readout-left",`${Math.max(0,anchorLeft)}px`);
  }
  if(figure.classList.contains("is-self-powered")){
   const [,energy]=String(value).split(" · ");
   copy.replaceChildren(
    text("span","plant-overview-chart-readout-value",energy,"Footnote/Emphasized")
   );
  }else if(figure.classList.contains("is-savings")){
   copy.replaceChildren(
    text("span","plant-overview-chart-readout-value",value,"Footnote/Emphasized")
   );
  }else if(figure.classList.contains("is-energy")||figure.classList.contains("is-history")){
   copy.replaceChildren(
    text("strong","plant-overview-chart-readout-label",title,"Caption1/Emphasized"),
    ...String(value).split("\n").map(line =>
     text("span","plant-overview-chart-readout-value",line,"Footnote/Emphasized")
    )
   );
  }else{
   copy.replaceChildren(
    text("strong","plant-overview-chart-readout-label",title,"Caption1/Emphasized"),
    text("span","plant-overview-chart-readout-value",value,"Footnote/Emphasized")
   );
  }
  if(figure.classList.contains("is-history")){
   const readoutHeight=output.offsetHeight||28;
   const tooltipTop=figure.classList.contains("is-history-combined")?35:readoutHeight;
   output.style.setProperty("--plant-chart-readout-top",`${tooltipTop}px`);
  }
  if(figure.classList.contains("is-energy")&&sourceGroup){
   const figureBox=figure.getBoundingClientRect();
   const groupBox=sourceGroup.getBoundingClientRect();
   const halfWidth=(output.offsetWidth||96)/2;
   const preferredCentre=groupBox.left+groupBox.width/2-figureBox.left;
   const clampedCentre=Math.max(halfWidth,Math.min(figureBox.width-halfWidth,preferredCentre));
   output.style.setProperty("--plant-chart-readout-left",`${clampedCentre}px`);
  }
  if(figure.classList.contains("is-self-powered")){
   if(Number.isFinite(event?.clientX)&&Number.isFinite(event?.clientY)){
    positionSelfReadout(event.clientX,event.clientY);
   }else{
    positionSelfFromHit();
   }
  }
 };
 const hide=()=>{
  if(document.activeElement===hit)return;
  figure.classList.remove("is-active");
  hit.classList.remove("is-active");
  const sourceGroup=hit.closest(".plant-overview-chart-mark");
  animateSourceTicks(sourceGroup,false);
  sourceGroup?.classList.remove("is-source-active");
  output.classList.remove("is-below");
  output.classList.remove("is-left","is-right");
  output.style.removeProperty("--plant-self-tooltip-left");
  output.style.removeProperty("--plant-self-tooltip-top");
 };
 hit.addEventListener("pointerenter",show);
 hit.addEventListener("pointermove",event=>{
  if(figure.classList.contains("is-self-powered")&&figure.classList.contains("is-active")){
   positionSelfReadout(event.clientX,event.clientY);
  }
 });
 hit.addEventListener("pointerleave",hide);
 hit.addEventListener("focus",show);
 hit.addEventListener("blur",()=>{
  if(hit.matches(":hover"))return;
  figure.classList.remove("is-active");
  hit.classList.remove("is-active");
  const sourceGroup=hit.closest(".plant-overview-chart-mark");
  animateSourceTicks(sourceGroup,false);
  sourceGroup?.classList.remove("is-source-active");
  output.classList.remove("is-below");
  output.classList.remove("is-left","is-right");
  output.style.removeProperty("--plant-self-tooltip-left");
  output.style.removeProperty("--plant-self-tooltip-top");
 });
}

function mark(group){
 group.classList.add("plant-overview-chart-mark");
 return group;
}

export function createEnergyChart(data){
 const {figure,output,copy}=createFigure("energy","Energy supply and demand");
 const svg=svgNode("svg",{viewBox:"0 0 228 116",preserveAspectRatio:"xMinYMid meet",role:"img","aria-label":"Energy supply and demand by grid, storage and site"});
 const categories=[
  {name:"Grid",supply:data.importedToday,demand:data.exportedToday},
  {name:"Storage",supply:data.dischargedToday,demand:data.chargedToday},
  {name:"Solar",supply:data.solarToday,demand:null},
  {name:"Site",supply:null,demand:data.homeToday}
 ];
 const baseY=96;
 const step=Math.min(5.2,80/Math.max(1,...categories.flatMap(item=>[
  item.supply===null?0:Math.floor(item.supply),
  item.demand===null?0:Math.floor(item.demand)
 ])));
 const dotRadius=Math.min(1.8,step*.36);
 const topDotRadius=Math.min(4,Math.max(dotRadius+.6,step-dotRadius-.05));
 svgNode("circle",{cx:3,cy:5.2,r:topDotRadius,class:"plant-overview-chart-energy-dot is-supply"},svg);
 svgText(svg,{x:9,y:6,"dominant-baseline":"middle",class:"plant-overview-chart-energy-legend"},"Supply");
 svgNode("circle",{cx:62,cy:5.2,r:topDotRadius,class:"plant-overview-chart-energy-dot is-demand"},svg);
 svgText(svg,{x:68,y:6,"dominant-baseline":"middle",class:"plant-overview-chart-energy-legend"},"Demand");
 categories.forEach((item,index)=>{
  const group=mark(svgNode("g",{},svg));
  const x=21+index*65;
  const pairX=item.supply!==null&&item.demand!==null;
  const series=[
   {id:"supply",present:item.supply!==null,value:item.supply===null?0:Math.max(0,Math.floor(item.supply)),x:pairX?x-9:x},
   {id:"demand",present:item.demand!==null,value:item.demand===null?0:Math.max(0,Math.floor(item.demand)),x:pairX?x+9:x}
  ];
  for(const seriesItem of series.filter(entry=>entry.present)){
   for(let dotIndex=0;dotIndex<Math.max(0,seriesItem.value-1);dotIndex+=1){
    svgNode("circle",{
     cx:seriesItem.x,cy:baseY-(dotIndex+1)*step,
     r:dotRadius,class:`plant-overview-chart-energy-dot is-${seriesItem.id}`
    },group);
   }
   if(seriesItem.value){
    svgNode("circle",{
     cx:seriesItem.x,cy:baseY-seriesItem.value*step,
     r:topDotRadius,class:`plant-overview-chart-energy-dot is-${seriesItem.id} is-top`
    },group);
   }
   const topY=seriesItem.value?baseY-seriesItem.value*step:baseY-7;
   svgText(group,{
    x:seriesItem.x,y:topY-8,class:`plant-overview-chart-energy-value is-${seriesItem.id}`
   },String(seriesItem.value));
  }
  svgText(group,{x,y:111,"text-anchor":"middle",class:"plant-overview-chart-label"},item.name);
  const hit=svgNode("rect",{x:x-29,y:12,width:58,height:83,fill:"transparent"},group);
  const values=[];
  if(item.supply!==null)values.push(`${item.supply.toFixed(1)} kWh supply`);
  if(item.demand!==null)values.push(`${item.demand.toFixed(1)} kWh demand`);
  bindHit(hit,{figure,output,copy},item.name,values.join("\n"));
 });
 figure.append(svg,output);
 return figure;
}

function historyPath(points,mapX,mapY){
 if(!points.length)return "";
 const smoothingRadius=points.length>120?3:0;
 const coordinates=points.map((point,index)=>{
  let value=point.value;
  if(smoothingRadius){
   let sum=0;
   let weightTotal=0;
   for(let offset=-smoothingRadius;offset<=smoothingRadius;offset+=1){
    const sample=points[index+offset];
    if(!sample)continue;
    const weight=smoothingRadius+1-Math.abs(offset);
    sum+=sample.value*weight;
    weightTotal+=weight;
   }
   value=weightTotal?sum/weightTotal:value;
  }
  return {x:mapX(index),y:mapY(value)};
 });
 if(coordinates.length<3){
  return coordinates.map((point,index)=>`${index?"L":"M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
 }
 let path=`M${coordinates[0].x.toFixed(1)} ${coordinates[0].y.toFixed(1)}`;
 for(let index=0;index<coordinates.length-1;index+=1){
  const previous=coordinates[index-1]||coordinates[index];
  const current=coordinates[index];
  const next=coordinates[index+1];
  const following=coordinates[index+2]||next;
  const control1={
   x:current.x+(next.x-previous.x)/6,
   y:current.y+(next.y-previous.y)/6
  };
  const control2={
   x:next.x-(following.x-current.x)/6,
   y:next.y-(following.y-current.y)/6
  };
  path+=` C${control1.x.toFixed(1)} ${control1.y.toFixed(1)} ${control2.x.toFixed(1)} ${control2.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
 }
 return path;
}

export function createHistoryChart(kind,title){
 const {figure,output,copy}=createFigure("history",title);
 figure.dataset.historyKind=kind;
 const svgHost=text("span","plant-overview-history-canvas");
 figure.append(svgHost,output);

 function render(series){
  const points=series.points;
  const svg=svgNode("svg",{
   viewBox:"0 0 220 104",
   preserveAspectRatio:"xMidYMid meet",
   role:"img",
   "aria-label":`${title}, ${series.rangeLabel}`
  });
  const width=208;
  const left=6;
  const top=10;
  const base=84;
  const x=index=>left+(points.length===1?width/2:index/(points.length-1)*width);
  const values=points.map(point=>point.value);
  const includeZero=series.signed||values.some(value=>value<0);
  const rawMin=includeZero?Math.min(0,...values):Math.min(...values);
  const rawMax=includeZero?Math.max(0,...values):Math.max(...values);
  const padding=Math.max(.25,Math.abs(rawMax-rawMin)*.1);
  const min=rawMin-(includeZero?padding:padding);
  const max=rawMax+padding;
  const span=Math.max(.1,max-min);
  const y=value=>top+(1-(value-min)/span)*(base-top);
  const zeroY=y(0);

  for(let gridIndex=0;gridIndex<3;gridIndex+=1){
   const gridY=top+((base-top)/2)*gridIndex;
   svgNode("line",{
    x1:left,y1:gridY,x2:left+width,y2:gridY,
    class:"plant-overview-history-grid-line"
   },svg);
  }
  svgNode("line",{
   x1:left,y1:includeZero?zeroY:base,x2:left+width,y2:includeZero?zeroY:base,
   class:"plant-overview-history-baseline"
  },svg);

  if(kind==="month"||series.signed){
   points.forEach((point,index)=>{
    svgNode("line",{
     x1:x(index),y1:base,x2:x(index),y2:base-(point.weekend?4:7),
     class:"plant-overview-history-floor-tick"
    },svg);
   });
   svgNode("path",{
    d:historyPath(points,x,y),
    class:"plant-overview-history-line plant-overview-chart-mark"
   },svg);
  }

  const peakIndex=values.reduce((best,value,index)=>value>values[best]?index:best,0);
  points.forEach((point,index)=>{
   const group=mark(svgNode("g",{},svg));
   if(kind==="year"&&!series.signed){
    const height=point.value===0?0:Math.max(6,Math.abs(point.value/max)*(base-top-8));
    svgNode("line",{
     x1:x(index),y1:base,x2:x(index),y2:base-height,
     class:"plant-overview-history-rung-track"
    },group);
    const rungCount=Math.max(2,Math.min(12,Math.round(height/5)));
    for(let rung=0;rung<rungCount;rung+=1){
     const rungY=base-(rung+1)*(height/(rungCount+1));
     const halfWidth=3.1-(rung/rungCount)*.8;
     svgNode("line",{
      x1:x(index)-halfWidth,y1:rungY,x2:x(index)+halfWidth,y2:rungY,
      class:"plant-overview-history-rung"
     },group);
    }
   }else{
    const radius=index===peakIndex?2.7:1.55;
    svgNode("circle",{
     cx:x(index),cy:y(point.value),r:radius,
     class:`plant-overview-history-dot${point.weekend?" is-weekend":""}${point.value<0?" is-negative":""}`
    },group);
   }

   const step=points.length===1?width:width/(points.length-1);
   const hit=svgNode("rect",{
    x:Math.max(0,x(index)-step/2),y:top,width:Math.max(5,step),
    height:base-top+15,fill:"transparent"
   },group);
   bindHit(hit,{figure,output,copy},point.fullLabel||point.label,point.detail);
  });

  const labelIndices=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])];
  labelIndices.forEach(index=>{
   const anchor=index===0?"start":index===points.length-1?"end":"middle";
   svgText(svg,{
    x:index===0?left:index===points.length-1?left+width:x(index),
    y:100,"text-anchor":anchor,class:"plant-overview-history-axis-label"
   },points[index]?.label||"");
  });
  svgNode("title",{},svg).textContent=`${title}, ${series.rangeLabel}`;
  svgHost.replaceChildren(svg);
 }

 return {element:figure,update:render};
}

export function createCombinedHistoryChart(kind){
 const {figure,output,copy}=createFigure("history","Combined energy history");
 figure.classList.add("is-history-combined");
 figure.dataset.historyKind=kind;
 const legend=text("div","plant-overview-history-legend");
 const legendItems=[
  ["home","Home use"],
  ["solar","Solar energy"],
  ["storage","From iStorage"],
  ["grid","Grid exchange"]
 ].map(([id,label])=>{
  const item=text("span",`plant-overview-history-legend-item is-${id}`);
  item.append(
   text("span",`plant-overview-history-legend-swatch is-${id}`),
   text("span","plant-overview-history-legend-label",label)
  );
  return item;
 });
 legend.append(...legendItems);
 const svgHost=text("span","plant-overview-history-canvas is-combined");
 const axis=text("div","plant-overview-combined-axis");
 axis.setAttribute("aria-hidden","true");
 figure.append(legend,svgHost,axis,output);

 function render(snapshot){
  const allSeries=snapshot.series;
  const points=allSeries[0]?.points||[];
  const dense=points.length>60;
  const width=904;
  const left=8;
  const top=10;
  const base=84;
  const x=index=>left+(points.length===1?width/2:index/(points.length-1)*width);
  const values=allSeries.flatMap(series=>series.points.map(point=>point.value));
  const rawMin=Math.min(0,...values);
  const rawMax=Math.max(0,...values);
  const padding=Math.max(.35,Math.abs(rawMax-rawMin)*.08);
  const min=rawMin-padding;
  const max=rawMax+padding;
  const span=Math.max(.1,max-min);
  const y=value=>top+(1-(value-min)/span)*(base-top);
  const zeroY=y(0);
  const svg=svgNode("svg",{
   viewBox:`0 0 ${width} 104`,
   preserveAspectRatio:"none",
   role:"img",
   "aria-label":`Combined energy history, ${snapshot.rangeLabel}`
  });

  for(let gridIndex=0;gridIndex<3;gridIndex+=1){
   const gridY=top+((base-top)/2)*gridIndex;
   svgNode("line",{
    x1:left,y1:gridY,x2:left+width,y2:gridY,
    class:"plant-overview-history-grid-line"
   },svg);
  }
  svgNode("line",{
   x1:left,y1:zeroY,x2:left+width,y2:zeroY,
   class:"plant-overview-history-baseline"
  },svg);

  allSeries.forEach(series=>{
   points.forEach((point,index)=>{
    svgNode("line",{
     x1:x(index),y1:base,x2:x(index),y2:base-(point.weekend?4:7),
     class:"plant-overview-history-floor-tick"
    },svg);
   });
   svgNode("path",{
    d:historyPath(series.points,x,y),
    class:`plant-overview-combined-line is-${series.id} plant-overview-chart-mark`
   },svg);
  });

  points.forEach((point,index)=>{
   const group=mark(svgNode("g",{},svg));
   allSeries.forEach(series=>{
    const seriesPoint=series.points[index];
    if(!seriesPoint)return;
    if((!dense&&(kind==="year"||index%3===0))||(dense&&index%7===0)||index===points.length-1){
     svgNode("circle",{
      cx:x(index),cy:y(seriesPoint.value),r:1.45,
      class:`plant-overview-combined-dot is-${series.id}`
     },group);
    }
   });
   const step=points.length===1?width:width/(points.length-1);
   const hit=svgNode("rect",{
    x:Math.max(0,x(index)-step/2),y:top,width:Math.max(dense?1.8:4,step),
    height:base-top+16,fill:"transparent"
   },group);
   const details=allSeries.map(series=>{
    const seriesPoint=series.points[index];
    const value=series.id==="grid"
     ?`${seriesPoint.value>=0?"+":""}${seriesPoint.value.toFixed(1)} kWh`
     :`${seriesPoint.value.toFixed(1)} kWh`;
    return `${series.title}: ${value}`;
   });
   bindHit(hit,{figure,output,copy},point.fullLabel||point.label,details.join("\n"));
  });

  const labelIndices=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])];
  axis.replaceChildren(...labelIndices.map((index,labelIndex)=>
   text("span",`plant-overview-combined-axis-label is-${labelIndex===0?"start":labelIndex===2?"end":"middle"}`,points[index]?.label||"")
  ));
  svgNode("title",{},svg).textContent=`Combined energy history, ${snapshot.rangeLabel}`;
  svgHost.replaceChildren(svg);
  figure.setAttribute("aria-label",`Combined energy history, ${snapshot.rangeLabel}`);
  figure.dataset.range=snapshot.rangeLabel;
  figure.dataset.pointCount=String(points.length);
 }

 return {element:figure,update:render};
}

export function createSavingsChart(data,{showValues=false}={}){
 const {figure,output,copy}=createFigure("savings","Savings by source and destination");
 figure.classList.toggle("has-visible-values",showValues);
 const list=text("div","plant-overview-chart-savings-list");
 const rows=[
  {label:"iStorage > home",value:data.savings*.48},
  {label:"iStorage > Grid",value:data.savings*.18},
  {label:"Solar > home",value:data.savings*.27},
  {label:"Solar > grid",value:data.savings*.07}
 ];
 const max=Math.max(...rows.map(row=>row.value),.5);
 const maxIndex=rows.reduce((best,row,index)=>row.value>rows[best].value?index:best,0);
 rows.forEach((item,index)=>{
  const group=mark(text("div","plant-overview-chart-savings-row"));
  group.dataset.value=item.value.toFixed(2);
  group.dataset.ratio=(item.value/max).toFixed(4);
  const label=text("span","plant-overview-chart-label is-row-label is-inside",item.label);
  const lane=text("span","plant-overview-chart-savings-lane");
  const track=text("span","plant-overview-chart-lollipop-track");
  track.style.setProperty("--plant-savings-width",`${item.value/max*100}%`);
  const start=svgNode("svg",{
   viewBox:"0 0 11 11",class:"plant-overview-chart-lollipop-start",
   "aria-hidden":"true",focusable:"false"
  });
  svgNode("circle",{cx:5.5,cy:5.5,r:5.5},start);
  const end=svgNode("svg",{
   viewBox:"0 0 15 15",
   class:`plant-overview-chart-lollipop-dot${index===maxIndex?" is-max":""}`,
   "aria-hidden":"true",focusable:"false"
  });
  svgNode("circle",{
   cx:7.5,cy:7.5,r:index===maxIndex?7.5:6.5,
   "stroke-width":index===maxIndex?0:2
  },end);
  track.append(start,end);
  lane.append(track);
  group.append(label,lane);
  if(showValues){
   group.append(text("span","plant-overview-chart-savings-value",`kr ${item.value.toFixed(2)}`,"Caption1/Medium"));
  }
  bindHit(group,{figure,output,copy},item.label,`kr ${item.value.toFixed(2)}`);
  list.append(group);
 });
 figure.append(list,output);
 return figure;
}

function polarPoint(cx,cy,radius,angle){
 const radians=angle*Math.PI/180;
 return {x:cx+Math.cos(radians)*radius,y:cy+Math.sin(radians)*radius};
}

function roundedSectorPath(cx,cy,inner,outer,innerStart,innerEnd,outerStart,outerEnd,cornerRadius=5){
 const radius=Math.max(0,Math.min(cornerRadius,(outer-inner)/2));
 const outerInset=radius/outer*180/Math.PI;
 const innerInset=radius/inner*180/Math.PI;
 const innerStartPoint=polarPoint(cx,cy,inner,innerStart);
 const innerEndPoint=polarPoint(cx,cy,inner,innerEnd);
 const outerStartPoint=polarPoint(cx,cy,outer,outerStart);
 const outerEndPoint=polarPoint(cx,cy,outer,outerEnd);
 const sideStart={x:outerStartPoint.x-innerStartPoint.x,y:outerStartPoint.y-innerStartPoint.y};
 const sideEnd={x:innerEndPoint.x-outerEndPoint.x,y:innerEndPoint.y-outerEndPoint.y};
 const startLength=Math.hypot(sideStart.x,sideStart.y)||1;
 const endLength=Math.hypot(sideEnd.x,sideEnd.y)||1;
 const outerArcStart=polarPoint(cx,cy,outer,outerStart+outerInset);
 const outerArcEnd=polarPoint(cx,cy,outer,outerEnd-outerInset);
 const outerEndAfter={x:outerEndPoint.x+sideEnd.x/endLength*radius,y:outerEndPoint.y+sideEnd.y/endLength*radius};
 const innerEndBefore={x:innerEndPoint.x-sideEnd.x/endLength*radius,y:innerEndPoint.y-sideEnd.y/endLength*radius};
 const innerArcEnd=polarPoint(cx,cy,inner,innerEnd-innerInset);
 const innerArcStart=polarPoint(cx,cy,inner,innerStart+innerInset);
 const innerStartAfter={x:innerStartPoint.x+sideStart.x/startLength*radius,y:innerStartPoint.y+sideStart.y/startLength*radius};
 const outerStartBefore={x:outerStartPoint.x-sideStart.x/startLength*radius,y:outerStartPoint.y-sideStart.y/startLength*radius};
 const large=(outerEnd-outerStart-outerInset*2)>180?1:0;
 return [
  `M${outerArcStart.x} ${outerArcStart.y}`,
  `A${outer} ${outer} 0 ${large} 1 ${outerArcEnd.x} ${outerArcEnd.y}`,
  `Q${outerEndPoint.x} ${outerEndPoint.y} ${outerEndAfter.x} ${outerEndAfter.y}`,
  `L${innerEndBefore.x} ${innerEndBefore.y}`,
  `Q${innerEndPoint.x} ${innerEndPoint.y} ${innerArcEnd.x} ${innerArcEnd.y}`,
  `A${inner} ${inner} 0 ${large} 0 ${innerArcStart.x} ${innerArcStart.y}`,
  `Q${innerStartPoint.x} ${innerStartPoint.y} ${innerStartAfter.x} ${innerStartAfter.y}`,
  `L${outerStartBefore.x} ${outerStartBefore.y}`,
  `Q${outerStartPoint.x} ${outerStartPoint.y} ${outerArcStart.x} ${outerArcStart.y}`,
  "Z"
 ].join(" ");
}

export function createSelfPoweredChart(data,{idPrefix="plant-self"}={}){
 const {figure,output,copy}=createFigure("self-powered","Self-powered source composition");
 const svg=svgNode("svg",{viewBox:"34 0 206 116",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Self-powered source composition"});
 const defs=svgNode("defs",{},svg);
 const ids={
  baseGradient:`${idPrefix}-base-gradient`,
  batteryGradient:`${idPrefix}-battery-gradient`,
  solarGradient:`${idPrefix}-solar-gradient`,
  gridGradient:`${idPrefix}-grid-gradient`,
  baseStrokeGradient:`${idPrefix}-base-stroke-gradient`,
  wedgeStrokeGradient:`${idPrefix}-wedge-stroke-gradient`,
  grainFilter:`${idPrefix}-base-grain-filter`
 };
 const baseGradient=svgNode("radialGradient",{
   id:ids.baseGradient,cx:"38%",cy:"30%",r:"82%"
 },defs);
 svgNode("stop",{offset:"0%",class:"plant-overview-chart-wedge-base-stop is-inner"},baseGradient);
 svgNode("stop",{offset:"100%",class:"plant-overview-chart-wedge-base-stop is-outer"},baseGradient);
 const wedgeGradients={
   battery:svgNode("linearGradient",{id:ids.batteryGradient,x1:"0",y1:"0",x2:"1",y2:"1"},defs),
   solar:svgNode("linearGradient",{id:ids.solarGradient,x1:"0",y1:"0",x2:"1",y2:"1"},defs),
   grid:svgNode("linearGradient",{id:ids.gridGradient,x1:"0",y1:"0",x2:"1",y2:"1"},defs)
 };
 for(const [id,gradient] of Object.entries(wedgeGradients)){
  svgNode("stop",{offset:"0%",class:`plant-overview-chart-wedge-stop is-${id}-start`},gradient);
  svgNode("stop",{offset:"100%",class:`plant-overview-chart-wedge-stop is-${id}-end`},gradient);
 }
 const strokeGradients={
  base:svgNode("linearGradient",{
    id:ids.baseStrokeGradient,gradientUnits:"userSpaceOnUse",x1:"79",y1:"2",x2:"191",y2:"114"
  },defs),
  wedge:svgNode("linearGradient",{
    id:ids.wedgeStrokeGradient,gradientUnits:"userSpaceOnUse",x1:"79",y1:"2",x2:"191",y2:"114"
  },defs)
 };
 for(const [id,gradient] of Object.entries(strokeGradients)){
  svgNode("stop",{offset:"0%",class:`plant-overview-chart-wedge-stroke-stop is-${id}-bright`},gradient);
  svgNode("stop",{offset:"100%",class:`plant-overview-chart-wedge-stroke-stop is-${id}-dim`},gradient);
 }
 const grainFilter=svgNode("filter",{id:ids.grainFilter,x:"0",y:"0",width:"100%",height:"100%"},defs);
 svgNode("feTurbulence",{
  type:"fractalNoise",baseFrequency:".56",numOctaves:"3",seed:"7",stitchTiles:"stitch",result:"noise"
 },grainFilter);
 svgNode("feColorMatrix",{in:"noise",type:"saturate",values:"0",result:"mono"},grainFilter);
 const grainTransfer=svgNode("feComponentTransfer",{in:"mono",result:"grain"},grainFilter);
 svgNode("feFuncA",{type:"table",tableValues:"0 0.34"},grainTransfer);
 svgNode("feComposite",{in:"grain",in2:"SourceGraphic",operator:"in"},grainFilter);
 const sources=[
  {id:"solar",label:"From solar",share:Math.round(data.selfPowered*.28),energy:data.homeToday*Math.round(data.selfPowered*.28)/100},
  {id:"battery",label:"From battery",share:Math.round(data.selfPowered*.72),energy:data.homeToday*Math.round(data.selfPowered*.72)/100},
  {id:"grid",label:"From grid",share:Math.max(0,100-Math.round(data.selfPowered*.28)-Math.round(data.selfPowered*.72)),energy:data.homeToday*(100-Math.round(data.selfPowered*.28)-Math.round(data.selfPowered*.72))/100}
 ].sort((a,b)=>b.share-a.share);
 const cx=135,cy=58;
 const innerRadius=14;
 const maxOuterRadius=56;
 const slotAngle=120;
 const gapSize=5;
 const gapAngle=radius=>Math.asin(Math.min(.49,gapSize/(2*radius)))*180/Math.PI;
 sources.forEach((source,sourceIndex)=>{
  const group=mark(svgNode("g",{},svg));
  const slotStart=-90+sourceIndex*slotAngle;
  const slotEnd=slotStart+slotAngle;
  const outerRadius=innerRadius+(maxOuterRadius-innerRadius)*(source.share/100);
  const hoverRadius=Math.min(maxOuterRadius+2,outerRadius+2.5);
  const basePath=roundedSectorPath(
   cx,cy,innerRadius,maxOuterRadius,
   slotStart+gapAngle(innerRadius),slotEnd-gapAngle(innerRadius),
   slotStart+gapAngle(maxOuterRadius),slotEnd-gapAngle(maxOuterRadius),
   6
  );
  const basePathNode=svgNode("path",{
   d:basePath,
   class:`plant-overview-chart-wedge-base is-${source.id}`,
   style:`fill:url(#${ids.baseGradient});stroke:url(#${ids.baseStrokeGradient})`
  },group);
  svgNode("path",{
   d:basePath,
   class:`plant-overview-chart-wedge-base-grain is-${source.id}`,
   filter:`url(#${ids.grainFilter})`
  },group);
  const wedge=svgNode("path",{
   d:roundedSectorPath(
    cx,cy,innerRadius,outerRadius,
    slotStart+gapAngle(innerRadius),slotEnd-gapAngle(innerRadius),
    slotStart+gapAngle(outerRadius),slotEnd-gapAngle(outerRadius),
    4.5
   ),
   class:`plant-overview-chart-wedge is-${source.id}`,
   style:`fill:url(#${ids[`${source.id}Gradient`]});stroke:url(#${ids.wedgeStrokeGradient})`
  },group);
  wedge.dataset.share=String(source.share);
  wedge.dataset.radius=outerRadius.toFixed(3);
  svgNode("path",{
   d:roundedSectorPath(
    cx,cy,innerRadius,hoverRadius,
    slotStart+gapAngle(innerRadius),slotEnd-gapAngle(innerRadius),
    slotStart+gapAngle(hoverRadius),slotEnd-gapAngle(hoverRadius),
    4.5
   ),
   class:`plant-overview-chart-wedge is-${source.id} is-hover`,
   "aria-hidden":"true"
  },group);
  const mid=(slotStart+slotEnd)/2;
  const calloutPositions={
   battery:{x:198,y:32},
   solar:{x:198,y:94},
   grid:{x:67,y:42}
  };
  const labelPoint=calloutPositions[source.id]||calloutPositions.battery;
  const name=source.label.replace(/^From /,"").replace(/^./,letter=>letter.toUpperCase());
  const labelGroup=svgNode("g",{class:"plant-overview-chart-source-label is-outside"},group);
  const onRight=labelPoint.x>cx;
  const lineStart=polarPoint(cx,cy,outerRadius+2,mid);
  const elbow={x:lineStart.x+(onRight?12:-12),y:labelPoint.y-1};
  svgNode("polyline",{
   points:`${lineStart.x},${lineStart.y} ${elbow.x},${elbow.y} ${labelPoint.x+(onRight?-4:4)},${elbow.y}`,
   class:"plant-overview-chart-callout-line"
  },group);
  const labelAnchor=onRight?"start":"end";
  svgText(labelGroup,{x:labelPoint.x,y:labelPoint.y-1,"text-anchor":labelAnchor,class:`plant-overview-chart-source-value is-${source.id}`},`${source.share}%`);
  svgText(labelGroup,{x:labelPoint.x,y:labelPoint.y+15,"text-anchor":labelAnchor,class:`plant-overview-chart-source-name is-${source.id}`},name);
  bindHit(basePathNode,{figure,output,copy},source.label,`${source.share}% · ${source.energy.toFixed(1)} kWh`);
 });
 figure.append(svg,output);
 return figure;
}

export function createCurrentStateChart(data){
 const figure=text("figure","plant-overview-stat-chart is-current plant-current-state");
 figure.setAttribute("aria-label","Current operating state and power");
 const list=text("div","plant-current-state-list");
 const rows=[
  {id:"battery",name:"Battery",state:data.batteryRate>0.05?"Charging":data.batteryRate<-0.05?"Discharging":"Standby",valueText:`${data.batteryRate<0?"−":""}${Math.abs(data.batteryRate).toFixed(1)}`},
  {id:"grid",name:"Grid",state:data.grid>0?"Importing":"Exporting",valueText:`${data.grid>0?"+":"−"}${Math.abs(data.grid).toFixed(1)}`},
  {id:"home",name:"Home",state:"Using",valueText:data.home.toFixed(1)},
  {id:"solar",name:"Solar",state:"Generating",valueText:data.solar.toFixed(1)}
 ];
 rows.forEach((item,index)=>{
  const row=mark(text("div","plant-current-state-row"));
  row.setAttribute("role","group");
  row.setAttribute("aria-label",`${item.name}: ${item.state}, ${item.valueText} kW`);
  row.style.setProperty("--plant-current-delay",`${index*70}ms`);
  const name=text("span","plant-current-state-name",item.name,"Footnote/Medium");
  const pill=text("span",`plant-current-state-pill is-${item.id}`);
  pill.append(
   text("span","plant-overview-chart-state",item.state),
   text("span","plant-overview-chart-value",`${item.valueText} kW`)
  );
  row.append(name,pill);
  list.append(row);
 });
 figure.append(list);
 return figure;
}
