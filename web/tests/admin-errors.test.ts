import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError,describeApiError,adminSession} from '../src/data/api.ts';

test('errores de administración distinguen conflicto, sesión y red',()=>{
 assert.match(describeApiError(new ApiError('stale_revision',409)),/Otro cambio/);
 assert.match(describeApiError(new ApiError('goalkeeper_has_history',409)),/portero/);
 assert.match(describeApiError(new ApiError('unauthorized',401)),/sesión/);
 assert.match(describeApiError(new ApiError('network',0)),/conexión/);
});
test('sesión Access exige JSON con ok=true, no solo status 200',async()=>{
 const previous=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:false}),{status:200,headers:{'Content-Type':'application/json'}});
  assert.equal(await adminSession(),false);
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  assert.equal(await adminSession(),true);
  globalThis.fetch=async()=>new Response('<html>login</html>',{status:200,headers:{'Content-Type':'text/html'}});
  assert.equal(await adminSession(),false);
 }finally{globalThis.fetch=previous;}
});
