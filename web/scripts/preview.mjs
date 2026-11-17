import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    const relative = pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative || 'index.html');
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    let bytes;
    try { bytes = await readFile(file); }
    catch (err) {
      if (err.code !== 'ENOENT' && err.code !== 'EISDIR') throw err;
      if (path.extname(relative)) { res.writeHead(404); res.end(); return; }
      bytes = await readFile(path.join(root, 'index.html'));
      res.setHeader('Content-Type', mime['.html']);
    }
    res.setHeader('Content-Type', res.getHeader('Content-Type') || mime[path.extname(file)] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(bytes);
  } catch (error) { res.writeHead(500); res.end('Internal server error'); console.error(error); }
}).listen(4173, '127.0.0.1', () => console.log('Preview http://127.0.0.1:4173'));
