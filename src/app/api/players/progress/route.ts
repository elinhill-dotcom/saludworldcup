import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const [groupPicksCount, knockoutPick] = await Promise.all([
    prisma.prediction.count({
      where: { playerId, matchId: { in: [...GROUP_MATCH_IDS] } },
    }),
    prisma.knockoutPick.findUnique({ where: { playerId } }),
  ]);

  let knockoutFilled = 0;
  if (knockoutPick) {
    const fields = [
      knockoutPick.sf1Home,
      knockoutPick.sf1Away,
      knockoutPick.sf2Home,
      knockoutPick.sf2Away,
      knockoutPick.finalHome,
      knockoutPick.finalAway,
      knockoutPick.bronzeHome,
      knockoutPick.bronzeAway,
      knockoutPick.champion,
    ];
    knockoutFilled = fields.filter(Boolean).length;
  }

  return NextResponse.json({
    groupPicksCount,
    groupTotal: GROUP_MATCH_IDS.length,
    knockoutFilled,
    knockoutTotal: 9,
  });
}
