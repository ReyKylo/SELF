# Career OS — Product & UX Specification

## Product thesis

The Career module should reduce effort from **research → decision → application/outreach → follow-up**. It is a personal career operating system, not a decorative productivity dashboard or a sales CRM clone. The intended user starts hunting investment internships immediately, with emphasis on VC, PE, M&A, Investment Banking and Consulting.

## Navigation

Global sidebar **Desk / Career / Calendar / Capture inbox / More**; contextual Career tabs **Today / Discover / Pursue / Connect / Documents**. Hide Biu/diorama visual language by default. More is a grid of existing modules, not a duplicate workspace or a nested sidebar list.

## Key user stories

1. I can open Career and immediately know which dates, contacts and applications need attention.
2. I can save a company using only its name, without committing to a pipeline status.
3. I can browse research targets, then see all associated opportunities and contacts in one company workspace.
4. I can open the original opportunity URL, verify current status and update my application stage without jumping between CRM pages.
5. I can save a LinkedIn contact and track invitation / response / follow-up state.
6. I can generate an editable draft using the existing template and stored context; **no messages are sent by the app**.
7. I can import verifiable research CSV without silently duplicating or deleting existing data.
8. I can save multiple versions of my CV as links, and later attach the chosen version to each application.
9. I can access personal Journal/Whiteboard/People/Worlds from More without any content loss.

## Professional visual language

Use fewer large visual components, consistent spacious cards, navy text, blue accents and gradient only where useful. Keep content dense when handling rows and sources; avoid tiny low-contrast font in production. No cartoon mascot as persistent assistant. No giant scenic diorama replacing actual tools.

## Current candidate limitations

- Today uses saved contact `followup` dates and opportunity `deadline` dates; it does not yet unify every kind of next action.
- Contact status has an editable dropdown; message delivery status remains editable via the legacy record editor. No automatic LinkedIn synchronization.
- Documents stores URL and notes; not actual file bytes or real CV revision comparison.
- CSV import accepts documented headers and detects schema, but column mapping and detailed per-field conflict UI are not implemented.
- Stage list uses existing internal values (`Belum diproses`, `Disiapkan`, `Dikirim`, `Interview`, `Offer`, `Ditutup`, `Ditolak`). It does not sync with applicant tracking systems.
- The source contains historically gathered firm/opportunity seed entries: not evidence that a role is open **today**.
- Styling of some older modules is still partially scrapbook-like; do not claim entire workspace has been redesigned.
