/* My Work tools in a real browser: selection (checkbox, Shift range, X key, hidden tasks drop out), bulk status/due/Space with one PATCH per task, partial failure reported
   exactly with Undo for what saved, in-page delete confirm, saved views (apply, stale Space, remove), view in Ctrl K, Export in Settings, 390px. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';
(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id;
 const T=(n,title,status,due,space)=>({id:'0000000'+n+'-0000-4000-8000-000000000000',user_id:U,title,status,priority:'normal',due_date:due,description:'',notes:'',space_id:space||null,created_at:'2026-10-0'+n+'T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 const SP={id:'5pace001-0000-4000-8000-000000000000',user_id:U,name:'Career',icon:'briefcase',color:'#3b84ff',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
 const spaces=[SP];
 fixture.tasks.push(T(1,'Write memo','todo','2026-10-30',SP.id),T(2,'Model debt tab','planning','2026-10-28'),T(3,'Case prep','in_progress','2026-10-25',SP.id),T(4,'Send CV','done',null),T(5,'=SUM(A1) injection title','todo',null));
 const writes=[];let failId=null;
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(table==='spaces'&&m==='GET')return json(spaces);
  if(table==='tasks'&&(m==='PATCH'||m==='DELETE')){
   const id=url.searchParams.get('id')?.slice(3);writes.push({m,id,body:m==='PATCH'?req.postDataJSON():null});
   if(failId&&id===failId)return json({message:'Synthetic save failure'},503);
   const row=fixture.tasks.find(t=>t.id===id);
   if(m==='DELETE'){fixture.tasks=fixture.tasks.filter(t=>t.id!==id);return json([])}
   Object.assign(row,req.postDataJSON());return json([row]);
  }
  return route.fallback();
 });
 const title=n=>page.locator('.work-row.data',{hasText:n});
 const sel=n=>title(n).locator('.work-select');
 const bar=()=>page.locator('.bulk-bar');
 const settle=()=>page.waitForTimeout(250);
 const status=async n=>title(n).locator('.badge').first().innerText();
 const noOverflow=async l=>{const d=await page.evaluate(()=>({s:document.documentElement.scrollWidth,v:innerWidth}));assert.ok(d.s<=d.v+1,l+' overflows '+JSON.stringify(d))};

 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="work"]').click();await page.locator('.work-tools').waitFor();
 /* nothing changes until Select is turned on */
 assert.equal(await page.locator('.work-select').count(),0);assert.equal(await page.locator('.bulk-bar').count(),0);
 await page.locator('[data-work="select-mode"]').click();assert.equal(await page.locator('.work-select').count(),5);assert.match(await bar().innerText(),/Select tasks to change them together/);

 /* checkbox, then Shift range */
 await sel('Write memo').click();assert.match(await bar().innerText(),/1 selected/);
 await sel('Send CV').click({modifiers:['Shift']});assert.match(await bar().innerText(),/2 selected/,'Shift extends a range through the visible list (Write memo to Send CV, in list order)');
 await sel('Model debt tab').click();assert.match(await bar().innerText(),/3 selected/,'a plain click toggles one');
 /* clicking the row selects instead of opening the task panel */
 await title('Case prep').locator('.task-cell span').click();assert.equal(await page.locator('.panel-title-input,.panel-title').count(),0,'row click does not open the panel in selection mode');assert.match(await bar().innerText(),/4 selected/);

 /* hidden tasks are dropped from the selection */
 await page.locator('#filter-status').selectOption('todo');await settle();assert.match(await bar().innerText(),/1 selected|Select tasks/,'only visible tasks stay selected');
 await page.locator('#filter-status').selectOption('all');await settle();
 await page.locator('[data-work="clear"]').click().catch(()=>{});

 /* bulk status: one PATCH per task that really changes */
 await sel('Write memo').click();await sel('Case prep').click();await sel('Model debt tab').click();
 writes.length=0;await bar().locator('[data-work-bulk="status"]').selectOption('review');await settle();
 assert.equal(writes.filter(w=>w.m==='PATCH').length,3);assert.ok(writes.every(w=>w.body.status==='review'&&Object.keys(w.body).sort().join()==='status,updated_at'),'only the status (plus the usual updated_at) is written');
 assert.equal(await status('Write memo'),'Review');assert.equal(await status('Case prep'),'Review');
 assert.match(await page.locator('.bulk-undo').innerText(),/3 tasks updated/);

 if(process.env.WORK_SHOT)await page.screenshot({path:process.env.WORK_SHOT+'-bulk.png'});
 /* Undo restores each task's own previous status */
 writes.length=0;await page.locator('[data-work="undo"]').click();await settle();
 assert.equal(await status('Write memo'),'To Do');assert.equal(await status('Model debt tab'),'Planning');assert.equal(await status('Case prep'),'In Progress');
 assert.equal(writes.length,3);

 /* partial failure is reported exactly, and Undo covers only what saved */
 await page.locator('[data-work="select-mode"]').click().catch(()=>{});
 if(await page.locator('.work-select').count()===0)await page.locator('[data-work="select-mode"]').click();
 const sel2=async()=>{for(const n of ['Write memo','Model debt tab','Case prep'])if(!(await sel(n).isChecked()))await sel(n).click()};await sel2();
 failId=fixture.tasks.find(t=>t.title==='Model debt tab').id;writes.length=0;
 await bar().locator('[data-work-bulk="priority"]').selectOption('high');await settle();
 assert.match(await page.locator('.toast').last().innerText(),/2 tasks updated, 1 failed: Model debt tab/);
 assert.match(await page.locator('.bulk-undo').innerText(),/2 tasks updated, 1 failed: Model debt tab/);
 failId=null;writes.length=0;await page.locator('[data-work="undo"]').click();await settle();
 assert.deepEqual(writes.map(w=>w.body.priority),['normal','normal'],'undo restores only the two that saved');

 /* due date and Space */
 await sel2();writes.length=0;await bar().locator('[data-work-bulk="due"]').fill('2026-11-05');await settle();
 assert.ok(writes.filter(w=>w.m==='PATCH').every(w=>w.body.due_date==='2026-11-05'));
 writes.length=0;await page.locator('[data-work="clear-due"]').click();await settle();assert.ok(writes.length>=1&&writes.every(w=>w.body.due_date===null),'No due date clears it');
 writes.length=0;await bar().locator('[data-work-bulk="space"]').selectOption(SP.id);await settle();
 assert.ok(writes.every(w=>w.body.space_id===SP.id),'moved to Career');assert.ok(writes.length>=1);
 writes.length=0;await bar().locator('[data-work-bulk="space"]').selectOption('__none');await settle();assert.ok(writes.every(w=>w.body.space_id===null));

 /* delete asks inside the page and lists titles; Keep them changes nothing */
 await sel('Send CV').click();await page.locator('[data-work="delete"]').click();
 assert.match(await page.locator('.bulk-confirm-card').innerText(),/Delete 4 tasks\?[\s\S]*Send CV/);
 writes.length=0;await page.locator('[data-work="delete-cancel"]').click();assert.equal(writes.length,0);assert.equal(await page.locator('.bulk-confirm').count(),0);
 await page.locator('[data-work="delete"]').click();await page.locator('[data-work="delete-confirm"]').click();await settle();
 assert.equal(writes.filter(w=>w.m==='DELETE').length,4);assert.equal(await page.locator('.work-row.data').count(),1,'only the injection-titled task is left');
 assert.match(await page.locator('.bulk-undo').innerText(),/4 tasks deleted\. Deleted tasks cannot be restored\./);assert.equal(await page.locator('[data-work="undo"]').count(),0,'no Undo is offered for deletes');
 /* restore fixture rows for later steps */
 fixture.tasks.push(T(1,'Write memo','todo','2026-10-30',SP.id),T(2,'Model debt tab','planning','2026-10-28'),T(3,'Case prep','in_progress','2026-10-25',SP.id),T(4,'Send CV','done',null));

 /* keyboard: X toggles the task whose checkbox has focus */
 await page.locator('[data-work="select-mode"]').click().catch(()=>{});await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="work"]').click();await page.locator('.work-tools').waitFor();
 await title('Case prep').locator('input.check').focus();await page.keyboard.press('x');assert.match(await bar().innerText(),/1 selected/);assert.equal(await sel('Case prep').isChecked(),true,'X turns selection on and selects the focused task');
 await page.locator('[data-work="select-mode"]').click();assert.equal(await page.locator('.bulk-bar').count(),0,'leaving selection mode clears it');

 /* saved views */
 await page.locator('#filter-space').selectOption(SP.id);await page.locator('#filter-status').selectOption('todo');await page.locator('#work-search').fill('memo');await settle();
 await page.locator('[data-work="view-new"]').click();await page.locator('[data-work-input="view-name"]').fill('Memo todo');await page.keyboard.press('Enter');
 assert.equal(await page.locator('.view-apply').innerText(),'Memo todo');assert.match(await page.locator('.view-apply').getAttribute('title'),/Career · To Do · “memo”/);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('self.views.')))));assert.equal(stored.length,1);assert.equal(stored[0].space,SP.id);
 await page.locator('#filter-space').selectOption('all');await page.locator('#filter-status').selectOption('all');await page.locator('#work-search').fill('');await settle();
 assert.equal(await page.locator('.work-row.data').count(),5);
 await page.locator('.view-apply').click();await settle();assert.equal(await page.locator('.work-row.data').count(),1);assert.equal(await page.locator('#filter-space').inputValue(),SP.id);assert.equal(await page.locator('#work-search').inputValue(),'memo');
 /* the same name replaces, a blank name is refused */
 await page.locator('[data-work="view-new"]').click();await page.locator('[data-work-input="view-name"]').fill('memo TODO');await page.keyboard.press('Enter');assert.equal(await page.locator('.view-pill').count(),1);
 await page.locator('[data-work="view-new"]').click();await page.locator('[data-work-input="view-name"]').fill('   ');await page.keyboard.press('Enter');assert.match(await page.locator('.view-error').innerText(),/Give the view a name/);await page.locator('[data-work="view-cancel"]').click();
 /* a view in Ctrl K */
 await page.keyboard.press('Control+k');await page.locator('#pal-input').fill('memo');assert.match(await page.locator('#pal-list').innerText(),/View · memo TODO/);
 await page.locator('#pal-list .pal-item',{hasText:'View · memo TODO'}).first().click();await page.locator('.work-tools').waitFor();assert.equal(await page.locator('#work-search').inputValue(),'memo');
 /* a view whose Space was removed says so */
 spaces.length=0;await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="work"]').click();await page.locator('.view-apply').click();
 assert.match(await page.locator('.toast').last().innerText(),/Space for this view no longer exists/);assert.equal(await page.locator('#filter-space').inputValue(),'all');
 await page.locator('.view-remove').click();assert.equal(await page.locator('.view-pill').count(),0);
 spaces.push(SP);

 /* export in Settings */
 await page.locator('.rooms-rail .door[data-room="today"]').click();await page.goto(x.base);
 await page.evaluate(()=>{});await page.locator('[data-action="nav"][data-view="settings"]:visible').first().click().catch(async()=>{await page.locator('.rooms-rail a,.rooms-rail button',{hasText:'Settings'}).first().click()});
 await page.locator('.export-row').waitFor();
 const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-export="tasks"]').click()]);
 assert.match(dl.suggestedFilename(),/^self-tasks-\d{4}-\d{2}-\d{2}\.csv$/);
 const csv=fs.readFileSync(await dl.path(),'utf8');assert.ok(csv.startsWith('﻿id,title,status,priority,space,due_date'));assert.match(csv,/'=SUM\(A1\) injection title/,'formula-looking text is neutralised');assert.match(csv,/Career/,'Space name, not id');
 assert.match(await page.locator('#export-note').innerText(),/tasks exported/);
 const [dl2]=await Promise.all([page.waitForEvent('download'),page.locator('[data-export="backup"]').click()]);
 const bk=JSON.parse(fs.readFileSync(await dl2.path(),'utf8'));assert.equal(bk.format,'SELF backup');assert.ok(bk.counts.tasks>=4);assert.ok(!JSON.stringify(bk).includes('"user_id"'));assert.ok('people' in bk.data,'Career tables are included after loading');

 /* phone */
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5')});
 await noOverflow('settings');await page.locator('.rooms-bar .door[data-room="work"]').click();await page.locator('.work-tools').waitFor();await page.locator('[data-work="select-mode"]').click();
 await page.locator('.work-select').first().click();await noOverflow('work with the bulk bar');
 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Work tools browser: selection (checkbox, range, row click, X, hidden tasks), bulk status/priority/due/Space, partial failure + Undo, in-page delete confirm, saved views (apply, replace, stale Space, Ctrl K), Export, 390px.');
})().catch(e=>{console.error(e);process.exit(1)});
