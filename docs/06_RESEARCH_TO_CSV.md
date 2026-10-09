# Research → CSV Handoff Protocol

Use ChatGPT Work/Cloud Browser when doing fresh job research. Do not scrape LinkedIn in ways that violate service restrictions; use publicly accessible careers pages, firm sites and other legitimate sources.

## Research prompt (paste into Work)

"Find current investment internship openings and relevant VC/PE/M&A/IB/consulting target companies in Indonesia. Prefer primary company sources and include the original verified URL and checking date (Asia/Jakarta). Distinguish confirmed active postings from historical careers pages and unverified leads. Never fabricate contacts, emails, application links, deadlines, salaries, or availability. Export three separate CSV files named `companies.csv`, `opportunities.csv`, `contacts.csv` using the exact column headers in my attached Rey template ZIP. If a field cannot be verified, leave it blank. Use stable external_id strings when available, and include source_url plus research_date. Summarize findings and clearly label which opportunities are actively confirmed versus merely possible."

## CSV templates

- `csv_templates/companies.csv`
- `csv_templates/opportunities.csv`
- `csv_templates/contacts.csv`
- `csv_templates/applications.csv`
- `csv_templates/followups.csv`

They contain headers only — **no made-up job records**.

## Import constraints in candidate

- CSV must use UTF-8 and comma delimiters; quoted fields are parsed, including line breaks.
- Max 4 MB and 2,000 records per upload. Split larger imports.
- Header names must match the provided templates; arbitrary column mapping is a next-step enhancement.
- Preview up to eight rows and explicitly confirm before committing.
- Dedupe primarily by `external_id`, then URL/name; review results afterward.
- Linked application/follow-up updates require existing record identifiers; unmatched are skipped and counted.
- **Backup first**. Avoid importing sensitive contact data from unverified third parties.
