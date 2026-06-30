import type { MatchView } from "@/components/MatchCard";
import { toEnglishTeam } from "@/lib/team-names";
import type { KnockoutPickData } from "@/lib/knockout-scoring";

export type ResolvedMatch = {
  id: number;
  matchNumber: number | null;
  stage: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  winner: string | null;
  loser: string | null;
};

export const BRACKET_LEFT_R32 = [74, 77, 73, 75, 83, 84, 81, 82] as const;
export const BRACKET_RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87] as const;

/** Column labels for each half of the bracket tree (outside → centre). */
export const BRACKET_TREE_COLUMNS = [
  {
    col: 0,
    stage: "r16",
    label: "Round of 32",
    shortLabel: "R32",
    perSide: 8,
    total: 16,
  },
  {
    col: 1,
    stage: "r8",
    label: "Round of 16",
    shortLabel: "R16",
    perSide: 4,
    total: 8,
  },
  {
    col: 2,
    stage: "qf",
    label: "Quarter-finals",
    shortLabel: "QF",
    perSide: 2,
    total: 4,
  },
  {
    col: 3,
    stage: "sf",
    label: "Semi-finals",
    shortLabel: "SF",
    perSide: 1,
    total: 2,
  },
] as const;

export function bracketTreeColumnLabel(col: number): string {
  const round = BRACKET_TREE_COLUMNS[col];
  if (!round) return "";
  return round.label;
}

export function bracketTreeColumnHint(col: number): string {
  const round = BRACKET_TREE_COLUMNS[col];
  if (!round) return "";
  return `${round.perSide} per side · ${round.total} total`;
}

export function isRoundOf32Stage(stage: string): boolean {
  return stage === "r16";
}

/** Which two matches feed into each later-round match (by internal match id). */
export const KO_FEEDERS: Record<number, readonly [number, number]> = {
  89: [73, 75],
  90: [74, 77],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  103: [101, 102],
  104: [101, 102],
};

export function matchDisplayNumber(m: ResolvedMatch | undefined): string {
  if (!m) return "?";
  return String(m.matchNumber ?? m.id);
}

export function parseSlotRef(
  name: string,
): { kind: "winner" | "loser"; matchId: number } | null {
  const w = name.match(/^Winner M(\d+)$/i);
  if (w) return { kind: "winner", matchId: Number(w[1]) };
  const l = name.match(/^Loser M(\d+)$/i);
  if (l) return { kind: "loser", matchId: Number(l[1]) };
  return null;
}

export type BracketTeamLine = {
  label: string;
  hint?: string;
  isTbd: boolean;
  isWinner: boolean;
};

export function formatBracketTeamLine(
  team: string,
  map: Map<number, ResolvedMatch>,
  winner: string | null,
): BracketTeamLine {
  const ref = parseSlotRef(team);
  if (!ref) {
    return {
      label: team,
      isTbd: false,
      isWinner: !!winner && norm(team) === norm(winner),
    };
  }

  const feeder = map.get(ref.matchId);
  const feederNo = feeder
    ? `Match ${matchDisplayNumber(feeder)}`
    : `Match ${ref.matchId}`;
  const kindLabel = ref.kind === "winner" ? "Winner" : "Loser";

  if (feeder) {
    if (ref.kind === "winner" && feeder.winner) {
      return {
        label: feeder.winner,
        isTbd: false,
        isWinner: !!winner && norm(feeder.winner) === norm(winner),
      };
    }
    if (ref.kind === "loser" && feeder.loser) {
      return {
        label: feeder.loser,
        isTbd: false,
        isWinner: !!winner && norm(feeder.loser) === norm(winner),
      };
    }

    const home = formatBracketTeamLine(feeder.homeTeam, map, null);
    const away = formatBracketTeamLine(feeder.awayTeam, map, null);
    const matchup =
      home.isTbd || away.isTbd
        ? `${kindLabel} of ${feederNo}`
        : `${kindLabel} of ${feederNo} · ${home.label} vs ${away.label}`;

    return { label: "TBD", hint: matchup, isTbd: true, isWinner: false };
  }

  return {
    label: "TBD",
    hint: `${kindLabel} of ${feederNo}`,
    isTbd: true,
    isWinner: false,
  };
}

export const BRACKET_ROUNDS: { stage: string; label: string; ids: number[] }[] =
  [
    {
      stage: "r16",
      label: "Round of 32",
      ids: [...BRACKET_LEFT_R32, ...BRACKET_RIGHT_R32],
    },
    { stage: "r8", label: "Round of 16", ids: [89, 90, 91, 92, 93, 94, 95, 96] },
    { stage: "qf", label: "Quarter-finals", ids: [97, 98, 99, 100] },
    { stage: "sf", label: "Semi-finals", ids: [101, 102] },
    { stage: "bronze", label: "Bronze", ids: [103] },
    { stage: "final", label: "Final", ids: [104] },
  ];

function norm(t: string): string {
  return toEnglishTeam(t.trim());
}

function resolveTeamName(
  raw: string,
  resolved: Map<number, ResolvedMatch>,
): string {
  const ref = parseSlotRef(raw);
  if (!ref) return norm(raw);
  const team =
    ref.kind === "winner"
      ? winnerOf(resolved, ref.matchId)
      : loserOf(resolved, ref.matchId);
  return team ? norm(team) : raw;
}

function winnerOf(
  resolved: Map<number, ResolvedMatch>,
  matchId: number,
): string | null {
  return resolved.get(matchId)?.winner ?? null;
}

function loserOf(
  resolved: Map<number, ResolvedMatch>,
  matchId: number,
): string | null {
  return resolved.get(matchId)?.loser ?? null;
}

function isResolvedTeam(name: string): boolean {
  return !parseSlotRef(name) && !name.startsWith("Winner") && !name.startsWith("Loser");
}

export function resolveKnockoutBracket(
  matches: MatchView[],
): Map<number, ResolvedMatch> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const resolved = new Map<number, ResolvedMatch>();
  const sorted = [...matches].sort((a, b) => a.id - b.id);

  for (let pass = 0; pass < 4; pass++) {
    for (const m of sorted) {
      const raw = byId.get(m.id)!;
      const homeTeam = resolveTeamName(raw.homeTeam, resolved);
      const awayTeam = resolveTeamName(raw.awayTeam, resolved);

      let winner: string | null = null;
      let loser: string | null = null;
      if (
        m.finished &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        isResolvedTeam(homeTeam) &&
        isResolvedTeam(awayTeam)
      ) {
        if (m.homeScore > m.awayScore) {
          winner = homeTeam;
          loser = awayTeam;
        } else if (m.awayScore > m.homeScore) {
          winner = awayTeam;
          loser = homeTeam;
        } else if (raw.winnerTeam) {
          const w = norm(raw.winnerTeam);
          if (w === norm(homeTeam)) {
            winner = homeTeam;
            loser = awayTeam;
          } else if (w === norm(awayTeam)) {
            winner = awayTeam;
            loser = homeTeam;
          }
        }
      }

      resolved.set(m.id, {
        id: m.id,
        matchNumber: m.matchNumber,
        stage: m.stage,
        kickoffAt: m.kickoffAt,
        homeTeam,
        awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        finished: m.finished,
        winner,
        loser,
      });
    }
  }

  return resolved;
}

export function getEliminatedTeams(
  resolved: Map<number, ResolvedMatch>,
): Set<string> {
  const eliminated = new Set<string>();
  for (const m of resolved.values()) {
    if (m.finished && m.loser) {
      eliminated.add(norm(m.loser));
    }
  }
  return eliminated;
}

function assignFour(
  teams: string[],
): Pick<
  KnockoutPickData,
  "sf1Home" | "sf1Away" | "sf2Home" | "sf2Away"
> {
  return {
    sf1Home: teams[0] ?? null,
    sf1Away: teams[1] ?? null,
    sf2Home: teams[2] ?? null,
    sf2Away: teams[3] ?? null,
  };
}

function assignTwo(
  teams: string[],
): Pick<KnockoutPickData, "finalHome" | "finalAway"> {
  return {
    finalHome: teams[0] ?? null,
    finalAway: teams[1] ?? null,
  };
}

/** Build official answer from bracket — teams are a set per stage, not tied to pairings. */
export function deriveKnockoutAnswerFromMatches(
  resolved: Map<number, ResolvedMatch>,
): KnockoutPickData {
  const answer: KnockoutPickData = {
    sf1Home: null,
    sf1Away: null,
    sf2Home: null,
    sf2Away: null,
    finalHome: null,
    finalAway: null,
    bronzeHome: null,
    bronzeAway: null,
    champion: null,
  };

  const semiTeams = [97, 98, 99, 100]
    .map((id) => resolved.get(id)?.winner)
    .filter((t): t is string => !!t);
  Object.assign(answer, assignFour(semiTeams));

  const finalTeams = [101, 102]
    .map((id) => resolved.get(id)?.winner)
    .filter((t): t is string => !!t);
  Object.assign(answer, assignTwo(finalTeams));

  const bronze = resolved.get(103);
  if (bronze?.finished) {
    answer.bronzeHome = bronze.homeTeam;
    answer.bronzeAway = bronze.awayTeam;
  } else {
    const semiLosers = [101, 102]
      .map((id) => resolved.get(id)?.loser)
      .filter((t): t is string => !!t);
    Object.assign(answer, {
      bronzeHome: semiLosers[0] ?? null,
      bronzeAway: semiLosers[1] ?? null,
    });
  }

  const fin = resolved.get(104);
  if (fin?.finished && fin.winner) {
    answer.finalHome = fin.homeTeam;
    answer.finalAway = fin.awayTeam;
    answer.champion = fin.winner;
  }

  return answer;
}

export function mergeKnockoutAnswers(
  manual: KnockoutPickData | null,
  derived: KnockoutPickData,
): KnockoutPickData {
  if (!manual) return derived;
  const pick = (d: string | null, m: string | null) => m || d;
  return {
    sf1Home: pick(derived.sf1Home, manual.sf1Home),
    sf1Away: pick(derived.sf1Away, manual.sf1Away),
    sf2Home: pick(derived.sf2Home, manual.sf2Home),
    sf2Away: pick(derived.sf2Away, manual.sf2Away),
    finalHome: pick(derived.finalHome, manual.finalHome),
    finalAway: pick(derived.finalAway, manual.finalAway),
    bronzeHome: pick(derived.bronzeHome, manual.bronzeHome),
    bronzeAway: pick(derived.bronzeAway, manual.bronzeAway),
    champion: pick(derived.champion, manual.champion),
  };
}
