"use client";

import {
  type KnockoutFormState,
  emptyKnockoutForm,
} from "@/lib/knockout-picks";
import { ALL_TEAMS } from "@/lib/teams";

export type { KnockoutFormState };
export { emptyKnockoutForm };

function TeamSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
      >
        <option value="">— Select —</option>
        {ALL_TEAMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

type Props = {
  form: KnockoutFormState;
  locked: boolean;
  onChange: (next: KnockoutFormState) => void;
};

export function KnockoutPickForm({ form, locked, onChange }: Props) {
  const set = (key: keyof KnockoutFormState, value: string) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="font-semibold">Semifinals (4 picks)</h3>
        <p className="text-xs text-[var(--muted)]">
          Who plays each semifinal? Pick all four teams.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Semifinal 1 — home"
            value={form.sf1Home}
            disabled={locked}
            onChange={(v) => set("sf1Home", v)}
          />
          <TeamSelect
            label="Semifinal 1 — away"
            value={form.sf1Away}
            disabled={locked}
            onChange={(v) => set("sf1Away", v)}
          />
          <TeamSelect
            label="Semifinal 2 — home"
            value={form.sf2Home}
            disabled={locked}
            onChange={(v) => set("sf2Home", v)}
          />
          <TeamSelect
            label="Semifinal 2 — away"
            value={form.sf2Away}
            disabled={locked}
            onChange={(v) => set("sf2Away", v)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--featured)] p-5 space-y-4">
        <h3 className="font-semibold">Final (3 picks)</h3>
        <p className="text-xs text-[var(--muted)]">
          Which two teams meet in the final, and who wins the World Cup?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Final — team 1"
            value={form.finalHome}
            disabled={locked}
            onChange={(v) => set("finalHome", v)}
          />
          <TeamSelect
            label="Final — team 2"
            value={form.finalAway}
            disabled={locked}
            onChange={(v) => set("finalAway", v)}
          />
          <div className="sm:col-span-2">
            <TeamSelect
              label="World Cup winner"
              value={form.champion}
              disabled={locked}
              onChange={(v) => set("champion", v)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="font-semibold">Bronze match (2 picks)</h3>
        <p className="text-xs text-[var(--muted)]">
          Who plays for third place?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Bronze — team 1"
            value={form.bronzeHome}
            disabled={locked}
            onChange={(v) => set("bronzeHome", v)}
          />
          <TeamSelect
            label="Bronze — team 2"
            value={form.bronzeAway}
            disabled={locked}
            onChange={(v) => set("bronzeAway", v)}
          />
        </div>
      </section>
    </div>
  );
}
