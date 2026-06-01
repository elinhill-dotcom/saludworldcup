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

function pickedSemifinalists(pick: KnockoutPickData): string[] {
  return [pick.sf1Home, pick.sf1Away, pick.sf2Home, pick.sf2Away]
    .filter((t): t is string => !!t)
    .map(norm);
}

export function scoreKnockoutPick(
  pick: KnockoutPickData,
  answer: KnockoutPickData,
): number {
  if (!answer.champion) return 0;

  let points = 0;
  const actualSF = new Set(teamsInSemis(answer));
  for (const t of pickedSemifinalists(pick)) {
    if (actualSF.has(t)) points += KNOCKOUT_POINTS.semifinalist;
  }

  const actualFinal = new Set(teamsInFinal(answer));
  for (const t of [pick.finalHome, pick.finalAway]
    .filter((x): x is string => !!x)
    .map(norm)) {
    if (actualFinal.has(t)) points += KNOCKOUT_POINTS.finalist;
  }

  if (
    pick.champion &&
    answer.champion &&
    norm(pick.champion) === norm(answer.champion)
  ) {
    points += KNOCKOUT_POINTS.champion;
  }

  const actualBronze = new Set(teamsInBronze(answer));
  for (const t of [pick.bronzeHome, pick.bronzeAway]
    .filter((x): x is string => !!x)
    .map(norm)) {
    if (actualBronze.has(t)) points += KNOCKOUT_POINTS.bronzeTeam;
  }

  return points;
}
