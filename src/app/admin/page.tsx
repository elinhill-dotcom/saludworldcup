"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KnockoutPickForm,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/components/KnockoutPickForm";
import { AdminPlayers } from "@/components/AdminPlayers";
import type { MatchView } from "@/components/MatchCard";

const ADMIN_KEY = "wc2026_admin_pw";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [tab, setTab] = useState<"group" | "knockout" | "players">("group");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const showMessage = useCallback((msg: string, isError = false) => {
    setMessage(msg);
    setMessageIsError(isError);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_KEY);
    if (saved) setPassword(saved);
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches));
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
  }, []);

  function rememberPw(pw: string) {
    setPassword(pw);
    sessionStorage.setItem(ADMIN_KEY, pw);
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold mb-3">Admin</h2>
        <label className="block text-sm text-[var(--muted)] mb-1">
          Password (ADMIN_PASSWORD in .env)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => rememberPw(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
        />
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
}: {
  match: MatchView;
  onSave: (id: number, h: number, a: number) => void;
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
          <span className="text-xs text-[var(--muted)]">Done</span>
        )}
      </div>
    </div>
  );
}
