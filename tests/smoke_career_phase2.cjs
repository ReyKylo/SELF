/* SELF Career Phase 2 smoke: real App records, Task links and rejected writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const phase2=fs.readFileSync(path.join(root,'career-phase2.js'),'utf8');
const career=fs.readFileSync(path.join(root,'career.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const build=fs.readFileSync(path.join(root,'tools/build_cloudflare.py'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261021152000_career_phase2_operations.sql'),'utf8');
for(const t of ['career_touchpoints','career_cv_versions','career_interviews','career_templates','career_task_links'])
 assert(sql.includes(t),'migration must add '+t);
assert(sql.includes('self-career-documents')&&sql.includes('public=false'),'private CVs');
assert(sql.includes('ENABLE ROW LEVEL SECURITY')&&sql.includes('career_task_link_existing_owner'),'owner-scoped canonical Tasks');
assert(html.includes('src="./career-phase2.js"')&&html.includes('career-phase2.css'),'Phase2 browser assets included');
assert(build.includes('career-phase2.js'),'Cloudflare ship Phase2');
assert(app.includes('uploadCareerDocument')&&app.includes('signCareerDocument'),'CVs use private Storage');
const tables={career_companies:[],career_people:[],career_applications:[],career_touchpoints:[],career_cv_versions:[],
 career_interviews:[],career_templates:[],career_task_links:[],tasks:[]};
let n=0,failPatch=false,failInsert=false,notifications=[],clicks=0;
const owner={id:'owner-1'};
const company={id:'co1',user_id:'owner-1',name:'Real Firm',industry:'Investment',notes:''};
const person={id:'p1',user_id:'owner-1',full_name:'Recruiter',role_title:'HR',company_id:'co1',
 relationship_stage:'new',last_contacted_at:null};
const application={id:'a1',user_id:'owner-1',role_title:'Analyst',company_id:'co1',hiring_stage:'wishlist'};
tables.career_companies.push(company);tables.career_people.push(person);tables.career_applications.push(application);
tables.tasks.push({id:'existing-task',user_id:'owner-1',title:'Existing reminder',status:'todo',due_date:'2026-11-01'});
const listeners={},doc={
 addEventListener(k,callback){(listeners[k]??=[]).push(callback)},
 querySelector(){return null},querySelectorAll(){return []}
};
const FormDataMock=class{
 constructor(form){this.values=form.fields||{}}
 entries(){return Object.entries(this.values)[Symbol.iterator]()}
 get(k){return this.values[k]??null}
};
const clipboard=[];
const ctx={window:{open(){return {location:{},close(){}}}},
 document:doc,FormData:FormDataMock,URL,Date,Promise,
 confirm:()=>true,navigator:{clipboard:{async writeText(v){clipboard.push(v)}}},console,setTimeout,clearTimeout};
vm.createContext(ctx);
vm.runInContext(phase2,ctx);vm.runInContext(career,ctx);
let renderCount=0;
const host={
 state:()=>({user:owner,tasks:tables.tasks,view:'career'}),
 render(){renderCount++},notify(message,bad=false){notifications.push({message,bad})},
 navigate(){},icon:()=>'',newTask(){},openTask(id){clicks++;assert(tables.tasks.some(t=>t.id===id))},
 async reloadCore(){},
 async request(url){let t=new URL('https://x.local'+url).pathname.split('/').pop();
  if(!tables[t])throw Error('Invalid table '+t);
  return tables[t].filter(x=>x.user_id===owner.id).map(x=>({...x}));
 },
 async insert(t,fields){
  if(failInsert){failInsert=false;throw Error('offline insert')}
  assert(tables[t],'insert target '+t);
  const v={id:'id'+(++n),user_id:owner.id,...fields};
  if(t==='career_task_links'&&!tables.tasks.some(x=>x.id===v.task_id))throw Error('Missing canonical Task');
  tables[t].push(v);return v;
 },
 async patch(t,id,fields){
  if(failPatch){failPatch=false;throw Error('offline update')}
  const row=tables[t].find(x=>x.id===id&&x.user_id===owner.id);
  if(!row)throw Error('Row not accessible');
  Object.assign(row,fields);return row;
 },
 async del(t,id){tables[t]=tables[t].filter(x=>x.id!==id||x.user_id!==owner.id)},
 validateDocument(f){return f.type==='application/pdf'&&f.size<=8388608},
 async uploadDocument(f){return owner.id+'/random.pdf'},
 async signDocument(path){assert(path.startsWith(owner.id+'/'));return 'https://private.example.com/signed'}
};
ctx.window.SELFCareer.init(host);
const c1=ctx.window.SELFCareer,p2=ctx.window.SELFCareerPhase2;
const form=(type,values={},id)=>{
 let note={textContent:''},button={disabled:false,isConnected:true,textContent:''};
 return {id:'career2-form',dataset:{type,id},fields:values,
  querySelector(sel){if(sel==='button[type="submit"]')return button;if(sel==='.career-save-note')return note;return null}};
};
const submit=async f=>p2.submit({target:f,preventDefault(){},stopPropagation(){}});
const click=async (action,attrs={})=>{
 const el={dataset:{career2:action,...attrs}};
 const target={closest(s){return s==='[data-career2]'?el:null}};
 return p2.action({target,preventDefault(){},stopPropagation(){}});
};
async function main(){
 c1.enter();await new Promise(done=>setTimeout(done,12));
 assert.equal(c1.ui.ready,true);assert.equal(p2.ui.ready,true);
 c1.ui.page='applications';
 assert.match(c1.render(),/data-career2-drop="wishlist"/,'Kanban added within original Career');
 assert.match(c1.render(),/data-career2-stage="a1"/,'keyboard/touch select');
 const stageElement={dataset:{career2Stage:'a1'},value:'applied'};
 await p2.change({target:stageElement});
 assert.equal(application.hiring_stage,'applied','persist stage on same App');
 assert.equal(p2.ui.lastMove.from,'wishlist');
 failPatch=true;
 await click('undo-stage');assert.equal(application.hiring_stage,'applied','refused undo leaves stage');
 assert.equal(p2.ui.lastMove.from,'wishlist','undo history survives network failure');
 await click('undo-stage');assert.equal(application.hiring_stage,'wishlist','undo saves original status');
 p2.ui.modal={type:'touchpoint',personId:'p1'};
 await submit(form('touchpoint',{person_id:'p1',contact_at:'2026-10-20',channel:'meeting',summary:'Discussed analyst role',next_step:'Follow up'}));
 assert.equal(tables.career_touchpoints.length,1);
 assert.equal(tables.career_people[0].last_contacted_at,'2026-10-20');
 assert.match(p2.renderDrawer('person',person),/Discussed analyst role/,'timeline on original Person');
 p2.ui.modal={type:'cv'};
 const pdf={size:1234,type:'application/pdf',name:'resume.pdf'};
 await submit(form('cv',{label:'Analyst CV v1',focus:'Investment analyst',notes:'Tailored',cv_upload:pdf}));
 assert.equal(tables.career_cv_versions.length,1,'CV version record persisted');
 assert.equal(tables.career_cv_versions[0].storage_path,'owner-1/random.pdf','private CV stored by path');
 const cvId=tables.career_cv_versions[0].id;
 const selectNode={dataset:{career2Cv:'a1'},value:cvId};
 await p2.change({target:selectNode});
 assert.equal(application.cv_version_id,cvId,'application linked to CV version');
 p2.ui.modal={type:'interview'};
 await submit(form('interview',{title:'First round',application_id:'a1',scheduled_at:'2026-11-01T09:00',
 format:'video',stage:'scheduled',prep_notes:'Review valuation',reflection:''}));
 assert.equal(tables.career_interviews.length,1);
 assert.match(p2.renderDrawer('application',application),/First round/);
 p2.ui.modal={type:'template'};
 await submit(form('template',{title:'Intro message',category:'networking',body:'Hello from SELF'}));
 assert.equal(tables.career_templates.length,1);
 await click('copy-template',{id:tables.career_templates[0].id});
 assert.equal(clipboard[0],'Hello from SELF','template copied but never sent');
 p2.ui.modal={type:'followup'};
 await submit(form('followup',{target:'application:a1',mode:'existing',existing_task:'existing-task',title:'',due_date:''}));
 assert.equal(tables.career_task_links.length,1,'canonical SELF task linked');
 assert.equal(tables.tasks.length,1,'no new task duplicated when linking existing');
 assert.match(p2.renderReminders(),/Existing reminder/);
 await click('open-task',{id:'existing-task'});
 assert.equal(clicks,1,'linked task opens SELF Task Detail');
 p2.ui.modal={type:'followup'};
 await submit(form('followup',{target:'person:p1',mode:'new',title:'Follow up recruiter',due_date:'2026-11-04'}));
 assert.equal(tables.tasks.length,2,'new followup creates real SELF Task');
 assert.equal(tables.career_task_links.length,2);
 const link=tables.career_task_links.find(x=>x.person_id==='p1');
 await click('unlink-task',{id:link.id});
 assert.equal(tables.tasks.length,2,'unlink never destroys SELF Task');
 assert.equal(tables.career_task_links.length,1);
 p2.ui.modal={type:'template'};
 const before=tables.career_templates.length;
 failInsert=true;
 const broken=form('template',{title:'Unsent',category:'followup',body:'Do not lose'});
 await submit(broken);
 assert.equal(tables.career_templates.length,before,'failed save inserts nothing');
 assert.match(p2.ui.error,/Not saved/);
 assert.equal(p2.ui.modal.type,'template','failed form remains open for retry');
 await submit(broken);
 assert.equal(tables.career_templates.length,before+1);
 assert.equal(p2.ui.modal,null);
 c1.ui.page='radar';assert.match(c1.render(),/Opportunity discovery is not running/,'Phase3 Radar never activated');
 const copyOfOld=company.name;owner.id='owner-2';c1.enter();await new Promise(done=>setTimeout(done,12));
 assert.equal(p2.ui.cvs.length,0,'switch account drops cached private CV data');
 assert.equal(c1.ui.companies.length,0,'old account companies not shown');
 assert.equal(company.name,copyOfOld);
 console.log('PASS Career 2: shared drag/drop stages + Undo, timeline, private CV+application link, interviews, copy-only templates, canonical Tasks, failures, account isolation.');
}
main().catch(err=>{console.error(err);process.exitCode=1});
