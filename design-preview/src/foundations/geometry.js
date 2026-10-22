// Shared continuous-curve adapter for every page and future component.
// It never writes border-radius or geometry sizes: it only classifies the
// existing silhouette so circles/capsules stay round and other corners use
// the global superellipse curve from geometry.css.
const ROUND = 'round';
const CONTINUOUS = 'continuous';
const SUPPORTED = typeof CSS !== 'undefined' && CSS.supports('corner-shape', 'superellipse(1.2)');

const INHERITED_SURFACES = '.wd-glass-material,.wd-glass-fill,.wd-glass-optics,.wd-glass-rim,.wd-glass-state,.wd-glass-glow';

function numericRadius(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  if (text.endsWith('%')) return {percentage:parseFloat(text)};
  const radius = parseFloat(text);
  return Number.isFinite(radius) ? radius : 0;
}

export function classifyCornerProfile(element, { radius, width, height, ellipse = false } = {}) {
  if (!element || element.matches(INHERITED_SURFACES)) return null;
  const style = getComputedStyle(element);
  const r = radius ?? numericRadius(style.borderTopLeftRadius);
  const w = width ?? element.offsetWidth;
  const h = height ?? element.offsetHeight;
  if (r <= 0 || w <= 0 || h <= 0) return null;
  const percentage = typeof r === 'object' ? r.percentage : null;
  const isRound = ellipse || (percentage !== null ? percentage >= 50 : r >= Math.min(w, h) / 2 - 0.01);
  const profile = isRound ? ROUND : CONTINUOUS;
  element.dataset.cornerProfile = profile;
  return profile;
}

// Backward-compatible name used by current cards, scene and glass modules.
export function preserveCornerProfile(element, options = {}) {
  return classifyCornerProfile(element, options);
}

// Reclassify a subtree without touching any CSS radius. This covers new
// components and runtime content even when pages do not import geometry.js.
export function refreshCornerProfiles(root = document.documentElement) {
  if (!root) return;
  const nodes = [root, ...root.querySelectorAll('*')];
  for (const element of nodes) {
    const style = getComputedStyle(element);
    if (!style.borderRadius || style.borderRadius === '0px' || style.borderRadius === '0%') {
      if (element.dataset.cornerProfile === ROUND) delete element.dataset.cornerProfile;
      continue;
    }
    // The global selector already preserves .wd-shape-round and explicit
    // round profiles; any other sized element just needs its geometry read.
    if (element.classList.contains('wd-shape-round')) continue;
    preserveCornerProfile(element);
  }
}

// Classify the existing DOM at mount, then only when dimensions change.
// Mutation observation catches new subtrees; ResizeObserver catches cards
// becoming capsules because their content or viewport changed.
export function installCornerProfiles({ root = document.documentElement } = {}) {
  refreshCornerProfiles(root);
  if (typeof MutationObserver === 'undefined') return { destroy() {} };
  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target.isConnected) preserveCornerProfile(entry.target);
    }
  });
  const observed = new WeakSet();
  const observe = node => {
    if (node.nodeType !== 1) return;
    const elements = [node, ...node.querySelectorAll('*')];
    for (const element of elements) {
      if (!observed.has(element) && getComputedStyle(element).borderRadius !== '0px') {
        observed.add(element);
        resize.observe(element);
        preserveCornerProfile(element);
      }
    }
  };
  observe(root);
  const mutations = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) observe(node);
      if (record.type === 'attributes' && record.target?.nodeType === 1) {
        preserveCornerProfile(record.target);
      }
    }
  });
  mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  return { destroy() { mutations.disconnect(); resize.disconnect(); } };
}

// The stylesheet is the progressive-enhancement gate; the adapter is inert
// when the browser cannot render native superellipses.
if (SUPPORTED && typeof document !== 'undefined') {
  const start = () => installCornerProfiles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
