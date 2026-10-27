/* SELF Calendar: a time-grid calendar (Day / Week / Month / Agenda) built around deadlines, ported from kargulstudio/calender-app-design.
   - Deadlines come from tasks.due_date (a plain date) and live in the all-day lane / as pills; drag them to another day to reschedule (normal task PATCH).
   - Events are the calendar's own timed blocks: drag on empty space to create, drag to move, drag the bottom edge to resize, overlaps sit side by side.
     They are stored per account in localStorage under self.cal.events.<userId> (mirrored through user_kv by user-sync.js; no schema change) and can repeat.
   - Google Calendar: no-setup .ics export + "Add to Google" links, or an optional connection (user's own OAuth Client ID, token in memory only)
     that shows Google events and syncs deadlines/events as tagged events. SELF only edits events it created itself. */
(function(root){
'use strict';
const DAY=86400000;
const WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const PREF_KEY='self.cal.prefs';
const SCOPE='https://www.googleapis.com/auth/calendar.events';
const GAPI='https://www.googleapis.com/calendar/v3';
const OWN_TAG='SELF';
const HOUR_PX=64,SNAP=15,MIN_EVENT=15,DRAG_THRESHOLD=4;
const COLORS=['blue','cyan','green','orange','pink','purple'];

/* ---------- dates (all keys are local YYYY-MM-DD) ---------- */
const pad=n=>String(n).padStart(2,'0');
const keyOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=k=>{const [y,m,d]=String(k).split('-').map(Number);return new Date(y,(m||1)-1,d||1,12)};
const isKey=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&keyOf(parse(s))===s;
const addDays=(k,n)=>{const d=parse(k);d.setDate(d.getDate()+n);return keyOf(d)};
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/DAY);
const startOfWeek=k=>addDays(k,-((parse(k).getDay()+6)%7));
const startOfMonth=k=>k.slice(0,7)+'-01';
const addMonths=(k,n)=>{const d=parse(startOfMonth(k));d.setMonth(d.getMonth()+n);return keyOf(d)};
const wd=k=>(parse(k).getDay()+6)%7;
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

/* ---------- minutes-of-day helpers ---------- */
const clampN=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const snap=(m,step=SNAP)=>Math.round(m/step)*step;
const minutesToPx=m=>m/60*HOUR_PX;
const pxToMinutes=px=>px/HOUR_PX*60;
const fmtTime=m=>pad(Math.floor(m/60)%24)+':'+pad(m%60);
const fmtRange=(s,e)=>fmtTime(s)+' – '+fmtTime(e);
const parseTime=v=>{const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(v||'');return m?Number(m[1])*60+Number(m[2]):null};
const fmtDuration=m=>m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':'');

/* ---------- deadlines (tasks with a due date) ---------- */
const PRIORITY_RANK={high:0,normal:1,low:2};
function urgency(task,today){
 if(task.status==='done')return 'done';
 if(!isKey(task.due_date))return 'none';
 const n=diffDays(today,task.due_date);
 return n<0?'overdue':n===0?'today':n<=3?'soon':'later';
}
const URGENCY_COLOR={overdue:'pink',today:'orange',soon:'purple',later:'blue',done:'green',none:'cyan'};
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
function agenda(tasks,today){
 const defs=[['overdue','Overdue'],['today','Today'],['tomorrow','Tomorrow'],['week','Next 7 days'],['later','Later']];
 const g=Object.fromEntries(defs.map(([k])=>[k,[]]));
 for(const t of scheduled(tasks)){
  const n=diffDays(today,t.due_date);
  g[n<0?'overdue':n===0?'today':n===1?'tomorrow':n<=7?'week':'later'].push(t);
 }
 return defs.filter(([k])=>g[k].length).map(([k,label])=>({id:k,label,tasks:g[k]}));
}

/* ---------- events: timed blocks that can repeat ---------- */
const FREQS=['daily','weekly','monthly'];
const DAY_CODES=['MO','TU','WE','TH','FR','SA','SU'];
const compact=k=>k.replace(/-/g,'');
const clip=(s,n)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const dateList=v=>Array.isArray(v)?[...new Set(v.filter(isKey))].sort().slice(-400):[];
function cleanRepeat(r,date){
 if(!r||!FREQS.includes(r.freq))return null;
 const interval=clampN(parseInt(r.interval,10)||1,1,12);
 let days=Array.isArray(r.days)?[...new Set(r.days.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():[];
 if(r.freq==='weekly'&&!days.length)days=[wd(date)];
 return {freq:r.freq,interval,days:r.freq==='weekly'?days:[],until:isKey(r.until)&&r.until>=date?r.until:null};
}
function cleanEvent(x){
 if(!x||typeof x.id!=='string'||!x.id)return null;
 const title=clip(x.title,120);if(!title||!isKey(x.date))return null;
 const allDay=!!x.allDay;
 let start=Number.isFinite(+x.start)?Math.round(+x.start):540,end=Number.isFinite(+x.end)?Math.round(+x.end):start+60;
 if(allDay){start=0;end=1440}else{start=clampN(start,0,1440-MIN_EVENT);end=clampN(end,start+MIN_EVENT,1440)}
 return {id:x.id,title,date:x.date,allDay,start,end,color:COLORS.includes(x.color)?x.color:'blue',note:clip(x.note,500),repeat:cleanRepeat(x.repeat,x.date),skip:dateList(x.skip),done:dateList(x.done)};
}
const cleanEvents=raw=>(Array.isArray(raw)?raw:[]).map(cleanEvent).filter(Boolean).slice(0,500);
const ruleOf=e=>({...e.repeat,start:e.date});
const monthIndex=k=>{const d=parse(k);return d.getFullYear()*12+d.getMonth()};
const daysInMonth=k=>new Date(parse(k).getFullYear(),parse(k).getMonth()+1,0).getDate();
/* Does the repeat rule hit this date? (ignores skip) */
function matches(r,k){
 if(k<r.start||(r.until&&k>r.until))return false;
 if(r.freq==='daily')return diffDays(r.start,k)%r.interval===0;
 if(r.freq==='weekly')return r.days.includes(wd(k))&&Math.floor(diffDays(startOfWeek(r.start),startOfWeek(k))/7)%r.interval===0;
 return (monthIndex(k)-monthIndex(r.start))%r.interval===0&&parse(k).getDate()===Math.min(parse(r.start).getDate(),daysInMonth(k));
}
const occursOn=(e,k)=>e.repeat?matches(ruleOf(e),k)&&!e.skip.includes(k):k===e.date;
function occurrences(e,from,to){
 if(!e.repeat)return e.date>=from&&e.date<=to?[e.date]:[];
 const out=[];for(let k=from<e.date?e.date:from,i=0;k<=to&&i<800;k=addDays(k,1),i++)if(occursOn(e,k))out.push(k);
 return out;
}
const firstOccurrence=e=>{if(!e.repeat)return e.date;const r=ruleOf(e);for(let k=e.date,i=0;i<800&&(!r.until||k<=r.until);k=addDays(k,1),i++)if(matches(r,k))return k;return null};
/* date -> occurrences in [from,to]: all-day first, then by start time */
function eventsByDay(events,from,to){
 const m=new Map();
 for(const e of events)for(const k of occurrences(e,from,to)){
  if(!m.has(k))m.set(k,[]);
  m.get(k).push({e,id:e.id,date:k,title:e.title,allDay:e.allDay,start:e.start,end:e.end,color:e.color,note:e.note,repeats:!!e.repeat,done:e.done.includes(k)});
 }
 for(const l of m.values())l.sort((a,b)=>(a.allDay===b.allDay?0:a.allDay?-1:1)||a.start-b.start||b.end-a.end||a.title.localeCompare(b.title));
 return m;
}
function describe(e){
 const r=e.repeat;if(!r)return e.allDay?'All day':fmtRange(e.start,e.end);
 const n=r.interval,t=e.allDay?'':' · '+fmtRange(e.start,e.end);
 if(r.freq==='daily')return (n===1?'Every day':'Every '+n+' days')+t;
 if(r.freq==='monthly')return (n===1?'Every month':'Every '+n+' months')+' on day '+parse(e.date).getDate()+t;
 return (n===1?'Every week':'Every '+n+' weeks')+' on '+r.days.map(d=>WEEKDAYS[d]).join(', ')+t;
}
/* Side-by-side layout for overlapping timed blocks (port of the reference's layoutDay): clusters of transitive overlap, fewest columns. */
function layoutDay(items){
 const sorted=[...items].sort((a,b)=>a.start-b.start||b.end-a.end);
 const out=[];let cluster=[],clusterEnd=-1,colEnds=[];
 const flush=()=>{const columns=colEnds.length;for(const c of cluster)out.push({...c,columns});cluster=[];colEnds=[]};
 for(const it of sorted){
  if(it.start>=clusterEnd&&cluster.length)flush();
  let column=colEnds.findIndex(end=>end<=it.start);
  if(column===-1){column=colEnds.length;colEnds.push(it.end)}else colEnds[column]=it.end;
  cluster.push({item:it,column});clusterEnd=Math.max(clusterEnd,it.end);
 }
 if(cluster.length)flush();
 return out;
}

/* ---------- Google Calendar: links, ICS, API payloads ---------- */
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
const hm=m=>pad(Math.floor(m/60)%24)+pad(m%60)+'00';
const rrule=(e,{allDay=true}={})=>{
 const r=e.repeat,p=['FREQ='+r.freq.toUpperCase()];
 if(r.interval>1)p.push('INTERVAL='+r.interval);
 if(r.freq==='weekly')p.push('BYDAY='+r.days.map(d=>DAY_CODES[d]).join(','));
 if(r.freq==='monthly')p.push('BYMONTHDAY='+parse(e.date).getDate());
 if(r.until)p.push('UNTIL='+compact(r.until)+(allDay?'':'T235959'));
 return p.join(';');
};
function buildEventIcs(e,stamp){
 const first=firstOccurrence(e);if(!first)return [];
 const L=['BEGIN:VEVENT','UID:event-'+e.id+'@self','DTSTAMP:'+stamp];
 if(e.allDay)L.push('DTSTART;VALUE=DATE:'+compact(first),'DTEND;VALUE=DATE:'+compact(addDays(first,1)));
 else L.push('DTSTART:'+compact(first)+'T'+hm(e.start),'DTEND:'+compact(first)+'T'+hm(e.end));
 if(e.repeat){
  L.push('RRULE:'+rrule(e,{allDay:e.allDay}));
  for(const k of e.skip)if(matches(ruleOf(e),k))L.push(e.allDay?'EXDATE;VALUE=DATE:'+compact(k):'EXDATE:'+compact(k)+'T'+hm(e.start));
 }
 L.push('SUMMARY:'+icsEscape(e.title),'DESCRIPTION:'+icsEscape([e.note,e.repeat&&describe(e)].filter(Boolean).join('\n')),'TRANSP:'+(e.allDay?'TRANSPARENT':'OPAQUE'),'END:VEVENT');
 return L;
}
/* All-day VEVENT per open task with a deadline, plus every calendar event, with 9am reminders for deadlines. */
function buildIcs(tasks,{spaceName=()=>'',now=new Date(),includeDone=false,events=[]}={}){
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SELF//Deadlines//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:SELF'];
 for(const t of scheduled(tasks,{showDone:includeDone})){
  const sp=spaceName(t.space_id);
  lines.push('BEGIN:VEVENT','UID:'+t.id+'@self','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+compact(t.due_date),'DTEND;VALUE=DATE:'+compact(addDays(t.due_date,1)),
   'SUMMARY:'+icsEscape('Due: '+clip(t.title,200)),'DESCRIPTION:'+icsEscape([sp&&'Space: '+sp,'Priority: '+(t.priority||'normal'),'Status: '+(t.status||'todo')].filter(Boolean).join('\n')),
   'TRANSP:TRANSPARENT','STATUS:'+(t.status==='done'?'CANCELLED':'CONFIRMED'),
   'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape('Due tomorrow: '+clip(t.title,100)),'TRIGGER:-PT15H','END:VALARM',
   'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape('Due today: '+clip(t.title,100)),'TRIGGER:PT9H','END:VALARM','END:VEVENT');
 }
 for(const e of events)lines.push(...buildEventIcs(e,stamp));
 lines.push('END:VCALENDAR');
 return lines.map(fold).join('\r\n')+'\r\n';
}
/* The Google event SELF owns for one task. All-day, free, tagged so it can be found again. */
function eventPayload(task,space=''){
 return {summary:(task.status==='done'?'✓ ':'Due: ')+clip(task.title,200),description:[space&&'Space: '+space,'Priority: '+(task.priority||'normal'),'Managed by SELF. Change the deadline in SELF.'].filter(Boolean).join('\n'),
  start:{date:task.due_date},end:{date:addDays(task.due_date,1)},transparency:'transparent',
  reminders:{useDefault:false,overrides:[{method:'popup',minutes:900}]},extendedProperties:{private:{selfApp:OWN_TAG,selfTaskId:String(task.id)}}};
}
const hash=str=>{let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))>>>0;return h.toString(36)};
/* The Google event SELF owns for one calendar event (a real recurring event when it repeats). */
function eventBody(e,tz='UTC'){
 const first=firstOccurrence(e)||e.date;
 const start=e.allDay?{date:first}:{dateTime:first+'T'+fmtTime(e.start)+':00',timeZone:tz};
 const end=e.allDay?{date:addDays(first,1)}:{dateTime:first+'T'+(e.end>=1440?'23:59':fmtTime(e.end))+':00',timeZone:tz};
 const recurrence=e.repeat?['RRULE:'+rrule(e,{allDay:e.allDay}),...e.skip.filter(k=>matches(ruleOf(e),k)).map(k=>e.allDay?'EXDATE;VALUE=DATE:'+compact(k):'EXDATE;TZID='+tz+':'+compact(k)+'T'+hm(e.start))]:undefined;
 const body={summary:e.title,description:[e.note,e.repeat&&describe(e),'Managed by SELF. Change it in SELF.'].filter(Boolean).join('\n'),start,end,transparency:e.allDay?'transparent':'opaque',
  reminders:{useDefault:false,overrides:[{method:'popup',minutes:e.allDay?900:10}]}};
 if(recurrence)body.recurrence=recurrence;
 body.extendedProperties={private:{selfApp:OWN_TAG,selfEventId:String(e.id),selfSig:hash(JSON.stringify([body.summary,body.description,start,end,recurrence||null]))}};
 return body;
}
const mergePlans=(...ps)=>({create:ps.flatMap(p=>p.create),update:ps.flatMap(p=>p.update),remove:ps.flatMap(p=>p.remove),same:ps.reduce((n,p)=>n+p.same,0)});
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
function planEventSync(events,gEvents,{tz='UTC',allowRemove=true}={}){
 const own=new Map();
 for(const g of gEvents||[]){const p=g?.extendedProperties?.private;if(p?.selfApp===OWN_TAG&&p.selfEventId)own.set(p.selfEventId,g)}
 const plan={create:[],update:[],remove:[],same:0},seen=new Set();
 for(const e of events||[]){
  seen.add(String(e.id));const body=eventBody(e,tz),have=own.get(String(e.id));
  if(!have)plan.create.push({event:e,body});
  else if(have.extendedProperties.private.selfSig!==body.extendedProperties.private.selfSig)plan.update.push({event:e,eventId:have.id,body});else plan.same++;
 }
 if(allowRemove)for(const [id,g] of own)if(!seen.has(id))plan.remove.push({eventId:g.id,ownerId:id,title:g.summary});
 return plan;
}
/* Google event -> a flat shape the calendar can lay out. Timed events carry startMin/endMin (clamped to their first day). */
function mapGoogleEvent(g){
 if(!g||g.status==='cancelled')return null;
 const p=g.extendedProperties?.private,own=p?.selfApp===OWN_TAG;
 const base={id:g.id,title:g.summary||'(No title)',own,taskId:own?p.selfTaskId||null:null,eventId:own?p.selfEventId||null:null,link:g.htmlLink||''};
 if(g.start?.date){
  const end=g.end?.date?addDays(g.end.date,-1):g.start.date;
  return {...base,date:g.start.date,endDate:end<g.start.date?g.start.date:end,time:'',allDay:true};
 }
 if(g.start?.dateTime){
  const s=new Date(g.start.dateTime);if(Number.isNaN(s.getTime()))return null;
  const date=keyOf(s),startMin=s.getHours()*60+s.getMinutes();
  let endMin=startMin+60;
  if(g.end?.dateTime){const en=new Date(g.end.dateTime);if(!Number.isNaN(en.getTime()))endMin=keyOf(en)===date?en.getHours()*60+en.getMinutes():1440}
  return {...base,date,endDate:date,time:fmtTime(startMin),allDay:false,startMin,endMin:Math.max(endMin,startMin+MIN_EVENT)};
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
const S={view:'week',anchor:null,showDone:false,showEvents:true,tasksPanel:null,panel:false,clientId:'',token:null,expires:0,connected:false,wasConnected:false,calendarId:'primary',
 gEvents:[],rangeKey:'',loading:false,syncing:false,message:'',error:false,drag:null,ownIds:new Set(),ownEventIds:new Set(),
 events:[],eventsFor:null,pop:null,dlg:null,scrollTop:null};
let host=null,tokenClient=null,pd=null,nowTimer=null;
const doc=typeof document!=='undefined'?document:null;
const store=()=>{try{return root.localStorage}catch{return null}};
function loadPrefs(){
 try{const p=JSON.parse(store()?.getItem(PREF_KEY)||'{}');
  if(['day','week','month','agenda'].includes(p.view))S.view=p.view;
  S.showDone=!!p.showDone;S.showEvents=p.showEvents!==false;S.clientId=typeof p.clientId==='string'?p.clientId.slice(0,200):'';S.wasConnected=!!p.wasConnected;
  if(typeof p.tasksPanel==='boolean')S.tasksPanel=p.tasksPanel;
 }catch{}
}
function savePrefs(){try{store()?.setItem(PREF_KEY,JSON.stringify({view:S.view,showDone:S.showDone,showEvents:S.showEvents,clientId:S.clientId,wasConnected:S.connected||S.wasConnected,tasksPanel:S.tasksPanel}))}catch{}}
const panelOpen=()=>S.tasksPanel===null?(root.innerWidth||0)>=1180:S.tasksPanel;
const userId=()=>host?.state?.().user?.id||'anon';
const eventsKey=()=>'self.cal.events.'+userId();
function events(){
 if(S.eventsFor!==userId()){
  try{S.events=cleanEvents(JSON.parse(store()?.getItem(eventsKey())||'[]'))}catch{S.events=[]}
  S.eventsFor=userId();
 }
 return S.events;
}
function saveEvents(list){S.events=cleanEvents(list);S.eventsFor=userId();try{store()?.setItem(eventsKey(),JSON.stringify(S.events))}catch{}}
const tzName=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}};
const todayKey=()=>host?.today?.()||keyOf(new Date());
const anchor=()=>S.anchor||(S.anchor=todayKey());
const tasks=()=>host?.state?.().tasks||[];
const spaceName=id=>host?.spaceOf?.(id)?.name||'';
const connected=()=>S.connected&&!!S.token&&Date.now()<S.expires;
const isPhone=()=>(root.innerWidth||1200)<700;
/* The columns of the current time grid: 1 day, a week, or on phones a 3-day window. */
function gridDays(){
 const a=anchor();
 if(S.view==='day')return [a];
 return isPhone()?[0,1,2].map(i=>addDays(a,i)):weekDays(a);
}

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
 S.loading=true;say('Opening Google sign-in…');host.render();
 try{
  await loadGis();
  await new Promise((resolve,reject)=>{
   tokenClient=root.google.accounts.oauth2.initTokenClient({client_id:id,scope:SCOPE,
    callback:r=>{if(r.error||!r.access_token)return reject(new Error(r.error_description||r.error||'Google sign-in was cancelled.'));S.token=r.access_token;S.expires=Date.now()+(Number(r.expires_in)||3600)*1000-30000;S.connected=true;resolve()},
    error_callback:e=>reject(new Error(e?.type==='popup_closed'?'Google sign-in was closed before finishing.':(e?.message||'Google sign-in failed.')))});
   tokenClient.requestAccessToken({prompt:S.wasConnected?'':'consent'});
  });
  S.wasConnected=true;savePrefs();S.rangeKey='';say('Connected to Google Calendar.');await loadGoogleEvents(true);
 }catch(e){S.connected=false;say(e.message,true)}
 S.loading=false;host?.render?.();
}
function disconnect(){
 try{if(S.token)root.google?.accounts?.oauth2?.revoke?.(S.token,()=>{})}catch{}
 S.token=null;S.connected=false;S.wasConnected=false;S.gEvents=[];S.rangeKey='';S.ownIds=new Set();S.ownEventIds=new Set();savePrefs();say('Disconnected from Google Calendar.');host?.render?.();
}
function visibleRange(){
 const a=anchor();
 if(S.view==='agenda')return [todayKey(),addDays(todayKey(),60)];
 if(S.view==='month'){const g=monthGrid(a);return [g[0][0],g[g.length-1][6]]}
 const d=gridDays();return [d[0],d[d.length-1]];
}
const tzOffset=d=>{const o=-d.getTimezoneOffset(),s=o>=0?'+':'-';return s+pad(Math.floor(Math.abs(o)/60))+':'+pad(Math.abs(o)%60)};
async function loadGoogleEvents(force=false){
 if(!connected()||!S.showEvents)return;
 const [from,to]=visibleRange(),key=S.calendarId+'|'+from+'|'+to;
 if(!force&&key===S.rangeKey)return;
 S.rangeKey=key;
 try{
  const q=new URLSearchParams({timeMin:from+'T00:00:00'+tzOffset(parse(from)),timeMax:addDays(to,1)+'T00:00:00'+tzOffset(parse(to)),singleEvents:'true',orderBy:'startTime',maxResults:'250'});
  const data=await gfetch('/calendars/'+encodeURIComponent(S.calendarId)+'/events?'+q);
  const mapped=(data?.items||[]).map(mapGoogleEvent).filter(Boolean);
  S.gEvents=mapped.filter(e=>!e.own);S.ownIds=new Set(mapped.filter(e=>e.own&&e.taskId).map(e=>e.taskId));S.ownEventIds=new Set(mapped.filter(e=>e.own&&e.eventId).map(e=>e.eventId));
 }catch(e){S.rangeKey='';say(e.message,true)}
 host?.render?.();
}
async function ownGoogleEvents(){
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
 S.syncing=true;say('Syncing…');host?.render?.();
 try{
  const evs=await ownGoogleEvents();
  const plan=mergePlans(planSync(tasks(),evs,{spaceName}),planEventSync(events(),evs,{tz:tzName()}));
  const failed=await applyPlan(plan);
  S.rangeKey='';
  const parts=[plan.create.length&&plan.create.length+' added',plan.update.length&&plan.update.length+' updated',plan.remove.length&&plan.remove.length+' removed',plan.same&&plan.same+' already up to date'].filter(Boolean);
  say(failed?failed+' change(s) failed. '+S.message:'Google Calendar synced: '+(parts.join(', ')||'nothing to do')+'.',!!failed);
  await loadGoogleEvents(true);
 }catch(e){say(e.message,true)}
 S.syncing=false;host?.render?.();
}
/* After a deadline moves in SELF, keep an already-pushed Google event in step. Silent when not connected. */
async function syncOne(id){
 if(!connected())return;
 try{const t=tasks().find(x=>x.id===id);if(!t||!S.ownIds.has(String(id)))return;
  await applyPlan(planSync([t],await ownGoogleEvents(),{spaceName,allowRemove:false}));S.rangeKey='';await loadGoogleEvents(true);
 }catch(e){say('Deadline saved, but Google Calendar was not updated: '+e.message,true);host?.render?.()}
}
async function pushTask(id){
 const t=tasks().find(x=>x.id===id);if(!t||!isKey(t.due_date))return;
 if(!connected()){say('Connect Google Calendar to push events, or use the “Add to Google” link.',true);S.panel=true;S.pop=null;host.render();return}
 try{await applyPlan(planSync([t],await ownGoogleEvents(),{spaceName,allowRemove:false}));say('“'+clip(t.title,40)+'” is on your Google Calendar.');S.rangeKey='';await loadGoogleEvents(true)}catch(e){say(e.message,true)}
 S.pop=null;host.render();
}
function say(msg,isErr=false){S.message=msg;S.error=isErr}
function download(name,text,type){
 const a=doc.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;doc.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ---------- rendering ---------- */
const e_=s=>host.esc(s),a_=s=>host.attr(s);
const ic=(n,s)=>host.ic(n,s);
const cstyle=c=>`background:var(--ev-${c}-bg);color:var(--ev-${c}-fg)`;

function taskPill(t,today,{showRel=false}={}){
 const u=urgency(t,today),c=URGENCY_COLOR[u],synced=S.ownIds.has(String(t.id));
 return `<button type="button" class="cal-pill cal-task${u==='done'?' is-done':''}" style="${cstyle(c)}" draggable="true" data-cal-drag="${a_(t.id)}" data-cal="pop" data-kind="task" data-id="${a_(t.id)}" title="${a_(t.title+' · '+relative(t,today))}"><span class="cal-flag" aria-hidden="true">⚑</span><span class="cal-pill-t">${e_(t.title)}</span>${synced?'<span class="cal-g" title="On Google Calendar">G</span>':''}${showRel?`<span class="cal-rel">${e_(relative(t,today))}</span>`:''}</button>`;
}
function eventPill(o,{time=true}={}){
 return `<button type="button" class="cal-pill${o.done?' is-done':''}" style="${cstyle(o.color)}" data-cal="pop" data-kind="event" data-id="${a_(o.id)}" data-date="${o.date}" title="${a_(o.title)}">${o.repeats?'<span class="cal-rep" aria-hidden="true">↻</span>':''}<span class="cal-pill-t">${time&&!o.allDay?e_(fmtTime(o.start))+' ':''}${e_(o.title)}</span></button>`;
}
const gPill=g=>`<a class="cal-pill cal-gpill" ${g.link?`href="${a_(g.link)}" target="_blank" rel="noopener"`:''} title="${a_(g.title)} · Google Calendar"><span class="cal-pill-t">${g.time?e_(g.time)+' ':''}${e_(g.title)}</span></a>`;

function rangeText(days){
 const a=anchor();
 if(S.view==='month')return {title:monthLabel(a),sub:shortDate(startOfMonth(a))+' – '+shortDate(addDays(addMonths(startOfMonth(a),1),-1))};
 if(S.view==='agenda')return {title:'Upcoming',sub:'Deadlines and repeats, by date'};
 if(S.view==='day')return {title:monthLabel(a),sub:'Week '+isoWeek(a)+' · '+longDate(a)};
 return {title:monthLabel(days[0])+(days[0].slice(0,7)!==days[days.length-1].slice(0,7)?' – '+MONTHS[parse(days[days.length-1]).getMonth()]:''),sub:'Week '+isoWeek(days[0])+' · '+shortDate(days[0])+' – '+shortDate(days[days.length-1])};
}
function header(days){
 const {title,sub}=rangeText(days),v=S.view,sm=summary(tasks(),todayKey());
 const unit=v==='day'?'day':v==='month'?'month':isPhone()?'3 days':'week';
 return `<div class="cal-head"><div class="cal-title"><h2>${e_(title)}</h2><p>${e_(sub)}</p></div><div class="cal-tools">`+
  (v==='agenda'?'':`<button type="button" class="cal-btn" data-cal="today" aria-keyshortcuts="T">Today</button><div class="cal-step"><button type="button" data-cal="prev" aria-label="Previous ${unit}">${ic('back',16)}</button><button type="button" data-cal="next" aria-label="Next ${unit}">${ic('chevron',16)}</button></div>`)+
  `<div class="cal-seg" role="tablist" aria-label="Calendar view">${[['day','Day','D'],['week','Week','W'],['month','Month','M'],['agenda','Agenda','A']].map(([k,l,key])=>`<button type="button" role="tab" aria-selected="${v===k}" aria-keyshortcuts="${key}" class="${v===k?'on':''}" data-cal="view" data-view="${k}">${l}</button>`).join('')}</div>`+
  `<button type="button" class="cal-btn${panelOpen()?' on':''}" data-cal="tasks" aria-pressed="${panelOpen()}">Tasks${sm.overdue?`<span class="cal-badge">${sm.overdue}</span>`:''}</button>`+
  `<button type="button" class="cal-btn cal-g-btn${connected()?' on':''}" data-cal="panel" aria-expanded="${S.panel}">Google${connected()?' ✓':''}</button>`+
  `<button type="button" class="cal-btn primary" data-cal="newevent" aria-keyshortcuts="N">${ic('plus',15)} New event</button></div></div>`;
}

/* ----- time grid (day / week) ----- */
function dayHeaders(days,today){
 return `<div class="cal-dayheads"><div class="cal-axis"></div>${days.map(d=>{
  const sel=d===anchor(),isT=d===today;
  return `<button type="button" class="cal-dayhead${sel?' sel':''}${isT?' today':''}" data-cal="headday" data-date="${d}" data-cal-drop="${d}" aria-label="${a_(longDate(d))}${sel?', selected':''}"><span class="cal-dow">${WEEKDAYS[wd(d)]}</span><span class="cal-dnum">${parse(d).getDate()}</span></button>`}).join('')}</div>`;
}
function allDayRow(days,ctx){
 const lanes=days.map(d=>{
  const ts=(ctx.by.get(d)||[]).map(t=>taskPill(t,ctx.today)),evs=(ctx.ev.get(d)||[]).filter(o=>o.allDay).map(o=>eventPill(o,{time:false})),
   gs=S.showEvents?(ctx.g.get(d)||[]).filter(x=>x.allDay).map(gPill):[];
  return [...ts,...evs,...gs];
 });
 const most=Math.max(1,...lanes.map(l=>l.length));
 return `<div class="cal-allday" style="height:${11+most*28+(most-1)*4+1}px"><div class="cal-axis"><span>All day</span></div>${days.map((d,i)=>`<div class="cal-adcell" data-cal-drop="${d}" data-cal="newday" data-date="${d}" role="group" aria-label="All-day and deadlines, ${a_(longDate(d))}">${lanes[i].join('')}</div>`).join('')}</div>`;
}
function block(it,column,columns,ro){
 const o=it,h=minutesToPx(o.end-o.start)-2,compactB=h<44,locked=!ro&&o.repeats;
 const left=`calc((100% - 5px) * ${column/columns} + 2px)`,width=`calc((100% - 5px) / ${columns} - ${columns>1?2:0}px)`;
 const time=fmtRange(o.start,o.end);
 const inner=compactB?`<div class="cal-b1"><p class="cal-bt">${e_(o.title)}${h>=28?'':` <span class="cal-bs">${fmtTime(o.start)}</span>`}</p></div>`:
  `<div class="cal-b2"><p class="cal-bt${h>=60?' two':''}">${o.repeats?'↻ ':''}${e_(o.title)}</p><p class="cal-bs">${time}</p>${o.note?`<p class="cal-bs">${e_(o.note)}</p>`:''}</div>`;
 const style=(ro?'':cstyle(o.color)+';')+`top:${minutesToPx(o.start)+1}px;height:${Math.max(h,14)}px;left:${left};width:${width};z-index:${10+column}`;
 if(ro)return `<a class="cal-block cal-gblock" ${o.link?`href="${a_(o.link)}" target="_blank" rel="noopener"`:''} data-ro="1" style="${style}" title="${a_(o.title)} · Google Calendar">${inner}</a>`;
 return `<div class="cal-block${o.done?' is-done':''}" role="button" tabindex="0" data-event-id="${a_(o.id)}" data-date="${o.date}" data-start="${o.start}" data-end="${o.end}"${locked?' data-locked="1"':''} style="${style}" aria-label="${a_(o.title+', '+time)}">${inner}${locked?'':'<span class="cal-resize" data-resize aria-hidden="true"></span>'}</div>`;
}
const nowMinutes=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()+n.getSeconds()/60};
function dayColumn(d,ctx){
 const timed=[...(ctx.ev.get(d)||[]).filter(o=>!o.allDay).map(o=>({...o,ro:false})),
  ...(S.showEvents?(ctx.g.get(d)||[]).filter(x=>!x.allDay).map(x=>({id:x.id,title:x.title,start:x.startMin,end:x.endMin,link:x.link,ro:true,date:d})):[])];
 const laid=layoutDay(timed);
 const nowLine=d===ctx.today?`<div class="cal-now" data-cal-now style="top:${minutesToPx(nowMinutes())-4}px"><span></span><i></i></div>`:'';
 return `<div class="cal-col" data-cal-day="${d}" data-cal-drop="${d}" role="group" aria-label="${a_(longDate(d))} schedule">${laid.map(l=>block(l.item,l.column,l.columns,l.item.ro)).join('')}${nowLine}</div>`;
}
function timeGrid(days,ctx){
 const lines=Array.from({length:23},(_,i)=>`<div class="cal-hline" style="top:${(i+1)*HOUR_PX}px"></div>`).join('');
 const labels=Array.from({length:23},(_,i)=>`<span style="top:${(i+1)*HOUR_PX-7}px">${pad(i+1)}:00</span>`).join('');
 return `<div class="cal-scroll" data-cal-scroll><div class="cal-sheet"><div class="cal-sticky">${dayHeaders(days,ctx.today)}${allDayRow(days,ctx)}</div>`+
  `<div class="cal-gridwrap" style="height:${24*HOUR_PX}px"><div class="cal-hlines">${lines}</div><div class="cal-axis cal-labels" aria-hidden="true">${labels}</div><div class="cal-body" data-cal-body>${days.map(d=>dayColumn(d,ctx)).join('')}</div></div></div></div>`;
}

/* ----- month ----- */
function monthView(ctx){
 const an=anchor(),weeks=monthGrid(an),month=an.slice(0,7),phone=isPhone();
 return `<div class="cal-month"><div class="cal-mhead">${WEEKDAYS.map(d=>`<div>${phone?d[0]:d}</div>`).join('')}</div><div class="cal-mgrid" style="grid-template-rows:repeat(${weeks.length},minmax(0,1fr))">${weeks.flat().map((k,i)=>{
  const ts=(ctx.by.get(k)||[]).map(t=>taskPill(t,ctx.today)),evs=(ctx.ev.get(k)||[]).map(o=>eventPill(o)),gs=S.showEvents?(ctx.g.get(k)||[]).map(gPill):[];
  const all=[...ts,...evs,...gs],shown=all.slice(0,3),hidden=all.length-shown.length,out=k.slice(0,7)!==month;
  const dots=all.slice(0,3).map(()=>'<span class="cal-dot"></span>').join('');
  return `<div class="cal-mcell${out?' out':''}${i%7?' bl':''}${k===anchor()?' sel':''}" data-cal-drop="${k}" data-cal="mcell" data-date="${k}"><button type="button" class="cal-mnum${k===ctx.today?' today':''}${k===anchor()?' sel':''}" data-cal="mday" data-date="${k}" aria-label="${a_(longDate(k))}">${parse(k).getDate()}</button>${all.length?`<span class="cal-dots">${dots}</span>`:''}${shown.join('')}${hidden>0?`<button type="button" class="cal-more" data-cal="day" data-date="${k}">+${hidden} more</button>`:''}</div>`}).join('')}</div></div>`;
}

/* ----- agenda ----- */
function agendaView(ctx){
 const groups=agenda(tasks().filter(t=>S.showDone||t.status!=='done'),ctx.today),reps=events().filter(e=>e.repeat);
 if(!groups.length&&!reps.length)return `<div class="cal-agenda"><div class="cal-empty"><strong>No deadlines yet</strong><span>Give a task a due date, or drag one from the Tasks panel onto a day, and it shows up here.</span></div></div>`;
 const row=t=>{
  const u=urgency(t,ctx.today),synced=S.ownIds.has(String(t.id)),sp=spaceName(t.space_id);
  return `<div class="cal-arow"><span class="cal-adate" style="${cstyle(URGENCY_COLOR[u])}">${e_(shortDate(t.due_date))}</span><div class="cal-amain" data-cal="pop" data-kind="task" data-id="${a_(t.id)}"><strong class="${t.status==='done'?'done':''}">${e_(t.title)}</strong><small>${e_(sp||'Unsorted')} · ${e_(host.statusOf(t.status)[1])}${t.priority==='high'?' · High priority':''}</small></div><span class="cal-arel ${u}">${e_(relative(t,ctx.today))}</span><span class="cal-aacts">${synced?`<span class="cal-synced">${ic('check',13)} On Google</span>`:`<a class="cal-link" href="${a_(googleTemplateUrl(t,sp))}" target="_blank" rel="noopener">Add to Google</a>`}</span></div>`;
 };
 return `<div class="cal-agenda">${groups.map(g=>`<section class="cal-agroup g-${g.id}"><h3>${e_(g.label)} <span>${g.tasks.length}</span></h3>${g.tasks.map(row).join('')}</section>`).join('')}`+
  (reps.length?`<section class="cal-agroup"><h3>Repeating <span>${reps.length}</span></h3>${reps.map(r=>{const next=occurrences(r,ctx.today,addDays(ctx.today,400))[0];
   return `<div class="cal-arow"><span class="cal-adate" style="${cstyle(r.color)}">↻</span><div class="cal-amain" data-cal="pop" data-kind="event" data-id="${a_(r.id)}" data-date="${a_(next||r.date)}"><strong>${e_(r.title)}</strong><small>${e_(describe(r))}</small></div><span class="cal-arel">${next?'Next: '+e_(shortDate(next)):'Finished'}</span></div>`}).join('')}</section>`:'')+`</div>`;
}

/* ----- tasks side panel: deadlines at a glance + drag unscheduled tasks onto a day ----- */
function tasksPanel(ctx){
 if(!panelOpen())return '';
 const sm=summary(tasks(),ctx.today),open=tasks().filter(t=>t.status!=='done');
 const groups=[['Overdue',open.filter(t=>isKey(t.due_date)&&t.due_date<ctx.today).sort(byDeadline),'overdue'],['Due today',open.filter(t=>t.due_date===ctx.today).sort(byDeadline),'today'],
  ['Coming up',open.filter(t=>isKey(t.due_date)&&t.due_date>ctx.today&&diffDays(ctx.today,t.due_date)<=14).sort(byDeadline),'soon'],['No deadline',unscheduled(tasks()),'none']];
 const item=t=>{const u=urgency(t,ctx.today);return `<div class="cal-titem" draggable="true" data-cal-drag="${a_(t.id)}" data-cal="pop" data-kind="task" data-id="${a_(t.id)}"><span class="cal-tdot" style="background:var(--ev-${URGENCY_COLOR[u]}-fg)"></span><span class="cal-tt">${e_(t.title)}</span><small>${isKey(t.due_date)?e_(shortDate(t.due_date)):''}</small></div>`};
 return `<aside class="cal-side" aria-label="Tasks"><div class="cal-sidehead"><h3>Tasks</h3><label class="cal-check"><input type="checkbox" data-cal-toggle="showDone" ${S.showDone?'checked':''}/> Show done</label></div>`+
  `<div class="cal-stats"><span class="${sm.overdue?'red':''}"><b>${sm.overdue}</b> overdue</span><span><b>${sm.today}</b> today</span><span><b>${sm.week}</b> next 7d</span></div>`+
  `<p class="cal-hint">Drag a task onto a day to set its deadline.</p>`+
  groups.filter(g=>g[1].length).map(([l,list,c])=>`<section class="cal-sgroup ${c}"><h4>${l} <span>${list.length}</span></h4>${list.slice(0,40).map(item).join('')}${list.length>40?`<p class="cal-hint">+${list.length-40} more</p>`:''}</section>`).join('')+
  (!open.length?'<p class="cal-hint">Nothing open. Nice.</p>':'')+`</aside>`;
}

/* ----- popover (click on an event or deadline) ----- */
function popover(ctx){
 const p=S.pop;if(!p)return '';
 let body='';
 if(p.kind==='task'){
  const t=tasks().find(x=>x.id===p.id);if(!t)return '';
  const u=urgency(t,ctx.today),sp=spaceName(t.space_id),synced=S.ownIds.has(String(t.id));
  body=`<div class="cal-pbody"><span class="cal-psw" style="background:var(--ev-${URGENCY_COLOR[u]}-fg)"></span><div class="cal-pinfo"><h3>${e_(t.title)}</h3><p>${isKey(t.due_date)?e_(longDate(t.due_date))+' · '+e_(relative(t,ctx.today)):'No deadline yet'}</p><p>${e_(sp||'Unsorted')} · ${e_(host.statusOf(t.status)[1])}${t.priority==='high'?' · High priority':''}</p>${synced?`<p class="ok">${ic('check',13)} On Google Calendar</p>`:''}</div></div>`+
   `<div class="cal-pfoot"><button type="button" class="cal-btn sm" data-cal="topen" data-id="${a_(t.id)}">Open task</button><button type="button" class="cal-btn sm" data-cal="tdone" data-id="${a_(t.id)}">${t.status==='done'?'Reopen':'Mark done'}</button><span class="cal-fill"></span>${isKey(t.due_date)?(connected()?`<button type="button" class="cal-btn sm" data-cal="tpush" data-id="${a_(t.id)}">Push to Google</button>`:`<a class="cal-btn sm" href="${a_(googleTemplateUrl(t,sp))}" target="_blank" rel="noopener">Add to Google</a>`):''}</div>`;
 }else{
  const e=events().find(x=>x.id===p.id);if(!e)return '';
  const done=e.done.includes(p.date);
  body=`<div class="cal-pbody"><span class="cal-psw" style="background:var(--ev-${e.color}-fg)"></span><div class="cal-pinfo"><h3>${e_(e.title)}</h3><p>${e_(longDate(p.date))}</p><p>${e.allDay?'All day':e_(fmtRange(e.start,e.end))+' · '+e_(fmtDuration(e.end-e.start))}</p>${e.repeat?`<p>↻ ${e_(describe(e))}</p>`:''}${e.note?`<p class="note">${e_(e.note)}</p>`:''}${S.ownEventIds.has(String(e.id))?`<p class="ok">${ic('check',13)} On Google Calendar</p>`:''}</div></div>`+
   `<div class="cal-pfoot"><button type="button" class="cal-btn sm" data-cal="pedit" data-id="${a_(e.id)}" data-date="${a_(p.date)}">Edit</button>`+
   `<button type="button" class="cal-btn sm" data-cal="pdone" data-id="${a_(e.id)}" data-date="${a_(p.date)}">${done?'Undo done':'Done'}</button>${e.repeat?`<button type="button" class="cal-btn sm" data-cal="pskip" data-id="${a_(e.id)}" data-date="${a_(p.date)}">Skip this day</button>`:''}<span class="cal-fill"></span>`+
   `<button type="button" class="cal-btn sm" data-cal="pdup" data-id="${a_(e.id)}">Duplicate</button><button type="button" class="cal-btn sm danger" data-cal="pdel" data-id="${a_(e.id)}">Delete</button></div>`;
 }
 const W=320,vw=root.innerWidth||1200,vh=root.innerHeight||800;
 let left=p.rect.right+8;if(left+W>vw-12)left=p.rect.left-W-8;if(left<12)left=clampN((vw-W)/2,12,vw-W-12);
 const top=clampN(p.rect.top,12,Math.max(12,vh-230));
 return `<div class="cal-pop" role="dialog" aria-label="Details" style="left:${left}px;top:${top}px;width:${W}px;max-width:calc(100vw - 24px)">${body}</div>`;
}

/* ----- event dialog (create / edit) ----- */
function toDraft(e){
 const r=e.repeat;
 return {id:e.id||'',title:e.title||'',date:e.date,allDay:!!e.allDay,start:e.start,end:e.end,color:e.color||'blue',note:e.note||'',skip:e.skip||[],done:e.done||[],
  rfreq:r?r.freq:'',rinterval:r?r.interval:1,rdays:r?r.days.slice():[wd(e.date)],runtil:r?.until||'',_edit:!!e.id};
}
function fromDraft(d){
 return {id:d.id,title:d.title,date:d.date,allDay:d.allDay,start:d.start,end:d.end,color:d.color,note:d.note,skip:d.skip,done:d.done,
  repeat:d.rfreq?{freq:d.rfreq,interval:d.rinterval,days:d.rdays,until:d.runtil||null}:null};
}
function dialog(){
 const d=S.dlg;if(!d)return '';
 const dayBtns=WEEKDAYS.map((n,i)=>`<button type="button" class="cal-daybtn${d.rdays.includes(i)?' on':''}" data-cal="dday" data-day="${i}" aria-pressed="${d.rdays.includes(i)}">${n}</button>`).join('');
 return `<div class="cal-overlay" data-cal="dcancel"><div class="cal-dialog" role="dialog" aria-modal="true" aria-label="${d._edit?'Edit event':'New event'}" data-cal-stop>`+
  `<h3>${d._edit?'Edit event':'New event'}</h3>`+
  `<label class="cal-f">Title<input class="cal-in" data-cal-field="title" value="${a_(d.title)}" maxlength="120" placeholder="Add a title" autocomplete="off"/></label>`+
  `<div class="cal-row2"><label class="cal-f">Date<input class="cal-in" type="date" data-cal-field="date" value="${a_(d.date)}"/></label><label class="cal-f cal-switch"><span>All day</span><input type="checkbox" data-cal-field="allDay" ${d.allDay?'checked':''}/></label></div>`+
  (d.allDay?'':`<div class="cal-row2"><label class="cal-f">Start<input class="cal-in" type="time" data-cal-field="start" value="${fmtTime(d.start)}" step="900"/></label><label class="cal-f">End<input class="cal-in" type="time" data-cal-field="end" value="${d.end>=1440?'23:59':fmtTime(d.end)}" step="900"/></label></div>`)+
  `<div class="cal-f">Colour<div class="cal-colors" role="group" aria-label="Colour">${COLORS.map(c=>`<button type="button" class="cal-sw${d.color===c?' on':''}" style="background:var(--ev-${c}-fg)" data-cal="dcolor" data-color="${c}" aria-label="${c}" aria-pressed="${d.color===c}"></button>`).join('')}</div></div>`+
  `<div class="cal-row2"><label class="cal-f">Repeat<select class="cal-in" data-cal-field="rfreq"><option value="">Doesn’t repeat</option><option value="daily"${d.rfreq==='daily'?' selected':''}>Daily</option><option value="weekly"${d.rfreq==='weekly'?' selected':''}>Weekly</option><option value="monthly"${d.rfreq==='monthly'?' selected':''}>Monthly</option></select></label>`+
  (d.rfreq?`<label class="cal-f">Every<input class="cal-in" type="number" min="1" max="12" data-cal-field="rinterval" value="${a_(d.rinterval)}"/></label>`:'<span></span>')+`</div>`+
  (d.rfreq==='weekly'?`<div class="cal-f">On<div class="cal-days" role="group" aria-label="Weekdays">${dayBtns}</div></div>`:'')+
  (d.rfreq?`<label class="cal-f">Repeat until (optional)<input class="cal-in" type="date" data-cal-field="runtil" value="${a_(d.runtil)}"/></label>`:'')+
  `<label class="cal-f">Note<textarea class="cal-in" rows="2" data-cal-field="note" maxlength="500" placeholder="Add a note">${e_(d.note)}</textarea></label>`+
  (S.error&&S.message?`<p class="cal-err" role="alert">${e_(S.message)}</p>`:'')+
  `<div class="cal-dfoot">${d._edit?`<button type="button" class="cal-btn danger" data-cal="ddel">Delete</button>`:''}<span class="cal-fill"></span><button type="button" class="cal-btn" data-cal="dcancel">Cancel</button><button type="button" class="cal-btn primary" data-cal="dsave">${d._edit?'Save':'Create'}</button></div></div></div>`;
}

function googlePanel(){
 if(!S.panel)return '';
 const on=connected();
 return `<section class="cal-gpanel" aria-label="Google Calendar"><div><h3>Google Calendar</h3>`+
  (on?`<p class="ok">Connected. Your events show in grey. SELF only edits events it created itself.</p><div class="cal-row"><button type="button" class="cal-btn primary" data-cal="sync" ${S.syncing?'disabled':''}>${S.syncing?'Syncing…':'Sync to Google'}</button><button type="button" class="cal-btn" data-cal="disconnect">Disconnect</button></div><label class="cal-check"><input type="checkbox" data-cal-toggle="showEvents" ${S.showEvents?'checked':''}/> Show my Google events here</label>`
  :`<p>See your Google events next to your deadlines, and push deadlines and events out as real Google events with reminders.</p><label class="cal-f">OAuth Client ID<input class="cal-in" data-cal-input="clientId" value="${a_(S.clientId)}" placeholder="1234-abc.apps.googleusercontent.com" autocomplete="off" spellcheck="false"/></label><div class="cal-row"><button type="button" class="cal-btn primary" data-cal="connect" ${S.loading?'disabled':''}>${S.loading?'Connecting…':S.wasConnected?'Reconnect':'Connect Google Calendar'}</button></div>`+
   `<details class="cal-help"><summary>How to get a Client ID (2 minutes, free)</summary><ol><li>Google Cloud Console → new project → enable <b>Google Calendar API</b>.</li><li>APIs &amp; Services → Credentials → <b>Create OAuth client ID</b> → <b>Web application</b>.</li><li>Add <code>${e_(root.location?.origin||'')}</code> under <b>Authorized JavaScript origins</b>.</li><li>OAuth consent screen: add yourself as a test user, then paste the Client ID above.</li></ol><p>Only the Client ID is stored, on this device. The access token lives in memory only.</p></details>`)+
  (S.message?`<p class="cal-msg${S.error?' err':''}" role="status">${e_(S.message)}</p>`:'')+`</div>`+
  `<div><h3>No sign-in needed</h3><p>Download every deadline and event as an .ics file (import into Google Calendar, Apple Calendar or Outlook), or use “Add to Google” on any deadline.</p><div class="cal-row"><button type="button" class="cal-btn" data-cal="ics">Download .ics</button></div></div></section>`;
}

function render(){
 if(!host)return '';
 const today=todayKey(),days=S.view==='month'||S.view==='agenda'?[]:gridDays();
 const [from,to]=visibleRange();
 const ctx={today,by:groupByDate(scheduled(tasks(),{showDone:S.showDone})),ev:eventsByDay(events(),from,to),g:eventsByDate(S.gEvents)};
 if(connected()&&S.showEvents)queueMicrotask(()=>loadGoogleEvents());
 const main=S.view==='month'?monthView(ctx):S.view==='agenda'?agendaView(ctx):timeGrid(days,ctx);
 const note=S.message&&!S.panel&&!S.dlg?`<p class="cal-msg${S.error?' err':''}" role="status">${e_(S.message)}</p>`:'';
 return `<section class="cal" data-cal-root aria-label="Calendar">${header(days)}${googlePanel()}${note}<div class="cal-layout"><div class="cal-main${S.view==='agenda'?' scroll':''}">${main}</div>${tasksPanel(ctx)}</div>${popover(ctx)}${dialog()}</section>`;
}
/* Called by the app after every render: restore the scroll position, keep the now-line moving. */
function afterRender(){
 if(!doc)return;
 const sc=doc.querySelector('[data-cal-scroll]');
 if(sc){
  sc.scrollTop=S.scrollTop??6*HOUR_PX;S.scrollTop=sc.scrollTop;
  /* restoring the position fires a scroll event too: only a real change closes the popover */
  sc.onscroll=()=>{if(Math.abs(sc.scrollTop-S.scrollTop)<2)return;S.scrollTop=sc.scrollTop;if(S.pop){S.pop=null;doc.querySelector('.cal-pop')?.remove()}};
 }
 if(S.dlg&&S.dlg._focus){S.dlg._focus=false;root.setTimeout?.(()=>doc.querySelector('[data-cal-field="title"]')?.focus(),0)}
 if(doc.querySelector('[data-cal-now]')&&!nowTimer)nowTimer=root.setInterval?.(()=>{const n=doc.querySelector('[data-cal-now]');if(n)n.style.top=(minutesToPx(nowMinutes())-4)+'px'},60000);
}

/* ---------- actions ---------- */
function step(dir){
 const a=anchor();
 S.anchor=S.view==='month'?addMonths(a,dir):S.view==='day'?addDays(a,dir):addDays(a,(isPhone()?3:7)*dir);
 S.rangeKey='';S.pop=null;host.render();
}
async function moveDeadline(id,date){
 const t=tasks().find(x=>x.id===id);
 if(!t||!isKey(date)||t.due_date===date)return;
 const ok=await host.mutate(async()=>host.patch('tasks',id,{due_date:date}),'Deadline set to '+shortDate(date));
 if(ok!==false)syncOne(id);
}
const uid=()=>'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function openDialog(draft){S.dlg={...toDraft(draft),_focus:true};S.pop=null;say('');host.render()}
function newEventDraft(date,start=540,end=start+60,allDay=false){return {date,start,end,allDay,color:'blue',note:'',skip:[],done:[]}}
function saveDialog(){
 const d=S.dlg;if(!d)return;
 const title=clip(d.title,120);
 if(!title)return fail('Give it a title first.');
 if(!isKey(d.date))return fail('Pick a date.');
 if(!d.allDay&&d.end<=d.start)return fail('The end time must be after the start time.');
 if(d.rfreq==='weekly'&&!d.rdays.length)return fail('Pick at least one weekday.');
 if(d.rfreq&&d.runtil&&(!isKey(d.runtil)||d.runtil<d.date))return fail('“Repeat until” must be on or after the date.');
 const list=events();
 if(!d._edit&&list.length>=500)return fail('You can keep up to 500 events.');
 const id=d.id||uid(),ev=cleanEvent({...fromDraft(d),id,title});
 if(!ev)return fail('Check the details and try again.');
 saveEvents(d._edit?list.map(x=>x.id===id?ev:x):[...list,ev]);
 S.anchor=ev.date;S.dlg=null;say(connected()?'Saved. Press Sync to Google to update your Google Calendar.':'');host.render();
}
function fail(msg){say(msg,true);host.render()}
const toggle=(list,k)=>list.includes(k)?list.filter(x=>x!==k):[...list,k];
function patchEvent(id,fn){saveEvents(events().map(x=>x.id===id?cleanEvent(fn({...x}))||x:x))}
const rectOf=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
function showPop(p){S.pop=p;S.popAt=Date.now();host.render()}
function openPop(el){showPop({kind:el.dataset.kind,id:el.dataset.id,date:el.dataset.date||'',rect:rectOf(el)})}
function act(el){
 const k=el.dataset.cal;
 switch(k){
  case 'prev':return step(-1);
  case 'next':return step(1);
  case 'today':S.anchor=todayKey();S.rangeKey='';S.pop=null;return host.render();
  case 'view':S.view=el.dataset.view;S.rangeKey='';S.pop=null;S.scrollTop=null;savePrefs();return host.render();
  case 'panel':S.panel=!S.panel;S.pop=null;return host.render();
  case 'tasks':S.tasksPanel=!panelOpen();savePrefs();return host.render();
  case 'headday':if(el.dataset.date===anchor()||isPhone()){S.anchor=el.dataset.date;S.view='day';S.rangeKey='';savePrefs()}else S.anchor=el.dataset.date;S.pop=null;return host.render();
  case 'day':S.anchor=el.dataset.date;S.view='day';S.rangeKey='';S.pop=null;savePrefs();return host.render();
  case 'mday':if(el.dataset.date===anchor()||isPhone()){S.anchor=el.dataset.date;S.view='day';S.rangeKey='';savePrefs()}else S.anchor=el.dataset.date;return host.render();
  case 'mcell':S.anchor=el.dataset.date;S.pop=null;return host.render();
  case 'newevent':return openDialog(newEventDraft(anchor()));
  case 'newday':return openDialog(newEventDraft(el.dataset.date,0,1440,true));
  case 'pop':return openPop(el);
  case 'pedit':{const e=events().find(x=>x.id===el.dataset.id);return e&&openDialog(e)}
  case 'pdup':{const e=events().find(x=>x.id===el.dataset.id);if(e){saveEvents([...events(),{...e,id:uid(),title:clip(e.title+' (copy)',120),skip:[],done:[]}]);S.pop=null;host.render()}return}
  case 'pdel':{const e=events().find(x=>x.id===el.dataset.id);if(!e)return;if(e.repeat&&!root.confirm?.('Delete “'+e.title+'” and every repeat of it?'))return;saveEvents(events().filter(x=>x.id!==e.id));S.pop=null;say(connected()?'Deleted. Press Sync to Google to remove it from Google Calendar.':'');return host.render()}
  case 'pdone':patchEvent(el.dataset.id,x=>({...x,done:toggle(x.done,el.dataset.date)}));S.pop=null;return host.render();
  case 'pskip':patchEvent(el.dataset.id,x=>({...x,skip:toggle(x.skip,el.dataset.date)}));S.pop=null;return host.render();
  case 'topen':S.pop=null;return host.openTask?.(el.dataset.id);
  case 'tdone':{const t=tasks().find(x=>x.id===el.dataset.id);S.pop=null;if(!t)return host.render();return host.mutate(async()=>host.patch('tasks',t.id,{status:t.status==='done'?'todo':'done'}),t.status==='done'?'Task reopened':'Task completed')}
  case 'tpush':return pushTask(el.dataset.id);
  case 'dcancel':S.dlg=null;say('');return host.render();
  case 'dsave':return saveDialog();
  case 'ddel':{const d=S.dlg;if(d.rfreq&&!root.confirm?.('Delete “'+d.title+'” and every repeat of it?'))return;saveEvents(events().filter(x=>x.id!==d.id));S.dlg=null;return host.render()}
  case 'dcolor':S.dlg.color=el.dataset.color;return host.render();
  case 'dday':S.dlg.rdays=toggle(S.dlg.rdays,Number(el.dataset.day)).sort();return host.render();
  case 'connect':return connect();
  case 'disconnect':return disconnect();
  case 'sync':return syncAll();
  case 'ics':{
   const n=scheduled(tasks()).length+events().length;
   if(!n){say('Nothing to export yet.',true);return host.render()}
   download('self-calendar.ics',buildIcs(tasks(),{spaceName,events:events()}),'text/calendar');say('Downloaded '+n+' item'+(n===1?'':'s')+'. Import the file in Google Calendar: Settings → Import & export.');return host.render();
  }
 }
}
function onClick(ev){
 const t=ev.target;
 if(!t.closest?.('[data-cal-root]'))return;
 if(S.pop&&Date.now()-(S.popAt||0)>400&&!t.closest('.cal-pop')&&!t.closest('[data-cal="pop"]')){S.pop=null;doc.querySelector('.cal-pop')?.remove()}
 if(t.closest('[data-cal-stop]')&&!t.closest('[data-cal]'))return;
 const el=t.closest('[data-cal]');
 if(!el)return;
 /* clicks inside the dialog never fall through to the overlay's "close" */
 if(el.dataset.cal==='dcancel'&&el.classList.contains('cal-overlay')&&t.closest('[data-cal-stop]'))return;
 if(/^(newday|mcell)$/.test(el.dataset.cal)&&t.closest('.cal-pill,.cal-more,.cal-mnum'))return;
 if(el.dataset.cal==='pop'&&t.closest('a'))return;
 ev.preventDefault();act(el);
}
function onDblClick(ev){
 const c=ev.target.closest?.('[data-cal="mcell"]');
 if(c&&!ev.target.closest('.cal-pill,.cal-more,.cal-mnum'))openDialog(newEventDraft(c.dataset.date));
}
function setField(el){
 const d=S.dlg,k=el.dataset.calField;if(!d||!k)return false;
 if(k==='allDay')d.allDay=el.checked;
 else if(k==='start'||k==='end'){const m=parseTime(el.value);if(m===null)return true;d[k]=m;if(k==='start'&&d.end<=m)d.end=Math.min(1440,m+60)}
 else if(k==='rinterval')d.rinterval=clampN(parseInt(el.value,10)||1,1,12);
 else d[k]=el.value;
 return true;
}
function onChange(ev){
 const el=ev.target;
 if(el.dataset?.calToggle){S[el.dataset.calToggle]=el.checked;S.rangeKey='';savePrefs();host.render();return}
 if(el.dataset?.calField&&setField(el)&&/^(allDay|rfreq|start)$/.test(el.dataset.calField))host.render();
}
function onInput(ev){const el=ev.target;if(el.dataset?.calInput==='clientId'){S.clientId=el.value;savePrefs()}else if(el.dataset?.calField&&el.type!=='time'&&el.type!=='date')setField(el)}

/* ---- pointer engine for the time grid (port of the reference: create / move / resize with 15-minute snapping) ---- */
function slotAt(body,x,y){
 const r=body.getBoundingClientRect(),cols=body.children.length||1,w=r.width/cols;
 return {dayIndex:clampN(Math.floor((x-r.left)/w),0,cols-1),minutes:clampN(pxToMinutes(y-r.top),0,1440)};
}
function ghostFor(body,dayIndex,s,e){
 let g=body.querySelector('.cal-ghost');
 if(!g){g=doc.createElement('div');g.className='cal-ghost'}
 if(g.parentNode!==body.children[dayIndex])body.children[dayIndex].appendChild(g);
 g.style.top=(minutesToPx(s)+1)+'px';g.style.height=Math.max(minutesToPx(e-s)-2,14)+'px';g.innerHTML='<span>'+fmtRange(s,e)+'</span>';
}
function onPointerDown(ev){
 if(ev.button!==0||pd)return;
 const body=ev.target.closest?.('[data-cal-body]');if(!body)return;
 if(ev.target.closest('a'))return;
 const blk=ev.target.closest('[data-event-id]'),pos=slotAt(body,ev.clientX,ev.clientY);
 const base={body,x:ev.clientX,y:ev.clientY,blk,pointerId:ev.pointerId,moved:false};
 if(ev.pointerType==='touch'||(blk&&blk.dataset.locked)){pd={...base,type:'tap',pos};return}
 try{body.setPointerCapture(ev.pointerId)}catch{}
 if(blk){
  const s=Number(blk.dataset.start),e=Number(blk.dataset.end);
  pd={...base,type:ev.target.closest('[data-resize]')?'resize':'move',id:blk.dataset.eventId,dayIndex:[...body.children].indexOf(blk.parentNode),date:blk.dataset.date,start:s,end:e,grab:pos.minutes-s};
 }else{
  const m=snap(pos.minutes-SNAP/2);
  pd={...base,type:'create',dayIndex:pos.dayIndex,anchor:m,current:m};
 }
 ev.preventDefault();
}
function onPointerMove(ev){
 if(!pd||ev.pointerId!==pd.pointerId||pd.type==='tap')return;
 if(!pd.moved){if(Math.hypot(ev.clientX-pd.x,ev.clientY-pd.y)<=DRAG_THRESHOLD)return;pd.moved=true;pd.blk?.classList.add('dragging');pd.body.classList.add('grabbing')}
 const {dayIndex,minutes}=slotAt(pd.body,ev.clientX,ev.clientY);
 if(pd.type==='create'){pd.current=snap(minutes);ghostFor(pd.body,pd.dayIndex,Math.min(pd.anchor,pd.current),Math.max(pd.anchor,pd.current,Math.min(pd.anchor,pd.current)+MIN_EVENT))}
 else if(pd.type==='move'){
  const len=pd.end-pd.start;pd.start=clampN(snap(minutes-pd.grab),0,1440-len);pd.end=pd.start+len;pd.dayIndex=dayIndex;
  const col=pd.body.children[dayIndex];if(pd.blk.parentNode!==col)col.appendChild(pd.blk);
  pd.blk.style.top=(minutesToPx(pd.start)+1)+'px';pd.blk.style.left='2px';pd.blk.style.width='calc(100% - 5px)';
  const t=pd.blk.querySelector('.cal-bs');if(t)t.textContent=fmtRange(pd.start,pd.end);
 }else{
  pd.end=clampN(snap(minutes),pd.start+MIN_EVENT,1440);
  pd.blk.style.height=Math.max(minutesToPx(pd.end-pd.start)-2,14)+'px';
  const t=pd.blk.querySelector('.cal-bs');if(t)t.textContent=fmtRange(pd.start,pd.end);
 }
}
function onPointerUp(ev){
 if(!pd||ev.pointerId!==pd.pointerId)return;
 const d=pd;pd=null;
 d.body.classList.remove('grabbing');d.body.querySelector('.cal-ghost')?.remove();d.blk?.classList.remove('dragging');
 const days=gridDays();
 const openBlock=el=>showPop({kind:'event',id:el.dataset.eventId,date:el.dataset.date,rect:rectOf(el)});
 if(d.type==='tap'){
  if(Math.hypot(ev.clientX-d.x,ev.clientY-d.y)>=8)return;
  if(d.blk)return openBlock(d.blk);
  const s=clampN(Math.floor(d.pos.minutes/30)*30,0,1380);return openDialog(newEventDraft(days[d.pos.dayIndex],s,s+60));
 }
 if(d.type==='create'){
  const day=days[d.dayIndex];
  if(!d.moved){const s=clampN(Math.floor(d.anchor/30)*30,0,1380);return openDialog(newEventDraft(day,s,s+60))}
  const s=Math.min(d.anchor,d.current),en=Math.max(d.anchor,d.current,s+MIN_EVENT);return openDialog(newEventDraft(day,s,en));
 }
 if(!d.moved)return openBlock(d.blk);
 const date=days[d.dayIndex],e=events().find(x=>x.id===d.id);
 if(e&&(e.date!==date||e.start!==d.start||e.end!==d.end))saveEvents(events().map(x=>x.id===d.id?{...x,date,start:d.start,end:d.end}:x));
 S.pop=null;host.render();
}
function onPointerCancel(){
 if(!pd)return;
 const d=pd;pd=null;d.body.classList.remove('grabbing');d.body.querySelector('.cal-ghost')?.remove();host.render();
}
/* ---- native drag and drop: deadlines/tasks onto any day ---- */
function onDragStart(ev){
 const c=ev.target.closest?.('[data-cal-drag]');if(!c)return;
 S.drag=c.dataset.calDrag;ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',S.drag);c.classList.add('dragging');
}
function onDragOver(ev){
 const c=ev.target.closest?.('[data-cal-drop]');if(!c||!S.drag)return;
 ev.preventDefault();ev.dataTransfer.dropEffect='move';
 doc.querySelectorAll('.drop').forEach(x=>x!==c&&x.classList.remove('drop'));c.classList.add('drop');
}
function onDrop(ev){
 const c=ev.target.closest?.('[data-cal-drop]');if(!c||!S.drag)return;
 ev.preventDefault();const id=S.drag;S.drag=null;moveDeadline(id,c.dataset.calDrop);
}
function onDragEnd(){S.drag=null;doc.querySelectorAll('.drop,.dragging').forEach(x=>x.classList.remove('drop','dragging'))}
function onKey(ev){
 if(!ev.target.closest)return;
 const inRoot=ev.target.closest('[data-cal-root]'),typing=/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName||'')||ev.target.isContentEditable;
 if(ev.key==='Escape'&&inRoot&&(S.panel||S.dlg||S.pop)){S.panel=false;S.dlg=null;S.pop=null;host.render();return}
 if(ev.key==='Enter'&&S.dlg&&ev.target.dataset?.calField==='title'){ev.preventDefault();saveDialog();return}
 if((ev.key==='Enter'||ev.key===' ')&&ev.target.dataset?.eventId&&inRoot){ev.preventDefault();const el=ev.target;showPop({kind:'event',id:el.dataset.eventId,date:el.dataset.date,rect:rectOf(el)});return}
 if((ev.key==='Delete'||ev.key==='Backspace')&&inRoot&&!typing&&ev.target.dataset?.eventId){ev.preventDefault();act({dataset:{cal:'pdel',id:ev.target.dataset.eventId}});return}
 if(typing||ev.ctrlKey||ev.metaKey||ev.altKey||host?.state?.().view!=='calendar'||S.dlg)return;
 const k=ev.key.toLowerCase();
 if(k==='t'){act({dataset:{cal:'today'}});ev.preventDefault()}
 else if(k==='arrowleft'&&S.view!=='agenda'){step(-1);ev.preventDefault()}
 else if(k==='arrowright'&&S.view!=='agenda'){step(1);ev.preventDefault()}
 else if(k==='d'||k==='w'||k==='m'||k==='a'){act({dataset:{cal:'view',view:{d:'day',w:'week',m:'month',a:'agenda'}[k]}});ev.preventDefault()}
 else if(k==='n'){openDialog(newEventDraft(anchor()));ev.preventDefault()}
}

function init(h){
 host=h;loadPrefs();
 if(doc&&!init.bound){
  init.bound=true;
  doc.addEventListener('click',onClick);doc.addEventListener('dblclick',onDblClick);doc.addEventListener('change',onChange);doc.addEventListener('input',onInput);doc.addEventListener('keydown',onKey);
  doc.addEventListener('pointerdown',onPointerDown);doc.addEventListener('pointermove',onPointerMove);doc.addEventListener('pointerup',onPointerUp);doc.addEventListener('pointercancel',onPointerCancel);
  doc.addEventListener('dragstart',onDragStart);doc.addEventListener('dragover',onDragOver);doc.addEventListener('drop',onDrop);doc.addEventListener('dragend',onDragEnd);
 }
}
/* Sign-out on a shared browser: forget the token, Google events and anything held in memory. */
function reset(){S.token=null;S.connected=false;S.gEvents=[];S.ownIds=new Set();S.ownEventIds=new Set();S.rangeKey='';S.message='';S.panel=false;S.anchor=null;S.dlg=null;S.pop=null;S.events=[];S.eventsFor=null}

const api={init,render,afterRender,reset,state:S,
 keyOf,parse,addDays,diffDays,startOfWeek,startOfMonth,addMonths,monthGrid,weekDays,isoWeek,isKey,
 urgency,relative,scheduled,unscheduled,groupByDate,summary,agenda,
 googleTemplateUrl,buildIcs,eventPayload,planSync,mapGoogleEvent,eventsByDate,
 cleanEvent,cleanEvents,matches,occurrences,occursOn,firstOccurrence,eventsByDay,describe,layoutDay,rrule,eventBody,planEventSync,mergePlans,fmtTime,fmtRange,parseTime,snap};
root.SELFCalendar=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
