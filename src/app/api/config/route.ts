import { NextRequest, NextResponse } from "next/server";
import { getPredictionLockAt, predictionsLockedByTime } from "@/lib/config";
import { describeChatWindow } from "@/lib/match-live";
import {
  JAR_CONTRIBUTION_EUR,
  POINTS_EXACT,
  POINTS_OUTCOME,
} from "@/lib/matches-data";
import { KNOCKOUT_POINTS } from "@/lib/knockout-scoring";
import { getPicksUnlockOverride } from "@/lib/pool-settings";
import {
  arePredictionsLocked,
  isPlayerPicksReopened,
} from "@/lib/predictions-lock";

export async function GET(req: NextRequest) {
  const chat = describeChatWindow();
  const deadlinePassed = predictionsLockedByTime();
  const playerId = req.nextUrl.searchParams.get("playerId");

  const globalOverrideRes = await getPicksUnlockOverride();
  const globalReopened = deadlinePassed && (globalOverrideRes.data ?? false);

  let locked: boolean;
  let picksReopened: boolean;

  if (playerId) {
    locked = await arePredictionsLocked(playerId);
    picksReopened = await isPlayerPicksReopened(playerId);
  } else {
    locked = await arePredictionsLocked();
    picksReopened = globalReopened;
  }

  return NextResponse.json({
    locked,
    poolSealed: deadlinePassed,
    picksReopened,
    globalPicksReopened: globalReopened,
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
