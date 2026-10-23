/* SELF Career Prep — deterministic XLSX structure check (parses the real file; never judges whether the finance is right). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SELFWorkbookCheck=api})(typeof self!=='undefined'?self:this,function(){
'use strict';
const MAX_FILE=15*1024*1024,MAX_ENTRY=40*1024*1024,MAX_LIST=20;
const u16=(b,o)=>b[o]|(b[o+1]<<8);
const u32=(b,o)=>(b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;
const text=b=>new TextDecoder('utf-8').decode(b);
const unxml=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const attrs=s=>{const out={};String(s).replace(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,(_,k,a,b)=>{out[k]=unxml(a!==undefined?a:b);return ''});return out};
/** Inflate with a hard output cap: a file that declares a small size but inflates huge is aborted, not buffered. */
async function inflateRaw(data,limit){
 const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),parts=[];let total=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  total+=value.length;
  if(total>limit){try{await reader.cancel()}catch{}throw Error('Ukuran isi ZIP tidak cocok; file mungkin rusak.')}
  parts.push(value);
 }
 const out=new Uint8Array(total);let o=0;for(const p of parts){out.set(p,o);o+=p.length}
 return out;
}
function directory(bytes){
 let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(u32(bytes,i)===0x06054b50){eocd=i;break}}
 if(eocd<0)throw Error('Bukan file XLSX yang valid (struktur ZIP tidak ditemukan).');
 const count=u16(bytes,eocd+10);let p=u32(bytes,eocd+16);const entries=new Map();
 for(let n=0;n<count;n++){
  if(p+46>bytes.length||u32(bytes,p)!==0x02014b50)throw Error('Direktori ZIP rusak.');
  const method=u16(bytes,p+10),comp=u32(bytes,p+20),size=u32(bytes,p+24),nl=u16(bytes,p+28),el=u16(bytes,p+30),cl=u16(bytes,p+32),local=u32(bytes,p+42);
  if(comp===0xffffffff||size===0xffffffff||local===0xffffffff)throw Error('ZIP64 tidak didukung oleh pemeriksa ini.');
  entries.set(text(bytes.subarray(p+46,p+46+nl)),{method,comp,size,local});p+=46+nl+el+cl;
 }
 return entries;
}
async function entry(bytes,entries,name){
 const e=entries.get(name);if(!e)return null;
 if(e.size>MAX_ENTRY)throw Error('Isi file terlalu besar untuk diperiksa.');
 if(u32(bytes,e.local)!==0x04034b50)throw Error('Header ZIP rusak.');
 const start=e.local+30+u16(bytes,e.local+26)+u16(bytes,e.local+28),raw=bytes.subarray(start,start+e.comp);
 let out;if(e.method===0)out=raw;else if(e.method===8)out=await inflateRaw(raw,e.size);else throw Error('Metode kompresi ZIP tidak didukung.');
 if(out.length!==e.size)throw Error('Ukuran isi ZIP tidak cocok; file mungkin rusak.');
 return text(out);
}
function parseSheet(xml){
 const formulas=[],constants=[],errors=[];let textCells=0,boolCells=0,cells=0;
 // Linear scan: split at each cell start; a cell never extends past the next cell start, so malformed input cannot go quadratic.
 const chunks=xml.split(/<(?:[\w-]+:)?c(?=[\s/>])/);chunks.shift();
 for(const chunk of chunks){
  const gt=chunk.indexOf('>');if(gt<0)continue;
  const head=chunk.slice(0,gt),at=attrs(head),ref=at.r;if(!ref)continue;
  cells++;
  const selfClosing=head.endsWith('/'),inner=selfClosing?'':chunk.slice(gt+1).split(/<\/(?:[\w-]+:)?c>/)[0];
  const hasF=/<(?:[\w-]+:)?f(?=[\s/>])/.test(inner);
  if(hasF)formulas.push(ref);
  const v=/<(?:[\w-]+:)?v>([\s\S]*?)<\/(?:[\w-]+:)?v>/.exec(inner);
  if(at.t==='e')errors.push({cell:ref,value:v?unxml(v[1]):'#ERROR'});
  else if(!hasF){
   if(at.t==='s'||at.t==='str'||at.t==='inlineStr')textCells++;
   else if(at.t==='b')boolCells++;
   else if(v&&v[1].trim()!==''&&Number.isFinite(Number(v[1])))constants.push(ref);
  }
 }
 return {formulas,constants,errors,textCells,boolCells,cells};
}
/** Parse the real XLSX bytes. Throws a readable Error when the file is not a readable workbook. */
async function inspect(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(!bytes.length||bytes.length>MAX_FILE)throw Error('Ukuran file harus antara 1 byte dan 15 MB.');
 if(bytes[0]!==0x50||bytes[1]!==0x4b)throw Error('Bukan file XLSX (bukan ZIP).');
 const entries=directory(bytes);
 const wb=await entry(bytes,entries,'xl/workbook.xml');if(!wb)throw Error('Bukan workbook Excel: xl/workbook.xml tidak ada.');
 const rels=await entry(bytes,entries,'xl/_rels/workbook.xml.rels')||'';
 const target={};(rels.match(/<Relationship\b[^>]*>/g)||[]).forEach(r=>{const a=attrs(r);if(a.Id&&a.Target)target[a.Id]=a.Target.startsWith('/')?a.Target.slice(1):'xl/'+a.Target.replace(/^\.\//,'')});
 const sheets=[];
 for(const tag of wb.match(/<sheet\b[^>]*>/g)||[]){
  const a=attrs(tag),name=a.name,file=target[a['r:id']];if(!name)continue;
  const xml=file?await entry(bytes,entries,file):null;
  if(xml===null){sheets.push({name,missing:true,formulas:[],constants:[],errors:[],textCells:0,boolCells:0,cells:0});continue}
  sheets.push({name,missing:false,...parseSheet(xml)});
 }
 if(!sheets.length)throw Error('Workbook tidak memiliki sheet.');
 const findings=[];
 for(const s of sheets){
  if(s.missing)findings.push({severity:'warn',code:'sheet_unreadable',sheet:s.name,message:'Sheet "'+s.name+'" tidak bisa dibaca dari file.'});
  s.errors.slice(0,MAX_LIST).forEach(e=>findings.push({severity:'error',code:'excel_error_value',sheet:s.name,cell:e.cell,message:s.name+'!'+e.cell+' berisi nilai error '+e.value+'.'}));
 }
 const totalFormulas=sheets.reduce((n,s)=>n+s.formulas.length,0);
 const totalCells=sheets.reduce((n,s)=>n+(s.cells||0),0);
 if(!totalCells)findings.push({severity:'warn',code:'no_cells_read',message:'Tidak ada sel yang bisa dibaca dari sheet mana pun; format file ini tidak dikenali pemeriksa, jadi tidak ada kesimpulan tentang formula.'});
 else if(!totalFormulas)findings.push({severity:'warn',code:'no_formulas',message:'Tidak ada satu pun formula; model ini hanya berisi angka yang diketik.'});
 return {fileBytes:bytes.length,sheets,totals:{sheets:sheets.length,formulas:totalFormulas,constants:sheets.reduce((n,s)=>n+s.constants.length,0),errors:sheets.reduce((n,s)=>n+s.errors.length,0)},findings};
}
/** Flag starter formula cells that the upload no longer contains as a formula. Advisory: restructuring a model is legitimate. */
function compareToStarter(report,starter){
 const out=[],byName=new Map(report.sheets.map(s=>[s.name,s]));
 for(const base of starter.sheets){
  if(!base.formulas.length)continue;
  const s=byName.get(base.name);
  if(!s){out.push({severity:'info',code:'starter_sheet_absent',sheet:base.name,message:'Sheet starter "'+base.name+'" tidak ada di file lu.'});continue}
  const has=new Set(s.formulas),hard=new Set(s.constants);let lost=0;
  for(const ref of base.formulas){
   if(has.has(ref))continue;lost++;
   if(lost<=MAX_LIST)out.push({severity:'warn',code:hard.has(ref)?'formula_overwritten':'formula_removed',sheet:base.name,cell:ref,message:base.name+'!'+ref+(hard.has(ref)?' di starter berisi formula, sekarang angka yang diketik.':' di starter berisi formula, sekarang kosong atau teks.')});
  }
  if(lost>MAX_LIST)out.push({severity:'warn',code:'formula_more',sheet:base.name,message:'Dan '+(lost-MAX_LIST)+' sel formula starter lain di sheet "'+base.name+'" juga berubah.'});
 }
 return out;
}
return {inspect,compareToStarter};
});
