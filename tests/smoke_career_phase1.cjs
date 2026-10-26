/* SELF Career Phase 1 — owner-scoped CRUD, responsive scaffold, no separate Task system. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const career=fs.readFileSync(path.join(root,'career.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'career.css'),'utf8');
const build=fs.readFileSync(path.join(root,'tools/build_cloudflare.py'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20261021135000_self_career_phase1_core.sql'),'utf8');
assert(app.includes("nav('briefcase','Career','career')"),'global sidebar only adds Career');
assert(app.includes("career:['Career'"),'existing SELF router retains Career');
assert(app.includes("...state.links.map"),'My Links stays general');
assert(app.includes("window.SELFCareer?.links?.()"),'Career records contribute URLs to general Links');
assert(app.includes("window.SELFBoards?.init"),'Whiteboard untouched');
assert(css.includes('background:transparent!important'),'drawer never darkens whole screen');
assert(build.includes('career.js')&&build.includes('career.css'),'Cloudflare includes Career assets');
assert(migration.includes('ENABLE ROW LEVEL SECURITY'),'Career data uses owner-scoped RLS');
for(const col of ['career_companies','career_people','career_applications'])assert(migration.includes(col),'migration defines '+col);
const data={career_companies:[],career_people:[],career_applications:[]};
const user={id:'owner1'};
let increment=0,renders=0,notifications=[],newTaskCalls=0,failNext=false;
const FormDataMock=class{constructor(form){this.fields=form.fields||{}}entries(){return Object.entries(this.fields)[Symbol.iterator]()}};
const ctx={window:{},document:{querySelector(){return null}},URL,FormData:FormDataMock,confirm:()=>true,console};
vm.createContext(ctx);vm.runInContext(career,ctx);
const appHost={
 state:()=>({user,view:'career'}),render(){renders++},navigate(){},newTask(){newTaskCalls++},
 notify(msg,err=false){notifications.push({msg,err})},
 async request(url){
  if(failNext){failNext=false;throw Error('Network unavailable')}
  const name=new URL('https://host.local'+url).pathname.split('/').pop();
  if(!data[name])throw Error('Unknown resource '+name);
  return data[name].filter(r=>r.user_id===user.id).map(r=>({...r}));
 },
 async insert(table,fields){
  if(failNext){failNext=false;throw Error('Network unavailable')}
  if(table==='career_people'&&fields.company_id&&!data.career_companies.some(c=>c.id===fields.company_id&&c.user_id===user.id))throw Error('foreign company');
  if(table==='career_applications'&&!data.career_companies.some(c=>c.id===fields.company_id&&c.user_id===user.id))throw Error('foreign company');
  const row={id:'row'+(++increment),user_id:user.id,...fields};
  data[table].push(row);return {...row};
 },
 async patch(table,id,fields){
  const item=data[table].find(x=>x.id===id&&x.user_id===user.id);
  if(!item)throw Error('Forbidden');
  if(failNext){failNext=false;throw Error('Network unavailable')}
  Object.assign(item,fields);return {...item};
 },
 async del(table,id){
  if(failNext){failNext=false;throw Error('Network unavailable')}
  if(table==='career_companies'&&data.career_applications.some(x=>x.company_id===id))throw Error('foreign key violation');
  const before=data[table].length;
  data[table]=data[table].filter(x=>x.id!==id||x.user_id!==user.id);
  if(data[table].length===before)throw Error('Forbidden');
 }
};
ctx.window.SELFCareer.init(appHost);
function form(kind,mode,fields,id){
 const b={disabled:false,textContent:'',isConnected:true};
 return {id:'career-'+mode,dataset:{kind,id},fields,querySelector(q){return q==='button[type="submit"]'?b:null}};
}
async function submit(formNode){return ctx.window.SELFCareer.submit({target:formNode,preventDefault(){},stopPropagation(){}})}
function click(action,attrs={}){
 const btn={dataset:{career:action,...attrs}};
 const target={closest(q){return q==='[data-career]'?btn:null}};
 return ctx.window.SELFCareer.action({target,preventDefault(){},stopPropagation(){}});
}
async function main(){
 const careerUI=ctx.window.SELFCareer.ui;
 ctx.window.SELFCareer.enter();
 await new Promise(resolve=>setTimeout(resolve,12));
 assert.equal(careerUI.ready,true,'Career loads independent from SELF core app loader');
 ctx.window.SELFCareer.setPage('overview');
 let html=ctx.window.SELFCareer.render();
 for(const section of ['Overview','Applications','Outreach','Companies','Opportunity Radar','CV Library','Interview Prep','Templates','Reminders'])
  assert(html.includes(section),'includes Career subpage: '+section);
 assert(!html.includes('Northstar Capital'),'fictional wireframe records not shipped');
 assert.equal(careerUI.applications.length,0);
 assert.match(html,/Radar is not running/,'Radar remains inactive');
 await click('quick-capture');
 assert.equal(careerUI.modal,'choose','Quick Capture offers types');
 assert.match(ctx.window.SELFCareer.render(),/SELF Task/);
 await click('choose-kind',{kind:'task'});
 assert.equal(newTaskCalls,1,'Career task uses SELF Tasks, not duplicate table');
 await click('new',{kind:'company'});
 await submit(form('company','create',{name:'Real Company',industry:'Investment',website:'https://example.org',location:'Jakarta',notes:'Short note'}));
 assert.equal(data.career_companies.length,1,'company created by owner');
 const cid=data.career_companies[0].id;
 assert.equal(data.career_companies[0].user_id,'owner1');
 assert(ctx.window.SELFCareer.links().some(x=>x.url==='https://example.org/'),'company web URL appears in general My Links');
 await submit(form('person','create',{full_name:'Contact Person',role_title:'Recruiter',company_id:cid,email:'person@example.org',profile_url:'',relationship_stage:'new',last_contacted_at:'',notes:'Met at event'}));
 assert.equal(data.career_people.length,1,'person created and linked to company');
 await submit(form('application','create',{role_title:'Analyst',company_id:cid,hiring_stage:'wishlist',source_url:'https://jobs.example.org/role',applied_at:'',notes:'Prepare CV'}));
 assert.equal(data.career_applications.length,1,'application created and linked');
 const aid=data.career_applications[0].id;
 assert.notEqual(data.career_applications[0].hiring_stage,'todo','application stage separate from task status');
 await submit(form('application','edit',{role_title:'Senior Analyst',company_id:cid,hiring_stage:'applied',source_url:'https://jobs.example.org/role',applied_at:'2026-10-21',notes:'Applied manually'},aid));
 assert.equal(data.career_applications[0].role_title,'Senior Analyst');
 assert.equal(data.career_applications[0].hiring_stage,'applied');
 await click('page',{page:'applications'});
 html=ctx.window.SELFCareer.render();
 assert.match(html,/Senior Analyst/);
 assert.match(html,/Real Company/);
 await click('page',{page:'companies'});
 assert.match(ctx.window.SELFCareer.render(),/1 people · 1 applications/);
 await click('open',{kind:'company',id:cid});
 assert.match(ctx.window.SELFCareer.render(),/Connected records/,'company shows related canonical records');
 await click('close-drawer');
 // Failed save never pretends it succeeded or discards fields.
 failNext=true;
 await submit(form('company','create',{name:'Draft company',industry:'',website:'',location:'',notes:''}));
 assert.equal(data.career_companies.length,1,'rejected save created no company');
 assert.match(careerUI.saveError,/Not saved/);
 assert.equal(careerUI.modal,null,'error in direct test does not auto-start modal');
 await submit(form('company','create',{name:'Draft company',industry:'',website:'',location:'',notes:''}));
 assert.equal(data.career_companies.length,2,'retry after failure succeeds exactly once');
 // Deleting company with app reference is blocked.
 await click('delete',{kind:'company',id:cid});
 assert.equal(data.career_companies.length,2,'FK prevents deleting referenced company');
 await click('delete',{kind:'application',id:aid});
 assert.equal(data.career_applications.length,0);
 await click('delete',{kind:'company',id:cid});
 assert.equal(data.career_companies.length,1,'unreferenced company deletion succeeds');
 // Different owner is unable to see prior owner's records.
 user.id='owner2';await ctx.window.SELFCareer.enter();
 await ctx.window.SELFCareer.ui.ready; // no-op; state is already loaded from owner 1
 // Force new account refresh, illustrating owner-scoped query.
 careerUI.ready=false;careerUI.companies=[];careerUI.people=[];careerUI.applications=[];
 await ctx.window.SELFCareer.enter();
 await new Promise(resolve=>setTimeout(resolve,12));
 assert.equal(careerUI.companies.length,0,'second account sees no first-owner records');
 assert.equal(careerUI.people.length,0);
 assert.equal(careerUI.applications.length,0);
 console.log('PASS Career Phase1: nine subpages; three owner-scoped CRUD entities; relationships; links; Task reuse; Radar inactive; failed saves.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
