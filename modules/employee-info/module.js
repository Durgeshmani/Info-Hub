/**
 * Employee Info Management module
 * --------------------------------
 * Self-contained: all markup, styles-via-shared-classes, and data logic live
 * here. It talks to the rest of the app only through the `ctx` object it
 * receives in render() (ctx.storage, ctx.toast) and through
 * InfoHub.registerModule() at the bottom of this file.
 */
(function () {
  const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'People', 'Support'];
  const STATUSES = ['Active', 'On Leave', 'Exited'];

  let state = {
    employees: [],
    search: '',
    department: 'All',
    status: 'All',
    editingId: null
  };

  let ctxRef = null;
  let rootEl = null;

  function uid() {
    return 'emp_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function nextEmployeeCode(list) {
    const nums = list
      .map((e) => parseInt((e.employeeCode || '').replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return 'EMP-' + String(max + 1).padStart(4, '0');
  }

  function seedData() {
    return [
      {
        id: uid(), employeeCode: 'EMP-0001', firstName: 'Asha', lastName: 'Gurung',
        email: 'asha.gurung@example.com', phone: '+977 98-1234-5678',
        department: 'Engineering', position: 'Backend Developer',
        joinDate: '2023-02-14', status: 'Active', notes: ''
      },
      {
        id: uid(), employeeCode: 'EMP-0002', firstName: 'Rohan', lastName: 'Shrestha',
        email: 'rohan.shrestha@example.com', phone: '+977 98-9876-5432',
        department: 'Sales', position: 'Account Executive',
        joinDate: '2022-08-01', status: 'Active', notes: ''
      },
      {
        id: uid(), employeeCode: 'EMP-0003', firstName: 'Nisha', lastName: 'Thapa',
        email: 'nisha.thapa@example.com', phone: '+977 97-5555-1212',
        department: 'People', position: 'HR Coordinator',
        joinDate: '2021-11-20', status: 'On Leave', notes: 'Parental leave, back mid-Nov.'
      }
    ];
  }

  function loadData() {
    const stored = ctxRef.storage.get('employees', null);
    if (stored === null) {
      state.employees = seedData();
      persist();
    } else {
      state.employees = stored;
    }
  }

  function persist() {
    ctxRef.storage.set('employees', state.employees);
  }

  /* --------------------------- derived data --------------------------- */

  function filteredEmployees() {
    const q = state.search.trim().toLowerCase();
    return state.employees.filter((e) => {
      if (state.department !== 'All' && e.department !== state.department) return false;
      if (state.status !== 'All' && e.status !== state.status) return false;
      if (!q) return true;
      const hay = `${e.firstName} ${e.lastName} ${e.email} ${e.employeeCode} ${e.position}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => a.firstName.localeCompare(b.firstName));
  }

  /* ------------------------------ render ------------------------------ */

  function render(container, ctx) {
    ctxRef = ctx;
    rootEl = container;
    if (state.employees.length === 0) loadData();

    container.innerHTML = `
      <div class="toolbar">
        <input type="search" class="field-input search-input" id="emp-search"
               placeholder="Search name, email, code, role…" value="${escapeAttr(state.search)}" />
        <select class="field-select" id="emp-filter-dept">
          <option value="All">All departments</option>
          ${DEPARTMENTS.map((d) => `<option value="${d}" ${state.department === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
        <select class="field-select" id="emp-filter-status">
          <option value="All">All statuses</option>
          ${STATUSES.map((s) => `<option value="${s}" ${state.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <span class="toolbar-spacer"></span>
        <button class="btn btn-ghost btn-sm" id="emp-export">Export CSV</button>
        <button class="btn btn-primary" id="emp-add">Add employee</button>
      </div>
      <div id="emp-table-wrap"></div>
      <div id="emp-panel-mount"></div>
    `;

    container.querySelector('#emp-search').addEventListener('input', (e) => {
      state.search = e.target.value;
      renderTable();
    });
    container.querySelector('#emp-filter-dept').addEventListener('change', (e) => {
      state.department = e.target.value;
      renderTable();
    });
    container.querySelector('#emp-filter-status').addEventListener('change', (e) => {
      state.status = e.target.value;
      renderTable();
    });
    container.querySelector('#emp-export').addEventListener('click', exportCsv);
    container.querySelector('#emp-add').addEventListener('click', () => openPanel(null));

    renderTable();
  }

  function renderTable() {
    const wrap = rootEl.querySelector('#emp-table-wrap');
    const list = filteredEmployees();

    if (state.employees.length === 0) {
      wrap.innerHTML = emptyState('No employees yet', 'Add your first employee record to get started.');
      return;
    }
    if (list.length === 0) {
      wrap.innerHTML = emptyState('No matches', 'Try a different search term or clear the filters.');
      return;
    }

    wrap.innerHTML = `
      <p class="result-count">${list.length} of ${state.employees.length} employee${state.employees.length === 1 ? '' : 's'}</p>
      <table class="record-table">
        <thead>
          <tr>
            <th>Code</th><th>Name</th><th>Department</th><th>Position</th>
            <th>Joined</th><th>Status</th><th>Contact</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${list.map(rowHtml).join('')}
        </tbody>
      </table>
    `;

    wrap.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => openPanel(btn.getAttribute('data-edit')))
    );
    wrap.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', () => deleteEmployee(btn.getAttribute('data-delete')))
    );
  }

  function rowHtml(e) {
    const statusClass = e.status === 'Active' ? 'status-active' : e.status === 'On Leave' ? 'status-leave' : 'status-exited';
    return `
      <tr>
        <td class="record-code">${escapeHtml(e.employeeCode)}</td>
        <td>${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</td>
        <td>${escapeHtml(e.department)}</td>
        <td>${escapeHtml(e.position)}</td>
        <td>${formatDate(e.joinDate)}</td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(e.status)}</span></td>
        <td>${escapeHtml(e.email)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" data-edit="${e.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-delete="${e.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  function emptyState(title, body) {
    return `<div class="empty-state"><strong>${title}</strong>${body}</div>`;
  }

  /* ------------------------------- panel ------------------------------- */

  function openPanel(id) {
    state.editingId = id;
    const editing = id ? state.employees.find((e) => e.id === id) : null;
    const mount = rootEl.querySelector('#emp-panel-mount');

    mount.innerHTML = `
      <div class="panel-overlay" id="emp-overlay"></div>
      <div class="panel" id="emp-panel" role="dialog" aria-modal="true" aria-labelledby="emp-panel-title">
        <div class="panel-head">
          <div>
            <h2 id="emp-panel-title">${editing ? 'Edit employee' : 'Add employee'}</h2>
            <p>${editing ? escapeHtml(editing.employeeCode) : 'A new record code is assigned automatically.'}</p>
          </div>
          <button class="panel-close" id="emp-panel-close" aria-label="Close">&times;</button>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="form-row">
              <label for="f-first">First name</label>
              <input class="field-input" id="f-first" value="${escapeAttr(editing?.firstName || '')}" />
            </div>
            <div class="form-row">
              <label for="f-last">Last name</label>
              <input class="field-input" id="f-last" value="${escapeAttr(editing?.lastName || '')}" />
            </div>
          </div>
          <div class="form-row">
            <label for="f-email">Email</label>
            <input class="field-input" id="f-email" type="email" value="${escapeAttr(editing?.email || '')}" />
          </div>
          <div class="form-row">
            <label for="f-phone">Phone</label>
            <input class="field-input" id="f-phone" value="${escapeAttr(editing?.phone || '')}" />
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label for="f-dept">Department</label>
              <select class="field-select" id="f-dept">
                ${DEPARTMENTS.map((d) => `<option value="${d}" ${editing?.department === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label for="f-status">Status</label>
              <select class="field-select" id="f-status">
                ${STATUSES.map((s) => `<option value="${s}" ${(editing?.status || 'Active') === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <label for="f-position">Position</label>
            <input class="field-input" id="f-position" value="${escapeAttr(editing?.position || '')}" />
          </div>
          <div class="form-row">
            <label for="f-join">Join date</label>
            <input class="field-input" id="f-join" type="date" value="${editing?.joinDate || ''}" />
          </div>
          <div class="form-row">
            <label for="f-notes">Notes</label>
            <textarea class="field-input" id="f-notes" rows="3">${escapeHtml(editing?.notes || '')}</textarea>
          </div>
          <p class="form-error" id="f-error"></p>
        </div>
        <div class="panel-foot">
          <button class="btn btn-ghost" id="emp-cancel">Cancel</button>
          <button class="btn btn-primary" id="emp-save">${editing ? 'Save changes' : 'Add employee'}</button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      mount.querySelector('#emp-overlay').classList.add('is-open');
      mount.querySelector('#emp-panel').classList.add('is-open');
    });

    const close = () => closePanel();
    mount.querySelector('#emp-overlay').addEventListener('click', close);
    mount.querySelector('#emp-panel-close').addEventListener('click', close);
    mount.querySelector('#emp-cancel').addEventListener('click', close);
    mount.querySelector('#emp-save').addEventListener('click', () => saveEmployee(editing));
  }

  function closePanel() {
    const mount = rootEl.querySelector('#emp-panel-mount');
    const overlay = mount.querySelector('#emp-overlay');
    const panel = mount.querySelector('#emp-panel');
    if (!overlay || !panel) { mount.innerHTML = ''; return; }
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
    setTimeout(() => { mount.innerHTML = ''; }, 180);
    state.editingId = null;
  }

  function saveEmployee(editing) {
    const get = (id) => rootEl.querySelector(id).value.trim();
    const firstName = get('#f-first');
    const lastName = get('#f-last');
    const email = get('#f-email');
    const errorEl = rootEl.querySelector('#f-error');

    if (!firstName || !lastName) {
      errorEl.textContent = 'First and last name are required.';
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      errorEl.textContent = 'That email address doesn\'t look right.';
      return;
    }

    const record = {
      id: editing ? editing.id : uid(),
      employeeCode: editing ? editing.employeeCode : nextEmployeeCode(state.employees),
      firstName, lastName, email,
      phone: get('#f-phone'),
      department: rootEl.querySelector('#f-dept').value,
      status: rootEl.querySelector('#f-status').value,
      position: get('#f-position'),
      joinDate: rootEl.querySelector('#f-join').value,
      notes: rootEl.querySelector('#f-notes').value.trim()
    };

    if (editing) {
      state.employees = state.employees.map((e) => (e.id === editing.id ? record : e));
      ctxRef.toast('Employee updated');
    } else {
      state.employees.push(record);
      ctxRef.toast('Employee added');
    }
    persist();
    closePanel();
    renderTable();
  }

  function deleteEmployee(id) {
    const emp = state.employees.find((e) => e.id === id);
    if (!emp) return;
    const confirmed = window.confirm(`Remove ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) from the directory?`);
    if (!confirmed) return;
    state.employees = state.employees.filter((e) => e.id !== id);
    persist();
    renderTable();
    ctxRef.toast('Employee removed');
  }

  /* ------------------------------- export ------------------------------- */

  function exportCsv() {
    const list = filteredEmployees();
    if (list.length === 0) {
      ctxRef.toast('Nothing to export', 'error');
      return;
    }
    const cols = ['employeeCode', 'firstName', 'lastName', 'email', 'phone', 'department', 'position', 'joinDate', 'status', 'notes'];
    const header = cols.join(',');
    const rows = list.map((e) => cols.map((c) => csvCell(e[c])).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    ctxRef.toast('CSV exported');
  }

  function csvCell(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  /* ------------------------------- utils -------------------------------- */

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function onUnload() {
    // Panel, if open, shouldn't linger when switching modules.
    if (rootEl) {
      const mount = rootEl.querySelector('#emp-panel-mount');
      if (mount) mount.innerHTML = '';
    }
  }

  /* ----------------------------- registration ---------------------------- */

  window.InfoHub.registerModule({
    id: 'employee-info',
    name: 'Employee Directory',
    description: 'Records, roles & status',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2"/></svg>',
    render,
    onUnload
  });
})();
