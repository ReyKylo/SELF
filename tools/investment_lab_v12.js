/* Investment Intelligence / Phase 1.2
   Academy microlearning + as-of aware research notebook.
   No backend migrations; all notes remain browser-local until separately migrated. */
const II12_KEY='self.investment.lab.v12';
const II12_GE_OFFICIAL='https://www.ycombinator.com/blog/startup-investor-school-preview-with-geoff-ralston';
const II12_STARTER=[
 {id:'customers',title:'Shopify customer base',detail:'About 5,500 customers a year earlier, rising to nearly 10,000 in 2010 (+81% year on year).',section:'Opening / business overview',kind:'historical',source:II_MEMO_URL,asOf:'2010-10-12',prompt:'Apakah customer growth berkualitas bila retention-nya rendah?'},
 {id:'mrr',title:'Monthly recurring revenue',detail:'MRR increased from US$164,000 to US$438,000 (+151% year on year), as reported in the October 2010 investment memo.',section:'Opening / business overview',kind:'historical',source:II_MEMO_URL,asOf:'2010-10-12',prompt:'Berapa annualized run rate? Apa bedanya dengan annual revenue realized?'},
 {id:'retention',title:'Retention and customer churn',detail:'About 75% of customers retained by month 3 and about 50–60% by month 12; stabilized monthly churn reportedly 3–5%.',section:'Customer Acquisition & Retention',kind:'historical',source:II_MEMO_URL,asOf:'2010-10-12',prompt:'Bisakah strong growth coexist dengan customer churn yang tinggi?'},
 {id:'cac',title:'Customer acquisition economics',detail:'Reported customer acquisition cost of US$175–225 and churn-adjusted payback of 7–9 months.',section:'Customer Acquisition & Retention',kind:'historical',source:II_MEMO_URL,asOf:'2010-10-12',prompt:'Apakah rendahnya CAC tetap menarik jika cohort retention buruk?'},
 {id:'valuation',title:'Two different pre-money figures',detail:'The overview states US$20m pre-money and a planned US$5m investment for 20% ownership; the Deal section states US$25m pre-money. These statements need reconciliation before valuation modeling.',section:'Overview + Deal (internal discrepancy)',kind:'discrepancy',source:II_MEMO_URL,asOf:'2010-10-12',prompt:'Jangan otomatis gunakan salah satu angka. Catat discrepancy dan model scenarios terpisah.'}
];
const ii12Default={view:'growth',briefRead:false,videoReviewed:false,exerciseChoice:'',exerciseCorrect:false,teachback:'',simpler:false,notes:[],draftTitle:'',draftObservation:'',draftInterpretation:'',draftUrl:'',draftDate:'2010-10-12',draftKind:'historical',slideClaim:'',slideImplication:'',slideSourceId:'',feedback:''};
let ii12StorageOK=true;
function ii12Esc(x){return iiEsc(x)}
function ii12Load(){
 try {
  const raw=localStorage.getItem(II12_KEY);
  if(!raw)return {...ii12Default};
  const p=JSON.parse(raw);
  if(!p||typeof p!=='object'||Array.isArray(p))return {...ii12Default};
  const s={...ii12Default};
  for(const k of Object.keys(ii12Default)){
   if(k==='notes'){
    if(Array.isArray(p.notes))s.notes=p.notes.slice(0,80).filter(n=>n&&typeof n==='object').map(n=>({
     id:String(n.id||'').slice(0,80),title:String(n.title||'').slice(0,200),detail:String(n.detail||'').slice(0,4000),
     interpretation:String(n.interpretation||'').slice(0,4000),source:String(n.source||'').slice(0,1024),
     section:String(n.section||'').slice(0,200),kind:['historical','retrospective','assumption','discrepancy'].includes(n.kind)?n.kind:'assumption',
     asOf:String(n.asOf||'').slice(0,10),curated:n.curated===true
    }));
   }else if(typeof p[k]===typeof ii12Default[k]){
    s[k]=typeof ii12Default[k]==='string'?p[k].slice(0,4000):p[k];
   }
  }
  if(!['growth','sources','write'].includes(s.view))s.view='growth';
  return s;
 }catch(e){ii12StorageOK=false;return {...ii12Default}}
}
let ii12State=ii12Load();
function ii12Save(){
 try{localStorage.setItem(II12_KEY,JSON.stringify(ii12State));ii12StorageOK=true;return true}
 catch(e){ii12StorageOK=false;return false}
}
function ii12Mark(){return [ii12State.briefRead,ii12State.videoReviewed,ii12State.exerciseCorrect,ii12State.teachback.trim().length>=35].filter(Boolean).length}
function ii12Btn(s,action,val='',cls='ii-btn'){return '<button type="button" data-ii12="'+action+'" data-val="'+ii12Esc(val)+'" class="'+cls+'">'+s+'</button>'}
function ii12SafeLink(x){
 try{const u=new URL(String(x));if(u.protocol!=='https:'&&u.protocol!=='http:')return '';return u.href}catch(e){return ''}
}
function ii12Status(){return (!ii12StorageOK?'<div class="ii12-warning" role="alert">Catatan belum aman tersimpan di browser. Ekspor draft sebelum keluar.</div>':'')}
function ii12Growth(){
 const stages=[['brief','01','Understand'],['video','02','Watch'],['exercise','03','Practice'],['write','04','Teach back']];
 const tab=['brief','video','exercise','write'].includes(ii12State.view)?ii12State.view:'brief';
 const progress=ii12Mark();
 const nav=stages.map(x=>ii12Btn('<small>'+x[1]+'</small>'+x[2],'growth-step',x[0],'ii12-step'+(tab===x[0]?' is-active':''))).join('');
 const sections={
  brief:()=>'<div class="ii12-article"><span class="ii-overline">01 / TWO NUMBERS, VERY DIFFERENT STORIES</span><h2>Revenue growth itu bagus. Tapi belum tentu bisnisnya sehat.</h2><p>Bayangin ada toko langganan yang pelanggan barunya terus bertambah. Dari luar kelihatan ramai. Tapi ternyata banyak pelanggan lama pergi setelah beberapa bulan.</p><p>Startup bisa punya <strong>growth</strong> yang tinggi dan <strong>churn</strong> yang juga tinggi. Dua-duanya bisa benar pada saat yang sama.</p><div class="ii12-contrast"><div><small>SHOPIFY 2010 · SOURCE FACT</small><strong>+151%</strong><span>MRR growth year-on-year</span></div><div><small>SHOPIFY 2010 · SOURCE FACT</small><strong>50–60%</strong><span>Month-12 customer retention</span></div></div><p>Bessemer mengetahui dua sinyal itu saat mengevaluasi Shopify. Growth menunjukkan demand; retention memberi gambaran apakah pelanggan bertahan. <strong>Tugas analyst adalah memahami keduanya sebelum membuat keputusan.</strong></p>'+(ii12State.simpler?'<div class="ii12-simpler"><strong>Versi lebih gampang:</strong><p>Isi ember bertambah 100 liter sehari, tapi bocor 60 liter sehari. Lu tetap bisa melihat level air naik, tetapi perlu tahu seberapa besar kebocorannya dan apakah biaya mengisi ember masuk akal.</p></div>':'')+'<div class="ii12-actions">'+ii12Btn(ii12State.simpler?'Sembunyikan analogi':'Gue belum ngerti — analogi lain','simpler')+ii12Btn(ii12State.briefRead?'✓ Sudah dibaca':'Sudah paham bagian ini →','mark-brief','','ii-btn ii-btn-primary')+'</div><p class="ii-footnote">Data historis dari Bessemer (2010), bagian Overview dan Customer Acquisition & Retention. Angka retention adalah laporan memo, bukan forecast.</p></div>',
  video:()=>'<div class="ii12-article"><span class="ii-overline">02 / CURATED PROFESSIONAL MATERIAL</span><h2>Listen to the investor. Keep your own questions.</h2><p>Kita tidak menyuruh lu menonton seluruh kelas tanpa arah. Mulai dari sumber YC yang punya <strong>transcript bertimestamp</strong>, lalu pilih lecture investor school sebagai pengayaan.</p><div class="ii12-resource"><div><small>OFFICIAL YC · TRANSCRIPT WITH TIMESTAMPS</small><h3>Geoff Ralston — Startup Investor School Preview (2018)</h3><p><strong>Mulai dari [00:34]</strong> untuk memahami tujuan investor school. Lanjutkan [01:50] untuk mendengar kenapa pengalaman membuat kesalahan investasi juga penting. Ini penunjuk lokasi dalam transcript resmi, bukan tautan seek video otomatis.</p><a href="'+II12_GE_OFFICIAL+'" target="_blank" rel="noopener noreferrer">Open official transcript & media ↗</a></div></div><div class="ii12-resource ii12-resource-secondary"><div><small>OPTIONAL / LONGER EXTERNAL VIDEO</small><h3>Startup Investor School — Day 1 talks</h3><p>Video lecture YC yang lebih panjang. Cari hal yang dipertimbangkan investor sebelum memutuskan investasi, lalu bandingkan dengan pemikiran sendiri.</p><a href="'+II_VIDEO_URL+'" target="_blank" rel="noopener noreferrer">Open official Day 1 video collection ↗</a></div></div><div class="ii12-question"><strong>Watch with a purpose</strong><p>Sebutkan satu kemungkinan kesalahan analisis investor yang menurut lu perlu dihindari. Tidak harus pakai jargon.</p></div>'+ii12Btn(ii12State.videoReviewed?'✓ Materi sudah direview':'Saya sudah baca / tonton materi →','mark-video','','ii-btn ii-btn-primary')+'<p class="ii-footnote">Catatan: materi YC tahun 2018 adalah framework pembelajaran modern, bukan informasi yang tersedia bagi investor Shopify pada tahun 2010.</p></div>',
  exercise:()=>'<div class="ii12-article"><span class="ii-overline">03 / ANALYST EXERCISE</span><h2>Apakah 151% MRR growth otomatis berarti deal bagus?</h2><p>Pilih alasan yang paling tepat. Ini latihan konsep; gunakan konteks retention Shopify 2010.</p><div class="ii12-choices">'+[['A','Ya. Revenue growth tinggi berarti investor pasti memperoleh return tinggi.'],['B','Tidak otomatis. Growth menunjukkan demand, tetapi retention, CAC, market, dan entry price perlu diperiksa.'],['C','Tidak. Customer churn berarti bisnis pasti tidak bisa menghasilkan venture returns.']].map(r=>ii12Btn('<b>'+r[0]+'</b><span>'+r[1]+'</span>','exercise-choice',r[0],'ii12-choice'+(ii12State.exerciseChoice===r[0]?' is-selected':''))).join('')+'</div>'+ii12Btn('Check my reasoning →','exercise-check','','ii-btn ii-btn-primary')+(ii12State.feedback?'<div role="status" class="ii12-feedback'+(ii12State.exerciseCorrect?' good':'')+'">'+ii12Esc(ii12State.feedback)+'</div>':'')+'<div class="ii12-question"><strong>Advanced thought (optional)</strong><p>Kalau Shopify membayar US$175–225 untuk mendapat pelanggan dan payback-nya 7–9 bulan, pertanyaan diligence apa yang harus lu ajukan sebelum menyebut CAC-nya menarik?</p></div></div>',
  write:()=>'<div class="ii12-article"><span class="ii-overline">04 / RETRIEVAL PRACTICE</span><h2>Coba ajarin balik ke gue.</h2><p>Dengan bahasa lu sendiri: <strong>kenapa startup bisa tumbuh cepat sekaligus punya masalah retention?</strong> Jawaban ini belum masuk investment portfolio final.</p><label class="ii-field">My own explanation<textarea data-ii12-field="teachback" maxlength="2000" rows="6" placeholder="Menurut gue, angka growth bisa naik karena...">'+ii12Esc(ii12State.teachback)+'</textarea></label><div class="ii12-question"><strong>Mini-checklist untuk tulisan lu</strong><p>Apakah lu menjelaskan bagaimana pelanggan baru dan pelanggan lama memengaruhi growth? Apakah lu menyebut risiko dan satu metrik lain yang perlu dicek?</p></div>'+ii12Btn('Save my understanding','save-teachback','','ii-btn ii-btn-primary')+'<p class="ii-footnote">SELF belum memiliki AI assessor aktif dalam fase ini. Tulisan tersimpan sebagai refleksi; tidak otomatis dinilai sebagai mastery.</p></div>'
 };
 return '<div class="ii12-page"><header class="ii12-lesson-header"><div><span class="ii-overline">ACADEMY / FOUNDATION 02 / MICROLESSON</span><h1>Growth vs. Quality.</h1><p>Belajar membaca angka yang menarik tanpa kehilangan rasa skeptis.</p></div><div class="ii12-lesson-count"><strong>'+progress+'/4</strong><small>learning milestones</small></div></header>'+ii12Status()+'<nav class="ii12-stage-nav" aria-label="Lesson 02 stages">'+nav+'</nav><div class="ii12-layout"><article class="ii12-paper">'+(sections[tab]||sections.brief)()+'</article><aside class="ii12-side"><section class="ii12-index"><span class="ii-overline">YOUR CASE CONTEXT</span><h3>Shopify / 2010</h3><p>Belajar dari data pertumbuhan dan churn yang benar-benar tertulis dalam memo investasi Bessemer.</p><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Read source memo ↗</a></section><section class="ii12-side-note"><span class="ii-overline">NEXT STEP</span><p>Jadikan fakta memo sebagai research evidence, tambahkan interpretasi lu, lalu gunakan sebagai bahan investment thesis.</p>'+ii12Btn('Open Research Notebook →','jump','notebook','ii-btn ii-btn-quiet')+'</section></aside></div></div>';
}
function ii12Kinds(kind){return {historical:'Historical as-of fact',retrospective:'Post-2010 commentary',assumption:'Analyst assumption',discrepancy:'Needs reconciliation'}[kind]||'Unverified'}
function ii12StarterCard(x){
 const imported=ii12State.notes.some(n=>n.id==='source-'+x.id);
 return '<article class="ii12-source"><header><span class="ii12-source-kind">'+ii12Kinds(x.kind)+'</span><span>AS-OF '+ii12Esc(x.asOf)+'</span></header><h3>'+ii12Esc(x.title)+'</h3><p>'+ii12Esc(x.detail)+'</p><div class="ii12-source-footer"><a href="'+x.source+'" target="_blank" rel="noopener noreferrer">'+ii12Esc(x.section)+' ↗</a>'+ii12Btn(imported?'✓ In notebook':'Add to notebook +','import-source',x.id,'ii-btn'+(imported?' ii12-imported':''))+'</div><small class="ii12-prompt">Think: '+ii12Esc(x.prompt)+'</small></article>';
}
function ii12NoteCard(n){
 const src=ii12SafeLink(n.source);
 return '<article class="ii12-note"><div class="ii12-note-head"><span>'+ii12Kinds(n.kind)+'</span><small>'+ii12Esc(n.asOf||'No as-of date')+'</small></div><h3>'+ii12Esc(n.title)+'</h3><p>'+ii12Esc(n.detail)+'</p>'+(n.interpretation?'<div class="ii12-interpretation"><strong>Your interpretation</strong><p>'+ii12Esc(n.interpretation)+'</p></div>':'<div class="ii12-interp-prompt">Tambahkan interpretasi sendiri agar ini bukan sekadar kumpulan angka.</div>')+'<div class="ii12-note-actions">'+(src?'<a href="'+ii12Esc(src)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'<span class="ii12-link-missing">No valid source URL</span>')+ii12Btn('Use in slide','choose-source',n.id,'ii12-textbutton')+ii12Btn('Remove','remove-note',n.id,'ii12-textbutton ii12-danger')+'</div></article>';
}
function ii12Notebook(){
 const notes=ii12State.notes;const linked=notes.find(n=>n.id===ii12State.slideSourceId);const text=ii12State.slideClaim.trim();
 const sourceOptions='<option value="">Select an evidence note...</option>'+notes.map(n=>'<option value="'+ii12Esc(n.id)+'"'+(n.id===ii12State.slideSourceId?' selected':'')+'>'+ii12Esc(n.title)+'</option>').join('');
 return '<div class="ii12-page"><header class="ii12-notebook-head"><div><span class="ii-overline">CASE 001 / SHOPIFY / OCTOBER 2010</span><h1>Research Notebook.</h1><p>Build your own evidence trail before writing a recommendation.</p></div><div class="ii12-notebook-count"><strong>'+notes.length+'</strong><small>evidence notes saved locally</small></div></header>'+ii12Status()+'<div class="ii12-notebook-jump">'+ii12Btn('Evidence Library','notebook-section','library')+ii12Btn('My Notes','notebook-section','notes')+ii12Btn('Slide Seed','notebook-section','slide')+'</div><section class="ii12-starter-library" id="ii12-library"><div class="ii12-section-head"><div><span class="ii-overline">ORIGINAL 2010 MEMO</span><h2>Verified starter evidence.</h2><p>Ambil fakta yang tertulis dalam memo aslinya. Setiap card punya sumber, periode, dan pertanyaan untuk lu teliti sendiri.</p></div><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Original Bessemer memo ↗</a></div><div class="ii12-source-grid">'+II12_STARTER.map(ii12StarterCard).join('')+'</div></section><section class="ii12-notes-section" id="ii12-notes"><div class="ii12-section-head"><div><span class="ii-overline">YOUR CASE RESEARCH</span><h2>Evidence saved by you.</h2><p>Menambahkan sumber bukan sama dengan menyetujui investasi. Lengkapi interpretasi dan cek implikasinya sendiri.</p></div>'+ii12Btn('Download case notes (.md)','export-notebook','','ii-btn ii-btn-quiet')+'</div><div class="ii12-notes-list">'+(notes.map(ii12NoteCard).join('')||'<div class="ii12-empty"><strong>Belum ada evidence note.</strong><p>Mulai dari satu source card di atas, lalu tulis interpretasi lu sendiri.</p></div>')+'</div><div class="ii12-new-note"><span class="ii-overline">CREATE YOUR OWN EVIDENCE ENTRY</span><h3>Capture what you notice.</h3><div class="ii12-form-grid"><label class="ii-field">Claim / title<input data-ii12-field="draftTitle" maxlength="200" placeholder="Contoh: App ecosystem as competitive advantage" value="'+ii12Esc(ii12State.draftTitle)+'"></label><label class="ii-field">Evidence date<input data-ii12-field="draftDate" type="date" value="'+ii12Esc(ii12State.draftDate)+'"></label></div><label class="ii-field">What does the source say?<textarea data-ii12-field="draftObservation" maxlength="4000" rows="3" placeholder="Tulis ulang dengan bahasa lu, jangan copy artikel panjang...">'+ii12Esc(ii12State.draftObservation)+'</textarea></label><label class="ii-field">My interpretation<textarea data-ii12-field="draftInterpretation" maxlength="4000" rows="3" placeholder="This matters because...">'+ii12Esc(ii12State.draftInterpretation)+'</textarea></label><div class="ii12-form-grid"><label class="ii-field">Source URL (public HTTP/HTTPS)<input type="url" data-ii12-field="draftUrl" maxlength="1024" value="'+ii12Esc(ii12State.draftUrl)+'" placeholder="https://..."></label><label class="ii-field">Evidence type<select data-ii12-field="draftKind"><option value="historical"'+(ii12State.draftKind==='historical'?' selected':'')+'>Historical as-of fact</option><option value="retrospective"'+(ii12State.draftKind==='retrospective'?' selected':'')+'>Post-2010 retrospective</option><option value="assumption"'+(ii12State.draftKind==='assumption'?' selected':'')+'>My assumption</option><option value="discrepancy"'+(ii12State.draftKind==='discrepancy'?' selected':'')+'>Needs reconciliation</option></select></label></div><div class="ii12-actions">'+ii12Btn('Save evidence entry →','save-note','','ii-btn ii-btn-primary')+'<small>Custom entries remain unverified until you independently review the source.</small></div></div></section><section class="ii12-slide-section" id="ii12-slide"><div><span class="ii-overline">FROM LEARNING TO PORTFOLIO / SLIDE SEED 01</span><h2>Your first argument.</h2><p>Sebelum membuat deck lengkap, susun satu slide: <strong>claim → evidence → implication</strong>. Bukan slide otomatis yang mengarang thesis.</p><label class="ii-field">Slide headline / central claim<textarea data-ii12-field="slideClaim" maxlength="1400" rows="2" placeholder="My investment claim is...">'+ii12Esc(ii12State.slideClaim)+'</textarea></label><label class="ii-field">Choose supporting evidence<select data-ii12-field="slideSourceId">'+sourceOptions+'</select></label><label class="ii-field">Implication for investment decision<textarea data-ii12-field="slideImplication" maxlength="1600" rows="3" placeholder="This matters for the investment because...">'+ii12Esc(ii12State.slideImplication)+'</textarea></label><div class="ii12-actions">'+ii12Btn('Save slide seed','save-slide','','ii-btn ii-btn-primary')+ii12Btn('Export research pack (.md)','export-notebook','','ii-btn ii-btn-quiet')+'</div></div><div class="ii12-slide-preview"><span>INDEPENDENT HISTORICAL INVESTMENT SIMULATION</span><strong>'+ii12Esc(text||'Your investment conclusion goes here.')+'</strong><div class="ii12-slide-evidence"><small>EVIDENCE</small><p>'+ii12Esc(linked?.detail||'Select a research note to support your claim.')+'</p></div><p class="ii12-slide-impact">'+ii12Esc(ii12State.slideImplication||'Explain what this means for the invest/pass decision.')+'</p><small>SHOPIFY / AS-OF 12 OCT 2010 · DRAFT ONLY · NOT AN ACTUAL DEAL</small></div></section><p class="ii12-notebook-footnote">Storage is browser-local. Research notes do not sync to SELF Supabase or the legacy Workspace backup. This page provides a slide storyboard, not an editable PPTX file or source-verified investment recommendation.</p></div>';
}
function ii12Export(){
 const lines=['# SELF — Shopify 2010 Research Pack','', 'Independent Historical Re-Underwriting · Draft / Learning Exercise','As-of: 2010-10-12','No real deal participation. No professional verification of your own notes.','', '## My current thesis',iiState.thesis||'(empty)','', '## Risk / counterargument',iiState.risk||'(empty)','', '## Learning reflection',ii12State.teachback||'(empty)','', '## Source observations'];
 for(const n of ii12State.notes){
  lines.push('', '### '+n.title, '- Evidence category: '+ii12Kinds(n.kind),'- As-of / evidence date: '+n.asOf,'- Observation: '+n.detail,'- My interpretation: '+(n.interpretation||'(not written)'),'- Section: '+(n.section||'not recorded'),'- Source: '+(n.source||'(missing)'));
 }
 const source=ii12State.notes.find(n=>n.id===ii12State.slideSourceId);
 lines.push('','## Slide seed','- Claim: '+(ii12State.slideClaim||'(empty)'),'- Supporting evidence: '+(source?source.title:'(not selected)'),'- Investment implication: '+(ii12State.slideImplication||'(empty)'),'','## Professional references',II_MEMO_URL,II_VIDEO_URL,II12_GE_OFFICIAL,'','CAUTION: Bessemer public memo includes later retrospective comments. The memo also has an unreconciled pre-money discrepancy between the opening section and the Deal section.');
 const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='SELF_Shopify_2010_Research_Pack.md';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function ii12Refresh(){ii12Save();iiSave();if(typeof render==='function')render()}
function ii12Warn(message){if(typeof toast==='function')toast(message)}
document.addEventListener('click',function(e){
 const el=e.target.closest('[data-ii12]');if(!el)return;
 e.preventDefault();const a=el.dataset.ii12,v=el.dataset.val;
 if(a==='jump'){iiState.view=v;ii12Refresh()}
 else if(a==='growth-step'){ii12State.view=v;ii12Refresh()}
 else if(a==='simpler'){ii12State.simpler=!ii12State.simpler;ii12Refresh()}
 else if(a==='mark-brief'){ii12State.briefRead=true;ii12Refresh()}
 else if(a==='mark-video'){ii12State.videoReviewed=true;ii12Refresh()}
 else if(a==='exercise-choice'){ii12State.exerciseChoice=v;ii12State.feedback='';ii12Refresh()}
 else if(a==='exercise-check'){
  if(!ii12State.exerciseChoice)ii12State.feedback='Pilih satu jawaban dulu.';
  else if(ii12State.exerciseChoice==='B'){ii12State.exerciseCorrect=true;ii12State.feedback='Tepat. Growth adalah sinyal penting tetapi investment decision masih membutuhkan quality-of-revenue, churn, dan valuation checks.'}
  else{ii12State.exerciseCorrect=false;ii12State.feedback='Coba lagi. Investor tidak cukup melihat growth, dan churn tinggi pun belum otomatis berarti return tidak menarik.'}
  ii12Refresh();
 }
 else if(a==='save-teachback'){if(ii12State.teachback.trim().length<35){ii12Warn('Tulis sedikit lebih jelas (minimal 35 karakter).');return}ii12Warn(ii12Save()?'Pemahaman lu disimpan di browser.':'Penyimpanan belum aman.');ii12Refresh()}
 else if(a==='import-source'){
  const source=II12_STARTER.find(s=>s.id===v);if(!source)return;
  if(ii12State.notes.some(n=>n.id==='source-'+v))return;
  ii12State.notes.push({id:'source-'+v,title:source.title,detail:source.detail,interpretation:'',source:source.source,section:source.section,kind:source.kind,asOf:source.asOf,curated:true});
  ii12Refresh();
 }
 else if(a==='remove-note'){ii12State.notes=ii12State.notes.filter(n=>n.id!==v);if(ii12State.slideSourceId===v)ii12State.slideSourceId='';ii12Refresh()}
 else if(a==='choose-source'){ii12State.slideSourceId=v;ii12Refresh();document.getElementById('ii12-slide')?.scrollIntoView({behavior:'smooth',block:'start'})}
 else if(a==='notebook-section'){document.getElementById('ii12-'+v)?.scrollIntoView({behavior:'smooth',block:'start'})}
 else if(a==='save-note'){
  const t=ii12State.draftTitle.trim(),d=ii12State.draftObservation.trim(),url=ii12SafeLink(ii12State.draftUrl),date=ii12State.draftDate;
  if(t.length<5||d.length<12){ii12Warn('Isi judul (min. 5 karakter) dan observasi (min. 12 karakter).');return}
  if(!url){ii12Warn('Tambahkan source URL HTTP/HTTPS yang valid.');return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))){ii12Warn('Isi tanggal sumber yang valid.');return}
  if(ii12State.notes.length>=80){ii12Warn('Notebook penuh (80 notes). Ekspor dan rapikan dulu.');return}
  const note={id:'user-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),title:t,detail:d,interpretation:ii12State.draftInterpretation.slice(0,4000),source:url,section:'User-captured source (not independently verified)',kind:ii12State.draftKind,asOf:date,curated:false};
  ii12State.notes.push(note);
  ii12State.draftTitle='';ii12State.draftObservation='';ii12State.draftInterpretation='';ii12State.draftUrl='';
  ii12Warn('Evidence saved as an unverified research note.');ii12Refresh();
 }
 else if(a==='save-slide'){
  if(ii12State.slideClaim.trim().length<15||ii12State.slideImplication.trim().length<15||!ii12State.notes.some(n=>n.id===ii12State.slideSourceId)){ii12Warn('Isi claim dan implication (min. 15 karakter), lalu pilih evidence tersimpan.');return}
  ii12Warn(ii12Save()?'Slide seed draft disimpan.':'Penyimpanan belum aman.');
  ii12Refresh();
 }
 else if(a==='export-notebook'){ii12Export();}
},true);
document.addEventListener('input',function(e){
 const el=e.target.closest('[data-ii12-field]');if(!el)return;const name=el.dataset.ii12Field;
 if(!Object.prototype.hasOwnProperty.call(ii12Default,name)||typeof ii12Default[name]!=='string')return;
 ii12State[name]=el.value.slice(0,4000);ii12Save();
},true);
document.addEventListener('change',function(e){
 const el=e.target.closest('select[data-ii12-field],input[data-ii12-field]');if(!el)return;
 const name=el.dataset.ii12Field;if(Object.prototype.hasOwnProperty.call(ii12Default,name)&&typeof ii12Default[name]==='string'){ii12State[name]=el.value.slice(0,4000);ii12Save();if(name==='slideSourceId')render();}
},true);
