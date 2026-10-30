import {applyTypeStyle} from "./typography.js";

// Common element factory for semantic page DOM. It deliberately does not set
// layout classes or content beyond the caller's arguments, so adopting it does
// not change an existing component's visual boundary.
export function createTextElement(tag,className="",content,typeStyle){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(content!==undefined)node.textContent=content;
 if(typeStyle)applyTypeStyle(node,typeStyle);
 return node;
}
