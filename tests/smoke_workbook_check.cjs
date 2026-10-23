/* Deterministic XLSX structure check: real starter files, deliberately broken copies, and hostile inputs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const W=require('../career-workbook-check.js');

const {readZip,writeZip,starterBytes,sheetPath,mutate,cellRe}=require('./xlsx_fixture.cjs');

(async()=>{
  const expected={PE_LBO:{sheets:3,formulas:78,ops:1},VC_Investment:{sheets:3,formulas:25,ops:1},Consulting_Profitability:{sheets:3,formulas:16,ops:1}};
  const reports={};
  for(const [name,want] of Object.entries(expected)){
    const r=await W.inspect(new Uint8Array(starterBytes(name)));reports[name]=r;
    assert.equal(r.totals.sheets,want.sheets,name+' sheets');
    assert.equal(r.totals.formulas,want.formulas,name+' formula count is pinned to the shipped starter');
    assert.equal(r.totals.errors,0,name+' has no Excel error values');
    assert.deepEqual(W.compareToStarter(r,r),[],name+' compared to itself is clean');
  }
  console.log('PASS parses the three shipped starter workbooks (78/25/16 formulas) and self-compare is clean');

  // Deliberately altered formula must be flagged, with the exact cell.
  const pe=reports.PE_LBO,ops=pe.sheets.find(s=>s.name==='OPERATIONS'),target=ops.formulas[0];
  const tampered=await W.inspect(mutate('PE_LBO',1,xml=>{assert(cellRe(target).test(xml),'target exists');return xml.replace(cellRe(target),'<c r="'+target+'"><v>12345</v></c>')}));
  const flags=W.compareToStarter(tampered,pe);
  assert(flags.some(f=>f.code==='formula_overwritten'&&f.sheet==='OPERATIONS'&&f.cell===target),'overwritten formula flagged at '+target);
  assert.equal(flags.filter(f=>f.code==='formula_overwritten').length,1,'only the altered cell is flagged');
  assert.equal(tampered.totals.formulas,pe.totals.formulas-1);
  console.log('PASS formula typed over with a constant is flagged at exactly '+target);

  const cleared=await W.inspect(mutate('PE_LBO',1,xml=>xml.replace(cellRe(target),'<c r="'+target+'"/>')));
  assert(W.compareToStarter(cleared,pe).some(f=>f.code==='formula_removed'&&f.cell===target),'cleared formula flagged as removed');
  console.log('PASS cleared formula cell is flagged as removed');

  // Cached Excel error values surface; an untouched workbook has none.
  const broken=await W.inspect(mutate('VC_Investment',1,xml=>xml.replace(/(<c r="[A-Z]+\d+")>(<f>[^<]*<\/f>)<\/c>/,'$1 t="e">$2<v>#REF!</v></c>')));
  assert(broken.totals.errors>=1&&broken.findings.some(f=>f.code==='excel_error_value'&&/#REF!/.test(f.message)),'#REF! reported');
  console.log('PASS cached #REF! value is reported with its cell');

  // A model with no formulas at all is called out as typed numbers.
  const flat=await W.inspect(mutate('Consulting_Profitability',1,xml=>xml.replace(/<f\b[^>]*?(?:\/>|>[\s\S]*?<\/f>)/g,'')));
  assert.equal(flat.totals.formulas,0);
  assert(flat.findings.some(f=>f.code==='no_formulas'));
  console.log('PASS workbook without any formula is flagged');

  // Hostile and broken inputs fail with a readable message, never silently pass.
  for(const [label,bytes,re] of [
    ['empty',new Uint8Array(0),/Ukuran/],
    ['plain text',new TextEncoder().encode('not a workbook at all'),/bukan ZIP|Bukan file XLSX/i],
    ['truncated zip',new Uint8Array(starterBytes('PE_LBO')).subarray(0,3000),/ZIP|XLSX/],
  ]){
    await assert.rejects(()=>W.inspect(bytes),re,label+' rejected');
  }
  const files=readZip(starterBytes('PE_LBO'));files.delete('xl/workbook.xml');
  await assert.rejects(()=>W.inspect(writeZip(files)),/workbook\.xml/,'zip that is not a workbook rejected');
  const lying=Buffer.from(writeZip(readZip(starterBytes('PE_LBO'))));
  // Corrupt the declared uncompressed size of the entry the checker actually reads (xl/workbook.xml).
  let q=lying.readUInt32LE(lying.length-6);
  for(let i=0;i<lying.readUInt16LE(lying.length-12);i++){
    const nl=lying.readUInt16LE(q+28),el=lying.readUInt16LE(q+30),cl=lying.readUInt16LE(q+32);
    if(lying.toString('utf8',q+46,q+46+nl)==='xl/workbook.xml')lying.writeUInt32LE(lying.readUInt32LE(q+24)+7,q+24);
    q+=46+nl+el+cl;
  }
  await assert.rejects(()=>W.inspect(new Uint8Array(lying)),/Ukuran isi ZIP|rusak/,'size mismatch rejected');
  console.log('PASS empty, text, truncated, non-workbook and size-lying inputs are rejected with a readable error');

  // Reviewer findings, locked in as regressions.
  // 1) Namespaced tags and single-quoted attributes are still read (no false "no formulas").
  const peBase=reports.PE_LBO;
  const ns=await W.inspect(mutate('PE_LBO',1,xml=>xml.replace(/<c r="([A-Z]+\d+)"([^>]*)>/g,"<x:c r='$1'$2>").replace(/<\/c>/g,'</x:c>').replace(/<f>/g,'<x:f>').replace(/<\/f>/g,'</x:f>')));
  assert.equal(ns.sheets.find(z=>z.name==='OPERATIONS').formulas.length,peBase.sheets.find(z=>z.name==='OPERATIONS').formulas.length,'namespaced/single-quoted workbook keeps its formulas');
  assert(!ns.findings.some(f=>f.code==='no_formulas'),'no false "no formulas" claim');
  console.log('PASS namespaced tags and single-quoted attributes are read');
  // 2) A file that declares 100 bytes but inflates to 50 MB is aborted, quickly and without buffering it.
  const bombFiles=readZip(starterBytes('PE_LBO'));bombFiles.set('xl/workbook.xml',Buffer.alloc(50*1024*1024,32));
  const bomb=Buffer.from(writeZip(bombFiles));
  let bq=bomb.readUInt32LE(bomb.length-6);
  for(let i=0;i<bomb.readUInt16LE(bomb.length-12);i++){const nl=bomb.readUInt16LE(bq+28),el=bomb.readUInt16LE(bq+30),cl=bomb.readUInt16LE(bq+32);if(bomb.toString('utf8',bq+46,bq+46+nl)==='xl/workbook.xml')bomb.writeUInt32LE(100,bq+24);bq+=46+nl+el+cl}
  const rss0=process.memoryUsage().rss;
  await assert.rejects(()=>W.inspect(new Uint8Array(bomb)),/Ukuran isi ZIP/,'decompression bomb rejected');
  assert(process.memoryUsage().rss-rss0<30*1024*1024,'bomb rejected without buffering the whole output');
  console.log('PASS decompression bomb is aborted without buffering its output');
  // 3) 20,000 unclosed cells must stay linear.
  const flood=mutate('PE_LBO',1,xml=>xml.replace('<sheetData>','<sheetData>'+'<c r="A1">'.repeat(20000)));
  const t0=Date.now();const fr=await W.inspect(flood);
  assert(Date.now()-t0<1500,'flood parsed in linear time ('+(Date.now()-t0)+' ms)');assert(fr.sheets.length===3);
  console.log('PASS 20,000 unclosed cells parse in linear time');
  // 4) Boolean cells are not "typed numbers"; an unreadable sheet body does not claim "no formulas".
  const bools=await W.inspect(mutate('Consulting_Profitability',0,xml=>xml.replace(/<c r="([A-Z]+\d+)"[^>]*><v>[^<]*<\/v><\/c>/,'<c r="$1" t="b"><v>1</v></c>')));
  const baseC=reports.Consulting_Profitability.sheets[0];
  assert.equal(bools.sheets[0].constants.length,baseC.constants.length-1,'boolean cell removed from the typed-number count');
  assert.equal(bools.sheets[0].boolCells,1);
  const odd=readZip(starterBytes('PE_LBO'));
  for(const n of [0,1,2]){const pth=sheetPath(odd,n);odd.set(pth,Buffer.from(odd.get(pth).toString().replace(/<sheetData>[\s\S]*<\/sheetData>/,'<sheetData><row><weird/></row></sheetData>')))}
  const unreadable=await W.inspect(writeZip(odd));
  assert(unreadable.findings.some(f=>f.code==='no_cells_read')&&!unreadable.findings.some(f=>f.code==='no_formulas'),'unrecognised sheet body is reported as unreadable, not as "no formulas"');
  console.log('PASS boolean cells and unreadable sheet bodies are reported honestly');

  // Honesty: the module reports structure only.
  const src=fs.readFileSync(__dirname+'/../career-workbook-check.js','utf8');
  assert(!/expert|certif|approved|benar secara finansial/i.test(src.replace(/never judges[^\n]*/,'')),'checker makes no correctness or endorsement claim');
  console.log('PASS checker makes no financial-correctness or endorsement claim');
})().catch(e=>{console.error(e);process.exit(1)});
