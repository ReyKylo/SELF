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
 await click(page,'quiz-choice','B');
 assert.ok(await page.locator('[data-ii="quiz-choice"][data-val="B"]').getAttribute('class').then(v=>v.includes('is-selected')));
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
 await page.setViewportSize({width:390,height:844});
 for(const [view,file] of [['home','06-academy-mobile'],['lesson','07-lesson-mobile'],['case','08-case-mobile'],['portfolio','09-portfolio-mobile']]){
  await click(page,'view',view);
  await page.waitForTimeout(120);
  await noOverflow(page,view+' mobile');
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
 const report={ok:true,checkedAt:new Date().toISOString(),screenshots:10,checks};
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
