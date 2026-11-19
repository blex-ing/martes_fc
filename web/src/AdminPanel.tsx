import { useRef, useState, type FormEvent } from 'react';
import { isValidDate, type Player } from './domain/stats';
import type { Season } from './data/api';
import { createPlayer, updatePlayer, deletePlayer, createSeason, activateSeason, describeApiError } from './data/api';
type Props={online:boolean;authenticated:boolean;players:Player[];seasons:Season[];onRefresh:()=>Promise<void>;notify:(message:string)=>void};
export default function AdminPanel({online,authenticated,players,seasons,onRefresh,notify}:Props){
 const [name,setName]=useState(''),[role,setRole]=useState<'Portero'|'Jugador'>('Jugador');
 const [label,setLabel]=useState(''),[start,setStart]=useState('2027-01-01'),[end,setEnd]=useState('2027-12-31');
 const [busyAction,setBusyAction]=useState<string|null>(null),[error,setError]=useState('');
 const [pendingDelete,setPendingDelete]=useState<string|null>(null);
 const requestInFlight=useRef(false);
 const busy=busyAction!==null;
 const [editingId,setEditingId]=useState<string|null>(null),[editName,setEditName]=useState(''),[editRole,setEditRole]=useState<'Portero'|'Jugador'>('Jugador');
 function startEditing(p:Player){setError('');setPendingDelete(null);setEditingId(p.id);setEditName(p.name);setEditRole(p.role);}
 async function savePlayer(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!editingId)return;
   const trimmed=editName.trim();
   if(!trimmed||trimmed.length>40){setError('El nombre debe contener entre 1 y 40 caracteres.');return;}
   const saved=await perform('update-player',()=>updatePlayer(editingId,{name:trimmed,role:editRole}),'Jugador actualizado');
   if(saved)setEditingId(null);
 }
 async function removePlayer(p:Player){
   if(pendingDelete!==p.id)return;
   const removed=await perform('delete-player',()=>deletePlayer(p.id),'Jugador eliminado');
   if(removed){setPendingDelete(null);if(editingId===p.id)setEditingId(null);}
 }
 async function perform(action:string,task:()=>Promise<void>,success:string):Promise<boolean> {
   // El bloqueo síncrono evita un doble POST/DELETE antes de que React vuelva a renderizar.
   if(requestInFlight.current)return false;
   requestInFlight.current=true;setError('');setBusyAction(action);
   try{await task();await onRefresh();notify(success);return true;}
   catch(e){setError(describeApiError(e));return false;}
   finally{requestInFlight.current=false;setBusyAction(null);}
 }
 async function addPlayer(e:FormEvent<HTMLFormElement>){
   e.preventDefault();
   const trimmed=name.trim();
   if(!trimmed||trimmed.length>40){setError('El nombre debe contener entre 1 y 40 caracteres.');return;}
   if(await perform('create-player',()=>createPlayer(trimmed,role),'Jugador añadido'))setName('');
 }
 async function addSeason(e:FormEvent<HTMLFormElement>){
   e.preventDefault();
   const trimmed=label.trim();
   if(!trimmed||trimmed.length>40||!isValidDate(start)||(end!==''&&(!isValidDate(end)||end<start))){
    setError('Revisa el nombre y las fechas: el fin no puede preceder al inicio.');return;
   }
   if(await perform('create-season',()=>createSeason(trimmed,start,end||null),'Temporada añadida'))setLabel('');
 }
 return <section className="panel glass ui-hybrid-glass data-tools admin-tools" aria-label="Administración del equipo">
   <div className="panel-heading"><div><h2>Administración del equipo</h2><p>Resultados compartidos en Cloudflare D1 · cambios protegidos</p></div></div>
   {!authenticated?<div className="notice-block">
      {online?'Las estadísticas son públicas. Solo una persona autorizada puede modificarlas.':'Primero configura Cloudflare D1 y Access para habilitar la administración.'}
      <p style={{marginTop:10}}><a href="/api/admin/session" className="outline-btn">Entrar con Cloudflare Access</a></p>
    </div>:<div>
    <div className="notice-block">Sesión de administrador verificada. Los cambios se guardan en la base de datos compartida.</div>
    {error&&<p role="alert" className="validation" aria-live="assertive">{error}</p>}
    <h3>Plantilla</h3>
    <form className="form-grid" onSubmit={addPlayer}>
     <div className="field"><label htmlFor="admin-name">Nombre público</label><input id="admin-name" value={name} maxLength={40} required disabled={busy} onChange={e=>setName(e.target.value)}/></div>
     <div className="field"><label htmlFor="admin-role">Posición</label><select id="admin-role" value={role} disabled={busy} onChange={e=>setRole(e.target.value as 'Portero'|'Jugador')}><option>Jugador</option><option>Portero</option></select></div>
     <button className="primary-btn ui-hybrid-control" disabled={busy} aria-busy={busyAction==='create-player'} type="submit">{busyAction==='create-player'?'Añadiendo…':'Añadir jugador'}</button>
    </form>
    <div className="admin-list">
     {players.map(p=><div className="admin-row" key={p.id}>
      {editingId===p.id?<form className="form-grid" onSubmit={savePlayer} aria-label={'Editar jugador '+p.name}>
       <div className="field"><label htmlFor={'edit-name-'+p.id}>Nombre público</label><input id={'edit-name-'+p.id} value={editName} maxLength={40} required disabled={busy} onChange={e=>setEditName(e.target.value)}/></div>
       <div className="field"><label htmlFor={'edit-role-'+p.id}>Posición</label><select id={'edit-role-'+p.id} value={editRole} disabled={busy} onChange={e=>setEditRole(e.target.value as 'Portero'|'Jugador')}><option>Jugador</option><option>Portero</option></select></div>
       <button className="primary-btn ui-hybrid-control" disabled={busy} aria-busy={busyAction==='update-player'} type="submit">{busyAction==='update-player'?'Guardando…':'Guardar cambios'}</button>
       <button className="outline-btn" disabled={busy} type="button" onClick={()=>setEditingId(null)}>Cancelar</button>
      </form>:<><span>{p.name} · {p.role}{p.active===false?' · Inactivo':''}</span>
       <div className="admin-actions">
        <button className="outline-btn" type="button" disabled={busy} onClick={()=>startEditing(p)}>Editar</button>
        <button className="outline-btn" type="button" disabled={busy} aria-busy={busyAction==='toggle-player'} onClick={()=>void perform('toggle-player',()=>updatePlayer(p.id,{active:p.active===false}),'Estado actualizado')}>{p.active===false?'Reactivar':'Desactivar'}</button>
        <button className="outline-btn" type="button" disabled={busy} aria-expanded={pendingDelete===p.id} aria-controls={'confirm-delete-'+p.id} onClick={()=>{setError('');setPendingDelete(pendingDelete===p.id?null:p.id);}} aria-label={'Eliminar a '+p.name}>Eliminar</button>
        {pendingDelete===p.id&&<div id={'confirm-delete-'+p.id} className="admin-delete-confirm" role="group" aria-label={'Confirmar eliminación de '+p.name}>
         <p>¿Eliminar definitivamente a {p.name}? Esta acción no se puede deshacer. Los jugadores con historial no se pueden eliminar.</p>
         <button className="outline-btn" disabled={busy} type="button" aria-busy={busyAction==='delete-player'} onClick={()=>void removePlayer(p)}>Confirmar eliminación</button>
         <button className="outline-btn" disabled={busy} type="button" onClick={()=>setPendingDelete(null)}>Cancelar</button>
        </div>}
       </div></>}
     </div>)}
    </div>
    <h3>Temporadas</h3>
    <form className="form-grid" onSubmit={addSeason}>
      <div className="field"><label htmlFor="season-name">Nombre</label><input id="season-name" value={label} maxLength={40} required disabled={busy} placeholder="2027" onChange={e=>setLabel(e.target.value)}/></div>
      <div className="field"><label htmlFor="season-start">Inicio</label><input type="date" required id="season-start" value={start} disabled={busy} onChange={e=>setStart(e.target.value)}/></div>
      <div className="field"><label htmlFor="season-end">Fin</label><input type="date" id="season-end" value={end} disabled={busy} onChange={e=>setEnd(e.target.value)}/></div>
      <button className="outline-btn" type="submit" disabled={busy} aria-busy={busyAction==='create-season'}>{busyAction==='create-season'?'Creando…':'Crear temporada'}</button>
    </form>
    <div className="admin-list">
     {seasons.map(s=><div className="admin-row" key={s.id}><span>{s.label} {s.active?'· Activa':''}</span>
      {!s.active&&<button className="outline-btn" disabled={busy} onClick={()=>void perform('activate-season',()=>activateSeason(s.id),'Temporada activada')}>Activar</button>}
     </div>)}
    </div>
    <p><a className="outline-btn" href="/api/admin/export" download="martes-fc-export.json">Exportar datos publicados</a></p>
   </div>}
  </section>;
}
