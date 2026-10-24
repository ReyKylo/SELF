/* Lesson Loop v2 content: every number is recomputed from the case exhibits; all eight beats are present; waterfall ties; ladder answers are re-derived
   with the grid engine; misconceptions are distinct and never equal the correct value; no external image is used as a visual. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../career-grid.js'),V=require('../career-visuals.js');
const root=path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'content/career-lessons-v2.json'),'utf8'));
const base=JSON.parse(fs.readFileSync(path.join(root,'content/career-teaching.json'),'utf8'));
const learning=JSON.parse(fs.readFileSync(path.join(root,'content/career-learning.json'),'utf8'));
const csv=f=>{const [h,...rows]=fs.readFileSync(path.join(root,'content/career-cases',f),'utf8').trim().split(/\r?\n/).map(l=>l.split(','));return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,isNaN(+r[i])||r[i]===''?r[i]:+r[i]])))};
let n=0;const t=(label,fn)=>{try{fn();n++}catch(e){e.message=label+': '+e.message;throw e}};
const near=(a,b,tol=1e-9)=>Math.abs(a-b)<=tol;

assert.equal(data.version,2);assert.equal(data.mode,'GUIDED_PRACTICE_ONLY');assert.ok(data.lessons.length>=1);
const ids=new Set();
for(const L of data.lessons){
 t(L.id+' structure',()=>{
  assert.ok(!ids.has(L.id));ids.add(L.id);
  assert.ok(base.lessons.some(x=>x.id===L.base_id&&x.track===L.track),'base lesson exists');
  for(const k of ['predict','watch','see_it','pro_layout','worked','ladder','defend','lock_in','source_notice'])assert.ok(L[k],'beat '+k);
  assert.match(L.source_notice,/SIMULATED/);
  assert.ok(learning.videos.some(v=>v.id===L.watch.video_id&&v.track===L.track),'video exists');
 });
 t(L.id+' predict',()=>{const p=L.predict;assert.equal(p.options.length,3);assert.ok(p.answer_index>=0&&p.answer_index<3);assert.equal(new Set(p.options).size,3);assert.ok(p.reveal.length>20)});
 t(L.id+' watch is honest about unverified segments',()=>{const w=L.watch;const v=learning.videos.find(x=>x.id===w.video_id);assert.equal(w.watch_for.length,3);
  if(!(v.chapters||[]).length)assert.equal(w.segment_verified,false,'no verified chapters upstream, so no verified segment');
  if(!w.segment_verified){assert.equal(w.start,null);assert.equal(w.end,null)}else{assert.ok(Number.isFinite(w.start)&&w.end>w.start&&w.end<=v.duration_seconds)}});
 t(L.id+' no external images',()=>{assert.ok(!/<img|https?:\/\/[^"]+\.(png|jpe?g|gif|webp)/i.test(JSON.stringify(L)),'visuals are SELF-native')});
}

/* PE-L01: numbers from exhibit-01 and exhibit-02 */
const L=data.lessons.find(x=>x.id==='PE-L01');
const hist=csv('pe/exhibits/exhibit-01-historical.csv'),aging=csv('pe/exhibits/exhibit-02-aging.csv');
const y=Y=>hist.find(r=>r.year===Y);
const y23=y(2023),y24=y(2024),y25=y(2025);
t('waterfall steps match exhibit-01 for 2025',()=>{
 const s=Object.fromEntries(L.see_it.steps.map(x=>[x.id,x]));
 assert.equal(s.ebitda.value,y25.ebitda);assert.equal(s.interest.value,-y25.interest);assert.equal(s.tax.value,-y25.tax);assert.equal(s.nwc.value,-y25.delta_nwc);
 assert.equal(s.cfo.value,y25.cfo);assert.equal(s.capex.value,-y25.capex);assert.equal(s.debt.value,y25.net_debt_issuance);
 assert.ok(near(s.fcf.value,y25.cfo-y25.capex));assert.ok(near(s.cash.value,y25.ending_cash-y24.ending_cash,1e-9));
 assert.equal(y25.ebitda-y25.interest-y25.tax-y25.delta_nwc,y25.cfo,'CFO identity holds in the data');
 assert.ok(near(y25.ebitda/y24.ebitda-1,0.3448,1e-3),'EBITDA +34%');
});
t('waterfall ties out',()=>{const m=V.waterfallModel(L.see_it.steps);assert.equal(m.allTie,true,JSON.stringify(m.ties));assert.equal(m.ties.length,3);assert.ok(near(m.end,y25.ending_cash-y24.ending_cash))});
t('NWC parts recompute and sum to the step',()=>{
 const nwc=L.see_it.steps.find(x=>x.id==='nwc'),p=nwc.parts;
 assert.equal(p[0].value,-(y25.accounts_receivable-y24.accounts_receivable));assert.equal(p[1].value,-(y25.inventory-y24.inventory));assert.equal(p[2].value,y25.accounts_payable-y24.accounts_payable);
 assert.equal(p.reduce((a,b)=>a+b.value,0),nwc.value);
 assert.equal(y25.operating_nwc,y25.accounts_receivable+y25.inventory-y25.accounts_payable);assert.equal(y24.operating_nwc,73);assert.equal(y23.operating_nwc,51);
 assert.match(p[0].detail,new RegExp(y24.accounts_receivable+' → '+y25.accounts_receivable));assert.match(p[1].detail,new RegExp(y24.inventory+' → '+y25.inventory));assert.match(p[2].detail,new RegExp(y24.accounts_payable+' → '+y25.accounts_payable));
});
t('aging facts in the analogy limit',()=>{
 const ar=aging.filter(r=>r.asset_class==='AR'),inv=aging.filter(r=>r.asset_class==='INVENTORY');
 const arRisk=ar.reduce((a,r)=>a+r.at_risk_portion,0),arGross=ar.reduce((a,r)=>a+r.gross_balance,0),invRisk=inv.reduce((a,r)=>a+r.at_risk_portion,0),invGross=inv.reduce((a,r)=>a+r.gross_balance,0);
 assert.equal(arGross,y25.accounts_receivable);assert.equal(invGross,y25.inventory);
 for(const [text,num] of [[L.see_it.analogy_limit,arRisk],[L.see_it.analogy_limit,arGross],[L.see_it.analogy_limit,invRisk],[L.see_it.analogy_limit,invGross]])assert.ok(text.includes('Rp'+num+' miliar'),'mentions Rp'+num);
 assert.equal(arRisk,16);assert.equal(invRisk,17);assert.ok(L.defend.model_points[0].includes('Rp16')&&L.defend.model_points[1].includes('Rp17'));
});
t('pro layout rows match the waterfall',()=>{
 const v=Object.fromEntries(L.pro_layout.rows.map(r=>[r.id,r.value]));
 assert.equal(v.ebitda+v.interest+v.tax+v.nwc,v.cfo);assert.equal(v.cfo+v.capex,v.fcf);assert.ok(near(v.fcf+v.debt,v.cash));
 const ids=new Set(L.pro_layout.rows.map(r=>r.id));for(const c of L.pro_layout.callouts)for(const r of c.rows)assert.ok(ids.has(r),'callout row '+r);
 assert.equal(L.pro_layout.callouts.length,3);assert.ok(L.pro_layout.check.value.includes(String(y25.ending_cash))&&L.pro_layout.check.value.includes(String(y24.ending_cash)));
 assert.ok(L.pro_layout.original.url.startsWith('https://'));
});
t('worked example grid evaluates to the exhibit',()=>{
 const g=L.worked.grid,cells={};g.rows.forEach(r=>r.cells.forEach((c,i)=>{if(c!=null)cells[String.fromCharCode(66+i)+r.n]=c}));
 const s=G.createSheet(cells);assert.equal(G.evaluate('B8',s).value,y23.operating_nwc);assert.equal(G.evaluate('C8',s).value,y24.operating_nwc);assert.equal(G.evaluate('C9',s).value,y24.delta_nwc);
 assert.equal(cells.B5,y23.accounts_receivable);assert.equal(cells.C5,y24.accounts_receivable);assert.equal(cells.B6,y23.inventory);assert.equal(cells.C7,y24.accounts_payable);
});
const [a,b,c,d]=L.ladder;
t('ladder order and fields',()=>{assert.deepEqual(L.ladder.map(r=>r.rung),['complete','independent','twist','red_pen']);for(const r of L.ladder){assert.equal(r.hints.length,3);assert.ok(r.prompt&&r.title&&r.unit);assert.ok(Number.isFinite(r.expect.value))}});
t('rung a: grid engine reproduces the expected value and flags hard-codes',()=>{
 const cells={};a.grid.rows.forEach(r=>r.cells.forEach((cc,i)=>{if(cc!=null&&cc!=='?')cells[String.fromCharCode(66+i)+r.n]=cc}));
 const s=G.createSheet(cells);
 assert.equal(cells.B5,y24.accounts_receivable);assert.equal(cells.C5,y25.accounts_receivable);assert.equal(cells.C6,y25.inventory);assert.equal(cells.C7,y25.accounts_payable);
 assert.equal(G.evaluate('C8-B8',s).value,y25.delta_nwc);assert.equal(a.expect.value,y25.delta_nwc);
 const spec={...a.expect,misconceptions:a.misconceptions};
 assert.equal(G.checkCell(spec,'=C8-B8',s).status,'ok');assert.equal(G.checkCell(spec,'=(C5+C6-C7)-(B5+B6-B7)',s).status,'ok');assert.equal(G.checkCell(spec,'=110-73',s).status,'hardcoded');
 for(const m of a.misconceptions){const r=G.checkCell(spec,String(m.value),s);assert.equal(r.status==='wrong'||r.status==='hardcoded'&&m.value===a.expect.value,true,m.value+' is a wrong answer');assert.equal(r.misconception,m.feedback)}
 assert.equal(G.evaluate('C8+B8',s).value,183);assert.equal(G.evaluate('B8',s).value,73);assert.equal(G.evaluate('C8',s).value,110);assert.equal(y24.delta_nwc,22);
});
t('rung b: CFO 2024 from the exhibit',()=>{
 assert.ok(near(y24.ebitda-y24.interest-y24.tax-y24.delta_nwc,b.expect.value,1e-9));assert.equal(b.expect.value,y24.cfo);
 assert.ok(b.prompt.includes(String(y24.ebitda))&&b.prompt.includes('3,96')&&b.prompt.includes(String(y24.delta_nwc)));
 const val={'43.04':y24.ebitda-y24.interest-y24.tax+y24.delta_nwc,'0.96':-y24.cfo,'3':y24.ebitda-y24.interest-y24.delta_nwc,'21.04':y24.ebitda-y24.interest-y24.tax};
 for(const m of b.misconceptions)assert.ok(near(val[String(m.value)],m.value,1e-9),m.value);
});
t('rung c: twist recomputed',()=>{
 const share=y23.accounts_receivable/y23.revenue,normal=y25.revenue*share;
 assert.ok(near(y25.accounts_receivable-normal,c.expect.value,1e-9),String(y25.accounts_receivable-normal));assert.ok(c.prompt.includes('34 dari 240')&&c.prompt.includes('345'));
 const val={'48.875':normal,'25':y25.accounts_receivable-y24.accounts_receivable,'41':y25.accounts_receivable-y23.accounts_receivable};
 for(const m of c.misconceptions)assert.ok(near(val[String(m.value)],m.value,1e-9),m.value);
 for(const ans of [26.1,26.2,26.0,26.125])assert.equal(G.checkCell(c.expect,String(ans),G.createSheet({})).status,'ok','accepts '+ans);
 for(const ans of [25,26.5,48.9])assert.equal(G.checkCell(c.expect,String(ans),G.createSheet({})).status,'wrong','rejects '+ans);
});
t('rung d: the planted flaw',()=>{
 const rows=Object.fromEntries(d.artefact.rows.map(r=>[r.id,r.value]));
 assert.equal(rows.ebitda,y25.ebitda);assert.equal(rows.interest,-y25.interest);assert.equal(rows.tax,-y25.tax);assert.equal(rows.nwc,y25.delta_nwc,'junior added the NWC increase');
 assert.ok(near(rows.ebitda+rows.interest+rows.tax+rows.nwc,rows.cfo));assert.equal(rows.cfo,64.5);assert.equal(d.flaw_row,'nwc');assert.equal(d.expect.value,y25.cfo);
 for(const id of Object.keys(d.row_feedback))assert.ok(d.artefact.rows.some(r=>r.id===id),id);assert.ok(!('nwc' in d.row_feedback),'the flawed row has found_feedback instead');assert.ok(d.found_feedback);
});
t('misconceptions are distinct and never the correct answer',()=>{for(const r of L.ladder){const vals=r.misconceptions.map(m=>m.value);assert.equal(new Set(vals).size,vals.length,r.rung);assert.ok(!vals.some(v=>Math.abs(v-r.expect.value)<=r.expect.tolerance),r.rung+' has a misconception inside the tolerance');for(const m of r.misconceptions)assert.ok(m.feedback.length>15)}});
t('defend and lock in',()=>{assert.equal(L.defend.model_points.length,3);assert.equal(L.lock_in.cards.length,3);const cid=new Set(L.lock_in.cards.map(x=>x.id));assert.equal(cid.size,3);assert.ok(L.lock_in.cards.every(x=>x.id.startsWith('PE-L01-')&&x.front&&x.back));assert.ok(L.lock_in.build_output===base.lessons.find(x=>x.id==='PE-L01').build_output)});
console.log('PASS Lessons v2: '+n+' checks (numbers recomputed from the Aruna exhibits, waterfall ties, ladder re-derived with the grid engine, misconceptions, honesty fields).');
