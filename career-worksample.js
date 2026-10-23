/* SELF Career Prep Phase 6 — Independent Work Samples. Public blind briefs only: no answer keys, no auto-grading. */
(function(){
'use strict';
const INDEX_URL='./content/work-samples/index.json';
const STARTERS={PE:'PE_LBO',VC:'VC_Investment',Consulting:'Consulting_Profitability'};
const MAX_BYTES=15*1024*1024;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host=null,sequence=0;
const blank=()=>({focusTitle:false,owner:null,index:null,loading:false,error:'',track:'PE',content:{},contentError:'',check:{busy:false,name:'',report:null,flags:null,error:'',useStarter:false}});
const state=blank();
const bytesHeld={file:null};
const starterCache={};

function inline(text){
 return h(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?![*\w])/g,'$1<em>$2</em>');
}
/** Minimal, escaping-first Markdown for the shipped briefs: headings, paragraphs, lists, quotes, tables. */
function markdown(src){
 const lines=String(src).replace(/\r/g,'').split('\n'),out=[];let i=0;
 const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
 while(i<lines.length){
  const l=lines[i];
  if(!l.trim()){i++;continue}
  let m=/^(#{1,4})\s+(.*)$/.exec(l);
  if(m){const n=Math.min(m[1].length+1,5);out.push('<h'+n+'>'+inline(m[2])+'</h'+n+'>');i++;continue}
  if(/^\s*\|/.test(l)&&/^\s*\|?\s*:?-{2,}/.test(lines[i+1]||'')){
   const head=cells(l);i+=2;const rows=[];
   while(i<lines.length&&/^\s*\|/.test(lines[i])){rows.push(cells(lines[i]));i++}
   out.push('<div class="ws-scroll" tabindex="0" role="region" aria-label="Tabel dalam brief"><table><thead><tr>'+head.map(c=>'<th scope="col">'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');continue;
  }
  if(/^\s*>/.test(l)){const q=[];while(i<lines.length&&/^\s*>/.test(lines[i])){q.push(lines[i].replace(/^\s*>\s?/,''));i++}out.push('<blockquote>'+inline(q.join(' '))+'</blockquote>');continue}
  if(/^\s*[-*]\s+/.test(l)){const it=[];while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i])){it.push(lines[i].replace(/^\s*[-*]\s+/,''));i++}out.push('<ul>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>');continue}
  if(/^\s*\d+[.)]\s+/.test(l)){const it=[];while(i<lines.length&&/^\s*\d+[.)]\s+/.test(lines[i])){it.push(lines[i].replace(/^\s*\d+[.)]\s+/,''));i++}out.push('<ol>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ol>');continue}
  const p=[];while(i<lines.length&&lines[i].trim()&&!/^(#{1,4}\s|\s*\||\s*>|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])){p.push(lines[i]);i++}
  out.push('<p>'+inline(p.join(' '))+'</p>');
 }
 return out.join('');
}
function csv(text){
 const rows=[];let row=[],cell='',q=false;const s=String(text).replace(/\r/g,'');
 for(let i=0;i<s.length;i++){const c=s[i];
  if(q){if(c==='"'&&s[i+1]==='"'){cell+='"';i++}else if(c==='"')q=false;else cell+=c}
  else if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else cell+=c;
 }
 if(cell!==''||row.length){row.push(cell);rows.push(row)}
 return rows.filter(r=>r.some(c=>c!==''));
}
function settleFocus(){Promise.resolve().then(()=>{if(!state.focusTitle)return;const t=document.getElementById('ws-title');if(t){state.focusTitle=false;t.focus({preventScroll:true})}})}
const sample=()=>state.index?.samples.find(s=>s.track===state.track)||null;
const owner=()=>host?.state?.()?.user?.id||null;
function reset(next){
 sequence++;bytesHeld.file=null;const keep={index:state.index,content:state.content};
 Object.assign(state,blank(),keep,{owner:next||null});
}
async function getJson(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status+' untuk '+url);return r.json()}
async function getText(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status+' untuk '+url);return r.text()}
async function load(){
 if(state.loading)return;const seq=++sequence,track=state.track;state.loading=true;state.error='';state.contentError='';
 try{
  if(!state.index){const idx=await getJson(INDEX_URL);if(seq!==sequence)return;if(!Array.isArray(idx.samples)||idx.samples.length!==3)throw Error('Indeks work sample tidak valid.');state.index=idx}
  const s=state.index.samples.find(x=>x.track===track);
  if(s&&!state.content[track]){
   const [brief,...tables]=await Promise.all([getText(s.brief),...s.data.map(d=>getText(d.path))]);
   if(seq!==sequence)return;state.content[track]={brief,tables:s.data.map((d,i)=>({label:d.label,path:d.path,filename:d.filename,rows:csv(tables[i])})),briefName:'SELF_WorkSample_'+track+'_Brief.md'};
  }
 }catch(e){if(seq===sequence)state.error=e?.message||String(e)}
 finally{if(seq===sequence){state.loading=false;host?.render?.();settleFocus()}}
}
function saveBlob(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function table(t){
 const [head,...body]=t.rows;if(!head)return '';
 return '<section class="ws-data"><div class="ws-data-head"><h4>'+h(t.label)+'</h4><button type="button" class="career-btn" data-learning="ws" data-ws="download-data" data-path="'+h(t.path)+'">↓ CSV</button></div>'+
 '<div class="ws-scroll" tabindex="0" role="region" aria-label="'+h(t.label)+'"><table><thead><tr>'+head.map(c=>'<th scope="col">'+h(c)+'</th>').join('')+'</tr></thead><tbody>'+body.map(r=>'<tr>'+r.map(c=>'<td>'+h(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';
}
const sevLabel={error:'ERROR',warn:'PERIKSA',info:'INFO'};
function checkPanel(s){
 const c=state.check,r=c.report;let body='';
 if(c.busy)body='<p role="status">Membaca file…</p>';
 else if(c.error)body='<p class="ws-error" role="alert">'+h(c.error)+'</p>';
 else if(r){
  const all=[...r.findings,...(c.flags||[])];
  body='<div role="status" aria-live="polite"><p><strong>'+h(c.name)+'</strong> · '+r.totals.sheets+' sheet · <strong>'+r.totals.formulas+'</strong> formula · '+r.totals.constants+' angka yang diketik · '+r.totals.errors+' nilai error</p>'+
  '<ul class="ws-sheets">'+r.sheets.map(x=>'<li>'+h(x.name)+': '+x.formulas.length+' formula, '+x.constants.length+' angka</li>').join('')+'</ul>'+
  (all.length?'<ul class="ws-findings">'+all.map(f=>'<li class="ws-'+f.severity+'"><strong>'+sevLabel[f.severity]+'</strong> '+h(f.message)+'</li>').join('')+'</ul>':'<p>Tidak ada temuan struktural.</p>')+'</div>';
 }
 return '<section class="ws-check" aria-labelledby="ws-check-title"><h3 id="ws-check-title">Cek struktur workbook</h3>'+
 '<p class="ws-note">Dibaca di browser lu; file tidak diupload. Label <strong>DETERMINISTIC_VERIFIED</strong> hanya berlaku untuk struktur file (jumlah formula, angka yang diketik, nilai error yang tersimpan). Ini <strong>bukan</strong> penilaian benar atau salahnya angka, asumsi, atau keputusan lu. Nilai error hanya terbaca bila file disimpan oleh Excel atau Sheets setelah dihitung.</p>'+
 '<label class="ws-file" for="ws-file">Pilih workbook .xlsx (maks 15 MB)</label><input id="ws-file" type="file" accept=".xlsx" data-ws-file '+(c.busy?'disabled':'')+'>'+
 '<label class="ws-check-opt"><input type="checkbox" data-ws-starter '+(c.useStarter?'checked ':'')+(c.busy?'disabled':'')+'> Gue mulai dari starter workbook '+h(s.starter)+' (bandingkan formula yang berubah)</label>'+body+'</section>';
}
function render(){
 if(!state.loading&&!state.error&&(!state.index||!state.content[state.track]))Promise.resolve().then(load);
 const s=sample();
 const tabs='<div class="ws-tracks" role="group" aria-label="Pilih work sample">'+((state.index?.samples)||[{track:'PE',label:'Private Equity'},{track:'VC',label:'Venture Capital'},{track:'Consulting',label:'Strategy Consulting'}]).map(x=>'<button type="button" class="career-btn '+(x.track===state.track?'career-primary':'')+'" data-learning="ws" data-ws="track" data-track="'+h(x.track)+'" aria-pressed="'+(x.track===state.track)+'">'+h(x.label)+'</button>').join('')+'</div>';
 if(state.error)return '<div class="ws-root">'+tabs+'<div class="learning-empty" role="alert"><h2>Work sample belum terbuka.</h2><p>'+h(state.error)+'</p><button type="button" class="career-btn" data-learning="ws" data-ws="retry">Coba lagi</button></div></div>';
 const c=state.content[state.track];
 if(!s||!c)return '<div class="ws-root">'+tabs+'<div class="learning-empty" role="status"><h2>Membuka work sample…</h2><p>Memuat brief dan data kasus.</p></div></div>';
 return '<div class="ws-root">'+tabs+
 '<header class="ws-head"><span class="learning-label">INDEPENDENT WORK SAMPLE · SIMULASI · TANPA KUNCI JAWABAN</span><h2 id="ws-title" tabindex="-1">'+h(s.title)+'</h2><p>'+h(state.index.notice)+'</p>'+
 '<dl class="ws-facts"><div><dt>Kasus</dt><dd>'+h(s.company)+'</dd></div>'+(s.timebox?'<div><dt>Batas waktu</dt><dd>'+h(s.timebox)+'</dd></div>':'')+'<div><dt>Cutoff data</dt><dd>'+h(s.cutoff)+'</dd></div><div><dt>Kompetensi</dt><dd>'+h(s.competencies)+'</dd></div></dl></header>'+
 '<ol class="ws-flow" aria-label="Alur pengerjaan"><li><strong>Baca brief</strong> tanpa membuka pembahasan Guided Masterclass.</li><li><strong>Bangun workbook</strong> dari nol atau dari starter.</li><li><strong>Cek struktur</strong> file lu di bawah.</li><li><strong>Simpan</strong> ke Portfolio Workspace (privat, akun lu).</li><li><strong>Defend</strong> di Director Review.</li></ol>'+
 '<article class="ws-brief" aria-label="Brief kasus">'+markdown(c.brief)+'</article>'+
 (c.tables.length?'<h3>Data kasus</h3>'+c.tables.map(table).join(''):'<p class="ws-note">'+h(s.dataNote||'')+'</p>')+
 '<section class="ws-deliver" aria-labelledby="ws-deliver-title"><h3 id="ws-deliver-title">Yang harus lu serahkan</h3><ol>'+s.deliverables.map(d=>'<li>'+h(d)+'</li>').join('')+'</ol></section>'+
 checkPanel(s)+
 '<div class="ws-actions"><button type="button" class="career-btn" data-learning="ws" data-ws="download-brief">↓ Brief (.md)</button><button type="button" class="career-btn career-primary" data-learning="ws" data-ws="portfolio" data-track="'+h(s.track)+'">Simpan ke Portfolio Workspace →</button><button type="button" class="career-btn" data-learning="ws" data-ws="director" data-track="'+h(s.track)+'">Defend di Director Review →</button></div>'+
 '<p class="ws-note">Penilaian akhir tetap review manusia terhadap pekerjaan lu. Tidak ada skor otomatis, sertifikasi, atau persetujuan profesional di sini.</p></div>';
}
async function starterReport(track){
 if(starterCache[track])return starterCache[track];
 const W=window.SELFWorkbookCheck;if(!W)throw Error('Pemeriksa workbook tidak termuat.');
 const b64=(await getText('./content/career-kits/'+STARTERS[track]+'_Starter.xlsx.b64')).trim();
 const bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
 return starterCache[track]=await W.inspect(bytes);
}
async function runCheck(){
 const c=state.check,file=bytesHeld.file;if(!file)return;
 const who=owner(),seq=++sequence,track=state.track;
 c.busy=true;c.error='';host?.render?.();
 try{
  const W=window.SELFWorkbookCheck;if(!W)throw Error('Pemeriksa workbook tidak termuat.');
  const report=await W.inspect(file.bytes);
  let flags=null;if(c.useStarter)flags=W.compareToStarter(report,await starterReport(track));
  if(seq!==sequence||owner()!==who)return;
  c.report=report;c.flags=flags;c.name=file.name;
 }catch(e){if(seq===sequence&&owner()===who){c.report=null;c.flags=null;c.error=e?.message||String(e)}}
 finally{if(seq===sequence&&owner()===who){c.busy=false;host?.render?.()}}
}
function change(event){
 const t=event.target;
 if(t?.dataset?.wsFile!==undefined){
  const f=t.files?.[0];if(!f)return true;
  if(!/\.xlsx$/i.test(f.name)||f.size<1||f.size>MAX_BYTES){state.check.report=null;state.check.flags=null;state.check.error='Pilih file .xlsx berukuran 1 byte sampai 15 MB.';bytesHeld.file=null;host?.render?.();return true}
  f.arrayBuffer().then(buf=>{bytesHeld.file={name:f.name,bytes:new Uint8Array(buf)};return runCheck()}).catch(e=>{state.check.error='File tidak bisa dibaca: '+(e?.message||String(e));host?.render?.()});
  return true;
 }
 if(t?.dataset?.wsStarter!==undefined){state.check.useStarter=!!t.checked;if(bytesHeld.file)void runCheck();else host?.render?.();return true}
 return false;
}
function action(event){
 const b=event.target.closest?.('[data-ws]');if(!b)return false;
 event.preventDefault?.();event.stopPropagation?.();
 const a=b.dataset.ws;
 if(a==='track'){if(state.track!==b.dataset.track){state.track=b.dataset.track;state.check=blank().check;bytesHeld.file=null}state.focusTitle=true;host?.render?.();void load();settleFocus();return true}
 if(a==='retry'){state.error='';void load();host?.render?.();return true}
 if(a==='download-brief'){const c=state.content[state.track];if(c)saveBlob(new Blob([c.brief],{type:'text/markdown;charset=utf-8'}),c.briefName);return true}
 if(a==='download-data'){const t=state.content[state.track]?.tables.find(x=>x.path===b.dataset.path);if(t)saveBlob(new Blob([t.rows.map(r=>r.map(c=>/[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c).join(',')).join('\n')+'\n'],{type:'text/csv;charset=utf-8'}),t.filename);return true}
 if(a==='portfolio'){window.SELFCareerLearning?.openPortfolio?.(b.dataset.track);return true}
 if(a==='director'){window.SELFCareerLearning?.openDirector?.(b.dataset.track);return true}
 return true;
}
window.SELFWorkSample={init(api){host=api},render,action,change,reset,load,state,markdown,csv};
})();
