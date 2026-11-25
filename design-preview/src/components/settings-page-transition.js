import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";

/**
 * Shared Inverter settings page transition. The old and new page crossfade with
 * the same fixed title layer; callers may append their own animations before
 * calling finish().
 */
export function animateSettingsPageTransition({
 page,
 outgoingPage,
 titleLayer,
 incomingTitle,
 outgoingTitle,
 titleLeft=null
}={}){
 if(!page||!outgoingPage)return null;
 if(reducedMotion()){
  outgoingPage.remove();
  outgoingTitle?.remove();
  page.style.removeProperty("opacity");
  page.style.removeProperty("will-change");
  return null;
 }
 const outgoingOpacity=Number.parseFloat(getComputedStyle(outgoingPage).opacity);
 const outgoingTitleOpacity=Number.parseFloat(outgoingTitle?.style.opacity);
 const oldOptions={
  duration:motionDuration("--wd-motion-view-switch-out"),
  easing:motionEasing("--wd-ease-view-switch-out"),
  fill:"both"
 };
 const newOptions={
  duration:motionDuration("--wd-motion-view-switch-in"),
  delay:motionDuration("--wd-motion-view-switch-delay"),
  easing:motionEasing("--wd-ease-view-switch"),
  fill:"both"
 };
 outgoingPage.style.willChange="opacity";
 page.style.willChange="opacity";
 const animations=[
  outgoingPage.animate(
   [{opacity:Number.isFinite(outgoingOpacity)?outgoingOpacity:1},{opacity:0}],
   oldOptions
  ),
  page.animate([{opacity:0},{opacity:1}],newOptions)
 ];
 let ghost=null;
 if(outgoingTitle){
  ghost=outgoingTitle;
  ghost.classList.remove("isw-title-label--entering");
  ghost.classList.add("isw-title-label--ghost");
  ghost.setAttribute("aria-hidden","true");
  (titleLayer?.querySelector(".isw-page-title")||incomingTitle)?.append(ghost);
  if(Number.isFinite(titleLeft)&&incomingTitle){
   const incomingLeft=incomingTitle.getBoundingClientRect().left;
   if(Number.isFinite(incomingLeft))ghost.style.translate=`${titleLeft-incomingLeft}px 0`;
  }
  ghost.style.opacity=String(Number.isFinite(outgoingTitleOpacity)?outgoingTitleOpacity:1);
  ghost.style.willChange="opacity";
  if(incomingTitle){
   incomingTitle.style.opacity="0";
   incomingTitle.style.willChange="opacity";
  }
  animations.push(ghost.animate(
   [{opacity:Number.isFinite(outgoingTitleOpacity)?outgoingTitleOpacity:1},{opacity:0}],
   oldOptions
  ));
  if(incomingTitle)animations.push(incomingTitle.animate([{opacity:0},{opacity:1}],newOptions));
 }
 return {
  animations,
  oldOptions,
  newOptions,
  outgoingTitle:ghost,
  finish(){
   outgoingPage.remove();
   ghost?.remove();
   for(const animation of animations){
    try{animation.cancel();}catch{}
   }
   page.style.removeProperty("opacity");
   page.style.removeProperty("will-change");
   incomingTitle?.style.removeProperty("opacity");
   incomingTitle?.style.removeProperty("will-change");
  }
 };
}
