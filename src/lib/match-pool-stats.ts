import type { MatchView } from "@/components/MatchCard";
import { getOutcome } from "@/lib/scoring";
import { mapMatch, mapPrediction } from "@/lib/supabase-mappers";
import type { MatchRow, PredictionRow } from "@/lib/supabase-types";
import {
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";
import type { MatchPoolStats, ScoreDistribution } from "@/lib/pool-stats";

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export function buildMatchPoolStats(
  match: MatchView,
  preds: ReturnType<typeof mapPrediction>[],
): MatchPoolStats {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let homeSum = 0;
  let awaySum = 0;
  const scoreCounts = new Map<string, number>();

  for (const p of preds) {
    const outcome = getOutcome(p.homeScore, p.awayScore);
    if (outcome === "home") homeWins += 1;
    else if (outcome === "draw") draws += 1;
    else awayWins += 1;
    homeSum += p.homeScore;
    awaySum += p.awayScore;
    const label = `${p.homeScore}–${p.awayScore}`;
    scoreCounts.set(label, (scoreCounts.get(label) ?? 0) + 1);
  }

  const total = preds.length;
  const topScores: ScoreDistribution[] = [...scoreCounts.entries()]
    .map(([score, count]) => ({ score, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count || a.score.localeCompare(b.score))
    .slice(0, 5);

  return {
    matchId: match.id,
    matchNumber: match.matchNumber,
    dayLabel: match.dayLabel,
    groupCode: match.groupCode,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    pickCount: total,
    homeWinPct: pct(homeWins, total),
    drawPct: pct(draws, total),
    awayWinPct: pct(awayWins, total),
    avgHomeGoals: total ? Math.round((homeSum / total) * 100) / 100 : 0,
    avgAwayGoals: total ? Math.round((awaySum / total) * 100) / 100 : 0,
    topScores,
  };
}

export async function fetchMatchPoolStats(
  matchId: number,
): Promise<DbResult<MatchPoolStats | null>> {
  try {
    const supabase = getSupabaseServer();
    const [matchRes, predsRes] = await Promise.all([
      supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
      supabase.from("predictions").select("*").eq("match_id", matchId),
    ]);

    if (matchRes.error) return { data: null, error: matchRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error.message };
    if (!matchRes.data) return { data: null, error: null };

    const match = mapMatch(matchRes.data as MatchRow);
    const preds = (predsRes.data as PredictionRow[]).map(mapPrediction);

    return { data: buildMatchPoolStats(match, preds), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchMatchPoolStatsMap(): Promise<
  DbResult<Map<number, MatchPoolStats>>
> {
  try {
    const supabase = getSupabaseServer();
    const [matchesRes, predsRes] = await Promise.all([
      supabase
        .from("matches")
        .select("*")
        .eq("stage", "group")
        .order("kickoff_at", { ascending: true }),
      supabase.from("predictions").select("*"),
    ]);

    if (matchesRes.error) return { data: null, error: matchesRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error.message };

    const matches = (matchesRes.data as MatchRow[]).map(mapMatch);
    const matchIds = new Set(matches.map((m) => m.id));

    const predsByMatch = new Map<number, ReturnType<typeof mapPrediction>[]>();
    for (const row of predsRes.data as PredictionRow[]) {
      const p = mapPrediction(row);
      if (!matchIds.has(p.matchId)) continue;
      const list = predsByMatch.get(p.matchId) ?? [];
      list.push(p);
      predsByMatch.set(p.matchId, list);
    }

    const map = new Map<number, MatchPoolStats>();
    for (const m of matches) {
      map.set(m.id, buildMatchPoolStats(m, predsByMatch.get(m.id) ?? []));
    }

    return { data: map, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
