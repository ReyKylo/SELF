/* Command palette: fuzzy ranking, item ordering, record search, creation items, and that nothing is ever built with innerHTML. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const P=require('../palette.js'),{parseCapture}=require('../capture-parse.js');
const TODAY='2026-10-23';
const spaces=[{id:'s1',name:'Career'},{id:'s2',name:'Finance'}];
const base={tasks:[{id:'t1',title:'Aruna Supply · debt schedule tab',space_id:'s1',status:'planning'},{id:'t2',title:'Review Research Saham',space_id:'s2',status:'todo'},{id:'t3',title:'Old finished task',status:'done'},{id:'t4',title:'<img src=x onerror=alert(1)>',status:'todo'}],
 spaces,boards:[{id:'b1',title:'Money Flow'},{id:'b2',title:'Valuation'}],people:[{id:'p1',full_name:'Sari Wijaya',role_title:'Associate'}],companies:[{id:'c1',name:'Northstar Capital'}],
 links:[{id:'l1',title:'Aruna model v2',url:'https://docs.google.com/spreadsheets/d/aruna'}],spaceName:id=>spaces.find(s=>s.id===id)?.name||'',statusName:s=>({planning:'Planning',todo:'To Do',done:'Done'}[s]||s)};
const items=q=>P.buildItems({...base,capture:q.trim()?parseCapture(q,{today:TODAY,spaces}):null},q);
const labels=q=>items(q).map(i=>i.label);
let n=0;

/* fuzzy */
assert.ok(P.fuzzy('hunt','Go to Hunt').score>P.fuzzy('hnt','Go to Hunt').score,'a substring beats a subsequence');n++;
assert.equal(P.fuzzy('zzz','Go to Hunt'),null);assert.equal(P.fuzzy('','anything').score,0);n+=2;
assert.deepEqual(P.fuzzy('hunt','Go to Hunt').idx,[6,7,8,9],'match positions are reported for highlighting');n++;
assert.ok(P.fuzzy('mf','Money Flow').score>P.fuzzy('mf','Some far thing').score,'word starts score higher');n++;
assert.equal(P.fuzzy('ARUNA','Aruna Supply').idx.length,5,'case-insensitive');n++;
assert.ok(P.fuzzy('aruna debt','Aruna Supply · debt schedule tab'),'a query may span words');n++;
const ranked=P.rank([{label:'Beta'},{label:'Alpha'},{label:'Alphabet soup'}],'alpha');assert.deepEqual(ranked.map(r=>r.label),['Alpha','Alphabet soup'],'ties and prefixes order by closeness');n++;

/* empty query: rooms and a few actions, no records, no creation */
{const l=items('');assert.deepEqual(l.slice(0,5).map(i=>i.label),['Go to Today','Go to Work','Go to Hunt','Go to Study','Go to Studio']);assert.ok(l.some(i=>i.label==='Switch theme'));assert.ok(l.every(i=>!['Tasks','Boards','People'].includes(i.group)));assert.ok(l.every(i=>i.run.type!=='create'));n+=4}
/* one word that names a place: navigation first, creation last */
{const l=items('hunt');assert.equal(l[0].label,'Go to Hunt');assert.equal(l[0].run.room,'hunt');assert.ok(l.some(i=>i.run.type==='create'),'you can still create a note called hunt');assert.equal(l.at(-1).run.type==='create'||l.at(-2).run.type==='create',true);n+=3}
/* shorthand: creation first, with the parser's chips as the hint */
{const l=items('Kirim CV ke Dimas besok #Career !high');assert.equal(l[0].group,'Create');assert.equal(l[0].label,'Create task “Kirim CV ke Dimas”');assert.equal(l[0].hint,'Space: Career · Priority: high · Due: 2026-10-24');assert.equal(l[0].run.capture.spaceId,'s1');assert.equal(l[1].label,'Save note “Kirim CV ke Dimas” to Career','the note alternative keeps the Space');n+=4}
{const l=items('Catatan rapat strategi');assert.equal(l[0].label,'Save note “Catatan rapat strategi” to Inbox');assert.equal(l[1].label,'Create task “Catatan rapat strategi”');assert.equal(l[0].run.capture.kind,'note');assert.equal(l[1].run.capture.kind,'task');n+=4}
{const l=items('https://example.com/paper');assert.equal(l[0].label,'Save link “example.com”');assert.equal(l[0].run.capture.url,'https://example.com/paper');n+=2}
/* an unknown Space is offered, never created implicitly */
{const l=items('Bayar listrik #Rumah');const c=l.find(i=>i.run.type==='create-space');assert.equal(c.label,'Create Space “Rumah”');assert.equal(l[0].run.capture.spaceId,null);assert.ok(!l.slice(0,2).some(i=>i.run.type==='create-space'),'the Space is an extra choice, not the default');n+=3}
/* a query that names a command runs it, even if it has two words or looks like a verb */
for(const [q,expect] of [['switch theme',r=>r.type==='theme'],['search everything',r=>r.view==='search'],['study',r=>r.room==='study'],['work',r=>r.room==='work'],['hunt people',r=>r.type==='career'&&r.page==='people'],['settings',r=>r.view==='settings']]){
 const first=items(q)[0];assert.ok(expect(first.run),JSON.stringify(q)+' should run a command first, got '+first.label);n++}
{const l=items('Study for exam besok');assert.equal(l[0].group,'Create');assert.equal(l[0].run.capture.dueDate,'2026-10-24');n+=2}
{const l=items('work on memo');assert.equal(l[0].group,'Create','a sentence that merely starts with a command word is a capture');n++}
/* records */
{const l=items('aruna');assert.ok(l.some(i=>i.group==='Tasks'&&i.run.id==='t1'));assert.ok(l.some(i=>i.group==='Links'&&i.run.url.includes('aruna')));n+=2}
{const l=items('money');assert.equal(l.find(i=>i.group==='Boards').run.id,'b1');assert.ok(items('sari').find(i=>i.group==='People'));assert.ok(items('north').find(i=>i.group==='Companies'));assert.ok(items('career').find(i=>i.group==='Spaces'));n+=4}
assert.equal(items('o').filter(i=>['Tasks','Boards','People'].includes(i.group)).length,0,'records need two characters');n++;
{const l=items('task');const t=l.filter(i=>i.group==='Tasks');assert.ok(t.length>=1);assert.ok(t.findIndex(i=>i.run.id==='t3')===-1||t.findIndex(i=>i.run.id==='t3')>t.findIndex(i=>i.run.id!=='t3'),'finished tasks never outrank open ones');n++}
assert.ok(items('settings').some(i=>i.run.view==='settings')&&items('theme').some(i=>i.run.type==='theme')&&items('search').some(i=>i.run.view==='search'));n++;
assert.ok(items('pipeline').some(i=>i.run.type==='career'&&i.run.page==='applications'));assert.ok(items('kit').some(i=>i.run.page==='cvs'));n+=2;
/* limits and dedupe */
assert.ok(items('a').length<=30);const keys=items('review').map(i=>i.group+'|'+i.label+'|'+JSON.stringify(i.run));assert.equal(new Set(keys).size,keys.length,'no duplicates');n+=2;
assert.deepEqual(P.createItems(parseCapture('!high',{today:TODAY,spaces})),[],'nothing to create without a title');n++;
assert.ok(P.createItems(parseCapture('Kirim besok',{today:TODAY,spaces}),{altOnly:true}).every(i=>i.run.type!=='create'||i.run.capture.kind!=='task'));n++;

/* source safety: titles are data, never markup */
const src=fs.readFileSync(path.join(__dirname,'..','palette.js'),'utf8');
assert.doesNotMatch(src,/innerHTML|insertAdjacentHTML|outerHTML|document\.write/,'the palette builds its DOM with textContent only');
assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|localStorage/,'the palette does no I/O of its own');
assert.match(src,/aria-controls/);assert.match(src,/aria-activedescendant/);assert.match(src,/role.*combobox/);assert.match(src,/'listbox'/);assert.match(src,/aria-modal/);n+=5;
const xss=items('img src');assert.ok(xss.some(i=>i.label==='<img src=x onerror=alert(1)>'),'a hostile title is an ordinary string');n++;
console.log('PASS Palette: '+n+' checks (fuzzy scoring and highlights, empty-state rooms, navigation versus creation ordering, shorthand chips as hints, unknown Space offered not created, record search across tasks/Spaces/boards/people/companies/links, limits, no innerHTML or I/O, combobox ARIA present)');
