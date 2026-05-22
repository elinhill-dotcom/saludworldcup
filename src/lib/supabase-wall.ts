import { mapWallComment } from "@/lib/supabase-mappers";
import type { WallCommentRow } from "@/lib/supabase-types";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";

export type WallComment = ReturnType<typeof mapWallComment>;

export async function fetchWallComments(
  browser = false,
): Promise<DbResult<WallComment[]>> {
  try {
    const supabase = browser ? getSupabaseBrowser() : getSupabaseServer();
    const { data, error } = await supabase
      .from("wall_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return { data: null, error: error.message };
    return {
      data: (data as WallCommentRow[]).map(mapWallComment),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function createWallComment(
  name: string,
  message: string,
  browser = false,
): Promise<DbResult<WallComment>> {
  try {
    const supabase = browser ? getSupabaseBrowser() : getSupabaseServer();
    const { data, error } = await supabase
      .from("wall_comments")
      .insert({ name: name.trim(), message: message.trim() })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapWallComment(data as WallCommentRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function deleteWallComment(
  commentId: string,
): Promise<DbResult<true>> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("wall_comments")
      .delete()
      .eq("id", commentId);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
