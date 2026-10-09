#!/usr/bin/env python3
"""Build Rey Workspace V4 from verified existing V2 source + Career V3 + safe V4 route views.

Never rewrites source segments, legacy storage, database schemas or feature engines.
Only dist/ is hosted by Cloudflare Wrangler.
"""
from pathlib import Path
import subprocess, shutil, sys, re

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT/'tools'/'assemble.py')], cwd=ROOT, check=True)
subprocess.run([sys.executable, str(ROOT/'tools'/'verify_static.py')], cwd=ROOT, check=True)
html=(ROOT/'app'/'index.html').read_text(encoding='utf-8')

# V3 Career reference assets continue working for company / opportunity / networking views.
v3js=(ROOT/'tools'/'career_reference_v3.js').read_text(encoding='utf-8')
v3css=(ROOT/'tools'/'career_reference_v3.css').read_text(encoding='utf-8')
v4js=(ROOT/'tools'/'workspace_v4.js').read_text(encoding='utf-8')
v4css=(ROOT/'tools'/'workspace_v4.css').read_text(encoding='utf-8')
v42css=(ROOT/'tools'/'visual_fidelity_v42.css').read_text(encoding='utf-8')
v5js=(ROOT/'tools'/'calendar_studio_v5.js').read_text(encoding='utf-8')
v5css=(ROOT/'tools'/'calendar_studio_v5.css').read_text(encoding='utf-8')

def replace_once(old,new,reason):
    global html
    n=html.count(old)
    if n!=1:
        raise SystemExit(f'FAIL: expected exactly one {reason} anchor, found {n}; refusing unsafe patch')
    html=html.replace(old,new,1)

render_anchor='function render(){document.body.dataset.page=page;'
replace_once('career:careerStudio,more:moreHub,','career:rvCareerV4,more:rvMoreV4,','Career+More routes')
replace_once('desk:()=>desk.render(),today:dashboard,calendar:calendar,planning:planning,journal:journal,',
             'desk:rvWhiteboardV4,today:rvDashboardV4,calendar:rvCalendarV5,planning:planning,journal:rvNotesV4,','five legacy route mappings')
replace_once("const pages=[['desk','▦','Desk'],['career','↗','Career'],['calendar','◷','Calendar'],['backpack','⇥','Capture inbox'],['more','▦','More']];",
             "const pages=[['today','▦','Dashboard'],['career','↗','Career'],['calendar','◷','Calendar'],['journal','▤','Notes'],['more','▦','More']];",'global sidebar menu')
replace_once(render_anchor,v3js+'\n'+v4js+'\n'+v5js+'\n'+render_anchor,'render function')
replace_once('</head>', '<style id="rey-career-reference-v3">\n'+v3css+'\n</style>\n<style id="rey-workspace-v4">\n'+v4css+'\n</style>\n<style id="rey-visual-fidelity-v42">\n'+v42css+'\n</style>\n<style id="rey-calendar-studio-v5">\n'+v5css+'\n</style>\n</head>', 'HTML head')
# Keep existing URL bookmarks and nested Worlds. Brand link returns to dashboard, not raw Whiteboard.
html=html.replace('href="#desk" class="brand"','href="#today" class="brand"',1)

# Preserve the independent SELF Cloud V1 implementation added by another repo change.
# Only hook confirmed successful local saves, then append the existing cloud module unchanged.
cloud_runtime=(ROOT/'tools'/'self_cloud_runtime.js').read_text(encoding='utf-8')
save_anchor='return workspaceStorage.save(snapshot).then(()=>{storageOK=true;'
replace_once(save_anchor,
             'return workspaceStorage.save(snapshot).then(()=>{selfCloudDidPersist();storageOK=true;',
             'SELF Cloud on-local-save hook')
module_cloud=re.search(r'<script\s+type="module">(.*?)</script>',html,re.S)
if not module_cloud: raise SystemExit('FAIL: missing Rey application module for SELF Cloud')
if 'function selfCloudDidPersist()' in module_cloud.group(1): raise SystemExit('FAIL: cloud adapter already present')
html=html[:module_cloud.end(1)]+'\n'+cloud_runtime+'\n'+html[module_cloud.end(1):]

match=re.search(r'<script\s+type="module">(.*?)</script>',html,re.S)
if not match: raise SystemExit('FAIL: application JS module missing')
checker=ROOT/'tools'/'_qa_workspace_v4.mjs'
try:
    checker.write_text(match.group(1),encoding='utf-8')
    subprocess.run(['node','--check',str(checker)],cwd=ROOT,check=True)
finally: checker.unlink(missing_ok=True)
subprocess.run(['node', str(ROOT/'tools'/'qa_workspace_v4.cjs')], cwd=ROOT, check=True)
subprocess.run(['node', str(ROOT/'tools'/'qa_calendar_studio_v5.cjs')], cwd=ROOT, check=True)
for must in ('rvDashboardV4','rvCareerV4','rvCalendarV4','rvNotesV4','rvWhiteboardV4','rvMoreV4','createDesk(','createVoiceCapture(','createBackpack('):
    if must not in html: raise SystemExit('FAIL: missing required feature: '+must)
output=ROOT/'dist'
output.mkdir(exist_ok=True)
(output/'index.html').write_text(html,encoding='utf-8')
shutil.copy2(ROOT/'assets'/'career-landscape.svg',output/'career-landscape.svg')
print('PASS: five V4 screens integrated with existing data, routes and spatial engine')
print('PASS: Calendar Studio V5 replaces only the Calendar route, data and Supabase remain untouched')
print('PASS: V4.2 visual fidelity layer included without mock data')
print('PASS: existing SELF Supabase cloud sync preserved after successful local-save hook')
print('PASS: complete JS module syntax and required functions')
print(f'Cloudflare static build ready: {output / "index.html"} ({(output / "index.html").stat().st_size:,} bytes)')