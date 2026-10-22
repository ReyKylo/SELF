/* SELF Phase 5 Director Review — local session only; no persisted answer key. */
(function(){
'use strict';
const URL='./content/career-director-review/review-panels.json';
const state={owner:null,data:null,error:'',loading:false,track:'PE',initial:'',reference:'',answers:{},twist:'',opposite:'',final:'',step:0,submitted:false};
let host=null,sequence=0;
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=()=>state.data?.tracks.find(t=>t.id===state.track);
const field=(id,label,value,placeholder='')=>'<label class="career-form-label" for="director-'+id+'"><strong>'+h(label)+'</strong><textarea class="career-field career-notes" id="director-'+id+'" data-director-field="'+id+'" rows="5" placeholder="'+h(placeholder)+'">'+h(value)+'</textarea></label>';
function reset(owner){sequence++;Object.assign(state,{owner,data:null,error:'',loading:false,track:'PE',initial:'',reference:'',answers:{},twist:'',opposite:'',final:'',step:0,submitted:false})}
async function load(){
 if(state.loading||state.data)return;
 const seq=++sequence;state.loading=true;state.error='';
 try{
  const res=await fetch(URL,{cache:'no-cache'});if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();
  if(data.phase!==5||data.tracks?.length!==3||data.tracks.some(t=>t.challenges?.length!==5))throw Error('Case format invalid');
  if(seq===sequence)state.data=data;
 }catch(e){if(seq===sequence)state.error=String(e.message||e)}
 finally{if(seq===sequence){state.loading=false;host?.render?.()}}
}
function render(){
 if(!state.data&&!state.loading&&!state.error)Promise.resolve().then(load);
 if(state.error)return '<section class="career-card"><h2>Director Review belum tersedia</h2><p role="alert">'+h(state.error)+'</p><button class="career-btn" data-director-action="retry">Coba lagi</button></section>';
 if(!state.data)return '<section class="career-card" role="status"><h2>Membuka Director Review…</h2></section>';
 const t=pick();if(!t)return '';
 const total=t.challenges.length,challenge=t.challenges[Math.min(state.step,total-1)];
 const header='<div class="lab-intro"><span class="learning-label">PHASE 5 · DIRECTOR REVIEW · SIMULATED</span><h2>Defend your decision.</h2><p>Latihan mengambil keputusan di bawah tekanan. Ini bukan penilaian otomatis atau sertifikasi profesional. Jawaban tersimpan hanya selama sesi halaman ini.</p></div>';
 const selector='<div class="lab-facts">'+state.data.tracks.map(x=>'<button class="career-btn" data-director-action="track" data-track="'+h(x.id)+'" aria-pressed="'+(t.id===x.id)+'" '+(state.submitted?'disabled title="Reset untuk mengganti kasus"':'')+'>'+h(x.id)+' · '+h(x.case)+'</button>').join('')+'</div>';
 const exportReady=state.submitted&&state.step===5&&state.twist.trim()&&state.opposite.trim()&&state.final.trim();
 const controls='<div class="lab-controls"><button class="career-btn" data-director-action="export" '+(exportReady?'':'disabled title="Complete all five defenses and final reflections first"')+'>Export dossier (.txt)</button><button class="career-btn" data-director-action="reset">Reset review</button></div>';
 if(!state.submitted)return header+'<article class="career-card"><h3>Pilih investment / strategy case</h3>'+selector+'<p><strong>'+h(t.reviewer_role)+'</strong>: '+h(t.opening)+'</p>'+field('initial','Initial recommendation (wajib)',state.initial,'Decision, approval terms and main risks…')+field('reference','Exhibit / model references (wajib)',state.reference,'Quote the figures, units and evidence files you actually used.')+'<button class="career-btn career-primary" data-director-action="submit" '+(!state.initial.trim()||!state.reference.trim()?'disabled':'')+'>Lock initial recommendation →</button><p>Keputusan awal dikunci agar perubahan setelah tantangan bisa dilihat. Jangan masukkan data pribadi.</p></article>';
 const lock='<section class="career-card"><span class="learning-label">LOCKED ORIGINAL DECISION</span><p>'+h(state.initial)+'</p><small>Evidence: '+h(state.reference)+'</small></section>';
 let main='';
 if(state.step<total){
  main='<article class="career-card"><span class="learning-label">CHALLENGE '+(state.step+1)+' / '+total+'</span><h3>'+h(challenge.prompt)+'</h3><p>Director akan meminta bukti: '+challenge.evidence.map(h).join(' · ')+'</p>'+field('answer-'+challenge.id,'Your defense',state.answers[challenge.id]||'','Use the relevant exhibit, units and decision logic.')+'<div class="lab-controls"><button class="career-btn" data-director-action="back" '+(state.step===0?'disabled':'')+'>← Previous</button><button class="career-btn career-primary" data-director-action="next" '+(!(state.answers[challenge.id]||'').trim()?'disabled':'')+'>'+(state.step===total-1?'Read new information →':'Next challenge →')+'</button></div></article>';
 }else{
 main='<article class="career-card"><span class="learning-label">NEW INFORMATION · SIMULATED</span><h3>'+h(t.twist.announcement)+'</h3><p>'+h(t.twist.task)+'</p>'+field('twist','What changes in your conclusion?',state.twist)+field('opposite','Strongest opposing argument',state.opposite)+field('final','Final recommendation & approval conditions',state.final)+'<p class="career-form-hint">SELF tidak otomatis menilai free-text sebagai benar. Gunakan rubrik bersama reviewer manusia.</p>'+controls+'</article>';
 }
 const progress='<p role="status">Progress: '+Math.min(state.step,total)+' / '+total+' challenges; '+Object.values(state.answers).filter(x=>x.trim()).length+' defenses written.</p>';
 return header+selector+lock+progress+main+(state.step<total?controls:'')+'<p class="lab-disclaimer">Kriteria reviewer: technical 30, judgment 25, evidence 20, risk 15, communication 10. Setiap klaim harus dicocokkan dengan model yang benar.</p>';
}
function action(event){
 const b=event.target?.closest?.('[data-director-action]');if(!b)return false;
 event.preventDefault();event.stopPropagation();
 const a=b.dataset.directorAction,t=pick();
 if(a==='retry'){state.error='';void load()}
 if(a==='track'&&!state.submitted&&state.data?.tracks.some(x=>x.id===b.dataset.track)){state.track=b.dataset.track;state.initial='';state.reference='';state.answers={};state.step=0}
 if(a==='submit'&&state.initial.trim()&&state.reference.trim()){state.submitted=true;state.step=0}
 if(a==='next'&&state.step<5&&(state.answers[t.challenges[state.step].id]||'').trim())state.step++;
 if(a==='back')state.step=Math.max(0,state.step-1);
 if(a==='reset'){const owner=state.owner;reset(owner);void load()}
 if(a==='export'&&state.step===5&&state.twist.trim()&&state.opposite.trim()&&state.final.trim())exportFile();
 host?.render?.();return true;
}
function input(event){
 const key=event.target?.dataset?.directorField;if(!key)return false;
 if(key.startsWith('answer-'))state.answers[key.slice(7)]=event.target.value;
 else if(['initial','reference','twist','opposite','final'].includes(key)&&!(state.submitted&&['initial','reference'].includes(key)))state[key]=event.target.value;
 // Do not rerender on each keystroke: preserve focus and cursor. Buttons are updated via change.
 return true;
}
function change(event){const key=event.target?.dataset?.directorField;if(!key)return false;host?.render?.();return true}
function exportFile(){
 const t=pick();if(!t||!state.submitted||state.step!==5||!state.twist.trim()||!state.opposite.trim()||!state.final.trim())return;
 const blocks=['SELF DIRECTOR REVIEW | SIMULATED',t.case,'Track: '+t.id,'ORIGINAL DECISION\n'+state.initial,'MODEL EVIDENCE\n'+state.reference,...t.challenges.map(c=>c.id+' '+c.prompt+'\n'+(state.answers[c.id]||'[unanswered]')),'NEW INFO\n'+t.twist.announcement,'REASSESSMENT\n'+state.twist,'RED TEAM\n'+state.opposite,'FINAL DECISION\n'+state.final,'Reviewer rubric: technical 30 | judgment 25 | evidence 20 | risk 15 | communication 10','Not auto-graded; confirm source evidence independently.'];
 const blob=new Blob([blocks.join('\n\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='SELF_Director_Review_'+t.id+'.txt';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
window.SELFDirectorReview={init(api){host=api},render,action,input,change,reset,state,load};
})();
