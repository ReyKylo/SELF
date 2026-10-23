/* Deploy contract: the Worker config must build its own assets, so an empty dashboard "Build command" cannot produce a deploy with no ./dist. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
assert.equal(cfg.name,'self','keeps the existing Worker name');
assert.equal(cfg.assets?.directory,'./dist','serves the built ./dist');
assert.equal(cfg.assets?.not_found_handling,'single-page-application');
assert.equal(cfg.build?.command,'python3 tools/build_cloudflare.py','wrangler runs the asset build itself');
assert(fs.existsSync(path.join(root,'tools/build_cloudflare.py')),'build script exists');
assert(!cfg.main,'static-assets-only Worker; no script entry');
assert(/^dist\/?$/m.test(fs.readFileSync(path.join(root,'.gitignore'),'utf8')),'build output is not committed');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
assert(/wrangler\.jsonc[^\n]*build/i.test(readme)||/build\.command/.test(readme),'README documents that wrangler builds the assets');
console.log('PASS deploy config: wrangler.jsonc builds its own ./dist; dist is ignored');
