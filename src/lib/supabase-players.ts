import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import { mapPlayer } from "@/lib/supabase-mappers";
import type { PlayerRow } from "@/lib/supabase-types";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";

function client(browser: boolean) {
  return browser ? getSupabaseBrowser() : getSupabaseServer();
}

export async function findOrCreatePlayerByName(
  name: string,
  browser = false,
): Promise<DbResult<ReturnType<typeof mapPlayer>>> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { data: null, error: "Enter a name (2–80 characters)." };
  }

  try {
    const supabase = client(browser);

    const { data: existing, error: findErr } = await supabase
      .from("players")
      .select("*")
      .eq("name", trimmed)
      .maybeSingle();

    if (findErr) return { data: null, error: findErr.message };
    if (existing) {
      return { data: mapPlayer(existing as PlayerRow), error: null };
    }

    const { data: created, error: insErr } = await supabase
      .from("players")
      .insert({ name: trimmed })
      .select()
      .single();

    if (insErr) return { data: null, error: insErr.message };
    return { data: mapPlayer(created as PlayerRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function findPlayerById(
  playerId: string,
): Promise<DbResult<ReturnType<typeof mapPlayer> | null>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    return { data: mapPlayer(data as PlayerRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function isPlayerNameTaken(
  name: string,
  excludePlayerId?: string,
): Promise<DbResult<boolean>> {
  try {
    const supabase = getSupabaseServer();
    let q = supabase.from("players").select("id").eq("name", name.trim());
    if (excludePlayerId) {
      q = q.neq("id", excludePlayerId);
    }
    const { data, error } = await q.maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: !!data, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchAdminPlayers(): Promise<
  DbResult<
    {
      id: string;
      name: string;
      createdAt: string;
      groupPicksCount: number;
      hasKnockoutPick: boolean;
    }[]
  >
> {
  try {
    const supabase = getSupabaseServer();
    const [playersRes, predsRes, koRes] = await Promise.all([
      supabase.from("players").select("*").order("created_at", { ascending: false }),
      supabase.from("predictions").select("player_id, match_id"),
      supabase.from("knockout_picks").select("player_id"),
    ]);

    if (playersRes.error) return { data: null, error: playersRes.error.message };
    if (predsRes.error) return { data: null, error: predsRes.error.message };
    if (koRes.error) return { data: null, error: koRes.error.message };

    const groupIds = new Set(GROUP_MATCH_IDS);
    const groupCount = new Map<string, number>();
    for (const p of predsRes.data ?? []) {
      if (!groupIds.has(p.match_id)) continue;
      groupCount.set(p.player_id, (groupCount.get(p.player_id) ?? 0) + 1);
    }
    const hasKo = new Set((koRes.data ?? []).map((k) => k.player_id));

    const players = (playersRes.data as PlayerRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      groupPicksCount: groupCount.get(row.id) ?? 0,
      hasKnockoutPick: hasKo.has(row.id),
    }));

    return { data: players, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchPlayers(): Promise<
  DbResult<ReturnType<typeof mapPlayer>[]>
> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: null, error: error.message };
    return {
      data: (data as PlayerRow[]).map(mapPlayer),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function renamePlayer(
  playerId: string,
  name: string,
): Promise<DbResult<ReturnType<typeof mapPlayer>>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .update({ name: name.trim() })
      .eq("id", playerId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapPlayer(data as PlayerRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function deletePlayer(playerId: string): Promise<DbResult<true>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchPlayerProgress(playerId: string): Promise<
  DbResult<{
    groupPicksCount: number;
    groupTotal: number;
    knockoutFilled: number;
    knockoutTotal: number;
  }>
> {
  try {
    const supabase = getSupabaseServer();
    const [predRes, koRes, matchRes] = await Promise.all([
      supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("player_id", playerId)
        .in("match_id", [...GROUP_MATCH_IDS]),
      supabase
        .from("knockout_picks")
        .select("*")
        .eq("player_id", playerId)
        .maybeSingle(),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("stage", "group"),
    ]);

    if (predRes.error) return { data: null, error: predRes.error.message };
    if (matchRes.error) return { data: null, error: matchRes.error.message };

    let knockoutFilled = 0;
    if (koRes.data) {
      const k = koRes.data;
      const fields = [
        k.sf1_home,
        k.sf1_away,
        k.sf2_home,
        k.sf2_away,
        k.final_home,
        k.final_away,
        k.bronze_home,
        k.bronze_away,
        k.champion,
      ];
      knockoutFilled = fields.filter(Boolean).length;
    }

    return {
      data: {
        groupPicksCount: predRes.count ?? 0,
        groupTotal: matchRes.count ?? 72,
        knockoutFilled,
        knockoutTotal: 9,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
