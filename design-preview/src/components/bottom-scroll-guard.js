import {motionDuration,motionEasingFunction,reducedMotion} from "../foundations/motion.js";

/**
 * Keeps a bottom-anchored scroll viewport visually stable when its content
 * becomes shorter. The caller's viewport remains the scroll owner; this guard
 * only provides one temporary spacer and a cancellable follow animation.
 */
export function createBottomScrollGuard({viewport,content}={}){
 if(!viewport||!content)throw new Error("createBottomScrollGuard requires viewport and content");
 let spacer=null;
 let run=null;
 let frame=0;
 let destroyed=false;
 let anchored=false;
 let held=null;
 let stableTop=0;
 let naturalHeight=0;
 let watchUntil=0;

 const maxScroll=()=>Math.max(0,viewport.scrollHeight-viewport.clientHeight);
 const spacerHeight=()=>spacer?.getBoundingClientRect().height||0;
 const currentNaturalHeight=()=>Math.max(0,viewport.scrollHeight-spacerHeight());
 const atBottom=()=>maxScroll()-viewport.scrollTop<=2;

 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;}
 function cancel({keepPosition=false}={}){
  stop();
  if(run)run.cancelled=true;
  run=null;
  held=null;
  spacer?.remove();
  spacer=null;
  anchored=false;
  naturalHeight=currentNaturalHeight();
  stableTop=viewport.scrollTop;
  if(keepPosition)viewport.scrollTop=maxScroll();
 }

 function animateShrink(delta,startTop=stableTop){
  if(delta<.5||reducedMotion())return;
  if(!spacer){
   spacer=document.createElement("div");
   spacer.className="wd-scroll-shrink-spacer";
   spacer.setAttribute("aria-hidden","true");
   viewport.append(spacer);
  }
  const from=spacer.getBoundingClientRect().height;
  const next=from+delta;
  const animationStart=run?.currentTop??startTop;
  if(run)run.cancelled=true;
  spacer.style.height=`${next}px`;
  const targetTop=Math.max(0,viewport.scrollHeight-viewport.clientHeight-next);
  const started=performance.now();
  const duration=motionDuration("--wd-motion-content-grow");
  const ease=motionEasingFunction("--wd-ease-content-settle");
  const nextRun={cancelled:false,currentTop:animationStart};
  run=nextRun;
  viewport.scrollTop=animationStart;
  if(frame)cancelAnimationFrame(frame);
  const tick=now=>{
   if(destroyed||nextRun.cancelled)return;
   const progress=Math.min(1,(now-started)/Math.max(1,duration));
   nextRun.currentTop=animationStart+(targetTop-animationStart)*ease(progress);
   viewport.scrollTop=nextRun.currentTop;
   if(progress<1){
    frame=requestAnimationFrame(tick);
    return;
   }
   frame=0;
   spacer?.remove();
   spacer=null;
   run=null;
   viewport.scrollTop=maxScroll();
   naturalHeight=currentNaturalHeight();
   stableTop=viewport.scrollTop;
   anchored=true;
   ensureWatching(900);
  };
  frame=requestAnimationFrame(tick);
 }

 function holdBottom(){
  if(destroyed||run||held||!atBottom())return null;
  stop();
  naturalHeight=currentNaturalHeight();
  const oldMax=Math.max(0,naturalHeight-viewport.clientHeight);
  if(oldMax<=0)return null;
  stableTop=viewport.scrollTop;
  spacer=document.createElement("div");
  spacer.className="wd-scroll-shrink-spacer";
  spacer.setAttribute("aria-hidden","true");
  spacer.style.height=`${oldMax+2}px`;
  viewport.append(spacer);
  held={startTop:stableTop,oldNaturalHeight:naturalHeight,oldMax};
  anchored=true;
  return held;
 }

 function settleBottom(hold=held){
  if(destroyed||!hold||hold!==held)return;
  held=null;
  stop();
  const nextNaturalHeight=currentNaturalHeight();
  const nextMax=Math.max(0,nextNaturalHeight-viewport.clientHeight);
  const grew=nextNaturalHeight>=hold.oldNaturalHeight-.5;
  if(grew){
   spacer?.remove();
   spacer=null;
   viewport.scrollTop=hold.startTop;
   naturalHeight=nextNaturalHeight;
   stableTop=viewport.scrollTop;
   anchored=false;
   return;
  }
  const delta=hold.oldMax-nextMax;
  if(delta<.5||reducedMotion()){
   spacer?.remove();
   spacer=null;
   viewport.scrollTop=nextMax;
   naturalHeight=nextNaturalHeight;
   stableTop=viewport.scrollTop;
   anchored=true;
   return;
  }
  spacer.style.height=`${delta}px`;
  viewport.scrollTop=hold.startTop;
  const started=performance.now();
  const duration=motionDuration("--wd-motion-content-grow");
  const ease=motionEasingFunction("--wd-ease-content-settle");
  const nextRun={cancelled:false,currentTop:hold.startTop};
  run=nextRun;
  const tick=now=>{
   if(destroyed||nextRun.cancelled)return;
   const progress=Math.min(1,(now-started)/Math.max(1,duration));
   nextRun.currentTop=hold.startTop+(nextMax-hold.startTop)*ease(progress);
   spacer.style.height=`${delta*(1-progress)}px`;
   viewport.scrollTop=nextRun.currentTop;
   if(progress<1){
    frame=requestAnimationFrame(tick);
    return;
   }
   frame=0;
   spacer?.remove();
   spacer=null;
   run=null;
   viewport.scrollTop=nextMax;
   naturalHeight=currentNaturalHeight();
   stableTop=viewport.scrollTop;
   anchored=true;
   ensureWatching(900);
  };
  frame=requestAnimationFrame(tick);
 }

 function watch(now=performance.now()){
  frame=0;
  if(destroyed||held)return;
  const current=currentNaturalHeight();
  if(current<naturalHeight-.5){
   animateShrink(naturalHeight-current);
   naturalHeight=current;
  }else{
   naturalHeight=current;
  }
  anchored=atBottom();
  if(run||(anchored&&now<watchUntil)){
   stableTop=run?.currentTop??viewport.scrollTop;
   frame=requestAnimationFrame(watch);
  }
 }
 function ensureWatching(duration=900){
  if(destroyed||frame||(!anchored&&!run))return;
  watchUntil=Math.max(watchUntil,performance.now()+duration);
  frame=requestAnimationFrame(watch);
 }
 function sync({duration=900}={}){
  if(destroyed||run||held)return;
  const nextAnchored=atBottom();
  if(!nextAnchored){
   anchored=false;
   naturalHeight=currentNaturalHeight();
   stableTop=viewport.scrollTop;
   stop();
   return;
  }
  if(!anchored||!frame)naturalHeight=currentNaturalHeight();
  anchored=true;
  stableTop=viewport.scrollTop;
  ensureWatching(duration);
 }

 const onWheel=()=>{if(run)cancel();anchored=false;stop();};
 const onTouchStart=()=>{if(run)cancel();anchored=false;stop();};
 const onInputIntent=()=>{if(atBottom()){anchored=true;ensureWatching(1100);}};
 viewport.addEventListener("scroll",sync,{passive:true});
 viewport.addEventListener("wheel",onWheel,{passive:true});
 viewport.addEventListener("touchstart",onTouchStart,{passive:true});
 viewport.addEventListener("pointerdown",onInputIntent,{passive:true});
 viewport.addEventListener("keydown",onInputIntent);
 sync();

 return {
  sync,
  cancel,
  holdBottom,
  settleBottom,
  get active(){return Boolean(run);},
  destroy(){
   if(destroyed)return;
   destroyed=true;
   cancel();
   viewport.removeEventListener("scroll",sync);
   viewport.removeEventListener("wheel",onWheel);
   viewport.removeEventListener("touchstart",onTouchStart);
   viewport.removeEventListener("pointerdown",onInputIntent);
   viewport.removeEventListener("keydown",onInputIntent);
  }
 };
}
