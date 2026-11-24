import {createTextElement as text} from "../../foundations/dom.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createStandardButton} from "../../components/controls.js";
import {createConfirmDialog} from "../../components/confirm-dialog.js";
import {createModalDialog} from "../../components/modal-dialog.js";
import {createSelectControl} from "../../components/select-control.js";
import {menuList,menuRow,mountMenu} from "../../components/menu-popover.js";
import {menuEndAlign} from "../../components/popover.js";
import {createTimeRangeControl} from "../../components/time-range-control.js";
import {timeToMinutes} from "./settings-model.js";
import {
 TOU_AREA_OPTIONS,
 TOU_CONTROL_MODES,
 TOU_COUNTRY_OPTIONS,
 TOU_CURRENCY_OPTIONS,
 TOU_INTERVAL_OPTIONS,
 TOU_PERIOD_MODES,
 TOU_TIMEZONE_OPTIONS
} from "./settings-options.js";

const intervalLabel=minutes=>TOU_INTERVAL_OPTIONS.find(option=>option.minutes===Number(minutes))?.label||"1 h";
const modeFor=value=>TOU_PERIOD_MODES.find(mode=>mode.value===Number(value))||TOU_PERIOD_MODES[0];
const currencySymbol=currency=>currency==="SEK"?"kr":currency==="USD"?"$":"€";
const currencyUnit=config=>`${currencySymbol(config.currency)}/kWh`;
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[char]));

function planFor(model,kind){
 if(kind==="manual")return model.S.tou.manual;
 return model.S.tou.dynamic[model.touDay()];
}

function arrayPath(model,kind){
 return kind==="manual"?"tou.manual":`tou.dynamic.${model.touDay()}`;
}

function validSegments(plan){
 return (plan||[]).filter(period=>{
  const from=timeToMinutes(period.from),to=timeToMinutes(period.to);
  return from!==null&&to!==null&&to>from;
 });
}

function rangeError(period,message){
 return {message,period};
}

export function validateTouRange({plan=[],interval=60,period,candidate}={}){
 const from=parseClock(candidate?.from),to=parseClock(candidate?.to);
 if(from===null||to===null)return rangeError(period,"Enter valid times between 00:00 and 24:00.");
 if(from===to)return rangeError(period,"Start and end times must differ.");
 if(to<from)return rangeError(period,"End time must be later.");
 const safeInterval=[15,30,60].includes(Number(interval))?Number(interval):60;
 if((from%safeInterval!==0)||(to%safeInterval!==0)){
  return rangeError(period,`Use ${intervalLabel(safeInterval)} steps.`);
 }
 for(const item of plan){
  if(!item||item===period||(period?.id&&item.id===period.id))continue;
  const itemFrom=timeToMinutes(item.from),itemTo=timeToMinutes(item.to);
  if(itemFrom===null||itemTo===null||itemTo<=itemFrom)continue;
  if(from<itemTo&&itemFrom<to)return rangeError(period,"Time ranges cannot overlap.");
 }
 return null;
}

export function validateTouSchedule({plan=[],interval=60}={}){
 if(plan.length>24){
  return rangeError(plan[24],"Maximum 24 time ranges.");
 }
 for(const period of plan){
  const error=validateTouRange({plan,interval,period,candidate:period});
  if(error)return error;
 }
 return null;
}

function modeLegend(plan){
 const seen=new Set();
 return validSegments(plan)
  .map(period=>modeFor(period.mode))
  .filter(mode=>{
   if(seen.has(mode.value))return false;
   seen.add(mode.value);
   return true;
  });
}

function plannedModeBands(plan){
 const fallback=modeFor(0);
 const bands=[];
 let cursor=0;
 const append=(from,to,mode)=>{
  if(to<=from)return;
  const last=bands[bands.length-1];
  if(last&&last.mode.value===mode.value&&last.to===from){
   last.to=to;
   return;
  }
  bands.push({from,to,mode});
 };
 const segments=validSegments(plan)
  .map(period=>({
   from:timeToMinutes(period.from),
   to:timeToMinutes(period.to),
   mode:modeFor(period.mode)
  }))
  .sort((left,right)=>left.from-right.from);
 for(const segment of segments){
  if(segment.from>cursor)append(cursor,segment.from,fallback);
  if(segment.to>cursor)append(Math.max(cursor,segment.from),segment.to,segment.mode);
  cursor=Math.max(cursor,segment.to);
 }
 if(cursor<1440)append(cursor,1440,fallback);
 if(!bands.length)append(0,1440,fallback);
 return bands;
}

function bandLegend(plan){
 const seen=new Set();
 return plannedModeBands(plan)
  .map(band=>band.mode)
  .filter(mode=>{
   if(seen.has(mode.value))return false;
   seen.add(mode.value);
   return true;
  });
}

function overviewSegments(model,kind){
 const plan=validSegments(planFor(model,kind));
 return plan.map(period=>{
  const from=timeToMinutes(period.from),to=timeToMinutes(period.to);
  const mode=modeFor(period.mode);
  const left=from/1440*100;
  const width=Math.max(.35,(to-from)/1440*100);
  return `<button class="isw-eco-segment isw-tou-mode-${mode.className}" type="button" style="left:${left}%;width:${width}%" data-isw-tou-segment="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}" aria-label="${escapeHTML(period.from)} to ${escapeHTML(period.to)}, ${mode.label}"></button>`;
 }).join("");
}

function overviewMarkup(model,kind){
 const plan=planFor(model,kind);
 const modes=modeLegend(plan);
 return `<section class="isw-gantt isw-eco-overview isw-tou-overview" data-isw-tou-overview="${kind}">
  <div class="isw-gantt-track isw-eco-track">${overviewSegments(model,kind)}</div>
  <div class="isw-eco-axis"><span>00:00</span><i></i><span>12:00</span><i></i><span>24:00</span></div>
  <div class="isw-eco-legend">${modes.map(mode=>`<span><i class="isw-eco-legend-dot isw-tou-mode-${mode.className}"></i>${mode.label}</span>`).join("")}</div>
 </section>`;
}

function scheduleRowMarkup(model,kind,period,index){
 const mode=modeFor(period.mode);
 const prefix=arrayPath(model,kind);
 const powerPath=`${prefix}.${index}.power`;
 const pvPath=`${prefix}.${index}.pvForbidden`;
 return `<div class="isw-tou-row" data-isw-tou-row="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}">
  <div class="isw-eco-field isw-eco-time-range-field wd-edit-field">
   <input class="isw-eco-time-range-input" type="text" value="${escapeHTML(period.from)} – ${escapeHTML(period.to)}" data-isw-tou-time-input="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}" aria-label="Time range, enter start and end time" inputmode="numeric" spellcheck="false" autocomplete="off">
   <button class="isw-eco-time-range-trigger wd-control-state" type="button" data-isw-tou-time-trigger="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}" aria-label="Open time picker for ${escapeHTML(period.from)} to ${escapeHTML(period.to)}" aria-haspopup="dialog"><span class="isw-eco-chevron" data-isw-icon="chevron"></span></button>
  </div>
  <span class="isw-tou-mode-slot" data-isw-tou-mode-select="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}"></span>
  <div class="isw-tou-power-value">${mode.batteryPower?`
   <span class="isw-mini-number wd-edit-field"><input value="${Number(period.power??100).toFixed(0)}" data-isw-number="${escapeHTML(powerPath)}" data-isw-decimals="0" inputmode="numeric" aria-label="Battery power limit"><span class="isw-number-unit">%</span></span>
   <span class="isw-tou-kw">${(Number(period.power??100)*model.PN/100).toFixed(1)} kW</span>`:""}
  </div>
  <div class="isw-tou-pv-value">${mode.pvForbidden?`<span class="isw-switch-slot" data-isw-switch="${escapeHTML(pvPath)}"></span>`:""}</div>
  <span class="isw-tou-more-slot" data-isw-tou-more="${escapeHTML(period.id)}" data-isw-tou-kind="${kind}"></span>
 </div>`;
}

function scheduleMarkup(model,kind){
 const plan=planFor(model,kind);
 return `<h3 class="isw-group-title">Schedule periods</h3>
 <section class="isw-table isw-tou-table" data-isw-tou-table="${kind}">
  <div class="isw-tou-table-head"><span>Time range</span><span>Mode</span><span class="isw-tou-head-with-info">Battery power limit<button class="isw-tou-info" type="button" data-isw-tou-power-info aria-label="Battery power limit information"><span data-isw-icon="info"></span></button></span><span>PV forbidden</span><span aria-hidden="true"></span></div>
  <div class="isw-tou-rows">${plan.map((period,index)=>scheduleRowMarkup(model,kind,period,index)).join("")}</div>
  <div class="isw-tou-add-row"><span data-isw-tou-add="${kind}"></span></div>
 </section>`;
}

function intervalMarkup(model,{dynamic=false}={}){
 const plan=dynamic?model.touPlan():model.S.tou.manual;
 const locked=plan.some(period=>Number(period.mode)!==0);
 return `<section class="isw-panel isw-tou-interval-panel">
  <div class="isw-row">
   <div class="isw-row-copy"><div class="isw-row-label">Time Interval</div><div class="isw-row-hint">${locked?"Reset every non-General period before changing the time interval.":"Defines the smallest editable time range."}</div></div>
   <span class="isw-tou-interval-slot" data-isw-tou-interval="${model.S.tou.interval}" data-isw-tou-locked="${locked?1:0}"></span>
  </div>
 </section>`;
}

export function manualTouPage(model){
 return `<h2 class="isw-page-title">ToU Mode</h2>
 <h3 class="isw-group-title">24h Overview</h3>
 ${overviewMarkup(model,"manual")}
 <h3 class="isw-group-title">Advanced Settings</h3>
 ${intervalMarkup(model)}
 ${scheduleMarkup(model,"manual")}`;
}

function priceModeBands(model){
 const bands=plannedModeBands(model.touPlan());
 return bands.map(band=>{
  const left=band.from/1440*100;
  const width=(band.to-band.from)/1440*100;
  const from=String(Math.floor(band.from/60)).padStart(2,"0")+":"+String(band.from%60).padStart(2,"0");
  const to=band.to===1440?"24:00":String(Math.floor(band.to/60)).padStart(2,"0")+":"+String(band.to%60).padStart(2,"0");
  return `<span class="isw-tou-price-mode-band isw-tou-mode-${band.mode.className}" style="left:${left}%;width:${width}%" title="${from} – ${to} · ${escapeHTML(band.mode.label)}"></span>`;
 }).join("");
}

function stepPricePath(prices,key,max){
 const y=value=>100-Math.max(0,Math.min(100,value/max*100));
 const commands=[`M0 ${y(prices[0][key]).toFixed(3)}`];
 for(let index=1;index<prices.length;index+=1){
  commands.push(`H${(index/96*960).toFixed(2)}V${y(prices[index][key]).toFixed(3)}`);
 }
 commands.push("H960");
 return commands.join("");
}

function stepPriceAreaPath(prices,max){
 const y=value=>100-Math.max(0,Math.min(100,value/max*100));
 const commands=[`M0 100L0 ${y(prices[0].buy).toFixed(3)}`];
 for(let index=1;index<prices.length;index+=1){
  commands.push(`H${(index/96*960).toFixed(2)}V${y(prices[index].buy).toFixed(3)}`);
 }
 commands.push("H960V100Z");
 return commands.join("");
}

function buyPriceSummary(prices){
 const min=Math.min(...prices.map(point=>point.buy));
 const max=Math.max(...prices.map(point=>point.buy));
 const longestRun=key=>{
  let best={from:0,to:1};
  let start=-1;
  for(let index=0;index<=prices.length;index+=1){
   const matches=index<prices.length&&prices[index].buy===key;
   if(matches&&start<0)start=index;
   if(!matches&&start>=0){
    if(index-start>best.to-best.from)best={from:start,to:index};
    start=-1;
   }
  }
  return best;
 };
 const label=minutes=>minutes===1440?"24:00":`${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
 const low=longestRun(min);
 const high=longestRun(max);
 return {low:{...low,value:min},high:{...high,value:max},label};
}

function priceLines(model,max){
 const prices=model.touPrices("today");
 return `<svg class="isw-tou-price-lines" viewBox="0 0 960 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <linearGradient id="isw-tou-buy-area-fill" x1="0" y1="0" x2="0" y2="1">
    <stop class="isw-tou-price-area-stop is-top" offset="0"></stop>
    <stop class="isw-tou-price-area-stop is-bottom" offset="1"></stop>
   </linearGradient>
  </defs>
  <path class="isw-tou-price-area is-buy" data-isw-tou-price-area="buy" d="${stepPriceAreaPath(prices,max)}"></path>
  <path class="isw-tou-price-line is-buy" data-isw-tou-price-line="buy" data-isw-tou-price-points="${prices.length}" d="${stepPricePath(prices,"buy",max)}"></path>
  <path class="isw-tou-price-line is-sell" data-isw-tou-price-line="sell" data-isw-tou-price-points="${prices.length}" d="${stepPricePath(prices,"sell",max)}"></path>
 </svg>`;
}

function priceSummary(model){
 const currency=currencySymbol(model.S.tou.config.currency);
 const summary=buyPriceSummary(model.touPrices("today"));
 const range=(item,kind)=>{
  const from=summary.label(item.from*15);
  const to=summary.label(item.to*15);
  return `<span class="isw-tou-price-summary-item is-${kind}"><i></i><span>${kind==="low"?"Lowest":"Peak"} buy</span><strong>${currency}${item.value.toFixed(2)}</strong><em>${from}–${to}</em></span>`;
 };
 return `<div class="isw-tou-price-summary" aria-label="Price summary">${range(summary.low,"low")}${range(summary.high,"high")}</div>`;
}

function priceChart(model,day){
 if(day==="tomorrow"){
  return `<section class="isw-panel isw-tou-price-empty" role="status">
   <span class="isw-tou-price-empty-icon" data-isw-icon="info"></span>
   <div class="isw-row-copy"><div class="isw-row-label">Tomorrow</div><div class="isw-row-hint">Dynamic electricity price data has not been updated yet. The system will update automatically once new data is received.</div></div>
  </section>`;
 }
 const prices=model.touPrices("today");
 const max=Math.ceil(Math.max(...prices.map(point=>point.buy))*10)/10;
 const scaleMax=Math.max(max,0.1);
 const thresholds=model.touThresholds("today");
 const highY=thresholds.high===null?null:Math.max(0,Math.min(100,thresholds.high/scaleMax*100));
 const lowY=thresholds.low===null?null:Math.max(0,Math.min(100,thresholds.low/scaleMax*100));
 const yTicks=Array.from({length:6},(_,index)=>scaleMax*(1-index/5));
 return `<section class="isw-tou-price-chart" aria-label="24 hour dynamic electricity prices">
  ${priceSummary(model)}
  <div class="isw-tou-price-y" aria-hidden="true">${yTicks.map(value=>`<span>${currencySymbol(model.S.tou.config.currency)}${value.toFixed(2)}</span>`).join("")}</div>
  <div class="isw-tou-price-plot">
   <div class="isw-tou-price-modes" aria-hidden="true">${priceModeBands(model)}</div>
   ${yTicks.map((_,index)=>`<i class="isw-tou-price-grid" style="top:${index*20}%"></i>`).join("")}
   ${highY===null?"":`<i class="isw-tou-price-threshold is-high" style="bottom:${highY}%"></i><span class="isw-tou-threshold-label is-high" style="bottom:${highY}%">High ${thresholds.high.toFixed(2)}</span>`}
   ${lowY===null?"":`<i class="isw-tou-price-threshold is-low" style="bottom:${lowY}%"></i><span class="isw-tou-threshold-label is-low" style="bottom:${lowY}%">Low ${thresholds.low.toFixed(2)}</span>`}
   ${priceLines(model,scaleMax)}
   <span class="isw-tou-price-hover-column" data-isw-tou-hover-column aria-hidden="true"></span>
   <div class="isw-tou-price-tooltip" id="isw-tou-price-tooltip" data-isw-tou-chart-tooltip role="tooltip" aria-hidden="true" hidden>
    <div class="isw-tou-price-tooltip-copy">
     <div><span>Mode</span><strong data-isw-tou-hover-mode></strong></div>
     <div><span>Buy Price</span><strong data-isw-tou-hover-buy></strong></div>
     <div><span>Sell Price</span><strong data-isw-tou-hover-sell></strong></div>
     <div><span>Time</span><strong data-isw-tou-hover-time></strong></div>
    </div>
   </div>
   <div class="isw-tou-price-hover" data-isw-tou-price-hover tabindex="0" role="group" aria-label="24-hour electricity prices. Use the left and right arrow keys to inspect each 15-minute period." aria-describedby="isw-tou-price-tooltip"></div>
  </div>
  <div class="isw-tou-price-x" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
  <div class="isw-tou-price-legend">
   <span><i class="isw-tou-price-key is-buy"></i>Buy Price</span>
   <span><i class="isw-tou-price-key is-sell"></i>Sell Price</span>
   ${bandLegend(model.touPlan()).map(mode=>`<span><i class="isw-tou-legend-dot isw-tou-mode-${mode.className}"></i>${mode.label}</span>`).join("")}
  </div>
 </section>`;
}

export function dynamicTouPage(model){
 if(!model.capabilities.supportsDynamicPricing){
  return `<h2 class="isw-page-title">ToU Mode</h2>
   <section class="isw-tou-unsupported" role="alert"><strong>This mode is not supported in your location.</strong><p>Manual ToU scheduling remains available.</p></section>`;
 }
 if(model.S.touView==="advanced")return advancedPage(model);
 const day=model.touDay();
 return `<h2 class="isw-page-title">ToU Mode</h2>
 <div class="isw-tou-day-toolbar">
  <div class="isw-tou-day-slot" data-isw-seg="touDay" data-isw-options="${encodeURIComponent(JSON.stringify([{label:"Today"},{label:"Tomorrow"}]))}" data-isw-value="${day==="tomorrow"?1:0}"></div>
  <span class="isw-tou-refresh-slot" data-isw-tou-refresh></span>
 </div>
 <h3 class="isw-group-title isw-tou-price-title">24h Overview</h3>
 ${priceChart(model,day)}
 <section class="isw-panel isw-tou-advanced-panel wd-hover-fill">
  <button class="isw-tou-advanced-link wd-control-state" type="button" data-isw-tou-view="advanced"><span>Advanced Settings</span><span class="isw-eco-chevron isw-tou-advanced-chevron" data-isw-icon="chevron" aria-hidden="true"></span></button>
 </section>
 ${scheduleMarkup(model,"dynamic")}`;
}

function modeFields(prefix,label,settings,model){
 const mode=modeFor(settings.mode);
 return `<div class="isw-tou-mode-settings" data-isw-tou-mode-settings="${prefix}">
  <span class="isw-tou-mode-settings-slot" data-isw-tou-group-mode="${prefix}"></span>
  ${mode.batteryPower?`<span class="isw-tou-group-power"><span class="isw-mini-number wd-edit-field"><input value="${settings.power}" data-isw-number="tou.config.${prefix}.power" data-isw-decimals="0" inputmode="numeric" aria-label="${label} battery power limit"><span class="isw-number-unit">%</span></span><span class="isw-tou-kw">${(settings.power*model.PN/100).toFixed(1)} kW</span></span>`:""}
  ${mode.pvForbidden?`<span class="isw-tou-group-pv"><span class="isw-switch-slot" data-isw-switch="tou.config.${prefix}.pvForbidden"></span></span>`:""}
 </div>`;
}

function controlModeFields(model){
 const config=model.S.tou.config;
 const mode=config.controlMode;
 if(mode===0)return intervalMarkup(model,{dynamic:true});
 if(mode===1)return `<section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">High Price Hours</div><div class="isw-row-hint">Hours automatically reserved for discharging.</div></div><span class="isw-number wd-edit-field"><input value="${config.durationHighHours.toFixed(0)}" data-isw-number="tou.config.durationHighHours" data-isw-decimals="0" inputmode="numeric" aria-label="High Price Hours"><span class="isw-number-unit">h</span></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Low Price Hours</div><div class="isw-row-hint">Hours automatically reserved for charging.</div></div><span class="isw-number wd-edit-field"><input value="${config.durationLowHours.toFixed(0)}" data-isw-number="tou.config.durationLowHours" data-isw-decimals="0" inputmode="numeric" aria-label="Low Price Hours"><span class="isw-number-unit">h</span></span></div>
 </section>`;
 if(mode===2)return `<section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">High Price Hours</div><div class="isw-row-hint">Top percentage of the daily price range.</div></div><span class="isw-number wd-edit-field"><input value="${config.percentageHighRange.toFixed(1)}" data-isw-number="tou.config.percentageHighRange" data-isw-decimals="1" inputmode="decimal" aria-label="High Price Hours"><span class="isw-number-unit">%</span></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Low Price Hours</div><div class="isw-row-hint">Bottom percentage of the daily price range.</div></div><span class="isw-number wd-edit-field"><input value="${config.percentageLowRange.toFixed(1)}" data-isw-number="tou.config.percentageLowRange" data-isw-decimals="1" inputmode="decimal" aria-label="Low Price Hours"><span class="isw-number-unit">%</span></span></div>
 </section>`;
 if(mode===3)return `<section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">High Price</div><div class="isw-row-hint">Prices at or above this threshold use the high-price plan.</div></div><span class="isw-number wd-edit-field"><input value="${config.fixedHighPrice.toFixed(1)}" data-isw-number="tou.config.fixedHighPrice" data-isw-decimals="1" inputmode="decimal" aria-label="High Price"><span class="isw-number-unit">${currencyUnit(config)}</span></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Low Price</div><div class="isw-row-hint">Prices at or below this threshold use the low-price plan.</div></div><span class="isw-number wd-edit-field"><input value="${config.fixedLowPrice.toFixed(1)}" data-isw-number="tou.config.fixedLowPrice" data-isw-decimals="1" inputmode="decimal" aria-label="Low Price"><span class="isw-number-unit">${currencyUnit(config)}</span></span></div>
 </section>`;
 return `<section class="isw-panel isw-tou-intelligent-note"><span data-isw-icon="info"></span><div class="isw-row-copy"><div class="isw-row-label">Intelligent Mode</div><div class="isw-row-hint">The cloud evaluates each period, chooses its operating mode and power settings, then sends the complete schedule to the device.</div></div></section>`;
}

function timeGroupMarkup(model){
 const {config}=model.S.tou;
 if(config.controlMode===0||config.controlMode===4)return "";
 return `<h3 class="isw-group-title">Time Settings</h3>
 <section class="isw-table isw-tou-table isw-tou-group-settings">
  <div class="isw-tou-table-head isw-tou-group-head" aria-hidden="true"><span></span><span>Mode</span><span>Battery power limit</span><span>PV forbidden</span></div>
  <div class="isw-tou-group-row"><span class="isw-tou-group-label">High Price Time</span>${modeFields("high","High price",config.high,model)}</div>
  <div class="isw-tou-group-row"><span class="isw-tou-group-label">Normal Time</span>${modeFields("normal","Normal price",config.normal,model)}</div>
  <div class="isw-tou-group-row"><span class="isw-tou-group-label">Low Price Time</span>${modeFields("low","Low price",config.low,model)}</div>
 </section>`;
}

function advancedPage(model){
 const {config}=model.S.tou;
 return `<h2 class="isw-page-title isw-tou-back-title" data-isw-title-control>
  <button class="isw-tou-back wd-control-state" type="button" data-isw-tou-view="main"><span class="isw-tou-back-chevron" data-isw-icon="chevron" aria-hidden="true"></span><span>Back</span></button>
 </h2>
 <h3 class="isw-group-title">Control</h3>
 <section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Control Mode</div><div class="isw-row-hint">${escapeHTML(TOU_CONTROL_MODES.find(mode=>mode.value===config.controlMode)?.description||"")}</div></div><span class="isw-tou-control-slot" data-isw-tou-control="${config.controlMode}" data-isw-tou-supported="${model.capabilities.supportsDynamicPricing?1:0}"></span></div>
 </section>
 ${controlModeFields(model)}
 ${timeGroupMarkup(model)}
 <h3 class="isw-group-title">Dynamic Price Source</h3>
 <section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Country/Region</div></div><span class="isw-tou-site-slot" data-isw-tou-site="country"></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Area</div></div><span class="isw-tou-site-slot" data-isw-tou-site="area"></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Timezone</div></div><span class="isw-tou-site-slot" data-isw-tou-site="timezone"></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Currency</div></div><span class="isw-tou-site-slot" data-isw-tou-site="currency"></span></div>
 </section>
 <h3 class="isw-group-title"><span>Extra Charge</span><button class="isw-tou-info" type="button" data-isw-tou-price-info aria-label="Price calculation information"><span data-isw-icon="info"></span></button></h3>
 <section class="isw-panel">
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Handling Fee</div><div class="isw-row-hint">Deducted when exporting to the grid.</div></div><span class="isw-number wd-edit-field"><input value="${config.handlingFee.toFixed(2)}" data-isw-number="tou.config.handlingFee" data-isw-decimals="2" inputmode="decimal" aria-label="Handling Fee"><span class="isw-number-unit">${currencyUnit(config)}</span></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Distribution Fee</div><div class="isw-row-hint">Added to the standard electricity price.</div></div><span class="isw-number wd-edit-field"><input value="${config.distributionFee.toFixed(2)}" data-isw-number="tou.config.distributionFee" data-isw-decimals="2" inputmode="decimal" aria-label="Distribution Fee"><span class="isw-number-unit">${currencyUnit(config)}</span></span></div>
  <div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Tax Rate</div><div class="isw-row-hint">Applied to the imported-energy price.</div></div><span class="isw-number wd-edit-field"><input value="${config.taxRate.toFixed(1)}" data-isw-number="tou.config.taxRate" data-isw-decimals="1" inputmode="decimal" aria-label="Tax Rate"><span class="isw-number-unit">%</span></span></div>
 </section>
 <h3 class="isw-group-title">Automatic Export Limit</h3>
 <section class="isw-panel"><div class="isw-row"><div class="isw-row-copy"><div class="isw-row-label">Automatic export limit</div><div class="isw-row-hint">Automatically prevents exporting power to the grid when electricity prices are negative, avoiding unnecessary losses.</div></div><span class="isw-switch-slot" data-isw-switch="tou.config.autoExportLimit"></span></div></section>`;
}

function openTouPriceInfo(glass){
 const content=text("div","isw-tou-price-info-dialog");
 const addSection=(title,paragraphs=[],items=[])=>{
  const section=text("section","isw-tou-price-info-section");
  section.append(text("h3","isw-tou-price-info-title",title,"Subheadline/Emphasized"));
  for(const paragraph of paragraphs)section.append(text("p","isw-tou-price-info-copy",paragraph,"Footnote/Regular"));
  if(items.length){
   const list=text("ul","isw-tou-price-info-list");
   for(const item of items)list.append(text("li","",item,"Footnote/Regular"));
   section.append(list);
  }
  content.append(section);
 };
 addSection("Actual Export Price (per kWh)",[
  "Actual export price = Standard price − Handling fee"
 ],[
  "Standard price: The electricity price obtained from the dynamic price data source",
  "Handling fee: The cost required to export electricity to the grid"
 ]);
 content.lastElementChild.append(text("p","isw-tou-price-info-copy","This value is used to estimate the income from selling electricity.","Footnote/Regular"));
 addSection("Actual Import Price (per kWh)",[
  "Actual import price = (Standard price + Distribution fee) × (1 + Tax rate)"
 ],[
  "Distribution fee: Electricity transmission and distribution cost",
  "Tax rate: Tax applied to electricity trading"
 ]);
 content.lastElementChild.append(text("p","isw-tou-price-info-copy","This value is used to estimate the cost of purchasing electricity from the grid.","Footnote/Regular"));
 addSection("Notes",[
  "All prices are used for cost and profit estimation only and do not affect actual utility billing."
 ],[
  "Distribution fee, handling fee, and tax rate are optional",
  "If you are unsure, you can leave them empty",
  "The system will use the standard electricity price as the default"
 ]);
 const actions=text("div","isw-tou-price-info-actions");
 const ok=createStandardButton({label:"OK",variant:"neutral",className:"isw-tou-price-info-ok"});
 actions.append(ok);
 content.append(actions);
 const dialog=createModalDialog({
  glass,
  title:"Price calculation",
  className:"isw-tou-price-info-modal",
  titleIcon:createMaskedIcon(assetURL("plants/detail/info2.svg"),"isw-tou-price-info-icon"),
  closeIcon:createMaskedIcon(assetURL("tab-close.svg"),"plants-device-action-icon"),
  content
 });
 dialog.registerSurface(ok,18);
 ok.addEventListener("click",()=>dialog.close());
}

function parseClock(value){
 const match=/^(\d{2}):(\d{2})$/.exec(String(value||"").trim());
 if(!match)return null;
 const minutes=timeToMinutes(value);
 return minutes===null?null:minutes;
}

function timeRangeText(period){
 return `${period.from} – ${period.to}`;
}

export function hydrateTouSettingsPage(page,{
 titleLayer,
 model,
 glass,
 registerPanel,
 togglePanel,
 closePanels,
 refresh,
 notify,
 bindHoverPanel,
 addDisposer,
 setPendingFocus,
 navigateView,
 showFieldError,
 clearFieldError
}){
 const planByKind=(kind,id)=>planFor(model,kind).find(period=>period.id===id);
 const addControl=control=>{
  addDisposer?.(()=>control.destroy?.());
  return control;
 };
 const interval=model.S.tou.interval;
 const validateRange=(period,candidate,kind="manual")=>{
  return validateTouRange({
   plan:planFor(model,kind),
   interval,
   period,
   candidate
  })?.message||"";
 };
 const ensureValidTou=()=>{
  model.normalizeTou();
  model.regenerateTouDynamic();
 };

 for(const hover of page.querySelectorAll("[data-isw-tou-price-hover]")){
  const plot=hover.closest(".isw-tou-price-plot");
  const column=plot?.querySelector("[data-isw-tou-hover-column]");
  const tooltip=plot?.querySelector("[data-isw-tou-chart-tooltip]");
  if(!plot||!tooltip)continue;
  const modeValue=tooltip.querySelector("[data-isw-tou-hover-mode]");
  const buyValue=tooltip.querySelector("[data-isw-tou-hover-buy]");
  const sellValue=tooltip.querySelector("[data-isw-tou-hover-sell]");
  const timeValue=tooltip.querySelector("[data-isw-tou-hover-time]");
  const prices=model.touPrices("today");
  const currency=currencySymbol(model.S.tou.config.currency);
  const controller=new AbortController();
  let hoverIndex=0;
  let hoverVisible=false;
  const minuteLabel=minute=>`${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`;
  const placeTooltip=point=>{
   const plotBox=plot.getBoundingClientRect();
   const box=tooltip.getBoundingClientRect();
   const x=Number.isFinite(point?.x)?point.x:plotBox.width/2;
   const y=Number.isFinite(point?.y)?point.y:plotBox.height/2;
   tooltip.style.left=`${Math.max(8,Math.min(plotBox.width-box.width-8,x+12))}px`;
   tooltip.style.top=`${Math.max(8,Math.min(plotBox.height-box.height-8,y-box.height/2))}px`;
  };
  const showAt=(index,point)=>{
   hoverIndex=Math.max(0,Math.min(95,Math.round(index)));
   const price=prices[hoverIndex];
   const minute=hoverIndex*15;
   const mode=model.touModeAt(minute,"today");
   modeValue.textContent=mode.label;
   buyValue.textContent=`${currency}${price.buy.toFixed(3)}/kWh`;
   sellValue.textContent=`${currency}${price.sell.toFixed(3)}/kWh`;
   timeValue.textContent=`${minuteLabel(minute)}–${minuteLabel(minute+15)}`;
   if(column){
    column.className=`isw-tou-price-hover-column isw-tou-mode-${mode.className} is-visible`;
    column.style.left=`${hoverIndex/96*100}%`;
   }
   tooltip.hidden=false;
   tooltip.setAttribute("aria-hidden","false");
   hoverVisible=true;
   hover.dataset.iswTouHoverIndex=String(hoverIndex);
   placeTooltip(point);
  };
  const hide=()=>{
   if(!hoverVisible)return;
   hoverVisible=false;
   tooltip.hidden=true;
   tooltip.setAttribute("aria-hidden","true");
   column?.classList.remove("is-visible");
   hover.removeAttribute("data-isw-tou-hover-index");
  };
  const pointerIndex=event=>{
   const box=plot.getBoundingClientRect();
   return Math.max(0,Math.min(95,Math.floor((event.clientX-box.left)/box.width*96)));
  };
  hover.addEventListener("pointerenter",event=>showAt(pointerIndex(event),{x:event.clientX-plot.getBoundingClientRect().left,y:event.clientY-plot.getBoundingClientRect().top}),{signal:controller.signal});
  hover.addEventListener("pointermove",event=>showAt(pointerIndex(event),{x:event.clientX-plot.getBoundingClientRect().left,y:event.clientY-plot.getBoundingClientRect().top}),{signal:controller.signal});
  hover.addEventListener("pointerleave",hide,{signal:controller.signal});
  hover.addEventListener("focus",()=>showAt(Number(hover.dataset.iswTouHoverIndex??hoverIndex)),{signal:controller.signal});
  hover.addEventListener("blur",hide,{signal:controller.signal});
  hover.addEventListener("keydown",event=>{
   if(!["ArrowLeft","ArrowRight","Home","End","Escape"].includes(event.key))return;
   event.preventDefault();
   if(event.key==="Escape"){
    hide();
    hover.blur();
    return;
   }
   const next=event.key==="Home"?0:event.key==="End"?95:event.key==="ArrowLeft"?Math.max(0,hoverIndex-1):Math.min(95,hoverIndex+1);
   showAt(next);
  },{signal:controller.signal});
  tooltip.classList.add("wd-glass--surface","wd-glass-popup");
  glass?.addSurface?.({host:tooltip,radius:12,interactive:false});
  addDisposer?.(()=>{
   controller.abort();
   glass?.removeSurface?.(tooltip);
  });
 }

 for(const segment of page.querySelectorAll("[data-isw-tou-segment]")){
  const kind=segment.dataset.iswTouKind;
  const period=planByKind(kind,segment.dataset.iswTouSegment);
  if(period)bindHoverPanel?.(segment,timeRangeText(period),"Time range");
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-interval]")){
  const locked=slot.dataset.iswTouLocked==="1";
  const control=addControl(createSelectControl({
   label:"Time Interval",
   value:interval,
   options:TOU_INTERVAL_OPTIONS.map(option=>({value:option.minutes,label:option.label})),
   variant:"adaptive",
   className:"isw-tou-interval-select",
   menuClassName:"isw-tou-select-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   radius:24,
   menuWidth:180,
   align:"end",
   onChange:next=>{
    if(locked)return;
    model.S.tou.interval=Number(next);
    model.normalizeTou();
    setPendingFocus?.({type:"touInterval"});
    refresh();
   }
  }));
  control.element.dataset.iswTouInterval=String(model.S.tou.interval);
  if(locked){
   control.element.disabled=true;
   control.element.setAttribute("aria-disabled","true");
  }
  slot.replaceWith(control.element);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-mode-select]")){
  const kind=slot.dataset.iswTouKind;
  const period=planByKind(kind,slot.dataset.iswTouModeSelect);
  if(!period)continue;
  const control=addControl(createSelectControl({
   label:"Period mode",
   value:period.mode,
   options:TOU_PERIOD_MODES.map(mode=>({value:mode.value,label:mode.label})),
   variant:"adaptive",
   className:"isw-tou-mode-select",
   menuClassName:"isw-tou-select-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   radius:24,
   menuWidth:220,
   align:"end",
   onChange:next=>{
    period.mode=Number(next);
    ensureValidTou();
    setPendingFocus?.({type:"touMode",kind,id:period.id});
    refresh();
   }
  }));
  control.element.dataset.iswTouModeSelect=period.id;
  control.element.dataset.iswTouKind=kind;
  slot.replaceWith(control.element);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-group-mode]")){
  const key=slot.dataset.iswTouGroupMode;
  const settings=model.S.tou.config[key];
  if(!settings)continue;
  const control=addControl(createSelectControl({
   label:`${key[0].toUpperCase()+key.slice(1)} time mode`,
   value:settings.mode,
   options:TOU_PERIOD_MODES.map(mode=>({value:mode.value,label:mode.label})),
   variant:"adaptive",
   className:"isw-tou-mode-select",
   menuClassName:"isw-tou-select-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   radius:24,
   menuWidth:220,
   align:"end",
   onChange:next=>{
    settings.mode=Number(next);
    ensureValidTou();
    setPendingFocus?.({type:"touGroupMode",id:key});
    refresh();
   }
  }));
  control.element.dataset.iswTouGroupMode=key;
  slot.replaceWith(control.element);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-control]")){
  const supported=slot.dataset.iswTouSupported==="1";
  const control=addControl(createSelectControl({
   label:"Control Mode",
   value:Number(slot.dataset.iswTouControl),
   options:TOU_CONTROL_MODES.map(mode=>({value:mode.value,label:mode.label,description:mode.menuDescription,disabled:!supported&&mode.value!==0})),
   variant:"adaptive",
   className:"isw-tou-control-select",
   menuClassName:"isw-tou-select-popover isw-tou-control-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   align:"end",
   menuWidth:288,
   onChange:next=>{
    const value=Number(next);
    if(!supported&&value!==0)return;
    model.S.tou.config.controlMode=value;
    model.regenerateTouDynamic();
    setPendingFocus?.({type:"touControl"});
    refresh();
   }
  }));
  control.element.dataset.iswTouControl=String(model.S.tou.config.controlMode);
  slot.replaceWith(control.element);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-refresh]")){
  const button=createStandardButton({
   label:"Refresh",
   className:"isw-tou-refresh",
   icon:createMaskedIcon(assetURL("light/imgLinearArrowsRefresh.svg"),"isw-tou-refresh-icon")
  });
  button.dataset.iswTouRefresh="";
  glass?.addSurface?.({host:button,radius:18});
  addDisposer?.(()=>glass?.removeSurface?.(button));
  button.addEventListener("click",()=>{
   model.regenerateTouDynamic();
   refresh();
   notify?.("Dynamic electricity prices refreshed in this local preview");
  });
  slot.replaceWith(button);
 }

 const siteOptions={
  country:TOU_COUNTRY_OPTIONS,
  area:TOU_AREA_OPTIONS,
  timezone:TOU_TIMEZONE_OPTIONS,
  currency:TOU_CURRENCY_OPTIONS
 };
 for(const slot of page.querySelectorAll("[data-isw-tou-site]")){
  const key=slot.dataset.iswTouSite;
  const control=addControl(createSelectControl({
   label:key==="country"?"Country/Region":key[0].toUpperCase()+key.slice(1),
   value:model.S.tou.config[key],
   options:siteOptions[key]||[],
   variant:"adaptive",
   className:"isw-tou-site-select",
   menuClassName:"isw-tou-select-popover",
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   radius:24,
   menuWidth:260,
   align:"end",
   onChange:next=>{
    const previous=model.S.tou.config[key];
    const apply=()=>{
     model.S.tou.config[key]=next;
     if(key==="country"){
      const defaults={
       Germany:["DE-LU","Europe/Berlin","EUR"],
       Sweden:["SE1","Europe/Stockholm","SEK"],
       Netherlands:["NL","Europe/Amsterdam","EUR"],
       Austria:["AT","Europe/Vienna","EUR"]
      }[next];
      if(defaults){
       model.S.tou.config.area=defaults[0];
       model.S.tou.config.timezone=defaults[1];
       model.S.tou.config.currency=defaults[2];
      }
     }
     model.regenerateTouDynamic();
     refresh();
    };
    if(model.S.tou.config.controlMode!==0&&next!==previous){
     createConfirmDialog({
      glass,
      title:"Update ToU plan?",
      description:"Changing the location, area, timezone or currency recalculates today's and tomorrow's dynamic plan and sends the updated schedule to the device.",
      confirmLabel:"Submit",
      cancelLabel:"Cancel",
      icon:createMaskedIcon(assetURL("asset-32.svg"),"plants-device-action-icon"),
      danger:false,
      onConfirm:apply,
      onClose:()=>control.setValue(previous,{notify:false})
     });
     return;
    }
    apply();
   }
  }));
  control.element.dataset.iswTouSite=key;
  slot.replaceWith(control.element);
 }

 for(const field of page.querySelectorAll(".isw-eco-time-range-field")){
  const input=field.querySelector("[data-isw-tou-time-input]");
  const trigger=field.querySelector("[data-isw-tou-time-trigger]");
  const period=planByKind(input?.dataset.iswTouKind,input?.dataset.iswTouTimeInput);
  if(!input||!trigger||!period)continue;
  field.dataset.iswSharedTime="";
  const control=createTimeRangeControl({
   field,
   input,
   trigger,
   getValue:()=>({from:period.from,to:period.to}),
   stepMinutes:interval,
   validate:value=>validateRange(period,value,input.dataset.iswTouKind),
   onCommit:value=>{
    period.from=value.from;
    period.to=value.to;
    model.normalizeTou();
    setPendingFocus?.({type:"touTime",kind,id:period.id});
    refresh();
   },
   onError:message=>showFieldError?.(input,message),
   onClearError:()=>clearFieldError?.(input),
   registerPanel,
   close:closePanels,
   toggle:togglePanel,
   addDisposer
  });
  addDisposer?.(control.destroy);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-add]")){
  const kind=slot.dataset.iswTouAdd;
  const add=createStandardButton({
   label:"Add time range",
   iconOnly:true,
   className:"isw-tou-add",
   icon:createMaskedIcon(assetURL("plants/plus.svg"),"isw-tou-add-icon")
  });
  add.dataset.iswTouAdd=kind;
  glass?.addSurface?.({host:add,radius:18});
  if(planFor(model,kind).length>=24)add.disabled=true;
  add.addEventListener("click",()=>{
   if(planFor(model,kind).length>=24)return;
   const period={
    id:`${kind}-${Date.now().toString(36)}`,
    from:"00:00",
    to:"00:00",
    mode:0,
    power:100,
    pvForbidden:0
   };
   planFor(model,kind).push(period);
   setPendingFocus?.({type:"touTime",kind,id:period.id});
   refresh();
  });
  slot.replaceWith(add);
 }

 for(const slot of page.querySelectorAll("[data-isw-tou-more]")){
  const kind=slot.dataset.iswTouKind;
  const period=planByKind(kind,slot.dataset.iswTouMore);
  if(!period)continue;
  const button=createStandardButton({
   label:`Actions for ${period.from} – ${period.to}`,
   iconOnly:true,
   className:"isw-tou-more",
   icon:createMaskedIcon(opaqueMaskURL("asset-70.svg"),"isw-tou-more-icon")
  });
  button.dataset.iswTouMore=period.id;
  button.dataset.iswTouKind=kind;
  glass?.addSurface?.({host:button,radius:18});
  button.addEventListener("click",()=>{
   if(!registerPanel)return;
   togglePanel?.(button,()=>{
    const panel=text("div","popover popover--menu isw-tou-select-popover");
    const list=menuList();
    const row=menuRow("Delete",{
     iconNode:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"isw-tou-more-icon"),
     showCheck:false,
     onSelect:()=>{
      closePanels?.(true);
      createConfirmDialog({
       glass,
       title:"Delete this time range?",
       description:`${period.from} – ${period.to} will be removed from the ToU schedule.`,
       confirmLabel:"Delete",
       cancelLabel:"Cancel",
       icon:createMaskedIcon(assetURL("plants/devices/actions/delete.svg"),"plants-device-action-icon"),
       confirmVariant:"danger-solid",
       onConfirm:()=>{
        const plan=planFor(model,kind);
        const index=plan.findIndex(item=>item.id===period.id);
        if(index>=0)plan.splice(index,1);
        model.normalizeTou();
        setPendingFocus?.({type:"touAdd",kind});
        refresh();
       }
      });
     }
    });
    row.classList.add("isw-eco-delete-row","is-danger");
    list.append(row);
    mountMenu(panel,{label:`Actions for ${period.from} – ${period.to}`,children:[list]});
    return registerPanel(panel,button,{label:`Actions for ${period.from} – ${period.to}`,radius:30,width:180,align:"end",alignRight:menuEndAlign(button,30)});
   });
  });
  slot.replaceWith(button);
 }

 for(const button of [...page.querySelectorAll("[data-isw-tou-view]"),...titleLayer?.querySelectorAll?.("[data-isw-tou-view]")||[]]){
  button.addEventListener("click",()=>navigateView?.(button.dataset.iswTouView));
 }

 const info=page.querySelector("[data-isw-tou-price-info]");
 if(info)info.addEventListener("click",()=>openTouPriceInfo(glass));
 for(const infoButton of page.querySelectorAll("[data-isw-tou-power-info]")){
  bindHoverPanel?.(
   infoButton,
   "Battery power limit is a percentage of the inverter's rated output.",
   "Battery power limit information",
   248,
   {align:"center"}
  );
 }
}

export const __touTestables=Object.freeze({
 modeFor,
 currencySymbol,
 timeRangeText,
 validateTouRange,
 validateTouSchedule
});
