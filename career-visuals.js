/* SELF Career Prep native visuals: pure geometry and SVG/HTML markup built from the case's own numbers. No external images, no network.
   Waterfall: a bridge that must tie out. Every visual has a text description and a data table. */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const round=(v,d=2)=>{const f=Math.pow(10,d);return Math.round((v+Number.EPSILON)*f)/f};
const fmt=(v,d=2)=>{const r=round(v,d);return (r<0?'−':'')+String(Math.abs(r))};
const fmtSigned=(v,d=2)=>{const r=round(v,d);return r<0?'−'+Math.abs(r):'+'+r};
const TOL=1e-9;

/* steps: [{id,label,value,kind:'total'|'delta',term?,caption?}]. The first step must be a total. A later total is a checkpoint: it has to equal the running sum. */
function waterfallModel(steps,{width=640,height=330,left=40,right=12,top=26,bottom=48}={}){
 if(!Array.isArray(steps)||!steps.length||steps[0].kind!=='total')throw new Error('Waterfall needs a first total step');
 let run=0;const raw=[],ties=[];
 steps.forEach((s,i)=>{
  if(!Number.isFinite(s.value))throw new Error('Step '+s.id+' has no value');
  let from,to;
  if(s.kind==='total'){
   if(i>0){const ok=Math.abs(run-s.value)<=TOL;ties.push({id:s.id,expected:round(run,6),actual:s.value,ok})}
   from=0;to=s.value;run=s.value;
  }else{from=run;to=run+s.value;run=to}
  raw.push({...s,from,to});
 });
 const lo0=Math.min(0,...raw.flatMap(b=>[b.from,b.to])),hi0=Math.max(0,...raw.flatMap(b=>[b.from,b.to])),pad=((hi0-lo0)||1)*0.09;
 /* headroom so value labels above and below the bars never touch the axis or the category labels */
 const lo=lo0<0?lo0-pad:lo0,hi=hi0>0?hi0+pad:hi0;
 const span=(hi-lo)||1,plotH=height-top-bottom,plotW=width-left-right;
 const y=v=>top+(hi-v)/span*plotH;
 const slot=plotW/raw.length,bw=Math.min(58,slot*.72);
 const bars=raw.map((b,i)=>{
  const yTop=y(Math.max(b.from,b.to)),yBot=y(Math.min(b.from,b.to));
  return {...b,i,x:round(left+slot*i+(slot-bw)/2,2),w:round(bw,2),y:round(yTop,2),h:round(Math.max(2,yBot-yTop),2),
   cls:b.kind==='total'?'wf-total':b.value<0?'wf-down':'wf-up',valueText:b.kind==='total'?fmt(b.value):fmtSigned(b.value)};
 });
 const step=niceStep(span);const ticks=[];
 for(let t=Math.ceil(lo/step)*step;t<=hi+TOL;t+=step)ticks.push({v:round(t,6),y:round(y(t),2)});
 return {bars,ticks,zeroY:round(y(0),2),width,height,left,right,top,bottom,ties,allTie:ties.every(t=>t.ok),end:run};
}
function niceStep(span){const raw=span/5,mag=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/mag;return (n<1.5?1:n<3.5?2:n<7.5?5:10)*mag}

/* Plain-language description for screen readers. */
function describeWaterfall(model,unit=''){
 return model.bars.map(b=>b.kind==='total'?b.label+' '+fmt(b.value)+unit:b.label+' '+(b.value<0?'mengurangi ':'menambah ')+fmt(Math.abs(b.value))+unit+', menjadi '+fmt(b.to)+unit).join('; ')+'.';
}
/* visible: how many bars are drawn so far (reveal step by step). active: index highlighted. */
function renderWaterfall(model,{visible=model.bars.length,active=-1,unit='',title='Jembatan'}={}){
 const {width,height}=model;
 let out='<svg class="wf" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><desc>'+esc(describeWaterfall(model,unit))+'</desc>';
 for(const t of model.ticks)out+='<line class="wf-grid'+(t.v===0?' wf-zero':'')+'" x1="'+model.left+'" x2="'+(width-model.right)+'" y1="'+t.y+'" y2="'+t.y+'"/><text class="wf-tick" x="'+(model.left-6)+'" y="'+(t.y+4)+'" text-anchor="end">'+fmt(t.v)+'</text>';
 model.bars.forEach((b,i)=>{
  if(i>=visible)return;
  const cx=b.x+b.w/2,above=b.value>=0||b.kind==='total'&&b.value>=0;
  out+='<g class="wf-bar '+b.cls+(i===visible-1?' is-new':'')+(i===active?' is-active':'')+'" data-bar="'+i+'"><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="4"/>'+
   '<text class="wf-val" x="'+cx+'" y="'+(above?b.y-6:b.y+b.h+14)+'" text-anchor="middle">'+esc(b.valueText)+'</text>'+
   '<text class="wf-lab" x="'+cx+'" y="'+(height-model.bottom+18)+'" text-anchor="middle">'+esc(b.label)+'</text></g>';
 });
 return out+'</svg>';
}
function waterfallTable(model,unit=''){
 let run=0;
 return '<table class="wf-table"><thead><tr><th scope="col">Langkah</th><th scope="col">Nilai'+(unit?' ('+esc(unit)+')':'')+'</th><th scope="col">Saldo</th></tr></thead><tbody>'+
  model.bars.map(b=>{run=b.to;return '<tr class="'+(b.kind==='total'?'is-total':'')+'"><th scope="row">'+esc(b.label)+'</th><td>'+esc(b.valueText)+'</td><td>'+fmt(b.to)+'</td></tr>'}).join('')+'</tbody></table>';
}
const bracket=v=>v<0?'('+Math.abs(v).toFixed(1)+')':v.toFixed(1);
/* Model-format bridge: rows are {id,label,value|null,input?,total?} . Convention: blue = typed input, black = formula, a check row at the bottom. */
function bridgeTable(rows,{highlight=[],check=null}={}){
 return '<table class="bridge-table"><tbody>'+rows.map(r=>'<tr data-row="'+esc(r.id)+'" class="'+[r.total?'is-total':'',highlight.includes(r.id)?'is-hl':''].join(' ').trim()+'"><th scope="row">'+esc(r.label)+(r.badge?' <span class="bridge-badge" aria-label="Catatan '+esc(r.badge)+'">'+esc(r.badge)+'</span>':'')+'</th><td class="'+(r.input?'is-input':'')+'">'+
  (r.value==null?'':bracket(r.value))+'</td></tr>').join('')+
  (check?'<tr class="is-check"><th scope="row">'+esc(check.label)+'</th><td>'+esc(check.value)+'</td></tr>':'')+'</tbody></table>';
}
const api={waterfallModel,describeWaterfall,renderWaterfall,waterfallTable,bridgeTable,fmt,fmtSigned,round,esc};
root.SELFVisuals=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
