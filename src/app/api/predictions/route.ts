import { NextRequest, NextResponse } from "next/server";
import { predictionsLocked } from "@/lib/config";
import { prisma } from "@/lib/db";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";

const validGroupIds = new Set(GROUP_MATCH_IDS);

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const predictions = await prisma.prediction.findMany({
    where: { playerId, matchId: { in: [...validGroupIds] } },
  });
  return NextResponse.json({ predictions });
}

export async function POST(req: NextRequest) {
  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked — the tournament has started." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  const items = body.predictions as
    | { matchId: number; homeScore: number; awayScore: number }[]
    | undefined;

  if (!playerId || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  for (const item of items) {
    if (!validGroupIds.has(item.matchId)) continue;
    const h = Number(item.homeScore);
    const a = Number(item.awayScore);
    if (
      !Number.isInteger(h) ||
      !Number.isInteger(a) ||
      h < 0 ||
      a < 0 ||
      h > 20 ||
      a > 20
    ) {
      continue;
    }

    await prisma.prediction.upsert({
      where: {
        playerId_matchId: { playerId, matchId: item.matchId },
      },
      create: {
        playerId,
        matchId: item.matchId,
        homeScore: h,
        awayScore: a,
      },
      update: { homeScore: h, awayScore: a },
    });
  }

  const count = await prisma.prediction.count({
    where: { playerId, matchId: { in: [...validGroupIds] } },
  });
  return NextResponse.json({ ok: true, savedCount: count });
}
