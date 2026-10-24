/* Practice grid: formula parser fixtures (no eval), references and ranges, cycles, errors, hard-code detection and misconception routing. */
const assert=require('node:assert/strict');
const G=require('../career-grid.js');
let n=0;
const sheet=G.createSheet({B5:50,C5:75,B6:58,C6:80,B7:35,C7:45,B8:'=B5+B6-B7',C8:'=C5+C6-C7',A1:2,A2:3,A3:'4'});
const ev=(e,s=sheet)=>G.evaluate(e,s).value;
const eq=(e,v,s)=>{assert.ok(Math.abs(ev(e,s)-v)<1e-9,e+' = '+ev(e,s)+', expected '+v);n++};

/* arithmetic and precedence */
eq('1+2*3',7);eq('(1+2)*3',9);eq('10-4-3',3);eq('100/5/2',10);eq('2^3^2',64);eq('-2^2',4);eq('2^-1',0.5);eq('-(3+4)',-7);eq('+5',5);eq('3-+2',1);
eq('1.5+2.25',3.75);eq('.5*4',2);eq('50%',0.5);eq('200*5%',10);eq('0.1+0.2',0.3);
eq('−5+10',5);eq('6×7',42);eq('84÷2',42);eq('2 + 2',4);
/* references */
eq('B8',73);eq('C8',110);eq('C8-B8',37);eq('(C5+C6-C7)-(B5+B6-B7)',37);eq('c8-b8',37);eq('A1+A2+A3',9);eq('Z9',0,sheet);
eq('34/240*345',48.875);eq('C5-345*34/240',26.125);
/* functions and ranges */
eq('SUM(A1:A3)',9);eq('SUM(A1,A2,10)',15);eq('SUM(B5:C5)',125);eq('MIN(B5:B7)',35);eq('MAX(C5:C7)',80);eq('AVERAGE(A1:A3)',3);eq('ABS(B7-C7)',10);eq('ROUND(26.125,1)',26.1);eq('ROUND(2.5)',3);eq('ROUND(1.005,2)',1.01);
eq('SUM(B5:B6)-B7',73);eq('SUM(C5:C6;-C7)',110);eq('sum(a1:a2)',5);eq('MAX(A1:A3)-MIN(A1:A3)',2);
/* errors carry a code and never throw anything else */
const err=(e,code)=>{try{ev(e);assert.fail('expected an error: '+e)}catch(x){assert.ok(x instanceof G.FormulaError,e+' threw '+x);assert.equal(x.code,code,e);n++}};
err('1/0','div0');err('1+','syntax');err('(1+2','syntax');err('1+2)','syntax');err('1 2','syntax');err('$A$1','syntax');err('FOO(1)','fn');err('SUM(1','syntax');err('ROUND()','args');err('ABS(1,2)','args');err('2^10000','range');err('C5:C7','syntax');err('abc','syntax');err('SUM(A1:ZZ999)','syntax');err('','syntax');
/* circular references are detected */
{const s=G.createSheet({A1:'=B1+1',B1:'=A1+1'});assert.throws(()=>G.evaluate('A1',s),e=>e.code==='cycle');n++}
{const s=G.createSheet({A1:'=A1'});assert.throws(()=>G.evaluate('A1',s),e=>e.code==='cycle');n++}
{const s=G.createSheet({A1:'abc'});assert.throws(()=>G.evaluate('A1',s),e=>e.code==='text');n++}
/* the engine cannot reach the host */
for(const bad of ['constructor','this.x','process.exit()','(()=>1)()','`1`','1;2','__proto__','globalThis'])assert.throws(()=>ev(bad),G.FormulaError,bad),n++;
/* referenced cells are reported */
{const r=G.evaluate('(C5+C6-C7)-(B5+B6-B7)',sheet);assert.deepEqual([...r.refs].sort(),['B5','B6','B7','C5','C6','C7']);n++}
{const r=G.evaluate('C8-B8',sheet);assert.ok(r.refs.has('C8')&&r.refs.has('B8')&&r.refs.has('C5'),'dependencies of referenced formulas are included');n++}
/* number parsing: a decimal comma is read, an ambiguous thousands format is refused */
assert.equal(G.parseNumber('37'),37);assert.equal(G.parseNumber(' −0,96 '),-0.96);assert.equal(G.parseNumber('26.1'),26.1);assert.equal(G.parseNumber('12%'),0.12);
for(const bad of ['1.234,5','','abc','1,2,3','37 bn','--1'])assert.ok(Number.isNaN(G.parseNumber(bad)),JSON.stringify(bad)),n++;
n+=4;
/* checking a learner cell */
const spec={value:37,tolerance:1e-6,refs:['C5','C6','C7','B5','B6','B7'],misconceptions:[{value:183,feedback:'Kamu menjumlah dua saldo.'},{value:-37,feedback:'Ukurannya benar, tandanya terbalik.'},{value:110,feedback:'Itu saldo 2025.'},{value:22,feedback:'Itu kenaikan 2024.'}]};
const chk=raw=>G.checkCell(spec,raw,sheet);
assert.equal(chk('').status,'empty');n++;
assert.equal(chk('=(C5+C6-C7)-(B5+B6-B7)').status,'ok');n++;
assert.equal(chk('=C5+C6-C7-B5-B6+B7').status,'ok','algebraically equal, all six refs present');n++;
assert.equal(chk('=C8-B8').status,'ok','reaching the same refs through the helper row also counts');n++;
{const r=chk('=110-73');assert.equal(r.status,'hardcoded');assert.equal(r.formula,true);assert.deepEqual(r.missing.sort(),['B5','B6','B7','C5','C6','C7']);n++}
{const r=chk('37');assert.equal(r.status,'hardcoded');assert.equal(r.formula,false);n++}
assert.equal(chk('=C8+B8').misconception,'Kamu menjumlah dua saldo.');n++;
assert.equal(chk('=B8-C8').misconception,'Ukurannya benar, tandanya terbalik.');n++;
assert.equal(chk('110').misconception,'Itu saldo 2025.');n++;
assert.equal(chk('22').misconception,'Itu kenaikan 2024.');n++;
{const r=chk('999');assert.equal(r.status,'wrong');assert.equal(r.misconception,null);n++}
{const r=chk('=C8-');assert.equal(r.status,'error');assert.equal(r.code,'syntax');n++}
{const r=chk('thirty seven');assert.equal(r.status,'error');n++}
{const r=G.checkCell({value:-0.96,tolerance:0.01},'-0,96',sheet);assert.equal(r.status,'ok','no refs required: a typed value is fine');n++}
{const r=G.checkCell({value:-0.96,tolerance:0.01},'-0.955',sheet);assert.equal(r.status,'ok','within tolerance');n++}
{const r=G.checkCell({value:-0.96,tolerance:0.01},'-0.8',sheet);assert.equal(r.status,'wrong');n++}
console.log('PASS Career grid: '+n+' fixtures (precedence, references, ranges, functions, errors, cycles, host isolation, hard-code detection, misconceptions).');
