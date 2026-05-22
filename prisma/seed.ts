import { PrismaClient } from "@prisma/client";
import { isFeaturedMatch } from "../src/lib/teams";
import { toEnglishTeam } from "../src/lib/team-names";
import {
  kickoffIso,
  MATCHES,
} from "../src/lib/matches-data";

const prisma = new PrismaClient();

async function main() {
  for (const m of MATCHES) {
    const homeTeam = toEnglishTeam(m.homeTeam);
    const awayTeam = toEnglishTeam(m.awayTeam);
    await prisma.match.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        matchNumber: m.matchNumber ?? null,
        dayLabel: m.dayLabel,
        kickoffAt: new Date(kickoffIso(m.date, m.time)),
        homeTeam,
        awayTeam,
        groupCode: m.groupCode ?? null,
        stage: m.stage,
        broadcaster: m.broadcaster ?? null,
        featured: isFeaturedMatch(homeTeam, awayTeam),
      },
      update: {
        matchNumber: m.matchNumber ?? null,
        dayLabel: m.dayLabel,
        kickoffAt: new Date(kickoffIso(m.date, m.time)),
        homeTeam,
        awayTeam,
        groupCode: m.groupCode ?? null,
        stage: m.stage,
        broadcaster: m.broadcaster ?? null,
        featured: isFeaturedMatch(homeTeam, awayTeam),
      },
    });
  }

  await prisma.knockoutAnswer.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  console.log(`Seeded ${MATCHES.length} matches.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
