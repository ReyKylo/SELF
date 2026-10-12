# Independent QA B — round 2

Build: `a44f0cce122ea9b2fe0c17216e17534bf5367500`. GitHub Actions run `38182485043`. Chromium on isolated localhost; synthetic fixture only; all external network requests blocked. This report independently reads the executed JSON and rendered screenshot artifacts. No local browser execution is claimed.

Knowledge receipt: full Council SKILL, Design DNA, craftsmanship examples, evaluation map, anti-patterns, council protocol, source ledger and accepted SELF adaptation read. Five videos/seven images inherit INSPECTED_BASELINE, not new viewing. Asset verifier returned 12 MATCH; byte integrity does not certify target behavior. Relevant principles are V3 filter identity (8.5–12/15–16 s), V4 temporal/object correspondence (5/35–39 s), V5 distinct canvas/form/table tasks (8/16–24 s), I4 honest sparse state, and I7 record anatomy.

## Actual results and evidence boundaries

| Executed group | Independent conclusion | Actual proof |
|---|---|---|
| Calendar create/edit/reload | PASS, bounded VERIFIED | Real add/detail/edit controls completed. Edited title and start/end survived local IndexedDB reload and were visible in matching week. |
| Career CSV import | PASS, bounded VERIFIED | Native file input → preview → confirm produced exactly one imported synthetic company, retained after reload. |
| Desk native controls | PASS, bounded VERIFIED | Two-board switching, known card identity, zoom pair and Pan/Select controls succeeded and reopened. |
| Desk Fit | PASS, bounded VERIFIED for desktop 1366 only | Short-title known card lay within viewport and clear of floating toolbar. This run did not test long titles or mobile normal card selection after Fit. |
| Notes quick-create | FAIL, unresolved product/harness triage | Selector timeout; failure screenshot shows zero notes and an empty textarea. It is insufficient to call this only a wrong selector. New test records filled input before submit and actual local snapshot immediately afterward, before attempting editor selection. |
| Task checkbox | FAIL, harness/API mismatch plausible, product result not yet proven | `check()` repeatedly clicked a control whose authoritative change handler rerenders. New test performs one ordinary click, captures real persisted task status, and asserts reload result. No force-click or injected task methods. |
| Responsive sweep | BLOCKED after mobile navigation attempt | Desktop screenshots were reached, then sidebar locator was outside viewport at width360. New sweep uses actual five-destination mobile dock; this proves primary navigation only. The visible Menu control's own behavior is not certified by that change. |

Round1 all-six `ReferenceError: r is not defined` cases are invalidated harness results. They are not product failures, and none counts as a successful workflow.

Console errors are retained. `fonts.googleapis.com` ERR_FAILED arises from intentionally blocked external fonts in the isolated test. Service-worker script404 appears in the localhost environment; this does not prove a visual regression or production offline failure. Neither is silently promoted to cloud/auth testing.

Native screenshot Notes empty/no-match wording remains a minor observed ambiguity: with zero records and empty search, it asks the user to try a different search. Sparse counts remain honest; four named collections are predefined categories rather than four invented notes.

## Required next evidence

The updated harness includes a legal97-character board title containing70 unbroken characters, all30 route/viewport captures including Desk and Notes, and Fit → normal note selection at1366 and390. These additions were not part of build `a44f0cce`; only a new identified run can verify them. Reinspect the source-derived interaction gaps using persisted snapshots rather than guessing from a timeout.

No final council signoff. Notes/task/mobile proof remains open. General write-rejection recovery, live cloud synchronization/authentication, normal-speed motion, trace-based performance and broad accessibility remain NOT VERIFIED. Bounded local reload evidence is not cloud durability, and no score averages away open major defects.
