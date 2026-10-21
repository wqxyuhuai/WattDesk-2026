const fs=require('fs');
const f='design-preview/src/components/skeleton.js';
let s=fs.readFileSync(f,'utf8');
const start=s.indexOf('const BARS = {');
const end=s.indexOf('function buildLayer');
const replacement=`const BARS = {
  // Chart card: heading row, metric row and a measured plot area. Heights use
  // the host's real pixel box so a 240px card never draws a 14-70% grey slab.
  chart(host){
    const w = host.clientWidth, h = host.clientHeight;
    const pad = Math.round(Math.max(18, Math.min(32, w * .04)));
    const plotTop = Math.round(Math.max(96, h * .42));
    const plotBottom = h - Math.round(Math.max(18, h * .09));
    const rows = [
      {x:pad,y:pad,w:Math.round(w*.34),h:5,r:5,soft:true},
      {x:pad,y:pad+24,w:Math.round(w*.16),h:16,r:5,soft:true},
      {x:pad+Math.round(w*.20),y:pad+27,w:Math.round(w*.10),h:5,r:5,soft:true}
    ];
    // Three quiet baselines read as a chart frame rather than a block.
    for(let i=0;i<3;i++) rows.push({x:pad,y:plotTop+i*Math.round((plotBottom-plotTop)/2),w:w-pad*2,h:1,line:true});
    const left = pad, area = w - pad*2;
    const count = w < 420 ? 7 : 10, gap = Math.max(4, Math.round(area*.014));
    const bar = Math.max(6, (area - gap*(count-1))/count);
    const ratios = [.30,.44,.36,.58,.48,.72,.52,.66,.56,.80,.62,.74];
    for(let i=0;i<count;i++){
      const bh = Math.round((plotBottom-plotTop-10)*ratios[i%ratios.length]);
      rows.push({x:left+i*(bar+gap),y:plotBottom-bh,w:bar,h:bh,r:Math.min(4,bar/2),soft:true});
    }
    return rows;
  },
  // Status card: leading disc, arrow chip, title, value and caption. Every
  // dimension is in pixels; percentage discs turn oval in a 150px card.
  status(host){
    const w=host.clientWidth,h=host.clientHeight;
    const pad=Math.round(Math.max(16,Math.min(24,w*.075)));
    const disc=Math.round(Math.min(30,Math.max(22,w*.115)));
    const chip=Math.round(24);
    return [
      {x:pad,y:pad,w:disc,h:disc,round:true},
      {x:w-pad-chip,y:pad,w:chip,h:chip,round:true},
      {x:pad,y:Math.round(h*.44),w:Math.round(w*.44),h:5,r:5,soft:true},
      {x:pad,y:Math.round(h*.44)+15,w:Math.round(w*.52),h:16,r:5,soft:true},
      {x:pad,y:h-Math.round(pad*.9)-4,w:Math.round(w*.60),h:4,r:4,soft:true}
    ];
  },
  // Shortcut column: one group heading and five icon + label rows.
  links(host){
    const w=host.clientWidth,h=host.clientHeight,pad=Math.round(Math.max(0,w*.02));
    const icon=18,row=Math.round(Math.max(30,h/6));
    const rows=[{x:pad,y:0,w:Math.round(Math.min(150,w*.34)),h:4,r:4,soft:true}];
    for(let i=0;i<5;i++){
      const y=Math.round(28+i*row);
      rows.push({x:pad,y,w:icon,h:icon,r:5,soft:true});
      rows.push({x:pad+icon+12,y:y+7,w:Math.round(Math.min(w*.46,140)),h:4,r:4,soft:true});
    }
    return rows;
  },
  // Generic text block: a title plus body lines.
  text(){
    return [
      {x:0,y:0,w:42,h:5,soft:true},
      {x:0,y:35,w:78,h:4,soft:true},
      {x:0,y:52,w:64,h:4,soft:true}
    ];
  }
};

`;
s=s.slice(0,start)+replacement+s.slice(end);
// Replace buildLayer with pixel-aware version
const b0=s.indexOf('function buildLayer');
const b1=s.indexOf('export function createSkeleton');
const builder=`function buildLayer(profile, host){
  const layer = document.createElement("div");
  layer.className = "wd-skeleton-layer";
  layer.setAttribute("aria-hidden","true");
  const rows = (BARS[profile] || BARS.text)(host);
  for(const row of rows){
    const bar = document.createElement("span");
    bar.className = "wd-skeleton-bar";
    bar.style.left = row.x + "px";
    bar.style.top = row.y + "px";
    bar.style.width = row.w + "px";
    bar.style.height = row.h + "px";
    if(row.r !== undefined) bar.style.borderRadius = row.r + "px";
    if(row.round) bar.dataset.round = "";
    if(row.soft) bar.dataset.soft = "";
    if(row.line){ bar.style.height = "1px"; bar.style.opacity = ".5"; }
    layer.append(bar);
  }
  return layer;
}

`;
s=s.slice(0,b0)+builder+s.slice(b1);
fs.writeFileSync(f,s);
console.log('patched');
