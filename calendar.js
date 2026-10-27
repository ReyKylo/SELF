/* SELF Calendar: a deadline-first calendar for My Work (Month / Week / Agenda) with optional Google Calendar integration.
   Task deadlines come from tasks.due_date (a plain date, no time). Moving a deadline reuses the normal task PATCH path.
   Google Calendar: (1) no-setup path: "Add to Google Calendar" links and an .ics download; (2) connected path: Google Identity Services token flow in the browser
   with the calendar.events scope. The OAuth Client ID is the user's own (device-local), the access token stays in memory only, and SELF only ever edits events
   it created itself (tagged with a private extended property). Nothing is written to Supabase. The design is ported from kargulstudio/calender-app-design. */
(function(root){
'use strict';
const DAY=86400000;
const WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const PREF_KEY='self.cal.prefs';
const SCOPE='https://www.googleapis.com/auth/calendar.events';
const GAPI='https://www.googleapis.com/calendar/v3';
const OWN_TAG='SELF';

/* ---------- dates (all keys are local YYYY-MM-DD) ---------- */
const pad=n=>String(n).padStart(2,'0');
const keyOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const isKey=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&keyOf(parse(s))===s;
const parse=k=>{const [y,m,d]=String(k).split('-').map(Number);return new Date(y,(m||1)-1,d||1,12)};
const addDays=(k,n)=>{const d=parse(k);d.setDate(d.getDate()+n);return keyOf(d)};
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/DAY);
const startOfWeek=k=>{const d=parse(k);return addDays(k,-((d.getDay()+6)%7))};
const startOfMonth=k=>k.slice(0,7)+'-01';
const addMonths=(k,n)=>{const d=parse(startOfMonth(k));d.setMonth(d.getMonth()+n);return keyOf(d)};
const monthLabel=k=>MONTHS[parse(k).getMonth()]+' '+parse(k).getFullYear();
const shortDate=k=>parse(k).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const longDate=k=>parse(k).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
/* Weeks (Mon-first) covering the month: 4 to 6 rows of 7 keys. */
function monthGrid(anchor){
 const first=startOfMonth(anchor),last=addDays(addMonths(first,1),-1);
 const weeks=[];let cur=startOfWeek(first);
 while(cur<=last){weeks.push(Array.from({length:7},(_,i)=>addDays(cur,i)));cur=addDays(cur,7)}
 return weeks;
}
const weekDays=anchor=>{const s=startOfWeek(anchor);return Array.from({length:7},(_,i)=>addDays(s,i))};
function isoWeek(k){const d=parse(k);d.setDate(d.getDate()+3-((d.getDay()+6)%7));const w1=new Date(d.getFullYear(),0,4,12);return 1+Math.round(((d-w1)/DAY-3+((w1.getDay()+6)%7))/7)}

/* ---------- deadlines ---------- */
const PRIORITY_RANK={high:0,normal:1,low:2};
/* urgency of one task relative to today: done | overdue | today | soon (1-3 days) | later */
function urgency(task,today){
 if(task.status==='done')return 'done';
 if(!isKey(task.due_date))return 'none';
 const n=diffDays(today,task.due_date);
 return n<0?'overdue':n===0?'today':n<=3?'soon':'later';
}
function relative(task,today){
 if(!isKey(task.due_date))return 'No deadline';
 const n=diffDays(today,task.due_date);
 if(task.status==='done')return 'Done';
 if(n<0)return Math.abs(n)+'d late';
 if(n===0)return 'Due today';
 if(n===1)return 'Tomorrow';
 return 'in '+n+'d';
}
const byDeadline=(a,b)=>String(a.due_date).localeCompare(String(b.due_date))||(PRIORITY_RANK[a.priority]??1)-(PRIORITY_RANK[b.priority]??1)||String(a.title).localeCompare(String(b.title));
/* Tasks that should appear on the calendar; showDone=false hides finished work. */
const scheduled=(tasks,{showDone=false}={})=>tasks.filter(t=>isKey(t.due_date)&&(showDone||t.status!=='done')).sort(byDeadline);
const unscheduled=tasks=>tasks.filter(t=>!isKey(t.due_date)&&t.status!=='done').sort((a,b)=>(PRIORITY_RANK[a.priority]??1)-(PRIORITY_RANK[b.priority]??1)||String(a.title).localeCompare(String(b.title)));
function groupByDate(tasks){const m=new Map();for(const t of tasks){if(!m.has(t.due_date))m.set(t.due_date,[]);m.get(t.due_date).push(t)}return m}
function summary(tasks,today){
 const out={overdue:0,today:0,week:0,unscheduled:0};
 for(const t of tasks){
  if(t.status==='done')continue;
  if(!isKey(t.due_date)){out.unscheduled++;continue}
  const n=diffDays(today,t.due_date);
  if(n<0)out.overdue++;else if(n===0)out.today++;else if(n<=7)out.week++;
 }
 return out;
}
/* Agenda sections: Overdue, Today, Tomorrow, This week (to +7d), Later. Empty sections are dropped. */
function agenda(tasks,today){
 const defs=[['overdue','Overdue'],['today','Today'],['tomorrow','Tomorrow'],['week','Next 7 days'],['later','Later']];
 const g=Object.fromEntries(defs.map(([k])=>[k,[]]));
 for(const t of scheduled(tasks)){
  const n=diffDays(today,t.due_date);
  g[n<0?'overdue':n===0?'today':n===1?'tomorrow':n<=7?'week':'later'].push(t);
 }
 return defs.filter(([k])=>g[k].length).map(([k,label])=>({id:k,label,tasks:g[k]}));
}

/* ---------- Google Calendar: links, ICS, API payloads ---------- */
const compact=k=>k.replace(/-/g,'');
const clip=(s,n)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
function googleTemplateUrl(task,space=''){
 const q=new URLSearchParams({action:'TEMPLATE',text:'Due: '+clip(task.title,200),dates:compact(task.due_date)+'/'+compact(addDays(task.due_date,1)),details:[space&&'Space: '+space,task.priority&&'Priority: '+task.priority,'From SELF'].filter(Boolean).join('\n')});
 return 'https://calendar.google.com/calendar/render?'+q.toString();
}
const icsEscape=s=>String(s??'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
function fold(line){
 if(line.length<=74)return line;
 const parts=[line.slice(0,74)];for(let i=74;i<line.length;i+=73)parts.push(' '+line.slice(i,i+73));
 return parts.join('\r\n');
}
/* All-day VEVENT per open task with a deadline, with a 9am reminder the day before and on the day. */
function buildIcs(tasks,{spaceName=()=>'',now=new Date(),includeDone=false}={}){
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SELF//Deadlines//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:SELF deadlines'];
 for(const t of scheduled(tasks,{showDone:includeDone})){
  const sp=spaceName(t.space_id);
  lines.push('BEGIN:VEVENT','UID:'+t.id+'@self','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+compact(t.due_date),'DTEND;VALUE=DATE:'+compact(addDays(t.due_date,1)),
   'SUMMARY:'+icsEscape('Due: '+clip(t.title,200)),'DESCRIPTION:'+icsEscape([sp&&'Space: '+sp,'Priority: '+(t.priority||'normal'),'Status: '+(t.status||'todo')].filter(Boolean).join('\n')),
   'TRANSP:TRANSPARENT','STATUS:'+(t.status==='done'?'CANCELLED':'CONFIRMED'),
   'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape('Due tomorrow: '+clip(t.title,100)),'TRIGGER:-PT15H','END:VALARM',
   'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape('Due today: '+clip(t.title,100)),'TRIGGER:PT9H','END:VALARM','END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 return lines.map(fold).join('\r\n')+'\r\n';
}
/* The Google event SELF owns for one task. All-day, free (does not block time), tagged so it can be found again. */
function eventPayload(task,space=''){
 return {summary:(task.status==='done'?'✓ ':'Due: ')+clip(task.title,200),description:[space&&'Space: '+space,'Priority: '+(task.priority||'normal'),'Managed by SELF. Change the deadline in SELF.'].filter(Boolean).join('\n'),
  start:{date:task.due_date},end:{date:addDays(task.due_date,1)},transparency:'transparent',
  reminders:{useDefault:false,overrides:[{method:'popup',minutes:900}]},extendedProperties:{private:{selfApp:OWN_TAG,selfTaskId:String(task.id)}}};
}
/* Compare tasks with the events SELF already created. removals only when allowRemove (full sync):
   an owned event whose task is gone or lost its deadline is deleted. Done tasks are kept and marked with a check. */
function planSync(tasks,events,{spaceName=()=>'',allowRemove=true}={}){
 const own=new Map();
 for(const e of events||[]){const id=e?.extendedProperties?.private?.selfTaskId;if(id&&e.extendedProperties.private.selfApp===OWN_TAG)own.set(id,e)}
 const plan={create:[],update:[],remove:[],same:0};const seen=new Set();
 for(const t of tasks||[]){
  if(!isKey(t.due_date))continue;
  seen.add(String(t.id));
  const want=eventPayload(t,spaceName(t.space_id)),have=own.get(String(t.id));
  if(!have){if(t.status!=='done')plan.create.push({task:t,body:want});continue}
  if(have.start?.date!==want.start.date||have.summary!==want.summary)plan.update.push({task:t,eventId:have.id,body:want});else plan.same++;
 }
 if(allowRemove)for(const [id,e] of own)if(!seen.has(id))plan.remove.push({taskId:id,eventId:e.id,title:e.summary});
 return plan;
}
/* Google event -> a flat shape the calendar can lay out; multi-day all-day events get one entry per day via spanDays. */
function mapGoogleEvent(e){
 if(!e||e.status==='cancelled')return null;
 const own=e.extendedProperties?.private?.selfApp===OWN_TAG;
 const title=e.summary||'(No title)';
 if(e.start?.date){
  const end=e.end?.date?addDays(e.end.date,-1):e.start.date;
  return {id:e.id,title,date:e.start.date,endDate:end<e.start.date?e.start.date:end,time:'',allDay:true,own,taskId:own?e.extendedProperties.private.selfTaskId:null,link:e.htmlLink||''};
 }
 if(e.start?.dateTime){
  const s=new Date(e.start.dateTime);if(Number.isNaN(s.getTime()))return null;
  const date=keyOf(s);return {id:e.id,title,date,endDate:date,time:pad(s.getHours())+':'+pad(s.getMinutes()),allDay:false,own,taskId:null,link:e.htmlLink||''};
 }
 return null;
}
function eventsByDate(mapped){
 const m=new Map();
 for(const ev of mapped){if(!ev)continue;for(let d=ev.date,i=0;d<=ev.endDate&&i<31;d=addDays(d,1),i++){if(!m.has(d))m.set(d,[]);m.get(d).push(ev)}}
 for(const list of m.values())list.sort((a,b)=>(a.allDay===b.allDay?0:a.allDay?-1:1)||a.time.localeCompare(b.time));
 return m;
}

/* ---------- UI state ---------- */
const S={view:'month',anchor:null,showDone:false,showEvents:true,panel:false,clientId:'',token:null,expires:0,connected:false,calendarId:'primary',
 events:[],rangeKey:'',loading:false,syncing:false,message:'',error:false,drag:null,ownIds:new Set()};
let host=null,tokenClient=null;
const doc=typeof document!=='undefined'?document:null;
const store=()=>{try{return root.localStorage}catch{return null}};
function loadPrefs(){
 try{const p=JSON.parse(store()?.getItem(PREF_KEY)||'{}');
  if(['month','week','agenda'].includes(p.view))S.view=p.view;
  S.showDone=!!p.showDone;S.showEvents=p.showEvents!==false;S.clientId=typeof p.clientId==='string'?p.clientId.slice(0,200):'';S.wasConnected=!!p.wasConnected;
 }catch{}
}
function savePrefs(){try{store()?.setItem(PREF_KEY,JSON.stringify({view:S.view,showDone:S.showDone,showEvents:S.showEvents,clientId:S.clientId,wasConnected:S.connected||S.wasConnected}))}catch{}}
const todayKey=()=>host?.today?.()||keyOf(new Date());
const anchor=()=>S.anchor||(S.anchor=todayKey());
const tasks=()=>host?.state?.().tasks||[];
const spaceName=id=>host?.spaceOf?.(id)?.name||'';
const connected=()=>S.connected&&!!S.token&&Date.now()<S.expires;

/* ---------- Google API ---------- */
function loadGis(){
 if(root.google?.accounts?.oauth2)return Promise.resolve();
 return new Promise((res,rej)=>{
  const s=doc.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>res();s.onerror=()=>rej(new Error('Could not load Google sign-in. Check your connection or ad blocker.'));doc.head.appendChild(s);
 });
}
async function gfetch(path,{method='GET',body}={}){
 if(!connected())throw new Error('Google Calendar is not connected. Press Connect again.');
 const r=await fetch(GAPI+path,{method,headers:{Authorization:'Bearer '+S.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 if(r.status===401){S.token=null;S.connected=false;throw new Error('Google session expired. Press Connect to sign in again.')}
 if(r.status===204)return null;
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data?.error?.message||'Google Calendar error '+r.status);
 return data;
}
async function connect(){
 const id=S.clientId.trim();
 if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(id)){say('Paste a valid OAuth Client ID (ends with .apps.googleusercontent.com).',true);return}
 S.loading=true;say('Opening Google sign-in…');
 try{
  await loadGis();
  await new Promise((resolve,reject)=>{
   tokenClient=root.google.accounts.oauth2.initTokenClient({client_id:id,scope:SCOPE,
    callback:r=>{if(r.error||!r.access_token)return reject(new Error(r.error_description||r.error||'Google sign-in was cancelled.'));S.token=r.access_token;S.expires=Date.now()+(Number(r.expires_in)||3600)*1000-30000;S.connected=true;resolve()},
    error_callback:e=>reject(new Error(e?.type==='popup_closed'?'Google sign-in was closed before finishing.':(e?.message||'Google sign-in failed.')))});
   tokenClient.requestAccessToken({prompt:S.wasConnected?'':'consent'});
  });
  S.wasConnected=true;savePrefs();S.rangeKey='';say('Connected to Google Calendar.');await loadEvents(true);
 }catch(e){S.connected=false;say(e.message,true)}
 S.loading=false;host?.render?.();
}
function disconnect(){
 try{if(S.token)root.google?.accounts?.oauth2?.revoke?.(S.token,()=>{})}catch{}
 S.token=null;S.connected=false;S.wasConnected=false;S.events=[];S.rangeKey='';S.ownIds=new Set();savePrefs();say('Disconnected from Google Calendar.');host?.render?.();
}
function visibleRange(){
 const a=anchor();
 if(S.view==='week'){const d=weekDays(a);return [d[0],d[6]]}
 if(S.view==='agenda')return [todayKey(),addDays(todayKey(),60)];
 const g=monthGrid(a);return [g[0][0],g[g.length-1][6]];
}
async function loadEvents(force=false){
 if(!connected()||!S.showEvents)return;
 const [from,to]=visibleRange(),key=S.calendarId+'|'+from+'|'+to;
 if(!force&&key===S.rangeKey)return;
 S.rangeKey=key;
 try{
  const q=new URLSearchParams({timeMin:parse(from).toISOString().slice(0,10)+'T00:00:00'+tzOffset(parse(from)),timeMax:addDays(to,1)+'T00:00:00'+tzOffset(parse(to)),singleEvents:'true',orderBy:'startTime',maxResults:'250'});
  const data=await gfetch('/calendars/'+encodeURIComponent(S.calendarId)+'/events?'+q);
  const mapped=(data?.items||[]).map(mapGoogleEvent).filter(Boolean);
  S.events=mapped.filter(e=>!e.own);S.ownIds=new Set(mapped.filter(e=>e.own&&e.taskId).map(e=>e.taskId));
 }catch(e){S.rangeKey='';say(e.message,true)}
 host?.render?.();
}
function tzOffset(d){const o=-d.getTimezoneOffset(),s=o>=0?'+':'-';return s+pad(Math.floor(Math.abs(o)/60))+':'+pad(Math.abs(o)%60)}
async function ownEvents(){
 const q=new URLSearchParams({privateExtendedProperty:'selfApp='+OWN_TAG,maxResults:'2500',showDeleted:'false'});
 return (await gfetch('/calendars/'+encodeURIComponent(S.calendarId)+'/events?'+q))?.items||[];
}
async function applyPlan(plan){
 const base='/calendars/'+encodeURIComponent(S.calendarId)+'/events';let failed=0;
 const run=async fn=>{try{await fn()}catch(e){failed++;if(!S.error)say(e.message,true)}};
 for(const c of plan.create)await run(()=>gfetch(base,{method:'POST',body:c.body}));
 for(const u of plan.update)await run(()=>gfetch(base+'/'+encodeURIComponent(u.eventId),{method:'PATCH',body:u.body}));
 for(const r of plan.remove)await run(()=>gfetch(base+'/'+encodeURIComponent(r.eventId),{method:'DELETE'}));
 return failed;
}
async function syncAll(){
 if(S.syncing)return;
 if(!connected()){say('Connect Google Calendar first.',true);host?.render?.();return}
 S.syncing=true;say('Syncing deadlines…');host?.render?.();
 try{
  const plan=planSync(tasks(),await ownEvents(),{spaceName});
  const failed=await applyPlan(plan);
  S.rangeKey='';
  const parts=[plan.create.length&&plan.create.length+' added',plan.update.length&&plan.update.length+' updated',plan.remove.length&&plan.remove.length+' removed',plan.same&&plan.same+' already up to date'].filter(Boolean);
  say(failed?failed+' change(s) failed. '+S.message:'Google Calendar synced: '+(parts.join(', ')||'nothing to do')+'.',!!failed);
  await loadEvents(true);
 }catch(e){say(e.message,true)}
 S.syncing=false;host?.render?.();
}
/* After a deadline moves in SELF, keep an already-pushed Google event in step. Silent when not connected. */
async function syncOne(id){
 if(!connected())return;
 try{const t=tasks().find(x=>x.id===id);if(!t||!S.ownIds.has(String(id)))return;
  const plan=planSync([t],await ownEvents(),{spaceName,allowRemove:false});await applyPlan(plan);S.rangeKey='';await loadEvents(true);
 }catch(e){say('Deadline saved, but Google Calendar was not updated: '+e.message,true);host?.render?.()}
}
async function pushOne(id){
 const t=tasks().find(x=>x.id===id);if(!t||!isKey(t.due_date))return;
 if(!connected()){say('Connect Google Calendar to push events, or use “Add to Google” link.',true);S.panel=true;host?.render?.();return}
 try{const plan=planSync([t],await ownEvents(),{spaceName,allowRemove:false});await applyPlan(plan);say('“'+clip(t.title,40)+'” is on your Google Calendar.');S.rangeKey='';await loadEvents(true)}catch(e){say(e.message,true)}
 host?.render?.();
}
function say(msg,isErr=false){S.message=msg;S.error=isErr}
function download(name,text,type){
 const a=doc.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;doc.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ---------- rendering ---------- */
const e=s=>host.esc(s),a=s=>host.attr(s);
const ic=(n,s)=>host.ic(n,s);
function chip(t,today,{full=false}={}){
 const u=urgency(t,today),synced=S.ownIds.has(String(t.id));
 return `<button type="button" class="cal-chip u-${u} p-${a(t.priority||'normal')}" draggable="true" data-cal-drag="${a(t.id)}" data-action="open-task" data-id="${a(t.id)}" title="${a(t.title+' · '+relative(t,today))}">`+
  `<span class="cal-chip-dot"></span><span class="cal-chip-title">${e(t.title)}</span>${synced?'<span class="cal-chip-g" title="On Google Calendar">G</span>':''}${full?`<span class="cal-chip-rel">${e(relative(t,today))}</span>`:''}</button>`;
}
const gEvent=ev=>`<a class="cal-gev${ev.allDay?' allday':''}" ${ev.link?`href="${a(ev.link)}" target="_blank" rel="noopener"`:''} title="${a(ev.title)} · Google Calendar">${ev.time?`<time>${e(ev.time)}</time>`:''}<span>${e(ev.title)}</span></a>`;

function header(){
 const v=S.view,an=anchor();
 let title=monthLabel(an),sub='';
 if(v==='week'){const d=weekDays(an);title=monthLabel(d[0])+(d[0].slice(0,7)!==d[6].slice(0,7)?' – '+MONTHS[parse(d[6]).getMonth()]:'');sub='Week '+isoWeek(d[0])+' · '+shortDate(d[0])+' – '+shortDate(d[6])}
 else if(v==='agenda'){title='Upcoming deadlines';sub='Sorted by due date'}
 else sub=shortDate(startOfMonth(an))+' – '+shortDate(addDays(addMonths(startOfMonth(an),1),-1));
 const unit=v==='week'?'week':v==='month'?'month':'';
 const g=connected()?'on':'off';
 return `<div class="cal-head"><div class="cal-title"><h2>${e(title)}</h2><p>${e(sub)}</p></div>`+
  `<div class="cal-nav">${v==='agenda'?'':`<button type="button" class="cal-btn" data-cal="today" aria-keyshortcuts="T">Today</button><div class="cal-step"><button type="button" data-cal="prev" aria-label="Previous ${unit}">${ic('back',16)}</button><button type="button" data-cal="next" aria-label="Next ${unit}">${ic('chevron',16)}</button></div>`}`+
  `<div class="cal-seg" role="tablist" aria-label="Calendar view">${[['month','Month'],['week','Week'],['agenda','Agenda']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${v===k}" class="${v===k?'on':''}" data-cal="view" data-view="${k}">${l}</button>`).join('')}</div>`+
  `<button type="button" class="cal-btn cal-google ${g}" data-cal="panel" aria-expanded="${S.panel}">${ic('calendar',15)} Google${connected()?' · connected':''}</button></div></div>`;
}
function strip(today){
 const s=summary(tasks(),today);
 const item=(k,label,n,cls)=>`<button type="button" class="cal-stat ${cls}${n?'':' zero'}" data-cal="stat" data-stat="${k}"><strong>${n}</strong><span>${label}</span></button>`;
 return `<div class="cal-stats">${item('overdue','Overdue',s.overdue,'red')}${item('today','Due today',s.today,'yellow')}${item('week','Next 7 days',s.week,'blue')}${item('unscheduled','No deadline',s.unscheduled,'gray')}`+
  `<label class="cal-toggle"><input type="checkbox" data-cal-toggle="showDone" ${S.showDone?'checked':''}/> Show done</label></div>`;
}
function panel(){
 if(!S.panel)return '';
 const origin=root.location?.origin||'';
 const on=connected();
 return `<section class="cal-panel" aria-label="Google Calendar"><div class="cal-panel-col"><h3>Google Calendar</h3>`+
  (on?`<p class="cal-ok">Connected. SELF reads your events (shown in grey) and only edits deadline events it created itself.</p>
   <div class="cal-row"><button type="button" class="cal-btn primary" data-cal="sync" ${S.syncing?'disabled':''}>${S.syncing?'Syncing…':'Sync deadlines to Google'}</button><button type="button" class="cal-btn" data-cal="disconnect">Disconnect</button></div>
   <label class="cal-toggle"><input type="checkbox" data-cal-toggle="showEvents" ${S.showEvents?'checked':''}/> Show my Google events on this calendar</label>`
  :`<p>Link your Google Calendar to see its events next to your deadlines and push deadlines out as all-day events with reminders.</p>
   <label class="cal-field">OAuth Client ID<input class="field" data-cal-input="clientId" value="${a(S.clientId)}" placeholder="1234-abc.apps.googleusercontent.com" autocomplete="off" spellcheck="false"/></label>
   <div class="cal-row"><button type="button" class="cal-btn primary" data-cal="connect" ${S.loading?'disabled':''}>${S.loading?'Connecting…':S.wasConnected?'Reconnect':'Connect Google Calendar'}</button></div>
   <details class="cal-help"><summary>How to get a Client ID (2 minutes, free)</summary><ol>
    <li>Google Cloud Console → create a project → enable <b>Google Calendar API</b>.</li>
    <li>APIs &amp; Services → Credentials → <b>Create OAuth client ID</b> → type <b>Web application</b>.</li>
    <li>Add this under <b>Authorized JavaScript origins</b>: <code>${e(origin)}</code></li>
    <li>OAuth consent screen: add yourself as a test user. Copy the Client ID here.</li></ol>
    <p>Only the Client ID is stored, on this device. The access token lives in memory and is gone when you close the tab.</p></details>`)+
  (S.message?`<p class="cal-msg ${S.error?'err':''}" role="status">${e(S.message)}</p>`:'')+
  `</div><div class="cal-panel-col"><h3>No sign-in needed</h3><p>Works without any setup: download every deadline as an .ics file (import into Google Calendar, Apple Calendar or Outlook), or add a single task with the <b>Add to Google</b> link in Agenda view.</p>
   <div class="cal-row"><button type="button" class="cal-btn" data-cal="ics">Download deadlines (.ics)</button></div></div></section>`;
}
function tray(today){
 const list=unscheduled(tasks());
 if(!list.length)return '';
 return `<section class="cal-tray" aria-label="Tasks without a deadline"><h3>No deadline <span>${list.length}</span></h3><p>Drag a task onto a day to set its deadline.</p><div class="cal-tray-list">${list.slice(0,30).map(t=>chip(t,today)).join('')}${list.length>30?`<span class="cal-more-note">+${list.length-30} more in List view</span>`:''}</div></section>`;
}
function dayCell(k,ctx,{month=null}={}){
 const {today,by,ev}=ctx,list=by.get(k)||[],gs=S.showEvents?(ev.get(k)||[]):[];
 const out=month&&k.slice(0,7)!==month,isToday=k===today;
 const max=month?3:99,room=Math.max(0,max-list.length),shown=list.slice(0,max),hidden=list.length-shown.length;
 return `<div class="cal-cell${out?' out':''}${isToday?' today':''}${k<today?' past':''}" data-cal-drop="${k}" data-cal="new" data-date="${k}" role="gridcell" aria-label="${a(longDate(k))}">`+
  `<div class="cal-daynum"><span>${month?parse(k).getDate():WEEKDAYS[(parse(k).getDay()+6)%7]+' '+parse(k).getDate()}</span>${list.length&&!month?`<em>${list.length}</em>`:''}<button type="button" class="cal-add" data-cal="new" data-date="${k}" aria-label="Add task due ${a(longDate(k))}">${ic('plus',13)}</button></div>`+
  `<div class="cal-items">${shown.map(t=>chip(t,today)).join('')}${hidden>0?`<button type="button" class="cal-more" data-cal="day" data-date="${k}">+${hidden} more</button>`:''}${gs.slice(0,month?Math.max(room,1):99).map(gEvent).join('')}${month&&gs.length>Math.max(room,1)?`<span class="cal-more-note">+${gs.length-Math.max(room,1)} Google</span>`:''}</div></div>`;
}
function monthView(ctx){
 const an=anchor(),weeks=monthGrid(an),month=an.slice(0,7);
 return `<div class="cal-month" role="grid" aria-label="${a(monthLabel(an))}"><div class="cal-dow" role="row">${WEEKDAYS.map(d=>`<span role="columnheader">${d}</span>`).join('')}</div>${weeks.map(w=>`<div class="cal-week" role="row">${w.map(k=>dayCell(k,ctx,{month})).join('')}</div>`).join('')}</div>`;
}
function weekView(ctx){return `<div class="cal-weekview" role="grid">${weekDays(anchor()).map(k=>dayCell(k,ctx)).join('')}</div>`}
function agendaView(ctx){
 const groups=agenda(tasks().filter(t=>S.showDone||t.status!=='done'),ctx.today);
 if(!groups.length)return `<div class="cal-empty"><strong>No deadlines yet</strong><span>Give a task a due date, or drag one from “No deadline”, and it shows up here.</span></div>`;
 return `<div class="cal-agenda">${groups.map(g=>`<section class="cal-group g-${g.id}"><h3>${e(g.label)} <span>${g.tasks.length}</span></h3>${g.tasks.map(t=>{
  const u=urgency(t,ctx.today),synced=S.ownIds.has(String(t.id)),sp=spaceName(t.space_id);
  return `<div class="cal-row-item u-${u}"><span class="cal-date">${e(shortDate(t.due_date))}</span><div class="cal-row-main" data-action="open-task" data-id="${a(t.id)}"><strong class="${t.status==='done'?'done':''}">${e(t.title)}</strong><small>${e(sp||'Unsorted')} · ${e(host.statusOf(t.status)[1])}${t.priority==='high'?' · High priority':''}</small></div>`+
   `<span class="cal-rel">${e(relative(t,ctx.today))}</span><span class="cal-acts">${synced?`<span class="cal-synced">${ic('check',13)} On Google</span>`:`<a class="cal-link" href="${a(googleTemplateUrl(t,sp))}" target="_blank" rel="noopener" data-cal-stop title="Open Google Calendar with this deadline filled in">Add to Google</a>${connected()?`<button type="button" class="cal-link" data-cal="push" data-id="${a(t.id)}">Push</button>`:''}`}</span></div>`}).join('')}</section>`).join('')}</div>`;
}
function render(){
 if(!host)return '';
 const today=todayKey(),all=tasks().filter(t=>!S.showDone?t.status!=='done':true);
 const by=groupByDate(scheduled(host.filtered?host.filtered():all,{showDone:S.showDone}));
 const ev=eventsByDate(S.events);
 const ctx={today,by,ev};
 if(connected()&&S.showEvents)queueMicrotask(()=>loadEvents());
 const body=S.view==='agenda'?agendaView(ctx):(S.view==='week'?weekView(ctx):monthView(ctx))+tray(today);
 return `<div class="cal" data-cal-root>${header()}${panel()}${strip(today)}${S.message&&!S.panel?`<p class="cal-msg ${S.error?'err':''}" role="status">${e(S.message)}</p>`:''}${body}</div>`;
}

/* ---------- actions ---------- */
function step(dir){
 const an=anchor();
 S.anchor=S.view==='week'?addDays(an,7*dir):addMonths(an,dir);
 S.rangeKey='';host.render();
}
async function moveDeadline(id,date){
 const t=tasks().find(x=>x.id===id);
 if(!t||!isKey(date)||t.due_date===date)return;
 const ok=await host.mutate(async()=>host.patch('tasks',id,{due_date:date}),'Deadline set to '+shortDate(date));
 if(ok!==false)syncOne(id);
}
function act(el){
 const k=el.dataset.cal;
 if(k==='prev')return step(-1);
 if(k==='next')return step(1);
 if(k==='today'){S.anchor=todayKey();S.rangeKey='';return host.render()}
 if(k==='view'){S.view=el.dataset.view;S.rangeKey='';savePrefs();return host.render()}
 if(k==='panel'){S.panel=!S.panel;return host.render()}
 if(k==='day'){S.anchor=el.dataset.date;S.view='week';S.rangeKey='';savePrefs();return host.render()}
 if(k==='new'){if(el.dataset.date)host.newTask?.(el.dataset.date);return}
 if(k==='stat'){S.view='agenda';savePrefs();return host.render()}
 if(k==='connect')return connect();
 if(k==='disconnect')return disconnect();
 if(k==='sync')return syncAll();
 if(k==='push')return pushOne(el.dataset.id);
 if(k==='ics'){
  const n=scheduled(tasks()).length;
  if(!n){say('No open deadlines to export yet.',true);return host.render()}
  download('self-deadlines.ics',buildIcs(tasks(),{spaceName}),'text/calendar');say('Downloaded '+n+' deadline'+(n===1?'':'s')+'. Import the file in Google Calendar: Settings → Import & export.');return host.render();
 }
}
function onClick(ev){
 const t=ev.target;
 if(t.closest?.('[data-cal-stop]')){ev.stopPropagation();return}
 const el=t.closest?.('[data-cal]');
 if(!el||!t.closest('[data-cal-root]'))return;
 /* a click on a chip or button inside a day cell must not also create a task */
 if(el.dataset.cal==='new'&&t.closest('.cal-chip,.cal-gev,.cal-more'))return;
 ev.preventDefault();act(el);
}
function onChange(ev){
 const el=ev.target;
 if(el.dataset?.calToggle){S[el.dataset.calToggle]=el.checked;S.rangeKey='';savePrefs();host.render()}
}
function onInput(ev){const el=ev.target;if(el.dataset?.calInput==='clientId'){S.clientId=el.value;savePrefs()}}
function onDragStart(ev){
 const c=ev.target.closest?.('[data-cal-drag]');if(!c)return;
 S.drag=c.dataset.calDrag;ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',S.drag);c.classList.add('dragging');
}
function onDragOver(ev){
 const c=ev.target.closest?.('[data-cal-drop]');if(!c||!S.drag)return;
 ev.preventDefault();ev.dataTransfer.dropEffect='move';
 doc.querySelectorAll('.cal-cell.drop').forEach(x=>x!==c&&x.classList.remove('drop'));c.classList.add('drop');
}
function onDrop(ev){
 const c=ev.target.closest?.('[data-cal-drop]');if(!c||!S.drag)return;
 ev.preventDefault();const id=S.drag;S.drag=null;moveDeadline(id,c.dataset.calDrop);
}
function onDragEnd(){S.drag=null;doc.querySelectorAll('.cal-cell.drop,.cal-chip.dragging').forEach(x=>x.classList.remove('drop','dragging'))}
function onKey(ev){
 if(ev.key==='Escape'&&S.panel&&ev.target.closest?.('[data-cal-root]')){S.panel=false;host.render()}
}

function init(h){
 host=h;loadPrefs();
 if(doc&&!init.bound){
  init.bound=true;
  doc.addEventListener('click',onClick);doc.addEventListener('change',onChange);doc.addEventListener('input',onInput);doc.addEventListener('keydown',onKey);
  doc.addEventListener('dragstart',onDragStart);doc.addEventListener('dragover',onDragOver);doc.addEventListener('drop',onDrop);doc.addEventListener('dragend',onDragEnd);
 }
}
/* Sign-out on a shared browser: forget the token and the Google events, keep nothing in memory. */
function reset(){S.token=null;S.connected=false;S.events=[];S.ownIds=new Set();S.rangeKey='';S.message='';S.panel=false;S.anchor=null}

const api={init,render,reset,state:S,
 keyOf,parse,addDays,diffDays,startOfWeek,startOfMonth,addMonths,monthGrid,weekDays,isoWeek,isKey,
 urgency,relative,scheduled,unscheduled,groupByDate,summary,agenda,
 googleTemplateUrl,buildIcs,eventPayload,planSync,mapGoogleEvent,eventsByDate};
root.SELFCalendar=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
