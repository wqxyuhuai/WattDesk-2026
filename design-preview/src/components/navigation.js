import {button} from "./controls.js";
import {iconAsset} from "./icons.js";
export function makeNavRow(label, key, iconFile="", extraClass="", tone="mono"){
 const b=button(label,`target-nav ${extraClass}`);const icon=document.createElement("span");icon.className="target-nav-icon";
 if(iconFile)icon.append(iconAsset(iconFile,tone));
 const textNode=document.createElement("span");textNode.textContent=label;b.append(icon,textNode);
 b.dataset.route=key;return b;
}
