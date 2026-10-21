# SELF contributor instructions

This repository is **SELF**, the personal ERP and Career Workspace: `ReyKylo/SELF`. It is not Bintang Trader and not PANJUL.

## Working safely with more than one chat/agent

For parallel changes, multiple branches, cross-chat builds or coordinated case authoring, **read and follow**:

- [GptChatMaximize skill](.agents/skills/gpt-chat-maximize/SKILL.md)
- [SELF workstream assignments and startup prompts](.agents/skills/gpt-chat-maximize/references/SELF_WORKSTREAMS.md)
- [Career Prep Phase 1 quality contract](docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md)

The skill defines distinct owner-only paths, safe branches, PR handoffs, sequential integration and no concurrent shared Supabase writes. **Never assume two chats can see each other's messages.** Live GitHub state, file changes and PRs are the coordination system.

Even in a single-chat task: read latest `main`, avoid unrelated changes, run relevant regression tests, do not confuse a passing CI build with live deployment, and never label a simulated case an executed investment.

**Production controls:** `main`, shared `app.js`/Career files, CI, `supabase/**`, and deployment configuration must be modified only by the explicitly assigned Integrator or with explicit user authorization. Content workers must not mutate shared database state.

No skill file is a guarantee of platform-level automatic installation. For other ChatGPT conversations, supply the repository path and ask that chat to read it through its connected GitHub tool.
