/* SELF Hunt › Tracker: any link or note is one row with a status, a next step and a "last touched" log.
   This file holds the pure helpers only (URL normalisation, source detection from the URL, views, ageing, industry mapping).
   It never fetches a pasted link, never calls an AI model and never touches the DOM or the database. Spec: docs/design/HUNT_TRACKER_PLAN.md */
(function(root){
'use strict';

/* ---------- vocabulary ---------- */
const SOURCES=[['linkedin','LinkedIn'],['linkedin_jobs','LinkedIn Jobs'],['jobstreet','Jobstreet'],['glints','Glints'],['kalibrr','Kalibrr'],['job_board','Job board'],['ats','Company ATS'],['company_site','Careers page'],['email','Email'],['website','Website'],['referral','Referral'],['other','Other']];
const KINDS=[['job','Job'],['person','Person'],['company','Company'],['other','Other']];
const STATUSES=[['inbox','Inbox'],['active','Active'],['waiting','Waiting'],['done','Done'],['dropped','Dropped']];
const VIEWS=['today','inbox','all','stale'];
const DROP_REASONS=['No Indonesia office','No Indonesians there','No vacancy in Indonesia','No careers page','Closed','Not a fit'];
const OUTCOMES=['Applied','Got a reply','Interview','Offer','Rejected','Other'];
const INDUSTRIES=['Private Equity','Venture Capital','Investment Banking','Consulting','Corporate Finance / Strategy','Asset Management','Banking','Fintech','Tech','Other'];
const STALE_DAYS=14;
const label=(list,v)=>(list.find(x=>x[0]===v)||[v,v])[1];
const sourceLabel=v=>label(SOURCES,v),kindLabel=v=>label(KINDS,v),statusLabel=v=>label(STATUSES,v);

/* Outreach owns the LinkedIn profile key, so a person pasted here and in Outreach has one duplicate key. Resolved lazily: load order is not guaranteed. */
function outreach(){
 if(root.SELFOutreach)return root.SELFOutreach;
 try{if(typeof require==='function')return require('./outreach.js')}catch{}
 return null;
}

/* ---------- URLs ---------- */
const TRACKING=/^(utm_.*|trk|trackingid|refid|lipi|ref|source|gclid|fbclid)$/i;
const FREE_MAIL=/^(gmail\.com|googlemail\.com|yahoo\.com|yahoo\.co\.id|ymail\.com|outlook\.com|hotmail\.com|live\.com|icloud\.com|proton\.me|protonmail\.com)$/i;
const SECOND_LEVEL=new Set(['co','com','or','ac','go','web','net','org','gov','edu','sch','my','biz']);
const noWww=h=>h.replace(/^www\./,'');

/* Returns a canonical https/mailto string or null. LinkedIn profiles and jobs collapse to a stable form so the same page always has one key. */
function normalizeUrl(text){
 let s=String(text==null?'':text).trim();
 if(!s||/\s/.test(s))return null;
 if(/^mailto:/i.test(s)){
  const addr=s.slice(7).split('?')[0].trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)?'mailto:'+addr:null;
 }
 if(!/^[a-z][a-z0-9+.-]*:/i.test(s)){if(!/^[^\/?#]+\.[^\/?#]+/.test(s))return null;s='https://'+s}
 let u;try{u=new URL(s)}catch{return null}
 if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
 const host=noWww(u.hostname.toLowerCase());
 if(!host.includes('.'))return null;
 if(host==='linkedin.com'||host.endsWith('.linkedin.com')){
  const O=outreach(),slug=O&&/^\/in\//i.test(u.pathname)?O.slugOf(u.href):null;
  if(slug)return O.profileUrl(slug);
  const job=/^\/jobs\/view\/(?:[^\/?#]*-)?(\d{5,})/i.exec(u.pathname)||(/^\/jobs\//i.test(u.pathname)?/^(\d{5,})$/.exec(u.searchParams.get('currentJobId')||''):null);
  if(job)return 'https://www.linkedin.com/jobs/view/'+job[1];
 }
 const keep=[...u.searchParams.entries()].filter(([k])=>!TRACKING.test(k)).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
 const qs=keep.length?'?'+keep.map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'):'';
 const path=u.pathname.replace(/\/+$/,'');
 return 'https://'+host+(u.port&&u.port!=='443'&&u.port!=='80'?':'+u.port:'')+path+qs;
}

/* "example.co.id" → "example.co.id" for "careers.example.co.id": the registrable domain, with a small list of second-level labels. */
function registrable(host){
 const p=String(host||'').toLowerCase().split('.').filter(Boolean);
 if(p.length<=2)return p.join('.');
 const last=p[p.length-1],second=p[p.length-2];
 return (last.length===2&&SECOND_LEVEL.has(second)?p.slice(-3):p.slice(-2)).join('.');
}
const titleCase=slug=>String(slug||'').split(/[-_.\s]+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
/* "careers.northstar-capital.co.id" → "Northstar Capital". A guess from the domain, never presented as fact. */
function companyFromHost(host){
 const reg=registrable(host),p=reg.split('.');
 if(p.length<2)return '';
 const label=p.length>=3&&SECOND_LEVEL.has(p[p.length-2])&&p[p.length-1].length===2?p[p.length-3]:p[p.length-2];
 return titleCase(label);
}

/* ---------- source detection (from the URL alone) ---------- */
function detectSource(input){
 const url=normalizeUrl(input);
 const none={source:'other',kind:'other',companyGuess:'',url:null};
 if(!url)return none;
 if(url.startsWith('mailto:')){
  const domain=url.split('@')[1]||'';
  return {source:'email',kind:'person',companyGuess:FREE_MAIL.test(domain)?'':companyFromHost(domain),url};
 }
 const u=new URL(url),host=u.hostname,path=u.pathname,res=(source,kind,companyGuess='')=>({source,kind,companyGuess,url});
 if(host==='linkedin.com'||host.endsWith('.linkedin.com')){
  if(/^\/jobs\//i.test(path))return res('linkedin_jobs','job');
  if(/^\/in\//i.test(path))return res('linkedin','person');
  const co=/^\/company\/([^\/]+)/i.exec(path);
  if(co)return res('linkedin','company',titleCase(decodeURIComponent(co[1])));
  return res('linkedin','other');
 }
 if(/(^|\.)jobstreet\.(co\.id|com(\.[a-z]{2})?)$/.test(host))return res('jobstreet','job');
 if(host==='glints.com'||host.endsWith('.glints.com'))return res('glints','job');
 if(host==='kalibrr.com'||host.endsWith('.kalibrr.com')){const c=/^\/c\/([^\/]+)/i.exec(path);return res('kalibrr','job',c?titleCase(c[1]):'')}
 if(/(^|\.)(dealls\.com|indeed\.com)$/.test(host)||(host==='techinasia.com'&&/^\/jobs/i.test(path)))return res('job_board','job');
 let m;
 if(/^(job-)?boards\.greenhouse\.io$/.test(host)||host==='jobs.lever.co'||host==='jobs.ashbyhq.com'||host==='apply.workable.com'){
  m=/^\/([^\/]+)/.exec(path);return res('ats','job',m?titleCase(m[1]):'');
 }
 if((m=/^([^.]+)\.workable\.com$/.exec(host)))return res('ats','job',titleCase(m[1]));
 if((m=/^([^.]+)\.wd\d*\.myworkdayjobs\.com$/.exec(host)))return res('ats','job',titleCase(m[1]));
 if(/^(careers?|jobs)\./.test(host)||/(^|\/)(careers?|jobs|karir)(\/|$)/i.test(path))return res('company_site','job',companyFromHost(host));
 return res('website','company',companyFromHost(host));
}

/* ---------- capture ---------- */
const URL_TOKEN=/(?:https?:\/\/|mailto:|www\.)[^\s<>"'\]]+|(?:[a-z0-9-]+\.)*linkedin\.com\/[^\s<>"'\]]+/gi;
/* Turns pasted text into rows. Every link becomes one item; a block with no link becomes one note. A single link keeps the words around it as its title. */
function parseDrop(text){
 const raw=String(text==null?'':text),items=[],seen=new Set();
 const found=raw.match(URL_TOKEN)||[];
 for(const tok of found){
  const clean=tok.replace(/[.,;:!)]+$/,''),d=detectSource(clean);
  if(!d.url||seen.has(d.url))continue;
  seen.add(d.url);
  let title='';
  if(d.source==='linkedin'&&d.kind==='person'){const O=outreach(),slug=O&&O.slugOf(d.url);title=slug?O.nameFromSlug(slug):''}
  items.push({url:d.url,source:d.source,kind:d.kind,companyGuess:d.companyGuess,title});
 }
 if(!items.length){
  const note=raw.trim().replace(/\s+/g,' ').slice(0,200);
  return note?[{note,url:null,source:'other',kind:'other',companyGuess:'',title:note}]:[];
 }
 if(found.length===1&&!items[0].title){
  const rest=raw.replace(found[0],' ').trim().replace(/\s+/g,' ').slice(0,200);
  if(rest)items[0].title=rest;
 }
 return items;
}
function findDuplicate(url,tracks){
 const key=normalizeUrl(url);if(!key)return null;
 return (tracks||[]).find(t=>t.url&&normalizeUrl(t.url)===key)||null;
}

/* ---------- time, views, ordering ---------- */
const day10=s=>String(s||'').slice(0,10);
function daysBetween(a,b){
 const p=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(day10(s));return m?Date.UTC(+m[1],+m[2]-1,+m[3]):NaN};
 return Math.round((p(b)-p(a))/864e5);
}
function ageLabel(ts,today){
 if(!ts)return 'new';
 const n=daysBetween(ts,today);
 if(!Number.isFinite(n))return 'new';
 if(n<=0)return 'today';
 if(n<30)return n+'d ago';
 if(n<365)return Math.floor(n/30)+'mo ago';
 return Math.floor(n/365)+'y ago';
}
const isClosed=t=>t.status==='done'||t.status==='dropped';
/* The earliest date a row is waiting on: its next step or its deadline. */
const dueOf=t=>[t.next_due,t.deadline].filter(Boolean).map(day10).sort()[0]||null;
/* Which views a row appears in (spec §3.2). Done and dropped rows only appear in All. */
function bucket(t,today,staleDays=STALE_DAYS){
 const out=['all'];
 if(isClosed(t))return out;
 if(t.status==='inbox')out.push('inbox');
 const due=t.next_due?daysBetween(today,t.next_due):Infinity,dl=t.deadline?daysBetween(today,t.deadline):Infinity;
 if(due<=0||dl<=3)out.push('today');
 const idle=daysBetween(t.last_activity_at||t.created_at,today);
 if(Number.isFinite(idle)&&idle>=staleDays)out.push('stale');
 return out;
}
function sortFor(view,rows,today){
 const list=[...(rows||[])],at=t=>day10(t.last_activity_at||t.created_at),mk=t=>String(t.last_activity_at||t.created_at||'');
 const cmp=(a,b)=>a<b?-1:a>b?1:0;
 if(view==='today')return list.sort((a,b)=>cmp(dueOf(a)||'9999',dueOf(b)||'9999')||cmp(mk(b),mk(a)));
 if(view==='inbox')return list.sort((a,b)=>cmp(String(b.created_at||''),String(a.created_at||'')));
 if(view==='stale')return list.sort((a,b)=>cmp(at(a),at(b))||cmp(mk(a),mk(b)));
 return list.sort((a,b)=>cmp(mk(b),mk(a)));
}

/* ---------- industry ---------- */
/* Maps the free text already stored on companies ("PE", "pe fund", "VC") to the fixed list. Empty stays empty; unknown text is "Other". */
function industryOf(text){
 const s=String(text||'').trim();
 if(!s)return '';
 const exact=INDUSTRIES.find(i=>i.toLowerCase()===s.toLowerCase());
 if(exact)return exact;
 if(/\bpe\b|private\s*equity|buy-?out|growth\s*equity/i.test(s))return 'Private Equity';
 if(/\bvc\b|venture/i.test(s))return 'Venture Capital';
 if(/\bib\b|investment\s*bank|\bm&a\b/i.test(s))return 'Investment Banking';
 if(/consult/i.test(s))return 'Consulting';
 if(/corporate\s*finance|corp\.?\s*fin|strategy|fp&a/i.test(s))return 'Corporate Finance / Strategy';
 if(/asset\s*manage|fund\s*manage|wealth|\bam\b/i.test(s))return 'Asset Management';
 if(/fintech|payments?/i.test(s))return 'Fintech';
 if(/bank/i.test(s))return 'Banking';
 if(/\btech|software|saas|startup/i.test(s))return 'Tech';
 return 'Other';
}
/* A row's own industry wins; otherwise it inherits the linked company's. */
function industryFor(track,companies){
 const own=industryOf(track.industry);
 if(own)return own;
 const c=track.company_id&&(companies||[]).find(x=>x.id===track.company_id);
 return c?industryOf(c.industry):'';
}

const api={SOURCES,KINDS,STATUSES,VIEWS,DROP_REASONS,OUTCOMES,INDUSTRIES,STALE_DAYS,sourceLabel,kindLabel,statusLabel,normalizeUrl,registrable,companyFromHost,detectSource,parseDrop,findDuplicate,daysBetween,ageLabel,bucket,sortFor,dueOf,industryOf,industryFor};
root.SELFTracker=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;

if(!root.document)return;

/* ================= UI ================= */
let host=null,core=null;
const S={owner:null,ready:false,rows:[],events:{},view:'inbox',filters:{industry:'',source:'',kind:'',status:''},drawer:null,draft:null,closing:null,menu:null,highlight:null,busy:false,loading:false,error:'',pendingDelete:null,capture:'',staleDays:STALE_DAYS};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d=''){try{return root.localStorage?.getItem('self.tracker.'+k)??d}catch{return d}},set(k,v){try{root.localStorage?.setItem('self.tracker.'+k,v)}catch{}}};
const today=()=>new Date().toLocaleDateString('en-CA');
const companies=()=>core?.ui.companies||[];
const rowOf=id=>S.rows.find(r=>r.id===id);
const safeUrl=u=>{if(!u)return null;if(/^mailto:/i.test(u))return u;try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:null}catch{return null}};
const normName=v=>{const O=outreach();return O?O.normName(v):String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'')};
const visibleRows=()=>S.rows.filter(r=>!(S.pendingDelete&&S.pendingDelete.id===r.id));

function loadFilters(){
 try{const f=JSON.parse(store.get('filters','{}'));for(const k of Object.keys(S.filters))if(typeof f[k]==='string')S.filters[k]=f[k]}catch{}
 const v=store.get('view','inbox');if(VIEWS.includes(v))S.view=v;
 const d=+store.get('stale',String(STALE_DAYS));S.staleDays=d>=1&&d<=365?d:STALE_DAYS;
}
const saveFilters=()=>{store.set('filters',JSON.stringify(S.filters));store.set('view',S.view)};

function init(args){core=args.career;host=args.host;loadFilters()}
function reset(owner){
 flushDelete();
 Object.assign(S,{owner:owner||null,ready:false,rows:[],events:{},drawer:null,draft:null,closing:null,menu:null,highlight:null,busy:false,error:'',pendingDelete:null,capture:''});
}
async function load(owner){
 if(!owner||owner!==host?.state?.()?.user?.id)return;
 if(owner!==S.owner)reset(owner);
 const rows=await host.request('/rest/v1/career_tracks?select=*&order=last_activity_at.desc');
 if(owner!==host.state().user.id||S.owner!==owner)return;
 S.rows=Array.isArray(rows)?rows:[];S.ready=true;
}
/* Leaving the page settles a delete that is still waiting for its Undo window. */
function beforeNavigate(){flushDelete();return true}

/* ---- derived ---- */
function industryChips(){
 const used=new Set(visibleRows().map(r=>industryFor(r,companies())));
 return [...INDUSTRIES.filter(i=>used.has(i)),...(used.has('')?['']:[])];
}
function matches(r){
 const f=S.filters;
 if(f.industry!==''&&(industryFor(r,companies())||'none')!==(f.industry==='none'?'none':f.industry))return false;
 if(f.source&&r.source!==f.source)return false;
 if(f.kind&&r.kind!==f.kind)return false;
 if(f.status&&r.status!==f.status)return false;
 return true;
}
function counts(){
 const c={today:0,inbox:0,all:0,stale:0};
 for(const r of visibleRows())for(const b of bucket(r,today(),S.staleDays))c[b]++;
 return c;
}
function listRows(){return sortFor(S.view,visibleRows().filter(r=>bucket(r,today(),S.staleDays).includes(S.view)&&matches(r)),today())}

/* ---- rendering ---- */
const VIEW_LABEL={today:'Today',inbox:'Inbox',all:'All',stale:'Stale'};
function nextLine(r){
 if(r.status==='dropped')return 'Dropped'+(r.close_reason?': '+r.close_reason:'');
 if(r.status==='done')return 'Done'+(r.close_reason?': '+r.close_reason:'');
 if(r.status==='inbox'&&!r.next_step)return 'Not processed yet';
 if(r.status==='waiting'&&!r.next_step)return 'Waiting for a reply';
 const due=r.next_due?' · '+(r.next_due===today()?'today':r.next_due):'';
 return r.next_step?'Next: '+r.next_step+due:'No next step';
}
function rowHtml(r){
 const url=safeUrl(r.url),title=r.title||(r.url||'').replace(/^https?:\/\/(www\.)?/,'').slice(0,80)||'Untitled';
 const ind=industryFor(r,companies()),age=ageLabel(r.last_activity_at||r.created_at,today());
 const t=url?'<a class="tracker-title" href="'+h(url)+'" target="_blank" rel="noopener noreferrer">'+h(title)+'</a>':'<span class="tracker-title">'+h(title)+'</span>';
 const due=dueOf(r),overdue=due&&r.status!=='done'&&r.status!=='dropped'&&due<=today();
 return '<li class="tracker-row'+(S.highlight===r.id?' hl':'')+(S.menu===r.id?' open':'')+(overdue?' due':'')+'" data-row="'+h(r.id)+'" data-status="'+h(r.status)+'">'+
  '<span class="tracker-dot s-'+h(r.status)+'" title="'+h(statusLabel(r.status))+'" aria-label="'+h(statusLabel(r.status))+'"></span>'+
  '<div class="tracker-main" data-tracker="open" data-id="'+h(r.id)+'"><div class="tracker-line1">'+t+(r.company_name?'<span class="tracker-company"> · '+h(r.company_name)+'</span>':'')+'</div>'+
  '<div class="tracker-line2"><span class="tracker-badge">'+h(sourceLabel(r.source))+'</span>'+(ind?'<span class="tracker-badge ind">'+h(ind)+'</span>':'')+'<span class="tracker-next">'+h(nextLine(r))+'</span></div></div>'+
  '<span class="tracker-age" title="Last touched">'+h(age)+'</span>'+
  '<button type="button" class="career-btn tracker-more" data-tracker="menu" data-id="'+h(r.id)+'" aria-label="Actions for '+h(title)+'" aria-expanded="'+(S.menu===r.id)+'">⋯</button>'+
  (S.menu===r.id?menuHtml(r):'')+'</li>';
}
function menuHtml(r){
 const closed=r.status==='done'||r.status==='dropped';
 const item=(a,l,cls='')=>'<button type="button" role="menuitem" class="'+cls+'" data-tracker="'+a+'" data-id="'+h(r.id)+'">'+l+'</button>';
 return '<div class="tracker-menu" role="menu">'+item('open','Edit')+item('touched','Touched it')+(closed?item('reopen','Reopen'):item('close-done','Mark done…')+item('close-drop','Drop…'))+item('delete','Delete','danger')+'</div>';
}
function chip(label,key,value,active){return '<button type="button" class="tracker-chip'+(active?' on':'')+'" data-tracker="filter" data-key="'+key+'" data-value="'+h(value)+'" aria-pressed="'+active+'">'+h(label)+'</button>'}
function select(key,label,opts,cur){
 return '<label class="tracker-sel"><span class="sr-only">'+h(label)+'</span><select class="career-field" data-tracker-filter="'+key+'" aria-label="'+h(label)+'"><option value="">'+h(label)+'</option>'+opts.map(([v,l])=>'<option value="'+h(v)+'"'+(cur===v?' selected':'')+'>'+h(l)+'</option>').join('')+'</select></label>';
}
function emptyHtml(c){
 if(!S.rows.length)return '<div class="tracker-empty"><strong>Paste your first link</strong><p>A job post, a careers page, a LinkedIn profile, anything. It lands in your Inbox and you decide later.</p></div>';
 const msg={today:'Nothing due today.',inbox:'Inbox is empty.',stale:'Nothing has gone stale.',all:'Nothing matches these filters.'}[S.view];
 return '<div class="tracker-empty"><strong>'+h(msg)+'</strong></div>';
}
function render(){
 if(!S.ready&&!S.error)return '<div class="tracker"><p class="tracker-hint">Opening your Tracker…</p></div>';
 if(S.error&&!S.ready)return '<div class="tracker"><p class="outreach-need" role="alert">'+h(S.error)+'</p></div>';
 const c=counts(),rows=listRows(),chips=industryChips();
 return '<div class="tracker">'+
  '<div class="tracker-capture"><textarea id="tracker-capture" class="career-field" rows="1" data-tracker-capture placeholder="Paste a link or type a note, then press Enter…" aria-label="Paste a link or type a note">'+h(S.capture)+'</textarea>'+
  '<button type="button" class="career-btn career-primary" data-tracker="add"'+(S.busy?' disabled':'')+'>Add</button></div>'+
  '<p class="tracker-hint">Nothing is fetched from the link: SELF only reads the address. Shift+Enter for a new line.</p>'+
  '<div class="tracker-tabs" role="tablist" aria-label="Tracker views">'+VIEWS.map(v=>'<button type="button" role="tab" class="tracker-tab'+(S.view===v?' on':'')+'" data-tracker="view" data-value="'+v+'" aria-selected="'+(S.view===v)+'">'+VIEW_LABEL[v]+' <span class="tracker-count">'+c[v]+'</span></button>').join('')+
   (S.view==='stale'?'<label class="tracker-stale">older than <input class="career-field" type="number" min="1" max="365" value="'+S.staleDays+'" data-tracker-stale aria-label="Days without activity before a row is stale"> days</label>':'')+'</div>'+
  '<div class="tracker-filters"><div class="tracker-chips" role="group" aria-label="Industry">'+
   (chips.length?[chip('All industries','industry','',S.filters.industry==='')].concat(chips.map(i=>chip(i||'No industry','industry',i||'none',S.filters.industry===(i||'none')))).join(''):'')+'</div>'+
   '<div class="tracker-selects">'+select('source','Source',SOURCES.map(x=>[x[0],x[1]]),S.filters.source)+select('kind','Kind',KINDS,S.filters.kind)+select('status','Status',STATUSES,S.filters.status)+'</div></div>'+
  (S.pendingDelete?'<div class="outreach-undo" role="status"><span>Deleted “'+h(S.pendingDelete.label)+'”</span><button type="button" class="career-btn" data-tracker="undo-delete">↶ Undo</button></div>':'')+
  (rows.length?'<ul class="tracker-list" aria-label="'+VIEW_LABEL[S.view]+' rows">'+rows.map(rowHtml).join('')+'</ul>':emptyHtml(c))+
  drawerHtml()+'</div>';
}

function draftOf(r){return {url:r.url||'',title:r.title||'',company_name:r.company_name||'',industry:r.industry||'',location:r.location||'',kind:r.kind,source:r.source,status:r.status,next_step:r.next_step||'',next_due:r.next_due||'',deadline:r.deadline||'',notes:r.notes||''}}
function field(name,label,html){return '<label class="tracker-f"><span>'+h(label)+'</span>'+html+'</label>'}
function drawerHtml(){
 const r=S.drawer&&rowOf(S.drawer);if(!r)return '';
 const d=S.draft||draftOf(r),inp=(n,type='text',extra='')=>'<input class="career-field" type="'+type+'" name="'+n+'" value="'+h(d[n])+'" data-tracker-draft="'+n+'" '+extra+'>';
 const sel=(n,opts)=>'<select class="career-field" name="'+n+'" data-tracker-draft="'+n+'">'+opts.map(([v,l])=>'<option value="'+h(v)+'"'+(d[n]===v?' selected':'')+'>'+h(l)+'</option>').join('')+'</select>';
 const evs=S.events[r.id];
 const closing=S.closing&&S.closing.id===r.id?closePanel(S.closing):'';
 return '<div class="tracker-scrim" data-tracker="close-drawer"></div><aside class="tracker-drawer" role="dialog" aria-modal="true" aria-label="Edit row">'+
  '<div class="tracker-drawer-head"><strong>'+h(r.title||'Row')+'</strong><button type="button" class="career-btn" data-tracker="close-drawer" aria-label="Close">✕</button></div>'+
  closing+
  '<div class="tracker-form">'+field('url','Link',inp('url','text','placeholder="https://…"'))+field('title','Title',inp('title','text','maxlength="200"'))+
   field('company_name','Company',inp('company_name','text','maxlength="160" list="tracker-companies"')+'<datalist id="tracker-companies">'+companies().map(c=>'<option value="'+h(c.name)+'">').join('')+'</datalist>')+
   field('industry','Industry','<select class="career-field" name="industry" data-tracker-draft="industry"><option value="">(from company)</option>'+INDUSTRIES.map(i=>'<option'+(d.industry===i?' selected':'')+'>'+h(i)+'</option>').join('')+'</select>')+
   field('location','Location',inp('location','text','maxlength="160"'))+
   '<div class="tracker-f2">'+field('kind','Kind',sel('kind',KINDS))+field('source','Source',sel('source',SOURCES))+'</div>'+
   field('status','Status',sel('status',STATUSES))+
   field('next_step','Next step',inp('next_step','text','maxlength="200" placeholder="e.g. send CV"'))+
   '<div class="tracker-f2">'+field('next_due','Next step due',inp('next_due','date'))+field('deadline','Deadline',inp('deadline','date'))+'</div>'+
   field('notes','Notes','<textarea class="career-field" rows="4" name="notes" data-tracker-draft="notes">'+h(d.notes)+'</textarea>')+
  '</div>'+
  '<div class="tracker-drawer-actions"><button type="button" class="career-btn career-primary" data-tracker="save"'+(S.busy?' disabled':'')+'>Save</button>'+
   '<button type="button" class="career-btn" data-tracker="touched" data-id="'+h(r.id)+'">Touched it</button>'+
   (r.status==='done'||r.status==='dropped'?'<button type="button" class="career-btn" data-tracker="reopen" data-id="'+h(r.id)+'">Reopen</button>':'<button type="button" class="career-btn" data-tracker="close-done" data-id="'+h(r.id)+'">Mark done…</button><button type="button" class="career-btn" data-tracker="close-drop" data-id="'+h(r.id)+'">Drop…</button>')+
   '<button type="button" class="career-btn career-danger" data-tracker="delete" data-id="'+h(r.id)+'">Delete</button></div>'+
  '<section class="tracker-log" aria-label="Activity"><strong>Activity</strong>'+(evs?(evs.length?'<ul>'+evs.map(e=>'<li><time>'+h(String(e.created_at).slice(0,10))+'</time> '+h(e.summary)+'</li>').join('')+'</ul>':'<p class="tracker-hint">Nothing logged yet.</p>'):'<p class="tracker-hint">Loading…</p>')+'</section></aside>';
}
function closePanel(c){
 const drop=c.type==='drop',opts=drop?DROP_REASONS:OUTCOMES;
 return '<div class="tracker-close" role="group" aria-label="'+(drop?'Drop reason':'Outcome')+'"><strong>'+(drop?'Why drop it?':'What was the outcome?')+'</strong><div class="tracker-chips">'+
  opts.map(o=>'<button type="button" class="tracker-chip" data-tracker="close-pick" data-value="'+h(o)+'">'+h(o)+'</button>').join('')+'</div>'+
  '<div class="tracker-capture"><input class="career-field" data-tracker-close-text placeholder="'+(drop?'Or write your own reason':'Or write the outcome')+'" maxlength="200" aria-label="Custom reason"><button type="button" class="career-btn career-primary" data-tracker="close-text">'+(drop?'Drop':'Mark done')+'</button></div>'+
  '<button type="button" class="career-btn" data-tracker="close-cancel">Cancel</button></div>';
}

/* ---- data actions ---- */
const nowIso=()=>new Date().toISOString();
/* Every change goes through here: PATCH the row (bumping last_activity_at), then log one event. A failed log does not undo the change. */
async function save(id,patch,kind,summary){
 const r=rowOf(id);if(!r)return false;
 const body={...patch,last_activity_at:nowIso()};
 const updated=await host.patch('career_tracks',id,body);
 Object.assign(r,updated&&updated.id?updated:body);
 try{
  const ev=await host.insert('career_track_events',{track_id:id,kind,summary:String(summary).slice(0,300)});
  if(S.events[id])S.events[id].unshift(ev&&ev.id?ev:{kind,summary,created_at:nowIso()});
 }catch(err){host.notify('Saved, but the log entry failed: '+(err?.message||err),true)}
 return true;
}
function matchCompany(guess,url){
 const key=normName(guess);
 const host0=(()=>{try{return registrable(new URL(url).hostname)}catch{return ''}})();
 return companies().find(c=>(key&&normName(c.name)===key)||(host0&&c.website&&(()=>{try{return registrable(new URL(c.website).hostname)===host0}catch{return false}})()))||null;
}
async function add(){
 const text=S.capture;if(!text.trim()||S.busy)return;
 const items=parseDrop(text);if(!items.length)return;
 S.busy=true;host.render();
 const fresh=[],dupes=[];
 for(const it of items){
  const d=it.url&&findDuplicate(it.url,S.rows);
  if(d)dupes.push(d);else fresh.push(it);
 }
 const results=await Promise.allSettled(fresh.map(async it=>{
  const co=it.url?matchCompany(it.companyGuess,it.url):null;
  const row=await host.insert('career_tracks',{url:it.url,kind:it.kind,source:it.source,title:(it.title||'').slice(0,200),company_name:co?co.name:(it.companyGuess||'').slice(0,160),company_id:co?co.id:null,industry:'',status:'inbox'});
  try{await host.insert('career_track_events',{track_id:row.id,kind:'created',summary:it.url?'Added to Inbox from '+sourceLabel(it.source):'Note added to Inbox'})}catch{}
  return row;
 }));
 const ok=results.filter(r=>r.status==='fulfilled'),bad=results.filter(r=>r.status==='rejected');
 for(const r of ok.reverse())S.rows.unshift(r.value);
 S.busy=false;
 if(ok.length||(!bad.length&&dupes.length))S.capture='';
 let msg=ok.length?ok.length+' added to Inbox':'';
 if(dupes.length){
  const d=dupes[0];S.filters={industry:'',source:'',kind:'',status:''};S.view=bucket(d,today(),S.staleDays).includes('inbox')&&!ok.length?'inbox':S.view;
  if(!bucket(d,today(),S.staleDays).includes(S.view))S.view='all';
  S.highlight=d.id;saveFilters();
  msg+=(msg?' · ':'')+'Already tracked · last touched '+ageLabel(d.last_activity_at||d.created_at,today())+' · '+statusLabel(d.status);
 }
 if(bad.length)msg+=(msg?' · ':'')+bad.length+' failed: '+(bad[0].reason?.message||'error');
 host.notify(msg,!!bad.length&&!ok.length);
 host.render();
 if(S.highlight)Promise.resolve().then(()=>document.querySelector('.tracker-row.hl')?.scrollIntoView?.({block:'center'}));
}
async function guarded(fn){
 if(S.busy)return;S.busy=true;
 try{await fn()}catch(err){host.notify('Not saved: '+(err?.message||err),true)}
 finally{S.busy=false;host.render()}
}
function summarise(r,d){
 const parts=[],ch=k=>(d[k]||'')!==(r[k]||'');
 const out={};
 if(ch('status'))out.status='Status '+statusLabel(r.status)+' → '+statusLabel(d.status);
 if(ch('next_step')||ch('next_due'))out.next='Next step: '+(d.next_step||'cleared')+(d.next_due?' ('+d.next_due+')':'');
 if(ch('notes'))out.note='Notes updated';
 const other=['url','title','company_name','industry','location','kind','source','deadline'].filter(ch);
 if(other.length)out.edit='Edited: '+other.map(k=>k.replace('_',' ')).join(', ');
 return out;
}
async function saveDrawer(){
 const r=rowOf(S.drawer);if(!r)return;
 const d={...draftOf(r),...(S.draft||{})};
 let url=null;
 if(d.url.trim()){url=normalizeUrl(d.url);if(!url){host.notify('That link is not valid. Use http(s):// or mailto:',true);return}}
 if(!url&&!d.title.trim()){host.notify('Add a link or a title.',true);return}
 if(url&&url!==(r.url||'')){const dup=findDuplicate(url,S.rows.filter(x=>x.id!==r.id));if(dup){host.notify('That link is already tracked.',true);return}}
 d.url=url||'';
 if(r.status==='inbox'&&d.status==='inbox'&&d.next_step.trim())d.status='active';
 const co=d.company_name.trim()?companies().find(c=>normName(c.name)===normName(d.company_name)):null;
 const patch={url:url,title:d.title.trim(),company_name:d.company_name.trim(),company_id:co?co.id:null,industry:d.industry,location:d.location.trim(),kind:d.kind,source:d.source,status:d.status,next_step:d.next_step.trim(),next_due:d.next_due||null,deadline:d.deadline||null,notes:d.notes};
 const sums=summarise(r,{...d,url:url||''});
 const keys=Object.keys(sums);
 if(!keys.length){S.drawer=null;S.draft=null;host.render();return}
 await guarded(async()=>{
  const first=keys[0];
  await save(r.id,patch,first,sums[first]);
  for(const k of keys.slice(1)){
   try{const ev=await host.insert('career_track_events',{track_id:r.id,kind:k,summary:sums[k]});if(S.events[r.id])S.events[r.id].unshift(ev)}catch{}
  }
  S.drawer=null;S.draft=null;host.notify('Saved');
 });
}
async function closeRow(id,type,reason){
 await guarded(async()=>{
  const drop=type==='drop',txt=String(reason||'').trim().slice(0,200);
  await save(id,{status:drop?'dropped':'done',close_reason:txt,next_step:'',next_due:null},'status',(drop?'Dropped':'Done')+(txt?': '+txt:''));
  S.closing=null;S.drawer=null;S.draft=null;S.menu=null;
 });
}
async function openDrawer(id,closing){
 if(!rowOf(id))return;
 S.drawer=id;S.draft=null;S.menu=null;S.closing=closing?{id,type:closing}:null;host.render();
 if(!S.events[id]){
  try{const evs=await host.request('/rest/v1/career_track_events?select=*&track_id=eq.'+encodeURIComponent(id)+'&order=created_at.desc');S.events[id]=Array.isArray(evs)?evs:[]}
  catch{S.events[id]=[]}
  if(S.drawer===id)host.render();
 }
}
/* Delete waits 10 seconds for Undo; the DELETE request is only sent when that window ends or the page is left. */
function flushDelete(){
 const p=S.pendingDelete;if(!p)return;
 clearTimeout(p.timer);S.pendingDelete=null;
 S.rows=S.rows.filter(r=>r.id!==p.id);
 Promise.resolve().then(()=>host?.del('career_tracks',p.id)).catch(err=>host?.notify('Delete failed: '+(err?.message||err),true));
}
function startDelete(id){
 const r=rowOf(id);if(!r)return;
 flushDelete();
 S.menu=null;S.drawer=null;S.draft=null;S.closing=null;
 const label=(r.title||r.url||'row').slice(0,60);
 S.pendingDelete={id,label,timer:setTimeout(()=>{flushDelete();host.render()},10000)};
 host.render();
}
function undoDelete(){
 const p=S.pendingDelete;if(!p)return;
 clearTimeout(p.timer);S.pendingDelete=null;host.render();
}

/* ---- events ---- */
async function action(e){
 const b=e.target.closest?.('[data-tracker]');
 if(!b)return false;
 const a=b.dataset.tracker,id=b.dataset.id;
 if(a==='open'&&e.target.closest('a'))return false;
 e.preventDefault();e.stopPropagation();
 if(a==='add')await add();
 else if(a==='view'){S.view=b.dataset.value;S.highlight=null;S.menu=null;saveFilters();host.render()}
 else if(a==='filter'){const k=b.dataset.key,v=b.dataset.value;S.filters[k]=S.filters[k]===v?'':v;saveFilters();host.render()}
 else if(a==='menu'){S.menu=S.menu===id?null:id;host.render()}
 else if(a==='open')await openDrawer(id);
 else if(a==='close-drawer'){S.drawer=null;S.draft=null;S.closing=null;host.render()}
 else if(a==='save')await saveDrawer();
 else if(a==='touched'){await guarded(async()=>{await save(id,{},'touched','Checked, still open');S.menu=null;host.notify('Logged')})}
 else if(a==='reopen'){await guarded(async()=>{await save(id,{status:'active',close_reason:''},'status','Reopened');S.menu=null})}
 else if(a==='close-done')await openDrawer(id,'done');
 else if(a==='close-drop')await openDrawer(id,'drop');
 else if(a==='close-pick'&&S.closing)await closeRow(S.closing.id,S.closing.type,b.dataset.value);
 else if(a==='close-text'&&S.closing){const t=document.querySelector('[data-tracker-close-text]')?.value||'';await closeRow(S.closing.id,S.closing.type,t)}
 else if(a==='close-cancel'){S.closing=null;host.render()}
 else if(a==='delete')startDelete(id);
 else if(a==='undo-delete')undoDelete();
 return true;
}
function input(e){
 const t=e.target;if(!t?.matches)return false;
 if(t.matches('[data-tracker-capture]')){S.capture=t.value;return true}
 if(t.matches('[data-tracker-draft]')){const r=rowOf(S.drawer);if(r){S.draft={...(S.draft||draftOf(r)),[t.dataset.trackerDraft]:t.value}}return true}
 if(t.matches('[data-tracker-stale]')){const n=Math.max(1,Math.min(365,+t.value||STALE_DAYS));S.staleDays=n;store.set('stale',String(n));return true}
 return false;
}
function change(e){
 const t=e.target;if(!t?.matches)return false;
 if(t.matches('[data-tracker-filter]')){S.filters[t.dataset.trackerFilter]=t.value;saveFilters();host.render();return true}
 if(t.matches('[data-tracker-stale]')){host.render();return true}
 if(t.matches('[data-tracker-draft]')){input(e);return true}
 return false;
}
function keydown(e){
 const t=e.target;
 if(t?.matches?.('[data-tracker-capture]')&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();S.capture=t.value;void add();return true}
 if(e.key==='Escape'){
  if(S.closing){S.closing=null;host.render();return true}
  if(S.drawer){S.drawer=null;S.draft=null;host.render();return true}
  if(S.menu){S.menu=null;host.render();return true}
 }
 return false;
}
root.document.addEventListener('click',e=>{if(S.menu&&!e.target.closest?.('.tracker-menu,.tracker-more')){S.menu=null;host?.render?.()}},true);

root.SELFTrackerUI={init,reset,load,render,action,input,change,keydown,beforeNavigate,flushDelete,state:S};
})(typeof window!=='undefined'?window:globalThis);
