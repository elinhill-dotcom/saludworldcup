import { predictionsLockedByTime } from "@/lib/config";
import { getPicksUnlockOverride } from "@/lib/pool-settings";

/** True when players cannot save or edit picks. */
export async function arePredictionsLocked(): Promise<boolean> {
  if (!predictionsLockedByTime()) return false;
  const overrideRes = await getPicksUnlockOverride();
  if (overrideRes.error) {
    // Fail closed — keep locked if settings cannot be read.
    return true;
  }
  return !overrideRes.data;
}

/** True once the deadline has passed (stats/scoreboard stay open regardless of admin reopen). */
export function isPoolSealed(now = new Date()): boolean {
  return predictionsLockedByTime(now);
}
