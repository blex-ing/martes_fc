import {useId,type KeyboardEvent} from 'react';
import type {Match,Player} from '../domain/stats';
import ProfileHistoryRow from './ProfileHistoryRow';

/**
 * Asegura Home/End sobre el contenedor interno, también en Chromium móvil/tablet.
 * La navegación restante (flechas, PageUp/PageDown, Tab) es nativa.
 */
function handleHistoryKeyboard(event:KeyboardEvent<HTMLDivElement>){
 if(event.target!==event.currentTarget)return;
 if(event.key!=='Home'&&event.key!=='End')return;
 const history=event.currentTarget;
 if(history.scrollHeight<=history.clientHeight)return;
 event.preventDefault();
 history.scrollTop=event.key==='Home'?0:history.scrollHeight-history.clientHeight;
}

/** Un único viewport de scroll con grid natural; encabezado fuera del scroll. */
export default function ProfileHistory({athlete,matches}:{athlete:Player;matches:readonly Match[]}){
 const titleId=useId();
 return <>
  <h3 className="profile-history-title" id={titleId}>Historial de partidos</h3>
  <div className="profile-history-scroll" role="region" aria-labelledby={titleId} tabIndex={0} onKeyDown={handleHistoryKeyboard}>
   <div className="match-preview-list profile-history-list">
    {matches.map(match=><ProfileHistoryRow key={match.id} match={match} athlete={athlete}/>)}
    {!matches.length&&<div className="empty-state">Sin partidos disputados</div>}
   </div>
  </div>
 </>;
}
