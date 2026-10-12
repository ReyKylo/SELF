/* Phase 2 source-grounded VC curriculum contract, independent reasoning + historical cutoff. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const files=['investment_intelligence_v1.js','investment_lab_v12.js','investment_model_v13.js','investment_memo_v14.js','investment_ic_deck_v15.js','investment_vault_v16.js','investment_vault_cloud_v16.js','investment_curriculum_v2.js'];
const mem=new Map(),listeners={},events=[],ctx=vm.createContext({console,Date,Math,Number,Blob,URL,
 setTimeout(){},TextEncoder,window:{},location:{},document:{addEventListener:(kind,fn)=>{(listeners[kind]??=[]).push(fn)},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:{appendChild(){}},createElement(){return {click(){},remove(){}}}},localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)},rvI:i=>'<svg>'+i+'</svg>',rvDashboardV4:()=>'<header></header>',rvMoreV4:()=>'<header></header>',render:()=>events.push('render'),toast:m=>events.push(m)});
for(const f of files)vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),ctx,{filename:f});
const run=code=>vm.runInContext(code,ctx);
function click(action,val=''){
 const el={dataset:{ii2:action,val}};
 for(const fn of listeners.click)fn({target:{closest:q=>q==='[data-ii2]'?el:null},preventDefault(){}});
}
function fill(id,value){const el={dataset:{ii2Reflect:id},value};for(const fn of listeners.input)fn({target:{closest:()=>el}})}
assert.equal(run('II2_LESSONS.length'),9);
assert.match(run('ii2Page()'),/Venture Capital Academy/);
const ids=run('II2_LESSONS.map(x=>x.id)').join(',');
assert.equal(new Set(ids.split(',')).size,9);
for(const lesson of run('II2_LESSONS.map(x=>({id:x.id,brief:x.brief,url:x.url,video:x.video,choices:x.choices,right:x.right}))')){
 assert.ok(lesson.brief.length>=3,lesson.id);
 assert.ok(lesson.url.startsWith('https://'),lesson.id);
 assert.ok(lesson.video.startsWith('https://'),lesson.id);
 assert.equal(lesson.choices.length,3,lesson.id);
 assert.ok(Number.isInteger(lesson.right)&&lesson.right>=0&&lesson.right<3);
}
click('done-brief');click('done-source');assert.equal(run('ii2State.stage'),'practice');
click('choice','0');click('check');
assert.equal(run("ii2Entry('investor').quiz"),false);
click('choice','1');click('check');
assert.equal(run("ii2Entry('investor').quiz"),true);
click('stage','apply');
fill('investor','My independent analysis of the historical investment requires proof of merchant economics, price discipline, cohort retention, and willingness to reconsider if competition proves stronger.');
click('done-apply');click('promote');
assert.equal(run("ii2Entry('investor').apply"),true);
assert.equal(run('ii2State.savedInsights.investor'),true);
assert.equal(run('ii12State.notes[0].kind'),'assumption');
assert.equal(run('ii12State.notes[0].source'),'https://www.bvp.com/memos/shopify');
click('promote');assert.equal(run('ii12State.notes.length'),1);
click('lesson','safe');
assert.match(run('ii2Page()'),/MODERN FINANCING/);
run("ii2State.responses.safe={reflection:'Modern SAFE financing became available after Shopify 2010 and must not be used as evidence of its original priced equity round. This is a learning comparison only.'}");
click('promote');
const latest=run("ii12State.notes.find(n=>n.id==='curriculum-safe')");
assert.equal(latest.kind,'retrospective');
assert.equal(latest.asOf,'2026-10-11');
assert.equal(run("ii14ValidAsOf(ii12State.notes.find(n=>n.id==='curriculum-safe'))"),false);
assert.ok(mem.has('self.investment.curriculum.v2'));
assert.ok(run('ii2State.savedInsights.safe'));
assert.match(run('iiAcademy()'),/Phase 2: The Real Learning Track/);
console.log('PASS Phase 2: nine sourced lessons, independent quizzes, reflection, case handoff, modern SAFE hindsight guard');
