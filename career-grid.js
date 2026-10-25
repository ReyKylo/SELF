/* SELF Career Prep practice engine: a tiny, safe spreadsheet formula evaluator. No eval, no Function.
   Supports numbers (with %), cell references (B5), ranges inside functions (C5:C7), + - * / ^, parentheses and SUM, AVERAGE, MIN, MAX, ROUND, ABS.
   Decimal point is "."; "," or ";" separate function arguments. Unary minus binds tighter than ^, as in Excel (=-2^2 is 4). */
(function(root){
'use strict';
class FormulaError extends Error{constructor(code,message){super(message||code);this.code=code}}
const norm=s=>String(s??'').replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/ /g,' ').trim();
const colNum=c=>{let n=0;for(const ch of c)n=n*26+(ch.charCodeAt(0)-64);return n};
const colName=n=>{let s='';while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s};
const refRe=/^([A-Za-z]{1,2})(\d{1,3})$/;

function tokenize(src){
 const out=[];let i=0;
 while(i<src.length){
  const c=src[i];
  if(c===' '){i++;continue}
  let m;
  if((m=/^\d+(\.\d+)?|^\.\d+/.exec(src.slice(i)))){
   let v=parseFloat(m[0]);i+=m[0].length;
   if(src[i]==='%'){v/=100;i++}
   out.push({t:'num',v});continue;
  }
  if((m=/^[A-Za-z]{1,2}\d{1,3}(?![A-Za-z0-9])/.exec(src.slice(i)))){out.push({t:'ref',v:m[0].toUpperCase()});i+=m[0].length;continue}
  if((m=/^[A-Za-z]+(?=\()/.exec(src.slice(i)))){out.push({t:'fn',v:m[0].toUpperCase()});i+=m[0].length;continue}
  if(':(),;+-*/^'.includes(c)){out.push({t:c==='('||c===')'||c===':'?c:(c===','||c===';')?',':'op',v:c});i++;continue}
  throw new FormulaError('syntax','Karakter tidak dikenali: '+c);
 }
 return out;
}
/* sheet: {ref → raw}. raw is a number, a numeric string, or a string starting with "=". */
function createSheet(raw){
 const cells=new Map(Object.entries(raw||{}).map(([k,v])=>[k.toUpperCase(),v]));
 const cache=new Map();const stack=[];
 /* Each cached cell remembers every cell it depends on, so references stay reported when the value comes from the cache. */
 function valueOf(ref,refs){
  ref=ref.toUpperCase();
  const hit=cache.get(ref);
  if(hit){if(refs){refs.add(ref);for(const d of hit.deps)refs.add(d)}return hit.v}
  if(!cells.has(ref)){refs&&refs.add(ref);return 0}
  if(stack.includes(ref))throw new FormulaError('cycle','Referensi melingkar di '+ref);
  stack.push(ref);
  try{
   const r=cells.get(ref),deps=new Set();let v;
   if(typeof r==='number')v=r;
   else if(typeof r==='string'&&norm(r).startsWith('='))v=evaluate(norm(r).slice(1),sheet,deps).value;
   else if(r===''||r==null)v=0;
   else{const n=parseNumber(r);if(!Number.isFinite(n))throw new FormulaError('text','Sel '+ref+' bukan angka');v=n}
   cache.set(ref,{v,deps});
   if(refs){refs.add(ref);for(const d of deps)refs.add(d)}
   return v;
  }finally{stack.pop()}
 }
 const sheet={cells,valueOf,set(ref,r){cells.set(ref.toUpperCase(),r);cache.clear()},raw:ref=>cells.get(ref.toUpperCase())};
 return sheet;
}
/* "1.234,5" is not accepted on purpose: an ambiguous thousands separator is rejected rather than guessed. "0,5" is read as 0.5. */
function parseNumber(text){
 let s=norm(text);if(s==='')return NaN;
 if(/^[-+]?\d+(\.\d+)?%?$/.test(s)){const p=s.endsWith('%');const n=parseFloat(p?s.slice(0,-1):s);return p?n/100:n}
 if(/^[-+]?\d+,\d{1,}$/.test(s))return parseFloat(s.replace(',','.'));
 return NaN;
}
function evaluate(expr,sheet,refsOut){
 const tokens=tokenize(norm(expr));let p=0;const refs=refsOut||new Set();
 const peek=()=>tokens[p],next=()=>tokens[p++];
 const expect=t=>{const x=next();if(!x||x.t!==t)throw new FormulaError('syntax','Tanda kurung atau tanda baca tidak lengkap');return x};
 function rangeRefs(a,b){
  const ma=refRe.exec(a),mb=refRe.exec(b);if(!ma||!mb)throw new FormulaError('syntax','Range tidak valid');
  const c1=colNum(ma[1].toUpperCase()),c2=colNum(mb[1].toUpperCase()),r1=+ma[2],r2=+mb[2];
  const out=[];for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)out.push(colName(c)+r);
  if(out.length>200)throw new FormulaError('syntax','Range terlalu besar');return out;
 }
 function args(){
  const list=[];
  if(peek()&&peek().t===')'){next();return list}
  for(;;){
   if(peek()&&peek().t==='ref'&&tokens[p+1]&&tokens[p+1].t===':'){const a=next().v;next();const b=expect('ref').v;for(const r of rangeRefs(a,b))list.push(sheet.valueOf(r,refs))}
   else list.push(addsub());
   const t=next();if(!t)throw new FormulaError('syntax','Tanda kurung tidak ditutup');
   if(t.t===')')break;if(t.t!==',')throw new FormulaError('syntax','Pisahkan argumen dengan koma');
  }
  return list;
 }
 function primary(){
  const t=next();if(!t)throw new FormulaError('syntax','Rumus belum lengkap');
  if(t.t==='num')return t.v;
  if(t.t==='ref')return sheet.valueOf(t.v,refs);
  if(t.t==='('){const v=addsub();expect(')');return v}
  if(t.t==='fn'){
   expect('(');const a=args();
   switch(t.v){
    case 'SUM':return a.reduce((x,y)=>x+y,0);
    case 'AVERAGE':if(!a.length)throw new FormulaError('div0');return a.reduce((x,y)=>x+y,0)/a.length;
    case 'MIN':if(!a.length)throw new FormulaError('args');return Math.min(...a);
    case 'MAX':if(!a.length)throw new FormulaError('args');return Math.max(...a);
    case 'ABS':if(a.length!==1)throw new FormulaError('args');return Math.abs(a[0]);
    case 'ROUND':{if(a.length<1||a.length>2)throw new FormulaError('args');const d=a.length===2?a[1]:0,f=Math.pow(10,d);return Math.round((a[0]+Number.EPSILON)*f)/f}
    default:throw new FormulaError('fn','Fungsi tidak didukung: '+t.v);
   }
  }
  throw new FormulaError('syntax','Rumus tidak valid');
 }
 function unary(){const t=peek();if(t&&t.t==='op'&&(t.v==='-'||t.v==='+')){next();const v=unary();return t.v==='-'?-v:v}return primary()}
 function power(){let b=unary();while(peek()&&peek().t==='op'&&peek().v==='^'){next();const e=unary();b=Math.pow(b,e)}return b}
 function muldiv(){let v=power();while(peek()&&peek().t==='op'&&(peek().v==='*'||peek().v==='/')){const o=next().v,w=power();if(o==='/'&&w===0)throw new FormulaError('div0','Pembagian dengan nol');v=o==='*'?v*w:v/w}return v}
 function addsub(){let v=muldiv();while(peek()&&peek().t==='op'&&(peek().v==='+'||peek().v==='-')){const o=next().v,w=muldiv();v=o==='+'?v+w:v-w}return v}
 const value=addsub();
 if(p<tokens.length)throw new FormulaError('syntax','Ada bagian rumus yang tersisa');
 if(!Number.isFinite(value))throw new FormulaError('range','Hasil di luar jangkauan');
 return {value,refs};
}
/* Check one learner cell. spec: {value, tolerance, refs?: [cells that must be referenced], misconceptions?: [{value, tolerance?, feedback}]}.
   raw can be a number, "=formula" or plain text. A correct value typed as a plain number when refs are required is reported as hard-coded. */
function checkCell(spec,raw,sheet){
 const text=norm(raw);
 if(text==='')return {status:'empty'};
 let value,refs=new Set(),formula=false;
 try{
  if(text.startsWith('=')){formula=true;const r=evaluate(text.slice(1),sheet,refs);value=r.value}
  else{value=parseNumber(text);if(!Number.isFinite(value))return {status:'error',code:'text',message:'Isi angka atau rumus yang diawali "="'}}
 }catch(e){return {status:'error',code:e.code||'syntax',message:e.message}}
 const tol=spec.tolerance??1e-9,near=(a,b,t)=>Math.abs(a-b)<=t;
 if(near(value,spec.value,tol)){
  const need=(spec.refs||[]).map(r=>r.toUpperCase());
  const missing=need.filter(r=>!refs.has(r));
  if(need.length&&(!formula||missing.length))return {status:'hardcoded',value,formula,missing};
  return {status:'ok',value,formula,refs:[...refs]};
 }
 const mis=(spec.misconceptions||[]).find(m=>near(value,m.value,m.tolerance??tol));
 return {status:'wrong',value,formula,misconception:mis?mis.feedback:null};
}
const api={FormulaError,createSheet,evaluate,parseNumber,checkCell,colName,colNum,norm};
root.SELFGrid=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
