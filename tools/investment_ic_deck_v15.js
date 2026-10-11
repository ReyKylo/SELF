/* SELF Investment Intelligence Phase 1.5 — IC Defense + editable analyst-owned deck.
   All as-of analysis authored by learner; no live LLM or real IC certification.
   Client-side native PPTX exporter uses a minimal standards-based OPC ZIP package
   with editable PowerPoint text/shapes, no cloud/API dependencies. */
const II15_KEY='self.investment.icdeck.v15';
const II15_QUESTIONS=[
 {id:'valuation',group:'Deal pricing',title:'Which pre-money valuation are you actually underwriting?',prompt:'Bessemer’s memo mentions both US$20M and US$25M pre-money. How would you handle the inconsistency before making an ownership/return claim?',challenge:'If the entry price changes, what specifically happens to your expected ownership and required exit value?',rubric:['State the discrepancy without silently choosing one','Explain which primary evidence you would request','Discuss ownership / return sensitivity','Name what changes your decision']},
 {id:'retention',group:'Quality of growth',title:'If growth is strong, why should we care about churn?',prompt:'Use the 2010 customer growth, reported retention and CAC ranges to defend the economic quality of Shopify’s expansion.',challenge:'If the month-12 retention figure is correct, why could your annualized MRR still rise?',rubric:['Separate new sign-ups from retained merchants','Reference specific original-source figures','Explain churn versus cohort economics','Describe a useful diligence request']},
 {id:'unit',group:'Unit economics',title:'Is the CAC payback you modeled actually comparable?',prompt:'Your model has a simplified CAC payback, while the original memo describes churn-adjusted payback. Can you compare them safely?',challenge:'Suppose marketing costs increase 30% while retention falls. Which two model assumptions would you stress first?',rubric:['Distinguish simple vs churn-adjusted CAC payback','Identify gross profit vs revenue denominator','Acknowledge model limitations','Provide a downside testing approach']},
 {id:'competition',group:'Moat & market',title:'What stops a larger platform from copying this?',prompt:'Defend your assumptions about product differentiation, distribution, switching costs and long-term merchant retention using only as-of source evidence.',challenge:'Which evidence would falsify your moat thesis rather than merely make you uncomfortable?',rubric:['Explain the specific mechanism of defensibility','Consider a plausible stronger competitor','Find measurable counter-evidence','Avoid later Shopify outcomes']},
 {id:'scenario',group:'Financial downside',title:'Your forecast works. What if your acquisition engine breaks?',prompt:'Explain how customer adds, churn, ARPU, gross margin, and CAC interact in your month-by-month scenario. Which two assumptions are most fragile?',challenge:'At what downside assumptions would you change your recommendation from Invest to Pass or More Diligence?',rubric:['Cite the saved model and its version','Explain one downside sensitivity','Distinguish run-rate from realized revenue','Set a decision-reversal condition']},
 {id:'decision',group:'Investment committee',title:'Commit: invest, pass or request more diligence?',prompt:'Summarize your recommendation, defensible pricing range (if known), key uncertainty, and the top diligence item that would change your decision.',challenge:'You have thirty seconds. What is the single strongest reason to NOT follow your recommendation?',rubric:['Make an explicit recommendation','Discuss price / terms uncertainty','Present the strongest counterargument','Request evidence that could change the decision']}
];
const II15_LAYOUTS=['statement','split','evidence','numbers'];
const II15_THEMES={navy:{bg:'142D4B',ink:'FFFFFF',muted:'B9D1E8',accent:'B99866',panel:'203F62'},paper:{bg:'FCFAF5',ink:'193650',muted:'6C8193',accent:'986D42',panel:'EAF0F5'},sage:{bg:'EAF3ED',ink:'213E35',muted:'648275',accent:'3C8068',panel:'DCE9E0'}};
const ii15Blank=()=>({screen:'defense',question:II15_QUESTIONS[0].id,answers:{},followups:{},showRubric:false,selectedEvidence:{},reviewedAt:'',deck:[],activeSlide:'',theme:'navy',lastDeckExport:'',started:false});
let ii15StoreOK=true;
function ii15SafeText(s,max=3000){return String(s==null?'':s).slice(0,max)}
function ii15Load(){
 try{
  const v=JSON.parse(localStorage.getItem(II15_KEY)||'null');
  const s=ii15Blank();if(!v||typeof v!=='object'||Array.isArray(v))return s;
  if(v.screen==='defense'||v.screen==='deck')s.screen=v.screen;
  if(II15_QUESTIONS.some(q=>q.id===v.question))s.question=v.question;
  if(II15_THEMES[v.theme])s.theme=v.theme;
  s.started=v.started===true;s.showRubric=v.showRubric===true;
  s.reviewedAt=ii15SafeText(v.reviewedAt,35);
  for(const q of II15_QUESTIONS){
   if(typeof v.answers?.[q.id]==='string')s.answers[q.id]=ii15SafeText(v.answers[q.id],6000);
   if(typeof v.followups?.[q.id]==='string')s.followups[q.id]=ii15SafeText(v.followups[q.id],4000);
   if(typeof v.selectedEvidence?.[q.id]==='string')s.selectedEvidence[q.id]=ii15SafeText(v.selectedEvidence[q.id],80);
  }
  if(Array.isArray(v.deck))s.deck=v.deck.slice(0,16).filter(x=>x&&typeof x==='object').map((x,i)=>({
   id:ii15SafeText(x.id||'s'+i,80),layout:II15_LAYOUTS.includes(x.layout)?x.layout:'statement',
   kicker:ii15SafeText(x.kicker,150),title:ii15SafeText(x.title,240),body:ii15SafeText(x.body,1400),
   metric:ii15SafeText(x.metric,75),metricLabel:ii15SafeText(x.metricLabel,110),
   evidenceId:ii15SafeText(x.evidenceId,80),notes:ii15SafeText(x.notes,2400)
  }));
  if(s.deck.some(x=>x.id===v.activeSlide))s.activeSlide=v.activeSlide;
  if(typeof v.lastDeckExport==='string')s.lastDeckExport=ii15SafeText(v.lastDeckExport,35);
  return s;
 }catch(e){ii15StoreOK=false;return ii15Blank()}
}
let ii15State=ii15Load();
function ii15Save(){
 try{localStorage.setItem(II15_KEY,JSON.stringify(ii15State));ii15StoreOK=true;return true}catch(e){ii15StoreOK=false;return false}
}
function ii15E(s){return iiEsc(String(s==null?'':s))}
function ii15Btn(label,action,val='',cls='ii15-btn'){return '<button type="button" data-ii15="'+action+'" data-value="'+ii15E(val)+'" class="'+cls+'">'+label+'</button>'}
function ii15Notes(){return Array.isArray(ii12State.notes)?ii12State.notes:[]}
function ii15CanCite(n){return Boolean(n&&n.kind!=='retrospective'&&(!n.asOf||n.asOf<='2010-10-12')&&ii14Source(n))}
function ii15Source(id){return ii15Notes().find(n=>n.id===id)||null}
function ii15DeckId(){return 'slide-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function ii15DefaultSlides(){
 const sections=[['Investment thesis','summary','statement'],['Market and business','business','split'],['Traction and evidence','traction','evidence'],['Financial scenarios','model','numbers'],['Risks and mitigants','risks','split'],['Decision and diligence','decision','statement']];
 return sections.map(([label,key,layout],i)=>({
  id:'seed-'+(i+1),layout,kicker:'SHOPIFY / 2010 · '+String(i+1).padStart(2,'0'),
  title:ii14Draft(key).trim().split(/[.!?\n]/)[0].slice(0,150)||label,
  body:ii14Draft(key).trim().slice(0,650)||'Draft your analysis here. This is not a completed investment recommendation.',
  metric:i===2?'US$438K':i===3&&ii13State.snapshot?ii13USD(ii13State.snapshot.summary.mrr||0):'',
  metricLabel:i===2?'2010 source-reported MRR':i===3?'Month-12 analyst projection (NOT historical)':'',
  evidenceId:ii14Attached(key).find(n=>ii15CanCite(n))?.id||'',notes:ii14Draft(key).slice(0,2000)
 }));
}
function ii15DeckInit(){
 if(ii15State.deck.length)return;
 ii15State.deck=ii15DefaultSlides();ii15State.activeSlide=ii15State.deck[0].id;ii15Save();
}
function ii15QuestionIssue(q){
 const a=(ii15State.answers[q.id]||'').trim(),follow=(ii15State.followups[q.id]||'').trim(),ref=ii15Source(ii15State.selectedEvidence[q.id]);
 const issues=[];
 if(a.length<130)issues.push('Answer needs a developed reasoning chain (at least 130 characters).');
 if(follow.length<65)issues.push('Respond to the follow-up objection (at least 65 characters).');
 if(!ref)issues.push('Attach one Research Notebook note.');
 else if(!ii15CanCite(ref))issues.push('Attached evidence is retrospective, outside the cutoff, or lacks a valid source URL.');
 return issues;
}
function ii15DefenseReport(){
 const results=II15_QUESTIONS.map(q=>({id:q.id,title:q.title,issues:ii15QuestionIssue(q)}));
 return {results,complete:results.filter(x=>!x.issues.length).length,total:results.length};
}
function ii15QuestionView(){
 const q=II15_QUESTIONS.find(x=>x.id===ii15State.question)||II15_QUESTIONS[0],report=ii15DefenseReport();
 const entries=II15_QUESTIONS.map((x,i)=>ii15Btn('<small>'+String(i+1).padStart(2,'0')+'</small><span>'+ii15E(x.group)+'</span><i>'+(ii15QuestionIssue(x).length?'Draft':'Prepared')+'</i>','question',x.id,'ii15-question-nav'+(x.id===q.id?' is-active':''))).join('');
 const opts='<option value="">Choose a source note...</option>'+ii15Notes().map(n=>'<option value="'+ii15E(n.id)+'"'+(ii15State.selectedEvidence[q.id]===n.id?' selected':'')+'>'+ii15E(n.title+' ['+n.kind+']')+'</option>').join('');
 const selected=ii15Source(ii15State.selectedEvidence[q.id]);
 return '<div class="ii15-defense-grid"><aside class="ii15-panel ii15-round-nav"><span class="ii-overline">COMMITTEE ROUNDS</span><h3>Six hard questions.</h3><nav aria-label="IC challenge rounds">'+entries+'</nav><div class="ii15-prepared">'+report.complete+'/'+report.total+' prepared for discussion<small>Readiness reflects written coverage and evidence only, not analyst skill certification.</small></div></aside><article class="ii15-panel ii15-interview"><div class="ii15-interview-head"><span class="ii-overline">ROUND '+(II15_QUESTIONS.indexOf(q)+1)+' · '+ii15E(q.group).toUpperCase()+'</span><span>HISTORICAL RE-UNDERWRITING / 2010</span></div><h2>'+ii15E(q.title)+'</h2><p class="ii15-question-prompt">'+ii15E(q.prompt)+'</p><label class="ii15-field">Your defense<textarea data-ii15-answer="'+q.id+'" rows="6" maxlength="6000" placeholder="My claim, supporting numbers, investment implications, and what would change my mind...">'+ii15E(ii15State.answers[q.id]||'')+'</textarea></label><section class="ii15-counter"><span class="ii-overline">COMMITTEE PUSHBACK / FOLLOW-UP</span><h3>'+ii15E(q.challenge)+'</h3><label class="ii15-field">My response<textarea data-ii15-followup="'+q.id+'" rows="4" maxlength="4000" placeholder="The strongest counterargument is... I would test this by...">'+ii15E(ii15State.followups[q.id]||'')+'</textarea></label></section><section class="ii15-attach"><label class="ii15-field">Attach one pre-cutoff evidence source<select data-ii15-evidence="'+q.id+'">'+opts+'</select></label>'+(selected?'<div class="ii15-linked-evidence"><strong>'+ii15E(selected.title)+'</strong><small>'+ii15E(selected.kind)+' · '+ii15E(selected.asOf||'undated')+'</small>'+(ii15CanCite(selected)?'<a href="'+ii15E(ii14Source(selected))+'" target="_blank" rel="noopener noreferrer">Original source ↗</a>':'<span class="ii15-blocked">Blocked for historical evidence / source missing</span>')+'</div>':'<p>No evidence attached yet. Start in the Research Notebook.</p>')+'</section><div class="ii15-actions">'+ii15Btn('Save this answer','save-defense','','ii15-btn ii15-primary')+ii15Btn(ii15State.showRubric?'Hide evaluation cues':'What would a strong answer include?','rubric','','ii15-btn ii15-subtle')+'</div>'+(ii15State.showRubric?'<section class="ii15-rubric"><span class="ii-overline">REVIEW GUIDANCE · NOT AI GRADING</span><ul>'+q.rubric.map(r=>'<li>'+ii15E(r)+'</li>').join('')+'</ul></section>':'')+'</article></div>';
}
function ii15Defense(){
 const report=ii15DefenseReport();return '<div class="ii15-app"><header class="ii15-top"><div><span class="ii-overline">SELF / INVESTMENT INTELLIGENCE / PHASE 1.5</span><h1>Defend your thesis.</h1><p>An investment committee that asks harder questions than a multiple-choice quiz.</p></div><div class="ii15-top-index"><strong>IC / 2010</strong><small>INDEPENDENT PRACTICE</small></div></header>'+(ii15StoreOK?'':'<div role="alert" class="ii15-warning">Storage unavailable. Download your answers before leaving.</div>')+'<div class="ii15-switch">'+ii15Btn('Investment Committee','screen','defense','ii15-switch-btn'+(ii15State.screen==='defense'?' is-active':''))+ii15Btn('Editable Deck Studio','screen','deck','ii15-switch-btn'+(ii15State.screen==='deck'?' is-active':''))+'</div>'+(ii15State.screen==='defense'?ii15QuestionView():ii15DeckStudio())+'<section class="ii15-footer"><span><b>As-of discipline:</b> Shopify / 12 October 2010. Future success is not evidence for the original investment decision.</span><span><b>Local draft:</b> answers and slides are browser-only. Export before switching devices.</span></section></div>';
}
function ii15Active(){return ii15State.deck.find(x=>x.id===ii15State.activeSlide)||ii15State.deck[0]||null}
function ii15Theme(){return II15_THEMES[ii15State.theme]||II15_THEMES.navy}
function ii15SlideWarnings(s){
 const issues=[];
 if(s.title.trim().length<10)issues.push('Headline needs a clearer claim.');
 if(s.body.trim().length<45)issues.push('Body needs more underlying reasoning.');
 const evidence=ii15Source(s.evidenceId);
 if(!evidence)issues.push('No source note attached.');
 else if(!ii15CanCite(evidence))issues.push('Source not valid for historical as-of evidence.');
 else if(evidence.kind==='assumption')issues.push('Analyst assumption: disclose it as a scenario, not historical performance.');
 if(s.layout==='numbers'&&(!s.metric.trim()||!s.metricLabel.trim()))issues.push('Metric and its type must be labeled.');
 if(s.layout==='numbers'&&ii14Outdated())issues.push('Financial Lab snapshot is stale; refresh before relying on the modeled numbers.');
 return issues;
}
function ii15DeckAudit(){
 let critical=0,weak=0;
 const slides=ii15State.deck.map((s,i)=>{
  const warnings=ii15SlideWarnings(s);
  for(const x of warnings){if(/not valid|stale/i.test(x))critical++;else weak++}
  return {number:i+1,id:s.id,title:s.title,warnings};
 });
 return {slides,critical,weak};
}
function ii15Preview(slide,theme){
 if(!slide)return '<div class="ii15-preview-empty">Add your first slide.</div>';
 const ev=ii15Source(slide.evidenceId);
 return '<div class="ii15-preview ii15-'+ii15E(ii15State.theme)+' ii15-layout-'+ii15E(slide.layout)+'" role="group" aria-label="Editable slide preview"><div class="ii15-preview-kicker">'+ii15E(slide.kicker||'SHOPIFY · 2010')+'</div><h3>'+ii15E(slide.title||'Your investment claim')+'</h3><div class="ii15-preview-main"><p>'+ii15E(slide.body||'Add supporting analysis here.')+'</p>'+(slide.metric?'<div class="ii15-preview-metric"><strong>'+ii15E(slide.metric)+'</strong><span>'+ii15E(slide.metricLabel||'Label the metric and whether it is historical.')+'</span></div>':'')+'</div><footer><span>'+ii15E(ev?(ev.kind==='assumption'?'ANALYST ASSUMPTION':'EVIDENCE: '+ev.title.slice(0,65)):'SOURCE NEEDED')+'</span><span>SELF / INVESTMENT INTELLIGENCE</span></footer></div>';
}
function ii15SlideEditor(){
 const slide=ii15Active();if(!slide)return '<div class="ii15-editor-empty">Add or import a slide to begin.</div>';
 const options='<option value="">Choose Research Notebook evidence...</option>'+ii15Notes().map(n=>'<option value="'+ii15E(n.id)+'"'+(slide.evidenceId===n.id?' selected':'')+'>'+ii15E(n.title+' ['+n.kind+']')+'</option>').join('');
 return '<section class="ii15-slide-form"><div class="ii15-form-header"><span class="ii-overline">SELECTED SLIDE / EDIT PROPERTIES</span><strong>'+ii15E(slide.layout.toUpperCase())+'</strong></div><label class="ii15-field">Slide layout<select data-ii15-edit="layout"><option value="statement"'+(slide.layout==='statement'?' selected':'')+'>Statement / thesis</option><option value="split"'+(slide.layout==='split'?' selected':'')+'>Split argument</option><option value="evidence"'+(slide.layout==='evidence'?' selected':'')+'>Evidence spotlight</option><option value="numbers"'+(slide.layout==='numbers'?' selected':'')+'>Numeric insight</option></select></label><label class="ii15-field">Eyebrow / chapter<input data-ii15-edit="kicker" maxlength="150" value="'+ii15E(slide.kicker)+'" placeholder="INVESTMENT THESIS / 01"></label><label class="ii15-field">Main slide claim<input data-ii15-edit="title" maxlength="240" value="'+ii15E(slide.title)+'" placeholder="Why this investment works"></label><label class="ii15-field">Body / supporting argument<textarea data-ii15-edit="body" rows="5" maxlength="1400" placeholder="A concise argument grounded in facts and assumptions...">'+ii15E(slide.body)+'</textarea></label><div class="ii15-metric-row"><label class="ii15-field">Metric or figure<input data-ii15-edit="metric" maxlength="75" value="'+ii15E(slide.metric)+'" placeholder="US$438K"></label><label class="ii15-field">Source/metric label<input data-ii15-edit="metricLabel" maxlength="110" value="'+ii15E(slide.metricLabel)+'" placeholder="Historical 2010 MRR"></label></div><label class="ii15-field">Linked source<select data-ii15-edit="evidenceId">'+options+'</select></label><label class="ii15-field">Speaker notes / defense<textarea data-ii15-edit="notes" rows="3" maxlength="2400" placeholder="What would you say to the committee?">'+ii15E(slide.notes)+'</textarea></label>'+ii15Btn('Update preview & save','save-slide','','ii15-btn ii15-primary')+'</section>';
}
function ii15DeckStudio(){
 const deck=ii15State.deck,selected=ii15Active(),audit=ii15DeckAudit();
 const cards=deck.map((s,i)=>'<div class="ii15-mini-slide '+(selected?.id===s.id?'is-active':'')+'"><button type="button" data-ii15="select-slide" data-value="'+ii15E(s.id)+'"><span>0'+(i+1)+' / '+ii15E(s.layout.toUpperCase())+'</span><strong>'+ii15E(s.title||'Untitled slide')+'</strong><small>'+ii15SlideWarnings(s).length+' review flags</small></button><div class="ii15-mini-actions">'+ii15Btn('↑','slide-up',s.id,'ii15-move')+ii15Btn('↓','slide-down',s.id,'ii15-move')+ii15Btn('×','slide-delete',s.id,'ii15-move ii15-delete')+'</div></div>').join('');
 const themes=Object.keys(II15_THEMES).map(k=>ii15Btn(k[0].toUpperCase()+k.slice(1),'theme',k,'ii15-theme-button'+(ii15State.theme===k?' is-selected':''))).join('');
 const note=selected?ii15SlideWarnings(selected):[];
 return '<div class="ii15-deck-head"><div><span class="ii-overline">BUILD YOUR OWN WORK / CASE 001</span><h2>Slide Studio.</h2><p>Editable text, layout and sources. Start from your memo, then make the narrative yours.</p></div><div class="ii15-deck-actions">'+ii15Btn(deck.length?'Import missing memo slides':'Start from Memo Draft','import-memo','','ii15-btn ii15-primary')+ii15Btn('Add blank slide +','add-slide')+'</div></div><div class="ii15-deck-controls"><div><span>STYLE</span>'+themes+'</div><div><span>EXPORT</span>'+ii15Btn('Deck JSON','export-json')+ii15Btn('Editable PowerPoint (.pptx)','export-pptx','','ii15-btn ii15-primary')+'</div></div><div class="ii15-deck-grid"><aside class="ii15-slide-rail"><span class="ii-overline">SLIDE OUTLINE · '+deck.length+'/16</span>'+ (cards||'<div class="ii15-no-slides">No slides yet. Import memo or add a blank slide.</div>')+'</aside><div class="ii15-deck-work"><div class="ii15-preview-head"><span class="ii-overline">16:9 PREVIEW / EDITABLE NATIVE SLIDE CONTENT</span><span>'+ii15E(ii15State.theme.toUpperCase())+' PALETTE</span></div>'+ii15Preview(selected,ii15Theme())+'<section class="ii15-slide-feedback"><span class="ii-overline">CURRENT SLIDE QA</span>'+(selected?(note.length?note.map(x=>'<p>• '+ii15E(x)+'</p>').join(''):'<p>No automated content/source flags for this slide. Professional visual and investment review are still required.</p>'):'<p>No slide selected.</p>')+'</section>'+ii15SlideEditor()+'</div></div><section class="ii15-deck-audit"><div><span class="ii-overline">DECK QUALITY REVIEW</span><h3>'+audit.critical+' critical source/model flags · '+audit.weak+' drafting flags</h3><p>Export creates editable PowerPoint text boxes/shapes. It is not investment-quality signoff; source links are printed in the slide footer or reference label.</p></div>'+ii15Btn('Show all slide issues →','audit','','ii15-btn ii15-subtle')+'</section>'+(ii15State.started?'<p class="ii15-local-note">This deck was created from user-authored material, not an actual Shopify deal deliverable. Last local PPTX export: '+ii15E(ii15State.lastDeckExport||'not exported')+'.</p>':'')+'</div>';
}
/* Native PPTX serialization — OOXML editable text/shapes. Store ZIP with CRC32, no network dependency. */
const II15_A='http://schemas.openxmlformats.org/drawingml/2006/main';
const II15_P='http://schemas.openxmlformats.org/presentationml/2006/main';
const II15_R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function ii15Xml(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
function ii15Tx(t,x,y,w,h,size,color,bold=false,id=3,align='l'){
 const lines=String(t||' ').split(/\r?\n/).slice(0,20);
 const ps=lines.map(line=>'<a:p><a:pPr algn="'+align+'"/><a:r><a:rPr lang="en-US" sz="'+Math.round(size*100)+'"'+(bold?' b="1"':'')+'><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>'+ii15Xml(line||' ')+'</a:t></a:r><a:endParaRPr lang="en-US"/></a:p>').join('');
 return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Editable Text '+id+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"/><a:lstStyle/>'+ps+'</p:txBody></p:sp>';
}
function ii15Rect(x,y,w,h,fill,id=2){
 return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Editable Background '+id+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="'+fill+'"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>';
}
function ii15SlideXML(slide,n,theme){
 const width=12192000,height=6858000;
 const safe=ii15Source(slide.evidenceId);
 const source=ii15CanCite(safe)?'Source: '+ii14Source(safe)+' · '+safe.kind:safe?'VERIFY SOURCE: '+safe.title:'Source: not yet attached';
 const margin=700000;
 let shapes=ii15Rect(0,0,width,height,theme.bg,2),id=3;
 shapes+=ii15Rect(margin,580000,104000,49000,theme.accent,id++);
 shapes+=ii15Tx(slide.kicker||'SHOPIFY / INDEPENDENT ANALYSIS',margin,310000,10500000,380000,13,theme.muted,true,id++);
 let titleSize=slide.title.length>105?31:slide.title.length>60?38:45;
 shapes+=ii15Tx(slide.title||'Investment claim',margin,890000,10700000,1580000,titleSize,theme.ink,true,id++);
 if(slide.layout==='numbers'&&slide.metric){
  shapes+=ii15Rect(7960000,2600000,3390000,2240000,theme.panel,id++);
  shapes+=ii15Tx(slide.metric,8260000,2800000,2910000,920000,42,theme.ink,true,id++);
  shapes+=ii15Tx(slide.metricLabel||'ANALYST ASSUMPTION',8260000,3800000,2910000,670000,15,theme.muted,false,id++);
  shapes+=ii15Tx(slide.body,margin,2850000,6790000,2350000,21,theme.ink,false,id++);
 }else if(slide.layout==='split'){
  shapes+=ii15Rect(6770000,2700000,4710000,2520000,theme.panel,id++);
  shapes+=ii15Tx(slide.body,margin,2770000,5400000,2800000,21,theme.ink,false,id++);
  shapes+=ii15Tx(slide.notes?.slice(0,370)||'RESEARCH / RISKS / DILIGENCE',7030000,2950000,4040000,2080000,17,theme.ink,false,id++);
 }else if(slide.layout==='evidence'){
  shapes+=ii15Rect(margin,2700000,10800000,2370000,theme.panel,id++);
  shapes+=ii15Tx(slide.body,margin+310000,2910000,10080000,2000000,22,theme.ink,false,id++);
 }else{
  shapes+=ii15Tx(slide.body,margin,2850000,10300000,2440000,23,theme.ink,false,id++);
 }
 shapes+=ii15Rect(margin,6050000,10700000,15000,theme.accent,id++);
 shapes+=ii15Tx(source,margin,6200000,9800000,340000,9,theme.muted,false,id++);
 shapes+=ii15Tx(String(n).padStart(2,'0'),11120000,6180000,460000,380000,13,theme.muted,true,id++);
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="'+II15_A+'" xmlns:r="'+II15_R+'" xmlns:p="'+II15_P+'"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+shapes+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}
function ii15Rel(target,type,id){return '<Relationship Id="rId'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'+type+'" Target="'+target+'"/>'}
const ii15Rels=x=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+x+'</Relationships>';
function ii15ThemeXML(){
 const co=(k,v)=>'<a:'+k+'><a:srgbClr val="'+v+'"/></a:'+k+'>';
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="'+II15_A+'" name="SELF Investment"><a:themeElements><a:clrScheme name="SELF">'+co('dk1','152D4B')+co('lt1','FFFFFF')+co('dk2','243A53')+co('lt2','F7F9FB')+['235F9A','B99866','3D8074','789AB5','856F9C','8A987B'].map((c,i)=>co('accent'+(i+1),c)).join('')+co('hlink','235F9A')+co('folHlink','745490')+'</a:clrScheme><a:fontScheme name="SELF"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="SELF"><a:fillStyleLst><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:solidFill><a:schemeClr val="accent2"/></a:solidFill><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="accent2"/></a:solidFill></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:solidFill><a:schemeClr val="lt2"/></a:solidFill><a:solidFill><a:schemeClr val="dk1"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>';
}
function ii15PPTXFiles(deck,themeName='navy'){
 const t=II15_THEMES[themeName]||II15_THEMES.navy;
 const out={};
 let overrides=['<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>','<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>','<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>','<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>','<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>','<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'];
 const slides=deck.map((slide,i)=>{const n=i+1;overrides.push('<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');out['ppt/slides/slide'+n+'.xml']=ii15SlideXML(slide,n,t);out['ppt/slides/_rels/slide'+n+'.xml.rels']=ii15Rels(ii15Rel('../slideLayouts/slideLayout1.xml','slideLayout',1));return '<p:sldId id="'+(255+n)+'" r:id="rId'+(n+1)+'"/>';});
 out['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+overrides.join('')+'</Types>';
 out['_rels/.rels']=ii15Rels('<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>');
 out['ppt/presentation.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="'+II15_A+'" xmlns:r="'+II15_R+'" xmlns:p="'+II15_P+'"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>'+slides.join('')+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
 out['ppt/_rels/presentation.xml.rels']=ii15Rels(ii15Rel('slideMasters/slideMaster1.xml','slideMaster',1)+deck.map((s,i)=>ii15Rel('slides/slide'+(i+1)+'.xml','slide',i+2)).join(''));
 const base='<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
 out['ppt/slideMasters/slideMaster1.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="'+II15_A+'" xmlns:r="'+II15_R+'" xmlns:p="'+II15_P+'"><p:cSld name="SELF Investment"><p:spTree>'+base+'</p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink" tx1="dk1" bg1="lt1" tx2="dk2" bg2="lt2"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>';
 out['ppt/slideMasters/_rels/slideMaster1.xml.rels']=ii15Rels(ii15Rel('../slideLayouts/slideLayout1.xml','slideLayout',1)+ii15Rel('../theme/theme1.xml','theme',2));
 out['ppt/slideLayouts/slideLayout1.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="'+II15_A+'" xmlns:r="'+II15_R+'" xmlns:p="'+II15_P+'" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>'+base+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
 out['ppt/slideLayouts/_rels/slideLayout1.xml.rels']=ii15Rels(ii15Rel('../slideMasters/slideMaster1.xml','slideMaster',1));
 out['ppt/theme/theme1.xml']=ii15ThemeXML();
 out['docProps/app.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>SELF Investment Intelligence</Application><Slides>'+deck.length+'</Slides><PresentationFormat>On-screen Show (16:9)</PresentationFormat></Properties>';
 out['docProps/core.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Shopify 2010 — Independent Investment Case</dc:title><dc:creator>SELF Investment Intelligence User</dc:creator><dc:description>Unreviewed independent historical re-underwriting; not real deal participation.</dc:description></cp:coreProperties>';
 return out;
}
let II15_CRC_TABLE=null;
function ii15CRC(arr){
 if(!II15_CRC_TABLE){II15_CRC_TABLE=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;II15_CRC_TABLE[i]=c>>>0}}
 let crc=0xFFFFFFFF;for(let i=0;i<arr.length;i++)crc=II15_CRC_TABLE[(crc^arr[i])&255]^(crc>>>8);return (crc^0xFFFFFFFF)>>>0;
}
function ii15Zip(files){
 const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
 const U16=(d,o,v)=>d.setUint16(o,v,true),U32=(d,o,v)=>d.setUint32(o,v>>>0,true);
 for(const [path,contents] of Object.entries(files)){
  const filename=encoder.encode(path),bytes=encoder.encode(contents),crc=ii15CRC(bytes);
  const h=new Uint8Array(30+filename.length),v=new DataView(h.buffer);
  U32(v,0,0x04034B50);U16(v,4,20);U16(v,6,0x0800);U16(v,8,0);U16(v,10,0);U16(v,12,0);U32(v,14,crc);U32(v,18,bytes.length);U32(v,22,bytes.length);U16(v,26,filename.length);U16(v,28,0);h.set(filename,30);
  chunks.push(h,bytes);
  const cd=new Uint8Array(46+filename.length),c=new DataView(cd.buffer);
  U32(c,0,0x02014B50);U16(c,4,20);U16(c,6,20);U16(c,8,0x0800);U16(c,10,0);U16(c,12,0);U16(c,14,0);U32(c,16,crc);U32(c,20,bytes.length);U32(c,24,bytes.length);U16(c,28,filename.length);U16(c,30,0);U16(c,32,0);U16(c,34,0);U16(c,36,0);U32(c,38,0);U32(c,42,offset);cd.set(filename,46);central.push(cd);
  offset+=h.length+bytes.length;
 }
 const centralLength=central.reduce((a,x)=>a+x.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
 U32(e,0,0x06054B50);U16(e,4,0);U16(e,6,0);U16(e,8,central.length);U16(e,10,central.length);U32(e,12,centralLength);U32(e,16,offset);U16(e,20,0);
 chunks.push(...central,end);
 return new Blob(chunks,{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
}
function ii15Download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function ii15ExportPPTX(){
 if(!ii15State.deck.length){if(typeof toast==='function')toast('Tambahkan minimal satu slide.');return}
 const b=ii15Zip(ii15PPTXFiles(ii15State.deck,ii15State.theme));
 ii15Download(b,'SELF_Shopify_2010_Editable_IC_Deck.pptx');
 ii15State.lastDeckExport=new Date().toISOString();ii15Save();if(typeof toast==='function')toast('Editable PowerPoint exported. Review the layout in PowerPoint before sharing.');
}
function ii15ExportJSON(){
 const payload={format:'SELF-Investment-Deck-v1',asOf:'2010-10-12',historicalSimulation:true,theme:ii15State.theme,slides:ii15State.deck.map(x=>({...x,source:ii15Source(x.evidenceId)?.source||''})),quality:ii15DeckAudit()};
 ii15Download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),'SELF_Shopify_2010_Deck_Source.json');
}
function ii15ExportAnswers(){
 let lines=['# SELF — Shopify 2010 IC Defense Notes','','Independent as-of investment case simulation; not an actual IC meeting.',''];
 for(const q of II15_QUESTIONS){
  const evidence=ii15Source(ii15State.selectedEvidence[q.id]);lines.push('## '+q.group+' — '+q.title,'Question: '+q.prompt,'Answer: '+(ii15State.answers[q.id]||'(not written)'),'Follow-up: '+q.challenge,'Response: '+(ii15State.followups[q.id]||'(not written)'),'Evidence: '+(evidence?evidence.title+' — '+evidence.source+' ['+evidence.kind+']':'(none)'),'');
 }
 lines.push('## Completeness report',...ii15DefenseReport().results.flatMap(x=>[x.title+' → '+(x.issues.length?x.issues.join(' | '):'prepared for discussion')]));
 ii15Download(new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),'SELF_Shopify_2010_IC_Defense_Notes.md');
}
document.addEventListener('click',function(event){
 const el=event.target.closest('[data-ii15]');if(!el)return;
 event.preventDefault();const action=el.dataset.ii15,val=el.dataset.value;
 if(action==='screen'){ii15State.screen=val;if(val==='deck')ii15DeckInit();ii15Save();render()}
 else if(action==='question'){ii15State.question=val;ii15Save();render()}
 else if(action==='rubric'){ii15State.showRubric=!ii15State.showRubric;ii15Save();render()}
 else if(action==='save-defense'){ii15Save();if(typeof toast==='function')toast(ii15QuestionIssue(II15_QUESTIONS.find(q=>q.id===ii15State.question)).length?'Answer saved locally. Check missing evidence and follow-up.':'Prepared for discussion (not professionally graded).');render()}
 else if(action==='theme'){ii15State.theme=val;ii15Save();render()}
 else if(action==='import-memo'){
  const existing=new Set(ii15State.deck.map(x=>x.id));
  const seeds=ii15DefaultSlides().filter(x=>!existing.has(x.id));
  ii15State.deck.push(...seeds.slice(0,Math.max(0,16-ii15State.deck.length)));
  ii15State.started=true;ii15State.activeSlide=ii15State.activeSlide||ii15State.deck[0]?.id||'';ii15Save();render();
 }
 else if(action==='add-slide'){
  if(ii15State.deck.length>=16){if(typeof toast==='function')toast('Max 16 slides in this draft deck.');return}
  const s={id:ii15DeckId(),layout:'statement',kicker:'SHOPIFY / 2010',title:'Your original investment claim',body:'',metric:'',metricLabel:'',evidenceId:'',notes:''};
  ii15State.deck.push(s);ii15State.activeSlide=s.id;ii15State.started=true;ii15Save();render();
 }
 else if(action==='select-slide'){ii15State.activeSlide=val;ii15Save();render()}
 else if(['slide-up','slide-down','slide-delete'].includes(action)){
  const i=ii15State.deck.findIndex(x=>x.id===val);if(i<0)return;
  if(action==='slide-delete'){ii15State.deck.splice(i,1);ii15State.activeSlide=ii15State.deck[Math.min(i,ii15State.deck.length-1)]?.id||''}
  else {const to=i+(action==='slide-up'?-1:1);if(to>=0&&to<ii15State.deck.length){const arr=ii15State.deck;[arr[i],arr[to]]=[arr[to],arr[i]]}}
  ii15Save();render();
 }
 else if(action==='save-slide'){ii15Save();render();if(typeof toast==='function')toast('Slide text saved locally.')}
 else if(action==='audit'){
  const d=ii15DeckAudit();if(typeof toast==='function')toast(d.critical+' critical source/model flags; '+d.weak+' drafting flags. Inspect slide QA panels.');
 }
 else if(action==='export-pptx')ii15ExportPPTX()
 else if(action==='export-json')ii15ExportJSON()
 else if(action==='export-defense')ii15ExportAnswers()
},true);
document.addEventListener('input',function(event){
 const answer=event.target.closest('[data-ii15-answer]');
 if(answer){ii15State.answers[answer.dataset.ii15Answer]=ii15SafeText(answer.value,6000);ii15Save();return}
 const follow=event.target.closest('[data-ii15-followup]');
 if(follow){ii15State.followups[follow.dataset.ii15Followup]=ii15SafeText(follow.value,4000);ii15Save();return}
 const field=event.target.closest('[data-ii15-edit]');
 if(field){const active=ii15Active(),k=field.dataset.ii15Edit;if(active&&['kicker','title','body','metric','metricLabel','notes'].includes(k)){active[k]=ii15SafeText(field.value,{kicker:150,title:240,body:1400,metric:75,metricLabel:110,notes:2400}[k]);ii15Save()}}
},true);
document.addEventListener('change',function(event){
 const field=event.target.closest('[data-ii15-evidence]');
 if(field){ii15State.selectedEvidence[field.dataset.ii15Evidence]=ii15SafeText(field.value,80);ii15Save();render();return}
 const sel=event.target.closest('select[data-ii15-edit]');
 if(sel){const active=ii15Active(),k=sel.dataset.ii15Edit;if(active&&(k==='layout'||k==='evidenceId')){if(k==='layout'&&!II15_LAYOUTS.includes(sel.value))return;active[k]=sel.value;ii15Save();render()}}
},true);
