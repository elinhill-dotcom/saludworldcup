import { NextRequest, NextResponse } from "next/server";
import { canReadPlayerData } from "@/lib/player-auth";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import { fetchPlayerProgress } from "@/lib/supabase-players";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const password = req.headers.get("x-player-password");
  const access = await canReadPlayerData(playerId, password);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: 500 });
  }
  if (!access.data) {
    return NextResponse.json(
      { error: "Progress is hidden until 11 June at 20:00 — log in to see your own." },
      { status: 403 },
    );
  }

  const res = await fetchPlayerProgress(playerId);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load progress" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ...res.data,
    groupTotal: GROUP_MATCH_IDS.length,
  });
}
