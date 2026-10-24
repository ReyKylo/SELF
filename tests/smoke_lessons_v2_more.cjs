/* The five lessons added after PE-L01 (PE-L02, VC-L01, VC-L02, CO-L01, CO-L02): every number is recomputed here from the case exhibits, independently of how the
   lesson file was produced; waterfalls tie; each grid rung is re-derived with the formula engine; every misconception is a real wrong answer with its feedback. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../career-grid.js'),V=require('../career-visuals.js');
const root=path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'content/career-lessons-v2.json'),'utf8'));
const csv=f=>{const [h,...rows]=fs.readFileSync(path.join(root,'content/career-cases',f),'utf8').trim().split(/\r?\n/).map(l=>l.split(','));return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])))};
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const near=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
const L=id=>data.lessons.find(l=>l.id===id);
const step=(l,id)=>l.see_it.steps.find(s=>s.id===id);
const row=(l,id)=>l.pro_layout.rows.find(r=>r.id===id);
eq(data.lessons.map(l=>l.id),['PE-L01','PE-L02','VC-L01','VC-L02','CO-L01','CO-L02']);
const grid=g=>{const cells={};g.rows.forEach(r=>r.cells.forEach((c,i)=>{if(c!=null&&c!=='?')cells[String.fromCharCode(66+i)+r.n]=c}));return cells};
const tie=l=>{const m=V.waterfallModel(l.see_it.steps);ok(m.allTie,l.id+' waterfall ties: '+JSON.stringify(m.ties.filter(t=>!t.ok)));return m};
/* rung helpers: a correct formula passes (when refs are required), a typed value is flagged, every misconception is wrong with its own feedback */
function checkGridRung(l,rung,formula){
 const r=l.ladder.find(x=>x.rung===rung),sheet=G.createSheet(grid(r.grid)),spec={...r.expect,misconceptions:r.misconceptions};
 eq(G.checkCell(spec,formula,sheet).status,'ok',l.id+' '+rung+' accepts '+formula);
 eq(G.checkCell(spec,String(r.expect.value),sheet).status,'hardcoded',l.id+' flags a typed value');
 const t=G.evaluate(formula.slice(1),sheet).value;ok(near(t,r.expect.value,r.expect.tolerance),l.id+' formula value '+t+' vs '+r.expect.value);
 for(const m of r.misconceptions){const c=G.checkCell(spec,String(m.value),sheet);ok(c.status==='wrong'&&c.misconception===m.feedback,l.id+' misconception '+m.value+' -> '+c.status)}
}
function checkPlainRung(l,rung,fn){
 const r=l.ladder.find(x=>x.rung===rung),sheet=G.createSheet({}),spec={...r.expect,misconceptions:r.misconceptions};
 ok(near(fn,r.expect.value,r.expect.tolerance),l.id+' '+rung+' recomputed '+fn+' vs '+r.expect.value);
 eq(G.checkCell(spec,String(r.expect.value),sheet).status,'ok');
 for(const m of r.misconceptions){const c=G.checkCell(spec,String(m.value),sheet);ok(c.status==='wrong'&&c.misconception===m.feedback,l.id+' '+rung+' misconception '+m.value+' -> '+c.status)}
}
const redPen=(l,junior)=>{const r=l.ladder.find(x=>x.rung==='red_pen');const rows=Object.fromEntries(r.artefact.rows.map(x=>[x.id,x]));
 ok(r.artefact.rows.some(x=>x.id===r.flaw_row));ok(!(r.flaw_row in r.row_feedback),'flawed row has found_feedback');for(const id of Object.keys(r.row_feedback))ok(rows[id],id);
 ok(junior(rows),l.id+' the planted flaw is what the lesson says it is');return r};

/* ---------------- PE-L02 ---------------- */
{
 const p=Object.fromEntries(csv('pe/exhibits/exhibit-03-deal-terms.csv').map(r=>[r.parameter,+r.value]));
 const su=(ev,nd=p.new_term_debt)=>{const se=ev-p.existing_debt+p.existing_cash,uses=se+p.existing_debt+p.deal_fees,cu=p.existing_cash-p.minimum_cash;return {se,uses,cu,eq:uses-nd-cu}};
 const EV=p.seller_ask_ev_multiple*p.reference_2025_ebitda,b=su(EV),l=L('PE-L02');
 ok(near(EV,273)&&near(b.eq,160)&&near(b.uses,291.54));
 const s=id=>step(l,id).value;
 ok(near(s('ev'),EV)&&near(s('debt'),-p.existing_debt)&&near(s('cash'),p.existing_cash)&&near(s('se'),b.se)&&near(s('refi'),p.existing_debt)&&near(s('fees'),p.deal_fees)&&near(s('uses'),b.uses)&&near(s('nd'),-p.new_term_debt)&&near(s('cu'),-b.cu)&&near(s('eq'),b.eq),'waterfall steps match Exhibit 03');
 const m=tie(l);eq(m.ties.length,3);
 const v=id=>row(l,id).value;ok(near(v('nd')+v('cu')+v('eq'),v('src'))&&near(v('se')+v('refi')+v('fees'),v('uses'))&&near(v('src'),v('uses')),'sources equal uses in the pro layout');
 const w=G.createSheet(grid(l.worked.grid));ok(near(G.evaluate('B11',w).value,b.se)&&near(G.evaluate('B12',w).value,b.uses)&&near(G.evaluate('B13',w).value,b.cu)&&near(G.evaluate('B14',w).value,b.eq));
 checkGridRung(l,'complete','=B12-B10-B13');
 checkPlainRung(l,'independent',su(260).eq);checkPlainRung(l,'twist',su(EV,110).eq);
 const r=l.ladder[0];const mv=r.misconceptions.map(x=>x.value);ok(near(mv[0],EV)&&near(mv[1],b.uses)&&near(mv[2],b.uses-p.new_term_debt));
 redPen(l,rows=>{const q=rows.cash.value;return near(q,p.existing_cash)&&near(rows.eq.value,rows.uses.value-p.new_term_debt-q)&&near(rows.eq.value,148,0.02)});
 ok(/Rp12 miliar/.test(l.defend.model_points[0])&&/Rp25 miliar/.test(l.defend.model_points[2]));ok(p.minimum_cash===12&&p.revolver_commitment===25);
}
/* ---------------- VC-L01 / VC-L02 ---------------- */
{
 const M=Object.fromEntries(csv('vc/exhibits/monthly-traction.csv').map(r=>[r.month,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,isNaN(+v)||v===''?v:+v]))]));
 const S=M['2026-09'],A=M['2026-08'],J=M['2026-07'];
 const l=L('VC-L01');
 ok(S.live_mrr_usd*12===S.live_arr_usd&&A.live_mrr_usd*12===A.live_arr_usd&&J.live_mrr_usd*12===J.live_arr_usd);
 ok(near(step(l,'head').value*1e6,S.live_arr_usd+S.booked_not_live_arr_usd)&&near(step(l,'book').value*1e6,-S.booked_not_live_arr_usd)&&near(step(l,'live').value*1e6,S.live_arr_usd));tie(l);
 ok(row(l,'mrr').value===S.live_mrr_usd&&row(l,'arr').value===S.live_arr_usd&&row(l,'book').value===S.booked_not_live_arr_usd&&row(l,'carr').value===S.live_arr_usd+S.booked_not_live_arr_usd&&row(l,'setup').value===S.one_time_setup_fees_usd);
 const w=G.createSheet(grid(l.worked.grid));ok(near(G.evaluate('B6',w).value,A.live_arr_usd)&&near(G.evaluate('C6',w).value,S.live_arr_usd)&&near(G.evaluate('C8',w).value,S.live_arr_usd+S.booked_not_live_arr_usd));
 const ra=l.ladder[0];ok(ra.grid.rows[0].cells[0]===J.live_mrr_usd&&ra.grid.rows[1].cells[0]===J.booked_not_live_arr_usd);
 checkGridRung(l,'complete','=B5*12');
 checkPlainRung(l,'independent',270000*12);checkPlainRung(l,'twist',S.live_arr_usd+S.booked_not_live_arr_usd*0.75);
 redPen(l,rows=>rows.mrr.value===S.live_mrr_usd&&rows.book.value===S.booked_not_live_arr_usd&&rows.arr.value===S.live_mrr_usd*12+S.booked_not_live_arr_usd);
 ok(l.defend.model_points[1].includes('900.000')&&l.defend.model_points[1].includes('4.442.040'));
}
{
 const M=Object.fromEntries(csv('vc/exhibits/monthly-traction.csv').map(r=>[r.month,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,isNaN(+v)||v===''?v:+v]))]));
 const S=M['2026-09'],A=M['2026-08'],l=L('VC-L02');
 const v=id=>step(l,id).value*1000;
 ok(near(v('open'),S.prior_customer_opening_mrr_usd,1e-6)&&near(v('churn'),-(S.prior_customer_opening_mrr_usd-S.gross_retained_mrr_usd),1e-6)&&near(v('ret'),S.gross_retained_mrr_usd,1e-6)&&near(v('exp'),S.expansion_mrr_usd,1e-6)&&near(v('close'),S.prior_customer_closing_mrr_usd,1e-6)&&near(v('new'),S.new_logo_mrr_usd,1e-6)&&near(v('live'),S.live_mrr_usd,1e-6));
 const m=tie(l);eq(m.ties.length,3);
 const grr=S.gross_retained_mrr_usd/S.prior_customer_opening_mrr_usd*100,nrr=S.prior_customer_closing_mrr_usd/S.prior_customer_opening_mrr_usd*100;
 ok(near(grr,S.grr_pct,0.006)&&near(nrr,S.nrr_pct,0.006),'GRR and NRR match the exhibit');ok(JSON.stringify(l.pro_layout.rows).includes('95,4%')&&JSON.stringify(l.pro_layout.rows).includes('98,6%'));
 const w=G.createSheet(grid(l.worked.grid));ok(near(G.evaluate('B8',w).value,A.prior_customer_closing_mrr_usd)&&near(G.evaluate('B9',w).value,A.grr_pct,0.006)&&near(G.evaluate('B10',w).value,A.nrr_pct,0.006));
 checkGridRung(l,'complete','=B6+B7');
 checkPlainRung(l,'independent',(80000-4000-2000+9000)/80000*100);checkPlainRung(l,'twist',grr);
 const rd=redPen(l,rows=>rows.live.value===S.live_mrr_usd&&rows.open.value===S.prior_customer_opening_mrr_usd&&rows.nrr.text==='119,2%');ok(near(S.live_mrr_usd/S.prior_customer_opening_mrr_usd*100,119.18,0.01));ok(near(rd.expect.value,nrr,0.006));
 const coh=csv('vc/exhibits/cohorts.csv');const smb=coh.find(r=>r.cohort_month==='2025-10'&&r.segment==='SMB'),mid=coh.find(r=>r.cohort_month==='2025-10'&&r.segment==='MID');
 ok(smb.age0_logos==='35'&&smb.age11_logos==='16'&&mid.age0_logos==='3'&&mid.age11_logos==='3');ok(/35 menjadi 16/.test(l.defend.model_points[1])&&/3 logo/.test(l.defend.model_points[1]));
}
/* ---------------- CO-L01 / CO-L02 ---------------- */
{
 const hist=csv('consulting/exhibits/01-historical.csv'),seg=csv('consulting/exhibits/02-segment-economics.csv');
 const X=(y,sku,ch)=>{const r=seg.find(x=>x.year===y&&x.sku===sku&&x.channel===ch);return {v:+r.volume_k_packs,p:+r.realized_price_k_idr_per_pack,c:+r.variable_cost_k_idr_per_pack}};
 const lines=[['Core','Retail'],['Core','B2B'],['Premium','Retail'],['Premium','B2B']];
 let vol=0,price=0,cost=0;for(const [s,c] of lines){const a=X('2025',s,c),b=X('2026',s,c);vol+=(b.v-a.v)*(a.p-a.c);price+=b.v*(b.p-a.p);cost+=-b.v*(b.c-a.c)}
 const h25=hist[1],h26=hist[2],fixed=-(+h26.fixed_cash_cost_idr_m-+h25.fixed_cash_cost_idr_m),p25=+h25.case_operating_profit_idr_m,p26=+h26.case_operating_profit_idr_m;
 ok(near(p25+vol+price+cost+fixed,p26),'the bridge reconciles to the exhibit');ok(near(vol,-200)&&near(price,-1300)&&near(cost,-6000)&&near(fixed,-900));
 const l=L('CO-L01');const s=id=>step(l,id).value;
 ok(s('p25')===p25&&near(s('vol'),vol)&&near(s('price'),price)&&near(s('cost'),cost)&&near(s('fixed'),fixed)&&s('p26')===p26);const m=tie(l);eq(m.ties.length,1);
 ok(Math.abs(cost)>Math.abs(vol+price+fixed),'unit cost is the largest driver, as the predict answer says');ok(l.predict.answer_index===1&&/Biaya variabel/.test(l.predict.options[1]));
 ok(near(+h25.revenue_idr_m,77000)&&near(+h26.revenue_idr_m,75400)&&/2%/.test(l.predict.question),'revenue fell about 2%');ok(/annualized run-rate/i.test(l.source_notice)&&/bukan/i.test(l.source_notice));
 const rr=id=>row(l,id).value;ok(rr('p25')+rr('vol')+rr('price')+rr('cost')+rr('fixed')===rr('p26'));
 const w=G.createSheet(grid(l.worked.grid));const cm=(y)=>{const a=X(y,'Core','Retail');return a.v*(a.p-a.c)};ok(near(G.evaluate('B8',w).value,cm('2025'))&&near(G.evaluate('C8',w).value,cm('2026'))&&near(G.evaluate('C9',w).value,cm('2026')-cm('2025')));
 const b26=X('2026','Core','B2B');checkGridRung(l,'complete','=C5*(C6-C7)');ok(near(b26.v*(b26.p-b26.c),3150));
 const pr26=X('2026','Premium','Retail'),pr25=X('2025','Premium','Retail');checkPlainRung(l,'independent',pr26.v*(pr26.p-pr25.p));
 const cr26=X('2026','Core','Retail'),cr25=X('2025','Core','Retail');checkPlainRung(l,'twist',p26+cr26.v*(cr26.c-cr25.c));
 redPen(l,rows=>rows.fixed.value===-fixed&&near(rows.p25.value+rows.vol.value+rows.price.value+rows.cost.value+rows.fixed.value,rows.p26.value)&&rows.p26.value===400);
}
{
 const seg=csv('consulting/exhibits/02-segment-economics.csv'),ini=Object.fromEntries(csv('consulting/exhibits/04-initiatives.csv').map(r=>[r.id,r])),scn=Object.fromEntries(csv('consulting/exhibits/06-scenarios.csv').map(r=>[r.scenario,r]));
 const x26=(sku,ch)=>seg.find(r=>r.year==='2026'&&r.sku===sku&&r.channel===ch);
 const core=+x26('Core','Retail').volume_k_packs+ +x26('Core','B2B').volume_k_packs,b2b=x26('Core','B2B'),b2bm=+b2b.realized_price_k_idr_per_pack-+b2b.variable_cost_k_idr_per_pack;
 const A=ini.A_procurement,C=ini.C_b2b_contract_reset;
 const aNet=core*+A.core_eligible_share*+A.core_cost_saving_k_idr_per_pack-+A.annual_recurring_cost_idr_m;
 const cNet=(+b2b.volume_k_packs-+C.core_b2b_exited_k_packs)*+C.remaining_core_b2b_price_uplift_k_idr_per_pack-+C.core_b2b_exited_k_packs*b2bm+ +C.annual_route_saving_idr_m-+C.annual_recurring_cost_idr_m;
 const ov=+C.core_b2b_exited_k_packs*+A.core_eligible_share*+A.core_cost_saving_k_idr_per_pack;
 ok(near(aNet,2332)&&near(cNet,1750)&&near(ov,168)&&near(aNet+cNet-ov,3914));
 const l=L('CO-L02');ok(near(step(l,'a').value,aNet)&&near(step(l,'c').value,cNet)&&near(step(l,'raw').value,aNet+cNet)&&near(step(l,'ov').value,-ov)&&near(step(l,'ac').value,aNet+cNet-ov));const m=tie(l);eq(m.ties.length,2);
 const r=id=>row(l,id).value;ok(near(r('a')+r('c'),r('raw'))&&near(r('raw')+r('ov'),r('ac')));
 const w=G.createSheet(grid(l.worked.grid));ok(near(G.evaluate('B9',w).value,core*0.8*1.4)&&near(G.evaluate('B11',w).value,aNet));
 checkGridRung(l,'complete','=(B5-B6)*B7-B6*B8+B9-B10');
 checkPlainRung(l,'independent',100*+A.core_eligible_share*+A.core_cost_saving_k_idr_per_pack);
 const d=scn.downside;checkPlainRung(l,'twist',+d.b2b_exited_k_packs*+d.procurement_eligible_share*+d.procurement_saving_k_idr_per_pack);
 redPen(l,rows=>near(rows.a.value,aNet)&&near(rows.c.value,cNet)&&near(rows.ov.value,ov)&&near(rows.ac.value,aNet+cNet+ov));ok(near(aNet+cNet+ov,4250),'the junior total in the prompt');
 /* the downside and upside totals quoted in the defend answer come from the same formula the case test uses */
 const scen=sn=>{const s=scn[sn],eligible=+s.procurement_eligible_share,save=+s.procurement_saving_k_idr_per_pack,rec=+s.procurement_annual_recurring_cost_idr_m,ex=+s.b2b_exited_k_packs,up=+s.b2b_price_uplift_k_idr_per_pack,route=+s.b2b_route_saving_idr_m,crec=+s.b2b_annual_recurring_cost_idr_m;
  return (core*eligible*save-rec)+((+b2b.volume_k_packs-ex)*up-ex*b2bm+route-crec)-ex*eligible*save};
 ok(near(scen('downside'),784)&&near(scen('upside'),5415)&&near(scen('base'),3914));ok(/784/.test(l.defend.model_points[2])&&/5\.415/.test(l.defend.model_points[2]));
 ok(+A.execution_slots+ +C.execution_slots===7&&+A.one_time_execution_expense_idr_m+ +C.one_time_execution_expense_idr_m===750&&+A.upfront_capex_idr_m+ +C.upfront_capex_idr_m===900);ok(/4 slot/.test(l.defend.model_points[1])&&/750/.test(l.defend.model_points[1])&&/900/.test(l.defend.model_points[1]));
}
console.log('PASS Lessons v2 (five more): '+n+' checks, every number recomputed from the VC, PE and Consulting exhibits.');
