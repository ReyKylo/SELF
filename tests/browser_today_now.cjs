/* Real-browser check of Today's Next up, Schedule and Quick Capture against a synthetic API:
   the card follows SELF Calendar events, capture needs no kind choice, Enter saves what the preview said, Undo removes it. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const d=new Date(),day=d.toLocaleDateString('en-CA'),m=d.getHours()*60+d.getMinutes();
 const events=[{id:'e1',title:'Focus block',date:day,start:Math.max(0,m-20),end:Math.min(1440,m+25)},{id:'e2',title:'Coffee chat',date:day,start:Math.min(1430,m+90),end:Math.min(1440,m+120)}];
 await context.addInitScript(([u,e])=>{if(!localStorage.getItem('qa.events.seeded')){localStorage.setItem('self.cal.events.'+u,JSON.stringify(e));localStorage.setItem('qa.events.seeded','1')}},[fixture.user.id,events]);
 fixture.tasks.push({id:'11111111-1111-4111-8111-111111111111',user_id:fixture.user.id,title:'Late analysis',status:'todo',priority:'high',due_date:'2026-01-02',description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 const spaces=[{id:'s0000000-0000-4000-8000-000000000001',user_id:fixture.user.id,name:'Career',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'}];
 const inbox=[],calls=[];let seq=0;
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),method=req.method();
  const json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  const id=url.searchParams.get('id')?.slice(3);
  if(['POST','DELETE'].includes(method)&&['tasks','inbox'].includes(table))calls.push({m:method,t:table,b:req.postData()?req.postDataJSON():null});
  if(table==='spaces'&&method==='GET')return json(spaces);
  if(table==='inbox'){
   if(method==='GET')return json(inbox);
   if(method==='POST'){const row={...req.postDataJSON(),id:'n000000'+(++seq)+'-0000-4000-8000-000000000000',created_at:new Date().toISOString()};inbox.push(row);return json([row],201)}
   if(method==='DELETE'){const k=inbox.findIndex(i=>i.id===id);if(k>=0)inbox.splice(k,1);return json([])}
  }
  if(table==='tasks'&&method==='POST'){const row={...req.postDataJSON(),id:'9999999'+(++seq)+'-0000-4000-8000-000000000000',status:'todo',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),notes:'',description:''};fixture.tasks.push(row);return json([row],201)}
  if(table==='tasks'&&method==='DELETE'){const k=fixture.tasks.findIndex(t=>t.id===id);if(k>=0)fixture.tasks.splice(k,1);return json([])}
  return route.fallback();
 });

 /* 1. Next up shows the event happening now; Schedule lists both events in order with a now line between them */
 await page.goto(x.base);await page.locator('.today-next').waitFor();
 assert.equal(await page.locator('.today-next').getAttribute('data-mode'),'now');
 assert.match(await page.locator('.today-next').innerText(),/Now · until[\s\S]*Focus block/);
 assert.deepEqual(await page.locator('.sched-item strong').allInnerTexts(),['Focus block','Coffee chat']);
 assert.equal(await page.locator('.sched-item.is-now').count(),1);
 const order=await page.locator('.sched-list > li').evaluateAll(n=>n.map(e=>e.className.split(' ')[0]));
 assert.deepEqual(order,['sched-item','sched-now','sched-item'],'the now line sits between the current and the next event');

 /* 2. Without events, Next up falls back to the first of the three, with the reason */
 await page.evaluate(u=>localStorage.setItem('self.cal.events.'+u,'[]'),fixture.user.id);
 await page.reload();await page.locator('.today-next').waitFor();
 assert.equal(await page.locator('.today-next').getAttribute('data-mode'),'focus');
 assert.match(await page.locator('.today-next').innerText(),/Start with this[\s\S]*Late analysis[\s\S]*Overdue by/);
 assert.equal(await page.locator('.today-schedule').count(),0,'no Schedule card when nothing is timed');

 /* 3. Smart capture: no kind to pick; the preview says Task · Career · Tomorrow · High, and Enter saves exactly that */
 assert.equal(await page.locator('.capture-modes').count(),0,'the Note/Task/Link/Board picker is gone');
 await page.locator('#quick-text').fill('Kirim CV ke Dimas besok #Career !high');
 const pv=await page.locator('#capture-preview').innerText();
 assert.match(pv,/Task/);assert.match(pv,/Career/);assert.match(pv,/Tomorrow/);assert.match(pv,/High priority/);
 await page.locator('#quick-text').press('Enter');
 await page.locator('.toast-undo').waitFor();
 const post=calls.find(c=>c.m==='POST'&&c.t==='tasks');
 assert.ok(post,'a task was created');
 assert.equal(post.b.title,'Kirim CV ke Dimas');assert.equal(post.b.priority,'high');assert.equal(post.b.space_id,spaces[0].id);
 const tomorrow=new Date(Date.now()+864e5).toLocaleDateString('en-CA');assert.equal(post.b.due_date,tomorrow);
 assert.equal(await page.locator('#quick-text').inputValue(),'','draft cleared after saving');
 assert.match(await page.locator('.toast-undo').innerText(),/Task created · Tomorrow · Career/);

 /* 4. Undo removes the task it just made */
 await page.locator('.toast-undo button').click();
 await page.locator('.toast',{hasText:'Capture removed'}).waitFor();
 assert.ok(calls.some(c=>c.m==='DELETE'&&c.t==='tasks'),'Undo deleted the created task');
 assert.ok(!fixture.tasks.some(t=>t.title==='Kirim CV ke Dimas'));

 /* 5. The kind chip overrides the guess: a sentence saved as a Note goes to the Inbox */
 await page.locator('#quick-text').fill('ide untuk board story bank');
 assert.match(await page.locator('#capture-preview .pchip-kind').innerText(),/Note/);
 await page.locator('#capture-preview .pchip-kind').click();
 assert.match(await page.locator('#capture-preview .pchip-kind').innerText(),/Task · set/);
 await page.locator('#capture-preview .pchip-kind').click();
 assert.match(await page.locator('#capture-preview .pchip-kind').innerText(),/Note · set/);
 await page.locator('#quick-text').press('Enter');
 await page.waitForFunction(()=>!document.querySelector('.is-saving'));
 await page.waitForFunction(()=>document.querySelector('#quick-text')?.value==='');
 assert.ok(calls.some(c=>c.m==='POST'&&c.t==='inbox'&&c.b.kind==='note'&&c.b.title==='ide untuk board story bank'));
 assert.match(await page.locator('#capture-preview').innerText(),/Try/,'the override resets to automatic after saving');

 /* 6. Phone: no horizontal overflow */
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow at 390px');

 assert.deepEqual(errors,[]);
 await x.browser.close();console.log('browser_today_now: ok');
})().catch(e=>{console.error(e);process.exit(1)});
