/* SELF Studio recipes: data-driven board templates. A recipe is a chain of frames holding prompt cards, laid out by code so nothing overlaps.
   expandRecipe() is pure; canvas-v3.js inserts the result with the same card/item/edge calls as the existing starter.
   Templates only: no recipe is presented as expert-certified, and nothing here reads or fetches outside data. */
(function(root){
'use strict';
const URL_CONTENT='./content/studio-recipes.json';
const CARD={w:240,h:150,gap:24},FRAME={pad:28,head:58,cols:2},GAP={x:110,y:100},MAX_OBJECTS=48,MAX_TEXT=160;
const KINDS=['knowledge','task','sticky','reference','text'];
/* Plain-text substitution. Unknown placeholders are left visible so a missing value is noticed, and control characters are removed. */
const clean=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,MAX_TEXT);
const fillText=(text,fill)=>String(text??'').replace(/\{(\w+)\}/g,(m,k)=>fill&&typeof fill[k]==='string'&&clean(fill[k])?clean(fill[k]):m);

function validate(data){
 const errors=[];
 if(!data||data.version!==1||!Array.isArray(data.recipes)){return ['Recipe data is not version 1.']}
 const ids=new Set();
 for(const r of data.recipes){
  const at='recipe '+r?.id+': ';
  if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)){errors.push(at+'missing or duplicate id');continue}ids.add(r.id);
  if(!r.title||!r.summary||!r.guide)errors.push(at+'needs title, summary and guide');
  if(!Array.isArray(r.frames)||!r.frames.length)errors.push(at+'needs frames');
  const keys=new Set();let count=1;
  for(const f of r.frames||[]){
   if(!f.key||keys.has(f.key))errors.push(at+'duplicate or missing frame key '+f.key);keys.add(f.key);
   if(!f.title)errors.push(at+'frame '+f.key+' has no title');
   if(!Array.isArray(f.cards)||!f.cards.length)errors.push(at+'frame '+f.key+' has no cards');
   for(const c of f.cards||[]){count++;if(!KINDS.includes(c.kind))errors.push(at+'unknown card kind '+c.kind);if(!c.title)errors.push(at+'a card in '+f.key+' has no title')}
   count++;
  }
  if(count>MAX_OBJECTS)errors.push(at+'too many objects ('+count+')');
  for(const [a,b] of r.links||[]){for(const ref of [a,b]){const [k,i]=String(ref).split(':');const f=(r.frames||[]).find(x=>x.key===k);if(!f||!(Number(i)>=0)||Number(i)>=f.cards.length)errors.push(at+'bad link '+ref)}}
 }
 return errors;
}
/* fill: {company, people:[{name,role}]}. Returns objects with world coordinates, and edges by object key. */
function expandRecipe(recipe,fill={}){
 const missing=(recipe.needs||[]).filter(k=>!clean(fill[k]));
 if(missing.length)return {error:'Fill in: '+missing.join(', '),objects:[],edges:[]};
 const frames=[{key:'_guide',title:'How to use this',cards:[{kind:'knowledge',title:'Structure guide',summary:recipe.guide}]},...recipe.frames.map(f=>{
  if(f.each==='people'){
   const people=(fill.people||[]).slice(0,12).filter(p=>clean(p?.name));
   const proto=f.cards[0];
   return {...f,cards:people.length?people.map(p=>({...proto,title:clean(p.name),summary:clean([p.role,p.stage].filter(Boolean).join(' · '))||proto.summary})):f.cards.concat(f.cards.map((c,i)=>({...c,title:'Person '+(i+2)})),f.cards.map((c,i)=>({...c,title:'Person 3'})))};
  }
  return f;
 })];
 const cols=Math.max(1,recipe.columns||4);
 const sized=frames.map(f=>{
  const n=f.cards.length,rows=Math.ceil(n/FRAME.cols);
  return {f,w:FRAME.cols*CARD.w+(FRAME.cols-1)*CARD.gap+FRAME.pad*2,h:FRAME.head+rows*CARD.h+(rows-1)*CARD.gap+FRAME.pad};
 });
 const objects=[],edges=[],at={};
 let y=0;
 for(let r=0;r<sized.length;r+=cols){
  const row=sized.slice(r,r+cols),rowH=Math.max(...row.map(s=>s.h));let x=0;
  row.forEach(s=>{
   const fk='f:'+s.f.key;
   objects.push({key:fk,kind:'frame',x,y,w:s.w,h:s.h,title:fillText(s.f.title,fill),summary:''});
   s.f.cards.forEach((c,i)=>{
    const col=i%FRAME.cols,rw=Math.floor(i/FRAME.cols),ck='c:'+s.f.key+':'+i;
    objects.push({key:ck,kind:c.kind,x:x+FRAME.pad+col*(CARD.w+CARD.gap),y:y+FRAME.head+rw*(CARD.h+CARD.gap),w:CARD.w,h:CARD.h,title:fillText(c.title,fill),summary:fillText(c.summary,fill).slice(0,600),style:c.style||null});
    at[s.f.key+':'+i]=ck;
   });
   x+=s.w+GAP.x;
  });
  y+=rowH+GAP.y;
 }
 for(let i=1;i<sized.length;i++)edges.push({from:'f:'+sized[i-1].f.key,to:'f:'+sized[i].f.key,label:''});
 for(const [a,b] of recipe.links||[])if(at[a]&&at[b])edges.push({from:at[a],to:at[b],label:''});
 return {error:'',objects,edges,frames:sized.length};
}
/* Two objects overlap if their rectangles intersect (touching edges do not count). Used by tests. */
const overlaps=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;

let data=null,state='idle',error='',pending=null;
function load(){
 if(state==='ready')return Promise.resolve();
 if(pending)return pending;
 state='loading';
 pending=run().finally(()=>{pending=null});
 return pending;
}
async function run(){
 try{const res=await fetch(URL_CONTENT,{cache:'no-cache'});if(!res.ok)throw new Error('HTTP '+res.status);const d=await res.json();const errs=validate(d);if(errs.length)throw new Error(errs[0]);data=d;state='ready'}
 catch(e){state='error';error=e?.message||String(e)}
 root.SELFRecipesChanged?.();
}
const list=()=>data?.recipes||[];
const get=id=>list().find(r=>r.id===id)||null;
const api={validate,expandRecipe,fillText,clean,overlaps,CARD,FRAME,GAP,load,list,get,status:()=>state,error:()=>error};
root.SELFRecipes=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
