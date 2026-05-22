import { NextResponse } from "next/server";
import { isMatchLive } from "@/lib/match-live";
import { prisma } from "@/lib/db";

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
  });

  const live = matches
    .filter((m) => isMatchLive(m.kickoffAt))
    .map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      kickoffAt: m.kickoffAt.toISOString(),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      finished: m.finished,
      groupCode: m.groupCode,
      stage: m.stage,
    }));

  return NextResponse.json({ live, count: live.length });
}
