"use client";

import type { PlayerPoolStats } from "@/lib/pool-stats";

type Props = {
  player: PlayerPoolStats;
  showTips?: boolean;
  onClose: () => void;
};

export function PlayerStatsModal({ player, showTips = false, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="player-stats-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 id="player-stats-title" className="text-lg font-semibold">
            {player.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Total points</dt>
            <dd className="font-bold text-[var(--accent)] text-lg">
              {player.points}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Group picks</dt>
            <dd className="font-semibold">{player.groupPicksCount}/72</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Group points</dt>
            <dd className="font-semibold">{player.groupPoints}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Knockout points</dt>
            <dd className="font-semibold">{player.knockoutPoints}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Exact scores</dt>
            <dd className="font-semibold">{player.exactHits}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Right winner</dt>
            <dd className="font-semibold">{player.outcomeHits}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Scored matches</dt>
            <dd className="font-semibold">{player.scoredMatches}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Missed (played)</dt>
            <dd className="font-semibold">{player.missedMatches}</dd>
          </div>
        </dl>

        <div className="mt-4 pt-4 border-t border-[var(--border)] text-sm">
          <p className="text-[var(--muted)]">Champion pick</p>
          <p className="font-semibold mt-1">
            {showTips ? (player.championPick ?? "—") : "Hidden until 11 June at 20:00"}
            {showTips && !player.knockoutComplete && (
              <span className="block text-xs text-[var(--muted)] font-normal mt-1">
                Knockout picks incomplete
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
