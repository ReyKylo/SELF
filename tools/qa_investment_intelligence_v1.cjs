/* Isolated smoke tests: Investment Intelligence module.
 * Static logic verification only; browser/live Cloudflare QA is still required. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'investment_intelligence_v1.js'),'utf8');
const storage=new Map(),listeners={};
let renders=0,notifications=[];
const document={
 addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn)},
 querySelector:()=>null,
 querySelectorAll:()=>[],
 createElement:()=>({click(){},remove(){},set href(v){},set download(v){}}),
 body:{appendChild(){}}
};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const ctx={document,localStorage,console,rvI:name=>'<svg>'+name+'</svg>',
 rvDashboardV4:()=>'<section><header>Dashboard</header></section>',
 rvMoreV4:()=>'<section><header>More Hub</header></section>',
 render:()=>{renders++},toast:v=>notifications.push(v),
 window:{},setTimeout:()=>{},Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}}};
const c=vm.createContext(ctx);vm.runInContext(src,c,{filename:'investment_intelligence_v1.js'});
const call=expr=>vm.runInContext(expr,c);
const home=call('iiAcademy()');
assert.match(home,/Your Analyst Journey|Learn the thinking/);
assert.match(home,/How Investors Think/);
assert.match(home,/Shopify/);
assert.match(home,/0 dari 5 learning milestones/);
assert.match(call('iiMoreHub()'),/data-page="investment"/);
assert.match(call('iiDashboard()'),/data-page="investment"/);
function click(act,val='',selected=null){
 document.querySelector=sel=>sel.includes('iiRecallAnswer')&&selected?{value:selected}:null;
 const el={dataset:{ii:act,val}};
 for(const fn of listeners.click)fn({target:{closest:s=>s==='[data-ii]'?el:null},preventDefault(){}});
}
click('view','lesson');assert.match(call('iiAcademy()'),/How Investors Think/);
click('brief-done');assert.equal(call('iiState.briefDone'),true);
click('step','video');assert.match(call('iiAcademy()'),/Startup Investor School/);
click('video-done');assert.equal(call('iiState.videoReviewed'),true);
click('step','visual');assert.match(call('iiAcademy()'),/HYPOTHETICAL CUSTOMER GROWTH/);
click('visual-done');assert.equal(call('iiState.exploreDone'),true);
click('step','recall');click('quiz-choice','A');click('quiz');assert.equal(call('iiState.quizCorrect'),false);
click('quiz-choice','B');click('quiz');assert.equal(call('iiState.quizCorrect'),true);
click('step','apply');assert.match(call('iiAcademy()'),/Your investment thesis/);
const inputHandler=listeners.input[0];
inputHandler({target:{closest:s=>s==='[data-ii-field]'?{dataset:{iiField:'thesis'},value:'The company demonstrates strong organic demand, but we must check retention.'}:null,id:''}});
assert.equal(call('iiState.thesis').includes('organic demand'),true);
click('save-draft');assert.ok(storage.get('self.investment.academy.v1'));assert.ok(notifications.some(x=>x.includes('tersimpan')));
click('view','case');assert.match(call('iiAcademy()'),/YOUR WORKING THESIS/);
click('view','portfolio');assert.match(call('iiAcademy()'),/CASE DRAFT/);
assert.match(call('iiAcademy()'),/Research QA pending/);
assert.equal(call('iiCompleted()'),5);
assert.ok(renders>=8);
console.log('PASS Investment Intelligence V1: isolated Academy, lesson stages, historical source/video links, quiz, draft, browser persistence and portfolio state');
