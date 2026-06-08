import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import { countKnockoutFilled } from "@/lib/knockout-picks";
import { mapKnockoutPick, mapPlayer } from "@/lib/supabase-mappers";
import type { KnockoutPickRow, PlayerRow } from "@/lib/supabase-types";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/player-password";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";

function client(browser: boolean) {
  return browser ? getSupabaseBrowser() : getSupabaseServer();
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return "Enter a name (2–80 characters).";
  }
  return null;
}

export async function lookupPlayerByName(
  name: string,
): Promise<DbResult<{ exists: boolean; hasPassword: boolean }>> {
  const nameErr = validateName(name);
  if (nameErr) {
    return { data: { exists: false, hasPassword: false }, error: null };
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("password_hash")
      .ilike("name", name.trim())
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: { exists: false, hasPassword: false }, error: null };
    return {
      data: { exists: true, hasPassword: !!data.password_hash },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function authenticatePlayer(
  name: string,
  password: string,
): Promise<
  DbResult<ReturnType<typeof mapPlayer>> & { status?: number }
> {
  const nameErr = validateName(name);
  if (nameErr) return { data: null, error: nameErr, status: 400 };

  const passwordErr = validatePassword(password);
  if (passwordErr) return { data: null, error: passwordErr, status: 400 };

  const trimmed = name.trim();

  try {
    const supabase = getSupabaseServer();
    const { data: existing, error: findErr } = await supabase
      .from("players")
      .select("*")
      .ilike("name", trimmed)
      .maybeSingle();

    if (findErr) return { data: null, error: findErr.message, status: 500 };

    if (!existing) {
      const { data: created, error: insErr } = await supabase
        .from("players")
        .insert({
          name: trimmed,
          password_hash: hashPassword(password),
        })
        .select()
        .single();

      if (insErr) return { data: null, error: insErr.message, status: 500 };
      return { data: mapPlayer(created as PlayerRow), error: null };
    }

    const row = existing as PlayerRow;
    if (row.password_hash) {
      if (!verifyPassword(password, row.password_hash)) {
        return {
          data: null,
          error: "Wrong password for this name.",
          status: 401,
        };
      }
      return { data: mapPlayer(row), error: null };
    }

    const { data: updated, error: updErr } = await supabase
      .from("players")
      .update({ password_hash: hashPassword(password) })
      .eq("id", row.id)
      .select()
      .single();

    if (updErr) return { data: null, error: updErr.message, status: 500 };
    return { data: mapPlayer(updated as PlayerRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e), status: 500 };
  }
}

export async function clearPlayerPassword(
  playerId: string,
): Promise<DbResult<true>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("players")
      .update({ password_hash: null })
      .eq("id", playerId);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function verifyStoredPlayerSession(
  playerId: string,
  password: string,
): Promise<
  DbResult<{ valid: true; player: ReturnType<typeof mapPlayer> } | { valid: false }>
> {
  const passwordErr = validatePassword(password);
  if (passwordErr) {
    return { data: { valid: false }, error: null };
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) return { data: null, error: playerRes.error };
  if (!playerRes.data) return { data: { valid: false }, error: null };

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("password_hash")
      .eq("id", playerId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data?.password_hash) return { data: { valid: false }, error: null };

    if (!verifyPassword(password, data.password_hash)) {
      return { data: { valid: false }, error: null };
    }

    return { data: { valid: true, player: playerRes.data }, error: null };
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
      knockoutFilled: number;
      knockoutTotal: number;
      hasPassword: boolean;
    }[]
  >
> {
  try {
    const supabase = getSupabaseServer();
    const [playersRes, predsRes, koRes] = await Promise.all([
      supabase.from("players").select("*").order("created_at", { ascending: false }),
      supabase.from("predictions").select("player_id, match_id"),
      supabase.from("knockout_picks").select("*"),
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
    const knockoutFilled = new Map<string, number>();
    for (const koRow of koRes.data as KnockoutPickRow[]) {
      knockoutFilled.set(
        koRow.player_id,
        countKnockoutFilled(mapKnockoutPick(koRow)),
      );
    }

    const players = (playersRes.data as PlayerRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      groupPicksCount: groupCount.get(row.id) ?? 0,
      knockoutFilled: knockoutFilled.get(row.id) ?? 0,
      knockoutTotal: 9,
      hasPassword: !!row.password_hash,
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
