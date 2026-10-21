// Shared formal Figma material. Source parameters are archived under design/figma.
import {preserveCornerProfile} from "../foundations/geometry.js";
export function createGlassMaterial({surfaces}){
 const html=document.documentElement;
 html.dataset.glass="figma";
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 const fine=matchMedia("(hover: hover) and (pointer: fine)");
 const hosts=new Set(),cleanups=new Map();
 // Pointer tracking is event-driven and batched once per animation frame.
 // Only the active surface is updated; no persistent animation loop or tilt.
 let active=null,pending=null,frame=0;
 function clear(){if(active)active.removeAttribute("data-glass-pointer");active=null;pending=null;cancelAnimationFrame(frame);frame=0;}
 function track(host,event){
  if(host.matches(':disabled,[aria-disabled="true"]')){clear();return;}
  if(reduced.matches||!fine.matches||event.pointerType==="touch")return;
  // Nested surfaces bubble into every ancestor host. Only the innermost glass
  // under the pointer owns the light: otherwise the outer popover steals the
  // pointer state from its own date fields and buttons, leaving them dark.
  const owner=event.target instanceof Element?event.target.closest(".wd-glass"):null;
  if(owner&&owner!==host)return;
  if(active!==host){clear();active=host;host.setAttribute("data-glass-pointer","");}
  pending={host,x:event.clientX,y:event.clientY};
  if(!frame)frame=requestAnimationFrame(()=>{
   frame=0;if(!pending)return;
   const {host,x,y}=pending,rect=host.getBoundingClientRect();
   host.style.setProperty("--glass-x",`${Math.max(0,Math.min(100,(x-rect.left)/rect.width*100))}%`);
   host.style.setProperty("--glass-y",`${Math.max(0,Math.min(100,(y-rect.top)/rect.height*100))}%`);
  });
 }
 // A disc gets the same material, but needs a narrower edge response and a
 // local halo so its 36px silhouette does not lose the highlight that larger
 // cards can carry over a longer edge. Classification stays in the shared
 // material and follows runtime size changes; it never writes geometry.
 function syncShape(host){
  preserveCornerProfile(host);
  const style=getComputedStyle(host),width=host.offsetWidth,height=host.offsetHeight;
  const radius=parseFloat(style.borderTopLeftRadius)||0;
  const square=width>0&&height>0&&Math.abs(width-height)<=1;
  host.classList.toggle("wd-glass--disc",square&&radius>=Math.min(width,height)/2-.01);
 }
 const observer=new ResizeObserver(entries=>{for(const {target}of entries)syncShape(target);});
 function addSurface({host,radius,chrome=false,interactive=true}){
  if(!host)throw Error("Glass surface host is required");
  if(host.querySelector(":scope>.wd-glass-material"))throw Error("Glass is already mounted on this surface");
  if(getComputedStyle(host).position==="static")host.style.position="relative";
  host.classList.add("wd-glass");
  // Container chrome owns one continuous glass fill, so the group itself must
  // not scale. Its individual actions receive their own local depth instead.
  if(chrome)host.classList.add("wd-glass-chrome");
  // Static surfaces keep the shared material and pointer optics but never
  // lift on hover or press. Interaction semantics live with the surface, so a
  // display-only card cannot accidentally inherit a click affordance.
  if(!interactive)host.classList.add("wd-glass--static");
  if(radius)host.style.borderRadius=radius+"px";
  preserveCornerProfile(host,{radius});syncShape(host);
  const material=document.createElement("span");material.className="wd-glass-material";material.setAttribute("aria-hidden","true");
  const fill=document.createElement("span");fill.className="wd-glass-fill";
  const optics=document.createElement("span");optics.className="wd-glass-optics";
  for(const name of ["rim","state","glow"]){const layer=document.createElement("span");layer.className=`wd-glass-${name}`;optics.append(layer);}
  material.append(fill,optics);
  host.prepend(material);hosts.add(host);observer.observe(host);
  const follow=event=>track(host,event),leave=()=>{if(active===host)clear();};
  const listeners=[];
  for(const [name,handler]of [["pointerenter",follow],["pointermove",follow],["pointerleave",leave],["pointercancel",clear]]){
   host.addEventListener(name,handler);listeners.push(()=>host.removeEventListener(name,handler));
  }
  cleanups.set(host,listeners);
  return host;
 }
 function removeSurface(host){
  if(!host||!hosts.has(host))return;
  if(active===host)clear();
  for(const remove of cleanups.get(host)||[])remove();
  cleanups.delete(host);hosts.delete(host);observer.unobserve(host);
  host.querySelector(":scope>.wd-glass-material")?.remove();
  host.classList.remove("wd-glass","wd-glass--disc","wd-glass--static");delete host.dataset.cornerProfile;
 }
 for(const surface of surfaces)addSurface(surface);
 reduced.addEventListener("change",clear);fine.addEventListener("change",clear);window.addEventListener("blur",clear);document.addEventListener("scroll",clear,true);
 return {addSurface,removeSurface,destroy(){
  clear();observer.disconnect();reduced.removeEventListener("change",clear);fine.removeEventListener("change",clear);
  for(const listeners of cleanups.values())listeners.forEach(remove=>remove());
  window.removeEventListener("blur",clear);document.removeEventListener("scroll",clear,true);
  for(const host of hosts){host.querySelector(":scope>.wd-glass-material")?.remove();host.classList.remove("wd-glass","wd-glass--disc","wd-glass--static");}
  hosts.clear();cleanups.clear();
 }};
}
