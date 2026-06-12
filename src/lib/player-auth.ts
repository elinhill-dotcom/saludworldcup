import { predictionsLockedByTime } from "@/lib/config";
import { verifyPassword } from "@/lib/player-password";
import { arePredictionsLocked } from "@/lib/predictions-lock";
import type { PlayerRow } from "@/lib/supabase-types";
import { getSupabaseServer, toErrorMessage, type DbResult } from "@/lib/supabase";

export async function canReadPlayerData(
  playerId: string,
  password: string | null,
): Promise<DbResult<boolean>> {
  const deadlinePassed = predictionsLockedByTime();
  const picksLocked = await arePredictionsLocked(playerId);

  if (deadlinePassed && picksLocked) {
    return { data: true, error: null };
  }

  if (!password) {
    return { data: false, error: null };
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("players")
      .select("password_hash")
      .eq("id", playerId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: false, error: null };

    const row = data as Pick<PlayerRow, "password_hash">;
    if (!row.password_hash) {
      return { data: false, error: null };
    }

    return {
      data: verifyPassword(password, row.password_hash),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

/** Same rules as read — must be logged in as that player to save before lock. */
export async function canWritePlayerData(
  playerId: string,
  password: string | null,
): Promise<DbResult<boolean>> {
  if (await arePredictionsLocked(playerId)) {
    return { data: false, error: null };
  }
  return canReadPlayerData(playerId, password);
}
