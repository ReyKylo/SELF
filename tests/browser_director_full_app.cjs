/* SELF Phase 5 — real full-app route/navigation with synthetic, isolated Supabase fixture. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {launch}=require('./browser_learning_fixture.cjs');
const alive=async p=>p.locator('[data-learning="tab"][data-tab="director"]').waitFor();
async function openDirector(x){
  await x.enter();
  await alive(x.page);
  await x.page.locator('[data-learning="tab"][data-tab="director"]').click();
  await x.page.locator('#director-initial').waitFor();
}
async function noOverflow(p, label){
  const dims=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(dims.scroll<=dims.viewport+1,label+' overflows: '+JSON.stringify(dims));
}
const run=async()=>{
  for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
    const x=await launch({viewport});x.page.setDefaultTimeout(7000);
    let approveReset=false;
    x.page.on('dialog',dialog=>approveReset?dialog.accept():dialog.dismiss());
    try{
      await openDirector(x);
      assert.equal(await x.page.locator('[data-learning="tab"][data-tab="director"]').getAttribute('aria-pressed'),'true');
      await x.page.evaluate(()=>document.documentElement.style.setProperty('--scale','1.5'));
      await noOverflow(x.page,'Director start '+viewport.width);
      assert.equal(x.fixture.postCount,0,'reading does not write canonical tasks');
      await x.page.locator('[data-director-action="track"][data-track="VC"]').click();
      await x.page.locator('#director-initial').fill('Pass pending underwriting proof; see owner model');
      await x.page.locator('#director-reference').fill('Synthetic exhibit 1; gross retention assumptions');
      assert.equal(await x.page.locator('[data-director-action="submit"]').isEnabled(),true);
      await x.page.locator('[data-director-action="submit"]').click();
      await x.page.locator('#director-answer-VC-D1').fill('Compare equal-aged GRR cohorts; check expansion timing.');
      await x.page.locator('[data-learning="tab"][data-tab="sprint"]').click();
      await x.page.locator('[data-learning="tab"][data-tab="director"]').click();
      assert.match(await x.page.locator('.learning-workspace').innerText(),/LOCKED ORIGINAL DECISION/);
      assert.equal(await x.page.locator('#director-answer-VC-D1').inputValue(),'Compare equal-aged GRR cohorts; check expansion timing.','tab switch retains same-account answer');
      await noOverflow(x.page,'Director in progress '+viewport.width);
      const [draft]=await Promise.all([
        x.page.waitForEvent('download'),
        x.page.locator('[data-director-action="draft"]').first().click()
      ]);
      assert.match(draft.suggestedFilename(),/SELF_Director_Draft_VC\.txt$/);
      assert.match(fs.readFileSync(await draft.path(),'utf8'),/DRAFT — INCOMPLETE/);
      for(let n=1;n<=5;n++){
        if(n>1)await x.page.locator('#director-answer-VC-D'+n).fill('Evidence and risk analysis for VC challenge '+n);
        assert.equal(await x.page.locator('[data-director-action="next"]').isEnabled(),true);
        await x.page.locator('[data-director-action="next"]').click();
        await noOverflow(x.page,'Director step '+n+' at '+viewport.width);
      }
      await x.page.locator('[data-director-action="back"]').click();
      assert.equal(await x.page.locator('#director-answer-VC-D5').inputValue(),'Evidence and risk analysis for VC challenge 5');
      await x.page.locator('[data-director-action="next"]').click();
      await x.page.locator('#director-twist').fill('Downside cohort assumptions reviewed.');
      await x.page.locator('#director-opposite').fill('Counter-argument: near-term expansion could improve retention.');
      await x.page.locator('#director-final').fill('Diligence, then invest only if equal-aged GRR clears minimum hurdle.');
      await noOverflow(x.page,'Director final at '+viewport.width);
      assert.equal(await x.page.locator('[data-director-action="export"]').isEnabled(),true);
      const [final]=await Promise.all([x.page.waitForEvent('download'),x.page.locator('[data-director-action="export"]').click()]);
      const dossier=fs.readFileSync(await final.path(),'utf8');
      assert.match(dossier,/FINAL DOSSIER — NOT AUTO GRADED/);
      assert.match(dossier,/VC-D5/);
      assert.match(dossier,/Diligence, then invest/);
      await x.page.locator('[data-director-action="reset"]').first().click();
      assert.equal(await x.page.locator('#director-final').inputValue(),'Diligence, then invest only if equal-aged GRR clears minimum hurdle.','cancel destructive reset retains work');
      approveReset=true;
      await x.page.locator('[data-director-action="reset"]').first().click();
      await x.page.locator('#director-initial').waitFor();
      assert.equal(await x.page.locator('#director-initial').inputValue(),'');
      assert.equal(x.fixture.postCount,0,'Director Review must not write synthetic Tasks');
      assert.deepEqual(x.errors,[],'no runtime browser errors');
      console.log('PASS full-app Director Review '+viewport.width+'px navigation, 150% text, session, draft, final export, reset');
    }finally{await x.browser.close()}
  }

  // Account switching is tested in the REAL application shell, not the isolated module harness.
  const s=await launch();s.page.setDefaultTimeout(7000);
  try{
    await openDirector(s);
    await s.page.locator('#director-initial').fill('Old user private decision');
    await s.page.locator('#director-reference').fill('Old synthetic exhibit');
    await s.page.locator('[data-director-action="submit"]').click();
    await s.page.locator('#director-answer-PE-D1').fill('Old user defense not for new account');
    await s.page.locator('[data-action="nav"][data-view="settings"]:visible').first().click();
    await s.page.locator('[data-action="logout"]').click();
    await s.page.locator('#auth-form').waitFor();
    s.fixture.user={id:'dca1c233-018d-4c53-a52c-bef5932a8a7f',email:'second-qa@example.invalid'};
    await s.context.route('https://btiwxqjiptbwaunjibjh.supabase.co/auth/v1/token*',route=>
      route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        access_token:'synthetic-next-token',refresh_token:'synthetic-next-refresh',user:s.fixture.user
      })})
    );
    await s.page.locator('#auth-form [name=email]').fill(s.fixture.user.email);
    await s.page.locator('#auth-form [name=password]').fill('not-real-password');
    await s.page.locator('#auth-form button[type=submit]').click();
    await s.page.locator('[data-action="nav"][data-view="career"]:visible').first().click();
    await s.page.locator('[data-career="page"][data-page="learning"]:visible').first().click();
    await s.page.locator('[data-learning="tab"][data-tab="director"]').click();
    await s.page.locator('#director-initial').waitFor();
    assert.equal(await s.page.locator('#director-initial').inputValue(),'');
    assert.equal(await s.page.evaluate(()=>window.SELFCareerLearning.ui.owner),s.fixture.user.id);
    assert.equal(await s.page.evaluate(()=>window.SELFDirectorReview.state.initial),'');
    assert.equal(s.fixture.postCount,0);
    assert.deepEqual(s.errors,[]);
    console.log('PASS full-app account switch: old learner answers unavailable to new synthetic account');
  }finally{await s.browser.close()}

  // The Director-specific static JSON must surface errors and support a retry, not a blank state.
  const failure=await launch();failure.page.setDefaultTimeout(7000);
  try{
    let errorMode=true;
    await failure.context.route('**/content/career-director-review/review-panels.json',
      route=>errorMode?route.fulfill({status:503,body:'Synthetic Director content unavailable'}):route.fallback());
    await failure.enter();
    await failure.page.locator('[data-learning="tab"][data-tab="director"]').click();
    await failure.page.getByRole('alert').waitFor();
    assert.match(await failure.page.locator('[role="alert"]').innerText(),/503/);
    errorMode=false;
    await failure.page.locator('[data-director-action="retry"]').click();
    await failure.page.locator('#director-initial').waitFor();
    assert.deepEqual(failure.errors,[]);
    console.log('PASS Director specific JSON 503 → retry works in full SELF app');
  }finally{await failure.browser.close()}
};
run().catch(err=>{console.error(err);process.exitCode=1});
