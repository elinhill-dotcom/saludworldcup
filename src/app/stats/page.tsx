"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchPoolInsight } from "@/components/MatchPoolInsight";
import { PlayerStatsModal } from "@/components/PlayerStatsModal";
import type {
  KnockoutPoolStats,
  MatchPoolStats,
  PlayerPoolStats,
  TeamPoolStats,
} from "@/lib/pool-stats";

export default function StatsPage() {
  const [locked, setLocked] = useState<boolean | null>(null);
  const [lockAt, setLockAt] = useState("");
  const [teams, setTeams] = useState<TeamPoolStats[]>([]);
  const [matches, setMatches] = useState<MatchPoolStats[]>([]);
  const [knockout, setKnockout] = useState<KnockoutPoolStats | null>(null);
  const [players, setPlayers] = useState<PlayerPoolStats[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPoolStats | null>(
    null,
  );
  const [matchFilter, setMatchFilter] = useState("");
  const [tab, setTab] = useState<"teams" | "matches" | "knockout" | "players">(
    "teams",
  );

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setLocked(data.locked ?? false);
        if (data.lockAt) setLockAt(data.lockAt);
        if (data.locked) {
          setTeams(data.teams ?? []);
          setMatches(data.matches ?? []);
          setKnockout(data.knockout ?? null);
          setPlayers(data.players ?? []);
          setPlayerCount(data.playerCount ?? 0);
        }
      });
  }, []);

  const topTeams = useMemo(() => teams.slice(0, 8), [teams]);
  const bottomTeams = useMemo(() => [...teams].reverse().slice(0, 8), [teams]);

  const filteredMatches = useMemo(() => {
    const q = matchFilter.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        (m.groupCode?.toLowerCase().includes(q) ?? false),
    );
  }, [matches, matchFilter]);

  if (locked === null) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (!locked) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How has Salud bet?</h2>
        <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
          Office-wide betting statistics appear here once all picks are locked on{" "}
          <strong className="text-white">11 June at 20:00</strong>
          {lockAt && (
            <>
              {" "}
              ({new Date(lockAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })})
            </>
          )}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">How has Salud bet?</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          What the office collectively predicts — based on {playerCount} players&apos; picks.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["teams", "Teams"],
            ["matches", "Matches"],
            ["knockout", "Knockout"],
            ["players", "Players"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "teams" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="font-semibold text-[var(--success)] mb-3">
              Predicted to do best
            </h3>
            <p className="text-xs text-[var(--muted)] mb-3">
              Average predicted group-stage points (max 9 per team)
            </p>
            <ol className="space-y-2 text-sm">
              {topTeams.map((t, i) => (
                <li key={t.team} className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {t.team}{" "}
                    <span className="text-[var(--muted)]">Grp {t.groupCode}</span>
                  </span>
                  <span className="font-semibold shrink-0">
                    {t.avgPredictedPoints} pts
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="font-semibold text-[var(--danger)] mb-3">
              Predicted to struggle
            </h3>
            <ol className="space-y-2 text-sm">
              {bottomTeams.map((t, i) => (
                <li key={t.team} className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {t.team}{" "}
                    <span className="text-[var(--muted)]">Grp {t.groupCode}</span>
                  </span>
                  <span className="font-semibold shrink-0">
                    {t.avgPredictedPoints} pts
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:col-span-2">
            <h3 className="font-semibold mb-3">All teams — predicted outcomes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[var(--muted)]">
                  <tr>
                    <th className="py-2 pr-3">Team</th>
                    <th className="py-2 pr-3">Grp</th>
                    <th className="py-2 pr-3 text-right">Avg pts</th>
                    <th className="py-2 pr-3 text-right">Win%</th>
                    <th className="py-2 pr-3 text-right">Draw%</th>
                    <th className="py-2 text-right">Loss%</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.team} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 font-medium">{t.team}</td>
                      <td className="py-2 pr-3 text-[var(--muted)]">{t.groupCode}</td>
                      <td className="py-2 pr-3 text-right">{t.avgPredictedPoints}</td>
                      <td className="py-2 pr-3 text-right">{t.winPct}%</td>
                      <td className="py-2 pr-3 text-right">{t.drawPct}%</td>
                      <td className="py-2 text-right">{t.lossPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "matches" && (
        <div className="space-y-4">
          <input
            type="search"
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            placeholder="Filter by team or group…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm"
          />
          {filteredMatches.map((m) => (
            <article
              key={m.matchId}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="text-xs text-[var(--muted)] mb-1">
                #{m.matchId}
                {m.groupCode ? ` · Group ${m.groupCode}` : ""} · {m.dayLabel} ·{" "}
                {m.pickCount} picks
              </p>
              <p className="font-semibold mb-3">
                {m.homeTeam} – {m.awayTeam}
              </p>
              <MatchPoolInsight stats={m} />
            </article>
          ))}
        </div>
      )}

      {tab === "knockout" && knockout && (
        <div className="grid gap-4 sm:grid-cols-2">
          <KnockoutStatBlock
            title="World Cup winner"
            items={knockout.champion}
            pickCount={knockout.pickCount}
          />
          <KnockoutStatBlock
            title="Finalists"
            items={knockout.finalists}
            pickCount={knockout.pickCount}
          />
          <KnockoutStatBlock
            title="Semifinalists"
            items={knockout.semifinalists}
            pickCount={knockout.pickCount}
            className="sm:col-span-2"
          />
        </div>
      )}

      {tab === "players" && (
        <section>
          <p className="text-sm text-[var(--muted)] mb-3">
            Tap a name for detailed stats.
          </p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">
                    Picks
                  </th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">
                    Exact
                  </th>
                  <th className="px-4 py-3 hidden md:table-cell">Champion</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p.playerId}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(p)}
                        className="font-semibold text-[var(--accent)] hover:underline text-left"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {p.points}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {p.groupPicksCount}/72
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {p.exactHits}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--muted)]">
                      {p.championPick ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          showTips
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

function KnockoutStatBlock({
  title,
  items,
  pickCount,
  className = "",
}: {
  title: string;
  items: { team: string; count: number; pct: number }[];
  pickCount: number;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${className}`}
    >
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[var(--muted)] mb-3">
        Based on {pickCount} complete knockout entries
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No picks yet</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {items.slice(0, 10).map((item) => (
            <li key={item.team} className="flex items-center gap-2">
              <div
                className="h-2 rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.max(item.pct, 4)}%`, maxWidth: "8rem" }}
              />
              <span className="font-medium">{item.team}</span>
              <span className="text-[var(--muted)] ml-auto">{item.pct}%</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
