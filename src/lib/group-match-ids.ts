import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Group-stage match IDs from the database (source of truth). Falls back to seed data if empty. */
export async function fetchGroupMatchIds(
  supabase: SupabaseClient,
): Promise<{ ids: number[]; error: string | null }> {
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("stage", "group")
    .order("id", { ascending: true });

  if (error) return { ids: [], error: error.message };
  if (!data?.length) {
    return { ids: [...GROUP_MATCH_IDS], error: null };
  }
  return { ids: data.map((row) => row.id as number), error: null };
}
