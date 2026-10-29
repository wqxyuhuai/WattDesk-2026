import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";

const MIN_THUMB_HEIGHT=24;
const PULL_SHRINK_RATIO=2;

function element(className){
 const node=document.createElement("div");
 node.className=className;
 return node;
}

function readInset(value,context){
 const resolved=typeof value==="function"?value(context):value;
 return Math.max(0,Number(resolved)||0);
}

/**
 * Adds the shared visual scroll rail and optional elastic edge feedback to an
 * existing scroll viewport. The caller owns layout and business content; this
 * component owns only pointer state, thumb geometry and pull transforms.
 */
export function createScrollFeedback({
 host,
 viewport,
 content=null,
 elastic=true,
 topInset=0,
 bottomInset=0,
 maxPull=20,
 deadZone=4,
 releaseDelay=180
}={}){
 if(!host||!viewport||(elastic&&!content)){
  throw new Error("createScrollFeedback requires host and viewport; elastic mode also requires content");
 }

 const track=element("wd-scroll-feedback");
 const thumb=element("wd-scroll-feedback__thumb");
 const pullEnabled=Boolean(elastic&&content);
 const startSurface=pullEnabled?element("wd-scroll-feedback__pull wd-scroll-feedback__pull--start"):null;
 const endSurface=pullEnabled?element("wd-scroll-feedback__pull wd-scroll-feedback__pull--end"):null;
 track.setAttribute("aria-hidden","true");
 startSurface?.setAttribute("aria-hidden","true");
 endSurface?.setAttribute("aria-hidden","true");
 track.append(thumb);
 host.classList.add("wd-scroll-feedback-host");
 content?.classList.add("wd-scroll-feedback-content");
 if(startSurface)startSurface.style.top=`${viewport.offsetTop}px`;
 if(pullEnabled)host.append(startSurface,endSurface);
 host.append(track);

 let frame=0,pullFrame=0,pullDistance=0,pullTarget=0,pullReleaseTimer=0;
 let pullSide=null,touchStartY=null,settling=false,baseMetrics=null;
 let pullAnimations=[];
 let scrollDrag=null;

 function metrics(){
  // Menus may sit inside a scaling panel while opening. The rail is positioned
  // in the host's layout coordinate space, so use the untransformed height.
  const hostHeight=host.clientHeight;
  const viewportHeight=viewport.clientHeight;
  const contentHeight=viewport.scrollHeight;
  const top=Math.min(hostHeight,readInset(topInset,{host,viewport,content}));
  const bottom=Math.min(hostHeight-top,readInset(bottomInset,{host,viewport,content}));
  const trackHeight=Math.max(0,hostHeight-top-bottom);
  const visible=!viewport.hidden&&trackHeight>=MIN_THUMB_HEIGHT&&contentHeight>viewportHeight+1;
  const thumbHeight=visible?Math.max(MIN_THUMB_HEIGHT,Math.round(trackHeight*viewportHeight/contentHeight)):0;
  const maxTop=Math.max(0,trackHeight-thumbHeight);
  const maxScroll=Math.max(1,contentHeight-viewportHeight);
  const thumbTop=visible?Math.max(0,Math.min(maxTop,viewport.scrollTop/maxScroll*maxTop)):0;
  return {top,bottom,trackHeight,visible,thumbHeight,thumbTop};
 }

 function thumbPose(base=baseMetrics,side=pullSide,distance=pullDistance){
  if(!base?.visible)return {height:0,top:0};
  const activeDistance=side?Math.max(0,distance-deadZone):0;
  const shrink=Math.min(base.thumbHeight-MIN_THUMB_HEIGHT,Math.round(activeDistance*PULL_SHRINK_RATIO));
  const height=base.thumbHeight-shrink;
  const top=base.thumbTop+(side==="end"?base.thumbHeight-height:0);
  return {height,top};
 }

 function applyThumb(base=baseMetrics,side=pullSide,distance=pullDistance){
  if(!base)return;
  const pose=thumbPose(base,side,distance);
  thumb.style.height=`${pose.height}px`;
  thumb.style.transform=`translate3d(0,${pose.top}px,0)`;
 }

 function sync(){
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   if(startSurface)startSurface.style.top=`${viewport.offsetTop}px`;
   baseMetrics=metrics();
   track.hidden=!baseMetrics.visible;
   track.style.top=`${baseMetrics.top}px`;
   track.style.height=`${baseMetrics.trackHeight}px`;
   if(settling)return;
   applyThumb();
  });
 }

 function setSurface(surface,side,distance){
  const active=distance>0&&pullSide===side;
  surface.style.height=`${active?distance:0}px`;
  surface.style.opacity=String(active?Math.min(1,distance/8):0);
 }

 function renderPullVisual(){
  if(!pullEnabled)return;
  const distance=Math.max(0,pullDistance-deadZone);
  const active=distance>0&&pullSide;
  content.classList.toggle("is-pulling",Boolean(active));
  content.style.transform=active?`translate3d(0,${pullSide==="end"?-distance:distance}px,0)`:"";
  setSurface(startSurface,"start",distance);
  setSurface(endSurface,"end",distance);
  applyThumb(baseMetrics,pullSide,pullDistance);
 }

 function advancePull(){
  pullFrame=0;
  const delta=pullTarget-pullDistance;
  if(Math.abs(delta)<.08){
   pullDistance=pullTarget;
   renderPullVisual();
   return;
  }
  pullDistance+=delta*.16;
  renderPullVisual();
  pullFrame=requestAnimationFrame(advancePull);
 }

 function requestPullFrame(){
  if(!pullFrame)pullFrame=requestAnimationFrame(advancePull);
 }

 function cancelPullAnimations(){
  for(const animation of pullAnimations)animation.cancel();
  pullAnimations=[];
  settling=false;
 }

 function settlePull(){
  if(!pullEnabled)return;
  clearTimeout(pullReleaseTimer);
  cancelAnimationFrame(pullFrame);
  pullFrame=0;
  pullTarget=0;
  const settledSide=pullSide;
  const start=Math.max(0,pullDistance-deadZone);
  const fromPose=thumbPose(baseMetrics,settledSide,pullDistance);
  cancelPullAnimations();
  pullDistance=0;
  if(start<=0||reducedMotion()){
   pullSide=null;
   renderPullVisual();
   sync();
   return;
  }

  pullSide=null;
  settling=true;
  const nextMetrics=metrics();
  const toPose=thumbPose(nextMetrics,null,0);
  const timing={
   duration:motionDuration("--wd-motion-pull-rebound"),
   easing:motionEasing("--wd-ease-spring")
  };
  const contentAnimation=content.animate([
   {transform:`translate3d(0,${settledSide==="end"?-start:start}px,0)`},
   {transform:"translate3d(0,0,0)"}
  ],timing);
  const surface=settledSide==="end"?endSurface:startSurface;
  const surfaceAnimation=surface.animate([
   {height:`${start}px`,opacity:String(Math.min(1,start/10))},
   {height:"0px",opacity:"0"}
  ],timing);
  const thumbAnimation=nextMetrics.visible&&fromPose.height
   ?thumb.animate([
    {height:`${fromPose.height}px`,transform:`translate3d(0,${fromPose.top}px,0)`},
    {height:`${toPose.height}px`,transform:`translate3d(0,${toPose.top}px,0)`}
   ],timing)
   :null;
  pullAnimations=[contentAnimation,surfaceAnimation,thumbAnimation].filter(Boolean);
  Promise.allSettled(pullAnimations.map(animation=>animation.finished)).then(()=>{
   if(pullDistance>0)return;
   content.style.transform="";
   startSurface.style.height="0px";
   startSurface.style.opacity="0";
   endSurface.style.height="0px";
   endSurface.style.opacity="0";
   content.classList.remove("is-pulling");
   settling=false;
   pullAnimations=[];
   baseMetrics=nextMetrics;
   applyThumb(nextMetrics,null,0);
  });
 }

 function pullBy(delta){
  if(reducedMotion())return;
  clearTimeout(pullReleaseTimer);
  cancelPullAnimations();
  const resistance=1-pullTarget/(maxPull*1.6);
  pullTarget=Math.max(0,Math.min(maxPull,pullTarget+delta*resistance));
  requestPullFrame();
  pullReleaseTimer=setTimeout(settlePull,releaseDelay);
 }

 function handleWheel(event){
  if(!pullEnabled)return;
  if(event.ctrlKey||event.metaKey)return;
  const maxScroll=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  const atStart=viewport.scrollTop<=0;
  const atEnd=maxScroll>0&&viewport.scrollTop>=maxScroll-1;
  const active=pullSide&&(pullTarget>0||pullDistance>0);
  if(active){
   if((pullSide==="start"&&!atStart)||(pullSide==="end"&&!atEnd)){
    settlePull();
    return;
   }
   event.preventDefault();
   const outward=(pullSide==="start"&&event.deltaY<0)||(pullSide==="end"&&event.deltaY>0);
   pullBy(outward?Math.abs(event.deltaY)*.035:-Math.abs(event.deltaY)*.035);
   return;
  }
  if(atStart&&event.deltaY<0){
   pullSide="start";
   event.preventDefault();
   pullBy(-event.deltaY*.035);
  }else if(atEnd&&event.deltaY>0){
   pullSide="end";
   event.preventDefault();
   pullBy(event.deltaY*.035);
  }else if(pullTarget>0||pullDistance>0){
   event.preventDefault();
   pullBy(-Math.abs(event.deltaY)*.035);
  }
 }

 function handleScroll(){
  sync();
  if(!pullSide)return;
  const maxScroll=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  const movedAway=(pullSide==="start"&&viewport.scrollTop>0)||(pullSide==="end"&&viewport.scrollTop<maxScroll-1);
  if(movedAway)settlePull();
 }

 function handleTouchStart(event){
  touchStartY=event.touches.length===1?event.touches[0].clientY:null;
 }

 function handleTouchMove(event){
  if(!pullEnabled)return;
  if(touchStartY===null||event.touches.length!==1)return;
  const distance=event.touches[0].clientY-touchStartY;
  const maxScroll=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  if(!pullSide){
   if(viewport.scrollTop<=0&&distance>0)pullSide="start";
   else if(maxScroll>0&&viewport.scrollTop>=maxScroll-1&&distance<0)pullSide="end";
   else return;
  }
  event.preventDefault();
  clearTimeout(pullReleaseTimer);
  cancelPullAnimations();
  pullTarget=Math.min(maxPull,Math.max(0,Math.abs(distance)*.25));
  requestPullFrame();
 }

 function handleTouchEnd(){
  touchStartY=null;
  settlePull();
}

 function endScrollDrag(event){
  if(!scrollDrag||event.pointerId!==scrollDrag.pointerId)return;
  thumb.releasePointerCapture?.(event.pointerId);
  track.classList.remove("is-dragging");
  scrollDrag=null;
 }

 thumb.addEventListener("pointerdown",event=>{
  if(event.button!==0)return;
  event.preventDefault();
  scrollDrag={
   pointerId:event.pointerId,
   startY:event.clientY,
   startScroll:viewport.scrollTop,
   thumbHeight:thumb.getBoundingClientRect().height
  };
  track.classList.add("is-dragging");
  thumb.setPointerCapture?.(event.pointerId);
 });
 thumb.addEventListener("pointermove",event=>{
  if(!scrollDrag||event.pointerId!==scrollDrag.pointerId)return;
  const trackHeight=track.clientHeight;
  const maxTop=Math.max(1,trackHeight-scrollDrag.thumbHeight);
  const maxScroll=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  viewport.scrollTop=scrollDrag.startScroll+(event.clientY-scrollDrag.startY)/maxTop*maxScroll;
 });
 thumb.addEventListener("pointerup",endScrollDrag);
 thumb.addEventListener("pointercancel",endScrollDrag);
 track.addEventListener("pointerdown",event=>{
  if(event.target===thumb||event.button!==0)return;
  const rect=track.getBoundingClientRect();
  const thumbHeight=thumb.getBoundingClientRect().height;
  const maxTop=Math.max(1,rect.height-thumbHeight);
  const maxScroll=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  viewport.scrollTop=Math.max(0,Math.min(1,(event.clientY-rect.top-thumbHeight/2)/maxTop))*maxScroll;
 });
 track.addEventListener("wheel",event=>{
  if(pullEnabled){
   handleWheel(event);
   return;
  }
  event.preventDefault();
  viewport.scrollTop+=event.deltaY;
 },{passive:false});
 if(pullEnabled)viewport.addEventListener("wheel",handleWheel,{passive:false});
 viewport.addEventListener("scroll",handleScroll,{passive:true});
 if(pullEnabled){
  viewport.addEventListener("touchstart",handleTouchStart,{passive:true});
  viewport.addEventListener("touchmove",handleTouchMove,{passive:false});
  viewport.addEventListener("touchend",handleTouchEnd,{passive:true});
  viewport.addEventListener("touchcancel",handleTouchEnd,{passive:true});
 }

 const resizeObserver=new ResizeObserver(sync);
 resizeObserver.observe(host);
 resizeObserver.observe(viewport);
 sync();

 return {
  element:track,
  sync,
  destroy(){
   cancelAnimationFrame(frame);
   cancelAnimationFrame(pullFrame);
   clearTimeout(pullReleaseTimer);
   cancelPullAnimations();
   resizeObserver.disconnect();
   viewport.removeEventListener("scroll",handleScroll);
   if(pullEnabled){
    viewport.removeEventListener("wheel",handleWheel);
    viewport.removeEventListener("touchstart",handleTouchStart);
    viewport.removeEventListener("touchmove",handleTouchMove);
    viewport.removeEventListener("touchend",handleTouchEnd);
    viewport.removeEventListener("touchcancel",handleTouchEnd);
   }
   // The lightweight wheel handler on the visual track is removed with the node.
   if(content){
    content.style.transform="";
    content.classList.remove("wd-scroll-feedback-content","is-pulling");
   }
   host.classList.remove("wd-scroll-feedback-host");
   track.remove();
   startSurface?.remove();
   endSurface?.remove();
  }
 };
}
