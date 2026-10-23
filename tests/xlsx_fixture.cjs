/* Test-side XLSX tooling (independent of career-workbook-check.js): read, mutate and re-zip real starter workbooks. */
'use strict';
const fs=require('node:fs');
const zlib=require('node:zlib');
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0};
// Independent reader/writer (test-side), so the module is not graded by its own parser.
function readZip(buf){
  let e=-1;for(let i=buf.length-22;i>=0;i--)if(buf.readUInt32LE(i)===0x06054b50){e=i;break}
  const n=buf.readUInt16LE(e+10);let p=buf.readUInt32LE(e+16);const files=new Map();
  for(let i=0;i<n;i++){
    const method=buf.readUInt16LE(p+10),comp=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),el=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),lo=buf.readUInt32LE(p+42);
    const name=buf.toString('utf8',p+46,p+46+nl);p+=46+nl+el+cl;
    const start=lo+30+buf.readUInt16LE(lo+26)+buf.readUInt16LE(lo+28),raw=buf.subarray(start,start+comp);
    files.set(name,method===8?zlib.inflateRawSync(raw):Buffer.from(raw));
  }
  return files;
}
function writeZip(files){
  const locals=[],central=[];let off=0;
  for(const [name,data] of files){
    const nm=Buffer.from(name),raw=Buffer.from(data),def=zlib.deflateRawSync(raw),crc=crc32(raw);
    const lh=Buffer.alloc(30);lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt16LE(8,8);lh.writeUInt32LE(crc,14);lh.writeUInt32LE(def.length,18);lh.writeUInt32LE(raw.length,22);lh.writeUInt16LE(nm.length,26);
    const ch=Buffer.alloc(46);ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);ch.writeUInt16LE(8,10);ch.writeUInt32LE(crc,16);ch.writeUInt32LE(def.length,20);ch.writeUInt32LE(raw.length,24);ch.writeUInt16LE(nm.length,28);ch.writeUInt32LE(off,42);
    locals.push(lh,nm,def);central.push(ch,nm);off+=30+nm.length+def.length;
  }
  const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.size,8);end.writeUInt16LE(files.size,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(off,16);
  return new Uint8Array(Buffer.concat([...locals,cd,end]));
}
const starterBytes=name=>Buffer.from(fs.readFileSync(__dirname+'/../content/career-kits/'+name+'_Starter.xlsx.b64','utf8').trim(),'base64');
const sheetPath=(files,n)=>{const wb=files.get('xl/workbook.xml').toString(),rels=files.get('xl/_rels/workbook.xml.rels').toString();const tag=wb.match(/<sheet\b[^>]*>/g)[n];const rid=/r:id="([^"]+)"/.exec(tag)[1];const t=new RegExp('<Relationship\\b[^>]*Id="'+rid+'"[^>]*>').exec(rels)[0];return 'xl/'+/Target="([^"]+)"/.exec(t)[1].replace(/^\//,'').replace(/^xl\//,'')};
function mutate(name,sheetIndex,fn){
  const files=readZip(starterBytes(name)),p=sheetPath(files,sheetIndex);
  files.set(p,Buffer.from(fn(files.get(p).toString())));
  return writeZip(files);
}
const cellRe=ref=>new RegExp('<c r="'+ref+'"[^>]*?(?:/>|>[\\s\\S]*?</c>)');
module.exports={readZip,writeZip,starterBytes,sheetPath,mutate,cellRe};
