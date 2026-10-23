/* Independent runtime QA: uses only local synthetic API routes, never live user data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch}=require('./browser_learning_fixture.cjs');
const root=path.join(__dirname,'..');
const checks=[];const pass=(name,details)=>{checks.push({name,result:'PASS',details});console.log('PASS',name)};
const closeTask=async p=>{await p.locator('button[data-action="close-panel"]').click();await p.locator('.overlay').waitFor({state:'hidden',timeout:5000})};
const waitTask=async p=>p.getByRole('textbox',{name:'Task title',exact:true}).waitFor();
const noOverflow=async p=>{const width=await p.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));assert(width.actual<=width.viewport+1,JSON.stringify(width));return width};
(async()=>{
 const x=await launch();x.page.setDefaultTimeout(5000);
 try{
  await x.enter();assert.equal(x.fixture.tasks.length,0);pass('No automatic Task creation','Opening Career Prep did not write records.');
  x.fixture.delay=180;
  await x.page.locator('[data-learning="task"]').click();
  await x.page.locator('[data-learning="task"]').dispatchEvent('click');
  await waitTask(x.page);assert.equal(x.fixture.tasks.length,1);assert.equal(x.fixture.postCount,1);const pe=x.fixture.tasks[0].id;
  assert.match(await x.page.getByRole('textbox',{name:'Task title',exact:true}).inputValue(),/Acquisition model/);
  pass('Repeated Task action under delay','Two click events resulted in one POST, one row and the actual Task detail.');
  x.fixture.delay=0;await closeTask(x.page);
  await x.enter();await x.page.locator('[data-learning="task"]').click();await waitTask(x.page);
  assert.equal(x.fixture.tasks.length,1);assert.equal(x.fixture.tasks[0].id,pe);assert.equal(x.fixture.postCount,1);
  pass('Reload and reopen same canonical Task','Reloaded page retrieved original Task ID; no second POST.');
  await closeTask(x.page);await x.page.locator('[data-learning="day"][data-id="VC"]').click();x.fixture.dropAck=true;
  await x.page.locator('[data-learning="task"]').click();await waitTask(x.page);
  assert.equal(x.fixture.tasks.length,2);assert.equal(x.fixture.postCount,2);assert(!await x.page.locator('.learning-task-error').count());
  pass('Lost POST acknowledgement recovery','POST committed then route aborted; follow-up GET found stable ID and opened same Task.');
  await closeTask(x.page);await x.page.locator('[data-learning="day"][data-id="Consulting"]').click();x.fixture.failTasks=true;
  await x.page.locator('[data-learning="task"]').click();await x.page.locator('.learning-task-error').waitFor();
  assert.equal(x.fixture.tasks.length,2);assert.equal(x.fixture.postCount,2);
  assert(await x.page.locator('[data-learning="task"]').isEnabled());
  pass('Failed Task lookup is explicit and retryable','Error displayed, no phantom row or POST, action re-enabled.');
  x.fixture.failTasks=false;await x.page.locator('[data-learning="task"]').click();await waitTask(x.page);assert.equal(x.fixture.tasks.length,3);await closeTask(x.page);
  pass('Task retry after restored service','Exactly one Consulting Task created and opened.');
  await x.page.locator('[data-learning="tab"][data-tab="evidence"]').click();await x.page.locator('#learning-track').selectOption('VC');
  assert.match(await x.page.locator('.learning-count').innerText(),/4 dari 12/);
  await x.page.locator('#learning-search').fill('this will never match a source');await x.page.locator('.learning-empty').waitFor();assert.match(await x.page.locator('.learning-count').innerText(),/0 dari 12/);
  await x.page.locator('[data-learning="clear"]').first().click();assert.match(await x.page.locator('.learning-count').innerText(),/12 dari 12/);
  await x.page.locator('[data-learning="panel-select"][data-id="VC03"]').click();
  assert(await x.page.locator('.learning-original .learning-pointer-note').first().isVisible());assert.equal(await x.page.locator('.learning-original img').count(),0);
  await x.page.locator('[data-learning="panel-select"][data-id="VC04"]').click();
  assert.equal(await x.page.locator('.learning-original .learning-document-mark').count(),0);assert.equal(await x.page.locator('.learning-original img').count(),1);
  await x.page.locator('.learning-related [data-learning="video"]').first().click();assert.equal(await x.page.locator('iframe').count(),0);
  assert(await x.page.locator('[data-learning="back-evidence"]').isVisible());
  await x.page.locator('[data-learning="back-evidence"]').click();assert.match(await x.page.locator('#learning-evidence-title').innerText(),/PagerDuty/);
  assert.equal(await x.page.evaluate(()=>document.activeElement.id),'learning-evidence-title');
  pass('Counts, clear, evidence→video→back and focus','4/12 and 0/12 reconciled; reset restores 12/12; selected VC04 and focused title returned.');
  await x.page.locator('[data-learning="tab"][data-tab="sources"]').click();await x.page.locator('[data-learning="clear"]').first().click();
  assert.match(await x.page.locator('.learning-count').innerText(),/41 dari 41/);
  assert((await x.page.locator('.learning-source-status').allTextContents()).some(t=>t.includes('screening judul')));
  assert((await x.page.locator('.learning-source-status').allTextContents()).some(t=>t.includes('kasus belum diverifikasi')));
  assert.equal(await x.page.locator('.learning-source-row').count(),41);pass('Source-screening provenance','41 actual source rows, screened-title and index-only statuses displayed; not a universal deep-review badge.');
  assert.equal(x.errors.length,0);pass('No browser page errors','Fault responses were intentional fixture network errors, not uncaught JavaScript errors.');
 }finally{await x.browser.close()}
 const switching=await launch();switching.page.setDefaultTimeout(5000);
 let releaseSwitch,postSeen=false;const switchGate=new Promise(r=>releaseSwitch=r);
 try{
  await switching.enter();
  await switching.context.route('https://btiwxqjiptbwaunjibjh.supabase.co/rest/v1/tasks*',async route=>{if(route.request().method()==='POST'){postSeen=true;await switchGate}return route.fallback()});
  await switching.context.route('https://btiwxqjiptbwaunjibjh.supabase.co/auth/v1/token*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'synthetic-second-token',refresh_token:'synthetic-second-refresh',user:switching.fixture.user})}));
  await switching.page.locator('[data-learning="task"]').click();while(!postSeen)await new Promise(r=>setTimeout(r,5));
  await switching.page.locator('[data-action="nav"][data-view="settings"]:visible').first().click();await switching.page.locator('[data-action="logout"]').click();await switching.page.locator('#auth-form').waitFor();
  switching.fixture.user={id:'596c22f5-d7de-47d6-af05-289e8f7bce1e',email:'synthetic-second@example.invalid'};
  await switching.page.locator('#auth-form [name=email]').fill(switching.fixture.user.email);await switching.page.locator('#auth-form [name=password]').fill('synthetic-only-password');await switching.page.locator('#auth-form button[type=submit]').click();
  await switching.page.locator('[data-action="nav"][data-view="career"]:visible').first().click();await switching.page.locator('[data-career="page"][data-page="learning"]:visible').first().click();await switching.page.locator('.learning-sprint-intro').waitFor();
  releaseSwitch();await switching.page.waitForTimeout(150);assert.equal(await switching.page.locator('.overlay').count(),0);assert.equal(await switching.page.locator('[data-learning="task"]').innerText(),'Tambah proyek ke My Work');assert.equal(await switching.page.evaluate(()=>window.SELFCareerLearning.ui.owner),switching.fixture.user.id);
  pass('Account switch during pending POST','Actual synthetic sign out/sign in with a held old-account response did not open or inject the old Task into the new account.');
 }finally{releaseSwitch?.();await switching.browser.close()}
 const y=await launch();y.page.setDefaultTimeout(5000);
 try{
  y.fixture.failCareer=true;await y.enter();assert(await y.page.locator('.learning-sprint-intro').isVisible());pass('Learning independent of unrelated Career failure','All Career tables returned 503; static Career Prep still loaded.');
 }finally{await y.browser.close()}
 const z=await launch();z.page.setDefaultTimeout(5000);
 try{
  z.fixture.contentFail=true;const entering=z.enter();
  await z.page.getByRole('heading',{name:'Materi belum terbuka.',exact:true}).waitFor();assert.match(await z.page.locator('.learning-empty').innerText(),/Materi belum terbuka/);
  z.fixture.contentFail=false;await z.page.locator('[data-learning="retry"]').click();await z.page.locator('.learning-sprint-intro').waitFor();
  await entering;pass('Content failure and Retry','Static JSON 503 produces explicit error and Retry restores real content.');
 }finally{await z.browser.close()}
 for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
  const a=await launch({viewport});a.page.setDefaultTimeout(5000);
  try{
   await a.enter();await a.page.evaluate(()=>document.documentElement.style.setProperty('--scale','1.5'));
   for(const tab of ['sprint','evidence','videos','sources']){
    await a.page.locator('[data-learning="tab"][data-tab="'+tab+'"]').click();await noOverflow(a.page);
   }
   await a.page.locator('[data-learning="tab"][data-tab="evidence"]').click();
   await a.page.locator('#learning-search').focus();await a.page.keyboard.type('Shopify');await a.page.waitForTimeout(220);
   assert.equal(await a.page.evaluate(()=>document.activeElement.id),'learning-search');
   assert.match(await a.page.locator('.learning-count').innerText(),/1 dari 12/);
   const themeBefore=await a.page.locator('body').getAttribute('data-theme');await a.page.locator('[data-action="theme"]').click();assert.notEqual(await a.page.locator('body').getAttribute('data-theme'),themeBefore);await noOverflow(a.page);
   await a.page.screenshot({path:path.join(root,'docs/learning-review','qa-'+viewport.width+'-150.png'),fullPage:false});
   pass('Layout/type/keyboard '+viewport.width,'All four tabs at 150% type have no document overflow; search retains focus; live theme switch exercised.');
  }finally{await a.browser.close()}
 }
 const files=['career-learning.js','career-learning.css','career.js','content/career-learning.json'];
 const identity=crypto.createHash('sha256').update(files.map(f=>fs.readFileSync(path.join(root,f))).join('\n')).digest('hex');
 fs.writeFileSync(path.join(root,'docs/learning-review/qa-results.json'),JSON.stringify({build:identity,environment:'Chromium headless 145; local synthetic Supabase fixture; not production RLS or real user persistence',checks},null,2));
 console.log('All independent runtime checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
