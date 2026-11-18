import {reducedMotion,motionDuration,motionEasing} from "../foundations/motion.js";
export function bindDisclosure(heading,content){
  let disclosureAnimation;
  const toggle=()=>{
   const expand=heading.getAttribute("aria-expanded")!=="true";
   const fromHeight=content.getBoundingClientRect().height;
   const fromOpacity=content.hidden?0:Number(getComputedStyle(content).opacity);
   const style=getComputedStyle(content);
   const spacing=style.marginTop,paddingTop=style.paddingTop,paddingBottom=style.paddingBottom;
   disclosureAnimation?.cancel();content.hidden=false;content.inert=!expand;
   content.classList.add("wd-disclosure-content","is-disclosing");
   heading.setAttribute("aria-expanded",String(expand));
   const finish=()=>{
    content.hidden=!expand;
    content.inert=!expand;
    content.classList.remove("is-disclosing");
   };
   if(reducedMotion()){finish();return;}
   const animation=content.animate([
    {
     height:`${fromHeight}px`,opacity:fromOpacity,marginTop:fromHeight?spacing:"0px",
     paddingTop:fromHeight?paddingTop:"0px",paddingBottom:fromHeight?paddingBottom:"0px"
    },
    {
     height:`${expand?content.scrollHeight:0}px`,opacity:expand?1:0,marginTop:expand?spacing:"0px",
     paddingTop:expand?paddingTop:"0px",paddingBottom:expand?paddingBottom:"0px"
    }
   ],{duration:motionDuration("--wd-motion-disclosure"),easing:motionEasing("--wd-ease-disclosure"),fill:"both"});
   disclosureAnimation=animation;
   animation.finished.then(()=>{if(disclosureAnimation===animation){finish();animation.cancel();disclosureAnimation=null;}}).catch(()=>{});
  };
  heading.addEventListener("click",toggle);
  return ()=>{disclosureAnimation?.cancel();heading.removeEventListener("click",toggle)};
}
