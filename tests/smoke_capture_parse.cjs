/* Capture shorthand: Indonesian and English dates, weekday rollover, Spaces (exact, prefix, ambiguous, unknown), priority, links, edge cases. */
const assert=require('node:assert/strict');
const {parseCapture,matchSpace,addDays,nextWeekday,norm}=require('../capture-parse.js');
const TODAY='2026-10-23'; // a Friday
const spaces=[{id:'s-career',name:'Career'},{id:'s-fin',name:'Finance'},{id:'s-fit',name:'Fitness'},{id:'s-kul',name:'Kuliah'},{id:'s-ai',name:'AI & Tools'}];
const P=(t,o={})=>parseCapture(t,{today:TODAY,spaces,...o});
const pick=r=>({kind:r.kind,title:r.title,due:r.dueDate,space:r.spaceId,pri:r.priority});
let n=0;const eq=(text,expected,opts)=>{n++;const r=P(text,opts);assert.deepEqual({kind:r.kind,title:r.title,due:r.dueDate,space:r.spaceId,pri:r.priority},{kind:'note',title:'',due:null,space:null,pri:null,...expected},JSON.stringify(text))};

/* the headline example */
eq('Kirim CV ke Dimas besok #Career !high',{kind:'task',title:'Kirim CV ke Dimas',due:'2026-10-24',space:'s-career',pri:'high'});
/* kind: verb, date, priority make a task; otherwise a note or link */
eq('Review Research Saham',{kind:'task',title:'Review Research Saham'});
eq('Ide: board cohort retention ArusOps',{kind:'note',title:'Ide: board cohort retention ArusOps'});
eq('bandingkan DCF vs comps',{kind:'note',title:'bandingkan DCF vs comps'});
eq('Meet today at 5',{kind:'task',title:'Meet at 5',due:TODAY});
eq('!low tulis catatan',{kind:'task',title:'tulis catatan',pri:'low'});
eq('Pikirkan strategi !normal',{kind:'task',title:'Pikirkan strategi',pri:'normal'});
/* natural dates */
eq('Bayar listrik hari ini',{kind:'task',title:'Bayar listrik',due:'2026-10-23'});
eq('Follow up tomorrow',{kind:'task',title:'Follow up',due:'2026-10-24'});
eq('Siapkan slide lusa',{kind:'task',title:'Siapkan slide',due:'2026-10-25'});
eq('lusa: kirim laporan',{kind:'task',title:'kirim laporan',due:'2026-10-25'});
/* weekdays mean the next occurrence AFTER today, and today is a Friday */
eq('Call Rara jumat',{kind:'task',title:'Call Rara',due:'2026-10-30'});
eq('Call Rara friday',{kind:'task',title:'Call Rara',due:'2026-10-30'});
eq('Call Rara sabtu',{kind:'task',title:'Call Rara',due:'2026-10-24'});
eq('Call Rara minggu',{kind:'task',title:'Call Rara',due:'2026-10-25'});
eq('Call Rara senin',{kind:'task',title:'Call Rara',due:'2026-10-26'});
eq('Call Rara Wednesday',{kind:'task',title:'Call Rara',due:'2026-10-28'});
eq('kamis review memo',{kind:'task',title:'review memo',due:'2026-10-29'});
/* "minggu" as a week is not Sunday; a date word alone is the title, not a date */
eq('Rencana minggu ini',{kind:'note',title:'Rencana minggu ini'});
eq('minggu depan review memo',{kind:'note',title:'minggu depan review memo'});
eq('besok',{kind:'note',title:'besok'});
eq('hari ini',{kind:'note',title:'hari ini'});
/* words that merely contain a date word */
eq('senior analyst notes',{kind:'note',title:'senior analyst notes'});
eq('Sabtunya kita bahas',{kind:'note',title:'Sabtunya kita bahas'});
/* explicit dates */
eq('due:2026-11-05 Siapkan memo',{kind:'task',title:'Siapkan memo',due:'2026-11-05'});
eq('Siapkan memo due:2026-11-05 besok',{kind:'task',title:'Siapkan memo besok',due:'2026-11-05'}); // an explicit date wins; the unused word stays in the title instead of being deleted
{n++;const r=P('Siapkan memo due:2026-02-30');assert.equal(r.dueDate,null);assert.ok(r.warnings.some(w=>w.type==='bad-date'&&w.text==='2026-02-30'));assert.equal(r.kind,'task')}
/* calendar arithmetic */
assert.equal(addDays('2026-12-30',3),'2027-01-02');assert.equal(addDays('2026-02-28',1),'2026-03-01');assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(addDays('2028-02-29',1),'2028-03-01');n+=4;
assert.equal(P('Kirim besok',{today:'2026-12-31'}).dueDate,'2027-01-01');assert.equal(nextWeekday('2026-10-23',5),'2026-10-30');assert.equal(nextWeekday('2026-10-23',4),'2026-10-29');n+=3;
/* Spaces */
eq('#kuliah Bayar uang semester',{kind:'task',title:'Bayar uang semester',space:'s-kul'});
eq('#KULIAH baca bab 3',{kind:'task',title:'baca bab 3',space:'s-kul'});
eq('#ai-tools cek model baru',{kind:'task',title:'cek model baru',space:'s-ai'});
eq('#fin Bayar pajak',{kind:'task',title:'Bayar pajak',space:'s-fin'});            // unique prefix of three or more characters
eq('Catatan rapat #Career',{kind:'note',title:'Catatan rapat',space:'s-career'});     // a note can be filed to a Space
{n++;const r=P('Bayar listrik #Unknown');assert.equal(r.spaceId,null);assert.deepEqual(r.warnings,[{type:'unknown-space',name:'Unknown'}]);assert.equal(r.title,'Bayar listrik');assert.ok(r.chips.some(c=>c.k==='warn'&&/No Space named “Unknown”/.test(c.label)))}
{n++;const r=P('Bayar #fi',{});assert.equal(r.spaceId,null,'two characters is too short for a prefix');assert.equal(r.warnings[0].type,'unknown-space')}
{n++;const r=P('Bayar #fit',{spaces:[{id:'a',name:'Fitness'},{id:'b',name:'Fitting room'}]});assert.equal(r.spaceId,null);assert.equal(r.warnings[0].type,'ambiguous-space')}
{n++;const r=P('Bayar #fin',{spaces:[{id:'a',name:'Finance'},{id:'b',name:'Finance'}]});assert.equal(r.spaceId,null,'two Spaces with the same name are ambiguous');assert.equal(r.warnings[0].type,'ambiguous-space')}
{n++;const r=P('Bayar #career #kuliah');assert.equal(r.spaceId,'s-career');assert.deepEqual(r.warnings,[{type:'extra-space',names:['kuliah']}])}
{n++;const r=P('Bayar #career',{spaces:[]});assert.equal(r.spaceId,null,'no Spaces at all: still no invention');assert.equal(r.warnings[0].type,'unknown-space')}
assert.equal(norm('AI & Tools'),'aitools');assert.equal(norm('Kuliáh'),'kuliah');assert.equal(matchSpace('ai-tools',spaces).space.id,'s-ai');n+=3;
/* priority */
eq('!tinggi beli kopi',{kind:'task',title:'beli kopi',pri:'high'});
eq('tulis !LOW',{kind:'task',title:'tulis',pri:'low'});
{n++;const r=P('Kirim !urgent');assert.equal(r.priority,null);assert.deepEqual(r.warnings,[{type:'unknown-priority',text:'urgent'}]);assert.equal(r.title,'Kirim !urgent','an unknown !word stays in the title')}
eq('Kirim laporan! besok',{kind:'task',title:'Kirim laporan!',due:'2026-10-24'}); // an exclamation mark is not a priority
/* links */
{n++;const r=P('https://docs.google.com/spreadsheets/d/123');assert.deepEqual([r.kind,r.title,r.url],['link','docs.google.com','https://docs.google.com/spreadsheets/d/123'])}
{n++;const r=P('lihat https://x.com/a.');assert.deepEqual([r.kind,r.title,r.url],['link','lihat','https://x.com/a'],'trailing punctuation is not part of the link')}
{n++;const r=P('baca https://example.com/paper besok #career');assert.deepEqual([r.kind,r.title,r.description,r.dueDate,r.spaceId],['task','baca','https://example.com/paper','2026-10-24','s-career'])}
{n++;const r=P('https://example.com/x !high');assert.deepEqual([r.ok,r.kind,r.title,r.description,r.priority],[true,'task','example.com','https://example.com/x','high'],'a link with a priority is a task titled by its site')}
{n++;const r=P('ftp://files.example.com/x');assert.equal(r.kind,'note');assert.equal(r.url,null)}
{n++;const r=P('javascript:alert(1)');assert.equal(r.kind,'note');assert.equal(r.url,null)}
/* nothing to file */
for(const t of ['','   ','#Career !high','!high','due:2026-11-05']){n++;const r=P(t);assert.equal(r.ok,false,JSON.stringify(t)+' is not a capture');if(t.trim())assert.ok(r.warnings.some(w=>w.type==='no-title'))}
{n++;assert.equal(parseCapture('Kirim besok',{today:'not-a-date',spaces}).ok,false)}
{n++;assert.equal(parseCapture(null,{today:TODAY}).ok,false);assert.equal(parseCapture(undefined,{today:TODAY}).ok,false)}
/* length and markup are the renderer's problem, not silently altered here */
{n++;const r=P('Kirim '+'x'.repeat(400));assert.equal(r.title.length,250);assert.ok(r.warnings.some(w=>w.type==='truncated'))}
{n++;const r=P('<img src=x onerror=alert(1)> besok');assert.ok(r.title.includes('<img src=x onerror=alert(1)>'));assert.equal(r.dueDate,'2026-10-24')}
/* chips describe exactly what will be saved */
{n++;const r=P('Kirim CV besok #Career !high');assert.deepEqual(r.chips.map(c=>c.label),['Task','Space: Career','Priority: high','Due: 2026-10-24'])}
{n++;const r=P('Catatan biasa');assert.deepEqual(r.chips.map(c=>c.label),['Note'])}
console.log('PASS Capture shorthand: '+n+' checks (Indonesian and English dates, weekday rollover from a Friday, week-not-Sunday, explicit and impossible dates, month/year/leap arithmetic, Spaces by name/prefix/ambiguity/unknown, priorities, links and unsafe schemes, empty and over-long input, chips)');
