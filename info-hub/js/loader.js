/**
 * Reads modules.json and loads each enabled module's script.
 * To add a module:    add an entry here (modules.json) pointing at its folder.
 * To remove a module: delete its entry (or set "enabled": false).
 * This file and core.js never need to change either way.
 */
(function () {
  fetch('modules.json', { cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error(`modules.json returned ${r.status}`);
      return r.json();
    })
    .then((manifest) => {
      const entries = (manifest.modules || []).filter((m) => m.enabled !== false);
      if (entries.length === 0) {
        console.warn('[InfoHub] modules.json has no enabled modules.');
        return;
      }
      entries.forEach((entry) => {
        const script = document.createElement('script');
        script.src = `modules/${entry.path}/module.js`;
        script.defer = true;
        script.onerror = () => console.error(`[InfoHub] failed to load module "${entry.path}"`);
        document.body.appendChild(script);
      });
    })
    .catch((err) => {
      console.error('[InfoHub] could not load modules.json', err);
      const nav = document.getElementById('module-nav');
      if (nav) nav.innerHTML = '<p class="nav-empty">Could not load modules.json.</p>';
    });
})();
