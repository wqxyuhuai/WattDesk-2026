import {ECONOMIC_MODES,MODES,isEconomicDraft,timeToMinutes} from "./settings-model.js";
import {formatAbsoluteDate} from "../../foundations/time.js";
import {
 BATTERY_BRAND_OPTIONS,
 CAPABILITY_OPTIONS,
 CT_CURRENT_MODE_OPTIONS,
 DI_PORT_OPTIONS,
 DISPATCH_MODE_OPTIONS,
 EXPORT_FORMAT_OPTIONS,
 F_P_REFERENCE_OPTIONS,
 LIMIT_BASIS_OPTIONS,
 MPPT_SOURCE_OPTIONS,
 NETWORK_INTERFACE_OPTIONS,
 POWER_CHANGE_OPTIONS,
 P_U_MODE_OPTIONS,
 REACTIVE_LIMIT_OPTIONS,
 SETTINGS_POINT_CONTRACTS
} from "./settings-options.js";
import {settingRange} from "./settings-validation.js";
import {dynamicTouPage,manualTouPage} from "./tou-settings.js";

const iconMarkup=name=>`<i class="isw-icon" data-isw-icon="${name}" aria-hidden="true"></i>`;
const POINTS=SETTINGS_POINT_CONTRACTS;
const ecoPowerRange=settingRange("eco.power","%");
const sw=path=>`<span class="isw-switch-slot" data-isw-switch="${path}"></span>`;
const seg=(path,options,current)=>{
 const normalized=options.map(option=>typeof option==="string"?{label:option}:option);
 const encoded=encodeURIComponent(JSON.stringify(normalized));
 return `<span class="isw-seg-slot" data-isw-seg="${path}" data-isw-options="${encoded}" data-isw-value="${current}"></span>`;
};
const note=(html,narrow=false)=>`<div class="isw-note${narrow?" isw-note--narrow":""}">${iconMarkup("info")}<div>${html}</div></div>`;
const row=(label,hint,control,dim=false)=>`<div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label${dim?" isw-row-label--secondary":""}">${label}</div>${hint?`<div class="isw-row-hint">${hint}</div>`:""}</div>${control}</div>`;
const escapeAttribute=value=>String(value??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const textField=(path,value,label)=>`<span class="isw-wifi-field wd-edit-field">
 <input type="text" value="${escapeAttribute(value)}" data-isw-text="${path}" aria-label="${escapeAttribute(label)}" autocomplete="off" autocapitalize="off" spellcheck="false">
</span>`;
const passwordField=(path,value,label)=>`<span class="isw-wifi-field isw-wifi-field--password wd-edit-field">
 <input type="password" value="${escapeAttribute(value)}" data-isw-text="${path}" aria-label="${escapeAttribute(label)}" autocomplete="new-password" autocapitalize="off" spellcheck="false">
 <button class="isw-wifi-password-toggle wd-control-state" type="button" data-isw-password-toggle="${path}" aria-label="Show password" aria-pressed="false"><span class="isw-wifi-eye" data-isw-password-eye aria-hidden="true"></span></button>
</span>`;
const readonlyDataRow=(label,hint,value)=>row(label,hint,`<div class="isw-readonly-value">${value}</div>`).replace('class="isw-row"','class="isw-row isw-row--readonly-data"');
const num=(path,value,unitName,step=.1,decimals=1)=>`<span class="isw-number wd-edit-field">
 <input value="${Number(value).toFixed(decimals)}" data-isw-number="${path}" data-isw-decimals="${decimals}" data-isw-step-size="${step}" inputmode="decimal">
 <span class="isw-number-unit">${unitName}</span>
</span>`;
const mini=(path,value,unitName,step=.1,decimals=1)=>`<span class="isw-mini-number wd-edit-field">
 <input value="${Number(value).toFixed(decimals)}" data-isw-number="${path}" data-isw-decimals="${decimals}" inputmode="decimal">
 <span class="isw-number-unit">${unitName}</span>
</span>`;
const readonly=value=>`<b class="isw-readonly-value">${value}</b>`;
const copyValue=(label,value)=>`<button class="isw-copy-value wd-control-state" type="button" data-isw-copy-value="${value}" data-isw-copy-label="${label}" aria-label="Copy ${label}: ${value}">${value}</button>`;
const tableRow=(columns,cells)=>`<div class="isw-table-row" style="grid-template-columns:${columns}">${cells}</div>`;
const tableHead=(columns,cells,className="")=>`<div class="isw-table-head${className?` ${className}`:""}" style="grid-template-columns:${columns}">${cells}</div>`;
const actionButton=(label,action,variant="neutral",disabled=false)=>`<button class="isw-button-slot" type="button" data-isw-standard-button data-isw-action="${action}" data-isw-button-label="${label}" data-isw-button-variant="${variant}"${disabled?" disabled":""}>${label}</button>`;
const scanIntervalSelect=(value,path="mppt.interval",label="Scan interval")=>`<span class="isw-select-slot" data-isw-interval-select="${value}" data-isw-interval-path="${path}" data-isw-interval-label="${label}"></span>`;
const stateMark=(html,...keys)=>{
 // Keep deviation semantics and counts without adding a page-local visual stripe.
 return html.replace('class="isw-table-row"','class="isw-table-row isw-row--deviated"')
  .replace('class="isw-row"','class="isw-row isw-row--deviated"');
};
const markedRow=(model,key,label,hint,control,dim=false)=>{
 const markup=row(label,hint,control,dim);
 return model.dev(key)?stateMark(markup):markup;
};
const pointRow=(label,hint,control,point,dim=false)=>
 row(label,hint,control,dim).replace('class="isw-row"',`class="isw-row" data-isw-point="${point}"`);

function effectiveChainParts(model){
 const e=model.effective();
 return {e,max:Math.max(Math.abs(e.sp),Math.abs(e.out??0),e.feed,model.S.battChgMax,1)};
}

function pageDispatch(model){
 const {e,max}=effectiveChainParts(model);
 const width=value=>`${Math.min(100,Math.abs(Number(value)||0)/max*100).toFixed(1)}%`;
 const power=value=>e.available?`${Number(value).toFixed(1)} kW`:"Unavailable";
 const source=e.available&&e.src?e.src:"Not reported";
  const sourceTone=e.available?e.sourceTone:"idle";
 return `<h2 class="isw-page-title">Active Power Dispatch</h2>
 <section class="isw-panel">${pointRow("EMS dispatch","Takes a power setpoint from the EMS in place of the running mode",sw("dispatch.on"),POINTS.dispatchEnable.point)}</section>
 ${model.S.dispatch.on?`
 ${note("Setpoint is the target net power <b>at the grid-tied point</b>. Grid support functions (F-P, P(U)) may override it when the grid requires. The export limit is never overridden.")}
 <h3 class="isw-group-title">Dispatch</h3>
 <section class="isw-panel">
  ${pointRow("Setpoint unit","",seg("dispatch.unit",DISPATCH_MODE_OPTIONS,model.S.dispatch.unit),POINTS.dispatchMode.point,true)}
  ${pointRow("Setpoint","Positive exports to the grid · negative imports from it",num("dispatch.sp",model.S.dispatch.sp,model.unit(),model.S.dispatch.unit?.5:1),POINTS.dispatchSetpoint.point,true)}
  ${pointRow("Command timeout","Reverts to the running mode when no new command arrives within this time",num("dispatch.timeout",model.S.dispatch.timeout,"s",30,0),POINTS.dispatchTimeout.point,true)}
 </section>
 <h3 class="isw-group-title">Currently effective</h3>
 <section class="isw-effective-chain" data-isw-point-group="active-power-effective">
  <div class="isw-chain-row isw-chain-row--primary" data-isw-point="${POINTS.effectiveLimit.point}"><span class="isw-chain-key">Effective power limit</span><span class="isw-chain-track"><i class="isw-chain-bar" style="width:${width(e.out)}"></i></span><span class="isw-chain-value">${power(e.out)}</span></div>
  <div class="isw-chain-row isw-chain-row--source" data-isw-point="${POINTS.effectiveLimitSource.point}"><span class="isw-chain-key">Limit source</span><span class="isw-chain-value isw-chain-source isw-status isw-status--${sourceTone}"><i></i><span>${source}</span></span></div>
  <div class="isw-chain-row" data-isw-point="${POINTS.effectivePvCurtailed.point}"><span class="isw-chain-key">PV curtailed</span><span class="isw-chain-track"><i class="isw-chain-bar" style="width:${width(e.curtail)}"></i></span><span class="isw-chain-value">${power(e.curtail)}</span></div>
 </section>
 <div class="isw-chain-foot">${e.available?"Values are reported by the inverter.":"The inverter has not reported effective values."}</div>`:""}`;
}

export function limitBasisViewState(model){
 const limits=model.S.limits;
 const supported=model.capabilities.supportsPerPhaseLimit;
 return {
  show:Boolean(limits.feedOn&&model.capabilities.phaseCount===3),
  options:LIMIT_BASIS_OPTIONS.map((label,index)=>({
   label,
   disabled:index===1&&!supported
  })),
  hint:supported
   ?limits.basis?"No single phase may exceed the limit":"Sum of the three phases at the meter"
   :"Sum of the three phases at the meter. Per-phase limiting is not supported by the current firmware.",
  showNote:Boolean(limits.feedOn&&Number(limits.basis)===1&&supported)
 };
}

function pageLimits(model){
 const limits=model.S.limits;
 const basis=limitBasisViewState(model);
 return `<h2 class="isw-page-title">Import &amp; Export Limits</h2>
 <h3 class="isw-group-title">Grid-tied point · export</h3>
 <section class="isw-panel">
  ${row("Export limit","Maximum power fed to the public grid",sw("limits.feedOn"))}
  ${limits.feedOn?row("Limit value","",num("limits.feed",limits.feed,"kW",.5),true):""}
  ${basis.show?row("Limit basis",basis.hint,seg("limits.basis",basis.options,limits.basis),true):""}
 </section>
 <div class="isw-chain-foot isw-chain-foot--tight">This limit is never exceeded, including while the Frequency-Watt (F-P) function is active. Set it to match the site's cable and breaker rating.</div>
 ${basis.showNote?note("Per-phase limiting requires firmware with per-phase closed-loop control. On models with balanced three-phase output, the lightest-loaded phase caps total output, which can increase PV curtailment. Use it only when required by the grid operator or meter."):""}
 <h3 class="isw-group-title">Grid-tied point · import</h3>
 <section class="isw-panel">
  ${row("Import limit","Maximum power drawn from the public grid",sw("limits.impOn"))}
  ${limits.impOn?row("Limit value","",num("limits.imp",limits.imp,"kW",.5),true):""}
 </section>
 ${note("Both limits are measured <b>at the grid-tied point</b> (meter side), not at the inverter AC terminals. The inverter's own ceiling is set under <b>Output Capability</b>.")}`;
}

function pageMode(model){
 return `<h2 class="isw-page-title">Running Mode</h2>
 <div class="isw-mode-list">${MODES.map((mode,index)=>`
  <button type="button" class="isw-mode-card${model.S.runMode===index?" is-selected":""}" data-isw-mode="${index}" aria-pressed="${model.S.runMode===index}">
   ${iconMarkup(mode.icon)}
   <span class="isw-mode-copy">
    <span class="isw-mode-name">${mode.label}</span>
    <span class="isw-mode-summary">${mode.summary}</span>
    <span class="isw-mode-flow">${mode.flow.map(item=>`<b>${item}</b>`).join('<span class="isw-flow-arrow" aria-hidden="true">→</span>')}</span>
    <span class="isw-mode-description">${mode.description}</span>
   </span>
   <span class="isw-radio-mark" aria-hidden="true"></span>
  </button>`).join("")}</div>`;
}

function batteryEntries(model){
 const battery=model.S.battery;
 const parallel=model.capabilities.batteryPathCount===2&&model.capabilities.supportsBatteryParallel&&battery.parallel;
 if(parallel||model.capabilities.batteryPathCount===1){
  return [{key:"common",label:"Battery",data:battery.common}];
 }
 return [
  {key:"bank1",label:"Battery #1",data:battery.bank1},
  {key:"bank2",label:"Battery #2",data:battery.bank2}
 ];
}

function batteryParallelWarning(){
 return `<div class="isw-battery-warning" data-isw-battery-parallel-warning role="alert">
  ${iconMarkup("warning")}
  <div>Battery Parallel Mode is enabled. The system cannot detect which battery string is active. Please verify the battery power and communication cable connections to ensure proper configuration.</div>
 </div>`;
}

const labeledBatteryNumber=(markup,label,hintId="")=>markup
 .replace("<input ",`<input aria-label="${label}" data-isw-log-label="${label}"${hintId?` aria-describedby="${hintId}"`:""} `);
const batteryBoundary=(path,value,label,hintId)=>labeledBatteryNumber(mini(path,value,"%",1,0),label,hintId);
const batteryCurrent=(path,value,label)=>labeledBatteryNumber(num(path,value,"A",1,0),label);

function socRangeCard(entry,kind){
 const prefix=`battery.${entry.key}`;
 const grid=kind==="grid";
 const title=grid?"Grid-tied SOC":"Off-grid SOC";
 const hint=grid
  ?"Operating range while connected to the grid."
  :"Operating range during an outage.";
 const lowPath=`${prefix}.${kind}Min`;
 const highPath=`${prefix}.${kind}Max`;
 const low=Number(entry.data[`${kind}Min`]);
 const high=Number(entry.data[`${kind}Max`]);
 const hintId=`isw-${prefix.replaceAll(".","-")}-${kind}-hint`;
 return `<section class="isw-soc-panel isw-soc-range-card" data-isw-soc-card="${prefix}.${kind}">
  <div class="isw-row">
   <div class="isw-row-copy">
    <div class="isw-row-label">${title}</div>
    <div class="isw-row-hint" id="${hintId}">${hint}</div>
   </div>
   <div class="isw-soc-range-values">
    ${batteryBoundary(lowPath,low,`${entry.label} ${title} lower limit`,hintId)}
    <span aria-hidden="true">–</span>
    ${batteryBoundary(highPath,high,`${entry.label} ${title} upper limit`,hintId)}
   </div>
  </div>
  <div class="isw-soc-range" data-isw-soc-range data-low-field="${lowPath}" data-high-field="${highPath}" data-low="${low}" data-high="${high}">
   <div class="isw-soc-range-track">
    <span class="isw-soc-range-fill" style="left:${low}%;right:${100-high}%"></span>
    <button class="isw-soc-handle" type="button" role="slider" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${low}" aria-valuetext="${low}%" aria-label="${entry.label} ${title} lower limit" aria-describedby="${hintId}" data-isw-soc-handle="low" data-value="${low}" data-render-value="${low}" style="left:${low}%"></button>
    <button class="isw-soc-handle" type="button" role="slider" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${high}" aria-valuetext="${high}%" aria-label="${entry.label} ${title} upper limit" aria-describedby="${hintId}" data-isw-soc-handle="high" data-value="${high}" data-render-value="${high}" style="left:${high}%"></button>
    <span class="isw-soc-value-tooltip" data-isw-soc-tooltip role="tooltip" aria-hidden="true"><span data-isw-soc-tooltip-text></span></span>
   </div>
   <div class="isw-soc-range-ticks" aria-hidden="true"><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span></div>
  </div>
 </section>`;
}

function batteryConfigCard(entry,{parallelRow=false,parallelMasterUnknown=false}={}){
 const path=`battery.${entry.key}`;
 const hideParallelConfig=parallelRow&&parallelMasterUnknown;
 return `<section class="isw-panel" data-isw-battery-config="${entry.key}">
  ${parallelRow?row("Parallel Battery Operation","Operate both connected batteries as one bank. Turn it off to configure each battery separately",sw("battery.parallel"),true):""}
  ${parallelRow&&parallelMasterUnknown?batteryParallelWarning():""}
  ${hideParallelConfig?"":`
   ${row("Battery Brand","Battery model paired with this input",`<span class="isw-select-slot" data-isw-battery-brand="${path}.brand" data-isw-battery-brand-value="${encodeURIComponent(entry.data.brand||BATTERY_BRAND_OPTIONS[0])}" data-isw-battery-brand-label="${entry.label} Battery Brand" data-isw-log-label="${entry.label} Battery Brand"></span>`,true)}
   ${row("Max. Charge Current","Upper charging current accepted by this battery input",batteryCurrent(`${path}.chargeMax`,entry.data.chargeMax,`${entry.label} Max. Charge Current`),true)}
   ${row("Max. Discharge Current","Upper discharge current supplied by this battery input",batteryCurrent(`${path}.dischargeMax`,entry.data.dischargeMax,`${entry.label} Max. Discharge Current`),true)}`}
 </section>`;
}

function pageBattery(model){
 const battery=model.S.battery;
 const entries=batteryEntries(model);
 const multiBank=entries.length>1;
 const socEntry={key:"soc",label:"Battery",data:battery.soc};
 const showParallel=model.capabilities.batteryPathCount===2&&model.capabilities.supportsBatteryParallel;
 const parallelMasterUnknown=showParallel&&battery.parallel&&!model.capabilities.batteryMasterBattery;
 const bankTitle=entry=>multiBank?`<h3 class="isw-group-title">${entry.label}</h3>`:"";
 const configuration=showParallel&&battery.parallel
  ?batteryConfigCard(entries[0],{parallelRow:true,parallelMasterUnknown})
  :`${showParallel?`<section class="isw-panel" data-isw-battery-parallel><div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label isw-row-label--secondary">Parallel Battery Operation</div><div class="isw-row-hint">Operate both connected batteries as one bank. Turn it off to configure each battery separately</div></div>${sw("battery.parallel")}</div></section>`:""}
    ${entries.map(entry=>`${bankTitle(entry)}${batteryConfigCard(entry)}`).join("")}`;
 const heatingRows=multiBank
  ? entries.map(entry=>row(`Keep ${entry.label} Warm`,"Pre-heats the battery instead of blocking charge when the pack is cold",sw(`battery.${entry.key}.warm`),true)).join("")
  :row("Keep Battery Warm","Pre-heats the battery instead of blocking charge when the pack is cold",sw("battery.common.warm"),true);
 return `<h2 class="isw-page-title">Battery</h2>
 <h3 class="isw-group-title">Battery configuration</h3>
 ${configuration}
 <h3 class="isw-group-title">State of charge</h3>
 ${socRangeCard(socEntry,"grid")}
 ${socRangeCard(socEntry,"off")}
 ${note("Each filled band shows the battery operating range. The off-grid range can keep more reserve available for an outage.")}
 <h3 class="isw-group-title">Battery heating</h3>
 <section class="isw-panel">${heatingRows}</section>`;
}

function pageCapability(model){
 return `<h2 class="isw-page-title">Output Capability</h2>
 <section class="isw-panel">${pointRow("AC power limit mode","Determines the inverter's own output ceiling",seg("capability",CAPABILITY_OPTIONS,model.S.capability),POINTS.outputCapabilityMode.point)}</section>
 ${note("Rated: max output = rated output power.<br>Overload: max output &gt; rated.<br>Underload: max output &lt; rated.<br>This is the inverter ceiling, independent of the grid-tied point limits.")}`;
}

function pageDi(model){
 return `<h2 class="isw-page-title">DI Port</h2>
 <section class="isw-panel">${pointRow("DI port configuration","Digital input for grid operator dispatch",seg("di",DI_PORT_OPTIONS,model.S.di),POINTS.diPort.point)}</section>
 ${note("<b>DRM</b> is the demand response mode defined by AS/NZS 4777.<br><b>RCR</b> is the Rundsteuerempfänger, the ripple control receiver used by German DSOs.<br>Select the scheme your grid operator wires to this port. Leave it Off when nothing is wired.")}`;
}

function pageFeatures(model){
 const features=model.S.features;
 return `<h2 class="isw-page-title">Device Features</h2>
 <h3 class="isw-group-title">Dispatch safeguards</h3>
 <section class="isw-panel">
  ${row("Communication watchdog","Falls back to the general mode if the EMS link is lost",sw("features.watchdog"))}
  ${features.watchdog?row("Watchdog timeout","Time without a valid write before the fallback takes effect",num("features.wdt",features.wdt,"s")):""}
 </section>
 <h3 class="isw-group-title">Operating envelope</h3>
 <section class="isw-panel">
  ${row("Allow grid / off-grid switching","Enables the backup port to carry load when the grid is absent",sw("features.offgrid"))}
  ${row("Backup Output","Controls energy output from the backup port. Stop the inverter before changing this setting",sw("features.backupOutput"))}
  ${row("Unbalanced output","Per-phase regulation on the backup port. Off keeps the three phases symmetrical",sw("features.unbalanced"))}
 </section>
 <h3 class="isw-group-title">Local interface</h3>
 <section class="isw-panel">
  ${row("Indicator backlight","Dims the status LEDs after ten minutes of inactivity",sw("features.light"))}
  ${row("Buzzer","Audible alarm on a protection trip",sw("features.buzzer"))}
 </section>
 ${note("The watchdog fallback and the off-grid permission are recorded in the operation log. Both are part of the commissioning record.")}`;
}

export function backupOutputSafetyNotice(enabling){
 return enabling
  ?{
   title:"Cannot Enable Backup Output",
   description:"To safely activate Backup Output, the inverter must be stopped and the backup load must be confirmed to be within the nameplate's rated power range with secure connections."
  }
  :{
   title:"Cannot Disable Backup Output",
   description:"The inverter is currently running. To ensure system safety, the inverter must be stopped before turning off the Backup Output."
  };
}

function pageGrid(model){
 if(!model.S.unlocked)return "";
 const renderer=GRID_PAGES[model.S.gridSub];
 return renderer?renderer(model):pageGridCode(model);
}

function pageEconomic(model){
 const periods=[...model.S.eco].sort((a,b)=>{
  const draftDifference=Number(isEconomicDraft(a))-Number(isEconomicDraft(b));
  return draftDifference||timeToMinutes(a.from)-timeToMinutes(b.from);
 });
 const timelinePeriods=periods.filter(period=>!isEconomicDraft(period));
 const modeLabel=id=>ECONOMIC_MODES.find(item=>item.id===id)?.label||ECONOMIC_MODES[0].label;
 const modeKind=id=>id==="discharge"?"discharge":"charge";
 const segment=period=>{
  const start=timeToMinutes(period.from),end=timeToMinutes(period.to);
  const label=modeLabel(period.mode);
  return `<button class="isw-eco-segment isw-eco-segment--${modeKind(period.mode)}" type="button" style="left:${start/1440*100}%;width:${(end-start)/1440*100}%" data-isw-eco-segment="${period.id}" aria-label="${period.from} to ${period.to}, ${label}"></button>`;
 };
 const periodRow=(period,index)=>`<div class="isw-eco-row" data-isw-eco-row="${period.id}">
  <div class="isw-eco-time-range">
   <div class="isw-eco-field isw-eco-time-range-field wd-edit-field">
    <input class="isw-eco-time-range-input" type="text" value="${period.from} – ${period.to}" data-isw-eco-time-input="${period.id}" aria-label="Period ${index+1} time range, enter 8 digits" inputmode="numeric" spellcheck="false" autocomplete="off">
    <button class="isw-eco-time-range-trigger wd-control-state" type="button" data-isw-eco-time-trigger="${period.id}" aria-label="Open time picker for period ${index+1}" aria-haspopup="dialog"><span class="isw-eco-chevron" data-isw-icon="chevron"></span></button>
   </div>
  </div>
  <span class="isw-select-slot isw-eco-mode-slot" data-isw-eco-mode-select="${period.id}" data-isw-value="${period.mode}"></span>
  <div class="isw-eco-power">
   <label class="isw-eco-field isw-eco-percent-field wd-edit-field">
    <input type="number" min="${ecoPowerRange.min}" max="${ecoPowerRange.max}" step="1" value="${period.powerPct??""}" placeholder="--" data-isw-eco-power="${period.id}" aria-label="Period ${index+1} power percentage">
    <span>%</span>
   </label>
   <span class="isw-eco-kw"><span class="${period.powerPct===null?"isw-eco-placeholder":"isw-eco-kw-value"}">${period.powerPct===null?"--":(period.powerPct*model.PN/100).toFixed(1)}</span> kW</span>
  </div>
  <span class="isw-eco-more-slot" data-isw-eco-more-slot="${period.id}"></span>
 </div>`;
 return `<h2 class="isw-page-title">Economic Schedule</h2>
 <h3 class="isw-group-title">24h Overview</h3>
 <section class="isw-gantt isw-eco-overview">
  <div class="isw-gantt-track isw-eco-track">${timelinePeriods.map(segment).join("")}</div>
  <div class="isw-eco-axis"><span>00:00</span><i></i><span>12:00</span><i></i><span>24:00</span></div>
  <div class="isw-eco-legend">
   <span><i class="isw-eco-legend-dot isw-eco-legend-dot--charge"></i>Charge</span>
   <span><i class="isw-eco-legend-dot isw-eco-legend-dot--discharge"></i>Discharge</span>
   <span><i class="isw-eco-legend-dot isw-eco-legend-dot--general"></i>General Mode</span>
  </div>
 </section>
 <h3 class="isw-group-title">Schedule periods</h3>
 <section class="isw-table isw-eco-table">
  <div class="isw-eco-table-head">
   <span>Time range</span><span>Mode</span>
   <span class="isw-eco-power-head">Power limit <button class="isw-eco-info wd-control-state" type="button" data-isw-eco-info aria-label="Power limit information"><span data-isw-icon="info"></span></button></span>
   <span></span>
  </div>
  <div class="isw-eco-rows">${periods.map(periodRow).join("")}</div>
  <div class="isw-eco-add-row"><span data-isw-eco-add></span></div>
 </section>
 ${note("This schedule belongs to the Economic running mode. Unassigned time uses General Mode. Power is a percentage of the inverter's rated power.")}`;
}

export const WIFI_HOTSPOT_HINT="Disabling this switch stops the inverter hotspot without affecting cloud connection. Re-enabling must be done via cloud or Wi-Fi dongle for reconfiguration.";

function pageNetworking(model){
 const network=model.S.net;
 return `<h2 class="isw-page-title">Networking</h2>
 <h3 class="isw-group-title">Connection</h3>
 <section class="isw-panel">
  ${row("Interface","",seg("net.iface",NETWORK_INTERFACE_OPTIONS,network.iface))}
  ${row("DHCP","Obtain an address automatically",sw("net.dhcp"))}
 </section>
 <h3 class="isw-group-title">Wi-Fi</h3>
 <section class="isw-panel">
  ${row("Inverter Wi-Fi Hotspot",WIFI_HOTSPOT_HINT,sw("net.wifiOn"))}
  ${row("SSID","",textField("net.wifiSsid",network.wifiSsid,"Wi-Fi hotspot SSID"))}
  ${row("Password","",passwordField("net.wifiPassword",network.wifiPassword,"Wi-Fi hotspot password"))}
 </section>
 <h3 class="isw-group-title">Address</h3>
 <section class="isw-table">
  ${tableRow("1fr auto",`<span class="isw-table-symbol">IP address</span>${network.dhcp?copyValue("IP address","192.168.178.97"):readonly("—")}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">Subnet mask</span>${copyValue("Subnet mask","255.255.255.0")}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">Gateway</span>${copyValue("Gateway","192.168.178.1")}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">MAC</span>${copyValue("MAC","B4:3A:28:11:9C:04")}`)}
 </section>
 <h3 class="isw-group-title">Modbus TCP</h3>
 <section class="isw-panel">
  ${row("Modbus TCP","Lets a local EMS read measurements and write dispatch setpoints",sw("net.modbus"))}
  ${network.modbus?row("Port","",mini("net.port",network.port,"",1,0),true):""}
  ${network.modbus?row("Unit ID","",mini("net.unit",network.unit,"",1,0),true):""}
 </section>`;
}

export const MPPT_PARALLEL_HINT="Shares input current across MPPT channels for more energy from parallel PV strings.";

export function mpptGroupLabel(members,activeIndices=null){
 const ordinals=(members||[]).map(index=>{
  const ordinal=activeIndices?activeIndices.indexOf(Number(index)):Number(index);
  return ordinal+1;
 });
 if(!ordinals.length)return "";
 return `MPPT #${ordinals[0]}${ordinals.slice(1).map(value=>` & #${value}`).join("")}`;
}

export function renderMpptScanContent(model,individualMode){
 const mppt=model.S.mppt;
 const activeIndices=model.mpptIndices();
 return individualMode
  ?activeIndices.map((index,displayIndex)=>{
   const item=mppt.individual[index]||{scan:1,interval:30};
   const label=`MPPT #${displayIndex+1}`;
   return `<h3 class="isw-group-title">${label}</h3>
   <section class="isw-panel" data-isw-mppt-shadow="${index}">
    ${row("Enable Shadow Scan","Sweeps the I-V curve to find the global maximum",sw(`mppt.individual.${index}.scan`))}
    ${item.scan?row("Scan interval","",scanIntervalSelect(item.interval,`mppt.individual.${index}.interval`,`${label} scan interval`),true):""}
   </section>`;
  }).join("")
  :`<section class="isw-panel" data-isw-mppt-shadow="all">
   ${row("Shadow scan","Sweeps the I-V curve to find the global maximum",sw("mppt.scan"))}
   ${mppt.scan?row("Scan interval","",scanIntervalSelect(mppt.interval,"mppt.interval","Scan interval"),true):""}
   ${mppt.scan?readonlyDataRow("Last scan","",`<span data-isw-time-minutes="${mppt.lastScanMinutesAgo}"></span>`):""}
  </section>`;
}

function pageMppt(model){
 const mppt=model.S.mppt;
 const options=MPPT_SOURCE_OPTIONS;
 const count=model.capabilities.mpptCount;
 const activeIndices=model.mpptIndices();
 const groups=model.mpptGroups();
 const groupedMembers=groups.reduce((total,group)=>total+group.members.length,0);
 const canAddGroup=mppt.parallel&&count>2&&groups.length>0&&count-groupedMembers>=2;
 const showGroupEditor=mppt.parallel&&count>2;
 const groupRows=groups.map((group,index)=>`<div class="isw-row isw-mppt-group-row" data-isw-mppt-group="${group.id}">
  <div class="isw-row-copy"><div class="isw-row-label">MPPT Group ${index+1}</div></div>
  <div class="isw-mppt-group-control">
   <span class="isw-mppt-group-select-slot" data-isw-mppt-group-select="${group.id}"></span>
   <span class="isw-mppt-more-slot" data-isw-mppt-more="${group.id}"></span>
  </div>
 </div>`).join("");
 const placeholderRow=`<div class="isw-row isw-mppt-group-row is-placeholder" data-isw-mppt-group="draft">
  <div class="isw-row-copy"><div class="isw-row-label">MPPT Group 1</div></div>
  <div class="isw-mppt-group-control">
   <span class="isw-mppt-group-select-slot" data-isw-mppt-group-select="draft"></span>
   <span class="isw-mppt-more-slot" data-isw-mppt-more="draft"></span>
  </div>
 </div>`;
 const individualMode=Number(mppt.scanMode)===1;
 return `<h2 class="isw-page-title">MPPT &amp; Strings</h2>
 <h3 class="isw-group-title">MPPT Input</h3>
 <section class="isw-panel">
  ${mppt.pv.map((value,index)=>row(`MPPT #${index+1}`,"",seg(`mppt.pv.${index}`,options,value),true)).join("")}
 </section>
 <h3 class="isw-group-title">Tracker</h3>
 <section class="isw-panel isw-mppt-panel">
  ${row("Parallel MPPT Operation",MPPT_PARALLEL_HINT,sw("mppt.parallel"))}
  ${showGroupEditor?`<div class="isw-mppt-groups" data-isw-mppt-groups>
   ${groups.length||model.S.mpptPickerOpen?"":`<div class="isw-mppt-group-error" role="alert">At least one MPPT Group must be created</div>`}
   ${groups.length?groupRows:placeholderRow}
   ${canAddGroup?`<div class="isw-mppt-add-row"><span data-isw-mppt-add></span></div>`:""}
  </div>`:""}
 </section>
 <h3 class="isw-group-title">Shadow scan</h3>
 <section class="isw-panel" data-isw-mppt-scan-mode>
  ${row("Control Mode","All MPPTs Control applies the same scan setting to every MPPT. Individual Control configures each present MPPT separately.",seg("mppt.scanMode",["All MPPTs Control","Individual Control"],mppt.scanMode),true)}
 </section>
 <div class="isw-mppt-shadow-region" data-isw-mppt-shadow-region="all" data-isw-surface-key="mppt-shadow-all"${individualMode?' hidden inert aria-hidden="true"':""}>
  ${renderMpptScanContent(model,false)}
 </div>
 <div class="isw-mppt-shadow-region" data-isw-mppt-shadow-region="individual" data-isw-surface-key="mppt-shadow-individual"${individualMode?'':' hidden inert aria-hidden="true"'}>
  ${renderMpptScanContent(model,true)}
 </div>
 ${note("Set each input to the source that is wired to it, and leave the unused inputs on None. Check the string configuration again after any change to the array.")}`;
}

function pageCt(model){
 const ct=model.S.ct;
 const status=value=>value==="ok"?`<span class="isw-status isw-status--success"><i></i>Correct</span>`:value==="rev"?`<span class="isw-status isw-status--warning"><i></i>Reversed</span>`:`<span class="isw-status isw-status--idle"><i></i>Not checked</span>`;
 return `<h2 class="isw-page-title">CT Detection</h2>
 <h3 class="isw-group-title">CT Self-check</h3>
 <section class="isw-panel">
  ${row("Current Mode","Selects whether grid current is measured from the meter or the CT clamps",seg("ctCurrentMode",CT_CURRENT_MODE_OPTIONS,model.S.ctCurrentMode),true)}
 ${row("Direction check","Checks each phase clamp for a reversed installation",actionButton(ct.running?"Checking...":"Run check","ctRun","primary",ct.running))}
 </section>
 <h3 class="isw-group-title">Result</h3>
 <section class="isw-table isw-table--readonly-data">
  ${tableRow("1fr auto",`<span class="isw-table-symbol">L1</span>${status(ct.l1)}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">L2</span>${status(ct.l2)}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">L3</span>${status(ct.l3)}`)}
  ${tableRow("1fr auto",`<span class="isw-table-symbol">Last check</span><span data-isw-time-minutes="${ct.lastMinutesAgo}"></span>`)}
 </section>
 ${ct.l3==="rev"?note("L3 reads a reversed direction. Flip the clamp on L3, or swap its two signal leads, then run the check again. Readings on that phase stay unreliable until the check passes."):note("Run the check again after any change to the clamps or to their wiring.")}`;
}

function pageOperations(model){
 const operations=model.S.ops;
 return `<h2 class="isw-page-title">Operation Control</h2>
 <section class="isw-panel">
 ${row("Inverter",operations.running?"Connected to the grid":"Stopped",actionButton(operations.running?"Power off":"Power on","power",operations.running?"warning":"primary"))}
 ${row("Faults",operations.faults?`${operations.faults} active`:"None active",actionButton("Clear faults","clear","neutral",!operations.faults))}
 ${row("Restart","Reboots the control board and interrupts generation",actionButton("Restart","restart","warning"))}
 </section>
 <h3 class="isw-group-title">Reset</h3>
 <section class="isw-panel">${row("Reset &amp; Recovery","Restore selected settings or return the inverter to its initial setup state",actionButton("Open","resetRecovery","neutral"))}</section>
 ${note("Power off and restart interrupt generation. Reset &amp; Recovery opens the controlled recovery flow without changing the grid code or protection settings until a reset is confirmed.")}`;
}

function pageExport(model){
 const exp=model.S.exp;
 return `<h2 class="isw-page-title">Parameter Export</h2>
 <h3 class="isw-group-title">Format</h3>
 <section class="isw-panel">${row("File format","",seg("exp.fmt",EXPORT_FORMAT_OPTIONS,exp.fmt))}</section>
 <h3 class="isw-group-title">Contents</h3>
 <section class="isw-panel">
  ${row("Operating parameters","Running mode, battery, power control",sw("exp.oper"))}
  ${row("Grid &amp; protection","Grid code and all protection settings",sw("exp.grid"))}
  ${row("Operation log","Every change with operator and timestamp",sw("exp.log"))}
 </section>
 <section class="isw-panel">${row("Export",`Serial Z112500204830294 · ${formatAbsoluteDate(new Date(2026,10,17))}`,actionButton("Export","export","primary"))}</section>`;
}

function pageLog(model){
 return `<h2 class="isw-page-title">Operation Log</h2>
 <section class="isw-table isw-log-table">
  ${tableHead("112px minmax(0,1fr) 112px","<span>Time</span><span>Change</span><span class=\"isw-align-right\">Operator</span>","isw-log-table-head")}
  ${model.S.log.map(entry=>`<div class="isw-log-row">
   <span class="isw-log-time-slot" data-isw-log-minutes="${entry.minutesAgo}"></span>
   <span class="isw-log-changes">${entry.changes.map(change=>`<span class="isw-log-change-line"><span class="isw-log-parameter">${change.parameter}</span> <b>${change.from}</b><span class="isw-log-arrow" aria-hidden="true">→</span><b>${change.to}</b></span>`).join("")}</span>
   <button class="isw-log-operator wd-control-state" type="button" data-isw-log-operator data-isw-email="${entry.operator.email}" data-isw-name="${entry.operator.name}" aria-label="${entry.operator.name} — show account email">${entry.operator.name}</button>
  </div>`).join("")}
 </section>
 ${note("Grid &amp; protection changes record the Check code holder who unlocked the section.")}`;
}

function pageGridCode(model){
 const profile=model.prof();
 const statusMeta={done:["Certified","success"],cert:["In certification","warning"],plan:["Planned","idle"],generic:["Generic","idle"]};
 const profileRow=([key,item])=>{
  const [status,tone]=statusMeta[item.status];
  return `<button class="isw-profile-row${model.S.gridCode===key?" is-selected":""}${item.p?"":" is-disabled"}" type="button" ${item.p?`data-isw-profile="${key}"`:"disabled"}>
   <i class="isw-radio-mark" aria-hidden="true"></i>
   <span class="isw-profile-copy"><span class="isw-profile-name">${item.label}</span><span class="isw-profile-full">${item.full}</span></span>
   <span class="isw-status isw-status--${tone}"><i></i>${item.p?status:"No parameter set"}</span>
  </button>`;
 };
 const entries=Object.entries(model.GRID_PROFILES);
 const selectable=entries.filter(([,item])=>item.p).map(profileRow).join("");
 const planned=entries.filter(([,item])=>!item.p);
 const deviations=model.devCount();
 return `<h2 class="isw-page-title">Grid Code</h2>
 <section class="isw-panel isw-panel--narrow">
  ${readonlyDataRow("Active profile",profile.full,profile.label)}
  ${profile.enum!==null?readonlyDataRow("Certification standard register","15000 Certification_Standard",profile.enum):""}
  ${profile.p?readonlyDataRow("Values changed from the profile","",deviations||"None"):""}
 </section>
 ${deviations?`<section class="isw-table isw-table--narrow">
  ${tableHead("1fr 150px","<span>Changed value</span><span class=\"isw-align-right\">Page</span>")}
  ${model.devList().map(item=>tableRow("1fr 150px",`<span class="isw-table-symbol">${item.label}</span><span class="isw-table-symbol isw-align-right">${item.page}</span>`)).join("")}
 </section>`:""}
 ${deviations?`<section class="isw-panel isw-panel--narrow">${row("Reload the profile","Restores every protection, reconnection and curve value to the certified default",actionButton(`Reload ${profile.label}`,"reload"))}</section>`:""}
 <h3 class="isw-group-title">Select a profile</h3>
 <section class="isw-profile-list">${selectable}</section>
 ${planned.length?`<h3 class="isw-group-title">On the roadmap — not in this firmware</h3>
 <section class="isw-profile-list isw-profile-list--flat">${planned.map(profileRow).join("")}</section>
 ${note("These markets are identified and the standard is named, but no parameter set ships for them in this firmware, so they cannot be selected. Selecting one would leave the unit with no certified configuration.",true)}`:""}
 ${profile.p?note("Changing the profile reloads every protection limit, the reconnection window and all curves from the new country profile, and discards hand-edited values.",true):note("This country is on the certification roadmap. No parameter set ships in this firmware, so the grid pages stay empty until a certified profile exists. Selecting it does not configure the unit.",true)}`;
}

function stages(model,keys,descending){
 const live=keys.filter(item=>model.has(item.value));
 const sorted=live.slice().sort((left,right)=>descending?model.S.g[right.value]-model.S.g[left.value]:model.S.g[left.value]-model.S.g[right.value]);
 const rank=new Map(sorted.map((item,index)=>[item.value,index]));
 return live.map(item=>({...item,symbol:item.character.repeat(live.length-rank.get(item.value))}));
}

function pageProtection(model){
 if(!model.prof().p)return `<h2 class="isw-page-title">Protection Limits</h2>${noProfile(model)}`;
 const G=model.S.g;
 const columns="140px 54px 1fr 1fr";
 const overTenLive=model.has("ov10")&&G.ov10on;
 const allOver=stages(model,[
  {value:"ov1",time:"ov1t",number:1},{value:"ov2",time:"ov2t",number:2},{value:"ov3",time:"ov3t",number:3},
  ...(overTenLive?[{value:"ov10",time:"ov10t",number:0}]:[])
 ].map(item=>({...item,character:">",label:"Overvoltage"})),true);
 const over=allOver.filter(item=>item.value!=="ov10");
 const tenSymbol=(allOver.find(item=>item.value==="ov10")||{}).symbol;
 const under=stages(model,[
  {value:"uv1",time:"uv1t",number:1},{value:"uv2",time:"uv2t",number:2},{value:"uv3",time:"uv3t",number:3}
 ].map(item=>({...item,character:"<",label:"Undervoltage"})),false);
 const overFrequency=stages(model,[
  {value:"of1",time:"of1t",number:1},{value:"of2",time:"of2t",number:2}
 ].map(item=>({...item,character:">",label:"Overfrequency"})),true);
 const underFrequency=stages(model,[
  {value:"uf1",time:"uf1t",number:1},{value:"uf2",time:"uf2t",number:2}
 ].map(item=>({...item,character:"<",label:"Underfrequency"})),false);
 const shown=[];
 const protectionRow=(stage,unitName="V",valueStep=.5,valueDecimals=1)=>{
  shown.push(stage.value);
  if(model.has(stage.time))shown.push(stage.time);
  const timeFormat=model.tfmt(stage.time);
  const symbol=(unitName==="Hz"?"f":"U")+stage.symbol;
  const label=(over.length>1||under.length>1||overFrequency.length>1||underFrequency.length>1)
   ?`${stage.label} stage ${stage.number}`:stage.label;
  const markup=tableRow(columns,`<span class="isw-table-symbol">${label}</span><span class="isw-table-symbol">${symbol}</span>
   ${mini(`g.${stage.value}`,G[stage.value],unitName,valueStep,valueDecimals)}
   ${model.has(stage.time)?mini(`g.${stage.time}`,G[stage.time],"s",timeFormat.step,timeFormat.decimals??timeFormat.dec):`<span class="isw-table-symbol isw-align-right">—</span>`}`);
  return model.dev(stage.value)||model.dev(stage.time)?stateMark(markup):markup;
 };
 const duplicates=[];
 [over,under,overFrequency,underFrequency].forEach(group=>{
  for(let first=0;first<group.length;first+=1){
   for(let second=first+1;second<group.length;second+=1){
    if(G[group[first].value]===G[group[second].value]&&G[group[first].time]===G[group[second].time])duplicates.push(group[first].label);
   }
  }
 });
 const rocofWithoutEnable=model.has("rocof")&&!model.has("rocofOn");
 return `<h2 class="isw-page-title">Protection Limits</h2>
 <section class="isw-table isw-table--narrow">
  ${tableHead(columns,'<span>Function</span><span></span><span>Setting</span><span>Trip time</span>',"isw-eco-table-head")}
  ${over.slice().sort((left,right)=>G[right.value]-G[left.value]).map(item=>protectionRow(item)).join("")}
  ${under.slice().sort((left,right)=>G[right.value]-G[left.value]).map(item=>protectionRow(item)).join("")}
  ${overFrequency.map(item=>protectionRow(item,"Hz",.01,2)).join("")}
  ${underFrequency.map(item=>protectionRow(item,"Hz",.01,2)).join("")}
 </section>
 ${duplicates.length?note(`Two ${duplicates[0].toLowerCase()} stages carry the same setting and the same trip time in this profile. One of them has no effect. Check the point table before commissioning.`,true):""}
 ${model.has("ov10")?`<h3 class="isw-group-title">10-minute mean overvoltage${tenSymbol?` — U${tenSymbol}`:""}</h3>
 <section class="isw-panel isw-panel--narrow">
  ${shown.push("ov10on","ov10","ov10t"),""}
  ${model.dev("ov10on")?stateMark(row("10-minute mean protection","Trips on the 10-minute moving average, independently of the stages above",sw("g.ov10on"))):row("10-minute mean protection","Trips on the 10-minute moving average, independently of the stages above",sw("g.ov10on"))}
  ${G.ov10on?(model.dev("ov10")?stateMark(row("Setting","",mini("g.ov10",G.ov10,"V",.5),true)):row("Setting","",mini("g.ov10",G.ov10,"V",.5),true)):""}
  ${G.ov10on&&model.has("ov10t")?(model.dev("ov10t")?stateMark(row("Trip time","",mini("g.ov10t",G.ov10t,"s",model.tfmt("ov10t").step,model.tfmt("ov10t").dec),true)):row("Trip time","",mini("g.ov10t",G.ov10t,"s",model.tfmt("ov10t").step,model.tfmt("ov10t").dec),true)):""}
 </section>
 ${!G.ov10on?note("This profile ships the 10-minute mean protection switched off. Several European grid codes require it, so confirm against the one in force before handover.",true):""}`:""}
 ${model.has("rocof")?`<h3 class="isw-group-title">Rate of change of frequency</h3>
 <section class="isw-panel isw-panel--narrow">
  ${shown.push("rocofOn","rocof","rocoft"),""}
  ${rocofWithoutEnable?"":row("df/dt protection","",sw("g.rocofOn"))}
  ${rocofWithoutEnable||G.rocofOn?(model.dev("rocof")?stateMark(row("Threshold","",mini("g.rocof",G.rocof,"Hz/s",.1,2),true)):row("Threshold","",mini("g.rocof",G.rocof,"Hz/s",.1,2),true)):""}
  ${(rocofWithoutEnable||G.rocofOn)&&model.has("rocoft")?(model.dev("rocoft")?stateMark(row("Trip time","",mini("g.rocoft",G.rocoft,"s",model.tfmt("rocoft").step,model.tfmt("rocoft").dec),true)):row("Trip time","",mini("g.rocoft",G.rocoft,"s",model.tfmt("rocoft").step,model.tfmt("rocoft").dec),true)):""}
 </section>
 ${rocofWithoutEnable?note("This profile carries a df/dt threshold and trip time but no enable state, so whether the function runs is decided by the firmware and cannot be read or set here.",true):""}`:""}
 ${model.has("islandOn")?`<h3 class="isw-group-title">Loss of mains</h3>
 <section class="isw-panel isw-panel--narrow">${shown.push("islandOn"),""}${model.dev("islandOn")?stateMark(row("Islanding protection","Disconnects when the grid supply is lost",sw("g.islandOn"))):row("Islanding protection","Disconnects when the grid supply is lost",sw("g.islandOn"))}</section>
 ${!G.islandOn?note("Islanding protection is switched off in this profile.",true):""}`:""}
 ${(()=>{
  const count=model.devHere(shown);
 return count?note(`<b>${count} ${count>1?"values on this page deviate":"value on this page deviates"}</b> from the ${model.prof().label} profile. The grid operator accepts only the certified set unless it has approved the change in writing.`,true)
   :note("Trip time is the window during which the condition must be continuously met, not a delay after detection. The symbols follow the order of the stages this profile actually configures, which is not always the numbering the national standard uses.",true);
 })()}`;
}

function pageConnection(model){
 if(!model.prof().p)return `<h2 class="isw-page-title">Grid Connection</h2>${noProfile(model)}`;
 const G=model.S.g;
 const shown=[];
 const windowRow=(label,key,unitName,step=.5,decimals=1)=>{
  if(!model.has(key))return "";
  shown.push(key);
  const markup=tableRow("1fr 128px",`<span class="isw-table-symbol">${label}</span>${num(`g.${key}`,G[key],unitName,step,decimals)}`);
  return model.dev(key)?stateMark(markup):markup;
 };
 const field=(label,hint,key,unitName,step=.5,decimals=1)=>{
  if(!model.has(key))return "";
  shown.push(key);
  const markup=row(label,hint,mini(`g.${key}`,G[key],unitName,step,decimals),true);
  return model.dev(key)?stateMark(markup):markup;
 };
 return `<h2 class="isw-page-title">Grid Connection</h2>
 <h3 class="isw-group-title">Reconnection window — after a protection trip</h3>
 <section class="isw-table isw-table--narrow">
  ${windowRow("Voltage upper","rcVmax","V")}${windowRow("Voltage lower","rcVmin","V")}
  ${windowRow("Frequency upper","rcFmax","Hz",.01,2)}${windowRow("Frequency lower","rcFmin","Hz",.01,2)}
 </section>
 <section class="isw-panel isw-panel--narrow">
  ${field("Reconnection delay","The grid must stay inside the window above for this long before the unit reconnects","rcDelay","s",5,0)}
  ${field("Power gradient after a fault","Rate at which output ramps back up on reconnection","rampFault","%Pn/min",1)}
 </section>
 <h3 class="isw-group-title">Start-up window — after a normal power-up</h3>
 <section class="isw-table isw-table--narrow">
  ${windowRow("Voltage upper","suVmax","V")}${windowRow("Voltage lower","suVmin","V")}
  ${windowRow("Frequency upper","suFmax","Hz",.01,2)}${windowRow("Frequency lower","suFmin","Hz",.01,2)}
 </section>
 <section class="isw-panel isw-panel--narrow">
  ${field("Start-up delay","The grid must stay inside the window above for this long after a normal power-up","suDelay","s",5,0)}
  ${field("Power gradient at start-up","","rampStart","%Pn/min",1)}
  ${field("Power gradient in normal operation","Applies to every other change of output","rampNorm","%Pn/min",1)}
  ${model.has("rampMode")?(shown.push("rampMode"),model.dev("rampMode")?stateMark(row("Power change","A step change ignores the gradients above",seg("g.rampMode",POWER_CHANGE_OPTIONS,G.rampMode),true)):row("Power change","A step change ignores the gradients above",seg("g.rampMode",POWER_CHANGE_OPTIONS,G.rampMode),true)):""}
 </section>
 ${model.has("rampMode")&&!G.rampMode?note("Power change is set to step, so none of the three gradients above has any effect.",true):""}
 ${(()=>{
  const count=model.devHere(shown);
  return count?note(`<b>${count} ${count>1?"values on this page deviate":"value on this page deviates"}</b> from the ${model.prof().label} profile.`,true)
   :note("The reconnection window and the start-up window are separate. A unit may be allowed to start into a quiet grid on terms that do not apply after a trip. Both delays are observation windows: the grid must stay inside the window for the whole time, not merely return to it.",true);
 })()}`;
}

function reactivePlot(model,indexes){
 const G=model.S.g;
 const voltages=indexes.map(index=>G[`quV${index}`]);
 const reactive=indexes.map(index=>G[`quQ${index}`]);
 const minVoltage=Math.min(...voltages)-6;
 const maxVoltage=Math.max(...voltages)+6;
 const maxQ=Math.max(10,...reactive.map(value=>Math.abs(value)))*1.2;
 const x=value=>34+((value-minVoltage)/(maxVoltage-minVoltage))*352;
 const y=value=>66-(value/maxQ)*54;
 const points=indexes.map(index=>`${x(G[`quV${index}`]).toFixed(1)},${y(G[`quQ${index}`]).toFixed(1)}`).join(" ");
 return `<section class="isw-plot"><svg viewBox="0 0 400 132" preserveAspectRatio="none" role="img" aria-label="Q(U) characteristic">
  <line class="isw-plot-axis" x1="34" y1="120" x2="392" y2="120"></line>
  <line class="isw-plot-axis" x1="34" y1="8" x2="34" y2="120"></line>
  <line class="isw-plot-guide" x1="34" y1="66" x2="392" y2="66"></line>
  <polyline class="isw-plot-line" points="${points}"></polyline>
  ${indexes.map(index=>`<circle class="isw-plot-point" cx="${x(G[`quV${index}`]).toFixed(1)}" cy="${y(G[`quQ${index}`]).toFixed(1)}" r="3.4"></circle>`).join("")}
  <text x="0" y="15">+${maxQ.toFixed(0)}%</text><text x="2" y="69">0</text><text x="0" y="118">−${maxQ.toFixed(0)}%</text>
  <text x="${(x(voltages[0])-16).toFixed(1)}" y="131">${voltages[0].toFixed(1)} V</text>
  <text x="${(x(voltages[voltages.length-1])-16).toFixed(1)}" y="131">${voltages[voltages.length-1].toFixed(1)} V</text>
 </svg></section>`;
}

function pageReactive(model){
 if(!model.prof().p)return `<h2 class="isw-page-title">Reactive Power</h2>${noProfile(model)}`;
 const G=model.S.g;
 const leads=["No reactive power regulation is applied","The inverter holds a fixed reactive power setpoint","The inverter holds a fixed power factor, so reactive power tracks active power","Reactive power follows the grid voltage along the Q(U) curve","Power factor follows active power along the cos φ(P) curve","Reactive power follows active power along the Q(P) curve","Power factor follows the grid voltage along the cos φ(U) curve"];
 const mode=G.reacMode===undefined?0:G.reacMode;
 const qu=[1,2,3,4].filter(index=>model.hasAll(`quV${index}`,`quQ${index}`));
 const cp=[1,2,3,4].filter(index=>model.hasAll(`cpP${index}`,`cpF${index}`));
 const qp=[1,2,3,4].filter(index=>model.hasAll(`P_Q_Discharge_P${index}`,`P_Q_Discharge_Q${index}`));
 const upf=[1,2,3,4].filter(index=>model.hasAll(`upfV${index}`,`upfF${index}`));
  const limits=REACTIVE_LIMIT_OPTIONS;
 const showQuControls=model.hasAll("quEnterP","quExitP")||model.has("quExitP")||model.has("quMinPF")||model.has("quLimit");
 const control=`<span class="isw-select-slot isw-reac-mode-slot" data-isw-reac-mode-select="${mode}"></span>`;
 return `<h2 class="isw-page-title">Reactive Power</h2>
 <section class="isw-panel isw-panel--narrow">
  ${model.dev("reacMode")?stateMark(row("Control mode",leads[mode],control)):row("Control mode",leads[mode],control)}
 </section>
 ${mode===1?`<h3 class="isw-group-title">Fixed reactive power</h3><section class="isw-panel isw-panel--narrow">${row("Setpoint","Positive is over-excited, negative is under-excited",num("reacQSet",model.S.reacQSet,"%Sn",1),true)}</section>`:""}
 ${mode===2?`<h3 class="isw-group-title">Fixed power factor</h3><section class="isw-panel isw-panel--narrow">${row("cos φ","",num("reacPFSet",model.S.reacPFSet,"",.01,2),true)}</section>`:""}
 ${mode===3&&qu.length?`<h3 class="isw-group-title">Q(U) characteristic</h3>
 ${reactivePlot(model,qu)}
 <section class="isw-table isw-table--narrow isw-point-table">
  ${tableHead("70px 1fr 1fr",'<span>Point</span><span class="isw-align-right">Voltage</span><span class="isw-align-right">Reactive power</span>',"isw-quiet-table-head")}
  ${qu.map(index=>{const markup=tableRow("70px 1fr 1fr",`<span class="isw-table-symbol">V${index}</span>${mini(`g.quV${index}`,G[`quV${index}`],"V",.5)}${mini(`g.quQ${index}`,G[`quQ${index}`],"%Sn",1,1)}`);return model.dev(`quV${index}`)||model.dev(`quQ${index}`)?stateMark(markup):markup;}).join("")}
 </section>
 ${(()=>{const values=qu.map(index=>G[`quV${index}`]);return values.some((value,index)=>index&&value<=values[index-1])?note(`The voltage points are not in ascending order, so the curve folds back on itself. Put V1 … V${qu.length} in increasing voltage order.`,true):note("A positive reactive power value is over-excited and a negative value is under-excited. The points must stay in ascending voltage order.",true);})()}
 ${showQuControls?`<section class="isw-panel isw-panel--narrow">
  ${model.hasAll("quEnterP","quExitP")?row("Activation threshold","Q(U) engages above this active power and releases below the exit value",num("g.quEnterP",G.quEnterP,"%Pn",1,0),true):""}
  ${model.has("quExitP")?row("Release threshold","",num("g.quExitP",G.quExitP,"%Pn",1,0),true):""}
  ${model.has("quMinPF")?row("Minimum cos φ","Caps how far the curve may displace the power factor",num("g.quMinPF",G.quMinPF,"",.01,2),true):""}
  ${model.has("quLimit")?row("Limits in force","Which of the two limits above the curve actually respects",seg("g.quLimit",limits,G.quLimit),true):""}
 </section>`:""}
 ${model.has("quLimit")&&G.quLimit===0?note("Limits in force is set to none, so neither the activation thresholds nor the minimum cos φ above has any effect on the curve.",true):""}`:""}
 ${mode===4&&cp.length?`<h3 class="isw-group-title">cos φ(P) characteristic</h3>
 <section class="isw-table isw-table--narrow isw-point-table">
  ${tableHead("70px 1fr 1fr",'<span>Point</span><span class="isw-align-right">Active power</span><span class="isw-align-right">cos φ</span>',"isw-quiet-table-head")}
  ${cp.map(index=>tableRow("70px 1fr 1fr",`<span class="isw-table-symbol">P${index}</span>${mini(`g.cpP${index}`,G[`cpP${index}`],"%Pn",5,0)}${mini(`g.cpF${index}`,G[`cpF${index}`],"",.01,2)}`)).join("")}
 </section>
 ${note("A negative cos φ is under-excited. "+(model.has("cpTau")?"The curve responds with the time constant below.":""),true)}`:""}
 ${mode===5&&qp.length?`<h3 class="isw-group-title">Q(P) characteristic</h3>
 <section class="isw-table isw-table--narrow isw-point-table">
  ${tableHead("70px 1fr 1fr",'<span>Point</span><span class="isw-align-right">Active power</span><span class="isw-align-right">Reactive power</span>',"isw-quiet-table-head")}
  ${qp.map(index=>tableRow("70px 1fr 1fr",`<span class="isw-table-symbol">P${index}</span>${mini(`g.P_Q_Discharge_P${index}`,G[`P_Q_Discharge_P${index}`],"%Pn",5,0)}${mini(`g.P_Q_Discharge_Q${index}`,G[`P_Q_Discharge_Q${index}`],"%Sn",1,1)}`)).join("")}
 </section>
 ${note("These points apply while the unit is discharging.",true)}`:""}
 ${mode===6&&upf.length?`<h3 class="isw-group-title">cos φ(U) characteristic</h3>
 <section class="isw-table isw-table--narrow isw-point-table">
  ${tableHead("70px 1fr 1fr",'<span>Point</span><span class="isw-align-right">Voltage</span><span class="isw-align-right">cos φ</span>',"isw-quiet-table-head")}
  ${upf.map(index=>tableRow("70px 1fr 1fr",`<span class="isw-table-symbol">V${index}</span>${mini(`g.upfV${index}`,G[`upfV${index}`],"V",.5)}${mini(`g.upfF${index}`,G[`upfF${index}`],"",.01,2)}`)).join("")}
 </section>
 ${note(`A negative cos φ is under-excited. Among the European profiles only ${model.prof().label} configures this curve.`,true)}`:""}
 ${mode>0?`<section class="isw-panel isw-panel--narrow">
  ${model.has("reacTau")?markedRow(model,"reacTau","Time constant","First-order response time of the reactive power loop",num("g.reacTau",G.reacTau,"s",G.reacTau<1?.01:.5,G.reacTau<1?2:1),true):""}
  ${model.hasAll("lockIn","lockOut")?markedRow(model,"lockIn","Lock-in voltage","Reactive support engages above this voltage",num("g.lockIn",G.lockIn,"V",.5),true):""}
  ${model.has("lockOut")?markedRow(model,"lockOut","Lock-out voltage","and releases below this one",num("g.lockOut",G.lockOut,"V",.5),true):""}
 </section>`:""}`;
}

function pagePu(model){
 if(!model.prof().p)return `<h2 class="isw-page-title">P(U) Characteristics</h2>${noProfile(model)}`;
 const G=model.S.g;
 const enabled=G.puOn;
 const canHigh=model.hasAll("puV1","puV2");
 const canLow=model.hasAll("puUV1","puUV2");
 const high=Boolean(enabled&1)&&canHigh;
 const low=Boolean(enabled&2)&&canLow;
  const options=canLow?P_U_MODE_OPTIONS:P_U_MODE_OPTIONS.slice(0,2);
 const values=(high?[G.puV1,G.puV2]:[]).concat(low?[G.puUV1,G.puUV2]:[]).concat(high||low?[]:[G.puV1,G.puV2]);
 const minVoltage=Math.min(...values)-8;
 const maxVoltage=Math.max(...values)+8;
 const x=value=>34+((value-minVoltage)/(maxVoltage-minVoltage))*352;
 const y=percent=>106-(percent/100)*94;
 const knees=[];
 if(low)knees.push([x(G.puUV2),y(G.puUP2)],[x(G.puUV1),y(G.puUP1)]);
 if(high)knees.push([x(G.puV1),y(G.puP1)],[x(G.puV2),y(G.puP2)]);
 const labels=low&&high?[G.puUV2,G.puV2]:low?[G.puUV2,G.puUV1]:[G.puV1,G.puV2];
 const points=knees.length?[[34,knees[0][1]],...knees,[392,knees[knees.length-1][1]]].map(pair=>`${pair[0].toFixed(1)},${pair[1].toFixed(1)}`).join(" "):"";
 const plot=enabled&&knees.length?`<section class="isw-plot"><svg viewBox="0 0 400 132" preserveAspectRatio="none" role="img" aria-label="P(U) characteristic">
  <line class="isw-plot-axis" x1="34" y1="106" x2="392" y2="106"></line><line class="isw-plot-axis" x1="34" y1="8" x2="34" y2="106"></line>
  <line class="isw-plot-guide" x1="34" y1="12" x2="392" y2="12"></line><polyline class="isw-plot-line" points="${points}"></polyline>
  ${knees.map(pair=>`<circle class="isw-plot-point" cx="${pair[0].toFixed(1)}" cy="${pair[1].toFixed(1)}" r="3.4"></circle>`).join("")}
  <text x="2" y="15">100%</text><text x="14" y="109">0%</text>
  ${labels.map(value=>`<text x="${(x(value)-16).toFixed(1)}" y="124">${value.toFixed(1)} V</text>`).join("")}
 </svg></section>`:"";
 return `<h2 class="isw-page-title">P(U) Characteristics</h2>
 <section class="isw-panel isw-panel--narrow">${markedRow(model,"puOn","Voltage-dependent active power","Which side of the voltage band adjusts active power",seg("g.puOn",options,enabled))}</section>
 ${plot}
 ${high?`<h3 class="isw-group-title">Overvoltage side</h3><section class="isw-panel isw-panel--narrow">
  ${markedRow(model,"puV1","Start voltage","Derating begins here",mini("g.puV1",G.puV1,"V",.5),true)}
  ${markedRow(model,"puV2","End voltage","Output reaches the end power here",mini("g.puV2",G.puV2,"V",.5),true)}
  ${markedRow(model,"puP1","Power at start","",mini("g.puP1",G.puP1,"%Pn",5,0),true)}
  ${markedRow(model,"puP2","Power at end","",mini("g.puP2",G.puP2,"%Pn",5,0),true)}
 </section>`:""}
 ${low?`<h3 class="isw-group-title">Undervoltage side</h3><section class="isw-panel isw-panel--narrow">
  ${markedRow(model,"puUV1","Start voltage","Output is raised below this voltage",mini("g.puUV1",G.puUV1,"V",.5),true)}
  ${markedRow(model,"puUV2","End voltage","",mini("g.puUV2",G.puUV2,"V",.5),true)}
  ${markedRow(model,"puUP1","Power at start","",mini("g.puUP1",G.puUP1,"%Pn",5,0),true)}
  ${markedRow(model,"puUP2","Power at end","",mini("g.puUP2",G.puUP2,"%Pn",5,0),true)}
 </section>`:""}
 ${model.has("puTau")?`<section class="isw-panel isw-panel--narrow">${markedRow(model,"puTau","Time constant","First-order response time of the derating loop",mini("g.puTau",G.puTau,"s",.5),true)}</section>`:""}
 ${(()=>{if(!high)return "";const collisions=[];if(model.has("ov1")&&G.puV1>=G.ov1)collisions.push(["the lowest overvoltage stage",G.ov1]);if(model.has("ov10")&&G.ov10on&&G.puV1>=G.ov10)collisions.push(["the 10-minute mean overvoltage",G.ov10]);return collisions.length?note(`The start voltage (${G.puV1.toFixed(1)} V) is at or above ${collisions[0][0]} (${collisions[0][1].toFixed(1)} V). Derating exists to keep the voltage below that trip, and at this setting it will never act in time.`,true):"";})()}`;
}

function pageFrequency(model){
 if(!model.prof().p)return `<h2 class="isw-page-title">Frequency-Watt (F-P)</h2>${noProfile(model)}`;
 const G=model.S.g;
  const references=F_P_REFERENCE_OPTIONS;
 const endPower=model.has("ofpStart")&&model.has("ofpEnd")&&model.has("ofpDroop")?Math.min(100,(G.ofpEnd-G.ofpStart)*G.ofpDroop):null;
 const badExit=G.ofpExitMode&&model.has("ofpExitF")&&model.has("ofpStart")&&G.ofpExitF>G.ofpStart;
 return `<h2 class="isw-page-title">Frequency-Watt (F-P)</h2>
 ${note("Frequency-Watt overrides the active power dispatch setpoint while it is acting. The export limit is never overridden.",true)}
 ${model.has("ofpStart")?`<h3 class="isw-group-title">Overfrequency — power reduction (LFSM-O)</h3><section class="isw-panel isw-panel--narrow">
  ${markedRow(model,"ofpOn","Reduce power above the start frequency",G.ofpOn?"":"Required by most European grid codes, but shipped off in this profile",sw("g.ofpOn"))}
  ${G.ofpOn?markedRow(model,"ofpStart","Start frequency","Reduction begins here",mini("g.ofpStart",G.ofpStart,"Hz",.01,3),true):""}
  ${G.ofpOn&&model.has("ofpEnd")?markedRow(model,"ofpEnd","End frequency",`The upper end of the droop line${endPower!==null?`. At this frequency the droop has removed ${endPower.toFixed(0)}% of rated power`:""}`,mini("g.ofpEnd",G.ofpEnd,"Hz",.01,3),true):""}
  ${G.ofpOn&&model.has("ofpDroop")?markedRow(model,"ofpDroop","Droop","Power reduction per hertz above the start frequency",mini("g.ofpDroop",G.ofpDroop,"%Pn/Hz",1),true):""}
  ${G.ofpOn&&model.has("ofpDelay")?row("Response delay","",mini("g.ofpDelay",G.ofpDelay,"s",model.tfmt("ofpDelay").step,model.tfmt("ofpDelay").dec),true):""}
  ${G.ofpOn&&model.has("ofpRef")?row("Reduction is measured from","The reference the droop is applied to",seg("g.ofpRef",references,G.ofpRef),true):""}
  ${G.ofpOn&&model.has("ofpExitMode")?row("Automatic release","Lets the reduction release on its own once the frequency recovers",sw("g.ofpExitMode"),true):""}
  ${G.ofpOn&&G.ofpExitMode&&model.has("ofpExitF")?row("Release frequency","Reduction releases once the frequency falls below this value",mini("g.ofpExitF",G.ofpExitF,"Hz",.01,3),true):""}
  ${G.ofpOn&&G.ofpExitMode&&model.has("ofpExitT")?row("Release hold time","The release condition must hold for this long",mini("g.ofpExitT",G.ofpExitT,"s",1,0),true):""}
  ${G.ofpOn&&model.has("ofpRecover")?row("Recovery gradient","Rate at which output returns after the release",mini("g.ofpRecover",G.ofpRecover,"%Pn/min",1),true):""}
 </section>`:""}
 ${model.has("ufpStart")?`<h3 class="isw-group-title">Underfrequency — power increase (LFSM-U)</h3><section class="isw-panel isw-panel--narrow">
  ${markedRow(model,"ufpOn","Raise power below the start frequency","Needs headroom: a unit already at full output has nothing left to raise",sw("g.ufpOn"))}
  ${G.ufpOn?row("Start frequency","The increase begins below this value",mini("g.ufpStart",G.ufpStart,"Hz",.01,3),true):""}
  ${G.ufpOn&&model.has("ufpEnd")?row("End frequency","Output reaches its maximum here",mini("g.ufpEnd",G.ufpEnd,"Hz",.01,3),true):""}
  ${G.ufpOn&&model.has("ufpDroop")?row("Droop","Power increase per hertz below the start frequency",mini("g.ufpDroop",G.ufpDroop,"%Pn/Hz",1),true):""}
  ${G.ufpOn&&model.has("ufpDelay")?row("Response delay","",mini("g.ufpDelay",G.ufpDelay,"s",model.tfmt("ufpDelay").step,model.tfmt("ufpDelay").dec),true):""}
  ${G.ufpOn&&model.has("ufpExitT")?row("Release hold time","",mini("g.ufpExitT",G.ufpExitT,"s",1,0),true):""}
  ${G.ufpOn&&model.has("ufpRecover")?row("Recovery gradient","",mini("g.ufpRecover",G.ufpRecover,"%Pn/min",1),true):""}
 </section>`:""}
 ${badExit?note(`The release frequency (${G.ofpExitF.toFixed(2)} Hz) is above the start frequency (${G.ofpStart.toFixed(2)} Hz). The release condition is already met the moment the reduction engages, so this is not a hysteresis band. Check the point table.`,true):""}
 ${endPower!==null&&endPower<99?note(`Start frequency, end frequency and droop are three separate fields describing one line, and this profile's three values do not agree: the droop removes ${endPower.toFixed(0)}% of rated power by the end frequency, not all of it. Set the droop from the two frequencies, or the end frequency from the droop.`,true):""}
 ${note("Overfrequency reduces output and underfrequency raises it. The start frequencies sit inside the dead band around 50 Hz, so neither function acts in normal operation.",true)}`;
}

function pageRideThrough(model,kind){
 const title=kind==="lvrt"?"Low Voltage Ride-Through (LVRT)":"High Voltage Ride-Through (HVRT)";
 if(!model.prof().p)return `<h2 class="isw-page-title">${title}</h2>${noProfile(model)}`;
 const G=model.S.g;
 const prefix=kind==="lvrt"?"lv":"hv";
 const enableKey=`${prefix}rtOn`;
 const priorityKey=`${prefix}rtPm`;
 const zeroKey=`${prefix}Zero`;
 const head=`<h2 class="isw-page-title">${title}</h2>
 ${model.has(enableKey)?`<section class="isw-panel isw-panel--narrow">${markedRow(model,enableKey,kind==="lvrt"?"Ride through voltage dips":"Ride through voltage rises","Stay connected while the voltage stays inside the envelope below",sw(`g.${enableKey}`))}</section>`:""}
 ${model.has(priorityKey)?`<section class="isw-panel isw-panel--narrow">${markedRow(model,priorityKey,"Behaviour during ride-through","What the unit feeds while it rides the event out",`<span class="isw-select-slot isw-ride-priority-slot" data-isw-ride-priority-select="${G[priorityKey]}" data-isw-ride-priority-key="${priorityKey}"></span>`,true)}</section>`:""}
 ${model.has(zeroKey)?`<section class="isw-panel isw-panel--narrow">${markedRow(model,zeroKey,"Zero-current threshold",kind==="lvrt"?"Below this voltage the unit stops feeding current but stays connected":"Above this voltage the unit stops feeding current but stays connected",mini(`g.${zeroKey}`,G[zeroKey],"V",.5),true)}</section>`:""}`;
 const indexes=[1,2,3,4,5].filter(index=>model.hasAll(`${prefix}${index}`,`${prefix}${index}t`));
 if(!indexes.length)return head+note("This profile carries no ride-through envelope, so the points that set how long each voltage must be tolerated are not configured here. The envelope the unit actually uses is decided by the firmware and cannot be read back.",true);
 if(model.has(enableKey)&&!G[enableKey])return head+note("Ride-through is switched off in this profile. The envelope below is still stored and is restored when the function is switched back on.",true);
 const points=indexes.map(index=>({voltage:G[`${prefix}${index}`],time:G[`${prefix}${index}t`]}));
 const maxTime=Math.max(...points.map(point=>point.time))*1.15;
 const maxVoltage=Math.max(253,...points.map(point=>point.voltage))*1.08;
 const y=value=>112-(value/maxVoltage)*104;
 const x=value=>34+(value/maxTime)*352;
 const polyline=points.map(point=>`${x(point.time).toFixed(1)},${y(point.voltage).toFixed(1)}`).join(" ");
 const clash=kind==="lvrt"?model.hasAll("uv1","uv1t")&&points.some(point=>point.voltage>=G.uv1&&point.time>=G.uv1t):model.hasAll("ov1","ov1t")&&points.some(point=>point.voltage<=G.ov1&&point.time>=G.ov1t);
 const ticks=[0,maxTime/2,maxTime];
 return head+`
 <section class="isw-plot"><svg viewBox="0 0 400 132" preserveAspectRatio="none" role="img" aria-label="${title} envelope">
  <line class="isw-plot-axis" x1="34" y1="112" x2="392" y2="112"></line><line class="isw-plot-axis" x1="34" y1="4" x2="34" y2="112"></line>
  <line class="isw-plot-guide" x1="34" y1="${y(230).toFixed(1)}" x2="392" y2="${y(230).toFixed(1)}"></line>
  <polyline class="isw-plot-line" points="${polyline}"></polyline>
  ${points.map(point=>`<circle class="isw-plot-point" cx="${x(point.time).toFixed(1)}" cy="${y(point.voltage).toFixed(1)}" r="3.4"></circle>`).join("")}
  <text x="0" y="${(y(230)+3).toFixed(1)}">230 V</text>
  ${ticks.map(value=>`<text x="${(x(value)-10).toFixed(1)}" y="126">${value<1?value.toFixed(2):value.toFixed(1)}</text>`).join("")}
  <text x="340" y="126">s</text>
 </svg></section>
 <section class="isw-table isw-table--narrow">
  ${tableHead("70px 1fr 1fr",'<span>Point</span><span class="isw-align-right">Voltage</span><span class="isw-align-right">Ride-through</span>')}
  ${indexes.map(index=>{const markup=tableRow("70px 1fr 1fr",`<span class="isw-table-symbol">${index}</span>${mini(`g.${prefix}${index}`,G[`${prefix}${index}`],"V",.5)}${mini(`g.${prefix}${index}t`,G[`${prefix}${index}t`],"s",model.tfmt(`${prefix}${index}t`).step,model.tfmt(`${prefix}${index}t`).dec)}`);return model.dev(`${prefix}${index}`)||model.dev(`${prefix}${index}t`)?stateMark(markup):markup;}).join("")}
 </section>
 ${clash?note("Part of this envelope lies inside the voltage protection stages, which trip on value and time whatever the envelope says. Protection wins. Reconcile the two pages before relying on the envelope.",true):""}
 ${note(`${kind==="lvrt"?"While a voltage dip stays above this envelope, the inverter must remain connected.":"While a voltage rise stays below this envelope, the inverter must remain connected."} The points come from the ${model.prof().label} profile. Nothing here stops an edit from relaxing them, so check any change against the profile before handover.`,true)}`;
}

const noProfile=model=>note(`No certified parameter set ships for ${model.prof().label} in this firmware, so there is nothing to configure here. Pick a profile with a certified set, or wait for this one to be certified.`,true);

export const NAV_GROUPS=Object.freeze([
 {label:"Operating strategy",items:[
  {id:"mode",label:"Running Mode",icon:"mode",value:model=>MODES[model.S.runMode].compactLabel},
  {id:"eco",label:"Economic Schedule",icon:"clock",value:()=>""},
  {id:"touManual",label:"ToU Mode",icon:"tou",value:()=>"Manual"},
  {id:"touDynamic",label:"ToU Mode",icon:"tou",value:()=>"Dynamic"},
  {id:"batt",label:"Battery",icon:"batt",value:()=>"50.3 %"}
 ]},
 {label:"Power control",items:[
  {id:"dispatch",label:"Active Power Dispatch",icon:"dispatch",value:model=>model.S.dispatch.on?`${formatSigned(model.S.dispatch.sp)} ${model.unit()}`:"Off"},
  {id:"limits",label:"Import & Export Limits",icon:"limit",value:model=>model.S.limits.feedOn?`${model.S.limits.feed.toFixed(1)} kW`:"Off"},
  {id:"cap",label:"Output Capability",icon:"cap",value:model=>CAPABILITY_OPTIONS[model.S.capability]},
  {id:"di",label:"DI Port",icon:"di",value:model=>DI_PORT_OPTIONS[model.S.di]}
 ]},
 {label:"Grid compliance",items:[{id:"grid",label:"Grid & Protection",icon:"grid",gridParent:true,value:()=>""}]},
 {label:"System",items:[
  {id:"net",label:"Networking",icon:"net",value:()=>"LAN"},
  {id:"feat",label:"Device Features",icon:"feat",value:()=>""},
  {id:"mppt",label:"MPPT & Strings",icon:"mppt",value:()=>""},
  {id:"ct",label:"CT Detection",icon:"ct",value:()=>""}
 ]},
 {label:"Maintenance",items:[
  {id:"ops",label:"Operation Control",icon:"ops",value:()=>""},
  {id:"export",label:"Parameter Export",icon:"exp",value:()=>""},
  {id:"log",label:"Operation Log",icon:"log",value:()=>""}
 ]}
]);

export const PAGES=Object.freeze({
 mode:pageMode,eco:pageEconomic,touManual:manualTouPage,touDynamic:dynamicTouPage,batt:pageBattery,dispatch:pageDispatch,limits:pageLimits,
 cap:pageCapability,di:pageDi,grid:pageGrid,net:pageNetworking,feat:pageFeatures,
 mppt:pageMppt,ct:pageCt,ops:pageOperations,export:pageExport,log:pageLog
});

export const GRID_PAGES=Object.freeze({
 code:pageGridCode,prot:pageProtection,conn:pageConnection,reac:pageReactive,pu:pagePu,
 fp:pageFrequency,lvrt:model=>pageRideThrough(model,"lvrt"),hvrt:model=>pageRideThrough(model,"hvrt")
});

export function formatSigned(value){
 return `${value>0?"+":""}${Number(value).toFixed(1)}`;
}

