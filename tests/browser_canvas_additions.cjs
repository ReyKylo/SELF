/* Canvas additions in a real browser against a synthetic API: Ctrl/Cmd+F find, Ctrl/Cmd+1..9 frames and +0 fit,
   C + arrows + Enter connects, a pasted list becomes stickies, far zoom (under 30%) turns cards into blocks, delete offers Undo, / opens insert. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';
(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id,now='2026-10-24T00:00:00Z';
 const db={boards:[],knowledge_cards:[],board_items:[],board_edges:[]};let seq=0;
 const uid=p=>p+String(++seq).padStart(7,'0')+'-0000-4000-8000-000000000000';
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();
  if(m==='GET')return json(db[table]);
  const id=url.searchParams.get('id')?.slice(3);
  if(m==='POST'){const row={id:uid(table[0]),user_id:U,created_at:now,updated_at:now,...req.postDataJSON()};db[table].push(row);return json([row],201)}
  if(m==='PATCH'){const row=db[table].find(r=>r.id===id);if(row)Object.assign(row,req.postDataJSON());return json(row?[row]:[])}
  if(m==='DELETE'){db[table]=db[table].filter(r=>r.id!==id);return json([])}
  return route.fallback();
 });
 const mod=process.platform==='darwin'?'Meta':'Control';
 const cam=()=>page.locator('#c3-world').evaluate(e=>e.style.transform);
 const settle=(ms=700)=>page.waitForTimeout(ms);

 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="studio"]').click();await page.locator('[data-c3="new-board"]').first().click();
 await page.locator('select[name="recipe_id"]').waitFor();
 await page.locator('input[name="title"]').fill('Case map');await page.locator('select[name="recipe_id"]').selectOption('issue-tree');await page.locator('#c3-modal-form button[type="submit"]').click();
 await page.locator('#c3-canvas').waitFor();await settle(2500);
 const start=db.board_items.length;assert.equal(start,17);
 await page.locator('#c3-canvas').focus();

 /* 1. Find: highlights every match and counts them; Enter moves the camera; Escape closes */
 await page.keyboard.press(mod+'+f');await page.locator('#c3-find-q').waitFor();
 await page.keyboard.type('hypothes');
 await page.waitForFunction(()=>document.querySelectorAll('.c3-match').length>0);
 const n=await page.locator('.c3-match').count();assert.ok(n>=2,'several matches: '+n);
 assert.match(await page.locator('#c3-find-n').innerText(),new RegExp('1 of '+n));
 const c1=await cam();await page.keyboard.press('Enter');await settle(200);
 assert.match(await page.locator('#c3-find-n').innerText(),new RegExp('2 of '+n));assert.notEqual(await cam(),c1,'Enter centres the next match');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.c3-match').count(),0);assert.equal(await page.locator('#c3-find').isHidden(),true);

 /* 2. Ctrl/Cmd+2 flies to frame 2 and selects it; Ctrl/Cmd+0 fits all */
 await page.locator('#c3-canvas').focus();
 const c2=await cam();await page.keyboard.press(mod+'+2');await settle(300);
 assert.notEqual(await cam(),c2,'camera moved to frame 2');
 const sel=await page.locator('[data-c3-item].selected').getAttribute('data-c3-item');
 assert.equal(db.board_items.find(i=>i.id===sel)?.visual_kind,'frame','frame 2 is selected');
 await page.keyboard.press(mod+'+0');await settle(300);

 /* 3. Keyboard connect: select a card, C, arrow, Enter */
 const edges0=db.board_edges.length;
 const target=db.board_items.find(i=>i.visual_kind!=='frame');
 await page.locator('[data-c3-item="'+target.id+'"]').click();await settle(200);
 await page.keyboard.press('Escape');await page.locator('[data-c3-item="'+target.id+'"]').click();await settle(200);
 await page.locator('#c3-canvas').focus();await page.evaluate(id=>{document.querySelector('[data-c3-item="'+id+'"]')},target.id);
 await page.keyboard.press('c');await page.locator('#c3-kc').waitFor();
 assert.match(await page.locator('#c3-kc').innerText(),/Connect “.+” → /);
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await settle(900);
 assert.equal(db.board_edges.length,edges0+1,'one connector added from the keyboard');
 assert.equal(db.board_edges.at(-1).source_item_id,target.id);
 assert.equal(await page.locator('#c3-kc').count(),0,'banner gone');

 /* 4. Paste a list: three stickies in a column */
 await page.locator('#c3-canvas').focus();
 await page.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','- Price\n- Volume\n- Mix');document.querySelector('#c3-canvas').dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}))});
 await page.waitForFunction(s=>document.querySelectorAll('[data-c3-item]').length>=s+3,start);await settle(600);
 const stickies=db.board_items.filter(i=>i.visual_kind==='sticky');
 const titles=stickies.map(i=>db.knowledge_cards.find(c=>c.id===i.card_id)?.title);
 assert.deepEqual(titles.slice(-3),['Price','Volume','Mix'],'one sticky per line, bullets stripped');
 const ys=stickies.slice(-3).map(i=>i.y);assert.ok(ys[0]<ys[1]&&ys[1]<ys[2],'a column, top to bottom');

 /* 5. Delete shows Undo; Undo brings it back */
 const last=stickies.at(-1);await page.locator('[data-c3-item="'+last.id+'"]').click();await settle(200);
 await page.keyboard.press('Escape');await page.locator('[data-c3-item="'+last.id+'"]').click();await settle(200);
 const before=db.board_items.length;await page.keyboard.press('Delete');
 await page.locator('.toast-undo').waitFor();assert.match(await page.locator('.toast-undo').innerText(),/1 object removed/);
 await page.waitForFunction(b=>document.querySelectorAll('[data-c3-item]').length===b-1,before);
 await page.locator('.toast-undo button').click();
 await page.waitForFunction(b=>document.querySelectorAll('[data-c3-item]').length===b,before);
 assert.equal(db.board_items.length,before,'Undo restored the object');

 /* 6. Far zoom: the canvas switches to blocks under 30% */
 await page.locator('#c3-canvas').focus();
 for(let i=0;i<8;i++){await page.locator('[aria-label="Zoom out"]').first().click();}
 await settle(300);
 const far=await page.evaluate(()=>document.querySelector('#c3-canvas').classList.contains('c3-far'));
 const z=await page.locator('#c3-zoom-label').innerText();
 assert.equal(far,parseInt(z)<30,'c3-far follows the zoom ('+z+')');
 assert.ok(parseInt(z)<30,'zoomed out under 30%: '+z);

 /* 7. "/" opens the insert menu */
 await page.locator('#c3-canvas').focus();await page.keyboard.press('/');
 await page.locator('#c3-quick-add').waitFor();await page.keyboard.press('Escape');

 /* 8. Type to create: edit a card, Tab makes a connected sticky that is ready to type in; Alt+Enter makes a sibling */
 await page.keyboard.press(mod+'+0');await settle(400);
 const src=db.board_items.find(i=>i.visual_kind!=='frame');
 await page.locator('[data-c3-item="'+src.id+'"]').click();await page.keyboard.press('Enter');
 await page.locator('[data-d-editor]').first().waitFor({state:'attached'});
 const items0=db.board_items.length,edges1=db.board_edges.length;
 await page.keyboard.press('Tab');
 await page.waitForFunction(n=>document.querySelectorAll('[data-c3-item]').length>n,items0);await settle(900);
 assert.equal(db.board_items.length,items0+1,'Tab created one object');
 assert.equal(db.board_edges.length,edges1+1,'and connected it');
 assert.equal(db.board_edges.at(-1).source_item_id,src.id);
 await page.locator('[data-d-editor]').first().waitFor({state:'attached'});
 await page.keyboard.type('Next idea');await page.keyboard.press('Alt+Enter');
 await page.waitForFunction(n=>document.querySelectorAll('[data-c3-item]').length>n,items0+1);await settle(900);
 assert.equal(db.board_items.length,items0+2,'Alt+Enter made a sibling');
 assert.equal(db.board_edges.length,edges1+1,'a sibling is not connected');
 assert.ok(db.knowledge_cards.some(c=>/Next idea/.test(c.title+c.body+JSON.stringify(c.content_blocks||''))),'typed text was saved');
 assert.deepEqual(errors,[]);
 await x.browser.close();console.log('browser_canvas_additions: ok');
})().catch(e=>{console.error(e);process.exit(1)});
