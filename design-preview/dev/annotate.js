/*
 * WattDesk 本地批注层（仅在 URL 带 ?annotate=1 时由 server.js 注入）
 * 用法：打开 http://127.0.0.1:4173/home.html?glass=figma&annotate=1
 * 点击「批注」后单击页面元素即可写意见；批注会同时存进 localStorage 和
 * design-preview/annotations.json（服务器支持写入时）。
 */
(() => {
  'use strict';
  if (!new URLSearchParams(location.search).has('annotate')) return;
  if (window.__wdAnnotateReady) return;
  window.__wdAnnotateReady = true;

  const STORAGE_KEY = 'wattdesk.annotations.v1';
  const ENDPOINT = '/__annotations';
  const pageKey = location.pathname;
  const DECORATIVE = '.wd-glass-material';

  let store = loadStore();
  let mode = false;
  let target = null;
  let editing = null;
  let toastTimer = 0;
  let frame = 0;

  const root = document.createElement('div');
  root.className = 'wd-annotate-root';
  root.innerHTML = `
    <div class="wd-annotate-frame" hidden></div>
    <div class="wd-annotate-pins"></div>
    <div class="wd-annotate-bar" data-state="idle">
      <button type="button" class="wd-annotate-toggle" aria-pressed="false">
        <span class="wd-annotate-mark" aria-hidden="true"></span>
        <span class="wd-annotate-toggle-label">批注</span>
        <span class="wd-annotate-count" hidden>0</span>
      </button>
      <span class="wd-annotate-sep" hidden></span>
      <button type="button" class="wd-annotate-tool" data-tool="copy" hidden>复制</button>
      <button type="button" class="wd-annotate-tool" data-tool="clear" hidden>清空</button>
    </div>
    <div class="wd-annotate-tip" hidden>点击页面元素写批注 · 再点「批注」退出</div>
    <div class="wd-annotate-toast" role="status" hidden></div>
  `;
  const frameEl = root.querySelector('.wd-annotate-frame');
  const pinsEl = root.querySelector('.wd-annotate-pins');
  const barEl = root.querySelector('.wd-annotate-bar');
  const toggleEl = root.querySelector('.wd-annotate-toggle');
  const countEl = root.querySelector('.wd-annotate-count');
  const tipEl = root.querySelector('.wd-annotate-tip');
  const toastEl = root.querySelector('.wd-annotate-toast');
  const copyEl = root.querySelector('[data-tool="copy"]');
  const clearEl = root.querySelector('[data-tool="clear"]');
  const sepEl = root.querySelector('.wd-annotate-sep');

  let composer = null;

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  const list = () => (store[pageKey] = Array.isArray(store[pageKey]) ? store[pageKey] : []);
  const saveLocal = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* 隐私模式忽略 */ }
  };

  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2400);
  }

  async function saveRemote() {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageKey,
          url: location.pathname + location.search,
          theme: document.documentElement.dataset.theme || 'dark',
          savedAt: new Date().toISOString(),
          annotations: list()
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function persist(announce) {
    saveLocal();
    renderPins();
    renderBar();
    if (!announce) return;
    const remote = await saveRemote();
    toast(remote ? '已保存 · annotations.json' : '已保存到本页（未写入文件）');
  }

  /* ---------- 选择元素 ---------- */

  function resolveTarget(node) {
    let el = node instanceof Element ? node : null;
    if (!el) return null;
    const decorative = el.closest(DECORATIVE);
    if (decorative && decorative.parentElement) el = decorative.parentElement;
    if (el === document.body || el === document.documentElement) return null;
    return el;
  }

  function cssPath(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      let tag = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      const sameTag = [...parent.children].filter(child => child.tagName === node.tagName);
      if (sameTag.length > 1) tag += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      parts.unshift(tag);
      node = parent;
    }
    return parts.join(' > ');
  }

  function layerNames(el) {
    const names = [];
    let node = el;
    while (node && node !== document.body) {
      const name = node.getAttribute && node.getAttribute('data-name');
      if (name) names.unshift(name);
      node = node.parentElement;
    }
    return names;
  }

  function classes(el) {
    return [...el.classList].filter(name => !name.startsWith('wd-annotate'));
  }

  function describe(el) {
    const text = (el.getAttribute('aria-label') || el.innerText || el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    const host = el.closest('button, a, [role="button"]');
    const hostLabel = host
      ? (host.getAttribute('aria-label') || host.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)
      : '';
    const layers = layerNames(el);
    const named = layers.filter(name => !/^Frame\s+\d+$/i.test(name));
    const label = [...new Set([named.slice(-1)[0], hostLabel, el === host ? '' : text].filter(Boolean))].join(' › ');
    const rect = el.getBoundingClientRect();
    return {
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      classes: classes(el),
      label,
      hostLabel,
      name: layers.slice(-1)[0] || '',
      layers,
      text,
      rect: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      }
    };
  }

  /* ---------- 高亮框 ---------- */

  function drawFrame(el) {
    if (!el) { frameEl.hidden = true; return; }
    const rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height) { frameEl.hidden = true; return; }
    const style = getComputedStyle(el);
    const radius = style.borderRadius && style.borderRadius !== '0px' ? style.borderRadius : '6px';
    frameEl.style.left = rect.left + 'px';
    frameEl.style.top = rect.top + 'px';
    frameEl.style.width = rect.width + 'px';
    frameEl.style.height = rect.height + 'px';
    frameEl.style.borderRadius = radius;
    frameEl.hidden = false;
  }

  function outlineFor(el) {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => drawFrame(el));
  }

  /* ---------- 批注面板 ---------- */

  function openComposer(el, existing) {
    closeComposer();
    const info = describe(el);
    editing = existing || null;
    target = el;

    composer = document.createElement('form');
    composer.className = 'wd-annotate-composer';
    composer.innerHTML = `
      <div class="wd-annotate-crumb"></div>
      <div class="wd-annotate-target"><code></code></div>
      <textarea rows="3" spellcheck="false" placeholder="想改什么？例如：这个卡片圆角再小一点"></textarea>
      <div class="wd-annotate-actions">
        <button type="button" class="quiet" data-act="parent" title="选择外层元素">上一级</button>
        <button type="button" class="quiet" data-act="child" title="选择内层元素">下一级</button>
        <span class="grow"></span>
        <button type="button" class="quiet danger" data-act="delete" hidden>删除</button>
        <button type="button" class="quiet" data-act="cancel">取消</button>
        <button type="submit" class="primary">保存</button>
      </div>
      <div class="wd-annotate-hint">Alt+↑/↓ 切换层级 · Ctrl/⌘+Enter 保存 · Esc 取消</div>
    `;

    const crumb = composer.querySelector('.wd-annotate-crumb');
    const code = composer.querySelector('code');
    const area = composer.querySelector('textarea');
    const del = composer.querySelector('[data-act="delete"]');

    const paint = () => {
      const current = describe(target);
      crumb.textContent = current.label || '页面元素';
      crumb.title = current.label || '';
      code.textContent = current.tag + (current.classes.length ? '.' + current.classes.join('.') : '');
      code.title = current.selector;
      drawFrame(target);
      placeComposer();
    };

    composer.addEventListener('submit', event => {
      event.preventDefault();
      commit(area.value);
    });

    composer.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); closeComposer(); }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); commit(area.value); }
      if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        step(event.key === 'ArrowUp' ? -1 : 1);
      }
    });

    composer.addEventListener('click', event => {
      const button = event.target.closest('[data-act]');
      if (!button) return;
      const act = button.dataset.act;
      if (act === 'cancel') closeComposer();
      if (act === 'parent') step(-1);
      if (act === 'child') step(1);
      if (act === 'delete') { remove(editing.id); closeComposer(); }
    });

    const step = direction => {
      const next = direction < 0 ? target.parentElement : target.firstElementChild;
      if (!next || next === document.body || next === document.documentElement) return;
      target = next;
      paint();
    };

    const commit = value => {
      const note = value.replace(/\s+/g, ' ').trim();
      if (!note) { area.focus(); return; }
      const data = describe(target);
      if (editing) {
        Object.assign(editing, data, { note, updatedAt: Date.now() });
      } else {
        list().push({ id: 'a' + Date.now().toString(36), note, ...data, createdAt: Date.now() });
      }
      closeComposer();
      persist(true);
    };

    root.appendChild(composer);
    del.hidden = !editing;
    area.value = editing ? editing.note : '';
    paint();
    requestAnimationFrame(() => { area.focus({ preventScroll: true }); area.select(); });
    renderBar();
  }

  function placeComposer() {
    if (!composer) return;
    const rect = target.getBoundingClientRect();
    composer.style.visibility = 'hidden';
    composer.style.left = '0px';
    composer.style.top = '0px';
    const box = composer.getBoundingClientRect();
    const gap = 10;
    const margin = 12;
    let left = rect.left;
    let top = rect.bottom + gap;
    if (top + box.height > window.innerHeight - margin) top = rect.top - box.height - gap;
    if (top < margin) top = Math.min(window.innerHeight - box.height - margin, Math.max(margin, rect.top));
    if (left + box.width > window.innerWidth - margin) left = window.innerWidth - box.width - margin;
    if (left < margin) left = margin;
    composer.style.left = Math.round(left) + 'px';
    composer.style.top = Math.round(top) + 'px';
    composer.style.visibility = 'visible';
  }

  function closeComposer() {
    if (composer) { composer.remove(); composer = null; }
    editing = null;
    target = null;
    frameEl.hidden = true;
    renderBar();
  }

  function remove(id) {
    store[pageKey] = list().filter(item => item.id !== id);
    persist(true);
  }

  /* ---------- 图钉 ---------- */

  function renderPins() {
    pinsEl.innerHTML = '';
    list().forEach((item, index) => {
      const el = safeQuery(item.selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'wd-annotate-pin';
      pin.dataset.index = String(index + 1);
      pin.textContent = String(index + 1);
      pin.title = item.note;
      const x = Math.max(4, rect.left - 10);
      const y = Math.max(4, rect.top - 10);
      pin.style.left = x + 'px';
      pin.style.top = y + 'px';
      pin.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openComposer(el, item);
      });
      pinsEl.appendChild(pin);
    });
    renderBar();
  }

  function safeQuery(selector) {
    try { return selector ? document.querySelector(selector) : null; } catch { return null; }
  }

  function renderBar() {
    const count = list().length;
    countEl.textContent = String(count);
    countEl.hidden = count === 0;
    tipEl.hidden = !mode;
    barEl.dataset.state = mode ? 'active' : 'idle';
    toggleEl.setAttribute('aria-pressed', String(mode));
    toggleEl.querySelector('.wd-annotate-toggle-label').textContent = mode ? '退出批注' : '批注';
    copyEl.hidden = clearEl.hidden = sepEl.hidden = count === 0;
    document.documentElement.dataset.annotate = mode ? 'on' : 'off';
  }

  function setMode(next) {
    mode = next;
    if (!mode) {
      closeComposer();
      frameEl.hidden = true;
    }
    renderBar();
    if (mode) toast('批注模式已开启 · 点击页面元素');
  }

  /* ---------- 事件 ---------- */

  document.addEventListener('pointermove', event => {
    if (!mode || composer || root.contains(event.target)) return;
    const el = resolveTarget(event.target);
    if (el !== target || frameEl.hidden) {
      target = el;
      outlineFor(el);
    }
  }, true);

  document.addEventListener('click', event => {
    if (!mode || root.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const el = resolveTarget(event.target);
    if (el) openComposer(el);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (composer) { closeComposer(); }
      else if (mode) { setMode(false); }
    }
  }, true);

  document.addEventListener('scroll', () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (composer && target) drawFrame(target);
      else frameEl.hidden = true;
      renderPins();
    });
  }, true);

  window.addEventListener('resize', () => {
    if (composer) placeComposer();
    renderPins();
  });

  toggleEl.addEventListener('click', () => setMode(!mode));

  copyEl.addEventListener('click', async () => {
    const text = summary();
    try {
      await navigator.clipboard.writeText(text);
      toast('批注已复制，可直接粘贴到对话框');
    } catch {
      window.prompt('复制下面的批注内容：', text);
    }
  });

  clearEl.addEventListener('click', () => {
    if (!list().length) return;
    if (!window.confirm('清空当前页面的 ' + list().length + ' 条批注？')) return;
    store[pageKey] = [];
    closeComposer();
    persist(true);
  });

  function summary() {
    const head = '批注 · ' + pageKey + ' · ' + new Date().toLocaleString('zh-CN', { hour12: false });
    const lines = list().map((item, index) => {
      const where = [item.label || item.name, item.tag + '.' + item.classes.join('.'), item.text ? '「' + item.text + '」' : '']
        .filter(Boolean).join(' · ');
      return (index + 1) + '. ' + where + '\n   → ' + item.note + '\n   selector: ' + item.selector;
    });
    return head + '\n\n' + lines.join('\n');
  }

  document.body.appendChild(root);
  renderPins();
  renderBar();
})();
