import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError,describeApiError,adminSession,createPlayer,createMatch,updateMatch,createSeason} from '../src/data/api.ts';

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


test('un 200 HTML o sin ok=true nunca se considera una mutación guardada',async()=>{
 const previous=globalThis.fetch;
 try{
  for(const response of [
   new Response('<html>Cloudflare Access</html>',{status:200,headers:{'Content-Type':'text/html'}}),
   new Response(JSON.stringify({ok:false}),{status:200,headers:{'Content-Type':'application/json'}}),
   new Response('{',{status:200,headers:{'Content-Type':'application/json'}}),
   new Response(JSON.stringify(['not-an-object']),{status:200,headers:{'Content-Type':'application/json'}})
  ]){
   globalThis.fetch=async()=>response;
   await assert.rejects(createPlayer('Prueba','Jugador'),(error:unknown)=>{
    assert.ok(error instanceof ApiError);
    assert.equal(error.code,'invalid_response');
    assert.match(describeApiError(error),/respuesta inesperada/);
    return true;
   });
  }
 }finally{globalThis.fetch=previous;}
});

test('409 stale_revision, 401 Access y 403 origen muestran errores específicos',async()=>{
 const previous=globalThis.fetch;
 const body={id:'m1',date:'2026-11-10',opponent:'Rival',goalsFor:1,goalsAgainst:0,saves:2,appearances:['keeper'],goalkeeperId:'keeper',goals:{keeper:1},status:'finished' as const};
 try{
  for(const [code,status,expected] of [
   ['stale_revision',409,/Otro cambio/],
   ['unauthorized',401,/sesión/],
   ['invalid_origin',403,/seguridad/],
   ['invalid_match',400,/goles/]
  ] as const){
   globalThis.fetch=async()=>new Response(JSON.stringify({code}),{status,headers:{'Content-Type':'application/json'}});
   await assert.rejects(updateMatch({...body,revision:1}),(error:unknown)=>{
    assert.ok(error instanceof ApiError);
    assert.equal(error.status,status);
    assert.match(describeApiError(error),expected);
    return true;
   });
  }
 }finally{globalThis.fetch=previous;}
});

test('mutaciones rechazan errores de red y no filtran códigos arbitrarios del servidor',async()=>{
 const previous=globalThis.fetch;
 try{
  globalThis.fetch=async()=>{throw new TypeError('private network details');};
  await assert.rejects(createSeason('2027','2027-01-01',null),(error:unknown)=>{
   assert.ok(error instanceof ApiError);
   assert.equal(error.code,'network');
   assert.match(describeApiError(error),/conexión/);
   return true;
  });
  globalThis.fetch=async()=>new Response(JSON.stringify({code:'internal_stack_trace_123'}),{status:500,headers:{'Content-Type':'application/json'}});
  await assert.rejects(createPlayer('Prueba','Jugador'),(error:unknown)=>{
   assert.ok(error instanceof ApiError);
   assert.doesNotMatch(describeApiError(error),/stack_trace|123/);
   return true;
  });
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}),{status:201,headers:{'Content-Type':'application/json'}});
  await createMatch({...{id:'m1',date:'2026-11-10',opponent:'Rival',goalsFor:0,goalsAgainst:0,saves:0,appearances:['keeper'],goalkeeperId:'keeper',goals:{},status:'finished' as const}});
 }finally{globalThis.fetch=previous;}
});
