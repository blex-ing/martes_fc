import {useRef,useState,type FormEvent} from 'react';
import {isValidDate,validateMatch,type Match,type Player} from '../domain/stats';
import {Icon} from './display';
export default function AddMatchForm({onClose,onSave,players,goalkeeper,initial,shared}:{onClose:()=>void;onSave:(m:Match)=>Promise<string|null>;players:Player[];goalkeeper:Player|undefined;initial?:Match;shared:boolean}) {
 const [date,setDate]=useState(initial?.date??new Date().toLocaleDateString('en-CA'));
 const [opponent,setOpponent]=useState(initial?.opponent??'');
 const [goalsFor,setGoalsFor]=useState(String(initial?.goalsFor??0)),[goalsAgainst,setGoalsAgainst]=useState(String(initial?.goalsAgainst??0)),[saves,setSaves]=useState(String(initial?.saves??0));
 const [present,setPresent]=useState<Record<string,boolean>>(Object.fromEntries(players.map(p=>[p.id,initial?initial.appearances.includes(p.id):true])));
 const [goals,setGoals]=useState<Record<string,string>>(Object.fromEntries(players.map(p=>[p.id,String(initial?.goals[p.id]??0)])));
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const savingRef=useRef(false);
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if(savingRef.current)return;
  setError('');
  const nums=[goalsFor,goalsAgainst,saves,...players.map(p=>goals[p.id]??'0')];
  if(nums.some(n=>!/^\d+$/.test(n))){setError('Los goles y las paradas deben ser enteros no negativos.');return;}
  if(!isValidDate(date)){setError('Introduce una fecha válida.');return;}
  if(!opponent.trim() || opponent.trim().length>80){setError('Indica un rival de hasta 80 caracteres.');return;}
  const appearances=players.filter(p=>present[p.id]).map(p=>p.id);
  if(!appearances.length){setError('Selecciona al menos un jugador.');return;}
  if(players.some(p=>!present[p.id] && Number(goals[p.id])!==0)){setError('Un jugador ausente no puede marcar goles.');return;}
  const assigned=Object.fromEntries(appearances.map((id):[string,number]=>[id,Number(goals[id]??0)]).filter(([,n])=>n>0)) as Record<string,number>;
  if(Object.values(assigned).reduce((n,v)=>n+v,0)!==Number(goalsFor)){setError('La suma de goles por jugador debe coincidir con el marcador.');return;}
  const keeperPresent=!!goalkeeper&&appearances.includes(goalkeeper.id);
  const record: Match={id:initial?.id??('local-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),date,opponent:opponent.trim(),goalsFor:Number(goalsFor),goalsAgainst:Number(goalsAgainst),saves:Number(saves),appearances,goals:assigned,goalkeeperId:keeperPresent?goalkeeper!.id:null,status:'finished',...(initial?.revision?{revision:initial.revision}:{}),...(initial?.seasonId?{seasonId:initial.seasonId}:{})};
  if(!validateMatch(record,players.map(p=>p.id),goalkeeper?.id??'__none__')){setError('El partido contiene cifras inconsistentes. Revisa los valores y la participación del portero.');return;}
  savingRef.current=true;setSaving(true);
  try{
   const saveError=await onSave(record);
   if(saveError)setError(saveError);
  }catch{setError('No se pudo guardar el partido. Inténtalo de nuevo.');}
  finally{savingRef.current=false;setSaving(false);}
 }
 return <form id="addMatchForm" onSubmit={submit}><div className="modal-scroll" tabIndex={0} aria-label="Datos del partido"><div className="form-grid"><div className="field"><label htmlFor="matchDate">Fecha</label><input id="matchDate" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></div><div className="field"><label htmlFor="matchOpponent">Equipo rival</label><input id="matchOpponent" required maxLength={80} placeholder="Nombre del rival" value={opponent} onChange={e=>setOpponent(e.target.value)}/></div><div className="field"><label htmlFor="matchGF">Goles a favor</label><input id="matchGF" type="number" min="0" max="99" step="1" required value={goalsFor} onChange={e=>setGoalsFor(e.target.value)}/></div><div className="field"><label htmlFor="matchGA">Goles en contra</label><input id="matchGA" type="number" min="0" max="99" step="1" required value={goalsAgainst} onChange={e=>setGoalsAgainst(e.target.value)}/></div><div className="field full"><label htmlFor="matchSaves">Paradas del portero</label><input id="matchSaves" type="number" min="0" max="200" step="1" required value={saves} onChange={e=>setSaves(e.target.value)}/></div></div><div className="form-section-title">Participantes y goleadores</div><p style={{fontSize:12,marginBottom:12}}>Marca quién jugó e indica los goles individuales.</p><div className="goal-input-list">{players.map(p=><div className={'goal-input-row '+(!present[p.id]?'disabled':'')} key={p.id}><input id={'present-'+p.id} type="checkbox" checked={!!present[p.id]} onChange={e=>{const checked=e.target.checked;setPresent(s=>({...s,[p.id]:checked}));if(!checked)setGoals(s=>({...s,[p.id]:'0'}));}} aria-label={p.name+' participó'}/><label htmlFor={'present-'+p.id}>{p.name}</label><input aria-label={'Goles de '+p.name} type="number" min="0" max="99" value={goals[p.id]} disabled={!present[p.id]} onChange={e=>setGoals(s=>({...s,[p.id]:e.target.value}))}/></div>)}</div><div className="modal-note">La suma de los goles individuales debe coincidir con el marcador. {shared?'Se guardará en Cloudflare D1 y será visible desde otros dispositivos.':'Los datos de esta demostración se guardan solo en este dispositivo.'}</div></div><div className="modal-footer">{error&&<div className="validation" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" disabled={saving} onClick={onClose}>Cancelar</button><button className="primary-btn ui-hybrid-control" type="submit" disabled={saving} aria-busy={saving}>{saving?'Guardando…':initial?'Actualizar partido':'Guardar partido'} <Icon name="arrow"/></button></div></div></form>;
}
