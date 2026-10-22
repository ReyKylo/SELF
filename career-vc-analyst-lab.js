/* SELF VC Analyst Lab: ArusOps simulated September 2026 underwriting. */
(function(){
'use strict';
const data={liveMRR:295170,bookedARR:1200000,openingMRR:247673,closingMRR:244310,smbSpend:106000,smbNew:142,smbMRR:180,smbGM:.78,cash:981000,monthlyBurn:358000,preMoney:24000000,raise:6000000,lead:4000000};
const checks=[
 {id:'arr',name:'Live ARR, USD',formula:'Live MRR × 12',answer:()=>data.liveMRR*12},
 {id:'nrr',name:'Prior-customer NRR, %',formula:'Prior cohort closing MRR ÷ prior cohort opening MRR × 100',answer:()=>data.closingMRR/data.openingMRR*100},
 {id:'cac',name:'SMB customer acquisition cost, USD',formula:'Fully-loaded SMB sales & marketing spend ÷ new SMB customers',answer:()=>data.smbSpend/data.smbNew},
 {id:'payback',name:'SMB CAC payback, months',formula:'SMB CAC ÷ (new SMB MRR × gross margin)',answer:()=>data.smbSpend/data.smbNew/(data.smbMRR*data.smbGM)},
 {id:'runway',name:'Cash runway, months',formula:'Unrestricted cash ÷ trailing 3-month net monthly burn',answer:()=>data.cash/data.monthlyBurn},
 {id:'post',name:'Post-money valuation, USD',formula:'Pre-money valuation + financing amount',answer:()=>data.preMoney+data.raise},
 {id:'stake',name:'Lead investor ownership BEFORE option-pool effects, %',formula:'Lead investment ÷ post-money valuation × 100',answer:()=>data.lead/(data.preMoney+data.raise)*100}
];
const state={owner:null,values:{},checked:false,hints:false,decision:'',risks:''};
let host=null;
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reset(owner){state.owner=owner||null;state.values={};state.checked=false;state.hints=false;state.decision='';state.risks=''}
function evaluate(){state.checked=true;return checks.every(c=>{const v=String(state.values[c.id]??'').trim(),a=c.answer();return v!==''&&Number.isFinite(Number(v))&&Math.abs(Number(v)-a)<=Math.max(.02,Math.abs(a)*.00001)})}
function render(){
 const passed=state.checked&&checks.every(c=>{const v=String(state.values[c.id]??'').trim();return v!==''&&Number.isFinite(Number(v))&&Math.abs(Number(v)-c.answer())<=Math.max(.02,Math.abs(c.answer())*.00001)});
 const facts=[['Live MRR','$295,170'],['Booked-not-live ARR','$1,200,000'],['Opening cohort MRR','$247,673'],['Closing cohort MRR','$244,310'],['SMB acquisition spend','$106,000'],['New SMB customers','142'],['SMB MRR/customer','$180'],['SMB gross margin','78%'],['Unrestricted cash','$981,000'],['Trailing net burn/month','$358,000'],['Pre-money valuation','$24,000,000'],['Series A raise','$6,000,000'],['Lead contribution','$4,000,000']];
 return '<div class="lab-intro"><span class="learning-label">PHASE 4 · VC ANALYST LAB · ARUSOPS · SIMULATED</span><h2>Startup bertumbuh, tapi layak investasi?</h2><p>Bayangin langganan gym: banyak orang baru daftar, tetapi sebagian anggota lama berhenti. Pertumbuhan anggota saja belum memberi tahu kualitas bisnis. <strong>Yes, ini namanya Cohort Retention, Net Revenue Retention (NRR), dan Unit Economics.</strong></p></div>'+
 '<div class="lab-layout"><article class="lab-paper"><span class="learning-label">SOURCE EXHIBITS · SEPTEMBER 2026</span><div class="lab-facts">'+facts.map(x=>'<div><small>'+h(x[0])+'</small><strong>'+h(x[1])+'</strong></div>').join('')+'</div>'+
 '<h3>VC underwriting working paper</h3><p>Hitung ketujuh angka dari data yang tersedia. Jangan campurkan kontrak belum live dengan live ARR.</p>'+
 checks.map((c,i)=>'<div class="lab-line"><label for="vc-'+c.id+'"><small>'+String(i+1).padStart(2,'0')+' · '+h(state.hints?c.formula:'Isi tanpa melihat rumus dulu')+'</small><strong>'+h(c.name)+'</strong></label><input id="vc-'+c.id+'" type="number" step="any" inputmode="decimal" data-vc-input="'+c.id+'" value="'+h(state.values[c.id]??'')+'"></div>').join('')+
 '<div class="lab-controls"><button class="career-btn" type="button" data-vc-action="check">Periksa 7 angka</button><button class="career-btn" type="button" data-vc-action="hint">Lihat rumus</button></div><p class="lab-feedback" role="status">'+(state.checked?(passed?'7/7 cocok. Sekarang uji dilution, preference waterfall dan risiko retensi sebelum mengambil keputusan.':'Belum cocok. Periksa dasar pembagi, margin, dan pemisahan live vs booked revenue.'):'Kerjakan dahulu, baru periksa.')+'</p>'+
 '<section class="lab-decision"><h3>Investor decision — reasoning belum dinilai otomatis</h3><label for="vc-decision">Invest, pass, atau further diligence? Mengapa?</label><textarea id="vc-decision" data-vc-note="decision" rows="4" placeholder="Keputusan dan dasar evidence...">'+h(state.decision)+'</textarea><label for="vc-risks">Sebutkan tiga hal yang harus diuji sebelum investasi</label><textarea id="vc-risks" data-vc-note="risks" rows="4" placeholder="Retention, runway, future dilution, preference terms...">'+h(state.risks)+'</textarea></section></article>'+
 '<aside class="lab-sidebar"><span class="learning-label">WHAT YOU ARE TESTING</span><h3>Growth ≠ investment quality</h3><p><strong>Live ARR</strong> adalah MRR aktif yang dianualisasi; booked-not-live harus dipisahkan.</p><p><strong>NRR</strong> memakai customer set yang sama. Pelanggan baru tidak masuk numerator.</p><p><strong>CAC Payback</strong> memakai gross profit, bukan gross revenue.</p><p><strong>Runway</strong> hanya shortcut berdasarkan burn yang diasumsikan tetap.</p><p><strong>Pre/Post-money</strong> memberi indikasi ownership sebelum efek option pool top-up, future dilution, dan liquidation preference.</p><p class="lab-disclaimer">Angka dari case ArusOps SIMULATED. Pemeriksaan aritmetika tujuh angka saja, belum full cap table / waterfall atau evaluator investasi. Jawaban tetap lokal selama sesi ini, tidak otomatis masuk Supabase.</p></aside></div>';
}
function action(e){const b=e.target?.closest?.('[data-vc-action]');if(!b)return false;e.preventDefault();e.stopPropagation();if(b.dataset.vcAction==='check')evaluate();if(b.dataset.vcAction==='hint')state.hints=true;host?.render?.();return true}
function input(e){const b=e.target;if(b?.dataset?.vcInput){state.values[b.dataset.vcInput]=b.value;state.checked=false;return true}if(b?.dataset?.vcNote){state[b.dataset.vcNote]=b.value;return true}return false}
window.SELFVCAnalystLab={init(api){host=api},render,action,input,reset,evaluate,checks,state,data};
})();