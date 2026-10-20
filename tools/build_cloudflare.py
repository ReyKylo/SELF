#!/usr/bin/env python3
"""Build the SELF static frontend for Cloudflare Pages (no dependencies)."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"
ASSETS = ("index.html", "styles.css", "app.js")


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
        shutil.copy2(ROOT / asset, OUTPUT / asset)
        print(f"  copied {asset} -> dist/{asset}")

    html = (OUTPUT / "index.html").read_text(encoding="utf-8")
    required = ('href="./styles.css"', 'src="./app.js"')
    if not all(reference in html for reference in required):
        print("SELF build failed: index.html asset references changed.", file=sys.stderr)
        return 1

    print("SELF Cloudflare Pages build succeeded. Set Build output directory to: dist")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
