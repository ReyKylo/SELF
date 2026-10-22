(function(){
'use strict';
const lines=[
['ev','Enterprise Value','39 × 7',273],
['seller','Seller equity proceeds','EV − 80 + 13.54',206.54],
['uses','Total Uses','Seller equity + 80 existing debt + 5 fees',291.54],
['cash','Usable existing cash','13.54 cash − 12 minimum floor',1.54],
['equity','Sponsor equity cheque','Total Uses − 130 new debt − usable cash',160],
['balance','Sources less Uses','130 new debt + usable cash + equity − uses',0]
];
const s={owner:null,values:{},decision:'',risk:'',checked:false,hint:false};
let host=null;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const correct=id=>lines.find(x=>x[0]===id)?.[3];
function reset(owner){s.owner=owner;s.values={};s.decision='';s.risk='';s.checked=false;s.hint=false;window.SELFPEProjection?.reset?.(owner)}
function check(){s.checked=true;return lines.every(x=>String(s.values[x[0]]??'').trim()!==''&&Math.abs(Number(s.values[x[0]])-x[3])<0.005)}
function download(){
 const rows=[['SELF PE Aruna Supply','SIMULATED case, learner working paper'],['Field','Submitted value','Expected relationship'],...lines.map(x=>[x[1],s.values[x[0]]??'',x[2]]),['Learner decision',s.decision],['Risks and diligence',s.risk]];
 const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='SELF_PE_Aruna_Learner_Working_Paper.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function render(){
 const passed=s.checked&&checkWithoutChange(),done=lines.filter(x=>String(s.values[x[0]]??'').trim()!=='').length;
 const facts=[['EBITDA 2025','Rp39bn'],['Entry multiple','7×'],['Existing debt','Rp80bn'],['Existing cash','Rp13.54bn'],['Minimum cash','Rp12bn'],['Fees','Rp5bn'],['New debt','Rp130bn']];
 const inputs=lines.map((x,i)=>'<div class="lab-line"><label for="lab-'+x[0]+'"><small>0'+(i+1)+' · '+esc(x[2])+'</small><strong>'+esc(x[1])+'</strong></label><input id="lab-'+x[0]+'" type="number" inputmode="decimal" step="any" data-lab-input="'+x[0]+'" value="'+esc(s.values[x[0]]??'')+'" aria-label="'+esc(x[1])+' Rp miliar"></div>').join('');
 const errors=s.checked&&!passed?'<p class="lab-feedback">Belum reconcile. Periksa setiap angka dan unit. Ingat cash floor tidak boleh dipakai semua.</p>':'';
 return '<div class="lab-intro"><span class="learning-label">PHASE 4 · PE ANALYST LAB · SIMULATED</span><h2>Lu yang bangun modelnya.</h2><p>Aruna Supply: laba meningkat, tetapi kas memburuk. Sebelum menghitung IRR, pastikan transaksi bisa didanai. Ini tahap Sources & Uses, belum full LBO.</p></div>'+
 '<div class="lab-layout"><article class="lab-paper"><span class="learning-label">CASE DATA ROOM · Rp miliar</span><div class="lab-facts">'+facts.map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('')+'</div><h3>Sources & Uses — learner worksheet</h3><p>Isi enam angka berikut. Lu bisa meminta rumus bila mentok.</p>'+inputs+
 '<div class="lab-controls"><button type="button" class="career-btn" data-lab-action="check">Periksa 6 angka</button><button type="button" class="career-btn" data-lab-action="hint">Tampilkan rumus</button><button type="button" class="career-btn" data-lab-action="download">Unduh working paper CSV</button></div>'+
 (s.checked&&passed?'<p role="status" class="lab-feedback">6/6 cocok. Sources = Uses. Selanjutnya uji cash conversion, covenant dan downside; angka seimbang belum berarti deal layak.</p>':errors)+
 '<section class="lab-decision"><h3>Decide & defend</h3><label for="lab-decision">Rekomendasi awal — proceed, reprice, atau further diligence?</label><textarea id="lab-decision" data-lab-text="decision" rows="4" placeholder="Tulis alasan berbasis angka dan risiko...">'+esc(s.decision)+'</textarea><label for="lab-risk">Apa risiko pembayaran utang dan kas yang belum dijawab?</label><textarea id="lab-risk" data-lab-text="risk" rows="4" placeholder="Buat tiga diligence questions...">'+esc(s.risk)+'</textarea></section></article>'+
 '<aside class="lab-sidebar"><span class="learning-label">PROGRESS · LOCAL SESSION ONLY</span><h3>'+done+' / 6 baris diisi</h3><p>Bayangin membeli rumah dengan KPR: harga rumah berbeda dari uang bersih penjual dan dana yang harus disediakan pembeli.</p><p><strong>Yes, ini namanya Enterprise Value-to-Equity Value Bridge serta Sources & Uses of Funds.</strong></p>'+
 (s.hint?'<div class="lab-hints"><strong>Rumus sebagai bantuan</strong>'+lines.map(x=>'<p>'+esc(x[1])+': '+esc(x[2])+'</p>').join('')+'</div>':'<p>Kerjakan mandiri dulu. Kalau buntu, pilih Tampilkan rumus.</p>')+
 '<p class="lab-disclaimer">Case ini SIMULATED. Perhitungan lokal tidak memeriksa workbook XLSX, tidak otomatis disimpan di Supabase, dan bukan keputusan investasi atau expert certification.</p></aside></div>'+(window.SELFPEProjection?.render?.()||'');
}
function checkWithoutChange(){return lines.every(x=>String(s.values[x[0]]??'').trim()!==''&&Number.isFinite(Number(s.values[x[0]]))&&Math.abs(Number(s.values[x[0]])-x[3])<0.005)}
function action(event){if(window.SELFPEProjection?.action?.(event))return true;const b=event.target?.closest?.('[data-lab-action]');if(!b)return false;event.preventDefault();event.stopPropagation();if(b.dataset.labAction==='check')check();if(b.dataset.labAction==='hint')s.hint=true;if(b.dataset.labAction==='download')download();host?.render?.();return true}
function input(event){if(window.SELFPEProjection?.input?.(event))return true;const x=event.target;if(x?.dataset?.labInput){s.values[x.dataset.labInput]=x.value;s.checked=false;return true}if(x?.dataset?.labText){s[x.dataset.labText]=x.value;return true}return false}
window.SELFCareerAnalystLab={init(api){host=api;window.SELFPEProjection?.init?.(api)},render,action,input,reset,check,state:s,lines};
})();