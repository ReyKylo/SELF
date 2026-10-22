/* SELF Career Prep — Phase 3 guided lessons. Educational numeric checks, NOT uploaded-file assessment. */
(function(){
'use strict';
const URL_CONTENT='./content/career-teaching.json';
const st={data:null,error:'',loading:false,selected:'PE-L01',answer:'',check:null,hints:0,transferChoice:null,transferChecked:false,trackFilter:'PE',owner:null};
let host=null,epoch=0;
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'?u.href:''}catch{return ''}};
function notify(){host?.render?.()}
function reset(owner){st.owner=owner||null;st.answer='';st.check=null;st.hints=0;st.transferChoice=null;st.transferChecked=false;st.trackFilter='PE';st.data=null;st.error='';st.loading=false;epoch++}
function validate(d,base){
 if(d?.version!==1||d?.mode!=='GUIDED_PRACTICE_ONLY'||!Array.isArray(d.lessons)||d.lessons.length<3)throw Error('Materi guided lessons belum valid.');
 const ids=new Set();
 for(const x of d.lessons){
  if(ids.has(x.id))throw Error('Lesson ID duplikat');ids.add(x.id);
  if(!['PE','VC','Consulting'].includes(x.track)||!base?.panels.some(p=>p.id===x.panel_id&&p.track===x.track))throw Error('Referensi evidence salah: '+x.id);
  if(!base?.videos.some(v=>v.id===x.video_id&&v.track===x.track))throw Error('Referensi video salah: '+x.id);
  for(const k of ['analogy','formal_term','definition','case_exhibit','worked_equation','practice','director_challenge','source_notice'])if(!x[k])throw Error('Lesson tidak lengkap '+x.id+': '+k);
  if(!Number.isFinite(x.practice.expected)||!Number.isFinite(x.practice.tolerance)||x.practice.tolerance<0)throw Error('Pemeriksaan numerik tidak valid: '+x.id);
  if(!x.transfer||!Array.isArray(x.transfer.options)||x.transfer.options.length!==3||!Number.isInteger(x.transfer.correct_index)||x.transfer.correct_index<0||x.transfer.correct_index>=3||!x.transfer.question||!x.transfer.explanation)throw Error('Concept-transfer challenge tidak valid: '+x.id);
 }
 return d;
}
async function load(){
 if(st.loading||st.data)return;
 st.loading=true;st.error='';const ver=++epoch;notify();
 try{const res=await fetch(URL_CONTENT,{cache:'no-cache'});if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();if(ver!==epoch)return;st.data=data;
 }catch(e){if(ver===epoch)st.error='Tidak bisa membuka lesson: '+(e?.message||String(e))}
 finally{if(ver===epoch){st.loading=false;notify()}}
}
function button(text,action,id=''){return '<button type="button" class="career-btn" data-teaching-action="'+h(action)+'"'+(id?' data-id="'+h(id)+'"':'')+'>'+h(text)+'</button>'}
function original(p){
 const source=safeUrl(p.source_url),v=p.visual;
 let preview='<div class="learning-document-mark" aria-hidden="true">↗</div><p class="learning-pointer-note">Tidak ada preview original untuk panel ini. Buka sumber asli di halaman yang tertulis, bukan screenshot buatan AI.</p>';
 if(v?.url&&safeUrl(v.url)){
  if(v.type==='image')preview='<div class="learning-real-visual"><a href="'+h(source)+'" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="'+h(safeUrl(v.url))+'" alt="'+h(v.caption||p.title)+'"></a><p class="learning-visual-caption">'+h(v.caption||p.title)+'</p></div>';
  if(v.type==='pdf')preview='<div class="learning-real-visual"><object data="'+h(safeUrl(v.url))+'#page=1&view=FitH" type="application/pdf"><p>PDF tidak bisa ditampilkan dalam browser ini.</p></object><p class="learning-visual-caption">'+h(v.caption||p.title)+'</p></div>';
 }
 return preview+'<span class="learning-label">ORIGINAL EXPERT REFERENCE</span><h3>'+h(p.publisher)+'</h3><p>'+h(p.source_pointer)+'</p>'+
 (source?'<a class="career-btn learning-link" href="'+h(source)+'" target="_blank" rel="noopener noreferrer">Buka sumber asli ↗</a>':'');
}
function block(title,body){return '<section class="learning-explainer"><h3>'+h(title)+'</h3><p>'+h(body)+'</p></section>'}
function render(base){
 if(!st.data&&!st.loading&&!st.error)Promise.resolve().then(load);
 if(st.error)return '<div class="learning-empty" role="alert"><h2>Pelajaran gagal dimuat</h2><p>'+h(st.error)+'</p>'+button('Coba ulang','retry')+'</div>';
 if(!st.data||st.loading)return '<div class="learning-empty" role="status"><h2>Menyiapkan Guided Masterclass…</h2><p>Materi berbasis evidence dan perhitungan case SELF.</p></div>';
 try{validate(st.data,base)}catch(e){return '<div class="learning-empty" role="alert"><p>'+h(e.message)+'</p></div>'}
 const all=st.data.lessons,l=all.find(x=>x.id===st.selected)||all[0];st.selected=l.id;st.trackFilter=l.track;
 const p=base.panels.find(x=>x.id===l.panel_id),v=base.videos.find(x=>x.id===l.video_id);
 const transferResult=st.transferChecked?(st.transferChoice===l.transfer.correct_index?'Tepat. ':'Perlu dikoreksi. ')+l.transfer.explanation:'';
 const feedback=st.check==='empty'?'Masukkan angka dahulu (tanpa pemisah ribuan).':st.check==='wrong'?'Belum cocok. Cek angka dan rumusnya, lalu coba lagi.':st.check==='right'?'Benar untuk hitungan latihan ini. '+l.practice.feedback:'';
 return '<div class="teaching-intro"><span class="learning-label">PHASE 3 · GUIDED PRACTICE, NOT A BLIND EXAM</span><h2>Belajar dengan cara kerja analyst.</h2><p>Perumpamaan → nama profesional → contoh nyata → hitung sendiri → periksa → tantangan dari reviewer.</p></div>'+
 '<div class="teaching-track-switch" aria-label="Pilih bidang">'+['PE','VC','Consulting'].map(t=>'<button type="button" data-teaching-action="track" data-id="'+h(t)+'" aria-pressed="'+(l.track===t)+'" class="career-btn '+(l.track===t?'is-current':'')+'">'+h(t)+'</button>').join('')+'</div>'+ 
 '<div class="learning-reader teaching-reader"><div class="learning-evidence-list" aria-label="Pilih guided lesson">'+all.filter(x=>x.track===l.track).map(x=>'<button type="button" data-teaching-action="select" data-id="'+h(x.id)+'" class="learning-evidence-pick '+(x.id===l.id?'selected':'')+'" aria-pressed="'+(x.id===l.id)+'"><small>'+h(x.id)+' · '+h(x.track)+'</small><strong>'+h(x.title)+'</strong></button>').join('')+'</div>'+
 '<article class="learning-panel teaching-article"><div class="learning-panel-top"><span class="learning-label">'+h(l.track)+' · '+h(l.level)+' · '+h(l.competencies.join(', '))+'</span><h2 id="teaching-title" tabindex="-1">'+h(l.title)+'</h2><p>'+h(l.case_exhibit)+'</p></div>'+
 '<div class="learning-v4"><div class="learning-explainers">'+block('PERUMPAMAAN',l.analogy)+
 '<section class="learning-explainer teaching-term"><h3>YES, INI NAMANYA…</h3><p><strong>'+h(l.formal_term)+'</strong></p><p>'+h(l.definition)+'</p></section>'+
 block('INI KENAPA?',l.expert_why)+block('BATAS PERUMPAMAAN',l.analogy_limit)+
 '</div><aside class="learning-original" aria-label="Referensi profesional asli">'+original(p)+'<p class="learning-pointer-note">'+h(l.source_notice)+'</p>'+
 '<div class="teaching-video"><h4>WATCH → BUILD</h4><p>'+h(v.title)+'</p><p>'+h(l.video_action)+'</p><button type="button" class="career-btn" data-learning="video" data-id="'+h(v.video_id)+'">Buka video terkait ↗</button></div></aside></div>'+
 '<section class="teaching-exercise"><div class="teaching-worked"><span class="learning-label">CONTOH HITUNGAN</span><h3>'+h(l.worked_label)+'</h3><div class="teaching-equation">'+h(l.worked_equation)+'</div><p>'+h(l.worked_result)+'</p></div>'+
 '<div class="teaching-try"><span class="learning-label">GILIRAN LU · LATIHAN BARU</span><h3>'+h(l.practice.question)+'</h3><div class="teaching-controls"><input id="teaching-numeric" aria-label="Jawaban dalam '+h(l.practice.unit)+'" type="number" inputmode="decimal" step="any" placeholder="Isi angka" value="'+h(st.answer)+'"><span>'+h(l.practice.unit)+'</span>'+button('Periksa hitungan','check')+button('Minta petunjuk','hint')+'</div><p role="status" class="teaching-feedback">'+h(feedback)+'</p>'+
 (st.hints?'<div class="teaching-hint"><strong>Petunjuk '+st.hints+' dari 2</strong><p>'+h(st.hints===1?'Mulai dari menentukan angka awal, akhir, dan satuannya.':l.practice.hint)+'</p></div>':'')+'</div>'+
 '<div class="teaching-transfer"><span class="learning-label">LATIHAN BERPIKIR · APPLY THE CONCEPT</span><h3>'+h(l.transfer.question)+'</h3><div class="teaching-options" role="group" aria-label="Pilih keputusan paling kuat">'+l.transfer.options.map((o,i)=>'<button type="button" data-teaching-action="transfer-select" data-id="'+i+'" aria-pressed="'+(st.transferChoice===i)+'" class="teaching-option '+(st.transferChoice===i?'selected':'')+'">'+h(String.fromCharCode(65+i)+'. '+o)+'</button>').join('')+'</div>'+button('Periksa alasan','transfer-check')+'<p class="teaching-feedback" role="status">'+h(transferResult)+'</p><p class="teaching-subnote">Bukan tes blind: jawaban dan penjelasan dibuka setelah lu mencoba.</p></div>'+ 
 '<div class="teaching-defend"><span class="learning-label">BUILD → DEFEND → RECALL</span><p><strong>Yang harus dibuat:</strong> '+h(l.build_output)+'</p><p><strong>Director challenge:</strong> '+h(l.director_challenge)+'</p><p><strong>Besok coba ingat:</strong> '+h(l.recall)+'</p><small>Ini hanya latihan aritmetika terarah. Tidak memeriksa workbook upload, memo, atau kesiapan melamar kerja.</small></div></section></article></div>';
}
function action(e){
 const el=e.target?.closest?.('[data-teaching-action]');if(!el)return false;e.preventDefault();e.stopPropagation();
 const a=el.dataset.teachingAction;
 if(a==='select'){if(st.data?.lessons.some(x=>x.id===el.dataset.id)){st.selected=el.dataset.id;st.answer='';st.check=null;st.hints=0;st.transferChoice=null;st.transferChecked=false;notify()}return true}
 if(a==='track'){const first=st.data?.lessons.find(x=>x.track===el.dataset.id);if(first){st.selected=first.id;st.trackFilter=first.track;st.answer='';st.check=null;st.hints=0;st.transferChoice=null;st.transferChecked=false;notify()}return true}
 if(a==='transfer-select'){const n=Number(el.dataset.id);if(Number.isInteger(n)&&n>=0&&n<=2){st.transferChoice=n;st.transferChecked=false;notify()}return true}
 if(a==='transfer-check'){if(st.transferChoice!==null){st.transferChecked=true;notify()}return true}
 if(a==='retry'){st.error='';void load();return true}
 if(a==='hint'){st.hints=Math.min(2,st.hints+1);notify();return true}
 if(a==='check'){const x=st.data?.lessons.find(x=>x.id===st.selected);if(!x)return true;
  const raw=String(document.querySelector?.('#teaching-numeric')?.value??'').trim();st.answer=raw;
  st.check=raw===''?'empty':Number.isFinite(Number(raw))&&Math.abs(Number(raw)-x.practice.expected)<=x.practice.tolerance?'right':'wrong';notify();return true}
 return false;
}
function input(e){if(e.target?.id!=='teaching-numeric')return false;st.answer=e.target.value;st.check=null;return true}
function fromTrack(track){const x=st.data?.lessons.find(x=>x.track===track);st.selected=x?.id||({PE:'PE-L01',VC:'VC-L01',Consulting:'CO-L01'}[track]||'PE-L01');st.answer='';st.check=null;st.hints=0;st.transferChoice=null;st.transferChecked=false;st.trackFilter=track}
window.SELFCareerTeaching={init(api){host=api},render,action,input,reset,fromTrack,validate,state:st};
})();