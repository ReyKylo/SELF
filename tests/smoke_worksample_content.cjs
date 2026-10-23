/* Phase 6 content gate: served work samples are the reviewed blind briefs, nothing sealed leaks, wiring and honesty hold. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const rd=f=>fs.readFileSync(path.join(root,f));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);

const index=JSON.parse(rd('content/work-samples/index.json'));
assert.equal(index.samples.length,3);
assert.deepEqual(index.samples.map(s=>s.track),['PE','VC','Consulting']);
assert(/SIMULASI/.test(index.notice)&&/Tidak ada kunci jawaban/.test(index.notice)&&/review manusia/.test(index.notice),'notice states simulation, no key, human review');

// Every served file is a byte-identical copy of the reviewed, key-free source.
const SOURCE={
  './content/work-samples/pe/brief.md':'content/career-cases/pe/assessment.md',
  './content/work-samples/vc/brief.md':'content/career-cases/vc/blind/holdout-brief.md',
  './content/work-samples/vc/holdout-cohorts.csv':'content/career-cases/vc/blind/holdout-cohorts.csv',
  './content/work-samples/consulting/brief.md':'content/career-cases/consulting/assessment.md',
  ...Object.fromEntries([1,2,3,4,5,6].map(n=>['./content/work-samples/consulting/E0'+n+'.csv',fs.readdirSync(path.join(root,'content/career-cases/consulting/exhibits')).sort().map(f=>'content/career-cases/consulting/exhibits/'+f)[n-1]]))
};
for(const s of index.samples){
  assert(s.title&&s.company&&s.cutoff&&s.competencies&&Array.isArray(s.deliverables)&&s.deliverables.length>=5,s.track+' has title, company, cutoff, competencies and >=5 deliverables');
  for(const f of [s.brief,...s.data.map(d=>d.path)]){
    assert(SOURCE[f],'known source for '+f);
    assert.equal(sha(rd(f.slice(2))),sha(rd(SOURCE[f])),f+' is byte-identical to '+SOURCE[f]);
  }
  assert(s.data.every(d=>/^SELF_[A-Za-z0-9_]+\.csv$/.test(d.filename)),'safe download filenames');
  assert.equal(s.competencies.match(/[A-Z]{2}-\d\d/g).length,2,'competency range');
  assert(/^(PE|VC|Consulting)$/.test(s.starter),'starter workbook key');
}
assert.equal(index.samples[0].data.length,0);assert.equal(index.samples[1].data.length,1);assert.equal(index.samples[2].data.length,6);

// Nothing sealed or worked-out is served: no file name smells like a key and no sealed file's bytes appear.
const served=walk('content/work-samples');
for(const f of served){
  assert(/\.(md|csv|json)$/.test(f),'only md/csv/json are served: '+f);
  assert(!/key|solution|answer|tutor|rubric|example|worked|reviewer/i.test(path.basename(f)),'no key-like filename: '+f);
}
const sealed=[...walk('tests/cases'),
  ...['pe','vc','consulting'].flatMap(t=>fs.readdirSync(path.join(root,'content/career-cases/'+t)).filter(f=>/tutor|example|learner-tasks|review-rubric|partner-challenges|deck-storyline|memo-spec|case-brief/.test(f)).map(f=>'content/career-cases/'+t+'/'+f))];
const sealedHashes=new Set(sealed.map(f=>sha(rd(f))));
for(const f of served)assert(!sealedHashes.has(sha(rd(f))),f+' must not equal any sealed/worked file');
for(const f of served.filter(x=>/\.md$/.test(x)))assert(!/reviewer-key/i.test(rd(f).toString()),f+' does not reference the restricted reviewer key');
// Line-level guard against every sealed or worked-out text file, not only whole-file hashes.
const sealedText=sealed.filter(f=>/\.(md|csv|json)$/.test(f)&&f!=='tests/cases/vc/reviewer-key.md');
assert(sealed.includes('tests/cases/vc/reviewer-key.md')&&sealedText.length>8,'sealed corpus present to compare against');
const sealedLines=new Map();
for(const f of ['tests/cases/vc/reviewer-key.md',...sealedText])for(const l of rd(f).toString().split('\n').map(x=>x.trim()).filter(x=>x.length>40&&!/^[|\-:\s]+$/.test(x)))if(!sealedLines.has(l))sealedLines.set(l,f);
assert(sealedLines.size>30);
for(const f of served){
  const body=rd(f).toString();
  for(const [l,from] of sealedLines){
    if(!body.includes(l))continue;
    assert(false,f+' contains a line from sealed file '+from+': '+l.slice(0,80));
  }
}
assert(!fs.existsSync(path.join(root,'dist/content/career-cases')),'case packets stay unserved');

// Wiring: script, build, CI, host tab.
const html=rd('index.html').toString(),build=rd('tools/build_cloudflare.py').toString(),ci=rd('.github/workflows/self-quality.yml').toString(),host=rd('career-learning.js').toString();
for(const f of ['career-workbook-check.js','career-worksample.js']){
  assert(html.includes('src="./'+f+'"'),f+' loaded by index.html');
  assert(build.includes('"'+f+'"')&&build.includes("'src=\"./"+f+"\"'"),f+' in the Cloudflare asset list and required references');
  assert(ci.includes('node --check '+f),f+' syntax-checked in CI');
}
for(const f of served)assert(build.includes('"'+f+'"'),f+' is packaged by the Cloudflare build');
assert(/\['worksample','Work Sample'\]/.test(host)&&/SELFWorkSample\?\.action/.test(host)&&/SELFWorkSample\?\.change/.test(host)&&/SELFWorkSample\?\.reset/.test(host),'host routes tab, clicks, changes and account reset to the module');
assert(/openPortfolio/.test(host)&&/openDirector/.test(host)&&/focusTrack/.test(rd('career-director-review.js').toString()));

// Honesty in the shipped UI source.
const ui=rd('career-worksample.js').toString();
assert(/Tidak ada skor otomatis/.test(ui)&&/review manusia/.test(ui)&&/DETERMINISTIC_VERIFIED/.test(ui)&&/file tidak diupload/i.test(ui));
assert(!/\b(certified|expert[- ]approved|recruiter[- ]ready|lulus|passed)\b/i.test(ui),'no certification or pass claims');
assert(!/fetch\([^)]*method\s*:\s*['"](POST|PUT|PATCH)/.test(ui)&&!/\/rest\/v1|storage\/v1/.test(ui),'module performs no writes to the backend');

// Renderer safety and fidelity.
global.window={};require('../career-worksample.js');
const {markdown,csv}=global.window.SELFWorkSample;
const evil=markdown('<img src=x onerror=alert(1)> **ok** `a<b`\n\n| A | B |\n|---|---|\n| <script>x</script> | 2 |\n\n- <b>one</b>');
assert(!/<img|<script|<b>/.test(evil)&&/&lt;img/.test(evil)&&/&lt;script&gt;/.test(evil),'raw HTML is escaped');
assert(/<table>/.test(evil)&&/<strong>ok<\/strong>/.test(evil)&&/<code>a&lt;b<\/code>/.test(evil)&&/<li>/.test(evil));
assert.deepEqual(csv('a,b\n"x,1","he said ""hi"""\n'),[['a','b'],['x,1','he said "hi"']]);
for(const f of ['pe','vc','consulting']){
  const html2=markdown(rd('content/work-samples/'+f+'/brief.md').toString());
  assert(html2.length>1500&&/<h[2-5]>/.test(html2)&&!/\*\*|\|---/.test(html2),f+' brief renders without leftover markdown syntax');
}
console.log('PASS Work Sample content: 3 blind briefs byte-identical to reviewed sources, no sealed file or reviewer-key line served, wiring + honesty + safe rendering');
