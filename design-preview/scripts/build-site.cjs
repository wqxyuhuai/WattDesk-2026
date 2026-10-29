// Build the static site for GitHub + Cloudflare Pages.
// Only runtime files are copied; design archives, screenshots and tests stay local.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const publicSite = process.argv.includes('--public');
const outArg = process.argv.find(argument => argument.startsWith('--out='));
const out = path.resolve(root, outArg ? outArg.slice('--out='.length) : 'dist');

const required = [
  'home.html',
  'src/shared.css',
  'src/pages/home/index.js',
  'src/pages/home/data/scene.json',
  'src/pages/home/data/asset-map.json',
  'src/pages/home/data/theme-map.json',
  'src/pages/home/data/type-runtime.json',
  'home-assets/sf-pro.woff2'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Required runtime file is missing: ${file}`);
  }
}

if (out === root || out === path.dirname(root)) {
  throw new Error('Refusing to build into the project or its parent directory.');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const copy = (from, to = from) => {
  fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });
};

copy('src');
copy('home-assets');

const html = fs.readFileSync(path.join(root, 'home.html'), 'utf8');
const robots = publicSite ? '' : '<meta name="robots" content="noindex, nofollow">';
const deployHtml = robots ? html.replace('<head>', `<head>${robots}`) : html;
fs.writeFileSync(path.join(out, 'index.html'), deployHtml);
fs.writeFileSync(path.join(out, 'home.html'), deployHtml);

// `/home` is served from home.html by the static-asset layer; never map it
// back to home.html or the automatic /home.html -> /home redirects loop.
// Client-rendered deep links use Workers Assets SPA fallback configured in
// wrangler.jsonc. A 200 rewrite to /index.html is rejected because the asset
// layer may normalize that target again and create an infinite loop.
const appRoutes = ['/plants','/service','/statistics','/cell-balance','/module-balance','/device-track','/organisation','/teams','/users'];
const redirectRules = [
  '# Canonical home. Do not add a /home -> /home.html rule (redirect loop).',
  '/ /home 308',
  '/home.html /home 308',
  '/index.html /home 308'
];
fs.writeFileSync(path.join(out, '_redirects'), redirectRules.join('\n'));

const routeCacheHeaders = appRoutes.flatMap(route => [
  route,
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
  ...(route === '/plants' ? [`${route}/*`, '  Cache-Control: public, max-age=0, must-revalidate', ''] : [])
]);
fs.writeFileSync(path.join(out, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ...(publicSite ? [] : ['  X-Robots-Tag: noindex, nofollow']),
  '',
  '/*.html',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
// Runtime assets keep stable filenames, so a long browser cache would pair
// new HTML with stale JS/CSS after a deploy. Revalidate instead.
  '/src/*',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
  '/home-assets/*',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
  '# Deep-linked HTML must revalidate like the shell it proxies to.',
  ...routeCacheHeaders,
  ''
].join('\n'));

fs.writeFileSync(path.join(out, 'robots.txt'), publicSite
  ? 'User-agent: *\nAllow: /\n'
  : 'User-agent: *\nDisallow: /\n');

const files = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push(absolute);
  }
};
walk(out);

const bytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
console.log(JSON.stringify({
  output: path.relative(root, out) || '.',
  mode: publicSite ? 'public' : 'preview',
  files: files.length,
  megabytes: Number((bytes / 1024 / 1024).toFixed(2))
}, null, 2));

