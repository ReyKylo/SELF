/* Hunt › Outreach in a real browser against a synthetic API: overview, per-company board, card opens LinkedIn, drag moves stage (and never opens the link),
   log + Undo, paste links, Let go, composer, CSV import, keyboard, phone width. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id,ts='2026-10-01T00:00:00Z';
 const ago=n=>new Date(Date.now()-n*864e5).toLocaleDateString('en-CA');
 const id=(k,n)=>k+String(n).padStart(7,'0')+'-0000-4000-8000-000000000000';
 const db={
  career_companies:[{id:id('c',1),user_id:U,name:'Sample Capital',industry:'Private Equity',location:'Jakarta Selatan',website:'https://sample.example/',notes:'',created_at:ts,updated_at:ts},{id:id('c',2),user_id:U,name:'Contoh Ventures',industry:'Venture Capital',location:'Jakarta',website:null,notes:'',created_at:ts,updated_at:ts}],
  career_people:[],career_touchpoints:[]
 };
 const P=(n,name,role,stage,url,last)=>({id:id('p',n),user_id:U,full_name:name,role_title:role,company_id:id('c',1),email:'',profile_url:url,relationship_stage:stage,last_contacted_at:last||null,notes:'',created_at:ts,updated_at:'2026-10-2'+n+'T00:00:00Z'});
 db.career_people.push(P(1,'Sari Anindya','Associate','new','https://www.linkedin.com/in/sari-anindya/'),P(2,'Hendra Wijaya','Vice President','new',null),P(3,'Dimas Prakoso','Analyst','connect_sent','https://www.linkedin.com/in/dimas-prakoso-55aa10/',ago(16)),P(4,'Rina Wulandari','VP, Investments','connected','https://www.linkedin.com/in/rina-wulandari/',ago(3)),P(5,'Ayu Lestari','Associate','in_conversation','https://www.linkedin.com/in/ayu-lestari/',ago(5)));
 const writes=[];let seq=100;
 await context.route('https://www.linkedin.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<title>LinkedIn stub</title>'}));
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();
  if(m==='GET')return json(db[table]);
  const rid=url.searchParams.get('id')?.slice(3);
  if(m==='PATCH'){const row=db[table].find(r=>r.id===rid);const body=req.postDataJSON();writes.push({m,table,id:rid,body});Object.assign(row,body);db[table].splice(db[table].indexOf(row),1);db[table].unshift(row);return json([row])}
  if(m==='POST'){const body=req.postDataJSON();const row={id:id(table==='career_people'?'p':table==='career_companies'?'c':'t',++seq),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...body};writes.push({m,table,body});db[table].unshift(row);return json([row],201)}
  if(m==='DELETE'){writes.push({m,table,id:rid});db[table]=db[table].filter(r=>r.id!==rid);return json([])}
  return route.fallback();
 });
 let popups=[];context.on('page',p=>{if(p!==page)popups.push(p)});
 const noOverflow=async label=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d))};
 const card=name=>page.locator('.outreach-card',{hasText:name});
 const lane=k=>page.locator('.outreach-lane[data-stage="'+k+'"]');
 const settle=async()=>{await page.waitForTimeout(250)};

 /* 1. overview */
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="hunt"]').click();await page.locator('.career-pills').waitFor();
 assert.deepEqual(await page.locator('.career-pills .career-pill').allInnerTexts(),['Overview','Pipeline','Outreach','Companies','Radar','Interviews','Kit','Career Prep →']);
 await page.locator('.career-pill[data-page="people"]').click();await page.locator('.outreach').waitFor();
 assert.equal(await page.locator('.career-pill.active').innerText(),'Outreach');
 let rows=await page.locator('.outreach>.outreach-list>.outreach-row strong').allInnerTexts();assert.deepEqual(rows,['Sample Capital'],'only companies with people are listed first');
 assert.match(await page.locator('.outreach>.outreach-list>.outreach-row .outreach-counts').first().innerText(),/Found 2 · Connect sent 1 · Connected 1 · Talking 1/);
 assert.match(await page.locator('.outreach>.outreach-list>.outreach-row .outreach-need').first().innerText(),/2 need you/,'Dimas pending 16d and Rina connected 3d');
 assert.equal(await page.locator('.outreach-more-list summary').innerText(),'1 company with no people yet');

 /* 2. board */
 await page.locator('.outreach-row',{hasText:'Sample Capital'}).click();await page.locator('.outreach-board').waitFor();
 assert.deepEqual(await page.locator('.outreach-lane-head strong').evaluateAll(n=>n.map(e=>e.textContent)),['Found','Connect sent','Connected','Approached','Talking']);
 assert.equal(await lane('new').locator('.outreach-card').count(),2);
 const sari=card('Sari Anindya');
 assert.equal(await sari.locator('a.outreach-link').getAttribute('href'),'https://www.linkedin.com/in/sari-anindya/');
 assert.equal(await sari.locator('a.outreach-link').getAttribute('rel'),'noopener noreferrer');
 assert.equal(await card('Hendra Wijaya').locator('a.outreach-link').count(),0,'no link yet means no anchor');
 assert.match(await card('Hendra Wijaya').innerText(),/Add link/);assert.match(await card('Hendra Wijaya').innerText(),/Senior/);assert.match(await card('Dimas').innerText(),/Pending 16d: wait or withdraw/);assert.match(await card('Rina').innerText(),/Approach now/);
 assert.equal(await page.locator('.outreach-find a').count(),3,'three LinkedIn search links without a campus');
 assert.match(await page.locator('.outreach-find a').first().getAttribute('href'),/keywords=%22Sample%20Capital%22%20analyst$/);

 /* 3. a click opens LinkedIn in a new tab */
 const [pop]=await Promise.all([context.waitForEvent('page'),sari.locator('a.outreach-link').click()]);await pop.waitForLoadState().catch(()=>{});
 assert.match(pop.url(),/linkedin\.com\/in\/sari-anindya/);await pop.close();popups=[];assert.equal(writes.length,0,'a click is not a stage change');

 /* 4. drag Sari → Connect sent: one PATCH, one touchpoint, no popup */
 const drag=async(name,to)=>{const b=await card(name).boundingBox(),t=await lane(to).boundingBox();
  await page.mouse.move(b.x+60,b.y+25);await page.mouse.down();await page.mouse.move(b.x+75,b.y+40,{steps:3});await page.mouse.move(t.x+t.width/2,t.y+110,{steps:10});await page.mouse.up();await settle()};
 await drag('Sari Anindya','connect_sent');
 const patches=writes.filter(w=>w.m==='PATCH');assert.equal(patches.length,1);assert.equal(patches[0].table,'career_people');assert.equal(patches[0].body.relationship_stage,'connect_sent');assert.ok(patches[0].body.last_contacted_at);
 const posts=writes.filter(w=>w.m==='POST');assert.equal(posts.length,1);assert.equal(posts[0].table,'career_touchpoints');assert.match(posts[0].body.summary,/^LinkedIn connection request sent/);assert.equal(posts[0].body.channel,'message');assert.equal(posts[0].body.next_step,'');
 assert.equal(popups.length,0,'dragging never opens the profile');
 assert.equal(await lane('connect_sent').locator('.outreach-card',{hasText:'Sari Anindya'}).count(),1);
 assert.match(await page.locator('.outreach-undo').innerText(),/Sari Anindya → Connect sent/);

 /* 5. Undo restores the stage and removes the log */
 writes.length=0;await page.locator('[data-outreach="undo"]').click();await settle();
 assert.equal(writes.filter(w=>w.m==='PATCH')[0].body.relationship_stage,'new');assert.equal(writes.filter(w=>w.m==='DELETE')[0].table,'career_touchpoints');
 assert.equal(await lane('new').locator('.outreach-card',{hasText:'Sari Anindya'}).count(),1);assert.equal(db.career_touchpoints.length,0);

 /* 6. Connected → Approached sets a follow-up next step */
 writes.length=0;await drag('Rina Wulandari','reached_out');
 assert.equal(writes.find(w=>w.m==='PATCH').body.relationship_stage,'reached_out');
 assert.equal(writes.find(w=>w.m==='POST').body.next_step,'Follow up once if no reply (7 days)');

 /* 7. paste links */
 await page.locator('[data-outreach="paste-toggle"]').click();
 await page.locator('#outreach-paste-in').fill('Dari search:\nhttps://id.linkedin.com/in/Putri-Handayani-7b21a9c/?originalSubdomain=id\nhttps://www.linkedin.com/in/raka-mahendra\nlinkedin.com/in/DIMAS-PRAKOSO-55AA10/\nhttps://www.linkedin.com/company/northstar');
 await page.locator('[data-outreach="preview"]').click();
 assert.equal(await page.locator('.outreach-prev li:not(.dup)').count(),2);assert.equal(await page.locator('.outreach-prev li.dup').count(),2);
 assert.match(await page.locator('.outreach-prev').innerText(),/Already in Sample Capital · Connect sent: Dimas Prakoso/);assert.match(await page.locator('.outreach-prev').innerText(),/name from link, check it/);
 assert.equal(await page.locator('[data-outreach="add-paste"]').innerText(),'Add 2 to Found');
 writes.length=0;await page.locator('[data-outreach="add-paste"]').click();await settle();
 const added=writes.filter(w=>w.m==='POST'&&w.table==='career_people').map(w=>w.body);
 assert.deepEqual(added.map(a=>a.profile_url).sort(),['https://www.linkedin.com/in/putri-handayani-7b21a9c/','https://www.linkedin.com/in/raka-mahendra/']);
 assert.ok(added.every(a=>a.company_id===id('c',1)&&a.relationship_stage==='new'),'added to this company, in Found');
 assert.deepEqual(added.map(a=>a.full_name).sort(),['Putri Handayani','Raka Mahendra']);
 assert.equal(await lane('new').locator('.outreach-card').count(),4);

 /* 8. menu: Let go moves to the No reply tray with a log; Bring back returns */
 writes.length=0;await card('Hendra Wijaya').locator('.outreach-more').click();await page.locator('.outreach-menu [data-outreach="let-go"]').click();await settle();
 assert.equal(writes.find(w=>w.m==='PATCH').body.relationship_stage,'no_reply');assert.equal(writes.find(w=>w.m==='POST').body.summary,'Closed: no reply');
 assert.equal(await page.locator('.outreach-tray b').innerText(),'1');await page.locator('.outreach-tray-toggle').click();assert.equal(await page.locator('.outreach-chip').count(),1);
 writes.length=0;await page.locator('.outreach-chip button').click();await settle();assert.equal(writes.find(w=>w.m==='PATCH').body.relationship_stage,'new');assert.equal(writes.filter(w=>w.m==='POST').length,0,'bringing back does not log');

 /* 9. details open the existing drawer; add link focuses the URL field */
 await card('Hendra Wijaya').locator('.outreach-card .outreach-link,.outreach-link').first().click();await page.locator('.career-drawer').waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('name')),'profile_url','add link lands on the URL field');
 const stages=await page.locator('.career-drawer [name="relationship_stage"] option').allInnerTexts();assert.deepEqual(stages,['Found','Connect sent','Connected','Approached','Talking','Ally','No reply']);
 await page.keyboard.press('Escape');await page.locator('.career-drawer').waitFor({state:'detached'});

 /* 10. composer: template merge, unfilled placeholder warning, Copy, Log as sent moves the stage */
 await card('Sari Anindya').locator('.outreach-more').click();await page.locator('.outreach-menu [data-outreach="compose"]').click();await page.locator('.outreach-modal').waitFor();
 const msg=page.locator('[data-outreach-msg]');assert.match(await msg.inputValue(),/Halo Sari, saya \{my_name\}\./);assert.match(await msg.inputValue(),/Sample Capital/);
 assert.match(await page.locator('.outreach-modal .outreach-need').innerText(),/\{my_name\}/);
 await page.locator('[data-outreach-myname]').fill('Tester');await page.locator('[data-outreach-myname]').press('Tab');
 assert.match(await page.locator('[data-outreach-msg]').inputValue(),/saya Tester\./);assert.equal(await page.locator('.outreach-modal .outreach-need').count(),0);
 assert.match(await page.locator('[data-outreach="log-sent"]').innerText(),/move to Connect sent/);
 writes.length=0;await page.locator('[data-outreach="log-sent"]').click();await settle();
 assert.equal(writes.find(w=>w.m==='PATCH').body.relationship_stage,'connect_sent');assert.match(writes.find(w=>w.m==='POST').body.summary,/^LinkedIn connection request sent: Halo Sari/);
 assert.equal(await page.locator('.outreach-modal').count(),0);

 /* 11. keyboard: Enter on a focused card opens LinkedIn; Escape closes menus */
 await card('Ayu Lestari').focus();const [pop2]=await Promise.all([context.waitForEvent('page'),page.keyboard.press('Enter')]);await pop2.waitForLoadState().catch(()=>{});assert.match(pop2.url(),/linkedin\.com\/in\/ayu-lestari/,'Enter on a focused card opens the profile');await pop2.close();
 await card('Ayu Lestari').locator('.outreach-more').click();assert.equal(await page.locator('.outreach-menu').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.outreach-menu').count(),0);

 /* 12. campus search link appears once set */
 await page.locator('[data-outreach-campus]').fill('UI');await page.locator('[data-outreach-campus]').press('Tab');
 assert.equal(await page.locator('.outreach-find a').count(),4);assert.match(await page.locator('.outreach-find a').last().getAttribute('href'),/UI$/);

 if(process.env.OUTREACH_SHOT){await page.setViewportSize({width:1366,height:900});await page.screenshot({path:process.env.OUTREACH_SHOT+'-board.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.OUTREACH_SHOT+'-phone.png'});await page.setViewportSize({width:1280,height:900})}
 /* 13. phone: lanes scroll inside the board, the page does not widen */
 await page.setViewportSize({width:390,height:844});await noOverflow('board at 390');
 await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});await noOverflow('board at 390, 150% text');
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.style.removeProperty('--scale'));

 /* 14. back to the overview, then CSV import skips duplicates */
 await page.locator('[data-outreach="back"]').click();await page.locator('.outreach-toolbar').waitFor();
 await page.locator('[data-outreach="csv"]').click();
 await page.locator('[data-outreach-csv]').fill('name,industry,website,location\nSample Capital,PE,https://sample.example,Jakarta\nNew Fund,VC,newfund.vc,Jakarta Pusat\n');
 await page.locator('[data-outreach="csv-preview"]').click();
 assert.match(await page.locator('.outreach-prev').innerText(),/Sample Capital[\s\S]*Already in SELF/);assert.equal(await page.locator('[data-outreach="csv-add"]').innerText(),'Add 1 companies');
 writes.length=0;await page.locator('[data-outreach="csv-add"]').click();await settle();
 const co=writes.filter(w=>w.table==='career_companies');assert.equal(co.length,1);assert.equal(co[0].body.name,'New Fund');assert.equal(co[0].body.website,'https://newfund.vc/');
 assert.equal(await page.locator('.outreach-modal').count(),0);
 await page.locator('[data-outreach-filter]').fill('new');assert.equal(await page.locator('.outreach-row').count(),1);

 assert.deepEqual(errors.filter(e=>!/linkedin/i.test(String(e))),[],'no page errors');
 await x.browser.close();
 console.log('PASS Outreach browser: overview, board, link opens, drag moves without opening, log + Undo, paste links, Let go, drawer, composer, CSV, keyboard, 390px.');
})().catch(e=>{console.error(e);process.exit(1)});
