const assert=require('assert');
const C=require('../calendar.js');
const T=(id,due,o={})=>({id,title:'Task '+id,due_date:due,status:'todo',priority:'normal',space_id:null,...o});

/* dates */
assert.equal(C.addDays('2026-10-31',1),'2026-11-01');assert.equal(C.addDays('2026-03-01',-1),'2026-02-28');
assert.equal(C.diffDays('2026-10-27','2026-11-03'),7);assert.equal(C.startOfWeek('2026-10-27'),'2026-10-26');assert.equal(C.startOfWeek('2026-11-01'),'2026-10-26');
assert.equal(C.addMonths('2026-12-15',1),'2027-01-01');
const g=C.monthGrid('2026-10-27');assert.equal(g.length,5);assert.equal(g[0][0],'2026-09-28');assert.equal(g[4][6],'2026-11-01');
assert.equal(C.monthGrid('2027-02-10').length,4);assert.ok(C.monthGrid('2026-08-10').length===6);
assert.ok(g.every(w=>w.length===7));assert.equal(C.isoWeek('2026-10-27'),44);
assert.ok(!C.isKey('2026-13-40')&&!C.isKey(null)&&C.isKey('2026-10-27'));

/* urgency, relative, summary, agenda */
const today='2026-10-27';
assert.equal(C.urgency(T(1,'2026-10-26'),today),'overdue');assert.equal(C.urgency(T(1,today),today),'today');
assert.equal(C.urgency(T(1,'2026-10-30'),today),'soon');assert.equal(C.urgency(T(1,'2026-11-05'),today),'later');
assert.equal(C.urgency(T(1,'2026-10-20',{status:'done'}),today),'done');assert.equal(C.urgency(T(1,null),today),'none');
assert.equal(C.relative(T(1,'2026-10-24'),today),'3d late');assert.equal(C.relative(T(1,'2026-10-28'),today),'Tomorrow');assert.equal(C.relative(T(1,null),today),'No deadline');
const all=[T(1,'2026-10-20'),T(2,today),T(3,'2026-10-28'),T(4,'2026-11-02'),T(5,'2026-12-01'),T(6,null),T(7,'2026-10-01',{status:'done'}),T(8,today,{priority:'high'})];
assert.deepEqual(C.summary(all,today),{overdue:1,today:2,week:2,unscheduled:1});
assert.deepEqual(C.agenda(all,today).map(x=>x.id+':'+x.tasks.length),['overdue:1','today:2','tomorrow:1','week:1','later:1']);
assert.equal(C.agenda(all,today)[1].tasks[0].id,8,'high priority first on the same day');
assert.equal(C.scheduled(all).length,6);assert.equal(C.scheduled(all,{showDone:true}).length,7);assert.deepEqual(C.unscheduled(all).map(t=>t.id),[6]);

/* ICS */
const ics=C.buildIcs([T('a','2026-10-28',{title:'Ship, report; v2\nfinal'}),T('b',null),T('c','2026-10-29',{status:'done'})],{now:new Date('2026-10-27T10:00:00Z'),spaceName:()=>'Work'});
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n')&&ics.endsWith('END:VCALENDAR\r\n'));
assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,1,'only open tasks with deadlines');
assert.match(ics,/DTSTART;VALUE=DATE:20261028\r\nDTEND;VALUE=DATE:20261029/);assert.match(ics,/UID:a@self/);
assert.ok(ics.includes('SUMMARY:Due: Ship\\, report\\; v2 final\r\n'));assert.match(ics,/DTSTAMP:20261027T100000Z/);
assert.ok(ics.split('\r\n').every(l=>l.length<=75),'folded to 75');
assert.equal((C.buildIcs([T('c','2026-10-29',{status:'done'})],{includeDone:true}).match(/STATUS:CANCELLED/g)||[]).length,1);

/* Google link + payload + plan */
const url=new URL(C.googleTemplateUrl(T('a','2026-12-31',{title:'A & B'}),'Work'));
assert.equal(url.host,'calendar.google.com');assert.equal(url.searchParams.get('dates'),'20261231/20270101');assert.equal(url.searchParams.get('text'),'Due: A & B');
const p=C.eventPayload(T('a','2026-10-28'));assert.deepEqual(p.start,{date:'2026-10-28'});assert.deepEqual(p.end,{date:'2026-10-29'});assert.equal(p.extendedProperties.private.selfTaskId,'a');assert.equal(p.transparency,'transparent');
const owned=(id,date,summary)=>({id:'g'+id,summary,start:{date},extendedProperties:{private:{selfApp:'SELF',selfTaskId:id}}});
const tasks=[T('1','2026-10-28'),T('2','2026-10-29'),T('3','2026-10-30'),T('4',null),T('5','2026-10-30',{status:'done'})];
const events=[owned('1','2026-10-28','Due: Task 1'),owned('2','2026-10-01','Due: Task 2'),owned('4','2026-10-02','Due: gone'),owned('9','2026-10-02','Due: deleted task'),
 {id:'foreign',summary:'Dentist',start:{date:'2026-10-29'},extendedProperties:{private:{selfTaskId:'3'}}}];
const plan=C.planSync(tasks,events);
assert.deepEqual(plan.create.map(x=>x.task.id),['3'],'foreign events are never adopted; done tasks without an event are not created');
assert.deepEqual(plan.update.map(x=>x.task.id),['2']);assert.equal(plan.same,1);
assert.deepEqual(plan.remove.map(x=>x.eventId).sort(),['g4','g9']);
assert.equal(C.planSync(tasks,events,{allowRemove:false}).remove.length,0);
const doneEv=C.planSync([T('1','2026-10-28',{status:'done'})],[owned('1','2026-10-28','Due: Task 1')]);
assert.equal(doneEv.update[0].body.summary,'✓ Task 1','finished tasks get a check, not a delete');

/* Google event mapping */
assert.deepEqual(C.mapGoogleEvent({id:'x',summary:'Trip',start:{date:'2026-10-28'},end:{date:'2026-10-31'}}),{id:'x',title:'Trip',date:'2026-10-28',endDate:'2026-10-30',time:'',allDay:true,own:false,taskId:null,routineId:null,link:''});
const timed=C.mapGoogleEvent({id:'y',start:{dateTime:'2026-10-28T09:30:00'},end:{dateTime:'2026-10-28T10:00:00'}});
assert.equal(timed.title,'(No title)');assert.equal(timed.time,'09:30');assert.equal(timed.date,'2026-10-28');
assert.equal(C.mapGoogleEvent({id:'z',status:'cancelled',start:{date:'2026-10-28'}}),null);
const by=C.eventsByDate([C.mapGoogleEvent({id:'x',summary:'Trip',start:{date:'2026-10-28'},end:{date:'2026-10-30'}}),timed]);
assert.deepEqual([...by.keys()],['2026-10-28','2026-10-29']);assert.equal(by.get('2026-10-28')[0].allDay,true,'all-day sorts before timed');


/* routines: repeating items */
const R=(o={})=>C.cleanRoutine({id:'r1',title:'Weekly review',freq:'weekly',interval:1,days:[0,2],start:'2026-10-26',...o});
{
 const r=R();
 assert.equal(C.describe(r),'Every week on Mon, Wed');
 assert.deepEqual(C.occurrences(r,'2026-10-26','2026-11-08'),['2026-10-26','2026-10-28','2026-11-02','2026-11-04'],'Mon+Wed every week');
 assert.deepEqual(C.occurrences(R({interval:2}),'2026-10-26','2026-11-15'),['2026-10-26','2026-10-28','2026-11-09','2026-11-11'],'every 2 weeks');
 assert.deepEqual(C.occurrences(r,'2026-10-01','2026-10-27'),['2026-10-26'],'nothing before the start date');
 assert.deepEqual(C.occurrences(R({until:'2026-11-02'}),'2026-10-26','2026-11-30'),['2026-10-26','2026-10-28','2026-11-02'],'until is inclusive');
 assert.deepEqual(C.occurrences(R({skip:['2026-10-28']}),'2026-10-26','2026-10-30'),['2026-10-26'],'skipped day removed');
 assert.deepEqual(C.occurrences(R({freq:'daily',interval:3,days:[]}),'2026-10-26','2026-11-04'),['2026-10-26','2026-10-29','2026-11-01','2026-11-04']);
 assert.deepEqual(C.occurrences(R({freq:'monthly',start:'2026-01-31',days:[]}),'2026-01-01','2026-04-30'),['2026-01-31','2026-02-28','2026-03-31','2026-04-30'],'monthly clamps to month end');
 assert.equal(C.cleanRoutine({id:'x',title:'  ',start:'2026-10-26'}),null);assert.equal(C.cleanRoutine({id:'x',title:'A',start:'2026-13-01'}),null);
 assert.deepEqual(R({days:[]}).days,[0],'weekly with no days falls back to the start weekday');
 assert.equal(R({time:'09:00',endTime:'08:00'}).endTime,'','end before start is dropped');
 assert.equal(C.firstOccurrence(R({start:'2026-10-27'})),'2026-10-28','first occurrence is the first matching day');
 assert.equal(C.rrule(r),'FREQ=WEEKLY;BYDAY=MO,WE');assert.equal(C.rrule(R({interval:2,until:'2026-12-31'})),'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261231');
 assert.equal(C.routinesByDate([r],'2026-10-26','2026-10-28').get('2026-10-28')[0].r.id,'r1');
 const ics=C.buildIcs([],{now:new Date('2026-10-27T10:00:00Z'),routines:[R({skip:['2026-11-02'],time:'09:00'})]});
 assert.match(ics,/UID:routine-r1@self/);assert.match(ics,/DTSTART:20261026T090000/);assert.match(ics,/RRULE:FREQ=WEEKLY;BYDAY=MO,WE/);assert.match(ics,/EXDATE:20261102T090000/);assert.match(ics,/SUMMARY:↻ Weekly review/);
 const p1=C.routinePayload(R({skip:['2026-11-02']}),'Asia/Jakarta');
 assert.deepEqual(p1.recurrence,['RRULE:FREQ=WEEKLY;BYDAY=MO,WE','EXDATE;VALUE=DATE:20261102']);assert.deepEqual(p1.start,{date:'2026-10-26'});assert.equal(p1.extendedProperties.private.selfRoutineId,'r1');
 const timed=C.routinePayload(R({time:'09:00'}),'Asia/Jakarta');assert.deepEqual(timed.start,{dateTime:'2026-10-26T09:00:00',timeZone:'Asia/Jakarta'});assert.deepEqual(timed.end,{dateTime:'2026-10-26T10:00:00',timeZone:'Asia/Jakarta'});
 const have={id:'g1',...p1};
 assert.equal(C.planRoutineSync([R({skip:['2026-11-02']})],[have],{tz:'Asia/Jakarta'}).same,1,'unchanged routine is left alone');
 assert.equal(C.planRoutineSync([R({title:'Renamed',skip:['2026-11-02']})],[have]).update.length,1);
 assert.equal(C.planRoutineSync([],[have]).remove.length,1,'deleted routine removes its own event');assert.equal(C.planRoutineSync([],[have],{allowRemove:false}).remove.length,0);
 assert.equal(C.planRoutineSync([r],[]).create.length,1);
 assert.equal(C.planSync([],[have]).remove.length,0,'task sync never touches routine events');
 const m=C.mapGoogleEvent({id:'g',summary:'x',start:{dateTime:'2026-10-28T09:00:00'},extendedProperties:{private:{selfApp:'SELF',selfRoutineId:'r1'}}});assert.equal(m.own,true);assert.equal(m.routineId,'r1');
}
/* rendering escapes user text */
C.init({state:()=>({tasks:[T('x','2026-10-28',{title:'<img src=x onerror=alert(1)>'})]}),esc:s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),attr:s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),ic:()=>'',today:()=>today,spaceOf:()=>null,statusOf:()=>['todo','To Do'],mutate:async f=>f(),patch:async()=>({}),render(){},newTask(){}});
for(const v of ['month','week','agenda']){C.state.view=v;C.state.anchor=today;const h=C.render();assert.doesNotMatch(h,/<img/,v+' escapes titles');assert.match(h,/&#60;img/,v+' shows the task')}
console.log('calendar smoke ok');
