/* Today room: Three for today, agenda merge (WIB), inbox triage queue, pins, and the rendered markup. */
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const T=require('../today.js');

/* ---- pins: per device, per day, survive bad storage ---- */
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}};
const st=mem();assert.deepEqual(T.readPins(st,'u','2026-10-23'),[]);
T.writePins(st,'u','2026-10-23',['a','b','c','d']);assert.deepEqual(T.readPins(st,'u','2026-10-23'),['a','b','c'],'at most three');
assert.deepEqual(T.readPins(st,'u','2026-10-24'),[],'pins belong to a day');assert.deepEqual(T.readPins(st,'other','2026-10-23'),[],'pins belong to a user');
assert.deepEqual(T.readPins({getItem:()=>'{not json'},'u','d'),[]);assert.deepEqual(T.readPins({getItem:()=>'{"a":1}'},'u','d'),[]);assert.deepEqual(T.readPins({getItem(){throw Error('blocked')}},'u','d'),[]);
assert.doesNotThrow(()=>T.writePins({setItem(){throw Error('quota')}},'u','d',['a']));

/* ---- Three for today ---- */
const t=(id,status,due,pri='normal',upd='2026-10-01')=>({id,title:'Task '+id,status,priority:pri,due_date:due,updated_at:upd});
const rank=(a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999')||a.id.localeCompare(b.id);
const tasks=[t('a','todo','2026-10-24'),t('b','in_progress','2026-10-20'),t('c','todo',null),t('d','done','2026-10-01'),t('e','review','2026-10-23'),t('f','todo','2026-10-30')];
let r=T.pickThree({tasks,pins:[],rank});
assert.deepEqual(r.three.map(x=>x.id),['b','e','a'],'best three by rank, done excluded');assert.equal(r.open,5);assert.deepEqual(r.candidates.map(x=>x.id),['f','c']);
r=T.pickThree({tasks,pins:['c','f'],rank});assert.deepEqual(r.three.map(x=>x.id),['c','f','b'],'pins keep their order, the rest fill from the ranking');
r=T.pickThree({tasks,pins:['d','zzz','c','c'],rank});assert.deepEqual(r.three.map(x=>x.id),['c','b','e'],'done, unknown and duplicate pins drop out');
r=T.pickThree({tasks:[],pins:[],rank});assert.deepEqual(r.three,[]);r=T.pickThree({tasks:[t('x','todo',null),t('y','todo',null)],pins:[],rank});assert.equal(r.three.length,2,'fewer than three open is fine');

/* ---- Agenda ---- */
const day='2026-10-23',now=Date.parse('2026-10-23T02:00:00Z'); // 09:00 WIB
const base=[t('late','todo','2026-10-20'),t('today','todo',day),t('later','todo','2026-10-30'),t('finished','done','2026-10-01'),t('nodate','todo',null)];
let ag=T.buildAgenda({tasks:base,day,now});
assert.deepEqual(ag.items.map(i=>i.key),['task:late','task:today'],'without Career: only tasks due or overdue, oldest first');
assert.equal(ag.items[0].tone,'alert');assert.equal(ag.items[0].time,'3d late');assert.equal(ag.items[1].time,'Today');assert.equal(ag.hidden,0);
const career={
 companies:[{id:'co1',name:'Sample Sponsor'}],applications:[{id:'ap1',company_id:'co1',role_title:'Analyst, PE'}],
 people:[{id:'p1',full_name:'Sari',relationship_stage:'in_conversation',last_contacted_at:'2026-10-04'},{id:'p2',full_name:'Dimas',relationship_stage:'reached_out',last_contacted_at:'2026-10-20'},
  {id:'p3',full_name:'Ayu',relationship_stage:'maintain',last_contacted_at:'2026-08-01'},{id:'p4',full_name:'Bima',relationship_stage:'in_conversation',last_contacted_at:null},{id:'p5',full_name:'Rara',relationship_stage:'new',last_contacted_at:null}],
 touchpoints:[{id:'t1',person_id:'p5',contact_at:'2026-10-22',created_at:'2026-10-22T05:00:00Z',next_step:'Send thanks'},{id:'t0',person_id:'p5',contact_at:'2026-10-01',created_at:'2026-10-01T05:00:00Z',next_step:'old step'},
  {id:'t2',person_id:'p2',contact_at:'2026-10-20',created_at:'2026-10-20T05:00:00Z',next_step:''}],
 interviews:[
  {id:'i1',application_id:'ap1',title:'Case round',stage:'scheduled',scheduled_at:'2026-10-23T08:30:00Z',format:'video'},   // 15:30 WIB today
  {id:'i2',application_id:'ap1',title:'Partner call',stage:'scheduled',scheduled_at:'2026-10-26T03:00:00Z',format:'phone'},  // Mon 10:00 WIB
  {id:'i3',application_id:'ap1',title:'Too far',stage:'scheduled',scheduled_at:'2026-11-05T03:00:00Z'},
  {id:'i4',application_id:'ap1',title:'Done',stage:'completed',scheduled_at:'2026-10-24T03:00:00Z'},
  {id:'i5',application_id:'ap1',title:'Already passed',stage:'scheduled',scheduled_at:'2026-10-23T00:00:00Z'},
  {id:'i6',application_id:'ap1',title:'No time',stage:'scheduled',scheduled_at:null}]};
ag=T.buildAgenda({tasks:base,day,now,career});
assert.deepEqual(ag.items.map(i=>i.key),['task:late','task:today','interview:i1','interview:i2','follow:p5','suggest:p1'],'tasks, interviews by time, follow-ups, then suggestions');
const byKey=Object.fromEntries(ag.items.map(i=>[i.key,i]));
assert.equal(byKey['interview:i1'].time,'15:30','interview times show in WIB (UTC+7)');
assert.match(byKey['interview:i2'].time,/^Sen,? 26 Okt 10:00$/,'later interviews show the day then WIB time: '+byKey['interview:i2'].time);
assert.equal(byKey['interview:i1'].sub,'Interview · Analyst, PE · Sample Sponsor · video');
assert.equal(byKey['follow:p5'].sub,'Next step · Send thanks','the latest touchpoint decides the next step');
assert.equal(byKey['suggest:p1'].sub,'Last contact 19 days ago');
for(const k of ['follow:p2','suggest:p2','suggest:p3','suggest:p4','follow:p4'])assert.ok(!byKey[k],k+' must not appear: recent, wrong stage, or no contact to measure');
assert.ok(ag.items.every(i=>i.open&&i.open.action),'every row opens its source');
const many=T.buildAgenda({tasks:Array.from({length:12},(_,i)=>t('m'+i,'todo','2026-10-1'+(i%9))),day,now});
assert.equal(many.items.length,8);assert.equal(many.hidden,4,'capped with an honest remainder');
assert.deepEqual(T.buildAgenda({tasks:[],day,now,career:{}}).items,[],'empty career object is fine');

/* ---- Triage queue ---- */
const inbox=[{id:'n3',created_at:'2026-10-23T03:00:00Z',space_id:null},{id:'n1',created_at:'2026-10-21T03:00:00Z',space_id:null},{id:'n2',created_at:'2026-10-22T03:00:00Z',space_id:'s1'},{id:'n4',created_at:'2026-10-22T04:00:00Z',space_id:null},{id:'n5',created_at:'2026-10-22T05:00:00Z',space_id:null}];
assert.deepEqual(T.triageQueue(inbox,new Set(),new Map()).map(x=>x.id),['n1','n4','n5','n3'],'oldest unsorted first; filed items are not unsorted');
assert.deepEqual(T.triageQueue(inbox,new Set(['n1']),new Map([['n4',1]])).map(x=>x.id),['n5','n3'],'kept and pending-delete items leave the queue');

/* ---- rendered markup in the real app ---- */
function boot(){
 let markup='';const el={style:{setProperty(){}},dataset:{}};
 const store=mem();const w={scrollTo(){},localStorage:store};
 const ctx={console,setTimeout,clearTimeout,URL,URLSearchParams,Date,Intl,window:w,location:{search:''},localStorage:store,navigator:{},
  document:{body:el,documentElement:el,addEventListener(){},querySelector:s=>s==='#app'?{set innerHTML(v){markup=v},get innerHTML(){return markup}}:null}};
 vm.createContext(ctx);for(const f of ['rooms.js','self-dnd.js','today.js','career.js','app.js'])vm.runInContext(root(f),ctx);
 return {ctx,w,html:()=>markup,store};
}
const app=boot();
const today=app.ctx.today?.()||vm.runInContext('today()',app.ctx);
vm.runInContext(`state.user={id:'u1',email:'a@b.c'};state.spaces=[{id:'s1',name:'Finance',icon:'chart',accent:'green'}];
 state.tasks=[{id:'t1',title:'Debt schedule',space_id:'s1',status:'planning',priority:'high',due_date:'${today}',created_at:'2026-10-01',updated_at:'2026-10-02'},{id:'t2',title:'<img src=x onerror=alert(1)>',space_id:null,status:'todo',priority:'normal',due_date:null,created_at:'2026-10-01',updated_at:'2026-10-01'},
  {id:'t3',title:'Third',status:'todo',priority:'low',due_date:null,created_at:'2026-10-01',updated_at:'2026-10-01'},{id:'t4',title:'Fourth',status:'todo',priority:'low',due_date:null,created_at:'2026-10-01',updated_at:'2026-10-01'}];
 state.checklist=[{id:'c1',task_id:'t1',text:'x',is_done:true,position:0},{id:'c2',task_id:'t1',text:'y',is_done:false,position:1}];
 state.inbox=[{id:'n1',title:'Compare DCF vs comps',body:'for BBCA',kind:'note',space_id:null,created_at:'2026-10-21T03:00:00Z'},{id:'n2',title:'docs.google.com',body:'https://docs.google.com/x',kind:'link',space_id:null,created_at:'2026-10-22T03:00:00Z'}];
 state.view='home';render();`,app.ctx);
let m=app.html();
assert.match(m,/class="card card-pad today-three"/);assert.match(m,/data-dnd-zone="three:today"/);
assert.equal((m.match(/class="three-row"/g)||[]).length,3,'exactly three rows');assert.match(m,/\+1 more open/);
assert.match(m,/data-dnd-item="t1"[^>]*data-dnd-type="three"/);assert.match(m,/1\/2 steps/);assert.match(m,/class="mini-bar"/);
assert.doesNotMatch(m,/<img src=x/,'task titles are escaped');assert.match(m,/&lt;img src=x/);
assert.match(m,/Inbox · 2 to sort/);assert.match(m,/data-today="triage-task" data-id="n1"/,'oldest capture is on top');
assert.match(m,/data-today-file="n1"/);assert.match(m,/class="triage-card" data-triage="n2" aria-hidden="true"/,'cards behind the top one are hidden from assistive tech');
assert.match(m,/data-today="load-career"/,'Career agenda is opt-in, not fetched at boot');assert.match(m,/Interviews and follow-ups come from Career/);
assert.match(m,/class="today-recents"/);assert.match(m,/class="countbar"/);assert.match(m,/Quick Capture/,'capture card kept');
assert.match(m,/Debt schedule/);
/* swap writes a pin and the three follow it */
vm.runInContext("window.SELFToday.change({target:{dataset:{todaySwap:'t1'},value:'t4'}})",app.ctx);
const pins=JSON.parse(app.store.getItem('self.today.u1.'+today));assert.ok(pins.includes('t4')&&!pins.includes('t1'),'swap replaced t1 with t4: '+pins);
m=app.html();assert.match(m,/data-dnd-item="t4"/);assert.doesNotMatch(m,/data-dnd-item="t1"/);
/* the three adapter reads the DOM order; registered */
assert.ok(app.w.SELFDnd.adapter('three'),'three adapter registered');
/* empty states */
vm.runInContext("state.tasks=[];state.inbox=[];render();",app.ctx);m=app.html();
assert.match(m,/Nothing open\./);assert.match(m,/Nothing scheduled\. Pick three from Work\./);assert.match(m,/Inbox clear\./);assert.doesNotMatch(m,/class="three-row"/);
/* classic shell still renders the original Home */
const classic=boot();vm.runInContext("state.user={id:'u1',email:'a@b.c'};state.spaces=[];state.tasks=[];state.inbox=[];state.view='home';location.search='?shell=classic';render();",classic.ctx);
const c=classic.html();assert.match(c,/My Priorities/);assert.match(c,/Continue Where You Left Off/);assert.doesNotMatch(c,/today-three/);
/* sources */
const src=root('today.js');assert.doesNotMatch(src,/innerHTML\s*=/,'no direct innerHTML writes');assert.doesNotMatch(src,/fetch\(|XMLHttpRequest/,'no network of its own');
assert.match(src,/pendingDelete\.set\(id,timer\)/);assert.match(src,/UNDO_MS=5000/);
console.log('PASS Today: pins per device/day, Three for today (pins, fill, done/unknown/duplicates), agenda merge in WIB with caps and no invented rows, triage queue, escaped markup, swap, empty states, classic Home intact');
