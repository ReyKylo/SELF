'use strict';
/**
 * Fail worker PRs that touch another workstream or shared app/DB/CI paths.
 * Applies only to branches named feat/self-career-case-{pe|vc|consulting}-*.
 * Integration branches intentionally require normal human review instead.
 */
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const roles={
 pe:['content/career-cases/pe/','tests/cases/pe/'],
 vc:['content/career-cases/vc/','tests/cases/vc/'],
 consulting:['content/career-cases/consulting/','tests/cases/consulting/']
};
function kind(branch){
 const match=/^feat\/self-career-case-(pe|vc|consulting)-[a-zA-Z0-9._-]+$/.exec(branch||'');
 return match?.[1]||null;
}
function violations(branch,paths){
 const track=kind(branch);if(!track)return [];
 return paths.filter(p=>!roles[track].some(prefix=>p.startsWith(prefix)));
}
if(process.argv.includes('--self-test')){
 assert.equal(kind('feat/self-career-case-pe-20261022'),'pe');
 assert.equal(kind('feat/self-career-case-consulting-20261022'),'consulting');
 assert.equal(kind('feat/normal-integration'),null);
 assert.deepEqual(violations('feat/self-career-case-pe-20261022',['content/career-cases/pe/manifest.json','tests/cases/pe/check-case.cjs']),[]);
 assert.deepEqual(violations('feat/self-career-case-pe-20261022',['content/career-cases/vc/manifest.json','app.js','supabase/migrations/schema.sql']),['content/career-cases/vc/manifest.json','app.js','supabase/migrations/schema.sql']);
 assert.deepEqual(violations('feat/self-career-case-vc-20261022',['content/career-learning.json']),['content/career-learning.json']);
 console.log('PASS GptChatMaximize: worker scope enforcement positive/negative examples');
 process.exit(0);
}
const branch=process.env.GITHUB_HEAD_REF||process.env.WORKSTREAM_BRANCH||'';
const track=kind(branch);
if(!track){console.log('GptChatMaximize: no specialist branch detected; standard PR review still required.');process.exit(0)}
const baseName=process.env.GITHUB_BASE_REF||'main';
let changed;
try{
 const base='origin/'+baseName;
 const common=execFileSync('git',['merge-base',base,'HEAD'],{encoding:'utf8'}).trim();
 changed=execFileSync('git',['diff','--name-only','--diff-filter=ACDMRT',common,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
}catch(e){
 console.error('GptChatMaximize scope guard could not compare PR with '+baseName+'. Do NOT skip this safety check.');
 console.error(e.message);
 process.exit(1);
}
const invalid=violations(branch,changed);
if(invalid.length){
 console.error('GptChatMaximize blocked '+branch+': files outside '+track+' scope:');
 invalid.forEach(s=>console.error(' - '+s));
 console.error('Move shared changes into a dedicated Integrator PR; do not bypass path ownership.');
 process.exit(1);
}
console.log('PASS GptChatMaximize worker scope: '+branch+' has '+changed.length+' owned changed paths');
