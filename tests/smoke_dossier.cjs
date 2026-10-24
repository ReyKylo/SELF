/* Dossier and Game Day: pure merge, track, phase and reflection rules. */
const assert=require('node:assert/strict');
const D=require('../dossier.js');
let n=0;const t=(name,fn)=>{fn();n++};
const NOW=Date.parse('2026-10-24T05:00:00Z'),day=864e5;
const iso=o=>new Date(NOW+o).toISOString();
const company={id:'c1',name:'Northstar Capital'};
const data={company,
 applications:[{id:'a1',company_id:'c1',role_title:'PE Analyst',hiring_stage:'interviewing',applied_at:iso(-20*day)},{id:'a2',company_id:'c2',role_title:'Other',hiring_stage:'applied'}],
 people:[{id:'p1',company_id:'c1',full_name:'Raka'},{id:'p2',company_id:'c1',full_name:'Sari'},{id:'p3',company_id:'c2',full_name:'Out'}],
 touchpoints:[{id:'t1',person_id:'p1',contact_at:iso(-10*day),channel:'message',summary:'Hi'},{id:'t2',person_id:'p1',contact_at:iso(-3*day),channel:'call',summary:'Intro'},{id:'t3',person_id:'p3',contact_at:iso(-1*day)}],
 interviews:[{id:'i1',application_id:'a1',title:'First round',scheduled_at:iso(2*day)},{id:'i2',application_id:'a2',title:'Not here',scheduled_at:iso(day)}],
 radar:[{id:'r1',company_name:'  northstar   capital ',role_title:'Associate',posted_at:iso(-5*day),status:'saved'},{id:'r2',company_name:'Other',role_title:'x',posted_at:iso(-1*day)}],
 boards:[{id:'b1',title:'Northstar Capital map'},{id:'b2',title:'Unrelated'}]};
t('dossier merges only this company',()=>{
 const d=D.build(data,NOW);
 assert.equal(d.applications.length,1);assert.equal(d.people.length,2);assert.equal(d.interviews.length,1);assert.equal(d.radar.length,1);assert.equal(d.work.length,1);
 assert.equal(d.timeline.length,2+1+1+1,'2 touches, 1 application, 1 interview, 1 radar');
});
t('last touch is real or null',()=>{
 const d=D.build(data,NOW),raka=d.people.find(r=>r.person.id==='p1'),sari=d.people.find(r=>r.person.id==='p2');
 assert.equal(raka.days,3,'latest touch wins');assert.equal(sari.days,null);assert.equal(sari.last,null);
});
t('timeline is newest first and every row opens a source',()=>{
 const d=D.build(data,NOW);
 for(let i=1;i<d.timeline.length;i++)assert.ok(d.timeline[i-1].at>=d.timeline[i].at);
 assert.ok(d.timeline.every(e=>e.open&&e.open.id&&e.open.kind));
 assert.equal(d.timeline[0].kind,'interview','upcoming interview first');
});
t('empty company gives empty sections, not errors',()=>{
 const d=D.build({company:{id:'z',name:'Z'}},NOW);
 assert.deepEqual([d.applications.length,d.people.length,d.interviews.length,d.radar.length,d.work.length,d.timeline.length],[0,0,0,0,0,0]);
 assert.equal(D.build({},NOW),null);
});
t('track from notes wins, then role',()=>{
 assert.equal(D.trackOf({prep_notes:'x\nTrack: VC\ny'},{role_title:'PE Analyst'}),'VC');
 assert.equal(D.trackOf({},{role_title:'Venture Associate'}),'VC');
 assert.equal(D.trackOf({},{role_title:'Strategy Consultant'}),'CONSULTING');
 assert.equal(D.trackOf({},{role_title:'Private Equity Analyst'}),'PE');
 assert.equal(D.trackOf({},{role_title:'Analyst'}),null);
 assert.equal(D.trackOf(null,null),null);
});
t('withTrack replaces or prepends',()=>{
 assert.equal(D.withTrack('','PE'),'Track: PE');
 assert.equal(D.withTrack('notes','CONSULTING'),'Track: Consulting\nnotes');
 assert.equal(D.withTrack('a\nTrack: PE\nb','VC'),'a\nTrack: VC\nb');
 assert.equal(D.trackOf({prep_notes:D.withTrack('x','CONSULTING')},null),'CONSULTING');
});
t('phase from fixture times',()=>{
 const at=NOW;
 assert.equal(D.phaseOf({scheduled_at:iso(1)},NOW),'before');
 assert.equal(D.phaseOf({scheduled_at:iso(0)},NOW),'during');
 assert.equal(D.phaseOf({scheduled_at:iso(-3600e3)},NOW),'during');
 assert.equal(D.phaseOf({scheduled_at:iso(-3*3600e3)},NOW),'after');
 assert.equal(D.phaseOf({},NOW),'before','no date means before');
 assert.ok(at);
});
t('reflection reminder rules',()=>{
 const i=o=>({id:'i',scheduled_at:iso(o),reflection:''});
 assert.equal(D.reflectDue(i(-23*3600e3),NOW),false,'not yet 24h');
 assert.equal(D.reflectDue(i(-25*3600e3),NOW),true);
 assert.equal(D.reflectDue(i(-15*day),NOW),false,'stale');
 assert.equal(D.reflectDue({...i(-2*day),reflection:'  '},NOW),true,'blank counts as empty');
 assert.equal(D.reflectDue({...i(-2*day),reflection:'done'},NOW),false);
 assert.equal(D.reflectDue(i(-2*day),NOW,['i']),false,'dismissed');
 assert.equal(D.reflectDue({id:'i'},NOW),false);
});
t('questions come from the real panel file',()=>{
 const panels=require('../content/career-director-review/review-panels.json');
 for(const [id] of D.TRACKS){const q=D.questionsFor(panels,id);assert.ok(q,id);assert.equal(q.challenges.length,5);assert.ok(q.challenges.every(c=>c.prompt.length>20))}
 assert.equal(D.questionsFor(panels,'XX'),null);assert.equal(D.questionsFor(null,'PE'),null);
});
t('clock format',()=>{assert.equal(D.fmtClock(0),'00:00');assert.equal(D.fmtClock(65.9),'01:05');assert.equal(D.fmtClock(3600),'60:00')});
const T=require('../today.js');
t('Today shows Reflect only when due',()=>{
 const career={applications:[],companies:[],people:[],touchpoints:[],interviews:[{id:'i1',title:'First round',stage:'done',scheduled_at:iso(-2*day),reflection:''}],dismissed:[]};
 const a=T.buildAgenda({tasks:[],day:'2026-10-24',now:NOW,career});
 assert.ok(a.items.some(x=>x.key==='reflect:i1'&&x.title==='Reflect on First round'));
 career.dismissed=['i1'];
 assert.ok(!T.buildAgenda({tasks:[],day:'2026-10-24',now:NOW,career}).items.some(x=>x.kind==='reflect'));
});
console.log('smoke_dossier: '+n+' groups ok');
