# InfoHub

A modular information-management web app, built as plain HTML/CSS/JS so it can
be hosted for free on GitHub Pages — no build step, no server, no database.

The first module is **Employee Directory**: add, edit, search, filter, and
export employee records. It's built to be one of many — the app is a shell
that loads independent modules, and each module manages its own screen and
its own data.

## How the modularity works

```
info-hub/
├── index.html         ← shell page (nav + content frame) — do not edit per module
├── modules.json        ← the ONLY file you touch to add/remove a module
├── css/styles.css      ← shared visual language + reusable component classes
├── js/
│   ├── core.js          ← module registry, nav rendering, storage — never edit
│   └── loader.js         ← reads modules.json and loads each module's script
└── modules/
    ├── _template/        ← copy this to start a new module
    └── employee-info/    ← the Employee Directory module
        └── module.js
```

- `core.js` doesn't know any module by name. Every module calls
  `InfoHub.registerModule({...})` when its script loads, and the shell builds
  the sidebar and switches screens from that registry.
- Each module gets its own namespaced storage bucket
  (`ctx.storage.get/set/remove`), so one module can never read or overwrite
  another's data.
- **Removing a module** = delete its line in `modules.json` (or set
  `"enabled": false`). Nothing else changes, and no other module is affected.
- **Adding a module** = copy `modules/_template`, rename it, build your
  `render()` function, add one line to `modules.json`.

### Add a module — step by step

1. Copy `modules/_template` to `modules/your-module-id/`.
2. In `module.js`, set `MODULE_ID` / `MODULE_NAME`, and build `render()`.
   Reuse the shared classes in `css/styles.css` (`.btn`, `.record-table`,
   `.panel`, `.empty-state`, etc.) to stay visually consistent.
3. Add an entry to `modules.json`:
   ```json
   { "id": "your-module-id", "path": "your-module-id", "enabled": true }
   ```
4. Refresh the page — your module appears in the sidebar automatically.

### Remove a module

Delete its entry from `modules.json` (or set `"enabled": false`). Its folder
can stay on disk untouched; it just won't be loaded. The rest of the app is
unaffected, and no other module's data is touched.

## Data storage

Everything is stored in the browser's `localStorage`, namespaced per module
(`infohub::<module-id>::<key>`). That means:

- No backend needed — works on GitHub Pages as-is.
- Data is local to one browser/device. It won't sync between your laptop and
  phone, and clearing browser data will clear it.
- The Employee Directory module includes a **CSV export** button so records
  can be backed up or moved elsewhere at any time.

If you later want shared, synced data (e.g. a team all seeing the same
employee list), you'd swap the `ctx.storage` calls inside a module for calls
to a backend or a service like Firebase/Supabase — the module interface
doesn't change, only what happens inside `render()`.

## Run it locally

No build step — just serve the folder statically, e.g.:

```bash
cd info-hub
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly via `file://` won't work, because the loader
fetches `modules.json`, which browsers block over `file://`.)

## Deploy to GitHub Pages

1. Create a new GitHub repository and push the contents of this `info-hub`
   folder to its root (or to a `docs/` folder — either works).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick the branch (e.g. `main`) and the folder (`/root` or `/docs`).
4. Save. GitHub gives you a URL like
   `https://your-username.github.io/your-repo/` — that's your live app.
5. Any time you push a change (including adding/removing a module in
   `modules.json`), GitHub Pages redeploys automatically within a minute or two.

## Employee Directory module — what's included

- Add, edit, delete employee records (name, email, phone, department,
  position, join date, status, notes)
- Auto-generated employee codes (`EMP-0001`, `EMP-0002`, …)
- Search by name, email, code, or role
- Filter by department and status
- CSV export of the current filtered view
- Status badges for Active / On Leave / Exited
