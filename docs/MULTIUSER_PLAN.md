# SELF multi-user plan (open signups)

Goal: anyone can create an account; every account sees only its own data. Rooms in scope: **Today, Work, Study, Studio**. Hunt stays Rey's personal room for now.

## Already true (audited 2026-10-26, project `btiwxqjiptbwaunjibjh`)
- Supabase Auth email + password with signup.
- 25 public tables, all with RLS on (`auth.uid() = user_id`); composite FKs stop cross-user references.
- Storage buckets scoped by `auth.uid()` folder.
- Security advisor: only "leaked password protection disabled" (dashboard setting, not code).

## Phase A: account-bound settings (this PR)
Today pins, Work saved views, Study progress/track, flashcard deck and Hunt drafts lived only in one browser.
`user-sync.js` mirrors allow-listed `localStorage` keys into `public.user_kv` (RLS, 2000 keys/account, 256 KB/value).
- Remote wins on sign-in; local-only keys upload once. Sign-out flushes, then wipes synced keys (shared computers).
- If the table is missing or offline, the app keeps working from localStorage.
- **Migration `20261026000000_self_user_kv.sql` must be applied before deploy to take effect** (no-op until then).

## Phase B: onboarding (next)
Password reset, clearer verify-email flow, first-run empty states per room, Hunt hidden behind a flag for new users.

## Phase C: hardening (next)
Enable leaked-password protection and custom SMTP, set production redirect URLs, per-account storage quota, account delete (needs an Edge Function), Terms and Privacy page, two-account RLS test as a CI/manual gate.
