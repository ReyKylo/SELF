/* SELF Hunt: Company Dossier and Game Day.
   Dossier: one page per company that merges records SELF already holds (applications, people, touchpoints, interviews, Radar items, boards).
   Game Day: an interview cockpit (before / during / after). Nothing is fetched from outside, nothing is scored, no schema change.
   Pure helpers are exported for tests; the UI reuses the Career records and the existing save paths (host.insert / patch). */
(function(root){
'use strict';
const TRACKS=[['PE','PE'],['VC','VC'],['CONSULTING','Consulting']];
const HOUR=3600e3,DAY=24*HOUR;
const ms=v=>{const t=Date.parse(v);return Number.isFinite(t)?t:null};
const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

/* ---------- pure ---------- */
function trackOf(interview,application){
 const m=/^\s*track:\s*(pe|vc|consulting)\s*$/im.exec(interview?.prep_notes||'');
 if(m)return m[1].toUpperCase();
 const role=norm(application?.role_title);
 if(/venture|\bvc\b/.test(role))return 'VC';
 if(/consult|strategy/.test(role))return 'CONSULTING';
 if(/private equity|\bpe\b|buyout/.test(role))return 'PE';
 return null;
}
function withTrack(notes,track){
 const line='Track: '+(TRACKS.find(t=>t[0]===track)?.[1]||track);
 const text=String(notes||'');
 return /^\s*track:.*$/im.test(text)?text.replace(/^\s*track:.*$/im,line):(line+(text?'\n':'')+text);
}
function phaseOf(interview,now=Date.now()){
 const at=ms(interview?.scheduled_at);
 if(at==null||now<at)return 'before';
 return now<at+2*HOUR?'during':'after';
}
function reflectDue(interview,now=Date.now(),dismissed=[]){
 const at=ms(interview?.scheduled_at);
 if(at==null||String(interview.reflection||'').trim())return false;
 if(dismissed.includes(interview.id))return false;
 const age=now-at;
 return age>=DAY&&age<=14*DAY;
}
function questionsFor(panels,track){
 const t=(panels?.tracks||[]).find(x=>x.id===track);
 return t?{opening:t.opening||'',reviewer:t.reviewer_role||'',challenges:(t.challenges||[]).map(c=>({id:c.id,prompt:c.prompt}))}:null;
}
const fmtClock=s=>{const m=Math.floor(s/60),r=Math.floor(s%60);return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')};

/* data: {company, applications, people, touchpoints, interviews, radar, boards} (all arrays of full records). Returns the merged dossier. */
function build(data,now=Date.now()){
 const c=data.company;if(!c)return null;
 const apps=(data.applications||[]).filter(a=>a.company_id===c.id);
 const appIds=new Set(apps.map(a=>a.id));
 const people=(data.people||[]).filter(p=>p.company_id===c.id);
 const personIds=new Set(people.map(p=>p.id));
 const touches=(data.touchpoints||[]).filter(t=>personIds.has(t.person_id));
 const interviews=(data.interviews||[]).filter(i=>appIds.has(i.application_id));
 const key=norm(c.name);
 const radar=(data.radar||[]).filter(r=>key&&norm(r.company_name)===key);
 const work=(data.boards||[]).filter(b=>key&&norm(b.title||b.name).includes(key));
 /* last touch per person comes only from real touchpoints; no touchpoint means null, never a guess */
 const lastTouch=new Map();
 for(const t of touches){const at=ms(t.contact_at);if(at!=null&&(!lastTouch.has(t.person_id)||at>lastTouch.get(t.person_id)))lastTouch.set(t.person_id,at)}
 const peopleRows=people.map(p=>({person:p,last:lastTouch.has(p.id)?lastTouch.get(p.id):null,days:lastTouch.has(p.id)?Math.floor((now-lastTouch.get(p.id))/DAY):null}));
 const tl=[];
 const personName=id=>people.find(p=>p.id===id)?.full_name||'Someone';
 for(const t of touches){const at=ms(t.contact_at);if(at!=null)tl.push({at,kind:'touch',title:personName(t.person_id),sub:[t.channel,t.summary].filter(Boolean).join(' · '),open:{kind:'person',id:t.person_id}})}
 for(const a of apps){const at=ms(a.applied_at)??ms(a.created_at);if(at!=null)tl.push({at,kind:'application',title:a.role_title,sub:'Application · '+a.hiring_stage,open:{kind:'application',id:a.id}})}
 for(const i of interviews){const at=ms(i.scheduled_at);if(at!=null)tl.push({at,kind:'interview',title:i.title,sub:['Interview',i.format,i.stage].filter(Boolean).join(' · '),open:{kind:'interview',id:i.id}})}
 for(const r of radar){const at=ms(r.posted_at)??ms(r.created_at);if(at!=null)tl.push({at,kind:'radar',title:r.role_title,sub:'Radar · '+(r.status||'new'),open:{kind:'radar',id:r.id}})}
 tl.sort((x,y)=>y.at-x.at);
 return {company:c,applications:apps,people:peopleRows,interviews:interviews.slice().sort((a,b)=>(ms(a.scheduled_at)??0)-(ms(b.scheduled_at)??0)),radar,work,timeline:tl};
}

const api={TRACKS,trackOf,withTrack,phaseOf,reflectDue,questionsFor,fmtClock,build,norm};
root.SELFDossier=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI ================= */
let host=null,core=null,panelsPromise=null,tick=null;
const S={company:null,gameday:null,timer:{start:null,acc:0},reflection:null,notesDraft:null,busy:false};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d=null){try{const v=root.localStorage?.getItem('self.dossier.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{root.localStorage?.setItem('self.dossier.'+k,JSON.stringify(v))}catch{}}};
const studyOk=()=>!!root.SELFAccess?.study?.(host?.state?.()?.user);
const p2=()=>root.SELFCareerPhase2?.ui||{};
const p3=()=>root.SELFCareerPhase3?.ui||{};
const dateTxt=v=>{const t=ms(v);return t==null?'':new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};
const dateTime=v=>{const t=ms(v);return t==null?'':new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
const safeHttp=u=>{try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:null}catch{return null}};
const btn=(label,action,extra='',cls='career-btn')=>'<button type="button" class="'+cls+'" data-dossier="'+action+'" '+extra+'>'+label+'</button>';

function init(args){core=args.career;host=args.host}
function loadPanels(){
 if(!panelsPromise)panelsPromise=fetch('./content/career-director-review/review-panels.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).catch(e=>{panelsPromise=null;S.panelsError=e.message;return null});
 return panelsPromise;
}
function dataFor(id){
 const c=core.ui.companies.find(x=>x.id===id);
 return build({company:c,applications:core.ui.applications,people:core.ui.people,touchpoints:p2().touchpoints,interviews:p2().interviews,radar:p3().items,boards:host.state().boards});
}

/* ---------- Dossier ---------- */
const KIND_LABEL={touch:'Touch',application:'Applied',interview:'Interview',radar:'Radar'};
function renderDossier(){
 const d=dataFor(S.company);
 if(!d)return '<p class="career-soft-empty">That company is no longer here. '+btn('Back to companies','back')+'</p>';
 const c=d.company,site=safeHttp(c.website);
 const notes=S.notesDraft!=null?S.notesDraft:(c.notes||'');
 return '<div class="dossier" data-dossier-root>'+
  '<div class="dossier-head">'+btn('← Companies','back')+'<div><h2>'+h(c.name)+'</h2><p>'+h([c.industry,c.location].filter(Boolean).join(' · ')||'No details yet')+(site?' · <a href="'+h(site)+'" target="_blank" rel="noopener noreferrer">Website</a>':'')+'</p></div>'+
  '<div class="dossier-actions">'+btn('Edit company','edit-company','data-id="'+h(c.id)+'"')+(d.interviews.length?'':'')+'</div></div>'+
  '<div class="dossier-grid">'+
  '<section class="career-card"><div class="career-small-heading"><strong>Applications</strong><span>'+d.applications.length+'</span></div>'+
   (d.applications.map(a=>'<button type="button" class="dossier-row" data-dossier="open" data-kind="application" data-id="'+h(a.id)+'"><strong>'+h(a.role_title)+'</strong><small>'+h(a.hiring_stage)+(a.applied_at?' · '+h(dateTxt(a.applied_at)):'')+'</small></button>').join('')||'<p class="career-soft-empty">No application yet.</p>')+'</section>'+
  '<section class="career-card"><div class="career-small-heading"><strong>People</strong><span>'+d.people.length+'</span></div>'+
   (d.people.map(r=>'<button type="button" class="dossier-row" data-dossier="open" data-kind="person" data-id="'+h(r.person.id)+'"><strong>'+h(r.person.full_name)+'</strong><small>'+h([r.person.role_title,r.person.relationship_stage].filter(Boolean).join(' · '))+(r.days==null?'':' · last touch '+r.days+'d ago')+'</small></button>').join('')||'<p class="career-soft-empty">No one saved here. Add people in Outreach.</p>')+'</section>'+
  '<section class="career-card"><div class="career-small-heading"><strong>Interviews</strong><span>'+d.interviews.length+'</span></div>'+
   (d.interviews.map(i=>'<div class="dossier-row dossier-row-split"><span><strong>'+h(i.title)+'</strong><small>'+h(dateTime(i.scheduled_at)||'No date')+'</small></span>'+btn('Game Day','gameday','data-id="'+h(i.id)+'"')+'</div>').join('')||'<p class="career-soft-empty">No interviews yet.</p>')+'</section>'+
  '<section class="career-card"><div class="career-small-heading"><strong>Your work</strong><span>'+d.work.length+'</span></div>'+
   (d.work.map(b=>'<button type="button" class="dossier-row" data-dossier="board" data-id="'+h(b.id)+'"><strong>'+h(b.title||b.name)+'</strong><small>Board</small></button>').join('')||'<p class="career-soft-empty">No board with this company in its title.</p>')+'</section>'+
  '</div>'+
  '<section class="career-card dossier-notes"><div class="career-small-heading"><strong>Research notes</strong></div>'+
   '<textarea class="career-field" rows="5" data-dossier-notes aria-label="Research notes for '+h(c.name)+'" placeholder="What you learned about this firm.">'+h(notes)+'</textarea>'+
   '<div class="dossier-notes-bar"><small data-dossier-note-state>'+(S.notesDraft!=null&&S.notesDraft!==(c.notes||'')?'Unsaved':'')+'</small>'+btn('Save notes','save-notes','','career-btn career-primary')+'</div></section>'+
  '<section class="career-card"><div class="career-small-heading"><strong>Timeline</strong><span>'+d.timeline.length+'</span></div>'+
   (d.timeline.length?'<ol class="dossier-timeline">'+d.timeline.map((e,i)=>'<li><button type="button" class="dossier-row" data-dossier="tl" data-i="'+i+'"><span class="dossier-tag dossier-tag-'+e.kind+'">'+KIND_LABEL[e.kind]+'</span><span><strong>'+h(e.title)+'</strong><small>'+h(dateTxt(e.at)+(e.sub?' · '+e.sub:''))+'</small></span></button></li>').join('')+'</ol>':'<p class="career-soft-empty">The timeline fills in as you log touches, applications and interviews.</p>')+'</section></div>';
}

/* ---------- Game Day ---------- */
function gamedayData(){
 const i=p2().interviews?.find(x=>x.id===S.gameday);if(!i)return null;
 const app=core.ui.applications.find(a=>a.id===i.application_id),co=core.ui.companies.find(c=>c.id===app?.company_id);
 return {i,app,co};
}
function elapsed(){return S.timer.acc+(S.timer.start?(Date.now()-S.timer.start)/1000:0)}
function renderGameDay(){
 const g=gamedayData();
 if(!g)return '<p class="career-soft-empty">That interview is no longer here. '+btn('Back','gd-back')+'</p>';
 const {i,app,co}=g,phase=phaseOf(i),track=trackOf(i,app);
 const dossierLink=co?btn('Open dossier','open-dossier','data-id="'+h(co.id)+'"'):'';
 const phases=[['before','Before'],['during','During'],['after','After']];
 const shown=S.phaseView||phase;
 let body='';
 if(shown==='before'||shown==='during'){
  const q=S.panels&&track?questionsFor(S.panels,track):null;
  const stories=(host.state().boards||[]).filter(b=>/story/i.test(b.title||b.name||''));
  body+=(!studyOk()?'':'<section class="career-card"><div class="career-small-heading"><strong>Practice questions</strong>'+(track?'<span>'+h(TRACKS.find(t=>t[0]===track)[1])+'</span>':'')+'</div>'+
   (track?'':'<p class="career-soft-empty">Pick the track of this interview once. It is saved in the prep notes as a "Track:" line.</p><div class="dossier-pills">'+TRACKS.map(t=>btn(h(t[1]),'set-track','data-track="'+t[0]+'"')).join('')+'</div>')+
   (track&&q?'<p class="dossier-open"><em>'+h(q.opening)+'</em></p><ol class="dossier-questions">'+q.challenges.map(c=>'<li>'+h(c.prompt)+'</li>').join('')+'</ol><p class="career-form-hint">Practice only. Nothing here is scored.</p>':'')+
   (track&&!q?'<p class="career-soft-empty">'+(S.panelsError?'Questions could not load: '+h(S.panelsError):'Loading questions…')+'</p>':'')+'</section>')+
   '<section class="career-card"><div class="career-small-heading"><strong>Stories</strong></div>'+
   (stories.length?stories.map(b=>'<button type="button" class="dossier-row" data-dossier="board" data-id="'+h(b.id)+'"><strong>'+h(b.title||b.name)+'</strong><small>Board</small></button>').join(''):'<p class="career-soft-empty">No story bank yet.</p>'+(root.SELFBoards?.createFromRecipe?btn('Create a Story Bank','story-bank'):''))+'</section>'+
   '<section class="career-card"><div class="career-small-heading"><strong>Drill timer</strong></div><div class="dossier-timer"><output data-dossier-clock aria-live="off">'+fmtClock(elapsed())+'</output>'+
   btn(S.timer.start?'Pause':'Start','timer')+btn('Reset','timer-reset')+'</div><p class="career-form-hint">Stays on this device. Nothing is recorded.</p></section>'+
   '<section class="career-card"><div class="career-small-heading"><strong>Prep notes</strong></div><p class="dossier-prep">'+(h(i.prep_notes||'').replace(/\n/g,'<br>')||'<span class="career-soft-empty">No prep notes yet.</span>')+'</p>'+'<button type="button" class="career-btn" data-career2="open-modal" data-type="interview" data-id="'+h(i.id)+'">Edit prep</button>'+'</section>';
 }else{
  const val=S.reflection!=null?S.reflection:(i.reflection||'');
  body+='<section class="career-card"><div class="career-small-heading"><strong>Reflection</strong></div>'+
   '<textarea class="career-field" rows="6" data-dossier-reflection aria-label="Reflection" placeholder="What went well, what you would change, what they asked.">'+h(val)+'</textarea>'+
   '<div class="dossier-notes-bar">'+btn('Save reflection','save-reflection','','career-btn career-primary')+(i.reflection?'':btn('Not now','dismiss-reflect'))+'</div></section>'+
   '<section class="career-card"><div class="career-small-heading"><strong>Thank-you</strong></div><p class="career-soft-empty">Creates one task in My Work, linked to the application. Nothing is sent.</p>'+
   (app?btn('Create thank-you task','thanks'):'')+'</section>';
 }
 return '<div class="dossier gameday">'+
  '<div class="dossier-head">'+btn('← Interview Prep','gd-back')+'<div><h2>'+h(i.title)+'</h2><p>'+h([co?.name,app?.role_title,dateTime(i.scheduled_at),i.format].filter(Boolean).join(' · '))+'</p></div><div class="dossier-actions">'+dossierLink+'</div></div>'+
  '<div class="dossier-phases" role="group" aria-label="Phase">'+phases.map(([k,l])=>'<button type="button" class="dossier-phase'+(shown===k?' active':'')+'" data-dossier="phase" data-phase="'+k+'" aria-pressed="'+(shown===k)+'">'+l+(phase===k?' · now':'')+'</button>').join('')+'</div>'+body+'</div>';
}
function renderInterviewsStrip(){
 const list=(p2().interviews||[]).slice().sort((a,b)=>(ms(b.scheduled_at)??0)-(ms(a.scheduled_at)??0));
 if(!list.length)return '';
 return '<section class="career-card dossier-strip"><div class="career-small-heading"><strong>Game Day</strong><span>'+list.length+'</span></div>'+list.slice(0,6).map(i=>'<div class="dossier-row dossier-row-split"><span><strong>'+h(i.title)+'</strong><small>'+h(dateTime(i.scheduled_at)||'No date')+'</small></span>'+btn('Game Day','gameday','data-id="'+h(i.id)+'"')+'</div>').join('')+'</section>';
}
/* page hooks for career.js */
function renderCompanies(){return S.company?renderDossier():null}
function renderInterviews(){
 if(S.gameday){if(studyOk()&&!S.panels&&!S.panelsAsked){S.panelsAsked=true;loadPanels().then(p=>{S.panels=p;host.render()})}return renderGameDay()}
 return renderInterviewsStrip()+(root.SELFCareerPhase2?.renderInterviews?.()||'');
}
function companyButton(c){return '<button type="button" class="career-btn dossier-open-btn" data-dossier="open-dossier" data-id="'+h(c.id)+'" aria-label="Open dossier for '+h(c.name)+'">Dossier</button>'}

function startClock(){
 stopClock();
 tick=setInterval(()=>{const o=root.document.querySelector('[data-dossier-clock]');if(o)o.textContent=fmtClock(elapsed());else stopClock()},500);
}
function stopClock(){if(tick){clearInterval(tick);tick=null}}

async function patchInterview(id,patch){
 await host.patch('career_interviews',id,patch);
 await root.SELFCareerPhase2?.load?.(core.ui.owner);
}
async function action(e){
 const b=e.target.closest?.('[data-dossier]');
 if(!b)return false;
 e.preventDefault();e.stopPropagation();
 const a=b.dataset.dossier,id=b.dataset.id;
 if(S.busy&&['save-notes','save-reflection','thanks'].includes(a))return true;
 if(a==='open-dossier'){S.company=id;S.notesDraft=null;core.setPage('companies');S.company=id;host.render()}
 else if(a==='back'){S.company=null;S.notesDraft=null;host.render()}
 else if(a==='open'){core.ui.drawer={kind:b.dataset.kind,id};host.render()}
 else if(a==='edit-company'){core.ui.drawer={kind:'company',id};host.render()}
 else if(a==='board'){host.openBoard?host.openBoard(id):root.SELFBoards?.open?.(id)}
 else if(a==='tl'){
  const d=dataFor(S.company),ev=d?.timeline[+b.dataset.i];if(!ev)return true;
  if(ev.open.kind==='interview'){S.gameday=ev.open.id;S.phaseView=null;core.setPage('interviews');S.gameday=ev.open.id;host.render()}
  else if(ev.open.kind==='radar'){const keep=S.company;core.setPage('radar');S.company=keep}
  else{core.ui.drawer={kind:ev.open.kind,id:ev.open.id};host.render()}
 }
 else if(a==='save-notes'){
  const ta=root.document.querySelector('[data-dossier-notes]'),c=core.ui.companies.find(x=>x.id===S.company);if(!ta||!c)return true;
  S.busy=true;
  try{await host.patch('career_companies',c.id,{notes:ta.value});c.notes=ta.value;S.notesDraft=null;host.notify('Notes saved')}
  catch(err){S.notesDraft=ta.value;host.notify('Not saved: '+(err?.message||err),true)}
  finally{S.busy=false;host.render()}
 }
 else if(a==='gameday'){S.gameday=id;S.phaseView=null;S.reflection=null;stopClock();S.timer={start:null,acc:0};core.setPage('interviews');S.gameday=id;host.render()}
 else if(a==='gd-back'){S.gameday=null;stopClock();S.timer={start:null,acc:0};host.render()}
 else if(a==='phase'){S.phaseView=b.dataset.phase;host.render()}
 else if(a==='timer'){if(S.timer.start){S.timer.acc=elapsed();S.timer.start=null;stopClock()}else{S.timer.start=Date.now();startClock()}host.render()}
 else if(a==='timer-reset'){S.timer={start:null,acc:0};stopClock();host.render()}
 else if(a==='set-track'){
  const g=gamedayData();if(!g)return true;
  try{await patchInterview(g.i.id,{prep_notes:withTrack(g.i.prep_notes,b.dataset.track)})}catch(err){host.notify('Not saved: '+(err?.message||err),true)}
  host.render();
 }
 else if(a==='story-bank'){S.busy=true;try{await root.SELFBoards.createFromRecipe('Story Bank','story-bank',{})}finally{S.busy=false}}
 else if(a==='save-reflection'){
  const ta=root.document.querySelector('[data-dossier-reflection]'),g=gamedayData();if(!ta||!g)return true;
  S.busy=true;
  try{await patchInterview(g.i.id,{reflection:ta.value});S.reflection=null;host.notify('Reflection saved')}
  catch(err){S.reflection=ta.value;host.notify('Not saved: '+(err?.message||err),true)}
  finally{S.busy=false;host.render()}
 }
 else if(a==='dismiss-reflect'){const g=gamedayData();if(g){const list=store.get('dismissed',[]);if(!list.includes(g.i.id))store.set('dismissed',[...list,g.i.id])}host.notify('Reminder dismissed');host.render()}
 else if(a==='thanks'){
  const g=gamedayData();if(!g?.app)return true;
  S.busy=true;
  try{
   const task=await host.insert('tasks',{title:'Thank-you note: '+(g.co?.name||g.app.role_title),status:'todo',due_date:new Date().toLocaleDateString('en-CA')});
   try{await host.insert('career_task_links',{task_id:task.id,application_id:g.app.id});host.notify('Thank-you task created')}
   catch(err){host.notify('Task created, but not linked: '+(err?.message||err),true)}
   await host.reloadCore?.();await root.SELFCareerPhase2?.load?.(core.ui.owner);
  }catch(err){host.notify('Not created: '+(err?.message||err),true)}
  finally{S.busy=false;host.render()}
 }
 return true;
}
function input(e){
 const t=e.target;
 if(t.matches?.('[data-dossier-notes]')){S.notesDraft=t.value;const s=root.document.querySelector('[data-dossier-note-state]');if(s)s.textContent='Unsaved';return true}
 if(t.matches?.('[data-dossier-reflection]')){S.reflection=t.value;return true}
 return false;
}
function nav(){S.company=null;S.gameday=null;S.notesDraft=null;stopClock()}
function dismissed(){return store.get('dismissed',[])}
function reset(){stopClock();Object.assign(S,{company:null,gameday:null,phaseView:null,timer:{start:null,acc:0},reflection:null,notesDraft:null,busy:false})}
Object.assign(api,{init,reset,nav,action,input,renderCompanies,renderInterviews,companyButton,dismissed,state:S});
})(typeof window!=='undefined'?window:globalThis);
