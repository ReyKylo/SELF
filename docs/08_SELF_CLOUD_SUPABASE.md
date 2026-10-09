# SELF Cloud Sync V1 — Rey personal environment

> Scope: SELF only. This is not connected to Bintang Trader, its Supabase,
> GitHub, Cloudflare projects, data, contacts, or operational systems.

## Verified components

- Repository: ReyKylo/SELF, main.
- Supabase: SELF (project ref btiwxqjiptbwaunjibjh), Singapore.
- Database migration: supabase/migrations/20261009_self_local_first_sync_v1.sql.
- Exposed tables: self_records, self_sync_state; per-user Row Level Security.
- Write path: revision-checked self_apply_changes RPC, with bounded delta batches.
- App: local IndexedDB continues as the primary source; cloud sync is optional.
- Build: tools/build_cloudflare.py injects tools/self_cloud_runtime.js into
  generated dist/index.html AFTER original source assembly and validation.
- There is no service_role or secret key in the frontend.

## Configure Supabase Authentication for the deployed URL

The connected tools do not manage Auth redirect allowlists. This must be done
once after the deployment's real HTTPS URL is known.

1. Open https://supabase.com/dashboard/project/btiwxqjiptbwaunjibjh/auth/url-configuration
2. Set **Site URL** to the actual SELF HTTPS deployment URL.
3. Add the same exact SELF deployment URL to **Redirect URLs**. If the app is
   served from a subpath, allowlist that path precisely as well.
4. Save. Keep unrelated business domains OUT of the allowlist.
5. In deployed SELF, open the **SELF Cloud** panel, enter your email, and
   request a magic link. Open that link using the same browser/device.
6. After sign-in, check the status in the panel. On an empty cloud account,
   the app uploads your existing records incrementally.
7. If cloud data already exists on a second device, **do not overwrite**.
   Choose Restore from cloud. A full local backup is downloaded first.

To use a six-digit email OTP instead of a magic link, enable an OTP-bearing
email template in Supabase Auth → Email Templates. Magic links are default.

## Data safety and efficiency rules

- Local save and offline use never depend on network success.
- A successful local save queues cloud sync after a short debounce.
- Only changed records and deletion tombstones are uploaded.
- Batches are limited to 60 records / roughly 800 KB.
- Every cloud batch must match the last known server revision. Concurrent
  changes from another browser stop automatic upload instead of clobbering.
- The sync cursor is stored per authenticated Supabase user in this origin's
  localStorage; no cross-user data is intentionally merged.
- Existing browser data is **not migrated by deploying code**.
- File attachments / binary blobs in IndexedDB are not uploaded in V1.
- The cloud is not end-to-end encrypted; Supabase secures access with auth/RLS.
- After clearing browser storage, sign in and explicitly restore cloud data.
- Do not enable a broader public anonymous database policy or copy credentials
  from any other project.
- Use Cloudflare Access if the deployed app itself must be private (RLS
  protects stored data, not visibility of the static sign-in page).

## Validation already run

- GitHub Actions: Verify Rey Workspace source build.
- Node syntax check of source module and injected cloud adapter.
- Supabase security and performance advisors: no current findings.
- anon SELECT and RPC EXECUTE privileges: false.
- authenticated SELECT and RPC EXECUTE privileges: true.

## Outstanding browser checks before claiming production-ready

- Verify exact Cloudflare Worker URL and that the main branch deployed.
- Confirm Auth magic link round-trip on that URL.
- Create an example Career contact, then check that SELF Cloud uploads a row.
- Reload and confirm unchanged IndexedDB data.
- Sign in on another browser and restore the cloud after downloading its
  local JSON backup.
- Edit the same record on two devices: confirm revision conflict blocks
  overwrite and preserves both browsers' local data.
- Check attachment behavior and offline errors.

Cloudflare deployment and real sign-in were not verified solely by merging
code to GitHub. Do not call those tests passed until they have been run.
