import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const port=Number(process.env.PORT || 4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
createServer(async(req,res)=>{
  const pathname=new URL(req.url || '/',`http://localhost:${port}`).pathname;
  const full=path.resolve(root, '.'+decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  if(!full.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  try{
    const st=await stat(full);
    if(!st.isFile())throw Error('Not a file');
    res.setHeader('Content-Type',types[path.extname(full)]||'application/octet-stream');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.end(await readFile(full));
  }catch{res.writeHead(404).end('No encontrado');}
}).listen(port, '127.0.0.1', ()=>console.log(`MARTES FC: http://127.0.0.1:${port}`));
