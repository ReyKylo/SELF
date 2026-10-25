/* Outreach helpers: LinkedIn link extraction and normalisation, duplicate detection, name guess, role groups, nudges, CSV import, message merge. */
const assert=require('node:assert/strict');
const O=require('../outreach.js');
let n=0;const t=(name,fn)=>{fn();n++};

t('slug and url normalisation',()=>{
 assert.equal(O.slugOf('https://id.linkedin.com/in/Putri-Handayani-7B21A9C/?originalSubdomain=id'),'putri-handayani-7b21a9c');
 assert.equal(O.slugOf('linkedin.com/in/raka-mahendra'),'raka-mahendra');
 assert.equal(O.slugOf('https://www.linkedin.com/company/northstar'),null);
 assert.equal(O.slugOf('https://www.linkedin.com/in/'),null);
 assert.equal(O.slugOf('https://www.linkedin.com/in/a'),null,'too short');
 assert.equal(O.slugOf('https://www.linkedin.com/in/dimas-p.'),'dimas-p','trailing punctuation from pasted prose');
 assert.equal(O.slugOf('https://evil.example/?u=linkedin.com/in/x-y'),'x-y','only the slug is taken; the stored URL is rebuilt');
 assert.equal(O.profileUrl('budi-k'),'https://www.linkedin.com/in/budi-k/');
 assert.equal(O.profileUrl('r%c3%a9my-x'),'https://www.linkedin.com/in/r%25c3%25a9my-x/'.replace('%25c3%25a9','%25c3%25a9'),'percent signs are re-encoded');
});
t('name from slug is a guess',()=>{
 assert.equal(O.nameFromSlug('budi-santoso-8a1b2c3'),'Budi Santoso');
 assert.equal(O.nameFromSlug('raka-mahendra'),'Raka Mahendra');
 assert.equal(O.nameFromSlug('sari-anindya-12345'),'Sari Anindya');
 assert.equal(O.nameFromSlug('123abc'),'123abc','a lone id token is kept rather than returning nothing');
 assert.equal(O.nameFromSlug('ab'),'Ab');
});
t('extract from messy text',()=>{
 const text=`Ini dari search:\nhttps://id.linkedin.com/in/putri-handayani-7b21a9c/?x=1\nhttps://www.linkedin.com/in/raka-mahendra, dan\nlinkedin.com/in/Raka-Mahendra/ (sama)\nhttps://www.linkedin.com/company/northstar\nhttps://www.linkedin.com/in/dimas-prakoso-55aa10)`;
 const r=O.extractLinkedIn(text);
 assert.deepEqual(r.profiles.map(p=>p.slug),['putri-handayani-7b21a9c','raka-mahendra','dimas-prakoso-55aa10']);
 assert.deepEqual(r.profiles.map(p=>p.name),['Putri Handayani','Raka Mahendra','Dimas Prakoso']);
 assert.equal(r.skipped.length,1,'company page skipped');
 assert.equal(O.extractLinkedIn('').profiles.length,0);
 assert.equal(O.extractLinkedIn(null).profiles.length,0);
});
t('duplicates are found across companies',()=>{
 const people=[{id:'p1',full_name:'Dimas',profile_url:'https://www.linkedin.com/in/dimas-prakoso-55aa10/',company_id:'c1'},{id:'p2',full_name:'No link',profile_url:null}];
 const d=O.dedupeAgainst(O.extractLinkedIn('linkedin.com/in/DIMAS-PRAKOSO-55AA10 linkedin.com/in/new-person').profiles,people);
 assert.equal(d[0].existing.id,'p1');assert.equal(d[1].existing,null);
});
t('role groups',()=>{
 assert.equal(O.roleGroup('VP, Investments'),'Senior');assert.equal(O.roleGroup('Managing Director'),'Senior');assert.equal(O.roleGroup('Investment Analyst'),'Peer');
 assert.equal(O.roleGroup('Associate Director'),'Senior');assert.equal(O.roleGroup('Office Manager'),'Other');assert.equal(O.roleGroup(''),'Other');assert.equal(O.roleGroup(null),'Other');
});
t('days and last touch',()=>{
 assert.equal(O.daysBetween('2026-10-01','2026-10-15'),14);assert.equal(O.daysBetween('2026-10-24T05:00:00Z','2026-10-24'),0);assert.ok(Number.isNaN(O.daysBetween('x','2026-10-24')));
 const tps=[{person_id:'a',contact_at:'2026-10-10'},{person_id:'a',contact_at:'2026-10-12'},{person_id:'b',contact_at:'2026-10-20'}];
 assert.equal(O.lastTouch({id:'a',last_contacted_at:'2026-10-05',updated_at:'2026-09-01T00:00:00Z'},tps),'2026-10-12');
 assert.equal(O.lastTouch({id:'z',last_contacted_at:null,updated_at:'2026-09-01T10:00:00Z'},tps),'2026-09-01','falls back to the record date');
});
t('nudge rules',()=>{
 const T='2026-10-24',p=(stage,last)=>({id:'x',relationship_stage:stage,last_contacted_at:last,updated_at:'2026-01-01T00:00:00Z'});
 assert.equal(O.nudge(p('connect_sent','2026-10-10'),[],T)?.code,'stale-pending');
 assert.equal(O.nudge(p('connect_sent','2026-10-11'),[],T),null,'13 days is still fresh');
 assert.equal(O.nudge(p('connected','2026-10-22'),[],T)?.code,'approach');
 assert.equal(O.nudge(p('connected','2026-10-23'),[],T),null);
 assert.equal(O.nudge(p('reached_out','2026-10-17'),[],T)?.code,'follow-up');
 assert.equal(O.nudge(p('reached_out','2026-10-03'),[],T)?.code,'let-go');
 assert.equal(O.nudge(p('reached_out','2026-10-20'),[],T),null);
 assert.equal(O.nudge(p('in_conversation','2026-10-01'),[],T)?.code,'warm');
 assert.equal(O.nudge(p('new','2026-01-01'),[],T),null);assert.equal(O.nudge(p('no_reply','2026-01-01'),[],T),null);assert.equal(O.nudge(p('maintain','2026-01-01'),[],T),null);
 assert.equal(O.nudge(p('connected','2026-10-22'),[{person_id:'x',contact_at:'2026-10-24'}],T),null,'a newer touchpoint resets the clock');
});
t('weekly pace counts only our own request logs within 7 days',()=>{
 const T='2026-10-24',tps=[{summary:O.SENT_PREFIX,contact_at:'2026-10-24'},{summary:O.SENT_PREFIX+': hi',contact_at:'2026-10-18'},{summary:O.SENT_PREFIX,contact_at:'2026-10-17'},{summary:'Coffee chat',contact_at:'2026-10-23'}];
 assert.equal(O.sentThisWeek(tps,T),2);
});
t('csv parsing',()=>{
 assert.deepEqual(O.parseCsv('a,b\n"x, y","q""uote"\r\n\r\nz,'),[['a','b'],['x, y','q"uote'],['z','']]);
 const existing=[{name:'PT Saratoga Investama Sedaya Tbk',website:'https://www.saratoga-investama.com/'},{name:'East Ventures',website:null}];
 const r=O.parseCompaniesCsv('name,industry,website,location,notes\nSaratoga Investama Sedaya,Holding,https://saratoga-investama.com,Jakarta,x\nEast Ventures,VC,,Jakarta,\nNew Fund,VC,newfund.vc,Jakarta Selatan,"a, b"\nNew Fund,VC,,,\nBad Site,VC,not a url,,\n,empty,,,',existing);
 assert.equal(r.error,'');assert.deepEqual(r.rows.map(x=>x.name),['Saratoga Investama Sedaya','East Ventures','New Fund','New Fund','Bad Site']);
 assert.ok(r.rows[0].duplicateOf,'same website host');assert.ok(r.rows[1].duplicateOf,'same normalised name');assert.equal(r.rows[2].duplicateOf,null);
 assert.equal(r.rows[2].website,'https://newfund.vc/');assert.equal(r.rows[2].notes,'a, b');assert.equal(r.rows[3].repeated,true);assert.equal(r.rows[4].website,null);
 assert.match(O.parseCompaniesCsv('foo,bar\n1,2',[]).error,/name/);assert.match(O.parseCompaniesCsv('',[]).error,/header/);
 assert.equal(O.parseCompaniesCsv('Company\nAlter Global',[]).rows[0].name,'Alter Global','company is an accepted header');
});
t('message merge keeps unknown placeholders visible',()=>{
 assert.equal(O.mergeFields('Hi {first_name} at {company} {my_name}',{first_name:'Rina',company:'Northstar',my_name:''}),'Hi Rina at Northstar {my_name}');
 assert.deepEqual(O.unfilled('a {my_name} b {my_name} {role}'),['{my_name}','{role}']);
 assert.equal(O.mergeFields('<b>{first_name}</b>',{first_name:'<script>'}),'<b><script></b>','merge is plain text; the UI escapes on render');
 assert.equal(O.firstName('  Sari Anindya '),'Sari');assert.equal(O.firstName(''),'');
 assert.ok(O.TEMPLATES.every(x=>x.body&&x.label&&/\{first_name\}/.test(x.body)));
 assert.equal(O.linkedInSearch('East Ventures','analyst'),'https://www.linkedin.com/search/results/people/?keywords=%22East%20Ventures%22%20analyst');
 assert.equal(O.initials('Sari Anindya'),'SA');assert.equal(O.initials(''),'?');
});
t('stage list',()=>{assert.deepEqual(O.STAGES.map(s=>s[0]),['new','connect_sent','connected','reached_out','in_conversation']);assert.equal(O.stageLabel('reached_out'),'Approached');assert.equal(O.stageLabel('no_reply'),'No reply');assert.equal(O.stageLabel('maintain'),'Ally')});
console.log('PASS Outreach helpers: '+n+' groups (links, names, dedupe, roles, nudges, pace, CSV, messages, stages).');
