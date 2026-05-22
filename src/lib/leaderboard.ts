import { prisma } from "./db";
import { scoreKnockoutPick } from "./knockout-scoring";
import { pointsForPrediction } from "./scoring";

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  points: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  groupPicksCount: number;
};

export async function computeLeaderboard(): Promise<LeaderboardEntry[]> {
  const [players, knockoutAnswer] = await Promise.all([
    prisma.player.findMany({
      include: {
        predictions: { include: { match: true } },
        knockoutPick: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.knockoutAnswer.findUnique({ where: { id: 1 } }),
  ]);

  const answer = knockoutAnswer?.set ? knockoutAnswer : null;

  const entries: LeaderboardEntry[] = players.map((p) => {
    let groupPoints = 0;
    let exactHits = 0;
    let outcomeHits = 0;

    for (const pred of p.predictions) {
      const m = pred.match;
      if (m.stage !== "group") continue;
      if (!m.finished || m.homeScore === null || m.awayScore === null) {
        continue;
      }
      const pts = pointsForPrediction(
        pred.homeScore,
        pred.awayScore,
        m.homeScore,
        m.awayScore,
      );
      groupPoints += pts;
      if (pts === 3) exactHits += 1;
      else if (pts === 1) outcomeHits += 1;
    }

    let knockoutPoints = 0;
    if (answer && p.knockoutPick) {
      knockoutPoints = scoreKnockoutPick(p.knockoutPick, answer);
    }

    const groupPicksCount = p.predictions.filter(
      (pr) => pr.match.stage === "group",
    ).length;

    return {
      playerId: p.id,
      name: p.name,
      points: groupPoints + knockoutPoints,
      groupPoints,
      knockoutPoints,
      exactHits,
      outcomeHits,
      groupPicksCount,
    };
  });

  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return a.name.localeCompare(b.name, "en");
  });

  return entries;
}
