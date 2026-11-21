import {playerMetrics,type Match,type Player} from '../domain/stats';

/**
 * Fixture visual EXCLUSIVA para revisión de #77.
 * No accede a D1, no usa localStorage y no participa en estadísticas públicas.
 * Se activa únicamente mediante ?previewHistory=1 en esta rama.
 * Retirar el fixture y su activación antes del merge de release a master.
 */
export const previewHistoryPlayer:Player={
 id:'preview-history-player',name:'Ander (DEMO)',role:'Jugador',
 initials:'A',a:'#147aa3',b:'#6540a7'
};

const opponents=['TJ','FC Farru','FC Josue','Equipo Norte','Atlético Azul',
 'Unión Deportiva','Barrio FC','Deportivo Estrella'];
const scores=[[0,2],[3,1],[2,2],[1,4],[4,2],[1,1],[2,0],[0,1]] as const;

export const previewHistoryMatches:Match[]=Array.from({length:30},(_,index)=>{
 const [goalsFor,goalsAgainst]=scores[index%scores.length]!;
 const day=new Date(Date.UTC(2026,10,19-index*7)).toISOString().slice(0,10);
 const goals=goalsFor===0?0:index%3===0?0:Math.min(2,goalsFor);
 return {
  id:`preview-history-${index+1}`,date:day,opponent:opponents[index%opponents.length]!,
  goalsFor,goalsAgainst,appearances:[previewHistoryPlayer.id],
  goals:{[previewHistoryPlayer.id]:goals},
  goalkeeperId:null,saves:0,status:'finished'
 };
});
export const previewHistoryMetrics=playerMetrics(previewHistoryPlayer,previewHistoryMatches);
