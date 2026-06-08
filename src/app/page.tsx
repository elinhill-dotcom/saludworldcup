"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCestDateTime } from "@/lib/datetime";
import { ContinueAsPlayer } from "@/components/ContinueAsPlayer";
import { PrizeSplit } from "@/components/PrizeSplit";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { playerAuthHeaders } from "@/lib/player-session-storage";

type Config = {
  locked: boolean;
  lockAt: string;
  chatScheduleShort?: string;
  jarContributionEur: number;
  pointsExact: number;
  pointsOutcome: number;
  knockoutPoints: {
    semifinalist: number;
    finalist: number;
    champion: number;
    bronzeTeam: number;
  };
};

type Progress = {
  groupPicksCount: number;
  groupTotal: number;
  knockoutFilled: number;
  knockoutTotal: number;
};

export default function HomePage() {
  const { player, remember, signOut } = usePlayerSession();
  const [config, setConfig] = useState<Config | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (!player) {
      setProgress(null);
      return;
    }
    fetch(`/api/players/progress?playerId=${player.id}`, {
      headers: playerAuthHeaders(),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) return null;
        return data;
      })
      .then(setProgress);
  }, [player]);

  const lockLabel = config ? formatCestDateTime(config.lockAt) : "";

  const kp = config?.knockoutPoints;

  function handleLogOut() {
    signOut();
    setProgress(null);
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <div className="text-sm text-[var(--muted)] space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-base">
              Part of the community — no login needed
            </h3>
            <p>
              You can take part in the office World Cup{" "}
              <strong className="text-white">without betting in the pool</strong>.
              No €{config?.jarContributionEur ?? 10} entry and no password — just
              choose a display name when you comment or chat.
            </p>
            <p>
              <strong className="text-white">Without logging in you can:</strong>
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <Link href="/scoreboard" className="text-[var(--accent)] hover:underline font-medium">
                  Scoreboard
                </Link>
                <span> — follow standings and post on the supporter wall</span>
              </li>
              <li>
                <Link href="/results" className="text-[var(--accent)] hover:underline font-medium">
                  Results
                </Link>
                <span> — full schedule and match scores as games finish</span>
              </li>
              <li>
                <Link href="/live" className="text-[var(--accent)] hover:underline font-medium">
                  Live chat
                </Link>
                <span> — chat with colleagues during matches (name only)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 border-t border-[var(--border)] pt-6">
            <h3 className="font-semibold text-white text-base">
              Playing in the pool — login required
            </h3>
            <p>
              Want to bet and compete for the jar? Log in with{" "}
              <strong className="text-white">name and password</strong> on{" "}
              <Link href="/picks" className="text-[var(--accent)] hover:underline font-medium">
                My picks
              </Link>{" "}
              (use the form below if you are not logged in yet).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Submit all picks before{" "}
                <strong className="text-white">11 June at 20:00</strong> (CEST).
                Use the same login on any device.{" "}
                <strong className="text-white">Forgot your password?</strong> Contact{" "}
                <strong className="text-white">Elin</strong> — she can reset it for you.
              </li>
              <li>
                <strong className="text-white">Group stage:</strong> predict scores
                for all 72 group matches.{" "}
                <strong className="text-white">Knockout (required):</strong>{" "}
                semifinalists, finalists, bronze teams, and champion — 9 picks.
              </li>
              <li className="list-none -ml-5">
                <PrizeSplit
                  jarEur={config?.jarContributionEur ?? 10}
                  showTieBreak
                  className="text-[var(--muted)]"
                />
              </li>
              <li>
                Points:{" "}
                <strong className="text-white">{config?.pointsExact ?? 3}</strong> per
                exact score,{" "}
                <strong className="text-white">{config?.pointsOutcome ?? 1}</strong> per
                correct result
                {kp &&
                  ` · knockout: ${kp.semifinalist} per semifinalist, ${kp.finalist} per finalist, ${kp.champion} for champion, ${kp.bronzeTeam} per bronze team`}
                .
              </li>
              <li>
                <strong className="text-white">Live chat:</strong>{" "}
                {config?.chatScheduleShort ??
                  "opens 15 minutes before kickoff, until 3 hours after kickoff (extra time included)"}
                .
              </li>
            </ul>
            {config?.locked && (
              <div className="space-y-2">
                <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2">
                  Picks are locked — no more bets after 11 June at 20:00.
                </p>
                <p>
                  See what the office predicted on{" "}
                  <Link
                    href="/stats"
                    className="font-semibold text-[var(--accent)] hover:underline"
                  >
                    How has Salud bet?
                  </Link>
                  .
                </p>
              </div>
            )}
            {!config?.locked && lockLabel && (
              <p>
                All picks lock on{" "}
                <strong className="text-white">11 June at 20:00</strong> ({lockLabel}).
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-semibold text-white text-base mb-3">Groups</h3>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              {[
                ["A", "Mexico, South Korea, South Africa, Czech Republic"],
                ["B", "Canada, Qatar, Switzerland, Bosnia and Herzegovina"],
                ["C", "Brazil, Morocco, Haiti, Scotland"],
                ["D", "USA, Paraguay, Australia, Turkey"],
                ["E", "Germany, Curaçao, Ivory Coast, Ecuador"],
                ["F", "Netherlands, Japan, Tunisia, Sweden"],
                ["G", "Belgium, Iran, New Zealand, Egypt"],
                ["H", "Spain, Saudi Arabia, Uruguay, Cape Verde"],
                ["I", "France, Senegal, Norway, Iraq"],
                ["J", "Argentina, Algeria, Austria, Jordan"],
                ["K", "Portugal, Uzbekistan, Colombia, DR Congo"],
                ["L", "England, Ghana, Croatia, Panama"],
              ].map(([g, teams]) => (
                <p key={g}>
                  <strong className="text-white">Group {g}:</strong> {teams}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6">
        {player ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-lg">
                Welcome back, <strong>{player.name}</strong>
              </p>
              <button
                type="button"
                onClick={handleLogOut}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-white hover:border-[var(--accent)]/50 shrink-0"
              >
                Log out
              </button>
            </div>
            {progress && (
              <p className="text-sm text-[var(--muted)]">
                Saved progress:{" "}
                <strong className="text-white">
                  {progress.groupPicksCount}/{progress.groupTotal}
                </strong>{" "}
                group picks ·{" "}
                <strong className="text-white">
                  {progress.knockoutFilled}/{progress.knockoutTotal}
                </strong>{" "}
                knockout fields
              </p>
            )}
            <p className="text-xs text-[var(--muted)]">
              Wrong account or need to enter your password again?{" "}
              <strong className="text-white">Log out</strong> and sign in below
              with your name and password.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/picks"
                className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
              >
                Go to my picks
              </Link>
              <Link
                href="/scoreboard"
                className="rounded-lg border border-[var(--border)] px-5 py-2"
              >
                Scoreboard
              </Link>
              {config?.locked && (
                <Link
                  href="/stats"
                  className="rounded-lg border border-[var(--accent)]/50 px-5 py-2 text-[var(--accent)]"
                >
                  How has Salud bet?
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-base">Log in to the pool</h3>
            <ContinueAsPlayer
              title="Log in to your picks"
              onContinue={remember}
            />
          </div>
        )}
      </div>
    </section>
  );
}
