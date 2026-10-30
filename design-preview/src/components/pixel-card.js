// Framework-free adaptation of React Bits PixelCard. The host owns its layout
// and content; this module only paints a canvas beneath that content.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const smoothstep=(edge0,edge1,value)=>{
  const t=clamp((value-edge0)/(edge1-edge0),0,1);
  return t*t*(3-2*t);
};
const colorToRgb=value=>{
  let color=String(value||"").trim();
  const variable=color.match(/^var\((--[\w-]+)\)$/);
  if(variable)color=getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  const functional=color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if(functional)return functional.slice(1,4).map(Number);
  const hex=color.replace(/^#/,"");
  if(/^[0-9a-f]{3}$/i.test(hex)){
    return hex.split("").map(part=>parseInt(part+part,16));
  }
  if(/^[0-9a-f]{6}$/i.test(hex)){
    return [0,2,4].map(index=>parseInt(hex.slice(index,index+2),16));
  }
  return [203,213,225];
};

export function mountPixelCard(host,{
  colors=["#f8fafc","#f1f5f9","#cbd5e1"],
  lightColors=colors,
  glowColor="#cbd5e1",
  lightGlowColor=glowColor,
  gap=5,
  pixelSize=1,
  speed=35,
  revealDuration=600,
  spotlight=.6,
  glow=.5,
  opacity=.35,
  fade=.35
}={}){
  if(!host)throw Error("PixelCard requires a host element");
  if(host.querySelector(":scope>.service-pixel-canvas"))return()=>{};

  const canvas=document.createElement("canvas");
  canvas.className="service-pixel-canvas";
  canvas.setAttribute("aria-hidden","true");
  host.prepend(canvas);
  host.classList.add("service-pixel-card");
  const context=canvas.getContext("2d");
  if(!context){canvas.remove();return()=>{};}
  const lightTheme=()=>document.documentElement.dataset.theme==="light";
  const themePalette=()=>(lightTheme()?lightColors:colors).map(colorToRgb);
  const themeGlow=()=>colorToRgb(lightTheme()?lightGlowColor:glowColor);

  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const state={
    width:0,
    height:0,
    ratio:1,
    palette:[],
    glowRgb:themeGlow(),
    pixels:[],
    originX:0,
    originY:0,
    pointerX:0,
    pointerY:0,
    active:false,
    phase:"idle",
    changedAt:0,
    frame:0,
    last:0
  };
  let resizeObserver;
  let themeObserver;

  function resize(){
    const rect=host.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width));
    const height=Math.max(1,Math.round(rect.height));
    const ratio=Math.min(devicePixelRatio||1,2);
    if(width===state.width&&height===state.height&&ratio===state.ratio)return;
    state.width=width;
    state.height=height;
    state.ratio=ratio;
    state.palette=themePalette();
    state.glowRgb=themeGlow();
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    canvas.style.width=`${width}px`;
    canvas.style.height=`${height}px`;
    state.pixels=[];
    const columns=Math.floor((width-1)/gap)+1;
    const rows=Math.floor((height-1)/gap)+1;
    const offsetX=(width-(columns-1)*gap)/2;
    const offsetY=(height-(rows-1)*gap)/2;
    for(let column=0;column<columns;column+=1){
      for(let row=0;row<rows;row+=1){
        const x=offsetX+column*gap;
        const y=offsetY+row*gap;
        const edge=Math.min(x,width-x,y,height-y);
        const middle=Math.min(width,height);
        const edgeFade=1-fade*smoothstep(0,middle*.43,edge);
        state.pixels.push({
          x,
          y,
          color:state.palette[Math.floor(Math.random()*state.palette.length)],
          size:pixelSize*(.35+Math.random()*.65),
          phase:Math.random()*Math.PI*2,
          rate:.55+Math.random()*.9,
          alpha:Math.max(.08,edgeFade)
        });
      }
    }
  }

  function localPoint(event){
    const rect=host.getBoundingClientRect();
    return [event.clientX-rect.left,event.clientY-rect.top];
  }

  function start(x=state.width/2,y=state.height/2){
    resize();
    state.originX=x;
    state.originY=y;
    state.pointerX=x;
    state.pointerY=y;
    state.active=true;
    state.phase="reveal";
    state.changedAt=performance.now();
    host.dataset.pixelActive="true";
    host.removeAttribute("data-pixel-fading");
    wake();
  }

  function stop(){
    state.active=false;
    state.phase="exit";
    state.changedAt=performance.now();
    host.removeAttribute("data-pixel-active");
    host.dataset.pixelFading="true";
    wake();
  }

  function draw(now){
    state.frame=0;
    const elapsed=(now-state.changedAt)/1000;
    context.setTransform(state.ratio,0,0,state.ratio,0,0);
    context.clearRect(0,0,state.width,state.height);
    if(!state.pixels.length)return;

    const reveal=Math.max(.05,revealDuration/1000);
    const maxDistance=Math.hypot(state.width,state.height)||1;
    const frequency=(speed/35)*1.35;
    const time=now/1000;
    let visible=0;
    const glowRadius=Math.max(state.width,state.height)*.58;
    const glowStrength=state.active?glow*.18:Math.max(0,.18*(1-elapsed/.28));
    if(glowStrength>.001){
      const gradient=context.createRadialGradient(
        state.pointerX,state.pointerY,0,
        state.pointerX,state.pointerY,glowRadius
      );
      gradient.addColorStop(0,`rgba(${state.glowRgb.join(",")},${glowStrength*opacity})`);
      gradient.addColorStop(.55,`rgba(${state.glowRgb.join(",")},${glowStrength*opacity*.32})`);
      gradient.addColorStop(1,`rgba(${state.glowRgb.join(",")},0)`);
      context.fillStyle=gradient;
      context.fillRect(0,0,state.width,state.height);
    }

    for(const pixel of state.pixels){
      const distance=Math.hypot(pixel.x-state.originX,pixel.y-state.originY);
      const delay=(distance/maxDistance)*reveal*.82;
      let presence=0;
      if(reduce.matches){
        presence=state.active?1:0;
      }else if(state.active){
        presence=smoothstep(delay,delay+.26,elapsed);
      }else{
        presence=Math.max(0,1-elapsed/.3);
      }
      if(presence<=0)continue;
      visible+=presence;
      const spot=smoothstep(Math.min(state.width,state.height)*.38+30,0,
        Math.hypot(pixel.x-state.pointerX,pixel.y-state.pointerY));
      const twinkle=reduce.matches?1:.72+.28*Math.sin(pixel.phase+time*frequency*pixel.rate);
      const size=pixel.size*(.72+spot*spotlight*1.8)*twinkle;
      const alpha=clamp((.46+presence*.38+spot*spotlight*.38)*pixel.alpha*opacity,0,1);
      context.globalAlpha=alpha;
      context.fillStyle=`rgb(${pixel.color.join(",")})`;
      context.fillRect(pixel.x-size/2,pixel.y-size/2,size,size);
    }
    context.globalAlpha=1;

    if(state.active||visible>.2){
      state.frame=requestAnimationFrame(draw);
    }else{
      state.phase="idle";
      context.clearRect(0,0,state.width,state.height);
      host.removeAttribute("data-pixel-active");
      host.removeAttribute("data-pixel-fading");
    }
  }

  function wake(){
    if(!state.frame)state.frame=requestAnimationFrame(draw);
  }

  const enter=event=>{
    const [x,y]=localPoint(event);
    start(x,y);
  };
  const move=event=>{
    [state.pointerX,state.pointerY]=localPoint(event);
    if(!state.active&&event.pointerType!=="touch")start(state.pointerX,state.pointerY);
  };
  const leave=event=>{
    if(event.pointerType!=="touch")stop();
  };
  const click=event=>{
    if(!state.active)start(...localPoint(event));
    const [x,y]=localPoint(event);
    state.originX=x;
    state.originY=y;
    state.changedAt=performance.now();
    wake();
  };
  host.addEventListener("pointerenter",enter);
  host.addEventListener("pointermove",move);
  host.addEventListener("pointerleave",leave);
  host.addEventListener("pointerdown",click);
  resizeObserver=new ResizeObserver(()=>{resize();if(state.active)wake();});
  resizeObserver.observe(host);
  themeObserver=new MutationObserver(()=>{
    state.width=0;
    resize();
    if(state.active)wake();
  });
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  resize();

  return ()=>{
    cancelAnimationFrame(state.frame);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    host.removeEventListener("pointerenter",enter);
    host.removeEventListener("pointermove",move);
    host.removeEventListener("pointerleave",leave);
    host.removeEventListener("pointerdown",click);
    canvas.remove();
    host.classList.remove("service-pixel-card");
    host.removeAttribute("data-pixel-active");
    host.removeAttribute("data-pixel-fading");
  };
}
