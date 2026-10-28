const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.WATTDESK_PREVIEW_PORT || 4173);
const annotationsFile = path.join(root, 'annotations.json');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.json':'application/json' };
const canonicalRoutes = new Set([
  '/home','/plants','/service','/statistics','/cell-balance','/module-balance',
  '/device-track','/organisation','/teams','/users'
]);

// 本地批注层：只在 ?annotate=1 时注入，正式页面与截图基线不受影响。
const annotateTags = '<link rel="stylesheet" href="./dev/annotate.css"><script src="./dev/annotate.js" defer></script>';
const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
};

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

// `/plants` and `/plants/p02` are real entry points. The preview server
// returns the SPA shell for them so a refresh never falls back to Home; the
// browser router then renders the route named by the URL.
function isAppPath(pathname) {
  const clean = normalizePath(pathname);
  return canonicalRoutes.has(clean) || /^\/plants\/[^/]+$/.test(clean);
}

http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, 'Bad request'); }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request'); }

  if (pathname === '/__annotations') {
    if (req.method === 'GET') {
      try {
        return send(res, 200, fs.readFileSync(annotationsFile, 'utf8'), 'application/json');
      } catch {
        return send(res, 200, JSON.stringify({ annotations: [] }), 'application/json');
      }
    }
    if (req.method === 'POST') {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', chunk => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          if (!payload || !Array.isArray(payload.annotations)) throw new Error('annotations must be an array');
          fs.writeFileSync(annotationsFile, JSON.stringify(payload, null, 2));
          send(res, 200, JSON.stringify({ ok: true }), 'application/json');
        } catch (error) {
          send(res, 400, JSON.stringify({ ok: false, error: String(error.message || error) }), 'application/json');
        }
      });
      return;
    }
    return send(res, 405, 'Method not allowed');
  }

  // Old bookmarks and the root URL canonicalise to /home. Keep the query so
  // `?glass=figma` and `?annotate=1` still work while developing.
  if (pathname === '/' || pathname === '/home.html' || pathname === '/index.html') {
    res.writeHead(308, { Location: `/home${url.search}`, 'Cache-Control': 'no-cache' });
    return res.end();
  }

  const appRequest = isAppPath(pathname);
  const file = appRequest ? path.join(root, 'home.html') : path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, content) => {
    if (err) return send(res, 404, 'Not found');
    let body = content;
    if (path.extname(file) === '.html' && url.searchParams.get('annotate') === '1') {
      body = Buffer.from(content.toString('utf8').replace('</body>', `${annotateTags}</body>`));
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`WattDesk Home: http://127.0.0.1:${port}/home?glass=figma`);
  console.log(`Plants: http://127.0.0.1:${port}/plants`);
  console.log(`Annotate: http://127.0.0.1:${port}/home?glass=figma&annotate=1`);
});
