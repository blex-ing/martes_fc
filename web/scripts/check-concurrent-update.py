"""Verifica en SQLite la semántica transaccional de la barrera de revisión D1."""
import re
import sqlite3
from pathlib import Path

worker=Path('../worker/index.ts').read_text()
# La barrera se compara como contrato literal para evitar que cambie sin actualizar el test.
assert "WHERE changes()!=1" in worker and "'revision_guard'" in worker
barrier="INSERT INTO audit_events(id,actor,action,entity,entity_id) SELECT ?, '', 'revision_guard', 'match', ? WHERE changes()!=1"
db=sqlite3.connect(':memory:')
db.executescript(Path('../migrations/0001_initial.sql').read_text())
db.execute('INSERT INTO players(id,public_name,role,initials,avatar_a,avatar_b) VALUES(?,?,?,?,?,?)',('p','Portero','Portero','P','#147aa3','#6540a7'))
db.execute('INSERT INTO matches(id,season_id,played_on,opponent,goals_for,goals_against,saves,goalkeeper_id) VALUES(?,?,?,?,?,?,?,?)',('m','season-2026','2026-11-10','Rival',1,0,2,'p'))
db.execute('INSERT INTO match_players(match_id,player_id,goals) VALUES(?,?,?)',('m','p',1))
db.commit()

def attempt(expected):
    try:
        with db:
            db.execute('UPDATE matches SET revision=revision+1 WHERE id=? AND revision=?',('m',expected))
            db.execute(barrier,('guard-'+str(expected),'m'))
            db.execute('DELETE FROM match_players WHERE match_id=?',('m',))
            db.execute('INSERT INTO match_players(match_id,player_id,goals) VALUES(?,?,?)',('m','p',0))
        return True
    except sqlite3.IntegrityError:
        return False

assert attempt(2) is False
assert db.execute('SELECT revision FROM matches WHERE id=?',('m',)).fetchone()[0]==1
assert db.execute('SELECT goals FROM match_players WHERE match_id=?',('m',)).fetchone()[0]==1
assert attempt(1) is True
assert db.execute('SELECT revision FROM matches WHERE id=?',('m',)).fetchone()[0]==2
assert db.execute('SELECT goals FROM match_players WHERE match_id=?',('m',)).fetchone()[0]==0
assert attempt(1) is False
assert db.execute('SELECT revision FROM matches WHERE id=?',('m',)).fetchone()[0]==2
assert db.execute('SELECT goals FROM match_players WHERE match_id=?',('m',)).fetchone()[0]==0
print('[D1] Stale revisions rollback all statements: OK')
