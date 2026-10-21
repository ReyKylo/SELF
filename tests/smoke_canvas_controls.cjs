/* SELF UX controls test — run: node tests/smoke_canvas_controls.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'canvas-v3.js'),'utf8');
const stylesheet=fs.readFileSync(path.join(root,'canvas-v3.css'),'utf8');
const generalStyles=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const listeners={},props={},notify=[];
const node={style:{opacity:'1',setProperty(k,v){props[k]=v}}};
const saveIndicator={textContent:''};
const document={
 addEventListener(name,fn){(listeners[name]??=[]).push(fn)},
 querySelector(selector){
   if(selector==='[data-c3-item="i1"]')return node;
   if(selector==='#c3-save')return saveIndicator;
   return null;
 },querySelectorAll(){return []}
};
const window={location:{search:''},addEventListener(){}};
vm.runInNewContext(script,{window,document,crypto:require('node:crypto').webcrypto,URL,URLSearchParams,
 queueMicrotask,setTimeout,clearTimeout,confirm:()=>true,console});
const state={view:'boards',spaces:[],boards:[{id:'b1',title:'Concept C',pan_x:0,pan_y:0,zoom:1}],
 knowledgeCards:[{id:'k1',title:'Finance'}],
 boardItems:[{id:'i1',board_id:'b1',card_id:'k1',visual_kind:'rectangle',x:120,y:120,w:270,h:180,style:{fill:'#517ac1',fontSize:20,radius:13,opacity:1}}],
 boardEdges:[],tasks:[]};
const map={boards:'boards',knowledge_cards:'knowledgeCards',board_items:'boardItems',board_edges:'boardEdges'};
let counter=2,renders=0,patches=0,remounts=0;
const host={
 state:()=>state,render(){renders++},navigate(view){state.view=view},notify(message){notify.push(message)},
 async reload(){},async insert(table,row){const result={id:'id'+(++counter),...row};state[map[table]].push(result);return result},
 async patchSimple(table,id,fields){const row=state[map[table]].find(x=>x.id===id);assert(row);Object.assign(row,fields);patches++;return row},
 async patch(table,id,fields){Object.assign(state[map[table]].find(x=>x.id===id),fields)},
 async del(table,id){state[map[table]]=state[map[table]].filter(x=>x.id!==id)}
};
window.SELFBoards.init(host);window.SELFBoards.open('b1');
const ui=window.SELFBoards.ui;
function click(action,attrs={}){
 const el={dataset:{c3:action,...attrs},classList:{contains:()=>false},
   closest(q){return q==='[data-c3]'?this:null}};
 return listeners.click[0]({target:el,preventDefault(){},stopPropagation(){}});
}
function range(field,val){
 let labelValue={textContent:''};
 const target={dataset:{c3Style:field},value:String(val),
 closest(q){return q==='label'?{querySelector(s){return s==='output'?labelValue:null}}:null}};
 listeners.input[0]({target});
 return labelValue.textContent;
}
async function main(){
 let html=window.SELFBoards.renderEditor();
 assert.match(html,/c3-toolbar/);
 assert.match(html,/data-c3="tools-collapse"/,'left canvas dock has collapse toggle');
 await click('tools-collapse');
 assert.equal(ui.toolsCollapsed,true);
 assert.match(window.SELFBoards.renderEditor(),/c3-toolbar-closed/,'dock visibly collapsed');
 await click('tools-collapse');
 assert.equal(ui.toolsCollapsed,false);
 await click('shapes-toggle');
 assert.equal(ui.shapesOpen,true);
 html=window.SELFBoards.renderEditor();
 assert.match(html,/c3-shape-gallery/);
 assert.equal((html.match(/data-c3="shape-create"/g)||[]).length,12,'library shows twelve shapes');
 await click('shape-create',{shape:'hexagon'});
 assert.equal(state.boardItems.length,2,'shape creates a board object immediately');
 assert.equal(state.knowledgeCards.at(-1).title,'','shape needs no title');
 assert.equal(state.boardItems.at(-1).style.shape,'hexagon','shape variant survives storage payload');
 assert.match(window.SELFBoards.renderEditor(),/c3-variant-hexagon/,'shape variant renders after reload');
 // Select the original node for real-time control tests.
 ui.selected=new Set(['i1']);
 const oldPatches=patches;
 const indicator={};
 let result=range('fontSize',36);
 assert.equal(result,'36px','label updates on pointer input');
 assert.equal(props['--font-size'],'36px','font-size changes in the DOM instantly');
 assert.equal(state.boardItems[0].style.fontSize,36,'in-memory state changes immediately');
 assert.equal(patches,oldPatches,'preview does not make a database call on every pointer input');
 result=range('radius',27);
 assert.equal(result,'27px');
 assert.equal(props['--corner'],'27px','corner radius previews instantly');
 result=range('opacity',75);
 assert.equal(result,'75%');
 assert.equal(node.style.opacity,'0.75','opacity previews instantly');
 const fieldTarget={dataset:{c3Style:'opacity'},value:'75',closest(q){return q==='label'?{querySelector:()=>null}:null}};
 listeners.change[0]({target:fieldTarget});
 await new Promise(resolve=>setTimeout(resolve,30));
 assert(patches>oldPatches,'mouseup/change commits style data');
 assert.equal(state.boardItems[0].style.fontSize,36);
 assert.equal(state.boardItems[0].style.radius,27);
 assert.equal(state.boardItems[0].style.opacity,.75);
 assert.equal(ui.styleSession,null,'pending style session cleared');
 assert.equal(props['--font-size'],'36px','font preview not undone after Supabase');
 // Color must also preview before release.
 range('fill','#789abc');
 assert.equal(props['--fill'],'#789abc');
 await listeners.change[0]({target:{dataset:{c3Style:'fill'},value:'#789abc',closest(){return null}}});
 await new Promise(resolve=>setTimeout(resolve,20));
 assert(patches>=2);
 assert.equal(state.boardItems[0].style.fill,'#789abc');
 // Sidebar is a real stateful navigation control, not decorative.
 assert(app.includes("localStorage.setItem('self.sidebarCollapsed'"),'sidebar collapse persists');
 assert(app.includes("action==='toggle-sidebar'"),'sidebar responds to click');
 assert(generalStyles.includes('.shell.self-sidebar-collapsed .main'),'sidebar collapse reallocates width');
 assert(stylesheet.includes('.c3-shape-gallery'),'gallery has scoped styling');
 assert(stylesheet.includes('prefers-reduced-motion:reduce'),'reduced motion still supported');
 assert(stylesheet.includes('backdrop-filter: none !important'),'anti-blink preserved');
 console.log('PASS: collapse sidebar/dock, twelve shape choices, persisted hexagon, instant px/radius/opacity/colors, debounced save and no flashing.');
}
main().catch(err=>{console.error(err);process.exitCode=1});
