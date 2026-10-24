/* SELF Work tools: saved views and bulk actions on My Work.
   Saved views are device-local (localStorage). Bulk actions reuse the normal task save path: one PATCH per task, results reported exactly,
   with one Undo for the batch. Selection only ever contains tasks that are visible under the current filters. */
(function(root){
'use strict';
const MAX_VIEWS=12,MAX_NAME=40;
const MODES=['list','board','calendar'];
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

/* ---------- saved views ---------- */
const viewName=s=>clean(s).slice(0,MAX_NAME);
function normalizeViews(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set(),out=[];
 for(const v of raw){
  const name=viewName(v?.name);
  if(!v||typeof v.id!=='string'||!name||seen.has(name.toLowerCase())||!MODES.includes(v.mode))continue;
  seen.add(name.toLowerCase());
  out.push({id:v.id,name,mode:v.mode,space:typeof v.space==='string'?v.space:'all',status:typeof v.status==='string'?v.status:'all',search:clean(v.search).slice(0,80)});
  if(out.length>=MAX_VIEWS)break;
 }
 return out;
}
/* A view with the same name (any case) is replaced; otherwise it is added, up to the limit. */
function saveView(views,draft,id){
 const name=viewName(draft?.name);
 if(!name)return {views,error:'Give the view a name.'};
 const next={id:id||'v'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,mode:MODES.includes(draft.mode)?draft.mode:'list',space:draft.space||'all',status:draft.status||'all',search:clean(draft.search).slice(0,80)};
 const i=views.findIndex(v=>v.name.toLowerCase()===name.toLowerCase());
 if(i>=0){const copy=views.slice();copy[i]={...next,id:views[i].id};return {views:copy,replaced:true}}
 if(views.length>=MAX_VIEWS)return {views,error:'You can keep up to '+MAX_VIEWS+' views. Remove one first.'};
 return {views:[...views,next]};
}
const removeView=(views,id)=>views.filter(v=>v.id!==id);
/* What applying a view changes. A Space that no longer exists is reported, never silently treated as "all". */
function applyView(view,spaces){
 const missing=view.space!=='all'&&!(spaces||[]).some(s=>s.id===view.space);
 return {workView:view.mode,filterSpace:missing?'all':view.space,filterStatus:view.status,workSearch:view.search,warning:missing?'The Space for this view no longer exists, so all Spaces are shown.':''};
}
function describeView(view,{spaces=[],statusName=s=>s}={}){
 const sp=view.space==='all'?'':(spaces.find(s=>s.id===view.space)?.name||'Space removed');
 return [sp,view.status==='all'?'':statusName(view.status),view.search?'“'+view.search+'”':'',view.mode==='list'?'':view.mode].filter(Boolean).join(' · ')||'All tasks';
}

/* ---------- bulk ---------- */
const DATE=/^\d{4}-\d{2}-\d{2}$/;
/* change: any of {status,priority,due_date (YYYY-MM-DD or null),space_id (id or null)}. Returns only tasks that would actually change. */
function planBulk(tasks,ids,change,{statuses,priorities,spaces}={}){
 const patch={};
 if('status' in change){if(statuses&&!statuses.includes(change.status))return {error:'Unknown status.',items:[]};patch.status=change.status}
 if('priority' in change){if(priorities&&!priorities.includes(change.priority))return {error:'Unknown priority.',items:[]};patch.priority=change.priority}
 if('due_date' in change){if(change.due_date!==null&&!DATE.test(change.due_date))return {error:'Use a valid date.',items:[]};patch.due_date=change.due_date}
 if('space_id' in change){if(change.space_id!==null&&spaces&&!spaces.some(s=>s.id===change.space_id))return {error:'Unknown Space.',items:[]};patch.space_id=change.space_id}
 if(!Object.keys(patch).length)return {error:'Nothing to change.',items:[]};
 const set=new Set(ids),items=[];
 for(const t of tasks){
  if(!set.has(t.id))continue;
  const changed={},prev={};
  for(const k of Object.keys(patch))if((t[k]??null)!==patch[k]){changed[k]=patch[k];prev[k]=t[k]??null}
  if(Object.keys(changed).length)items.push({id:t.id,title:t.title,patch:changed,prev});
 }
 return {items,skipped:set.size-items.length,error:''};
}
/* results: Promise.allSettled output aligned with items. */
function summarize(items,results,verb='updated'){
 const ok=[],failed=[];
 results.forEach((r,i)=>r.status==='fulfilled'?ok.push(items[i]):failed.push({id:items[i].id,title:items[i].title,message:r.reason?.message||String(r.reason||'error')}));
 let text=ok.length+' task'+(ok.length===1?'':'s')+' '+verb;
 if(failed.length)text+=', '+failed.length+' failed: '+failed.slice(0,2).map(f=>f.title).join(', ')+(failed.length>2?' and '+(failed.length-2)+' more':'');
 return {ok,failed,text};
}
const undoItems=ok=>ok.map(i=>({id:i.id,patch:i.prev}));

const api={viewName,normalizeViews,saveView,removeView,applyView,describeView,planBulk,summarize,undoItems,MAX_VIEWS};
root.SELFWorkCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI ================= */
let host=null;
const S={selecting:false,selected:new Set(),order:[],last:null,draft:null,views:[],owner:null,busy:false,confirmDelete:false,undo:null};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>'self.views.'+(host.state().user?.id||'anon');
function loadViews(){
 const id=host.state().user?.id||'anon';
 if(S.owner===id)return;
 S.owner=id;S.selected.clear();S.selecting=false;S.draft=null;S.undo=null;
 try{S.views=normalizeViews(JSON.parse(root.localStorage?.getItem(key())||'[]'))}catch{S.views=[]}
}
function persistViews(){try{root.localStorage?.setItem(key(),JSON.stringify(S.views))}catch{}}
function init(args){host=args.host}
const stateNow=()=>host.state();
const tasksById=()=>new Map(stateNow().tasks.map(t=>[t.id,t]));

/* called by renderWork with the filtered, ordered task list: selection never includes hidden tasks */
function setOrder(ids){
 loadViews();
 S.order=ids;const visible=new Set(ids);
 for(const id of [...S.selected])if(!visible.has(id))S.selected.delete(id);
 if(!S.selected.size)S.confirmDelete=false;
}
const cls=id=>S.selected.has(id)?' is-selected':'';
function select(t){
 if(!S.selecting)return '';
 return '<input type="checkbox" class="check work-select" data-work="toggle" data-id="'+h(t.id)+'" aria-label="Select: '+h(t.title)+'" '+(S.selected.has(t.id)?'checked':'')+'/>';
}
function toolbar(st){
 loadViews();
 const spaces=st.spaces,statusName=host.statusName;
 const pills=S.views.map(v=>{
  const d=describeView(v,{spaces,statusName});
  return '<span class="view-pill"><button type="button" class="view-apply" data-work="view-apply" data-id="'+h(v.id)+'" title="'+h(d)+'">'+h(v.name)+'</button><button type="button" class="view-remove" data-work="view-remove" data-id="'+h(v.id)+'" aria-label="Remove view '+h(v.name)+'">×</button></span>';
 }).join('');
 const draft=S.draft;
 return '<div class="work-tools" role="group" aria-label="Views and selection">'+
  '<button type="button" class="soft-btn'+(S.selecting?' selected':'')+'" data-work="select-mode" aria-pressed="'+S.selecting+'">'+(S.selecting?'Done selecting':'Select')+'</button>'+
  (draft?'<form class="view-form" data-work-form="save-view"><input class="field" name="view-name" maxlength="'+MAX_NAME+'" placeholder="Name this view" value="'+h(draft.name)+'" aria-label="View name" data-work-input="view-name" autocomplete="off"/><button type="submit" class="primary-btn">Save</button><button type="button" class="soft-btn" data-work="view-cancel">Cancel</button>'+(draft.error?'<span class="view-error" role="alert">'+h(draft.error)+'</span>':'')+'</form>':
   '<button type="button" class="soft-btn" data-work="view-new">Save this view</button>')+
  (pills?'<div class="view-pills" aria-label="Saved views">'+pills+'</div>':'')+'</div>';
}
function bar(){
 if(!S.selecting)return S.undo?'<div class="bulk-dock">'+undoBar()+'</div>':'';
 const spacer='<div class="bulk-spacer" aria-hidden="true"></div>';
 const n=S.selected.size,st=stateNow();
 if(!n)return spacer+'<div class="bulk-dock">'+(S.undo?undoBar():'')+'<div class="bulk-bar is-empty" role="region" aria-label="Selection"><span>Select tasks to change them together. Shift-click selects a range; X toggles the focused task.</span></div></div>';
 const ids=[...S.selected],titles=ids.map(id=>st.tasks.find(t=>t.id===id)?.title).filter(Boolean);
 return '<div class="bulk-dock">'+(S.undo?undoBar():'')+'<div class="bulk-bar" role="region" aria-label="Bulk actions"><strong>'+n+' selected</strong>'+
  '<label>Status <select data-work-bulk="status" aria-label="Set status for selected"><option value="">Set…</option>'+host.STATUSES.map(([k,v])=>'<option value="'+k+'">'+h(v)+'</option>').join('')+'</select></label>'+
  '<label>Priority <select data-work-bulk="priority" aria-label="Set priority for selected"><option value="">Set…</option>'+host.PRIORITIES.map(([k,v])=>'<option value="'+k+'">'+h(v)+'</option>').join('')+'</select></label>'+
  '<label>Due <input type="date" data-work-bulk="due" aria-label="Set due date for selected"/></label><button type="button" class="soft-btn" data-work="clear-due">No due date</button>'+
  '<label>Space <select data-work-bulk="space" aria-label="Move selected to a Space"><option value="">Move…</option><option value="__none">No Space</option>'+st.spaces.map(s=>'<option value="'+h(s.id)+'">'+h(s.name)+'</option>').join('')+'</select></label>'+
  '<button type="button" class="soft-btn danger" data-work="delete">Delete…</button><button type="button" class="soft-btn" data-work="clear">Clear</button></div></div>'+
  (S.confirmDelete?'<div class="bulk-confirm" role="alertdialog" aria-modal="true" aria-labelledby="bulk-del-h"><div class="bulk-confirm-card"><h3 id="bulk-del-h">Delete '+n+' task'+(n===1?'':'s')+'?</h3><p>This also removes their pages and checklists. It cannot be undone.</p><ul>'+titles.slice(0,6).map(t=>'<li>'+h(t)+'</li>').join('')+(titles.length>6?'<li>and '+(titles.length-6)+' more</li>':'')+'</ul><div class="bulk-confirm-actions"><button type="button" class="soft-btn" data-work="delete-cancel">Keep them</button><button type="button" class="primary-btn danger" data-work="delete-confirm"'+(S.busy?' disabled':'')+'>Delete '+n+'</button></div></div></div>':'');
}
const undoBar=()=>'<div class="bulk-undo" role="status"><span>'+h(S.undo.text)+'</span>'+(S.undo.items?.length?'<button type="button" class="soft-btn" data-work="undo">↶ Undo</button>':'')+'</div>';

/* ---- actions ---- */
function toggle(id,on){if(on==null)on=!S.selected.has(id);on?S.selected.add(id):S.selected.delete(id);S.last=id}
function range(toId){
 const a=S.order.indexOf(S.last),b=S.order.indexOf(toId);
 if(a<0||b<0){toggle(toId);return}
 for(const id of S.order.slice(Math.min(a,b),Math.max(a,b)+1))S.selected.add(id);
 S.last=toId;
}
async function applyChange(change,verb){
 const st=stateNow(),ids=[...S.selected];
 const plan=planBulk(st.tasks,ids,change,{statuses:host.STATUSES.map(s=>s[0]),priorities:host.PRIORITIES.map(p=>p[0]),spaces:st.spaces});
 if(plan.error){host.toast(plan.error,true);return}
 if(!plan.items.length){host.toast('Those tasks already have that value.');return}
 if(S.busy)return;S.busy=true;
 let summary=null;
 const ok=await host.mutate(async()=>{
  const results=await Promise.allSettled(plan.items.map(i=>host.patch('tasks',i.id,i.patch)));
  summary=summarize(plan.items,results,verb);
  if(!summary.ok.length)throw new Error(summary.failed[0]?.message||'Nothing was saved');
 },null);
 S.busy=false;
 if(ok&&summary){
  S.undo=summary.ok.length?{text:summary.text,items:undoItems(summary.ok)}:null;
  host.toast(summary.text,summary.failed.length>0);
  host.render();
 }
}
async function applyDelete(){
 if(S.busy)return;
 const st=stateNow(),ids=[...S.selected],items=ids.map(id=>st.tasks.find(t=>t.id===id)).filter(Boolean).map(t=>({id:t.id,title:t.title}));
 S.busy=true;let summary=null;
 const ok=await host.mutate(async()=>{
  const results=await Promise.allSettled(items.map(i=>host.del('tasks',i.id)));
  summary=summarize(items,results,'deleted');
  if(!summary.ok.length)throw new Error(summary.failed[0]?.message||'Nothing was deleted');
 },null);
 S.busy=false;S.confirmDelete=false;
 if(ok&&summary){for(const i of summary.ok)S.selected.delete(i.id);for(const f of summary.failed)S.selected.add(f.id);S.undo={text:summary.text+'. Deleted tasks cannot be restored.',items:[]};host.toast(summary.text,summary.failed.length>0)}
 host.render();
}
async function undo(){
 const u=S.undo;if(!u?.items?.length||S.busy)return;
 S.busy=true;S.undo=null;let summary=null;
 await host.mutate(async()=>{const items=u.items.map(i=>({...i,title:''}));const results=await Promise.allSettled(items.map(i=>host.patch('tasks',i.id,i.patch)));summary=summarize(items.map((i,k)=>({...i,title:'task '+(k+1)})),results,'restored');if(!summary.ok.length)throw new Error('Nothing could be restored')},null);
 S.busy=false;if(summary)host.toast(summary.text,summary.failed.length>0);host.render();
}
function saveCurrentView(){
 const st=stateNow(),d=S.draft;if(!d)return;
 const r=saveView(S.views,{name:d.name,mode:st.workView,space:st.filterSpace,status:st.filterStatus,search:st.workSearch});
 if(r.error){d.error=r.error;host.render();return}
 S.views=r.views;persistViews();S.draft=null;host.toast(r.replaced?'View updated':'View saved');host.render();
}
function applySaved(id){
 const v=S.views.find(x=>x.id===id);if(!v)return false;
 const st=stateNow(),a=applyView(v,st.spaces);
 st.workView=a.workView;st.filterSpace=a.filterSpace;st.filterStatus=a.filterStatus;st.workSearch=a.workSearch;
 if(st.view!=='work')host.go('work');else host.render();
 if(a.warning)host.toast(a.warning,true);
 return true;
}
async function action(e){
 const b=e.target.closest?.('[data-work]');if(!b)return false;
 const a=b.dataset.work,id=b.dataset.id;
 if(a==='toggle'){e.stopPropagation();if(e.shiftKey&&S.last)range(id);else toggle(id,b.checked);host.render();return true}
 e.preventDefault();e.stopPropagation();
 if(a==='select-mode'){S.selecting=!S.selecting;if(!S.selecting){S.selected.clear();S.confirmDelete=false}host.render()}
 else if(a==='clear'){S.selected.clear();S.confirmDelete=false;host.render()}
 else if(a==='clear-due')await applyChange({due_date:null},'updated');
 else if(a==='delete'){if(S.selected.size){S.confirmDelete=true;host.render()}}
 else if(a==='delete-cancel'){S.confirmDelete=false;host.render()}
 else if(a==='delete-confirm')await applyDelete();
 else if(a==='undo')await undo();
 else if(a==='view-new'){S.draft={name:'',error:''};host.render();Promise.resolve().then(()=>root.document.querySelector('[data-work-input="view-name"]')?.focus())}
 else if(a==='view-cancel'){S.draft=null;host.render()}
 else if(a==='view-apply')applySaved(id);
 else if(a==='view-remove'){const v=S.views.find(x=>x.id===id);S.views=removeView(S.views,id);persistViews();host.toast('Removed view'+(v?' “'+v.name+'”':''));host.render()}
 return true;
}
/* In selection mode a click on a task row or card selects it instead of opening it (Shift extends a range). */
function intercept(e){
 if(!S.selecting)return false;
 const row=e.target.closest?.('[data-action="open-task"]');
 if(!row||e.target.closest('[data-work],select,input,button,a'))return false;
 e.preventDefault();e.stopPropagation();
 const id=row.dataset.id;
 if(e.shiftKey&&S.last)range(id);else toggle(id);
 host.render();return true;
}
function submit(e){
 if(e.target?.dataset?.workForm!=='save-view')return false;
 e.preventDefault();saveCurrentView();return true;
}
function input(e){
 const t=e.target;
 if(t?.matches?.('[data-work-input="view-name"]')&&S.draft){S.draft.name=t.value;S.draft.error='';return true}
 return false;
}
function change(e){
 const t=e.target;if(!t?.dataset?.workBulk)return false;
 const kind=t.dataset.workBulk,v=t.value;
 if(!v){return true}
 if(kind==='status')applyChange({status:v},'updated');
 else if(kind==='priority')applyChange({priority:v},'updated');
 else if(kind==='due')applyChange({due_date:v},'updated');
 else if(kind==='space')applyChange({space_id:v==='__none'?null:v},'moved');
 return true;
}
/* X toggles the focused task or card, and turns selection on. */
function keydown(e){
 if(e.key==='Escape'&&S.confirmDelete){S.confirmDelete=false;host.render();return true}
 if(e.key!=='x'&&e.key!=='X')return false;
 if(e.ctrlKey||e.metaKey||e.altKey||stateNow().view!=='work')return false;
 const t=e.target;if(!t||t.matches?.('input:not([type=checkbox]),textarea,select,[contenteditable="true"]'))return false;
 const row=t.closest?.('[data-action="open-task"][data-id],[data-dnd-item][data-id]');
 if(!row||!S.order.includes(row.dataset.id))return false;
 e.preventDefault();S.selecting=true;toggle(row.dataset.id);host.render();
 Promise.resolve().then(()=>root.document.querySelector('[data-id="'+(root.CSS?.escape?root.CSS.escape(row.dataset.id):row.dataset.id)+'"][tabindex],[data-id="'+row.dataset.id+'"]')?.focus?.());
 return true;
}
function leave(){S.selecting=false;S.selected.clear();S.confirmDelete=false;S.draft=null;S.undo=null}
function views(){loadViews();return S.views}
root.SELFWork={init,setOrder,cls,select,toolbar,bar,action,intercept,submit,input,change,keydown,leave,applySaved,views,state:S};
})(typeof window!=='undefined'?window:globalThis);
