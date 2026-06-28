"use client";

import {
  formatBracketTeamLine,
  matchDisplayNumber,
  type ResolvedMatch,
} from "@/lib/knockout-bracket";
import { formatCestMatchKickoff } from "@/lib/datetime";

const STAGE_LABELS: Record<string, string> = {
  r16: "Round of 32",
  r8: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  bronze: "Bronze",
  final: "Final",
};

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function cestDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function cestDayHeading(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function cestTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

type Props = {
  matches: ResolvedMatch[];
};

export function KnockoutSchedule({ matches }: Props) {
  const map = new Map(matches.map((m) => [m.id, m]));
  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );

  const byDay = new Map<string, { heading: string; items: ResolvedMatch[] }>();
  for (const m of sorted) {
    const key = cestDateKey(m.kickoffAt);
    const group = byDay.get(key) ?? { heading: cestDayHeading(m.kickoffAt), items: [] };
    group.items.push(m);
    byDay.set(key, group);
  }

  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (!days.length) {
    return <p className="text-sm text-[var(--muted)]">No knockout matches scheduled.</p>;
  }

  return (
    <div className="space-y-8">
      {days.map(([key, { heading, items }]) => (
        <section key={key}>
          <h2 className="text-base font-semibold text-[var(--accent)] mb-3 sticky top-0 bg-[var(--background)] py-1 z-10">
            {heading}
          </h2>
          <div className="space-y-2">
            {items.map((m) => {
              const home = formatBracketTeamLine(m.homeTeam, map, m.winner);
              const away = formatBracketTeamLine(m.awayTeam, map, m.winner);
              const score =
                m.finished && m.homeScore !== null && m.awayScore !== null
                  ? `${m.homeScore}–${m.awayScore}`
                  : null;

              return (
                <article
                  key={m.id}
                  className={`rounded-lg border bg-[var(--card)] p-3 text-sm ${
                    m.stage === "final"
                      ? "border-[var(--accent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                    <p className="font-semibold tabular-nums shrink-0 w-14">
                      {cestTime(m.kickoffAt)}
                    </p>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1">
                        Match {matchDisplayNumber(m)} · {stageLabel(m.stage)}
                      </p>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span
                          className={`font-medium ${
                            home.isWinner ? "text-[var(--success)]" : ""
                          }`}
                        >
                          {home.label}
                        </span>
                        <span className="text-[var(--muted)]">vs</span>
                        <span
                          className={`font-medium ${
                            away.isWinner ? "text-[var(--success)]" : ""
                          }`}
                        >
                          {away.label}
                        </span>
                        {score && (
                          <span className="text-[var(--muted)] tabular-nums ml-1">
                            ({score})
                          </span>
                        )}
                      </div>
                      {(home.hint || away.hint) && (
                        <p className="text-[10px] text-[var(--muted)] mt-1">
                          {[home.hint, away.hint].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--muted)] shrink-0 hidden sm:block">
                      {formatCestMatchKickoff(m.kickoffAt)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
