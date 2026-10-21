// Responsive reflow for the Figma-extracted home scene. The absolute canvas is
// page-specific: card grids, chart internals and the period row are re-anchored
// to the available width instead of scaling the whole region.
export function createHomeLayout(ctx){
 const {get,layoutNode,homeColumn,homeCanvas,workspacePanel,statusCards,energyCards,businessCards,periodHeader,periodArea}=ctx;
 const statusGridHeight=150,gridGap=20;

 function layoutGrid(cards,host,columns,height,gap=gridGap){
  if(!host)return;
  host.style.width="100%";
  const rows=Math.ceil(cards.length/columns);
  host.style.height=(rows*height+(rows-1)*gap)+"px";
  for(const [index,card] of cards.entries()){
   const column=index%columns,row=Math.floor(index/columns);
   card.style.width=columns===1?"100%":`calc((100% - ${gap*(columns-1)}px)/${columns})`;
   card.style.left=columns===1?"0":`calc(${column*100/columns}% + ${column*gap/columns}px)`;
   card.style.top=row*(height+gap)+"px";
  }
 }
 // Card content is part of the reflow, not scaled with the surface. The original
 // 16/20/21px insets remain; only the available inner width changes.
 function fitStatusCard(card){
  const inner=get(`I${card.dataset.nodeId};14536:3846`);
  const top=get(`I${card.dataset.nodeId};14536:3845`);
  const arrow=get(`I${card.dataset.nodeId};14536:3833`);
  const copy=get(`I${card.dataset.nodeId};14536:3844`);
  if(!inner||!top)return;
  // The two cards were exported at 218px and 250.7px. Reflow gives them the
  // same width, so the glass plate must follow the card instead of keeping the
  // old 250.7px surface that pushed its bottom-right rim past the arrow.
  const surface=[...card.children].find(el=>el!==inner&&/Glass|Liquid/.test(el.dataset.name||""));
  if(surface){surface.style.left="0";surface.style.top="0";surface.style.width="100%";surface.style.height="100%";}
  inner.style.width="calc(100% - 32px)";top.style.width="100%";
  if(arrow){arrow.style.left="auto";arrow.style.right="0";arrow.style.top="0";}
  if(copy){copy.style.left="0";copy.style.width="100%";}
 }
 function fitChartCard(card,small=false){
  const pad=small?21:20;
  const body=[...card.children].find(el=>el.dataset.name==="Frame 42");
  const chart=[...card.children].find(el=>el.dataset.name==="Bucket chart");
  if(body){body.style.left=pad+"px";body.style.width=`calc(100% - ${pad*2}px)`;body.style.top=pad+"px";}
  for(const child of body?.children||[]){
   child.style.width="100%";
   if(child.dataset.name==="Heading"){
    const menu=[...child.children].find(el=>/Menu Dots/.test(el.dataset.name||"")||el.classList.contains("chart-menu"));
    if(menu){menu.style.left="auto";menu.style.right="-6px";menu.style.top="-6px";}
    const title=[...child.children].find(el=>el.dataset.name==="Title");
    if(title){title.style.width="calc(100% - 24px)";title.classList.add("chart-card-title");}
   }
  }
  if(!chart)return;
  const chartTop=small?87:82,chartHeight=small?132:138,axisGutter=small?32:36;
  chart.style.left=pad+"px";chart.style.top=chartTop+"px";
  chart.style.width=`calc(100% - ${pad*2}px)`;chart.style.height=chartHeight+"px";
  const plotWidth=`calc(100% - ${axisGutter}px)`;
  for(const child of chart.children){
   const name=child.dataset.name||"";
   if(/^Grid /.test(name)){child.style.left="0";child.style.width=plotWidth;}
   else if(/^Axis /.test(name)){child.style.left="auto";child.style.right="0";}
   else if(/ \/ (Area|Line)$/.test(name)){
    const baseX=parseFloat(child.dataset.baseX??child.style.left)||0;
    const baseW=parseFloat(child.dataset.baseW??child.style.width)||1;
    child.dataset.baseX=baseX;child.dataset.baseW=baseW;
    const basePlot=small?168.5:419;
    child.style.left=`calc((100% - ${axisGutter}px) * ${baseX/basePlot})`;
    child.style.width=`calc((100% - ${axisGutter}px) * ${baseW/basePlot})`;
   }
   else if(/^Daily count/.test(name)){
    const index=Number(name.split(" ").pop())||0;
    const count=7,bar=small?15.24:5.2;
    child.style.left=`calc((100% - ${axisGutter}px) * ${(index+.5)/count} - ${bar/2}px)`;
    child.style.width=bar+"px";
   }
  }
 }
 function fitShortcutColumns(width){
  const columns=width>=680?3:width>=440?2:1;
  get("14612:7837").style.setProperty("--wd-shortcut-columns",columns);
  const kids=[...get("14612:7837").children];
  for(const [index,column] of kids.entries()){
   column.style.position="relative";
   column.style.left="auto";column.style.top="0";
   column.style.height=(index===0?170:206)+"px";
  }
  return columns;
 }
 function resize(){
  const h=innerHeight;
  const rootStyle=getComputedStyle(document.documentElement);
  const mainOffset=parseFloat(rootStyle.getPropertyValue("--wd-shell-main-offset"))||278;
  get("14445:3629").style.height=(h-40)+"px";
  get("14612:8480").style.left=mainOffset+"px";
  get("14612:8480").style.width=(innerWidth-mainOffset-20)+"px";get("14612:8480").style.height=(h-40)+"px";
  get("14612:8479").style.width="100%";
  get("14578:6145").style.width="100%";get("14578:6145").style.height=(h-86)+"px";
  const column=get("14578:7006");
  const gutter=parseFloat(rootStyle.getPropertyValue("--wd-content-shadow-gutter"))||48;
  const available=Math.max(240,workspacePanel.clientWidth-gutter*2);
  const width=Math.min(1000,available);
  // Four only at the full canvas; otherwise a strict 2/1 rhythm, never 3+1.
  const columns=width>=860?4:width>=520?2:1;
  layoutNode.statusRow.style.width=width+"px";
  homeCanvas.style.width=width+"px";
  homeCanvas.style.left="0px";
  for(const key of ["search","shortcuts","welcome","statusRow"])layoutNode[key].style.width=width+"px";
  layoutNode.search.style.left="0px";layoutNode.welcome.style.left="0px";
  // Source welcome frame is 381px at x=309.5; keep its centered text but let
  // narrow layouts reclaim height when the title wraps to a second line.
  const welcomeTitle=get("14445:3352");welcomeTitle.style.width=width+"px";welcomeTitle.classList.add("home-welcome-title");
  // Two-line headlines need their own height; a fixed 41px frame would overlap
  // the search field. Measure, then re-measure after that new height applies.
  welcomeTitle.style.height="auto";
  let welcomeHeight=Math.max(41,welcomeTitle.scrollHeight||welcomeTitle.offsetHeight);
  layoutNode.welcome.style.width=width+"px";layoutNode.welcome.style.height=welcomeHeight+"px";
  welcomeTitle.style.height=welcomeHeight+"px";
  // Search and shortcuts live inside Frame 50, whose own y already includes the
  // 201px intro offset. Position them in canvas coordinates and subtract the
  // parent's origin, so nested offsetTop values are never counted twice.
  const searchTop=layoutNode.welcome.offsetTop+welcomeHeight+40;
  const shortcutsTop=searchTop+46+18+14;
  const canvasOrigin=el=>{let top=0,node=el;while(node&&node!==homeCanvas&&node!==homeColumn&&node!==document.body){top+=node.offsetTop;node=node.offsetParent}return top};
  const placeTop=(node,y)=>{if(node)node.style.top=(y-canvasOrigin(node.offsetParent))+"px"};
  placeTop(layoutNode.search,searchTop);
  placeTop(layoutNode.shortcuts,shortcutsTop);
  const introFrame=get("14612:8452");
  if(introFrame)introFrame.style.width="100%";
  get("14537:4510").style.width=width+"px";
  layoutNode.statusRow.style.left="0px";
  layoutNode.period.style.left="0px";layoutNode.period.style.width=width+"px";
  // The exported card area keeps a 1000px frame; let the reflow own its width
  // so every chart card and the refresh control stay inside the content column.
  periodArea.style.width="100%";
  layoutNode.energyRow.style.width="100%";layoutNode.businessRow.style.width="100%";
  const statusColumns=columns;
  // Re-anchor the search field's inner row; the Figma export fixed it at 915px.
  const searchInner=get("I14445:3354;14420:2221"),searchLeft=get("I14445:3354;14420:2221;14420:2193"),searchRight=get("I14445:3354;14420:2221;14420:2196");
  if(searchInner)searchInner.style.width="100%";
  if(searchLeft)searchLeft.style.width="calc(100% - 98px)";
  const searchText=get("I14445:3354;14420:2221;14420:2195");
  if(searchText){searchText.style.width="calc(100% - 26px)";searchText.style.height="100%";searchText.style.overflow="hidden";searchText.style.whiteSpace="nowrap";}
  if(searchRight)searchRight.style.left="auto",searchRight.style.right="20px";
  layoutGrid(statusCards,layoutNode.statusRow,statusColumns,statusGridHeight);
  const statusRows=Math.ceil(statusCards.length/statusColumns);
  for(const card of statusCards)fitStatusCard(card);
  const statusHeight=statusRows*statusGridHeight+(statusRows-1)*gridGap;
  fitShortcutColumns(width);
  const shortcutHeight=layoutNode.shortcuts.offsetHeight;
  const statusTop=shortcutsTop+shortcutHeight+40;
  placeTop(layoutNode.statusRow,statusTop);
  placeTop(layoutNode.period,statusTop+statusHeight+40);
  if(introFrame)introFrame.style.height=(shortcutsTop-201+shortcutHeight)+"px";
  const energyColumns=Math.min(2,columns),businessColumns=columns;
  layoutGrid(energyCards,layoutNode.energyRow,energyColumns,240);
  const energyRows=Math.ceil(energyCards.length/energyColumns);
  const energyHeight=energyRows*240+(energyRows-1)*gridGap;
  layoutNode.businessRow.style.top=(energyHeight+10)+"px";
  layoutNode.businessRow.style.left="0px";layoutNode.energyRow.style.left="0px";
  layoutGrid(businessCards,layoutNode.businessRow,businessColumns,240);
  const businessRows=Math.ceil(businessCards.length/businessColumns);
  const businessHeight=businessRows*240+(businessRows-1)*gridGap;
  for(const card of [...energyCards,...businessCards])fitChartCard(card,card===businessCards[0]||card===businessCards[1]||card===businessCards[2]||card===businessCards[3]);
  const cardsHeight=energyHeight+10+businessHeight;
  periodArea.style.height=(cardsHeight+16)+"px";
  const periodHeight=46+cardsHeight+32;
  layoutNode.period.style.height=periodHeight+"px";
  get("14537:4510").style.height=(layoutNode.period.offsetTop+periodHeight)+"px";
  homeCanvas.style.height=(layoutNode.period.offsetTop+periodHeight+32)+"px";
  const panelWidth=workspacePanel.clientWidth;
  column.style.width=panelWidth+"px";column.style.left="0px";column.style.transform="none";column.style.transformOrigin="top left";column.style.height=(h-88)+"px";
  homeCanvas.style.left=Math.max(0,(panelWidth-width)/2)+"px";
  homeCanvas.style.right="auto";
  periodHeader.style.width=width+"px";
  // The header row is right-anchored to the reflowed content, not the source canvas.
  ctx.period?.setRowRight(width);
  ctx.period?.fit();
 }
 addEventListener("resize",resize);
 return {resize};
}
