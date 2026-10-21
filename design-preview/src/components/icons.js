const neutralIconFiles=new Set(["cell-balance.svg","module-balance.svg","device-track.svg","organisation.svg","teams.svg","user.svg","asset-27.svg","disclosure.svg"]);
export const isNeutralIconFile=file=>neutralIconFiles.has(file);
// Semantic names retain original Figma paths. Provenance: design/figma/source-icons.json.
export const ICONS=Object.freeze({
 history:["asset-2.svg","mono"],forward:["asset-14.svg","mono"],search:["asset-4.svg","mono"],
 home:["asset-5.svg","mono"],plants:["asset-6.svg","color"],ticket:["asset-7.svg","color"],
 statistics:["statistics.svg","color"],disclosure:["disclosure.svg","color"],
 cell:["cell-balance.svg","color"],module:["module-balance.svg","color"],track:["device-track.svg","color"],
 organisation:["organisation.svg","color"],teams:["teams.svg","color"],user:["user.svg","color"],
 notifications:["asset-32.svg","mono"],add:["asset-27.svg","color"],language:["asset-28.svg","mono"],
 moon:["asset-30.svg","mono"],sun:["sun.svg","mono"],settings:["settings.svg","mono"],support:["asset-34.svg","mono"]
});
export function createIcon(name,tone){
 const source=ICONS[name];if(!source)throw Error("Unknown Figma icon: "+name);
 return iconAsset(source[0],tone||source[1]);
}
export const assetURL=file=>new URL("../../home-assets/"+file,import.meta.url).href;
// Export assets can carry label alpha; neutral state masks must be fully opaque so primary ink stays primary.
export const opaqueMaskURL=file=>new URL(`../../home-assets/masks/${file}`,import.meta.url).href;
export function iconAsset(file, tone="mono", label=""){
 const icon=document.createElement("span");icon.className=`target-icon-art target-icon-art--${tone}`;
 if(neutralIconFiles.has(file)){icon.classList.add("target-icon-neutral");icon.style.setProperty("--icon-mask",`url("${assetURL(file)}")`);}
 if(tone==="mono")icon.style.setProperty("--icon-mask",`url("${assetURL(file)}")`);
 else{const img=document.createElement("img");img.src=`./home-assets/${file}`;img.alt=label;img.draggable=false;icon.append(img);if(file==="disclosure.svg")img.classList.add("wd-disclosure-glyph")}
 return icon;
}
