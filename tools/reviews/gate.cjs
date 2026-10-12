const fs = require('node:fs');
const a = JSON.parse(fs.readFileSync('artifacts/looker-a/report.json'));
const b = JSON.parse(fs.readFileSync('artifacts/looker_b/report.json'));
const q = JSON.parse(fs.readFileSync('artifacts/qa_b/qa-b.json'));
for (const [name, build, entries] of [['A',a.build,a.captures],['B',b.build,b.cases],['QA',q.buildId,q.results]]) {
  if (build !== process.env.GITHUB_SHA || !Array.isArray(entries) || !entries.length) {
    throw new Error(`Incomplete or mismatched ${name} evidence for ${process.env.GITHUB_SHA}`);
  }
}
const failures = [
  ...a.defects.filter(d => ['major','blocker'].includes(d.severity)), ...a.errors,
  ...(a.blocked ? [a.blocked] : []),
  ...b.cases.filter(c => c.status === 'FAILED'), ...b.errors,
  ...q.results.filter(c => c.status === 'FAIL')
];
console.log(JSON.stringify({gate:'Automated checks only; independent image critique still required',failures},null,2));
if (failures.length) process.exitCode = 1;
