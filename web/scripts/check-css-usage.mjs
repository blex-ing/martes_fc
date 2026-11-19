import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Inventario estático de clases: prohíbe acumular CSS sin consumidores.
// Las excepciones son deliberadas: API opt-in documentada y clases generadas.
const root=fileURLToPath(new URL('../../',import.meta.url));
const sourceRoot=path.join(root,'web/src');
const cssFiles=['web/styles.css','web/src/styles/primitives.css'];
const publicApi=[
 'ui-glass-primary','ui-glass-card','ui-glass-nav','ui-soft-surface',
 'ui-chip','ui-button','ui-button-primary','ui-button-secondary'
];
const dynamicTones=['tone-cyan','tone-purple','tone-pink','tone-green'];
async function sourceFiles(dir){
 const found=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const target=path.join(dir,entry.name);
  if(entry.isDirectory()){
   if(entry.name!=='styles')found.push(...await sourceFiles(target));
  }else if(/\.(?:tsx?|jsx?)$/.test(entry.name)){
   found.push(target);
  }
 }
 return found;
}
const files=[...await sourceFiles(sourceRoot),path.join(root,'web/index.html')];
const usedByApp=(await Promise.all(files.map(file=>readFile(file,'utf8')))).join('\n');
const documented=await readFile(path.join(root,'documentacion/DESIGN_SYSTEM_MARTES_FC.md'),'utf8');
const sourceCss=(await Promise.all(cssFiles.map(file=>readFile(path.join(root,file),'utf8')))).join('\n')
 .replace(/\/\*[\s\S]*?\*\//g,'')
 .replace(/@import\s+[^;]+;/g,'');
const defined=new Set([...sourceCss.matchAll(/\.([A-Za-z][\w-]*)/g)].map(match=>match[1]));
if(!usedByApp.includes("'metric glass tone-'+tone")){
 throw Error('No se ha encontrado la composición dinámica de clases tone-*; revisar su contrato.');
}
for(const name of [...publicApi,...dynamicTones]){
 if(!defined.has(name))throw Error('Clase de contrato eliminada: '+name);
}
for(const name of publicApi){
 if(!documented.includes(name))throw Error('Primitiva opt-in sin documentación: '+name);
}
const allowed=new Set([...publicApi,...dynamicTones]);
const unused=[...defined].filter(name=>!usedByApp.includes(name)&&!allowed.has(name)).sort();
if(unused.length)throw Error('Clases CSS huérfanas sin referencia o excepción documentada: '+unused.join(', '));
console.log('CSS: '+defined.size+' clases verificadas; '+publicApi.length+' API opt-in; '+dynamicTones.length+' tone-* dinámicas; 0 huérfanas.');
