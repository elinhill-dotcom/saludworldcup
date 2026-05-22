"use client";

import {
  type KnockoutFormState,
  KNOCKOUT_PICK_COUNT,
  KNOCKOUT_STEPS,
  isKnockoutComplete,
} from "@/lib/knockout-picks";

type Tab = "group" | "knockout";

type Props = {
  groupFilled: number;
  groupTotal: number;
  knockout: KnockoutFormState;
  activeTab: Tab;
  onGoTo: (tab: Tab) => void;
  locked: boolean;
};

export function PicksChecklist({
  groupFilled,
  groupTotal,
  knockout,
  activeTab,
  onGoTo,
  locked,
}: Props) {
  const knockoutFilled = Object.values(knockout).filter((v) => v !== "").length;
  const groupDone = groupFilled >= groupTotal;
  const knockoutDone = isKnockoutComplete(knockout);
  const allDone = groupDone && knockoutDone;

  return (
    <section className="picks-checklist rounded-xl border-2 border-[var(--accent)]/50 bg-[var(--card)] p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Two parts — both required</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Your entry is only complete when you have filled in{" "}
          <strong className="text-white">all group scores</strong> and{" "}
          <strong className="text-white">semis, final & bronze</strong>. Many
          people forget step 2 — check both before you leave.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StepCard
          step={1}
          title="Group stage"
          subtitle={`${groupTotal} match scores`}
          filled={groupFilled}
          total={groupTotal}
          done={groupDone}
          active={activeTab === "group"}
          onOpen={() => onGoTo("group")}
          locked={locked}
        />
        <StepCard
          step={2}
          title="Semis · Final · Bronze"
          subtitle="9 team picks (not match scores)"
          filled={knockoutFilled}
          total={KNOCKOUT_PICK_COUNT}
          done={knockoutDone}
          active={activeTab === "knockout"}
          onOpen={() => onGoTo("knockout")}
          locked={locked}
          highlight={!knockoutDone}
        />
      </div>

      <ul className="text-xs text-[var(--muted)] space-y-1 border-t border-[var(--border)] pt-3">
        {KNOCKOUT_STEPS.map((s) => (
          <li key={s.key}>
            <strong className="text-white">Step 2 — {s.label}:</strong> {s.desc}{" "}
            ({s.fields} picks)
          </li>
        ))}
      </ul>

      {!locked && !allDone && (
        <p className="text-sm rounded-lg bg-[var(--danger)]/15 text-[var(--danger)] px-4 py-2">
          {!groupDone && !knockoutDone && "Fill in both steps above."}
          {groupDone && !knockoutDone &&
            "Group stage done — go to Step 2 (Semis · Final · Bronze) before saving!"}
          {!groupDone && knockoutDone &&
            "Knockout done — finish the remaining group scores."}
        </p>
      )}

      {allDone && !locked && (
        <p className="text-sm rounded-lg bg-[var(--success)]/15 text-[var(--success)] px-4 py-2">
          All set — click <strong>Save all picks</strong> to store everything.
        </p>
      )}
    </section>
  );
}

function StepCard({
  step,
  title,
  subtitle,
  filled,
  total,
  done,
  active,
  onOpen,
  locked,
  highlight,
}: {
  step: number;
  title: string;
  subtitle: string;
  filled: number;
  total: number;
  done: boolean;
  active: boolean;
  onOpen: () => void;
  locked: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`text-left rounded-xl border p-4 transition w-full ${
        active
          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40 bg-[var(--accent)]/10"
          : highlight
            ? "border-[var(--danger)]/60 bg-[var(--danger)]/5 animate-pulse-subtle"
            : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--accent)]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-[var(--accent)]">STEP {step}</span>
        {done ? (
          <span className="pick-badge pick-badge--exact">Done</span>
        ) : (
          <span className="pick-badge pick-badge--wrong">
            {total - filled} left
          </span>
        )}
      </div>
      <p className="font-semibold mt-2">{title}</p>
      <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      <p className="text-sm mt-2 font-medium">
        {filled}/{total} filled
      </p>
      {!locked && (
        <p className="text-xs text-[var(--accent)] mt-2">
          {active ? "You are here" : "Click to open →"}
        </p>
      )}
    </button>
  );
}
