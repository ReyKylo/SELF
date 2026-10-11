/* Isolated Phase 1.6 SELF Investment Vault contract and cloud-version tests. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const files=['investment_vault_v16.js','investment_vault_cloud_v16.js'];
const items=new Map(),downloads=[],notices=[];let currentDownload='';
const document={addEventListener(){},getElementById(){return {textContent:''}},createElement(){return {click(){downloads.push(currentDownload)},remove(){},set href(v){},set download(x){currentDownload=x}}},body:{appendChild(){}}};
class FakeURL extends URL{static createObjectURL(){return 'blob:vault'}static revokeObjectURL(){}}
const context=vm.createContext({document,console,Date,Math,Blob,URL:FakeURL,setTimeout(){},window:{confirm:()=>true},localStorage:{getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)},iiEsc:x=>String(x),location:{reload(){}}});
for(const f of files)vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),context,{filename:f});
const run=x=>vm.runInContext(x,context);
items.set('self.investment.memo.v14',JSON.stringify({drafts:{summary:'Our investor research is independent.'}}));
items.set('self.investment.lab.v12',JSON.stringify({notes:[{id:'memo-source'}]}));
const snapshot=run('ii16Snapshot()');
assert.equal(snapshot.format,'SELF-Investment-Backup-v1');
assert.equal(Object.keys(snapshot.documents).length,2);
assert.equal(run('ii16Validate(ii16Snapshot())'),2);
assert.throws(()=>run("ii16Validate({format:'SELF-Investment-Backup-v1',documents:{unknown:{}}})"),/Invalid/);
assert.throws(()=>run('ii16Restore(ii16Snapshot(),false)'),/confirmation/);
const archived=JSON.stringify(snapshot);
items.set('self.investment.memo.v14',JSON.stringify({drafts:{summary:'damaged local state'}}));
run("ii16Restore("+archived+",true)");
assert.equal(JSON.parse(items.get('self.investment.memo.v14')).drafts.summary,'Our investor research is independent.');
run("ii16Backup()");
assert.ok(downloads[0].startsWith('SELF_Investment_Backup_'));
const fake={rows:[],userId:'1234-user'};
context.window.selfInvestmentCloudBridge={
 async list(){return {userId:fake.userId,rows:JSON.parse(JSON.stringify(fake.rows))}},
 async write(kind,payload,revision){
  const old=fake.rows.find(x=>x.document_key===kind);
  if(!old){if(revision!==0)throw Error('bad revision');const row={document_key:kind,revision:1,payload};fake.rows.push(row);return [row]}
  if(old.revision!==revision)return [];
  old.revision++;old.payload=payload;return [old];
 }
};
(async()=>{
 await run("ii16CloudAction('cloud-save')");
 assert.equal(fake.rows.length,2);
 assert.equal(JSON.parse(items.get('self.investment.cloud.baseline.v1'))[fake.userId].memo,1);
 await run("ii16CloudAction('cloud-save')");assert.equal(fake.rows.length,2);
 fake.rows.find(x=>x.document_key==='memo').revision=3;
 items.set('self.investment.memo.v14',JSON.stringify({drafts:{summary:'new local conclusion'}}));
 await assert.rejects(run("ii16CloudAction('cloud-save')"),/Conflict/);
 assert.equal(fake.rows.find(x=>x.document_key==='memo').payload.drafts.summary,'Our investor research is independent.');
 await run("ii16CloudAction('cloud-download')");
 assert.ok(downloads.some(x=>x.includes('Cloud_Backup')));
 assert.match(run('ii16Vault()'),/Investment Vault/);
 console.log('PASS Phase 1.6: backup format and restore guard, scoped types, cloud writes, version conflict and safe download');
})().catch(e=>{console.error(e);process.exitCode=1});
