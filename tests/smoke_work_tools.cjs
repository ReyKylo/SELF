/* Work tools: saved views (names, limits, replace, deleted Space) and bulk planning (only real changes, validation, partial failure, undo). */
const assert=require('node:assert/strict');
const W=require('../work-tools.js');
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
/* names */
eq(W.viewName('  My   Career   week  '),'My Career week');eq(W.viewName('x'.repeat(100)).length,40);eq(W.viewName(null),'');
/* saving */
let r=W.saveView([],{name:'Career this week',mode:'board',space:'s1',status:'in_progress',search:' memo '});
eq(r.views.length,1);eq(r.views[0],{id:r.views[0].id,name:'Career this week',mode:'board',space:'s1',status:'in_progress',search:'memo'});assert.match(r.views[0].id,/^v/);n++;
eq(W.saveView([],{name:'  '}).error,'Give the view a name.');
const r2=W.saveView(r.views,{name:'career THIS week',mode:'list',space:'all',status:'all',search:''});
eq(r2.replaced,true);eq(r2.views.length,1);eq(r2.views[0].id,r.views[0].id,'same name (any case) replaces and keeps the id');eq(r2.views[0].mode,'list');
let many=[];for(let i=0;i<12;i++)many=W.saveView(many,{name:'v'+i}).views;
eq(many.length,12);eq(W.saveView(many,{name:'one more'}).error,'You can keep up to 12 views. Remove one first.');eq(W.saveView(many,{name:'V3'}).replaced,true,'replacing still works at the limit');
eq(W.saveView([],{name:'x',mode:'weird'}).views[0].mode,'list','unknown mode falls back to list');
eq(W.removeView(many,many[0].id).length,11);eq(W.removeView(many,'nope').length,12);
/* loading from storage */
eq(W.normalizeViews('junk'),[]);eq(W.normalizeViews([{id:'a',name:'A',mode:'list'},{id:'b',name:'a',mode:'list'},{id:'c',name:'',mode:'list'},{id:'d',name:'D',mode:'nope'},null,{name:'no id',mode:'list'}]).map(v=>v.id),['a'],'duplicates, blanks, bad modes and non-objects are dropped');
eq(W.normalizeViews(Array.from({length:30},(_,i)=>({id:'i'+i,name:'n'+i,mode:'list'}))).length,12);
eq(W.normalizeViews([{id:'a',name:'A',mode:'list'}])[0],{id:'a',name:'A',mode:'list',space:'all',status:'all',search:''},'missing fields get defaults');
/* applying and describing */
const spaces=[{id:'s1',name:'Career'}];
eq(W.applyView({mode:'board',space:'s1',status:'done',search:'cv'},spaces),{workView:'board',filterSpace:'s1',filterStatus:'done',workSearch:'cv',warning:''});
{const a=W.applyView({mode:'list',space:'deleted',status:'all',search:''},spaces);eq(a.filterSpace,'all');assert.match(a.warning,/no longer exists/);n++}
eq(W.describeView({mode:'board',space:'s1',status:'in_progress',search:'memo'},{spaces,statusName:s=>'In Progress'}),'Career · In Progress · “memo” · board');
eq(W.describeView({mode:'list',space:'all',status:'all',search:''},{spaces}),'All tasks');eq(W.describeView({mode:'list',space:'gone',status:'all',search:''},{spaces}),'Space removed');
/* bulk planning */
const tasks=[{id:'a',title:'A',status:'todo',priority:'normal',due_date:null,space_id:null},{id:'b',title:'B',status:'done',priority:'high',due_date:'2026-10-30',space_id:'s1'},{id:'c',title:'C',status:'todo',priority:'normal',due_date:null,space_id:null}];
const ctx={statuses:['todo','done'],priorities:['low','normal','high'],spaces};
let p=W.planBulk(tasks,['a','b','c'],{status:'done'},ctx);
eq(p.items.map(i=>i.id),['a','c'],'a task that already has the value is skipped');eq(p.skipped,1);eq(p.items[0],{id:'a',title:'A',patch:{status:'done'},prev:{status:'todo'}});
p=W.planBulk(tasks,['b'],{due_date:null},ctx);eq(p.items[0].patch,{due_date:null});eq(p.items[0].prev,{due_date:'2026-10-30'},'clearing a date is a change');
p=W.planBulk(tasks,['a','c'],{space_id:'s1',priority:'low'},ctx);eq(p.items.length,2);eq(p.items[0].patch,{priority:'low',space_id:'s1'});
eq(W.planBulk(tasks,['a'],{status:'bogus'},ctx).error,'Unknown status.');eq(W.planBulk(tasks,['a'],{priority:'urgent'},ctx).error,'Unknown priority.');
eq(W.planBulk(tasks,['a'],{due_date:'tomorrow'},ctx).error,'Use a valid date.');eq(W.planBulk(tasks,['a'],{space_id:'nope'},ctx).error,'Unknown Space.');eq(W.planBulk(tasks,['a'],{},ctx).error,'Nothing to change.');
eq(W.planBulk(tasks,['zzz'],{status:'done'},ctx).items,[],'unknown ids change nothing');eq(W.planBulk(tasks,[],{status:'done'},ctx).items,[]);
/* partial failure is reported exactly, and undo only covers what was saved */
const items=W.planBulk(tasks,['a','c'],{status:'done'},ctx).items;
const s=W.summarize(items,[{status:'fulfilled'},{status:'rejected',reason:new Error('503')}]);
eq(s.text,'1 task updated, 1 failed: C');eq(s.ok.map(i=>i.id),['a']);eq(s.failed,[{id:'c',title:'C',message:'503'}]);
eq(W.undoItems(s.ok),[{id:'a',patch:{status:'todo'}}]);
eq(W.summarize(items,[{status:'fulfilled'},{status:'fulfilled'}],'moved').text,'2 tasks moved');
{const many=Array.from({length:5},(_,i)=>({id:'t'+i,title:'T'+i,patch:{},prev:{}}));eq(W.summarize(many,many.map(()=>({status:'rejected',reason:'x'}))).text,'0 tasks updated, 5 failed: T0, T1 and 3 more')}
console.log('PASS Work tools: '+n+' checks (view names, limits, replace, stale Space, bulk plan, validation, partial failure, undo).');
