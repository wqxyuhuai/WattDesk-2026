import {button} from "../components/controls.js";
import {iconAsset,createIcon} from "../components/icons.js";
import {makeNavRow} from "../components/navigation.js";
import {bindDisclosure} from "../components/disclosure.js";
import {applyTypeStyle} from "../foundations/typography.js";
import {createAvatar} from "../components/avatar.js";
import {createWorkspaceTabs} from "../components/workspace-tabs.js";
import {createShortcutKeycaps} from "../components/search-surface.js";
export function createAppShell({sidebar,header,workspacePanelId}){
 sidebar.replaceChildren();header.replaceChildren();
 sidebar.classList.add("target-sidebar");header.classList.add("target-header");
 const top=document.createElement("div");top.className="target-sidebar-top";
 const brand=document.createElement("div");brand.className="target-brand";brand.setAttribute("aria-label","WattDesk");brand.innerHTML='<img src="./home-assets/logo.svg" width="32" height="32" alt="WattDesk">';
 top.append(brand);
 const history=button("Recent activity","target-icon-button target-history");history.append(createIcon("history"));
 const back=button("Go back","target-icon-button target-back");back.append(createIcon("forward"));
 const forward=button("Go forward","target-icon-button target-forward");forward.append(createIcon("forward"));
 // There is no navigation history before the first tab is active.
 back.disabled=true;forward.disabled=true;
 top.append(history,back,forward);sidebar.append(top);
 const search=button("Quick search","target-quick-search");search.append(createIcon("search"),Object.assign(document.createElement("span"),{textContent:"Quick search"}));
 const shortcut=createShortcutKeycaps("target-shortcut");search.append(shortcut);
 sidebar.append(search);
 const nav=document.createElement("nav");nav.className="target-sidebar-nav";nav.setAttribute("aria-label","Workspace navigation");
 const workspace=document.createElement("section");workspace.className="target-primary-nav";
 workspace.append(makeNavRow("Home","home","asset-5.svg","active"),makeNavRow("Plants","plants","asset-6.svg","","color"),makeNavRow("Service ticket","service","asset-7.svg","","color"),makeNavRow("Statistics (coming soon)","statistics","statistics.svg","","color"));nav.append(workspace);
 function category(label,key,rows,expanded=true){
  const section=document.createElement("section");section.className=`target-nav-section target-${key}`;
  const heading=button(label,"target-section-heading");heading.append(Object.assign(document.createElement("span"),{textContent:label}));
  const disclosure=createIcon("disclosure");disclosure.classList.add("target-disclosure","wd-disclosure-icon");heading.append(disclosure);
  const content=document.createElement("div");content.className="target-subnav";content.id=`${key}-items`;content.append(...rows);
  heading.setAttribute("aria-expanded",String(expanded));heading.setAttribute("aria-controls",content.id);
  content.hidden=!expanded;content.inert=!expanded;
  bindDisclosure(heading,content);section.append(heading,content);nav.append(section);
 }
 category("Device tool","device",[makeNavRow("Cell balance","cell","cell-balance.svg","","color"),makeNavRow("Module balance","module","module-balance.svg","","color"),makeNavRow("Device track","track","device-track.svg","","color")]);
 category("Teams","teams",[makeNavRow("Wattsonic Technology","org","organisation.svg","","color"),makeNavRow("Your teams","your-teams","teams.svg","","color"),makeNavRow("End users","end-users","user.svg","","color")],false);
 sidebar.append(nav);
 const footer=document.createElement("div");footer.className="target-sidebar-footer";
 const user=button("Account menu","target-account",'<span class="target-avatar">CW</span><span class="target-account-copy"><strong>Carl Wang <span class="target-account-arrow"><img src="./home-assets/account-arrows.svg" width="16" height="16" alt=""></span></strong><em>Organisation admin</em></span>');
 user.firstElementChild.replaceWith(createAvatar("CW",{className:"target-avatar"}));
 const notifications=button("Notifications","target-icon-button target-notifications");notifications.append(createIcon("notifications"));footer.append(user,notifications);sidebar.append(footer);

 const tabs=document.createElement("div");tabs.className="target-main-tabs";
 const add=button("Add tab","target-add-tab");add.append(createIcon("add"));
 tabs.append(add);header.append(tabs);
 const workspaceTabs=createWorkspaceTabs({container:tabs,addButton:add,createIcon,panelId:workspacePanelId,onEmpty:()=>chromeRef?.onEmpty?.()});
 let chromeRef=null;

 const actions=document.createElement("div");actions.className="target-header-actions";
 const language=button("Language","target-header-action");language.append(createIcon("language"));language.dataset.targetAction="language";
 const theme=button("Toggle light and dark mode","target-header-action target-theme");const moon=createIcon("moon");moon.classList.add("theme-moon");const sun=createIcon("sun");sun.classList.add("theme-sun");theme.append(moon,sun);theme.dataset.targetAction="theme";
 const settings=button("Settings","target-header-action");settings.append(createIcon("settings"));settings.dataset.targetAction="settings";
 const support=button("Support","target-header-action");support.append(createIcon("support"));support.dataset.targetAction="support";actions.append(language,theme,settings,support);header.append(actions);
 const chrome={sidebar,header,search,user,notifications,language,theme,settings,support,history,back,forward,tabs,workspaceTabs,add};
 chromeRef=chrome;
// Bind semantic chrome to the same named styles as the Figma instances.
for(const el of document.querySelectorAll('.target-nav,.target-quick-search,.target-avatar'))applyTypeStyle(el,"14/14 medium");
for(const el of document.querySelectorAll('.target-section-heading'))applyTypeStyle(el,"Caption1/Emphasized");
for(const el of document.querySelectorAll('.target-shortcut kbd'))applyTypeStyle(el,"Footnote/Regular");
applyTypeStyle(chrome.user.querySelector('strong'),"Footnote/Emphasized");
applyTypeStyle(chrome.user.querySelector('em'),"Caption2/Regular");
chrome.user.querySelector('.target-avatar').classList.add('wd-avatar');
 return chrome;
}
