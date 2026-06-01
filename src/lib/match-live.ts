/** Chat opens this many minutes before kickoff. */
export const CHAT_OPENS_BEFORE_MINUTES = 15;

/**
 * Chat stays open this long after scheduled kickoff (covers ~90 min match + extra time).
 * Was 120 min (2 h); extended by 1 h for stoppage / extra time.
 */
export const CHAT_CLOSES_AFTER_KICKOFF_MINUTES = 180;

export function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${minutes} minutes`;
}

/** Shared copy for UI — keep in sync with constants above. */
export function describeChatWindow() {
  const opensBefore = formatMinutesLabel(CHAT_OPENS_BEFORE_MINUTES);
  const closesAfter = formatMinutesLabel(CHAT_CLOSES_AFTER_KICKOFF_MINUTES);
  return {
    opensBeforeMinutes: CHAT_OPENS_BEFORE_MINUTES,
    closesAfterKickoffMinutes: CHAT_CLOSES_AFTER_KICKOFF_MINUTES,
    opensBeforeLabel: opensBefore,
    closesAfterLabel: closesAfter,
    short:
      `opens ${opensBefore} before kickoff, until ${closesAfter} after kickoff (extra time included)`,
    livePage:
      `Chat opens ${opensBefore} before kickoff and stays open until ${closesAfter} after kickoff (including extra time).`,
    closedNotice:
      `Chat is closed (${opensBefore} before kickoff until ${closesAfter} after, including extra time).`,
    apiError:
      `Live chat is closed. It opens ${opensBefore} before kickoff and closes ${closesAfter} after kickoff (including extra time).`,
  };
}

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
