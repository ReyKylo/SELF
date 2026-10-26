/* Real-browser check of the Rooms shell and drag-and-drop against a synthetic API. Never touches production. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const T=(id,title,status,due)=>({id,user_id:fixture.user.id,title,status,priority:'normal',due_date:due,description:'',notes:'',space_id:null,created_at:'2026-10-0'+(1+fixture.tasks.length)+'T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 fixture.tasks.push(T('11111111-1111-4111-8111-111111111111','Write memo','todo','2026-10-30'),T('22222222-2222-4222-8222-222222222222','Model debt tab','planning','2026-10-28'),T('33333333-3333-4333-8333-333333333333','Case prep','in_progress','2026-10-25'),T('44444444-4444-4444-8444-444444444444','Send CV','done',null));
 const apps=[{id:'a1000000-0000-4000-8000-000000000001',user_id:fixture.user.id,company_id:'c1000000-0000-4000-8000-000000000001',role_title:'Analyst, PE',hiring_stage:'wishlist',notes:'',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-02T00:00:00Z'}];
 const companies=[{id:'c1000000-0000-4000-8000-000000000001',user_id:fixture.user.id,name:'Sample Sponsor',industry:'',location:'',notes:'',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'}];
 const patches=[];let failNext=false;
 page.on('request',r=>{if(r.method()==='PATCH')patches.push({url:r.url(),body:r.postDataJSON()})});
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),method=req.method();
  const json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(method==='PATCH'&&failNext&&(table==='tasks'||table==='career_applications')){failNext=false;return json({message:'Synthetic save failure'},503)}
  if(table==='career_applications'){
   if(method==='GET')return json(apps);
   if(method==='PATCH'){const id=url.searchParams.get('id')?.slice(3),row=apps.find(a=>a.id===id);Object.assign(row,req.postDataJSON());return json([row])}
  }
  if(table==='career_companies'&&method==='GET')return json(companies);
  return route.fallback();
 });
 const visible=sel=>page.locator(sel+':visible');
 const column=s=>page.locator('[data-dnd-zone="status:'+s+'"]');
 const ids=async s=>column(s).locator('[data-dnd-item]').evaluateAll(n=>n.map(e=>e.dataset.dndItem));
 async function drag(fromSel,toSel,{steps=12}={}){
  const a=await page.locator(fromSel).first().boundingBox(),b=await page.locator(toSel).first().boundingBox();
  await page.mouse.move(a.x+30,a.y+12);await page.mouse.down();
  await page.mouse.move(a.x+36,a.y+20,{steps:3});
  await page.mouse.move(b.x+b.width/2,b.y+60,{steps});
  await page.mouse.up();
 }

 const doorsVisible=()=>page.locator('.door:visible');
 const current=()=>page.locator('.door[aria-current="page"]:visible').getAttribute('data-room');

 /* 1. Rooms shell on Home, desktop */
 await page.goto(x.base);await page.locator('.shell[data-shell="rooms"]').waitFor();
 assert.equal(await doorsVisible().count(),5);assert.equal(await current(),'today');
 assert.equal(await page.locator('.shell').getAttribute('data-room'),'today');
 assert.equal(await page.locator('.rooms-bar').isVisible(),false,'door bar hidden on desktop');
 const badge=await page.locator('.rooms-rail .door[data-room="work"] small').innerText();
 assert.equal(badge,'3 open','Work badge counts the three open tasks from loaded data');
 assert.equal(await page.locator('.rooms-rail .door[data-room="hunt"] small').innerText(),'','no invented Hunt badge');
 assert.ok(await page.locator('.rail-ind').first().evaluate(e=>e.style.transform.startsWith('translateY(')),'indicator is positioned');

 /* 2. Work room, board view, mouse drag */
 await page.locator('.rooms-rail .door[data-room="work"]').click();
 assert.equal(await current(),'work');await page.locator('.rooms-subnav').waitFor();
 await page.locator('[data-action="work-view"][data-mode="board"]').click();await page.locator('.kanban').waitFor();
 assert.deepEqual(await ids('todo'),['11111111-1111-4111-8111-111111111111']);
 patches.length=0;
 await drag('[data-dnd-item="11111111-1111-4111-8111-111111111111"] strong','[data-dnd-zone="status:review"]');
 await page.locator('.toast:not(.error)').first().waitFor();await page.waitForFunction(()=>!document.querySelector('.is-saving,.dnd-ghost'));
 assert.equal(patches.length,1,'exactly one save for one drop');assert.equal(patches[0].body.status,'review');
 assert.deepEqual(await ids('todo'),[]);assert.equal(await column('review').locator('[data-count-for]').innerText(),'1');
 assert.match(await page.locator('.toast').first().innerText(),/Review/);
 assert.equal(await page.locator('.dnd-ghost').count(),0,'no ghost left behind');
 assert.equal(await page.locator('.dnd-placeholder').count(),0,'no placeholder left behind');

 /* a plain click still opens the task, a drag does not */
 await page.locator('[data-dnd-item="33333333-3333-4333-8333-333333333333"] strong').click();
 await page.locator('.panel').waitFor();await page.keyboard.press('Escape');await page.locator('.panel').waitFor({state:'detached'});

 /* 3. Failed save puts the card back and says so */
 patches.length=0;failNext=true;
 await drag('[data-dnd-item="22222222-2222-4222-8222-222222222222"] strong','[data-dnd-zone="status:done"]');
 await page.locator('.toast.error').waitFor();
 assert.deepEqual(await ids('planning'),['22222222-2222-4222-8222-222222222222'],'card is back in Planning after a failed save');
 assert.equal(fixture.tasks.find(t=>t.id.startsWith('2222')).status,'planning','nothing was saved');

 /* 4. Keyboard drag: Space, ArrowRight, Space */
 patches.length=0;await page.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
 await page.locator('[data-dnd-item="33333333-3333-4333-8333-333333333333"]').focus();
 await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>/Review, position \d of \d/.test(document.getElementById('dnd-live').textContent));
 await page.keyboard.press('Space');
 await page.locator('.toast:not(.error)').last().waitFor();await page.waitForFunction(()=>!document.querySelector('.is-saving,.dnd-ghost'));
 assert.ok(await column('review').locator('[data-dnd-item="33333333-3333-4333-8333-333333333333"]').count());
 assert.equal(patches.length,1);assert.equal(patches[0].body.status,'review');
 await page.locator('[data-dnd-item="33333333-3333-4333-8333-333333333333"]').focus();
 await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');
 assert.ok(await column('review').locator('[data-dnd-item="33333333-3333-4333-8333-333333333333"]').count(),'Escape returns the card');
 assert.equal(patches.length,1,'Escape saves nothing');

 /* 5. Hunt and Study doors split Career; Applications drag */
 await page.locator('.rooms-rail .door[data-room="study"]').click();
 await page.locator('.career-workspace').waitFor();await page.locator('.learning-workspace').waitFor();assert.equal(await current(),'study');
 assert.equal(await page.locator('.career-pills').count(),0,'Study shows Career Prep, not the Hunt pills');
 await page.locator('.rooms-rail .door[data-room="hunt"]').click();assert.equal(await current(),'hunt');
 await page.locator('.career-pills').waitFor();assert.equal(await page.locator('.career-pill.active').innerText(),'Tracker','Hunt leaves the learning page');
 await page.locator('.career-pill[data-page="applications"]').click();
 await page.locator('[data-dnd-zone="stage:wishlist"] [data-dnd-item]').waitFor();
 assert.equal(await current(),'hunt','applications stay in Hunt');
 patches.length=0;
 await drag('[data-dnd-zone="stage:wishlist"] [data-dnd-item] strong','[data-dnd-zone="stage:applied"]');
 await page.locator('.career2-undo').waitFor();await page.waitForFunction(()=>!document.querySelector('.is-saving,.dnd-ghost'));
 assert.ok(await page.locator('[data-dnd-zone="stage:applied"] [data-dnd-item]').count());
 assert.equal(patches.length,1);assert.equal(patches[0].body.hiring_stage,'applied');
 failNext=true;
 await drag('[data-dnd-zone="stage:applied"] [data-dnd-item] strong','[data-dnd-zone="stage:offer"]');
 await page.locator('[data-dnd-zone="stage:applied"] [data-dnd-item]').waitFor();
 assert.equal(apps[0].hiring_stage,'applied','failed stage save leaves the stage unchanged');

 /* 6. Alt+digit and theme */
 await page.locator('body').click({position:{x:5,y:5}});
 await page.keyboard.press('Alt+1');assert.equal(await current(),'today');
 await page.keyboard.press('Alt+5');assert.equal(await current(),'studio');
 await page.keyboard.press('Alt+1');
 const before=await page.evaluate(()=>document.body.dataset.theme);
 await page.locator('[data-action="theme"]').click();
 await page.waitForFunction(b=>document.body.dataset.theme!==b,before);

 /* 7. Phone: door bar, no rail, no horizontal overflow, Settings reachable */
 await page.setViewportSize({width:390,height:844});
 await page.locator('.rooms-bar').waitFor();
 assert.equal(await page.locator('.rooms-rail').isVisible(),false);
 assert.equal(await page.locator('.rooms-bar .door:visible').count(),5);
 const box=await page.locator('.rooms-bar .door').first().boundingBox();assert.ok(box.height>=48,'door is at least 48px tall: '+box.height);
 for(const room of ['work','hunt','study','studio','today']){
  await page.locator('.rooms-bar .door[data-room="'+room+'"]').click();assert.equal(await current(),room);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,room+' has no horizontal page overflow at 390px');
 }
 await page.locator('[data-action="nav"][data-view="settings"]:visible').first().click();
 assert.equal(await page.locator('.rooms-bar .door[aria-current="page"]').count(),0,'Settings has no current door');

 /* 7b. Wide fallback fonts at 150% text must not push the page sideways (a CI runner without Inter did exactly that) */
 await page.goto(x.base);await page.locator('.shell[data-shell="rooms"]').waitFor();
 await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});
 for(const room of ['today','work','hunt','study','studio']){
  await page.locator('.rooms-bar .door[data-room="'+room+'"]').click();await page.waitForTimeout(150);
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dims.scroll<=dims.viewport+1,room+' overflows at 390px, 150% text, wide font: '+JSON.stringify(dims));
 }
 await page.locator('[data-action="nav"][data-view="settings"]:visible').first().click();
 {const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,'settings overflows: '+JSON.stringify(d))}
 await page.evaluate(()=>{document.documentElement.style.removeProperty('--scale')});

 /* 8. Classic shell is one URL parameter away */
 await page.setViewportSize({width:1366,height:768});
 await page.goto(x.base+'/?shell=classic');await page.locator('.sidebar .nav-btn').first().waitFor();
 assert.equal(await page.locator('.shell[data-shell="rooms"]').count(),0);assert.equal(await page.locator('.door').count(),0);

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Rooms browser: shell and badges, drag with exactly one save, failed save returns the card, keyboard pick-up/move/drop/cancel, Applications drag, Hunt/Study split, Alt+digit, theme switch, 390px door bar without overflow, classic fallback');
})().catch(e=>{console.error(e);process.exit(1)});
