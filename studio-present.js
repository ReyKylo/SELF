/* SELF Studio Walkthrough: present a board frame by frame, to rehearse a case out loud.
   The slide order is computed (never stored) and presenting never writes to the board: no inserts, patches, deletes or camera saves.
   The pure helpers (slideOrder, fitRect, ease, pace) are exported for tests. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const num=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;

/* Frames chained by edges are presented in chain order; otherwise (and for any frame left over) in reading order: rows top to bottom, then left to right. */
function readingOrder(frames){
 const sorted=[...frames].sort((a,b)=>num(a.y)-num(b.y)||num(a.x)-num(b.x)||String(a.id).localeCompare(String(b.id)));
 const rows=[];
 for(const f of sorted){
  const row=rows.find(r=>Math.abs(num(f.y)-r.y)<Math.min(num(f.h,200),r.h)*0.6);
  if(row)row.items.push(f);else rows.push({y:num(f.y),h:num(f.h,200),items:[f]});
 }
 return rows.flatMap(r=>r.items.sort((a,b)=>num(a.x)-num(b.x)||String(a.id).localeCompare(String(b.id))));
}
function slideOrder(items,edges){
 const frames=(items||[]).filter(i=>i&&i.visual_kind==='frame');
 if(!frames.length)return [];
 const reading=readingOrder(frames),pos=new Map(reading.map((f,i)=>[f.id,i])),byId=new Map(frames.map(f=>[f.id,f]));
 const out=new Map(frames.map(f=>[f.id,[]])),indeg=new Map(frames.map(f=>[f.id,0]));
 let chained=false;
 for(const e of edges||[]){
  const a=e.source_item_id,b=e.target_item_id;
  if(a!==b&&byId.has(a)&&byId.has(b)&&!out.get(a).includes(b)){out.get(a).push(b);indeg.set(b,indeg.get(b)+1);chained=true}
 }
 if(!chained)return reading;
 for(const list of out.values())list.sort((a,b)=>pos.get(a)-pos.get(b));
 const seen=new Set(),order=[];
 const walk=id=>{if(seen.has(id))return;seen.add(id);order.push(byId.get(id));for(const n of out.get(id))walk(n)};
 for(const f of reading)if(indeg.get(f.id)===0)walk(f.id);
 for(const f of reading)walk(f.id);
 return order;
}
/* Camera that centres a rectangle in a viewport, leaving `reserveBottom` free for the progress strip. */
function fitRect(rect,vp,{reserveBottom=84,min=0.1,max=2.5}={}){
 const w=Math.max(1,vp.w),h=Math.max(1,vp.h-reserveBottom);
 const pad=clamp(Math.min(w,h)*0.08,24,90);
 const zoom=clamp(Math.min((w-pad*2)/Math.max(1,rect.w),(h-pad*2)/Math.max(1,rect.h)),min,max);
 return {zoom,pan:{x:Math.round((w-rect.w*zoom)/2-rect.x*zoom),y:Math.round((h-rect.h*zoom)/2-rect.y*zoom)}};
}
const ease=t=>t<=0?0:t>=1?1:t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const lerp=(a,b,t)=>a+(b-a)*t;
/* Zoom is interpolated in log space so a big zoom change feels even. */
const camAt=(from,to,t)=>{const e=ease(t);return {zoom:Math.exp(lerp(Math.log(from.zoom),Math.log(to.zoom),e)),pan:{x:lerp(from.pan.x,to.pan.x,e),y:lerp(from.pan.y,to.pan.y,e)}}};
/* Compare time used with the share of the walkthrough completed. At the start of slide i (0-based), i slides are done. */
function pace(i,total,elapsedMs,targetMs){
 if(!(targetMs>0)||total<1)return null;
 const expected=targetMs*(i/total),diff=elapsedMs-expected;
 if(Math.abs(diff)<5000)return {state:'on',diffMs:diff};
 return {state:diff>0?'behind':'ahead',diffMs:Math.abs(diff)};
}
const clock=ms=>{const s=Math.max(0,Math.floor(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

const noteKey=(boardId,frameId)=>'self.studio.notes.'+boardId+'.'+frameId;
const api={slideOrder,readingOrder,fitRect,ease,camAt,pace,clock,noteKey};
root.SELFPresentCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI ================= */
const P={active:false,order:[],i:0,prev:null,raf:0,started:0,target:0,timer:0};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const B=()=>root.SELFBoards,I=()=>B()?.internals;
const vp=()=>{const el=root.document.querySelector('#c3-canvas');return el?{w:el.clientWidth||el.getBoundingClientRect().width,h:el.clientHeight||el.getBoundingClientRect().height}:null};
function go(to,{instant=false}={}){
 const ui=B().ui,cam={zoom:ui.zoom,pan:{...ui.pan}};
 cancelAnimationFrame(P.raf);
 if(instant||reduced()){ui.zoom=to.zoom;ui.pan={...to.pan};I().updateCam();return}
 const t0=performance.now(),dur=450;
 const step=now=>{const t=Math.min(1,(now-t0)/dur),c=camAt(cam,to,t);ui.zoom=c.zoom;ui.pan={...c.pan};I().updateCam();if(t<1)P.raf=requestAnimationFrame(step)};
 P.raf=requestAnimationFrame(step);
}
function target(i){
 const f=P.order[i],v=vp();if(!f||!v)return null;
 return fitRect({x:num(f.x),y:num(f.y),w:num(f.w,300),h:num(f.h,200)},v);
}
/* Speaker notes: one text per frame, kept on this account through the existing localStorage mirror (self.studio.notes.<board>.<frame>); no schema change */
const readNote=(boardId,frameId)=>{try{return root.localStorage.getItem(noteKey(boardId,frameId))||''}catch{return ''}};
const writeNote=(boardId,frameId,text)=>{try{const k=noteKey(boardId,frameId);String(text).trim()?root.localStorage.setItem(k,String(text).slice(0,2000)):root.localStorage.removeItem(k)}catch{}};
function title(f){const c=B().internals.cardOf?.(f);return String(c?.title||'').trim()||'Frame'}
function bar(){
 let el=root.document.getElementById('present-bar');
 if(!P.active){el?.remove();return}
 if(!el){el=root.document.createElement('div');el.id='present-bar';el.setAttribute('role','region');el.setAttribute('aria-label','Walkthrough');root.document.body.appendChild(el)}
 const f=P.order[P.i],total=P.order.length;
 const elapsed=Date.now()-P.started,pc=pace(P.i,total,elapsed,P.target*60000);
 el.innerHTML='<button type="button" class="pr-btn" data-present="prev" aria-label="Previous frame"'+(P.i===0?' disabled':'')+'>←</button>'+
  '<div class="pr-info" aria-live="polite"><strong>'+h(title(f))+'</strong><span class="pr-count">'+(P.i+1)+' / '+total+'</span><i class="pr-track" aria-hidden="true"><b style="width:'+((P.i+1)/total*100)+'%"></b></i></div>'+
  '<button type="button" class="pr-btn pr-next" data-present="next" aria-label="Next frame"'+(P.i===total-1?' disabled':'')+'>→</button>'+
  '<label class="pr-target">Target <input type="number" min="0" max="120" step="1" value="'+(P.target||'')+'" placeholder="min" data-present-target aria-label="Target minutes"></label>'+
  '<span class="pr-clock" id="pr-clock">'+clock(elapsed)+(pc?' · '+(pc.state==='on'?'on pace':clock(pc.diffMs)+' '+pc.state):'')+'</span>'+
  '<button type="button" class="pr-btn pr-exit" data-present="exit">Exit</button>'+
  '<textarea class="pr-notes" data-present-notes rows="2" maxlength="2000" placeholder="Speaker notes for this frame (only you see them)" aria-label="Speaker notes for this frame">'+h(readNote(B().ui.boardId,f.id))+'</textarea>';
}
function tick(){const c=root.document.getElementById('pr-clock');if(!c)return;const total=P.order.length,elapsed=Date.now()-P.started,pc=pace(P.i,total,elapsed,P.target*60000);c.textContent=clock(elapsed)+(pc?' · '+(pc.state==='on'?'on pace':clock(pc.diffMs)+' '+pc.state):'')}
function start(){
 const b=B(),int=I();if(!b||!int||P.active)return false;
 const order=slideOrder(int.items(),int.edges());
 if(!order.length){int.say('Add frames to present: each frame becomes a step.',true);return false}
 const v=vp();if(!v)return false;
 const ui=b.ui;
 Object.assign(P,{active:true,order,i:0,prev:{zoom:ui.zoom,pan:{...ui.pan}},started:Date.now()});
 root.document.documentElement.classList.add('is-presenting');
 ui.selected=new Set();
 bar();go(target(0));
 P.timer=setInterval(tick,1000);
 return true;
}
function show(i){if(!P.active)return;P.i=clamp(i,0,P.order.length-1);bar();const t=target(P.i);if(t)go(t)}
function exit(){
 if(!P.active)return;
 clearInterval(P.timer);P.active=false;
 root.document.documentElement.classList.remove('is-presenting');
 root.document.getElementById('present-bar')?.remove();
 if(P.prev)go(P.prev,{instant:false});
 P.order=[];
}
function onKey(e){
 if(!P.active)return;
 if(e.target?.matches?.('[data-present-target],[data-present-notes]')&&e.key!=='Escape')return;
 const k=e.key;
 if(k==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit()}
 else if(k==='ArrowRight'||k==='ArrowDown'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();e.stopImmediatePropagation();show(P.i+1)}
 else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||k==='Backspace'){e.preventDefault();e.stopImmediatePropagation();show(P.i-1)}
 else if(k==='Home'){e.preventDefault();e.stopImmediatePropagation();show(0)}
 else if(k==='End'){e.preventDefault();e.stopImmediatePropagation();show(P.order.length-1)}
 else{e.preventDefault();e.stopImmediatePropagation()}
}
function onClick(e){
 const b=e.target.closest?.('[data-present]');if(!b)return;
 e.preventDefault();e.stopPropagation();
 const a=b.dataset.present;
 if(a==='next')show(P.i+1);else if(a==='prev')show(P.i-1);else if(a==='exit')exit();
}
function onInput(e){if(e.target?.matches?.('[data-present-notes]')){const f=P.order[P.i];if(f)writeNote(B().ui.boardId,f.id,e.target.value);return}
 if(e.target?.matches?.('[data-present-target]')){P.target=clamp(Math.round(Number(e.target.value)||0),0,120);tick()}}
root.document.addEventListener('keydown',onKey,true);
root.document.addEventListener('click',onClick,true);
root.document.addEventListener('input',onInput,true);
root.addEventListener('resize',()=>{if(P.active){const t=target(P.i);if(t)go(t,{instant:true})}});
/* leaving the board by any route ends the walkthrough */
root.addEventListener('hashchange',exit);
root.SELFPresent={start,exit,active:()=>P.active,state:P};
})(typeof window!=='undefined'?window:globalThis);
