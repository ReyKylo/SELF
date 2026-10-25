/* SELF Hunt › Outreach: one people board per company (Found → Connect sent → Connected → Approached → Talking, plus a No reply tray).
   Pure helpers are exported for tests. The UI reuses the Career records and the existing save paths (host.insert / patch / del); it never
   fetches LinkedIn and never sends anything. Spec: docs/design/HUNT_OUTREACH_PLAN.md */
(function(root){
'use strict';
const STAGES=[['new','Found'],['connect_sent','Connect sent'],['connected','Connected'],['reached_out','Approached'],['in_conversation','Talking']];
const NO_REPLY='no_reply';
const ALL_STAGES=[...STAGES.map(s=>s[0]),'maintain',NO_REPLY];
const stageLabel=v=>v==='maintain'?'Ally':v===NO_REPLY?'No reply':(STAGES.find(s=>s[0]===v)||[v,v])[1];
const SENT_PREFIX='LinkedIn connection request sent';

/* ---------- LinkedIn links ---------- */
const slugOf=u=>{
 const m=/linkedin\.com\/in\/([^\/?#\s]+)/i.exec(String(u||''));if(!m)return null;
 let s=m[1].replace(/[.,;:!)\]]+$/,'');
 try{s=decodeURIComponent(s)}catch{return null}
 s=s.toLowerCase();
 return /^[\p{L}\p{N}_%-]{2,100}$/u.test(s)?s:null;
};
const profileUrl=slug=>'https://www.linkedin.com/in/'+encodeURIComponent(slug)+'/';
/* budi-santoso-8a1b2c3 → "Budi Santoso". A guess from the link, never presented as fact. */
function nameFromSlug(slug){
 const parts=String(slug||'').split('-').filter(Boolean);
 while(parts.length>1&&/\d/.test(parts[parts.length-1]))parts.pop();
 const words=parts.filter(w=>!/^\d+$/.test(w)).map(w=>w.charAt(0).toUpperCase()+w.slice(1));
 return words.join(' ');
}
function extractLinkedIn(text){
 const profiles=[],skipped=[],seen=new Set();
 const found=String(text||'').match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com\/[^\s<>"')\]]+/gi)||[];
 for(const raw of found){
  const slug=slugOf(raw);
  if(!slug){skipped.push(raw);continue}
  if(seen.has(slug))continue;seen.add(slug);
  profiles.push({slug,url:profileUrl(slug),name:nameFromSlug(slug)||slug});
 }
 return {profiles,skipped};
}
/* Marks each parsed profile with the person that already owns the link (any company), so nothing is silently duplicated. */
function dedupeAgainst(profiles,people){
 const owners=new Map();
 for(const p of people||[]){const s=slugOf(p.profile_url);if(s)owners.set(s,p)}
 return profiles.map(x=>({...x,existing:owners.get(x.slug)||null}));
}

/* ---------- roles, dates, nudges ---------- */
const SENIOR=/\b(vp|vice president|director|partner|principal|head|managing|md|cio|ceo|coo|cfo|founder|president|chief)\b/i;
const PEER=/\b(analyst|associate|intern|fellow|junior|consultant|trainee)\b/i;
/* A guess from the title only; the UI labels it as a guess. */
const roleGroup=t=>SENIOR.test(t||'')?'Senior':PEER.test(t||'')?'Peer':'Other';
const day10=s=>String(s||'').slice(0,10);
function daysBetween(a,b){
 const p=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(day10(s));return m?Date.UTC(+m[1],+m[2]-1,+m[3]):NaN};
 return Math.round((p(b)-p(a))/864e5);
}
/* Latest known contact date for a person: newest of last_contacted_at and touchpoints, else when the record last changed. */
function lastTouch(person,touchpoints){
 const dates=[person.last_contacted_at,...(touchpoints||[]).filter(t=>t.person_id===person.id).map(t=>t.contact_at)].filter(Boolean).map(day10);
 return dates.sort().pop()||day10(person.updated_at)||null;
}
/* Rules (spec §2.5). None of these send anything. */
function nudge(person,touchpoints,today){
 const st=person.relationship_stage,last=lastTouch(person,touchpoints);
 if(!last||!today)return null;
 const n=daysBetween(last,today);if(!Number.isFinite(n))return null;
 if(st==='connect_sent'&&n>=14)return {code:'stale-pending',text:'Pending '+n+'d: wait or withdraw'};
 if(st==='connected'&&n>=2)return {code:'approach',text:'Approach now (connected '+n+'d)'};
 if(st==='reached_out'&&n>=21)return {code:'let-go',text:'No reply '+n+'d: let go?'};
 if(st==='reached_out'&&n>=7)return {code:'follow-up',text:'Follow up once ('+n+'d)'};
 if(st==='in_conversation'&&n>=21)return {code:'warm',text:'Keep warm ('+n+'d)'};
 return null;
}
const sentThisWeek=(touchpoints,today)=>(touchpoints||[]).filter(t=>String(t.summary||'').startsWith(SENT_PREFIX)&&daysBetween(t.contact_at,today)<7&&daysBetween(t.contact_at,today)>=0).length;

/* ---------- companies: CSV import ---------- */
function parseCsv(text){
 const rows=[];let row=[],cell='',q=false;const s=String(text||'').replace(/^﻿/,'');
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(q){if(c==='"'){if(s[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
  else if(c==='"')q=true;
  else if(c===','){row.push(cell);cell=''}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}
  else cell+=c;
 }
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 return rows;
}
const normName=n=>String(n||'').toLowerCase().replace(/\b(pt|tbk|persero|ltd|llc|inc|co|company|group|holdings?)\b/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,'').toLowerCase()}catch{return ''}};
const cleanHttp=u=>{const t=String(u||'').trim();if(!t)return null;try{const x=new URL(/^https?:\/\//i.test(t)?t:'https://'+t);return ['http:','https:'].includes(x.protocol)&&x.hostname.includes('.')?x.href:null}catch{return null}};
/* Header row required: name (or company / company_name), optional industry, website, location, notes. */
function parseCompaniesCsv(text,existing){
 const table=parseCsv(text);if(!table.length)return {rows:[],error:'Paste a CSV with a header row.'};
 const head=table[0].map(h=>h.trim().toLowerCase().replace(/\s+/g,'_'));
 const idx=k=>head.indexOf(k);
 const nameCol=['name','company','company_name'].map(idx).find(i=>i>=0);
 if(nameCol==null||nameCol<0)return {rows:[],error:'The header needs a "name" column.'};
 const col=k=>idx(k);
 const have=new Map();
 for(const c of existing||[]){have.set(normName(c.name),c);const h=hostOf(c.website);if(h)have.set('host:'+h,c)}
 const rows=[],seen=new Set();
 for(const r of table.slice(1)){
  const name=(r[nameCol]||'').trim().slice(0,160);if(!name)continue;
  const website=cleanHttp(col('website')>=0?r[col('website')]:'');
  const key=normName(name),hk=website?'host:'+hostOf(website):null;
  const dup=have.get(key)||(hk&&have.get(hk))||null;
  const inFile=seen.has(key)||(hk&&seen.has(hk));
  seen.add(key);if(hk)seen.add(hk);
  rows.push({name,industry:(col('industry')>=0?r[col('industry')]:'').trim().slice(0,120),website,location:(col('location')>=0?r[col('location')]:'').trim().slice(0,160),notes:(col('notes')>=0?r[col('notes')]:'').trim(),duplicateOf:dup,repeated:!!inFile});
 }
 return {rows,error:''};
}

/* ---------- messages ---------- */
const mergeFields=(text,vars)=>String(text||'').replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]?vars[k]:m);
const unfilled=text=>[...new Set((String(text||'').match(/\{\w+\}/g)||[]))];
const TEMPLATES=[
 {id:'conn-id',label:'Connection note (ID)',stage:'connect_sent',body:'Halo {first_name}, saya {my_name}. Saya mengikuti pekerjaan tim {company} dan tertarik dengan peran {role}. Senang bisa terhubung.'},
 {id:'conn-en',label:'Connection note (EN)',stage:'connect_sent',body:'Hi {first_name}, I\'m {my_name}. I\'ve been following the work at {company} and your path into {role} stood out to me. I\'d be glad to connect.'},
 {id:'appr-id',label:'Approach (ID)',stage:'reached_out',body:'Halo {first_name}, terima kasih sudah terhubung. Saya {my_name}, sedang mempelajari bidang ini dan ingin memahami pengalaman Anda di {company}. Apakah Anda bersedia 15 menit minggu ini? Saya fleksibel menyesuaikan jadwal.'},
 {id:'appr-en',label:'Approach (EN)',stage:'reached_out',body:'Hi {first_name}, thanks for connecting. I\'m {my_name}, learning about this field, and I\'d value 15 minutes to hear how you found your way at {company}. Happy to work around your schedule this week.'},
 {id:'fu-id',label:'Follow up (ID)',stage:null,body:'Halo {first_name}, saya menyusul pesan sebelumnya. Jika minggu ini terlalu sibuk, tidak masalah sama sekali. Terima kasih atas waktunya.'},
 {id:'fu-en',label:'Follow up (EN)',stage:null,body:'Hi {first_name}, a quick follow-up on my earlier note. If this week is too busy, no problem at all. Thank you for your time.'},
 {id:'ty-id',label:'Thank you (ID)',stage:null,body:'Terima kasih banyak {first_name} atas waktunya. Saya akan menindaklanjuti saran Anda dan mengabari hasilnya.'},
 {id:'ty-en',label:'Thank you (EN)',stage:null,body:'Thank you {first_name} for your time. I\'ll act on your advice and let you know how it goes.'}
];
const firstName=n=>String(n||'').trim().split(/\s+/)[0]||'';
const linkedInSearch=(company,keyword)=>'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent('"'+company+'" '+keyword);
const initials=n=>String(n||'?').trim().split(/\s+/).map(w=>w.charAt(0)).slice(0,2).join('').toUpperCase()||'?';

const api={STAGES,NO_REPLY,ALL_STAGES,stageLabel,SENT_PREFIX,slugOf,profileUrl,nameFromSlug,extractLinkedIn,dedupeAgainst,roleGroup,daysBetween,lastTouch,nudge,sentThisWeek,parseCsv,parseCompaniesCsv,normName,mergeFields,unfilled,TEMPLATES,firstName,linkedInSearch,initials};
root.SELFOutreach=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI ================= */
let host=null,core=null;
const S={company:null,filter:'',paste:'',preview:null,csv:'',csvPreview:null,menu:null,composer:null,csvOpen:false,pasteOpen:false,trayOpen:false,busy:false,undo:null,focus:null};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d=''){try{return root.localStorage?.getItem('self.outreach.'+k)??d}catch{return d}},set(k,v){try{root.localStorage?.setItem('self.outreach.'+k,v)}catch{}}};
const today=()=>new Date().toLocaleDateString('en-CA');
const people=()=>core?.ui.people||[];
const companies=()=>core?.ui.companies||[];
const touchpoints=()=>root.SELFCareerPhase2?.ui?.touchpoints||[];
const personOf=id=>people().find(p=>p.id===id);
const companyOf=id=>companies().find(c=>c.id===id);
const safeHttp=u=>{try{const x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:null}catch{return null}};
const pending=()=>S.busy;

function init(args){
 core=args.career;host=args.host;
 root.SELFDnd?.register('outreach',{
  accepts:el=>el.dataset.dndType==='person',
  landingIndex:()=>0, /* a moved person is saved with a fresh updated_at, so the list shows it first */
  commit:(id,from,to)=>move(id,to),
  label:stageLabel
 });
}

/* ---- records per company ---- */
function boardFor(id){
 const list=people().filter(p=>id==='none'?!p.company_id:p.company_id===id);
 const by={};for(const [k] of STAGES)by[k]=[];by[NO_REPLY]=[];
 for(const p of list){
  const k=p.relationship_stage==='maintain'?'in_conversation':p.relationship_stage;
  (by[k]||by.new).push(p);
 }
 return {list,by};
}
function summaryFor(id){
 const {list,by}=boardFor(id),t=today();
 const counts=STAGES.map(([k])=>by[k].length);
 const need=list.filter(p=>p.relationship_stage!==NO_REPLY&&nudge(p,touchpoints(),t)).length;
 return {total:list.length,counts,need,noReply:by[NO_REPLY].length};
}

/* ---- rendering ---- */
function funnel(counts){
 const colors=['--faint','--yellow','--green','--tint','--purple'];
 return '<span class="outreach-funnel" aria-hidden="true">'+counts.map((n,i)=>'<i style="'+(n?'background:var('+colors[i]+');opacity:'+Math.min(1,.45+n*.2):'')+'"></i>').join('')+'</span>';
}
function overview(){
 const rows=companies().map(c=>({c,s:summaryFor(c.id)}));
 const loose=summaryFor('none');
 const q=S.filter.trim().toLowerCase();
 const match=r=>!q||r.c.name.toLowerCase().includes(q);
 const withPeople=rows.filter(r=>r.s.total&&match(r)).sort((a,b)=>b.s.need-a.s.need||b.s.total-a.s.total||a.c.name.localeCompare(b.c.name));
 const without=rows.filter(r=>!r.s.total&&match(r)).sort((a,b)=>a.c.name.localeCompare(b.c.name));
 const cap=+store.get('cap','20')||20,sent=sentThisWeek(touchpoints(),today());
 const row=(r,quiet)=>'<button type="button" class="outreach-row" data-outreach="open-company" data-id="'+h(r.c.id)+'">'+
  '<span><strong>'+h(r.c.name)+'</strong><small>'+h([r.c.industry,r.c.location].filter(Boolean).join(' · ')||'Company')+'</small></span>'+
  (quiet?'<span class="outreach-hint">Paste links</span>':funnel(r.s.counts)+'<span class="outreach-counts">'+r.s.counts.map((n,i)=>n?STAGES[i][1]+' '+n:'').filter(Boolean).join(' · ')+'</span><span class="outreach-need'+(r.s.need?'':' none')+'">'+(r.s.need?'● '+r.s.need+' need you':'All good')+'</span>')+'</button>';
 return '<div class="outreach">'+
  '<div class="career2-title"><div><h2>Outreach</h2><p>One board per company. Find people yourself, paste their LinkedIn links, then move them: Connect sent → Connected → Approached → Talking.</p></div>'+
  '<div class="outreach-actions"><button type="button" class="career-btn" data-outreach="csv">Import companies</button><button type="button" class="career-btn career-primary" data-career="new" data-kind="company">+ Company</button></div></div>'+
  '<div class="outreach-pace" role="group" aria-label="Weekly pace"><span><b>'+sent+'</b> connection requests sent this week</span><label>your weekly cap <input class="career-field outreach-cap" type="number" min="1" max="200" value="'+cap+'" data-outreach-cap aria-label="Weekly connection request cap"></label>'+
   (sent>=cap?'<span class="outreach-need">● At your cap: slow down, quality over volume</span>':'')+'</div>'+
  '<div class="outreach-toolbar"><input class="career-field" type="search" placeholder="Filter companies…" value="'+h(S.filter)+'" data-outreach-filter aria-label="Filter companies"></div>'+
  (loose.total?'<button type="button" class="outreach-row" data-outreach="open-company" data-id="none"><span><strong>No company yet</strong><small>People without a company</small></span>'+funnel(loose.counts)+'<span class="outreach-counts">'+loose.total+' people</span><span class="outreach-need'+(loose.need?'':' none')+'">'+(loose.need?'● '+loose.need+' need you':'All good')+'</span></button>':'')+
  (withPeople.length?'<div class="outreach-list" role="list">'+withPeople.map(r=>row(r,false)).join('')+'</div>':
   (q?'':'<div class="career2-empty"><strong>No people yet</strong><p>Open a company below, use “Find people on LinkedIn”, then paste the links you choose.</p></div>'))+
  (without.length?'<details class="outreach-more-list"'+(q||!withPeople.length?' open':'')+'><summary>'+without.length+' compan'+(without.length===1?'y':'ies')+' with no people yet</summary><div class="outreach-list">'+without.map(r=>row(r,true)).join('')+'</div></details>':'')+
  (!rows.length?'<div class="career2-empty"><strong>Build your target list</strong><p>Add a company or import a CSV, then find people there.</p></div>':'')+
  csvModal()+'</div>';
}
function card(p){
 const t=today(),ng=p.relationship_stage===NO_REPLY?null:nudge(p,touchpoints(),t),url=safeHttp(p.profile_url);
 const group=roleGroup(p.role_title);
 const last=lastTouch(p,touchpoints());
 const age=last&&p.relationship_stage!=='new'?daysBetween(last,t):null;
 const body='<span class="outreach-av" aria-hidden="true">'+h(initials(p.full_name))+'</span><span class="outreach-body"><strong>'+h(p.full_name)+'</strong><small>'+h(p.role_title||'Role not set')+'</small>'+
  '<span class="outreach-tags">'+(p.role_title?'<span class="outreach-tag" title="Guessed from the title">'+group+'</span>':'')+
  (url?'<span class="outreach-tag li">in ↗</span>':'<span class="outreach-tag warn">Add link</span>')+
  (p.relationship_stage==='maintain'?'<span class="outreach-tag">Ally</span>':'')+
  (age!=null&&age>=0?'<span class="outreach-tag">'+age+'d</span>':'')+
  (ng?'<span class="outreach-tag nudge">● '+h(ng.text)+'</span>':'')+'</span></span>';
 const open=url?'<a class="outreach-link" data-dnd-link href="'+h(url)+'" target="_blank" rel="noopener noreferrer" draggable="false" tabindex="-1" aria-label="Open LinkedIn profile of '+h(p.full_name)+' in a new tab">'+body+'</a>'
  :'<button type="button" class="outreach-link" data-outreach="add-link" data-id="'+h(p.id)+'" tabindex="-1" aria-label="Add LinkedIn link for '+h(p.full_name)+'">'+body+'</button>';
 return '<article class="outreach-card" data-dnd-item="'+h(p.id)+'" data-dnd-type="person" data-url="'+h(url||'')+'" tabindex="0" role="group" aria-roledescription="Draggable person" aria-describedby="dnd-help" aria-label="'+h(p.full_name)+', '+h(p.role_title||'role not set')+', '+stageLabel(p.relationship_stage)+'">'+open+
  '<button type="button" class="outreach-more" data-outreach="menu" data-id="'+h(p.id)+'" aria-haspopup="menu" aria-expanded="'+(S.menu===p.id)+'" aria-label="More for '+h(p.full_name)+'">⋯</button>'+
  (S.menu===p.id?menuMarkup(p):'')+'</article>';
}
function menuMarkup(p){
 const nr=p.relationship_stage===NO_REPLY;
 return '<div class="outreach-menu" role="menu">'+
  '<button type="button" role="menuitem" data-outreach="details" data-id="'+h(p.id)+'">Details &amp; notes</button>'+
  '<button type="button" role="menuitem" data-outreach="compose" data-id="'+h(p.id)+'">Write message</button>'+
  '<button type="button" role="menuitem" data-outreach="add-link" data-id="'+h(p.id)+'">'+(safeHttp(p.profile_url)?'Edit LinkedIn link':'Add LinkedIn link')+'</button>'+
  (nr?'<button type="button" role="menuitem" data-outreach="revive" data-id="'+h(p.id)+'">Bring back to Found</button>':'<button type="button" role="menuitem" data-outreach="let-go" data-id="'+h(p.id)+'">Let go (No reply)</button>')+'</div>';
}
function board(){
 const id=S.company,c=id==='none'?null:companyOf(id);
 if(id!=='none'&&!c){S.company=null;return overview()}
 const {list,by}=boardFor(id),name=c?c.name:'No company yet',t=today();
 const peer=list.filter(p=>roleGroup(p.role_title)==='Peer').length,senior=list.filter(p=>roleGroup(p.role_title)==='Senior').length;
 const campus=store.get('campus','');
 const finders=c?[['Analyst','analyst'],['Associate','associate'],['VP / Director','director']].concat(campus?[['Alumni · '+campus,campus]]:[]):[];
 const site=c&&safeHttp(c.website);
 return '<div class="outreach">'+
  '<div class="outreach-head"><button type="button" class="career-btn" data-outreach="back">← Outreach</button><div class="outreach-title"><h2>'+h(name)+'</h2><p>'+h(c?[c.industry,c.location].filter(Boolean).join(' · '):'People you have not linked to a company')+
  (site?' · <a href="'+h(site)+'" target="_blank" rel="noopener noreferrer">website ↗</a>':'')+'</p></div>'+
  '<div class="outreach-actions">'+(c&&root.SELFBoards?.createFromRecipe?'<button type="button" class="career-btn" data-outreach="map" title="Create a Studio board from the Company Map recipe, with these people">Company map</button>':'')+'<button type="button" class="career-btn career-primary" data-outreach="paste-toggle" aria-expanded="'+S.pasteOpen+'">Paste links</button></div></div>'+
  (c?'<div class="outreach-find" aria-label="Find people on LinkedIn"><span>Find people on LinkedIn:</span>'+finders.map(([l,k])=>'<a class="career-btn" href="'+h(linkedInSearch(c.name,k))+'" target="_blank" rel="noopener noreferrer">'+h(l)+' ↗</a>').join('')+
   '<label class="outreach-campus">your campus <input class="career-field" data-outreach-campus value="'+h(campus)+'" placeholder="e.g. UI" aria-label="Your campus for alumni search"></label>'+
   '<span class="outreach-cover" title="Role group is guessed from titles">'+peer+' peer · '+senior+' senior · aim for 3 to 5 people per firm</span></div>':'')+
  (S.pasteOpen?pastePanel():'')+
  (S.undo?'<div class="outreach-undo" role="status"><span>'+h(S.undo.text)+'</span><button type="button" class="career-btn" data-outreach="undo">↶ Undo</button></div>':'')+
  '<div class="outreach-board" data-dnd-scroll>'+STAGES.map(([k,label])=>{
   const rows=by[k];
   return '<section class="outreach-lane" data-stage="'+k+'" data-dnd-zone="outreach:'+k+'" aria-label="'+h(label)+'"><div class="outreach-lane-head"><strong>'+h(label)+'</strong><span data-count-for="outreach:'+k+'">'+rows.length+'</span></div>'+
    '<div class="outreach-lane-list" data-dnd-list>'+rows.map(card).join('')+'</div>'+
    (rows.length?'':'<p class="outreach-empty">'+(k==='new'?'Paste LinkedIn links to add people':'Drag a person here')+'</p>')+'</section>';
  }).join('')+'</div>'+
  '<section class="outreach-tray" data-dnd-zone="outreach:no_reply" aria-label="No reply"><button type="button" class="outreach-tray-toggle" data-outreach="tray" aria-expanded="'+S.trayOpen+'"><b data-count-for="outreach:no_reply">'+by[NO_REPLY].length+'</b> No reply <span>· drop someone here to let go; they can come back any time</span></button>'+
   '<div class="outreach-tray-list" data-dnd-list'+(S.trayOpen?'':' hidden')+'>'+by[NO_REPLY].map(p=>'<span class="outreach-chip" data-dnd-item="'+h(p.id)+'" data-dnd-type="person"><span>'+h(p.full_name)+'</span><button type="button" data-outreach="revive" data-id="'+h(p.id)+'" aria-label="Bring '+h(p.full_name)+' back to Found">↺</button></span>').join('')+'</div></section>'+
  '<p id="dnd-help" class="sr-only">Press Space to pick up. Use the arrow keys to move between stages. Press Space to drop or Escape to cancel. Press Enter to open LinkedIn.</p><div id="dnd-live" class="sr-only" aria-live="assertive"></div>'+
  composerModal()+'</div>';
}
function pastePanel(){
 const pv=S.preview;
 return '<div class="outreach-paste"><div><label for="outreach-paste-in">Paste LinkedIn links (any text, any number)</label><textarea id="outreach-paste-in" class="career-field" rows="6" data-outreach-paste placeholder="https://www.linkedin.com/in/…">'+h(S.paste)+'</textarea>'+
  '<div class="outreach-actions"><button type="button" class="career-btn" data-outreach="preview">Preview</button><button type="button" class="career-btn career-primary" data-outreach="add-paste"'+(pv&&pv.fresh.length?'':' disabled')+'>'+(pv&&pv.fresh.length?'Add '+pv.fresh.length+' to Found':'Add to Found')+'</button></div></div>'+
  '<div><span class="outreach-eyebrow">Preview</span>'+(pv?'<ul class="outreach-prev">'+
   pv.fresh.map(x=>'<li><span><strong>'+h(x.name)+'</strong> <em>name from link, check it</em></span><code>/in/'+h(x.slug)+'</code></li>').join('')+
   pv.dupes.map(x=>'<li class="dup">Already in '+h(x.existing.company_id?(companyOf(x.existing.company_id)?.name||'another company'):'No company')+' · '+h(stageLabel(x.existing.relationship_stage))+': '+h(x.existing.full_name)+'</li>').join('')+
   pv.skipped.map(x=>'<li class="dup">Skipped: not a person profile <code>'+h(x.slice(0,48))+'</code></li>').join('')+
   (!pv.fresh.length&&!pv.dupes.length&&!pv.skipped.length?'<li class="dup">No LinkedIn links found</li>':'')+'</ul>':'<p class="outreach-hint">Press Preview.</p>')+
  '<p class="outreach-hint">SELF never opens or reads LinkedIn. It stores only the links you paste.</p></div></div>';
}
function csvModal(){
 if(!S.csvOpen)return '';
 const pv=S.csvPreview,fresh=pv?pv.rows.filter(r=>!r.duplicateOf&&!r.repeated):[];
 return '<div class="outreach-modal-layer"><div class="outreach-modal" role="dialog" aria-modal="true" aria-labelledby="outreach-csv-h"><div class="outreach-modal-head"><h3 id="outreach-csv-h">Import companies</h3><button type="button" class="career-btn" data-outreach="csv-close" aria-label="Close">✕</button></div>'+
  '<p class="outreach-hint">Header row with <code>name</code> and optional <code>industry,website,location,notes</code>. Duplicates (same name or website) are skipped.</p>'+
  '<input type="file" accept=".csv,text/csv" data-outreach-file aria-label="Choose a CSV file">'+
  '<textarea class="career-field" rows="7" data-outreach-csv aria-label="CSV text" placeholder="name,industry,website,location,notes">'+h(S.csv)+'</textarea>'+
  '<div class="outreach-actions"><button type="button" class="career-btn" data-outreach="csv-preview">Preview</button><button type="button" class="career-btn career-primary" data-outreach="csv-add"'+(fresh.length?'':' disabled')+'>'+(fresh.length?'Add '+fresh.length+' companies':'Add companies')+'</button></div>'+
  (pv?(pv.error?'<p class="outreach-need">'+h(pv.error)+'</p>':'<ul class="outreach-prev">'+pv.rows.map(r=>'<li class="'+(r.duplicateOf||r.repeated?'dup':'')+'"><span><strong>'+h(r.name)+'</strong> <small>'+h([r.industry,r.location].filter(Boolean).join(' · '))+'</small></span><em>'+(r.duplicateOf?'Already in SELF':r.repeated?'Repeated in file':'New')+'</em></li>').join('')+'</ul>'):'')+
  '</div></div>';
}
function composerModal(){
 const k=S.composer;if(!k)return '';
 const p=personOf(k.personId);if(!p)return '';
 const c=companyOf(p.company_id);
 const mine=(root.SELFCareerPhase2?.ui?.templates||[]).map(t=>({id:'u:'+t.id,label:'Yours · '+t.title,stage:null,body:t.body}));
 const all=[...TEMPLATES,...mine],cur=all.find(t=>t.id===k.tpl)||all[0];
 const vars={first_name:firstName(p.full_name),full_name:p.full_name,company:c?.name||'',role:p.role_title||'',my_name:store.get('myname','')};
 const text=k.edited??mergeFields(cur.body,vars);
 const left=unfilled(text);
 return '<div class="outreach-modal-layer"><div class="outreach-modal" role="dialog" aria-modal="true" aria-labelledby="outreach-msg-h"><div class="outreach-modal-head"><h3 id="outreach-msg-h">Message to '+h(p.full_name)+'</h3><button type="button" class="career-btn" data-outreach="compose-close" aria-label="Close">✕</button></div>'+
  '<label class="career-form-label">Template<select class="career-field" data-outreach-tpl>'+all.map(t=>'<option value="'+h(t.id)+'"'+(t.id===cur.id?' selected':'')+'>'+h(t.label)+'</option>').join('')+'</select></label>'+
  '<label class="career-form-label">Your name<input class="career-field" data-outreach-myname value="'+h(vars.my_name)+'" placeholder="Used for {my_name}"></label>'+
  '<label class="career-form-label">Message<textarea class="career-field" rows="7" data-outreach-msg>'+h(text)+'</textarea></label>'+
  (left.length?'<p class="outreach-need" role="status">Fill in '+h(left.join(', '))+' before sending.</p>':'')+
  '<p class="outreach-hint">SELF cannot send messages. Copy it, send it on LinkedIn yourself, then log it.</p>'+
  '<div class="outreach-actions"><button type="button" class="career-btn" data-outreach="copy">Copy</button><button type="button" class="career-btn career-primary" data-outreach="log-sent"'+(S.busy?' disabled':'')+'>Log as sent'+(cur.stage?' · move to '+h(stageLabel(cur.stage)):'')+'</button></div></div></div>';
}
function render(){return S.company==null?overview():board()}

/* ---- data actions ---- */
function setUndo(text,fn){S.undo={text,fn}}
async function reload(){await core.reload();}
async function move(id,to,{auto=true,summary,nextStep}={}){
 const p=personOf(id);if(!p||!ALL_STAGES.includes(to)||S.busy)return false;
 const from=p.relationship_stage;if(from===to)return true;
 S.busy=true;S.menu=null;
 const prev={stage:from,last:p.last_contacted_at||null};
 let tp=null;
 try{
  const patch={relationship_stage:to};
  if(['connect_sent','reached_out','in_conversation'].includes(to))patch.last_contacted_at=today();
  await host.patch('career_people',id,patch);
  if(store.get('autolog','1')==='1'&&auto&&to!=='new'&&to!=='maintain'){
   const text=summary||({connect_sent:SENT_PREFIX,connected:'LinkedIn connection accepted',reached_out:'Approached on LinkedIn',in_conversation:'In conversation',[NO_REPLY]:'Closed: no reply'})[to];
   const step=nextStep!==undefined?nextStep:({connected:'Write approach message',reached_out:'Follow up once if no reply (7 days)'})[to]||'';
   try{tp=await host.insert('career_touchpoints',{person_id:id,contact_at:today(),channel:'message',summary:text,next_step:step})}
   catch(err){host.notify('Moved, but the log entry was not saved: '+err.message,true)}
  }
  setUndo(p.full_name+' → '+stageLabel(to),async()=>{
   await host.patch('career_people',id,{relationship_stage:prev.stage,last_contacted_at:prev.last});
   if(tp?.id)await host.del('career_touchpoints',tp.id);
  });
  if(to==='in_conversation')root.SELFMotion?.burstAt?.('[data-dnd-item="'+id+'"]',{count:14});
  await reload();
  return true;
 }catch(err){host.notify('Not moved: '+(err?.message||err),true);host.render();return false}
 finally{S.busy=false}
}
async function undo(){
 const u=S.undo;if(!u||S.busy)return;S.busy=true;S.undo=null;
 try{await u.fn();await reload()}catch(err){host.notify('Undo failed: '+(err?.message||err),true)}
 finally{S.busy=false;host.render()}
}
async function addPasted(){
 const pv=S.preview;if(!pv||!pv.fresh.length||S.busy)return;
 S.busy=true;const cid=S.company==='none'?null:S.company;
 const results=await Promise.allSettled(pv.fresh.map(x=>host.insert('career_people',{full_name:x.name.slice(0,160),role_title:'',company_id:cid,profile_url:x.url,relationship_stage:'new',notes:'Name guessed from the LinkedIn link; check it.'})));
 const ok=results.filter(r=>r.status==='fulfilled'),bad=results.filter(r=>r.status==='rejected');
 S.busy=false;
 if(ok.length){S.paste='';S.preview=null;S.pasteOpen=false;const ids=ok.map(r=>r.value?.id).filter(Boolean);
  setUndo(ok.length+' added to Found',async()=>{await Promise.all(ids.map(i=>host.del('career_people',i)))})}
 host.notify(ok.length+' added'+(bad.length?', '+bad.length+' failed: '+(bad[0].reason?.message||'error'):''),!!bad.length&&!ok.length);
 await reload();
}
async function addCompanies(){
 const pv=S.csvPreview;if(!pv||S.busy)return;
 const fresh=pv.rows.filter(r=>!r.duplicateOf&&!r.repeated);if(!fresh.length)return;
 S.busy=true;
 const results=await Promise.allSettled(fresh.map(r=>host.insert('career_companies',{name:r.name,industry:r.industry,website:r.website,location:r.location,notes:r.notes})));
 const ok=results.filter(r=>r.status==='fulfilled').length,bad=results.length-ok;
 S.busy=false;S.csvOpen=false;S.csv='';S.csvPreview=null;
 host.notify(ok+' compan'+(ok===1?'y':'ies')+' added'+(bad?', '+bad+' failed':''),bad>0&&!ok);
 await reload();
}
async function logSent(){
 const k=S.composer;if(!k||S.busy)return;
 const p=personOf(k.personId);if(!p)return;
 const c=companyOf(p.company_id),all=[...TEMPLATES,...(root.SELFCareerPhase2?.ui?.templates||[]).map(t=>({id:'u:'+t.id,stage:null,body:t.body}))];
 const cur=all.find(t=>t.id===k.tpl)||all[0];
 const vars={first_name:firstName(p.full_name),full_name:p.full_name,company:c?.name||'',role:p.role_title||'',my_name:store.get('myname','')};
 const text=k.edited??mergeFields(cur.body,vars);
 if(unfilled(text).length&&!root.confirm('Some {placeholders} are still in the message. Log it anyway?'))return;
 const first=text.split('\n')[0].trim().slice(0,200)||'Message sent';
 const target=cur.stage;S.composer=null;
 if(target&&target!==p.relationship_stage&&ALL_STAGES.indexOf(target)>ALL_STAGES.indexOf(p.relationship_stage)){
  await move(p.id,target,{summary:(target==='connect_sent'?SENT_PREFIX+': ':'Message sent: ')+first});
 }else{
  S.busy=true;
  try{await host.insert('career_touchpoints',{person_id:p.id,contact_at:today(),channel:'message',summary:'Message sent: '+first,next_step:'Follow up once if no reply (7 days)'});await host.patch('career_people',p.id,{last_contacted_at:today()});host.notify('Logged')}
  catch(err){host.notify('Not logged: '+(err?.message||err),true)}
  finally{S.busy=false}
  await reload();
 }
}
async function copyText(text,btn){
 try{await root.navigator.clipboard.writeText(text)}
 catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch{}ta.remove()}
 if(btn){const old=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>{if(btn.isConnected)btn.textContent=old},1400)}
}

/* ---- events ---- */
async function action(e){
 const b=e.target.closest?.('[data-outreach]');
 if(!b)return false;
 const a=b.dataset.outreach,id=b.dataset.id;
 e.preventDefault();e.stopPropagation();
 if(a==='open-company'){S.company=id;S.pasteOpen=false;S.preview=null;S.menu=null;host.render()}
 else if(a==='map'){const c=companyOf(S.company);if(!c||S.busy)return true;S.busy=true;try{const people=boardFor(c.id).list.filter(p=>p.relationship_stage!==NO_REPLY).map(p=>({name:p.full_name,role:p.role_title||'',stage:stageLabel(p.relationship_stage)}));await root.SELFBoards.createFromRecipe(c.name+' map','company-map',{fill:{company:c.name,people}})}finally{S.busy=false}}
 else if(a==='back'){S.company=null;S.menu=null;S.undo=null;host.render()}
 else if(a==='paste-toggle'){S.pasteOpen=!S.pasteOpen;host.render();if(S.pasteOpen)Promise.resolve().then(()=>document.getElementById('outreach-paste-in')?.focus())}
 else if(a==='preview'){const {profiles,skipped}=extractLinkedIn(S.paste);const d=dedupeAgainst(profiles,people());S.preview={fresh:d.filter(x=>!x.existing),dupes:d.filter(x=>x.existing),skipped};host.render()}
 else if(a==='add-paste')await addPasted();
 else if(a==='menu'){S.menu=S.menu===id?null:id;host.render()}
 else if(a==='details'){S.menu=null;core.ui.drawer={kind:'person',id};host.render()}
 else if(a==='add-link'){S.menu=null;core.ui.drawer={kind:'person',id};host.render();Promise.resolve().then(()=>document.querySelector('.career-drawer [name="profile_url"]')?.focus())}
 else if(a==='compose'){S.menu=null;S.composer={personId:id,tpl:TEMPLATES[0].id,edited:null};host.render();Promise.resolve().then(()=>document.querySelector('[data-outreach-msg]')?.focus())}
 else if(a==='compose-close'){S.composer=null;host.render()}
 else if(a==='copy'){const t=document.querySelector('[data-outreach-msg]')?.value||'';await copyText(t,b)}
 else if(a==='log-sent')await logSent();
 else if(a==='let-go')await move(id,NO_REPLY);
 else if(a==='revive')await move(id,'new',{auto:false});
 else if(a==='tray'){S.trayOpen=!S.trayOpen;host.render()}
 else if(a==='undo')await undo();
 else if(a==='csv'){S.csvOpen=true;host.render();Promise.resolve().then(()=>document.querySelector('[data-outreach-csv]')?.focus())}
 else if(a==='csv-close'){S.csvOpen=false;host.render()}
 else if(a==='csv-preview'){S.csvPreview=parseCompaniesCsv(S.csv,companies());host.render()}
 else if(a==='csv-add')await addCompanies();
 return true;
}
function input(e){
 const t=e.target;if(!t?.matches)return false;
 if(t.matches('[data-outreach-filter]')){S.filter=t.value;host.render();const el=document.querySelector('[data-outreach-filter]');if(el){el.focus();el.setSelectionRange(t.value.length,t.value.length)}return true}
 if(t.matches('[data-outreach-paste]')){S.paste=t.value;S.preview=null;return true}
 if(t.matches('[data-outreach-csv]')){S.csv=t.value;S.csvPreview=null;return true}
 if(t.matches('[data-outreach-msg]')){if(S.composer)S.composer.edited=t.value;return true}
 if(t.matches('[data-outreach-cap]')){const n=Math.max(1,Math.min(200,+t.value||20));store.set('cap',String(n));return true}
 if(t.matches('[data-outreach-campus]')){store.set('campus',t.value.trim().slice(0,40));return true}
 if(t.matches('[data-outreach-myname]')){store.set('myname',t.value.trim().slice(0,80));if(S.composer)S.composer.edited=null;return true}
 return false;
}
function change(e){
 const t=e.target;if(!t?.matches)return false;
 if(t.matches('[data-outreach-tpl]')){if(S.composer){S.composer.tpl=t.value;S.composer.edited=null;host.render()}return true}
 if(t.matches('[data-outreach-myname]')){host.render();return true}
 if(t.matches('[data-outreach-campus]')){host.render();return true}
 if(t.matches('[data-outreach-file]')){const f=t.files?.[0];if(!f)return true;if(f.size>512*1024){host.notify('That file is too large for a company list.',true);return true}
  const r=new FileReader();r.onload=()=>{S.csv=String(r.result||'');S.csvPreview=parseCompaniesCsv(S.csv,companies());host.render()};r.readAsText(f);return true}
 return false;
}
function keydown(e){
 if(e.key==='Escape'){
  if(S.composer){S.composer=null;host.render();return true}
  if(S.csvOpen){S.csvOpen=false;host.render();return true}
  if(S.menu){S.menu=null;host.render();return true}
 }
 const card=e.target?.closest?.('.outreach-card');
 if(card&&e.target===card){
  if(e.key==='Enter'){const url=card.dataset.url;if(url){e.preventDefault();root.open(url,'_blank','noopener,noreferrer')}else{e.preventDefault();card.querySelector('[data-outreach="add-link"]')?.click()}return true}
  if(e.key==='e'){e.preventDefault();core.ui.drawer={kind:'person',id:card.dataset.dndItem};host.render();return true}
 }
 return false;
}
function outsideClick(e){
 if(S.menu&&!e.target.closest?.('.outreach-menu,.outreach-more')){S.menu=null;host.render()}
}
root.document.addEventListener('click',outsideClick,true);
root.document.addEventListener('dragstart',e=>{if(e.target.closest?.('.outreach-card'))e.preventDefault()});
function reset(){Object.assign(S,{company:null,filter:'',paste:'',preview:null,csv:'',csvPreview:null,menu:null,composer:null,csvOpen:false,pasteOpen:false,trayOpen:false,busy:false,undo:null})}
root.SELFOutreachUI={init,reset,render,action,input,change,keydown,state:S,pending};
})(typeof window!=='undefined'?window:globalThis);
