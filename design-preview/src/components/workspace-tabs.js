import {applyTypeStyle} from "../foundations/typography.js";
import {classifyCornerProfile} from "../foundations/geometry.js";
import {assetURL,isNeutralIconFile,opaqueMaskURL} from "./icons.js";
import {motionDuration,motionEasing} from "../foundations/motion.js";

const MAX_TAB_WIDTH = 180;
const MIN_TAB_WIDTH = 58;
const TITLE_MAX_LENGTH = 28;

function capTitle(value) {
  const clean = String(value || "").trim();
  return [...clean].slice(0, TITLE_MAX_LENGTH).join("");
}

export function createWorkspaceTabs({
  container,
  addButton,
  createIcon,
  onSelect = null,
  onBeforeSelect = null,
  onClose = null,
  onMount = null,
  onUnmount = null,
  captureState = () => null,
  restoreState = () => null,
  onEmpty = null,
  mountTab = null
}) {
  // The page assigns its state callbacks after the shell constructs this
  // component, so keep mutable references instead of freezing constructor
  // defaults into every later interaction.
  let selectHandler = onSelect;
  let beforeSelectHandler = onBeforeSelect;
  let closeHandler = onClose;
  let mountHandler = onMount;
  let unmountHandler = onUnmount;
  let captureHandler = captureState;
  let restoreHandler = restoreState;
  let emptyHandler = onEmpty;
  let tabMountHandler = mountTab;
  const list = document.createElement("div");
  list.className = "workspace-tab-list";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Workspace tabs");

  const tooltip = document.createElement("div");
  tooltip.className = "workspace-tab-tooltip wd-glass--surface wd-glass-popup";
  tooltip.id = "workspace-tab-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  // Keep the label separate from the glass material. Assigning textContent on
  // the host would remove the mounted .wd-glass-material child.
  const tooltipText = document.createElement("span");
  tooltipText.className = "wd-tooltip-text";
  tooltip.append(tooltipText);
  let glass = null;
  let tooltipMounted = false;

  let tabs = [];
  let activeId = null;
  let tooltipTimer = 0;
  let resizeFrame = 0;
  let tooltipFrame = 0;
  let tooltipTab = null;
  let pointerInsideList = false;
  let widthsFrozen = false;
  let frozenTabWidth = "";
  let frozenWidths = new Map();
  let frozenSpacer = null;
  let frozenScrollLeft = 0;
  const closing = new WeakSet();

  container.classList.add("workspace-tabs");
  container.prepend(list);
  list.after(addButton);
  container.append(tooltip);

  function setGlass(material) {
    if (!material) return;
    glass = material;
    // The shell exists before the page creates its material. Mount the
    // tooltip lazily, once, so every tab tooltip inherits the shared Glass
    // Surface without the shell importing a second material.
    if (!tooltipMounted) {
      glass.addSurface({host: tooltip, radius: 12, interactive: false});
      tooltipMounted = true;
    }
  }

  const titleOf = state => capTitle(state.title || "Home");
  const labelOf = tab => tab.querySelector(".workspace-tab-label");
  const overflowOf = tab => {
    const label = labelOf(tab);
    return !!label && label.scrollWidth > label.clientWidth + 1;
  };

  function hideTooltip() {
    tooltipTab = null;
    tooltip.hidden = true;
    for (const tab of tabs) tab.removeAttribute("aria-describedby");
  }

  // A tooltip is anchored to its tab, not to the viewport. Re-measure on every
  // scroll and viewport change just like the shared popover controller; tab
  // strips can scroll horizontally inside the page, so a one-time rect would
  // leave the label floating over the wrong tab.
  function positionTooltip() {
    const tab = tooltipTab;
    if (!tab || !tab.isConnected || !overflowOf(tab)) {
      hideTooltip();
      return;
    }
    const rect = tab.getBoundingClientRect();
    const visibleWidth = Math.min(rect.right, innerWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
    if (rect.width <= 0 || rect.height <= 0 ||
        visibleWidth * visibleHeight < rect.width * rect.height * 0.5) {
      hideTooltip();
      return;
    }
    Object.assign(tooltip.style, {
      left: Math.max(8, Math.min(innerWidth - tooltip.offsetWidth - 8, rect.left + rect.width / 2 - tooltip.offsetWidth / 2)) + "px",
      top: rect.bottom + 8 + "px"
    });
  }

  function scheduleTooltip() {
    if (tooltipFrame || tooltip.hidden) return;
    tooltipFrame = requestAnimationFrame(() => {
      tooltipFrame = 0;
      positionTooltip();
    });
  }

  function updateTooltip(tab) {
    if (!tab || !overflowOf(tab)) {
      hideTooltip();
      return;
    }
    tooltipTab = tab;
    tooltipText.textContent = titleOf(tab._state);
    tooltip.hidden = false;
    positionTooltip();
    if (!tooltip.hidden) tab.setAttribute("aria-describedby", tooltip.id);
  }

  // A route change can rename the tab while its tooltip is open. Re-read the
  // stored title and re-measure rather than leaving stale text over the tab.
  function refreshTooltip(tab) {
    if (tooltipTab !== tab) return;
    if (!overflowOf(tab)) {
      hideTooltip();
      return;
    }
    tooltipText.textContent = titleOf(tab._state);
    positionTooltip();
  }

  function updateOverflow(tab) {
    tab.classList.toggle("has-overflow", overflowOf(tab));
  }

  function resolveTabWidth(count = tabs.length) {
    const styles = getComputedStyle(list);
    const gap = parseFloat(styles.gap) || 5;
    const addGap = parseFloat(getComputedStyle(container).gap) || 5;
    const addWidth = addButton.offsetWidth || 28;
    const available = Math.max(0, container.clientWidth - addWidth - addGap);
    const safeCount = Math.max(1, count);
    const naturalWidth = (available - (safeCount - 1) * gap) / safeCount;
    return {
      gap,
      naturalWidth,
      width: Math.min(MAX_TAB_WIDTH, Math.max(MIN_TAB_WIDTH, naturalWidth))
    };
  }

  function layout() {
    if (widthsFrozen) {
      applyFrozenLayout();
      for (const tab of tabs) updateOverflow(tab);
      return frozenTabWidth;
    }
    const {naturalWidth, width} = resolveTabWidth();
    // Once the natural slots reach the available lane, fill the lane so the
    // Add button stays pinned to the right edge while a new tab unfolds.
    list.classList.toggle("is-slot-filled", tabs.length > 1 && naturalWidth <= MAX_TAB_WIDTH + 0.01);
    list.style.setProperty("--workspace-tab-width", width + "px");
    // Once the tabs no longer fit at the readable minimum, keep that width and
    // scroll the strip instead of squeezing labels into illegibility.
    const overflow = tabs.length > 1 && naturalWidth < MIN_TAB_WIDTH;
    list.classList.toggle("is-overflowing", overflow);
    if (overflow) {
      const active = tabs.find(tab => tab._state.id === activeId);
      const left = active?.offsetLeft ?? 0;
      const right = left + (active?.offsetWidth ?? 0);
      if (left < list.scrollLeft) list.scrollLeft = left;
      else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
    } else if (list.scrollLeft !== 0) {
      list.scrollLeft = 0;
    }
    for (const tab of tabs) updateOverflow(tab);
    return width + "px";
  }

  function applyFrozenLayout() {
    if (!frozenTabWidth) return;
    list.style.setProperty("--workspace-tab-width", frozenTabWidth);
    for (const tab of tabs) {
      const frozen = frozenWidths.get(tab);
      if (!frozen) continue;
      tab.style.flexBasis = frozen + "px";
      tab.style.width = frozen + "px";
      tab.style.maxWidth = frozen + "px";
      tab.style.minWidth = frozen + "px";
    }
  }

  function freezeWidths() {
    if (widthsFrozen) return;
    widthsFrozen = true;
    frozenTabWidth = getComputedStyle(list).getPropertyValue("--workspace-tab-width").trim() || `${tabs[0]?.offsetWidth || MAX_TAB_WIDTH}px`;
    frozenWidths = new Map();
    for (const tab of tabs) {
      // The workspace can be scaled; freeze the layout width, not the
      // on-screen rectangle, otherwise the strip shrinks under the pointer.
      frozenWidths.set(tab, tab.offsetWidth);
    }
    applyFrozenLayout();
  }

  function releaseFrozenWidths() {
    if (!widthsFrozen) return;
    widthsFrozen = false;
    frozenTabWidth = "";
    for (const tab of tabs) {
      tab.style.removeProperty("flex-basis");
      tab.style.removeProperty("width");
      tab.style.removeProperty("max-width");
      tab.style.removeProperty("min-width");
    }
    frozenWidths.clear();
    frozenSpacer?.remove();
    frozenSpacer = null;
    frozenScrollLeft = 0;
    scheduleLayout();
  }

  function reserveFrozenSlot(tab) {
    const styles = getComputedStyle(list);
    const gap = parseFloat(styles.gap) || 5;
    frozenScrollLeft = list.scrollLeft;
    if (!frozenSpacer) {
      frozenSpacer = document.createElement("div");
      frozenSpacer.className = "workspace-tab-freeze-spacer";
      frozenSpacer.setAttribute("aria-hidden", "true");
      list.append(frozenSpacer);
    }
    const removed = tab.offsetWidth + (tabs.length > 1 ? gap : 0);
    const reserved = (parseFloat(frozenSpacer.style.width) || 0) + removed;
    frozenSpacer.style.setProperty("--workspace-freeze-width", reserved + "px");
  }

  function scheduleLayout() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(layout);
  }

  function createRouteIcon(file) {
    const icon = document.createElement("span");
    icon.className = "workspace-tab-icon";
    if (isNeutralIconFile(file)) icon.classList.add("is-neutral-icon");
    const mono = document.createElement("span");
    mono.className = "workspace-tab-icon-layer workspace-tab-icon-mono";
    const maskSource = isNeutralIconFile(file) ? opaqueMaskURL(file) : assetURL(file);
    mono.style.setProperty("--icon-mask", `url("${maskSource}")`);
    const color = document.createElement("span");
    color.className = "workspace-tab-icon-layer workspace-tab-icon-color";
    const image = document.createElement("img");
    image.src = `./home-assets/${file}`;
    image.alt = "";
    image.draggable = false;
    color.append(image);
    icon.append(color, mono);
    return icon;
  }

  function createHomeIcon() {
    const icon = document.createElement("span");
    icon.className = "workspace-tab-icon";
    const mono = createIcon("home");
    mono.classList.add("workspace-tab-icon-layer", "workspace-tab-icon-mono");
    icon.append(mono);
    return icon;
  }

  function build(state) {
    const title = titleOf(state);
    const tab = document.createElement("div");
    tab.className = "wd-control-state target-tab workspace-tab";
    tab._state = {...state, title};
    tab.dataset.tabId = state.id;
    tab.dataset.kind = state.kind;
    tab.id = `workspace-tab-${state.id}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("aria-controls", "home-workspace-panel");
    if (state.kind === "home") tab.setAttribute("aria-label", "Home tab");
    tab.tabIndex = -1;

    const icon = state.iconFile ? createRouteIcon(state.iconFile) : createHomeIcon();
    const label = document.createElement("span");
    label.className = "workspace-tab-label wd-control-label";
    label.textContent = title;

    const action = document.createElement("span");
    action.className = "workspace-tab-action";
    action.setAttribute("aria-hidden", "true");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "workspace-tab-close";
    close.tabIndex = -1;
    close.setAttribute("aria-label", `Close ${title} tab`);
    const closeIcon = document.createElement("span");
    closeIcon.className = "workspace-tab-close-icon";
    close.append(closeIcon);

    action.append(close);
    tab.append(icon, label, action);
    applyTypeStyle(tab, "14/14 medium");
    closeIcon.style.setProperty("--icon-mask", `url("${new URL("../../home-assets/tab-close.svg", import.meta.url).href}")`);
    classifyCornerProfile(tab);

    close.addEventListener("click", event => {
      event.stopPropagation();
      closeTab(tab);
    });
    close.addEventListener("pointerdown", event => event.stopPropagation());
    close.addEventListener("focus", () => updateTooltip(tab));
    close.addEventListener("blur", hideTooltip);

    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", event => {
      if (event.target !== tab) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(tab);
      }
    });
    tab.addEventListener("pointerenter", () => {
      clearTimeout(tooltipTimer);
      tooltipTimer = setTimeout(() => updateTooltip(tab), 320);
    });
    tab.addEventListener("pointerleave", () => {
      clearTimeout(tooltipTimer);
      hideTooltip();
    });
    tab.addEventListener("focus", () => updateTooltip(tab));
    tab.addEventListener("blur", () => {
      if (document.activeElement !== tab) hideTooltip();
    });
    tab.addEventListener("keydown", event => {
      if (event.target !== tab) return;
      const index = tabs.indexOf(tab);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(index + direction + tabs.length) % tabs.length];
        activate(next);
        next?.focus();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        closeTab(tab);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const target = event.key === "Home" ? tabs[0] : tabs.at(-1);
        activate(target);
        target?.focus();
      }
    });

    tabMountHandler?.(tab, tab._state);
    mountHandler?.(tab, tab._state);
    return tab;
  }

  function captureCurrent() {
    const tab = tabs.find(item => item._state.id === activeId);
    if (!tab) return;
    const snapshot = captureHandler();
    if (snapshot !== undefined) tab._state.snapshot = snapshot;
  }

  function syncSelected(tab) {
    const closable = tabs.length > 1;
    for (const item of tabs) {
      const selected = item === tab;
      item.classList.toggle("selected", selected);
      item.classList.toggle("muted", !selected);
      item.classList.toggle("is-last-tab", !closable);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      const close = item.querySelector(".workspace-tab-close");
      close.tabIndex = selected && closable ? 0 : -1;
      close.setAttribute("aria-hidden", selected && closable ? "false" : "true");
      close.disabled = !closable;
    }
  }

  function activate(tab, {restore = true} = {}) {
    if (!tab) return;
    if (tab._state.id === activeId) {
      selectHandler?.(tab._state, tab);
      return;
    }
    beforeSelectHandler?.(tab._state, tab);
    captureCurrent();
    activeId = tab._state.id;
    syncSelected(tab);
    if (restore) restoreHandler?.(tab._state.snapshot);
    selectHandler?.(tab._state, tab);
    hideTooltip();
  }

  const entranceProperties = ["flex-basis", "width", "padding-left", "padding-right", "opacity", "translate", "margin-left"];

  function prepareEntrance(tab, gap) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // Pin the new slot to zero before it is connected. Setting this after
    // insertion lets a layout read in the same task expose the final slot to
    // the next paint on slower frames.
    tab.classList.add("is-entering");
    Object.assign(tab.style, {
      flexBasis: "0px",
      width: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      marginLeft: `-${gap}px`,
      opacity: "0",
      translate: "-4px 0"
    });
    return true;
  }

  function animateIn(tab, width, siblings, prepared, gap) {
    if (!prepared) {
      for (const sibling of siblings) sibling.classList.remove("is-resizing");
      return;
    }
    // Commit the zero-width starting point before the first rendered frame.
    tab.getBoundingClientRect();
    // Animate the flex slot as well as the visual width. The strip and the Add
    // button then move continuously instead of snapping by one tab slot.
    const animation = tab.animate(
      [
        {flexBasis: "0px", width: "0px", paddingLeft: "0px", paddingRight: "0px", marginLeft: `-${gap}px`, opacity: 0, translate: "-4px 0"},
        {flexBasis: width, width, paddingLeft: "14px", paddingRight: "14px", marginLeft: "0px", opacity: 1, translate: "0 0"}
      ],
      {duration: motionDuration("--wd-motion-tab-in"), easing: motionEasing("--wd-ease-tab-in")}
    );
    // The WAAPI keyframes now own the zero start; dropping the inline pins at
    // the same style change keeps the final slot from being transitioned in.
    for (const property of entranceProperties) tab.style.removeProperty(property);
    animation.finished.catch(() => {}).finally(() => {
      tab.classList.remove("is-entering");
      for (const sibling of siblings) sibling.classList.remove("is-resizing");
    });
  }

  function add(state) {
    const siblings = [...tabs];
    const tab = build(state);
    // Resolve the slot for the post-insertion count before the tab enters the
    // document. Otherwise the browser paints one frame at the old average and
    // the entrance animation starts from the wrong width.
    const {gap, width: slotWidth} = resolveTabWidth(tabs.length + 1);
    const width = widthsFrozen ? frozenTabWidth : `${slotWidth}px`;
    const prepared = prepareEntrance(tab, gap);
    // Suspend sibling width transitions before layout publishes the new slot.
    for (const sibling of siblings) sibling.classList.add("is-resizing");
    tabs.push(tab);
    list.insertBefore(tab, frozenSpacer);
    layout();
    animateIn(tab, width, siblings, prepared, gap);
    activate(tab, {restore: Boolean(state.snapshot)});
    scheduleLayout();
    return tab;
  }

  function closeTab(tab, {notify = true} = {}) {
    if (!tab || closing.has(tab)) return;
    if (tabs.length <= 1) return;
    closing.add(tab);
    const index = tabs.indexOf(tab);
    if (index < 0) return;
    const wasActive = tab._state.id === activeId;
    const wasOverflowing = list.classList.contains("is-overflowing");
    if (wasActive) captureCurrent();
    const next = tabs[index + 1] || tabs[index - 1] || null;
    const focusWasInside = tab.contains(document.activeElement);

    const finish = () => {
      const previousScrollLeft = widthsFrozen ? frozenScrollLeft : list.scrollLeft;
      if (tooltipTab === tab) hideTooltip();
      tab.remove();
      tabs = tabs.filter(item => item !== tab);
      if (widthsFrozen) applyFrozenLayout();
      // Removing a tab can clamp scrollLeft synchronously when content width
      // changes. Restore it after the reduced strip has measured.
      if (wasOverflowing || widthsFrozen) {
        list.scrollLeft = previousScrollLeft;
        requestAnimationFrame(() => {
          if (!list.isConnected) return;
          list.scrollLeft = Math.min(previousScrollLeft, Math.max(0, list.scrollWidth - list.clientWidth));
        });
      }
      if (wasActive) {
        activeId = null;
        if (next) {
          activate(next);
          if (focusWasInside) next.focus();
        } else {
          emptyHandler?.();
        }
      }
      unmountHandler?.(tab, tab._state);
      if (notify) closeHandler?.(tab._state, tab);
      syncSelected(tabs.find(item => item._state.id === activeId) || null);
      if (widthsFrozen) applyFrozenLayout();
      scheduleLayout();
    };

    // While the pointer stays in the strip, lock every remaining tab to its
    // current slot. The next close button then lands under the pointer, so
    // users can keep clicking without chasing a reflowed tab. Full-width tabs
    // keep the normal closing animation.
    const tabWidth = parseFloat(getComputedStyle(tab).width) || MAX_TAB_WIDTH;
    if (pointerInsideList && (wasOverflowing || tabWidth < MAX_TAB_WIDTH - 0.5)) {
      freezeWidths();
      // A shrinking scroll range would clamp scrollLeft and shift every tab.
      // Keep the removed slot at the tail only while the pointer is inside.
      if (wasOverflowing) reserveFrozenSlot(tab);
      finish();
      return;
    }
    tab.inert = true;
    // The readable minimum width must not clamp the closing slot, and the
    // following gap has to collapse with it. Otherwise the tab stalls at 58px
    // and the strip jumps when the node is finally removed.
    tab.classList.add("is-closing");
    const from = getComputedStyle(tab).width;
    const gap = parseFloat(getComputedStyle(list).gap) || 5;
    tab.animate(
      [
        {flexBasis: from, width: from, paddingLeft: "14px", paddingRight: "14px", marginRight: "0px", opacity: 1, translate: "0 0"},
        {flexBasis: "0px", width: "0px", paddingLeft: "0px", paddingRight: "0px", marginRight: -gap + "px", opacity: 0, translate: "-5px 0"}
      ],
      {duration: motionDuration("--wd-motion-tab-close"), easing: motionEasing("--wd-ease-hover-out"), fill: "forwards"}
    ).finished.then(finish).catch(finish);
  }

  function find(route){return tabs.find(tab=>tab._state.route===route)||null}

  function swapTabContent(tab, next) {
    const label = labelOf(tab);
    const oldIcon = tab.querySelector(".workspace-tab-icon");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const commit = () => {
      label.textContent = next.title;
      const newIcon = next.iconFile ? createRouteIcon(next.iconFile) : createHomeIcon();
      if (oldIcon) oldIcon.replaceWith(newIcon);
      else tab.prepend(newIcon);
      if (!reduced) {
        const timing = {duration: motionDuration("--wd-motion-tab-out"), easing: motionEasing("--wd-ease-tab-in")};
        newIcon.animate([{opacity: 0, translate: "0 2px"}, {opacity: 1, translate: "0 0"}], timing).finished.catch(() => {});
        label.animate([{opacity: 0, translate: "0 2px"}, {opacity: 1, translate: "0 0"}], timing).finished.catch(() => {});
      }
      updateOverflow(tab);
      refreshTooltip(tab);
    };
    if (reduced) {
      commit();
      return;
    }
    // A token prevents an older route change from overwriting the latest one
    // when the user clicks quickly through the sidebar.
    const token = (tab._contentToken || 0) + 1;
    tab._contentToken = token;
    const timing = {duration: motionDuration("--wd-motion-tab-swap"), easing: motionEasing("--wd-ease-tab-swap-out")};
    const outgoing = [label.animate([{opacity: 1}, {opacity: 0}], timing)];
    if (oldIcon) outgoing.push(oldIcon.animate([{opacity: 1}, {opacity: 0}], timing));
    Promise.all(outgoing.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (token !== tab._contentToken || !tab.isConnected) return;
      for (const animation of outgoing) animation.cancel();
      commit();
    });
  }

  function update(tab, changes) {
    if (!tab || !changes) return;
    const next = {...tab._state, ...changes};
    next.title = titleOf(next);
    tab._state = next;
    tab.dataset.kind = next.kind || "";
    tab.dataset.route = next.route || "";
    tab.querySelector(".workspace-tab-close").setAttribute("aria-label", `Close ${next.title} tab`);
    // A tab keeps one stable accessible name while its route surfaces swap.
    if (tab.dataset.kind === "home") tab.setAttribute("aria-label", "Home tab");
    else if (next.kind === "home") tab.removeAttribute("aria-label");
    else tab.setAttribute("aria-label", `${next.title} tab`);
    swapTabContent(tab, next);
    scheduleLayout();
  }

  function updateTitle(tab, title) {
    if (!tab) return;
    const capped = capTitle(title);
    if (!capped) return;
    tab._state = {...tab._state, title: capped};
    labelOf(tab).textContent = capped;
    tab.querySelector(".workspace-tab-close").setAttribute("aria-label", `Close ${capped} tab`);
    updateOverflow(tab);
    refreshTooltip(tab);
  }

  list.addEventListener("pointerenter", () => { pointerInsideList = true; });
  list.addEventListener("pointerleave", () => {
    pointerInsideList = false;
    releaseFrozenWidths();
  });
  addEventListener("resize", scheduleLayout, {passive: true});
  const onTooltipViewportChange = () => scheduleTooltip();
  const tooltipScrollOptions = {capture: true, passive: true};
  document.addEventListener("scroll", onTooltipViewportChange, tooltipScrollOptions);
  addEventListener("resize", onTooltipViewportChange, {passive: true});
  visualViewport?.addEventListener("resize", onTooltipViewportChange);
  visualViewport?.addEventListener("scroll", onTooltipViewportChange);
  return {
    add,
    find,
    update,
    remove: tab => closeTab(tab),
    closeActive: () => closeTab(tabs.find(tab => tab._state.id === activeId)),
    activate,
    updateTitle,
    layout,
    setGlass,
    captureCurrent,
    active: () => tabs.find(tab => tab._state.id === activeId),
    get activeId() { return activeId; },
    get tabs() { return [...tabs]; },
    set onSelect(handler) { selectHandler = handler; },
    set onBeforeSelect(handler) { beforeSelectHandler = handler; },
    set onClose(handler) { closeHandler = handler; },
    set onMount(handler) { mountHandler = handler; },
    set onUnmount(handler) { unmountHandler = handler; },
    set captureState(handler) { captureHandler = handler ?? (() => null); },
    set restoreState(handler) { restoreHandler = handler ?? (() => null); },
    set onEmpty(handler) { emptyHandler = handler; },
    set mountTab(handler) { tabMountHandler = handler; },
    destroy() {
      clearTimeout(tooltipTimer);
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(tooltipFrame);
      removeEventListener("resize", scheduleLayout);
      document.removeEventListener("scroll", onTooltipViewportChange, tooltipScrollOptions);
      removeEventListener("resize", onTooltipViewportChange);
      visualViewport?.removeEventListener("resize", onTooltipViewportChange);
      visualViewport?.removeEventListener("scroll", onTooltipViewportChange);
      hideTooltip();
      tooltip.remove();
      list.remove();
    }
  };
}
