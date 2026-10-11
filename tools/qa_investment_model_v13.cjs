/* SELF Investment Phase 1.3 model: deterministic finance mathematics, persistence, exports, research provenance. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const inputs=['investment_intelligence_v1.js','investment_lab_v12.js','investment_model_v13.js','investment_memo_v14.js','investment_ic_deck_v15.js','investment_vault_v16.js','investment_vault_cloud_v16.js','investment_curriculum_v2.js'].map(n=>fs.readFileSync(path.join(root,n),'utf8'));
const store=new Map(),listeners={},notifications=[],downloads=[];let renders=0;
const document={
 addEventListener:(kind,fn)=>{(listeners[kind]??=[]).push(fn)},
 getElementById:()=>null,
 querySelector:()=>null,querySelectorAll:()=>[],
 createElement:()=>({click(){downloads.push(this.download)},remove(){},set href(x){},set download(x){this._download=x},get download(){return this._download}}),
 body:{appendChild(){}}
};
class SafeURL extends URL{static createObjectURL(){return 'blob:financial-test'}static revokeObjectURL(){}}
const context=vm.createContext({console,Math,Date,Number,Blob,URL:SafeURL,setTimeout:()=>{},document,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 rvI:n=>'<svg>'+n+'</svg>',
 rvDashboardV4:()=>'<section><header>Dashboard</header></section>',
 rvMoreV4:()=>'<section><header>More</header></section>',
 toast:x=>notifications.push(x),render:()=>{renders++}
});
inputs.forEach((s,i)=>vm.runInContext(s,context,{filename:['v1.js','v12.js','v13.js','v14.js','v15.js','v16.js','v16cloud.js','v2.js'][i]}));
const get=code=>vm.runInContext(code,context);
const close=(got,want)=>assert.ok(Math.abs(got-want)<.00001,got+' expected '+want);
const base=get("ii13Compute(ii13Params('base'))");
close(base.rows[0].customers,10450);
close(base.rows[0].mrr,10450*43.8);
close(base.rows[0].acquisitionCost,850*200);
close(base.payback,200/(43.8*.75));
assert.equal(base.rows.length,12);
close(base.arrRunRate,base.ending.mrr*12);
close(base.yearRevenue,base.rows.reduce((a,x)=>a+x.mrr,0));
close(base.yearNetContribution,base.yearGrossProfit-base.yearAcquisition);
assert.equal(get('II13_HIST.mrr'),438000);
const down=get("ii13Compute(ii13Params('downside'))");
const up=get("ii13Compute(ii13Params('upside'))");
assert.ok(down.ending.mrr<base.ending.mrr);
assert.ok(up.ending.mrr>base.ending.mrr);
assert.ok(down.ending.customers<up.ending.customers);
assert.ok(get('ii13Compute({adds:0,churn:20,arpu:5,margin:30,cac:1000}).ending.customers')>0);
assert.match(get('ii13View()'),/everything after the anchor is your scenario/i);
assert.match(get('ii13View()'),/CASE 001/);
assert.match(get("ii13Sensitivity()"),/Churn × new monthly customers/);
assert.match(get('ii13Challenge()'),/Defend your numbers/);
assert.match(get('iiAcademy()'),/03. Build Shopify/);
function click(action,value=''){
 const el={dataset:{ii13:action,value}};
 for(const fn of listeners.click)fn({target:{closest:selector=>selector==='[data-ii13]'?el:null},preventDefault(){}});
}
function input(field,value){
 const el={dataset:{ii13Input:field},value:String(value)};
 for(const fn of listeners.input)fn({target:{closest:selector=>selector==='[data-ii13-input]'?el:null}});
}
click('tab','challenge');click('quiz','A');click('quiz-check');
assert.equal(get('ii13State.quizCorrect'),false);
click('quiz','B');click('quiz-check');
assert.equal(get('ii13State.quizCorrect'),true);
const narrative='The model assumes consistent acquisition with merchant churn, so I need to examine cohort retention before increasing paid acquisition budgets.';
const obj={value:narrative};
for(const fn of listeners.input)fn({target:{closest:selector=>selector==='[data-ii13-reasoning]'?obj:null}});
assert.equal(get('ii13State.reasoning'),narrative);
click('save-reasoning');click('tab','model');
click('scenario','downside');click('save-model');
assert.equal(get("ii13State.snapshot.scenario"),'downside');
assert.ok(store.has('self.investment.model.v13'));
click('export-csv');assert.ok(downloads.includes('SELF_Shopify_2010_Analyst_Scenario.csv'));
click('export-md');assert.ok(downloads.includes('SELF_Shopify_2010_Analyst_Model_Notes.md'));
click('promote-model');
assert.equal(get('ii12State.notes.length'),1);
assert.equal(get('ii12State.notes[0].kind'),'assumption');
assert.equal(get('ii12State.notes[0].source'),'https://www.bvp.com/memos/shopify');
assert.match(get('ii12State.notes[0].detail'),/USER-DEFINED SCENARIO/);
assert.match(get('ii12State.notes[0].detail'),/NOT in memo|None of these forecast outputs/);
assert.equal(get('iiState.view'),'notebook');
click('promote-model');assert.equal(get('ii12State.notes.length'),1);
assert.ok(notifications.some(x=>x.includes('Analyst-assumption note saved')));
assert.ok(renders>=8);
console.log('PASS Phase 1.3 finance unit tests: revenue/churn/CAC mathematics, scenarios, challenge, local snapshots, exports, source-safe promotion');
