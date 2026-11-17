import { useState, type FormEvent } from 'react';
import type { Player } from './domain/stats';
import type { Season } from './data/api';
import { createPlayer, updatePlayer, createSeason, activateSeason } from './data/api';
type Props={online:boolean;authenticated:boolean;players:Player[];seasons:Season[];onRefresh:()=>Promise<void>;notify:(message:string)=>void};
export default function AdminPanel({online,authenticated,players,seasons,onRefresh,notify}:Props){
 const [name,setName]=useState(''),[role,setRole]=useState<'Portero'|'Jugador'>('Jugador');
 const [label,setLabel]=useState(''),[start,setStart]=useState('2027-01-01'),[end,setEnd]=useState('2027-12-31');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function perform(task:()=>Promise<void>,success:string) {
   setError('');setBusy(true);
   try{await task();await onRefresh();notify(success);}
   catch(e){setError(e instanceof Error?e.message:'No se pudo completar la operación');}
   finally{setBusy(false);}
 }
 async function addPlayer(e:FormEvent<HTMLFormElement>){
   e.preventDefault();await perform(()=>createPlayer(name,role),'Jugador añadido');setName('');
 }
 async function addSeason(e:FormEvent<HTMLFormElement>){
   e.preventDefault();await perform(()=>createSeason(label,start,end||null),'Temporada añadida');setLabel('');
 }
 return <section className="panel glass data-tools admin-tools" aria-label="Administración del equipo">
   <div className="panel-heading"><div><h2>Administración del equipo</h2><p>Resultados compartidos en Cloudflare D1 · cambios protegidos</p></div></div>
   {!authenticated?<div className="notice-block">
      {online?'Las estadísticas son públicas. Solo una persona autorizada puede modificarlas.':'Primero configura Cloudflare D1 y Access para habilitar la administración.'}
      <p style={{marginTop:10}}><a href="/api/admin/session" className="outline-btn">Entrar con Cloudflare Access</a></p>
    </div>:<div>
    <div className="notice-block">Sesión de administrador verificada. Los cambios se guardan en la base de datos compartida.</div>
    <h3>Plantilla</h3>
    <form className="form-grid" onSubmit={addPlayer}>
     <div className="field"><label htmlFor="admin-name">Nombre público</label><input id="admin-name" value={name} maxLength={40} required onChange={e=>setName(e.target.value)}/></div>
     <div className="field"><label htmlFor="admin-role">Posición</label><select id="admin-role" value={role} onChange={e=>setRole(e.target.value as 'Portero'|'Jugador')}><option>Jugador</option><option>Portero</option></select></div>
     <button className="primary-btn" disabled={busy} type="submit">Añadir jugador</button>
    </form>
    <div className="admin-list">
     {players.map(p=><div className="admin-row" key={p.id}><span>{p.name} · {p.role}{p.active===false?' · Inactivo':''}</span>
      <button className="outline-btn" disabled={busy} onClick={()=>perform(()=>updatePlayer(p.id,{active:p.active===false}),'Estado actualizado')}>{p.active===false?'Reactivar':'Desactivar'}</button>
     </div>)}
    </div>
    <h3>Temporadas</h3>
    <form className="form-grid" onSubmit={addSeason}>
      <div className="field"><label htmlFor="season-name">Nombre</label><input id="season-name" value={label} maxLength={40} required placeholder="2027" onChange={e=>setLabel(e.target.value)}/></div>
      <div className="field"><label htmlFor="season-start">Inicio</label><input type="date" required id="season-start" value={start} onChange={e=>setStart(e.target.value)}/></div>
      <div className="field"><label htmlFor="season-end">Fin</label><input type="date" id="season-end" value={end} onChange={e=>setEnd(e.target.value)}/></div>
      <button className="outline-btn" type="submit" disabled={busy}>Crear temporada</button>
    </form>
    <div className="admin-list">
     {seasons.map(s=><div className="admin-row" key={s.id}><span>{s.label} {s.active?'· Activa':''}</span>
      {!s.active&&<button className="outline-btn" disabled={busy} onClick={()=>perform(()=>activateSeason(s.id),'Temporada activada')}>Activar</button>}
     </div>)}
    </div>
    <p><a className="outline-btn" href="/api/admin/export" download="martes-fc-export.json">Exportar datos publicados</a></p>
    {error&&<p role="alert" className="validation">{error}</p>}
   </div>}
  </section>;
}
