/* SELF Investment Intelligence / Phase 1.3 — analyst-authored subscription financial model.
 * This is a LEARNING SANDBOX, not Shopify's historical 2011 forecast.
 * No changes to the legacy SELF schema, database, or app storage.
 */
const II13_KEY='self.investment.model.v13';
const II13_HIST=Object.freeze({asOf:'2010-10-12',approxCustomers:10000,mrr:438000,averagePrice:45,cacMin:175,cacMax:225});
const ii13Defaults={tab:'model',scenario:'base',adds:850,churn:4,arpu:43.8,margin:75,cac:200,reasoning:'',quizChoice:'',quizFeedback:'',quizCorrect:false,snapshot:null};
let ii13StorageOK=true;
function ii13Clamp(n,min,max){return Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):min}
function ii13Num(n,d=0){return Number(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d})}
function ii13USD(n,d=0){return 'US$'+ii13Num(n,d)}
function ii13Read(){
 try{
  const raw=localStorage.getItem(II13_KEY);if(!raw)return {...ii13Defaults};
  const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v))return {...ii13Defaults};
  const o={...ii13Defaults};
  for(const k of ['adds','churn','arpu','margin','cac'])if(Object.prototype.hasOwnProperty.call(v,k))o[k]=ii13Clamp(v[k],...({adds:[0,5000],churn:[0,20],arpu:[5,200],margin:[30,95],cac:[50,1000]})[k]);
  if(['model','sensitivity','challenge'].includes(v.tab))o.tab=v.tab;
  if(['base','downside','upside'].includes(v.scenario))o.scenario=v.scenario;
  for(const k of ['reasoning','quizChoice','quizFeedback'])if(typeof v[k]==='string')o[k]=v[k].slice(0,k==='reasoning'?4000:500);
  o.quizCorrect=v.quizCorrect===true;
  if(v.snapshot&&typeof v.snapshot==='object'&&typeof v.snapshot.savedAt==='string'&&typeof v.snapshot.scenario==='string')o.snapshot={savedAt:v.snapshot.savedAt.slice(0,40),scenario:v.snapshot.scenario.slice(0,20),inputs:v.snapshot.inputs||{},summary:v.snapshot.summary||{}};
  return o;
 }catch(e){ii13StorageOK=false;return {...ii13Defaults}}
}
let ii13State=ii13Read();
function ii13Store(){try{localStorage.setItem(II13_KEY,JSON.stringify(ii13State));ii13StorageOK=true;return true}catch(e){ii13StorageOK=false;return false}}
function ii13Params(scenario,raw=ii13State){
 const p={adds:ii13Clamp(raw.adds,0,5000),churn:ii13Clamp(raw.churn,0,20),arpu:ii13Clamp(raw.arpu,5,200),margin:ii13Clamp(raw.margin,30,95),cac:ii13Clamp(raw.cac,50,1000)};
 if(scenario==='downside')return {adds:Math.round(p.adds*.65),churn:Math.min(20,p.churn+2),arpu:+(p.arpu*.95).toFixed(2),margin:Math.max(30,p.margin-5),cac:+(p.cac*1.1).toFixed(2)};
 if(scenario==='upside')return {adds:Math.round(p.adds*1.30),churn:Math.max(0,p.churn-1),arpu:+(p.arpu*1.07).toFixed(2),margin:Math.min(95,p.margin+3),cac:+(p.cac*.95).toFixed(2)};
 return p;
}
function ii13Compute(p){
 const inputs={adds:ii13Clamp(p.adds,0,7000),churn:ii13Clamp(p.churn,0,20),arpu:ii13Clamp(p.arpu,1,250),margin:ii13Clamp(p.margin,1,100),cac:ii13Clamp(p.cac,1,1500)};
 const rows=[];let customers=II13_HIST.approxCustomers;let yearRevenue=0,yearGrossProfit=0,yearAcquisition=0,yearNetContribution=0;
 for(let month=1;month<=12;month++){
  const opening=customers,lost=opening*inputs.churn/100;
  customers=Math.max(0,opening-lost+inputs.adds);
  const mrr=customers*inputs.arpu,grossProfit=mrr*inputs.margin/100,acquisitionCost=inputs.adds*inputs.cac,contribution=grossProfit-acquisitionCost;
  yearRevenue+=mrr;yearGrossProfit+=grossProfit;yearAcquisition+=acquisitionCost;yearNetContribution+=contribution;
  rows.push({month,opening,lost,adds:inputs.adds,customers,mrr,grossProfit,acquisitionCost,contribution});
 }
 const ending=rows[11];
 const simplePayback=inputs.cac/(inputs.arpu*inputs.margin/100);
 return {inputs,rows,ending,yearRevenue,yearGrossProfit,yearAcquisition,yearNetContribution,arrRunRate:ending.mrr*12,payback:simplePayback,asOf:II13_HIST.asOf};
}
function ii13LabelScenario(x){return {base:'Base Case',downside:'Downside',upside:'Upside'}[x]||'Base Case'}
function ii13Button(text,action,value='',style='ii13-button'){return '<button type="button" class="'+style+'" data-ii13="'+action+'" data-value="'+iiEsc(value)+'">'+text+'</button>'}
function ii13Input(label,field,min,max,step,unit,explain){
 return '<label class="ii13-input-label"><span>'+label+' <small>'+unit+'</small></span><input type="number" data-ii13-input="'+field+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+iiEsc(ii13State[field])+'" aria-label="'+label+'"><em>'+explain+'</em></label>';
}
function ii13Metric(title,value,foot,cls=''){
 return '<article class="ii13-metric '+cls+'"><small>'+title+'</small><strong>'+value+'</strong><span>'+foot+'</span></article>';
}
function ii13MetricCards(m){
 return ii13Metric('END CUSTOMERS',ii13Num(Math.round(m.ending.customers)),'Projected month 12, not historical')+
 ii13Metric('END MRR',ii13USD(m.ending.mrr),'Month 12 projected recurring revenue')+
 ii13Metric('ARR RUN-RATE',ii13USD(m.arrRunRate),'Month 12 MRR × 12; not booked revenue')+
 ii13Metric('SIMPLE CAC PAYBACK',ii13Num(m.payback,1)+' mo','Excludes churn, opex and changing cohorts','ii13-metric-amber');
}
function ii13Bars(m){
 const highest=Math.max(II13_HIST.mrr,...m.rows.map(x=>x.mrr),1);
 const months=[{label:'2010',mrr:II13_HIST.mrr,historical:true},...m.rows.filter(x=>x.month%2===0).map(x=>({label:'M'+x.month,mrr:x.mrr,historical:false}))];
 return '<div class="ii13-chart" role="img" aria-label="Historical 2010 MRR and scenario-generated monthly MRR every two months.">'+months.map(x=>'<div class="ii13-bar-group"><span>'+ii13USD(x.mrr/1000,0)+'K</span><div class="ii13-bar-shell"><i class="'+(x.historical?'ii13-historical':'')+'" style="height:'+Math.max(2,x.mrr/highest*100).toFixed(1)+'%"></i></div><small>'+x.label+'</small></div>').join('')+'</div><div class="ii13-chart-key"><span><i></i>Historical starting MRR</span><span><i></i>Scenario projection, not actual data</span></div>';
}
function ii13Table(m){
 return '<div class="ii13-table-wrap"><table class="ii13-table"><thead><tr><th>Month</th><th>End customers</th><th>MRR (US$)</th><th>Gross profit</th><th>Acquisition spend</th><th>Contribution*</th></tr></thead><tbody>'+m.rows.map(x=>'<tr><th scope="row">M'+x.month+'</th><td>'+ii13Num(Math.round(x.customers))+'</td><td>'+ii13Num(x.mrr)+'</td><td>'+ii13Num(x.grossProfit)+'</td><td>'+ii13Num(x.acquisitionCost)+'</td><td>'+ii13Num(x.contribution)+'</td></tr>').join('')+'</tbody><tfoot><tr><th>12-mo total</th><td>—</td><td>'+ii13Num(m.yearRevenue)+'</td><td>'+ii13Num(m.yearGrossProfit)+'</td><td>'+ii13Num(m.yearAcquisition)+'</td><td>'+ii13Num(m.yearNetContribution)+'</td></tr></tfoot></table></div><p class="ii13-method-foot">* Contribution = monthly estimated gross profit less new customer acquisition spend, BEFORE operating expenses, capex, tax, financing and cash timing. It is neither net profit nor actual Shopify cash flow.</p>';
}
function ii13ModelView(){
 const p=ii13Params(ii13State.scenario),m=ii13Compute(p);
 return '<section class="ii13-grid"><article class="ii13-workbench"><div class="ii13-panel-heading"><span class="ii-overline">YOUR ASSUMPTIONS / NOT COMPANY GUIDANCE</span><h2>Build the revenue engine.</h2><p>Ubah input Base Case di bawah. Downside dan Upside adalah transformasi eksplisit dari input Base Case lu.</p></div><div class="ii13-input-grid">'+ii13Input('New customers each month','adds',0,5000,25,'merchants','Assumption · fixed monthly acquisitions')+ii13Input('Monthly logo churn','churn',0,20,.5,'%','Assumption · same rate applied every month')+ii13Input('Average monthly revenue / merchant','arpu',5,200,.1,'US$','Starting estimate: 438K MRR ÷ ~10,000')+ii13Input('Gross margin','margin',30,95,1,'%','Hypothetical · not sourced from the memo')+ii13Input('Customer acquisition cost','cac',50,1000,5,'US$','Assumption · historical range was $175–225')+'</div><div class="ii13-method-box"><strong>Formula preview</strong><p>End customers = opening customers × (1 − churn) + new customers. MRR = end customers × ARPU. Simple CAC payback = CAC ÷ (ARPU × gross margin).</p><p>This is a <strong>simplified logo-based model</strong>: no cohorts, expansion revenue, pricing tiers, GMV/transaction fees, nonlinear marketing capacity, or cash runway.</p></div></article><aside class="ii13-guide"><span class="ii-overline">MICROLESSON / FIVE-MINUTE BRIEF</span><h3>Growth can hide a leak.</h3><p>Bayangin 850 pelanggan baru masuk setiap bulan, tapi pelanggan lama terus keluar. MRR bisa naik, stagnan, atau turun—bergantung balance keduanya.</p><div class="ii13-anchors"><small>2010 HISTORICAL ANCHOR</small><strong>~10,000 merchants</strong><strong>US$438K MRR</strong><span>From Bessemer’s Oct 2010 memo</span></div><p>Perhatikan: dalam original memo, Shopify belum membuat forecast 2011. Jadi semua bulan M1–M12 di worksheet ini adalah <strong>lu yang memproyeksikan</strong>, bukan data yang diketahui investor saat itu.</p><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Check original Bessemer memo ↗</a></aside></section><section class="ii13-results"><div class="ii13-panel-heading"><div><span class="ii-overline">MODEL OUTPUT / '+ii13LabelScenario(ii13State.scenario).toUpperCase()+'</span><h2>What your assumptions imply.</h2></div><span class="ii13-caveat">SCENARIO · NOT REPORTED FINANCIALS</span></div><div id="ii13-metrics" class="ii13-metrics">'+ii13MetricCards(m)+'</div><div class="ii13-analysis-grid"><article class="ii13-chart-panel"><div class="ii13-panel-heading"><div><span class="ii-overline">MONTHLY RECURRING REVENUE</span><h3>Historical anchor → 12-month scenario</h3></div></div><div id="ii13-bars">'+ii13Bars(m)+'</div></article><div class="ii13-annual"><small>12 MONTHS / SCENARIO</small><div><span>Revenue modeled</span><strong id="ii13-revenue">'+ii13USD(m.yearRevenue)+'</strong></div><div><span>Acquisition spend</span><strong id="ii13-acquisition">'+ii13USD(m.yearAcquisition)+'</strong></div><div><span>Gross profit less CAC*</span><strong id="ii13-contribution">'+ii13USD(m.yearNetContribution)+'</strong></div><p>These are simplified assumptions, not realized annual revenue, EBITDA, operating cash flow or a full valuation.</p></div></div><div class="ii13-table-heading"><h3>Month-by-month bridge</h3><span>LIVE CALCULATION / USD</span></div><div id="ii13-rows">'+ii13Table(m)+'</div><div class="ii13-actions">'+ii13Button('Save model snapshot','save-model','','ii13-button ii13-button-primary')+ii13Button('Add analyst scenario to Research Notebook','promote-model')+ii13Button('Download 12-month CSV','export-csv')+ii13Button('Download model notes (.md)','export-md')+'</div><div id="ii13-save-status" class="ii13-save-status">'+(ii13State.snapshot?'<strong>Snapshot saved · '+iiEsc(ii13State.snapshot.savedAt)+'</strong><span>Saved snapshot is local to this browser. Changes after saving are live draft assumptions.</span>':'<span>Live draft, not saved as a reviewable model snapshot yet.</span>')+'</div></section>';
}
function ii13Sensitivity(){
 const base=ii13Params('base');const adds=[.75,1,1.25].map(x=>Math.round(base.adds*x));const churns=[Math.max(0,base.churn-2),base.churn,Math.min(20,base.churn+2)];
 const cells=churns.map((ch,i)=>'<tr><th scope="row">'+ii13Num(ch,1)+'% churn</th>'+adds.map((ad,j)=>{const m=ii13Compute({...base,adds:ad,churn:ch});return '<td class="'+(i===1&&j===1?'ii13-center-cell':'')+'"><strong>'+ii13USD(m.arrRunRate/1e6,2)+'M</strong><span>'+ii13Num(Math.round(m.ending.customers))+' merchants</span></td>'}).join('')+'</tr>').join('');
 return '<section class="ii13-sensitivity"><span class="ii-overline">INVESTMENT JUDGMENT / SENSITIVITY ANALYSIS</span><h2>What if your assumptions are wrong?</h2><p>VC analyst tidak cukup membuat satu forecast yang terlihat bagus. Cek sensitivitas growth dan churn sebelum menjadikan angka model sebagai bagian dari thesis.</p><div class="ii13-compare"><div><span>DOWNSIDE</span><strong>'+ii13USD(ii13Compute(ii13Params('downside')).arrRunRate/1e6,2)+'M</strong><small>Projected month-12 ARR run-rate</small></div><div><span>BASE CASE</span><strong>'+ii13USD(ii13Compute(ii13Params('base')).arrRunRate/1e6,2)+'M</strong><small>Projected month-12 ARR run-rate</small></div><div><span>UPSIDE</span><strong>'+ii13USD(ii13Compute(ii13Params('upside')).arrRunRate/1e6,2)+'M</strong><small>Projected month-12 ARR run-rate</small></div></div><div class="ii13-sensitivity-grid"><div><span class="ii-overline">TABLE 01 / ARR RUN-RATE</span><h3>Churn × new monthly customers</h3><div class="ii13-table-wrap"><table class="ii13-table ii13-sensitivity-table"><thead><tr><th>Churn / Adds</th>'+adds.map(x=>'<th>'+ii13Num(x)+'/mo</th>').join('')+'</tr></thead><tbody>'+cells+'</tbody></table></div><p>This table holds ARPU, CAC and margin at Base Case while varying only monthly new customers and churn. It shows *ending annualized run-rate*, not annual revenue.</p></div><aside class="ii13-question-card"><span class="ii-overline">THINK LIKE AN INVESTOR</span><h3>Which assumption needs evidence first?</h3><p>Kalau churn naik 2 percentage points, berapa banyak acquisition tambahan yang lu butuhkan agar customer base tetap bertumbuh?</p><p>Jawaban bukan otomatis di-generate. Pakai angka tabel dan tulis reasoning lu di tab <strong>Challenge</strong>.</p>'+ii13Button('Open analyst challenge →','tab','challenge','ii13-button ii13-button-primary')+'</aside></div></section>';
}
function ii13Challenge(){
 const selected=ii13State.quizChoice;
 return '<section class="ii13-challenge"><span class="ii-overline">ANALYST PRACTICE / EXPLAIN, DON’T MEMORIZE</span><h2>Defend your numbers.</h2><div class="ii13-challenge-layout"><div class="ii13-challenge-main"><h3>01. Is a low CAC payback always a good sign?</h3><p>The sandbox reports a simple CAC payback based on ARPU and gross margin. Does that automatically include customer churn and lifetime economics?</p><div class="ii13-answers">'+[['A','Yes. CAC payback already reflects all customer cancellations.'],['B','No. A simple payback ratio excludes churn and is not identical to Bessemer’s churn-adjusted reported payback.'],['C','Yes. Low CAC always means the investment will generate a high return.']].map(x=>ii13Button('<b>'+x[0]+'</b><span>'+x[1]+'</span>','quiz',x[0],'ii13-answer'+(selected===x[0]?' is-selected':''))).join('')+'</div>'+ii13Button('Check reasoning','quiz-check','','ii13-button ii13-button-primary')+(ii13State.quizFeedback?'<div class="ii13-feedback'+(ii13State.quizCorrect?' is-correct':'')+'" role="status">'+iiEsc(ii13State.quizFeedback)+'</div>':'')+'<h3>02. Explain your forecast in your own words.</h3><p>Kenapa monthly new acquisitions, churn, dan price assumptions lu masuk akal? Mana yang hanya educated guess? Apa evidence tambahan yang lu butuhkan?</p><label class="ii13-reasoning"><span>Analyst explanation / min. 50 characters</span><textarea data-ii13-reasoning rows="7" maxlength="4000" placeholder="My scenario assumes... The biggest risk is... I would verify this by...">'+iiEsc(ii13State.reasoning)+'</textarea></label>'+ii13Button('Save written reasoning','save-reasoning','','ii13-button ii13-button-primary')+'<p class="ii13-method-foot">The program checks a conceptual answer and stores your explanation. It does not grade the quality of investment judgment with an AI model yet.</p></div><aside class="ii13-question-card"><span class="ii-overline">YOUR ANALYST CHECKLIST</span><h3>Three checks before presenting this.</h3><p><b>1.</b> Facts from the 2010 memo must be clearly separated from scenario assumptions.</p><p><b>2.</b> Revenue growth ≠ merchant retention ≠ company valuation.</p><p><b>3.</b> Explain the downside even if the Base Case looks attractive.</p>'+ii13Button('Back to model','tab','model')+'</aside></div></section>';
}
function ii13View(){
 const tabs=[['model','01','Financial Worksheet'],['sensitivity','02','Scenario Lab'],['challenge','03','Defend the Model']];
 const tab=['model','sensitivity','challenge'].includes(ii13State.tab)?ii13State.tab:'model';
 const scenarioButtons=['base','downside','upside'].map(x=>ii13Button(ii13LabelScenario(x),'scenario',x,'ii13-scenario'+(ii13State.scenario===x?' is-active':''))).join('');
 return '<div class="ii13-page"><div class="ii13-topline"><div><span class="ii-overline">INVESTMENT INTELLIGENCE / CASE 001 / ANALYST PRACTICE</span><h1>Build a forecast. <em>Challenge it.</em></h1><p>Shopify 2010 · Subscription economics training model · As-of October 12, 2010</p></div><div class="ii13-provenance"><strong>HISTORICAL ANCHOR</strong><span>2010 · ~10K customers / $438K MRR</span><small>Everything after the anchor is your scenario.</small></div></div>'+(ii13StorageOK?'':'<div class="ii13-storage-warning" role="alert">Browser storage blocked. Export your model before leaving this page.</div>')+'<div class="ii13-stage-tabs">'+tabs.map(x=>ii13Button('<small>'+x[1]+'</small>'+x[2],'tab',x[0],'ii13-stage'+(tab===x[0]?' is-active':''))).join('')+'</div><div class="ii13-scenario-toolbar"><div><span>SCENARIO</span><div class="ii13-scenarios">'+scenarioButtons+'</div></div><div><span>WORKSPACE</span>'+ii13Button('Open Evidence Notebook ↗','notebook','','ii13-textbutton')+'</div></div>'+(tab==='model'?ii13ModelView():tab==='sensitivity'?ii13Sensitivity():ii13Challenge())+'<footer class="ii13-footer"><div><strong>Source integrity</strong><p>Historical starting figures come from <a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Bessemer’s October 2010 Shopify memo</a>. No forward projection, gross margin, customer additions, or annual forecast here is presented as reported 2011 company data. The memo states Shopify did not forecast 2011.</p></div><div><strong>Storage integrity</strong><p>Scenario inputs, snapshots and written reasoning are local to this browser. They are not synced to Supabase or included in SELF’s legacy backups. Export before migrating devices.</p></div></footer></div>';
}
function ii13UpdateLive(){
 const m=ii13Compute(ii13Params(ii13State.scenario));
 for(const [id,html] of [['ii13-metrics',ii13MetricCards(m)],['ii13-bars',ii13Bars(m)],['ii13-rows',ii13Table(m)]]){
  const el=document.getElementById(id);if(el)el.innerHTML=html;
 }
 const values={'ii13-revenue':m.yearRevenue,'ii13-acquisition':m.yearAcquisition,'ii13-contribution':m.yearNetContribution};
 for(const id of Object.keys(values)){const el=document.getElementById(id);if(el)el.textContent=ii13USD(values[id])}
 const saveStatus=document.getElementById('ii13-save-status');if(saveStatus)saveStatus.innerHTML='<span>Inputs changed. Save a new snapshot when your assumptions are ready for review.</span>';
}
function ii13ExportCSV(){
 const m=ii13Compute(ii13Params(ii13State.scenario));
 const head=['Month','Opening Customers','Lost Customers','New Customers','Ending Customers','MRR USD','Gross Profit USD','Acquisition Spend USD','Contribution Before Opex USD'];
 const rows=[head.join(','),...m.rows.map(x=>[x.month,x.opening,x.lost,x.adds,x.customers,x.mrr,x.grossProfit,x.acquisitionCost,x.contribution].map(y=>Number(y).toFixed(2)).join(','))];
 ii13Download(rows.join('\r\n'),'text/csv;charset=utf-8','SELF_Shopify_2010_Analyst_Scenario.csv');
}
function ii13ExportMD(){
 const p=ii13Params(ii13State.scenario),m=ii13Compute(p);
 const arr=['# Shopify 2010 — Independently Authored Scenario Worksheet','',
 'Type: Historical re-underwriting LEARNING simulation (NOT actual 2011 Shopify numbers)',
 'As-of date: 2010-10-12','Original historical source: '+II_MEMO_URL,
 'Historical anchor: approximately 10,000 merchants and US$438,000 MRR.','',
 '## Scenario: '+ii13LabelScenario(ii13State.scenario),
 '- New customers/month (analyst assumption): '+p.adds,
 '- Monthly logo churn (analyst assumption): '+p.churn+'%',
 '- ARPU/month (analyst assumption): US$'+p.arpu,
 '- Gross margin (analyst assumption): '+p.margin+'%',
 '- CAC (analyst assumption): US$'+p.cac,'',
 '## Mechanism',
 'End merchants = opening merchants × (1 − churn) + new merchants.',
 'MRR = projected ending merchants × monthly ARPU.',
 'Simple CAC payback = CAC / (ARPU × gross margin). Excludes churn.',
 'Acquisition spend = new merchants × CAC. Monthly contribution before opex = gross profit − acquisition spend.','',
 '## Model output (NOT historically reported)',
 '- Ending merchants: '+ii13Num(Math.round(m.ending.customers)),
 '- Ending MRR: '+ii13USD(m.ending.mrr),
 '- Annualized ending ARR run-rate: '+ii13USD(m.arrRunRate),
 '- Total modeled revenue over 12 months: '+ii13USD(m.yearRevenue),
 '- Simple CAC payback: '+ii13Num(m.payback,2)+' months',
 '- Gross profit less acquisition spend, before opex: '+ii13USD(m.yearNetContribution),'',
 '## Your independent reasoning',ii13State.reasoning||'(not written)','',
 'IMPORTANT: Bessemer memo reports 7–9 month CHURN-ADJUSTED payback, which is not equivalent to this simplified payback formula.',
 'The 2010 memo has a separate pre-money valuation discrepancy and an MRR growth-percent discrepancy that need historical diligence.'];
 ii13Download(arr.join('\n'),'text/markdown;charset=utf-8','SELF_Shopify_2010_Analyst_Model_Notes.md');
}
function ii13Download(content,mime,name){
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function ii13SaveSnapshot(){
 const p=ii13Params(ii13State.scenario),m=ii13Compute(p);
 ii13State.snapshot={savedAt:new Date().toISOString(),scenario:ii13State.scenario,inputs:p,summary:{customers:m.ending.customers,mrr:m.ending.mrr,arr:m.arrRunRate,yearRevenue:m.yearRevenue,payback:m.payback}};
 const saved=ii13Store();
 if(typeof toast==='function')toast(saved?'Analyst model snapshot saved locally.':'Storage unavailable. Export your assumptions.');
 if(typeof render==='function')render();
}
function ii13Promote(){
 if(ii13State.reasoning.trim().length<50){if(typeof toast==='function')toast('Tulis reasoning minimal 50 karakter sebelum mempromosikan asumsi ke research notebook.');return}
 const p=ii13Params(ii13State.scenario),m=ii13Compute(p),name=ii13LabelScenario(ii13State.scenario),id='model13-'+ii13State.scenario;
 const note={
  id,title:'Analyst scenario (NOT historical): '+name,
  detail:'USER-DEFINED SCENARIO projected from approximate Oct 2010 Shopify baseline. Monthly new merchants '+p.adds+', churn '+p.churn+'%, ARPU US$'+p.arpu+', hypothetical gross margin '+p.margin+'%, CAC US$'+p.cac+'. At month 12, projected MRR '+ii13USD(m.ending.mrr)+'; projected annualized ARR run-rate '+ii13USD(m.arrRunRate)+'. None of these forecast outputs is reported Shopify 2011 performance.',
  interpretation:ii13State.reasoning.slice(0,4000),
  source:II_MEMO_URL,section:'Original memo is historical STARTING ANCHOR ONLY. All forward values are user-created assumptions.',kind:'assumption',asOf:II13_HIST.asOf,curated:false
 };
 const found=ii12State.notes.findIndex(x=>x.id===id);
 if(found>=0)ii12State.notes[found]=note;
 else if(ii12State.notes.length>=80){if(typeof toast==='function')toast('Research Notebook full: export or remove an entry before promoting.');return}
 else ii12State.notes.push(note);
 const ok=ii12Save();
 if(typeof toast==='function')toast(ok?'Analyst-assumption note saved to Research Notebook.':'Research note NOT saved; export your model.');
 if(ok){iiState.view='notebook';iiSave();if(typeof render==='function')render()}
}
document.addEventListener('click',function(event){
 const el=event.target.closest('[data-ii13]');if(!el)return;
 event.preventDefault();const action=el.dataset.ii13,value=el.dataset.value;
 if(action==='tab'){ii13State.tab=value;ii13Store();render()}
 else if(action==='scenario'){ii13State.scenario=value;ii13Store();render()}
 else if(action==='notebook'){iiState.view='notebook';iiSave();render()}
 else if(action==='save-model')ii13SaveSnapshot();
 else if(action==='promote-model')ii13Promote();
 else if(action==='export-csv')ii13ExportCSV();
 else if(action==='export-md')ii13ExportMD();
 else if(action==='quiz'){ii13State.quizChoice=value;ii13State.quizFeedback='';ii13Store();render()}
 else if(action==='quiz-check'){
  if(!ii13State.quizChoice)ii13State.quizFeedback='Choose an answer first.';
  else if(ii13State.quizChoice==='B'){ii13State.quizCorrect=true;ii13State.quizFeedback='Benar. CAC payback yang sederhana belum memperhitungkan churn/cohort retention, jadi jangan disamakan dengan metrik Bessemer yang churn-adjusted.'}
  else{ii13State.quizCorrect=false;ii13State.quizFeedback='Belum tepat. Simple CAC payback mengabaikan churn dan bukan jaminan returns. Coba cek definisi denominator-nya.'}
  ii13Store();render();
 }
 else if(action==='save-reasoning'){
  if(ii13State.reasoning.trim().length<50){if(typeof toast==='function')toast('Tuliskan reasoning minimal 50 karakter agar bisa dievaluasi nanti.');return}
  const saved=ii13Store();
  if(typeof toast==='function')toast(saved?'Analyst reasoning saved locally.':'Storage unavailable; export your model notes.');
 }
},true);
document.addEventListener('input',function(event){
 const number=event.target.closest('[data-ii13-input]');
 if(number){
  const field=number.dataset.ii13Input,limits={adds:[0,5000],churn:[0,20],arpu:[5,200],margin:[30,95],cac:[50,1000]};
  if(!Object.prototype.hasOwnProperty.call(limits,field))return;
  if(number.value.trim()===''||!Number.isFinite(Number(number.value)))return;
  ii13State[field]=ii13Clamp(number.value,...limits[field]);
  ii13Store();ii13UpdateLive();return;
 }
 const reasoning=event.target.closest('[data-ii13-reasoning]');
 if(reasoning){ii13State.reasoning=reasoning.value.slice(0,4000);ii13Store()}
},true);
document.addEventListener('change',function(event){
 const number=event.target.closest('[data-ii13-input]');if(!number)return;
 const field=number.dataset.ii13Input,limits={adds:[0,5000],churn:[0,20],arpu:[5,200],margin:[30,95],cac:[50,1000]};
 if(!Object.prototype.hasOwnProperty.call(limits,field))return;
 ii13State[field]=ii13Clamp(number.value,...limits[field]);number.value=ii13State[field];ii13Store();ii13UpdateLive();
},true);
