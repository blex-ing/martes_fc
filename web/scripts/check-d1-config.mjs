import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
function read(name) {
  return JSON.parse(readFileSync(resolve(root, name), 'utf8'));
}
function fail(message) {
  console.error('[D1 isolation] ' + message);
  process.exitCode = 1;
}
const worker = read('wrangler.jsonc');
const migrations = read('wrangler.preview-migrations.jsonc');
const production = worker.d1_databases?.find((d) => d.binding === 'DB');
const preview = worker.previews?.d1_databases?.find((d) => d.binding === 'DB');
const migrationDb = migrations.d1_databases?.find((d) => d.binding === 'PREVIEW_DB');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!production || !preview || !migrationDb) fail('Missing database bindings');
else {
  if (!uuid.test(production.database_id) || !uuid.test(preview.database_id)) fail('Invalid database UUID');
  if (production.database_name !== 'martes-fc-prod') fail('Wrong production D1');
  if (preview.database_name !== 'martes-fc-preview') fail('Wrong preview D1');
  if (production.database_id === preview.database_id) fail('Preview may not share the production database');
  if (production.preview_database_id !== preview.database_id) fail('Remote dev must target staging database');
  if (migrationDb.database_id !== preview.database_id || migrationDb.database_name !== preview.database_name)
    fail('Preview migration target differs from preview binding');
  if (production.migrations_dir !== 'migrations' || migrationDb.migrations_dir !== 'migrations')
    fail('Migration directory mismatch');
  if (worker.main !== './worker/index.ts') fail('Unexpected Worker entrypoint');
  if (!worker.assets?.run_worker_first?.includes('/api/*')) fail('API Worker routing is missing');
}
if (!process.exitCode) console.log('[D1 isolation] Production and preview bindings are distinct and consistent.');
