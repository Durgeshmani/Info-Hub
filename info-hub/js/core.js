/**
 * InfoHub core
 * ------------
 * This is the ONLY file that knows how to build the shell (nav, header, content
 * frame). It never references a specific module by name. Modules register
 * themselves by calling InfoHub.registerModule({...}) when their script loads.
 *
 * Adding a module   -> drop a folder in /modules and add one line to modules.json
 * Removing a module -> delete its line from modules.json (folder can stay or go)
 * Neither action requires touching this file.
 */
(function (global) {
  const REGISTRY = [];
  let activeId = null;

  const els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  /* ---------- namespaced storage so modules can never collide ---------- */
  function makeStorage(moduleId) {
    const prefix = `infohub::${moduleId}::`;
    return {
      get(key, fallback) {
        try {
          const raw = localStorage.getItem(prefix + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
          console.error(`[InfoHub] storage.get failed for ${moduleId}/${key}`, e);
          return fallback;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value));
          return true;
        } catch (e) {
          console.error(`[InfoHub] storage.set failed for ${moduleId}/${key}`, e);
          return false;
        }
      },
      remove(key) {
        localStorage.removeItem(prefix + key);
      }
    };
  }

  /* ---------------------------- public API ---------------------------- */
  const InfoHub = {
    /**
     * Called by every module script on load.
     * @param {Object} mod
     * @param {string} mod.id            unique slug, e.g. "employee-info"
     * @param {string} mod.name          display name for the nav
     * @param {string} [mod.description] one-line summary shown under the name
     * @param {string} [mod.icon]        inline SVG string (24x24 viewBox)
     * @param {function(HTMLElement, Object): void} mod.render
     *        called with the content container and a scoped `ctx` object
     *        ({ storage, toast }) whenever the module becomes active
     * @param {function(): void} [mod.onUnload]
     *        called right before another module replaces this one
     */
    registerModule(mod) {
      if (!mod || !mod.id || typeof mod.render !== 'function') {
        console.error('[InfoHub] registerModule() requires at least {id, render}', mod);
        return;
      }
      if (REGISTRY.some((m) => m.id === mod.id)) {
        console.warn(`[InfoHub] module "${mod.id}" already registered, ignoring duplicate`);
        return;
      }
      REGISTRY.push(mod);
      renderNav();
      // If this is the first module to arrive, or the one the URL asks for, open it
      const requested = new URLSearchParams(location.hash.replace(/^#/, '?'));
      const wanted = requested.get('m');
      if ((wanted && wanted === mod.id) || (!activeId && !wanted)) {
        openModule(mod.id);
      }
    },

    toast(message, tone = 'info') {
      showToast(message, tone);
    }
  };

  /* ------------------------------ nav ----------------------------------- */
  function renderNav() {
    const nav = els.nav;
    if (!nav) return;
    nav.innerHTML = '';

    if (REGISTRY.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'nav-empty';
      empty.textContent = 'No modules installed.';
      nav.appendChild(empty);
      return;
    }

    REGISTRY.forEach((mod) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-item' + (mod.id === activeId ? ' is-active' : '');
      btn.setAttribute('data-module-id', mod.id);
      btn.innerHTML = `
        <span class="nav-item-icon" aria-hidden="true">${mod.icon || defaultIcon()}</span>
        <span class="nav-item-text">
          <span class="nav-item-name">${escapeHtml(mod.name)}</span>
          ${mod.description ? `<span class="nav-item-desc">${escapeHtml(mod.description)}</span>` : ''}
        </span>
      `;
      btn.addEventListener('click', () => openModule(mod.id));
      nav.appendChild(btn);
    });
  }

  function defaultIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* --------------------------- module switching --------------------------- */
  function openModule(id) {
    const mod = REGISTRY.find((m) => m.id === id);
    if (!mod) {
      console.error(`[InfoHub] no module registered with id "${id}"`);
      return;
    }

    const current = REGISTRY.find((m) => m.id === activeId);
    if (current && typeof current.onUnload === 'function') {
      try { current.onUnload(); } catch (e) { console.error(e); }
    }

    activeId = id;
    location.hash = `m=${id}`;
    els.content.innerHTML = '';
    els.moduleTitle.textContent = mod.name;
    els.moduleDesc.textContent = mod.description || '';

    const ctx = {
      storage: makeStorage(mod.id),
      toast: (msg, tone) => showToast(msg, tone)
    };

    try {
      mod.render(els.content, ctx);
    } catch (e) {
      console.error(`[InfoHub] module "${mod.id}" failed to render`, e);
      els.content.innerHTML = `<div class="module-error">This module hit an error and couldn't load. Check the browser console for details.</div>`;
    }

    renderNav();
  }

  /* -------------------------------- toast -------------------------------- */
  let toastTimer = null;
  function showToast(message, tone = 'info') {
    const t = els.toast;
    if (!t) return;
    t.textContent = message;
    t.className = `toast toast-${tone} is-visible`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  /* -------------------------------- boot ---------------------------------- */
  function mount() {
    els.nav = byId('module-nav');
    els.content = byId('module-content');
    els.moduleTitle = byId('module-title');
    els.moduleDesc = byId('module-desc');
    els.toast = byId('toast');
    renderNav();
  }

  document.addEventListener('DOMContentLoaded', mount);

  global.InfoHub = InfoHub;
})(window);
