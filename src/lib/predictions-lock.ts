import { predictionsLockedByTime } from "@/lib/config";
import {
  getPicksUnlockOverride,
  getPlayerPicksUnlockOverride,
} from "@/lib/pool-settings";

/** True when a player cannot save or edit picks. */
export async function arePredictionsLocked(
  playerId?: string,
): Promise<boolean> {
  if (!predictionsLockedByTime()) return false;

  const globalRes = await getPicksUnlockOverride();
  if (globalRes.error) return true;
  if (globalRes.data) return false;

  if (playerId) {
    const playerRes = await getPlayerPicksUnlockOverride(playerId);
    if (playerRes.error) return true;
    if (playerRes.data) return false;
  }

  return true;
}

/** True once the deadline has passed (stats/scoreboard stay open regardless of admin reopen). */
export function isPoolSealed(now = new Date()): boolean {
  return predictionsLockedByTime(now);
}

/** True when this player may edit picks after the deadline (global or individual reopen). */
export async function isPlayerPicksReopened(
  playerId: string,
): Promise<boolean> {
  if (!predictionsLockedByTime()) return false;
  return !(await arePredictionsLocked(playerId));
}
