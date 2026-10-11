/* Real Chromium browser QA for SELF Investment Intelligence V1.
   Run AFTER python3 tools/build_cloudflare.py.
   Requires @playwright/test installed in CI. Never connects to private production data. */
const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const ART=path.join(ROOT,'artifacts','investment-qa');
fs.mkdirSync(ART,{recursive:true});
const PORT=8769;
const BASE='http://127.0.0.1:'+PORT;
const checks=[];
let server,browser;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){
 for(let i=0;i<60;i++){
  try{const r=await fetch(BASE+'/index.html');if(r.ok)return;}catch{}
  await pause(500);
 }
 throw Error('Local HTTP server unavailable');
}
async function click(page,action,value){
 const selector='[data-ii="'+action+'"]'+(value!==undefined?'[data-val="'+value+'"]':'');
 await page.locator(selector).first().click();
}
async function noOverflow(page,label){
 const dims=await page.evaluate(()=>({vw:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
 assert.ok(dims.scroll<=dims.vw+3,label+' horizontal overflow '+JSON.stringify(dims));
 checks.push(label+' no horizontal overflow');
}
async function screenshot(page,name){await page.screenshot({path:path.join(ART,name+'.png'),fullPage:true,animations:'disabled'});}
async function run(){
 server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory','dist'],{cwd:ROOT,stdio:'ignore'});
 await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage();const errs=[];
 page.on('pageerror',err=>errs.push(err.message));
 await page.goto(BASE+'/#investment',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.ii-hero').waitFor({timeout:25000});
 assert.match(await page.title(),/Rey|Workspace|SELF/i);
 assert.ok(await page.locator('.ii-home').count());
 await noOverflow(page,'Academy desktop');
 await screenshot(page,'01-academy-desktop');
 checks.push('Academy rendered on real Chromium');
 await click(page,'view','lesson');
 await page.locator('.ii-lesson-content').waitFor();
 assert.match(await page.locator('.ii-reading').innerText(),/investment thesis/i);
 await screenshot(page,'02-lesson-brief');
 await click(page,'brief-done');
 assert.match(await page.locator('.ii-lesson-progress').innerText(),/1\/5/);
 await click(page,'step','video');
 assert.ok(await page.locator('.ii-video-details a[href*="ycombinator.com"]').count());
 await click(page,'video-done');
 await click(page,'step','visual');
 const before=await page.locator('.ii-sim-bars>div:nth-child(2) strong').innerText();
 await page.locator('#iiGrowth').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const after=await page.locator('.ii-sim-bars>div:nth-child(2) strong').innerText();
 assert.notEqual(after,before,'growth slider should update scenario');
 assert.match(after,/22,000/);
 await screenshot(page,'03-interactive-growth');
 await click(page,'visual-done');
 await click(page,'step','recall');
 await click(page,'quiz-choice','A');
 assert.ok(await page.locator('[data-ii="quiz-choice"][data-val="A"]').getAttribute('class').then(v=>v.includes('is-selected')));
 await click(page,'quiz');
 assert.match(await page.locator('.ii-feedback').innerText(),/Belum tepat/);
 const choiceB=page.locator('[data-ii="quiz-choice"][data-val="B"]');
 await choiceB.focus();
 await page.keyboard.press('Enter');
 assert.equal(await choiceB.getAttribute('aria-pressed'),'true','Quiz choice should support keyboard selection');
 await click(page,'quiz');
 assert.match(await page.locator('.ii-feedback').innerText(),/Betul/);
 await click(page,'step','apply');
 const thesis='Independent thesis: strong merchant adoption and subscription growth suggest real product demand, conditional on retention.';
 const risk='Customer churn, uncertain addressable market, and valuation could weaken returns.';
 await page.locator('textarea[data-ii-field="thesis"]').fill(thesis);
 await page.locator('textarea[data-ii-field="risk"]').fill(risk);
 await click(page,'save-draft');
 assert.match(await page.locator('.ii-lesson-progress').innerText(),/5\/5/);
 checks.push('All five stages, scenario update, recall feedback and draft work in browser');
 await click(page,'view','case');
 assert.equal(await page.locator('textarea[data-ii-field="thesis"]').inputValue(),thesis);
 await page.locator('textarea[data-ii-field="evidence"]').fill('Historical memo, Bessemer, 12 October 2010. Distinguish hindsight from 2010 facts.');
 await click(page,'save-draft');
 await screenshot(page,'04-active-case');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.ii-case-editor').waitFor();
 assert.equal(await page.locator('textarea[data-ii-field="thesis"]').inputValue(),thesis);
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('self.investment.academy.v1')||'{}'));
 assert.equal(state.quizCorrect,true);
 assert.equal(state.briefDone,true);
 assert.ok(state.evidence.includes('Historical memo'));
 checks.push('Progress, draft and evidence survive a real browser reload');
 await click(page,'view','portfolio');
 assert.match(await page.locator('.ii-portfolio-entry').innerText(),/CASE DRAFT/);
 assert.match(await page.locator('.ii-portfolio-entry').innerText(),/Research QA pending/);
 await screenshot(page,'05-portfolio-draft');
 const downloadPromise=page.waitForEvent('download');
 await click(page,'export');
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'SELF_Shopify_2010_Research_Draft.md');
 const downloaded=fs.readFileSync(await download.path(),'utf8');
 assert.ok(downloaded.includes(thesis));
 assert.ok(downloaded.includes('As-of date: 2010-10-12'));
 checks.push('Portfolio export contains authored analysis and historical label');

 await click(page,'view','growth');
 await page.locator('.ii12-lesson-header').waitFor();
 await screenshot(page,'15-growth-lesson');
 assert.match(await page.locator('.ii12-paper').innerText(),/Revenue growth itu bagus/);
 await page.locator('[data-ii12="simpler"]').click();
 assert.match(await page.locator('.ii12-paper').innerText(),/Isi ember/);
 await page.locator('[data-ii12="mark-brief"]').click();
 await page.locator('[data-ii12="growth-step"][data-val="video"]').click();
 assert.ok(await page.locator('a[href*="startup-investor-school-preview-with-geoff-ralston"]').count());
 await page.locator('[data-ii12="mark-video"]').click();
 await page.locator('[data-ii12="growth-step"][data-val="exercise"]').click();
 await page.locator('[data-ii12="exercise-choice"][data-val="A"]').click();
 await page.locator('[data-ii12="exercise-check"]').click();
 assert.match(await page.locator('.ii12-feedback').innerText(),/Coba lagi/);
 const correct=page.locator('[data-ii12="exercise-choice"][data-val="B"]');
 await correct.focus();await page.keyboard.press('Enter');
 assert.equal(await correct.getAttribute('aria-pressed'),'true');
 await page.locator('[data-ii12="exercise-check"]').click();
 assert.match(await page.locator('.ii12-feedback').innerText(),/Tepat/);
 await page.locator('[data-ii12="growth-step"][data-val="write"]').click();
 await page.locator('[data-ii12-field="teachback"]').fill('Customer acquisition may grow quickly, but many existing merchants can churn, so cohort retention determines recurring revenue quality.');
 await page.locator('[data-ii12="save-teachback"]').click();
 assert.match(await page.locator('.ii12-lesson-count').innerText(),/4\/4/);
 await click(page,'view','notebook');
 await page.locator('.ii12-notebook-head').waitFor();
 await screenshot(page,'16-research-notebook');
 assert.match(await page.locator('.ii12-source-grid').innerText(),/MRR growth percentage: reconcile it/);
 await page.locator('[data-ii12="import-source"][data-val="mrr"]').click();
 assert.match(await page.locator('.ii12-notebook-count').innerText(),/1/);
 await page.locator('[data-ii12-field="draftTitle"]').fill('Shopify app ecosystem');
 await page.locator('[data-ii12-field="draftObservation"]').fill('The Bessemer memo says roughly two thirds of customers use a third party app.');
 await page.locator('[data-ii12-field="draftInterpretation"]').fill('App use may support product stickiness but does not replace cohort retention analysis.');
 await page.locator('[data-ii12-field="draftUrl"]').fill('https://www.bvp.com/memos/shopify');
 await page.locator('[data-ii12-field="draftDate"]').fill('2010-10-12');
 await page.locator('[data-ii12="save-note"]').click();
 assert.match(await page.locator('.ii12-notebook-count').innerText(),/2/);
 await page.locator('[data-ii12-field="slideClaim"]').fill('Shopify can scale recurring revenues if merchant retention offsets SMB churn.');
 await page.locator('[data-ii12-field="slideSourceId"]').selectOption('source-mrr');
 await page.locator('[data-ii12-field="slideImplication"]').fill('Stress-test cohort economics and entry valuation before making a capital commitment.');
 await page.locator('[data-ii12="save-slide"]').click();
 assert.match(await page.locator('.ii12-slide-preview').innerText(),/Shopify can scale recurring revenues/);
 await screenshot(page,'17-slide-seed');
 const packEvent=page.waitForEvent('download');
 await page.locator('[data-ii12="export-notebook"]').first().click();
 const pack=await packEvent;
 assert.equal(pack.suggestedFilename(),'SELF_Shopify_2010_Research_Pack.md');
 const packText=fs.readFileSync(await pack.path(),'utf8');
 assert.ok(packText.includes('Shopify app ecosystem'));
 assert.ok(packText.includes('Independent Historical Re-Underwriting'));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.ii12-notebook-head').waitFor();
 assert.equal(await page.locator('[data-ii12-field="slideClaim"]').inputValue(),'Shopify can scale recurring revenues if merchant retention offsets SMB churn.');
 assert.match(await page.locator('.ii12-notebook-count').innerText(),/2/);
 checks.push('Phase 1.2 lesson, original-source reference, keyboard quiz, research capture, slide seed, export and reload');

 await click(page,'view','model');
 await page.locator('.ii13-page').waitFor();
 await screenshot(page,'21-financial-model');
 assert.match(await page.locator('.ii13-guide').innerText(),/Shopify.*2010|2010 HISTORICAL ANCHOR/s);
 assert.equal(await page.locator('.ii13-table tbody tr').count(),12);
 const beforeRevenue=await page.locator('#ii13-revenue').innerText();
 await page.locator('input[data-ii13-input="adds"]').fill('1100');
 const afterRevenue=await page.locator('#ii13-revenue').innerText();
 assert.notEqual(afterRevenue,beforeRevenue,'Editing new customer assumption should recalculate revenue');
 await page.locator('[data-ii13="scenario"][data-value="downside"]').click();
 const downsideMRR=await page.locator('.ii13-metric').nth(1).locator('strong').innerText();
 await page.locator('[data-ii13="scenario"][data-value="upside"]').click();
 const upsideMRR=await page.locator('.ii13-metric').nth(1).locator('strong').innerText();
 assert.notEqual(downsideMRR,upsideMRR,'Scenario choice should change projected ending MRR');
 await page.locator('[data-ii13="save-model"]').click();
 const modelSave=await page.evaluate(()=>JSON.parse(localStorage.getItem('self.investment.model.v13')||'{}'));
 assert.equal(modelSave.adds,1100);
 assert.equal(modelSave.snapshot.scenario,'upside');
 checks.push('Financial model live inputs, 12-month calculation, scenarios and snapshot save in Chromium');
 const csvEvent=page.waitForEvent('download');
 await page.locator('[data-ii13="export-csv"]').click();
 const csv=await csvEvent;assert.equal(csv.suggestedFilename(),'SELF_Shopify_2010_Analyst_Scenario.csv');
 assert.equal(fs.readFileSync(await csv.path(),'utf8').trim().split(/\r?\n/).length,13);
 const notesEvent=page.waitForEvent('download');
 await page.locator('[data-ii13="export-md"]').click();
 const notes=await notesEvent;
 const notesText=fs.readFileSync(await notes.path(),'utf8');
 assert.ok(notesText.includes('NOT actual 2011 Shopify numbers'));
 await page.locator('.ii13-stage[data-ii13="tab"][data-value="sensitivity"]').click();
 await page.locator('.ii13-sensitivity-table').waitFor();
 assert.equal(await page.locator('.ii13-sensitivity-table tbody tr').count(),3);
 await screenshot(page,'22-sensitivity-lab');
 await page.locator('.ii13-stage[data-ii13="tab"][data-value="challenge"]').click();
 const quizB=page.locator('[data-ii13="quiz"][data-value="B"]');
 await quizB.focus();await page.keyboard.press('Enter');
 await page.locator('[data-ii13="quiz-check"]').click();
 assert.match(await page.locator('.ii13-feedback').innerText(),/Benar/);
 const reasoning='The downside is customer churn and potentially high acquisition cost, so this projection needs cohort data and evidence before being used in an investment recommendation.';
 await page.locator('textarea[data-ii13-reasoning]').fill(reasoning);
 await page.locator('[data-ii13="save-reasoning"]').click();
 await screenshot(page,'23-model-challenge');
 await page.locator('.ii13-stage[data-ii13="tab"][data-value="model"]').click();
 await page.locator('[data-ii13="promote-model"]').click();
 await page.locator('.ii12-notebook-head').waitFor();
 assert.match(await page.locator('.ii12-notes-list').innerText(),/Analyst scenario \(NOT historical\): Upside/);
 const scenarioState=await page.evaluate(()=>JSON.parse(localStorage.getItem('self.investment.lab.v12')||'{}'));
 assert.equal(scenarioState.notes.find(n=>n.id==='model13-upside').kind,'assumption');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.ii12-notebook-head').waitFor();
 assert.match(await page.locator('.ii12-notes-list').innerText(),/Analyst scenario \(NOT historical\): Upside/);
 checks.push('Financial model CSV/Markdown export, sensitivity, keyboard exercise and assumption promotion survive reload');


 await page.setViewportSize({width:390,height:844});
 for(const [view,file] of [['home','06-academy-mobile'],['lesson','07-lesson-mobile'],['case','08-case-mobile'],['portfolio','09-portfolio-mobile'],['growth','18-growth-mobile'],['notebook','19-notebook-mobile'],['model','24-model-mobile']]){
  await click(page,'view',view);
  await page.waitForTimeout(120);
  await noOverflow(page,view+' mobile');
  await screenshot(page,file);
 }
 await page.setViewportSize({width:768,height:1024});
 for(const [view,file] of [['home','11-academy-tablet'],['lesson','12-lesson-tablet'],['case','13-case-tablet'],['portfolio','14-portfolio-tablet'],['notebook','20-notebook-tablet'],['model','25-model-tablet']]){
  await click(page,'view',view);
  await noOverflow(page,view+' tablet');
  await screenshot(page,file);
 }
 await page.setViewportSize({width:1280,height:800});
 await click(page,'view','home');
 await noOverflow(page,'Academy laptop 1280');
 await page.locator('#nav [data-page="more"]').click();
 assert.ok(await page.locator('.ii-entry-more').count());
 await page.locator('.ii-entry-more [data-page="investment"]').click();
 assert.ok(await page.locator('.ii-app').count());
 await page.locator('#nav [data-page="today"]').click();
 assert.ok(await page.locator('.ii-dashboard-entry').count());
 await page.locator('.ii-dashboard-entry [data-page="investment"]').click();
 assert.ok(await page.locator('.ii-hero').count());
 checks.push('Entry points and route navigation work with old SELF modules');
 assert.deepEqual(errs,[],'No uncaught browser errors');
 await context.close();
 const deny=await browser.newContext({viewport:{width:1100,height:800}});
 await deny.addInitScript(()=>{
  const old=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(key==='self.investment.academy.v1')throw new DOMException('blocked','QuotaExceededError');return old.call(this,key,value);};
 });
 const blocked=await deny.newPage();const deniedErrors=[];blocked.on('pageerror',e=>deniedErrors.push(e.message));
 await blocked.goto(BASE+'/#investment',{waitUntil:'domcontentloaded'});
 await blocked.locator('.ii-hero').waitFor();
 await click(blocked,'view','lesson');
 await click(blocked,'brief-done');
 await blocked.locator('.ii-alert').waitFor();
 assert.match(await blocked.locator('.ii-alert').innerText(),/Penyimpanan browser tidak tersedia/);
 assert.deepEqual(deniedErrors,[]);
 checks.push('Storage failure shows warning instead of falsely claiming success');
 await screenshot(blocked,'10-storage-warning');
 await deny.close();
 const report={ok:true,checkedAt:new Date().toISOString(),screenshots:25,checks};
 fs.writeFileSync(path.join(ART,'report.json'),JSON.stringify(report,null,2));
 console.log('PASS Chromium E2E Investment Intelligence — '+checks.length+' checks');
 checks.forEach(item=>console.log('  PASS '+item));
}
run().catch(err=>{
 fs.writeFileSync(path.join(ART,'failure.txt'),String(err.stack||err));
 console.error('FAIL Chromium E2E '+(err.stack||err));
 process.exitCode=1;
}).finally(async()=>{
 try{await browser?.close()}catch{}
 try{server?.kill('SIGTERM')}catch{}
});
