/** Dominio puro: sin acceso al DOM, red ni almacenamiento. */
export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateMatch(m, knownIds, goalkeeperId = 'p0') {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return false;
  if (typeof m.id !== 'string' || !m.id || !isValidDate(m.date)) return false;
  if (typeof m.opponent !== 'string' || !m.opponent.trim() || m.opponent.length > 80) return false;
  for (const [key, maximum] of [['goalsFor', 99], ['goalsAgainst', 99], ['saves', 200]]) {
    if (!Number.isSafeInteger(m[key]) || m[key] < 0 || m[key] > maximum) return false;
  }
  if (!Array.isArray(m.appearances) || m.appearances.length < 1 || new Set(m.appearances).size !== m.appearances.length) return false;
  const validIds = new Set(knownIds);
  if (m.appearances.some(id => !validIds.has(id))) return false;
  if (!m.goals || typeof m.goals !== 'object' || Array.isArray(m.goals)) return false;
  if (Object.entries(m.goals).some(([id, count]) => !m.appearances.includes(id) || !Number.isSafeInteger(count) || count < 0 || count > 99)) return false;
  if (Object.values(m.goals).reduce((total, count) => total + count, 0) !== m.goalsFor) return false;
  if (m.goalkeeperId !== null && m.goalkeeperId !== goalkeeperId) return false;
  if (m.goalkeeperId && !m.appearances.includes(m.goalkeeperId)) return false;
  if (!m.goalkeeperId && m.saves !== 0) return false;
  return m.status === 'finished';
}

export function resultCode(match) {
  return match.goalsFor > match.goalsAgainst ? 'win' : match.goalsFor < match.goalsAgainst ? 'loss' : 'draw';
}

export function playerMetrics(player, matches) {
  const played = matches.filter(m => m.status === 'finished' && m.appearances.includes(player.id));
  const goals = played.reduce((sum, m) => sum + (m.goals[player.id] || 0), 0);
  const keep = played.filter(m => m.goalkeeperId === player.id);
  const saves = keep.reduce((sum, m) => sum + m.saves, 0);
  const conceded = keep.reduce((sum, m) => sum + m.goalsAgainst, 0);
  const totalShotsOnTarget = saves + conceded;
  return {played: played.length, goals, saves, conceded, keeperPlayed: keep.length,
    rate: totalShotsOnTarget ? Math.round(saves * 100 / totalShotsOnTarget) : 0,
    clean: keep.filter(m => m.goalsAgainst === 0).length};
}

export function teamMetrics(matches, players) {
  const finished = matches.filter(m => m.status === 'finished');
  const wins = finished.filter(m => resultCode(m) === 'win').length;
  const draws = finished.filter(m => resultCode(m) === 'draw').length;
  const losses = finished.filter(m => resultCode(m) === 'loss').length;
  const gf = finished.reduce((sum, m) => sum + m.goalsFor, 0);
  const ga = finished.reduce((sum, m) => sum + m.goalsAgainst, 0);
  const keeper = players.find(p => p.role === 'Portero');
  return {played: finished.length, wins, draws, losses, gf, ga, diff: gf - ga,
    keeper: keeper ? playerMetrics(keeper, finished) : {played:0,goals:0,saves:0,conceded:0,keeperPlayed:0,rate:0,clean:0}};
}

export function leaderboard(players, matches) {
  return players.map(p => ({p, ...playerMetrics(p, matches)}))
    .sort((a, b) => b.goals - a.goals || b.played - a.played || a.p.name.localeCompare(b.p.name, 'es'));
}
