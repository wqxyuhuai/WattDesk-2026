import {motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";

const ICON_NS="http://www.w3.org/2000/svg";

// Connection icons come from the supplied 24px exports. They mix neutral ink
// with a semantic red, so they are inlined instead of used as a monochrome CSS
// mask: "ink" and "muted" bars follow the current colour, while "alert" keeps
// the artwork's native red unless a caller explicitly remaps it.
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

function animateConnectionGlyph(svg,connection){
 if(!svg.isConnected||reducedMotion())return;
 const paths=[...svg.querySelectorAll("path")];
 const bars=paths.filter(path=>path.getAttribute("fill-opacity")==="0.3"||path.getAttribute("fill")==="currentColor");
 const alert=paths.find(path=>path.getAttribute("fill")!=="currentColor"&&path.getAttribute("fill-opacity")!=="0.3");
 const duration=motionDuration("--wd-motion-ambient");
 const stagger=motionDuration("--wd-motion-ambient-stagger");
 const enterEase=motionEasing("--wd-ease-spring");
 const exitEase=motionEasing("--wd-ease-hover-out");
 const animations=[];
 bars.forEach((bar,index)=>{
  bar.style.transformBox="fill-box";
  bar.style.transformOrigin="50% 100%";
  const animation=bar.animate([
   {offset:0,transform:"scaleY(.08)",opacity:0,easing:enterEase},
   {offset:.18,transform:"scaleY(1.06)",opacity:1,easing:enterEase},
   {offset:.24,transform:"scaleY(.96)",opacity:1,easing:enterEase},
   {offset:.32,transform:"scaleY(1)",opacity:1,easing:"linear"},
   {offset:.68,transform:"scaleY(1)",opacity:1,easing:exitEase},
   {offset:.9,transform:"scaleY(.08)",opacity:0,easing:"linear"},
   {offset:1,transform:"scaleY(.08)",opacity:0}
  ],{duration,delay:index*stagger,iterations:Infinity,fill:"both"});
  animations.push(animation);
 });
 if(alert){
  alert.style.transformBox="fill-box";
  alert.style.transformOrigin="50% 50%";
  const animation=alert.animate([
   {offset:0,transform:"rotate(-55deg) scale(.72)",opacity:0,easing:enterEase},
   {offset:.16,transform:"rotate(0deg) scale(1.1)",opacity:1,easing:enterEase},
   {offset:.23,transform:"rotate(0deg) scale(.96)",opacity:1,easing:enterEase},
   {offset:.31,transform:"rotate(0deg) scale(1)",opacity:1,easing:"linear"},
   {offset:.66,transform:"rotate(0deg) scale(1)",opacity:1,easing:exitEase},
   {offset:.9,transform:"rotate(55deg) scale(.82)",opacity:0,easing:"linear"},
   {offset:1,transform:"rotate(55deg) scale(.82)",opacity:0}
  ],{
   duration,
   delay:bars.length*stagger+40,
   iterations:Infinity,
   fill:"both"
  });
  animations.push(animation);
 }
 const media=matchMedia("(prefers-reduced-motion: reduce)");
 const stop=event=>{
  if(!event.matches)return;
  for(const animation of animations)animation.cancel();
  media.removeEventListener("change",stop);
 };
 media.addEventListener("change",stop);
}

export function createConnectionGlyph(connection,{size=18,className="plants-connection-glyph",alertFill="#FF4245",mutedOpacity=.3,animate=false}={}){
 const svg=svgIcon(className,size);
 for(const [tone,d] of CONNECTION_PATHS[connection]){
  const path=document.createElementNS(ICON_NS,"path");
  path.setAttribute("d",d);
  path.setAttribute("fill",tone==="alert"?alertFill:"currentColor");
  if(tone==="muted")path.setAttribute("fill-opacity",String(mutedOpacity));
  svg.append(path);
 }
 if(animate){
  svg.dataset.connectionMotion=connection;
  requestAnimationFrame(()=>animateConnectionGlyph(svg,connection));
 }
 return svg;
}
