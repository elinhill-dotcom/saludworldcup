"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchPoolInsight, YourPickLine } from "@/components/MatchPoolInsight";
import type { MatchView } from "@/components/MatchCard";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { formatCestMatchKickoff } from "@/lib/datetime";
import { winnerLabel } from "@/lib/pick-feedback";
import type { MatchPoolStats } from "@/lib/pool-stats";
import { playerAuthHeaders } from "@/lib/player-session-storage";

export default function ResultsPage() {
  const { player } = usePlayerSession();
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [poolByMatch, setPoolByMatch] = useState<Map<number, MatchPoolStats>>(
    new Map(),
  );
  const [myPicksByMatch, setMyPicksByMatch] = useState<
    Map<number, { home: number; away: number }>
  >(new Map());
  const [picksLocked, setPicksLocked] = useState(false);
  const [filter, setFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [group, setGroup] = useState<string>("all");

  useEffect(() => {
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setPicksLocked(data.locked ?? false);
        if (data.locked && data.matches) {
          setPoolByMatch(
            new Map(
              (data.matches as MatchPoolStats[]).map((m) => [m.matchId, m]),
            ),
          );
        }
      });
  }, []);

  useEffect(() => {
    if (!player) {
      setMyPicksByMatch(new Map());
      return;
    }

    fetch(`/api/predictions?playerId=${player.id}`, {
      headers: playerAuthHeaders(),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.predictions) {
          setMyPicksByMatch(new Map());
          return;
        }
        const map = new Map<number, { home: number; away: number }>();
        for (const p of data.predictions as {
          matchId: number;
          homeScore: number;
          awayScore: number;
        }[]) {
          map.set(p.matchId, { home: p.homeScore, away: p.awayScore });
        }
        setMyPicksByMatch(map);
      })
      .catch(() => setMyPicksByMatch(new Map()));
  }, [player]);

  const groups = useMemo(() => {
    const codes = new Set(
      matches.map((m) => m.groupCode).filter((g): g is string => !!g),
    );
    return [...codes].sort();
  }, [matches]);

  const shown = useMemo(() => {
    return matches.filter((m) => {
      if (group !== "all" && m.groupCode !== group) return false;
      if (filter === "finished") return m.finished;
      if (filter === "upcoming") return !m.finished;
      return true;
    });
  }, [matches, filter, group]);

  const byDay = useMemo(() => {
    const map: Record<string, MatchView[]> = {};
    for (const m of shown) {
      if (!map[m.dayLabel]) map[m.dayLabel] = [];
      map[m.dayLabel].push(m);
    }
    return Object.entries(map);
  }, [shown]);

  const finishedCount = matches.filter((m) => m.finished).length;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Match results</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          All group-stage results in one place. Results are added after each
          match.
          {player ? (
            <>
              {" "}
              Logged in as <strong className="text-white">{player.name}</strong>
              — your picks are shown under each match.
            </>
          ) : (
            <>
              {" "}
              Log in on <strong className="text-white">My picks</strong> to see
              your bets here.
            </>
          )}
        </p>
        {picksLocked && (
          <p className="text-sm text-[var(--accent)] mt-2">
            Office predictions shown under each match — what Salud collectively
            thinks.
          </p>
        )}
        <p className="text-sm text-[var(--accent)] mt-1">
          {finishedCount} / {matches.length} matches completed
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["finished", "Played"],
            ["upcoming", "Not played yet"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm"
        >
          <option value="all">All groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              Group {g}
            </option>
          ))}
        </select>
      </div>

      {byDay.length === 0 ? (
        <p className="text-[var(--muted)]">No matches match this filter.</p>
      ) : (
        byDay.map(([day, dayMatches]) => (
          <section key={day}>
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">
              {day}
            </h3>
            <div className="space-y-3">
              {dayMatches.map((m) => {
                const pool = poolByMatch.get(m.id);
                const myPick = player
                  ? (myPicksByMatch.get(m.id) ?? null)
                  : undefined;

                return (
                  <article
                    key={m.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {m.homeTeam} – {m.awayTeam}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {formatCestMatchKickoff(m.kickoffAt)}
                          {m.groupCode ? ` · Group ${m.groupCode}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[var(--accent)]">
                          {m.finished &&
                          m.homeScore !== null &&
                          m.awayScore !== null
                            ? `${m.homeScore}–${m.awayScore}`
                            : "—"}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {m.finished &&
                          m.homeScore !== null &&
                          m.awayScore !== null
                            ? winnerLabel(
                                m.homeScore,
                                m.awayScore,
                                m.homeTeam,
                                m.awayTeam,
                              )
                            : "Not played yet"}
                        </p>
                      </div>
                    </div>
                    {(player || (picksLocked && pool)) && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
                        {player &&
                          (myPick ? (
                            <YourPickLine
                              yourPick={myPick}
                              homeTeam={m.homeTeam}
                              awayTeam={m.awayTeam}
                            />
                          ) : (
                            <p className="text-xs text-[var(--muted)]">
                              You didn&apos;t pick this match.
                            </p>
                          ))}
                        {picksLocked && pool && (
                          <MatchPoolInsight stats={pool} variant="card" />
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
