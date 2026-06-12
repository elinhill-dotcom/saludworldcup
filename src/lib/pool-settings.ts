import { getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";

export type PoolSettingsRow = {
  id: number;
  picks_unlock_override: boolean;
};

export async function getPicksUnlockOverride(): Promise<DbResult<boolean>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("pool_settings")
      .select("picks_unlock_override")
      .eq("id", 1)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    const row = data as Pick<PoolSettingsRow, "picks_unlock_override"> | null;
    return { data: row?.picks_unlock_override ?? false, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function setPicksUnlockOverride(
  enabled: boolean,
): Promise<DbResult<boolean>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("pool_settings").upsert(
      { id: 1, picks_unlock_override: enabled },
      { onConflict: "id" },
    );

    if (error) return { data: null, error: error.message };
    return { data: enabled, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function getPlayerPicksUnlockOverride(
  playerId: string,
): Promise<DbResult<boolean>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("picks_unlock_override")
      .eq("id", playerId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: false, error: null };
    return {
      data: !!(data as { picks_unlock_override?: boolean }).picks_unlock_override,
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function setPlayerPicksUnlockOverride(
  playerId: string,
  enabled: boolean,
): Promise<DbResult<boolean>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("players")
      .update({ picks_unlock_override: enabled })
      .eq("id", playerId);

    if (error) return { data: null, error: error.message };
    return { data: enabled, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
