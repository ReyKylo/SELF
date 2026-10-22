(function(){
'use strict';
const m=()=>window.SELFPEProjection;
const state={entry:273,exit:7,hurdle:20,bid:'',checked:false};
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function result(scenario,entry,exit){
 const model=m().summary(scenario,entry,exit);
 return {irr:model.irr,moic:model.exitProceeds/(model.entryEquity+model.totalRescue),equity:model.entryEquity,proceeds:model.exitProceeds,covenants:model.covenantsPass};
}
function maximum(scenario,exit,target){
 const rows=m().project(scenario),proceeds=m().exitProceeds(rows,exit),rate=target/100;
 const calls=rows.reduce((sum,row,i)=>sum+row.rescue/Math.pow(1+rate,i+1),0);
 const affordable=proceeds/Math.pow(1+rate,5)-calls;
 return affordable-m().terms.fees-m().terms.minimumCash+m().terms.newDebt;
}
function reset(){Object.assign(state,{entry:273,exit:7,hurdle:20,bid:'',checked:false})}
function render(){
 const scenario=m().state.scenario,v=result(scenario,state.entry,state.exit);
 const max=maximum(scenario,state.exit,state.hurdle);
 const matrix=[260,273,285].map(entry=>'<tr><th>'+entry+'</th>'+[6,7,8].map(exit=>'<td>'+((result(scenario,entry,exit).irr||0)*100).toFixed(2)+'%</td>').join('')+'</tr>').join('');
 const valid=state.checked&&String(state.bid).trim()!==''&&Math.abs(Number(state.bid)-max)<.02;
 return '<section class="lab-projection"><span class="learning-label">ENTRY / EXIT SENSITIVITY · SIMULATED</span><h2>Berapa harga tertinggi yang boleh dibayar?</h2><p>Seperti membeli rumah untuk dijual lagi: harga beli yang terlalu tinggi membuat keuntungan mengecil. <strong>Yes, ini namanya Entry/Exit Multiple Sensitivity dan Maximum Bid.</strong></p>'+
 '<div class="lab-model-exercises">'+[['entry','Entry EV · Rp bn',130,800],['exit','Exit multiple · ×',2,15],['hurdle','Target annual IRR · %',5,60]].map(([id,label,min,max])=>'<div class="lab-model-exercise"><label for="sens-'+id+'">'+label+'</label><input id="sens-'+id+'" data-sens-input="'+id+'" type="number" min="'+min+'" max="'+max+'" step="any" value="'+safe(state[id])+'"></div>').join('')+'</div>'+
 '<div class="lab-model-summary"><div><small>Sponsor equity</small><strong>'+v.equity.toFixed(2)+'</strong></div><div><small>Exit proceeds</small><strong>'+v.proceeds.toFixed(2)+'</strong></div><div><small>MOIC*</small><strong>'+v.moic.toFixed(2)+'×</strong></div><div><small>Annual IRR</small><strong>'+(100*v.irr).toFixed(2)+'%</strong></div><div><small>Covenants</small><strong>'+(v.covenants?'PASS':'FAIL')+'</strong></div></div>'+
 '<h3>Return matrix — entry EV versus exit multiple</h3><div class="lab-model-scroll"><table class="lab-model-table"><thead><tr><th>Entry EV Rpbn</th><th>6×</th><th>7×</th><th>8×</th></tr></thead><tbody>'+matrix+'</tbody></table></div>'+
 '<div class="lab-decision"><h3>Giliran lu: hitung maximum bid</h3><p>Target IRR '+state.hurdle+'% dan exit '+state.exit+'×. Tentukan EV maksimum, termasuk efek sponsor rescue jika ada.</p><label for="sens-bid">Your maximum bid · Rp bn</label><input id="sens-bid" type="number" step="any" data-sens-input="bid" value="'+safe(state.bid)+'">'+
 '<div class="lab-controls"><button type="button" class="career-btn" data-sens-action="check">Periksa maximum bid</button><button type="button" class="career-btn" data-sens-action="reset">Reset</button></div>'+
 '<p class="lab-feedback" role="status">'+(state.checked?(valid?'Benar. Batas return-only Rp'+max.toFixed(3)+'bn. Tetap wajib uji lender covenants dan liquidity.':'Belum tepat. Diskontokan exit proceeds dan setiap suntikan modal sesuai tahunnya.'):'Belum diperiksa.')+'</p>'+
 '<p class="lab-disclaimer">Simulated case only. Maximum bid assumes unchanged operating forecast and funding terms. *MOIC uses aggregate capital contributed; IRR reflects each capital call timing. Not a lender approval, blind assessment or investment recommendation.</p></div></section>';
}
function action(e){const b=e.target?.closest?.('[data-sens-action]');if(!b)return false;e.preventDefault();e.stopPropagation();if(b.dataset.sensAction==='reset')reset();if(b.dataset.sensAction==='check')state.checked=true;window.SELFCareerSensitivity.host?.render?.();return true}
function input(e){const id=e.target?.dataset?.sensInput;if(!id)return false;const n=Number(e.target.value);if(id==='bid')state.bid=e.target.value;else if(Number.isFinite(n)&&({entry:n>=130&&n<=800,exit:n>=2&&n<=15,hurdle:n>=5&&n<=60}[id]))state[id]=n;state.checked=false;if(id!=='bid')window.SELFCareerSensitivity.host?.render?.();return true}
window.SELFCareerSensitivity={state,result,maximum,render,reset,action,input,host:null,init(h){this.host=h}};
})();