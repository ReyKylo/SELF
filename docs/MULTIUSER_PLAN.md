# SELF multi-user plan (open signups)

Goal: anyone can create an account; every account sees only its own data. Rooms for everyone: **Today, Work, Hunt, Studio**. **Study** (finance-career curriculum) is owner-only and untracked: `access.js` lists the owner user id; other accounts get no Study door, palette entry, page or synced progress. Hunt Radar (finance clusters, Jakarta) is owner-only too. Hunt Tracker, Pipeline, Outreach, Companies, Interviews and Kit are open to everyone, with neutral industries and drop reasons.

## Already true (audited 2026-10-26, project `btiwxqjiptbwaunjibjh`)
- Supabase Auth email + password with signup.
- 25 public tables, all with RLS on (`auth.uid() = user_id`); composite FKs stop cross-user references.
- Storage buckets scoped by `auth.uid()` folder.
- Security advisor: only "leaked password protection disabled" (dashboard setting, not code).

## Phase A: account-bound settings (this PR)
Today pins and Work saved views lived only in one browser (Study and Hunt drafts are deliberately NOT synced).
`user-sync.js` mirrors allow-listed `localStorage` keys (`self.today.*`, `self.views.*`) into `public.user_kv` (RLS, 2000 keys/account, 256 KB/value).
- Remote wins on sign-in; local-only keys upload once. Sign-out flushes, then wipes synced keys (shared computers).
- If the table is missing or offline, the app keeps working from localStorage.
- Migration `20261026000000_self_user_kv.sql` is applied to project `btiwxqjiptbwaunjibjh` (2026-10-26). Cross-account isolation was checked by hand with two real accounts.

## Phase B: onboarding (next)
Password reset, clearer verify-email flow, first-run empty states per room, Hunt hidden behind a flag for new users.

## Phase C: hardening (next)
Enable leaked-password protection and custom SMTP, set production redirect URLs, per-account storage quota, account delete (needs an Edge Function), Terms and Privacy page, two-account RLS test as a CI/manual gate.
