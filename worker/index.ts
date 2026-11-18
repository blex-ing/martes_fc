import { isValidDate, validateMatch, type Match } from '../web/src/domain/stats.ts';

export interface Statement {
  bind(...values: unknown[]): Statement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}
interface Env {
  DB?: Database;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
  ADMIN_EMAIL?: string;
}
interface SeasonRow { id: string; label: string; starts_on: string; ends_on: string | null; active: number }
interface PlayerRow { id: string; public_name: string; role: 'Portero'|'Jugador'; initials: string; avatar_a: string; avatar_b: string; active: number }
interface MatchRow { id: string; season_id: string; played_on: string; opponent: string; goals_for: number; goals_against: number; saves: number; goalkeeper_id: string|null; revision: number }
interface AppearanceRow {match_id: string; player_id: string; goals: number}
type Json = Record<string, unknown>;
const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const publicHeaders = { 'Cache-Control': 'public, max-age=30, must-revalidate', 'X-Content-Type-Options': 'nosniff' };
function json(value: unknown, status=200, headers: Record<string,string>=noStore): Response {
  return new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
}
function err(status:number,code:string):Response { return json({error:code,code},status); }
function permittedMethod(request:Request, allowed:string[]): Response|null {
  return allowed.includes(request.method)?null: new Response(JSON.stringify({error:'method_not_allowed',code:'method_not_allowed'}),{status:405,headers:{...noStore,'Content-Type':'application/json',Allow:allowed.join(', ')}});
}
function sameOrigin(request:Request):boolean {
  const origin=request.headers.get('Origin');
  return !!origin && origin===new URL(request.url).origin;
}
async function readBody(request:Request):Promise<Json|null> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  const limit=16_384;
  if (Number(request.headers.get('Content-Length')??'0')>limit) return null;
  if (!request.body) return null;
  const reader=request.body.getReader(); const chunks:Uint8Array[]=[];let total=0;
  try {
    while(true) {
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.length;
      if(total>limit){await reader.cancel();return null;}
      chunks.push(value);
    }
    const bytes=new Uint8Array(total);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    return value && typeof value==='object'&&!Array.isArray(value) ? value as Json : null;
  }catch{return null;}finally{reader.releaseLock();}
}
function textValue(v:unknown,max:number):string|null {
  if(typeof v!=='string')return null;
  const str=v.trim();
  return str.length>0&&str.length<=max?str:null;
}
function idValue(v:unknown):v is string {return typeof v==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(v);}
function num(v:unknown,max:number):v is number {return typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;}
function decodePart(value:string):Uint8Array<ArrayBuffer> {
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/');
  const decoded=atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'='));
  const bytes=new Uint8Array(decoded.length);
  for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
  return bytes;
}
function decodeJson(value:string):Record<string,unknown> {
  const decoded=new TextDecoder().decode(decodePart(value));
  const parsed:unknown=JSON.parse(decoded);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('invalid_jwt');
  return parsed as Record<string,unknown>;
}
/** Fail-closed: firma RS256 validada con JWKS de Cloudflare; no se confía solo en cabeceras. */
export async function verifyAdmin(request:Request,env:Env):Promise<string|null> {
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  const team=env.TEAM_DOMAIN?.replace(/\/$/,'');
  const aud=env.POLICY_AUD,admin=env.ADMIN_EMAIL?.trim().toLowerCase();
  if(!token||!team||!aud||!admin||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team))return null;
  const parts=token.split('.');
  if(parts.length!==3||parts.some(p=>!p||p.length>4096))return null;
  try{
    const header=decodeJson(parts[0]!);
    if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>256)return null;
    const claims=decodeJson(parts[1]!);
    const now=Math.floor(Date.now()/1000);
    if(claims.iss!==team||
      !(claims.aud===aud||(Array.isArray(claims.aud)&&claims.aud.includes(aud)))||
      typeof claims.exp!=='number'||claims.exp<=now||
      (typeof claims.nbf==='number'&&claims.nbf>now+30)||
      (typeof claims.iat==='number'&&claims.iat>now+30)||
      typeof claims.email!=='string'||claims.email.trim().toLowerCase()!==admin
    )return null;
    const reply=await fetch(team+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(4000)});
    if(!reply.ok)return null;
    const jwks:unknown=await reply.json();
    if(!jwks||typeof jwks!=='object'||!('keys' in jwks)||!Array.isArray(jwks.keys))return null;
    const key=jwks.keys.find((k:unknown)=>!!k&&typeof k==='object'&&'kid' in k&&k.kid===header.kid&&'kty' in k&&k.kty==='RSA');
    if(!key)return null;
    const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const data=new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,decodePart(parts[2]!),data);
    return verified?admin:null;
  }catch{return null;}
}
async function snapshot(db:Database):Promise<unknown> {
  const [seasons,players,matches,appearances]=await Promise.all([
    db.prepare('SELECT id,label,starts_on,ends_on,active FROM seasons ORDER BY starts_on DESC').all<SeasonRow>(),
    db.prepare('SELECT id,public_name,role,initials,avatar_a,avatar_b,active FROM players ORDER BY created_at,id').all<PlayerRow>(),
    db.prepare('SELECT id,season_id,played_on,opponent,goals_for,goals_against,saves,goalkeeper_id,revision FROM matches WHERE published=1 AND status=? ORDER BY played_on DESC,id DESC LIMIT 2000').bind('finished').all<MatchRow>(),
    db.prepare('SELECT mp.match_id,mp.player_id,mp.goals FROM match_players mp WHERE mp.match_id IN (SELECT id FROM matches WHERE published=1 AND status=? ORDER BY played_on DESC,id DESC LIMIT 2000)').bind('finished').all<AppearanceRow>()
  ]);
  const byMatch=new Map<string,AppearanceRow[]>();
  for(const app of appearances.results){const list=byMatch.get(app.match_id)??[];list.push(app);byMatch.set(app.match_id,list);}
  return {version:2,source:'d1',updatedAt:new Date().toISOString(),
    seasons:seasons.results.map(s=>({id:s.id,label:s.label,start:s.starts_on,end:s.ends_on,active:!!s.active})),
    players:players.results.map(p=>({id:p.id,name:p.public_name,role:p.role,initials:p.initials,a:p.avatar_a,b:p.avatar_b,active:!!p.active})),
    matches:matches.results.map(m=>({id:m.id,date:m.played_on,seasonId:m.season_id,opponent:m.opponent,
      goalsFor:m.goals_for,goalsAgainst:m.goals_against,saves:m.saves,goalkeeperId:m.goalkeeper_id,
      appearances:(byMatch.get(m.id)??[]).map(a=>a.player_id),
      goals:Object.fromEntries((byMatch.get(m.id)??[]).filter(a=>a.goals>0).map(a=>[a.player_id,a.goals])),
      revision:m.revision,status:'finished'}))
  };
}
function audit(db:Database,email:string,action:string,entity:string,entityId:string):Statement {
  return db.prepare('INSERT INTO audit_events(id,actor,action,entity,entity_id) VALUES(?,?,?,?,?)')
    .bind(crypto.randomUUID(),email,action,entity,entityId);
}
async function prepareMatch(db:Database,input:Json,id:string):Promise<{record:Match,seasonId:string}|null> {
  const ps=await db.prepare('SELECT id,role FROM players').all<{id:string,role:string}>();
  const known=ps.results.map(p=>p.id);
  const goalkeeperId=input.goalkeeperId;
  if(goalkeeperId!==null && (typeof goalkeeperId!=='string'||!ps.results.some(p=>p.id===goalkeeperId&&p.role==='Portero')))return null;
  const seasonId=input.seasonId??(await db.prepare('SELECT id FROM seasons WHERE active=1 LIMIT 1').first<{id:string}>())?.id;
  if(!idValue(seasonId))return null;
  if(!(await db.prepare('SELECT id FROM seasons WHERE id=?').bind(seasonId).first<{id:string}>()))return null;
  const record={...input,id,status:'finished'} as unknown;
  if(!validateMatch(record,known,typeof goalkeeperId==='string'?goalkeeperId:'__none__'))return null;
  return {record:record as Match,seasonId};
}
function matchStatements(db:Database,m:Match,id:string):Statement[] {
  const stmts:Statement[]=[];
  for(const playerId of m.appearances){
    stmts.push(db.prepare('INSERT INTO match_players(match_id,player_id,goals) VALUES(?,?,?)')
      .bind(id,playerId,m.goals[playerId]??0));
  }
  return stmts;
}
function validPlayer(input:Json):{name:string,role:'Portero'|'Jugador',a:string,b:string,initials:string}|null{
  const name=textValue(input.name,40), role=input.role;
  if(!name||(role!=='Portero'&&role!=='Jugador'))return null;
  const a=input.a===undefined?'#147aa3':input.a, b=input.b===undefined?'#6540a7':input.b;
  if(typeof a!=='string'||typeof b!=='string'||!/^#[0-9a-fA-F]{6}$/.test(a)||!/^#[0-9a-fA-F]{6}$/.test(b))return null;
  const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()??'').join('').slice(0,4);
  return {name,role,a,b,initials};
}
async function adminApi(request:Request,db:Database,email:string,path:string):Promise<Response> {
  const method=request.method;
  if(method!=='GET'){
    if(!sameOrigin(request))return err(403,'invalid_origin');
    if(!['POST','PUT','PATCH','DELETE'].includes(method))return err(405,'method_not_allowed');
  }
  if(path==='/api/admin/session'){
    if(method!=='GET')return err(405,'method_not_allowed');
    if(request.headers.get('Accept')?.includes('text/html'))return Response.redirect(new URL('/?admin=1',request.url).toString(),302);
    return json({ok:true,email});
  }
  if(path==='/api/admin/export'){
    if(method!=='GET')return err(405,'method_not_allowed');
    const data=await snapshot(db);return json(data,200,{...noStore,'Content-Disposition':'attachment; filename="martes-fc-backup.json"'});
  }
  const playerRoute=/^\/api\/admin\/players(?:\/([a-zA-Z0-9-]{1,100}))?$/.exec(path);
  if(playerRoute){
    if(method==='POST'&&!playerRoute[1]){
      const body=await readBody(request);if(!body)return err(400,'invalid_json');
      const p=validPlayer(body);if(!p)return err(400,'invalid_player');
      const id=crypto.randomUUID();
      await db.batch([db.prepare('INSERT INTO players(id,public_name,role,initials,avatar_a,avatar_b,active) VALUES(?,?,?,?,?,?,1)')
        .bind(id,p.name,p.role,p.initials,p.a,p.b),audit(db,email,'create','player',id)]);
      return json({ok:true,id},201);
    }
    if(method==='PATCH'&&playerRoute[1]){
      const id=playerRoute[1];
      const current=await db.prepare('SELECT public_name,role,avatar_a,avatar_b,active FROM players WHERE id=?').bind(id).first<{public_name:string,role:'Portero'|'Jugador',avatar_a:string,avatar_b:string,active:number}>();
      if(!current)return err(404,'player_not_found');
      const body=await readBody(request);if(!body)return err(400,'invalid_json');
      if(body.active!==undefined&&typeof body.active!=='boolean')return err(400,'invalid_active');
      const p=validPlayer({name:body.name??current.public_name,role:body.role??current.role,a:body.a??current.avatar_a,b:body.b??current.avatar_b});
      if(!p)return err(400,'invalid_player');
      if(p.role!=='Portero'){
        const used=await db.prepare('SELECT id FROM matches WHERE goalkeeper_id=? LIMIT 1').bind(id).first<{id:string}>();
        if(used)return err(409,'goalkeeper_has_history');
      }
      await db.batch([db.prepare('UPDATE players SET public_name=?,role=?,initials=?,avatar_a=?,avatar_b=?,active=? WHERE id=?')
        .bind(p.name,p.role,p.initials,p.a,p.b,body.active===undefined?current.active:(body.active?1:0),id),
        audit(db,email,'update','player',id)]);
      return json({ok:true,id});
    }
    if(method==='DELETE'&&playerRoute[1]){
      const id=playerRoute[1];
      const exists=await db.prepare('SELECT id FROM players WHERE id=?').bind(id).first<{id:string}>();
      if(!exists)return err(404,'player_not_found');
      const [appearance,goalkeeper]=await Promise.all([
        db.prepare('SELECT match_id FROM match_players WHERE player_id=? LIMIT 1').bind(id).first<{match_id:string}>(),
        db.prepare('SELECT id FROM matches WHERE goalkeeper_id=? LIMIT 1').bind(id).first<{id:string}>()
      ]);
      if(appearance||goalkeeper)return err(409,'player_has_history');
      await db.batch([
        db.prepare('DELETE FROM players WHERE id=?').bind(id),
        audit(db,email,'delete','player',id)
      ]);
      return json({ok:true,id});
    }
    return err(405,'method_not_allowed');
  }
  if(path==='/api/admin/seasons'&&method==='POST'){
    const body=await readBody(request);if(!body)return err(400,'invalid_json');
    const label=textValue(body.label,40);
    if(!label||!isValidDate(body.start)||body.end!==null&&body.end!==undefined&&!isValidDate(body.end))return err(400,'invalid_season');
    if(typeof body.end==='string'&&body.end<body.start)return err(400,'invalid_season');
    const id=crypto.randomUUID();
    await db.batch([db.prepare('INSERT INTO seasons(id,label,starts_on,ends_on,active) VALUES(?,?,?,?,0)')
      .bind(id,label,body.start,body.end??null),audit(db,email,'create','season',id)]);
    return json({ok:true,id},201);
  }
  const seasonPath=/^\/api\/admin\/seasons\/([a-zA-Z0-9-]{1,100})\/activate$/.exec(path);
  if(seasonPath&&method==='POST'){
    const id=seasonPath[1];
    if(!(await db.prepare('SELECT id FROM seasons WHERE id=?').bind(id).first<{id:string}>()))return err(404,'season_not_found');
    await db.batch([db.prepare('UPDATE seasons SET active=0 WHERE active=1'),db.prepare('UPDATE seasons SET active=1 WHERE id=?').bind(id),audit(db,email,'activate','season',id!)]);
    return json({ok:true,id});
  }
  const matchRoute=/^\/api\/admin\/matches(?:\/([a-zA-Z0-9-]{1,100}))?$/.exec(path);
  if(matchRoute){
    if(method==='POST'&&!matchRoute[1]){
      const body=await readBody(request);if(!body)return err(400,'invalid_json');
      const id=crypto.randomUUID();
      const valid=await prepareMatch(db,body,id);if(!valid)return err(400,'invalid_match');
      const {record:m,seasonId}=valid;
      await db.batch([db.prepare('INSERT INTO matches(id,season_id,played_on,opponent,goals_for,goals_against,saves,goalkeeper_id) VALUES(?,?,?,?,?,?,?,?)')
        .bind(id,seasonId,m.date,m.opponent.trim(),m.goalsFor,m.goalsAgainst,m.saves,m.goalkeeperId),
        ...matchStatements(db,m,id),audit(db,email,'create','match',id)]);
      return json({ok:true,id},201);
    }
    if(method==='PUT'&&matchRoute[1]){
      const id=matchRoute[1];
      const old=await db.prepare('SELECT revision,season_id FROM matches WHERE id=?').bind(id).first<{revision:number,season_id:string}>();
      if(!old)return err(404,'match_not_found');
      const body=await readBody(request);if(!body)return err(400,'invalid_json');
      if(!num(body.revision,1_000_000)||body.revision!==old.revision)return err(409,'stale_revision');
      const valid=await prepareMatch(db,{...body,seasonId:body.seasonId??old.season_id},id);
      if(!valid)return err(400,'invalid_match');
      const {record:m,seasonId}=valid;
      // D1 batch es transaccional: si el UPDATE optimista no toca exactamente una fila,
      // el siguiente INSERT intenta violar CHECK(actor) y revierte toda la transacción.
      // changes() debe ejecutarse inmediatamente después del UPDATE en la misma conexión.
      try {
        await db.batch([db.prepare('UPDATE matches SET season_id=?,played_on=?,opponent=?,goals_for=?,goals_against=?,saves=?,goalkeeper_id=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?')
          .bind(seasonId,m.date,m.opponent.trim(),m.goalsFor,m.goalsAgainst,m.saves,m.goalkeeperId,id,old.revision),
          db.prepare("INSERT INTO audit_events(id,actor,action,entity,entity_id) SELECT ?, '', 'revision_guard', 'match', ? WHERE changes()!=1")
            .bind(crypto.randomUUID(),id),
          db.prepare('DELETE FROM match_players WHERE match_id=?').bind(id),
          ...matchStatements(db,m,id),audit(db,email,'update','match',id)]);
      } catch(error) {
        // Un conflicto concurrente es 409; otros errores transaccionales siguen siendo 503.
        const current=await db.prepare('SELECT revision FROM matches WHERE id=?').bind(id).first<{revision:number}>();
        if(!current||current.revision!==old.revision)return err(409,'stale_revision');
        throw error;
      }
      return json({ok:true,id,revision:old.revision+1});
    }
    if(method==='DELETE'&&matchRoute[1]){
      const id=matchRoute[1];
      const exists=await db.prepare('SELECT id FROM matches WHERE id=?').bind(id).first<{id:string}>();
      if(!exists)return err(404,'match_not_found');
      await db.batch([db.prepare('DELETE FROM matches WHERE id=?').bind(id),audit(db,email,'delete','match',id)]);
      return json({ok:true,id});
    }
    return err(405,'method_not_allowed');
  }
  return err(404,'not_found');
}
export async function handleApi(request:Request, env:Env):Promise<Response> {
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/api/'))return err(404,'not_found');
  if(path==='/api/health'){
    const wrong=permittedMethod(request,['GET']);if(wrong)return wrong;
    return json({ok:true,configured:!!env.DB},200,publicHeaders);
  }
  if(path==='/api/public/snapshot'){
    const wrong=permittedMethod(request,['GET']);if(wrong)return wrong;
    if(!env.DB)return err(503,'database_not_configured');
    try{return json(await snapshot(env.DB),200,publicHeaders);}catch{return err(503,'database_unavailable');}
  }
  if(path.startsWith('/api/admin/')){
    const email=await verifyAdmin(request,env);
    if(!email)return err(401,'unauthorized');
    if(!env.DB)return err(503,'database_not_configured');
    try{return await adminApi(request,env.DB,email,path);}catch{return err(503,'operation_failed');}
  }
  return err(404,'not_found');
}
export default {
  async fetch(request:Request,env:Env):Promise<Response> {
    if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env);
    if(env.ASSETS)return env.ASSETS.fetch(request);
    return err(404,'not_found');
  }
};
