#!/usr/bin/env python3
"""Build the isolated visual candidate without editing the shared build pipeline.

Future integration: invoke this wrapper only after both workstreams review it.
The base builder remains authoritative for scripts, routes and investment checks.
"""
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT/'tools/build_cloudflare.py')], cwd=ROOT, check=True)
target = ROOT/'dist/index.html'
html = target.read_text(encoding='utf-8')
if html.count('</head>') != 1:
    raise SystemExit('FAIL: expected one document head; refusing visual injection')
css = (ROOT/'tools/cobalt_precision_v6.css').read_text(encoding='utf-8')
html = html.replace('</head>', '<style id="self-cobalt-precision-v6">\n'+css+'\n</style>\n</head>', 1)
html = html.replace('<strong>Rey Workspace</strong>', '<strong>SELF</strong>', 1)
target.write_text(html, encoding='utf-8')
print(f'Visual candidate ready: {target} ({target.stat().st_size:,} bytes)')
