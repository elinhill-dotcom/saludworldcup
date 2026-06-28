"use client";

import type { KnockoutPlayerPick } from "@/lib/knockout-page-data";

type Props = {
  picks: KnockoutPlayerPick[];
  highlightPlayerId?: string | null;
};

function teamList(teams: string[]): string {
  return teams.length ? teams.join(", ") : "—";
}

export function KnockoutPlayerPicksTable({ picks, highlightPlayerId }: Props) {
  const complete = picks.filter((p) => p.complete);
  const incomplete = picks.filter((p) => !p.complete);

  if (!picks.length) {
    return <p className="text-sm text-[var(--muted)]">No players yet.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--muted)]">
        {complete.length} of {picks.length} players have submitted a complete
        knockout pick (semis, final, bronze, champion). Pairings do not matter
        for scoring.
      </p>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2 pr-3 sticky left-0 bg-[var(--background)]">Player</th>
              <th className="py-2 pr-3">Semifinalists</th>
              <th className="py-2 pr-3">Finalists</th>
              <th className="py-2 pr-3">Bronze</th>
              <th className="py-2">Champion</th>
            </tr>
          </thead>
          <tbody>
            {complete.map((p) => (
              <tr
                key={p.playerId}
                className={`border-b border-[var(--border)]/50 align-top ${
                  highlightPlayerId === p.playerId ? "bg-[var(--accent)]/10" : ""
                }`}
              >
                <td className="py-2.5 pr-3 font-medium sticky left-0 bg-[var(--background)]">
                  {p.name}
                </td>
                <td className="py-2.5 pr-3 text-[var(--muted)]">
                  {teamList(p.semifinalists)}
                </td>
                <td className="py-2.5 pr-3 text-[var(--muted)]">
                  {teamList(p.finalists)}
                </td>
                <td className="py-2.5 pr-3 text-[var(--muted)]">
                  {teamList(p.bronzeTeams)}
                </td>
                <td className="py-2.5 font-semibold text-[var(--accent)]">
                  {p.champion ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incomplete.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--muted)] hover:text-white">
            {incomplete.length} incomplete pick{incomplete.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1 text-[var(--muted)] pl-4">
            {incomplete.map((p) => (
              <li key={p.playerId}>{p.name}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
