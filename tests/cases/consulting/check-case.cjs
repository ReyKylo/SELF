#!/usr/bin/env node
'use strict';
// SELF Worker C: deterministic checks of original SIMULATED consulting-case inputs.
// No network, secrets, production access, app integration or full blind solutions.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = path.resolve(__dirname, '../../../content/career-cases/consulting');
const EPS = 1e-8;
let checks = 0;
function eq(actual, expected, label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= EPS,
    label + ': expected ' + expected + ', got ' + actual);
  checks++;
}
function ok(condition, label) { assert.ok(condition, label); checks++; }
function read(rel) { return fs.readFileSync(path.join(dir, rel), 'utf8'); }
function csv(rel) {
  const lines = read(rel).trim().split(/\r?\n/);
  const columns = lines.shift().split(',');
  return lines.map(line => {
    const cells = line.split(',');
    assert.equal(cells.length, columns.length, rel + ' column mismatch');
    return Object.fromEntries(columns.map((k, i) => [k, cells[i]]));
  });
}
const num = (row, key) => {
  const val = Number(row[key]);
  assert.ok(Number.isFinite(val), 'bad numeric input ' + key);
  return val;
};
const manifest = JSON.parse(read('manifest.json'));
ok(manifest.case_type === 'simulated' && manifest.track === 'Consulting', 'origin labels');
ok(manifest.historical_cutoff === '2026-10-01', 'period cutoff');
ok(manifest.competency_ids.length === 12 &&
  manifest.competency_ids.every((v, i) => v === 'CO-' + String(i + 1).padStart(2, '0')), '12 consulting skills');
for (const rel of [manifest.source_ledger, manifest.learner_tasks, manifest.tutor_guide,
  manifest.assessment, ...manifest.exhibits, 'README.md', 'deck-storyline.md',
  'partner-challenges.md', 'review-rubric.md']) {
  ok(fs.existsSync(path.join(dir, rel)), 'manifest referenced file exists: ' + rel);
}
ok(manifest.exhibits.length >= 4, 'at least four independent exhibits');
const history = csv('exhibits/01-historical.csv');
const segments = csv('exhibits/02-segment-economics.csv');
const ops = csv('exhibits/03-operations.csv');
const initRows = csv('exhibits/04-initiatives.csv');
const funnel = Object.fromEntries(csv('exhibits/05-market-sizing.csv').map(r => [r.metric, +r.value]));
const scenarios = csv('exhibits/06-scenarios.csv');
ok(history.length === 3 && segments.length === 8 && ops.length === 8, 'exhibit coverage');

function segmentYear(y) {
  const rows = segments.filter(r => +r.year === y);
  assert.equal(rows.length, 4, 'four disjoint SKU×channel segments for ' + y);
  assert.equal(new Set(rows.map(r => r.sku + ':' + r.channel)).size, 4, 'no duplicate segment');
  return {
    rows: Object.fromEntries(rows.map(r => [r.sku + ':' + r.channel, r])),
    volume: rows.reduce((s, r) => s + num(r, 'volume_k_packs'), 0),
    revenue: rows.reduce((s, r) => s + num(r, 'volume_k_packs') * num(r, 'realized_price_k_idr_per_pack'), 0),
    variable: rows.reduce((s, r) => s + num(r, 'volume_k_packs') * num(r, 'variable_cost_k_idr_per_pack'), 0)
  };
}
const s25 = segmentYear(2025), s26 = segmentYear(2026);
for (const year of [2024, 2025, 2026]) {
  const h = history.find(r => +r.year === year);
  ok(Boolean(h), 'history year present ' + year);
  eq(num(h, 'revenue_idr_m') - num(h, 'variable_cost_idr_m') -
     num(h, 'fixed_cash_cost_idr_m'), num(h, 'case_operating_profit_idr_m'), 'history profit identity ' + year);
  if (year !== 2024) {
    const s = year === 2025 ? s25 : s26;
    eq(s.revenue, num(h, 'revenue_idr_m'), 'revenue segment reconciliation ' + year);
    eq(s.variable, num(h, 'variable_cost_idr_m'), 'variable segment reconciliation ' + year);
  }
}
eq(s25.volume, 2900, 'base packs thousand');
eq(s26.volume, 3000, 'current packs thousand');
eq(s25.revenue, 77000, '2025 revenue');
eq(s26.revenue, 75400, '2026 run-rate revenue');

const oldProfit = num(history[1], 'case_operating_profit_idr_m');
const newProfit = num(history[2], 'case_operating_profit_idr_m');
let quantity = 0, price = 0, unitCost = 0, revQuantity = 0, revPrice = 0;
for (const key of Object.keys(s25.rows)) {
  const a = s25.rows[key], b = s26.rows[key];
  const q0 = num(a, 'volume_k_packs'), q1 = num(b, 'volume_k_packs');
  const p0 = num(a, 'realized_price_k_idr_per_pack'), p1 = num(b, 'realized_price_k_idr_per_pack');
  const c0 = num(a, 'variable_cost_k_idr_per_pack'), c1 = num(b, 'variable_cost_k_idr_per_pack');
  quantity += (q1 - q0) * (p0 - c0);
  price += q1 * (p1 - p0);
  unitCost -= q1 * (c1 - c0);
  revQuantity += (q1 - q0) * p0;
  revPrice += q1 * (p1 - p0);
}
const fixedEffect = -(num(history[2], 'fixed_cash_cost_idr_m') - num(history[1], 'fixed_cash_cost_idr_m'));
eq(quantity, -200, 'quantity effect on contribution');
eq(price, -1300, 'price effect on contribution');
eq(unitCost, -6000, 'variable cost effect on contribution');
eq(fixedEffect, -900, 'cash fixed effect');
eq(oldProfit + quantity + price + unitCost + fixedEffect, newProfit, 'exact profit bridge');
eq(revQuantity, -300, 'revenue quantity effect');
eq(revPrice, -1300, 'revenue price effect');
eq(s25.revenue + revQuantity + revPrice, s26.revenue, 'revenue bridge');
const avgOldContribution = (s25.revenue - s25.variable) / s25.volume;
const generalVolume = (s26.volume - s25.volume) * avgOldContribution;
const mix = quantity - generalVolume;
eq(generalVolume + mix, quantity, 'total volume plus mix = quantity');
const generalRevenueVolume = (s26.volume - s25.volume) * (s25.revenue / s25.volume);
eq(generalRevenueVolume + (revQuantity - generalRevenueVolume), revQuantity, 'revenue total volume plus mix');

const ops25 = ops.filter(r => +r.year === 2025), ops26 = ops.filter(r => +r.year === 2026);
ok(ops25.length === 4 && ops26.length === 4, 'operations year split');
for (const r of ops) for (const k of ['on_time_in_full_pct', 'return_rate_pct', 'reorder_rate_pct']) {
  ok(num(r, k) >= 0 && num(r, k) <= 100, 'valid operations rate ' + k);
}
const init = Object.fromEntries(initRows.map(r => [r.id, r]));
ok(initRows.length === 3, 'exactly three options');
const A = init.A_procurement, B = init.B_premium_relaunch, C = init.C_b2b_contract_reset;
ok(Boolean(A && B && C), 'all named options');

const corePacks = num(s26.rows['Core:Retail'], 'volume_k_packs') +
                  num(s26.rows['Core:B2B'], 'volume_k_packs');
const coreRetailCM = num(s26.rows['Core:Retail'], 'realized_price_k_idr_per_pack') -
                     num(s26.rows['Core:Retail'], 'variable_cost_k_idr_per_pack');
const coreB2BCM = num(s26.rows['Core:B2B'], 'realized_price_k_idr_per_pack') -
                  num(s26.rows['Core:B2B'], 'variable_cost_k_idr_per_pack');
const premiumRetailCM = num(s26.rows['Premium:Retail'], 'realized_price_k_idr_per_pack') -
                        num(s26.rows['Premium:Retail'], 'variable_cost_k_idr_per_pack');

function aBenefit(eligible, saving, recurring) {
  return corePacks * eligible * saving - recurring;
}
function bBenefit() {
  const newPacks = num(B, 'premium_retail_increment_k_packs');
  const cannibal = num(B, 'core_retail_cannibal_k_packs');
  const discount = num(B, 'premium_retail_discount_k_idr_per_pack');
  // Discount affects ALL post-campaign existing + added Premium Retail packs.
  return newPacks * premiumRetailCM - cannibal * coreRetailCM -
         (num(s26.rows['Premium:Retail'], 'volume_k_packs') + newPacks) * discount -
         num(B, 'annual_recurring_cost_idr_m');
}
function cBenefit(exited, uplift, route, recurring) {
  return (num(s26.rows['Core:B2B'], 'volume_k_packs') - exited) * uplift -
    exited * coreB2BCM + route - recurring;
}
function portfolio(a, b, c, Aparams, Cparams) {
  const aCost = a ? aBenefit(Aparams.eligible, Aparams.saving, Aparams.recurring) : 0;
  const bCost = b ? bBenefit() : 0;
  const cCost = c ? cBenefit(Cparams.exited, Cparams.uplift, Cparams.route, Cparams.recurring) : 0;
  const overlapAB = a && b ? num(B, 'core_retail_cannibal_k_packs') * Aparams.eligible * Aparams.saving : 0;
  const overlapAC = a && c ? Cparams.exited * Aparams.eligible * Aparams.saving : 0;
  const selected = [a ? A : null, b ? B : null, c ? C : null].filter(Boolean);
  return {
    annual: aCost + bCost + cCost - overlapAB - overlapAC,
    overlap: overlapAB + overlapAC,
    oneTime: selected.reduce((s, r) => s + num(r, 'one_time_execution_expense_idr_m'), 0),
    capex: selected.reduce((s, r) => s + num(r, 'upfront_capex_idr_m'), 0),
    slots: selected.reduce((s, r) => s + num(r, 'execution_slots'), 0)
  };
}
const baseA = {eligible:num(A, 'core_eligible_share'),saving:num(A,'core_cost_saving_k_idr_per_pack'),recurring:num(A,'annual_recurring_cost_idr_m')};
const baseC = {exited:num(C,'core_b2b_exited_k_packs'),uplift:num(C,'remaining_core_b2b_price_uplift_k_idr_per_pack'),route:num(C,'annual_route_saving_idr_m'),recurring:num(C,'annual_recurring_cost_idr_m')};
const solve = (a,b,c,ap=baseA,cp=baseC)=>portfolio(a,b,c,ap,cp);
const pA = solve(true,false,false),pB=solve(false,true,false),pC=solve(false,false,true);
const pAB=solve(true,true,false),pAC=solve(true,false,true),pBC=solve(false,true,true);
eq(pA.annual,2332,'procurement after recurring QA');
eq(pB.annual,800,'premium relaunch net of cannibal promo activation');
eq(pC.annual,1750,'B2B contract repricing survives lost volume');
eq(pAB.overlap,56,'A+B eligible packs cannibalized');
eq(pAC.overlap,168,'A+C ineligible overlap avoided');
eq(pBC.overlap,0,'B+C no modeled overlap');
eq(pAB.annual,3076,'A+B portfolio');
eq(pAC.annual,3914,'A+C portfolio');
eq(pBC.annual,2550,'B+C portfolio');
function upfront(p){return p.oneTime+p.capex;}
function feasible(p){return upfront(p)<=1800 && p.slots<=7;}
eq(upfront(pA),1300,'A upfront');
eq(upfront(pB),850,'B upfront');
eq(upfront(pC),350,'C upfront');
eq(upfront(pAB),2150,'AB upfront');
eq(upfront(pAC),1650,'AC upfront');
eq(upfront(pBC),1200,'BC upfront');
ok(!feasible(pAB) && feasible(pAC) && feasible(pBC), 'two constraints rank feasible set');
eq(pAC.slots,7,'A+C slots exhausted');
eq(pAB.slots,8,'A+B too many slots');
eq(pAC.annual-pAC.oneTime,3164,'first full year profit after one-offs');
eq(newProfit + pAC.annual,2514,'new steady case operating profit excluding one-offs');
eq(newProfit + pAC.annual-pAC.oneTime,1764,'first full year before new capex depreciation');
eq(upfront(pAC)/pAC.annual*12,1650/3914*12,'simple steady-state payback months');

const base = scenarios.find(r=>r.scenario==='base');
const down = scenarios.find(r=>r.scenario==='downside');
const up = scenarios.find(r=>r.scenario==='upside');
function scenarioPlan(s) {
  const aa = {eligible:num(s,'procurement_eligible_share'),saving:num(s,'procurement_saving_k_idr_per_pack'),recurring:num(s,'procurement_annual_recurring_cost_idr_m')};
  const cc = {exited:num(s,'b2b_exited_k_packs'),uplift:num(s,'b2b_price_uplift_k_idr_per_pack'),route:num(s,'b2b_route_saving_idr_m'),recurring:num(s,'b2b_annual_recurring_cost_idr_m')};
  return solve(true,false,true,aa,cc);
}
eq(scenarioPlan(base).annual,pAC.annual,'scenario base equals initiative assumptions');
eq(scenarioPlan(down).annual,784,'A+C downside net of overlap');
eq(scenarioPlan(up).annual,5415,'A+C upside net of overlap');
eq(scenarioPlan(down).overlap,144,'downside interaction changed with lost packs');
eq(scenarioPlan(down).annual-pAC.oneTime,34,'downside first full year after one-offs');
eq(upfront(pAC)/scenarioPlan(down).annual*12,1650/784*12,'downside payback months');
ok(scenarioPlan({...down,b2b_price_uplift_k_idr_per_pack:'0'}).annual !== scenarioPlan(down).annual,
   'deliberate altered price assumption detected');
ok(num({...history[2],case_operating_profit_idr_m:'-1399'},'case_operating_profit_idr_m') !==
   s26.revenue-s26.variable-num(history[2],'fixed_cash_cost_idr_m'),
   'deliberate historical profit mutation detected');

eq(funnel.target_city_retail_accounts*funnel.cold_chain_serviceable_share,1320,'cold chain reachable accounts');
eq(funnel.target_city_retail_accounts*funnel.cold_chain_serviceable_share*funnel.category_qualified_share,462,'category-qualified accounts');
eq(funnel.target_city_retail_accounts*funnel.cold_chain_serviceable_share*funnel.category_qualified_share*funnel.contractable_share_of_qualified,138.6,'expected contracts unrounded');
eq(funnel.target_city_retail_accounts*funnel.cold_chain_serviceable_share*funnel.category_qualified_share*funnel.contractable_share_of_qualified*funnel.annual_premium_packs_per_contracted_account,1663200,'expected packs unrounded');
ok(funnel.incremental_factory_capacity >= num(B,'premium_retail_increment_k_packs')*1000,'factory capacity covers planned increment; no demand validation inferred');

const deck=read('deck-storyline.md');
for (let i=1;i<=6;i++) ok(deck.includes('| '+i+' —'), 'six slide spec '+i);
ok(read('source-ledger.md').includes('BCG written case packet or proprietary exhibit was not obtained'),'source access honesty');
ok(read('assessment.md').includes('No answer key in this file'), 'blind case content');
console.log('PASS: '+checks+' deterministic checks; accounting bridge, market funnel, costs, overlap, constraints, scenarios and file integrity.');
