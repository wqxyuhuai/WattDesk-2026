import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";

/**
 * Shared Running Mode card transition. The selected card grows as its
 * description appears, while the previous card collapses. Animations are
 * interruptible and can be restarted from their current rendered height.
 */
export function createSettingsModeMotion({scope,onSettled=()=>{}}={}){
 let animations=[];
 let settleTimer=0;
 let generation=0;

 function restoreCards(){
  if(!scope)return;
  for(const card of scope.querySelectorAll(".isw-mode-card.is-mode-animating")){
   card.classList.remove("is-mode-animating");
   const description=card.querySelector(".isw-mode-description");
   if(!description)continue;
   description.style.removeProperty("display");
   description.style.removeProperty("opacity");
   description.style.removeProperty("transform");
  }
 }

 function clear(){
  generation+=1;
  clearTimeout(settleTimer);
  settleTimer=0;
  const current=animations;
  animations=[];
  for(const animation of current){
   try{animation.cancel();}catch{}
  }
  restoreCards();
 }

 function animate(index,page=scope?.querySelector(".isw-page:not(.isw-page--leaving)")){
  if(!page)return;
  const cards=[...page.querySelectorAll(".isw-mode-card")];
  if(!cards.length)return;
  const before=cards.map(card=>card.getBoundingClientRect().height);
  const beforeDescriptions=cards.map(card=>{
   const description=card.querySelector(".isw-mode-description");
   if(!description)return 0;
   const style=getComputedStyle(description);
   const opacity=Number.parseFloat(style.opacity);
   return style.display==="none"||!Number.isFinite(opacity)?0:Math.max(0,Math.min(1,opacity));
  });
  clear();
  const version=generation;
  cards.forEach((card,cardIndex)=>{
   const selected=cardIndex===index;
   card.classList.toggle("is-selected",selected);
   card.setAttribute("aria-pressed",String(selected));
  });
  const after=cards.map(card=>card.getBoundingClientRect().height);
  if(reducedMotion())return;
  const timing={
   duration:motionDuration("--wd-motion-panel"),
   easing:motionEasing("--wd-ease-panel")
  };
  const nextAnimations=[];
  cards.forEach((card,cardIndex)=>{
   const selected=cardIndex===index;
   const heightChanged=Math.abs(after[cardIndex]-before[cardIndex])>=.5;
   const description=card.querySelector(".isw-mode-description");
   const targetDescriptionOpacity=selected?1:0;
   const currentDescriptionOpacity=beforeDescriptions[cardIndex]??targetDescriptionOpacity;
   const descriptionChanged=description&&Math.abs(targetDescriptionOpacity-currentDescriptionOpacity)>.01;
   if(!heightChanged&&!descriptionChanged)return;
   card.classList.add("is-mode-animating");
   if(heightChanged){
    nextAnimations.push(card.animate(
     [{height:`${before[cardIndex]}px`},{height:`${after[cardIndex]}px`}],
     {...timing,fill:"both"}
    ));
   }
   if(descriptionChanged){
    description.style.display="block";
    nextAnimations.push(description.animate(
     [{opacity:currentDescriptionOpacity},{opacity:targetDescriptionOpacity}],
     {...timing,fill:"both"}
    ));
   }
  });
  animations=nextAnimations;
  settleTimer=setTimeout(()=>{
   if(version!==generation||animations!==nextAnimations)return;
   clear();
   onSettled();
  },timing.duration+40);
 }

 return {
  animate,
  clear,
  destroy(){
   clear();
   scope=null;
  }
 };
}
