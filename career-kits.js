/* SELF original education templates: generated client-side, editable, no paywall or copied files. */
(function(root){
'use strict';
const enc=x=>new TextEncoder().encode(x);
const le=(v,n)=>Array.from({length:n},(_,i)=>(v>>>8*i)&255);
const hex=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function crc(bytes){let c=-1;for(const b of bytes){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^-1)>>>0}
function zipped(files){
 const a=[],dir=[];let pos=0;
 for(const [name,value] of Object.entries(files)){
  const n=enc(name),v=enc(value),crcValue=crc(v);
  const header=[80,75,3,4,20,0,0,0,0,0,0,0,0,0,...le(crcValue,4),...le(v.length,4),...le(v.length,4),...le(n.length,2),0,0,...n];
  a.push(...header,...v);
  dir.push(80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...le(crcValue,4),...le(v.length,4),...le(v.length,4),...le(n.length,2),0,0,0,0,0,0,0,0,0,0,0,0,...le(pos,4),...n);
  pos+=header.length+v.length;
 }
 const count=Object.keys(files).length;
 return new Uint8Array([...a,...dir,80,75,5,6,0,0,0,0,...le(count,2),...le(count,2),...le(dir.length,4),...le(pos,4),0,0]);
}
function pText(text,x,y,w,h,size,bold,color){
 const run=String(text);
 return '<p:sp><p:nvSpPr><p:cNvPr id="'+(Math.abs((x+y+size)*31)%999+2)+'" name="Text"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
 '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'+
 '<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="'+(size*100)+'" b="'+(bold?1:0)+'"><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill></a:rPr><a:t>'+hex(run)+'</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>';
}
function slideXML(slide,i){
 const paras=slide.bullets.map((s,k)=>pText(String(k+1).padStart(2,'0')+'  '+s,700000,2700000+k*620000,10800000,520000,18,false,'334359')).join('');
 const shapes=pText('SELF / CAREER PREP / SIMULATED CASE',650000,350000,10900000,380000,12,true,'52739E')+
 pText(slide.title,700000,980000,10400000,1100000,32,true,'172639')+
 pText(slide.subtitle,700000,2130000,10800000,430000,17,false,'52637B')+
 paras+
 pText(String(i+1).padStart(2,'0')+' / 06  •  YOUR ANALYSIS, NOT AN EXPERT-ENDORSED DELIVERABLE',700000,6220000,10900000,280000,10,false,'77889C');
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'+
 '<p:cSld name="Slide '+(i+1)+'"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+shapes+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}
const slides=[
 {title:'Recommendation — [write one conclusion]',subtitle:'What should management do, how much profit can be recovered, and on what conditions?',bullets:['Decision and quantified expected benefit','Two evidence-backed reasons','Conditions required for approval']},
 {title:'Profit fell because of volume and cost',subtitle:'Make the causal bridge mathematically explicit.',bullets:['Prior profit Rp900m; current Rp300m','Volume impact -Rp400m; variable cost impact -Rp200m','Separate facts from unverified root causes']},
 {title:'Root causes — test before scaling',subtitle:'What drivers explain customer volume and rising unit cost?',bullets:['Declining demand vs lost traffic vs transaction frequency','Price, mix, supplier inflation vs procurement efficiency','What new operational data would prove the hypothesis?']},
 {title:'Initiatives: impact, cost, interaction',subtitle:'Show recurring profit uplift separately from one-off cost.',bullets:['Initiative A — procurement and implementation economics','Initiative B — volume and contribution economics','Prevent overlapping benefits / double counting']},
 {title:'90-day roadmap with decision gates',subtitle:'Make the recommendation executable, not just attractive.',bullets:['Days 01–30: owner and baseline measurement','Days 31–60: pilot design and instrumented test','Days 61–90: scale only if KPIs and quality hold']},
 {title:'Downside, risk and executive ask',subtitle:'What could fail and what decision is needed today?',bullets:['Customer experience, rollout and supplier risks','Downside sensitivity and kill criteria','Executive decision, resources, KPI review cadence']}
];
function makeConsultingDeck(){
 const files={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+slides.map((_,i)=>'<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('')+'</Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>',
 'ppt/presentation.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>'+slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(i+1)+'"/>').join('')+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>',
 'ppt/_rels/presentation.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+slides.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(i+1)+'.xml"/>').join('')+'</Relationships>'
 };
 slides.forEach((slide,i)=>files['ppt/slides/slide'+(i+1)+'.xml']=slideXML(slide,i));
 return zipped(files);
}
const infos={
 PE:{title:'DAY 1 — PRIVATE EQUITY | SELF CoffeeCo',lead:'Acquisition decision, hypothetical USD million',facts:['Year 0 revenue 1,000; EBITDA 100; entry EV at 10.0x EBITDA','New acquisition debt 500; transaction fees 20; sponsor equity 520','Revenue +5% pa; EBITDA margin 10%; D&A and capex 2% of revenue','Delta NWC = 1% of revenue; tax 25%; interest 8% opening debt','FCF is used to repay debt, with remaining excess cash accumulated','Exit at 10x EBITDA in year 5; hurdle IRR 20%'],tasks:['Build sources and uses; confirm funding reconciles.','Model annual revenues, EBITDA, taxes, free cash flow and debt.','Calculate sponsor IRR/MOIC, 8x/10x/12x exit and growth sensitivities.','Write a two-page investment recommendation and risks.'],cautions:['Simulated assumptions, simplified deal terms; not an actual transaction.','Never mislabel copied expert model outputs as independent portfolio.']},
 VC:{title:'DAY 2 — VENTURE CAPITAL | SELF OpsCloud',lead:'Seed financing decision, hypothetical USD',facts:['Cohort A 100 at $100 initial ARPA; 80 at $150 by month 6','Cohort B 120 at $100 initial; 84 at $120 by month 6','Cohort C 150 at $100 initial; 120 at $110 by month 3','Cohort A CAC $30,000 total; blended subscription margin 80%','Cash $1.2m; monthly burn $200k; investment $2m at $8m pre','Future dilution 20%; possible hypothetical exit equity $100m'],tasks:['Calculate same-age retention and net revenue retention.','Build cap table / dilution / ownership and exit outcome scenarios.','Separate pricing, retention and acquisition assumptions from facts.','Write 2-page invest / pass / diligence memo.'],cautions:['Cohort C is only 3 months old, so avoid unfair 6-month comparison.','Company and dataset are simulated, not Bessemer portfolio data.']},
 Consulting:{title:'DAY 3 — CONSULTING | SELF Coffee',lead:'90-day profitability decision, fictional IDR',facts:['Prior 120,000 cups at Rp30,000; costs Rp10,000 variable per cup','Current 100,000 cups at Rp30,000; variable cost Rp12,000','Fixed operating costs Rp1.5bn unchanged','Initiative A saves Rp1,000 per cup; setup cost Rp50m','Initiative B adds 10,000 cups with contribution Rp18,000 each','Annual campaign spend Rp60m; assume no new capacity or capex'],tasks:['Calculate profit bridge: prior to current, revenue/volume and variable costs.','Quantify A, B and combined economics including interactions.','Write root-cause hypotheses and evidence required to confirm.','Build six-slide executive recommendation and 90-day roadmap.'],cautions:['Fictional: do not assert supplier inflation or churn without evidence.','Keep recurring savings separate from one-off cash outlay.']}
};
const safe=x=>String(x).normalize('NFKD').replace(/[^\x20-\x7e]/g,' ').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function wrap(s,max=92){let words=s.split(/\s+/),arr=[],cur='';for(const word of words){if((cur+' '+word).trim().length>max&&cur){arr.push(cur);cur=word}else cur=(cur+' '+word).trim()}if(cur)arr.push(cur);return arr;}
function pdfBrief(track){
 const d=infos[track];if(!d)throw Error('Unknown track');
 const lines=[d.title,d.lead,'','CASE FACTS',...d.facts.map(s=>'  - '+s),'','YOUR ASSIGNMENT',...d.tasks.map((s,i)=>(i+1)+'. '+s),'','PROVENANCE / ETHICS',...d.cautions.map(s=>'  - '+s)];
 const flattened=lines.flatMap(s=>wrap(s,95));const pages=[];for(let i=0;i<flattened.length;i+=36)pages.push(flattened.slice(i,i+36));
 const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
 const ids=[];for(const p of pages){const pId=objects.length,cId=pId+1;ids.push(pId);let content='BT\n';
 p.forEach((line,i)=>{const head=i===0||['CASE FACTS','YOUR ASSIGNMENT','PROVENANCE / ETHICS'].includes(line);
 content+='/F'+(head?'2':'1')+' '+(i===0?16:head?12:10)+' Tf 52 '+(785-i*19)+' Td ('+safe(line)+') Tj\n';if(i<p.length-1)content+='0 0 Td\n';});content+='ET';
 objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents '+cId+' 0 R >>','<< /Length '+enc(content).length+' >>\nstream\n'+content+'\nendstream');
 }
 objects[2]='<< /Type /Pages /Kids ['+ids.map(i=>i+' 0 R').join(' ')+'] /Count '+ids.length+' >>';
 let result='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{if(i===0)return;offsets[i]=enc(result).length;result+=i+' 0 obj\n'+o+'\nendobj\n'});
 const at=enc(result).length;result+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';for(let i=1;i<objects.length;i++)result+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 result+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+at+'\n%%EOF';
 return enc(result);
}
root.SELFCareerKits={makeConsultingDeck,pdfBrief};
})(window);
