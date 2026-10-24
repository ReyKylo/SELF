/* SELF Career Prep, Lesson Loop v2: Tebak → Tonton → Lihat → Format pro → Contoh → Giliran lu → Defend → Kunci.
   Lessons are data (content/career-lessons-v2.json). Visuals are SELF-native (career-visuals.js); practice is checked by the safe formula engine (career-grid.js).
   Progress is device-local. Nothing here reads or grades uploaded files; it is guided practice, not an assessment. */
(function(root){
'use strict';
const URL_CONTENT='./content/career-lessons-v2.json';
const BEATS=[['predict','Tebak'],['watch','Tonton'],['see','Lihat'],['pro','Format pro'],['worked','Contoh'],['ladder','Giliran lu'],['defend','Defend'],['lock','Kunci']];
const S={data:null,state:'idle',error:'',owner:null,views:{}};
let host=null;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G=()=>root.SELFGrid,V=()=>root.SELFVisuals;
const rerender=()=>host?.render?.();
const key=id=>'self.lesson.v2.'+(S.owner||'anon')+'.'+id;

function status(){return S.state}
async function load(){
 if(S.state==='loading'||S.state==='ready')return;
 S.state='loading';S.error='';
 try{
  const res=await fetch(URL_CONTENT,{cache:'no-cache'});if(!res.ok)throw new Error('HTTP '+res.status);
  const d=await res.json();validate(d);S.data=d;S.state='ready';
 }catch(e){S.state='error';S.error=e?.message||String(e)}
 rerender();
}
function validate(d){
 if(d?.version!==2||d.mode!=='GUIDED_PRACTICE_ONLY'||!Array.isArray(d.lessons))throw new Error('Lesson v2 tidak valid');
 for(const l of d.lessons)for(const k of ['predict','watch','see_it','pro_layout','worked','ladder','defend','lock_in','source_notice'])if(!l[k])throw new Error('Lesson '+l.id+' kurang: '+k);
}
const lessonFor=id=>S.data?.lessons.find(l=>l.base_id===id||l.id===id)||null;
const has=id=>!!lessonFor(id);
function reset(owner){S.owner=owner||null;S.views={}}
function init(api){host=api}

/* ---------- per-lesson view state ---------- */
function blankRung(){return {raw:'',res:null,attempts:0,hints:0,revealed:false,ok:false}}
function blankView(l){
 return {beat:0,done:[],predict:null,wf:0,wfActive:-1,table:false,callout:null,worked:0,playing:false,rungs:Object.fromEntries(l.ladder.map(r=>[r.rung,blankRung()])),
  red:{picked:null,found:false},defend:{text:'',shown:false,checks:[false,false,false]},flipped:{},carded:false,completed:false};
}
function viewOf(l){
 if(S.views[l.id])return S.views[l.id];
 const v=blankView(l);
 try{const saved=JSON.parse(root.localStorage?.getItem(key(l.id))||'null');
  if(saved&&typeof saved==='object'){
   if(Number.isInteger(saved.beat)&&saved.beat>=0&&saved.beat<BEATS.length)v.beat=saved.beat;
   if(Array.isArray(saved.done))v.done=saved.done.filter(n=>Number.isInteger(n)&&n>=0&&n<BEATS.length);
   if(Number.isInteger(saved.predict)&&saved.predict>=0&&saved.predict<l.predict.options.length)v.predict=saved.predict;
   for(const r of l.ladder){const s=saved.rungs?.[r.rung];if(s)v.rungs[r.rung]={...blankRung(),ok:!!s.ok,attempts:Math.max(0,s.attempts|0),hints:Math.min(3,Math.max(0,s.hints|0)),revealed:!!s.revealed}}
   if(saved.red?.found)v.red.found=true;
   if(typeof saved.defendText==='string')v.defend.text=saved.defendText.slice(0,4000);
   v.carded=!!saved.carded;v.completed=!!saved.completed;
  }
 }catch{}
 return S.views[l.id]=v;
}
function persist(l,v){
 try{root.localStorage?.setItem(key(l.id),JSON.stringify({beat:v.beat,done:v.done,predict:v.predict,rungs:Object.fromEntries(Object.entries(v.rungs).map(([k,r])=>[k,{ok:r.ok,attempts:r.attempts,hints:r.hints,revealed:r.revealed}])),red:{found:v.red.found},defendText:v.defend.text,carded:v.carded,completed:v.completed}))}catch{}
}
/* For Next-up and the Skill Map: what was actually done, with no invented percentages. */
function progress(owner,id){
 const prev=S.owner;S.owner=owner||S.owner;
 try{const l=lessonFor(id);if(!l)return null;const v=viewOf(l);
  const rungs=l.ladder.map(r=>({rung:r.rung,ok:v.rungs[r.rung].ok,independent:v.rungs[r.rung].ok&&!v.rungs[r.rung].revealed&&v.rungs[r.rung].hints<3}));
  return {id:l.id,completed:v.completed,beat:v.beat,rungs,predicted:v.predict!=null}}
 finally{S.owner=prev}
}

/* ---------- rendering ---------- */
const btn=(label,action,extra='',cls='career-btn')=>'<button type="button" class="'+cls+'" data-lesson="'+h(action)+'" '+extra+'>'+label+'</button>';
const label=t=>'<span class="learning-label">'+h(t)+'</span>';
function stepper(l,v){
 return '<nav class="ll-steps" aria-label="Langkah lesson">'+BEATS.map(([k,t],i)=>'<button type="button" class="ll-step'+(i===v.beat?' is-current':'')+(v.done.includes(i)&&i!==v.beat?' is-done':'')+'" data-lesson="beat" data-n="'+i+'" '+(i===v.beat?'aria-current="step"':'')+'><span class="ll-step-n" aria-hidden="true">'+i+'</span><span>'+h(t)+'</span></button>').join('')+'</nav>';
}
function render(id,ctx={}){
 const l=lessonFor(id);if(!l)return '';
 const v=viewOf(l),beat=BEATS[v.beat][0];
 const body={predict:bPredict,watch:bWatch,see:bSee,pro:bPro,worked:bWorked,ladder:bLadder,defend:bDefend,lock:bLock}[beat](l,v,ctx);
 return '<div class="ll" data-lesson-root="'+h(l.id)+'"><header class="learning-panel-top ll-head">'+label('LESSON LOOP · '+l.track+' · '+l.competencies.join(', ')+' · ±'+l.minutes+' menit')+'<h2 id="teaching-title" tabindex="-1">'+h(l.title)+'</h2></header>'+
  stepper(l,v)+'<section class="ll-beat" aria-labelledby="ll-beat-h">'+body+'</section>'+
  '<footer class="ll-foot"><div class="ll-nav">'+btn('← Sebelumnya','prev',v.beat===0?'disabled':'')+btn(v.beat===BEATS.length-1?'Selesai ✓':'Lanjut →','next','','career-btn is-current')+'</div><p class="learning-pointer-note">'+h(l.source_notice)+'</p></footer></div>';
}
const beatHead=(n,title,sub)=>'<div class="ll-beat-head">'+label('LANGKAH '+n+' · '+BEATS[n][1].toUpperCase())+'<h3 id="ll-beat-h">'+h(title)+'</h3>'+(sub?'<p>'+h(sub)+'</p>':'')+'</div>';

function bPredict(l,v){
 const p=l.predict;
 return beatHead(0,p.question,'Pilih dulu sebelum belajar. Tebakan disimpan dan dibuka lagi di langkah terakhir.')+
  '<div class="ll-options" role="group" aria-label="Pilih tebakan">'+p.options.map((o,i)=>'<button type="button" class="ll-option'+(v.predict===i?' is-picked':'')+'" data-lesson="predict" data-n="'+i+'" aria-pressed="'+(v.predict===i)+'">'+h(o)+'</button>').join('')+'</div>'+
  '<p class="ll-note" role="status">'+(v.predict==null?'Belum memilih. Menebak salah itu bagian dari belajar.':'Tebakan tersimpan. Sekarang tonton, lalu lihat angkanya.')+'</p>'+
  '<p class="ll-why">Kenapa tebak dulu? Menebak sebelum belajar membuat penjelasan berikutnya lebih nempel dan memperlihatkan salah kaprah yang kebawa dari awal.</p>';
}
function bWatch(l,v,ctx){
 const w=l.watch,vid=ctx.base?.videos?.find(x=>x.id===w.video_id);
 if(!vid)return beatHead(1,'Video tidak ditemukan','Referensi video hilang dari data Career Prep.');
 const q='?rel=0'+(w.segment_verified&&Number.isFinite(w.start)?'&start='+Math.floor(w.start):'')+(w.segment_verified&&Number.isFinite(w.end)?'&end='+Math.floor(w.end):'');
 const player=v.playing?'<div class="ll-player"><iframe src="https://www.youtube-nocookie.com/embed/'+h(vid.video_id)+q+'" title="'+h(vid.title)+'" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe></div>':
  '<div class="ll-poster"><strong>'+h(vid.title)+'</strong><span>'+h(vid.channel)+' · '+h(vid.duration)+'</span>'+btn('▶ Putar di sini','play','','career-btn is-current')+'</div>';
 return beatHead(1,'Tonton, dengan tiga hal yang dicari','Satu video, tiga pertanyaan. Catat jawabannya sambil nonton.')+
  '<div class="ll-watch">'+player+'<div><ol class="ll-prompts">'+w.watch_for.map(x=>'<li>'+h(x)+'</li>').join('')+'</ol>'+
  '<p class="ll-note">'+(w.segment_verified?'Segmen terverifikasi: '+h(w.start)+'s sampai '+h(w.end)+'s.':'<strong>Segmen belum diverifikasi.</strong> '+h(w.note))+'</p>'+
  '<a class="career-btn" href="'+h(vid.url)+'" target="_blank" rel="noopener noreferrer">Buka di YouTube ↗</a></div></div>';
}
function wfModel(l){const s=l.see_it;return V().waterfallModel(s.steps.map(x=>({id:x.id,label:x.label,value:x.value,kind:x.kind})))}
function bSee(l,v){
 const s=l.see_it,m=wfModel(l),vis=v.wf,cur=v.wfActive>=0?v.wfActive:vis-1,step=s.steps[Math.max(0,cur)];
 const caption=vis===0?'<p class="ll-note">Tekan <strong>Berikutnya</strong> untuk membangun jembatan satu bar demi satu.</p>':
  '<span class="learning-label">LANGKAH '+(cur+1)+' DARI '+s.steps.length+'</span><h4 class="ll-term">'+h(step.term)+'</h4><p>'+h(step.caption)+'</p>'+
  (step.parts?'<table class="ll-parts"><caption class="sr-only">Rincian '+h(step.term)+'</caption>'+step.parts.map(p=>'<tr><th scope="row">'+h(p.label)+'</th><td>'+h(p.detail)+'</td><td>'+h(V().fmtSigned(p.value))+'</td></tr>').join('')+'<tr class="is-total"><th scope="row">Total</th><td></td><td>'+h(V().fmtSigned(step.value))+'</td></tr></table>':'')+
  (step.id==='nwc'&&vis>=4?'<p class="ll-limit"><strong>Batas perumpamaan.</strong> '+h(s.analogy_limit)+'</p>':'');
 return beatHead(2,s.title,'Angka dari Exhibit 01 kasus Aruna (SIMULATED), satuan '+s.unit+'.')+
  '<p class="ll-analogy"><strong>Perumpamaan.</strong> '+h(s.analogy)+'</p>'+
  '<div class="ll-see"><div class="ll-chart">'+(v.table?V().waterfallTable(m,s.unit):V().renderWaterfall(m,{visible:vis,active:v.wfActive,unit:' '+s.unit,title:s.title}))+'</div><div class="ll-caption" aria-live="polite">'+caption+'</div></div>'+
  '<div class="ll-controls">'+btn('← Mundur','wf-back',vis===0?'disabled':'')+btn('Berikutnya →','wf-next',vis>=s.steps.length?'disabled':'','career-btn is-current')+btn('Tampilkan semua','wf-all',vis>=s.steps.length?'disabled':'')+btn(v.table?'Lihat grafik':'Lihat sebagai tabel','wf-table','aria-pressed="'+v.table+'"')+'<span class="ll-note">'+vis+' / '+s.steps.length+'</span></div>'+
  (vis>=s.steps.length&&m.allTie?'<p class="ll-note ll-ok">✓ Jembatan cocok: setiap subtotal sama dengan jumlah langkah sebelumnya.</p>':'');
}
function bPro(l,v){
 const p=l.pro_layout,hl=v.callout?p.callouts.find(c=>c.n===v.callout)?.rows||[]:[];
 return beatHead(3,p.title,'Angka yang sama, dalam format yang dipakai analis. Klik catatan untuk melihat barisnya.')+
  '<div class="ll-pro"><div class="ll-sheet">'+V().bridgeTable(p.rows,{highlight:hl,check:p.check})+'<p class="ll-note"><span class="ll-blue">Biru</span> = input, hitam = rumus. '+h(p.convention)+'</p></div>'+
  '<div class="ll-callouts"><ul>'+p.callouts.map(c=>'<li><button type="button" class="ll-callout'+(v.callout===c.n?' is-on':'')+'" data-lesson="callout" data-n="'+h(c.n)+'" aria-pressed="'+(v.callout===c.n)+'"><span class="bridge-badge">'+h(c.n)+'</span> '+h(c.point)+'</button></li>').join('')+'</ul>'+
  '<a class="career-btn" href="'+h(p.original.url)+'" target="_blank" rel="noopener noreferrer">'+h(p.original.label)+' ↗</a></div></div>';
}
/* A read-only grid. Cells that start with "=" show their computed value and are drawn black; plain numbers are inputs (blue). */
function gridHtml(g,{inputCell=null,inputHtml='',cols}={}){
 const cells={};g.rows.forEach(r=>r.cells.forEach((c,i)=>{if(c!=null&&c!=='?')cells[String.fromCharCode(66+i)+r.n]=c}));
 const sheet=G().createSheet(cells),letters=g.columns.map((_,i)=>String.fromCharCode(66+i));
 return '<table class="ll-grid"><thead><tr><th></th>'+g.columns.map((c,i)=>'<th scope="col"><span class="ll-colname">'+letters[i]+'</span> '+h(c)+'</th>').join('')+'</tr></thead><tbody>'+
  g.rows.map(r=>'<tr><th scope="row"><span class="ll-rown">'+r.n+'</span> '+h(r.label)+'</th>'+r.cells.map((c,i)=>{
   const ref=letters[i]+r.n;
   if(c==='?'&&ref===inputCell)return '<td class="is-target">'+inputHtml+'</td>';
   if(c==null)return '<td></td>';
   if(typeof c==='string'&&c.startsWith('=')){let val='';try{val=G().evaluate(c.slice(1),sheet).value}catch{val='#'}return '<td class="is-formula" title="'+h(c)+'">'+h(val)+'</td>'}
   return '<td class="is-input">'+h(c)+'</td>'}).join('')+'</tr>').join('')+'</tbody></table>';
}
function bWorked(l,v){
 const w=l.worked,show=Math.min(w.steps.length,v.worked+1);
 return beatHead(4,w.title,'Dikerjakan penuh dulu, baru giliran lu.')+
  '<div class="ll-worked">'+gridHtml(w.grid)+'<ol class="ll-steps-list">'+w.steps.slice(0,show).map((s,i)=>'<li'+(i===show-1?' class="is-new"':'')+'>'+h(s.text)+(s.cell?' <code>'+h(s.cell)+'</code>':'')+'</li>').join('')+'</ol></div>'+
  '<div class="ll-controls">'+(show<w.steps.length?btn('Langkah berikutnya','worked-next','','career-btn is-current'):'<span class="ll-note ll-ok">✓ Semua langkah terbuka. Lanjut ke giliran lu.</span>')+'</div>';
}
const rungUnlocked=(l,v,i)=>{if(i===0)return true;const p=v.rungs[l.ladder[i-1].rung];return p.ok||p.revealed};
function feedbackFor(r,res){
 if(!res)return '';
 if(res.status==='empty')return '<p class="ll-fb is-warn" role="status">Isi dulu jawabanmu.</p>';
 if(res.status==='error')return '<p class="ll-fb is-warn" role="status">'+h(res.message||'Rumus belum bisa dibaca.')+'</p>';
 if(res.status==='hardcoded')return '<p class="ll-fb is-warn" role="status">'+h(r.hardcoded_feedback||'Angkanya benar, tetapi ketik langsung; tautkan ke sel input.')+'</p>';
 if(res.status==='ok')return '<p class="ll-fb is-ok" role="status">✓ Benar'+(res.formula&&res.refs?.length?' dan tertaut ke '+res.refs.slice(0,6).join(', '):'')+'.</p>';
 return '<p class="ll-fb is-bad" role="status">'+h(res.misconception||'Belum cocok. Cek lagi angka dan arahnya, atau minta petunjuk.')+'</p>';
}
function rungShell(l,v,r,i,inner){
 const st=v.rungs[r.rung],locked=!rungUnlocked(l,v,i);
 const hints=r.hints.slice(0,st.hints).map((t,k)=>'<li><strong>Petunjuk '+(k+1)+'.</strong> '+h(t)+'</li>').join('');
 return '<section class="ll-rung'+(st.ok?' is-ok':'')+(locked?' is-locked':'')+'" aria-labelledby="rung-'+i+'"><h4 id="rung-'+i+'">'+['a','b','c','d'][i]+' · '+h(r.title)+(st.ok?' <span class="ll-tick" aria-label="selesai">✓</span>':'')+'</h4>'+
  (locked?'<p class="ll-note">Terbuka setelah rung sebelumnya dicoba dan dijawab, atau jawabannya dibuka.</p>':'<p>'+h(r.prompt)+'</p>'+inner+
   '<div class="ll-controls">'+btn('Periksa','check','data-rung="'+h(r.rung)+'"','career-btn is-current')+btn('Petunjuk ('+st.hints+'/3)','hint','data-rung="'+h(r.rung)+'" '+(st.hints>=3||st.ok?'disabled':''))+
   (st.attempts>0&&!st.ok&&!st.revealed?btn('Lihat jawaban','reveal','data-rung="'+h(r.rung)+'"'):'')+'</div>'+
   (hints?'<ul class="ll-hints">'+hints+'</ul>':'')+feedbackFor(r,st.res)+(st.revealed?'<p class="ll-fb is-warn">Jawaban dibuka: <strong>'+h(String(r.expect.value).replace('.',','))+' '+h(r.unit)+'</strong>. Ini dicatat sebagai dibantu.</p>':''))+'</section>';
}
const numInput=(r,st)=>'<label class="ll-input"><span class="sr-only">Jawaban dalam '+h(r.unit)+'</span><input type="text" inputmode="decimal" autocomplete="off" data-lesson-input="'+h(r.rung)+'" value="'+h(st.raw)+'" placeholder="Jawaban ('+h(r.unit)+')"></label>';
function bLadder(l,v){
 const rungs=l.ladder.map((r,i)=>{
  const st=v.rungs[r.rung];let inner='';
  if(r.rung==='complete')inner=gridHtml(r.grid,{inputCell:r.target,inputHtml:'<input type="text" class="ll-cell" autocomplete="off" aria-label="Sel '+h(r.target)+'" data-lesson-input="'+h(r.rung)+'" value="'+h(st.raw)+'" placeholder="=…">'});
  else if(r.rung==='red_pen'){
   const rows=r.artefact.rows,fb=v.red.picked&&v.red.picked!==r.flaw_row?r.row_feedback[v.red.picked]:'';
   inner='<table class="bridge-table ll-red"><tbody>'+rows.map(x=>'<tr class="'+(x.total?'is-total':'')+(v.red.picked===x.id?' is-picked':'')+'"><th scope="row"><button type="button" class="ll-rowpick" data-lesson="pick-row" data-id="'+h(x.id)+'" aria-pressed="'+(v.red.picked===x.id)+'">'+h(x.label)+'</button></th><td>'+(x.value<0?'('+Math.abs(x.value).toFixed(1)+')':x.value.toFixed(1))+'</td></tr>').join('')+'</tbody></table>'+
    (v.red.found?'<p class="ll-fb is-ok" role="status">'+h(r.found_feedback)+'</p>'+numInput(r,st):(fb?'<p class="ll-fb is-bad" role="status">'+h(fb)+'</p>':'<p class="ll-note">Klik baris yang menurutmu salah.</p>'));
  }else inner=numInput(r,st);
  if(r.rung==='red_pen'&&!v.red.found)return rungShellNoCheck(l,v,r,i,inner);
  return rungShell(l,v,r,i,inner);
 });
 const ok=l.ladder.filter(r=>v.rungs[r.rung].ok).length,solo=l.ladder.filter(r=>v.rungs[r.rung].ok&&!v.rungs[r.rung].revealed&&v.rungs[r.rung].hints<3).length;
 return beatHead(5,'Empat rung: lengkapi, kerjakan sendiri, ubah asumsi, cari kesalahan','Makin ke bawah makin sedikit bantuan. Salah itu wajar; petunjuk dicatat apa adanya.')+rungs.join('')+
  '<p class="ll-note" role="status">'+ok+' dari '+l.ladder.length+' rung selesai, '+solo+' tanpa petunjuk solusi. Ini catatan latihan, bukan nilai.</p>';
}
function rungShellNoCheck(l,v,r,i,inner){
 const st=v.rungs[r.rung],locked=!rungUnlocked(l,v,i);
 return '<section class="ll-rung'+(locked?' is-locked':'')+'" aria-labelledby="rung-'+i+'"><h4 id="rung-'+i+'">d · '+h(r.title)+'</h4>'+(locked?'<p class="ll-note">Terbuka setelah rung sebelumnya dicoba dan dijawab, atau jawabannya dibuka.</p>':'<p>'+h(r.prompt)+'</p>'+inner)+'</section>';
}
function bDefend(l,v){
 const d=l.defend,n=v.defend.checks.filter(Boolean).length;
 return beatHead(6,'Pertahankan jawabanmu',d.note)+
  '<blockquote class="ll-quote">'+h(d.prompt)+'</blockquote>'+
  '<label class="career-form-label">Jawabanmu<textarea class="career-field" rows="6" data-lesson-defend aria-label="Jawaban defend" placeholder="Tulis tiga permintaan data dan alasannya…">'+h(v.defend.text)+'</textarea></label>'+
  '<div class="ll-controls">'+(v.defend.shown?'':btn('Buka poin model','defend-show','','career-btn is-current'))+'</div>'+
  (v.defend.shown?'<ul class="ll-points">'+d.model_points.map((p,i)=>'<li><label><input type="checkbox" data-lesson="defend-check" data-n="'+i+'" '+(v.defend.checks[i]?'checked':'')+'> '+h(p)+'</label></li>').join('')+'</ul><p class="ll-note" role="status">Centang poin yang sudah kamu sebut: '+n+' dari '+d.model_points.length+'. Penilaian diri, tidak dikirim ke mana pun.</p>':'');
}
function bLock(l,v){
 const p=l.predict,L=l.lock_in;
 const said=v.predict==null?'Kamu belum menebak di awal.':'Tebakanmu: “'+p.options[v.predict]+'”. '+(v.predict===p.answer_index?'Tepat.':'Belum tepat, dan itu wajar.');
 return beatHead(7,'Kunci pelajarannya',said)+
  '<p>'+h(p.reveal)+'</p>'+
  '<div class="ll-cards">'+L.cards.map(c=>'<button type="button" class="ll-card'+(v.flipped[c.id]?' is-flipped':'')+'" data-lesson="flip" data-id="'+h(c.id)+'" aria-pressed="'+!!v.flipped[c.id]+'"><span>'+h(v.flipped[c.id]?c.back:c.front)+'</span></button>').join('')+'</div>'+
  '<div class="ll-controls">'+(v.carded?'<span class="ll-note ll-ok" role="status">✓ Kartu masuk Daily Drill. Muncul di Today mulai besok.</span>':btn('Tambahkan 3 kartu ke Daily Drill','cards','','career-btn is-current'))+'</div>'+
  '<p><strong>Yang harus dibuat:</strong> '+h(L.build_output)+'</p>'+
  (v.completed?'<p class="ll-note ll-ok" role="status">✓ Lesson ditandai selesai di perangkat ini.</p>':'');
}

/* ---------- actions ---------- */
function ctxLesson(){const r=root.document?.querySelector?.('[data-lesson-root]');return r?lessonFor(r.dataset.lessonRoot):null}
function mark(l,v){if(!v.done.includes(v.beat))v.done.push(v.beat)}
function checkRung(l,v,r){
 const st=v.rungs[r.rung],raw=String(st.raw??'');
 let res;
 if(r.rung==='complete'){
  const cells={};r.grid.rows.forEach(x=>x.cells.forEach((c,i)=>{if(c!=null&&c!=='?')cells[String.fromCharCode(66+i)+x.n]=c}));
  res=G().checkCell({...r.expect,misconceptions:r.misconceptions},raw,G().createSheet(cells));
 }else res=G().checkCell({...r.expect,misconceptions:r.misconceptions},raw,G().createSheet({}));
 if(res.status!=='empty')st.attempts++;
 st.res=res;if(res.status==='ok')st.ok=true;
}
async function action(e){
 const b=e.target.closest?.('[data-lesson]');if(!b)return false;
 e.preventDefault();e.stopPropagation();
 const l=ctxLesson();if(!l)return true;
 const v=viewOf(l),a=b.dataset.lesson,n=+b.dataset.n,s=l.see_it.steps;
 const r=l.ladder.find(x=>x.rung===b.dataset.rung);
 if(a==='beat'){if(n>=0&&n<BEATS.length){mark(l,v);v.beat=n}}
 else if(a==='prev'){if(v.beat>0)v.beat--}
 else if(a==='next'){mark(l,v);if(v.beat<BEATS.length-1)v.beat++;else v.completed=true}
 else if(a==='predict'){if(n>=0&&n<l.predict.options.length)v.predict=n}
 else if(a==='play')v.playing=true;
 else if(a==='wf-next'){if(v.wf<s.length){v.wf++;v.wfActive=-1}}
 else if(a==='wf-back'){if(v.wf>0){v.wf--;v.wfActive=-1}}
 else if(a==='wf-all'){v.wf=s.length;v.wfActive=-1}
 else if(a==='wf-table')v.table=!v.table;
 else if(a==='callout')v.callout=v.callout===b.dataset.n?null:b.dataset.n;
 else if(a==='worked-next')v.worked=Math.min(l.worked.steps.length-1,v.worked+1);
 else if(a==='check'&&r){
  const st=v.rungs[r.rung];const inp=root.document.querySelector('[data-lesson-input="'+r.rung+'"]');if(inp)st.raw=inp.value;
  checkRung(l,v,r);
 }
 else if(a==='hint'&&r){const st=v.rungs[r.rung];st.hints=Math.min(3,st.hints+1)}
 else if(a==='reveal'&&r){v.rungs[r.rung].revealed=true}
 else if(a==='pick-row'){const r4=l.ladder.find(x=>x.rung==='red_pen');v.red.picked=b.dataset.id;if(b.dataset.id===r4.flaw_row){v.red.found=true;v.rungs.red_pen.attempts++}}
 else if(a==='defend-show')v.defend.shown=true;
 else if(a==='defend-check'){if(n>=0&&n<3)v.defend.checks[n]=!v.defend.checks[n]}
 else if(a==='flip'){v.flipped[b.dataset.id]=!v.flipped[b.dataset.id]}
 else if(a==='cards'){const added=root.SELFReview?.add?.(l.lock_in.cards,l.id);v.carded=true;void added}
 persist(l,v);rerender();
 Promise.resolve().then(()=>{const t=root.document?.getElementById('ll-beat-h');if(t&&['beat','prev','next'].includes(a))t.parentElement?.scrollIntoView?.({block:'nearest'})});
 return true;
}
function input(e){
 const t=e.target;if(!t?.matches)return false;
 if(t.matches('[data-lesson-input]')){const l=ctxLesson();if(!l)return true;const v=viewOf(l),st=v.rungs[t.dataset.lessonInput];if(st){st.raw=t.value;st.res=null}return true}
 if(t.matches('[data-lesson-defend]')){const l=ctxLesson();if(!l)return true;const v=viewOf(l);v.defend.text=t.value.slice(0,4000);persist(l,v);return true}
 return false;
}
function keydown(e){
 if(e.key!=='Enter')return false;
 const t=e.target;if(!t?.matches?.('[data-lesson-input]'))return false;
 e.preventDefault();
 const l=ctxLesson();if(!l)return true;const v=viewOf(l),r=l.ladder.find(x=>x.rung===t.dataset.lessonInput);if(!r)return true;
 v.rungs[r.rung].raw=t.value;checkRung(l,v,r);persist(l,v);rerender();
 Promise.resolve().then(()=>root.document.querySelector('[data-lesson-input="'+r.rung+'"]')?.focus());
 return true;
}
root.SELFLessonLoop={init,reset,load,status,has,render,action,input,keydown,progress,state:S,BEATS};
})(typeof window!=='undefined'?window:globalThis);
