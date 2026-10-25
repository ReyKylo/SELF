/* Studio recipes and Walkthrough in a real browser against a synthetic API: a recipe creates exactly its cards, items and edges; Present steps through frames in chain order,
   moves the camera, never writes, blocks editing and restores the camera; empty boards say what to do; Company Map fills from a form; a mid-creation failure is reported. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';
(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id,now='2026-10-24T00:00:00Z';
 const db={boards:[],knowledge_cards:[],board_items:[],board_edges:[]};let seq=0;const writes=[];let failItemAt=0,itemPosts=0;
 const uid=p=>p+String(++seq).padStart(7,'0')+'-0000-4000-8000-000000000000';
 await context.route(SUPA,async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();
  if(m==='GET')return json(db[table]);
  const id=url.searchParams.get('id')?.slice(3);
  if(m==='POST'){const body=req.postDataJSON();if(table==='board_items'&&failItemAt&&++itemPosts===failItemAt)return json({message:'Synthetic insert failure'},503);
   const row={id:uid(table[0]),user_id:U,created_at:now,updated_at:now,...body};db[table].push(row);writes.push({m,table,body});return json([row],201)}
  if(m==='PATCH'){const row=db[table].find(r=>r.id===id);if(row)Object.assign(row,req.postDataJSON());writes.push({m,table,id});return json(row?[row]:[])}
  if(m==='DELETE'){db[table]=db[table].filter(r=>r.id!==id);writes.push({m,table,id});return json([])}
  return route.fallback();
 });
 const counts=()=>Object.fromEntries(Object.entries(db).map(([k,v])=>[k,v.length]));
 const settle=async(ms=700)=>page.waitForTimeout(ms);
 const items=()=>page.locator('[data-c3-item]');
 const noOverflow=async l=>{const d=await page.evaluate(()=>({s:document.documentElement.scrollWidth,v:innerWidth}));assert.ok(d.s<=d.v+1,l+' overflows '+JSON.stringify(d))};
 const cam=async()=>page.locator('#c3-world').evaluate(e=>e.style.transform);

 /* 1. new board from a recipe */
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="studio"]').click();await page.locator('[data-c3="new-board"]').first().click();
 await page.locator('select[name="recipe_id"]').waitFor();
 const opts=await page.locator('select[name="recipe_id"] option').allInnerTexts();
 assert.deepEqual(opts,['Blank board','Issue Tree · Consulting','Deal Thesis · PE','IC Memo Spine · VC','Story Bank · Interviews','Weekly Map · Rituals'],'Company Map needs a company, so it is offered from an empty board instead');
 await page.locator('input[name="title"]').fill('Case map');await page.locator('select[name="recipe_id"]').selectOption('issue-tree');await page.locator('#c3-modal-form button[type="submit"]').click();
 await page.locator('#c3-canvas').waitFor();await settle(2500);
 assert.deepEqual(counts(),{boards:1,knowledge_cards:17,board_items:17,board_edges:7},'issue tree: 5 frames, 11 prompt cards and the guide; 4 chain edges and 3 links');
 assert.equal(await items().count(),17);assert.match(await page.locator('.c3-shell').innerText(),/Structure guide/);
 assert.equal(db.board_items.filter(i=>i.visual_kind==='frame').length,5);
 assert.ok(db.knowledge_cards.some(c=>c.title==='Key question'&&/what decision/.test(c.summary)),'cards carry their prompt text');
 assert.ok(db.board_items.every(i=>Number.isFinite(i.x)&&i.w>0&&i.z>0),'items have geometry and z');

 /* 2. Present: steps in chain order, camera moves, nothing is written */
 const before=writes.length,camBefore=await cam();
 await page.locator('[data-c3="present"]').click();await page.locator('#present-bar').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('is-presenting')),true);
 const info=async()=>({count:await page.locator('.pr-count').innerText(),title:await page.locator('.pr-info strong').innerText()});
 assert.deepEqual(await info(),{count:'1 / 5',title:'How to use this'});
 const cam1=await cam();assert.notEqual(cam1,camBefore,'the camera moved to the first frame');
 await page.keyboard.press('ArrowRight');assert.deepEqual(await info(),{count:'2 / 5',title:'1 · Key question'});
 const cam2=await cam();assert.notEqual(cam2,cam1);
 await page.keyboard.press('Space');assert.equal((await info()).title,'2 · Branches (MECE)');
 await page.locator('[data-present="next"]').click();assert.equal((await info()).title,'3 · Hypotheses');
 await page.keyboard.press('ArrowLeft');assert.equal((await info()).title,'2 · Branches (MECE)');
 await page.keyboard.press('End');assert.deepEqual(await info(),{count:'5 / 5',title:'4 · Analyses to run'});assert.equal(await page.locator('[data-present="next"]').isDisabled(),true);
 await page.keyboard.press('Home');assert.equal((await info()).count,'1 / 5');assert.equal(await page.locator('[data-present="prev"]').isDisabled(),true);
 /* the board cannot be edited while presenting */
 await items().first().dblclick({force:true});await page.keyboard.press('Delete');await page.keyboard.press('Control+a');await page.keyboard.press('n');
 const b=await items().nth(3).boundingBox();await page.mouse.move(b.x+20,b.y+20);await page.mouse.down();await page.mouse.move(b.x+160,b.y+90,{steps:5});await page.mouse.up();
 assert.equal(await page.locator('.c3-modal').count(),0,'no dialogs');assert.equal(await page.locator('[data-d-editor]:visible').count(),0,'no editor opens');
 /* target time and pace */
 await page.locator('[data-present-target]').fill('5');assert.match(await page.locator('#pr-clock').innerText(),/^\d\d:\d\d( · (on pace|\d\d:\d\d (ahead|behind)))?$/);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#present-bar').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('is-presenting')),false);
 await settle(300);assert.equal(await cam(),camBefore,'the camera returns to where it was');
 assert.equal(writes.length,before,'presenting never writes: no inserts, patches or deletes ('+JSON.stringify(writes.slice(before))+')');
 assert.equal(await items().count(),17,'no card was removed or added');

 /* 3. an empty board says what to do */
 await page.locator('[data-c3="back"]').click();await page.locator('[data-c3="new-board"]').first().click();await page.locator('input[name="title"]').fill('Empty');await page.locator('#c3-modal-form button[type="submit"]').click();await page.locator('#c3-canvas').waitFor();await settle(900);
 await page.locator('[data-c3="present"]').click();assert.match(await page.locator('.toast').last().innerText(),/Add frames to present: each frame becomes a step/);assert.equal(await page.locator('#present-bar').count(),0);
 /* a recipe cannot be applied over content: the button only exists on an empty board */
 assert.equal(await page.locator('[data-c3="recipes"]').count(),1);

 /* 4. Company Map from the empty board: needs a company, then fills the title and one card per person */
 const total=counts();
 await page.locator('[data-c3="recipes"]').click();await page.locator('.c3-recipes').waitFor();
 assert.equal(await page.locator('.c3-recipe').count(),6);
 await page.locator('.c3-recipe',{hasText:'Company Map'}).click();await page.locator('#c3-modal-form button[type="submit"]').click();await settle(500);
 assert.match(await page.locator('.c3-error').innerText(),/Fill in: company/);assert.deepEqual(counts(),total,'nothing was created');
 await page.locator('input[name="company"]').fill('Northstar Capital');await page.locator('textarea[name="people"]').fill('Sari Anindya, Associate\nRina Wulandari, VP, Investments\n');
 await page.locator('#c3-modal-form button[type="submit"]').click();await settle(2500);
 const made=db.knowledge_cards.slice(total.knowledge_cards);
 assert.ok(made.some(c=>c.title==='Northstar Capital'),'the frame title uses the company');
 assert.equal(made.filter(c=>c.title==='Sari Anindya'&&c.summary==='Associate').length,1,'a person becomes a card with their role');
 assert.equal(made.filter(c=>c.title==='Rina Wulandari'&&c.summary==='VP, Investments').length,1,'a comma inside the role is kept');
 assert.equal(made.filter(c=>/^Person \d$/.test(c.title)).length,0,'no placeholder people when real ones are given');

 /* 5. a failure in the middle is reported and the board stays usable */
 await page.locator('[data-c3="back"]').click();await page.locator('[data-c3="new-board"]').first().click();await page.locator('input[name="title"]').fill('Half');await page.locator('#c3-modal-form button[type="submit"]').click();await page.locator('#c3-canvas').waitFor();await settle(900);
 failItemAt=itemPosts+4;await page.locator('[data-c3="recipes"]').click();await page.locator('.c3-recipe',{hasText:'Weekly Map'}).click();await page.locator('#c3-modal-form button[type="submit"]').click();await settle(2500);
 assert.match(await page.locator('.toast').last().innerText(),/Recipe incomplete: Synthetic insert failure/);failItemAt=0;
 assert.equal(await page.locator('.c3-shell').count(),1,'the editor is still there');

 /* 6. Present on a phone: the strip wraps and never widens the page */
 await page.goto(x.base);await page.setViewportSize({width:390,height:844});await page.locator('.rooms-bar .door[data-room="studio"]').click();
 await page.locator('.c3-lib-card:not(.c3-lib-new)',{hasText:'Case map'}).first().click();await page.locator('#c3-canvas').waitFor();await settle(800);
 await page.locator('[data-c3="present"]').click();await page.locator('#present-bar').waitFor();await noOverflow('present bar at 390');
 assert.equal((await page.locator('.pr-count').innerText()),'1 / 5');await page.locator('[data-present="next"]').click();assert.equal((await page.locator('.pr-count').innerText()),'2 / 5');
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Studio browser: recipe creates exact cards, items and edges; Present steps in chain order, moves the camera, blocks editing, never writes and restores the camera; empty board message; Company Map fill; mid-creation failure; 390px.');
})().catch(e=>{console.error(e);process.exit(1)});
