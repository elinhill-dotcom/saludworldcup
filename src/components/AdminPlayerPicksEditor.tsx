"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KnockoutPickForm } from "@/components/KnockoutPickForm";
import { MatchCard, type MatchView } from "@/components/MatchCard";
import { PicksChecklist } from "@/components/PicksChecklist";
import {
  KNOCKOUT_PICK_COUNT,
  countKnockoutFilled,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/lib/knockout-picks";

type PredMap = Record<number, { home: string; away: string }>;

type PlayerInfo = {
  id: string;
  name: string;
};

type Props = {
  player: PlayerInfo;
  password: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

export function AdminPlayerPicksEditor({
  player,
  password,
  onClose,
  onSaved,
  onError,
}: Props) {
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [preds, setPreds] = useState<PredMap>({});
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [tab, setTab] = useState<"group" | "knockout">("group");
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "x-admin-password": password,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/matches?stage=group"),
        fetch(`/api/admin/player-picks?playerId=${player.id}`, { headers }),
      ]);
      const mData = await mRes.json();
      const pData = await pRes.json();

      if (!mRes.ok) {
        setLoadError(mData.error ?? "Could not load matches");
        return;
      }
      if (!pRes.ok) {
        setLoadError(pData.error ?? "Could not load player picks");
        return;
      }

      const ms = (mData.matches ?? []) as MatchView[];
      setMatches(ms);

      const map: PredMap = {};
      for (const m of ms) {
        map[m.id] = { home: "", away: "" };
      }
      for (const p of pData.predictions ?? []) {
        map[p.matchId] = {
          home: String(p.homeScore),
          away: String(p.awayScore),
        };
      }
      setPreds(map);

      const pick = pData.knockout;
      if (pick) {
        setKnockout({
          sf1Home: pick.sf1Home ?? "",
          sf1Away: pick.sf1Away ?? "",
          sf2Home: pick.sf2Home ?? "",
          sf2Away: pick.sf2Away ?? "",
          finalHome: pick.finalHome ?? "",
          finalAway: pick.finalAway ?? "",
          bronzeHome: pick.bronzeHome ?? "",
          bronzeAway: pick.bronzeAway ?? "",
          champion: pick.champion ?? "",
        });
      } else {
        setKnockout(emptyKnockoutForm());
      }
    } catch {
      setLoadError("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [player.id, password]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "missing") {
        const pr = preds[m.id];
        return !pr?.home || pr.home === "" || !pr?.away || pr.away === "";
      }
      return true;
    });
  }, [matches, filter, preds]);

  const byDay = useMemo(() => {
    const groups: Record<string, MatchView[]> = {};
    for (const m of filtered) {
      const key = m.dayLabel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups);
  }, [filtered]);

  const filledGroup = useMemo(() => {
    return matches.filter((m) => {
      const p = preds[m.id];
      return p?.home !== "" && p?.away !== "";
    }).length;
  }, [matches, preds]);

  const knockoutFilled = countKnockoutFilled(knockout);

  async function save() {
    setSaving(true);
    onError("");

    const items = Object.entries(preds)
      .filter(([, v]) => v.home !== "" && v.away !== "")
      .map(([id, v]) => ({
        matchId: Number(id),
        homeScore: Number(v.home),
        awayScore: Number(v.away),
      }));

    const res = await fetch("/api/admin/player-picks", {
      method: "POST",
      headers,
      body: JSON.stringify({
        playerId: player.id,
        predictions: items,
        ...knockout,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      onError(data.error ?? "Save failed");
      return;
    }

    await load();
    onSaved(
      `Saved for ${player.name}: ${data.savedCount}/${matches.length} group scores, knockout ${knockoutFilled}/${KNOCKOUT_PICK_COUNT}.`,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]"
      role="dialog"
      aria-labelledby="admin-picks-title"
    >
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--muted)]">Admin · edit picks</p>
            <h2 id="admin-picks-title" className="text-lg font-semibold">
              {player.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
          >
            Close
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4 pb-28">
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading picks…</p>
          ) : loadError ? (
            <p className="text-sm text-[var(--danger)]">{loadError}</p>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)] rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
                Edit this player&apos;s picks on their behalf. Changes are saved
                directly to the server — they do not need to be logged in.
              </p>

              <PicksChecklist
                groupFilled={filledGroup}
                groupTotal={matches.length}
                knockout={knockout}
                activeTab={tab}
                onGoTo={setTab}
                locked={false}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("group")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "group"
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--card)] text-[var(--muted)]"
                  }`}
                >
                  Group ({filledGroup}/{matches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("knockout")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "knockout"
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--card)] text-[var(--muted)]"
                  }`}
                >
                  Knockout ({knockoutFilled}/{KNOCKOUT_PICK_COUNT})
                </button>
              </div>

              {tab === "group" && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["all", "All matches"],
                        ["missing", "Missing scores"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          filter === key
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                            : "bg-[var(--card)] text-[var(--muted)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {byDay.map(([day, dayMatches]) => (
                    <section key={day}>
                      <h3 className="mb-3 text-sm font-semibold text-[var(--accent)]">
                        {day}
                      </h3>
                      <div className="space-y-3">
                        {dayMatches.map((m) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            predHome={preds[m.id]?.home ?? ""}
                            predAway={preds[m.id]?.away ?? ""}
                            locked={false}
                            onChange={(home, away) =>
                              setPreds((prev) => ({
                                ...prev,
                                [m.id]: { home, away },
                              }))
                            }
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              )}

              {tab === "knockout" && (
                <KnockoutPickForm
                  form={knockout}
                  locked={false}
                  onChange={setKnockout}
                />
              )}
            </>
          )}
        </div>
      </div>

      {!loading && !loadError && (
        <div
          className="shrink-0 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <p className="hidden min-w-0 flex-1 text-xs text-[var(--muted)] sm:block">
              Group {filledGroup}/{matches.length} · Knockout {knockoutFilled}/
              {KNOCKOUT_PICK_COUNT}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="w-full sm:w-auto shrink-0 rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save all picks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
