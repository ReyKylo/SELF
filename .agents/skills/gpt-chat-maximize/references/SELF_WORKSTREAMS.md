# SELF — GptChatMaximize workstream assignments

**Date:** 2026-10-22 · **Project:** private `ReyKylo/SELF` · **Current development milestone:** Career Prep Phase 2 (Professional Case Construction). Phase 1 quality blueprint is already merged to main.

**Read first:** `AGENTS.md` → `.agents/skills/gpt-chat-maximize/SKILL.md` → this file → `docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md` and `content/career-prep-quality-blueprint.json`.

**Source of truth:** GitHub live main SHA / open PRs. No chat automatically reads what another chat is doing. Assignment below is a planned partition, not a lock or evidence a worker is already running.

## Ownership matrix — Phase 2

| Chat | Role | Branch to create | Allowed new files | Explicitly prohibited |
|---|---|---|---|---|
| A | Private Equity case specialist | `feat/self-career-case-pe-20261022` | `content/career-cases/pe/**`, `tests/cases/pe/**` | Shared UI/JS, Supabase, other case tracks |
| B | Venture Capital case specialist | `feat/self-career-case-vc-20261022` | `content/career-cases/vc/**`, `tests/cases/vc/**` | Shared UI/JS, Supabase, other case tracks |
| C | Strategy Consulting case specialist | `feat/self-career-case-consulting-20261022` | `content/career-cases/consulting/**`, `tests/cases/consulting/**` | Shared UI/JS, Supabase, other case tracks |
| D | Integrator and independent QA | Create integration branch only when needed from updated main | Shared code, central manifests/CI, post-merge tests | No unauthorized deployment, no blind bulk merge |

**Shared-file lock list (Coordinator/Integrator only):** `app.js`, `career.js`, `career-learning.js`, `career-learning.css`, `career-portfolio.js`, `career-kits.js`, `index.html`, `tools/build_cloudflare.py`, `content/career-learning.json`, `.github/workflows/**`, `supabase/**`, `AGENTS.md`, `docs/GPT_CHAT_MAXIMIZE_*` and `content/career-prep-quality-blueprint.json`.

## Minimum case package format for specialist workers

Create ONLY under your assigned industry folder. Example:

```text
content/career-cases/pe/
  README.md                # business story, mandate, stage, usage, copyrights
  manifest.json            # typed case metadata; details below
  exhibits/                 # original simulated or properly licensed excerpts
    exhibit-01.csv
    exhibit-02.csv
    exhibit-03.csv
    exhibit-04.csv
  source-ledger.md          # origin, exact page, source date, reliability, assumption flags
  learner-tasks.md         # role-specific exercises; no leaked blind answers
  tutor-guide.md           # analogy -> professional term -> precise definition -> practice
  assessment.md            # blind prompt and checkable criteria, no full solution
tests/cases/pe/
  check-case.cjs            # read-only fixture and numerical invariant tests
```

The individual case files need not literally match this illustrative list, but every field/purpose must be covered. For a data-rich story, additional legitimate sources and structured data are encouraged.

**`manifest.json` contract:**

```json
{
  "id": "self-pe-flagship-01",
  "track": "PE",
  "version": "0.1.0",
  "status": "training-draft",
  "title": "A decision-specific headline",
  "decision_question": "Should we ...? At what ...?",
  "case_type": "simulated",
  "historical_cutoff": null,
  "units": "IDR million",
  "source_ledger": "source-ledger.md",
  "exhibits": ["exhibits/exhibit-01.csv", "exhibits/exhibit-02.csv", "exhibits/exhibit-03.csv", "exhibits/exhibit-04.csv"],
  "competency_ids": ["PE-01", "PE-04", "PE-07", "PE-08", "PE-11", "PE-12"],
  "learner_tasks": "learner-tasks.md",
  "tutor_guide": "tutor-guide.md",
  "assessment": "assessment.md",
  "work_products": ["Spreadsheet model", "2-page decision memo"],
  "review_status": "unreviewed"
}
```

Do not reference imaginary or unfinished files as if present. All examples, numbers, URLs, dates and calculations must be validated. Training practice prompts and reference examples may be committed under the private repository, but **do not store sealed blind-assessment answers in browser-served content**. Build a secure answer-key mechanism during a separate approved integration phase.

## Current specialist deliverables

**Chat A — PE:** A company with conflicting EBITDA growth vs working-capital cash conversion; 3 years of financial information or clearly attributed/simulated equivalents; acquisition financing, covenant/liquidity constraints, debt and exit sensitivity, maximum-bid question, realistic downside and IC defense. Use PE-01 through PE-12 competency blueprint.

**Chat B — VC:** A startup with attractive growth but retention and dilution questions; age-consistent cohorts, NRR/GRR, CAC/payback, burn/runway, financing and ownership return scenarios; investment/pass/diligence questions. Use VC-01 through VC-12. The genuine Bessemer memos are external expert evidence; they are NOT financial information for a fictional company.

**Chat C — Consulting:** An operating business with competing causes for declining profit; detailed volume/price/cost drivers, complete bridge, initiative economics with interactions, executive deck storyline and 90-day action with KPIs, tradeoffs and kill criteria. Use CO-01 through CO-12.

**Chat D — Integrator:** Do not develop parallel copies of their cases. Review schema compatibility, original exhibits, source rights, arithmetic and educational quality. After each PR passes, merge sequentially, update main between merges, then handle all cross-track registration in `content/career-learning.json`, UI/build changes and end-to-end QA as a **separate integration PR**. Existing V4/V5 UI must not be redesigned without user approval.

## Progress and sequencing

1. **Before start:** Coordinator checks live SHA and open PRs. Worker chats each read the same skill and claim only their own role.
2. **Research/build concurrently:** A, B, C can work on their files independently. They must **not** merge their own work.
3. **Review:** Each specialist produces a PR with calculations, artifacts and source ledger. Integrator cross-checks claims.
4. **Integration:** D serially merges safe PRs, with fresh `main` checks before each. If PR checkout/rebase tooling is unsupported, stop and resolve manually; do not force push or claim success.
5. **Release:** D connects finished packets to Career Prep in a later dedicated PR, runs all SELF tests, and verifies production separately.

## Kickoff prompts — copy into new chats

### Worker A

> Saya Worker A / PE untuk `ReyKylo/SELF`. Baca `AGENTS.md`, `.agents/skills/gpt-chat-maximize/SKILL.md`, dan `.agents/skills/gpt-chat-maximize/references/SELF_WORKSTREAMS.md` dari GitHub `main` terbaru. Ikuti Phase 1 quality blueprint. Buat branch `feat/self-career-case-pe-20261022` dari main terbaru, dan bangun Phase 2 Private Equity case packet recruiter-grade dalam scope `content/career-cases/pe/**` & `tests/cases/pe/**`. Gunakan bahasa Indonesia mudah, perumpamaan lalu selalu nama teknik professional English-nya. Simulasikan angka hanya bila dilabel jelas. Validasi numerik dan sumber, buat PR, jangan merge, jangan sentuh database atau shared files. Handoff sesuai skill. Jangan mengulangi riset lama kecuali ada gap.

### Worker B

> Saya Worker B / VC untuk `ReyKylo/SELF`. Baca `AGENTS.md`, GptChatMaximize `SKILL.md`, dan `references/SELF_WORKSTREAMS.md` dari main terbaru, ikuti Phase 1 quality blueprint. Buat branch `feat/self-career-case-vc-20261022`; miliki hanya `content/career-cases/vc/**` dan `tests/cases/vc/**`. Bangun case packet investasi SaaS yang realistis dengan cohort/NRR, CAC, cap table, runway, investor returns dan dissenting thesis. Bedakan memo Bessemer yang asli dari case data simulasi. Perumpamaan harus langsung diikuti istilah professional English. Validasi hasil, buat PR, jangan merge, jangan edit shared files atau Supabase. Handoff sesuai skill.

### Worker C

> Saya Worker C / Consulting untuk `ReyKylo/SELF`. Baca `AGENTS.md`, GptChatMaximize `SKILL.md`, dan `references/SELF_WORKSTREAMS.md` dari main terbaru, ikuti Phase 1 quality blueprint. Buat branch `feat/self-career-case-consulting-20261022`; hanya edit `content/career-cases/consulting/**` dan `tests/cases/consulting/**`. Bangun profitability/strategy case dengan exhibit asli atau simulasi yang dilabel benar, profit bridge lengkap, interaksi inisiatif, CEO recommendation dan 90-day roadmap. Tiap perumpamaan diikuti nama professional English. Lakukan tes dan buat PR, jangan merge, jangan edit shared files atau Supabase. Handoff sesuai skill.

### Integrator D

> Saya Integrator untuk GptChatMaximize pada `ReyKylo/SELF`. Baca skill dan assignment contract di main terbaru. Audit PR PE, VC, Consulting terhadap scope, source provenance, case consistency, formulas, copyright dan Phase 1 quality gates. **Jangan membuat ulang pekerjaan A/B/C.** Minta perbaikan ketika ada kegagalan, merge satu per satu setelah CI dan QA lulus, lalu baru buat PR terpisah untuk integrasi shared Career Prep code. Supabase migration atau deploy harus khusus terotorisasi. Hasil final laporkan dengan SHA, PR, tests dan keterbatasan yang benar-benar dicek.

**Usage control:** one source ledger shared per worker, no repeated duplicate broad research, no speculative redesigns, no per-message AI tests, and a single centralized adversarial QA pass once case artifacts exist.
