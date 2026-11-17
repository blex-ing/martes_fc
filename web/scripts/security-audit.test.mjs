import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAudit, EXCEPTION } from './security-audit.mjs';

const today = new Date('2026-11-17T20:00:00Z');
const issue = (name, severity, via, nodes) => ({ name, severity, via, nodes });
const knownAdvisory = { name: 'picomatch', severity: 'high', url: EXCEPTION.advisory };
const allowedLock = { packages: {
  'node_modules/picomatch': { version: '4.0.7', dev: true },
  'node_modules/fdir': { version: '6.5.0', dev: true },
  'node_modules/vite': { version: '6.4.6', dev: true },
  'node_modules/minimatch': { version: '10.2.6', dev: true },
} };
function report(vulnerabilities) {
  const values = Object.values(vulnerabilities);
  return {auditReportVersion:2,vulnerabilities,metadata:{vulnerabilities:{
    low:0,moderate:values.filter(v=>v.severity==='moderate').length,
    high:values.filter(v=>v.severity==='high').length,
    critical:values.filter(v=>v.severity==='critical').length
  }}};
}
const allowed = report({
  picomatch: issue('picomatch','high',[knownAdvisory],['node_modules/picomatch']),
  fdir: issue('fdir','high',['picomatch'],['node_modules/fdir']),
  vite: issue('vite','high',['fdir'],['node_modules/vite']),
  minimatch: issue('minimatch','moderate',[{name:'minimatch',severity:'moderate',url:'https://github.com/advisories/GHSA-g3hv-75wg-m249'}],['node_modules/minimatch'])
});
test('no vulnerabilities pass audit',()=>{
  assert.equal(evaluateAudit(report({}),allowedLock,today).ok,true);
});
test('only documented dev-only GHSA and its metavulnerabilities pass',()=>{
  assert.deepEqual(evaluateAudit(allowed,allowedLock,today),{ok:true,exceptions:3,errors:[]});
});
test('new high advisories fail, even beneath known metavulnerabilities',()=>{
  const patched=structuredClone(allowed);
  patched.vulnerabilities.picomatch.via.push({name:'picomatch',severity:'high',url:'https://github.com/advisories/GHSA-unknown'});
  assert.equal(evaluateAudit(patched,allowedLock,today).ok,false);
});
test('critical advisories always fail',()=>{
  const patched=structuredClone(allowed);patched.vulnerabilities.picomatch.severity='critical';patched.metadata.vulnerabilities.critical=1;patched.metadata.vulnerabilities.high--;
  assert.equal(evaluateAudit(patched,allowedLock,today).ok,false);
});
test('dev-only package-lock paths are enforced',()=>{
  const lock=structuredClone(allowedLock);lock.packages['node_modules/fdir'].dev=false;
  assert.equal(evaluateAudit(allowed,lock,today).ok,false);
});
test('unknown node paths are rejected',()=>{
  const patched=structuredClone(allowed);patched.vulnerabilities.vite.nodes.push('node_modules/unknown');
  assert.equal(evaluateAudit(patched,allowedLock,today).ok,false);
});
test('version mismatches are rejected',()=>{
  const lock=structuredClone(allowedLock);lock.packages['node_modules/picomatch'].version='4.0.8';
  assert.equal(evaluateAudit(allowed,lock,today).ok,false);
});
test('exception expires automatically',()=>{
  assert.equal(evaluateAudit(allowed,allowedLock,new Date('2026-12-17T00:00:00Z')).ok,false);
});
test('invalid audit metadata is rejected',()=>{
  const invalid=structuredClone(allowed);delete invalid.metadata;
  assert.equal(evaluateAudit(invalid,allowedLock,today).ok,false);
});
test('high severity without a traceable advisory is rejected',()=>{
  const patched=structuredClone(allowed);patched.vulnerabilities.picomatch.via=[];
  assert.equal(evaluateAudit(patched,allowedLock,today).ok,false);
});
test('new runtime vulnerabilities are blocked',()=>{
  const patched=structuredClone(allowed);
  patched.vulnerabilities.runtime=issue('runtime','high',[{name:'runtime',severity:'high',url:'https://github.com/advisories/GHSA-another'}],['node_modules/runtime']);
  patched.metadata.vulnerabilities.high++;
  const lock=structuredClone(allowedLock);lock.packages['node_modules/runtime']={version:'1.0.0'};
  assert.equal(evaluateAudit(patched,lock,today).ok,false);
});
