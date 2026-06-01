"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { joinOrResumeByName, lookupPlayerName } from "@/lib/join-player";
import { MIN_PASSWORD_LENGTH } from "@/lib/player-password";
import type { StoredPlayer } from "@/lib/player-storage";

type Props = {
  onContinue: (player: StoredPlayer) => void;
  title?: string;
};

type LoginMode = "unknown" | "new" | "login" | "set-password";

export function ContinueAsPlayer({
  onContinue,
  title = "Continue your picks",
}: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<LoginMode>("unknown");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setMode("unknown");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await lookupPlayerName(trimmed);
      if (cancelled) return;
      if ("error" in result) {
        setMode("unknown");
        return;
      }
      if (!result.exists) setMode("new");
      else if (result.hasPassword) setMode("login");
      else setMode("set-password");
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await joinOrResumeByName(name, password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onContinue(result.player);
    } finally {
      setLoading(false);
    }
  }

  const passwordLabel =
    mode === "new"
      ? "Choose a password"
      : mode === "set-password"
        ? "Set a password for your account"
        : "Password";

  const passwordHint =
    mode === "new"
      ? "Pick something only you know — you'll need it to open your picks again."
      : mode === "set-password"
        ? "Your name exists but has no password yet. Set one now to protect your picks."
        : "Enter the password you chose when you joined.";

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-[var(--muted)]">
        Sign in with your <strong className="text-white">name</strong> and{" "}
        <strong className="text-white">password</strong>. Your picks are stored
        on the server — use the same login on any device.
      </p>
      <ul className="text-xs text-[var(--muted)] list-disc pl-4 space-y-1">
        <li>
          <strong className="text-white">Same browser:</strong> we usually
          remember you automatically.
        </li>
        <li>
          <strong className="text-white">New browser or phone:</strong> enter
          name and password below.
        </li>
        <li>
          Forgot password?{" "}
          <Link href="/admin" className="text-[var(--accent)] hover:underline">
            Contact Elin
          </Link>
          .
        </li>
      </ul>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
            required
            minLength={2}
            maxLength={80}
            autoFocus
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{passwordLabel}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </label>
        {mode !== "unknown" && (
          <p className="text-xs text-[var(--muted)]">{passwordHint}</p>
        )}
        <button
          type="submit"
          disabled={loading || name.trim().length < 2}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {loading
            ? "Loading…"
            : mode === "new"
              ? "Join"
              : mode === "set-password"
                ? "Set password & continue"
                : "Continue"}
        </button>
      </form>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
