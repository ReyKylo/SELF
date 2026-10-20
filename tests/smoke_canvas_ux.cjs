/* SELF Concept C UX discovery regression: node tests/smoke_canvas_ux.cjs */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const js=fs.readFileSync(path.join(__dirname,'..','canvas-v3.js'),'utf8');
const handlers={};let hitTarget=null;let ticker=0;
const viewport={clientWidth:1080,clientHeight:720,classList:{add(){},remove(){},toggle(){}},
 getBoundingClientRect(){return {left:100,top:100,right:1180,bottom:820,width:1080,height:720}}};
const minimap={getBoundingClientRect(){return {left:900,top:620,width:220,height:130}}};
const fakeDom={
 addEventListener(n,f){(handlers['doc:'+n]??=[]).push(f)},
 querySelector(q){if(q==='#c3-canvas')return viewport;if(q==='#c3-minimap-svg')return minimap;return null},
 querySelectorAll(){return []},
 elementFromPoint(){return hitTarget||{closest(){return null}}}
};
const window={location:{search:''},addEventListener(n,f){(handlers['window:'+n]??=[]).push(f)}};
vm.runInNewContext(js,{window,document:fakeDom,URL,URLSearchParams,crypto:require('node:crypto').webcrypto,
 queueMicrotask,setTimeout,clearTimeout,FormData,confirm:()=>true,console});
const records={view:'boards',spaces:[],boards:[{id:'b1',title:'Test',pan_x:40,pan_y:45,zoom:1}],
 boardItems:[],boardEdges:[],knowledgeCards:[],tasks:[]};
let id=0;const key={boards:'boards',board_items:'boardItems',board_edges:'boardEdges',knowledge_cards:'knowledgeCards'};
const host={
 state:()=>records,render(){},navigate(v){records.view=v},notify(){},reload:async()=>{},
 async insert(t,fields){const v={id:'entity-'+(++id),...fields};records[key[t]].push(v);return v},
 async patch(t,ref,fields){const v=records[key[t]].find(x=>x.id===ref);Object.assign(v,fields);return v},
 async patchSimple(t,ref,fields){const v=records[key[t]].find(x=>x.id===ref);Object.assign(v,fields);return v},
 async del(t,ref){records[key[t]]=records[key[t]].filter(x=>x.id!==ref)},
 async signImage(){return ''},async uploadImage(){return ''},openTask(){}
};
window.SELFBoards.init(host);window.SELFBoards.open('b1');
function evt(target,x=350,y=360,extra={}){return {target,clientX:x,clientY:y,button:0,preventDefault(){},stopPropagation(){},...extra}}
function button(action,props={}){const t={dataset:{c3:action,...props},classList:{contains(){return false}},closest(q){return q==='[data-c3]'?this:null}};return handlers['doc:click'][0](evt(t))}
const background={closest(q){return q==='#c3-canvas'?viewport:null}};
function nodeTarget(id){return {dataset:{c3Item:id},closest(q){if(q==='#c3-canvas')return viewport;if(q==='[data-c3-item]')return this;return null}}}
function portTarget(id){return {dataset:{c3Port:id,side:'e'},closest(q){if(q==='#c3-canvas')return viewport;if(q==='[data-c3-port]')return this;return null}}}
async function tick(){await new Promise(resolve=>setTimeout(resolve,1))}
async function main(){
 const initial=window.SELFBoards.renderEditor();
 assert.match(initial,/c3-minimap/,'minimap renders in canvas');
 // Double-click empty space opens a local add palette; no full-page overlay.
 handlers['doc:dblclick'][0](evt(background,460,480));
 assert.equal(window.SELFBoards.ui.quickAdd?.point?.x!==undefined,true);
 assert.match(window.SELFBoards.renderEditor(),/c3-quick-add/);
 await button('quick-create',{kind:'sticky'});
 assert.equal(records.boardItems.length,1,'quick create is persistent');
 assert.equal(records.knowledgeCards[0].title,'','quick create never requires a title');
 assert.equal(window.SELFBoards.ui.quickAdd,null,'palette closes after creation');
 const base=records.boardItems[0];
 window.SELFBoards.ui.selected=new Set([base.id]);
 assert.match(window.SELFBoards.renderEditor(),/c3-contextbar/,'selection has quick actions');
 await button('quick-duplicate');
 assert.equal(records.boardItems.length,2,'duplicate inserts another object');
 const duplicate=records.boardItems[1];
 assert.notEqual(duplicate.card_id,base.card_id,'duplicate has independent note content');
 assert.equal(duplicate.x,base.x+38,'duplicate offset provides visible feedback');
 await button('quick-connect');
 assert.equal(window.SELFBoards.ui.connectFrom,duplicate.id);
 handlers['doc:pointerdown'][0](evt(nodeTarget(base.id),600,490));
 await tick();
 assert.equal(records.boardEdges.length,1,'connect from quick toolbar persists edge');
 assert.equal(records.boardEdges[0].source_item_id,duplicate.id);
 assert.equal(records.boardEdges[0].target_item_id,base.id);
 // Dropping a dragged connector on empty canvas creates the next blank object + relation.
 hitTarget={closest(){return null}};
 const beforeNodes=records.boardItems.length, beforeEdges=records.boardEdges.length;
 handlers['doc:pointerdown'][0](evt(portTarget(base.id),550,430));
 handlers['window:pointermove'][0](evt(portTarget(base.id),680,600));
 await handlers['window:pointerup'][0](evt(portTarget(base.id),680,600));
 assert.equal(records.boardItems.length,beforeNodes+1,'connector-to-empty creates a node');
 assert.equal(records.boardEdges.length,beforeEdges+1,'new node immediately connected');
 // View history from free panning.
 const start={...window.SELFBoards.ui.pan};
 handlers['doc:pointerdown'][0](evt(background,300,340));
 handlers['window:pointermove'][0](evt(background,390,385));
 await handlers['window:pointerup'][0](evt(background,390,385));
 assert.notEqual(window.SELFBoards.ui.pan.x,start.x,'free pan moves scene');
 await button('view-back');
 assert.equal(window.SELFBoards.ui.pan.x,start.x,'previous camera restores old x');
 assert.equal(window.SELFBoards.ui.pan.y,start.y,'previous camera restores old y');
 window.SELFBoards.ui.selected=new Set([base.id]);
 await button('fit-selection');
 const selected=window.SELFBoards.ui;
 const viewBounds={x:-selected.pan.x/selected.zoom,y:-selected.pan.y/selected.zoom,
 w:viewport.clientWidth/selected.zoom,h:viewport.clientHeight/selected.zoom};
 assert(base.x>=viewBounds.x-2&&base.x+base.w<=viewBounds.x+viewBounds.w+2,'fit selection visible horizontally');
 assert(base.y>=viewBounds.y-2&&base.y+base.h<=viewBounds.y+viewBounds.h+2,'fit selection visible vertically');
 window.SELFBoards.renderEditor();
 const panBefore={...selected.pan};
 await button('minimap-jump',{});
 assert(Math.abs(panBefore.x-selected.pan.x)>2||Math.abs(panBefore.y-selected.pan.y)>2,'clicking minimap changes camera');
 await button('minimap-toggle');
 assert.equal(window.SELFBoards.ui.mapCollapsed,true);
 assert.match(window.SELFBoards.renderEditor(),/c3-minimap-closed/);
 await button('minimap-toggle');
 assert.equal(window.SELFBoards.ui.mapCollapsed,false);
 window.SELFBoards.ui.selected=new Set([duplicate.id]);
 await button('quick-delete');
 assert.equal(records.boardItems.find(i=>i.id===duplicate.id),undefined,'quick delete removes object placement');
 const css=fs.readFileSync(path.join(__dirname,'..','canvas-v3.css'),'utf8');
 assert.match(css,/Phase 2\.5 UX discovery polish/);
 assert.match(css,/backdrop-filter: none !important/,'no dark overlay regression');
 console.log('PASS: double-click add, contextual duplicate/connect/delete, connector-to-blank, minimap, view-back, fit-selection, no flashing.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
