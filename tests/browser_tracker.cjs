/* Hunt › Tracker in a real browser against a synthetic API: capture, duplicates, views, filters, drawer + activity log, next step, drop, done, delayed delete + Undo, phone width. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture}=x;
 const U=fixture.user.id,ts='2026-10-01T00:00:00Z';
 const cid='c0000001-0000-4000-8000-000000000000';
 const db={
  career_companies:[{id:cid,user_id:U,name:'Sample Capital',industry:'PE fund',location:'Jakarta',website:'https://sample.example/',notes:'',created_at:ts,updated_at:ts}],
  career_people:[],career_applications:[],career_touchpoints:[],
  career_tracks:[],career_track_events:[]
 };
 const writes=[];let seq=0;
 await context.route('https://www.linkedin.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<title>stub</title>'}));
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();
  const rid=url.searchParams.get('id')?.slice(3),tid=url.searchParams.get('track_id')?.slice(3);
  if(m==='GET')return json(tid?db[table].filter(r=>r.track_id===tid):db[table]);
  if(m==='PATCH'){const row=db[table].find(r=>r.id===rid);const body=req.postDataJSON();writes.push({m,table,id:rid,body});Object.assign(row,body);return json([row])}
  if(m==='POST'){const body=req.postDataJSON();const now=new Date().toISOString();const row={id:'t'+String(++seq).padStart(7,'0')+'-0000-4000-8000-000000000000',created_at:now,updated_at:now,last_activity_at:now,status:'inbox',kind:'other',source:'website',title:'',company_name:'',industry:'',location:'',close_reason:'',next_step:'',notes:'',next_due:null,deadline:null,...body};writes.push({m,table,body});db[table].unshift(row);return json([row],201)}
  if(m==='DELETE'){writes.push({m,table,id:rid});db[table]=db[table].filter(r=>r.id!==rid);return json([])}
  return route.fallback();
 });
 let popups=[];context.on('page',p=>{if(p!==page)popups.push(p)});
 const noOverflow=async label=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d))};
 const settle=()=>page.waitForTimeout(250);
 const row=t=>page.locator('.tracker-row',{hasText:t});
 const tab=v=>page.locator('.tracker-tab[data-value="'+v+'"]');
 const capture=async text=>{await page.locator('#tracker-capture').fill(text);await page.locator('#tracker-capture').press('Enter');await settle()};
 const count=async v=>+(await tab(v).locator('.tracker-count').innerText());
 const today=new Date().toLocaleDateString('en-CA');

 /* 1. Tracker is the first Hunt pill and the default page; empty state */
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="hunt"]').click();await page.locator('.career-pills').waitFor();
 assert.deepEqual(await page.locator('.career-pills .career-pill').allInnerTexts(),['Tracker','Overview','Pipeline','Outreach','Companies','Radar','Interviews','Kit','Career Prep →']);
 assert.equal(await page.locator('.career-pill.active').innerText(),'Tracker');
 await page.locator('.tracker').waitFor();
 assert.match(await page.locator('.tracker-empty').innerText(),/Paste your first link/);

 /* 2. capture: one Enter, no other input, lands in the Inbox with the detected source and a company guess */
 await capture('https://id.linkedin.com/jobs/view/analyst-at-northstar-3812345678/?trackingId=abc');
 assert.equal(await count('inbox'),1);
 let r=row('linkedin.com/jobs/view/3812345678');assert.equal(await r.count(),1);
 assert.match(await r.innerText(),/LinkedIn Jobs/);assert.match(await r.innerText(),/Not processed yet/);
 let post=writes.find(w=>w.table==='career_tracks'&&w.m==='POST');
 assert.equal(post.body.url,'https://www.linkedin.com/jobs/view/3812345678');assert.equal(post.body.source,'linkedin_jobs');assert.equal(post.body.kind,'job');assert.equal(post.body.status,'inbox');
 assert.equal(writes.filter(w=>w.table==='career_track_events'&&w.m==='POST')[0].body.kind,'created');
 assert.equal(await page.locator('#tracker-capture').inputValue(),'','capture bar is cleared');

 /* 3. a multi-link block makes one row per link, matches a company by website domain, and inherits its industry */
 await capture('cek ini https://www.jobstreet.co.id/id/job/12345?utm_source=x\nhttps://careers.sample.example/analyst\nhttps://www.jobstreet.co.id/id/job/12345');
 assert.equal(await count('inbox'),3,'duplicate inside the block is dropped');
 r=row('careers.sample.example');assert.match(await r.innerText(),/Sample Capital/);assert.match(await r.innerText(),/Careers page/);assert.match(await r.innerText(),/Private Equity/);
 assert.equal(db.career_tracks.find(t=>t.url.includes('careers.sample.example')).company_id,cid);
 assert.deepEqual(await page.locator('.tracker-chips button').allInnerTexts(),['All industries','Private Equity','No industry']);

 /* 4. duplicate: no new row, existing one highlighted and named */
 const before=db.career_tracks.length;
 await capture('https://www.linkedin.com/jobs/search/?currentJobId=3812345678&utm_campaign=z');
 assert.equal(db.career_tracks.length,before);assert.equal(await page.locator('.tracker-row.hl').count(),1);
 assert.match(await page.locator('.tracker-row.hl').innerText(),/linkedin\.com\/jobs\/view\/3812345678/);
 assert.match(await page.locator('.toast').innerText(),/Already tracked/);

 /* 5. industry chip filters; clicking it again clears */
 await page.locator('.tracker-chip',{hasText:'Private Equity'}).click();
 assert.equal(await page.locator('.tracker-row').count(),1,'only the company-matched row is Private Equity');
 await page.locator('.tracker-chip',{hasText:'Private Equity'}).click();assert.equal(await page.locator('.tracker-row').count(),3,'clicking again clears');
 await page.locator('.tracker-chip',{hasText:'No industry'}).click();assert.equal(await page.locator('.tracker-row').count(),2);
 await page.locator('.tracker-chip',{hasText:'All industries'}).click();

 /* 6. a title opens the link in a new tab and does not open the drawer */
 await tab('inbox').click();
 const [pop]=await Promise.all([context.waitForEvent('page'),row('3812345678').locator('a.tracker-title').click()]);await pop.waitForLoadState().catch(()=>{});
 assert.match(pop.url(),/linkedin\.com\/jobs\/view\/3812345678/);await pop.close();popups=[];
 assert.equal(await page.locator('.tracker-drawer').count(),0);
 assert.equal(await row('3812345678').locator('a.tracker-title').getAttribute('rel'),'noopener noreferrer');

 /* 7. the drawer: set title + next step due today → Inbox row becomes Active and appears in Today; the activity log records it */
 writes.length=0;
 await row('3812345678').locator('.tracker-main').click();await page.locator('.tracker-drawer').waitFor();
 await page.locator('.tracker-drawer [name="title"]').fill('Analyst Intern');
 await page.locator('.tracker-drawer [name="company_name"]').fill('Northstar');
 await page.locator('.tracker-drawer [name="next_step"]').fill('Send CV');
 await page.locator('.tracker-drawer [name="next_due"]').fill(today);
 await page.locator('[data-tracker="save"]').click();await settle();
 const patch=writes.find(w=>w.m==='PATCH'&&w.table==='career_tracks');
 assert.equal(patch.body.status,'active');assert.equal(patch.body.next_step,'Send CV');assert.equal(patch.body.next_due,today);assert.ok(patch.body.last_activity_at);
 assert.ok(writes.filter(w=>w.table==='career_track_events').length>=2,'status and next step are both logged');
 assert.equal(await page.locator('.tracker-drawer').count(),0);
 assert.equal(await count('inbox'),2);assert.equal(await count('today'),1);
 await tab('today').click();assert.match(await row('Analyst Intern').innerText(),/Next: Send CV · today/);
 await row('Analyst Intern').locator('.tracker-main').click();
 await page.locator('.tracker-log li').first().waitFor();
 const log=await page.locator('.tracker-log li').allInnerTexts();assert.ok(log.some(l=>/Status Inbox → Active/.test(l)));assert.ok(log.some(l=>/Next step: Send CV/.test(l)));assert.ok(log.some(l=>/Added to Inbox from LinkedIn Jobs/.test(l)));
 await page.keyboard.press('Escape');assert.equal(await page.locator('.tracker-drawer').count(),0);

 /* 8. Touched it logs without changing anything else */
 writes.length=0;await row('Analyst Intern').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="touched"]').click();await settle();
 assert.deepEqual(Object.keys(writes.find(w=>w.m==='PATCH').body).sort(),['last_activity_at','updated_at'],'only the activity time changes');
 assert.equal(writes.find(w=>w.table==='career_track_events').body.kind,'touched');

 /* 9. Drop with a one-tap reason: leaves Today/Inbox/Stale, visible in All with the reason */
 await tab('inbox').click();writes.length=0;
 await row('jobstreet.co.id').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="close-drop"]').click();
 await page.locator('.tracker-chip',{hasText:'No Indonesia office'}).click();await settle();
 const dropped=writes.find(w=>w.m==='PATCH');assert.equal(dropped.body.status,'dropped');assert.equal(dropped.body.close_reason,'No Indonesia office');
 assert.equal(await count('inbox'),1);
 await tab('all').click();assert.match(await row('jobstreet.co.id').innerText(),/Dropped: No Indonesia office/);
 await page.locator('.tracker-selects select').nth(2).selectOption('dropped');assert.equal(await page.locator('.tracker-row').count(),1);
 await page.locator('.tracker-selects select').nth(2).selectOption('');

 /* 10. Mark done with a custom outcome, then Reopen */
 writes.length=0;await row('Analyst Intern').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="close-done"]').click();
 await page.locator('[data-tracker-close-text]').fill('Applied via referral');await page.locator('[data-tracker="close-text"]').click();await settle();
 assert.equal(writes.find(w=>w.m==='PATCH').body.close_reason,'Applied via referral');
 assert.match(await row('Analyst Intern').innerText(),/Done: Applied via referral/);assert.equal(await count('today'),0,'done rows leave Today');
 await row('Analyst Intern').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="reopen"]').click();await settle();
 assert.match(await row('Analyst Intern').locator('.tracker-dot').getAttribute('class'),/s-active/);

 /* 11. Delete is delayed: Undo sends no DELETE; letting the window pass sends exactly one */
 writes.length=0;await tab('all').click();const n0=await page.locator('.tracker-row').count();
 await row('careers.sample.example').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="delete"]').click();
 assert.equal(await page.locator('.tracker-row').count(),n0-1);assert.match(await page.locator('.outreach-undo').innerText(),/Deleted/);
 await page.locator('[data-tracker="undo-delete"]').click();assert.equal(await page.locator('.tracker-row').count(),n0);
 await page.waitForTimeout(500);assert.equal(writes.filter(w=>w.m==='DELETE').length,0,'Undo sent no request');
 await row('careers.sample.example').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="delete"]').click();
 await page.waitForTimeout(10600);
 assert.equal(writes.filter(w=>w.m==='DELETE').length,1);assert.equal(writes.find(w=>w.m==='DELETE').table,'career_tracks');
 assert.equal(await page.locator('.tracker-row').count(),n0-1);
 /* leaving the page settles a pending delete at once */
 writes.length=0;await row('Analyst Intern').locator('.tracker-more').click();await page.locator('.tracker-menu [data-tracker="delete"]').click();
 await page.locator('.career-pill[data-page="overview"]').click();await settle();
 assert.equal(writes.filter(w=>w.m==='DELETE').length,1);

 /* 12. Stale view: an old row appears and orders by oldest touch */
 db.career_tracks.push({id:'tstale001-0000-4000-8000-000000000000',user_id:U,url:'https://old.example/careers',kind:'job',source:'company_site',title:'Old lead',company_name:'Old Co',company_id:null,industry:'',location:'',status:'active',close_reason:'',next_step:'',next_due:null,deadline:null,notes:'',person_id:null,application_id:null,last_activity_at:'2026-08-01T00:00:00Z',created_at:'2026-08-01T00:00:00Z',updated_at:'2026-08-01T00:00:00Z'});
 await page.reload();await page.locator('.rooms-rail .door[data-room="hunt"]').click();await page.locator('.tracker').waitFor();
 await tab('stale').click();assert.equal(await page.locator('.tracker-row').count(),1);assert.match(await page.locator('.tracker-row').innerText(),/Old lead/);
 assert.match(await page.locator('.tracker-row .tracker-age').innerText(),/mo ago|d ago/);
 assert.equal(await page.locator('[data-tracker-stale]').inputValue(),'14');

 /* 13. phone width: no horizontal overflow, drawer is full width */
 await page.setViewportSize({width:390,height:844});await settle();await noOverflow('tracker list');
 await tab('all').click();await page.locator('.tracker-row').first().locator('.tracker-main').click();await page.locator('.tracker-drawer').waitFor();
 await noOverflow('drawer');assert.ok((await page.locator('.tracker-drawer').boundingBox()).width<=390);
 await page.keyboard.press('Escape');

 await x.browser.close();
 console.log('PASS Tracker browser: capture, duplicates, company match, industry filter, drawer + log, next step, Touched it, drop, done, reopen, delayed delete + Undo, stale, 390px.');
 
})().catch(err=>{console.error(err);process.exit(1)});
