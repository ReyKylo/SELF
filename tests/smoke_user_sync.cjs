const assert=require('assert');
class FakeStorage{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return [...this.m.keys()][i]??null}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const ls=new FakeStorage();
global.Storage=FakeStorage;
global.localStorage=ls;
const Sync=require('../user-sync.js');
const {plan,synced}=Sync;

// allow-list
assert(synced('self.today.u1.2026-10-26')&&synced('self.views.u1')&&synced('self.cal.routines.u1'));assert(!synced('self.cal.routines.anon')&&!synced('self.cal.prefs'));
// Study and Hunt keys are deliberately untracked
assert(!synced('self.lesson.v2.u1.pe-1')&&!synced('self.study.track.u1')&&!synced('self.review.v1.u1')&&!synced('self.tracker.draft')&&!synced('self.dossier.x')&&!synced('self.outreach.x'));
assert(!synced('self.session')&&!synced('self.theme')&&!synced('self.scale')&&!synced('other.key')&&!synced('self.views.anon')&&!synced('self.lesson.v2.anon.x')&&!synced(null));

// plan: remote wins, local-only is pushed, junk ignored
let r=plan({'self.views.u1':'[1]','self.today.u1.d':'["a"]','self.session':'tok'},[{key:'self.views.u1',value:'[2]'},{key:'self.today.u1.d2',value:'[]'},{key:'evil',value:'x'},{key:'self.views.u2',value:5}]);
assert.deepStrictEqual(r.write.sort(),[['self.today.u1.d2','[]'],['self.views.u1','[2]']].sort());
assert.deepStrictEqual(r.push,[['self.today.u1.d','["a"]']]);
assert.deepStrictEqual(plan({'self.views.u1':'same'},[{key:'self.views.u1',value:'same'}]),{write:[],push:[]});
assert.deepStrictEqual(plan({'self.views.u1':'x'.repeat(262145)},[]).push,[]);

(async()=>{
 const calls=[];let fail=null;
 const host={state:()=>({user:{id:'u1'}}),request:async(path,o={})=>{calls.push([path,o.method||'GET',o.body]);if(fail)throw new Error(fail);if(path.includes('select=key,value'))return [{key:'self.views.u1',value:'["remote"]'}];return null}};
 Sync.init(host);
 ls.setItem('self.views.u1','["local-old"]');ls.setItem('self.today.u1.d','["p"]');
 // pull: remote overwrites, local-only pushed, no echo of remote writes
 await Sync.pull();await Sync.flush();
 assert.strictEqual(ls.getItem('self.views.u1'),'["remote"]');
 const posts=calls.filter(c=>c[1]==='POST');
 assert.strictEqual(posts.length,1);assert.deepStrictEqual(posts[0][2],[{user_id:'u1',key:'self.today.u1.d',value:'["p"]'}]);
 assert(posts[0][0].includes('on_conflict=user_id,key'));
 // later writes are queued and flushed; non-synced keys are not
 calls.length=0;ls.setItem('self.theme','light');ls.setItem('self.views.u1','["new"]');await Sync.flush();
 assert.deepStrictEqual(calls.map(c=>c[1]),['POST']);assert.strictEqual(calls[0][2][0].value,'["new"]');
 // removal becomes DELETE
 calls.length=0;ls.removeItem('self.views.u1');await Sync.flush();
 assert(calls.some(c=>c[1]==='DELETE'&&c[0].includes('key=eq.self.views.u1')));
 // clear: flushes then wipes only synced keys
 ls.setItem('self.views.u1','["x"]');ls.setItem('self.theme','dark');ls.setItem('self.session','tok');
 await Sync.clear();
 assert.strictEqual(ls.getItem('self.views.u1'),null);assert.strictEqual(ls.getItem('self.today.u1.d'),null);
 assert.strictEqual(ls.getItem('self.theme'),'dark');assert.strictEqual(ls.getItem('self.session'),'tok');
 // missing table: sync disables itself, local still works
 fail='relation "public.user_kv" does not exist';
 ls.setItem('self.views.u1','["a"]');await Sync.flush();
 calls.length=0;ls.setItem('self.views.u1','["b"]');await Sync.flush();
 assert.strictEqual(calls.length,0);assert.strictEqual(ls.getItem('self.views.u1'),'["b"]');
 console.log('smoke_user_sync OK');
})().catch(e=>{console.error(e);process.exit(1)});
