"""Static smoke test for the candidate. No browser or deployment claims."""
from pathlib import Path
import subprocess,re,sys
root=Path(__file__).resolve().parents[1]
p=root/'app'/'index.html'
s=p.read_text()
checks={
 'source script preserved': len(s)>4_000_000 and 'openWorkspaceStorage' in s,
 'five global nav items':"const pages=[['desk','▦','Desk'],['career','↗','Career'],['calendar','◷','Calendar'],['backpack','⇥','Capture inbox'],['more','▦','More']]" in s,
 'career route': 'career:careerStudio,more:moreHub' in s,
 'more hub function': 'function moreHub()' in s,
 'safe worlds directory': 'worlds:worldMapProfessional' in s,
 'old data types preserved':"const TYPES=['companies','opportunities','contacts','tasks','goals','learning','resources','journals','templates','events','inbox','boards','ideas','links']" in s,
 'no default Biu companion append':"/* Biu companion hidden for professional mode; do not mutate existing data */" in s,
 'additive source/CSS': '<style id="rey-professional-styles">' in s,
 'CSV parser': 'function crCsvParse(text)' in s,
 'document link editor': 'function careerDocumentDialog()' in s,
}
js=re.search(r'<script\s+type="module">(.*?)</script>',s,re.S)
if js:
    js_path=root/'tools'/'_qa_extracted.js.mjs'
    js_path.write_text(js.group(1))
    res=subprocess.run(['node','--check',str(js_path)],capture_output=True,text=True)
    checks['JS syntax check']=res.returncode==0
    js_path.unlink(missing_ok=True)
else: checks['JS syntax check']=False
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print('Checked file:',p.name, 'bytes:',p.stat().st_size)
if not all(checks.values()):sys.exit(1)
