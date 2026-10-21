const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.WATTDESK_PREVIEW_PORT || 4173);
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.json':'application/json' };
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  const file = path.resolve(root,'.'+(pathname==='/'?'/home.html':pathname));
  if (!file.startsWith(root+path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file,(err,content)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);
  });
}).listen(port,'127.0.0.1',()=>console.log(`WattDesk Home: http://127.0.0.1:${port}/home.html?glass=figma`));
