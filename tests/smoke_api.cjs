const fs=require('fs'),vm=require('vm');
const id='11111111-1111-4111-8111-111111111111';
const store={spaces:[],tasks:[],task_checklist:[],task_pages:[],task_links:[],inbox:[],preferences:[]};
let counter=0;let html='';let current=0;
const storage=new Map([['self.session',JSON.stringify({access_token:'dummy',refresh_token:'refresh',user:{id,email:'qa@test.local'}})]]);
function reply(status,data){return Promise.resolve({ok:status>=200&&status<300,status,statusText:String(status),text:async()=>data===null?'':JSON.stringify(data),json:async()=>data});}
function mockFetch(uri,options={}){
 const u=new URL(uri),method=options.method||'GET';
 if(u.pathname==='/auth/v1/user')return reply(200,{id,email:'qa@test.local'});
 if(u.pathname.startsWith('/rest/v1/')){
  const table=u.pathname.split('/').at(-1),body=options.body?JSON.parse(options.body):null;
  if(!(table in store))return reply(404,{message:'unknown table '+table});
  if(method==='GET')return reply(200,table==='preferences'?[...store[table]]:[...store[table]]);
  if(method==='POST'){
   if(table==='preferences') {store.preferences=[body];return reply(201,null)}
   const obj={id:'00000000-0000-4000-8000-'+String(++counter).padStart(12,'0'),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...body};store[table].push(obj);return reply(201,[obj]);
  }
  if(method==='PATCH'){
   const target=u.searchParams.get('id')?.replace('eq.','');const obj=store[table].find(x=>x.id===target);if(obj)Object.assign(obj,body);return reply(200,obj?[obj]:[])
  }
  if(method==='DELETE'){
   const target=u.searchParams.get('id')?.replace('eq.','');store[table]=store[table].filter(x=>x.id!==target);return reply(204,null)
  }
 }
 return reply(404,{message:'unexpected URL '+uri});
}
const doc={documentElement:{style:{setProperty(){}}},body:{dataset:{}},querySelector(s){if(s==='#app')return {set innerHTML(v){html=v}};return null},addEventListener(){},createElement(){return {className:'',innerHTML:'',remove(){}}}};
const ctx={console,URL,Date,setTimeout,clearTimeout,fetch:mockFetch,document:doc,window:{scrollTo(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},confirm:()=>true};vm.createContext(ctx);
(async()=>{
 vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'),ctx);
 await new Promise(res=>setTimeout(res,70));
 console.log('init',html.includes('Your day, in focus.'),'tables',Object.keys(store).length);
 await vm.runInContext('insert("spaces",{name:"Finance",icon:"chart",accent:"blue"})',ctx);
 await vm.runInContext(`insert("tasks",{title:"Review DSSA",space_id:"${store.spaces[0].id}",status:"todo",priority:"high"})`,ctx);
 vm.runInContext('state.spaces='+JSON.stringify(store.spaces)+';state.tasks='+JSON.stringify(store.tasks)+';',ctx);
 await vm.runInContext(`patch("tasks","${store.tasks[0].id}",{status:"planning"})`,ctx);
 await vm.runInContext(`autoCaptureLinks("${store.tasks[0].id}","Data https://docs.google.com/spreadsheets/d/test and https://example.org/")`,ctx);
 await vm.runInContext('savePref()',ctx);
 console.log('status',store.tasks[0].status,'links',store.task_links.length,'theme',store.preferences[0].theme);
 await vm.runInContext(`del("tasks","${store.tasks[0].id}")`,ctx);
 console.log('deleted',store.tasks.length===0,'db calls',counter);
 if(!(html.includes('Your day, in focus.')&&store.task_links.length===2&&store.preferences[0].theme==='dark'&&store.tasks.length===0))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
