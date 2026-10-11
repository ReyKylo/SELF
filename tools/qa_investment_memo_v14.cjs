/* Phase 1.4 independent memo editor & historical source-integrity regression checks. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modules=['investment_intelligence_v1.js','investment_lab_v12.js','investment_model_v13.js','investment_memo_v14.js'].map(x=>fs.readFileSync(path.join(__dirname,x),'utf8'));
const listeners={},store=new Map(),downloads=[],messages=[];let renders=0;
const document={addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,body:{appendChild(){}},createElement:()=>({remove(){},click(){downloads.push(this.download)},set href(v){},set download(v){this._name=v},get download(){return this._name}})};
class BlobURL extends URL{static createObjectURL(){return 'blob:unit'}static revokeObjectURL(){}}
const ctx=vm.createContext({document,console,URL:BlobURL,Blob,Date,Math,Number,setTimeout(){},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},rvI:k=>'<svg>'+k+'</svg>',rvDashboardV4:()=>'<header></header>',rvMoreV4:()=>'<header></header>',toast:x=>messages.push(x),render:()=>renders++});
modules.forEach((s,i)=>vm.runInContext(s,ctx,{filename:i+'.js'}));
const ev=x=>vm.runInContext(x,ctx);
function click(a,value=''){let el={dataset:{ii14:a,value}};for(const f of listeners.click)f({target:{closest:sel=>sel==='[data-ii14]'?el:null},preventDefault(){}})}
function fill(field,value){let el={dataset:{ii14Draft:field},value};for(const f of listeners.input)f({target:{closest:sel=>sel==='[data-ii14-draft]'?el:null}})}
function changeFlag(key,checked){let el={dataset:{ii14Flag:key},checked};for(const f of listeners.change)f({target:{closest:sel=>sel==='[data-ii14-flag]'?el:null}})}
assert.match(ev('ii14Memo()'),/Investment Memo/);
assert.match(ev('iiAcademy()'),/04. Draft Your Investment Memo/);
assert.equal(ev('ii14Scoring().critical')>0,true,'Missing historical flags must trigger critical warning');
assert.equal(ev('ii14Scoring().action')>0,true,'Blank memo must trigger completeness issues');
const notes=[
 {id:'original-mrr',title:'Historical growth & retention',kind:'historical',source:'https://www.bvp.com/memos/shopify',asOf:'2010-10-12',detail:'MRR and merchant count as reported in original investment memo.',interpretation:'Growth alone needs churn checks.'},
 {id:'future',title:'Later Shopify outcome',kind:'retrospective',source:'https://www.bvp.com/memos/shopify',asOf:'2018-12-01',detail:'Future perspective unavailable in 2010.',interpretation:'Do not use as historical.'},
 {id:'analyst',title:'My subscription scenario',kind:'assumption',source:'https://www.bvp.com/memos/shopify',asOf:'2010-10-12',detail:'User-created twelve-month model, NOT actual Shopify numbers.',interpretation:'Stress test merchant economics.'}
];
ev('ii12State.notes.push(...'+JSON.stringify(notes)+')');
click('toggle-ref','summary|future');
assert.ok(ev('ii14Scoring().issues.some(x=>x.kind==="historical"&&x.text.includes("post-2010"))'));
click('toggle-ref','summary|future'); // remove
for(const section of ['summary','business','traction','model','risks','decision']){
 const text='This is an independently written analysis of Shopify as at the October 2010 decision date. We consider merchant adoption, customer acquisition costs, churn risk, the emerging ecommerce opportunity, the valuation conditions and the diligence needed before reaching a defensible investment decision.';
 fill(section,text);
 click('toggle-ref',section+'|original-mrr');
}
assert.equal(ev('ii14DraftWordCount()')>200,true);
for(const k of ['terms','mrr','hindsight'])changeFlag(k,true);
ev("ii13SaveSnapshot()");
assert.equal(ev('ii14Outdated()'),false);
let issues=ev('ii14Issues().filter(x=>x.severity!=="note").length');
assert.equal(issues,0,'Complete memo with sources, reconciliations and model should clear deterministic required flags');
ev("ii13State.adds=1100");
assert.equal(ev('ii14Outdated()'),true);
assert.ok(ev('ii14Issues().some(x=>x.kind==="model"&&x.severity==="critical")'));
ev("ii13State.adds=850");
assert.equal(ev('ii14Outdated()'),false);
click('mode','review');assert.match(ev('ii14Memo()'),/Completeness checks cleared/);
click('mode','story');assert.match(ev('ii14Memo()'),/Deck Storyboard/); // storyboard should be accessible
assert.equal(ev('ii14DeckItems().length'),4);
click('export-story');click('export-memo');click('export-html');
for(const name of ['SELF_Shopify_2010_Slide_Storyboard.md','SELF_Shopify_2010_Investment_Memo_Draft.md','SELF_Shopify_2010_Printable_Memo.html'])assert.ok(downloads.includes(name),name);
assert.match(ev('ii14MemoMarkdown()'),/Bessemer/);
assert.match(ev('ii14PrintableHTML()'),/<!DOCTYPE html>/);
assert.ok(store.has('self.investment.memo.v14'));
assert.ok(renders>=10);
assert.match(ev('ii14Memo()'),/nor evidence of deal participation/i);
console.log('PASS Phase 1.4: memo sections, original source citations, hindsight guard, frozen model staleness, deterministic review, storyboard, HTML+Markdown exports and storage');
