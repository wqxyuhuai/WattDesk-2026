// Reuse exported SVG geometry; remove baked-in label alpha only in state masks.
// CSS filters run before masking, so filtering the host cannot make a .7 mask opaque.
export async function prepareControlStates(root){
 // aria-disabled is semantic only; prevent both pointer and keyboard activation.
 for(const event of ["click","keydown"])root.addEventListener(event,e=>{
  if(event==="keydown"&&!['Enter',' '].includes(e.key))return;
  if(e.target.closest?.('.wd-control-state[aria-disabled="true"]')){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 // Adapters register existing markup with the same reusable control state.
 for(const control of root.querySelectorAll('.wd-control-state,.target-nav,.target-tab,.target-icon-button,.target-quick-search,.target-section-heading,.target-header-action,.target-add-tab,.wd-glass[role="button"]')){
  if(control.classList.contains("status-card"))continue;
  control.classList.add("wd-control-state");
  for(const label of control.querySelectorAll('.node.text'))label.classList.add("wd-control-label");
  for(const label of control.children){
   if(label.tagName==="SPAN"&&!label.className.includes("icon")&&!label.classList.contains("wd-glass-material")&&!label.classList.contains("target-shortcut"))label.classList.add("wd-control-label");
  }
 }
 const masks=new Map();
 function opaqueMask(source){
  if(!masks.has(source))masks.set(source,fetch(source).then(async response=>{
   if(!response.ok)throw new Error(`Icon mask unavailable: ${source}`);
   const svg=new DOMParser().parseFromString(await response.text(),"image/svg+xml");
   for(const node of svg.querySelectorAll("*")){
    for(const attribute of ["opacity","fill-opacity","stroke-opacity"]){
     if(node.hasAttribute(attribute)&&Number(node.getAttribute(attribute))>0)node.setAttribute(attribute,"1");
     if(node.style?.getPropertyValue(attribute)&&parseFloat(node.style.getPropertyValue(attribute))>0)node.style.setProperty(attribute,"1");
    }
   }
   return `url("data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg.documentElement))}")`;
  }));
  return masks.get(source);
 }
 const work=[];
 for(const icon of root.querySelectorAll('[style*="--icon-mask"]')){
  const source=icon.style.getPropertyValue("--icon-mask").match(/url\(["']?([^"')]+)["']?\)/)?.[1];
  if(source){
   icon.style.setProperty("--icon-source",`url("${source}")`);
   work.push(opaqueMask(source).then(mask=>icon.style.setProperty("--icon-mask",mask)));
  }
 }
 for(const icon of root.querySelectorAll(".target-account-arrow")){
  work.push(opaqueMask(icon.querySelector("img").getAttribute("src")).then(mask=>icon.style.setProperty("--icon-mask",mask)));
 }
 for(const icon of root.querySelectorAll(".wd-glass .asset-mono")){
  const image=icon.querySelector("img");if(!image)continue;
  const state=document.createElement("span");state.className="shared-icon-highlight";state.setAttribute("aria-hidden","true");
  for(const property of ["left","top","width","height"])state.style[property]=image.style[property];
  icon.classList.add("shared-icon-state");icon.append(state);
  work.push(opaqueMask(image.getAttribute("src")).then(mask=>state.style.setProperty("--icon-mask",mask)));
 }
 await Promise.all(work);
}
