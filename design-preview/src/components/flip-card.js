// Framework-free interaction adaptation of React Bits FlipCard.
//
// Service Ticket keeps click as "open ticket", so the visual language is
// preserved without replacing that action with flip-on-click: pointer tilt,
// hover lift, cursor glare, drag resistance and a spring return.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function mountFlipCardInteraction(host,{
  tiltMax=12,
  glareOpacity=.22,
  hoverScale=1.03,
  perspective=1100,
  stiffness=170,
  damping=20
}={}){
  if(!host)throw Error("FlipCard interaction requires a host element");

  host.classList.add("service-flip-card");
  host.style.setProperty("--service-card-perspective",`${perspective}px`);
  host.style.setProperty("--service-card-hover-scale",String(hoverScale));
  host.style.setProperty("--service-card-glare-opacity",String(glareOpacity));
  const glare=document.createElement("span");
  glare.className="service-card-glare";
  glare.setAttribute("aria-hidden","true");
  host.append(glare);

  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer=matchMedia("(hover: hover) and (pointer: fine)");
  const state={
    frame:0,
    last:0,
    hover:false,
    dragging:false,
    suppressClick:false,
    drag:null,
    baseX:0,
    baseY:0,
    targetX:0,
    targetY:0,
    currentX:0,
    currentY:0,
    velocityX:0,
    velocityY:0,
    targetScale:1,
    currentScale:1,
    velocityScale:0,
    targetGlare:0,
    currentGlare:0,
    velocityGlare:0,
    pointerX:50,
    pointerY:50
  };

  function setVisualState(){
    host.style.setProperty("--service-card-tilt-x",`${state.currentX.toFixed(3)}deg`);
    host.style.setProperty("--service-card-tilt-y",`${state.currentY.toFixed(3)}deg`);
    host.style.setProperty("--service-card-scale",state.currentScale.toFixed(4));
    host.style.setProperty("--service-card-glare-strength",state.currentGlare.toFixed(4));
    host.style.setProperty("--service-card-glare-x",`${state.pointerX.toFixed(2)}%`);
    host.style.setProperty("--service-card-glare-y",`${state.pointerY.toFixed(2)}%`);
  }

  function spring(current,velocity,target,dt){
    const nextVelocity=(velocity+(target-current)*stiffness*dt)*Math.exp(-damping*dt);
    return [current+nextVelocity*dt,nextVelocity];
  }

  function settleIfIdle(){
    const done=
      Math.abs(state.currentX-state.targetX)<.01&&
      Math.abs(state.currentY-state.targetY)<.01&&
      Math.abs(state.currentScale-state.targetScale)<.0002&&
      Math.abs(state.currentGlare-state.targetGlare)<.002&&
      Math.abs(state.velocityX)+Math.abs(state.velocityY)+
        Math.abs(state.velocityScale)+Math.abs(state.velocityGlare)<.002;
    if(!done)return;
    state.currentX=state.targetX;
    state.currentY=state.targetY;
    state.currentScale=state.targetScale;
    state.currentGlare=state.targetGlare;
    state.velocityX=state.velocityY=state.velocityScale=state.velocityGlare=0;
    setVisualState();
  }

  function frame(now){
    state.frame=0;
    const dt=state.last?Math.min((now-state.last)/1000,.034):1/60;
    state.last=now;
    [state.currentX,state.velocityX]=spring(state.currentX,state.velocityX,state.targetX,dt);
    [state.currentY,state.velocityY]=spring(state.currentY,state.velocityY,state.targetY,dt);
    [state.currentScale,state.velocityScale]=spring(state.currentScale,state.velocityScale,state.targetScale,dt);
    [state.currentGlare,state.velocityGlare]=spring(state.currentGlare,state.velocityGlare,state.targetGlare,dt);
    setVisualState();
    settleIfIdle();
    if(!state.frame&&!settled())state.frame=requestAnimationFrame(frame);
  }

  function settled(){
    return Math.abs(state.currentX-state.targetX)<.01&&
      Math.abs(state.currentY-state.targetY)<.01&&
      Math.abs(state.currentScale-state.targetScale)<.0002&&
      Math.abs(state.currentGlare-state.targetGlare)<.002;
  }

  function wake(){
    if(!state.frame)state.frame=requestAnimationFrame(frame);
  }

  function localPoint(event){
    const rect=host.getBoundingClientRect();
    return {
      x:clamp((event.clientX-rect.left)/Math.max(1,rect.width),0,1),
      y:clamp((event.clientY-rect.top)/Math.max(1,rect.height),0,1)
    };
  }

  function updatePointerTilt(event){
    const point=localPoint(event);
    state.pointerX=point.x*100;
    state.pointerY=point.y*100;
    state.baseX=(.5-point.y)*2*tiltMax;
    state.baseY=(point.x-.5)*2*tiltMax;
    state.targetX=state.baseX;
    state.targetY=state.baseY;
  }

  const enter=event=>{
    if(event.pointerType==="touch"||reduce.matches||!finePointer.matches)return;
    state.hover=true;
    host.dataset.flipInteraction="active";
    state.targetScale=hoverScale;
    state.targetGlare=1;
    updatePointerTilt(event);
    wake();
  };

  const move=event=>{
    if(event.pointerType==="touch"||reduce.matches||!finePointer.matches)return;
    updatePointerTilt(event);
    const drag=state.drag;
    if(drag&&drag.pointerId===event.pointerId){
      const dx=event.clientX-drag.x;
      const dy=event.clientY-drag.y;
      if(!drag.moved&&Math.max(Math.abs(dx),Math.abs(dy))>=4){
        drag.moved=true;
        state.dragging=true;
        host.dataset.flipDragging="true";
      }
      if(drag.moved){
        const width=Math.max(180,host.getBoundingClientRect().width);
        const height=Math.max(120,host.getBoundingClientRect().height);
        state.targetY=clamp(state.baseY+dx/width*180,-18,18);
        state.targetX=clamp(state.baseX-dy/height*180,-18,18);
      }
    }
    wake();
  };

  const down=event=>{
    if(event.button!==0||reduce.matches||!finePointer.matches)return;
    state.drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    try{host.setPointerCapture(event.pointerId);}catch{}
  };

  const releaseDrag=(event,cancelled=false)=>{
    const drag=state.drag;
    if(!drag||drag.pointerId!==event.pointerId)return;
    state.drag=null;
    state.dragging=false;
    host.removeAttribute("data-flip-dragging");
    if(drag.moved){
      state.suppressClick=true;
      state.targetX=state.hover?state.baseX:0;
      state.targetY=state.hover?state.baseY:0;
    }else if(cancelled){
      state.suppressClick=true;
    }
    try{
      if(host.hasPointerCapture(event.pointerId))host.releasePointerCapture(event.pointerId);
    }catch{}
    wake();
  };

  const leave=()=>{
    state.hover=false;
    host.removeAttribute("data-flip-interaction");
    state.targetX=0;
    state.targetY=0;
    state.targetScale=1;
    state.targetGlare=0;
    wake();
  };

  const resetForMediaChange=()=>{
    if(!reduce.matches&&finePointer.matches)return;
    state.drag=null;
    state.dragging=false;
    leave();
  };

  const click=event=>{
    if(!state.suppressClick)return;
    state.suppressClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const up=event=>releaseDrag(event,false);
  const cancel=event=>releaseDrag(event,true);

  host.addEventListener("pointerenter",enter);
  host.addEventListener("pointermove",move);
  host.addEventListener("pointerdown",down);
  host.addEventListener("pointerup",up);
  host.addEventListener("pointercancel",cancel);
  host.addEventListener("pointerleave",leave);
  host.addEventListener("click",click,true);
  reduce.addEventListener("change",resetForMediaChange);
  finePointer.addEventListener("change",resetForMediaChange);
  setVisualState();

  return ()=>{
    cancelAnimationFrame(state.frame);
    host.removeEventListener("pointerenter",enter);
    host.removeEventListener("pointermove",move);
    host.removeEventListener("pointerdown",down);
    host.removeEventListener("pointerup",up);
    host.removeEventListener("pointercancel",cancel);
    host.removeEventListener("pointerleave",leave);
    host.removeEventListener("click",click,true);
    reduce.removeEventListener("change",resetForMediaChange);
    finePointer.removeEventListener("change",resetForMediaChange);
    glare.remove();
    host.classList.remove("service-flip-card");
    host.removeAttribute("data-flip-interaction");
    host.removeAttribute("data-flip-dragging");
    for(const name of [
      "--service-card-perspective",
      "--service-card-hover-scale",
      "--service-card-glare-opacity",
      "--service-card-tilt-x",
      "--service-card-tilt-y",
      "--service-card-scale",
      "--service-card-glare-strength",
      "--service-card-glare-x",
      "--service-card-glare-y"
    ]){
      host.style.removeProperty(name);
    }
  };
}
