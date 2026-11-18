import { validateMatch, type Match, type Player } from '../domain/stats';
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
export async function adminSession():Promise<boolean>{
  try {
    const res=await fetch('/api/admin/session',{headers:{Accept:'application/json'},credentials:'same-origin',redirect:'manual'});
    return res.ok&&res.headers.get('Content-Type')?.includes('application/json')===true;
  }catch{return false;}
}
async function mutation(path:string,method:'POST'|'PUT'|'PATCH'|'DELETE',payload?:unknown):Promise<Record<string,unknown>>{
  const res=await fetch(path,{method,credentials:'same-origin',headers:{Accept:'application/json',...(payload===undefined?{}:{'Content-Type':'application/json'})},body:payload===undefined?undefined:JSON.stringify(payload)});
  const data:unknown=await res.json().catch(()=>({}));
  if(!res.ok){
    const err=data&&typeof data==='object'&&'code' in data?String(data.code):'error_'+res.status;
    throw new Error(err);
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
