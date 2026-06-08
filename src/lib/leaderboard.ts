import { JAR_CONTRIBUTION_EUR, GROUP_MATCH_IDS } from "@/lib/matches-data";
import { countKnockoutFilled, KNOCKOUT_PICK_COUNT } from "@/lib/knockout-picks";
import { scoreKnockoutPick } from "@/lib/knockout-scoring";
import { pointsForPrediction } from "@/lib/scoring";
import {
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapMatch,
  mapPrediction,
} from "@/lib/supabase-mappers";
import type {
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
} from "@/lib/supabase-types";
import { getSupabaseBrowser, getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  points: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  groupPicksCount: number;
  picksReady: boolean;
};

function client(browser: boolean) {
  return browser ? getSupabaseBrowser() : getSupabaseServer();
}

export async function computeLeaderboard(
  browser = false,
): Promise<DbResult<LeaderboardEntry[]>> {
  try {
    const supabase = client(browser);

    const [playersRes, predsRes, koPicksRes, koAnswerRes, matchesRes] =
      await Promise.all([
        supabase.from("players").select("*").order("name", { ascending: true }),
        supabase.from("predictions").select("*"),
        supabase.from("knockout_picks").select("*"),
        supabase.from("knockout_answer").select("*").eq("id", 1).maybeSingle(),
        supabase.from("matches").select("*"),
      ]);

    if (playersRes.error) return { data: null, error: playersRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error.message };
    if (koPicksRes.error) return { data: null, error: koPicksRes.error.message };
    if (matchesRes.error) return { data: null, error: matchesRes.error.message };

    const matchMap = new Map(
      (matchesRes.data as MatchRow[]).map((m) => [m.id, mapMatch(m)]),
    );

    const predsByPlayer = new Map<string, ReturnType<typeof mapPrediction>[]>();
    for (const row of predsRes.data as PredictionRow[]) {
      const p = mapPrediction(row);
      const list = predsByPlayer.get(p.playerId) ?? [];
      list.push(p);
      predsByPlayer.set(p.playerId, list);
    }

    const koByPlayer = new Map<string, ReturnType<typeof mapKnockoutPick>>();
    for (const row of koPicksRes.data as KnockoutPickRow[]) {
      koByPlayer.set(row.player_id, mapKnockoutPick(row));
    }

    const answerRow = koAnswerRes.data as KnockoutAnswerRow | null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const answer =
      mappedAnswer?.set && mappedAnswer.champion ? mappedAnswer : null;

    const groupMatchIds = new Set(GROUP_MATCH_IDS);

    const entries: LeaderboardEntry[] = (playersRes.data as PlayerRow[]).map(
      (row) => {
        let groupPoints = 0;
        let exactHits = 0;
        let outcomeHits = 0;
        let groupPicksCount = 0;

        for (const pred of predsByPlayer.get(row.id) ?? []) {
          const m = matchMap.get(pred.matchId);
          if (!m || m.stage !== "group") continue;
          if (!groupMatchIds.has(pred.matchId)) continue;
          groupPicksCount += 1;
          if (!m.finished || m.homeScore === null || m.awayScore === null) {
            continue;
          }
          const pts = pointsForPrediction(
            pred.homeScore,
            pred.awayScore,
            m.homeScore,
            m.awayScore,
          );
          groupPoints += pts;
          if (pts === 3) exactHits += 1;
          else if (pts === 1) outcomeHits += 1;
        }

        let knockoutPoints = 0;
        const ko = koByPlayer.get(row.id);
        const knockoutFilled = ko ? countKnockoutFilled(ko) : 0;
        if (answer && ko) {
          knockoutPoints = scoreKnockoutPick(ko, answer);
        }

        const picksReady =
          groupPicksCount >= GROUP_MATCH_IDS.length &&
          knockoutFilled >= KNOCKOUT_PICK_COUNT;

        return {
          playerId: row.id,
          name: row.name,
          points: groupPoints + knockoutPoints,
          groupPoints,
          knockoutPoints,
          exactHits,
          outcomeHits,
          groupPicksCount,
          picksReady,
        };
      },
    );

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return a.name.localeCompare(b.name, "en");
    });

    return { data: entries, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function getLeaderboardPayload(browser = false): Promise<
  DbResult<{
    entries: LeaderboardEntry[];
    playerCount: number;
    jarTotalEur: number;
    jarContributionEur: number;
  }>
> {
  const res = await computeLeaderboard(browser);
  if (res.error || !res.data) return { data: null, error: res.error ?? "Failed" };
  const playerCount = res.data.length;
  return {
    data: {
      entries: res.data,
      playerCount,
      jarTotalEur: playerCount * JAR_CONTRIBUTION_EUR,
      jarContributionEur: JAR_CONTRIBUTION_EUR,
    },
    error: null,
  };
}
