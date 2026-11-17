import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const extensions = new Set(['.js','.mjs','.html','.css','.json','.md','.yml','.yaml','.jsonc']);
const excluded = new Set(['.git','node_modules','dist']);
const expressions = [
  {type:'Teléfono español en código o documentación',regex:/\+34[\s.-]?[67]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/},
  {type:'Comprobante o dato bancario',regex:/\b(?:IBAN|CaixaBank|Bizum|comprobante bancario real)\b/i},
  {type:'Clave privada',regex:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/},
  {type:'Token GitHub',regex:/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/},
];
let count=0;
async function walk(dir) {
  for (const item of await readdir(dir,{withFileTypes:true})) {
    if (excluded.has(item.name)) continue;
    const full=path.join(dir,item.name);
    if (item.isDirectory()) {await walk(full);continue;}
    if (!extensions.has(path.extname(item.name))) continue;
    const data=await readFile(full,'utf8');
    for (const {type,regex} of expressions) {
      // This checker intentionally excludes its own file; otherwise regex strings would match themselves.
      if (item.name === 'check-public.mjs') continue;
      if (regex.test(data)) throw new Error(`${type} encontrado en ${path.relative(root, full)}`);
    }
    count++;
  }
}
await walk(root);
console.log(`Revisión preventiva sobre ${count} archivos: OK (no sustituye un escáner de secretos).`);
