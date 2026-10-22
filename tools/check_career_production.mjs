#!/usr/bin/env node
/** SELF Career Prep production parity — READ ONLY, no auth, no remote writes or deploy. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_ASSETS = Object.freeze([
  'index.html',
  'career-learning.js',
  'career-director-review.js',
  'content/career-director-review/review-panels.json'
]);
export const PRIVATE_PATHS = Object.freeze([
  'AGENTS.md',
  'tests/career-director-review.test.cjs',
  'content/career-cases/pe/README.md'
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function verifiedOrigin(value, { allowLocal = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) throw Error('Provide a verified production HTTPS origin.');
  let url;
  try { url = new URL(value); } catch { throw Error('Production origin is not a valid URL.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(allowLocal && local && url.protocol === 'http:')) {
    throw Error('Production audit requires HTTPS (HTTP permitted only for isolated loopback tests).');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw Error('Supply only the origin, without credentials, path, query, or fragment.');
  }
  return url.origin;
}

async function getAsset(origin, path, fetchImpl) {
  const response = await fetchImpl(origin + '/' + path, {
    method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(12000),
    headers: { 'cache-control': 'no-cache' }
  });
  return { status: response.status, mime: response.headers.get('content-type') || '', bytes: Buffer.from(await response.arrayBuffer()) };
}

export async function auditOrigin(value, { allowLocal = false, rootDir = ROOT, fetchImpl = fetch } = {}) {
  const origin = verifiedOrigin(value, { allowLocal });
  const fingerprints = {};
  let liveIndex;
  for (const path of PUBLIC_ASSETS) {
    const live = await getAsset(origin, path, fetchImpl);
    if (live.status !== 200) throw Error('Public asset ' + path + ': expected HTTP 200, got ' + live.status);
    const expectedMime = path.endsWith('.json') ? /\bjson\b/i : path.endsWith('.js') ? /javascript/i : /text\/html/i;
    if (!expectedMime.test(live.mime)) throw Error('Public asset ' + path + ': unexpected MIME ' + (live.mime || '(missing)') + '. SPA fallback is not an asset.');
    const expected = await readFile(join(rootDir, path));
    if (!live.bytes.equals(expected)) throw Error('Live asset mismatch: ' + path + '. Current origin is NOT verified at this commit.');
    fingerprints[path] = sha(live.bytes);
    if (path === 'index.html') liveIndex = live.bytes;
    if (path.endsWith('review-panels.json')) {
      const panels = JSON.parse(live.bytes.toString('utf8'));
      if (panels.phase !== 5 || panels.tracks?.length !== 3 || panels.tracks.some(t => t.challenges?.length !== 5 || t.challenges.some(q => 'trap' in q))) {
        throw Error('Director Review JSON contract or answer privacy check failed.');
      }
    }
  }
  for (const path of PRIVATE_PATHS) {
    const live = await getAsset(origin, path, fetchImpl);
    if (live.status === 403 || live.status === 404) continue;
    // Cloudflare SPA fallback may return 200 with the exact same index.html body.
    if (live.status === 200 && /text\/html/i.test(live.mime) && live.bytes.equals(liveIndex)) continue;
    throw Error('Private source exposure or unexpected response: ' + path + ' (HTTP ' + live.status + ', ' + live.mime + ').');
  }
  return { outcome: 'PASS', origin, publicAssets: PUBLIC_ASSETS.length, privatePaths: PRIVATE_PATHS.length, fingerprints };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const idx = process.argv.indexOf('--origin');
  if (idx < 0 || !process.argv[idx + 1]) {
    console.error('Usage: node tools/check_career_production.mjs --origin https://verified-production-host');
    process.exitCode = 2;
  } else {
    try {
      const result = await auditOrigin(process.argv[idx + 1]);
      console.log('SELF READ-ONLY PRODUCTION PARITY: PASS');
      console.log(JSON.stringify(result, null, 2));
      console.log('Static files only. Does NOT verify Cloudflare deployment ID or authenticated UX.');
    } catch (err) {
      console.error('SELF READ-ONLY PRODUCTION PARITY: FAIL:', err.message);
      process.exitCode = 1;
    }
  }
}
