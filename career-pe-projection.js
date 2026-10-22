/* SELF Career Prep / Phase 4: Aruna 5-year debt and equity return projection. SIMULATED. */
(function(){
'use strict';
const historical={revenue:345,nwc:110};
const terms={entryEV:273,fees:5,minimumCash:12,newDebt:130,oldDebt:80,existingCash:13.54,amort:7,revolverLimit:25,revolverRate:.14,taxRate:.22,cashSweep:.5,years:5,hurdle:.20};
const d={
 base:[
 [2026,.12,.115,.295,14,9,.11,7,4.25,1],
 [2027,.10,.120,.275,15,10,.11,7,3.75,1.15],
 [2028,.09,.125,.255,16,11,.11,7,3.25,1.15],
 [2029,.08,.130,.240,17,12,.11,7,3.00,1.15],
 [2030,.07,.130,.230,18,13,.11,7,2.75,1.15]],
 downside:[
 [2026,.03,.102,.340,13,9,.13,7,4.25,1],
 [2027,.01,.101,.360,14,10,.13,7,3.75,1.15],
 [2028,.04,.108,.360,15,11,.13,7,3.25,1.15],
 [2029,.05,.112,.350,16,12,.13,7,3.00,1.15],
 [2030,.05,.115,.340,17,13,.13,7,2.75,1.15]]
};
function project(scenario){
 if(!Object.hasOwn(d,scenario))throw Error('Unknown scenario');
 let sales=historical.revenue,nwc=historical.nwc,term=terms.newDebt,revolver=0,cash=terms.minimumCash;
 const results=[];
 for(const [year,growth,margin,nwcShare,capex,dep,rate,exitMultiple,maxLeverage,minDscr] of d[scenario]){
  const old={sales,nwc,term,revolver,cash};
  sales*=1+growth;
  const ebitda=sales*margin;
  const interest=term*rate+revolver*terms.revolverRate;
  const tax=Math.max(0,(ebitda-dep-interest)*terms.taxRate);
  nwc=sales*nwcShare;
  const deltaNwc=nwc-old.nwc;
  const cfads=ebitda-tax-capex-deltaNwc;
  const mandatory=Math.min(terms.amort,term);
  term-=mandatory;
  cash+=cfads-interest-mandatory;
  const draw=Math.min(Math.max(0,terms.revolverLimit-revolver),Math.max(0,terms.minimumCash-cash));
  revolver+=draw;cash+=draw;
  const rescue=Math.max(0,terms.minimumCash-cash);
  cash+=rescue;
  const repay=Math.min(revolver,Math.max(0,cash-terms.minimumCash));
  revolver-=repay;cash-=repay;
  const sweep=revolver<1e-9?Math.min(term,terms.cashSweep*Math.max(0,cash-terms.minimumCash)):0;
  term-=sweep;cash-=sweep;
  const dscr=cfads/(interest+mandatory);
  const leverage=(term+revolver-cash)/ebitda;
  const dscrPass=dscr>=minDscr-1e-9,leveragePass=leverage<=maxLeverage+1e-9;
  results.push({year,revenue:sales,ebitda,nwc,deltaNwc,capex,interest,tax,cfads,mandatory,draw,repay,sweep,term,revolver,cash,rescue,dscr,leverage,dscrPass,leveragePass,exitMultiple});
 }
 return results;
}
function entryEquity(ev=terms.entryEV){return ev+terms.fees+terms.minimumCash-terms.newDebt}
function exitProceeds(rows,multiple=7){const a=rows[4];return a.ebitda*multiple-a.term-a.revolver+a.cash}
function annualIrr(initial,calls,proceeds){
 const npv=r=>-initial+calls.reduce((s,x,i)=>s-x/Math.pow(1+r,i+1),0)+proceeds/Math.pow(1+r,5);
 let lo=-.99,hi=4;if(!(npv(lo)>0&&npv(hi)<0))return null;
 for(let i=0;i<140;i++){const mid=(lo+hi)/2;if(npv(mid)>0)lo=mid;else hi=mid}
 return (lo+hi)/2;
}
function summary(name,ev=273,multiple=7){
 const rows=project(name),calls=rows.map(x=>x.rescue),proceeds=exitProceeds(rows,multiple);
 return {rows,entryEquity:entryEquity(ev),exitProceeds:proceeds,moic:proceeds/(entryEquity(ev)+calls.reduce((a,b)=>a+b,0)),irr:annualIrr(entryEquity(ev),calls,proceeds),totalRescue:calls.reduce((a,b)=>a+b,0),covenantsPass:rows.every(r=>r.dscrPass&&r.leveragePass)};
}
const state={owner:null,scenario:'base',values:{},checked:false,hint:false};
let host=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reset(owner){state.owner=owner||null;state.scenario='base';state.values={};state.checked=false;state.hint=false}
function cells(){
 const p=summary(state.scenario),y=p.rows[0],z=p.rows[4];
 return [
 {id:'revenue',label:'FY2026 projected revenue',v:y.revenue,hint:'FY2025 revenue × (1 + FY2026 growth)',unit:'Rp bn'},
 {id:'ebitda',label:'FY2026 EBITDA',v:y.ebitda,hint:'FY2026 revenue × FY2026 EBITDA margin',unit:'Rp bn'},
 {id:'deltaNwc',label:'FY2026 increase in operating NWC',v:y.deltaNwc,hint:'FY2026 projected NWC − FY2025 operating NWC',unit:'Rp bn'},
 {id:'cfads',label:'FY2026 cash available for debt service',v:y.cfads,hint:'EBITDA − cash tax − capex − increase in NWC',unit:'Rp bn'},
 {id:'endingDebt',label:'FY2030 term debt',v:z.term,hint:'FY2026–30 roll-forward: opening term debt − mandatory principal − sweep',unit:'Rp bn'},
 {id:'exitEquity',label:'FY2030 exit equity proceeds (7×)',v:p.exitProceeds,hint:'FY2030 EBITDA × 7 − remaining term/revolver + cash',unit:'Rp bn'},
 {id:'irr',label:'Sponsor annual IRR',v:p.irr*100,hint:'Solve NPV of initial equity, intermediate capital rescues, and exit proceeds = 0',unit:'%'}
 ];
}
function grade(){
 state.checked=true;return cells().every(c=>String(state.values[c.id]??'').trim()!==''&&Number.isFinite(Number(state.values[c.id]))&&Math.abs(Number(state.values[c.id])-c.v)<=Math.max(.015,Math.abs(c.v)*.00003));
}
function render(){
 const p=summary(state.scenario),lines=cells(),passed=state.checked&&gradeWithoutState();
 return '<section class="lab-projection"><div class="lab-intro"><span class="learning-label">ARUNA SUPPLY · 5-YEAR LBO MODEL · SIMULATED</span><h2>Profit bisa naik, tapi apakah utangnya bisa dibayar?</h2><p>Bayangin usaha dengan cicilan tetap, tapi pemasukan kasnya naik-turun. Bank tetap menagih. <strong>Yes, ini namanya Debt Service Coverage Ratio (DSCR)</strong> dan <strong>Debt Schedule</strong>. Keduanya perlu dicek sebelum percaya angka IRR.</p></div>'+
 '<div class="lab-projection-switch" role="group" aria-label="Model scenario"><button type="button" data-pe-model="scenario" data-scenario="base" aria-pressed="'+(state.scenario==='base')+'">Base case</button><button type="button" data-pe-model="scenario" data-scenario="downside" aria-pressed="'+(state.scenario==='downside')+'">Downside case</button></div>'+
 '<div class="lab-model-scroll"><table class="lab-model-table"><thead><tr><th>Model line · Rp miliar</th>'+p.rows.map(r=>'<th>'+r.year+'</th>').join('')+'</tr></thead><tbody>'+
 [['Revenue','revenue'],['EBITDA','ebitda'],['Δ NWC (cash absorbed)','deltaNwc'],['CFADS','cfads'],['Interest','interest'],['Mandatory amortization','mandatory'],['Ending term debt','term'],['Revolver drawn','revolver'],['Ending cash','cash'],['Sponsor rescue injection','rescue'],['DSCR','dscr'],['Net debt / EBITDA','leverage']].map(([title,k])=>'<tr><th>'+title+'</th>'+p.rows.map(r=>'<td>'+((k==='dscr'||k==='leverage')?r[k].toFixed(2)+'×':r[k].toFixed(2))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
 '<div class="lab-model-summary"><div><small>Entry equity</small><strong>'+p.entryEquity.toFixed(2)+'</strong></div><div><small>Exit proceeds, 7×</small><strong>'+p.exitProceeds.toFixed(2)+'</strong></div><div><small>Sponsor rescue</small><strong>'+p.totalRescue.toFixed(2)+'</strong></div><div><small>Annual IRR</small><strong>'+(100*p.irr).toFixed(2)+'%</strong></div><div><small>Lender covenants</small><strong>'+(p.covenantsPass?'Pass':'FAIL')+'</strong></div></div>'+
 '<h3>Independent calculation checkpoints</h3><p>Proyeksi di atas adalah <em>reference illustration</em>. Isi ulang 7 angka dari asumsi kasus dan jelaskan bagaimana lu mendapatkannya. Angka di bawah tidak terisi otomatis.</p>'+
 '<div class="lab-model-exercises">'+lines.map(c=>'<div class="lab-model-exercise"><label for="pe-model-'+c.id+'">'+esc(c.label)+' <small>('+c.unit+')</small></label><input type="number" step="any" inputmode="decimal" id="pe-model-'+c.id+'" data-pe-model-input="'+c.id+'" value="'+esc(state.values[c.id]??'')+'" aria-label="'+esc(c.label)+'"></div>').join('')+'</div>'+
 '<div class="lab-controls"><button type="button" class="career-btn" data-pe-model="grade">Periksa 7 checkpoint</button><button type="button" class="career-btn" data-pe-model="hint">Lihat rumus</button></div>'+
 (state.hint?'<div class="lab-hints">'+lines.map(c=>'<p><strong>'+esc(c.label)+':</strong> '+esc(c.hint)+'</p>').join('')+'</div>':'')+
 '<p role="status" class="lab-feedback">'+(state.checked?(passed?'Tujuh angka cocok pada skenario '+state.scenario+'. '+(p.covenantsPass?'Covenant lulus untuk angka simulasi ini.':'PENTING: covenant gagal. IRR positif bukan izin otomatis untuk berinvestasi.'):'Masih ada nilai yang keliru. Periksa satuan dan cek kembali cash-flow/debt schedule.'):'Hitung ulang sendiri sebelum menekan Periksa.')+'</p>'+
 '<p class="lab-disclaimer">Model ini memakai asumsi kasus simulasi Aruna, bukan data transaksi aktual. Angka 5 tahun menampilkan solusi <em>guided</em> untuk dipelajari; bukan blind case, bukan verifikasi file Excel upload, dan bukan rekomendasi investasi. MOIC termasuk total capital calls untuk perbandingan kasar; IRR memakai waktu masing-masing capital call.</p></section>';
}
function gradeWithoutState(){return cells().every(c=>String(state.values[c.id]??'').trim()!==''&&Number.isFinite(Number(state.values[c.id]))&&Math.abs(Number(state.values[c.id])-c.v)<=Math.max(.015,Math.abs(c.v)*.00003))}
function action(e){const el=e.target?.closest?.('[data-pe-model]');if(!el)return false;e.preventDefault();e.stopPropagation();const a=el.dataset.peModel;
 if(a==='scenario'){state.scenario=el.dataset.scenario==='downside'?'downside':'base';state.values={};state.checked=false;state.hint=false}
 if(a==='hint')state.hint=true;
 if(a==='grade')grade();
 host?.render?.();return true;
}
function input(e){const el=e.target;if(!el?.dataset?.peModelInput)return false;state.values[el.dataset.peModelInput]=el.value;state.checked=false;return true}
window.SELFPEProjection={init(api){host=api},project,summary,annualIrr,entryEquity,exitProceeds,cells,grade,reset,render,action,input,state,terms,drivers:d};
})();