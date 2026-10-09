# Career Studio — Blue Reference Dashboard V3

## What changed

The previous Career V2 build used a generic text hero and minimalist two-column panels. This did **not** match the provided visual reference. V3 now implements a screenshot-inspired layout in the existing Career Overview:

- Large blue illustrated hero with an original layered-mountain SVG and subtle hiker silhouette.
- Deep-blue quick-action panel on the right.
- Four compact statistic cards based only on stored records.
- Functional Follow-ups, Recent Activity, Career Command Center, and Recent Opportunities.
- More visually consistent light-blue surfaces, navy typography, rounded panels, and mobile stacking.
- Keeps five-item global sidebar and the existing Career sub-navigation.
- All buttons use the existing Career action handlers (`data-cr`).

The visual reference contains illustrative 12/8/28 and 60% values. This implementation never hardcodes those figures. Data comes from the current Rey browser database. The dashboard shows a clear empty state where necessary.

## Exactly what is protected

The current HTML is reconstructed from immutable source segments with SHA-256 verification, then patched **only** at build time:

1. The Career route render pointer is changed from `careerStudio` to `careerStudioReference`.
2. An additive presentation module is inserted before the existing render function.
3. Career-specific CSS is appended after the existing styles.
4. Only `dist/index.html` and `dist/career-landscape.svg` are published.

Nothing changes the existing IndexedDB storage, schemas, Whiteboard, Journal, Nested Worlds, Backpack, or other routes. Import/Export and CSV functionality remain in the existing code.

## Validation and deployment

Build locally with:

```bash
python3 tools/build_cloudflare.py
python3 -m http.server 8000 --directory dist
```

Cloudflare Workers settings:

- Build command: `python3 tools/build_cloudflare.py`
- Deploy command: `npx wrangler deploy`
- Root directory: `/` (repository root)

Build command validates SHA-256 for the original source, runs source checks, patches UI, and parses final deployment JavaScript with `node --check`.

## Important limitations

- Visual mock/test previews are not proof of Cloudflare deployment correctness. Verify in actual deployed URL.
- Cloudflare Worker static hosting itself does not enforce login/privacy. Use Cloudflare Access for private data.
- New assets can be updated without altering old source segments.
- Dates/activities reflect stored records and only their existing quality; no real-time job availability service is added.
- Follow-up cards show existing saved dates; if none exist, they show an actionable empty state.

## Browser checks required after deploy

1. Desktop Career Overview shows blue illustrated hero, dark quick panel, four stat cards, Follow-ups, Activity, and Command Center.
2. Mobile layout has no sideways overflow.
3. Each Career tab still works (Companies, Opportunities, Networking, Documents).
4. Import CSV and Add buttons still open the original functional dialogs.
5. Reload persistence (Companies, Opportunities, Contacts, document links).
6. Whiteboard drag, pan, zoom and save still work.
7. Journal saves and reopens notes.
8. Nested Worlds, Backpack, More Hub, Calendar remain accessible.