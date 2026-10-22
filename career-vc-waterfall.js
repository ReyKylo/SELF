/* SELF Phase 4 / ArusOps venture waterfall, educational simulated figures. */
(function(){
'use strict';
const f={preShares:12000000,founder:8400000,seed:2400000,options:1200000,preA:24000000,raiseA:6000000,lead:4000000,pool:.15,preB:45000000,raiseB:15000000,newOptions:.05,years:5};
const exits=[['distress',20000000],['low',75000000],['base',300000000],['upside',800000000]];
const state={owner:null,exit:20000000,values:{},checked:false,hint:false};
let host=null;
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cap(){
 const r=f.raiseA/f.preA;
 const top=(f.pool*(1+r)*f.preShares-f.options)/(1-f.pool*(1+r));
 const price=f.preA/(f.preShares+top);
 const afterA={founder:f.founder,seed:f.seed,pool:f.options+top,lead:f.lead/price,coinvest:(f.raiseA-f.lead)/price};
 const totalA=Object.values(afterA).reduce((a,b)=>a+b,0);
 const bShares=totalA*f.raiseB/f.preB;
 const extra=(totalA+bShares)*f.newOptions/(1-f.newOptions);
 const fd=totalA+bShares+extra;
 return {top,price,afterA,totalA,bShares,extra,fd,leadAfterA:afterA.lead/totalA,leadFinal:afterA.lead/fd,seriesB:bShares/fd,seriesAFinal:(afterA.lead+afterA.coinvest)/fd};
}
function exitReturn(amount){
 if(!Number.isFinite(amount)||amount<0)throw Error('Invalid exit');
 const c=cap();
 // Explicit teaching cases in Phase 2: senior B preference, A preference if no conversion;
 // at the supplied exits >=75m all preferred classes convert (checked against returns).
 let lead;
 let mode;
 if(amount<=f.raiseB){lead=0;mode='Senior B preference; A receives zero';}
 else if(amount<=(f.raiseB+f.raiseA)){lead=Math.min(amount-f.raiseB,f.raiseA)*f.lead/f.raiseA;mode='B senior then A pari passu original preference';}
 else {
  const common=amount*c.leadFinal;
  const preference=Math.min(f.raiseA,Math.max(0,amount-f.raiseB))*f.lead/f.raiseA;
  if(common>=preference){lead=common;mode='Preferred converts to common (simplified case)';}
  else {lead=preference;mode='A 1x nonparticipating preference (simplified case)';}
 }
 return {exit:amount,lead,moic:lead/f.lead,irr:Math.pow(lead/f.lead,1/f.years)-1,mode,leadPct:c.leadFinal};
}
function expected(){
 const c=cap(),v=exitReturn(state.exit);
 return [
  ['pool','Series A pool top-up shares',c.top,'Pre-money holders bear dilution'],
  ['a','Lead Series A post-close ownership %',c.leadAfterA*100,'Lead A shares ÷ fully diluted post-A'],
  ['b','Lead ownership after Series B and options %',c.leadFinal*100,'A stake × 45/60 × 95%'],
  ['proceeds','Lead exit proceeds USD',v.lead,'Senior B 1x preference then A; convert when better'],
  ['moic','Lead gross MOIC',v.moic,'Exit proceeds / initial lead investment'],
  ['irr','Five-year gross IRR %',v.irr*100,'(MOIC^(1/5)−1)×100']
 ];
}
function reset(owner){state.owner=owner||null;state.exit=20000000;state.values={};state.checked=false;state.hint=false}
function grade(){state.checked=true;return expected().every(([id,_,value])=>{const x=String(state.values[id]??'').trim();return x!==''&&Number.isFinite(Number(x))&&Math.abs(Number(x)-value)<=Math.max(.025,Math.abs(value)*.000001)})}
function render(){
 const c=cap(),r=exitReturn(state.exit);
 const rows=exits.map(([label,amount])=>{const v=exitReturn(amount);return '<tr><th>'+h(label)+'</th><td>'+(amount/1e6).toFixed(0)+'m</td><td>'+(v.lead/1e6).toFixed(3)+'m</td><td>'+v.moic.toFixed(2)+'×</td><td>'+(v.irr*100).toFixed(2)+'%</td></tr>'}).join('');
 const good=state.checked&&expected().every(([id,_,value])=>{const x=String(state.values[id]??'').trim();return x!==''&&Number.isFinite(Number(x))&&Math.abs(Number(x)-value)<=Math.max(.025,Math.abs(value)*.000001)});
 return '<section class="lab-projection"><span class="learning-label">VENTURE CAPITAL · FINANCING & EXIT WATERFALL · SIMULATED</span><h2>Kepemilikan hari ini ≠ uang diterima saat exit.</h2><p>Bayangin satu kue dibagi lagi saat investor baru masuk, lalu ada investor yang berhak dibayar lebih dulu saat kue dijual. <strong>Yes, ini namanya Fully Diluted Cap Table, Dilution dan Nonparticipating Liquidation Preference.</strong></p>'+
 '<div class="lab-facts">'+[['Series A pre-money','$24m'],['Series A raise','$6m'],['Lead investment','$4m'],['Option pool post A','15%'],['Series B new money','$15m'],['Series B pre-money','$45m'],['New post-B options','5%'],['Series B senior preference','1×']].map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('')+'</div>'+
 '<div class="lab-model-summary"><div><small>Lead after A</small><strong>'+(c.leadAfterA*100).toFixed(2)+'%</strong></div><div><small>Lead final FD</small><strong>'+(c.leadFinal*100).toFixed(2)+'%</strong></div><div><small>Original A pool top-up</small><strong>'+c.top.toFixed(0)+' shares</strong></div><div><small>Selected exit lead return</small><strong>$'+(r.lead/1e6).toFixed(3)+'m</strong></div></div>'+
 '<div class="lab-projection-switch" role="group" aria-label="Choose exit scenario">'+exits.map(([label,value])=>'<button type="button" data-vcw-action="exit" data-value="'+value+'" aria-pressed="'+(state.exit===value)+'">'+h(label)+' · $'+(value/1e6)+'m</button>').join('')+'</div>'+
 '<p><strong>Waterfall branch:</strong> '+h(r.mode)+'. The senior Series B preference changes investor payout at distressed exits.</p>'+
 '<div class="lab-model-scroll"><table class="lab-model-table"><thead><tr><th>Scenario</th><th>Exit equity</th><th>Lead proceeds</th><th>MOIC</th><th>IRR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<h3>Build it yourself — six checkpoints</h3><div class="lab-model-exercises">'+expected().map(([id,label,value,hint])=>'<div class="lab-model-exercise"><label for="vcw-'+id+'">'+h(label)+(state.hint?'<small> · '+h(hint)+'</small>':'')+'</label><input id="vcw-'+id+'" type="number" step="any" inputmode="decimal" data-vcw-input="'+id+'" value="'+h(state.values[id]??'')+'"></div>').join('')+'</div>'+
 '<div class="lab-controls"><button type="button" class="career-btn" data-vcw-action="check">Periksa 6 angka</button><button type="button" class="career-btn" data-vcw-action="hint">Lihat petunjuk</button></div>'+
 '<p class="lab-feedback" role="status">'+(state.checked?(good?'Enam angka cocok. Sekarang jelaskan mengapa kepemilikan 9.5% tidak berarti investor selalu menerima 9.5% dari setiap exit.':'Masih ada perhitungan keliru. Cek pool top-up, fully diluted denominator, seniority dan mode conversion.'):'Pilih exit scenario, hitung sendiri, lalu periksa.')+'</p>'+
 '<p class="lab-disclaimer">Case simulated. Low/base/upside use all-convert outcomes; distress exercises senior B/A original 1× preferences. This is a deliberately scoped case waterfall, not general-purpose preferred-equity legal modeling; no participating preferred, multiple classes or fees/carry. Reviewer answers remain outside the browser.</p></section>';
}
function action(e){const b=e.target?.closest?.('[data-vcw-action]');if(!b)return false;e.preventDefault();e.stopPropagation();if(b.dataset.vcwAction==='exit'){state.exit=Number(b.dataset.value);state.checked=false;state.values={}}else if(b.dataset.vcwAction==='check')grade();else if(b.dataset.vcwAction==='hint')state.hint=true;host?.render?.();return true}
function input(e){const id=e.target?.dataset?.vcwInput;if(!id)return false;state.values[id]=e.target.value;state.checked=false;return true}
window.SELFVCWaterfall={init(api){host=api},cap,exitReturn,expected,reset,grade,render,action,input,state,exits};
})();