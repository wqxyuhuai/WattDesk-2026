import {createTextElement as text} from "../../foundations/dom.js";
import {createConnectionGlyph} from "./connection-icon.js";

export function createDeviceIdentity({name,status,metaItems=[]}){
 const element=text("div","plants-device-identity");
 const titleLine=text("div","plants-device-title-line");
 const statusChip=text("span",`plants-device-status is-${status.tone}`);
 const statusIcon=createConnectionGlyph(status.connection,{size:16,className:"plants-device-connection-glyph",mutedOpacity:.55,animate:true});
 statusChip.append(
  statusIcon,
  text("span","plants-device-status-label",status.label,"Caption1/Emphasized")
 );
 titleLine.append(text("h2","plants-device-name",name,"Subheadline/Emphasized"));
 const metaLine=text("div","plants-device-meta-line");
 metaLine.append(statusChip);
 metaItems.forEach((item,index)=>{
  metaLine.append(text("span","plants-device-meta-separator"));
  metaLine.append(text("span","plants-device-meta-item",item,"Caption1/Regular"));
 });
 element.append(titleLine,metaLine);
 return {element,titleLine,metaLine,statusChip};
}
