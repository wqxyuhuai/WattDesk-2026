const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.test-build');
const wrangler = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));
const inverterWorker = fs.readFileSync(path.join(root, 'deploy/inverter-preview-worker.js'), 'utf8');
const inverterWrangler = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.inverter-preview.jsonc'), 'utf8'));

assert.equal(wrangler.name, 'wattdesk-2026');
assert.equal(wrangler.assets?.directory, './dist');
assert.equal(wrangler.assets?.not_found_handling, 'single-page-application');
assert.equal(inverterWrangler.name, 'wattdesk-inverter-preview');
assert.equal(inverterWrangler.main, './deploy/inverter-preview-worker.js');
assert.match(inverterWorker, /"\/settings"/, 'the standalone settings route stays available');
assert.match(inverterWorker, /"\/setup\/20kw"/, 'the 20 kW initialization route is allowlisted');
assert.match(inverterWorker, /"\/setup\/50kw"/, 'the 50 kW initialization route is allowlisted');
assert.match(inverterWorker, /INITIALIZATION_PATHS\.has\(url\.pathname\)/, 'initialization access must use the exact allowlist');
assert.doesNotMatch(inverterWorker, /startsWith\(["']\/setup\//, 'the standalone domain must not expose every setup path');

fs.rmSync(out, {recursive: true, force: true});
const build = spawnSync(process.execPath, ['scripts/build-site.cjs', '--public', `--out=${out}`], {
  cwd: root,
  env: {...process.env, WATTDESK_MAPBOX_TOKEN: ''},
  encoding: 'utf8'
});
assert.equal(build.status, 0, build.stderr || build.stdout);

const redirects = fs.readFileSync(path.join(out, '_redirects'), 'utf8');
const headers = fs.readFileSync(path.join(out, '_headers'), 'utf8');
assert.match(redirects, /^\/ \/home 308$/m);
assert.match(redirects, /^\/home\.html \/home 308$/m);
assert.match(redirects, /^\/index\.html \/home 308$/m);
assert.doesNotMatch(redirects, /\s\/index\.html 200$/m, 'SPA routes must use Workers Assets fallback, not rewrite loops');
assert.match(headers, /^\/plants\/\*$/m, 'nested plant child pages must revalidate like their shell');
assert.match(headers, /^\/service\/\*$/m, 'service detail HTML must revalidate like its shell');
const defaultHtml = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
assert.match(defaultHtml, /<meta name="mapbox-access-token" content="">/, 'a missing public token stays on the preview fallback');

fs.rmSync(out, {recursive: true, force: true});
const configuredOut = path.join(root, '.test-build-mapbox');
fs.rmSync(configuredOut, {recursive: true, force: true});
const configuredBuild = spawnSync(process.execPath, ['scripts/build-site.cjs', '--public', `--out=${configuredOut}`], {
  cwd: root,
  env: {...process.env, WATTDESK_MAPBOX_TOKEN: 'pk.test-build-token'},
  encoding: 'utf8'
});
assert.equal(configuredBuild.status, 0, configuredBuild.stderr || configuredBuild.stdout);
const configuredHtml = fs.readFileSync(path.join(configuredOut, 'index.html'), 'utf8');
assert.match(configuredHtml, /<meta name="mapbox-access-token" content="pk\.test-build-token">/, 'the public Mapbox token is injected at build time');
fs.rmSync(configuredOut, {recursive: true, force: true});
console.log(JSON.stringify({ok: true, spaFallback: true, mapboxTokenInjection: true, standaloneRoutes: ['/settings', '/setup/20kw', '/setup/50kw'], redirectRules: redirects.trim().split('\n').length}));
