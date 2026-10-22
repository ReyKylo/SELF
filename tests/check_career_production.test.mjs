#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { auditOrigin, verifiedOrigin, PUBLIC_ASSETS, PRIVATE_PATHS } from '../tools/check_career_production.mjs';

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'self-parity-'));
  const panel = {
    phase: 5,
    tracks: ['PE', 'VC', 'CONSULTING'].map(id => ({
      id, challenges: Array.from({ length: 5 }, (_, n) => ({ id: id + n, prompt: 'Verify cash', evidence: ['Exhibit'] }))
    }))
  };
  const contents = new Map([
    ['index.html', '<!doctype html><html lang="id"><body>SELF Phase 5</body></html>'],
    ['career-learning.js', '(function(){ /* Career Prep */ })();'],
    ['career-director-review.js', '(function(){ /* Director Review */ })();'],
    ['content/career-director-review/review-panels.json', JSON.stringify(panel)]
  ]);
  for (const [path, body] of contents) {
    await mkdir(dirname(join(rootDir, path)), { recursive: true });
    await writeFile(join(rootDir, path), body);
  }
  const overrides = new Map();
  const hits = [];
  const server = createServer((req, res) => {
    hits.push({ method: req.method, path: req.url });
    const path = req.url?.slice(1);
    const mock = overrides.get(path);
    const text = mock?.body ?? (contents.get(path) || contents.get('index.html'));
    const status = mock?.status || 200;
    const mime = mock?.mime || (contents.has(path)
      ? path.endsWith('.json') ? 'application/json' : path.endsWith('.js') ? 'text/javascript' : 'text/html'
      : 'text/html');
    res.writeHead(status, { 'content-type': mime });
    res.end(text);
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  return {
    rootDir, overrides, hits,
    origin: 'http://127.0.0.1:' + server.address().port,
    close: async () => {
      await new Promise(ok => server.close(ok));
      await rm(rootDir, { recursive: true, force: true });
    }
  };
}

assert.throws(() => verifiedOrigin('http://example.com'), /HTTPS/);
assert.throws(() => verifiedOrigin('https://example.com/path'), /origin/);
assert.throws(() => verifiedOrigin('https://user:pass@example.com/'), /credentials/);
assert.throws(() => verifiedOrigin('http://localhost:8999'), /HTTPS/);
assert.equal(verifiedOrigin('https://self.example.com/'), 'https://self.example.com');
assert.equal(PUBLIC_ASSETS.length, 4);
assert.equal(PRIVATE_PATHS.length, 3);

const mock = await fixture();
try {
  const opts = { allowLocal: true, rootDir: mock.rootDir };
  assert.equal((await auditOrigin(mock.origin, opts)).outcome, 'PASS');
  assert.equal(mock.hits.length, 7);
  assert.ok(mock.hits.every(h => h.method === 'GET'), 'never mutate production');

  mock.overrides.set('career-director-review.js', { body: '/* stale build */' });
  await assert.rejects(auditOrigin(mock.origin, opts), /Live asset mismatch/);
  mock.overrides.delete('career-director-review.js');

  mock.overrides.set('content/career-director-review/review-panels.json',
    { body: '<html>fallback</html>', mime: 'text/html' });
  await assert.rejects(auditOrigin(mock.origin, opts), /unexpected MIME/);
  mock.overrides.delete('content/career-director-review/review-panels.json');

  mock.overrides.set('AGENTS.md', { body: 'PRIVATE SOURCE', mime: 'text/plain' });
  await assert.rejects(auditOrigin(mock.origin, opts), /Private source exposure/);
  mock.overrides.delete('AGENTS.md');

  mock.overrides.set('AGENTS.md', { body: 'Not found', status: 404 });
  assert.equal((await auditOrigin(mock.origin, opts)).outcome, 'PASS');
  console.log('SELF production parity: 5 fixture scenarios PASS (positive, stale, SPA fallback, leakage, private 404).');
} finally {
  await mock.close();
}
