import { NextResponse } from "next/server";
import { getPredictionLockAt, predictionsLockedByTime } from "@/lib/config";
import { describeChatWindow } from "@/lib/match-live";
import {
  JAR_CONTRIBUTION_EUR,
  POINTS_EXACT,
  POINTS_OUTCOME,
} from "@/lib/matches-data";
import { KNOCKOUT_POINTS } from "@/lib/knockout-scoring";
import { getPicksUnlockOverride } from "@/lib/pool-settings";
import { arePredictionsLocked } from "@/lib/predictions-lock";

export async function GET() {
  const chat = describeChatWindow();
  const deadlinePassed = predictionsLockedByTime();
  const overrideRes = await getPicksUnlockOverride();
  const picksReopened = deadlinePassed && (overrideRes.data ?? false);
  const locked = await arePredictionsLocked();

  return NextResponse.json({
    locked,
    poolSealed: deadlinePassed,
    picksReopened,
    lockAt: getPredictionLockAt().toISOString(),
    jarContributionEur: JAR_CONTRIBUTION_EUR,
    pointsExact: POINTS_EXACT,
    pointsOutcome: POINTS_OUTCOME,
    knockoutPoints: KNOCKOUT_POINTS,
    chatOpensBeforeMinutes: chat.opensBeforeMinutes,
    chatClosesAfterKickoffMinutes: chat.closesAfterKickoffMinutes,
    chatScheduleShort: chat.short,
    chatScheduleLivePage: chat.livePage,
  });
}
