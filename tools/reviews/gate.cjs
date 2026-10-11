const fs = require('node:fs');
const a = JSON.parse(fs.readFileSync('artifacts/looker-a/report.json'));
const b = JSON.parse(fs.readFileSync('artifacts/looker_b/report.json'));
const q = JSON.parse(fs.readFileSync('artifacts/qa_b/qa-b.json'));
const failures = [
  ...a.defects.filter(d => d.severity === 'major'), ...a.errors,
  ...(a.blocked ? [a.blocked] : []),
  ...b.cases.filter(c => c.status === 'FAILED'), ...b.errors,
  ...q.results.filter(c => c.status === 'FAIL')
];
console.log(JSON.stringify({gate:'Automated checks only; independent image critique still required',failures},null,2));
if (failures.length) process.exitCode = 1;
