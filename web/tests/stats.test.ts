import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate,validateMatch,resultCode,teamMetrics,seasonMatches,playerMetrics,metricsByPlayer,leaderboard } from '../src/domain/stats.ts';
import {players,seedMatches} from '../src/data/demo.ts';
test('fechas válidas y calendario',()=>{
 assert.equal(isValidDate('2026-02-29'),false);assert.equal(isValidDate('2024-02-29'),true);
 assert.equal(isValidDate('2026-11-17'),true);assert.equal(isValidDate('2026-13-01'),false);
});
test('estadísticas de equipo y portero',()=>{
 const s=teamMetrics(seedMatches,players);
 assert.deepEqual([s.played,s.wins,s.draws,s.losses,s.gf,s.ga,s.diff],[3,2,0,1,13,10,3]);
 assert.equal(s.keeper.saves,17);assert.equal(s.keeper.conceded,10);
 assert.equal(s.keeper.rate,63);
});
test('goleadores y partidos disputados',()=>{
 assert.equal(playerMetrics(players[1]!,seedMatches).goals,5);
 assert.equal(leaderboard(players,seedMatches)[0]?.p.id,'p1');
});
test('validar partido y evitar goles no asignados',()=>{
 const m=structuredClone(seedMatches[0]!);
 assert.equal(validateMatch(m,players.map(x=>x.id)),true);
 m.goalsFor++;assert.equal(validateMatch(m,players.map(x=>x.id)),false);
});
test('resultados',()=>{assert.equal(resultCode(seedMatches[0]!),'win');assert.equal(resultCode(seedMatches[1]!),'loss');});

test('temporada activa aísla resultados sin perder histórico',()=>{
 const original=seedMatches.map((m,i)=>({...m,seasonId:i===0?'season-2026':'season-2027'}));
 assert.equal(seasonMatches(original,'season-2026').length,1);
 assert.equal(seasonMatches(original,'season-2027').length,2);
 assert.equal(seasonMatches(original,null).length,3);
 assert.equal(teamMetrics(seasonMatches(original,'season-2026'),players).played,1);
});
test('estadísticas globales de portería suman varios porteros por partido',()=>{
 const two=structuredClone(seedMatches);
 const other={...players[1]!,role:'Portero' as const,id:'portero-2'};
 const match={...two[0]!,id:'otro',goalkeeperId:other.id,appearances:[other.id],goals:{[other.id]:two[0]!.goalsFor}};
 const data=teamMetrics([...two,match],[...players,other]);
 assert.equal(data.keeper.saves,teamMetrics(two,players).keeper.saves+match.saves);
 assert.equal(data.keeper.keeperPlayed,teamMetrics(two,players).keeper.keeperPlayed+1);
});

test('índice de métricas equivale al cálculo original para todos los jugadores',()=>{
 const indexed=metricsByPlayer(players,seedMatches);
 for(const player of players)assert.deepEqual(indexed.get(player.id),playerMetrics(player,seedMatches));
 assert.equal(leaderboard(players,seedMatches)[0]?.goals,indexed.get(leaderboard(players,seedMatches)[0]!.p.id)?.goals);
});
test('histórico voluminoso mantiene estadísticas sin filtrar cada jugador',()=>{
 const bulk=Array.from({length:2000},(_,i)=>({...seedMatches[i%seedMatches.length]!,id:'test-'+i}));
 const indexed=metricsByPlayer(players,bulk);
 for(const player of players)assert.deepEqual(indexed.get(player.id),playerMetrics(player,bulk));
});
