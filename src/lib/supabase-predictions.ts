import {
  countKnockoutFilled,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/lib/knockout-picks";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import {
  knockoutPickToRow,
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapPrediction,
} from "@/lib/supabase-mappers";
import type { KnockoutAnswerRow } from "@/lib/supabase-types";
import type { KnockoutPickRow, PredictionRow } from "@/lib/supabase-types";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";

const validGroupIds = new Set(GROUP_MATCH_IDS);

function client(browser: boolean) {
  return browser ? getSupabaseBrowser() : getSupabaseServer();
}

export async function loadGroupPredictions(
  playerId: string,
  browser = false,
): Promise<DbResult<ReturnType<typeof mapPrediction>[]>> {
  try {
    const supabase = client(browser);
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("player_id", playerId)
      .in("match_id", [...validGroupIds]);

    if (error) return { data: null, error: error.message };
    return {
      data: (data as PredictionRow[]).map(mapPrediction),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveGroupPredictions(
  playerId: string,
  items: { matchId: number; homeScore: number; awayScore: number }[],
  browser = false,
): Promise<DbResult<{ savedCount: number }>> {
  try {
    const supabase = client(browser);
    const rows = items
      .filter((item) => validGroupIds.has(item.matchId))
      .filter((item) => {
        const h = item.homeScore;
        const a = item.awayScore;
        return (
          Number.isInteger(h) &&
          Number.isInteger(a) &&
          h >= 0 &&
          a >= 0 &&
          h <= 20 &&
          a <= 20
        );
      })
      .map((item) => ({
        player_id: playerId,
        match_id: item.matchId,
        home_score: item.homeScore,
        away_score: item.awayScore,
      }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("predictions")
        .upsert(rows, { onConflict: "player_id,match_id" });

      if (error) return { data: null, error: error.message };
    }

    const { count, error: countErr } = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .eq("player_id", playerId)
      .in("match_id", [...validGroupIds]);

    if (countErr) return { data: null, error: countErr.message };
    return { data: { savedCount: count ?? 0 }, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function clearPlayerPicks(playerId: string): Promise<DbResult<true>> {
  try {
    const supabase = getSupabaseServer();
    const [p1, p2] = await Promise.all([
      supabase
        .from("predictions")
        .delete()
        .eq("player_id", playerId)
        .in("match_id", [...validGroupIds]),
      supabase.from("knockout_picks").delete().eq("player_id", playerId),
    ]);
    if (p1.error) return { data: null, error: p1.error.message };
    if (p2.error) return { data: null, error: p2.error.message };
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function loadKnockoutPick(
  playerId: string,
  browser = false,
): Promise<DbResult<KnockoutFormState | null>> {
  try {
    const supabase = client(browser);
    const { data, error } = await supabase
      .from("knockout_picks")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    return { data: mapKnockoutPick(data as KnockoutPickRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveKnockoutPick(
  playerId: string,
  form: KnockoutFormState,
  browser = false,
): Promise<DbResult<KnockoutFormState>> {
  try {
    const supabase = client(browser);
    const row = knockoutPickToRow(playerId, form);
    if (countKnockoutFilled(form) === 0) {
      const { error } = await supabase
        .from("knockout_picks")
        .delete()
        .eq("player_id", playerId);
      if (error) return { data: null, error: error.message };
      return { data: emptyKnockoutForm(), error: null };
    }

    const { data, error } = await supabase
      .from("knockout_picks")
      .upsert(row, { onConflict: "player_id" })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapKnockoutPick(data as KnockoutPickRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function loadKnockoutAnswer(): Promise<
  DbResult<ReturnType<typeof mapKnockoutAnswer> | null>
> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("knockout_answer")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    return { data: mapKnockoutAnswer(data as KnockoutAnswerRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveKnockoutAnswer(
  form: KnockoutFormState & { set?: boolean },
): Promise<DbResult<true>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("knockout_answer").upsert({
      id: 1,
      sf1_home: form.sf1Home || null,
      sf1_away: form.sf1Away || null,
      sf2_home: form.sf2Home || null,
      sf2_away: form.sf2Away || null,
      final_home: form.finalHome || null,
      final_away: form.finalAway || null,
      bronze_home: form.bronzeHome || null,
      bronze_away: form.bronzeAway || null,
      champion: form.champion || null,
      set: form.set !== false,
    });

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
