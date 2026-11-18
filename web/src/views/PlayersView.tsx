import {useMemo} from 'react';
import type {ViewContext} from './types';
import {Icon,Avatar,Intro,Disclaimer} from '../components/display';
import {metricsByPlayer} from '../domain/stats';
export default function PlayersView(context:ViewContext){
 const {live,online,unavailable,players,visibleMatches,setModal}=context;
 const indexed=useMemo(()=>metricsByPlayer(players,visibleMatches),[players,visibleMatches]);
 return <><Intro eyebrow="LA PLANTILLA" title="Los que hacen" accent="grande al equipo." description="Cada jugador tiene su historia. Estos son sus números."/><Disclaimer live={live} online={online} unavailable={unavailable}/><div className="players-grid">{players.map(p=>{const x=indexed.get(p.id)!,keeperRole=p.role==='Portero';return <article className="player-card glass ui-hybrid-glass" key={p.id}><div className="player-card-head"><div className="player-card-top"><Avatar p={p}/><span className={'role-chip '+(keeperRole?'':'outfield')}>{p.role.toUpperCase()}</span></div><h3>{p.name}</h3><span className="player-card-sub">{keeperRole?'Defendiendo la portería':'Plantilla MARTES FC'}</span></div><div className="player-card-stats"><div><strong>{keeperRole?x.saves:x.goals}</strong><span>{keeperRole?'Paradas':'Goles'}</span></div><div><strong>{x.played}</strong><span>Partidos</span></div></div><div className="player-card-foot"><button onClick={()=>setModal({kind:'profile',id:p.id})} aria-label={'Ver estadísticas de '+p.name}>Ver ficha del jugador <Icon name="arrow"/></button></div></article>;})}</div></>;
}
