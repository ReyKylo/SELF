/* Walkthrough core: slide order (chain, reading order, leftovers, cycles), camera fit, easing, pace. */
const assert=require('node:assert/strict');
const P=require('../studio-present.js'),R=require('../studio-recipes.js'),fs=require('node:fs'),path=require('node:path');
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};const ok=(c,m)=>{assert.ok(c,m);n++};
const F=(id,x,y,w=300,h=200)=>({id,visual_kind:'frame',x,y,w,h});
const C=(id,x,y)=>({id,visual_kind:'sticky',x,y,w:100,h:100});
const E=(a,b)=>({source_item_id:a,target_item_id:b});
/* reading order: rows then columns, regardless of array order */
const items=[F('d',700,330),F('b',350,10),F('a',0,0),F('c',20,340),C('s',5,5),F('e',350,700)];
eq(P.slideOrder(items,[]).map(f=>f.id),['a','b','c','d','e'],'rows top to bottom, then left to right; non-frames are never slides');
eq(P.slideOrder([C('s',0,0)],[]),[],'no frames, no slides');eq(P.slideOrder([],[]),[]);eq(P.slideOrder(null,null),[]);
/* a row is tolerant of small y differences */
eq(P.slideOrder([F('r2',400,12),F('r1',0,0),F('r3',800,5)],[]).map(f=>f.id),['r1','r2','r3'],'frames a few pixels apart read as one row');
/* a chain overrides reading order */
eq(P.slideOrder(items,[E('c','a'),E('a','e'),E('e','b')]).map(f=>f.id),['c','a','e','b','d'],'chain c→a→e→b, then the leftover d in reading order');
/* edges to or from non-frames are ignored */
eq(P.slideOrder(items,[E('s','a'),E('b','s')]).map(f=>f.id),['a','b','c','d','e']);
/* branching follows reading order of the targets; each frame appears once */
eq(P.slideOrder([F('a',0,0),F('b',400,0),F('c',800,0)],[E('a','c'),E('a','b')]).map(f=>f.id),['a','b','c']);
eq(P.slideOrder([F('a',0,0),F('b',400,0),F('c',800,0)],[E('a','b'),E('b','c'),E('c','a')]).map(f=>f.id),['a','b','c'],'a cycle still terminates');
eq(P.slideOrder([F('a',0,0)],[E('a','a')]).map(f=>f.id),['a'],'self edge');
eq(P.slideOrder([F('a',0,0),F('b',400,0)],[E('a','b'),E('a','b')]).map(f=>f.id),['a','b'],'duplicate edges');
/* every shipped recipe presents in its own frame order */
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/studio-recipes.json'),'utf8'));
for(const r of data.recipes){
 const x=R.expandRecipe(r,r.needs?{company:'X'}:{});
 const its=x.objects.map((o,i)=>({id:o.key,visual_kind:o.kind,x:o.x,y:o.y,w:o.w,h:o.h})).reverse();
 const edges=x.edges.map(e=>({source_item_id:e.from,target_item_id:e.to}));
 eq(P.slideOrder(its,edges).map(f=>f.id),x.objects.filter(o=>o.kind==='frame').map(o=>o.key),r.id+' presents guide first, then each frame in order');
}
/* camera */
const vp={w:1000,h:700};
{const c=P.fitRect({x:100,y:50,w:500,h:300},vp);ok(c.zoom>0&&Number.isFinite(c.pan.x));
 const cx=(100+250)*c.zoom+c.pan.x,cy=(50+150)*c.zoom+c.pan.y;ok(Math.abs(cx-500)<2,'centred horizontally');ok(Math.abs(cy-(700-84)/2)<2,'centred above the progress strip');
 ok(100*c.zoom+c.pan.x>=0&&600*c.zoom+c.pan.x<=1000,'the frame fits across');ok(50*c.zoom+c.pan.y>=0&&350*c.zoom+c.pan.y<=700-84,'and down')}
eq(P.fitRect({x:0,y:0,w:10,h:10},vp).zoom,2.5,'a tiny frame is capped at 250%');ok(P.fitRect({x:0,y:0,w:100000,h:100000},vp).zoom>=0.1,'a huge frame is floored');
{const a=P.fitRect({x:0,y:0,w:400,h:300},{w:390,h:844});ok(a.zoom<1,'phone viewport zooms out');}
/* easing and interpolation */
eq([P.ease(-1),P.ease(0),P.ease(1),P.ease(2)],[0,0,1,1]);ok(P.ease(.5)===.5);ok(P.ease(.25)<.25&&P.ease(.75)>.75,'slow in, slow out');
{const a={zoom:1,pan:{x:0,y:0}},b={zoom:4,pan:{x:100,y:-50}};eq(P.camAt(a,b,0),a);const e=P.camAt(a,b,1);eq([Math.round(e.zoom*1000)/1000,e.pan],[4,{x:100,y:-50}]);ok(Math.abs(P.camAt(a,b,.5).zoom-2)<1e-9,'zoom halves in log space')}
/* pace */
eq(P.pace(0,5,0,300000),{state:'on',diffMs:0});eq(P.pace(2,5,150000,300000).state,'behind','2 of 5 slides done should take 2 min; 2.5 min is behind');eq(P.pace(2,5,150000,300000).diffMs,30000);
eq(P.pace(3,5,100000,300000).state,'ahead');eq(P.pace(1,5,63000,300000).state,'on','within five seconds counts as on pace');eq(P.pace(1,5,10,0),null);eq(P.pace(1,0,10,1000),null);
eq([P.clock(0),P.clock(65000),P.clock(3599000),P.clock(-5)],['00:00','01:05','59:59','00:00']);
console.log('PASS Walkthrough core: '+n+' checks (reading order, chains, cycles, recipe order, camera fit, easing, pace).');
