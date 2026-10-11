/* SELF Phase 1.6 Investment Vault cloud actions. Only explicit clicks, never background upload. */
const II16_BASELINE='self.investment.cloud.baseline.v1';
function ii16GetBaseline(id){const all=ii16Parse(localStorage.getItem(II16_BASELINE))||{};return all[id]||{}}
function ii16SetBaseline(id,v){const all=ii16Parse(localStorage.getItem(II16_BASELINE))||{};all[id]=v;localStorage.setItem(II16_BASELINE,JSON.stringify(all))}
function ii16CloudSnapshot(rows){const documents={};for(const r of rows){if(Object.hasOwn(II16_DOCS,r.document_key))documents[r.document_key]=r.payload}return {format:'SELF-Investment-Backup-v1',created:new Date().toISOString(),documents}}
let ii16CloudBusy=false;
async function ii16CloudAction(action){
 if(ii16CloudBusy)throw Error('Previous cloud request is still running.');
 const bridge=window.selfInvestmentCloudBridge;
 if(!bridge)throw Error('SELF Cloud session is not ready. Use the SELF Cloud login panel first.');
 ii16CloudBusy=true;
 try{
  const cloud=await bridge.list(),id=cloud.userId,rows=cloud.rows;
  if(!Array.isArray(rows))throw Error('Unexpected cloud response.');
  if(action==='cloud-download'){
   ii16Download(ii16CloudSnapshot(rows),'SELF_Investment_Cloud_Backup.json');
   ii16Message('Cloud backup downloaded: '+rows.length+' document types. Local data unchanged.');return;
  }
  if(action==='cloud-restore'){
   if(!rows.length)throw Error('Your cloud vault is empty.');
   const snapshot=ii16CloudSnapshot(rows);ii16Validate(snapshot);
   ii16Backup();
   if(!window.confirm('Current local Investment Vault backed up. Restore '+rows.length+' cloud documents? Other SELF data will not change.')){ii16Message('Restore cancelled.');return}
   ii16Restore(snapshot,true);
   const baseline=ii16GetBaseline(id);
   for(const r of rows)baseline[r.document_key]=r.revision;
   ii16SetBaseline(id,baseline);
   location.reload();return;
  }
  if(action!=='cloud-save')throw Error('Unknown cloud operation.');
  if(!window.confirm('Upload your local investment drafts to SELF Cloud? Any cloud revision conflict will stop the upload.'))return;
  const local=ii16Snapshot(),remote=new Map(rows.map(r=>[r.document_key,r])),baseline=ii16GetBaseline(id);let n=0,skipped=0;
  for(const [kind,payload] of Object.entries(local.documents)){
   const existing=remote.get(kind);
   if(existing&&JSON.stringify(existing.payload)===JSON.stringify(payload)){baseline[kind]=existing.revision;ii16SetBaseline(id,baseline);skipped++;continue}
   if(existing&&baseline[kind]!==existing.revision)throw Error('Conflict for '+kind+'. Cloud contains a different revision. Download and compare its backup before overwriting. '+n+' other drafts already uploaded.');
   const out=await bridge.write(kind,payload,existing?existing.revision:0);
   if(!Array.isArray(out)||out.length!==1)throw Error('Cloud update conflict for '+kind+'. Nothing overwritten for this document.');
   baseline[kind]=out[0].revision;ii16SetBaseline(id,baseline);n++;
  }
  ii16Message('Cloud upload confirmed: '+n+' drafts written, '+skipped+' unchanged. Other SELF records untouched.');
 }finally{ii16CloudBusy=false}
}
