import { POINTS_EXACT, POINTS_OUTCOME } from "./matches-data";

export type Outcome = "home" | "away" | "draw";

export function getOutcome(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function pointsForPrediction(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): number {
  if (predHome === actualHome && predAway === actualAway) {
    return POINTS_EXACT;
  }
  if (
    getOutcome(predHome, predAway) === getOutcome(actualHome, actualAway)
  ) {
    return POINTS_OUTCOME;
  }
  return 0;
}
