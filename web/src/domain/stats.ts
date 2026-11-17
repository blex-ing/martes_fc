/** Reglas puras de MARTES FC. Ningún acceso a DOM, red o almacenamiento. */
export type PlayerRole = 'Portero' | 'Jugador';
export interface Player { id: string; name: string; role: PlayerRole; initials: string; a: string; b: string }
export interface Match {
  id: string; date: string; opponent: string;
  goalsFor: number; goalsAgainst: number; appearances: string[];
  goals: Record<string, number>; goalkeeperId: string | null;
  saves: number; status: 'finished';
}
export type ResultCode = 'win' | 'loss' | 'draw';
export interface PlayerStats { played: number; goals: number; saves: number; conceded: number; keeperPlayed: number; rate: number; clean: number }
export interface TeamStats { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; diff: number; keeper: PlayerStats }
const emptyStats = (): PlayerStats => ({ played:0, goals:0, saves:0, conceded:0, keeperPlayed:0, rate:0, clean:0 });

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0,10) === value;
}
export function validateMatch(value: unknown, knownIds: readonly string[], goalkeeperId = 'p0'): value is Match {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const m = value as Partial<Match>;
  if (typeof m.id !== 'string' || !m.id || !isValidDate(m.date)) return false;
  if (typeof m.opponent !== 'string' || !m.opponent.trim() || m.opponent.length > 80) return false;
  for (const num of [m.goalsFor,m.goalsAgainst,m.saves]) {
    if (!Number.isSafeInteger(num) || num === undefined || num < 0) return false;
  }
  if ((m.goalsFor ?? 100) > 99 || (m.goalsAgainst ?? 100) > 99 || (m.saves ?? 201) > 200) return false;
  if (!Array.isArray(m.appearances) || m.appearances.length < 1 || new Set(m.appearances).size !== m.appearances.length) return false;
  const allowed = new Set(knownIds);
  if (m.appearances.some(id => typeof id !== 'string' || !allowed.has(id))) return false;
  if (!m.goals || typeof m.goals !== 'object' || Array.isArray(m.goals)) return false;
  let total = 0;
  for (const [id, count] of Object.entries(m.goals)) {
    if (!m.appearances.includes(id) || !Number.isSafeInteger(count) || count < 0 || count > 99) return false;
    total += count;
  }
  if (total !== m.goalsFor) return false;
  if (m.goalkeeperId !== null && m.goalkeeperId !== goalkeeperId) return false;
  if (m.goalkeeperId && !m.appearances.includes(m.goalkeeperId)) return false;
  if (!m.goalkeeperId && m.saves !== 0) return false;
  return m.status === 'finished';
}
export function resultCode(m: Match): ResultCode {
  return m.goalsFor > m.goalsAgainst ? 'win' : m.goalsFor < m.goalsAgainst ? 'loss' : 'draw';
}
export function playerMetrics(p: Player, matches: readonly Match[]): PlayerStats {
  const played = matches.filter(m => m.status === 'finished' && m.appearances.includes(p.id));
  const keep = played.filter(m => m.goalkeeperId === p.id);
  const saves = keep.reduce((n,m) => n + m.saves,0);
  const conceded = keep.reduce((n,m) => n + m.goalsAgainst,0);
  return { played:played.length, goals:played.reduce((n,m) => n + (m.goals[p.id] ?? 0),0),
    saves, conceded, keeperPlayed:keep.length,
    rate: saves + conceded ? Math.round(100 * saves / (saves + conceded)) : 0,
    clean:keep.filter(m => m.goalsAgainst === 0).length };
}
export function teamMetrics(matches: readonly Match[], players: readonly Player[]): TeamStats {
  const finished = matches.filter(m => m.status === 'finished');
  const gf = finished.reduce((n,m) => n+m.goalsFor,0);
  const ga = finished.reduce((n,m) => n+m.goalsAgainst,0);
  const keeper = players.find(p => p.role === 'Portero');
  return {played:finished.length,wins:finished.filter(m => resultCode(m) === 'win').length,
    draws:finished.filter(m => resultCode(m) === 'draw').length,
    losses:finished.filter(m => resultCode(m) === 'loss').length,gf,ga,diff:gf-ga,
    keeper:keeper ? playerMetrics(keeper,finished) : emptyStats()};
}
export function leaderboard(players: readonly Player[],matches: readonly Match[]) {
  return players.map(p=>({p,...playerMetrics(p,matches)}))
    .sort((a,b)=>b.goals-a.goals || b.played-a.played || a.p.name.localeCompare(b.p.name,'es'));
}
