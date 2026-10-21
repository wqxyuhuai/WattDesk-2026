import {reducedMotion,motionDuration,motionEasing} from "../foundations/motion.js";
export function bindDisclosure(heading,content){
  let disclosureAnimation;
  const toggle=()=>{
   const expand=heading.getAttribute("aria-expanded")!=="true";
   const fromHeight=content.getBoundingClientRect().height;
   const fromOpacity=content.hidden?0:Number(getComputedStyle(content).opacity);
   disclosureAnimation?.cancel();content.hidden=false;content.inert=!expand;
   heading.setAttribute("aria-expanded",String(expand));
   const finish=()=>{content.hidden=!expand;};
   if(reducedMotion()){finish();return;}
   const animation=content.animate([
    {height:`${fromHeight}px`,opacity:fromOpacity,marginTop:fromHeight?"1px":"0px"},
    {height:`${expand?content.scrollHeight:0}px`,opacity:expand?1:0,marginTop:expand?"1px":"0px"}
   ],{duration:motionDuration("--wd-motion-disclosure"),easing:motionEasing("--wd-ease-disclosure"),fill:"both"});
   disclosureAnimation=animation;
   animation.finished.then(()=>{if(disclosureAnimation===animation){finish();animation.cancel();disclosureAnimation=null;}}).catch(()=>{});
  };
  heading.addEventListener("click",toggle);
  return ()=>{disclosureAnimation?.cancel();heading.removeEventListener("click",toggle)};
}
