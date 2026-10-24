/* Next up: continue before start, preferred track first, then the other tracks in order, nothing invented when all done. */
const assert=require('node:assert/strict');
const N=require('../career-nextup.js');
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const lessons=[{id:'P1',track:'PE',title:'Laba naik',minutes:30},{id:'P2',track:'PE',title:'Sources',minutes:30},{id:'V1',track:'VC',title:'Live ARR',minutes:25},{id:'V2',track:'VC',title:'NRR',minutes:30},{id:'C1',track:'Consulting',title:'Bridge',minutes:30}];
const pick=(prog,pref)=>N.pickNext(lessons,prog,pref);
eq(pick({}).lesson.id,'P1','a new learner starts with the first PE lesson');eq(pick({}).status,'start');eq(pick({}).reason,'Mulai dari sini di jalur PE.');
eq(pick({},'VC').lesson.id,'V1','the track you last worked in goes first');
eq(pick({P1:{completed:true}}).lesson.id,'P2');eq(pick({P1:{completed:true}}).reason,'Berikutnya di jalur PE setelah Laba naik.');
{const r=pick({P1:{beat:5}});eq([r.lesson.id,r.status,r.reason],['P1','continue','Kamu berhenti di langkah 6 (Giliran lu).'])}
eq(pick({P1:{completed:true},P2:{beat:2},V1:{beat:3}}).lesson.id,'P2','continue wins within the preferred track');
eq(pick({P1:{completed:true},V1:{beat:3}},'PE').lesson.id,'V1','an unfinished lesson elsewhere is continued before a new one starts');
eq(pick({P1:{rungs:[{ok:true}]}}).status,'continue','a solved rung counts as started');eq(pick({P1:{predicted:true}}).status,'continue','so does a prediction');
eq(pick({P1:{completed:true,beat:7}}).lesson.id,'P2','a completed lesson is never continued');
eq(pick({P1:{completed:true},P2:{completed:true}}).lesson.id,'V1','track exhausted: move to the next track');
eq(pick(Object.fromEntries(lessons.map(l=>[l.id,{completed:true}])),'PE'),{lesson:null,status:'done',reason:'Semua lesson di format baru sudah ditandai selesai di perangkat ini. Lanjut ke Director Review atau Work Sample.',position:0,of:0});
eq(pick({},'Nope').lesson.id,'P1','an unknown preferred track is ignored');
eq(N.started(null),false);eq(N.started({completed:true,beat:3}),false);eq(N.started({beat:1}),true);
console.log('PASS Next up: '+n+' checks (continue, start, preferred track, track order, done).');
