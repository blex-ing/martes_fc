import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidDate, validateMatch, resultCode, playerMetrics, teamMetrics, leaderboard} from '../src/domain/stats.mjs';

const players = [{id:'p0',name:'Portero demo',role:'Portero'},{id:'p1',name:'Jugador demo',role:'Jugador'}];
const match = {id:'1', date:'2026-11-10', opponent:'Rival ficticio', goalsFor:2, goalsAgainst:1,
  appearances:['p0','p1'],goals:{p1:2},goalkeeperId:'p0',saves:4,status:'finished'};

test('validateMatch valida partidos completos y la suma de goleadores', () => {
  assert.equal(validateMatch(match, players.map(p => p.id)), true);
  assert.equal(validateMatch({...match, goalsFor:3}, players.map(p => p.id)), false);
  assert.equal(validateMatch({...match, appearances:['p1'], saves:4}, players.map(p => p.id)), false);
  assert.equal(validateMatch({...match, goals:{p3:2}}, players.map(p => p.id)), false);
});
test('fechas reales y formato ISO', () => {
  assert.equal(isValidDate('2026-11-17'),true);
  assert.equal(isValidDate('2026-02-30'),false);
  assert.equal(isValidDate('2026-1-3'),false);
});
test('resultado y acumulados de equipo', () => {
  assert.equal(resultCode(match),'win');
  const total = teamMetrics([match],players);
  assert.deepEqual({played:total.played,wins:total.wins,draws:total.draws,losses:total.losses,gf:total.gf,ga:total.ga},
    {played:1,wins:1,draws:0,losses:0,gf:2,ga:1});
});
test('portero: paradas, encajados, porcentaje y porterías a cero', () => {
  const keeper = playerMetrics(players[0],[match]);
  assert.equal(keeper.saves,4);
  assert.equal(keeper.conceded,1);
  assert.equal(keeper.rate,80);
  assert.equal(keeper.clean,0);
  assert.equal(playerMetrics(players[0],[]).rate,0);
});
test('clasificación de goleadores', () => {
  assert.equal(leaderboard(players,[match])[0].p.id,'p1');
  assert.equal(leaderboard(players,[match])[0].goals,2);
});
