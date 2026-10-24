/* Every Lesson Loop v2 lesson in a real browser: all eight beats render from data, the waterfall builds and ties, the bridge uses Indonesian number format, watch segments follow
   the rules (publisher chapters get start/end, unchaptered video plays from the start), all four rungs can be solved with the lesson's own numbers, and Next up follows progress. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch}=require('./browser_learning_fixture.cjs');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/career-lessons-v2.json'),'utf8'));
const FORMULA={'PE-L02':'=B12-B10-B13','VC-L01':'=B5*12','VC-L02':'=B6+B7','CO-L01':'=C5*(C6-C7)','CO-L02':'=(B5-B6)*B7-B6*B8+B9-B10','PE-L01':'=C8-B8'};
(async()=>{
 const x=await launch();const {page,errors}=x;
 const txt=sel=>page.locator(sel).first().innerText();
 const noOverflow=async l=>{const d=await page.evaluate(()=>({s:document.documentElement.scrollWidth,v:innerWidth}));assert.ok(d.s<=d.v+1,l+' overflows '+JSON.stringify(d))};
 await x.enter();await page.locator('[data-learning="tab"][data-tab="masterclass"]').click();await page.locator('.ll').waitFor();

 /* Next up before anything is done */
 assert.match(await txt('.nextup'),/NEXT UP · PE · 1 dari 2/);assert.match(await txt('.nextup'),/Laba naik, tapi kas hilang\?/);assert.match(await txt('.nextup'),/Mulai dari sini di jalur PE/);assert.match(await txt('.nextup'),/0 dari 6 lesson/);
 assert.match(await txt('.nextup'),/NEXT UP/);

 for(const L of data.lessons){
  /* select the lesson from the list */
  await page.locator('[data-teaching-action="track"][data-id="'+L.track+'"]').click();
  await page.locator('[data-teaching-action="select"][data-id="'+L.id+'"]').click();await page.locator('.ll[data-lesson-root="'+L.id+'"]').waitFor();
  assert.equal(await page.locator('.ll-step').count(),8);assert.match(await txt('.ll-head h2'),new RegExp(L.title.replace(/[?]/g,'\\?')));
  /* 0 predict */
  await page.locator('.ll-option').nth(L.predict.answer_index===0?1:0).click();await page.locator('[data-lesson="next"]').click();
  /* 1 watch */
  const w=L.watch;assert.equal(await page.locator('.ll-prompts li').count(),3);await page.locator('[data-lesson="play"]').click();
  const src=await page.locator('.ll-player iframe').getAttribute('src');
  if(w.segment_basis){assert.ok(src.includes('start='+w.start)&&src.includes('end='+w.end),L.id+' iframe uses the publisher chapter range: '+src);assert.match(await txt('.ll-watch .ll-note'),/Segmen: /);assert.match(await txt('.ll-watch .ll-note'),/Belum ditonton dan diverifikasi manusia/)}
  else{assert.ok(!src.includes('start=')&&!src.includes('end='),L.id+' plays from the start: '+src);assert.match(await txt('.ll-watch .ll-note'),/Segmen belum diverifikasi/)}
  await page.locator('[data-lesson="next"]').click();
  /* 2 see it */
  await page.locator('[data-lesson="wf-all"]').click();assert.equal(await page.locator('.wf-bar').count(),L.see_it.steps.length,L.id+' bars');assert.match(await txt('.ll-ok'),/Jembatan cocok/);
  const labels=await page.locator('.wf-val').evaluateAll(n=>n.map(e=>e.textContent));assert.equal(labels.length,L.see_it.steps.length);assert.ok(labels.every(t=>!/\d\.\d/.test(t)||/\d\.\d{3}/.test(t)),L.id+' labels use Indonesian separators: '+labels);
  await page.locator('[data-lesson="wf-table"]').click();assert.equal(await page.locator('.wf-table tbody tr').count(),L.see_it.steps.length);await page.locator('[data-lesson="wf-table"]').click();
  await page.locator('[data-lesson="next"]').click();
  /* 3 pro layout */
  assert.equal(await page.locator('.bridge-table tbody tr').count(),L.pro_layout.rows.length+1,L.id+' rows and the check');
  await page.locator('.ll-callout').first().click();assert.ok(await page.locator('.bridge-table tr.is-hl').count()>=1);assert.equal(await page.locator('.ll-callouts a[href^="https://"]').count(),1);
  await page.locator('[data-lesson="next"]').click();
  /* 4 worked */
  for(let i=1;i<L.worked.steps.length;i++)await page.locator('[data-lesson="worked-next"]').click();assert.equal(await page.locator('.ll-steps-list li').count(),L.worked.steps.length);
  assert.ok((await page.locator('.ll-grid').first().innerText()).length>20);
  await page.locator('[data-lesson="next"]').click();
  /* 5 ladder: solve every rung with the lesson's own numbers */
  assert.equal(await page.locator('.ll-rung').count(),4);
  await page.locator('[data-lesson-input="complete"]').fill(String(L.ladder[0].expect.value));await page.keyboard.press('Enter');assert.match(await txt('.ll-fb'),/diketik/,L.id+' typed value on a linked rung is flagged');
  await page.locator('[data-lesson-input="complete"]').fill(FORMULA[L.id]);await page.keyboard.press('Enter');assert.match(await txt('.ll-fb.is-ok'),/Benar dan tertaut/,L.id+' complete');
  for(const k of ['independent','twist']){const r=L.ladder.find(q=>q.rung===k);
   await page.locator('[data-lesson-input="'+k+'"]').fill(String(r.misconceptions[0].value));await page.keyboard.press('Enter');
   assert.ok((await page.locator('.ll-rung',{has:page.locator('[data-lesson-input="'+k+'"]')}).locator('.ll-fb').innerText()).includes(r.misconceptions[0].feedback.slice(0,30)),L.id+' '+k+' misconception feedback');
   await page.locator('[data-lesson-input="'+k+'"]').fill(String(r.expect.value));await page.keyboard.press('Enter');}
  const rp=L.ladder.find(q=>q.rung==='red_pen');
  const other=rp.artefact.rows.find(r=>r.id!==rp.flaw_row&&r.id in rp.row_feedback);
  await page.locator('[data-lesson="pick-row"][data-id="'+other.id+'"]').click();assert.ok((await page.locator('.ll-rung').nth(3).locator('.ll-fb').innerText()).length>10);
  await page.locator('[data-lesson="pick-row"][data-id="'+rp.flaw_row+'"]').click();assert.ok((await page.locator('.ll-rung').nth(3).innerText()).includes(rp.found_feedback.slice(0,25)));
  await page.locator('[data-lesson-input="red_pen"]').fill(String(rp.expect.value));await page.keyboard.press('Enter');
  assert.equal(await page.locator('.ll-rung.is-ok').count(),4,L.id+' all rungs solved');
  assert.match(await page.locator('.ll-beat > .ll-note').last().innerText(),/4 dari 4 rung selesai/);
  await page.locator('[data-lesson="next"]').click();
  /* 6 defend, 7 lock in */
  await page.locator('[data-lesson="defend-show"]').click();assert.equal(await page.locator('.ll-points li').count(),3);await page.locator('[data-lesson="next"]').click();
  assert.equal(await page.locator('.ll-card').count(),3);await page.locator('[data-lesson="cards"]').click();await page.locator('[data-lesson="next"]').click();
  assert.match(await page.locator('.ll-ok').last().innerText(),/Lesson ditandai selesai/);
  await noOverflow(L.id);
  /* Next up reflects progress */
  const done=data.lessons.findIndex(q=>q.id===L.id)+1;assert.match(await txt('.nextup'),new RegExp(done===data.lessons.length?'Semua lesson baru selesai':done+' dari '+data.lessons.length+' lesson'),L.id+' next up after completing');
 }
 /* the cards from all six lessons are in the review queue, once each */
 const deck=await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('self.review.v1.'));return JSON.parse(localStorage.getItem(k))});
 assert.equal(deck.length,18);assert.equal(new Set(deck.map(c=>c.id)).size,18);assert.deepEqual([...new Set(deck.map(c=>c.source))].sort(),data.lessons.map(l=>l.id).sort());

 /* Next up opens the right lesson: reset one lesson's progress and use the button */
 await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('self.lesson.v2.')&&k.endsWith('.VC-L02'))localStorage.removeItem(k)});
 await page.reload();await x.enter().catch(()=>{});await page.locator('[data-learning="tab"][data-tab="masterclass"]').click();await page.locator('.nextup').waitFor();
 assert.match(await txt('.nextup'),/VC-?.*Pelanggan lama bertahan atau belanja lebih\?/s);assert.match(await txt('.nextup'),/NEXT UP · VC · 2 dari 2/);
 await page.locator('[data-nextup="go"]').click();await page.locator('.ll[data-lesson-root="VC-L02"]').waitFor();assert.match(await txt('.ll-head h2'),/Pelanggan lama bertahan/);

 /* phone, 150% text */
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});
 for(const id of ['CO-L01','CO-L02','PE-L02']){await page.locator('[data-teaching-action="track"][data-id="'+(id.startsWith('PE')?'PE':'Consulting')+'"]').click();await page.locator('[data-teaching-action="select"][data-id="'+id+'"]').click();await page.locator('.ll').waitFor();
  for(const b of [2,3,4,5]){await page.locator('[data-lesson="beat"][data-n="'+b+'"]').click();await noOverflow(id+' beat '+b)}}
 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Lessons browser: six lessons through all eight beats, honest video segments, Indonesian number format, every rung solvable, cards queued, Next up, 390px at 150%.');
})().catch(e=>{console.error(e);process.exit(1)});
