/* Drag-and-drop: landing slot equals the post-save position, board markup contract, adapters registered, legacy fallback kept. */
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const dnd=require('../self-dnd.js');

/* sortedSlot: pure */
const num=(a,b)=>a-b;
assert.equal(dnd.sortedSlot([],5,num),0);assert.equal(dnd.sortedSlot([1,3,7],5,num),2);assert.equal(dnd.sortedSlot([1,3,7],0,num),0);assert.equal(dnd.sortedSlot([1,3,7],9,num),3);

/* the real app in a vm */
let markup='';const el={style:{setProperty(){}},dataset:{}};const w={scrollTo(){}};
const ctx={console,setTimeout,clearTimeout,URL,URLSearchParams,Date,window:w,location:{search:''},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},navigator:{},
 document:{body:el,documentElement:el,addEventListener(){},querySelector:s=>s==='#app'?{set innerHTML(v){markup=v},get innerHTML(){return markup}}:null}};
vm.createContext(ctx);for(const f of ['rooms.js','self-dnd.js','career.js','app.js'])vm.runInContext(root(f),ctx);
assert.ok(w.SELFDnd.adapter('status'),'app.js registers the status adapter');

/* tasks with ties: same due date, missing dates, identical created_at, ids that sort differently from array order */
const T=(id,status,due,created)=>({id,title:'T '+id,status,priority:'normal',due_date:due,created_at:created,space_id:null});
const tasks=[T('d','todo','2026-10-24','2026-10-02T00:00:00Z'),T('a','planning','2026-10-24','2026-10-01T00:00:00Z'),T('c','planning','2026-10-24','2026-10-01T00:00:00Z'),
 T('b','review',null,'2026-10-03T00:00:00Z'),T('e','review',null,'2026-10-03T00:00:00Z'),T('f','in_progress','2026-10-20','2026-10-05T00:00:00Z'),T('g','done','2026-10-25','2026-10-04T00:00:00Z'),
 T('h','todo',null,'2026-09-30T00:00:00Z'),T('i','todo','2026-10-24','2026-10-02T00:00:00Z')];
w.__tasks=tasks;
vm.runInContext('state.user={id:"u",email:"a@b.c"};state.tasks=window.__tasks;state.spaces=[];',ctx);
const adapter=w.SELFDnd.adapter('status');
let checked=0;
for(const t of tasks)for(const target of ['todo','planning','in_progress','review','done']){
 // what the engine computes while dragging: the other cards of the target column, in their rendered order
 const others=vm.runInContext('filteredTasks()',ctx).filter(x=>x.status===target&&x.id!==t.id).map(x=>({dataset:{dndItem:x.id}}));
 const slot=adapter.landingIndex({dataset:{dndItem:t.id}},null,others);
 // what the board shows after the save
 const before=t.status;t.status=target;
 const after=vm.runInContext('filteredTasks()',ctx).filter(x=>x.status===target).map(x=>x.id);
 t.status=before;
 assert.equal(slot,after.indexOf(t.id),'slot for '+t.id+' -> '+target+' must equal its position after saving');checked++;
}
/* the order is a pure function of the data, not of array order */
const shuffled=[...tasks].reverse();w.__tasks=shuffled;vm.runInContext('state.tasks=window.__tasks',ctx);
assert.deepEqual(vm.runInContext('filteredTasks()',ctx).map(x=>x.id),(w.__tasks=tasks,vm.runInContext('state.tasks=window.__tasks;filteredTasks()',ctx)).map(x=>x.id),'task order does not depend on the order the API returned rows');
assert.equal(adapter.accepts({dataset:{dndType:'task'}}),true);assert.equal(adapter.accepts({dataset:{dndType:'application'}}),false);
assert.equal(adapter.label('in_progress'),'In Progress');

/* board markup contract */
vm.runInContext("state.view='work';state.workView='board';render();",ctx);
for(const s of ['todo','planning','in_progress','review','done']){
 assert.match(markup,new RegExp('data-drop-status="'+s+'" data-dnd-zone="status:'+s+'"'),s+' zone');
 assert.match(markup,new RegExp('data-count-for="status:'+s+'"'),s+' count badge');
}
assert.equal((markup.match(/data-dnd-item="/g)||[]).length,tasks.length,'every task is a draggable item');
assert.equal((markup.match(/data-dnd-grip/g)||[]).length,tasks.length,'every card has a grip');
assert.match(markup,/draggable="true" data-task-drag="a"/,'legacy HTML5 markup kept as a fallback');
assert.match(markup,/data-dnd-scroll/);assert.match(markup,/id="dnd-help"/);assert.match(markup,/id="dnd-live"[^>]*aria-live="assertive"/);
assert.match(markup,/class="kanban-stage-select"/,'the native status select stays as the keyboard and screen-reader path');
assert.match(markup,/aria-describedby="dnd-help"/);
vm.runInContext("state.workView='list';render();",ctx);assert.doesNotMatch(markup,/data-dnd-zone/,'list view has no drop zones');

/* Applications: markup and adapter are wired in source */
const p2=root('career-phase2.js');
for(const needle of ['data-dnd-zone="stage:','data-dnd-item="','data-dnd-type="application"',"register('stage'",'data-count-for="stage:','id="dnd-live"'])assert.ok(p2.includes(needle),'career-phase2.js has '+needle);
assert.ok(p2.includes('draggable="true" data-career2-drag='),'legacy Applications drag kept as a fallback');

/* engine safety: it never saves by itself, and native drag is suppressed only for its own items */
const engine=root('self-dnd.js');
assert.doesNotMatch(engine,/fetch\(|XMLHttpRequest|\.patch\(|\.insert\(|localStorage/,'self-dnd.js performs no I/O');
assert.match(engine,/noNative/);assert.match(engine,/'dragstart',noNative,true/);
assert.match(engine,/pending=\{id,zone/,'landed marker is set before the save re-renders');
console.log('PASS Drag-and-drop: '+checked+' landing slots equal post-save positions (ties, null dates, same timestamps), order independent of API row order, board and Applications markup, adapters, keyboard/native fallbacks, engine does no I/O');
