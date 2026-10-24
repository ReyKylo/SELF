/* Hunt › Dossier and Game Day in a real browser against a synthetic API:
   company dossier merges records, notes save with one PATCH, timeline rows open sources, Game Day phases from fixture times,
   track pick, reflection save, thank-you task only on button, Today "Reflect on", phone width. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id,ts='2026-10-01T00:00:00Z';
 const iso=ms=>new Date(Date.now()+ms).toISOString(),H=36e5,D=24*H;
 const id=(k,n)=>k+String(n).padStart(7,'0')+'-0000-4000-8000-000000000000';
 const db={
  career_companies:[{id:id('c',1),user_id:U,name:'Sample Capital',industry:'Private Equity',location:'Jakarta Selatan',website:'https://sample.example/',notes:'Fund III focus: consumer.',created_at:ts,updated_at:ts},{id:id('c',2),user_id:U,name:'Empty Co',industry:'',location:'',website:null,notes:'',created_at:ts,updated_at:ts}],
  career_people:[{id:id('p',1),user_id:U,full_name:'Sari Anindya',role_title:'Associate',company_id:id('c',1),email:'',profile_url:null,relationship_stage:'connected',last_contacted_at:null,notes:'',created_at:ts,updated_at:ts},{id:id('p',2),user_id:U,full_name:'No Touch',role_title:'VP',company_id:id('c',1),email:'',profile_url:null,relationship_stage:'new',last_contacted_at:null,notes:'',created_at:ts,updated_at:ts}],
  career_touchpoints:[{id:id('t',1),user_id:U,person_id:id('p',1),contact_at:iso(-4*D),channel:'message',summary:'Intro sent',next_step:'',created_at:ts}],
  career_applications:[{id:id('a',1),user_id:U,company_id:id('c',1),role_title:'Investment Analyst',hiring_stage:'interviewing',applied_at:iso(-20*D).slice(0,10),source_url:null,notes:'',created_at:ts,updated_at:ts}],
  career_interviews:[
   {id:id('i',1),user_id:U,application_id:id('a',1),title:'Upcoming round',scheduled_at:iso(3*D),format:'video',stage:'scheduled',prep_notes:'',reflection:'',created_at:ts,updated_at:ts},
   {id:id('i',2),user_id:U,application_id:id('a',1),title:'Past round',scheduled_at:iso(-2*D),format:'video',stage:'scheduled',prep_notes:'Track: PE',reflection:'',created_at:ts,updated_at:ts}],
  career_opportunities:[{id:id('o',1),user_id:U,company_name:'Sample Capital',role_title:'Associate',job_url:'https://sample.example/jobs/1',cluster:'Investment',posted_at:iso(-6*D),relevance_score:80,score_reason:'x',status:'saved',notes:'',created_at:ts,updated_at:ts}],
  career_task_links:[]
 };
 const writes=[];let seq=100;
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();
  if(m==='GET')return json(db[table]);
  const rid=url.searchParams.get('id')?.slice(3);
  if(m==='PATCH'){const row=db[table].find(r=>r.id===rid);const body=req.postDataJSON();writes.push({m,table,id:rid,body});Object.assign(row,body);return json([row])}
  if(m==='POST'){const body=req.postDataJSON();const row={id:id('z',++seq),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...body};writes.push({m,table,body});db[table].unshift(row);return json([row],201)}
  return route.fallback();
 });
 const noOverflow=async label=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d))};

 /* 1. Dossier from the Companies page */
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="hunt"]').click();await page.locator('.career-pills').waitFor();
 await page.locator('.career-pill[data-page="companies"]').click();
 await page.locator('.career-company-wrap',{hasText:'Sample Capital'}).locator('[data-dossier="open-dossier"]').click();
 await page.locator('[data-dossier-root]').waitFor();
 const txt=await page.locator('[data-dossier-root]').innerText();
 assert.match(txt,/Sample Capital/);assert.match(txt,/Investment Analyst/);assert.match(txt,/Sari Anindya/);assert.match(txt,/last touch 4d ago/);
 assert.doesNotMatch(await page.locator('.dossier-row',{hasText:'No Touch'}).innerText(),/last touch/,'no touchpoint, no last-touch claim');
 assert.match(txt,/Upcoming round/);assert.match(txt,/Past round/);
 assert.equal(await page.locator('.dossier-timeline li').count(),1+1+2+1,'touch, application, 2 interviews, radar');
 assert.equal(await page.locator('[data-dossier-notes]').inputValue(),'Fund III focus: consumer.');

 /* 2. notes: one PATCH */
 await page.locator('[data-dossier-notes]').fill('Fund III focus: consumer. Met MD in Aug.');
 assert.match(await page.locator('[data-dossier-note-state]').innerText(),/Unsaved/);
 await page.locator('[data-dossier="save-notes"]').click();await page.waitForTimeout(250);
 const np=writes.filter(w=>w.m==='PATCH'&&w.table==='career_companies');assert.equal(np.length,1);assert.equal(np[0].body.notes,'Fund III focus: consumer. Met MD in Aug.');
 assert.equal(await page.locator('[data-dossier-notes]').inputValue(),'Fund III focus: consumer. Met MD in Aug.');

 /* 3. timeline row opens its source */
 await page.locator('.dossier-timeline .dossier-row',{hasText:'Investment Analyst'}).click();
 await page.locator('.career-drawer').waitFor();assert.match(await page.locator('.career-drawer').innerText(),/Investment Analyst/);
 await page.keyboard.press('Escape');await page.locator('.career-drawer').waitFor({state:'detached'});

 /* 4. empty company still renders */
 await page.locator('[data-dossier="back"]').click();
 await page.locator('.career-company-wrap',{hasText:'Empty Co'}).locator('[data-dossier="open-dossier"]').click();await page.locator('[data-dossier-root]').waitFor();
 assert.match(await page.locator('[data-dossier-root]').innerText(),/No application yet/);
 assert.match(await page.locator('[data-dossier-root]').innerText(),/fills in as you log/);
 await page.locator('[data-dossier="back"]').click();

 /* 5. Game Day: upcoming = before, with track picker */
 await page.locator('.career-pill[data-page="interviews"]').click();
 await page.locator('.dossier-strip').waitFor();
 await page.locator('.dossier-strip .dossier-row',{hasText:'Upcoming round'}).locator('[data-dossier="gameday"]').click();
 await page.locator('.gameday').waitFor();
 assert.match(await page.locator('.dossier-phase.active').innerText(),/Before · now/);
 assert.match(await page.locator('.gameday').innerText(),/Pick the track/);
 await page.locator('[data-dossier="set-track"][data-track="VC"]').click();await page.waitForTimeout(300);
 const tp=writes.filter(w=>w.table==='career_interviews');assert.equal(tp.length,1);assert.equal(tp[0].body.prep_notes,'Track: VC');
 assert.equal(await page.locator('.dossier-questions li').count(),5);
 assert.match(await page.locator('.gameday').innerText(),/Nothing here is scored/);
 /* timer */
 await page.locator('[data-dossier="timer"]').click();await page.waitForTimeout(1300);
 assert.notEqual(await page.locator('[data-dossier-clock]').innerText(),'00:00');
 await page.locator('[data-dossier="timer"]').click();await page.locator('[data-dossier="timer-reset"]').click();
 assert.equal(await page.locator('[data-dossier-clock]').innerText(),'00:00');
 await noOverflow('game day before');

 /* 6. Past round: after phase, reflection, thank-you only on press */
 await page.locator('[data-dossier="gd-back"]').click();
 await page.locator('.dossier-strip .dossier-row',{hasText:'Past round'}).locator('[data-dossier="gameday"]').click();await page.locator('.gameday').waitFor();
 assert.match(await page.locator('.dossier-phase.active').innerText(),/After · now/);
 assert.equal(await page.locator('[data-dossier-reflection]').count(),1);
 const before=writes.length;
 await page.locator('[data-dossier-reflection]').fill('Asked about LBO; fumbled debt sizing.');
 await page.locator('[data-dossier="save-reflection"]').click();await page.waitForTimeout(300);
 const rp=writes.filter(w=>w.table==='career_interviews'&&'reflection' in w.body);assert.equal(rp.length,1);assert.equal(rp[0].body.reflection,'Asked about LBO; fumbled debt sizing.');
 assert.equal(writes.slice(before).filter(w=>w.table==='tasks').length,0,'no task until the button');
 await page.locator('[data-dossier="thanks"]').click();await page.waitForTimeout(400);
 assert.equal(fixture.tasks.filter(t=>/Thank-you note/.test(t.title)).length,1);
 const link=writes.filter(w=>w.table==='career_task_links');assert.equal(link.length,1);assert.equal(link[0].body.application_id,id('a',1));
 /* switching phase view is read-only */
 await page.locator('[data-dossier="phase"][data-phase="before"]').click();assert.match(await page.locator('.gameday').innerText(),/Practice questions/);

 /* 7. Today: Reflect item gone after reflection; shows for another unreflected past interview */
 db.career_interviews.push({id:id('i',3),user_id:U,application_id:id('a',1),title:'Older round',scheduled_at:iso(-5*D),format:'video',stage:'scheduled',prep_notes:'',reflection:'',created_at:ts,updated_at:ts});
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="hunt"]').click();await page.locator('.career-pills').waitFor();
 await page.locator('.rooms-rail .door[data-room="today"]').click();
 await page.locator('.agenda-item',{hasText:'Reflect on Older round'}).waitFor();
 assert.equal(await page.locator('.agenda-item',{hasText:'Reflect on Past round'}).count(),0,'already reflected');

 /* 8. phone width */
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-room="hunt"]:visible').first().click();
 await page.locator('.career-pill[data-page="companies"]').click();
 await page.locator('.career-company-wrap',{hasText:'Sample Capital'}).locator('[data-dossier="open-dossier"]').click();await page.locator('[data-dossier-root]').waitFor();
 await noOverflow('dossier at 390');

 assert.deepEqual(errors.filter(e=>!/favicon|fonts/.test(e)),[],'no console errors');
 await x.browser.close();console.log('browser_dossier: ok');
})().catch(e=>{console.error(e);process.exit(1)});
