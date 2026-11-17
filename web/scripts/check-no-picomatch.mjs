import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const packages = Object.keys(lock.packages ?? {});
const banned = packages.filter(name => /(?:^|\/)node_modules\/picomatch$/.test(name));
if (banned.length) {
  console.error('picomatch permanece en el lockfile:', banned);
  process.exit(1);
}
console.log('package-lock.json sin picomatch: OK');
