/* SELF data export: CSV per table and one JSON backup, generated in the browser from data already loaded. Nothing is uploaded.
   CSV is written for spreadsheets: fields are quoted when needed, and text starting with = + - @ tab or CR gets a leading apostrophe so a cell can never run as a formula. */
(function(root){
'use strict';
const FORMULA_START=/^[=+\-@\t\r]/;
function cell(v){
 if(v==null)return '';
 let s=typeof v==='object'?JSON.stringify(v):String(v);
 /* only text is neutralised: a real number such as -5 stays a number */
 if(typeof v==='string'&&FORMULA_START.test(s))s="'"+s;
 if(/[",\r\n]/.test(s)||/^\s|\s$/.test(s))s='"'+s.replace(/"/g,'""')+'"';
 return s;
}
/* columns: [[header, key|fn]] */
function toCsv(rows,columns){
 const head=columns.map(c=>cell(c[0])).join(',');
 const body=(rows||[]).map(r=>columns.map(([,k])=>cell(typeof k==='function'?k(r):r?.[k])).join(','));
 return '﻿'+[head,...body].join('\r\n')+'\r\n';
}
/* For tables without a fixed column list: the union of keys, id first, owner id left out. */
function autoColumns(rows){
 const keys=[];for(const r of rows||[])for(const k of Object.keys(r||{}))if(k!=='user_id'&&!keys.includes(k))keys.push(k);
 keys.sort((a,b)=>(a==='id'?-1:b==='id'?1:0));
 return keys.map(k=>[k,k]);
}
const strip=rows=>(rows||[]).map(r=>{const o={...r};delete o.user_id;return o});
const byId=(list)=>{const m=new Map((list||[]).map(x=>[x.id,x]));return id=>m.get(id)};

/* snapshot: {spaces,tasks,inbox,links,boards, career:{companies,people,applications,touchpoints,interviews,radar}|null} */
function datasets(snap){
 const sp=byId(snap.spaces),co=byId(snap.career?.companies),pe=byId(snap.career?.people),ap=byId(snap.career?.applications);
 const out={
  tasks:{label:'Tasks',rows:snap.tasks||[],columns:[['id','id'],['title','title'],['status','status'],['priority','priority'],['space',t=>sp(t.space_id)?.name||''],['due_date','due_date'],['description','description'],['notes','notes'],['created_at','created_at'],['updated_at','updated_at']]},
  spaces:{label:'Spaces',rows:snap.spaces||[],columns:autoColumns(snap.spaces)},
  inbox:{label:'Inbox',rows:snap.inbox||[],columns:autoColumns(snap.inbox)},
  links:{label:'Links',rows:snap.links||[],columns:autoColumns(snap.links)},
  boards:{label:'Boards',rows:snap.boards||[],columns:autoColumns(snap.boards)}
 };
 if(snap.career){
  const c=snap.career;
  out.applications={label:'Applications',career:true,rows:c.applications||[],columns:[['id','id'],['company',a=>co(a.company_id)?.name||''],['role_title','role_title'],['hiring_stage','hiring_stage'],['applied_at','applied_at'],['source_url','source_url'],['notes','notes'],['created_at','created_at'],['updated_at','updated_at']]};
  out.people={label:'People',career:true,rows:c.people||[],columns:[['id','id'],['full_name','full_name'],['role_title','role_title'],['company',p=>co(p.company_id)?.name||''],['email','email'],['profile_url','profile_url'],['relationship_stage','relationship_stage'],['last_contacted_at','last_contacted_at'],['notes','notes'],['created_at','created_at'],['updated_at','updated_at']]};
  out.companies={label:'Companies',career:true,rows:c.companies||[],columns:[['id','id'],['name','name'],['industry','industry'],['location','location'],['website','website'],['notes','notes'],['created_at','created_at'],['updated_at','updated_at']]};
  out.touchpoints={label:'Touchpoints',career:true,rows:c.touchpoints||[],columns:[['id','id'],['person',t=>pe(t.person_id)?.full_name||''],['contact_at','contact_at'],['channel','channel'],['summary','summary'],['next_step','next_step'],['created_at','created_at']]};
  out.interviews={label:'Interviews',career:true,rows:c.interviews||[],columns:[['id','id'],['application',i=>{const a=ap(i.application_id);return a?(co(a.company_id)?.name||'')+' · '+a.role_title:''}],['title','title'],['scheduled_at','scheduled_at'],['format','format'],['stage','stage'],['prep_notes','prep_notes'],['reflection','reflection']]};
  out.radar={label:'Radar',career:true,rows:c.radar||[],columns:[['id','id'],['company_name','company_name'],['role_title','role_title'],['location_label','location_label'],['job_url','job_url'],['cluster','cluster'],['posted_at','posted_at'],['relevance_score','relevance_score'],['score_reason','score_reason'],['status','status'],['notes','notes']]};
 }
 return out;
}
function csvFor(kind,snap){const d=datasets(snap)[kind];return d?toCsv(d.rows,d.columns):null}
function backupJson(snap,now=new Date()){
 const d=datasets(snap),data={},counts={};
 for(const [k,v] of Object.entries(d)){data[k]=strip(v.rows);counts[k]=v.rows.length}
 return JSON.stringify({format:'SELF backup',version:1,exported_at:now.toISOString(),note:'Private files (CV and portfolio documents) are not included; only their names and metadata.',counts,data},null,2);
}
const fileName=(kind,ext,now=new Date())=>'self-'+kind+'-'+now.toLocaleDateString('en-CA')+'.'+ext;

const api={cell,toCsv,autoColumns,datasets,csvFor,backupJson,fileName,FORMULA_START};
root.SELFExport=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI (Settings › Your data) ================= */
let host=null;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(args){host=args.host}
function snapshot({career}){
 const st=host.state(),c=root.SELFCareer?.ui,p2=root.SELFCareerPhase2?.ui,p3=root.SELFCareerPhase3?.ui;
 const snap={spaces:st.spaces,tasks:st.tasks,inbox:st.inbox,links:st.links,boards:st.boards,career:null};
 if(career&&c?.ready)snap.career={companies:c.companies,people:c.people,applications:c.applications,touchpoints:p2?.touchpoints||[],interviews:p2?.interviews||[],radar:p3?.items||[]};
 return snap;
}
async function ensureCareer(){
 const c=root.SELFCareer;if(!c)return false;
 if(c.ui.ready)return true;
 c.enter();
 for(let i=0;i<60;i++){if(c.ui.ready)return true;if(c.ui.error&&!c.ui.loading)return false;await new Promise(r=>setTimeout(r,150))}
 return !!c.ui.ready;
}
function download(name,text,mime){
 const url=URL.createObjectURL(new Blob([text],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const KINDS=[['tasks','Tasks'],['inbox','Inbox'],['links','Links'],['applications','Applications',true],['people','People',true],['companies','Companies',true],['touchpoints','Touchpoints',true],['interviews','Interviews',true],['radar','Radar',true]];
function section(){
 return '<div class="settings-row export-row"><div><strong>Your data</strong><small>Download your records as spreadsheets (CSV) or one full backup (JSON). Files are made on this device; nothing is uploaded. Private CV and portfolio files are not included.</small>'+
  '<div class="export-buttons" role="group" aria-label="Export">'+KINDS.map(([k,l])=>'<button type="button" class="ghost-btn" data-export="'+k+'">'+h(l)+' CSV</button>').join('')+'<button type="button" class="primary-btn" data-export="backup">Full backup (JSON)</button></div><p class="export-note" id="export-note" role="status" aria-live="polite"></p></div></div>';
}
async function action(e){
 const b=e.target.closest?.('[data-export]');if(!b)return false;
 e.preventDefault();e.stopPropagation();
 const kind=b.dataset.export,note=document.getElementById('export-note'),say=m=>{if(note)note.textContent=m};
 const needsCareer=kind==='backup'||KINDS.find(k=>k[0]===kind)?.[2];
 b.disabled=true;
 try{
  if(needsCareer){say('Loading your Career records…');if(!(await ensureCareer()))throw new Error('Career records could not be loaded. Open Hunt once, then try again.')}
  const snap=snapshot({career:needsCareer});
  if(kind==='backup'){download(fileName('backup','json'),backupJson(snap),'application/json');say('Backup downloaded: '+Object.entries(datasets(snap)).map(([k,v])=>v.rows.length+' '+k).join(', ')+'.')}
  else{const csv=csvFor(kind,snap);if(csv==null)throw new Error('Nothing to export for that table.');download(fileName(kind,'csv'),csv,'text/csv;charset=utf-8');say(datasets(snap)[kind].rows.length+' '+kind+' exported.')}
 }catch(err){say('Export failed: '+(err?.message||err));host.toast?.('Export failed: '+(err?.message||err),true)}
 finally{b.disabled=false}
 return true;
}
root.SELFExportUI={init,section,action};
})(typeof window!=='undefined'?window:globalThis);
