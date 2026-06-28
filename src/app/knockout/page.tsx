"use client";

import { useEffect, useState } from "react";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { KnockoutPlayerPicksTable } from "@/components/KnockoutPlayerPicksTable";
import { KnockoutSchedule } from "@/components/KnockoutSchedule";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import type {
  KnockoutBetStat,
  KnockoutPlayerPick,
  KnockoutPlayerPoints,
} from "@/lib/knockout-page-data";
import type { ResolvedMatch } from "@/lib/knockout-bracket";

type Tab = "bracket" | "schedule" | "players" | "betting" | "points";

type Payload = {
  matches: ResolvedMatch[];
  eliminated: string[];
  betting: KnockoutBetStat[];
  players: KnockoutPlayerPoints[];
  playerPicks: KnockoutPlayerPick[];
  knockoutPoints: {
    semifinalist: number;
    finalist: number;
    champion: number;
    bronzeTeam: number;
  };
  pickCount: number;
};

export default function KnockoutPage() {
  const { player } = usePlayerSession();
  const [tab, setTab] = useState<Tab>("bracket");
  const [compact, setCompact] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/knockout", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData(d);
          setError("");
        }
      })
      .catch(() => setError("Could not load knockout data."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const myRow = player
    ? data?.players.find((p) => p.playerId === player.id)
    : null;

  return (
    <div
      className={`mx-auto px-4 py-6 space-y-6 ${
        tab === "bracket" && !compact ? "max-w-[1600px]" : "max-w-5xl"
      }`}
    >
      <header>
        <h1 className="text-2xl font-bold">Knockout</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Follow the bracket, see how Salud bet on the knockout stage, and track
          knockout points as teams are eliminated.
        </p>
      </header>

      {myRow && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm">
          <strong className="text-white">{myRow.name}</strong> — knockout earned{" "}
          <strong className="text-[var(--accent)]">{myRow.earned}</strong>, still
          possible <strong>{myRow.remaining}</strong> of {myRow.maxPossible} max
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["bracket", "Bracket"],
            ["schedule", "Schedule"],
            ["players", "Players knockout"],
            ["betting", "How Salud bet"],
            ["points", "Knockout points"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
        {tab === "bracket" && (
          <>
            <button
              type="button"
              onClick={() => setCompact(false)}
              className={`rounded-lg px-3 py-2 text-sm ${
                !compact
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)] text-[var(--muted)]"
              }`}
            >
              Bracket tree
            </button>
            <button
              type="button"
              onClick={() => setCompact(true)}
              className={`rounded-lg px-3 py-2 text-sm ${
                compact
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)] text-[var(--muted)]"
              }`}
            >
              List by round
            </button>
          </>
        )}
        <button
          type="button"
          onClick={load}
          className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] underline ml-auto"
        >
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : !data ? null : (
        <>
          {tab === "bracket" && (
            <KnockoutBracket matches={data.matches} compact={compact} />
          )}

          {tab === "schedule" && <KnockoutSchedule matches={data.matches} />}

          {tab === "players" && (
            <KnockoutPlayerPicksTable
              picks={data.playerPicks}
              highlightPlayerId={player?.id}
            />
          )}

          {tab === "betting" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                Based on {data.pickCount} complete knockout pick sets (semis,
                final, bronze, champion).
              </p>
              {data.betting.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No complete knockout picks yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                        <th className="py-2 pr-4">Team</th>
                        <th className="py-2 pr-4">Semis</th>
                        <th className="py-2 pr-4">Final</th>
                        <th className="py-2 pr-4">Champion</th>
                        <th className="py-2">Bronze</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.betting.slice(0, 40).map((row) => (
                        <tr
                          key={row.team}
                          className="border-b border-[var(--border)]/50"
                        >
                          <td className="py-2 pr-4 font-medium">{row.team}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.semifinalPct}%</td>
                          <td className="py-2 pr-4 tabular-nums">{row.finalPct}%</td>
                          <td className="py-2 pr-4 tabular-nums">{row.championPct}%</td>
                          <td className="py-2 tabular-nums">{row.bronzePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "points" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">
                Earned points count on the scoreboard as results are known.
                Semi/final/bronze points are per team — you do not need the
                correct pairings. Remaining drops when a team you picked is
                knocked out ({data.eliminated.length} eliminated so far).
              </p>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--muted)] space-y-1">
                <p>
                  Max per pick: semifinalist {data.knockoutPoints.semifinalist}p ·
                  finalist {data.knockoutPoints.finalist}p · champion{" "}
                  {data.knockoutPoints.champion}p · bronze team{" "}
                  {data.knockoutPoints.bronzeTeam}p
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="py-2 pr-4">Player</th>
                      <th className="py-2 pr-4">Earned</th>
                      <th className="py-2 pr-4">Still possible</th>
                      <th className="py-2 pr-4">Max</th>
                      <th className="py-2">Champion pick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.players.map((p) => (
                      <tr
                        key={p.playerId}
                        className={`border-b border-[var(--border)]/50 ${
                          player?.id === p.playerId ? "bg-[var(--accent)]/10" : ""
                        }`}
                      >
                        <td className="py-2 pr-4 font-medium">{p.name}</td>
                        <td className="py-2 pr-4 tabular-nums font-semibold text-[var(--accent)]">
                          {p.earned}
                        </td>
                        <td className="py-2 pr-4 tabular-nums">{p.remaining}</td>
                        <td className="py-2 pr-4 tabular-nums text-[var(--muted)]">
                          {p.maxPossible}
                        </td>
                        <td className="py-2 text-[var(--muted)]">
                          {p.knockoutComplete ? (p.championPick ?? "—") : "Incomplete"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
