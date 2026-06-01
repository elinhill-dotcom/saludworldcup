"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KnockoutPickForm,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/components/KnockoutPickForm";
import { AdminPlayers } from "@/components/AdminPlayers";
import { AdminExport } from "@/components/AdminExport";
import type { MatchView } from "@/components/MatchCard";
import {
  clearAdminSession,
  getAdminPassword,
  isAdminLoggedIn,
  verifyAndLogin,
} from "@/lib/admin-session";
import Link from "next/link";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const [matches, setMatches] = useState<MatchView[]>([]);
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [tab, setTab] = useState<"group" | "knockout" | "players" | "export">("group");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const showMessage = useCallback((msg: string, isError = false) => {
    setMessage(msg);
    setMessageIsError(isError);
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setPassword(getAdminPassword()!);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
    fetch("/api/admin/knockout")
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

  async function saveResult(
    matchId: number,
    homeScore: number,
    awayScore: number,
  ) {
    showMessage("");
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ matchId, homeScore, awayScore, finished: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Save failed", true);
      return;
    }
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...data.match } : m)),
    );
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
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...data.match } : m)),
    );
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

  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 max-w-sm">
          <h2 className="font-semibold mb-3">Contact Elin</h2>
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
          <h2 className="font-semibold">Elin</h2>
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
  onSave,
  onReset,
}: {
  match: MatchView;
  onSave: (id: number, h: number, a: number) => void;
  onReset: (id: number) => void;
}) {
  const [home, setHome] = useState(
    match.homeScore !== null ? String(match.homeScore) : "0",
  );
  const [away, setAway] = useState(
    match.awayScore !== null ? String(match.awayScore) : "0",
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)] mb-2">
        #{match.id}
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
        <button
          type="button"
          onClick={() => onSave(match.id, Number(home), Number(away))}
          className="rounded-lg bg-[var(--success)] px-4 py-1.5 text-sm font-medium text-[var(--accent-foreground)]"
        >
          {match.finished ? "Update" : "Save result"}
        </button>
        {match.finished && (
          <>
            <span className="text-xs text-[var(--muted)]">Done</span>
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
    </div>
  );
}
