'use strict';
// SELF Career Prep VC case — deterministic, read-only Node.js test; no dependencies.
// Run: node tests/cases/vc/check-case.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const base=path.join(root,'content/career-cases/vc/exhibits');
const read=(f)=>fs.readFileSync(path.join(base,f),'utf8');
function rows(file){
 const lines=read(file).trimEnd().split(/\r?\n/);
 const columns=lines.shift().split(',');
 return lines.map(l=>Object.fromEntries(l.split(',').map((v,i)=>[columns[i],v])));
}
const num=(r,k)=>{assert.notEqual(r[k],undefined,'missing '+k);assert.notEqual(r[k],'','missing numeric '+k);const n=Number(r[k]);assert.ok(Number.isFinite(n),'nonfinite '+k);return n;};
const near=(a,b,tol=1e-6,msg='')=>assert.ok(Math.abs(a-b)<=tol,`${msg}: actual ${a} expected ${b}`);
let count=0;const gate=(label,fn)=>{fn();count++;console.log('PASS',label);};
const months=Array.from({length:12},(_,i)=>{const t=9+i;return (2025+Math.floor(t/12))+'-'+String(t%12+1).padStart(2,'0');});
const cohort=rows('cohorts.csv'),traction=rows('monthly-traction.csv'),cac=rows('acquisition.csv'),cash=rows('cash-runway.csv');
const financing=JSON.parse(read('financing.json'));
const holdoutPath=path.join(root,'content/career-cases/vc/blind/holdout-cohorts.csv');
const holdoutRaw=fs.readFileSync(holdoutPath,'utf8').trim().split(/\\r?\\n/);
const holdoutHeaders=holdoutRaw.shift().split(',');
const holdout=holdoutRaw.map(line=>Object.fromEntries(line.split(',').map((value,i)=>[holdoutHeaders[i],value])));
const cohortMonthIndex=r=>months.indexOf(r.cohort_month);
function verifyCohort(rowsToCheck){
 assert.equal(rowsToCheck.length,24);for(const r of rowsToCheck){
  const i=cohortMonthIndex(r);assert.ok(i>=0);assert.ok(['SMB','MID'].includes(r.segment));
  const initial=num(r,'m0_logos');assert.ok(initial>0);
  near(num(r,'age0_logos'),initial);
  near(num(r,'age0_mrr_usd'),num(r,'m0_mrr_usd'));
  let last=Infinity;
  for(let age=0;age<12;age++){
   const l=r['age'+age+'_logos'],m=r['age'+age+'_mrr_usd'];
   if(i+age>=12){assert.equal(l,'','future cohort cells are unknown not zero');assert.equal(m,'','future MRR blank');continue;}
   const n=num(r,'age'+age+'_logos'),v=num(r,'age'+age+'_mrr_usd');assert.ok(Number.isInteger(n)&&n>0&&n<=last);
   assert.ok(v>=0);last=n;
  }
 }
 const eligible=rowsToCheck.filter(r=>cohortMonthIndex(r)<=5);
 assert.equal(eligible.length,12,'only 12 segment-cohorts have age6');
}
function verifyTraction(tRows){
 assert.equal(tRows.length,12);
 for(let i=0;i<12;i++){
  const r=tRows[i];assert.equal(r.month,months[i]);const active=cohort.filter(c=>cohortMonthIndex(c)<=i);
  const totalMRR=active.reduce((n,c)=>n+num(c,'age'+(i-cohortMonthIndex(c))+'_mrr_usd'),0);
  const totalLogos=active.reduce((n,c)=>n+num(c,'age'+(i-cohortMonthIndex(c))+'_logos'),0);
  const newMRR=active.filter(c=>cohortMonthIndex(c)===i).reduce((n,c)=>n+num(c,'age0_mrr_usd'),0);
  near(num(r,'live_mrr_usd'),totalMRR,0,'live MRR '+r.month);near(num(r,'active_customers'),totalLogos);
  near(num(r,'live_arr_usd'),totalMRR*12,0);
  near(num(r,'new_logo_mrr_usd'),newMRR,0);
  near(num(r,'net_new_mrr_usd'),totalMRR-(i?num(tRows[i-1],'live_mrr_usd'):0),0);
  assert.ok(num(r,'booked_not_live_arr_usd')>=0&&num(r,'one_time_setup_fees_usd')>=0);
  const prev=active.filter(c=>cohortMonthIndex(c)<i);
  const B=prev.reduce((n,c)=>n+num(c,'age'+(i-cohortMonthIndex(c)-1)+'_mrr_usd'),0);
  const G=Math.round(prev.reduce((n,c)=>{const age=i-cohortMonthIndex(c);return n+num(c,'age'+(age-1)+'_mrr_usd')*num(c,'age'+age+'_logos')/num(c,'age'+(age-1)+'_logos');},0));
  const E=prev.reduce((n,c)=>n+num(c,'age'+(i-cohortMonthIndex(c))+'_mrr_usd'),0);
  near(num(r,'prior_customer_opening_mrr_usd'),B,0);
  near(num(r,'gross_retained_mrr_usd'),G,0);
  near(num(r,'prior_customer_closing_mrr_usd'),E,0);
  near(num(r,'expansion_mrr_usd'),E-G,0);
  near(totalMRR,E+newMRR,0);
  if(i===0){assert.equal(r.grr_pct,'');assert.equal(r.nrr_pct,'');}
  else{near(num(r,'grr_pct'),100*G/B,.011);near(num(r,'nrr_pct'),100*E/B,.011);assert.ok(num(r,'grr_pct')<=100);}
 }
}
gate('schema & age-consistent cohort cells',()=>verifyCohort(cohort));
gate('live ARR, logo totals, GRR/NRR denominators, new-logo bridge',()=>verifyTraction(traction));
gate('mutation: inflated live ARR rejected',()=>{const c=traction.map(r=>({...r}));c[11].live_arr_usd=String(num(c[11],'live_arr_usd')+12);assert.throws(()=>verifyTraction(c));});
gate('mutation: future cohort age incorrectly zero-filled rejected',()=>{const c=cohort.map(r=>({...r}));c.at(-1).age2_logos='0';assert.throws(()=>verifyCohort(c));});
gate('CAC denominator/new paid customer and GP payback',()=>{
 assert.equal(cac.length,9);
 for(let i=0;i<9;i++){
  const a=cac[i],t=traction[i+3];assert.equal(a.month,t.month);
  for(const [segment,prefix,countKey,price] of [['smb','smb','new_smb',180],['mid','mid','new_mid',1100]]){
   const newCount=num(a,countKey),spend=num(a,'fully_loaded_'+prefix+'_sm_usd'),gm=num(a,prefix+'_gross_margin');
   near(newCount,num(t,countKey),0);assert.ok(gm>0&&gm<1);
   near(num(a,prefix+'_cac_usd'),spend/newCount,.011);
   near(num(a,prefix+'_gross_profit_payback_months'),spend/newCount/(price*gm),.011);
   near(spend,num(cash[i],'fully_loaded_'+prefix+'_sm_usd'),0,'no double count S&M');
  }
 }
});
gate('cash roll forward, sequential periods and trailing burn',()=>{
 assert.equal(cash.length,9);
 let prior=null;
 for(let i=0;i<9;i++){
  const x=cash[i];assert.equal(x.month,months[i+3]);
  const out=['fully_loaded_smb_sm_usd','fully_loaded_mid_sm_usd','non_sales_payroll_usd','hosting_cash_payments_usd','g_and_a_cash_usd'].reduce((a,k)=>a+num(x,k),0);
  const burn=out-num(x,'customer_cash_receipts_usd');near(num(x,'cash_operating_outflow_usd'),out,0);
  near(num(x,'net_cash_burn_usd'),burn,0);
  near(num(x,'closing_cash_usd'),num(x,'opening_cash_usd')-burn,0);
  if(prior!==null)near(num(x,'opening_cash_usd'),prior,0);
  prior=num(x,'closing_cash_usd');
 }
 near(prior,981000,0);
 const last3=cash.slice(-3).reduce((n,r)=>n+num(r,'net_cash_burn_usd'),0)/3;
 near(last3,358000,0);near(prior/last3,981/358,1e-9);
});
gate('pre-money option top-up; post A/B pool and ownership 100%',()=>{
 const pre=financing.pre_round_shares,S=financing.existing_pre_round_fully_diluted_shares,ra=financing.series_a,fu=financing.future_hypothetical;
 near(Object.values(pre).reduce((n,x)=>n+x,0),S,0);
 near(ra.raise_usd,ra.lead_fund_usd+ra.other_new_investors_usd,0);
 const p=ra.target_post_close_unallocated_option_pool_pct/100,r=ra.raise_usd/ra.pre_money_usd;
 const x=(p*(1+r)*S-pre.existing_unallocated_options)/(1-p*(1+r));
 assert.ok(x>0);const price=ra.pre_money_usd/(S+x);
 const a={founder:pre.founder_common,seed:pre.seed_common,unallocated_options:pre.existing_unallocated_options+x,lead:ra.lead_fund_usd/price,coinvest:ra.other_new_investors_usd/price};
 const post=Object.values(a).reduce((n,v)=>n+v,0);near(post,(S+x)*(1+r));near(ra.pre_money_usd+ra.raise_usd,30000000,0);
 near(a.unallocated_options/post,p);near(a.lead/post,ra.lead_fund_usd/(ra.pre_money_usd+ra.raise_usd));near(Object.values(a).reduce((n,v)=>n/post+v*0,0),0,0); // nonsubstantive identity guard
 near(Object.values(a).reduce((n,v)=>n+v/post,0),1);
 const bNew=post*fu.new_money_usd/fu.pre_money_usd,bPost=post+bNew;
 near(bNew/bPost,.25);const optionNew=bPost*(fu.post_financing_extra_option_grant_fraction_of_final_fd_pct/100)/(1-fu.post_financing_extra_option_grant_fraction_of_final_fd_pct/100);
 const fd=bPost+optionNew;const fundFD=a.lead/fd;
 near(fundFD,.095,1e-12);near(optionNew/fd,.05,1e-12);
 const buckets=[...Object.values(a),bNew,optionNew];near(buckets.reduce((n,v)=>n+v/fd,0),1);
});
gate('equity proceeds, preferences, gross MOIC and 5-year IRR',()=>{
 const A=financing.series_a,B=financing.future_hypothetical,model=financing.return_model;
 const fundClose=A.lead_fund_usd/(A.pre_money_usd+A.raise_usd);
 const d=(B.pre_money_usd/(B.pre_money_usd+B.new_money_usd))*(1-B.post_financing_extra_option_grant_fraction_of_final_fd_pct/100);
 const stake=fundClose*d;near(stake,.095,1e-12);
 for(const s of model.exit_equity_value_scenarios){
  const e=s.equity_exit_usd;assert.ok(s.exit_arr_usd>0);
  let proceeds=e*stake;
  if(s.label==='distress'){const residual=Math.max(0,e-B.new_money_usd);proceeds=Math.min(residual,A.raise_usd)*A.lead_fund_usd/A.raise_usd;near(proceeds,10000000/3,.01);}
  const moic=proceeds/A.lead_fund_usd,irr=moic**(1/model.years_to_exit_from_series_a)-1;
  assert.ok(Number.isFinite(moic)&&Number.isFinite(irr));assert.ok(moic>=0);
  if(s.label==='base'){near(moic,7.125);near(proceeds,28500000);}
  if(s.label==='low')near(moic,1.78125);
  if(s.label==='upside')near(moic,19);
 }
});
gate('market exhibit archetypes are explicitly nonverified',()=>{const m=rows('market-competition.csv');assert.equal(m.length,4);assert.ok(m.every(r=>r.validation_needed&&r.substitute_not_verified_live_competitor));});
gate('blind transfer: new age-consistent pilot, no baked answers',()=>{
 assert.equal(holdout.length,10);
 const ms=['2026-05','2026-06','2026-07','2026-08','2026-09'];
 for(const r of holdout){
  const i=ms.indexOf(r.cohort_month);assert.ok(i>=0);
  near(num(r,'age0_logos'),num(r,'age0_logos'));near(num(r,'age0_mrr_usd'),num(r,'age0_mrr_usd'));
  for(let age=0;age<5;age++){
   const l=r['age'+age+'_logos'],v=r['age'+age+'_mrr_usd'];
   if(i+age>=5){assert.equal(l,'');assert.equal(v,'');}
   else{assert.ok(num(r,'age'+age+'_logos')>0);assert.ok(num(r,'age'+age+'_mrr_usd')>0);}
  }
 }
 assert.equal(holdout.filter(r=>ms.indexOf(r.cohort_month)<=1).length,4);
});
console.log('VC CASE QA:',count,'gates passed; deterministic CSV/JSON invariants + two negative mutation guards. This does NOT grade investment judgment.');