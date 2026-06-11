export function getPredictionLockAt(): Date {
  const raw =
    process.env.PREDICTION_LOCK_AT ?? "2026-06-11T20:00:00+02:00";
  return new Date(raw);
}

/** Deadline passed — used for stats visibility and chat rules. */
export function predictionsLockedByTime(now = new Date()): boolean {
  return now >= getPredictionLockAt();
}

/** @deprecated Use arePredictionsLocked() for pick editing; this ignores admin reopen. */
export function predictionsLocked(now = new Date()): boolean {
  return predictionsLockedByTime(now);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
