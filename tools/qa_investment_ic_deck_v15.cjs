/* Phase 1.5 IC Defense and editable PowerPoint structure, deterministic isolated QA. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const modules=['investment_intelligence_v1.js','investment_lab_v12.js','investment_model_v13.js','investment_memo_v14.js','investment_ic_deck_v15.js','investment_vault_v16.js','investment_vault_cloud_v16.js','investment_curriculum_v2.js'];
const memory=new Map(),listeners={},downloads=[],messages=[];
let renders=0;
const doc={addEventListener:(name,cb)=>{(listeners[name]??=[]).push(cb)},body:{appendChild(){}},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({remove(){},click(){downloads.push(this.download)},set href(h){},set download(n){this._name=n},get download(){return this._name}})};
class AssetURL extends URL{static createObjectURL(){return 'blob:pptx-unit'}static revokeObjectURL(){}}
const context=vm.createContext({console,Date,Math,Number,Blob,TextEncoder,URL:AssetURL,setTimeout:()=>{},document:doc,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},rvI:i=>'<svg>'+i+'</svg>',rvMoreV4:()=>'<header></header>',rvDashboardV4:()=>'<header></header>',toast:m=>messages.push(m),render:()=>{renders++}});
for(const m of modules)vm.runInContext(fs.readFileSync(path.join(__dirname,m),'utf8'),context,{filename:m});
const get=x=>vm.runInContext(x,context);
function click(action,val=''){
 const el={dataset:{ii15:action,value:val}};
 for(const fn of listeners.click)fn({target:{closest:q=>q==='[data-ii15]'?el:null},preventDefault(){}});
}
function write(name,key,value,selector){
 const el={dataset:{[name]:key},value};
 for(const fn of listeners.input)fn({target:{closest:q=>q===selector?el:null}});
}
assert.equal(get('II15_QUESTIONS.length'),6);
assert.match(get('ii15Defense()'),/Defend your thesis/);
assert.match(get('iiAcademy()'),/Defend & Present Your Thesis/);
assert.equal(get('ii15DefenseReport().complete'),0);
const original={id:'test-2010',title:'2010 MRR and customer facts',kind:'historical',source:'https://www.bvp.com/memos/shopify',asOf:'2010-10-12',detail:'MRR was US$438K at the historical cutoff',interpretation:'Growth requires retention diligence'};
const hindsight={id:'test-2018',title:'2018 outcomes',kind:'retrospective',source:'https://www.bvp.com/memos/shopify',asOf:'2018-06-01',detail:'Outcome not known in 2010'};
get('ii12State.notes.push(...'+JSON.stringify([original,hindsight])+')');
assert.equal(get("ii15CanCite(ii15Notes()[0])"),true);
assert.equal(get("ii15CanCite(ii15Notes()[1])"),false);
for(const q of ['valuation','retention','unit','competition','scenario','decision']){
 write('ii15Answer',q,'This historical investment decision must reconcile actual customer quality, the source memo, business risk, and valuation assumptions before capital is committed. Future outcomes should not be used for the as-of underwriting.','[data-ii15-answer]');
 write('ii15Followup',q,'I would demand the original cohort evidence and stress the deal economics before accepting that argument.','[data-ii15-followup]');
 get("ii15State.selectedEvidence["+JSON.stringify(q)+"]='test-2010'");
}
assert.equal(get('ii15DefenseReport().complete'),6);
get("ii15State.selectedEvidence.valuation='test-2018'");
assert.ok(get("ii15DefenseReport().results.find(x=>x.id==='valuation').issues.some(x=>x.includes('retrospective'))"));
get("ii15State.selectedEvidence.valuation='test-2010'");
click('screen','deck');
assert.equal(get('ii15State.deck.length'),6);
assert.equal(get('ii15State.deck[0].layout'),'statement');
assert.match(get('ii15Defense()'),/Slide Studio/);
assert.match(get('ii15Preview(ii15State.deck[0],ii15Theme())'),/INVESTMENT/);
click('add-slide');assert.equal(get('ii15State.deck.length'),7);
const added=get('ii15State.activeSlide');
write('ii15Edit','title','Independent 2010 Scenario', '[data-ii15-edit]');
assert.equal(get('ii15Active().title'),'Independent 2010 Scenario');
click('slide-up',added);assert.equal(get('ii15State.deck[5].id'),added);
click('theme','paper');assert.equal(get('ii15State.theme'),'paper');
click('slide-delete',added);assert.equal(get('ii15State.deck.length'),6);
assert.equal(get('ii15DeckAudit().slides.length'),6);
assert.ok(get("ii15Xml('<unsafe>&')").includes('&lt;unsafe&gt;&amp;'));
const packageFiles=get("ii15PPTXFiles(ii15State.deck,'paper')");
assert.equal(Object.keys(packageFiles).filter(n=>/^ppt\/slides\/slide\d+.xml$/.test(n)).length,6);
assert.match(packageFiles['ppt/slides/slide1.xml'],/Editable Text/);
assert.match(packageFiles['ppt/presentation.xml'],/screen16x9/);
assert.match(packageFiles['ppt/_rels/presentation.xml.rels'],/slide6.xml/);
assert.ok(!packageFiles['ppt/slides/slide1.xml'].includes('2018 outcomes'));
const b=get("ii15Zip(ii15PPTXFiles(ii15State.deck,'navy'))");
assert.equal(b.type,'application/vnd.openxmlformats-officedocument.presentationml.presentation');
assert.ok(b.size>5000);
click('export-json');click('export-pptx');
assert.ok(downloads.includes('SELF_Shopify_2010_Deck_Source.json'));
assert.ok(downloads.includes('SELF_Shopify_2010_Editable_IC_Deck.pptx'));
assert.ok(memory.has('self.investment.icdeck.v15'));
assert.ok(renders>3);
console.log('PASS Phase 1.5 IC/Deck unit: six historical defenses, hindsight guard, deck reorder/edit/theme/source, editable PPTX OPC XML, ZIP serialization and local storage');
