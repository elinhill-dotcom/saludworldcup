import { NextResponse } from "next/server";
import { getPredictionLockAt, predictionsLocked } from "@/lib/config";
import {
  JAR_CONTRIBUTION_EUR,
  POINTS_EXACT,
  POINTS_OUTCOME,
} from "@/lib/matches-data";
import { KNOCKOUT_POINTS } from "@/lib/knockout-scoring";

export async function GET() {
  return NextResponse.json({
    locked: predictionsLocked(),
    lockAt: getPredictionLockAt().toISOString(),
    jarContributionEur: JAR_CONTRIBUTION_EUR,
    pointsExact: POINTS_EXACT,
    pointsOutcome: POINTS_OUTCOME,
    knockoutPoints: KNOCKOUT_POINTS,
  });
}
