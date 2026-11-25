import {createTextElement as text} from "../../foundations/dom.js";
import {formatAbsoluteTime} from "../../foundations/time.js";
import {assetURL,createMaskedIcon} from "../../components/icons.js";
import {createModalDialog} from "../../components/modal-dialog.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {IPS_CHECK_ITEMS} from "./settings-options.js";

const STATUS_LABELS=Object.freeze({
 not_checked:"",
 checking:"Checking",
 passed:"Pass",
 failed:"Fail",
 interrupted:"Interrupted"
});
const STATUS_TONES=Object.freeze({
 not_checked:"idle",
 checking:"warning",
 passed:"success",
 failed:"danger",
 interrupted:"warning"
});

const escapeHTML=value=>String(value??"")
 .replaceAll("&","&amp;")
 .replaceAll("<","&lt;")
 .replaceAll(">","&gt;")
 .replaceAll('"',"&quot;");

function formatNumber(value,digits=2){
 if(value===null||value===undefined||value==="")return "--";
 const number=Number(value);
 if(!Number.isFinite(number))return "--";
 return String(Number(number.toFixed(digits)));
}

function valueLabel(item,key){
 if(key==="measured"){
  return item.quantity==="frequency"
   ?`Fac (Hz)`
   :`Vac (V)`;
 }
 return "";
}

export function ipsItemMarkup(model,item){
 const status=item.status||"not_checked";
 const tone=STATUS_TONES[status]||"idle";
 const statusLabel=STATUS_LABELS[status]||"";
 const unit=item.quantity==="frequency"?"Hz":"V";
 const under=item.description.startsWith("Under");
 const protectionKind=item.quantity==="frequency"
  ?under?"underfrequency":"overfrequency"
  :under?"undervoltage":"overvoltage";
 const protectionLabel=`Level ${item.level} protection time of ${protectionKind}(ms)`;
 const rows=[
  [`Trip Limit Set (${unit})`,item.range,item.rangePoint],
  ["Trip Limit Time Set (s)",item.time,item.timePoint],
  [valueLabel(item,"measured"),item.measured,item.measuredPoint],
  [protectionLabel,item.protectionMs,null]
 ];
 return `<section class="isw-panel isw-ips-card is-${tone}" data-isw-ips-item="${item.id}" data-status="${status}">
  <header class="isw-ips-card-head">
   <div>
    <h3 class="isw-ips-card-code">${escapeHTML(item.code)}</h3>
    <p class="isw-ips-card-description">${escapeHTML(item.description)}</p>
   </div>
   ${statusLabel?`<span class="isw-status isw-status--${tone}" data-isw-ips-item-status><i></i><span>${statusLabel}</span></span>`:""}
  </header>
  <div class="isw-ips-values">
   ${rows.map(([label,value,point])=>`<div class="isw-ips-value-row" data-isw-ips-value>
    <span>${escapeHTML(label)}</span>
    <b${point?` data-isw-point="${escapeHTML(point)}"`:""}>${formatNumber(value)}</b>
   </div>`).join("")}
  </div>
 </section>`;
}

function operationState(model){
 const overall=model.ipsOverallStatus();
 const required=model.ipsRequired();
 const connected=Boolean(model.S.ips.gridConnected);
 const state={
  offline:{
   title:"Device connection lost",
   description:"Reconnect the inverter before starting or reviewing an IPS check.",
   action:"Device Offline",
   actionDisabled:true,
   tone:"idle"
  },
  checking:{
   title:"IPS Check in progress",
   description:"Keep the inverter powered on and do not change settings until all checks complete.",
   action:"Checking...",
   actionDisabled:true,
   tone:"warning"
  },
  failed:{
   title:"IPS Check failed",
   description:"Grid connection is prohibited. Review the failed items, correct the issue, then run the check again.",
   action:"Run Check Again",
   tone:"danger"
  },
  passed:{
   title:"IPS Check passed",
   description:"The interface protection settings passed the self-test. Normal grid conditions still apply.",
   action:"Run Check Again",
   tone:"success"
  },
  interrupted:{
   title:"IPS Check interrupted",
   description:"The check ended before a final result was available. Run the check again when the inverter is ready.",
   action:"Run Check Again",
   tone:"warning"
  },
  idle:{
   title:"Ready for IPS Check",
   description:connected
    ?"The self-test takes about 10 minutes and may affect normal grid operation. Do not power off the inverter during the check."
    :"The self-test takes about 10 minutes. Do not power off the inverter during the check. The inverter must pass this check before it can connect to the grid.",
   action:"Start IPS Check",
   tone:"idle"
  }
 }[overall]||{
  title:"Ready for IPS Check",
  description:"The self-test takes about 10 minutes. Do not power off the inverter during the check.",
  action:"Start IPS Check",
  tone:"idle"
 };
 return {
  ...state,
  overall,
  required,
  connected,
  actionDisabled:Boolean(state.actionDisabled)
 };
}

export function ipsCheckPage(model){
 const state=operationState(model);
 const record=model.S.ips.lastRecord;
 const recordTime=record?.completedAt?formatAbsoluteTime(record.completedAt):"";
 const items=model.ipsItemViews();
 return `<h2 class="isw-page-title isw-ips-title" data-isw-title-control>
  <span class="isw-title-label">IPS Check</span>
  <button class="isw-button-slot isw-ips-record-action" type="button" data-isw-standard-button data-isw-action="ipsHistory" data-isw-button-label="IPS Check Record" data-isw-button-variant="neutral" aria-haspopup="dialog"${recordTime?"":" disabled"}></button>
 </h2>
 <section class="isw-panel isw-ips-operation-card" data-isw-ips-overall="${state.overall}">
  <header class="isw-ips-operation-head">
   <div class="isw-ips-operation-title">
    <span class="isw-ips-operation-mark" aria-hidden="true"></span>
    <div>
     <h3>CEI 0-21 Auto-test</h3>
     <p>Interface Protection System (IPS) self-test required by CEI 0-21.</p>
    </div>
   </div>
   ${state.required?`<span class="isw-ips-required">Required before grid connection</span>`:`<span class="isw-ips-required is-optional">Optional self-check</span>`}
  </header>
  <div class="isw-ips-operation-state" role="status" aria-live="polite">
   <div class="isw-ips-state-copy">
    <div class="isw-status isw-status--${state.tone}"><i></i><span>${state.title}</span></div>
    <div class="isw-ips-grid-status">Grid status: <b>${state.connected?"Connected":"Not connected"}</b></div>
    <p>${state.description}</p>
   </div>
   <button class="isw-button-slot isw-ips-primary-action" type="button" data-isw-standard-button data-isw-action="ipsStart" data-isw-button-label="${state.action}" data-isw-button-variant="primary"${state.actionDisabled?" disabled aria-disabled=\"true\"":""}></button>
  </div>
 </section>
 <h3 class="isw-group-title">Protection checks</h3>
 <div class="isw-ips-grid">${items.map(item=>ipsItemMarkup(model,item)).join("")}</div>
 <div class="isw-note isw-note--narrow"><i class="isw-icon" data-isw-icon="info" aria-hidden="true"></i><div>Results are retained from the most recent completed self-check. Missing telemetry is shown as <b>--</b>; it does not mean the protection setting is zero.</div></div>`;
}

export function openIpsCheckRecord({model,glass}){
 const record=model.S.ips.lastRecord;
 if(!record)return null;
 const items=IPS_CHECK_ITEMS.map(item=>({
  ...item,
  ...record.items[item.id]
 }));
 const passed=items.filter(item=>item.status==="passed").length;
 const failed=items.filter(item=>item.status==="failed").length;
 const tone=failed?"danger":"success";
 const outcome=failed?"IPS Check failed":"IPS Check passed";
 const body=text("div","isw-ips-record-body");
 const viewport=text("div","isw-ips-record-scroll");
 viewport.tabIndex=0;
 const content=text("div","isw-ips-record-content");
 viewport.append(content);
 body.append(viewport);
 content.innerHTML=`<section class="isw-panel isw-ips-record-overview is-${tone}">
   <div class="isw-ips-record-overview-head">
    <div class="isw-ips-record-overview-title">
     <span class="isw-ips-operation-mark" aria-hidden="true"></span>
     <div>
      <div class="isw-status isw-status--${tone}"><i></i><span>${outcome}</span></div>
      <div class="isw-ips-record-meta"><span>Record time</span><b>${formatAbsoluteTime(record.completedAt)}</b></div>
     </div>
    </div>
    <div class="isw-ips-record-counts">
     <span class="isw-status isw-status--success">${passed} passed</span>
     ${failed?`<span class="isw-status isw-status--danger">${failed} failed</span>`:`<span class="isw-status isw-status--success">All items passed</span>`}
    </div>
  </div>
  </section>
  <h3 class="isw-group-title">Protection checks</h3>
  <div class="isw-ips-grid isw-ips-record-grid">${items.map(item=>ipsItemMarkup(model,item)).join("")}</div>`;
 let feedback=null;
 const modal=createModalDialog({
  glass,
  title:"IPS Check Record",
  className:"isw-ips-record-dialog",
  closeIcon:createMaskedIcon(assetURL("tab-close.svg"),"plants-device-action-icon"),
  content:body,
  onClose:()=>{
   feedback?.destroy();
   feedback=null;
  }
 });
 if(modal?.dialog){
  feedback=createScrollFeedback({
   host:body,
   viewport,
   content,
   elastic:true,
   topInset:0,
   bottomInset:()=>Number.parseFloat(getComputedStyle(body).getPropertyValue("--isw-record-scroll-inset"))||0,
   visibility:"hover"
  });
  feedback.element.style.setProperty("--wd-scroll-feedback-right","4px");
 }
 return modal;
}
