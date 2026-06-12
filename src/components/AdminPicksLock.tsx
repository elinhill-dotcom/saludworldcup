"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

type LockState = {
  deadlinePassed: boolean;
  picksLocked: boolean;
  picksReopened: boolean;
  lockAt: string;
};

export function AdminPicksLock({ password, onMessage }: Props) {
  const [state, setState] = useState<LockState | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-password": password,
  };

  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    const res = await fetch("/api/admin/picks-lock", { headers });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      onMessage(data.error ?? "Could not load pick lock status", true);
      return;
    }
    setState(data);
  }, [password, onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(reopenPicks: boolean) {
    setToggling(true);
    onMessage("");
    const res = await fetch("/api/admin/picks-lock", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reopenPicks }),
    });
    const data = await res.json();
    setToggling(false);
    if (!res.ok) {
      onMessage(data.error ?? "Could not update pick lock", true);
      return;
    }
    setState((prev) =>
      prev
        ? {
            ...prev,
            picksLocked: data.picksLocked,
            picksReopened: data.picksReopened,
          }
        : null,
    );
    onMessage(
      reopenPicks
        ? "Picks reopened — players can save tips again."
        : "Picks locked again — normal deadline rules apply.",
    );
  }

  if (!password) return null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
      <h3 className="font-semibold">Pick deadline override</h3>
      {loading && !state ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : state ? (
        <>
          <p className="text-sm text-[var(--muted)]">
            {state.deadlinePassed ? (
              state.picksReopened ? (
                <>
                  The deadline has passed, but picks are{" "}
                  <strong className="text-white">temporarily open for everyone</strong>.
                </>
              ) : (
                <>
                  The deadline has passed — picks are locked for most players. Open
                  picks for one person at a time under{" "}
                  <strong className="text-white">Players → Allow picks</strong>, or
                  reopen for everyone below.
                </>
              )
            ) : (
              <>
                Deadline not reached yet — picks are open until{" "}
                <strong className="text-white">11 June at 20:00</strong>.
              </>
            )}
          </p>
          {state.deadlinePassed && (
            <div className="flex flex-wrap gap-2">
              {!state.picksReopened ? (
                <button
                  type="button"
                  onClick={() => toggle(true)}
                  disabled={toggling}
                  className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
                >
                  {toggling ? "Updating…" : "Re-open picks for everyone"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  disabled={toggling}
                  className="rounded-lg border border-[var(--danger)]/50 text-[var(--danger)] px-4 py-2 text-sm font-medium hover:bg-[var(--danger)]/10 disabled:opacity-50"
                >
                  {toggling ? "Updating…" : "Lock picks again"}
                </button>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
