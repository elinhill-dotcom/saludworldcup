import { KNOCKOUT_PICK_COUNT } from "@/lib/knockout-picks";
import {
  deriveKnockoutAnswerFromMatches,
  getEliminatedTeams,
  mergeKnockoutAnswers,
  resolveKnockoutBracket,
  type ResolvedMatch,
} from "@/lib/knockout-bracket";
import {
  KNOCKOUT_POINTS,
  maxKnockoutPotential,
  remainingKnockoutPotential,
  scoreKnockoutPick,
  type KnockoutPickData,
} from "@/lib/knockout-scoring";
import { mapKnockoutAnswer, mapKnockoutPick } from "@/lib/supabase-mappers";
import type { KnockoutAnswerRow, KnockoutPickRow, PlayerRow } from "@/lib/supabase-types";
import { getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";
import { fetchMatches } from "@/lib/supabase-matches";
import { toEnglishTeam } from "@/lib/team-names";

export type KnockoutBetStat = {
  team: string;
  semifinalPct: number;
  finalPct: number;
  championPct: number;
  bronzePct: number;
  pickCount: number;
};

export type KnockoutPlayerPoints = {
  playerId: string;
  name: string;
  earned: number;
  remaining: number;
  maxPossible: number;
  knockoutComplete: boolean;
  championPick: string | null;
};

export type KnockoutPlayerPick = {
  playerId: string;
  name: string;
  complete: boolean;
  semifinalists: string[];
  finalists: string[];
  bronzeTeams: string[];
  champion: string | null;
};

export type KnockoutPagePayload = {
  matches: ResolvedMatch[];
  eliminated: string[];
  betting: KnockoutBetStat[];
  players: KnockoutPlayerPoints[];
  playerPicks: KnockoutPlayerPick[];
  knockoutPoints: typeof KNOCKOUT_POINTS;
  pickCount: number;
};

function norm(t: string): string {
  return toEnglishTeam(t);
}

function toPickData(ko: ReturnType<typeof mapKnockoutPick>): KnockoutPickData {
  return {
    sf1Home: ko.sf1Home || null,
    sf1Away: ko.sf1Away || null,
    sf2Home: ko.sf2Home || null,
    sf2Away: ko.sf2Away || null,
    finalHome: ko.finalHome || null,
    finalAway: ko.finalAway || null,
    bronzeHome: ko.bronzeHome || null,
    bronzeAway: ko.bronzeAway || null,
    champion: ko.champion || null,
  };
}

function buildBettingStats(
  picks: ReturnType<typeof mapKnockoutPick>[],
): KnockoutBetStat[] {
  const complete = picks.filter(
    (p) =>
      [
        p.sf1Home,
        p.sf1Away,
        p.sf2Home,
        p.sf2Away,
        p.finalHome,
        p.finalAway,
        p.bronzeHome,
        p.bronzeAway,
        p.champion,
      ].filter(Boolean).length === KNOCKOUT_PICK_COUNT,
  );
  const total = complete.length;
  const counts = new Map<
    string,
    { sf: number; fin: number; champ: number; bronze: number }
  >();

  for (const p of complete) {
    const sfTeams = new Set(
      [p.sf1Home, p.sf1Away, p.sf2Home, p.sf2Away].filter(Boolean).map(norm),
    );
    const finTeams = new Set(
      [p.finalHome, p.finalAway].filter(Boolean).map(norm),
    );
    const bronzeTeams = new Set(
      [p.bronzeHome, p.bronzeAway].filter(Boolean).map(norm),
    );
    const champ = p.champion ? norm(p.champion) : null;

    for (const t of sfTeams) {
      const c = counts.get(t) ?? { sf: 0, fin: 0, champ: 0, bronze: 0 };
      c.sf += 1;
      counts.set(t, c);
    }
    for (const t of finTeams) {
      const c = counts.get(t) ?? { sf: 0, fin: 0, champ: 0, bronze: 0 };
      c.fin += 1;
      counts.set(t, c);
    }
    for (const t of bronzeTeams) {
      const c = counts.get(t) ?? { sf: 0, fin: 0, champ: 0, bronze: 0 };
      c.bronze += 1;
      counts.set(t, c);
    }
    if (champ) {
      const c = counts.get(champ) ?? { sf: 0, fin: 0, champ: 0, bronze: 0 };
      c.champ += 1;
      counts.set(champ, c);
    }
  }

  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  return [...counts.entries()]
    .map(([team, c]) => ({
      team,
      semifinalPct: pct(c.sf),
      finalPct: pct(c.fin),
      championPct: pct(c.champ),
      bronzePct: pct(c.bronze),
      pickCount: total,
    }))
    .sort((a, b) => b.championPct - a.championPct || a.team.localeCompare(b.team));
}

export async function computeKnockoutPageData(): Promise<
  DbResult<KnockoutPagePayload>
> {
  try {
    const supabase = getSupabaseServer();
    const [matchesRes, playersRes, koPicksRes, koAnswerRes] = await Promise.all([
      fetchMatches(undefined),
      supabase.from("players").select("*").order("name", { ascending: true }),
      supabase.from("knockout_picks").select("*"),
      supabase.from("knockout_answer").select("*").eq("id", 1).maybeSingle(),
    ]);

    if (matchesRes.error || !matchesRes.data) {
      return { data: null, error: matchesRes.error ?? "Matches failed" };
    }
    if (playersRes.error) return { data: null, error: playersRes.error.message };

    const koMatches = matchesRes.data.filter((m) => m.id >= 73);
    const resolvedMap = resolveKnockoutBracket(koMatches);
    const matches = [...resolvedMap.values()].sort((a, b) => a.id - b.id);
    const eliminatedSet = getEliminatedTeams(resolvedMap);
    const derived = deriveKnockoutAnswerFromMatches(resolvedMap);
    const answerRow = koAnswerRes.data as KnockoutAnswerRow | null;
    const manual = answerRow?.set ? mapKnockoutAnswer(answerRow) : null;
    const answer = mergeKnockoutAnswers(
      manual
        ? {
            sf1Home: manual.sf1Home || null,
            sf1Away: manual.sf1Away || null,
            sf2Home: manual.sf2Home || null,
            sf2Away: manual.sf2Away || null,
            finalHome: manual.finalHome || null,
            finalAway: manual.finalAway || null,
            bronzeHome: manual.bronzeHome || null,
            bronzeAway: manual.bronzeAway || null,
            champion: manual.champion || null,
          }
        : null,
      derived,
    );

    const koByPlayer = new Map<string, ReturnType<typeof mapKnockoutPick>>();
    for (const row of (koPicksRes.data ?? []) as KnockoutPickRow[]) {
      koByPlayer.set(row.player_id, mapKnockoutPick(row));
    }

    const betting = buildBettingStats([...koByPlayer.values()]);

    const playerPicks: KnockoutPlayerPick[] = (playersRes.data as PlayerRow[]).map(
      (row) => {
        const ko = koByPlayer.get(row.id);
        const fields = ko
          ? [
              ko.sf1Home,
              ko.sf1Away,
              ko.sf2Home,
              ko.sf2Away,
              ko.finalHome,
              ko.finalAway,
              ko.bronzeHome,
              ko.bronzeAway,
              ko.champion,
            ]
          : [];
        const complete = fields.filter(Boolean).length === KNOCKOUT_PICK_COUNT;
        const uniq = (teams: (string | undefined)[]) =>
          [...new Set(teams.filter(Boolean).map((t) => norm(t!)))];
        return {
          playerId: row.id,
          name: row.name,
          complete,
          semifinalists: ko
            ? uniq([ko.sf1Home, ko.sf1Away, ko.sf2Home, ko.sf2Away])
            : [],
          finalists: ko ? uniq([ko.finalHome, ko.finalAway]) : [],
          bronzeTeams: ko ? uniq([ko.bronzeHome, ko.bronzeAway]) : [],
          champion: ko?.champion ? norm(ko.champion) : null,
        };
      },
    );

    playerPicks.sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? -1 : 1;
      return a.name.localeCompare(b.name, "en");
    });

    const players: KnockoutPlayerPoints[] = (playersRes.data as PlayerRow[]).map(
      (row) => {
        const ko = koByPlayer.get(row.id);
        const pick = ko ? toPickData(ko) : null;
        const complete =
          ko &&
          [
            ko.sf1Home,
            ko.sf1Away,
            ko.sf2Home,
            ko.sf2Away,
            ko.finalHome,
            ko.finalAway,
            ko.bronzeHome,
            ko.bronzeAway,
            ko.champion,
          ].filter(Boolean).length === KNOCKOUT_PICK_COUNT;

        const earned = pick ? scoreKnockoutPick(pick, answer) : 0;
        const maxPossible = pick ? maxKnockoutPotential(pick) : 0;
        const remaining = pick
          ? remainingKnockoutPotential(pick, eliminatedSet)
          : 0;

        return {
          playerId: row.id,
          name: row.name,
          earned,
          remaining,
          maxPossible,
          knockoutComplete: !!complete,
          championPick: ko?.champion ?? null,
        };
      },
    );

    players.sort((a, b) => {
      if (b.earned !== a.earned) return b.earned - a.earned;
      if (b.remaining !== a.remaining) return b.remaining - a.remaining;
      return a.name.localeCompare(b.name, "en");
    });

    return {
      data: {
        matches,
        eliminated: [...eliminatedSet],
        betting,
        players,
        playerPicks,
        knockoutPoints: KNOCKOUT_POINTS,
        pickCount: betting[0]?.pickCount ?? 0,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
