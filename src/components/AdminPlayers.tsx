"use client";

import { useCallback, useEffect, useState } from "react";

type AdminPlayer = {
  id: string;
  name: string;
  createdAt: string;
  groupPicksCount: number;
  hasKnockoutPick: boolean;
};

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

export function AdminPlayers({ password, onMessage }: Props) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [locked, setLocked] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-password": password,
  };

  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    const res = await fetch("/api/admin/players", { headers });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      onMessage(data.error ?? "Could not load players", true);
      return;
    }
    setPlayers(data.players);
    setLocked(data.locked);
    const names: Record<string, string> = {};
    for (const p of data.players) {
      names[p.id] = p.name;
    }
    setEdits(names);
  }, [password, onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  async function rename(playerId: string) {
    const name = edits[playerId]?.trim();
    if (!name) return;
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ playerId, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Rename failed", true);
      return;
    }
    onMessage(`Renamed to "${data.player.name}".`);
    load();
  }

  async function clearPicks(playerId: string, playerName: string) {
    if (
      !confirm(
        `Clear all picks for ${playerName}? They can fill them in again from My picks.`,
      )
    ) {
      return;
    }
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "clear-picks", playerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Clear failed", true);
      return;
    }
    onMessage(`Cleared picks for ${playerName}.`);
    load();
  }

  async function remove(playerId: string, playerName: string) {
    if (
      !confirm(
        `Delete ${playerName} completely? This removes them from the pool and scoreboard.`,
      )
    ) {
      return;
    }
    onMessage("");
    const res = await fetch(`/api/admin/players?playerId=${playerId}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Delete failed", true);
      return;
    }
    onMessage(`Removed ${playerName}.`);
    load();
  }

  if (!password) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Enter the admin password above to manage players.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Fix duplicate sign-ups, rename typos, or let someone redo their picks
        before the tournament starts.
        {locked && (
          <span className="block mt-2 text-[var(--danger)]">
            Picks are locked — you can still rename or delete players, but not
            clear picks.
          </span>
        )}
      </p>

      {loading && players.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No players yet.</p>
      ) : (
        <ul className="space-y-3">
          {players.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <input
                  type="text"
                  value={edits[p.id] ?? p.name}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="flex-1 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-semibold"
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={() => rename(p.id)}
                  disabled={edits[p.id]?.trim() === p.name}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-40"
                >
                  Save name
                </button>
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">
                Joined {new Date(p.createdAt).toLocaleString("en-GB")} · Group
                picks {p.groupPicksCount}/72
                {p.hasKnockoutPick ? " · Knockout filled" : " · No knockout picks"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => clearPicks(p.id, p.name)}
                  disabled={locked}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Clear picks
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id, p.name)}
                  className="rounded-lg border border-[var(--danger)]/50 text-[var(--danger)] px-3 py-1.5 text-sm hover:bg-[var(--danger)]/10"
                >
                  Delete player
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={load}
        className="text-sm text-[var(--muted)] underline hover:text-white"
      >
        Refresh list
      </button>
    </div>
  );
}
