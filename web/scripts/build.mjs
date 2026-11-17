import {cp, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = new URL('../dist/', import.meta.url);
await rm(destination, {recursive:true, force:true});
await mkdir(destination, {recursive:true});
for (const file of ['index.html', 'styles.css', 'app.js']) await cp(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
await cp(new URL('../src/domain/', import.meta.url), new URL('../dist/src/domain/', import.meta.url), {recursive:true});
console.log(`Build estático completado: ${fileURLToPath(destination)}`);
