const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.test-build');
const wrangler = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));

assert.equal(wrangler.name, 'wattdesk-2026');
assert.equal(wrangler.assets?.directory, './dist');
assert.equal(wrangler.assets?.not_found_handling, 'single-page-application');

fs.rmSync(out, {recursive: true, force: true});
const build = spawnSync(process.execPath, ['scripts/build-site.cjs', '--public', `--out=${out}`], {
  cwd: root,
  encoding: 'utf8'
});
assert.equal(build.status, 0, build.stderr || build.stdout);

const redirects = fs.readFileSync(path.join(out, '_redirects'), 'utf8');
const headers = fs.readFileSync(path.join(out, '_headers'), 'utf8');
assert.match(redirects, /^\/ \/home 308$/m);
assert.match(redirects, /^\/home\.html \/home 308$/m);
assert.match(redirects, /^\/index\.html \/home 308$/m);
assert.doesNotMatch(redirects, /\s\/index\.html 200$/m, 'SPA routes must use Workers Assets fallback, not rewrite loops');
assert.match(headers, /^\/service\/\*$/m, 'service detail HTML must revalidate like its shell');

fs.rmSync(out, {recursive: true, force: true});
console.log(JSON.stringify({ok: true, spaFallback: true, redirectRules: redirects.trim().split('\n').length}));
