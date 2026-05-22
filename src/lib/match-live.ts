/** Chat opens this many minutes before kickoff. */
export const CHAT_OPENS_BEFORE_MINUTES = 15;

/** Chat closes this many minutes after kickoff. */
export const CHAT_CLOSES_AFTER_KICKOFF_MINUTES = 120;

export function getChatWindow(kickoffAt: Date | string) {
  const kickoff = new Date(kickoffAt).getTime();
  const opensAt = kickoff - CHAT_OPENS_BEFORE_MINUTES * 60 * 1000;
  const closesAt = kickoff + CHAT_CLOSES_AFTER_KICKOFF_MINUTES * 60 * 1000;
  return { opensAt, closesAt, kickoff };
}

export function isMatchLive(
  kickoffAt: Date | string,
  now = new Date(),
): boolean {
  const { opensAt, closesAt } = getChatWindow(kickoffAt);
  const t = now.getTime();
  return t >= opensAt && t < closesAt;
}

/** Minutes until chat opens (0 if already open or past). */
export function minutesUntilChatOpens(
  kickoffAt: Date | string,
  now = new Date(),
): number {
  const { opensAt } = getChatWindow(kickoffAt);
  return Math.max(0, Math.ceil((opensAt - now.getTime()) / 60000));
}
