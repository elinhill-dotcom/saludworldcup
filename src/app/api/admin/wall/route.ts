import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteWallComment } from "@/lib/supabase-wall";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  const res = await deleteWallComment(commentId);
  if (res.error) {
    return NextResponse.json(
      { error: res.error },
      { status: res.error.includes("not found") ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
