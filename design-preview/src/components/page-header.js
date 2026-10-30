import {applyTypeStyle} from "../foundations/typography.js";
import {createIcon,opaqueMaskURL} from "./icons.js";

export function createPageBreadcrumb(items,{label="Breadcrumb",className=""}={}){
  const nav=document.createElement("nav");
  nav.className=["wd-page-breadcrumb",className].filter(Boolean).join(" ");
  nav.setAttribute("aria-label",label);
  const list=document.createElement("ol");
  list.className="wd-page-breadcrumb-list";
  items.forEach((item,index)=>{
    const entry=document.createElement("li");
    entry.className="wd-page-breadcrumb-item";
    const current=item.current??index===items.length-1;
    const node=document.createElement(current||!item.onClick?"span":"button");
    node.className=current?"wd-page-breadcrumb-current":"wd-page-breadcrumb-link";
    if(!current&&item.onClick){
      node.type="button";
      node.classList.add("wd-control-state");
      node.addEventListener("click",item.onClick);
    }
    if(current)node.setAttribute("aria-current","page");
    node.textContent=item.label;
    applyTypeStyle(node,"14/14 medium");
    entry.append(node);
    list.append(entry);
    if(index<items.length-1){
      const separator=document.createElement("li");
      separator.className="wd-page-breadcrumb-separator";
      separator.setAttribute("aria-hidden","true");
      const arrow=createIcon("forward");
      arrow.style.setProperty("--icon-mask",`url("${opaqueMaskURL("asset-14.svg")}")`);
      separator.append(arrow);
      list.append(separator);
    }
  });
  nav.append(list);
  return nav;
}

// Shared breadcrumb/action row for content pages. A page may provide only the
// current leaf or a full path; both use the same 14px / 510 breadcrumb anatomy.
export function createPageHeader({
  breadcrumb=[],
  className="",
  headingClassName=""
}){
  const element=document.createElement("header");
  element.className=["wd-page-header",className].filter(Boolean).join(" ");

  const heading=document.createElement("div");
  heading.className=["wd-page-heading",headingClassName].filter(Boolean).join(" ");
  const breadcrumbElement=createPageBreadcrumb(breadcrumb);
  heading.append(breadcrumbElement);

  const actions=document.createElement("div");
  actions.className="wd-page-actions";
  element.append(heading,actions);
  return {element,heading,breadcrumb:breadcrumbElement,actions};
}

// Header text actions are lighter than the standard glass button: a compact
// transparent affordance at rest and a restrained fill on hover/focus.
export function createPageHeaderAction({
  label,
  icon=null,
  className="",
  onClick=null
}){
  const action=document.createElement("button");
  action.type="button";
  action.className=["wd-page-action","wd-control-state",className].filter(Boolean).join(" ");
  action.setAttribute("aria-label",label);
  action.title=label;
  if(icon)action.append(icon);
  const text=document.createElement("span");
  text.className="wd-control-label";
  text.textContent=label;
  applyTypeStyle(text,"Footnote/Medium");
  action.append(text);
  if(onClick)action.addEventListener("click",onClick);
  return action;
}
