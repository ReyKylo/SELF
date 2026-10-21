---
name: gpt-chat-maximize
description: Coordinate multiple ChatGPT/Codex/Work conversations contributing code or research to one GitHub repository safely, in parallel, with scoped branches, explicit file ownership, bounded tools, independent QA, and sequential merges. Activate for requests about parallel builds, multi-chat teamwork, multiple branches, handoffs, or cross-workstream integration.
---

# GptChatMaximize — Parallel Chat Development Protocol

**Purpose:** Increase useful output without duplicate research, merge conflicts, damaged data, fake QA, or bloated model usage. A branch isolates Git changes, **not Supabase schemas, storage, remote APIs, deployments, or other shared side effects**.

This is a **repository-hosted skill**, not a claim it has been installed globally in every ChatGPT conversation. Every fresh worker chat must read this file plus the project workstream contract in [SELF workstreams](./references/SELF_WORKSTREAMS.md) before writing.

## 1 — Begin with reality, not memory

Before creating a worker branch or modifying a file:

1. Confirm repository owner/name and target project; never confuse SELF (`ReyKylo/SELF`) with Bintang Trader or PANJUL.
2. Read `AGENTS.md`, this skill, the current workstream document, applicable Phase 1 quality blueprint, `main` HEAD and open pull requests.
3. Identify the **latest base commit SHA**, your assigned workstream, allowed paths, denied/shared paths, assumptions and deliverable acceptance tests.
4. Check if another active PR touches your paths. **Branches are not locks**: if ownership is unclear, stop writes and have the coordinator reassign before proceeding.
5. Create your own branch **from latest `main`** with the workstream-specific branch name. Never reuse a stale branch left over from an older feature.

Do not create a workstream branch on the basis of chat-history assumptions alone. The GitHub repository and PRs are the source of truth.

## 2 — Work roles, not a swarm of uncoordinated agents

| Role | Job | Write scope |
|---|---|---|
| **Coordinator** | Break down goals, assign paths, own integration plan, resolve blockers, order merges | Workstream contract, small coordination docs |
| **Worker A / PE** | Source, author and verify PE case packet | `content/career-cases/pe/**` and `tests/cases/pe/**` |
| **Worker B / VC** | Author and verify VC case packet | `content/career-cases/vc/**` and `tests/cases/vc/**` |
| **Worker C / Consulting** | Author and verify consulting case packet | `content/career-cases/consulting/**` and `tests/cases/consulting/**` |
| **Integrator / QA** | Cross-track schema inspection, app integration after approved design, regression, safe merges | Shared app, database, CI and deployment-related files only when specifically authorized |

Prefer **three independent case specialists + one integrator** for the current Phase 2. Do not launch expensive duplicate research agents in every worker. Dedicated subagents are optional and must add clear value.

### Non-negotiable boundary

Specialists must **not edit** `app.js`, `career-learning.js`, `career-learning.css`, `career-portfolio.js`, `career-kits.js`, `career.js`, `index.html`, `tools/build_cloudflare.py`, `content/career-learning.json`, `.github/workflows/**`, `supabase/**`, `AGENTS.md` or coordination files. Changes to a shared file go into an **integration request**, not an unsanctioned worker commit.

The current approved Phase 1 quality blueprint is **read-only input**, not an editable shared target: `docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md` and `content/career-prep-quality-blueprint.json`.

## 3 — Branch, PR and integration protocol

**Each worker:**
- Create one `feat/self-career-case-<track>-<date>` branch from the same current `main` base, unless a coordinator updates the baseline for everyone.
- Edit only assigned paths. Keep binary/private assets out of public/browser-served locations.
- Commit runnable, reviewable content and focused tests. No direct commits to `main`.
- Open **one workstream PR**. Include base SHA, exact files changed, case sources, numerical checks, test commands/results, known limitations, and cross-track dependencies.
- Never merge your own PR unless explicitly assigned as Integrator by the owner. Do not claim a GitHub commit is a production deployment.

**Integrator (serialized, not parallel):**
1. Inspect every PR changed-file list. Reject out-of-scope edits before merging.
2. Check provenance, case-source authenticity, spreadsheet math, dated assumptions and rights/access limits.
3. Check all CI results from the current PR head SHA; optionally run an independent adversarial review.
4. Merge **one PR at a time** after checks pass. Re-evaluate the next PR against the newly updated `main`. Resolve drift/conflicts without force-pushing other people's work.
5. Merge shared app integration only after the underlying case packets meet the content contract and UI design is approved.
6. Verify production and authenticated file lifecycle separately; CI success alone does not imply deployed functionality.

If PRs conflict on the same shared file, **do not blindly cherry-pick or overwrite**. Escalate to Integrator with both intended outcomes and let it compose the shared change.

## 4 — Supabase / sensitive operations: stop by default

Git branches do **not** isolate the SELF Supabase project (`btiwxqjiptbwaunjibjh`).

- **Workers A/B/C:** read-only database access unless separately explicitly authorized. No migrations, bucket/policy changes, data imports, user data edits, production deployments or destructive jobs.
- **Integrator:** any schema/storage migration needs a reviewed migration, RLS/security check, rollback/recovery plan, and explicit scope authorization. Run once in controlled order, never from multiple chats concurrently.
- Use fixtures/mocks for tests instead of writing to shared production data.
- Never copy tokens, passwords, sensitive user files, or confidential investment records into repo/PR/issues.
- Private repository visibility does not make client-side hidden answers secret. Do not ship blind-assessment answer keys in browser bundles or public assets.

## 5 — Efficient usage, high-signal work

1. **Discover once:** reuse the 41-source catalog, existing expert evidence, verified videos, quality blueprint and baseline. Search only genuine gaps.
2. **Work case-first:** produce actual data packet + 4 useful exhibits + exercise + sources + numerical validation, not a 30-page generic commentary report.
3. **One scope, one PR:** split tasks across distinct files; minimize repeated tool reads, style debates and broad audits.
4. **Teach correctly:** relatable analogy → immediately name the *professional English term* (“Yes, ini namanya …”) → precise definition → visual/example → independent attempt → correction.
5. **No inflated assertions:** “12 sources identified” is not “12 pages deeply verified”; “model exists” is not “user's workbook formulas checked”; “self-reviewed” is not “expert certified”.
6. **No silent waiting or deferred work:** finish as much as possible in the current turn. Do not promise autonomous follow-up or automatic communication between separate chats.

## 6 — Case acceptance gates

For each case packet, check:

- A clear decision with a genuine business tension, not a plug-and-play arithmetic drill.
- Source-ledger entries distinguishing **publisher facts**, **case assumptions** and **analyst inference**.
- At least 4 *different* relevant exhibits; precise dates and units; non-decorative visuals.
- A professionally named technical syllabus aligned to the existing 12 competency targets for that track.
- Training mode with guided examples **and** an independent assessment with no premature answer reveal.
- Deterministic tests for finance/units; explicit downside, risk and alternate scenarios.
- An analyst memo/deck output specification, questions from a skeptical partner, and a defendable recommendation.
- Strict copyright/attribution. An invented case must be unmistakably labeled **SIMULATED**. A published interview case isn't a real client deck.
- Quality verdict **ready for integration** only if the actual checked artifacts exist. “Ready for recruiter” is a later, separate gate.

## 7 — Exact handoff template

At the end of each worker delivery include, concisely:

```text
WORKSTREAM: <PE / VC / CONSULTING>
ROLE: <Worker / Integrator>
REPO: ReyKylo/SELF
BASE MAIN SHA: <verified hash>
BRANCH: <branch>
PR: <link>
OWNED PATHS: <paths>
FILES CHANGED: <filenames>
WHAT IS REAL AND VERIFIED: <concrete evidence>
TESTS: <command + actual pass/fail>
SOURCE EVIDENCE: <canonical URLs / page>
UNRESOLVED: <issues>
NEEDS INTEGRATOR: <required shared changes>
SUPABASE WRITES: none (unless explicitly approved)
MERGE STATUS: not merged / merged, with actual evidence
```

No lengthy status theater. A PR link and diff, a test result and a substantive case packet are better than pages of promises.

## 8 — Activation and limitations

In any new chat, start with: **“Gunakan GptChatMaximize di `ReyKylo/SELF`, baca `.agents/skills/gpt-chat-maximize/SKILL.md` dan `references/SELF_WORKSTREAMS.md`, ambil role [A/B/C] dan branch yang ditentukan. Jangan sentuh shared files atau Supabase.”**

The other chat must have authorization/access to the repository. Skill files in GitHub are reusable instructions; ChatGPT does **not** automatically share unsent chat state, maintain guaranteed file locks, spawn independent workers, or install this as a globally active native Skill. The coordinator must communicate via shared GitHub paths, PRs, explicit handoffs and user-provided instructions.

**The skill itself is the guardrail; actual parallel execution begins when separate chats are started and assigned.**
