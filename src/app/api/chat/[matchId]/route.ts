import { NextRequest, NextResponse } from "next/server";
import { isMatchLive } from "@/lib/match-live";
import { fetchMatchById } from "@/lib/supabase-matches";
import { loadChatMessages } from "@/lib/supabase-chat";
import { isSupabaseConfigured } from "@/lib/supabase";

type RouteCtx = { params: Promise<{ matchId: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { matchId: raw } = await ctx.params;
  const matchId = Number(raw);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "Invalid match" }, { status: 400 });
  }

  const matchRes = await fetchMatchById(matchId);
  if (matchRes.error) {
    return NextResponse.json({ error: matchRes.error }, { status: 500 });
  }
  if (!matchRes.data) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const since = req.nextUrl.searchParams.get("since") ?? undefined;
  const msgRes = await loadChatMessages(matchId, since);
  if (msgRes.error) {
    return NextResponse.json({ error: msgRes.error }, { status: 500 });
  }

  const match = matchRes.data;
  return NextResponse.json({
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoffAt: match.kickoffAt,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      finished: match.finished,
      groupCode: match.groupCode,
      stage: match.stage,
    },
    live: isMatchLive(match.kickoffAt),
    messages: msgRes.data ?? [],
  });
}

/** POST kept for clients that cannot use browser Supabase; prefer client insert + realtime. */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  return NextResponse.json(
    {
      error:
        "Send messages from the browser via Supabase client (realtime).",
    },
    { status: 410 },
  );
}
