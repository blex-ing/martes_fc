import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const extensions = new Set(['.js','.mjs','.ts','.tsx','.html','.css','.json','.md','.yml','.yaml','.jsonc']);
const excluded = new Set(['.git','node_modules','dist','playwright-report','test-results']);
const expressions = [
 {type:'Teléfono español',regex:/\+34[\s.-]?[67]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/},
 {type:'Dato financiero real',regex:/\b(?:IBAN|CaixaBank|Bizum|comprobante bancario real)\b/i},
 {type:'Clave privada',regex:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/},
 {type:'Token GitHub',regex:/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/},
];
let count=0;
async function walk(dir) {
 for(const item of await readdir(dir,{withFileTypes:true})) {
  if(excluded.has(item.name))continue;
  const file=path.join(dir,item.name);
  if(item.isDirectory()){await walk(file);continue;}
  if(!extensions.has(path.extname(item.name)) || item.name==='check-public.mjs')continue;
  const data=await readFile(file,'utf8');
  for(const {type,regex} of expressions)if(regex.test(data))throw new Error(type+' encontrado en '+path.relative(root,file));
  count++;
 }
}
await walk(root);
console.log('Comprobación preventiva '+count+' archivos: OK; no sustituye un escáner de secretos.');
