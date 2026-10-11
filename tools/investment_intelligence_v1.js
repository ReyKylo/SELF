/* SELF Investment Intelligence Academy — additive V1.
   No modifications to legacy DB, career records, or other pages.
   This module keeps learner drafts in namespaced browser localStorage only. */
const II_STORAGE_KEY='self.investment.academy.v1';
const II_MEMO_URL='https://www.bvp.com/memos/shopify';
const II_VIDEO_URL='https://www.ycombinator.com/blog/startup-investor-school-day-1-videos/';
const iiDefaults={view:'home',step:'brief',briefDone:false,videoReviewed:false,exploreDone:false,quizCorrect:false,quizFeedback:'',quizSelection:'',thesis:'',risk:'',evidence:'',reflection:'',deckClaim:'',customerGrowth:81};
let iiStorageOK=true;
function iiLoad(){
 try {
  const raw=localStorage.getItem(II_STORAGE_KEY);
  if(!raw)return {...iiDefaults};
  const parsed=JSON.parse(raw);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {...iiDefaults};
  const safe={...iiDefaults};
  for(const key of Object.keys(iiDefaults)){
   if(typeof parsed[key]===typeof iiDefaults[key])safe[key]=typeof iiDefaults[key]==='string'?parsed[key].slice(0,10000):parsed[key];
  }
  if(!['home','lesson','growth','notebook','model','memo','ic','curriculum','vault','case','portfolio'].includes(safe.view))safe.view='home';
  if(!['brief','video','visual','recall','apply'].includes(safe.step))safe.step='brief';
  return safe;
 }catch(err){iiStorageOK=false;return {...iiDefaults}}
}
let iiState=iiLoad();
function iiSave(){
 try{localStorage.setItem(II_STORAGE_KEY,JSON.stringify(iiState));iiStorageOK=true;return true}
 catch(err){iiStorageOK=false;return false}
}
function iiEsc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function iiIcon(name){return typeof rvI==='function'?rvI(name):'◇'}
function iiButton(label,act,value='',cls='ii-btn'){const pressed=act==='quiz-choice'?' aria-pressed="'+(iiState.quizSelection===value?'true':'false')+'"':'';return '<button type="button" class="'+cls+'"'+pressed+' data-ii="'+act+'" data-val="'+iiEsc(value)+'">'+label+'</button>'}
function iiCompleted(){return [iiState.briefDone,iiState.videoReviewed,iiState.exploreDone,iiState.quizCorrect,iiState.thesis.trim().length>=30].filter(Boolean).length}
function iiPill(s){return '<span class="ii-pill">'+iiEsc(s)+'</span>'}
function iiNav(){
 const entries=[['home','Academy','book-open'],['lesson','Lesson 01','graduation-cap'],['growth','Lesson 02','graduation-cap'],['notebook','Research Notebook','book-open'],['model','Financial Model','calculator'],['memo','Investment Memo','file-text'],['ic','IC & Deck Studio','presentation'],['curriculum','VC Academy','graduation-cap'],['vault','Investment Vault','shield-check'],['case','Active Case','briefcase'],['portfolio','Portfolio','layers']];
 return '<nav class="ii-subnav" aria-label="Investment Intelligence navigation">'+entries.map(e=>iiButton(iiIcon(e[2])+' '+e[1],'view',e[0],'ii-tab'+(iiState.view===e[0]?' is-active':''))).join('')+'</nav>';
}
function iiShell(content){
 return '<section class="ii-app"><div class="ii-shell-head"><div><span class="ii-eyebrow">SELF / INVESTMENT INTELLIGENCE</span><strong>Build the judgment, then the portfolio.</strong></div><span class="ii-head-tag">HISTORICAL VC ANALYST LAB</span></div>'+iiNav()+(!iiStorageOK?'<div class="ii-alert" role="alert">Penyimpanan browser tidak tersedia. Catatan sesi ini belum aman untuk ditutup; unduh backup sebelum keluar.</div>':'')+content+'</section>';
}
function iiHome(){
 const p=iiCompleted(),pct=p/5*100;
 return '<div class="ii-home">'+
 '<header class="ii-hero"><div class="ii-hero-copy"><span class="ii-eyebrow ii-hero-eyebrow">WELCOME TO THE ANALYST JOURNEY / 01</span><h1>Learn the thinking.<br><em>Build your own conviction.</em></h1><p>Pelajari cara investor mengambil keputusan, satu konsep dalam satu waktu. Baca sumber asli, tonton video pilihan, lalu bangun investment case lu sendiri.</p><div class="ii-hero-actions">'+iiButton('Continue Lesson 01 →','view','lesson','ii-btn ii-btn-primary')+iiButton('Open active case ↗','view','case','ii-btn ii-btn-quiet')+'</div></div><div class="ii-hero-art" aria-hidden="true"><span class="ii-art-orbit ii-orbit-one"></span><span class="ii-art-orbit ii-orbit-two"></span><span class="ii-art-ribbon">THINK / ANALYZE / PRESENT</span><div class="ii-art-panel"><small>YOUR FIRST INVESTMENT QUESTION</small><strong>Why did they believe in Shopify?</strong><span>October 2010 · Historical Deal</span><div class="ii-art-lines"><i></i><i></i><i></i></div></div><span class="ii-art-coordinate">ARCHIVE / 2010</span></div></header>'+
 '<div class="ii-home-top"><section class="ii-feature-card"><div class="ii-card-top"><span class="ii-overline">CURRENT LESSON / VC FOUNDATIONS</span>'+iiPill('BEGINNER · 15–25 MIN')+'</div><h2>01. How Investors Think</h2><p>Bagaimana cara membaca peluang sebuah startup sebelum semua orang tahu hasil akhirnya?</p><div class="ii-progress-track"><span style="width:'+pct+'%"></span></div><div class="ii-progress-meta"><span>'+p+' dari 5 learning milestones</span><strong>'+pct.toFixed(0)+'%</strong></div>'+iiButton('Resume learning →','view','lesson','ii-btn ii-btn-primary')+'</section>'+
 '<section class="ii-case-snapshot"><span class="ii-overline">YOUR ACTIVE HISTORICAL CASE</span><span class="ii-case-no">CASE / 001</span><h2>Shopify<span>2010</span></h2><p>Study Bessemer’s original thinking. Reconstruct the decision. Form your independent thesis.</p><div class="ii-case-facts"><span>Historical re-underwriting</span><span>As-of: Oct 12, 2010</span></div>'+iiButton('Explore case →','view','case','ii-btn ii-btn-quiet')+'</section></div>'+
 '<section class="ii12-home-launch"><div><span class="ii-overline">NEW / YOUR NEXT 15-MINUTE LESSON</span><h2>02. Growth vs. Quality</h2><p>Kenapa growth tinggi belum tentu business quality bagus? Latihan dari memo Shopify 2010, lanjutkan ke source-aware research notebook.</p><div>'+iiButton('Start Lesson 02 →','view','growth','ii-btn ii-btn-primary')+iiButton('Open Research Notebook ↗','view','notebook','ii-btn ii-btn-quiet')+'</div></div><span class="ii12-launch-counter">02 / VC FOUNDATIONS</span></section><section class="ii13-entry"><div><span class="ii-overline">NEW / FINANCIAL MODELING PRACTICE</span><h2>03. Build Shopify’s Revenue Engine</h2><p>Turn customer acquisition, churn, ARPU and CAC into a 12-month analyst scenario. Learn the mechanics without pretending your projection is historical fact.</p></div>'+iiButton('Open Financial Lab →','view','model','ii-btn ii-btn-primary')+'</section><section class="ii14-home-entry"><div><span class="ii-overline">NOW AVAILABLE / RESEARCH TO COMMUNICATION</span><h2>04. Draft Your Investment Memo</h2><p>Use your own investment thesis, source-backed evidence and frozen financial assumptions to write, challenge and present an investment decision.</p></div>'+iiButton('Open Memo Workshop →','view','memo','ii-btn ii-btn-primary')+'</section><section class="ii15-home-entry"><div><span class="ii-overline">PHASE 1.5 / FINAL DECISION PRACTICE</span><h2>05. Defend & Present Your Thesis</h2><p>Face six adversarial investment committee questions, then craft native editable 16:9 PowerPoint slides from your own memo.</p></div>'+iiButton('Open IC & Deck Studio →','view','ic','ii-btn ii-btn-primary')+'</section><section class="ii2-home-entry"><div><span class="ii-overline">NEW / DEEP VC FOUNDATIONS</span><h2>Phase 2: The Real Learning Track</h2><p>Nine source-grounded lessons with explainers, official links, math drills, and independent Shopify research missions. Learn the language before the hard work.</p></div>'+iiButton('Explore VC Academy →','view','curriculum','ii-btn ii-btn-primary')+'</section><section class="ii-roadmap"><div class="ii-section-heading"><div><span class="ii-overline">LEARNING ROADMAP</span><h2>One case. Many small breakthroughs.</h2></div><span class="ii-muted">Do not rush. Understand first.</span></div><div class="ii-roadmap-grid">'+
 [['01','Investment thinking','Why the VC considered the deal','NOW'],['02','Business & market','Customer growth, risks, competition','AVAILABLE'],['03','Financial thinking','Revenue, unit economics, forecasts','AVAILABLE'],['04','Valuation & returns','Ownership, dilution, scenarios','PLANNED'],['05','Investment writing','Build a memo and a narrative','AVAILABLE'],['06','Deck & IC defense','Present and defend your analysis','PLANNED']].map((r,i)=>'<div class="ii-roadmap-item'+(i===0?' is-current':'')+'"><span class="ii-roadmap-index">'+r[0]+'</span><div><strong>'+r[1]+'</strong><p>'+r[2]+'</p></div><small>'+r[3]+'</small></div>').join('')+'</div></section>'+
 '<div class="ii-bottom-note"><span>'+iiIcon('shield-check')+'</span><p><strong>Learning progress is not a badge for watching videos.</strong> Milestones here reflect actions lu sendiri. Independent mastery dan professional portfolio readiness memerlukan review terpisah.</p></div></div>';
}
function iiStepNav(){
 const steps=[['brief','01','Brief'],['video','02','Watch'],['visual','03','Explore'],['recall','04','Recall'],['apply','05','Apply']];
 return '<div class="ii-step-nav" aria-label="Lesson stages">'+steps.map(s=>iiButton('<span>'+s[1]+'</span>'+s[2],'step',s[0],'ii-step'+(iiState.step===s[0]?' is-active':''))).join('')+'</div>';
}
function iiBrief(){
 return '<div class="ii-reading"><span class="ii-overline">01 / THE SIMPLE EXPLANATION</span><h2>Bayangin lu jadi investor pada 2010.</h2><p>Saat itu Shopify membuat software agar bisnis bisa membuka toko online dengan mudah. Lu belum tahu apakah perusahaan ini nantinya akan besar. Yang lu tahu hanyalah data dan cerita yang tersedia <em>saat itu</em>.</p><p>Dalam memo investor, Bessemer mencatat pelanggan Shopify bertambah dari sekitar <strong>5.500 menjadi hampir 10.000</strong> dalam setahun. Monthly recurring revenue (MRR) meningkat dari <strong>US$164 ribu menjadi US$438 ribu</strong>.</p><div class="ii-datum-row"><div><small>CUSTOMERS / ONE YEAR</small><strong>5,500 → ~10,000</strong><span>+81% YoY (reported)</span></div><div><small>MONTHLY RECURRING REVENUE</small><strong>$164K → $438K</strong><span>+151% YoY (reported)</span></div></div><p><strong>Kenapa investor peduli?</strong> Pertumbuhan ini memberi petunjuk bahwa pelanggan menemukan value dari produk Shopify. Tapi pertumbuhan saja belum membuktikan bisnisnya akan menghasilkan return bagus.</p><blockquote>Investment thesis adalah argumen tentang <strong>mengapa</strong> investasi layak dilakukan, bukti yang mendukungnya, dan risiko yang bisa membuat tesis itu salah.</blockquote><p>Risiko Shopify ketika itu termasuk pelanggan usaha kecil yang bisa berhenti berlangganan, serta ketidakpastian ukuran pasar e-commerce.</p><div class="ii-reading-actions"><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Lihat memo asli Bessemer ↗</a>'+iiButton(iiState.briefDone?'✓ Brief dipahami':'Saya paham penjelasannya →','brief-done','','ii-btn ii-btn-primary')+'</div><small class="ii-footnote">Sumber: Bessemer Venture Partners, Shopify investment memo bertanggal 12 Oktober 2010. Halaman publik juga memuat komentar retrospektif; jangan perlakukan komentar tersebut sebagai informasi yang diketahui pada 2010.</small></div>';
}
function iiWatch(){
 return '<div class="ii-reading"><span class="ii-overline">02 / WATCH WITH A QUESTION</span><h2>Dengarkan bagaimana investor menjelaskan cara berpikir mereka.</h2><p>Video dari <strong>Y Combinator Startup Investor School</strong> ini adalah pengantar investasi startup, bukan rekaman diskusi Shopify. Lu tidak perlu memahami semua istilah langsung.</p><div class="ii-video-card"><div class="ii-video-visual"><a class="ii-play" href="'+II_VIDEO_URL+'" target="_blank" rel="noopener noreferrer" aria-label="Open official YC videos">▶</a><span>YC / STARTUP INVESTOR SCHOOL</span></div><div class="ii-video-details"><small>EXTERNAL VIDEO · ORIGINAL SOURCE</small><h3>Startup Investor School — Day 1</h3><p>Perhatikan satu hal: bagaimana investor menjelaskan alasan memilih suatu peluang ketika risikonya masih besar?</p><a href="'+II_VIDEO_URL+'" target="_blank" rel="noopener noreferrer">Open official video collection ↗</a></div></div><div class="ii-callout"><strong>Watch with purpose</strong><p>Sambil menonton, catat satu hal: apakah investor lebih menekankan pertumbuhan, kualitas founder, ukuran pasar, atau potensi return? Lu boleh punya jawaban berbeda.</p></div>'+iiButton(iiState.videoReviewed?'✓ Saya sudah review video':'Saya sudah menonton / review materi →','video-done','','ii-btn ii-btn-primary')+'<small class="ii-footnote">Centang ini berdasarkan laporan lu sendiri. Membuka link tidak otomatis dianggap menonton video.</small></div>';
}
function iiVisual(){
 const growth=Number(iiState.customerGrowth)||81, projection=Math.round(10000*(1+growth/100));
 return '<div class="ii-reading"><span class="ii-overline">03 / VISUAL EXPLANATION</span><h2>Growth is a signal. Not a guarantee.</h2><p>Kita latihan membaca pertumbuhan, bukan meramal hasil Shopify. Data asli 2010 menunjukkan hampir 10 ribu pelanggan, sedangkan slider di bawah ini adalah <strong>simulasi hipotetis untuk satu tahun berikutnya</strong>.</p><div class="ii-sim"><div class="ii-sim-head"><span>HYPOTHETICAL CUSTOMER GROWTH NEXT YEAR</span><strong>'+growth+'%</strong></div><input id="iiGrowth" type="range" min="0" max="150" step="5" value="'+growth+'" aria-label="Simulated customer growth"><div class="ii-sim-bars"><div><small>2010 reported (approx.)</small><span class="ii-bar"><i style="width:'+Math.min(100,10000/25000*100)+'%"></i></span><strong>~10,000</strong></div><div><small>Next year (scenario, not fact)</small><span class="ii-bar"><i style="width:'+Math.min(100,projection/25000*100)+'%"></i></span><strong>~'+projection.toLocaleString('en-US')+'</strong></div></div><p>Kalau growth melambat, proyeksi pelanggan ikut berubah. Namun investor masih perlu tahu retention, acquisition cost, dan apakah pelanggan membawa contribution margin yang cukup.</p></div><div class="ii-callout"><strong>Investment judgment prompt</strong><p>Apakah customer growth sendirian cukup untuk memutuskan sebuah investasi? Apa satu risiko yang perlu dicek?</p></div>'+iiButton(iiState.exploreDone?'✓ Visual sudah dieksplorasi':'Saya sudah eksplor simulasi →','visual-done','','ii-btn ii-btn-primary')+'</div>';
}
function iiRecall(){
 const choices=[['A','Kenaikan jumlah pengguna saja cukup membuktikan hasil investasi yang tinggi.'],['B','Pertumbuhan pelanggan dan MRR menunjukkan demand, tetapi harus dievaluasi bersama retention, market, dan harga investasi.'],['C','Startup kecil pasti tidak layak didanai karena jumlah pelanggan belum besar.']];
 return '<div class="ii-reading"><span class="ii-overline">04 / QUICK RECALL</span><h2>Coba jawab tanpa membuka memo.</h2><p>Dengan data yang diketahui investor pada 2010, manakah interpretasi yang paling masuk akal?</p><fieldset class="ii-quiz"><legend>Choose one answer</legend>'+choices.map(c=>iiButton('<b>'+c[0]+'</b><span>'+c[1]+'</span>','quiz-choice',c[0],'ii-choice'+(iiState.quizSelection===c[0]?' is-selected':''))).join('')+'</fieldset>'+iiButton('Check my reasoning →','quiz','','ii-btn ii-btn-primary')+(iiState.quizFeedback?'<div class="ii-feedback '+(iiState.quizCorrect?'is-correct':'')+'" role="status">'+iiEsc(iiState.quizFeedback)+'</div>':'')+'<p class="ii-footnote">Quiz ini menguji pemahaman dasar; satu jawaban benar belum membuktikan investment mastery.</p></div>';
}
function iiApply(){
 return '<div class="ii-reading"><span class="ii-overline">05 / YOUR FIRST ANALYST NOTE</span><h2>Now form your own view.</h2><p>Lu tidak harus benar dulu. Tulis satu argumen yang mendukung kemungkinan investasi Shopify pada 2010, lalu satu hal yang bisa membuat lu berubah pikiran.</p><label class="ii-field">Your investment thesis (minimum 30 characters)<textarea data-ii-field="thesis" maxlength="4000" rows="4" placeholder="Menurut gue, Shopify menarik karena...">'+iiEsc(iiState.thesis)+'</textarea></label><label class="ii-field">What could go wrong?<textarea data-ii-field="risk" maxlength="4000" rows="3" placeholder="Risiko terbesarnya adalah...">'+iiEsc(iiState.risk)+'</textarea></label><div class="ii-callout"><strong>Analyst writing tip</strong><p>Investment memo bukan deskripsi perusahaan. Setiap paragraf sebaiknya punya claim, evidence, dan implication terhadap keputusan investasi.</p></div><div class="ii-reading-actions">'+iiButton('Save to Active Case →','save-draft','','ii-btn ii-btn-primary')+iiButton('View case workspace','view','case','ii-btn ii-btn-quiet')+'</div><small class="ii-footnote">Draft belum di-review investor atau AI. Lu adalah penulis dan pemilik kesimpulan.</small></div>';
}
function iiLesson(){
 const p=iiCompleted();
 const sections={brief:iiBrief,video:iiWatch,visual:iiVisual,recall:iiRecall,apply:iiApply};
 return '<div class="ii-lesson"><div class="ii-lesson-top"><div><span class="ii-overline">ACADEMY / FOUNDATION 01</span><h1>How Investors Think</h1><p>Shopify, October 2010 · Bahasa Indonesia, professional English terms.</p></div><div class="ii-lesson-progress"><strong>'+p+'/5</strong><span>milestones recorded</span></div></div>'+iiStepNav()+'<div class="ii-lesson-layout"><article class="ii-lesson-content">'+sections[iiState.step]()+'</article><aside class="ii-lesson-aside"><div class="ii-mentor-card"><span class="ii-overline">YOUR ANALYST MENTOR / GUIDE</span><h3>Satu langkah dulu.</h3><p>'+(iiState.step==='brief'?'Baca pelan-pelan. Kita belum masuk formula valuation.':iiState.step==='video'?'Fokus pada satu pertanyaan saat menonton, bukan menghafal seluruh video.':iiState.step==='visual'?'Coba ubah asumsi. Bedakan angka historis dengan skenario.':iiState.step==='recall'?'Jawab dulu. Baru lihat penjelasan di bawahnya.':'Gunakan kalimat lu sendiri. Belum perlu terdengar seperti investment banker.')+'</p></div><div class="ii-source-card"><span class="ii-overline">SOURCE LIBRARY</span><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Bessemer — Shopify Original Memo ↗</a><a href="'+II_VIDEO_URL+'" target="_blank" rel="noopener noreferrer">YC — Startup Investor School ↗</a><small>Memo contains modern retrospective notes. Separate historical evidence from hindsight.</small></div><div class="ii-aside-next">'+iiButton('← Back to Academy','view','home','ii-btn ii-btn-quiet')+'</div></aside></div></div>';
}
function iiCase(){
 return '<div class="ii-case"><div class="ii-case-hero"><span class="ii-overline">ACTIVE CASE / 001 / HISTORICAL RE-UNDERWRITING</span><h1>Shopify <em>2010.</em></h1><p>Study what the investors knew, reconstruct their thinking, and create a decision lu sendiri. This is an independent learning simulation—not real transaction work.</p><div class="ii-case-hero-meta"><span>As-of · October 12, 2010</span><span>Series A</span><span>Memo source · Bessemer</span></div></div><div class="ii12-case-nudge"><div><span class="ii-overline">RESEARCH FIRST, THEN UNDERWRITE</span><p>Kumpulkan source-backed evidence, cek tanggal, dan tandai conflicting information sebelum membuat final claim.</p></div>'+iiButton('Open Research Notebook →','view','notebook','ii-btn ii-btn-quiet')+iiButton('Open Financial Worksheet →','view','model','ii-btn ii-btn-quiet')+iiButton('Open Investment Memo →','view','memo','ii-btn ii-btn-quiet')+iiButton('IC & Deck Studio →','view','ic','ii-btn ii-btn-quiet')+iiButton('Investment Vault →','view','vault','ii-btn ii-btn-quiet')+'</div><div class="ii-case-grid"><section class="ii-case-editor"><span class="ii-overline">YOUR WORKING THESIS / DRAFT</span><h2>Make the argument yours.</h2><label class="ii-field">Why invest?<textarea data-ii-field="thesis" rows="5" maxlength="4000" placeholder="Your independent thesis...">'+iiEsc(iiState.thesis)+'</textarea></label><label class="ii-field">What would change your mind?<textarea data-ii-field="risk" rows="4" maxlength="4000" placeholder="Risk and counterargument...">'+iiEsc(iiState.risk)+'</textarea></label><label class="ii-field">Evidence / historical source note<textarea data-ii-field="evidence" rows="4" maxlength="4000" placeholder="Source, dated fact, implication...">'+iiEsc(iiState.evidence)+'</textarea></label>'+iiButton('Save draft','save-draft','','ii-btn ii-btn-primary')+'<p class="ii-footnote">Draft disimpan hanya di browser ini, belum masuk Supabase sync atau backup Workspace lama.</p></section><aside class="ii-case-right"><section class="ii-source-card"><span class="ii-overline">EVIDENCE STARTER PACK</span><div class="ii-case-fact"><strong>~10,000</strong><span>Shopify customers / 2010</span></div><div class="ii-case-fact"><strong>$438K</strong><span>MRR / 2010</span></div><div class="ii-case-fact"><strong>+151%</strong><span>MRR YoY / as reported</span></div><a href="'+II_MEMO_URL+'" target="_blank" rel="noopener noreferrer">Verify with original memo ↗</a><small>Do not use later outcomes when writing an as-of 2010 recommendation.</small></section><section class="ii-mentor-card"><span class="ii-overline">NEXT DELIVERABLE</span><h3>Your first investment slide.</h3><p>Setelah thesis mulai terbentuk, kita akan susun claim dan evidence menjadi satu slide. Deck editor, PPTX, dan IC simulation masuk phase berikutnya.</p>'+iiButton('See portfolio plan →','view','portfolio','ii-btn ii-btn-quiet')+'</section></aside></div></div>';
}
function iiPortfolio(){
 const ready=iiState.thesis.trim().length>=30, thesis=ready?iiEsc(iiState.thesis):'Belum ada thesis draft yang cukup lengkap.';
 return '<div class="ii-portfolio"><span class="ii-overline">PORTFOLIO / WORK IN PROGRESS</span><h1>Proof of work starts here.</h1><p>Ini adalah tempat menyimpan output analisis lu, bukan klaim pernah bekerja dalam transaksi asli.</p><article class="ii-portfolio-entry"><div class="ii-portfolio-cover"><span>CASE STUDY / 001</span><strong>SHOPIFY<br>2010.</strong><small>HISTORICAL RE-UNDERWRITING</small></div><div class="ii-portfolio-body"><span class="ii-overline">CASE DRAFT · NOT PORTFOLIO-READY</span><h2>Your investment thesis</h2><p>'+thesis+'</p><div class="ii-portfolio-checks"><span>'+iiIcon(ready?'check':'clock')+' Thesis draft '+(ready?'saved':'pending')+'</span><span>'+iiIcon('clock')+' Research QA pending</span><span>'+iiIcon('book-open')+' '+ii12State.notes.length+' evidence notes saved (unreviewed)</span><span>'+iiIcon('calculator')+' Financial worksheet '+(ii13State.snapshot?'snapshot saved (not reviewed)':'draft available')+'</span><span>'+iiIcon('file-text')+' Memo workshop '+(ii14DraftWordCount()?'draft started':'ready to draft')+'</span><span>'+iiIcon('presentation')+' Editable PowerPoint slides '+ii15State.deck.length+' in draft</span></div><div class="ii-portfolio-actions">'+iiButton('Edit active case','view','case','ii-btn ii-btn-primary')+iiButton('Research Notebook','view','notebook','ii-btn ii-btn-quiet')+iiButton('Financial Worksheet','view','model','ii-btn ii-btn-quiet')+iiButton('Memo Workshop','view','memo','ii-btn ii-btn-quiet')+iiButton('IC & Deck Studio','view','ic','ii-btn ii-btn-quiet')+iiButton('Investment Vault','view','vault','ii-btn ii-btn-quiet')+iiButton('Download research draft (.md)','export','','ii-btn ii-btn-quiet')+'</div></div></article></div>';
}
function iiAcademy(){const views={home:iiHome,lesson:iiLesson,growth:ii12Growth,notebook:ii12Notebook,model:ii13View,memo:ii14Memo,ic:ii15Defense,curriculum:ii2Page,vault:ii16Vault,case:iiCase,portfolio:iiPortfolio};return iiShell((views[iiState.view]||iiHome)())}
function iiMoreHub(){return rvMoreV4().replace('</header>','</header><section class="ii-entry-more"><div><span class="ii-overline">NEW / ANALYST LEARNING</span><h2>Investment Intelligence</h2><p>Learn professional VC analysis with short explanations, original investor sources, exercises, and a historical Shopify case.</p></div><button type="button" data-page="investment">Open Academy →</button></section>')}
function iiDashboard(){return rvDashboardV4().replace('</header>','</header><section class="ii-dashboard-entry"><div><span>ACADEMY / VC ANALYST TRACK</span><strong>Investment Intelligence</strong><p>Start with a 2010 historical investment case. Learn, practice, then build your own thesis.</p></div><button type="button" data-page="investment">Enter Academy →</button></section>')}
function iiExport(){
 const contents=[
  '# Independent Historical Re-Underwriting — Shopify (2010)',
  '', 'Case type: Historical learning simulation',
  'As-of date: 2010-10-12',
  'Not a record of actual deal participation.',
  '', '## My investment thesis',iiState.thesis||'(not written)',
  '', '## Risks and counterarguments',iiState.risk||'(not written)',
  '', '## Evidence and source notes',iiState.evidence||'(not written)',
  '', '## Primary source',II_MEMO_URL,
  '', '## Learning video',II_VIDEO_URL,
  '', 'Note: the published memo includes retrospective commentary that must not be treated as known in 2010.'
 ].join('\n');
 const blob=new Blob([contents],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download='SELF_Shopify_2010_Research_Draft.md';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
document.addEventListener('click',function(event){
 const el=event.target.closest('[data-ii]');
 if(!el)return;
 event.preventDefault();
 const act=el.dataset.ii,val=el.dataset.val;
 if(act==='view'){iiState.view=val}
 else if(act==='step'){iiState.step=val}
 else if(act==='brief-done'){iiState.briefDone=true}
 else if(act==='video-done'){iiState.videoReviewed=true}
 else if(act==='visual-done'){iiState.exploreDone=true}
 else if(act==='quiz-choice'){iiState.quizSelection=val;iiState.quizFeedback=''}
 else if(act==='quiz'){
  const selected=iiState.quizSelection;
  if(!selected){iiState.quizFeedback='Pilih satu jawaban dulu, baru kita bahas alasannya.'}
  else if(selected==='B'){iiState.quizCorrect=true;iiState.quizFeedback='Betul. Growth memberi sinyal demand, tetapi risiko retention, market, dan valuation tetap harus diuji.'}
  else{iiState.quizCorrect=false;iiState.quizFeedback='Belum tepat. Pertumbuhan adalah evidence, bukan jaminan return. Coba bedakan sinyal positif dari keputusan investasi final.'}
 }
 else if(act==='save-draft'){
  if(iiState.thesis.trim().length<30){if(typeof toast==='function')toast('Tulis thesis sedikit lebih lengkap (minimal 30 karakter).');return}
  const ok=iiSave();
  if(typeof toast==='function')toast(ok?'Case draft tersimpan di browser ini.':'Penyimpanan belum tersedia. Silakan ekspor draft.');
  if(typeof render==='function')render(); // Update lesson milestone + portfolio status immediately.
  return;
 }
 else if(act==='export'){iiExport();return}
 const ok=iiSave();
 if(!ok)iiStorageOK=false;
 if(typeof render==='function')render();
},true);
document.addEventListener('input',function(event){
 const field=event.target.closest('[data-ii-field]');
 if(field&&Object.prototype.hasOwnProperty.call(iiDefaults,field.dataset.iiField)){iiState[field.dataset.iiField]=field.value;iiSave()}
 if(event.target.id==='iiGrowth'){
  iiState.customerGrowth=Number(event.target.value);
  const curr=document.querySelector('.ii-sim-head strong');
  if(curr)curr.textContent=iiState.customerGrowth+'%';
  const bars=document.querySelectorAll('.ii-sim-bars > div');
  if(bars[1]){const projected=Math.round(10000*(1+iiState.customerGrowth/100));bars[1].querySelector('strong').textContent='~'+projected.toLocaleString('en-US');bars[1].querySelector('i').style.width=Math.min(100,projected/25000*100)+'%'}
  iiSave();
 }
},true);
