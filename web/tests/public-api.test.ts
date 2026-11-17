import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMatch } from '../src/domain/stats.ts';
test('v0.2 valida partido compartido y evita goles sin participante',()=>{
 const m={id:'match-1',date:'2026-11-10',opponent:'Rival',goalsFor:2,goalsAgainst:1,saves:4,
   goalkeeperId:'keeper',appearances:['keeper','forward'],goals:{forward:2},status:'finished'};
 assert.equal(validateMatch(m,['keeper','forward'],'keeper'),true);
 assert.equal(validateMatch({...m,goals:{forward:3}},['keeper','forward'],'keeper'),false);
 assert.equal(validateMatch({...m,appearances:['forward']},['keeper','forward'],'keeper'),false);
});
