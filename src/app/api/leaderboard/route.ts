import { NextResponse } from "next/server";
import { getLeaderboardPayload } from "@/lib/leaderboard";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const res = await getLeaderboardPayload();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load leaderboard" },
      { status: 500 },
    );
  }

  return NextResponse.json(res.data);
}
