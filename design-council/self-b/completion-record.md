# SELF B Cobalt Precision — scoped completion record

2026-10-12. Prepared from the retained independent Builder, Looker A, Looker B, QA and Discussion Leader reports and actual browser evidence. This closes the isolated appearance workstream; it does not approve a joint release.

## Decision

**BOUNDED PASS** for the approved B appearance rebuild and exercised native workflow regressions. The Discussion Leader confirmed no open blocker or major in this scope. PR #3 remains DRAFT. No merge, rebase, deployment or PR #2 integration was performed.

Tested head: `359bc8da9672e378f2c1314c5fc7ff6342e42d7a`.
Product revision: `e79803f5b45030e14ee5683019a00a0308bd4f1c`; final head changes QA only, with identical product files.
[Successful browser run](https://github.com/ReyKylo/SELF/actions/runs/38183693182).
[Full runtime artifact](https://github.com/ReyKylo/SELF/actions/runs/38183693182/artifacts/11718831325).

Both independent Lookers issued bounded visual PASS after inspecting actual browser captures and recorded interactions. Their scenarios reexecuted on the final head: 20 A route captures and 45 B cases, with no page errors. Independent QA inspected final artifacts and issued bounded PASS; the leader challenged the evidence and accepted only this declared scope.

## Implemented result and ownership

| File/area | Result | Cross-work boundary |
| --- | --- | --- |
| tools/cobalt_precision_v6.css | Navy navigation, white working surfaces, cobalt selection; compact Dashboard, full-width Career lanes, refined Calendar/Notes/Desk; long text wrapping and mobile collision fixes | New isolated stylesheet; no investment stylesheet changed |
| tools/workspace_v4.js | Actual saved-board spatial previews, existing task trigger, unchanged native toolbar moved outside canvas, mobile destinations aligned to the five existing routes | Additive presentation code; existing spatial engine/state schemas retained |
| tools/build_visual.py | Invokes authoritative base builder, injects appearance and SELF brand, applies exact-one-anchor BODY route-marker guard, checks final JS syntax | tools/build_cloudflare.py remains unchanged; no protected build replacement |
| tools/reviews + cobalt-review workflow | Independent synthetic browser scenarios, screenshots, real storage assertions and report gate tied to tested SHA | Existing investment tests/workflow untouched |

The UI compatibility guard addresses an inherited handler that treated body[data-page] as an actionable route. Ordinary native input clicks could cause a render before change/submit. The wrapper now ignores BODY in that specific delegate while preserving later listeners. This is a narrow behavior compatibility repair, not exclusively CSS. Trusted native submit/change traces, real IndexedDB records and reload assertions verify the repaired workflows. No financial calculation, source registry, historical cutoff, storage key, database schema or cloud synchronization behavior was changed.

## Reference grounding

The recovered corpus comprises five original videos and seven original supplied images; the earlier four-image brief was superseded by seven actual attachments. Integrity was checked and project-relevant anchors reexamined. Historical reference learning remains INSPECTED_BASELINE; decoded frames do not establish continuous motion or easing.

| Reference anchor | Adopted principle | Target proof |
| --- | --- | --- |
| V1 10.7 s | Persistent orientation | Five-route shell, page identity and contextual navigation |
| V5 8 s; differentiated workspaces | Recognizable objects and task-specific representations | Actual spatial thumbnails; distinct Career, Calendar, Notes and canvas layouts |
| V3 8.5–12 / 15–16 s | Visible filter scope | Real Career search/select/clear and contextual records |
| V2 object continuity; V4 5 / 35–39 s | Complete identity and correspondence | Long labels retained, Calendar full event detail, native Desk move/Undo identity |
| I4 empty interface; I7 record anatomy | Honest sparse states and readable records | Empty first-use actions, clearly synthetic populated fixtures, aligned readable working content |

These anchors motivate the target standard. They do not certify reference backend functionality.

## Actual QA proof

All eight groups passed in remote GitHub Actions Chromium with isolated synthetic local data:

1. Notes quick creation, title/body edit, reopen and local reload.
2. Task completion, reload, Calendar checkbox consistency and Career filter/clear.
3. Calendar event creation, edit, matching times and local reload.
4. Company CSV import, preview/confirm and local reload.
5. Desk board context, pan/select/zoom, native pointer drag, Undo and local reload.
6. Desk Fit/card disclosure and normal selection at laptop/mobile widths.
7. Thirty route/viewport measurements across 1366×768, 1440×900, 360×800, 390×844 and 768×1024.
8. Mobile dock/Menu, reachable sidebar route and guest Cloud panel open/close.

All 30 measurements had no document-level overflow, including a valid 97-character board identity containing an unbroken run. Native drag changed stored coordinates (100,100) → (190,145); native Undo and reload restored (100,100) and the same object ID. No forced clicks or application callback/model mutation substituted for user actions. External calls were blocked; no live account or cloud writes were performed.

Successful build verification also retained the original 4,518,845-byte source SHA256 `6a41ca200e68278c111d4a95a8298847dddbd471083f3fe903722c2ec73426c9`, JS syntax and existing workspace/Calendar smoke checks.

## Selected acceptance results and limits

| Criterion | Result in selected scope |
| --- | --- |
| V01/V04/V05 hierarchy, useful density, identity | PASS / VERIFIED by both independent visual reviews; prior layout majors closed |
| V02/V03/S03 layout, adaptation, edge content | PASS / VERIFIED for named viewports and recorded interactions; no physical-device certificate |
| S01 sparse state | Bounded PASS with disclosed empty Notes wording and onboarding icon minors |
| I01/I02 controls and filter consistency | PASS / VERIFIED for the eight groups, not every legacy utility |
| I03/I04 keyboard and anchored controls | Bounded PASS for Desk strip Tab access, selected dialog transitions and tested mobile Menu/guest Cloud access; exhaustive audit NOT VERIFIED |
| I06 drag | PASS / VERIFIED for valid native move, Undo and reload; invalid targets/cancellation/rejected writes NOT VERIFIED |
| D01/D02 persistence and consistency | PASS / VERIFIED for successful local records and exercised derived states; rejected-write recovery and live cloud NOT VERIFIED |
| S02/D03 failure and concurrency | NOT VERIFIED; excluded from this appearance slice |
| A01 accessibility | Bounded native-scale readability review only; formal contrast/screen-reader audit NOT VERIFIED |
| I05/P01–P04 motion, latency, loading and scale | NOT VERIFIED; no normal-speed, renderer, latency, cold-load or large-dataset claim |

This is not certification of all 22 engineering extensions.

Accepted minors: zero-note copy uses no-match wording; first empty Dashboard label/icon overlaps locally while its title/action remain usable; Calendar horizontal-scroll discoverability can improve; some subordinate legacy metadata is small; mobile Fit is an overview with small prose but a readable focus editor is reachable; long editor titles use standard single-line horizontal disclosure.

Additional excluded scope: live cloud authentication/synchronization/restore, production fonts and hosting, physical touch, mobile Safari/Android and full Investment Intelligence compatibility.

## Investment preservation and future integration

PR #2 remains DRAFT and unmerged, branch `feature/investment-intelligence-academy-v1`, head `241dbc99fecc6497b54898bbe8ad277b3551a51e`. The complete 37-file changed list was audited. The original shared-builder overlap was removed before advancing this visual branch; the final changed-file list has no direct overlap with PR #2.

**Joint compatibility remains BLOCKED by the user's cross-work handoff.** Investment modules are absent from this visual branch and were not recreated. No Bintang Trader system was touched.

A future coordinated integration should apply only named visual files to a separately agreed integration branch, retain PR #2's authoritative builder and modules, and run its existing investment QA plus route-specific visual inspection. Investment styling should use isolated education/research/workbench/deck presentation layers, preserving source distinctions, editable controls, route IDs and persistence. No automatic merge or rebase is authorized by this completion record.

## Durable evidence

`evidence/browser-359bc8da.zip` contains 22 unmodified final JSON/capture files, including independent reports, native action/storage records and selected actual screenshots. Git blob SHA: `9771e7daba52036adb1b33a81da58759a29def8d`.

`evidence/browser-a44f0cce.zip` retains round-two reports and selected captures, including then-unresolved QA failures. Git blob SHA: `ce6b11c545fc2afffaa3eb223adcd8e260b17b64`.

Earlier round reports remain in this branch. The final evidence does not erase failed runs or convert historical approvals into new-build proof. Workspace maintenance subsequently removed local scratch; repository source, browser artifacts and these already-uploaded evidence blobs were retained.
