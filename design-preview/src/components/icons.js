const neutralIconFiles=new Set(["cell-balance.svg","module-balance.svg","device-track.svg","organisation.svg","teams.svg","user.svg","asset-27.svg","asset-70.svg","disclosure.svg"]);
export const isNeutralIconFile=file=>neutralIconFiles.has(file);
// Reusable settings-domain symbols. Keep these shape-only SVG masks in the
// shared asset library so other pages can inherit the same semantic meaning
// without copying geometry or hard-coding a colour.
export const SETTINGS_ICON_FILES=Object.freeze({
 runningMode:"icons/settings/running-mode.svg",
 economicSchedule:"icons/settings/economic-mode.svg",
 batteryManagement:"icons/settings/battery-management.svg",
 activePowerDispatch:"icons/settings/active-power-dispatch.svg",
 feedInImportLimits:"icons/settings/feed-in-import-limits.svg",
 outputCapability:"icons/settings/output-capability.svg",
 diPort:"icons/settings/di-port.svg",
 gridProtection:"icons/settings/grid-protection.svg",
 networking:"icons/settings/networking.svg",
 deviceFeatures:"icons/settings/device-features.svg",
 mpptStrings:"icons/settings/mppt-strings.svg",
 ctDetection:"icons/settings/ct-detection.svg",
 operationControl:"icons/settings/operation-control.svg",
 resetRecovery:"icons/settings/reset-recovery.svg",
 parameterExport:"icons/settings/parameter-export.svg",
 operationLog:"icons/settings/operation-log.svg",
 generalMode:"icons/settings/general-mode.svg",
 peakLoadShiftingMode:"icons/settings/peak-load-shifting-mode.svg",
 economicMode:"icons/settings/economic-mode.svg",
 upsMode:"icons/settings/ups-mode.svg",
 timeOfUseMode:"icons/settings/time-of-use-mode.svg",
 offGridMode:"icons/settings/off-grid-mode.svg",
 selectedCheck:"icons/settings/check-circle.svg"
});
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
export const SETTINGS_REFERENCE_IMAGE_URLS=Object.freeze({
 battery20kw:assetURL("inverter-settings/setup/battery-20kw-lcd.png"),
 pv20kw:assetURL("inverter-settings/setup/pv-20kw-lcd.png"),
 battery50kw:assetURL("inverter-settings/setup/battery-50kw-no-screen.png"),
 pv50kw:assetURL("inverter-settings/setup/pv-50kw-no-screen.png")
});
// Export assets can carry label alpha; neutral state masks must be fully opaque so primary ink stays primary.
export const opaqueMaskURL=file=>new URL(`../../home-assets/masks/${file}`,import.meta.url).href;
// Page-level inline icons are still colour-masked by CSS. This factory owns the
// repeated span/aria/mask wiring while callers retain their semantic class and
// choose whether the source is an ordinary or generated opaque mask.
export function createMaskedIcon(url,classNameOrOptions="wd-masked-icon"){
 const options=typeof classNameOrOptions==="string"
  ?{className:classNameOrOptions}
  :classNameOrOptions;
 const icon=document.createElement("span");
 icon.className=options.className||"wd-masked-icon";
 if(options.ariaHidden!==false)icon.setAttribute("aria-hidden","true");
 icon.style.setProperty("--icon-mask",`url("${url}")`);
 return icon;
}
export function iconAsset(file, tone="mono", label=""){
 const icon=document.createElement("span");icon.className=`target-icon-art target-icon-art--${tone}`;
 if(neutralIconFiles.has(file)){icon.classList.add("target-icon-neutral");icon.style.setProperty("--icon-mask",`url("${assetURL(file)}")`);}
 if(tone==="mono")icon.style.setProperty("--icon-mask",`url("${assetURL(file)}")`);
 else{const img=document.createElement("img");img.src=`./home-assets/${file}`;img.alt=label;img.draggable=false;icon.append(img);if(file==="disclosure.svg")img.classList.add("wd-disclosure-glyph")}
 return icon;
}
