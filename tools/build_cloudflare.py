#!/usr/bin/env python3
"""Prepare a verified static-only Rey Workspace build for Cloudflare Workers assets.

Cloudflare Workers Builds:
  Build command:  python3 tools/build_cloudflare.py
  Deploy command: npx wrangler deploy

The deployed dist/ folder contains ONLY index.html. It does not expose the
lossless source segments, Python scripts, documents, or research templates.
"""
from pathlib import Path
import subprocess
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / "tools" / "assemble.py")], cwd=ROOT, check=True)
subprocess.run([sys.executable, str(ROOT / "tools" / "verify_static.py")], cwd=ROOT, check=True)
dist = ROOT / "dist"
dist.mkdir(exist_ok=True)
shutil.copy2(ROOT / "app" / "index.html", dist / "index.html")
print(f"Cloudflare static build ready: {dist / 'index.html'} ({(dist / 'index.html').stat().st_size:,} bytes)")
