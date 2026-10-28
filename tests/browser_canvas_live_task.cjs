/* A canvas card linked to a task shows that task live: status and due date from Work, overdue and done states, and a removed task. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
const SUPA='https://btiwxqjiptbwaunjibjh.supabase.co/**';
(async()=>{
 const x=await launch();const {page,context,fixture,errors}=x;
 const U=fixture.user.id,now='2026-10-24T00:00:00Z',day=new Date().toLocaleDateString('en-CA');
 const T=(id,title,status,due)=>({id,user_id:U,title,status,priority:'normal',due_date:due,description:'',notes:'',space_id:null,created_at:now,updated_at:now});
 const t1='11111111-1111-4111-8111-111111111111',t2='22222222-2222-4222-8222-222222222222';
 fixture.tasks.push(T(t1,'Get backhaul contracts','in_progress','2026-01-05'),T(t2,'Pull fleet data','done',day));
 const b='b0000001-0000-4000-8000-000000000000';
 const db={boards:[{id:b,user_id:U,title:'Live board',space_id:null,pan_x:0,pan_y:0,zoom:1,created_at:now,updated_at:now}],
  knowledge_cards:[1,2,3].map(n=>({id:'c000000'+n+'-0000-4000-8000-000000000000',user_id:U,title:'Card '+n,kind:'task',summary:'',body:'',key_points:'',accent:'blue',url:null,task_id:[t1,t2,'99999999-9999-4999-8999-999999999999'][n-1],target_board_id:null,asset_path:null,created_at:now,updated_at:now})),
  board_items:[1,2,3].map(n=>({id:'i000000'+n+'-0000-4000-8000-000000000000',user_id:U,board_id:b,card_id:'c000000'+n+'-0000-4000-8000-000000000000',visual_kind:'knowledge',x:100+n*300,y:120,w:260,h:160,z:n,style:{},rotation:0,created_at:now,updated_at:now})),board_edges:[]};
 await context.route(SUPA,async route=>{const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),m=req.method(),json=(o,s=200)=>route.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
  if(!(table in db))return route.fallback();if(m==='GET')return json(db[table]);return json([]);});
 await page.goto(x.base);await page.locator('.rooms-rail .door[data-room="studio"]').click();
 await page.locator('text=Live board').first().click();await page.locator('#c3-canvas').waitFor();await page.waitForTimeout(800);
 const chips=await page.locator('.d-chip-live').allInnerTexts();
 assert.equal(chips.length,3);
 assert.match(chips[0],/In Progress · 5 Jan · overdue/);assert.match(chips[1],/Done/);assert.match(chips[2],/Task removed/);
 assert.equal(await page.locator('.d-chip-live.is-late').count(),1);assert.equal(await page.locator('.d-chip-live.is-done').count(),1);assert.equal(await page.locator('.d-chip-gone').count(),1);
 assert.deepEqual(errors,[]);
 await x.browser.close();console.log('browser_canvas_live_task: ok');
})().catch(e=>{console.error(e);process.exit(1)});
