/* SELF motion kit: tactile feedback and small celebrations. Every effect is skipped under prefers-reduced-motion. */
(function(root){
'use strict';
const doc=root.document;
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SPRING='cubic-bezier(.34,1.56,.64,1)',OUT='cubic-bezier(.2,.8,.2,1)';

function ripple(e){
 const host=e.target.closest?.('.primary-btn,.door');if(!host||reduced())return;
 const r=host.getBoundingClientRect(),d=Math.max(r.width,r.height)*2;
 const s=doc.createElement('span');s.className='ripple';s.setAttribute('aria-hidden','true');
 s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
 host.appendChild(s);
 s.animate([{transform:'scale(0)',opacity:.35},{transform:'scale(1)',opacity:0}],{duration:520,easing:OUT}).onfinish=()=>s.remove();
}
function burst(x,y,{count=14,color='var(--tint,#428cff)'}={}){
 if(reduced()||!doc)return;
 for(let i=0;i<count;i++){
  const p=doc.createElement('i');p.className='spark';p.setAttribute('aria-hidden','true');
  p.style.cssText='left:'+x+'px;top:'+y+'px;background:'+color;doc.body.appendChild(p);
  const a=Math.PI*2*i/count+Math.random()*.4,dist=36+Math.random()*34;
  p.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},
   {transform:'translate(calc(-50% + '+Math.cos(a)*dist+'px),calc(-50% + '+Math.sin(a)*dist+'px)) scale(.2)',opacity:0}],
   {duration:560+Math.random()*200,easing:OUT}).onfinish=()=>p.remove();
 }
}
/* Burst from the centre of an element; used after a re-render, so the lookup is by selector. */
function burstAt(selector,opts){
 const el=doc?.querySelector(selector);if(!el)return;
 const r=el.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,opts);
}
function bump(el){if(el&&!reduced())el.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:260,easing:SPRING})}

/* Theme change with a circular reveal from the click point. apply() must change the theme and re-render. */
function themeSwitch(apply,origin){
 if(!doc?.startViewTransition||reduced()){apply();return}
 const x=origin?.clientX??root.innerWidth-40,y=origin?.clientY??40;
 const r=Math.hypot(Math.max(x,root.innerWidth-x),Math.max(y,root.innerHeight-y));
 const vt=doc.startViewTransition(apply);
 vt.ready.then(()=>doc.documentElement.animate(
  {clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+r+'px at '+x+'px '+y+'px)']},
  {duration:520,easing:'cubic-bezier(.4,0,.2,1)',pseudoElement:'::view-transition-new(root)'})).catch(()=>{});
}
/* Numbers on Home count up once when a room is entered. */
function countUp(){
 if(reduced()||!doc)return;
 doc.querySelectorAll('[data-countup]').forEach(el=>{
  const to=Number(el.dataset.countup);if(!Number.isFinite(to)||to<=0)return;
  const t0=performance.now();
  (function step(t){const k=Math.min(1,(t-t0)/600),e=1-Math.pow(1-k,3);el.textContent=String(Math.round(to*e));if(k<1)root.requestAnimationFrame(step)})(t0);
 });
}
function afterRender(){
 const body=doc?.querySelector('.body[data-enter="1"]');
 if(body)countUp();
}
if(doc)doc.addEventListener('pointerdown',ripple,{passive:true});
root.SELFMotion={burst,burstAt,bump,themeSwitch,afterRender,reduced};
})(typeof window!=='undefined'?window:globalThis);
