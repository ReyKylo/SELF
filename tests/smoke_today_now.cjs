/* Pure checks for Today's Next up and Schedule (today.js): which item wins, labels, ordering, and what is left out. */
const assert=require('node:assert/strict');
const T=require('../today.js');
const day='2026-10-28';
const at=(h,m)=>new Date(2026,9,28,h,m).toISOString();

/* scheduleFor: timed events and today's scheduled interviews, sorted; all-day, done, other days and unscheduled are left out */
const sched=T.scheduleFor({day,
 events:[{id:'e2',title:'Coffee chat',start:780,end:810},{id:'e1',title:'Focus',start:570,end:660},{id:'x',title:'Holiday',allDay:true,start:0,end:1440},{id:'d',title:'Done one',start:600,end:630,done:true}],
 interviews:[{id:'i1',title:'Danantara',stage:'scheduled',scheduled_at:at(10,0),application_id:'a1'},{id:'i2',title:'Tomorrow',stage:'scheduled',scheduled_at:new Date(2026,9,29,9,0).toISOString()},{id:'i3',title:'Draft',stage:'planned',scheduled_at:at(11,0)}],
 companyOf:i=>i.application_id==='a1'?'Danantara':''});
assert.deepEqual(sched.map(s=>s.key),['event:e1','interview:i1','event:e2']);
assert.equal(sched[1].sub,'Interview · Danantara');
assert.equal(sched[1].end,660,'an interview without a length gets one hour');

/* nextUp */
const three=[{id:'t1',title:'Finish DCF',due_date:'2026-10-26',priority:'high'},{id:'t2',title:'Other'}];
let n=T.nextUp({schedule:sched,three,now:600,day});
assert.equal(n.mode,'now');assert.equal(n.item.key,'event:e1');assert.equal(n.label,'Now · until 11:00');
n=T.nextUp({schedule:sched,three,now:670,day});
assert.equal(n.mode,'focus','more than an hour free: the first of the three');assert.equal(n.task.id,'t1');
assert.equal(n.label,'Free until 13:00');assert.equal(n.reason,'Overdue by 2 days');
n=T.nextUp({schedule:sched,three,now:750,day});
assert.equal(n.mode,'soon');assert.equal(n.label,'In 30 min · 13:00');
n=T.nextUp({schedule:sched,three:[],now:670,day});
assert.equal(n.mode,'later');assert.equal(n.label,'Next at 13:00');
n=T.nextUp({schedule:[],three:[{id:'t',title:'x',due_date:day}],now:900,day});
assert.equal(n.label,'Start with this');assert.equal(n.reason,'Due today');
assert.equal(T.nextUp({schedule:[],three:[],now:900,day}),null,'nothing to show: no invented item');
assert.equal(T.nextUp({schedule:sched,three:[],now:900,day}),null,'after the last event with no tasks');
console.log('smoke_today_now: ok');
