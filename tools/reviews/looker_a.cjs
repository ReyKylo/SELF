/* Independent Looker A automated CI review. Does not run local UI automation.
 * Source grounding: V1 orientation, V5 gallery anatomy, V3 filter context,
 * I4 empty guidance, I7 record hierarchy. No continuous-motion signoff.
 */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=process.env.LOOKER_A_OUT||'artifacts/looker-a';
const url=process.env.SELF_REVIEW_URL||'http://127.0.0.1:4173';
const types=['companies','opportunities','contacts','tasks','goals','learning','resources','journals','templates','events','inbox','boards','ideas','links'];
function snapshot(populated){
 const data=Object.fromEntries(types.map(t=>[t,[]]));
 if(populated){
  for(let i=0;i<7;i++)data.boards.push({id:`sample-board-${i}`,title:`Sample workspace ${i+1}`,kind:'project',createdAt:'2026-10-11T01:00:00Z'});
  data.tasks=[{id:'sample-task',title:'Sample: prepare a concise investment memo and review source assumptions',date:'2026-10-11',status:'Belum selesai',boardId:'sample-board-0',priority:'Normal'},{id:'sample-task-2',title:'Sample: completed reading',date:'2026-10-11',status:'Selesai'}];
  data.events=[{id:'sample-event',title:'Sample: Research conversation with a deliberately long title',start:'2026-10-11T10:00',end:'2026-10-11T11:00',location:'Sample online meeting'}];
  data.journals=[{id:'sample-journal',title:'Sample research notes with a longer title for readability inspection',date:'2026-10-11',body:'Sample content only. Distinguish the evidence from an assumption before making a decision.',bodyHtml:'<p>Sample content only.</p>',noteCollection:'Research',notePinned:true,updatedAt:'2026-10-11T01:00:00Z'}];
  data.ideas=[{id:'sample-card',title:'Sample hypothesis',body:'Sample card content for native-scale inspection.',boardId:'sample-board-0',x:100,y:80,width:260,height:200,tilt:0,kind:'note'}];
  data.goals=[{id:'sample-goal',title:'Sample: write one sourced memo',deadline:'2026-10-18',status:'Berjalan'}];
  data.companies=[{id:'sample-company',title:'Sample Research Company',sector:'Research',url:'https://example.com'}];
  data.opportunities=[{id:'sample-opportunity',title:'Sample analyst opportunity with a longer title',companyId:'sample-company',stage:'Dikirim',deadline:'2026-10-16',url:'https://example.com'}];
  data.contacts=[{id:'sample-contact',title:'Sample contact',companyId:'sample-company',connection:'Invitation pending',followup:'2026-10-11'}];
 }
 return {version:1,data,activity:populated?[{title:'Sample note created',date:'2026-10-11T01:00:00Z',type:'journals',id:'sample-journal'}]:[]};
}
const routes=[['today','.rv-home'],['career','.rv-focus-page'],['calendar','.rc5-page'],['journal','.rv-notes'],['desk','.rv-whiteboard']];
async function observations(page){return page.evaluate(()=>{
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const describe=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,160),tag:e.tagName,x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,color:s.color,background:s.backgroundColor,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}};
 return {page:document.body.dataset.page,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('main h1,main h2,.rv-page h1,.rc5-page h1')].filter(visible).map(describe),controls:[...document.querySelectorAll('main button,main input,main select,main textarea')].filter(visible).map(describe),nativeText:[...document.querySelectorAll('.rv-task-line button,.rv-workspace-detail strong,.rv-focus-item strong,.rc5-event strong,.rv-note-main-link strong,.desk-note h3')].filter(visible).map(describe),nav:[...document.querySelectorAll('#nav button')].map(describe),overflowCandidates:[...document.querySelectorAll('.rv-page button,.rc5-page button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2||r.left<0}).map(describe)};
 });}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const result={reviewer:'Looker A',build:process.env.GITHUB_SHA||'unspecified',evidence:'Automated remote Chromium runtime; not live normal-speed visual review',limits:['No continuous-motion judgement','No broad persistence/failure/performance signoff','Screenshots require independent visual inspection'],captures:[],defects:[],errors:[]};
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const populated of [false,true])for(const viewport of [{width:1366,height:768},{width:1440,height:900}]){
   const context=await browser.newContext({viewport,timezoneId:'Asia/Jakarta'});
   await context.addInitScript(({state})=>{localStorage.setItem('rey-workspace-v1',JSON.stringify(state));localStorage.setItem('rey-biu-hidden','1');const OriginalDate=Date;const fixed=OriginalDate.parse('2026-10-11T03:00:00Z');class FixedDate extends OriginalDate{constructor(...a){super(...(a.length?a:[fixed]))}static now(){return fixed}}window.Date=FixedDate;},{state:snapshot(populated)});
   await context.route('**/*',route=>{const requestURL=route.request().url();if(requestURL.startsWith(url)||requestURL.startsWith('data:')||requestURL.startsWith('blob:'))return route.continue();return route.abort();});
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
   const name=`${populated?'sample':'empty'}-${viewport.width}`;
   for(const [route,selector] of routes){
    try{
     await page.goto(`${url}/#${route}`,{waitUntil:'domcontentloaded'});
     await page.locator(selector).waitFor({state:'visible',timeout:15000});
     await page.screenshot({path:path.join(out,`${name}-${route}.png`),fullPage:true});
     const evidence=await observations(page);result.captures.push({fixture:populated?'Explicit synthetic sample':'Empty snapshot',route,...evidence});
     if(evidence.documentWidth>viewport.width+2)result.defects.push({severity:'major',route,name,issue:'Unintended document-level horizontal overflow',actual:evidence.documentWidth,expected:viewport.width,anchor:'V02'});
     if(evidence.overflowCandidates.length)result.defects.push({severity:'review',route,name,issue:'Controls outside viewport: inspect whether scoped canvas/table scrolling is intentional',controls:evidence.overflowCandidates,anchor:'V02/I04'});
     if(route==='today'&&populated){await page.locator('[data-rv="board-next"]').click();await page.locator('.rv-workspace-detail strong').filter({hasText:'Sample workspace 6'}).waitFor();await page.screenshot({path:path.join(out,`${name}-gallery-page2.png`),fullPage:true});}
     if(route==='journal'&&populated){await page.locator('[data-rv="notes-open"]').first().click();await page.locator('#writerBody').waitFor();await page.screenshot({path:path.join(out,`${name}-notes-editor.png`),fullPage:true});}
     if(route==='career'){await page.locator('[data-cr="tab"][data-id="pursue"]').first().click();await page.locator('.rx-career').waitFor();await page.screenshot({path:path.join(out,`${name}-career-opportunities.png`),fullPage:true});}
    }catch(e){result.defects.push({severity:'major',route,name,issue:'Review route or required interaction failed',error:e.message,anchor:'I01/V02'});}
   }
   await context.close();
  }
 }catch(e){result.blocked=e.message;process.exitCode=2;}finally{await browser?.close();if(!process.exitCode&&(result.errors.length||result.defects.some(d=>['major','blocker'].includes(d.severity))))process.exitCode=1;result.exitCode=process.exitCode||0;result.limits.push('External fonts blocked: screenshots evaluate fallback font, not downloaded DM Sans parity');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify({reviewer:result.reviewer,build:result.build,captures:result.captures.length,defects:result.defects,errors:result.errors,blocked:result.blocked||null}));
})();
