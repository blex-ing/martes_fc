import { validateMatch, type Match, type Player } from '../domain/stats.ts';
export interface Season {id:string;label:string;start:string;end:string|null;active:boolean}
export interface Snapshot {version:2;source:'d1';updatedAt:string;seasons:Season[];players:Player[];matches:Match[]}
export type SnapshotLoadResult = {mode:'live';snapshot:Snapshot}|{mode:'demo'}|{mode:'unavailable'};
/** Fail visible: una avería D1 nunca se convierte silenciosamente en estadísticas ficticias. */
export async function loadPublicSnapshotResult(): Promise<SnapshotLoadResult> {
  try {
    const res=await fetch('/api/public/snapshot',{headers:{Accept:'application/json'},cache:'no-store'});
    const contentType=res.headers.get('Content-Type')??'';
    // Servidor estático local sin Worker: no existe API. En ese caso se permite la demo.
    if(res.status===404||(res.ok&&contentType.includes('text/html')))return {mode:'demo'};
    if(!res.ok||!contentType.includes('application/json'))return {mode:'unavailable'};
    const raw:unknown=await res.json();
    if(!raw||typeof raw!=='object')return {mode:'unavailable'};
    const s=raw as Partial<Snapshot>;
    if(s.version!==2||s.source!=='d1'||!Array.isArray(s.players)||!Array.isArray(s.matches)||!Array.isArray(s.seasons))return {mode:'unavailable'};
    const all=s.players as Player[];
    if(all.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||(p.role!=='Portero'&&p.role!=='Jugador')))return {mode:'unavailable'};
    const ids=all.map(p=>p.id),keepers=new Set(all.filter(p=>p.role==='Portero').map(p=>p.id));
    const matches=(s.matches as unknown[]).filter((m):m is Match=>{
      if(!m||typeof m!=='object')return false;
      const candidate=m as Match;
      return (candidate.goalkeeperId===null||keepers.has(candidate.goalkeeperId)) &&
        validateMatch(m,ids,candidate.goalkeeperId??'__none__');
    });
    if(matches.length!==s.matches.length)return {mode:'unavailable'};
    return {mode:'live',snapshot:{...s,players:all,matches} as Snapshot};
  }catch{return {mode:'unavailable'};}
}
export class ApiError extends Error {
 constructor(public readonly code:string,public readonly status:number){super(code);this.name='ApiError';}
}
/** Mensajes estables en español; nunca revelar detalles internos del Worker. */
export function describeApiError(error:unknown):string{
 const code=error instanceof ApiError?error.code:error instanceof Error?error.message:'unexpected';
 const messages:Record<string,string>={
  unauthorized:'Tu sesión de administrador ha caducado. Vuelve a entrar con Cloudflare Access.',
  invalid_origin:'La solicitud no supera la comprobación de seguridad. Recarga la página.',
  stale_revision:'Otro cambio ha actualizado este partido. Recarga los datos antes de volver a editar.',
  invalid_match:'El partido contiene datos inconsistentes. Revisa los goles, el portero y los participantes.',
  invalid_player:'Revisa el nombre y la posición del jugador.',
  player_has_history:'No se puede eliminar: el jugador tiene partidos registrados. Puedes desactivarlo.',
  goalkeeper_has_history:'El jugador figura como portero en partidos anteriores; no se puede cambiar su posición.',
  database_unavailable:'Cloudflare D1 no está disponible. No se han guardado cambios.',
  operation_failed:'El servidor no pudo completar la operación. Inténtalo de nuevo.',
  network:'No hay conexión con el servidor. Comprueba la red y vuelve a intentarlo.'
 };
 return messages[code]??'No se pudo completar la operación. Código: '+code;
}
export async function adminSession():Promise<boolean>{
  try {
    const res=await fetch('/api/admin/session',{headers:{Accept:'application/json'},credentials:'same-origin',redirect:'manual'});
    if(!res.ok||!res.headers.get('Content-Type')?.includes('application/json'))return false;
    const data:unknown=await res.json();
    return !!data&&typeof data==='object'&&'ok' in data&&data.ok===true;
  }catch{return false;}
}
async function mutation(path:string,method:'POST'|'PUT'|'PATCH'|'DELETE',payload?:unknown):Promise<Record<string,unknown>>{
 let res:Response;
 try{res=await fetch(path,{method,credentials:'same-origin',headers:{Accept:'application/json',...(payload===undefined?{}:{'Content-Type':'application/json'})},body:payload===undefined?undefined:JSON.stringify(payload)});}
 catch{throw new ApiError('network',0);}
 const data:unknown=await res.json().catch(()=>({}));
 if(!res.ok){
  const code=data&&typeof data==='object'&&'code' in data?String(data.code):'error_'+res.status;
  throw new ApiError(code,res.status);
 }
 return data as Record<string,unknown>;
}
export async function createMatch(record:Match):Promise<void>{
  await mutation('/api/admin/matches','POST',record);
}
export async function updateMatch(record:Match):Promise<void>{
  await mutation('/api/admin/matches/'+encodeURIComponent(record.id),'PUT',record);
}
export async function deleteMatch(id:string):Promise<void>{
  await mutation('/api/admin/matches/'+encodeURIComponent(id),'DELETE');
}
export async function createPlayer(name:string,role:'Portero'|'Jugador'):Promise<void>{
  await mutation('/api/admin/players','POST',{name,role});
}
export async function updatePlayer(id:string,patch:{name?:string;role?:'Portero'|'Jugador';active?:boolean}):Promise<void>{
  await mutation('/api/admin/players/'+encodeURIComponent(id),'PATCH',patch);
}
export async function deletePlayer(id:string):Promise<void>{
  await mutation('/api/admin/players/'+encodeURIComponent(id),'DELETE');
}
export async function createSeason(label:string,start:string,end:string|null):Promise<void>{
  await mutation('/api/admin/seasons','POST',{label,start,end});
}
export async function activateSeason(id:string):Promise<void>{
  await mutation('/api/admin/seasons/'+encodeURIComponent(id)+'/activate','POST',{});
}
