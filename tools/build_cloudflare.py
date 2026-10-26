#!/usr/bin/env python3
"""Build the SELF static frontend for Cloudflare Workers Static Assets (no dependencies)."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"
ASSETS = ("index.html", "styles.css", "app.js", "access.js", "user-sync.js", "rooms.js", "rooms.css", "motion.js", "motion.css", "self-dnd.js", "today.js", "capture-parse.js", "palette.js", "boards.css", "boards.js", "canvas-v3.css", "canvas-v3.js", "concept-d.css", "career.js", "career.css", "outreach.js", "outreach.css", "tracker.js", "tracker.css", "dossier.js", "dossier.css", "career-grid.js", "career-visuals.js", "career-review.js", "career-lesson-loop.js", "career-nextup.js", "career-lesson-loop.css", "data-export.js", "work-tools.js", "work-tools.css", "studio-recipes.js", "studio-present.js", "studio-tools.css", "content/studio-recipes.json", "content/career-lessons-v2.json", "career-phase2.js", "career-phase2.css", "career-phase3.js", "career-phase3.css", "career-learning.js", "career-teaching.js", "career-analyst-lab.js", "career-vc-analyst-lab.js", "career-vc-waterfall.js", "career-consulting-lab.js", "career-director-review.js", "career-workbook-check.js", "career-worksample.js", "content/work-samples/index.json", "content/work-samples/pe/brief.md", "content/work-samples/vc/brief.md", "content/work-samples/vc/holdout-cohorts.csv", "content/work-samples/consulting/brief.md", "content/work-samples/consulting/E01.csv", "content/work-samples/consulting/E02.csv", "content/work-samples/consulting/E03.csv", "content/work-samples/consulting/E04.csv", "content/work-samples/consulting/E05.csv", "content/work-samples/consulting/E06.csv", "content/career-director-review/review-panels.json", "career-pe-projection.js", "career-pe-sensitivity.js", "career-portfolio.js", "career-kits.js", "career-learning.css", "content/career-learning.json", "content/career-teaching.json", "content/portfolio-sprint.md", "content/career-kits/PE_LBO_Starter.xlsx.b64", "content/career-kits/VC_Investment_Starter.xlsx.b64", "content/career-kits/Consulting_Profitability_Starter.xlsx.b64")


def main() -> int:
    missing = [asset for asset in ASSETS if not (ROOT / asset).is_file()]
    if missing:
        print(f"SELF build failed: missing source file(s): {', '.join(missing)}", file=sys.stderr)
        return 1

    # Never publish old files from a previous build or private source folders.
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    for asset in ASSETS:
        (OUTPUT / asset).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / asset, OUTPUT / asset)
        print(f"  copied {asset} -> dist/{asset}")

    html = (OUTPUT / "index.html").read_text(encoding="utf-8")
    required = ('href="./styles.css"', 'href="./rooms.css"', 'href="./motion.css"', 'src="./access.js"', 'src="./user-sync.js"', 'src="./rooms.js"', 'src="./motion.js"', 'src="./self-dnd.js"', 'src="./today.js"', 'src="./capture-parse.js"', 'src="./palette.js"', 'href="./boards.css"', 'src="./canvas-v3.js"', 'href="./canvas-v3.css"', 'href="./concept-d.css"', 'href="./career.css"', 'src="./career.js"', 'src="./outreach.js"', 'src="./tracker.js"', 'src="./dossier.js"', 'href="./dossier.css"', 'href="./outreach.css"', 'href="./tracker.css"', 'src="./career-grid.js"', 'src="./career-visuals.js"', 'src="./career-review.js"', 'src="./career-lesson-loop.js"', 'src="./career-nextup.js"', 'href="./career-lesson-loop.css"', 'src="./data-export.js"', 'src="./work-tools.js"', 'href="./work-tools.css"', 'src="./studio-recipes.js"', 'src="./studio-present.js"', 'href="./studio-tools.css"', 'src="./career-phase2.js"', 'href="./career-phase2.css"', 'src="./career-phase3.js"', 'href="./career-phase3.css"', 'src="./app.js"', 'src="./career-learning.js"', 'src="./career-teaching.js"', 'src="./career-analyst-lab.js"', 'src="./career-vc-analyst-lab.js"', 'src="./career-vc-waterfall.js"', 'src="./career-consulting-lab.js"', 'src="./career-director-review.js"', 'src="./career-workbook-check.js"', 'src="./career-worksample.js"', 'src="./career-pe-projection.js"', 'src="./career-pe-sensitivity.js"', 'src="./career-portfolio.js"', 'src="./career-kits.js"', 'href="./career-learning.css"')
    if not all(reference in html for reference in required):
        print("SELF build failed: index.html asset references changed.", file=sys.stderr)
        return 1

    print("SELF Workers static assets build succeeded. Wrangler deploy reads ./dist from wrangler.jsonc")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

