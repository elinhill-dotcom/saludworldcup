export function getPredictionLockAt(): Date {
  const raw =
    process.env.PREDICTION_LOCK_AT ?? "2026-06-11T20:00:00+02:00";
  return new Date(raw);
}

export function predictionsLocked(now = new Date()): boolean {
  return now >= getPredictionLockAt();
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
