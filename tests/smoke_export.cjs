/* Export: CSV escaping, spreadsheet formula neutralising, number handling, joins to names, backup JSON without owner ids. */
const assert=require('node:assert/strict');
const E=require('../data-export.js');
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
/* cells */
eq(E.cell('plain'),'plain');eq(E.cell('a,b'),'"a,b"');eq(E.cell('say "hi"'),'"say ""hi"""');eq(E.cell('line1\nline2'),'"line1\nline2"');eq(E.cell('x\r\ny'),'"x\r\ny"');eq(E.cell(' padded '),'" padded "');
eq(E.cell(null),'');eq(E.cell(undefined),'');eq(E.cell(0),'0');eq(E.cell(false),'false');eq(E.cell(-5),'-5','a real negative number is not neutralised');eq(E.cell(12.5),'12.5');
/* formula injection: text that a spreadsheet would run is made inert */
for(const bad of ['=SUM(A1:A9)','+1+1','-2+3','@cmd','\t=1','\r=1','=HYPERLINK("http://x","y")'])assert.ok(E.cell(bad).replace(/^"/,'').startsWith("'"),JSON.stringify(bad)),n++;
eq(E.cell('=1,2'),'"\'=1,2"','neutralised and then quoted');eq(E.cell('2026-10-24'),'2026-10-24','dates are untouched');eq(E.cell('Rp-5'),'Rp-5','only a leading character matters');eq(E.cell({a:1}),'"{""a"":1}"','objects are written as JSON, then CSV-escaped');
/* csv */
const csv=E.toCsv([{a:'x',b:'1,5'},{a:'=BAD',b:null}],[['A','a'],['B','b']]);
eq(csv,'﻿A,B\r\nx,"1,5"\r\n\'=BAD,\r\n');
eq(E.toCsv([],[['A','a']]),'﻿A\r\n','header only for no rows');
/* datasets */
const snap={spaces:[{id:'s1',name:'Career',user_id:'u',icon:'x'}],tasks:[{id:'t1',user_id:'u',title:'=evil(),title',status:'todo',priority:'high',space_id:'s1',due_date:'2026-10-25',description:'d',notes:'',created_at:'c',updated_at:'u'},{id:'t2',title:'Orphan',space_id:'gone',status:'done',priority:'low'}],inbox:[],links:[],boards:[],
 career:{companies:[{id:'c1',name:'Acme, Inc.',industry:'VC',website:'https://a.co',user_id:'u'}],people:[{id:'p1',full_name:'Sari',company_id:'c1',relationship_stage:'connected',profile_url:'https://www.linkedin.com/in/sari/'}],applications:[{id:'a1',company_id:'c1',role_title:'Analyst',hiring_stage:'applied'}],touchpoints:[{id:'tp1',person_id:'p1',contact_at:'2026-10-24',channel:'message',summary:'hi',next_step:'-follow'}],interviews:[{id:'i1',application_id:'a1',title:'Case'}],radar:[{id:'r1',company_name:'BCG',role_title:'BA',job_url:'https://x',relevance_score:70}]}};
const d=E.datasets(snap);
eq(Object.keys(d),['tasks','spaces','inbox','links','boards','applications','people','companies','touchpoints','interviews','radar']);
const tasks=E.csvFor('tasks',snap).split('\r\n');
eq(tasks[0],'﻿id,title,status,priority,space,due_date,description,notes,created_at,updated_at');
eq(tasks[1],'t1,"\'=evil(),title",todo,high,Career,2026-10-25,d,,c,u','space name joined, title neutralised and quoted');
eq(tasks[2].split(',')[4],'','a deleted Space exports as empty, not an id');
eq(E.csvFor('applications',snap).split('\r\n')[1],'a1,"Acme, Inc.",Analyst,applied,,,,,');
eq(E.csvFor('people',snap).split('\r\n')[1].startsWith('p1,Sari,,"Acme, Inc.",,https://www.linkedin.com/in/sari/,connected'),true);
eq(E.csvFor('touchpoints',snap).split('\r\n')[1],"tp1,Sari,2026-10-24,message,hi,'-follow,",'next step neutralised');
eq(E.csvFor('interviews',snap).split('\r\n')[1],'i1,"Acme, Inc. · Analyst",Case,,,,,');
eq(E.csvFor('spaces',snap).split('\r\n')[0],'﻿id,name,icon','auto columns: id first, user_id left out');
eq(E.csvFor('nope',snap),null);
eq(E.datasets({...snap,career:null}).applications,undefined,'Career tables are absent until Career has loaded');
/* backup */
const b=JSON.parse(E.backupJson(snap,new Date('2026-10-24T10:00:00Z')));
eq(b.format,'SELF backup');eq(b.version,1);eq(b.exported_at,'2026-10-24T10:00:00.000Z');eq(b.counts.tasks,2);eq(b.counts.people,1);
assert.ok(!JSON.stringify(b).includes('"user_id"'),'owner ids are not exported');n++;
eq(b.data.tasks[0].title,'=evil(),title','JSON keeps raw text; only CSV is neutralised');assert.match(b.note,/not included/);n++;
eq(E.fileName('tasks','csv',new Date('2026-10-24T10:00:00Z')),'self-tasks-2026-10-24.csv');
console.log('PASS Export: '+n+' checks (CSV escaping, formula neutralising, number handling, joins, backup JSON without owner ids).');
