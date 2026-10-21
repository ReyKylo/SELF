/* SELF Phase 3 Core: real Kanban, reliable saves and accessibility. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const store={
 spaces:[{id:'space1',name:'Finance',icon:'chart',accent:'blue'}],
 tasks:[{id:'task1',user_id:'owner',space_id:'space1',title:'Investment memo',
  status:'todo',priority:'high',due_date:null,description:'',notes:'',
  created_at:'2026-10-20T11:00:00.000Z',updated_at:'2026-10-20T11:00:00.000Z'}],
 task_checklist:[],task_pages:[],task_links:[],inbox:[],boards:[],knowledge_cards:[],
 board_items:[],board_edges:[],preferences:[]
};
let markup='',failPatch=false,failPost=false,patches=0,counter=0;
const localStorage={getItem(){return null},setItem(){},removeItem(){}};
const saveState={
 classList:{toggle(){}},
 attrs:{},
 setAttribute(k,v){this.attrs[k]=v},
 removeAttribute(k){delete this.attrs[k]},
 set innerHTML(v){this.html=v},get innerHTML(){return this.html}
};
const root={set innerHTML(v){markup=v},get innerHTML(){return markup}};
const quick={value:'Draft must survive a failed request',focus(){}};
const card={
 isConnected:true,dataset:{taskDrag:'task1',action:'open-task',id:'task1'},
 classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},
 closest(q){if(q==='[data-task-drag]')return this;return null}
};
const statusNode={dataset:{dropStatus:'planning'},classList:{add(){},remove(){}},
 closest(q){return q==='[data-drop-status]'?this:null}};
const listeners={},doc={
 body:{dataset:{},append(){}},documentElement:{style:{setProperty(){}}},
 querySelector(q){
  if(q==='#app')return root;if(q==='#save-state')return saveState;
  if(q==='#quick-text')return quick;if(q==='[data-task-drag="task1"]')return card;
  return null;
 },
 querySelectorAll(){return []},
 addEventListener(name,cb){(listeners[name]??=[]).push(cb)},
 getElementById(){return null},
 createElement(){return {className:'',innerHTML:'',remove(){}}}
};
function response(code,body){return Promise.resolve({ok:code>=200&&code<300,
 status:code,statusText:String(code),text:async()=>body==null?'':JSON.stringify(body)})}
const mockFetch=(uri,opts={})=>{
 const u=new URL(uri),method=opts.method||'GET',table=u.pathname.split('/').at(-1);
 if(!(table in store))return response(404,{message:'missing table '+table});
 if(method==='GET')return response(200,[...store[table]]);
 if(method==='PATCH'){
  if(failPatch)return response(500,{message:'network rejected update'});
  const id=u.searchParams.get('id')?.replace('eq.','');
  const row=store[table].find(x=>x.id===id);
  if(!row)return response(404,{message:'missing row'});
  Object.assign(row,JSON.parse(opts.body));patches++;return response(200,[row]);
 }
 if(method==='POST'){
  if(failPost)return response(500,{message:'network rejected insert'});
  const row={id:'created'+(++counter),...JSON.parse(opts.body)};
  store[table].push(row);return response(201,[row]);
 }
 if(method==='DELETE')return response(204,null);
 return response(405,{message:'unsupported'});
};
const ctx={console,Date,URL,setTimeout,clearTimeout,fetch:mockFetch,document:doc,
 localStorage,confirm:()=>true,window:{scrollTo(){}},navigator:{}};
vm.createContext(ctx);vm.runInContext(source,ctx);
vm.runInContext("state.user={id:'owner',email:'owner@example.com'};state.spaces=fixture.spaces;state.tasks=fixture.tasks;state.view='work';state.workView='board'",Object.assign(ctx,{fixture:store}));
async function evaluate(expr){return vm.runInContext(expr,ctx)}
async function main(){
 await evaluate('render()');
 assert.match(markup,/data-drop-status="planning"/);
 assert.match(markup,/draggable="true" data-task-drag="task1"/);
 assert.match(markup,/data-stage-task-id="task1"/);
 assert.match(markup,/Drag between stages/);
 assert.equal(store.tasks[0].status,'todo');
 // Native drag status change
 const dataTransfer={effectAllowed:'',dropEffect:'',setData(k,v){this.value=v}};
 ctx.dragStart={target:card,dataTransfer,preventDefault(){}};
 await evaluate('workDragStart(dragStart)');
 assert.equal(dataTransfer.value,'task1');
 assert.equal(await evaluate('state.dragTaskId'),'task1');
 ctx.dragOver={target:statusNode,dataTransfer,preventDefault(){this.prevented=true}};
 await evaluate('workDragOver(dragOver)');
 assert.equal(ctx.dragOver.prevented,true);
 ctx.drop={target:statusNode,preventDefault(){this.prevented=true}};
 await evaluate('workDrop(drop)');
 assert.equal(store.tasks[0].status,'planning');
 assert.equal(await evaluate('state.lastTaskMove.from'),'todo');
 assert.match(markup,/Undo last move/);
 // Undo via real action handler and persist.
 const undoButton={dataset:{action:'undo-stage'},closest(q){return q==='[data-action]'?this:null}};
 ctx.undoEvent={target:undoButton};
 await evaluate('handleAction(undoEvent)');
 assert.equal(store.tasks[0].status,'todo');
 assert.equal(await evaluate('state.lastTaskMove'),null);
 // Dropdown change is keyboard/touch fallback.
 ctx.stageEvent={target:{dataset:{stageTaskId:'task1'},value:'review'}};
 await evaluate('handleChange(stageEvent)');
 assert.equal(store.tasks[0].status,'review');
 const completedPatches=patches;
 // A rejected stage move leaves original status in database and in UI.
 failPatch=true;ctx.stageEvent.target.value='done';
 await evaluate('handleChange(stageEvent)');
 assert.equal(store.tasks[0].status,'review');
 assert.equal(patches,completedPatches);
 assert.match(await evaluate('state.saveError'),/Not saved/);
 assert.match(saveState.html,/Not saved/);
 // Undo button is not consumed after failed undo; retry remains possible.
 failPatch=false;
 await evaluate("moveTaskStatus('task1','planning')");
 assert.equal(store.tasks[0].status,'planning');
 failPatch=true;
 await evaluate('handleAction(undoEvent)');
 assert.equal(store.tasks[0].status,'planning');
 assert.equal(await evaluate('state.lastTaskMove.from'),'review');
 failPatch=false;
 await evaluate('handleAction(undoEvent)');
 assert.equal(store.tasks[0].status,'review');
 // Unsaved text should be visible immediately, not "Saved".
 ctx.inputEvent={target:{dataset:{taskField:'notes'},value:'unsaved'}};
 await evaluate('handleInput(inputEvent)');
 assert.equal(await evaluate('state.savePending'),true);
 assert.match(saveState.html,/Unsaved changes/);
 // Quick capture failure retains typed draft; user doesn't lose text.
 await evaluate("state.view='home';state.captureMode='task'");
 failPost=true;
 await evaluate('quickCapture()');
 assert.equal(store.tasks.length,1);
 assert.equal(await evaluate('state.captureDraft'),quick.value);
 assert.match(saveState.html,/Not saved/);
 failPost=false;
 await evaluate('quickCapture()');
 assert.equal(store.tasks.length,2);
 assert.equal(store.tasks[1].title,quick.value);
 assert.equal(await evaluate('state.captureDraft'),'');
 assert.equal(await evaluate('state.saveError'),null);
 // Shared general links: duplicate URLs render only once even if referenced from 3 places.
 ctx.window.SELFBoards={links:()=>[
  {url:'https://docs.google.com/spreadsheets/d/abc',title:'Finance board source'},
  {url:'https://example.com/research',title:'Board-only research'}
 ],open(id){ctx.openedBoard=id}};
 store.task_links.push({id:'link1',task_id:'task1',url:'https://docs.google.com/spreadsheets/d/abc',title:'Finance sheet'});
 store.inbox.push({id:'inbox1',kind:'link',body:'https://docs.google.com/spreadsheets/d/abc',title:'Saved sheet'});
 await evaluate("state.links=fixture.task_links;state.inbox=fixture.inbox;state.boards=[{id:'board1',title:'DSSA mindmap'}];state.linkSource='all';state.linkSearch=''");
 const inventory=await evaluate('allGeneralLinks()');
 assert.equal(inventory.length,2,'links from different sources deduplicate');
 assert.equal(inventory.find(x=>x.url.includes('spreadsheets')).count,3,'source count preserved');
 const library=await evaluate('renderLinks()');
 assert.match(library,/general library/i,'My Links remains general');
 assert.match(library,/3 references/,'duplicate reference count shown');
 assert.match(library,/data-action="link-source"/,'source filters visible');
 await evaluate("state.linkSource='Whiteboards';state.linkSearch='research'");
 const onlyBoard=await evaluate('renderLinks()');
 assert.match(onlyBoard,/Board-only research/);
 assert.doesNotMatch(onlyBoard,/>Finance sheet</);
 await evaluate("state.search='mindmap'");
 const searchHtml=await evaluate('renderSearch()');
 assert.match(searchHtml,/DSSA mindmap/,'global search includes boards');
 assert.match(searchHtml,/data-action="open-board"/);
 await evaluate("state.search='spreadsheets'");
 assert.match(await evaluate('renderSearch()'),/href="https:\/\/docs.google.com\/spreadsheets\/d\/abc"/);
 // Search result board links open in the existing SELF editor.
 const boardButton={dataset:{action:'open-board',id:'board1'},closest(q){return q==='[data-action]'?this:null}};
 ctx.boardEvent={target:boardButton};
 await evaluate('handleAction(boardEvent)');
 assert.equal(ctx.openedBoard,'board1');

 // No accidental transfer to a Career-specific table.
 assert.equal(Object.keys(store).some(k=>k.startsWith('career_')),false);
 console.log('PASS Core Phase 3: drag/drop, stage select, retryable Undo, failed saves, unsaved edits and safe Quick Capture, general My Links, and global board search.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
