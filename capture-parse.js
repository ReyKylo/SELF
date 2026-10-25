/* SELF capture shorthand. Pure: text in, a described capture out. It never touches the network, the DOM or the database.
     Kirim CV ke Dimas besok #Career !high   ->  task "Kirim CV ke Dimas", Space Career, high priority, due tomorrow
   Rules, in order:
     #name       a Space by name (case, spaces and punctuation ignored; a unique prefix of 3+ characters also matches).
                 An unknown name is reported as a warning. A Space is never invented.
     !high !normal !low   priority (also !tinggi, !rendah)
     due:YYYY-MM-DD       an explicit date; an impossible date is reported and ignored
     hari ini / today / besok / tomorrow / lusa / senin..minggu / monday..sunday
                 natural dates, in Indonesian or English. A weekday means its next occurrence after today.
                 "minggu ini/depan/lalu" means a week, not Sunday. A date word is only a date when other words remain to be the title.
     http(s) link         a Link, unless a date, priority or verb makes it a Task (then the link goes in the description)
     task or note         a date, a priority or an action verb first makes it a Task; anything else is a Note. */
(function(root){
'use strict';
const WEEKDAYS={senin:1,monday:1,selasa:2,tuesday:2,rabu:3,wednesday:3,kamis:4,thursday:4,jumat:5,friday:5,sabtu:6,saturday:6,minggu:0,sunday:0};
const VERBS=new Set(['kirim','bikin','buat','kerjain','kerjakan','review','follow','siapkan','hubungi','telepon','email','bayar','beli','cek','periksa','selesaikan','tulis','baca','pelajari','daftar','update','hitung','analisa','analisis','submit','send','write','call','prepare','finish','buy','pay','check','read','study','apply','schedule','book','fix','plan','draft','build','make','reply','balas','upload','unggah','revisi','revise']);
const PRIORITIES={high:'high',tinggi:'high',normal:'normal',low:'low',rendah:'low'};
const L='\\p{L}\\p{N}_';
const MAX_TITLE=250;

const norm=v=>String(v??'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const pad=n=>String(n).padStart(2,'0');
function parseDay(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');if(!m)return null;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],12));return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]?d:null}
const fmt=d=>d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());
function addDays(day,n){const d=parseDay(day);d.setUTCDate(d.getUTCDate()+n);return fmt(d)}
function nextWeekday(day,target){const d=parseDay(day),delta=((target-d.getUTCDay()+7)%7)||7;return addDays(day,delta)}

function matchSpace(name,spaces){
 const key=norm(name);if(!key)return {space:null,why:'unknown'};
 const exact=spaces.filter(s=>norm(s.name)===key);
 if(exact.length===1)return {space:exact[0]};
 if(exact.length>1)return {space:null,why:'ambiguous'};
 if(key.length>=3){const pre=spaces.filter(s=>norm(s.name).startsWith(key));if(pre.length===1)return {space:pre[0]};if(pre.length>1)return {space:null,why:'ambiguous'}}
 return {space:null,why:'unknown'};
}
const DATE_WORDS=['hari ini','today','besok','tomorrow','lusa',...Object.keys(WEEKDAYS)];
const dateRe=new RegExp('(^|[^'+L+'])('+DATE_WORDS.map(w=>w.replace(/ /g,'\\s+')).join('|')+')(?!['+L+'])(?!\\s+(?:ini|depan|lalu)(?![' +L+']))','iu');

/* parseCapture(text, {today:'YYYY-MM-DD', spaces:[{id,name}]}) -> {ok, kind, title, description, url, spaceId, spaceName, priority, dueDate, warnings, chips} */
function parseCapture(text,{today,spaces=[]}={}){
 const original=String(text??'').trim();
 const out={ok:false,kind:'note',title:'',description:'',url:null,spaceId:null,spaceName:null,priority:null,dueDate:null,warnings:[],chips:[]};
 if(!original||!parseDay(today))return out;
 let rest=' '+original+' ';

 /* link */
 const urlMatch=/https?:\/\/[^\s<>"']+/i.exec(rest);
 if(urlMatch){
  const cleaned=urlMatch[0].replace(/[),.;!?]+$/,'');
  try{const u=new URL(cleaned);if(['http:','https:'].includes(u.protocol)){out.url=u.href;rest=rest.replace(urlMatch[0],' ')}}catch{}
 }
 /* #space: first one is used, the rest are reported */
 const tagRe=new RegExp('(^|\\s)#(['+L+'-]+)','gu');
 const tags=[...rest.matchAll(tagRe)].map(m=>m[2]);
 rest=rest.replace(tagRe,' ');
 if(tags.length){
  const m=matchSpace(tags[0],spaces);
  if(m.space){out.spaceId=m.space.id;out.spaceName=m.space.name}
  else out.warnings.push({type:m.why==='ambiguous'?'ambiguous-space':'unknown-space',name:tags[0]});
  if(tags.length>1)out.warnings.push({type:'extra-space',names:tags.slice(1)});
 }
 /* !priority */
 const prRe=new RegExp('(^|\\s)!(['+L+']+)(?=$|\\s)','gu');
 for(const m of [...rest.matchAll(prRe)]){
  const p=PRIORITIES[m[2].toLowerCase()];
  if(p&&!out.priority)out.priority=p;
  else if(!p)out.warnings.push({type:'unknown-priority',text:m[2]});
 }
 rest=rest.replace(prRe,(all,pre,word)=>PRIORITIES[word.toLowerCase()]?' ':all);
 /* due:YYYY-MM-DD */
 const dueRe=/(^|\s)due:(\S+)/gi;
 for(const m of [...rest.matchAll(dueRe)]){
  if(parseDay(m[2])&&!out.dueDate)out.dueDate=m[2];
  else if(!parseDay(m[2]))out.warnings.push({type:'bad-date',text:m[2]});
 }
 rest=rest.replace(dueRe,' ');
 /* natural date word: only when other words remain to be the title */
 if(!out.dueDate){
  const m=dateRe.exec(rest);
  if(m){
   const without=(rest.slice(0,m.index+m[1].length)+' '+rest.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim();
   if(without||out.url){
    const w=m[2].toLowerCase().replace(/\s+/g,' ');
    out.dueDate=w==='hari ini'||w==='today'?today:w==='besok'||w==='tomorrow'?addDays(today,1):w==='lusa'?addDays(today,2):nextWeekday(today,WEEKDAYS[w]);
    rest=rest.slice(0,m.index+m[1].length)+' '+rest.slice(m.index+m[0].length);
   }
  }
 }
 let title=rest.replace(/\s+/g,' ').replace(/^[\s:;,–-]+|[\s:;,–-]+$/g,'').trim();
 const firstWord=(title.split(/\s+/)[0]||'').toLowerCase();
 const taskish=!!out.dueDate||!!out.priority||VERBS.has(firstWord);

 if(out.url&&!taskish){out.kind='link';out.title=title||new URL(out.url).hostname;}
 else if(taskish){out.kind='task';out.title=title||(out.url?new URL(out.url).hostname:'');if(out.url)out.description=out.url}
 else{out.kind='note';out.title=title}
 if(!out.title){ // only tokens were typed: there is nothing to file
  out.warnings.push({type:'no-title'});return out;
 }
 if(out.title.length>MAX_TITLE){out.title=out.title.slice(0,MAX_TITLE).trim();out.warnings.push({type:'truncated',max:MAX_TITLE})}
 out.ok=true;
 out.chips=[{k:'kind',label:out.kind==='task'?'Task':out.kind==='link'?'Link':'Note'}];
 if(out.spaceName)out.chips.push({k:'space',label:'Space: '+out.spaceName});
 if(out.priority)out.chips.push({k:'priority',label:'Priority: '+out.priority});
 if(out.dueDate)out.chips.push({k:'due',label:'Due: '+out.dueDate});
 for(const w of out.warnings){
  if(w.type==='unknown-space')out.chips.push({k:'warn',label:'No Space named “'+w.name+'”'});
  else if(w.type==='ambiguous-space')out.chips.push({k:'warn',label:'More than one Space matches “'+w.name+'”'});
  else if(w.type==='bad-date')out.chips.push({k:'warn',label:'Not a date: '+w.text});
  else if(w.type==='extra-space')out.chips.push({k:'warn',label:'Only the first # is used'});
  else if(w.type==='truncated')out.chips.push({k:'warn',label:'Shortened to '+w.max+' characters'});
 }
 return out;
}
const api={parseCapture,norm,addDays,nextWeekday,matchSpace,MAX_TITLE};
root.SELFCapture=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
