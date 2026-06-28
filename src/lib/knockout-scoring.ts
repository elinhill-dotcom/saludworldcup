import { toEnglishTeam } from "@/lib/team-names";

export type KnockoutPickData = {
  sf1Home: string | null;
  sf1Away: string | null;
  sf2Home: string | null;
  sf2Away: string | null;
  finalHome: string | null;
  finalAway: string | null;
  bronzeHome: string | null;
  bronzeAway: string | null;
  champion: string | null;
};

export const KNOCKOUT_POINTS = {
  semifinalist: 2,
  finalist: 3,
  champion: 5,
  bronzeTeam: 2,
} as const;

function norm(t: string): string {
  return toEnglishTeam(t);
}

function teamsInSemis(answer: KnockoutPickData): string[] {
  return [answer.sf1Home, answer.sf1Away, answer.sf2Home, answer.sf2Away]
    .filter((t): t is string => !!t)
    .map(norm);
}

function teamsInFinal(answer: KnockoutPickData): string[] {
  return [answer.finalHome, answer.finalAway]
    .filter((t): t is string => !!t)
    .map(norm);
}

function teamsInBronze(answer: KnockoutPickData): string[] {
  return [answer.bronzeHome, answer.bronzeAway]
    .filter((t): t is string => !!t)
    .map(norm);
}

function uniqueTeams(teams: (string | null | undefined)[]): string[] {
  return [...new Set(teams.filter((t): t is string => !!t).map(norm))];
}

export function scoreKnockoutPick(
  pick: KnockoutPickData,
  answer: KnockoutPickData,
): number {
  let points = 0;
  const actualSF = new Set(teamsInSemis(answer));
  if (actualSF.size > 0) {
    for (const t of uniqueTeams([
      pick.sf1Home,
      pick.sf1Away,
      pick.sf2Home,
      pick.sf2Away,
    ])) {
      if (actualSF.has(t)) points += KNOCKOUT_POINTS.semifinalist;
    }
  }

  const actualFinal = new Set(teamsInFinal(answer));
  if (actualFinal.size > 0) {
    for (const t of uniqueTeams([pick.finalHome, pick.finalAway])) {
      if (actualFinal.has(t)) points += KNOCKOUT_POINTS.finalist;
    }
  }

  if (
    pick.champion &&
    answer.champion &&
    norm(pick.champion) === norm(answer.champion)
  ) {
    points += KNOCKOUT_POINTS.champion;
  }

  const actualBronze = new Set(teamsInBronze(answer));
  if (actualBronze.size > 0) {
    for (const t of uniqueTeams([pick.bronzeHome, pick.bronzeAway])) {
      if (actualBronze.has(t)) points += KNOCKOUT_POINTS.bronzeTeam;
    }
  }

  return points;
}

/** Max knockout points still possible given eliminated teams. */
export function remainingKnockoutPotential(
  pick: KnockoutPickData,
  eliminated: Set<string>,
): number {
  let remaining = 0;
  for (const t of uniqueTeams([
    pick.sf1Home,
    pick.sf1Away,
    pick.sf2Home,
    pick.sf2Away,
  ])) {
    if (!eliminated.has(t)) remaining += KNOCKOUT_POINTS.semifinalist;
  }
  for (const t of uniqueTeams([pick.finalHome, pick.finalAway])) {
    if (!eliminated.has(t)) remaining += KNOCKOUT_POINTS.finalist;
  }
  if (pick.champion && !eliminated.has(norm(pick.champion))) {
    remaining += KNOCKOUT_POINTS.champion;
  }
  for (const t of uniqueTeams([pick.bronzeHome, pick.bronzeAway])) {
    if (!eliminated.has(t)) remaining += KNOCKOUT_POINTS.bronzeTeam;
  }
  return remaining;
}

export function maxKnockoutPotential(pick: KnockoutPickData): number {
  return remainingKnockoutPotential(pick, new Set());
}
