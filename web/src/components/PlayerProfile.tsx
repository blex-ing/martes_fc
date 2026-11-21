import {useMemo} from 'react';
import type {Match,Player,PlayerStats} from '../domain/stats';
import ProfileIdentity from './ProfileIdentity';
import ProfileStats from './ProfileStats';
import ProfileHistory from './ProfileHistory';

interface PlayerProfileProps{
 athlete:Player;
 metrics:PlayerStats;
 sorted:readonly Match[];
}
/** Ficha reutilizable para jugadores y porteros; solo orquesta subcomponentes. */
export default function PlayerProfile({athlete,metrics,sorted}:PlayerProfileProps){
 const history=useMemo(
  ()=>sorted.filter(match=>match.appearances.includes(athlete.id)),
  [sorted,athlete.id]
 );
 return <div className="profile-content">
  <ProfileIdentity athlete={athlete}/>
  <ProfileStats athlete={athlete} metrics={metrics}/>
  <ProfileHistory athlete={athlete} matches={history}/>
 </div>;
}
