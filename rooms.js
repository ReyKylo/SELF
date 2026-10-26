/* SELF Rooms shell: five rooms (Today, Work, Hunt, Study, Studio) on top of the existing state.view router.
   Pure helpers (roomOf, badges, subnav) are unit-tested without a DOM in tests/smoke_rooms.cjs.
   Badges are computed only from loaded state; an unknown or zero value shows no badge. */
(function(root){
'use strict';
const ROOMS=[
 {id:'today',label:'Today',icon:'sun',view:'home'},
 {id:'work',label:'Work',icon:'kanban',view:'work'},
 {id:'hunt',label:'Hunt',icon:'target',view:'career'},
 {id:'study',label:'Study',icon:'graduation',view:'career'},
 {id:'studio',label:'Studio',icon:'board',view:'boards'}
];
const WORK_PAGES=[['work','Tasks'],['spaces','Spaces'],['links','Links'],['inbox','Inbox']];
const WEEK=7*24*3600*1000;

function roomOf(view,careerPage){
 if(view==='career')return careerPage==='learning'?'study':'hunt';
 return {home:'today',work:'work',spaces:'work',space:'work',links:'work',inbox:'work',boards:'studio','board-editor':'studio'}[view]||null;
}
function badges(ctx){
 const tasks=Array.isArray(ctx.tasks)?ctx.tasks:[],day=ctx.today||'';
 const open=tasks.filter(t=>t.status!=='done');
 const due=open.filter(t=>t.due_date&&t.due_date<=day).length;
 const now=ctx.now??Date.now();
 const soon=(Array.isArray(ctx.interviews)?ctx.interviews:[]).filter(i=>{
  if(i.stage!=='scheduled'||!i.scheduled_at)return false;
  const at=Date.parse(i.scheduled_at);return Number.isFinite(at)&&at>=now&&at<=now+WEEK}).length;
 const boards=Array.isArray(ctx.boards)?ctx.boards.length:0;
 const make=(n,text,aria)=>n>0?{n,text,aria}:null,pl=(n,one,many)=>n+' '+(n===1?one:many);
 return {
  today:make(due,due+' due',pl(due,'task','tasks')+' due today or overdue'),
  work:make(open.length,open.length+' open',pl(open.length,'open task','open tasks')),
  hunt:make(soon,soon+' intvw',pl(soon,'interview','interviews')+' in the next 7 days'),
  study:null,
  studio:make(boards,pl(boards,'board','boards'),pl(boards,'board','boards'))
 };
}
function doorMarkup(room,active,badge,ic,esc){
 return '<button type="button" class="door" data-action="nav" data-view="'+room.view+'" data-room="'+room.id+'" style="--c:var(--room-'+room.id+')" aria-current="'+(active?'page':'false')+'"'+
  ' aria-label="'+esc(room.label+(badge?' ('+badge.aria+')':''))+'">'+ic(room.icon,24)+'<span>'+esc(room.label)+'</span><small>'+(badge?esc(badge.text):'')+'</small></button>';
}
function doors(ctx){
 const active=roomOf(ctx.view,ctx.careerPage),b=badges(ctx);
 return '<span class="rail-ind" aria-hidden="true"></span>'+ROOMS.map(r=>doorMarkup(r,r.id===active,b[r.id],ctx.ic,ctx.esc)).join('');
}
function sidebar(ctx,brand,foot){
 return '<aside class="sidebar rooms-rail" aria-label="SELF navigation">'+brand+'<nav class="nav-items" aria-label="Rooms">'+doors(ctx)+'</nav>'+foot+'</aside>';
}
function bar(ctx){
 return '<div class="mobile-nav rooms-bar" role="navigation" aria-label="Rooms">'+doors(ctx)+'</div>';
}
function subnav(ctx){
 if(roomOf(ctx.view,ctx.careerPage)!=='work')return '';
 const current=ctx.view==='space'?'spaces':ctx.view;
 return '<nav class="rooms-subnav" aria-label="Work sections">'+WORK_PAGES.map(([v,label])=>
  '<button type="button" data-action="nav" data-view="'+v+'" aria-current="'+(current===v?'page':'false')+'">'+ctx.esc(label)+'</button>').join('')+'</nav>';
}
/* Career has its own page state; the Hunt and Study doors both open it on the right side of the split. */
function alignCareer(room){
 const c=root.SELFCareer;if(!c?.ui||typeof c.setPage!=='function')return;
 if(room==='study'&&c.ui.page!=='learning')c.setPage('learning');
 else if(room==='hunt'&&c.ui.page==='learning')c.setPage('tracker');
}

/* ---- post-render: slide the indicator and glide the tint from the previous room ---- */
const last={room:null,rail:null,bar:null};
const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function place(container,key,horizontal){
 const ind=container.querySelector('.rail-ind'),active=container.querySelector('.door[aria-current="page"]');
 if(!ind)return;
 if(!active||!container.getClientRects().length){ind.style.opacity='0';return} // hidden by CSS (display:none): nothing to place
 ind.style.opacity='';
 const target=horizontal?'translateX('+active.offsetLeft+'px)':'translateY('+active.offsetTop+'px)';
 if(horizontal)ind.style.width=active.offsetWidth+'px';else ind.style.height=active.offsetHeight+'px';
 if(last[key]&&last[key]!==target&&!reduced()){
  ind.style.transition='none';ind.style.transform=last[key];void ind.offsetWidth;ind.style.transition='';
 }
 ind.style.transform=target;last[key]=target;
}
function afterRender(){
 const doc=root.document;if(!doc)return;
 const shell=doc.querySelector('.shell[data-shell="rooms"]');if(!shell)return;
 const rail=shell.querySelector('.rooms-rail .nav-items'),bar=shell.querySelector('.rooms-bar');
 if(rail)place(rail,'rail',false);
 if(bar)place(bar,'bar',true);
 const room=shell.dataset.room;
 if(room&&last.room&&last.room!==room&&!reduced()){
  shell.style.setProperty('--tint','var(--room-'+last.room+')');void shell.offsetWidth;shell.style.removeProperty('--tint');
 }
 if(room)last.room=room;
}
/* Alt+1..5 switches rooms, except while typing. Returns the room id or null. */
function roomForKey(e){
 if(!e.altKey||e.ctrlKey||e.metaKey)return null;
 const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||'')))return null;
 const i=Number(e.key)-1;return Number.isInteger(i)&&i>=0&&i<ROOMS.length?ROOMS[i].id:null;
}
const api={ROOMS,WORK_PAGES,roomOf,badges,sidebar,bar,subnav,alignCareer,afterRender,roomForKey};
root.SELFRooms=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
