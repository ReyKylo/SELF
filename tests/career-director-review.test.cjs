#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const d=JSON.parse(read('content/career-director-review/review-panels.json'));
assert.equal(d.phase,5);
assert.deepEqual(d.tracks.map(t=>t.id),['PE','VC','CONSULTING']);
assert.equal(d.rubric.reduce((n,x)=>n+x.points,0),100);
assert.equal(new Set(d.critical_gates).size,d.critical_gates.length);
const ids=[];
for(const t of d.tracks){
 assert.equal(t.challenges.length,5);
 assert.ok(t.twist.announcement.includes('SIMULATED'));
 for(const q of t.challenges){ids.push(q.id);assert.ok(q.prompt.length>30);assert.ok(q.evidence.length>=2)}
}
assert.equal(new Set(ids).size,15);
const source=read('career-director-review.js'),ui=read('career-learning.js'),html=read('index.html'),build=read('tools/build_cloudflare.py');
for(const snippet of ['window.SELFDirectorReview','data-director-action="submit"','data-director-action="export"','SIMULATED','host?.render','state.submitted=true'])assert.ok(source.includes(snippet),'module missing '+snippet);
assert.ok(!source.includes('localStorage')&&!source.includes('supabase'),'no persistent storage');
assert.ok(ui.includes("['director','Director Review']"));
for(const entry of ['render','action','input','change','reset','init'])assert.ok(ui.includes('SELFDirectorReview?.'+entry+'?.('),'missing wiring '+entry);
assert.ok(html.includes('src="./career-director-review.js"'));
assert.ok(build.includes('"career-director-review.js"'));
assert.ok(build.includes('"content/career-director-review/review-panels.json"'));
console.log('Director Review schema and static integration checks PASS');
