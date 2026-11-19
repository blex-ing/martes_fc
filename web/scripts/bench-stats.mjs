import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {metricsByPlayer,playerMetrics} from '../src/domain/stats.ts';
import {players,seedMatches} from '../src/data/demo.ts';
const history=Array.from({length:2000},(_,i)=>({...seedMatches[i%seedMatches.length],id:'bench-'+i}));
function bench(fn){const start=performance.now();for(let i=0;i<50;i++)fn();return (performance.now()-start)/50;}
const baseline=()=>new Map(players.map(p=>[p.id,playerMetrics(p,history)]));
const indexed=()=>metricsByPlayer(players,history);
for(const p of players)assert.deepEqual(baseline().get(p.id),indexed().get(p.id));
const oldMs=bench(baseline),newMs=bench(indexed);
console.log(JSON.stringify({matches:history.length,players:players.length,oldMs:+oldMs.toFixed(3),indexedMs:+newMs.toFixed(3),speedup:+(oldMs/newMs).toFixed(2)}));

// En la ficha y en Portería reutilizamos la clasificación ya indexada de App.
// Solo se compara el coste de render posterior: construir el índice es trabajo previo compartido.
const athlete=players[1];
assert.ok(athlete);
const cachedRanking=players.map(p=>({p,...indexed().get(p.id)}));
const baselineProfile=()=>playerMetrics(athlete,history);
const reusedProfile=()=>cachedRanking.find(entry=>entry.p.id===athlete.id);
assert.deepEqual(baselineProfile(),indexed().get(athlete.id));
const baselineProfileUs=bench(baselineProfile)*1000;
const reusedProfileUs=bench(reusedProfile)*1000;
console.log(JSON.stringify({scenario:'profile-reopening',matches:history.length,players:players.length,
 baselineUs:+baselineProfileUs.toFixed(2),reusedUs:+reusedProfileUs.toFixed(2),
 improvement:+(baselineProfileUs/reusedProfileUs).toFixed(2)}));
