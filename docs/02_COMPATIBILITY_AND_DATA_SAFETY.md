# Data, Routes and Regression-Safety Contract

## Original records and storage

Current source uses local-first `openWorkspaceStorage`, IndexedDB when supported and a localStorage fallback. Primary `data` collections include `companies`, `opportunities`, `contacts`, `tasks`, `goals`, `learning`, `resources`, `journals`, `templates`, `events`, `inbox`, `boards`, `ideas`, `links`.

**Preserve IDs, references and actual user browser storage.** ZIP source is not an export of the data the owner has accumulated in an active browser.

The additive V2 module uses the same in-memory `data`, `active`, `find`, `persist`, `company`, `edit`, `navigate`, and `log` helpers. Its importer stores new fields on compatible existing record types rather than creating new top-level collections. `Career Document` records live under `resources` and are links/metadata only.

## Legacy route table

| Route | Owner | V2 behavior |
|---|---|---|
| `#desk` | Existing Whiteboard engine | Same implementation, toned-down visual |
| `#today` | Existing dashboard | Reachable via More |
| `#worlds` | Existing boards/World records | New professional directory; original `desk.openWorld` still opens a World |
| `#calendar` | Existing calendar | Sidebar |
| `#planning` | Existing planning | More |
| `#journal` | Existing journal | More, unchanged data/editor |
| `#learning`, `#library` | Existing modules | More |
| `#career` | Existing career data | V2 Career OS UI |
| `#contacts`, `#templates` | Existing CRM/template data | Reachable via More; also used by Career |
| `#people` | Existing People Garden | More; same contacts dataset |
| `#trails`, `#postcards`, `#spark`, `#inbox` | Existing experiences | More |
| `#backpack`, `#vault` | Existing capture/storage | Sidebar and More |
| `#settings` | Existing preferences/backup | Profile |
| `#more` | New hub | Route links to modules above |

## Import matching rules

- Companies: `external_id` first, then normalized name, then exact website URL.
- Opportunities: `external_id`, then exact source URL, then title+company ID.
- Contacts: `external_id`, then LinkedIn URL, then name+company ID.
- Applications/follow-ups: update existing matching external IDs; unmatched records are **skipped**.
- Empty CSV fields do not overwrite populated fields. However the current importer is **not yet a full interactive conflict-resolution engine**; backups are mandatory for important records.
- New company names in opportunities CSV may create company records automatically; validate carefully in QA.

## Security assumptions

- URL click-outs are http(s) only, with `rel="noopener noreferrer"` where external.
- CSV content escaped in HTML. No automatic LinkedIn posting or email sending.
- No paid AI runtime, no Supabase queries added, no Telegram secret injected.
- A CSV is still untrusted input; test malicious/large content and avoid executing formulas in exported spreadsheets.
- The existing source may carry private research seed entries; audit before sharing/publishing.

## Deployment rollback

1. Keep production backup and prior HTML/repository commit.
2. Merge only after test preview passes.
3. Test full JSON backup/restore with the current user's active data on a test browser before production deployment.
4. On regression, roll back frontend version while preserving storage and exporting recovery data.
5. Do not clear IndexedDB/localStorage to 'fix' a failed migration.
