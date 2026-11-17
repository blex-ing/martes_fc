import { validateMatch, type Match, type Player } from '../domain/stats';
import { seedMatches, STORAGE_KEY } from './demo';
export function loadMatches(): Match[] {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return structuredClone(seedMatches);
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length > 2000) return structuredClone(seedMatches);
    const ids: string[] = ['p0','p1','p2','p3','p4','p5','p6'];
    if (!parsed.every(item => validateMatch(item,ids))) return structuredClone(seedMatches);
    const keys = new Set<string>();
    if (parsed.some(m => keys.size === keys.add(m.id).size)) return structuredClone(seedMatches);
    return parsed as Match[];
  } catch { return structuredClone(seedMatches); }
}
export function saveMatches(matches: readonly Match[]): boolean {
  try { window.localStorage.setItem(STORAGE_KEY,JSON.stringify(matches)); return true; }
  catch { return false; }
}
export function exportDemo(players: readonly Player[], matches: readonly Match[]) {
  const payload = {version:1,exportedAt:new Date().toISOString(),notice:'Datos locales ficticios; no verificados',team:'MARTES FC',players,matches};
  const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a = document.createElement('a'); a.href=objectUrl; a.download='martes-fc-demo-datos.json';
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl),1000);
}
