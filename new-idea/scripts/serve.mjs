// NEW IDEA — 本地预览服务器
// 用法: node scripts/serve.mjs [port]
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, normalize } from 'path';

const PORT = Number(process.argv[2] || 5173);
const ROOT = join(process.cwd(), 'output');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = normalize(join(ROOT, pathname));

  if (!filePath.startsWith(normalize(ROOT)) || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
}).listen(PORT, () => {
  console.log(`✅ NEW IDEA 预览服务器: http://localhost:${PORT}`);
});
