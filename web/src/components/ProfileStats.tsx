import type {Player,PlayerStats} from '../domain/stats';
import {ProfileGlyph} from './ProfileGlyph';

type ProfileStat={label:string;value:string|number;icon:'shirt'|'ball'|'trend'};
function StatCard({label,value,icon}:ProfileStat){
 return <div className="profile-stat">
  <span className="profile-stat-icon"><ProfileGlyph name={icon}/></span>
  <span className="profile-stat-copy"><strong>{value}</strong><span>{label}</span></span>
 </div>;
}
/** Presentación de métricas: una única plantilla para ambos roles. */
export default function ProfileStats({athlete,metrics}:{athlete:Player;metrics:PlayerStats}){
 const isKeeper=athlete.role==='Portero';
 const thirdValue=isKeeper?metrics.saves:metrics.played?(metrics.goals/metrics.played).toFixed(2):'0.00';
 return <>
  <div className="profile-numbers">
   <StatCard icon="shirt" value={metrics.played} label="Partidos"/>
   <StatCard icon="ball" value={metrics.goals} label="Goles"/>
   <StatCard icon="trend" value={thirdValue} label={isKeeper?'Paradas':'Goles / partido'}/>
  </div>
  {isKeeper&&<div className="notice-block keeper-methodology">
   Efectividad como portero: <strong>{metrics.rate}%</strong> · Goles encajados: <strong>{metrics.conceded}</strong> · Porterías a cero: <strong>{metrics.clean}</strong>.
  </div>}
 </>;
}
