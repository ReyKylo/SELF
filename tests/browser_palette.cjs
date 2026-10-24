/* Command palette in a real browser against a synthetic API: open/close/focus return, keyboard model, ARIA, creation requests, unknown Space, records, classic fallback, phone. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const day=new Date().toLocaleDateString('en-CA'),tomorrow=new Date(Date.now()+864e5).toLocaleDateString('en-CA');
 const T=(id,title,status)=>({id,user_id:fixture.user.id,title,status,priority:'normal',due_date:null,description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 fixture.tasks.push(T('11111111-1111-4111-8111-111111111111','Aruna Supply debt schedule','planning'),T('22222222-2222-4222-8222-222222222222','<img src=x onerror=window.__xss=1>','todo'));
 const spaces=[{id:'s0000000-0000-4000-8000-000000000001',user_id:fixture.user.id,name:'Career',icon:'briefcase',accent:'blue',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'}];
 const boards=[{id:'b0000000-0000-4000-8000-000000000001',user_id:fixture.user.id,space_id:null,title:'Money Flow',description:'',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'}];
 const writes=[];let requestsWhileTyping=0,typing=false;
 page.on('request',r=>{if(typing&&r.url().includes('supabase.co'))requestsWhileTyping++;if(['POST','PATCH','DELETE'].includes(r.method())&&r.url().includes('/rest/v1/'))writes.push({m:r.method(),t:new URL(r.url()).pathname.split('/').pop(),b:r.postData()?JSON.parse(r.postData()):null})});
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),method=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(table==='spaces'){if(method==='GET')return json(spaces);if(method==='POST'){const row={...req.postDataJSON(),id:'s0000000-0000-4000-8000-00000000000'+(spaces.length+1),icon:'folder',accent:'blue',created_at:'2026-10-02T00:00:00Z',updated_at:'2026-10-02T00:00:00Z'};spaces.push(row);return json([row],201)}}
  if(table==='boards'&&method==='GET')return json(boards);
  if(table==='inbox'&&method==='POST'){return json([{...req.postDataJSON(),id:'n0000000-0000-4000-8000-000000000001',created_at:new Date().toISOString()}],201)}
  if(table==='tasks'&&method==='POST'){const row={...req.postDataJSON(),id:'9999999-0000-4000-8000-000000000000'.slice(0,36),status:'todo',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),notes:'',description:req.postDataJSON().description||''};fixture.tasks.push(row);return json([row],201)}
  return route.fallback();
 });
 const pal=()=>page.locator('#pal');
 const current=()=>page.locator('.door[aria-current="page"]:visible').getAttribute('data-room');
 const toastText=()=>page.locator('.toast').last().innerText();

 /* 1. open with the keyboard, focus the field, close with Esc and give focus back */
 await page.goto(x.base);await page.locator('.shell[data-shell="rooms"]').waitFor();
 await page.locator('.rooms-rail .door[data-room="work"]').focus();
 await page.keyboard.press('Control+k');await pal().waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'pal-input','focus is in the field');
 const input=page.locator('#pal-input');
 assert.equal(await input.getAttribute('role'),'combobox');assert.equal(await input.getAttribute('aria-controls'),'pal-list');assert.equal(await page.locator('#pal-list').getAttribute('role'),'listbox');
 assert.equal(await pal().getAttribute('aria-modal'),'true');assert.equal(await page.locator('#pal-list [role="option"]').first().getAttribute('aria-selected'),'true');
 assert.deepEqual(await page.locator('#pal-list .pal-item').evaluateAll(n=>n.slice(0,5).map(e=>e.querySelector('.pal-label').textContent)),['Go to Today','Go to Work','Go to Hunt','Go to Study','Go to Studio']);
 await page.keyboard.press('Escape');await pal().waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.room),'work','focus returns to the door that had it');
 await page.keyboard.press('Control+k');await pal().waitFor();await page.keyboard.press('Control+k');await pal().waitFor({state:'detached'});
 /* the slash opens it outside a text field only */
 await page.locator('.rooms-rail .door[data-room="today"]').click();
 await page.keyboard.press('/');await pal().waitFor();await page.keyboard.press('Escape');
 await page.locator('#quick-text').focus();await page.keyboard.type('a/b');assert.equal(await page.locator('#quick-text').inputValue(),'a/b','typing a slash in a field still types it');assert.equal(await pal().count(),0);
 await page.locator('#quick-text').fill('');

 /* 2. navigation by typing: no network while typing, the active option follows the arrows, Enter goes */
 await page.keyboard.press('Control+k');await pal().waitFor();
 typing=true;await input.pressSequentially('hunt',{delay:20});typing=false;assert.equal(requestsWhileTyping,0,'typing never calls the network');
 assert.equal(await page.locator('#pal-list .pal-item').first().locator('.pal-label').innerText(),'Go to Hunt');
 assert.equal(await page.locator('#pal-list .pal-item').first().locator('mark').allInnerTexts().then(a=>a.join('')),'Hunt','the matched letters are highlighted');
 await page.keyboard.press('ArrowDown');assert.equal(await input.getAttribute('aria-activedescendant'),'pal-opt-1');
 await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');const n=await page.locator('#pal-list .pal-item').count();assert.equal(await input.getAttribute('aria-activedescendant'),'pal-opt-'+(n-1),'arrows wrap');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await pal().waitFor({state:'detached'});assert.equal(await current(),'hunt');
 /* a section: Hunt · People opens Career on that page */
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('people');await page.keyboard.press('Enter');
 await page.locator('.career-pill.active').waitFor();assert.equal(await page.locator('.career-pill.active').innerText(),'People');

 /* 3. create a task from shorthand: the chips preview it and exactly one POST carries it */
 await page.keyboard.press('Control+k');await pal().waitFor();
 await page.locator('#pal-input').fill('Kirim CV ke Dimas besok #career !high');
 assert.deepEqual(await page.locator('.pal-chip').allInnerTexts(),['Task','Space: Career','Priority: high','Due: '+tomorrow]);
 assert.equal(await page.locator('#pal-list .pal-item').first().locator('.pal-label').innerText(),'Create task “Kirim CV ke Dimas”');
 writes.length=0;await page.keyboard.press('Enter');await pal().waitFor({state:'detached'});
 await page.waitForFunction(()=>/Task created/.test(document.querySelector('.toast')?.textContent||''));
 assert.equal(writes.filter(w=>w.t==='tasks').length,1);const body=writes.find(w=>w.t==='tasks').b;
 assert.deepEqual([body.title,body.space_id,body.priority,body.due_date],['Kirim CV ke Dimas',spaces[0].id,'high',tomorrow]);

 /* 4. an unknown Space is never created silently; the task is saved unfiled and the toast says so */
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('Bayar listrik #Rumah');
 assert.ok(await page.locator('.pal-chip[data-k="warn"]').innerText().then(t=>/No Space named “Rumah”/.test(t)));
 assert.ok((await page.locator('#pal-list .pal-item .pal-label').allInnerTexts()).includes('Create Space “Rumah”'));
 writes.length=0;await page.keyboard.press('Enter');await page.waitForFunction(()=>/unfiled/.test(document.querySelector('.toast')?.textContent||''));
 assert.equal(writes.filter(w=>w.t==='spaces').length,0,'no Space was created');assert.equal(writes.find(w=>w.t==='tasks').b.space_id,undefined);
 /* the explicit command does create it */
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('Bayar listrik #Rumah');
 await page.locator('#pal-list .pal-item',{hasText:'Create Space “Rumah”'}).click();
 await page.waitForFunction(()=>/Space “Rumah” created/.test(document.querySelector('.toast')?.textContent||''));
 assert.deepEqual(writes.filter(w=>w.t==='spaces').map(w=>w.b.name),['Rumah']);

 /* 5. notes and links go to the Inbox */
 writes.length=0;
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('Ide board cohort retention');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>/Note captured/.test(document.querySelector('.toast')?.textContent||''));
 assert.deepEqual([writes[0].t,writes[0].b.kind,writes[0].b.title],['inbox','note','Ide board cohort retention']);
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('https://docs.google.com/spreadsheets/d/aruna');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>/Link saved/.test(document.querySelector('.toast')?.textContent||''));
 assert.deepEqual([writes[1].t,writes[1].b.kind,writes[1].b.title,writes[1].b.body],['inbox','link','docs.google.com','https://docs.google.com/spreadsheets/d/aruna']);
 /* the alternative is one arrow away: a note typed as a sentence can become a task */
 writes.length=0;await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('Ide board cohort retention');await page.keyboard.press('ArrowDown');
 assert.match(await page.locator('#pal-list .pal-item.on .pal-label').innerText(),/^Create task/);await page.keyboard.press('Enter');
 await page.waitForFunction(()=>/Task created/.test(document.querySelector('.toast')?.textContent||''));assert.equal(writes[0].t,'tasks');

 /* 6. records: a task opens its sheet; a hostile title is text, never markup; a board opens; Esc closes */
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('aruna');
 await page.locator('#pal-list .pal-item',{hasText:'Aruna Supply debt schedule'}).click();await page.locator('.panel').waitFor();
 assert.equal(await page.locator('.panel-title-input').inputValue(),'Aruna Supply debt schedule');await page.keyboard.press('Escape');await page.locator('.panel').waitFor({state:'detached'});
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('img src');
 assert.equal(await page.locator('#pal-list img').count(),0,'a title with markup renders as text');assert.equal(await page.evaluate(()=>window.__xss),undefined);
 assert.ok((await page.locator('#pal-list .pal-label').allInnerTexts()).includes('<img src=x onerror=window.__xss=1>'));
 await page.keyboard.press('Escape');
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('money');await page.keyboard.press('Enter');await page.waitForTimeout(300);
 assert.equal(await current(),'studio','a board opens in Studio');
 await page.keyboard.press('Alt+1');

 /* 7. actions and the Search page stay reachable */
 const before=await page.evaluate(()=>document.body.dataset.theme);
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('switch theme');await page.keyboard.press('Enter');
 await page.waitForFunction(b=>document.body.dataset.theme!==b,before);
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('search everything');await page.keyboard.press('Enter');
 await page.locator('#global-search').waitFor();
 await page.locator('[data-action="palette"]').click();await pal().waitFor();await page.keyboard.press('Escape');
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('zzzzqqq');
 assert.match(await page.locator('#pal-list .pal-item .pal-label').first().innerText(),/^Save note “zzzzqqq”/,'any text can always be saved as a note');
 await page.locator('#pal-input').fill('!high');
 assert.match(await page.locator('.pal-empty').innerText(),/Nothing matches/,'a priority with no title has nothing to create');await page.keyboard.press('Escape');

 /* 8. phone: the top-bar button opens it, it fits the screen, even with wide fonts at 150% */
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.id='__font';s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});
 await page.locator('[data-action="palette"]:visible').click();await pal().waitFor();await page.locator('#pal-input').fill('Kirim CV besok #career !high');
 const box=await page.locator('.pal-box').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390&&box.y>=0&&box.y+box.height<=844,'dialog fits the phone: '+JSON.stringify(box));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.keyboard.press('Escape');

 /* 9. classic shell: Ctrl K still goes to Search, there is no palette */
 await page.setViewportSize({width:1366,height:768});await page.goto(x.base+'/?shell=classic');await page.locator('.sidebar .nav-btn').first().waitFor();
 await page.keyboard.press('Control+k');await page.locator('#global-search').waitFor();assert.equal(await pal().count(),0);

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Palette browser: Ctrl K and / (not inside fields), focus in and back, combobox ARIA and wrapping arrows, no network while typing, room and section navigation, shorthand creates exactly one task with its chips, unknown Space never created silently (explicit command does), notes and links to Inbox with a task alternative, records open (hostile title stays text), theme and Search reachable, 390px at 150% with a wide font, classic Ctrl K unchanged');
})().catch(e=>{console.error(e);process.exit(1)});
