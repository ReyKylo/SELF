# Independent QA B — round 3

Build `4eac7bd87396cd4e05c025ffb8c7a60979dae2d6`, GitHub Actions run `38182923533`, isolated Chromium localhost and synthetic fixtures. This independently reviews actual JSON, local snapshot captures, and native screenshot evidence.

Calendar create/edit/reload, Career company CSV import/reload, and Desk native board/zoom/Pan/Select controls each passed their bounded assertions again. They establish local behavior only.

Notes pre-submit screenshot and value assertion show the exact two-line synthetic text inside the quick-note field. After one normal Save click, the262ms snapshot has zero journals and the failure screenshot has a cleared textarea and zero records. Task after one normal click has331ms snapshot `Belum selesai`, no new activity and an unchecked visible control. These are actual observations, but this run did not yet wait for the expected IndexedDB revision itself; an old saved label could satisfy the old helper. General data-loss or false-save claims remain unverified until eventual-state polling/reload reproduction.

Source inspection identifies a more specific likely cause than storage latency: the generic delegated click handler searches `closest('[data-action],[data-page],.close')`, and `body` itself carries `data-page`. Plain checkbox/submit/Menu clicks can therefore fall through to BODY → `navigate(currentRoute)` → synchronous `render()`, detaching checkbox/form nodes before their native change/submit event and clearing Menu state. This is an INFERRED mechanism based on authoritative code and matching screenshots, not an instrumented event result from this run. The next QA revision logs trusted event dispatch/node connection and polls real IndexedDB for3500ms without replacing the product's persistence API.

Mobile failure is definite and separate: `#scOpen` SELF Cloud badge intercepts ordinary More clicks at390 and Notes at360. Playwright repeatedly identifies that actual element as the pointer obstruction; no forced clicks were used. This is a major I01/V03 failure because a floating utility blocks primary destinations. The resulting mobile Fit, responsive sweep and Menu groups are BLOCKED downstream; they did not exercise their intended state and cannot fail their own geometry assertions or pass them by inference.

Desktop Fit with the long-title fixture reached its normal test path before the mobile navigation block, but overall Fit group failed. Complete two-device Fit and all30 route/viewport cases require the repaired cloud-badge layout and a fresh run.

Release remains unapproved. Byte integrity and earlier baseline reports do not certify these interactions. Unchanged excluded scope remains live cloud/auth, induced write rejection, broad accessibility, actual normal-speed motion and measured performance budgets.
