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
      .then((r) => r.json())
      .then(setProgress);
  }, [player]);

  const lockLabel = config ? formatCestDateTime(config.lockAt) : "";

  const kp = config?.knockoutPoints;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-3">Part of the community — no login needed</h2>
        <PrizeSplit
          jarEur={config?.jarContributionEur ?? 10}
          showTieBreak
          className="text-sm text-[var(--muted)] mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 px-4 py-3"
        />
        <p className="text-sm text-[var(--muted)] mb-4">
          You don&apos;t have to bet in the pool to join in. If you&apos;d rather
          skip the €{config?.jarContributionEur ?? 10} entry,{" "}
          <strong className="text-white">you don&apos;t need to log in</strong> — just
          pick a name when you comment or chat. You can still:
        </p>
        <ul className="text-sm space-y-2 mb-4">
          <li>
            <Link href="/scoreboard" className="text-[var(--accent)] hover:underline font-medium">
              Scoreboard
            </Link>
            <span className="text-[var(--muted)]"> — standings and the supporter wall</span>
          </li>
          <li>
            <Link href="/results" className="text-[var(--accent)] hover:underline font-medium">
              Results
            </Link>
            <span className="text-[var(--muted)]"> — full match schedule and scores</span>
          </li>
          <li>
            <Link href="/live" className="text-[var(--accent)] hover:underline font-medium">
              Live chat
            </Link>
            <span className="text-[var(--muted)]"> — chat during matches (name only, no password)</span>
          </li>
        </ul>
        <p className="text-xs text-[var(--muted)]">
          Only <strong className="text-white">My picks</strong> requires a name and password
          — for anyone playing in the pool. Forgot your password?{" "}
          <Link href="/admin" className="text-[var(--accent)] hover:underline">
            Contact Elin
          </Link>
          .
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-3">Playing in the pool — login required</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Want to bet and compete for the jar? You must{" "}
          <strong className="text-white">log in with name and password</strong> on{" "}
          <Link href="/picks" className="text-[var(--accent)] hover:underline font-medium">
            My picks
          </Link>{" "}
          (see the form below if you are not logged in yet).
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-sm">
          <li>
            Join with your <strong className="text-white">name</strong> and a{" "}
            <strong className="text-white">password</strong>, then submit picks
            before{" "}
            <strong className="text-white">11 June at 20:00</strong> (CEST).
            Use the same login on any device to continue.
          </li>
          <li>
            <strong className="text-white">Come back later:</strong> open{" "}
            <strong className="text-white">My picks</strong>, enter your name
            and password, and your saved picks load. Use{" "}
            <strong className="text-white">Save all picks</strong> before you
            close the browser.
          </li>
          <li>
            <strong className="text-white">Step 1 — Group stage:</strong> predict
            the score for all 72 group matches.
          </li>
          <li>
            <strong className="text-white">Step 2 — Semis, final & bronze
            (required):</strong> pick semifinalists, finalists, bronze teams, and
            the champion — 9 picks total. Don&apos;t skip this after the group
            stage!
          </li>
          <li>
            <PrizeSplit
              jarEur={config?.jarContributionEur ?? 10}
              showTieBreak
              className="text-[var(--muted)]"
            />
          </li>
          <li>
            Group points:{" "}
            <strong className="text-white">{config?.pointsExact ?? 3}</strong>{" "}
            for exact score,{" "}
            <strong className="text-white">{config?.pointsOutcome ?? 1}</strong>{" "}
            for correct result (win / draw / loss).
          </li>
          {kp && (
            <li>
              Knockout points: {kp.semifinalist} per correct semifinalist,{" "}
              {kp.finalist} per finalist, {kp.champion} for champion,{" "}
              {kp.bronzeTeam} per bronze-match team.
            </li>
          )}
          <li>
            Matches with{" "}
            <strong className="text-white">
              The Netherlands, Sweden, France, or Mexico
            </strong>{" "}
            are highlighted on the picks page.
          </li>
          <li>
            <strong className="text-white">Live chat:</strong>{" "}
            {config?.chatScheduleShort ??
              "opens 15 minutes before kickoff, until 3 hours after kickoff (extra time included)"}
            .
          </li>
          <li>
            <strong className="text-white">Results:</strong> see all match
            scores on the <strong className="text-white">Results</strong> page
            after games are played. On <strong className="text-white">My picks</strong>{" "}
            you&apos;ll see if your winner was right or wrong.
          </li>
        </ul>
        {config?.locked && (
          <div className="mt-4 space-y-2">
            <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2 text-sm">
              Picks are locked — no more bets after 11 June at 20:00.
            </p>
            <p className="text-sm text-[var(--muted)]">
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
          <p className="mt-4 text-sm text-[var(--muted)]">
            All picks lock on <strong className="text-white">11 June at 20:00</strong>{" "}
            ({lockLabel}) — no bets accepted after that.
          </p>
        )}
      </section>

      {player ? (
        <section className="rounded-xl border border-[var(--accent)]/50 bg-[var(--card)] p-6">
          <p className="text-lg">
            Welcome back, <strong>{player.name}</strong>
          </p>
          {progress && (
            <p className="text-sm text-[var(--muted)] mt-2">
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
          <p className="text-xs text-[var(--muted)] mt-2">
            Remembered on this device. On another browser, enter your name and
            password on My picks to load the same account.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
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
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg px-5 py-2 text-[var(--muted)] hover:text-white"
            >
              Use a different name
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-6">
          <h2 className="text-lg font-semibold">Join the pool — log in here</h2>
          <p className="text-sm text-[var(--muted)]">
            To take part in the betting you need to{" "}
            <strong className="text-white">log in below</strong> with your name and
            password. This saves your picks and lets you continue on any device.
            Not betting? You can skip this — use the scoreboard, results, and live
            chat without logging in.
          </p>
          <ContinueAsPlayer
            title="Log in to your picks"
            onContinue={remember}
          />
        </section>
      )}

      <section className="text-sm text-[var(--muted)]">
        <h3 className="font-semibold text-white mb-2">Groups</h3>
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
              <strong>Group {g}:</strong> {teams}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
