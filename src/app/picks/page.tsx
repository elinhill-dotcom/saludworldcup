"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KnockoutPickForm } from "@/components/KnockoutPickForm";
import {
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/lib/knockout-picks";
import { ContinueAsPlayer } from "@/components/ContinueAsPlayer";
import { MatchPoolInsight } from "@/components/MatchPoolInsight";
import { MatchCard, type MatchView } from "@/components/MatchCard";
import { PicksChecklist } from "@/components/PicksChecklist";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import {
  KNOCKOUT_PICK_COUNT,
  countKnockoutFilled,
  isKnockoutComplete,
} from "@/lib/knockout-picks";
import type { StoredPlayer } from "@/lib/player-storage";
import type { MatchPoolStats } from "@/lib/pool-stats";
import { playerAuthHeaders } from "@/lib/player-session-storage";

type PredMap = Record<number, { home: string; away: string }>;

export default function PicksPage() {
  const { player, hydrated, remember, signOut } = usePlayerSession();
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [preds, setPreds] = useState<PredMap>({});
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [locked, setLocked] = useState(false);
  const [picksReopened, setPicksReopened] = useState(false);
  const [filter, setFilter] = useState<"all" | "featured" | "missing">("all");
  const [tab, setTab] = useState<"group" | "knockout">("group");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageWarn, setMessageWarn] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loginHint, setLoginHint] = useState("");
  const wasLockedRef = useRef(false);
  const [poolByMatch, setPoolByMatch] = useState<Map<number, MatchPoolStats>>(
    new Map(),
  );

  const load = useCallback(async (playerId: string) => {
    setLoadError("");
    const authHeaders = playerAuthHeaders();
    const [mRes, pRes, kRes, cRes] = await Promise.all([
      fetch("/api/matches?stage=group"),
      fetch(`/api/predictions?playerId=${playerId}`, { headers: authHeaders }),
      fetch(`/api/knockout-picks?playerId=${playerId}`, { headers: authHeaders }),
      fetch(`/api/config?playerId=${encodeURIComponent(playerId)}`),
    ]);
    const mData = await mRes.json();
    const pData = await pRes.json();
    const kData = await kRes.json();
    const cfg = await cRes.json();

    if (!mRes.ok) {
      setLoadError(
        mData.error ??
          "Could not load matches. Check Supabase settings and run npm run db:seed.",
      );
      setMatches([]);
      return;
    }

    if (pRes.status === 403 || kRes.status === 403) {
      setLoginHint(
        "Your saved picks are on the server, but this browser needs you to log in again with your password.",
      );
      signOut();
      return;
    }

    if (!pRes.ok || !kRes.ok) {
      setLoadError(
        pData.error ?? kData.error ?? "Could not load your saved picks.",
      );
      setMatches(mData.matches ?? []);
      return;
    }

    const ms = mData.matches as MatchView[];
    const predictions = pData.predictions ?? [];
    const pick = kData.pick;

    setMatches(ms ?? []);
    setLocked(cfg.locked);
    setPicksReopened(cfg.picksReopened ?? false);
    wasLockedRef.current = cfg.locked ?? false;

    if (cfg.locked) {
      fetch("/api/stats")
        .then((r) => r.json())
        .then((data) => {
          if (data.locked && data.matches) {
            setPoolByMatch(
              new Map(
                (data.matches as MatchPoolStats[]).map((m) => [m.matchId, m]),
              ),
            );
          }
        });
    } else {
      setPoolByMatch(new Map());
    }

    const map: PredMap = {};
    for (const m of ms as MatchView[]) {
      map[m.id] = { home: "", away: "" };
    }
    for (const p of predictions) {
      map[p.matchId] = {
        home: String(p.homeScore),
        away: String(p.awayScore),
      };
    }
    setPreds(map);

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
    }
  }, [signOut]);

  useEffect(() => {
    if (player) load(player.id);
  }, [player, load]);

  useEffect(() => {
    if (!player) return;

    const refreshLock = async () => {
      const res = await fetch(
        `/api/config?playerId=${encodeURIComponent(player.id)}`,
      );
      const cfg = await res.json();
      const nowLocked = cfg.locked ?? false;
      if (nowLocked && !wasLockedRef.current) {
        await load(player.id);
        const statsRes = await fetch("/api/stats");
        const statsData = await statsRes.json();
        if (statsData.locked && statsData.matches) {
          setPoolByMatch(
            new Map(
              (statsData.matches as MatchPoolStats[]).map((m) => [
                m.matchId,
                m,
              ]),
            ),
          );
        }
      }
      if (!nowLocked) {
        setPoolByMatch(new Map());
      }
      wasLockedRef.current = nowLocked;
      setLocked(nowLocked);
      setPicksReopened(cfg.picksReopened ?? false);
    };

    refreshLock();
    const id = setInterval(refreshLock, 30000);
    return () => clearInterval(id);
  }, [player, load]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "featured") return m.featured;
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
  const groupDone = filledGroup >= matches.length && matches.length > 0;
  const knockoutDone = isKnockoutComplete(knockout);

  async function save() {
    if (!player || locked) return;
    setSaving(true);
    setMessage("");
    setMessageWarn(false);

    const items = Object.entries(preds)
      .filter(([, v]) => v.home !== "" && v.away !== "")
      .map(([id, v]) => ({
        matchId: Number(id),
        homeScore: Number(v.home),
        awayScore: Number(v.away),
      }));

    const [groupRes, koRes] = await Promise.all([
      fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...playerAuthHeaders(),
        },
        body: JSON.stringify({ playerId: player.id, predictions: items }),
      }),
      fetch("/api/knockout-picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...playerAuthHeaders(),
        },
        body: JSON.stringify({ playerId: player.id, ...knockout }),
      }),
    ]);

    const groupData = await groupRes.json();
    const koData = await koRes.json();
    setSaving(false);

    if (!groupRes.ok || !koRes.ok) {
      setMessage(
        groupData.error ?? koData.error ?? "Could not save",
      );
      setMessageWarn(true);
      return;
    }

    const savedCount = groupData.savedCount ?? 0;
    const submittedCount = groupData.submittedCount ?? items.length;

    if (items.length > 0 && savedCount === 0) {
      setMessage(
        "Save failed — nothing was stored on the server. Log in again and retry, or contact Elin.",
      );
      setMessageWarn(true);
      return;
    }

    if (submittedCount > 0 && savedCount < submittedCount) {
      setMessage(
        `Only ${savedCount}/${submittedCount} scores were confirmed on the server. Try saving again.`,
      );
      setMessageWarn(true);
      await load(player.id);
      return;
    }

    await load(player.id);

    const parts: string[] = [
      `Saved! Group: ${savedCount}/${matches.length} scores on server.`,
      `Knockout: ${knockoutFilled}/${KNOCKOUT_PICK_COUNT} picks.`,
    ];
    if (!knockoutDone) {
      parts.push(
        "Reminder: Step 2 (Semis · Final · Bronze) is not complete yet!",
      );
      setMessageWarn(true);
    } else if (!groupDone) {
      parts.push("Reminder: some group scores are still missing.");
      setMessageWarn(true);
    }
    setMessage(parts.join(" "));
  }

  if (!hydrated) {
    return <p className="text-[var(--muted)] text-sm">Loading…</p>;
  }

  if (!player) {
    return (
      <div className="space-y-4">
        {loginHint && (
          <p className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--muted)]">
            {loginHint}
          </p>
        )}
        <ContinueAsPlayer
          title="My picks"
          onContinue={(p: StoredPlayer) => {
            setLoginHint("");
            remember(p);
            load(p.id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <PicksChecklist
        groupFilled={filledGroup}
        groupTotal={matches.length}
        knockout={knockout}
        activeTab={tab}
        onGoTo={setTab}
        locked={locked}
      />

      <h2 className="text-xl font-semibold">My picks — {player.name}</h2>

      {message && locked && (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            messageWarn
              ? "bg-[var(--danger)]/15 text-[var(--danger)]"
              : "bg-[var(--success)]/20 text-[var(--success)]"
          }`}
        >
          {message}
        </p>
      )}

      {loadError && (
        <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-3 text-sm space-y-2">
          <strong>Matches could not be loaded.</strong> {loadError}
          <span className="block text-[var(--muted)]">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
            .env, run supabase/schema.sql in Supabase, then{" "}
            <code className="text-white">npm run db:seed</code> and restart the
            dev server.
          </span>
        </p>
      )}

      {locked && (
        <p className="rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2 text-sm">
          Picks are locked — you cannot add or change any picks after 11 June at
          20:00. View only.
        </p>
      )}

      {picksReopened && !locked && (
        <p className="rounded-lg bg-[var(--success)]/20 text-[var(--success)] px-4 py-2 text-sm">
          Picks are temporarily open again — fill in your tips and press{" "}
          <strong>Save all picks</strong>.
        </p>
      )}

      {!locked && tab === "group" && groupDone && !knockoutDone && (
        <p className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-4 py-3 text-sm">
          <strong>Don&apos;t stop here!</strong> Group stage looks complete. Open{" "}
          <button
            type="button"
            onClick={() => setTab("knockout")}
            className="font-semibold text-[var(--accent)] underline"
          >
            Step 2: Semis · Final · Bronze
          </button>{" "}
          ({KNOCKOUT_PICK_COUNT} picks required).
        </p>
      )}

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
          Step 1: Group stage
          <span className="ml-1 opacity-80">
            ({filledGroup}/{matches.length})
          </span>
          {groupDone && " ✓"}
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "knockout"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : knockoutDone
                ? "bg-[var(--card)] text-[var(--muted)]"
                : "bg-[var(--danger)]/20 text-white border border-[var(--danger)]/50"
          }`}
        >
          Step 2: Semis · Final · Bronze
          <span className="ml-1 opacity-80">
            ({knockoutFilled}/{KNOCKOUT_PICK_COUNT})
          </span>
          {knockoutDone ? " ✓" : " — required"}
        </button>
      </div>

      {tab === "group" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            Predict the <strong className="text-white">score</strong> for every
            group match — you can do a few at a time and save. Then go to Step 2
            for semifinals, final, and bronze.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All matches"],
                ["featured", "Our teams (NL SE FR MX)"],
                ["missing", "Missing scores"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  filter === key
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                    : "bg-[var(--card)] text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {matches.length === 0 && !loadError && (
            <p className="text-sm text-[var(--muted)]">
              Loading matches…
            </p>
          )}

          {byDay.map(([day, dayMatches]) => (
            <section key={day}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--accent)]">
                {day}
              </h3>
              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <MatchCard
                      match={m}
                      predHome={preds[m.id]?.home ?? ""}
                      predAway={preds[m.id]?.away ?? ""}
                      locked={locked}
                      showResult
                      onChange={(home, away) =>
                        setPreds((prev) => ({
                          ...prev,
                          [m.id]: { home, away },
                        }))
                      }
                    />
                    {locked && poolByMatch.has(m.id) && (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 px-4 py-3">
                        <MatchPoolInsight
                          stats={poolByMatch.get(m.id)!}
                          variant="compact"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {tab === "knockout" && (
        <>
          <p className="text-sm text-[var(--muted)] rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
            <strong className="text-white">Step 2 of 2.</strong> Pick which teams
            reach the semifinals, final, bronze match, and who wins the World Cup.
            This is separate from group scores — all{" "}
            <strong className="text-white">{KNOCKOUT_PICK_COUNT} fields</strong>{" "}
            must be filled.
          </p>
          <KnockoutPickForm
            form={knockout}
            locked={locked}
            onChange={setKnockout}
          />
        </>
      )}

      {!locked && matches.length > 0 && (
        <div
          className="picks-save-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.35)]"
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
              className="w-full sm:w-auto shrink-0 rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] disabled:opacity-50 sm:min-w-[10rem]"
            >
              {saving ? "Saving…" : "Save all picks"}
            </button>
          </div>
          {message && (
            <p
              className={`mx-auto max-w-3xl px-4 pb-2 text-center text-xs ${
                messageWarn ? "text-[var(--danger)]" : "text-[var(--success)]"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
