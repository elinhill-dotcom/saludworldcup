"use client";

import type { MatchPoolStats } from "@/lib/pool-stats";

type Props = {
  stats: MatchPoolStats;
  variant?: "compact" | "card" | "chat";
};

function OutcomeBar({
  homePct,
  drawPct,
  awayPct,
  homeTeam,
  awayTeam,
}: {
  homePct: number;
  drawPct: number;
  awayPct: number;
  homeTeam: string;
  awayTeam: string;
}) {
  if (homePct + drawPct + awayPct === 0) {
    return <p className="text-xs text-[var(--muted)]">No office picks yet</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex h-2 overflow-hidden rounded-full bg-black/30">
        {homePct > 0 && (
          <div
            className="bg-[var(--accent)]"
            style={{ width: `${homePct}%` }}
          />
        )}
        {drawPct > 0 && (
          <div className="bg-[var(--muted)]" style={{ width: `${drawPct}%` }} />
        )}
        {awayPct > 0 && (
          <div className="bg-white/40" style={{ width: `${awayPct}%` }} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
        <span>
          {homeTeam} {homePct}%
        </span>
        <span>Draw {drawPct}%</span>
        <span>
          {awayTeam} {awayPct}%
        </span>
      </div>
    </div>
  );
}

export function MatchPoolInsight({ stats, variant = "card" }: Props) {
  if (stats.pickCount === 0) {
    return (
      <p className="text-xs text-[var(--muted)]">No office picks for this match.</p>
    );
  }

  const topPick = stats.topScores[0];
  const avgLabel = `${stats.avgHomeGoals}–${stats.avgAwayGoals}`;

  if (variant === "compact") {
    return (
      <div className="text-xs text-[var(--muted)] space-y-1">
        <p className="font-medium text-[var(--accent)]">
          How has Salud bet? ({stats.pickCount} picks)
        </p>
        <p>
          {stats.homeTeam} {stats.homeWinPct}% · Draw {stats.drawPct}% ·{" "}
          {stats.awayTeam} {stats.awayWinPct}%
          {topPick && (
            <>
              {" "}
              · Most picked:{" "}
              <strong className="text-white">{topPick.score}</strong> (
              {topPick.pct}%)
            </>
          )}
        </p>
      </div>
    );
  }

  if (variant === "chat") {
    return (
      <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-sm space-y-2">
        <p className="font-semibold text-[var(--accent)]">
          How has Salud bet?
        </p>
        <p className="text-xs text-[var(--muted)]">
          Based on {stats.pickCount} office picks · avg score{" "}
          <strong className="text-white">{avgLabel}</strong>
        </p>
        <OutcomeBar
          homePct={stats.homeWinPct}
          drawPct={stats.drawPct}
          awayPct={stats.awayWinPct}
          homeTeam={stats.homeTeam}
          awayTeam={stats.awayTeam}
        />
        {topPick && (
          <p className="text-xs text-[var(--muted)]">
            Most picked result:{" "}
            <strong className="text-white">{topPick.score}</strong> ({topPick.pct}
            %)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--accent)]">
        How has Salud bet? · {stats.pickCount} picks
      </p>
      <OutcomeBar
        homePct={stats.homeWinPct}
        drawPct={stats.drawPct}
        awayPct={stats.awayWinPct}
        homeTeam={stats.homeTeam}
        awayTeam={stats.awayTeam}
      />
      <p className="text-xs text-[var(--muted)]">
        Avg predicted score:{" "}
        <strong className="text-white">{avgLabel}</strong>
      </p>
      {stats.topScores.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.topScores.map((s) => (
            <span
              key={s.score}
              className="rounded bg-black/30 px-2 py-0.5 text-xs"
            >
              {s.score} ({s.pct}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
