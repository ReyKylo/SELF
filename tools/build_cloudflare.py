#!/usr/bin/env python3
"""Build the SELF static frontend for Cloudflare Workers Static Assets (no dependencies)."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"
ASSETS = ("index.html", "styles.css", "app.js", "boards.css", "boards.js", "canvas-v3.css", "canvas-v3.js", "concept-d.css", "career.js", "career.css", "career-phase2.js", "career-phase2.css", "career-phase3.js", "career-phase3.css", "career-learning.js", "career-teaching.js", "career-analyst-lab.js", "career-pe-projection.js", "career-portfolio.js", "career-kits.js", "career-learning.css", "content/career-learning.json", "content/career-teaching.json", "content/portfolio-sprint.md", "content/career-kits/PE_LBO_Starter.xlsx.b64", "content/career-kits/VC_Investment_Starter.xlsx.b64", "content/career-kits/Consulting_Profitability_Starter.xlsx.b64")


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
    required = ('href="./styles.css"', 'href="./boards.css"', 'src="./canvas-v3.js"', 'href="./canvas-v3.css"', 'href="./concept-d.css"', 'href="./career.css"', 'src="./career.js"', 'src="./career-phase2.js"', 'href="./career-phase2.css"', 'src="./career-phase3.js"', 'href="./career-phase3.css"', 'src="./app.js"', 'src="./career-learning.js"', 'src="./career-teaching.js"', 'src="./career-analyst-lab.js"', 'src="./career-pe-projection.js"', 'src="./career-portfolio.js"', 'src="./career-kits.js"', 'href="./career-learning.css"')
    if not all(reference in html for reference in required):
        print("SELF build failed: index.html asset references changed.", file=sys.stderr)
        return 1

    print("SELF Workers static assets build succeeded. Wrangler deploy reads ./dist from wrangler.jsonc")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

