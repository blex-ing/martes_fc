import { validateMatch, type Match, type Player } from '../domain/stats';
export interface Season {id:string;label:string;start:string;end:string|null;active:boolean}
export interface Snapshot {version:2;source:'d1';updatedAt:string;seasons:Season[];players:Player[];matches:Match[]}
export async function loadPublicSnapshot(): Promise<Snapshot|null> {
  try {
    const res=await fetch('/api/public/snapshot',{headers:{Accept:'application/json'},cache:'no-store'});
    if(!res.ok||!res.headers.get('Content-Type')?.includes('application/json'))return null;
    const raw:unknown=await res.json();
    if(!raw||typeof raw!=='object')return null;
    const s=raw as Partial<Snapshot>;
    if(s.version!==2||s.source!=='d1'||!Array.isArray(s.players)||!Array.isArray(s.matches)||!Array.isArray(s.seasons))return null;
    const all=s.players as Player[];
    if(all.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||(p.role!=='Portero'&&p.role!=='Jugador')))return null;
    const ids=all.map(p=>p.id),keepers=new Set(all.filter(p=>p.role==='Portero').map(p=>p.id));
    const matches=(s.matches as unknown[]).filter((m):m is Match=>{
      if(!m||typeof m!=='object')return false;
      const candidate=m as Match;
      return (candidate.goalkeeperId===null||keepers.has(candidate.goalkeeperId)) &&
        validateMatch(m,ids,candidate.goalkeeperId??'__none__');
    });
    if(matches.length!==s.matches.length)return null;
    return {...s,players:all,matches} as Snapshot;
  }catch{return null;}
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
export async function createSeason(label:string,start:string,end:string|null):Promise<void>{
  await mutation('/api/admin/seasons','POST',{label,start,end});
}
export async function activateSeason(id:string):Promise<void>{
  await mutation('/api/admin/seasons/'+encodeURIComponent(id)+'/activate','POST',{});
}
