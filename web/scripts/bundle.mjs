import { build, context } from 'esbuild';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv[2] ?? 'build';
if (!['build', 'dev'].includes(mode)) throw new Error('Modo esperado: build o dev');
const development = mode === 'dev';
const target = path.resolve('dist');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const options = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  jsx: 'automatic',
  outdir: 'dist',
  entryNames: development ? 'assets/[name]' : 'assets/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  minify: !development,
  sourcemap: development,
  metafile: true,
  logLevel: 'info',
};

async function writeIndex(meta) {
  const entry = Object.entries(meta.outputs).find(([, m]) => m.entryPoint?.replaceAll('\\', '/') === 'src/main.tsx');
  if (!entry) throw new Error('esbuild no ha generado src/main.tsx');
  const [jsFile, info] = entry;
  const publicPath = p => '/' + path.relative(target, path.resolve(p)).split(path.sep).join('/');
  let html = await readFile('index.html', 'utf8');
  const original = '<script type="module" src="/src/main.tsx"></script>';
  if (!html.includes(original)) throw new Error('No se encuentra la entrada en index.html');
  html = html.replace(original, '<script type="module" src="' + publicPath(jsFile) + '"></script>');
  if (info.cssBundle) html = html.replace('</head>', '  <link rel="stylesheet" href="' + publicPath(info.cssBundle) + '" />\n</head>');
  await writeFile(path.join(target, 'index.html'), html);
}

if (development) {
  const ctx = await context(options);
  try {
    const initial = await ctx.rebuild();
    await writeIndex(initial.metafile);
    await ctx.watch();
    const server = await ctx.serve({ servedir: 'dist', host: '127.0.0.1', port: 4173 });
    console.log('MARTES FC dev: http://' + server.host + ':' + server.port + ' (recarga el navegador tras cambios)');
  } catch (error) {
    await ctx.dispose();
    throw error;
  }
} else {
  const result = await build(options);
  await writeIndex(result.metafile);
  console.log('MARTES FC compilado sin Vite.');
}
