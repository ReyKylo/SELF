/* SELF Phase 2 — Hybrid Whiteboards. No framework, no external runtime. */
(function(){
'use strict';
let host;
const ui={boardId:null,selected:null,connecting:null,modal:null,pan:{x:0,y:0},zoom:1,gesture:null,dirty:false};
const $=(q)=>document.querySelector(q);
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const col={blue:'#73aeff',green:'#72d5ae',purple:'#ba9afa',yellow:'#ffd38e',red:'#ffa19b',cyan:'#6bd4df'};
const ico=(name)=>({note:'📝',task:'☑',link:'↗',board:'▦',group:'▧'}[name]||'✧');
const data=()=>host.state();
const board=()=>data().boards.find(b=>b.id===ui.boardId);
const placements=()=>data().boardItems.filter(p=>p.board_id===ui.boardId);
const card=(id)=>data().knowledgeCards.find(c=>c.id===id);
const nodes=()=>placements().map(p=>({p,c:card(p.card_id)})).filter(n=>n.c);
const edges=()=>data().boardEdges.filter(e=>e.board_id===ui.boardId);
const spaceLabel=(id)=>data().spaces.find(s=>s.id===id)?.name||'Independent board';
const viewButton=(label,action,extra='')=>'<button class="wb-btn" type="button" data-board-action="'+action+'" '+extra+'>'+label+'</button>';
const getBoard=(id)=>data().boards.find(b=>b.id===id);
const normalUrl=(url)=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
function status(message,bad=false){host.notify(message,bad)}
async function sync(success){await host.reload();host.render();if(success)status(success)}
async function run(operation,message){try{await operation();await sync(message)}catch(e){status(e.message||String(e),true)}}
function open(id){const b=getBoard(id);if(!b){status('Board not found',true);return}ui.boardId=id;ui.selected=null;ui.connecting=null;ui.modal=null;ui.pan={x:num(b.pan_x),y:num(b.pan_y)};ui.zoom=clamp(num(b.zoom,1),.25,2.5);host.navigate('board-editor');}
function spaceBoards(spaceId){return data().boards.filter(b=>b.space_id===spaceId)}
function preview(b){const count=data().boardItems.filter(i=>i.board_id===b.id).length;return '<button type="button" class="wb-library-tile" data-board-action="open" data-id="'+safe(b.id)+'"><span class="wb-preview"><span></span><span></span><span></span><svg viewBox="0 0 160 82"><path d="M80 20L37 58 M80 20L124 58 M37 58H124" stroke="currentColor" opacity=".25" fill="none"/></svg></span><strong>'+safe(b.title)+'</strong><small>'+safe(spaceLabel(b.space_id))+' · '+count+' cards</small></button>'}
function newBoardButton(){return '<button class="wb-library-tile wb-library-add" data-board-action="create-board-modal"><span class="wb-add-mark">＋</span><strong>Create board</strong><small>Your next big idea starts here</small></button>'}
function renderLibrary(spaceId=null){const bds=data().boards.filter(b=>!spaceId||b.space_id===spaceId);let html=spaceId?'<div class="wb-library-space-head"><div><h2>Whiteboards</h2><p>Make visual notes and connect knowledge.</p></div>'+viewButton('＋ New Board','create-board-modal','data-space="'+safe(spaceId)+'"')+'</div>':'<div class="wb-library-head"><div><span class="wb-eyebrow">THINK VISUALLY</span><h1>My Boards</h1><p>Infinite canvas. Connected knowledge. Your way of thinking.</p></div>'+viewButton('＋ New Board','create-board-modal')+'</div>';
html+='<div class="wb-library-grid">'+bds.map(preview).join('')+newBoardButton()+'</div>';
return html+renderModal();
}
function rect(p){return {x:num(p.x),y:num(p.y),w:num(p.w,270),h:num(p.h,190)}}
function cardMarkup(n){const p=n.p,c=n.c,r=rect(p),selected=ui.selected===p.id;
const accent=col[c.accent]||col.blue;
const connected=ui.connecting===p.id?' wb-connecting':'';
const width=Math.round(r.w),height=Math.round(r.h);
const linked=c.kind==='board'&&c.target_board_id?' <span class="wb-kind-sub">↗ connected board</span>':'';
const txt=c.kind==='link'?(normalUrl(c.url)||'Add a website link'):c.kind==='task'?(data().tasks.find(t=>t.id===c.task_id)?.title||c.summary):c.summary;
return '<article class="wb-node wb-'+safe(c.kind)+(selected?' wb-selected':'')+connected+'" data-item="'+safe(p.id)+'" style="left:'+r.x+'px;top:'+r.y+'px;width:'+width+'px;height:'+height+'px;--wb-accent:'+accent+';z-index:'+num(p.z)+'">'+
'<div class="wb-node-head wb-drag" data-board-drag="'+safe(p.id)+'"><span class="wb-node-icon">'+ico(c.kind)+'</span><span class="wb-node-title">'+safe(c.title)+'</span><button type="button" class="wb-node-open" data-board-action="edit-card" data-id="'+safe(p.id)+'" title="Open card details" aria-label="Open '+safe(c.title)+' details">↗</button></div>'+
'<div class="wb-node-body">'+(txt?'<p>'+safe(txt).replace(/\n/g,'<br>')+'</p>':'<p class="wb-node-placeholder">Double click to add detail</p>')+
(c.key_points?'<div class="wb-key-points">'+safe(c.key_points).split('\n').filter(Boolean).slice(0,5).map(x=>'<div>• '+x+'</div>').join('')+'</div>':'')+linked+'</div>'+
'<div class="wb-node-foot"><button class="wb-node-port wb-node-port-left" type="button" data-board-port="'+safe(p.id)+'" aria-label="Connect to this card" title="Connect cards"></button><span>'+safe(c.kind.toUpperCase())+'</span><button class="wb-node-port wb-node-port-right" type="button" data-board-port="'+safe(p.id)+'" aria-label="Connect from this card" title="Drag to connect"></button></div>'+
'<div class="wb-resize" data-board-resize="'+safe(p.id)+'" title="Resize card" role="button" aria-label="Resize card"></div></article>';
}
const point=(p,side)=>{const r=rect(p);return {x:r.x+(side==='right'?r.w:0),y:r.y+r.h/2}};
function edgeMarkup(e){const a=placements().find(p=>p.id===e.source_item_id),b=placements().find(p=>p.id===e.target_item_id);if(!a||!b)return '';
const from=point(a,'right'),to=point(b,'left'),dx=Math.max(65,Math.abs(to.x-from.x)*.43);
return '<path data-edge="'+safe(e.id)+'" d="M '+from.x+' '+from.y+' C '+(from.x+dx)+' '+from.y+', '+(to.x-dx)+' '+to.y+', '+to.x+' '+to.y+'" stroke="var(--wb-edge)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#wb-arrow)" fill="none"/>';}
function editor(){const b=board();if(!b)return renderLibrary();
return '<div class="self-board-editor"><div class="wb-top"><div class="wb-crumb"><button data-board-action="back" class="wb-icon-btn" title="Back to boards">←</button><div><small>'+safe(spaceLabel(b.space_id))+' / Whiteboard</small><h1>'+safe(b.title)+'</h1></div></div><div class="wb-top-controls">'+viewButton('＋ Add Card','menu-card')+viewButton('⊞ Existing Card','menu-existing')+viewButton('✎ Rename','rename-board')+viewButton('⋯','board-options')+'</div></div>'+
'<div class="wb-layout"><aside class="wb-toolbar" aria-label="Whiteboard tools">'+viewButton('↖ Select','tool-select')+viewButton('✎ Note','quick-note')+viewButton('☑ Task','quick-task')+viewButton('↗ Link','quick-link')+viewButton('▧ Group','quick-group')+viewButton('▦ Board','quick-board')+'</aside>'+
'<section class="wb-viewport" id="wb-viewport" aria-label="Infinite whiteboard canvas" tabindex="0"><div class="wb-world" id="wb-world" style="transform:translate('+ui.pan.x+'px,'+ui.pan.y+'px) scale('+ui.zoom+')"><svg class="wb-wires" aria-hidden="true"><defs><marker id="wb-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" stroke="var(--wb-edge)" fill="none" stroke-width="1.5"/></marker></defs><g id="wb-wires-list">'+edges().map(edgeMarkup).join('')+'</g><path id="wb-pending-edge" stroke="var(--blue)" stroke-dasharray="7 6" stroke-width="2.5" fill="none" style="display:none"/></svg>'+
nodes().map(cardMarkup).join('')+
(!nodes().length?'<div class="wb-empty-canvas"><div class="wb-empty-icon">✳</div><h2>Start connecting ideas.</h2><p>Create a card and build your visual thinking space.</p>'+viewButton('＋ Create first card','quick-note')+'</div>':'')+'</div>'+
'<div class="wb-canvas-hint">Drag background to pan · Ctrl/⌘ + scroll to zoom · Drag card to move · Drag dot to connect</div><div class="wb-zoom-controls"><button data-board-action="zoom-out" aria-label="Zoom out">−</button><strong id="wb-zoom-label">'+Math.round(ui.zoom*100)+'%</strong><button data-board-action="zoom-in" aria-label="Zoom in">＋</button><button data-board-action="zoom-reset" aria-label="Reset zoom">⤢</button></div></section></div>'+
renderDetail()+renderModal()+'</div>';
}
function renderDetail(){const p=placements().find(p=>p.id===ui.selected);if(!p)return '';const c=card(p.card_id);if(!c)return '';const as=nodes().filter(n=>n.p.id!==p.id);
const linked=data().boardItems.filter(i=>i.card_id===c.id&&i.board_id!==ui.boardId).map(i=>getBoard(i.board_id)).filter(Boolean);
const edgeList=edges().filter(e=>e.source_item_id===p.id||e.target_item_id===p.id);
const opt=(value,label,selected)=>'<option value="'+safe(value)+'"'+(selected?' selected':'')+'>'+safe(label)+'</option>';
return '<div class="wb-panel-backdrop" data-board-action="close-detail"></div><aside class="wb-detail" role="dialog" aria-label="Card detail"><div class="wb-detail-top"><span>✳ KNOWLEDGE CARD</span><button class="wb-icon-btn" data-board-action="close-detail" aria-label="Close detail">✕</button></div>'+
'<form id="wb-card-form" data-card="'+safe(c.id)+'"><label class="wb-field-label">CARD TITLE<input name="title" class="wb-detail-title" required maxlength="200" value="'+safe(c.title)+'"></label>'+
'<div class="wb-detail-meta"><label class="wb-field-label">CARD TYPE<select name="kind" class="wb-input">'+['note','task','link','group','board'].map(k=>opt(k,k[0].toUpperCase()+k.slice(1),k===c.kind)).join('')+'</select></label><label class="wb-field-label">ACCENT<select name="accent" class="wb-input">'+Object.keys(col).map(k=>opt(k,k[0].toUpperCase()+k.slice(1),k===c.accent)).join('')+'</select></label></div>'+
'<label class="wb-field-label">VISIBLE SUMMARY<textarea name="summary" class="wb-input" rows="2" placeholder="Short description visible on your canvas">'+safe(c.summary)+'</textarea></label>'+
'<label class="wb-field-label">KEY POINTS <small>(one per line)</small><textarea name="key_points" class="wb-input" rows="4" placeholder="• Key takeaway&#10;• What matters">'+safe(c.key_points)+'</textarea></label>'+
'<div class="wb-notes-label"><span>DETAILED NOTES <small>Markdown supported</small></span><div class="wb-formatbar"><button type="button" data-board-action="format-note" data-mark="bold" title="Bold" aria-label="Bold selection"><b>B</b></button><button type="button" data-board-action="format-note" data-mark="heading" title="Heading" aria-label="Insert heading">H</button><button type="button" data-board-action="format-note" data-mark="bullet" title="Bullet list" aria-label="Insert bullet">☰</button><button type="button" data-board-action="format-note" data-mark="link" title="Link" aria-label="Insert link">↗</button><button type="button" data-board-action="preview-note" title="Preview" aria-label="Preview formatted notes">Preview</button></div></div><textarea id="wb-body-note" name="body" class="wb-input wb-notes" rows="7" placeholder="Explain the concept, write detailed notes, add references...">'+safe(c.body)+'</textarea><div class="wb-notes-preview" id="wb-note-preview" hidden></div>'+
'<label class="wb-field-label">WEBSITE LINK<input name="url" class="wb-input" type="url" placeholder="https://..." value="'+safe(c.url||'')+'"></label>'+
'<label class="wb-field-label">LINKED TASK<select name="task_id" class="wb-input">'+opt('','No linked task',!c.task_id)+data().tasks.map(t=>opt(t.id,t.title,t.id===c.task_id)).join('')+'</select></label>'+
'<label class="wb-field-label">LINKED BOARD<select name="target_board_id" class="wb-input">'+opt('','No linked board',!c.target_board_id)+data().boards.filter(b=>b.id!==ui.boardId).map(b=>opt(b.id,b.title,b.id===c.target_board_id)).join('')+'</select></label>'+
'<div class="wb-detail-actions"><button class="wb-primary" type="submit">✓ Save Changes</button>'+((c.kind==='board'&&c.target_board_id)?viewButton('↗ Open linked board','open-target','data-id="'+safe(c.target_board_id)+'"'):'')+(c.task_id?viewButton('Open task','open-task','data-id="'+safe(c.task_id)+'"'):'')+'</div></form>'+
'<section class="wb-related"><h3>Connected on this board</h3>'+(edgeList.map(e=>{const other=placements().find(p=>p.id===(e.source_item_id===p.id?e.target_item_id:e.source_item_id));return '<div class="wb-related-row"><span>'+safe(card(other?.card_id)?.title||'Card')+'</span><button data-board-action="remove-edge" data-id="'+safe(e.id)+'">Remove</button></div>'}).join('')||'<p>No connections yet. Drag the little dot between cards.</p>')+
'<h3>Also appears in</h3>'+(linked.map(b=>'<button class="wb-related-board" data-board-action="open" data-id="'+safe(b.id)+'">↗ '+safe(b.title)+'</button>').join('')||'<p>This is the only board using this card.</p>')+
'<div class="wb-detail-bottom">'+viewButton('＋ Add to another board','add-to-board','data-id="'+safe(c.id)+'"')+viewButton('Remove from board','remove-placement','data-id="'+safe(p.id)+'"')+viewButton('Delete card everywhere','delete-card','data-id="'+safe(c.id)+'"')+'</div></section></aside>';
}
function renderModal(){if(!ui.modal)return '';const m=ui.modal;let title='',fields='',action='';
if(m.type==='new-board'){title='Create a board';action='create-board';fields='<label>Board name<input name="title" required maxlength="160" placeholder="e.g. Money Flow"></label><label>Space<select name="space_id">'+optionSpaces(m.spaceId)+'</select></label><label>Description (optional)<textarea name="description" rows="2" placeholder="What is this board about?"></textarea></label>';}
else if(m.type==='rename-board'){const b=board();title='Board settings';action='save-board';fields='<label>Board name<input name="title" required maxlength="160" value="'+safe(b.title)+'"></label><label>Space<select name="space_id">'+optionSpaces(b.space_id)+'</select></label><label>Description<textarea name="description" rows="3">'+safe(b.description)+'</textarea></label>';}
else if(m.type==='new-card'){title='Add a knowledge card';action='create-card';fields='<label>Title<input name="title" required maxlength="200" placeholder="What are you thinking about?"></label><label>Type<select name="kind">'+['note','task','link','group','board'].map(k=>'<option value="'+k+'"'+(k===m.kind?' selected':'')+'>'+k.toUpperCase()+'</option>').join('')+'</select></label><label>Short summary<textarea name="summary" rows="3" placeholder="Your key thought"></textarea></label><label>Color<select name="accent">'+Object.keys(col).map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select></label>';}
else if(m.type==='existing'){title='Add an existing card';action='place-existing';const already=new Set(placements().map(p=>p.card_id));const available=data().knowledgeCards.filter(c=>!already.has(c.id));fields='<label>Choose a card<select name="card_id" required>'+available.map(c=>'<option value="'+safe(c.id)+'">'+ico(c.kind)+' '+safe(c.title)+'</option>').join('')+'</select></label><p>Same content, independent placement. Editing this card will update it on every linked board.</p>';if(!available.length)fields='<p>Every existing card is already on this board. Create another card first.</p>';}
else if(m.type==='other-board'){title='Place card on another board';action='place-other';fields='<label>Destination board<select name="board_id" required>'+data().boards.filter(b=>b.id!==ui.boardId&&!data().boardItems.some(i=>i.board_id===b.id&&i.card_id===m.cardId)).map(b=>'<option value="'+safe(b.id)+'">'+safe(b.title)+'</option>').join('')+'</select></label>';}
else if(m.type==='options'){title='Board options';fields='<p>Delete this board and its visual layout? Shared cards used on other boards will remain intact.</p>';action='delete-board';}
if(!title)return '';
return '<div class="wb-modal-overlay" data-board-action="close-modal"><div class="wb-modal" role="dialog" aria-modal="true" aria-label="'+safe(title)+'"><div class="wb-modal-head"><h2>'+title+'</h2><button type="button" data-board-action="close-modal" class="wb-icon-btn" aria-label="Close">✕</button></div><form id="wb-modal-form" data-modal-kind="'+safe(action)+'">'+fields+'<div class="wb-modal-footer"><button type="button" class="wb-btn" data-board-action="close-modal">Cancel</button><button type="submit" class="wb-primary">'+(action==='delete-board'?'Delete board':action==='save-board'?'Save board':'Continue')+'</button></div></form></div></div>';
}
function optionSpaces(chosen){return '<option value="">Independent board</option>'+data().spaces.map(s=>'<option value="'+safe(s.id)+'"'+(s.id===chosen?' selected':'')+'>'+safe(s.name)+'</option>').join('')}
function setModal(type,details={}){ui.modal={type,...details};host.render()}
function freshXY(){const viewport=$('#wb-viewport');const x=(viewport?.clientWidth||950)*.42,y=(viewport?.clientHeight||650)*.35;return {x:clamp((x-ui.pan.x)/ui.zoom,-95000,95000),y:clamp((y-ui.pan.y)/ui.zoom,-95000,95000)}}
async function placeCard(cardId,bid=ui.boardId){const used=data().boardItems.filter(p=>p.board_id===bid);const position=bid===ui.boardId?freshXY():{x:160+used.length*30,y:120+used.length*25};return host.insert('board_items',{board_id:bid,card_id:cardId,...position,w:285,h:195,z:used.length+1})}
function screenToWorld(x,y){const vp=$('#wb-viewport');if(!vp)return {x:0,y:0};const r=vp.getBoundingClientRect();return {x:(x-r.left-ui.pan.x)/ui.zoom,y:(y-r.top-ui.pan.y)/ui.zoom}}
function applyCamera(save=false){const world=$('#wb-world');if(world)world.style.transform='translate('+ui.pan.x+'px,'+ui.pan.y+'px) scale('+ui.zoom+')';const label=$('#wb-zoom-label');if(label)label.textContent=Math.round(ui.zoom*100)+'%';if(save)persistCamera();}
let cameraTimer;
function persistCamera(){clearTimeout(cameraTimer);const id=ui.boardId;const snapshot={pan_x:ui.pan.x,pan_y:ui.pan.y,zoom:ui.zoom};cameraTimer=setTimeout(async()=>{if(id)try{await host.patch('boards',id,snapshot)}catch(e){status('Could not save canvas position: '+e.message,true)}},380)}
function zoomAt(factor,clientX,clientY){const vp=$('#wb-viewport');if(!vp)return;const r=vp.getBoundingClientRect(),px=clientX-r.left,py=clientY-r.top;const x=(px-ui.pan.x)/ui.zoom,y=(py-ui.pan.y)/ui.zoom;ui.zoom=clamp(ui.zoom*factor,.25,2.5);ui.pan.x=px-x*ui.zoom;ui.pan.y=py-y*ui.zoom;applyCamera(true)}
function redrawEdges(){const layer=$('#wb-wires-list');if(layer)layer.innerHTML=edges().map(edgeMarkup).join('')}
function gestureStart(e){const vp=e.target.closest('#wb-viewport');if(!vp||e.button!==0||ui.modal)return;
const port=e.target.closest('[data-board-port]');
if(!port&&e.target.closest('button,input,textarea,select'))return;
if(port){const id=port.dataset.boardPort;ui.gesture={type:'connect',id,start:{x:e.clientX,y:e.clientY},moved:false};e.preventDefault();e.stopPropagation();return}
const resize=e.target.closest('[data-board-resize]'),drag=e.target.closest('[data-board-drag]');
const el=resize||drag, id=el?.dataset.boardResize||el?.dataset.boardDrag;
if(id){const p=placements().find(x=>x.id===id);if(!p)return;const r=rect(p),c=card(p.card_id),members=c?.kind==='group'?placements().filter(q=>q.id!==p.id&&q.x>=r.x&&q.y>=r.y&&q.x+q.w<=r.x+r.w&&q.y+q.h<=r.y+r.h).map(q=>({id:q.id,x:q.x,y:q.y})):[];ui.gesture={type:resize?'resize':'move',id,start:{x:e.clientX,y:e.clientY},rect:r,members,moved:false};ui.selected=id;e.preventDefault();return}
if(e.target.closest('.wb-node'))return;
ui.gesture={type:'pan',start:{x:e.clientX,y:e.clientY},pan:{...ui.pan},moved:false};e.preventDefault();}
function gestureMove(e){const g=ui.gesture;if(!g)return;const dx=e.clientX-g.start.x,dy=e.clientY-g.start.y;g.moved=g.moved||Math.abs(dx)+Math.abs(dy)>4;if(!g.moved)return;
if(g.type==='pan'){ui.pan={x:g.pan.x+dx,y:g.pan.y+dy};applyCamera();return}
if(g.type==='connect'){const a=placements().find(p=>p.id===g.id),line=$('#wb-pending-edge');if(a&&line){const x=point(a,'right'),y=screenToWorld(e.clientX,e.clientY);line.setAttribute('d','M '+x.x+' '+x.y+' C '+(x.x+70)+' '+x.y+', '+(y.x-70)+' '+y.y+', '+y.x+' '+y.y);line.style.display='block'}return}
const d=ui.zoom,el=$('[data-item="'+g.id+'"]');const p=placements().find(p=>p.id===g.id);if(!p||!el)return;
if(g.type==='move'){p.x=clamp(g.rect.x+dx/d,-100000,100000);p.y=clamp(g.rect.y+dy/d,-100000,100000);el.style.left=p.x+'px';el.style.top=p.y+'px';for(const m of g.members){const child=placements().find(q=>q.id===m.id),childEl=$('[data-item="'+m.id+'"]');if(child&&childEl){child.x=clamp(m.x+dx/d,-100000,100000);child.y=clamp(m.y+dy/d,-100000,100000);childEl.style.left=child.x+'px';childEl.style.top=child.y+'px'}}}
if(g.type==='resize'){p.w=clamp(g.rect.w+dx/d,180,1200);p.h=clamp(g.rect.h+dy/d,110,900);el.style.width=p.w+'px';el.style.height=p.h+'px'}
redrawEdges();}
async function gestureEnd(e){const g=ui.gesture;if(!g)return;ui.gesture=null;const line=$('#wb-pending-edge');if(line)line.style.display='none';
if(g.type==='pan'){if(g.moved)persistCamera();else if(ui.selected){ui.selected=null;host.render()}return}
if(g.type==='connect'){const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-board-port]');let other=dest?.dataset.boardPort;if(!g.moved){if(ui.connecting&&ui.connecting!==g.id){other=g.id;g.id=ui.connecting;ui.connecting=null;}else{ui.connecting=g.id;status('Click or drag a dot on another card to connect');return}}else if(!other||other===g.id){status('Drop on the dot of another card to connect');return}
if(other&&other!==g.id){ui.connecting=null;if(edges().some(ed=>ed.source_item_id===g.id&&ed.target_item_id===other)){status('These cards are already connected');return}
await run(async()=>host.insert('board_edges',{board_id:ui.boardId,source_item_id:g.id,target_item_id:other}),'Cards connected');}return}
if(!g.moved){ui.selected=g.id;host.render();return}
const p=placements().find(p=>p.id===g.id);if(!p)return;
const attrs=g.type==='move'?{x:p.x,y:p.y}:{w:p.w,h:p.h};
try{await host.patchSimple('board_items',g.id,attrs);if(g.type==='move')await Promise.all(g.members.map(m=>{const q=placements().find(p=>p.id===m.id);return host.patchSimple('board_items',m.id,{x:q.x,y:q.y})}));status('Saved canvas changes')}catch(err){status('Position was not saved: '+err.message,true);await host.reload();host.render()}}
function notePreview(text){
 const raw=safe(text||'');
 const html=raw.split(/\r?\n/).map(line=>{
   let t=line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
   t=t.replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g,(_m,label,url)=>{
     const valid=normalUrl(url);
     return valid?'<a href="'+safe(valid)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>':label;
   });
   if(t.startsWith('### '))return '<h4>'+t.slice(4)+'</h4>';
   if(t.startsWith('## '))return '<h3>'+t.slice(3)+'</h3>';
   if(t.startsWith('# '))return '<h2>'+t.slice(2)+'</h2>';
   if(t.startsWith('- '))return '<p class="wb-note-bullet">• '+t.slice(2)+'</p>';
   return t?'<p>'+t+'</p>':'<p class="wb-note-empty"> </p>';
 }).join('');
 return html;
}
async function onClick(e){const b=e.target.closest('[data-board-action]');if(!b)return;const a=b.dataset.boardAction,id=b.dataset.id;
if(a==='close-modal'&&b.classList.contains('wb-modal-overlay')&&e.target.closest('.wb-modal'))return;
e.preventDefault();e.stopPropagation();
if(a==='format-note'){
 const area=$('#wb-body-note');if(!area)return;
 const start=area.selectionStart,end=area.selectionEnd,selected=area.value.slice(start,end);
 const mark=b.dataset.mark;
 const snippet=mark==='bold'?'**'+(selected||'important idea')+'**':mark==='heading'?'# '+(selected||'Heading'):mark==='bullet'?'- '+(selected||'Key point'):'['+(selected||'Resource title')+'](https://)';
 area.setRangeText(snippet,start,end,'end');area.focus();return;
}
if(a==='preview-note'){
 const area=$('#wb-body-note'),preview=$('#wb-note-preview');if(!area||!preview)return;
 preview.innerHTML=notePreview(area.value);preview.hidden=!preview.hidden;return;
}
if(a==='open'){open(id);return}
if(a==='open-target'){open(id);return}
if(a==='back'){host.navigate('boards');ui.selected=null;ui.boardId=null;return}
if(a==='create-board-modal'){setModal('new-board',{spaceId:b.dataset.space|| (data().view==='space'?data().spaceId:null)});return}
if(a==='rename-board'){setModal('rename-board');return}
if(a==='board-options'){setModal('options');return}
if(a==='menu-card'){setModal('new-card',{kind:'note'});return}
if(a==='quick-note'||a==='quick-task'||a==='quick-link'||a==='quick-group'||a==='quick-board'){setModal('new-card',{kind:a.replace('quick-','')});return}
if(a==='menu-existing'){setModal('existing');return}
if(a==='tool-select'){ui.connecting=null;status('Select tool activated');return}
if(a==='close-modal'){ui.modal=null;host.render();return}
if(a==='edit-card'){ui.selected=id;host.render();return}
if(a==='close-detail'){ui.selected=null;host.render();return}
if(a==='zoom-in'||a==='zoom-out'){const vp=$('#wb-viewport'),r=vp?.getBoundingClientRect();if(r)zoomAt(a==='zoom-in'?1.2:1/1.2,r.left+r.width/2,r.top+r.height/2);return}
if(a==='zoom-reset'){ui.zoom=1;ui.pan={x:50,y:50};applyCamera(true);return}
if(a==='open-task'){host.openTask(id);return}
if(a==='remove-edge'){await run(()=>host.del('board_edges',id),'Connection removed');return}
if(a==='add-to-board'){setModal('other-board',{cardId:id});return}
if(a==='remove-placement'){if(!confirm('Remove this card from this board? The note remains available in other boards.'))return;ui.selected=null;await run(()=>host.del('board_items',id),'Card removed from board');return}
if(a==='delete-card'){if(!confirm('Delete this knowledge card everywhere, including other boards?'))return;ui.selected=null;await run(()=>host.del('knowledge_cards',id),'Card deleted everywhere');return}
}
async function onSubmit(e){const form=e.target;if(form.id==='wb-card-form'){e.preventDefault();e.stopPropagation();const id=form.dataset.card,f=Object.fromEntries(new FormData(form));const url=f.url.trim();if(url&&!normalUrl(url)){status('Please use a valid http(s) link',true);return}
await run(async()=>host.patch('knowledge_cards',id,{title:f.title.trim()||'Untitled',kind:f.kind,accent:f.accent,summary:f.summary,body:f.body,key_points:f.key_points,url:url||null,task_id:f.task_id||null,target_board_id:f.target_board_id||null}),'Card saved across linked boards');return}
if(form.id!=='wb-modal-form')return;e.preventDefault();e.stopPropagation();const kind=form.dataset.modalKind,f=Object.fromEntries(new FormData(form));
if(kind==='create-board'&&!f.title?.trim())return status('Give this board a name',true);
if(kind==='create-card'&&!f.title?.trim())return status('Give this card a title',true);
await run(async()=>{
if(kind==='create-board'){const b=await host.insert('boards',{title:f.title.trim(),space_id:f.space_id||null,description:f.description||''});ui.modal=null;await host.reload();open(b.id);return}
if(kind==='save-board'){await host.patch('boards',ui.boardId,{title:f.title.trim(),space_id:f.space_id||null,description:f.description||''});}
if(kind==='create-card'){const c=await host.insert('knowledge_cards',{title:f.title.trim(),kind:f.kind,summary:f.summary||'',accent:f.accent});await placeCard(c.id);}
if(kind==='place-existing'){if(!f.card_id)throw Error('No existing cards are available');await placeCard(f.card_id);}
if(kind==='place-other'){if(!f.board_id)throw Error('Create another board first');await placeCard(ui.modal.cardId,f.board_id);}
if(kind==='delete-board'){if(!confirm('Permanently delete this board layout?'))return;const id=ui.boardId;await host.del('boards',id);ui.boardId=null;ui.selected=null;ui.modal=null;host.navigate('boards');return;}
ui.modal=null;},kind==='create-board'?'Board created':kind==='create-card'?'Card created':kind==='save-board'?'Board updated':kind==='place-existing'||kind==='place-other'?'Card linked':'Board deleted');
}
function onWheel(e){const vp=e.target.closest('#wb-viewport');if(!vp)return;e.preventDefault();if(e.ctrlKey||e.metaKey)zoomAt(e.deltaY<0?1.08:1/1.08,e.clientX,e.clientY);else{ui.pan.x-=e.deltaX;ui.pan.y-=e.deltaY;applyCamera(true)}}
function onDbl(e){const el=e.target.closest('[data-item]');if(!el||e.target.closest('button'))return;e.preventDefault();ui.selected=el.dataset.item;host.render()}
function onKey(e){if(data().view!=='board-editor')return;const editing=e.target.closest('input,textarea,select,[contenteditable]');if(e.key==='Escape'){if(ui.modal)ui.modal=null;else ui.selected=null;ui.connecting=null;host.render();return}if(editing||ui.modal)return;
if(e.key.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();setModal('new-card',{kind:'note'})}
if((e.key==='Delete'||e.key==='Backspace')&&ui.selected){e.preventDefault();const id=ui.selected;if(confirm('Remove selected card from this board?')){ui.selected=null;run(()=>host.del('board_items',id),'Card removed')}}
}
function links(){const unique=new Map();for(const c of data().knowledgeCards){const urlList=[c.url,...(String(c.body||'')+' '+String(c.summary||'')+' '+String(c.key_points||'')).match(/https?:\/\/[^\s<>"']+/gi)||[]];for(const raw of urlList){const url=normalUrl(String(raw||'').replace(/[),.;!?]+$/,''));if(url&&!unique.has(url)){const first=data().boardItems.find(p=>p.card_id===c.id);const b=first?getBoard(first.board_id):null;unique.set(url,{id:c.id,url,title:c.kind==='link'?c.title:new URL(url).hostname,boardName:b?.title||'Knowledge card'})}}}return [...unique.values()]}
function init(value){host=value;document.addEventListener('click',onClick,true);document.addEventListener('submit',onSubmit,true);document.addEventListener('pointerdown',gestureStart);window.addEventListener('pointermove',gestureMove);window.addEventListener('pointerup',gestureEnd);document.addEventListener('wheel',onWheel,{passive:false});document.addEventListener('dblclick',onDbl);document.addEventListener('keydown',onKey,true)}
window.SELFBoards={init,open,renderLibrary,renderEditor:editor,links,spaceBoards,ui};
})();
