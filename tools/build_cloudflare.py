#!/usr/bin/env python3
"""Build the existing Rey app, then apply an isolated Career dashboard visual layer.

The underlying 4.5 MB application source and storage logic are unchanged.
Only dist/ is deployed. All source integrity and JS syntax checks must pass.
"""
from pathlib import Path
import subprocess
import shutil
import sys
import re

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / "tools" / "assemble.py")], cwd=ROOT, check=True)
subprocess.run([sys.executable, str(ROOT / "tools" / "verify_static.py")], cwd=ROOT, check=True)

html = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
css = (ROOT / "tools" / "career_reference_v3.css").read_text(encoding="utf-8")
js = (ROOT / "tools" / "career_reference_v3.js").read_text(encoding="utf-8")

route = "career:careerStudio,more:moreHub,"
render_anchor = "function render(){document.body.dataset.page=page;"
assert html.count(route) == 1, "Expected exact existing Career route; refusing unsafe patch"
assert html.count(render_anchor) == 1, "Expected exact render anchor; refusing unsafe patch"
assert html.count("</head>") == 1, "Expected one HTML head closing tag"
assert "careerStudioReference" not in html, "Career reference extension already included"

html = html.replace(route, "career:careerStudioReference,more:moreHub,", 1)
html = html.replace(render_anchor, js + "\n" + render_anchor, 1)
html = html.replace("</head>", '<style id="rey-career-reference-v3">\n' + css + '\n</style>\n</head>', 1)

# Supabase V1 is additive to the verified Career V3 build. Hook only successful
# IndexedDB saves; never alter the original checksummed source segments.
cloud_runtime = (ROOT / "tools" / "self_cloud_runtime.js").read_text(encoding="utf-8")
save_anchor = "return workspaceStorage.save(snapshot).then(()=>{storageOK=true;"
assert html.count(save_anchor) == 1, "Expected exact successful local-save anchor"
assert "function selfCloudDidPersist()" not in html, "Cloud extension already inserted"
html = html.replace(save_anchor,
                    "return workspaceStorage.save(snapshot).then(()=>{selfCloudDidPersist();storageOK=true;", 1)
module_match = re.search(r'<script\s+type="module">(.*?)</script>', html, re.S)
assert module_match is not None, "SELF module missing"
html = html[:module_match.end(1)] + "\n" + cloud_runtime + "\n" + html[module_match.end(1):]


# Verify the generated deployable JS, not just the existing source.
match = re.search(r'<script\s+type="module">(.*?)</script>', html, re.S)
if not match:
    raise SystemExit("FAIL: Rey JavaScript module was not found after Career patch")
checker = ROOT / "tools" / "_qa_career_deploy.mjs"
try:
    checker.write_text(match.group(1), encoding="utf-8")
    subprocess.run(["node", "--check", str(checker)], cwd=ROOT, check=True)
finally:
    checker.unlink(missing_ok=True)

output = ROOT / "dist"
output.mkdir(parents=True, exist_ok=True)
(output / "index.html").write_text(html, encoding="utf-8")
shutil.copy2(ROOT / "assets" / "career-landscape.svg", output / "career-landscape.svg")
print(f"PASS: Career Reference V3 built with original Rey data and routes preserved")
print(f"PASS: compiled JavaScript syntax")
print("PASS: SELF cloud delta-sync included after local-save integration")
print(f"Cloudflare static build ready: {output / 'index.html'} ({(output / 'index.html').stat().st_size:,} bytes)")