/* SELF Study › Next up: one card that says which lesson to do next, and why. It reads lesson progress that already lives on this device;
   it never invents a score and never marks anything done for you. pickNext() is pure and exported for tests. */
(function(root){
'use strict';
const TRACK_ORDER=['PE','VC','Consulting'];
const BEAT_NAMES=['Tebak','Tonton','Lihat','Format pro','Contoh','Giliran lu','Defend','Kunci'];
/* lessons: [{id,track,title,minutes}] in curriculum order. progress: {id: {completed,beat,rungs:[{ok}],predicted}}. */
function started(p){return !!p&&!p.completed&&((p.beat||0)>0||(p.rungs||[]).some(r=>r.ok)||p.predicted)}
function pickNext(lessons,progress,preferred){
 const order=[preferred,...TRACK_ORDER].filter((t,i,a)=>t&&a.indexOf(t)===i);
 for(const t of order){
  const mine=lessons.filter(l=>l.track===t);
  const cont=mine.find(l=>started(progress[l.id]));
  if(cont){const p=progress[cont.id];return {lesson:cont,status:'continue',reason:'Kamu berhenti di langkah '+((p.beat||0)+1)+' ('+BEAT_NAMES[p.beat||0]+').',position:mine.indexOf(cont)+1,of:mine.length}}
 }
 for(const t of order){
  const mine=lessons.filter(l=>l.track===t);
  const next=mine.find(l=>!(progress[l.id]?.completed));
  if(next){const i=mine.indexOf(next);return {lesson:next,status:'start',reason:i===0?'Mulai dari sini di jalur '+t+'.':'Berikutnya di jalur '+t+' setelah '+mine[i-1].title+'.',position:i+1,of:mine.length}}
 }
 return {lesson:null,status:'done',reason:'Semua lesson di format baru sudah ditandai selesai di perangkat ini. Lanjut ke Director Review atau Work Sample.',position:0,of:0};
}
const api={pickNext,started,BEAT_NAMES,TRACK_ORDER};
root.SELFNextUpCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root.document)return;

let host=null;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const owner=()=>host?.state?.()?.user?.id||null;
function init(args){host=args.host}
function dueCards(){
 try{const day=new Date().toLocaleDateString('en-CA');return (root.SELFReview?.load?.()||[]).filter(c=>c.due<=day).length}catch{return 0}
}
function card(){
 const L=root.SELFLessonLoop;if(!L||!host)return '';
 if(L.status()==='idle')L.load();
 if(L.status()!=='ready')return '';
 const o=owner();if(!o)return '';
 const lessons=L.state.data.lessons.map(l=>({id:l.id,track:l.track,title:l.title,minutes:l.minutes}));
 const progress={};for(const l of lessons)progress[l.id]=L.progress(o,l.id)||{};
 let preferred=null;try{preferred=root.localStorage?.getItem('self.study.track.'+o)}catch{}
 const n=pickNext(lessons,progress,preferred),due=dueCards();
 const doneCount=lessons.filter(l=>progress[l.id]?.completed).length;
 if(!n.lesson)return '<section class="nextup" aria-labelledby="nextup-h"><span class="learning-label">NEXT UP</span><h3 id="nextup-h">Semua lesson baru selesai</h3><p>'+h(n.reason)+'</p>'+(due?'<p class="nextup-due">'+due+' kartu Daily Drill menunggu di Today.</p>':'')+'</section>';
 const p=progress[n.lesson.id]||{},beat=p.beat||0;
 return '<section class="nextup" aria-labelledby="nextup-h"><div class="nextup-main"><span class="learning-label">NEXT UP · '+h(n.lesson.track)+' · '+n.position+' dari '+n.of+'</span><h3 id="nextup-h">'+h(n.lesson.title)+'</h3><p>'+h(n.reason)+' ±'+h(n.lesson.minutes)+' menit.</p>'+
  (n.status==='continue'?'<div class="nextup-dots" role="img" aria-label="Langkah '+(beat+1)+' dari 8">'+BEAT_NAMES.map((b,i)=>'<i class="'+(i<beat?'is-done':i===beat?'is-now':'')+'"></i>').join('')+'</div>':'')+
  '<p class="nextup-meta">'+doneCount+' dari '+lessons.length+' lesson ditandai selesai di perangkat ini.'+(due?' '+due+' kartu Daily Drill menunggu di Today.':'')+'</p></div>'+
  '<button type="button" class="career-btn is-current" data-nextup="go" data-id="'+h(n.lesson.id)+'">'+(n.status==='continue'?'Lanjutkan':'Mulai')+' →</button></section>';
}
function action(e){
 const b=e.target.closest?.('[data-nextup]');if(!b)return false;
 e.preventDefault();e.stopPropagation();
 if(b.dataset.nextup==='go')root.SELFCareerLearning?.openLesson?.(b.dataset.id);
 return true;
}
root.SELFNextUp={init,card,action};
})(typeof window!=='undefined'?window:globalThis);
