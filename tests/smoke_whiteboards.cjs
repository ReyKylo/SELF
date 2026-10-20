/* SELF Phase 2 regression smoke test: node tests/smoke_whiteboards.cjs */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(path.join(__dirname,'..','boards.js'),'utf8');
const handlers={};
const elements={};
const viewport={clientWidth:1000,clientHeight:700,getBoundingClientRect:()=>({left:0,top:0,width:1000,height:700})};
const document={
  addEventListener(name,fn){(handlers[name]??=[]).push(fn)},
  querySelector(q){
    if(q==='#wb-viewport')return viewport;
    if(q==='#wb-wires-list')return {set innerHTML(value){}};
    if(q==='#wb-pending-edge')return {style:{},setAttribute(){}};
    if(q.startsWith('[data-item='))return elements[q]??(elements[q]={style:{}});
    return null;
  },
  elementFromPoint(){return {closest(q){return q==='[data-board-port]'?{dataset:{boardPort:secondItemId}}:null}}}
};
const window={addEventListener(name,fn){(handlers['window:'+name]??=[]).push(fn)}};
class TestFormData{constructor(form){this.fields=form.fields||{}}*[Symbol.iterator](){yield* Object.entries(this.fields)}}
vm.runInNewContext(source,{window,document,URL,setTimeout,clearTimeout,FormData:TestFormData,confirm:()=>true,console});
const records={spaces:[{id:'space-1',name:'Finance'}],boards:[],knowledgeCards:[],boardItems:[],boardEdges:[],tasks:[]};
const tableMap={boards:'boards',knowledge_cards:'knowledgeCards',board_items:'boardItems',board_edges:'boardEdges'};
let sequence=0,changes=[],currentView='boards',secondItemId;
const host={
 state:()=>records,render(){},navigate(view){currentView=view},
 notify(){},async reload(){},
 async insert(table,obj){const row={id:'id-'+(++sequence),...obj};records[tableMap[table]].push(row);changes.push({operation:'insert',table,id:row.id});return row},
 async patch(table,id,fields){const row=records[tableMap[table]].find(x=>x.id===id);Object.assign(row,fields);changes.push({operation:'patch',table,id});return row},
 async patchSimple(table,id,fields){const row=records[tableMap[table]].find(x=>x.id===id);Object.assign(row,fields);changes.push({operation:'patch',table,id,fields});return row},
 async del(table,id){records[tableMap[table]]=records[tableMap[table]].filter(x=>x.id!==id);changes.push({operation:'delete',table,id})}
};
window.SELFBoards.init(host);
async function submit(kind,fields){
 const target={id:'wb-modal-form',dataset:{modalKind:kind},fields};
 await handlers.submit[0]({target,preventDefault(){},stopPropagation(){}});
}
function event(target,x=350,y=300){return {target,button:0,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}}}

async function main(){
 window.SELFBoards.ui.modal={type:'new-board'};
 await submit('create-board',{title:'Money Flow',space_id:'space-1',description:'Learning finance'});
 assert.equal(records.boards.length,1,'creates a board');
 assert.equal(currentView,'board-editor','opens created board');
 for(const title of ['Foreign Flow','Transaction Volume']){
   window.SELFBoards.ui.modal={type:'new-card',kind:'note'};
   await submit('create-card',{title,kind:'note',summary:'Important concept',accent:'blue'});
 }
 assert.equal(records.boardItems.length,2,'creates two placements');
 const first=records.boardItems[0],second=records.boardItems[1];secondItemId=second.id;
 assert.match(window.SELFBoards.renderEditor(),/Foreign Flow/,'renders the first card');
 assert.match(window.SELFBoards.renderEditor(),/Transaction Volume/,'renders the second card');
 const handle={closest(s){
   if(s==='#wb-viewport')return viewport;
   if(s==='[data-board-drag]')return {dataset:{boardDrag:first.id}};
   return null;
 }};
 const initial=first.x;
 handlers.pointerdown[0](event(handle));
 handlers['window:pointermove'][0](event(handle,475,365));
 await handlers['window:pointerup'][0](event(handle,475,365));
 assert(first.x>initial,'drag moves card coordinates');
 assert(changes.some(x=>x.operation==='patch'&&x.table==='board_items'),'drag saves card placement');
 const port={closest(s){
   if(s==='#wb-viewport')return viewport;
   if(s==='[data-board-port]')return {dataset:{boardPort:first.id}};
   if(s==='button,input,textarea,select')return {};
   return null;
 }};
 handlers.pointerdown[0](event(port));
 handlers['window:pointermove'][0](event(port,470,340));
 await handlers['window:pointerup'][0](event(port,470,340));
 assert.equal(records.boardEdges.length,1,'connecting handles creates a persisted edge');
 const card=records.knowledgeCards[0];
 card.body='References: https://idx.co.id/';
 assert(window.SELFBoards.links().some(link=>link.url==='https://idx.co.id/'),'URLs from notes are available to My Links');
 const secondBoard={id:'board-two',title:'Valuation',space_id:'space-1',zoom:1};
 records.boards.push(secondBoard);
 records.boardItems.push({id:'second-placement',board_id:secondBoard.id,card_id:card.id,x:100,y:100,w:280,h:190});
 window.SELFBoards.ui.selected=first.id;
 assert.match(window.SELFBoards.renderEditor(),/Valuation/,'shared card shows backlinks');
 await host.patch('knowledge_cards',card.id,{title:'Foreign Flow — revised'});
 window.SELFBoards.open(secondBoard.id);
 assert.match(window.SELFBoards.renderEditor(),/Foreign Flow — revised/,'editing canonical card updates its linked boards');
 const injection='<img src=x onerror=alert(1)>';
 card.summary=injection;
 const page=window.SELFBoards.renderEditor();
 assert(!page.includes(injection),'untrusted note data are HTML-escaped');
 console.log('SELF Phase 2 smoke tests passed: board/card CRUD, drag, connector, shared cards, links, HTML escape');
}
main().catch(error=>{console.error(error);process.exitCode=1});
