/* SELF Concept D v1.1 regression. node tests/smoke_concept_d.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'canvas-v3.js'),'utf8');
const css=fs.readFileSync(path.join(root,'concept-d.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const handlers={};
const document={
 addEventListener(name,f){(handlers[name]??=[]).push(f)},
 querySelector(){return null},querySelectorAll(){return []}
};
const window={location:{search:''},addEventListener(){}};
class FormDataMock{
 constructor(form){this.fields=form.fields||{}}
 entries(){return Object.entries(this.fields)[Symbol.iterator]()}
}
vm.runInNewContext(js,{window,document,FormData:FormDataMock,URL,URLSearchParams,queueMicrotask,
 crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,console,confirm:()=>true});
const state={view:'boards',spaces:[{id:'sp',name:'Finance'}],boards:[
 {id:'b1',title:'Finance Board',space_id:'sp',pan_x:80,pan_y:70,zoom:1},
 {id:'b2',title:'Research Links',space_id:'sp',pan_x:0,pan_y:0,zoom:1}
],tasks:[{id:'t1',title:'Study cash flow'}],knowledgeCards:[{
 id:'c1',title:'Investment Idea',body:'Initial research memo',key_points:'Margin\nValuation',url:null,
 content_blocks:null,kind:'note'
}],boardItems:[{
 id:'i1',board_id:'b1',card_id:'c1',visual_kind:'rectangle',x:50,y:60,w:300,h:220,z:1,rotation:0,style:{fill:'#517ac1',fontSize:20}
}],boardEdges:[]};
const tables={knowledge_cards:'knowledgeCards',board_items:'boardItems',board_edges:'boardEdges',boards:'boards'};
let calls=0;
const api={
 state:()=>state,render(){},navigate(view){state.view=view},notify(){},reload:async()=>{},
 patch:async(t,id,fields)=>{const r=state[tables[t]].find(x=>x.id===id);assert(r,'record must exist');Object.assign(r,fields);calls++;return r},
 patchSimple:async(t,id,fields)=>{const r=state[tables[t]].find(x=>x.id===id);Object.assign(r,fields);return r},
 insert:async(t,fields)=>{const v={id:'n'+(++calls),...fields};state[tables[t]].push(v);return v},
 del:async(t,id)=>{state[tables[t]]=state[tables[t]].filter(x=>x.id!==id)}
};
window.SELFBoards.init(api);window.SELFBoards.open('b1');
const ui=window.SELFBoards.ui;
ui.selected=new Set(['i1']);
function click(action){
 const el={dataset:{c3:action},classList:{contains(){return false}},closest(q){return q==='[data-c3]'?this:null}};
 return handlers.click[0]({target:el,preventDefault(){},stopPropagation(){}});
}
async function form(type,fields){
 const f={id:'d-popover-form',dataset:{type},fields};
 const event={target:f,preventDefault(){},stopPropagation(){}};
 await handlers.submit[0](event);
}
async function main(){
 let view=window.SELFBoards.renderEditor();
 assert.match(view,/d-toolbar/,'unified toolbar renders with selected shape');
 assert.match(view,/Investment Idea/,'legacy title remains visible without migration');
 assert.match(view,/Initial research memo/,'legacy body remains visible');
 assert.match(view,/Margin/,'legacy key points remain visible');
 assert.doesNotMatch(view,/class="c3-inline"/,'no bordered nested textarea');
 assert(css.includes('.c3-content>.c3-inspector{display:none!important}'),'old inspector hidden');
 assert(html.includes('concept-d.css'),'Concept D stylesheet in shipped HTML');
 await click('d-knowledge');
 view=window.SELFBoards.renderEditor();
 for(const option of ['d-points','d-checklist','d-pop-sources','d-pop-task','d-pop-board','d-pop-files','d-pop-more'])assert(view.includes('data-c3="'+option+'"'),option+' exists in knowledge row');
 await click('d-pop-sources');
 assert.match(window.SELFBoards.renderEditor(),/d-popover-form/);
 await form('sources',{url:'https://idx.co.id/research',title:'IDX research'});
 const c=state.knowledgeCards[0];
 assert.equal(c.url,'https://idx.co.id/research','source link saved to same canonical card');
 assert(Array.isArray(c.content_blocks),'rich body persisted additive');
 assert.match(c.content_blocks[0].html,/IDX research/,'source chip text preserved');
 assert.equal(window.SELFBoards.links().filter(x=>x.url==='https://idx.co.id/research').length,1,'My Links deduplicated');
 await click('d-pop-task');
 await form('task',{value:'t1'});
 assert.equal(c.task_id,'t1','link existing task without creating a task');
 await click('d-pop-board');
 await form('board',{value:'b2'});
 assert.equal(c.target_board_id,'b2','links board while keeping original placement');
 const geom=JSON.stringify(state.boardItems[0]);
 await click('d-focus');
 assert.equal(ui.dFocus,true,'focus mode opens');
 assert.match(window.SELFBoards.renderEditor(),/d-focus-panel/,'focus writing stays within canvas');
 await click('d-focus-close');
 assert.equal(ui.dFocus,false);
 assert.equal(JSON.stringify(state.boardItems[0]),geom,'focus leaves saved object geometry unchanged');
 assert.equal(state.knowledgeCards.length,1,'no separate note objects created');
 c.content_blocks=[{id:'main',type:'richtext',html:'<img src=x onerror=alert(1)><script>alert(1)</script>Safe'}];
 view=window.SELFBoards.renderEditor();
 assert.doesNotMatch(view,/<img src=x|<script>/,'untrusted rich HTML never injected as executable DOM');
 assert(css.includes('animation:none!important')&&css.includes('opacity:1!important'),'no flash or full-screen dim');
 console.log('PASS Concept D: one toolbar, legacy data, knowledge actions, source links, task/board associations, focus geometry, sanitized rendering.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
