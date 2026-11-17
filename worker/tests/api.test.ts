import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, verifyAdmin, type Database, type Statement } from '../index.ts';

const BASE='https://martes-fc.example.test';
function request(path:string,method='GET',headers?:Record<string,string>){
  return new Request(BASE+path,{method,headers,body:method==='GET'?undefined:'{}'});
}
function mockDatabase():Database{
  function prepared(sql:string):Statement{
    const statement:Statement={
      bind(){return statement;},
      async all<T>(){
        let results:unknown[]=[];
        if(sql.includes('FROM seasons ORDER BY'))results=[{id:'season-2026',label:'2026',starts_on:'2026-01-01',ends_on:'2026-12-31',active:1}];
        else if(sql.includes('FROM players ORDER BY'))results=[{id:'p1',public_name:'Portero prueba',role:'Portero',initials:'PP',avatar_a:'#147aa3',avatar_b:'#6540a7',active:1}];
        else if(sql.includes('FROM matches WHERE published'))results=[{id:'m1',season_id:'season-2026',played_on:'2026-11-10',opponent:'Equipo Prueba',goals_for:1,goals_against:0,saves:2,goalkeeper_id:'p1',revision:1}];
        else if(sql.includes('FROM match_players mp'))results=[{match_id:'m1',player_id:'p1',goals:1}];
        return {results:results as T[]};
      },
      async first<T>(){return null as T|null;},
      async run(){return {meta:{changes:1}};}
    };
    return statement;
  }
  return {prepare:prepared,async batch(){return [];}};
}
test('health es público, informa configuración sin revelar detalles',async()=>{
  let r=await handleApi(request('/api/health'),{});
  assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,configured:false});
  r=await handleApi(request('/api/health'),{DB:mockDatabase()});
  assert.equal((await r.json()).configured,true);
});
test('sin D1 el snapshot falla de manera explícita',async()=>{
  const r=await handleApi(request('/api/public/snapshot'),{});
  assert.equal(r.status,503);assert.equal((await r.json()).code,'database_not_configured');
});
test('snapshot devuelve solo datos autorizados en el contrato v2',async()=>{
  const r=await handleApi(request('/api/public/snapshot'),{DB:mockDatabase()});
  assert.equal(r.status,200);const data=await r.json();
  assert.equal(data.source,'d1');assert.equal(data.players.length,1);assert.equal(data.matches[0].saves,2);
  assert.equal(data.matches[0].goals.p1,1);
  assert.ok(!Object.hasOwn(data,'audit_events'));assert.ok(!JSON.stringify(data).includes('actor'));
  assert.match(r.headers.get('Cache-Control')??'',/max-age=30/);
});
test('la escritura falla cerrada sin JWT incluso con D1',async()=>{
  const env={DB:mockDatabase()};
  const r=await handleApi(request('/api/admin/players','POST',{'Origin':BASE,'Content-Type':'application/json'}),env);
  assert.equal(r.status,401);assert.equal((await r.json()).code,'unauthorized');
});
test('token inventado es inválido y no llega a la base',async()=>{
  const r=await verifyAdmin(request('/api/admin/session','GET',{'Cf-Access-Jwt-Assertion':'e30.e30.ZmFrZQ'}),{
    TEAM_DOMAIN:'https://demo.cloudflareaccess.com',POLICY_AUD:'expected-audience',ADMIN_EMAIL:'admin@example.test'
  });
  assert.equal(r,null);
});
test('los endpoints no convierten POST público en escritura',async()=>{
  const r=await handleApi(request('/api/public/snapshot','POST'),{DB:mockDatabase()});
  assert.equal(r.status,405);
});
test('los recursos ajenos a API no revelan datos',async()=>{
  const r=await handleApi(request('/api/unknown'),{DB:mockDatabase()});
  assert.equal(r.status,404);
});

test('JWT firmado RS256 permite únicamente administrador autorizado y bloquea CSRF',async()=>{
  const keys=await crypto.subtle.generateKey({
    name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'
  },true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);
  const toPart=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const header=toPart({alg:'RS256',kid:'test-key',typ:'JWT'});
  const payload=toPart({iss:'https://demo.cloudflareaccess.com',aud:'aud-test',exp:Math.floor(Date.now()/1000)+3600,email:'admin@example.test'});
  const unsigned=header+'.'+payload;
  const signature=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(unsigned))).toString('base64url');
  const token=unsigned+'.'+signature;
  const env={DB:mockDatabase(),TEAM_DOMAIN:'https://demo.cloudflareaccess.com',POLICY_AUD:'aud-test',ADMIN_EMAIL:'admin@example.test'};
  const old=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({keys:[{...jwk,kid:'test-key',alg:'RS256'}]}),{
    status:200,headers:{'Content-Type':'application/json'}
  });
  try{
    const authHeaders={'Cf-Access-Jwt-Assertion':token,'Content-Type':'application/json','Origin':BASE};
    assert.equal(await verifyAdmin(request('/api/admin/session','GET',authHeaders),env),'admin@example.test');
    const get=await handleApi(request('/api/admin/session','GET',authHeaders),env);
    assert.equal(get.status,200);
    const wrongOrigin=await handleApi(request('/api/admin/players','POST',{...authHeaders,Origin:'https://evil.example'}),env);
    assert.equal(wrongOrigin.status,403);
    const invalidBody=await handleApi(request('/api/admin/players','POST',authHeaders),env);
    assert.equal(invalidBody.status,400);
    const unauthorized=await verifyAdmin(request('/api/admin/session','GET',authHeaders),{...env,POLICY_AUD:'other'});
    assert.equal(unauthorized,null);
  }finally{globalThis.fetch=old;}
});
