/**
 * Seed matches into Supabase. Requires:
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Run: npx tsx scripts/seed-supabase.ts
 */
import { createClient } from "@supabase/supabase-js";
import { isFeaturedMatch } from "../src/lib/teams";
import { toEnglishTeam } from "../src/lib/team-names";
import { kickoffIso, MATCHES } from "../src/lib/matches-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const existing = await supabase
    .from("matches")
    .select("id, home_score, away_score, finished");

  if (existing.error) {
    console.error("Failed to read existing matches:", existing.error.message);
    process.exit(1);
  }

  const existingById = new Map<
    number,
    { home_score: number | null; away_score: number | null; finished: boolean }
  >(
    (existing.data ?? []).map((r) => [
      r.id as number,
      {
        home_score: (r.home_score as number | null) ?? null,
        away_score: (r.away_score as number | null) ?? null,
        finished: !!r.finished,
      },
    ]),
  );

  const rows = MATCHES.map((m) => {
    const homeTeam = toEnglishTeam(m.homeTeam);
    const awayTeam = toEnglishTeam(m.awayTeam);
    const prev = existingById.get(m.id);
    const keepResult =
      !!prev &&
      (prev.finished || prev.home_score !== null || prev.away_score !== null);
    return {
      id: m.id,
      match_number: m.matchNumber ?? null,
      day_label: m.dayLabel,
      kickoff_at: kickoffIso(m.date, m.time),
      home_team: homeTeam,
      away_team: awayTeam,
      group_code: m.groupCode ?? null,
      stage: m.stage,
      broadcaster: m.broadcaster ?? null,
      featured: isFeaturedMatch(homeTeam, awayTeam),
      home_score: keepResult ? prev.home_score : null,
      away_score: keepResult ? prev.away_score : null,
      finished: keepResult ? prev.finished : false,
    };
  });

  const { error } = await supabase.from("matches").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Match seed failed:", error.message);
    process.exit(1);
  }

  const { error: koErr } = await supabase
    .from("knockout_answer")
    .upsert({ id: 1, set: false }, { onConflict: "id" });

  if (koErr) {
    console.error("Knockout answer seed failed:", koErr.message);
    process.exit(1);
  }

  const { error: settingsErr } = await supabase
    .from("pool_settings")
    .upsert({ id: 1, picks_unlock_override: false }, { onConflict: "id" });

  if (settingsErr) {
    console.error("Pool settings seed failed:", settingsErr.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} matches into Supabase.`);
}

main();
