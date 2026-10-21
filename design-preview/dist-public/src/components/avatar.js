import {applyTypeStyle} from "../foundations/typography.js";
export function createAvatar(initials,{size=36,className=""}={}){
 const element=document.createElement("span");element.className=`wd-avatar ${className}`.trim();
 element.textContent=initials;element.style.width=element.style.height=`${size}px`;
 applyTypeStyle(element,"14/14 medium");return element;
}
