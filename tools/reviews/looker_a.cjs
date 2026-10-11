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
async function settle(page){
 // Wait for finite entrance animations rather than suppressing product motion.
 await page.evaluate(async()=>{const finite=document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime));await Promise.race([Promise.allSettled(finite.map(a=>a.finished)),new Promise(r=>setTimeout(r,1500))]);});
 await page.waitForTimeout(150); // One documented stabilization margin after entrance.
 return page.evaluate(()=>[...document.querySelectorAll('main,.rv-page,.rc5-page')].map(e=>{let p=e;const ancestors=[];while(p){const s=getComputedStyle(p);ancestors.push({tag:p.tagName,class:p.className,opacity:s.opacity,animation:s.animationName});p=p.parentElement;}return {selector:e.className,ancestors};}));
}
async function observations(page){return page.evaluate(()=>{
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const describe=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,160),tag:e.tagName,x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,color:s.color,background:s.backgroundColor,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}};
 return {page:document.body.dataset.page,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('main h1,main h2,.rv-page h1,.rc5-page h1')].filter(visible).map(describe),controls:[...document.querySelectorAll('main button,main input,main select,main textarea')].filter(visible).map(describe),nativeText:[...document.querySelectorAll('.rv-task-line button,.rv-workspace-detail strong,.rv-focus-item strong,.rc5-event strong,.rv-note-main-link strong,.desk-note h3')].filter(visible).map(describe),nav:[...document.querySelectorAll('#nav button')].map(describe),overflowCandidates:[...document.querySelectorAll('.rv-page button,.rc5-page button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+2||r.left<0}).map(describe)};
 });}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const result={reviewer:'Looker A',build:process.env.GITHUB_SHA||'unspecified',evidence:'Automated remote Chromium runtime; not live normal-speed visual review',settling:'Finite animation finished promises with 1500ms ceiling, followed by 150ms stabilization',limits:['No continuous-motion judgement','No broad persistence/failure/performance signoff','Screenshots require independent visual inspection'],captures:[],interactions:[],defects:[],errors:[]};
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
     const opacity=await settle(page);
     await page.screenshot({path:path.join(out,`${name}-${route}.png`),fullPage:true});
     const evidence=await observations(page);result.captures.push({fixture:populated?'Explicit synthetic sample':'Empty snapshot',route,opacity,...evidence});
     if(evidence.documentWidth>viewport.width+2)result.defects.push({severity:'major',route,name,issue:'Unintended document-level horizontal overflow',actual:evidence.documentWidth,expected:viewport.width,anchor:'V02'});
     if(evidence.overflowCandidates.length)result.defects.push({severity:'review',route,name,issue:'Controls outside viewport: inspect whether scoped canvas/table scrolling is intentional',controls:evidence.overflowCandidates,anchor:'V02/I04'});
     if(route==='today'&&populated){await page.locator('[data-rv="board-next"]').click();await page.locator('.rv-workspace-detail strong').filter({hasText:'Sample workspace 6'}).waitFor();await page.screenshot({path:path.join(out,`${name}-gallery-page2.png`),fullPage:true});}
     if(route==='journal'&&populated){await page.locator('[data-rv="notes-open"]').first().click();await page.locator('#writerBody').waitFor();await page.screenshot({path:path.join(out,`${name}-notes-editor.png`),fullPage:true});}
     if(route==='career'){await page.locator('[data-cr="tab"][data-id="pursue"]').first().click();await page.locator('.rx-career').waitFor();await page.screenshot({path:path.join(out,`${name}-career-opportunities.png`),fullPage:true});}
     if(route==='calendar'&&populated){
      const scroll=page.locator('.rc5-time-scroll');
      const geometry=await scroll.evaluate(el=>{const before=el.scrollLeft;el.scrollLeft=el.scrollWidth;return {before,after:el.scrollLeft,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,overflowX:getComputedStyle(el).overflowX};});
      const event=page.locator('[data-cal-event="sample-event"]');
      await event.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${name}-calendar-sunday.png`),fullPage:true});
      await event.click();await page.locator('#detail[open] h2').filter({hasText:'Sample: Research conversation with a deliberately long title'}).waitFor();
      await page.screenshot({path:path.join(out,`${name}-calendar-detail.png`),fullPage:true});
      result.interactions.push({name,route,check:'A4 scoped calendar scroll and complete event identity',geometry,detail:await page.locator('#detail[open] h2').innerText(),result:'PASS'});
      await page.keyboard.press('Escape');
     }
     if(route==='desk'&&populated){
      const strip=page.locator('.desk-board-strip');
      const geometry=await strip.evaluate(el=>{el.scrollLeft=el.scrollWidth;return {after:el.scrollLeft,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,overflowX:getComputedStyle(el).overflowX};});
      const later=strip.locator('.board-tab').filter({hasText:'Sample workspace 6'});await later.focus();
      await page.keyboard.press('Tab');const next=await page.evaluate(()=>document.activeElement.textContent.trim());
      if(!next.includes('Sample workspace 7'))throw Error('Desk keyboard traversal did not reach seventh board');
      await page.keyboard.press('Tab');const newSpace=await page.evaluate(()=>document.activeElement.textContent.trim());
      if(!newSpace.includes('Ruang baru'))throw Error('Desk keyboard traversal did not reach new-space control');
      await page.screenshot({path:path.join(out,`${name}-desk-strip-keyboard.png`),fullPage:true});
      result.interactions.push({name,route,check:'A7 later boards and new-space keyboard traversal',geometry,next,newSpace,result:'PASS'});
     }
    }catch(e){result.defects.push({severity:'major',route,name,issue:'Review route or required interaction failed',error:e.message,anchor:'I01/V02'});}
   }
   await context.close();
  }
 }catch(e){result.blocked=e.message;process.exitCode=2;}finally{await browser?.close();if(!process.exitCode&&(result.errors.length||result.defects.some(d=>['major','blocker'].includes(d.severity))))process.exitCode=1;result.exitCode=process.exitCode||0;result.limits.push('External fonts blocked: screenshots evaluate fallback font, not downloaded DM Sans parity');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify({reviewer:result.reviewer,build:result.build,captures:result.captures.length,defects:result.defects,errors:result.errors,blocked:result.blocked||null}));
})();
