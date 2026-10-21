/* SELF Career Phase 2. Canonical records, no duplicate Tasks or public document URLs. */
(function(){
'use strict';
let host=null,core=null;
const C={touchpoints:[],cvs:[],interviews:[],templates:[],taskLinks:[],owner:null,ready:false,
 modal:null,busy:false,error:'',lastMove:null,dragId:null};
const tables={touchpoint:'career_touchpoints',cv:'career_cv_versions',interview:'career_interviews',
 template:'career_templates',taskLink:'career_task_links'};
const fields={touchpoint:['person_id','contact_at','channel','summary','next_step'],
 cv:['label','focus','notes'],interview:['application_id','title','scheduled_at','format','stage','prep_notes','reflection'],
 template:['title','category','body']};
const allowedStages=new Set(['wishlist','applied','interviewing','offer','closed']);
const h=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const e=h, btn=(title,a,extra='')=>'<button type="button" class="career-btn" data-career2="'+a+'" '+extra+'>'+title+'</button>';
const primary=(title,a,extra='')=>'<button type="button" class="career-btn career-primary" data-career2="'+a+'" '+extra+'>'+title+'</button>';
const row=(title,description,action='',extra='')=>'<div class="career2-row"><div><strong>'+h(title)+'</strong><small>'+h(description||'')+'</small></div>'+action+'</div>';
const noData=(title,sub)=>'<div class="career2-empty"><strong>'+h(title)+'</strong><p>'+h(sub)+'</p></div>';
const inp=(label,name,value='',extra='')=>'<label class="career-form-label">'+h(label)+'<input class="career-field" name="'+name+'" value="'+e(value??'')+'" '+extra+'></label>';
const area=(label,name,value='')=>'<label class="career-form-label">'+h(label)+'<textarea class="career-field career-notes" name="'+name+'" rows="5">'+h(value??'')+'</textarea></label>';
const select=(label,name,options,value='',required=false)=>'<label class="career-form-label">'+h(label)+'<select class="career-field" name="'+name+'" '+(required?'required':'')+'>'+
 (required?'':'<option value="">None</option>')+options.map(([v,title])=>'<option value="'+e(v)+'" '+(v===value?'selected':'')+'>'+h(title)+'</option>').join('')+'</select></label>';
const me=()=>host?.state?.()?.user?.id;
const apps=()=>core.ui.applications;
const people=()=>core.ui.people;
const companies=()=>core.ui.companies;
const tasks=()=>host.state()?.tasks||[];
const companyName=id=>companies().find(c=>c.id===id)?.name||'Company';
const applicationName=id=>apps().find(x=>x.id===id)?.role_title||'Application';
const personName=id=>people().find(x=>x.id===id)?.full_name||'Contact';
const date=d=>d?new Date(d).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'}):'No date';
function reset(owner){
 C.owner=owner;C.ready=false;C.touchpoints=[];C.cvs=[];C.interviews=[];C.templates=[];C.taskLinks=[];
 C.modal=null;C.lastMove=null;C.error='';C.busy=false;
}
async function load(owner){
 if(!owner||owner!==me())return;
 if(C.owner!==owner)reset(owner);
 try{
  const names=Object.values(tables);
  const result=await Promise.all(names.map(t=>host.request('/rest/v1/'+t+'?select=*&order=created_at.desc')));
  if(owner!==me()||C.owner!==owner)return;
  [C.touchpoints,C.cvs,C.interviews,C.templates,C.taskLinks]=result;
  C.ready=true;C.error='';
 }catch(err){C.error='Career Operations could not load: '+(err?.message||String(err));C.ready=false;throw err}
}
const statusRow=(app)=>'<label class="career2-stage-select">Move to <select data-career2-stage="'+e(app.id)+'" aria-label="Change stage for '+e(app.role_title)+'">'+
 [['wishlist','Wishlist'],['applied','Applied'],['interviewing','Interviewing'],['offer','Offer'],['closed','Closed']].map(([k,v])=>'<option value="'+k+'" '+(app.hiring_stage===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
const stageNames=[['wishlist','Wishlist'],['applied','Applied'],['interviewing','Interviewing'],['offer','Offer'],['closed','Closed']];
function renderApplications(){
 return '<div class="career2-title"><div><h2>Application pipeline</h2><p>Drag between stages, or use the status selector. Changes save to your original Application.</p></div>'+
 primary('+ Application','career-new','data-kind="application"')+'</div>'+
 (C.lastMove?'<div class="career2-undo"><span>Moved '+h(C.lastMove.title)+' to '+h(C.lastMove.to)+'.</span>'+btn('↶ Undo','undo-stage')+'</div>':'')+
 '<div class="career-kanban career2-pipeline">'+stageNames.map(([stage,title])=>{
 const rows=apps().filter(x=>x.hiring_stage===stage);
 return '<section class="career-kanban-col career2-drop" data-career2-drop="'+stage+'"><div class="career-kanban-head"><strong>'+title+'</strong><span>'+rows.length+'</span></div>'+
 (rows.map(x=>'<article class="career2-job" draggable="true" data-career2-drag="'+e(x.id)+'">'+
 '<button type="button" data-career2="open-application" data-id="'+e(x.id)+'"><strong>'+h(x.role_title)+'</strong><small>'+h(companyName(x.company_id))+'</small></button>'+
 statusRow(x)+'</article>').join('')||'<div class="career-kanban-empty">Drop a role here</div>')+'</section>';
 }).join('')+'</div>';
}
function renderPeople(){
 const chunks=[['new','New'],['reached_out','Reached Out'],['in_conversation','In Conversation'],['maintain','Maintain']];
 return '<div class="career2-title"><div><h2>Networking</h2><p>Your people and every conversation, without a second contacts list.</p></div>'+
 primary('+ Person','career-new','data-kind="person"')+'</div><div class="career-grid-two">'+chunks.map(([id,title])=>{
 const rows=people().filter(x=>x.relationship_stage===id);
 return '<section class="career-card"><div class="career-small-heading"><strong>'+title+'</strong><span>'+rows.length+'</span></div>'+
 (rows.map(p=>'<div class="career2-person-row"><button type="button" data-career2="open-person" data-id="'+e(p.id)+'"><strong>'+h(p.full_name)+'</strong><small>'+h(p.role_title||companyName(p.company_id))+'</small></button>'+
 '<span>'+C.touchpoints.filter(x=>x.person_id===p.id).length+' interactions</span></div>').join('')||
 '<p class="career-soft-empty">No people yet.</p>')+'</section>';
 }).join('')+'</div>';
}
function section(title,description,add){
 return '<div class="career2-title"><div><h2>'+h(title)+'</h2><p>'+h(description)+'</p></div>'+add+'</div>';
}
function renderCVs(){
 return section('CV Library','Track real versions. PDF and DOCX are private, not public share links.',primary('+ CV Version','open-modal','data-type="cv"'))+
 (C.cvs.length?'<div class="career2-list">'+C.cvs.map(v=>'<section class="career-card career2-resource">'+
 '<div class="career2-resource-title"><div><strong>'+h(v.label)+'</strong><small>'+h(v.focus||'General')+'</small></div><span class="career2-chip">'+(v.storage_path?'Private file':'Notes only')+'</span></div>'+
 (v.notes?'<p>'+h(v.notes)+'</p>':'')+
 '<div class="career2-actions">'+(v.storage_path?btn('Open file ↗','open-file','data-id="'+e(v.id)+'"'):'')+
 btn('Edit','open-modal','data-type="cv" data-id="'+e(v.id)+'"')+
 btn('Remove','delete-record','data-type="cv" data-id="'+e(v.id)+'"')+'</div></section>').join('')+'</div>':
 noData('No CV versions','Save your first CV profile or upload a private PDF/DOCX.'));
}
function renderInterviews(){
 return section('Interview Prep','Schedule sessions and keep preparation, then record your reflections.',primary('+ Interview','open-modal','data-type="interview" '+(apps().length?'':'disabled')))+
 (apps().length?'':'<p class="career-inline-hint">Create an Application before adding an interview.</p>')+
 (C.interviews.length?'<div class="career2-list">'+C.interviews.map(x=>'<section class="career-card career2-resource"><div class="career2-resource-title"><div><strong>'+h(x.title)+'</strong>'+
 '<small>'+h(applicationName(x.application_id))+' · '+date(x.scheduled_at)+'</small></div><span class="career2-chip">'+h(x.stage)+'</span></div>'+
 (x.prep_notes?'<p>'+h(x.prep_notes).slice(0,320)+'</p>':'')+
 '<div class="career2-actions">'+btn('Open prep','open-modal','data-type="interview" data-id="'+e(x.id)+'"')+
 btn('Remove','delete-record','data-type="interview" data-id="'+e(x.id)+'"')+'</div></section>').join('')+'</div>':
 noData('No interviews saved','Interview prep will appear here once you add a session.'));
}
function renderTemplates(){
 return section('Templates','Write reusable messages. Copy when you decide—nothing gets sent automatically.',primary('+ Template','open-modal','data-type="template"'))+
 (C.templates.length?'<div class="career2-list">'+C.templates.map(x=>'<section class="career-card career2-resource"><div class="career2-resource-title"><div><strong>'+h(x.title)+'</strong><small>'+h(x.category.replace(/_/g,' '))+'</small></div></div>'+
 '<p class="career2-preview">'+h(x.body).slice(0,210)+'</p><div class="career2-actions">'+btn('Copy','copy-template','data-id="'+e(x.id)+'"')+
 btn('Edit','open-modal','data-type="template" data-id="'+e(x.id)+'"')+
 btn('Remove','delete-record','data-type="template" data-id="'+e(x.id)+'"')+'</div></section>').join('')+'</div>':
 noData('Create your first template','For example a networking introduction or interview thank-you note.'));
}
function linkedTasks(){
 return C.taskLinks.map(l=>({link:l,task:tasks().find(t=>t.id===l.task_id)})).filter(x=>x.task);
}
function targetName(l){
 if(l.application_id)return applicationName(l.application_id);
 if(l.person_id)return personName(l.person_id);
 if(l.company_id)return companyName(l.company_id);
 return 'Unknown record';
}
function renderReminders(){
 const linked=linkedTasks();
 return section('Career Reminders','A filtered view of real SELF Tasks. Completing a task updates My Work.',primary('+ Follow-up','open-modal','data-type="followup"'))+
 (linked.length?'<div class="career2-list">'+linked.map(({task,link})=>
 '<div class="career-card career2-reminder">'+
 '<button type="button" data-career2="open-task" data-id="'+e(task.id)+'"><strong>'+h(task.title)+'</strong><small>'+h(targetName(link))+'</small></button>'+
 '<span class="career2-chip">'+h(task.status)+' · '+h(task.due_date||'No deadline')+'</span>'+
 btn('Unlink','unlink-task','data-id="'+e(link.id)+'"')+'</div>').join('')+'</div>':
 noData('No Career follow-ups linked yet','Link an existing SELF Task or create a follow-up from here.'));
}
function timeline(personId){
 const logs=C.touchpoints.filter(x=>x.person_id===personId);
 return '<div class="career2-drawer-section">'+section('Interaction timeline','Notes from conversations, calls and introductions.',
 primary('+ Interaction','open-modal','data-type="touchpoint" data-person="'+e(personId)+'"'))+
 (logs.map(x=>'<div class="career2-timeline"><div><strong>'+h(x.summary)+'</strong><small>'+date(x.contact_at)+' · '+h(x.channel)+'</small>'+
 (x.next_step?'<p>Next: '+h(x.next_step)+'</p>':'')+'</div>'+btn('Delete','delete-record','data-type="touchpoint" data-id="'+e(x.id)+'"')+'</div>').join('')||
 noData('No interaction history','Add the first conversation to start the timeline.'))+'</div>';
}
function relatedTasks(kind,id){
 const key=kind+'_id',links=C.taskLinks.filter(l=>l[key]===id),seen=linkedTasks().filter(({link})=>links.some(l=>l.id===link.id));
 return '<div class="career2-drawer-section">'+section('Linked SELF Tasks','Same task objects from My Work.',
 primary('+ Link task','open-modal','data-type="followup" data-target-kind="'+kind+'" data-target-id="'+e(id)+'"'))+
 (seen.map(({link,task})=>'<div class="career2-timeline">'+
 '<div><strong>'+h(task.title)+'</strong><small>'+h(task.status)+' · '+h(task.due_date||'No deadline')+'</small></div>'+
 btn('Open','open-task','data-id="'+e(task.id)+'"')+'</div>').join('')||
 '<p class="career-soft-empty">No linked follow-ups.</p>')+'</div>';
}
function renderDrawer(kind,record){
 if(!C.ready)return '';
 let result=relatedTasks(kind,record.id);
 if(kind==='person')result+=timeline(record.id);
 if(kind==='application'){
  const interviews=C.interviews.filter(x=>x.application_id===record.id);
  result+='<div class="career2-drawer-section">'+section('Interview prep','Sessions linked to this application.',primary('+ Interview','open-modal','data-type="interview" data-application="'+e(record.id)+'"'))+
  (interviews.map(x=>row(x.title,date(x.scheduled_at),btn('Open','open-modal','data-type="interview" data-id="'+e(x.id)+'"'))).join('')||
  '<p class="career-soft-empty">No interview prep yet.</p>')+'</div>';
  result+='<div class="career2-drawer-section">'+section('CV Version','The CV used for this application.')+
  '<label class="career-form-label">CV used<select class="career-field" data-career2-cv="'+e(record.id)+'">'+
  '<option value="">Not linked</option>'+C.cvs.map(x=>'<option value="'+e(x.id)+'" '+(x.id===record.cv_version_id?'selected':'')+'>'+h(x.label)+'</option>').join('')+
  '</select></label></div>';
 }
 return result;
}
function form(type,rowValue={}){
 const x=rowValue||{};
 if(type==='touchpoint')return select('Person *','person_id',people().map(p=>[p.id,p.full_name]),x.person_id||C.modal.personId,true)+
 '<div class="career-form-grid">'+inp('Date','contact_at',x.contact_at||new Date().toISOString().slice(0,10),'type="date" required')+
 select('Channel','channel',[['message','Message'],['email','Email'],['call','Call'],['meeting','Meeting'],['event','Event'],['other','Other']],x.channel||'message',true)+'</div>'+
 area('What happened? *','summary',x.summary)+inp('Next step','next_step',x.next_step,'maxlength="400"');
 if(type==='cv')return inp('CV version name *','label',x.label,'required maxlength="160" placeholder="Investment analyst v2"')+
 inp('Focus / target role','focus',x.focus,'maxlength="160"')+area('What makes this version different?','notes',x.notes)+
 '<label class="career-form-label">Private document · PDF or DOCX (up to 8 MB)<input class="career-field" type="file" name="cv_upload" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label>'+
 (x.file_name?'<p class="career-form-hint">Current: '+h(x.file_name)+' — choose a new file only if replacing.</p>':'');
 if(type==='interview')return inp('Session title *','title',x.title,'required maxlength="160" placeholder="First-round analyst interview"')+
 select('Application *','application_id',apps().map(a=>[a.id,a.role_title+' · '+companyName(a.company_id)]),x.application_id||C.modal.applicationId||apps()[0]?.id,true)+
 '<div class="career-form-grid">'+inp('When','scheduled_at',x.scheduled_at?x.scheduled_at.slice(0,16):'','type="datetime-local"')+
 select('Format','format',[['video','Video'],['phone','Phone'],['onsite','On-site'],['case','Case interview'],['other','Other']],x.format||'video',true)+'</div>'+
 select('Status','stage',[['scheduled','Scheduled'],['completed','Completed'],['cancelled','Cancelled']],x.stage||'scheduled',true)+
 area('Preparation','prep_notes',x.prep_notes)+area('Reflection / what I learned','reflection',x.reflection);
 if(type==='template')return inp('Template name *','title',x.title,'required maxlength="160"')+
 select('Category','category',[['networking','Networking'],['followup','Follow-up'],['cover_letter','Cover letter'],['interview','Interview'],['other','Other']],x.category||'networking',true)+
 area('Template text','body',x.body);
 if(type==='followup'){
  const opts=[...apps().map(a=>['application:'+a.id,'Application · '+a.role_title]),...people().map(p=>['person:'+p.id,'Person · '+p.full_name]),...companies().map(c=>['company:'+c.id,'Company · '+c.name])];
  const selected=C.modal.targetKind&&C.modal.targetId?C.modal.targetKind+':'+C.modal.targetId:'';
  return select('Attach to Career record *','target',opts,selected||opts[0]?.[0],true)+
  select('Task source','mode',[['new','Create new SELF Task'],['existing','Link existing SELF Task']],'new',true)+
  '<div class="career-form-grid">'+inp('New task title','title','','placeholder="Follow up with recruiter"')+
  inp('Due date','due_date','','type="date"')+'</div>'+
  select('Existing SELF Task','existing_task',tasks().filter(t=>!C.taskLinks.some(l=>l.task_id===t.id)).map(t=>[t.id,t.title]),'')+
  '<p class="career-form-hint">Choose New or Existing. One follow-up always points to the same task visible in My Work.</p>';
 }
 return '';
}
function modalMarkup(){
 if(!C.modal)return '';
 const {type,id}=C.modal,table=tables[type],records=
 type==='cv'?C.cvs:type==='touchpoint'?C.touchpoints:type==='interview'?C.interviews:C.templates;
 const obj=id?records.find(x=>x.id===id):null;
 const title={cv:'CV Version',interview:'Interview Prep',touchpoint:'Interaction',template:'Template',followup:'Follow-up'}[type]||'Record';
 return '<div class="career-modal-layer career2-modal-layer"><section class="career-modal career2-modal" role="dialog" aria-modal="true" aria-label="'+h(title)+'">'+
 '<div class="career-drawer-header"><span>SELF / Career / '+title+'</span>'+btn('✕','close-modal','aria-label="Close"')+'</div>'+
 '<h2>'+(obj?'Edit ':'New ')+title+'</h2>'+
 '<form id="career2-form" data-type="'+type+'" '+(obj?'data-id="'+e(obj.id)+'"':'')+' class="career-record-form">'+form(type,obj)+
 '<div class="career-form-actions"><span class="career-save-note" aria-live="polite">'+h(C.error)+'</span>'+
 '<button class="career-btn career-primary" type="submit" '+(C.busy?'disabled':'')+'>'+(C.busy?'Saving…':'Save '+title)+'</button></div></form></section></div>';
}
async function refresh(){
 const own=C.owner;if(!own||own!==me())return;
 await load(own);host.render();
}
function validUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)}catch{return false}}
function notice(text,isError=false){host.notify(text,isError)}
async function submit(ev){
 if(ev.target?.id!=='career2-form')return false;
 ev.preventDefault();ev.stopPropagation();
 const formEl=ev.target,type=formEl.dataset.type,id=formEl.dataset.id;
 if(C.busy)return true;
 const fd=new FormData(formEl),data=Object.fromEntries(fd.entries());
 if(type==='touchpoint'&&!data.summary?.trim()||
    type==='cv'&&!data.label?.trim()||type==='interview'&&!data.title?.trim()||
    type==='template'&&!data.title?.trim()){
  inlineError(formEl,'Fill in the required fields.');return true;
 }
 const owner=C.owner;
 if(type==='followup'){await saveFollowup(formEl,data);return true}
 const payload={};
 for(const key of fields[type])payload[key]=String(data[key]||'').trim();
 for(const key of ['person_id','application_id','contact_at','scheduled_at']){
  if(key in payload&&!payload[key])payload[key]=null;
 }
 if(type==='interview'&&payload.scheduled_at){
  const dt=new Date(payload.scheduled_at);
  if(!Number.isFinite(dt.getTime())){inlineError(formEl,'Invalid interview date.');return true}
  payload.scheduled_at=dt.toISOString();
 }
 if(type==='touchpoint'&&!payload.person_id||type==='interview'&&!payload.application_id){
  inlineError(formEl,'Select a connected record.');return true;
 }
 let file=fd.get('cv_upload'),withFile=type==='cv'&&file&&typeof file.size==='number'&&file.size>0;
 if(withFile&&(!host.validateDocument?.(file))){inlineError(formEl,'Use PDF or DOCX, maximum 8 MB.');return true}
 C.busy=true;C.error='';const button=formEl.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent='Saving…'}
 try{
  let saved=id?await host.patch(tables[type],id,payload):await host.insert(tables[type],payload);
  if(type==='cv'&&withFile){
   let path;
   try{
    path=await host.uploadDocument(file);
    saved=await host.patch('career_cv_versions',saved.id,{storage_path:path,file_name:file.name,file_type:file.type});
   }catch(error){
    C.error='CV metadata saved, but file upload/linking failed. Reopen this CV and retry: '+error.message;
    notice(C.error,true);C.modal=null;await refresh();return true;
   }
  }
  C.modal=null;C.error='';
  if(type==='touchpoint'&&saved.person_id){
   const dateVal=saved.contact_at||new Date().toISOString().slice(0,10);
   const prior=people().find(x=>x.id===saved.person_id);
   if(prior&&(!prior.last_contacted_at||dateVal>prior.last_contacted_at)){
    try{await host.patch('career_people',prior.id,{last_contacted_at:dateVal})}catch(e){notice('Interaction saved, but Last Contacted could not update: '+e.message,true)}
   }
  }
  await refresh();
  notice((type==='cv'?'CV':type)+' saved');
 }catch(error){inlineError(formEl,'Not saved: '+error.message)}
 finally{C.busy=false;if(button?.isConnected){button.disabled=false;button.textContent='Save '+type}}
 return true;
}
function inlineError(form,message){C.error=message;const note=form.querySelector('.career-save-note');if(note)note.textContent=message}
async function saveFollowup(formEl,data){
 const target=String(data.target||'').split(':'),kind=target[0],id=target[1];
 if(!['application','person','company'].includes(kind)||!id){inlineError(formEl,'Choose a Career record.');return}
 let taskId;
 if(data.mode==='existing'){
  taskId=data.existing_task;
  if(!tasks().some(t=>t.id===taskId)||C.taskLinks.some(t=>t.task_id===taskId)){inlineError(formEl,'Choose an unlinked SELF Task.');return}
 }else{
  if(!data.title?.trim()){inlineError(formEl,'Enter a new Task title.');return}
 }
 C.busy=true;
 const button=formEl.querySelector('button[type="submit"]');if(button)button.disabled=true;
 try{
  if(data.mode!=='existing'){
   const task=await host.insert('tasks',{title:data.title.trim(),status:'todo',due_date:data.due_date||null});
   taskId=task.id;
  }
  try{await host.insert('career_task_links',{task_id:taskId,[kind+'_id']:id})}
  catch(error){
   inlineError(formEl,(data.mode==='existing'?'Link failed: ':'SELF Task was created, but linking failed: ')+error.message+
   (data.mode==='existing'?'':' Task remains safely in My Work. Link it as Existing Task.'));
   await host.reloadCore?.();return;
  }
  C.modal=null;C.error='';await host.reloadCore?.();await refresh();notice('Career follow-up linked to My Work');
 }catch(error){inlineError(formEl,'Not saved: '+error.message)}
 finally{C.busy=false;if(button?.isConnected)button.disabled=false}
}
async function setStage(id,value,{undo=false}={}){
 const item=apps().find(x=>x.id===id);
 if(!item||!allowedStages.has(value)||C.busy)return false;
 if(item.hiring_stage===value)return true;
 const from=item.hiring_stage;
 C.busy=true;
 try{
  await host.patch('career_applications',id,{hiring_stage:value});
  item.hiring_stage=value;
  C.lastMove=undo?null:{id,from,to:value,title:item.role_title};
  host.render();return true;
 }catch(err){
  notice('Stage not changed: '+err.message,true);
  host.render();return false;
 }finally{C.busy=false}
}
async function action(ev){
 const b=ev.target.closest?.('[data-career2]');
 if(!b)return false;
 ev.preventDefault();ev.stopPropagation();
 const a=b.dataset.career2,id=b.dataset.id,type=b.dataset.type;
 if(a==='open-modal'){
  C.modal={type,id,personId:b.dataset.person,applicationId:b.dataset.application,
   targetKind:b.dataset.targetKind,targetId:b.dataset.targetId};
  C.error='';host.render();
  Promise.resolve().then(()=>document.querySelector?.('.career2-modal .career-field')?.focus?.());
 }else if(a==='close-modal'){C.modal=null;C.error='';host.render()}
 else if(a==='open-application'){core.ui.drawer={kind:'application',id};host.render()}
 else if(a==='open-person'){core.ui.drawer={kind:'person',id};host.render()}
 else if(a==='career-new'){core.ui.modal=b.dataset.kind;host.render()}
 else if(a==='undo-stage'){
  if(C.lastMove)await setStage(C.lastMove.id,C.lastMove.from,{undo:true});
 }else if(a==='open-task'){core.ui.drawer=null;host.openTask(id)}
 else if(a==='copy-template'){
  const template=C.templates.find(x=>x.id===id);
  if(template){try{await navigator.clipboard.writeText(template.body);notice('Template copied')}
  catch{notice('Clipboard unavailable. Open template and select its text.',true);C.modal={type:'template',id};host.render()}}
 }else if(a==='open-file'){
  const cv=C.cvs.find(x=>x.id===id);
  if(cv?.storage_path){try{const uri=await host.signDocument(cv.storage_path);if(uri)window.open(uri,'_blank','noopener,noreferrer')}
  catch(error){notice('Could not open document: '+error.message,true)}}
 }else if(a==='delete-record'){
  const map=type==='cv'?C.cvs:type==='touchpoint'?C.touchpoints:type==='interview'?C.interviews:C.templates;
  const obj=map.find(x=>x.id===id);
  if(obj&&confirm('Delete this '+type+'? This cannot be undone.')){
   try{await host.del(tables[type],id);await refresh();notice(type+' deleted')}
   catch(error){notice('Could not delete: '+error.message,true)}
  }
 }else if(a==='unlink-task'){
  if(confirm('Unlink this task from Career? It remains in My Work.')){
   try{await host.del(tables.taskLink,id);await refresh();notice('Task unlinked; still in My Work')}
   catch(err){notice('Could not unlink: '+err.message,true)}
  }
 }
 return true;
}
async function change(ev){
 const el=ev.target;
 if(el.dataset?.career2Stage){
  await setStage(el.dataset.career2Stage,el.value);
  return true;
 }
 if(el.dataset?.career2Cv){
  const app=apps().find(a=>a.id===el.dataset.career2Cv);
  if(!app)return true;
  const previous=app.cv_version_id;
  if(el.value&&!C.cvs.some(x=>x.id===el.value)){el.value=previous||'';return true}
  try{await host.patch('career_applications',app.id,{cv_version_id:el.value||null});app.cv_version_id=el.value||null;notice('CV linked')}
  catch(err){el.value=previous||'';notice('CV link not saved: '+err.message,true)}
  return true;
 }
 return false;
}
function dragStart(ev){
 const item=ev.target.closest?.('[data-career2-drag]');
 if(!item||!C.ready||C.busy)return;
 C.dragId=item.dataset.career2Drag;
 ev.dataTransfer?.setData('text/plain',C.dragId);
 if(ev.dataTransfer)ev.dataTransfer.effectAllowed='move';
 item.classList.add('career2-dragging');
}
function dragOver(ev){
 if(!C.dragId)return;
 const col=ev.target.closest?.('[data-career2-drop]');
 if(col){ev.preventDefault();col.classList.add('career2-over')}
}
function dragEnd(){C.dragId=null;document.querySelectorAll?.('.career2-over,.career2-dragging').forEach(x=>x.classList.remove('career2-over','career2-dragging'))}
async function drop(ev){
 if(!C.dragId)return;
 const col=ev.target.closest?.('[data-career2-drop]');
 if(!col)return;
 ev.preventDefault();
 const id=C.dragId,stage=col.dataset.career2Drop;
 dragEnd();await setStage(id,stage);
}
function keydown(ev){
 if(C.modal&&ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation?.();C.modal=null;host.render();return true}
 return false;
}
function init(args){
 core=args.career;host=args.host;
 document.addEventListener('dragstart',dragStart);
 document.addEventListener('dragover',dragOver);
 document.addEventListener('dragend',dragEnd);
 document.addEventListener('drop',ev=>{drop(ev).catch(err=>notice('Drag failed: '+err.message,true))});
}
window.SELFCareerPhase2={init,load,reset,renderApplications,renderPeople,renderCVs,renderInterviews,renderTemplates,renderReminders,renderDrawer,modalMarkup,action,submit,change,keydown,ui:C};
})();
