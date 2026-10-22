/* SELF Career Prep — curated research, honest provenance, canonical SELF Tasks. */
(function(){
'use strict';
const CONTENT_URL='./content/career-learning.json';
const TABS=[['sprint','Sprint 3 hari'],['masterclass','Guided Masterclass'],['evidence','Expert Evidence'],['videos','YouTube'],['sources','Sumber']];
const TRACKS=[['all','Semua bidang'],['PE','Private Equity'],['VC','Venture Capital'],['Consulting','Consulting']];
const ui={tab:'sprint',track:'all',query:'',type:'all',panel:'PE01',video:null,day:'PE',backPanel:null,backContext:null,
 loading:false,error:'',data:null,owner:null,generation:0,busy:false,taskError:'',playing:false,start:0,workspace:null};
let host=null,core=null,searchTimer=null,requestNumber=0;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}};
const button=(label,action,extra='',primary=false)=>'<button type="button" class="career-btn '+(primary?'career-primary':'')+'" data-learning="'+action+'" '+extra+'>'+h(label)+'</button>';
const external=(label,url,extra='')=>safeUrl(url)?'<a class="career-btn learning-link" href="'+h(safeUrl(url))+'" target="_blank" rel="noopener noreferrer" '+extra+'>'+h(label)+' ↗</a>':'';
const trackName=id=>TRACKS.find(x=>x[0]===id)?.[1]||id;
function focus(selector){Promise.resolve().then(()=>document.querySelector?.(selector)?.focus?.({preventScroll:true}))}
function redraw(selector){host?.render();if(selector)focus(selector)}
function reset(owner){
 clearTimeout(searchTimer);Object.assign(ui,{owner,generation:ui.generation+1,tab:'sprint',track:'all',query:'',type:'all',panel:'PE01',video:null,day:'PE',backPanel:null,backContext:null,busy:false,taskError:'',playing:false,start:0,workspace:null});window.SELFCareerPortfolio?.reset?.(owner);window.SELFCareerTeaching?.reset?.(owner);
}
function ensureOwner(){const owner=host?.state?.()?.user?.id||null;if(ui.owner!==owner)reset(owner);return owner}
function validateData(d){
 if(d?.version!==1||!['sources','panels','videos','sprints'].every(k=>Array.isArray(d[k])))throw Error('Format materi belum valid.');
 for(const key of ['sources','panels','videos','sprints'])if(new Set(d[key].map(x=>x.id)).size!==d[key].length)throw Error('Materi mengandung ID duplikat.');
 const ids=new Set(d.videos.map(x=>x.video_id)),sourceIds=new Set(d.sources.map(x=>'S'+String(x.id).padStart(2,'0')));
 for(const p of d.panels)if(!sourceIds.has(p.source_id)||!p.video_ids.every(v=>ids.has(v)))throw Error('Tautan antar-materi belum lengkap.');
 for(const v of d.videos)if(!/^[\w-]{11}$/.test(v.video_id)||!Number.isFinite(v.duration_seconds))throw Error('Metadata video belum valid.');
 return d;
}
async function load(){
 if(ui.loading)return;
 ui.loading=true;ui.error='';const number=++requestNumber;redraw();
 try{const response=await fetch(CONTENT_URL,{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const data=validateData(await response.json());if(number===requestNumber)ui.data=data}
 catch(err){if(number===requestNumber)ui.error='Materi belum bisa dimuat. '+(err?.message||String(err))}
 finally{if(number===requestNumber){ui.loading=false;redraw()}}
}
function inline(text){return h(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>')}
function markdown(text){
 let result='',list=null;
 const close=()=>{if(list){result+='</'+list+'>';list=null}};
 for(const line of String(text).split('\n')){
  if(!line.trim()){close();continue}
  const item=line.match(/^(\d+\.|-)\s+(.*)$/);
  if(item){const kind=item[1]==='-'?'ul':'ol';if(kind!==list){close();result+='<'+kind+'>';list=kind}result+='<li>'+inline(item[2])+'</li>';continue}
  close();const heading=line.match(/^#{1,4}\s+(.*)$/);result+=heading?'<h3>'+inline(heading[1])+'</h3>':'<p>'+inline(line)+'</p>';
 }
 close();return result;
}
function filtered(kind){const q=ui.query.trim().toLowerCase();return (ui.data?.[kind]||[]).filter(x=>
 (ui.track==='all'||x.track===ui.track)&&(ui.type==='all'||x.classification===ui.type||x.category===ui.type)&&
 (!q||[x.title,x.publisher,x.channel,x.teaches,x.ini_apa,x.useful_exhibit,x.source_pointer,x.id].filter(Boolean).join(' ').toLowerCase().includes(q)))}
function filters(kind){
 const types=[...new Set((ui.data?.[kind]||[]).map(x=>x.classification||x.category).filter(Boolean))];
 return '<div class="learning-filterbar"><label><span>Bidang</span><select id="learning-track" data-learning-filter="track">'+TRACKS.map(([id,title])=>'<option value="'+id+'" '+(ui.track===id?'selected':'')+'>'+h(title)+'</option>').join('')+'</select></label>'+
 '<label class="learning-search"><span>Cari '+(kind==='videos'?'video':kind==='sources'?'sumber':'evidence')+'</span><input type="search" id="learning-search" data-learning-filter="query" value="'+h(ui.query)+'" placeholder="Judul, penerbit, atau topik…"></label>'+
 '<label><span>'+ (kind==='videos'?'Jenis pelajaran':'Jenis sumber')+'</span><select id="learning-type" data-learning-filter="type"><option value="all">Semua jenis</option>'+types.map(t=>'<option value="'+h(t)+'" '+(ui.type===t?'selected':'')+'>'+h(t)+'</option>').join('')+'</select></label>'+
 button('Reset','clear')+'</div>';
}
function noMatch(){return '<div class="learning-empty" role="status"><h3>Tidak ada yang cocok.</h3><p>Coba kata lain atau tampilkan semua bidang dan jenis.</p>'+button('Reset filter','clear')+'</div>'}
function videoButton(videoId){const v=ui.data.videos.find(v=>v.video_id===videoId);return v?button(v.title+' · '+v.duration,'video','data-id="'+h(v.video_id)+'"'):''}
function evidenceButton(id){const p=ui.data.panels.find(p=>p.id===id);return p?button(p.title,'panel','data-id="'+h(id)+'"'):''}
function block(title,body){return '<section class="learning-explainer"><h3>'+h(title)+'</h3>'+body+'</section>'}
function originalEvidence(p){
 const v=p.visual,origin=external('Buka sumber asli',p.source_url);
 if(!v||!safeUrl(v.url))return '<div class="learning-document-mark" aria-hidden="true">'+(host.icon?.('book',34)||'↗')+'</div><span class="learning-label">SOURCE POINTER ONLY</span><p class="learning-pointer-note">Belum ada bukti visual yang dapat ditampilkan langsung. Buka sumber asli di bagian yang tertera — jangan anggap panel ini screenshot verified.</p>';
 const url=h(safeUrl(v.url));
 if(v.type==='image')return '<div class="learning-real-visual"><a href="'+h(safeUrl(p.source_url)||'')+'" target="_blank" rel="noopener noreferrer" aria-label="Buka sumber asli '+h(p.publisher)+'"><img src="'+url+'" loading="lazy" alt="'+h(v.caption)+'"></a><p class="learning-visual-caption">'+h(v.caption)+'</p></div>';
 if(v.type==='pdf')return '<div class="learning-real-visual"><object data="'+url+'#page=1&view=FitH" type="application/pdf" aria-label="'+h(v.caption)+'"><p>Browser tidak dapat menampilkan PDF ini. '+origin+'</p></object><p class="learning-visual-caption">'+h(v.caption)+'</p></div>';
 return '';
}
function evidence(){
 const rows=filtered('panels');const p=rows.find(p=>p.id===ui.panel)||rows[0];if(p)ui.panel=p.id;
 return filters('panels')+'<p class="learning-count" role="status">'+rows.length+' dari '+ui.data.panels.length+' evidence · '+h(trackName(ui.track))+'</p>'+
 (!p?noMatch():'<div class="learning-reader"><div class="learning-evidence-list" aria-label="Pilih evidence">'+rows.map(x=>
 '<button type="button" data-learning="panel-select" data-id="'+h(x.id)+'" class="learning-evidence-pick '+(p.id===x.id?'selected':'')+'" aria-pressed="'+(p.id===x.id)+'"><small>'+h(x.id)+' · '+h(x.publisher)+'</small><strong>'+h(x.title)+'</strong></button>').join('')+'</div>'+
 '<article class="learning-panel" aria-labelledby="learning-evidence-title"><div class="learning-panel-top"><span class="learning-label">'+h(p.track)+' · '+h(p.classification)+'</span><h2 id="learning-evidence-title" tabindex="-1">'+h(p.title)+'</h2></div>'+
 '<div class="learning-v4"><div class="learning-explainers">'+block('INI APA','<p>'+h(p.ini_apa)+'</p>')+block('INI KENAPA','<p>'+h(p.ini_kenapa)+'</p>')+
 block('CARA ACHIEVE','<ol>'+p.cara_achieve.map(step=>'<li>'+h(step)+'</li>').join('')+'</ol>')+
 block('ANALISIS AI','<p>'+h(p.analisis_ai)+'</p>')+'</div>'+
 '<aside class="learning-original" aria-label="Sumber asli">'+originalEvidence(p)+
 '<span class="learning-label">EVIDENCE / '+(p.visual?'PREVIEW EKSTERNAL':'SOURCE LINK')+'</span><h3>'+h(p.source_title)+'</h3><p>'+h(p.publisher)+'</p><div class="learning-source-location"><strong>Bagian untuk dipelajari</strong><p>'+h(p.visual?.pointer||p.source_pointer)+'</p></div>'+
 (!p.visual?'<p class="learning-pointer-note">Screenshot belum tersedia untuk panel ini.</p>':'<p class="learning-pointer-note">Preview dari penerbit; mungkin diblokir browser. Gambar tidak di-host ulang di SELF.</p>')+
 external('Buka sumber asli',p.source_url)+
 '<details class="learning-disclosure"><summary>URL, verifikasi & akses</summary><p class="learning-url">'+h(p.source_url)+'</p><p>Diperiksa '+h(p.verified_on)+'. Klasifikasi: '+h(p.classification)+'. '+h(p.rights_note)+'</p></details></aside></div>'+
 '<div class="learning-next">'+block('WATCH · Pelajaran terkait','<div class="learning-related">'+p.video_ids.map(videoButton).join('')+'</div>')+
 block('REVIEW · Cek pemahaman','<p>'+h(p.review)+'</p>')+'</div></article></div>');
}
function seconds(chapter){const match=String(chapter).match(/^(\d{1,2}:\d{2}(?::\d{2})?)/);return match?match[1].split(':').reduce((a,n)=>a*60+Number(n),0):0}
function videos(){
 const rows=filtered('videos');const selected=ui.data.videos.find(x=>x.video_id===ui.video);const v=selected&&rows.includes(selected)?selected:null;
 return filters('videos')+'<p class="learning-count" role="status">'+rows.length+' dari '+ui.data.videos.length+' video · judul, channel & durasi dari metadata YouTube</p>'+
 (ui.backPanel?'<div class="learning-back">'+button('← Kembali ke evidence','back-evidence')+'</div>':'')+
 (v?'<article class="learning-video-detail"><div class="learning-panel-top"><span class="learning-label">'+h(v.category)+' · '+h(v.duration)+'</span><h2 id="learning-video-title" tabindex="-1">'+h(v.title)+'</h2><p>'+h(v.channel)+'</p></div>'+
 (ui.playing?'<div class="learning-player"><iframe src="https://www.youtube-nocookie.com/embed/'+h(v.video_id)+'?start='+ui.start+'" title="'+h(v.title)+'" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'+button('Tutup pemutar','stop'):
 '<div class="learning-video-cover"><span aria-hidden="true">▶</span><p>Video asli dari '+h(v.channel)+'</p>'+button('Putar di sini','play','',true)+'</div>')+
 '<div class="learning-video-actions">'+external('Tonton di YouTube',v.url)+(ui.playing?'<p>Jika pemutar dibatasi, gunakan tautan YouTube.</p>':'')+'</div>'+
 '<div class="learning-video-body">'+block('Yang dipelajari','<p>'+h(v.teaches)+'</p>')+block('DO · Langsung praktik','<p>'+h(v.exercise)+'</p>')+
 '<details class="learning-disclosure"><summary>Level, pengajar & alasan dipilih</summary><p><strong>Prasyarat:</strong> '+h(v.prerequisites)+'</p><p><strong>Pengajar:</strong> '+h(v.instructor_credentials)+'</p><p><strong>Alasan:</strong> '+h(v.selection_reason)+'</p><p>'+h(v.screening)+'. Metadata diperiksa '+h(v.verified_on)+'. Bukan bukti semua menit ditonton.</p></details>'+
 (v.chapters.length?'<details class="learning-disclosure"><summary>Bab terverifikasi · '+v.chapters.length+' bagian</summary><div class="learning-chapters">'+v.chapters.map(c=>button(c,'chapter','data-seconds="'+seconds(c)+'"')).join('')+'</div><small>Bab dari deskripsi asli penerbit, bukan timestamp perkiraan.</small></details>':'<p class="learning-muted">Bab belum terverifikasi. Tidak ada timestamp perkiraan.</p>')+'</div></article>':'')+
 (!rows.length?noMatch():'<div class="learning-video-list">'+rows.map(x=>'<button type="button" class="learning-video-row '+(v?.video_id===x.video_id?'selected':'')+'" data-learning="video-select" data-id="'+h(x.video_id)+'" aria-pressed="'+(v?.video_id===x.video_id)+'"><span class="learning-play-icon" aria-hidden="true">▶</span><span><small>'+h(x.category)+' · '+h(x.track)+'</small><strong>'+h(x.title)+'</strong><small>'+h(x.channel)+'</small></span><span class="learning-duration">'+h(x.duration)+'</span></button>').join('')+'</div>');
}
function sourceStatus(x){
 if(x.verification==='index_only_individual_case_unverified')return 'Indeks saja · kasus belum diverifikasi';
 if(x.verification==='web_index_content_verified_direct_fetch_403')return 'Konten lewat indeks web · akses langsung 403';
 if(x.verification==='pdf_bytes_retrieved_not_visually_reviewed')return 'PDF terambil · visual belum diperiksa';
 return 'Halaman terambil · screening judul';
}
function sources(){const rows=filtered('sources');return filters('sources')+
 '<p class="learning-count" role="status">'+rows.length+' dari '+ui.data.sources.length+' sumber · tidak ada duplikat URL</p>'+
 '<p class="learning-muted">41 sumber diaudit aksesnya; pembahasan mendalam diprioritaskan untuk panel sprint. Label ini bukan endorsement atau bukti semua exhibit sudah diperiksa.</p>'+
 (rows.length?'<div class="learning-source-list">'+rows.map(x=>'<article class="learning-source-row"><div><small>'+h(x.track)+' · '+h(x.publisher)+' · '+h(x.classification)+'</small><h3>'+h(x.title)+'</h3><p>'+h(x.useful_exhibit)+'</p><span class="learning-source-status">'+h(sourceStatus(x))+'</span><details class="learning-disclosure"><summary>Detail akses</summary><p>'+h(x.access_note)+'</p><p>Diperiksa '+h(x.verified_on)+'</p><p class="learning-url">'+h(x.url)+'</p></details></div>'+external('Buka',x.url,'aria-label="Buka '+h(x.title)+'"')+'</article>').join('')+'</div>':noMatch());}
function marker(id){return '[SELF learning sprint:v1:'+id+']'}
function existingTask(id){const owner=ensureOwner();return (host.state()?.tasks||[]).find(t=>t.user_id===owner&&String(t.notes||'').includes(marker(id)))}
const STARTER_ASSETS={
 PE:{filename:'Day1_PE_LBO_Starter.xlsx',url:'./content/career-kits/PE_LBO_Starter.xlsx.b64'},
 VC:{filename:'Day2_VC_Investment_Starter.xlsx',url:'./content/career-kits/VC_Investment_Starter.xlsx.b64'},
 Consulting:{filename:'Day3_Consulting_Profitability_Starter.xlsx',url:'./content/career-kits/Consulting_Profitability_Starter.xlsx.b64'}
};
function blobDownload(data,name,type){
 const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function downloadStarter(id,kind){
 const day=ui.data?.sprints.find(d=>d.id===id);
 if(!day)throw Error('Case tidak ditemukan.');
 if(kind==='xlsx'){
  const asset=STARTER_ASSETS[id];if(!asset)throw Error('Workbook belum tersedia.');
  const r=await fetch(asset.url,{cache:'no-cache'});if(!r.ok)throw Error('File belum tersedia ('+r.status+').');
  const txt=(await r.text()).trim();if(!/^[A-Za-z0-9+/=]+$/.test(txt))throw Error('Konten file tidak valid.');
  const bin=atob(txt);if(bin.length<2500||bin.charCodeAt(0)!==0x50||bin.charCodeAt(1)!==0x4b)throw Error('Bukan workbook XLSX yang valid.');
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
  blobDownload(bytes,asset.filename,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return;
 }
 if(kind==='pdf'){
  const bytes=window.SELFCareerKits?.pdfBrief?.(id);if(!bytes||bytes.length<1500)throw Error('Case PDF not available.');
  blobDownload(bytes,'SELF_'+id+'_Case_Brief.pdf','application/pdf');return;
 }
 if(kind==='pptx'){
  if(id!=='Consulting')throw Error('Deck is only for Consulting Day 3.');
  const bytes=window.SELFCareerKits?.makeConsultingDeck?.();if(!bytes||bytes.length<5000)throw Error('Editable deck not available.');
  blobDownload(bytes,'SELF_Consulting_Executive_Deck_Template.pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation');return;
 }
 if(kind==='brief'){
  const brief='# '+day.title+' — SELF Career Prep\n\n**Independent simulated case — NOT a real investment or client mandate.**\n\n'+day.lesson;
  blobDownload(brief,'SELF_'+id+'_Case_Brief.md','text/markdown;charset=utf-8');return;
 }
 if(kind==='memo'){
  const memo='# '+day.title+' — YOUR INDEPENDENT RECOMMENDATION\n\n**SIMULATED EXERCISE — MY OWN WORK**\n\n## Decision\n[Invest, Pass, Diligence, or strategic recommendation]\n\n## Key evidence\n[Link to workbook and verify every number]\n\n## Drivers and scenarios\n[Base, downside, alternatives]\n\n## Risks and unanswered diligence\n[State uncertainty]\n\n## Next steps\n[Conditions and execution]\n\n## Sources and case limitations\n[Expert examples studied and simulated-data disclosure]\n';
  blobDownload(memo,'SELF_'+id+'_Decision_Template.md','text/markdown;charset=utf-8');return;
 }
 throw Error('Jenis file belum didukung.');
}
function professionalBenchmark(day){
 const p=day.professional_standard;if(!p)return '';
 return '<section class="learning-recruiter-standard"><div class="learning-label">RECRUITER-GRADE CASE / NOT A CERTIFICATION</div><h3>'+h(p.deliverable_title)+'</h3>'+
 '<p class="learning-director-prompt">'+h(p.employer_question)+'</p>'+
 '<div class="learning-pro-divider"><div><h4>What the reviewer should be able to inspect</h4><p>'+h(p.recruiter_output)+'</p></div>'+
 '<div><h4>Benchmark against real expert work</h4><p>'+h(p.source_status)+'</p>'+external('Original benchmark',p.source_url)+'</div></div>'+
 '<details class="learning-quality-details"><summary>Quality gate — what makes this more than a student assignment</summary><ol>'+p.qualities.map(s=>'<li>'+h(s)+'</li>').join('')+'</ol></details>'+
 '<details class="learning-quality-details"><summary>Investment Director / Partner / Client challenges</summary><ol>'+p.pushback.map(s=>'<li>'+h(s)+'</li>').join('')+'</ol></details>'+
 '<p class="learning-standard-disclaimer">SELF provides educational assessment criteria. No private firm endorsement, executed deal, or hiring outcome is implied.</p></section>';
}
function publicCase(day){
 const u=day.upgrade_case;if(!u)return '';
 return '<details class="learning-next-case"><summary>Next-level independent case · real public sources (after sprint)</summary>'+
 '<h3>'+h(u.title)+'</h3><p>'+h(u.objective)+'</p>'+
 '<div class="learning-next-case-sources">'+u.sources.map(x=>external(x.name,x.url)).join('')+'</div>'+
 '<h4>What an employer should be able to question</h4><ul>'+u.required.map(s=>'<li>'+h(s)+'</li>').join('')+'</ul>'+
 '<p class="learning-standard-disclaimer">No access to private company records, no representation of closed deals, no claim that this is an official client engagement.</p></details>';
}
function sprint(){
 const days=ui.data.sprints;const day=days.find(d=>d.id===ui.day)||days[0];const task=existingTask(day.id);
 return '<div class="learning-sprint-intro"><span class="learning-label">LEARN BY BUILDING</span><h2>Tiga proyek. Bukti yang bisa lu tunjukkan.</h2><p>Belajar dari contoh asli, tonton bagian yang relevan, lalu langsung bikin. Target 6–8 jam per hari; boleh lanjut besok kalau butuh waktu.</p></div>'+
 '<div class="learning-day-tabs" aria-label="Pilih hari sprint">'+days.map(d=>'<button type="button" class="learning-day '+(d.id===day.id?'selected':'')+'" data-learning="day" data-id="'+h(d.id)+'" aria-pressed="'+(d.id===day.id)+'"><span>HARI '+d.day+'</span><strong>'+h(d.title)+'</strong><small>'+h(d.output)+'</small></button>').join('')+'</div>'+
 '<article class="learning-day-detail"><div class="learning-assignment-head"><div><span class="learning-label">ASSIGNMENT · HARI '+day.day+'</span><h2 id="learning-day-title" tabindex="-1">'+h(day.title)+'</h2><p>'+h(day.summary)+'</p></div><div>'+button(ui.busy?'Memeriksa tugas…':task?'Buka task di My Work':'Tambah proyek ke My Work','task','data-id="'+h(day.id)+'" '+(ui.busy?'disabled':''),true)+'<small class="learning-task-note">'+(task?'Task SELF yang sama; status mengikuti My Work.':'Task dibuat saat lu memilih tombol ini.')+'</small></div></div>'+
 (ui.taskError?'<p class="learning-task-error" role="alert">'+h(ui.taskError)+'</p>':'')+
 '<div class="learning-workflow"><section><h3>01 · SEE</h3><p>Pelajari cara expert menyusun keputusan.</p><div class="learning-related">'+day.panels.map(evidenceButton).join('')+'</div></section><section><h3>02 · WATCH</h3><p>Tonton berurutan. Setelah tiap video, kerjakan hasilnya.</p><div class="learning-related">'+day.videos.map(id=>videoButton(ui.data.videos.find(v=>v.id===id)?.video_id)).join('')+'</div></section></div>'+
 professionalBenchmark(day)+
 '<div class="teaching-sprint-launch">'+button('Belajar konsep case ini →','start-lessons','data-track="'+h(day.id)+'"',true)+'</div>'+
 '<div class="learning-kit-row" aria-label="Download starter kit">'+button('↓ Workbook XLSX','download','data-id="'+h(day.id)+'" data-kind="xlsx"')+button('↓ Case brief PDF','download','data-id="'+h(day.id)+'" data-kind="pdf"')+button('↓ Memo / recommendation','download','data-id="'+h(day.id)+'" data-kind="memo"')+(day.id==='Consulting'?button('↓ Editable 6-slide PPTX','download','data-id="'+h(day.id)+'" data-kind="pptx"'):'')+button(ui.workspace===day.id?'Tutup private workspace':'Buka private workspace','workspace','data-id="'+h(day.id)+'"')+'</div>'+
 (ui.workspace===day.id?(window.SELFCareerPortfolio?.render?.(day.id)||''):'')+
 publicCase(day)+
 '<section class="learning-lesson"><h3>03 · DO → BUILD → REVIEW</h3><p class="learning-fixture-label">Data fiktif untuk latihan independen. Bukan transaksi atau proyek klien nyata.</p>'+markdown(day.lesson)+'</section></article>'+
 '<div class="learning-download"><a class="career-btn learning-link" href="./content/portfolio-sprint.md" download="SELF_Portfolio_Sprint.md">Download playbook lengkap ↓</a><p>Workbook, memo, dan deck dibuat sendiri dari latihan. Materi tidak menandakan pengalaman deal nyata.</p></div>';
}
function render(){
 ensureOwner();if(!ui.data&&!ui.loading&&!ui.error)Promise.resolve().then(load);
 const tabs='<div class="learning-tabs" aria-label="Career Prep sections">'+TABS.map(([key,label])=>'<button type="button" data-learning="tab" data-tab="'+key+'" class="'+(ui.tab===key?'active':'')+'" aria-pressed="'+(ui.tab===key)+'">'+label+'</button>').join('')+'</div>';
 let body=ui.error?'<div class="learning-empty" role="alert"><h2>Materi belum terbuka.</h2><p>'+h(ui.error)+'</p>'+button('Coba lagi','retry')+'</div>':!ui.data?'<div class="learning-empty" role="status"><h2>Membuka materi…</h2><p>Memuat contoh expert dan urutan latihan.</p></div>':ui.tab==='sprint'?sprint():ui.tab==='masterclass'?(window.SELFCareerTeaching?.render?.(ui.data)||'<p>Guided lessons belum tersedia.</p>'):ui.tab==='evidence'?evidence():ui.tab==='videos'?videos():sources();
 return '<section class="learning-workspace">'+tabs+body+'</section>';
}
async function taskId(owner,id){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('SELF:learning:v1:'+owner+':'+id)));bytes[6]=(bytes[6]&15)|128;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
async function projectTask(id){
 const day=ui.data?.sprints.find(x=>x.id===id),owner=ensureOwner(),generation=ui.generation;
 if(!day||!owner||ui.busy)return;
 const current=()=>host.state()?.user?.id===owner&&ui.owner===owner&&ui.generation===generation;
 ui.busy=true;ui.taskError='';redraw();let confirmed=null;
 try{
  const key=await taskId(owner,id);if(!current())return;
  const rows=await host.request('/rest/v1/tasks?id=eq.'+key+'&select=*&limit=1');if(!current())return;
  confirmed=rows.find(t=>t.user_id===owner)||existingTask(id);
  if(!confirmed){
   try{confirmed=await host.insert('tasks',{id:key,title:day.task_title,description:day.task_description,notes:marker(id),status:'todo',priority:'normal'})}
   catch(err){
    if(!current())return;
    // A conflict or lost POST acknowledgement may already have created the same canonical task.
    try{const found=await host.request('/rest/v1/tasks?id=eq.'+key+'&select=*&limit=1');confirmed=found.find(t=>t.user_id===owner)}catch{/* Surface uncertainty, never invent success. */}
    if(!confirmed)throw Error('Belum bisa memastikan penyimpanan. Coba lagi untuk memeriksa task yang sama sebelum membuatnya. '+(err?.message||String(err)));
   }
  }
  if(!current())return;
  if(!confirmed?.id||confirmed.user_id!==owner)throw Error('Server belum mengonfirmasi task milik akun ini.');
  const state=host.state();if(!state.tasks.some(t=>t.id===confirmed.id))state.tasks.push(confirmed);
  host.notify('Proyek siap di My Work');host.openTask(confirmed.id);
 }catch(err){if(current()){ui.taskError='Proyek belum terbuka: '+(err?.message||String(err));host.notify(ui.taskError,true)}}
 finally{if(current()){ui.busy=false;redraw(confirmed?'[data-task-field="title"]':'[data-learning="task"]')}}
}
function switchTab(tab){clearTimeout(searchTimer);ui.tab=tab;ui.query='';ui.type='all';ui.playing=false;ui.taskError=''}
async function action(event){
 if(await window.SELFCareerPortfolio?.action?.(event))return true;
 if(window.SELFCareerTeaching?.action?.(event))return true;
 const b=event.target.closest?.('[data-learning]');if(!b)return false;
 event.preventDefault();event.stopPropagation();ensureOwner();const action=b.dataset.learning;
 if(action==='download'){downloadStarter(b.dataset.id,b.dataset.kind).then(()=>host?.notify?.('File berhasil disiapkan untuk download')).catch(err=>host?.notify?.('Download gagal: '+(err?.message||String(err)),true));return true}
 if(action==='start-lessons'){ui.tab='masterclass';window.SELFCareerTeaching?.fromTrack?.(b.dataset.track);redraw();return true}
 if(action==='workspace'){if(ui.workspace===b.dataset.id){ui.workspace=null;redraw()}else{ui.workspace=b.dataset.id;void window.SELFCareerPortfolio?.open?.(b.dataset.id);redraw()}return true}
 if(action==='retry'){void load();return true}
 if(action==='task'){await projectTask(b.dataset.id);return true}
 if(action==='tab'){ui.backPanel=null;ui.backContext=null;switchTab(b.dataset.tab);redraw('[data-learning="tab"][data-tab="'+ui.tab+'"]');return true}
 if(action==='clear'){clearTimeout(searchTimer);ui.query='';ui.track='all';ui.type='all';redraw('#learning-search');return true}
 if(action==='day'){ui.day=b.dataset.id;ui.workspace=null;ui.taskError='';redraw('#learning-day-title');return true}
 if(action==='panel'||action==='panel-select'||action==='back-evidence'){
  const id=action==='back-evidence'?ui.backPanel:b.dataset.id;const p=ui.data?.panels.find(x=>x.id===id);if(!p)return true;
  ui.panel=p.id;if(action!=='panel-select'){const back=action==='back-evidence'?ui.backContext:null;switchTab('evidence');ui.track=p.track;if(back){ui.track=back.track;ui.query=back.query;ui.type=back.type}}ui.backPanel=null;ui.backContext=null;redraw('#learning-evidence-title');return true;
 }
 if(action==='video'||action==='video-select'){
  const v=ui.data?.videos.find(x=>x.video_id===b.dataset.id);if(!v)return true;
  const returnPanel=ui.tab==='evidence'?ui.panel:ui.backPanel;const back=ui.tab==='evidence'?{track:ui.track,query:ui.query,type:ui.type}:ui.backContext;switchTab('videos');ui.video=v.video_id;ui.backPanel=returnPanel;ui.backContext=back;ui.start=0;ui.track=v.track;redraw('#learning-video-title');return true;
 }
 if(action==='play'||action==='chapter'){ui.playing=true;ui.start=action==='chapter'?Number(b.dataset.seconds)||0:0;redraw('[data-learning="stop"]');return true}
 if(action==='stop'){ui.playing=false;redraw('[data-learning="play"]');return true}
 return true;
}
function input(event){
 if(window.SELFCareerPortfolio?.input?.(event))return true;
 if(window.SELFCareerTeaching?.input?.(event))return true;
 const node=event.target;if(node?.dataset?.learningFilter!=='query')return false;
 const value=node.value,position=node.selectionStart,owner=ui.owner,generation=ui.generation;clearTimeout(searchTimer);
 searchTimer=setTimeout(()=>{if(owner!==ui.owner||generation!==ui.generation)return;ui.query=value;ui.playing=false;host.render();const search=document.querySelector?.('#learning-search');search?.focus?.({preventScroll:true});search?.setSelectionRange?.(position,position)},160);return true;
}
function change(event){if(window.SELFCareerPortfolio?.change?.(event))return true;const node=event.target,key=node?.dataset?.learningFilter;if(!['track','type'].includes(key))return false;ensureOwner();ui[key]=node.value;ui.playing=false;redraw('#'+node.id);return true}
window.SELFCareerLearning={init(api){host=api.host;core=api.career;window.SELFCareerPortfolio?.init?.(host);window.SELFCareerTeaching?.init?.(host)},render,action,input,change,reset,load,ui,taskId};
})();
