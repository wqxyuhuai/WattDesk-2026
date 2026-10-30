// Service Ticket list and detail surfaces.
//
// This is a functional local preview: filtering, card creation, inline edits,
// replies, mentions and attachment previews operate on session data. It does
// not claim server-side permissions, persistence, uploads, notifications or
// ticket numbering. Those remain explicit API integration work.
import {applyTypeStyle} from "../../foundations/typography.js";
import {createTextElement as text} from "../../foundations/dom.js";
import {assetURL,createMaskedIcon,opaqueMaskURL} from "../../components/icons.js";
import {createAvatar} from "../../components/avatar.js";
import {createStandardButton} from "../../components/controls.js";
import {createSearchField} from "../../components/search-surface.js";
import {createScrollFeedback} from "../../components/scroll-feedback.js";
import {createPageHeader,createPageHeaderAction} from "../../components/page-header.js";
import {createTimeLabel} from "../../components/time-label.js";
import {mountPixelCard} from "../../components/pixel-card.js";
import {mountFlipCardInteraction} from "../../components/flip-card.js";
import {animateContentHeight,motionDuration,motionEasing,reducedMotion} from "../../foundations/motion.js";
import {
  menuHeading,
  menuList,
  menuNote,
  menuRow,
  mountMenu
} from "../../components/menu-popover.js";
import {
  CURRENT_USER,
  SERVICE_TICKETS,
  ticketById,
  userById,
  usersWithPlantAccess
} from "./data.js";
import {PLANTS,plantById} from "../plants/data.js";

const STATUS_META=Object.freeze({
  ongoing:{label:"Ongoing"},
  closed:{label:"Closed"}
});
const SCOPE_OPTIONS=Object.freeze([
  {id:"all",label:"All"},
  {id:"mentioned",label:"Mentioned me"},
  {id:"created",label:"Created by me"}
]);
const STATUS_FILTERS=Object.freeze([
  {id:"all",label:"All status"},
  {id:"ongoing",label:"Ongoing"},
  {id:"closed",label:"Closed"}
]);

let nextLocalTicket=1;

const cloneTickets=()=>JSON.parse(JSON.stringify(SERVICE_TICKETS));
const plantName=id=>plantById(id)?.name||"?";

function maskedPlus(){
  return createMaskedIcon(assetURL("plants/plus.svg"),"service-icon service-icon--14 wd-control-icon");
}

function maskedMore(){
  return createMaskedIcon(opaqueMaskURL("asset-70.svg"),"service-more-icon wd-control-icon");
}

function maskedSend(){
  return createMaskedIcon(assetURL("service-ticket/send-up.svg"),"service-icon service-icon--14 service-send-icon wd-control-icon");
}

function maskedSortArrow(){
  return createMaskedIcon(opaqueMaskURL("asset-14.svg"),"service-icon service-icon--14 service-sort-icon");
}

function maskedPaperclip(){
  return createMaskedIcon(assetURL("service-ticket/paperclip.svg"),"service-icon service-icon--14 wd-control-icon");
}

function maskedCancel(){
  return createMaskedIcon(assetURL("tab-close.svg"),"service-icon service-icon--14 wd-control-icon");
}

function maskedPlantDisclosure(){
  return createMaskedIcon(assetURL("disclosure.svg"),"service-icon service-property-plant-chevron");
}

function userAvatar(user,size=30){
  const avatar=createAvatar(user.initials,{size,className:"service-avatar"});
  avatar.setAttribute("aria-label",user.name);
  avatar.title=user.name;
  return avatar;
}

function excerpt(value,length=180){
  const compact=String(value||"").replace(/\s+/g," ").trim();
  return compact.length>length?`${compact.slice(0,length-1).trimEnd()}…`:compact;
}

function commentCount(ticket){
  return ticket.comments?.length||0;
}

function mentionedBy(ticket,userId){
  return Boolean(ticket.mentionedUserIds?.includes(userId)) ||
    Boolean(ticket.comments?.some(comment=>comment.mentionedUserIds?.includes(userId)));
}

function statusPill(status,{compact=false}={}){
  const meta=STATUS_META[status]||STATUS_META.ongoing;
  const node=text("span",`service-status service-status--${status}`);
  node.append(text("span","service-status-dot"));
  node.append(text("span","service-status-label",meta.label,compact?"Caption1/Regular":"Footnote/Medium"));
  return node;
}

function ticketNumberPill(number,{className=""}={}){
  return text(
    "span",
    ["service-card-number",className].filter(Boolean).join(" "),
    number,
    "Caption2/Emphasized"
  );
}

function metadataItem(label,value,className=""){
  const row=text("div",`service-meta-item ${className}`.trim());
  const content=value instanceof Node
    ? value
    : text("span","service-meta-value",value,"Footnote/Regular");
  row.append(text("span","service-meta-label",label,"Caption1/Regular"),content);
  return row;
}

function fillTextParagraphs(container,value){
  const source=String(value||"").replace(/\r\n?/g,"\n");
  if(!source)return;
  for(const paragraph of source.split(/\n{2,}/)){
    const block=text("p","service-text-paragraph");
    const lines=paragraph.split("\n");
    lines.forEach((line,index)=>{
      if(index)block.append(document.createElement("br"));
      if(line)block.append(document.createTextNode(line));
    });
    container.append(block);
  }
}

function paragraphBlock(value,className="service-body-text"){
  const body=text("div",className);
  fillTextParagraphs(body,value||"");
  applyTypeStyle(body,"Subheadline/Regular");
  return body;
}

function attachmentView(attachment,{compact=false}={}){
  const item=text("div",`service-attachment ${compact?"service-attachment--compact":""}`.trim());
  if(attachment.previewUrl&&attachment.kind==="image"){
    const image=document.createElement("img");
    image.className="service-attachment-image";
    image.src=attachment.previewUrl;
    image.alt=attachment.name||"Attachment preview";
    item.append(image);
  }else{
    const file=text("span","service-attachment-file");
    file.append(
      text("span","service-attachment-extension",String(attachment.name||"").split(".").pop()?.slice(0,4).toUpperCase()||"FILE"),
      text("span","service-attachment-name",attachment.name||"Attachment","Footnote/Medium")
    );
    item.append(file);
  }
  return item;
}

function attachmentList(attachments,{compact=false}={}){
  if(!attachments?.length)return null;
  const list=text("div",`service-attachment-list ${compact?"service-attachment-list--compact":""}`.trim());
  for(const attachment of attachments)list.append(attachmentView(attachment,{compact}));
  return list;
}

function makeAttachment(file,index){
  const previewUrl=file.type.startsWith("image/")?URL.createObjectURL(file):null;
  return {
    id:`local-attachment-${Date.now()}-${index}`,
    kind:file.type.startsWith("image/")?"image":"file",
    name:file.name,
    size:file.size,
    previewUrl,
    localFile:true
  };
}

export function createServiceTicketPage({
  glass,
  registerPanel,
  reposition,
  close,
  toast,
  onOpenTicket,
  onOpenNewTicket,
  onNewTicketPublished,
  onCancelNewTicket,
  onBackToList
}){
  const tickets=cloneTickets();
  const objectUrls=new Set();
  const dynamicSurfaces=new Set();
  const cardEffectCleanups=new Set();
  const replyScrollFeedbacks=new Set();
  let detailAlignmentObserver=null;
  const state={
    query:"",
    scope:"all",
    status:"all",
    newTicketDraft:null,
    editingTicket:false,
    ticketEdit:null,
    replyTargetId:null,
    replyDraft:null,
    commentDraft:null,
    editingCommentId:null,
    commentEdit:null,
    replySort:"asc"
  };

  function trackObjectUrl(url){
    if(url)objectUrls.add(url);
    return url;
  }

  function revokeObjectUrl(url){
    if(!url||!objectUrls.has(url))return;
    URL.revokeObjectURL(url);
    objectUrls.delete(url);
  }

  function standardButton(label,variant,className=""){
    const node=createStandardButton({
      label,
      variant,
      className,
      iconOnly:className.split(/\s+/).includes("wd-button--disc")
    });
    glass.addSurface({host:node,radius:18});
    dynamicSurfaces.add(node);
    return node;
  }

  function sweepDynamicSurfaces(){
    // The page constructor renders once before workspace.registerRouteView()
    // attaches the host to the document. Do not interpret that pre-mount state
    // as detached DOM and remove the freshly registered button material.
    if(!element.isConnected)return;
    for(const node of [...dynamicSurfaces]){
      if(node.isConnected)continue;
      glass.removeSurface(node);
      dynamicSurfaces.delete(node);
    }
    for(const record of [...replyScrollFeedbacks]){
      if(record.host.isConnected)continue;
      record.feedback.destroy();
      replyScrollFeedbacks.delete(record);
    }
  }

  function disposeCardEffects(){
    for(const cleanup of cardEffectCleanups)cleanup();
    cardEffectCleanups.clear();
  }

  function ticketFor(id){
    return tickets.find(ticket=>ticket.id===id)||null;
  }

  const element=text("section","service-view");
  element.id="service-view";
  element.hidden=true;
  element.setAttribute("aria-label","Service tickets");

  const listView=text("div","service-inner");
  const {element:header,actions:headerActions}=createPageHeader({
    breadcrumb:[{label:"Service ticket"}],
    className:"service-header",
    headingClassName:"service-heading"
  });
  const newButton=createPageHeaderAction({
    label:"New ticket",
    icon:maskedPlus(),
    className:"service-new-ticket"
  });
  headerActions.append(newButton);

  const toolbar=text("div","service-toolbar");
  const scopeBar=text("div","service-scope");
  scopeBar.setAttribute("role","tablist");
  scopeBar.setAttribute("aria-label","Ticket scope");
  const scopeButtons=new Map();
  for(const option of SCOPE_OPTIONS){
    const node=text("button","service-scope-button wd-control-state wd-press-scale");
    node.type="button";
    node.dataset.scope=option.id;
    node.setAttribute("role","tab");
    node.setAttribute("aria-selected",String(option.id===state.scope));
    node.append(text("span","wd-control-label",option.label,"Footnote/Medium"));
    node.addEventListener("click",()=>{
      state.scope=option.id;
      updateScopeButtons();
      renderList();
    });
    scopeButtons.set(option.id,node);
    scopeBar.append(node);
  }

  const toolbarSpacer=text("div","service-toolbar-spacer");
  const searchField=createSearchField({
    glass,
    placeholder:"Search tickets, plants or NO.",
    label:"Search service tickets",
    className:"service-search",
    size:"compact",
    scalable:true
  });
  searchField.input.addEventListener("input",()=>{
    state.query=searchField.input.value;
    renderList();
  });
  const statusTrigger=standardButton("All status","neutral","service-status-filter");
  statusTrigger.setAttribute("aria-haspopup","menu");
  const toolbarDivider=text("span","service-toolbar-divider");
  toolbarDivider.setAttribute("aria-hidden","true");
  toolbar.append(statusTrigger,toolbarDivider,scopeBar,toolbarSpacer,searchField.field);

  const board=text("div","service-board");
  const boardViewport=text("div","service-board-viewport");
  boardViewport.tabIndex=0;
  const boardContent=text("div","service-board-content");
  boardViewport.append(boardContent);
  board.append(boardViewport);
  const boardFeedback=createScrollFeedback({
    host:board,
    viewport:boardViewport,
    content:boardContent,
    bottomInset:10
  });

  const empty=text("div","service-empty");
  empty.hidden=true;
  const emptyTitle=text("p","service-empty-title","No tickets match this view","Title3/Emphasized");
  const emptyBody=text("p","service-empty-body",undefined,"Footnote/Regular");
  const emptyAction=standardButton("Clear filters","neutral","service-empty-action");
  empty.append(emptyTitle,emptyBody,emptyAction);

  listView.append(header,toolbar,board,empty);

  const detail=text("section","service-detail");
  detail.hidden=true;
  detail.setAttribute("aria-label","Service ticket detail");
  const detailHeaderHost=text("div","service-detail-header-host");
  const detailViewport=text("div","service-detail-viewport");
  detailViewport.tabIndex=0;
  const detailContent=text("div","service-detail-content");
  detailViewport.append(detailContent);
  detail.append(detailHeaderHost,detailViewport);
  const detailFeedback=createScrollFeedback({
    host:detail,
    viewport:detailViewport,
    content:detailContent,
    topInset:()=>detailHeaderHost.offsetHeight,
    bottomInset:10
  });

  element.append(listView,detail);

  function updateScopeButtons(){
    for(const [id,node] of scopeButtons){
      const selected=id===state.scope;
      node.setAttribute("aria-selected",String(selected));
      node.tabIndex=selected?0:-1;
      node.classList.toggle("is-selected",selected);
    }
  }

  function updateStatusTrigger(){
    const label=STATUS_FILTERS.find(option=>option.id===state.status)?.label||"All status";
    for(const existing of statusTrigger.querySelectorAll(":scope>.wd-control-label"))existing.remove();
    statusTrigger.append(text("span","service-status-filter-label wd-control-label",label,"Footnote/Medium"));
  }

  function openStatusMenu(){
    const panel=document.createElement("div");
    panel.className="popover popover--menu service-status-menu";
    const list=menuList();
    for(const option of STATUS_FILTERS){
      const row=menuRow(option.label,{checked:state.status===option.id});
      row.dataset.status=option.id;
      row.addEventListener("click",()=>{
        state.status=option.id;
        close(true);
        updateStatusTrigger();
        renderList();
      });
      list.append(row);
    }
    mountMenu(panel,{label:"Status",children:[menuHeading("Status"),list]});
    registerPanel(panel,statusTrigger,{label:"Status",radius:30,width:200,align:"start"});
  }

  statusTrigger.addEventListener("click",()=>{
    if(statusTrigger.getAttribute("aria-expanded")==="true")close();
    else openStatusMenu();
  });

  function visibleTickets(){
    const query=state.query.trim().toLocaleLowerCase();
    return tickets.filter(ticket=>{
      if(state.scope==="mentioned"&&!mentionedBy(ticket,CURRENT_USER.id))return false;
      if(state.scope==="created"&&ticket.authorId!==CURRENT_USER.id)return false;
      if(state.status!=="all"&&ticket.status!==state.status)return false;
      if(!query)return true;
      return [
        ticket.number,
        ticket.title,
        ticket.body,
        plantName(ticket.plantId),
        userById(ticket.authorId).name
      ].join(" ").toLocaleLowerCase().includes(query);
    }).sort((left,right)=>left.updatedMinutes-right.updatedMinutes);
  }

  function createCard(ticket){
    const author=userById(ticket.authorId);
    const card=text("article","service-card");
    card.dataset.ticketId=ticket.id;
    card.dataset.status=ticket.status;
    card.tabIndex=0;
    card.setAttribute("role","button");
    card.setAttribute("aria-label",`Open ${ticket.number}: ${ticket.title}`);

    const top=text("div","service-card-top");
    top.append(
      ticketNumberPill(ticket.number),
      statusPill(ticket.status,{compact:true})
    );

    const title=text("h3","service-card-title",ticket.title,"14/14 medium");
    const summary=text("p","service-card-summary",excerpt(ticket.body,150),"Footnote/Regular");
    const divider=text("div","service-card-divider");

    const footer=text("footer","service-card-footer");
    const identity=text("div","service-card-author");
    identity.append(userAvatar(author,24),text("span","service-card-author-name",author.name,"Caption1/Regular"));
    const activity=text("div","service-card-activity");
    activity.append(createTimeLabel(ticket.updatedMinutes,{ageMinutes:true,className:"service-card-time",typeStyle:"Caption1/Regular"}));
    footer.append(identity,activity);
    card.append(top,title,summary,divider,footer);
    cardEffectCleanups.add(mountPixelCard(card,{
      colors:["#ffffff","#ffffff","#f8fafc"],
      lightColors:["var(--wd-label-secondary)"],
      glowColor:"#ffffff",
      gap:5,
      pixelSize:1,
      speed:35,
      revealDuration:600,
      spotlight:.72,
      glow:.58,
      opacity:.48,
      fade:.35
    }));
    cardEffectCleanups.add(mountFlipCardInteraction(card,{
      tiltMax:12,
      glareOpacity:.22,
      hoverScale:1.03,
      perspective:1100,
      stiffness:170,
      damping:20
    }));

    const open=()=>onOpenTicket?.(ticket);
    card.addEventListener("click",open);
    card.addEventListener("keydown",event=>{
      if(event.key!=="Enter"&&event.key!==" ")return;
      event.preventDefault();
      open();
    });
    return card;
  }

  function createAttachmentEditor(items,onChange,{label="Add image or file",compact=false}={}){
    const root=text("div","service-attachment-editor");
    const filesWrap=text("div","service-attachment-editor-list");
    const input=document.createElement("input");
    input.type="file";
    input.multiple=true;
    input.hidden=true;
    const add=compact
      ?standardButton(label,"neutral","service-reply-action service-attachment-trigger wd-button--disc")
      :text("button","service-text-button wd-control-state");
    if(compact){
      for(const item of add.querySelectorAll(":scope>.wd-control-label"))item.remove();
      add.prepend(maskedPaperclip());
    }else{
      add.type="button";
      add.setAttribute("aria-label",label);
      add.append(text("span","wd-control-label",label,"Footnote/Medium"));
    }
    add.addEventListener("click",()=>input.click());
    input.addEventListener("change",()=>{
      const additions=[...input.files||[]].map((file,index)=>{
        const attachment=makeAttachment(file,index);
        trackObjectUrl(attachment.previewUrl);
        return attachment;
      });
      const next=[...(root._attachments||[]),...additions];
      root._attachments=next;
      onChange(next);
      renderFiles();
      input.value="";
    });

    function renderFiles(){
      const attachments=root._attachments||[];
      filesWrap.replaceChildren();
      for(const attachment of attachments){
        const item=attachmentView(attachment,{compact:true});
        const remove=text("button","service-attachment-remove wd-control-state","Remove","Caption1/Regular");
        remove.type="button";
        remove.setAttribute("aria-label",`Remove ${attachment.name}`);
        remove.addEventListener("click",()=>{
          revokeObjectUrl(attachment.previewUrl);
          const next=attachments.filter(item=>item.id!==attachment.id);
          root._attachments=next;
          onChange(next);
          renderFiles();
        });
        item.append(remove);
        filesWrap.append(item);
      }
    }

    root._attachments=items.slice();
    root.triggerButton=add;
    if(compact)root.append(filesWrap,input);
    else root.append(filesWrap,add,text("span","service-editor-note","Files stay in this preview session until upload APIs are connected.","Caption1/Regular"),input);
    renderFiles();
    return root;
  }

  function readReplyEditor(editor){
    const blocks=[...editor.children].filter(node=>node.matches("div,p"));
    if(blocks.length){
      return blocks.map(block=>{
        const clone=block.cloneNode(true);
        clone.querySelectorAll("br").forEach(br=>br.replaceWith(document.createTextNode("\n")));
        return clone.textContent;
      }).join("\n\n").replace(/\n+$/,"");
    }
    return editor.innerText.replace(/\n+$/,"");
  }

  function writeReplyEditor(editor,value){
    const source=String(value||"").replace(/\r\n?/g,"\n");
    editor.replaceChildren();
    if(source){
      for(const paragraph of source.split(/\n{2,}/)){
        const block=document.createElement("div");
        const lines=paragraph.split("\n");
        lines.forEach((line,index)=>{
          if(index)block.append(document.createElement("br"));
          if(line)block.append(document.createTextNode(line));
        });
        editor.append(block);
      }
    }
    editor.dataset.empty=String(!source);
  }

  function insertParagraphAtCaret(editor){
    const selection=window.getSelection();
    if(!selection?.rangeCount)return;
    let range=selection.getRangeAt(0);
    const anchor=range.startContainer.nodeType===Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement;
    let block=anchor?.closest("div,p");
    if(block===editor||!block||!editor.contains(block)){
      block=document.createElement("div");
      while(editor.firstChild)block.append(editor.firstChild);
      editor.append(block);
      range=document.createRange();
      range.selectNodeContents(block);
      range.collapse(false);
    }
    const nextBlock=document.createElement("div");
    const tail=range.cloneRange();
    tail.selectNodeContents(block);
    tail.setStart(range.endContainer,range.endOffset);
    nextBlock.append(tail.extractContents());
    block.after(nextBlock);
    const caret=document.createRange();
    caret.selectNodeContents(nextBlock);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    editor.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertParagraph"}));
  }

  function insertPlainTextAtCaret(editor,value){
    const textValue=String(value||"").replace(/\r\n?/g,"\n").replace(/\u00a0/g," ").replace(/\u200b/g,"");
    if(!textValue)return;
    editor.focus();
    if(!readReplyEditor(editor).trim()){
      editor.replaceChildren();
      const emptyBlock=document.createElement("div");
      editor.append(emptyBlock);
      const emptyRange=document.createRange();
      emptyRange.selectNodeContents(emptyBlock);
      emptyRange.collapse(true);
      const emptySelection=window.getSelection();
      emptySelection.removeAllRanges();
      emptySelection.addRange(emptyRange);
    }
    const selection=window.getSelection();
    if(!selection?.rangeCount){
      editor.append(document.createTextNode(textValue));
      return;
    }
    let range=selection.getRangeAt(0);
    const anchor=range.startContainer.nodeType===Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement;
    let block=anchor?.closest("div,p");
    if(block===editor||!block||!editor.contains(block)){
      block=document.createElement("div");
      while(editor.firstChild)block.append(editor.firstChild);
      editor.append(block);
      range=document.createRange();
      range.selectNodeContents(block);
      range.collapse(false);
    }
    range.deleteContents();
    const paragraphs=textValue.split(/\n{2,}/);
    const insertLines=(target,paragraph)=>{
      const fragment=document.createDocumentFragment();
      paragraph.split("\n").forEach((line,index)=>{
        if(index)fragment.append(document.createElement("br"));
        if(line)fragment.append(document.createTextNode(line));
      });
      if(!fragment.childNodes.length)fragment.append(document.createElement("br"));
      const last=fragment.lastChild;
      target.insertNode(fragment);
      const after=document.createRange();
      after.setStartAfter(last);
      after.collapse(true);
      return after;
    };
    range=insertLines(range,paragraphs.shift()||"");
    for(const paragraph of paragraphs){
      const nextBlock=document.createElement("div");
      const nextRange=document.createRange();
      nextRange.selectNodeContents(nextBlock);
      const placed=insertLines(nextRange,paragraph);
      block.after(nextBlock);
      block=nextBlock;
      range=placed;
    }
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertFromPaste",data:textValue}));
  }

  function createReplyInput(value,{label,placeholder}){
    const input=document.createElement("div");
    input.className="service-reply-input";
    input.contentEditable="true";
    input.setAttribute("role","textbox");
    input.setAttribute("aria-label",label);
    input.setAttribute("aria-multiline","true");
    input.setAttribute("aria-placeholder",placeholder);
    input.spellcheck=true;
    input.dataset.placeholder=placeholder;
    applyTypeStyle(input,"Subheadline/Regular");
    Object.defineProperty(input,"value",{
      configurable:true,
      get:()=>readReplyEditor(input),
      set:next=>writeReplyEditor(input,next)
    });
    input.value=value;
    input.addEventListener("keydown",event=>{
      if(event.key!=="Enter"||event.shiftKey||event.metaKey||event.ctrlKey||event.altKey)return;
      event.preventDefault();
      insertParagraphAtCaret(input);
    });
    input.addEventListener("paste",event=>{
      const plain=event.clipboardData?.getData("text/plain")||"";
      const html=plain?"":event.clipboardData?.getData("text/html")||"";
      const fallback=html?new DOMParser().parseFromString(html,"text/html").body.textContent:"";
      event.preventDefault();
      insertPlainTextAtCaret(input,plain||fallback);
    });
    return input;
  }

  function removeTrailingAt(editor){
    if(!editor.isContentEditable){
      if(editor.value.endsWith("@"))editor.setRangeText("",editor.value.length-1,editor.value.length,"end");
      return;
    }
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
    let node=walker.nextNode(),last=null;
    while(node){last=node;node=walker.nextNode();}
    if(last?.nodeValue.endsWith("@"))last.nodeValue=last.nodeValue.slice(0,-1);
  }

  function mentionPicker(anchor,plantId,onPick){
    const candidates=usersWithPlantAccess(plantId).filter(user=>user.id!==CURRENT_USER.id);
    const panel=document.createElement("div");
    panel.className="popover popover--menu service-mention-menu";
    const list=menuList();
    if(candidates.length){
      for(const user of candidates){
        const row=menuRow(user.name);
        row.addEventListener("click",()=>{
          close(true);
          onPick(user);
        });
        list.append(row);
      }
    }else{
      list.append(menuNote("No other users can access this plant."));
    }
    mountMenu(panel,{label:"Mention someone",children:[menuHeading("Mention someone"),list]});
    registerPanel(panel,anchor,{label:"Mention someone",radius:30,width:240,align:"start"});
  }

  function insertMention(textarea,user,mentions){
    mentions.add(user.id);
    const prefix=textarea.value&&!/\s$/.test(textarea.value)?" ":"";
    const value=`${prefix}@${user.name} `;
    if(textarea.isContentEditable){
      textarea.focus();
      const selection=window.getSelection();
      const range=selection?.rangeCount?selection.getRangeAt(0):null;
      if(range){
        range.deleteContents();
        const node=document.createTextNode(value);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }else{
        textarea.append(document.createTextNode(value));
      }
      textarea.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText"}));
      return;
    }
    const start=textarea.selectionStart??textarea.value.length;
    const end=textarea.selectionEnd??start;
    textarea.setRangeText(value,start,end,"end");
    textarea.dispatchEvent(new Event("input",{bubbles:true}));
    textarea.focus();
  }

  function renderList(){
    sweepDynamicSurfaces();
    disposeCardEffects();
    updateScopeButtons();
    updateStatusTrigger();
    newButton.hidden=false;
    const previousScroll=boardViewport.scrollTop;
    const rows=visibleTickets();
    boardContent.replaceChildren();
    let total=rows.length;
    const grid=text("div","service-card-grid");
    for(const ticket of rows)grid.append(createCard(ticket));
    if(grid.childElementCount)boardContent.append(grid);

    const isEmpty=total===0;
    const hasFilter=Boolean(state.query)||state.scope!=="all"||state.status!=="all";
    board.hidden=isEmpty;
    empty.hidden=!isEmpty;
    if(isEmpty){
      emptyTitle.textContent=hasFilter?"No tickets match this view":"No service tickets yet";
      emptyBody.textContent=hasFilter
        ?"Try another ticket number, plant, status or scope."
        :"Create a ticket to start a conversation with the service team.";
      emptyAction.hidden=!hasFilter;
    }
    requestAnimationFrame(()=>{
      boardViewport.scrollTop=previousScroll;
      boardFeedback.sync();
      detailFeedback.sync();
    });
  }

  emptyAction.addEventListener("click",()=>{
    state.query="";
    state.scope="all";
    state.status="all";
    searchField.input.value="";
    renderList();
  });

  newButton.addEventListener("click",()=>{
    close(true);
    onOpenNewTicket?.();
  });

  function postAuthorLabel(ticket,authorId){
    const labels=[];
    if(authorId===ticket.authorId)labels.push("POSTER");
    if(authorId===CURRENT_USER.id)labels.push("YOU");
    return labels;
  }

  function commentDepthRoot(comment,ticket){
    if(!comment.parentId)return comment.id;
    const parent=ticket.comments.find(item=>item.id===comment.parentId);
    return parent?.parentId?commentDepthRoot(parent,ticket):comment.parentId;
  }

  function contentOffset(element){
    if(!element)return 0;
    return element.getBoundingClientRect().top-detailViewport.getBoundingClientRect().top+detailViewport.scrollTop;
  }

  function animateTicketEditEnter(threadOffset){
    const actions=detailContent.querySelector(".service-ticket-edit .service-inline-editor-actions");
    const thread=detailContent.querySelector(".service-thread");
    if(reducedMotion())return;
    const duration=motionDuration("--wd-motion-panel");
    const easing=motionEasing("--wd-ease-panel");
    if(thread){
      const baselineDelta=threadOffset-contentOffset(thread);
      if(Math.abs(baselineDelta)>1){
        thread.animate(
          [{transform:`translateY(${baselineDelta}px)`},{transform:"translateY(0)"}],
          {duration,easing}
        );
      }
    }
    [...(actions?.children||[])].forEach((button,index)=>{
      button.animate(
        [{opacity:0},{opacity:1}],
        {
          duration:motionDuration("--wd-motion-hover"),
          delay:index*motionDuration("--wd-motion-stagger"),
          easing:motionEasing("--wd-ease-hover"),
          fill:"backwards"
        }
      );
    });
  }

  async function animateTicketEditExit(editor,threadOffset){
    const actions=editor?.querySelector(".service-inline-editor-actions");
    const thread=detailContent.querySelector(".service-thread");
    if(!editor||reducedMotion())return;
    const animations=[];
    const actionItems=[...(actions?.children||[])].reverse();
    actionItems.forEach((button,index)=>{
      animations.push(button.animate(
        [{opacity:1},{opacity:0}],
        {
          duration:motionDuration("--wd-motion-hover-out"),
          delay:index*motionDuration("--wd-motion-stagger"),
          easing:motionEasing("--wd-ease-hover-out"),
          fill:"forwards"
        }
      ));
    });
    if(thread){
      const baselineDelta=threadOffset-contentOffset(thread);
      if(Math.abs(baselineDelta)>1){
        animations.push(thread.animate(
          [{transform:"translateY(0)"},{transform:`translateY(${baselineDelta}px)`}],
          {duration:motionDuration("--wd-motion-panel"),easing:motionEasing("--wd-ease-panel"),fill:"forwards"}
        ));
      }
    }
    await Promise.allSettled(animations.map(animation=>animation.finished));
  }

  function openPlantPicker(anchor,draft,onSelect){
    const panel=document.createElement("div");
    panel.className="popover plants-panel plants-filter-flyout service-plant-picker";
    panel.style.setProperty("--plants-filter-check-mask",`url("${assetURL("tickle.svg")}")`);
    const content=text("div","plants-filter-flyout-content wd-filter-menu");
    const header=text("header","plants-filter-secondary-header");
    const heading=menuHeading("Plant");
    heading.classList.add("plants-filter-secondary-title");
    const selectionCount=text(
      "span",
      "plants-filter-selection-count",
      draft.plantId?"1 selected":"",
      "Caption2/Regular"
    );
    selectionCount.setAttribute("role","status");
    header.append(heading,selectionCount);
    const field=createSearchField({
      glass,
      placeholder:"Search plants",
      label:"Search plants",
      className:"plants-filter-search-field",
      size:"compact",
      scalable:true
    });
    const body=text("div","plants-filter-options is-company service-plant-picker-options");
    body.setAttribute("role","group");
    body.setAttribute("aria-label","Plants");

    function choosePlant(plant){
      draft.plantId=plant.id;
      selectionCount.textContent="1 selected";
      onSelect?.();
      close();
      requestAnimationFrame(()=>anchor.focus({preventScroll:true}));
    }

    function renderOptions(){
      const query=field.input.value.trim().toLocaleLowerCase();
      const matches=PLANTS.filter(plant=>
        !query||[plant.name||"?",plant.sn||""].join(" ").toLocaleLowerCase().includes(query)
      );
      body.replaceChildren(...matches.map(plant=>{
        const row=text("div","plants-filter-company-row service-plant-option");
        row.dataset.option=plant.id;
        const spacer=text("span","plants-filter-company-toggle-spacer");
        spacer.setAttribute("aria-hidden","true");
        const selection=text("input","plants-filter-checkbox service-plant-selection");
        selection.type="checkbox";
        selection.value=plant.id;
        selection.checked=draft.plantId===plant.id;
        selection.setAttribute("aria-label",plant.name||"?");
        selection.addEventListener("change",()=>choosePlant(plant));
        const choice=text("button","plants-filter-condition-choice plants-filter-company-choice wd-control-state");
        choice.type="button";
        choice.append(text("span","plants-filter-condition-label wd-control-label",plant.name||"?","Footnote/Medium"));
        choice.title=plant.sn?`${plant.name||"?"} · ${plant.sn}`:plant.name||"?";
        choice.addEventListener("click",()=>choosePlant(plant));
        row.append(spacer,selection,choice);
        return row;
      }));
      if(!matches.length)body.append(text("p","plants-filter-empty","No plants match this search.","Footnote/Regular"));
      scrollFeedback?.sync();
      reposition?.();
    }

    field.input.addEventListener("input",renderOptions);
    content.append(header,field.field,body);
    panel.append(content);
    panel._wdFade=content;
    let scrollFeedback=createScrollFeedback({
      host:content,
      viewport:body,
      content:body,
      topInset:()=>body.offsetTop+4,
      bottomInset:()=>content.clientHeight-body.offsetTop-body.clientHeight+4
    });
    const previousClose=panel._onClose;
    panel._onClose=()=>{
      try{previousClose?.();}
      finally{
        scrollFeedback?.destroy();
        scrollFeedback=null;
        glass.removeSurface(field.field);
      }
    };
    renderOptions();
    registerPanel(panel,anchor,{
      label:"Select a plant",
      radius:24,
      width:288,
      align:"end",
      id:"service-new-ticket-plant-options"
    });
    requestAnimationFrame(()=>field.input.focus({preventScroll:true}));
  }

  function createNewTicketProperties(draft){
    const aside=text("aside","service-properties wd-discussion-card service-new-ticket-properties");
    aside.setAttribute("aria-label","New ticket properties");
    aside.append(text("h2","service-properties-title","Properties","Footnote/Emphasized"));

    const statusRow=text("div","service-property-row service-property-row--status");
    statusRow.append(text("span","service-property-label","Status","Caption1/Regular"),statusPill("ongoing"));
    aside.append(statusRow);

    const plantTrigger=text("button","service-property-plant-trigger wd-control-state");
    plantTrigger.type="button";
    plantTrigger.setAttribute("aria-haspopup","dialog");
    const plantValue=text("span","service-meta-value service-property-plant-value",undefined,"Footnote/Regular");
    plantTrigger.append(plantValue,maskedPlantDisclosure());
    const syncPlant=()=>{
      const plant=plantById(draft.plantId);
      const label=plant?.name||"Select a plant";
      plantValue.textContent=label;
      plantValue.classList.toggle("is-placeholder",!plant);
      plantTrigger.title=plant?`${plant.name}${plant.sn?` · ${plant.sn}`:""}`: "Select a plant";
      plantTrigger.setAttribute("aria-label",plant?`Related plant: ${plant.name}`:"Select a related plant");
    };
    syncPlant();
    plantTrigger.addEventListener("click",()=>{
      if(plantTrigger.getAttribute("aria-expanded")==="true")close();
      else openPlantPicker(plantTrigger,draft,syncPlant);
    });
    const plantItem=text("div","service-meta-item service-meta-item--plant");
    plantItem.append(
      text("span","service-meta-label","Plant","Caption1/Regular"),
      plantTrigger
    );
    aside.append(plantItem);

    const authorValue=text("span","service-meta-author");
    authorValue.append(
      userAvatar(CURRENT_USER,22),
      text("span","service-meta-value",CURRENT_USER.name,"Footnote/Regular")
    );
    aside.append(
      metadataItem("Author",authorValue,"service-meta-item--author"),
      metadataItem("Created",createTimeLabel(0,{ageMinutes:true,className:"service-meta-value",typeStyle:"Footnote/Regular"})),
      metadataItem("Last activity",createTimeLabel(0,{ageMinutes:true,className:"service-meta-value",typeStyle:"Footnote/Regular"})),
      metadataItem("Replies","0")
    );
    return {aside,plantTrigger,syncPlant};
  }

  function renderTicketEditor(ticket,{isNew=false,plantPicker=null}={}){
    const edit=state.ticketEdit;
    const wrap=text("div",`service-ticket-edit${isNew?" service-ticket-edit--new":""}`);
    const titleInput=document.createElement("textarea");
    titleInput.className="service-detail-title-input";
    titleInput.rows=1;
    titleInput.wrap="soft";
    titleInput.value=edit.title;
    titleInput.placeholder=isNew?"What needs attention?":"";
    titleInput.setAttribute("aria-label","Ticket title");
    titleInput.spellcheck=true;
    const resizeTitle=(animate=false)=>{
      const previousHeight=titleInput.getBoundingClientRect().height;
      titleInput.style.height="auto";
      animateContentHeight(titleInput,Math.max(25,titleInput.scrollHeight),{from:previousHeight,animate});
    };
    titleInput.addEventListener("keydown",event=>{
      if(event.key==="Enter")event.preventDefault();
    });
    titleInput.addEventListener("input",()=>{
      const normalized=titleInput.value.replace(/\s*\r?\n\s*/g," ");
      if(normalized!==titleInput.value){
        titleInput.value=normalized;
        titleInput.setSelectionRange(normalized.length,normalized.length);
      }
      edit.title=titleInput.value;
      resizeTitle(true);
    });

    const body=document.createElement("textarea");
    body.className="service-ticket-body-input";
    body.value=edit.body;
    body.rows=1;
    applyTypeStyle(body,"Subheadline/Regular");
    body.placeholder=isNew?"Describe the issue and what you have already checked.":"";
    body.setAttribute("aria-label","Ticket description");
    const resizeBody=(animate=false)=>{
      const previousHeight=body.getBoundingClientRect().height;
      body.style.height="auto";
      animateContentHeight(body,body.scrollHeight,{from:previousHeight,animate});
    };
    body.addEventListener("input",()=>{
      edit.body=body.value;
      resizeBody(true);
      if(body.value.endsWith("@")){
        mentionPicker(body,isNew?edit.plantId:ticket.plantId,user=>{
          if(body.value.endsWith("@"))body.setRangeText("",body.value.length-1,body.value.length,"end");
          insertMention(body,user,edit.mentions);
        });
      }
    });
    const attachments=createAttachmentEditor(edit.attachments,next=>{edit.attachments=next;},{compact:true});
    const actions=text("div","service-inline-editor-actions");
    const cancel=standardButton("Cancel","neutral");
    const save=standardButton(isNew?"Publish ticket":"Save changes","primary");
    let exiting=false;
    async function finishEditing(commit){
      if(exiting)return;
      if(commit){
        edit.title=titleInput.value;
        edit.body=body.value;
        if(!edit.title.trim()||!edit.body.trim()||(isNew&&!edit.plantId)){
          toast(isNew?"Add a title, description and related plant before publishing":"Title and description are required");
          if(!edit.title.trim())titleInput.focus();
          else if(!edit.body.trim())body.focus();
          else plantPicker?.plantTrigger?.focus();
          return;
        }
      }
      exiting=true;
      wrap.inert=true;
      if(isNew&&!commit){
        for(const attachment of edit.attachments)revokeObjectUrl(attachment.previewUrl);
        state.ticketEdit=null;
        state.newTicketDraft=null;
        onCancelNewTicket?.();
        return;
      }
      if(isNew&&commit){
        const created={
          id:`st-local-${Date.now()}-${nextLocalTicket++}`,
          number:`NO.${String(Date.now()).slice(-8)}`,
          title:edit.title.trim(),
          body:edit.body.trim(),
          status:"ongoing",
          plantId:edit.plantId,
          authorId:CURRENT_USER.id,
          createdMinutes:0,
          updatedMinutes:0,
          mentionedUserIds:[...edit.mentions],
          attachments:edit.attachments,
          comments:[]
        };
        tickets.unshift(created);
        state.ticketEdit=null;
        state.newTicketDraft=null;
        toast("Ticket published in this local preview");
        onNewTicketPublished?.(created);
        renderDetail(created.id);
        return;
      }
      await animateTicketEditExit(wrap,edit.threadOffset);
      if(commit){
        ticket.title=edit.title.trim();
        ticket.body=edit.body.trim();
        ticket.attachments=edit.attachments;
        ticket.mentionedUserIds=[...edit.mentions];
        ticket.updatedMinutes=0;
      }
      state.editingTicket=false;
      state.ticketEdit=null;
      if(commit)toast("Ticket updated in this local preview");
      renderDetail(ticket.id,{keepScroll:true});
    }
    cancel.addEventListener("click",()=>finishEditing(false));
    save.addEventListener("click",()=>finishEditing(true));
    actions.append(attachments.triggerButton,cancel,save);
    wrap.append(titleInput,body);
    wrap.append(attachments,actions);
    requestAnimationFrame(()=>{
      resizeTitle();
      resizeBody();
      if(isNew)titleInput.focus({preventScroll:true});
    });
    return wrap;
  }

  function renderMoreMenu(anchor,ticket){
    const panel=document.createElement("div");
    panel.className="popover popover--menu service-more-menu";
    const list=menuList();
    const edit=menuRow("Edit ticket");
    edit.addEventListener("click",()=>{
      close(true);
      const threadOffset=contentOffset(detailContent.querySelector(".service-thread"));
      state.editingTicket=true;
      state.ticketEdit={
        title:ticket.title,
        body:ticket.body,
        attachments:ticket.attachments.slice(),
        mentions:new Set(ticket.mentionedUserIds||[]),
        threadOffset
      };
      renderDetail(ticket.id,{keepScroll:true,afterRender:()=>{
        const titleInput=detailContent.querySelector(".service-detail-title-input");
        titleInput?.focus({preventScroll:true});
        titleInput?.setSelectionRange(titleInput.value.length,titleInput.value.length);
        animateTicketEditEnter(threadOffset);
      }});
    });
    list.append(edit);
    if(ticket.authorId===CURRENT_USER.id&&!state.editingTicket){
      const remove=menuRow("Delete ticket");
      remove.addEventListener("click",()=>{
        close(true);
        if(!confirm("Delete this ticket from the local preview?"))return;
        const index=tickets.findIndex(item=>item.id===ticket.id);
        if(index>=0)tickets.splice(index,1);
        toast("Ticket deleted from this local preview");
        onBackToList?.();
      });
      list.append(remove);
    }
    mountMenu(panel,{label:"Ticket actions",children:[list]});
    registerPanel(panel,anchor,{label:"Ticket actions",radius:30,width:200,align:"start"});
  }

  function renderCommentMoreMenu(anchor,ticket,comment,actions){
    const panel=document.createElement("div");
    panel.className="popover popover--menu service-comment-menu";
    const list=menuList();
    const edit=menuRow("Edit");
    edit.addEventListener("click",()=>{
      close(true);
      state.replyTargetId=null;
      state.replyDraft=null;
      state.editingCommentId=comment.id;
      state.commentEdit={
        body:comment.body,
        attachments:comment.attachments.slice(),
        mentions:new Set(comment.mentionedUserIds||[])
      };
      renderDetail(ticket.id,{keepScroll:true,afterRender:()=>{
        detailContent.querySelector(`#${comment.id} .service-reply-input`)?.focus();
      }});
    });
    const remove=menuRow("Delete");
    remove.addEventListener("click",()=>{
      close(true);
      if(!confirm("Delete this reply from the local preview?"))return;
      const index=ticket.comments.findIndex(item=>item.id===comment.id);
      if(index>=0)ticket.comments.splice(index,1);
      for(const item of ticket.comments){
        if(item.replyToId===comment.id)item.replyToId=null;
      }
      ticket.updatedMinutes=0;
      toast("Reply deleted from this local preview");
      renderDetail(ticket.id,{keepScroll:true});
    });
    list.append(edit,remove);
    mountMenu(panel,{label:"Reply actions",children:[list]});
    const previousClose=panel._onClose;
    panel._onClose=()=>{
      actions.classList.remove("is-menu-open");
      previousClose?.();
    };
    actions.classList.add("is-menu-open");
    registerPanel(panel,anchor,{label:"Reply actions",radius:30,width:200,align:"start"});
  }

  function renderReplyEditor(ticket,{mode,targetId=null,commentId=null,threadId=null,initial=null,showAvatar=true,onCancel,onSubmit}){
    const edit=initial;
    const inline=Boolean(commentId||threadId);
    const row=text("div",`service-reply-editor ${inline?"service-reply-editor--inline":"service-reply-editor--standalone"}`);
    if(!inline)row.classList.add("wd-control-state","wd-discussion-card");
    if(commentId)row.id=commentId;
    if(threadId)row.dataset.replyThread=threadId;
    row.dataset.editor=mode==="edit"?"reply-edit":"reply-create";
    const compose=text("div","service-reply-editor-compose");
    const body=createReplyInput(edit.body,{
      label:mode==="edit"?"Edit reply":"Write a reply",
      placeholder:mode==="edit"?"Edit reply…":targetId?"Leave a reply…":"Leave a comment…"
    });
    const inputHost=text("div","service-reply-input-host");
    inputHost.append(body);
    const editorScrollFeedback=createScrollFeedback({
      host:inputHost,
      viewport:body,
      elastic:false
    });
    replyScrollFeedbacks.add({host:inputHost,feedback:editorScrollFeedback});
    const inlineBodyMin=mode==="edit"&&!showAvatar?20:28;
    const resizeBody=(animate=false)=>{
      const previousHeight=body.getBoundingClientRect().height;
      body.style.height="auto";
      animateContentHeight(
        body,
        Math.min(180,Math.max(inline?inlineBodyMin:32,body.scrollHeight)),
        {from:previousHeight,animate}
      );
      editorScrollFeedback.sync();
    };
    const attachments=createAttachmentEditor(edit.attachments,next=>{
      edit.attachments=next;
      syncActions();
    },{compact:true});
    const actions=text("div","service-editor-actions");
    actions.append(attachments.triggerButton);
    if(mode==="edit"&&inline&&onCancel){
      const cancel=standardButton("Cancel","neutral","service-reply-action service-reply-cancel wd-button--disc");
      for(const item of cancel.querySelectorAll(":scope>.wd-control-label"))item.remove();
      cancel.prepend(maskedCancel());
      cancel.addEventListener("click",onCancel);
      actions.append(cancel);
    }
    const submit=standardButton(mode==="edit"?"Save reply":"Send reply","neutral","service-reply-action service-reply-send wd-button--disc");
    for(const item of submit.querySelectorAll(":scope>.wd-control-label"))item.remove();
    submit.prepend(maskedSend());
    submit.addEventListener("click",()=>{
      edit.body=body.value;
      if(!edit.body.trim()&&!edit.attachments.length){
        toast("Write a reply or add an attachment");
        body.focus();
        return;
      }
      onSubmit(edit);
    });
    actions.append(submit);
    const editorBar=text("div","service-reply-editor-bar");
    editorBar.append(actions);
    compose.append(inputHost,attachments,editorBar);
    if(inline&&showAvatar)row.append(userAvatar(CURRENT_USER,28),compose);
    else row.append(compose);
    if(inline&&!showAvatar)row.classList.add("service-reply-editor--body-only");

    function syncActions(){
      const hasContent=Boolean(body.value.trim()||edit.attachments.length);
      submit.disabled=!hasContent;
      submit.classList.toggle("wd-button--primary",hasContent);
      submit.classList.toggle("wd-button--neutral",!hasContent);
    }

    body.addEventListener("input",()=>{
      edit.body=body.value;
      body.dataset.empty=String(!edit.body.trim());
      resizeBody(true);
      syncActions();
      if(body.value.endsWith("@")){
        mentionPicker(body,ticket.plantId,user=>{
          removeTrailingAt(body);
          insertMention(body,user,edit.mentions);
        });
      }
    });
    body.addEventListener("wheel",event=>{
      const maxScroll=Math.max(0,body.scrollHeight-body.clientHeight);
      if(maxScroll<=0)return;
      const atStart=body.scrollTop<=0;
      const atEnd=body.scrollTop>=maxScroll-1;
      if((event.deltaY<0&&atStart)||(event.deltaY>0&&atEnd))return;
      event.preventDefault();
      body.scrollTop+=event.deltaY;
      editorScrollFeedback.sync();
    },{passive:false});
    body.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&onCancel){
        event.preventDefault();
        onCancel();
      }
      if((event.metaKey||event.ctrlKey)&&event.key==="Enter"&&!submit.disabled){
        event.preventDefault();
        submit.click();
      }
    });
    syncActions();
    requestAnimationFrame(()=>{
      resizeBody();
      if(inline)body.focus();
    });
    return row;
  }

  function renderComment(ticket,comment,{nested=false}={}){
    const editing=state.editingCommentId===comment.id&&state.commentEdit;
    const author=userById(comment.authorId);
    const own=comment.authorId===CURRENT_USER.id;
    const node=text("article",`service-comment ${nested?"service-comment--nested":""} ${own?"service-comment--own":""}`.trim());
    node.id=comment.id;
    const head=text("header","service-comment-head");
    const who=text("div","service-comment-author");
    who.append(userAvatar(author,28),text("span","service-comment-name",author.name,"Footnote/Emphasized"));
    for(const label of postAuthorLabel(ticket,comment.authorId)){
      who.append(text("span",`service-user-badge service-user-badge--${label.toLowerCase()}`,label,"Caption2/Regular"));
    }
    if(comment.replyToId){
      const target=ticket.comments.find(item=>item.id===comment.replyToId);
      if(target){
        const reply=text("a","service-reply-context",`Replying to ${userById(target.authorId).name}`,"Caption1/Regular");
        reply.href=`#${target.id}`;
        who.append(reply);
      }
    }
    let actions=null;
    if(own&&!editing){
      node.classList.add("wd-hover-reveal-host");
      actions=text("div","service-comment-actions wd-hover-reveal");
      const more=standardButton("Reply actions","neutral","service-comment-more wd-button--disc");
      for(const item of more.querySelectorAll(":scope>.wd-control-label"))item.remove();
      more.prepend(maskedMore());
      more.setAttribute("aria-haspopup","menu");
      more.addEventListener("click",()=>{
        if(more.getAttribute("aria-expanded")==="true")close(true);
        else renderCommentMoreMenu(more,ticket,comment,actions);
      });
      actions.append(more);
    }
    const commentTime=createTimeLabel(comment.createdMinutes,{ageMinutes:true,className:"service-comment-time",typeStyle:"Caption1/Regular"});
    commentTime.textContent+=comment.edited?" · Edited":"";
    head.append(who,commentTime);
    if(actions)head.append(actions);
    node.append(head);
    if(editing){
      const editor=renderReplyEditor(ticket,{
        mode:"edit",
        targetId:comment.replyToId,
        threadId:comment.id,
        showAvatar:false,
        initial:state.commentEdit,
        onCancel:()=>{
          state.editingCommentId=null;
          state.commentEdit=null;
          renderDetail(ticket.id,{keepScroll:true});
        },
        onSubmit:edit=>{
          if(!edit.body.trim()&&!edit.attachments.length)return;
          comment.body=edit.body.trim();
          comment.attachments=edit.attachments;
          comment.mentionedUserIds=[...edit.mentions];
          comment.edited=true;
          state.editingCommentId=null;
          state.commentEdit=null;
          ticket.updatedMinutes=0;
          toast("Reply updated in this local preview");
          renderDetail(ticket.id,{keepScroll:true});
        }
      });
      editor.classList.add("service-comment-edit");
      node.append(editor);
      return node;
    }
    node.append(paragraphBlock(comment.body,"service-comment-body"));
    const files=attachmentList(comment.attachments);
    if(files)node.append(files);
    return node;
  }

  function renderThread(ticket){
    const section=text("section","service-thread");
    section.setAttribute("aria-labelledby","service-activity-title");
    const head=text("header","service-thread-header");
    head.append(text("h2","service-thread-title","Activity","Title3/Emphasized"));
    head.querySelector("h2").id="service-activity-title";
    const sort=text("button","service-text-button service-sort-button wd-control-state");
    sort.type="button";
    sort.dataset.sort=state.replySort;
    sort.append(text("span","wd-control-label",state.replySort==="asc"?"Oldest first":"Newest first","Footnote/Medium"));
    sort.append(maskedSortArrow());
    sort.addEventListener("click",()=>{
      state.replySort=state.replySort==="asc"?"desc":"asc";
      renderDetail(ticket.id,{keepScroll:true});
    });
    head.append(sort);

    const comments=ticket.comments.slice();
    const roots=comments.filter(comment=>!comment.parentId)
      .sort((a,b)=>state.replySort==="asc"?b.createdMinutes-a.createdMinutes:a.createdMinutes-b.createdMinutes);
    const list=text("div","service-thread-list");
    for(const root of roots){
      const card=text("article","service-thread-card wd-discussion-card");
      card.dataset.threadId=root.id;
      card.append(renderComment(ticket,root));
      const replies=comments.filter(comment=>comment.parentId===root.id)
        .sort((a,b)=>b.createdMinutes-a.createdMinutes);
      if(replies.length){
        const children=text("div","service-thread-replies");
        for(const comment of replies)children.append(renderComment(ticket,comment,{nested:true}));
        card.append(children);
      }
      if(ticket.status==="ongoing"){
        const target=state.replyTargetId?ticket.comments.find(comment=>comment.id===state.replyTargetId):null;
        const targetThread=target?commentDepthRoot(target,ticket):null;
        if(targetThread===root.id){
          if(!state.replyDraft)state.replyDraft={body:"",attachments:[],mentions:new Set()};
          card.append(renderReplyEditor(ticket,{
            mode:"create",
            targetId:target.id,
            threadId:root.id,
            initial:state.replyDraft,
            onCancel:()=>{
              state.replyTargetId=null;
              state.replyDraft=null;
              renderDetail(ticket.id,{keepScroll:true});
            },
            onSubmit:edit=>{
              if(!edit.body.trim()&&!edit.attachments.length)return;
              addReply(ticket,{
                body:edit.body.trim(),
                attachments:edit.attachments,
                mentions:edit.mentions,
                targetId:target.id
              });
            }
          }));
        }else{
          const prompt=text("button","service-thread-reply-prompt wd-control-state");
          prompt.type="button";
          prompt.setAttribute("aria-label",`Reply to ${userById(root.authorId).name}`);
          prompt.append(userAvatar(CURRENT_USER,28),text("span","service-thread-reply-prompt-label","Reply to this thread…","Subheadline/Regular"));
          prompt.addEventListener("click",()=>{
            state.replyTargetId=root.id;
            state.replyDraft={body:"",attachments:[],mentions:new Set()};
            renderDetail(ticket.id,{keepScroll:true,afterRender:()=>{
              detailContent.querySelector(`[data-reply-thread="${root.id}"] .service-reply-input`)?.focus();
            }});
          });
          card.append(prompt);
        }
      }
      list.append(card);
    }
    if(!roots.length)list.append(text("p","service-thread-empty","No replies yet. Start the conversation above.","Footnote/Regular"));
    let globalComposer=null;
    if(ticket.status==="ongoing"){
      if(!state.commentDraft)state.commentDraft={body:"",attachments:[],mentions:new Set()};
      globalComposer=renderReplyEditor(ticket,{
        mode:"create",
        targetId:null,
        initial:state.commentDraft,
        onCancel:()=>{
          state.commentDraft=null;
          renderDetail(ticket.id,{keepScroll:true});
        },
        onSubmit:edit=>{
          if(!edit.body.trim()&&!edit.attachments.length)return;
          addReply(ticket,{
            body:edit.body.trim(),
            attachments:edit.attachments,
            mentions:edit.mentions,
            targetId:null
          });
        }
      });
    }
    if(globalComposer)section.append(globalComposer);
    section.append(head);
    section.append(list);
    if(ticket.status==="closed"){
      const closed=text("div","service-closed-note");
      closed.append(
        text("span","service-closed-title","This ticket is closed.","Footnote/Emphasized"),
        text("span","service-closed-copy","Reopen it to add another reply.","Footnote/Regular")
      );
      section.append(closed);
    }
    return section;
  }

  function addReply(ticket,{body,attachments,mentions,targetId}){
    const target=ticket.comments.find(comment=>comment.id===targetId)||null;
    const parentId=target?commentDepthRoot(target,ticket):null;
    const id=`c-local-${Date.now()}`;
    ticket.comments.push({
      id,
      authorId:CURRENT_USER.id,
      parentId,
      replyToId:target?.id||null,
      body,
      createdMinutes:0,
      mentionedUserIds:[...mentions],
      attachments
    });
    ticket.updatedMinutes=0;
    state.replyDraft=null;
    state.replyTargetId=null;
    state.commentDraft=null;
    renderDetail(ticket.id,{keepScroll:false,afterRender:()=>{
      requestAnimationFrame(()=>{
        detailViewport.scrollTo({top:detailViewport.scrollHeight,behavior:"auto"});
        document.getElementById(id)?.focus?.();
      });
    }});
    toast("Reply added to the local preview");
  }

  function renderDetailHeader(ticket,{newTicket=false}={}){
    const {element:header,actions}=createPageHeader({
      breadcrumb:[
        {label:"Service ticket",onClick:()=>onBackToList?.()},
        {label:newTicket?"New ticket":ticket?.number||"Ticket not found"}
      ],
      className:"service-detail-header",
      headingClassName:"service-detail-heading"
    });
    actions.hidden=!actions.childElementCount;
    detailHeaderHost.replaceChildren(header);
  }

  function renderDetail(ticketId,{keepScroll=false,afterRender=null}={}){
    const previousScroll=keepScroll?detailViewport.scrollTop:0;
    const newTicket=ticketId==="new";
    const ticket=newTicket?null:ticketFor(ticketId);
    detailAlignmentObserver?.disconnect();
    detailAlignmentObserver=null;
    const attachPropertiesRail=(main,aside)=>{
      detailContent.append(main,aside);
      const alignProperties=()=>{
        if(innerWidth<=980){
          aside.style.marginTop="0";
          aside.style.removeProperty("--service-properties-sticky-top");
          return;
        }
        const anchor=detailContent.querySelector(".service-detail-title,.service-detail-title-input")||main;
        aside.style.marginTop=`${Math.max(0,anchor.getBoundingClientRect().top-main.getBoundingClientRect().top)}px`;
        const viewportTop=detailViewport.getBoundingClientRect().top;
        const stickyTop=Math.max(0,anchor.getBoundingClientRect().top-viewportTop+detailViewport.scrollTop);
        aside.style.setProperty("--service-properties-sticky-top",`${stickyTop}px`);
      };
      detailAlignmentObserver=new ResizeObserver(()=>requestAnimationFrame(alignProperties));
      detailAlignmentObserver.observe(main);
      detailAlignmentObserver.observe(detailContent);
      requestAnimationFrame(alignProperties);
    };
    detail.classList.toggle("service-detail--new-ticket",newTicket);
    renderDetailHeader(ticket,{newTicket});
    detailContent.replaceChildren();
    sweepDynamicSurfaces();
    if(newTicket){
      if(!state.newTicketDraft){
        state.newTicketDraft={
          title:"",
          body:"",
          plantId:"",
          attachments:[],
          mentions:new Set(),
          threadOffset:0
        };
      }
      state.ticketEdit=state.newTicketDraft;
      const properties=createNewTicketProperties(state.newTicketDraft);
      const main=text("main","service-detail-main service-new-ticket-main");
      main.append(renderTicketEditor(null,{isNew:true,plantPicker:properties}));
      attachPropertiesRail(main,properties.aside);
      detailFeedback.sync();
      requestAnimationFrame(()=>{
        detailViewport.scrollTop=previousScroll;
        afterRender?.();
        sweepDynamicSurfaces();
      });
      return;
    }
    if(!ticket){
      const missing=text("div","service-detail-missing");
      missing.append(
        text("p","service-detail-kicker","Service ticket","Caption1/Emphasized"),
        text("h1","service-detail-missing-title","Ticket not found","Title2/Emphasized"),
        text("p","service-detail-missing-copy","The ticket may have been removed or you may not have access to its plant.","Footnote/Regular")
      );
      detailContent.append(missing);
      detailFeedback.sync();
      requestAnimationFrame(()=>detailViewport.scrollTop=0);
      return;
    }

    const main=text("main","service-detail-main");

    if(state.editingTicket&&state.ticketEdit){
      main.append(renderTicketEditor(ticket));
    }else{
      const titleRow=text("div","service-detail-title-row");
      const title=text("h1","service-detail-title",ticket.title,"Title3/Emphasized");
      titleRow.append(title);
      if(ticket.authorId===CURRENT_USER.id){
        const more=standardButton("Ticket actions","neutral","service-more-button wd-button--disc");
        for(const label of more.querySelectorAll(":scope>.wd-control-label"))label.remove();
        more.prepend(maskedMore());
        more.setAttribute("aria-haspopup","menu");
        more.addEventListener("click",()=>{
          if(more.getAttribute("aria-expanded")==="true")close();
          else renderMoreMenu(more,ticket);
        });
        titleRow.append(more);
      }
      main.append(titleRow);
      const paper=text("article","service-ticket-paper");
      paper.append(paragraphBlock(ticket.body));
      const files=attachmentList(ticket.attachments);
      if(files)paper.append(files);
      main.append(paper);
    }

    main.append(renderThread(ticket));

    const aside=text("aside","service-properties wd-discussion-card");
    aside.setAttribute("aria-label","Ticket properties");
    aside.append(text("h2","service-properties-title","Properties","Footnote/Emphasized"));
    const ticketIdRow=text("div","service-property-row service-property-row--ticket-id");
    ticketIdRow.append(
      text("span","service-property-label","Ticket ID","Caption1/Regular"),
      ticketNumberPill(ticket.number,{className:"service-properties-number"})
    );
    aside.append(ticketIdRow);
    const statusRow=text("div","service-property-row service-property-row--status");
    statusRow.append(text("span","service-property-label","Status","Caption1/Regular"),statusPill(ticket.status));
    aside.append(statusRow);
    const authorValue=text("span","service-meta-author");
    authorValue.append(
      userAvatar(userById(ticket.authorId),22),
      text("span","service-meta-value",userById(ticket.authorId).name,"Footnote/Regular")
    );
    aside.append(
      metadataItem("Plant",plantName(ticket.plantId)),
      metadataItem("Author",authorValue,"service-meta-item--author"),
      metadataItem("Created",createTimeLabel(ticket.createdMinutes,{ageMinutes:true,className:"service-meta-value",typeStyle:"Footnote/Regular"})),
      metadataItem("Last activity",createTimeLabel(ticket.updatedMinutes,{ageMinutes:true,className:"service-meta-value",typeStyle:"Footnote/Regular"})),
      metadataItem("Replies",String(commentCount(ticket)))
    );
    if((CURRENT_USER.role==="service"||ticket.authorId===CURRENT_USER.id)&&!state.editingTicket){
      const toggle=standardButton(ticket.status==="ongoing"?"Mark as closed":"Reopen ticket","neutral","service-status-toggle");
      toggle.addEventListener("click",()=>{
        if(!confirm(ticket.status==="ongoing"?"Mark this ticket as closed?":"Reopen this ticket?"))return;
        ticket.status=ticket.status==="ongoing"?"closed":"ongoing";
        ticket.updatedMinutes=0;
        if(ticket.status==="closed"){
          state.replyTargetId=null;
          state.replyDraft=null;
          state.commentDraft=null;
        }
        state.editingCommentId=null;
        state.commentEdit=null;
        toast(`Ticket ${ticket.status==="closed"?"closed":"reopened"} in this local preview`);
        renderDetail(ticket.id,{keepScroll:true});
      });
      aside.append(toggle);
    }

    attachPropertiesRail(main,aside);
    detailFeedback.sync();
    requestAnimationFrame(()=>{
      detailViewport.scrollTop=previousScroll;
      afterRender?.();
      sweepDynamicSurfaces();
    });
  }

  function show(params={}){
    element.hidden=false;
    close(true);
    if(params?.newTicket){
      listView.hidden=true;
      detail.hidden=false;
      state.editingTicket=false;
      state.editingCommentId=null;
      state.commentEdit=null;
      state.replyTargetId=null;
      state.replyDraft=null;
      state.commentDraft=null;
      renderDetail("new");
      return;
    }
    const ticketId=params?.ticketId;
    if(ticketId){
      listView.hidden=true;
      detail.hidden=false;
      state.editingTicket=false;
      state.ticketEdit=null;
      state.editingCommentId=null;
      state.commentEdit=null;
      state.replyTargetId=null;
      state.replyDraft=null;
      state.commentDraft=null;
      renderDetail(ticketId);
      return;
    }
    detail.hidden=true;
    listView.hidden=false;
    renderList();
  }

  updateScopeButtons();
  updateStatusTrigger();
  renderList();
  requestAnimationFrame(()=>{
    boardFeedback.sync();
    detailFeedback.sync();
  });

  return {
    element,
    show,
    snapshot(){
      return {
        listScrollTop:boardViewport.scrollTop,
        detailScrollTop:detailViewport.scrollTop
      };
    },
    restore(snapshot={}){
      const apply=()=>{
        boardViewport.scrollTop=snapshot.listScrollTop??0;
        detailViewport.scrollTop=snapshot.detailScrollTop??0;
        boardFeedback.sync();
        detailFeedback.sync();
      };
      apply();
      requestAnimationFrame(()=>requestAnimationFrame(apply));
    },
    hide(){
      close(true);
      detailAlignmentObserver?.disconnect();
      detailAlignmentObserver=null;
      element.hidden=true;
    },
    ticketTitle(id){
      return ticketFor(id)?.title||"";
    }
  };
}
