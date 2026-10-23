/* SELF Today room: Three for today, a merged agenda and one-at-a-time inbox triage.
   Nothing here adds a table or invents data. Pins are a per-device convenience in localStorage; every other write
   goes through the existing insert/patch/del. Pure helpers (pickThree, buildAgenda, triageQueue) are unit-tested. */
(function(root){
'use strict';
let host=null;
const skipped=new Set();            // "Keep for later": this session only
const pendingDelete=new Map();      // inbox id -> timer; the request is sent only after the Undo window closes
const UNDO_MS=5000,SWIPE=110;
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------- pins (per device, per day) ---------- */
const pinKey=(userId,day)=>'self.today.'+userId+'.'+day;
function readPins(storage,userId,day){
 try{const v=JSON.parse(storage.getItem(pinKey(userId,day))||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,3):[]}catch{return []}
}
function writePins(storage,userId,day,ids){try{storage.setItem(pinKey(userId,day),JSON.stringify(ids.slice(0,3)))}catch{}}

/* ---------- Three for today ---------- */
/* Pinned open tasks first (in pin order), then the best-ranked open tasks. A pinned task that is done or deleted drops out. */
function pickThree({tasks,pins=[],rank}){
 const open=tasks.filter(t=>t.status!=='done'),byId=new Map(open.map(t=>[t.id,t]));
 const three=[];
 for(const id of pins){const t=byId.get(id);if(t&&!three.includes(t))three.push(t)}
 const rest=open.filter(t=>!three.includes(t)).sort(rank);
 while(three.length<3&&rest.length)three.push(rest.shift());
 return {three,candidates:open.filter(t=>!three.includes(t)).sort(rank),open:open.length};
}

/* ---------- Agenda ---------- */
const daysBetween=(from,to)=>Math.floor((Date.parse(to)-Date.parse(from))/864e5);
const hhmm=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false});
const dayLabel=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',weekday:'short',day:'numeric',month:'short'});
const FOLLOW_STAGES=['reached_out','in_conversation'];
const STALE_DAYS=14,WEEK=7*24*3600*1000,MAX_ITEMS=8;
/* Merges tasks due today or overdue, interviews in the next 7 days and follow-ups. Career data is optional. */
function buildAgenda({tasks=[],day,now=Date.now(),career=null}){
 const items=[];
 const open=tasks.filter(t=>t.status!=='done'&&t.due_date&&t.due_date<=day).sort((a,b)=>a.due_date.localeCompare(b.due_date)||String(a.id).localeCompare(String(b.id)));
 for(const t of open){
  const late=daysBetween(t.due_date,day);
  items.push({key:'task:'+t.id,kind:'task',tone:late>0?'alert':'task',time:late>0?late+'d late':'Today',title:t.title,sub:late>0?'Task · overdue':'Task · due today',open:{action:'open-task',id:t.id}});
 }
 if(career){
  const apps=career.applications||[],companies=career.companies||[];
  const companyName=id=>companies.find(c=>c.id===id)?.name||'';
  const upcoming=(career.interviews||[]).filter(i=>{
   if(i.stage!=='scheduled'||!i.scheduled_at)return false;const at=Date.parse(i.scheduled_at);return Number.isFinite(at)&&at>=now&&at<=now+WEEK
  }).sort((a,b)=>Date.parse(a.scheduled_at)-Date.parse(b.scheduled_at));
  for(const i of upcoming){
   const at=new Date(i.scheduled_at),app=apps.find(a=>a.id===i.application_id);
   const sameDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(at)===day;
   items.push({key:'interview:'+i.id,kind:'interview',tone:'hunt',time:(sameDay?'':dayLabel.format(at)+' ')+hhmm.format(at),title:i.title,
    sub:['Interview',app?[app.role_title,companyName(app.company_id)].filter(Boolean).join(' · '):'',i.format].filter(Boolean).join(' · '),open:{action:'open-career',page:'interviews'}});
  }
  const latest=new Map();
  for(const tp of career.touchpoints||[]){const cur=latest.get(tp.person_id);if(!cur||String(tp.contact_at)>String(cur.contact_at)||(tp.contact_at===cur.contact_at&&String(tp.created_at)>String(cur.created_at)))latest.set(tp.person_id,tp)}
  const follows=[],suggested=[];
  for(const p of career.people||[]){
   const tp=latest.get(p.id);
   if(tp?.next_step?.trim()){follows.push({key:'follow:'+p.id,kind:'follow',tone:'person',time:'Follow up',title:p.full_name,sub:'Next step · '+tp.next_step.trim(),open:{action:'open-career',page:'people'},sort:String(tp.contact_at)});continue}
   if(!FOLLOW_STAGES.includes(p.relationship_stage))continue;
   const last=[p.last_contacted_at,tp?.contact_at].filter(Boolean).sort().pop();
   if(!last)continue;                                   // no contact logged: nothing to measure
   const age=daysBetween(last,day);
   if(age>STALE_DAYS)suggested.push({key:'suggest:'+p.id,kind:'suggest',tone:'person',time:'Suggested',title:p.full_name,sub:'Last contact '+age+' days ago',open:{action:'open-career',page:'people'},age});
  }
  follows.sort((a,b)=>a.sort.localeCompare(b.sort));suggested.sort((a,b)=>b.age-a.age);
  items.push(...follows,...suggested);
 }
 return {items:items.slice(0,MAX_ITEMS),hidden:Math.max(0,items.length-MAX_ITEMS)};
}

/* ---------- Inbox triage ---------- */
function triageQueue(inbox,skippedIds,pendingIds){
 return inbox.filter(x=>!x.space_id&&!skippedIds.has(x.id)&&!pendingIds.has(x.id)).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))||String(a.id).localeCompare(String(b.id)));
}

/* ---------- rendering ---------- */
function careerData(){
 const c=root.SELFCareer?.ui,p=root.SELFCareerPhase2?.ui;
 if(!c?.ready||!p?.ready)return null;
 return {people:c.people||[],applications:c.applications||[],companies:c.companies||[],interviews:p.interviews||[],touchpoints:p.touchpoints||[]};
}
function render(){
 const {state,esc,attr,ic,today,spaceOf,statusOf,dueBadge}=host,day=today(),st=state();
 const storage=root.localStorage;
 const {three,candidates,open}=pickThree({tasks:st.tasks,pins:readPins(storage,st.user?.id,day),rank:host.rank});
 const doneToday=st.tasks.filter(t=>t.status==='done'&&String(t.updated_at||'').slice(0,10)===day).length;
 const checklist=id=>{const all=st.checklist.filter(c=>c.task_id===id);return {n:all.length,done:all.filter(c=>c.is_done).length}};
 const row=(t,i)=>{
  const c=checklist(t.id),pct=c.n?Math.round(c.done/c.n*100):0;
  return '<article class="three-row" data-dnd-item="'+attr(t.id)+'" data-dnd-type="three" data-action="open-task" data-id="'+attr(t.id)+'" tabindex="0" role="group" aria-roledescription="Draggable task" aria-describedby="dnd-help" aria-label="'+attr(t.title)+'">'+
   '<span class="three-num" aria-hidden="true">'+(i+1)+'</span>'+
   '<input type="checkbox" class="check" aria-label="Mark done: '+attr(t.title)+'" data-action="toggle-task" data-id="'+attr(t.id)+'"/>'+
   '<div class="three-core"><strong>'+esc(t.title)+'</strong><small>'+esc(spaceOf(t.space_id)?.name||'Unsorted')+' · '+esc(statusOf(t.status)[1])+(c.n?' · '+c.done+'/'+c.n+' steps':'')+'</small>'+
   (c.n?'<div class="mini-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></div>':'')+'</div>'+
   dueBadge(t.due_date)+
   (candidates.length?'<select class="today-swap" data-today-swap="'+attr(t.id)+'" aria-label="Swap '+attr(t.title)+' for another task"><option value="">Swap…</option>'+candidates.slice(0,5).map(x=>'<option value="'+attr(x.id)+'">'+esc(x.title.length>38?x.title.slice(0,37)+'…':x.title)+'</option>').join('')+'</select>':'')+
   '<button type="button" class="grip" data-dnd-grip tabindex="-1" aria-label="Drag handle for '+attr(t.title)+'">⋮⋮</button></article>';
 };
 const threeCard='<section class="card card-pad today-three" aria-labelledby="three-h"><div class="section-head"><h2 id="three-h">Three for today</h2><span class="small-sub">'+doneToday+' finished today</span></div>'+
  '<p class="today-sub">From overdue, due today and high priority. Drag to reorder, or swap any of them.</p>'+
  (three.length?'<div class="three-list" data-dnd-zone="three:today">'+three.map(row).join('')+'</div>':'<div class="empty-mini">Nothing open. Add a task, or enjoy the quiet.</div>')+
  (open>three.length?'<p class="three-more">+'+(open-three.length)+' more open <button type="button" class="link-action" data-action="nav" data-view="work">See all '+ic('chevron',13)+'</button></p>':'')+
  '<p id="dnd-help" class="sr-only">Press Space to pick up. Use the up and down arrow keys to reorder. Press Space to drop or Escape to cancel.</p><div id="dnd-live" class="sr-only" aria-live="assertive"></div></section>';

 /* agenda */
 const career=careerData(),loading=!!root.SELFCareer?.ui?.loading;
 const agenda=buildAgenda({tasks:st.tasks,day,career});
 const tones={alert:'var(--alert,#f68e94)',task:'var(--room-today,#428cff)',hunt:'var(--room-hunt,#3dce9e)',person:'var(--room-study,#ad92fa)'};
 const agendaCard='<section class="card card-pad today-agenda" aria-labelledby="agenda-h"><div class="section-head"><h2 id="agenda-h">Agenda</h2></div>'+
  (agenda.items.length?'<ul class="agenda-list">'+agenda.items.map(a=>
   '<li><time>'+esc(a.time)+'</time><span class="agenda-dot" style="--c:'+tones[a.tone]+'" aria-hidden="true"></span>'+
   '<button type="button" class="agenda-item" '+(a.open.action==='open-task'?'data-action="open-task" data-id="'+attr(a.open.id)+'"':'data-today="open-career" data-page="'+attr(a.open.page)+'"')+'><strong>'+esc(a.title)+'</strong><small>'+esc(a.sub)+'</small></button></li>').join('')+'</ul>'+
   (agenda.hidden?'<p class="today-sub">+'+agenda.hidden+' more in Work and Hunt.</p>':''):
   '<div class="empty-mini">Nothing scheduled. Pick three from Work.</div>')+
  (career?'':loading?'<p class="today-sub" role="status">Loading your Career agenda…</p>':'<p class="today-sub">Interviews and follow-ups come from Career.</p><button type="button" class="soft-btn" data-today="load-career">'+ic('briefcase',16)+' Load Career agenda</button>')+'</section>';

 /* triage */
 const queue=triageQueue(st.inbox,skipped,pendingDelete);
 const spaces=st.spaces.map(s=>'<option value="'+attr(s.id)+'">'+esc(s.name)+'</option>').join('');
 const card=(x,i)=>{
  const when=x.created_at?new Date(x.created_at).toLocaleTimeString('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false}):'';
  const top=i===0;
  return '<article class="triage-card'+(top?' is-top':'')+'" data-triage="'+attr(x.id)+'"'+(top?'':' aria-hidden="true"')+'><span class="label">'+(x.kind==='link'?'Link':'Note')+(when?' · '+when:'')+'</span><strong>'+esc(x.title)+'</strong>'+
   (x.body&&x.kind!=='link'?'<p>'+esc(x.body.length>140?x.body.slice(0,139)+'…':x.body)+'</p>':x.kind==='link'?'<p>'+esc(x.body)+'</p>':'')+
   (top?'<div class="triage-acts"><button type="button" class="primary-btn" data-today="triage-task" data-id="'+attr(x.id)+'">Make task</button>'+
    (spaces?'<select class="today-file" data-today-file="'+attr(x.id)+'" aria-label="File this capture to a Space"><option value="">File to Space…</option>'+spaces+'</select>':'')+
    '<button type="button" class="soft-btn" data-today="triage-keep" data-id="'+attr(x.id)+'">Keep for later</button>'+
    '<button type="button" class="ghost-btn" data-today="triage-delete" data-id="'+attr(x.id)+'">Delete</button></div>':'')+'</article>';
 };
 const triageCard='<section class="card card-pad today-triage" aria-labelledby="triage-h"><div class="section-head"><h2 id="triage-h">Inbox · '+queue.length+' to sort</h2><button class="link-action" data-action="nav" data-view="inbox">Open Inbox '+ic('chevron',13)+'</button></div>'+
  (queue.length?'<p class="today-sub">One at a time. Swipe right to make a task, left to delete (with Undo).</p><div class="triage-stack">'+queue.slice(0,3).map(card).join('')+'</div>':
   '<div class="empty-mini">Inbox clear. Quick Capture lands here.'+(skipped.size?'<br><button type="button" class="soft-btn" data-today="triage-reset">Show the '+skipped.size+' kept for later</button>':'')+'</div>')+'</section>';

 return '<div class="today-grid"><div class="today-main">'+threeCard+'</div><div class="today-side">'+agendaCard+triageCard+'</div></div>';
}

/* ---------- actions ---------- */
function undoToast(message,onUndo){
 const doc=root.document;doc.querySelectorAll('.toast').forEach(t=>t.remove());
 const el=doc.createElement('div');el.className='toast toast-undo';el.setAttribute('role','status');
 const span=doc.createElement('span');span.textContent=message;
 const btn=doc.createElement('button');btn.type='button';btn.className='soft-btn';btn.textContent='Undo';
 const line=doc.createElement('i');line.className='toast-line';line.setAttribute('aria-hidden','true');
 el.append(span,btn,line);doc.body.append(el);
 if(!reduced())line.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:UNDO_MS,easing:'linear',fill:'forwards'});
 btn.addEventListener('click',()=>{el.remove();onUndo()});
 setTimeout(()=>el.remove(),UNDO_MS+300);
}
async function makeTask(id){
 const st=host.state(),x=st.inbox.find(i=>i.id===id);if(!x)return;
 const record={title:x.title};if(x.body)record.description=x.body;if(x.space_id)record.space_id=x.space_id;
 const ok=await host.mutate(async()=>{await host.insert('tasks',record)},null);
 if(!ok)return;                                   // nothing was created; the capture stays in the Inbox
 const gone=await host.mutate(async()=>{await host.del('inbox',id)},'Task created from your capture');
 if(!gone)host.toast('The task was created, but the capture is still in your Inbox. Delete it there.',true);
 root.SELFMotion?.burst(root.innerWidth/2,root.innerHeight/2,{count:12});
}
function deleteWithUndo(id){
 const x=host.state().inbox.find(i=>i.id===id);if(!x||pendingDelete.has(id))return;
 const timer=setTimeout(async()=>{
  pendingDelete.delete(id);
  await host.mutate(async()=>{await host.del('inbox',id)},null);   // on failure mutate says so and the card returns
  if(host.state().view==='home')host.render();
 },UNDO_MS);
 pendingDelete.set(id,timer);host.render();
 undoToast('Capture deleted',()=>{clearTimeout(timer);pendingDelete.delete(id);host.render()});
}
async function action(e){
 const b=e.target.closest('[data-today]');if(!b)return false;
 const a=b.dataset.today,id=b.dataset.id;
 if(a==='load-career'){root.SELFCareer?.enter?.();host.render();return true}
 if(a==='open-career'){host.go('career',{room:'hunt'});root.SELFCareer?.setPage?.(b.dataset.page);return true}
 if(a==='triage-task'){await makeTask(id);return true}
 if(a==='triage-keep'){skipped.add(id);host.render();return true}
 if(a==='triage-reset'){skipped.clear();host.render();return true}
 if(a==='triage-delete'){deleteWithUndo(id);return true}
 return false;
}
function change(e){
 const el=e.target,st=host.state();
 if(el.dataset?.todaySwap!==undefined){
  const old=el.dataset.todaySwap,next=el.value;if(!next)return true;
  const day=host.today(),storage=root.localStorage;
  const current=pickThree({tasks:st.tasks,pins:readPins(storage,st.user?.id,day),rank:host.rank}).three.map(t=>t.id);
  writePins(storage,st.user?.id,day,current.map(id=>id===old?next:id));host.render();return true;
 }
 if(el.dataset?.todayFile!==undefined){
  const id=el.dataset.todayFile,space=el.value;if(!space)return true;
  host.mutate(async()=>{await host.patch('inbox',id,{space_id:space})},'Filed to '+(host.spaceOf(space)?.name||'Space'));return true;
 }
 return false;
}

/* ---------- swipe on the top triage card ---------- */
let sw=null;
function swipeDown(e){
 const card=e.target.closest?.('.triage-card.is-top');if(!card||e.target.closest('button,select,a,input'))return;
 sw={card,x0:e.clientX,y0:e.clientY,pid:e.pointerId,dx:0,live:false,id:card.dataset.triage};
 root.addEventListener('pointermove',swipeMove);root.addEventListener('pointerup',swipeUp);root.addEventListener('pointercancel',swipeCancel);
}
function swipeMove(e){
 if(!sw||e.pointerId!==sw.pid)return;
 const dx=e.clientX-sw.x0,dy=e.clientY-sw.y0;
 if(!sw.live){if(Math.abs(dx)<8)return;if(Math.abs(dy)>Math.abs(dx)){swipeCancel();return}sw.live=true;sw.card.setPointerCapture?.(e.pointerId)}
 e.preventDefault?.();sw.dx=dx;
 sw.card.style.transform='translateX('+dx+'px) rotate('+dx/18+'deg)';
 sw.card.dataset.swipe=dx>40?'task':dx<-40?'delete':'';
}
function swipeUp(e){
 if(!sw||e.pointerId!==sw.pid)return;
 const {card,dx,id,live}=sw;stopSwipe();
 if(!live)return;
 card.dataset.swipe='';
 const go=dx>SWIPE?'task':dx<-SWIPE?'delete':null;
 const finish=()=>{if(go==='task')makeTask(id);else if(go==='delete')deleteWithUndo(id)};
 if(!go){card.style.transition='transform 260ms cubic-bezier(.34,1.56,.64,1)';card.style.transform='';return}
 if(reduced()){finish();return}
 card.style.transition='transform 280ms cubic-bezier(.4,0,1,1),opacity 280ms';
 card.style.transform='translateX('+(go==='task'?'':'-')+'120vw) rotate('+(go==='task'?18:-18)+'deg)';card.style.opacity='0';
 setTimeout(finish,260);
}
function swipeCancel(){if(sw){sw.card.style.transform='';sw.card.dataset.swipe=''}stopSwipe()}
function stopSwipe(){root.removeEventListener('pointermove',swipeMove);root.removeEventListener('pointerup',swipeUp);root.removeEventListener('pointercancel',swipeCancel);sw=null}

function init(h){
 host=h;
 root.SELFDnd?.register('three',{
  accepts:el=>el.dataset.dndType==='three',
  label:()=>'Three for today',
  commit:async()=>{ // the DOM order after the drop is the new order
   const ids=[...root.document.querySelectorAll('[data-dnd-zone="three:today"] [data-dnd-item]')].map(n=>n.dataset.dndItem);
   const st=host.state();writePins(root.localStorage,st.user?.id,host.today(),ids);host.render();return true;
  }
 });
 if(root.document)root.document.addEventListener('pointerdown',swipeDown);
}
const api={init,render,action,change,pickThree,buildAgenda,triageQueue,readPins,writePins,pinKey};
root.SELFToday=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
