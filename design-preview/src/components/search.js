import {button} from "./controls.js";
import {applyTypeStyle} from "../foundations/typography.js";
export function createSearchTrigger(label,className=""){const el=button(label,className);applyTypeStyle(el,"14/14 medium");return el}
export function createSearchInput({label,placeholder,className="search-input"}){
 const el=document.createElement("input");el.className=className;el.placeholder=placeholder;el.setAttribute("aria-label",label);
 applyTypeStyle(el,"Subheadline/Regular");return el;
}
