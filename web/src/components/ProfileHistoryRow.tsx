import {resultCode,type Match,type Player} from '../domain/stats';
import {formatDate,resultLabels} from './display';
import {ProfileGlyph} from './ProfileGlyph';

/** Un encuentro; no controla el desplazamiento ni las medidas del panel. */
export default function ProfileHistoryRow({match,athlete}:{match:Match;athlete:Player}){
 const result=resultCode(match);
 const performance=athlete.role==='Portero'&&match.goalkeeperId===athlete.id
  ?match.saves+' paradas':(match.goals[athlete.id]??0)+' goles';
 return <div className="match-row">
  <span className="profile-history-emblem" aria-hidden="true">
   <ProfileGlyph name="shield"/>
   <span>{match.opponent.trim().charAt(0).toUpperCase()||'?'}</span>
  </span>
  <div className="match-info"><strong>{match.opponent}</strong><small>{formatDate(match.date)}</small></div>
  <div className="match-result">
   <strong>{performance}</strong>
   <span className={'result-label '+result}>{resultLabels[result]}</span>
  </div>
 </div>;
}
