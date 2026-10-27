/* Real-browser check of the Calendar page against a synthetic API. Never touches production. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const today=new Date().toLocaleDateString('en-CA');
 const day=n=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA')};
 const T=(id,title,due)=>({id,user_id:fixture.user.id,title,status:'todo',priority:'normal',due_date:due,description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222';
 fixture.tasks.push(T(A,'Calendar deadline task',day(1)),T(B,'Floating task',null));
 const patches=[];
 page.on('request',r=>{if(r.method()==='PATCH'&&/\/tasks/.test(r.url()))patches.push(r.postDataJSON())});
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()==='PATCH'&&url.pathname.endsWith('/tasks')){const id=url.searchParams.get('id')?.slice(3),row=fixture.tasks.find(t=>t.id===id);Object.assign(row,req.postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([row])})}
  return route.fallback();
 });
 await page.goto(x.base);await page.locator('.shell[data-shell="rooms"]').waitFor();
 await page.locator('.rooms-rail .door[data-room="calendar"]').click();
 await page.locator('[data-cal-root]').waitFor();
 assert.equal(await page.locator('.shell').getAttribute('data-room'),'calendar');
 assert.ok(await page.locator('.cal-chip',{hasText:'Calendar deadline task'}).count()>=1,'deadline shows on the month grid');
 assert.ok(await page.locator('.cal-tray .cal-chip',{hasText:'Floating task'}).count()===1,'unscheduled task is in the tray');

 /* drag the tray task onto a day: one PATCH with that date */
 const target=day(2);
 await page.evaluate(([id,date])=>{
  const dt=new DataTransfer();
  const chip=document.querySelector('[data-cal-drag="'+id+'"]'),cell=document.querySelector('[data-cal-drop="'+date+'"]');
  chip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
 },[B,target]);
 await page.waitForFunction(d=>!!document.querySelector('[data-cal-drop="'+d+'"] [data-cal-drag]'),target);
 assert.equal(patches.length,1,'exactly one save');assert.equal(patches[0].due_date,target);
 assert.equal(await page.locator('.cal-tray').count(),0,'tray gone once nothing is unscheduled');

 /* + on a day opens New Task with the due date filled in */
 await page.locator('[data-cal-drop="'+day(3)+'"]').hover();
 await page.locator('[data-cal-drop="'+day(3)+'"] .cal-add').click();
 assert.equal(await page.locator('#create-task-form input[name="due_date"]').inputValue(),day(3));
 await page.locator('.modal .panel-top button[data-action="close-modal"]').click();

 /* views and Google panel without a Client ID */
 await page.locator('[data-view="agenda"]').click();
 assert.ok(await page.locator('.cal-row-item',{hasText:'Calendar deadline task'}).count()===1);
 assert.match(await page.locator('.cal-link',{hasText:'Add to Google'}).first().getAttribute('href'),/^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
 await page.locator('[data-cal="panel"]').click();
 await page.locator('[data-cal="connect"]').click();
 assert.match(await page.locator('.cal-msg').innerText(),/valid OAuth Client ID/);
 await page.locator('[data-view="week"]').click();assert.equal(await page.locator('.cal-weekview .cal-cell').count(),7);


 /* repeating item: create weekly on today's weekday, appears in the week, survives reload, done/skip/delete */
 await page.locator('[data-view="week"]').click();
 await page.locator('[data-cal="rnew"]').click();
 await page.locator('[data-cal-field="title"]').fill('Weekly review');
 await page.locator('[data-cal="rsave"]').click();
 await page.locator('.cal-routine',{hasText:'Weekly review'}).first().waitFor();
 assert.ok(await page.locator('.cal-weekview .cal-routine',{hasText:'Weekly review'}).count()>=1,'routine shows in the week');
 await page.locator('[data-view="month"]').click();
 await page.locator('[data-cal="next"]').click();
 assert.ok(await page.locator('.cal-month .cal-routine',{hasText:'Weekly review'}).count()>=4,'repeats every week through the next month');
 await page.locator('[data-cal="today"]').click();
 await page.locator('[data-cal="rnew"]').click();await page.locator('[data-cal="rsave"]').click();
 assert.match(await page.locator('.cal-msg').innerText(),/Give it a name/,'empty name is refused visibly');
 await page.locator('[data-cal="rcancel"]').click();
 await page.reload();await page.locator('.rooms-rail .door[data-room="calendar"]').click();await page.locator('.cal-routine').first().waitFor();
 assert.ok(await page.locator('.cal-routine',{hasText:'Weekly review'}).count()>=1,'saved routine survives a reload');
 const before=await page.locator('.cal-routine',{hasText:'Weekly review'}).count();
 await page.locator('.cal-routine',{hasText:'Weekly review'}).first().click();
 await page.locator('[data-cal="rdone"]').click();
 assert.equal(await page.locator('.cal-routine.u-done').count(),1,'one occurrence ticked off');
 await page.locator('[data-cal="rskip"]').click();
 assert.equal(await page.locator('.cal-routine',{hasText:'Weekly review'}).count(),before-1,'skipped occurrence disappears');
 page.once('dialog',d=>d.accept());await page.locator('[data-cal="rdelete"]').click();
 await page.waitForFunction(()=>!document.querySelector('.cal-routine'));
 /* phone: no horizontal overflow */
 await page.setViewportSize({width:390,height:800});await page.locator('[data-view="month"]').click();
 {const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,'calendar overflows: '+JSON.stringify(d))}

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Calendar browser: door, deadlines, tray drag with one save, prefilled new task, agenda + Add to Google link, Google panel validation, week view, repeating items (create, reload, done, skip, delete), 390px no overflow');
})().catch(e=>{console.error(e);process.exit(1)});
