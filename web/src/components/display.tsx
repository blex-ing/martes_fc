import type { CSSProperties, ReactNode } from 'react';
import { resultCode, type Match, type Player } from '../domain/stats';
export const resultLabels={win:'VICTORIA',loss:'DERROTA',draw:'EMPATE'};
export function Icon({name, className='icon'}:{name:string;className?:string}) { return <svg className={className} aria-hidden="true"><use href={'#ic-'+name}/></svg>; }
export function Avatar({p,className='round-avatar'}:{p:Player;className?:string}) {
 const style = {'--avatar-a':p.a,'--avatar-b':p.b} as CSSProperties;
 return <span className={className} style={style}>{p.initials}</span>;
}
export function formatDate(value:string) { return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00')); }
export function datePart(value:string) {const date = new Date(value+'T12:00:00');return {day:String(date.getDate()).padStart(2,'0'),month:new Intl.DateTimeFormat('es-ES',{month:'short'}).format(date).replace('.','').toUpperCase()};}
export function Intro({eyebrow,title,accent,description,action}:{eyebrow:string;title:string;accent:string;description:string;action?:ReactNode}) {
 return <section className="view-intro"><div><div className="kicker"><i className="line"/>{eyebrow}</div><h1>{title}<br/><span>{accent}</span></h1><p>{description}</p></div>{action}</section>;
}
export function Disclaimer({live,online,unavailable}:{live:boolean;online:boolean;unavailable:boolean}) {return <div className="disclaimer"><Icon name="info"/><span>{unavailable?<><strong>Servicio temporalmente no disponible.</strong> No se muestran datos ficticios como resultados reales. Inténtalo de nuevo más tarde.</>:live?<><strong>Resultados compartidos.</strong> Datos cargados desde Cloudflare D1.</>:online?<><strong>Base de datos vacía.</strong> Se muestra una demo local hasta dar de alta al portero.</>:<><strong>Vista de demostración.</strong> Partidos y resultados ficticios. Los cambios se guardan solo en este dispositivo.</>}</span></div>;}
export function Metric({label,value,hint,icon,tone}:{label:string;value:number|string;hint:string;icon:string;tone:string}){
 return <div className={'metric glass tone-'+tone}><div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Icon name={icon}/></span></div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>;
}
export function MatchRow({m,onDetail}:{m:Match;onDetail:(id:string)=>void}) {
 const d=datePart(m.date),r=resultCode(m);
 return <div className="match-row"><div className="match-date"><strong>{d.day}</strong>{d.month}</div><div className="match-info"><strong>MARTES FC <span style={{color:'#60708e'}}>vs</span> {m.opponent}</strong><small>{formatDate(m.date)}</small></div><div className="match-result"><strong>{m.goalsFor} <span style={{color:'#687693'}}>:</span> {m.goalsAgainst}</strong><span className={'result-label '+r}>{resultLabels[r]}</span></div><button className="match-row-btn" onClick={()=>onDetail(m.id)} aria-label={'Detalle frente a '+m.opponent}><Icon name="chevron"/></button></div>;
}
export function Donut({rate}:{rate:number}) {
 const circumference=2*Math.PI*52,dash=circumference*Math.min(100,Math.max(0,rate))/100;
 return <div className="donut"><svg viewBox="0 0 130 130" role="img" aria-label={String(rate)+'% de paradas'}><defs><linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#24e6fa"/><stop offset="1" stopColor="#f533e7"/></linearGradient></defs><circle className="donut-track" cx="65" cy="65" r="52"/><circle className="donut-value" cx="65" cy="65" r="52" strokeDasharray={dash.toFixed(2)+' '+circumference.toFixed(2)}/></svg><div className="donut-label">{rate}%<small>paradas</small></div></div>;
}
