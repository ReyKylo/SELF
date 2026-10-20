// SELF Concept C regression test — run with: node tests/smoke_concept_c.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'..','canvas-v3.js'),'utf8');
const handlers={};const elements={};
const viewport={clientWidth:1100,clientHeight:720,getBoundingClientRect:()=>({left:100,top:90,width:1100,height:720})};
const doc={
 addEventListener(name,fn){(handlers[name]??=[]).push(fn)},
 querySelector(q){
  if(q==='#c3-canvas')return viewport;
  if(q==='#c3-world')return {style:{}};
  if(q==='#c3-zoom-label')return {textContent:''};
  if(q==='#c3-wires')return {set innerHTML(s){}};
  if(q==='#c3-marquee')return {style:{},hidden:true};
  if(q.startsWith('[data-c3-item='))return elements[q]??(elements[q]={style:{}});
  return null;
 },
 querySelectorAll(){return []},
 elementFromPoint(){return {closest:q=>q==='[data-c3-port]'?{dataset:{c3Port:secondId,side:'w'}}:null}}
};
const window={addEventListener(name,fn){(handlers['window:'+name]??=[]).push(fn)}};
class FD{constructor(form){this.fields=form.fields||{}}*[Symbol.iterator](){yield* Object.entries(this.fields)}}
const ctx={window,document:doc,URL,FormData:FD,queueMicrotask,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout,confirm:()=>true,console};
vm.runInNewContext(code,ctx);
const data={view:'boards',spaces:[{id:'s1',name:'Finance'}],boards:[{id:'b1',space_id:'s1',title:'Learning',pan_x:50,pan_y:50,zoom:1},{id:'b2',title:'Other board',pan_x:50,pan_y:50,zoom:1}],tasks:[],knowledgeCards:[],boardItems:[],boardEdges:[]};
let id=0;const changes=[],notifications=[];
const tables={boards:'boards',knowledge_cards:'knowledgeCards',board_items:'boardItems',board_edges:'boardEdges'};
const host={
 state:()=>data,render(){},navigate(v){data.view=v},notify(m){notifications.push(m)},async reload(){},
 async insert(t,obj){const record={id:'id'+(++id),...obj};data[tables[t]].push(record);changes.push(['insert',t,record]);return record},
 async patch(t,ref,fields){const row=data[tables[t]].find(x=>x.id===ref);if(!row)throw Error('Missing row: '+ref);Object.assign(row,fields);changes.push(['patch',t,ref]);return row},
 async patchSimple(t,ref,fields){const row=data[tables[t]].find(x=>x.id===ref);if(!row)throw Error('Missing row: '+ref);Object.assign(row,fields);changes.push(['patch',t,ref]);return row},
 async del(t,ref){data[tables[t]]=data[tables[t]].filter(x=>x.id!==ref);changes.push(['del',t,ref])},
 async uploadImage(){return 'user-id/asset.png'},async signImage(){return 'https://example.org/signed.png'},
 openTask(){}
};
window.SELFBoards.init(host);window.SELFBoards.open('b1');
let secondId;
function evt(target,x=380,y=260){return {target,button:0,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}}}
function act(a,props={}){const el={dataset:{c3:a,...props},classList:{contains:()=>false},closest(q){return q==='[data-c3]'?this:null}};return handlers.click[0](evt(el))}
async function main(){
 assert.match(window.SELFBoards.renderEditor(),/c3-toolbar/);
 for(let n=0;n<6;n++)await act('add',{kind:'rectangle'});
 assert.equal(data.boardItems.length,6,'six shapes created without a title/form');
 assert(data.knowledgeCards.every(c=>c.title===''),'all blank cards remain blank');
 assert.match(window.SELFBoards.renderEditor(),/c3-inspector/,'inspector exists');
 const first=data.boardItems[0],second=data.boardItems[1];secondId=second.id;
 let markup=window.SELFBoards.renderEditor();
 assert.equal((markup.match(new RegExp('data-c3-port="'+first.id+'"','g'))||[]).length,4,'four ports rendered at all times');
 const geo=window.SELFBoards.geometry;
 const r0=geo.choose(first,second);assert(['n','s','e','w'].includes(r0.from));
 const edge={source_item_id:first.id,target_item_id:second.id,route_type:'curved',from_anchor:'auto',to_anchor:'auto'};
 const before=geo.wireGeometry(edge);
 second.y=first.y+first.h+230;second.x=first.x;second.h+=90;
 const after=geo.wireGeometry(edge);
 assert.notDeepEqual([before.p.x,before.p.y,before.q.x,before.q.y],[after.p.x,after.p.y,after.q.x,after.q.y],'connector recalculates after resize and move');
 const port={dataset:{c3Port:first.id,side:'s'},closest(q){if(q==='#c3-canvas')return viewport;if(q==='[data-c3-port]')return this;return null}};
 handlers.pointerdown[0](evt(port));
 handlers['window:pointermove'][0](evt(port,435,460));
 await handlers['window:pointerup'][0](evt(port,435,460));
 assert.equal(data.boardEdges.length,1,'connector is persisted');
 assert.equal(data.boardEdges[0].source_item_id,first.id);
 window.SELFBoards.ui.selected=new Set([first.id,second.id]);
 await act('auto-tidy');
 assert(changes.some(x=>x[0]==='patch'&&x[1]==='board_items'),'layout changes persisted');
 await act('undo');await act('redo');
 const f={id:'c3-note-form',dataset:{id:first.id},fields:{title:'Cash Flow',body:'Source: https://idx.co.id/',key_points:'Price and volume',url:'https://idx.co.id',task_id:'',target_board_id:'b2'}};
 await handlers.submit[0](evt(f));
 assert.equal(data.knowledgeCards.find(c=>c.id===first.card_id).title,'Cash Flow');
 assert(window.SELFBoards.links().some(x=>x.url.includes('idx.co.id')),'note URLs reach Important Links');
 data.knowledgeCards.find(c=>c.id===first.card_id).title='<img src=x onerror=alert(1)>';
 assert(!window.SELFBoards.renderEditor().includes('<img src=x onerror=alert(1)>'),'HTML text escaped');
 console.log('Concept C PASS: blank-first, 4 anchors, resize/move rebind, edge persistence, smart tidy, undo, notes, links, XSS escaping.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
