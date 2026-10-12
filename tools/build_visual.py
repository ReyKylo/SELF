#!/usr/bin/env python3
"""Compatibility entry point for the canonical combined SELF builder.

The canonical builder applies approved B exactly once after all feature checks.
"""
from pathlib import Path
import subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT/'tools/build_cloudflare.py')], cwd=ROOT, check=True)
