import { isMatchLive } from "@/lib/match-live";
import { mapMatch } from "@/lib/supabase-mappers";
import type { MatchRow } from "@/lib/supabase-types";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";

function client(browser: boolean) {
  return browser ? getSupabaseBrowser() : getSupabaseServer();
}

export async function fetchMatches(
  opts?: { stage?: string },
  browser = false,
): Promise<DbResult<ReturnType<typeof mapMatch>[]>> {
  try {
    const supabase = client(browser);
    let q = supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true })
      .order("id", { ascending: true });

    if (opts?.stage) {
      q = q.eq("stage", opts.stage);
    }

    const { data, error } = await q;
    if (error) return { data: null, error: error.message };
    return {
      data: (data as MatchRow[]).map(mapMatch),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchMatchById(
  matchId: number,
  browser = false,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const supabase = client(browser);
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: "Match not found" };
    return { data: mapMatch(data as MatchRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchLiveMatches(
  browser = false,
): Promise<DbResult<ReturnType<typeof mapMatch>[]>> {
  const res = await fetchMatches(undefined, browser);
  if (res.error || !res.data) return res;
  return {
    data: res.data.filter((m) => isMatchLive(m.kickoffAt)),
    error: null,
  };
}

export async function updateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  finished = true,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        finished,
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapMatch(data as MatchRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function resetMatchResult(
  matchId: number,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("matches")
      .update({
        home_score: null,
        away_score: null,
        finished: false,
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapMatch(data as MatchRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
