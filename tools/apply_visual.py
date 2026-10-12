#!/usr/bin/env python3
"""Apply approved SELF B once to the canonical combined output.

No engine, calculation, storage, registry or cloud implementation changes.
The exact head/body boundary excludes printable memo template-string markup.
"""
from pathlib import Path
import subprocess, sys, re

ROOT = Path(__file__).resolve().parents[1]
target = ROOT/'dist/index.html'
html = target.read_text(encoding='utf-8')
boundary = '\n</head><body'
if html.count(boundary) != 1:
    raise SystemExit('FAIL: expected one outer-document boundary; refusing visual injection')
if 'id="self-cobalt-precision-v6"' in html:
    raise SystemExit('FAIL: visual layer already applied; refusing double injection')
css = (ROOT/'tools/cobalt_precision_v6.css').read_text(encoding='utf-8')
html = html.replace(boundary, '<style id="self-cobalt-precision-v6">\n'+css+'\n</style>'+boundary, 1)
if html.count('id="self-cobalt-precision-v6"') != 1:
    raise SystemExit('FAIL: visual style count differs from one')
html = html.replace('<strong>Rey Workspace</strong>', '<strong>SELF</strong>', 1)
# Baseline compatibility: body[data-page] marks the route, not an actionable control.
# Without this guard, ordinary input/button clicks bubble to body and re-render
# before native change/submit; no other delegated listener is intercepted.
delegate = "const el=e.target.closest('[data-action],[data-page],.close');if(!el)return;"
if html.count(delegate) != 1:
    raise SystemExit('FAIL: expected one native click delegate; refusing unsafe guard')
html = html.replace(delegate, delegate.replace('if(!el)return;', 'if(!el||el===document.body)return;'), 1)
module = re.search(r'<script\s+type="module">(.*?)</script>', html, re.S)
if not module:
    raise SystemExit('FAIL: missing final application module')
checker = ROOT/'tools/_qa_visual_final.mjs'
try:
    checker.write_text(module.group(1), encoding='utf-8')
    subprocess.run(['node', '--check', str(checker)], cwd=ROOT, check=True)
finally:
    checker.unlink(missing_ok=True)
target.write_text(html, encoding='utf-8')
print(f'Visual candidate ready: {target} ({target.stat().st_size:,} bytes)')
