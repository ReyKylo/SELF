/* Real-browser check: task property changes in Task Details come with Undo, and going offline is shown as a state, in words. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');

(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const id='11111111-1111-4111-8111-111111111111';
 fixture.tasks.push({id,user_id:fixture.user.id,title:'Finish DCF model',status:'todo',priority:'normal',due_date:null,description:'',notes:'',space_id:null,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 const patches=[];page.on('request',r=>{if(r.method()==='PATCH'&&r.url().includes('/rest/v1/tasks'))patches.push(r.postDataJSON())});
 await page.goto(x.base);
 await page.locator('.door[data-room="work"]:visible').first().click();
 await page.locator('[data-action="open-task"][data-id="'+id+'"]').first().click();
 const status=page.locator('select[data-task-field="status"]');await status.waitFor();

 /* 1. Change status: saved, toast offers Undo with the new value in words */
 await status.selectOption('done');
 await page.locator('.toast-undo').waitFor();
 assert.match(await page.locator('.toast-undo').innerText(),/Status → Done/);
 assert.equal(fixture.tasks[0].status,'done');

 /* 2. Undo restores the previous value */
 await page.locator('.toast-undo button').click();
 await page.locator('.toast',{hasText:'Change undone'}).waitFor();
 assert.equal(fixture.tasks[0].status,'todo');
 assert.deepEqual(patches.map(p=>p.status),['done','todo']);

 /* 3. Priority too */
 await page.locator('select[data-task-field="priority"]').selectOption('high');
 await page.locator('.toast-undo',{hasText:'Priority → High'}).waitFor();
 assert.equal(fixture.tasks[0].priority,'high');

 /* 4. Offline: the save indicator says Offline and a toast says what it means; back online says so too */
 await context.setOffline(true);
 await page.locator('#save-state',{hasText:'Offline'}).waitFor();
 assert.match(await page.locator('.toast').last().innerText(),/offline/i);
 assert.ok(await page.locator('#save-state.save-offline').count(),'offline styling');
 await context.setOffline(false);
 await page.locator('.toast',{hasText:'Back online'}).waitFor();
 await page.waitForFunction(()=>!document.querySelector('#save-state.save-offline'));

 assert.deepEqual(errors,[]);
 await x.browser.close();console.log('browser_work_undo: ok');
})().catch(e=>{console.error(e);process.exit(1)});
