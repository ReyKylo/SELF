# QA Evidence — 2026-10-09

## Method

- **Static:** extracted the source's single `<script type="module">`, ran `node --check` successfully after additive patching.
- **Browser:** Chromium in Playwright rendered the 4.5 MB candidate via `page.set_content` with in-memory mocked `localStorage`, because the browser runner blocked navigation to local file and localhost URLs. This tests local JS rendering and interactions, **not real IndexedDB durability or a deployed Sites environment**.

## Checks executed successfully

| Scenario | Result | Notes |
|---|---|---|
| Career loads without uncaught browser page errors | PASS under mock storage | Chrome headless, desktop |
| Sidebar contains five items | PASS | Desk, Career, Calendar, Capture inbox, More |
| Career Discover renders existing companies | PASS | 62 seeded companies present in this test source |
| Open a company workspace | PASS | In-place context panel |
| Opportunity list and source links render | PASS | 65 seeded opportunity records in test source |
| Change application stage | PASS under mock storage | Selected `Interview`, UI updated |
| Switch to Kanban | PASS | Seven stage columns |
| Documents: add career CV link/metadata | PASS under mock storage | Record visible after save |
| More Hub tiles | PASS | 15 tiles; only existing routes |
| Navigate to legacy Journal | PASS | Journal page visible |
| Navigate to legacy Desk | PASS | Whiteboard viewport visible |
| Import CSV: preview + confirm | PASS under mock storage | Example company surfaced after confirm |
| Mobile Career render and width | PASS | 390px viewport; no document horizontal overflow; no browser page errors |
| World gallery route rewrite | STATIC VERIFIED | New World directory uses existing boards |

Some automated sequences were split into separate tests because longer full-browser suites timed out; the individual scenarios above passed. Screenshots in `design_references/actual_*` reflect local browser rendering with fallback mocked storage and seed data; they are not deployed-Sites screenshots.

## Must still test before deployment

- Real IndexedDB save/refresh/restore on https or localhost browser origin, including migration and attachments.
- Two-tab conflict handling, quota/storage error, backup and restore of active private data.
- Whiteboard drag/multi-select/pan/zoom/World enter/exit and undo/redo after style changes.
- Create/edit Journal, People, Backpack voice and file capture on real desktop/mobile browsers.
- CSV duplicate imports, updates, invalid rows, large rows, malformed quotes, and interrupted transactions.
- More hub navigation across every existing route, browser back/forward, Safari/iPhone touch and focus controls.
- Review older pages for leftover childlike illustrations/labels and fix through non-destructive UI-only changes.
- Verify source version and Site access-mode/privacy before publishing.
