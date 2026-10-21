// Shared search surface for Home. Inline and fullscreen modes read the same
// local index and history store; neither invents a route or a remote query.
import {applyTypeStyle} from "../foundations/typography.js";
import {classifyCornerProfile} from "../foundations/geometry.js";
import {motionDuration,motionEasing,reducedMotion} from "../foundations/motion.js";
import {iconAsset,isNeutralIconFile,opaqueMaskURL} from "./icons.js";
import {createInputClear,syncInputClear} from "./input-clear.js";

const HISTORY_KEY = "wattdesk.searchHistory.v1";
const HISTORY_MAX = 8;
const HISTORY_VISIBLE = 4;
const GROUP_ORDER = ["Pages", "Sites", "Devices", "Tools", "People"];

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string" && value.trim()).slice(0, HISTORY_MAX)
      : [];
  } catch {
    return [];
  }
}

function writeHistory(values) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(values.slice(0, HISTORY_MAX)));
  } catch {
    /* Session-only fallback. */
  }
}

export function normalizeSearchQuery(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function groupRank(group) {
  const index = GROUP_ORDER.indexOf(group);
  return index < 0 ? GROUP_ORDER.length : index;
}

export function createSearchModel({items, onOpen}) {
  let history = readHistory();
  const listeners = new Set();
  const emit = () => {
    for (const listener of listeners) listener(history.slice());
  };

  function remember(query) {
    const value = normalizeSearchQuery(query);
    if (!value) return;
    const key = value.toLocaleLowerCase();
    history = [value, ...history.filter((entry) => entry.toLocaleLowerCase() !== key)]
      .slice(0, HISTORY_MAX);
    writeHistory(history);
    emit();
  }

  function remove(query) {
    const next = history.filter((entry) => entry !== query);
    if (next.length === history.length) return;
    history = next;
    writeHistory(history);
    emit();
  }

  function search(query) {
    const value = normalizeSearchQuery(query).toLocaleLowerCase();
    if (!value) return [];
    return items
      .filter((item) => item.title.toLocaleLowerCase().includes(value))
      .map((item) => {
        const title = item.title.toLocaleLowerCase();
        return {
          ...item,
          rank: title === value ? 0 : title.startsWith(value) ? 1 : 2,
        };
      })
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          groupRank(a.group) - groupRank(b.group) ||
          (a.order ?? 0) - (b.order ?? 0),
      );
  }

  function open(item, query) {
    if (!item) return;
    remember(query ?? item.query ?? item.title);
    onOpen?.(item);
  }

  return {
    history: () => history.slice(),
    remember,
    remove,
    search,
    open,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function searchShortcutKeys() {
  return navigator.platform?.toLowerCase().includes("mac") ||
    /Mac/.test(navigator.userAgent)
    ? ["⌘", "K"]
    : ["Ctrl", "K"];
}

export function searchShortcutLabel() {
  return searchShortcutKeys().join(" ");
}

/**
 * The one search-field structure used by Home and fullscreen. Both surfaces
 * share the glass host, 46px capsule, icon slot and clear control. Fullscreen
 * only changes its placeholder and omits the shortcut keycaps.
 */
export function createSearchField({glass, placeholder, label, className = ""}) {
  const field = document.createElement("div");
  field.className = ["wd-search-field", "wd-glass", "wd-glass--no-scale", className]
    .filter(Boolean)
    .join(" ");
  const icon = document.createElement("span");
  icon.className = "wd-search-field-icon";
  // Use the Home scene's magnifier geometry with an opaque state mask. The
  // generic search asset carries Figma label alpha, which reads darker than
  // the Home field even though both share the same glass material.
  const glyph = iconAsset("asset-35.svg", "mono");
  glyph.style.setProperty("--icon-mask", `url("${opaqueMaskURL("asset-35.svg")}")`);
  icon.append(glyph);
  const input = document.createElement("input");
  input.type = "text";
  input.className = "wd-search-input";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", label);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("autocomplete", "off");
  input.spellcheck = false;
  applyTypeStyle(input, "Subheadline/Regular");
  const clear = createInputClear({
    label: "Clear search",
    onClear: () => {
      input.value = "";
      syncInputClear(clear, "");
      // The surface owns its result refresh. Notify it on programmatic clears
      // exactly as typing would, so results cannot stay on the old query.
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.focus({preventScroll: true});
    },
  });
  syncInputClear(clear, "");
  // Keep the clear affordance in sync for every consumer, including inputs
  // that attach their own result/refresh handler after construction.
  input.addEventListener("input", () => syncInputClear(clear, input.value));
  field.append(icon, input, clear);
  glass.addSurface({host: field, radius: 23});
  classifyCornerProfile(field);
  return {field, input, clear, icon};
}

/** Two independent keycaps, matching the Figma shortcut instance. */
export function createShortcutKeycaps(className = "") {
  const group = document.createElement("span");
  group.className = ["wd-shortcut-keys", className].filter(Boolean).join(" ");
  for (const label of searchShortcutKeys()) {
    const key = document.createElement("kbd");
    key.textContent = label;
    applyTypeStyle(key, "Footnote/Regular");
    group.append(key);
  }
  return group;
}

function iconFor(item) {
  if (item.iconFile) {
    const neutral = isNeutralIconFile(item.iconFile);
    return iconAsset(item.iconFile, neutral ? "mono" : "color");
  }
  return iconAsset("asset-5.svg", "mono");
}

function makeResultRow(item, index, idPrefix) {
  const row = document.createElement("div");
  row.className = "wd-search-result";
  row.id = `${idPrefix}-option-${index}`;
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", "false");
  row.dataset.index = String(index);

  const icon = document.createElement("span");
  icon.className = "wd-search-result-icon";
  icon.append(iconFor(item));

  const copy = document.createElement("span");
  copy.className = "wd-search-result-copy";
  const title = document.createElement("span");
  title.className = "wd-search-result-title";
  title.textContent = item.title;
  const meta = document.createElement("span");
  meta.className = "wd-search-result-meta";
  // The group is a property of the result, not a second line of its title.
  // Keep it in the same line and let CSS carry the secondary colour.
  meta.textContent = ` - ${item.group}`;
  applyTypeStyle(title, "Subheadline/Regular");
  // The group is supporting context, not a second title. Bind the existing
  // Footnote style but step down one notch so the pair reads as one row
  // without changing the row's fixed height.
  applyTypeStyle(meta, "Footnote/Regular");
  copy.append(title, meta);

  const enter = document.createElement("span");
  enter.className = "wd-search-result-enter";
  enter.textContent = "↵";
  enter.setAttribute("aria-hidden", "true");

  row.append(icon, copy, enter);
  return row;
}

function sectionHeading(label) {
  const heading = document.createElement("div");
  heading.className = "wd-search-section-label";
  const text = document.createElement("span");
  text.textContent = label;
  heading.append(text);
  applyTypeStyle(heading, "Caption1/Emphasized");
  return heading;
}

function historyRow(query, index, prefix, onDelete, onOpen) {
  const row = document.createElement("div");
  row.className = "wd-search-history-row";
  row.id = `${prefix}-option-${index}`;
  row.setAttribute("role", "option");
  row.setAttribute("aria-selected", "false");
  row.tabIndex = -1;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "wd-search-history-hit";
  button.dataset.query = query;
  const icon = document.createElement("span");
  icon.className = "wd-search-history-icon";
  icon.append(iconAsset("history.svg", "mono"));
  const label = document.createElement("span");
  label.className = "wd-search-history-label";
  label.textContent = query;
  applyTypeStyle(label, "Subheadline/Regular");
  button.append(icon, label);
  button.addEventListener("click", () => onOpen(query));

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "wd-search-history-remove";
  remove.setAttribute("aria-label", `Remove "${query}" from recent searches`);
  const glyph = document.createElement("span");
  glyph.className = "wd-search-history-remove-glyph";
  glyph.setAttribute("aria-hidden", "true");
  remove.append(glyph);
  remove.addEventListener("click", (event) => {
    event.stopPropagation();
    onDelete(query);
  });

  row.append(button, remove);
  row.dataset.query = query;
  return row;
}

function quickLinkRow(item, index, prefix, onOpen) {
  const row = makeResultRow(item, index, prefix);
  row.classList.add("wd-search-quick-link");
  // Quick links are a compact launch row; the group heading already carries
  // the category, so a second "Pages" line only crowds the list.
  row.querySelector(".wd-search-result-meta")?.remove();
  row.addEventListener("click", () => onOpen(item));
  return row;
}

/**
 * Build the dropdown shared by both modes. It owns its query, active option,
 * history deletions and keyboard model; the surrounding surface owns focus and
 * dismissal.
 */
export function createSearchPanelContent({model, items, mode, onOpen, onHistory, onHistoryDelete, onRequestClose}) {
  const content = document.createElement("div");
  content.className = "wd-search-panel-content";
  const body = document.createElement("div");
  body.className = "wd-search-panel-body";
  const list = document.createElement("div");
  list.className = "wd-search-results";
  list.id = `wd-search-results-${mode}`;
  list.setAttribute("role", "listbox");
  list.setAttribute("tabindex", "-1");
  const live = document.createElement("div");
  live.className = "wd-search-live";
  live.setAttribute("aria-live", "polite");
  const hint = document.createElement("div");
  hint.className = "wd-search-hint";
  hint.setAttribute("role", "toolbar");
  hint.setAttribute("aria-label", "Search actions");
  for (const [keys, action, command] of [
    [["↑ ↓"], "Navigate", "navigate"],
    [["Enter"], "Open", "open"],
    [["Esc"], "Close", "close"],
  ]) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "wd-search-hint-item";
    item.dataset.action = command;
    item.setAttribute("aria-label", `${action} search`);
    const caps = document.createElement("span");
    caps.className = "wd-shortcut-keys";
    for (const key of keys) {
      const cap = document.createElement("kbd");
      const capLabel = document.createElement("span");
      capLabel.textContent = key;
      cap.append(capLabel);
      applyTypeStyle(cap, "Footnote/Regular");
      caps.append(cap);
    }
    const label = document.createElement("span");
    label.textContent = action;
    applyTypeStyle(label, "Footnote/Regular");
    item.append(caps, label);
    // Keep the combobox focused for pointer activations so typing and arrow
    // keys continue immediately. Keyboard users can still Tab to and invoke
    // each toolbar command normally.
    item.addEventListener("pointerdown", (event) => event.preventDefault());
    item.addEventListener("click", () => {
      // The first activation highlights the first result; later activations
      // move to the next row and wrap. This mirrors the arrow-key contract.
      if (command === "navigate") move(1);
      else if (command === "open") activate();
      else onRequestClose?.();
    });
    hint.append(item);
  }
  applyTypeStyle(hint, "Footnote/Regular");
  content.append(body, hint, live);

  let query = "";
  let activeIndex = -1;
  let visibleOptions = [];
  const limit = mode === "fullscreen" ? 12 : 7;

  function clearList() {
    list.replaceChildren();
    body.replaceChildren();
    visibleOptions = [];
    activeIndex = -1;
  }

  function optionRows() {
    // Rows live in groups inside the scroll body; the listbox element contains
    // only the live region. Querying `list` returned an empty set and silently
    // disabled every active-option action.
    return [...body.querySelectorAll('[role="option"]')];
  }

  function setActive(index, {scroll = false} = {}) {
    const rows = optionRows();
    if (!rows.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = Math.max(0, Math.min(index, rows.length - 1));
    rows.forEach((row, rowIndex) => {
      const selected = rowIndex === activeIndex;
      row.setAttribute("aria-selected", String(selected));
      row.classList.toggle("is-active", selected);
    });
    const row = rows[activeIndex];
    if (scroll && row.scrollIntoView) row.scrollIntoView({block: "nearest"});
    return row;
  }

  function setLive(message) {
    live.textContent = "";
    requestAnimationFrame(() => {
      live.textContent = message;
    });
  }

  function appendQuickLinks(extraClass = "") {
    const group = document.createElement("div");
    group.className = "wd-search-group wd-search-group--quick";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Quick links");
    group.append(sectionHeading("Quick links"));
    const rows = document.createElement("div");
    rows.className = `wd-search-quick-links ${extraClass}`.trim();
    const links = items.filter((item) => item.quickLink).slice(0, mode === "fullscreen" ? 5 : 4);
    for (const item of links) {
      const row = quickLinkRow(item, visibleOptions.length, list.id, (entry) => onOpen(entry, query));
      rows.append(row);
      visibleOptions.push({row, type: "item", item, activate: () => row.click()});
    }
    group.append(rows);
    body.append(group);
  }

  function renderHistory() {
    const history = model.history().slice(0, HISTORY_VISIBLE);
    if (!history.length) return;
    body.append(sectionHeading("Recent searches"));
    const rows = document.createElement("div");
    rows.className = "wd-search-history-list";
    rows.setAttribute("role", "group");
    rows.setAttribute("aria-label", "Recent searches");
    for (const value of history) {
      const row = historyRow(
        value,
        visibleOptions.length,
        list.id,
        (entry) => {
          model.remove(entry);
          render();
          onHistoryDelete?.(entry);
        },
        // A history row is a query, not a destination. Re-run it in the
        // surface that owns the input instead of navigating or closing.
        (entry) => onHistory?.(entry),
      );
      rows.append(row);
      visibleOptions.push({row, type: "history", value, activate: () => row.querySelector(".wd-search-history-hit").click()});
    }
    body.append(rows);
  }

  function renderResults() {
    const matches = model.search(query).slice(0, limit);
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "wd-search-empty";
      empty.textContent = `No results for "${normalizeSearchQuery(query)}"`;
      applyTypeStyle(empty, "Footnote/Regular");
      body.append(empty);
      appendQuickLinks("wd-search-quick-links--fallback");
      setLive(`No results for ${normalizeSearchQuery(query)}`);
      return;
    }

    let lastGroup = null;
    let group = null;
    for (const item of matches) {
      const row = makeResultRow(item, visibleOptions.length, list.id);
      row.addEventListener("click", () => onOpen(item, query));
      if (item.group !== lastGroup) {
        group = document.createElement("div");
        group.className = "wd-search-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", item.group);
        group.append(sectionHeading(item.group));
        body.append(group);
        lastGroup = item.group;
      }
      group.append(row);
      visibleOptions.push({row, type: "item", item, activate: () => row.click()});
    }
    setLive(`${matches.length} result${matches.length === 1 ? "" : "s"}`);
  }

  function render() {
    clearList();
    if (query) renderResults();
    else {
      renderHistory();
      appendQuickLinks();
    }
    if (query && visibleOptions.length) setActive(0);
    list.setAttribute("aria-label", "Search results");
  }

  function setQuery(value) {
    query = normalizeSearchQuery(value);
    render();
  }

  function move(delta) {
    if (!visibleOptions.length) return;
    const next = activeIndex < 0 ? (delta > 0 ? 0 : visibleOptions.length - 1) : activeIndex + delta;
    const wrapped = (next + visibleOptions.length) % visibleOptions.length;
    setActive(wrapped, {scroll: true});
  }

  function activate(index = activeIndex) {
    const entry = visibleOptions[index];
    if (!entry) return false;
    if (entry.activate) entry.activate();
    else entry.row.click();
    return true;
  }

  content.addEventListener("pointermove", (event) => {
    const row = event.target.closest('[role="option"]');
    if (!row) return;
    const index = optionRows().indexOf(row);
    if (index >= 0 && index !== activeIndex) setActive(index);
  });

  render();
  return {
    element: content,
    listbox: list,
    setQuery,
    move,
    activate,
    get activeId() {
      return visibleOptions[activeIndex]?.row.id ?? "";
    },
    get hasOptions() {
      return visibleOptions.length > 0;
    },
    focusFirst() {
      if (visibleOptions.length) setActive(0, {scroll: true});
    },
  };
}

/**
 * Inline panel: fixed to the search field, matching its full width. The host
 * uses the same glass surface layer as the date chooser.
 */
export function createInlineSearchPanel({anchor, model, items, glass, onOpen, onHistory, onRequestClose}) {
  const panel = document.createElement("div");
  panel.className = "wd-search-panel wd-glass--surface wd-glass-popup";
  const content = document.createElement("div");
  content.className = "wd-search-panel-frame";
  panel._wdFade = content;
  const inner = createSearchPanelContent({model, items, mode: "inline", onOpen, onHistory: history => onHistory?.(history), onRequestClose});
  content.append(inner.element);
  panel.append(content);
  glass.addSurface({host: panel, radius: 30});
  classifyCornerProfile(panel);
  panel.dataset.closingFace = "inline";

  let closed = false;
  panel._onClose = () => {
    if (closed) return;
    closed = true;
    glass.removeSurface(panel);
  };

  function position() {
    // Measure the scene host itself. Reading the visible child would include
    // the glass hover scale (about 1.03x), making the panel wider than the
    // idle field; offsetWidth is the laid-out width the field returns to.
    const rect = anchor.getBoundingClientRect();
    const width = Math.round(anchor.offsetWidth || rect.width);
    const available = Math.max(220, window.innerWidth - 24);
    const finalWidth = Math.min(width, available);
    // The visible host may be mid-hover-scale. Keep the idle width, but centre
    // it inside the visible rect so the edge does not drift during hover.
    const left = Math.max(12, Math.min(rect.left + (rect.width - finalWidth) / 2, window.innerWidth - finalWidth - 12));
    const bottom = rect.bottom;
    const maxHeight = Math.min(360, window.innerHeight - bottom - 32);
    Object.assign(panel.style, {
      width: `${finalWidth}px`,
      left: `${left}px`,
      // The host's rect can sit on a half device pixel. Position from the
      // ceiling so the visible gap never falls below the 8px contract.
      top: `${Math.ceil(bottom + 8.5)}px`,
      maxHeight: `${Math.max(160, maxHeight)}px`,
    });
  }

  position();
  return {panel, content: inner, position};
}

/**
 * Fullscreen mode: a modal surface over one viewport-level frosted backdrop.
 * The panel is the dialog; only the field and result surface receive glass.
 */
export function createFullscreenSearch({model, items, glass, onOpen, onRequestClose}) {
  const root = document.createElement("div");
  root.className = "wd-search-fullscreen";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Search WattDesk");

  const backdrop = document.createElement("div");
  backdrop.className = "wd-search-backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const stage = document.createElement("div");
  stage.className = "wd-search-stage";
  const {field, input, clear} = createSearchField({
    glass,
    placeholder: "Search WattDesk",
    label: "Search WattDesk",
  });

  const panel = document.createElement("div");
  panel.className = "wd-search-panel wd-search-panel--fullscreen wd-glass--surface wd-glass-popup";
  const frame = document.createElement("div");
  frame.className = "wd-search-panel-frame";
  panel._wdFade = frame;
  const inner = createSearchPanelContent({
    model,
    items,
    mode: "fullscreen",
    onOpen,
    onRequestClose,
    onHistory: (query) => {
      input.value = query;
      syncInputClear(clear, query);
      update(query);
    },
  });
  frame.append(inner.element);
  panel.append(frame);
  glass.addSurface({host: panel, radius: 30});
  classifyCornerProfile(panel);

  stage.append(field, panel);
  root.append(backdrop, stage);

  const panelId = "wd-search-results-fullscreen";
  input.setAttribute("aria-controls", panelId);
  input.setAttribute("aria-expanded", "true");

  function syncActive() {
    const id = inner.activeId;
    if (id) input.setAttribute("aria-activedescendant", id);
    else input.removeAttribute("aria-activedescendant");
  }

  function update(value) {
    // This is also the entry point for values copied in from Home or history.
    // Keep the clear affordance in step even when no native input event fires.
    syncInputClear(clear, value);
    inner.setQuery(value);
    syncActive();
  }

  // The shared field owns value/clear visibility. Fullscreen adds the result
  // refresh and history binding that its panel needs.
  input.addEventListener("input", () => {
    update(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      inner.move(1);
      syncActive();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      inner.move(-1);
      syncActive();
    } else if (event.key === "Enter") {
      if (inner.activate()) event.preventDefault();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onRequestClose?.();
    }
  });

  // Esc must still close when focus is on a history delete button or a row.
  // Capture on the dialog so no inner control can swallow it.
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.target === input) return;
    event.preventDefault();
    onRequestClose?.();
  }, true);

  let closed = false;
  root._onClose = () => {
    if (closed) return;
    closed = true;
    glass.removeSurface(field);
    glass.removeSurface(panel);
  };

  root.addEventListener("pointerdown", (event) => {
    // The stage is the empty area around the field and panel; clicking there
    // dismisses, while clicks inside either glass surface stay interactive.
    if (event.target === root || event.target === backdrop || event.target === stage) onRequestClose?.();
  });

  return {root, input, panel, clear, update, content: inner};
}

export function searchHistoryCount() {
  return readHistory().length;
}
