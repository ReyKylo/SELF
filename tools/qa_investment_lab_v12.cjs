/* Phase 1.2 isolated functionality tests; no user data, no network. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source1=fs.readFileSync(path.join(__dirname,'investment_intelligence_v1.js'),'utf8');
const source12=fs.readFileSync(path.join(__dirname,'investment_lab_v12.js'),'utf8');
const store=new Map(),listeners={},toasts=[];let renderCount=0,downloadName='';
const document={
 addEventListener:(type,handler)=>{(listeners[type]??=[]).push(handler)},
 querySelector:()=>null,querySelectorAll:()=>[],
 getElementById:()=>({scrollIntoView:()=>{}}),
 createElement:()=>({click(){},remove(){},set download(x){downloadName=x},get download(){return downloadName},set href(x){}}),
 body:{appendChild(){}}
};
class FakeURL extends URL{static createObjectURL(){return 'blob:mock'}static revokeObjectURL(){}}
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const ctx={document,localStorage:storage,console,URL:FakeURL,Blob,setTimeout:()=>{},Date,Math,
 rvI:x=>'<svg>'+x+'</svg>',rvDashboardV4:()=>'<section><header>Dashboard</header></section>',
 rvMoreV4:()=>'<section><header>More</header></section>',render:()=>{renderCount++},
 toast:x=>toasts.push(x),window:{}};
const c=vm.createContext(ctx);
vm.runInContext(source1,c,{filename:'investment_intelligence_v1.js'});
vm.runInContext(source12,c,{filename:'investment_lab_v12.js'});
const run=x=>vm.runInContext(x,c);
function click12(action,val=''){
 const el={dataset:{ii12:action,val},getAttribute:()=>null};
 const target={closest:selector=>selector==='[data-ii12]'?el:null};
 for(const f of listeners.click)f({target,preventDefault(){}});
}
function input12(field,val,evtType='input'){
 const el={dataset:{ii12Field:field},value:val};
 for(const f of listeners[evtType]??[])f({target:{closest:()=>el}});
}
assert.match(run('iiAcademy()'),/02. Growth vs. Quality/);
assert.match(run("ii12Growth()"),/Revenue growth itu bagus/);
click12('simpler');assert.match(run('ii12Growth()'),/Isi ember/);
click12('mark-brief');assert.equal(run('ii12State.briefRead'),true);
click12('growth-step','video');assert.match(run('ii12Growth()'),/Geoff Ralston/);
click12('mark-video');assert.equal(run('ii12State.videoReviewed'),true);
click12('growth-step','exercise');click12('exercise-choice','A');click12('exercise-check');
assert.equal(run('ii12State.exerciseCorrect'),false);
click12('exercise-choice','B');click12('exercise-check');assert.equal(run('ii12State.exerciseCorrect'),true);
click12('growth-step','write');
input12('teachback','Growing subscriber acquisition can mask customers who cancel frequently, so we must evaluate cohort retention.');
click12('save-teachback');assert.equal(run('ii12Mark()'),4);
assert.equal(run('II12_STARTER.length'),6);
assert.match(run('ii12Notebook()'),/Verified starter evidence/);
assert.match(run('ii12Notebook()'),/MRR growth percentage: reconcile it/);
click12('import-source','mrr');
click12('import-source','mrr');assert.equal(run('ii12State.notes.length'),1);
assert.match(run('ii12Notebook()'),/Monthly recurring revenue/);
input12('draftTitle','Merchant ecosystem');
input12('draftObservation','Two thirds of customers use a third party app.');
input12('draftInterpretation','This may indicate product stickiness, but it is not a substitute for cohort retention.');
input12('draftUrl','https://www.bvp.com/memos/shopify');
input12('draftDate','2010-10-12','change');
input12('draftKind','historical','change');
click12('save-note');
assert.equal(run('ii12State.notes.length'),2);
assert.ok(run('ii12State.notes[1].detail').includes('third party'));
assert.equal(run("ii12SafeLink('javascript:alert(1)')"),'');
input12('slideClaim','Shopify has strong recurring revenue growth but requires further diligence on churn.');
input12('slideImplication','We should stress test valuation against merchant retention and contribution margin assumptions.');
click12('choose-source','source-mrr');
click12('save-slide');
assert.match(run('ii12Notebook()'),/Shopify has strong recurring/);
assert.ok(run('ii12State.slideSourceId')==='source-mrr');
click12('export-notebook');assert.equal(downloadName,'SELF_Shopify_2010_Research_Pack.md');
assert.ok(store.has('self.investment.lab.v12'));
click12('remove-note','source-mrr');assert.equal(run('ii12State.slideSourceId'),'');
input12('draftTitle','2019 retrospective metric');
input12('draftObservation','This observation comes from a later retrospective publication.');
input12('draftInterpretation','Not a valid source for a 2010 as-of investment decision.');
input12('draftUrl','https://www.bvp.com/memos/shopify');
input12('draftDate','2019-02-01','change');
input12('draftKind','historical','change');
click12('save-note');assert.equal(run('ii12State.notes.length'),1);
assert.ok(toasts.some(x=>x.includes('bukan historical as-of')));
input12('draftKind','retrospective','change');
click12('save-note');assert.equal(run('ii12State.notes.length'),2);
const lateId=run('ii12State.notes[1].id');
click12('choose-source',lateId);
click12('save-slide');assert.ok(toasts.some(x=>x.includes('Post-2010 evidence')));
assert.ok(renderCount>=15);
assert.ok(toasts.some(x=>x.includes('unverified')));
console.log('PASS Phase 1.2: learning journey, staged comprehension, timestamped official reference, verified evidence, custom note, safe URL, slide seed, markdown export, persistence.');
