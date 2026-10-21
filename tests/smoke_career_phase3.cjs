/* SELF Career 3 — source-backed Radar, non-automation, owner-safe conversions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'career-phase3.js'),'utf8');
const shell=fs.readFileSync(path.join(root,'app.js'),'utf8');
const career=fs.readFileSync(path.join(root,'career.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20261021170000_self_career_phase3_opportunities.sql'),'utf8');
assert(source.includes('https://remotive.com/api/remote-jobs?limit=250'),'public attributed source');
assert(source.includes('credentials:\'omit\''),'public feed without account credentials');
assert(source.includes('if(record.count>=4)'),'manual source rate-limit guard');
assert(source.includes('MAX=15')&&source.includes('MIN=75'),'approved opportunity thresholds');
assert(source.includes('No LLM is connected'),'assist must not impersonate a live model');
assert(source.includes('06:00 WIB · inactive'),'no automation activation');
assert(!source.includes('setInterval('),'no hidden recurring scan');
assert(html.includes('career-phase3.js')&&html.includes('career-phase3.css'),'worker loads radar assets');
assert(shell.includes('[data-career],[data-career2],[data-career3]'),'radar events use SELF shell');
assert(shell.includes("form.id==='career3-form'"),'Radar forms routed to existing UI');
assert(career.includes('window.SELFCareerPhase3?.load?.(ui.owner)'),'Career lifecycle loads Radar');
assert(migration.includes('ENABLE ROW LEVEL SECURITY')&&migration.includes('UNIQUE(user_id,job_url)'),'owner privacy and source deduplication');
const storage=new Map();
const localStorage={getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}};
const records={career_opportunities:[],career_companies:[],career_applications:[]};
let seq=0,failNext=null,feedCalls=0,renderCount=0,notice=[],clipboard=[],opened=0,confirmCalls=0;
const user={id:'owner1'};
const company={id:'company1',user_id:user.id,name:'Example Capital',industry:'Investment'};
records.career_companies.push(company);
const fakeCareer={ui:{companies:[company],applications:[],people:[]}};
const postingDate=new Date().toISOString(),jobs=[];
for(let i=0;i<28;i++)jobs.push({id:i+1,title:'Investment Analyst '+(i+1),company_name:'Firm '+(i+1),
 candidate_required_location:i%2?'Worldwide':'Jakarta, Indonesia',
 category:'Finance',description:'Investment research and valuations',
 url:'https://remotive.com/remote-jobs/finance/role-'+(i+1),publication_date:postingDate});
jobs.push({id:100,title:'Software Developer',company_name:'Other',candidate_required_location:'Jakarta, Indonesia',
 url:'https://remotive.com/remote-jobs/other/no-role',publication_date:postingDate});
jobs.push({id:101,title:'Investment Analyst',company_name:'US Only',candidate_required_location:'USA only',
 url:'https://remotive.com/remote-jobs/finance/us-only',publication_date:postingDate});
jobs.push({id:102,title:'Investment Analyst',company_name:'Unknown Place',candidate_required_location:'Europe only',
 url:'https://remotive.com/remote-jobs/finance/eu-only',publication_date:postingDate});
const mockFetch=async (url,options)=>{
 assert.equal(url,'https://remotive.com/api/remote-jobs?limit=250');
 assert.equal(options.credentials,'omit');
 feedCalls++;
 if(failNext==='feed'){failNext=null;throw Error('Provider unreachable')}
 return {ok:true,status:200,json:async()=>({jobs})};
};
class FormDataMock{
 constructor(form){this.values=form.fields||{}}
 entries(){return Object.entries(this.values)[Symbol.iterator]()}
}
const input={value:''},err={textContent:''};
const doc={querySelector(){return null},getElementById(id){return id==='career3-prompt'?input:null}};
const ctx={window:{},navigator:{clipboard:{async writeText(v){clipboard.push(v)}}},
 document:doc,fetch:mockFetch,URL,Date,localStorage,FormData:FormDataMock,
 confirm(){confirmCalls++;return true},console,setTimeout,clearTimeout};
vm.createContext(ctx);vm.runInContext(source,ctx);
const radar=ctx.window.SELFCareerPhase3;
const host={
 state:()=>({user}),render(){renderCount++},notify(v,bad=false){notice.push({v,bad})},
 async request(url){
  const table=new URL('https://self.local'+url).pathname.split('/').at(-1);
  if(!records[table])throw Error('Unknown '+table);
  let rows=records[table].filter(x=>x.user_id===user.id);
  const filters=new URL('https://self.local'+url).searchParams;
  if(filters.has('source_url'))rows=rows.filter(x=>x.source_url===filters.get('source_url').replace(/^eq\./,''));
  return rows.map(x=>({...x}));
 },
 async insert(table,payload){
  if(failNext===table){failNext=null;throw Error('Network write failed')}
  if(!records[table])throw Error('No table '+table);
  if(table==='career_opportunities'&&records[table].some(x=>x.user_id===user.id&&x.job_url===payload.job_url))throw Error('Duplicate URL');
  const record={id:'id'+(++seq),user_id:user.id,...payload};
  records[table].push(record);return {...record};
 },
 async patch(table,id,payload){
  if(failNext===table){failNext=null;throw Error('Network patch failed')}
  const record=records[table].find(x=>x.id===id&&x.user_id===user.id);
  if(!record)throw Error('Forbidden');
  Object.assign(record,payload);return {...record};
 },
 async reloadCareer(){radar.ui.items=records.career_opportunities.filter(x=>x.user_id===user.id).map(x=>({...x}))}
};
radar.init({host,career:fakeCareer});
const button=async (action,fields={})=>{
 const b={dataset:{career3:action,...fields}};
 const target={closest(q){return q==='[data-career3]'?b:null}};
 return radar.action({target,preventDefault(){},stopPropagation(){}});
};
async function main(){
 radar.reset(user.id);await radar.load(user.id);
 assert.equal(radar.ui.ready,true);
 assert.match(radar.render(),/No discoveries yet/);
 assert.match(radar.render(),/No schedule running/);
 const strong=radar.scoreOpportunity({role_title:'Investment Analyst',location_label:'Jakarta, Indonesia',publication_date:postingDate});
 assert(strong.score>=75);
 assert(radar.scoreOpportunity({role_title:'Investment Analyst',location_label:'USA only'})===null,'reject US-only');
 assert(radar.scoreOpportunity({role_title:'Backend Engineer',location_label:'Jakarta, Indonesia'})===null,'irrelevant title rejected');
 await button('scan');
 assert.equal(feedCalls,1);
 assert.equal(radar.ui.results.length,15,'max 15 discoveries');
 assert(radar.ui.results.every(x=>x.relevance_score>=75),'minimum relevance');
 assert(radar.ui.results.every(x=>x.job_url.startsWith('https://remotive.com')),'no invented links');
 const first=radar.ui.results[0];
 assert.match(radar.render(),/Remotive public job feed/);
 await button('save',{url:first.job_url});
 assert.equal(records.career_opportunities.length,1);
 assert.equal(records.career_opportunities[0].status,'saved');
 await button('save',{url:first.job_url});
 assert.equal(records.career_opportunities.length,1,'no duplicates saved');
 await button('assist',{url:first.job_url});
 assert.match(radar.render(),/not<\/b> an AI-verified assessment/);
 input.value='Research this role with sources';
 await button('copy-prompt');assert.equal(clipboard[0],input.value);
 await button('close-modal');
 await button('convert',{url:first.job_url});
 assert.match(radar.render(),/No external application is submitted/);
 await button('confirm-convert',{url:first.job_url});
 assert.equal(records.career_applications.length,1);
 assert.equal(records.career_applications[0].hiring_stage,'wishlist');
 assert.equal(records.career_opportunities[0].status,'converted');
 assert.equal(records.career_opportunities[0].application_id,records.career_applications[0].id);
 await button('confirm-convert',{url:first.job_url});
 assert.equal(records.career_applications.length,1,'convert again must not duplicate');
 const second=radar.ui.results[1];
 await button('dismiss',{url:second.job_url});
 assert(records.career_opportunities.some(x=>x.job_url===second.job_url&&x.status==='dismissed'));
 await button('scan');assert.equal(feedCalls,1,'cooldown prevents repeated request');
 assert.match(radar.ui.error,/wait 15 minutes/);
 await button('manual');
 const before=records.career_opportunities.length;
 const f={id:'career3-form',fields:{role_title:'Fintech Strategy Analyst',company_name:'Local Employer',
 location_label:'Jakarta, Indonesia',job_url:'https://example.org/open-role',cluster:'fintech'},
 querySelector(){return err}};
 await radar.submit({target:f,preventDefault(){},stopPropagation(){}});
 assert.equal(records.career_opportunities.length,before+1);
 assert.equal(records.career_opportunities.at(-1).provider,'Manual');
 assert.equal(records.career_opportunities.at(-1).status,'saved');
 await button('manual');
 const broken={id:'career3-form',fields:{role_title:'Bad URL',company_name:'Firm',location_label:'Jakarta',
 job_url:'javascript:alert(1)',cluster:'strategy'},querySelector(){return err}};
 await radar.submit({target:broken,preventDefault(){},stopPropagation(){}});
 assert.equal(records.career_opportunities.length,before+1,'unsafe URL never persisted');
 assert.match(err.textContent,/valid HTTPS/,'form warns without discarding inputs');
 user.id='owner2';radar.reset(user.id);await radar.load(user.id);
 assert.equal(radar.ui.items.length,0,'no previous owner cached results');
 assert.equal(radar.ui.results.length,0);
 assert.equal(radar.render().includes('Local Employer'),false);
 assert.equal(records.career_applications.length,1,'old account data untouched');
 assert(confirmCalls>=1);
 console.log('PASS Career Phase 3: real public source, strict scoring, max-15, Save/Dismiss/Restore, prompt copy, idempotent opt-in Application, cooldown, manual HTTPS, owner cache isolation.');
}
main().catch(err=>{console.error(err);process.exitCode=1});
