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
function buildIcs(tasks,{spaceName=()=>'',now=new Date(),includeDone=false,routines=[]}={}){
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
 for(const r of routines)lines.push(...buildRoutineIcs(r,stamp));
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
  return {id:e.id,title,date:e.start.date,endDate:end<e.start.date?e.start.date:end,time:'',allDay:true,own,taskId:own?e.extendedProperties.private.selfTaskId||null:null,routineId:own?e.extendedProperties.private.selfRoutineId||null:null,link:e.htmlLink||''};
 }
 if(e.start?.dateTime){
  const s=new Date(e.start.dateTime);if(Number.isNaN(s.getTime()))return null;
  const date=keyOf(s);return {id:e.id,title,date,endDate:date,time:pad(s.getHours())+':'+pad(s.getMinutes()),allDay:false,own,taskId:null,routineId:own?e.extendedProperties.private.selfRoutineId||null:null,link:e.htmlLink||''};
 }
 return null;
}
function eventsByDate(mapped){
 const m=new Map();
 for(const ev of mapped){if(!ev)continue;for(let d=ev.date,i=0;d<=ev.endDate&&i<31;d=addDays(d,1),i++){if(!m.has(d))m.set(d,[]);m.get(d).push(ev)}}
 for(const list of m.values())list.sort((a,b)=>(a.allDay===b.allDay?0:a.allDay?-1:1)||a.time.localeCompare(b.time));
 return m;
}

/* ---------- routines: things that repeat (every week, every 2 weeks, daily, monthly) ----------
   Stored per account as JSON in localStorage under self.cal.routines.<userId> (mirrored through user_kv by user-sync.js; no schema change).
   Weekdays are 0=Mon .. 6=Sun. Occurrences are computed for the visible range, never stored. skip = dates removed, done = dates ticked off. */
const FREQS=['daily','weekly','monthly'];
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_CODES=['MO','TU','WE','TH','FR','SA','SU'];
const wd=k=>(parse(k).getDay()+6)%7;
const dateList=v=>Array.isArray(v)?[...new Set(v.filter(isKey))].sort().slice(-400):[];
function cleanRoutine(r){
 if(!r||typeof r.id!=='string'||!r.id)return null;
 const title=clip(r.title,120);if(!title||!isKey(r.start))return null;
 const freq=FREQS.includes(r.freq)?r.freq:'weekly';
 const interval=Math.min(12,Math.max(1,parseInt(r.interval,10)||1));
 let days=Array.isArray(r.days)?[...new Set(r.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():[];
 if(freq==='weekly'&&!days.length)days=[wd(r.start)];
 const time=TIME.test(r.time)?r.time:'',endTime=time&&TIME.test(r.endTime)&&r.endTime>time?r.endTime:'';
 return {id:r.id,title,freq,interval,days:freq==='weekly'?days:[],start:r.start,until:isKey(r.until)&&r.until>=r.start?r.until:null,time,endTime,skip:dateList(r.skip),done:dateList(r.done)};
}
const cleanRoutines=raw=>(Array.isArray(raw)?raw:[]).map(cleanRoutine).filter(Boolean).slice(0,100);
const monthIndex=k=>{const d=parse(k);return d.getFullYear()*12+d.getMonth()};
const daysInMonth=k=>new Date(parse(k).getFullYear(),parse(k).getMonth()+1,0).getDate();
/* Does the rule hit this date? (ignores skip) */
function matches(r,k){
 if(k<r.start||(r.until&&k>r.until))return false;
 if(r.freq==='daily')return diffDays(r.start,k)%r.interval===0;
 if(r.freq==='weekly')return r.days.includes(wd(k))&&Math.floor(diffDays(startOfWeek(r.start),startOfWeek(k))/7)%r.interval===0;
 return (monthIndex(k)-monthIndex(r.start))%r.interval===0&&parse(k).getDate()===Math.min(parse(r.start).getDate(),daysInMonth(k));
}
const occursOn=(r,k)=>matches(r,k)&&!r.skip.includes(k);
function occurrences(r,from,to){
 const out=[];for(let k=from<r.start?r.start:from,i=0;k<=to&&i<800;k=addDays(k,1),i++)if(occursOn(r,k))out.push(k);
 return out;
}
const firstOccurrence=r=>{for(let k=r.start,i=0;i<800&&(!r.until||k<=r.until);k=addDays(k,1),i++)if(matches(r,k))return k;return null};
function routinesByDate(routines,from,to){
 const m=new Map();
 for(const r of routines)for(const k of occurrences(r,from,to)){if(!m.has(k))m.set(k,[]);m.get(k).push({r,date:k,done:r.done.includes(k)})}
 for(const l of m.values())l.sort((a,b)=>a.r.time.localeCompare(b.r.time)||a.r.title.localeCompare(b.r.title));
 return m;
}
function describe(r){
 const n=r.interval,t=r.time?' at '+r.time+(r.endTime?'–'+r.endTime:''):'';
 if(r.freq==='daily')return (n===1?'Every day':'Every '+n+' days')+t;
 if(r.freq==='monthly')return (n===1?'Every month':'Every '+n+' months')+' on day '+parse(r.start).getDate()+t;
 return (n===1?'Every week':'Every '+n+' weeks')+' on '+r.days.map(d=>WEEKDAYS[d]).join(', ')+t;
}
function rrule(r,{allDay=true}={}){
 const p=['FREQ='+r.freq.toUpperCase()];
 if(r.interval>1)p.push('INTERVAL='+r.interval);
 if(r.freq==='weekly')p.push('BYDAY='+r.days.map(d=>DAY_CODES[d]).join(','));
 if(r.freq==='monthly')p.push('BYMONTHDAY='+parse(r.start).getDate());
 if(r.until)p.push('UNTIL='+compact(r.until)+(allDay?'':'T235959'));
 return p.join(';');
}
const hm=t=>t.replace(':','')+'00';
const plusHour=t=>pad(Math.min(23,Number(t.slice(0,2))+1))+t.slice(2);
function buildRoutineIcs(r,stamp){
 const first=firstOccurrence(r);if(!first)return [];
 const allDay=!r.time,end=r.endTime||plusHour(r.time||'00:00');
 const L=['BEGIN:VEVENT','UID:routine-'+r.id+'@self','DTSTAMP:'+stamp];
 if(allDay)L.push('DTSTART;VALUE=DATE:'+compact(first),'DTEND;VALUE=DATE:'+compact(addDays(first,1)));
 else L.push('DTSTART:'+compact(first)+'T'+hm(r.time),'DTEND:'+compact(first)+'T'+hm(end));
 L.push('RRULE:'+rrule(r,{allDay}));
 for(const k of r.skip)if(matches(r,k))L.push(allDay?'EXDATE;VALUE=DATE:'+compact(k):'EXDATE:'+compact(k)+'T'+hm(r.time));
 L.push('SUMMARY:'+icsEscape('↻ '+r.title),'DESCRIPTION:'+icsEscape(describe(r)),'TRANSP:'+(allDay?'TRANSPARENT':'OPAQUE'),'END:VEVENT');
 return L;
}
const hash=str=>{let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))>>>0;return h.toString(36)};
/* The Google event SELF owns for one routine: a real recurring event (RRULE + EXDATE), tagged with selfRoutineId. */
function routinePayload(r,tz='UTC'){
 const first=firstOccurrence(r)||r.start,allDay=!r.time,end=r.endTime||plusHour(r.time||'00:00');
 const skips=r.skip.filter(k=>matches(r,k));
 const recurrence=['RRULE:'+rrule(r,{allDay}),...skips.map(k=>allDay?'EXDATE;VALUE=DATE:'+compact(k):'EXDATE;TZID='+tz+':'+compact(k)+'T'+hm(r.time))];
 const start=allDay?{date:first}:{dateTime:first+'T'+r.time+':00',timeZone:tz},endv=allDay?{date:addDays(first,1)}:{dateTime:first+'T'+end+':00',timeZone:tz};
 const summary='↻ '+r.title;
 return {summary,description:describe(r)+'\nManaged by SELF. Change it in SELF.',start,end:endv,recurrence,transparency:allDay?'transparent':'opaque',
  reminders:{useDefault:false,overrides:[{method:'popup',minutes:allDay?900:10}]},
  extendedProperties:{private:{selfApp:OWN_TAG,selfRoutineId:String(r.id),selfSig:hash(JSON.stringify([summary,start,endv,recurrence]))}}};
}
function planRoutineSync(routines,events,{tz='UTC',allowRemove=true}={}){
 const own=new Map();
 for(const e of events||[]){const p=e?.extendedProperties?.private;if(p?.selfApp===OWN_TAG&&p.selfRoutineId)own.set(p.selfRoutineId,e)}
 const plan={create:[],update:[],remove:[],same:0},seen=new Set();
 for(const r of routines||[]){
  seen.add(String(r.id));const body=routinePayload(r,tz),have=own.get(String(r.id));
  if(!have)plan.create.push({routine:r,body});
  else if(have.extendedProperties.private.selfSig!==body.extendedProperties.private.selfSig)plan.update.push({routine:r,eventId:have.id,body});else plan.same++;
 }
 if(allowRemove)for(const [id,e] of own)if(!seen.has(id))plan.remove.push({routineId:id,eventId:e.id,title:e.summary});
 return plan;
}
const mergePlans=(...ps)=>({create:ps.flatMap(p=>p.create),update:ps.flatMap(p=>p.update),remove:ps.flatMap(p=>p.remove),same:ps.reduce((n,p)=>n+p.same,0)});

/* ---------- UI state ---------- */
const S={view:'month',anchor:null,showDone:false,showEvents:true,panel:false,clientId:'',token:null,expires:0,connected:false,calendarId:'primary',
 events:[],rangeKey:'',loading:false,syncing:false,message:'',error:false,drag:null,ownIds:new Set(),ownRoutineIds:new Set(),routines:[],routinesFor:null,form:null};
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
const userId=()=>host?.state?.().user?.id||'anon';
const routineKey=()=>'self.cal.routines.'+userId();
function routines(){
 if(S.routinesFor!==userId()){try{S.routines=cleanRoutines(JSON.parse(store()?.getItem(routineKey())||'[]'))}catch{S.routines=[]}S.routinesFor=userId()}
 return S.routines;
}
function saveRoutines(list){S.routines=cleanRoutines(list);S.routinesFor=userId();try{store()?.setItem(routineKey(),JSON.stringify(S.routines))}catch{}}
const tzName=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}};
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
 if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(id)){say('Paste a valid OAuth Client ID (ends with .apps.googleusercontent.com).',true);host.render();return}
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
 S.token=null;S.connected=false;S.wasConnected=false;S.events=[];S.rangeKey='';S.ownIds=new Set();S.ownRoutineIds=new Set();savePrefs();say('Disconnected from Google Calendar.');host?.render?.();
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
  S.events=mapped.filter(e=>!e.own);S.ownIds=new Set(mapped.filter(e=>e.own&&e.taskId).map(e=>e.taskId));S.ownRoutineIds=new Set(mapped.filter(e=>e.own&&e.routineId).map(e=>e.routineId));
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
  const evs=await ownEvents();
  const plan=mergePlans(planSync(tasks(),evs,{spaceName}),planRoutineSync(routines(),evs,{tz:tzName()}));
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

function routineChip(o){
 const g=S.ownRoutineIds.has(String(o.r.id));
 return `<button type="button" class="cal-chip cal-routine${o.done?' u-done':''}" data-cal="routine" data-id="${a(o.r.id)}" data-date="${o.date}" title="${a(o.r.title+' · '+describe(o.r))}"><span class="cal-chip-rep" aria-hidden="true">↻</span>${o.r.time?`<time class="cal-chip-time">${e(o.r.time)}</time>`:''}<span class="cal-chip-title">${e(o.r.title)}</span>${g?'<span class="cal-chip-g" title="On Google Calendar">G</span>':''}</button>`;
}
function formPanel(){
 const f=S.form;if(!f)return '';
 const edit=!!f._edit,d=f._date;
 const dayBtns=WEEKDAYS.map((n,i)=>`<button type="button" class="cal-day${f.days.includes(i)?' on':''}" data-cal="rday" data-day="${i}" aria-pressed="${f.days.includes(i)}">${n}</button>`).join('');
 return `<section class="cal-panel cal-form" aria-label="${edit?'Edit repeating item':'New repeating item'}"><div class="cal-panel-col"><h3>${edit?'Edit repeating item':'New repeating item'}</h3>
  <label class="cal-field">What repeats?<input class="field" data-cal-field="title" value="${a(f.title)}" maxlength="120" placeholder="e.g. Weekly review, Gym, Team sync" autocomplete="off"/></label>
  <div class="cal-grid2"><label class="cal-field">Repeats<select class="select" data-cal-field="freq"><option value="daily"${f.freq==='daily'?' selected':''}>Daily</option><option value="weekly"${f.freq==='weekly'?' selected':''}>Weekly</option><option value="monthly"${f.freq==='monthly'?' selected':''}>Monthly</option></select></label>
  <label class="cal-field">Every<input class="field" type="number" min="1" max="12" data-cal-field="interval" value="${a(f.interval)}"/></label></div>
  ${f.freq==='weekly'?`<div class="cal-field">On<div class="cal-days" role="group" aria-label="Weekdays">${dayBtns}</div></div>`:''}
  <div class="cal-grid2"><label class="cal-field">Starts<input class="field" type="date" data-cal-field="start" value="${a(f.start)}"/></label>
  <label class="cal-field">Ends (optional)<input class="field" type="date" data-cal-field="until" value="${a(f.until||'')}"/></label></div>
  <div class="cal-grid2"><label class="cal-field">Start time (optional)<input class="field" type="time" data-cal-field="time" value="${a(f.time||'')}"/></label>
  <label class="cal-field">End time (optional)<input class="field" type="time" data-cal-field="endTime" value="${a(f.endTime||'')}"/></label></div>
  <div class="cal-row"><button type="button" class="cal-btn primary" data-cal="rsave">${edit?'Save changes':'Add repeating item'}</button><button type="button" class="cal-btn" data-cal="rcancel">Cancel</button></div></div>
  <div class="cal-panel-col">${edit?`<h3>This item</h3><p>${e(describe(f))}</p>
   <div class="cal-row"><button type="button" class="cal-btn" data-cal="rdone" data-date="${a(d)}">${f.done.includes(d)?'Undo done':'Mark done'} · ${e(shortDate(d))}</button><button type="button" class="cal-btn" data-cal="rskip" data-date="${a(d)}">${f.skip.includes(d)?'Restore':'Skip'} ${e(shortDate(d))}</button><button type="button" class="cal-btn danger" data-cal="rdelete">Delete all</button></div>`:`<h3>Good to know</h3><p>Repeating items live only on the calendar (they are not tasks). Skip or tick off single days later by clicking one. They are saved to your account, and <b>Sync to Google</b> sends them as real recurring events.</p>`}${S.message&&S.error?`<p class="cal-msg err" role="alert">${e(S.message)}</p>`:''}</div></section>`;
}
function repeatsList(today){
 const list=routines();if(!list.length)return '';
 return `<section class="cal-group g-repeats"><h3>Repeating <span>${list.length}</span></h3>${list.map(r=>{
  const next=occurrences(r,today,addDays(today,400))[0];
  return `<div class="cal-row-item"><span class="cal-date">↻</span><div class="cal-row-main" data-cal="routine" data-id="${a(r.id)}" data-date="${a(next||r.start)}"><strong>${e(r.title)}</strong><small>${e(describe(r))}${r.until?' · until '+e(shortDate(r.until)):''}</small></div><span class="cal-rel">${next?'Next: '+e(shortDate(next)):'Finished'}</span><span class="cal-acts">${S.ownRoutineIds.has(String(r.id))?`<span class="cal-synced">${ic('check',13)} On Google</span>`:''}</span></div>`}).join('')}</section>`;
}
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
  `<button type="button" class="cal-btn" data-cal="rnew">↻ Repeat</button><button type="button" class="cal-btn cal-google ${g}" data-cal="panel" aria-expanded="${S.panel}">${ic('calendar',15)} Google${connected()?' · connected':''}</button></div></div>`;
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
   <div class="cal-row"><button type="button" class="cal-btn primary" data-cal="sync" ${S.syncing?'disabled':''}>${S.syncing?'Syncing…':'Sync to Google'}</button><button type="button" class="cal-btn" data-cal="disconnect">Disconnect</button></div>
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
   <div class="cal-row"><button type="button" class="cal-btn" data-cal="ics">Download deadlines + repeats (.ics)</button></div></div></section>`;
}
function tray(today){
 const list=unscheduled(tasks());
 if(!list.length)return '';
 return `<section class="cal-tray" aria-label="Tasks without a deadline"><h3>No deadline <span>${list.length}</span></h3><p>Drag a task onto a day to set its deadline.</p><div class="cal-tray-list">${list.slice(0,30).map(t=>chip(t,today)).join('')}${list.length>30?`<span class="cal-more-note">+${list.length-30} more in List view</span>`:''}</div></section>`;
}
function dayCell(k,ctx,{month=null}={}){
 const {today,by,ev,rt}=ctx,tl=by.get(k)||[],rs=rt.get(k)||[],gs=S.showEvents?(ev.get(k)||[]):[];
 const list=[...tl.map(t=>chip(t,today)),...rs.map(routineChip)];
 const out=month&&k.slice(0,7)!==month,isToday=k===today;
 const max=month?3:99,room=Math.max(0,max-list.length),shown=list.slice(0,max),hidden=list.length-shown.length;
 return `<div class="cal-cell${out?' out':''}${isToday?' today':''}${k<today?' past':''}" data-cal-drop="${k}" data-cal="new" data-date="${k}" role="gridcell" aria-label="${a(longDate(k))}">`+
  `<div class="cal-daynum"><span>${month?parse(k).getDate():WEEKDAYS[(parse(k).getDay()+6)%7]+' '+parse(k).getDate()}</span>${list.length&&!month?`<em>${list.length}</em>`:''}<button type="button" class="cal-add" data-cal="new" data-date="${k}" aria-label="Add task due ${a(longDate(k))}">${ic('plus',13)}</button></div>`+
  `<div class="cal-items">${shown.join('')}${hidden>0?`<button type="button" class="cal-more" data-cal="day" data-date="${k}">+${hidden} more</button>`:''}${gs.slice(0,month?Math.max(room,1):99).map(gEvent).join('')}${month&&gs.length>Math.max(room,1)?`<span class="cal-more-note">+${gs.length-Math.max(room,1)} Google</span>`:''}</div></div>`;
}
function monthView(ctx){
 const an=anchor(),weeks=monthGrid(an),month=an.slice(0,7);
 return `<div class="cal-month" role="grid" aria-label="${a(monthLabel(an))}"><div class="cal-dow" role="row">${WEEKDAYS.map(d=>`<span role="columnheader">${d}</span>`).join('')}</div>${weeks.map(w=>`<div class="cal-week" role="row">${w.map(k=>dayCell(k,ctx,{month})).join('')}</div>`).join('')}</div>`;
}
function weekView(ctx){return `<div class="cal-weekview" role="grid">${weekDays(anchor()).map(k=>dayCell(k,ctx)).join('')}</div>`}
function agendaView(ctx){
 const groups=agenda(tasks().filter(t=>S.showDone||t.status!=='done'),ctx.today);
 if(!groups.length&&!routines().length)return `<div class="cal-empty"><strong>No deadlines yet</strong><span>Give a task a due date, or drag one from “No deadline”, and it shows up here.</span></div>`;
 return `<div class="cal-agenda">${repeatsList(ctx.today)}${groups.map(g=>`<section class="cal-group g-${g.id}"><h3>${e(g.label)} <span>${g.tasks.length}</span></h3>${g.tasks.map(t=>{
  const u=urgency(t,ctx.today),synced=S.ownIds.has(String(t.id)),sp=spaceName(t.space_id);
  return `<div class="cal-row-item u-${u}"><span class="cal-date">${e(shortDate(t.due_date))}</span><div class="cal-row-main" data-action="open-task" data-id="${a(t.id)}"><strong class="${t.status==='done'?'done':''}">${e(t.title)}</strong><small>${e(sp||'Unsorted')} · ${e(host.statusOf(t.status)[1])}${t.priority==='high'?' · High priority':''}</small></div>`+
   `<span class="cal-rel">${e(relative(t,ctx.today))}</span><span class="cal-acts">${synced?`<span class="cal-synced">${ic('check',13)} On Google</span>`:`<a class="cal-link" href="${a(googleTemplateUrl(t,sp))}" target="_blank" rel="noopener" data-cal-stop title="Open Google Calendar with this deadline filled in">Add to Google</a>${connected()?`<button type="button" class="cal-link" data-cal="push" data-id="${a(t.id)}">Push</button>`:''}`}</span></div>`}).join('')}</section>`).join('')}</div>`;
}
function render(){
 if(!host)return '';
 const today=todayKey(),all=tasks().filter(t=>!S.showDone?t.status!=='done':true);
 const by=groupByDate(scheduled(host.filtered?host.filtered():all,{showDone:S.showDone}));
 const ev=eventsByDate(S.events);
 const [rf,rtt]=visibleRange(),ctx={today,by,ev,rt:routinesByDate(routines(),rf,rtt)};
 if(connected()&&S.showEvents)queueMicrotask(()=>loadEvents());
 const body=S.view==='agenda'?agendaView(ctx):(S.view==='week'?weekView(ctx):monthView(ctx))+tray(today);
 return `<div class="cal" data-cal-root>${header()}${formPanel()}${panel()}${strip(today)}${S.message&&!S.panel&&!S.form?`<p class="cal-msg ${S.error?'err':''}" role="status">${e(S.message)}</p>`:''}${body}</div>`;
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
function openForm(r,date){
 const t=todayKey();
 S.form=r?{...r,_edit:true,_date:date||r.start}:{id:'',title:'',freq:'weekly',interval:1,days:[wd(t)],start:t,until:'',time:'',endTime:'',skip:[],done:[],_edit:false,_date:t};
 S.panel=false;say('');host.render();
 root.setTimeout?.(()=>doc?.querySelector('[data-cal-field="title"]')?.focus(),0);
}
function saveForm(){
 const f=S.form;if(!f)return;
 const title=clip(f.title,120);
 if(!title)return fail('Give it a name first.');
 if(!isKey(f.start))return fail('Pick a start date.');
 if(f.until&&(!isKey(f.until)||f.until<f.start))return fail('The end date must be on or after the start date.');
 if(f.freq==='weekly'&&!f.days.length)return fail('Pick at least one weekday.');
 if(f.time&&f.endTime&&f.endTime<=f.time)return fail('The end time must be after the start time.');
 const list=routines();
 if(!f._edit&&list.length>=100)return fail('You can keep up to 100 repeating items.');
 const id=f.id||'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 const r=cleanRoutine({...f,id,title,until:f.until||null});
 if(!r)return fail('Check the details and try again.');
 saveRoutines(f._edit?list.map(x=>x.id===id?r:x):[...list,r]);
 S.form=null;say('Saved “'+clip(title,40)+'”: '+describe(r)+'.'+(connected()?' Press Sync to Google to update your Google Calendar.':''));host.render();
}
function fail(msg){say(msg,true);host.render()}
function patchRoutine(id,fn){
 const next=routines().map(r=>r.id===id?cleanRoutine(fn({...r})):r);saveRoutines(next);
 const cur=routines().find(r=>r.id===id);if(S.form&&cur)S.form={...S.form,done:cur.done,skip:cur.skip};
}
const toggle=(list,k)=>list.includes(k)?list.filter(x=>x!==k):[...list,k];
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
 if(k==='rnew')return openForm(null);
 if(k==='routine'){const r=routines().find(x=>x.id===el.dataset.id);return r&&openForm(r,el.dataset.date)}
 if(k==='rcancel'){S.form=null;say('');return host.render()}
 if(k==='rsave')return saveForm();
 if(k==='rday'){const n=Number(el.dataset.day);S.form.days=toggle(S.form.days,n).sort();return host.render()}
 if(k==='rdone'){patchRoutine(S.form.id,r=>({...r,done:toggle(r.done,el.dataset.date)}));return host.render()}
 if(k==='rskip'){patchRoutine(S.form.id,r=>({...r,skip:toggle(r.skip,el.dataset.date)}));return host.render()}
 if(k==='rdelete'){if(!root.confirm?.('Delete “'+S.form.title+'” and every repeat of it? This cannot be undone.'))return;saveRoutines(routines().filter(r=>r.id!==S.form.id));S.form=null;say('Repeating item deleted.'+(connected()?' Press Sync to Google to remove it from Google Calendar.':''));return host.render()}
 if(k==='ics'){
  const n=scheduled(tasks()).length+routines().length;
  if(!n){say('Nothing to export yet.',true);return host.render()}
  download('self-deadlines.ics',buildIcs(tasks(),{spaceName,routines:routines()}),'text/calendar');say('Downloaded '+n+' item'+(n===1?'':'s')+'. Import the file in Google Calendar: Settings → Import & export.');return host.render();
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
function setField(el){
 const f=S.form,k=el.dataset.calField;if(!f||!k)return false;
 f[k]=k==='interval'?Math.min(12,Math.max(1,parseInt(el.value,10)||1)):el.value;return true;
}
function onChange(ev){
 const el=ev.target;
 if(el.dataset?.calToggle){S[el.dataset.calToggle]=el.checked;S.rangeKey='';savePrefs();host.render();return}
 if(el.dataset?.calField&&setField(el)&&el.dataset.calField==='freq')host.render();
}
function onInput(ev){const el=ev.target;if(el.dataset?.calInput==='clientId'){S.clientId=el.value;savePrefs()}else if(el.dataset?.calField)setField(el)}
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
 if(ev.key==='Escape'&&(S.panel||S.form)&&ev.target.closest?.('[data-cal-root]')){S.panel=false;S.form=null;host.render()}
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
function reset(){S.token=null;S.connected=false;S.events=[];S.ownIds=new Set();S.ownRoutineIds=new Set();S.rangeKey='';S.message='';S.panel=false;S.anchor=null;S.form=null;S.routines=[];S.routinesFor=null}

const api={init,render,reset,state:S,
 keyOf,parse,addDays,diffDays,startOfWeek,startOfMonth,addMonths,monthGrid,weekDays,isoWeek,isKey,
 urgency,relative,scheduled,unscheduled,groupByDate,summary,agenda,
 googleTemplateUrl,buildIcs,eventPayload,planSync,mapGoogleEvent,eventsByDate,
 cleanRoutine,cleanRoutines,matches,occurrences,occursOn,firstOccurrence,routinesByDate,describe,rrule,routinePayload,planRoutineSync,mergePlans};
root.SELFCalendar=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
