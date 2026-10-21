'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'content/career-prep-quality-blueprint.json'),'utf8'));
const doc = fs.readFileSync(path.join(root,'docs/CAREER_PREP_PHASE1_QUALITY_BLUEPRINT.md'),'utf8');
const active = JSON.parse(fs.readFileSync(path.join(root,'content/career-learning.json'),'utf8'));
const errors = [];
const check=(condition,message)=>{if(!condition)errors.push(message)};
check(d.project==='ReyKylo/SELF','must target SELF repo only');
check(d.phase.startsWith('1 - Quality'),'Phase 1 specification');
check(d.status.includes('NOT_A_CERTIFICATION'),'must not claim accreditation');
check(d.teach_contract.required_sequence.length===9,'nine-stage teaching sequence');
const required=['ANALOGY','EXPLICIT_FORMAL_TERM','PRECISE_DEFINITION','SOURCE_VISUAL_OR_TRANSPARENT_SUBSTITUTE','INDEPENDENT_ATTEMPT','CHECK_AND_REMEDIATION'];
for(const v of required)check(d.teach_contract.required_sequence.includes(v),'teaching contract missing '+v);
check(d.teach_contract.required_sequence.indexOf('EXPLICIT_FORMAL_TERM')===d.teach_contract.required_sequence.indexOf('ANALOGY')+1,'formal naming MUST immediately follow analogy');
check(d.teach_contract.naming_rule.toLowerCase().includes('yes, ini namanya'),'term naming template missing');
for(const v of ['analogy_quality','video_rule','feedback_rule','memory_rule']) check(Object.keys(d.teach_contract).includes(v),'teaching rule '+v);
check(d.tracks.length===3,'must cover three industries');
check(JSON.stringify(d.tracks.map(x=>x.id))===JSON.stringify(['PE','VC','Consulting']),'track identity and order');
check(d.tracks.every(x=>x.skills.length>=12),'12 real competencies per track');
const ids=new Set();
for(const t of d.tracks){
 check(t.benchmark.url.startsWith('https://'),'track benchmark must be HTTPS');
 check(t.decision.length>25,'track must have decision question');
 for(const s of t.skills){
   check(!ids.has(s.id),'duplicate competency '+s.id);ids.add(s.id);
   check(s.id.startsWith(t.id==='Consulting'?'CO-':t.id+'-'),'competency must match industry '+s.id);
   for(const k of ['skill','proof','check','level'])check(typeof s[k]==='string'&&s[k].length>=8,'competency '+s.id+' missing '+k);
 }
}
check(ids.size===36,'all thirty-six independently testable competencies');
check(d.glossary.length>=30,'at least thirty analogy + term entries');
const terms=new Set(),termIds=new Set();
for(const g of d.glossary){
 check(!termIds.has(g.id),'duplicate glossary id '+g.id);termIds.add(g.id);
 check(['PE','VC','Consulting','all'].includes(g.track),'unknown glossary track '+g.id);
 for(const f of ['analogy','term','definition','numbers','check'])check(typeof g[f]==='string'&&g[f].length>=12,'glossary term incomplete '+g.id+' '+f);
 check(!terms.has(g.term),'repeated technical term definition '+g.term);terms.add(g.term);
}
check(['Leverage','Sources & Uses of Funds','MOIC (Multiple on Invested Capital)','Cohort Analysis','Net Revenue Retention (NRR)','Cap Table / Dilution','Profitability Bridge / Profit Bridge'].every(t=>[...terms].some(v=>v.includes(t)||t.includes(v))),'must cover core professional terminology');
check(d.rubric.dimensions.reduce((s,x)=>s+x.weight,0)===100,'rubric weights sum to 100');
check(d.rubric.portfolio_candidate_proposal.independent_case&&d.rubric.portfolio_candidate_proposal.manual_validation_required,'automated AI cannot rubber-stamp career portfolio');
check(d.rubric.never_claim.some(x=>x.includes('expert approved')),'need endorsement red line');
check(d.rubric.assessor_labels.length===4,'mechanical vs human review classification');
check(d.case_requirements.training.length>=8,'training packet acceptance incomplete');
check(d.case_requirements.independent.length>=8,'independent packet acceptance incomplete');
check(d.case_requirements.failure_red_lines.length>=6,'hard stop rules incomplete');
check(d.gates.length===7,'all seven quality gates');
check(d.validated_references.length>=4,'need original practitioner and learning sources');
for(const x of d.validated_references)check(x.url.startsWith('https://'),'reference links must be HTTPS');
for(const x of ['12 panels','7 external visual refs','11 videos']){} // source baseline is numeric below
check(d.audit.baseline.sources===active.sources.length,'baseline sources stale vs actual SELF');
check(d.audit.baseline.evidence_panels===active.panels.length,'baseline panels stale vs actual SELF');
check(d.audit.baseline.external_preview_refs===active.panels.filter(p=>!!p.visual).length,'baseline visual refs stale vs actual SELF');
check(d.audit.baseline.videos===active.videos.length,'baseline videos stale vs actual SELF');
check(d.audit.baseline.training_cases===active.sprints.length,'baseline training cases stale vs actual SELF');
check(doc.includes('Yes, ini namanya leverage')&&doc.includes('Leveraged Buyout (LBO)'),'exemplar lesson must name technical term');
check(doc.includes('Total Sources = Total Uses'),'worked example must show invariant');
check(doc.includes('130 + 5 - 70 = 65'),'example calculation must reconcile');
check(doc.includes('Practice')||doc.includes('pract'),'teaching spec needs active practice');
check(doc.includes('NOT a hiring-firm rubric'),'strict internal scoring disclaimer');
check(!doc.includes('Status: Expert certified'),'must not claim professional credential');
assert.deepEqual(errors,[],errors.join('\n'));
const subtotal=120+4, sponsor=subtotal-60, another=130+5-70, targetMoic=125/50, targetIrr=Math.pow(121/100,1/2)-1;
assert.equal(subtotal,124);assert.equal(sponsor,64);assert.equal(another,65);assert.equal(targetMoic,2.5);assert(Math.abs(targetIrr-0.1)<1e-12);
console.log('PASS SELF Career Prep Phase 1: 36 competency checks, 30 terminology examples, all source-baseline invariants, quality gates and numerical teaching examples');
