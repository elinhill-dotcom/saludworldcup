"use client";

import { useEffect, useState } from "react";
import { PlayerStatsModal } from "@/components/PlayerStatsModal";
import { SupporterWall } from "@/components/SupporterWall";
import type { PlayerPoolStats } from "@/lib/pool-stats";

type Entry = {
  playerId: string;
  name: string;
  points: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  groupPicksCount: number;
};

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [jarTotalEur, setJarTotalEur] = useState(0);
  const [jarContributionEur, setJarContributionEur] = useState(10);
  const [playerCount, setPlayerCount] = useState(0);
  const [picksLocked, setPicksLocked] = useState(false);
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerPoolStats>>(
    new Map(),
  );
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPoolStats | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries);
        setJarTotalEur(data.jarTotalEur);
        setJarContributionEur(data.jarContributionEur);
        setPlayerCount(data.playerCount);
      });

    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        const locked = cfg.locked ?? false;
        setPicksLocked(locked);
        if (!locked) {
          setPlayerStats(new Map());
        }
      });

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.locked && data.players) {
          setPicksLocked(true);
          setPlayerStats(
            new Map(
              (data.players as PlayerPoolStats[]).map((p) => [p.playerId, p]),
            ),
          );
        } else {
          setPlayerStats(new Map());
        }
      });
  }, []);

  const canViewPlayerStats = picksLocked;

  return (
    <div className="scoreboard-page">
      <div className="scoreboard-page__main space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[var(--muted)] text-sm">Office jar</p>
          <p className="text-3xl font-bold text-[var(--accent)]">€{jarTotalEur}</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {playerCount} players × €{jarContributionEur} cash each
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">Scoreboard</h2>
          {entries.length === 0 ? (
            <p className="text-[var(--muted)]">No one has joined yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      Group
                    </th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      Knockout
                    </th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">
                      Exact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr
                      key={e.playerId}
                      className={`border-t border-[var(--border)] ${
                        i === 0 ? "bg-[var(--accent)]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">
                        {canViewPlayerStats && playerStats.has(e.playerId) ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPlayer(playerStats.get(e.playerId)!)
                            }
                            className="text-[var(--accent)] hover:underline"
                          >
                            {e.name}
                          </button>
                        ) : (
                          e.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--accent)] font-bold">
                        {e.points}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.groupPoints}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.knockoutPoints}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-[var(--muted)]">
                        {e.exactHits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[var(--muted)] mt-3">
            Tie-break: most exact group scores. Split the jar as you agree (e.g.
            60% / 30% / 10% for top 3).
            {canViewPlayerStats && playerStats.size > 0 && (
              <span className="block mt-1">
                Tap a name for player stats.
              </span>
            )}
            {!canViewPlayerStats && (
              <span className="block mt-1">
                Player details unlock after all picks are locked on 11 June at
                20:00.
              </span>
            )}
          </p>
        </section>
      </div>

      <SupporterWall />

      {selectedPlayer && canViewPlayerStats && (
        <PlayerStatsModal
          player={selectedPlayer}
          showTips
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
