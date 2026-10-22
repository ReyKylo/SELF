'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const teaching=JSON.parse(fs.readFileSync(path.join(root,'content/career-teaching.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/career-learning.json'),'utf8'));
assert.equal(teaching.version,1);assert.equal(teaching.mode,'GUIDED_PRACTICE_ONLY');
assert.equal(teaching.lessons.length,18);
const counts={PE:0,VC:0,Consulting:0};const ids=new Set();
for(const l of teaching.lessons){
 assert(!ids.has(l.id),'duplicate lesson id');ids.add(l.id);counts[l.track]++;
 assert(catalog.panels.some(x=>x.id===l.panel_id&&x.track===l.track),'same-track expert evidence linked');
 assert(catalog.videos.some(x=>x.id===l.video_id&&x.track===l.track),'same-track video linked');
 const loc=l.track==='Consulting'?'consulting':l.track.toLowerCase();
 const m=JSON.parse(fs.readFileSync(path.join(root,'content/career-cases',loc,'manifest.json'),'utf8'));
 assert.equal(l.case_id,m.id,'case is an actual merged Phase2 manifest');
 for(const p of ['analogy','formal_term','definition','analogy_limit','worked_label','worked_equation','worked_result','case_exhibit','practice','build_output','director_challenge','recall','source_notice']){
  assert(l[p],l.id+' missing '+p);
 }
 assert(l.competencies.every(x=>m.competency_ids.includes(x)),'known competency ids');
 assert(/simulated|fiktif/i.test(l.source_notice),'must differentiate simulated case from real expert');
 assert(Number.isFinite(l.practice.expected));
 assert(Number.isFinite(l.practice.tolerance)&&l.practice.tolerance>=0);
 assert(!/expert certified|recruiter-approved|actual deal verified/i.test(l.source_notice));
}
assert.deepEqual(counts,{PE:6,VC:6,Consulting:6});
const expected={
 'PE-L01':110-73,
 'PE-L02':(260-80+13.54+80+5)-130-(13.54-12),
 'VC-L01':270000*12,
 'VC-L02':(80000-4000-2000+9000)/80000*100,
 'CO-L01':7000-(-1400),
 'CO-L02':100*1.4*0.8,
 'PE-L03':250-80+13.54,
 'PE-L04':13/12.5,
 'PE-L05':(Math.pow(2,1/5)-1)*100,
 'PE-L06':300.536-272.566,
 'VC-L03':1200/(200*.75),
 'VC-L04':900000/300000,
 'VC-L05':3/(16+4)*100,
 'VC-L06':5000*.04,
 'CO-L03':10000-7000-2000,
 'CO-L04':2000*.5*.3,
 'CO-L05':900/600*12,
 'CO-L06':7-3-4
};
for(const l of teaching.lessons)assert(Math.abs(l.practice.expected-expected[l.id])<=l.practice.tolerance,l.id+' guided math disagrees with independent answer');
const aruna=fs.readFileSync(path.join(root,'content/career-cases/pe/exhibits/exhibit-01-historical.csv'),'utf8');
assert(aruna.includes('2025,345,252,54,39')&&aruna.includes('110,37,-9.50'),'PE guided numbers from original case');
const vc=fs.readFileSync(path.join(root,'content/career-cases/vc/exhibits/monthly-traction.csv'),'utf8');
assert(vc.includes('2026-09,142,23,864,295170,3542040'),'VC guided ARR from original case');
const c=fs.readFileSync(path.join(root,'content/career-cases/consulting/exhibits/01-historical.csv'),'utf8');
assert(c.includes('2025,actual,77000,50300,19700,7000')&&c.includes('2026,annualized_run_rate_as_of_2026-10-01,75400,56200,20600,-1400'),'Consulting guided profits consistent');
const js=fs.readFileSync(path.join(root,'career-teaching.js'),'utf8');
const host={render(){},state:()=>({user:{id:'u1'}})};
const ctx={window:{},console,URL,Promise,Number,document:{querySelector:()=>({value:'37'})},fetch:async()=>({ok:true,json:async()=>structuredClone(teaching)})};
vm.createContext(ctx);vm.runInContext(js,ctx);
const mod=ctx.window.SELFCareerTeaching;mod.init(host);mod.reset('u1');
(async()=>{
 assert(mod.render(catalog).includes('Guided Masterclass'));
 await new Promise(r=>setTimeout(r,0));
 let html=mod.render(catalog);
 assert(html.includes('PERUMPAMAAN')&&html.includes('YES, INI NAMANYA')&&html.includes('BATAS PERUMPAMAAN'));
 assert(html.includes('PE02')===false || html.includes('ORIGINAL EXPERT REFERENCE'));
 assert(html.includes('case ini')===false||html.includes('SIMULATED'));
 function click(action,id){
  return mod.action({target:{closest:sel=>sel==='[data-teaching-action]'?{dataset:{teachingAction:action,id}}:null},preventDefault(){},stopPropagation(){}});
 }
 assert(click('check'));assert.equal(mod.state.check,'right');
 assert(mod.render(catalog).includes('Benar untuk hitungan latihan ini'));
 ctx.document.querySelector=()=>({value:'999'});
 click('check');assert.equal(mod.state.check,'wrong');
 click('hint');assert.equal(mod.state.hints,1);
 click('select','VC-L02');assert.equal(mod.state.selected,'VC-L02');assert.equal(mod.state.check,null);
 mod.fromTrack('Consulting');assert.equal(mod.state.selected,'CO-L01');
 mod.reset('u2');assert.equal(mod.state.answer,'');assert.equal(mod.state.check,null);
 const builder=fs.readFileSync(path.join(root,'tools/build_cloudflare.py'),'utf8');
 assert(builder.includes('career-teaching.js')&&builder.includes('content/career-teaching.json'));
 assert(!builder.includes('"tests/cases/')&&!builder.includes('"content/career-cases/'),'never ship sealed tests with guided source');
 console.log('PASS Phase3 Guided Masterclass: 18 lessons, original PE/VC/Consulting facts, 18 independent numeric checks, video/evidence mapping, retry/hint/check and account state reset');
})().catch(e=>{console.error(e);process.exitCode=1});