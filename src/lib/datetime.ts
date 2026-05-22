const CEST = "Europe/Stockholm";

/** en-GB date/time in CEST without timezone labels (no "Stockholm", etc.). */
export function formatCestDateTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CEST,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");

  return `${get("day")} ${get("month")} ${get("year")} at ${hour}:${minute}`;
}

export function formatCestMatchKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CEST,
  });
}
