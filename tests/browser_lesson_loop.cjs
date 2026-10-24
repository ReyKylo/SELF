/* Lesson Loop v2 for PE-L01 in a real browser: all eight beats, honest unverified video, waterfall that ties out, bridge callouts, worked grid, the four-rung ladder
   (hard-code detection, misconception feedback, hints, red pen), defend, lock in, Daily Drill in Today, persistence, 390px at 150% text. */
const assert=require('node:assert/strict');
const {launch}=require('./browser_learning_fixture.cjs');
(async()=>{
 const x=await launch();const {page,errors}=x;
 const noOverflow=async label=>{const d=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(d.scroll<=d.viewport+1,label+' overflows: '+JSON.stringify(d))};
 const txt=sel=>page.locator(sel).first().innerText();
 const next=async()=>{await page.locator('[data-lesson="next"]').click()};
 const beat=async()=>page.locator('.ll-step.is-current').innerText();
 await x.enter();
 await page.locator('[data-learning="tab"][data-tab="masterclass"]').click();
 await page.locator('.ll').waitFor();
 assert.equal(await page.locator('.ll-step').count(),8);assert.match(await txt('.ll-head h2'),/Laba naik, tapi kas hilang/);
 assert.match(await txt('.ll-head'),/LESSON LOOP · PE · PE-01, PE-05/);

 /* 0 Tebak */
 assert.match(await beat(),/Tebak/);assert.match(await txt('.ll-note'),/Belum memilih/);
 await page.locator('.ll-option').nth(1).click();assert.equal(await page.locator('.ll-option.is-picked').count(),1);assert.match(await txt('.ll-note'),/Tebakan tersimpan/);
 await next();

 /* 1 Tonton: honest about the unverified segment; play from the start with no invented timestamps */
 assert.match(await beat(),/Tonton/);assert.equal(await page.locator('.ll-prompts li').count(),3);
 assert.match(await txt('.ll-watch'),/Segmen belum diverifikasi/);assert.match(await txt('.ll-poster'),/LBO Model Tutorial: Cash Flow Statement and Debt Schedule/);
 assert.equal(await page.locator('.ll-watch a[href^="https://www.youtube.com/watch?v=szoolY6OwPQ"]').count(),1);
 await page.locator('[data-lesson="play"]').click();const src=await page.locator('.ll-player iframe').getAttribute('src');
 assert.match(src,/^https:\/\/www\.youtube-nocookie\.com\/embed\/szoolY6OwPQ\?rel=0$/,'no start or end is invented: '+src);
 await next();

 /* 2 Lihat: the waterfall builds bar by bar, subtotals tie out */
 assert.match(await beat(),/Lihat/);assert.equal(await page.locator('.wf-bar').count(),0);
 await page.locator('[data-lesson="wf-next"]').click();assert.equal(await page.locator('.wf-bar').count(),1);assert.match(await txt('.ll-term'),/^EBITDA$/);
 for(let i=0;i<3;i++)await page.locator('[data-lesson="wf-next"]').click();
 assert.match(await txt('.ll-term'),/Operating Net Working Capital/);assert.equal(await page.locator('.ll-parts tr').count(),4,'three parts and a total');
 assert.match(await txt('.ll-parts'),/Piutang usaha\s+50 → 75\s+−25/);assert.match(await txt('.ll-parts'),/Utang usaha\s+35 → 45 \(sumber kas\)\s+\+10/);assert.match(await txt('.ll-parts'),/Total\s+−37/);
 assert.match(await txt('.ll-limit'),/Rp16 miliar dari piutang Rp75 miliar/);
 await page.locator('[data-lesson="wf-all"]').click();assert.equal(await page.locator('.wf-bar').count(),9);
 assert.deepEqual(await page.locator('.wf-val').evaluateAll(n=>n.map(e=>e.textContent)),['39','−6','−5.5','−37','−9.5','−13','−22.5','+23','0.5']);
 assert.match(await txt('.ll-ok'),/Jembatan cocok/);assert.match(await page.locator('svg.wf desc').evaluate(e=>e.textContent),/CFO −9.5 Rp miliar/);
 if(process.env.LESSON_SHOT)await page.screenshot({path:process.env.LESSON_SHOT+'-see.png'});
 await page.locator('[data-lesson="wf-table"]').click();assert.equal(await page.locator('.wf-table tbody tr').count(),9);assert.equal(await page.locator('svg.wf').count(),0);
 await page.locator('[data-lesson="wf-table"]').click();
 await page.locator('[data-lesson="wf-back"]').click();assert.equal(await page.locator('.wf-bar').count(),8);
 await next();

 /* 3 Format pro */
 assert.match(await beat(),/Format pro/);assert.equal(await page.locator('.bridge-table tbody tr').count(),10,'nine rows and the check row');
 assert.match(await txt('.bridge-table'),/\(37\.0\)/);assert.match(await txt('.is-check'),/13\.54 − 13\.04 − 0\.50 = 0\.00/);
 await page.locator('.ll-callout').first().click();assert.equal(await page.locator('.bridge-table tr.is-hl').getAttribute('data-row'),'nwc');
 assert.match(await txt('.ll-callout.is-on'),/dalam kurung/);assert.equal(await page.locator('.ll-callouts a[href^="https://www.wallstreetprep.com"]').count(),1);
 await next();

 /* 4 Contoh */
 assert.match(await beat(),/Contoh/);assert.equal(await page.locator('.ll-steps-list li').count(),1);
 const cells=async()=>page.locator('.ll-grid td').allInnerTexts();assert.ok((await cells()).includes('51')&&(await cells()).includes('73')&&(await cells()).includes('22'),'evaluated formulas shown');
 await page.locator('[data-lesson="worked-next"]').click();await page.locator('[data-lesson="worked-next"]').click();assert.equal(await page.locator('.ll-steps-list li').count(),3);assert.match(await txt('.ll-steps-list'),/73 − 51 = 22/);
 await next();

 /* 5 Giliran lu: the ladder */
 assert.match(await beat(),/Giliran lu/);assert.equal(await page.locator('.ll-rung').count(),4);assert.equal(await page.locator('.ll-rung.is-locked').count(),3,'later rungs are locked');
 const A='[data-lesson-input="complete"]';
 await page.locator(A).fill('=110-73');await page.locator('[data-lesson="check"][data-rung="complete"]').click();
 assert.match(await txt('.ll-fb'),/diketik langsung/);assert.equal(await page.locator('.ll-rung.is-ok').count(),0,'a hard-coded right answer is not accepted');
 await page.locator(A).fill('=C8+B8');await page.keyboard.press('Enter');assert.match(await txt('.ll-fb'),/menjumlah dua saldo/,'Enter checks');
 await page.locator(A).fill('=B8-C8');await page.locator('[data-lesson="check"][data-rung="complete"]').click();assert.match(await txt('.ll-fb'),/Ukurannya benar/);
 await page.locator('[data-lesson="hint"][data-rung="complete"]').click();assert.match(await txt('.ll-hints'),/Petunjuk 1\. Konsep/);assert.match(await txt('[data-lesson="hint"][data-rung="complete"]'),/1\/3/);
 await page.locator(A).fill('=C8-B8');await page.locator('[data-lesson="check"][data-rung="complete"]').click();assert.match(await txt('.ll-fb.is-ok'),/Benar dan tertaut ke/);
 assert.equal(await page.locator('.ll-rung.is-locked').count(),2,'rung b opened');
 const B='[data-lesson-input="independent"]';
 await page.locator(B).fill('43,04');await page.locator('[data-lesson="check"][data-rung="independent"]').click();assert.match(await page.locator('.ll-rung').nth(1).locator('.ll-fb').innerText(),/kebalik/);
 await page.locator(B).fill('-0,96');await page.keyboard.press('Enter');assert.equal(await page.locator('.ll-rung.is-ok').count(),2);
 const C='[data-lesson-input="twist"]';
 await page.locator(C).fill('48,9');await page.locator('[data-lesson="check"][data-rung="twist"]').click();assert.match(await page.locator('.ll-rung').nth(2).locator('.ll-fb').innerText(),/piutang yang seharusnya/);
 await page.locator(C).fill('26,1');await page.keyboard.press('Enter');assert.equal(await page.locator('.ll-rung.is-ok').count(),3);
 /* red pen */
 const row=id=>page.locator('[data-lesson="pick-row"][data-id="'+id+'"]');
 await row('cfo').click();assert.match(await page.locator('.ll-rung').nth(3).locator('.ll-fb').innerText(),/gejalanya/);
 await row('ebitda').click();assert.match(await page.locator('.ll-rung').nth(3).locator('.ll-fb').innerText(),/cocok dengan Exhibit 01/);
 await row('nwc').click();assert.match(await page.locator('.ll-rung').nth(3).locator('.ll-fb.is-ok').innerText(),/Tepat\. Kenaikan NWC 37 ditambahkan/);
 const D='[data-lesson-input="red_pen"]';
 await page.locator(D).fill('9,5');await page.keyboard.press('Enter');assert.match(await page.locator('.ll-rung').nth(3).locator('.ll-fb').last().innerText(),/tandanya terbalik/);
 await page.locator(D).fill('-9,5');await page.keyboard.press('Enter');assert.equal(await page.locator('.ll-rung.is-ok').count(),4);
 assert.match(await page.locator('.ll-beat > .ll-note').last().innerText(),/4 dari 4 rung selesai, 4 tanpa petunjuk solusi/,'a concept hint is not a solution reveal');
 if(process.env.LESSON_SHOT)await page.screenshot({path:process.env.LESSON_SHOT+'-ladder.png',fullPage:true});
 await next();

 /* 6 Defend */
 assert.match(await beat(),/Defend/);assert.match(await txt('.ll-quote'),/CFO negatif/);
 await page.locator('[data-lesson-defend]').fill('Aging piutang, aging stok, termin pemasok.');
 await page.locator('[data-lesson="defend-show"]').click();assert.equal(await page.locator('.ll-points li').count(),3);
 await page.locator('.ll-points input').nth(0).check();await page.locator('.ll-points input').nth(2).check();assert.match(await txt('.ll-points + .ll-note'),/2 dari 3/);
 assert.equal(await page.locator('[data-lesson-defend]').inputValue(),'Aging piutang, aging stok, termin pemasok.','the answer survives re-render');
 await next();

 /* 7 Kunci */
 assert.match(await beat(),/Kunci/);assert.match(await txt('.ll-beat-head p'),/Tebakanmu: “Tetap positif, tetapi lebih kecil dari EBITDA”\. Belum tepat/);
 assert.match(await txt('.ll-beat > p:not(.ll-note)'),/CFO 2025 = −Rp9,5 miliar/);
 await page.locator('.ll-card').first().click();assert.match(await page.locator('.ll-card').first().innerText(),/Dikurangkan/);
 await page.locator('[data-lesson="cards"]').click();assert.match(await txt('.ll-ok'),/Kartu masuk Daily Drill/);
 const deck=await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('self.review.v1.'));return JSON.parse(localStorage.getItem(k))});
 assert.equal(deck.length,3);assert.ok(deck.every(c=>c.stage===0&&c.source==='PE-L01'));
 await next();assert.match(await page.locator('.ll-ok').last().innerText(),/Lesson ditandai selesai/);

 /* persistence: progress and the typed answer come back after a reload; transient input does not */
 await page.reload();await x.enter().catch(()=>{});await page.locator('[data-learning="tab"][data-tab="masterclass"]').click();await page.locator('.ll').waitFor();
 assert.match(await beat(),/Kunci/);await page.locator('[data-lesson="beat"][data-n="5"]').click();assert.equal(await page.locator('.ll-rung.is-ok').count(),4,'ladder results are kept');
 await page.locator('[data-lesson="beat"][data-n="6"]').click();assert.equal(await page.locator('[data-lesson-defend]').inputValue(),'Aging piutang, aging stok, termin pemasok.');
 await page.locator('[data-lesson="beat"][data-n="0"]').click();assert.equal(await page.locator('.ll-option.is-picked').count(),1,'prediction kept');

 /* Daily Drill: due cards appear in Today and can be reviewed from memory */
 await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('self.review.v1.'));const d=JSON.parse(localStorage.getItem(k));d.forEach(c=>c.due='2026-01-01');localStorage.setItem(k,JSON.stringify(d))});
 await page.locator('.rooms-rail .door[data-room="today"]').click();await page.locator('.today-drill').waitFor();
 assert.match(await txt('.today-drill'),/3 due/);await page.locator('[data-review="start"]').click();
 assert.match(await txt('.review-count'),/Card 1 of 3 · PE-L01/);assert.equal(await page.locator('.review-back').count(),0,'the answer is hidden until asked');
 await page.keyboard.press('Space');assert.equal(await page.locator('.review-back').count(),1);await page.keyboard.press('3');assert.match(await txt('.review-count'),/Card 2 of 3/);
 await page.locator('[data-review="flip"]').click();await page.locator('[data-review="easy"]').click();
 await page.locator('[data-review="flip"]').click();await page.locator('[data-review="again"]').click();
 assert.match(await txt('.review-modal'),/Drill finished[\s\S]*3 cards reviewed: 1 again, 0 hard, 1 good, 1 easy/);
 await page.locator('[data-review="close"]').click();assert.match(await txt('.today-drill'),/Nothing due today\. 3 cards scheduled/);
 const after=await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('self.review.v1.'));return JSON.parse(localStorage.getItem(k)).map(c=>[c.stage,c.lapses])});
 assert.deepEqual(after.sort(),[[0,1],[1,0],[2,0]].sort());

 /* phone at 150% text with a wide fallback font */
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{document.documentElement.style.setProperty('--scale','1.5');const s=document.createElement('style');s.textContent='body,body *{font-family:"DejaVu Sans",sans-serif!important}';document.head.appendChild(s)});
 await page.locator('.rooms-bar .door[data-room="study"]').click();await page.locator('.ll').waitFor();
 for(const n of [2,3,4,5,6,7]){await page.locator('[data-lesson="beat"][data-n="'+n+'"]').click();await noOverflow('beat '+n+' at 390');}
 assert.deepEqual(errors,[],'no page errors');
 await x.browser.close();
 console.log('PASS Lesson Loop browser: eight beats, unverified video stays honest, waterfall ties out, bridge callouts, worked grid, four-rung ladder with hard-code and misconception feedback, red pen, defend, lock in, Daily Drill, persistence, 390px at 150%.');
})().catch(e=>{console.error(e);process.exit(1)});
