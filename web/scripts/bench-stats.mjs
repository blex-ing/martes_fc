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
