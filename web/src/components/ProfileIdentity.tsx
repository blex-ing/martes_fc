import type {Player} from '../domain/stats';
import {Avatar} from './display';

/** Identidad compartida por jugadores y porteros. */
export default function ProfileIdentity({athlete}:{athlete:Player}){
 return <div className="profile-top">
  <Avatar p={athlete} className="profile-icon"/>
  <div>
   <h2>{athlete.name}</h2>
   <p>{athlete.role==='Portero'?'Especialidad: guardameta':'Jugador del equipo'}</p>
   <span className="role-chip">{athlete.role} · MARTES FC</span>
  </div>
 </div>;
}
