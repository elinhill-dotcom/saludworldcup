import { KNOCKOUT_PICK_COUNT } from "@/lib/knockout-picks";
import { buildMatchPoolStats } from "@/lib/match-pool-stats";
import { computeLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import { getOutcome } from "@/lib/scoring";
import {
  mapKnockoutPick,
  mapMatch,
  mapPrediction,
} from "@/lib/supabase-mappers";
import type {
  KnockoutPickRow,
  MatchRow,
  PredictionRow,
} from "@/lib/supabase-types";
import { fetchAllPaginated, getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";

export type ScoreDistribution = {
  score: string;
  count: number;
  pct: number;
};

export type MatchPoolStats = {
  matchId: number;
  matchNumber: number | null;
  dayLabel: string;
  groupCode: string | null;
  homeTeam: string;
  awayTeam: string;
  pickCount: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  topScores: ScoreDistribution[];
};

export type TeamPoolStats = {
  team: string;
  groupCode: string;
  matchCount: number;
  avgPredictedPoints: number;
  winPct: number;
  drawPct: number;
  lossPct: number;
};

export type KnockoutTeamStat = {
  team: string;
  count: number;
  pct: number;
};

export type KnockoutPoolStats = {
  pickCount: number;
  champion: KnockoutTeamStat[];
  semifinalists: KnockoutTeamStat[];
  finalists: KnockoutTeamStat[];
};

export type PlayerPoolStats = LeaderboardEntry & {
  knockoutComplete: boolean;
  championPick: string | null;
  scoredMatches: number;
  missedMatches: number;
};

export type PoolStatsPayload = {
  locked: boolean;
  playerCount: number;
  totalPredictions: number;
  teams: TeamPoolStats[];
  matches: MatchPoolStats[];
  knockout: KnockoutPoolStats;
  players: PlayerPoolStats[];
};

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function teamPointsFromPrediction(
  team: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
): number {
  const outcome = getOutcome(homeScore, awayScore);
  if (team === homeTeam) {
    if (outcome === "home") return 3;
    if (outcome === "draw") return 1;
    return 0;
  }
  if (team === awayTeam) {
    if (outcome === "away") return 3;
    if (outcome === "draw") return 1;
    return 0;
  }
  return 0;
}

function aggregateKnockoutTeams(
  picks: ReturnType<typeof mapKnockoutPick>[],
  selector: (p: ReturnType<typeof mapKnockoutPick>) => string[],
): KnockoutTeamStat[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const pick of picks) {
    const teams = selector(pick).filter(Boolean);
    if (teams.length === 0) continue;
    total += 1;
    for (const team of teams) {
      counts.set(team, (counts.get(team) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([team, count]) => ({
      team,
      count,
      pct: pct(count, total),
    }))
    .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "en"));
}

export async function computePoolStats(): Promise<DbResult<PoolStatsPayload>> {
  try {
    const supabase = getSupabaseServer();

    const [matchesRes, predsRes, koPicksRes, leaderboardRes] = await Promise.all([
      supabase
        .from("matches")
        .select("*")
        .eq("stage", "group")
        .order("kickoff_at", { ascending: true }),
      fetchAllPaginated<PredictionRow>((from, to) =>
        supabase.from("predictions").select("*").range(from, to),
      ),
      supabase.from("knockout_picks").select("*"),
      computeLeaderboard(),
    ]);

    if (matchesRes.error) return { data: null, error: matchesRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error };
    if (koPicksRes.error) return { data: null, error: koPicksRes.error.message };
    if (leaderboardRes.error || !leaderboardRes.data) {
      return { data: null, error: leaderboardRes.error ?? "Leaderboard failed" };
    }

    const matches = (matchesRes.data as MatchRow[]).map(mapMatch);
    const matchMap = new Map(matches.map((m) => [m.id, m]));

    const predsByMatch = new Map<number, ReturnType<typeof mapPrediction>[]>();
    for (const row of (predsRes.data ?? []) as PredictionRow[]) {
      const p = mapPrediction(row);
      if (!matchMap.has(p.matchId)) continue;
      const list = predsByMatch.get(p.matchId) ?? [];
      list.push(p);
      predsByMatch.set(p.matchId, list);
    }

    const matchStats: MatchPoolStats[] = matches.map((m) =>
      buildMatchPoolStats(m, predsByMatch.get(m.id) ?? []),
    );

    const teamMatches = new Map<
      string,
      { groupCode: string; matches: typeof matches }
    >();
    for (const m of matches) {
      for (const team of [m.homeTeam, m.awayTeam]) {
        const entry = teamMatches.get(team) ?? {
          groupCode: m.groupCode ?? "?",
          matches: [],
        };
        entry.matches.push(m);
        teamMatches.set(team, entry);
      }
    }

    const teamStats: TeamPoolStats[] = [...teamMatches.entries()]
      .map(([team, { groupCode, matches: teamMs }]) => {
        const pointsByPlayer = new Map<string, number>();
        const outcomeCounts = { win: 0, draw: 0, loss: 0, total: 0 };

        for (const m of teamMs) {
          for (const p of predsByMatch.get(m.id) ?? []) {
            const pts = teamPointsFromPrediction(
              team,
              m.homeTeam,
              m.awayTeam,
              p.homeScore,
              p.awayScore,
            );
            pointsByPlayer.set(
              p.playerId,
              (pointsByPlayer.get(p.playerId) ?? 0) + pts,
            );
            outcomeCounts.total += 1;
            if (pts === 3) outcomeCounts.win += 1;
            else if (pts === 1) outcomeCounts.draw += 1;
            else outcomeCounts.loss += 1;
          }
        }

        const playerTotals = [...pointsByPlayer.values()];
        const avgPredictedPoints = playerTotals.length
          ? Math.round(
              (playerTotals.reduce((a, b) => a + b, 0) / playerTotals.length) *
                100,
            ) / 100
          : 0;

        return {
          team,
          groupCode,
          matchCount: teamMs.length,
          avgPredictedPoints,
          winPct: pct(outcomeCounts.win, outcomeCounts.total),
          drawPct: pct(outcomeCounts.draw, outcomeCounts.total),
          lossPct: pct(outcomeCounts.loss, outcomeCounts.total),
        };
      })
      .sort(
        (a, b) =>
          b.avgPredictedPoints - a.avgPredictedPoints ||
          a.team.localeCompare(b.team, "en"),
      );

    const koPicksRaw = koPicksRes.data as KnockoutPickRow[];
    const koPicks = koPicksRaw.map(mapKnockoutPick);
    const koByPlayer = new Map(
      koPicksRaw.map((row) => [row.player_id, mapKnockoutPick(row)]),
    );
    const completeKoPicks = koPicks.filter(
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

    const knockout: KnockoutPoolStats = {
      pickCount: completeKoPicks.length,
      champion: aggregateKnockoutTeams(completeKoPicks, (p) => [p.champion]),
      semifinalists: aggregateKnockoutTeams(completeKoPicks, (p) => [
        p.sf1Home,
        p.sf1Away,
        p.sf2Home,
        p.sf2Away,
      ]),
      finalists: aggregateKnockoutTeams(completeKoPicks, (p) => [
        p.finalHome,
        p.finalAway,
      ]),
    };

    const finishedCount = matches.filter((m) => m.finished).length;

    const players: PlayerPoolStats[] = leaderboardRes.data.map((entry) => {
      const ko = koByPlayer.get(entry.playerId);
      const knockoutComplete = ko
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
          ].filter(Boolean).length === KNOCKOUT_PICK_COUNT
        : false;

      return {
        ...entry,
        knockoutComplete,
        championPick: ko?.champion ?? null,
        scoredMatches: entry.exactHits + entry.outcomeHits,
        missedMatches: Math.max(
          0,
          finishedCount - entry.exactHits - entry.outcomeHits,
        ),
      };
    });

    return {
      data: {
        locked: false,
        playerCount: players.length,
        totalPredictions: predsRes.data?.length ?? 0,
        teams: teamStats,
        matches: matchStats,
        knockout,
        players,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
