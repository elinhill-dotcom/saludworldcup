import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/config";
import { prisma } from "@/lib/db";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";

const validGroupIds = new Set(GROUP_MATCH_IDS);

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password") ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
  }

  const body = await req.json();
  const matchId = Number(body.matchId);
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  const finished = body.finished !== false;

  if (
    !validGroupIds.has(matchId) ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, finished },
  });

  return NextResponse.json({ match });
}
