/* SELF / SajiRasa Consulting Analyst Lab. Simulated company, IDR million. */
(function(){
'use strict';
const revenue2025=77000,variable2025=50300,fixed2025=19700;
const current={revenue:75400,variable:56200,fixed:20600,corePacks:2350};
const initiatives=[
 {id:'A',name:'Procurement',annual:2332,upfront:1300,slots:4},
 {id:'B',name:'Premium relaunch',annual:800,upfront:850,slots:4},
 {id:'C',name:'B2B contract reset',annual:1750,upfront:350,slots:3}
];
const scenarios={base:{aShare:.8,aSaving:1.4,aCost:300,exited:150,uplift:2,route:600,cCost:200},downside:{aShare:.6,aSaving:.8,aCost:450,exited:300,uplift:1,route:600,cCost:200},upside:{aShare:.9,aSaving:1.6,aCost:300,exited:100,uplift:2.5,route:600,cCost:200}};
const state={owner:null,values:{},checked:false,hints:false,selected:{A:true,B:false,C:true},scenario:'base',decision:'',risks:''};
let host=null;
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function profitBridge(){
 const segments=[
 [1200,1300,24,23,15,17],
 [900,1050,20,19,14,16],
 [500,400,40,42,25,27],
 [300,250,34,35,24,26]
 ];
 let volume=0,price=0,cost=0;
 for(const [q0,q1,p0,p1,c0,c1] of segments){
  volume+=(q1-q0)*(p0-c0);price+=q1*(p1-p0);cost-=q1*(c1-c0);
 }
 return {start:revenue2025-variable2025-fixed2025,volume,price,cost,fixed:-(current.fixed-fixed2025),end:current.revenue-current.variable-current.fixed};
}
function portfolio(selected=state.selected,scenario=state.scenario){
 const sc=scenarios[scenario];if(!sc)throw Error('Unrecognized scenario');
 const a=!!selected.A,b=!!selected.B,c=!!selected.C;
 const benefitA=a?current.corePacks*sc.aShare*sc.aSaving-sc.aCost:0;
 const benefitB=b?800:0; // 150 premium packs @ 15 CM, 50 cannibalized @6, price discount on 550 premium packs, minus 600 recurring
 const benefitC=c?(1050-sc.exited)*sc.uplift-sc.exited*3+sc.route-sc.cCost:0;
 const overlap=a?sc.aShare*sc.aSaving*((b?50:0)+(c?sc.exited:0)):0;
 const chosen=initiatives.filter(x=>selected[x.id]);
 const upfront=chosen.reduce((n,x)=>n+x.upfront,0),slots=chosen.reduce((n,x)=>n+x.slots,0);
 return {annual:benefitA+benefitB+benefitC-overlap,overlap,upfront,slots,feasible:upfront<=1800&&slots<=7,profitBeforeOneOffs:profitBridge().end+benefitA+benefitB+benefitC-overlap};
}
function answerFields(){
 const p=profitBridge(),x=portfolio();
 return [
 ['volume','Volume / segment mix effect',p.volume,'Sum (2026 packs − 2025 packs) × 2025 contribution/pack'],
 ['price','Price realization effect',p.price,'Sum 2026 packs × (new price − old price)'],
 ['unitcost','Unit variable-cost effect',p.cost,'Negative of 2026 packs × unit cost increase'],
 ['fixed','Fixed operating cost effect',p.fixed,'Negative change in total fixed cash costs'],
 ['profit','2026 annualized operating profit',p.end,'FY2025 operating profit + all four bridge effects'],
 ['annual','Selected initiatives net annual benefit',x.annual,'Standalone benefit minus modeled overlap, using selected scenario'],
 ['upfront','Selected initiatives upfront funding',x.upfront,'One-time execution costs + capex'],
 ['slots','Execution team capacity used',x.slots,'Sum selected initiative slots']
 ];
}
function reset(owner){state.owner=owner||null;state.values={};state.checked=false;state.hints=false;state.selected={A:true,B:false,C:true};state.scenario='base';state.decision='';state.risks=''}
function check(){state.checked=true;return answerFields().every(([id,,value])=>{const v=String(state.values[id]??'').trim();return v!==''&&Number.isFinite(Number(v))&&Math.abs(Number(v)-value)<.025})}
function render(){
 const p=profitBridge(),x=portfolio(),fields=answerFields(),good=state.checked&&fields.every(([id,,value])=>{const v=String(state.values[id]??'').trim();return v!==''&&Number.isFinite(Number(v))&&Math.abs(Number(v)-value)<.025});
 const steps=[['FY2025 actual',p.start],['Volume/mix',p.volume],['Price',p.price],['Unit costs',p.cost],['Fixed cost',p.fixed],['2026 annualized',p.end]];
 return '<div class="lab-intro"><span class="learning-label">PHASE 4 · CONSULTING ANALYST LAB · SAJIRASA · SIMULATED</span><h2>Kenapa keuntungan ambruk?</h2><p>Bayangin toko menjual banyak barang tetapi pengeluaran untuk tiap barang ikut naik. Jangan asal menyimpulkan penyebab sebelum menjembatani angka. <strong>Yes, ini namanya Profit Bridge dan Hypothesis-Driven Problem Solving.</strong></p></div>'+
 '<div class="lab-layout"><article class="lab-paper"><span class="learning-label">CASE FACTS · Rp juta kecuali disebut lain</span><div class="lab-facts">'+[['FY2025 revenue','77,000'],['FY2025 variable cost','50,300'],['FY2025 fixed cost','19,700'],['2026 revenue run-rate','75,400'],['2026 variable cost','56,200'],['2026 fixed cost','20,600'],['CEO upfront limit','1,800'],['Execution slots','7']].map(a=>'<div><small>'+a[0]+'</small><strong>'+a[1]+'</strong></div>').join('')+'</div>'+
 '<h3>Profit bridge: FY2025 → annualized 2026</h3><p>2026 adalah annualized run-rate per 1 Oktober 2026, <strong>bukan laporan tahun penuh diaudit</strong>.</p><div class="lab-model-scroll"><table class="lab-model-table"><thead><tr><th>Driver</th><th>Rp juta</th></tr></thead><tbody>'+steps.map(a=>'<tr><th>'+a[0]+'</th><td>'+a[1].toLocaleString('en-US')+'</td></tr>').join('')+'</tbody></table></div>'+
 '<h3>CEO decision: pilih inisiatif</h3><p>Lu hanya punya Rp1,800 juta dan 7 slot tim. Centang strategi pilihanmu dan uji apakah cash serta kapasitas cukup.</p>'+
 '<div class="lab-choices">'+initiatives.map(z=>'<label><input type="checkbox" data-consult-choice="'+z.id+'" '+(state.selected[z.id]?'checked':'')+'><strong>'+h(z.id+' · '+z.name)+'</strong><small>Upfront Rp'+z.upfront+'m · '+z.slots+' slots</small></label>').join('')+'</div>'+
 '<div class="lab-projection-switch" role="group" aria-label="Select scenario">'+Object.keys(scenarios).map(z=>'<button type="button" data-consult-action="scenario" data-id="'+z+'" aria-pressed="'+(z===state.scenario)+'">'+h(z)+'</button>').join('')+'</div>'+
 '<div class="lab-model-summary"><div><small>Annual benefit after overlaps</small><strong>'+x.annual.toFixed(0)+'</strong></div><div><small>Overlap removed</small><strong>'+x.overlap.toFixed(0)+'</strong></div><div><small>Upfront spending</small><strong>'+x.upfront.toFixed(0)+'</strong></div><div><small>Slots used</small><strong>'+x.slots+'/7</strong></div><div><small>Within both constraints?</small><strong>'+(x.feasible?'YES':'NO')+'</strong></div></div>'+
 '<h3>Recalculate: eight learner checkpoints</h3>'+fields.map(([id,label,value,hint])=>'<div class="lab-line"><label for="consult-'+id+'"><small>'+h(state.hints?hint:'Hitung sendiri; petunjuk tersedia')+'</small><strong>'+h(label)+'</strong></label><input type="number" id="consult-'+id+'" data-consult-input="'+id+'" step="any" inputmode="decimal" value="'+h(state.values[id]??'')+'"></div>').join('')+
 '<div class="lab-controls"><button type="button" class="career-btn" data-consult-action="check">Periksa 8 angka</button><button type="button" class="career-btn" data-consult-action="hint">Buka petunjuk</button></div><p class="lab-feedback" role="status">'+(state.checked?(good?'8 angka cocok. '+(x.feasible?'Paket memenuhi batas awal, tetapi cek 90-day evidence gates.':'Paket MELANGGAR anggaran atau kapasitas; jangan rekomendasikan tanpa revisi.'):'Masih ada hitungan salah. Pastikan volume dalam ribu packs dan price dalam ribu rupiah/pack menghasilkan Rp juta.'):'Kerjakan angka sendiri sebelum memeriksa.')+'</p>'+
 '<section class="lab-decision"><h3>CEO recommendation — belum dinilai otomatis</h3><label for="consult-decision">Strategi yang layak, bukti, dan 90-day plan?</label><textarea id="consult-decision" data-consult-note="decision" rows="4">'+h(state.decision)+'</textarea><label for="consult-risks">Risiko, asumsi, kill criteria</label><textarea id="consult-risks" data-consult-note="risks" rows="4">'+h(state.risks)+'</textarea></section></article>'+
 '<aside class="lab-sidebar"><span class="learning-label">MANAGER CHALLENGE</span><h3>Profit ≠ root cause</h3><p>Profit bridge menjelaskan <em>kontribusi angka</em>, belum membuktikan perilaku pelanggan atau penyebab kenaikan biaya.</p><p><strong>Yes, ini namanya Causal Hypothesis vs Accounting Decomposition.</strong></p><p>Inisiatif A dan C yang berjalan bersama tidak bisa dijumlah begitu saja: penghematan pembelian tidak terjadi pada volume B2B yang sudah dihentikan.</p><p><strong>Yes, ini namanya Initiative Interaction / Double Counting.</strong></p><p>CEO harus menyetujui hanya paket yang memenuhi anggaran <strong>dan</strong> slot eksekusi; hasilnya perlu 90-day performance gates.</p><p class="lab-disclaimer">SajiRasa SIMULATED. Angka profit 2026 adalah annualized estimate, bukan audited FY2026. Latihan ini bukan verifikasi Excel upload atau review partner manusia. Jawaban dan memo lokal selama sesi, tanpa Supabase writes.</p></aside></div>';
}
function action(e){const b=e.target?.closest?.('[data-consult-action]');if(!b)return false;e.preventDefault();e.stopPropagation();if(b.dataset.consultAction==='check')check();if(b.dataset.consultAction==='hint')state.hints=true;if(b.dataset.consultAction==='scenario'&&scenarios[b.dataset.id]){state.scenario=b.dataset.id;state.values={};state.checked=false}host?.render?.();return true}
function input(e){const z=e.target;if(z?.dataset?.consultInput){state.values[z.dataset.consultInput]=z.value;state.checked=false;return true}if(z?.dataset?.consultNote){state[z.dataset.consultNote]=z.value;return true}if(z?.dataset?.consultChoice){state.selected[z.dataset.consultChoice]=!!z.checked;state.values={};state.checked=false;host?.render?.();return true}return false}
window.SELFConsultingLab={init(api){host=api},profitBridge,portfolio,answerFields,reset,check,render,action,input,state,scenarios};
})();