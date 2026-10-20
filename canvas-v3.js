/* SELF Concept C — Creative + Smart Diagramming canvas.
 * Visual-first canvas. Uses existing authenticated SELF host, Supabase and Cloudflare.
 * Old boards.js remains a fallback source; this module implements the same host API.
 */
(()=>{'use strict';
let api;
const ui={boardId:null,selected:new Set(),edge:null,tool:'select',tab:'style',modal:null,pan:{x:100,y:90},zoom:1,gesture:null,spaceDown:false,dirty:false,saveTimer:null,connecting:null,layout:'flow',history:[],redo:[],assetUrls:new Map(),loadingImages:new Set(),grid:true,notice:''};
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc=h, clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), num=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const palette={blue:'#6595fa',purple:'#8b5cf6',green:'#58caac',yellow:'#ffd782',red:'#ff8e9d',cyan:'#69c9de'};
const presets={
 rectangle:{fill:'#4a6fb5',stroke:'#729cff',color:'#f7fbff',fontSize:20,radius:13,opacity:1},
 ellipse:{fill:'#333d50',stroke:'#90b0fa',color:'#f7fbff',fontSize:20,radius:100,opacity:1},
 diamond:{fill:'#343e51',stroke:'#93a8cf',color:'#f7fbff',fontSize:18,radius:0,opacity:1},
 sticky:{fill:'#f8db7b',stroke:'#e7c86b',color:'#243040',fontSize:20,radius:7,opacity:1},
 text:{fill:'transparent',stroke:'transparent',color:'#e9eefa',fontSize:23,radius:0,opacity:1},
 knowledge:{fill:'#6451b0',stroke:'#987afa',color:'#ffffff',fontSize:20,radius:14,opacity:1},
 task:{fill:'#305d9f',stroke:'#6ba9fa',color:'#ffffff',fontSize:20,radius:14,opacity:1},
 reference:{fill:'#26313f',stroke:'#61748c',color:'#ffffff',fontSize:19,radius:13,opacity:1},
 image:{fill:'#2b3443',stroke:'#65768e',color:'#ffffff',fontSize:18,radius:10,opacity:1},
 frame:{fill:'transparent',stroke:'#7790af',color:'#dde8ff',fontSize:18,radius:11,opacity:1}
};
const glyph={select:'↖',hand:'✋',rectangle:'▢',ellipse:'◯',diamond:'◇',sticky:'▣',text:'T',knowledge:'✧',task:'☑',reference:'↗',image:'▧',frame:'▤',connect:'⤳'};
const state=()=>api.state(), board=()=>state().boards.find(b=>b.id===ui.boardId);
const items=()=>state().boardItems.filter(i=>i.board_id===ui.boardId);
const edges=()=>state().boardEdges.filter(e=>e.board_id===ui.boardId);
const card=id=>state().knowledgeCards.find(c=>c.id===id);
const itm=id=>items().find(i=>i.id===id);
const kind=i=>i.visual_kind||'knowledge';
const style=i=>({...presets[kind(i)]||presets.knowledge,...(i.style||{})});
const spaceName=id=>state().spaces.find(s=>s.id===id)?.name||'Personal Workspace';
const url=s=>{try{let u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
const validColour=s=>/^#[0-9a-fA-F]{3,8}$/.test(s||'')?s:'#719cff';
function say(msg,bad=false){ui.notice=msg;api.notify(msg,bad)}
function setBusy(v){ui.dirty=v;let e=$('#c3-save');if(e)e.textContent=v?'● Saving':'✓ Saved'}
async function sync(message){await api.reload();api.render();setBusy(false);if(message)say(message)}
async function transact(operation,message){setBusy(true);try{await operation();await sync(message)}catch(e){setBusy(false);say(e?.message||String(e),true);try{await api.reload();api.render()}catch{}}}
function history(undo,redo){ui.history.push({undo,redo});if(ui.history.length>70)ui.history.shift();ui.redo.length=0}
async function step(direction){const src=direction==='undo'?ui.history:ui.redo,dst=direction==='undo'?ui.redo:ui.history;const op=src.pop();if(!op){say('Nothing to '+direction);return}setBusy(true);try{await op[direction]();dst.push(op);await sync(direction==='undo'?'Undone':'Redone')}catch(e){src.push(op);setBusy(false);say(e.message,true)}}
const camera=(b)=>({x:num(b.pan_x,100),y:num(b.pan_y,90),z:clamp(num(b.zoom,1),.25,2.5)});
function open(id){const b=state().boards.find(b=>b.id===id);if(!b)return say('Board not found',true);ui.boardId=id;ui.selected.clear();ui.edge=null;ui.tool='select';ui.modal=null;ui.tab='style';let p=camera(b);ui.pan={x:p.x,y:p.y};ui.zoom=p.z;api.navigate('board-editor')}
function library(spaceId=null){
 const list=state().boards.filter(b=>!spaceId||b.space_id===spaceId);
 const head=spaceId?'<div class="c3-lib-head"><div><h2>Whiteboards</h2><p>Think visually, connect ideas and work in one space.</p></div><button class="c3-primary" data-c3="new-board" data-space="'+h(spaceId)+'">＋ New board</button></div>':
 '<div class="c3-lib-head"><div><div class="c3-eyebrow">YOUR CREATIVE WORKSPACE</div><h1>My Boards</h1><p>Build anything. Think freely. Bring order when you need it.</p></div><button class="c3-primary" data-c3="new-board">＋ New board</button></div>';
 return '<section class="c3-library">'+head+'<div class="c3-lib-grid">'+list.map(b=>{let count=state().boardItems.filter(i=>i.board_id===b.id).length;
 return '<button class="c3-lib-card" data-c3="open-board" data-id="'+h(b.id)+'"><div class="c3-thumb"><i></i><i></i><i></i><svg viewBox="0 0 200 110"><path d="M98 34L50 75 M98 34L150 75" stroke="#8799c8" stroke-width="1.7" fill="none"/></svg></div><strong>'+h(b.title)+'</strong><span>'+h(spaceName(b.space_id))+' · '+count+' objects</span></button>'}).join('')+
 '<button class="c3-lib-card c3-lib-new" data-c3="new-board" '+(spaceId?'data-space="'+h(spaceId)+'"':'')+'><span>＋</span><strong>Create board</strong><small>Start with a blank canvas</small></button></div>'+modal()+'</section>'
}
function button(action,text,extra=''){return '<button type="button" class="c3-btn" data-c3="'+action+'" '+extra+'>'+text+'</button>'}
function tool(name,label){const active=ui.tool===name;return '<button type="button" class="c3-tool'+(active?' active':'')+'" data-c3="tool" data-kind="'+name+'" title="'+label+'" aria-label="'+label+'" aria-pressed="'+active+'"><span>'+glyph[name]+'</span></button>'}
function inspector(){
 const sel=[...ui.selected].map(itm).filter(Boolean),first=sel[0],s=first?style(first):presets.knowledge,c=first?card(first.card_id):null;
 const tabs=['style','arrange','smart','notes'];
 let body='';
 if(!first)body='<div class="c3-no-selection"><span>✳</span><h3>Make something yours.</h3><p>Select an object to adjust its appearance, align a group, or add detailed notes.</p><div class="c3-hint">Tip: click any shape tool to add it without entering text first.</div></div>';
 else if(ui.tab==='style')body='<div class="c3-controls"><label>Fill <input type="color" data-c3-style="fill" value="'+validColour(s.fill==='transparent'?'#222b38':s.fill)+'"/></label>'+
 '<label>Border <input type="color" data-c3-style="stroke" value="'+validColour(s.stroke==='transparent'?'#222b38':s.stroke)+'"/></label>'+
 '<label>Text color <input type="color" data-c3-style="color" value="'+validColour(s.color)+'"/></label>'+
 '<label>Font size <input type="range" min="14" max="42" step="1" data-c3-style="fontSize" value="'+num(s.fontSize,20)+'"/><em>'+num(s.fontSize,20)+'px</em></label>'+
 '<label>Corner radius <input type="range" min="0" max="45" data-c3-style="radius" value="'+Math.min(45,num(s.radius,12))+'"/><em>'+num(s.radius,12)+'px</em></label>'+
 '<label>Opacity <input type="range" min="30" max="100" data-c3-style="opacity" value="'+Math.round(num(s.opacity,1)*100)+'"/><em>'+Math.round(num(s.opacity,1)*100)+'%</em></label></div>'+
 '<div class="c3-section-title">Quick palettes</div><div class="c3-swatches">'+Object.entries(palette).map(([key,val])=>'<button title="'+key+'" data-c3="swatch" data-value="'+val+'" style="background:'+val+'"></button>').join('')+'</div>';
 else if(ui.tab==='arrange')body='<div class="c3-section-title">Align selected</div><div class="c3-action-grid">'+['left','center','right','top','middle','bottom'].map(x=>button('align','↔ '+x,'data-align="'+x+'"')).join('')+'</div>'+
 '<div class="c3-section-title">Distribution and layering</div><div class="c3-action-grid">'+button('distribute','↔ Horizontal','data-axis="horizontal"')+button('distribute','↕ Vertical','data-axis="vertical"')+button('layer','Bring forward','data-dir="front"')+button('layer','Send backward','data-dir="back"')+'</div><p class="c3-side-hint">Shift+click objects or drag a selection box to select multiple.</p>';
 else if(ui.tab==='smart')body='<div class="c3-section-title">Intelligent organization</div><p class="c3-side-hint">Keep your creative freedom. Let SELF help when the structure gets messy.</p><div class="c3-smart-grid">'+
 button('auto-tidy','✦ Auto tidy')+button('layout-flow','⇢ Flow')+button('layout-tree','⌁ Tree')+button('layout-cluster','◈ Cluster')+button('straighten','⌁ Straighten connections')+'</div>'+
 '<div class="c3-section-title">Snap & guides</div><label class="c3-switch"><input type="checkbox" data-c3-grid '+(ui.grid?'checked':'')+'/> Snap to grid</label>';
 else if(ui.tab==='notes'){
 if(sel.length!==1)body='<p class="c3-side-hint">Select one card to edit deep knowledge.</p>';
 else body='<form id="c3-note-form" data-id="'+h(first.id)+'"><label class="c3-label">Title<input name="title" class="c3-input" value="'+h(c?.title||'')+'" placeholder="Give it a name when ready"/></label>'+
 '<label class="c3-label">Key points<textarea name="key_points" class="c3-input" rows="4" placeholder="One takeaway per line">'+h(c?.key_points||'')+'</textarea></label>'+
 '<label class="c3-label">Detailed notes<textarea name="body" class="c3-input" rows="7" placeholder="Write anything. This note can be as detailed as you want.">'+h(c?.body||'')+'</textarea></label>'+
 '<label class="c3-label">Reference link<input name="url" class="c3-input" type="url" value="'+h(c?.url||'')+'" placeholder="https://..."/></label>'+
 '<label class="c3-label">Link to task<select name="task_id" class="c3-input"><option value="">No task</option>'+state().tasks.map(t=>'<option value="'+h(t.id)+'" '+(c?.task_id===t.id?'selected':'')+'>'+h(t.title)+'</option>').join('')+'</select></label>'+
 '<label class="c3-label">Open another board<select name="target_board_id" class="c3-input"><option value="">None</option>'+state().boards.filter(b=>b.id!==ui.boardId).map(b=>'<option value="'+h(b.id)+'" '+(c?.target_board_id===b.id?'selected':'')+'>'+h(b.title)+'</option>').join('')+'</select></label>'+
 '<button class="c3-primary c3-wide" type="submit">✓ Save notes</button>'+
 (c?.task_id?button('open-task','↗ Open task','data-id="'+h(c.task_id)+'"'):'')+
 (c?.target_board_id?button('open-board','↗ Open board','data-id="'+h(c.target_board_id)+'"'):'')+
 '</form>';
 }
 return '<aside class="c3-inspector"><div class="c3-inspector-head"><span>Properties</span><span class="c3-subtle">'+(sel.length?sel.length+' selected':'Canvas')+'</span></div>'+
 '<div class="c3-inspector-tabs">'+tabs.map(k=>'<button class="'+(ui.tab===k?'active':'')+'" data-c3="tab" data-tab="'+k+'">'+({style:'Style',arrange:'Arrange',smart:'Smart Layout',notes:'Notes'}[k])+'</button>').join('')+'</div>'+
 '<div class="c3-inspector-content">'+body+'</div></aside>';
}
function rotatePoint(x,y,cx,cy,angle){const a=angle*Math.PI/180,dx=x-cx,dy=y-cy;return {x:cx+dx*Math.cos(a)-dy*Math.sin(a),y:cy+dx*Math.sin(a)+dy*Math.cos(a)}}
function anchor(i,side){const cx=i.x+i.w/2,cy=i.y+i.h/2;
const p={n:{x:cx,y:i.y},e:{x:i.x+i.w,y:cy},s:{x:cx,y:i.y+i.h},w:{x:i.x,y:cy}}[side]||{x:cx,y:cy};
return rotatePoint(p.x,p.y,cx,cy,num(i.rotation))}
function choose(a,b,from='auto',to='auto'){const dx=(b.x+b.w/2)-(a.x+a.w/2),dy=(b.y+b.h/2)-(a.y+a.h/2);let side=Math.abs(dx)>Math.abs(dy)*.8?(dx>=0?'e':'w'):(dy>=0?'s':'n');
let opposite={n:'s',s:'n',e:'w',w:'e'}[side];
return {from:from!=='auto'?from:side,to:to!=='auto'?to:opposite};}
function wireGeometry(e){const a=itm(e.source_item_id),b=itm(e.target_item_id);if(!a||!b)return null;
 const sides=choose(a,b,e.from_anchor,e.to_anchor),p=anchor(a,sides.from),q=anchor(b,sides.to),dx=q.x-p.x,dy=q.y-p.y;
 let path='',route=e.route_type||'curved';
 if(route==='straight')path='M'+p.x+' '+p.y+'L'+q.x+' '+q.y;
 else if(route==='elbow'){const horizontal=['e','w'].includes(sides.from);if(horizontal){const mx=p.x+dx/2;path='M'+p.x+' '+p.y+' L'+mx+' '+p.y+' Q'+mx+' '+p.y+' '+mx+' '+(p.y+Math.sign(dy)*Math.min(12,Math.abs(dy)/2))+' L'+mx+' '+q.y+' L'+q.x+' '+q.y}
 else {const my=p.y+dy/2;path='M'+p.x+' '+p.y+' L'+p.x+' '+my+' L'+q.x+' '+my+' L'+q.x+' '+q.y}}
 else {const outward={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};const f=outward[sides.from],t=outward[sides.to],control=clamp(Math.hypot(dx,dy)*.42,50,165);path='M'+p.x+' '+p.y+' C'+(p.x+f[0]*control)+' '+(p.y+f[1]*control)+','+(q.x+t[0]*control)+' '+(q.y+t[1]*control)+','+q.x+' '+q.y}
 return {path,p,q,labelX:(p.x+q.x)/2,labelY:(p.y+q.y)/2};}
function renderWires(){let out='<defs><marker id="c3-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1L9 5L1 9" stroke="#98aed0" stroke-width="1.7" fill="none"/></marker></defs>';
 for(const e of edges()){const g=wireGeometry(e);if(!g)continue;out+='<g class="c3-wire '+(ui.edge===e.id?'selected':'')+'" data-c3-edge="'+h(e.id)+'"><path d="'+g.path+'" fill="none" stroke="'+validColour(e.stroke)+'" stroke-width="'+num(e.stroke_width,2)+'" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#c3-arrow)"/>';
 if(e.label)out+='<text x="'+g.labelX+'" y="'+(g.labelY-9)+'" font-size="14" fill="#d9e4ff" text-anchor="middle">'+h(e.label)+'</text>';
 out+='</g>'}
 if(ui.gesture?.type==='connect'&&ui.gesture.toWorld){const from=anchor(itm(ui.gesture.id),ui.gesture.side||'e'),to=ui.gesture.toWorld;out+='<path d="M'+from.x+' '+from.y+' L'+to.x+' '+to.y+'" fill="none" stroke="#8b5cf6" stroke-dasharray="7 5" stroke-width="3"/>'}
 return out;
}
function objectMarkup(i){const k=kind(i),s=style(i),c=card(i.card_id),isSel=ui.selected.has(i.id),name=c?.title||'',summary=c?.summary||'';
 const fill=s.fill==='transparent'?'transparent':validColour(s.fill),stroke=s.stroke==='transparent'?'transparent':validColour(s.stroke),image=c?.asset_path?ui.assetUrls.get(c.asset_path):url(c?.url);
 const body=k==='image'?((image?'<img src="'+h(image)+'" alt="'+h(name||'Reference image')+'" draggable="false"/>':'<span class="c3-placeholder">▧<small>Add a reference image</small></span>')) :
 (k==='frame'?'<div class="c3-frame-title">'+h(name||'Untitled section')+'</div>':
 '<div class="c3-object-text">'+(name?'<div>'+h(name)+'</div>':(k==='knowledge'||k==='task'?'<span class="c3-object-icon">'+(k==='task'?'☑':'✧')+'</span>':''))+(summary&&['knowledge','task','reference'].includes(k)?'<p>'+h(summary)+'</p>':'')+'</div>');
 let label=h(name||'Blank '+k);
 return '<div class="c3-object c3-kind-'+k+(isSel?' selected':'')+'" data-c3-item="'+h(i.id)+'" tabindex="0" role="button" aria-label="'+label+'" style="left:'+i.x+'px;top:'+i.y+'px;width:'+i.w+'px;height:'+i.h+'px;transform:rotate('+num(i.rotation)+'deg);--fill:'+fill+';--stroke:'+stroke+';--ink:'+validColour(s.color)+';--corner:'+num(s.radius,12)+'px;--font-size:'+num(s.fontSize,20)+'px;opacity:'+clamp(num(s.opacity,1),.3,1)+';z-index:'+num(i.z)+'">'+
 '<div class="c3-object-face">'+body+'</div>'+
 (isSel?'<div class="c3-selection-border"></div>':'')+
 (isSel||ui.tool==='connect'?['n','e','s','w'].map(a=>'<button type="button" class="c3-anchor anchor-'+a+'" data-c3-port="'+h(i.id)+'" data-side="'+a+'" aria-label="Connect '+label+' '+a+'"></button>').join(''):'')+
 (isSel?['nw','n','ne','e','se','s','sw','w'].map(x=>'<div class="c3-handle handle-'+x+'" data-c3-resize="'+h(i.id)+'" data-dir="'+x+'"></div>').join(''):'')+
 '</div>';
}
function canvas(){
 const b=board();if(!b)return library();
 const objects=[...items()].sort((a,b)=>num(a.z)-num(b.z));
 return '<div class="self-board-editor c3-shell"><div class="c3-header"><div class="c3-breadcrumb"><button class="c3-icon-btn" data-c3="back" title="All boards">←</button><div><small>'+h(spaceName(b.space_id))+' / Board</small><strong>'+h(b.title)+'</strong></div></div>'+
 '<div class="c3-toolbar">'+['select','rectangle','ellipse','diamond','connect','text','image','sticky','frame','knowledge'].map(n=>tool(n,({knowledge:'Knowledge Card',sticky:'Sticky note',ellipse:'Circle',image:'Image',frame:'Frame'}[n]||n))).join('')+'</div>'+
 '<div class="c3-header-right">'+button('undo','↶','title="Undo"')+button('redo','↷','title="Redo"')+'<span class="c3-scale">'+Math.round(ui.zoom*100)+'%</span>'+button('fit','⛶','title="Fit view"')+'</div></div>'+
 '<div class="c3-content"><section class="c3-canvas" id="c3-canvas" tabindex="0" aria-label="Creative infinite whiteboard">'+
 '<div class="c3-world" id="c3-world" style="transform:translate('+ui.pan.x+'px,'+ui.pan.y+'px) scale('+ui.zoom+')">'+
 '<svg class="c3-wires" id="c3-wires" aria-label="Connected objects">'+renderWires()+'</svg>'+
 objects.map(objectMarkup).join('')+'</div>'+
 (!objects.length?'<div class="c3-empty"><span>✳</span><h2>Create first. Think later.</h2><p>Click a shape above to place it instantly. Double click to start writing.</p><button class="c3-primary" data-c3="add" data-kind="rectangle">＋ Make something</button></div>':'')+
 '<div class="c3-smart-strip">'+button('align','≡ Smart align','data-align="middle"')+button('auto-tidy','✦ Auto tidy')+button('layout-flow','⊞ Suggested layout')+'</div>'+
 '<div class="c3-bottom-tools">'+button('hand','✋ Pan')+button('select-tool','↖ Select')+'<span class="c3-divider"></span>'+button('zoom-out','−')+'<strong id="c3-zoom-label">'+Math.round(ui.zoom*100)+'%</strong>'+button('zoom-in','＋')+'</div>'+
 '<div class="c3-canvas-help">Shift+click multi-select · drag background to select · Space+drag pan · double-click text</div>'+
 '<div id="c3-marquee" hidden></div><input id="c3-upload" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif"/></section>'+
 inspector()+'</div>'+modal()+'</div>';
}
function modal(){if(!ui.modal)return '';const m=ui.modal;let content='',title='',action='';
 if(m.type==='board'){title='Create a board';action='create-board';content='<label>Board name<input name="title" class="c3-input" placeholder="My next idea" maxlength="160" required autofocus/></label><label>Space<select name="space_id" class="c3-input"><option value="">Personal Workspace</option>'+state().spaces.map(s=>'<option value="'+h(s.id)+'" '+(s.id===m.space?'selected':'')+'>'+h(s.name)+'</option>').join('')+'</select></label>';}
 if(m.type==='rename'){title='Board settings';action='rename-board';content='<label>Name<input class="c3-input" name="title" required value="'+h(board()?.title)+'"/></label>';}
 if(m.type==='reference'){title='Add reference';action='add-reference';content='<p>Paste an image URL or website link. You can style the card later.</p><label>URL<input class="c3-input" type="url" name="url" placeholder="https://..." required/></label>';}
 if(m.type==='existing'){title='Reuse existing knowledge';action='add-existing';const assigned=new Set(items().map(i=>i.card_id));content='<label>Knowledge card<select name="card_id" class="c3-input">'+state().knowledgeCards.filter(c=>!assigned.has(c.id)).map(c=>'<option value="'+h(c.id)+'">'+h(c.title||'Untitled knowledge card')+'</option>').join('')+'</select></label>';}
 return '<div class="c3-modal-overlay" data-c3="close-modal"><div class="c3-modal" role="dialog" aria-modal="true"><div class="c3-modal-head"><h2>'+title+'</h2><button class="c3-icon-btn" data-c3="close-modal">✕</button></div><form id="c3-modal-form" data-action="'+action+'">'+content+'<div class="c3-modal-actions"><button type="button" class="c3-btn" data-c3="close-modal">Cancel</button><button class="c3-primary" type="submit">Continue →</button></div></form></div></div>';
}
function centerPosition(w=240,hg=165){const vp=$('#c3-canvas'),width=vp?.clientWidth||950,height=vp?.clientHeight||700;
 return {x:clamp(Math.round((width*.50-ui.pan.x)/ui.zoom-w/2),-99900,99900),y:clamp(Math.round((height*.48-ui.pan.y)/ui.zoom-hg/2),-99900,99900)}}
function worldPoint(px,py){const r=$('#c3-canvas')?.getBoundingClientRect()||{left:0,top:0};return {x:(px-r.left-ui.pan.x)/ui.zoom,y:(py-r.top-ui.pan.y)/ui.zoom}}
const dims={rectangle:[240,155],ellipse:[190,190],diamond:[200,200],sticky:[190,195],text:[270,90],knowledge:[260,160],task:[250,155],frame:[550,350],reference:[260,180],image:[270,210]};
async function create(k,position=null,extra={}){
 if(k==='image'&&!extra.url&&!extra.asset_path){$('#c3-upload')?.click();return}
 if(k==='reference'&&!extra.url&&!extra.asset_path){ui.modal={type:'reference'};api.render();return}
 const [w,hg]=dims[k]||dims.rectangle;
 const positionFinal=position||centerPosition(w,hg);
 const data={title:extra.title||'',kind:k==='task'?'task':k==='reference'?'link':'note',summary:extra.summary||'',url:extra.url||null,asset_path:extra.asset_path||null};
 let c,i;
 await transact(async()=>{
   c=await api.insert('knowledge_cards',data);
   try{i=await api.insert('board_items',{board_id:ui.boardId,card_id:c.id,visual_kind:k,x:Math.round(positionFinal.x),y:Math.round(positionFinal.y),w,h:hg,z:items().length+1,style:{...presets[k]}})}
   catch(e){try{await api.del('knowledge_cards',c.id)}catch{}throw e}
   ui.selected=new Set([i.id]);ui.tab='style';
 },'Object added');
 if(c&&i){history(async()=>{await api.del('board_items',i.id);await api.del('knowledge_cards',c.id)},async()=>{await api.insert('knowledge_cards',{...c});await api.insert('board_items',{...i})})}
 return i;
}
async function newBoard(title,space){let b;await transact(async()=>{b=await api.insert('boards',{title:title.trim(),space_id:space||null})},'Board created');if(b)open(b.id)}
function snap(x){return ui.grid?Math.round(x/12)*12:x}
function saveCam(){clearTimeout(ui.saveTimer);let id=ui.boardId,v={pan_x:ui.pan.x,pan_y:ui.pan.y,zoom:ui.zoom};ui.saveTimer=setTimeout(async()=>{if(id)try{await api.patch('boards',id,v)}catch(e){say('Canvas position not saved: '+e.message,true)}},550)}
function updateCam(){let w=$('#c3-world');if(w)w.style.transform='translate('+ui.pan.x+'px,'+ui.pan.y+'px) scale('+ui.zoom+')';let z=$('#c3-zoom-label');if(z)z.textContent=Math.round(ui.zoom*100)+'%'}
function zoomAt(factor,x,y){const vp=$('#c3-canvas');if(!vp)return;const r=vp.getBoundingClientRect(),px=x-r.left,py=y-r.top,wx=(px-ui.pan.x)/ui.zoom,wy=(py-ui.pan.y)/ui.zoom;ui.zoom=clamp(ui.zoom*factor,.25,2.5);ui.pan={x:px-wx*ui.zoom,y:py-wy*ui.zoom};updateCam();saveCam()}
function liveRefresh(){const layer=$('#c3-wires');if(layer)layer.innerHTML=renderWires();for(const i of items()){const n=document.querySelector('[data-c3-item="'+i.id+'"]');if(n){n.style.left=i.x+'px';n.style.top=i.y+'px';n.style.width=i.w+'px';n.style.height=i.h+'px';n.style.transform='rotate('+num(i.rotation)+'deg)'}}}
function selection(ids){ui.selected=new Set(ids);ui.edge=null;api.render()}
function entries(){return [...ui.selected].map(itm).filter(Boolean)}
function positions(ids){const d={};for(const id of ids){const i=itm(id);if(i)d[id]={x:i.x,y:i.y,w:i.w,h:i.h,z:i.z};}return d}
async function persistPositions(before,after,msg){const ids=Object.keys(after);await transact(async()=>{for(const id of ids)await api.patchSimple('board_items',id,after[id])},msg);history(async()=>{for(const id of ids)await api.patchSimple('board_items',id,before[id])},async()=>{for(const id of ids)await api.patchSimple('board_items',id,after[id])})}
async function applyLayout(mode){let arr=entries();if(arr.length<2)arr=items().filter(i=>kind(i)!=='frame');if(arr.length<2)return say('Select at least 2 objects',true);
 const ids=arr.map(i=>i.id),before=positions(ids);arr=[...arr].sort((a,b)=>a.y-b.y||a.x-b.x);
 const minX=Math.min(...arr.map(i=>i.x)),minY=Math.min(...arr.map(i=>i.y));
 if(mode==='cluster'||mode==='tidy'){const columns=Math.max(2,Math.ceil(Math.sqrt(arr.length)));let y=minY;for(let n=0;n<arr.length;n+=columns){const row=arr.slice(n,n+columns);let x=minX;for(const i of row){i.x=x;i.y=y;x+=i.w+40}y+=Math.max(...row.map(i=>i.h))+44}}
 else if(mode==='tree'){const root=arr[0];root.x=minX+Math.max(0,(arr.length-2)*130);root.y=minY;let x=minX;for(const i of arr.slice(1)){i.x=x;i.y=minY+root.h+130;x+=i.w+50}}
 else {let x=minX;for(const i of arr){i.x=x;i.y=minY;x+=i.w+60}}
 const after=positions(ids);liveRefresh();await persistPositions(before,after,'Layout organized')}
async function align(direction){const arr=entries();if(arr.length<2)return say('Select two or more objects',true);const ids=arr.map(i=>i.id),before=positions(ids);
 const minX=Math.min(...arr.map(i=>i.x)),maxX=Math.max(...arr.map(i=>i.x+i.w)),minY=Math.min(...arr.map(i=>i.y)),maxY=Math.max(...arr.map(i=>i.y+i.h));
 for(const i of arr){if(direction==='left')i.x=minX;if(direction==='center')i.x=(minX+maxX-i.w)/2;if(direction==='right')i.x=maxX-i.w;if(direction==='top')i.y=minY;if(direction==='middle')i.y=(minY+maxY-i.h)/2;if(direction==='bottom')i.y=maxY-i.h;}
 liveRefresh();await persistPositions(before,positions(ids),'Objects aligned')}
async function distribute(axis){const arr=entries().sort((a,b)=>axis==='horizontal'?a.x-b.x:a.y-b.y);if(arr.length<3)return say('Select at least three objects',true);
 const before=positions(arr.map(i=>i.id)),first=arr[0],last=arr[arr.length-1],span=axis==='horizontal'?(last.x+last.w-first.x):(last.y+last.h-first.y);
 const total=arr.reduce((x,i)=>x+(axis==='horizontal'?i.w:i.h),0),gap=(span-total)/(arr.length-1);let p=axis==='horizontal'?first.x:first.y;
 for(const i of arr){if(axis==='horizontal')i.x=p;else i.y=p;p+=(axis==='horizontal'?i.w:i.h)+gap}
 liveRefresh();await persistPositions(before,positions(arr.map(i=>i.id)),'Objects distributed')}
async function applyStyle(field,value){const arr=entries();if(!arr.length)return;const old=arr.map(i=>({id:i.id,value:{...i.style}}));
 let v=['fontSize','radius','opacity'].includes(field)?num(value):value;if(field==='opacity')v=clamp(v/100,.3,1);
 const now=arr.map(i=>({id:i.id,value:{...style(i),[field]:v}}));for(const n of now){itm(n.id).style=n.value}
 await transact(async()=>{for(const n of now)await api.patchSimple('board_items',n.id,{style:n.value})},'Style updated');
 history(async()=>{for(const n of old)await api.patchSimple('board_items',n.id,{style:n.value})},async()=>{for(const n of now)await api.patchSimple('board_items',n.id,{style:n.value})});
}
async function addEdge(from,to,fromSide='auto',toSide='auto'){if(from===to||!itm(from)||!itm(to))return;let e;await transact(async()=>{e=await api.insert('board_edges',{board_id:ui.boardId,source_item_id:from,target_item_id:to,from_anchor:fromSide,to_anchor:toSide,route_type:'curved'})},'Connected');if(e)history(async()=>api.del('board_edges',e.id),async()=>api.insert('board_edges',{...e}))}
async function upload(file){if(!file)return;const allowed=['image/jpeg','image/png','image/webp','image/gif'];if(!allowed.includes(file.type)||file.size>10485760)return say('Use a PNG, JPG, WebP or GIF under 10 MB',true);
 setBusy(true);try{const path=await api.uploadImage(file);const signed=await api.signImage(path);ui.assetUrls.set(path,signed);await create('image',null,{asset_path:path,title:''})}catch(e){setBusy(false);say('Upload failed: '+e.message,true)}}
async function imageResolve(){for(const c of state().knowledgeCards){if(!c.asset_path||ui.assetUrls.has(c.asset_path)||ui.loadingImages.has(c.asset_path))continue;ui.loadingImages.add(c.asset_path);api.signImage(c.asset_path).then(link=>{ui.assetUrls.set(c.asset_path,link);if(state().view==='board-editor')api.render()}).catch(()=>{}).finally(()=>ui.loadingImages.delete(c.asset_path))}}
function formatPoint(i){return {x:i.x,y:i.y,w:i.w,h:i.h}}
function gestureStart(e){if(state().view!=='board-editor'||e.button!==0)return;const vp=e.target.closest('#c3-canvas');if(!vp||ui.modal)return;
 const t=e.target,port=t.closest('[data-c3-port]'),res=t.closest('[data-c3-resize]'),node=t.closest('[data-c3-item]'),edge=t.closest('[data-c3-edge]');
 if(port){ui.gesture={type:'connect',id:port.dataset.c3Port,side:port.dataset.side,from:{x:e.clientX,y:e.clientY},toWorld:worldPoint(e.clientX,e.clientY)};e.preventDefault();return}
 if(edge){ui.edge=edge.dataset.c3Edge;ui.selected.clear();api.render();return}
 if(node&&ui.tool!=='hand'&&!ui.spaceDown){const id=node.dataset.c3Item;
 if(e.shiftKey){let ids=new Set(ui.selected);ids.has(id)?ids.delete(id):ids.add(id);selection(ids);return}
 if(!ui.selected.has(id)){ui.selected=new Set([id]);api.render()}
 const rect=res?.dataset.dir,selected=entries().map(i=>i.id);ui.gesture={type:res?'resize':'move',id,handle:rect,from:{x:e.clientX,y:e.clientY},original:positions(selected),ids:selected,moved:false};
 e.preventDefault();return}
 if(t.closest('button,input,textarea,select'))return;
 if(ui.spaceDown||ui.tool==='hand'||e.button===1){ui.gesture={type:'pan',from:{x:e.clientX,y:e.clientY},orig:{...ui.pan},moved:false};e.preventDefault();return}
 if(ui.tool!=='select'&&ui.tool!=='connect'){const k=ui.tool,pt=worldPoint(e.clientX,e.clientY);ui.tool='select';create(k,{x:snap(pt.x),y:snap(pt.y)});e.preventDefault();return}
 if(ui.tool==='connect'){ui.gesture={type:'pan',from:{x:e.clientX,y:e.clientY},orig:{...ui.pan},moved:false};return}
 ui.gesture={type:'marquee',from:{x:e.clientX,y:e.clientY},at:{x:e.clientX,y:e.clientY},shift:e.shiftKey,moved:false};e.preventDefault();}
function gestureMove(e){const g=ui.gesture;if(!g)return;const dx=e.clientX-g.from.x,dy=e.clientY-g.from.y;g.moved=g.moved||Math.hypot(dx,dy)>3;
 if(g.type==='pan'){ui.pan={x:g.orig.x+dx,y:g.orig.y+dy};updateCam();return}
 if(g.type==='connect'){g.toWorld=worldPoint(e.clientX,e.clientY);const el=$('#c3-wires');if(el)el.innerHTML=renderWires();return}
 if(g.type==='marquee'){g.at={x:e.clientX,y:e.clientY};const r=$('#c3-canvas')?.getBoundingClientRect();const el=$('#c3-marquee');if(!el||!r)return;el.hidden=false;el.style.cssText='left:'+(Math.min(g.from.x,e.clientX)-r.left)+'px;top:'+(Math.min(g.from.y,e.clientY)-r.top)+'px;width:'+Math.abs(dx)+'px;height:'+Math.abs(dy)+'px';return}
 if(!g.moved)return;
 const k=ui.zoom,i=itm(g.id);if(!i)return;
 if(g.type==='move'){for(const id of g.ids){const p=itm(id),r=g.original[id];if(p&&r){p.x=clamp(snap(r.x+dx/k),-99990,99990);p.y=clamp(snap(r.y+dy/k),-99990,99990)}}}
 if(g.type==='resize'){const orig=g.original[g.id];if(!orig)return;const direction=g.handle,xs=dx/k,ys=dy/k;let x=orig.x,y=orig.y,w=orig.w,h=orig.h;
 if(direction.includes('e'))w+=xs;if(direction.includes('s'))h+=ys;if(direction.includes('w')){x+=xs;w-=xs}if(direction.includes('n')){y+=ys;h-=ys}
 if(w<70){if(direction.includes('w'))x-=70-w;w=70}if(h<55){if(direction.includes('n'))y-=55-h;h=55}
 Object.assign(i,{x:snap(x),y:snap(y),w:snap(w),h:snap(h)});}
 liveRefresh();
}
async function gestureEnd(e){const g=ui.gesture;if(!g)return;ui.gesture=null;
 if(g.type==='pan'){if(g.moved)saveCam();return}
 if(g.type==='marquee'){let el=$('#c3-marquee');if(el)el.hidden=true;if(!g.moved){if(!g.shift)selection([]);return}
 const a=worldPoint(g.from.x,g.from.y),b=worldPoint(e.clientX,e.clientY),bounds={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),x2:Math.max(a.x,b.x),y2:Math.max(a.y,b.y)};
 const found=items().filter(i=>i.x<bounds.x2&&i.x+i.w>bounds.x&&i.y<bounds.y2&&i.y+i.h>bounds.y).map(i=>i.id);selection(g.shift?[...ui.selected,...found]:found);return}
 if(g.type==='connect'){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-c3-port]');if(target&&target.dataset.c3Port!==g.id)await addEdge(g.id,target.dataset.c3Port,g.side,target.dataset.side);else say('Drag to a connection dot on another shape');const el=$('#c3-wires');if(el)el.innerHTML=renderWires();return}
 if(!g.moved){ui.tab='style';api.render();return}
 const after=positions(g.ids);await persistPositions(g.original,after,g.type==='resize'?'Size saved':'Position saved');}
function wheel(e){if(state().view!=='board-editor'||!e.target.closest('#c3-canvas'))return;e.preventDefault();
 if(e.ctrlKey||e.metaKey){zoomAt(Math.exp(-e.deltaY*.0012),e.clientX,e.clientY)}else{ui.pan.x-=e.deltaX;ui.pan.y-=e.deltaY;updateCam();saveCam()}}
async function action(e){const el=e.target.closest('[data-c3]');if(!el)return;const a=el.dataset.c3;
 if(a==='close-modal'&&el.classList.contains('c3-modal-overlay')&&e.target.closest('.c3-modal'))return;
 e.preventDefault();e.stopPropagation();const id=el.dataset.id;
 if(a==='open-board'){open(id);return}
 if(a==='back'){ui.boardId=null;api.navigate('boards');return}
 if(a==='new-board'){ui.modal={type:'board',space:el.dataset.space|| (state().view==='space'?state().spaceId:null)};api.render();return}
 if(a==='close-modal'){ui.modal=null;api.render();return}
 if(a==='rename'){ui.modal={type:'rename'};api.render();return}
 if(a==='tool'){let k=el.dataset.kind;ui.tool=k;if(k==='image'){$('#c3-upload')?.click();return}if(k==='knowledge'||k==='sticky'||k==='text'||k==='rectangle'||k==='ellipse'||k==='diamond'||k==='frame'){await create(k);ui.tool='select'}else api.render();return}
 if(a==='add'){await create(el.dataset.kind||'rectangle');return}
 if(a==='tab'){ui.tab=el.dataset.tab;api.render();return}
 if(a==='select-tool'){ui.tool='select';api.render();return}
 if(a==='hand'){ui.tool='hand';api.render();return}
 if(a==='undo'||a==='redo'){await step(a);return}
 if(a==='zoom-in'||a==='zoom-out'){const r=$('#c3-canvas')?.getBoundingClientRect();if(r)zoomAt(a==='zoom-in'?1.2:1/1.2,r.left+r.width/2,r.top+r.height/2);return}
 if(a==='fit'){ui.zoom=1;ui.pan={x:95,y:90};updateCam();saveCam();return}
 if(a==='swatch'){await applyStyle('fill',el.dataset.value);return}
 if(a==='align'){await align(el.dataset.align);return}
 if(a==='distribute'){await distribute(el.dataset.axis);return}
 if(a==='auto-tidy'){await applyLayout('tidy');return}
 if(a==='layout-flow'){await applyLayout('flow');return}
 if(a==='layout-tree'){await applyLayout('tree');return}
 if(a==='layout-cluster'){await applyLayout('cluster');return}
 if(a==='straighten'){await transact(async()=>{for(const edge of edges())await api.patchSimple('board_edges',edge.id,{route_type:'elbow'})},'Connectors straightened');return}
 if(a==='layer'){const arr=entries();if(!arr.length)return;await transact(async()=>{for(const i of arr)await api.patchSimple('board_items',i.id,{z:el.dataset.dir==='front'?Math.max(...items().map(x=>num(x.z)))+1:Math.min(...items().map(x=>num(x.z)))-1})},'Layer updated');return}
 if(a==='open-task'){api.openTask(id);return}
 if(a==='existing'){ui.modal={type:'existing'};api.render();return}
}
async function submit(e){const f=e.target;if(!f.id?.startsWith('c3-'))return;e.preventDefault();e.stopPropagation();const o=Object.fromEntries(new FormData(f).entries());
 if(f.id==='c3-modal-form'){const a=f.dataset.action;ui.modal=null;
 if(a==='create-board'){if(!o.title?.trim())return say('Name your board',true);await newBoard(o.title,o.space_id);return}
 if(a==='rename-board'){await transact(()=>api.patch('boards',ui.boardId,{title:o.title.trim()}),'Board renamed');return}
 if(a==='add-reference'){const u=url(o.url);if(!u)return say('Use a valid http(s) link',true);await create('reference',null,{url:u});return}
 if(a==='add-existing'){if(!o.card_id)return;await transact(()=>api.insert('board_items',{board_id:ui.boardId,card_id:o.card_id,visual_kind:'knowledge',...centerPosition(255,170),w:255,h:170}),'Shared card placed');return}}
 if(f.id==='c3-note-form'){const one=itm(f.dataset.id);if(!one)return;const u=o.url?.trim();if(u&&!url(u))return say('Invalid URL',true);
 await transact(()=>api.patch('knowledge_cards',one.card_id,{title:o.title||'',body:o.body||'',key_points:o.key_points||'',url:u||null,task_id:o.task_id||null,target_board_id:o.target_board_id||null}),'Notes saved to your knowledge library');return}}
function change(e){const field=e.target.dataset.c3Style;if(field){applyStyle(field,e.target.value);return}
 if(e.target.matches('[data-c3-grid]'))ui.grid=e.target.checked;
 if(e.target.id==='c3-upload'){upload(e.target.files?.[0]);e.target.value=''}}
function keydown(e){if(state().view!=='board-editor')return;const typing=e.target.closest('input,textarea,select,[contenteditable=true]');
 if(e.key===' '&&!typing){ui.spaceDown=true;e.preventDefault()}
 if(typing)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();step(e.shiftKey?'redo':'undo');return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();step('redo');return}
 if(e.key==='Escape'){ui.modal=null;ui.tool='select';ui.gesture=null;selection([]);return}
 if(e.key==='Delete'||e.key==='Backspace'){if(ui.selected.size){e.preventDefault();let records=entries().map(i=>({...i})),ids=records.map(i=>i.id);ui.selected.clear();transact(async()=>{for(const id of ids)await api.del('board_items',id)},'Objects removed');history(async()=>{for(const i of records)await api.insert('board_items',i)},async()=>{for(const i of records)await api.del('board_items',i.id)})}return}
 if(e.key.toLowerCase()==='r'){e.preventDefault();create('rectangle')}
 if(e.key.toLowerCase()==='n'){e.preventDefault();create('sticky')}
 if(e.key.toLowerCase()==='v'){e.preventDefault();ui.tool='select';api.render()}
}
function dbl(e){if(state().view!=='board-editor')return;const node=e.target.closest('[data-c3-item]');if(!node)return;const i=itm(node.dataset.c3Item),c=card(i?.card_id);if(!i||!c)return;e.preventDefault();e.stopPropagation();ui.selected=new Set([i.id]);
 if(kind(i)==='image'){ui.tab='notes';api.render();return}
 const text=node.querySelector('.c3-object-text')||node.querySelector('.c3-frame-title');if(!text)return;
 const existing=text.querySelector('div')?.textContent||c.title||'';text.innerHTML='<textarea class="c3-inline" maxlength="200" rows="3" aria-label="Type your note">'+h(existing)+'</textarea>';
 const area=text.querySelector('textarea');if(!area)return;area.focus();area.select();
 let committed=false;
 const complete=async(save)=>{if(committed)return;committed=true;const v=area.value; if(save){await transact(()=>api.patch('knowledge_cards',c.id,{title:v}),'Text saved')}else api.render()};
 area.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.stopPropagation();complete(false)}else if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();ev.stopPropagation();complete(true)}});
 area.addEventListener('blur',()=>complete(true));}
function links(){const found=new Map();for(const c of state().knowledgeCards){const hits=[c.url,...(String(c.body||'')+' '+String(c.key_points||'')+' '+String(c.summary||'')).match(/https?:\/\/[^\s<>"']+/gi)||[]];for(let raw of hits){let u=url(String(raw||'').replace(/[),.;!?]+$/,''));if(u&&!found.has(u)){const i=state().boardItems.find(i=>i.card_id===c.id);const b=state().boards.find(b=>b.id===i?.board_id);found.set(u,{id:c.id,title:c.title||new URL(u).hostname,url:u,boardName:b?.title||'Knowledge'})}}}return [...found.values()]}
function init(x){api=x;document.addEventListener('click',action,true);document.addEventListener('submit',submit,true);document.addEventListener('change',change,true);document.addEventListener('pointerdown',gestureStart);window.addEventListener('pointermove',gestureMove);window.addEventListener('pointerup',gestureEnd);document.addEventListener('wheel',wheel,{passive:false});document.addEventListener('dblclick',dbl,true);document.addEventListener('keydown',keydown,true);document.addEventListener('keyup',e=>{if(e.key===' ')ui.spaceDown=false});}
window.SELFBoards={init,open,renderLibrary:library,renderEditor:()=>{queueMicrotask(imageResolve);return canvas()},links,spaceBoards:id=>state().boards.filter(b=>b.space_id===id),ui,geometry:{anchor,choose,wireGeometry}};
})();