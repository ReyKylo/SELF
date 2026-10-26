// SELF Phase 1 — zero-build app. Publishable key is safe for browser use; RLS protects user rows.
const SUPABASE_URL='https://btiwxqjiptbwaunjibjh.supabase.co';
const PUBLIC_KEY='sb_publishable_rdMRKvMBukGd0Wc42wxbnA_pXn-9usG';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const icons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',board:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2.8v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2-2 .06-.06A1.65 1.65 0 0 0 7.6 15a1.65 1.65 0 0 0-1.51-1H6v-2.8h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2-2 .06.06A1.65 1.65 0 0 0 11.1 6.7a1.65 1.65 0 0 0 1-1.51V5h2.8v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2 2-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21v2.8h-.09A1.65 1.65 0 0 0 19.4 15z"/>',plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',check:'<path d="m5 12 5 5L20 7"/>',chevron:'<path d="m9 18 6-6-6-6"/>',back:'<path d="m15 18-6-6 6-6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',moon:'<path d="M20.5 14.6A9 9 0 0 1 9.4 3.5 9 9 0 1 0 20.5 14.6z"/>',note:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',flag:'<path d="M4 22V4m0 1c4-4 8 4 12 0l4-2v12l-4 2c-4 4-8-4-12 0"/>',layers:'<path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',graduation:'<path d="m2 10 10-5 10 5-10 5-10-5zM6 12v5c4 3 8 3 12 0v-5M22 10v6"/>',chart:'<path d="M3 3v18h18M7 17l5-6 4 3 5-7"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',brain:'<path d="M12 7a4 4 0 0 0-7.5-2 5 5 0 0 0-1 8 5 5 0 0 0 4 8c2.5 0 4.5-1.6 4.5-4V7zM12 7a4 4 0 0 1 7.5-2 5 5 0 0 1 1 8 5 5 0 0 1-4 8c-2.5 0-4.5-1.6-4.5-4"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z"/>',inbox:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 13h5l2 3h4l2-3h5"/>',sparkle:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z"/>',send:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',trash:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',external:'<path d="M14 3h7v7M10 14 21 3M21 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7"/>',text:'<path d="M4 7V4h16v3M12 4v16m-4 0h8"/>',list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',kanban:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 3v18M16 3v11"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',save:'<path d="M19 21H5a2 2 0 0 1-2-2V3h13l5 5v11a2 2 0 0 1-2 2zM7 3v6h9V3M7 21v-8h10v8"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',sliders:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>'
};
const ic=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.folder}</svg>`;
const STATUSES=[['todo','To Do','gray'],['planning','Planning','yellow'],['in_progress','In Progress','blue'],['review','Review','purple'],['done','Done','green']];
const PRIORITIES=[['low','Low','green'],['normal','Normal','blue'],['high','High','red']];
const COLORS={blue:'#428cff',green:'#3dce9e',purple:'#ad92fa',yellow:'#f0b862',red:'#f68e94',cyan:'#3fc5d2'};
const SPACE_ICONS=['briefcase','chart','graduation','person','brain','folder'];
const state={user:null,session:JSON.parse(localStorage.getItem('self.session')||'null'),spaces:[],tasks:[],checklist:[],pages:[],links:[],inbox:[],boards:[],knowledgeCards:[],boardItems:[],boardEdges:[],preferences:{theme:localStorage.getItem('self.theme')||'dark',text_scale:Number(localStorage.getItem('self.scale')||100)},view:'home',sidebarCollapsed:localStorage.getItem('self.sidebarCollapsed')==='true',spaceId:null,spaceTab:'tasks',workView:'list',filterStatus:'all',filterSpace:'all',workSearch:'',search:'',linkSearch:'',linkSource:'all',taskId:null,panelTab:'overview',pageId:null,modal:null,captureMode:'note',captureDraft:'',loginMode:'signin',toast:null,saving:false,savePending:false,saveError:null,lastTaskMove:null,dragTaskId:null,authMessage:'',spaceAccent:'blue',spaceIcon:'briefcase'};
function setTheme(theme){state.preferences.theme=theme;document.body.dataset.theme=theme;localStorage.setItem('self.theme',theme)}
function setScale(scale){state.preferences.text_scale=scale;document.documentElement.style.setProperty('--scale',String(scale/100));localStorage.setItem('self.scale',String(scale))}
setTheme(state.preferences.theme);setScale(state.preferences.text_scale);
const normalUrl=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
const niceDate=s=>{if(!s)return 'No deadline';const d=new Date(`${s}T12:00:00`);return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};
const today=()=>new Date().toLocaleDateString('en-CA');
function dueBadge(s){if(!s)return '';const now=today();const cls=s<now?'red':s===now?'red':'yellow';return `<span class="badge ${cls}">${s===now?'Today':niceDate(s)}</span>`}
const statusOf=id=>STATUSES.find(a=>a[0]===id)||STATUSES[0];
const priorityOf=id=>PRIORITIES.find(a=>a[0]===id)||PRIORITIES[1];
const spaceOf=id=>state.spaces.find(s=>s.id===id);
const taskOf=id=>state.tasks.find(t=>t.id===id);
const sbadge=(status)=>{const a=statusOf(status);return `<span class="badge ${a[2]}">${esc(a[1])}</span>`};
function toast(msg,error=false){state.toast={msg,error};const existing=$('.toast');if(existing)existing.remove();const el=document.createElement('div');el.className='toast'+(error?' error':'');el.innerHTML=`${ic(error?'close':'check')} ${esc(msg)}`;document.body.append(el);setTimeout(()=>el.remove(),4300)}
async function request(path,{method='GET',body,auth=true,headers={}}={}){
 const isAuth=path.startsWith('/auth/v1');
 const token=auth?state.session?.access_token:null;
 const req=async bearer=>fetch(SUPABASE_URL+path,{method,headers:{apikey:PUBLIC_KEY,...(bearer?{Authorization:`Bearer ${bearer}`}:{Authorization:`Bearer ${PUBLIC_KEY}`}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body!==undefined?JSON.stringify(body):undefined});
 let res=await req(token);
 if(res.status===401&&auth&&!isAuth&&state.session?.refresh_token){const refreshed=await refresh();if(refreshed)res=await req(state.session.access_token)}
 if(!res.ok){let error;try{error=await res.json()}catch{error={message:res.statusText}};throw new Error(error.msg||error.error_description||error.message||`HTTP ${res.status}`)}
 if(res.status===204)return null;
 const t=await res.text();return t?JSON.parse(t):null;
}
async function refresh(){try{const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:state.session.refresh_token},auth:false});if(!s.access_token)return false;state.session=s;localStorage.setItem('self.session',JSON.stringify(s));return true}catch{return false}}
async function login(email,password,signup=false){const path=signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password';const response=await request(path,{method:'POST',body:{email,password},auth:false});if(response.access_token){state.session=response;state.user=response.user;localStorage.setItem('self.session',JSON.stringify(response));await loadAll();render()}else {state.authMessage='Akun dibuat. Periksa email untuk verifikasi, lalu masuk.';render()}}
async function logout(){try{await window.SELFSync?.clear()}catch{}try{await request('/auth/v1/logout',{method:'POST'})}catch{}state.session=null;state.user=null;localStorage.removeItem('self.session');render()}
async function verifySession(){if(!state.session?.access_token){render();return}try{state.user=await request('/auth/v1/user');await loadAll()}catch(e){if(!(await refresh())){state.session=null;localStorage.removeItem('self.session')}else{try{state.user=await request('/auth/v1/user');await loadAll()}catch{state.session=null}}}render()}
const endpoint=(table,params='')=>`/rest/v1/${table}?${params||'select=*'}`;
async function loadAll(){const tables=['spaces','tasks','task_checklist','task_pages','task_links','inbox','boards','knowledge_cards','board_items','board_edges'];const values=await Promise.all(tables.map(t=>request(endpoint(t))));[state.spaces,state.tasks,state.checklist,state.pages,state.links,state.inbox,state.boards,state.knowledgeCards,state.boardItems,state.boardEdges]=values;let pref=await request(endpoint('preferences','select=*&limit=1'));if(pref[0]){state.preferences={theme:pref[0].theme,text_scale:pref[0].text_scale};setTheme(pref[0].theme);setScale(pref[0].text_scale)}await window.SELFSync?.pull()}
async function insert(table,record){return request(endpoint(table,'select=*'),{method:'POST',body:{user_id:state.user.id,...record},headers:{Prefer:'return=representation'}}).then(x=>x[0])}
async function patch(table,id,record){return request(endpoint(table,`id=eq.${encodeURIComponent(id)}&select=*`),{method:'PATCH',body:{...record,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}}).then(x=>x[0])}
async function patchSimple(table,id,record){return request(endpoint(table,`id=eq.${encodeURIComponent(id)}&select=*`),{method:'PATCH',body:record,headers:{Prefer:'return=representation'}}).then(x=>x[0])}
async function del(table,id){return request(endpoint(table,`id=eq.${encodeURIComponent(id)}`),{method:'DELETE'})}
async function savePref(){const body={user_id:state.user.id,theme:state.preferences.theme,text_scale:state.preferences.text_scale,updated_at:new Date().toISOString()};await request(endpoint('preferences','on_conflict=user_id'),{method:'POST',body,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}})}
async function mutate(operation,success='Saved',{rerender=true}={}){
 state.saving=true;state.savePending=false;state.saveError=null;paintSave();
 let wrote=false;
 try{
  await operation();wrote=true;
  await loadAll();
  state.saving=false;state.savePending=false;state.saveError=null;
  if(rerender)render();else paintSave();if(success)toast(success);
  return true;
 }catch(err){
  state.saving=false;
  state.saveError=wrote?'Saved remotely, but refresh failed. Reload to verify.':'Not saved. '+(err?.message||String(err));
  paintSave();toast(state.saveError,true);console.error(err);
  return false;
 }
}
function paintSave(){
 const e=$('#save-state');if(!e)return;
 e.setAttribute('role','status');e.setAttribute('aria-live','polite');
 e.classList.toggle('save-failed',!!state.saveError);
 e.innerHTML=state.saving?`${ic('clock',14)} Saving...`:state.saveError?`${ic('flag',14)} Not saved`:state.savePending?`${ic('clock',14)} Unsaved changes`:`${ic('check',14)} Saved`;
 if(state.saveError)e.title=state.saveError;else e.removeAttribute('title');
}
function nav(icon,label,view){return `<button class="nav-btn ${(state.view===view||(view==='spaces'&&state.view==='space')||(view==='boards'&&state.view==='board-editor'))?'active':''}" data-action="nav" data-view="${view}" title="${label}" aria-label="${label}">${ic(icon)}<span>${label}</span></button>`}
let lastRoom='today';
const useRooms=()=>!!window.SELFRooms&&!(typeof location!=='undefined'&&new URLSearchParams(location.search).get('shell')==='classic');
function chrome(content,heading='Home'){
 const name=(state.user?.email||'SELF user').split('@')[0];
 const brand=`<div class="brand"><span class="brand-square">${ic('sparkle')}</span><span class="brand-text">SELF</span><button type="button" class="sidebar-toggle" data-action="toggle-sidebar" aria-label="${state.sidebarCollapsed?'Expand navigation':'Collapse navigation'}" aria-expanded="${!state.sidebarCollapsed}" title="${state.sidebarCollapsed?'Expand navigation':'Collapse navigation'}">${ic('menu')}</button></div>`;
 const foot=`<div class="sidebar-foot">${nav('settings','Settings','settings')}<div class="profile"><span class="avatar">${esc(name[0]||'S').toUpperCase()}</span><span class="profile-text"><strong>${esc(name)}</strong><small>Personal workspace</small></span></div></div>`;
 const R=useRooms()?window.SELFRooms:null;
 const rctx=R&&{study:studyOn(),view:state.view,careerPage:window.SELFCareer?.ui?.page,tasks:state.tasks,boards:state.boards,interviews:window.SELFCareerPhase2?.ui?.interviews,today:today(),ic,esc};
 const room=R?R.roomOf(state.view,rctx.careerPage):null;
 if(room)lastRoom=room;
 const enter=state.animateNext;state.animateNext=false;
 const aside=R?R.sidebar(rctx,brand,foot):`<aside class="sidebar" aria-label="SELF navigation">${brand}<nav class="nav-items">${nav('home','Home','home')}${nav('grid','Spaces','spaces')}${nav('board','Boards','boards')}${nav('briefcase','My Work','work')}${nav('link','My Links','links')}${nav('inbox','Inbox','inbox')}${nav('briefcase','Career','career')}${nav('search','Search','search')}</nav>${foot}</aside>`;
 const bar=R?R.bar(rctx):`<div class="mobile-nav">${[['home','Home','home'],['grid','Spaces','spaces'],['briefcase','My Work','work'],['link','Links','links'],['briefcase','Career','career'],['settings','Settings','settings']].map(([i,label,v])=>`<button data-action="nav" data-view="${v}" class="${state.view===v?'active':''}">${ic(i)}${label}</button>`).join('')}</div>`;
 return `<div class="shell ${state.sidebarCollapsed?'self-sidebar-collapsed':''}"${R?` data-shell="rooms" data-room="${room||lastRoom}"`:''}>${aside}<main class="main"><div class="topbar"><div class="crumb">SELF ${ic('chevron',14)} <strong>${esc(heading)}</strong></div><div class="top-actions"><span class="save-state" id="save-state">${ic('check',14)} Saved</span>${R?`<button class="icon-btn" title="Search and commands (Ctrl K)" aria-label="Search and commands" data-action="palette">${ic('search')}</button>`:`<button class="icon-btn hide-mobile" title="Search" data-action="nav" data-view="search">${ic('search')}</button>`}${R?`<button class="icon-btn rooms-settings" title="Settings" aria-label="Settings" data-action="nav" data-view="settings">${ic('settings')}</button>`:''}<button class="icon-btn" title="Switch theme" data-action="theme">${ic(state.preferences.theme==='dark'?'sun':'moon')}</button><button class="primary-btn" data-action="new-task">${ic('plus')} <span class="hide-mobile">New Task</span></button></div></div><div class="body"${enter?' data-enter="1"':''}>${R?R.subnav(rctx):''}${content}</div></main>${bar}</div>${state.taskId?renderPanel():''}${state.modal?renderModal():''}`
}
function header(title,subtitle,right=''){return `<div class="hero"><div><div class="eyebrow">Your personal workspace</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${right}</div>`}
function empty(title,subtitle,action=''){return `<div class="blank">${ic('sparkle',30)}<strong>${title}</strong><p>${subtitle}</p>${action}</div>`}
function taskRow(t,withStatus=false){const s=spaceOf(t.space_id);return `<div class="priority-item" data-action="open-task" data-id="${t.id}"><input class="check" type="checkbox" aria-label="Mark task done" data-action="toggle-task" data-id="${t.id}" ${t.status==='done'?'checked':''}/><div class="item-core"><div class="item-title ${t.status==='done'?'done':''}">${esc(t.title)}</div><div class="item-sub">${esc(s?.name||'Unsorted')} · ${esc(statusOf(t.status)[1])}</div></div>${dueBadge(t.due_date)}</div>`}
function priorityRank(t){
 const day=today();
 if(t.due_date&&t.due_date<day)return 0;
 if(t.due_date===day)return 1;
 if(t.priority==='high')return 2;
 if(t.due_date)return 3;
 if(t.priority==='normal')return 4;
 return 5;
}
const homeTasks=()=>state.tasks.filter(t=>t.status!=='done').sort((a,b)=>
 priorityRank(a)-priorityRank(b)||
 (a.due_date||'9999-99-99').localeCompare(b.due_date||'9999-99-99')||
 new Date(b.updated_at)-new Date(a.updated_at));
/* Today's task order: same ranking as My Priorities. */
const todayRank=(a,b)=>priorityRank(a)-priorityRank(b)||(a.due_date||'9999-99-99').localeCompare(b.due_date||'9999-99-99')||new Date(b.updated_at)-new Date(a.updated_at);
const homeHeader=()=>header('Your day, in focus. ✳',new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),`<button class="primary-btn" data-action="new-task">${ic('plus')} New Task</button>`);
const captureCard=()=>`<section class="card quick"><div class="quick-head">${ic('sparkle')} Quick Capture <span class="small-sub">— get it out of your head</span></div><div class="capture-row"><input id="quick-text" class="capture-input" value="${attr(state.captureDraft)}" placeholder="Tulis ide, catatan, atau kerjaan baru..." maxlength="250" aria-label="Quick capture"/><button class="primary-btn" title="Save capture" data-action="quick-submit">${ic('send')}</button></div><div class="capture-bottom"><div class="capture-modes">${[['note','Note'],['task','Task'],['link','Link'],['board','Board']].map(([k,v])=>`<button class="choice ${state.captureMode===k?'selected':''}" data-action="capture-mode" data-mode="${k}">${ic(k==='task'?'check':k)} ${v}</button>`).join('')}</div><span class="small-sub">Press Enter to save</span></div></section>`;
const prioritiesCard=tasks=>`<section class="card card-pad"><div class="section-head"><h2>My Priorities <span style="color:var(--faint)">(${tasks.length})</span></h2><button class="link-action" data-action="nav" data-view="work">See all ${ic('chevron',13)}</button></div><div class="priority-list">${tasks.slice(0,6).map(t=>taskRow(t)).join('')||`<div class="empty-mini">Nothing urgent. Add a task to get started ✨</div>`}</div></section>`;
const recentsCard=()=>{const recents=[...state.tasks].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,3);return `<section class="card card-pad"><div class="section-head"><h2>Continue Where You Left Off</h2><button class="link-action" data-action="nav" data-view="work">See all ${ic('chevron',13)}</button></div><div class="continue-list">${recents.map(t=>`<button class="continue-item" data-action="open-task" data-id="${t.id}"><span class="mini-thumb">${ic('note',25)}</span><span><strong>${esc(t.title)}</strong><small>${esc(spaceOf(t.space_id)?.name||'Unsorted')} · ${esc(statusOf(t.status)[1])}</small></span></button>`).join('')||`<div class="empty-mini">Your recently updated tasks will appear here.</div>`}</div></section>`};
const countbar=()=>`<div class="countbar"><div class="stat"><strong data-countup="${state.tasks.filter(t=>t.status!=='done').length}">${state.tasks.filter(t=>t.status!=='done').length}</strong><span>Active tasks</span></div><div class="stat"><strong data-countup="${state.spaces.length}">${state.spaces.length}</strong><span>Spaces</span></div><div class="stat"><strong data-countup="${state.inbox.length}">${state.inbox.length}</strong><span>Captured notes</span></div><div class="stat"><strong data-countup="${state.tasks.filter(t=>t.status==='done').length}">${state.tasks.filter(t=>t.status==='done').length}</strong><span>Tasks completed</span></div></div>`;
function renderHome(){return homeHeader()+captureCard()+`<div class="two-col">${prioritiesCard(homeTasks())}${recentsCard()}</div>`+countbar()}
/* Rooms: the Today room. Classic shell keeps renderHome. */
function renderToday(){return homeHeader()+captureCard()+window.SELFToday.render()+`<div class="today-recents">${recentsCard()}</div>`+countbar()}
function renderSpaces(){return header('Your Spaces','Organize your work, learning, and everything in between.',`<button class="primary-btn" data-action="new-space">${ic('plus')} New Space</button>`)+`<div class="space-grid">${state.spaces.map(s=>{const n=state.tasks.filter(t=>t.space_id===s.id).length;return `<button class="space-tile" data-action="open-space" data-id="${s.id}" style="--accent:${COLORS[s.accent]||COLORS.blue}"><span class="space-symbol">${ic(s.icon,32)}</span><strong>${esc(s.name)}</strong><small>${n} ${n===1?'task':'tasks'}</small></button>`}).join('')}<button class="space-tile add" data-action="new-space"><span class="space-symbol">${ic('plus',32)}</span><strong>New Space</strong><small>Make room for something new</small></button></div>`}
function renderSpace(){const s=spaceOf(state.spaceId);if(!s)return renderSpaces();const ts=state.tasks.filter(t=>t.space_id===s.id);const ins=state.inbox.filter(x=>x.space_id===s.id);const lk=state.links.filter(x=>ts.some(t=>t.id===x.task_id));let body='';if(state.spaceTab==='tasks')body=`<section class="card card-pad"><div class="section-head"><h2>Tasks in ${esc(s.name)}</h2><button class="ghost-btn" data-action="new-task" data-space="${s.id}">${ic('plus')} Add Task</button></div><div class="priority-list">${ts.map(t=>taskRow(t)).join('')||'<div class="empty-mini">No tasks in this Space yet.</div>'}</div></section>`;else if(state.spaceTab==='notes')body=`<section class="card card-pad"><div class="section-head"><h2>Captured notes</h2></div>${ins.map(x=>`<div class="inbox-item"><div><strong>${esc(x.title)}</strong><p>${esc(x.body)}</p></div></div>`).join('')||'<div class="empty-mini">Quick Capture notes assigned to this space will appear here.</div>'}</section>`;else if(state.spaceTab==='links')body=renderLinkGrid(lk,false);else body=window.SELFBoards?.renderLibrary?.(s.id)||empty('Boards unavailable','Try reloading the page.');
return `<button class="link-action" data-action="nav" data-view="spaces" style="margin-bottom:18px">${ic('back',15)} All Spaces</button><div class="space-header"><span class="space-symbol">${ic(s.icon,28)}</span><div><h1 style="margin:0 0 6px;letter-spacing:-.045em">${esc(s.name)}</h1><p class="subtitle">Your connected workspace.</p></div><span style="flex:1"></span><button class="icon-btn" title="Edit Space" data-action="edit-space" data-id="${s.id}">${ic('settings')}</button></div><div class="tabs">${[['tasks','Tasks'],['boards','Boards'],['notes','Notes'],['links','Links']].map(([v,label])=>`<button class="tab ${state.spaceTab===v?'active':''}" data-action="space-tab" data-tab="${v}">${label}</button>`).join('')}</div>${body}`}
/* Due date first; ties break on created_at then id so the order is the same after every reload (the API returns rows unordered). */
const taskOrder=(a,b)=>(a.due_date||'9999-99-99').localeCompare(b.due_date||'9999-99-99')||String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id));
function filteredTasks(){return state.tasks.filter(t=>(state.filterSpace==='all'||t.space_id===state.filterSpace)&&(state.filterStatus==='all'||t.status===state.filterStatus)&&(!state.workSearch||t.title.toLowerCase().includes(state.workSearch.toLowerCase()))).sort(taskOrder)}
function renderWork(){const tasks=filteredTasks();window.SELFWork?.setOrder(tasks.map(t=>t.id));const controls=`<div class="tabs">${[['list','List','list'],['board','Board','kanban'],['calendar','Calendar','calendar']].map(([v,t,i])=>`<button class="tab ${state.workView===v?'active':''}" data-action="work-view" data-mode="${v}">${ic(i,16)} ${t}</button>`).join('')}</div><div class="work-controls"><input class="field search-field" id="work-search" value="${attr(state.workSearch)}" placeholder="Search tasks..."/><select id="filter-space" class="select"><option value="all">All Spaces</option>${state.spaces.map(s=>`<option value="${s.id}" ${state.filterSpace===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select id="filter-status" class="select"><option value="all">All Statuses</option>${STATUSES.map(([k,v])=>`<option value="${k}" ${state.filterStatus===k?'selected':''}>${v}</option>`).join('')}</select></div>`;
let body='';if(state.workView==='list'){body=`<div class="work-table"><div class="work-row header"><div>Task</div><div>Space</div><div>Status</div><div>Priority</div><div>Due date</div></div>${tasks.map(t=>`<div class="work-row data${window.SELFWork?.cls(t.id)||''}" data-action="open-task" data-id="${t.id}"><div class="task-cell">${window.SELFWork?.select(t)||''}<input type="checkbox" class="check" data-action="toggle-task" data-id="${t.id}" ${t.status==='done'?'checked':''}/><span class="${t.status==='done'?'item-title done':''}">${esc(t.title)}</span></div><div>${esc(spaceOf(t.space_id)?.name||'Unsorted')}</div><div>${sbadge(t.status)}</div><div><span class="badge ${priorityOf(t.priority)[2]}">${esc(priorityOf(t.priority)[1])}</span></div><div class="small-sub">${esc(niceDate(t.due_date))}</div></div>`).join('')||`<div class="empty-mini">No tasks match these filters.</div>`}</div>`}else if(state.workView==='board'){body=`<div class="kanban" aria-label="Task status board" data-dnd-scroll>${STATUSES.map(([k,label])=>`<section class="kanban-col" data-drop-status="${k}" data-dnd-zone="status:${k}" aria-label="${label} tasks"><div class="kanban-head"><span>${label}</span><span data-count-for="status:${k}">${tasks.filter(t=>t.status===k).length}</span></div><div class="kanban-items" data-dnd-list>${tasks.filter(t=>t.status===k).map(t=>`<article class="kanban-task${window.SELFWork?.cls(t.id)||''}" draggable="true" data-task-drag="${t.id}" data-dnd-item="${t.id}" data-dnd-type="task" data-action="open-task" data-id="${t.id}" tabindex="0" role="group" aria-roledescription="Draggable task" aria-describedby="dnd-help" aria-label="${attr(t.title)}"><div class="kanban-card-head">${window.SELFWork?.select(t)||''}<strong>${esc(t.title)}</strong><button type="button" class="grip kanban-drag-grip" data-dnd-grip aria-label="Drag handle for ${attr(t.title)}" tabindex="-1">⋮⋮</button></div><span class="item-sub">${esc(spaceOf(t.space_id)?.name||'Unsorted')} · ${esc(niceDate(t.due_date))}</span><label class="kanban-stage-label">Status <select class="kanban-stage-select" data-stage-task-id="${t.id}" aria-label="Move ${attr(t.title)} to status">${STATUSES.map(([v,name])=>`<option value="${v}" ${v===t.status?'selected':''}>${name}</option>`).join('')}</select></label></article>`).join('')||'<div class="kanban-empty">Drag a task here</div>'}</div></section>`).join('')}</div>`}else {body=`<div class="calendar-list">${tasks.filter(t=>t.due_date).map(t=>`<div class="calendar-row" data-action="open-task" data-id="${t.id}"><span class="date-square">${esc(niceDate(t.due_date))}</span><div><strong>${esc(t.title)}</strong><div class="item-sub">${esc(spaceOf(t.space_id)?.name||'Unsorted')}</div></div><span style="margin-left:auto">${sbadge(t.status)}</span></div>`).join('')||empty('No dates yet','Add a due date to any task and it will show up here.')}</div>`}
return header('My Work','Everything you need to do, across all your Spaces.',`<button class="primary-btn" data-action="new-task">${ic('plus')} New Task</button>`)+controls+(window.SELFWork?.toolbar(state)||'')+(state.workView==='board'?`<div class="kanban-help"><span>${ic('kanban',16)} Drag between stages, or use the status menu on each task. Keyboard: Space picks a task up, arrows move it, Space drops.</span>${state.lastTaskMove?`<button type="button" class="soft-btn" data-action="undo-stage" aria-label="Undo last task move">${ic('back',15)} Undo last move</button>`:''}</div>`:'')+body+(state.workView==='board'?`<p id="dnd-help" class="sr-only">Press Space to pick up. Use the arrow keys to move between stages. Press Space to drop or Escape to cancel.</p><div id="dnd-live" class="sr-only" aria-live="assertive"></div>`:'')+(window.SELFWork?.bar()||'')}
async function moveTaskStatus(id,target,{undo=false}={}){
 const task=taskOf(id);
 if(!task||!STATUSES.some(([s])=>s===target)||state.movingTaskId)return false;
 if(task.status===target)return true;
 const from=task.status;state.movingTaskId=id;
 const card=document.querySelector('[data-task-drag="'+id+'"]');
 if(card){card.classList.add('is-saving');card.setAttribute('aria-busy','true')}
 const result=await mutate(async()=>patch('tasks',id,{status:target}),undo?'Move undone':'Task moved to '+statusOf(target)[1],{rerender:false});
 state.movingTaskId=null;
 if(result){state.lastTaskMove=undo?null:{id,from,to:target};render();if(target==='done')window.SELFMotion?.burstAt('[data-task-drag="'+id+'"]');return true}
 if(card?.isConnected){card.classList.remove('is-saving');card.removeAttribute('aria-busy')}
 return false;
}
/* Pointer/touch/keyboard drag (self-dnd.js). The save is the existing moveTaskStatus; the landing slot uses the same taskOrder as the board. */
window.SELFDnd?.register('status',{
 accepts:el=>el.dataset.dndType==='task',
 landingIndex:(el,zone,others)=>{const t=taskOf(el.dataset.dndItem);return t?window.SELFDnd.sortedSlot(others.map(n=>taskOf(n.dataset.dndItem)).filter(Boolean),t,taskOrder):null},
 commit:(id,from,to)=>moveTaskStatus(id,to),
 label:v=>statusOf(v)[1]
});
function resetTaskDropHighlights(){
 document.querySelectorAll?.('.kanban-col.is-drag-over,.kanban-task.is-dragging').forEach(node=>node.classList.remove('is-drag-over','is-dragging'));
}
function workDragStart(e){
 if(state.view!=='work'||state.workView!=='board'||state.movingTaskId)return;
 if(e.target.closest?.('select,input,button')){e.preventDefault?.();return}
 const card=e.target.closest?.('[data-task-drag]');if(!card)return;
 state.dragTaskId=card.dataset.taskDrag;
 if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',state.dragTaskId)}
 card.classList.add('is-dragging');
}
function workDragOver(e){
 if(!state.dragTaskId)return;
 const col=e.target.closest?.('[data-drop-status]');if(!col)return;
 e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';
 document.querySelectorAll?.('.kanban-col.is-drag-over').forEach(node=>{if(node!==col)node.classList.remove('is-drag-over')});
 col.classList.add('is-drag-over');
}
async function workDrop(e){
 const id=state.dragTaskId,target=e.target.closest?.('[data-drop-status]')?.dataset.dropStatus;
 if(!id||!target)return;
 e.preventDefault();state.dragTaskId=null;resetTaskDropHighlights();
 await moveTaskStatus(id,target);
}
function workDragEnd(){state.dragTaskId=null;resetTaskDropHighlights()}

function renderBoards(){return window.SELFBoards?.renderLibrary?.()||empty('Boards unavailable','Try reloading the page.')}
function renderLinkGrid(links,global=true){const extra=state.inbox.filter(x=>x.kind==='link').map(x=>({id:x.id,title:x.title,url:x.body,fromInbox:true}));const all=global?[...links,...extra]:links;return all.length?`<div class="link-grid">${all.map(l=>`<a class="link-tile" href="${attr(normalUrl(l.url)||'#')}" target="_blank" rel="noopener noreferrer"><span class="link-logo">${ic(l.url.includes('docs.google.com/spreadsheets')?'grid':l.url.includes('drive.google.com')?'folder':'link',30)}</span><strong>${esc(l.title||new URL(normalUrl(l.url)||'https://example.org').hostname)}</strong><small>${esc(l.fromInbox?'Quick Capture':l.boardName||taskOf(l.task_id)?.title||'Task resource')}</small></a>`).join('')}</div>`:empty('No links yet','Add a link in a Task Detail, or capture a URL from Home. It will appear here automatically.')}
function allGeneralLinks(){
 // My Links is general-purpose. One URL can be used by several objects.
 const inputs=[
  ...state.links.map(l=>({...l,source:'Tasks'})),
  ...state.inbox.filter(x=>x.kind==='link').map(l=>({id:l.id,title:l.title,url:l.body,source:'Quick Capture'})),
  ...(window.SELFBoards?.links?.()||[]).map(l=>({...l,source:'Whiteboards'})),
  ...(window.SELFCareer?.links?.()||[]).map(l=>({...l,source:'Career'}))
 ];
 const seen=new Map();
 for(const item of inputs){
  const safe=normalUrl(item.url);if(!safe)continue;
  const old=seen.get(safe);
  if(old){old.count++;if(!old.sources.includes(item.source))old.sources.push(item.source)}
  else seen.set(safe,{...item,url:safe,sources:[item.source],count:1});
 }
 return [...seen.values()];
}
function renderLinks(){
 const all=allGeneralLinks(),source=state.linkSource||'all',q=state.linkSearch.trim().toLowerCase();
 const rows=all.filter(l=>(source==='all'||l.sources.includes(source))&&
  (!q||[l.title,l.url,...l.sources].some(v=>String(v||'').toLowerCase().includes(q))));
 const filters=[['all','All'],['Tasks','Tasks'],['Whiteboards','Whiteboards'],['Quick Capture','Quick Capture'],['Career','Career']]
 .map(([id,name])=>'<button type="button" class="choice '+(source===id?'selected':'')+
 '" data-action="link-source" data-source="'+attr(id)+'">'+name+'</button>').join('');
 const tiles=rows.map(l=>{
  const host=new URL(l.url).hostname;
  const icon=l.url.includes('docs.google.com/spreadsheets')?'grid':l.url.includes('drive.google.com')?'folder':'link';
  return '<a class="link-tile" href="'+attr(l.url)+'" target="_blank" rel="noopener noreferrer">'+
  '<span class="link-logo">'+ic(icon,27)+'</span><strong>'+esc(l.title||host)+'</strong><small>'+
  esc(host)+'</small><span class="link-origin">'+esc(l.sources.join(' · '))+
  (l.count>1?' · '+l.count+' references':'')+'</span></a>';
 }).join('');
 return header('My Links','Your general library of references, not tied to any one workspace.',
 '<button class="primary-btn" data-action="new-link">'+ic('plus')+' New Link</button>')+
 '<div class="links-tools"><label class="links-search-label" for="links-search">'+ic('search',18)+
 '<input id="links-search" class="field" value="'+attr(state.linkSearch)+
 '" placeholder="Search names or domains..." autocomplete="off"/></label><div class="links-filters">'+filters+'</div></div>'+
 '<div class="links-summary">'+rows.length+' unique '+(rows.length===1?'link':'links')+'</div>'+
 (rows.length?'<div class="link-grid">'+tiles+'</div>':
 empty(q||source!=='all'?'No matching links':'No links yet',q||source!=='all'?
 'Try another search or filter.':'Capture a URL on Home or save one from a task.'));
}
function renderInbox(){return header('Quick Inbox','Capture first. Organize later. Your ideas are safe here.')+`<section class="card card-pad"><div class="section-head"><h2>Captured notes & links</h2><span class="small-sub">${state.inbox.length} items</span></div>${state.inbox.slice().reverse().map(x=>`<div class="inbox-item"><div><strong>${ic(x.kind==='link'?'link':'note',15)} ${esc(x.title)}</strong><p>${x.kind==='link'?`<a href="${attr(normalUrl(x.body)||'#')}" target="_blank" rel="noopener noreferrer">${esc(x.body)}</a>`:esc(x.body||'No extra details')}</p><span class="small-sub">${esc(spaceOf(x.space_id)?.name||'Unsorted')} · ${esc(new Date(x.created_at).toLocaleDateString('id-ID'))}</span></div><button class="icon-quiet" data-action="delete-inbox" data-id="${x.id}" title="Delete capture">${ic('trash')}</button></div>`).join('')||'<div class="empty-mini">Nothing in your inbox yet. Quick Capture on Home is ready for you.</div>'}</section>`}
function renderSearch(){
 const q=state.search.trim().toLowerCase();
 const data=[
  ...state.tasks.map(x=>({...x,type:'task',label:x.title,desc:spaceOf(x.space_id)?.name||'My Work'})),
  ...state.spaces.map(x=>({...x,type:'space',label:x.name,desc:'Space'})),
  ...state.boards.map(x=>({...x,type:'board',label:x.title,desc:'Whiteboard'})),
  ...state.inbox.filter(x=>x.kind==='note').map(x=>({...x,type:'note',label:x.title,desc:'Inbox note'})),
  ...allGeneralLinks().map(x=>({...x,type:'link',label:x.title||new URL(x.url).hostname,desc:new URL(x.url).hostname}))
 ];
 const matches=q?data.filter(x=>[x.label,x.desc,x.type,x.url].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,50):[];
 const glyph={task:'check',space:'folder',board:'board',note:'note',link:'link'};
 const results=matches.map(x=>{
  const inner='<span class="mini-thumb">'+ic(glyph[x.type])+'</span><span><strong>'+esc(x.label)+'</strong><small>'+esc(x.desc)+'</small></span>';
  if(x.type==='link')return '<a class="continue-item" href="'+attr(x.url)+'" target="_blank" rel="noopener noreferrer">'+inner+ic('external',16)+'</a>';
  const action=x.type==='task'?'open-task':x.type==='space'?'open-space':x.type==='board'?'open-board':'nav';
  const fields=x.type==='note'?'data-view="inbox"':'data-id="'+attr(x.id)+'"';
  return '<button class="continue-item" data-action="'+action+'" '+fields+'>'+inner+'</button>';
 }).join('');
 return header('Search Everything','Find tasks, boards, Spaces and links in one place.')+
 '<input class="capture-input" style="width:100%" id="global-search" value="'+attr(state.search)+'" placeholder="Search SELF..." autofocus/>'+
 '<div class="card card-pad" style="margin-top:20px">'+(results||'<div class="empty-mini">'+
 (q?'No matching items.':'Type to search across your workspace.')+'</div>')+'</div>';
}
function renderSettings(){return header('Make SELF yours','Your workspace should feel exactly right for you.')+`<div class="settings-section"><div class="settings-row"><div><strong>Appearance</strong><small>Switch between two carefully designed themes.</small></div><div class="segmented"><button class="${state.preferences.theme==='dark'?'active':''}" data-action="set-theme" data-theme="dark">${ic('moon')} Dark</button><button class="${state.preferences.theme==='light'?'active':''}" data-action="set-theme" data-theme="light">${ic('sun')} Light</button></div></div><div class="settings-row"><div><strong>Text size</strong><small>Scale labels, content and controls to your comfort.</small></div><div style="display:flex;align-items:center;gap:14px"><input type="range" id="text-scale" class="slider" min="100" max="150" step="5" value="${state.preferences.text_scale}"/><strong id="scale-label">${state.preferences.text_scale}%</strong></div></div>${window.SELFExportUI?.section()||''}<div class="settings-row"><div><strong>Your account</strong><small>${esc(state.user.email)} · Your data is private to this account.</small></div><button class="ghost-btn" data-action="logout">${ic('logout')} Sign out</button></div></div>`}
function renderPanel(){const t=taskOf(state.taskId);if(!t){state.taskId=null;return ''}const s=spaceOf(t.space_id);const checks=state.checklist.filter(c=>c.task_id===t.id).sort((a,b)=>a.position-b.position);const complete=checks.filter(c=>c.is_done).length;const links=state.links.filter(l=>l.task_id===t.id);const pages=state.pages.filter(p=>p.task_id===t.id);
if(state.pageId){const pg=pages.find(p=>p.id===state.pageId);if(pg)return `<div class="overlay" data-action="close-panel"><aside class="panel"><div class="panel-top"><button class="ghost-btn" data-action="close-subpage">${ic('back')} Back to task</button><button class="icon-btn" data-action="close-panel" aria-label="Close">${ic('close')}</button></div><div class="eyebrow">${esc(t.title)} / Subpage</div><input class="panel-title-input" data-page-field="title" data-id="${pg.id}" value="${attr(pg.title)}" aria-label="Page title"/><div class="panel-section-title">Your page</div><textarea class="area long-area" data-page-field="content" data-id="${pg.id}" placeholder="Write anything. Your thoughts belong here.">${esc(pg.content)}</textarea><p class="small-sub">Changes are saved to your private SELF workspace.</p><div style="margin-top:28px"><button class="ghost-btn" data-action="delete-page" data-id="${pg.id}">${ic('trash')} Delete page</button></div></aside></div>`}
let body='';if(state.panelTab==='overview')body=`<div class="panel-section-title">Description</div><textarea class="area" data-task-field="description" data-id="${t.id}" placeholder="What is this task about? Capture the context here...">${esc(t.description)}</textarea><div class="panel-section-title">Checklist</div>${renderChecklist(checks,t.id,complete)}<div class="panel-section-title">Related resources</div>${links.slice(0,3).map(l=>resource(l)).join('')||'<div class="small-sub" style="padding:8px 0 14px">No resources yet. Add URLs in the Links tab or paste one into notes.</div>'}<button class="soft-btn" data-action="panel-tab" data-tab="links">${ic('plus')} Add a link</button>`;
else if(state.panelTab==='checklist')body=`<div class="panel-section-title">Checklist</div>${renderChecklist(checks,t.id,complete)}`;
else if(state.panelTab==='notes')body=`<div class="panel-section-title">Your notes</div><p class="small-sub">Write freely. URLs you paste here become available in My Links automatically.</p><div class="toolbar" style="margin:15px 0">${[['bold','Bold'],['heading','Heading'],['bullet','Bullet'],['link','Link']].map(([k,v])=>`<button class="choice" data-action="format-note" data-format="${k}">${v}</button>`).join('')}</div><textarea class="area long-area" id="task-notes" data-task-field="notes" data-id="${t.id}" placeholder="Start with a key point, a thought, or an idea...">${esc(t.notes)}</textarea><p class="small-sub">Markdown shortcuts supported: **bold**, # heading, - bullet.</p>`;
else if(state.panelTab==='links')body=`<div class="panel-section-title">Important links</div><p class="small-sub">Links added here automatically appear in My Links. Nothing needs to be copied twice.</p><div style="margin-top:18px">${links.map(l=>resource(l,true)).join('')||'<div class="empty-mini">No links attached to this task yet.</div>'}</div><form id="add-link-form" class="link-form" data-id="${t.id}"><input class="field" name="title" placeholder="Link title" aria-label="Link title"/><input class="field" name="url" type="url" placeholder="https://..." required aria-label="Link URL"/><button class="primary-btn" type="submit">${ic('plus')}</button></form>`;
else body=`<div class="panel-section-title">Subpages</div><p class="small-sub">Give big tasks their own pages for meeting notes, references and deeper research.</p><div style="margin:18px 0">${pages.map(p=>`<div class="subpage-item" data-action="open-subpage" data-id="${p.id}">${ic('book')} <span style="flex:1;font-weight:700">${esc(p.title)}</span>${ic('chevron',16)}</div>`).join('')||'<div class="empty-mini">Create your first subpage.</div>'}</div><button class="soft-btn" data-action="new-subpage">${ic('plus')} New Subpage</button>`;
return `<div class="overlay" data-action="close-panel"><aside class="panel"><div class="panel-top"><div class="crumb">${ic('briefcase',16)} My Work ${ic('chevron',13)} ${esc(s?.name||'Unsorted')}</div><div style="display:flex;gap:7px"><button class="icon-btn" data-action="close-panel" title="Close">${ic('close')}</button></div></div><div class="eyebrow">Task detail · Everything in one place</div><input class="panel-title-input" data-task-field="title" data-id="${t.id}" aria-label="Task title" value="${attr(t.title)}"/><div class="meta-grid"><div><div class="meta-label">Status</div><select class="select" data-task-field="status" data-id="${t.id}">${STATUSES.map(([k,v])=>`<option value="${k}" ${k===t.status?'selected':''}>${v}</option>`).join('')}</select></div><div><div class="meta-label">Priority</div><select class="select" data-task-field="priority" data-id="${t.id}">${PRIORITIES.map(([k,v])=>`<option value="${k}" ${k===t.priority?'selected':''}>${v}</option>`).join('')}</select></div><div><div class="meta-label">Space</div><select class="select" data-task-field="space_id" data-id="${t.id}"><option value="">Unsorted</option>${state.spaces.map(x=>`<option value="${x.id}" ${x.id===t.space_id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div><div class="meta-label">Due date</div><input type="date" class="field" data-task-field="due_date" data-id="${t.id}" value="${attr(t.due_date||'')}"/></div></div><div class="tabs">${[['overview','Overview'],['checklist','Checklist'],['notes','Notes'],['links','Links'],['pages','Subpages']].map(([k,v])=>`<button class="tab ${state.panelTab===k?'active':''}" data-action="panel-tab" data-tab="${k}">${v}</button>`).join('')}</div>${body}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:40px;padding-top:18px;border-top:1px solid var(--line)"><span class="small-sub">Created ${esc(new Date(t.created_at).toLocaleDateString('id-ID'))}</span><button class="ghost-btn" data-action="delete-task" data-id="${t.id}">${ic('trash',16)} Delete Task</button></div></aside></div>`}
function renderChecklist(checks,taskId,complete){return `<div class="small-sub">${complete} of ${checks.length} completed</div><div class="progress-track"><div class="progress-fill" style="width:${checks.length?Math.round(100*complete/checks.length):0}%"></div></div>${checks.map(c=>`<div class="check-item"><input class="check" data-action="toggle-check" data-id="${c.id}" type="checkbox" ${c.is_done?'checked':''}/><input class="text-input" value="${attr(c.text)}" data-check-field="text" data-id="${c.id}" aria-label="Checklist item" style="${c.is_done?'text-decoration:line-through;color:var(--faint)':''}"/><button class="icon-quiet trash" data-action="delete-check" data-id="${c.id}" title="Delete item">${ic('trash')}</button></div>`).join('')}<form id="add-check-form" data-id="${taskId}" style="display:flex;gap:9px;margin-top:17px"><input class="field" name="text" placeholder="Add a step..." aria-label="New checklist item" style="flex:1" required/><button class="soft-btn" type="submit">${ic('plus')}</button></form>`}
function resource(l,canDelete=false){const url=normalUrl(l.url);return `<div class="resource"><span class="resource-icon">${ic('link',20)}</span><a class="resource-main" href="${attr(url||'#')}" rel="noopener noreferrer" target="_blank"><strong>${esc(l.title||l.url)}</strong><small>${esc(l.url)}</small></a>${canDelete?`<button class="icon-quiet" title="Remove link" data-action="delete-link" data-id="${l.id}">${ic('trash')}</button>`:ic('external',16)}</div>`}
function renderModal(){const modal=state.modal;let body='';if(modal==='task'){const sp=state.newTaskSpace||'';body=`<h2>Create a task</h2><p>Put it on your list, then click it to add context, notes and links.</p><form id="create-task-form" class="form-stack"><label class="form-label">Task name<input autofocus required maxlength="250" class="field" name="title" placeholder="What needs to get done?"/></label><label class="form-label">Space<select class="select" name="space_id"><option value="">Unsorted</option>${state.spaces.map(s=>`<option value="${s.id}" ${s.id===sp?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label class="form-label">Status<select name="status" class="select">${STATUSES.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label class="form-label">Due date<input type="date" class="field" name="due_date"/></label></div><div class="modal-foot"><button type="button" class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" type="submit">${ic('plus')} Create task</button></div></form>`}
else if(modal==='space'||modal==='edit-space'){const s=modal==='edit-space'?spaceOf(state.editSpaceId):null;body=`<h2>${s?'Edit Space':'New Space'}</h2><p>Make a home for an area of your life. You can add as many as you want.</p><form id="${s?'edit-space-form':'create-space-form'}" class="form-stack"><label class="form-label">Space name<input autofocus required maxlength="80" class="field" name="name" value="${attr(s?.name||'')}" placeholder="e.g. Finance, Kuliah, Work..."/></label><label class="form-label">Icon<select class="select" name="icon">${SPACE_ICONS.map(k=>`<option value="${k}" ${(s?.icon||state.spaceIcon)===k?'selected':''}>${k.charAt(0).toUpperCase()+k.slice(1)}</option>`).join('')}</select></label><div class="form-label">Accent colour<div class="colors">${Object.entries(COLORS).map(([k,v])=>`<button class="color-swatch ${(s?.accent||state.spaceAccent)===k?'on':''}" style="background:${v}" type="button" title="${k}" data-action="space-accent" data-accent="${k}"></button>`).join('')}</div></div><div class="modal-foot">${s?`<button class="ghost-btn" type="button" data-action="delete-space" data-id="${s.id}">${ic('trash')}</button>`:''}<span style="flex:1"></span><button type="button" class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" type="submit">${ic('check')} ${s?'Save':'Create Space'}</button></div></form>`}
else if(modal==='link')body=`<h2>Save an important link</h2><p>Keep it in My Links so you can find it again instantly.</p><form id="create-link-form" class="form-stack"><label class="form-label">Title<input class="field" name="title" placeholder="e.g. My Watchlist" required/></label><label class="form-label">URL<input class="field" name="url" type="url" placeholder="https://..." required/></label><div class="modal-foot"><button type="button" class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" type="submit">${ic('plus')} Save Link</button></div></form>`;
else if(modal==='subpage')body=`<h2>Create a subpage</h2><p>Give this task room for detailed information.</p><form id="create-subpage-form" class="form-stack"><label class="form-label">Page title<input autofocus class="field" name="title" placeholder="Meeting notes, References, Research..." required/></label><div class="modal-foot"><button class="ghost-btn" type="button" data-action="close-modal">Cancel</button><button class="primary-btn" type="submit">${ic('plus')} Create Page</button></div></form>`;
return `<div class="modal-overlay" data-action="close-modal"><div class="modal"><div class="panel-top"><span class="small-sub">SELF / Quick create</span><button class="icon-btn" data-action="close-modal" title="Close">${ic('close')}</button></div>${body}</div></div>`}
function renderAuth(){return `<div class="auth-shell"><div class="auth-visual"><div class="brand" style="color:#fff;padding-left:0"><span class="brand-square">${ic('sparkle')}</span> SELF</div><div><div class="eyebrow" style="color:#a8c4ff">Your space to think</div><h1>One place for<br/>all the things<br/>on your mind.</h1><p>Capture your ideas. Keep your work moving. Connect the pieces of what you're learning — all in a workspace that's yours.</p></div><div class="small-sub">✳ Made for a mind that never stops.</div></div><div class="auth-login"><div class="auth-box"><div class="brand" style="padding-left:0"><span class="brand-square">${ic('sparkle')}</span> SELF</div><h2>${state.loginMode==='signin'?'Welcome back.':'Create your space.'}</h2><p class="subtitle" style="margin-bottom:30px">${state.loginMode==='signin'?'Good to have you here. Let’s get something done.':'All you need is your email and a password.'}</p>${state.authMessage?`<p class="message ${state.authMessage.toLowerCase().includes('error')?'error':''}">${esc(state.authMessage)}</p>`:''}<form id="auth-form" class="form-stack"><label class="form-label">Email address<input class="field" type="email" name="email" autocomplete="email" required placeholder="you@example.com"/></label><label class="form-label">Password<input class="field" type="password" name="password" autocomplete="${state.loginMode==='signin'?'current-password':'new-password'}" required minlength="6" placeholder="At least 6 characters"/></label><button class="primary-btn" type="submit">${state.loginMode==='signin'?'Sign in':'Create account'} ${ic('chevron')}</button></form><div class="auth-bottom">${state.loginMode==='signin'?`New to SELF? <button data-action="auth-toggle">Create an account</button>`:`Already have an account? <button data-action="auth-toggle">Sign in</button>`}</div><p class="small-sub" style="margin-top:35px">Private workspace · Your tasks and notes are visible only to your account.</p></div></div></div>`}
function render(){if(!state.user){$('#app').innerHTML=renderAuth();return}if(state.view==='board-editor'&&window.SELFBoards?.updateInPlace?.()){paintSave();return}const pages={home:['Home',useRooms()&&window.SELFToday?renderToday:renderHome],spaces:['Spaces',renderSpaces],space:['Space',renderSpace],boards:['Boards',renderBoards],'board-editor':['Whiteboard',()=>window.SELFBoards?.renderEditor?.()||empty('Board unavailable','Reload this page.')],work:['My Work',renderWork],career:['Career',()=>window.SELFCareer?.render?.()||empty('Career unavailable','Try reloading SELF.')],links:['My Links',renderLinks],inbox:['Inbox',renderInbox],search:['Search',renderSearch],settings:['Settings',renderSettings]};const [title,fn]=pages[state.view]||pages.home;$('#app').innerHTML=chrome(fn(),title);paintSave();window.SELFRooms?.afterRender?.();window.SELFDnd?.afterRender?.();window.SELFMotion?.afterRender?.()}
const studyOn=()=>!!window.SELFAccess?.study?.(state.user);
function go(view,opts={}){if(view!=='work')window.SELFWork?.leave?.();state.view=view;state.taskId=null;state.pageId=null;state.modal=null;if(view==='career'||view==='links')window.SELFCareer?.enter?.();if(view==='career'&&opts.room)window.SELFRooms?.alignCareer?.(opts.room);state.animateNext=true;render();window.scrollTo({top:0,behavior:'instant'})}
async function changeTheme(next,origin){const to=next||(state.preferences.theme==='dark'?'light':'dark');const apply=()=>{setTheme(to);render()};if(window.SELFMotion)window.SELFMotion.themeSwitch(apply,origin);else apply();await mutate(async()=>savePref(),null)}
function goRoom(id){if(!studyOn()&&id==='study')return;const r=window.SELFRooms?.ROOMS.find(x=>x.id===id);if(r)go(r.view,{room:id})}
const urlRegex=/https?:\/\/[^\s<>"']+/gi;
async function autoCaptureLinks(taskId,text){const urls=[...new Set((text.match(urlRegex)||[]).map(s=>s.replace(/[),.;!?]+$/,'')).filter(u=>normalUrl(u)))];const existing=state.links.filter(x=>x.task_id===taskId);for(const url of urls){if(!existing.some(x=>x.url===normalUrl(url))){await insert('task_links',{task_id:taskId,url:normalUrl(url),title:new URL(url).hostname})}}}
function formData(form){return Object.fromEntries(new FormData(form).entries())}
async function handleSubmit(e){if(window.SELFWork?.submit?.(e))return;const form=e.target;if(!form.id)return;if(form.id.startsWith('career-')||form.id==='career2-form'||form.id==='career3-form'){await window.SELFCareer?.submit?.(e);return}e.preventDefault();const v=formData(form);const id=form.dataset.id;
if(form.id==='auth-form'){const btn=form.querySelector('button[type="submit"]');btn.disabled=true;state.authMessage='';try{await login(v.email,v.password,state.loginMode==='signup')}catch(e){state.authMessage='Error: '+e.message;render()}finally{if(btn.isConnected)btn.disabled=false}return}
if(form.id==='create-task-form'){if(await mutate(async()=>{await insert('tasks',{title:v.title.trim(),space_id:v.space_id||null,status:v.status,due_date:v.due_date||null})},'Task created')){state.modal=null;render()}return}
if(form.id==='create-space-form'){if(await mutate(async()=>{await insert('spaces',{name:v.name.trim(),icon:v.icon,accent:state.spaceAccent})},'Space created')){state.modal=null;render()}return}
if(form.id==='edit-space-form'){if(await mutate(async()=>patch('spaces',state.editSpaceId,{name:v.name.trim(),icon:v.icon,accent:state.spaceAccent}),'Space updated')){state.modal=null;render()}return}
if(form.id==='add-check-form'){await mutate(async()=>{await insert('task_checklist',{task_id:id,text:v.text.trim(),position:state.checklist.filter(c=>c.task_id===id).length})},'Checklist updated');return}
if(form.id==='add-link-form'){const url=normalUrl(v.url);if(!url){toast('Use an http or https URL',true);return}if(state.links.some(l=>l.task_id===id&&l.url===url)){toast('This link is already attached');return}await mutate(async()=>{await insert('task_links',{task_id:id,url,title:v.title.trim()||new URL(url).hostname})},'Link saved to My Links');return}
if(form.id==='create-link-form'){const url=normalUrl(v.url);if(!url){toast('Use a valid URL',true);return}if(await mutate(async()=>insert('inbox',{title:v.title.trim(),body:url,kind:'link'}),'Link added to My Links')){state.modal=null;render()}return}
if(form.id==='create-subpage-form'){let made;if(await mutate(async()=>{made=await insert('task_pages',{task_id:state.taskId,title:v.title.trim()})},'Subpage created')){state.modal=null;state.pageId=made?.id||null;render()}return}
}
async function quickCapture(){const input=$('#quick-text');const text=input?.value.trim();if(!text){input?.focus();return}const mode=state.captureMode;state.captureDraft=text;if(mode==='board'){let made;if(await mutate(async()=>{made=await insert('boards',{title:text})},'Board created')){state.captureDraft='';if(made)window.SELFBoards.open(made.id)}return}if(mode==='link'&&!normalUrl(text)){toast('Paste a full http(s) URL for Link mode',true);return}if(await mutate(async()=>{if(mode==='task')await insert('tasks',{title:text});else if(mode==='link')await insert('inbox',{title:new URL(text).hostname,body:normalUrl(text),kind:'link'});else await insert('inbox',{title:text,kind:'note'})},mode==='task'?'Task created':mode==='link'?'Link saved':'Note captured')){state.captureDraft='';render()}}
async function handleAction(e){if((e.target.closest?.('[data-career],[data-career2],[data-career3],[data-learning],[data-teaching-action],[data-outreach],[data-tracker],[data-lesson],[data-dossier]')||e.target.closest?.('[data-director-action]'))){await window.SELFCareer?.action?.(e);return}if(window.SELFWork?.intercept?.(e))return;if(e.target.closest?.('[data-work]')&&await window.SELFWork?.action?.(e))return;if(e.target.closest?.('[data-export]')&&await window.SELFExportUI?.action?.(e))return;if(e.target.closest?.('[data-today]')&&await window.SELFToday?.action?.(e))return;if(e.target.closest?.('[data-review]')&&await window.SELFReview?.action?.(e))return;if(e.target.closest?.('[data-nextup]')&&await window.SELFNextUp?.action?.(e))return;const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id;if(action==='close-panel'&&b.classList?.contains('overlay')&&e.target!==b)return;if((e.target.closest('a, select, input, button')&&action==='open-task'&&e.target!==b))return; if(['toggle-task','toggle-check'].includes(action))e.stopPropagation();
if(action==='toggle-sidebar'){
 state.sidebarCollapsed=!state.sidebarCollapsed;
 localStorage.setItem('self.sidebarCollapsed',String(state.sidebarCollapsed));
 document.querySelector('.shell')?.classList.toggle('self-sidebar-collapsed',state.sidebarCollapsed);
 b.setAttribute('aria-expanded',String(!state.sidebarCollapsed));
 b.setAttribute('aria-label',state.sidebarCollapsed?'Expand navigation':'Collapse navigation');
 b.title=state.sidebarCollapsed?'Expand navigation':'Collapse navigation';
 return
}
if(action==='nav'){go(b.dataset.view,{room:b.dataset.room});return}
if(action==='theme'||action==='set-theme'){await changeTheme(b.dataset.theme,e);return}
if(action==='palette'){window.SELFPalette?.open?.();return}
if(action==='new-task'){state.newTaskSpace=b.dataset.space|| (state.view==='space'?state.spaceId:'');state.modal='task';render();return}
if(action==='new-space'){state.spaceAccent='blue';state.spaceIcon='briefcase';state.modal='space';render();return}
if(action==='edit-space'){state.editSpaceId=id;state.spaceAccent=spaceOf(id)?.accent||'blue';state.spaceIcon=spaceOf(id)?.icon||'briefcase';state.modal='edit-space';render();return}
if(action==='space-accent'){state.spaceAccent=b.dataset.accent;document.querySelectorAll('.color-swatch').forEach(x=>x.classList.toggle('on',x.dataset.accent===state.spaceAccent));return}
if(action==='open-space'){state.spaceId=id;state.spaceTab='tasks';go('space');return}
if(action==='open-board'){window.SELFBoards?.open?.(id);return}
if(action==='link-source'){state.linkSource=b.dataset.source;render();return}
if(action==='open-task'){state.taskId=id;state.panelTab='overview';state.pageId=null;render();return}
if(action==='close-panel'){state.taskId=null;state.pageId=null;render();return}
if(action==='panel-tab'){state.panelTab=b.dataset.tab;state.pageId=null;render();return}
if(action==='space-tab'){state.spaceTab=b.dataset.tab;render();return}
if(action==='work-view'){state.workView=b.dataset.mode;render();return}
if(action==='undo-stage'){const m=state.lastTaskMove;if(m)await moveTaskStatus(m.id,m.from,{undo:true});return}
if(action==='toggle-task'){const t=taskOf(id);if(t){const finishing=t.status!=='done';const ok=await mutate(async()=>patch('tasks',id,{status:finishing?'done':'todo'}),'Task updated');if(ok&&finishing)window.SELFMotion?.burstAt('[data-action="toggle-task"][data-id="'+id+'"]',{count:10})}return}
if(action==='toggle-check'){await mutate(async()=>patchSimple('task_checklist',id,{is_done:b.checked}),'Checklist updated');return}
if(action==='delete-check'){await mutate(async()=>del('task_checklist',id),'Step removed');return}
if(action==='delete-inbox'){if(!confirm('Delete this capture?'))return;await mutate(async()=>del('inbox',id),'Capture deleted');return}
if(action==='delete-link'){await mutate(async()=>del('task_links',id),'Link removed');return}
if(action==='delete-task'){if(!confirm('Delete this task and its linked pages and checklist?'))return;if(await mutate(async()=>del('tasks',id),'Task deleted')){state.taskId=null;render()}return}
if(action==='delete-space'){if(!confirm('Delete this Space? Its tasks will be kept as Unsorted.'))return;if(await mutate(async()=>del('spaces',id),'Space removed')){state.modal=null;state.spaceId=null;go('spaces')}return}
if(action==='delete-page'){if(!confirm('Delete this subpage?'))return;if(await mutate(async()=>del('task_pages',id),'Subpage removed')){state.pageId=null;render()}return}
if(action==='open-subpage'){state.pageId=id;render();return}
if(action==='close-subpage'){state.pageId=null;render();return}
if(action==='new-subpage'){state.modal='subpage';render();return}
if(action==='new-link'){state.modal='link';render();return}
if(action==='close-modal'){if(b.classList.contains('modal-overlay')&&e.target.closest('.modal'))return;state.modal=null;render();return}
if(action==='quick-submit'){await quickCapture();return}
if(action==='capture-mode'){state.captureMode=b.dataset.mode;render();const input=$('#quick-text');if(input)input.focus();return}
if(action==='auth-toggle'){state.loginMode=state.loginMode==='signin'?'signup':'signin';state.authMessage='';render();return}
if(action==='logout'){await logout();return}
if(action==='format-note'){const el=$('#task-notes');if(!el)return;const start=el.selectionStart,end=el.selectionEnd,selected=el.value.slice(start,end);let added='';if(b.dataset.format==='bold')added=`**${selected||'bold text'}**`;else if(b.dataset.format==='heading')added=`\n# ${selected||'Heading'}`;else if(b.dataset.format==='bullet')added=`\n- ${selected||'Key point'}`;else added=`[${selected||'Link title'}](https://)`;el.setRangeText(added,start,end,'end');el.focus();return}
}
async function handleChange(e){if(window.SELFWork?.change?.(e))return;if(window.SELFToday?.change?.(e))return;if(window.SELFTrackerUI?.change?.(e))return;if(window.SELFOutreachUI?.change?.(e))return;if(window.SELFCareerLearning?.change?.(e))return;if(await window.SELFCareerPhase2?.change?.(e))return;const el=e.target;
if(el.dataset.stageTaskId){await moveTaskStatus(el.dataset.stageTaskId,el.value);return}
if(el.id==='filter-status'){state.filterStatus=el.value;render();return}
if(el.id==='filter-space'){state.filterSpace=el.value;render();return}
if(el.dataset.taskField){
 const field=el.dataset.taskField;
 let value=el.value;
 if(field==='title'&&!value.trim()){toast('Task title cannot be blank',true);render();return}
 if(field==='space_id'||field==='due_date')value=value||null;
 const id=el.dataset.id;let linkIndexError=null;
 const saved=await mutate(async()=>{
  await patch('tasks',id,{[field]:value});
  if(field==='notes'||field==='description'){
   try{await autoCaptureLinks(id,value)}
   catch(err){linkIndexError=err}
  }
 },'Saved');
 if(saved&&linkIndexError)toast('Writing saved, but link indexing failed. Add the URL via Links when needed.',true);
 return
}
if(el.dataset.checkField){if(!el.value.trim()){toast('Checklist text cannot be blank',true);render();return}await mutate(async()=>patchSimple('task_checklist',el.dataset.id,{text:el.value.trim()}),'Step saved');return}
if(el.dataset.pageField){await mutate(async()=>patch('task_pages',el.dataset.id,{[el.dataset.pageField]:el.value}),'Page saved');return}
}
let searchTimer;
function handleInput(e){if(window.SELFWork?.input?.(e))return;if(window.SELFCareer?.input?.(e))return;const el=e.target;
if(el.dataset?.taskField||el.dataset?.pageField||el.dataset?.checkField){state.savePending=true;paintSave();return}
if(el.id==='quick-text'){state.captureDraft=el.value;return}
if(el.id==='work-search'||el.id==='global-search'||el.id==='links-search'){const id=el.id,pos=el.selectionStart;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(id==='work-search')state.workSearch=el.value;else if(id==='links-search')state.linkSearch=el.value;else state.search=el.value;render();const restored=document.getElementById(id);if(restored){restored.focus();restored.setSelectionRange(pos,pos)}},160);return}
if(el.id==='text-scale'){setScale(Number(el.value));const label=$('#scale-label');if(label)label.textContent=el.value+'%';clearTimeout(searchTimer);searchTimer=setTimeout(()=>mutate(async()=>savePref(),null),300)}
}
document.addEventListener('click',e=>{handleAction(e).catch(error=>toast(error.message,true))});
document.addEventListener('submit',e=>{handleSubmit(e).catch(error=>toast(error.message,true))});
document.addEventListener('change',e=>{handleChange(e).catch(error=>toast(error.message,true))});
document.addEventListener('input',handleInput);
document.addEventListener('dragstart',workDragStart);
document.addEventListener('dragover',workDragOver);
document.addEventListener('drop',e=>{workDrop(e).catch(error=>toast(error.message,true))});
document.addEventListener('dragend',workDragEnd);
document.addEventListener('keydown',e=>{if(window.SELFCareer?.keydown?.(e))return;if(window.SELFWork?.keydown?.(e))return;const rk=state.user&&window.SELFRooms?.roomForKey?.(e,studyOn());if(rk){e.preventDefault();goRoom(rk);return}if(state.view==='work'&&state.workView==='board'&&e.target?.matches?.('[data-task-drag]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();state.taskId=e.target.dataset.taskDrag;state.panelTab='overview';render();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(state.user)go('search')}if(e.key==='Escape'){if(state.modal)state.modal=null;else if(state.pageId)state.pageId=null;else state.taskId=null;render()}if(e.key==='Enter'&&e.target?.id==='quick-text'){e.preventDefault();quickCapture().catch(err=>toast(err.message,true))}});

/* Private image assets for the authenticated Concept C whiteboard. */
async function uploadBoardImage(file){
 if(!state.user?.id||!state.session?.access_token)throw new Error('Sign in before uploading images');
 const extByMime={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
 if(!extByMime[file.type]||file.size>10*1024*1024)throw new Error('Use a PNG, JPG, WebP or GIF under 10MB');
 const uuid=crypto.randomUUID();
 const objectPath=state.user.id+'/'+uuid+'.'+extByMime[file.type];
 const endpoint=SUPABASE_URL+'/storage/v1/object/self-board-assets/'+objectPath;
 let response=await fetch(endpoint,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':file.type,'x-upsert':'false'},body:file});
 if(response.status===401&&await refresh()){
  response=await fetch(endpoint,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':file.type,'x-upsert':'false'},body:file});
 }
 if(!response.ok){const err=await response.json().catch(()=>({message:response.statusText}));throw new Error(err.message||err.error||'Image upload failed')}
 return objectPath;
}
async function signBoardImage(path){
 if(!state.user?.id||!path?.startsWith(state.user.id+'/'))throw new Error('Image does not belong to your account');
 const parts=path.split('/').map(encodeURIComponent).join('/');
 const data=await request('/storage/v1/object/sign/self-board-assets/'+parts,{method:'POST',body:{expiresIn:3600}});
 const signed=data.signedURL||data.signedUrl;if(!signed)throw new Error('Could not create signed image URL');
 if(signed.startsWith('https://'))return signed;
 return SUPABASE_URL+(signed.startsWith('/storage/v1/')?'':'/storage/v1')+(signed.startsWith('/')?'':'/')+signed;
}


function validateCareerDocument(file){
 const allowed=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
 return !!file&&file.size>0&&file.size<=8*1024*1024&&allowed.includes(file.type)&&
 (file.type==='application/pdf'?/\.pdf$/i:/\.docx$/i).test(file.name||'');
}
async function uploadCareerDocument(file){
 if(!validateCareerDocument(file))throw new Error('Choose PDF or DOCX, maximum 8 MB.');
 if(!state.session?.access_token||!state.user?.id)throw new Error('Sign in to upload your CV.');
 const ext=file.type==='application/pdf'?'pdf':'docx';
 const path=state.user.id+'/'+crypto.randomUUID()+'.'+ext;
 const uri=SUPABASE_URL+'/storage/v1/object/self-career-documents/'+path.split('/').map(encodeURIComponent).join('/');
 const perform=async token=>fetch(uri,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token,
  'Content-Type':file.type,'x-upsert':'false'},body:file});
 let response=await perform(state.session.access_token);
 if(response.status===401&&await refresh())response=await perform(state.session.access_token);
 if(!response.ok){const d=await response.json().catch(()=>({message:response.statusText}));throw new Error(d.message||d.error||'Upload failed')}
 return path;
}
async function signCareerDocument(path){
 if(!state.user?.id||!path?.startsWith(state.user.id+'/'))throw new Error('Document does not belong to your account.');
 const data=await request('/storage/v1/object/sign/self-career-documents/'+path.split('/').map(encodeURIComponent).join('/'),
  {method:'POST',body:{expiresIn:300}});
 const signed=data?.signedURL||data?.signedUrl;
 if(!signed)throw new Error('Could not create a private document link.');
 if(signed.startsWith('https://'))return signed;
 return SUPABASE_URL+(signed.startsWith('/storage/v1/')?'':'/storage/v1')+(signed.startsWith('/')?'':'/')+signed;
}


// Career Prep portfolio artifacts live in a separate private bucket (never CV storage).
const PORTFOLIO_TYPES={
 pdf:'application/pdf',
 xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
function portfolioMime(file){
 const ext=String(file?.name||'').split('.').pop().toLowerCase();
 if(!Object.prototype.hasOwnProperty.call(PORTFOLIO_TYPES,ext))throw Error('Use PDF, XLSX, PPTX or DOCX.');
 if(!file.size||file.size>15*1024*1024)throw Error('File must be between 1 byte and 15 MB.');
 const mime=PORTFOLIO_TYPES[ext];
 if(file.type&&file.type!=='application/octet-stream'&&file.type!==mime)throw Error('File extension and type disagree.');
 return {ext,mime};
}
async function uploadPortfolioFile(file,track){
 if(!state.user?.id||!state.session?.access_token)throw Error('Login diperlukan sebelum upload.');
 if(!['PE','VC','Consulting'].includes(track))throw Error('Case track tidak valid.');
 const {ext,mime}=portfolioMime(file);
 const path=state.user.id+'/'+track+'/'+crypto.randomUUID()+'.'+ext;
 const url=SUPABASE_URL+'/storage/v1/object/self-career-portfolio/'+path.split('/').map(encodeURIComponent).join('/');
 const perform=token=>fetch(url,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token,'Content-Type':mime,'x-upsert':'false'},body:file});
 let res=await perform(state.session.access_token);
 if(res.status===401&&await refresh())res=await perform(state.session.access_token);
 if(!res.ok){const err=await res.json().catch(()=>({message:res.statusText}));throw Error(err.message||err.error||'Portfolio upload failed');}
 return {path,mime,bytes:file.size};
}
async function signPortfolioFile(path){
 if(!state.user?.id||!path?.startsWith(state.user.id+'/'))throw Error('File bukan milik akun ini.');
 const result=await request('/storage/v1/object/sign/self-career-portfolio/'+path.split('/').map(encodeURIComponent).join('/'),{method:'POST',body:{expiresIn:300}});
 const url=result?.signedURL||result?.signedUrl;
 if(!url)throw Error('Signed URL tidak tersedia.');
 if(url.startsWith('https://'))return url;
 return SUPABASE_URL+(url.startsWith('/storage/v1/')?'':'/storage/v1')+(url.startsWith('/')?'':'/')+url;
}
async function removePortfolioFile(path){
 if(!state.user?.id||!path?.startsWith(state.user.id+'/'))throw Error('File bukan milik akun ini.');
 return request('/storage/v1/object/self-career-portfolio/'+path.split('/').map(encodeURIComponent).join('/'),{method:'DELETE'});
}

window.SELFCareer?.init?.({state:()=>state,rooms:useRooms,render,navigate:go,request,insert,patch,del,notify:toast,icon:ic,newTask:()=>{state.newTaskSpace='';state.modal='task';render()},openTask:id=>{state.taskId=id;state.panelTab='overview';state.pageId=null;render()},reloadCore:loadAll,uploadDocument:uploadCareerDocument,signDocument:signCareerDocument,validateDocument:validateCareerDocument,uploadPortfolioFile,signPortfolioFile,removePortfolioFile,reloadCareer:()=>window.SELFCareer?.reload?.()});
window.SELFBoards?.init?.({state:()=>state,render,navigate:go,uploadImage:uploadBoardImage,signImage:signBoardImage,openTask:(id)=>{window.SELFBoards.ui.selected?.clear?.();state.taskId=id;state.panelTab='overview';state.pageId=null;render()},insert,patch,patchSimple,del,reload:loadAll,notify:toast});
window.SELFPalette?.init?.({views:()=>window.SELFWork?.views?.()||[],applyView:id=>window.SELFWork?.applySaved?.(id),state:()=>state,enabled:useRooms,today,go,goRoom,toggleTheme:()=>changeTheme(),insert,mutate,track:text=>window.SELFTrackerUI?.quickAdd?.(text),
 careerUi:()=>window.SELFCareer?.ui,spaceName:id=>spaceOf(id)?.name||'',statusName:s=>statusOf(s)[1],
 openTask:id=>{state.taskId=id;state.panelTab='overview';state.pageId=null;render()},
 openSpace:id=>{state.spaceId=id;state.spaceTab='tasks';go('space')},
 openBoard:id=>window.SELFBoards?.open?.(id),
 careerPage:page=>{if(page==='learning'&&!studyOn())return;const room=page==='learning'?'study':'hunt';go('career',{room});window.SELFCareer?.setPage?.(page)}});
window.SELFSync?.init?.({state:()=>state,request});window.SELFToday?.init?.({state:()=>state,esc,attr,ic,today,spaceOf,statusOf,dueBadge,rank:todayRank,insert,patch,del,mutate,toast,render,go});window.SELFReview?.init?.({host:{state:()=>state,today,render}});window.SELFNextUp?.init?.({host:{state:()=>state,render}});window.SELFWork?.init?.({host:{state:()=>state,patch,del,mutate,toast,render,go,STATUSES,PRIORITIES,statusName:s=>statusOf(s)[1]}});window.SELFExportUI?.init?.({host:{state:()=>state,toast}});
verifySession();

