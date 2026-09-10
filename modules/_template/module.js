/**
 * TEMPLATE — copy this folder to create a new module.
 *
 * 1. Rename the folder (e.g. modules/asset-inventory/)
 * 2. Change MODULE_ID / MODULE_NAME below
 * 3. Add an entry to /modules.json:
 *      { "id": "asset-inventory", "path": "asset-inventory", "enabled": true }
 * 4. Build your render() function. Use ctx.storage.get/set to persist data —
 *    it's automatically namespaced to this module, so you can never
 *    collide with another module's data.
 *
 * Shared CSS classes you can reuse (see css/styles.css):
 *   .toolbar .field-input .field-select .btn .btn-primary .btn-ghost
 *   .btn-danger .record-table .status-pill .empty-state .panel .panel-overlay
 */
(function () {
  const MODULE_ID = 'template';
  const MODULE_NAME = 'Template module';

  function render(container, ctx) {
    const items = ctx.storage.get('items', []);

    container.innerHTML = `
      <div class="toolbar">
        <button class="btn btn-primary" id="tpl-add">Add item</button>
      </div>
      ${items.length
        ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
        : `<div class="empty-state"><strong>Nothing here yet</strong>Add your first item.</div>`}
    `;

    container.querySelector('#tpl-add').addEventListener('click', () => {
      const value = prompt('New item:');
      if (!value) return;
      const next = [...items, value];
      ctx.storage.set('items', next);
      render(container, ctx);
      ctx.toast('Item added');
    });
  }

  window.InfoHub.registerModule({
    id: MODULE_ID,
    name: MODULE_NAME,
    description: 'What this module manages',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
    render
    // onUnload() {} // optional — clean up timers/listeners when the user navigates away
  });
})();
