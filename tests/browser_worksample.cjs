/* SELF Phase 6 — Independent Work Samples in the REAL app shell (synthetic, isolated Supabase fixture). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {launch}=require('./browser_learning_fixture.cjs');
const X=require('./xlsx_fixture.cjs');
const W=require('../career-workbook-check.js');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const TRACKS=[
  {track:'PE',title:/Sagara/,brief:'content/career-cases/pe/assessment.md',data:0},
  {track:'VC',title:/ArusOps/,brief:'content/career-cases/vc/blind/holdout-brief.md',data:1,csv:'content/career-cases/vc/blind/holdout-cohorts.csv'},
  {track:'Consulting',title:/SajiRasa/,brief:'content/career-cases/consulting/assessment.md',data:6}
];
async function noOverflow(p,label){
  const d=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d));
}
async function openSample(x){
  await x.enter();
  await x.page.locator('[data-learning="tab"][data-tab="worksample"]').click();
  await x.page.locator('#ws-title').waitFor();
}
const tabs=x=>x.page.locator('[data-ws="track"]');
(async()=>{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
    const x=await launch({viewport});x.page.setDefaultTimeout(8000);
    const outbound=[];x.page.on('request',r=>{if(/storage\/v1|career_portfolio/.test(r.url())&&r.method()!=='GET')outbound.push(r.method()+' '+r.url())});
    try{
      await openSample(x);
      await x.page.evaluate(()=>document.documentElement.style.setProperty('--scale','1.5'));
      assert.equal(await x.page.locator('[data-learning="tab"][data-tab="worksample"]').getAttribute('aria-pressed'),'true');

      for(const t of TRACKS){
        await tabs(x).filter({hasText:new RegExp(t.track==='PE'?'Private Equity':t.track==='VC'?'Venture':'Consulting')}).click();
        await x.page.locator('#ws-title').filter({hasText:t.title}).waitFor();
        assert.equal(await x.page.evaluate(()=>document.activeElement?.id),'ws-title','focus moves to the case heading after switching track');
        const text=await x.page.locator('.ws-root').innerText();
        assert.match(text,/SIMULASI/);assert.match(text,/TANPA KUNCI JAWABAN/);
        assert.doesNotMatch(text,/AI score|certified|sertifikat resmi/i,'no grading or certification claim in the UI');
        assert(await x.page.locator('.ws-brief h2, .ws-brief h3, .ws-brief p').count()>3,'brief rendered as structure');
        assert.equal(await x.page.locator('.ws-data').count(),t.data,t.track+' data tables');
        assert.equal(await x.page.locator('.ws-deliver li').count()>=5,true,'deliverables listed');
        assert.equal(await x.page.locator('.ws-brief script, .ws-brief img, .ws-brief iframe').count(),0,'rendered brief is inert');
        await noOverflow(x.page,t.track+' @'+viewport.width);
        // Every wide table scrolls inside its own region and is keyboard reachable.
        for(const r of await x.page.locator('.ws-scroll').all())assert.equal(await r.getAttribute('tabindex'),'0');
        const [dl]=await Promise.all([x.page.waitForEvent('download'),x.page.locator('[data-ws="download-brief"]').click()]);
        assert.equal(fs.readFileSync(await dl.path(),'utf8'),read(t.brief),t.track+' downloaded brief is byte-identical to the reviewed source');
        if(t.csv){
          const [csv]=await Promise.all([x.page.waitForEvent('download'),x.page.locator('[data-ws="download-data"]').first().click()]);
          assert.equal(fs.readFileSync(await csv.path(),'utf8').trim(),read(t.csv).trim(),'CSV round-trips unchanged');
        }
      }

      // Workbook structure check: runs locally on a real XLSX, no network write, honest labels.
      await tabs(x).first().click();await x.page.locator('#ws-title').filter({hasText:/Sagara/}).waitFor();
      const starter=X.starterBytes('PE_LBO');
      const ops=(await W.inspect(new Uint8Array(starter))).sheets.find(z=>z.name==='OPERATIONS').formulas[0];
      const tampered=Buffer.from(X.mutate('PE_LBO',1,xml=>xml.replace(X.cellRe(ops),'<c r="'+ops+'"><v>999</v></c>')));
      await x.page.locator('[data-ws-starter]').check();
      await x.page.locator('#ws-file').setInputFiles({name:'my_model.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:tampered});
      await x.page.locator('.ws-findings').waitFor();
      const res=await x.page.locator('.ws-check').innerText();
      assert.match(res,/my_model\.xlsx/);assert.match(res,/OPERATIONS/);
      assert.match(res,new RegExp('OPERATIONS!'+ops+' di starter berisi formula, sekarang angka yang diketik'));
      assert.match(res,/DETERMINISTIC_VERIFIED/);assert.match(res,/bukan.*penilaian benar atau salahnya/i);
      assert.equal(await x.page.locator('.ws-findings li.ws-warn').count(),1,'only the altered cell is flagged');
      // Untouched starter: clean.
      await x.page.locator('#ws-file').setInputFiles({name:'starter.xlsx',mimeType:'application/octet-stream',buffer:starter});
      await x.page.locator('.ws-check').getByText('Tidak ada temuan struktural').waitFor();
      // Without the starter box ticked, restructured models are not accused.
      await x.page.locator('[data-ws-starter]').uncheck();
      await x.page.locator('.ws-check').getByText('starter.xlsx').waitFor();
      // Rejections are readable and never crash the tab.
      await x.page.locator('#ws-file').setInputFiles({name:'notes.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('this is not a spreadsheet')});
      await x.page.locator('.ws-check [role="alert"]').waitFor();
      assert.match(await x.page.locator('.ws-check [role="alert"]').innerText(),/XLSX|ZIP/);
      await x.page.locator('#ws-file').setInputFiles({name:'x.csv',mimeType:'text/csv',buffer:Buffer.from('a,b')});
      assert.match(await x.page.locator('.ws-check [role="alert"]').innerText(),/\.xlsx/);
      assert.deepEqual(outbound,[],'checking a workbook sends nothing to storage or portfolio tables');
      assert.equal(x.fixture.postCount,0);
      await noOverflow(x.page,'check panel @'+viewport.width);

      // Keyboard: track buttons are reachable and operable without a pointer.
      await tabs(x).nth(1).focus();await x.page.keyboard.press('Enter');
      await x.page.locator('#ws-title').filter({hasText:/ArusOps/}).waitFor();

      // Hand-offs into the existing Career Prep surfaces.
      await x.page.locator('[data-ws="director"]').click();
      await x.page.locator('#director-initial').waitFor();
      assert.equal(await x.page.locator('[data-director-action="track"][data-track="VC"]').getAttribute('aria-pressed'),'true','Director opens on the work sample\'s track');
      await x.page.locator('[data-learning="tab"][data-tab="worksample"]').click();
      await x.page.locator('#ws-title').waitFor();
      await x.page.locator('[data-ws="portfolio"]').click();
      await x.page.locator('.portfolio-workspace').waitFor();
      assert.match(await x.page.locator('.portfolio-heading h3').innerText(),/VC/);
      assert.deepEqual(outbound,[],'opening the portfolio only reads');
      assert.deepEqual(x.errors,[],'no runtime browser errors');
      console.log('PASS full-app Work Sample '+viewport.width+'px, 150% text: 3 tracks, briefs, data, downloads, workbook check, keyboard, hand-offs');
    }finally{await x.browser.close()}
  }

  // Content failure is explicit and recoverable.
  const f=await launch();f.page.setDefaultTimeout(8000);
  try{
    let broken=true;
    await f.context.route('**/content/work-samples/index.json',r=>broken?r.fulfill({status:503,body:'down'}):r.fallback());
    await f.enter();
    await f.page.locator('[data-learning="tab"][data-tab="worksample"]').click();
    await f.page.locator('.ws-root [role="alert"]').waitFor();
    assert.match(await f.page.locator('.ws-root [role="alert"]').innerText(),/503/);
    broken=false;await f.page.locator('[data-ws="retry"]').click();
    await f.page.locator('#ws-title').waitFor();
    assert.deepEqual(f.errors.filter(e=>!/503/.test(e)),[]);
    console.log('PASS Work Sample index 503 shows an error and Retry recovers');
  }finally{await f.browser.close()}

  // Account switch in the real shell: nothing from the first learner's file check survives.
  const s=await launch();s.page.setDefaultTimeout(8000);
  try{
    await openSample(s);
    await s.page.locator('#ws-file').setInputFiles({name:'old_user_model.xlsx',mimeType:'application/octet-stream',buffer:X.starterBytes('PE_LBO')});
    await s.page.locator('.ws-check').getByText('old_user_model.xlsx').waitFor();
    await s.page.locator('[data-action="nav"][data-view="settings"]:visible').first().click();
    await s.page.locator('[data-action="logout"]').click();
    await s.page.locator('#auth-form').waitFor();
    s.fixture.user={id:'dca1c233-018d-4c53-a52c-bef5932a8a7f',email:'second-qa@example.invalid'};
    await s.context.route('https://btiwxqjiptbwaunjibjh.supabase.co/auth/v1/token*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'synthetic-next-token',refresh_token:'synthetic-next-refresh',user:s.fixture.user})}));
    await s.page.locator('#auth-form [name=email]').fill(s.fixture.user.email);
    await s.page.locator('#auth-form [name=password]').fill('not-real-password');
    await s.page.locator('#auth-form button[type=submit]').click();
    await s.page.locator('[data-action="nav"][data-view="career"]:visible').first().click();
    await s.page.locator('[data-career="page"][data-page="learning"]:visible').first().click();
    await s.page.locator('[data-learning="tab"][data-tab="worksample"]').click();
    await s.page.locator('#ws-title').waitFor();
    assert.doesNotMatch(await s.page.locator('.ws-check').innerText(),/old_user_model/);
    assert.equal(await s.page.evaluate(()=>window.SELFWorkSample.state.check.report),null);
    assert.deepEqual(s.errors,[]);
    console.log('PASS full-app account switch: previous learner\'s workbook check is gone');
  }finally{await s.browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
