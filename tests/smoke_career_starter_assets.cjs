'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const assets=[
 {id:'PE',name:'PE_LBO_Starter.xlsx.b64',sheets:['INPUTS','OPERATIONS','RETURNS'],tokens:['Sponsor equity','Free cash flow','MOIC']},
 {id:'VC',name:'VC_Investment_Starter.xlsx.b64',sheets:['COHORTS','METRICS','FINANCING'],tokens:['Logo retention','Investor ownership entry','Runway months']},
 {id:'Consulting',name:'Consulting_Profitability_Starter.xlsx.b64',sheets:['INPUTS','PROFIT BRIDGE','DECK GUIDE'],tokens:['Volume effect','Unit cost effect','Combined year-one net']}
];
function crc(bytes){let c=-1;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=c>>>1^((c&1)?0xedb88320:0)}return(c^-1)>>>0}
function entries(buf){
 const output=new Map();let i=0;
 while(i+30<buf.length&&buf.readUInt32LE(i)===0x04034b50){
  const method=buf.readUInt16LE(i+8),expected=buf.readUInt32LE(i+14);
  const len=buf.readUInt32LE(i+18),nlen=buf.readUInt16LE(i+26),extra=buf.readUInt16LE(i+28);
  const name=buf.subarray(i+30,i+30+nlen).toString('utf8');
  assert.equal(method,0,'ZIP stored entry only: '+name);
  const body=buf.subarray(i+30+nlen+extra,i+30+nlen+extra+len);
  assert.equal(body.length,len,'entry length: '+name);
  assert.equal(crc(body),expected,'CRC check: '+name);
  output.set(name,body.toString('utf8'));i+=30+nlen+extra+len;
 }
 assert.equal(buf.readUInt32LE(i),0x02014b50,'central directory follows local entries');
 return output;
}
for(const x of assets){
 const source=fs.readFileSync(path.join(root,'content/career-kits',x.name),'utf8').trim();
 assert.match(source,/^UEsDB/,'real ZIP header');
 const b=Buffer.from(source,'base64');
 assert(b.length>6000);
 const files=entries(b);
 for(const req of ['[Content_Types].xml','xl/workbook.xml','xl/styles.xml','xl/_rels/workbook.xml.rels'])assert(files.has(req),'missing '+req);
 const work=files.get('xl/workbook.xml');
 for(const name of x.sheets)assert(work.includes('name="'+name+'"'),'workbook missing '+name);
 const xml=[...files].filter(([name])=>name.startsWith('xl/worksheets/')).map(([,v])=>v).join('\n');
 for(const token of x.tokens)assert(xml.toLowerCase().includes(token.toLowerCase()),x.name+' missing '+token);
 assert(xml.includes('<f>'),'starter must contain Excel formulas');
 assert(!xml.includes('#REF!'),'no broken formula references');
 console.log('PASS',x.id,Math.round(b.length/1024)+'kB',x.sheets.length+' sheets',((xml.match(/<f>/g)||[]).length)+' formulas');
}
console.log('PASS SELF Career starter XLSX ZIP integrity, CRC, formula and sheet structure');
