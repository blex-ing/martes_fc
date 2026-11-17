-- MARTES FC v0.2.0. Solo esquema: nunca introducir datos reales en Git.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE CHECK(length(label) BETWEEN 1 AND 40),
  starts_on TEXT NOT NULL CHECK(length(starts_on)=10),
  ends_on TEXT CHECK(ends_on IS NULL OR length(ends_on)=10),
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_season_one_active ON seasons(active) WHERE active=1;
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  public_name TEXT NOT NULL CHECK(length(public_name) BETWEEN 1 AND 40),
  role TEXT NOT NULL CHECK(role IN ('Portero','Jugador')),
  initials TEXT NOT NULL CHECK(length(initials) BETWEEN 1 AND 4),
  avatar_a TEXT NOT NULL CHECK(length(avatar_a)=7),
  avatar_b TEXT NOT NULL CHECK(length(avatar_b)=7),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES seasons(id),
  played_on TEXT NOT NULL CHECK(length(played_on)=10),
  opponent TEXT NOT NULL CHECK(length(opponent) BETWEEN 1 AND 80),
  goals_for INTEGER NOT NULL CHECK(goals_for BETWEEN 0 AND 99),
  goals_against INTEGER NOT NULL CHECK(goals_against BETWEEN 0 AND 99),
  saves INTEGER NOT NULL CHECK(saves BETWEEN 0 AND 200),
  goalkeeper_id TEXT REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'finished' CHECK(status='finished'),
  published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(goalkeeper_id IS NOT NULL OR saves=0)
);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(published,played_on DESC);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id,played_on DESC);
CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id),
  goals INTEGER NOT NULL DEFAULT 0 CHECK(goals BETWEEN 0 AND 99),
  PRIMARY KEY(match_id,player_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_player ON match_players(player_id);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL CHECK(length(actor) BETWEEN 1 AND 254),
  action TEXT NOT NULL CHECK(length(action) BETWEEN 1 AND 40),
  entity TEXT NOT NULL CHECK(length(entity) BETWEEN 1 AND 40),
  entity_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Semilla puramente estructural; los nombres reales se introducen desde administración.
INSERT OR IGNORE INTO seasons(id,label,starts_on,ends_on,active)
VALUES('season-2026','2026','2026-01-01','2026-12-31',1);
