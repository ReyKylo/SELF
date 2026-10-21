/* Meaningful behavior regressions for the static learning library and canonical Task boundary. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'content/career-learning.json')));
const code=fs.readFileSync(path.join(root,'career-learning.js'),'utf8');
const db=[];let insertAttempts=0,failRead=false,dropAck=false,failInsert=false,contentFail=false;
function setup(owner='owner-a'){
 const state={user:{id:owner},tasks:[]},log=[];let pendingInsert;
 const context={window:{},document:{querySelector(){return null}},console,URL,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout,
  fetch:async()=>({ok:!contentFail,status:contentFail?503:200,json:async()=>structuredClone(data)})};
 vm.createContext(context);vm.runInContext(code,context);const learning=context.window.SELFCareerLearning;
 const host={state:()=>state,render(){},notify(msg,error){log.push({msg,error})},openTask(id){log.push({opened:id})},icon:()=>'',
  async request(url){if(failRead)throw Error('Network unavailable');const id=new URL('https://self.test'+url).searchParams.get('id')?.slice(3);return structuredClone(db.filter(t=>t.id===id&&t.user_id===state.user.id))},
  async insert(table,record){assert.equal(table,'tasks');insertAttempts++;const user_id=state.user.id;
   if(failInsert)throw Error('Write refused');if(db.some(t=>t.id===record.id))throw Error('409 duplicate key');
   const row={...record,user_id};db.push(row);if(pendingInsert)await pendingInsert;if(dropAck){dropAck=false;throw Error('Connection lost after commit')}return structuredClone(row)}
 };
 learning.init({host,career:{ui:{}}});learning.reset(owner);
 return {learning,state,host,context,log,pauseInsert(p){pendingInsert=p},click:async(action,attrs={})=>{
  const b={dataset:{learning:action,...attrs}};return learning.action({target:{closest:q=>q==='[data-learning]'?b:null},preventDefault(){},stopPropagation(){}});
 }};
}
async function main(){
 const f=setup();await f.learning.load();assert.equal(f.learning.ui.data.sources.length,41);assert.equal(f.learning.ui.data.panels.length,12);assert.equal(f.learning.ui.data.videos.length,11);
 let markup=f.learning.render();assert(markup.includes('Tiga proyek.'));assert(markup.includes('Data fiktif'));assert.equal(db.length,0,'reading does not seed tasks');
 await f.click('tab',{tab:'evidence'});markup=f.learning.render();assert(markup.includes('12 dari 12'));assert(markup.includes('INI APA')&&markup.includes('ANALISIS AI'));assert(markup.includes('PREVIEW EKSTERNAL'));assert(markup.includes('media.wallstreetprep.com'),'original publisher image visible in evidence markup');assert(markup.includes('INI APA')&&markup.includes('CARA ACHIEVE'));
 f.learning.ui.track='VC';markup=f.learning.render();assert(markup.includes('4 dari 12'));assert(!markup.includes('Sources &amp; Uses: uang'));
 f.learning.ui.query='no-such-entry';assert(f.learning.render().includes('Tidak ada yang cocok.'));
 await f.click('clear');await f.click('panel',{id:'VC04'});f.learning.ui.query='PagerDuty';f.learning.ui.type='Original Investment Firm Memo';await f.click('video',{id:'VNxBZ7ka5J0'});assert.equal(f.learning.ui.backPanel,'VC04');assert(f.learning.render().includes('How To Keep Your Users'));assert(!f.learning.render().includes('<iframe'));
 await f.click('chapter',{seconds:'43'});markup=f.learning.render();assert(markup.includes('youtube-nocookie.com/embed/VNxBZ7ka5J0?start=43'));
 await f.click('back-evidence');assert.equal(f.learning.ui.panel,'VC04');assert.equal(f.learning.ui.query,'PagerDuty');assert.equal(f.learning.ui.type,'Original Investment Firm Memo');assert(f.learning.render().includes('PagerDuty: land-and-expand'));
 await f.click('tab',{tab:'sources'});await f.click('clear');f.learning.ui.query='Bessemer';assert(f.learning.render().includes('17 dari 41'),'publisher is searchable');await f.click('clear');markup=f.learning.render();assert(markup.includes('41 dari 41'));assert(markup.includes('screening judul'));assert(markup.includes('kasus belum diverifikasi'));
 // String escaping / URL policy: data is curated but no raw HTML is trusted.
 f.learning.ui.data.panels[0].title='<img src=x onerror=alert(1)>';f.learning.ui.data.panels[0].source_url='javascript:alert(1)';
 await f.click('panel',{id:'PE01'});markup=f.learning.render();assert(markup.includes('&lt;img'));assert(!markup.includes('href="javascript:'));
 // Same canonical UUID across independent tabs; different owner is a distinct ID.
 const id=await f.learning.taskId('owner-a','PE');assert.equal(id,await setup().learning.taskId('owner-a','PE'));assert.notEqual(id,await f.learning.taskId('owner-b','PE'));
 const a=setup(),b=setup();await Promise.all([a.learning.load(),b.learning.load()]);
 await Promise.all([a.click('task',{id:'PE'}),b.click('task',{id:'PE'})]);assert.equal(db.length,1,'two tabs converge on canonical tasks PK');assert(a.log.some(x=>x.opened===id));assert(b.log.some(x=>x.opened===id));
 const before=insertAttempts;await a.click('task',{id:'PE'});assert.equal(insertAttempts,before,'repeat opens existing task without POST');
 const c=setup();await c.learning.load();dropAck=true;await c.click('task',{id:'VC'});assert.equal(db.length,2);assert(c.log.some(x=>x.opened),'lost POST acknowledgement reconciled by stable ID');assert(!c.learning.ui.taskError);
 const reloaded=setup();await reloaded.learning.load();await reloaded.click('task',{id:'VC'});assert.equal(db.length,2,'reopened client uses same persisted record');
 failInsert=true;await c.click('task',{id:'Consulting'});assert(c.learning.ui.taskError.includes('Belum bisa memastikan'));assert.equal(db.length,2,'failure does not create phantom task');failInsert=false;
 failRead=true;await c.click('task',{id:'Consulting'});assert(c.learning.ui.taskError);assert.equal(db.length,2,'failed preflight does not POST');failRead=false;
 // Old account async response must not open or inject a record into a new account.
 const d=setup('slow-owner');await d.learning.load();let release;d.pauseInsert(new Promise(r=>release=r));const pending=d.click('task',{id:'PE'});
 while(!db.some(t=>t.user_id==='slow-owner'))await new Promise(r=>setTimeout(r,1));d.state.user.id='new-owner';d.state.tasks=[];d.learning.reset('new-owner');release();await pending;
 assert.equal(d.state.tasks.length,0);assert(!d.log.some(x=>x.opened),'old owner result ignored');assert.equal(d.learning.ui.day,'PE');
 contentFail=true;const broken=setup();await broken.learning.load();assert(broken.learning.render().includes('Materi belum terbuka.'));contentFail=false;await broken.learning.load();assert(broken.learning.render().includes('Tiga proyek.'));
 // Actual Career integration renders static content before unrelated API errors.
 const ctx={window:{SELFCareerLearning:{render:()=>'<h2>LEARNING AVAILABLE</h2>'}},document:{querySelector(){return null}},URL,confirm:()=>true,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'career.js'),'utf8'),ctx);ctx.window.SELFCareer.init({state:()=>({user:{id:'a'}}),render(){}});Object.assign(ctx.window.SELFCareer.ui,{page:'learning',ready:false,error:'Career API failed'});assert(ctx.window.SELFCareer.render().includes('LEARNING AVAILABLE'));
 console.log('PASS Career Prep: 41/12/11 content, filters, empty/error/retry, context return, explicit video play, escaped content, canonical Task identity across tabs/reload/lost-ack, failed reads/writes, owner-switch isolation, unrelated Career failure.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
