import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword, requireAdmin } from "@/lib/admin-auth";
import { verifyAdminPassword, predictionsLockedByTime } from "@/lib/config";
import { fetchMatchPoolStats } from "@/lib/match-pool-stats";
import { isMatchLive } from "@/lib/match-live";
import { fetchMatchById } from "@/lib/supabase-matches";
import { insertChatMessage, loadChatMessages } from "@/lib/supabase-chat";
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
  const adminTestMode = verifyAdminPassword(getAdminPassword(req));
  const live = adminTestMode || isMatchLive(match.kickoffAt);

  let poolInsight = null;
  if (predictionsLockedByTime()) {
    const insightRes = await fetchMatchPoolStats(matchId);
    if (insightRes.data && insightRes.data.pickCount > 0) {
      poolInsight = insightRes.data;
    }
  }

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
    live,
    adminTestMode,
    poolInsight,
    messages: msgRes.data ?? [],
  });
}

/** Admin test mode: send with x-admin-password when chat window is closed. */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = requireAdmin(req);
  if (auth) return auth;

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

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const res = await insertChatMessage(matchId, body.name, body.message, {
    skipLiveCheck: true,
  });
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Could not send" },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: res.data });
}
