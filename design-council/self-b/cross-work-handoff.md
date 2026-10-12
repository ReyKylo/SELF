# Visual / Investment workstream boundary

2026-10-12. User selected B Cobalt Precision and supplied a cross-work protection handoff.

## Repository audit

Visual branch: `design/self-reference-council-20261011`, based on main `6bc7d47aa8a40e02027972f470c5b776cb15ecef`. Local checkout is a verified source snapshot without .git; writes use GitHub tree/commit/ref APIs with an expected-head lease. No broad merge or checkout was performed.

Investment PR #2 was read, including its full 37-file changed-file list and patches. It remains open/DRAFT, unmerged, head `241dbc99fecc6497b54898bbe8ad277b3551a51e`, branch `feature/investment-intelligence-academy-v1`. Its functional modules are absent from this visual snapshot. This review does not certify investment behavior.

Only direct file overlap in the original visual candidate: `tools/build_cloudflare.py`. Before advancing the visual branch, visual CSS injection and brand adjustment were moved to the NEW `tools/build_visual.py` wrapper. The shared builder is retained at main's bytes in the final visual branch. No investment-owned JS, styles, QA, cloud adapter, migrations or workflow is changed.

## Ownership and integration

| Area | Visual change | Investment boundary |
| --- | --- | --- |
| Shell and five workspaces | New cobalt_precision_v6.css | Shared tokens/shell will require investment route regression |
| Dashboard gallery | Additive rvBoardPreview + existing task trigger in workspace_v4.js | PR's iiDashboard wraps the existing dashboard; verify entry placement in joint candidate |
| Build | New build_visual.py invokes existing base builder, then appends CSS | Leave PR #2 build_cloudflare.py fully authoritative; no replacing it with visual version |
| Investment modules | No file changes | Owned by PR #2 |
| Persistence/cloud/schema | No changes | Owned by PR #2 and existing SELF |
| QA | New isolated tools/reviews and cobalt-review workflow | Existing investment QA remains intact |

Future integration must be explicit and separately authorized: start a temporary integration branch from the agreed investment head, apply ONLY the named visual files, invoke build_visual.py after the unchanged investment builder, verify every investment script/style/QA remains present, and rerun the existing 37 browser groups plus visual screenshot review. No automatic merge/rebase, PR #2 merge, investment deployment or production configuration change is part of this work.

Investment visual design is a future dependency: inspect its rendered nine-lesson education, source registry, financial workbench, memo/IC/deck and Vault states before proposing isolated route-scoped presentation CSS. Preserve route IDs, selectors, source dates/cutoff distinctions, editable model fields, warning/restore affordances and storage keys. A shared palette must not flatten these task-specific representations into repeated blue cards. Investment functional signoff from its prior QA is inherited evidence only; joint styling remains NOT VERIFIED.

## Release gate

Keep this visual branch isolated and draft. Build/source smoke success does not imply actual browser craftsmanship or investment compatibility. Both independent Lookers and QA must inspect the running visual candidate; investment joint compatibility remains blocked until explicit coordination. No Bintang Trader systems are touched.
