import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const baseline=JSON.parse(await readFile(path.join(root,'web/scripts/design-legacy-colors.json'),'utf8'));
const colorPattern=/(?:#[0-9a-fA-F]{3,8}\b|rgba?\(\s*[\d.\s%,]+\))/g;
function count(data){const result={};for(const color of data.match(colorPattern)||[])result[color]=(result[color]||0)+1;return result;}
for(const [file,allowed] of Object.entries(baseline)){
 const current=count(await readFile(path.join(root,file),'utf8'));
 for(const [color,n] of Object.entries(current)){
  if(n>(allowed[color]??0))throw new Error('Nuevo literal en '+file+': '+color+'. Añadir token en tokens.css.');
 }
}
async function inspect(dir){
 for(const item of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){await inspect(file);continue;}
  if(!/\.(tsx|css)$/.test(item.name))continue;
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  if(rel==='web/src/styles/tokens.css'||rel in baseline)continue;
  const literal=(await readFile(file,'utf8')).match(colorPattern);
  if(literal)throw new Error('Literal visual no autorizado en '+rel+': '+literal[0]);
 }
}
await inspect(path.join(root,'web/src'));
const tokens=await readFile(path.join(root,'web/src/styles/tokens.css'),'utf8');
const primitives=await readFile(path.join(root,'web/src/styles/primitives.css'),'utf8');
for(const token of ['--color-primary','--color-surface','--color-text','--space-4','--radius-card','--glass-blur']){
 if(!tokens.includes(token+':'))throw new Error('Falta token '+token);
}
for(const material of ['.ui-glass-primary','.ui-glass-card','.ui-glass-nav','.ui-hybrid-glass','.ui-hybrid-control']){
 if(!primitives.includes(material))throw new Error('Falta primitiva '+material);
}
for(const rule of ['prefers-reduced-transparency','prefers-reduced-motion','pointer:coarse']){
 if(!primitives.includes(rule))throw new Error('Falta fallback '+rule);
}
console.log('Design System: tokens, materiales, accesibilidad y presupuesto de color legado OK.');
