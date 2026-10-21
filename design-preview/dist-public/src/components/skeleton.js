/*
 * Shared loading placeholders.
 *
 * A page marks only the regions whose content is actually waiting, then calls
 * settle() once it exists. One overlay per host, layered above the host's own
 * background so the card radius, border and material never change. Bars are
 * generated from a named profile and sized in pixels from the host's current
 * box, so one profile follows responsive widths without a second layout pass.
 *
 * Timing: the surface stays untouched for a short delay. If content is ready
 * first, no placeholder is ever painted. Otherwise the placeholder covers the
 * host in the same frame the real content yields, runs exactly one sheen, and
 * the content returns with one shared stagger. Nothing reserves extra space,
 * so the reveal never reflows or shifts the page.
 */
import {preserveCornerProfile} from "../foundations/geometry.js";

const BARS = {
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

function buildLayer(profile, host){
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

const PROFILES=new Set(["chart","status","links","text"]);

/* Discover marked hosts once, then let the page settle them together. A page
 * only writes data-skeleton="chart" (etc.) on the region that is genuinely
 * waiting; future cards inherit the same profiles and timing. A per-host
 * data-skeleton-order is optional and only used for a deliberate cascade. */
export function mountSkeletons({root=document,delay}={}){
  const instances=[];
  root.querySelectorAll("[data-skeleton]").forEach(host=>{
    const profile=host.dataset.skeleton;
    if(!PROFILES.has(profile))throw Error("Unknown skeleton profile: "+profile);
    const order=Number(host.dataset.skeletonOrder||0);
    instances.push(createSkeleton({host,profile,delay,order:Number.isFinite(order)?order:0}));
  });
  return {
    instances,
    settle(instant=false){instances.forEach(item=>item.settle(instant));},
    allSettled(){return Promise.all(instances.map(item=>item.whenSettled))},
    destroy(){instances.forEach(item=>item.destroy());}
  };
}

export function createSkeleton({host, profile = "text", delay, order = 0}){
  if(!host) throw Error("Skeleton host is required");
  if(host.dataset.skeletonState) throw Error("Skeleton is already mounted on this host");
  host.classList.add("wd-skeleton");
  host.dataset.skeletonState = "waiting";
  host.dataset.skeletonProfile = profile;
  host.setAttribute("aria-busy","true");
  host.style.setProperty("--wd-skeleton-order", String(order));
  // Waiting content is not yet interactive: keep keyboard focus out, but let
  // the visible shell around it stay usable.
  host.dataset.skeletonOwnInert = host.inert ? "0" : "1";
  host.inert=true;
  if(getComputedStyle(host).position === "static") host.style.position = "relative";
  let layer = buildLayer(profile, host);
  host.append(layer);
  preserveCornerProfile(host);

  let settled = false;
  let resolveSettled;
  const whenSettled = new Promise(resolve=>{resolveSettled=resolve});
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  // The anti-flash threshold applies even when motion is reduced: a slow load
  // still needs a visible placeholder, it just does not animate.
  const timer = setTimeout(()=>{
    if(settled) return;
    // Content yields and the placeholder paints in one recalculation, so the
    // card never flashes empty between the two states.
    host.dataset.skeletonState = "pending";
  }, delay ?? 140);

  const resize = new ResizeObserver(()=>{
    if(settled || host.dataset.skeletonState === "waiting") return;
    const next = buildLayer(profile, host);
    next.style.opacity = "1";
    next.style.visibility = "visible";
    layer.replaceWith(next);
    layer = next;
  });
  resize.observe(host);

  let fadeTimer = 0;
  function tokenMs(name){
    const value=getComputedStyle(host).getPropertyValue(name).trim();
    return parseFloat(value)*(value.endsWith("ms")?1:1000)||0;
  }
  function finish(){
    layer.remove();
    delete host.dataset.skeletonState;
    delete host.dataset.skeletonProfile;
    host.classList.remove("wd-skeleton");
    host.removeAttribute("aria-busy");
    if(host.dataset.skeletonOwnInert === "1") host.inert=false;
    resolveSettled();
  }
  function settle(instant = false){
    if(settled) return;
    settled = true;
    clearTimeout(timer);
    resize.disconnect();
    if(host.dataset.skeletonState === "waiting"){
      // Nothing was painted: release the original content in this frame.
      finish();
      return;
    }
    if(instant){
      // Reduced motion still gets the placeholder for a slow load, but no
      // fade. Remove it immediately so the ready content is interactive.
      finish();
      return;
    }
    host.dataset.skeletonState = "settled";
    // Hold the marker until the layer fade and the content reveal both finish.
    // Timing comes from the shared loading tokens, not a hard-coded hand-off.
    const reveal=tokenMs("--wd-motion-skeleton-in")+tokenMs("--wd-motion-stagger")*order;
    const out=tokenMs("--wd-motion-skeleton-out");
    fadeTimer = setTimeout(finish, Math.max(reveal,out)+48);
  }
  function destroy(){ clearTimeout(fadeTimer); settle(true); }
  return {settle, destroy, profile, host, whenSettled};
}
