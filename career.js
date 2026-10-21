/* SELF Career Phase 1. Extends existing app shell; never replaces Tasks, Whiteboard, or My Links. */
(function(){
'use strict';
const PAGES=[
 ['overview','Overview','home'],['applications','Applications','briefcase'],
 ['people','People','person'],['companies','Companies','grid'],
 ['radar','Opportunity Radar','search'],['cvs','CV Library','note'],
 ['learning','Career Prep','graduation'],['interviews','Interview Prep','calendar'],['templates','Templates','book'],
 ['reminders','Reminders','clock']
];
const HIRING=[['wishlist','Wishlist'],['applied','Applied'],['interviewing','Interviewing'],['offer','Offer'],['closed','Closed']];
const RELATIONSHIPS=[['new','New'],['reached_out','Reached Out'],['in_conversation','In Conversation'],['maintain','Maintain']];
const TYPES={company:'career_companies',person:'career_people',application:'career_applications'};
const names={company:'Company',person:'Person',application:'Application'};
const ui={page:'overview',railCollapsed:false,ready:false,loading:false,error:'',
 companies:[],people:[],applications:[],drawer:null,modal:null,dirty:false,busy:false,saveError:'',generation:0,owner:null};
let host=null;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const a=h;
const find=(kind,id)=>list(kind).find(x=>x.id===id);
const list=kind=>ui[kind==='company'?'companies':kind==='person'?'people':'applications'];
const companyName=id=>ui.companies.find(c=>c.id===id)?.name||'Unknown company';
const statusName=(value,options)=>options.find(row=>row[0]===value)?.[1]||value;
const safeUrl=value=>{if(!value||!String(value).trim())return null;try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}};
const validEmail=v=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const taskHref=(title)=>'<button type="button" class="career-text-link" data-career="go-work">'+h(title||'My Work')+' →</button>';
function field(label,key,value='',extra=''){
 return '<label class="career-form-label">'+h(label)+'<input class="career-field" name="'+a(key)+'" value="'+a(value??'')+'" '+extra+'/></label>';
}
function area(label,key,value=''){
 return '<label class="career-form-label">'+h(label)+'<textarea class="career-field career-notes" name="'+a(key)+'" rows="5" placeholder="Add useful context...">'+h(value??'')+'</textarea></label>';
}
function select(label,key,options,value='',required=false){
 return '<label class="career-form-label">'+h(label)+'<select class="career-field" name="'+a(key)+'" '+(required?'required':'')+'>'+
 (required?'':'<option value="">None</option>')+
 options.map(([v,t])=>'<option value="'+a(v)+'" '+(v===value?'selected':'')+'>'+h(t)+'</option>').join('')+
 '</select></label>';
}
function companyOptions(){return ui.companies.map(c=>[c.id,c.name]);}
function formFields(kind,rec){
 const v=rec||{};
 if(kind==='company')return field('Company name *','name',v.name,'required maxlength="160" placeholder="e.g. Investment firm"')+
 '<div class="career-form-grid">'+field('Industry','industry',v.industry,'maxlength="120" placeholder="Investment / Fintech / Venture"')+
 field('Location','location',v.location,'maxlength="160" placeholder="Jakarta"')+'</div>'+
 field('Official website','website',v.website,'type="url" placeholder="https://..."')+area('Research & notes','notes',v.notes);
 if(kind==='person')return field('Full name *','full_name',v.full_name,'required maxlength="160" placeholder="Contact name"')+
 '<div class="career-form-grid">'+field('Role / title','role_title',v.role_title,'maxlength="160"')+
 select('Company','company_id',companyOptions(),v.company_id)+'</div>'+
 '<div class="career-form-grid">'+field('Email','email',v.email,'type="email"')+
 field('Profile URL','profile_url',v.profile_url,'type="url" placeholder="https://..."')+'</div>'+
 '<div class="career-form-grid">'+select('Relationship stage','relationship_stage',RELATIONSHIPS,v.relationship_stage||'new',true)+
 field('Last contacted','last_contacted_at',v.last_contacted_at,'type="date"')+'</div>'+
 area('Conversation notes','notes',v.notes);
 if(kind==='application')return field('Job / role title *','role_title',v.role_title,'required maxlength="200" placeholder="Investment Analyst"')+
 (ui.companies.length?
 select('Company *','company_id',companyOptions(),v.company_id||ui.companies[0].id,true):
 '<div class="career-form-hint">Create a Company first, then add its Application.</div>')+
 '<div class="career-form-grid">'+select('Application stage','hiring_stage',HIRING,v.hiring_stage||'wishlist',true)+
 field('Applied date','applied_at',v.applied_at,'type="date"')+'</div>'+
 field('Job posting URL','source_url',v.source_url,'type="url" placeholder="https://..."')+
 area('Application notes','notes',v.notes);
 return '';
}
function sectionHead(title,body,action=''){
 return '<div class="career-section-head"><div><h2>'+h(title)+'</h2><p>'+h(body)+'</p></div>'+action+'</div>';
}
function button(label,action,extra=''){return '<button type="button" class="career-btn" data-career="'+a(action)+'" '+extra+'>'+label+'</button>'}
function primary(label,action,extra=''){return '<button type="button" class="career-btn career-primary" data-career="'+a(action)+'" '+extra+'>'+label+'</button>'}
function empty(title,description,buttonMarkup=''){
 return '<div class="career-empty"><span class="career-empty-icon">✳</span><strong>'+h(title)+'</strong><p>'+h(description)+'</p>'+buttonMarkup+'</div>';
}
function line(item,subtitle,kind,small=''){
 return '<button type="button" class="career-list-item" data-career="open" data-kind="'+kind+'" data-id="'+a(item.id)+'">'+
 '<span><strong>'+h(item.title||item.role_title||item.full_name||item.name)+'</strong><small>'+h(subtitle)+'</small></span>'+
 (small?'<em>'+h(small)+'</em>':'')+'<b aria-hidden="true">›</b></button>';
}
function careerOverview(){
 const apps=ui.applications.filter(x=>x.hiring_stage!=='closed').slice(0,5),people=ui.people.slice(0,4);
 return '<div class="career-two-col">'+
 '<section class="career-card career-card-tall">'+sectionHead('Career focus','Your career work connects to SELF, not a second task system.',
 button('Open My Work ↗','go-work'))+
 '<div class="career-focus-message"><strong>Next actions live in My Work.</strong><p>Follow-ups linked to Career are still canonical SELF Tasks. Review and complete them through My Work.</p>'+
 taskHref('Review your tasks')+'</div></section>'+
 '<section class="career-card career-card-tall">'+sectionHead('Active applications','Your manually tracked hiring pipeline.',
 button('See pipeline →','page', 'data-page="applications"'))+
 (apps.length?apps.map(x=>line(x,companyName(x.company_id),'application',statusName(x.hiring_stage,HIRING))).join(''):
 empty('No applications yet','Capture your first role once you have a company saved.',
 primary('+ Add application','new','data-kind="application" '+(ui.companies.length?'':'disabled'))))+
 '</section></div>'+
 '<div class="career-two-col"><section class="career-card">'+sectionHead('People to reconnect with','Build your relationships intentionally.',button('People →','page','data-page="people"'))+
 (people.length?people.map(x=>line(x,(x.role_title||'Contact')+' · '+(x.company_id?companyName(x.company_id):'Independent'),'person')).join(''):
 empty('Build your network','Add a person and keep conversations in one place.',primary('+ Add person','new','data-kind="person"')))+
 '</section><section class="career-card">'+sectionHead('Opportunity Radar','Design specification only; no background discovery.')+
 '<div class="career-spec-row"><strong>06:00 WIB</strong><span>Jakarta · Investment / Strategy / Venture / Fintech</span></div>'+
 '<div class="career-spec-row"><strong>75% relevance minimum</strong><span>Up to 15 discoveries · Not active</span></div>'+
 '<div class="career-muted-note"><strong>Radar is not running.</strong><p>This page does not invent job opportunities or trigger scheduled searches.</p></div></section></div>';
}
function careerApplications(){
 return sectionHead('Applications','Track real hiring stages. Drag-and-drop and stage Undo arrive in Phase 2.',
 primary('+ Add application','new','data-kind="application" '+(ui.companies.length?'':'disabled')))+
 (ui.companies.length?'': '<p class="career-inline-hint">Add a Company first to create an Application. '+button('Create company','new','data-kind="company"')+'</p>')+
 '<div class="career-kanban">'+HIRING.map(([stage,label])=>{
 const entries=ui.applications.filter(x=>x.hiring_stage===stage);
 return '<section class="career-kanban-col"><div class="career-kanban-head"><strong>'+label+'</strong><span>'+entries.length+'</span></div>'+
 (entries.length?entries.map(x=>line(x,companyName(x.company_id),'application')).join(''):
 '<div class="career-kanban-empty">No applications</div>')+'</section>';
 }).join('')+'</div>';
}
function careerPeople(){
 const cols=RELATIONSHIPS.map(([key,label])=>{
  const subset=ui.people.filter(p=>p.relationship_stage===key);
  return '<section class="career-card"><div class="career-small-heading"><strong>'+label+'</strong><span>'+subset.length+'</span></div>'+
  (subset.map(x=>line(x,(x.role_title||'Contact')+(x.company_id?' · '+companyName(x.company_id):''),'person')).join('')||
  '<p class="career-soft-empty">No contacts here.</p>')+'</section>';
 }).join('');
 return sectionHead('People','Track relationships and conversations, not just names.',primary('+ Add person','new','data-kind="person"'))+
 '<div class="career-grid-two">'+cols+'</div>';
}
function careerCompanies(){
 return sectionHead('Companies','One company record can connect multiple people and applications.',
 primary('+ Add company','new','data-kind="company"'))+
 (ui.companies.length?'<div class="career-grid-two">'+ui.companies.map(c=>{
  const n=ui.people.filter(p=>p.company_id===c.id).length,m=ui.applications.filter(p=>p.company_id===c.id).length;
  return '<button type="button" class="career-company" data-career="open" data-kind="company" data-id="'+a(c.id)+'">'+
  '<div class="career-monogram">'+h((c.name||'?')[0].toUpperCase())+'</div>'+
  '<div><strong>'+h(c.name)+'</strong><small>'+h([c.industry,c.location].filter(Boolean).join(' · ')||'Company profile')+'</small>'+
  '<span>'+n+' people · '+m+' applications</span></div><b>›</b></button>';
 }).join('')+'</div>':
 empty('Build your company universe','Start with target firms, then connect real roles and people.',primary('+ Create first company','new','data-kind="company"')));
}
function future(title,description,when,foot=''){
 return sectionHead(title,description)+
 '<div class="career-card career-upcoming"><span class="career-status">Coming in '+h(when)+'</span><h2>'+h(title)+' is not active yet.</h2>'+
 '<p>'+h(foot||'This subpage is reserved in the approved Career architecture. No fabricated records or inactive controls.')+'</p></div>';
}
function careerRadar(){
 return sectionHead('Opportunity Radar','Approved design parameters. No active discovery or automatic applications.')+
 '<div class="career-card career-upcoming"><span class="career-status">Inactive · Phase 3</span>'+
 '<h2>Opportunity discovery is not running.</h2><p>Will use traceable real listings after provider review and explicit activation.</p>'+
 '<div class="career-spec-grid">'+[['Schedule','Daily · 06:00 WIB'],['Location','Jakarta'],['Minimum match','75%'],['Maximum per day','15'],['Clusters','Investment · Strategy · Venture · Fintech']].map(x=>
 '<div><small>'+h(x[0])+'</small><strong>'+h(x[1])+'</strong></div>').join('')+'</div></div>';
}
function careerReminders(){
 return sectionHead('Reminders','Career tasks use SELF My Work. There is no second task database.')+
 '<div class="career-card career-upcoming"><span class="career-status">Connected task view · Phase 2</span>'+
 '<h2>Your follow-ups stay in one place.</h2><p>When Career records are linked to Tasks in Phase 2, only those linked tasks appear here. Meanwhile you can use existing My Work now.</p>'+
 primary('Open My Work →','go-work')+'</div>';
}
function recordForm(kind,rec,mode){
 const isEdit=mode==='edit';
 return '<form id="career-'+mode+'" class="career-record-form" data-kind="'+a(kind)+'" '+(rec?'data-id="'+a(rec.id)+'"':'')+'>'+
 formFields(kind,rec)+
 '<div class="career-form-actions">'+(isEdit?'<button type="button" data-career="delete" data-kind="'+a(kind)+'" data-id="'+a(rec.id)+'" class="career-btn career-danger">Delete</button>':'')+
 '<span class="career-save-note" aria-live="polite">'+h(ui.saveError||'')+'</span><button type="submit" class="career-btn career-primary" '+(ui.busy?'disabled':'')+'>'+(ui.busy?'Saving…':isEdit?'Save changes':'Create '+names[kind])+'</button></div></form>';
}
function modalMarkup(){
 if(!ui.modal)return '';
 if(ui.modal==='choose')return '<div class="career-modal-layer" role="presentation"><section class="career-modal" role="dialog" aria-modal="true" aria-label="Career Quick Capture">'+
 '<div class="career-drawer-header"><span>SELF / Career / Quick Capture</span>'+button('✕','close-modal','aria-label="Close Quick Capture"')+'</div>'+
 '<h2>What are you capturing?</h2><p>Choose the record to create. Only essential details are required.</p>'+
 '<div class="career-capture-choices">'+
 button((host.icon?host.icon('briefcase',17):'')+'  Application','choose-kind','data-kind="application" '+(ui.companies.length?'':'disabled title="Create a company first"'))+
 button((host.icon?host.icon('person',17):'')+'  Person','choose-kind','data-kind="person"')+
 button((host.icon?host.icon('grid',17):'')+'  Company','choose-kind','data-kind="company"')+
 button((host.icon?host.icon('check',17):'')+'  SELF Task','choose-kind','data-kind="task"')+
 '</div>'+(ui.companies.length?'':'<p class="career-form-hint">Create a Company before adding its Application.</p>')+
 '</section></div>';
 return '<div class="career-modal-layer" role="presentation"><section class="career-modal" role="dialog" aria-modal="true" aria-label="Create '+names[ui.modal]+'">'+
 '<div class="career-drawer-header"><span>SELF / Career / Quick Capture</span>'+button('✕','close-modal','aria-label="Close Quick Capture"')+'</div>'+
 '<h2>New '+names[ui.modal]+'</h2><p>Capture only what matters now. Details can be edited later.</p>'+
 recordForm(ui.modal,null,'create')+'</section></div>';
}
function drawerMarkup(){
 const which=ui.drawer;if(!which)return '';
 const row=find(which.kind,which.id);if(!row)return '';
 let related='';
 if(which.kind==='company'){
  const pe=ui.people.filter(p=>p.company_id===row.id),ap=ui.applications.filter(x=>x.company_id===row.id);
  related='<div class="career-related"><strong>Connected records</strong><p>'+pe.length+' people · '+ap.length+' applications</p>'+
  pe.map(x=>line(x,x.role_title||'Contact','person')).join('')+
  ap.map(x=>line(x,statusName(x.hiring_stage,HIRING),'application')).join('')+'</div>';
 }else if(row.company_id){
  related='<div class="career-related"><strong>Company</strong>'+
  '<p>'+h(companyName(row.company_id))+'</p>'+button('Open company →','open','data-kind="company" data-id="'+a(row.company_id)+'"')+'</div>';
 }
 return '<div class="career-drawer-layer"><aside class="career-drawer" role="dialog" aria-modal="true" aria-label="'+a(names[which.kind])+' detail">'+
 '<div class="career-drawer-header"><span>Career / '+names[which.kind]+' / Details</span>'+button('✕','close-drawer','aria-label="Close details"')+'</div>'+
 '<div class="career-drawer-scroll"><span class="career-eyebrow">Original record · saved privately</span>'+
 '<h2>'+h(row.name||row.full_name||row.role_title)+'</h2>'+related+
 recordForm(which.kind,row,'edit')+
 (window.SELFCareerPhase2?.renderDrawer?.(which.kind,row)||'')+
 '<p class="career-drawer-note">Career status and Task status remain independent, with explicit links between records.</p></div></aside></div>';
}
function render(){
 if(!host)return '<p>Career unavailable.</p>';
 const selected=ui.page,title=PAGES.find(x=>x[0]===selected)?.[1]||'Overview';
 const nav='<nav class="career-rail '+(ui.railCollapsed?'collapsed':'')+'" aria-label="Career subpages"><div class="career-rail-head"><strong>CAREER STUDIO</strong>'+
 button(ui.railCollapsed?'›':'‹','toggle-rail','aria-label="Toggle Career navigation"')+'</div>'+
 PAGES.map(([id,label,icon],index)=> (index===5?'<div class="career-rail-category">RESOURCES</div>':'')+
 '<button type="button" class="career-subnav '+(selected===id?'active':'')+'" data-career="page" data-page="'+id+'" title="'+label+'" aria-current="'+(selected===id?'page':'false')+'">'+
 '<span class="career-nav-symbol">'+(host.icon?host.icon(icon,19):'•')+'</span><span class="career-nav-text">'+label+'</span></button>').join('')+
 '<div class="career-rail-footer">One Career workspace. SELF Tasks, Links and Boards stay connected.</div></nav>';
 let main='';
 if(selected==='learning')main=window.SELFCareerLearning?.render?.()||empty('Career Prep unavailable','Try reloading SELF.');
 else if(ui.loading&&!ui.ready)main=empty('Opening Career…','Loading your private records.');
 else if(ui.error&&!ui.ready)main=empty('Career could not load',ui.error,primary('Retry loading','retry'));
 else if(selected==='overview')main=careerOverview();
 else if(selected==='applications')main=window.SELFCareerPhase2?.renderApplications?.()||careerApplications();
 else if(selected==='people')main=window.SELFCareerPhase2?.renderPeople?.()||careerPeople();
 else if(selected==='companies')main=careerCompanies();
 else if(selected==='radar')main=window.SELFCareerPhase3?.render?.()||careerRadar();
 else if(selected==='cvs')main=window.SELFCareerPhase2?.renderCVs?.()||future('CV Library','Version management and private attachments.','Phase 2');
 else if(selected==='interviews')main=window.SELFCareerPhase2?.renderInterviews?.()||future('Interview Prep','Linked sessions and preparation workflows.','Phase 2');
 else if(selected==='templates')main=window.SELFCareerPhase2?.renderTemplates?.()||future('Templates','Reusable messages and cover letter drafts.','Phase 2');
 else main=window.SELFCareerPhase2?.renderReminders?.()||careerReminders();
 return '<div class="career-workspace">'+nav+
 '<div class="career-stage"><header class="career-page-head"><div><span class="career-eyebrow">CAREER / '+h(title).toUpperCase()+'</span><h1>'+h(selected==='overview'?'Career Overview':title)+'</h1>'+
 '<p>'+h(selected==='overview'?'Your next steps and actual records. No duplicate to-do system.':'One Career workspace, inside your existing SELF.')+'</p></div>'+
 '<div class="career-head-actions">'+button('Sections','toggle-sections','aria-label="Choose Career subpage"')+
 primary('+ Quick Capture','quick-capture')+'</div></header>'+
 '<div class="career-mobile-sections">'+PAGES.map(([id,label])=>button(label,'page','data-page="'+id+'" class="'+(selected===id?'active':'')+'"')).join('')+'</div>'+
 (ui.error&&ui.ready?'<p class="career-warning">'+h(ui.error)+' '+button('Retry','retry')+'</p>':'')+
 main+'</div>'+modalMarkup()+drawerMarkup()+(window.SELFCareerPhase2?.modalMarkup?.()||'')+'</div>';
}
function focusCareerDialog(){
 Promise.resolve().then(()=>document.querySelector?.('.career-capture-choices button:not(:disabled),.career-modal .career-field,.career-drawer .career-field')?.focus?.());
}
function clearPanel(target){
 if(ui.dirty&&!confirm('Discard changes you have not saved?'))return false;
 ui.drawer=null;ui.modal=null;ui.dirty=false;ui.saveError='';target&&target();host.render();Promise.resolve().then(()=>document.querySelector?.('[data-career="quick-capture"]')?.focus?.());return true;
}
async function load(){
 if(ui.loading)return;
 ui.loading=true;ui.error='';const gen=++ui.generation;host.render();
 try{
  const tables=await Promise.all(['career_companies','career_people','career_applications'].map(t=>
   host.request('/rest/v1/'+t+'?select=*&order=updated_at.desc')));
  if(gen!==ui.generation)return;
  [ui.companies,ui.people,ui.applications]=tables.map(x=>Array.isArray(x)?x:[]);
  await window.SELFCareerPhase2?.load?.(ui.owner);
  if(gen!==ui.generation)return;
  await window.SELFCareerPhase3?.load?.(ui.owner);
  if(gen!==ui.generation)return;
  ui.ready=true;ui.error='';
 }catch(e){if(gen!==ui.generation)return;ui.error=e?.message||String(e)}
 finally{if(gen===ui.generation){ui.loading=false;host.render()}}
}
function enter(){
 const owner=host?.state?.()?.user?.id;
 if(!owner)return;
 if(ui.owner!==owner){
  ui.owner=owner;ui.ready=false;ui.loading=false;ui.error='';
  ui.companies=[];ui.people=[];ui.applications=[];
  ui.drawer=null;ui.modal=null;ui.dirty=false;ui.generation++;
  window.SELFCareerPhase2?.reset?.(owner);
  window.SELFCareerPhase3?.reset?.(owner);
  window.SELFCareerLearning?.reset?.(owner);
 }
 if(!ui.ready&&!ui.loading)void load();
}
function setPage(id){
 if(!PAGES.some(x=>x[0]===id))return;
 if(ui.dirty&&!confirm('Discard unsaved edits?'))return;
 if(window.SELFCareerPhase3?.beforeNavigate?.()===false)return;
 if(window.SELFCareerPhase2?.beforeNavigate?.()===false)return;
 ui.page=id;ui.drawer=null;ui.modal=null;ui.dirty=false;ui.saveError='';host.render();
}
async function save(form){
 if(ui.busy)return;
 const kind=form.dataset.kind,table=TYPES[kind],isEdit=form.id==='career-edit',id=form.dataset.id;
 if(!table)return;
 const vals=Object.fromEntries(new FormData(form).entries());
 const inlineError=message=>{ui.saveError=message;const node=form.querySelector('.career-save-note');if(node)node.textContent=message};
 const clean=v=>String(v||'').trim();
 const payload={};
 const keys=kind==='company'?['name','industry','location','website','notes']:
  kind==='person'?['full_name','role_title','company_id','email','profile_url','relationship_stage','last_contacted_at','notes']:
  ['role_title','company_id','hiring_stage','applied_at','source_url','notes'];
 for(const key of keys)payload[key]=clean(vals[key]);
 for(const key of ['website','profile_url','source_url','company_id','applied_at','last_contacted_at']){
  if(key in payload&&!payload[key])payload[key]=null;
 }
 for(const key of ['website','profile_url','source_url']){
  if(payload[key]&&!safeUrl(payload[key])){inlineError('Use an http(s) URL.');return}
  if(payload[key])payload[key]=safeUrl(payload[key]);
 }
 if(kind==='company'&&!payload.name||kind==='person'&&!payload.full_name||
  kind==='application'&&(!payload.role_title||!payload.company_id)){
  inlineError('Complete the required fields.');return;
 }
 if(kind==='person'&&!validEmail(payload.email)){inlineError('Check the email address.');return}
 ui.busy=true;ui.saveError='';
 const submit=form.querySelector('button[type="submit"]');
 if(submit){submit.disabled=true;submit.textContent='Saving…'}
 try{
  if(isEdit)await host.patch(table,id,payload);
  else await host.insert(table,payload);
  ui.dirty=false;ui.modal=null;ui.drawer=isEdit?{kind,id}:null;
  await load();
  host.notify(names[kind]+(isEdit?' updated':' created'));
 }catch(e){
  ui.saveError='Not saved: '+(e?.message||String(e));host.notify(ui.saveError,true);
  // Leave the actual inputs mounted on failure, so user can correct and retry.
  const note=form.querySelector('.career-save-note');
  if(note)note.textContent=ui.saveError;
 }finally{
  ui.busy=false;
  if(submit?.isConnected){submit.disabled=false;submit.textContent=isEdit?'Save changes':'Create '+names[kind]}
 }
}
async function erase(kind,id){
 const row=find(kind,id);if(!row)return;
 if(!confirm('Delete '+names[kind]+' "'+(row.name||row.full_name||row.role_title)+'"? This cannot be undone.'))return;
 if(ui.busy)return;
 ui.busy=true;
 try{
  await host.del(TYPES[kind],id);
  ui.drawer=null;ui.dirty=false;
  await load();
  host.notify(names[kind]+' deleted');
 }catch(e){
  ui.saveError='Delete failed: '+(e?.message||String(e));
  host.notify(ui.saveError,true);
  // Company delete can be refused by FK while related people/apps remain.
  host.render();
 }finally{ui.busy=false}
}
async function action(e){
 if(await window.SELFCareerLearning?.action?.(e))return true;
 if(await window.SELFCareerPhase3?.action?.(e))return true;
 if(await window.SELFCareerPhase2?.action?.(e))return true;
 const b=e.target.closest?.('[data-career]');
 if(!b)return false;
 e.preventDefault();e.stopPropagation();
 const x=b.dataset.career;
 if(x==='page')setPage(b.dataset.page);
 if(x==='toggle-rail'){ui.railCollapsed=!ui.railCollapsed;host.render()}
 if(x==='toggle-sections'){
  const root=document.querySelector('.career-workspace');
  root?.classList.toggle('career-sections-open');
 }
 if(x==='quick-capture'){ui.modal='choose';ui.drawer=null;ui.saveError='';ui.dirty=false;host.render();focusCareerDialog()}
 if(x==='choose-kind'){if(b.dataset.kind==='task'){ui.modal=null;host.newTask();return true}ui.modal=b.dataset.kind;ui.saveError='';host.render();focusCareerDialog()}
 if(x==='new'){
  if(b.dataset.kind==='application'&&!ui.companies.length){ui.modal='company';ui.saveError='';ui.drawer=null;host.render();return true}
  ui.modal=b.dataset.kind;ui.drawer=null;ui.saveError='';ui.dirty=false;host.render();focusCareerDialog();
 }
 if(x==='open'){if(ui.dirty&&!confirm('Discard unsaved edits?'))return true;ui.drawer={kind:b.dataset.kind,id:b.dataset.id};ui.modal=null;ui.saveError='';ui.dirty=false;host.render();focusCareerDialog()}
 if(x==='close-modal')clearPanel();
 if(x==='close-drawer')clearPanel();
 if(x==='delete')await erase(b.dataset.kind,b.dataset.id);
 if(x==='retry')await load();
 if(x==='go-work'){ui.dirty=false;ui.drawer=null;ui.modal=null;host.navigate('work')}
 return true;
}
async function submit(e){
 if(await window.SELFCareerPhase3?.submit?.(e))return true;
 if(await window.SELFCareerPhase2?.submit?.(e))return true;
 if(!/^career-(create|edit)$/.test(e.target?.id||''))return false;
 e.preventDefault();e.stopPropagation();
 await save(e.target);return true;
}
function input(e){
 if(window.SELFCareerLearning?.input?.(e))return true;
 if(window.SELFCareerPhase3?.input?.(e))return true;
 if(window.SELFCareerPhase2?.input?.(e))return true;
 if(!e.target?.closest?.('.career-record-form'))return false;
 ui.dirty=true;ui.saveError='';
 const el=e.target.closest('.career-record-form')?.querySelector('.career-save-note');
 if(el)el.textContent='Unsaved changes';
 return true;
}
function keydown(e){
 if(window.SELFCareerPhase3?.keydown?.(e))return true;
 if(window.SELFCareerPhase2?.keydown?.(e))return true;
 if(e.key!=='Escape'||(!ui.modal&&!ui.drawer))return false;
 e.stopImmediatePropagation?.();e.preventDefault();clearPanel();return true;
}
function links(){
 if(!host?.state?.()?.user?.id||host.state().user.id!==ui.owner)return [];
 return [
  ...ui.companies.filter(x=>safeUrl(x.website)).map(x=>({id:x.id,title:x.name+' — website',url:safeUrl(x.website),boardName:'Career · Company'})),
  ...ui.people.filter(x=>safeUrl(x.profile_url)).map(x=>({id:x.id,title:x.full_name+' — profile',url:safeUrl(x.profile_url),boardName:'Career · Person'})),
  ...ui.applications.filter(x=>safeUrl(x.source_url)).map(x=>({id:x.id,title:x.role_title+' — posting',url:safeUrl(x.source_url),boardName:'Career · Application'})),
  ...(window.SELFCareerPhase3?.links?.()||[])
 ];
}
window.SELFCareer={init(api){host=api;window.SELFCareerPhase2?.init?.({career:window.SELFCareer,host:api});window.SELFCareerPhase3?.init?.({career:window.SELFCareer,host:api});window.SELFCareerLearning?.init?.({career:window.SELFCareer,host:api})},enter,render,action,submit,input,keydown,links,reload:load,ui};
})();

