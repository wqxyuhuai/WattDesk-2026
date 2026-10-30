import {applyTypeStyle} from "../foundations/typography.js";
export function createAvatar(initials,{size=36,className=""}={}){
 const element=document.createElement("span");element.className=`wd-avatar ${className}`.trim();
 const numericSize=Number(size);
 const profile=numericSize<=24?"compact":numericSize<=32?"small":"regular";
 element.dataset.avatarSize=profile;
 const label=document.createElement("span");
 label.className="wd-avatar-label";label.textContent=initials;
 element.append(label);element.style.width=element.style.height=`${size}px`;
 applyTypeStyle(element,profile==="regular"?"14/14 medium":"Caption2/Regular");return element;
}
