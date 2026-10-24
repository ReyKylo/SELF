/* Hunt and Study rooms in a real browser against a synthetic API: pills, Kit, pipeline summary, Needs a touch, grouped Career Prep tabs, classic shell. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const ago=n=>new Date(Date.now()-n*864e5).toLocaleDateString('en-CA');
 const U=fixture.user.id,ts='2026-10-01T00:00:00Z';
 const co=id=>'c'+id+'000000-0000-4000-8000-000000000000';
 const companies=[{id:co(1),user_id:U,name:'Sample Sponsor',industry:'',location:'',notes:'',created_at:ts,updated_at:ts}];
 const stage=(n,s)=>({id:'a'+n+'000000-0000-4000-8000-000000000000',user_id:U,company_id:co(1),role_title:'Role '+n,hiring_stage:s,notes:'',created_at:ts,updated_at:'2026-10-0'+n+'T00:00:00Z'});
 const apps=[stage(1,'wishlist'),stage(2,'wishlist'),stage(3,'applied'),stage(4,'applied'),stage(5,'applied'),stage(6,'interviewing'),stage(7,'closed')]; // submitted = 5
 const person=(n,name,st,last)=>({id:'p'+n+'000000-0000-4000-8000-000000000000',user_id:U,full_name:name,role_title:'Associate',company_id:co(1),email:'',profile_url:null,relationship_stage:st,last_contacted_at:last,notes:'',created_at:ts,updated_at:ts});
 const people=[person(1,'Sari','in_conversation',ago(19)),person(2,'Dimas','reached_out',ago(3)),person(3,'Rara','new',null),person(4,'Ayu','maintain',ago(80)),person(5,'Bima','in_conversation',null)];
 const touchpoints=[{id:'t1000000-0000-4000-8000-000000000000',user_id:U,person_id:people[2].id,contact_at:ago(2),channel:'message',summary:'Intro chat',next_step:'Send thanks',created_at:ts,updated_at:ts}];
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),json=o=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(req.method()==='GET'){
   if(table==='career_companies')return json(companies);if(table==='career_applications')return json(apps);
   if(table==='career_people')return json(people);if(table==='career_touchpoints')return json(touchpoints);
  }
  return route.fallback();
 });
 const current=()=>page.locator('.door[aria-current="page"]:visible').getAttribute('data-room');
 const noOverflow=async label=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d))};

 /* 1. Hunt: pills replace the rail; the heading stays for assistive tech and tests */
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="hunt"]').click();
 await page.locator('.career-pills').waitFor();assert.equal(await current(),'hunt');
 assert.deepEqual(await page.locator('.career-pills .career-pill').allInnerTexts(),['Overview','Pipeline','Outreach','Companies','Radar','Interviews','Kit','Career Prep →']);
 assert.equal(await page.locator('.career-rail').count(),0,'no second sidebar inside Hunt');
 assert.equal(await page.locator('.career-workspace h2.sr-only').innerText(),'CAREER STUDIO');
 assert.equal(await page.locator('.career-pill.active').innerText(),'Overview');

 /* 2. Pipeline: counts per stage and each stage's share of submitted applications, never a fake conversion rate */
 await page.locator('.career-pill[data-page="applications"]').click();await page.locator('.career-kpis').waitFor();
 const kpis=await page.locator('.career-kpi').evaluateAll(n=>n.map(e=>({label:e.querySelector('span').textContent,n:e.querySelector('b').textContent,share:e.querySelector('small').textContent})));
 assert.deepEqual(kpis,[{label:'Wishlist',n:'2',share:''},{label:'Applied',n:'3',share:'60% of submitted'},{label:'Interviewing',n:'1',share:'20% of submitted'},{label:'Offer',n:'0',share:''},{label:'Closed',n:'1',share:'20% of submitted'}]);
 assert.ok(await page.locator('[data-dnd-zone="stage:wishlist"] [data-dnd-item]').count(),'pipeline Kanban still renders below the summary');

 /* A plain click on a card title still opens the application: the drag grip must not cover it (it once did) */
 const title=page.locator('[data-dnd-zone="stage:applied"] .career2-job > button[data-career2="open-application"]').first();
 const tb=await title.boundingBox();
 assert.equal(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.closest('[data-career2="open-application"]')?!!document.elementFromPoint(x,y).closest('[data-career2="open-application"]'):false,[tb.x+20,tb.y+tb.height/2]),true,'the title, not the grip, is under the pointer');
 const gb=await page.locator('[data-dnd-zone="stage:applied"] .career2-job > .grip').first().boundingBox();assert.ok(gb.width<=40&&gb.height<=40,'grip is a small handle: '+gb.width+'x'+gb.height);
 await page.mouse.click(tb.x+20,tb.y+tb.height/2);await page.locator('.career-drawer').waitFor();
 assert.match(await page.locator('.career-drawer h2').first().innerText(),/Role \d/);await page.keyboard.press('Escape');await page.locator('.career-drawer').waitFor({state:'detached'});

 /* 3. Kit: one pill, three tabs */
 await page.locator('.career-pill[data-page="cvs"]').click();await page.locator('.career-kit-tabs').waitFor();
 assert.equal(await page.locator('.career-pill.active').innerText(),'Kit');
 await page.locator('.career-kit-tab[data-page="templates"]').click();
 assert.equal(await page.locator('.career-kit-tab.active').innerText(),'Templates');assert.equal(await page.locator('.career-pill.active').innerText(),'Kit','Kit stays active on its sub-pages');
 await page.locator('.career-kit-tab[data-page="reminders"]').click();assert.equal(await page.locator('.career-kit-tab.active').innerText(),'Reminders');

 /* 4. People: Needs a touch lists real reasons only */
 await page.locator('.career-pill[data-page="people"]').click();await page.locator('.career-touch').waitFor();
 const rows=await page.locator('.career-touch-row').evaluateAll(n=>n.map(e=>({name:e.querySelector('strong').textContent,note:e.querySelector('small').textContent,days:e.querySelector('.career-days')?.textContent||''})));
 assert.deepEqual(rows.map(r=>r.name),['Rara','Sari'],'next step first, then stale: Dimas (3d), Ayu (maintain) and Bima (no contact logged) are not listed');
 assert.equal(rows[0].note,'Next step · Send thanks');assert.equal(rows[0].days,'2d');assert.equal(rows[1].note,'Last contact 19 days ago');
 assert.equal(await page.locator('.career-touch-row .career-days.warn').count(),1,'19 days is amber');
 await page.locator('.career-touch-row').first().click();await page.locator('.career-drawer').waitFor();
 assert.match(await page.locator('.career-drawer h2').first().innerText(),/Rara/);
 await page.keyboard.press('Escape');

 /* 5. Career Prep → opens the Study room */
 await page.locator('.career-pill-link').click();await page.locator('.learning-workspace').waitFor();
 assert.equal(await current(),'study');assert.equal(await page.locator('.career-pills').count(),0,'Study has no Hunt pills');
 const groups=await page.locator('.learning-tab-group').evaluateAll(n=>n.map(g=>({label:g.querySelector('.learning-tab-label').textContent,tabs:[...g.querySelectorAll('[data-learning="tab"]')].map(b=>b.dataset.tab)})));
 assert.deepEqual(groups,[{label:'Build',tabs:['sprint','analystlab','vclab','consultlab']},{label:'Learn',tabs:['masterclass','evidence','videos','sources']},{label:'Get challenged',tabs:['director','worksample']}]);
 for(const tab of groups.flatMap(g=>g.tabs)){await page.locator('[data-learning="tab"][data-tab="'+tab+'"]').click();assert.equal(await page.locator('[data-learning="tab"][data-tab="'+tab+'"]').getAttribute('aria-pressed'),'true',tab)}
 await page.locator('.rooms-rail .door[data-room="hunt"]').click();assert.equal(await page.locator('.career-pill.active').innerText(),'Overview','Hunt door leaves the learning page');
 await page.locator('.rooms-rail .door[data-room="study"]').click();await page.locator('.learning-workspace').waitFor();assert.equal(await current(),'study');

 /* 6. Phone, 150% text, wide fallback font: pills scroll inside their own row and the page never widens */
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.id='__font';s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});
 await noOverflow('Study');
 await page.locator('.rooms-bar .door[data-room="hunt"]').click();await page.locator('.career-pills').waitFor();await noOverflow('Hunt overview');
 for(const p of ['applications','people','cvs','radar','interviews']){await page.locator('.career-pill[data-page="'+p+'"]').click();await page.waitForTimeout(120);await noOverflow('Hunt '+p)}
 assert.ok(await page.locator('.career-pills').evaluate(n=>n.scrollWidth>n.clientWidth),'the pill row scrolls on its own');
 await page.evaluate(()=>{document.getElementById('__font').remove();document.documentElement.style.removeProperty('--scale')});

 /* 7. Classic shell is untouched: rail, no pills, grouped tabs still usable */
 await page.setViewportSize({width:1366,height:768});
 await page.goto(x.base+'/?shell=classic');await page.locator('[data-action="nav"][data-view="career"]:visible').first().click();
 await page.locator('.career-rail').waitFor();assert.equal(await page.locator('.career-pills').count(),0);assert.ok(await page.locator('.career-mobile-sections').count(),'classic keeps its mobile section row');
 await page.locator('[data-career="page"][data-page="learning"]:visible').first().click();await page.locator('.learning-tab-group').first().waitFor();
 assert.equal(await page.locator('[data-learning="tab"]:visible').count(),10);

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Hunt/Study browser: pills replace the rail, pipeline summary with honest shares, Kit tabs, Needs a touch (next steps then stale, nothing invented), Career Prep opens Study, ten tabs in three groups all reachable, 390px/150%/wide-font without overflow, classic shell intact');
})().catch(e=>{console.error(e);process.exit(1)});
