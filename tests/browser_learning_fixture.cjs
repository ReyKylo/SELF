/* Local-only synthetic API fixture for independent browser review; never used by production. */
const path=require('node:path'),http=require('node:http'),fs=require('node:fs');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const BASE=process.env.SELF_QA_URL||'http://127.0.0.1:8080';
async function launch(options={}){
 const server=http.createServer((req,res)=>{let relative;try{relative=decodeURIComponent(new URL(req.url,'http://fixture').pathname).replace(/^\//,'')||'index.html'}catch{res.writeHead(400).end();return}
  const file=path.resolve(__dirname,'..',relative),root=path.resolve(__dirname,'..');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/markdown'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(data)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const localBase='http://127.0.0.1:'+server.address().port;
 const legacyBrowser='/tmp/self-browser/chrome-headless-shell-linux64/chrome-headless-shell';
 const browserPath=process.env.SELF_QA_CHROMIUM||(fs.existsSync(legacyBrowser)?legacyBrowser:null);
 const browser=await chromium.launch({headless:true,...(browserPath?{executablePath:browserPath}:{}),args:['--no-sandbox']});
 const originalClose=browser.close.bind(browser);browser.close=async()=>{await originalClose();await new Promise(r=>server.close(r))};
 const context=await browser.newContext({viewport:options.viewport||{width:1366,height:768},reducedMotion:'reduce'});
 const fixture={user:{id:'5cd5464c-9879-492d-8e74-b34f99ad15bb',email:'synthetic-qa@example.invalid'},tasks:[],failCareer:false,failTasks:false,dropAck:false,postCount:0,delay:0,contentFail:false};
 await context.addInitScript(id=>{window.__SELF_CAREER_OWNERS=[id]},fixture.user.id);
 await context.addInitScript(()=>localStorage.setItem('self.session',JSON.stringify({access_token:'synthetic-local-test-token',refresh_token:'synthetic-local-refresh-token'})));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 await context.route('**/content/career-learning.json',async route=>{if(fixture.contentFail)return route.fulfill({status:503,body:'Fixture content failure'});return route.continue()});
 await context.route('https://btiwxqjiptbwaunjibjh.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),method=req.method(),table=url.pathname.split('/').pop();
  const json=(obj,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(obj)});
  if(url.pathname==='/auth/v1/user')return json(fixture.user);
  if(url.pathname.startsWith('/auth/v1/'))return json({message:'Synthetic fixture does not sign into real accounts'},403);
  if(!url.pathname.startsWith('/rest/v1/'))return json({message:'Unsupported synthetic fixture endpoint'},400);
  if(fixture.failCareer&&table.startsWith('career_'))return json({message:'Synthetic Career service unavailable'},503);
  if(table==='tasks'){
   if(fixture.failTasks)return json({message:'Synthetic Task service unavailable'},503);
   if(fixture.delay)await new Promise(r=>setTimeout(r,fixture.delay));
   if(method==='GET'){const id=url.searchParams.get('id')?.slice(3);return json(fixture.tasks.filter(t=>t.user_id===fixture.user.id&&(!id||t.id===id)))}
   if(method==='POST'){
    fixture.postCount++;const row=req.postDataJSON();if(fixture.tasks.some(t=>t.id===row.id))return json({message:'duplicate key'},409);
    fixture.tasks.push({...row,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
    if(fixture.dropAck){fixture.dropAck=false;return route.abort('failed')}
    return json([fixture.tasks.at(-1)],201);
   }
   if(method==='PATCH'){const id=url.searchParams.get('id')?.slice(3),row=fixture.tasks.find(t=>t.id===id);if(!row)return json([]);Object.assign(row,req.postDataJSON());return json([row])}
  }
  if(method==='GET')return json([]);
  return json({message:'Synthetic fixture disallows this write'},403);
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function enter(){
  await page.goto(localBase);await page.locator('[data-action="nav"][data-view="career"]:visible').first().click();
  await page.locator('[data-career="page"][data-page="learning"]:visible').first().click();
  await page.locator('.learning-sprint-intro').waitFor();
 }
 return {browser,context,page,fixture,errors,enter,base:localBase};
}
module.exports={launch,BASE};
