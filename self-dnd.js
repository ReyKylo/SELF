/* SELF drag-and-drop: pointer, touch and keyboard, zero dependencies.
   Zones: [data-dnd-zone="type:value"] holding [data-dnd-item] cards (optionally inside [data-dnd-list]).
   Nothing is saved here. Each zone type registers an adapter whose commit() calls an existing SELF save function. */
(function(root){
'use strict';
const doc=root.document;
const adapters=new Map();
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SPRING='cubic-bezier(.34,1.56,.64,1)',OUT='cubic-bezier(.2,.8,.2,1)';
let d=null,kbd=null,suppressClick=false,raf=0,pending=null;

function register(type,adapter){adapters.set(type,adapter)}
/* First index in `list` (records already in the target zone, mover excluded) where `moving` sorts after everything before it. */
function sortedSlot(list,moving,compare){let i=0;while(i<list.length&&compare(list[i],moving)<=0)i++;return i}

const say=m=>{const l=doc.getElementById('dnd-live');if(l){l.textContent='';setTimeout(()=>{l.textContent=m},30)}};
const zoneOf=el=>el?.closest?.('[data-dnd-zone]');
const listOf=z=>z.querySelector('[data-dnd-list]')||z;
const parse=z=>{const s=z.dataset.dndZone,i=s.indexOf(':');return {type:s.slice(0,i),value:s.slice(i+1)}};
const items=z=>[...listOf(z).querySelectorAll(':scope>[data-dnd-item]')];
const adapterFor=z=>z&&adapters.get(parse(z).type);
const nameOf=(z)=>{const a=adapterFor(z),v=parse(z).value;return a?.label?a.label(v):v};

function flipMove(nodes,mutate){
 const before=new Map(nodes.map(n=>[n,n.getBoundingClientRect()]));mutate();
 if(reduced())return;
 nodes.forEach(n=>{const b=before.get(n),a=n.getBoundingClientRect(),dx=b.left-a.left,dy=b.top-a.top;
  if(dx||dy)n.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:240,easing:OUT})});
}
function placeIn(zone,item,pointerY){
 const ad=adapterFor(zone);if(!ad||(ad.accepts&&!ad.accepts(item,zone)))return false;
 const others=items(zone).filter(n=>n!==item);
 let idx=ad.landingIndex?ad.landingIndex(item,zone,others):null;
 if(idx==null){idx=others.findIndex(n=>{const r=n.getBoundingClientRect();return pointerY<r.top+r.height/2});if(idx<0)idx=others.length}
 const ref=others[idx]||null;
 if(item.parentElement===listOf(zone)&&item.nextElementSibling===ref)return true;
 const from=zoneOf(item);
 const affected=[...new Set([...others,...(from?items(from):[])])].filter(n=>n!==item);
 flipMove(affected,()=>listOf(zone).insertBefore(item,ref));
 return true;
}
function home(){listOf(d.from).insertBefore(d.item,d.fromNext?.isConnected?d.fromNext:null)}

/* ---------- pointer ---------- */
function down(e){
 if(e.button>0||d||kbd)return;
 const item=e.target.closest?.('[data-dnd-item]');if(!item)return;
 const onGrip=!!e.target.closest('[data-dnd-grip]');
 /* Buttons are fine to drag from: a drag only starts after 6px of movement and then swallows the click. Form controls and links are not. */
 if(!onGrip&&e.target.closest('a,input,select,textarea,label,[data-dnd-nodrag]'))return;
 const touch=e.pointerType!=='mouse';
 d={item,id:item.dataset.dndItem,from:zoneOf(item),fromNext:item.nextElementSibling,x0:e.clientX,y0:e.clientY,pid:e.pointerId,started:false,touch,armed:!touch||onGrip,timer:0};
 if(touch&&!onGrip)d.timer=setTimeout(()=>{if(d&&!d.started){d.armed=true;navigator.vibrate?.(8);start(e)}},350);
 root.addEventListener('pointermove',move,{passive:false});root.addEventListener('pointerup',up);root.addEventListener('pointercancel',cancel);
}
function start(e){
 const r=d.item.getBoundingClientRect(),g=d.item.cloneNode(true);
 g.classList.add('dnd-ghost');g.removeAttribute('id');g.setAttribute('aria-hidden','true');g.removeAttribute('data-dnd-item');g.removeAttribute('draggable');
 Object.assign(g.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
 doc.body.appendChild(g);
 Object.assign(d,{ghost:g,ox:e.clientX-r.left,oy:e.clientY-r.top,started:true,px:e.clientX,py:e.clientY,left:r.left,top:r.top});
 d.item.classList.add('dnd-placeholder');doc.documentElement.classList.add('dnd-active');
 if(!reduced())g.animate([{transform:'none'},{transform:'scale(1.04) rotate(-1.5deg)'}],{duration:160,easing:SPRING,fill:'forwards'});
 say('Picked up '+(d.item.getAttribute('aria-label')||'item'));
 loop();
}
function move(e){
 if(!d||e.pointerId!==d.pid)return;
 if(!d.started){
  const dist=Math.hypot(e.clientX-d.x0,e.clientY-d.y0);
  if(d.touch&&!d.armed){if(dist>8){clearTimeout(d.timer);cleanup()}return}
  if(dist<6)return;start(e);
 }
 e.preventDefault();d.px=e.clientX;d.py=e.clientY;
 d.ghost.style.translate=(e.clientX-d.ox-d.left)+'px '+(e.clientY-d.oy-d.top)+'px';
 const z=zoneOf(doc.elementFromPoint(e.clientX,e.clientY));
 if(z!==d.over){
  d.over?.classList.remove('dnd-over');d.over=z;
  if(z&&placeIn(z,d.item,e.clientY)){z.classList.add('dnd-over');say('Over '+nameOf(z))}
 }else if(z&&adapterFor(z)&&!adapterFor(z).landingIndex)placeIn(z,d.item,e.clientY);
}
function loop(){
 cancelAnimationFrame(raf);
 raf=requestAnimationFrame(function step(){
  if(!d?.started)return;
  const sc=d.over?.closest('[data-dnd-scroll]')||doc.scrollingElement;
  const r=sc===doc.scrollingElement?{left:0,right:root.innerWidth,top:0,bottom:root.innerHeight}:sc.getBoundingClientRect();
  const edge=56,sx=d.px<r.left+edge?-(r.left+edge-d.px):d.px>r.right-edge?d.px-(r.right-edge):0;
  const sy=d.py<r.top+edge?-(r.top+edge-d.py):d.py>r.bottom-edge?d.py-(r.bottom-edge):0;
  if(sx||sy)sc.scrollBy(Math.max(-18,Math.min(18,sx/3)),Math.max(-18,Math.min(18,sy/3)));
  raf=requestAnimationFrame(step);
 });
}
async function up(e){
 if(!d||e.pointerId!==d.pid)return;
 clearTimeout(d.timer);
 if(!d.started){cleanup();return}
 suppressClick=true;setTimeout(()=>{suppressClick=false},0);
 const target=d.over&&adapterFor(d.over)&&(!adapterFor(d.over).accepts||adapterFor(d.over).accepts(d.item,d.over))?d.over:d.from;
 if(target===d.from&&zoneOf(d.item)!==d.from)home();
 await settle(d.ghost,d.item);
 await finish(target);
}
function settle(g,item){
 if(!g)return Promise.resolve();
 if(reduced()){g.remove();return Promise.resolve()}
 const a=item.getBoundingClientRect();
 return g.animate([{translate:g.style.translate||'0 0',transform:'scale(1.04) rotate(-1.5deg)'},
  {translate:(a.left-d.left)+'px '+(a.top-d.top)+'px',transform:'none'}],{duration:220,easing:SPRING,fill:'forwards'}).finished.then(()=>g.remove(),()=>g.remove());
}
async function finish(target){
 const {item,id,from,fromNext}=d,ad=adapterFor(target),t=parse(target),f=parse(from);
 item.classList.remove('dnd-placeholder');doc.documentElement.classList.remove('dnd-active');target.classList.remove('dnd-over');
 const index=items(target).indexOf(item);cleanup();
 if(target===from&&ad.landingIndex){say('Dropped. No change.');return}
 item.classList.add('is-saving');item.setAttribute('aria-busy','true');
 /* The adapter's save re-renders the page, so the landed marker is set before the save starts. */
 pending={id,zone:target.dataset.dndZone,from:from.dataset.dndZone};
 let ok=false;try{ok=await ad.commit(id,f.value,t.value,{index})}catch(err){ok=false}
 if(ok){say('Moved to '+nameOf(target));return}
 pending=null;
 if(item.isConnected){
  flipMove([...items(target),...items(from)].filter(n=>n!==item),()=>listOf(from).insertBefore(item,fromNext?.isConnected?fromNext:null));
  item.classList.remove('is-saving');item.removeAttribute('aria-busy');
 }
 say('Move failed. Returned to '+nameOf(from));
}
function cancel(){
 if(d?.started){d.ghost?.remove();home();d.item.classList.remove('dnd-placeholder');doc.documentElement.classList.remove('dnd-active');d.over?.classList.remove('dnd-over');say('Cancelled')}
 cleanup();
}
function cleanup(){root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',cancel);cancelAnimationFrame(raf);d=null}

/* ---------- keyboard: Space picks up, arrows move, Space or Enter drops, Escape cancels ---------- */
function key(e){
 const item=e.target.closest?.('[data-dnd-item]');
 if(!kbd){
  if(!item||e.key!==' '||(e.target!==item&&!e.target.closest('[data-dnd-grip]')))return;
  e.preventDefault();e.stopPropagation();
  kbd={item,from:zoneOf(item),fromNext:item.nextElementSibling};item.classList.add('dnd-kbd');
  say('Picked up. Arrow keys move, Space drops, Escape cancels.');return;
 }
 e.stopPropagation();
 const zones=[...doc.querySelectorAll('[data-dnd-zone^="'+parse(kbd.from).type+':"]')];
 const cur=zoneOf(kbd.item);let i=zones.indexOf(cur);
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
  e.preventDefault();i=Math.max(0,Math.min(zones.length-1,i+(e.key==='ArrowRight'?1:-1)));
  placeIn(zones[i],kbd.item,Infinity);kbd.item.focus();
  say(nameOf(zones[i])+', position '+(items(zones[i]).indexOf(kbd.item)+1)+' of '+items(zones[i]).length);
 }else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&adapterFor(cur)&&!adapterFor(cur).landingIndex){
  e.preventDefault();
  const sib=e.key==='ArrowUp'?kbd.item.previousElementSibling:kbd.item.nextElementSibling?.nextElementSibling;
  flipMove(items(cur),()=>listOf(cur).insertBefore(kbd.item,sib||null));kbd.item.focus();
 }else if(e.key===' '||e.key==='Enter'){
  e.preventDefault();const {item:it,from,fromNext}=kbd;it.classList.remove('dnd-kbd');
  d={item:it,id:it.dataset.dndItem,from,fromNext};kbd=null;finish(zoneOf(it));
 }else if(e.key==='Escape'||e.key==='Tab'){
  if(e.key==='Escape')e.preventDefault();
  listOf(kbd.from).insertBefore(kbd.item,kbd.fromNext?.isConnected?kbd.fromNext:null);
  kbd.item.classList.remove('dnd-kbd');kbd.item.focus();kbd=null;say('Cancelled');
 }
}
/* Called after every app render: pulse the card that just landed and bump the column counts. */
function afterRender(){
 if(!pending)return;
 const p=pending;pending=null;
 const card=doc.querySelector('[data-dnd-item="'+CSS.escape(p.id)+'"]');
 if(!card||zoneOf(card)?.dataset.dndZone!==p.zone||reduced())return; // a failed save re-renders the card back in its old zone: no celebration
 const badges=[p.zone,p.from].map(z=>doc.querySelector('[data-count-for="'+CSS.escape(z)+'"]'));
 card.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:420,easing:SPRING});
 badges.forEach(b=>b?.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:260,easing:SPRING}));
}
/* Native drag would fight the pointer engine. The cards keep draggable="true" so the old handlers still work if this script is absent. */
function noNative(e){if(e.target.closest?.('[data-dnd-item]')){e.preventDefault();e.stopPropagation()}}

if(doc){
 doc.addEventListener('pointerdown',down);
 doc.addEventListener('keydown',key,true);
 doc.addEventListener('dragstart',noNative,true);
 doc.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.stopPropagation();e.preventDefault()}},true);
}
root.SELFDnd={register,afterRender,sortedSlot,adapter:type=>adapters.get(type),_state:()=>({dragging:!!d,carrying:!!kbd})};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SELFDnd;
})(typeof window!=='undefined'?window:globalThis);
