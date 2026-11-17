import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate,validateMatch,resultCode,teamMetrics,playerMetrics,leaderboard } from '../src/domain/stats.ts';
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
