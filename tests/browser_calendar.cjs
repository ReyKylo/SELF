/* Real-browser check of the Calendar page against a synthetic API. Never touches production.
   Set CAL_SHOTS=/some/dir to also save screenshots. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';

(async()=>{
 const x=await launch({viewport:{width:1440,height:900}});const {page,context,fixture,errors}=x;
 const shots=process.env.CAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:shots+'/'+n+'.png'})};
 const today=new Date().toLocaleDateString('en-CA');
 const day=n=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA')};
 const T=(id,title,due,o={})=>({id,user_id:fixture.user.id,title,status:'todo',priority:'normal',due_date:due,description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',...o});
 const A='aaaaaaaa-1111-4111-8111-111111111111',B='bbbbbbbb-2222-4222-8222-222222222222',C='cccccccc-3333-4333-8333-333333333333';
 fixture.tasks.push(T(A,'Submit case memo',today,{priority:'high'}),T(B,'Floating task',null),T(C,'Overdue report',day(-2)));
 const patches=[];
 page.on('request',r=>{if(r.method()==='PATCH'&&/\/tasks/.test(r.url()))patches.push(r.postDataJSON())});
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()==='PATCH'&&url.pathname.endsWith('/tasks')){const id=url.searchParams.get('id')?.slice(3),row=fixture.tasks.find(t=>t.id===id);Object.assign(row,req.postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([row])})}
  return route.fallback();
 });
 await page.goto(x.base);await page.locator('.shell[data-shell="rooms"]').waitFor();
 await page.locator('.rooms-rail .door[data-room="calendar"]').click();
 await page.locator('[data-cal-body]').waitFor();
 assert.equal(await page.locator('.shell').getAttribute('data-room'),'calendar');
 assert.equal(await page.locator('.cal-col').count(),7,'week view is a 7-column time grid');
 assert.ok(await page.locator('.cal-adcell .cal-task',{hasText:'Submit case memo'}).count()===1,'deadline sits in the all-day lane');
 assert.equal(await page.locator('.cal-now').count(),1,'now-line on today');
 await shot('01-week');

 /* drag on empty space creates an event (09:00 to 11:00 today) */
 const col=page.locator('.cal-col[data-cal-day="'+today+'"]');
 const b=await col.boundingBox();
 const y9=b.y+9*64;
 await page.mouse.move(b.x+b.width/2,y9+4);await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,y9+60,{steps:5});await page.mouse.move(b.x+b.width/2,y9+124,{steps:5});
 assert.ok(await page.locator('.cal-ghost').count()===1,'ghost block while dragging');
 await page.mouse.up();
 await page.locator('.cal-dialog').waitFor();
 await page.locator('[data-cal-field="title"]').fill('Deep work');
 await page.locator('[data-cal="dsave"]').click();
 const blk=page.locator('.cal-block[data-event-id]',{hasText:'Deep work'});
 await blk.waitFor();
 const s0=Number(await blk.getAttribute('data-start')),e0=Number(await blk.getAttribute('data-end'));
 assert.ok(e0-s0>=105&&e0-s0<=135&&s0>=525&&s0<=555,'created around 09:00-11:00, got '+s0+'-'+e0);
 assert.equal(s0%15,0,'snaps to 15 minutes');
 await shot('02-created');

 /* drag the block one hour down: start moves by exactly 60 */
 let bb=await blk.boundingBox();
 await page.mouse.move(bb.x+bb.width/2,bb.y+20);await page.mouse.down();
 await page.mouse.move(bb.x+bb.width/2,bb.y+50,{steps:4});await page.mouse.move(bb.x+bb.width/2,bb.y+20+64,{steps:4});await page.mouse.up();
 await page.waitForFunction(([id,s])=>Number(document.querySelector('[data-event-id="'+id+'"]')?.dataset.start)!==s,[await blk.getAttribute('data-event-id'),s0]);
 const s1=Number(await blk.getAttribute('data-start'));
 assert.equal(s1-s0,60,'moved down one hour');

 /* resize from the bottom edge: +30 minutes */
 bb=await blk.boundingBox();
 await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height-3);await page.mouse.down();
 await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height+10,{steps:4});await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height-3+32,{steps:4});await page.mouse.up();
 await page.waitForFunction(([id,e])=>Number(document.querySelector('[data-event-id="'+id+'"]')?.dataset.end)!==e,[await blk.getAttribute('data-event-id'),e0+60]);
 assert.equal(Number(await blk.getAttribute('data-end'))-(e0+60),30,'resized by 30 minutes');

 /* an overlapping event sits side by side */
 await page.locator('[data-cal="newevent"]').click();
 await page.locator('[data-cal-field="title"]').fill('Call');
 await page.locator('[data-cal-field="date"]').fill(today);
 await page.locator('[data-cal-field="start"]').fill(String(Math.floor((s1+30)/60)).padStart(2,'0')+':'+String((s1+30)%60).padStart(2,'0'));
 await page.locator('[data-cal="dsave"]').click();
 await page.locator('.cal-block[data-event-id]',{hasText:'Call'}).waitFor();
 {const w=await page.locator('.cal-block[data-event-id]').evaluateAll(n=>n.map(e=>e.getBoundingClientRect().width));
  const colw=(await col.boundingBox()).width;assert.ok(w.every(v=>v<colw*0.75),'overlapping blocks are narrower than the column: '+w.join(','))}
 await shot('03-overlap');

 /* click opens the popover; repeat weekly through Edit */
 await blk.click();
 await page.locator('.cal-pop').waitFor();
 assert.match(await page.locator('.cal-pop h3').innerText(),/Deep work/);
 await page.locator('.cal-pop [data-cal="pedit"]').click();
 await page.locator('[data-cal-field="rfreq"]').selectOption('weekly');
 await page.locator('[data-cal="dsave"]').click();
 await page.locator('.cal-block[data-event-id]',{hasText:'Deep work'}).waitFor();
 assert.ok(await page.locator('.cal-block[data-event-id][data-locked]',{hasText:'↻ Deep work'}).count()>=1,'repeating block is marked');
 await page.locator('[data-cal="next"]').click();
 assert.ok(await page.locator('.cal-block',{hasText:'Deep work'}).count()>=1,'repeats into next week');
 await page.locator('[data-cal="today"]').click();

 /* month view: hairline grid, pills, deadline drag = exactly one PATCH */
 await page.locator('[data-cal="view"][data-view="month"]').click();
 await page.locator('.cal-mgrid').waitFor();
 assert.ok(await page.locator('.cal-mcell .cal-task',{hasText:'Submit case memo'}).count()===1);
 assert.ok(await page.locator('.cal-mcell .cal-pill',{hasText:'Deep work'}).count()>=1);
 await shot('04-month');
 const target=(await page.locator('[data-cal-drop="'+day(1)+'"]').count())?day(1):day(-1);
 await page.evaluate(([id,date])=>{
  const dt=new DataTransfer();
  const chip=document.querySelector('.cal-mcell [data-cal-drag="'+id+'"]'),cell=document.querySelector('.cal-mcell[data-cal-drop="'+date+'"]');
  chip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
 },[A,target]);
 await page.waitForFunction(d=>!!document.querySelector('.cal-mcell[data-cal-drop="'+d+'"] [data-cal-drag]'),target);
 assert.equal(patches.length,1,'exactly one save');assert.equal(patches[0].due_date,target);

 /* tasks panel: drag a no-deadline task onto a day */
 assert.ok(await page.locator('.cal-side .cal-titem',{hasText:'Floating task'}).count()===1,'no-deadline task listed in the panel');
 assert.ok(await page.locator('.cal-side .cal-sgroup.overdue').count()===1,'overdue group shown');
 await page.evaluate(([id,date])=>{
  const dt=new DataTransfer();
  const chip=document.querySelector('.cal-side [data-cal-drag="'+id+'"]'),cell=document.querySelector('.cal-mcell[data-cal-drop="'+date+'"]');
  chip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
  cell.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
 },[B,today]);
 await page.waitForFunction(()=>!document.querySelector('.cal-side .cal-sgroup.none'));
 assert.equal(patches.length,2);assert.equal(patches[1].due_date,today);

 /* task popover actions */
 await page.locator('.cal-mcell .cal-task',{hasText:'Floating task'}).click();
 await page.locator('.cal-pop').waitFor();
 assert.match(await page.locator('.cal-pop a',{hasText:'Add to Google'}).getAttribute('href'),/^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
 await page.keyboard.press('Escape');

 /* agenda, Google panel validation, week/day */
 await page.locator('[data-cal="view"][data-view="agenda"]').click();
 assert.ok(await page.locator('.cal-arow',{hasText:'Overdue report'}).count()===1);
 await page.locator('[data-cal="panel"]').click();
 await page.locator('[data-cal="connect"]').click();
 assert.match(await page.locator('.cal-msg').innerText(),/valid OAuth Client ID/);
 await page.locator('[data-cal="panel"]').click();
 await page.keyboard.press('d');
 await page.locator('.cal-col').first().waitFor();assert.equal(await page.locator('.cal-col').count(),1,'D shortcut opens day view');
 await page.keyboard.press('w');assert.equal(await page.locator('.cal-col').count(),7,'W shortcut opens week view');

 /* delete a repeating event through the popover (with confirm) */
 page.once('dialog',d=>d.accept());
 await page.locator('.cal-block[data-event-id]',{hasText:'Deep work'}).first().click();
 await page.locator('.cal-pop [data-cal="pdel"]').click();
 await page.waitForFunction(()=>![...document.querySelectorAll('.cal-block')].some(e=>/Deep work/.test(e.textContent)));

 /* survives a reload (stored per account) */
 await page.reload();await page.locator('.rooms-rail .door[data-room="calendar"]').click();await page.locator('[data-cal-body]').waitFor();
 assert.ok(await page.locator('.cal-block',{hasText:'Call'}).count()>=1,'saved event survives a reload');

 /* phone: 3-day window, no horizontal overflow */
 await page.setViewportSize({width:390,height:800});
 await page.locator('[data-cal="view"][data-view="week"]').click();
 assert.equal(await page.locator('.cal-col').count(),3,'phone shows a 3-day window');
 {const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,'week overflows: '+JSON.stringify(d))}
 await shot('05-phone');
 await page.locator('[data-cal="view"][data-view="month"]').click();
 {const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,'month overflows: '+JSON.stringify(d))}

 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Calendar browser: time grid, drag-create/move/resize with snapping, side-by-side overlaps, popover, repeat, month pills, deadline + tasks-panel drag with one save each, agenda, Google validation, shortcuts, persistence, 390px');
})().catch(e=>{console.error(e);process.exit(1)});
