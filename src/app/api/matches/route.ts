import { NextRequest, NextResponse } from "next/server";
import { fetchMatches } from "@/lib/supabase-matches";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const stage = req.nextUrl.searchParams.get("stage") ?? undefined;
  const res = await fetchMatches(stage ? { stage } : undefined);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load matches" },
      { status: 500 },
    );
  }

  return NextResponse.json({ matches: res.data });
}
