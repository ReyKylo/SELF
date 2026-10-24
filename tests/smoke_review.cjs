/* Review queue: new cards come back tomorrow, idempotent adds, spaced gaps 1/3/7/16/35, again/hard/good/easy, due ordering, validation. */
const assert=require('node:assert/strict');
const R=require('../career-review.js');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const cards=[{id:'a',front:'F1',back:'B1'},{id:'b',front:'F2',back:'B2'},{id:'c',front:'F3',back:'B3'}];
let deck=R.addCards([],cards,'2026-10-24');
eq(deck.map(c=>c.due),['2026-10-25','2026-10-25','2026-10-25'],'new cards come back tomorrow');
eq(R.addCards(deck,cards,'2026-11-30').length,3,'adding again changes nothing, even much later');
eq(R.addCards(deck,cards,'2026-11-30')[0].due,'2026-10-25','existing schedule is untouched');
eq(R.addCards([],[{id:'x',front:'',back:'b'},{id:'',front:'f',back:'b'},null,{id:'y',front:'f',back:'b'}],'2026-10-24').map(c=>c.id),['y'],'invalid cards are skipped');
eq(R.dueCards(deck,'2026-10-24'),[],'nothing due on the day it was added');
eq(R.dueCards(deck,'2026-10-25').map(c=>c.id),['a','b','c']);
eq(R.dueCards(deck,'2026-10-25',2).map(c=>c.id),['a','b'],'session limit');
/* the ladder of gaps */
let d=deck,day='2026-10-25';const gaps=[];
for(let i=0;i<6;i++){d=R.grade(d,'a','good',day);const c=d.find(x=>x.id==='a');gaps.push(R.INTERVALS.indexOf(0)<0?(new Date(c.due)-new Date(day))/864e5:0);day=c.due}
eq(gaps,[3,7,16,35,35,35],'good walks 3, 7, 16, 35 and then stays at 35');
d=R.grade(deck,'b','again','2026-10-25');eq(d.find(x=>x.id==='b').stage,0);eq(d.find(x=>x.id==='b').due,'2026-10-26');eq(d.find(x=>x.id==='b').lapses,1);
let e=R.grade(R.grade(deck,'c','good','2026-10-25'),'c','good','2026-10-28');eq(e.find(x=>x.id==='c').stage,2);eq(e.find(x=>x.id==='c').due,'2026-11-04');
e=R.grade(e,'c','hard','2026-11-04');eq(e.find(x=>x.id==='c').stage,2,'hard keeps the stage');eq(e.find(x=>x.id==='c').due,'2026-11-08','hard repeats half the gap (7 → 4 days)');
e=R.grade(deck,'a','easy','2026-10-25');eq(e.find(x=>x.id==='a').stage,2,'easy skips a stage');eq(e.find(x=>x.id==='a').due,'2026-11-01');
ok(R.grade(deck,'zzz','good','2026-10-25').every((c,i)=>c===deck[i]),'unknown id changes nothing');
eq(deck.map(c=>c.stage),[0,0,0],'grade does not mutate the input deck');
eq(R.stats(R.grade(deck,'a','easy','2026-10-25'),'2026-10-25'),{total:3,due:2,settled:0});
let s=deck;for(let i=0;i<3;i++)s=R.grade(s,'a','easy','2026-10-25');eq(R.stats(s,'2026-10-25').settled,1,'last stage counts as settled');
eq(R.addDays('2026-12-31',1),'2027-01-01','year rollover');eq(R.addDays('2028-02-28',1),'2028-02-29','leap day');
ok(R.valid(deck[0]));ok(!R.valid({...deck[0],stage:9}));ok(!R.valid({...deck[0],due:'tomorrow'}));ok(!R.valid(null));
console.log('PASS Review queue: '+n+' checks (idempotent adds, spaced gaps, grading, ordering, validation).');
