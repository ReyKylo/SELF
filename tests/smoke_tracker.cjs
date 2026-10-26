/* Tracker helpers: URL normalisation, source detection, capture parsing, duplicates, views, ageing, ordering, industry mapping. No DOM, no network. */
const assert=require('node:assert/strict');
const T=require('../tracker.js');
let n=0;const t=(name,fn)=>{fn();n++};

t('normalizeUrl',()=>{
 assert.equal(T.normalizeUrl('northstar.co/careers/?utm_source=x&trk=y#top'),'https://northstar.co/careers','scheme added, tracking and hash dropped, trailing slash dropped');
 assert.equal(T.normalizeUrl('HTTPS://WWW.Northstar.CO/Careers/'),'https://northstar.co/Careers','host lowercased, www dropped, path case kept');
 assert.equal(T.normalizeUrl('https://jobs.example.com/view?id=42&utm_campaign=a&gclid=z'),'https://jobs.example.com/view?id=42','job id parameter kept');
 assert.equal(T.normalizeUrl('https://jobs.example.com/view?b=2&a=1'),'https://jobs.example.com/view?a=1&b=2','parameters sorted for a stable key');
 assert.equal(T.normalizeUrl('https://www.linkedin.com/jobs/view/3812345678/?trackingId=abc&refId=x'),'https://www.linkedin.com/jobs/view/3812345678');
 assert.equal(T.normalizeUrl('https://id.linkedin.com/jobs/view/analyst-at-northstar-3812345678'),'https://www.linkedin.com/jobs/view/3812345678','slug-style job link');
 assert.equal(T.normalizeUrl('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=3812345678'),'https://www.linkedin.com/jobs/view/3812345678','currentJobId');
 assert.equal(T.normalizeUrl('https://id.linkedin.com/in/Putri-Handayani-7B21A9C/?originalSubdomain=id'),'https://www.linkedin.com/in/putri-handayani-7b21a9c/','profile key shared with Outreach');
 assert.equal(T.normalizeUrl('mailto:HR@Northstar.co?subject=Hi'),'mailto:hr@northstar.co');
 for(const bad of ['','   ','javascript:alert(1)','ftp://x.com/a','not a url','localhost','mailto:nope',null,undefined])assert.equal(T.normalizeUrl(bad),null,String(bad));
});
t('registrable domain and company guess',()=>{
 assert.equal(T.registrable('careers.northstar.co.id'),'northstar.co.id');
 assert.equal(T.registrable('www.example.com.sg'),'example.com.sg');
 assert.equal(T.registrable('careers.kaliandra.com'),'kaliandra.com');
 assert.equal(T.companyFromHost('careers.northstar-capital.co.id'),'Northstar Capital');
 assert.equal(T.companyFromHost('meranti.com'),'Meranti');
 assert.equal(T.companyFromHost('localhost'),'');
});
t('detectSource follows the table',()=>{
 const d=T.detectSource;
 const row=(url,source,kind,guess='')=>{const r=d(url);assert.deepEqual([r.source,r.kind,r.companyGuess],[source,kind,guess],url)};
 row('https://www.linkedin.com/jobs/view/3812345678','linkedin_jobs','job');
 row('https://www.linkedin.com/jobs/search/?currentJobId=3812345678','linkedin_jobs','job');
 row('https://id.linkedin.com/in/budi-santoso-8a1b2c3','linkedin','person');
 row('https://www.linkedin.com/company/northstar-capital/','linkedin','company','Northstar Capital');
 row('https://www.linkedin.com/feed/','linkedin','other');
 row('https://www.jobstreet.co.id/id/job/12345','jobstreet','job');
 row('https://id.jobstreet.com/job/12345','jobstreet','job');
 row('https://glints.com/id/opportunities/jobs/analyst/abc','glints','job');
 row('https://www.kalibrr.com/c/xendit/jobs/123/business-analyst','kalibrr','job','Xendit');
 row('https://www.indeed.com/viewjob?jk=abc','job_board','job');
 row('https://id.indeed.com/viewjob?jk=abc','job_board','job');
 row('https://dealls.com/loker/abc','job_board','job');
 row('https://techinasia.com/jobs/abc','job_board','job');
 row('https://techinasia.com/news/abc','website','company','Techinasia');
 row('https://boards.greenhouse.io/northstar/jobs/1','ats','job','Northstar');
 row('https://job-boards.greenhouse.io/meranti/jobs/1','ats','job','Meranti');
 row('https://jobs.lever.co/kaliandra/abc','ats','job','Kaliandra');
 row('https://jobs.ashbyhq.com/xendit/abc','ats','job','Xendit');
 row('https://apply.workable.com/gojek/j/ABC','ats','job','Gojek');
 row('https://acme.workable.com/jobs/1','ats','job','Acme');
 row('https://acme.wd3.myworkdayjobs.com/en-US/External','ats','job','Acme');
 row('https://careers.northstar.co.id/analyst','company_site','job','Northstar');
 row('https://northstar.co/careers','company_site','job','Northstar');
 row('https://northstar.co/id/karir/analyst','company_site','job','Northstar');
 row('mailto:hr@northstar.co','email','person','Northstar');
 row('mailto:rani@gmail.com','email','person','');
 row('https://northstar.co','website','company','Northstar');
 assert.equal(d('nonsense').source,'other');
 assert.equal(d('https://northstar.co/careers').url,'https://northstar.co/careers');
});
t('parseDrop on messy text',()=>{
 const r=T.parseDrop('cek ini https://www.jobstreet.co.id/id/job/1?utm_source=x, dan\nhttps://id.linkedin.com/in/budi-santoso-8a1b2c3/ lalu www.northstar.co/careers/ (sama)\nhttps://northstar.co/careers');
 assert.equal(r.length,3,'in-block duplicate removed');
 assert.deepEqual(r.map(x=>x.source),['jobstreet','linkedin','company_site']);
 assert.equal(r[1].title,'Budi Santoso','person title is a name guess from the slug');
 assert.equal(r[0].title,'','several links: surrounding words are not a title');
 const one=T.parseDrop('Analyst Intern Northstar https://glints.com/id/opportunities/jobs/x');
 assert.equal(one.length,1);assert.equal(one[0].title,'Analyst Intern Northstar','single link keeps the words around it');
 const note=T.parseDrop('  tanya   kak Sari soal   PE  ');
 assert.deepEqual(note.map(x=>[x.note,x.url,x.kind]),[['tanya kak Sari soal PE',null,'other']]);
 assert.deepEqual(T.parseDrop('   '),[]);assert.deepEqual(T.parseDrop(null),[]);
 assert.equal(T.parseDrop('linkedin.com/in/raka-mahendra')[0].url,'https://www.linkedin.com/in/raka-mahendra/','bare linkedin link');
});
t('findDuplicate',()=>{
 const rows=[{id:'a',url:'https://www.linkedin.com/jobs/view/3812345678'},{id:'b',url:null},{id:'c',url:'https://northstar.co/careers'}];
 assert.equal(T.findDuplicate('https://id.linkedin.com/jobs/view/analyst-3812345678?trk=x',rows).id,'a');
 assert.equal(T.findDuplicate('northstar.co/careers/?utm_source=a',rows).id,'c');
 assert.equal(T.findDuplicate('https://other.co',rows),null);
 assert.equal(T.findDuplicate('nope',rows),null);
});
const TODAY='2026-10-26';
t('bucket boundaries',()=>{
 const b=(o)=>T.bucket({status:'active',last_activity_at:'2026-10-25T08:00:00Z',...o},TODAY);
 assert.deepEqual(b({}),['all']);
 assert.deepEqual(b({status:'inbox'}),['all','inbox']);
 assert.ok(b({next_due:'2026-10-26'}).includes('today'),'due today');
 assert.ok(b({next_due:'2026-10-25'}).includes('today'),'due yesterday');
 assert.ok(!b({next_due:'2026-10-27'}).includes('today'),'due tomorrow');
 assert.ok(b({deadline:'2026-10-29'}).includes('today'),'deadline in 3 days');
 assert.ok(!b({deadline:'2026-10-30'}).includes('today'),'deadline in 4 days');
 assert.ok(b({deadline:'2026-10-20'}).includes('today'),'deadline passed');
 assert.ok(b({last_activity_at:'2026-10-12T00:00:00Z'}).includes('stale'),'exactly 14 days');
 assert.ok(!b({last_activity_at:'2026-10-13T00:00:00Z'}).includes('stale'),'13 days');
 assert.ok(T.bucket({status:'active',last_activity_at:'2026-10-20T00:00:00Z'},TODAY,5).includes('stale'),'custom threshold');
 assert.ok(b({status:'inbox',last_activity_at:'2026-09-01T00:00:00Z'}).includes('stale'),'inbox rows can be stale');
 for(const status of ['done','dropped'])assert.deepEqual(b({status,next_due:'2026-10-01',deadline:'2026-10-01',last_activity_at:'2026-01-01T00:00:00Z'}),['all'],status+' only in All');
 assert.ok(T.bucket({status:'active',created_at:'2026-01-01T00:00:00Z'},TODAY).includes('stale'),'falls back to created_at');
});
t('ageLabel',()=>{
 const a=ts=>T.ageLabel(ts,TODAY);
 assert.equal(a(null),'new');assert.equal(a('garbage'),'new');
 assert.equal(a('2026-10-26T01:00:00Z'),'today');assert.equal(a('2026-10-27T01:00:00Z'),'today','future clamps to today');
 assert.equal(a('2026-10-25T23:00:00Z'),'1d ago');assert.equal(a('2026-10-14T00:00:00Z'),'12d ago');
 assert.equal(a('2026-07-26T00:00:00Z'),'3mo ago');assert.equal(a('2024-10-26T00:00:00Z'),'2y ago');
});
t('sortFor',()=>{
 const ids=(v,rows)=>T.sortFor(v,rows,TODAY).map(r=>r.id);
 const rows=[
  {id:'a',next_due:'2026-10-26',last_activity_at:'2026-10-20T00:00:00Z',created_at:'2026-10-01T00:00:00Z'},
  {id:'b',next_due:'2026-10-20',last_activity_at:'2026-10-10T00:00:00Z',created_at:'2026-10-05T00:00:00Z'},
  {id:'c',deadline:'2026-10-22',last_activity_at:'2026-10-25T00:00:00Z',created_at:'2026-10-03T00:00:00Z'}];
 assert.deepEqual(ids('today',rows),['b','c','a'],'overdue first');
 assert.deepEqual(ids('inbox',rows),['b','c','a'],'newest created first');
 assert.deepEqual(ids('all',rows),['c','a','b'],'last touched first');
 assert.deepEqual(ids('stale',rows),['b','a','c'],'oldest touch first');
 assert.deepEqual(rows.map(r=>r.id),['a','b','c'],'input is not mutated');
});
t('industry mapping',()=>{
 const m=T.industryOf;
 for(const [x,y] of [['PE','Private Equity'],['pe fund','Private Equity'],['Private equity','Private Equity'],['VC','Venture Capital'],['venture capital','Venture Capital'],['IB','Investment Banking'],['Investment Bank','Investment Banking'],['Big 4 consulting','Consulting'],['Corporate Finance','Corporate Finance / Strategy'],['Asset management','Asset Management'],['fintech','Fintech'],['Bank','Banking'],['SaaS','Tech'],['Fashion','Other'],['','']])assert.equal(m(x),y,x);
 assert.equal(m(null),'');assert.equal(m('Tech'),'Tech');assert.equal(m('consulting'),'Consulting','exact label, any case');
 const companies=[{id:'c1',industry:'PE fund'},{id:'c2',industry:''}];
 assert.equal(T.industryFor({industry:'VC',company_id:'c1'},companies),'Venture Capital','own industry wins');
 assert.equal(T.industryFor({industry:'',company_id:'c1'},companies),'Private Equity','inherits the company industry');
 assert.equal(T.industryFor({industry:'',company_id:'c2'},companies),'');
 assert.equal(T.industryFor({industry:'',company_id:null},companies),'');
});
t('vocabulary',()=>{
 assert.deepEqual(T.STATUSES.map(s=>s[0]),['inbox','active','waiting','done','dropped']);
 assert.equal(T.sourceLabel('linkedin_jobs'),'LinkedIn Jobs');assert.equal(T.statusLabel('waiting'),'Waiting');assert.equal(T.kindLabel('person'),'Person');
 assert.equal(T.INDUSTRIES.length,16);assert.equal(T.STALE_DAYS,14);
});
/* ---- T4: Today agenda and the command palette use the Tracker through the SELFTracker global ---- */
t('Today agenda lists due Tracker rows and counts Inbox and Stale',()=>{
 globalThis.SELFTracker=T;
 const Today=require('../today.js');
 const row=(id,o)=>({id,status:'active',title:id,last_activity_at:'2026-10-25T00:00:00Z',created_at:'2026-10-01T00:00:00Z',...o});
 const career={tracks:[row('Due now',{next_due:TODAY,next_step:'Send CV'}),row('Late',{next_due:'2026-10-23',next_step:'Chase'}),row('Fresh inbox',{status:'inbox'}),row('Old one',{last_activity_at:'2026-09-01T00:00:00Z'}),row('Done',{status:'done',next_due:TODAY})],staleDays:14,people:[],applications:[],companies:[],interviews:[],touchpoints:[]};
 const ag=Today.buildAgenda({tasks:[],day:TODAY,now:Date.parse('2026-10-26T03:00:00Z'),career});
 const tr=ag.items.filter(i=>i.kind==='track');
 assert.deepEqual(tr.map(i=>i.title),['Late','Due now'],'overdue first, done rows excluded');
 assert.equal(tr[0].time,'3d late');assert.equal(tr[1].time,'Due');assert.deepEqual(tr[0].open,{action:'open-career',page:'tracker',view:'today'});
 assert.equal(ag.items.filter(i=>i.kind==='track').length,2);
 delete globalThis.SELFTracker;
 const without=Today.buildAgenda({tasks:[],day:TODAY,now:Date.parse('2026-10-26T03:00:00Z'),career});
 assert.equal(without.items.filter(i=>i.kind==='track').length,0,'no Tracker module, no Tracker rows, no crash');
 const noTracks=Today.buildAgenda({tasks:[],day:TODAY,now:Date.parse('2026-10-26T03:00:00Z'),career:{...career,tracks:undefined}});
 assert.equal(noTracks.items.length,0);
 globalThis.SELFTracker=T;
});
t('palette offers Track in Career only when the Tracker is available',()=>{
 globalThis.SELFTracker=T;
 const P=require('../palette.js');
 const ctx={tasks:[],spaces:[],boards:[],links:[],people:[],companies:[],capture:null};
 const find=(c,q)=>P.buildItems(c,q).filter(i=>i.run.type==='track');
 assert.equal(find(ctx,'https://www.jobstreet.co.id/id/job/1').length,0,'off without canTrack');
 const on={...ctx,canTrack:true};
 let it=find(on,'https://www.jobstreet.co.id/id/job/1');
 assert.equal(it.length,1);assert.match(it[0].label,/^Track in Career: /);assert.equal(it[0].hint,'Hunt Inbox · Jobstreet');assert.equal(it[0].run.text,'https://www.jobstreet.co.id/id/job/1');
 it=find(on,'https://a.example/x https://www.jobstreet.co.id/id/job/1');assert.equal(it[0].label,'Track 2 links in Career');
 it=find(on,'tanya kak Sari soal PE');assert.match(it[0].label,/^Track in Career as a note/);
 assert.equal(find(on,'hunt').length,0,'a single word is not offered as a note');
 assert.equal(find(on,'x').length,0);
});
console.log('PASS Tracker helpers: '+n+' groups (urls, sources, capture, duplicates, views, ageing, ordering, industry, vocabulary).');
