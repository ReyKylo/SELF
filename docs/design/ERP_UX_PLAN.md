# SELF UX: what professional ERPs do that SELF should borrow

**Build status (24 Oct 2026):** built: Export and backup (`data-export.js`, Settings › Your data), Saved views and Bulk actions (`work-tools.js`: selection, bulk status/priority/due/Space, partial-failure report with Undo, in-page delete confirm, views in Ctrl K), and the X key to select. Not built: Table view with inline editing, the list keyboard model beyond X, and everything marked W2.


**Context:** the Rooms shell, motion, drag-and-drop, Today, Hunt and Study, and the Ctrl K palette are built (PR #34). This plan picks the professional-ERP patterns (from Linear, Notion, Airtable, Asana, Salesforce, Odoo, SAP Fiori) that fit a **one-person** ERP. It leaves out the ones that only make sense for teams.

**Selection test:** a pattern is in only if it removes repeated effort, prevents a costly mistake, or makes data trustworthy. Decoration alone doesn't qualify.

---

## 1. Where the experience is today (honest)
- **Strong:** fast navigation (rooms, palette, Alt+digit), tactile feedback, honest saves with Undo, drag-and-drop with keyboard parity, Today as a real start page.
- **Weak spots, observed:**
  1. **One-at-a-time editing.** Changing five tasks' due dates is five sheet openings. There's no multi-select, bulk edit or inline cell editing.
  2. **No saved views.** Filters (Space, status, search) reset; there's no "My Career this week" view to return to.
  3. **No history.** You can't see what changed on a task or application, or when. Undo covers only the last move.
  4. **Data is locked in.** There's no export of tasks, applications, people or learning, and no backup. For a personal system of record, that's a trust problem.
  5. **No recurrence or dependencies.** "Weekly review", "follow up every 30 days" and "blocked by X" are all manual.
  6. **Study has ten doors and no "next".** (Covered in the Masterclass plan, §8.)
  7. **Lists don't respond to the keyboard** beyond tab order (no j/k, x to select, e to edit).
  8. **Density is fixed.** Power users want compact rows; phones want comfortable ones.

## 2. The upgrades, ranked
| # | Feature (ERP origin) | What it does in SELF | Impact | Effort | Database |
|---|---|---|---|---|---|
| 1 | **Table view with inline editing** (Airtable, SAP grid) | A fourth My Work view: spreadsheet rows; click a cell (status, priority, due, Space) to edit in place; Enter or Tab moves on; saves through the existing `patch` path with the save pill | ★★★ | M | none |
| 2 | **Multi-select and bulk actions** (Linear, Gmail) | `x` or Shift-click to select rows or cards; a floating action bar: set status, due, Space, priority; delete with a confirm; one Undo for the whole batch | ★★★ | M | none |
| 3 | **Saved views** (Linear, Salesforce list views) | Save the current filters, sort and view as a named view ("Career · this week · high"); pin up to 5 as pills in Work; available in Ctrl K | ★★★ | S | localStorage (W2: sync) |
| 4 | **Export and backup** (every serious ERP) | Settings → Export: CSV per table (tasks, applications, people, companies, touchpoints) and one JSON backup; generated client-side from loaded data; nothing uploaded | ★★★ (trust) | S | none |
| 5 | **Keyboard model for lists** (Linear, Superhuman) | j/k move, Enter opens, x selects, e edits title, s cycles status, d sets due (opens a date input), ? shows the cheat-sheet | ★★ | S | none |
| 6 | **Activity timeline** (Salesforce chatter, Odoo log) | Per task and application: "Status Planning → Review · 23 Oct 14:02", "Due moved"; written by the client on each successful save | ★★ | M | **W2:** `activity_log(user_id, entity, entity_id, field, from, to, at)` |
| 7 | **Recurring tasks** (Asana, Todoist) | Already in the upgrade plan (Wave 2 "Repeat") | ★★ | M | W2 |
| 8 | **Dependencies / blocked-by** (Linear, Jira) | "Blocked by" picker on a task; blocked cards show a lock badge and sort last in Three for today | ★★ | M | W2: `task_links_internal(task_id, blocks_task_id)` |
| 9 | **Templates for projects** (Asana, Notion) | Instantiate a checklist bundle: "Application package" (research, tailor CV, find two contacts, draft cover note, follow up +7 days) into Tasks linked to an application | ★★ | S | none (uses tasks and checklist) |
| 10 | **Density and personalisation** (SAP Fiori compact / cozy) | Settings → Density: Comfortable / Compact; Compact tightens rows and padding, keeps targets ≥ 32px on desktop, ignored on phones | ★ | S | preferences (local, then W2) |
| 11 | **Command palette verbs** (Raycast, Linear) | `>` mode in Ctrl K: "> due friday" on a selected task, "> move to Review", "> export applications". Builds on the parser | ★★ | M | none |
| 12 | **Notifications inbox** (Salesforce, Linear) | A bell in the top bar listing *signals*: overdue tasks, interviews tomorrow, follow-ups due, reflections missing. Derived in-app, nothing sent | ★★ | S | none |
| 13 | **Calendar week with drag-to-reschedule** | Already specified (Build spec D1, `due` adapter) | ★★ | M | none |
| 14 | **Onboarding checklist** (Notion, Linear) | First run: "Create a Space · Add three tasks · Try Ctrl K · Add a company · Open Study" with progress; dismissible | ★ | S | none |
| 15 | **Undo history** (Figma-style) | The last 10 actions in a small history panel (Ctrl Z / Ctrl Shift Z where safe); extends the move Undo to edits, bulk changes and triage | ★★ | M | none |

**Recommended first slice (one PR each, Sonnet):** 4 Export → 3 Saved views → 2 Bulk actions → 1 Table view → 5 Keyboard model. Together they make SELF feel like a professional tool and remove the biggest trust gap (data lock-in), with no database change.

## 3. Specs for the first slice
### 3.1 Export and backup (S)
- Settings → **Your data**, with buttons: Tasks CSV · Applications CSV · People CSV · Companies CSV · Touchpoints CSV · Full backup JSON.
- Built from in-memory state after a fresh `loadAll()` and Career load. Columns follow the table columns. Dates stay in ISO format. Values are CSV-escaped (quotes doubled; cells starting with `= + - @` prefixed with `'` to prevent spreadsheet formula injection).
- The download uses a `Blob` URL. Nothing leaves the device.
- Tests: escaping (commas, quotes, newlines, formula-injection prefixes) and round-trip column counts.

### 3.2 Saved views (S)
- Work toolbar: **Save view** captures `{name, view, filterSpace, filterStatus, workSearch, sort}`.
- `localStorage['self.views.'+userId]`, read and written in try/catch, at most 12 entries. Pinned views appear as pills above the toolbar. Ctrl K lists "View · name".
- Deleting a Space a view references shows "Space no longer exists" on the view, never a silent empty list.

### 3.3 Bulk actions (M)
- Selection state in `state.selected` (a Set of ids). It is cleared on navigation.
- Board: `x` on a focused card or Shift-click. List: a checkbox column (separate from the done checkbox; use `aria-label="Select …"`).
- Floating bar: `N selected · Status ▾ · Due ▾ · Space ▾ · Priority ▾ · Delete · Clear`.
- Apply with `Promise.allSettled` of `patch` calls, then one `loadAll()`. The toast reports partial failure exactly: "4 updated, 1 failed: <title>". **Undo** restores the previous values of the ones that succeeded.
- Delete asks for confirmation inside the page, never via `confirm()`, and lists the titles.

### 3.4 Table view (M)
- A fourth tab next to List / Board / Calendar.
- Columns: Title, Space, Status, Priority, Due, Updated. Cells are buttons; Enter or click turns a cell into its native control (`select`, `input type=date`); Enter saves, Escape cancels, Tab moves right.
- Sort by clicking a header (persisted in the saved view). Sticky header. Phone width falls back to List.

### 3.5 Keyboard model (S)
- Active when focus is inside a list or board region and not in a field.
- j/k or arrows move focus, Enter opens, x selects, e edits title (Table), s cycles status, d focuses due, `?` shows the overlay.
- The overlay lists the keys and is also reachable from Ctrl K → "Keyboard shortcuts".

## 4. Guardrails
- Every bulk or inline save goes through the existing `mutate`/`patch` paths, so the save pill and errors stay honest.
- No team concepts (assignees, permissions, comments). SELF is single-user by design.
- Wave 2 items (activity log, dependencies, recurrence, synced views) each need their own approved migration.
