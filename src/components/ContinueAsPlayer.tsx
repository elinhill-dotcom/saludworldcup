"use client";

import { useState } from "react";
import { joinOrResumeByName } from "@/lib/join-player";
import type { StoredPlayer } from "@/lib/player-storage";

type Props = {
  onContinue: (player: StoredPlayer) => void;
  title?: string;
};

export function ContinueAsPlayer({
  onContinue,
  title = "Continue your picks",
}: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await joinOrResumeByName(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onContinue(result.player);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-[var(--muted)]">
        There is <strong className="text-white">no password</strong>. Your picks
        are stored on the server under your name. When you come back, enter the{" "}
        <strong className="text-white">same name</strong> and everything you
        already saved will load — including half-finished entries.
      </p>
      <ul className="text-xs text-[var(--muted)] list-disc pl-4 space-y-1">
        <li>
          <strong className="text-white">Same browser:</strong> we usually
          remember you automatically (saved on this device).
        </li>
        <li>
          <strong className="text-white">New browser or phone:</strong> type
          your name below and tap Continue.
        </li>
        <li>
          Click <strong className="text-white">Save all picks</strong> on the
          picks page when you stop — then you can safely close the tab.
        </li>
      </ul>
      <form onSubmit={submit} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Continue"}
        </button>
      </form>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
