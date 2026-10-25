/* Studio recipes: the JSON is valid, every recipe expands to non-overlapping frames and cards inside their frames, chains and links resolve, substitution is plain text. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../studio-recipes.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/studio-recipes.json'),'utf8'));
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
eq(R.validate(data),[],'shipped recipes are valid');
eq(data.recipes.map(r=>r.id),['issue-tree','deal-thesis','ic-memo','story-bank','company-map','weekly-map']);
for(const r of data.recipes){
 const fill=r.needs?{company:'Northstar Capital',people:[{name:'Sari Anindya',role:'Associate',stage:'Connected'},{name:'Rina W.',role:'VP'}]}:{};
 const x=R.expandRecipe(r,fill);
 ok(!x.error,r.id+' expands');
 const frames=x.objects.filter(o=>o.kind==='frame'),cards=x.objects.filter(o=>o.kind!=='frame');
 eq(frames.length,x.frames,r.id+' frame count includes the guide frame');ok(frames.length===r.frames.length+1);
 ok(x.objects.length<=48,r.id+' stays small enough to insert quickly');
 const keys=new Set(x.objects.map(o=>o.key));eq(keys.size,x.objects.length,r.id+' keys are unique');
 for(let i=0;i<frames.length;i++)for(let j=i+1;j<frames.length;j++)ok(!R.overlaps(frames[i],frames[j]),r.id+' frames '+i+' and '+j+' do not overlap');
 for(const c of cards){
  const inside=frames.filter(f=>c.x>=f.x&&c.y>=f.y&&c.x+c.w<=f.x+f.w&&c.y+c.h<=f.y+f.h);
  eq(inside.length,1,r.id+' card '+c.key+' sits inside exactly one frame');
 }
 for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)ok(!R.overlaps(cards[i],cards[j]),r.id+' cards '+cards[i].key+' and '+cards[j].key+' do not overlap');
 for(const e of x.edges){ok(keys.has(e.from)&&keys.has(e.to),r.id+' edge endpoints exist');ok(e.from!==e.to)}
 const chain=x.edges.filter(e=>e.from.startsWith('f:')&&e.to.startsWith('f:'));eq(chain.length,frames.length-1,r.id+' frames form one chain, so Present has an order');
 eq(frames[0].title,'How to use this');eq(cards[0].title,'Structure guide');ok(cards[0].summary.length>40);ok(/template/i.test(cards[0].summary),r.id+' guide says it is a template');
 ok(!/certified|guarantee|official/i.test(JSON.stringify(r)),r.id+' makes no authority claim');
 for(const o of x.objects){ok(Number.isFinite(o.x)&&Number.isFinite(o.y)&&o.w>0&&o.h>0,'finite geometry');ok(String(o.title).length<=160)}
}
/* company map: needs a company, fills the title, creates one card per person */
const cm=data.recipes.find(r=>r.id==='company-map');
ok(R.expandRecipe(cm,{}).error.startsWith('Fill in: company'));ok(R.expandRecipe(cm,{company:'   '}).error);
{const x=R.expandRecipe(cm,{company:'Northstar Capital',people:[{name:'Sari Anindya',role:'Associate',stage:'Connected'},{name:'Rina W.',role:'VP'},{name:'  '}]});
 eq(x.objects.filter(o=>o.kind==='frame').map(o=>o.title),['How to use this','Northstar Capital','People','Applications','Open questions','Notes']);
 const ppl=x.objects.filter(o=>o.key.startsWith('c:pe:'));eq(ppl.map(p=>p.title),['Sari Anindya','Rina W.'],'blank names are skipped');eq(ppl[0].summary,'Associate · Connected');eq(ppl[1].summary,'VP')}
{const x=R.expandRecipe(cm,{company:'X'});eq(x.objects.filter(o=>o.key.startsWith('c:pe:')).length,3,'three placeholders when there are no people')}
{const many=Array.from({length:30},(_,i)=>({name:'P'+i}));const x=R.expandRecipe(cm,{company:'X',people:many});eq(x.objects.filter(o=>o.key.startsWith('c:pe:')).length,12,'people are capped at 12')}
/* substitution is plain text and never breaks out */
eq(R.fillText('Map: {company}',{company:'<img src=x onerror=1>'}),'Map: <img src=x onerror=1>','left as text; the canvas escapes on render');
eq(R.fillText('{company} {unknown}',{company:'A'}),'A {unknown}','unknown placeholders stay visible');eq(R.fillText('{company}',{company:''}),'{company}');eq(R.fillText('x {company}',{company:'a\u0000b\nc'}),'x ab c','control characters are removed and whitespace collapsed');
eq(R.clean('a'.repeat(500)).length,160);
/* validation catches broken recipes */
const broken=JSON.parse(JSON.stringify(data));broken.recipes[0].frames[0].cards[0].kind='bogus';broken.recipes[1].links=[['zz:0','t:0']];broken.recipes[2].id='issue-tree';
const errs=R.validate(broken);ok(errs.some(e=>/unknown card kind/.test(e)));ok(errs.some(e=>/bad link/.test(e)));ok(errs.some(e=>/duplicate id/.test(e)));
eq(R.validate({version:2,recipes:[]}),['Recipe data is not version 1.']);
console.log('PASS Studio recipes: '+n+' checks (valid JSON, no overlaps, cards inside frames, chains and links resolve, company map fill, plain-text substitution, validation).');
