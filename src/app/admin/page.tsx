"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KnockoutPickForm,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/components/KnockoutPickForm";
import { AdminPlayers } from "@/components/AdminPlayers";
import { AdminPicksLock } from "@/components/AdminPicksLock";
import { AdminExport } from "@/components/AdminExport";
import type { MatchView } from "@/components/MatchCard";
import {
  clearAdminSession,
  getAdminPassword,
  revalidateAdminSession,
  verifyAndLogin,
} from "@/lib/admin-session";
import Link from "next/link";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const [matches, setMatches] = useState<MatchView[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<MatchView[]>([]);
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [tab, setTab] = useState<
    "group" | "knockout" | "knockout-matches" | "players" | "export"
  >("group");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const showMessage = useCallback((msg: string, isError = false) => {
    setMessage(msg);
    setMessageIsError(isError);
  }, []);

  useEffect(() => {
    let cancelled = false;
    revalidateAdminSession().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setPassword(getAdminPassword()!);
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
        setPassword("");
      }
      setCheckingSession(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) =>
        setKnockoutMatches(
          (d.matches ?? []).filter((m: MatchView) => m.id >= 73),
        ),
      );
    fetch("/api/admin/knockout", {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.json())
      .then((d) => {
        const a = d.answer;
        if (a) {
          setKnockout({
            sf1Home: a.sf1Home ?? "",
            sf1Away: a.sf1Away ?? "",
            sf2Home: a.sf2Home ?? "",
            sf2Away: a.sf2Away ?? "",
            finalHome: a.finalHome ?? "",
            finalAway: a.finalAway ?? "",
            bronzeHome: a.bronzeHome ?? "",
            bronzeAway: a.bronzeAway ?? "",
            champion: a.champion ?? "",
          });
        }
      });
  }, [loggedIn]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    const result = await verifyAndLogin(pwInput);
    setLoggingIn(false);
    if (result.ok) {
      setPassword(pwInput);
      setLoggedIn(true);
    } else {
      setLoginError(result.error ?? "Wrong password");
    }
  }

  function handleLogout() {
    clearAdminSession();
    setLoggedIn(false);
    setPassword("");
    setPwInput("");
  }

  const shown = matches.filter((m) =>
    filter === "open" ? !m.finished : true,
  );
  const shownKnockout = knockoutMatches.filter((m) =>
    filter === "open" ? !m.finished : true,
  );

  function applyMatchUpdate(matchId: number, updated: MatchView) {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...updated } : m)),
    );
    setKnockoutMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...updated } : m)),
    );
  }

  async function saveResult(
    matchId: number,
    homeScore: number,
    awayScore: number,
    winnerTeam?: string | null,
  ) {
    showMessage("");
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        matchId,
        homeScore,
        awayScore,
        finished: true,
        ...(winnerTeam ? { winnerTeam } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Save failed", true);
      return;
    }
    applyMatchUpdate(matchId, data.match);
    showMessage(`Result saved for match #${matchId}`);
  }

  async function resetResult(matchId: number) {
    if (
      !confirm(
        `Reset result for match #${matchId}? Scores will be cleared and the match marked as not finished.`,
      )
    ) {
      return;
    }
    showMessage("");
    const res = await fetch(`/api/admin/result?matchId=${matchId}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Reset failed", true);
      return;
    }
    applyMatchUpdate(matchId, data.match);
    showMessage(`Result reset for match #${matchId}`);
  }

  async function saveKnockout() {
    showMessage("");
    const res = await fetch("/api/admin/knockout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(knockout),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Save failed", true);
      return;
    }
    showMessage("Knockout answers saved — scoreboard updated.");
  }

  if (checkingSession) {
    return <p className="text-sm text-[var(--muted)]">Checking admin access…</p>;
  }

  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 max-w-sm">
          <h2 className="font-semibold mb-3">Admin login</h2>
          <p className="text-sm text-[var(--muted)] mb-3">
            Pool player login does not grant access here — enter the admin
            password separately.
          </p>
          <form onSubmit={handleLogin} className="space-y-3">
            <label className="block text-sm text-[var(--muted)]">
              Password
            </label>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loggingIn || !pwInput}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
            >
              {loggingIn ? "Checking…" : "Log in"}
            </button>
            {loginError && (
              <p className="text-sm text-[var(--danger)]">{loginError}</p>
            )}
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Admin</h2>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-[var(--muted)] underline hover:text-white"
          >
            Log out
          </button>
        </div>
      </section>

      {message && (
        <p
          className={`text-sm ${
            messageIsError ? "text-[var(--danger)]" : "text-[var(--success)]"
          }`}
        >
          {message}
        </p>
      )}

      <AdminPicksLock password={password} onMessage={showMessage} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "players"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Players
        </button>
        <button
          type="button"
          onClick={() => setTab("export")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "export"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => setTab("group")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "group"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Group results
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout-matches")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "knockout-matches"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Knockout results
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "knockout"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Knockout answers
        </button>
      </div>

      {tab === "export" && (
        <AdminExport password={password} onMessage={showMessage} />
      )}

      {tab === "players" && (
        <AdminPlayers password={password} onMessage={showMessage} />
      )}

      {tab === "group" && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "open"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Not finished
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              All
            </button>
          </div>

          <div className="space-y-4">
            {shown.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                onSave={saveResult}
                onReset={resetResult}
              />
            ))}
          </div>
        </>
      )}

      {tab === "knockout-matches" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            Enter knockout match results as they finish — the bracket and
            knockout points update automatically.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "open"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Not finished
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              All
            </button>
          </div>
          <div className="space-y-4">
            {shownKnockout.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                knockout
                onSave={saveResult}
                onReset={resetResult}
              />
            ))}
          </div>
        </>
      )}

      {tab === "knockout" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Set the actual semifinalists, finalists, bronze teams, and champion
            when the tournament reaches those stages.
          </p>
          <KnockoutPickForm
            form={knockout}
            locked={false}
            onChange={setKnockout}
          />
          <button
            type="button"
            onClick={saveKnockout}
            className="rounded-lg bg-[var(--success)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
          >
            Save knockout answers
          </button>
        </div>
      )}
    </div>
  );
}

function AdminMatchRow({
  match,
  knockout = false,
  onSave,
  onReset,
}: {
  match: MatchView;
  knockout?: boolean;
  onSave: (id: number, h: number, a: number, winnerTeam?: string | null) => void;
  onReset: (id: number) => void;
}) {
  const [home, setHome] = useState(
    match.homeScore !== null ? String(match.homeScore) : "0",
  );
  const [away, setAway] = useState(
    match.awayScore !== null ? String(match.awayScore) : "0",
  );
  const [winner, setWinner] = useState(match.winnerTeam ?? "");

  useEffect(() => {
    setHome(match.homeScore !== null ? String(match.homeScore) : "0");
    setAway(match.awayScore !== null ? String(match.awayScore) : "0");
    setWinner(match.winnerTeam ?? "");
  }, [match.homeScore, match.awayScore, match.winnerTeam, match.id]);

  const h = Number(home);
  const a = Number(away);
  const isDraw = Number.isInteger(h) && Number.isInteger(a) && h === a;
  const needsWinner = knockout && isDraw;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)] mb-2">
        #{match.id}
        {match.matchNumber ? ` · Match ${match.matchNumber}` : ""}
        {match.groupCode ? ` · Group ${match.groupCode}` : ""} · {match.dayLabel}
      </p>
      <p className="font-semibold mb-3">
        {match.homeTeam} – {match.awayTeam}
      </p>
      <Link
        href={`/live/${match.id}`}
        className="text-xs text-[var(--accent)] hover:underline mb-3 inline-block"
      >
        Test live chat →
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        {needsWinner && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Advanced:</span>
            <select
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm max-w-[12rem]"
              required
            >
              <option value="">Select winner…</option>
              <option value={match.homeTeam}>{match.homeTeam}</option>
              <option value={match.awayTeam}>{match.awayTeam}</option>
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() =>
            onSave(match.id, h, a, needsWinner ? winner || null : null)
          }
          disabled={needsWinner && !winner}
          className="rounded-lg bg-[var(--success)] px-4 py-1.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {match.finished ? "Update" : "Save result"}
        </button>
        {match.finished && (
          <>
            <span className="text-xs text-[var(--muted)]">
              Done
              {match.winnerTeam &&
                match.homeScore === match.awayScore &&
                ` · ${match.winnerTeam} advanced`}
            </span>
            <button
              type="button"
              onClick={() => onReset(match.id)}
              className="rounded-lg border border-[var(--danger)]/50 text-[var(--danger)] px-3 py-1.5 text-sm hover:bg-[var(--danger)]/10"
            >
              Reset result
            </button>
          </>
        )}
      </div>
      {knockout && (
        <p className="text-xs text-[var(--muted)] mt-2">
          Enter the score after 90 minutes. If level, choose who advanced after
          extra time or penalties.
        </p>
      )}
    </div>
  );
}
