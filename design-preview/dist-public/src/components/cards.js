import {preserveCornerProfile} from "../foundations/geometry.js";
const variants={panel:"wd-main-panel",chart:"stat-chart-card",status:"status-card"};
// Geometry and content remain supplied by the design. A data card is never implicitly glass.
export function prepareCard(element,variant="chart"){
 if(!variants[variant])throw Error("Unknown card variant: "+variant);
 element.classList.add("wd-card","wd-card--"+variant,variants[variant]);preserveCornerProfile(element);return element;
}
export function createCard({variant="chart",radius,content}={}){
 const element=document.createElement("section");if(radius!==undefined)element.style.borderRadius=radius+"px";
 if(content)element.append(content);return prepareCard(element,variant);
}
