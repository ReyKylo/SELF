/* SELF account sync: mirrors per-user browser settings (Today pins, Work saved views and Calendar events) into public.user_kv so they follow the account, not the device. Feature files keep reading and writing
   localStorage unchanged; this layer wraps Storage writes for allow-listed keys, pushes them debounced, and pulls on sign-in.
   Sign-out flushes, then wipes the synced keys so the next person on a shared browser starts clean.
   If the table is missing or the network fails, everything keeps working from localStorage. Spec: docs/MULTIUSER_PLAN.md */
(function(root){
'use strict';
const PREFIXES=['self.today.','self.views.','self.cal.events.','self.studio.notes.'];
const MAX_VALUE=262144;
const synced=k=>typeof k==='string'&&k.length<=200&&PREFIXES.some(p=>k.startsWith(p))&&!/\.anon(\.|$)/.test(k);

/* Remote wins; local-only keys are uploaded once. Oversized or non-string values are skipped. */
function plan(local,remote){
 const write=[],push=[];
 const rem=new Map((remote||[]).filter(r=>r&&synced(r.key)&&typeof r.value==='string').map(r=>[r.key,r.value]));
 for(const [k,v] of rem)if(local[k]!==v)write.push([k,v]);
 for(const k of Object.keys(local||{}))if(synced(k)&&!rem.has(k)&&typeof local[k]==='string'&&local[k].length<=MAX_VALUE)push.push([k,local[k]]);
 return {write,push};
}

let host=null,ok=true,ready=false;
const dirty=new Map(),gone=new Set();let timer=null,applying=false,inflight=Promise.resolve();
const store=()=>{try{return root.localStorage}catch{return null}};

function install(){
 const proto=root.Storage?.prototype;if(!proto||proto.__selfSync)return;
 const set=proto.setItem,remove=proto.removeItem;
 proto.setItem=function(k,v){const r=set.apply(this,arguments);if(!applying&&this===store()&&synced(k)&&String(v).length<=MAX_VALUE)queue(k,String(v));return r};
 proto.removeItem=function(k){const r=remove.apply(this,arguments);if(!applying&&this===store()&&synced(k))queue(k,null);return r};
 proto.__selfSync=true;
}
function queue(k,v){
 if(!ok||!ready||!host?.state?.().user)return;
 if(v===null){dirty.delete(k);gone.add(k)}else{gone.delete(k);dirty.set(k,v)}
 clearTimeout(timer);timer=setTimeout(flush,1500);
}
function flush(){
 clearTimeout(timer);timer=null;
 const u=host?.state?.().user;if(!ok||!u||(!dirty.size&&!gone.size))return inflight;
 const rows=[...dirty].map(([key,value])=>({user_id:u.id,key,value})),del=[...gone];dirty.clear();gone.clear();
 inflight=inflight.then(async()=>{
  try{
   if(rows.length)await host.request('/rest/v1/user_kv?on_conflict=user_id,key',{method:'POST',body:rows,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
   for(const k of del)await host.request('/rest/v1/user_kv?key=eq.'+encodeURIComponent(k),{method:'DELETE'});
  }catch(e){if(/user_kv|relation|schema cache|404/i.test(e.message))ok=false;else{rows.forEach(r=>dirty.set(r.key,r.value));del.forEach(k=>gone.add(k))}}
 });
 return inflight;
}
async function pull(){
 const s=store(),u=host?.state?.().user;if(!s||!u||!ok)return;
 try{
  const remote=await host.request('/rest/v1/user_kv?select=key,value&limit=2000');
  const local={};for(let i=0;i<s.length;i++){const k=s.key(i);if(synced(k))local[k]=s.getItem(k)}
  const {write,push}=plan(local,remote);
  applying=true;try{for(const [k,v] of write)s.setItem(k,v)}finally{applying=false}
  dirty.clear();gone.clear();ready=true;
  push.forEach(([k,v])=>dirty.set(k,v));if(push.length)flush();
 }catch(e){if(/user_kv|relation|schema cache|404/i.test(e.message))ok=false}
}
async function clear(){
 await flush();ready=false;dirty.clear();gone.clear();
 const s=store();if(!s)return;
 const keys=[];for(let i=0;i<s.length;i++){const k=s.key(i);if(synced(k))keys.push(k)}
 applying=true;try{keys.forEach(k=>s.removeItem(k))}finally{applying=false}
}
function init(h){host=h;install();root.addEventListener?.('pagehide',()=>{flush()})}
root.SELFSync={init,pull,flush,clear,plan,synced,PREFIXES};
if(typeof module!=='undefined')module.exports=root.SELFSync;
})(typeof window!=='undefined'?window:globalThis);
