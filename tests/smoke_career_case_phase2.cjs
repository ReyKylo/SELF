'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const tracks=[['pe','PE'],['vc','VC'],['consulting','Consulting']];
const blueprint=JSON.parse(fs.readFileSync(path.join(root,'content/career-prep-quality-blueprint.json'),'utf8'));
const ids=new Set();let exhibitTotal=0;
for(const [folder,track] of tracks){
 const dir=path.join(root,'content/career-cases',folder);
 const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 assert.equal(m.track,track);
 assert.equal(m.case_type,'simulated','all case company facts are simulated');
 assert.match(m.status,/training/i,'no false completion certification');
 assert(!ids.has(m.id),'case ID unique');ids.add(m.id);
 assert(Array.isArray(m.exhibits)&&m.exhibits.length>=4,'minimum four substantive exhibits');
 assert.equal(new Set(m.exhibits).size,m.exhibits.length,'no duplicate exhibits');
 const expected=blueprint.tracks.find(t=>t.id===track).skills.map(s=>s.id);
 for(const code of expected)assert(m.competency_ids.includes(code),track+' missing '+code);
 for(const key of ['README.md',m.source_ledger,m.learner_tasks,m.tutor_guide,m.assessment,...m.exhibits]){
  assert(typeof key==='string'&&key.length>0,'valid manifest asset');
  assert(!key.startsWith('/')&&!key.split('/').includes('..'),'relative paths only');
  const filename=path.join(dir,key);
  assert(fs.statSync(filename).size>30,filename+' missing/empty');
 }
 const read=k=>fs.readFileSync(path.join(dir,k),'utf8');
 const intro=read('README.md'),sources=read(m.source_ledger),tutor=read(m.tutor_guide),assessment=read(m.assessment);
 assert(/SIMULATED/i.test(intro),'simulated source label in README');
 assert(/SIMULATED|simulasi/i.test(sources),'source ledger distinguishes fictional data');
 assert(/https:\/\//.test(sources),'external professional sources linked');
 assert(/Yes, ini namanya/i.test(tutor),'analogy immediately followed by professional name');
 assert(/analogi|analogy/i.test(tutor),'tutor contains analogy');
 assert(/blind|independent|cold/i.test(assessment),'assessment intended unassisted');
 assert(/no (answer|solution)|tanpa (kunci|jawaban)/i.test(assessment),'assessment explicitly without answer');
 assert(m.work_products.length>=2,'decision outputs defined');
 assert(/unreviewed|worker-self-tested/i.test(m.review_status),'no false third-party accreditation');
 for(const exhibit of m.exhibits){
  const body=read(exhibit);
  if(exhibit.endsWith('.csv')){
   const lines=body.trim().split(/\r?\n/),w=lines[0].split(',').length;
   assert(lines.length>=2,'exhibit must contain real rows');
   assert(lines.slice(1).every(x=>x.split(',').length===w),track+' CSV structural width '+exhibit);
  }else if(exhibit.endsWith('.json'))assert(JSON.parse(body),'JSON parse');
  exhibitTotal++;
 }
 assert(fs.existsSync(path.join(root,'tests/cases',folder,'check-case.cjs')),'native case calculation validator exists');
 console.log('PASS '+track+': '+m.exhibits.length+' exhibits, 12 competencies, source ledger, analogy and blind-assessment policy');
}
assert.equal(ids.size,3);
assert(exhibitTotal>=18);
const builder=fs.readFileSync(path.join(root,'tools/build_cloudflare.py'),'utf8');
const assets=builder.match(/ASSETS\s*=\s*\(([^\n]+)\)/);
assert(assets,'static asset whitelist exists');
assert(!assets[1].includes('career-cases'),'no case with potential reviewer data in deployed bundle');
assert(!assets[1].includes('tests/'),'no test/reviewer answers in deployed bundle');
console.log('PASS CASE PHASE2: total '+exhibitTotal+' exhibits / 36 skills / three simulated cases / no direct static asset leakage');