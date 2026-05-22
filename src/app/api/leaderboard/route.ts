import { NextResponse } from "next/server";
import { computeLeaderboard } from "@/lib/leaderboard";
import { JAR_CONTRIBUTION_EUR } from "@/lib/matches-data";

export async function GET() {
  const entries = await computeLeaderboard();
  const playerCount = entries.length;
  const jarTotalEur = playerCount * JAR_CONTRIBUTION_EUR;

  return NextResponse.json({
    entries,
    playerCount,
    jarTotalEur,
    jarContributionEur: JAR_CONTRIBUTION_EUR,
  });
}
