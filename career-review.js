/* SELF review queue (spaced recall) and the Daily Drill card shown in Today.
   SM-2-lite: a card moves through 1, 3, 7, 16 and 35 day gaps; "again" resets it, "hard" repeats the gap shortened, "easy" skips ahead.
   Device-local (localStorage, always in try/catch). Nothing is uploaded and no scores are invented. */
(function(root){
'use strict';
const INTERVALS=[1,3,7,16,35],MAX_CARDS=500,SESSION=5;
const addDays=(iso,n)=>{const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const valid=c=>c&&typeof c.id==='string'&&typeof c.front==='string'&&typeof c.back==='string'&&Number.isInteger(c.stage)&&c.stage>=0&&c.stage<INTERVALS.length&&/^\d{4}-\d{2}-\d{2}$/.test(c.due||'');

/* New cards come back tomorrow. Adding an id that already exists changes nothing, so finishing a lesson twice never resets a card. */
function addCards(deck,cards,today){
 const out=deck.slice(),have=new Set(deck.map(c=>c.id));
 for(const c of cards||[]){
  if(!c||typeof c.id!=='string'||!c.id||!c.front||!c.back||have.has(c.id)||out.length>=MAX_CARDS)continue;
  have.add(c.id);
  out.push({id:c.id,front:String(c.front),back:String(c.back),source:String(c.source||''),stage:0,due:addDays(today,1),lapses:0,reviews:0,added:today,last:null});
 }
 return out;
}
function dueCards(deck,today,limit=SESSION){
 return deck.filter(c=>c.due<=today).sort((a,b)=>a.due.localeCompare(b.due)||a.id.localeCompare(b.id)).slice(0,limit);
}
function grade(deck,id,result,today){
 return deck.map(c=>{
  if(c.id!==id)return c;
  let stage=c.stage,gap,lapses=c.lapses;
  if(result==='again'){stage=0;gap=1;lapses++}
  else if(result==='hard'){gap=Math.max(1,Math.round(INTERVALS[stage]/2))}
  else if(result==='easy'){stage=Math.min(INTERVALS.length-1,stage+2);gap=INTERVALS[stage]}
  else{stage=Math.min(INTERVALS.length-1,stage+1);gap=INTERVALS[stage]}
  return {...c,stage,lapses,reviews:c.reviews+1,last:today,due:addDays(today,gap)};
 });
}
const stats=(deck,today)=>({total:deck.length,due:deck.filter(c=>c.due<=today).length,settled:deck.filter(c=>c.stage>=INTERVALS.length-1).length});

const api={INTERVALS,addDays,addCards,dueCards,grade,stats,valid,SESSION};
root.SELFReviewCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

/* ================= UI ================= */
let host=null;
const S={open:false,queue:[],idx:0,flipped:false,done:0,results:{again:0,hard:0,good:0,easy:0}};
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const owner=()=>host?.state?.()?.user?.id||'anon';
const key=()=>'self.review.v1.'+owner();
function load(){try{const raw=JSON.parse(root.localStorage?.getItem(key())||'[]');return Array.isArray(raw)?raw.filter(valid):[]}catch{return []}}
function save(deck){try{root.localStorage?.setItem(key(),JSON.stringify(deck))}catch{}}
const todayStr=()=>host?.today?host.today():new Date().toLocaleDateString('en-CA');
function init(args){host=args.host;root.document.addEventListener('keydown',keydown)}
/* Called by lessons. Safe to call repeatedly. */
function add(cards,source){const deck=load();const next=addCards(deck,(cards||[]).map(c=>({...c,source:source||c.source})),todayStr());if(next.length!==deck.length){save(next);if(host?.state?.()?.view==='home')host.render()}return next.length-deck.length}
function card(){
 const deck=load(),day=todayStr(),st=stats(deck,day);
 let body;
 if(!deck.length)body='<div class="empty-mini">Finish a Study lesson and its recall cards appear here tomorrow.</div>';
 else if(!st.due)body='<div class="empty-mini">Nothing due today. '+st.total+' card'+(st.total===1?'':'s')+' scheduled'+(st.settled?', '+st.settled+' settled':'')+'.</div>';
 else body='<p class="today-sub">'+st.due+' due. About '+Math.max(1,Math.min(st.due,SESSION))+' minute'+(Math.min(st.due,SESSION)>1?'s':'')+'.</p><button type="button" class="soft-btn" data-review="start">Start Daily Drill</button>';
 return '<section class="card card-pad today-drill" aria-labelledby="drill-h"><div class="section-head"><h2 id="drill-h">Daily Drill</h2><span class="small-sub">'+(deck.length?st.total+' cards':'Spaced recall')+'</span></div>'+body+(S.open?modal():'')+'</section>';
}
function modal(){
 const total=S.queue.length;
 if(S.idx>=total){
  const r=S.results;
  return '<div class="review-layer"><div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-h"><h3 id="review-h">Drill finished</h3><p class="review-count">'+S.done+' card'+(S.done===1?'':'s')+' reviewed: '+r.again+' again, '+r.hard+' hard, '+r.good+' good, '+r.easy+' easy.</p><p class="today-sub">They return on their schedule. Nothing here is a score.</p><div class="review-actions"><button type="button" class="primary-btn" data-review="close">Done</button></div></div></div>';
 }
 const c=S.queue[S.idx];
 return '<div class="review-layer"><div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-h"><div class="review-top"><span class="review-count" id="review-h">Card '+(S.idx+1)+' of '+total+(c.source?' · '+h(c.source):'')+'</span><button type="button" class="soft-btn" data-review="close" aria-label="Close">✕</button></div>'+
  '<p class="review-front">'+h(c.front)+'</p>'+
  (S.flipped?'<p class="review-back" role="status">'+h(c.back)+'</p><div class="review-actions" role="group" aria-label="How did it go?"><button type="button" class="soft-btn" data-review="again">Again <kbd>1</kbd></button><button type="button" class="soft-btn" data-review="hard">Hard <kbd>2</kbd></button><button type="button" class="soft-btn" data-review="good">Good <kbd>3</kbd></button><button type="button" class="soft-btn" data-review="easy">Easy <kbd>4</kbd></button></div>':
   '<p class="today-sub">Try to answer from memory first.</p><div class="review-actions"><button type="button" class="primary-btn" data-review="flip">Show answer <kbd>Space</kbd></button></div>')+'</div></div>';
}
function start(){const deck=load();S.queue=dueCards(deck,todayStr());S.idx=0;S.flipped=false;S.done=0;S.results={again:0,hard:0,good:0,easy:0};S.open=S.queue.length>0;host.render();Promise.resolve().then(()=>root.document.querySelector('.review-modal button.primary-btn')?.focus())}
function answer(result){
 if(!S.open||S.idx>=S.queue.length||!S.flipped)return;
 const c=S.queue[S.idx];save(grade(load(),c.id,result,todayStr()));
 S.results[result]++;S.done++;S.idx++;S.flipped=false;host.render();
 Promise.resolve().then(()=>root.document.querySelector('.review-modal button.primary-btn')?.focus());
}
async function action(e){
 const b=e.target.closest?.('[data-review]');if(!b)return false;
 e.preventDefault();e.stopPropagation();
 const a=b.dataset.review;
 if(a==='start')start();
 else if(a==='flip'){S.flipped=true;host.render();Promise.resolve().then(()=>root.document.querySelector('.review-actions button')?.focus())}
 else if(a==='close'){S.open=false;host.render()}
 else if(['again','hard','good','easy'].includes(a))answer(a);
 return true;
}
function keydown(e){
 if(!S.open||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){S.open=false;host.render();return}
 if(S.idx>=S.queue.length)return;
 if(!S.flipped&&(e.key===' '||e.key==='Enter')&&e.target?.tagName!=='BUTTON'){e.preventDefault();S.flipped=true;host.render();return}
 const map={1:'again',2:'hard',3:'good',4:'easy'};
 if(S.flipped&&map[e.key]){e.preventDefault();answer(map[e.key])}
}
root.SELFReview={init,add,card,action,load,state:S};
})(typeof window!=='undefined'?window:globalThis);
