import type { Match, Player } from '../domain/stats';
export const STORAGE_KEY = 'martesfc-public-demo-v2';
/** Datos inventados: nunca sustituir por personas reales sin acuerdo de publicación. */
export const players: Player[] = [
  {id:'p0',name:'Portero demo',role:'Portero',initials:'PD',a:'#0c8faa',b:'#6540a7'},
  {id:'p1',name:'Jugador 1',role:'Jugador',initials:'J1',a:'#147aa3',b:'#57339c'},
  {id:'p2',name:'Jugador 2',role:'Jugador',initials:'J2',a:'#594fb1',b:'#bb399e'},
  {id:'p3',name:'Jugador 3',role:'Jugador',initials:'J3',a:'#096d96',b:'#416fc1'},
  {id:'p4',name:'Jugador 4',role:'Jugador',initials:'J4',a:'#a55d64',b:'#5136af'},
  {id:'p5',name:'Jugador 5',role:'Jugador',initials:'J5',a:'#53677c',b:'#4d447b'},
  {id:'p6',name:'Jugador 6',role:'Jugador',initials:'J6',a:'#b44795',b:'#6c3ec4'}
];
export const seedMatches: Match[] = [
  {id:'demo-a',date:'2026-11-10',opponent:'Equipo Azul',goalsFor:4,goalsAgainst:3,appearances:['p0','p1','p2','p3','p4','p6'],goals:{p1:2,p2:1,p6:1},goalkeeperId:'p0',saves:6,status:'finished'},
  {id:'demo-b',date:'2026-11-03',opponent:'Equipo Norte',goalsFor:3,goalsAgainst:5,appearances:['p0','p1','p2','p3','p4','p5','p6'],goals:{p1:1,p3:1,p4:1},goalkeeperId:'p0',saves:4,status:'finished'},
  {id:'demo-c',date:'2026-10-27',opponent:'Los Rojos',goalsFor:6,goalsAgainst:2,appearances:['p0','p1','p2','p3','p4','p6'],goals:{p1:2,p2:1,p3:1,p6:2},goalkeeperId:'p0',saves:7,status:'finished'}
];
