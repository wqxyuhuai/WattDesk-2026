export function reducedMotion(){return matchMedia("(prefers-reduced-motion: reduce)").matches}
export function motionDuration(token){const value=getComputedStyle(document.documentElement).getPropertyValue(token).trim();return parseFloat(value)*(value.endsWith('ms')?1:1000)}
export function motionEasing(token){return getComputedStyle(document.documentElement).getPropertyValue(token).trim()}
const contentGrowthAnimations=new WeakMap();
export function animateContentHeight(element,height,{from=element.getBoundingClientRect().height,animate=true}={}){
 const next=Math.max(0,Number(height)||0),previous=Math.max(0,Number(from)||0);
 contentGrowthAnimations.get(element)?.cancel();
 contentGrowthAnimations.delete(element);
 element.style.height=`${next}px`;
 if(!animate||reducedMotion()||Math.abs(next-previous)<.5)return null;
 const animation=element.animate(
  [{height:`${previous}px`},{height:`${next}px`}],
  {duration:motionDuration("--wd-motion-content-grow"),easing:motionEasing("--wd-ease-content-grow")}
 );
 contentGrowthAnimations.set(element,animation);
 animation.finished.catch(()=>{}).finally(()=>{
  if(contentGrowthAnimations.get(element)===animation)contentGrowthAnimations.delete(element);
 });
 return animation;
}
// Shared, finite motion. Hover never moves a surface; data remains immediately readable.
export function createHomeMotion({duration,easing,reducedMotion}){
 const panels=new WeakMap(),reveals=new Map();
 function openPanel(panel,anchor){
  const a=anchor.getBoundingClientRect(),p=panel.getBoundingClientRect();
  panel.style.transformOrigin=`${Math.max(16,Math.min(p.width-16,a.x+a.width/2-p.x))}px ${a.y>p.bottom?'100%':'0%'}`;
  if(!reducedMotion()){
   // A translucent glass panel must not fade its own opacity: while opacity is
   // below 1 the browser composites the blurred backdrop with the crisp page,
   // which reads as an unblurred intermediate frame. Keep the material solid
   // and let only the silhouette settle.
   const surface=panel.classList.contains("wd-glass--surface");
   // A full-size glass surface settles only its silhouette. Fading the material
   // shows the page beneath between composited blur steps, so the content layer
   // carries the fade while the tint stays opaque until removal.
   const frames=surface?[{transform:"scale(.988)"},{transform:"scale(1)"}]:[{opacity:0,transform:"scale(.975)"},{opacity:1,transform:"scale(1)"}];
   if(surface)panel._wdFade?.animate([{opacity:0},{opacity:1}],{duration:duration('--wd-motion-panel'),easing:easing('--wd-ease-panel')});
   const animation=panel.animate(frames,{duration:duration('--wd-motion-panel'),easing:easing('--wd-ease-panel')});
   panels.set(panel,animation);animation.finished.catch(()=>{});
  }
 }
 function finishPanel(panel){
  if(panel.dataset.closed==='true')return;
  panel.dataset.closed='true';
  try{panel._onClose?.();}finally{panel.remove();}
 }
 function closePanel(panel,immediate=false){
  if(immediate){panels.get(panel)?.cancel();finishPanel(panel);return;}
  if(panel.dataset.closing)return;
  panels.get(panel)?.cancel();panel.inert=true;panel.dataset.closing='true';
  if(immediate||reducedMotion()){finishPanel(panel);return;}
  const surface=panel.classList.contains('wd-glass--surface'),exit=duration('--wd-motion-panel-exit'),ease=easing('--wd-ease-hover-out');
  if(!surface){
   const animation=panel.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],{duration:exit,easing:ease,fill:'forwards'});
   panels.set(panel,animation);animation.finished.then(()=>finishPanel(panel)).catch(()=>finishPanel(panel));
   return;
  }
  // A host that drops its own opacity stops compositing backdrop-filter: the
  // crisp page shows through the translucent pane, which is the unblurred
  // intermediate frame. Blur is never animated. Content and the glass plate now
  // finish together: fading the copy faster than the plate left an empty shell
  // visible for the last frames of the exit.
  const fill=panel.querySelector(':scope>.wd-glass-material>.wd-glass-fill');
  const optics=panel.querySelector(':scope>.wd-glass-material>.wd-glass-optics');
  if(panel._wdFade)panel._wdFade.animate([{opacity:1},{opacity:0}],{duration:exit*.94,easing:ease,fill:'forwards'});
  if(fill)fill.animate([{opacity:1},{opacity:0}],{duration:exit*.94,easing:ease,fill:'forwards'});
  if(optics)optics.animate([{opacity:1},{opacity:0}],{duration:exit*.94,easing:ease,fill:'forwards'});
  // Nested glass controls dissolve with the content instead of settling on
  // their own; a child that unblurs separately would punch small sharp patches
  // into the pane while it is still visible.
  for(const inner of panel.querySelectorAll('.wd-date-picker-content .wd-glass-material')){
   inner.animate([{opacity:1},{opacity:0}],{duration:exit*.7,easing:ease,fill:'forwards'});
  }
  const settle=panel.animate([{transform:'scale(1)'},{transform:'scale(.99)'}],{duration:exit,easing:ease,fill:'forwards'});
  panels.set(panel,settle);
  setTimeout(()=>finishPanel(panel),Math.max(0,exit-16));
 }
 function observeCharts(cards,root){
  function reveal(card){
   card.dataset.chartRevealed='true';
   const marks=[...card.querySelectorAll('.chart-mark')],observations=[...card.querySelectorAll('.chart-observation')];
   if(reducedMotion()){[...marks,...observations].forEach(el=>el.classList.remove('chart-pending'));return;}
   const animations=[];
   marks.forEach((el,i)=>{
    el.classList.remove('chart-pending');
    const bar=el.classList.contains('chart-bar');
    const frames=bar?[{transform:'scaleY(.04)',opacity:.1},{transform:'scaleY(1)',opacity:1}]:[{clipPath:'inset(-3px 100% -3px -3px)'},{clipPath:'inset(-3px -3px -3px -3px)'}];
    const animation=el.animate(frames,{duration:duration('--wd-motion-chart'),delay:bar?i*duration('--wd-motion-stagger'):0,easing:easing('--wd-ease-chart'),fill:'backwards'});
    animations.push(animation);animation.finished.catch(()=>{});
   });
   observations.forEach(el=>{
    el.classList.remove('chart-pending');
    const animation=el.animate([{opacity:0},{opacity:1}],{duration:duration('--wd-motion-hover'),delay:duration('--wd-motion-chart')*.65,easing:easing('--wd-ease-hover'),fill:'backwards'});
    animations.push(animation);animation.finished.catch(()=>{});
   });
   reveals.set(card,animations);
  }
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);reveal(entry.target);}},{root,threshold:.12});
  for(const card of cards){
   if(!reducedMotion())card.querySelectorAll('.chart-mark,.chart-observation').forEach(el=>el.classList.add('chart-pending'));
   observer.observe(card);
  }
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{
   if(!event.matches)return;
   observer.disconnect();for(const card of cards){reveals.get(card)?.forEach(a=>a.cancel());card.querySelectorAll('.chart-pending').forEach(el=>el.classList.remove('chart-pending'));card.dataset.chartRevealed='true';}
  });
 }
 return {openPanel,closePanel,observeCharts};
}
