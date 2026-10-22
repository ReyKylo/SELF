"use strict";
// SELF PE fixture QA: source CSVs only, no learner XLSX / real deal certification.
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const dir=path.resolve(__dirname,"../../../content/career-cases/pe");
let checks=0;
function ok(c,msg){if(!c)throw Error(msg);checks++;}
function eq(a,b,msg,tol=1e-6){ok(Number.isFinite(a)&&Math.abs(a-b)<tol,msg+" expected "+b+" got "+a);}
function rows(file){
 const lines=fs.readFileSync(path.join(dir,file),"utf8").trim().split(/\r?\n/);
 const header=lines.shift().split(",");
 return lines.map(s=>{const cells=s.split(",");ok(cells.length===header.length,"rectangular "+file);
 return Object.fromEntries(header.map((h,i)=>[h,cells[i]]));});
}
function n(r,k){const val=Number(r[k]);ok(r[k]!==undefined&&r[k]!==""&&Number.isFinite(val),"numeric "+k);return val;}
function histQA(rs){
 ok(rs.length===3&&rs.map(x=>x.year).join(",")==="2023,2024,2025","3-year history");
 let nwc=40,cash=12,ppe=64,debt=39.14,equity=null;
 for(const r of rs){
 const y=r.year;
 eq(n(r,"revenue")-n(r,"cogs")-n(r,"cash_opex"),n(r,"ebitda"),y+" EBITDA");
 eq(n(r,"ebitda")-n(r,"depreciation"),n(r,"ebit"),y+" EBIT");
 eq(n(r,"ebit")-n(r,"interest")-n(r,"tax"),n(r,"net_income"),y+" NI");
 const working=n(r,"accounts_receivable")+n(r,"inventory")-n(r,"accounts_payable");
 eq(working,n(r,"operating_nwc"),y+" NWC");
 eq(working-nwc,n(r,"delta_nwc"),y+" delta NWC");
 eq(n(r,"net_income")+n(r,"depreciation")-n(r,"delta_nwc"),n(r,"cfo"),y+" CFO");
 eq(ppe+n(r,"capex")-n(r,"depreciation"),n(r,"net_ppe"),y+" PP&E");
 eq(debt+n(r,"net_debt_issuance"),n(r,"term_debt"),y+" debt");
 eq(cash+n(r,"cfo")-n(r,"capex")+n(r,"net_debt_issuance"),n(r,"ending_cash"),y+" cash");
 eq(n(r,"ending_cash")+n(r,"accounts_receivable")+n(r,"inventory")+n(r,"net_ppe"),
 n(r,"accounts_payable")+n(r,"term_debt")+n(r,"book_equity"),y+" balance sheet");
 if(equity!==null)eq(equity+n(r,"net_income"),n(r,"book_equity"),y+" equity");
 nwc=working;cash=n(r,"ending_cash");ppe=n(r,"net_ppe");debt=n(r,"term_debt");equity=n(r,"book_equity");
 }
}
function terms(){
 const t={};for(const r of rows("exhibits/exhibit-03-deal-terms.csv")){
 ok(t[r.parameter]===undefined,"unique term "+r.parameter);t[r.parameter]=n(r,"value");
 }return t;
}
function funding(ev,t){
 const seller=ev-t.existing_debt+t.existing_cash,uses=seller+t.existing_debt+t.deal_fees;
 const cashUsed=t.existing_cash-t.minimum_cash,equity=uses-t.new_term_debt-cashUsed;
 ok(cashUsed>=0&&equity>0,"feasible closing funding amounts");
 eq(t.new_term_debt+equity+cashUsed,uses,"Sources = Uses");
 eq(equity,ev+t.deal_fees+t.minimum_cash-t.new_term_debt,"EV-to-equity bridge");
 return {seller,uses,cashUsed,equity};
}
function project(name,last,drivers,covs,t){
 let sales=n(last,"revenue"),nwc=n(last,"operating_nwc"),term=t.new_term_debt,rev=0,cash=t.minimum_cash;
 const out=[],scenario=drivers.filter(r=>r.scenario===name).sort((a,b)=>a.year-b.year);
 ok(scenario.length===5,"five years "+name);
 for(const [i,r] of scenario.entries()){
 const y=n(r,"year"),cov=covs.find(x=>Number(x.year)===y);
 ok(y===2026+i&&Boolean(cov),"year and covenant "+name+" "+y);
 const old={term,rev,cash,nwc};
 sales*=1+n(r,"revenue_growth");
 const eb=sales*n(r,"ebitda_margin"),interest=term*n(r,"term_interest_rate")+rev*t.revolver_interest_rate;
 const tax=Math.max(0,(eb-n(r,"depreciation")-interest)*t.cash_tax_rate);
 nwc=sales*n(r,"operating_nwc_to_revenue");
 const cfads=eb-tax-n(r,"capex")-(nwc-old.nwc),amort=Math.min(t.annual_term_amortization,term);
 term-=amort;cash+=cfads-interest-amort;
 const draw=Math.min(Math.max(0,t.revolver_commitment-rev),Math.max(0,t.minimum_cash-cash));
 rev+=draw;cash+=draw;
 const rescue=Math.max(0,t.minimum_cash-cash);cash+=rescue;
 const repay=Math.min(rev,Math.max(0,cash-t.minimum_cash));rev-=repay;cash-=repay;
 const sweep=rev<1e-9?Math.min(term,t.cash_sweep_fraction*Math.max(0,cash-t.minimum_cash)):0;
 term-=sweep;cash-=sweep;
 eq(old.term-amort-sweep,term,name+" term roll "+y);
 eq(old.rev+draw-repay,rev,name+" revolver roll "+y);
 eq(old.cash+cfads-interest-amort+draw+rescue-repay-sweep,cash,name+" cash roll "+y);
 ok(term>=0&&rev>=0&&rev<=t.revolver_commitment+1e-8,name+" borrowing capacity "+y);
 ok(cash>=t.minimum_cash-1e-8,name+" supported cash floor "+y);
 const dscr=cfads/(interest+amort),lev=(term+rev-cash)/eb;
 out.push({year:y,eb,term,rev,cash,dscr,lev,rescue,draw,dscrPass:dscr>=n(cov,"min_cfads_to_cash_interest_plus_mandatory")-1e-9,levPass:lev<=n(cov,"max_net_debt_to_ebitda")+1e-9});
 }
 return out;
}
function exit(model,m){const a=model[4];return a.eb*m-a.term-a.rev+a.cash;}
function irr(e,calls,p){
 const f=r=>-e+calls.reduce((s,x,i)=>s-x/Math.pow(1+r,i+1),0)+p/Math.pow(1+r,calls.length);
 let lo=-0.99,hi=4;ok(f(lo)>0&&f(hi)<0,"IRR bracket");
 for(let i=0;i<150;i++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
 const result=(lo+hi)/2;eq(f(result),0,"IRR NPV root");return result;
}
function matrixQA(matrix,base,t){
 ok(matrix.length===9,"9 entry/exit combinations");
 for(const r of matrix){
 const ev=n(r,"entry_ev"),x=n(r,"exit_ev_multiple_2030_ebitda");
 const sponsor=funding(ev,t).equity,proceeds=exit(base,x),moic=proceeds/sponsor;
 eq(n(r,"sponsor_equity"),sponsor,"matrix sponsor",5e-6);
 eq(n(r,"exit_equity_proceeds"),proceeds,"matrix proceeds",5e-6);
 eq(n(r,"moic"),moic,"matrix MOIC",5e-6);
 eq(n(r,"annual_irr"),Math.pow(moic,0.2)-1,"matrix IRR",5e-6);
 eq(n(r,"entry_ev_multiple_2025_ebitda"),ev/t.reference_2025_ebitda,"matrix entry multiple",5e-6);
 }
}
function mutation(fn,pattern,label){
 let caught="";try{fn();}catch(err){caught=String(err.message||err);}
 ok(pattern.test(caught),"intentional corruption detected: "+label+" "+caught);
}
function main(){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
 ok(manifest.case_type==="simulated"&&manifest.review_status==="unreviewed"&&manifest.track==="PE","manifest honest status");
 ok(manifest.exhibits.length===6&&manifest.competency_ids.length===12,"all six exhibits and 12 skills");
 for(const p of manifest.exhibits)ok(fs.existsSync(path.join(dir,p)),"actual exhibit "+p);
 if(manifest.exhibit_git_blob_sha1)for(const [p,digest] of Object.entries(manifest.exhibit_git_blob_sha1)){
  const b=fs.readFileSync(path.join(dir,p));
  const hash=crypto.createHash("sha1").update("blob "+b.length+"\0").update(b).digest("hex");
  ok(hash===digest,"exact Git blob SHA1 "+p);
 }
 const hist=rows("exhibits/exhibit-01-historical.csv");histQA(hist);
 const aging=rows("exhibits/exhibit-02-aging.csv");
 for(const [asset,balance,risk] of [["AR",75,16],["INVENTORY",80,17]]){
  const r=aging.filter(x=>x.asset_class===asset);
  eq(r.reduce((s,x)=>s+n(x,"gross_balance"),0),balance,asset+" assets reconcile");
  eq(r.reduce((s,x)=>s+n(x,"at_risk_portion"),0),risk,asset+" aged risk");
  ok(r.every(x=>n(x,"at_risk_portion")<=n(x,"gross_balance")),asset+" aging is bounded");
 }
 const t=terms(),f=funding(t.seller_ask_ev_multiple*t.reference_2025_ebitda,t);
 eq(f.uses,291.54,"closing uses");eq(f.cashUsed,1.54,"usable cash");eq(f.equity,160,"equity ask");
 const drivers=rows("exhibits/exhibit-04-forecast-drivers.csv"),covenants=rows("exhibits/exhibit-05-covenants.csv");
 const base=project("base",hist[2],drivers,covenants,t),down=project("downside",hist[2],drivers,covenants,t);
 eq(base[4].eb,69.5996709408,"base end EBITDA");eq(base[4].term,50.75525033896,"base end debt");
 eq(base[4].cash,30.20758918805,"base cash");
 const proceeds=exit(base,7);eq(proceeds,466.65003543468,"base exit equity");
 eq(base[0].dscr,1.02338403756,"base near-covenant FY26 DSCR");
 ok(base.every(x=>x.dscrPass&&x.levPass),"base lender covenants pass");
 eq(irr(f.equity,base.map(x=>x.rescue),proceeds),0.23872317872716,"base annual IRR");
 const calls=down.map(x=>x.rescue),sum=calls.reduce((s,x)=>s+x,0);
 eq(sum,12.17875729621,"stress additional sponsor equity");
 eq(down[1].rev,25,"stress revolver reaches full commitment");
 ok(down[1].rescue>1.6&&down.some(x=>!x.dscrPass),"downside recap and DSCR failures");
 const pDown=exit(down,7);eq(pDown,223.2725962455,"downside hypothetical equity exit");
 eq(irr(f.equity,calls,pDown),0.05565433354354,"rescue-adjusted downside IRR",1e-7);
 const bid=x=>exit(base,x)/Math.pow(1+t.target_irr,t.holding_years)-t.deal_fees-t.minimum_cash+t.new_term_debt;
 eq(bid(7),300.53618322189,"7x return boundary");
 eq(bid(6),272.56563645105,"6x return boundary");
 eq(irr(funding(bid(6),t).equity,base.map(x=>x.rescue),exit(base,6)),t.target_irr,"hurdle at max bid");
 const matrix=rows("exhibits/exhibit-06-exit-sensitivity.csv");matrixQA(matrix,base,t);
 const corruptHist=hist.map(x=>({...x}));corruptHist[2].accounts_receivable="76";
 mutation(()=>histQA(corruptHist),/NWC/,"AR plus 1");
 const corruptMatrix=matrix.map(x=>({...x}));corruptMatrix[0].moic=String(Number(corruptMatrix[0].moic)+0.05);
 mutation(()=>matrixQA(corruptMatrix,base,t),/matrix MOIC/,"fake return");
 console.log("PASS PE case QA: "+checks+" checks incl two deliberate corruptions");
 console.log("Base exit proceeds "+proceeds.toFixed(3)+"; downside sponsor rescues "+sum.toFixed(3));
 console.log("Maximum EV at 20% hurdle: 7x exit "+bid(7).toFixed(3)+"; 6x exit "+bid(6).toFixed(3));
}
main();
