/* Real-browser check of the Today room against a synthetic API: reorder, swap, triage (task, file, keep, delete with Undo), swipe, Career agenda. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const day=new Date().toLocaleDateString('en-CA'),past=new Date(Date.now()-3*864e5).toLocaleDateString('en-CA');
 const T=(id,title,status,due,pri='normal')=>({id,user_id:fixture.user.id,title,status,priority:pri,due_date:due,description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-0'+(1+fixture.tasks.length)+'T00:00:00Z'});
 fixture.tasks.push(T('11111111-1111-4111-8111-111111111111','Late analysis','in_progress',past,'high'),T('22222222-2222-4222-8222-222222222222','Debt schedule','planning',day),T('33333333-3333-4333-8333-333333333333','Case prep','todo',null,'high'),T('44444444-4444-4444-8444-444444444444','Spare task','todo',null),T('55555555-5555-4555-8555-555555555555','Already done','done',day));
 const spaces=[{id:'s0000000-0000-4000-8000-000000000001',user_id:fixture.user.id,name:'Finance',icon:'chart',accent:'green',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'}];
 const inbox=[1,2,3,4].map(n=>({id:'n000000'+n+'-0000-4000-8000-000000000000',user_id:fixture.user.id,space_id:null,title:'Capture '+n,body:n===2?'https://example.com/x':'note '+n,kind:n===2?'link':'note',created_at:'2026-10-2'+n+'T03:00:00Z'}));
 const calls=[];let seq=0;
 page.on('request',r=>{if(['POST','PATCH','DELETE'].includes(r.method())){const u=new URL(r.url());if(/^\/rest\/v1\/(tasks|inbox)$/.test(u.pathname))calls.push({m:r.method(),t:u.pathname.split('/').pop(),q:u.search,b:r.postData()?JSON.parse(r.postData()):null})}});
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),method=req.method();
  const json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  const id=url.searchParams.get('id')?.slice(3);
  if(table==='spaces'&&method==='GET')return json(spaces);
  if(table==='inbox'){
   if(method==='GET')return json(inbox);
   if(method==='PATCH'){const r=inbox.find(i=>i.id===id);Object.assign(r,req.postDataJSON());return json([r])}
   if(method==='DELETE'){const k=inbox.findIndex(i=>i.id===id);if(k>=0)inbox.splice(k,1);return json([])}
  }
  if(table==='tasks'&&method==='POST'){const row={...req.postDataJSON(),id:'9999999'+(++seq)+'-0000-4000-8000-000000000000',status:'todo',priority:'normal',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),notes:'',description:req.postDataJSON().description||''};fixture.tasks.push(row);return json([row],201)}
  return route.fallback();
 });
 const ids=()=>page.locator('.three-row').evaluateAll(n=>n.map(e=>e.dataset.dndItem));
 const settle=()=>page.waitForFunction(()=>!document.querySelector('.is-saving,.dnd-ghost'));

 /* 1. Three for today: ranking, progress copy, escaped content, no invented counts */
 await page.goto(x.base);await page.locator('.today-three').waitFor();
 assert.equal((await ids()).length,3);
 assert.deepEqual((await ids())[0],'11111111-1111-4111-8111-111111111111','overdue task ranks first');
 assert.match(await page.locator('.three-more').innerText(),/\+1 more open/);
 assert.equal(await page.locator('.agenda-list li').count(),2,'agenda: the overdue task and the one due today, nothing else');
 assert.match(await page.locator('.agenda-list').innerText(),/3d late/);

 /* 2. Drag to reorder: the order is kept for the day on this device */
 const before=await ids();
 const a=await page.locator('.three-row').first().locator('strong').boundingBox(),b=await page.locator('.three-row').nth(2).boundingBox();
 await page.mouse.move(a.x+10,a.y+6);await page.mouse.down();await page.mouse.move(a.x+14,a.y+16,{steps:3});await page.mouse.move(b.x+b.width/2,b.y+b.height-6,{steps:10});await page.mouse.up();
 await settle();
 const after=await ids();assert.notDeepEqual(after,before,'order changed');assert.deepEqual([...after].sort(),[...before].sort(),'same three tasks');
 const pins=await page.evaluate(d=>JSON.parse(localStorage.getItem('self.today.5cd5464c-9879-492d-8e74-b34f99ad15bb.'+d)),day);
 assert.deepEqual(pins,after,'pins equal the on-screen order');
 await page.reload();await page.locator('.today-three').waitFor();assert.deepEqual(await ids(),after,'order survives a reload');
 assert.equal(calls.filter(c=>c.t==='tasks').length,0,'reordering saves nothing to the database');
 /* keyboard reorder */
 await page.locator('.three-row').first().focus();await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await settle();
 assert.notDeepEqual(await ids(),after,'keyboard reorder moved the first row down');

 /* 3. Swap */
 const first=(await ids())[0];
 await page.locator('.three-row').first().locator('.today-swap').selectOption({index:1});
 await page.waitForFunction(f=>document.querySelector('.three-row')?.dataset.dndItem!==f,first);
 assert.ok(!(await ids()).includes(first)||(await ids()).indexOf(first)!==0,'swap replaced the first row');

 /* 4. Triage: oldest first, one card on top */
 assert.match(await page.locator('.today-triage h2').innerText(),/4 to sort/);
 assert.equal(await page.locator('.triage-card.is-top').getAttribute('data-triage'),'n0000001-0000-4000-8000-000000000000');
 /* file to a Space: one PATCH, the card leaves the queue */
 calls.length=0;
 await page.locator('.triage-card.is-top .today-file').selectOption({index:1});
 await page.waitForFunction(()=>/3 to sort/.test(document.querySelector('.today-triage h2').textContent));
 assert.equal(calls.filter(c=>c.m==='PATCH'&&c.t==='inbox').length,1);assert.equal(calls.find(c=>c.m==='PATCH').b.space_id,spaces[0].id);
 /* keep for later: no request */
 calls.length=0;await page.locator('.triage-card.is-top [data-today="triage-keep"]').click();
 await page.waitForFunction(()=>/2 to sort/.test(document.querySelector('.today-triage h2').textContent));assert.equal(calls.length,0,'Keep saves nothing');
 /* make task: one task created, then the capture removed */
 calls.length=0;const tasksBefore=fixture.tasks.length;
 await page.locator('.triage-card.is-top [data-today="triage-task"]').click();
 await page.waitForFunction(()=>/1 to sort/.test(document.querySelector('.today-triage h2').textContent));
 assert.deepEqual(calls.map(c=>c.m+' '+c.t),['POST tasks','DELETE inbox'],'create first, remove second');
 assert.equal(calls[0].b.title,'Capture 3');assert.equal(fixture.tasks.length,tasksBefore+1);
 /* delete with Undo: nothing is sent while the Undo window is open */
 calls.length=0;
 await page.locator('.triage-card.is-top [data-today="triage-delete"]').click();
 await page.locator('.toast-undo').waitFor();assert.match(await page.locator('.today-triage .empty-mini').innerText(),/Inbox clear/);
 await page.locator('.toast-undo button').click();
 await page.locator('.triage-card.is-top').waitFor();assert.equal(calls.length,0,'Undo means the delete was never sent');
 await page.locator('.triage-card.is-top [data-today="triage-delete"]').click();
 await page.waitForFunction(()=>true);await page.waitForTimeout(5600);
 assert.deepEqual(calls.map(c=>c.m+' '+c.t),['DELETE inbox'],'exactly one delete after the Undo window');
 assert.equal(inbox.filter(i=>!i.space_id).length,1,'only the kept capture remains unsorted');
 assert.match(await page.locator('.today-triage .empty-mini').innerText(),/Show the 1 kept for later/);
 await page.locator('[data-today="triage-reset"]').click();await page.locator('.triage-card.is-top').waitFor();

 /* 5. Swipe right makes a task */
 calls.length=0;
 const card=await page.locator('.triage-card.is-top').boundingBox();
 await page.mouse.move(card.x+card.width/2,card.y+30);await page.mouse.down();await page.mouse.move(card.x+card.width/2+40,card.y+32,{steps:4});await page.mouse.move(card.x+card.width/2+190,card.y+34,{steps:6});
 assert.equal(await page.locator('.triage-card.is-top').getAttribute('data-swipe'),'task','label shows while dragging');
 await page.mouse.up();
 await page.waitForFunction(()=>/Inbox clear/.test(document.querySelector('.today-triage').textContent),null,{timeout:6000});
 assert.deepEqual(calls.map(c=>c.m+' '+c.t),['POST tasks','DELETE inbox']);

 /* 6. Career agenda is opt-in */
 assert.ok(await page.locator('[data-today="load-career"]').isVisible());
 await page.locator('[data-today="load-career"]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-today="load-career"]'),null,{timeout:6000});
 assert.equal(await page.locator('.agenda-list li').count(),2,'Career has no data here, so the agenda stays honest');

 /* 7. Phone */
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow at 390px');
 await page.locator('.three-row').first().waitFor();
 assert.ok(await page.evaluate(()=>document.querySelector('.three-row').getBoundingClientRect().width<=390-24),'rows fit the phone width');

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Today browser: ranking, reorder by mouse and keyboard (kept per device, nothing saved), swap, triage (file, keep, make task in create-then-remove order, delete only after Undo window), swipe, opt-in Career agenda, 390px');
})().catch(e=>{console.error(e);process.exit(1)});
