/**
 * Audit ALL npm dependencies, enforcing high/critical findings. The only accepted
 * temporary exception is GHSA-fc5q-39xc-vjpf in picomatch@4.0.7 when every
 * affected node belongs exclusively to the development toolchain.
 * npm audit and npm package-lock are the sources of truth.
 * This does not skip npm audit or waive newly reported high vulnerabilities.
 * See documentacion/SEGURIDAD_DEPENDENCIAS.md for expiry and review.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const EXCEPTION = Object.freeze({
  packageName: 'picomatch',
  version: '4.0.7',
  advisory: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
  expiresAt: '2026-12-17T00:00:00.000Z',
});

function highOrCritical(severity) {
  return severity === 'high' || severity === 'critical';
}

/** Fail closed when the report format changes or the audit does not complete. */
export function evaluateAudit(report, lock, now = new Date()) {
  const errors = [];
  let exceptions = 0;
  if (!report || report.auditReportVersion !== 2 || !report.vulnerabilities ||
      typeof report.vulnerabilities !== 'object' || Array.isArray(report.vulnerabilities) ||
      !report.metadata?.vulnerabilities || !lock?.packages || typeof lock.packages !== 'object') {
    return { ok: false, exceptions, errors: ['Invalid npm audit v2 report or package-lock structure'] };
  }
  const vulnerable = report.vulnerabilities;
  const entries = Object.entries(vulnerable);
  const elevated = entries.filter(([, item]) => highOrCritical(item?.severity));
  const counts = report.metadata.vulnerabilities;
  if (!Number.isInteger(counts.high) || !Number.isInteger(counts.critical) ||
      counts.high + counts.critical !== elevated.length) {
    errors.push('Audit metadata severity counts do not match vulnerability entries');
  }
  const expiry = new Date(EXCEPTION.expiresAt);
  const active = now instanceof Date && !Number.isNaN(now.getTime()) && now < expiry;
  function isDevOnly(vulnerability) {
    if (!Array.isArray(vulnerability.nodes) || vulnerability.nodes.length === 0) return false;
    return vulnerability.nodes.every(node =>
      typeof node === 'string' && node.startsWith('node_modules/') &&
      lock.packages[node]?.dev === true);
  }
  // Follow npm's metavulnerability dependency graph back to root advisories.
  function collectHighAdvisories(name, visited = new Set()) {
    if (visited.has(name)) return [{ error: 'Circular vulnerability dependency' }];
    const item = vulnerable[name];
    if (!item || !Array.isArray(item.via)) return [{ error: 'Missing vulnerability' }];
    const nextVisited = new Set(visited);
    nextVisited.add(name);
    const output = [];
    for (const via of item.via) {
      if (typeof via === 'string') {
        output.push(...collectHighAdvisories(via, nextVisited));
      } else if (via && typeof via === 'object' && highOrCritical(via.severity)) {
        output.push({ name: via.name, url: via.url, severity: via.severity });
      } else if (!via || typeof via !== 'object' || typeof via.severity !== 'string') {
        output.push({ error: 'Unrecognized advisory' });
      }
    }
    return output;
  }
  for (const [name, issue] of elevated) {
    if (issue.severity === 'critical') {
      errors.push(`Critical vulnerability is never excepted: ${name}`);
      continue;
    }
    if (!isDevOnly(issue)) {
      errors.push(`High vulnerability affects runtime or unknown package path: ${name}`);
      continue;
    }
    const sources = collectHighAdvisories(name);
    if (sources.length === 0) {
      errors.push(`High vulnerability lacks a traceable high-severity advisory: ${name}`);
      continue;
    }
    const onlyKnown = sources.every(source =>
      source.name === EXCEPTION.packageName &&
      source.severity === 'high' && source.url === EXCEPTION.advisory);
    if (!onlyKnown) {
      errors.push(`New/unapproved high vulnerability in dependency graph: ${name}`);
      continue;
    }
    const installed = lock.packages['node_modules/picomatch'];
    if (!installed || installed.version !== EXCEPTION.version || installed.dev !== true || !active) {
      errors.push(`picomatch exception expired, mismatched, or not exclusively dev-only: ${name}`);
      continue;
    }
    exceptions++;
  }
  return { ok: errors.length === 0, exceptions, errors };
}

function main() {
  const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const lock = JSON.parse(readFileSync(path.join(directory, 'package-lock.json'), 'utf8'));
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const audit = spawnSync(npm, ['audit', '--json', '--audit-level=high'], {
    cwd: directory, encoding: 'utf8', timeout: 120_000, maxBuffer: 6 * 1024 * 1024,
    env: { ...process.env, npm_config_fund: 'false' },
  });
  if (audit.error || ![0, 1].includes(audit.status)) {
    throw Error('npm audit did not complete; registry/network errors must never pass CI');
  }
  let report;
  try { report = JSON.parse(audit.stdout); }
  catch { throw Error('npm audit returned non-JSON data; audit cannot be verified'); }
  const result = evaluateAudit(report, lock);
  const totals = report.metadata?.vulnerabilities;
  console.log(`Complete npm audit: ${totals?.high ?? '?'} high / ${totals?.critical ?? '?'} critical (all dependencies)`);
  if (result.exceptions > 0) {
    console.warn(`TEMPORARY EXCEPTION: ${EXCEPTION.advisory} limited to picomatch@${EXCEPTION.version}, dev-only; expires ${EXCEPTION.expiresAt.slice(0, 10)}`);
    console.warn(`Related high-severity metavulnerabilities accepted: ${result.exceptions}. Any other high/critical advisory blocks CI.`);
  }
  if (!result.ok) {
    for (const reason of result.errors) console.error('SECURITY AUDIT BLOCKED:', reason);
    process.exitCode = 1;
  } else {
    console.log('Audit policy passed. Runtime audit must pass separately in CI.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (e) { console.error('SECURITY AUDIT BLOCKED:', e instanceof Error ? e.message : 'unknown error'); process.exitCode = 1; }
}
