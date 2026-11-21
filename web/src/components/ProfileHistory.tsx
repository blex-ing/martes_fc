import {useId} from 'react';
import type {Match,Player} from '../domain/stats';
import ProfileHistoryRow from './ProfileHistoryRow';

/** Un único viewport de scroll con grid natural; encabezado fuera del scroll. */
export default function ProfileHistory({athlete,matches}:{athlete:Player;matches:readonly Match[]}){
 const titleId=useId();
 return <>
  <h3 className="profile-history-title" id={titleId}>Historial de partidos</h3>
  <div className="profile-history-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
   <div className="match-preview-list profile-history-list">
    {matches.map(match=><ProfileHistoryRow key={match.id} match={match} athlete={athlete}/>)}
    {!matches.length&&<div className="empty-state">Sin partidos disputados</div>}
   </div>
  </div>
 </>;
}
