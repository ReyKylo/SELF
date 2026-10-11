/* SELF Investment Intelligence / Phase 1.4 — source-linked investment memo workshop.
 * Learner-authored historical re-underwriting. Never claims actual deal participation.
 * Standalone browser-local data; no legacy SELF schema or Supabase modifications.
 */
const II14_KEY='self.investment.memo.v14';
const II14_CUTOFF='2010-10-12';
const II14_SECTIONS=[
 {id:'summary',number:'01',name:'Executive recommendation',question:'Would you invest in Shopify as of October 2010, and why?',hint:'Berikan keputusan singkat dan harga/conditions jika relevan. Hindari hindsight dari masa depan.',placeholder:'I would invest / pass / request more diligence because...'},
 {id:'business',number:'02',name:'Business & market thesis',question:'Why could this business become venture-scale?',hint:'Jelaskan siapa customer-nya, product, TAM/market expansion, dan competitive advantage berdasarkan evidence.',placeholder:'The company serves... The investment opportunity is...'},
 {id:'traction',number:'03',name:'Traction & unit economics',question:'What do the customer and revenue signals actually tell us?',hint:'Bandingkan customer growth, MRR, CAC dan retention. Bedakan reported facts dari asumsi worksheet.',placeholder:'Bessemer reported... This matters because...'},
 {id:'model',number:'04',name:'Financial scenario & valuation',question:'What does your own model imply, and what price could work?',hint:'Gunakan model snapshot sebagai scenario buatan lu. Valuation 2010 perlu direkonsiliasi bila dua angka memo berbeda.',placeholder:'Under my Base/Downside/Upside case... The return thesis depends on...'},
 {id:'risks',number:'05',name:'Risks & counterarguments',question:'What could make this investment thesis wrong?',hint:'Cantumkan risiko churn, competition, customer economics, valuation, dan apa yang bisa membalik keputusan.',placeholder:'The most important failure mode is... Evidence that would change my mind...'},
 {id:'decision',number:'06',name:'Decision, conditions & diligence',question:'What would you recommend to an investment committee?',hint:'Tulis invest/pass/further diligence, kondisi, top diligence requests dan asumsi yang belum dapat diverifikasi.',placeholder:'Recommendation... Terms / price sensitivity... Top outstanding diligence...'}
];
const ii14Defaults={section:'summary',mode:'write',recommendation:'diligence',pricing:'',drafts:{},refs:{},flags:{terms:false,mrr:false,hindsight:false},deckEdits:{},lastReview:null,savedAt:''};
function ii14Blank(){return {...ii14Defaults,drafts:{},refs:{},flags:{terms:false,mrr:false,hindsight:false},deckEdits:{},lastReview:null}}
let ii14StorageOK=true;
function ii14Load(){
 try{
  const raw=localStorage.getItem(II14_KEY);if(!raw)return ii14Blank();
  const p=JSON.parse(raw);if(!p||typeof p!=='object'||Array.isArray(p))return ii14Blank();
  const s=ii14Blank();
  if(II14_SECTIONS.some(x=>x.id===p.section))s.section=p.section;
  if(['write','review','story'].includes(p.mode))s.mode=p.mode;
  if(['invest','pass','diligence'].includes(p.recommendation))s.recommendation=p.recommendation;
  if(typeof p.pricing==='string')s.pricing=p.pricing.slice(0,1500);
  if(typeof p.savedAt==='string')s.savedAt=p.savedAt.slice(0,40);
  for(const item of II14_SECTIONS){
   if(typeof p.drafts?.[item.id]==='string')s.drafts[item.id]=p.drafts[item.id].slice(0,12000);
   if(Array.isArray(p.refs?.[item.id]))s.refs[item.id]=p.refs[item.id].filter(x=>typeof x==='string').slice(0,20).map(x=>x.slice(0,80));
  }
  for(const k of Object.keys(s.flags))s.flags[k]=p.flags?.[k]===true;
  if(p.deckEdits&&typeof p.deckEdits==='object')for(const item of ['thesis','evidence','risks','decision']){
   if(typeof p.deckEdits[item]==='string')s.deckEdits[item]=p.deckEdits[item].slice(0,3000);
  }
  return s;
 }catch(e){ii14StorageOK=false;return ii14Blank()}
}
let ii14State=ii14Load();
function ii14Save(){
 try{localStorage.setItem(II14_KEY,JSON.stringify(ii14State));ii14StorageOK=true;return true}
 catch(e){ii14StorageOK=false;return false}
}
function ii14Escape(v){return iiEsc(String(v==null?'':v))}
function ii14Button(label,act,val='',cls='ii14-btn'){return '<button type="button" data-ii14="'+act+'" data-value="'+ii14Escape(val)+'" class="'+cls+'">'+label+'</button>'}
function ii14ValidAsOf(note){return note&&note.kind!=='retrospective'&&(!note.asOf||note.asOf<=II14_CUTOFF)}
function ii14Evidences(){return Array.isArray(ii12State.notes)?ii12State.notes:[]}
function ii14Source(note){
 try{const u=new URL(note?.source||'');return (u.protocol==='https:'||u.protocol==='http:')?u.href:''}catch(e){return ''}
}
function ii14Attached(id){return (ii14State.refs[id]||[]).map(x=>ii14Evidences().find(e=>e.id===x)).filter(Boolean)}
function ii14AllNotes(){return new Map(ii14Evidences().map(x=>[x.id,x]))}
function ii14Outdated(){
 const snap=ii13State.snapshot;
 if(!snap||!snap.inputs)return false;
 const now=ii13Params(snap.scenario,ii13State);
 for(const k of ['adds','churn','arpu','margin','cac'])if(Math.abs(Number(now[k])-Number(snap.inputs[k]))>.001)return true;
 return false;
}
function ii14ModelContext(){
 const s=ii13State.snapshot;
 if(!s||!s.summary)return '<div class="ii14-model-status is-missing"><strong>No frozen financial snapshot yet</strong><p>Bangun dan simpan snapshot di Financial Lab. Live scenario numbers tidak otomatis dijadikan memo evidence.</p>'+ii14Button('Open Financial Lab →','go','model')+'</div>';
 const outdated=ii14Outdated(),asOf=ii14Escape(s.savedAt||'');
 return '<div class="ii14-model-status '+(outdated?'is-stale':'is-linked')+'"><span class="ii-overline">FROZEN ANALYST SNAPSHOT / '+ii14Escape((s.scenario||'base').toUpperCase())+'</span><div><strong>Month-12 MRR '+ii13USD(Number(s.summary.mrr||0))+'</strong><strong>ARR run-rate '+ii13USD(Number(s.summary.arr||0))+'</strong></div><p>'+ (outdated?'Model inputs have changed since this snapshot. Save a new snapshot in Financial Lab before citing updated outputs.':'Saved '+asOf+'. All figures are your hypothetical scenario, not historical Shopify financials.')+'</p>'+ii14Button('Inspect assumptions ↗','go','model')+'</div>';
}
function ii14ExternalEvidence(){
 return '<a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Bessemer Shopify original 2010 memo ↗</a>';
}
function ii14ReferenceList(id){
 const items=ii14Evidences().slice(0,80),active=new Set(ii14State.refs[id]||[]);
 if(!items.length)return '<p class="ii14-empty">No notes yet. Collect evidence in Research Notebook before attaching claims.</p>'+ii14Button('Research Notebook →','go','notebook');
 return '<div class="ii14-ref-scroll" role="group" aria-label="Attach supporting evidence">'+items.map(n=>{
  const attached=active.has(n.id),unsafe=!ii14ValidAsOf(n),source=ii14Source(n),tag=n.kind==='assumption'?'ANALYST ASSUMPTION':unsafe?'HINDSIGHT / NOT AS-OF':n.kind==='discrepancy'?'NEEDS RECONCILIATION':'AS-OF EVIDENCE';
  return '<div class="ii14-ref-row '+(attached?'is-attached ':'')+(unsafe?'is-hindsight':'')+'"><button type="button" data-ii14="toggle-ref" data-value="'+ii14Escape(id+'|'+n.id)+'" aria-pressed="'+(attached?'true':'false')+'" class="ii14-ref-toggle"><span class="ii14-ref-checkbox">'+(attached?'✓':'+')+'</span><span><strong>'+ii14Escape(n.title)+'</strong><small>'+tag+' · '+ii14Escape(n.asOf||'Undated')+'</small></span></button>'+(source?'<a href="'+ii14Escape(source)+'" target="_blank" rel="noopener noreferrer" aria-label="Open original evidence source">↗</a>':'')+'</div>';
 }).join('')+'</div><p class="ii14-ref-note">Referensi diberi label sesuai jenisnya. Hindsight dapat dilihat untuk belajar, tetapi tidak lolos pemeriksaan bukti as-of 2010. Catatan buatan sendiri belum otomatis diverifikasi.</p>';
}
function ii14Draft(id){return ii14State.drafts[id]||''}
function ii14DraftWordCount(){return II14_SECTIONS.reduce((total,item)=>total+(ii14Draft(item.id).trim()?ii14Draft(item.id).trim().split(/\s+/).length:0),0)}
function ii14Issues(){
 const issues=[];
 for(const sec of II14_SECTIONS){
  const words=ii14Draft(sec.id).trim().split(/\s+/).filter(Boolean);
  if(words.length<35)issues.push({kind:'content',section:sec.id,severity:'action',text:sec.name+' needs a fuller argument (at least ~35 words; currently '+words.length+').'});
  const refs=ii14Attached(sec.id);
  if(!refs.length)issues.push({kind:'evidence',section:sec.id,severity:'action',text:sec.name+' has no attached Research Notebook evidence.'});
  for(const note of refs){
   if(!ii14ValidAsOf(note))issues.push({kind:'historical',section:sec.id,severity:'critical',text:sec.name+' relies on a post-2010/retrospective note: '+note.title+'.'});
   if(!ii14Source(note))issues.push({kind:'evidence',section:sec.id,severity:'critical',text:sec.name+' contains a note with an invalid or missing source URL.'});
   if(note.kind==='assumption')issues.push({kind:'assumption',section:sec.id,severity:'note',text:sec.name+' cites your analyst assumption "'+note.title+'"; explicitly distinguish it from historical reported data.'});
  }
 }
 if(!ii13State.snapshot)issues.push({kind:'model',section:'model',severity:'action',text:'Freeze a Financial Lab scenario snapshot before including financial projections.'});
 else if(ii14Outdated())issues.push({kind:'model',section:'model',severity:'critical',text:'Financial model has changed since its saved snapshot. Refresh before citing current values.'});
 if(!ii14State.flags.terms)issues.push({kind:'historical',section:'model',severity:'critical',text:'Acknowledge the original memo’s conflicting US$20M vs US$25M pre-money figures before final price claims.'});
 if(!ii14State.flags.mrr)issues.push({kind:'historical',section:'traction',severity:'critical',text:'Acknowledge MRR growth discrepancy: 164K→438K implies ~167%, versus +151% stated in the memo.'});
 if(!ii14State.flags.hindsight)issues.push({kind:'historical',section:'summary',severity:'critical',text:'Confirm you are excluding outcomes or commentary only known after October 12, 2010.'});
 if(ii14State.recommendation==='invest'&&ii14State.pricing.trim().length<15)issues.push({kind:'decision',section:'decision',severity:'action',text:'An invest recommendation should describe pricing, conditions, or why a price cannot be determined.'});
 return issues;
}
function ii14Scoring(){
 const arr=ii14Issues(),critical=arr.filter(x=>x.severity==='critical').length,action=arr.filter(x=>x.severity==='action').length;
 return {issues:arr,critical,action,isDraftComplete:critical===0&&action===0};
}
function ii14WritingView(){
 const sec=II14_SECTIONS.find(x=>x.id===ii14State.section)||II14_SECTIONS[0],all=ii14Scoring();
 const nav=II14_SECTIONS.map(s=>{
  const count=ii14Draft(s.id).trim().split(/\s+/).filter(Boolean).length, refs=ii14Attached(s.id).length;
  return ii14Button('<span>'+s.number+'</span><strong>'+ii14Escape(s.name)+'</strong><small>'+count+' words · '+refs+' refs</small>','section',s.id,'ii14-section-pill'+(sec.id===s.id?' is-active':''))}).join('');
 return '<div class="ii14-write-layout"><aside class="ii14-outline"><div><span class="ii-overline">INVESTMENT MEMO / SECTIONS</span><h3>Six decisions, one story.</h3></div><nav aria-label="Memo sections">'+nav+'</nav><div class="ii14-outline-bottom"><span>'+ii14DraftWordCount()+' words</span><strong>'+all.issues.length+' open review items</strong>'+ii14Button('Review memo →','mode','review','ii14-btn ii14-btn-outline')+'</div></aside><article class="ii14-edit-canvas"><div class="ii14-paper-head"><span class="ii-overline">SECTION '+sec.number+' / SHOPIFY 2010</span><span>DRAFT · INDEPENDENT ANALYSIS</span></div><h2>'+ii14Escape(sec.name)+'</h2><h3>'+ii14Escape(sec.question)+'</h3><p>'+ii14Escape(sec.hint)+'</p><label class="ii14-text-label">Your original argument<textarea data-ii14-draft="'+sec.id+'" rows="11" maxlength="12000" placeholder="'+ii14Escape(sec.placeholder)+'">'+ii14Escape(ii14Draft(sec.id))+'</textarea></label><p class="ii14-editor-help">Tulisan lu disimpan lokal saat mengetik. AI tidak otomatis mengarang thesis atau mengisi memo ini.</p><section class="ii14-evidence-selector"><div><span class="ii-overline">SUPPORT THIS ARGUMENT</span><h3>Attach Research Notebook evidence.</h3><p>Setiap claim yang penting harus dapat ditelusuri. Note berjenis assumption tidak boleh ditampilkan sebagai historical fact.</p></div>'+ii14ReferenceList(sec.id)+'</section>'+(sec.id==='model'?ii14ModelContext():'')+(sec.id==='decision'?'<section class="ii14-decision-row"><label>Recommendation<select data-ii14-select="recommendation"><option value="diligence"'+(ii14State.recommendation==='diligence'?' selected':'')+'>More diligence</option><option value="invest"'+(ii14State.recommendation==='invest'?' selected':'')+'>Invest (conditional)</option><option value="pass"'+(ii14State.recommendation==='pass'?' selected':'')+'>Pass</option></select></label><label>Price / conditions / unknowns<textarea data-ii14-pricing rows="3" maxlength="1500" placeholder="At what terms? What still needs verification?">'+ii14Escape(ii14State.pricing)+'</textarea></label></section>':'')+'<div class="ii14-editor-bottom">'+ii14Button('Previous section','previous','','ii14-btn ii14-btn-outline')+ii14Button('Next section →','next','','ii14-btn ii14-btn-primary')+'</div></article></div>';
}
function ii14ReviewView(){
 const s=ii14Scoring(),items=s.issues;
 const actions=items.filter(x=>x.severity!=='note'),notes=items.filter(x=>x.severity==='note');
 return '<section class="ii14-review"><div class="ii14-review-top"><div><span class="ii-overline">EDITORIAL / DATA INTEGRITY REVIEW</span><h2>Challenge the argument before sharing it.</h2><p>This is a deterministic completeness and provenance review, not professional investment approval. It cannot judge whether your thesis is persuasive or source figures are verified.</p></div><div class="ii14-review-indicator"><strong>'+s.critical+'</strong><span>critical flags</span></div></div><div class="ii14-review-grids"><div class="ii14-review-primary"><span class="ii-overline">SOURCE INTEGRITY / 2010 CUTOFF</span><h3>Historical reconciliation checklist</h3>'+[
  ['terms','Pre-money valuation conflict','US$20M in opening section vs US$25M in Deal section. Flag until reconciled.'],
  ['mrr','MRR growth percentage conflict','Memo states +151% versus implied ~167% using displayed US$164K and US$438K values.'],
  ['hindsight','No hindsight in original investment decision','Do not use Shopify’s later success or modern commentary to justify an October 2010 decision.']
 ].map(x=>'<label class="ii14-check"><input data-ii14-flag="'+x[0]+'" type="checkbox"'+(ii14State.flags[x[0]]?' checked':'')+'><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></label>').join('')+'</div><aside class="ii14-review-model"><span class="ii-overline">FINANCIAL SOURCE / VERSION CONTROL</span>'+ii14ModelContext()+'<div class="ii14-review-question"><strong>Real analyst question</strong><p>Kalau terms deal aslinya berbeda, apa implikasinya terhadap ownership dan return? Tandai ketidakpastian daripada memaksakan satu angka.</p></div></aside></div><section class="ii14-issues"><div class="ii14-issues-head"><h3>What needs work</h3><span>'+actions.length+' required · '+notes.length+' disclosures</span></div>'+(items.length?items.map((x,i)=>'<div class="ii14-issue '+x.severity+'"><b>'+ii14Escape(x.severity.toUpperCase())+'</b><p>'+ii14Escape(x.text)+'</p>'+ii14Button('Open section →','review-jump',x.section,'ii14-text-action')+'</div>').join(''):'<div class="ii14-review-clear"><strong>Completeness checks cleared.</strong><p>This is still an independent draft. A qualified reviewer should examine the financial assumptions, interpretation of sources, and narrative before you present it externally.</p></div>')+'</section><div class="ii14-review-actions">'+ii14Button('Recheck the memo','recheck','','ii14-btn ii14-btn-primary')+ii14Button('Back to editor','mode','write','ii14-btn ii14-btn-outline')+'</div></section>';
}
function ii14DeckItems(){
 const map={thesis:{title:'01 / Why this investment?',value:ii14Draft('summary'),refs:'summary'},evidence:{title:'02 / Evidence supporting growth',value:ii14Draft('traction'),refs:'traction'},risks:{title:'03 / What could go wrong?',value:ii14Draft('risks'),refs:'risks'},decision:{title:'04 / Decision & conditions',value:ii14Draft('decision'),refs:'decision'}};
 return Object.entries(map).map(([id,d])=>{
  const refs=ii14Attached(d.refs),short=ii14State.deckEdits[id]||d.value||'Write your argument in the memo editor first.';
  return {id,title:d.title,text:short,refs};
 });
}
function ii14StoryView(){
 const slides=ii14DeckItems(),done=II14_SECTIONS.filter(x=>ii14Draft(x.id).trim().split(/\s+/).filter(Boolean).length>=35).length;
 return '<section class="ii14-story"><div class="ii14-story-header"><div><span class="ii-overline">MEMO → STORYBOARD / GUIDED COMPOSITION</span><h2>Turn arguments into a presentation.</h2><p>Ini bukan auto-deck generator. SELF mengambil draft lu sebagai starting point dan membiarkan lu memilih claim untuk empat slide awal.</p></div><span>'+done+'/6 memo sections developed</span></div><div class="ii14-story-grid">'+slides.map((s,i)=>'<article class="ii14-slide-tile"><div class="ii14-slide-preview"><small>SHOPIFY / HISTORICAL RE-UNDERWRITING</small><strong>'+ii14Escape(s.text.slice(0,250))+'</strong><footer><span>'+ii14Escape(s.refs.length?s.refs.length+' linked notes':'No evidence linked')+'</span><span>0'+(i+1)+'</span></footer></div><label>Slide claim<textarea data-ii14-slide="'+s.id+'" rows="4" maxlength="3000" placeholder="Write a concise headline...">'+ii14Escape(ii14State.deckEdits[s.id]||'')+'</textarea></label><div class="ii14-slide-meta"><span>'+s.title+'</span><small>Story seed · not PPTX</small></div></article>').join('')+'</div><div class="ii14-story-hint"><strong>Before you publish:</strong> A convincing deck still needs a coherent valuation, linked financial charts, citations per claim, and visual review. This storyboard is only a planning draft.</div><div class="ii14-story-actions">'+ii14Button('Download storyboard (.md)','export-story','','ii14-btn ii14-btn-primary')+ii14Button('Review memo','mode','review','ii14-btn ii14-btn-outline')+'</div></section>';
}
function ii14Memo(){
 const sections=II14_SECTIONS.filter(x=>ii14Draft(x.id).trim().length>=30).length,review=ii14Scoring(),mode=ii14State.mode;
 return '<div class="ii14-app"><header class="ii14-head"><div><span class="ii-overline">SELF / INVESTMENT INTELLIGENCE / HISTORICAL DEAL LAB</span><h1>Investment Memo. <em>In your own words.</em></h1><p>Shopify · Independent historical re-underwriting · As-of October 12, 2010</p></div><div class="ii14-head-art"><strong>IC / 001</strong><span>ANALYST WORKING DRAFT</span></div></header>'+(ii14StorageOK?'':'<div class="ii14-alert" role="alert">Browser storage is unavailable. Your changes may be lost. Export a draft immediately.</div>')+'<div class="ii14-toolbar"><nav aria-label="Memo modes">'+[['write','Draft Memo'],['review','Review & Reconcile'],['story','Deck Storyboard']].map(x=>ii14Button(x[1],'mode',x[0],'ii14-toolbar-tab'+(mode===x[0]?' is-active':''))).join('')+'</nav><div><span>'+sections+'/6 sections started</span>'+ii14Button('Download memo (.md)','export-memo','','ii14-btn ii14-btn-outline')+ii14Button('Printable memo (.html)','export-html','','ii14-btn ii14-btn-primary')+'</div></div>'+(mode==='write'?ii14WritingView():mode==='review'?ii14ReviewView():ii14StoryView())+'<div class="ii14-footer"><p><b>Strict historical simulation.</b> Original source: '+ii14ExternalEvidence()+'. Notes written by you are not independently verified. This draft is not an investment recommendation from a real VC firm, nor evidence of deal participation.</p><p><b>Local only.</b> Memo is stored at this browser origin and does not sync to SELF Supabase. Export regularly, especially before switching devices.</p></div></div>';
}
function ii14IssueMarkdown(){
 const s=ii14Scoring();
 return ['## Quality review (automated completeness / provenance only)','- Required issues: '+s.action,'- Critical flags: '+s.critical,'- Independent investment approval: NOT PERFORMED',
 ...s.issues.map(x=>'- ['+x.severity.toUpperCase()+'] '+x.text),''];
}
function ii14MemoMarkdown(){
 const data=['# Independent Historical Investment Memo — Shopify (October 2010)','',
  '**Author:** Independent analyst / learning simulation','**As-of investment decision:** '+II14_CUTOFF,
  '**Recommendation:** '+ii14State.recommendation.toUpperCase(),
  '**This was not an actual investment assignment or deal participation.**','',
  'Primary historical memo: Bessemer Venture Partners — '+II_MEMO_URL,'',
  '## Deal-terms and as-of data flags',
  '- Pre-money $20M vs $25M discrepancy acknowledged: '+(ii14State.flags.terms?'yes':'no'),
  '- Published MRR growth % discrepancy acknowledged: '+(ii14State.flags.mrr?'yes':'no'),
  '- No post-2010 hindsight used as historical support acknowledged: '+(ii14State.flags.hindsight?'yes':'no'),'',
  '## Analyst terms / pricing and conditions',ii14State.pricing||'(not written)',''];
 for(const sec of II14_SECTIONS){
  data.push('## '+sec.number+' — '+sec.name,ii14Draft(sec.id)||'(not written)','');
  const notes=ii14Attached(sec.id);
  if(notes.length){
   data.push('### Evidence references');
   notes.forEach((n,i)=>data.push('['+(i+1)+'] '+n.title+' · '+n.kind+' · '+(n.asOf||'undated')+' · '+(n.source||'missing')+'\n'+'    Observation: '+n.detail+'\n'+'    Independent interpretation: '+(n.interpretation||'(not written)')));
   data.push('');
  }else data.push('_No evidence attached._','');
 }
 const snap=ii13State.snapshot;
 data.push('## Attached financial-model context');
 if(snap&&snap.summary){
  data.push('- Saved '+snap.savedAt,'- Scenario '+snap.scenario,
   '- Month 12 projected MRR: '+ii13USD(Number(snap.summary.mrr||0)),
   '- Month 12 ARR run-rate (NOT booked annual revenue): '+ii13USD(Number(snap.summary.arr||0)),
   '- Model snapshot stale vs current inputs: '+(ii14Outdated()?'YES':'NO'),'');
 }else data.push('_No model snapshot saved._','');
 data.push(...ii14IssueMarkdown());
 data.push('## Important limitations',
 '- An illustrative projection, not Shopify actual 2011 revenue, EBITDA, or cash flows.',
 '- Simple CAC payback is not the historical memo’s churn-adjusted 7–9 months.',
 '- Online memo includes later retrospective commentary; only 2010-era material is relevant to as-of decision.',
 '- This file does not constitute a verified investment committee recommendation.','');
 return data.join('\n');
}
function ii14StoryMarkdown(){
 return ['# Shopify 2010 — Draft Investment Slide Storyboard','','Independent historical re-underwriting, not actual transaction work.','','**No editable PPTX produced.**','',
 ...ii14DeckItems().flatMap(x=>['## '+x.title,x.text,'','Supporting notes: '+(x.refs.map(n=>n.title+' ['+n.kind+']').join('; ')||'(none)'),'', '---','']),
 'Memo original source: '+II_MEMO_URL].join('\n');
}
function ii14PrintableHTML(){
 const css='body{font:15px/1.65 Georgia,serif;color:#19334b;max-width:770px;margin:55px auto;padding:0 28px}h1{font-size:35px;line-height:1.14}h2{border-top:1px solid #cad5df;padding-top:23px;font-size:21px;margin-top:33px}p{white-space:pre-wrap}small,li{font-family:Arial,sans-serif;font-size:11px;line-height:1.5;color:#5a7186}a{color:#215e99;overflow-wrap:anywhere}.masthead{font:700 10px Arial,sans-serif;letter-spacing:2px;color:#567eab}blockquote{border-left:3px solid #7e9fbd;padding-left:17px;color:#49617b}footer{margin-top:30px;border-top:1px solid #ddd;padding-top:15px}@media print{body{max-width:none;margin:0;padding:12mm}h2{break-after:avoid}.note{break-inside:avoid}}';
 const clean=(x)=>ii14Escape(x).replace(/\n/g,'<br>');
 let body='<p class="masthead">SELF / INVESTMENT INTELLIGENCE / INDEPENDENT LEARNING SIMULATION</p><h1>Shopify 2010 — Investment Memo</h1><p>As-of 12 October 2010 · Draft · '+ii14Escape(ii14State.recommendation.toUpperCase())+'</p><blockquote>NOT an actual deal assignment or signed investment recommendation. Sources and assumptions require independent review.</blockquote><h2>Pricing and conditions</h2><p>'+clean(ii14State.pricing||'Not specified')+'</p>';
 for(const s of II14_SECTIONS){
  body+='<h2>'+s.number+' · '+ii14Escape(s.name)+'</h2><p>'+clean(ii14Draft(s.id)||'Not written')+'</p>';
  const refs=ii14Attached(s.id);
  if(refs.length)body+='<div class="note"><small><strong>Linked sources / evidence:</strong></small><ol>'+refs.map(n=>'<li>'+ii14Escape(n.title)+' ('+ii14Escape(n.kind)+', '+ii14Escape(n.asOf||'undated')+') '+(ii14Source(n)?'<a href="'+ii14Escape(ii14Source(n))+'">'+ii14Escape(ii14Source(n))+'</a>':'Source missing')+'</li>').join('')+'</ol></div>';
 }
 body+='<footer><small>Original memo: <a href="'+II_MEMO_URL+'">'+II_MEMO_URL+'</a>. Data after Oct 12 2010 is not valid historical as-of evidence. This file was rendered from user-authored local drafts.</small></footer>';
 return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SELF - Shopify 2010 Draft Investment Memo</title><style>'+css+'</style></head><body>'+body+'</body></html>';
}
function ii14Download(content,mime,filename){
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function ii14Progress(){ii14State.savedAt=new Date().toISOString();ii14State.lastReview=null;return ii14Save()}
function ii14Refresh(){ii14Save();if(typeof render==='function')render()}
function ii14Toast(s){if(typeof toast==='function')toast(s)}
document.addEventListener('click',function(event){
 const el=event.target.closest('[data-ii14]');if(!el)return;
 event.preventDefault();const action=el.dataset.ii14,value=el.dataset.value;
 if(action==='mode'){ii14State.mode=value;ii14Refresh()}
 else if(action==='section'){ii14State.section=value;ii14Refresh()}
 else if(action==='next'||action==='previous'){
  const idx=II14_SECTIONS.findIndex(x=>x.id===ii14State.section);
  const index=action==='next'?Math.min(idx+1,II14_SECTIONS.length-1):Math.max(idx-1,0);
  ii14State.section=II14_SECTIONS[index].id;ii14Refresh();
 }
 else if(action==='go'){iiState.view=value;iiSave();render()}
 else if(action==='review-jump'){ii14State.section=value;ii14State.mode='write';ii14Refresh()}
 else if(action==='toggle-ref'){
  const p=value.indexOf('|'),section=value.slice(0,p),id=value.slice(p+1),notes=ii14Evidences();
  if(p<0||!II14_SECTIONS.some(s=>s.id===section)||!notes.some(n=>n.id===id))return;
  const set=new Set(ii14State.refs[section]||[]);set.has(id)?set.delete(id):set.add(id);
  ii14State.refs[section]=[...set].slice(0,20);ii14Progress();ii14Refresh();
 }
 else if(action==='recheck'){ii14State.lastReview={time:new Date().toISOString(),findings:ii14Issues().length};ii14Refresh()}
 else if(action==='export-memo')ii14Download(ii14MemoMarkdown(),'text/markdown;charset=utf-8','SELF_Shopify_2010_Investment_Memo_Draft.md');
 else if(action==='export-html')ii14Download(ii14PrintableHTML(),'text/html;charset=utf-8','SELF_Shopify_2010_Printable_Memo.html');
 else if(action==='export-story')ii14Download(ii14StoryMarkdown(),'text/markdown;charset=utf-8','SELF_Shopify_2010_Slide_Storyboard.md');
},true);
document.addEventListener('input',function(event){
 let el=event.target.closest('[data-ii14-draft]');
 if(el){const section=el.dataset.ii14Draft;if(II14_SECTIONS.some(s=>s.id===section)){ii14State.drafts[section]=el.value.slice(0,12000);ii14Progress()}return}
 el=event.target.closest('[data-ii14-slide]');
 if(el){const name=el.dataset.ii14Slide;if(['thesis','evidence','risks','decision'].includes(name)){ii14State.deckEdits[name]=el.value.slice(0,3000);ii14Progress()}return}
 el=event.target.closest('[data-ii14-pricing]');
 if(el){ii14State.pricing=el.value.slice(0,1500);ii14Progress()}
},true);
document.addEventListener('change',function(event){
 const flag=event.target.closest('[data-ii14-flag]');
 if(flag){const k=flag.dataset.ii14Flag;if(Object.prototype.hasOwnProperty.call(ii14State.flags,k)){ii14State.flags[k]=flag.checked;ii14Progress();ii14Refresh()}return}
 const select=event.target.closest('[data-ii14-select]');
 if(select&&select.dataset.ii14Select==='recommendation'){
  if(['invest','pass','diligence'].includes(select.value)){ii14State.recommendation=select.value;ii14Progress();ii14Refresh()}
 }
},true);
