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
})(typeof window!=='undefined'?window:globalThis);
