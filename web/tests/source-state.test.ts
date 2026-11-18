import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPublicSnapshotResult } from '../src/data/api.ts';
const original=globalThis.fetch;
async function withResponse(mock:typeof fetch,expected:'demo'|'live'|'unavailable'){
 globalThis.fetch=mock;
 try {const state=await loadPublicSnapshotResult();assert.equal(state.mode,expected);return state;}
 finally {globalThis.fetch=original;}
}
test('el servidor local HTML mantiene demo explícita',async()=>{
 await withResponse(async()=>new Response('<!DOCTYPE html>',{status:200,headers:{'Content-Type':'text/html'}}),'demo');
});
test('API no instalada (404) permite demo local',async()=>{
 await withResponse(async()=>new Response('Not Found',{status:404}),'demo');
});
test('503 de D1 nunca carga datos ficticios',async()=>{
 await withResponse(async()=>new Response('{"code":"database_unavailable"}',{status:503,headers:{'Content-Type':'application/json'}}),'unavailable');
});
test('fallo de red o JSON incorrecto no se convierte en demo',async()=>{
 await withResponse(async()=>{throw new TypeError('Network down');},'unavailable');
 await withResponse(async()=>new Response('{',{status:200,headers:{'Content-Type':'application/json'}}),'unavailable');
});
test('D1 vacía sigue siendo real y no demo',async()=>{
 const value={version:2,source:'d1',updatedAt:'2026-11-18',seasons:[],players:[],matches:[]};
 const state=await withResponse(async()=>new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}}),'live');
 assert.equal(state.mode==='live'&&state.snapshot.matches.length,0);
});
