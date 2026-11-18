import { useEffect, useMemo, useRef, useState } from 'react';
import {Icon} from './components/display';
import type {View,ModalState,Filter} from './viewTypes';
import type {ViewContext} from './views/types';
import OverviewView from './views/OverviewView';
import MatchesView from './views/MatchesView';
import PlayersView from './views/PlayersView';
import GoalkeeperView from './views/GoalkeeperView';
import SettingsView from './views/SettingsView';
import AddMatchForm from './components/AddMatchForm';
import PlayerProfile from './components/PlayerProfile';
import { players as demoPlayers, seedMatches } from './data/demo';
import { adminSession, loadPublicSnapshotResult, createMatch, updateMatch, deleteMatch, type Season } from './data/api';
import { loadMatches, saveMatches } from './data/storage';
import { leaderboard, teamMetrics, seasonMatches, type Match, type Player } from './domain/stats';

const names: Record<Exclude<View,'settings'>,string> = {overview:'Resumen general',matches:'Partidos',players:'Jugadores',goalkeeper:'Portería'};
const icons: Record<Exclude<View,'settings'>,string> = {overview:'grid',matches:'calendar',players:'users',goalkeeper:'shield'};

export default function App() {
 const [players,setPlayers]=useState<Player[]>(demoPlayers);
 const [matches,setMatches]=useState<Match[]>(loadMatches);
 const [seasons,setSeasons]=useState<Season[]>([]);
 const [adminPlayers,setAdminPlayers]=useState<Player[]>([]);
 const [online,setOnline]=useState(false);
 const [live,setLive]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const [admin,setAdmin]=useState(false);
 const [selectedKeeperId,setSelectedKeeperId]=useState<string|null>(null);
 const [view,setView]=useState<View>(new URLSearchParams(window.location.search).has('admin')?'settings':'overview');
 const [filter,setFilter]=useState<Filter>('all');
 const [selected,setSelected]=useState<string|null>(null);
 const [modal,setModal]=useState<ModalState>(null);
 const [toast,setToast]=useState('');
 const focusRef=useRef<HTMLElement|null>(null);
 const goalkeepers=players.filter(p=>p.role==='Portero');
 const goalkeeper=goalkeepers.find(p=>p.id===selectedKeeperId)??goalkeepers[0];
 const activeSeason=seasons.find(s=>s.active);
 async function refreshRemote(){
  const result=await loadPublicSnapshotResult();
  if(result.mode==='demo'){
   setUnavailable(false);setOnline(false);setAdminPlayers([]);setSeasons([]);
   setLive(false);setPlayers(demoPlayers);setMatches(loadMatches());return;
  }
  if(result.mode==='unavailable'){
   setUnavailable(true);setOnline(true);setAdminPlayers([]);setSeasons([]);
   setLive(false);setPlayers([]);setMatches([]);return;
  }
  const snapshot=result.snapshot;
  setUnavailable(false);setOnline(true);setSeasons(snapshot.seasons);setAdminPlayers(snapshot.players);
  setPlayers(snapshot.players);setMatches(snapshot.matches);setLive(true);
 }
 useEffect(()=>{void refreshRemote();void adminSession().then(setAdmin);},[]);
 const visibleMatches=useMemo(()=>seasonMatches(matches,live?activeSeason?.id??null:null),[matches,live,activeSeason?.id]);
 const sorted=useMemo(()=>[...visibleMatches].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)),[visibleMatches]);
 const summary=useMemo(()=>teamMetrics(visibleMatches,players),[visibleMatches,players]);
 const ranking=useMemo(()=>leaderboard(players,visibleMatches),[visibleMatches,players]);
 const selectedMatch=sorted.find(m=>m.id===selected)??sorted[0];
 const athlete=modal?.kind==='profile'?players.find(p=>p.id===modal.id):undefined;
 function changeView(v:View) {setView(v);setModal(null);window.scrollTo({top:0,behavior:'auto'});}
 function showMessage(msg:string) {setToast(msg);}
 useEffect(()=>{if(!toast)return;const id=window.setTimeout(()=>setToast(''),3500);return()=>window.clearTimeout(id);},[toast]);
 useEffect(()=>{
  if(!modal)return;
  focusRef.current=document.activeElement instanceof HTMLElement ? document.activeElement:null;
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape')setModal(null);
   if(e.key==='Tab'){const dialog=document.querySelector<HTMLElement>('[role="dialog"]');const candidates=[...(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')??[])];if(!candidates.length)return;const first=candidates[0]!,last=candidates[candidates.length-1]!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  };
  document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';
  window.setTimeout(()=>document.querySelector<HTMLElement>('[role="dialog"] button')?.focus(),0);
  return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';focusRef.current?.focus();};
 },[modal]);
 async function save(m:Match):Promise<boolean> {
  if(unavailable)return false;
  if(online){
   if(!admin)return false;
   try{if(m.revision){await updateMatch(m);}else{await createMatch(m);}await refreshRemote();setFilter('all');setModal(null);changeView('matches');showMessage('Partido guardado en Cloudflare D1');return true;}
   catch{return false;}
  }
  const next=[m,...matches];
  if(!saveMatches(next))return false;
  setMatches(next);setSelected(m.id);setFilter('all');setModal(null);changeView('matches');showMessage('Partido añadido solo a este dispositivo');return true;
 }
 async function remove(id:string){
  if(!admin||!online||!window.confirm('¿Eliminar este partido de la base compartida?'))return;
  try{await deleteMatch(id);await refreshRemote();setSelected(null);showMessage('Partido eliminado');}catch{showMessage('No se pudo eliminar el partido');}
 }
 function details(id:string){setSelected(id);changeView('matches');}
 function reset(){if(!window.confirm('¿Restaurar los partidos ficticios? Se borrarán los añadidos en este dispositivo.'))return;const fresh=structuredClone(seedMatches);if(saveMatches(fresh)){setMatches(fresh);setSelected(null);setFilter('all');showMessage('Datos ficticios restaurados');}else showMessage('No se pudieron guardar los datos');}
 const resultForm = sorted.slice(0,5).reverse();
 const viewContext:ViewContext={live,online,unavailable,admin,players,adminPlayers,matches,visibleMatches,sorted,summary,ranking,seasons,activeSeason,goalkeepers,goalkeeper,selectedMatch,filter,resultForm,changeView,details,remove,setModal,setFilter,setSelected,setSelectedKeeperId,refreshRemote,showMessage,reset};
 const nav=(v:Exclude<View,'settings'>,label?:string,small=false)=><button key={v} className={small?'mobile-nav-item '+(view===v?'active':''):'nav-item '+(view===v?'active':'')} onClick={()=>changeView(v)} aria-current={view===v?'page':undefined}><Icon name={icons[v]}/>{small?<span>{label??names[v]}</span>:<>{names[v]}<span className="nav-dot"/></>}</button>;
 return <><div className="ambient ambient-a"/><div className="ambient ambient-b"/><div className="noise"/><div className="app-shell"><aside className="sidebar glass ui-hybrid-glass" aria-label="Navegación lateral"><div className="brand"><div className="brand-icon"><Icon name="ball"/></div><div><strong>MARTES<span>FC</span></strong><small>EL EQUIPO. LOS NÚMEROS.</small></div></div><div className="side-divider"/><div className="side-kicker">NAVEGACIÓN</div><nav className="side-nav" aria-label="Secciones">{nav('overview')}{nav('matches')}{nav('players')}{nav('goalkeeper')}</nav><div className="sidebar-spacer"/><div className="side-info"><div className="side-info-icon"><Icon name="info"/></div><strong>{unavailable?'Conexión D1 interrumpida':live?'Datos compartidos':'Datos de demostración'}</strong><p>{unavailable?'No se han cargado estadísticas para evitar confundirlas con datos de prueba.':live?'Resultados del equipo sincronizados con D1.':online?'La base D1 aún no tiene plantilla válida.':'Resultados ficticios. Tu navegador guarda los cambios de prueba.'}</p><span className="tiny-line"/><button className="side-text-btn" onClick={()=>changeView('settings')}>Gestionar datos <Icon name="arrow"/></button></div><div className="side-foot">© 2026 MARTES FC <span>·</span> React + TypeScript</div></aside>
 <div className="main-shell"><header className="topbar"><div className="top-left"><div className="mobile-brand"><span className="mobile-ball"><Icon name="ball"/></span><strong>MARTES<span>FC</span></strong></div><div className="breadcrumbs"><span>Club</span><Icon name="chevron"/><span>{view==='settings'?'Datos':names[view]}</span></div></div><div className="top-actions"><span className="season-pill"><span className="season-dot"/> TEMPORADA {activeSeason?.label??(live?'SIN ACTIVA':'2026')}</span><button className="avatar-btn" onClick={()=>{if(goalkeeper)setModal({kind:'profile',id:goalkeeper.id});else changeView('goalkeeper');}} aria-label={goalkeeper?'Mostrar ficha del portero':'Ver estado de portería'}>P</button></div></header><main id="main" tabIndex={-1}>

 {view==='overview'&&<OverviewView {...viewContext}/>} 
 {view==='matches'&&<MatchesView {...viewContext}/>} 
 {view==='players'&&<PlayersView {...viewContext}/>} 
 {view==='goalkeeper'&&<GoalkeeperView {...viewContext}/>} 
 {view==='settings'&&<SettingsView {...viewContext}/>} 
 </main><footer className="page-footer"><span>Hecho para disfrutar del fútbol, dentro y fuera de la cancha.</span><span>{unavailable?'Resultados no disponibles · Cloudflare D1':live?'Resultados publicados · Cloudflare D1':'Prototipo público · Datos ficticios'}</span></footer></div></div><nav className="mobile-nav glass ui-hybrid-glass" aria-label="Navegación móvil">{nav('overview','Inicio',true)}{nav('matches','Partidos',true)}{nav('players','Jugadores',true)}{nav('goalkeeper','Portería',true)}</nav>
 {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><div className="modal glass ui-hybrid-glass" role="dialog" aria-modal="true" aria-label={modal.kind==='new'?'Añadir partido':modal.kind==='edit'?'Editar partido':'Ficha del jugador'}><div className="modal-head"><h2>{modal.kind==='new'?'Añadir partido':modal.kind==='edit'?'Editar partido':'Ficha del jugador'}</h2><button className="icon-btn" onClick={()=>setModal(null)} aria-label="Cerrar"><Icon name="x"/></button></div>{(modal.kind==='new'||modal.kind==='edit')?<AddMatchForm key={modal.kind==='edit'?modal.id:'new'} players={players} goalkeeper={goalkeeper} initial={modal.kind==='edit'?matches.find(m=>m.id===modal.id):undefined} onClose={()=>setModal(null)} onSave={save}/>:athlete?<PlayerProfile athlete={athlete} matches={visibleMatches} sorted={sorted}/>:null}</div></div>}
 <div className={'toast '+(toast?'show':'')} role="status" aria-live="polite">{toast}</div></>;
}
