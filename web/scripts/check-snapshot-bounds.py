#!/usr/bin/env python3
"""Regression and synthetic query benchmark for the actual D1 snapshot SQL.

No network, production D1 or migrations are modified. Reads SQL from worker/index.ts
to prevent the benchmark from silently testing a different query.
"""
import json
import re
import sqlite3
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from statistics import median
from time import perf_counter

ROOT = Path(__file__).resolve().parents[2]
WORKER = (ROOT / "worker/index.ts").read_text(encoding="utf-8")
SCHEMA = (ROOT / "migrations/0001_initial.sql").read_text(encoding="utf-8")


def actual_sql(prefix: str) -> str:
    match = re.search(r"db\\.prepare\\('(" + re.escape(prefix) + r"[^']+)'\\)", WORKER)
    assert match, f"Snapshot SQL query not found: {prefix}"
    return match.group(1)


MATCHES = actual_sql("SELECT id,season_id,played_on,opponent,goals_for")
APPEARANCES = actual_sql("SELECT mp.match_id,mp.player_id,mp.goals FROM match_players mp")
assert "LIMIT 2000" in MATCHES and "LIMIT 2000" in APPEARANCES
assert "status=?" in MATCHES and "status=?" in APPEARANCES


def run_case(count: int) -> dict:
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.executescript(SCHEMA)
    db.executemany(
        "INSERT INTO players(id,public_name,role,initials,avatar_a,avatar_b) VALUES(?,?,?,?,?,?)",
        [(f"p{j}", f"Jugador {j}", "Portero" if j == 0 else "Jugador", f"J{j}", "#147aa3", "#6540a7") for j in range(7)],
    )
    base = date(2020, 1, 1)
    rows = [
        (f"m{i:06d}", "season-2026", (base + timedelta(days=i // 3)).isoformat(),
         f"Rival {i}", 1, 0, 2, "p0", 1)
        for i in range(count)
    ]
    # Newer, unpublished records must never leak into public results.
    hidden = [
        (f"hidden{i:04d}", "season-2026", "2030-01-01",
         "Privado", 1, 0, 2, "p0", 0)
        for i in range(13)
    ]
    db.executemany(
        "INSERT INTO matches(id,season_id,played_on,opponent,goals_for,goals_against,saves,goalkeeper_id,published) VALUES(?,?,?,?,?,?,?,?,?)",
        rows + hidden,
    )
    db.executemany(
        "INSERT INTO match_players(match_id,player_id,goals) VALUES(?,?,?)",
        [(row[0], f"p{j}", int(j == 1)) for row in rows + hidden for j in range(7)],
    )
    def sample(sql: str):
        times = []
        result = []
        for _ in range(5):
            start = perf_counter()
            result = db.execute(sql, ("finished",)).fetchall()
            times.append((perf_counter() - start) * 1000)
        return result, round(median(times), 3)

    matches, matches_ms = sample(MATCHES)
    appearances, appearances_ms = sample(APPEARANCES)
    ids = [row["id"] for row in matches]
    assert len(ids) == min(count, 2000), (count, len(ids))
    expected = [row[0] for row in sorted(rows, key=lambda row: (row[2], row[0]), reverse=True)[:2000]]
    assert ids == expected, f"Wrong ordering or limit for {count} matches"
    assert len(appearances) == len(ids) * 7
    assert all(row["match_id"] in set(ids) for row in appearances)
    by_match = Counter(row["match_id"] for row in appearances)
    assert all(by_match[match_id] == 7 for match_id in ids)
    assert all(not match_id.startswith("hidden") for match_id in ids)
    # Every match has seven appearances and exactly one assigned goal.
    goals = Counter()
    for row in appearances:
        goals[row["match_id"]] += row["goals"]
    assert all(goals[match_id] == 1 for match_id in ids)
    # This is SQL-row JSON size, not real HTTP response size.
    sql_row_bytes = len(json.dumps([dict(row) for row in matches], ensure_ascii=False).encode("utf-8"))
    db.close()
    return {"publishedRecords": count, "returned": len(ids), "appearances": len(appearances),
            "matchesMs": matches_ms, "appearancesMs": appearances_ms,
            "sqlRowBytes": sql_row_bytes}


if __name__ == "__main__":
    print(json.dumps({"snapshotSqlRegression": [run_case(n) for n in (0, 1, 2000, 2350)]}))
