/* Rooms shell: routing table, badges (only from loaded data), door markup, Alt+digit keys and the classic-shell fallback. */
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const R=require('../rooms.js');
const root=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

/* roomOf covers every view and Career page */
const expect={home:'today',work:'work',spaces:'work',space:'work',links:'work',inbox:'work',boards:'studio','board-editor':'studio',calendar:'calendar',search:null,settings:null};
for(const [view,room] of Object.entries(expect))assert.equal(R.roomOf(view),room,view);
assert.equal(R.roomOf('career','overview'),'hunt');
for(const p of ['applications','people','companies','radar','cvs','interviews','templates','reminders'])assert.equal(R.roomOf('career',p),'hunt',p);
assert.equal(R.roomOf('career','learning'),'study');
assert.equal(R.roomOf('nope'),null);
assert.deepEqual(R.ROOMS.map(r=>r.id),['today','work','hunt','study','studio','calendar']);

/* badges: real numbers only, nothing for empty or missing data */
const now=Date.parse('2026-10-23T09:00:00Z'),day='2026-10-23',h=3600e3;
const b=R.badges({today:day,now,tasks:[
 {status:'todo',due_date:'2026-10-20'},{status:'in_progress',due_date:day},{status:'done',due_date:'2026-10-01'},{status:'todo',due_date:'2026-10-30'},{status:'todo'}],
 boards:[{id:1},{id:2}],
 interviews:[{stage:'scheduled',scheduled_at:new Date(now+2*h).toISOString()},{stage:'scheduled',scheduled_at:new Date(now+8*24*h).toISOString()},
  {stage:'completed',scheduled_at:new Date(now+3*h).toISOString()},{stage:'scheduled',scheduled_at:new Date(now-h).toISOString()},{stage:'scheduled',scheduled_at:'garbage'},{stage:'scheduled'}]});
assert.equal(b.today.n,2);assert.equal(b.today.text,'2 due');
assert.equal(b.work.n,4);assert.equal(b.hunt.n,1);assert.equal(b.hunt.text,'1 intvw');
assert.equal(b.study,null);assert.equal(b.studio.text,'2 boards');
const empty=R.badges({today:day,tasks:[],boards:[],interviews:undefined});
for(const k of ['today','work','hunt','study','studio','calendar'])assert.equal(empty[k],null,'no badge when '+k+' is empty or unloaded');
assert.equal(R.badges({today:day,tasks:[],boards:[{}]}).studio.text,'1 board');

/* markup */
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=n=>'<svg data-i="'+n+'"></svg>';
const ctx=over=>({study:true,view:'home',tasks:[],boards:[],today:day,ic,esc,...over});
function count(html,re){return (html.match(re)||[]).length}
for(const [view,page,active] of [['home',undefined,'today'],['work',undefined,'work'],['space',undefined,'work'],['career','overview','hunt'],['career','learning','study'],['boards',undefined,'studio'],['calendar',undefined,'calendar']]){
 const html=R.sidebar(ctx({view,careerPage:page}),'<div class="brand"></div>','<div class="sidebar-foot"></div>');
 assert.equal(count(html,/class="door"/g),6,view+' six doors');
 assert.equal(count(html,/aria-current="page"/g),1,view+' one current door');
 assert.match(html,new RegExp('data-room="'+active+'"[^>]*aria-current="page"'),view+' current is '+active);
 assert.match(html,/aria-label="SELF navigation"/);assert.match(html,/class="sidebar rooms-rail"/);
 assert.match(html,/data-action="nav" data-view="career" data-room="hunt"/);assert.match(html,/data-action="nav" data-view="career" data-room="study"/);
}
const none=R.sidebar(ctx({view:'settings'}),'','');
assert.equal(count(none,/aria-current="page"/g),0,'settings has no current door');
const bar=R.bar(ctx({view:'work'}));assert.match(bar,/class="mobile-nav rooms-bar"/);assert.equal(count(bar,/class="door"/g),6);
assert.match(R.sidebar(ctx({tasks:[{status:'todo',due_date:'2026-10-01'}]}),'',''),/aria-label="Today \(1 task due today or overdue\)"/);
assert.match(R.subnav(ctx({view:'space'})),/data-view="spaces" aria-current="page"/);
assert.match(R.subnav(ctx({view:'work'})),/data-view="work" aria-current="page"/);
assert.equal(R.subnav(ctx({view:'home'})),'');assert.equal(R.subnav(ctx({view:'career',careerPage:'overview'})),'');

/* keys */
const key=(o,study=true)=>R.roomForKey({altKey:true,target:{tagName:'DIV'},...o},study);
/* Accounts without Study: five doors, no Study door, Alt+4 is Studio, Alt+5 is Calendar, Alt+6 is nothing; Hunt stays. */
{const h=R.sidebar(ctx({study:false}),'','');assert.equal(count(h,/class="door"/g),5,'five doors without Study');assert.doesNotMatch(h,/data-room="study"/);assert.match(h,/data-room="hunt"/);
 assert.equal(key({key:'4'},false),'studio');assert.equal(key({key:'5'},false),'calendar');assert.equal(key({key:'6'},false),null);assert.equal(key({key:'4'},true),'study');
 assert.equal(count(R.bar(ctx({study:false})),/class="door"/g),5)}
assert.equal(key({key:'1'}),'today');assert.equal(key({key:'5'}),'studio');assert.equal(key({key:'6'}),'calendar');assert.equal(key({key:'7'}),null);assert.equal(key({key:'0'}),null);
assert.equal(key({key:'2',ctrlKey:true}),null);assert.equal(key({key:'2',altKey:false}),null);
assert.equal(key({key:'2',target:{tagName:'INPUT'}}),null);assert.equal(key({key:'2',target:{tagName:'TEXTAREA'}}),null);assert.equal(key({key:'2',target:{isContentEditable:true,tagName:'DIV'}}),null);

/* alignCareer only changes the page across the Hunt/Study split */
const calls=[];globalThis.SELFCareer={ui:{page:'overview'},setPage:id=>calls.push(id)};
R.alignCareer('study');R.alignCareer('hunt');assert.deepEqual(calls,['learning']);
SELFCareer.ui.page='learning';R.alignCareer('hunt');R.alignCareer('study');assert.deepEqual(calls,['learning','tracker']);
SELFCareer.ui.page='applications';R.alignCareer('hunt');assert.deepEqual(calls,['learning','tracker'],'hunt keeps the current Career page');
delete globalThis.SELFCareer;

/* integration: real app.js in a vm, rooms and classic */
function boot(search){
 let markup='';const el={style:{setProperty(){}},dataset:{}};
 const w={scrollTo(){},__SELF_CAREER_OWNERS:['u1']};
 const ctx={console,setTimeout,clearTimeout,URL,URLSearchParams,Date,window:w,location:{search},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{},
  document:{body:el,documentElement:el,addEventListener(){},querySelector:s=>s==='#app'?{set innerHTML(v){markup=v},get innerHTML(){return markup}}:null}};
 vm.createContext(ctx);
 for(const f of ['access.js','rooms.js','self-dnd.js','career.js','app.js'])vm.runInContext(root(f),ctx);
 vm.runInContext('state.user={id:"u1",email:"a@b.c"};state.spaces=[{id:"s1",name:"Fin",icon:"chart",accent:"green"}];state.tasks=[{id:"t1",title:"Do",space_id:"s1",status:"todo",priority:"high",due_date:"2026-10-20",created_at:"2026-10-01T00:00:00Z"}];',ctx);
 return {ctx,html:()=>markup};
}
const rooms=boot('');
{const other=boot('');vm.runInContext('state.user={id:"u2",email:"x@y.z"};state.view="home";render();',other.ctx);
 assert.equal(count(other.html(),/class="door"/g),10,'a non-owner gets five doors in the rail and five in the bar');assert.doesNotMatch(other.html(),/data-room="study"/);
 vm.runInContext('state.view="career";render();',other.ctx);vm.runInContext('go("career",{room:"study"});',other.ctx);assert.doesNotMatch(other.html(),/Career Prep|CAREER \/ CAREER PREP/,'non-owner can never open Study')}
for(const view of ['home','spaces','space','boards','work','links','inbox','career','search','settings']){
 vm.runInContext("state.view='"+view+"';state.spaceId='s1';render();",rooms.ctx);const m=rooms.html();
 assert.match(m,/data-shell="rooms"/,view);assert.match(m,/class="sidebar rooms-rail"/,view);assert.match(m,/class="mobile-nav rooms-bar"/,view);
 assert.equal(count(m,/class="door"/g),12,view+': six doors in the rail and six in the bar');
 assert.match(m,/data-action="nav" data-view="settings"/,view+': Settings stays reachable');
}
vm.runInContext("state.view='work';render();",rooms.ctx);
assert.match(rooms.html(),/class="rooms-subnav"/);
vm.runInContext("state.view='home';render();",rooms.ctx);assert.doesNotMatch(rooms.html(),/rooms-subnav/);
vm.runInContext("state.animateNext=true;render();",rooms.ctx);assert.match(rooms.html(),/class="body" data-enter="1"/);
vm.runInContext("render();",rooms.ctx);assert.doesNotMatch(rooms.html(),/data-enter/,'the entrance plays once, not on every re-render');
vm.runInContext("go('work');",rooms.ctx);assert.match(rooms.html(),/data-enter="1"/,'navigation asks for the entrance');
vm.runInContext("state.view='career';render();",rooms.ctx);assert.match(rooms.html(),/data-room="hunt"/);

const classic=boot('?shell=classic');
vm.runInContext("state.view='home';render();",classic.ctx);const c=classic.html();
assert.doesNotMatch(c,/data-shell="rooms"/);assert.match(c,/class="nav-btn[^"]*"[^>]*data-view="career"/);assert.match(c,/class="mobile-nav"/);assert.match(c,/class="sidebar"/);
console.log('PASS Rooms: routing for every view and Career page, loaded-data-only badges, one current door, work sub-nav, Alt+digit keys, Career split alignment, entrance once per navigation, classic shell fallback');
