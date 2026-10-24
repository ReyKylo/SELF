/* SELF command palette (Ctrl/Cmd K, or / outside a text field). Jump to a room, open a record, or create from shorthand.
   The pure part (fuzzy, buildItems) is unit-tested; the DOM part builds everything with textContent so record titles never become markup.
   It saves nothing by itself: creation goes through the host's insert/mutate, exactly like Quick Capture. */
(function(root){
'use strict';
const doc=root.document;
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------- ranking ---------- */
const wordStart=(t,i)=>i===0||/[^a-z0-9\p{L}]/iu.test(t[i-1]);
function fuzzy(query,text){
 const q=String(query||'').toLowerCase().trim(),t=String(text||'').toLowerCase();
 if(!q)return {score:0,idx:[]};
 const sub=t.indexOf(q);
 if(sub>=0)return {score:1000-sub*2-(t.length-q.length)*.1+(sub===0?200:0)+(wordStart(t,sub)?100:0),idx:Array.from({length:q.length},(_,k)=>sub+k)};
 let ti=0,prev=-2,score=0;const idx=[];
 for(const ch of q){
  if(ch===' ')continue;
  let at=-1;for(;ti<t.length;ti++){if(t[ti]===ch){at=ti;ti++;break}}
  if(at<0)return null;
  idx.push(at);score+=10+(at===prev+1?15:0)+(wordStart(t,at)?10:0)-Math.min(at,20)*.2;prev=at;
 }
 return {score,idx};
}
/* An entry may match on a shorter `key` than its label (rooms match on "Hunt", not "Go to Hunt"); `offset` maps highlights back onto the label. */
function rank(entries,query,limit){
 const out=[];
 for(const e of entries){const m=fuzzy(query,e.key||e.label);if(m)out.push({...e,score:m.score+(e.bonus||0),idx:m.idx.map(i=>i+(e.offset||0))})}
 out.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
 return limit?out.slice(0,limit):out;
}

/* ---------- items ---------- */
const ROOM_ITEMS=[['today','Today','Three for today, agenda, inbox'],['work','Work','Tasks, Spaces, Links'],['hunt','Hunt','Pipeline, people, companies'],['study','Study','Career Prep'],['studio','Studio','Whiteboards']];
const SECTIONS=[
 {label:'Work · Tasks',hint:'Board, list, calendar',run:{type:'view',view:'work'}},
 {label:'Work · Spaces',hint:'All your Spaces',run:{type:'view',view:'spaces'}},
 {label:'Work · Links',hint:'My Links',run:{type:'view',view:'links'}},
 {label:'Work · Inbox',hint:'Captured notes and links',run:{type:'view',view:'inbox'}},
 {label:'Hunt · Pipeline',hint:'Applications by stage',run:{type:'career',page:'applications'}},
 {label:'Hunt · People',hint:'Networking and follow-ups',run:{type:'career',page:'people'}},
 {label:'Hunt · Companies',hint:'Research and notes',run:{type:'career',page:'companies'}},
 {label:'Hunt · Radar',hint:'Public job feed',run:{type:'career',page:'radar'}},
 {label:'Hunt · Interviews',hint:'Preparation and reflection',run:{type:'career',page:'interviews'}},
 {label:'Hunt · Kit',hint:'CVs, templates, reminders',run:{type:'career',page:'cvs'}},
 {label:'Settings',hint:'Theme, text size, account',run:{type:'view',view:'settings'}},
 {label:'Search everything',hint:'Tasks, boards, links',run:{type:'view',view:'search'}},
 {label:'Switch theme',hint:'Dark or light',run:{type:'theme'}}
];
function kindLabel(c){return c.kind==='task'?'task':c.kind==='link'?'link':'note'}
function createItems(c,{altOnly=false}={}){
 if(!c||!c.ok)return [];
 const where=c.spaceName?' · '+c.spaceName:'';
 const hint=c.chips.filter(x=>x.k!=='kind'&&x.k!=='warn').map(x=>x.label).join(' · ');
 const label=k=>k==='task'?'Create task “'+c.title+'”':k==='link'?'Save link “'+c.title+'”':'Save note “'+c.title+'” to '+(c.spaceName||'Inbox');
 const main={group:'Create',label:label(c.kind),hint:hint||(c.kind==='note'?'Goes to your Inbox':''),run:{type:'create',capture:c}};
 const alt=[];
 if(c.kind==='note')alt.push({group:'Create',label:label('task'),hint:'Make it a task instead',run:{type:'create',capture:{...c,kind:'task'}}});
 if(c.kind==='task')alt.push({group:'Create',label:'Save note “'+c.title+'” to '+(c.spaceName||'Inbox'),hint:'Keep it as a note instead',run:{type:'create',capture:{...c,kind:'note'}}});
 const spaces=[];
 for(const w of c.warnings||[])if(w.type==='unknown-space'&&w.name)
  spaces.push({group:'Create',label:'Create Space “'+w.name+'”',hint:'No Space has that name yet',run:{type:'create-space',name:w.name}});
 return altOnly?[...alt,...spaces]:[main,...alt,...spaces];
}
/* ctx: {tasks,spaces,boards,people,companies,links,statusName,spaceName,capture}  ->  [{id,group,label,hint,idx,run}] in display order */
function buildItems(ctx,query){
 const q=String(query||'').trim();
 const nav=[...ROOM_ITEMS.map(([id,label,hint])=>({group:'Go to',label:'Go to '+label,hint,run:{type:'room',room:id},key:label,offset:'Go to '.length,bonus:40})),
  ...SECTIONS.map(s=>({group:s.run.type==='theme'?'Actions':'Go to',label:s.label,hint:s.hint,run:s.run}))];
 if(!q)return [...nav.slice(0,5),...nav.filter(n=>['Settings','Search everything','Switch theme'].includes(n.label))].map((n,i)=>({...n,id:'i'+i,idx:[]}));
 const navHits=rank(nav.map(n=>({...n,label:n.label})),q,6);
 const records=[];
 if(q.length>=2){
  const add=(group,list,make,limit)=>{records.push(...rank(list.map(make),q,limit))};
  add('Tasks',ctx.tasks||[],t=>({group:'Tasks',label:t.title,hint:[ctx.spaceName?.(t.space_id),ctx.statusName?.(t.status)].filter(Boolean).join(' · '),run:{type:'task',id:t.id}}),5);
  add('Spaces',ctx.spaces||[],s=>({group:'Spaces',label:s.name,hint:'Space',run:{type:'space',id:s.id}}),3);
  add('Boards',ctx.boards||[],b=>({group:'Boards',label:b.title,hint:'Whiteboard',run:{type:'board',id:b.id}}),4);
  add('People',ctx.people||[],p=>({group:'People',label:p.full_name,hint:p.role_title||'Person',run:{type:'career',page:'people'}}),4);
  add('Companies',ctx.companies||[],c=>({group:'Companies',label:c.name,hint:'Company',run:{type:'career',page:'companies'}}),3);
  add('Links',ctx.links||[],l=>({group:'Links',label:l.title||l.url,hint:l.url,run:{type:'link',url:l.url}}),3);
 }
 const c=ctx.capture,creations=createItems(c);
 /* A query that names a room, section or action outright (a substring of its label) runs that command, even if it reads like a verb ("study") or has two words ("switch theme"). Otherwise a sentence, a token or a link is a capture. */
 const words=q.toLowerCase().split(/\s+/).filter(Boolean);
 const strongNav=navHits.some(h=>h.score>=1000||(q.length>=3&&words.every(w=>(h.key||h.label).toLowerCase().includes(w))));
 const createFirst=!strongNav&&!!c&&c.ok&&(c.kind!=='note'||/\s/.test(q)||/[#!]/.test(q)||c.warnings?.length);
 const ordered=createFirst?[...creations,...navHits,...records]:[...navHits,...records,...creations];
 const seen=new Set();
 return ordered.filter(x=>{const k=x.group+'|'+x.label+'|'+JSON.stringify(x.run);if(seen.has(k))return false;seen.add(k);return true}).slice(0,30).map((x,i)=>({...x,id:'i'+i,idx:x.idx||[]}));
}

/* ---------- DOM ---------- */
let host=null,ui=null;
const isTyping=t=>!!t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||''));
const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
function context(query){
 const st=host.state(),c=host.careerUi?.()||{};
 const ctx={tasks:[...st.tasks].sort((a,b)=>(a.status==='done')-(b.status==='done')),spaces:st.spaces,boards:st.boards,links:st.links,
  people:c.ready?c.people:[],companies:c.ready?c.companies:[],spaceName:id=>host.spaceName(id),statusName:s=>host.statusName(s)};
 ctx.capture=query.trim()?root.SELFCapture.parseCapture(query,{today:host.today(),spaces:st.spaces}):null;
 return ctx;
}
function paint(){
 const {input,list,chips,live}=ui;
 ui.items=buildItems(context(input.value),input.value);
 if(ui.active>=ui.items.length)ui.active=Math.max(0,ui.items.length-1);
 list.textContent='';let lastGroup=null;
 ui.items.forEach((it,i)=>{
  if(it.group!==lastGroup){lastGroup=it.group;const g=el('li','pal-group',it.group);g.setAttribute('role','presentation');list.appendChild(g)}
  const li=el('li','pal-item');li.id='pal-opt-'+i;li.setAttribute('role','option');li.setAttribute('aria-selected',String(i===ui.active));li.dataset.i=String(i);
  if(i===ui.active)li.classList.add('on');
  const label=el('span','pal-label');
  const mark=new Set(it.idx);let run='',on=false;
  const flush=()=>{if(!run)return;if(on){label.appendChild(el('mark',null,run))}else label.appendChild(doc.createTextNode(run));run=''};
  [...it.label].forEach((ch,k)=>{const m=mark.has(k);if(m!==on){flush();on=m}run+=ch});flush();
  li.appendChild(label);if(it.hint)li.appendChild(el('small','pal-hint',it.hint));
  list.appendChild(li);
 });
 if(!ui.items.length)list.appendChild(el('li','pal-empty','Nothing matches. Type a task to create it.'));
 input.setAttribute('aria-activedescendant',ui.items.length?'pal-opt-'+ui.active:'');
 const cap=context(input.value).capture;
 chips.textContent='';
 if(cap?.ok)cap.chips.forEach((c,i)=>{const s=el('span','pal-chip',c.label);s.dataset.k=c.k;if(!reduced())s.style.animationDelay=i*30+'ms';chips.appendChild(s)});
 live.textContent=ui.items.length?ui.items.length+(ui.items.length===1?' result':' results'):'No results';
 list.querySelector('.on')?.scrollIntoView?.({block:'nearest'});
}
function open(){
 if(ui||!host?.enabled()||!host.state().user)return;
 const box=el('div','pal-box'),wrap=el('div','pal');wrap.id='pal';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Command palette');
 const field=el('div','pal-field');
 const input=el('input','pal-input');input.id='pal-input';input.type='text';input.placeholder='Jump, find or create…  try: Kirim CV besok #Career !high';input.autocomplete='off';input.spellcheck=false;
 input.setAttribute('role','combobox');input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls','pal-list');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-label','Command');input.maxLength=300;
 field.appendChild(input);
 const chips=el('div','pal-chips');chips.setAttribute('aria-hidden','true');
 const list=el('ul','pal-list');list.id='pal-list';list.setAttribute('role','listbox');list.setAttribute('aria-label','Results');
 const foot=el('div','pal-foot','↑ ↓ move   ↵ choose   esc close');
 const live=el('div','sr-only');live.setAttribute('aria-live','polite');live.setAttribute('role','status');
 box.append(field,chips,list,foot,live);wrap.appendChild(box);doc.body.appendChild(wrap);
 ui={wrap,input,list,chips,live,items:[],active:0,prev:doc.activeElement};
 input.addEventListener('input',()=>{ui.active=0;paint()});
 wrap.addEventListener('mousedown',e=>{if(e.target===wrap){close();return}if(e.target.closest('.pal-item'))e.preventDefault()});
 list.addEventListener('mousemove',e=>{const li=e.target.closest('.pal-item');if(li&&+li.dataset.i!==ui.active){ui.active=+li.dataset.i;sync()}});
 list.addEventListener('click',e=>{const li=e.target.closest('.pal-item');if(li)run(ui.items[+li.dataset.i])});
 paint();input.focus();
}
function sync(){
 ui.list.querySelectorAll('.pal-item').forEach(li=>{const on=+li.dataset.i===ui.active;li.classList.toggle('on',on);li.setAttribute('aria-selected',String(on))});
 ui.input.setAttribute('aria-activedescendant','pal-opt-'+ui.active);ui.list.querySelector('.on')?.scrollIntoView?.({block:'nearest'});
}
function close(){
 if(!ui)return;const {wrap,prev}=ui;ui=null;wrap.remove();
 if(prev&&prev.isConnected&&prev!==doc.body)prev.focus?.({preventScroll:true});
}
async function run(item){
 if(!item)return;
 close();
 const r=item.run;
 if(r.type==='room')return host.goRoom(r.room);
 if(r.type==='view')return host.go(r.view);
 if(r.type==='career')return host.careerPage(r.page);
 if(r.type==='task')return host.openTask(r.id);
 if(r.type==='space')return host.openSpace(r.id);
 if(r.type==='board')return host.openBoard(r.id);
 if(r.type==='theme')return host.toggleTheme();
 if(r.type==='link'){root.open?.(r.url,'_blank','noopener,noreferrer');return}
 if(r.type==='create-space'){const name=r.name.charAt(0).toUpperCase()+r.name.slice(1,80);return host.mutate(async()=>{await host.insert('spaces',{name})},'Space “'+name+'” created. Run your capture again to file it there.')}
 if(r.type==='create')return create(r.capture);
}
function create(c){
 const warn=(c.warnings||[]).find(w=>w.type==='unknown-space'||w.type==='ambiguous-space');
 const tail=warn?' · no Space named “'+warn.name+'”, so it is unfiled':'';
 const put=(table,rec,msg)=>host.mutate(async()=>{await host.insert(table,rec)},msg+tail);
 const space=c.spaceId?{space_id:c.spaceId}:{};
 if(c.kind==='task'){
  const rec={title:c.title,...space};if(c.description)rec.description=c.description;if(c.priority)rec.priority=c.priority;if(c.dueDate)rec.due_date=c.dueDate;
  return put('tasks',rec,'Task created');
 }
 if(c.kind==='link')return put('inbox',{title:c.title,body:c.url,kind:'link',...space},'Link saved');
 return put('inbox',{title:c.title,body:c.description||'',kind:'note',...space},'Note captured');
}
function onKey(e){
 if(!host?.enabled()||!host.state().user)return;
 const mod=e.ctrlKey||e.metaKey;
 if(mod&&!e.altKey&&String(e.key).toLowerCase()==='k'){e.preventDefault();e.stopPropagation();ui?close():open();return}
 if(!ui){
  if(e.key==='/'&&!mod&&!e.altKey&&!isTyping(e.target)){e.preventDefault();open()}
  return;
 }
 /* the palette owns the keyboard while it is open */
 e.stopPropagation();
 if(e.key==='Escape'){e.preventDefault();close();return}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=ui.items.length;if(n){ui.active=(ui.active+(e.key==='ArrowDown'?1:-1)+n)%n;sync()}return}
 if(e.key==='Enter'){e.preventDefault();run(ui.items[ui.active]);return}
 if(e.key==='Tab'){e.preventDefault();return}
}
function init(h){
 host=h;
 if(doc)doc.addEventListener('keydown',onKey,true);
}
const api={init,open,close,toggle:()=>ui?close():open(),isOpen:()=>!!ui,fuzzy,rank,buildItems,createItems};
root.SELFPalette=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
