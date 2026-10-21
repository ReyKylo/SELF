/* SELF Career Phase 3 — explicit public-source discovery, explainable scoring and assist drafts.
   No hidden remote AI service, cron, applications or automatic submissions. */
(function(){
'use strict';
let host=null,core=null;
const RADAR={owner:null,ready:false,items:[],results:[],scanning:false,error:'',view:'discover',modal:null,busy:false,filter:'all',lastScanAt:null};
const MIN=75,MAX=15,FEED='https://remotive.com/api/remote-jobs?limit=250';
const CLUSTERS=['investment','strategy','venture','fintech'];
const MATCH={
 investment:/\b(investment|investor|equity research|portfolio|asset management|securities|financial analyst|research analyst|valuation|capital market|finance analyst)\b/i,
 strategy:/\b(strategy|strategic|corporate development|business development|management consult|business operations)\b/i,
 venture:/\b(venture|startup invest|early.stage|private equity|growth equity|fund analyst)\b/i,
 fintech:/\b(fintech|financial technology|payment|banking|digital finance|wealthtech|lending)\b/i
};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const a=h;
const button=(title,act,extra='')=>'<button type="button" class="career-btn" data-career3="'+a(act)+'" '+extra+'>'+title+'</button>';
const primary=(title,act,extra='')=>'<button type="button" class="career-btn career-primary" data-career3="'+a(act)+'" '+extra+'>'+title+'</button>';
const safeUrl=value=>{try{const x=new URL(value);return x.protocol==='https:'?x.href:null}catch{return null}};
const urlKey=s=>{try{const u=new URL(s);u.hash='';return u.href.replace(/\/$/,'')}catch{return ''}};
const titleOf=x=>String(x.role_title||x.title||'').trim();
const companyOf=x=>String(x.company_name||x.company||'').trim();
const locationOf=x=>String(x.location_label||x.candidate_required_location||'').trim();
const asDate=v=>{if(!v)return null;const t=Date.parse(v);return Number.isFinite(t)?new Date(t).toISOString():null};
const me=()=>host?.state?.()?.user?.id;
const isOwned=()=>!!RADAR.owner&&RADAR.owner===me();
function clusterFor(text,preferred=''){
 if(CLUSTERS.includes(preferred))return preferred;
 for(const [key,test] of Object.entries(MATCH))if(test.test(text))return key;
 return null;
}
function scoreOpportunity(raw){
 const title=titleOf(raw),place=locationOf(raw);
 const combined=(title+' '+(raw.category||'')+' '+(raw.description||'').replace(/<[^>]+>/g,' ').slice(0,900)).slice(0,1400);
 const cluster=clusterFor(title,raw.cluster)||clusterFor(combined);
 if(!cluster)return null;
 // Exclude country-restricted roles outside Indonesia; "Worldwide" remote is allowed.
 const foreignOnly=/\b(US only|USA only|United States only|Canada only|UK only|Europe only|EU only|North America only|EMEA only)\b/i.test(place);
 const indonesia=/\b(Jakarta|Indonesia|Jabodetabek|South Jakarta|Central Jakarta|West Java|Depok|Tangerang|Bekasi)\b/i.test(place);
 const worldwide=/\b(Worldwide|Anywhere|Global|Asia|APAC|Southeast Asia)\b/i.test(place);
 const remote=/\bremote\b/i.test(place);
 if(foreignOnly||(!indonesia&&!worldwide&&!remote))return null;
 const roleTitleMatch=Object.values(MATCH).some(rx=>rx.test(title));
 const role=roleTitleMatch?45:(cluster?23:0);
 const location=indonesia?30:worldwide?23:remote?10:0;
 const sector=cluster?15:0;
 const timestamp=asDate(raw.posted_at||raw.publication_date);
 const days=timestamp?Math.max(0,(Date.now()-Date.parse(timestamp))/86400000):null;
 const fresh=days===null?0:days<=14?10:days<=35?7:days<=60?3:0;
 const score=Math.min(100,role+location+sector+fresh);
 const reasons=[roleTitleMatch?'Relevant role keywords':'Sector context matched',
 indonesia?'Jakarta/Indonesia eligible':worldwide?'Worldwide or regional remote':'Remote eligibility needs review',
 cluster+' cluster',days===null?'Publication date unavailable':days<=35?'Recent posting':'Older posting'];
 return {score,cluster,reason:reasons.join(' · '),place,postedAt:timestamp,sourceAge:days};
}
function reset(owner){
 RADAR.owner=owner;RADAR.ready=false;RADAR.items=[];RADAR.results=[];RADAR.scanning=false;
 RADAR.error='';RADAR.modal=null;RADAR.filter='all';RADAR.lastScanAt=null;
}
async function load(owner){
 if(!owner||owner!==host?.state?.()?.user?.id)return;
 if(owner!==RADAR.owner)reset(owner);
 const items=await host.request('/rest/v1/career_opportunities?select=*&order=created_at.desc');
 if(owner!==host.state().user.id||RADAR.owner!==owner)return;
 RADAR.items=Array.isArray(items)?items:[];RADAR.ready=true;
}
const detected=o=>RADAR.items.find(x=>urlKey(x.job_url)===urlKey(o.job_url));
const status=o=>o.status==='converted'?'Added to Applications':o.status==='saved'?'Saved':o.status==='dismissed'?'Dismissed':'New';
function options(){
 return '<div class="career3-config"><div><small>Scan mode</small><strong>Manual · No schedule running</strong></div>'+
 '<div><small>Designed schedule</small><strong>06:00 WIB · inactive</strong></div>'+
 '<div><small>Location preference</small><strong>Jakarta + Indonesia / eligible remote</strong></div>'+
 '<div><small>Match threshold</small><strong>≥75% (rule-based)</strong></div>'+
 '<div><small>Daily discovery cap</small><strong>15</strong></div>'+
 '<div><small>Clusters</small><strong>Investment · Strategy · Venture · Fintech</strong></div></div>';
}
function opportunityCard(o){
 const row=detected(o),stage=row?.status||o.status||'new';
 const trust=o.provider==='Manual'?'User-entered link · verify opening':'Remotive public job feed';
 const tags='<span class="career3-score">'+o.relevance_score+'% estimated match</span><span class="career3-pill">'+h(o.cluster)+'</span>';
 const url=safeUrl(o.job_url);
 return '<article class="career3-job" data-radar-url="'+a(o.job_url)+'">'+
 '<div class="career3-card-head"><div><h3>'+h(o.role_title)+'</h3><p>'+h(o.company_name)+' · '+h(o.location_label||'Unspecified')+'</p></div>'+tags+'</div>'+
 '<p class="career3-reasons">'+h(o.score_reason)+'</p>'+
 '<p class="career3-source">'+h(trust)+' · '+h(o.posted_at?new Date(o.posted_at).toLocaleDateString('en-GB'):'Posting date not provided')+'</p>'+
 '<div class="career3-actions">'+
 (url?'<a class="career-btn" href="'+a(url)+'" target="_blank" rel="noopener noreferrer">Verify source ↗</a>':'')+
 (stage==='converted'?'<span class="career3-pill">Already in Applications</span>':
 stage==='dismissed'?button('Restore','restore','data-id="'+a(row?.id||o.id)+'"'):
 stage==='saved'?button('Unsave','unsave','data-id="'+a(row?.id||o.id)+'"'):'')+
 (stage!=='converted'&&stage!=='dismissed'&&stage!=='saved'?button('Save','save','data-url="'+a(o.job_url)+'"'):'')+
 (stage!=='converted'&&stage!=='dismissed'?button('Dismiss','dismiss','data-url="'+a(o.job_url)+'"'):'')+
 (stage!=='converted'&&stage!=='dismissed'?primary('Add to Applications','convert','data-url="'+a(o.job_url)+'"'):'')+
 button('Assist','assist','data-url="'+a(o.job_url)+'"')+
 '</div></article>';
}
function empty(title,desc){return '<div class="career3-empty"><strong>'+h(title)+'</strong><p>'+h(desc)+'</p></div>'}
function render(){
 const saved=RADAR.items.filter(x=>x.status==='saved');
 const newItems=RADAR.results.filter(x=>!detected(x)||detected(x)?.status!=='dismissed');
 const list=RADAR.view==='saved'?saved:RADAR.view==='history'?RADAR.items:newItems;
 return '<div class="career3-top"><div><h2>Opportunity Radar</h2><p>Source-linked opportunities, scored with visible rules. You decide what to save or apply to.</p></div>'+
 '<div class="career3-top-actions">'+button('Add verified link','manual')+
 primary(RADAR.scanning?'Scanning…':'Scan public feed','scan',RADAR.scanning?'disabled':'')+'</div></div>'+
 options()+
 '<p class="career3-disclosure">Public provider: <a href="https://remotive.com/remote-jobs" target="_blank" rel="noopener noreferrer">Remotive</a>. Remote listings are not a complete Jakarta job market. Results may be delayed, outdated, location-restricted or unavailable. Always verify the source. This tool does not submit applications.</p>'+
 (RADAR.error?'<div class="career3-error" role="alert">'+h(RADAR.error)+'</div>':'')+
 '<div class="career3-tabs">'+[['discover','Discover'],['saved','Saved ('+saved.length+')'],['history','History ('+RADAR.items.length+')']].map(([id,title])=>
 button(title,'tab','data-tab="'+id+'" class="'+(RADAR.view===id?'career3-active':'')+'"')).join('')+'</div>'+
 (RADAR.scanning?empty('Checking live public listings…','No opportunity is shown until its source responds.'):'')+
 (list.length?'<div class="career3-list">'+list.map(opportunityCard).join('')+'</div>':
 RADAR.view==='discover'?empty('No discoveries yet','Click Scan public feed. If no verified ≥75% matches are available, nothing will be invented. You can also add a source URL manually.'):
 RADAR.view==='saved'?empty('No saved opportunities','Save a source-linked opening to compare it later.'):
 empty('No Radar history yet','Your saved, dismissed and converted records appear here.'))+
 modalMarkup();
}
function previewAssist(o){
 const cluster=h(o.cluster||'investment'),title=h(o.role_title),company=h(o.company_name),location=h(o.location_label||'Unknown');
 const prompt='Act as a professional career research assistant. Using only the public role below as a lead, check current company and position details before making claims. Role: '+o.role_title+' at '+o.company_name+'. Location: '+(o.location_label||'unverified')+'. Source: '+o.job_url+'. Cluster: '+o.cluster+'. Provide: (1) job requirements to verify from source, (2) company research questions, (3) relevant skills to demonstrate with evidence from my own experience (do not invent experience), (4) likely interview preparation topics, (5) five thoughtful recruiter questions. Cite sources and separate facts from hypotheses.';
 return '<div class="career3-assist"><strong>Assist preparation · '+title+'</strong>'+
 '<p>This is an editable research prompt based on the saved source, <b>not</b> an AI-verified assessment of you. No LLM is connected to SELF yet.</p>'+
 '<div class="career3-summary">Role: '+title+' · Company: '+company+' · Location: '+location+' · Cluster: '+cluster+'</div>'+
 '<label class="career-form-label">Research prompt to copy<textarea class="career-field career-notes" id="career3-prompt" rows="10">'+h(prompt)+'</textarea></label>'+
 button('Copy research prompt','copy-prompt')+'</div>';
}
function modalMarkup(){
 if(!RADAR.modal)return '';
 const m=RADAR.modal,o=m.o;
 let body='';
 if(m.kind==='manual')body='<p>Manual opportunities require a valid posting URL. They are labelled as user-submitted, not independently verified discoveries.</p>'+
 '<form id="career3-form"><label class="career-form-label">Role title *<input class="career-field" name="role_title" required maxlength="200"></label>'+
 '<label class="career-form-label">Company *<input class="career-field" name="company_name" required maxlength="200"></label>'+
 '<label class="career-form-label">Location / eligibility *<input class="career-field" name="location_label" required maxlength="160" placeholder="Jakarta, Indonesia"></label>'+
 '<label class="career-form-label">Official job posting URL *<input class="career-field" name="job_url" type="url" required placeholder="https://..."></label>'+
 '<label class="career-form-label">Cluster<select class="career-field" name="cluster">'+CLUSTERS.map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'</select></label>'+
 '<span class="career-save-note" role="status"></span><button class="career-btn career-primary" type="submit">Save source link</button></form>';
 if(m.kind==='assist')body=previewAssist(o);
 if(m.kind==='convert')body='<p>This will create a draft entry in your existing Applications pipeline. No external application is submitted.</p>'+
 '<div class="career3-summary"><strong>'+h(o.role_title)+'</strong> at '+h(o.company_name)+'</div>'+
 '<p>Source: <a href="'+a(o.job_url)+'" target="_blank" rel="noopener noreferrer">Open original posting ↗</a></p>'+
 primary('Confirm add to Applications','confirm-convert','data-url="'+a(o.job_url)+'"');
 return '<div class="career-modal-layer career3-modal-layer"><section class="career-modal career3-modal" role="dialog" aria-modal="true" aria-label="Opportunity Radar">'+
 '<div class="career-drawer-header"><span>CAREER / RADAR</span>'+button('✕','close-modal','aria-label="Close Radar dialog"')+'</div>'+
 '<h2>'+h(m.kind==='manual'?'Add sourced opportunity':m.kind==='assist'?'Prepare with Assist':'Add to Applications')+'</h2>'+
 body+'</section></div>';
}
async function scan(){
 if(RADAR.scanning||!isOwned())return;
 const owner=RADAR.owner,now=Date.now();
 // Daily limit and per-scan cooldown are local request safeguards, NOT an automatic job.
 const key='self.radar.manual.'+owner,stamp=new Date().toISOString().slice(0,10);
 let record={date:stamp,count:0,last:0};try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.date===stamp)record=x}catch{}
 if(record.count>=4){RADAR.error='Public-feed limit reached (4 manual scans today). Try tomorrow.';host.render();return}
 if(now-record.last<15*60*1000){RADAR.error='Please wait 15 minutes between manual scans to respect source rate limits.';host.render();return}
 RADAR.error='';RADAR.scanning=true;host.render();
 try{
  record={date:stamp,count:record.count+1,last:now};localStorage.setItem(key,JSON.stringify(record));
  const response=await fetch(FEED,{method:'GET',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw new Error('Public job feed HTTP '+response.status);
  const data=await response.json();if(!Array.isArray(data?.jobs))throw new Error('Unexpected public-feed response');
  const eligible=[];
  for(const job of data.jobs.slice(0,500)){
   if(owner!==RADAR.owner||owner!==me())return;
   const uri=safeUrl(job.url),title=String(job.title||'').trim(),company=String(job.company_name||'').trim();
   if(!uri||!title||!company)continue;
   const scored=scoreOpportunity({title,company_name:company,candidate_required_location:job.candidate_required_location,
    category:job.category,description:job.description,publication_date:job.publication_date});
   if(!scored||scored.score<MIN)continue;
   const o={provider:'Remotive',provider_id:String(job.id||''),role_title:title.slice(0,200),company_name:company.slice(0,200),
    location_label:String(job.candidate_required_location||'').slice(0,180),job_url:uri,cluster:scored.cluster,
    posted_at:scored.postedAt,relevance_score:scored.score,score_reason:scored.reason};
   if(!RADAR.items.some(x=>urlKey(x.job_url)===urlKey(uri)&&x.status==='dismissed'))eligible.push(o);
  }
  const distinct=new Map();for(const o of eligible)if(!distinct.has(urlKey(o.job_url)))distinct.set(urlKey(o.job_url),o);
  RADAR.results=[...distinct.values()].sort((a,b)=>b.relevance_score-a.relevance_score||
   Date.parse(b.posted_at||0)-Date.parse(a.posted_at||0)).slice(0,MAX);
  RADAR.lastScanAt=new Date(now).toISOString();RADAR.view='discover';
 }catch(error){RADAR.error='Scan unavailable: '+(error?.message||String(error))+
 '. No unverified opportunities were added. You can still add an official job link manually.';RADAR.results=[]}
 finally{RADAR.scanning=false;if(owner===RADAR.owner)host.render()}
}
function sourceOf(url){return RADAR.results.find(x=>urlKey(x.job_url)===urlKey(url))||detected({job_url:url})}
async function persist(o,status='saved'){
 const existing=detected(o);
 if(existing)return existing;
 const data={provider:o.provider,provider_id:o.provider_id||'',role_title:o.role_title,company_name:o.company_name,
  location_label:o.location_label||'',job_url:o.job_url,cluster:o.cluster,posted_at:o.posted_at||null,
  relevance_score:o.relevance_score,score_reason:o.score_reason||'',status};
 const result=await host.insert('career_opportunities',data);RADAR.items.unshift(result);
 return result;
}
async function update(id,stage){
 if(!isOwned()||RADAR.busy)return false;
 const row=RADAR.items.find(x=>x.id===id);if(!row)return false;
 RADAR.busy=true;
 try{const patched=await host.patch('career_opportunities',row.id,{status:stage});
 Object.assign(row,patched);host.render();return true}
 catch(err){RADAR.error='Not saved: '+err.message;host.render();return false}
 finally{RADAR.busy=false}
}
async function saveManual(form){
 const raw=Object.fromEntries(new FormData(form).entries());
 const title=String(raw.role_title||'').trim(),company=String(raw.company_name||'').trim();
 const url=safeUrl(raw.job_url),place=String(raw.location_label||'').trim();
 if(!title||!company||!place||!url){RADAR.error='Enter a valid HTTPS job link and complete all required fields.';const box=form.querySelector?.('.career-save-note');if(box)box.textContent=RADAR.error;return}
 if(RADAR.items.some(x=>urlKey(x.job_url)===urlKey(url))){RADAR.error='Already in your Radar. Open History to update its status.';const box=form.querySelector?.('.career-save-note');if(box)box.textContent=RADAR.error;return}
 const rank=scoreOpportunity({role_title:title,location_label:place,cluster:raw.cluster});
 const o={provider:'Manual',provider_id:'',role_title:title.slice(0,200),company_name:company.slice(0,200),
 location_label:place.slice(0,180),job_url:url,cluster:CLUSTERS.includes(raw.cluster)?raw.cluster:'investment',
 posted_at:null,relevance_score:rank?.score||0,score_reason:'User-submitted URL · source not independently verified · '+(rank?.reason||'Location eligibility not confirmed')};
 try{await persist(o,'saved');RADAR.modal=null;RADAR.view='saved';RADAR.error='';host.render();host.notify('Opportunity link saved')}
 catch(error){RADAR.error='Could not save: '+error.message;const err=form.querySelector('.career-save-note');if(err)err.textContent=RADAR.error;host.notify(RADAR.error,true)}
}
async function convert(o){
 if(RADAR.busy||!o||!isOwned())return;
 RADAR.busy=true;const owner=RADAR.owner;
 try{
  const url=safeUrl(o.job_url);if(!url)throw new Error('Missing secure source URL');
  const known=core.ui.applications.find(x=>urlKey(x.source_url||'')===urlKey(url));
  const live=await host.request('/rest/v1/career_applications?select=*&source_url=eq.'+encodeURIComponent(url));
  let existing=known||live?.find(x=>urlKey(x.source_url||'')===urlKey(url));
  let company=core.ui.companies.find(x=>x.name.toLowerCase()===o.company_name.toLowerCase());
  if(!company&&!existing){
   company=await host.insert('career_companies',{name:o.company_name,industry:o.cluster,location:o.location_label||'',notes:''});
   core.ui.companies.push(company);
  }
  if(!existing){
   existing=await host.insert('career_applications',{company_id:company.id,role_title:o.role_title,
    hiring_stage:'wishlist',source_url:url,notes:'Sourced via '+o.provider+' Radar · '+o.score_reason});
   core.ui.applications.unshift(existing);
  }
  let record=detected(o);
  try{
   if(!record)record=await persist(o,'converted');
   const linked=await host.patch('career_opportunities',record.id,{status:'converted',application_id:existing.id});
   Object.assign(record,linked);
   // Stage remains Wishlist until user changes it. No external application submission.
   await host.reloadCareer?.();
   RADAR.modal=null;RADAR.view='history';RADAR.error='';host.notify('Draft added to Applications');
  }catch(error){RADAR.error='Application saved, but Radar status did not sync. The original job URL prevents duplicate imports when retried: '+error.message;host.render()}
 }catch(error){RADAR.error='Could not finish adding draft: '+error.message+'. Check Applications before retrying.';host.render()}
 finally{RADAR.busy=false;if(owner===RADAR.owner)host.render()}
}
async function action(event){
 const b=event.target.closest?.('[data-career3]');
 if(!b)return false;
 event.preventDefault();event.stopPropagation();
 const type=b.dataset.career3,url=b.dataset.url,id=b.dataset.id;
 if(type==='tab'){RADAR.view=b.dataset.tab;host.render()}
 else if(type==='scan')await scan();
 else if(type==='manual'){RADAR.modal={kind:'manual'};RADAR.error='';host.render()}
 else if(type==='close-modal'){RADAR.modal=null;host.render()}
 else if(type==='assist'||type==='convert'){const o=sourceOf(url);if(o){RADAR.modal={kind:type==='assist'?'assist':'convert',o};host.render()}}
 else if(type==='confirm-convert'){const o=sourceOf(url);if(o&&confirm('Add this role as a draft to your existing Applications?'))await convert(o)}
 else if(type==='save'||type==='dismiss'){
  const o=sourceOf(url);if(!o)return true;
  try{const record=await persist(o,type==='save'?'saved':'dismissed');await update(record.id,type==='save'?'saved':'dismissed')}
  catch(error){RADAR.error='Not saved: '+error.message;host.render()}
 }
 else if(type==='unsave'||type==='restore')await update(id,'new');
 else if(type==='copy-prompt'){
  const input=document.getElementById?.('career3-prompt');
  if(input){try{await navigator.clipboard.writeText(input.value);host.notify('Research prompt copied')}
   catch{host.notify('Clipboard unavailable. Select and copy the text manually.',true)}}
 }
 return true;
}
async function submit(event){
 if(event.target?.id!=='career3-form')return false;
 event.preventDefault();event.stopPropagation();await saveManual(event.target);return true;
}
function keydown(event){
 if(RADAR.modal&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation?.();RADAR.modal=null;host.render();return true}
 return false;
}
function init(args){host=args.host;core=args.career}
window.SELFCareerPhase3={init,reset,load,render,action,submit,keydown,scan,scoreOpportunity,ui:RADAR};
})();
