const fs=require('fs');
const f='design-preview/src/components/skeleton.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(` * generated from a named profile and sized in percentages, so the same profile
 * follows the host at any width without a second set of measurements.
 *`,` * generated from a named profile and sized in pixels from the host's current
 * box, so one profile follows responsive widths without a second layout pass.
 *`);
s=s.replace(`  {x:pad+icon+12,y:y+7,w:Math.round(Math.min(w*.46,140)),h:4,r:4,soft:true},`,`  {x:pad+icon+12,y:y+7,w:Math.round(Math.min(w*.46,140)),h:4,r:4,soft:true},`);
// add mountSkeletons before createSkeleton
const anchor='export function createSkeleton';
const mount=`const PROFILES=new Set(["chart","status","links","text"]);

/* Discover marked hosts once, then let the page settle them together. A page
 * only writes data-skeleton="chart" (etc.) on the region that is genuinely
 * waiting; future cards inherit the same profiles and timing. */
export function mountSkeletons({root=document,delay}={}){
  const instances=[];
  root.querySelectorAll("[data-skeleton]").forEach((host,index)=>{
    const profile=host.dataset.skeleton;
    if(!PROFILES.has(profile))throw Error("Unknown skeleton profile: "+profile);
    instances.push(createSkeleton({host,profile,delay,order:Math.min(index,7)}));
  });
  return {
    instances,
    settle(instant=false){instances.forEach(item=>item.settle(instant));},
    destroy(){instances.forEach(item=>item.destroy());}
  };
}

`;
s=s.replace(anchor,mount+anchor);
// inert handling
s=s.replace(`  host.setAttribute("aria-busy","true");
  host.style.setProperty("--wd-skeleton-order", String(order));`,`  host.setAttribute("aria-busy","true");
  host.style.setProperty("--wd-skeleton-order", String(order));
  // Waiting content is not yet interactive: keep keyboard focus out, but let
  // the visible shell around it stay usable.
  const wasInert=host.inert;
  if(!wasInert)host.inert=true;`);
s=s.replace(`    host.removeAttribute("aria-busy");
    if(host.dataset.skeletonState !== "pending" || instant){`,`    host.removeAttribute("aria-busy");
    if(!wasInert)host.inert=false;
    if(host.dataset.skeletonState !== "pending" || instant){`);
fs.writeFileSync(f,s);
console.log('ok');
